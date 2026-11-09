import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const Order = sequelize.define(
  "Order",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    buyerWallet: {
      type: DataTypes.STRING(42),
      allowNull: false,
      field: "buyer_wallet", // Địa chỉ ví người mua vé
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
    ticketTypeId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "ticket_type_id",
      references: {
        model: "ticket_types",
        key: "id",
      },
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    totalPrice: {
      type: DataTypes.DECIMAL(18, 6),
      allowNull: false,
      field: "total_price", // Tổng tiền thanh toán (ETH)
    },
    currency: {
      type: DataTypes.STRING(10),
      defaultValue: "ETH",
    },
    txHash: {
      type: DataTypes.STRING(66),
      allowNull: true,
      field: "tx_hash", // Mã băm giao dịch nhận từ MetaMask
    },
    status: {
      type: DataTypes.ENUM(
        "pending_payment",
        "verifying",
        "confirmed",
        "failed",
        "cancelled"
      ),
      defaultValue: "pending_payment",
    },
    idempotencyKey: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      field: "idempotency_key", // Khóa chống tạo đơn trùng khi người dùng bấm mua liên tục
    },
  },
  {
    tableName: "orders",
    timestamps: true,
    underscored: true,
  }
);

export default Order;