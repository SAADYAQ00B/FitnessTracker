import express from 'express';
import {
  Signup,
  VerifySignupOTP,
  ResendOTP,
  Login,
  googleAuth,
  forgotPassword,
  resetPassword,
  getProfile,
  updateProfile,
  uploadAvatar,
  exportUserData,
  deleteAccount,
} from '../controllers/userController.mjs';
import auth from '../middleware/auth.mjs';
import { upload } from '../middleware/upload.mjs';
import { authRateLimiter } from '../middleware/security.mjs';

const userRouter = express.Router();

// Public auth routes (rate limited: 10 reqs / 15 mins)
userRouter.post('/signup', authRateLimiter, Signup);
userRouter.post('/verify-otp', authRateLimiter, VerifySignupOTP);
userRouter.post('/resend-otp', authRateLimiter, ResendOTP);
userRouter.post('/login', authRateLimiter, Login);
userRouter.post('/google-auth', authRateLimiter, googleAuth);
userRouter.post('/forgot-password', authRateLimiter, forgotPassword);
userRouter.post('/reset-password', authRateLimiter, resetPassword);

// Protected profile & user routes
userRouter.get('/profile', auth, getProfile);
userRouter.put('/profile', auth, updateProfile);
userRouter.post('/avatar', auth, upload.single('avatar'), uploadAvatar);

// GDPR Compliance routes
userRouter.get('/export-data', auth, exportUserData);
userRouter.delete('/account', auth, deleteAccount);

export default userRouter;