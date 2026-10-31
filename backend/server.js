import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import multer from "multer";

import connectDB from "./config/db.js";

import userRoutes from "./routes/user.routes.js";
import departmentRoutes from "./routes/department.routes.js";
import categoryRoutes from "./routes/category.routes.js";
import complaintRoutes from "./routes/complaint.routes.js";
import complaintStatusHistoryRoutes from "./routes/complaintStatusHistory.routes.js";
import commentRoutes from "./routes/comment.routes.js";
import feedbackRoutes from "./routes/feedback.routes.js";
import notificationRoutes from "./routes/notification.routes.js";
import analyticsRoutes from "./routes/analytics.routes.js";
import { seedMasterData } from "./utils/seedMasterData.js";

dotenv.config();

const app = express();

app.disable("x-powered-by");
app.use(helmet());
app.use(cors({ origin: true }));
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));

app.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        message: "CivicConnect Backend is running!",
        version: "v1",
    });
});

app.get("/api/v1/health", (req, res) => {
    res.status(200).json({
        success: true,
        message: "CivicConnect API is healthy",
    });
});

app.use("/api/v1/users", userRoutes);
app.use("/api/v1/departments", departmentRoutes);
app.use("/api/v1/categories", categoryRoutes);
app.use("/api/v1/complaints", complaintRoutes);
app.use("/api/v1/status-history", complaintStatusHistoryRoutes);
app.use("/api/v1/comments", commentRoutes);
app.use("/api/v1/feedback", feedbackRoutes);
app.use("/api/v1/notifications", notificationRoutes);
app.use("/api/v1/analytics", analyticsRoutes);

app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "API endpoint not found",
        path: req.originalUrl,
    });
});

app.use((error, req, res, next) => {
    console.error("Global Error:", error);

    if (error instanceof multer.MulterError) {
        if (error.code === "LIMIT_FILE_SIZE") {
            return res.status(400).json({ message: "Each file must be smaller than 20 MB" });
        }
        if (error.code === "LIMIT_FILE_COUNT") {
            return res.status(400).json({ message: "Maximum 5 files are allowed" });
        }
        return res.status(400).json({ message: error.message });
    }

    if (error?.name === "SyntaxError" && error?.type === "entity.parse.failed") {
        return res.status(400).json({ message: "Invalid JSON request body" });
    }

    return res.status(error?.statusCode || 500).json({
        message: error?.statusCode ? error.message : "Server error",
    });
});

const PORT = Number(process.env.PORT) || 8080;

const startServer = async () => {
    try {
        await connectDB();

        if (String(process.env.AUTO_SEED_MASTER_DATA ?? "true").toLowerCase() === "true") {
            const master = await seedMasterData();
            console.log(`Master data ready: ${master.departments} departments, ${master.categories} categories`);
        }

        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    } catch (error) {
        console.error("Server startup failed:", error.message);
        process.exit(1);
    }
};

startServer();

export default app;
