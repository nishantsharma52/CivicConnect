import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import multer from "multer";

import connectDB from "./config/db.js";

// Routes
import userRoutes from "./routes/user.routes.js";
import departmentRoutes from "./routes/department.routes.js";
import categoryRoutes from "./routes/category.routes.js";
import complaintRoutes from "./routes/complaint.routes.js";
import complaintStatusHistoryRoutes from "./routes/complaintStatusHistory.routes.js";
import commentRoutes from "./routes/comment.routes.js";
import feedbackRoutes from "./routes/feedback.routes.js";
import notificationRoutes from "./routes/notification.routes.js";

dotenv.config();

const app = express();

// Database
connectDB();

// Middlewares
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/departments", departmentRoutes);
app.use("/api/v1/categories", categoryRoutes);
app.use("/api/v1/complaints", complaintRoutes);
app.use("/api/v1/status-history", complaintStatusHistoryRoutes);
app.use("/api/v1/comments", commentRoutes);
app.use("/api/v1/feedback", feedbackRoutes);
app.use("/api/v1/notifications", notificationRoutes);

// Home route
app.get("/", (req, res) => {
    res.send("CivicConnect Backend is running!");
});

// Multer and upload error handler
app.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === "LIMIT_FILE_SIZE") {
            return res.status(400).json({
                message: "Each file must be smaller than 20 MB",
            });
        }

        if (error.code === "LIMIT_FILE_COUNT") {
            return res.status(400).json({
                message: "Maximum 5 files are allowed",
            });
        }

        return res.status(400).json({
            message: error.message,
        });
    }

    if (error) {
        return res.status(400).json({
            message: error.message,
        });
    }

    next();
});

// Server
const PORT = 8080;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});