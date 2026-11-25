import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Search, Sun, Moon, Bell, Plus, X, Trophy, Apple, TrendingUp, ChevronDown, User, LogOut, Menu } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";

export function Topbar({ setMobileOpen }: { setMobileOpen: (v: boolean) => void }) {
  const { mode, toggleMode } = useTheme();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [user, setUser] = useState<any>(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  });
  const navigate = useNavigate();

  useEffect(() => {
    const handleUserUpdate = () => {
      try {
        const stored = JSON.parse(localStorage.getItem("user") || "null");
        setUser(stored);
      } catch {}
    };

    window.addEventListener("user-updated", handleUserUpdate);
    return () => window.removeEventListener("user-updated", handleUserUpdate);
  }, []);

  const handleSignOut = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const displayName = user?.name || "Fitness User";
  const initials = displayName
    .split(" ")
    .map((n: string) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() || "AM";

  return (
    <header className="sticky top-0 z-30 flex h-[76px] items-center border-b px-4 backdrop-blur-xl sm:px-7 lg:px-9" style={{ borderColor: "var(--line)", background: "color-mix(in srgb, var(--color-canvas) 85%, transparent)" }}>
      <button className="icon-button mr-3 lg:hidden" onClick={() => setMobileOpen(true)} title="Open navigation menu" aria-label="Open navigation menu">
        <Menu size={20} />
      </button>
      
      <form 
        className="relative hidden w-full max-w-[400px] sm:block" 
        onSubmit={(e) => { 
          e.preventDefault(); 
          const data = new FormData(e.currentTarget); 
          const q = String(data.get("q") || "").trim();
          navigate(`/dashboard/workouts?search=${encodeURIComponent(q)}`);
        }}
      >
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={17} />
        <input name="q" className="search-input" placeholder="Search workouts, meals, exercises..." />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md border px-2 py-1 text-[10px] text-muted" style={{ borderColor: "var(--line)" }}>↵ Enter</span>
      </form>

      <div className="ml-auto flex items-center gap-2">
        <button className="icon-button theme-switch" onClick={toggleMode} aria-pressed={mode === "light"} title="Toggle Theme">
          {mode === "dark" ? <Sun className="theme-switch-icon" size={18} /> : <Moon className="theme-switch-icon" size={18} />}
        </button>
        
        {/* Notifications Dropdown */}
        <div className="relative">
          <button className="icon-button" onClick={() => { setNotificationsOpen(!notificationsOpen); setProfileOpen(false); }}>
            <Bell size={18} />
            <span className="absolute right-2 top-2 size-1.5 rounded-full" style={{ background: "var(--color-lime)" }} />
          </button>
          {notificationsOpen && (
            <div className="absolute right-0 top-[48px] w-[min(370px,calc(100vw-32px))] rounded-2xl border p-3 shadow-2xl" style={{ background: "var(--surface)", borderColor: "var(--line)", zIndex: 100 }}>
              <div className="flex items-center justify-between px-2 py-2">
                <div><p className="font-bold" style={{ color: "var(--color-white, white)" }}>Activity Notifications</p><p className="text-xs text-muted">Daily updates & nudges</p></div>
                <button className="icon-button" onClick={() => setNotificationsOpen(false)}><X size={16} /></button>
              </div>
              {[[Trophy, "Goal In Sight", "Keep logging your workouts to build consistency."], [Apple, "Nutrition Reminder", "Track your meals and macros for today."], [TrendingUp, "Progress Check", "Record your weight and body measurements."]].map(([I, title, copy]: any) => (
                <button key={title} className="flex w-full gap-3 rounded-xl p-3 text-left hover:bg-white/5" onClick={() => setNotificationsOpen(false)}>
                  <span className="grid size-9 shrink-0 place-items-center rounded-xl" style={{ background: "color-mix(in srgb, var(--color-lime) 15%, transparent)", color: "var(--color-lime)" }}><I size={17} /></span>
                  <span><span className="block text-sm font-bold" style={{ color: "var(--color-white, white)" }}>{title}</span><span className="text-xs leading-5 text-muted">{copy}</span></span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Profile Dropdown */}
        <div className="relative hidden sm:block">
          <button className="flex items-center gap-2 p-1 rounded-xl hover:bg-white/5" onClick={() => { setProfileOpen(!profileOpen); setNotificationsOpen(false); }}>
            {user?.avatar ? (
              <img src={user.avatar} alt={displayName} className="size-9 rounded-lg object-cover border" style={{ borderColor: "var(--line)" }} />
            ) : (
              <span className="grid size-9 place-items-center rounded-lg text-sm font-black" style={{ background: "color-mix(in srgb, var(--color-lime) 30%, transparent)", color: "var(--color-lime)" }}>
                {initials}
              </span>
            )}
            <span className="text-xs font-bold hidden md:block max-w-[120px] truncate" style={{ color: "var(--color-white, white)" }}>{displayName}</span>
            <ChevronDown size={14} className="text-muted" />
          </button>
          {profileOpen && (
            <div className="absolute right-0 top-[48px] w-48 rounded-xl border p-1 shadow-2xl" style={{ background: "var(--surface)", borderColor: "var(--line)", zIndex: 100 }}>
              <button className="flex w-full items-center gap-2 rounded-lg p-2 text-sm font-medium hover:bg-white/5 text-muted" onClick={() => { navigate("/dashboard/profile"); setProfileOpen(false); }}><User size={16} /> My Profile</button>
              <button className="flex w-full items-center gap-2 rounded-lg p-2 text-sm font-medium hover:bg-white/5 text-red-400" onClick={() => { handleSignOut(); setProfileOpen(false); }}><LogOut size={16} /> Sign out</button>
            </div>
          )}
        </div>

        <button className="btn-primary hidden sm:flex" onClick={() => navigate("/dashboard/workouts")}>
          <Plus size={17} /> Log activity
        </button>
      </div>
    </header>
  );
}