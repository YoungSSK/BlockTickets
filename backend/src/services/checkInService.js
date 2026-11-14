import crypto from "crypto";
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

// 1. Kiểm tra tính hợp lệ của mã QR soát vé
export const verifyTicketQR = async ({ qrData, eventId }, user) => {
  let parsedPayload = null;

  try {
    if (typeof qrData === "object" && qrData !== null) {
      parsedPayload = qrData;
    } else {
      parsedPayload = JSON.parse(qrData);
    }
  } catch {
    // Nếu payload là dạng chuỗi plain ticketId hoặc tokenId
    const numericId = Number(qrData);
    if (!isNaN(numericId)) {
      parsedPayload = { ticketId: numericId, tokenId: numericId };
    } else {
      return {
        valid: false,
        status: "invalid_signature",
        message: "Mã QR có định dạng không hợp lệ.",
      };
    }
  }

  const { ticketId, tokenId, validUntil, hmac, nonce } = parsedPayload;

  // Kiểm tra thời hạn mã QR động (nếu có validUntil)
  if (validUntil && Date.now() > Number(validUntil)) {
    return {
      valid: false,
      status: "expired",
      message: "Mã QR đã hết hạn (quá thời hạn xoay vòng), vui lòng quét mã mới.",
    };
  }

  // Tra cứu vé NFT trong Database
  const where = {};
  if (ticketId) where.id = ticketId;
  else if (tokenId) where.tokenId = tokenId;
  else {
    return {
      valid: false,
      status: "invalid_ticket",
      message: "Mã QR không chứa thông tin định danh vé.",
    };
  }

  const ticket = await Ticket.findOne({
    where,
    include: [
      {
        model: Event,
        as: "event",
        attributes: ["id", "title", "bannerUrl", "venueName", "startTime", "endTime"],
      },
      {
        model: TicketType,
        as: "ticketType",
        attributes: ["id", "name", "originalPrice", "currency"],
      },
    ],
  });

  if (!ticket) {
    return {
      valid: false,
      status: "invalid_ticket",
      message: "Không tìm thấy vé trong hệ thống.",
    };
  }

  // Kiểm tra vé có đúng sự kiện hay không
  if (eventId && Number(eventId) !== ticket.eventId) {
    return {
      valid: false,
      status: "wrong_event",
      message: `Vé này thuộc sự kiện "${ticket.event?.title || 'khác'}", không phải sự kiện đang soát.`,
      ticket,
    };
  }

  // Kiểm tra vé đã qua sử dụng chưa
  if (ticket.isUsed) {
    return {
      valid: false,
      status: "already_used",
      message: `Vé này đã được soát check-in trước đó vào lúc ${new Date(ticket.usedAt).toLocaleString('vi-VN')}.`,
      ticket,
    };
  }

  return {
    valid: true,
    status: "ready_for_checkin",
    message: "Vé hợp lệ, sẵn sàng check-in!",
    ticket,
    event: ticket.event,
    ticketType: ticket.ticketType,
    qrNonce: nonce || hmac || "valid-qr",
  };
};

// 2. Xác nhận check-in vé thành công
export const confirmCheckIn = async (
  { ticketId, eventId, qrNonce },
  user,
) => {
  return sequelize.transaction(async (t) => {
    const ticket = await Ticket.findByPk(ticketId, {
      include: [
        { model: Event, as: "event" },
        { model: TicketType, as: "ticketType" },
      ],
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    if (!ticket) throw new AppError("Không tìm thấy vé.", 404);

    if (ticket.isUsed) {
      throw new AppError(
        `Vé này đã check-in trước đó vào lúc ${new Date(ticket.usedAt).toLocaleString("vi-VN")}.`,
        409,
      );
    }

    const now = new Date();
    ticket.isUsed = true;
    ticket.usedAt = now;
    await ticket.save({ transaction: t });

    // Ghi nhận nhật ký soát vé CheckInLog
    const checkInLog = await CheckInLog.create(
      {
        tokenId: ticket.tokenId,
        eventId: ticket.eventId,
        scannedBy: user?.id || 1,
        status: "success",
        qrNonce: qrNonce || "scanner-confirmed",
        scannedAt: now,
      },
      { transaction: t },
    );

    return { ticket, checkInLog };
  });
};

// 3. Thống kê tiến độ soát vé sự kiện thời gian thực
export const getCheckInStats = async (eventId, user) => {
  const parsedEventId = Number(eventId);

  const [totalTickets, checkedInCount, recentLogs] = await Promise.all([
    Ticket.count({ where: { eventId: parsedEventId } }),
    Ticket.count({ where: { eventId: parsedEventId, isUsed: true } }),
    CheckInLog.findAll({
      where: { eventId: parsedEventId },
      order: [["scannedAt", "DESC"]],
      limit: 20,
    }),
  ]);

  const checkInRate = totalTickets > 0 ? +((checkedInCount / totalTickets) * 100).toFixed(1) : 0;

  return {
    eventId: parsedEventId,
    totalTickets,
    checkedInCount,
    remainingCount: Math.max(0, totalTickets - checkedInCount),
    checkInRate,
    recentLogs,
  };
};

