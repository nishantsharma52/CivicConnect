import mongoose from "mongoose";
import Complaint from "../models/Complaint.model.js";
import User from "../models/User.model.js";
import ApiError from "../utils/ApiError.js";
import { sendResponse } from "../utils/ApiResponse.js";
import catchAsync from "../utils/catchAsync.js";

const PUBLIC_MATCH = { visibility: "public", moderationStatus: "approved", isDeleted: false };

// Average resolution time in hours, computed only over complaints that have
// actually reached resolvedAt, to avoid dividing by unresolved cases.
const avgResolutionHoursStage = (match) => [
  { $match: { ...match, resolvedAt: { $ne: null } } },
  {
    $project: {
      hours: { $divide: [{ $subtract: ["$resolvedAt", "$createdAt"] }, 1000 * 60 * 60] },
    },
  },
  { $group: { _id: null, avgHours: { $avg: "$hours" }, count: { $sum: 1 } } },
];

// GET /api/public/dashboard - public transparency dashboard
const getPublicStats = catchAsync(async (req, res) => {
  const [totalComplaints, byStatus, byCategory, byDepartment, last30Days, resolutionStats] = await Promise.all([
    Complaint.countDocuments(PUBLIC_MATCH),
    Complaint.aggregate([{ $match: PUBLIC_MATCH }, { $group: { _id: "$status", count: { $sum: 1 } } }]),
    Complaint.aggregate([
      { $match: PUBLIC_MATCH },
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $lookup: { from: "categories", localField: "_id", foreignField: "_id", as: "category" } },
      { $unwind: "$category" },
      { $project: { _id: 0, category: "$category.name", count: 1 } },
      { $sort: { count: -1 } },
    ]),
    Complaint.aggregate([
      { $match: { ...PUBLIC_MATCH, assignedDepartment: { $ne: null } } },
      { $group: { _id: "$assignedDepartment", count: { $sum: 1 } } },
      { $lookup: { from: "departments", localField: "_id", foreignField: "_id", as: "department" } },
      { $unwind: "$department" },
      { $project: { _id: 0, department: "$department.name", count: 1 } },
      { $sort: { count: -1 } },
    ]),
    Complaint.aggregate([
      { $match: { ...PUBLIC_MATCH, createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } },
      { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
    Complaint.aggregate(avgResolutionHoursStage(PUBLIC_MATCH)),
  ]);

  return sendResponse(res, 200, "Public dashboard statistics fetched", {
    totalComplaints,
    byStatus,
    byCategory,
    byDepartment,
    last30Days,
    averageResolutionHours: resolutionStats[0]?.avgHours || null,
    resolvedComplaintsSample: resolutionStats[0]?.count || 0,
  });
});

// GET /api/public/dashboard/heatmap - public, GeoJSON points for map/heatmap consumption
const getHeatmapData = catchAsync(async (req, res) => {
  const match = { ...PUBLIC_MATCH };
  if (req.query.category && mongoose.Types.ObjectId.isValid(req.query.category)) match.category = req.query.category;
  if (req.query.status) match.status = req.query.status;

  const points = await Complaint.find(match, {
    complaintId: 1,
    "location.point": 1,
    category: 1,
    status: 1,
    priority: 1,
  }).limit(5000); // cap payload size for map rendering

  const features = points.map((c) => ({
    type: "Feature",
    geometry: c.location.point,
    properties: {
      complaintId: c.complaintId,
      category: c.category,
      status: c.status,
      priority: c.priority,
    },
  }));

  return sendResponse(res, 200, "Heatmap data fetched", { type: "FeatureCollection", features });
});

// GET /api/admin/dashboard - admin only, unrestricted overview
const getAdminOverview = catchAsync(async (req, res) => {
  const activeMatch = { isDeleted: false };

  const [
    totalComplaints,
    byStatus,
    byPriority,
    byDepartment,
    slaBreachedCount,
    resolutionStats,
    usersByRole,
    pendingModeration,
  ] = await Promise.all([
    Complaint.countDocuments(activeMatch),
    Complaint.aggregate([{ $match: activeMatch }, { $group: { _id: "$status", count: { $sum: 1 } } }]),
    Complaint.aggregate([{ $match: activeMatch }, { $group: { _id: "$priority", count: { $sum: 1 } } }]),
    Complaint.aggregate([
      { $match: { ...activeMatch, assignedDepartment: { $ne: null } } },
      { $group: { _id: "$assignedDepartment", count: { $sum: 1 } } },
      { $lookup: { from: "departments", localField: "_id", foreignField: "_id", as: "department" } },
      { $unwind: "$department" },
      { $project: { _id: 0, department: "$department.name", count: 1 } },
      { $sort: { count: -1 } },
    ]),
    Complaint.countDocuments({ ...activeMatch, slaBreached: true }),
    Complaint.aggregate(avgResolutionHoursStage(activeMatch)),
    User.aggregate([{ $group: { _id: "$role", count: { $sum: 1 } } }]),
    Complaint.countDocuments({ moderationStatus: "pending" }),
  ]);

  return sendResponse(res, 200, "Admin dashboard statistics fetched", {
    totalComplaints,
    byStatus,
    byPriority,
    byDepartment,
    slaBreachedCount,
    averageResolutionHours: resolutionStats[0]?.avgHours || null,
    usersByRole,
    pendingModeration,
  });
});

// GET /api/department/dashboard - officer only, own department
const getMyDepartmentDashboard = catchAsync(async (req, res) => {
  if (req.user.role !== "officer") throw ApiError.forbidden("Only department officers can view this dashboard");
  if (!req.user.department) throw ApiError.badRequest("You are not assigned to a department");

  const match = { assignedDepartment: req.user.department, isDeleted: false };

  const [totalComplaints, byStatus, slaBreachedCount, myAssignedCount, resolutionStats] = await Promise.all([
    Complaint.countDocuments(match),
    Complaint.aggregate([{ $match: match }, { $group: { _id: "$status", count: { $sum: 1 } } }]),
    Complaint.countDocuments({ ...match, slaBreached: true }),
    Complaint.countDocuments({ assignedOfficer: req.user._id, isDeleted: false }),
    Complaint.aggregate(avgResolutionHoursStage(match)),
  ]);

  return sendResponse(res, 200, "Department dashboard fetched", {
    totalComplaints,
    byStatus,
    slaBreachedCount,
    myAssignedCount,
    averageResolutionHours: resolutionStats[0]?.avgHours || null,
  });
});

export {
  getPublicStats,
  getHeatmapData,
  getAdminOverview,
  getMyDepartmentDashboard,
};
