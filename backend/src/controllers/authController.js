import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { ethers } from "ethers";
import User from "../models/User.js";
import Session from "../models/Session.js";

const JWT_ACCESS_SECRET =
  process.env.JWT_ACCESS_SECRET || "default_myproject_access_secret";
const JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET || "default_myproject_refresh_secret";

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
// GET /api/auth/nonce - Lấy nonce cho ví Ethereum
export const getNonce = async (req, res) => {
  try {
    const { wallet } = req.query;
    if (!wallet || !ethers.isAddress(wallet)) {
      return res.status(400).json({
        success: false,
        message: "Địa chỉ ví không hợp lệ.",
      });
    }
    const normalizedWallet = wallet.toLowerCase();
    const nonce = `BlockTickets-Auth-Nonce-${crypto.randomBytes(16).toString("hex")}-${Date.now()}`;
    let user = await User.findOne({
      where: { walletAddress: normalizedWallet },
    });
    if (user) {
      user.nonce = nonce;
      await user.save();
    }
    return res.status(200).json({
      success: true,
      message: "Tạo chuỗi nonce thành công.",
      data: {
        nonce,
        walletAddress: normalizedWallet,
      },
    });
  } catch (error) {
    console.error("Lỗi khi tạo chuỗi nonce:", error);
    return res.status(500).json({
      success: false,
      message: "Đã xảy ra lỗi máy chủ khi tạo chuỗi nonce.",
      error: error.message,
    });
  }
};
// POST /api/auth/verify-wallet - Xác thực ví Ethereum
export const verifyWallet = async (req, res) => {
  try {
    const { walletAddress, signature, nonce } = req.body;
    if (!walletAddress || !signature || !nonce) {
      return res.status(400).json({
        success: false,
        message: "Thiếu địa chỉ ví, chữ ký hoặc chuỗi nonce.",
      });
    }
    const normalizedWallet = walletAddress.toLowerCase();
    let recoveredAddress;
    try {
      recoveredAddress = ethers.verifyMessage(nonce, signature).toLowerCase();
    } catch (err) {
      return res.status(400).json({
        success: false,
        message: "Chữ ký mật mã không hợp lệ.",
      });
    }
    if (recoveredAddress !== normalizedWallet) {
      return res.status(401).json({
        success: false,
        message:
          "Xác thực chữ ký thất bại: Ví ký không trùng khớp với ví yêu cầu.",
      });
    }
    let user = await User.findOne({
      where: { walletAddress: normalizedWallet },
    });
    if (!user) {
      user = await User.create({
        email: `${normalizedWallet.substring(0, 8)}@blocktickets.local`,
        fullName: `Wallet User ${normalizedWallet.substring(0, 6)}`,
        walletAddress: normalizedWallet,
        role: "customer",
        nonce: null,
      });
    } else {
      user.nonce = null;
      await user.save();
    }
    if (user.status === "suspended") {
      return res.status(403).json({
        success: false,
        message: "Tài khoản liên kết với ví này đã bị khóa.",
      });
    }
    const tokens = await generateTokens(user, req);
    return res.status(200).json({
      success: true,
      message: "Đăng nhập bằng ví MetaMask thành công!",
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
    console.error("Lỗi khi xác minh ví:", error);
    return res.status(500).json({
      success: false,
      message: "Đã xảy ra lỗi máy chủ khi xác minh ví.",
      error: error.message,
    });
  }
};
// POST /api/auth/refresh-token - Làm mới access token bằng refresh token
export const refreshTokenHandler = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng cung cấp Refresh Token.",
      });
    }
    // Kiểm tra chữ ký và thời hạn Refresh Token
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
    } catch (err) {
      return res.status(401).json({
        success: false,
        message:
          "Refresh Token không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại.",
      });
    }
    // Tìm Session còn hiệu lực trong cơ sở dữ liệu
    const currentSession = await Session.findOne({
      where: {
        refreshToken,
        isValid: true,
      },
    });
    if (!currentSession) {
      return res.status(401).json({
        success: false,
        message: "Phiên đăng nhập đã bị hủy hoặc không tồn tại.",
      });
    }
    // Kiểm tra User
    const user = await User.findByPk(decoded.id);
    if (!user || user.status === "suspended") {
      return res.status(403).json({
        success: false,
        message: "Tài khoản không hợp lệ hoặc đã bị khóa.",
      });
    }
    // 4. Token Rotation: Hủy phiên cũ để bảo mật
    currentSession.isValid = false;
    await currentSession.save();
    // 5. Cấp cặp Token và Session hoàn toàn mới
    const tokens = await generateTokens(user, req);
    return res.status(200).json({
      success: true,
      message: "Gia hạn phiên đăng nhập thành công!",
      data: tokens,
    });
  } catch (error) {
    console.error("Lỗi khi gia hạn token:", error);
    return res.status(500).json({
      success: false,
      message: "Đã xảy ra lỗi máy chủ khi gia hạn token.",
      error: error.message,
    });
  }
};
// POST /api/auth/logout-Đăng xuất và hủy Refresh Token
export const logoutHandler = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      await Session.update({ isValid: false }, { where: { refreshToken } });
    }
    return res.status(200).json({
      success: true,
      message: "Đăng xuất thành công!",
    });
  } catch (error) {
    console.error("Lỗi khi đăng xuất:", error);
    return res.status(500).json({
      success: false,
      message: "Đã xảy ra lỗi máy chủ khi đăng xuất.",
      error: error.message,
    });
  }
};
//GET /api/auth/profile-Lấy thông tin hồ sơ người dùng
export const getProfile = async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      data: {
        user: req.user,
      },
    });
  } catch (error) {
    console.error("Lỗi khi lấy profile:", error);
    return res.status(500).json({
      success: false,
      message: "Đã xảy ra lỗi máy chủ khi lấy thông tin người dùng.",
      error: error.message,
    });
  }
};
