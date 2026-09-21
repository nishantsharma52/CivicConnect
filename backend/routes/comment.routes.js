import express from "express";

import {
    addComment,
    getComplaintComments,
    updateComment,
    deleteComment,
} from "../controllers/comment.controller.js";

import authMiddleware from "../middleware/auth.middleware.js";
import roleMiddleware from "../middleware/role.middleware.js";

const router = express.Router();

// Add comment
router.post(
    "/complaint/:complaintId",
    authMiddleware,
    roleMiddleware("citizen", "department", "admin"),
    addComment
);

// Get complaint comments
router.get(
    "/complaint/:complaintId",
    authMiddleware,
    roleMiddleware("citizen", "department", "admin"),
    getComplaintComments
);

// Update comment
router.put(
    "/:id",
    authMiddleware,
    roleMiddleware("citizen", "department", "admin"),
    updateComment
);

// Delete comment
router.delete(
    "/:id",
    authMiddleware,
    roleMiddleware("citizen", "department", "admin"),
    deleteComment
);

export default router;