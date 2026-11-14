import express from "express";
import {
  protect,
  optionalProtect,
  authorize,
} from "../middleware/authMiddleware.js";
import { validate } from "../middleware/validateMiddleware.js";
import {
  eventIdParamSchema,
  listEventsQuerySchema,
  myEventsQuerySchema,
  createEventSchema,
  updateEventSchema,
  createTicketTypeSchema,
  publishEventSchema,
} from "../validators/eventValidator.js";
import {
  getPublicEvents,
  getMyEvents,
  getEventById,
  createEvent,
  updateEvent,
  createTicketType,
  submitForReview,
  publishEvent,
  getOrganizerStats,
} from "../controllers/eventController.js";

const router = express.Router();

// Public
router.get("/", validate(listEventsQuerySchema), getPublicEvents);

// Organizer (đặt trước /:id)
router.get(
  "/organizer/stats",
  protect,
  authorize("organizer", "admin"),
  getOrganizerStats,
);
router.get(
  "/organizer/my-events",
  protect,
  authorize("organizer", "admin"),
  validate(myEventsQuerySchema),
  getMyEvents,
);

// Public hoặc chủ sự kiện/Admin xem draft
router.get("/:id", optionalProtect, validate(eventIdParamSchema), getEventById);

// Organizer thao tác sự kiện của mình
router.use(protect, authorize("organizer", "admin"));
router.post("/", validate(createEventSchema), createEvent);
router.put("/:id", validate(updateEventSchema), updateEvent);
router.post(
  "/:id/ticket-types",
  validate(createTicketTypeSchema),
  createTicketType,
);
router.post(
  "/:id/submit-review",
  validate(eventIdParamSchema),
  submitForReview,
);
router.post("/:id/publish", validate(publishEventSchema), publishEvent);

export default router;
