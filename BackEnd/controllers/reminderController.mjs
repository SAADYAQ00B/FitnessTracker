import Reminder from '../models/reminderModel.mjs';

// GET /api/reminders - List user's reminders
export const getReminders = async (req, res) => {
  try {
    const reminders = await Reminder.find({ user: req.user.id }).sort({ createdAt: -1 });

    const formatted = reminders.map(r => ({
      id: r._id,
      _id: r._id,
      title: r.title,
      schedule: r.schedule,
      type: r.type,
      active: r.active,
      createdAt: r.createdAt,
    }));

    res.status(200).json(formatted);
  } catch (error) {
    console.error("getReminders error:", error);
    res.status(500).json({ error: error.message });
  }
};

// POST /api/reminders - Create a new reminder
export const createReminder = async (req, res) => {
  try {
    const { title, schedule, type, active } = req.body;

    if (!title || !schedule) {
      return res.status(400).json({ msg: "Title and schedule are required" });
    }

    const newReminder = new Reminder({
      user: req.user.id,
      title,
      schedule,
      type: type || "workout",
      active: active !== undefined ? active : true,
    });

    const saved = await newReminder.save();
    res.status(201).json({
      id: saved._id,
      _id: saved._id,
      title: saved.title,
      schedule: saved.schedule,
      type: saved.type,
      active: saved.active,
    });
  } catch (error) {
    console.error("createReminder error:", error);
    res.status(500).json({ error: error.message });
  }
};

// PATCH /api/reminders/:id/toggle - Toggle active status
export const toggleReminder = async (req, res) => {
  try {
    const reminder = await Reminder.findOne({ _id: req.params.id, user: req.user.id });
    if (!reminder) {
      return res.status(404).json({ msg: "Reminder not found" });
    }

    if (req.body.active !== undefined) {
      reminder.active = Boolean(req.body.active);
    } else {
      reminder.active = !reminder.active;
    }

    const saved = await reminder.save();
    res.status(200).json({
      id: saved._id,
      _id: saved._id,
      title: saved.title,
      schedule: saved.schedule,
      type: saved.type,
      active: saved.active,
    });
  } catch (error) {
    console.error("toggleReminder error:", error);
    res.status(500).json({ error: error.message });
  }
};

// PUT /api/reminders/:id - Update reminder
export const updateReminder = async (req, res) => {
  try {
    const { title, schedule, type, active } = req.body;
    const reminder = await Reminder.findOne({ _id: req.params.id, user: req.user.id });
    if (!reminder) {
      return res.status(404).json({ msg: "Reminder not found" });
    }

    if (title) reminder.title = title;
    if (schedule) reminder.schedule = schedule;
    if (type) reminder.type = type;
    if (active !== undefined) reminder.active = active;

    const saved = await reminder.save();
    res.status(200).json({
      id: saved._id,
      _id: saved._id,
      title: saved.title,
      schedule: saved.schedule,
      type: saved.type,
      active: saved.active,
    });
  } catch (error) {
    console.error("updateReminder error:", error);
    res.status(500).json({ error: error.message });
  }
};

// DELETE /api/reminders/:id - Delete reminder
export const deleteReminder = async (req, res) => {
  try {
    const reminder = await Reminder.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!reminder) {
      return res.status(404).json({ msg: "Reminder not found" });
    }
    res.status(200).json({ msg: "Reminder deleted", id: req.params.id });
  } catch (error) {
    console.error("deleteReminder error:", error);
    res.status(500).json({ error: error.message });
  }
};
