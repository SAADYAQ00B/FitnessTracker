import mongoose from "mongoose";

const { Schema } = mongoose;

const reminderSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  title: {
    type: String,
    required: [true, "Reminder title is required"],
    trim: true,
  },
  schedule: {
    type: String,
    required: [true, "Schedule description is required"],
    trim: true,
  },
  type: {
    type: String,
    enum: ["workout", "meal", "goal", "general"],
    default: "workout",
  },
  active: {
    type: Boolean,
    default: true,
  },
  isAlarm: {
    type: Boolean,
    default: false,
  },
}, { timestamps: true });

const Reminder = mongoose.model("Reminder", reminderSchema);
export default Reminder;
