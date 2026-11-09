import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { ethers } from "ethers";
import User from "../models/User.js";
import Session from "../models/Session.js";

const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

//Hàm tạo token cho access và refresh token
const generateTokens = async (user, req) => {
  //Acess token(15m)
  const accessToken = jwt.sign(
    { id: user.id, role: user.role },
    JWT_ACCESS_SECRET,
    { expiresIn: "15m" },
  );
  // Refresh token(7d)
  const refreshToken = jwt.sign({ id: user.id }, JWT_REFRESH_SECRET, {
    expiresIn: "7d",
  });
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 ngày từ thời điểm hiện tại
  await Session.create({
    userId: user.id,
    refreshToken,
    expiresAt,
    userAgent: req.headers["user-agent"] || "Unknown Deviece",
    ipAddress: req.ip || req.connection.remoteAddress || "Unknown IP",
  });
  return { accessToken, refreshToken };
};
// POST /api/auth/register-Đăng ký tài khoản
export const register = async (req, res) => {
  try {
    const { email, password, fullName, role } = req.body;
    if (!email || !password || !fullName) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng điền đầy đủ email, mật khẩu và họ tên!",
      });
    }
    // Check duplicate người dùng thông qua email
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email này đã được sử dụng.",
      });
    }
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const assignedRole = role === "organizer" ? "organizer" : "customer";
    const newUser = await User.create({
      email,
      passwordHash,
      fullName,
      role: assignedRole,
    });
    const tokens = await generateTokens(newUser, req);
    return res.status(201).json({
      success: true,
      message: "Đăng ký thành công.",
      data: {
        ...tokens,
        user: {
          id: newUser.id,
          email: newUser.email,
          fullName: newUser.fullName,
          role: newUser.role,
        },
      },
    });
  } catch (error) {
    console.error("Error during registration:", error);
    return res.status(500).json({
      success: false,
      message: "Đã xảy ra lỗi khi đăng ký.",
    });
  }
};

// POST /api/auth/login-Đăng nhập
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng nhập email và mật khẩu.",
      });
    }
    const user = await User.findOne({ where: { email } });
    if (!user || !user.passwordHash) {
      return res.status(401).json({
        success: false,
        message: "Email hoặc mật khẩu không chính xác.",
      });
    }
    if (user.status === "suspended") {
      return res.status(403).json({
        success: false,
        message: "Tài khoản của bạn đã bị khóa. Vui lòng liên hệ hỗ trợ.",
      });
    }
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Email hoặc mật khẩu không chính xác.",
      });
    }
    const tokens = await generateTokens(user, req);
    return res.status(200).json({
      success: true,
      message: "Đăng nhập thành công!",
      data: {
        ...tokens,
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          walletAddress: user.walletAddress,
          avatarUrl: user.avatarUrl,
        },
      },
    });
  } catch (error) {
    console.error("Lỗi khi đăng nhập:", error);
    return res.status(500).json({
      success: false,
      message: "Đã xảy ra lỗi máy chủ khi đăng nhập.",
      error: error.message,
    });
  }
};
