import { useState, useEffect } from "react";
import { Download, FileSpreadsheet, Printer, BarChart3, PieChart, Activity } from "lucide-react";
import { useApp } from "../context/AppContext";
import { PageHeader } from "../components/common/PageHeader";
import { Card } from "../components/common/Card";
import { Button } from "../components/common/Button";
import { Modal } from "../components/common/Modal";
import {
  getTrainingAnalytics,
  getNutritionAnalytics,
  TrainingAnalytics,
  NutritionAnalytics,
} from "../services/analyticsService";
import { downloadCSVReport, printPDFReport } from "../services/reportService";

export function AnalyticsPage() {
  const { notify } = useApp();
  const [tab, setTab] = useState("Training");
  const [trainingData, setTrainingData] = useState<TrainingAnalytics | null>(null);
  const [nutritionData, setNutritionData] = useState<NutritionAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        const [training, nutrition] = await Promise.all([
          getTrainingAnalytics(),
          getNutritionAnalytics(),
        ]);
        setTrainingData(training);
        setNutritionData(nutrition);
      } catch (err) {
        console.error("Failed to fetch analytics", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  const kpis = tab === "Training" ? [
    ["Workout frequency", trainingData?.frequency || "0.0", "per week", trainingData?.hasData ? "+ Active" : "No sessions"],
    ["Training volume", trainingData?.totalVolume || "0", "kg lifted", trainingData?.hasData ? "Total" : "0 kg"],
    ["Avg. duration", trainingData?.avgDuration ? `${trainingData.avgDuration}m` : "0m", "minutes / workout", trainingData?.hasData ? "Average" : "0m"],
  ] : tab === "Nutrition" ? [
    ["Avg. calories", nutritionData?.avgCalories ? `${nutritionData.avgCalories}` : "0", "kcal / day", nutritionData?.hasData ? "7-day avg" : "No logs"],
    ["Protein target", nutritionData?.proteinTargetPercent ? `${nutritionData.proteinTargetPercent}%` : "0%", "achieved (140g target)", nutritionData?.hasData ? "Status" : "0%"],
    ["Meals logged", `${nutritionData?.mealsLoggedThisWeek || 0}`, "this week", nutritionData?.hasData ? "Recorded" : "0 meals"],
  ] : [
    ["Consistency", trainingData?.hasData ? "Active" : "Building", "training status", "+ Momentum"],
    ["Logged volume", trainingData?.totalVolume || "0", "kg across history", "Strength"],
    ["Fuel tracked", `${nutritionData?.mealsLoggedThisWeek || 0}`, "meals this week", "Nutrition"],
  ];

  return (
    <>
      <PageHeader 
        eyebrow="INSIGHTS" 
        title="Performance Analytics" 
        description="Turn your training workouts and daily nutrition into actionable insights." 
        action={
          <Button variant="secondary" icon={Download} onClick={() => setIsExportModalOpen(true)}>
            Export report
          </Button>
        } 
      />

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {["Training", "Nutrition", "Recovery"].map((x) => (
          <button 
            key={x} 
            className={`px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
              tab === x ? "bg-[var(--color-lime)] text-[var(--color-ink)]" : "text-muted hover:text-white"
            }`} 
            onClick={() => setTab(x)}
          >
            {x}
          </button>
        ))}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {kpis.map(([a, b, c, d]) => (
          <Card key={a} className="relative">
            <span className="text-xs text-muted font-medium">{a}</span>
            <strong className="block text-3xl font-bold mt-2 mb-1" style={{ color: "var(--color-white, white)" }}>{b}</strong>
            <small className="text-[10px] text-muted">{c}</small>
            <b className="absolute top-4 right-4 text-xs bg-green-500/10 text-green-500 px-2 py-1 rounded">
              {d}
            </b>
          </Card>
        ))}
      </div>

      {/* CHARTS CONTAINER */}
      {tab === "Training" && (
        <div className="grid gap-5 lg:grid-cols-2">
          {/* Workout Frequency By Day Chart */}
          <Card>
            <div className="card-head">
              <div>
                <span className="eyebrow">CONSISTENCY</span>
                <h2>Workouts by Day of Week</h2>
              </div>
            </div>
            {trainingData?.frequencyChartData && trainingData.frequencyChartData.some(d => d.count > 0) ? (
              <div className="h-48 flex items-end justify-between gap-3 pt-6 pb-2">
                {trainingData.frequencyChartData.map((d) => {
                  const maxCount = Math.max(...trainingData.frequencyChartData.map(x => x.count), 1);
                  const barHeight = Math.max((d.count / maxCount) * 100, 8);
                  return (
                    <div key={d.day} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                      <span className="text-[10px] font-bold" style={{ color: d.count > 0 ? "var(--color-lime)" : "var(--color-muted)" }}>
                        {d.count > 0 ? d.count : ""}
                      </span>
                      <div 
                        className="w-full rounded-t-lg transition-all duration-500"
                        style={{
                          height: `${barHeight}%`,
                          background: d.count > 0 ? "var(--color-lime)" : "rgba(255,255,255,0.06)",
                        }}
                      />
                      <span className="text-[11px] font-bold text-muted">{d.day}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-16 text-center text-xs text-muted">
                No training sessions recorded in the last 30 days.
                <p className="mt-1 text-white/70">Complete workouts from the Workouts tab to see your frequency distribution.</p>
              </div>
            )}
          </Card>

          {/* Volume Progression Chart */}
          <Card>
            <div className="card-head">
              <div>
                <span className="eyebrow">VOLUME LIFTED</span>
                <h2>Weight Volume Trend</h2>
              </div>
            </div>
            {trainingData?.volumeChartData && trainingData.volumeChartData.length > 0 ? (
              <div className="space-y-3 pt-4">
                {trainingData.volumeChartData.map((v, i) => (
                  <div key={i} className="flex items-center gap-3 text-xs">
                    <span className="w-16 text-muted">{v.date}</span>
                    <div className="flex-1 h-3 rounded-full bg-white/10 overflow-hidden">
                      <div 
                        className="h-full bg-emerald-400 rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min(Math.round(((v.volume || 1) / (trainingData.totalVolumeRaw || 1)) * 100 * 2), 100)}%`
                        }}
                      />
                    </div>
                    <span className="font-bold w-20 text-right" style={{ color: "var(--color-white, white)" }}>
                      {(v.volume || 0).toLocaleString()} kg
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-16 text-center text-xs text-muted">
                No lift volume recorded yet.
                <p className="mt-1 text-white/70">Add weight to your exercises to track lifting volume progression.</p>
              </div>
            )}
          </Card>
        </div>
      )}

      {tab === "Nutrition" && (
        <div className="grid gap-5 lg:grid-cols-2">
          {/* Daily Calorie Intake Trend */}
          <Card>
            <div className="card-head">
              <div>
                <span className="eyebrow">CALORIES</span>
                <h2>Daily Calorie Trend (Last 7 Days)</h2>
              </div>
            </div>
            {nutritionData?.dailyTrend && nutritionData.dailyTrend.some(t => t.calories > 0) ? (
              <div className="h-48 flex items-end justify-between gap-3 pt-6 pb-2">
                {nutritionData.dailyTrend.map((t) => {
                  const maxCals = Math.max(...nutritionData.dailyTrend.map(x => x.calories), 2200);
                  const barHeight = Math.max((t.calories / maxCals) * 100, 6);
                  return (
                    <div key={t.date} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                      <span className="text-[9px] font-bold text-muted truncate w-full text-center">
                        {t.calories > 0 ? `${t.calories}` : ""}
                      </span>
                      <div 
                        className="w-full rounded-t-lg transition-all duration-500"
                        style={{
                          height: `${barHeight}%`,
                          background: t.calories >= 2000 ? "#ff735e" : t.calories > 0 ? "var(--color-lime)" : "rgba(255,255,255,0.06)",
                        }}
                      />
                      <span className="text-[10px] font-bold text-muted">{t.day}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-16 text-center text-xs text-muted">
                No food logged in the last 7 days.
                <p className="mt-1 text-white/70">Track your meals in the Nutrition tab to visualize daily trends.</p>
              </div>
            )}
          </Card>

          {/* Macronutrient Distribution */}
          <Card>
            <div className="card-head">
              <div>
                <span className="eyebrow">MACROS</span>
                <h2>Weekly Macronutrient Split</h2>
              </div>
            </div>
            {nutritionData?.hasData ? (
              <div className="space-y-4 pt-4">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-bold text-emerald-400">Protein ({nutritionData.macros.proteinPercent}%)</span>
                    <span className="text-muted">{nutritionData.macros.protein}g total</span>
                  </div>
                  <div className="h-3 rounded-full bg-white/10 overflow-hidden">
                    <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${nutritionData.macros.proteinPercent}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-bold text-amber-400">Carbohydrates ({nutritionData.macros.carbsPercent}%)</span>
                    <span className="text-muted">{nutritionData.macros.carbs}g total</span>
                  </div>
                  <div className="h-3 rounded-full bg-white/10 overflow-hidden">
                    <div className="h-full bg-amber-400 rounded-full" style={{ width: `${nutritionData.macros.carbsPercent}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-bold text-rose-400">Fats ({nutritionData.macros.fatsPercent}%)</span>
                    <span className="text-muted">{nutritionData.macros.fats}g total</span>
                  </div>
                  <div className="h-3 rounded-full bg-white/10 overflow-hidden">
                    <div className="h-full bg-rose-400 rounded-full" style={{ width: `${nutritionData.macros.fatsPercent}%` }} />
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-16 text-center text-xs text-muted">
                No macronutrient data logged yet.
                <p className="mt-1 text-white/70">Log your meals with protein, carbs, and fats to view your nutrient distribution.</p>
              </div>
            )}
          </Card>
        </div>
      )}

      {tab === "Recovery" && (
        <Card className="text-center py-12">
          <Activity size={32} className="mx-auto text-[var(--color-lime)] mb-3 opacity-80" />
          <h3 className="text-lg font-bold" style={{ color: "var(--color-white, white)" }}>Training Readiness & Recovery</h3>
          <p className="text-sm text-muted max-w-md mx-auto mt-2 leading-relaxed">
            Recovery metrics are balanced from your weekly active volume ({trainingData?.totalVolume || "0"} kg) and consistent nutrition logging ({nutritionData?.mealsLoggedThisWeek || 0} meals logged).
          </p>
        </Card>
      )}

      {/* EXPORT REPORT MODAL */}
      {isExportModalOpen && (
        <Modal title="Export Fitness & Nutrition Report" onClose={() => setIsExportModalOpen(false)}>
          <div className="space-y-4">
            <p className="text-xs text-muted">
              Choose your preferred report format. Both CSV and PDF formats export real user data from your workout routines, session logs, nutrition entries, and progress measurements.
            </p>

            <div className="grid gap-3 sm:grid-cols-2">
              <button
                className="p-4 rounded-xl border text-left hover:bg-white/5 transition flex flex-col cursor-pointer"
                style={{ borderColor: "var(--line)" }}
                onClick={() => {
                  downloadCSVReport("all");
                  setIsExportModalOpen(false);
                  notify("CSV Report generated and downloading");
                }}
              >
                <FileSpreadsheet size={24} className="text-[var(--color-lime)] mb-2" />
                <strong className="text-sm font-bold block" style={{ color: "var(--color-white, white)" }}>
                  CSV Spreadsheet
                </strong>
                <span className="text-[11px] text-muted mt-1">
                  Full raw export of routines, sessions, meals, and progress measurements.
                </span>
              </button>

              <button
                className="p-4 rounded-xl border text-left hover:bg-white/5 transition flex flex-col cursor-pointer"
                style={{ borderColor: "var(--line)" }}
                onClick={() => {
                  printPDFReport();
                  setIsExportModalOpen(false);
                  notify("Generating printable PDF report");
                }}
              >
                <Printer size={24} className="text-[var(--color-lime)] mb-2" />
                <strong className="text-sm font-bold block" style={{ color: "var(--color-white, white)" }}>
                  Printable PDF Report
                </strong>
                <span className="text-[11px] text-muted mt-1">
                  Beautifully formatted PDF report ready for printing or saving to your device.
                </span>
              </button>
            </div>

            <Button variant="secondary" className="w-full mt-2" onClick={() => setIsExportModalOpen(false)}>
              Close
            </Button>
          </div>
        </Modal>
      )}
    </>
  );
}