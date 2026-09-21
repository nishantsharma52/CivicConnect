import Comment from "../models/Comment.model.js";
import Complaint from "../models/Complaint.model.js";
import ApiError from "../utils/ApiError.js";
import { sendResponse } from "../utils/ApiResponse.js";
import catchAsync from "../utils/catchAsync.js";
import { assertValidObjectId } from "../utils/validators.js";
import { parsePagination, buildPaginationMeta } from "../utils/pagination.js";

const canViewComplaint = (user, complaint) => {
  if (user.role === "admin") return true;
  if (complaint.createdBy.toString() === user._id.toString()) return true;
  if (user.role === "officer" && user.department && complaint.assignedDepartment && user.department.toString() === complaint.assignedDepartment.toString()) {
    return true;
  }
  if (complaint.assignedOfficer && complaint.assignedOfficer.toString() === user._id.toString()) return true;
  return complaint.visibility === "public" && complaint.moderationStatus === "approved";
};

// POST /api/complaints/:complaintId/comments - any user who can view the complaint
const createComment = catchAsync(async (req, res) => {
  assertValidObjectId(req.params.complaintId, "complaint id");
  const { body, parentComment, attachments } = req.body;
  if (!body || !body.trim()) throw ApiError.badRequest("Comment body is required");

  const complaint = await Complaint.findById(req.params.complaintId);
  if (!complaint || complaint.isDeleted) throw ApiError.notFound("Complaint not found");
  if (!canViewComplaint(req.user, complaint)) throw ApiError.forbidden("You are not authorized to comment on this complaint");

  if (parentComment) {
    assertValidObjectId(parentComment, "parentComment id");
    const parent = await Comment.findOne({ _id: parentComment, complaint: complaint._id });
    if (!parent) throw ApiError.badRequest("parentComment does not exist on this complaint");
  }

  const comment = await Comment.create({
    complaint: complaint._id,
    author: req.user._id,
    parentComment: parentComment || null,
    body,
    attachments: attachments || [],
  });

  return sendResponse(res, 201, "Comment added", comment);
});

// GET /api/complaints/:complaintId/comments - nested tree, visible comments only (unless admin)
const getComplaintComments = catchAsync(async (req, res) => {
  assertValidObjectId(req.params.complaintId, "complaint id");
  const complaint = await Complaint.findById(req.params.complaintId);
  if (!complaint || complaint.isDeleted) throw ApiError.notFound("Complaint not found");
  if (!canViewComplaint(req.user, complaint)) throw ApiError.forbidden("You are not authorized to view comments on this complaint");

  const filter = { complaint: complaint._id, isDeleted: false };
  if (req.user.role !== "admin") filter.moderationStatus = "visible";

  const { page, limit, skip } = parsePagination(req.query, { defaultLimit: 50 });
  const [flatComments, total] = await Promise.all([
    Comment.find(filter).populate("author", "name role").sort({ createdAt: 1 }).skip(skip).limit(limit),
    Comment.countDocuments(filter),
  ]);

  // Build a simple parent -> children tree for rendering threaded replies.
  const byId = new Map(flatComments.map((c) => [c._id.toString(), { ...c.toObject(), replies: [] }]));
  const roots = [];
  for (const comment of byId.values()) {
    if (comment.parentComment && byId.has(comment.parentComment.toString())) {
      byId.get(comment.parentComment.toString()).replies.push(comment);
    } else {
      roots.push(comment);
    }
  }

  return sendResponse(res, 200, "Comments fetched", roots, buildPaginationMeta({ page, limit, total }));
});

// PATCH /api/comments/:id - author only, within edit window is not modeled so allowed anytime pre-deletion
const updateComment = catchAsync(async (req, res) => {
  assertValidObjectId(req.params.id, "comment id");
  const { body } = req.body;
  if (!body || !body.trim()) throw ApiError.badRequest("Comment body is required");

  const comment = await Comment.findById(req.params.id);
  if (!comment || comment.isDeleted) throw ApiError.notFound("Comment not found");
  if (comment.author.toString() !== req.user._id.toString()) {
    throw ApiError.forbidden("You can only edit your own comment");
  }

  comment.body = body;
  await comment.save();

  return sendResponse(res, 200, "Comment updated", comment);
});

// DELETE /api/comments/:id - author or admin (soft delete)
const deleteComment = catchAsync(async (req, res) => {
  assertValidObjectId(req.params.id, "comment id");
  const comment = await Comment.findById(req.params.id);
  if (!comment || comment.isDeleted) throw ApiError.notFound("Comment not found");

  const isAuthor = comment.author.toString() === req.user._id.toString();
  if (!isAuthor && req.user.role !== "admin") throw ApiError.forbidden("You can only delete your own comment");

  comment.isDeleted = true;
  comment.deletedAt = new Date();
  if (!isAuthor) comment.moderationStatus = "removed"; // admin-driven removal
  await comment.save();

  return sendResponse(res, 200, "Comment deleted", null);
});

export {
  createComment,
  getComplaintComments,
  updateComment,
  deleteComment,
};
