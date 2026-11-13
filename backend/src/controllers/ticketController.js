import * as customerService from "../services/customerService.js";

// GET /api/tickets/my-tickets - Lấy vé của tôi
export const getMyTickets = async (req, res, next) => {
  try {
    const tickets = await customerService.getMyTickets(
      req.user,
      req.query.wallet,
    );
    return res.status(200).json({
      success: true,
      message: "Lấy danh sách vé thành công.",
      data: { tickets },
    });
  } catch (error) {
    return next(error);
  }
};

// GET /api/tickets/:id - Chi tiết vé
export const getTicket = async (req, res, next) => {
  try {
    const ticket = await customerService.getTicketDetail(req.params.id);
    return res.status(200).json({
      success: true,
      data: { ticket },
    });
  } catch (error) {
    return next(error);
  }
};

// GET /api/tickets/:id/qr-code - Sinh mã QR check-in động HMAC
export const getTicketQRCode = async (req, res, next) => {
  try {
    const data = await customerService.generateDynamicQR(
      req.params.id,
      req.user,
    );
    return res.status(200).json({
      success: true,
      message: "Tạo mã QR động thành công.",
      data,
    });
  } catch (error) {
    return next(error);
  }
};

// POST /api/tickets/:id/transfer - Chuyển nhượng vé
export const transferTicket = async (req, res, next) => {
  try {
    const ticket = await customerService.transferTicket(
      req.params.id,
      req.body,
      req.user,
    );
    return res.status(200).json({
      success: true,
      message: "Chuyển nhượng vé thành công!",
      data: { ticket },
    });
  } catch (error) {
    return next(error);
  }
};

// POST /api/tickets/:id/resale - Niêm yết bán lại (Trần giá 120%)
export const listTicketForResale = async (req, res, next) => {
  try {
    const data = await customerService.listTicketForResale(
      req.params.id,
      req.body,
      req.user,
    );
    return res.status(200).json({
      success: true,
      message: "Niêm yết vé bán lại thành công trên chợ thứ cấp!",
      data,
    });
  } catch (error) {
    return next(error);
  }
};
// GET /api/tickets/marketplace - Lấy danh sách vé đang rao bán trên chợ thứ cấp (BE-08)
export const getMarketplaceListings = async (req, res, next) => {
  try {
    const data = await customerService.getMarketplaceListings(req.query);
    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    return next(error);
  }
};
// DELETE /api/tickets/:id/resale - Hủy niêm yết vé bán lại (BE-08)
export const cancelResaleListing = async (req, res, next) => {
  try {
    const listing = await customerService.cancelResaleListing(
      req.params.id,
      req.user,
    );
    return res.status(200).json({
      success: true,
      message: "Đã hủy niêm yết vé trên Marketplace thành công.",
      data: { listing },
    });
  } catch (error) {
    return next(error);
  }
};
// POST /api/tickets/:id/buy-resale - Mua lại vé trên Marketplace (BE-08)
export const buyResaleTicket = async (req, res, next) => {
  try {
    const data = await customerService.buyResaleTicket(
      req.params.id,
      req.body,
      req.user,
    );
    return res.status(200).json({
      success: true,
      message:
        "Mua lại vé thành công! Quyền sở hữu vé đã được chuyển giao cho bạn.",
      data,
    });
  } catch (error) {
    return next(error);
  }
};
// POST /api/tickets/check-in - Soát vé bằng mã QR tại cổng (BE-09)
export const checkInTicket = async (req, res, next) => {
  try {
    const result = await customerService.checkInTicket(req.body, req.user);
    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
};
