import {
  getUserProfile,
  updateUserProfile,
  linkWalletToUser,
} from "../services/userService.js";

// GET /api/users/profile
export const getMyProfile = async (req, res, next) => {
  try {
    return res.status(200).json({
      success: true,
      message: "Lấy thông tin hồ sơ thành công.",
      data: {
        user: getUserProfile(req.user),
      },
    });
  } catch (error) {
    return next(error);
  }
};

// PUT /api/users/profile
export const updateMyProfile = async (req, res, next) => {
  try {
    const user = await updateUserProfile(req.user, req.body);
    return res.status(200).json({
      success: true,
      message: "Cập nhật hồ sơ thành công.",
      data: { user },
    });
  } catch (error) {
    return next(error);
  }
};

// POST /api/users/link-wallet
export const linkWallet = async (req, res, next) => {
  try {
    const user = await linkWalletToUser(req.user, req.body);
    return res.status(200).json({
      success: true,
      message: "Liên kết ví MetaMask thành công!",
      data: { user },
    });
  } catch (error) {
    return next(error);
  }
};
