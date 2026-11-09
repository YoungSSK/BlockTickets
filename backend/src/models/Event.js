import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const Event = sequelize.define(
  "Event",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    organizerId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "organizer_id",
      references: {
        model: "users",
        key: "id",
      },
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    category: {
      type: DataTypes.ENUM("music", "technology", "sports", "workshop"),
      allowNull: false,
    },
    bannerUrl: {
      type: DataTypes.STRING(500),
      allowNull: false,
      field: "banner_url",
    },
    venueName: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: "venue_name",
    },
    venueAddress: {
      type: DataTypes.STRING(500),
      allowNull: false,
      field: "venue_address",
    },
    venueCity: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: "venue_city",
    },
    startTime: {
      type: DataTypes.DATE,
      allowNull: false,
      field: "start_time",
    },
    endTime: {
      type: DataTypes.DATE,
      allowNull: false,
      field: "end_time",
    },
    status: {
      type: DataTypes.ENUM(
        "draft",
        "pending",
        "approved",
        "rejected",
        "published",
        "ended",
        "cancelled",
      ),
      defaultValue: "draft",
    },
    rejectionReason: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: "rejection_reason",
    },
    onChainEventId: {
      type: DataTypes.BIGINT,
      allowNull: true,
      field: "on_chain_event_id",
    },
  },
  {
    tableName: "events",
    timestamps: true,
    underscored: true,
    indexes: [
      {
        name: "idx_events_status_start_time",
        fields: ["status", "start_time"], // Tối ưu hiển thị sự kiện trên trang chủ
      },
    ],
  },
);

export default Event;
