import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/user.model.js";


// ========================================
// Generate JWT Token
// ========================================

const generateToken = (userId) => {
    return jwt.sign(
        { userId },
        process.env.JWT_SECRET,
        {
            expiresIn: process.env.JWT_EXPIRES_IN || "7d",
        }
    );
};


// ========================================
// Remove Password From User Object
// ========================================

const getSafeUser = (user) => {
    return {
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
    };
};


// ========================================
// Register User
// ========================================

export const registerUser = async (req, res) => {
    try {
        const { name, email, password, phone } = req.body;

        // Check required fields
        if (!name || !email || !password) {
            return res.status(400).json({
                message: "Name, email and password are required",
            });
        }

        // Check password length
        if (password.length < 6) {
            return res.status(400).json({
                message: "Password must be at least 6 characters",
            });
        }

        // Check existing user
        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return res.status(409).json({
                message: "User already exists with this email",
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            phone,
            role: "citizen",
        });

        // Generate token
        const token = generateToken(user._id);

        return res.status(201).json({
            message: "User registered successfully",
            user: getSafeUser(user),
            token,
        });

    } catch (error) {
        console.error("Register Error:", error);

        return res.status(500).json({
            message: "Server error",
        });
    }
};


// ========================================
// Login User
// ========================================

export const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check required fields
        if (!email || !password) {
            return res.status(400).json({
                message: "Email and password are required",
            });
        }

        // Find user
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(401).json({
                message: "Invalid email or password",
            });
        }

        // Check account status
        if (!user.isActive) {
            return res.status(403).json({
                message: "Your account is inactive",
            });
        }

        // Compare password
        const isPasswordCorrect = await bcrypt.compare(
            password,
            user.password
        );

        if (!isPasswordCorrect) {
            return res.status(401).json({
                message: "Invalid email or password",
            });
        }

        // Generate token
        const token = generateToken(user._id);

        return res.status(200).json({
            message: "Login successful",
            user: getSafeUser(user),
            token,
        });

    } catch (error) {
        console.error("Login Error:", error);

        return res.status(500).json({
            message: "Server error",
        });
    }
};


// ========================================
// Logout User
// ========================================

export const logoutUser = async (req, res) => {
    try {
        // With JWT authentication, logout is mainly handled
        // on the client by removing the stored token.

        return res.status(200).json({
            message: "Logout successful",
        });

    } catch (error) {
        console.error("Logout Error:", error);

        return res.status(500).json({
            message: "Server error",
        });
    }
};


// ========================================
// Get Logged-in User Profile
// ========================================

export const getMyProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.userId)
            .populate("department", "name category");

        if (!user) {
            return res.status(404).json({
                message: "User not found",
            });
        }

        return res.status(200).json({
            message: "Profile fetched successfully",
            user: getSafeUser(user),
        });

    } catch (error) {
        console.error("Get Profile Error:", error);

        return res.status(500).json({
            message: "Server error",
        });
    }
};


// ========================================
// Update User Profile
// ========================================

export const updateProfile = async (req, res) => {
    try {
        const { name, phone, profileImage } = req.body;

        const user = await User.findById(req.user.userId);

        if (!user) {
            return res.status(404).json({
                message: "User not found",
            });
        }

        // Update only provided fields
        if (name !== undefined) {
            user.name = name;
        }

        if (phone !== undefined) {
            user.phone = phone;
        }

        if (profileImage !== undefined) {
            user.profileImage = profileImage;
        }

        await user.save();

        return res.status(200).json({
            message: "Profile updated successfully",
            user: getSafeUser(user),
        });

    } catch (error) {
        console.error("Update Profile Error:", error);

        return res.status(500).json({
            message: "Server error",
        });
    }
};


// ========================================
// Change Password
// ========================================

export const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        // Check fields
        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                message: "Current password and new password are required",
            });
        }

        // Check new password length
        if (newPassword.length < 6) {
            return res.status(400).json({
                message: "New password must be at least 6 characters",
            });
        }

        // Find user
        const user = await User.findById(req.user.userId);

        if (!user) {
            return res.status(404).json({
                message: "User not found",
            });
        }

        // Check current password
        const isPasswordCorrect = await bcrypt.compare(
            currentPassword,
            user.password
        );

        if (!isPasswordCorrect) {
            return res.status(401).json({
                message: "Current password is incorrect",
            });
        }

        // Hash new password
        user.password = await bcrypt.hash(newPassword, 10);

        await user.save();

        return res.status(200).json({
            message: "Password changed successfully",
        });

    } catch (error) {
        console.error("Change Password Error:", error);

        return res.status(500).json({
            message: "Server error",
        });
    }
};


// ========================================
// Deactivate Account
// ========================================

export const deactivateAccount = async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);

        if (!user) {
            return res.status(404).json({
                message: "User not found",
            });
        }

        user.isActive = false;

        await user.save();

        return res.status(200).json({
            message: "Account deactivated successfully",
        });

    } catch (error) {
        console.error("Deactivate Account Error:", error);

        return res.status(500).json({
            message: "Server error",
        });
    }
};

