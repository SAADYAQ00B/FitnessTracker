import User from '../models/userModel.mjs';
import Workout from '../models/workoutModel.mjs';
import WorkoutSession from '../models/workoutSessionModel.mjs';
import Nutrition from '../models/nutritionModel.mjs';
import Progress from '../models/progressModel.mjs';
import Reminder from '../models/reminderModel.mjs';
import SupportTicket from '../models/supportTicketModel.mjs';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import crypto from 'crypto';
import { OAuth2Client } from 'google-auth-library';
import { uploadToCloudinary } from '../middleware/upload.mjs';

const JWT_SECRET = process.env.JWT_SECRET || 'fitness_tracker_secret_key_2026';

// Reusable Nodemailer OTP sender (Gmail SMTP or custom SMTP)
export const sendEmailOTP = async ({ to, subject, title, name, otpCode, expiryMinutes = 10 }) => {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT || 587;
  const userEmail = process.env.EMAIL_USER || process.env.SMTP_USER;
  const pass = process.env.EMAIL_PASS || process.env.SMTP_PASS;

  if (!userEmail || !pass) {
    throw new Error("Email service is not configured. Please set EMAIL_USER and EMAIL_PASS in your environment.");
  }

  const transporter = host
    ? nodemailer.createTransport({
        host,
        port: Number(port),
        secure: Number(port) === 465,
        auth: { user: userEmail, pass },
      })
    : nodemailer.createTransport({
        service: "gmail",
        auth: { user: userEmail, pass },
      });

  await transporter.sendMail({
    from: `"FITNESSTRACKER" <${userEmail}>`,
    to,
    subject,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 500px; padding: 28px; border: 1px solid #e2e8f0; border-radius: 16px; background: #ffffff; color: #1e293b;">
        <h2 style="color: #166534; margin-top: 0; font-size: 22px;">${title}</h2>
        <p style="font-size: 14px; line-height: 1.5;">Hi ${name || "there"},</p>
        <p style="font-size: 14px; line-height: 1.5;">Your 6-digit verification code is:</p>
        <div style="font-size: 36px; font-weight: 800; letter-spacing: 8px; text-align: center; margin: 24px 0; padding: 18px; background: #f0fdf4; color: #15803d; border-radius: 12px; border: 1px solid #bbf7d0;">
          ${otpCode}
        </div>
        <p style="font-size: 13px; color: #64748b; line-height: 1.5;">This code will expire in ${expiryMinutes} minutes. If you did not request this, please safely ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 24px 0;" />
        <p style="font-size: 11px; color: #94a3b8; text-align: center; margin: 0;">© 2026 FITNESSTRACKER. All rights reserved.</p>
      </div>
    `,
  });
};

export const Signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ msg: "Please provide name, email, and password." });
    }

    const trimmedEmail = email.toLowerCase().trim();
    const existingUser = await User.findOne({ email: trimmedEmail });

    if (existingUser && existingUser.isVerified) {
      return res.status(400).json({ msg: "Account already exists with this email. Please login." });
    }

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    const hashPassword = bcrypt.hashSync(password, 10);

    let user;
    if (existingUser && !existingUser.isVerified) {
      existingUser.name = name;
      existingUser.password = hashPassword;
      existingUser.otpCode = otpCode;
      existingUser.otpExpires = otpExpires;
      user = await existingUser.save();
    } else {
      user = new User({
        name,
        email: trimmedEmail,
        password: hashPassword,
        isVerified: false,
        otpCode,
        otpExpires,
      });
      await user.save();
    }

    // Send OTP exclusively via Nodemailer
    try {
      await sendEmailOTP({
        to: user.email,
        name: user.name,
        subject: "Verify Your Email - FITNESSTRACKER",
        title: "Welcome to FITNESSTRACKER",
        otpCode,
        expiryMinutes: 10,
      });
    } catch (mailErr) {
      console.error("Nodemailer signup send failed:", mailErr.message);
      return res.status(500).json({
        msg: "Failed to send verification email. Please check your email configuration on the server.",
        error: mailErr.message,
      });
    }

    res.status(201).json({
      msg: "Verification code sent to your email.",
      email: user.email,
    });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ msg: error.message, error: error.message });
  }
};

// POST /api/user/verify-otp - Verify Sign Up OTP code
export const VerifySignupOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ msg: "Please provide both email and verification code." });
    }

    const trimmedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: trimmedEmail });

    if (!user) {
      return res.status(404).json({ msg: "No account found with this email." });
    }

    if (user.isVerified) {
      return res.status(400).json({ msg: "Email is already verified. Please sign in." });
    }

    if (user.otpCode !== String(otp).trim()) {
      return res.status(400).json({ msg: "Invalid verification code. Please check your email and try again." });
    }

    if (!user.otpExpires || user.otpExpires < new Date()) {
      return res.status(400).json({ msg: "Verification code has expired. Please request a new code." });
    }

    user.isVerified = true;
    user.otpCode = undefined;
    user.otpExpires = undefined;

    const adminEmail = (process.env.EMAIL_USER || process.env.SMTP_USER || '').toLowerCase().trim();
    if (adminEmail && user.email.toLowerCase() === adminEmail) {
      user.role = 'admin';
    }

    await user.save();

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role || 'user' },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    const userObj = user.toObject();
    delete userObj.password;

    res.status(200).json({
      msg: "Email verified successfully!",
      user: userObj,
      token,
    });
  } catch (error) {
    console.error("Verify OTP error:", error);
    res.status(500).json({ msg: error.message || "Failed to verify code", error: error.message });
  }
};

// POST /api/user/resend-otp - Resend a fresh verification OTP
export const ResendOTP = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ msg: "Please provide your email address." });
    }

    const trimmedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: trimmedEmail });

    if (!user) {
      return res.status(404).json({ msg: "No account found with this email." });
    }

    if (user.isVerified) {
      return res.status(400).json({ msg: "Your email is already verified. Please sign in." });
    }

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    user.otpCode = otpCode;
    user.otpExpires = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    try {
      await sendEmailOTP({
        to: user.email,
        name: user.name,
        subject: "New Verification Code - FITNESSTRACKER",
        title: "Email Verification Code",
        otpCode,
        expiryMinutes: 10,
      });
    } catch (mailErr) {
      console.error("Resend OTP mail error:", mailErr.message);
      return res.status(500).json({
        msg: "Failed to resend verification email. Please check your email configuration on the server.",
        error: mailErr.message,
      });
    }

    res.status(200).json({
      msg: "A new verification code has been sent to your email.",
      email: user.email,
    });
  } catch (error) {
    console.error("Resend OTP error:", error);
    res.status(500).json({ msg: error.message || "Failed to resend code", error: error.message });
  }
};

export const Login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ msg: "Please provide email and password." });
    }

    const trimmedEmail = email.toLowerCase().trim();
    const checkUser = await User.findOne({ email: trimmedEmail });
    if (!checkUser) {
      return res.status(404).json({ msg: "Account does not exist. Please Signup" });
    }

    const verifyPassword = bcrypt.compareSync(password, checkUser.password);
    if (!verifyPassword) {
      return res.status(401).json({ msg: "Invalid Credentials. Please try again..!" });
    }

    // Block unverified users: send fresh OTP and return 403
    if (!checkUser.isVerified) {
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      checkUser.otpCode = otpCode;
      checkUser.otpExpires = new Date(Date.now() + 10 * 60 * 1000);
      await checkUser.save();

      try {
        await sendEmailOTP({
          to: checkUser.email,
          name: checkUser.name,
          subject: "Verify Your Email - FITNESSTRACKER",
          title: "Email Verification Required",
          otpCode,
          expiryMinutes: 10,
        });
      } catch (mailErr) {
        console.error("Nodemailer send login OTP failed:", mailErr.message);
      }

      return res.status(403).json({
        msg: "Please verify your email first. A new code has been sent.",
        needsVerification: true,
        email: checkUser.email,
      });
    }

    const adminEmail = (process.env.EMAIL_USER || process.env.SMTP_USER || '').toLowerCase().trim();
    if (adminEmail && checkUser.email.toLowerCase() === adminEmail && checkUser.role !== 'admin') {
      checkUser.role = 'admin';
      await checkUser.save();
    }

    const token = jwt.sign(
      { id: checkUser._id, email: checkUser.email, role: checkUser.role || 'user' },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    const userObj = checkUser.toObject();
    delete userObj.password;

    res.status(200).json({ msg: "Login Success..!", user: userObj, token });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ msg: error.message, error: error.message });
  }
};

// POST /api/user/google-auth - Authenticate or register with Google OAuth
export const googleAuth = async (req, res) => {
  try {
    const { credential, token: clientToken } = req.body;
    const idToken = credential || clientToken;

    if (!idToken) {
      return res.status(400).json({ msg: "Google credential/token is required." });
    }

    let payload = null;
    const googleClientId = process.env.GOOGLE_CLIENT_ID;

    if (googleClientId) {
      try {
        const client = new OAuth2Client(googleClientId);
        const ticket = await client.verifyIdToken({
          idToken,
          audience: googleClientId,
        });
        payload = ticket.getPayload();
      } catch (verifyErr) {
        console.warn("OAuth2Client verifyIdToken warning:", verifyErr.message);
        payload = jwt.decode(idToken);
      }
    } else {
      payload = jwt.decode(idToken);
    }

    if (!payload || !payload.email) {
      return res.status(400).json({ msg: "Invalid Google credential token." });
    }

    const { email, name, picture } = payload;

    // Find existing user by email or auto-provision
    let user = await User.findOne({ email });

    const adminEmail = (process.env.EMAIL_USER || process.env.SMTP_USER || '').toLowerCase().trim();
    const isAdmin = Boolean(adminEmail && email.toLowerCase() === adminEmail);

    if (user) {
      if (!user.isVerified) {
        user.isVerified = true;
      }
      if (!user.avatar && picture) {
        user.avatar = picture;
      }
      if (isAdmin && user.role !== 'admin') {
        user.role = 'admin';
      }
      await user.save();
    } else {
      const randomPassword = bcrypt.hashSync(crypto.randomBytes(16).toString('hex'), 10);
      user = new User({
        name: name || "Google User",
        email,
        password: randomPassword,
        avatar: picture || "",
        themePreset: "fitness1",
        themeMode: "dark",
        isVerified: true,
        role: isAdmin ? 'admin' : 'user',
      });
      await user.save();
    }

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role || 'user' },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    const userObj = user.toObject();
    delete userObj.password;

    res.status(200).json({
      msg: "Google login success",
      user: userObj,
      token,
    });
  } catch (error) {
    console.error("Google Auth error:", error);
    res.status(500).json({ msg: error.message || "Google authentication failed", error: error.message });
  }
};

// POST /api/user/forgot-password - Send password reset OTP via Nodemailer
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ msg: "Please provide your email address." });
    }

    const trimmedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: trimmedEmail });
    if (!user) {
      return res.status(404).json({ msg: "No account found with this email address." });
    }

    // Generate 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetPasswordToken = otpCode;
    user.resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 mins
    await user.save();

    try {
      await sendEmailOTP({
        to: user.email,
        name: user.name,
        subject: "Password Reset Verification Code - FITNESSTRACKER",
        title: "Password Reset Request",
        otpCode,
        expiryMinutes: 15,
      });
    } catch (mailErr) {
      console.error("Nodemailer send reset OTP failed:", mailErr.message);
      return res.status(500).json({
        msg: "Failed to send password reset email. Please check your email configuration on the server.",
        error: mailErr.message,
      });
    }

    res.status(200).json({
      msg: "Password reset verification code sent to your email.",
    });
  } catch (error) {
    console.error("forgotPassword error:", error);
    res.status(500).json({ msg: error.message || "Failed to process forgot password", error: error.message });
  }
};

// POST /api/user/reset-password - Verify OTP code and reset password
export const resetPassword = async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;

    if (!email || !code || !newPassword) {
      return res.status(400).json({ msg: "Please provide email, verification code, and new password." });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ msg: "New password must be at least 6 characters long." });
    }

    const user = await User.findOne({
      email,
      resetPasswordToken: String(code).trim(),
      resetPasswordExpires: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({ msg: "Invalid or expired verification code." });
    }

    const hashPassword = bcrypt.hashSync(newPassword, 10);
    user.password = hashPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.status(200).json({ msg: "Password reset successfully! You can now log in with your new password." });
  } catch (error) {
    console.error("resetPassword error:", error);
    res.status(500).json({ msg: error.message || "Failed to reset password", error: error.message });
  }
};

// GET /api/user/profile - Get current user profile
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }
    const adminEmail = (process.env.EMAIL_USER || process.env.SMTP_USER || '').toLowerCase().trim();
    if (adminEmail && user.email.toLowerCase() === adminEmail && user.role !== 'admin') {
      user.role = 'admin';
      await user.save();
    }
    res.status(200).json(user);
  } catch (error) {
    console.error("getProfile error:", error);
    res.status(500).json({ msg: error.message, error: error.message });
  }
};

// PUT /api/user/profile - Update profile & preferences
export const updateProfile = async (req, res) => {
  try {
    const updates = { ...req.body };
    delete updates.password;
    delete updates._id;

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select("-password");

    if (!updatedUser) {
      return res.status(404).json({ msg: "User not found" });
    }

    res.status(200).json({ msg: "Profile updated successfully", user: updatedUser });
  } catch (error) {
    console.error("updateProfile error:", error);
    res.status(500).json({ msg: error.message, error: error.message });
  }
};

// POST /api/user/avatar - Upload profile picture to Cloudinary
export const uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ msg: "No image file provided in request (field: avatar)" });
    }

    // Upload to Cloudinary using file buffer
    const result = await uploadToCloudinary(req.file.buffer, req.file.mimetype, "fitness_tracker/avatars");
    const avatarUrl = result.secure_url;

    // Save avatar URL in User document
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { avatar: avatarUrl },
      { new: true }
    ).select("-password");

    res.status(200).json({
      msg: "Profile picture updated successfully",
      avatar: avatarUrl,
      user: updatedUser,
    });
  } catch (error) {
    console.error("uploadAvatar error:", error);
    res.status(500).json({ msg: error.message || "Failed to upload image", error: error.message });
  }
};

// GET /api/user/export-data - GDPR: Export all user data as JSON
export const exportUserData = async (req, res) => {
  try {
    const userId = req.user.id;

    const [user, workouts, sessions, nutrition, progress, reminders, tickets] = await Promise.all([
      User.findById(userId).select("-password"),
      Workout.find({ user: userId }),
      WorkoutSession.find({ user: userId }),
      Nutrition.find({ user: userId }),
      Progress.find({ user: userId }).sort({ date: 1 }),
      Reminder.find({ user: userId }),
      SupportTicket.find({ user: userId }),
    ]);

    const exportData = {
      exportedAt: new Date().toISOString(),
      user,
      workouts,
      sessions,
      nutrition,
      progress,
      reminders,
      supportTickets: tickets,
    };

    res.setHeader("Content-Type", "application/json");
    res.setHeader("Content-Disposition", `attachment; filename="fitness_data_export_${userId}.json"`);
    res.status(200).send(JSON.stringify(exportData, null, 2));
  } catch (error) {
    console.error("exportUserData error:", error);
    res.status(500).json({ msg: error.message, error: error.message });
  }
};

// DELETE /api/user/account - GDPR: Delete account & cascade delete all user data
export const deleteAccount = async (req, res) => {
  try {
    const userId = req.user.id;

    await Promise.all([
      Workout.deleteMany({ user: userId }),
      WorkoutSession.deleteMany({ user: userId }),
      Nutrition.deleteMany({ user: userId }),
      Progress.deleteMany({ user: userId }),
      Reminder.deleteMany({ user: userId }),
      SupportTicket.deleteMany({ user: userId }),
      User.findByIdAndDelete(userId),
    ]);

    res.status(200).json({ msg: "Account and all associated data permanently deleted." });
  } catch (error) {
    console.error("deleteAccount error:", error);
    res.status(500).json({ msg: error.message, error: error.message });
  }
};