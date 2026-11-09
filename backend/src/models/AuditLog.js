import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const AuditLog = sequelize.define(
  "AuditLog",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "user_id", // Người thực hiện hành động
      references: {
        model: "users",
        key: "id",
      },
    },
    userRole: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: "user_role",
    },
    action: {
      type: DataTypes.STRING(100),
      allowNull: false, // Vd: "APPROVE_EVENT", "REJECT_EVENT", "SUSPEND_USER"
    },
    targetId: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: "target_id", // ID đối tượng bị tác động
    },
    ipAddress: {
      type: DataTypes.STRING(45),
      allowNull: true,
      field: "ip_address",
    },
    details: {
      type: DataTypes.JSON, // MySQL 8.0+ hỗ trợ kiểu dữ liệu JSON bản địa
      allowNull: true,
      defaultValue: {},
    },
  },
  {
    tableName: "audit_logs",
    timestamps: true,
    updatedAt: false, // Nhật ký kiểm toán chỉ cần createdAt
    underscored: true,
  }
);

export default AuditLog;