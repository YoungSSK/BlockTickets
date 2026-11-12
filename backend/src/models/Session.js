import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const Session = sequelize.define(
  "Session",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "user_id",
      references: {
        model: "users",
        key: "id",
      },
    },
    refreshToken: {
      type: DataTypes.STRING(500),
      allowNull: false,
      unique: true,
      field: "refresh_token",
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: "expires_at",
    },
    isValid: {
      type: DataTypes.BOOLEAN,
      defaultValue: true, // true: phiên còn hiệu lực, false: đã đăng xuất / bị hủy
      field: "is_valid",
    },
    userAgent: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: "user_agent", // Lưu trình duyệt/thiết bị đăng nhập (vd: Chrome trên Windows)
    },
    ipAddress: {
      type: DataTypes.STRING(45),
      allowNull: true,
      field: "ip_address",
    },
  },
  {
    tableName: "sessions",
    timestamps: true,
    underscored: true,
    indexes: [
      {
        name: "idx_sessions_user_valid",
        fields: ["user_id", "is_valid"],
      },
    ],
  },
);

export default Session;
