import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const CheckInLog = sequelize.define(
  "CheckInLog",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    tokenId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      field: "token_id",
    },
    eventId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "event_id",
      references: {
        model: "events",
        key: "id",
      },
    },
    scannedBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "scanned_by", // ID nhân viên soát vé (User có role organizer hoặc staff)
      references: {
        model: "users",
        key: "id",
      },
    },
    status: {
      type: DataTypes.ENUM(
        "success",
        "already_used",
        "invalid_ticket",
        "wrong_event",
        "invalid_signature"
      ),
      allowNull: false,
    },
    qrNonce: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: "qr_nonce", // Chuỗi HMAC bảo mật trong mã QR
    },
    scannedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: "scanned_at",
    },
  },
  {
    tableName: "check_in_logs",
    timestamps: false, // Bảng này chỉ cần thời điểm scanned_at
    underscored: true,
  }
);

export default CheckInLog;