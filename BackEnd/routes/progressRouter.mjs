import express from 'express';
import {
  getProgress,
  addMeasurement,
  getProgressHistory,
  deleteMeasurement,
} from '../controllers/progressController.mjs';
import auth from '../middleware/auth.mjs';

const progressRouter = express.Router();

progressRouter.use(auth); // Protect all progress routes

progressRouter.get('/', getProgress);
progressRouter.post('/', addMeasurement);
progressRouter.get('/history', getProgressHistory);
progressRouter.delete('/:id', deleteMeasurement);

export default progressRouter;
