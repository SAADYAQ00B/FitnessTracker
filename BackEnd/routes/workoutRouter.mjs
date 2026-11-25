import express from 'express';
import {
  getWorkouts,
  getWorkoutById,
  createWorkout,
  updateWorkout,
  deleteWorkout,
  completeWorkout,
  getRecentSessions,
  uploadWorkoutImage,
} from '../controllers/workoutController.mjs';
import auth from '../middleware/auth.mjs';
import { upload } from '../middleware/upload.mjs';

const workoutRouter = express.Router();

workoutRouter.use(auth); // Protect all workout routes

workoutRouter.get('/', getWorkouts);
workoutRouter.post('/', createWorkout);
workoutRouter.get('/sessions', getRecentSessions);
workoutRouter.post('/upload-image', upload.single('image'), uploadWorkoutImage);
workoutRouter.get('/:id', getWorkoutById);
workoutRouter.put('/:id', updateWorkout);
workoutRouter.delete('/:id', deleteWorkout);
workoutRouter.post('/:id/complete', completeWorkout);

export default workoutRouter;
