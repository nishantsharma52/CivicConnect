import mongoose from "mongoose";
const { Schema } = mongoose;
import { PRIORITIES } from "./constants.model.js";

const categorySchema = new Schema({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  slug: { type: String, required: true, trim: true, lowercase: true, match: [/^[a-z0-9-]+$/, "Slug must use lowercase letters, numbers, and hyphens"] },
  description: { type: String, trim: true, maxlength: 500, default: "" },
  subcategories: [{ type: String, trim: true, maxlength: 100 }],
  defaultDepartment: { type: Schema.Types.ObjectId, ref: "Department", default: null },
  defaultPriority: { type: String, enum: PRIORITIES, default: "Medium" },
  slaHours: { type: Number, min: 1, max: 8760, default: 72 },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

categorySchema.index({ name: 1 }, { unique: true });
categorySchema.index({ slug: 1 }, { unique: true });

export default mongoose.model("Category", categorySchema);
