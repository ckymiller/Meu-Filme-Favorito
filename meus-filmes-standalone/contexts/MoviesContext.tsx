import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { setMovieActionsHandlers } from "@/components/MovieActions";

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

export type NewMovieInput = Omit<Movie, "id" | "addedAt">;

interface MoviesContextValue {
  movies: Movie[];
  loaded: boolean;
  byStatus: (status: MovieStatus) => Movie[];
  findById: (id: string) => Movie | undefined;
  hasTmdbId: (tmdbId: number | null) => boolean;
  addMovie: (input: NewMovieInput) => Promise<void>;
  updateStatus: (id: string, status: MovieStatus) => Promise<void>;
  removeMovie: (id: string) => Promise<void>;
}

const STORAGE_KEY = "@meusfilmes/movies/v1";

const MoviesContext = createContext<MoviesContextValue | null>(null);

function compareTitle(a: Movie, b: Movie): number {
  return a.titlePtBr.localeCompare(b.titlePtBr, "pt-BR", { sensitivity: "base" });
}

function makeId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function MoviesProvider({ children }: { children: React.ReactNode }) {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loaded, setLoaded] = useState(false);

  // Load from AsyncStorage on mount
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as Movie[];
          if (Array.isArray(parsed)) setMovies(parsed);
        }
      } catch {
        // ignore corrupt storage
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
      // ignore
    }
  }, []);

  const addMovie = useCallback(
    async (input: NewMovieInput) => {
      const movie: Movie = {
        ...input,
        id: makeId(),
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
    (status: MovieStatus) =>
      movies.filter((m) => m.status === status).sort(compareTitle),
    [movies],
  );

  const findById = useCallback(
    (id: string) => movies.find((m) => m.id === id),
    [movies],
  );

  const hasTmdbId = useCallback(
    (tmdbId: number | null) =>
      tmdbId != null && movies.some((m) => m.tmdbId === tmdbId),
    [movies],
  );

  // Wire long-press / overflow action handlers
  useEffect(() => {
    setMovieActionsHandlers({ updateStatus, removeMovie });
  }, [updateStatus, removeMovie]);

  const value = useMemo<MoviesContextValue>(
    () => ({
      movies,
      loaded,
      byStatus,
      findById,
      hasTmdbId,
      addMovie,
      updateStatus,
      removeMovie,
    }),
    [movies, loaded, byStatus, findById, hasTmdbId, addMovie, updateStatus, removeMovie],
  );

  return <MoviesContext.Provider value={value}>{children}</MoviesContext.Provider>;
}

export function useMovies(): MoviesContextValue {
  const ctx = useContext(MoviesContext);
  if (!ctx) {
    throw new Error("useMovies must be used inside <MoviesProvider>");
  }
  return ctx;
}
