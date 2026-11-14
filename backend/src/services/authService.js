import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { ethers } from "ethers";
import User from "../models/User.js";
import Session from "../models/Session.js";
import { AppError } from "../utils/AppError.js";

const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
if (!JWT_ACCESS_SECRET || !JWT_REFRESH_SECRET) {
  throw new Error(
    "Thiếu biến môi trường JWT_ACCESS_SECRET hoặc JWT_REFRESH_SECRET trong file .env",
  );
}

const ACCESS_TOKEN_TTL = process.env.JWT_ACCESS_EXPIRES_IN || "7d";
const REFRESH_TOKEN_TTL = process.env.JWT_REFRESH_EXPIRES_IN || "30d";
const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const NONCE_TTL_MS = 5 * 60 * 1000;

// Lưu tạm nonce cho ví chưa tồn tại trong bảng users (tránh ghi user rác khi chỉ mới lấy nonce)
const pendingWalletNonces = new Map();

const cleanupExpiredNonces = () => {
  const now = Date.now();
  for (const [wallet, record] of pendingWalletNonces.entries()) {
    if (record.expiresAt <= now) {
      pendingWalletNonces.delete(wallet);
    }
  }
};

export const serializeUser = (user) => ({
  id: user.id,
  email: user.email,
  fullName: user.fullName,
  role: user.role,
  walletAddress: user.walletAddress ?? null,
  avatarUrl: user.avatarUrl ?? "",
  status: user.status,
});

const generateTokensAndSession = async (user, meta = {}) => {
  const accessToken = jwt.sign(
    { id: user.id, role: user.role },
    JWT_ACCESS_SECRET,
    { expiresIn: ACCESS_TOKEN_TTL },
  );

  const refreshToken = jwt.sign({ id: user.id }, JWT_REFRESH_SECRET, {
    expiresIn: REFRESH_TOKEN_TTL,
  });

  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_MS);
  await Session.create({
    userId: user.id,
    refreshToken,
    expiresAt,
    userAgent: meta.userAgent || "Unknown Device",
    ipAddress: meta.ipAddress || "Unknown IP",
  });

  return { accessToken, refreshToken };
};

export const registerUser = async ({ email, password, fullName, role }, meta) => {
  const normalizedEmail = email.trim().toLowerCase();

  const existingUser = await User.findOne({ where: { email: normalizedEmail } });
  if (existingUser) {
    throw new AppError("Email này đã được sử dụng.", 400);
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);
  const assignedRole = role === "organizer" ? "organizer" : "customer";

  const newUser = await User.create({
    email: normalizedEmail,
    passwordHash,
    fullName: fullName.trim(),
    role: assignedRole,
  });

  const tokens = await generateTokensAndSession(newUser, meta);
  return {
    ...tokens,
    user: serializeUser(newUser),
  };
};

export const loginUser = async ({ email, password }, meta) => {
  const normalizedEmail = email.trim().toLowerCase();
  const user = await User.findOne({ where: { email: normalizedEmail } });

  if (!user || !user.passwordHash) {
    throw new AppError("Email hoặc mật khẩu không chính xác.", 401);
  }

  if (user.status === "suspended") {
    throw new AppError(
      "Tài khoản của bạn đã bị khóa. Vui lòng liên hệ hỗ trợ.",
      403,
    );
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    throw new AppError("Email hoặc mật khẩu không chính xác.", 401);
  }

  const tokens = await generateTokensAndSession(user, meta);
  return {
    ...tokens,
    user: serializeUser(user),
  };
};

export const issueWalletNonce = async (walletAddress) => {
  cleanupExpiredNonces();
  const normalizedWallet = walletAddress.toLowerCase();
  const nonce = `BlockTickets-Auth-Nonce-${crypto.randomBytes(16).toString("hex")}-${Date.now()}`;

  const user = await User.findOne({ where: { walletAddress: normalizedWallet } });
  if (user) {
    user.nonce = nonce;
    await user.save();
    pendingWalletNonces.delete(normalizedWallet);
  } else {
    pendingWalletNonces.set(normalizedWallet, {
      nonce,
      expiresAt: Date.now() + NONCE_TTL_MS,
    });
  }

  return {
    nonce,
    walletAddress: normalizedWallet,
  };
};

export const verifyAndConsumeWalletNonce = async ({
  walletAddress,
  signature,
  nonce,
}) => {
  const normalizedWallet = walletAddress.toLowerCase();

  const issuedAt = Number(String(nonce).split("-").pop());
  if (!Number.isFinite(issuedAt) || Date.now() - issuedAt > NONCE_TTL_MS) {
    throw new AppError("Nonce đã hết hạn. Vui lòng lấy nonce mới.", 401);
  }

  const walletUser = await User.findOne({
    where: { walletAddress: normalizedWallet },
  });

  if (walletUser) {
    if (!walletUser.nonce || walletUser.nonce !== nonce) {
      throw new AppError("Nonce không hợp lệ hoặc đã được sử dụng.", 401);
    }
  } else {
    const pending = pendingWalletNonces.get(normalizedWallet);
    if (!pending || pending.nonce !== nonce || pending.expiresAt <= Date.now()) {
      throw new AppError("Nonce không hợp lệ hoặc đã hết hạn.", 401);
    }
  }

  let recoveredAddress;
  try {
    recoveredAddress = ethers.verifyMessage(nonce, signature).toLowerCase();
  } catch {
    throw new AppError("Chữ ký mật mã không hợp lệ.", 400);
  }

  if (recoveredAddress !== normalizedWallet) {
    throw new AppError(
      "Xác thực chữ ký thất bại: Ví ký không trùng khớp với ví yêu cầu.",
      401,
    );
  }

  // Hủy nonce nguyên tử để chặn replay hoặc 2 request song song
  if (walletUser) {
    const [affectedRows] = await User.update(
      { nonce: null },
      { where: { id: walletUser.id, nonce } },
    );
    if (affectedRows === 0) {
      throw new AppError("Nonce đã được sử dụng.", 401);
    }
  } else if (!pendingWalletNonces.delete(normalizedWallet)) {
    throw new AppError("Nonce đã được sử dụng.", 401);
  }

  return { normalizedWallet, walletUser };
};

export const loginWithWallet = async (
  { walletAddress, signature, nonce },
  meta,
) => {
  const { normalizedWallet, walletUser } = await verifyAndConsumeWalletNonce({
    walletAddress,
    signature,
    nonce,
  });

  let user = walletUser;
  if (!user) {
    user = await User.create({
      email: `${normalizedWallet}@wallet.blocktickets.local`,
      fullName: `Wallet User ${normalizedWallet.substring(0, 6)}`,
      walletAddress: normalizedWallet,
      role: "customer",
      nonce: null,
    });
  }

  if (user.status === "suspended") {
    throw new AppError("Tài khoản liên kết với ví này đã bị khóa.", 403);
  }

  const tokens = await generateTokensAndSession(user, meta);
  return {
    ...tokens,
    user: serializeUser(user),
  };
};

export const refreshUserTokens = async (refreshToken, meta) => {
  let decoded;
  try {
    decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
  } catch {
    throw new AppError(
      "Refresh Token không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại.",
      401,
    );
  }

  const currentSession = await Session.findOne({
    where: {
      refreshToken,
      isValid: true,
    },
  });

  if (!currentSession || currentSession.expiresAt <= new Date()) {
    throw new AppError("Phiên đăng nhập đã bị hủy hoặc đã hết hạn.", 401);
  }

  const user = await User.findByPk(decoded.id);
  if (!user || user.status === "suspended") {
    throw new AppError("Tài khoản không hợp lệ hoặc đã bị khóa.", 403);
  }

  // Token Rotation nguyên tử: chỉ 1 request duy nhất được phép xoay vòng session cũ
  const [revokedCount] = await Session.update(
    { isValid: false },
    { where: { id: currentSession.id, isValid: true } },
  );
  if (revokedCount === 0) {
    throw new AppError("Phiên đăng nhập đã được sử dụng trước đó.", 401);
  }

  return generateTokensAndSession(user, meta);
};

export const logoutSession = async (refreshToken) => {
  if (!refreshToken) return;
  await Session.update({ isValid: false }, { where: { refreshToken } });
};
