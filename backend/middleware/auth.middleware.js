import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

const authMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return res.status(401).json({
                message: "Authentication token is required",
            });
        }

        if (!authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                message: "Invalid authorization format",
            });
        }

        const token = authHeader.split(" ")[1];

        if (!token) {
            return res.status(401).json({
                message: "Authentication token is required",
            });
        }

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        const user = await User.findById(decoded.userId)
            .select("-password");

        if (!user) {
            return res.status(401).json({
                message: "User not found",
            });
        }

        if (!user.isActive) {
            return res.status(403).json({
                message: "Your account is inactive",
            });
        }

        req.user = {
            userId: user._id,
            role: user.role,
            department: user.department,
            isVerified: user.isVerified,
        };

        next();

    } catch (error) {
        console.error("Auth Middleware Error:", error);

        if (error.name === "TokenExpiredError") {
            return res.status(401).json({
                message: "Token has expired. Please login again",
            });
        }

        if (error.name === "JsonWebTokenError") {
            return res.status(401).json({
                message: "Invalid token",
            });
        }

        return res.status(500).json({
            message: "Authentication error",
        });
    }
};

export default authMiddleware;