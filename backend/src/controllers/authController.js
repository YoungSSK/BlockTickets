import {
  registerUser,
  loginUser,
  issueWalletNonce,
  refreshUserTokens,
  logoutSession,
} from "../services/authService.js";
import { getUserProfile } from "../services/userService.js";
import { AppError } from "../utils/AppError.js";

const REFRESH_COOKIE_NAME = "refreshToken";
const REFRESH_COOKIE_MAX_AGE = 30 * 24 * 60 * 60 * 1000; // 30 ngày

const getRefreshCookieOptions = () => {
  const isProd = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    path: "/api/auth",
    maxAge: REFRESH_COOKIE_MAX_AGE,
  };
};

const clearRefreshCookie = (res) => {
  const isProd = process.env.NODE_ENV === "production";
  res.clearCookie(REFRESH_COOKIE_NAME, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    path: "/api/auth",
  });
};

const getRequestMeta = (req) => ({
  userAgent: req.headers["user-agent"] || "Unknown Device",
  ipAddress: req.ip || req.socket?.remoteAddress || "Unknown IP",
});

// POST /api/auth/register - Đăng ký tài khoản
export const register = async (req, res, next) => {
  try {
    const { refreshToken, ...safeData } = await registerUser(
      req.body,
      getRequestMeta(req),
    );
    res.cookie(REFRESH_COOKIE_NAME, refreshToken, getRefreshCookieOptions());
    return res.status(201).json({
      success: true,
      message: "Đăng ký thành công.",
      data: safeData,
    });
  } catch (error) {
    return next(error);
  }
};

// POST /api/auth/login - Đăng nhập bằng Email & Mật khẩu
export const login = async (req, res, next) => {
  try {
    const { refreshToken, ...safeData } = await loginUser(
      req.body,
      getRequestMeta(req),
    );
    res.cookie(REFRESH_COOKIE_NAME, refreshToken, getRefreshCookieOptions());
    return res.status(200).json({
      success: true,
      message: "Đăng nhập thành công!",
      data: safeData,
    });
  } catch (error) {
    return next(error);
  }
};

// GET /api/auth/nonce - Lấy nonce để liên kết ví Ethereum (chỉ dành cho tài khoản đã đăng nhập)
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

// POST /api/auth/refresh-token - Làm mới access token từ HttpOnly Cookie
export const refreshTokenHandler = async (req, res, next) => {
  try {
    const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME];
    if (!refreshToken) {
      clearRefreshCookie(res);
      throw new AppError(
        "Không tìm thấy phiên đăng nhập (Refresh Token). Vui lòng đăng nhập lại.",
        401,
      );
    }

    const { accessToken, refreshToken: newRefreshToken } =
      await refreshUserTokens(refreshToken, getRequestMeta(req));

    res.cookie(REFRESH_COOKIE_NAME, newRefreshToken, getRefreshCookieOptions());
    return res.status(200).json({
      success: true,
      message: "Gia hạn phiên đăng nhập thành công!",
      data: { accessToken },
    });
  } catch (error) {
    clearRefreshCookie(res);
    return next(error);
  }
};

// POST /api/auth/logout - Đăng xuất, thu hồi Refresh Token và xóa HttpOnly Cookie
export const logoutHandler = async (req, res, next) => {
  try {
    const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME];
    await logoutSession(refreshToken);
    clearRefreshCookie(res);
    return res.status(200).json({
      success: true,
      message: "Đăng xuất thành công!",
    });
  } catch (error) {
    clearRefreshCookie(res);
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
