import mongoose from "mongoose";

const { Schema } = mongoose;

const userSchema = new Schema({
  name: { type: String, required: [true, "Name is Required"] },
  email: {
    type: String,
    match: [/.+\@.+\..+/, "Please fill a valid email address"],
    required: [true, "Email is Required"],
    unique: true,
  },
  password: { type: String, required: [true, "Password is Required"] },
  avatar: { type: String, default: "" },
  location: { type: String, default: "Unknown" },
  bio: { type: String, default: "Fitness Enthusiast" },
  level: { type: Number, default: 1 },
  xp: { type: Number, default: 0 },
  units: { type: String, enum: ["Metric", "Imperial"], default: "Metric" },
  themePreset: { type: String, enum: ["fitness1", "fitness2"], default: "fitness1" },
  themeMode: { type: String, enum: ["dark", "light"], default: "dark" },
  notificationPrefs: {
    workoutReminders: { type: Boolean, default: true },
    goalAchievements: { type: Boolean, default: true },
    weeklyReport: { type: Boolean, default: false },
    communityUpdates: { type: Boolean, default: true },
  },
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date },
  isVerified: { type: Boolean, default: false },
  otpCode: { type: String },
  otpExpires: { type: Date },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

const User = mongoose.model("User", userSchema);
export default User;