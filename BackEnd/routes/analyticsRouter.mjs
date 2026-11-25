import express from 'express';
import {
  getOverviewAnalytics,
  getTrainingAnalytics,
  getNutritionAnalytics,
} from '../controllers/analyticsController.mjs';
import auth from '../middleware/auth.mjs';

const analyticsRouter = express.Router();

analyticsRouter.use(auth); // Protect all analytics routes

analyticsRouter.get('/overview', getOverviewAnalytics);
analyticsRouter.get('/training', getTrainingAnalytics);
analyticsRouter.get('/nutrition', getNutritionAnalytics);

export default analyticsRouter;
