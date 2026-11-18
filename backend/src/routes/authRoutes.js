import express from "express";
import {
  register,
  login,
  getNonce,
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
} from "../validators/authValidator.js";

const router = express.Router();

// 1. Nhóm API công khai (Public Routes)
router.post("/register", authLimiter, validate(registerSchema), register);
router.post("/login", authLimiter, validate(loginSchema), login);
router.post("/refresh-token", refreshTokenHandler);
router.post("/logout", logoutHandler);

// 2. Nhóm API yêu cầu đăng nhập (Private Routes)
router.get("/nonce", protect, authLimiter, validate(nonceQuerySchema), getNonce);
router.get("/profile", protect, getProfile);

export default router;
