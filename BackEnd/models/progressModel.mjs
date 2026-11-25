import mongoose from "mongoose";

const { Schema } = mongoose;

const progressSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  date: {
    type: Date,
    default: Date.now,
    index: true,
  },
  weight: {
    type: Number,
    required: [true, "Weight is required"],
  },
  bodyFat: {
    type: Number, // percentage
  },
  waist: {
    type: Number, // cm or inches
  },
  chest: {
    type: Number,
  },
  arms: {
    type: Number,
  },
  benchPress: {
    type: Number, // lifting PR
  },
  squat: {
    type: Number, // lifting PR
  },
  deadlift: {
    type: Number, // lifting PR
  },
  runTime5k: {
    type: String, // e.g. "24:30" or minutes
  },
  notes: {
    type: String,
    default: "",
  },
}, { timestamps: true });

const Progress = mongoose.model("Progress", progressSchema);
export default Progress;
