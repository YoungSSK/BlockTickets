import User from "../models/User.js";
import { AppError } from "../utils/AppError.js";
import {
  serializeUser,
  verifyAndConsumeWalletNonce,
} from "./authService.js";

export const getUserProfile = (user) => serializeUser(user);

export const updateUserProfile = async (user, { fullName, avatarUrl }) => {
  if (fullName !== undefined) user.fullName = fullName;
  if (avatarUrl !== undefined) user.avatarUrl = avatarUrl;

  await user.save();
  return serializeUser(user);
};

export const linkWalletToUser = async (
  user,
  { walletAddress, signature, nonce },
) => {
  if (user.walletAddress) {
    throw new AppError("Tài khoản này đã liên kết ví blockchain rồi.", 400);
  }

  const normalizedInput = walletAddress.toLowerCase();
  const existingOwner = await User.findOne({
    where: { walletAddress: normalizedInput },
  });

  if (existingOwner && existingOwner.id !== user.id) {
    throw new AppError(
      "Địa chỉ ví này đã được liên kết với tài khoản khác.",
      409,
    );
  }

  const { normalizedWallet } = await verifyAndConsumeWalletNonce({
    walletAddress,
    signature,
    nonce,
  });

  user.walletAddress = normalizedWallet;
  await user.save();

  return serializeUser(user);
};
