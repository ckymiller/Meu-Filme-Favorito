import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMovies, type MovieStatus } from "../contexts/MoviesContext";
import { useSearchMovies, useGetMovieDetail, TmdbError, type MovieSearchResult } from "../lib/tmdb";

function useDebounced<T>(value: T, delay = 400): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

const STATUS_OPTIONS: { value: MovieStatus; label: string; icon: string }[] = [
  { value: "want", label: "Quero Ver", icon: "🔖" },
  { value: "watched", label: "Já Vi", icon: "✅" },
  { value: "abandoned", label: "Desisti", icon: "✖" },
];

interface Draft {
  tmdbId: number | null;
  titlePtBr: string;
  originalTitle: string;
  year: number | null;
  rating: number | null;
  posterUrl: string | null;
}

export function AddPage() {
  const navigate = useNavigate();
  const { addMovie, hasTmdbId } = useMovies();
  const [query, setQuery] = useState("");
  const [manualMode, setManualMode] = useState(false);
  const [pending, setPending] = useState<Draft | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const debounced = useDebounced(query.trim(), 400);
  const { data, isFetching, isError, error } = useSearchMovies(
    debounced,
    !manualMode && debounced.length >= 2,
  );

  const errorMsg =
    isError
      ? error instanceof TmdbError
        ? error.message
        : "Erro ao buscar filmes."
      : null;

  const pick = (result: MovieSearchResult) => {
    if (hasTmdbId(result.tmdbId)) {
      alert(`"${result.titlePtBr}" já está na sua lista.`);
      return;
    }
    setPending({ ...result });
  };

  const confirm = (status: MovieStatus) => {
    if (!pending) return;
    addMovie({ ...pending, status });
    navigate(-1);
  };

  return (
    <div
      style={{
        minHeight: "100dvh",
        background: "var(--bg)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header */}
      <header className="topbar">
        <button
          className="icon-btn"
          onClick={() => navigate(-1)}
          style={{ fontSize: 20, width: 36, height: 36 }}
        >
          ←
        </button>
        <span className="topbar-title">
          {manualMode ? "Adicionar manualmente" : "Adicionar filme"}
        </span>
        <div style={{ width: 36 }} />
      </header>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: 16, gap: 16, maxWidth: 640, margin: "0 auto", width: "100%" }}>
        {manualMode ? (
          <ManualForm
            onCancel={() => setManualMode(false)}
            onSubmit={(d) => setPending(d)}
          />
        ) : (
          <>
            <div className="search-wrap">
              <span className="search-icon">🔍</span>
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar filme no TMDB..."
              />
              {query && (
                <button
                  onClick={() => setQuery("")}
                  style={{ background: "none", border: "none", color: "var(--muted-fg)", cursor: "pointer", fontSize: 18 }}
                >
                  ✕
                </button>
              )}
            </div>

            {isFetching && (
              <div style={{ display: "flex", alignItems: "center", gap: 10, color: "var(--muted-fg)", fontSize: 14 }}>
                <div className="spinner" />
                Buscando...
              </div>
            )}

            {errorMsg && (
              <p style={{ color: "var(--destructive)", fontSize: 14 }}>{errorMsg}</p>
            )}

            {!isFetching && !errorMsg && debounced.length < 2 && (
              <div className="empty-state" style={{ paddingTop: 40 }}>
                <span className="empty-state-icon">🎬</span>
                <span className="empty-state-text">Digite ao menos 2 letras para buscar.</span>
              </div>
            )}

            {!isFetching && !errorMsg && debounced.length >= 2 && data?.length === 0 && (
              <p style={{ color: "var(--muted-fg)", fontSize: 14, textAlign: "center", paddingTop: 20 }}>
                Nenhum resultado encontrado.
              </p>
            )}

            <div className="movie-list">
              {(data ?? []).map((item) => (
                <SearchResultRow key={item.tmdbId} item={item} onPick={() => pick(item)} />
              ))}
            </div>

            <button
              className="btn btn-secondary"
              onClick={() => setManualMode(true)}
              style={{ marginTop: 8 }}
            >
              ✏️ Adicionar manualmente
            </button>
          </>
        )}
      </div>

      {/* Status picker sheet */}
      {pending && (
        <StatusPickerSheet
          draft={pending}
          onPick={confirm}
          onClose={() => setPending(null)}
        />
      )}
    </div>
  );
}

function SearchResultRow({ item, onPick }: { item: MovieSearchResult; onPick: () => void }) {
  return (
    <button className="movie-row" onClick={onPick} style={{ width: "100%" }}>
      <div className="movie-poster">
        {item.posterUrl ? (
          <img src={item.posterUrl} alt={item.titlePtBr} loading="lazy" />
        ) : "🎬"}
      </div>
      <div className="movie-info">
        <span className="movie-title">{item.titlePtBr}</span>
        {item.originalTitle !== item.titlePtBr && (
          <span className="movie-original">{item.originalTitle}</span>
        )}
        <div className="movie-meta">
          {item.year && <span>{item.year}</span>}
          {item.year && item.rating != null && <span>·</span>}
          {item.rating != null && (
            <span className="movie-rating">⭐ {item.rating.toFixed(1)}</span>
          )}
        </div>
      </div>
      <span style={{ color: "var(--primary)", fontSize: 22 }}>＋</span>
    </button>
  );
}

function StatusPickerSheet({
  draft,
  onPick,
  onClose,
}: {
  draft: Draft;
  onPick: (s: MovieStatus) => void;
  onClose: () => void;
}) {
  const { data: detail } = useGetMovieDetail(draft.tmdbId);

  return (
    <div className="overlay" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" />

        {/* Movie header */}
        <div style={{ display: "flex", gap: 14, marginBottom: 20 }}>
          <div className="movie-poster" style={{ width: 70, height: 105, flexShrink: 0, fontSize: 28 }}>
            {draft.posterUrl
              ? <img src={draft.posterUrl} alt={draft.titlePtBr} />
              : "🎬"}
          </div>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontWeight: 700, fontSize: 17, lineHeight: 1.3 }}>{draft.titlePtBr}</span>
            {draft.originalTitle !== draft.titlePtBr && (
              <span style={{ fontSize: 13, color: "var(--muted-fg)", fontStyle: "italic" }}>
                {draft.originalTitle}
              </span>
            )}
            <div className="movie-meta">
              {draft.year && <span>{draft.year}</span>}
              {draft.year && draft.rating != null && <span>·</span>}
              {draft.rating != null && (
                <span className="movie-rating">⭐ {draft.rating.toFixed(1)}</span>
              )}
            </div>
          </div>
        </div>

        {/* Synopsis preview */}
        {detail?.overview && (
          <p style={{
            fontSize: 13,
            color: "var(--muted-fg)",
            lineHeight: 1.55,
            marginBottom: 20,
            overflow: "hidden",
            display: "-webkit-box",
            WebkitLineClamp: 3,
            WebkitBoxOrient: "vertical",
          }}>
            {detail.overview}
          </p>
        )}

        <span className="section-label" style={{ marginBottom: 10, display: "block" }}>
          Onde adicionar?
        </span>

        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              className="card-row"
              style={{
                background: "var(--card)",
                border: "1px solid var(--card-border)",
                borderRadius: "var(--radius)",
              }}
              onClick={() => onPick(opt.value)}
            >
              <span style={{ fontSize: 18 }}>{opt.icon}</span>
              <span className="card-row-label">{opt.label}</span>
              <span style={{ color: "var(--muted-fg)" }}>›</span>
            </button>
          ))}
        </div>

        <button className="btn btn-ghost" onClick={onClose} style={{ width: "100%" }}>
          Cancelar
        </button>
      </div>
    </div>
  );
}

function ManualForm({
  onCancel,
  onSubmit,
}: {
  onCancel: () => void;
  onSubmit: (d: Draft) => void;
}) {
  const [titlePtBr, setTitlePtBr] = useState("");
  const [originalTitle, setOriginalTitle] = useState("");
  const [year, setYear] = useState("");
  const [rating, setRating] = useState("");

  const submit = () => {
    const pt = titlePtBr.trim();
    const orig = originalTitle.trim();
    if (!pt && !orig) {
      alert("Preencha pelo menos o nome do filme.");
      return;
    }
    const y = parseInt(year, 10);
    const r = parseFloat(rating.replace(",", "."));
    onSubmit({
      tmdbId: null,
      titlePtBr: pt || orig,
      originalTitle: orig || pt,
      year: Number.isFinite(y) ? y : null,
      rating: Number.isFinite(r) ? r : null,
      posterUrl: null,
    });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div className="form-group">
        <label className="form-label">Nome em português</label>
        <input
          className="form-input"
          value={titlePtBr}
          onChange={(e) => setTitlePtBr(e.target.value)}
          placeholder="Ex.: A Origem"
          autoFocus
        />
      </div>
      <div className="form-group">
        <label className="form-label">Nome original</label>
        <input
          className="form-input"
          value={originalTitle}
          onChange={(e) => setOriginalTitle(e.target.value)}
          placeholder="Ex.: Inception"
        />
      </div>
      <div style={{ display: "flex", gap: 12 }}>
        <div className="form-group" style={{ flex: 1 }}>
          <label className="form-label">Ano</label>
          <input
            className="form-input"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            placeholder="2010"
            maxLength={4}
            inputMode="numeric"
          />
        </div>
        <div className="form-group" style={{ flex: 1 }}>
          <label className="form-label">Nota (0–10)</label>
          <input
            className="form-input"
            value={rating}
            onChange={(e) => setRating(e.target.value)}
            placeholder="8.5"
            inputMode="decimal"
          />
        </div>
      </div>
      <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
        <button className="btn btn-secondary" onClick={onCancel} style={{ flex: 1 }}>
          ← Voltar
        </button>
        <button className="btn btn-primary" onClick={submit} style={{ flex: 2 }}>
          Continuar
        </button>
      </div>
    </div>
  );
}
