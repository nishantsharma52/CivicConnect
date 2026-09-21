import express from "express";

import {
    getMyNotifications,
    getUnreadNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification,
} from "../controllers/notification.controller.js";

import authMiddleware from "../middleware/auth.middleware.js";
import roleMiddleware from "../middleware/role.middleware.js";

const router = express.Router();

// Get all my notifications
router.get(
    "/",
    authMiddleware,
    roleMiddleware("citizen", "department", "admin"),
    getMyNotifications
);

// Get unread notifications
router.get(
    "/unread",
    authMiddleware,
    roleMiddleware("citizen", "department", "admin"),
    getUnreadNotifications
);

// Mark single notification as read
router.put(
    "/:id/read",
    authMiddleware,
    roleMiddleware("citizen", "department", "admin"),
    markNotificationAsRead
);

// Mark all notifications as read
router.put(
    "/read-all",
    authMiddleware,
    roleMiddleware("citizen", "department", "admin"),
    markAllNotificationsAsRead
);

// Delete notification
router.delete(
    "/:id",
    authMiddleware,
    roleMiddleware("citizen", "department", "admin"),
    deleteNotification
);

export default router;