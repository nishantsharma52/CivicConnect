import express from "express";

import {
    createFeedback,
    getComplaintFeedback,
    getAllFeedback,
} from "../controllers/feedback.controller.js";

import authMiddleware from "../middleware/auth.middleware.js";
import roleMiddleware from "../middleware/role.middleware.js";

const router = express.Router();

// Citizen gives feedback
router.post(
    "/complaint/:complaintId",
    authMiddleware,
    roleMiddleware("citizen"),
    createFeedback
);

// Get feedback of a particular complaint
router.get(
    "/complaint/:complaintId",
    authMiddleware,
    roleMiddleware("citizen", "department", "admin"),
    getComplaintFeedback
);

// Admin gets all feedback
router.get(
    "/",
    authMiddleware,
    roleMiddleware("admin"),
    getAllFeedback
);

export default router;