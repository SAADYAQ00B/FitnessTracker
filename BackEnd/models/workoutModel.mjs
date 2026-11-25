import mongoose from "mongoose";

const { Schema } = mongoose;

const exerciseItemSchema = new Schema({
  name: { type: String, required: true },
  sets: { type: Number, default: 3 },
  reps: { type: Number, default: 10 },
  weight: { type: Number, default: 0 }, // in kg / lbs
  duration: { type: Number, default: 0 }, // in minutes or seconds
  notes: { type: String, default: "" },
}, { _id: true });

const workoutSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  title: {
    type: String,
    required: [true, "Workout routine title is required"],
    trim: true,
  },
  type: {
    type: String,
    enum: ["Strength", "Cardio", "HIIT", "Other"],
    default: "Strength",
  },
  tag: {
    type: String,
    default: "Today",
    trim: true,
  },
  duration: {
    type: Number,
    default: 45, // in minutes
  },
  meta: {
    type: String,
    default: "",
  },
  image: {
    type: String,
    default: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&q=80",
  },
  exercises: [exerciseItemSchema],
  notes: {
    type: String,
    default: "",
  },
}, { timestamps: true });

// Auto-generate meta string if empty (e.g. "6 exercises · 45 min")
workoutSchema.pre("save", function (next) {
  const count = this.exercises ? this.exercises.length : 0;
  if (!this.meta || this.meta.trim() === "") {
    this.meta = `${count} exercise${count === 1 ? "" : "s"} · ${this.duration || 45} min`;
  }
  next();
});

const Workout = mongoose.model("Workout", workoutSchema);
export default Workout;
