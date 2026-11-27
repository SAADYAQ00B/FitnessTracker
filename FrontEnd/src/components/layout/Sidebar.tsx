import { NavLink, useNavigate } from "react-router";
import { Home, Dumbbell, Apple, TrendingUp, BarChart3, Bell, User, Settings, CircleHelp, LogOut, X, ShieldCheck } from "lucide-react";
import { Logo } from "../common/Logo";
import { useApp } from "../../context/AppContext";
import { isAdmin } from "../../app/authGuard";

export function Sidebar({ mobileOpen, setMobileOpen }: { mobileOpen: boolean; setMobileOpen: (v: boolean) => void }) {
  const { notify } = useApp();
  const navigate = useNavigate();
  const userIsAdmin = isAdmin();
  
  const navGroups = [
    { 
      caption: "YOUR FITNESS", 
      items: [
        { to: "/dashboard", label: "Overview", icon: Home }, 
        { to: "/dashboard/workouts", label: "Workouts", icon: Dumbbell }, 
        { to: "/dashboard/nutrition", label: "Nutrition", icon: Apple }, 
        { to: "/dashboard/progress", label: "Progress", icon: TrendingUp }, 
        { to: "/dashboard/analytics", label: "Analytics", icon: BarChart3 }, 
        { to: "/dashboard/reminders", label: "Reminders", icon: Bell }
      ] 
    },
    { 
      caption: "ACCOUNT", 
      items: [
        { to: "/dashboard/profile", label: "Profile", icon: User }, 
        { to: "/dashboard/settings", label: "Settings", icon: Settings }, 
        { to: "/dashboard/support", label: "Help Center", icon: CircleHelp }
      ] 
    },
    ...(userIsAdmin ? [
      {
        caption: "ADMINISTRATION",
        items: [
          { to: "/admin", label: "Admin Panel", icon: ShieldCheck }
        ]
      }
    ] : [])
  ];

  const handleSignOut = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    notify("Signed out successfully");
    navigate("/login");
  };

  return (
    <aside 
      className={`sidebar-drawer fixed inset-y-0 left-0 z-50 flex w-[260px] max-w-[85vw] flex-col border-r px-4 py-6 transition-all duration-300 lg:translate-x-0 lg:visible lg:pointer-events-auto ${
        mobileOpen 
          ? "is-open translate-x-0 visible pointer-events-auto shadow-2xl" 
          : "-translate-x-full invisible pointer-events-none"
      }`} 
      style={{ background: "var(--surface)", borderColor: "var(--line)" }}
      aria-hidden={!mobileOpen}
    >
      {/* Logo Section */}
      <div className="flex items-center justify-between px-2 mb-8">
        <Logo />
        {mobileOpen && (
          <button 
            type="button"
            className="icon-button lg:hidden" 
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Navigation Links */}
      <nav className="space-y-6">
        {navGroups.map((group) => (
          <div key={group.caption}>
            <p className="eyebrow px-3 pb-3">{group.caption}</p>
            <div className="space-y-1">
              {group.items.map(({ to, label, icon: Icon }) => (
                <NavLink 
                  key={to} 
                  to={to} 
                  end={to === "/dashboard"} 
                  onClick={() => setMobileOpen(false)} 
                  className={({ isActive }) => `nav-item ${isActive ? "nav-item-active" : ""}`}
                >
                  <Icon size={18} /> {label}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Sign Out Button pushed to bottom */}
      <div className="mt-auto pt-6">
        <button 
          className="nav-item w-full text-left text-muted hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer" 
          onClick={handleSignOut}
        >
          <LogOut size={18} /> Sign out
        </button>
      </div>
    </aside>
  );
}
