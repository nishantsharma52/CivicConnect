import Comment from "../models/comment.model.js";
import Complaint from "../models/complaint.model.js";
import { canAccessComplaint, canManageComplaint, isAdmin, sameId } from "../utils/authorization.js";
import { createNotification, notifyDepartmentStaff } from "../utils/notification.js";
import { isValidObjectId } from "../utils/request.js";

const canComment = (complaint, user) => canAccessComplaint(complaint, user);

export const addComment = async (req, res) => {
    try {
        const { comment, isInternal = false } = req.body;
        if (!comment?.trim()) return res.status(400).json({ message: "Comment is required" });
        if (!isValidObjectId(req.params.complaintId)) return res.status(400).json({ message: "Invalid complaint ID" });
        if (typeof isInternal !== "boolean") return res.status(400).json({ message: "isInternal must be true or false" });

        const complaint = await Complaint.findById(req.params.complaintId);
        if (!complaint) return res.status(404).json({ message: "Complaint not found" });
        if (!canComment(complaint, req.user)) {
            return res.status(403).json({ message: "You do not have permission to comment on this complaint" });
        }
        if (isInternal && req.user.role === "citizen") {
            return res.status(403).json({ message: "Citizens cannot create internal comments" });
        }

        const newComment = await Comment.create({
            complaint: complaint._id,
            user: req.user.userId,
            comment: comment.trim(),
            isInternal,
        });

        if (!isInternal && req.user.role === "citizen") {
            await notifyDepartmentStaff({
                departmentId: complaint.department,
                complaint: complaint._id,
                title: "New Complaint Comment",
                message: `A citizen added a comment to complaint ${complaint.complaintId}.`,
                type: "status_update",
            });
        } else if (!isInternal && req.user.role === "department") {
            await createNotification({
                user: complaint.citizen,
                complaint: complaint._id,
                title: "New Complaint Comment",
                message: `A department staff member commented on complaint ${complaint.complaintId}.`,
                type: "status_update",
            });
        } else if (!isInternal && isAdmin(req.user)) {
            await createNotification({
                user: complaint.citizen,
                complaint: complaint._id,
                title: "Admin Comment",
                message: `An admin commented on complaint ${complaint.complaintId}.`,
                type: "status_update",
            });
        }

        const populated = await Comment.findById(newComment._id)
            .populate("user", "name email role");

        return res.status(201).json({ message: "Comment added successfully", comment: populated });
    } catch (error) {
        console.error("Add Comment Error:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

export const getComplaintComments = async (req, res) => {
    try {
        if (!isValidObjectId(req.params.complaintId)) return res.status(400).json({ message: "Invalid complaint ID" });
        const complaint = await Complaint.findById(req.params.complaintId);
        if (!complaint) return res.status(404).json({ message: "Complaint not found" });
        if (!canAccessComplaint(complaint, req.user)) {
            return res.status(403).json({ message: "You do not have permission to view these comments" });
        }

        const filter = { complaint: complaint._id };
        if (req.user.role === "citizen") filter.isInternal = false;

        const comments = await Comment.find(filter)
            .populate("user", "name email role")
            .sort({ createdAt: 1 });

        return res.status(200).json({ message: "Comments fetched successfully", comments });
    } catch (error) {
        console.error("Get Comments Error:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

export const updateComment = async (req, res) => {
    try {
        const { comment } = req.body;
        if (!comment?.trim()) return res.status(400).json({ message: "Comment is required" });
        if (!isValidObjectId(req.params.id)) return res.status(400).json({ message: "Invalid comment ID" });

        const existing = await Comment.findById(req.params.id);
        if (!existing) return res.status(404).json({ message: "Comment not found" });

        if (!isAdmin(req.user) && !sameId(existing.user, req.user.userId)) {
            return res.status(403).json({ message: "You can only edit your own comment" });
        }

        const complaint = await Complaint.findById(existing.complaint);
        if (!complaint || (!isAdmin(req.user) && !canAccessComplaint(complaint, req.user))) {
            return res.status(403).json({ message: "You do not have permission to modify this comment" });
        }

        existing.comment = comment.trim();
        await existing.save();

        return res.status(200).json({ message: "Comment updated successfully", comment: existing });
    } catch (error) {
        console.error("Update Comment Error:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

export const deleteComment = async (req, res) => {
    try {
        if (!isValidObjectId(req.params.id)) return res.status(400).json({ message: "Invalid comment ID" });
        const comment = await Comment.findById(req.params.id);
        if (!comment) return res.status(404).json({ message: "Comment not found" });

        const complaint = await Complaint.findById(comment.complaint);
        if (!complaint || (!isAdmin(req.user) && !canAccessComplaint(complaint, req.user))) {
            return res.status(403).json({ message: "You do not have permission to delete this comment" });
        }
        if (!isAdmin(req.user) && !sameId(comment.user, req.user.userId)) {
            return res.status(403).json({ message: "You can only delete your own comment" });
        }

        await Comment.findByIdAndDelete(comment._id);
        return res.status(200).json({ message: "Comment deleted successfully" });
    } catch (error) {
        console.error("Delete Comment Error:", error);
        return res.status(500).json({ message: "Server error" });
    }
};
