import { Sequelize } from "sequelize";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../.env") });
dotenv.config();

// Khởi tạo Sequelize kết nối Cloud MySQL Aiven
const sequelize = new Sequelize(
  process.env.DB_NAME || "defaultdb",
  process.env.DB_USER || "avnadmin",
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 20441,
    dialect: "mysql",
    logging: false, // Tắt log câu lệnh SQL dài dòng trên terminal
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false, // Bắt buộc để kết nối an toàn với Cloud Aiven
      },
    },
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
    define: {
      timestamps: true,
    },
  }
);

/**
 * Hàm kiểm tra kết nối tới Cloud MySQL
 */
export const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ Kết nối Aiven Cloud MySQL thành công!");
  } catch (error) {
    console.error("❌ Không thể kết nối tới Cloud MySQL:", error.message);
    process.exit(1);
  }
};

export default sequelize;