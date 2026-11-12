import { AuditLog } from "../models/index.js";

export const recordAuditLog = async (
  { user, action, targetId, ipAddress, details = {} },
  transaction = null,
) => {
  return AuditLog.create(
    {
      userId: user.id,
      userRole: user.role,
      action,
      targetId: String(targetId),
      ipAddress: ipAddress || "Unknown IP",
      details,
    },
    transaction ? { transaction } : undefined,
  );
};
