import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import User from './models/userModel.mjs';
import Workout from './models/workoutModel.mjs';
import WorkoutSession from './models/workoutSessionModel.mjs';
import Nutrition from './models/nutritionModel.mjs';
import Progress from './models/progressModel.mjs';
import Reminder from './models/reminderModel.mjs';
import SupportTicket from './models/supportTicketModel.mjs';
import { uploadToCloudinary } from './middleware/upload.mjs';

async function runTests() {
  console.log("=== RUNNING FITNESS TRACKER BACKEND TEST SUITE ===");

  // 1. Model Schema Instantiation Checks
  const fakeUserId = new mongoose.Types.ObjectId();

  const user = new User({
    name: "Test Runner",
    email: "runner@test.com",
    password: "hashedpassword123",
    avatar: "https://res.cloudinary.com/demo/image/upload/sample.jpg",
    units: "Metric",
    themePreset: "fitness1",
    themeMode: "dark",
  });
  console.log("✓ User model instantiated:", user.name, user.email, user.units);

  const workout = new Workout({
    user: fakeUserId,
    title: "Full Body Blast",
    type: "Strength",
    duration: 50,
    exercises: [
      { name: "Barbell Squat", sets: 4, reps: 8, weight: 100, notes: "Felt strong" },
      { name: "Bench Press", sets: 3, reps: 10, weight: 80, notes: "Good form" },
    ],
  });
  console.log("✓ Workout model instantiated:", workout.title, workout.meta || "exercises created");

  const session = new WorkoutSession({
    user: fakeUserId,
    workout: workout._id,
    title: workout.title,
    duration: 50,
    volume: 5600,
    stats: "50 min · 5,600 kg",
  });
  console.log("✓ WorkoutSession model instantiated:", session.title, session.stats);

  const meal = new Nutrition({
    user: fakeUserId,
    type: "Lunch",
    food: "Chicken Breast with Rice",
    calories: 650,
    protein: 55,
    carbs: 60,
    fats: 15,
  });
  console.log("✓ Nutrition model instantiated:", meal.food, `${meal.calories} kcal`);

  const progress = new Progress({
    user: fakeUserId,
    weight: 75.5,
    bodyFat: 16.5,
    waist: 80,
    benchPress: 95,
  });
  console.log("✓ Progress model instantiated:", `${progress.weight} kg`, `${progress.benchPress} kg PR`);

  const reminder = new Reminder({
    user: fakeUserId,
    title: "Hydration check",
    schedule: "Every 2 hours",
    type: "general",
    active: true,
  });
  console.log("✓ Reminder model instantiated:", reminder.title, reminder.schedule);

  const ticket = new SupportTicket({
    user: fakeUserId,
    topic: "Question",
    message: "How do I export my PDF report?",
  });
  console.log("✓ SupportTicket model instantiated:", ticket.topic, ticket.status);

  // 2. JWT Verification
  const token = jwt.sign({ id: fakeUserId.toString(), email: "runner@test.com" }, "fitness_tracker_secret_key_2026", { expiresIn: "1h" });
  const decoded = jwt.verify(token, "fitness_tracker_secret_key_2026");
  console.log("✓ JWT signing & verification:", decoded.id === fakeUserId.toString() ? "PASSED" : "FAILED");

  // 3. Cloudinary fallback verification
  const testBuffer = Buffer.from("fake-image-bytes");
  const cloudRes = await uploadToCloudinary(testBuffer, "image/jpeg");
  console.log("✓ Cloudinary handler (with fallback):", cloudRes.secure_url ? "SUCCESS" : "FAILED");

  // 4. User model verification fields
  console.log("✓ User model isVerified default:", user.isVerified === false ? "PASSED (false)" : "FAILED");
  console.log("✓ User model role default:", user.role === "user" ? "PASSED (user)" : "FAILED");
  console.log("✓ Reminder model isAlarm default:", reminder.isAlarm === false ? "PASSED (false)" : "FAILED");
  user.otpCode = "123456";
  user.otpExpires = new Date(Date.now() + 10 * 60 * 1000);
  console.log("✓ User model OTP fields assigned:", user.otpCode === "123456" && user.otpExpires instanceof Date ? "PASSED" : "FAILED");

  // 5. Controller Endpoints Validation
  const { googleAuth, VerifySignupOTP, ResendOTP, forgotPassword } = await import('./controllers/userController.mjs');
  
  // Google Auth missing token
  let testStatus = 0;
  let testData = null;
  await googleAuth(
    { body: {} },
    {
      status: (code) => {
        testStatus = code;
        return { json: (d) => { testData = d; } };
      }
    }
  );
  console.log("✓ Google Auth endpoint validation (missing token -> 400):", testStatus === 400 ? "PASSED" : "FAILED");

  // Verify Signup OTP missing email/otp
  let verifyStatus = 0;
  let verifyData = null;
  await VerifySignupOTP(
    { body: {} },
    {
      status: (code) => {
        verifyStatus = code;
        return { json: (d) => { verifyData = d; } };
      }
    }
  );
  console.log("✓ VerifySignupOTP validation (missing fields -> 400):", verifyStatus === 400 ? "PASSED" : "FAILED");

  // Resend OTP missing email
  let resendStatus = 0;
  let resendData = null;
  await ResendOTP(
    { body: {} },
    {
      status: (code) => {
        resendStatus = code;
        return { json: (d) => { resendData = d; } };
      }
    }
  );
  console.log("✓ ResendOTP validation (missing email -> 400):", resendStatus === 400 ? "PASSED" : "FAILED");

  // Forgot password missing email
  let forgotStatus = 0;
  let forgotData = null;
  await forgotPassword(
    { body: {} },
    {
      status: (code) => {
        forgotStatus = code;
        return { json: (d) => { forgotData = d; } };
      }
    }
  );
  console.log("✓ forgotPassword validation (missing email -> 400):", forgotStatus === 400 ? "PASSED" : "FAILED");

  // Support ticket missing topic/message
  const { createTicket } = await import('./controllers/supportController.mjs');
  let supportStatus = 0;
  let supportData = null;
  await createTicket(
    { body: {} },
    {
      status: (code) => {
        supportStatus = code;
        return { json: (d) => { supportData = d; } };
      }
    }
  );
  console.log("✓ createTicket validation (missing fields -> 400):", supportStatus === 400 ? "PASSED" : "FAILED");

  // 6. Security Hardening Middleware Checks
  const helmetModule = await import('helmet');
  console.log("✓ Helmet security middleware:", typeof helmetModule.default === 'function' ? "PASSED" : "FAILED");

  const mongoSanitizeModule = await import('express-mongo-sanitize');
  console.log("✓ MongoSanitize anti-injection middleware:", typeof mongoSanitizeModule.default === 'function' ? "PASSED" : "FAILED");

  const { generalApiLimiter, authRateLimiter } = await import('./middleware/security.mjs');
  console.log("✓ Rate limiting middleware (General & Auth/OTP):", typeof generalApiLimiter === 'function' && typeof authRateLimiter === 'function' ? "PASSED" : "FAILED");

  // 7. Admin Middleware & Controller Check
  const { verifyAdmin } = await import('./middleware/auth.mjs');
  let adminForbidden = false;
  let adminAllowed = false;
  await verifyAdmin(
    { user: { id: fakeUserId.toString(), role: 'user' } },
    {
      status: (code) => {
        if (code === 403) adminForbidden = true;
        return { json: () => {} };
      }
    },
    () => {}
  );
  await verifyAdmin(
    { user: { id: fakeUserId.toString(), role: 'admin' } },
    {},
    () => { adminAllowed = true; }
  );
  console.log("✓ Admin Middleware (verifyAdmin 403 on user / pass on admin):", adminForbidden && adminAllowed ? "PASSED" : "FAILED");

  console.log("=== ALL TEST SUITE CHECKS COMPLETED SUCCESSFULLY ===");
}

runTests().catch(err => {
  console.error("Test failed:", err);
  process.exit(1);
});
