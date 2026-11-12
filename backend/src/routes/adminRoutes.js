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
  approveEvent,
  rejectEvent,
  cancelEvent,
} from "../controllers/adminController.js";

const router = express.Router();

router.use(protect, authorize("admin"));
router.get("/pending-events", getPendingEvents);
router.patch("/events/:id/approve", validate(eventIdParamSchema), approveEvent);
router.patch("/events/:id/reject", validate(rejectEventSchema), rejectEvent);
router.patch("/events/:id/cancel", validate(adminHideEventSchema), cancelEvent);

export default router;
