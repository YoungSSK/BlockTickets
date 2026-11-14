import express from "express";
import { optionalProtect, protect } from "../middleware/authMiddleware.js";
import {
  verifyTicket,
  confirmCheckIn,
  getStats,
} from "../controllers/checkInController.js";

const router = express.Router();

// Soát vé: kiểm tra mã QR vé
router.post("/verify", optionalProtect, verifyTicket);

// Xác nhận vé hợp lệ và ghi nhận check-in
router.post("/confirm", optionalProtect, confirmCheckIn);

// Thống kê tiến độ check-in sự kiện
router.get("/stats/:eventId", optionalProtect, getStats);

export default router;

