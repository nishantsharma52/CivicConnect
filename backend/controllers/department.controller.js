import Department from "../models/department.model.js";
import User from "../models/user.model.js";
import Complaint from "../models/complaint.model.js";
import { isValidObjectId } from "../utils/request.js";

const VALID_CATEGORIES = new Set([
    "road",
    "water",
    "electricity",
    "sanitation",
    "drainage",
    "streetlight",
    "other",
]);

const normalizeDepartmentInput = ({ name, category }) => ({
    name: String(name || "").trim(),
    category: String(category || "").trim().toLowerCase(),
});

export const getAllDepartments = async (req, res) => {
    try {
        const filter = req.query.includeInactive === "true"
            ? {}
            : { isActive: true };

        const departments = await Department.find(filter).sort({ name: 1 });
        return res.status(200).json({ message: "Departments fetched successfully", departments });
    } catch (error) {
        console.error("Get Departments Error:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

export const getDepartmentById = async (req, res) => {
    try {
        if (!isValidObjectId(req.params.id)) return res.status(400).json({ message: "Invalid department ID" });
        const department = await Department.findById(req.params.id);
        if (!department) return res.status(404).json({ message: "Department not found" });
        return res.status(200).json({ message: "Department fetched successfully", department });
    } catch (error) {
        console.error("Get Department Error:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

export const createDepartment = async (req, res) => {
    try {
        const { name, description, category, contactEmail, contactPhone } = req.body;
        const normalized = normalizeDepartmentInput({ name, category });

        if (!normalized.name || !normalized.category) {
            return res.status(400).json({ message: "Name and category are required" });
        }
        if (!VALID_CATEGORIES.has(normalized.category)) {
            return res.status(400).json({ message: "Invalid department category" });
        }

        const existing = await Department.findOne({ name: { $regex: `^${normalized.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" } });
        if (existing) return res.status(409).json({ message: "Department already exists" });

        const department = await Department.create({
            name: normalized.name,
            description: description?.trim(),
            category: normalized.category,
            contactEmail: contactEmail?.trim()?.toLowerCase(),
            contactPhone: contactPhone?.trim(),
        });

        return res.status(201).json({ message: "Department created successfully", department });
    } catch (error) {
        console.error("Create Department Error:", error);
        if (error.code === 11000) return res.status(409).json({ message: "Department already exists" });
        return res.status(500).json({ message: "Server error" });
    }
};

export const updateDepartment = async (req, res) => {
    try {
        if (!isValidObjectId(req.params.id)) return res.status(400).json({ message: "Invalid department ID" });
        const department = await Department.findById(req.params.id);
        if (!department) return res.status(404).json({ message: "Department not found" });

        const { name, description, category, contactEmail, contactPhone, isActive } = req.body;
        if (name !== undefined) {
            const normalizedName = String(name).trim();
            if (!normalizedName) return res.status(400).json({ message: "Department name cannot be empty" });
            const duplicate = await Department.findOne({
                _id: { $ne: department._id },
                name: { $regex: `^${normalizedName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" },
            });
            if (duplicate) return res.status(409).json({ message: "Department already exists" });
            department.name = normalizedName;
        }

        if (category !== undefined) {
            const value = String(category).trim().toLowerCase();
            if (!VALID_CATEGORIES.has(value)) return res.status(400).json({ message: "Invalid department category" });
            department.category = value;
        }
        if (description !== undefined) department.description = String(description).trim();
        if (contactEmail !== undefined) department.contactEmail = String(contactEmail).trim().toLowerCase();
        if (contactPhone !== undefined) department.contactPhone = String(contactPhone).trim();
        if (isActive !== undefined) department.isActive = Boolean(isActive);

        await department.save();
        return res.status(200).json({ message: "Department updated successfully", department });
    } catch (error) {
        console.error("Update Department Error:", error);
        if (error.code === 11000) return res.status(409).json({ message: "Department already exists" });
        return res.status(500).json({ message: "Server error" });
    }
};

export const deactivateDepartment = async (req, res) => toggleDepartment(req, res, false);
export const activateDepartment = async (req, res) => toggleDepartment(req, res, true);

async function toggleDepartment(req, res, isActive) {
    try {
        if (!isValidObjectId(req.params.id)) return res.status(400).json({ message: "Invalid department ID" });
        const department = await Department.findById(req.params.id);
        if (!department) return res.status(404).json({ message: "Department not found" });

        department.isActive = isActive;
        await department.save();

        if (!isActive) {
            await User.updateMany({ department: department._id }, { $set: { isActive: false } });
        }

        return res.status(200).json({
            message: `Department ${isActive ? "activated" : "deactivated"} successfully`,
            department,
        });
    } catch (error) {
        console.error("Toggle Department Error:", error);
        return res.status(500).json({ message: "Server error" });
    }
}

export const deleteDepartment = async (req, res) => {
    try {
        if (!isValidObjectId(req.params.id)) return res.status(400).json({ message: "Invalid department ID" });
        const department = await Department.findById(req.params.id);
        if (!department) return res.status(404).json({ message: "Department not found" });

        const [users, activeComplaints] = await Promise.all([
            User.countDocuments({ department: department._id }),
            Complaint.countDocuments({ department: department._id, status: { $nin: ["resolved", "rejected"] } }),
        ]);

        if (users > 0) {
            return res.status(400).json({ message: "Cannot delete department because users are assigned to it" });
        }
        if (activeComplaints > 0) {
            return res.status(400).json({ message: "Cannot delete department because active complaints are assigned to it" });
        }

        await Department.findByIdAndDelete(department._id);
        return res.status(200).json({ message: "Department deleted successfully" });
    } catch (error) {
        console.error("Delete Department Error:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

export const getDepartmentStaff = async (req, res) => {
    try {
        if (!isValidObjectId(req.params.id)) return res.status(400).json({ message: "Invalid department ID" });
        const department = await Department.findById(req.params.id);
        if (!department) return res.status(404).json({ message: "Department not found" });

        if (req.user.role === "department" && String(req.user.department) !== String(department._id)) {
            return res.status(403).json({ message: "You can only view staff from your own department" });
        }

        const staff = await User.find({
            department: department._id,
            role: "department",
        }).select("-password").sort({ name: 1 });

        return res.status(200).json({ message: "Department staff fetched successfully", staff });
    } catch (error) {
        console.error("Get Department Staff Error:", error);
        return res.status(500).json({ message: "Server error" });
    }
};
