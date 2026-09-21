import ComplaintStatusHistory from "../models/complaintStatusHistory.model.js";
import Complaint from "../models/complaint.model.js";


// GET COMPLETE STATUS HISTORY
export const getComplaintStatusHistory = async (req, res) => {
    try {
        const complaint = await Complaint.findById(req.params.complaintId);

        if (!complaint) {
            return res.status(404).json({
                message: "Complaint not found",
            });
        }

        const history = await ComplaintStatusHistory.find({
            complaint: complaint._id,
        })
            .populate("changedBy", "name email role")
            .sort({ createdAt: 1 });

        return res.status(200).json({
            message: "Complaint status history fetched successfully",
            history,
        });

    } catch (error) {
        console.error("Get Status History Error:", error);

        return res.status(500).json({
            message: "Server error",
        });
    }
};


// GET LATEST STATUS HISTORY
export const getLatestStatusHistory = async (req, res) => {
    try {
        const history = await ComplaintStatusHistory.findOne({
            complaint: req.params.complaintId,
        })
            .populate("changedBy", "name email role")
            .sort({ createdAt: -1 });

        if (!history) {
            return res.status(404).json({
                message: "Status history not found",
            });
        }

        return res.status(200).json({
            message: "Latest status history fetched successfully",
            history,
        });

    } catch (error) {
        console.error("Get Latest Status Error:", error);

        return res.status(500).json({
            message: "Server error",
        });
    }
};