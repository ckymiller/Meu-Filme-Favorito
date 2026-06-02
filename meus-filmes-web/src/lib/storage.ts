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
  userRating: number | null;
}

const MOVIES_KEY = "@meusfilmes/movies/v1";
const PREFS_KEY = "@meusfilmes/prefs/v1";

export interface Prefs {
  viewMode: "list" | "grid";
}

export function loadMovies(): Movie[] {
  try {
    const raw = localStorage.getItem(MOVIES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return (parsed as Movie[]).map((m) => ({ ...m, userRating: m.userRating ?? null }));
  } catch {
    return [];
  }
}

export function saveMovies(movies: Movie[]): void {
  try {
    localStorage.setItem(MOVIES_KEY, JSON.stringify(movies));
  } catch {
    // ignore quota errors
  }
}

export function loadPrefs(): Prefs {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (!raw) return { viewMode: "list" };
    const parsed = JSON.parse(raw) as Partial<Prefs>;
    return { viewMode: parsed.viewMode === "grid" ? "grid" : "list" };
  } catch {
    return { viewMode: "list" };
  }
}

export function savePrefs(prefs: Prefs): void {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  } catch {
    // ignore
  }
}

export function makeId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function compareTitle(a: Movie, b: Movie): number {
  return a.titlePtBr.localeCompare(b.titlePtBr, "pt-BR", { sensitivity: "base" });
}
