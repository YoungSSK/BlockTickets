import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import sequelize, { connectDB } from "./config/db.js";
import "./models/index.js";
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

// Middleware
app.use(
  cors({
    origin: CLIENT_URL,
    credentials: true,
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Kết nối cơ sở dữ liệu & đồng bộ bảng
connectDB().then(async () => {
  try {
    // alter: true giúp tự động cập nhật bảng khi bạn thêm model mới
    await sequelize.sync({ alter: true });
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

app.listen(PORT, () => {
  console.log(`🚀 Server đang chạy tại: http://localhost:${PORT}`);
});
