import express from 'express';
import {
  getPlatformStats,
  getAllUsers,
  toggleUserRole,
  deleteUserAdmin,
  getAdminTickets,
  updateTicketAdmin,
} from '../controllers/adminController.mjs';
import auth, { verifyAdmin } from '../middleware/auth.mjs';

const adminRouter = express.Router();

// All admin routes strictly require valid authentication and admin role
adminRouter.use(auth);
adminRouter.use(verifyAdmin);

adminRouter.get('/stats', getPlatformStats);
adminRouter.get('/users', getAllUsers);
adminRouter.patch('/users/:id/role', toggleUserRole);
adminRouter.delete('/users/:id', deleteUserAdmin);
adminRouter.get('/tickets', getAdminTickets);
adminRouter.patch('/tickets/:id', updateTicketAdmin);

export default adminRouter;
