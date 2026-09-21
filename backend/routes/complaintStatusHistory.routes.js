import express from "express";

import {
    getComplaintStatusHistory,
    getLatestStatusHistory,
} from "../controllers/complaintStatusHistory.controller.js";

import authMiddleware from "../middleware/auth.middleware.js";
import roleMiddleware from "../middleware/role.middleware.js";

const router = express.Router();

// Get complete status history
router.get(
    "/complaint/:complaintId",
    authMiddleware,
    roleMiddleware("citizen", "department", "admin"),
    getComplaintStatusHistory
);

// Get latest status history
router.get(
    "/complaint/:complaintId/latest",
    authMiddleware,
    roleMiddleware("citizen", "department", "admin"),
    getLatestStatusHistory
);

export default router;