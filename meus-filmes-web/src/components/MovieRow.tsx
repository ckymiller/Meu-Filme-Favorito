import { useNavigate } from "react-router-dom";
import type { Movie } from "../lib/storage";
import { MovieActionsMenu } from "./MovieActionsMenu";

interface Props {
  movie: Movie;
}

export function MovieRow({ movie }: Props) {
  const navigate = useNavigate();

  return (
    <div style={{ position: "relative" }}>
      <button
        className="movie-row"
        onClick={() => navigate(`/movie/${movie.id}`)}
        onContextMenu={(e) => { e.preventDefault(); }}
      >
        <div className="movie-poster">
          {movie.posterUrl ? (
            <img src={movie.posterUrl} alt={movie.titlePtBr} loading="lazy" />
          ) : "🎬"}
        </div>
        <div className="movie-info">
          <span className="movie-title">{movie.titlePtBr}</span>
          {movie.originalTitle && movie.originalTitle !== movie.titlePtBr && (
            <span className="movie-original">{movie.originalTitle}</span>
          )}
          <div className="movie-meta">
            {movie.year && <span>{movie.year}</span>}
            {movie.year && movie.rating != null && <span>·</span>}
            {movie.rating != null && (
              <span className="movie-rating" title="Nota TMDB">⭐ {movie.rating.toFixed(1)}</span>
            )}
            {movie.userRating != null && (
              <>
                {(movie.rating != null || movie.year) && <span>·</span>}
                <span className="movie-rating" style={{ color: "#f5c842" }} title="Minha nota">🌟 {movie.userRating.toFixed(1)}</span>
              </>
            )}
          </div>
        </div>
        <MovieActionsMenu movie={movie} />
      </button>
    </div>
  );
}
