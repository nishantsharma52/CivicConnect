import ComplaintStatusHistory from "../models/complaintStatusHistory.model.js";
import Complaint from "../models/complaint.model.js";
import { canAccessComplaint } from "../utils/authorization.js";
import { isValidObjectId } from "../utils/request.js";

export const getComplaintStatusHistory = async (req, res) => {
    try {
        if (!isValidObjectId(req.params.complaintId)) {
            return res.status(400).json({ message: "Invalid complaint ID" });
        }

        const complaint = await Complaint.findById(req.params.complaintId).select("citizen department assignedTo");
        if (!complaint) return res.status(404).json({ message: "Complaint not found" });

        if (!canAccessComplaint(complaint, req.user)) {
            return res.status(403).json({ message: "You do not have permission to view this complaint history" });
        }

        const history = await ComplaintStatusHistory.find({ complaint: complaint._id })
            .populate("changedBy", "name email role")
            .sort({ createdAt: 1 });

        return res.status(200).json({
            message: "Complaint status history fetched successfully",
            history,
        });
    } catch (error) {
        console.error("Get Status History Error:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

export const getLatestStatusHistory = async (req, res) => {
    try {
        if (!isValidObjectId(req.params.complaintId)) {
            return res.status(400).json({ message: "Invalid complaint ID" });
        }

        const complaint = await Complaint.findById(req.params.complaintId).select("citizen department assignedTo");
        if (!complaint) return res.status(404).json({ message: "Complaint not found" });

        if (!canAccessComplaint(complaint, req.user)) {
            return res.status(403).json({ message: "You do not have permission to view this complaint history" });
        }

        const history = await ComplaintStatusHistory.findOne({ complaint: complaint._id })
            .populate("changedBy", "name email role")
            .sort({ createdAt: -1 });

        if (!history) return res.status(404).json({ message: "Status history not found" });

        return res.status(200).json({
            message: "Latest status history fetched successfully",
            history,
        });
    } catch (error) {
        console.error("Get Latest Status Error:", error);
        return res.status(500).json({ message: "Server error" });
    }
};
