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

export const createTicketType = async (req, res, next) => {
  try {
    const ticketType = await eventService.addTicketTypeToEvent(
      req.validated.params.id,
      req.user.id,
      req.body,
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

export const submitForReview = async (req, res, next) => {
  try {
    const event = await eventService.submitEventForReview(
      req.validated.params.id,
      req.user.id,
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