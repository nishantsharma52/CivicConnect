import mongoose from "mongoose";
import bcrypt from "bcrypt";
const { Schema } = mongoose;

const userSchema = new Schema({
  name: { type: String, required: [true, "Name is required"], trim: true, minlength: 2, maxlength: 100 },
  email: { type: String, required: [true, "Email is required"], trim: true, lowercase: true, match: [/^\S+@\S+\.\S+$/, "Please enter a valid email address"] },
  phone: { type: String, trim: true, sparse: true, match: [/^\+?[1-9]\d{7,14}$/, "Please enter a valid phone number"] },
  password: { type: String, required: [true, "Password is required"], minlength: 8, select: false },
  role: { type: String, enum: ["citizen", "officer", "admin"], default: "citizen", required: true },
  accountStatus: { type: String, enum: ["active", "suspended", "pending_verification"], default: "pending_verification" },
  isEmailVerified: { type: Boolean, default: false },
  isPhoneVerified: { type: Boolean, default: false },
  department: { type: Schema.Types.ObjectId, ref: "Department", default: null },
  officerProfile: {
    employeeId: { type: String, trim: true, maxlength: 100 },
    designation: { type: String, trim: true, maxlength: 150 },
  },
}, { timestamps: true });

userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ phone: 1 }, { unique: true, sparse: true });
userSchema.index({ role: 1, department: 1 });

userSchema.pre("save", async function hashPassword(next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = function comparePassword(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model("User", userSchema);
