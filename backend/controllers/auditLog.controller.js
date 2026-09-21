import AuditLog from "../models/AuditLog.model.js";
import ApiError from "../utils/ApiError.js";
import { sendResponse } from "../utils/ApiResponse.js";
import catchAsync from "../utils/catchAsync.js";
import { assertValidObjectId } from "../utils/validators.js";
import { parsePagination, buildPaginationMeta } from "../utils/pagination.js";

/*
 * Per the model's own comment ("Keep this collection append-only in
 * application code"), this controller is read-only by design - there is
 * no create/update/delete export. Entries are written internally via
 * utils/auditLogger.js from the controllers that perform sensitive
 * actions. All routes here are expected to be admin-only at the router
 * level.
 */

// GET /api/admin/audit-logs?entityType=&entityId=&actor=&action=&from=&to=
const getAuditLogs = catchAsync(async (req, res) => {
  const { entityType, entityId, actor, action, from, to } = req.query;
  const filter = {};
  if (entityType) filter.entityType = entityType;
  if (entityId) {
    assertValidObjectId(entityId, "entityId");
    filter.entityId = entityId;
  }
  if (actor) {
    assertValidObjectId(actor, "actor");
    filter.actor = actor;
  }
  if (action) filter.action = action;
  if (from || to) {
    filter.createdAt = {};
    if (from) filter.createdAt.$gte = new Date(from);
    if (to) filter.createdAt.$lte = new Date(to);
  }

  const { page, limit, skip } = parsePagination(req.query, { defaultLimit: 50 });
  const [logs, total] = await Promise.all([
    AuditLog.find(filter).populate("actor", "name email role").sort({ createdAt: -1 }).skip(skip).limit(limit),
    AuditLog.countDocuments(filter),
  ]);

  return sendResponse(res, 200, "Audit logs fetched", logs, buildPaginationMeta({ page, limit, total }));
});

// GET /api/admin/audit-logs/:id
const getAuditLogById = catchAsync(async (req, res) => {
  assertValidObjectId(req.params.id, "audit log id");
  const log = await AuditLog.findById(req.params.id).populate("actor", "name email role");
  if (!log) throw ApiError.notFound("Audit log entry not found");
  return sendResponse(res, 200, "Audit log fetched", log);
});

// GET /api/admin/users/:userId/audit-logs - convenience filter over the same collection
const getUserAuditLogs = catchAsync(async (req, res) => {
  assertValidObjectId(req.params.userId, "user id");
  const { page, limit, skip } = parsePagination(req.query, { defaultLimit: 50 });

  const filter = { actor: req.params.userId };
  const [logs, total] = await Promise.all([
    AuditLog.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    AuditLog.countDocuments(filter),
  ]);

  return sendResponse(res, 200, "User audit logs fetched", logs, buildPaginationMeta({ page, limit, total }));
});

export {
  getAuditLogs,
  getAuditLogById,
  getUserAuditLogs,
};
