import { sequelize, Event, TicketType, User } from "../models/index.js";
import { AppError } from "../utils/AppError.js";
import { recordAuditLog } from "./auditService.js";

export const listPendingEvents = async ({ page = 1, limit = 20 }) => {
  const offset = (page - 1) * limit;
  const { rows, count } = await Event.findAndCountAll({
    where: { status: "pending" },
    include: [
      {
        model: User,
        as: "organizer",
        attributes: ["id", "fullName", "email", "walletAddress"],
      },
      { model: TicketType, as: "ticketTypes" },
    ],
    order: [["updatedAt", "ASC"]],
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

export const approveEvent = async (eventId, adminUser, ipAddress) => {
  return sequelize.transaction(async (t) => {
    const event = await Event.findByPk(eventId, {
      transaction: t,
      lock: t.LOCK.UPDATE,
    });
    if (!event) throw new AppError("Không tìm thấy sự kiện.", 404);

    if (event.status !== "pending") {
      throw new AppError(
        `Chỉ có thể duyệt sự kiện đang chờ duyệt (hiện tại: "${event.status}").`,
        409,
      );
    }

    event.status = "approved";
    event.rejectionReason = null;
    await event.save({ transaction: t });

    await recordAuditLog(
      {
        user: adminUser,
        action: "APPROVE_EVENT",
        targetId: event.id,
        ipAddress,
        details: {
          title: event.title,
          previousStatus: "pending",
          newStatus: "approved",
        },
      },
      t,
    );

    return event;
  });
};

export const rejectEvent = async (eventId, reason, adminUser, ipAddress) => {
  return sequelize.transaction(async (t) => {
    const event = await Event.findByPk(eventId, {
      transaction: t,
      lock: t.LOCK.UPDATE,
    });
    if (!event) throw new AppError("Không tìm thấy sự kiện.", 404);

    if (event.status !== "pending") {
      throw new AppError(
        `Chỉ có thể từ chối sự kiện đang chờ duyệt (hiện tại: "${event.status}").`,
        409,
      );
    }

    event.status = "rejected";
    event.rejectionReason = reason;
    await event.save({ transaction: t });

    await recordAuditLog(
      {
        user: adminUser,
        action: "REJECT_EVENT",
        targetId: event.id,
        ipAddress,
        details: { title: event.title, reason },
      },
      t,
    );

    return event;
  });
};

export const hideOrCancelEvent = async (
  eventId,
  reason,
  adminUser,
  ipAddress,
) => {
  return sequelize.transaction(async (t) => {
    const event = await Event.findByPk(eventId, {
      transaction: t,
      lock: t.LOCK.UPDATE,
    });
    if (!event) throw new AppError("Không tìm thấy sự kiện.", 404);

    if (!["approved", "published"].includes(event.status)) {
      throw new AppError(
        `Không thể tạm ẩn/hủy sự kiện ở trạng thái "${event.status}".`,
        409,
      );
    }

    const previousStatus = event.status;
    event.status = "cancelled";
    event.rejectionReason = reason;
    await event.save({ transaction: t });

    await recordAuditLog(
      {
        user: adminUser,
        action: "CANCEL_EVENT",
        targetId: event.id,
        ipAddress,
        details: { title: event.title, previousStatus, reason },
      },
      t,
    );

    return event;
  });
};
