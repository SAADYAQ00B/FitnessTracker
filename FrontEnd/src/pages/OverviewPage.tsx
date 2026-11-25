import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Activity, Zap, Flame, Clock3, Weight, Target, Plus, CheckCircle2 } from "lucide-react";
import { useApp } from "../context/AppContext";
import { Card } from "../components/common/Card";
import { Button } from "../components/common/Button";
import { getOverviewAnalytics, OverviewAnalytics } from "../services/analyticsService";
import { completeWorkout } from "../services/workoutService";

export function OverviewPage() {
  const { notify } = useApp();
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState<OverviewAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  });

  const fetchAnalytics = async () => {
    try {
      const data = await getOverviewAnalytics();
      setAnalytics(data);
    } catch (err) {
      console.error("Failed to load overview analytics", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();

    const handleUserUpdate = () => {
      try {
        const stored = JSON.parse(localStorage.getItem("user") || "null");
        setUser(stored);
      } catch {}
    };

    window.addEventListener("user-updated", handleUserUpdate);
    return () => window.removeEventListener("user-updated", handleUserUpdate);
  }, []);

  const handleStartWorkout = async (id: string) => {
    try {
      await completeWorkout(id);
      notify("Workout completed! +50 XP earned.");
      fetchAnalytics();
    } catch (err: any) {
      notify(err.response?.data?.msg || "Could not complete workout");
    }
  };

  const firstName = user?.name ? user.name.split(" ")[0] : "Athlete";
  const todayFormatted = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  }).toUpperCase();

  const activityScore = analytics?.activityScore || 0;
  const scorePercent = activityScore; // 0-100

  return (
    <>
      <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="eyebrow" style={{ color: "var(--color-lime)" }}>{todayFormatted}</p>
          <h1 className="mt-2 text-3xl font-black tracking-[-.045em] sm:text-4xl" style={{ color: "var(--color-white, white)" }}>
            Ready to move, {firstName}?
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-muted">
            {analytics?.weeklyCompleted && analytics.weeklyCompleted > 0
              ? `You have completed ${analytics.weeklyCompleted} workout${analytics.weeklyCompleted === 1 ? "" : "s"} this week. Keep up the momentum!`
              : "Welcome to your personal dashboard. Start by logging a workout or recording your daily fuel."}
          </p>
        </div>
        <Button variant="secondary" icon={Activity} onClick={() => navigate("/dashboard/progress")}>
          View progress
        </Button>
      </div>

      <section className="grid gap-5 xl:grid-cols-[1.5fr_.8fr]">
        {/* UP NEXT OR CLEAN EMPTY ROUTINE PROMPT */}
        {analytics?.upNext ? (
          <div className="relative min-h-[330px] overflow-hidden rounded-[28px] border" style={{ borderColor: "var(--line)", background: "#0d110e" }}>
            <img 
              src={analytics.upNext.image || "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=1200&q=85"} 
              alt={analytics.upNext.title} 
              className="absolute inset-0 h-full w-full object-cover object-center" 
            />
            <div 
              className="absolute inset-0" 
              style={{ 
                background: "linear-gradient(105deg, rgba(12, 16, 13, 0.94) 0%, rgba(12, 16, 13, 0.8) 45%, rgba(12, 16, 13, 0.3) 80%, transparent 100%)" 
              }} 
            />
            <div className="relative flex h-full min-h-[330px] max-w-xl flex-col justify-end p-6 sm:p-8">
              <div className="mb-auto flex items-center gap-2">
                <span className="rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider" style={{ background: "var(--color-lime)", color: "var(--color-ink)" }}>
                  {analytics.upNext.tag || "Up next"}
                </span>
                <span className="text-xs font-medium text-white/80">Routine available</span>
              </div>
              <p className="text-xs font-bold uppercase tracking-[.18em]" style={{ color: "var(--color-lime)" }}>
                {analytics.upNext.type} training
              </p>
              <h2 className="mt-2 text-3xl font-black tracking-[-.04em] text-white sm:text-4xl">
                {analytics.upNext.title}
              </h2>
              <p className="mt-3 text-sm leading-6 text-white/80">
                {analytics.upNext.meta}
              </p>
              <div className="mt-6 flex gap-3">
                <Button icon={Zap} onClick={() => handleStartWorkout(analytics.upNext!.id)}>
                  Log completion
                </Button>
                <Button variant="secondary" onClick={() => navigate("/dashboard/workouts")} className="bg-black/40 text-white border-white/20 backdrop-blur-md hover:bg-black/60">
                  View library
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="relative min-h-[330px] flex flex-col justify-center rounded-[28px] border p-8" style={{ borderColor: "var(--line)", background: "var(--surface)" }}>
            <div className="max-w-md">
              <span className="rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider inline-block mb-4" style={{ background: "color-mix(in srgb, var(--color-lime) 20%, transparent)", color: "var(--color-lime)" }}>
                GET STARTED
              </span>
              <h2 className="text-2xl sm:text-3xl font-black" style={{ color: "var(--color-white, white)" }}>Create your first routine</h2>
              <p className="mt-2 text-sm text-muted leading-relaxed">
                Build a personalized workout routine with sets, reps, and weights to start seeing your activity score and training metrics grow.
              </p>
              <div className="mt-6 flex gap-3">
                <Button icon={Plus} onClick={() => navigate("/dashboard/workouts")}>
                  Create routine
                </Button>
                <Button variant="secondary" onClick={() => navigate("/dashboard/nutrition")}>
                  Log a meal
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* DYNAMIC ACTIVITY SCORE CARD */}
        <Card className="flex flex-col">
          <div className="flex items-start justify-between">
            <div>
              <p className="eyebrow">Daily movement</p>
              <h3 className="mt-2 text-xl font-bold" style={{ color: "var(--color-white, white)" }}>Activity score</h3>
            </div>
            <span className="rounded-lg px-2.5 py-1 text-xs font-bold" style={{ background: "color-mix(in srgb, var(--color-lime) 15%, transparent)", color: "var(--color-lime)" }}>
              {activityScore > 0 ? `${activityScore}%` : "0%"}
            </span>
          </div>
          <div className="my-auto flex items-center justify-center py-6">
            <div 
              className="relative grid size-44 place-items-center rounded-full transition-all duration-500"
              style={{
                background: scorePercent > 0
                  ? `conic-gradient(var(--color-lime) ${scorePercent}%, var(--line) 0)`
                  : "var(--line)"
              }}
            >
              <div className="grid size-32 place-items-center rounded-full text-center" style={{ background: "var(--surface)" }}>
                <div>
                  <strong className="block text-4xl font-black tracking-tight" style={{ color: "var(--color-white, white)" }}>
                    {activityScore}
                  </strong>
                  <span className="text-xs text-muted">out of 100</span>
                </div>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 border-t pt-4 text-center" style={{ borderColor: "var(--line)" }}>
            {[
              [(analytics?.steps || 0).toLocaleString(), "steps"],
              [(analytics?.caloriesBurned || 0).toString(), "kcal"],
              [`${analytics?.activeMinutes || 0}m`, "active"]
            ].map(([value, label]) => (
              <div key={label}>
                <p className="text-sm font-bold" style={{ color: "var(--color-white, white)" }}>{value}</p>
                <p className="text-[11px] text-muted">{label}</p>
              </div>
            ))}
          </div>
        </Card>
      </section>

      {/* DYNAMIC METRIC CARDS */}
      <section className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric 
          icon={Flame} 
          label="Calories burned" 
          value={analytics?.caloriesBurned || 0} 
          unit="kcal" 
          trend={analytics?.caloriesBurned && analytics.caloriesBurned > 0 ? "Today" : "0 kcal"} 
          positive={Boolean(analytics?.caloriesBurned && analytics.caloriesBurned > 0)} 
        />
        <Metric 
          icon={Clock3} 
          label="Active time" 
          value={analytics?.activeMinutes || 0} 
          unit="min" 
          trend={analytics?.activeMinutes && analytics.activeMinutes > 0 ? "Logged" : "0 min"} 
          positive={Boolean(analytics?.activeMinutes && analytics.activeMinutes > 0)} 
        />
        <Metric 
          icon={Weight} 
          label="Current weight" 
          value={analytics?.currentWeight || "--"} 
          unit={analytics?.currentWeight ? "kg" : ""} 
          trend={analytics?.currentWeight ? "Recorded" : "No entry"} 
          positive={Boolean(analytics?.currentWeight)} 
        />
        <Metric 
          icon={Target} 
          label="Weekly workouts" 
          value={analytics?.weeklyFraction || "0/5"} 
          unit="done" 
          trend={analytics?.weeklyPercent || "0%"} 
          positive={Boolean(analytics?.weeklyCompleted && analytics.weeklyCompleted > 0)} 
        />
      </section>
    </>
  );
}

function Metric({ icon: Icon, label, value, unit, trend, positive }: any) {
  return (
    <div className="card flex items-center gap-4 p-5">
      <span className="grid size-11 shrink-0 place-items-center rounded-xl" style={{ background: "color-mix(in srgb, var(--color-lime) 10%, transparent)", color: "var(--color-lime)" }}>
        <Icon size={20} />
      </span>
      <div>
        <p className="text-xs text-muted">{label}</p>
        <p className="mt-1 text-xl font-black" style={{ color: "var(--color-white, white)" }}>
          {value} {unit && <span className="text-xs font-medium text-muted">{unit}</span>}
        </p>
      </div>
      <span className={`ml-auto self-start text-[11px] font-bold ${positive ? "" : "text-muted"}`} style={positive ? { color: "var(--color-lime)" } : {}}>
        {trend}
      </span>
    </div>
  );
}