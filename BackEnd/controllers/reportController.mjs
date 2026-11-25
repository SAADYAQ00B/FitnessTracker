import User from '../models/userModel.mjs';
import Workout from '../models/workoutModel.mjs';
import WorkoutSession from '../models/workoutSessionModel.mjs';
import Nutrition from '../models/nutritionModel.mjs';
import Progress from '../models/progressModel.mjs';

// GET /api/reports/csv - Export CSV report of user fitness and nutrition data
export const exportCSV = async (req, res) => {
  try {
    const userId = req.user.id;
    const type = req.query.type || 'all'; // 'workouts', 'nutrition', 'progress', 'all'

    const [user, workouts, sessions, meals, progressRecords] = await Promise.all([
      User.findById(userId).select('name email location units'),
      Workout.find({ user: userId }).sort({ createdAt: -1 }),
      WorkoutSession.find({ user: userId }).sort({ date: -1 }),
      Nutrition.find({ user: userId }).sort({ date: -1 }),
      Progress.find({ user: userId }).sort({ date: -1 }),
    ]);

    let csvContent = "";

    if (type === 'workouts' || type === 'all') {
      csvContent += "=== WORKOUT ROUTINES & SESSIONS ===\n";
      csvContent += "Type,Title,Category,Duration(min),Meta/Stats,Date/Tag,Notes\n";
      
      workouts.forEach(w => {
        const cleanTitle = `"${(w.title || '').replace(/"/g, '""')}"`;
        const cleanNotes = `"${(w.notes || '').replace(/"/g, '""')}"`;
        csvContent += `Routine,${cleanTitle},${w.type || 'Strength'},${w.duration || 45},"${w.meta || ''}",${w.tag || 'Today'},${cleanNotes}\n`;
      });

      sessions.forEach(s => {
        const cleanTitle = `"${(s.title || '').replace(/"/g, '""')}"`;
        const cleanNotes = `"${(s.notes || '').replace(/"/g, '""')}"`;
        const dStr = new Date(s.date).toISOString().split('T')[0];
        csvContent += `CompletedSession,${cleanTitle},${s.type || 'Strength'},${s.duration || 45},"${s.stats || ''}",${dStr},${cleanNotes}\n`;
      });
      csvContent += "\n";
    }

    if (type === 'nutrition' || type === 'all') {
      csvContent += "=== NUTRITION LOGS ===\n";
      csvContent += "Date,MealType,FoodItem,Quantity,Calories(kcal),Protein(g),Carbs(g),Fats(g),Notes\n";

      meals.forEach(m => {
        const dStr = new Date(m.date).toISOString().split('T')[0];
        const cleanFood = `"${(m.food || '').replace(/"/g, '""')}"`;
        const cleanQuantity = `"${(m.quantity || '1 serving').replace(/"/g, '""')}"`;
        const cleanNotes = `"${(m.notes || '').replace(/"/g, '""')}"`;
        csvContent += `${dStr},${m.type},${cleanFood},${cleanQuantity},${m.calories || 0},${m.protein || 0},${m.carbs || 0},${m.fats || 0},${cleanNotes}\n`;
      });
      csvContent += "\n";
    }

    if (type === 'progress' || type === 'all') {
      csvContent += "=== PROGRESS & MEASUREMENTS ===\n";
      csvContent += "Date,Weight(kg),BodyFat(%),Waist(cm),Chest(cm),BenchPress(kg),Squat(kg),Deadlift(kg),5kRunTime,Notes\n";

      progressRecords.forEach(p => {
        const dStr = new Date(p.date).toISOString().split('T')[0];
        const cleanNotes = `"${(p.notes || '').replace(/"/g, '""')}"`;
        csvContent += `${dStr},${p.weight || 0},${p.bodyFat || 0},${p.waist || 0},${p.chest || 0},${p.benchPress || 0},${p.squat || 0},${p.deadlift || 0},"${p.runTime5k || ''}",${cleanNotes}\n`;
      });
    }

    const dateStr = new Date().toISOString().split('T')[0];
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="fitness_report_${type}_${dateStr}.csv"`);
    res.status(200).send(csvContent);
  } catch (error) {
    console.error("exportCSV error:", error);
    res.status(500).json({ error: error.message });
  }
};

// GET /api/reports/summary - Structured fitness & nutrition report for PDF/Client export
export const getReportSummary = async (req, res) => {
  try {
    const userId = req.user.id;

    const [user, workouts, sessions, meals, progressRecords] = await Promise.all([
      User.findById(userId).select('-password'),
      Workout.find({ user: userId }).sort({ createdAt: -1 }),
      WorkoutSession.find({ user: userId }).sort({ date: -1 }).limit(10),
      Nutrition.find({ user: userId }).sort({ date: -1 }).limit(15),
      Progress.find({ user: userId }).sort({ date: 1 }),
    ]);

    const latestProgress = progressRecords.length > 0 ? progressRecords[progressRecords.length - 1] : null;
    const firstProgress = progressRecords.length > 0 ? progressRecords[0] : null;

    const totalVolumeLifted = sessions.reduce((acc, s) => acc + (s.volume || 0), 0);
    const totalWorkoutMinutes = sessions.reduce((acc, s) => acc + (s.duration || 0), 0);
    const totalMealsLogged = meals.length;
    const avgCalories = meals.length > 0
      ? Math.round(meals.reduce((acc, m) => acc + (m.calories || 0), 0) / meals.length)
      : 0;

    res.status(200).json({
      generatedAt: new Date().toISOString(),
      user: {
        name: user.name,
        email: user.email,
        level: user.level,
        xp: user.xp,
        units: user.units || 'Metric',
      },
      stats: {
        totalRoutines: workouts.length,
        totalSessionsCompleted: sessions.length,
        totalVolumeLifted,
        totalWorkoutMinutes,
        totalMealsLogged,
        avgCalories,
        currentWeight: latestProgress ? latestProgress.weight : 0,
        startWeight: firstProgress ? firstProgress.weight : 0,
        weightDelta: (latestProgress && firstProgress) ? (latestProgress.weight - firstProgress.weight).toFixed(1) : 0,
        bodyFat: latestProgress ? latestProgress.bodyFat : 0,
        benchPressPR: latestProgress ? latestProgress.benchPress : 0,
      },
      recentWorkouts: sessions,
      recentMeals: meals,
      progressHistory: progressRecords,
    });
  } catch (error) {
    console.error("getReportSummary error:", error);
    res.status(500).json({ error: error.message });
  }
};
