import { useMovies } from "../contexts/MoviesContext";
import { usePreferences } from "../contexts/PreferencesContext";
import { MovieRow } from "../components/MovieRow";
import { MovieGridCard } from "../components/MovieGridCard";
import type { MovieStatus } from "../lib/storage";

const STATUS_CONFIG: Record<
  MovieStatus,
  { title: string; emptyTitle: string; emptyText: string }
> = {
  want: {
    title: "Quero Ver",
    emptyTitle: "Nenhum filme aqui",
    emptyText: "Toque no botão + para adicionar filmes que você quer assistir.",
  },
  watched: {
    title: "Já Vi",
    emptyTitle: "Nenhum filme aqui",
    emptyText: "Os filmes que você já viu aparecem aqui em ordem alfabética.",
  },
  abandoned: {
    title: "Desisti",
    emptyTitle: "Nenhum filme aqui",
    emptyText: "Filmes que você começou e decidiu não terminar ficam aqui.",
  },
};

interface Props {
  status: MovieStatus;
}

export function HomePage({ status }: Props) {
  const { byStatus } = useMovies();
  const { viewMode } = usePreferences();
  const movies = byStatus(status);
  const config = STATUS_CONFIG[status];

  if (movies.length === 0) {
    return (
      <div className="empty-state">
        <span className="empty-state-icon">🎬</span>
        <span className="empty-state-title">{config.emptyTitle}</span>
        <span className="empty-state-text">{config.emptyText}</span>
      </div>
    );
  }

  if (viewMode === "grid") {
    return (
      <div className="movie-grid">
        {movies.map((m) => (
          <MovieGridCard key={m.id} movie={m} />
        ))}
      </div>
    );
  }

  return (
    <div className="movie-list">
      {movies.map((m) => (
        <MovieRow key={m.id} movie={m} />
      ))}
    </div>
  );
}
