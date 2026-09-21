
import express from "express";

import {
    registerUser,
    loginUser,
    logoutUser,
    getMyProfile,
    updateProfile,
    changePassword,
    deactivateAccount,
} from "../controllers/user.controller.js";

import authMiddleware from "../middleware/auth.middleware.js";

const router = express.Router();


// ========================================
// Public Routes
// ========================================

// Register
router.post("/register", registerUser);

// Login
router.post("/login", loginUser);


// ========================================
// Protected Routes
// ========================================

// Logout
router.post("/logout", authMiddleware, logoutUser);

// Get logged-in user's profile
router.get("/profile", authMiddleware, getMyProfile);

// Update profile
router.put("/profile", authMiddleware, updateProfile);

// Change password
router.put("/change-password", authMiddleware, changePassword);

// Deactivate account
router.put("/deactivate", authMiddleware, deactivateAccount);


export default router;

