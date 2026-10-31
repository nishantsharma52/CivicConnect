import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import Department from "../models/department.model.js";
import Complaint from "../models/complaint.model.js";
import { createNotification } from "../utils/notification.js";
import { isValidObjectId, getPagination } from "../utils/request.js";
import { sameId } from "../utils/authorization.js";

const generateToken = (userId) => {
    if (!process.env.JWT_SECRET) {
        throw new Error("JWT_SECRET is not configured");
    }

    return jwt.sign(
        { userId },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
    );
};

const getSafeUser = (user) => ({
    id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    department: user.department,
    profileImage: user.profileImage,
    isVerified: user.isVerified,
    isActive: user.isActive,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
});

const normalizeEmail = (email) => String(email || "").trim().toLowerCase();

export const registerUser = async (req, res) => {
    try {
        const { name, password, phone } = req.body;
        const email = normalizeEmail(req.body.email);
        const requestedRole = String(req.body.role || "citizen").trim().toLowerCase();
        const departmentId = req.body.department || null;

        if (!name?.trim() || !email || !password) {
            return res.status(400).json({ message: "Name, email and password are required" });
        }
        if (password.length < 6) {
            return res.status(400).json({ message: "Password must be at least 6 characters" });
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).json({ message: "Please enter a valid email address" });
        }
        if (!["citizen", "department", "admin"].includes(requestedRole)) {
            return res.status(400).json({ message: "Invalid role. Choose citizen, department or admin" });
        }

        let department = null;
        if (requestedRole === "department") {
            if (!departmentId || !isValidObjectId(departmentId)) {
                return res.status(400).json({ message: "Please select a valid department for a department account" });
            }

            department = await Department.findOne({ _id: departmentId, isActive: true });
            if (!department) {
                return res.status(404).json({ message: "Selected department was not found or is inactive" });
            }
        }

        const existing = await User.findOne({ email });
        if (existing) return res.status(409).json({ message: "User already exists with this email" });

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await User.create({
            name: name.trim(),
            email,
            password: hashedPassword,
            phone: phone?.trim(),
            role: requestedRole,
            department: department?._id || null,
        });

        await user.populate("department", "name category");
        const token = generateToken(user._id);
        return res.status(201).json({
            message: `${requestedRole} account registered successfully`,
            user: getSafeUser(user),
            token,
        });
    } catch (error) {
        console.error("Register Error:", error);
        if (error.code === 11000) return res.status(409).json({ message: "User already exists with this email" });
        return res.status(500).json({ message: error.message === "JWT_SECRET is not configured" ? error.message : "Server error" });
    }
};

export const loginUser = async (req, res) => {
    try {
        const email = normalizeEmail(req.body.email);
        const { password } = req.body;

        if (!email || !password) return res.status(400).json({ message: "Email and password are required" });

        const user = await User.findOne({ email });
        if (!user) return res.status(401).json({ message: "Invalid email or password" });
        if (!user.isActive) return res.status(403).json({ message: "Your account is inactive" });

        const passwordCorrect = await bcrypt.compare(password, user.password);
        if (!passwordCorrect) return res.status(401).json({ message: "Invalid email or password" });

        const token = generateToken(user._id);
        await user.populate("department", "name category");

        return res.status(200).json({
            message: "Login successful",
            user: getSafeUser(user),
            token,
        });
    } catch (error) {
        console.error("Login Error:", error);
        return res.status(500).json({ message: error.message === "JWT_SECRET is not configured" ? error.message : "Server error" });
    }
};

export const logoutUser = async (req, res) => {
    return res.status(200).json({ message: "Logout successful" });
};

export const getMyProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).populate("department", "name category");
        if (!user) return res.status(404).json({ message: "User not found" });
        return res.status(200).json({ message: "Profile fetched successfully", user: getSafeUser(user) });
    } catch (error) {
        console.error("Get Profile Error:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

export const updateProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);
        if (!user) return res.status(404).json({ message: "User not found" });

        const { name, phone, profileImage } = req.body;
        if (name !== undefined) {
            if (!String(name).trim()) return res.status(400).json({ message: "Name cannot be empty" });
            user.name = String(name).trim();
        }
        if (phone !== undefined) user.phone = String(phone).trim();
        if (profileImage !== undefined) user.profileImage = profileImage;

        await user.save();
        await user.populate("department", "name category");
        return res.status(200).json({ message: "Profile updated successfully", user: getSafeUser(user) });
    } catch (error) {
        console.error("Update Profile Error:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

export const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) return res.status(400).json({ message: "Current password and new password are required" });
        if (newPassword.length < 6) return res.status(400).json({ message: "New password must be at least 6 characters" });

        const user = await User.findById(req.user.userId);
        if (!user) return res.status(404).json({ message: "User not found" });

        const correct = await bcrypt.compare(currentPassword, user.password);
        if (!correct) return res.status(401).json({ message: "Current password is incorrect" });

        user.password = await bcrypt.hash(newPassword, 10);
        await user.save();
        return res.status(200).json({ message: "Password changed successfully" });
    } catch (error) {
        console.error("Change Password Error:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

export const deactivateAccount = async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);
        if (!user) return res.status(404).json({ message: "User not found" });
        if (user.role === "admin") return res.status(400).json({ message: "An admin account cannot be self-deactivated" });

        user.isActive = false;
        await user.save();
        return res.status(200).json({ message: "Account deactivated successfully" });
    } catch (error) {
        console.error("Deactivate Account Error:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

export const getAllUsers = async (req, res) => {
    try {
        const { page, limit, skip } = getPagination(req.query);
        const filter = {};
        if (req.query.role && ["citizen", "department", "admin"].includes(req.query.role)) filter.role = req.query.role;
        if (req.query.department && isValidObjectId(req.query.department)) filter.department = req.query.department;
        if (req.query.active === "true") filter.isActive = true;
        if (req.query.active === "false") filter.isActive = false;

        if (req.query.search?.trim()) {
            const search = req.query.search.trim();
            filter.$or = [
                { name: { $regex: search, $options: "i" } },
                { email: { $regex: search, $options: "i" } },
            ];
        }

        const [users, total] = await Promise.all([
            User.find(filter)
                .select("-password")
                .populate("department", "name category")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            User.countDocuments(filter),
        ]);

        return res.status(200).json({
            message: "Users fetched successfully",
            users,
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        });
    } catch (error) {
        console.error("Get Users Error:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

export const createDepartmentStaff = async (req, res) => {
    try {
        const { name, phone, password, department } = req.body;
        const email = normalizeEmail(req.body.email);

        if (!name?.trim() || !email || !password || !department) {
            return res.status(400).json({ message: "Name, email, password and department are required" });
        }
        if (!isValidObjectId(department)) return res.status(400).json({ message: "Invalid department ID" });
        if (password.length < 6) return res.status(400).json({ message: "Password must be at least 6 characters" });

        const departmentDoc = await Department.findOne({ _id: department, isActive: true });
        if (!departmentDoc) return res.status(404).json({ message: "Department not found or inactive" });

        const existing = await User.findOne({ email });
        if (existing) return res.status(409).json({ message: "User already exists with this email" });

        const user = await User.create({
            name: name.trim(),
            email,
            password: await bcrypt.hash(password, 10),
            phone: phone?.trim(),
            role: "department",
            department: departmentDoc._id,
        });

        await createNotification({
            user: user._id,
            title: "Department Account Created",
            message: `Your department staff account for ${departmentDoc.name} has been created.`,
            type: "general",
        });

        await user.populate("department", "name category");
        return res.status(201).json({ message: "Department staff created successfully", user: getSafeUser(user) });
    } catch (error) {
        console.error("Create Department Staff Error:", error);
        if (error.code === 11000) return res.status(409).json({ message: "User already exists with this email" });
        return res.status(500).json({ message: "Server error" });
    }
};

export const updateUserRole = async (req, res) => {
    try {
        if (!isValidObjectId(req.params.id)) return res.status(400).json({ message: "Invalid user ID" });
        const { role, department = null } = req.body;
        if (!["citizen", "department", "admin"].includes(role)) return res.status(400).json({ message: "Invalid role" });
        if (sameId(req.params.id, req.user.userId)) return res.status(400).json({ message: "You cannot change your own role" });

        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: "User not found" });

        if (role === "department") {
            if (!department || !isValidObjectId(department)) return res.status(400).json({ message: "A valid department is required for department staff" });
            const departmentDoc = await Department.findOne({ _id: department, isActive: true });
            if (!departmentDoc) return res.status(404).json({ message: "Department not found or inactive" });
            user.department = departmentDoc._id;
        } else {
            user.department = null;
        }

        user.role = role;
        await user.save();
        await user.populate("department", "name category");
        return res.status(200).json({ message: "User role updated successfully", user: getSafeUser(user) });
    } catch (error) {
        console.error("Update User Role Error:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

export const updateUserStatus = async (req, res) => {
    try {
        if (!isValidObjectId(req.params.id)) return res.status(400).json({ message: "Invalid user ID" });
        const { isActive } = req.body;
        if (typeof isActive !== "boolean") return res.status(400).json({ message: "isActive must be true or false" });
        if (sameId(req.params.id, req.user.userId)) return res.status(400).json({ message: "You cannot change your own account status" });

        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: "User not found" });
        user.isActive = isActive;
        await user.save();

        return res.status(200).json({ message: `User ${isActive ? "activated" : "deactivated"} successfully`, user: getSafeUser(user) });
    } catch (error) {
        console.error("Update User Status Error:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

export const deleteUser = async (req, res) => {
    try {
        if (!isValidObjectId(req.params.id)) return res.status(400).json({ message: "Invalid user ID" });
        if (sameId(req.params.id, req.user.userId)) return res.status(400).json({ message: "You cannot delete your own account from admin management" });

        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: "User not found" });

        const activeAssignments = await Complaint.countDocuments({
            assignedTo: user._id,
            status: { $nin: ["resolved", "rejected"] },
        });
        if (activeAssignments > 0) {
            return res.status(400).json({ message: "Cannot delete user while active complaints are assigned to them" });
        }

        await User.findByIdAndDelete(user._id);
        return res.status(200).json({ message: "User deleted successfully" });
    } catch (error) {
        console.error("Delete User Error:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

export { generateToken, getSafeUser };
