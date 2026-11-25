import mongoose from "mongoose";

const { Schema } = mongoose;

const nutritionSchema = new Schema({
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
  type: {
    type: String,
    enum: ["Breakfast", "Lunch", "Dinner", "Snack", "Snacks"],
    required: [true, "Meal type is required"],
  },
  food: {
    type: String,
    required: [true, "Food name is required"],
    trim: true,
  },
  quantity: {
    type: String,
    default: "1 serving",
    trim: true,
  },
  calories: {
    type: Number,
    required: [true, "Calories amount is required"],
    min: 0,
  },
  protein: {
    type: Number,
    default: 0, // in grams
    min: 0,
  },
  carbs: {
    type: Number,
    default: 0, // in grams
    min: 0,
  },
  fats: {
    type: Number,
    default: 0, // in grams
    min: 0,
  },
  notes: {
    type: String,
    default: "",
  },
}, { timestamps: true });

const Nutrition = mongoose.model("Nutrition", nutritionSchema);
export default Nutrition;
