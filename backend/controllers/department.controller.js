import Department from "../models/Department.model.js";
import User from "../models/User.model.js";
import Complaint from "../models/Complaint.model.js";
import ApiError from "../utils/ApiError.js";
import { sendResponse } from "../utils/ApiResponse.js";
import catchAsync from "../utils/catchAsync.js";
import { assertValidObjectId } from "../utils/validators.js";
import { parsePagination, buildPaginationMeta } from "../utils/pagination.js";
import { logAudit } from "../utils/auditLogger.js";

/*
 * NOTE: "getDepartmentComplaints" from the requested Department controller
 * list is intentionally NOT duplicated here - it already exists as
 * complaintController.getDepartmentComplaints because it queries the
 * Complaint collection with role-aware access rules (officer sees own
 * department, admin can pick any via ?department=). Keeping it there
 * avoids two divergent implementations of the same query.
 */

// POST /api/admin/departments - admin only
const createDepartment = catchAsync(async (req, res) => {
  const { name, code, description, contactEmail, contactPhone, jurisdiction } = req.body;
  if (!name || !code) throw ApiError.badRequest("name and code are required");

  const exists = await Department.findOne({ $or: [{ name }, { code: code.toUpperCase() }] });
  if (exists) throw ApiError.conflict("A department with this name or code already exists");

  const department = await Department.create({ name, code, description, contactEmail, contactPhone, jurisdiction });
  await logAudit({ actorId: req.user._id, action: "department.create", entityType: "Department", entityId: department._id, after: { name, code } });

  return sendResponse(res, 201, "Department created", department);
});

// GET /api/departments - public (needed for transparency dashboard filters)
const getDepartments = catchAsync(async (req, res) => {
  const filter = {};
  if (req.query.isActive !== undefined) filter.isActive = req.query.isActive === "true";

  const { page, limit, skip } = parsePagination(req.query, { defaultLimit: 50 });
  const [departments, total] = await Promise.all([
    Department.find(filter).sort({ name: 1 }).skip(skip).limit(limit),
    Department.countDocuments(filter),
  ]);

  return sendResponse(res, 200, "Departments fetched", departments, buildPaginationMeta({ page, limit, total }));
});

// GET /api/departments/:id - public
const getDepartmentById = catchAsync(async (req, res) => {
  assertValidObjectId(req.params.id, "department id");
  const department = await Department.findById(req.params.id);
  if (!department) throw ApiError.notFound("Department not found");
  return sendResponse(res, 200, "Department fetched", department);
});

// PATCH /api/admin/departments/:id - admin only
const updateDepartment = catchAsync(async (req, res) => {
  assertValidObjectId(req.params.id, "department id");
  const allowed = ["name", "description", "contactEmail", "contactPhone", "isActive", "jurisdiction", "code"];
  const updates = {};
  for (const field of allowed) {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  }

  const department = await Department.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
  if (!department) throw ApiError.notFound("Department not found");

  await logAudit({ actorId: req.user._id, action: "department.update", entityType: "Department", entityId: department._id, after: updates });

  return sendResponse(res, 200, "Department updated", department);
});

// DELETE /api/admin/departments/:id - admin only, guarded
const deleteDepartment = catchAsync(async (req, res) => {
  assertValidObjectId(req.params.id, "department id");
  const department = await Department.findById(req.params.id);
  if (!department) throw ApiError.notFound("Department not found");

  const [officerCount, complaintCount] = await Promise.all([
    User.countDocuments({ department: department._id }),
    Complaint.countDocuments({ assignedDepartment: department._id }),
  ]);

  if (officerCount > 0 || complaintCount > 0) {
    throw ApiError.badRequest(
      "This department has assigned officers or complaints and cannot be deleted. Deactivate it instead."
    );
  }

  await department.deleteOne();
  await logAudit({ actorId: req.user._id, action: "department.delete", entityType: "Department", entityId: department._id });

  return sendResponse(res, 200, "Department deleted", null);
});

// GET /api/departments/:id/statistics - admin or officer of that department
const getDepartmentStatistics = catchAsync(async (req, res) => {
  assertValidObjectId(req.params.id, "department id");

  if (req.user.role === "officer" && (!req.user.department || req.user.department.toString() !== req.params.id)) {
    throw ApiError.forbidden("You can only view statistics for your own department");
  }
  if (req.user.role === "citizen") throw ApiError.forbidden("Not authorized to view department statistics");

  const department = await Department.findById(req.params.id);
  if (!department) throw ApiError.notFound("Department not found");

  const [statusBreakdown, officerCount, totalComplaints] = await Promise.all([
    Complaint.aggregate([
      { $match: { assignedDepartment: department._id, isDeleted: false } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
    User.countDocuments({ department: department._id, role: "officer" }),
    Complaint.countDocuments({ assignedDepartment: department._id, isDeleted: false }),
  ]);

  return sendResponse(res, 200, "Department statistics fetched", {
    department: { _id: department._id, name: department.name, code: department.code },
    officerCount,
    totalComplaints,
    statusBreakdown,
  });
});

export {
  createDepartment,
  getDepartments,
  getDepartmentById,
  updateDepartment,
  deleteDepartment,
  getDepartmentStatistics,
};
