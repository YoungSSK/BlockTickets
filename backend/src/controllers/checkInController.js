import * as checkInService from "../services/checkInService.js";

/**
 * Controller kiểm tra tính hợp lệ của mã QR soát vé
 */
export const verifyTicket = async (req, res, next) => {
  try {
    const data = await checkInService.verifyTicketQR(req.body, req.user);
    return res.status(200).json({
      success: true,
      data,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Controller xác nhận check-in vé (đổi trạng thái isUsed = true)
 */
export const confirmCheckIn = async (req, res, next) => {
  try {
    const data = await checkInService.confirmCheckIn(req.body, req.user);
    return res.status(200).json({
      success: true,
      message: "Check-in vé thành công!",
      data,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Controller lấy số liệu thống kê check-in thời gian thực theo sự kiện
 */
export const getStats = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const data = await checkInService.getCheckInStats(eventId, req.user);
    return res.status(200).json({
      success: true,
      data,
    });
  } catch (err) {
    next(err);
  }
};

