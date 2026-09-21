import mongoose from "mongoose";
const { Schema } = mongoose;

const commentSchema = new Schema({
  complaint: { type: Schema.Types.ObjectId, ref: "Complaint", required: true, immutable: true },
  author: { type: Schema.Types.ObjectId, ref: "User", required: true, immutable: true },
  parentComment: { type: Schema.Types.ObjectId, ref: "Comment", default: null },
  body: { type: String, required: true, trim: true, minlength: 1, maxlength: 2000 },
  attachments: [{ url: { type: String, required: true }, mimeType: String }],
  moderationStatus: { type: String, enum: ["visible", "hidden", "removed"], default: "visible" },
  isDeleted: { type: Boolean, default: false },
  deletedAt: { type: Date, default: null },
}, { timestamps: true });

commentSchema.index({ complaint: 1, createdAt: -1 });
commentSchema.index({ parentComment: 1, createdAt: 1 });

export default mongoose.model("Comment", commentSchema);
