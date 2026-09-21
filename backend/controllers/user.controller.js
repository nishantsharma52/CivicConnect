import User from "../models/User.model.js";
import Complaint from "../models/Complaint.model.js";
import Comment from "../models/Comment.model.js";
import Department from "../models/Department.model.js";
import ApiError from "../utils/ApiError.js";
import { sendResponse } from "../utils/ApiResponse.js";
import catchAsync from "../utils/catchAsync.js";
import { assertValidObjectId } from "../utils/validators.js";
import { parsePagination, buildPaginationMeta } from "../utils/pagination.js";
import { logAudit } from "../utils/auditLogger.js";

/*
 * Self-service profile read/update and password change already live in
 * authController.js (getCurrentUser, updateProfile, changePassword) since
 * they operate on the token's own identity. This controller covers
 * looking up OTHER users and admin user management.
 *
 * ASSUMPTION: hard-deleting a user is unsafe because Complaint.createdBy,
 * Comment.author, etc. reference User and are `required`. We therefore
 * only allow a genuine delete when the user has no complaints/comments/
 * feedback tied to them; otherwise we point the caller at
 * adminSetAccountStatus("suspended") instead of silently leaving dangling
 * references or fabricating a cascading-delete policy that wasn't specified.
 */

const sanitize = (userDoc) => {
  const user = userDoc.toObject ? userDoc.toObject() : { ...userDoc };
  delete user.password;
  return user;
};

// GET /api/users/:id - authenticated (limited public-safe fields for non-admins)
const getUserById = catchAsync(async (req, res) => {
  assertValidObjectId(req.params.id, "user id");
  const user = await User.findById(req.params.id).populate("department", "name code");
  if (!user) throw ApiError.notFound("User not found");

  const isSelfOrAdmin = req.user.role === "admin" || req.user._id.equals(user._id);
  if (isSelfOrAdmin) return sendResponse(res, 200, "User fetched", sanitize(user));

  // Non-admins only get a minimal public-safe profile, no email/phone/status.
  return sendResponse(res, 200, "User fetched", {
    _id: user._id,
    name: user.name,
    role: user.role,
    department: user.department,
  });
});

// GET /api/admin/users - admin only
const adminListUsers = catchAsync(async (req, res) => {
  const { role, department, accountStatus, search } = req.query;
  const filter = {};
  if (role) filter.role = role;
  if (department) filter.department = department;
  if (accountStatus) filter.accountStatus = accountStatus;
  if (search) filter.$or = [{ name: new RegExp(search, "i") }, { email: new RegExp(search, "i") }];

  const { page, limit, skip } = parsePagination(req.query);
  const [users, total] = await Promise.all([
    User.find(filter).populate("department", "name code").sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments(filter),
  ]);

  return sendResponse(res, 200, "Users fetched", users, buildPaginationMeta({ page, limit, total }));
});

// GET /api/admin/users/:id - admin only
const adminGetUserById = catchAsync(async (req, res) => {
  assertValidObjectId(req.params.id, "user id");
  const user = await User.findById(req.params.id).populate("department", "name code");
  if (!user) throw ApiError.notFound("User not found");
  return sendResponse(res, 200, "User fetched", sanitize(user));
});

// PATCH /api/admin/users/:id - admin only (role, department, officerProfile)
const adminUpdateUser = catchAsync(async (req, res) => {
  assertValidObjectId(req.params.id, "user id");
  const { role, department, officerProfile, name, phone } = req.body;

  const updates = {};
  if (name !== undefined) updates.name = name;
  if (phone !== undefined) updates.phone = phone;
  if (role !== undefined) updates.role = role;
  if (officerProfile !== undefined) updates.officerProfile = officerProfile;

  if (department !== undefined) {
    if (department !== null) {
      assertValidObjectId(department, "department id");
      const dept = await Department.findById(department);
      if (!dept) throw ApiError.badRequest("department does not exist");
    }
    updates.department = department;
  }

  const before = await User.findById(req.params.id);
  if (!before) throw ApiError.notFound("User not found");

  const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true }).populate(
    "department",
    "name code"
  );

  await logAudit({
    actorId: req.user._id,
    action: "user.admin_update",
    entityType: "User",
    entityId: user._id,
    before: { role: before.role, department: before.department },
    after: updates,
  });

  return sendResponse(res, 200, "User updated", sanitize(user));
});

// PATCH /api/admin/users/:id/status - admin only (activate/suspend)
const adminSetAccountStatus = catchAsync(async (req, res) => {
  assertValidObjectId(req.params.id, "user id");
  const { accountStatus } = req.body;
  const allowed = ["active", "suspended", "pending_verification"];
  if (!allowed.includes(accountStatus)) {
    throw ApiError.badRequest(`accountStatus must be one of: ${allowed.join(", ")}`);
  }

  if (req.user._id.equals(req.params.id) && accountStatus === "suspended") {
    throw ApiError.badRequest("You cannot suspend your own account");
  }

  const user = await User.findByIdAndUpdate(req.params.id, { accountStatus }, { new: true, runValidators: true });
  if (!user) throw ApiError.notFound("User not found");

  await logAudit({
    actorId: req.user._id,
    action: "user.set_account_status",
    entityType: "User",
    entityId: user._id,
    after: { accountStatus },
  });

  return sendResponse(res, 200, `User account marked as ${accountStatus}`, sanitize(user));
});

// DELETE /api/admin/users/:id - admin only, guarded (see file header ASSUMPTION)
const adminDeleteUser = catchAsync(async (req, res) => {
  assertValidObjectId(req.params.id, "user id");
  const user = await User.findById(req.params.id);
  if (!user) throw ApiError.notFound("User not found");

  const [complaintCount, commentCount] = await Promise.all([
    Complaint.countDocuments({ createdBy: user._id }),
    Comment.countDocuments({ author: user._id }),
  ]);

  if (complaintCount > 0 || commentCount > 0) {
    throw ApiError.badRequest(
      "This user has existing complaints or comments and cannot be deleted. Suspend the account instead."
    );
  }

  await user.deleteOne();
  await logAudit({ actorId: req.user._id, action: "user.delete", entityType: "User", entityId: user._id, before: { email: user.email } });

  return sendResponse(res, 200, "User deleted", null);
});

export {
  getUserById,
  adminListUsers,
  adminGetUserById,
  adminUpdateUser,
  adminSetAccountStatus,
  adminDeleteUser,
};
