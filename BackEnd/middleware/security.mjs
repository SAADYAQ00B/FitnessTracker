import rateLimit from 'express-rate-limit';

// General API rate limiter: 200 requests per 15 minutes per IP
export const generalApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  standardHeaders: true, // Return standard RateLimit-* headers
  legacyHeaders: false, // Disable X-RateLimit-* headers
  message: {
    msg: "Too many requests from this IP address, please try again after 15 minutes."
  }
});

// Auth & OTP rate limiter: 10 requests per 15 minutes per IP to prevent brute-force & DDoS attacks
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    msg: "Too many authentication or OTP verification attempts from this IP. Please try again after 15 minutes."
  }
});
