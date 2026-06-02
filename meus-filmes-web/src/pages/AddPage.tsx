import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMovies, type MovieStatus } from "../contexts/MoviesContext";
import {
  TmdbError,
  type Genre,
  type MovieSearchResult,
  useDiscoverByGenre,
  useGenres,
  useGetMovieDetail,
  useNowPlaying,
  usePopularMovies,
  useSearchMovies,
  useTopRated,
  useTrending,
} from "../lib/tmdb";

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

function BrowseCard({ item, onPick, alreadyAdded }: { item: MovieSearchResult; onPick: () => void; alreadyAdded: boolean }) {
  return (
    <button onClick={onPick} title={item.titlePtBr} style={{ flexShrink: 0, width: 110, display: "flex", flexDirection: "column", gap: 5, background: "none", border: "none", padding: 0, cursor: "pointer", textAlign: "left", opacity: alreadyAdded ? 0.45 : 1 }}>
      <div style={{ width: 110, height: 165, borderRadius: 8, overflow: "hidden", background: "var(--muted)", border: "1px solid var(--card-border)", position: "relative", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, color: "var(--muted-fg)" }}>
        {item.posterUrl
          ? <img src={item.posterUrl} alt={item.titlePtBr} loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          : "🎬"}
        {alreadyAdded && (
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28 }}>✅</div>
        )}
        {item.rating != null && !alreadyAdded && (
          <span style={{ position: "absolute", top: 5, right: 5, background: "rgba(0,0,0,0.65)", borderRadius: 999, padding: "2px 6px", fontSize: 10, fontWeight: 700, color: "#e7c267" }}>
            ⭐ {item.rating.toFixed(1)}
          </span>
        )}
      </div>
      <span style={{ fontSize: 12, fontWeight: 600, color: "var(--fg)", overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", lineHeight: 1.35 }}>
        {item.titlePtBr}
      </span>
      {item.year && <span style={{ fontSize: 11, color: "var(--muted-fg)" }}>{item.year}</span>}
    </button>
  );
}

function BrowseSection({ title, items, loading, onPick, isAdded }: { title: string; items: MovieSearchResult[] | undefined; loading: boolean; onPick: (item: MovieSearchResult) => void; isAdded: (id: number | null) => boolean }) {
  if (!loading && (!items || items.length === 0)) return null;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <span className="section-label">{title}</span>
      <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 6, scrollbarWidth: "none" }}>
        {loading
          ? Array.from({ length: 7 }).map((_, i) => (
              <div key={i} style={{ flexShrink: 0, width: 110, height: 165, borderRadius: 8, background: "var(--muted)", border: "1px solid var(--card-border)", animation: "pulse 1.4s ease-in-out infinite" }} />
            ))
          : items?.map((item) => (
              <BrowseCard key={item.tmdbId} item={item} onPick={() => onPick(item)} alreadyAdded={isAdded(item.tmdbId)} />
            ))}
      </div>
    </div>
  );
}

function GenreBar({ genres, selected, onSelect }: { genres: Genre[]; selected: number | null; onSelect: (id: number | null) => void }) {
  const btn = (active: boolean) => ({
    flexShrink: 0, padding: "6px 14px", borderRadius: 999 as const, fontSize: 13, fontWeight: 600, cursor: "pointer" as const,
    background: active ? "var(--primary)" : "var(--muted)",
    color: active ? "var(--primary-fg)" : "var(--fg)",
    border: `1px solid ${active ? "var(--primary)" : "var(--card-border)"}`,
  });
  return (
    <div style={{ display: "flex", gap: 8, overflowX: "auto", scrollbarWidth: "none", paddingBottom: 2 }}>
      <button style={btn(selected == null)} onClick={() => onSelect(null)}>Todos</button>
      {genres.map((g) => (
        <button key={g.id} style={btn(selected === g.id)} onClick={() => onSelect(selected === g.id ? null : g.id)}>{g.name}</button>
      ))}
    </div>
  );
}

export function AddPage() {
  const navigate = useNavigate();
  const { addMovie, hasTmdbId } = useMovies();
  const [query, setQuery] = useState("");
  const [manualMode, setManualMode] = useState(false);
  const [pending, setPending] = useState<Draft | null>(null);
  const [selectedGenre, setSelectedGenre] = useState<number | null>(null);
  const [addedIds, setAddedIds] = useState<Set<number>>(new Set());
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const debounced = useDebounced(query.trim(), 400);
  const isSearching = !manualMode && debounced.length >= 2;

  const { data: searchData, isFetching: searchLoading, isError, error } = useSearchMovies(debounced, isSearching);
  const { data: genres = [] } = useGenres();
  const { data: trending, isFetching: trendingLoading } = useTrending();
  const { data: popular, isFetching: popularLoading } = usePopularMovies();
  const { data: nowPlaying, isFetching: nowPlayingLoading } = useNowPlaying();
  const { data: topRated, isFetching: topRatedLoading } = useTopRated();
  const { data: byGenre, isFetching: genreLoading } = useDiscoverByGenre(selectedGenre);

  const errorMsg = isError ? (error instanceof TmdbError ? error.message : "Erro ao buscar filmes.") : null;

  const isAdded = (id: number | null) => id != null && (hasTmdbId(id) || addedIds.has(id));

  const pick = (result: MovieSearchResult) => {
    if (isAdded(result.tmdbId)) {
      alert(`"${result.titlePtBr}" já está na sua lista.`);
      return;
    }
    setPending({ ...result });
  };

  const confirmAdd = (status: MovieStatus) => {
    if (!pending) return;
    addMovie({ ...pending, status });
    if (pending.tmdbId) setAddedIds((prev) => new Set(prev).add(pending.tmdbId as number));
    setPending(null); // fecha o sheet, mantém a pesquisa
  };

  return (
    <div style={{ minHeight: "100dvh", background: "var(--bg)", display: "flex", flexDirection: "column" }}>
      <header className="topbar">
        <button className="icon-btn" onClick={() => navigate(-1)} style={{ fontSize: 20, width: 36, height: 36 }}>←</button>
        <span className="topbar-title">{manualMode ? "Adicionar manualmente" : "Adicionar filme"}</span>
        <div style={{ width: 36 }} />
      </header>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: 16, gap: 16, maxWidth: 720, margin: "0 auto", width: "100%", overflowY: "auto" }}>
        {manualMode ? (
          <ManualForm onCancel={() => setManualMode(false)} onSubmit={(d) => setPending(d)} />
        ) : (
          <>
            <div className="search-wrap">
              <span className="search-icon">🔍</span>
              <input ref={inputRef} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar filme no TMDB..." />
              {query && (
                <button onClick={() => setQuery("")} style={{ background: "none", border: "none", color: "var(--muted-fg)", cursor: "pointer", fontSize: 18 }}>✕</button>
              )}
            </div>

            {isSearching && (
              <>
                {searchLoading && (
                  <div style={{ display: "flex", alignItems: "center", gap: 10, color: "var(--muted-fg)", fontSize: 14 }}>
                    <div className="spinner" /> Buscando...
                  </div>
                )}
                {errorMsg && <p style={{ color: "var(--destructive)", fontSize: 14 }}>{errorMsg}</p>}
                {!searchLoading && !errorMsg && searchData?.length === 0 && (
                  <p style={{ color: "var(--muted-fg)", fontSize: 14, textAlign: "center", paddingTop: 20 }}>Nenhum resultado encontrado.</p>
                )}
                <div className="movie-list">
                  {(searchData ?? []).map((item) => (
                    <SearchResultRow key={item.tmdbId} item={item} alreadyAdded={isAdded(item.tmdbId)} onPick={() => pick(item)} />
                  ))}
                </div>
              </>
            )}

            {!isSearching && (
              <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                {genres.length > 0 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    <span className="section-label">🎭 Por gênero</span>
                    <GenreBar genres={genres} selected={selectedGenre} onSelect={setSelectedGenre} />
                    {selectedGenre != null && (
                      <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 6, scrollbarWidth: "none" }}>
                        {genreLoading
                          ? Array.from({ length: 7 }).map((_, i) => (
                              <div key={i} style={{ flexShrink: 0, width: 110, height: 165, borderRadius: 8, background: "var(--muted)", border: "1px solid var(--card-border)", animation: "pulse 1.4s ease-in-out infinite" }} />
                            ))
                          : (byGenre ?? []).map((item) => (
                              <BrowseCard key={item.tmdbId} item={item} onPick={() => pick(item)} alreadyAdded={isAdded(item.tmdbId)} />
                            ))}
                      </div>
                    )}
                  </div>
                )}
                <BrowseSection title="🔥 Em alta esta semana" items={trending} loading={trendingLoading} onPick={pick} isAdded={isAdded} />
                <BrowseSection title="🎬 Nos cinemas agora" items={nowPlaying} loading={nowPlayingLoading} onPick={pick} isAdded={isAdded} />
                <BrowseSection title="🌟 Mais populares" items={popular} loading={popularLoading} onPick={pick} isAdded={isAdded} />
                <BrowseSection title="🏆 Mais bem avaliados" items={topRated} loading={topRatedLoading} onPick={pick} isAdded={isAdded} />
              </div>
            )}

            <button className="btn btn-secondary" onClick={() => setManualMode(true)} style={{ marginTop: 4 }}>
              ✏️ Adicionar manualmente
            </button>
          </>
        )}
      </div>

      {pending && (
        <StatusPickerSheet draft={pending} onPick={confirmAdd} onClose={() => setPending(null)} />
      )}
    </div>
  );
}

function SearchResultRow({ item, onPick, alreadyAdded }: { item: MovieSearchResult; onPick: () => void; alreadyAdded: boolean }) {
  return (
    <button className="movie-row" onClick={onPick} style={{ width: "100%", opacity: alreadyAdded ? 0.5 : 1 }}>
      <div className="movie-poster">
        {item.posterUrl ? <img src={item.posterUrl} alt={item.titlePtBr} loading="lazy" /> : "🎬"}
      </div>
      <div className="movie-info">
        <span className="movie-title">{item.titlePtBr}</span>
        {item.originalTitle !== item.titlePtBr && (
          <span className="movie-original">{item.originalTitle}</span>
        )}
        <div className="movie-meta">
          {item.year && <span>{item.year}</span>}
          {item.year && item.rating != null && <span>·</span>}
          {item.rating != null && <span className="movie-rating">⭐ {item.rating.toFixed(1)}</span>}
        </div>
      </div>
      <span style={{ color: alreadyAdded ? "var(--muted-fg)" : "var(--primary)", fontSize: 22 }}>
        {alreadyAdded ? "✓" : "＋"}
      </span>
    </button>
  );
}

function StatusPickerSheet({ draft, onPick, onClose }: { draft: Draft; onPick: (s: MovieStatus) => void; onClose: () => void }) {
  const { data: detail } = useGetMovieDetail(draft.tmdbId);
  return (
    <div className="overlay" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" />
        <div style={{ display: "flex", gap: 14, marginBottom: 20 }}>
          <div className="movie-poster" style={{ width: 70, height: 105, flexShrink: 0, fontSize: 28 }}>
            {draft.posterUrl ? <img src={draft.posterUrl} alt={draft.titlePtBr} /> : "🎬"}
          </div>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontWeight: 700, fontSize: 17, lineHeight: 1.3 }}>{draft.titlePtBr}</span>
            {draft.originalTitle !== draft.titlePtBr && (
              <span style={{ fontSize: 13, color: "var(--muted-fg)", fontStyle: "italic" }}>{draft.originalTitle}</span>
            )}
            <div className="movie-meta">
              {draft.year && <span>{draft.year}</span>}
              {draft.year && draft.rating != null && <span>·</span>}
              {draft.rating != null && <span className="movie-rating">⭐ {draft.rating.toFixed(1)}</span>}
            </div>
          </div>
        </div>
        {detail?.overview && (
          <p style={{ fontSize: 13, color: "var(--muted-fg)", lineHeight: 1.55, marginBottom: 20, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical" }}>
            {detail.overview}
          </p>
        )}
        <span className="section-label" style={{ marginBottom: 10, display: "block" }}>Onde adicionar?</span>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
          {STATUS_OPTIONS.map((opt) => (
            <button key={opt.value} className="card-row" style={{ background: "var(--card)", border: "1px solid var(--card-border)", borderRadius: "var(--radius)" }} onClick={() => onPick(opt.value)}>
              <span style={{ fontSize: 18 }}>{opt.icon}</span>
              <span className="card-row-label">{opt.label}</span>
              <span style={{ color: "var(--muted-fg)" }}>›</span>
            </button>
          ))}
        </div>
        <button className="btn btn-ghost" onClick={onClose} style={{ width: "100%" }}>Cancelar</button>
      </div>
    </div>
  );
}

function ManualForm({ onCancel, onSubmit }: { onCancel: () => void; onSubmit: (d: Draft) => void }) {
  const [titlePtBr, setTitlePtBr] = useState("");
  const [originalTitle, setOriginalTitle] = useState("");
  const [year, setYear] = useState("");
  const [rating, setRating] = useState("");

  const submit = () => {
    const pt = titlePtBr.trim();
    const orig = originalTitle.trim();
    if (!pt && !orig) { alert("Preencha pelo menos o nome do filme."); return; }
    const y = parseInt(year, 10);
    const r = parseFloat(rating.replace(",", "."));
    onSubmit({ tmdbId: null, titlePtBr: pt || orig, originalTitle: orig || pt, year: Number.isFinite(y) ? y : null, rating: Number.isFinite(r) ? r : null, posterUrl: null });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div className="form-group">
        <label className="form-label">Nome em português</label>
        <input className="form-input" value={titlePtBr} onChange={(e) => setTitlePtBr(e.target.value)} placeholder="Ex.: A Origem" autoFocus />
      </div>
      <div className="form-group">
        <label className="form-label">Nome original</label>
        <input className="form-input" value={originalTitle} onChange={(e) => setOriginalTitle(e.target.value)} placeholder="Ex.: Inception" />
      </div>
      <div style={{ display: "flex", gap: 12 }}>
        <div className="form-group" style={{ flex: 1 }}>
          <label className="form-label">Ano</label>
          <input className="form-input" value={year} onChange={(e) => setYear(e.target.value)} placeholder="2010" maxLength={4} inputMode="numeric" />
        </div>
        <div className="form-group" style={{ flex: 1 }}>
          <label className="form-label">Nota TMDB (0–10)</label>
          <input className="form-input" value={rating} onChange={(e) => setRating(e.target.value)} placeholder="8.5" inputMode="decimal" />
        </div>
      </div>
      <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
        <button className="btn btn-secondary" onClick={onCancel} style={{ flex: 1 }}>← Voltar</button>
        <button className="btn btn-primary" onClick={submit} style={{ flex: 2 }}>Continuar</button>
      </div>
    </div>
  );
}
