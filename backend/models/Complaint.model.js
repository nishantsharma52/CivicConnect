import mongoose from "mongoose";
const { Schema } = mongoose;
import { COMPLAINT_STATUSES, PRIORITIES } from "./constants.model.js";

const pointSchema = new Schema({
  type: { type: String, enum: ["Point"], required: true, default: "Point" },
  coordinates: {
    type: [Number], required: true,
    validate: { validator: value => Array.isArray(value) && value.length === 2 && value[0] >= -180 && value[0] <= 180 && value[1] >= -90 && value[1] <= 90, message: "Coordinates must be [longitude, latitude]" },
  },
}, { _id: false });

const attachmentSchema = new Schema({
  url: { type: String, required: true, trim: true, maxlength: 2000 },
  publicId: { type: String, trim: true, maxlength: 500 },
  fileName: { type: String, trim: true, maxlength: 255 },
  mimeType: { type: String, trim: true, maxlength: 100 },
  sizeBytes: { type: Number, min: 0 },
  kind: { type: String, enum: ["image", "video", "document", "other"], default: "image" },
  uploadedAt: { type: Date, default: Date.now },
  scannedAt: { type: Date, default: null },
}, { _id: true });

const complaintSchema = new Schema({
  complaintId: { type: String, required: true, unique: true, trim: true, uppercase: true, immutable: true },
  title: { type: String, required: true, trim: true, minlength: 5, maxlength: 200 },
  description: { type: String, required: true, trim: true, minlength: 10, maxlength: 3000 },
  category: { type: Schema.Types.ObjectId, ref: "Category", required: true },
  subCategory: { type: String, trim: true, maxlength: 100, default: "" },
  priority: { type: String, enum: PRIORITIES, default: "Medium" },
  status: { type: String, enum: COMPLAINT_STATUSES, default: "Submitted" },
  createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true, immutable: true },
  source: { type: String, enum: ["web", "mobile", "officer", "imported"], default: "web", immutable: true },
  assignedDepartment: { type: Schema.Types.ObjectId, ref: "Department", default: null },
  assignedOfficer: { type: Schema.Types.ObjectId, ref: "User", default: null },
  location: {
    point: { type: pointSchema, required: true },
    address: { type: String, trim: true, maxlength: 500, default: "" },
    ward: { type: String, trim: true, maxlength: 100, default: "" },
    accuracyMeters: { type: Number, min: 0, default: null },
  },
  visibility: { type: String, enum: ["public", "department_only", "private"], default: "public" },
  isAnonymous: { type: Boolean, default: false },
  moderationStatus: { type: String, enum: ["pending", "approved", "rejected", "hidden"], default: "pending" },
  rejectionReason: { type: String, trim: true, maxlength: 1000, default: "" },
  attachments: { type: [attachmentSchema], default: [] },
  duplicateOf: { type: Schema.Types.ObjectId, ref: "Complaint", default: null },
  duplicateConfidence: { type: Number, min: 0, max: 1, default: null },
  duplicateDetectionMethod: { type: String, enum: ["ai", "manual", "citizen", null], default: null },
  aiClassification: {
    predictedCategory: { type: Schema.Types.ObjectId, ref: "Category", default: null },
    predictedSubCategory: { type: String, trim: true, maxlength: 100 },
    predictedPriority: { type: String, enum: PRIORITIES },
    suggestedDepartment: { type: Schema.Types.ObjectId, ref: "Department", default: null },
    confidenceScore: { type: Number, min: 0, max: 1 },
    modelVersion: { type: String, trim: true, maxlength: 100 },
    reviewedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    reviewedAt: { type: Date, default: null },
    overrideReason: { type: String, trim: true, maxlength: 1000 },
  },
  slaDeadline: { type: Date, default: null },
  slaBreached: { type: Boolean, default: false },
  verifiedAt: { type: Date, default: null }, assignedAt: { type: Date, default: null }, startedAt: { type: Date, default: null },
  resolvedAt: { type: Date, default: null }, closedAt: { type: Date, default: null }, reopenedAt: { type: Date, default: null },
  resolutionDescription: { type: String, trim: true, maxlength: 2000, default: "" },
  resolutionEvidence: { type: [attachmentSchema], default: [] },
  externalReference: { type: String, trim: true, maxlength: 200, default: "" },
  isDeleted: { type: Boolean, default: false }, deletedAt: { type: Date, default: null },
}, { timestamps: true });

complaintSchema.index({ complaintId: 1 }, { unique: true });
complaintSchema.index({ "location.point": "2dsphere" });
complaintSchema.index({ assignedDepartment: 1, status: 1, createdAt: -1 });
complaintSchema.index({ assignedOfficer: 1, status: 1, createdAt: -1 });
complaintSchema.index({ status: 1, priority: 1, slaDeadline: 1 });
complaintSchema.index({ duplicateOf: 1 });
complaintSchema.index({ title: "text", description: "text" });

export default mongoose.model("Complaint", complaintSchema);
