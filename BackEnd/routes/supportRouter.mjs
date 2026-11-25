import express from 'express';
import { createTicket, getUserTickets } from '../controllers/supportController.mjs';
import auth from '../middleware/auth.mjs';

const supportRouter = express.Router();

supportRouter.use(auth); // Protect support routes

supportRouter.post('/ticket', createTicket);
supportRouter.get('/tickets', getUserTickets);

export default supportRouter;
