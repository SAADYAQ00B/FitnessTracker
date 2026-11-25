import SupportTicket from '../models/supportTicketModel.mjs';

// POST /api/support/ticket - Submit support message / feedback
export const createTicket = async (req, res) => {
  try {
    const { topic, message } = req.body;

    if (!topic || !message) {
      return res.status(400).json({ msg: "Topic and message are required." });
    }

    const ticket = new SupportTicket({
      user: req.user.id,
      topic,
      message,
    });

    const saved = await ticket.save();
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
