const roleMiddleware = (...allowedRoles) => {
    return (req, res, next) => {
        try {
            // User authentication check
            if (!req.user || !req.user.userId) {
                return res.status(401).json({
                    message: "Authentication required",
                });
            }

            // Role check
            if (!allowedRoles.includes(req.user.role)) {
                return res.status(403).json({
                    message: "You do not have permission to access this resource",
                });
            }

            next();

        } catch (error) {
            console.error("Role Middleware Error:", error);

            return res.status(500).json({
                message: "Authorization error",
            });
        }
    };
};

export default roleMiddleware;