import Feedback from "../models/feedback.model.js";
import Complaint from "../models/complaint.model.js";
import { canAccessComplaint, sameId } from "../utils/authorization.js";
import { createNotification, notifyAdmins, notifyDepartmentStaff } from "../utils/notification.js";
import { isValidObjectId } from "../utils/request.js";

export const createFeedback = async (req, res) => {
    try {
        const { rating, comment, resolutionSatisfied } = req.body;
        const numericRating = Number(rating);

        if (rating === undefined || resolutionSatisfied === undefined) {
            return res.status(400).json({ message: "Rating and resolution satisfaction are required" });
        }
        if (!Number.isFinite(numericRating) || numericRating < 1 || numericRating > 5) {
            return res.status(400).json({ message: "Rating must be between 1 and 5" });
        }
        if (typeof resolutionSatisfied !== "boolean") {
            return res.status(400).json({ message: "Resolution satisfaction must be true or false" });
        }
        if (!isValidObjectId(req.params.complaintId)) {
            return res.status(400).json({ message: "Invalid complaint ID" });
        }

        const complaint = await Complaint.findById(req.params.complaintId);
        if (!complaint) return res.status(404).json({ message: "Complaint not found" });

        if (!sameId(complaint.citizen, req.user.userId)) {
            return res.status(403).json({ message: "You can only give feedback for your own complaint" });
        }
        if (complaint.status !== "resolved" || !complaint.citizenVerifiedResolution) {
            return res.status(400).json({ message: "Feedback requires a resolved and citizen-verified complaint" });
        }

        const existing = await Feedback.findOne({ complaint: complaint._id });
        if (existing) return res.status(409).json({ message: "Feedback already submitted for this complaint" });

        const feedback = await Feedback.create({
            complaint: complaint._id,
            citizen: req.user.userId,
            rating: numericRating,
            comment: comment?.trim(),
            resolutionSatisfied,
        });

        await notifyDepartmentStaff({
            departmentId: complaint.department,
            complaint: complaint._id,
            title: "Citizen Feedback Received",
            message: `Citizen feedback has been submitted for complaint ${complaint.complaintId}.`,
            type: "general",
        });

        await notifyAdmins({
            complaint: complaint._id,
            title: "New Citizen Feedback",
            message: `New feedback has been submitted for complaint ${complaint.complaintId}.`,
            type: "general",
        });

        return res.status(201).json({
            message: "Feedback submitted successfully",
            feedback,
        });
    } catch (error) {
        console.error("Create Feedback Error:", error);
        if (error.code === 11000) {
            return res.status(409).json({ message: "Feedback already submitted for this complaint" });
        }
        return res.status(500).json({ message: "Server error" });
    }
};

export const getComplaintFeedback = async (req, res) => {
    try {
        if (!isValidObjectId(req.params.complaintId)) {
            return res.status(400).json({ message: "Invalid complaint ID" });
        }

        const complaint = await Complaint.findById(req.params.complaintId).select("citizen department assignedTo");
        if (!complaint) return res.status(404).json({ message: "Complaint not found" });
        if (!canAccessComplaint(complaint, req.user)) {
            return res.status(403).json({ message: "You do not have permission to view this feedback" });
        }

        const feedback = await Feedback.findOne({ complaint: complaint._id })
            .populate("citizen", "name");

        if (!feedback) return res.status(404).json({ message: "Feedback not found" });

        return res.status(200).json({
            message: "Feedback fetched successfully",
            feedback,
        });
    } catch (error) {
        console.error("Get Complaint Feedback Error:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

export const getAllFeedback = async (req, res) => {
    try {
        const feedback = await Feedback.find()
            .populate("citizen", "name email")
            .populate({
                path: "complaint",
                select: "complaintId title status department",
                populate: { path: "department", select: "name" },
            })
            .sort({ createdAt: -1 });

        return res.status(200).json({
            message: "All feedback fetched successfully",
            feedback,
        });
    } catch (error) {
        console.error("Get All Feedback Error:", error);
        return res.status(500).json({ message: "Server error" });
    }
};
