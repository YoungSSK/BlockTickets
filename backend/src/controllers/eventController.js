import * as eventService from "../services/eventService.js";

export const getPublicEvents = async (req, res, next) => {
  try {
    const data = await eventService.listPublishedEvents(req.validated.query);
    return res.status(200).json({
      success: true,
      message: "Lấy danh sách sự kiện thành công.",
      data,
    });
  } catch (error) {
    return next(error);
  }
};

export const getMyEvents = async (req, res, next) => {
  try {
    const data = await eventService.listOrganizerEvents(
      req.user.id,
      req.validated.query,
    );
    return res.status(200).json({
      success: true,
      message: "Lấy danh sách sự kiện của bạn thành công.",
      data,
    });
  } catch (error) {
    return next(error);
  }
};

export const getEventById = async (req, res, next) => {
  try {
    const event = await eventService.getEventDetail(
      req.validated.params.id,
      req.user,
    );
    return res.status(200).json({
      success: true,
      message: "Lấy chi tiết sự kiện thành công.",
      data: { event },
    });
  } catch (error) {
    return next(error);
  }
};

export const createEvent = async (req, res, next) => {
  try {
    const event = await eventService.createEvent(req.user.id, req.body);
    return res.status(201).json({
      success: true,
      message: "Tạo sự kiện nháp thành công.",
      data: { event },
    });
  } catch (error) {
    return next(error);
  }
};

export const updateEvent = async (req, res, next) => {
  try {
    const event = await eventService.updateEvent(
      req.validated.params.id,
      req.user.id,
      req.body,
    );
    return res.status(200).json({
      success: true,
      message: "Cập nhật sự kiện thành công.",
      data: { event },
    });
  } catch (error) {
    return next(error);
  }
};

export const cancelEvent = async (req, res, next) => {
  try {
    const event = await eventService.cancelEventByOrganizer(
      req.validated.params.id,
      req.user.id,
      req.body?.reason || "",
    );
    return res.status(200).json({
      success: true,
      message: "Hủy sự kiện thành công.",
      data: { event },
    });
  } catch (error) {
    return next(error);
  }
};

export const deleteEvent = async (req, res, next) => {
  try {
    const result = await eventService.deleteEventByOrganizer(
      req.validated.params.id,
      req.user.id,
    );
    return res.status(200).json({
      success: true,
      message: "Xóa sự kiện thành công.",
      data: result,
    });
  } catch (error) {
    return next(error);
  }
};

export const createTicketType = async (req, res, next) => {
  try {
    const ticketType = await eventService.addTicketTypeToEvent(
      req.validated.params.id,
      req.user.id,
      req.body,
      req.user?.role,
    );
    return res.status(201).json({
      success: true,
      message: "Tạo hạng vé thành công.",
      data: { ticketType },
    });
  } catch (error) {
    return next(error);
  }
};

export const updateTicketType = async (req, res, next) => {
  try {
    const ticketType = await eventService.updateTicketType(
      req.validated.params.id,
      req.validated.params.ticketTypeId,
      req.user.id,
      req.body,
      req.user?.role,
    );
    return res.status(200).json({
      success: true,
      message: "Cập nhật hạng vé thành công.",
      data: { ticketType },
    });
  } catch (error) {
    return next(error);
  }
};

export const deleteTicketType = async (req, res, next) => {
  try {
    const result = await eventService.deleteTicketType(
      req.params.id,
      req.params.ticketTypeId,
      req.user.id,
      req.user?.role,
    );
    return res.status(200).json({
      success: true,
      message: "Xóa hạng vé thành công.",
      data: result,
    });
  } catch (error) {
    return next(error);
  }
};

export const submitForReview = async (req, res, next) => {
  try {
    const event = await eventService.submitEventForReview(
      req.validated.params.id,
      req.user.id,
      req.user?.role,
    );
    return res.status(200).json({
      success: true,
      message: "Đã gửi sự kiện lên hàng đợi phê duyệt.",
      data: { event },
    });
  } catch (error) {
    return next(error);
  }
};

export const publishEvent = async (req, res, next) => {
  try {
    const event = await eventService.publishApprovedEvent(
      req.validated.params.id,
      req.user.id,
      req.body?.onChainEventId,
      req.body?.tierMappings,
    );
    return res.status(200).json({
      success: true,
      message: "Công khai sự kiện thành công!",
      data: { event },
    });
  } catch (error) {
    return next(error);
  }
};

export const getOrganizerStats = async (req, res, next) => {
  try {
    const stats = await eventService.getOrganizerStats(req.user.id);
    return res.status(200).json({
      success: true,
      message: "Lấy thống kê ban tổ chức thành công.",
      data: { stats },
    });
  } catch (error) {
    return next(error);
  }
};