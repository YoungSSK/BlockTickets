import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const ResaleListing = sequelize.define(
  "ResaleListing",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    tokenId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      field: "token_id", // Token ID NFT trên blockchain
    },
    ticketId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "ticket_id",
      references: {
        model: "tickets",
        key: "id",
      },
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
    sellerWallet: {
      type: DataTypes.STRING(42),
      allowNull: false,
      field: "seller_wallet", // Địa chỉ ví người bán
    },
    originalPrice: {
      type: DataTypes.DECIMAL(18, 6),
      allowNull: false,
      field: "original_price", // Giá phát hành gốc ban đầu
    },
    resalePrice: {
      type: DataTypes.DECIMAL(18, 6),
      allowNull: false,
      field: "resale_price", // Giá bán lại (BẮT BUỘC <= max_allowed_price)
    },
    maxAllowedPrice: {
      type: DataTypes.DECIMAL(18, 6),
      allowNull: false,
      field: "max_allowed_price", // Trần giá 120% (original_price * 1.2)
    },
    listingTxHash: {
      type: DataTypes.STRING(66),
      allowNull: true,
      field: "listing_tx_hash", // Hash gọi hàm listTicket on-chain
    },
    buyerWallet: {
      type: DataTypes.STRING(42),
      allowNull: true,
      field: "buyer_wallet", // Địa chỉ ví người mua lại
    },
    soldTxHash: {
      type: DataTypes.STRING(66),
      allowNull: true,
      field: "sold_tx_hash", // Hash giao dịch mua lại
    },
    status: {
      type: DataTypes.ENUM("active", "sold", "cancelled"),
      defaultValue: "active",
    },
    soldAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "sold_at",
    },
  },
  {
    tableName: "resale_listings",
    timestamps: true,
    underscored: true,
    indexes: [
      {
        name: "idx_resale_status_event",
        fields: ["status", "event_id"], // Tối ưu tìm kiếm vé đang rao bán theo sự kiện
      },
    ],
  }
);

export default ResaleListing;