import express from "express";

import {
    registerUser,
    loginUser,
    logoutUser,
    getMyProfile,
    updateProfile,
    changePassword,
    deactivateAccount,
    getAllUsers,
    createDepartmentStaff,
    updateUserRole,
    updateUserStatus,
    deleteUser,
} from "../controllers/user.controller.js";

import authMiddleware from "../middleware/auth.middleware.js";
import roleMiddleware from "../middleware/role.middleware.js";

const router = express.Router();

// Public
router.post("/register", registerUser);
router.post("/login", loginUser);

// Current user
router.post("/logout", authMiddleware, logoutUser);
router.get("/profile", authMiddleware, getMyProfile);
router.put("/profile", authMiddleware, updateProfile);
router.put("/change-password", authMiddleware, changePassword);
router.put("/deactivate", authMiddleware, deactivateAccount);

// Admin user management
router.get("/admin", authMiddleware, roleMiddleware("admin"), getAllUsers);
router.post("/admin/staff", authMiddleware, roleMiddleware("admin"), createDepartmentStaff);
router.put("/admin/:id/role", authMiddleware, roleMiddleware("admin"), updateUserRole);
router.put("/admin/:id/status", authMiddleware, roleMiddleware("admin"), updateUserStatus);
router.delete("/admin/:id", authMiddleware, roleMiddleware("admin"), deleteUser);

export default router;
