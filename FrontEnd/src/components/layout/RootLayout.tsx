import { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { useApp } from "../../context/AppContext";
import { useTheme } from "../../context/ThemeContext";
import { CheckCircle2 } from "lucide-react";

export function RootLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { toasts } = useApp();
  const location = useLocation();
  const { preset, mode } = useTheme();

  useEffect(() => {
    setMobileOpen(false);
    window.scrollTo(0, 0);

    // Ensure authenticated dashboard routes use the user's saved preset & mode
    document.documentElement.dataset.preset = preset;
    document.documentElement.dataset.theme = mode;
    document.documentElement.classList.toggle("dark", preset === "fitness2" && mode === "dark");
  }, [location.pathname, preset, mode]);

  return (
    <div className="app-shell min-h-screen" style={{ background: "var(--color-canvas)" }}>
      <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
      <div className="lg:pl-[248px]">
        <Topbar setMobileOpen={setMobileOpen} />
        <main className="px-4 py-7 sm:px-7 lg:px-9 lg:py-9">
          <Outlet />
        </main>
      </div>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}
      <div className="fixed bottom-5 right-5 z-[70] space-y-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold shadow-2xl"
            style={{
              background: "var(--surface)",
              border: "1px solid var(--line)",
              color: "var(--color-foreground)",
            }}
          >
            <CheckCircle2 size={18} style={{ color: "var(--color-lime)" }} />
            {t.message}
          </div>
        ))}
      </div>
    </div>
  );
}