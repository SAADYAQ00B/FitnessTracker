import { useState, useEffect, FormEvent } from "react";
import { Plus, Apple, Trash2, PieChart } from "lucide-react";
import { useApp } from "../context/AppContext";
import { PageHeader } from "../components/common/PageHeader";
import { Card } from "../components/common/Card";
import { Button } from "../components/common/Button";
import { Modal } from "../components/common/Modal";
import {
  getMeals,
  addMeal,
  deleteMeal,
  getNutritionSummary,
  MealItem,
  NutritionSummary,
} from "../services/nutritionService";

export function NutritionPage() {
  const { notify } = useApp();

  // Generate last 7 days including today
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return {
      dateObj: d,
      dateStr: d.toISOString().split("T")[0],
      dayName: d.toLocaleDateString("en-US", { weekday: "short" }),
      dayNumber: d.getDate(),
      isToday: i === 6,
    };
  });

  const [selectedDate, setSelectedDate] = useState(last7Days[6].dateStr);
  const [meals, setMeals] = useState<MealItem[]>([]);
  const [summary, setSummary] = useState<NutritionSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLogOpen, setIsLogOpen] = useState(false);
  const [defaultMealType, setDefaultMealType] = useState("Breakfast");

  const loadMealsForDate = async (dateStr: string) => {
    setLoading(true);
    try {
      const [mealsData, summaryData] = await Promise.all([
        getMeals(dateStr),
        getNutritionSummary(dateStr),
      ]);
      setMeals(mealsData);
      setSummary(summaryData);
    } catch (err) {
      console.error("Failed to load nutrition data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMealsForDate(selectedDate);
  }, [selectedDate]);

  const handleLogFood = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newMeal = {
      type: formData.get("type") as string,
      food: formData.get("food") as string,
      quantity: (formData.get("quantity") as string) || "1 serving",
      calories: Number(formData.get("calories") || 0),
      protein: Number(formData.get("protein") || 0),
      carbs: Number(formData.get("carbs") || 0),
      fats: Number(formData.get("fats") || 0),
      date: selectedDate,
    };

    try {
      const created = await addMeal(newMeal);
      setMeals([created, ...meals]);
      setIsLogOpen(false);
      notify("Food logged successfully!");
      // Reload summary for accurate macro ring
      getNutritionSummary(selectedDate).then(setSummary);
    } catch (err: any) {
      notify(err.response?.data?.msg || "Failed to log food");
    }
  };

  const handleDeleteMeal = async (id: string) => {
    try {
      await deleteMeal(id);
      setMeals(meals.filter((x) => (x.id !== id && x._id !== id)));
      notify("Meal removed");
      // Update summary
      getNutritionSummary(selectedDate).then(setSummary);
    } catch (err: any) {
      notify(err.response?.data?.msg || "Failed to remove meal");
    }
  };

  const openLogModal = (type: string = "Breakfast") => {
    setDefaultMealType(type);
    setIsLogOpen(true);
  };

  const totalCalories = summary?.totalCalories || 0;
  const calorieGoal = summary?.dailyCalorieGoal || 2200;
  const caloriePercent = Math.min(Math.round((totalCalories / calorieGoal) * 100), 100);

  const proteinGrams = summary?.totalProtein || 0;
  const carbsGrams = summary?.totalCarbs || 0;
  const fatsGrams = summary?.totalFats || 0;

  return (
    <>
      <PageHeader 
        eyebrow="DAILY FUEL" 
        title="Nutrition" 
        description="Fuel your goals with a clear view of every meal, calorie, and macro." 
        action={<Button icon={Plus} onClick={() => openLogModal("Breakfast")}>Log food</Button>} 
      />
      
      {/* 7-Day Interactive Date Strip */}
      <div className="grid grid-cols-7 gap-2 mb-6">
        {last7Days.map((d) => (
          <button 
            key={d.dateStr} 
            onClick={() => setSelectedDate(d.dateStr)} 
            className={`flex flex-col items-center justify-center py-3 rounded-xl border transition cursor-pointer ${
              selectedDate === d.dateStr 
                ? "bg-[var(--color-lime)] text-[var(--color-ink)] border-[var(--color-lime)] font-bold shadow-md" 
                : "border-[var(--line)] hover:bg-white/5 text-muted hover:text-white"
            }`}
          >
            <span className="text-[10px] font-bold uppercase">{d.dayName}</span>
            <strong className="text-lg">{d.dayNumber}</strong>
            {d.isToday && <span className="text-[9px] uppercase tracking-wider font-extrabold mt-0.5">• TODAY</span>}
          </button>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-[.95fr_1.15fr]">
        {/* CALORIE & MACRO CARD */}
        <Card className="flex flex-col">
          <div className="card-head">
            <div>
              <span className="eyebrow">DAILY TARGET</span>
              <h2>Calories & macros</h2>
            </div>
            <span className="rounded-lg px-2.5 py-1 text-xs font-bold" style={{ background: "color-mix(in srgb, var(--color-lime) 15%, transparent)", color: "var(--color-lime)" }}>
              {caloriePercent}% Goal
            </span>
          </div>

          <div className="flex items-center justify-center gap-8 py-6">
            <div 
              className="size-44 rounded-full grid place-items-center transition-all duration-500" 
              style={{ 
                background: totalCalories > 0 
                  ? `conic-gradient(#ff735e ${caloriePercent}%, var(--line) 0)` 
                  : "var(--line)" 
              }}
            >
              <div className="size-36 rounded-full grid place-items-center text-center" style={{ background: "var(--surface)" }}>
                <div>
                  <strong className="text-2xl block font-black" style={{ color: "var(--color-white, white)" }}>
                    {totalCalories.toLocaleString()}
                  </strong>
                  <span className="text-[10px] text-muted">of {calorieGoal.toLocaleString()} kcal</span>
                </div>
              </div>
            </div>
          </div>

          {/* Macro Progress Bars */}
          <div className="space-y-3 border-t pt-4 mt-auto" style={{ borderColor: "var(--line)" }}>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-bold text-white/90">Protein</span>
                <span className="text-muted">{proteinGrams}g / {summary?.dailyProteinGoal || 140}g</span>
              </div>
              <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                <div 
                  className="h-full bg-emerald-400 transition-all duration-500 rounded-full" 
                  style={{ width: `${Math.min(Math.round((proteinGrams / (summary?.dailyProteinGoal || 140)) * 100), 100)}%` }} 
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-bold text-white/90">Carbohydrates</span>
                <span className="text-muted">{carbsGrams}g / {summary?.dailyCarbsGoal || 220}g</span>
              </div>
              <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                <div 
                  className="h-full bg-amber-400 transition-all duration-500 rounded-full" 
                  style={{ width: `${Math.min(Math.round((carbsGrams / (summary?.dailyCarbsGoal || 220)) * 100), 100)}%` }} 
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-bold text-white/90">Fats</span>
                <span className="text-muted">{fatsGrams}g / {summary?.dailyFatsGoal || 70}g</span>
              </div>
              <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                <div 
                  className="h-full bg-rose-400 transition-all duration-500 rounded-full" 
                  style={{ width: `${Math.min(Math.round((fatsGrams / (summary?.dailyFatsGoal || 70)) * 100), 100)}%` }} 
                />
              </div>
            </div>
          </div>
        </Card>
        
        {/* MEALS LIST CARD */}
        <Card className="flex flex-col">
          <div className="card-head">
            <div>
              <span className="eyebrow">
                {selectedDate === last7Days[6].dateStr ? "TODAY" : selectedDate}
              </span>
              <h2>Meal log</h2>
            </div>
            <button className="text-button flex items-center gap-1" onClick={() => openLogModal("Breakfast")}>
              <Plus size={15} /> Add meal
            </button>
          </div>

          {meals.length > 0 ? (
            <div className="divide-y overflow-y-auto max-h-[380px] pr-1" style={{ borderColor: "var(--line)" }}>
              {meals.map((m) => {
                const mealId = (m.id || m._id) as string;
                return (
                  <div className="flex items-center gap-4 py-3 first:pt-0 last:border-0" style={{ borderColor: "var(--line)" }} key={mealId}>
                    <span 
                      className="size-10 rounded-xl grid place-items-center shrink-0" 
                      style={{ background: "color-mix(in srgb, #35966e 15%, transparent)", color: "#35966e" }}
                    >
                      <Apple size={18} />
                    </span>
                    <div className="flex-1 min-w-0">
                      <small className="text-[9px] uppercase font-bold text-muted">{m.type}</small>
                      <strong className="block text-sm my-0.5 truncate" style={{ color: "var(--color-white, white)" }}>{m.food}</strong>
                      <span className="text-xs text-muted">
                        {m.calories} kcal · {m.proteinGrams || m.protein} P · {m.carbsGrams || m.carbs} C · {m.fatsGrams || m.fats} F
                      </span>
                    </div>
                    <button 
                      className="icon-button text-muted hover:text-red-400" 
                      onClick={() => handleDeleteMeal(mealId)}
                      title="Remove meal"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 text-muted text-xs my-auto">
              No meals logged for this date.
              <p className="mt-1 text-white/70">Click "Add meal" to track your nutrition for this day.</p>
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-auto pt-4 border-t" style={{ borderColor: "var(--line)" }}>
            {["Breakfast", "Lunch", "Dinner", "Snack"].map((t) => (
              <button 
                key={t}
                className="p-2.5 border border-dashed rounded-xl flex items-center justify-center gap-1.5 text-xs font-bold hover:bg-white/5 transition" 
                style={{ borderColor: "var(--line)", color: "var(--color-lime)" }} 
                onClick={() => openLogModal(t)}
              >
                <Plus size={14} /> <span>{t}</span>
              </button>
            ))}
          </div>
        </Card>
      </div>

      {/* LOG FOOD MODAL */}
      {isLogOpen && (
        <Modal title="Log Food Entry" onClose={() => setIsLogOpen(false)}>
          <form onSubmit={handleLogFood} className="space-y-4">
            <label className="field">
              <span>Food Item Name</span>
              <input name="food" required placeholder="e.g. Oatmeal with Berries & Honey" className="field-input" />
            </label>

            <div className="form-grid">
              <label className="field">
                <span>Meal Type</span>
                <select name="type" defaultValue={defaultMealType} className="field-input">
                  <option>Breakfast</option>
                  <option>Lunch</option>
                  <option>Dinner</option>
                  <option>Snack</option>
                </select>
              </label>
              <label className="field">
                <span>Portion / Quantity</span>
                <input name="quantity" placeholder="e.g. 1 bowl, 200g" defaultValue="1 serving" className="field-input" />
              </label>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <label className="field">
                <span>Calories (kcal)</span>
                <input name="calories" type="number" required placeholder="350" min="0" className="field-input" />
              </label>
              <label className="field">
                <span>Protein (g)</span>
                <input name="protein" type="number" placeholder="25" min="0" step="0.5" className="field-input" />
              </label>
              <label className="field">
                <span>Carbs (g)</span>
                <input name="carbs" type="number" placeholder="40" min="0" step="0.5" className="field-input" />
              </label>
              <label className="field">
                <span>Fats (g)</span>
                <input name="fats" type="number" placeholder="10" min="0" step="0.5" className="field-input" />
              </label>
            </div>

            <Button type="submit" className="w-full mt-3">Add to Daily Log</Button>
          </form>
        </Modal>
      )}
    </>
  );
}