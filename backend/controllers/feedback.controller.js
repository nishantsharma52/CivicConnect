import Feedback from "../models/Feedback.model.js";
import Complaint from "../models/Complaint.model.js";
import ApiError from "../utils/ApiError.js";
import { sendResponse } from "../utils/ApiResponse.js";
import catchAsync from "../utils/catchAsync.js";
import { assertValidObjectId } from "../utils/validators.js";
import { logAudit } from "../utils/auditLogger.js";

const RESOLVED_STATUSES = ["Resolved", "Closed"];

// POST /api/complaints/:complaintId/feedback - citizen, own complaint, only after resolution
const createFeedback = catchAsync(async (req, res) => {
  assertValidObjectId(req.params.complaintId, "complaint id");
  const { rating, resolutionQuality, comment, reopenRequested, reopenReason } = req.body;
  if (!rating) throw ApiError.badRequest("rating is required");

  const complaint = await Complaint.findById(req.params.complaintId);
  if (!complaint || complaint.isDeleted) throw ApiError.notFound("Complaint not found");

  if (complaint.createdBy.toString() !== req.user._id.toString()) {
    throw ApiError.forbidden("You can only give feedback on your own complaint");
  }
  if (!RESOLVED_STATUSES.includes(complaint.status)) {
    throw ApiError.badRequest("Feedback can only be submitted after the complaint has been resolved or closed");
  }

  const existing = await Feedback.findOne({ complaint: complaint._id, citizen: req.user._id });
  if (existing) throw ApiError.conflict("You have already submitted feedback for this complaint");

  try {
    const feedback = await Feedback.create({
      complaint: complaint._id,
      citizen: req.user._id,
      rating,
      resolutionQuality,
      comment,
      reopenRequested: Boolean(reopenRequested),
      reopenReason,
    });

    return sendResponse(res, 201, "Feedback submitted", feedback);
  } catch (err) {
    if (err.code === 11000) throw ApiError.conflict("You have already submitted feedback for this complaint");
    throw err;
  }
});

// GET /api/complaints/:complaintId/feedback - owner, assigned dept/officer, or admin
const getComplaintFeedback = catchAsync(async (req, res) => {
  assertValidObjectId(req.params.complaintId, "complaint id");
  const complaint = await Complaint.findById(req.params.complaintId);
  if (!complaint) throw ApiError.notFound("Complaint not found");

  const isOwner = complaint.createdBy.toString() === req.user._id.toString();
  const isAdmin = req.user.role === "admin";
  const isDeptMember =
    req.user.role === "officer" &&
    req.user.department &&
    complaint.assignedDepartment &&
    req.user.department.toString() === complaint.assignedDepartment.toString();

  if (!isOwner && !isAdmin && !isDeptMember) {
    throw ApiError.forbidden("You are not authorized to view feedback for this complaint");
  }

  const feedback = await Feedback.find({ complaint: complaint._id }).populate("citizen", "name");
  return sendResponse(res, 200, "Feedback fetched", feedback);
});

// PATCH /api/feedback/:id - owner only
const updateFeedback = catchAsync(async (req, res) => {
  assertValidObjectId(req.params.id, "feedback id");
  const feedback = await Feedback.findById(req.params.id);
  if (!feedback) throw ApiError.notFound("Feedback not found");
  if (feedback.citizen.toString() !== req.user._id.toString()) {
    throw ApiError.forbidden("You can only edit your own feedback");
  }

  const allowed = ["rating", "resolutionQuality", "comment", "reopenRequested", "reopenReason"];
  for (const field of allowed) {
    if (req.body[field] !== undefined) feedback[field] = req.body[field];
  }

  await feedback.save();
  return sendResponse(res, 200, "Feedback updated", feedback);
});

// DELETE /api/feedback/:id - owner or admin
const deleteFeedback = catchAsync(async (req, res) => {
  assertValidObjectId(req.params.id, "feedback id");
  const feedback = await Feedback.findById(req.params.id);
  if (!feedback) throw ApiError.notFound("Feedback not found");

  const isOwner = feedback.citizen.toString() === req.user._id.toString();
  if (!isOwner && req.user.role !== "admin") throw ApiError.forbidden("You can only delete your own feedback");

  await feedback.deleteOne();
  await logAudit({ actorId: req.user._id, action: "feedback.delete", entityType: "Feedback", entityId: feedback._id });

  return sendResponse(res, 200, "Feedback deleted", null);
});

export {
  createFeedback,
  getComplaintFeedback,
  updateFeedback,
  deleteFeedback,
};
