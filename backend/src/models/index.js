import sequelize from "../config/db.js";
import User from "./User.js";
import Event from "./Event.js";
import TicketType from "./TicketType.js";
import Ticket from "./Ticket.js";
import Order from "./Order.js";
import ResaleListing from "./ResaleListing.js";
import CheckInLog from "./CheckInLog.js";
import AuditLog from "./AuditLog.js";
import Session from "./Session.js";
// 1. User <-> Event (Organizer tạo nhiều sự kiện)
User.hasMany(Event, {
  foreignKey: "organizer_id",
  as: "events",
  onDelete: "CASCADE",
});
Event.belongsTo(User, { foreignKey: "organizer_id", as: "organizer" });

// 2. Event <-> TicketType (Sự kiện có nhiều hạng vé)
Event.hasMany(TicketType, {
  foreignKey: "event_id",
  as: "ticketTypes",
  onDelete: "CASCADE",
});
TicketType.belongsTo(Event, { foreignKey: "event_id", as: "event" });

// 3. TicketType <-> Ticket (Hạng vé có nhiều vé NFT)
TicketType.hasMany(Ticket, {
  foreignKey: "ticket_type_id",
  as: "tickets",
  onDelete: "RESTRICT",
});
Ticket.belongsTo(TicketType, {
  foreignKey: "ticket_type_id",
  as: "ticketType",
});

// 4. Event <-> Ticket (Sự kiện có nhiều vé)
Event.hasMany(Ticket, {
  foreignKey: "event_id",
  as: "tickets",
  onDelete: "RESTRICT",
});
Ticket.belongsTo(Event, { foreignKey: "event_id", as: "event" });

// 5. Event <-> Order & TicketType <-> Order
Event.hasMany(Order, {
  foreignKey: "event_id",
  as: "orders",
  onDelete: "RESTRICT",
});
Order.belongsTo(Event, { foreignKey: "event_id", as: "event" });

TicketType.hasMany(Order, {
  foreignKey: "ticket_type_id",
  as: "orders",
  onDelete: "RESTRICT",
});
Order.belongsTo(TicketType, { foreignKey: "ticket_type_id", as: "ticketType" });

// 6. Ticket <-> ResaleListing & Event <-> ResaleListing (Chợ vé thứ cấp)
Ticket.hasOne(ResaleListing, {
  foreignKey: "ticket_id",
  as: "resaleListing",
  onDelete: "RESTRICT",
});
ResaleListing.belongsTo(Ticket, { foreignKey: "ticket_id", as: "ticket" });

Event.hasMany(ResaleListing, {
  foreignKey: "event_id",
  as: "resaleListings",
  onDelete: "RESTRICT",
});
ResaleListing.belongsTo(Event, { foreignKey: "event_id", as: "event" });

// 7. CheckInLog quan hệ với Event và User (Nhân viên quét vé)
Event.hasMany(CheckInLog, {
  foreignKey: "event_id",
  as: "checkInLogs",
  onDelete: "RESTRICT",
});
CheckInLog.belongsTo(Event, { foreignKey: "event_id", as: "event" });

User.hasMany(CheckInLog, {
  foreignKey: "scanned_by",
  as: "checkInsPerformed",
  onDelete: "RESTRICT",
});
CheckInLog.belongsTo(User, { foreignKey: "scanned_by", as: "scanner" });

// 8. User <-> AuditLog (Nhật ký quản trị)
User.hasMany(AuditLog, {
  foreignKey: "user_id",
  as: "auditLogs",
  onDelete: "RESTRICT",
});
AuditLog.belongsTo(User, { foreignKey: "user_id", as: "user" });
// 9. User <-> Session (Người dùng có nhiều phiên đăng nhập)
User.hasMany(Session, {
  foreignKey: "user_id",
  as: "sessions",
  onDelete: "CASCADE",
});
Session.belongsTo(User, { foreignKey: "user_id", as: "user" });

export {
  sequelize,
  User,
  Event,
  TicketType,
  Ticket,
  Order,
  ResaleListing,
  CheckInLog,
  AuditLog,
  Session,
};

export default {
  sequelize,
  User,
  Event,
  TicketType,
  Ticket,
  Order,
  ResaleListing,
  CheckInLog,
  AuditLog,
  Session,
};
