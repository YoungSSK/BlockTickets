import sequelize from "../config/db.js";
import User from "./User.js";
import Event from "./Event.js";
import TicketType from "./TicketType.js";
import Ticket from "./Ticket.js";

// 1. Quan hệ User (Organizer) <-> Event
User.hasMany(Event, {
  foreignKey: "organizer_id",
  as: "events",
  onDelete: "CASCADE",
});
Event.belongsTo(User, {
  foreignKey: "organizer_id",
  as: "organizer",
});

// 2. Quan hệ Event <-> TicketType 
Event.hasMany(TicketType, {
  foreignKey: "event_id",
  as: "ticketTypes",
  onDelete: "CASCADE",
});
TicketType.belongsTo(Event, {
  foreignKey: "event_id",
  as: "event",
});

// 3. Quan hệ TicketType <-> Ticket (Một hạng vé có nhiều vé NFT)
TicketType.hasMany(Ticket, {
  foreignKey: "ticket_type_id",
  as: "tickets",
  onDelete: "RESTRICT",
});
Ticket.belongsTo(TicketType, {
  foreignKey: "ticket_type_id",
  as: "ticketType",
});

// 4. Quan hệ Event <-> Ticket (Một sự kiện có nhiều vé)
Event.hasMany(Ticket, {
  foreignKey: "event_id",
  as: "tickets",
  onDelete: "RESTRICT",
});
Ticket.belongsTo(Event, {
  foreignKey: "event_id",
  as: "event",
});

export { sequelize, User, Event, TicketType, Ticket };
export default {
  sequelize,
  User,
  Event,
  TicketType,
  Ticket,
};