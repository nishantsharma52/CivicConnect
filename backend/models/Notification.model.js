import mongoose from "mongoose";
const { Schema } = mongoose;

const deliverySchema = new Schema({
  channel: { type: String, enum: ["in_app", "email", "sms", "push"], required: true },
  status: { type: String, enum: ["pending", "sent", "delivered", "failed"], default: "pending" },
  sentAt: { type: Date, default: null },
  deliveredAt: { type: Date, default: null },
  failureReason: { type: String, trim: true, maxlength: 500, default: "" },
}, { _id: false });

const notificationSchema = new Schema({
  recipient: { type: Schema.Types.ObjectId, ref: "User", required: true, immutable: true },
  complaint: { type: Schema.Types.ObjectId, ref: "Complaint", default: null },
  title: { type: String, required: true, trim: true, maxlength: 150 },
  message: { type: String, required: true, trim: true, maxlength: 1000 },
  type: { type: String, enum: ["status_update", "assignment", "resolution", "feedback_request", "sla_escalation", "system"], default: "system" },
  deliveries: { type: [deliverySchema], default: [{ channel: "in_app" }] },
  isRead: { type: Boolean, default: false },
  readAt: { type: Date, default: null },
  idempotencyKey: { type: String, required: true, trim: true, maxlength: 200, immutable: true },
}, { timestamps: true });

notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ idempotencyKey: 1 }, { unique: true });

export default mongoose.model("Notification", notificationSchema);
