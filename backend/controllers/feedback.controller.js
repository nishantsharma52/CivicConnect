import Feedback from "../models/feedback.model.js";
import Complaint from "../models/complaint.model.js";


// CREATE FEEDBACK
export const createFeedback = async (req, res) => {
    try {
        const {
            rating,
            comment,
            resolutionSatisfied,
        } = req.body;

        if (
            rating === undefined ||
            resolutionSatisfied === undefined
        ) {
            return res.status(400).json({
                message: "Rating and resolution satisfaction are required",
            });
        }

        if (rating < 1 || rating > 5) {
            return res.status(400).json({
                message: "Rating must be between 1 and 5",
            });
        }

        const complaint = await Complaint.findById(
            req.params.complaintId
        );

        if (!complaint) {
            return res.status(404).json({
                message: "Complaint not found",
            });
        }

        if (
            complaint.citizen.toString() !== req.user.userId
        ) {
            return res.status(403).json({
                message: "You can only give feedback for your own complaint",
            });
        }

        if (complaint.status !== "resolved") {
            return res.status(400).json({
                message: "Feedback can only be given for resolved complaints",
            });
        }

        if (!complaint.citizenVerifiedResolution) {
            return res.status(400).json({
                message: "Please verify the resolution before giving feedback",
            });
        }

        const existingFeedback = await Feedback.findOne({
            complaint: complaint._id,
        });

        if (existingFeedback) {
            return res.status(409).json({
                message: "Feedback already submitted for this complaint",
            });
        }

        const feedback = await Feedback.create({
            complaint: complaint._id,
            citizen: req.user.userId,
            rating,
            comment,
            resolutionSatisfied,
        });

        return res.status(201).json({
            message: "Feedback submitted successfully",
            feedback,
        });

    } catch (error) {
        console.error("Create Feedback Error:", error);

        return res.status(500).json({
            message: "Server error",
        });
    }
};


// GET FEEDBACK FOR COMPLAINT
export const getComplaintFeedback = async (req, res) => {
    try {
        const complaint = await Complaint.findById(
            req.params.complaintId
        );

        if (!complaint) {
            return res.status(404).json({
                message: "Complaint not found",
            });
        }

        const feedback = await Feedback.findOne({
            complaint: complaint._id,
        })
            .populate("citizen", "name");

        if (!feedback) {
            return res.status(404).json({
                message: "Feedback not found",
            });
        }

        return res.status(200).json({
            message: "Feedback fetched successfully",
            feedback,
        });

    } catch (error) {
        console.error("Get Complaint Feedback Error:", error);

        return res.status(500).json({
            message: "Server error",
        });
    }
};


// GET ALL FEEDBACK
export const getAllFeedback = async (req, res) => {
    try {
        const feedback = await Feedback.find()
            .populate("citizen", "name email")
            .populate({
                path: "complaint",
                select: "complaintId title status department",
                populate: {
                    path: "department",
                    select: "name",
                },
            })
            .sort({ createdAt: -1 });

        return res.status(200).json({
            message: "All feedback fetched successfully",
            feedback,
        });

    } catch (error) {
        console.error("Get All Feedback Error:", error);

        return res.status(500).json({
            message: "Server error",
        });
    }
};
