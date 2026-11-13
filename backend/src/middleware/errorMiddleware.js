/**
 * Middleware bắt lỗi 404 (Không tìm thấy endpoint)
 */
export const notFound = (req, res, next) => {
  const error = new Error(
    `Đường dẫn [${req.method}] ${req.originalUrl} không tồn tại trên hệ thống.`
  );
  res.status(404);
  next(error);
};

/**
 * Middleware xử lý lỗi toàn cục (Global Error Handler)
 */
export const errorHandler = (err, req, res, next) => {
  const statusCode =
    err.statusCode || (res.statusCode === 200 ? 500 : res.statusCode);

  if (statusCode >= 500) {
    console.error(`💥 Lỗi máy chủ: ${err.message}`);
  }

  res.status(statusCode).json({
    success: false,
    message: err.message || "Lỗi máy chủ nội bộ",
    stack: process.env.NODE_ENV === "production" ? null : err.stack,
  });
};

