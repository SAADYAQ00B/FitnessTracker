import express from 'express';
import {
  getMeals,
  addMeal,
  updateMeal,
  deleteMeal,
  getNutritionSummary,
} from '../controllers/nutritionController.mjs';
import auth from '../middleware/auth.mjs';

const nutritionRouter = express.Router();

nutritionRouter.use(auth); // Protect all nutrition routes

nutritionRouter.get('/meals', getMeals);
nutritionRouter.post('/meals', addMeal);
nutritionRouter.put('/meals/:id', updateMeal);
nutritionRouter.delete('/meals/:id', deleteMeal);
nutritionRouter.get('/summary', getNutritionSummary);

export default nutritionRouter;
