import * as customerService from "../services/customerService.js";

// POST /api/orders - Tạo đơn mua vé
export const createOrder = async (req, res, next) => {
  try {
    const data = await customerService.createOrder(req.body, req.user);
    return res.status(201).json({
      success: true,
      message: "Khởi tạo đơn mua vé thành công.",
      data,
    });
  } catch (error) {
    return next(error);
  }
};

// POST /api/orders/:id/verify-tx hoặc /api/orders/verify-tx
export const verifyOrder = async (req, res, next) => {
  try {
    const orderId = req.params.id || req.body.orderId;
    const data = await customerService.verifyAndConfirmOrder(
      orderId,
      req.body,
      req.user,
    );
    return res.status(200).json({
      success: true,
      message: "Thanh toán và phát hành vé NFT thành công!",
      data,
    });
  } catch (error) {
    return next(error);
  }
};

// GET /api/orders/:id - Chi tiết đơn hàng
export const getOrder = async (req, res, next) => {
  try {
    const order = await customerService.getOrderDetail(req.params.id);
    return res.status(200).json({
      success: true,
      data: { order },
    });
  } catch (error) {
    return next(error);
  }
};

