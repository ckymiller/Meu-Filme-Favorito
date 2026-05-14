import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useMovies } from "../contexts/MoviesContext";
import { usePreferences } from "../contexts/PreferencesContext";
import type { MovieStatus } from "../lib/storage";

const TABS: { to: string; status: MovieStatus; label: string; icon: string }[] = [
  { to: "/", status: "want", label: "Quero Ver", icon: "🔖" },
  { to: "/watched", status: "watched", label: "Já Vi", icon: "✅" },
  { to: "/abandoned", status: "abandoned", label: "Desisti", icon: "✖" },
];

export function Layout() {
  const { movies } = useMovies();
  const { viewMode, toggleViewMode } = usePreferences();
  const navigate = useNavigate();

  const countOf = (s: MovieStatus) => movies.filter((m) => m.status === s).length;

  return (
    <div className="app-layout">
      {/* Sidebar – desktop */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <span className="sidebar-brand-icon">🎬</span>
          <span className="sidebar-brand-name">Meus Filmes</span>
        </div>
        <nav className="sidebar-nav">
          {TABS.map((t) => (
            <NavLink
              key={t.to}
              to={t.to}
              end={t.to === "/"}
              className={({ isActive }) =>
                "sidebar-link" + (isActive ? " active" : "")
              }
            >
              <span>{t.icon}</span>
              <span>{t.label}</span>
              <span className="sidebar-link-count">{countOf(t.status)}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              "sidebar-link" + (isActive ? " active" : "")
            }
          >
            <span>⚙️</span>
            <span>Configurações</span>
          </NavLink>
        </div>
      </aside>

      {/* Main */}
      <div className="main-content">
        <header className="topbar">
          <span className="topbar-title">🎬 Meus Filmes</span>
          <div className="topbar-actions">
            <button
              className="icon-btn"
              onClick={toggleViewMode}
              title={viewMode === "list" ? "Ver em grade" : "Ver em lista"}
            >
              {viewMode === "list" ? "⊞" : "☰"}
            </button>
            <button
              className="icon-btn"
              onClick={() => navigate("/settings")}
              title="Configurações"
            >
              ⚙
            </button>
          </div>
        </header>
        <main className="page-content">
          <Outlet />
        </main>

        {/* FAB */}
        <button className="fab" onClick={() => navigate("/add")} title="Adicionar filme">
          ＋
        </button>
      </div>

      {/* Bottom nav – mobile */}
      <nav className="bottom-nav">
        <div className="bottom-nav-inner">
          {TABS.map((t) => (
            <NavLink
              key={t.to}
              to={t.to}
              end={t.to === "/"}
              className={({ isActive }) =>
                "bottom-nav-item" + (isActive ? " active" : "")
              }
            >
              <span className="bottom-nav-item-icon">{t.icon}</span>
              <span>{t.label}</span>
            </NavLink>
          ))}
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              "bottom-nav-item" + (isActive ? " active" : "")
            }
          >
            <span className="bottom-nav-item-icon">⚙</span>
            <span>Config.</span>
          </NavLink>
        </div>
      </nav>
    </div>
  );
}
