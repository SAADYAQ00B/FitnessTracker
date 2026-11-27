import { useState, useEffect, FormEvent } from "react";
import { Search, Plus, Zap, Pencil, Trash2, ArrowRight, Activity, PlusCircle, Trash } from "lucide-react";
import { useApp } from "../context/AppContext";
import { PageHeader } from "../components/common/PageHeader";
import { Card } from "../components/common/Card";
import { Button } from "../components/common/Button";
import { Modal } from "../components/common/Modal";
import {
  getWorkouts,
  createWorkout,
  updateWorkout,
  deleteWorkout,
  completeWorkout,
  getRecentSessions,
  WorkoutRoutine,
  WorkoutSessionItem,
  ExerciseItem,
} from "../services/workoutService";
import { triggerMilestoneNotification } from "../services/mobileNotificationService";

export const CATEGORY_IMAGES: Record<string, string> = {
  Strength: "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=800&q=80",
  Cardio: "https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=800&q=80",
  HIIT: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800&q=80",
  Other: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&q=80",
};

export const getRoutineImage = (routine: { type?: string; image?: string }) => {
  if (routine.image && !routine.image.includes("photo-1517836357463") && !routine.image.includes("photo-1526506118085")) {
    return routine.image;
  }
  return CATEGORY_IMAGES[routine.type || "Strength"] || CATEGORY_IMAGES.Strength;
};

export function WorkoutsPage() {
  const { notify } = useApp();
  const [filter, setFilter] = useState("All");
  const [query, setQuery] = useState("");
  const [routines, setRoutines] = useState<WorkoutRoutine[]>([]);
  const [sessions, setSessions] = useState<WorkoutSessionItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal States
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingRoutine, setEditingRoutine] = useState<WorkoutRoutine | null>(null);
  const [selectedSession, setSelectedSession] = useState<WorkoutSessionItem | null>(null);
  const [showAllSessions, setShowAllSessions] = useState(false);

  // Exercise builder state for Create/Edit Modal
  const [exerciseList, setExerciseList] = useState<ExerciseItem[]>([
    { name: "", sets: 3, reps: 10, weight: 0, notes: "" }
  ]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [workoutsData, sessionsData] = await Promise.all([
        getWorkouts(),
        getRecentSessions(),
      ]);
      setRoutines(workoutsData);
      setSessions(sessionsData);
    } catch (err) {
      console.error("Failed to load workout data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const shownRoutines = routines.filter((r) => {
    const matchesFilter = filter === "All" || r.type === filter;
    const matchesQuery = query === "" || r.title.toLowerCase().includes(query.toLowerCase()) || (r.tag && r.tag.toLowerCase().includes(query.toLowerCase()));
    return matchesFilter && matchesQuery;
  });

  const displayedSessions = showAllSessions ? sessions : sessions.slice(0, 4);

  // Open Create Modal
  const openCreateModal = () => {
    setExerciseList([{ name: "", sets: 3, reps: 10, weight: 0, notes: "" }]);
    setIsCreateOpen(true);
  };

  // Open Edit Modal
  const openEditModal = (routine: WorkoutRoutine) => {
    setEditingRoutine(routine);
    if (routine.exercises && routine.exercises.length > 0) {
      setExerciseList(routine.exercises.map(e => ({ ...e })));
    } else {
      setExerciseList([{ name: "", sets: 3, reps: 10, weight: 0, notes: "" }]);
    }
  };

  // Add Exercise row
  const addExerciseRow = () => {
    setExerciseList([...exerciseList, { name: "", sets: 3, reps: 10, weight: 0, notes: "" }]);
  };

  // Remove Exercise row
  const removeExerciseRow = (index: number) => {
    setExerciseList(exerciseList.filter((_, i) => i !== index));
  };

  // Update Exercise item
  const updateExerciseField = (index: number, field: keyof ExerciseItem, value: any) => {
    const updated = [...exerciseList];
    updated[index] = { ...updated[index], [field]: value };
    setExerciseList(updated);
  };

  // Submit Create Workout
  const handleCreate = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const validExercises = exerciseList.filter(ex => ex.name && ex.name.trim() !== "");
    const workoutType = (formData.get("type") as string) || "Strength";

    const newWorkout: Partial<WorkoutRoutine> = {
      title: formData.get("title") as string,
      type: workoutType,
      image: CATEGORY_IMAGES[workoutType] || CATEGORY_IMAGES.Strength,
      tag: (formData.get("tag") as string) || "Routine",
      duration: Number(formData.get("duration") || 45),
      exercises: validExercises,
      notes: (formData.get("notes") as string) || "",
    };

    try {
      const created = await createWorkout(newWorkout);
      setRoutines([created, ...routines]);
      setIsCreateOpen(false);
      notify("Workout routine created successfully!");
    } catch (err: any) {
      notify(err.response?.data?.msg || "Failed to create workout");
    }
  };

  // Submit Update Workout
  const handleUpdate = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingRoutine?._id && !editingRoutine?.id) return;
    const routineId = (editingRoutine._id || editingRoutine.id) as string;

    const formData = new FormData(e.currentTarget);
    const validExercises = exerciseList.filter(ex => ex.name && ex.name.trim() !== "");

    const updatedData: Partial<WorkoutRoutine> = {
      title: formData.get("title") as string,
      type: formData.get("type") as string,
      tag: (formData.get("tag") as string) || "Routine",
      duration: Number(formData.get("duration") || 45),
      exercises: validExercises,
      notes: (formData.get("notes") as string) || "",
    };

    try {
      const updated = await updateWorkout(routineId, updatedData);
      setRoutines(routines.map(r => ((r._id === routineId || r.id === routineId) ? updated : r)));
      setEditingRoutine(null);
      notify("Routine updated successfully!");
    } catch (err: any) {
      notify(err.response?.data?.msg || "Failed to update routine");
    }
  };

  // Delete Workout
  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this workout routine?")) return;
    try {
      await deleteWorkout(id);
      setRoutines(routines.filter(r => (r._id !== id && r.id !== id)));
      notify("Routine deleted");
    } catch (err: any) {
      notify(err.response?.data?.msg || "Failed to delete workout");
    }
  };

  // Start / Complete Workout
  const handleComplete = async (routine: WorkoutRoutine) => {
    const routineId = (routine._id || routine.id) as string;
    try {
      const res = await completeWorkout(routineId);
      notify("Workout completed! +50 XP recorded.");
      triggerMilestoneNotification("🏆 Milestone Achieved! You hit a new personal best on FITNESSTRACKER!");
      if (res.session) {
        const d = new Date(res.session.date);
        const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        setSessions([{
          id: res.session._id,
          _id: res.session._id,
          title: res.session.title,
          type: res.session.type,
          date: `Today, ${timeStr}`,
          duration: res.session.duration,
          volume: res.session.volume,
          stats: res.session.stats,
          notes: res.session.notes,
        }, ...sessions]);
      }
    } catch (err: any) {
      notify(err.response?.data?.msg || "Failed to log workout session");
    }
  };

  return (
    <>
      <PageHeader 
        eyebrow="TRAINING" 
        title="Workout library" 
        description="Build routines, track sets, reps & weights, and keep your training organized." 
        action={<Button onClick={openCreateModal}><Plus size={17} /> Create workout</Button>} 
      />
      
      {/* Search and Category Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={16} />
          <input 
            value={query} 
            onChange={(e) => setQuery(e.target.value)} 
            placeholder="Search routines or tags..." 
            className="search-input" 
          />
        </div>
        <div className="flex rounded-xl border p-1" style={{ borderColor: "var(--line)", background: "var(--surface)" }}>
          {["All", "Strength", "Cardio", "HIIT"].map((item) => (
            <button 
              key={item} 
              onClick={() => setFilter(item)} 
              className={`px-4 py-2 rounded-lg text-xs font-bold transition ${filter === item ? "bg-[var(--color-lime)] text-[var(--color-ink)]" : "text-muted hover:text-white"}`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      {/* Routine Cards Grid */}
      {shownRoutines.length > 0 ? (
        <div className="grid gap-5 md:grid-cols-2 2xl:grid-cols-3">
          {shownRoutines.map((routine) => {
            const routineId = (routine._id || routine.id) as string;
            return (
              <article key={routineId} className="group overflow-hidden rounded-[20px] border flex flex-col" style={{ borderColor: "var(--line)", background: "var(--surface)" }}>
                <div className="relative h-48 overflow-hidden bg-black/20">
                  <img 
                    src={getRoutineImage(routine)} 
                    alt={routine.title} 
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <span className="absolute left-4 top-4 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wide bg-black/70 text-[var(--color-lime)] backdrop-blur-md border border-white/10">
                    {routine.tag || "Routine"}
                  </span>
                </div>
                <div className="p-5 flex-1 flex flex-col">
                  <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "var(--color-lime)" }}>{routine.type}</p>
                  <h3 className="mt-1 text-xl font-bold" style={{ color: "var(--color-white, white)" }}>{routine.title}</h3>
                  <p className="mt-2 text-sm text-muted">{routine.meta || `${routine.exercises?.length || 0} exercises · ${routine.duration || 45} min`}</p>

                  {/* Exercises list summary */}
                  {routine.exercises && routine.exercises.length > 0 && (
                    <div className="mt-3 space-y-1">
                      {routine.exercises.slice(0, 3).map((ex, idx) => (
                        <div key={idx} className="flex justify-between text-xs text-muted">
                          <span className="font-semibold" style={{ color: "var(--color-white, white)" }}>{ex.name}</span>
                          <span>{ex.sets} sets × {ex.reps} reps {ex.weight > 0 ? `· ${ex.weight}kg` : ""}</span>
                        </div>
                      ))}
                      {routine.exercises.length > 3 && (
                        <p className="text-[11px] text-[var(--color-lime)] pt-1">+{routine.exercises.length - 3} more exercises</p>
                      )}
                    </div>
                  )}

                  <div className="mt-auto pt-5 flex gap-2">
                    <button className="btn-primary flex-1" onClick={() => handleComplete(routine)}>
                      <Zap size={16} /> Complete
                    </button>
                    <button className="icon-button" onClick={() => openEditModal(routine)} title="Edit routine">
                      <Pencil size={16} />
                    </button>
                    <button className="icon-button hover:text-red-400" onClick={() => handleDelete(routineId)} title="Delete routine">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <Card className="text-center py-12">
          <p className="text-muted text-sm mb-4">
            {query || filter !== "All" ? "No workouts matching your search." : "No workout routines created yet."}
          </p>
          <Button onClick={openCreateModal}><Plus size={17} /> Build your first workout</Button>
        </Card>
      )}

      {/* Recent Completed Sessions Card */}
      <Card className="mt-6">
        <div className="card-heading">
          <div><p className="eyebrow">HISTORY</p><h3>Recent sessions</h3></div>
          {sessions.length > 4 && (
            <button className="text-button" style={{ color: "var(--color-lime)" }} onClick={() => setShowAllSessions(!showAllSessions)}>
              {showAllSessions ? "Show Less" : "View all"}
            </button>
          )}
        </div>
        {displayedSessions.length > 0 ? (
          <div className="mt-4 divide-y" style={{ borderColor: "var(--line)" }}>
            {displayedSessions.map((row) => (
              <div key={row.id || row._id} className="grid grid-cols-[1fr_auto] sm:grid-cols-[1.4fr_1fr_1fr_auto] gap-3 py-4 items-center">
                <p className="text-sm font-bold" style={{ color: "var(--color-white, white)" }}>{row.title}</p>
                <p className="hidden sm:block text-xs text-muted">{row.date}</p>
                <p className="text-xs text-muted">{row.stats}</p>
                <button className="icon-button" onClick={() => setSelectedSession(row)} title="View session details">
                  <ArrowRight size={15} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted text-xs">
            No completed sessions recorded yet. Click "Complete" on any routine above to log your training session.
          </div>
        )}
      </Card>

      {/* CREATE WORKOUT MODAL */}
      {isCreateOpen && (
        <Modal title="Create New Routine" onClose={() => setIsCreateOpen(false)}>
          <form onSubmit={handleCreate} className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
            <label className="field">
              <span>Workout Title</span>
              <input name="title" required placeholder="e.g. Upper Body Strength" className="field-input" />
            </label>
            <div className="form-grid">
              <label className="field">
                <span>Category</span>
                <select name="type" className="field-input">
                  <option>Strength</option>
                  <option>Cardio</option>
                  <option>HIIT</option>
                  <option>Other</option>
                </select>
              </label>
              <label className="field">
                <span>Tag</span>
                <input name="tag" placeholder="e.g. Today, Morning" defaultValue="Today" className="field-input" />
              </label>
            </div>
            <label className="field">
              <span>Estimated Duration (min)</span>
              <input name="duration" type="number" required defaultValue="45" min="5" className="field-input" />
            </label>

            {/* Exercises Builder */}
            <div className="pt-2 border-t" style={{ borderColor: "var(--line)" }}>
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs font-bold text-muted uppercase">Exercises (Sets, Reps, Weight)</span>
                <button type="button" onClick={addExerciseRow} className="text-xs text-[var(--color-lime)] font-bold flex items-center gap-1 cursor-pointer">
                  <PlusCircle size={14} /> Add exercise
                </button>
              </div>

              <div className="space-y-3">
                {exerciseList.map((ex, index) => (
                  <div key={index} className="p-3 rounded-xl border space-y-2" style={{ borderColor: "var(--line)", background: "rgba(255,255,255,0.02)" }}>
                    <div className="flex gap-2">
                      <input 
                        placeholder={`Exercise #${index + 1} name`}
                        value={ex.name} 
                        onChange={(e) => updateExerciseField(index, "name", e.target.value)}
                        className="field-input flex-1 text-sm py-1.5"
                        required
                      />
                      {exerciseList.length > 1 && (
                        <button type="button" onClick={() => removeExerciseRow(index)} className="icon-button text-red-400">
                          <Trash size={15} />
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <label className="text-[11px] text-muted">
                        Sets
                        <input 
                          type="number" 
                          min="1" 
                          value={ex.sets} 
                          onChange={(e) => updateExerciseField(index, "sets", Number(e.target.value))}
                          className="field-input text-xs py-1" 
                        />
                      </label>
                      <label className="text-[11px] text-muted">
                        Reps
                        <input 
                          type="number" 
                          min="1" 
                          value={ex.reps} 
                          onChange={(e) => updateExerciseField(index, "reps", Number(e.target.value))}
                          className="field-input text-xs py-1" 
                        />
                      </label>
                      <label className="text-[11px] text-muted">
                        Weight (kg)
                        <input 
                          type="number" 
                          min="0" 
                          step="0.5" 
                          value={ex.weight} 
                          onChange={(e) => updateExerciseField(index, "weight", Number(e.target.value))}
                          className="field-input text-xs py-1" 
                        />
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Button type="submit" className="w-full mt-4">Save Routine</Button>
          </form>
        </Modal>
      )}

      {/* EDIT WORKOUT MODAL */}
      {editingRoutine && (
        <Modal title="Edit Workout Routine" onClose={() => setEditingRoutine(null)}>
          <form onSubmit={handleUpdate} className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
            <label className="field">
              <span>Workout Title</span>
              <input name="title" required defaultValue={editingRoutine.title} className="field-input" />
            </label>
            <div className="form-grid">
              <label className="field">
                <span>Category</span>
                <select name="type" defaultValue={editingRoutine.type} className="field-input">
                  <option>Strength</option>
                  <option>Cardio</option>
                  <option>HIIT</option>
                  <option>Other</option>
                </select>
              </label>
              <label className="field">
                <span>Tag</span>
                <input name="tag" defaultValue={editingRoutine.tag || "Routine"} className="field-input" />
              </label>
            </div>
            <label className="field">
              <span>Estimated Duration (min)</span>
              <input name="duration" type="number" required defaultValue={editingRoutine.duration || 45} min="5" className="field-input" />
            </label>

            {/* Exercises Builder */}
            <div className="pt-2 border-t" style={{ borderColor: "var(--line)" }}>
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs font-bold text-muted uppercase">Exercises (Sets, Reps, Weight)</span>
                <button type="button" onClick={addExerciseRow} className="text-xs text-[var(--color-lime)] font-bold flex items-center gap-1 cursor-pointer">
                  <PlusCircle size={14} /> Add exercise
                </button>
              </div>

              <div className="space-y-3">
                {exerciseList.map((ex, index) => (
                  <div key={index} className="p-3 rounded-xl border space-y-2" style={{ borderColor: "var(--line)", background: "rgba(255,255,255,0.02)" }}>
                    <div className="flex gap-2">
                      <input 
                        placeholder={`Exercise #${index + 1} name`}
                        value={ex.name} 
                        onChange={(e) => updateExerciseField(index, "name", e.target.value)}
                        className="field-input flex-1 text-sm py-1.5"
                        required
                      />
                      {exerciseList.length > 1 && (
                        <button type="button" onClick={() => removeExerciseRow(index)} className="icon-button text-red-400">
                          <Trash size={15} />
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <label className="text-[11px] text-muted">
                        Sets
                        <input 
                          type="number" 
                          min="1" 
                          value={ex.sets} 
                          onChange={(e) => updateExerciseField(index, "sets", Number(e.target.value))}
                          className="field-input text-xs py-1" 
                        />
                      </label>
                      <label className="text-[11px] text-muted">
                        Reps
                        <input 
                          type="number" 
                          min="1" 
                          value={ex.reps} 
                          onChange={(e) => updateExerciseField(index, "reps", Number(e.target.value))}
                          className="field-input text-xs py-1" 
                        />
                      </label>
                      <label className="text-[11px] text-muted">
                        Weight (kg)
                        <input 
                          type="number" 
                          min="0" 
                          step="0.5" 
                          value={ex.weight} 
                          onChange={(e) => updateExerciseField(index, "weight", Number(e.target.value))}
                          className="field-input text-xs py-1" 
                        />
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Button type="submit" className="w-full mt-4">Save Changes</Button>
          </form>
        </Modal>
      )}

      {/* SESSION DETAILS MODAL */}
      {selectedSession && (
        <Modal title="Session Details" onClose={() => setSelectedSession(null)}>
          <div className="space-y-4">
            <div className="p-4 rounded-xl" style={{ background: "rgba(150,150,150,0.05)" }}>
              <h3 className="text-lg font-bold" style={{ color: "var(--color-white, white)" }}>{selectedSession.title}</h3>
              <p className="text-sm text-muted mt-1">{selectedSession.date}</p>
              <p className="text-sm font-bold mt-3" style={{ color: "var(--color-lime)" }}>{selectedSession.stats}</p>
            </div>
            <div className="flex gap-2">
              <Activity size={18} className="text-muted" />
              <p className="text-sm text-muted">Completed with volume of {selectedSession.volume ? `${selectedSession.volume} kg` : "active workout"}.</p>
            </div>
            <Button className="w-full mt-2" onClick={() => setSelectedSession(null)}>Close</Button>
          </div>
        </Modal>
      )}
    </>
  );
}