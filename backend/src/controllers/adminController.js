import * as adminEventService from "../services/adminEventService.js";

const getClientIp = (req) =>
  req.ip || req.socket?.remoteAddress || "Unknown IP";

export const getPendingEvents = async (req, res, next) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const data = await adminEventService.listPendingEvents({ page, limit });
    return res.status(200).json({
      success: true,
      message: "Lấy danh sách sự kiện chờ duyệt thành công.",
      data,
    });
  } catch (error) {
    return next(error);
  }
};

export const approveEvent = async (req, res, next) => {
  try {
    const event = await adminEventService.approveEvent(
      req.validated.params.id,
      req.user,
      getClientIp(req),
    );
    return res.status(200).json({
      success: true,
      message: "Phê duyệt sự kiện thành công.",
      data: { event },
    });
  } catch (error) {
    return next(error);
  }
};

export const rejectEvent = async (req, res, next) => {
  try {
    const event = await adminEventService.rejectEvent(
      req.validated.params.id,
      req.body.reason,
      req.user,
      getClientIp(req),
    );
    return res.status(200).json({
      success: true,
      message: "Đã từ chối sự kiện.",
      data: { event },
    });
  } catch (error) {
    return next(error);
  }
};

export const cancelEvent = async (req, res, next) => {
  try {
    const event = await adminEventService.hideOrCancelEvent(
      req.validated.params.id,
      req.body.reason,
      req.user,
      getClientIp(req),
    );
    return res.status(200).json({
      success: true,
      message: "Đã tạm ẩn/hủy sự kiện.",
      data: { event },
    });
  } catch (error) {
    return next(error);
  }
};
