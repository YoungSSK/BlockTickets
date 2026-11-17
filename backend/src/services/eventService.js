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

      let saleStartTime = tier.saleStartTime 
        ? new Date(tier.saleStartTime) 
        : (payload.saleStartTime ? new Date(payload.saleStartTime) : new Date());
      let saleEndTime = tier.saleEndTime 
        ? new Date(tier.saleEndTime) 
        : (payload.saleEndTime ? new Date(payload.saleEndTime) : new Date(event.startTime));
      if (saleEndTime > new Date(event.startTime)) saleEndTime = new Date(event.startTime);
      if (saleEndTime <= saleStartTime) {
        saleStartTime = new Date(saleEndTime.getTime() - 24 * 60 * 60 * 1000);
      }

      let seatAllocations = null;
      let computedMaxSupply = Number(tier.maxSupply);
      let zoneSummary = tier.seatZone || (tierName.toLowerCase().includes('vip') ? 'Khán đài A' : 'Khán đài B');
      let rowSummary = tier.seatRow || (tierName.toLowerCase().includes('vip') ? 'Dãy A1' : 'Dãy B1');
      let startSeat = tier.seatStart || 1;
      let endSeat = tier.seatEnd || Number(tier.maxSupply);

      if (Array.isArray(tier.seatConfig) && tier.seatConfig.length > 0) {
        seatAllocations = tier.seatConfig;
        computedMaxSupply = seatAllocations.reduce((sum, a) => {
          const s = Number(a.seatStart) || 1;
          const e = Number(a.seatEnd) || s;
          return sum + Math.max(0, e - s + 1);
        }, 0);
        zoneSummary = [...new Set(seatAllocations.map((a) => a.zone))].join(', ');
        rowSummary = seatAllocations.map((a) => a.row).join(', ');
        startSeat = seatAllocations[0]?.seatStart || 1;
        endSeat = seatAllocations[seatAllocations.length - 1]?.seatEnd || endSeat;
      }

      await TicketType.create({
        name: tierName,
        description: tier.description || `${tierName} - Vé sự kiện NFT`,
        originalPrice: Number(tier.originalPrice),
        currency: tier.currency || "ETH",
        maxSupply: computedMaxSupply || Number(tier.maxSupply) || 20,
        saleStartTime,
        saleEndTime,
        eventId: event.id,
        currentSupply: 0,
        entryGate: tier.entryGate?.trim() || (tierName.toLowerCase().includes('vip') ? 'Cổng VIP - Sảnh Chính Tầng 1' : 'Cổng A - Khán Đài Phổ Thông Tầng 1'),
        tierType: tier.tierType || (tierName.toLowerCase().includes('vip') ? 'vip' : 'standard'),
        seatZone: zoneSummary,
        seatRow: rowSummary,
        seatStart: startSeat,
        seatEnd: endSeat,
        seatConfig: seatAllocations || tier.seatConfig || null,
      });
    }
  }

  return Event.findByPk(event.id, {
    include: [{ model: TicketType, as: "ticketTypes" }],
  });
};

// 5. Organizer: Cập nhật sự kiện
export const updateEvent = async (eventId, organizerId, payload) => {
  const event = await getEventOrFail(eventId);
  assertEventOwner(event, organizerId);

  if (["draft", "rejected", "pending"].includes(event.status)) {
    const nextStart = payload.startTime ?? event.startTime;
    const nextEnd = payload.endTime ?? event.endTime;

    // Chỉ kiểm tra thời gian tương lai NẾU thời gian bắt đầu thực sự bị thay đổi
    if (payload.startTime) {
      const isStartTimeChanged = new Date(payload.startTime).getTime() !== new Date(event.startTime).getTime();
      if (isStartTimeChanged && new Date(payload.startTime) <= new Date()) {
        throw new AppError("Thời gian bắt đầu sự kiện phải ở tương lai.", 400);
      }
    }
    if (payload.startTime || payload.endTime) {
      if (new Date(nextEnd) <= new Date(nextStart)) {
        throw new AppError("Thời gian kết thúc phải sau thời gian bắt đầu.", 400);
      }
    }

    Object.assign(event, payload);
    if (event.status === "rejected") {
      event.status = "draft";
      event.rejectionReason = null;
    }
  } else if (["approved", "published"].includes(event.status)) {
    // Với sự kiện đã duyệt/công bố: không cho sửa nếu sự kiện đã kết thúc
    if (event.endTime && new Date(event.endTime) <= new Date()) {
      throw new AppError("Không thể chỉnh sửa sự kiện đã kết thúc.", 400);
    }

    // Kiểm tra ràng buộc thời gian khi dời lịch (reschedule)
    const nextStart = payload.startTime ?? event.startTime;
    const nextEnd = payload.endTime ?? event.endTime;

    if (payload.startTime !== undefined) {
      const isStartTimeChanged = new Date(payload.startTime).getTime() !== new Date(event.startTime).getTime();
      if (isStartTimeChanged && new Date(payload.startTime) <= new Date()) {
        throw new AppError("Thời gian bắt đầu sự kiện mới phải ở tương lai, không thể chọn thời điểm trong quá khứ.", 400);
      }
      event.startTime = payload.startTime;
    }
    if (payload.endTime !== undefined) {
      if (new Date(nextEnd) <= new Date(nextStart)) {
        throw new AppError("Thời gian kết thúc sự kiện phải sau thời gian bắt đầu.", 400);
      }
      event.endTime = payload.endTime;
    }

    // Với sự kiện đã duyệt/công bố: cho phép cập nhật thông tin mô tả, banner, địa điểm, cổng và sơ đồ
    const allowedFields = ["title", "description", "bannerUrl", "venueName", "venueAddress", "venueCity", "category", "checkInGates", "seatingMap"];
    for (const key of allowedFields) {
      if (payload[key] !== undefined) {
        event[key] = payload[key];
      }
    }
  } else {
    throw new AppError(
      `Không thể chỉnh sửa sự kiện đang ở trạng thái "${event.status}".`,
      409,
    );
  }

  // CẬP NHẬT CÁC HẠNG VÉ (TICKET TIERS) NẾU CÓ TRUYỀN VÀO VÀ VÉ CHƯA BÁN
  if (Array.isArray(payload.ticketTypes)) {
    const existingTiers = await TicketType.findAll({ where: { eventId: event.id } });
    const payloadTierIds = payload.ticketTypes
      .filter((t) => t.id && !String(t.id).startsWith("new-") && !isNaN(Number(t.id)))
      .map((t) => Number(t.id));

    for (const tierData of payload.ticketTypes) {
      const isNew = !tierData.id || String(tierData.id).startsWith("new-") || isNaN(Number(tierData.id));
      if (!isNew) {
        const currentTier = existingTiers.find((et) => et.id === Number(tierData.id));
        if (currentTier) {
          const soldCount = await Ticket.count({ where: { ticketTypeId: currentTier.id } });
          // Chỉ cho phép cập nhật nếu hạng vé này chưa có ai mua vé
          if (soldCount === 0 && (!currentTier.currentSupply || currentTier.currentSupply === 0)) {
            let seatAllocations = null;
            let computedMax = Number(tierData.maxSupply);
            let zoneSummary = tierData.seatZone || currentTier.seatZone;
            let rowSummary = tierData.seatRow || currentTier.seatRow;
            let s = Number(tierData.seatStart) || 1;
            let e = Number(tierData.seatEnd) || Number(tierData.maxSupply) || 20;

            if (Array.isArray(tierData.seatConfig) && tierData.seatConfig.length > 0) {
              seatAllocations = tierData.seatConfig;
              computedMax = seatAllocations.reduce((sum, a) => {
                const start = Number(a.seatStart) || 1;
                const end = Number(a.seatEnd) || start;
                return sum + Math.max(0, end - start + 1);
              }, 0);
              zoneSummary = [...new Set(seatAllocations.map((a) => a.zone))].join(', ');
              rowSummary = seatAllocations.map((a) => a.row).join(', ');
              s = seatAllocations[0]?.seatStart || 1;
              e = seatAllocations[seatAllocations.length - 1]?.seatEnd || e;
            } else {
              computedMax = e >= s ? (e - s + 1) : (Number(tierData.maxSupply) || 20);
            }

            await currentTier.update({
              name: tierData.name?.trim() || currentTier.name,
              description: tierData.description !== undefined ? tierData.description?.trim() : currentTier.description,
              originalPrice: tierData.originalPrice !== undefined ? Number(tierData.originalPrice) : currentTier.originalPrice,
              maxSupply: computedMax,
              entryGate: tierData.entryGate?.trim() || currentTier.entryGate,
              tierType: tierData.tierType || currentTier.tierType,
              seatZone: zoneSummary,
              seatRow: rowSummary,
              seatStart: s,
              seatEnd: e,
              seatConfig: seatAllocations || tierData.seatConfig || currentTier.seatConfig,
              saleStartTime: tierData.saleStartTime ? new Date(tierData.saleStartTime) : currentTier.saleStartTime,
              saleEndTime: tierData.saleEndTime ? new Date(tierData.saleEndTime) : currentTier.saleEndTime,
            });
          }
        }
      } else {
        // Tạo hạng vé mới nếu được bổ sung lúc sửa sự kiện
        let seatAllocations = null;
        let computedMax = Number(tierData.maxSupply);
        let zoneSummary = tierData.seatZone || "Khán đài A";
        let rowSummary = tierData.seatRow || "Dãy A1";
        let s = Number(tierData.seatStart) || 1;
        let e = Number(tierData.seatEnd) || Number(tierData.maxSupply) || 20;

        if (Array.isArray(tierData.seatConfig) && tierData.seatConfig.length > 0) {
          seatAllocations = tierData.seatConfig;
          computedMax = seatAllocations.reduce((sum, a) => {
            const start = Number(a.seatStart) || 1;
            const end = Number(a.seatEnd) || start;
            return sum + Math.max(0, end - start + 1);
          }, 0);
          zoneSummary = [...new Set(seatAllocations.map((a) => a.zone))].join(', ');
          rowSummary = seatAllocations.map((a) => a.row).join(', ');
          s = seatAllocations[0]?.seatStart || 1;
          e = seatAllocations[seatAllocations.length - 1]?.seatEnd || e;
        } else {
          computedMax = e >= s ? (e - s + 1) : (Number(tierData.maxSupply) || 20);
        }

        await TicketType.create({
          eventId: event.id,
          name: tierData.name?.trim() || `Hạng vé mới`,
          description: tierData.description?.trim() || `${tierData.name || 'Hạng vé'} - Vé sự kiện NFT`,
          originalPrice: Number(tierData.originalPrice) || 0.001,
          currency: "ETH",
          maxSupply: computedMax,
          currentSupply: 0,
          entryGate: tierData.entryGate?.trim() || "Cổng A - Khán Đài Phổ Thông Tầng 1",
          tierType: tierData.tierType || "standard",
          seatZone: zoneSummary,
          seatRow: rowSummary,
          seatStart: s,
          seatEnd: e,
          seatConfig: seatAllocations || tierData.seatConfig || null,
          saleStartTime: tierData.saleStartTime ? new Date(tierData.saleStartTime) : new Date(),
          saleEndTime: tierData.saleEndTime ? new Date(tierData.saleEndTime) : new Date(event.endTime || event.startTime),
        });
      }
    }

    // Xóa các hạng vé đã bị gỡ khỏi form (chỉ xóa nếu chưa có người mua)
    for (const oldTier of existingTiers) {
      if (!payloadTierIds.includes(oldTier.id)) {
        const soldCount = await Ticket.count({ where: { ticketTypeId: oldTier.id } });
        if (soldCount === 0 && (!oldTier.currentSupply || oldTier.currentSupply === 0)) {
          await oldTier.destroy();
        }
      }
    }
  }

  await event.save();
  return Event.findByPk(event.id, {
    include: [{ model: TicketType, as: "ticketTypes" }],
  });
};

// Organizer: Hủy sự kiện
export const cancelEventByOrganizer = async (eventId, organizerId, reason = "") => {
  const event = await getEventOrFail(eventId);
  assertEventOwner(event, organizerId);

  if (event.status === "cancelled") {
    throw new AppError("Sự kiện này đã bị hủy trước đó.", 400);
  }
  if (event.status === "ended") {
    throw new AppError("Không thể hủy sự kiện đã kết thúc.", 400);
  }

  // Chặn hủy sự kiện nếu đã phát sinh vé NFT bán ra cho khán giả
  const ticketCount = await Ticket.count({ where: { eventId } });
  if (ticketCount > 0) {
    throw new AppError(
      `Sự kiện đã phát hành ${ticketCount} vé NFT cho khán giả, không thể hủy bỏ nhằm bảo vệ quyền lợi người mua vé. Bạn có thể cập nhật dời lịch thời gian hoặc địa điểm tổ chức mới.`,
      400
    );
  }

  event.status = "cancelled";
  if (reason) {
    event.rejectionReason = reason;
  }
  await event.save();
  return event;
};

// Organizer: Xóa vĩnh viễn sự kiện (nếu chưa bán vé)
export const deleteEventByOrganizer = async (eventId, organizerId) => {
  const event = await getEventOrFail(eventId);
  assertEventOwner(event, organizerId);

  const ticketCount = await Ticket.count({ where: { eventId } });
  if (ticketCount > 0) {
    throw new AppError("Sự kiện đã phát sinh vé NFT bán ra trên hệ thống, không thể xóa vĩnh viễn. Vui lòng chọn chức năng Hủy sự kiện.", 400);
  }

  await TicketType.destroy({ where: { eventId } });
  await event.destroy();
  return { id: eventId, deleted: true };
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

// 6.1 Organizer/Admin: Cập nhật trực tiếp một hạng vé (nếu chưa có người mua)
export const updateTicketType = async (eventId, ticketTypeId, organizerId, payload, userRole = null) => {
  const event = await getEventOrFail(eventId);
  if (userRole !== "admin") {
    assertEventOwner(event, organizerId);
  }

  const ticketType = await TicketType.findOne({
    where: { id: ticketTypeId, eventId: event.id },
  });
  if (!ticketType) {
    throw new AppError("Không tìm thấy hạng vé cần chỉnh sửa.", 404);
  }

  // KIỂM TRA ĐIỀU KIỆN: Chưa có ai mua vé thuộc hạng vé này
  const soldCount = await Ticket.count({ where: { ticketTypeId: ticketType.id } });
  if (soldCount > 0 || (ticketType.currentSupply && ticketType.currentSupply > 0)) {
    throw new AppError(
      `Hạng vé "${ticketType.name}" đã có ${soldCount || ticketType.currentSupply} vé được mua, không thể chỉnh sửa nhằm bảo vệ quyền lợi của người mua.`,
      400
    );
  }

  if (payload.name && payload.name.trim() !== ticketType.name) {
    const dupName = await TicketType.findOne({
      where: {
        eventId: event.id,
        name: payload.name.trim(),
        id: { [Op.ne]: ticketType.id },
      },
    });
    if (dupName) {
      throw new AppError(`Tên hạng vé "${payload.name.trim()}" đã tồn tại trong sự kiện này.`, 400);
    }
  }

  const allowedFields = [
    "name",
    "description",
    "originalPrice",
    "currency",
    "maxSupply",
    "entryGate",
    "tierType",
    "seatZone",
    "seatRow",
    "seatStart",
    "seatEnd",
    "seatConfig",
    "saleStartTime",
    "saleEndTime",
  ];

  for (const field of allowedFields) {
    if (payload[field] !== undefined) {
      ticketType[field] = payload[field];
    }
  }

  if (payload.seatStart !== undefined && payload.seatEnd !== undefined) {
    const s = Number(payload.seatStart) || 1;
    const e = Number(payload.seatEnd) || 1;
    if (e >= s) {
      ticketType.maxSupply = e - s + 1;
    }
  }

  await ticketType.save();
  return ticketType;
};

// 6.2 Organizer/Admin: Xóa một hạng vé (nếu chưa có người mua)
export const deleteTicketType = async (eventId, ticketTypeId, organizerId, userRole = null) => {
  const event = await getEventOrFail(eventId);
  if (userRole !== "admin") {
    assertEventOwner(event, organizerId);
  }

  const ticketType = await TicketType.findOne({
    where: { id: ticketTypeId, eventId: event.id },
  });
  if (!ticketType) {
    throw new AppError("Không tìm thấy hạng vé cần xóa.", 404);
  }

  const totalTiers = await TicketType.count({ where: { eventId: event.id } });
  if (totalTiers <= 1) {
    throw new AppError("Sự kiện phải có ít nhất 1 hạng vé phát hành, không thể xóa hạng vé cuối cùng.", 400);
  }

  const soldCount = await Ticket.count({ where: { ticketTypeId: ticketType.id } });
  if (soldCount > 0 || (ticketType.currentSupply && ticketType.currentSupply > 0)) {
    throw new AppError(`Hạng vé "${ticketType.name}" đã có vé được mua, không thể xóa.`, 400);
  }

  await ticketType.destroy();
  return { id: ticketTypeId, deleted: true };
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
  let totalTicketsMaxSupply = 0;
  let totalRevenueEth = 0;
  let checkedInCount = 0;

  for (const event of events) {
    if (Array.isArray(event.ticketTypes)) {
      for (const tt of event.ticketTypes) {
        totalTicketsMinted += Number(tt.currentSupply || tt.mintedAmount || 0);
        totalTicketsMaxSupply += Number(tt.maxSupply || 0);
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
      limit: 100,
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
    totalTicketsMaxSupply,
    totalRevenueEth: +totalRevenueEth.toFixed(4),
    totalRevenueUsd: Math.round(totalRevenueEth * 3150),
    checkedInCount,
    recentSettlements,
  };
};
