import mongoose from "mongoose";
const { Schema } = mongoose;

const geometrySchema = new Schema({
  type: { type: String, enum: ["Polygon", "MultiPolygon"], required: true },
  coordinates: { type: Array, required: true },
}, { _id: false });

const departmentSchema = new Schema({
  name: { type: String, required: [true, "Department name is required"], trim: true, minlength: 2, maxlength: 150 },
  code: { type: String, required: true, trim: true, uppercase: true, maxlength: 30 },
  description: { type: String, trim: true, maxlength: 1000, default: "" },
  contactEmail: { type: String, trim: true, lowercase: true },
  contactPhone: { type: String, trim: true },
  isActive: { type: Boolean, default: true },
  // Officers point here through User.department; do not duplicate that relation here.
  jurisdiction: { type: geometrySchema, default: null },
}, { timestamps: true });

departmentSchema.index({ name: 1 }, { unique: true });
departmentSchema.index({ code: 1 }, { unique: true });
departmentSchema.index({ jurisdiction: "2dsphere" });

export default mongoose.model("Department", departmentSchema);
