import express from "express";
import {
    getPublicAnalytics,
    getAdminAnalytics,
    getDepartmentAnalytics,
} from "../controllers/analytics.controller.js";
import authMiddleware from "../middleware/auth.middleware.js";
import roleMiddleware from "../middleware/role.middleware.js";

const router = express.Router();

router.get("/public", getPublicAnalytics);
router.get("/admin", authMiddleware, roleMiddleware("admin"), getAdminAnalytics);
router.get("/department", authMiddleware, roleMiddleware("department"), getDepartmentAnalytics);

export default router;
