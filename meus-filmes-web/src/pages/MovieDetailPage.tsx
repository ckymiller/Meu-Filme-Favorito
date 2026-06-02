import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMovies, type MovieStatus } from "../contexts/MoviesContext";
import { useGetMovieDetail } from "../lib/tmdb";

const STATUS_LABELS: Record<MovieStatus, string> = {
  want: "🔖 Quero Ver",
  watched: "✅ Já Vi",
  abandoned: "✖ Desisti",
};

function UserRatingInput({ movieId, current }: { movieId: string; current: number | null }) {
  const { updateUserRating } = useMovies();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(current != null ? String(current) : "");

  const save = () => {
    if (draft.trim() === "") {
      updateUserRating(movieId, null);
      setEditing(false);
      return;
    }
    const v = parseFloat(draft.replace(",", "."));
    if (!Number.isFinite(v) || v < 0.1 || v > 10) {
      alert("Nota inválida. Use um número entre 0.1 e 10.");
      return;
    }
    updateUserRating(movieId, Math.round(v * 10) / 10);
    setEditing(false);
  };

  const stars = Math.round((current ?? 0) / 2);

  if (editing) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <input
          className="form-input"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Ex.: 8.5"
          inputMode="decimal"
          autoFocus
          onKeyDown={(e) => e.key === "Enter" && save()}
          style={{ width: 100, padding: "8px 12px" }}
        />
        <button className="btn btn-primary" onClick={save} style={{ padding: "8px 16px" }}>Salvar</button>
        <button className="btn btn-secondary" onClick={() => setEditing(false)} style={{ padding: "8px 14px" }}>Cancelar</button>
        {current != null && (
          <button
            className="btn btn-ghost"
            onClick={() => { updateUserRating(movieId, null); setDraft(""); setEditing(false); }}
            style={{ padding: "8px 12px", color: "var(--destructive)" }}
          >
            🗑 Remover nota
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}
      onClick={() => { setDraft(current != null ? String(current) : ""); setEditing(true); }}
    >
      {current != null ? (
        <>
          <div style={{ display: "flex", gap: 2 }}>
            {[1, 2, 3, 4, 5].map((i) => (
              <span key={i} style={{ fontSize: 22, opacity: i <= stars ? 1 : 0.2 }}>🌟</span>
            ))}
          </div>
          <span style={{ fontSize: 20, fontWeight: 700, color: "var(--primary)" }}>{current.toFixed(1)}</span>
          <span style={{ fontSize: 13, color: "var(--muted-fg)" }}>/ 10 · Editar</span>
        </>
      ) : (
        <span style={{ fontSize: 14, color: "var(--primary)", fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 20 }}>🌟</span> Avaliar este filme
        </span>
      )}
    </div>
  );
}

export function MovieDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { findById, updateStatus, removeMovie } = useMovies();

  const movie = findById(id ?? "");
  const { data, isFetching } = useGetMovieDetail(movie?.tmdbId ?? null);

  if (!movie) {
    return (
      <div style={{ padding: 24, color: "var(--fg)" }}>
        <p>Filme não encontrado.</p>
        <button className="btn btn-secondary" onClick={() => navigate(-1)} style={{ marginTop: 12 }}>← Voltar</button>
      </div>
    );
  }

  const overview = data?.overview ?? null;
  const tagline = data?.tagline ?? null;
  const genres = data?.genres ?? [];
  const runtime = data?.runtime ?? null;
  const backdropUrl = data?.backdropUrl ?? null;

  const handleRemove = () => {
    if (confirm(`Remover "${movie.titlePtBr}"?`)) {
      removeMovie(movie.id);
      navigate(-1);
    }
  };

  const otherStatuses = (["want", "watched", "abandoned"] as MovieStatus[]).filter(
    (s) => s !== movie.status,
  );

  return (
    <div style={{ minHeight: "100dvh", background: "var(--bg)", display: "flex", flexDirection: "column" }}>
      <header className="topbar">
        <button className="icon-btn" onClick={() => navigate(-1)} style={{ fontSize: 20 }}>←</button>
        <span className="topbar-title" style={{ fontSize: 15, fontWeight: 600 }}>Detalhe</span>
        <div style={{ width: 36 }} />
      </header>

      <div style={{ flex: 1, overflowY: "auto" }}>
        {backdropUrl ? (
          <div className="backdrop-hero-wrap">
            <img className="backdrop-hero" src={backdropUrl} alt="" />
            <div className="backdrop-hero-overlay" />
          </div>
        ) : <div style={{ height: 8 }} />}

        <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 20, maxWidth: 720, margin: "0 auto" }}>
          <div style={{ display: "flex", gap: 16 }}>
            <div className="movie-poster" style={{ width: 110, height: 165, flexShrink: 0, fontSize: 36, borderRadius: 10, border: "1px solid var(--card-border)" }}>
              {movie.posterUrl ? <img src={movie.posterUrl} alt={movie.titlePtBr} /> : "🎬"}
            </div>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
              <h1 style={{ fontSize: 22, fontWeight: 700, lineHeight: 1.3 }}>{movie.titlePtBr}</h1>
              {movie.originalTitle !== movie.titlePtBr && (
                <p style={{ fontSize: 14, color: "var(--muted-fg)", fontStyle: "italic" }}>{movie.originalTitle}</p>
              )}
              <div className="movie-meta" style={{ flexWrap: "wrap" }}>
                {movie.year && <span>{movie.year}</span>}
                {movie.year && runtime && <span>·</span>}
                {runtime && <span>{runtime} min</span>}
                {(movie.year || runtime) && movie.rating != null && <span>·</span>}
                {movie.rating != null && (
                  <span className="movie-rating" title="Nota TMDB">⭐ {movie.rating.toFixed(1)}</span>
                )}
              </div>
              {isFetching && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                  <div className="spinner" style={{ width: 14, height: 14 }} />
                  <span style={{ fontSize: 12, color: "var(--muted-fg)" }}>Carregando...</span>
                </div>
              )}
            </div>
          </div>

          {genres.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {genres.map((g) => <span key={g} className="genre-chip">{g}</span>)}
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <span className="section-label">Minha nota</span>
            <UserRatingInput movieId={movie.id} current={movie.userRating} />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <span className="section-label">Status</span>
            <div style={{ background: "var(--card)", border: "1px solid var(--card-border)", borderRadius: "var(--radius)", padding: "10px 14px", fontWeight: 600, fontSize: 15 }}>
              {STATUS_LABELS[movie.status]}
            </div>
            {otherStatuses.length > 0 && (
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {otherStatuses.map((s) => (
                  <button key={s} className="btn btn-secondary" onClick={() => updateStatus(movie.id, s)} style={{ fontSize: 13, padding: "8px 14px" }}>
                    Mover para "{s === "want" ? "Quero Ver" : s === "watched" ? "Já Vi" : "Desisti"}"
                  </button>
                ))}
              </div>
            )}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <span className="section-label">Sinopse</span>
            {movie.tmdbId == null ? (
              <p style={{ fontSize: 14, color: "var(--muted-fg)", lineHeight: 1.6 }}>Filme adicionado manualmente — sinopse indisponível.</p>
            ) : isFetching ? (
              <p style={{ fontSize: 14, color: "var(--muted-fg)" }}>Carregando sinopse...</p>
            ) : (
              <>
                {tagline && (
                  <p style={{ fontSize: 14, color: "var(--muted-fg)", fontStyle: "italic", lineHeight: 1.5 }}>"{tagline}"</p>
                )}
                <p style={{ fontSize: 15, lineHeight: 1.65, color: overview ? "var(--fg)" : "var(--muted-fg)" }}>
                  {overview ?? "Sinopse indisponível."}
                </p>
              </>
            )}
          </div>

          <button className="btn btn-danger" onClick={handleRemove} style={{ alignSelf: "flex-start" }}>
            🗑 Remover da lista
          </button>
        </div>
      </div>
    </div>
  );
}
