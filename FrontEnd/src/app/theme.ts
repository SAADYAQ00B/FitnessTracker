import { createContext, useContext } from "react";

export type ThemePreset = "fitness1" | "fitness2";
export type ThemeMode = "dark" | "light";

export type ThemeContextValue = {
  preset: ThemePreset;
  setPreset: (p: ThemePreset) => void;
  mode: ThemeMode;
  toggleMode: () => void;
};

export const ThemeContext = createContext<ThemeContextValue | null>(null);
export const useTheme = () => useContext(ThemeContext)!;

/** Applies preset+mode to <html>, keeps both legacy keys and new ones. */
export function applyThemeToDom(preset: ThemePreset, mode: ThemeMode) {
  const root = document.documentElement;
  root.dataset.theme = mode;
  root.dataset.preset = preset;
  root.classList.toggle("dark", preset === "fitness2" && mode === "dark");
  try {
    localStorage.setItem("kinetic-theme", mode);
    localStorage.setItem("forma-preset", preset);
  } catch {}
}

export function readStoredTheme(): { preset: ThemePreset; mode: ThemeMode } {
  let mode: ThemeMode = "dark";
  let preset: ThemePreset = "fitness1";
  try {
    if (localStorage.getItem("kinetic-theme") === "light") mode = "light";
    if (localStorage.getItem("forma-preset") === "fitness2") preset = "fitness2";
  } catch {}
  return { preset, mode };
}