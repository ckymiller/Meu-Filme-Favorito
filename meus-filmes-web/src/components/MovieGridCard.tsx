import { useNavigate } from "react-router-dom";
import type { Movie } from "../lib/storage";
import { MovieActionsMenu } from "./MovieActionsMenu";

interface Props {
  movie: Movie;
}

export function MovieGridCard({ movie }: Props) {
  const navigate = useNavigate();
  const displayRating = movie.userRating ?? movie.rating;
  const isUserRating = movie.userRating != null;

  return (
    <div style={{ position: "relative" }}>
      <button
        className="movie-grid-card"
        onClick={() => navigate(`/movie/${movie.id}`)}
      >
        <div className="movie-grid-poster">
          {movie.posterUrl ? (
            <img src={movie.posterUrl} alt={movie.titlePtBr} loading="lazy" />
          ) : "🎬"}
          {displayRating != null && (
            <span className="rating-badge">
              {isUserRating ? "🌟" : "⭐"} {displayRating.toFixed(1)}
            </span>
          )}
        </div>
        <span className="movie-grid-title">{movie.titlePtBr}</span>
        {movie.year && <span className="movie-grid-year">{movie.year}</span>}
      </button>
      <div style={{ position: "absolute", top: 6, left: 6 }}>
        <MovieActionsMenu movie={movie} compact />
      </div>
    </div>
  );
}
