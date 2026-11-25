import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Zap, Sparkles, User, Bell, ShieldCheck, Download, Trash2, CheckCircle2, AlertTriangle } from "lucide-react";
import { useApp } from "../context/AppContext";
import { useTheme, ThemePreset } from "../context/ThemeContext";
import { PageHeader } from "../components/common/PageHeader";
import { Card } from "../components/common/Card";
import { Button } from "../components/common/Button";
import { Modal } from "../components/common/Modal";
import { getUser, updateUser, exportUserData, deleteAccount } from "../services/userService";

export function SettingsPage() {
  const { notify } = useApp();
  const navigate = useNavigate();
  const { preset, setPreset, mode, toggleMode } = useTheme();
  const [activeSection, setActiveSection] = useState(0);
  const [units, setUnits] = useState<"Metric" | "Imperial">("Metric");
  const [prefs, setPrefs] = useState([true, true, false, true]);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getUser()
      .then((user) => {
        if (user) {
          if (user.units) setUnits(user.units);
          // Only adopt user.themePreset from DB if localStorage doesn't have an explicit user choice:
          const localPreset = localStorage.getItem("forma-preset") as ThemePreset | null;
          if (!localPreset && user.themePreset) {
            setPreset(user.themePreset as ThemePreset);
          }
          if (user.notificationPrefs) {
            setPrefs([
              user.notificationPrefs.workoutReminders ?? true,
              user.notificationPrefs.goalAchievements ?? true,
              user.notificationPrefs.weeklyReport ?? false,
              user.notificationPrefs.communityUpdates ?? true,
            ]);
          }
        }
      })
      .catch((err) => console.error("Failed to fetch settings from profile", err));
  }, [setPreset]);

  const handleSaveChanges = async () => {
    setSaving(true);
    try {
      await updateUser({
        units,
        themePreset: preset,
        themeMode: mode,
        notificationPrefs: {
          workoutReminders: prefs[0],
          goalAchievements: prefs[1],
          weeklyReport: prefs[2],
          communityUpdates: prefs[3],
        },
      });
      notify("Settings and preferences saved to cloud!");
    } catch (err: any) {
      notify(err.response?.data?.msg || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const handleExportData = async () => {
    setIsExporting(true);
    try {
      notify("Preparing GDPR data package...");
      await exportUserData();
      notify("GDPR Data package downloaded!");
    } catch (err: any) {
      notify(err.response?.data?.msg || "Failed to export data");
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmation.toLowerCase() !== "delete") {
      alert("Please type 'delete' to confirm account deletion.");
      return;
    }

    setIsDeleting(true);
    try {
      await deleteAccount();
      notify("Account and all personal records deleted permanently.");
      navigate("/");
    } catch (err: any) {
      notify(err.response?.data?.msg || "Failed to delete account");
      setIsDeleting(false);
    }
  };

  return (
    <>
      <PageHeader 
        eyebrow="PREFERENCES" 
        title="Settings" 
        description="Shape the application around the way you train, live, and view your data." 
        action={
          <Button onClick={handleSaveChanges} disabled={saving}>
            {saving ? "Saving..." : "Save changes"}
          </Button>
        } 
      />
      
      <div className="settings-layout">
        <div className="settings-nav">
          {["Theme & Appearance", "Measurements & Units", "Notifications", "Privacy & GDPR"].map((x, i) => (
            <button 
              key={x} 
              className={`cursor-pointer ${activeSection === i ? "active" : ""}`}
              onClick={() => setActiveSection(i)}
            >
              {x}
            </button>
          ))}
        </div>
        
        <div className="settings-content space-y-6">
          {/* THEME & APPEARANCE */}
          <Card>
            <div className="card-head">
              <div>
                <span className="eyebrow">APPEARANCE</span>
                <h2>Theme preset</h2>
              </div>
            </div>
            <div className="theme-options">
              <button 
                type="button"
                className={`cursor-pointer ${preset === "fitness1" ? "active" : ""}`} 
                onClick={() => { 
                  setPreset("fitness1"); 
                  notify("Emerald Mint theme applied"); 
                }}
              >
                <span><Zap size={24} /></span>
                <strong>Theme 1 — Emerald Mint</strong>
                <small>Dark / emerald · default</small>
              </button>
              <button 
                type="button"
                className={`cursor-pointer ${preset === "fitness2" ? "active" : ""}`} 
                onClick={() => { 
                  setPreset("fitness2"); 
                  notify("Purple Steel theme applied"); 
                }}
              >
                <span><Sparkles size={24} /></span>
                <strong>Theme 2 — Purple Steel</strong>
                <small>Purple / clean · fitness2</small>
              </button>
            </div>

            <div className="flex items-center justify-between mt-6 pt-6 border-t" style={{ borderColor: "var(--line)" }}>
              <div>
                <strong className="text-sm block" style={{ color: "var(--color-white, white)" }}>
                  {mode === "dark" ? "Dark mode" : "Light mode"}
                </strong>
                <span className="text-xs text-muted">Toggle between dark and light appearance modes.</span>
              </div>
              <button 
                type="button"
                className={`w-12 h-7 rounded-full p-1 transition cursor-pointer ${mode === "dark" ? "bg-[var(--color-lime)]" : "bg-white/10"}`} 
                onClick={toggleMode}
                title="Toggle Mode"
              >
                <div className={`size-5 bg-white rounded-full transition ${mode === "dark" ? "translate-x-5" : ""}`} />
              </button>
            </div>
          </Card>

          {/* MEASUREMENTS & UNITS */}
          <Card>
            <div className="card-head">
              <div>
                <span className="eyebrow">MEASUREMENTS</span>
                <h2>Units of measurement</h2>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button 
                type="button"
                className={`border rounded-xl p-4 text-left cursor-pointer transition ${units === "Metric" ? "border-[var(--color-lime)] bg-[color-mix(in_srgb,var(--color-lime)_10%,transparent)]" : "border-[var(--line)] hover:bg-white/5"}`} 
                onClick={() => setUnits("Metric")}
              >
                <strong className="block text-sm" style={{ color: "var(--color-white, white)" }}>Metric</strong>
                <span className="text-[10px] text-muted">kg, cm, km</span>
              </button>
              <button 
                type="button"
                className={`border rounded-xl p-4 text-left cursor-pointer transition ${units === "Imperial" ? "border-[var(--color-lime)] bg-[color-mix(in_srgb,var(--color-lime)_10%,transparent)]" : "border-[var(--line)] hover:bg-white/5"}`} 
                onClick={() => setUnits("Imperial")}
              >
                <strong className="block text-sm" style={{ color: "var(--color-white, white)" }}>Imperial</strong>
                <span className="text-[10px] text-muted">lb, in, mi</span>
              </button>
            </div>
          </Card>

          {/* NOTIFICATION PREFERENCES */}
          <Card>
            <div className="card-head">
              <div>
                <span className="eyebrow">NOTIFICATIONS</span>
                <h2>Stay in the loop</h2>
              </div>
            </div>
            {["Workout reminders", "Goal achievements", "Weekly progress report", "Community updates"].map((x, i) => (
              <div className="setting-row border-t first:border-t-0 py-3 flex items-center justify-between" style={{ borderColor: "var(--line)" }} key={x}>
                <div>
                  <strong className="text-sm block" style={{ color: "var(--color-white, white)" }}>{x}</strong>
                  <span className="text-xs text-muted">
                    {i === 0 ? "Scheduled training nudges and alerts" : i === 1 ? "Celebrate milestones and PR breakthroughs" : i === 2 ? "A summary recap of your weekly stats" : "Updates, replies, and encouragement"}
                  </span>
                </div>
                <button 
                  type="button"
                  className={`w-10 h-6 rounded-full p-1 transition cursor-pointer ${prefs[i] ? "bg-[var(--color-lime)]" : "bg-white/10"}`} 
                  onClick={() => setPrefs(prefs.map((p, n) => (n === i ? !p : p)))}
                >
                  <div className={`size-4 bg-white rounded-full transition ${prefs[i] ? "translate-x-4" : ""}`} />
                </button>
              </div>
            ))}
          </Card>

          {/* PRIVACY & GDPR COMPLIANCE */}
          <Card>
            <div className="card-head">
              <div>
                <span className="eyebrow">PRIVACY & GDPR COMPLIANCE</span>
                <h2>Account & Data Rights</h2>
              </div>
            </div>
            <p className="text-xs text-muted mb-4 leading-relaxed">
              In accordance with GDPR data privacy regulations, you have full ownership of your fitness data. You can download a complete export of all your workouts, nutrition logs, measurements, and reminders at any time, or request permanent deletion of your account and records.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button 
                variant="secondary" 
                icon={Download} 
                onClick={handleExportData}
                disabled={isExporting}
              >
                {isExporting ? "Exporting..." : "Export my data (JSON)"}
              </Button>
              <Button 
                variant="danger" 
                icon={Trash2} 
                onClick={() => setIsDeleteModalOpen(true)}
              >
                Delete account
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* DELETE ACCOUNT CONFIRMATION MODAL */}
      {isDeleteModalOpen && (
        <Modal title="Delete Account Permanently" onClose={() => setIsDeleteModalOpen(false)}>
          <div className="space-y-4">
            <div className="p-4 rounded-xl border border-red-500/30 bg-red-500/10 flex items-start gap-3">
              <AlertTriangle className="text-red-400 shrink-0 mt-0.5" size={20} />
              <div className="text-xs text-red-200 leading-relaxed">
                <strong className="block text-red-400 font-bold mb-1">Warning: Irreversible GDPR Action</strong>
                This action will immediately and permanently delete your profile, workout routines, session history, nutrition logs, progress measurements, and reminders from the database.
              </div>
            </div>

            <p className="text-xs text-muted">
              To confirm that you want to delete your account, type <strong>delete</strong> below:
            </p>

            <input 
              type="text" 
              placeholder="Type delete to confirm"
              value={deleteConfirmation}
              onChange={(e) => setDeleteConfirmation(e.target.value)}
              className="field-input text-sm"
            />

            <div className="flex gap-2 justify-end pt-2">
              <Button variant="secondary" onClick={() => setIsDeleteModalOpen(false)}>
                Cancel
              </Button>
              <Button 
                variant="danger" 
                onClick={handleDeleteAccount}
                disabled={deleteConfirmation.toLowerCase() !== "delete" || isDeleting}
              >
                {isDeleting ? "Deleting..." : "Permanently Delete Everything"}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}