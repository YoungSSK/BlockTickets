import express from "express";
import { protect, authorize } from "../middleware/authMiddleware.js";
import { validate } from "../middleware/validateMiddleware.js";
import {
  eventIdParamSchema,
  rejectEventSchema,
  adminHideEventSchema,
} from "../validators/eventValidator.js";
import {
  getPendingEvents,
  getAllEvents,
  approveEvent,
  rejectEvent,
  cancelEvent,
  getAdminMetrics,
  listUsers,
  updateUserStatus,
  updateUserRole,
  listAuditLogs,
} from "../controllers/adminController.js";

const router = express.Router();

router.use(protect, authorize("admin"));

// 1. Thống kê số liệu hệ thống
router.get("/metrics", getAdminMetrics);

// 2. Phê duyệt & Quản trị sự kiện
router.get("/pending-events", getPendingEvents);
router.get("/events", getAllEvents);
router.patch("/events/:id/approve", validate(eventIdParamSchema), approveEvent);
router.patch("/events/:id/reject", validate(rejectEventSchema), rejectEvent);
router.patch("/events/:id/cancel", validate(adminHideEventSchema), cancelEvent);

// 3. Quản lý người dùng hệ thống
router.get("/users", listUsers);
router.patch("/users/:id/status", updateUserStatus);
router.patch("/users/:id/role", updateUserRole);

// 4. Lịch sử nhật ký kiểm toán
router.get("/audit-logs", listAuditLogs);

export default router;
