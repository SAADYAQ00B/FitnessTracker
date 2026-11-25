import { useState, useEffect, FormEvent } from "react";
import { Plus, Apple, Target, Dumbbell, Trash2, Bell, Check } from "lucide-react";
import { useApp } from "../context/AppContext";
import { PageHeader } from "../components/common/PageHeader";
import { Card } from "../components/common/Card";
import { Button } from "../components/common/Button";
import { Modal } from "../components/common/Modal";
import {
  getReminders,
  addReminder,
  toggleReminder,
  deleteReminder,
  ReminderItem,
} from "../services/reminderService";

export function RemindersPage() {
  const { notify } = useApp();
  const [items, setItems] = useState<ReminderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);

  const fetchReminders = async () => {
    setLoading(true);
    try {
      const data = await getReminders();
      setItems(data);
    } catch (err) {
      console.error("Failed to load reminders", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReminders();
  }, []);

  const handleAdd = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newReminder = {
      title: formData.get("title") as string,
      schedule: formData.get("schedule") as string,
      type: (formData.get("type") as any) || "workout",
      active: true,
    };

    try {
      const created = await addReminder(newReminder);
      setItems([created, ...items]);
      setIsAddOpen(false);
      notify("Reminder scheduled successfully!");
    } catch (err: any) {
      notify(err.response?.data?.msg || "Failed to add reminder");
    }
  };

  const handleToggle = async (id: string, currentActive: boolean) => {
    try {
      const nextActive = !currentActive;
      setItems(items.map((x) => ((x.id === id || x._id === id) ? { ...x, active: nextActive } : x)));
      await toggleReminder(id, nextActive);
      notify(nextActive ? "Reminder enabled" : "Reminder paused");
    } catch (err: any) {
      // Revert if error
      setItems(items.map((x) => ((x.id === id || x._id === id) ? { ...x, active: currentActive } : x)));
      notify(err.response?.data?.msg || "Failed to update reminder");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteReminder(id);
      setItems(items.filter((x) => x.id !== id && x._id !== id));
      notify("Reminder removed");
    } catch (err: any) {
      notify(err.response?.data?.msg || "Failed to remove reminder");
    }
  };

  const activeCount = items.filter((x) => x.active).length;

  return (
    <>
      <PageHeader 
        eyebrow="STAY CONSISTENT" 
        title="Reminders & Alerts" 
        description="Build lifelong habits with timely nudges for workouts, meal times, and fitness milestones." 
        action={<Button icon={Plus} onClick={() => setIsAddOpen(true)}>New reminder</Button>} 
      />
      
      <div className="grid lg:grid-cols-[1.5fr_.8fr] gap-5">
        <Card className="flex flex-col">
          <div className="card-head">
            <div>
              <span className="eyebrow">SCHEDULE</span>
              <h2>Your reminders</h2>
            </div>
            <span className="px-2.5 py-1 bg-green-500/10 text-green-500 rounded-lg text-xs font-bold">
              {activeCount} active
            </span>
          </div>

          {items.length > 0 ? (
            <div className="space-y-4">
              {items.map((r) => {
                const remId = (r.id || r._id) as string;
                return (
                  <div key={remId} className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition">
                    <span 
                      className={`size-10 rounded-xl grid place-items-center shrink-0 ${
                        r.type === "meal" 
                          ? "bg-green-500/15 text-green-500" 
                          : r.type === "goal" 
                          ? "bg-red-500/15 text-red-500" 
                          : "bg-[color-mix(in_srgb,var(--color-lime)_15%,transparent)] text-[var(--color-lime)]"
                      }`}
                    >
                      {r.type === "meal" ? <Apple size={18} /> : r.type === "goal" ? <Target size={18} /> : <Dumbbell size={18} />}
                    </span>
                    <div className="flex-1 min-w-0">
                      <strong className="block text-sm truncate" style={{ color: "var(--color-white, white)" }}>
                        {r.title}
                      </strong>
                      <span className="text-xs text-muted truncate block">{r.schedule}</span>
                    </div>

                    {/* Active Toggle Switch */}
                    <button 
                      className={`w-10 h-6 rounded-full p-1 transition cursor-pointer shrink-0 ${
                        r.active ? "bg-[var(--color-lime)]" : "bg-white/10"
                      }`} 
                      onClick={() => handleToggle(remId, r.active)}
                      title={r.active ? "Click to pause" : "Click to activate"}
                    >
                      <div className={`size-4 bg-white rounded-full transition ${r.active ? "translate-x-4" : ""}`} />
                    </button>

                    {/* Delete button */}
                    <button 
                      className="icon-button text-muted hover:text-red-400 shrink-0" 
                      onClick={() => handleDelete(remId)}
                      title="Delete reminder"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-16 text-muted text-xs my-auto">
              No reminders scheduled yet.
              <p className="mt-1 text-white/70">Click "New reminder" to set nudges for workouts and meal prep.</p>
            </div>
          )}
        </Card>

        {/* MOTIVATION CARD */}
        <Card style={{ background: "linear-gradient(145deg, #1f1a33, #3b2e70)", border: "none" }}>
          <span className="size-12 rounded-2xl bg-white/10 grid place-items-center mb-6" style={{ color: "white" }}>
            <Bell size={24} />
          </span>
          <h2 className="text-xl font-bold" style={{ color: "white" }}>Consistency compounds</h2>
          <p className="text-sm mt-2 mb-6" style={{ color: "rgba(255,255,255,0.7)" }}>
            Members who maintain active reminders complete 34% more weekly workouts on average.
          </p>
          <div className="grid grid-cols-7 gap-1">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d, i) => (
              <span 
                key={d} 
                className={`aspect-square rounded flex items-center justify-center text-[10px] ${
                  i < (activeCount > 0 ? 5 : 2) ? "bg-[#8166ed] text-white" : "bg-white/10 text-white/50"
                }`}
              >
                {i < (activeCount > 0 ? 5 : 2) ? <Check size={14} /> : i + 1}
              </span>
            ))}
          </div>
        </Card>
      </div>

      {/* NEW REMINDER MODAL */}
      {isAddOpen && (
        <Modal title="Schedule New Reminder" onClose={() => setIsAddOpen(false)}>
          <form onSubmit={handleAdd} className="space-y-4">
            <label className="field">
              <span>Reminder Title</span>
              <input name="title" required placeholder="e.g. Morning Movement Session" className="field-input" />
            </label>
            <label className="field">
              <span>Schedule / Time</span>
              <input name="schedule" required placeholder="e.g. Weekdays · 7:00 AM" className="field-input" />
            </label>
            <label className="field">
              <span>Type</span>
              <select name="type" className="field-input">
                <option value="workout">Workout Routine</option>
                <option value="meal">Meal / Fueling</option>
                <option value="goal">Goal / Checkpoint</option>
                <option value="general">General Habit</option>
              </select>
            </label>
            <Button type="submit" className="w-full mt-2">Save Reminder</Button>
          </form>
        </Modal>
      )}
    </>
  );
}