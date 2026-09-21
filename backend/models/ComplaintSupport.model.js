import mongoose from "mongoose";
const { Schema } = mongoose;

const complaintSupportSchema = new Schema({
  complaint: { type: Schema.Types.ObjectId, ref: "Complaint", required: true, immutable: true },
  citizen: { type: Schema.Types.ObjectId, ref: "User", required: true, immutable: true },
}, { timestamps: true });

complaintSupportSchema.index({ complaint: 1, citizen: 1 }, { unique: true });
complaintSupportSchema.index({ complaint: 1, createdAt: -1 });

export default mongoose.model("ComplaintSupport", complaintSupportSchema);
