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

export default auth;