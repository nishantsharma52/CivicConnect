import express from "express";
import upload from "../middleware/upload.middleware.js";

import {
    createComplaint,
    getAllComplaints,
    getMyComplaints,
    getComplaintById,
    updateComplaint,
    assignDepartment,
    assignStaff,
    updateComplaintStatus,
    addResolutionProof,
    verifyResolution,
    deleteComplaint,
} from "../controllers/complaint.controller.js";

import authMiddleware from "../middleware/auth.middleware.js";
import roleMiddleware from "../middleware/role.middleware.js";

const router = express.Router();

// Create complaint - Citizen
router.post(
    "/",
    authMiddleware,
    roleMiddleware("citizen"),
    upload.array("evidence", 5),
    createComplaint
);

// My complaints - Citizen
router.get(
    "/my",
    authMiddleware,
    roleMiddleware("citizen"),
    getMyComplaints
);

// All complaints - Department/Admin
router.get(
    "/",
    authMiddleware,
    roleMiddleware("department", "admin"),
    getAllComplaints
);

// Single complaint - All authenticated roles
router.get(
    "/:id",
    authMiddleware,
    roleMiddleware("citizen", "department", "admin"),
    getComplaintById
);

// Update complaint
router.put(
    "/:id",
    authMiddleware,
    roleMiddleware("citizen", "department", "admin"),
    updateComplaint
);

// Assign department - Admin
router.put(
    "/:id/assign-department",
    authMiddleware,
    roleMiddleware("admin"),
    assignDepartment
);

// Assign staff - Admin/Department
router.put(
    "/:id/assign-staff",
    authMiddleware,
    roleMiddleware("admin", "department"),
    assignStaff
);

// Update status - Department/Admin
router.put(
    "/:id/status",
    authMiddleware,
    roleMiddleware("department", "admin"),
    updateComplaintStatus
);

// Resolution proof - Department/Admin
router.put(
    "/:id/resolution-proof",
    authMiddleware,
    roleMiddleware("department", "admin"),
    upload.array("resolutionProof", 5),
    addResolutionProof
);

// Verify resolution - Citizen
router.put(
    "/:id/verify-resolution",
    authMiddleware,
    roleMiddleware("citizen"),
    verifyResolution
);

// Delete complaint - Admin
router.delete(
    "/:id",
    authMiddleware,
    roleMiddleware("admin"),
    deleteComplaint
);

export default router;