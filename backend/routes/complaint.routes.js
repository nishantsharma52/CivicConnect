import express from "express";

import {
    createComplaint,
    analyzeComplaintPreview,
    getAllComplaints,
    getMyComplaints,
    getComplaintById,
    getPublicComplaintByComplaintId,
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
import upload from "../middleware/upload.middleware.js";

const router = express.Router();

// Public tracking by the human-friendly complaint ID.
router.get("/track/:complaintId", getPublicComplaintByComplaintId);

// Authenticated citizen gets a real AI/local classification preview before submission.
router.post(
    "/analyze",
    authMiddleware,
    roleMiddleware("citizen"),
    analyzeComplaintPreview
);

// Citizen creates a complaint with evidence.
router.post(
    "/",
    authMiddleware,
    roleMiddleware("citizen"),
    upload.array("evidence", 5),
    createComplaint
);

// Citizen's complaints.
router.get(
    "/my",
    authMiddleware,
    roleMiddleware("citizen"),
    getMyComplaints
);

// Department/Admin complaint management list.
router.get(
    "/",
    authMiddleware,
    roleMiddleware("department", "admin"),
    getAllComplaints
);

// Any authenticated actor with resource-level access.
router.get(
    "/:id",
    authMiddleware,
    roleMiddleware("citizen", "department", "admin"),
    getComplaintById
);

router.put(
    "/:id",
    authMiddleware,
    roleMiddleware("citizen"),
    updateComplaint
);

router.put(
    "/:id/assign-department",
    authMiddleware,
    roleMiddleware("admin"),
    assignDepartment
);

router.put(
    "/:id/assign-staff",
    authMiddleware,
    roleMiddleware("admin", "department"),
    assignStaff
);

router.put(
    "/:id/status",
    authMiddleware,
    roleMiddleware("admin", "department"),
    updateComplaintStatus
);

router.put(
    "/:id/resolution-proof",
    authMiddleware,
    roleMiddleware("admin", "department"),
    upload.array("resolutionProof", 5),
    addResolutionProof
);

router.put(
    "/:id/verify-resolution",
    authMiddleware,
    roleMiddleware("citizen"),
    verifyResolution
);

router.delete(
    "/:id",
    authMiddleware,
    roleMiddleware("citizen", "admin"),
    deleteComplaint
);

export default router;
