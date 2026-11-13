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
} from "../models/index.js";
import { AppError } from "../utils/AppError.js";

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
  if (!ticketType) throw new AppError("Hạng vé không tồn tại trong sự kiện.", 404);

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

    // Cập nhật trạng thái đơn hàng sang confirmed
    order.status = "confirmed";
    order.txHash = txHash || `0x${crypto.randomBytes(32).toString("hex")}`;
    await order.save({ transaction: t });

    // Tạo các bản ghi vé NFT tương ứng số lượng
    const createdTickets = [];
    const baseTokenId = BigInt(Date.now()) * 1000n;

    for (let i = 0; i < order.quantity; i++) {
      const tokenId = baseTokenId + BigInt(i) + BigInt(crypto.randomInt(1, 999));
      const ticketTxHash = `0x${crypto.randomBytes(32).toString("hex")}`;

      const ticket = await Ticket.create(
        {
          tokenId: Number(tokenId % 2147483647n),
          eventId: order.eventId,
          ticketTypeId: order.ticketTypeId,
          ownerWallet: order.buyerWallet,
          originalBuyerWallet: order.buyerWallet,
          originalPrice: ticketType.originalPrice,
          txHash: ticketTxHash,
          isUsed: false,
          isListedForResale: false,
        },
        { transaction: t },
      );
      createdTickets.push(ticket);
    }

    // Tăng currentSupply của ticketType
    ticketType.currentSupply = Number(ticketType.currentSupply || 0) + order.quantity;
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
  const secretKey = process.env.JWT_ACCESS_SECRET || "blocktickets-dynamic-qr-secret";

  const rawData = `ticket:${ticket.id}|token:${ticket.tokenId}|exp:${validUntil}`;
  const hmac = crypto.createHmac("sha256", secretKey).update(rawData).digest("hex");

  const qrPayload = JSON.stringify({
    ticketId: ticket.id,
    tokenId: ticket.tokenId,
    validUntil,
    hmac,
  });

  return { qrPayload, validUntil };
};

// 7. Chuyển nhượng vé NFT cho ví khác (P2P Transfer)
export const transferTicket = async (ticketId, { recipientWallet, txHash }, user) => {
  const ticket = await Ticket.findByPk(ticketId);
  if (!ticket) throw new AppError("Không tìm thấy vé.", 404);

  if (ticket.isUsed) {
    throw new AppError("Vé này đã được soát check-in, không thể chuyển nhượng.", 400);
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
      listingTxHash: listingTxHash || `0x${crypto.randomBytes(32).toString("hex")}`,
      status: "active",
    });
  }

  return { ticket, listing };
};

