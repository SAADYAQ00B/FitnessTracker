import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import { updateUser } from "../services/userService";

export type ThemePreset = "fitness1" | "fitness2";
export type ThemeMode = "dark" | "light";

export type ThemeContextValue = {
  preset: ThemePreset;
  setPreset: (p: ThemePreset) => void;
  mode: ThemeMode;
  toggleMode: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preset, setPreset] = useState<ThemePreset>(() => {
    try { return (localStorage.getItem("forma-preset") as ThemePreset) || "fitness1"; } catch { return "fitness1"; }
  });
  const [mode, setMode] = useState<ThemeMode>(() => {
    try { return (localStorage.getItem("kinetic-theme") as ThemeMode) || "dark"; } catch { return "dark"; }
  });

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = mode;
    root.dataset.preset = preset;
    root.classList.toggle("dark", preset === "fitness2" && mode === "dark");
    try {
      localStorage.setItem("kinetic-theme", mode);
      localStorage.setItem("forma-preset", preset);
    } catch {}
  }, [preset, mode]);

  const handleSetPreset = (p: ThemePreset) => {
    setPreset(p);
    try {
      localStorage.setItem("forma-preset", p);
      if (localStorage.getItem("token")) {
        updateUser({ themePreset: p }).catch(() => {});
      }
    } catch {}
  };

  const handleToggleMode = () => {
    setMode((m) => {
      const next = m === "dark" ? "light" : "dark";
      try {
        localStorage.setItem("kinetic-theme", next);
        if (localStorage.getItem("token")) {
          updateUser({ themeMode: next }).catch(() => {});
        }
      } catch {}
      return next;
    });
  };

  const value = useMemo(
    () => ({
      preset,
      setPreset: handleSetPreset,
      mode,
      toggleMode: handleToggleMode,
    }),
    [preset, mode]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
};