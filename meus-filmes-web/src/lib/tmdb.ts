import { useQuery } from "@tanstack/react-query";

const TMDB_BASE = "https://api.themoviedb.org/3";
const IMG_BASE = "https://image.tmdb.org/t/p";

const apiKey: string = (import.meta.env.VITE_TMDB_API_KEY as string | undefined) ?? "";

export class TmdbError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = "TmdbError";
  }
}

export interface MovieSearchResult {
  tmdbId: number;
  titlePtBr: string;
  originalTitle: string;
  year: number | null;
  rating: number | null;
  posterUrl: string | null;
}

export interface MovieDetail extends MovieSearchResult {
  overview: string | null;
  tagline: string | null;
  genres: string[];
  runtime: number | null;
  backdropUrl: string | null;
}

interface TmdbSearchItem {
  id: number;
  title: string;
  original_title: string;
  release_date?: string;
  vote_average?: number;
  poster_path?: string | null;
}

interface TmdbDetailResponse extends TmdbSearchItem {
  overview?: string | null;
  tagline?: string | null;
  genres?: { id: number; name: string }[];
  runtime?: number | null;
  backdrop_path?: string | null;
}

function ensureApiKey(): void {
  if (!apiKey) {
    throw new TmdbError(
      "Chave TMDB não configurada. Defina VITE_TMDB_API_KEY.",
      0,
    );
  }
}

function posterUrl(path: string | null | undefined, size = "w342"): string | null {
  return path ? `${IMG_BASE}/${size}${path}` : null;
}

function backdropUrl(path: string | null | undefined, size = "w780"): string | null {
  return path ? `${IMG_BASE}/${size}${path}` : null;
}

function yearFrom(date?: string): number | null {
  if (!date) return null;
  const y = parseInt(date.slice(0, 4), 10);
  return Number.isFinite(y) ? y : null;
}

function ratingFrom(v?: number): number | null {
  return typeof v === "number" && Number.isFinite(v) && v > 0 ? v : null;
}

async function tmdbFetch<T>(
  path: string,
  params: Record<string, string | number>,
): Promise<T> {
  ensureApiKey();
  const url = new URL(`${TMDB_BASE}${path}`);
  url.searchParams.set("api_key", apiKey);
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, String(v));
  }
  const res = await fetch(url.toString());
  if (!res.ok) {
    let message = `Erro TMDB ${res.status}`;
    try {
      const data = (await res.json()) as { status_message?: string };
      if (data?.status_message) message = data.status_message;
    } catch {
      // ignore
    }
    throw new TmdbError(message, res.status);
  }
  return (await res.json()) as T;
}

function toSearchResult(item: TmdbSearchItem): MovieSearchResult {
  return {
    tmdbId: item.id,
    titlePtBr: item.title || item.original_title || "Sem título",
    originalTitle: item.original_title || item.title || "",
    year: yearFrom(item.release_date),
    rating: ratingFrom(item.vote_average),
    posterUrl: posterUrl(item.poster_path),
  };
}

export async function searchMovies(query: string): Promise<MovieSearchResult[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];
  const data = await tmdbFetch<{ results: TmdbSearchItem[] }>("/search/movie", {
    query: trimmed,
    language: "pt-BR",
    include_adult: "false",
    page: 1,
  });
  return (data.results ?? []).map(toSearchResult);
}

export async function getMovieDetail(tmdbId: number): Promise<MovieDetail> {
  const ptBr = await tmdbFetch<TmdbDetailResponse>(`/movie/${tmdbId}`, {
    language: "pt-BR",
  });

  let overview = ptBr.overview ?? null;
  let tagline = ptBr.tagline ?? null;

  if (!overview || !tagline) {
    try {
      const en = await tmdbFetch<TmdbDetailResponse>(`/movie/${tmdbId}`, {
        language: "en-US",
      });
      if (!overview) overview = en.overview ?? null;
      if (!tagline) tagline = en.tagline ?? null;
    } catch {
      // ignore
    }
  }

  return {
    ...toSearchResult(ptBr),
    overview: overview?.trim() || null,
    tagline: tagline?.trim() || null,
    genres: (ptBr.genres ?? []).map((g) => g.name),
    runtime: typeof ptBr.runtime === "number" && ptBr.runtime > 0 ? ptBr.runtime : null,
    backdropUrl: backdropUrl(ptBr.backdrop_path),
  };
}

export function useSearchMovies(query: string, enabled = true) {
  return useQuery({
    queryKey: ["tmdb", "search", query.trim()],
    queryFn: () => searchMovies(query),
    enabled: enabled && query.trim().length >= 2,
    staleTime: 1000 * 60 * 5,
  });
}

export function useGetMovieDetail(tmdbId: number | null, enabled = true) {
  return useQuery({
    queryKey: ["tmdb", "detail", tmdbId],
    queryFn: () => getMovieDetail(tmdbId as number),
    enabled: enabled && tmdbId != null,
    staleTime: 1000 * 60 * 30,
  });
}
