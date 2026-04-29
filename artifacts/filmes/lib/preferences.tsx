import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type ViewMode = "list" | "grid";
const PREF_KEY = "@meusfilmes/prefs/v1";

interface Prefs {
  viewMode: ViewMode;
}

interface PreferencesContextValue extends Prefs {
  setViewMode: (mode: ViewMode) => void;
  toggleViewMode: () => void;
}

const DEFAULT: Prefs = { viewMode: "list" };

const PreferencesContext = createContext<PreferencesContextValue>({
  ...DEFAULT,
  setViewMode: () => {},
  toggleViewMode: () => {},
});

export function PreferencesProvider({ children }: { children: React.ReactNode }) {
  const [prefs, setPrefs] = useState<Prefs>(DEFAULT);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(PREF_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as Partial<Prefs>;
          setPrefs({ viewMode: parsed.viewMode === "grid" ? "grid" : "list" });
        }
      } catch {
        // ignore
      }
    })();
  }, []);

  const persist = useCallback(async (next: Prefs) => {
    setPrefs(next);
    try {
      await AsyncStorage.setItem(PREF_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
  }, []);

  const setViewMode = useCallback(
    (mode: ViewMode) => {
      void persist({ ...prefs, viewMode: mode });
    },
    [prefs, persist],
  );

  const toggleViewMode = useCallback(() => {
    void persist({ ...prefs, viewMode: prefs.viewMode === "list" ? "grid" : "list" });
  }, [prefs, persist]);

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
  return useContext(PreferencesContext);
}
