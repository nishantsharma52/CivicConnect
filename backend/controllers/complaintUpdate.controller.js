import ComplaintUpdate from "../models/ComplaintUpdate.model.js";
import Complaint from "../models/Complaint.model.js";
import ApiError from "../utils/ApiError.js";
import { sendResponse } from "../utils/ApiResponse.js";
import catchAsync from "../utils/catchAsync.js";
import { assertValidObjectId } from "../utils/validators.js";
import { parsePagination, buildPaginationMeta } from "../utils/pagination.js";
import { logAudit } from "../utils/auditLogger.js";

/*
 * Per the models README, ComplaintUpdate is an immutable activity timeline
 * that "should only be created, never altered or deleted, by application
 * services." Several actions in complaintController.js already write
 * ComplaintUpdate entries as a side effect (status change, assignment,
 * resolution, moderation) - createUpdate here is for the remaining
 * free-form entries an officer/admin adds manually (a progress note, extra
 * evidence, a manual verification) that aren't already covered by a
 * dedicated status-changing endpoint. There is deliberately no
 * updateUpdate/deleteUpdate export.
 */

const isAdmin = (user) => user.role === "admin";
const isOfficer = (user) => user.role === "officer";

const isSameDepartment = (user, departmentId) =>
  isOfficer(user) && user.department && departmentId && user.department.toString() === departmentId.toString();

const canViewComplaint = (user, complaint) => {
  if (isAdmin(user)) return true;
  if (complaint.createdBy.toString() === user._id.toString()) return true;
  if (isSameDepartment(user, complaint.assignedDepartment)) return true;
  if (complaint.assignedOfficer && complaint.assignedOfficer.toString() === user._id.toString()) return true;
  return complaint.visibility === "public" && complaint.moderationStatus === "approved";
};

const visibilityFilterFor = (user, complaint) => {
  if (isAdmin(user)) return {}; // no restriction
  if (complaint.createdBy.toString() === user._id.toString()) return { visibility: { $ne: "department_only" } };
  if (isSameDepartment(user, complaint.assignedDepartment)) return {}; // department sees everything about their own complaint
  if (complaint.assignedOfficer && complaint.assignedOfficer.toString() === user._id.toString()) return {};
  return { visibility: "public" };
};

// POST /api/complaints/:complaintId/updates - officer (own dept/assignment) or admin
const createUpdate = catchAsync(async (req, res) => {
  assertValidObjectId(req.params.complaintId, "complaint id");
  const { action, message, evidence, visibility, oldStatus, newStatus, metadata } = req.body;

  const allowedActions = ["commented", "evidence_added", "verified", "duplicate_linked", "sla_escalated"];
  if (!allowedActions.includes(action)) {
    throw ApiError.badRequest(
      `action must be one of: ${allowedActions.join(", ")} (status/assignment/moderation updates are generated automatically)`
    );
  }

  const complaint = await Complaint.findById(req.params.complaintId);
  if (!complaint || complaint.isDeleted) throw ApiError.notFound("Complaint not found");

  const admin = isAdmin(req.user);
  const deptMember = isSameDepartment(req.user, complaint.assignedDepartment);
  const assignedOfficer = complaint.assignedOfficer && complaint.assignedOfficer.toString() === req.user._id.toString();
  if (!admin && !deptMember && !assignedOfficer) {
    throw ApiError.forbidden("You are not authorized to add updates to this complaint");
  }

  const update = await ComplaintUpdate.create({
    complaint: complaint._id,
    updatedBy: req.user._id,
    action,
    oldStatus,
    newStatus,
    message,
    evidence: evidence || [],
    metadata: metadata || {},
    visibility: visibility || "public",
  });

  await logAudit({ actorId: req.user._id, action: "complaint_update.create", entityType: "ComplaintUpdate", entityId: update._id, after: { action } });

  return sendResponse(res, 201, "Update added", update);
});

// GET /api/complaints/:complaintId/updates - visibility-filtered timeline
const getComplaintUpdates = catchAsync(async (req, res) => {
  assertValidObjectId(req.params.complaintId, "complaint id");
  const complaint = await Complaint.findById(req.params.complaintId);
  if (!complaint || complaint.isDeleted) throw ApiError.notFound("Complaint not found");

  if (!canViewComplaint(req.user, complaint)) {
    throw ApiError.forbidden("You are not authorized to view this complaint's updates");
  }

  const filter = { complaint: complaint._id, ...visibilityFilterFor(req.user, complaint) };
  const { page, limit, skip } = parsePagination(req.query, { defaultLimit: 50 });

  const [updates, total] = await Promise.all([
    ComplaintUpdate.find(filter).populate("updatedBy", "name role").sort({ createdAt: -1 }).skip(skip).limit(limit),
    ComplaintUpdate.countDocuments(filter),
  ]);

  return sendResponse(res, 200, "Complaint updates fetched", updates, buildPaginationMeta({ page, limit, total }));
});

// GET /api/complaint-updates/:id - single entry, same visibility rules
const getUpdateById = catchAsync(async (req, res) => {
  assertValidObjectId(req.params.id, "update id");
  const update = await ComplaintUpdate.findById(req.params.id).populate("updatedBy", "name role");
  if (!update) throw ApiError.notFound("Update not found");

  const complaint = await Complaint.findById(update.complaint);
  if (!complaint) throw ApiError.notFound("Associated complaint not found");
  if (!canViewComplaint(req.user, complaint)) {
    throw ApiError.forbidden("You are not authorized to view this update");
  }
  if (update.visibility === "department_only" && !isAdmin(req.user) && !isSameDepartment(req.user, complaint.assignedDepartment)) {
    throw ApiError.forbidden("You are not authorized to view this update");
  }
  if (update.visibility === "private" && !isAdmin(req.user) && complaint.createdBy.toString() !== req.user._id.toString()) {
    throw ApiError.forbidden("You are not authorized to view this update");
  }

  return sendResponse(res, 200, "Update fetched", update);
});

export {
  createUpdate,
  getComplaintUpdates,
  getUpdateById,
};
