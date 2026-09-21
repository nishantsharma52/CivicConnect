import ComplaintSupport from "../models/ComplaintSupport.model.js";
import Complaint from "../models/Complaint.model.js";
import ApiError from "../utils/ApiError.js";
import { sendResponse } from "../utils/ApiResponse.js";
import catchAsync from "../utils/catchAsync.js";
import { assertValidObjectId } from "../utils/validators.js";
import { parsePagination, buildPaginationMeta } from "../utils/pagination.js";

/*
 * Duplicate support is prevented at the database level by the model's
 * unique compound index on (complaint, citizen); we still do a friendly
 * pre-check but also handle the E11000 race condition explicitly.
 */

const assertComplaintIsVisible = async (complaintId, user) => {
  const complaint = await Complaint.findById(complaintId);
  if (!complaint || complaint.isDeleted) throw ApiError.notFound("Complaint not found");

  const isOwner = complaint.createdBy.toString() === user._id.toString();
  const isAdmin = user.role === "admin";
  const isPublic = complaint.visibility === "public" && complaint.moderationStatus === "approved";
  if (!isOwner && !isAdmin && !isPublic) throw ApiError.forbidden("You are not authorized to interact with this complaint");

  return complaint;
};

// POST /api/complaints/:complaintId/support - citizen only
const supportComplaint = catchAsync(async (req, res) => {
  assertValidObjectId(req.params.complaintId, "complaint id");
  if (req.user.role !== "citizen") throw ApiError.forbidden("Only citizens can support complaints");

  await assertComplaintIsVisible(req.params.complaintId, req.user);

  const existing = await ComplaintSupport.findOne({ complaint: req.params.complaintId, citizen: req.user._id });
  if (existing) throw ApiError.conflict("You have already supported this complaint");

  try {
    const support = await ComplaintSupport.create({ complaint: req.params.complaintId, citizen: req.user._id });
    return sendResponse(res, 201, "Complaint supported", support);
  } catch (err) {
    if (err.code === 11000) throw ApiError.conflict("You have already supported this complaint");
    throw err;
  }
});

// DELETE /api/complaints/:complaintId/support - citizen only, own support
const removeSupport = catchAsync(async (req, res) => {
  assertValidObjectId(req.params.complaintId, "complaint id");
  const support = await ComplaintSupport.findOneAndDelete({ complaint: req.params.complaintId, citizen: req.user._id });
  if (!support) throw ApiError.notFound("You have not supported this complaint");
  return sendResponse(res, 200, "Support removed", null);
});

// GET /api/complaints/:complaintId/supporters - names only, no contact info
const getSupporters = catchAsync(async (req, res) => {
  assertValidObjectId(req.params.complaintId, "complaint id");
  await assertComplaintIsVisible(req.params.complaintId, req.user);

  const { page, limit, skip } = parsePagination(req.query);
  const [supports, total] = await Promise.all([
    ComplaintSupport.find({ complaint: req.params.complaintId })
      .populate("citizen", "name")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    ComplaintSupport.countDocuments({ complaint: req.params.complaintId }),
  ]);

  const supporters = supports.map((s) => ({ citizen: s.citizen, supportedAt: s.createdAt }));
  return sendResponse(res, 200, "Supporters fetched", supporters, buildPaginationMeta({ page, limit, total }));
});

// GET /api/complaints/:complaintId/supporters/count - public-safe count
const getSupportCount = catchAsync(async (req, res) => {
  assertValidObjectId(req.params.complaintId, "complaint id");
  const count = await ComplaintSupport.countDocuments({ complaint: req.params.complaintId });
  return sendResponse(res, 200, "Support count fetched", { count });
});

export {
  supportComplaint,
  removeSupport,
  getSupporters,
  getSupportCount,
};
