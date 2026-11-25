import mongoose from "mongoose";

const { Schema } = mongoose;

const workoutSessionSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  workout: {
    type: Schema.Types.ObjectId,
    ref: "Workout",
  },
  title: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    default: "Strength",
  },
  duration: {
    type: Number,
    default: 45, // in minutes
  },
  volume: {
    type: Number,
    default: 0, // total kg / lbs
  },
  stats: {
    type: String,
    default: "",
  },
  date: {
    type: Date,
    default: Date.now,
  },
  notes: {
    type: String,
    default: "",
  },
}, { timestamps: true });

const WorkoutSession = mongoose.model("WorkoutSession", workoutSessionSchema);
export default WorkoutSession;
