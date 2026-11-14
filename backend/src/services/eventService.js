import { Op } from "sequelize";
import { Event, TicketType, User, Ticket, Order, sequelize } from "../models/index.js";
import { AppError } from "../utils/AppError.js";
import * as blockchainService from "./blockchainService.js";
const EDITABLE_STATUSES = ["draft", "rejected"];

const SORT_MAP = {
  start_asc: [["startTime", "ASC"]],
  start_desc: [["startTime", "DESC"]],
  newest: [["createdAt", "DESC"]],
};

const assertEventOwner = (event, userId) => {
  if (event.organizerId !== userId) {
    throw new AppError("Bạn không có quyền thao tác trên sự kiện này.", 403);
  }
};

const getEventOrFail = async (eventId, options = {}) => {
  const event = await Event.findByPk(eventId, options);
  if (!event) {
    throw new AppError("Không tìm thấy sự kiện.", 404);
  }
  return event;
};

// 1. Public: Danh sách sự kiện đã công khai
export const listPublishedEvents = async ({
  page,
  limit,
  search,
  category,
  city,
  fromDate,
  toDate,
  sort,
}) => {
  const where = { status: { [Op.in]: ["published", "approved"] } };

  if (search) {
    where[Op.or] = [
      { title: { [Op.like]: `%${search}%` } },
      { venueName: { [Op.like]: `%${search}%` } },
    ];
  }
  if (category) where.category = category;
  if (city) where.venueCity = { [Op.like]: `%${city}%` };
  if (fromDate || toDate) {
    where.startTime = {};
    if (fromDate) where.startTime[Op.gte] = fromDate;
    if (toDate) where.startTime[Op.lte] = toDate;
  }

  const offset = (page - 1) * limit;
  const { rows, count } = await Event.findAndCountAll({
    where,
    include: [
      {
        model: User,
        as: "organizer",
        attributes: ["id", "fullName", "avatarUrl"],
      },
      {
        model: TicketType,
        as: "ticketTypes",
        attributes: [
          "id",
          "name",
          "originalPrice",
          "currency",
          "maxSupply",
          "currentSupply",
        ],
      },
    ],
    order: SORT_MAP[sort] || SORT_MAP.start_asc,
    limit,
    offset,
    distinct: true,
  });

  return {
    events: rows,
    pagination: {
      page,
      limit,
      totalItems: count,
      totalPages: Math.ceil(count / limit),
    },
  };
};

// 2. Organizer: Danh sách sự kiện của chính mình
export const listOrganizerEvents = async (
  organizerId,
  { page, limit, status },
) => {
  const where = { organizerId };
  if (status) where.status = status;

  const offset = (page - 1) * limit;
  const { rows, count } = await Event.findAndCountAll({
    where,
    include: [{ model: TicketType, as: "ticketTypes" }],
    order: [["createdAt", "DESC"]],
    limit,
    offset,
    distinct: true,
  });

  return {
    events: rows,
    pagination: {
      page,
      limit,
      totalItems: count,
      totalPages: Math.ceil(count / limit),
    },
  };
};

// 3. Chi tiết sự kiện (ẩn draft/pending/rejected với người ngoài)
export const getEventDetail = async (eventId, currentUser = null) => {
  const event = await getEventOrFail(eventId, {
    include: [
      {
        model: User,
        as: "organizer",
        attributes: ["id", "fullName", "avatarUrl", "walletAddress"],
      },
      {
        model: TicketType,
        as: "ticketTypes",
      },
    ],
  });

  const canViewNonPublic =
    currentUser &&
    (currentUser.role === "admin" || currentUser.id === event.organizerId);

  if (!["published", "approved"].includes(event.status) && !canViewNonPublic) {
    throw new AppError("Sự kiện không tồn tại hoặc chưa được công khai.", 404);
  }

  return event;
};

// 4. Organizer: Tạo sự kiện (mặc định draft)
export const createEvent = async (organizerId, payload) => {
  if (new Date(payload.startTime) <= new Date()) {
    throw new AppError("Thời gian bắt đầu sự kiện phải ở tương lai.", 400);
  }

  const { ticketTypes, ...eventData } = payload;

  const event = await Event.create({
    ...eventData,
    organizerId,
    status: "draft",
  });

  if (Array.isArray(ticketTypes) && ticketTypes.length > 0) {
    // Ngăn chặn tạo trùng tên hạng vé trong cùng một sự kiện
    const seenNames = new Set();
    const eventEnd = event.endTime ? new Date(event.endTime) : new Date(event.startTime);

    for (const tier of ticketTypes) {
      const tierName = tier.name.trim();
      const lowerName = tierName.toLowerCase();
      if (seenNames.has(lowerName)) {
        continue; // Bỏ qua nếu có hạng vé trùng tên gửi kèm
      }
      seenNames.add(lowerName);

      let saleStartTime = tier.saleStartTime ? new Date(tier.saleStartTime) : new Date();
      let saleEndTime = tier.saleEndTime ? new Date(tier.saleEndTime) : new Date(event.startTime);
      if (saleEndTime > eventEnd) saleEndTime = new Date(eventEnd);
      if (saleEndTime <= saleStartTime) {
        saleStartTime = new Date(saleEndTime.getTime() - 24 * 60 * 60 * 1000);
      }

      await TicketType.create({
        name: tierName,
        description: tier.description || `${tierName} - Vé sự kiện NFT`,
        originalPrice: Number(tier.originalPrice),
        currency: tier.currency || "ETH",
        maxSupply: Number(tier.maxSupply),
        saleStartTime,
        saleEndTime,
        eventId: event.id,
        currentSupply: 0,
      });
    }
  }

  return Event.findByPk(event.id, {
    include: [{ model: TicketType, as: "ticketTypes" }],
  });
};

// 5. Organizer: Cập nhật sự kiện (chỉ khi draft hoặc rejected)
export const updateEvent = async (eventId, organizerId, payload) => {
  const event = await getEventOrFail(eventId);
  assertEventOwner(event, organizerId);

  if (!EDITABLE_STATUSES.includes(event.status)) {
    throw new AppError(
      `Không thể chỉnh sửa sự kiện đang ở trạng thái "${event.status}".`,
      409,
    );
  }

  const nextStart = payload.startTime ?? event.startTime;
  const nextEnd = payload.endTime ?? event.endTime;
  if (payload.startTime && new Date(nextStart) <= new Date()) {
    throw new AppError("Thời gian bắt đầu sự kiện phải ở tương lai.", 400);
  }
  if (new Date(nextEnd) <= new Date(nextStart)) {
    throw new AppError("Thời gian kết thúc phải sau thời gian bắt đầu.", 400);
  }

  Object.assign(event, payload);
  if (event.status === "rejected") {
    event.status = "draft";
    event.rejectionReason = null;
  }

  await event.save();
  return event;
};

// 6. Organizer: Thêm hạng vé cho sự kiện
export const addTicketTypeToEvent = async (eventId, organizerId, payload, userRole = null) => {
  const event = await getEventOrFail(eventId);
  if (userRole !== "admin") {
    assertEventOwner(event, organizerId);
  }

  if (!EDITABLE_STATUSES.includes(event.status)) {
    throw new AppError(
      `Chỉ được cấu hình hạng vé khi sự kiện ở trạng thái "draft" hoặc "rejected".`,
      409,
    );
  }

  const trimmedName = payload.name.trim();
  const existingTier = await TicketType.findOne({
    where: {
      eventId: event.id,
      name: trimmedName,
    },
  });
  if (existingTier) {
    throw new AppError(`Hạng vé "${trimmedName}" đã tồn tại trong sự kiện này.`, 400);
  }

  const eventEnd = event.endTime ? new Date(event.endTime) : new Date(event.startTime);
  let saleStartTime = payload.saleStartTime ? new Date(payload.saleStartTime) : new Date();
  let saleEndTime = payload.saleEndTime ? new Date(payload.saleEndTime) : new Date(event.startTime);

  if (saleEndTime > eventEnd) {
    saleEndTime = new Date(eventEnd);
  }

  if (saleEndTime <= saleStartTime) {
    saleStartTime = new Date(saleEndTime.getTime() - 24 * 60 * 60 * 1000);
  }

  return TicketType.create({
    ...payload,
    saleStartTime,
    saleEndTime,
    eventId: event.id,
    currentSupply: 0,
  });
};

// 7. Organizer: Gửi sự kiện để Admin duyệt (draft/rejected -> pending)
export const submitEventForReview = async (eventId, organizerId, userRole = null) => {
  const event = await getEventOrFail(eventId, {
    include: [{ model: TicketType, as: "ticketTypes" }],
  });
  if (userRole !== "admin") {
    assertEventOwner(event, organizerId);
  }

  if (!EDITABLE_STATUSES.includes(event.status)) {
    throw new AppError(
      `Không thể gửi duyệt từ trạng thái "${event.status}".`,
      409,
    );
  }

  if (!event.ticketTypes || event.ticketTypes.length === 0) {
    throw new AppError(
      "Sự kiện phải có ít nhất 1 hạng vé trước khi gửi duyệt.",
      400,
    );
  }

  event.status = "pending";
  event.rejectionReason = null;
  await event.save();

  return event;
};

// 8. Organizer: Công khai sự kiện sau khi Admin đã duyệt (approved -> published)
export const publishApprovedEvent = async (
  eventId,
  organizerId,
  onChainEventId,
) => {
  const event = await getEventOrFail(eventId);
  assertEventOwner(event, organizerId);
  if (event.status !== "approved") {
    throw new AppError(
      `Chỉ có thể công khai sự kiện đã được Admin duyệt (trạng thái hiện tại: "${event.status}").`,
      409,
    );
  }
  const targetOnChainId =
    onChainEventId !== undefined ? onChainEventId : event.onChainEventId;
  // Xác thực sự kiện on-chain thật nếu có onChainEventId
  if (targetOnChainId) {
    await blockchainService.verifyOnChainEvent(targetOnChainId);
    event.onChainEventId = targetOnChainId;
  }
  event.status = "published";
  await event.save();
  return event;
};

// 9. Organizer: Thống kê số liệu Dashboard của Ban tổ chức
export const getOrganizerStats = async (organizerId) => {
  const events = await Event.findAll({
    where: { organizerId },
    include: [{ model: TicketType, as: "ticketTypes" }],
  });

  const eventIds = events.map((e) => e.id);

  let totalTicketsMinted = 0;
  let totalRevenueEth = 0;
  let checkedInCount = 0;

  for (const event of events) {
    if (Array.isArray(event.ticketTypes)) {
      for (const tt of event.ticketTypes) {
        totalTicketsMinted += Number(tt.currentSupply || tt.mintedAmount || 0);
        totalRevenueEth +=
          Number(tt.currentSupply || tt.mintedAmount || 0) *
          Number(tt.originalPrice || 0);
      }
    }
  }

  let recentSettlements = [];
  if (eventIds.length > 0) {
    checkedInCount = await Ticket.count({
      where: {
        eventId: { [Op.in]: eventIds },
        isUsed: true,
      },
    });

    const recentTickets = await Ticket.findAll({
      where: { eventId: { [Op.in]: eventIds } },
      include: [
        { model: Event, as: "event", attributes: ["id", "title"] },
        { model: TicketType, as: "ticketType", attributes: ["id", "name"] },
      ],
      order: [["createdAt", "DESC"]],
      limit: 20,
    });

    recentSettlements = recentTickets.map((t) => ({
      id: t.id,
      type: "primary_sale",
      typeLabel: "Bán vé sơ cấp",
      eventTitle: t.event?.title || "Sự kiện",
      ticketTypeName: t.ticketType?.name,
      tokenId: t.tokenId,
      amountEth: Number(t.originalPrice),
      txHash: t.txHash,
      time: t.createdAt,
      status: "confirmed",
    }));
  }

  const activeEventsCount = events.filter((e) =>
    ["approved", "published"].includes(e.status),
  ).length;
  const pendingEventsCount = events.filter((e) => e.status === "pending").length;
  const draftEventsCount = events.filter((e) => e.status === "draft").length;

  return {
    totalEvents: events.length,
    activeEventsCount,
    pendingEventsCount,
    draftEventsCount,
    totalTicketsMinted,
    totalRevenueEth: +totalRevenueEth.toFixed(4),
    totalRevenueUsd: Math.round(totalRevenueEth * 3150),
    checkedInCount,
    recentSettlements,
  };
};
