import jwt from "jsonwebtoken";
import User from "../models/User.model.js";
import ApiError from "../utils/ApiError.js";
import { sendResponse } from "../utils/ApiResponse.js";
import catchAsync from "../utils/catchAsync.js";
import { logAudit } from "../utils/auditLogger.js";

/*
 * ASSUMPTIONS (see section 5 of the response for the full list):
 * - JWT_SECRET / JWT_EXPIRES_IN are read from process.env. No auth config
 *   file was provided in models.zip, so these must be supplied by the
 *   integrating project.
 * - The User model has no password-reset-token / email-verification-token
 *   fields, so forgotPassword/resetPassword and a real verify-email flow
 *   are NOT implemented here - there is nowhere to store the token or its
 *   expiry. `accountStatus` defaults to "pending_verification" but login is
 *   NOT blocked on that status (only on "suspended"), otherwise no citizen
 *   could ever log in without a verification model. Add a
 *   VerificationToken/PasswordResetToken model to implement these safely.
 * - Auth is treated as stateless JWT. There is no session/refresh-token
 *   collection to revoke, so `logout` clears the "token" cookie if the
 *   integrating app uses cookie-based auth; for header-based (Bearer)
 *   auth, logout is inherently a client-side action (discard the token).
 * - Public self-registration always creates a "citizen" - any `role` field
 *   sent by the client is ignored for security. Officer/admin accounts are
 *   provisioned by an admin via userController.adminCreateUser.
 */

const signToken = (user) =>
  jwt.sign({ sub: user._id.toString(), role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });

const sanitizeUser = (userDoc) => {
  const user = userDoc.toObject ? userDoc.toObject() : { ...userDoc };
  delete user.password;
  return user;
};

// POST /api/auth/register - public, always creates a citizen account
const register = catchAsync(async (req, res) => {
  const { name, email, phone, password } = req.body;

  if (!name || !email || !password) {
    throw ApiError.badRequest("name, email and password are required");
  }

  const existing = await User.findOne({ email: email.toLowerCase().trim() });
  if (existing) throw ApiError.conflict("An account with this email already exists");

  const user = await User.create({
    name,
    email,
    phone,
    password,
    role: "citizen",
  });

  await logAudit({ actorId: user._id, action: "user.register", entityType: "User", entityId: user._id, after: { email: user.email } });

  const token = signToken(user);
  return sendResponse(res, 201, "Registration successful", { user: sanitizeUser(user), token });
});

// POST /api/auth/login - public
const login = catchAsync(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) throw ApiError.badRequest("email and password are required");

  const user = await User.findOne({ email: email.toLowerCase().trim() }).select("+password");
  if (!user) throw ApiError.unauthorized("Invalid email or password");

  const isMatch = await user.comparePassword(password);
  if (!isMatch) throw ApiError.unauthorized("Invalid email or password");

  if (user.accountStatus === "suspended") {
    throw ApiError.forbidden("This account has been suspended. Contact an administrator.");
  }

  const token = signToken(user);
  await logAudit({ actorId: user._id, action: "user.login", entityType: "User", entityId: user._id });

  return sendResponse(res, 200, "Login successful", { user: sanitizeUser(user), token });
});

// GET /api/auth/me - authenticated
const getCurrentUser = catchAsync(async (req, res) => {
  const user = await User.findById(req.user._id).populate("department", "name code");
  if (!user) throw ApiError.notFound("User not found");
  return sendResponse(res, 200, "Current user fetched", sanitizeUser(user));
});

// PATCH /api/auth/profile - authenticated (self only)
const updateProfile = catchAsync(async (req, res) => {
  const allowedFields = ["name", "phone"];
  const updates = {};
  for (const field of allowedFields) {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  }

  if (req.body.email && req.body.email.toLowerCase().trim() !== req.user.email) {
    const emailTaken = await User.findOne({ email: req.body.email.toLowerCase().trim() });
    if (emailTaken) throw ApiError.conflict("This email is already in use");
    updates.email = req.body.email;
    updates.isEmailVerified = false; // re-verification required after change
  }

  if (Object.keys(updates).length === 0) throw ApiError.badRequest("No valid fields provided to update");

  const user = await User.findByIdAndUpdate(req.user._id, updates, {
    new: true,
    runValidators: true,
  });

  await logAudit({ actorId: req.user._id, action: "user.update_profile", entityType: "User", entityId: req.user._id, after: updates });

  return sendResponse(res, 200, "Profile updated", sanitizeUser(user));
});

// PATCH /api/auth/change-password - authenticated (self only)
const changePassword = catchAsync(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    throw ApiError.badRequest("currentPassword and newPassword are required");
  }
  if (newPassword.length < 8) throw ApiError.badRequest("newPassword must be at least 8 characters");

  const user = await User.findById(req.user._id).select("+password");
  if (!user) throw ApiError.notFound("User not found");

  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) throw ApiError.unauthorized("Current password is incorrect");

  user.password = newPassword; // pre-save hook re-hashes
  await user.save();

  await logAudit({ actorId: user._id, action: "user.change_password", entityType: "User", entityId: user._id });

  return sendResponse(res, 200, "Password changed successfully", null);
});

// POST /api/auth/logout - authenticated
// See ASSUMPTIONS above: only meaningfully clears cookie-based auth.
const logout = catchAsync(async (req, res) => {
  res.clearCookie("token", { httpOnly: true, sameSite: "strict" });
  return sendResponse(res, 200, "Logged out successfully", null);
});

export {
  register,
  login,
  getCurrentUser,
  updateProfile,
  changePassword,
  logout,
};
