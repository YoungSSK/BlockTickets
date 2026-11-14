import jwt from "jsonwebtoken";
import User from "../models/User.js";

const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;
if (!JWT_ACCESS_SECRET) {
  throw new Error("Thiếu biến môi trường JWT_ACCESS_SECRET trong file .env");
}
//Middleware bảo vệ router
export const protect = async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, JWT_ACCESS_SECRET);
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
      if (error.name === "TokenExpiredError") {
        console.warn("Lưu ý: Token xác thực đã hết hạn (TokenExpiredError).");
        return res.status(401).json({
          success: false,
          code: "TOKEN_EXPIRED",
          message: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại hoặc làm mới token.",
        });
      }
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
    return next();
  };
};

export const optionalProtect = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    req.user = null;
    return next();
  }
  try {
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    const user = await User.findByPk(decoded.id, {
      attributes: { exclude: ["passwordHash"] },
    });
    if (user && user.status === "active") {
      req.user = user;
    } else {
      req.user = null;
    }
  } catch (error) {
    // Đối với các route công khai (optional), nếu token đã hết hạn hoặc không hợp lệ,
    // coi như khách vãng lai để không chặn việc tải trang hoặc xem sự kiện.
    req.user = null;
  }
  return next();
};
