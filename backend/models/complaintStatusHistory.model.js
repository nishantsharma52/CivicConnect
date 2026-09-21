import mongoose from "mongoose";

const complaintStatusHistorySchema = new mongoose.Schema(
  {
    complaint: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Complaint",
      required: true,
    },

    previousStatus: {
      type: String,
      default: null,
    },

    newStatus: {
      type: String,
      enum: [
        "submitted",
        "under_review",
        "assigned",
        "in_progress",
        "resolved",
        "rejected",
        "reopened",
      ],
      required: true,
    },

    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    remark: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

const ComplaintStatusHistory = mongoose.model(
  "ComplaintStatusHistory",
  complaintStatusHistorySchema
);

export default ComplaintStatusHistory;