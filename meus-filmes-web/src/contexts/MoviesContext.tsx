import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  type Movie,
  type MovieStatus,
  compareTitle,
  loadMovies,
  makeId,
  saveMovies,
} from "../lib/storage";

export type { Movie, MovieStatus };

type NewMovieInput = Omit<Movie, "id" | "addedAt" | "userRating"> & {
  userRating?: number | null;
};

interface MoviesContextValue {
  movies: Movie[];
  byStatus: (status: MovieStatus) => Movie[];
  findById: (id: string) => Movie | undefined;
  hasTmdbId: (tmdbId: number | null) => boolean;
  addMovie: (input: NewMovieInput) => void;
  updateStatus: (id: string, status: MovieStatus) => void;
  updateUserRating: (id: string, userRating: number | null) => void;
  removeMovie: (id: string) => void;
}

const MoviesContext = createContext<MoviesContextValue | null>(null);

export function MoviesProvider({ children }: { children: ReactNode }) {
  const [movies, setMovies] = useState<Movie[]>(() => loadMovies());

  const persist = useCallback((next: Movie[]) => {
    setMovies(next);
    saveMovies(next);
  }, []);

  const addMovie = useCallback(
    (input: NewMovieInput) => {
      persist([
        ...movies,
        { userRating: null, ...input, id: makeId(), addedAt: Date.now() },
      ]);
    },
    [movies, persist],
  );

  const updateStatus = useCallback(
    (id: string, status: MovieStatus) => {
      persist(movies.map((m) => (m.id === id ? { ...m, status } : m)));
    },
    [movies, persist],
  );

  const updateUserRating = useCallback(
    (id: string, userRating: number | null) => {
      persist(movies.map((m) => (m.id === id ? { ...m, userRating } : m)));
    },
    [movies, persist],
  );

  const removeMovie = useCallback(
    (id: string) => {
      persist(movies.filter((m) => m.id !== id));
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

  const value = useMemo<MoviesContextValue>(
    () => ({
      movies, byStatus, findById, hasTmdbId,
      addMovie, updateStatus, updateUserRating, removeMovie,
    }),
    [movies, byStatus, findById, hasTmdbId, addMovie, updateStatus, updateUserRating, removeMovie],
  );

  return <MoviesContext.Provider value={value}>{children}</MoviesContext.Provider>;
}

export function useMovies(): MoviesContextValue {
  const ctx = useContext(MoviesContext);
  if (!ctx) throw new Error("useMovies fora do MoviesProvider");
  return ctx;
}
