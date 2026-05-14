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
          ) : (
            "🎬"
          )}
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
              <span className="movie-rating">
                ⭐ {movie.rating.toFixed(1)}
              </span>
            )}
          </div>
        </div>
        <MovieActionsMenu movie={movie} />
      </button>
    </div>
  );
}
