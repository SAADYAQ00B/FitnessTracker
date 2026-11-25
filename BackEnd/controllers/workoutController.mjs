import Workout from '../models/workoutModel.mjs';
import WorkoutSession from '../models/workoutSessionModel.mjs';
import User from '../models/userModel.mjs';
import { uploadToCloudinary } from '../middleware/upload.mjs';

// GET /api/workouts - List user's workouts with search & filter
export const getWorkouts = async (req, res) => {
  try {
    const { search, type } = req.query;
    const filter = { user: req.user.id };

    if (type && type !== 'All') {
      filter.type = type;
    }

    if (search && search.trim() !== '') {
      filter.title = { $regex: search.trim(), $options: 'i' };
    }

    const workouts = await Workout.find(filter).sort({ createdAt: -1 });
    res.status(200).json(workouts);
  } catch (error) {
    console.error("getWorkouts error:", error);
    res.status(500).json({ error: error.message });
  }
};

// GET /api/workouts/:id - Get single workout
export const getWorkoutById = async (req, res) => {
  try {
    const workout = await Workout.findOne({ _id: req.params.id, user: req.user.id });
    if (!workout) {
      return res.status(404).json({ msg: "Workout not found" });
    }
    res.status(200).json(workout);
  } catch (error) {
    console.error("getWorkoutById error:", error);
    res.status(500).json({ error: error.message });
  }
};

export const CATEGORY_IMAGES = {
  Strength: "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=800&q=80",
  Cardio: "https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=800&q=80",
  HIIT: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800&q=80",
  Other: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&q=80",
};

// POST /api/workouts - Create new workout routine
export const createWorkout = async (req, res) => {
  try {
    const { title, type, tag, duration, exercises, image, notes } = req.body;

    if (!title) {
      return res.status(400).json({ msg: "Workout title is required" });
    }

    const workoutType = type || 'Strength';
    const exerciseCount = Array.isArray(exercises) ? exercises.length : 0;
    const meta = `${exerciseCount} exercises · ${duration || 45} min`;
    const defaultImage = CATEGORY_IMAGES[workoutType] || CATEGORY_IMAGES.Strength;

    const newWorkout = new Workout({
      user: req.user.id,
      title,
      type: workoutType,
      tag: tag || 'Today',
      duration: duration ? Number(duration) : 45,
      meta,
      exercises: Array.isArray(exercises) ? exercises : [],
      image: image || defaultImage,
      notes: notes || '',
    });

    const saved = await newWorkout.save();
    res.status(201).json(saved);
  } catch (error) {
    console.error("createWorkout error:", error);
    res.status(500).json({ error: error.message });
  }
};

// PUT /api/workouts/:id - Update workout routine
export const updateWorkout = async (req, res) => {
  try {
    const { title, type, tag, duration, exercises, image, notes } = req.body;

    const workout = await Workout.findOne({ _id: req.params.id, user: req.user.id });
    if (!workout) {
      return res.status(404).json({ msg: "Workout not found" });
    }

    if (title !== undefined) workout.title = title;
    if (type !== undefined) workout.type = type;
    if (tag !== undefined) workout.tag = tag;
    if (duration !== undefined) workout.duration = Number(duration);
    if (exercises !== undefined) workout.exercises = exercises;
    if (image !== undefined) workout.image = image;
    if (notes !== undefined) workout.notes = notes;

    const count = workout.exercises ? workout.exercises.length : 0;
    workout.meta = `${count} exercises · ${workout.duration} min`;

    const updated = await workout.save();
    res.status(200).json(updated);
  } catch (error) {
    console.error("updateWorkout error:", error);
    res.status(500).json({ error: error.message });
  }
};

// DELETE /api/workouts/:id - Delete workout routine
export const deleteWorkout = async (req, res) => {
  try {
    const workout = await Workout.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!workout) {
      return res.status(404).json({ msg: "Workout not found" });
    }
    res.status(200).json({ msg: "Workout deleted successfully", id: req.params.id });
  } catch (error) {
    console.error("deleteWorkout error:", error);
    res.status(500).json({ error: error.message });
  }
};

// POST /api/workouts/:id/complete - Complete workout and log session
export const completeWorkout = async (req, res) => {
  try {
    const workout = await Workout.findOne({ _id: req.params.id, user: req.user.id });
    if (!workout) {
      return res.status(404).json({ msg: "Workout not found" });
    }

    // Calculate total lifted volume (sets * reps * weight)
    let totalVolume = 0;
    if (workout.exercises && workout.exercises.length > 0) {
      workout.exercises.forEach(ex => {
        totalVolume += (ex.sets || 3) * (ex.reps || 10) * (ex.weight || 0);
      });
    }

    const duration = workout.duration || 45;
    const stats = totalVolume > 0 
      ? `${duration} min · ${totalVolume.toLocaleString()} kg`
      : `${duration} min · Active workout`;

    // Create session record
    const session = new WorkoutSession({
      user: req.user.id,
      workout: workout._id,
      title: workout.title,
      type: workout.type,
      duration,
      volume: totalVolume,
      stats,
      date: new Date(),
    });

    await session.save();

    // Reward user with +50 XP and check level progression
    const user = await User.findById(req.user.id);
    if (user) {
      user.xp = (user.xp || 0) + 50;
      const xpForNextLevel = user.level * 200;
      if (user.xp >= xpForNextLevel) {
        user.level += 1;
      }
      await user.save();
    }

    res.status(201).json({
      msg: "Workout completed and logged successfully!",
      session,
      xpEarned: 50,
      userLevel: user ? user.level : 1,
      totalXp: user ? user.xp : 50,
    });
  } catch (error) {
    console.error("completeWorkout error:", error);
    res.status(500).json({ error: error.message });
  }
};

// GET /api/workouts/sessions - Get user's completed workout history
export const getRecentSessions = async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit) : 20;
    const sessions = await WorkoutSession.find({ user: req.user.id })
      .sort({ date: -1 })
      .limit(limit);

    // Format date nicely for display
    const formatted = sessions.map(s => {
      const d = new Date(s.date);
      const isToday = d.toDateString() === new Date().toDateString();
      const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const dateStr = isToday ? `Today, ${timeStr}` : d.toLocaleDateString([], { month: 'short', day: 'numeric' }) + `, ${timeStr}`;

      return {
        id: s._id,
        _id: s._id,
        title: s.title,
        type: s.type,
        date: dateStr,
        rawDate: s.date,
        duration: s.duration,
        volume: s.volume,
        stats: s.stats || `${s.duration} min`,
        notes: s.notes,
      };
    });

    res.status(200).json(formatted);
  } catch (error) {
    console.error("getRecentSessions error:", error);
    res.status(500).json({ error: error.message });
  }
};

// POST /api/workouts/upload-image - Upload custom workout image to Cloudinary
export const uploadWorkoutImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ msg: "No image file provided" });
    }
    const result = await uploadToCloudinary(req.file.buffer, req.file.mimetype, "fitness_tracker/workouts");
    res.status(200).json({ url: result.secure_url });
  } catch (error) {
    console.error("uploadWorkoutImage error:", error);
    res.status(500).json({ error: error.message });
  }
};
