import Workout from '../models/workoutModel.mjs';
import WorkoutSession from '../models/workoutSessionModel.mjs';
import Nutrition from '../models/nutritionModel.mjs';
import Progress from '../models/progressModel.mjs';

// GET /api/analytics/overview - Aggregated metrics for Dashboard Overview
export const getOverviewAnalytics = async (req, res) => {
  try {
    const userId = req.user.id;

    // Start of current week (Monday)
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 is Sunday
    const distanceToMonday = (dayOfWeek + 6) % 7;
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - distanceToMonday);
    startOfWeek.setHours(0, 0, 0, 0);

    // Start of today
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);

    const [todaySessions, weekSessions, todayNutrition, latestProgress, upNextRoutine] = await Promise.all([
      WorkoutSession.find({ user: userId, date: { $gte: startOfToday } }),
      WorkoutSession.find({ user: userId, date: { $gte: startOfWeek } }),
      Nutrition.find({ user: userId, date: { $gte: startOfToday } }),
      Progress.findOne({ user: userId }).sort({ date: -1 }),
      Workout.findOne({ user: userId }).sort({ createdAt: -1 }),
    ]);

    // Calculate active time today
    const activeMinutes = todaySessions.reduce((acc, s) => acc + (s.duration || 0), 0);

    // Calculate calories burned (approx 8.5 kcal per workout minute + base active)
    const caloriesBurned = activeMinutes > 0 ? Math.round(activeMinutes * 9.5) : 0;

    // Calculate estimated steps from active minutes
    const steps = activeMinutes > 0 ? Math.round(activeMinutes * 110) : 0;

    // Current weight
    const currentWeight = latestProgress ? latestProgress.weight : 0;

    // Weekly workouts
    const weeklyCompleted = weekSessions.length;
    const weeklyTarget = 5;

    // Activity score: between 0 and 100 based on weekly activity and consistency
    let activityScore = 0;
    if (weeklyCompleted > 0 || activeMinutes > 0) {
      activityScore = Math.min(100, Math.round((weeklyCompleted / weeklyTarget) * 60 + (activeMinutes > 0 ? 30 : 0) + 10));
    }

    res.status(200).json({
      activityScore,
      caloriesBurned,
      activeMinutes,
      steps,
      currentWeight,
      weeklyCompleted,
      weeklyTarget,
      weeklyFraction: `${weeklyCompleted}/${weeklyTarget}`,
      weeklyPercent: `${Math.min(Math.round((weeklyCompleted / weeklyTarget) * 100), 100)}%`,
      upNext: upNextRoutine ? {
        id: upNextRoutine._id,
        title: upNextRoutine.title,
        type: upNextRoutine.type,
        meta: upNextRoutine.meta || `${upNextRoutine.duration} min`,
        tag: upNextRoutine.tag || "Today",
        image: upNextRoutine.image,
      } : null,
      hasActivity: weeklyCompleted > 0 || activeMinutes > 0 || todayNutrition.length > 0 || Boolean(latestProgress),
    });
  } catch (error) {
    console.error("getOverviewAnalytics error:", error);
    res.status(500).json({ error: error.message });
  }
};

// GET /api/analytics/training - Training metrics and charts
export const getTrainingAnalytics = async (req, res) => {
  try {
    const userId = req.user.id;
    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(now.getDate() - 30);

    const sessions = await WorkoutSession.find({
      user: userId,
      date: { $gte: thirtyDaysAgo },
    }).sort({ date: 1 });

    const totalVolume = sessions.reduce((acc, s) => acc + (s.volume || 0), 0);
    const avgDuration = sessions.length > 0
      ? Math.round(sessions.reduce((acc, s) => acc + (s.duration || 0), 0) / sessions.length)
      : 0;

    const workoutFrequency = (sessions.length / 4.2).toFixed(1);

    // Group sessions by day of week for bar chart
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const frequencyByDay = { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 };

    sessions.forEach(s => {
      const dayName = days[new Date(s.date).getDay()];
      if (frequencyByDay[dayName] !== undefined) {
        frequencyByDay[dayName] += 1;
      }
    });

    const frequencyChartData = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(d => ({
      day: d,
      count: frequencyByDay[d],
    }));

    // Volume progression points
    const volumeChartData = sessions.slice(-10).map(s => ({
      date: new Date(s.date).toLocaleDateString([], { month: "short", day: "numeric" }),
      volume: s.volume || 0,
      title: s.title,
    }));

    res.status(200).json({
      frequency: workoutFrequency,
      totalVolume: totalVolume > 1000 ? `${(totalVolume / 1000).toFixed(1)}k` : totalVolume.toString(),
      totalVolumeRaw: totalVolume,
      avgDuration,
      totalSessionsCount: sessions.length,
      frequencyChartData,
      volumeChartData,
      hasData: sessions.length > 0,
    });
  } catch (error) {
    console.error("getTrainingAnalytics error:", error);
    res.status(500).json({ error: error.message });
  }
};

// GET /api/analytics/nutrition - Nutrition insights and macro trends
export const getNutritionAnalytics = async (req, res) => {
  try {
    const userId = req.user.id;
    const now = new Date();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(now.getDate() - 7);

    const meals = await Nutrition.find({
      user: userId,
      date: { $gte: sevenDaysAgo },
    }).sort({ date: 1 });

    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFats = 0;

    meals.forEach(m => {
      totalCalories += m.calories || 0;
      totalProtein += m.protein || 0;
      totalCarbs += m.carbs || 0;
      totalFats += m.fats || 0;
    });

    const avgCalories = meals.length > 0 ? Math.round(totalCalories / 7) : 0;
    const avgProtein = meals.length > 0 ? Math.round(totalProtein / 7) : 0;
    const proteinTargetPercent = Math.min(Math.round((avgProtein / 140) * 100), 100);

    // Calculate macro percentages
    const macroTotal = (totalProtein * 4) + (totalCarbs * 4) + (totalFats * 9);
    const proteinPercent = macroTotal > 0 ? Math.round(((totalProtein * 4) / macroTotal) * 100) : 0;
    const carbsPercent = macroTotal > 0 ? Math.round(((totalCarbs * 4) / macroTotal) * 100) : 0;
    const fatsPercent = macroTotal > 0 ? Math.round(((totalFats * 9) / macroTotal) * 100) : 0;

    // Daily calorie trend for the last 7 days
    const dailyTrend = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const dayStr = d.toLocaleDateString([], { weekday: "short" });
      const dateStr = d.toISOString().split("T")[0];

      const dayMeals = meals.filter(m => new Date(m.date).toISOString().split("T")[0] === dateStr);
      const dayCals = dayMeals.reduce((acc, m) => acc + (m.calories || 0), 0);

      dailyTrend.push({
        day: dayStr,
        date: dateStr,
        calories: dayCals,
      });
    }

    res.status(200).json({
      avgCalories,
      proteinTargetPercent,
      mealsLoggedThisWeek: meals.length,
      macros: {
        protein: totalProtein,
        carbs: totalCarbs,
        fats: totalFats,
        proteinPercent: proteinPercent || 30,
        carbsPercent: carbsPercent || 45,
        fatsPercent: fatsPercent || 25,
      },
      dailyTrend,
      hasData: meals.length > 0,
    });
  } catch (error) {
    console.error("getNutritionAnalytics error:", error);
    res.status(500).json({ error: error.message });
  }
};
