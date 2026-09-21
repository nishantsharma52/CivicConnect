import express from "express";

import {
    getAllDepartments,
    getDepartmentById,
    createDepartment,
    updateDepartment,
    deactivateDepartment,
    activateDepartment,
    deleteDepartment,
    getDepartmentStaff,
} from "../controllers/department.controller.js";

import authMiddleware from "../middleware/auth.middleware.js";
import roleMiddleware from "../middleware/role.middleware.js";

const router = express.Router();

// Public routes
router.get("/", getAllDepartments);
router.get("/:id", getDepartmentById);

// Admin routes
router.post(
    "/",
    authMiddleware,
    roleMiddleware("admin"),
    createDepartment
);

router.put(
    "/:id",
    authMiddleware,
    roleMiddleware("admin"),
    updateDepartment
);

router.put(
    "/:id/deactivate",
    authMiddleware,
    roleMiddleware("admin"),
    deactivateDepartment
);

router.put(
    "/:id/activate",
    authMiddleware,
    roleMiddleware("admin"),
    activateDepartment
);

router.delete(
    "/:id",
    authMiddleware,
    roleMiddleware("admin"),
    deleteDepartment
);

// Admin and Department staff
router.get(
    "/:id/staff",
    authMiddleware,
    roleMiddleware("admin", "department"),
    getDepartmentStaff
);

export default router;