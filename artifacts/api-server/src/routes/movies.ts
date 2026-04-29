import { Router, type IRouter } from "express";
import { SearchMoviesQueryParams, SearchMoviesResponseItem } from "@workspace/api-zod";

const router: IRouter = Router();

const TMDB_BASE = "https://api.themoviedb.org/3";
const POSTER_BASE = "https://image.tmdb.org/t/p/w342";

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

router.get("/movies/search", async (req, res) => {
  const apiKey = process.env.TMDB_API_KEY;
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
    const ptUrl = new URL(`${TMDB_BASE}/search/movie`);
    ptUrl.searchParams.set("api_key", apiKey);
    ptUrl.searchParams.set("query", query);
    ptUrl.searchParams.set("language", "pt-BR");
    ptUrl.searchParams.set("include_adult", "false");

    const response = await fetch(ptUrl.toString());
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

export default router;
