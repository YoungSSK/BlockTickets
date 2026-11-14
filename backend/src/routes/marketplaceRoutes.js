import express from "express";
import { optionalProtect, protect } from "../middleware/authMiddleware.js";
import {
  getListings,
  validatePrice,
  syncListing,
  syncPurchase,
  cancelListing,
} from "../controllers/marketplaceController.js";

const router = express.Router();

// Public: Xem danh sách vé niêm yết & kiểm tra trần giá 120%
router.get("/listings", getListings);
router.post("/validate-price", validatePrice);

// Yêu cầu xác thực / người dùng tương tác ví
router.post("/sync-listing", optionalProtect, syncListing);
router.post("/sync-purchase", optionalProtect, syncPurchase);
router.post("/cancel-listing/:id", optionalProtect, cancelListing);

export default router;

