import { useRef, useState } from "react";
import { useMovies, type Movie, type MovieStatus } from "../contexts/MoviesContext";

const STATUS_LABELS: Record<MovieStatus, string> = {
  want: "Quero Ver",
  watched: "Já Vi",
  abandoned: "Desisti",
};

interface Props {
  movie: Movie;
  compact?: boolean;
}

export function MovieActionsMenu({ movie, compact = false }: Props) {
  const { updateStatus, removeMovie } = useMovies();
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);

  const others = (["want", "watched", "abandoned"] as MovieStatus[]).filter(
    (s) => s !== movie.status,
  );

  const toggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setOpen((o) => !o);
  };

  const doStatus = (e: React.MouseEvent, s: MovieStatus) => {
    e.stopPropagation();
    updateStatus(movie.id, s);
    setOpen(false);
  };

  const doRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Remover "${movie.titlePtBr}"?`)) {
      removeMovie(movie.id);
    }
    setOpen(false);
  };

  return (
    <div style={{ position: "relative", flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
      <button
        ref={btnRef}
        onClick={toggle}
        style={{
          width: compact ? 28 : 32,
          height: compact ? 28 : 32,
          borderRadius: 6,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: compact ? "rgba(0,0,0,0.45)" : "transparent",
          color: compact ? "#fff" : "var(--muted-fg)",
          fontSize: 16,
          cursor: "pointer",
          border: "none",
          flexShrink: 0,
        }}
        title="Ações"
      >
        ⋮
      </button>
      {open && (
        <>
          <div
            style={{ position: "fixed", inset: 0, zIndex: 98 }}
            onClick={(e) => { e.stopPropagation(); setOpen(false); }}
          />
          <div
            style={{
              position: "absolute",
              right: 0,
              top: "100%",
              marginTop: 4,
              background: "var(--card)",
              border: "1px solid var(--card-border)",
              borderRadius: "var(--radius)",
              zIndex: 99,
              minWidth: 180,
              boxShadow: "0 8px 24px rgba(0,0,0,0.35)",
              overflow: "hidden",
            }}
          >
            {others.map((s) => (
              <button
                key={s}
                onClick={(e) => doStatus(e, s)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  width: "100%",
                  padding: "11px 14px",
                  background: "none",
                  border: "none",
                  borderBottom: "1px solid var(--card-border)",
                  color: "var(--fg)",
                  fontSize: 14,
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                Mover para "{STATUS_LABELS[s]}"
              </button>
            ))}
            <button
              onClick={doRemove}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                width: "100%",
                padding: "11px 14px",
                background: "none",
                border: "none",
                color: "var(--destructive)",
                fontSize: 14,
                cursor: "pointer",
                textAlign: "left",
                fontWeight: 600,
              }}
            >
              🗑 Remover
            </button>
          </div>
        </>
      )}
    </div>
  );
}
