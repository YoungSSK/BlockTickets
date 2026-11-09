import jwt from "jsonwebtoken";
import User from "../models/User.js";

//Middleware bảo vệ router
export const protect = async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findByPk(decoded.id, {
        attributes: { exclude: ["passwordHash"] },
      });
      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Người dùng không tồn tại hoặc tài khoản đã bị xóa",
        });
      }
      if (user.status === "suspended") {
        return res.status(403).json({
          success: false,
          message:
            "Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên. ",
        });
      }
      req.user = user;
      return next();
    } catch (error) {
      console.error("Lỗi xác thực Token: ", error.message);
      return res.status(401).json({
        success: false,
        message: "Phiên đăng nhập không hợp lệ hoặc token đã hết hạn.",
      });
    }
  }
  if (!token) {
    return res.status(401).json({
      success: false,
      message:
        "Không tìm thấy token xác thực trong Header. Vui lòng đăng nhập.",
    });
  }
};
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Bạn không có quyền thực hiện thao tác này. Quyền yêu cầu: [${roles.join(", ")}].`,
      });
    }
  };
};
