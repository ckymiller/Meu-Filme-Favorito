import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { getApiBaseUrl, useAuth } from "@/lib/auth";

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

interface AddMovieInput {
  tmdbId: number | null;
  titlePtBr: string;
  originalTitle: string;
  year: number | null;
  rating: number | null;
  posterUrl: string | null;
  status: MovieStatus;
}

interface MoviesContextValue {
  movies: Movie[];
  loaded: boolean;
  syncing: boolean;
  addMovie: (input: AddMovieInput) => Promise<void>;
  updateStatus: (id: string, status: MovieStatus) => Promise<void>;
  removeMovie: (id: string) => Promise<void>;
  byStatus: (status: MovieStatus) => Movie[];
  hasTmdbId: (tmdbId: number) => boolean;
  findById: (id: string) => Movie | undefined;
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

interface ServerMovie {
  id: string;
  tmdbId: number | null;
  titlePtBr: string;
  originalTitle: string;
  year: number | null;
  rating: number | null;
  posterUrl: string | null;
  status: MovieStatus;
  addedAt: string;
}

function fromServer(m: ServerMovie): Movie {
  return {
    id: m.id,
    tmdbId: m.tmdbId,
    titlePtBr: m.titlePtBr,
    originalTitle: m.originalTitle,
    year: m.year,
    rating: m.rating,
    posterUrl: m.posterUrl,
    status: m.status,
    addedAt: new Date(m.addedAt).getTime(),
  };
}

function toAddPayload(m: AddMovieInput) {
  return {
    tmdbId: m.tmdbId,
    titlePtBr: m.titlePtBr,
    originalTitle: m.originalTitle,
    year: m.year,
    rating: m.rating,
    posterUrl: m.posterUrl,
    status: m.status,
  };
}

export function MoviesProvider({ children }: { children: React.ReactNode }) {
  const auth = useAuth();
  const { isAuthenticated, isReady, getToken } = auth;
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const lastSyncedUserId = useRef<string | null>(null);

  // Load from local storage on mount
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

  const persistLocal = useCallback(async (next: Movie[]) => {
    setMovies(next);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // best-effort
    }
  }, []);

  const authedFetch = useCallback(
    async (path: string, init?: RequestInit) => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      const apiBase = getApiBaseUrl();
      const headers = new Headers(init?.headers);
      headers.set("Authorization", `Bearer ${token}`);
      if (init?.body && !headers.has("Content-Type")) {
        headers.set("Content-Type", "application/json");
      }
      const res = await fetch(`${apiBase}${path}`, { ...init, headers });
      if (!res.ok) {
        throw new Error(`Request failed: ${res.status}`);
      }
      return res;
    },
    [getToken],
  );

  // Sync with server when auth state becomes ready
  useEffect(() => {
    if (!isReady || !loaded) return;
    if (!isAuthenticated || !auth.user) {
      lastSyncedUserId.current = null;
      return;
    }
    if (lastSyncedUserId.current === auth.user.id) return;
    lastSyncedUserId.current = auth.user.id;

    (async () => {
      setSyncing(true);
      try {
        // 1) Push any local movies up to server (merges by tmdbId)
        const localToPush = movies.map(toAddPayload);
        if (localToPush.length > 0) {
          await authedFetch("/api/me/movies/bulk", {
            method: "POST",
            body: JSON.stringify({ movies: localToPush }),
          });
        }
        // 2) Fetch authoritative state from server
        const res = await authedFetch("/api/me/movies");
        const data = (await res.json()) as ServerMovie[];
        const serverMovies = data.map(fromServer);
        await persistLocal(serverMovies);
      } catch (err) {
        console.warn("Movie sync failed:", err);
      } finally {
        setSyncing(false);
      }
    })();
  }, [isAuthenticated, isReady, loaded, auth.user, authedFetch, movies, persistLocal]);

  const addMovie = useCallback(
    async (input: AddMovieInput) => {
      if (isAuthenticated) {
        try {
          const res = await authedFetch("/api/me/movies", {
            method: "POST",
            body: JSON.stringify(toAddPayload(input)),
          });
          const created = fromServer((await res.json()) as ServerMovie);
          // Merge: if movie with same tmdbId exists, replace it, else append
          const filtered = movies.filter((m) =>
            created.tmdbId != null
              ? m.tmdbId !== created.tmdbId
              : m.id !== created.id,
          );
          await persistLocal([...filtered, created]);
          return;
        } catch (err) {
          console.warn("Falha ao adicionar no servidor, salvando localmente.", err);
        }
      }
      const movie: Movie = {
        ...input,
        id: generateId(),
        addedAt: Date.now(),
      };
      await persistLocal([...movies, movie]);
    },
    [isAuthenticated, authedFetch, movies, persistLocal],
  );

  const updateStatus = useCallback(
    async (id: string, status: MovieStatus) => {
      const next = movies.map((m) => (m.id === id ? { ...m, status } : m));
      await persistLocal(next);
      if (isAuthenticated) {
        try {
          await authedFetch(`/api/me/movies/${id}`, {
            method: "PATCH",
            body: JSON.stringify({ status }),
          });
        } catch (err) {
          console.warn("Falha ao atualizar status no servidor.", err);
        }
      }
    },
    [movies, persistLocal, isAuthenticated, authedFetch],
  );

  const removeMovie = useCallback(
    async (id: string) => {
      await persistLocal(movies.filter((m) => m.id !== id));
      if (isAuthenticated) {
        try {
          await authedFetch(`/api/me/movies/${id}`, { method: "DELETE" });
        } catch (err) {
          console.warn("Falha ao remover no servidor.", err);
        }
      }
    },
    [movies, persistLocal, isAuthenticated, authedFetch],
  );

  const byStatus = useCallback(
    (status: MovieStatus) =>
      sortAlpha(movies.filter((m) => m.status === status)),
    [movies],
  );

  const hasTmdbId = useCallback(
    (tmdbId: number) => movies.some((m) => m.tmdbId === tmdbId),
    [movies],
  );

  const findById = useCallback(
    (id: string) => movies.find((m) => m.id === id),
    [movies],
  );

  const value = useMemo<MoviesContextValue>(
    () => ({
      movies,
      loaded,
      syncing,
      addMovie,
      updateStatus,
      removeMovie,
      byStatus,
      hasTmdbId,
      findById,
    }),
    [movies, loaded, syncing, addMovie, updateStatus, removeMovie, byStatus, hasTmdbId, findById],
  );

  return <MoviesContext.Provider value={value}>{children}</MoviesContext.Provider>;
}

export function useMovies(): MoviesContextValue {
  const ctx = useContext(MoviesContext);
  if (!ctx) throw new Error("useMovies must be used within a MoviesProvider");
  return ctx;
}
