import mongoose from "mongoose";
import dotenv from "dotenv";
import connectDB from "../config/db.js";
import Department from "../models/department.model.js";
import Category from "../models/category.model.js";

dotenv.config();

const masterData = [
    {
        department: {
            name: "Road Department",
            description: "Handles road construction, potholes, repairs and maintenance.",
            category: "road",
            contactEmail: "road@civicconnect.com",
            contactPhone: "9876543210",
        },
        categories: [
            { name: "Road Damage", description: "Complaints related to damaged roads.", subCategories: ["Pothole", "Broken Road", "Road Crack"] },
        ],
    },
    {
        department: {
            name: "Water Department",
            description: "Handles water supply, leakage and pipeline issues.",
            category: "water",
            contactEmail: "water@civicconnect.com",
            contactPhone: "9876543211",
        },
        categories: [
            { name: "Water Supply", description: "Complaints related to water supply and pipelines.", subCategories: ["Pipeline Leakage", "No Water Supply", "Contaminated Water"] },
        ],
    },
    {
        department: {
            name: "Electricity Department",
            description: "Handles electricity supply, wiring and power-related civic issues.",
            category: "electricity",
            contactEmail: "electricity@civicconnect.com",
            contactPhone: "9876543212",
        },
        categories: [
            { name: "Electricity Issue", description: "Complaints related to electricity services.", subCategories: ["Power Outage", "Exposed Wire", "Transformer Issue"] },
        ],
    },
    {
        department: {
            name: "Sanitation Department",
            description: "Handles waste collection, cleanliness and sanitation issues.",
            category: "sanitation",
            contactEmail: "sanitation@civicconnect.com",
            contactPhone: "9876543213",
        },
        categories: [
            { name: "Sanitation", description: "Complaints related to sanitation and waste management.", subCategories: ["Garbage Collection", "Dirty Public Area", "Waste Dump"] },
        ],
    },
    {
        department: {
            name: "Drainage Department",
            description: "Handles drainage, sewer and waterlogging issues.",
            category: "drainage",
            contactEmail: "drainage@civicconnect.com",
            contactPhone: "9876543214",
        },
        categories: [
            { name: "Drainage Issue", description: "Complaints related to drains, sewer and waterlogging.", subCategories: ["Blocked Drain", "Open Drain", "Waterlogging"] },
        ],
    },
    {
        department: {
            name: "Street Light Department",
            description: "Handles street light installation, repair and maintenance.",
            category: "streetlight",
            contactEmail: "streetlight@civicconnect.com",
            contactPhone: "9876543215",
        },
        categories: [
            { name: "Street Light", description: "Complaints related to street lighting.", subCategories: ["Light Not Working", "Broken Pole", "Flickering Light"] },
        ],
    },
];

export const seedMasterData = async () => {
    for (const item of masterData) {
        const department = await Department.findOneAndUpdate(
            { name: item.department.name },
            { $set: item.department },
            { new: true, upsert: true, setDefaultsOnInsert: true }
        );

        for (const categoryData of item.categories) {
            await Category.findOneAndUpdate(
                { name: categoryData.name },
                { $set: { ...categoryData, department: department._id, isActive: true } },
                { new: true, upsert: true, setDefaultsOnInsert: true }
            );
        }
    }

    return {
        departments: await Department.countDocuments({ isActive: true }),
        categories: await Category.countDocuments({ isActive: true }),
    };
};

if (process.argv[1]?.endsWith("seedMasterData.js")) {
    try {
        await connectDB();
        const result = await seedMasterData();
        console.log(`Master data ready: ${result.departments} departments, ${result.categories} categories`);
        await mongoose.disconnect();
        process.exit(0);
    } catch (error) {
        console.error("Master data seed failed:", error);
        await mongoose.disconnect().catch(() => {});
        process.exit(1);
    }
}
