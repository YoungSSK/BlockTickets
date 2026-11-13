import express from "express";
import {
  optionalProtect,
  protect,
  authorize,
} from "../middleware/authMiddleware.js";
import {
  getMyTickets,
  getTicket,
  getTicketQRCode,
  transferTicket,
  listTicketForResale,
  getMarketplaceListings,
  cancelResaleListing,
  buyResaleTicket,
  checkInTicket,
} from "../controllers/ticketController.js";

const router = express.Router();

// 1. Chợ vé thứ cấp (Marketplace BE-08)
router.get("/marketplace", getMarketplaceListings);
router.delete("/:id/resale", optionalProtect, cancelResaleListing);
router.post("/:id/buy-resale", optionalProtect, buyResaleTicket);

// 2. Soát vé Check-in tại cổng (BE-09)
router.post("/check-in", optionalProtect, checkInTicket);

// 3. Quản lý vé cá nhân
router.get("/my-tickets", optionalProtect, getMyTickets);
router.get("/:id", optionalProtect, getTicket);
router.get("/:id/qr-code", optionalProtect, getTicketQRCode);
router.post("/:id/transfer", optionalProtect, transferTicket);
router.post("/:id/resale", optionalProtect, listTicketForResale);

export default router;
