import * as adminEventService from "../services/adminEventService.js";

const getClientIp = (req) =>
  req.ip || req.socket?.remoteAddress || "Unknown IP";

export const getPendingEvents = async (req, res, next) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));
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

export const getAdminMetrics = async (req, res, next) => {
  try {
    const data = await adminEventService.getAdminMetrics();
    return res.status(200).json({
      success: true,
      message: "Lấy số liệu thống kê quản trị thành công.",
      data,
    });
  } catch (error) {
    return next(error);
  }
};

export const getAllEvents = async (req, res, next) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));
    const { status, search } = req.query;
    const data = await adminEventService.listAllEventsAdmin({
      page,
      limit,
      status,
      search,
    });
    return res.status(200).json({
      success: true,
      message: "Lấy danh sách toàn bộ sự kiện thành công.",
      data,
    });
  } catch (error) {
    return next(error);
  }
};

export const listUsers = async (req, res, next) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));
    const { role, status, search } = req.query;
    const data = await adminEventService.listUsersAdmin({
      page,
      limit,
      role,
      status,
      search,
    });
    return res.status(200).json({
      success: true,
      message: "Lấy danh sách người dùng thành công.",
      data,
    });
  } catch (error) {
    return next(error);
  }
};

export const updateUserStatus = async (req, res, next) => {
  try {
    const userId = Number(req.params.id);
    const { status, reason } = req.body;
    if (!["active", "suspended"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Trạng thái không hợp lệ (chỉ chấp nhận active hoặc suspended).",
      });
    }
    const user = await adminEventService.updateUserStatus(
      userId,
      status,
      reason,
      req.user,
      getClientIp(req),
    );
    return res.status(200).json({
      success: true,
      message:
        status === "suspended"
          ? "Đã tạm khóa tài khoản người dùng."
          : "Đã kích hoạt lại tài khoản người dùng.",
      data: { user },
    });
  } catch (error) {
    return next(error);
  }
};

export const updateUserRole = async (req, res, next) => {
  try {
    const userId = Number(req.params.id);
    const { role } = req.body;
    if (!["admin", "organizer", "customer"].includes(role)) {
      return res.status(400).json({
        success: false,
        message:
          "Vai trò không hợp lệ (chỉ chấp nhận admin, organizer hoặc customer).",
      });
    }
    const user = await adminEventService.updateUserRole(
      userId,
      role,
      req.user,
      getClientIp(req),
    );
    return res.status(200).json({
      success: true,
      message: `Đã cập nhật vai trò người dùng thành "${role}".`,
      data: { user },
    });
  } catch (error) {
    return next(error);
  }
};

export const listAuditLogs = async (req, res, next) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));
    const data = await adminEventService.listAuditLogsAdmin({ page, limit });
    return res.status(200).json({
      success: true,
      message: "Lấy lịch sử nhật ký kiểm toán thành công.",
      data,
    });
  } catch (error) {
    return next(error);
  }
};
