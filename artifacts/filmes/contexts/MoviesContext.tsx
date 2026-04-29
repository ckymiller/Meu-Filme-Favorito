import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type MovieStatus = "want" | "watched" | "abandoned";

export interface Movie {
  id: string;
  tmdbId: number | null;
  titlePtBr: string;
  originalTitle: string;
  year: number | null;
  rating: number | null;
  posterUrl: string | null;
  status: MovieStatus;
  addedAt: number;
}

interface MoviesContextValue {
  movies: Movie[];
  loaded: boolean;
  addMovie: (input: Omit<Movie, "id" | "addedAt">) => Promise<void>;
  updateStatus: (id: string, status: MovieStatus) => Promise<void>;
  removeMovie: (id: string) => Promise<void>;
  byStatus: (status: MovieStatus) => Movie[];
  hasTmdbId: (tmdbId: number) => boolean;
}

const MoviesContext = createContext<MoviesContextValue | null>(null);

const STORAGE_KEY = "@meusfilmes/movies/v1";

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
}

function sortAlpha(list: Movie[]): Movie[] {
  return [...list].sort((a, b) =>
    a.titlePtBr.localeCompare(b.titlePtBr, "pt-BR", { sensitivity: "base" }),
  );
}

export function MoviesProvider({ children }: { children: React.ReactNode }) {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as Movie[];
          if (Array.isArray(parsed)) setMovies(parsed);
        }
      } catch {
        // ignore corrupted storage
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  const persist = useCallback(async (next: Movie[]) => {
    setMovies(next);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // best-effort persistence
    }
  }, []);

  const addMovie = useCallback(
    async (input: Omit<Movie, "id" | "addedAt">) => {
      const movie: Movie = {
        ...input,
        id: generateId(),
        addedAt: Date.now(),
      };
      await persist([...movies, movie]);
    },
    [movies, persist],
  );

  const updateStatus = useCallback(
    async (id: string, status: MovieStatus) => {
      const next = movies.map((m) => (m.id === id ? { ...m, status } : m));
      await persist(next);
    },
    [movies, persist],
  );

  const removeMovie = useCallback(
    async (id: string) => {
      await persist(movies.filter((m) => m.id !== id));
    },
    [movies, persist],
  );

  const byStatus = useCallback(
    (status: MovieStatus) => sortAlpha(movies.filter((m) => m.status === status)),
    [movies],
  );

  const hasTmdbId = useCallback(
    (tmdbId: number) => movies.some((m) => m.tmdbId === tmdbId),
    [movies],
  );

  const value = useMemo<MoviesContextValue>(
    () => ({ movies, loaded, addMovie, updateStatus, removeMovie, byStatus, hasTmdbId }),
    [movies, loaded, addMovie, updateStatus, removeMovie, byStatus, hasTmdbId],
  );

  return <MoviesContext.Provider value={value}>{children}</MoviesContext.Provider>;
}

export function useMovies(): MoviesContextValue {
  const ctx = useContext(MoviesContext);
  if (!ctx) throw new Error("useMovies must be used within a MoviesProvider");
  return ctx;
}
