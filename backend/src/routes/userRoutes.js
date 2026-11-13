import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { validate } from "../middleware/validateMiddleware.js";
import {
  updateProfileSchema,
  linkWalletSchema,
} from "../validators/authValidator.js";
import {
  getMyProfile,
  updateMyProfile,
  linkWallet,
} from "../controllers/userController.js";

const router = express.Router();

router.use(protect);
router.get("/profile", getMyProfile);
router.put("/profile", validate(updateProfileSchema), updateMyProfile);
router.post("/link-wallet", validate(linkWalletSchema), linkWallet);

export default router;
