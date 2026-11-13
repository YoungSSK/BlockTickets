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
import { authLimiter } from "../middleware/rateLimiter.js";
import { validate } from "../middleware/validateMiddleware.js";
import {
  registerSchema,
  loginSchema,
  nonceQuerySchema,
  verifyWalletSchema,
  refreshTokenSchema,
  logoutSchema,
} from "../validators/authValidator.js";

const router = express.Router();

// 1. Nhóm API công khai (Public Routes)
router.post("/register", authLimiter, validate(registerSchema), register);
router.post("/login", authLimiter, validate(loginSchema), login);
router.get("/nonce", authLimiter, validate(nonceQuerySchema), getNonce);
router.post(
  "/verify-wallet",
  authLimiter,
  validate(verifyWalletSchema),
  verifyWallet,
);
router.post("/refresh-token", validate(refreshTokenSchema), refreshTokenHandler);
router.post("/logout", validate(logoutSchema), logoutHandler);

// 2. Nhóm API yêu cầu đăng nhập (Private Routes)
router.get("/profile", protect, getProfile);

export default router;
