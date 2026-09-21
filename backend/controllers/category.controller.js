import Category from "../models/category.model.js";
import Department from "../models/department.model.js";


// GET ALL CATEGORIES
export const getAllCategories = async (req, res) => {
    try {
        const categories = await Category.find()
            .populate("department", "name category")
            .sort({ name: 1 });

        return res.status(200).json({
            message: "Categories fetched successfully",
            categories,
        });

    } catch (error) {
        console.error("Get Categories Error:", error);

        return res.status(500).json({
            message: "Server error",
        });
    }
};


// GET SINGLE CATEGORY
export const getCategoryById = async (req, res) => {
    try {
        const category = await Category.findById(req.params.id)
            .populate("department", "name category");

        if (!category) {
            return res.status(404).json({
                message: "Category not found",
            });
        }

        return res.status(200).json({
            message: "Category fetched successfully",
            category,
        });

    } catch (error) {
        console.error("Get Category Error:", error);

        return res.status(500).json({
            message: "Server error",
        });
    }
};


// CREATE CATEGORY
export const createCategory = async (req, res) => {
    try {
        const {
            name,
            description,
            subCategories,
            department,
        } = req.body;

        if (!name) {
            return res.status(400).json({
                message: "Category name is required",
            });
        }

        const existingCategory = await Category.findOne({
            name,
        });

        if (existingCategory) {
            return res.status(409).json({
                message: "Category already exists",
            });
        }

        if (department) {
            const departmentExists = await Department.findById(department);

            if (!departmentExists) {
                return res.status(404).json({
                    message: "Department not found",
                });
            }
        }

        const category = await Category.create({
            name,
            description,
            subCategories,
            department: department || null,
        });

        return res.status(201).json({
            message: "Category created successfully",
            category,
        });

    } catch (error) {
        console.error("Create Category Error:", error);

        return res.status(500).json({
            message: "Server error",
        });
    }
};


// UPDATE CATEGORY
export const updateCategory = async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);

        if (!category) {
            return res.status(404).json({
                message: "Category not found",
            });
        }

        const {
            name,
            description,
            subCategories,
            department,
        } = req.body;

        if (name !== undefined) {
            category.name = name;
        }

        if (description !== undefined) {
            category.description = description;
        }

        if (subCategories !== undefined) {
            category.subCategories = subCategories;
        }

        if (department !== undefined) {
            if (department !== null) {
                const departmentExists = await Department.findById(department);

                if (!departmentExists) {
                    return res.status(404).json({
                        message: "Department not found",
                    });
                }
            }

            category.department = department;
        }

        await category.save();

        return res.status(200).json({
            message: "Category updated successfully",
            category,
        });

    } catch (error) {
        console.error("Update Category Error:", error);

        return res.status(500).json({
            message: "Server error",
        });
    }
};


// ACTIVATE CATEGORY
export const activateCategory = async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);

        if (!category) {
            return res.status(404).json({
                message: "Category not found",
            });
        }

        category.isActive = true;

        await category.save();

        return res.status(200).json({
            message: "Category activated successfully",
        });

    } catch (error) {
        console.error("Activate Category Error:", error);

        return res.status(500).json({
            message: "Server error",
        });
    }
};


// DEACTIVATE CATEGORY
export const deactivateCategory = async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);

        if (!category) {
            return res.status(404).json({
                message: "Category not found",
            });
        }

        category.isActive = false;

        await category.save();

        return res.status(200).json({
            message: "Category deactivated successfully",
        });

    } catch (error) {
        console.error("Deactivate Category Error:", error);

        return res.status(500).json({
            message: "Server error",
        });
    }
};


// DELETE CATEGORY
export const deleteCategory = async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);

        if (!category) {
            return res.status(404).json({
                message: "Category not found",
            });
        }

        await Category.findByIdAndDelete(req.params.id);

        return res.status(200).json({
            message: "Category deleted successfully",
        });

    } catch (error) {
        console.error("Delete Category Error:", error);

        return res.status(500).json({
            message: "Server error",
        });
    }
};