import express from "express";
import { optionalProtect, protect } from "../middleware/authMiddleware.js";
import {
  getMyTickets,
  getTicket,
  getTicketQRCode,
  transferTicket,
  listTicketForResale,
} from "../controllers/ticketController.js";

const router = express.Router();

router.get("/my-tickets", optionalProtect, getMyTickets);
router.get("/:id", optionalProtect, getTicket);
router.get("/:id/qr-code", optionalProtect, getTicketQRCode);
router.post("/:id/transfer", optionalProtect, transferTicket);
router.post("/:id/resale", optionalProtect, listTicketForResale);

export default router;

