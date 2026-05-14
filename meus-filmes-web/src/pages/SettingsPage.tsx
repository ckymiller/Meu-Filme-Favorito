import { useMovies } from "../contexts/MoviesContext";
import { usePreferences } from "../contexts/PreferencesContext";
import type { MovieStatus } from "../lib/storage";

const apiKey: string | undefined = import.meta.env.VITE_TMDB_API_KEY as string | undefined;

export function SettingsPage() {
  const { movies } = useMovies();
  const { viewMode, setViewMode } = usePreferences();

  const counts: Record<MovieStatus, number> = {
    want: movies.filter((m) => m.status === "want").length,
    watched: movies.filter((m) => m.status === "watched").length,
    abandoned: movies.filter((m) => m.status === "abandoned").length,
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 480 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <span className="section-label">Visualização</span>
        <div className="card-block">
          <button
            className="card-row"
            onClick={() => setViewMode("list")}
          >
            <span>☰</span>
            <span className="card-row-label">Lista</span>
            {viewMode === "list" && <span style={{ color: "var(--primary)" }}>✔</span>}
          </button>
          <button
            className="card-row"
            onClick={() => setViewMode("grid")}
          >
            <span>⊞</span>
            <span className="card-row-label">Grade</span>
            {viewMode === "grid" && <span style={{ color: "var(--primary)" }}>✔</span>}
          </button>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <span className="section-label">Suas listas</span>
        <div className="card-block">
          <div className="card-row" style={{ cursor: "default" }}>
            <span>🔖</span>
            <span className="card-row-label">Quero Ver</span>
            <span style={{ color: "var(--muted-fg)", fontWeight: 700 }}>
              {counts.want}
            </span>
          </div>
          <div className="card-row" style={{ cursor: "default" }}>
            <span>✅</span>
            <span className="card-row-label">Já Vi</span>
            <span style={{ color: "var(--muted-fg)", fontWeight: 700 }}>
              {counts.watched}
            </span>
          </div>
          <div className="card-row" style={{ cursor: "default" }}>
            <span>✖</span>
            <span className="card-row-label">Desisti</span>
            <span style={{ color: "var(--muted-fg)", fontWeight: 700 }}>
              {counts.abandoned}
            </span>
          </div>
        </div>
      </div>

      {!apiKey && (
        <div
          style={{
            background: "color-mix(in srgb, var(--destructive) 12%, transparent)",
            border: "1px solid color-mix(in srgb, var(--destructive) 40%, transparent)",
            borderRadius: "var(--radius)",
            padding: "14px 16px",
            fontSize: 13,
            lineHeight: 1.6,
            color: "var(--fg)",
          }}
        >
          ⚠️ <strong>Chave TMDB não configurada</strong> — a busca de filmes não vai
          funcionar. Configure <code>VITE_TMDB_API_KEY</code> no GitHub Secrets.
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <span className="section-label">Sobre</span>
        <div
          className="card-block"
          style={{ padding: "16px", display: "flex", flexDirection: "column", gap: 8 }}
        >
          <span style={{ fontWeight: 700, fontSize: 16 }}>Meus Filmes</span>
          <p style={{ fontSize: 13, color: "var(--muted-fg)", lineHeight: 1.6 }}>
            App pessoal para organizar filmes em três listas.
            <br />
            Os dados ficam salvos só no seu navegador.
            <br />
            Buscas via The Movie Database (TMDB).
          </p>
        </div>
      </div>
    </div>
  );
}
