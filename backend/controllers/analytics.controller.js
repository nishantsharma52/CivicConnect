import mongoose from "mongoose";
import Complaint from "../models/complaint.model.js";
import Feedback from "../models/feedback.model.js";
import User from "../models/user.model.js";
import Department from "../models/department.model.js";
import Category from "../models/category.model.js";

const buildResolutionRate = (resolved, total) =>
    total ? Number(((resolved / total) * 100).toFixed(2)) : 0;

export const getPublicAnalytics = async (req, res) => {
    try {
        const filter = {};

        if (req.query.category) {
            if (!mongoose.Types.ObjectId.isValid(req.query.category)) return res.status(400).json({ message: "Invalid category filter" });
            if (!(await Category.exists({ _id: req.query.category }))) return res.status(400).json({ message: "Invalid category filter" });
            filter.category = req.query.category;
        }
        if (req.query.department) {
            if (!mongoose.Types.ObjectId.isValid(req.query.department)) return res.status(400).json({ message: "Invalid department filter" });
            if (!(await Department.exists({ _id: req.query.department }))) return res.status(400).json({ message: "Invalid department filter" });
            filter.department = req.query.department;
        }
        const validStatuses = ["submitted", "under_review", "assigned", "in_progress", "resolved", "rejected", "reopened"];
        const validPriorities = ["low", "medium", "high", "critical"];
        if (req.query.status && !validStatuses.includes(req.query.status)) return res.status(400).json({ message: "Invalid status filter" });
        if (req.query.priority && !validPriorities.includes(req.query.priority)) return res.status(400).json({ message: "Invalid priority filter" });
        if (req.query.status) filter.status = req.query.status;
        if (req.query.priority) filter.priority = req.query.priority;

        if (req.query.from || req.query.to) {
            filter.createdAt = {};
            if (req.query.from) {
                const from = new Date(req.query.from);
                if (Number.isNaN(from.getTime())) return res.status(400).json({ message: "Invalid from date" });
                filter.createdAt.$gte = from;
            }
            if (req.query.to) {
                const to = new Date(req.query.to);
                if (Number.isNaN(to.getTime())) return res.status(400).json({ message: "Invalid to date" });
                to.setHours(23, 59, 59, 999);
                filter.createdAt.$lte = to;
            }
        }

        const resolvedComplaints = await Complaint.countDocuments({ ...filter, status: "resolved" });
        const pendingComplaints = await Complaint.countDocuments({
            ...filter,
            status: { $nin: ["resolved", "rejected"] },
        });
        const totalComplaints = await Complaint.countDocuments(filter);

        const [statusData, categoryData, departmentData, monthlyData, locations, recentResolved, feedbackStats] = await Promise.all([
            Complaint.aggregate([{ $match: filter }, { $group: { _id: "$status", count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
            Complaint.aggregate([
                { $match: filter }, { $group: { _id: "$category", count: { $sum: 1 } } }, { $sort: { count: -1 } },
                { $lookup: { from: "categories", localField: "_id", foreignField: "_id", as: "category" } },
                { $unwind: { path: "$category", preserveNullAndEmptyArrays: true } },
                { $project: { _id: 0, categoryId: "$_id", name: { $ifNull: ["$category.name", "Unknown"] }, count: 1 } },
            ]),
            Complaint.aggregate([
                { $match: filter }, { $group: { _id: "$department", count: { $sum: 1 } } }, { $sort: { count: -1 } },
                { $lookup: { from: "departments", localField: "_id", foreignField: "_id", as: "department" } },
                { $unwind: { path: "$department", preserveNullAndEmptyArrays: true } },
                { $project: { _id: 0, departmentId: "$_id", name: { $ifNull: ["$department.name", "Unassigned"] }, count: 1 } },
            ]),
            Complaint.aggregate([
                { $match: filter },
                { $group: { _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } }, count: { $sum: 1 } } },
                { $sort: { "_id.year": 1, "_id.month": 1 } },
                { $project: { _id: 0, year: "$_id.year", month: "$_id.month", count: 1 } },
            ]),
            Complaint.find({ ...filter, "location.latitude": { $ne: null }, "location.longitude": { $ne: null } })
                .select("complaintId title status category department priority location createdAt")
                .populate("category", "name").populate("department", "name").limit(500),
            Complaint.find({ ...filter, status: "resolved" })
                .select("complaintId title department location resolvedAt createdAt")
                .populate("department", "name").sort({ resolvedAt: -1, updatedAt: -1 }).limit(10),
            Feedback.aggregate([
                { $lookup: { from: "complaints", localField: "complaint", foreignField: "_id", as: "complaint" } },
                { $unwind: "$complaint" },
                ...(filter.category || filter.department
                    ? [{ $match: {
                        ...(filter.category ? { "complaint.category": filter.category } : {}),
                        ...(filter.department ? { "complaint.department": filter.department } : {}),
                    } }]
                    : []),
                { $group: { _id: null, averageRating: { $avg: "$rating" }, totalFeedback: { $sum: 1 } } },
            ]),
        ]);

        const effectiveFeedback = feedbackStats;

        const resolvedWithDates = await Complaint.find({ ...filter, status: "resolved", resolvedAt: { $ne: null } }).select("createdAt resolvedAt");
        const totalResolutionDays = resolvedWithDates.reduce((sum, complaint) => {
            const created = new Date(complaint.createdAt).getTime();
            const resolved = new Date(complaint.resolvedAt).getTime();
            return sum + Math.max((resolved - created) / 86400000, 0);
        }, 0);
        const averageResolutionDays = resolvedWithDates.length ? Number((totalResolutionDays / resolvedWithDates.length).toFixed(2)) : 0;
        const averageRating = effectiveFeedback[0]?.averageRating || 0;

        return res.status(200).json({
            message: "Public analytics fetched successfully",
            analytics: {
                totalComplaints,
                resolvedComplaints,
                pendingComplaints,
                resolutionRate: buildResolutionRate(resolvedComplaints, totalComplaints),
                averageResolutionDays,
                averageRating: Number(Number(averageRating).toFixed(2)),
                totalFeedback: effectiveFeedback[0]?.totalFeedback || 0,
                byStatus: statusData.map((item) => ({ status: item._id, count: item.count })),
                byCategory: categoryData,
                byDepartment: departmentData,
                byMonth: monthlyData,
                locations,
                recentResolved,
            },
        });
    } catch (error) {
        console.error("Get Public Analytics Error:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

export const getAdminAnalytics = async (req, res) => {
    try {
        const [
            totalUsers,
            citizens,
            departmentStaff,
            admins,
            totalDepartments,
            activeDepartments,
            totalCategories,
            activeCategories,
            totalComplaints,
            resolvedComplaints,
            criticalComplaints,
            unassignedComplaints,
        ] = await Promise.all([
            User.countDocuments(),
            User.countDocuments({ role: "citizen" }),
            User.countDocuments({ role: "department" }),
            User.countDocuments({ role: "admin" }),
            Department.countDocuments(),
            Department.countDocuments({ isActive: true }),
            Category.countDocuments(),
            Category.countDocuments({ isActive: true }),
            Complaint.countDocuments(),
            Complaint.countDocuments({ status: "resolved" }),
            Complaint.countDocuments({ priority: "critical", status: { $nin: ["resolved", "rejected"] } }),
            Complaint.countDocuments({ department: null, status: { $nin: ["resolved", "rejected"] } }),
        ]);

        return res.status(200).json({
            message: "Admin analytics fetched successfully",
            analytics: {
                totalUsers,
                users: { citizens, departmentStaff, admins },
                totalDepartments,
                activeDepartments,
                totalCategories,
                activeCategories,
                totalComplaints,
                resolvedComplaints,
                criticalComplaints,
                unassignedComplaints,
                resolutionRate: buildResolutionRate(resolvedComplaints, totalComplaints),
            },
        });
    } catch (error) {
        console.error("Get Admin Analytics Error:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

export const getDepartmentAnalytics = async (req, res) => {
    try {
        const departmentId = req.user.department;
        if (!departmentId) {
            return res.status(200).json({
                message: "Department analytics fetched successfully",
                analytics: {
                    totalComplaints: 0,
                    resolvedComplaints: 0,
                    pendingComplaints: 0,
                    inProgressComplaints: 0,
                    criticalComplaints: 0,
                    resolutionRate: 0,
                },
            });
        }

        const totalComplaints = await Complaint.countDocuments({ department: departmentId });
        const resolvedComplaints = await Complaint.countDocuments({ department: departmentId, status: "resolved" });
        const inProgressComplaints = await Complaint.countDocuments({ department: departmentId, status: "in_progress" });
        const pendingComplaints = await Complaint.countDocuments({
            department: departmentId,
            status: { $in: ["submitted", "under_review", "assigned", "reopened"] },
        });
        const criticalComplaints = await Complaint.countDocuments({
            department: departmentId,
            priority: "critical",
            status: { $nin: ["resolved", "rejected"] },
        });

        return res.status(200).json({
            message: "Department analytics fetched successfully",
            analytics: {
                totalComplaints,
                resolvedComplaints,
                pendingComplaints,
                inProgressComplaints,
                criticalComplaints,
                resolutionRate: buildResolutionRate(resolvedComplaints, totalComplaints),
            },
        });
    } catch (error) {
        console.error("Get Department Analytics Error:", error);
        return res.status(500).json({ message: "Server error" });
    }
};
