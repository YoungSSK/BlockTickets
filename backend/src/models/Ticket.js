import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const Ticket = sequelize.define(
  "Ticket",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    tokenId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      unique: true, // Token ID đại diện duy nhất trên Blockchain ERC-721
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
    ticketTypeId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "ticket_type_id",
      references: {
        model: "ticket_types",
        key: "id",
      },
    },
    ownerWallet: {
      type: DataTypes.STRING(42),
      allowNull: false,
      field: "owner_wallet", // Địa chỉ ví hiện tại sở hữu vé
    },
    originalBuyerWallet: {
      type: DataTypes.STRING(42),
      allowNull: false,
      field: "original_buyer_wallet", // Ví người mua ban đầu
    },
    originalPrice: {
      type: DataTypes.DECIMAL(18, 6),
      allowNull: false,
      field: "original_price", // Dùng để đối soát trần giá bán lại 120%
    },
    txHash: {
      type: DataTypes.STRING(66),
      allowNull: false,
      unique: true,
      field: "tx_hash", // Mã băm giao dịch mint vé on-chain Sepolia
    },
    isUsed: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: "is_used", // Đã soát vé check-in tại cửa hay chưa
    },
    usedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "used_at",
    },
    isListedForResale: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: "is_listed_for_resale", // Đang được rao bán trên Marketplace
    },
  },
  {
    tableName: "tickets",
    timestamps: true,
    underscored: true,
    indexes: [
      {
        name: "idx_tickets_event_owner",
        fields: ["event_id", "owner_wallet"], // Giúp lấy nhanh danh sách vé của người dùng trong một sự kiện
      },
    ],
  }
);

export default Ticket;