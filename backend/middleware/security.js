const rateLimit = require("express-rate-limit");
const helmet = require("helmet");

// Rate Limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Increased limit for dev/testing
  message: "Too many requests from this IP, please try again after 15 minutes",
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.method === "OPTIONS" // Skip preflight requests
});

// Security Headers
const securityHeaders = helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
});

module.exports = {
  limiter,
  securityHeaders,
};
