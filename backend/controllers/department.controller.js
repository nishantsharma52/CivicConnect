import Department from "../models/department.model.js";
import User from "../models/user.model.js";


// GET ALL DEPARTMENTS
export const getAllDepartments = async (req, res) => {
    try {
        const departments = await Department.find()
            .sort({ createdAt: -1 });

        return res.status(200).json({
            message: "Departments fetched successfully",
            departments,
        });

    } catch (error) {
        console.error("Get Departments Error:", error);

        return res.status(500).json({
            message: "Server error",
        });
    }
};


// GET SINGLE DEPARTMENT
export const getDepartmentById = async (req, res) => {
    try {
        const department = await Department.findById(req.params.id);

        if (!department) {
            return res.status(404).json({
                message: "Department not found",
            });
        }

        return res.status(200).json({
            message: "Department fetched successfully",
            department,
        });

    } catch (error) {
        console.error("Get Department Error:", error);

        return res.status(500).json({
            message: "Server error",
        });
    }
};


// CREATE DEPARTMENT
export const createDepartment = async (req, res) => {
    try {
        const {
            name,
            description,
            category,
            contactEmail,
            contactPhone,
        } = req.body;

        if (!name || !category) {
            return res.status(400).json({
                message: "Name and category are required",
            });
        }

        const existingDepartment = await Department.findOne({
            name,
        });

        if (existingDepartment) {
            return res.status(409).json({
                message: "Department already exists",
            });
        }

        const department = await Department.create({
            name,
            description,
            category,
            contactEmail,
            contactPhone,
        });

        return res.status(201).json({
            message: "Department created successfully",
            department,
        });

    } catch (error) {
        console.error("Create Department Error:", error);

        return res.status(500).json({
            message: "Server error",
        });
    }
};


// UPDATE DEPARTMENT
export const updateDepartment = async (req, res) => {
    try {
        const department = await Department.findById(req.params.id);

        if (!department) {
            return res.status(404).json({
                message: "Department not found",
            });
        }

        const {
            name,
            description,
            category,
            contactEmail,
            contactPhone,
        } = req.body;

        if (name !== undefined) {
            department.name = name;
        }

        if (description !== undefined) {
            department.description = description;
        }

        if (category !== undefined) {
            department.category = category;
        }

        if (contactEmail !== undefined) {
            department.contactEmail = contactEmail;
        }

        if (contactPhone !== undefined) {
            department.contactPhone = contactPhone;
        }

        await department.save();

        return res.status(200).json({
            message: "Department updated successfully",
            department,
        });

    } catch (error) {
        console.error("Update Department Error:", error);

        return res.status(500).json({
            message: "Server error",
        });
    }
};


// DEACTIVATE DEPARTMENT
export const deactivateDepartment = async (req, res) => {
    try {
        const department = await Department.findById(req.params.id);

        if (!department) {
            return res.status(404).json({
                message: "Department not found",
            });
        }

        department.isActive = false;

        await department.save();

        return res.status(200).json({
            message: "Department deactivated successfully",
        });

    } catch (error) {
        console.error("Deactivate Department Error:", error);

        return res.status(500).json({
            message: "Server error",
        });
    }
};


// ACTIVATE DEPARTMENT
export const activateDepartment = async (req, res) => {
    try {
        const department = await Department.findById(req.params.id);

        if (!department) {
            return res.status(404).json({
                message: "Department not found",
            });
        }

        department.isActive = true;

        await department.save();

        return res.status(200).json({
            message: "Department activated successfully",
        });

    } catch (error) {
        console.error("Activate Department Error:", error);

        return res.status(500).json({
            message: "Server error",
        });
    }
};


// DELETE DEPARTMENT
export const deleteDepartment = async (req, res) => {
    try {
        const department = await Department.findById(req.params.id);

        if (!department) {
            return res.status(404).json({
                message: "Department not found",
            });
        }

        const users = await User.countDocuments({
            department: department._id,
        });

        if (users > 0) {
            return res.status(400).json({
                message: "Cannot delete department because users are assigned to it",
            });
        }

        await Department.findByIdAndDelete(req.params.id);

        return res.status(200).json({
            message: "Department deleted successfully",
        });

    } catch (error) {
        console.error("Delete Department Error:", error);

        return res.status(500).json({
            message: "Server error",
        });
    }
};


// GET DEPARTMENT STAFF
export const getDepartmentStaff = async (req, res) => {
    try {
        const department = await Department.findById(req.params.id);

        if (!department) {
            return res.status(404).json({
                message: "Department not found",
            });
        }

        const staff = await User.find({
            department: department._id,
            role: "department",
        }).select("-password");

        return res.status(200).json({
            message: "Department staff fetched successfully",
            staff,
        });

    } catch (error) {
        console.error("Get Department Staff Error:", error);

        return res.status(500).json({
            message: "Server error",
        });
    }
};