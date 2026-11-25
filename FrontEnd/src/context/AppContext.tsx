import { createContext, useCallback, useContext, useMemo, useState, ReactNode } from "react";

type Toast = { id: number; message: string };

type AppContextValue = {
  notify: (message: string) => void;
  toasts: Toast[];
};

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const notify = useCallback((message: string) => {
    const id = Date.now();
    setToasts((old) => [...old, { id, message }]);
    window.setTimeout(() => setToasts((old) => old.filter((t) => t.id !== id)), 2800);
  }, []);

  const value = useMemo(() => ({ notify, toasts }), [notify, toasts]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
};