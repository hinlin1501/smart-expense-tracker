const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
  try {
    // Check JWT secret configuration
    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
      console.error("JWT_SECRET is not configured");

      return res.status(500).json({
        message: "Internal server error",
      });
    }

    // Get Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    // Extract token
    const token = authHeader.slice(7).trim();

    if (!token) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    // Verify JWT
    const decoded = jwt.verify(token, jwtSecret);

    // Validate JWT payload
    if (
      !decoded ||
      typeof decoded !== "object" ||
      !Number.isInteger(decoded.userId) ||
      decoded.userId <= 0
    ) {
      return res.status(401).json({
        message: "Invalid or expired token",
      });
    }

    // Attach authenticated user to request
    req.user = decoded;

    return next();
  } catch (error) {
    return res.status(401).json({
      message: "Invalid or expired token",
    });
  }
};

module.exports = authMiddleware;
