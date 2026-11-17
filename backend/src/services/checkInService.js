import crypto from "crypto";
import { Op } from "sequelize";
import {
  sequelize,
  Ticket,
  TicketType,
  Event,
  User,
  CheckInLog,
} from "../models/index.js";
import { AppError } from "../utils/AppError.js";

const QR_SECRET =
  process.env.JWT_ACCESS_SECRET || "blocktickets-dynamic-qr-secret";

/**
 * 1. Kiểm tra tính hợp lệ của vé bằng hình thức Quét mã QR hoặc Nhập Token ID
 * Hỗ trợ:
 * - qrData dạng chuỗi JSON mã QR động { tokenId, owner, nonce, timestamp } hoặc HMAC { ticketId, tokenId, validUntil, hmac }
 * - qrData hoặc tokenId dạng số/chuỗi Token ID on-chain (ví dụ "10", "#10", "TOKEN-10", hoặc 10)
 * - Đối chiếu cổng vào chỉ định (entryGate) với cổng nhân viên đang đứng trực (gate)
 * - Trả về số ghế (seatNumber) độc lập hoàn toàn với tokenId on-chain
 */
export const verifyTicketQR = async (
  { qrData, tokenId: inputTokenId, ticketId: inputTicketId, eventId, gate: currentStaffGate },
  user
) => {
  let parsedPayload = null;

  // Ưu tiên 1: inputTokenId truyền trực tiếp từ form nhập Token ID
  if (inputTokenId !== undefined && inputTokenId !== null && String(inputTokenId).trim() !== "") {
    const cleanNum = String(inputTokenId).trim().replace(/^[#\s]+|[^\d]/g, "");
    if (cleanNum.length > 0) {
      parsedPayload = { tokenId: Number(cleanNum) };
    }
  }

  // Ưu tiên 2: inputTicketId truyền trực tiếp
  if (!parsedPayload && inputTicketId !== undefined && inputTicketId !== null && String(inputTicketId).trim() !== "") {
    const cleanNum = String(inputTicketId).trim().replace(/^[#\s]+|[^\d]/g, "");
    if (cleanNum.length > 0) {
      parsedPayload = { ticketId: Number(cleanNum) };
    }
  }

  // Ưu tiên 3: qrData từ máy quét hoặc chuỗi nhập
  if (!parsedPayload && qrData !== undefined && qrData !== null) {
    if (typeof qrData === "object" && qrData !== null) {
      parsedPayload = qrData;
    } else if (typeof qrData === "number") {
      parsedPayload = { tokenId: qrData };
    } else if (typeof qrData === "string") {
      const trimmed = qrData.trim();
      try {
        parsedPayload = JSON.parse(trimmed);
      } catch {
        // Chuỗi plain text, có thể là Token ID ví dụ "10", "#10", "TOKEN-10"
        const cleanNum = trimmed.replace(/^[#\s]+|[^\d]/g, "");
        if (cleanNum.length > 0) {
          parsedPayload = { tokenId: Number(cleanNum) };
        } else {
          return {
            valid: false,
            status: "invalid_signature",
            message: "Mã QR hoặc Token ID có định dạng không hợp lệ.",
          };
        }
      }
    }
  }

  if (!parsedPayload) {
    return {
      valid: false,
      status: "invalid_ticket",
      message: "Không nhận diện được thông tin mã QR hoặc Token ID vé.",
    };
  }

  const { ticketId, tokenId, validUntil, hmac, nonce } = parsedPayload;

  // Kiểm tra thời hạn mã QR xoay vòng (nếu payload có validUntil)
  if (validUntil && Date.now() > Number(validUntil)) {
    return {
      valid: false,
      status: "expired",
      message: "Mã QR đã hết hạn (quá thời hạn xoay vòng), vui lòng quét mã mới.",
    };
  }

  // Tra cứu vé NFT trong Database: Ưu tiên tokenId on-chain, sau đó đến ticketId nội bộ
  const targetTokenId = tokenId !== undefined && tokenId !== null && !isNaN(Number(tokenId)) ? Number(tokenId) : null;
  const targetTicketId = ticketId !== undefined && ticketId !== null && !isNaN(Number(ticketId)) ? Number(ticketId) : null;

  const where = {};
  if (targetTokenId !== null) {
    where.tokenId = targetTokenId;
  } else if (targetTicketId !== null) {
    where.id = targetTicketId;
  } else {
    return {
      valid: false,
      status: "invalid_ticket",
      message: "Không tìm thấy thông tin định danh Token ID của vé.",
    };
  }

  const ticket = await Ticket.findOne({
    where,
    include: [
      {
        model: Event,
        as: "event",
        attributes: ["id", "title", "bannerUrl", "venueName", "startTime", "endTime", "status"],
      },
      {
        model: TicketType,
        as: "ticketType",
        attributes: ["id", "name", "originalPrice", "currency", "entryGate"],
      },
    ],
  });

  if (!ticket) {
    return {
      valid: false,
      status: "invalid_ticket",
      message: `Không tìm thấy vé NFT Token #${targetTokenId ?? targetTicketId} trong hệ thống.`,
    };
  }

  // Kiểm tra nếu sự kiện đã bị hủy bỏ
  if (ticket.event?.status === "cancelled") {
    return {
      valid: false,
      status: "invalid_ticket",
      message: "Sự kiện này đã bị hủy bỏ, vé không còn hiệu lực để vào cổng.",
      ticket,
    };
  }

  // Kiểm tra vé có đúng sự kiện đang soát hay không
  if (eventId && Number(eventId) !== ticket.eventId) {
    return {
      valid: false,
      status: "wrong_event",
      message: `Vé này thuộc sự kiện "${ticket.event?.title || 'khác'}", không khớp với sự kiện đang soát vé.`,
      ticket,
    };
  }

  // Kiểm tra vé đã qua sử dụng chưa
  if (ticket.isUsed) {
    return {
      valid: false,
      status: "already_used",
      message: `Vé Token #${ticket.tokenId} ĐÃ ĐƯỢC CHECK-IN vào lúc ${new Date(ticket.usedAt).toLocaleString('vi-VN')}. Nghi vấn quét trùng lặp!`,
      ticket,
    };
  }

  // Truy vấn thông tin chủ sở hữu (User) theo địa chỉ ví on-chain
  let ownerUser = null;
  if (ticket.ownerWallet) {
    ownerUser = await User.findOne({
      where: sequelize.where(
        sequelize.fn("LOWER", sequelize.col("wallet_address")),
        ticket.ownerWallet.toLowerCase()
      ),
      attributes: ["id", "fullName", "email", "walletAddress"],
    });
  }

  const attendeeName = ownerUser?.fullName || ownerUser?.email || `Khách ví ${ticket.ownerWallet.slice(0, 6)}...${ticket.ownerWallet.slice(-4)}`;
  const assignedGate = ticket.entryGate || ticket.ticketType?.entryGate || "Cổng A - Khán Đài Phổ Thông Tầng 1";
  const seatNumber = ticket.seatNumber || `Khu ${ticket.ticketType?.name || 'A'} - Ghế ${ticket.id}`;

  // Kiểm tra đối chiếu cổng chỉ định trên vé với cổng nhân viên đang trực
  let gateMismatch = false;
  if (currentStaffGate && assignedGate) {
    const sLower = currentStaffGate.toLowerCase();
    const aLower = assignedGate.toLowerCase();
    if (
      (aLower.includes("vip") && !sLower.includes("vip")) ||
      (!aLower.includes("vip") && sLower.includes("vip")) ||
      (aLower.includes("cổng a") && sLower.includes("cổng b")) ||
      (aLower.includes("cổng b") && sLower.includes("cổng a"))
    ) {
      gateMismatch = true;
    }
  }

  return {
    valid: true,
    status: gateMismatch ? "wrong_gate_warning" : "ready_for_checkin",
    gateMismatch,
    assignedGate,
    scannedGate: currentStaffGate || assignedGate,
    seatNumber,
    message: gateMismatch
      ? `⚠️ Lưu ý cổng vào: Vé chỉ định tại "${assignedGate}", hiện khách đang vào tại "${currentStaffGate}".`
      : "Vé hợp lệ, sẵn sàng cho phép vào cổng!",
    ticket: {
      ...ticket.toJSON(),
      seatNumber,
      entryGate: assignedGate,
      attendeeName,
      owner: ownerUser
        ? {
            fullName: ownerUser.fullName,
            email: ownerUser.email,
            walletAddress: ownerUser.walletAddress,
          }
        : {
            fullName: attendeeName,
            walletAddress: ticket.ownerWallet,
          },
    },
    event: ticket.event,
    ticketType: ticket.ticketType,
    qrNonce: nonce || hmac || `token-${ticket.tokenId}`,
  };
};

/**
 * 2. Xác nhận check-in vé thành công (Đổi trạng thái isUsed = true, ghi CheckInLog kèm Gate)
 */
export const confirmCheckIn = async (
  { ticketId, tokenId, eventId, qrNonce, gate, staffNote },
  user
) => {
  return sequelize.transaction(async (t) => {
    const where = {};
    if (ticketId) where.id = ticketId;
    else if (tokenId) where.tokenId = tokenId;
    else throw new AppError("Thiếu thông tin vé để check-in.", 400);

    const ticket = await Ticket.findOne({
      where,
      include: [
        { model: Event, as: "event" },
        { model: TicketType, as: "ticketType" },
      ],
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    if (!ticket) throw new AppError("Không tìm thấy vé trong hệ thống.", 404);

    if (ticket.isUsed) {
      throw new AppError(
        `Vé này đã check-in trước đó vào lúc ${new Date(ticket.usedAt).toLocaleString("vi-VN")}.`,
        409
      );
    }

    const now = new Date();
    ticket.isUsed = true;
    ticket.usedAt = now;
    await ticket.save({ transaction: t });

    // Ghi nhận nhật ký soát vé CheckInLog kèm thông tin Cổng đã check-in
    const checkInLog = await CheckInLog.create(
      {
        tokenId: ticket.tokenId,
        eventId: ticket.eventId,
        scannedBy: user?.id || 1,
        status: "success",
        gate: gate || ticket.entryGate || "Cổng A",
        qrNonce: qrNonce || `confirmed-token-${ticket.tokenId}`,
        scannedAt: now,
      },
      { transaction: t }
    );

    // Lấy thông tin chủ sở hữu
    let ownerUser = null;
    if (ticket.ownerWallet) {
      ownerUser = await User.findOne({
        where: sequelize.where(
          sequelize.fn("LOWER", sequelize.col("wallet_address")),
          ticket.ownerWallet.toLowerCase()
        ),
        attributes: ["id", "fullName", "email", "walletAddress"],
        transaction: t,
      });
    }

    const attendeeName = ownerUser?.fullName || ownerUser?.email || `Khách ví ${ticket.ownerWallet.slice(0, 6)}...${ticket.ownerWallet.slice(-4)}`;
    const seatNumber = ticket.seatNumber || `Ghế #${ticket.id}`;
    const entryGate = ticket.entryGate || ticket.ticketType?.entryGate || gate || "Cổng A";

    return {
      ticket: {
        ...ticket.toJSON(),
        seatNumber,
        entryGate,
        attendeeName,
        owner: ownerUser
          ? {
              fullName: ownerUser.fullName,
              email: ownerUser.email,
              walletAddress: ownerUser.walletAddress,
            }
          : {
              fullName: attendeeName,
              walletAddress: ticket.ownerWallet,
            },
      },
      checkInLog,
    };
  });
};

/**
 * 3. Thống kê tiến độ soát vé sự kiện thời gian thực & danh sách vé mẫu
 */
export const getCheckInStats = async (eventId, user) => {
  const parsedEventId = Number(eventId);

  const [totalTickets, checkedInCount, recentLogs, sampleTickets, tierGates, ticketGates] = await Promise.all([
    Ticket.count({ where: { eventId: parsedEventId } }),
    Ticket.count({ where: { eventId: parsedEventId, isUsed: true } }),
    CheckInLog.findAll({
      where: { eventId: parsedEventId },
      order: [["scannedAt", "DESC"]],
      limit: 20,
    }),
    Ticket.findAll({
      where: { eventId: parsedEventId },
      attributes: ["id", "tokenId", "isUsed", "seatNumber", "entryGate"],
      order: [["tokenId", "ASC"]],
      limit: 15,
    }),
    TicketType.findAll({
      where: { eventId: parsedEventId },
      attributes: ["entryGate"],
      raw: true,
    }),
    Ticket.findAll({
      where: { eventId: parsedEventId },
      attributes: ["entryGate"],
      group: ["entryGate"],
      raw: true,
    }),
  ]);

  const gateSet = new Set();
  tierGates.forEach((t) => t.entryGate && gateSet.add(t.entryGate.trim()));
  ticketGates.forEach((t) => t.entryGate && gateSet.add(t.entryGate.trim()));
  const availableGates = Array.from(gateSet).filter(Boolean);

  const checkInRate = totalTickets > 0 ? +((checkedInCount / totalTickets) * 100).toFixed(1) : 0;

  return {
    eventId: parsedEventId,
    totalTickets,
    checkedInCount,
    usedCount: checkedInCount,
    remainingCount: Math.max(0, totalTickets - checkedInCount),
    checkInRate,
    recentLogs,
    sampleTickets,
    availableGates,
  };
};
