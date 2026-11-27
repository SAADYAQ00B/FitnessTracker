import User from '../models/userModel.mjs';
import Workout from '../models/workoutModel.mjs';
import WorkoutSession from '../models/workoutSessionModel.mjs';
import Nutrition from '../models/nutritionModel.mjs';
import Progress from '../models/progressModel.mjs';
import Reminder from '../models/reminderModel.mjs';
import SupportTicket from '../models/supportTicketModel.mjs';
import nodemailer from 'nodemailer';

/**
 * GET /api/admin/stats
 * Overview counts for users, verified users, workouts, sessions, meals, and tickets.
 */
export const getPlatformStats = async (req, res) => {
  try {
    const [
      totalUsers,
      verifiedUsers,
      totalWorkouts,
      totalSessions,
      totalNutritionLogs,
      openTickets,
      resolvedTickets,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isVerified: true }),
      Workout.countDocuments(),
      WorkoutSession.countDocuments(),
      Nutrition.countDocuments(),
      SupportTicket.countDocuments({ status: 'open' }),
      SupportTicket.countDocuments({ status: 'resolved' }),
    ]);

    res.status(200).json({
      totalUsers,
      verifiedUsers,
      totalWorkouts,
      totalSessions,
      totalNutritionLogs,
      openTickets,
      resolvedTickets,
      totalTickets: openTickets + resolvedTickets,
    });
  } catch (error) {
    console.error("Admin stats error:", error);
    res.status(500).json({ msg: "Failed to fetch platform statistics", error: error.message });
  }
};

/**
 * GET /api/admin/users
 * Returns list of registered users with search support.
 */
export const getAllUsers = async (req, res) => {
  try {
    const search = req.query.search || req.query.q || '';
    const query = {};

    if (search.trim()) {
      query.$or = [
        { name: { $regex: search.trim(), $options: 'i' } },
        { email: { $regex: search.trim(), $options: 'i' } },
      ];
    }

    const users = await User.find(query)
      .select('-password -otpCode -otpExpires -resetPasswordToken -resetPasswordExpires')
      .sort({ createdAt: -1 });

    res.status(200).json({ users, total: users.length });
  } catch (error) {
    console.error("Admin get users error:", error);
    res.status(500).json({ msg: "Failed to fetch users", error: error.message });
  }
};

/**
 * PATCH /api/admin/users/:id/role
 * Toggles or updates user role between 'user' and 'admin'.
 */
export const toggleUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const targetRole = req.body.role;

    if (req.user.id === id && targetRole === 'user') {
      return res.status(400).json({ msg: "You cannot demote your own admin account." });
    }

    const user = await User.findById(id).select('-password');
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    const newRole = targetRole || (user.role === 'admin' ? 'user' : 'admin');
    user.role = newRole;
    await user.save();

    res.status(200).json({
      msg: `User role successfully updated to ${newRole}`,
      user,
    });
  } catch (error) {
    console.error("Admin toggle role error:", error);
    res.status(500).json({ msg: "Failed to update user role", error: error.message });
  }
};

/**
 * DELETE /api/admin/users/:id
 * Permanently removes user and all cascaded fitness data.
 */
export const deleteUserAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    if (req.user.id === id) {
      return res.status(400).json({ msg: "You cannot delete your own admin account." });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    // Cascade delete across all collections
    await Promise.all([
      Workout.deleteMany({ user: id }),
      WorkoutSession.deleteMany({ user: id }),
      Nutrition.deleteMany({ user: id }),
      Progress.deleteMany({ user: id }),
      Reminder.deleteMany({ user: id }),
      SupportTicket.deleteMany({ user: id }),
      User.findByIdAndDelete(id),
    ]);

    res.status(200).json({ msg: `User ${user.email} and all associated records deleted permanently.` });
  } catch (error) {
    console.error("Admin delete user error:", error);
    res.status(500).json({ msg: "Failed to delete user", error: error.message });
  }
};

/**
 * GET /api/admin/tickets
 * Lists all support tickets populated with user name, email, and avatar.
 */
export const getAdminTickets = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = {};
    if (status && (status === 'open' || status === 'resolved')) {
      filter.status = status;
    }

    const tickets = await SupportTicket.find(filter)
      .populate('user', 'name email avatar')
      .sort({ createdAt: -1 });

    res.status(200).json({ tickets });
  } catch (error) {
    console.error("Admin get tickets error:", error);
    res.status(500).json({ msg: "Failed to fetch tickets", error: error.message });
  }
};

/**
 * PATCH /api/admin/tickets/:id
 * Updates ticket status ('open' / 'resolved') and sends optional Nodemailer reply.
 */
export const updateTicketAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reply } = req.body;

    const ticket = await SupportTicket.findById(id).populate('user', 'name email');
    if (!ticket) {
      return res.status(404).json({ msg: "Ticket not found" });
    }

    if (status && ['open', 'in-progress', 'resolved'].includes(status)) {
      ticket.status = status;
    }

    if (reply && reply.trim()) {
      ticket.adminReply = reply.trim();
      ticket.repliedAt = new Date();

      // Send email notification to user via Nodemailer
      const recipientEmail = ticket.user?.email;
      const adminEmail = process.env.EMAIL_USER || process.env.SMTP_USER;
      const emailPass = process.env.EMAIL_PASS || process.env.SMTP_PASS;
      const host = process.env.SMTP_HOST;
      const port = process.env.SMTP_PORT || 587;

      if (recipientEmail && adminEmail && emailPass) {
        try {
          const transporter = host
            ? nodemailer.createTransport({
                host,
                port: Number(port),
                secure: Number(port) === 465,
                auth: { user: adminEmail, pass: emailPass },
              })
            : nodemailer.createTransport({
                service: "gmail",
                auth: { user: adminEmail, pass: emailPass },
              });

          await transporter.sendMail({
            from: `"FITNESSTRACKER Support" <${adminEmail}>`,
            to: recipientEmail,
            subject: `Update on your support ticket: ${ticket.topic}`,
            html: `
              <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 550px; padding: 24px; border: 1px solid #e2e8f0; border-radius: 14px; background: #ffffff; color: #1e293b;">
                <h3 style="color: #059669; margin-top: 0;">Support Ticket Update</h3>
                <p>Hi <strong>${ticket.user?.name || "there"}</strong>,</p>
                <p>An administrator has responded to your inquiry regarding <strong>"${ticket.topic}"</strong>:</p>
                <div style="background: #f8fafc; border-left: 4px solid #10b981; padding: 14px 18px; margin: 18px 0; border-radius: 6px; font-size: 14px; color: #334155; line-height: 1.6;">
                  ${reply.trim().replace(/\n/g, '<br/>')}
                </div>
                <p style="font-size: 13px; color: #64748b;">Status: <strong>${ticket.status.toUpperCase()}</strong></p>
                <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
                <p style="font-size: 11px; color: #94a3b8; text-align: center; margin: 0;">FITNESSTRACKER Support Team</p>
              </div>
            `,
          });
        } catch (mailErr) {
          console.warn("Could not send admin reply email:", mailErr.message);
        }
      }
    }

    await ticket.save();

    res.status(200).json({
      msg: "Ticket updated successfully",
      ticket,
    });
  } catch (error) {
    console.error("Admin update ticket error:", error);
    res.status(500).json({ msg: "Failed to update ticket", error: error.message });
  }
};
