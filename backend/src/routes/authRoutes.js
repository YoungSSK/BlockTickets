import express from "express";
import {
  register,
  login,
  getNonce,
  verifyWallet,
  refreshTokenHandler,
  logoutHandler,
  getProfile,
} from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();
// 1. Nhóm API công khai (Public Routes)
router.post("/register", register);
router.post("/login", login);
router.get("/nonce", getNonce);
router.post("/verify-wallet", verifyWallet);
router.post("/refresh-token", refreshTokenHandler);
router.post("/logout", logoutHandler);

// 2. Nhóm API yêu cầu đăng nhập (Private Routes)
router.get("/profile", protect, getProfile);
export default router;
