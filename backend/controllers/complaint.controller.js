import mongoose from "mongoose";
import Complaint from "../models/Complaint.model.js";
import Category from "../models/Category.model.js";
import Department from "../models/Department.model.js";
import User from "../models/User.model.js";
import ComplaintUpdate from "../models/ComplaintUpdate.model.js";
import { COMPLAINT_STATUSES } from "../models/constants.model.js";
import ApiError from "../utils/ApiError.js";
import { sendResponse } from "../utils/ApiResponse.js";
import catchAsync from "../utils/catchAsync.js";
import { assertValidObjectId, isValidObjectId } from "../utils/validators.js";
import { parsePagination, buildPaginationMeta } from "../utils/pagination.js";
import generateComplaintId from "../utils/generateComplaintId.js";
import { logAudit } from "../utils/auditLogger.js";
import { notify } from "../utils/notifier.js";

/*
 * NOTE ON SCOPE (see the accompanying architecture notes):
 * - Support (ComplaintSupport) and comments (Comment) live in their own
 *   controllers to avoid duplicating logic against the same collections.
 * - Feedback lives in feedbackController.js.
 * - The full activity timeline for a complaint (ComplaintUpdate) is read
 *   through complaintUpdateController.getComplaintUpdates; this file only
 *   *writes* a ComplaintUpdate entry as a side effect of actions that
 *   change complaint state (status change, assignment, resolution), since
 *   the model's README states updates must only ever be created, never
 *   altered, by application services.
 */

// ---- shared helpers -------------------------------------------------

const PUBLIC_POPULATE = [
  { path: "category", select: "name slug" },
  { path: "assignedDepartment", select: "name code" },
];

const isAdmin = (user) => user.role === "admin";
const isOfficer = (user) => user.role === "officer";

const isSameDepartment = (user, departmentId) =>
  isOfficer(user) && user.department && departmentId && user.department.toString() === departmentId.toString();

const isOwner = (user, complaint) => complaint.createdBy.toString() === user._id.toString();

const isAssignedOfficer = (user, complaint) =>
  complaint.assignedOfficer && complaint.assignedOfficer.toString() === user._id.toString();

// Masks the reporter's identity for anonymous complaints shown to the public.
const toPublicShape = (complaint) => {
  const obj = complaint.toObject ? complaint.toObject() : complaint;
  if (obj.isAnonymous) {
    delete obj.createdBy;
  }
  return obj;
};

// Status transitions allowed from the current status. Enforced here because
// the schema cannot safely encode cross-field workflow rules (README).
const ALLOWED_TRANSITIONS = {
  Submitted: ["Under Review", "Rejected"],
  "Under Review": ["Assigned", "Rejected"],
  Assigned: ["In Progress", "Under Review"],
  "In Progress": ["Resolved", "Assigned"],
  Resolved: ["Closed", "Reopened"],
  Closed: ["Reopened"],
  Rejected: ["Reopened"],
  Reopened: ["Under Review", "Assigned", "In Progress"],
};

const assertCanActOnComplaint = (user, complaint) => {
  if (isAdmin(user)) return;
  if (isOfficer(user) && isSameDepartment(user, complaint.assignedDepartment)) return;
  if (isOfficer(user) && isAssignedOfficer(user, complaint)) return;
  throw ApiError.forbidden("You are not authorized to act on this complaint");
};

const buildPublicMatch = (query) => {
  const match = { visibility: "public", moderationStatus: "approved", isDeleted: false };

  if (query.status && COMPLAINT_STATUSES.includes(query.status)) match.status = query.status;
  if (query.category && isValidObjectId(query.category)) match.category = new mongoose.Types.ObjectId(query.category);
  if (query.department && isValidObjectId(query.department)) {
    match.assignedDepartment = new mongoose.Types.ObjectId(query.department);
  }
  if (query.priority) match.priority = query.priority;
  if (query.ward) match["location.ward"] = new RegExp(query.ward, "i");

  return match;
};

// ---- citizen operations ----------------------------------------------

// POST /api/complaints - citizen or officer (officer = filed on behalf of a citizen in person)
const createComplaint = catchAsync(async (req, res) => {
  const { title, description, category, subCategory, location, isAnonymous, visibility, attachments } = req.body;

  if (!title || !description || !category || !location?.point?.coordinates) {
    throw ApiError.badRequest("title, description, category and location.point.coordinates are required");
  }

  assertValidObjectId(category, "category id");
  const categoryDoc = await Category.findById(category);
  if (!categoryDoc || !categoryDoc.isActive) throw ApiError.badRequest("category does not exist or is inactive");

  if (subCategory && categoryDoc.subcategories.length && !categoryDoc.subcategories.includes(subCategory)) {
    throw ApiError.badRequest(`subCategory must be one of: ${categoryDoc.subcategories.join(", ")}`);
  }

  const complaintId = await generateComplaintId();
  const slaDeadline = new Date(Date.now() + categoryDoc.slaHours * 60 * 60 * 1000);

  const complaint = await Complaint.create({
    complaintId,
    title,
    description,
    category,
    subCategory,
    priority: categoryDoc.defaultPriority,
    createdBy: req.user._id,
    source: req.user.role === "officer" ? "officer" : "web",
    assignedDepartment: categoryDoc.defaultDepartment || null,
    location,
    visibility: visibility || "public",
    isAnonymous: Boolean(isAnonymous),
    attachments: attachments || [],
    slaDeadline,
  });

  await logAudit({ actorId: req.user._id, action: "complaint.create", entityType: "Complaint", entityId: complaint._id, after: { status: complaint.status } });

  return sendResponse(res, 201, "Complaint filed successfully", complaint);
});

// GET /api/complaints/my - citizen (own complaints only)
const getMyComplaints = catchAsync(async (req, res) => {
  const filter = { createdBy: req.user._id, isDeleted: false };
  if (req.query.status) filter.status = req.query.status;
  if (req.query.category && isValidObjectId(req.query.category)) filter.category = req.query.category;

  const { page, limit, skip } = parsePagination(req.query);
  const [complaints, total] = await Promise.all([
    Complaint.find(filter)
      .populate(PUBLIC_POPULATE)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Complaint.countDocuments(filter),
  ]);

  return sendResponse(res, 200, "Your complaints fetched", complaints, buildPaginationMeta({ page, limit, total }));
});

// GET /api/complaints/:id - authenticated, ownership/role gated
const getComplaintById = catchAsync(async (req, res) => {
  assertValidObjectId(req.params.id, "complaint id");
  const complaint = await Complaint.findById(req.params.id)
    .populate(PUBLIC_POPULATE)
    .populate("assignedOfficer", "name")
    .populate("createdBy", "name email phone");

  if (!complaint || complaint.isDeleted) throw ApiError.notFound("Complaint not found");

  const owner = isOwner(req.user, complaint);
  const admin = isAdmin(req.user);
  const deptMember = isSameDepartment(req.user, complaint.assignedDepartment?._id || complaint.assignedDepartment);
  const assignedOfficer = isAssignedOfficer(req.user, complaint);
  const publiclyVisible = complaint.visibility === "public" && complaint.moderationStatus === "approved";

  if (!owner && !admin && !deptMember && !assignedOfficer && !publiclyVisible) {
    throw ApiError.forbidden("You are not authorized to view this complaint");
  }

  if (!owner && !admin && !deptMember && !assignedOfficer) {
    // Public viewer: strip identity/contact info for anonymous complaints.
    return sendResponse(res, 200, "Complaint fetched", toPublicShape(complaint));
  }

  return sendResponse(res, 200, "Complaint fetched", complaint);
});

// PATCH /api/complaints/:id - owner only, and only pre-processing
const updateComplaint = catchAsync(async (req, res) => {
  assertValidObjectId(req.params.id, "complaint id");
  const complaint = await Complaint.findById(req.params.id);
  if (!complaint || complaint.isDeleted) throw ApiError.notFound("Complaint not found");

  if (!isOwner(req.user, complaint) && !isAdmin(req.user)) {
    throw ApiError.forbidden("You can only edit your own complaint");
  }

  if (complaint.status !== "Submitted" && !isAdmin(req.user)) {
    throw ApiError.badRequest("This complaint is already being processed and can no longer be edited");
  }

  const editable = ["title", "description", "subCategory", "location", "visibility", "isAnonymous"];
  const before = {};
  for (const field of editable) {
    if (req.body[field] !== undefined) {
      before[field] = complaint[field];
      complaint[field] = req.body[field];
    }
  }

  await complaint.save();
  await logAudit({ actorId: req.user._id, action: "complaint.update", entityType: "Complaint", entityId: complaint._id, before, after: req.body });

  return sendResponse(res, 200, "Complaint updated", complaint);
});

// DELETE /api/complaints/:id - owner (only while Submitted) or admin (soft delete)
const deleteComplaint = catchAsync(async (req, res) => {
  assertValidObjectId(req.params.id, "complaint id");
  const complaint = await Complaint.findById(req.params.id);
  if (!complaint || complaint.isDeleted) throw ApiError.notFound("Complaint not found");

  const owner = isOwner(req.user, complaint);
  if (!owner && !isAdmin(req.user)) throw ApiError.forbidden("You can only delete your own complaint");
  if (owner && !isAdmin(req.user) && complaint.status !== "Submitted") {
    throw ApiError.badRequest("This complaint is already being processed and can no longer be withdrawn");
  }

  complaint.isDeleted = true;
  complaint.deletedAt = new Date();
  await complaint.save();

  await logAudit({ actorId: req.user._id, action: "complaint.delete", entityType: "Complaint", entityId: complaint._id });

  return sendResponse(res, 200, "Complaint deleted", null);
});

// PATCH /api/complaints/:id/evidence - owner only, append attachments
const addEvidence = catchAsync(async (req, res) => {
  assertValidObjectId(req.params.id, "complaint id");
  const { attachments } = req.body;
  if (!Array.isArray(attachments) || attachments.length === 0) {
    throw ApiError.badRequest("attachments must be a non-empty array");
  }

  const complaint = await Complaint.findById(req.params.id);
  if (!complaint || complaint.isDeleted) throw ApiError.notFound("Complaint not found");
  if (!isOwner(req.user, complaint)) throw ApiError.forbidden("You can only add evidence to your own complaint");
  if (["Closed", "Rejected"].includes(complaint.status)) {
    throw ApiError.badRequest("Evidence cannot be added to a closed or rejected complaint");
  }

  complaint.attachments.push(...attachments);
  await complaint.save();

  return sendResponse(res, 200, "Evidence added", complaint);
});

// GET /api/complaints/track/:complaintId - public, human-readable tracking code
const trackComplaint = catchAsync(async (req, res) => {
  const complaint = await Complaint.findOne({ complaintId: req.params.complaintId.toUpperCase() }).populate(
    PUBLIC_POPULATE
  );
  if (!complaint || complaint.isDeleted) throw ApiError.notFound("No complaint found with this tracking id");

  if (complaint.visibility !== "public" || complaint.moderationStatus !== "approved") {
    throw ApiError.forbidden("This complaint is not publicly trackable");
  }

  return sendResponse(res, 200, "Complaint status fetched", {
    complaintId: complaint.complaintId,
    title: complaint.title,
    status: complaint.status,
    priority: complaint.priority,
    category: complaint.category,
    assignedDepartment: complaint.assignedDepartment,
    createdAt: complaint.createdAt,
    resolvedAt: complaint.resolvedAt,
    closedAt: complaint.closedAt,
  });
});

// ---- public operations -------------------------------------------------

// GET /api/public/complaints
const getPublicComplaints = catchAsync(async (req, res) => {
  const match = buildPublicMatch(req.query);
  const { page, limit, skip } = parsePagination(req.query);

  const [complaints, total] = await Promise.all([
    Complaint.find(match).populate(PUBLIC_POPULATE).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Complaint.countDocuments(match),
  ]);

  return sendResponse(
    res,
    200,
    "Public complaints fetched",
    complaints.map(toPublicShape),
    buildPaginationMeta({ page, limit, total })
  );
});

// GET /api/public/complaints/:id
const getPublicComplaintById = catchAsync(async (req, res) => {
  assertValidObjectId(req.params.id, "complaint id");
  const complaint = await Complaint.findOne({
    _id: req.params.id,
    visibility: "public",
    moderationStatus: "approved",
    isDeleted: false,
  }).populate(PUBLIC_POPULATE);

  if (!complaint) throw ApiError.notFound("Complaint not found");
  return sendResponse(res, 200, "Complaint fetched", toPublicShape(complaint));
});

// GET /api/public/complaints/search?q=
const searchComplaints = catchAsync(async (req, res) => {
  const { q } = req.query;
  if (!q || !q.trim()) throw ApiError.badRequest("Query parameter 'q' is required");

  const match = { ...buildPublicMatch(req.query), $text: { $search: q } };
  const { page, limit, skip } = parsePagination(req.query);

  const [complaints, total] = await Promise.all([
    Complaint.find(match, { score: { $meta: "textScore" } })
      .populate(PUBLIC_POPULATE)
      .sort({ score: { $meta: "textScore" } })
      .skip(skip)
      .limit(limit),
    Complaint.countDocuments(match),
  ]);

  return sendResponse(res, 200, "Search results", complaints.map(toPublicShape), buildPaginationMeta({ page, limit, total }));
});

// GET /api/public/complaints/category/:categoryId
const getComplaintsByCategory = catchAsync(async (req, res) => {
  assertValidObjectId(req.params.categoryId, "category id");
  req.query.category = req.params.categoryId;
  return getPublicComplaints(req, res);
});

// GET /api/public/complaints/status/:status
const getComplaintsByStatus = catchAsync(async (req, res) => {
  if (!COMPLAINT_STATUSES.includes(req.params.status)) throw ApiError.badRequest("Invalid status value");
  req.query.status = req.params.status;
  return getPublicComplaints(req, res);
});

// GET /api/public/complaints/near?lng=&lat=&radius= (meters)
const getComplaintsByLocation = catchAsync(async (req, res) => {
  const lng = parseFloat(req.query.lng);
  const lat = parseFloat(req.query.lat);
  const radius = parseFloat(req.query.radius) || 2000;

  if (!Number.isFinite(lng) || !Number.isFinite(lat)) {
    throw ApiError.badRequest("lng and lat query parameters are required");
  }

  const match = buildPublicMatch(req.query);
  match["location.point"] = {
    $near: {
      $geometry: { type: "Point", coordinates: [lng, lat] },
      $maxDistance: radius,
    },
  };

  const { page, limit, skip } = parsePagination(req.query);
  const complaints = await Complaint.find(match).populate(PUBLIC_POPULATE).skip(skip).limit(limit);

  return sendResponse(res, 200, "Nearby complaints fetched", complaints.map(toPublicShape), { page, limit });
});

// ---- department / officer operations -----------------------------------

// GET /api/department/complaints/assigned - officer (own assignments)
const getAssignedComplaints = catchAsync(async (req, res) => {
  if (!isOfficer(req.user)) throw ApiError.forbidden("Only department officers have assigned complaints");
  const filter = { assignedOfficer: req.user._id, isDeleted: false };
  if (req.query.status) filter.status = req.query.status;

  const { page, limit, skip } = parsePagination(req.query);
  const [complaints, total] = await Promise.all([
    Complaint.find(filter).populate(PUBLIC_POPULATE).populate("createdBy", "name phone").sort({ slaDeadline: 1 }).skip(skip).limit(limit),
    Complaint.countDocuments(filter),
  ]);

  return sendResponse(res, 200, "Assigned complaints fetched", complaints, buildPaginationMeta({ page, limit, total }));
});

// GET /api/department/complaints - officer (own department) or admin (any, via ?department=)
const getDepartmentComplaints = catchAsync(async (req, res) => {
  let departmentId;
  if (isAdmin(req.user)) {
    if (!req.query.department) throw ApiError.badRequest("department query parameter is required for admin");
    assertValidObjectId(req.query.department, "department id");
    departmentId = req.query.department;
  } else if (isOfficer(req.user)) {
    if (!req.user.department) throw ApiError.badRequest("You are not assigned to a department");
    departmentId = req.user.department;
  } else {
    throw ApiError.forbidden("Only department officers or admins can view department complaints");
  }

  const filter = { assignedDepartment: departmentId, isDeleted: false };
  if (req.query.status) filter.status = req.query.status;

  const { page, limit, skip } = parsePagination(req.query);
  const [complaints, total] = await Promise.all([
    Complaint.find(filter).populate(PUBLIC_POPULATE).populate("createdBy", "name phone").sort({ createdAt: -1 }).skip(skip).limit(limit),
    Complaint.countDocuments(filter),
  ]);

  return sendResponse(res, 200, "Department complaints fetched", complaints, buildPaginationMeta({ page, limit, total }));
});

// Internal: applies a validated status transition, timestamps, a
// ComplaintUpdate entry and a citizen notification. Shared by the
// transition-specific endpoints below.
const applyStatusTransition = async ({ complaint, newStatus, actor, message, extra = {} }) => {
  const allowed = ALLOWED_TRANSITIONS[complaint.status] || [];
  if (!allowed.includes(newStatus)) {
    throw ApiError.badRequest(`Cannot move complaint from "${complaint.status}" to "${newStatus}"`);
  }

  const oldStatus = complaint.status;
  complaint.status = newStatus;
  Object.assign(complaint, extra);

  if (newStatus === "Under Review" && !complaint.verifiedAt) complaint.verifiedAt = new Date();
  if (newStatus === "Assigned" && !complaint.assignedAt) complaint.assignedAt = new Date();
  if (newStatus === "In Progress" && !complaint.startedAt) complaint.startedAt = new Date();
  if (newStatus === "Resolved") complaint.resolvedAt = new Date();
  if (newStatus === "Closed") complaint.closedAt = new Date();
  if (newStatus === "Reopened") {
    complaint.reopenedAt = new Date();
    complaint.resolvedAt = null;
    complaint.closedAt = null;
  }

  await complaint.save();

  await ComplaintUpdate.create({
    complaint: complaint._id,
    updatedBy: actor._id,
    action: "status_changed",
    oldStatus,
    newStatus,
    message: message || "",
    visibility: "public",
  });

  await notify({
    recipientId: complaint.createdBy,
    complaintId: complaint._id,
    title: `Complaint ${complaint.complaintId} updated`,
    message: `Your complaint status changed from ${oldStatus} to ${newStatus}.`,
    type: "status_update",
    idempotencyKey: `status_changed:${complaint._id}:${newStatus}:${complaint.createdBy}`,
  });

  await logAudit({
    actorId: actor._id,
    action: "complaint.status_changed",
    entityType: "Complaint",
    entityId: complaint._id,
    before: { status: oldStatus },
    after: { status: newStatus },
  });
};

// PATCH /api/department/complaints/:id/status - officer (own dept/assignment) or admin
const updateComplaintStatus = catchAsync(async (req, res) => {
  assertValidObjectId(req.params.id, "complaint id");
  const { status, message, rejectionReason } = req.body;
  if (!COMPLAINT_STATUSES.includes(status)) throw ApiError.badRequest("Invalid status value");

  const complaint = await Complaint.findById(req.params.id);
  if (!complaint || complaint.isDeleted) throw ApiError.notFound("Complaint not found");
  assertCanActOnComplaint(req.user, complaint);

  if (status === "Rejected" && !rejectionReason) {
    throw ApiError.badRequest("rejectionReason is required to reject a complaint");
  }

  await applyStatusTransition({
    complaint,
    newStatus: status,
    actor: req.user,
    message,
    extra: status === "Rejected" ? { rejectionReason } : {},
  });

  return sendResponse(res, 200, "Complaint status updated", complaint);
});

// PATCH /api/department/complaints/:id/assign - admin (department) or officer setting self
const assignComplaint = catchAsync(async (req, res) => {
  assertValidObjectId(req.params.id, "complaint id");
  const { departmentId, officerId } = req.body;

  const complaint = await Complaint.findById(req.params.id);
  if (!complaint || complaint.isDeleted) throw ApiError.notFound("Complaint not found");

  if (departmentId) {
    if (!isAdmin(req.user)) throw ApiError.forbidden("Only an admin can assign a complaint to a department");
    assertValidObjectId(departmentId, "department id");
    const dept = await Department.findById(departmentId);
    if (!dept || !dept.isActive) throw ApiError.badRequest("department does not exist or is inactive");
    complaint.assignedDepartment = departmentId;
  }

  if (officerId) {
    assertValidObjectId(officerId, "officer id");
    const officer = await User.findById(officerId);
    if (!officer || officer.role !== "officer") throw ApiError.badRequest("officerId must reference a valid officer");

    const targetDept = (complaint.assignedDepartment || departmentId || "").toString();
    if (!officer.department || officer.department.toString() !== targetDept) {
      throw ApiError.badRequest("This officer does not belong to the complaint's assigned department");
    }
    if (!isAdmin(req.user) && !isSameDepartment(req.user, complaint.assignedDepartment)) {
      throw ApiError.forbidden("You are not authorized to assign officers for this department");
    }
    complaint.assignedOfficer = officerId;
  }

  if (!departmentId && !officerId) throw ApiError.badRequest("Provide departmentId and/or officerId");

  if (complaint.status === "Submitted" || complaint.status === "Under Review") {
    await applyStatusTransition({ complaint, newStatus: "Assigned", actor: req.user, message: "Complaint assigned" });
  } else {
    complaint.assignedAt = complaint.assignedAt || new Date();
    await complaint.save();
    await ComplaintUpdate.create({
      complaint: complaint._id,
      updatedBy: req.user._id,
      action: "assigned",
      message: "Assignment updated",
      visibility: "department_only",
    });
  }

  return sendResponse(res, 200, "Complaint assigned", complaint);
});

// PATCH /api/department/complaints/:id/in-progress
const markInProgress = catchAsync(async (req, res) => {
  assertValidObjectId(req.params.id, "complaint id");
  const complaint = await Complaint.findById(req.params.id);
  if (!complaint || complaint.isDeleted) throw ApiError.notFound("Complaint not found");
  assertCanActOnComplaint(req.user, complaint);

  await applyStatusTransition({ complaint, newStatus: "In Progress", actor: req.user, message: req.body.message });
  return sendResponse(res, 200, "Complaint marked as in progress", complaint);
});

// PATCH /api/department/complaints/:id/resolve
const resolveComplaint = catchAsync(async (req, res) => {
  assertValidObjectId(req.params.id, "complaint id");
  const { resolutionDescription, resolutionEvidence } = req.body;
  if (!resolutionDescription) throw ApiError.badRequest("resolutionDescription is required");

  const complaint = await Complaint.findById(req.params.id);
  if (!complaint || complaint.isDeleted) throw ApiError.notFound("Complaint not found");
  assertCanActOnComplaint(req.user, complaint);

  await applyStatusTransition({
    complaint,
    newStatus: "Resolved",
    actor: req.user,
    message: resolutionDescription,
    extra: {
      resolutionDescription,
      resolutionEvidence: resolutionEvidence || [],
    },
  });

  await notify({
    recipientId: complaint.createdBy,
    complaintId: complaint._id,
    title: "Please share your feedback",
    message: `Your complaint ${complaint.complaintId} has been resolved. Let us know how we did.`,
    type: "feedback_request",
    idempotencyKey: `feedback_request:${complaint._id}`,
  });

  return sendResponse(res, 200, "Complaint marked as resolved", complaint);
});

// GET /api/admin/complaints - admin, unrestricted listing
const adminGetAllComplaints = catchAsync(async (req, res) => {
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.category && isValidObjectId(req.query.category)) filter.category = req.query.category;
  if (req.query.department && isValidObjectId(req.query.department)) filter.assignedDepartment = req.query.department;
  if (req.query.includeDeleted !== "true") filter.isDeleted = false;

  const { page, limit, skip } = parsePagination(req.query);
  const [complaints, total] = await Promise.all([
    Complaint.find(filter).populate(PUBLIC_POPULATE).populate("createdBy", "name email").sort({ createdAt: -1 }).skip(skip).limit(limit),
    Complaint.countDocuments(filter),
  ]);

  return sendResponse(res, 200, "All complaints fetched", complaints, buildPaginationMeta({ page, limit, total }));
});

// PATCH /api/admin/complaints/:id/reassign - admin, works regardless of current status
const adminReassignComplaint = catchAsync(async (req, res) => {
  assertValidObjectId(req.params.id, "complaint id");
  const { departmentId, officerId, reason } = req.body;
  if (!reason) throw ApiError.badRequest("A reason is required to reassign a complaint");
  if (!departmentId && !officerId) throw ApiError.badRequest("Provide departmentId and/or officerId");

  const complaint = await Complaint.findById(req.params.id);
  if (!complaint || complaint.isDeleted) throw ApiError.notFound("Complaint not found");

  const before = { assignedDepartment: complaint.assignedDepartment, assignedOfficer: complaint.assignedOfficer };

  if (departmentId) {
    assertValidObjectId(departmentId, "department id");
    const dept = await Department.findById(departmentId);
    if (!dept) throw ApiError.badRequest("department does not exist");
    complaint.assignedDepartment = departmentId;
    complaint.assignedOfficer = null; // officer must be re-picked for the new department
  }

  if (officerId) {
    assertValidObjectId(officerId, "officer id");
    const officer = await User.findById(officerId);
    if (!officer || officer.role !== "officer") throw ApiError.badRequest("officerId must reference a valid officer");
    if (!officer.department || officer.department.toString() !== complaint.assignedDepartment?.toString()) {
      throw ApiError.badRequest("This officer does not belong to the complaint's assigned department");
    }
    complaint.assignedOfficer = officerId;
  }

  await complaint.save();

  await ComplaintUpdate.create({
    complaint: complaint._id,
    updatedBy: req.user._id,
    action: "assigned",
    message: reason,
    visibility: "department_only",
  });

  await logAudit({ actorId: req.user._id, action: "complaint.reassign", entityType: "Complaint", entityId: complaint._id, before, after: { departmentId, officerId, reason } });

  return sendResponse(res, 200, "Complaint reassigned", complaint);
});

// PATCH /api/admin/complaints/:id/moderate - admin, controls public visibility
const adminModerateComplaint = catchAsync(async (req, res) => {
  assertValidObjectId(req.params.id, "complaint id");
  const { moderationStatus, rejectionReason } = req.body;
  const allowed = ["pending", "approved", "rejected", "hidden"];
  if (!allowed.includes(moderationStatus)) throw ApiError.badRequest(`moderationStatus must be one of: ${allowed.join(", ")}`);

  const complaint = await Complaint.findById(req.params.id);
  if (!complaint) throw ApiError.notFound("Complaint not found");

  const before = complaint.moderationStatus;
  complaint.moderationStatus = moderationStatus;
  if (moderationStatus === "rejected" && rejectionReason) complaint.rejectionReason = rejectionReason;
  await complaint.save();

  await ComplaintUpdate.create({
    complaint: complaint._id,
    updatedBy: req.user._id,
    action: "moderated",
    message: `Moderation status set to ${moderationStatus}`,
    visibility: "department_only",
  });

  await logAudit({ actorId: req.user._id, action: "complaint.moderate", entityType: "Complaint", entityId: complaint._id, before: { moderationStatus: before }, after: { moderationStatus } });

  return sendResponse(res, 200, "Complaint moderation status updated", complaint);
});

export {
  createComplaint,
  getMyComplaints,
  getComplaintById,
  updateComplaint,
  deleteComplaint,
  addEvidence,
  trackComplaint,
  getPublicComplaints,
  getPublicComplaintById,
  searchComplaints,
  getComplaintsByCategory,
  getComplaintsByStatus,
  getComplaintsByLocation,
  getAssignedComplaints,
  getDepartmentComplaints,
  updateComplaintStatus,
  assignComplaint,
  markInProgress,
  resolveComplaint,
  adminGetAllComplaints,
  adminReassignComplaint,
  adminModerateComplaint,
};
