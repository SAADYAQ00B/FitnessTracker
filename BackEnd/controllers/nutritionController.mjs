import Nutrition from '../models/nutritionModel.mjs';

// GET /api/nutrition/meals - Get user's logged meals (supports date query)
export const getMeals = async (req, res) => {
  try {
    const { date } = req.query;
    const filter = { user: req.user.id };

    if (date) {
      // Filter for the specific calendar day in UTC / local
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      filter.date = { $gte: startOfDay, $lte: endOfDay };
    }

    const meals = await Nutrition.find(filter).sort({ createdAt: -1 });

    const formatted = meals.map(m => ({
      id: m._id,
      _id: m._id,
      type: m.type,
      food: m.food,
      quantity: m.quantity || "1 serving",
      calories: m.calories,
      protein: `${m.protein || 0}g`,
      proteinGrams: m.protein || 0,
      carbs: `${m.carbs || 0}g`,
      carbsGrams: m.carbs || 0,
      fats: `${m.fats || 0}g`,
      fatsGrams: m.fats || 0,
      date: m.date,
      notes: m.notes,
    }));

    res.status(200).json(formatted);
  } catch (error) {
    console.error("getMeals error:", error);
    res.status(500).json({ error: error.message });
  }
};

// POST /api/nutrition/meals - Add new meal entry
export const addMeal = async (req, res) => {
  try {
    const { type, food, quantity, calories, protein, carbs, fats, date, notes } = req.body;

    if (!type || !food || calories === undefined || calories === null) {
      return res.status(400).json({ msg: "Meal type, food name, and calories are required." });
    }

    const mealDate = date ? new Date(date) : new Date();

    const newMeal = new Nutrition({
      user: req.user.id,
      date: mealDate,
      type,
      food,
      quantity: quantity || "1 serving",
      calories: Number(calories),
      protein: protein !== undefined ? Number(protein) : 0,
      carbs: carbs !== undefined ? Number(carbs) : 0,
      fats: fats !== undefined ? Number(fats) : 0,
      notes: notes || "",
    });

    const saved = await newMeal.save();

    res.status(201).json({
      id: saved._id,
      _id: saved._id,
      type: saved.type,
      food: saved.food,
      quantity: saved.quantity,
      calories: saved.calories,
      protein: `${saved.protein}g`,
      proteinGrams: saved.protein,
      carbs: `${saved.carbs}g`,
      carbsGrams: saved.carbs,
      fats: `${saved.fats}g`,
      fatsGrams: saved.fats,
      date: saved.date,
      notes: saved.notes,
    });
  } catch (error) {
    console.error("addMeal error:", error);
    res.status(500).json({ error: error.message });
  }
};

// PUT /api/nutrition/meals/:id - Update meal entry
export const updateMeal = async (req, res) => {
  try {
    const meal = await Nutrition.findOne({ _id: req.params.id, user: req.user.id });
    if (!meal) {
      return res.status(404).json({ msg: "Meal not found" });
    }

    const { type, food, quantity, calories, protein, carbs, fats, notes, date } = req.body;
    if (type) meal.type = type;
    if (food) meal.food = food;
    if (quantity !== undefined) meal.quantity = quantity;
    if (calories !== undefined) meal.calories = Number(calories);
    if (protein !== undefined) meal.protein = Number(protein);
    if (carbs !== undefined) meal.carbs = Number(carbs);
    if (fats !== undefined) meal.fats = Number(fats);
    if (notes !== undefined) meal.notes = notes;
    if (date) meal.date = new Date(date);

    const saved = await meal.save();
    res.status(200).json({
      id: saved._id,
      _id: saved._id,
      type: saved.type,
      food: saved.food,
      quantity: saved.quantity,
      calories: saved.calories,
      protein: `${saved.protein}g`,
      carbs: `${saved.carbs}g`,
      fats: `${saved.fats}g`,
      date: saved.date,
    });
  } catch (error) {
    console.error("updateMeal error:", error);
    res.status(500).json({ error: error.message });
  }
};

// DELETE /api/nutrition/meals/:id - Delete meal entry
export const deleteMeal = async (req, res) => {
  try {
    const meal = await Nutrition.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!meal) {
      return res.status(404).json({ msg: "Meal not found" });
    }
    res.status(200).json({ msg: "Meal removed successfully", id: req.params.id });
  } catch (error) {
    console.error("deleteMeal error:", error);
    res.status(500).json({ error: error.message });
  }
};

// GET /api/nutrition/summary - Get summary metrics for calories and macros
export const getNutritionSummary = async (req, res) => {
  try {
    const { date } = req.query;
    const filter = { user: req.user.id };

    const targetDate = date ? new Date(date) : new Date();
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    filter.date = { $gte: startOfDay, $lte: endOfDay };

    const dayMeals = await Nutrition.find(filter);

    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFats = 0;

    dayMeals.forEach(m => {
      totalCalories += m.calories || 0;
      totalProtein += m.protein || 0;
      totalCarbs += m.carbs || 0;
      totalFats += m.fats || 0;
    });

    const dailyCalorieGoal = 2200;
    const dailyProteinGoal = 140; // in grams
    const dailyCarbsGoal = 220; // in grams
    const dailyFatsGoal = 70; // in grams

    const percentage = Math.min(Math.round((totalCalories / dailyCalorieGoal) * 100), 100);

    res.status(200).json({
      date: targetDate.toISOString().split('T')[0],
      totalCalories,
      totalProtein,
      totalCarbs,
      totalFats,
      dailyCalorieGoal,
      dailyProteinGoal,
      dailyCarbsGoal,
      dailyFatsGoal,
      percentage,
      mealsCount: dayMeals.length,
    });
  } catch (error) {
    console.error("getNutritionSummary error:", error);
    res.status(500).json({ error: error.message });
  }
};
