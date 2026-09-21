import mongoose from "mongoose";
const { Schema } = mongoose;

const feedbackSchema = new Schema({
  complaint: { type: Schema.Types.ObjectId, ref: "Complaint", required: true, immutable: true },
  citizen: { type: Schema.Types.ObjectId, ref: "User", required: true, immutable: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  resolutionQuality: { type: Number, min: 1, max: 5, default: null },
  comment: { type: String, trim: true, maxlength: 1000, default: "" },
  reopenRequested: { type: Boolean, default: false },
  reopenReason: { type: String, trim: true, maxlength: 1000, default: "" },
}, { timestamps: true });

feedbackSchema.index({ complaint: 1, citizen: 1 }, { unique: true });
feedbackSchema.index({ rating: 1 });

export default mongoose.model("Feedback", feedbackSchema);
