import mongoose from "mongoose";
const { Schema } = mongoose;

// Keep this collection append-only in application code; it is the accountability record.
const auditLogSchema = new Schema({
  actor: { type: Schema.Types.ObjectId, ref: "User", default: null, immutable: true },
  action: { type: String, required: true, trim: true, maxlength: 100, immutable: true },
  entityType: { type: String, required: true, trim: true, maxlength: 100, immutable: true },
  entityId: { type: Schema.Types.ObjectId, required: true, immutable: true },
  before: { type: Schema.Types.Mixed, default: null, immutable: true },
  after: { type: Schema.Types.Mixed, default: null, immutable: true },
  ipAddress: { type: String, trim: true, maxlength: 100, default: "" },
  requestId: { type: String, trim: true, maxlength: 100, default: "" },
}, { timestamps: { createdAt: true, updatedAt: false } });

auditLogSchema.index({ entityType: 1, entityId: 1, createdAt: -1 });
auditLogSchema.index({ actor: 1, createdAt: -1 });

export default mongoose.model("AuditLog", auditLogSchema);
