import Comment from "../models/comment.model.js";
import Complaint from "../models/complaint.model.js";
import User from "../models/user.model.js";


// ADD COMMENT
export const addComment = async (req, res) => {
    try {
        const {
            comment,
            isInternal = false,
        } = req.body;

        if (!comment || !comment.trim()) {
            return res.status(400).json({
                message: "Comment is required",
            });
        }

        const complaint = await Complaint.findById(req.params.complaintId);

        if (!complaint) {
            return res.status(404).json({
                message: "Complaint not found",
            });
        }

        const user = await User.findById(req.user.userId);

        if (!user) {
            return res.status(404).json({
                message: "User not found",
            });
        }

        if (isInternal && user.role === "citizen") {
            return res.status(403).json({
                message: "Citizens cannot create internal comments",
            });
        }

        const newComment = await Comment.create({
            complaint: complaint._id,
            user: user._id,
            comment: comment.trim(),
            isInternal,
        });

        const populatedComment = await Comment.findById(newComment._id)
            .populate("user", "name email role");

        return res.status(201).json({
            message: "Comment added successfully",
            comment: populatedComment,
        });

    } catch (error) {
        console.error("Add Comment Error:", error);

        return res.status(500).json({
            message: "Server error",
        });
    }
};


// GET COMMENTS
export const getComplaintComments = async (req, res) => {
    try {
        const complaint = await Complaint.findById(req.params.complaintId);

        if (!complaint) {
            return res.status(404).json({
                message: "Complaint not found",
            });
        }

        const user = await User.findById(req.user.userId);

        if (!user) {
            return res.status(404).json({
                message: "User not found",
            });
        }

        let filter = {
            complaint: complaint._id,
        };

        // Citizen only sees public comments
        if (user.role === "citizen") {
            filter.isInternal = false;
        }

        const comments = await Comment.find(filter)
            .populate("user", "name email role")
            .sort({ createdAt: 1 });

        return res.status(200).json({
            message: "Comments fetched successfully",
            comments,
        });

    } catch (error) {
        console.error("Get Comments Error:", error);

        return res.status(500).json({
            message: "Server error",
        });
    }
};


// UPDATE COMMENT
export const updateComment = async (req, res) => {
    try {
        const {
            comment,
        } = req.body;

        if (!comment || !comment.trim()) {
            return res.status(400).json({
                message: "Comment is required",
            });
        }

        const existingComment = await Comment.findById(req.params.id);

        if (!existingComment) {
            return res.status(404).json({
                message: "Comment not found",
            });
        }

        if (
            existingComment.user.toString() !== req.user.userId
        ) {
            return res.status(403).json({
                message: "You can only edit your own comment",
            });
        }

        existingComment.comment = comment.trim();

        await existingComment.save();

        return res.status(200).json({
            message: "Comment updated successfully",
            comment: existingComment,
        });

    } catch (error) {
        console.error("Update Comment Error:", error);

        return res.status(500).json({
            message: "Server error",
        });
    }
};


// DELETE COMMENT
export const deleteComment = async (req, res) => {
    try {
        const comment = await Comment.findById(req.params.id);

        if (!comment) {
            return res.status(404).json({
                message: "Comment not found",
            });
        }

        if (
            comment.user.toString() !== req.user.userId
        ) {
            return res.status(403).json({
                message: "You can only delete your own comment",
            });
        }

        await Comment.findByIdAndDelete(req.params.id);

        return res.status(200).json({
            message: "Comment deleted successfully",
        });

    } catch (error) {
        console.error("Delete Comment Error:", error);

        return res.status(500).json({
            message: "Server error",
        });
    }
};