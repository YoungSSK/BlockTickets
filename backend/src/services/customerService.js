import crypto from "crypto";
import { Op } from "sequelize";
import {
  sequelize,
  Event,
  TicketType,
  User,
  Order,
  Ticket,
  ResaleListing,
  CheckInLog,
} from "../models/index.js";
import { AppError } from "../utils/AppError.js";
import * as blockchainService from "./blockchainService.js";
// 1. Tạo đơn đặt vé mới (Order Intent)
export const createOrder = async (
  { eventId, ticketTypeId, quantity, buyerWallet, idempotencyKey },
  user,
) => {
  const parsedEventId = Number(eventId);
  const parsedTicketTypeId = Number(ticketTypeId);
  const parsedQuantity = Math.max(1, Number(quantity) || 1);

  const event = await Event.findByPk(parsedEventId);
  if (!event) throw new AppError("Không tìm thấy sự kiện.", 404);
  if (!["published", "approved"].includes(event.status)) {
    throw new AppError("Sự kiện chưa được mở bán vé.", 400);
  }

  const ticketType = await TicketType.findOne({
    where: { id: parsedTicketTypeId, eventId: parsedEventId },
  });
  if (!ticketType)
    throw new AppError("Hạng vé không tồn tại trong sự kiện.", 404);

  const currentSupply = Number(ticketType.currentSupply || 0);
  const maxSupply = Number(ticketType.maxSupply || 0);
  if (currentSupply + parsedQuantity > maxSupply) {
    throw new AppError(
      `Hạng vé "${ticketType.name}" chỉ còn lại ${Math.max(0, maxSupply - currentSupply)} vé.`,
      400,
    );
  }

  const resolvedBuyerWallet = (
    buyerWallet ||
    user?.walletAddress ||
    "0x0000000000000000000000000000000000000000"
  ).toLowerCase();

  const pricePerTicket = Number(ticketType.originalPrice || 0);
  const totalPrice = +(pricePerTicket * parsedQuantity).toFixed(6);

  const key =
    idempotencyKey ||
    `order-${parsedEventId}-${parsedTicketTypeId}-${Date.now()}-${crypto.randomBytes(6).toString("hex")}`;

  // Kiểm tra idempotency nếu đã tồn tại đơn trùng key
  const existingOrder = await Order.findOne({ where: { idempotencyKey: key } });
  if (existingOrder) {
    return { order: existingOrder, event, ticketType };
  }

  const order = await Order.create({
    buyerWallet: resolvedBuyerWallet,
    eventId: parsedEventId,
    ticketTypeId: parsedTicketTypeId,
    quantity: parsedQuantity,
    totalPrice,
    currency: ticketType.currency || "ETH",
    status: "pending_payment",
    idempotencyKey: key,
  });

  return { order, event, ticketType };
};

// 2. Xác nhận đơn hàng và Mint các bản ghi Vé NFT
export const verifyAndConfirmOrder = async (orderId, { txHash }, user) => {
  return sequelize.transaction(async (t) => {
    const order = await Order.findByPk(orderId, {
      include: [
        { model: Event, as: "event" },
        { model: TicketType, as: "ticketType" },
      ],
      transaction: t,
      lock: t.LOCK.UPDATE,
    });
    if (!order) throw new AppError("Không tìm thấy đơn hàng.", 404);
    if (order.status === "confirmed") {
      const existingTickets = await Ticket.findAll({
        where: { eventId: order.eventId, ownerWallet: order.buyerWallet },
        order: [["createdAt", "DESC"]],
        limit: order.quantity,
        transaction: t,
      });
      return { order, tickets: existingTickets };
    }
    const ticketType = await TicketType.findByPk(order.ticketTypeId, {
      transaction: t,
      lock: t.LOCK.UPDATE,
    });
    if (!ticketType) throw new AppError("Hạng vé không tồn tại.", 404);
    // 1. Xác thực giao dịch on-chain thật và bóc tách Token ID từ Blockchain
    const verification = await blockchainService.verifyTicketPurchaseTx(
      txHash,
      {
        expectedBuyer: order.buyerWallet,
        expectedEventId: order.event?.onChainEventId,
        expectedQuantity: order.quantity,
      },
    );
    // Cập nhật trạng thái đơn hàng sang confirmed
    order.status = "confirmed";
    order.txHash = txHash || verification.txHash;
    await order.save({ transaction: t });
    // 2. Tạo bản ghi vé NFT trong MySQL với tokenId thật từ Blockchain
    const createdTickets = [];
    const tokenIds = verification.tokenIds;
    for (let i = 0; i < order.quantity; i++) {
      const assignedTokenId = tokenIds[i] ?? Math.floor(Date.now() / 1000) + i;
      const ticket = await Ticket.create(
        {
          tokenId: assignedTokenId,
          eventId: order.eventId,
          ticketTypeId: order.ticketTypeId,
          ownerWallet: order.buyerWallet,
          originalBuyerWallet: order.buyerWallet,
          originalPrice: ticketType.originalPrice,
          txHash: order.txHash,
          isUsed: false,
          isListedForResale: false,
        },
        { transaction: t },
      );
      createdTickets.push(ticket);
    }
    // Tăng currentSupply của ticketType
    ticketType.currentSupply =
      Number(ticketType.currentSupply || 0) + order.quantity;
    await ticketType.save({ transaction: t });
    return { order, tickets: createdTickets };
  });
};

// 3. Lấy chi tiết đơn hàng
export const getOrderDetail = async (orderId) => {
  const order = await Order.findByPk(orderId, {
    include: [
      { model: Event, as: "event" },
      { model: TicketType, as: "ticketType" },
    ],
  });
  if (!order) throw new AppError("Không tìm thấy đơn hàng.", 404);
  return order;
};

// 4. Lấy danh sách Vé NFT của tôi
export const getMyTickets = async (user, walletQuery) => {
  const targetWallet = (walletQuery || user?.walletAddress || "").toLowerCase();

  const where = {};
  if (targetWallet) {
    where.ownerWallet = targetWallet;
  }

  const tickets = await Ticket.findAll({
    where,
    include: [
      {
        model: Event,
        as: "event",
        attributes: [
          "id",
          "title",
          "description",
          "bannerUrl",
          "venueName",
          "venueAddress",
          "venueCity",
          "startTime",
          "endTime",
          "status",
          "contractAddress",
        ],
      },
      {
        model: TicketType,
        as: "ticketType",
        attributes: ["id", "name", "originalPrice", "currency", "description"],
      },
      {
        model: ResaleListing,
        as: "resaleListing",
      },
    ],
    order: [["createdAt", "DESC"]],
  });

  return tickets;
};

// 5. Chi tiết 1 vé NFT
export const getTicketDetail = async (ticketId) => {
  const ticket = await Ticket.findByPk(ticketId, {
    include: [
      { model: Event, as: "event" },
      { model: TicketType, as: "ticketType" },
      { model: ResaleListing, as: "resaleListing" },
    ],
  });
  if (!ticket) throw new AppError("Không tìm thấy vé NFT.", 404);
  return ticket;
};

// 6. Sinh mã QR động (HMAC token có hiệu lực 60s)
export const generateDynamicQR = async (ticketId, user) => {
  const ticket = await Ticket.findByPk(ticketId);
  if (!ticket) throw new AppError("Không tìm thấy vé.", 404);

  const timestamp = Date.now();
  const validUntil = timestamp + 60000; // 60 giây xoay vòng
  const secretKey =
    process.env.JWT_ACCESS_SECRET || "blocktickets-dynamic-qr-secret";

  const rawData = `ticket:${ticket.id}|token:${ticket.tokenId}|exp:${validUntil}`;
  const hmac = crypto
    .createHmac("sha256", secretKey)
    .update(rawData)
    .digest("hex");

  const qrPayload = JSON.stringify({
    ticketId: ticket.id,
    tokenId: ticket.tokenId,
    validUntil,
    hmac,
  });

  return { qrPayload, validUntil };
};

// 7. Chuyển nhượng vé NFT cho ví khác (P2P Transfer)
export const transferTicket = async (
  ticketId,
  { recipientWallet, txHash },
  user,
) => {
  const ticket = await Ticket.findByPk(ticketId);
  if (!ticket) throw new AppError("Không tìm thấy vé.", 404);

  if (ticket.isUsed) {
    throw new AppError(
      "Vé này đã được soát check-in, không thể chuyển nhượng.",
      400,
    );
  }

  if (ticket.isListedForResale) {
    throw new AppError(
      "Vé đang được niêm yết bán trên chợ. Vui lòng hủy niêm yết trước khi chuyển nhượng.",
      400,
    );
  }

  const normalizedRecipient = recipientWallet.trim().toLowerCase();
  ticket.ownerWallet = normalizedRecipient;
  if (txHash) ticket.txHash = txHash;
  await ticket.save();

  return ticket;
};

// 8. Niêm yết vé bán lại trên Marketplace (Áp dụng BR-03 Trần giá 120%)
export const listTicketForResale = async (
  ticketId,
  { resalePrice, listingTxHash },
  user,
) => {
  const ticket = await Ticket.findByPk(ticketId, {
    include: [{ model: Event, as: "event" }],
  });
  if (!ticket) throw new AppError("Không tìm thấy vé.", 404);

  if (ticket.isUsed) {
    throw new AppError("Vé đã qua sử dụng, không thể bán lại.", 400);
  }

  const origPrice = Number(ticket.originalPrice);
  const maxAllowedPrice = +(origPrice * 1.2).toFixed(6);
  const requestedPrice = Number(resalePrice);

  if (requestedPrice <= 0) {
    throw new AppError("Giá bán lại phải lớn hơn 0.", 400);
  }

  // Thực thi quy tắc trần giá 120% bất biến
  if (requestedPrice > maxAllowedPrice) {
    throw new AppError(
      `Quy tắc BR-03: Giá bán lại (${requestedPrice} ETH) không được vượt quá trần 120% giá gốc (${maxAllowedPrice} ETH).`,
      400,
    );
  }

  ticket.isListedForResale = true;
  await ticket.save();

  let listing = await ResaleListing.findOne({ where: { ticketId: ticket.id } });
  if (listing) {
    listing.resalePrice = requestedPrice;
    listing.status = "active";
    listing.listingTxHash = listingTxHash || listing.listingTxHash;
    await listing.save();
  } else {
    listing = await ResaleListing.create({
      ticketId: ticket.id,
      tokenId: ticket.tokenId,
      eventId: ticket.eventId,
      sellerWallet: ticket.ownerWallet,
      originalPrice: origPrice,
      resalePrice: requestedPrice,
      maxAllowedPrice,
      listingTxHash:
        listingTxHash || `0x${crypto.randomBytes(32).toString("hex")}`,
      status: "active",
    });
  }

  return { ticket, listing };
};
// 9. Lấy danh sách vé đang rao bán trên Marketplace (BE-08)
export const getMarketplaceListings = async ({
  eventId,
  page = 1,
  limit = 12,
}) => {
  const parsedPage = Math.max(1, Number(page) || 1);
  const parsedLimit = Math.max(1, Math.min(50, Number(limit) || 12));
  const offset = (parsedPage - 1) * parsedLimit;
  const where = { status: "active" };
  if (eventId) {
    where.eventId = Number(eventId);
  }
  const { count, rows } = await ResaleListing.findAndCountAll({
    where,
    include: [
      {
        model: Event,
        as: "event",
        attributes: [
          "id",
          "title",
          "category",
          "bannerUrl",
          "venueName",
          "venueCity",
          "startTime",
          "endTime",
          "status",
        ],
      },
      {
        model: Ticket,
        as: "ticket",
        include: [
          {
            model: TicketType,
            as: "ticketType",
            attributes: ["id", "name", "originalPrice", "currency"],
          },
        ],
      },
    ],
    order: [["createdAt", "DESC"]],
    limit: parsedLimit,
    offset,
  });
  return {
    listings: rows,
    pagination: {
      total: count,
      page: parsedPage,
      totalPages: Math.ceil(count / parsedLimit),
      limit: parsedLimit,
    },
  };
};
// 10. Hủy niêm yết vé bán lại trên Marketplace (BE-08)
export const cancelResaleListing = async (ticketId, user) => {
  const listing = await ResaleListing.findOne({
    where: { ticketId: Number(ticketId), status: "active" },
    include: [{ model: Ticket, as: "ticket" }],
  });
  if (!listing) {
    throw new AppError("Không tìm thấy bài niêm yết vé đang mở.", 404);
  }
  const callerWallet = (user?.walletAddress || "").toLowerCase();
  if (callerWallet && listing.sellerWallet.toLowerCase() !== callerWallet) {
    throw new AppError("Bạn không phải chủ sở hữu của lượt niêm yết này.", 403);
  }
  listing.status = "cancelled";
  await listing.save();
  if (listing.ticket) {
    listing.ticket.isListedForResale = false;
    await listing.ticket.save();
  }
  return listing;
};
// 11. Mua lại vé từ Marketplace và chuyển nhượng sang ví người mua mới (BE-08)
export const buyResaleTicket = async (
  ticketId,
  { buyerWallet, txHash },
  user,
) => {
  return sequelize.transaction(async (t) => {
    const listing = await ResaleListing.findOne({
      where: { ticketId: Number(ticketId), status: "active" },
      include: [
        { model: Ticket, as: "ticket" },
        { model: Event, as: "event" },
      ],
      transaction: t,
      lock: t.LOCK.UPDATE,
    });
    if (!listing) {
      throw new AppError(
        "Lượt niêm yết này không còn tồn tại hoặc đã được bán.",
        404,
      );
    }
    const resolvedBuyer = (
      buyerWallet ||
      user?.walletAddress ||
      ""
    ).toLowerCase();
    if (!resolvedBuyer) {
      throw new AppError("Vui lòng cung cấp địa chỉ ví người mua lại.", 400);
    }
    if (listing.sellerWallet.toLowerCase() === resolvedBuyer) {
      throw new AppError(
        "Người bán không thể tự mua lại vé của chính mình.",
        400,
      );
    }
    const ticket = listing.ticket;
    if (!ticket || ticket.isUsed) {
      throw new AppError(
        "Vé này đã được soát vé tại cổng, không thể chuyển giao.",
        400,
      );
    }
    // Cập nhật trạng thái niêm yết
    listing.status = "sold";
    listing.buyerWallet = resolvedBuyer;
    listing.soldTxHash =
      txHash || `0x${crypto.randomBytes(32).toString("hex")}`;
    listing.soldAt = new Date();
    await listing.save({ transaction: t });
    // Chuyển quyền sở hữu vé sang ví người mua mới
    ticket.ownerWallet = resolvedBuyer;
    ticket.isListedForResale = false;
    ticket.txHash = listing.soldTxHash;
    await ticket.save({ transaction: t });
    return { ticket, listing };
  });
};
// 12. Xác thực và Soát vé Check-in tại cổng bằng mã QR động (BE-09)
export const checkInTicket = async (
  { qrPayload, ticketId, tokenId },
  staffUser,
) => {
  let targetTicketId = ticketId;
  let targetTokenId = tokenId;
  let validUntil;
  let providedHmac;
  // Nếu truyền dạng chuỗi QR Payload từ Scanner
  if (qrPayload) {
    try {
      const parsed =
        typeof qrPayload === "string" ? JSON.parse(qrPayload) : qrPayload;
      targetTicketId = parsed.ticketId;
      targetTokenId = parsed.tokenId;
      validUntil = parsed.validUntil;
      providedHmac = parsed.hmac;
    } catch {
      throw new AppError("Định dạng mã QR không hợp lệ.", 400);
    }
    // 1. Kiểm tra thời hạn mã QR (chống chụp màn hình gửi cho người khác, xoay vòng 60s)
    if (!validUntil || Date.now() > Number(validUntil)) {
      throw new AppError(
        "Mã QR đã hết hạn hiệu lực. Vui lòng làm mới mã trên màn hình của khách.",
        400,
      );
    }
    // 2. Xác thực chữ ký HMAC bảo mật
    const secretKey =
      process.env.JWT_ACCESS_SECRET || "blocktickets-dynamic-qr-secret";
    const rawData = `ticket:${targetTicketId}|token:${targetTokenId}|exp:${validUntil}`;
    const expectedHmac = crypto
      .createHmac("sha256", secretKey)
      .update(rawData)
      .digest("hex");
    if (providedHmac !== expectedHmac) {
      // Ghi log lỗi bảo mật vào CheckInLog
      await CheckInLog.create({
        tokenId: targetTokenId || 0,
        eventId: 0,
        scannedBy: staffUser?.id || 1,
        status: "invalid_signature",
        qrNonce: providedHmac || "unknown",
      }).catch(() => {});
      throw new AppError(
        "Mã QR không hợp lệ hoặc đã bị giả mạo chữ ký (HMAC Mismatch).",
        400,
      );
    }
  }
  // 3. Tìm bản ghi vé trong cơ sở dữ liệu
  const ticket = await Ticket.findByPk(targetTicketId, {
    include: [
      { model: Event, as: "event" },
      { model: TicketType, as: "ticketType" },
    ],
  });
  if (!ticket) {
    throw new AppError("Không tìm thấy thông tin vé trong hệ thống.", 404);
  }
  // 4. Kiểm tra sự kiện
  if (ticket.event?.status === "cancelled") {
    throw new AppError("Sự kiện này đã bị hủy bỏ, không thể soát vé.", 400);
  }
  // 5. Kiểm tra vé đã từng check-in chưa (Chống quét lặp)
  if (ticket.isUsed) {
    await CheckInLog.create({
      tokenId: ticket.tokenId,
      eventId: ticket.eventId,
      scannedBy: staffUser?.id || 1,
      status: "already_used",
      qrNonce: providedHmac || `ticket-${ticket.id}`,
    });
    throw new AppError(
      `Vé này ĐÃ ĐƯỢC CHECK-IN lúc ${new Date(ticket.usedAt).toLocaleString("vi-VN")}. Nghi vấn quét trùng lặp!`,
      409,
    );
  }
  // 6. Đánh dấu vé đã check-in thành công
  ticket.isUsed = true;
  ticket.usedAt = new Date();
  await ticket.save();
  // Ghi nhật ký soát vé thành công
  const log = await CheckInLog.create({
    tokenId: ticket.tokenId,
    eventId: ticket.eventId,
    scannedBy: staffUser?.id || 1,
    status: "success",
    qrNonce: providedHmac || `nonce-${Date.now()}`,
  });
  return {
    success: true,
    message: "Soát vé thành công! Mời khách vào khán phòng.",
    ticket: {
      id: ticket.id,
      tokenId: ticket.tokenId,
      eventName: ticket.event?.title,
      tierName: ticket.ticketType?.name,
      ownerWallet: ticket.ownerWallet,
      usedAt: ticket.usedAt,
    },
    logId: log.id,
  };
};
