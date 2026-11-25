import express from 'express';
import {
  getReminders,
  createReminder,
  toggleReminder,
  updateReminder,
  deleteReminder,
} from '../controllers/reminderController.mjs';
import auth from '../middleware/auth.mjs';

const reminderRouter = express.Router();

reminderRouter.use(auth); // Protect all reminder routes

reminderRouter.get('/', getReminders);
reminderRouter.post('/', createReminder);
reminderRouter.patch('/:id/toggle', toggleReminder);
reminderRouter.patch('/:id', toggleReminder);
reminderRouter.put('/:id', updateReminder);
reminderRouter.delete('/:id', deleteReminder);

export default reminderRouter;
