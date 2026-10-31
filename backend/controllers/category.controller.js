import Category from "../models/category.model.js";
import Department from "../models/department.model.js";
import Complaint from "../models/complaint.model.js";
import { isValidObjectId } from "../utils/request.js";

const normalizeSubCategories = (value) => {
    if (value === undefined || value === null) return [];
    if (!Array.isArray(value)) throw new Error("subCategories must be an array");
    return [...new Set(value.map((item) => String(item).trim()).filter(Boolean))];
};

export const getAllCategories = async (req, res) => {
    try {
        const filter = req.query.includeInactive === "true" ? {} : { isActive: true };
        if (req.query.department && isValidObjectId(req.query.department)) filter.department = req.query.department;

        const categories = await Category.find(filter)
            .populate("department", "name category")
            .sort({ name: 1 });

        return res.status(200).json({ message: "Categories fetched successfully", categories });
    } catch (error) {
        console.error("Get Categories Error:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

export const getCategoryById = async (req, res) => {
    try {
        if (!isValidObjectId(req.params.id)) return res.status(400).json({ message: "Invalid category ID" });
        const category = await Category.findById(req.params.id).populate("department", "name category");
        if (!category) return res.status(404).json({ message: "Category not found" });
        return res.status(200).json({ message: "Category fetched successfully", category });
    } catch (error) {
        console.error("Get Category Error:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

export const createCategory = async (req, res) => {
    try {
        const { name, description, subCategories, department } = req.body;
        const normalizedName = String(name || "").trim();
        if (!normalizedName) return res.status(400).json({ message: "Category name is required" });

        const existing = await Category.findOne({ name: { $regex: `^${normalizedName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" } });
        if (existing) return res.status(409).json({ message: "Category already exists" });

        if (department !== undefined && department !== null && !isValidObjectId(department)) {
            return res.status(400).json({ message: "Invalid department ID" });
        }

        if (department) {
            const departmentExists = await Department.findOne({ _id: department, isActive: true });
            if (!departmentExists) return res.status(404).json({ message: "Department not found or inactive" });
        }

        let subs;
        try { subs = normalizeSubCategories(subCategories); }
        catch (error) { return res.status(400).json({ message: error.message }); }

        const category = await Category.create({
            name: normalizedName,
            description: description?.trim(),
            subCategories: subs,
            department: department || null,
        });

        return res.status(201).json({ message: "Category created successfully", category });
    } catch (error) {
        console.error("Create Category Error:", error);
        if (error.code === 11000) return res.status(409).json({ message: "Category already exists" });
        return res.status(500).json({ message: "Server error" });
    }
};

export const updateCategory = async (req, res) => {
    try {
        if (!isValidObjectId(req.params.id)) return res.status(400).json({ message: "Invalid category ID" });
        const category = await Category.findById(req.params.id);
        if (!category) return res.status(404).json({ message: "Category not found" });

        const { name, description, subCategories, department } = req.body;

        if (name !== undefined) {
            const normalizedName = String(name).trim();
            if (!normalizedName) return res.status(400).json({ message: "Category name cannot be empty" });
            const duplicate = await Category.findOne({
                _id: { $ne: category._id },
                name: { $regex: `^${normalizedName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" },
            });
            if (duplicate) return res.status(409).json({ message: "Category already exists" });
            category.name = normalizedName;
        }

        if (description !== undefined) category.description = String(description).trim();

        if (subCategories !== undefined) {
            try { category.subCategories = normalizeSubCategories(subCategories); }
            catch (error) { return res.status(400).json({ message: error.message }); }
        }

        if (department !== undefined) {
            if (department !== null) {
                if (!isValidObjectId(department)) return res.status(400).json({ message: "Invalid department ID" });
                const departmentExists = await Department.findOne({ _id: department, isActive: true });
                if (!departmentExists) return res.status(404).json({ message: "Department not found or inactive" });
            }
            category.department = department;
        }

        await category.save();
        return res.status(200).json({ message: "Category updated successfully", category });
    } catch (error) {
        console.error("Update Category Error:", error);
        if (error.code === 11000) return res.status(409).json({ message: "Category already exists" });
        return res.status(500).json({ message: "Server error" });
    }
};

const toggleCategory = async (req, res, isActive) => {
    try {
        if (!isValidObjectId(req.params.id)) return res.status(400).json({ message: "Invalid category ID" });
        const category = await Category.findById(req.params.id);
        if (!category) return res.status(404).json({ message: "Category not found" });
        category.isActive = isActive;
        await category.save();
        return res.status(200).json({
            message: `Category ${isActive ? "activated" : "deactivated"} successfully`,
            category,
        });
    } catch (error) {
        console.error("Toggle Category Error:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

export const activateCategory = (req, res) => toggleCategory(req, res, true);
export const deactivateCategory = (req, res) => toggleCategory(req, res, false);

export const deleteCategory = async (req, res) => {
    try {
        if (!isValidObjectId(req.params.id)) return res.status(400).json({ message: "Invalid category ID" });
        const category = await Category.findById(req.params.id);
        if (!category) return res.status(404).json({ message: "Category not found" });

        const complaints = await Complaint.countDocuments({ category: category._id });
        if (complaints > 0) {
            return res.status(400).json({ message: "Cannot delete category because complaints use this category" });
        }

        await Category.findByIdAndDelete(category._id);
        return res.status(200).json({ message: "Category deleted successfully" });
    } catch (error) {
        console.error("Delete Category Error:", error);
        return res.status(500).json({ message: "Server error" });
    }
};
