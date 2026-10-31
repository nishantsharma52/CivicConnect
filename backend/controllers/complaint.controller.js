import Complaint from "../models/complaint.model.js";
import ComplaintStatusHistory from "../models/complaintStatusHistory.model.js";
import Category from "../models/category.model.js";
import Department from "../models/department.model.js";
import User from "../models/user.model.js";
import Feedback from "../models/feedback.model.js";
import Comment from "../models/comment.model.js";
import Notification from "../models/notification.model.js";
import uploadToCloudinary from "../utils/uploadToCloudinary.js";
import getResourceType from "../utils/getResourceType.js";
import { analyzeComplaint } from "../utils/complaintAnalysis.js";
import { canAccessComplaint, canManageComplaint, isAdmin, sameId } from "../utils/authorization.js";
import { getPagination, isValidObjectId, parseMaybeJson } from "../utils/request.js";
import { createNotification, createNotifications, notifyAdmins, notifyDepartmentStaff } from "../utils/notification.js";

const STATUS_TRANSITIONS = {
    submitted: ["under_review", "assigned", "rejected"],
    under_review: ["assigned", "rejected"],
    assigned: ["in_progress", "rejected"],
    in_progress: ["rejected"],
    resolved: [],
    rejected: [],
    reopened: ["assigned", "in_progress", "rejected"],
};

const MANUAL_STATUS_SET = new Set(["under_review", "assigned", "in_progress", "rejected"]);

const parseLocation = (value) => parseMaybeJson(value, "location");

const buildComplaintQuery = (req) => {
    const query = {};

    if (req.query.status) query.status = req.query.status;
    if (req.query.priority) query.priority = req.query.priority;
    if (req.query.category && isValidObjectId(req.query.category)) {
        query.category = req.query.category;
    }
    if (req.query.department && isValidObjectId(req.query.department)) {
        query.department = req.query.department;
    }

    if (req.query.search?.trim()) {
        const search = req.query.search.trim();
        query.$or = [
            { complaintId: { $regex: search, $options: "i" } },
            { title: { $regex: search, $options: "i" } },
            { description: { $regex: search, $options: "i" } },
        ];
    }

    return query;
};

const getComplaintOr404 = async (id) => {
    if (isValidObjectId(id)) return Complaint.findById(id);
    return Complaint.findOne({ complaintId: id });
};

const ensureAccess = (complaint, req, res) => {
    if (!canAccessComplaint(complaint, req.user)) {
        res.status(403).json({
            message: "You do not have permission to access this complaint",
        });
        return false;
    }
    return true;
};

const ensureManagementAccess = (complaint, req, res) => {
    if (!canManageComplaint(complaint, req.user)) {
        res.status(403).json({
            message: "You do not have permission to manage this complaint",
        });
        return false;
    }
    return true;
};

const uploadFiles = async (files, folder) => {
    const uploaded = [];

    for (const file of files || []) {
        const resourceType = getResourceType(file.mimetype);

        if (!resourceType) {
            const error = new Error(`Unsupported file type: ${file.originalname}`);
            error.statusCode = 400;
            throw error;
        }

        const result = await uploadToCloudinary(
            file.buffer,
            resourceType,
            folder
        );

        uploaded.push({
            url: result.secure_url,
            type: resourceType,
        });
    }

    return uploaded;
};

export const analyzeComplaintPreview = async (req, res) => {
    try {
        const { title, description, category, location: rawLocation } = req.body;
        if (!title?.trim() || !description?.trim()) return res.status(400).json({ message: "Title and description are required" });
        if (category && !isValidObjectId(category)) return res.status(400).json({ message: "Invalid category ID" });
        const location = parseLocation(rawLocation);
        const analysis = await analyzeComplaint({ title: title.trim(), description: description.trim(), categoryId: category, location });
        return res.status(200).json({
            message: "Complaint analysis completed",
            analysis: {
                suggestedCategory: analysis.category?.name || null,
                suggestedCategoryId: analysis.category?._id || null,
                suggestedDepartment: analysis.category?.department?.name || null,
                suggestedDepartmentId: analysis.category?.department?._id || null,
                suggestedPriority: analysis.priority,
                confidence: analysis.confidence,
                isDuplicate: analysis.isDuplicate,
                duplicateOf: analysis.duplicateOf,
                reason: analysis.reason,
                provider: analysis.provider,
            },
        });
    } catch (error) {
        console.error("Analyze Complaint Preview Error:", error);
        return res.status(error.statusCode || 500).json({ message: error.statusCode ? error.message : "Server error" });
    }
};

export const createComplaint = async (req, res) => {
    try {
        const {
            title,
            description,
            category,
            subCategory,
            priority,
            location: rawLocation,
        } = req.body;

        if (!title?.trim() || !description?.trim() || !category) {
            return res.status(400).json({
                message: "Title, description and category are required",
            });
        }

        if (!isValidObjectId(category)) {
            return res.status(400).json({
                message: "Invalid category ID",
            });
        }

        if (!req.files?.length) {
            return res.status(400).json({
                message: "At least one evidence image or video is required",
            });
        }

        const categoryDoc = await Category.findById(category).populate(
            "department",
            "name category isActive"
        );

        if (!categoryDoc || !categoryDoc.isActive) {
            return res.status(404).json({
                message: "Category not found or inactive",
            });
        }

        if (
            subCategory &&
            categoryDoc.subCategories?.length &&
            !categoryDoc.subCategories.some((item) =>
                item.toLowerCase() === String(subCategory).trim().toLowerCase()
            )
        ) {
            return res.status(400).json({
                message: "Invalid sub-category for the selected category",
            });
        }

        const location = parseLocation(rawLocation);
        if (location !== undefined && location !== null && typeof location !== "object") {
            return res.status(400).json({
                message: "Location must be an object",
            });
        }

        if (location?.latitude !== undefined) {
            const latitude = Number(location.latitude);
            if (Number.isNaN(latitude) || latitude < -90 || latitude > 90) {
                return res.status(400).json({
                    message: "Invalid latitude",
                });
            }
            location.latitude = latitude;
        }

        if (location?.longitude !== undefined) {
            const longitude = Number(location.longitude);
            if (Number.isNaN(longitude) || longitude < -180 || longitude > 180) {
                return res.status(400).json({
                    message: "Invalid longitude",
                });
            }
            location.longitude = longitude;
        }

        const validPriorities = new Set(["low", "medium", "high", "critical"]);
        if (priority !== undefined && !validPriorities.has(priority)) {
            return res.status(400).json({
                message: "Invalid priority",
            });
        }

        const analysis = await analyzeComplaint({
            title: title.trim(),
            description: description.trim(),
            categoryId: category,
            location,
        });

        const evidence = await uploadFiles(req.files, "civicconnect/complaints");

        const complaint = await Complaint.create({
            complaintId: `CC-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
            title: title.trim(),
            description: description.trim(),
            category: categoryDoc._id,
            subCategory: subCategory?.trim(),
            priority: priority || analysis.priority || "medium",
            status: "submitted",
            citizen: req.user.userId,
            department: categoryDoc.department?._id || null,
            assignedTo: null,
            location,
            evidence,
            aiCategory: analysis.category?._id || null,
            aiPriority: analysis.priority || null,
            aiSuggestedDepartment: analysis.category?.department?._id || null,
            aiConfidence: analysis.confidence,
            isDuplicate: analysis.isDuplicate,
            duplicateOf: analysis.duplicateOf,
        });

        await ComplaintStatusHistory.create({
            complaint: complaint._id,
            previousStatus: null,
            newStatus: "submitted",
            changedBy: req.user.userId,
            remark: analysis.isDuplicate
                ? "Complaint submitted; a similar active complaint was detected."
                : "Complaint submitted",
        });

        if (complaint.department) {
            await notifyDepartmentStaff({
                departmentId: complaint.department,
                complaint: complaint._id,
                title: "New Complaint Received",
                message: `A new complaint ${complaint.complaintId} has been submitted to your department.`,
                type: "complaint_created",
            });
        }

        await notifyAdmins({
            complaint: complaint._id,
            title: "New Complaint Submitted",
            message: `Complaint ${complaint.complaintId} was submitted and requires review.`,
            type: "complaint_created",
        });

        const populatedComplaint = await Complaint.findById(complaint._id)
            .populate("category", "name description subCategories")
            .populate("department", "name category contactEmail contactPhone")
            .populate("assignedTo", "name email")
            .populate("aiCategory", "name")
            .populate("aiSuggestedDepartment", "name");

        return res.status(201).json({
            message: "Complaint created successfully",
            complaint: populatedComplaint,
            analysis: {
                suggestedCategory: analysis.category?.name || null,
                suggestedDepartment: analysis.category?.department?.name || null,
                suggestedPriority: analysis.priority,
                confidence: analysis.confidence,
                isDuplicate: analysis.isDuplicate,
                duplicateOf: analysis.duplicateOf,
                reason: analysis.reason,
                provider: analysis.provider,
            },
        });
    } catch (error) {
        console.error("Create Complaint Error:", error);
        return res.status(error.statusCode || 500).json({
            message: error.statusCode ? error.message : "Server error",
        });
    }
};

export const getAllComplaints = async (req, res) => {
    try {
        const query = buildComplaintQuery(req);

        if (req.user.role === "department") {
            if (!req.user.department) {
                return res.status(200).json({
                    message: "Complaints fetched successfully",
                    complaints: [],
                    pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
                });
            }
            query.department = req.user.department;
        }

        const { page, limit, skip } = getPagination(req.query);
        const [complaints, total] = await Promise.all([
            Complaint.find(query)
                .populate("category", "name")
                .populate("citizen", "name email")
                .populate("department", "name")
                .populate("assignedTo", "name email")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            Complaint.countDocuments(query),
        ]);

        return res.status(200).json({
            message: "Complaints fetched successfully",
            complaints,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error("Get All Complaints Error:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

export const getMyComplaints = async (req, res) => {
    try {
        const query = buildComplaintQuery(req);
        query.citizen = req.user.userId;

        const { page, limit, skip } = getPagination(req.query);
        const [complaints, total] = await Promise.all([
            Complaint.find(query)
                .populate("category", "name")
                .populate("department", "name")
                .populate("assignedTo", "name email")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            Complaint.countDocuments(query),
        ]);

        return res.status(200).json({
            message: "Your complaints fetched successfully",
            complaints,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error("Get My Complaints Error:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

export const getComplaintById = async (req, res) => {
    try {
        const complaint = await getComplaintOr404(req.params.id);

        if (!complaint) {
            return res.status(404).json({ message: "Complaint not found" });
        }

        if (!ensureAccess(complaint, req, res)) return;

        const populated = await Complaint.findById(complaint._id)
            .populate("category", "name description subCategories")
            .populate("citizen", "name email phone")
            .populate("department", "name category contactEmail contactPhone")
            .populate("assignedTo", "name email")
            .populate("aiCategory", "name")
            .populate("aiSuggestedDepartment", "name")
            .populate("duplicateOf", "complaintId title status");

        const [history, feedback] = await Promise.all([
            ComplaintStatusHistory.find({ complaint: complaint._id })
                .populate("changedBy", "name email role")
                .sort({ createdAt: 1 }),
            Feedback.findOne({ complaint: complaint._id }).populate("citizen", "name"),
        ]);

        return res.status(200).json({
            message: "Complaint fetched successfully",
            complaint: populated,
            history,
            feedback: feedback || null,
        });
    } catch (error) {
        console.error("Get Complaint Error:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

export const getPublicComplaintByComplaintId = async (req, res) => {
    try {
        const complaint = await Complaint.findOne({
            complaintId: req.params.complaintId,
        })
            .populate("category", "name")
            .populate("department", "name")
            .populate("assignedTo", "name")
            .populate("aiCategory", "name")
            .populate("aiSuggestedDepartment", "name");

        if (!complaint) {
            return res.status(404).json({ message: "Complaint not found" });
        }

        const history = await ComplaintStatusHistory.find({
            complaint: complaint._id,
        })
            .select("previousStatus newStatus remark createdAt")
            .sort({ createdAt: 1 });

        return res.status(200).json({
            message: "Complaint tracking details fetched successfully",
            complaint,
            history,
        });
    } catch (error) {
        console.error("Public Complaint Tracking Error:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

export const updateComplaint = async (req, res) => {
    try {
        const complaint = await getComplaintOr404(req.params.id);

        if (!complaint) {
            return res.status(404).json({ message: "Complaint not found" });
        }

        if (!sameId(complaint.citizen, req.user.userId)) {
            return res.status(403).json({ message: "You can only update your own complaint" });
        }

        if (!['submitted', 'under_review'].includes(complaint.status)) {
            return res.status(400).json({ message: "Complaint cannot be updated at this stage" });
        }

        const { title, description, category, subCategory, location: rawLocation } = req.body;

        if (title !== undefined) {
            if (!String(title).trim()) return res.status(400).json({ message: "Title cannot be empty" });
            complaint.title = String(title).trim();
        }
        if (description !== undefined) {
            if (!String(description).trim()) return res.status(400).json({ message: "Description cannot be empty" });
            complaint.description = String(description).trim();
        }

        if (category !== undefined) {
            if (!isValidObjectId(category)) return res.status(400).json({ message: "Invalid category ID" });
            const categoryDoc = await Category.findById(category);
            if (!categoryDoc || !categoryDoc.isActive) {
                return res.status(404).json({ message: "Category not found or inactive" });
            }
            complaint.category = categoryDoc._id;
            complaint.department = categoryDoc.department || null;
            complaint.assignedTo = null;
        }

        if (subCategory !== undefined) complaint.subCategory = String(subCategory).trim();
        if (rawLocation !== undefined) complaint.location = parseLocation(rawLocation);

        const analysis = await analyzeComplaint({
            title: complaint.title,
            description: complaint.description,
            categoryId: complaint.category,
            location: complaint.location,
        });

        complaint.aiCategory = analysis.category?._id || null;
        complaint.aiPriority = analysis.priority || null;
        complaint.aiSuggestedDepartment = analysis.category?.department?._id || null;
        complaint.aiConfidence = analysis.confidence;
        complaint.isDuplicate = analysis.isDuplicate;
        complaint.duplicateOf = analysis.duplicateOf;

        await complaint.save();

        return res.status(200).json({
            message: "Complaint updated successfully",
            complaint,
        });
    } catch (error) {
        console.error("Update Complaint Error:", error);
        return res.status(error.statusCode || 500).json({
            message: error.statusCode ? error.message : "Server error",
        });
    }
};

export const assignDepartment = async (req, res) => {
    try {
        const { departmentId } = req.body;
        if (!departmentId || !isValidObjectId(departmentId)) {
            return res.status(400).json({ message: "Valid department ID is required" });
        }

        const complaint = await getComplaintOr404(req.params.id);
        if (!complaint) return res.status(404).json({ message: "Complaint not found" });

        const department = await Department.findById(departmentId);
        if (!department || !department.isActive) {
            return res.status(404).json({ message: "Department not found or inactive" });
        }

        if (["resolved", "rejected"].includes(complaint.status)) {
            return res.status(400).json({ message: "Closed complaints cannot be reassigned" });
        }

        const previousStatus = complaint.status;
        const previousDepartment = complaint.department;

        complaint.department = department._id;
        complaint.assignedTo = null;
        if (["submitted", "under_review"].includes(complaint.status)) {
            complaint.status = "assigned";
        }
        complaint.rejectionReason = null;
        await complaint.save();

        if (previousStatus !== complaint.status || !sameId(previousDepartment, department._id)) {
            await ComplaintStatusHistory.create({
                complaint: complaint._id,
                previousStatus,
                newStatus: complaint.status,
                changedBy: req.user.userId,
                remark: `Complaint assigned to ${department.name}`,
            });
        }

        await notifyDepartmentStaff({
            departmentId: department._id,
            complaint: complaint._id,
            title: "Complaint Assigned",
            message: `Complaint ${complaint.complaintId} has been assigned to ${department.name}.`,
            type: "complaint_assigned",
        });

        if (!sameId(previousDepartment, department._id)) {
            await createNotification({
                user: complaint.citizen,
                complaint: complaint._id,
                title: "Department Assigned",
                message: `Your complaint ${complaint.complaintId} has been assigned to ${department.name}.`,
                type: "complaint_assigned",
            });
        }

        return res.status(200).json({
            message: "Department assigned successfully",
            complaint,
        });
    } catch (error) {
        console.error("Assign Department Error:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

export const assignStaff = async (req, res) => {
    try {
        const { userId } = req.body;
        if (!userId || !isValidObjectId(userId)) {
            return res.status(400).json({ message: "Valid staff user ID is required" });
        }

        const complaint = await getComplaintOr404(req.params.id);
        if (!complaint) return res.status(404).json({ message: "Complaint not found" });

        if (req.user.role === "department" && !sameId(complaint.department, req.user.department)) {
            return res.status(403).json({ message: "You can only assign staff within your department" });
        }

        if (!complaint.department) {
            return res.status(400).json({ message: "Assign a department before assigning staff" });
        }

        if (["resolved", "rejected"].includes(complaint.status)) {
            return res.status(400).json({ message: "Closed complaints cannot be assigned" });
        }

        const staff = await User.findOne({
            _id: userId,
            role: "department",
            isActive: true,
        });

        if (!staff) return res.status(404).json({ message: "Department staff not found" });

        if (!sameId(staff.department, complaint.department)) {
            return res.status(400).json({ message: "Staff does not belong to the complaint department" });
        }

        const previousStatus = complaint.status;
        const previousAssignedTo = complaint.assignedTo;
        complaint.assignedTo = staff._id;
        if (["submitted", "under_review", "reopened"].includes(complaint.status)) {
            complaint.status = "assigned";
        }

        await complaint.save();

        if (previousStatus !== complaint.status || !sameId(previousAssignedTo, staff._id)) {
            await ComplaintStatusHistory.create({
                complaint: complaint._id,
                previousStatus,
                newStatus: complaint.status,
                changedBy: req.user.userId,
                remark: `Complaint assigned to ${staff.name}`,
            });
        }

        await createNotification({
            user: staff._id,
            complaint: complaint._id,
            title: "Complaint Assigned",
            message: `Complaint ${complaint.complaintId} has been assigned to you.`,
            type: "complaint_assigned",
        });

        await createNotification({
            user: complaint.citizen,
            complaint: complaint._id,
            title: "Staff Assigned",
            message: `A department staff member has been assigned to your complaint ${complaint.complaintId}.`,
            type: "complaint_assigned",
        });

        return res.status(200).json({
            message: "Staff assigned successfully",
            complaint,
        });
    } catch (error) {
        console.error("Assign Staff Error:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

export const updateComplaintStatus = async (req, res) => {
    try {
        const { status, remark } = req.body;
        if (!status) return res.status(400).json({ message: "Status is required" });
        if (!MANUAL_STATUS_SET.has(status)) {
            return res.status(400).json({
                message: "This status must be changed through the appropriate workflow action",
            });
        }

        const complaint = await getComplaintOr404(req.params.id);
        if (!complaint) return res.status(404).json({ message: "Complaint not found" });
        if (!ensureManagementAccess(complaint, req, res)) return;

        const previousStatus = complaint.status;
        const allowed = STATUS_TRANSITIONS[previousStatus] || [];

        if (!allowed.includes(status)) {
            return res.status(400).json({
                message: `Invalid status transition from ${previousStatus} to ${status}`,
            });
        }

        if (status === "rejected" && !remark?.trim()) {
            return res.status(400).json({ message: "Rejection reason is required" });
        }

        if (status === "under_review" && req.user.role === "department" && !sameId(complaint.department, req.user.department)) {
            return res.status(403).json({ message: "Complaint is outside your department" });
        }

        complaint.status = status;
        if (status === "rejected") {
            complaint.rejectionReason = remark.trim();
        }
        if (status !== "reopened") complaint.reopenedReason = undefined;

        await complaint.save();

        await ComplaintStatusHistory.create({
            complaint: complaint._id,
            previousStatus,
            newStatus: status,
            changedBy: req.user.userId,
            remark: remark?.trim(),
        });

        let notificationType = "status_update";
        if (status === "rejected") notificationType = "status_update";

        await createNotification({
            user: complaint.citizen,
            complaint: complaint._id,
            title: status === "rejected" ? "Complaint Rejected" : "Complaint Status Updated",
            message: status === "rejected"
                ? `Your complaint ${complaint.complaintId} was rejected. Reason: ${remark.trim()}`
                : `Your complaint ${complaint.complaintId} status changed from ${previousStatus} to ${status}.`,
            type: notificationType,
        });

        if (status === "under_review") {
            await notifyDepartmentStaff({
                departmentId: complaint.department,
                complaint: complaint._id,
                title: "Complaint Under Review",
                message: `Complaint ${complaint.complaintId} is under review.`,
                type: "status_update",
            });
        }


        return res.status(200).json({
            message: "Complaint status updated successfully",
            complaint,
        });
    } catch (error) {
        console.error("Update Complaint Status Error:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

export const addResolutionProof = async (req, res) => {
    try {
        const { departmentRemark } = req.body;

        if (!req.files?.length) {
            return res.status(400).json({ message: "Resolution proof is required" });
        }

        const complaint = await getComplaintOr404(req.params.id);
        if (!complaint) return res.status(404).json({ message: "Complaint not found" });
        if (!ensureManagementAccess(complaint, req, res)) return;

        if (!["assigned", "in_progress", "reopened"].includes(complaint.status)) {
            return res.status(400).json({ message: "Resolution proof can only be uploaded for an active complaint" });
        }

        if (!departmentRemark?.trim()) {
            return res.status(400).json({ message: "Department remark is required" });
        }

        const previousStatus = complaint.status;
        const resolutionProof = await uploadFiles(req.files, "civicconnect/resolutions");

        complaint.resolutionProof = resolutionProof;
        complaint.departmentRemark = departmentRemark.trim();
        complaint.status = "resolved";
        complaint.citizenVerifiedResolution = false;
        complaint.reopenedReason = null;
        complaint.resolvedAt = new Date();
        complaint.verifiedAt = null;

        await complaint.save();

        await ComplaintStatusHistory.create({
            complaint: complaint._id,
            previousStatus,
            newStatus: "resolved",
            changedBy: req.user.userId,
            remark: departmentRemark.trim(),
        });

        await createNotification({
            user: complaint.citizen,
            complaint: complaint._id,
            title: "Complaint Resolved",
            message: `Your complaint ${complaint.complaintId} has been resolved. Please verify the resolution.`,
            type: "complaint_resolved",
        });

        return res.status(200).json({
            message: "Resolution proof added successfully",
            complaint,
        });
    } catch (error) {
        console.error("Add Resolution Proof Error:", error);
        return res.status(error.statusCode || 500).json({
            message: error.statusCode ? error.message : "Server error",
        });
    }
};

export const verifyResolution = async (req, res) => {
    try {
        const { verified, reopenedReason } = req.body;
        if (typeof verified !== "boolean") {
            return res.status(400).json({ message: "Verified value must be true or false" });
        }

        const complaint = await getComplaintOr404(req.params.id);
        if (!complaint) return res.status(404).json({ message: "Complaint not found" });

        if (!sameId(complaint.citizen, req.user.userId)) {
            return res.status(403).json({ message: "You can only verify your own complaint" });
        }

        if (complaint.status !== "resolved") {
            return res.status(400).json({ message: "Only resolved complaints can be verified" });
        }

        if (verified) {
            complaint.citizenVerifiedResolution = true;
            complaint.verifiedAt = new Date();
            await complaint.save();

            await ComplaintStatusHistory.create({
                complaint: complaint._id,
                previousStatus: "resolved",
                newStatus: "resolved",
                changedBy: req.user.userId,
                remark: "Citizen verified the resolution",
            });

            if (complaint.assignedTo) {
                await createNotification({
                    user: complaint.assignedTo,
                    complaint: complaint._id,
                    title: "Resolution Verified",
                    message: `The citizen verified the resolution of complaint ${complaint.complaintId}.`,
                    type: "status_update",
                });
            }

            return res.status(200).json({
                message: "Resolution verified successfully",
                complaint,
            });
        }

        if (!reopenedReason?.trim()) {
            return res.status(400).json({ message: "Reopen reason is required" });
        }

        complaint.citizenVerifiedResolution = false;
        complaint.status = "reopened";
        complaint.reopenedReason = reopenedReason.trim();
        complaint.verifiedAt = null;
        await complaint.save();

        await ComplaintStatusHistory.create({
            complaint: complaint._id,
            previousStatus: "resolved",
            newStatus: "reopened",
            changedBy: req.user.userId,
            remark: reopenedReason.trim(),
        });

        if (complaint.assignedTo) {
            await createNotification({
                user: complaint.assignedTo,
                complaint: complaint._id,
                title: "Complaint Reopened",
                message: `Complaint ${complaint.complaintId} has been reopened by the citizen.`,
                type: "complaint_reopened",
            });
        } else {
            await notifyDepartmentStaff({
                departmentId: complaint.department,
                complaint: complaint._id,
                title: "Complaint Reopened",
                message: `Complaint ${complaint.complaintId} has been reopened by the citizen.`,
                type: "complaint_reopened",
            });
        }

        return res.status(200).json({
            message: "Complaint reopened successfully",
            complaint,
        });
    } catch (error) {
        console.error("Verify Resolution Error:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

export const deleteComplaint = async (req, res) => {
    try {
        const complaint = await getComplaintOr404(req.params.id);
        if (!complaint) return res.status(404).json({ message: "Complaint not found" });

        const admin = isAdmin(req.user);
        const owner = sameId(complaint.citizen, req.user.userId);

        if (!admin && !owner) {
            return res.status(403).json({ message: "You can only delete your own complaint" });
        }

        if (!admin && complaint.status !== "submitted") {
            return res.status(400).json({
                message: "Only submitted complaints can be deleted by a citizen",
            });
        }

        await Promise.all([
            Complaint.findByIdAndDelete(complaint._id),
            ComplaintStatusHistory.deleteMany({ complaint: complaint._id }),
            Feedback.deleteMany({ complaint: complaint._id }),
            Comment.deleteMany({ complaint: complaint._id }),
            Notification.deleteMany({ complaint: complaint._id }),
        ]);

        return res.status(200).json({ message: "Complaint deleted successfully" });
    } catch (error) {
        console.error("Delete Complaint Error:", error);
        return res.status(500).json({ message: "Server error" });
    }
};
