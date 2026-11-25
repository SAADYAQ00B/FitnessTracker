import { useState, useEffect, FormEvent } from "react";
import { Plus, Trophy, Check, TrendingDown, TrendingUp, Calendar, ArrowRight, Download } from "lucide-react";
import { useApp } from "../context/AppContext";
import { PageHeader } from "../components/common/PageHeader";
import { Card } from "../components/common/Card";
import { Button } from "../components/common/Button";
import { Modal } from "../components/common/Modal";
import { getProgress, addMeasurement, ProgressData, ProgressChartPoint } from "../services/progressService";
import { downloadCSVReport, printPDFReport } from "../services/reportService";

export function ProgressPage() {
  const { notify } = useApp();
  const [data, setData] = useState<ProgressData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadProgress = async () => {
    setLoading(true);
    try {
      const res = await getProgress();
      setData(res);
    } catch (err) {
      console.error("Failed to fetch progress", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProgress();
  }, []);

  const handleAddMeasurement = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newEntry = {
      weight: Number(formData.get("weight")),
      bodyFat: formData.get("bodyFat") ? Number(formData.get("bodyFat")) : undefined,
      waist: formData.get("waist") ? Number(formData.get("waist")) : undefined,
      chest: formData.get("chest") ? Number(formData.get("chest")) : undefined,
      benchPress: formData.get("benchPress") ? Number(formData.get("benchPress")) : undefined,
      squat: formData.get("squat") ? Number(formData.get("squat")) : undefined,
      runTime5k: (formData.get("runTime5k") as string) || undefined,
      date: (formData.get("date") as string) || new Date().toISOString(),
      notes: (formData.get("notes") as string) || "",
    };

    try {
      await addMeasurement(newEntry);
      notify("Measurement recorded successfully!");
      setIsModalOpen(false);
      loadProgress();
    } catch (err: any) {
      notify(err.response?.data?.msg || "Failed to record measurement");
    }
  };

  const chartPoints = data?.chartData || [];
  const hasRecords = Boolean(data?.hasRecords && chartPoints.length > 0);

  // Calculate SVG chart coordinates if points exist
  let svgPoints = "";
  let minWeight = 0;
  let maxWeight = 100;
  if (hasRecords) {
    const weights = chartPoints.map(p => p.weight);
    minWeight = Math.max(0, Math.floor(Math.min(...weights) - 2));
    maxWeight = Math.ceil(Math.max(...weights) + 2);
    const range = maxWeight - minWeight || 1;

    const width = 500;
    const height = 160;
    const stepX = chartPoints.length > 1 ? width / (chartPoints.length - 1) : width / 2;

    svgPoints = chartPoints.map((p, i) => {
      const x = chartPoints.length === 1 ? width / 2 : i * stepX;
      const y = height - ((p.weight - minWeight) / range) * (height - 30) - 15;
      return `${x},${y}`;
    }).join(" ");
  }

  return (
    <>
      <PageHeader 
        eyebrow="YOUR JOURNEY" 
        title="Progress & Measurements" 
        description="See how every training session and meal log adds up to meaningful change." 
        action={
          <div className="flex gap-2">
            <Button variant="secondary" icon={Download} onClick={() => downloadCSVReport('progress')}>
              Export CSV
            </Button>
            <Button icon={Plus} onClick={() => setIsModalOpen(true)}>
              Add measurement
            </Button>
          </div>
        } 
      />

      {/* METRIC STATS GRID */}
      <div className="stat-grid mb-6">
        {[
          ["Body weight", data?.weight && data.weight !== "0" ? data.weight : "--", "kg", data?.deltaWeight || "0 kg"],
          ["Body fat", data?.bodyFat && data.bodyFat !== "0" ? data.bodyFat : "--", "%", data?.deltaBodyFat || "0%"],
          ["Waist", data?.waist && data.waist !== "0" ? data.waist : "--", "cm", data?.deltaWaist || "0 cm"],
          ["Bench press PR", data?.benchPress && data.benchPress !== "0" ? data.benchPress : "--", "kg", data?.deltaBenchPress || "0 kg"],
        ].map(([n, v, u, d]) => (
          <Card className="metric-card" key={n}>
            <span className="metric-label">{n}</span>
            <div className="metric-value">
              {v} <small>{v !== "--" ? u : ""}</small>
            </div>
            <span className={`metric-delta ${d.startsWith("-") || d.startsWith("+") ? "good" : "text-muted"}`}>
              {v !== "--" ? d : "No logs"}
            </span>
          </Card>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.5fr_.8fr]">
        {/* WEIGHT TREND CHART */}
        <Card className="flex flex-col">
          <div className="card-head">
            <div>
              <span className="eyebrow">BODY WEIGHT</span>
              <h2>Weight trend</h2>
            </div>
            {hasRecords && (
              <span className="px-2.5 py-1 bg-green-500/10 text-green-500 rounded-lg text-xs font-bold">
                {data?.weightTrend || "Active"}
              </span>
            )}
          </div>

          {hasRecords ? (
            <div>
              <div className="flex gap-8 mb-4">
                <div>
                  <strong className="text-2xl font-black block" style={{ color: "var(--color-white, white)" }}>
                    {data?.weight} kg
                  </strong>
                  <span className="text-[10px] text-muted">Current</span>
                </div>
                <div>
                  <b className={`block text-sm font-bold ${data?.deltaWeight.startsWith("-") ? "text-green-500" : "text-[var(--color-lime)]"}`}>
                    {data?.deltaWeight} ({data?.percentChange || "0%"})
                  </b>
                  <span className="text-[10px] text-muted">since first checkpoint</span>
                </div>
              </div>

              {/* Dynamic SVG Sparkline / Line Chart */}
              <div className="relative w-full h-[200px] border rounded-2xl p-4 flex flex-col justify-end overflow-hidden" style={{ borderColor: "var(--line)", background: "rgba(0,0,0,0.2)" }}>
                <svg viewBox="0 0 500 160" className="w-full h-full overflow-visible">
                  <defs>
                    <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#a3e635" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="#a3e635" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>
                  {/* Grid Lines */}
                  <line x1="0" y1="30" x2="500" y2="30" stroke="var(--line)" strokeDasharray="3 3" />
                  <line x1="0" y1="80" x2="500" y2="80" stroke="var(--line)" strokeDasharray="3 3" />
                  <line x1="0" y1="130" x2="500" y2="130" stroke="var(--line)" strokeDasharray="3 3" />

                  {/* Polyline */}
                  <polyline
                    fill="none"
                    stroke="var(--color-lime)"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={svgPoints}
                  />

                  {/* Data Points */}
                  {chartPoints.map((p, i) => {
                    const width = 500;
                    const height = 160;
                    const stepX = chartPoints.length > 1 ? width / (chartPoints.length - 1) : width / 2;
                    const x = chartPoints.length === 1 ? width / 2 : i * stepX;
                    const range = maxWeight - minWeight || 1;
                    const y = height - ((p.weight - minWeight) / range) * (height - 30) - 15;
                    return (
                      <g key={i}>
                        <circle cx={x} cy={y} r="5" fill="var(--color-lime)" stroke="#111" strokeWidth="2" />
                        <text x={x} y={y - 10} fill="var(--color-foreground)" fontSize="10" fontWeight="bold" textAnchor="middle">
                          {p.weight}kg
                        </text>
                      </g>
                    );
                  })}
                </svg>

                {/* X-Axis labels */}
                <div className="flex justify-between text-[10px] text-muted mt-2 pt-2 border-t" style={{ borderColor: "var(--line)" }}>
                  {chartPoints.map((p, i) => (
                    <span key={i}>{p.date}</span>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-16 text-muted text-xs my-auto">
              No progress logs recorded yet.
              <p className="mt-1 text-white/70">Click "Add measurement" above to track your weight and measurements over time.</p>
            </div>
          )}
        </Card>

        {/* MILESTONES CARD */}
        <Card className="flex flex-col">
          <div className="card-head">
            <div>
              <span className="eyebrow">MILESTONES</span>
              <h2>Achievements & wins</h2>
            </div>
            <Trophy size={19} className="text-amber-500" />
          </div>

          {data?.milestones && data.milestones.length > 0 ? (
            <div className="space-y-4 my-auto">
              {data.milestones.map((m) => (
                <div key={m.id} className="flex items-center gap-3">
                  <span className={`size-9 rounded-full grid place-items-center shrink-0 ${m.type === 'trophy' ? 'bg-amber-500/15 text-amber-500' : 'bg-green-500/15 text-green-500'}`}>
                    {m.type === 'trophy' ? <Trophy size={18} /> : <Check size={18} />}
                  </span>
                  <div className="flex-1 min-w-0">
                    <strong className="block text-sm truncate" style={{ color: "var(--color-white, white)" }}>{m.title}</strong>
                    <p className="text-xs text-muted truncate">{m.subtitle}</p>
                  </div>
                  <small className="text-[10px] text-muted">{m.date}</small>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted text-xs my-auto">
              <Trophy size={28} className="mx-auto mb-2 text-muted opacity-40" />
              Keep training and logging checkpoints.
              <p className="mt-1 text-white/70">Milestones unlock as you record PRs and consistency records.</p>
            </div>
          )}
        </Card>
      </div>

      {/* ADD MEASUREMENT MODAL */}
      {isModalOpen && (
        <Modal title="Record Checkpoint / Measurement" onClose={() => setIsModalOpen(false)}>
          <form onSubmit={handleAddMeasurement} className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
            <div className="form-grid">
              <label className="field">
                <span>Date</span>
                <input name="date" type="date" defaultValue={new Date().toISOString().split("T")[0]} className="field-input" required />
              </label>
              <label className="field">
                <span>Body Weight (kg)</span>
                <input name="weight" type="number" step="0.1" required placeholder="e.g. 74.5" className="field-input" />
              </label>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <label className="field">
                <span>Body Fat (%)</span>
                <input name="bodyFat" type="number" step="0.1" placeholder="e.g. 17.5" className="field-input" />
              </label>
              <label className="field">
                <span>Waist (cm)</span>
                <input name="waist" type="number" step="0.5" placeholder="e.g. 81" className="field-input" />
              </label>
              <label className="field">
                <span>Chest (cm)</span>
                <input name="chest" type="number" step="0.5" placeholder="e.g. 98" className="field-input" />
              </label>
            </div>

            <div className="border-t pt-3" style={{ borderColor: "var(--line)" }}>
              <span className="text-xs font-bold text-muted uppercase block mb-2">Performance PRs & Run Times</span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <label className="field">
                  <span>Bench Press PR (kg)</span>
                  <input name="benchPress" type="number" step="0.5" placeholder="e.g. 90" className="field-input" />
                </label>
                <label className="field">
                  <span>Squat PR (kg)</span>
                  <input name="squat" type="number" step="0.5" placeholder="e.g. 120" className="field-input" />
                </label>
                <label className="field">
                  <span>5K Run Time</span>
                  <input name="runTime5k" placeholder="e.g. 24:15" className="field-input" />
                </label>
              </div>
            </div>

            <label className="field">
              <span>Notes / Reflections</span>
              <textarea name="notes" placeholder="How was your energy and recovery this week?" className="field-input" style={{ height: "70px" }} />
            </label>

            <Button type="submit" className="w-full mt-2">Save Checkpoint</Button>
          </form>
        </Modal>
      )}
    </>
  );
}