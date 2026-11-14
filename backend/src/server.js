import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import sequelize, { connectDB } from "./config/db.js";
import "./models/index.js";
import { notFound, errorHandler } from "./middleware/errorMiddleware.js";
import { apiLimiter } from "./middleware/rateLimiter.js";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import eventRoutes from "./routes/eventRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import ticketRoutes from "./routes/ticketRoutes.js";
import marketplaceRoutes from "./routes/marketplaceRoutes.js";
import checkInRoutes from "./routes/checkInRoutes.js";
const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

// Cấu hình Middleware toàn cục
app.use(helmet());
app.use(
  cors({
    origin: CLIENT_URL,
    credentials: true,
  }),
);
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.use("/api", apiLimiter);

// Kết nối cơ sở dữ liệu & đồng bộ bảng
connectDB().then(async () => {
  try {
    // sequelize.sync() tự động tạo bảng nếu chưa có, không tạo trùng lặp index key
    await sequelize.sync();
    console.log("✅ Toàn bộ bảng trên Aiven Cloud MySQL đã được đồng bộ!");
  } catch (err) {
    console.error("❌ Lỗi đồng bộ database:", err.message);
  }
});

// Endpoint kiểm tra sức khỏe hệ thống
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message:
      "Máy chủ BlockTickets API (Aiven MySQL) đang hoạt động bình thường",
    timestamp: new Date().toISOString(),
  });
});

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "BlockTickets API - Running with Aiven Cloud MySQL",
  });
});

// Routes nghiệp vụ
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/tickets", ticketRoutes);
app.use("/api/marketplace", marketplaceRoutes);
app.use("/api/check-in", checkInRoutes);
// Middleware
app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server đang chạy tại: http://localhost:${PORT}`);
});
