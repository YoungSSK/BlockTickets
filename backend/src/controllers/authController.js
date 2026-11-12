import {
  registerUser,
  loginUser,
  issueWalletNonce,
  loginWithWallet,
  refreshUserTokens,
  logoutSession,
} from "../services/authService.js";
import { getUserProfile } from "../services/userService.js";

const getRequestMeta = (req) => ({
  userAgent: req.headers["user-agent"] || "Unknown Device",
  ipAddress: req.ip || req.socket?.remoteAddress || "Unknown IP",
});

// POST /api/auth/register - Đăng ký tài khoản
export const register = async (req, res, next) => {
  try {
    const data = await registerUser(req.body, getRequestMeta(req));
    return res.status(201).json({
      success: true,
      message: "Đăng ký thành công.",
      data,
    });
  } catch (error) {
    return next(error);
  }
};

// POST /api/auth/login - Đăng nhập
export const login = async (req, res, next) => {
  try {
    const data = await loginUser(req.body, getRequestMeta(req));
    return res.status(200).json({
      success: true,
      message: "Đăng nhập thành công!",
      data,
    });
  } catch (error) {
    return next(error);
  }
};

// GET /api/auth/nonce - Lấy nonce cho ví Ethereum
export const getNonce = async (req, res, next) => {
  try {
    const data = await issueWalletNonce(req.query.wallet);
    return res.status(200).json({
      success: true,
      message: "Tạo chuỗi nonce thành công.",
      data,
    });
  } catch (error) {
    return next(error);
  }
};

// POST /api/auth/verify-wallet - Xác thực ví Ethereum
export const verifyWallet = async (req, res, next) => {
  try {
    const data = await loginWithWallet(req.body, getRequestMeta(req));
    return res.status(200).json({
      success: true,
      message: "Đăng nhập bằng ví MetaMask thành công!",
      data,
    });
  } catch (error) {
    return next(error);
  }
};

// POST /api/auth/refresh-token - Làm mới access token bằng refresh token
export const refreshTokenHandler = async (req, res, next) => {
  try {
    const tokens = await refreshUserTokens(
      req.body.refreshToken,
      getRequestMeta(req),
    );
    return res.status(200).json({
      success: true,
      message: "Gia hạn phiên đăng nhập thành công!",
      data: tokens,
    });
  } catch (error) {
    return next(error);
  }
};

// POST /api/auth/logout - Đăng xuất và hủy Refresh Token
export const logoutHandler = async (req, res, next) => {
  try {
    await logoutSession(req.body?.refreshToken);
    return res.status(200).json({
      success: true,
      message: "Đăng xuất thành công!",
    });
  } catch (error) {
    return next(error);
  }
};

// GET /api/auth/profile - Lấy thông tin hồ sơ người dùng
export const getProfile = async (req, res, next) => {
  try {
    return res.status(200).json({
      success: true,
      data: {
        user: getUserProfile(req.user),
      },
    });
  } catch (error) {
    return next(error);
  }
};
