import nodemailer from 'nodemailer';
import SupportTicket from '../models/supportTicketModel.mjs';
import User from '../models/userModel.mjs';

// POST /api/support/ticket - Submit support message / feedback & notify admin via email
export const createTicket = async (req, res) => {
  try {
    const topic = req.body.topic || req.body.subject || req.body.category;
    const message = req.body.message || req.body.body;

    if (!topic || !message) {
      return res.status(400).json({ msg: "Topic and message are required." });
    }

    const ticket = new SupportTicket({
      user: req.user?.id,
      topic,
      message,
    });

    const saved = await ticket.save();

    // Fetch user details for notification
    let userName = req.body.name || "Valued User";
    let userEmail = req.body.email || req.user?.email || "";

    if (req.user?.id) {
      try {
        const userDoc = await User.findById(req.user.id).select('name email');
        if (userDoc) {
          if (userDoc.name && !req.body.name) userName = userDoc.name;
          if (userDoc.email && !req.body.email) userEmail = userDoc.email;
        }
      } catch (userErr) {
        console.warn("Could not retrieve user info for support notification:", userErr.message);
      }
    }

    // Send email notification via Nodemailer to process.env.EMAIL_USER
    const adminEmail = process.env.EMAIL_USER || process.env.SMTP_USER;
    const emailPass = process.env.EMAIL_PASS || process.env.SMTP_PASS;
    const host = process.env.SMTP_HOST;
    const port = process.env.SMTP_PORT || 587;

    if (adminEmail && emailPass) {
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
          to: adminEmail,
          replyTo: userEmail || adminEmail,
          subject: `[FITNESSTRACKER Support] ${topic} - From ${userName}`,
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff; color: #1e293b;">
              <h2 style="color: #08a978; margin-top: 0; font-size: 20px; border-bottom: 2px solid #e2e8f0; padding-bottom: 12px;">
                📩 New Help Center Support Inquiry
              </h2>
              <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 14px;">
                <tr>
                  <td style="padding: 6px 0; color: #64748b; width: 140px; font-weight: 600;">User Name:</td>
                  <td style="padding: 6px 0; font-weight: 700; color: #0f172a;">${userName}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #64748b; font-weight: 600;">User Email:</td>
                  <td style="padding: 6px 0; font-weight: 700; color: #08a978;">
                    <a href="mailto:${userEmail}" style="color: #08a978; text-decoration: none;">${userEmail}</a>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Subject / Category:</td>
                  <td style="padding: 6px 0; font-weight: 700; color: #0f172a;">${topic}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Ticket ID:</td>
                  <td style="padding: 6px 0; font-family: monospace; color: #64748b;">${saved._id}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Date & Time:</td>
                  <td style="padding: 6px 0; color: #64748b;">${new Date().toLocaleString()}</td>
                </tr>
              </table>
              <div style="background: #f8fafc; border-left: 4px solid #16d9a0; padding: 16px; border-radius: 6px; margin-bottom: 20px;">
                <p style="margin: 0 0 8px 0; font-weight: 700; color: #334155; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Message Body:</p>
                <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #1e293b; white-space: pre-wrap;">${message}</p>
              </div>
              <p style="font-size: 12px; color: #94a3b8; margin: 0;">
                💡 <em>Tip: You can hit <strong>Reply</strong> directly in Gmail to respond back to <strong>${userEmail}</strong>.</em>
              </p>
            </div>
          `,
        });
      } catch (mailError) {
        console.error("Nodemailer support notification error:", mailError.message);
      }
    }

    res.status(201).json({
      msg: "Support ticket received. We will get back to you shortly.",
      ticket: saved,
    });
  } catch (error) {
    console.error("createTicket error:", error);
    res.status(500).json({ error: error.message });
  }
};

// GET /api/support/tickets - View user's submitted tickets
export const getUserTickets = async (req, res) => {
  try {
    const tickets = await SupportTicket.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.status(200).json(tickets);
  } catch (error) {
    console.error("getUserTickets error:", error);
    res.status(500).json({ error: error.message });
  }
};
