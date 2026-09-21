import express from "express";

import {
    getAllCategories,
    getCategoryById,
    createCategory,
    updateCategory,
    activateCategory,
    deactivateCategory,
    deleteCategory,
} from "../controllers/category.controller.js";

import authMiddleware from "../middleware/auth.middleware.js";
import roleMiddleware from "../middleware/role.middleware.js";

const router = express.Router();

// Public routes
router.get("/", getAllCategories);
router.get("/:id", getCategoryById);

// Admin routes
router.post(
    "/",
    authMiddleware,
    roleMiddleware("admin"),
    createCategory
);

router.put(
    "/:id",
    authMiddleware,
    roleMiddleware("admin"),
    updateCategory
);

router.put(
    "/:id/activate",
    authMiddleware,
    roleMiddleware("admin"),
    activateCategory
);

router.put(
    "/:id/deactivate",
    authMiddleware,
    roleMiddleware("admin"),
    deactivateCategory
);

router.delete(
    "/:id",
    authMiddleware,
    roleMiddleware("admin"),
    deleteCategory
);

export default router;