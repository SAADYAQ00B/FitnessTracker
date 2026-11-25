import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import { generalApiLimiter } from './middleware/security.mjs';

// Import Route Handlers
import userRouter from './routes/userRouter.mjs';
import workoutRouter from './routes/workoutRouter.mjs';
import nutritionRouter from './routes/nutritionRouter.mjs';
import progressRouter from './routes/progressRouter.mjs';
import analyticsRouter from './routes/analyticsRouter.mjs';
import reminderRouter from './routes/reminderRouter.mjs';
import supportRouter from './routes/supportRouter.mjs';
import reportRouter from './routes/reportRouter.mjs';

const app = express();
const port = process.env.PORT || 5000;
const dbUrl = process.env.Db_url || process.env.DB_URL || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/fitnesstrack';

// Trust reverse proxies (needed for rate limiters behind proxy/load balancers on Vercel)
app.set('trust proxy', 1);

// Security Headers with Helmet
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Allowed Origins Configuration
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'capacitor://localhost',
  'http://localhost',
  'https://localhost',
  'ionic://localhost',
].filter(Boolean);

// CORS configuration supporting dynamic *.vercel.app & *.netlify.app preview & production domains
const corsOptions = {
  origin: (origin, callback) => {
    // Allow non-browser requests (mobile apps, Postman, server-to-server) with no origin header
    if (!origin) return callback(null, true);

    let originHostname = '';
    try {
      originHostname = new URL(origin).hostname;
    } catch {
      originHostname = origin;
    }

    const isVercelOrNetlify = 
      originHostname.endsWith('.vercel.app') || 
      originHostname === 'vercel.app' ||
      originHostname.endsWith('.netlify.app') || 
      originHostname === 'netlify.app';

    const isExplicitlyAllowed = allowedOrigins.some(allowed => 
      origin === allowed || origin.startsWith(allowed)
    );

    if (isExplicitlyAllowed || isVercelOrNetlify) {
      return callback(null, true);
    }
    return callback(new Error(`Origin ${origin} not allowed by CORS policy`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
};

app.use(cors(corsOptions));

// Body Parsing Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Anti-NoSQL Injection Data Sanitization
app.use(mongoSanitize());

// General API Rate Limiting (200 requests per 15 minutes per IP)
app.use('/api/', generalApiLimiter);

// Database connection caching for Serverless environments & local dev
let cachedDbPromise = null;

async function connectDB() {
  if (mongoose.connection.readyState === 1) {
    return;
  }
  if (!cachedDbPromise) {
    cachedDbPromise = mongoose.connect(dbUrl).then(() => {
      console.log("Connected to MongoDB successfully!");
    }).catch((err) => {
      cachedDbPromise = null;
      throw err;
    });
  }
  await cachedDbPromise;
}

// Initial connection attempt on cold start / local startup
connectDB().catch(err => console.error("Database connection error:", err.message));

// Health Check Endpoint
app.get('/', (req, res) => res.send('Fitness App Backend Running!'));

// Async DB connection middleware before /api routes to prevent timeouts & pool exhaustion
app.use('/api', async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error("Database connection middleware error:", err.message);
    res.status(500).json({ error: "Database connection failed" });
  }
});

// API Routes
app.use('/api/user', userRouter);
app.use('/api/workouts', workoutRouter);
app.use('/api/nutrition', nutritionRouter);
app.use('/api/progress', progressRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/reminders', reminderRouter);
app.use('/api/support', supportRouter);
app.use('/api/reports', reportRouter);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error("Unhandled Error:", err);
  res.status(err.status || 500).json({
    error: err.message || "Internal Server Error",
  });
});

// Only listen when running locally (not in Vercel serverless environment)
if (!process.env.VERCEL) {
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
}

export default app;
