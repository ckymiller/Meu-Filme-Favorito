import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { type Prefs, loadPrefs, savePrefs } from "../lib/storage";

interface PreferencesContextValue extends Prefs {
  setViewMode: (mode: Prefs["viewMode"]) => void;
  toggleViewMode: () => void;
}

const PreferencesContext = createContext<PreferencesContextValue | null>(null);

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefs] = useState<Prefs>(() => loadPrefs());

  const persist = useCallback((next: Prefs) => {
    setPrefs(next);
    savePrefs(next);
  }, []);

  const setViewMode = useCallback(
    (mode: Prefs["viewMode"]) => persist({ ...prefs, viewMode: mode }),
    [prefs, persist],
  );

  const toggleViewMode = useCallback(
    () => persist({ ...prefs, viewMode: prefs.viewMode === "list" ? "grid" : "list" }),
    [prefs, persist],
  );

  const value = useMemo<PreferencesContextValue>(
    () => ({ ...prefs, setViewMode, toggleViewMode }),
    [prefs, setViewMode, toggleViewMode],
  );

  return (
    <PreferencesContext.Provider value={value}>
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences(): PreferencesContextValue {
  const ctx = useContext(PreferencesContext);
  if (!ctx) throw new Error("usePreferences fora do PreferencesProvider");
  return ctx;
}
