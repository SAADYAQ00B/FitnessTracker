import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

const auth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: "No authentication token found...!" });
    }

    const token = authHeader.split(" ")[1];
    const secret = process.env.JWT_SECRET || 'fitness_tracker_secret_key_2026';
    const decode = jwt.verify(token, secret);
    req.user = decode;
    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid or expired token" });
  }
};

export const verifyAdmin = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const adminEmail = (process.env.EMAIL_USER || process.env.SMTP_USER || '').toLowerCase().trim();
    if (adminEmail && req.user.email && req.user.email.toLowerCase() === adminEmail) {
      req.user.role = 'admin';
      return next();
    }

    if (req.user.role === 'admin') {
      return next();
    }

    if (req.user.role && req.user.role !== 'admin') {
      return res.status(403).json({ message: "Forbidden: Admin access required" });
    }

    // Check database if token doesn't have role yet and DB is connected
    const mongoose = (await import('mongoose')).default;
    if (mongoose.connection.readyState === 1) {
      const User = (await import('../models/userModel.mjs')).default;
      const userDoc = await User.findById(req.user.id).select('role email');
      if (userDoc && (userDoc.role === 'admin' || (adminEmail && userDoc.email.toLowerCase() === adminEmail))) {
        req.user.role = 'admin';
        return next();
      }
    }

    return res.status(403).json({ message: "Forbidden: Admin access required" });
  } catch (error) {
    console.error("verifyAdmin error:", error);
    return res.status(500).json({ message: "Internal server error during authorization check" });
  }
};

export default auth;