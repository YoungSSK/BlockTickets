import { Op } from "sequelize";
import { Event, TicketType, User } from "../models/index.js";
import { AppError } from "../utils/AppError.js";

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
  if (payload.startTime <= new Date()) {
    throw new AppError("Thời gian bắt đầu sự kiện phải ở tương lai.", 400);
  }

  return Event.create({
    ...payload,
    organizerId,
    status: "draft",
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
export const addTicketTypeToEvent = async (eventId, organizerId, payload) => {
  const event = await getEventOrFail(eventId);
  assertEventOwner(event, organizerId);

  if (!EDITABLE_STATUSES.includes(event.status)) {
    throw new AppError(
      `Chỉ được cấu hình hạng vé khi sự kiện ở trạng thái "draft" hoặc "rejected".`,
      409,
    );
  }

  if (payload.saleEndTime > event.startTime) {
    throw new AppError(
      "Thời điểm kết thúc bán vé không được vượt quá thời gian bắt đầu sự kiện.",
      400,
    );
  }

  return TicketType.create({
    ...payload,
    eventId: event.id,
    currentSupply: 0,
  });
};

// 7. Organizer: Gửi sự kiện để Admin duyệt (draft/rejected -> pending)
export const submitEventForReview = async (eventId, organizerId) => {
  const event = await getEventOrFail(eventId, {
    include: [{ model: TicketType, as: "ticketTypes" }],
  });
  assertEventOwner(event, organizerId);

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

  if (onChainEventId !== undefined) {
    event.onChainEventId = onChainEventId;
  }
  event.status = "published";
  await event.save();

  return event;
};
