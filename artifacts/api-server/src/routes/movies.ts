import { Router, type IRouter } from "express";
import {
  GetMovieDetailResponse,
  SearchMoviesQueryParams,
  SearchMoviesResponseItem,
} from "@workspace/api-zod";

const router: IRouter = Router();

const TMDB_BASE = "https://api.themoviedb.org/3";
const POSTER_BASE = "https://image.tmdb.org/t/p/w342";
const BACKDROP_BASE = "https://image.tmdb.org/t/p/w780";

interface TmdbMovie {
  id: number;
  title: string;
  original_title: string;
  release_date?: string;
  vote_average?: number;
  poster_path?: string | null;
}

interface TmdbSearchResponse {
  results?: TmdbMovie[];
}

interface TmdbDetailResponse extends TmdbMovie {
  overview?: string | null;
  backdrop_path?: string | null;
  runtime?: number | null;
  genres?: Array<{ id: number; name: string }>;
  tagline?: string | null;
}

function getApiKey(): string | null {
  return process.env.TMDB_API_KEY ?? null;
}

router.get("/movies/search", async (req, res) => {
  const apiKey = getApiKey();
  if (!apiKey) {
    req.log.error("TMDB_API_KEY is not configured");
    res.status(502).json({ error: "Movie search is not configured on the server" });
    return;
  }

  const parsed = SearchMoviesQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "Missing or invalid 'q' parameter" });
    return;
  }
  const query = parsed.data.q.trim();
  if (!query) {
    res.status(400).json({ error: "Query cannot be empty" });
    return;
  }

  try {
    const url = new URL(`${TMDB_BASE}/search/movie`);
    url.searchParams.set("api_key", apiKey);
    url.searchParams.set("query", query);
    url.searchParams.set("language", "pt-BR");
    url.searchParams.set("include_adult", "false");

    const response = await fetch(url.toString());
    if (!response.ok) {
      req.log.error({ status: response.status }, "TMDB search request failed");
      res.status(502).json({ error: "Failed to reach TMDB" });
      return;
    }
    const body = (await response.json()) as TmdbSearchResponse;
    const items = (body.results ?? []).slice(0, 20).map((m) => {
      const year = m.release_date && /^\d{4}/.test(m.release_date)
        ? parseInt(m.release_date.slice(0, 4), 10)
        : null;
      return SearchMoviesResponseItem.parse({
        tmdbId: m.id,
        titlePtBr: m.title || m.original_title,
        originalTitle: m.original_title,
        year,
        rating: typeof m.vote_average === "number" ? m.vote_average : null,
        posterUrl: m.poster_path ? `${POSTER_BASE}${m.poster_path}` : null,
      });
    });
    res.json(items);
  } catch (err) {
    req.log.error({ err }, "Unexpected error during TMDB search");
    res.status(502).json({ error: "Failed to search movies" });
  }
});

router.get("/movies/:tmdbId", async (req, res) => {
  const apiKey = getApiKey();
  if (!apiKey) {
    res.status(502).json({ error: "Movie detail is not configured on the server" });
    return;
  }
  const tmdbId = parseInt(req.params.tmdbId, 10);
  if (!Number.isFinite(tmdbId) || tmdbId <= 0) {
    res.status(404).json({ error: "Invalid movie id" });
    return;
  }

  try {
    const fetchDetail = async (lang: string): Promise<TmdbDetailResponse | null> => {
      const url = new URL(`${TMDB_BASE}/movie/${tmdbId}`);
      url.searchParams.set("api_key", apiKey);
      url.searchParams.set("language", lang);
      const response = await fetch(url.toString());
      if (response.status === 404) return null;
      if (!response.ok) throw new Error(`TMDB ${response.status}`);
      return (await response.json()) as TmdbDetailResponse;
    };

    const ptDetail = await fetchDetail("pt-BR");
    if (!ptDetail) {
      res.status(404).json({ error: "Movie not found" });
      return;
    }

    let overview = ptDetail.overview && ptDetail.overview.trim() !== "" ? ptDetail.overview : null;
    if (!overview) {
      const enDetail = await fetchDetail("en-US");
      overview = enDetail?.overview && enDetail.overview.trim() !== "" ? enDetail.overview : null;
    }

    const year = ptDetail.release_date && /^\d{4}/.test(ptDetail.release_date)
      ? parseInt(ptDetail.release_date.slice(0, 4), 10)
      : null;

    const detail = GetMovieDetailResponse.parse({
      tmdbId: ptDetail.id,
      titlePtBr: ptDetail.title || ptDetail.original_title,
      originalTitle: ptDetail.original_title,
      year,
      rating: typeof ptDetail.vote_average === "number" ? ptDetail.vote_average : null,
      posterUrl: ptDetail.poster_path ? `${POSTER_BASE}${ptDetail.poster_path}` : null,
      backdropUrl: ptDetail.backdrop_path ? `${BACKDROP_BASE}${ptDetail.backdrop_path}` : null,
      overview,
      runtime: typeof ptDetail.runtime === "number" ? ptDetail.runtime : null,
      genres: (ptDetail.genres ?? []).map((g) => g.name),
      tagline: ptDetail.tagline && ptDetail.tagline.trim() !== "" ? ptDetail.tagline : null,
    });
    res.json(detail);
  } catch (err) {
    req.log.error({ err }, "Failed to fetch TMDB movie detail");
    res.status(502).json({ error: "Failed to fetch movie detail" });
  }
});

export default router;
