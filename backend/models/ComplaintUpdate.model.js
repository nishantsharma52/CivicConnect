import mongoose from "mongoose";
const { Schema } = mongoose;
import { COMPLAINT_STATUSES } from "./constants.model.js";

const attachmentSchema = new Schema({
  url: { type: String, required: true, trim: true, maxlength: 2000 },
  fileName: { type: String, trim: true, maxlength: 255 },
  mimeType: { type: String, trim: true, maxlength: 100 },
}, { _id: true });

// An immutable public/internal activity timeline. Keep Complaint.status as the current snapshot.
const complaintUpdateSchema = new Schema({
  complaint: { type: Schema.Types.ObjectId, ref: "Complaint", required: true, immutable: true },
  updatedBy: { type: Schema.Types.ObjectId, ref: "User", required: true, immutable: true },
  action: { type: String, enum: ["status_changed", "assigned", "commented", "evidence_added", "verified", "duplicate_linked", "sla_escalated", "moderated"], required: true, immutable: true },
  oldStatus: { type: String, enum: COMPLAINT_STATUSES },
  newStatus: { type: String, enum: COMPLAINT_STATUSES },
  message: { type: String, trim: true, maxlength: 1000, default: "" },
  evidence: { type: [attachmentSchema], default: [] },
  metadata: { type: Schema.Types.Mixed, default: {} },
  visibility: { type: String, enum: ["public", "department_only", "private"], default: "public" },
}, { timestamps: true });

complaintUpdateSchema.index({ complaint: 1, createdAt: -1 });
complaintUpdateSchema.index({ updatedBy: 1, createdAt: -1 });

export default mongoose.model("ComplaintUpdate", complaintUpdateSchema);
