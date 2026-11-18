import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const TicketType = sequelize.define(
  "TicketType",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
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
    name: {
      type: DataTypes.STRING(100),
      allowNull: false, // Ví dụ: "VIP", "Standard"
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    originalPrice: {
      type: DataTypes.DECIMAL(18, 6),
      allowNull: false, // Giá gốc phát hành (đơn vị ETH)
      field: "original_price",
    },
    currency: {
      type: DataTypes.STRING(10),
      defaultValue: "ETH",
    },
    maxSupply: {
      type: DataTypes.INTEGER,
      allowNull: false, // Giới hạn phát hành tối đa
      field: "max_supply",
    },
    currentSupply: {
      type: DataTypes.INTEGER,
      defaultValue: 0, // Số vé đã mint on-chain
      field: "current_supply",
    },
    saleStartTime: {
      type: DataTypes.DATE,
      allowNull: false,
      field: "sale_start_time",
    },
    saleEndTime: {
      type: DataTypes.DATE,
      allowNull: false,
      field: "sale_end_time",
    },
    entryGate: {
      type: DataTypes.STRING(100),
      defaultValue: "Cổng A - Khán Đài Phổ Thông Tầng 1",
      field: "entry_gate",
    },
    tierType: {
      type: DataTypes.STRING(50),
      defaultValue: "standard",
      field: "tier_type",
    },
    seatZone: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: "seat_zone",
    },
    seatRow: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: "seat_row",
    },
    seatStart: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
      field: "seat_start",
    },
    seatEnd: {
      type: DataTypes.INTEGER,
      defaultValue: 100,
      field: "seat_end",
    },
    seatConfig: {
      type: DataTypes.JSON,
      allowNull: true,
      field: "seat_config",
    },
    onChainTierId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: "on_chain_tier_id",
    },
  },
  {
    tableName: "ticket_types",
    timestamps: true,
    underscored: true,
  },
);

export default TicketType;
