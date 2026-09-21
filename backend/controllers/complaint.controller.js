import Complaint from "../models/complaint.model.js";
import ComplaintStatusHistory from "../models/complaintStatusHistory.model.js";
import Category from "../models/category.model.js";
import Department from "../models/department.model.js";
import User from "../models/user.model.js";
import Notification from "../models/notification.model.js";
import uploadToCloudinary from "../utils/uploadToCloudinary.js";
import getResourceType from "../utils/getResourceType.js";


// GENERATE COMPLAINT ID
const generateComplaintId = () => {
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.floor(1000 + Math.random() * 9000);

    return `CC-${timestamp}-${random}`;
};


// CREATE COMPLAINT
export const createComplaint = async (req, res) => {
    try {
        const {
            title,
            description,
            category,
            subCategory,
            priority,
            location,
        } = req.body;

        // Basic validation
        if (!title || !description || !category) {
            return res.status(400).json({
                message: "Title, description and category are required",
            });
        }

        // Check uploaded files
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                message: "At least one evidence image or video is required",
            });
        }

        // Upload evidence files to Cloudinary
        const evidence = [];

        for (const file of req.files) {
            const resourceType = getResourceType(file.mimetype);

            if (!resourceType) {
                return res.status(400).json({
                    message: `Unsupported file type: ${file.originalname}`,
                });
            }

            const uploadedFile = await uploadToCloudinary(
                file.buffer,
                resourceType,
                "civicconnect/complaints"
            );

            evidence.push({
                url: uploadedFile.secure_url,
                type: resourceType,
            });
        }

        // Generate complaint ID
        const complaintId = `CC-${Date.now()}`;

        const complaint = await Complaint.create({
            complaintId,
            title,
            description,
            category,
            subCategory,
            priority: priority || "medium",
            citizen: req.user.userId,
            location:
                typeof location === "string"
                    ? JSON.parse(location)
                    : location,
            evidence,
        });

        // Create status history
        await ComplaintStatusHistory.create({
            complaint: complaint._id,
            previousStatus: null,
            newStatus: "submitted",
            changedBy: req.user.userId,
            remark: "Complaint submitted",
        });

        return res.status(201).json({
            message: "Complaint created successfully",
            complaint,
        });

    } catch (error) {
        console.error("Create Complaint Error:", error);

        return res.status(500).json({
            message: "Server error",
        });
    }
};


// GET ALL COMPLAINTS
export const getAllComplaints = async (req, res) => {
    try {
        const complaints = await Complaint.find()
            .populate("category", "name")
            .populate("citizen", "name email")
            .populate("department", "name")
            .populate("assignedTo", "name email")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            message: "Complaints fetched successfully",
            complaints,
        });

    } catch (error) {
        console.error("Get All Complaints Error:", error);

        return res.status(500).json({
            message: "Server error",
        });
    }
};


// GET MY COMPLAINTS
export const getMyComplaints = async (req, res) => {
    try {
        const complaints = await Complaint.find({
            citizen: req.user.userId,
        })
            .populate("category", "name")
            .populate("department", "name")
            .populate("assignedTo", "name email")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            message: "Your complaints fetched successfully",
            complaints,
        });

    } catch (error) {
        console.error("Get My Complaints Error:", error);

        return res.status(500).json({
            message: "Server error",
        });
    }
};


// GET SINGLE COMPLAINT
export const getComplaintById = async (req, res) => {
    try {
        const complaint = await Complaint.findById(req.params.id)
            .populate("category", "name description subCategories")
            .populate("citizen", "name email phone")
            .populate("department", "name category contactEmail contactPhone")
            .populate("assignedTo", "name email")
            .populate("aiCategory", "name")
            .populate("aiSuggestedDepartment", "name");

        if (!complaint) {
            return res.status(404).json({
                message: "Complaint not found",
            });
        }

        return res.status(200).json({
            message: "Complaint fetched successfully",
            complaint,
        });

    } catch (error) {
        console.error("Get Complaint Error:", error);

        return res.status(500).json({
            message: "Server error",
        });
    }
};


// UPDATE COMPLAINT
export const updateComplaint = async (req, res) => {
    try {
        const complaint = await Complaint.findById(req.params.id);

        if (!complaint) {
            return res.status(404).json({
                message: "Complaint not found",
            });
        }

        if (
            complaint.citizen.toString() !== req.user.userId
        ) {
            return res.status(403).json({
                message: "You can only update your own complaint",
            });
        }

        if (
            complaint.status !== "submitted" &&
            complaint.status !== "under_review"
        ) {
            return res.status(400).json({
                message: "Complaint cannot be updated at this stage",
            });
        }

        const {
            title,
            description,
            subCategory,
            location,
            evidence,
        } = req.body;

        if (title !== undefined) {
            complaint.title = title;
        }

        if (description !== undefined) {
            complaint.description = description;
        }

        if (subCategory !== undefined) {
            complaint.subCategory = subCategory;
        }

        if (location !== undefined) {
            complaint.location = location;
        }

        if (evidence !== undefined) {
            complaint.evidence = evidence;
        }

        await complaint.save();

        return res.status(200).json({
            message: "Complaint updated successfully",
            complaint,
        });

    } catch (error) {
        console.error("Update Complaint Error:", error);

        return res.status(500).json({
            message: "Server error",
        });
    }
};


// ASSIGN DEPARTMENT
export const assignDepartment = async (req, res) => {
    try {
        const {
            departmentId,
        } = req.body;

        if (!departmentId) {
            return res.status(400).json({
                message: "Department ID is required",
            });
        }

        const complaint = await Complaint.findById(req.params.id);

        if (!complaint) {
            return res.status(404).json({
                message: "Complaint not found",
            });
        }

        const department = await Department.findById(departmentId);

        if (!department || !department.isActive) {
            return res.status(404).json({
                message: "Department not found or inactive",
            });
        }

        complaint.department = departmentId;

        if (complaint.status === "submitted") {
            complaint.status = "assigned";
        }

        await complaint.save();

        await ComplaintStatusHistory.create({
            complaint: complaint._id,
            previousStatus: "submitted",
            newStatus: complaint.status,
            changedBy: req.user.userId,
            remark: `Complaint assigned to ${department.name}`,
        });

        const staff = await User.find({
            department: departmentId,
            role: "department",
            isActive: true,
        }).select("_id");

        const notifications = staff.map((user) => ({
            user: user._id,
            complaint: complaint._id,
            title: "Complaint Assigned",
            message: `Complaint ${complaint.complaintId} has been assigned to your department.`,
            type: "complaint_assigned",
        }));

        if (notifications.length > 0) {
            await Notification.insertMany(notifications);
        }

        return res.status(200).json({
            message: "Department assigned successfully",
            complaint,
        });

    } catch (error) {
        console.error("Assign Department Error:", error);

        return res.status(500).json({
            message: "Server error",
        });
    }
};


// ASSIGN STAFF
export const assignStaff = async (req, res) => {
    try {
        const {
            userId,
        } = req.body;

        if (!userId) {
            return res.status(400).json({
                message: "Staff user ID is required",
            });
        }

        const complaint = await Complaint.findById(req.params.id);

        if (!complaint) {
            return res.status(404).json({
                message: "Complaint not found",
            });
        }

        const staff = await User.findOne({
            _id: userId,
            role: "department",
            isActive: true,
        });

        if (!staff) {
            return res.status(404).json({
                message: "Department staff not found",
            });
        }

        if (
            complaint.department &&
            staff.department &&
            complaint.department.toString() !== staff.department.toString()
        ) {
            return res.status(400).json({
                message: "Staff does not belong to the complaint department",
            });
        }

        complaint.assignedTo = staff._id;

        if (
            complaint.status === "submitted" ||
            complaint.status === "under_review"
        ) {
            complaint.status = "assigned";
        }

        await complaint.save();

        await ComplaintStatusHistory.create({
            complaint: complaint._id,
            previousStatus: "under_review",
            newStatus: complaint.status,
            changedBy: req.user.userId,
            remark: `Complaint assigned to ${staff.name}`,
        });

        await Notification.create({
            user: staff._id,
            complaint: complaint._id,
            title: "Complaint Assigned",
            message: `Complaint ${complaint.complaintId} has been assigned to you.`,
            type: "complaint_assigned",
        });

        return res.status(200).json({
            message: "Staff assigned successfully",
            complaint,
        });

    } catch (error) {
        console.error("Assign Staff Error:", error);

        return res.status(500).json({
            message: "Server error",
        });
    }
};


// CHANGE COMPLAINT STATUS
export const updateComplaintStatus = async (req, res) => {
    try {
        const {
            status,
            remark,
        } = req.body;

        if (!status) {
            return res.status(400).json({
                message: "Status is required",
            });
        }

        const complaint = await Complaint.findById(req.params.id);

        if (!complaint) {
            return res.status(404).json({
                message: "Complaint not found",
            });
        }

        const allowedStatuses = [
            "submitted",
            "under_review",
            "assigned",
            "in_progress",
            "resolved",
            "rejected",
            "reopened",
        ];

        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({
                message: "Invalid complaint status",
            });
        }

        const previousStatus = complaint.status;

        complaint.status = status;

        if (status === "rejected") {
            if (!remark) {
                return res.status(400).json({
                    message: "Rejection reason is required",
                });
            }

            complaint.rejectionReason = remark;
        }

        await complaint.save();

        await ComplaintStatusHistory.create({
            complaint: complaint._id,
            previousStatus,
            newStatus: status,
            changedBy: req.user.userId,
            remark,
        });

        let notificationType = "status_update";

        if (status === "resolved") {
            notificationType = "complaint_resolved";
        }

        if (status === "reopened") {
            notificationType = "complaint_reopened";
        }

        await Notification.create({
            user: complaint.citizen,
            complaint: complaint._id,
            title: "Complaint Status Updated",
            message: `Your complaint ${complaint.complaintId} status changed from ${previousStatus} to ${status}.`,
            type: notificationType,
        });

        return res.status(200).json({
            message: "Complaint status updated successfully",
            complaint,
        });

    } catch (error) {
        console.error("Update Complaint Status Error:", error);

        return res.status(500).json({
            message: "Server error",
        });
    }
};


// ADD RESOLUTION PROOF
export const addResolutionProof = async (req, res) => {
    try {
        const {
            departmentRemark,
        } = req.body;

        // Check uploaded files
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                message: "Resolution proof is required",
            });
        }

        const complaint = await Complaint.findById(req.params.id);

        if (!complaint) {
            return res.status(404).json({
                message: "Complaint not found",
            });
        }

        const previousStatus = complaint.status;

        // Upload resolution proof files
        const resolutionProof = [];

        for (const file of req.files) {
            const resourceType = getResourceType(file.mimetype);

            if (!resourceType) {
                return res.status(400).json({
                    message: `Unsupported file type: ${file.originalname}`,
                });
            }

            const uploadedFile = await uploadToCloudinary(
                file.buffer,
                resourceType,
                "civicconnect/resolutions"
            );

            resolutionProof.push({
                url: uploadedFile.secure_url,
                type: resourceType,
            });
        }

        complaint.resolutionProof = resolutionProof;
        complaint.departmentRemark = departmentRemark;
        complaint.status = "resolved";

        await complaint.save();

        // Status history
        await ComplaintStatusHistory.create({
            complaint: complaint._id,
            previousStatus,
            newStatus: "resolved",
            changedBy: req.user.userId,
            remark:
                departmentRemark ||
                "Resolution proof uploaded",
        });

        // Notify citizen
        await Notification.create({
            user: complaint.citizen,
            complaint: complaint._id,
            title: "Complaint Resolved",
            message: `Your complaint ${complaint.complaintId} has been marked as resolved.`,
            type: "complaint_resolved",
        });

        return res.status(200).json({
            message: "Resolution proof added successfully",
            complaint,
        });

    } catch (error) {
        console.error("Add Resolution Proof Error:", error);

        return res.status(500).json({
            message: "Server error",
        });
    }
};


// VERIFY RESOLUTION BY CITIZEN
export const verifyResolution = async (req, res) => {
    try {
        const {
            verified,
            reopenedReason,
        } = req.body;

        const complaint = await Complaint.findById(req.params.id);

        if (!complaint) {
            return res.status(404).json({
                message: "Complaint not found",
            });
        }

        if (
            complaint.citizen.toString() !== req.user.userId
        ) {
            return res.status(403).json({
                message: "You can only verify your own complaint",
            });
        }

        if (complaint.status !== "resolved") {
            return res.status(400).json({
                message: "Only resolved complaints can be verified",
            });
        }

        if (verified === true) {
            complaint.citizenVerifiedResolution = true;

            await complaint.save();

            return res.status(200).json({
                message: "Resolution verified successfully",
                complaint,
            });
        }

        if (verified === false) {
            complaint.citizenVerifiedResolution = false;
            complaint.status = "reopened";
            complaint.reopenedReason = reopenedReason;

            await complaint.save();

            await ComplaintStatusHistory.create({
                complaint: complaint._id,
                previousStatus: "resolved",
                newStatus: "reopened",
                changedBy: req.user.userId,
                remark: reopenedReason,
            });

            await Notification.create({
                user: complaint.assignedTo,
                complaint: complaint._id,
                title: "Complaint Reopened",
                message: `Complaint ${complaint.complaintId} has been reopened by the citizen.`,
                type: "complaint_reopened",
            });

            return res.status(200).json({
                message: "Complaint reopened successfully",
                complaint,
            });
        }

        return res.status(400).json({
            message: "Verified value must be true or false",
        });

    } catch (error) {
        console.error("Verify Resolution Error:", error);

        return res.status(500).json({
            message: "Server error",
        });
    }
};


// DELETE COMPLAINT
export const deleteComplaint = async (req, res) => {
    try {
        const complaint = await Complaint.findById(req.params.id);

        if (!complaint) {
            return res.status(404).json({
                message: "Complaint not found",
            });
        }

        if (
            complaint.citizen.toString() !== req.user.userId
        ) {
            return res.status(403).json({
                message: "You can only delete your own complaint",
            });
        }

        if (
            complaint.status !== "submitted"
        ) {
            return res.status(400).json({
                message: "Complaint cannot be deleted after processing has started",
            });
        }

        await Complaint.findByIdAndDelete(req.params.id);

        await ComplaintStatusHistory.deleteMany({
            complaint: req.params.id,
        });

        return res.status(200).json({
            message: "Complaint deleted successfully",
        });

    } catch (error) {
        console.error("Delete Complaint Error:", error);

        return res.status(500).json({
            message: "Server error",
        });
    }
};