import express from 'express';
import { exportCSV, getReportSummary } from '../controllers/reportController.mjs';
import auth from '../middleware/auth.mjs';

const reportRouter = express.Router();

reportRouter.use(auth); // Protect report routes

reportRouter.get('/csv', exportCSV);
reportRouter.get('/summary', getReportSummary);

export default reportRouter;
