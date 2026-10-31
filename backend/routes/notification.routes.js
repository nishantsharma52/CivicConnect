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
const authenticated = [authMiddleware, roleMiddleware("citizen", "department", "admin")];

router.get("/", ...authenticated, getMyNotifications);
router.get("/unread", ...authenticated, getUnreadNotifications);
router.put("/read-all", ...authenticated, markAllNotificationsAsRead);
router.put("/:id/read", ...authenticated, markNotificationAsRead);
router.delete("/:id", ...authenticated, deleteNotification);

export default router;
