import { Op } from "sequelize";
import User from "../models/User.js";
import sequelize from "../config/db.js";
import { AppError } from "../utils/AppError.js";
import {
  serializeUser,
  verifyAndConsumeWalletNonce,
} from "./authService.js";

export const getUserProfile = (user) => serializeUser(user);

export const updateUserProfile = async (user, { fullName, avatarUrl }) => {
  if (fullName !== undefined) {
    const trimmedFullName = fullName.trim();
    if (!trimmedFullName || trimmedFullName.length < 2) {
      throw new AppError("Họ tên phải có ít nhất 2 ký tự.", 400);
    }
    if (trimmedFullName.toLowerCase() !== user.fullName.toLowerCase()) {
      const existingName = await User.findOne({
        where: {
          [Op.and]: [
            sequelize.where(
              sequelize.fn("LOWER", sequelize.col("full_name")),
              trimmedFullName.toLowerCase()
            ),
            { id: { [Op.ne]: user.id } },
          ],
        },
      });
      if (existingName) {
        throw new AppError(
          "Họ và tên / Tên tổ chức này đã được sử dụng. Vui lòng chọn tên khác.",
          400
        );
      }
    }
    user.fullName = trimmedFullName;
  }
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
