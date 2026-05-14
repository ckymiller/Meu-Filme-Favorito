import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HashRouter } from "react-router-dom";

import App from "./App";
import { MoviesProvider } from "./contexts/MoviesContext";
import { PreferencesProvider } from "./contexts/PreferencesContext";
import "./styles.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false },
  },
});

const root = document.getElementById("root");
if (!root) throw new Error("Root element not found");

createRoot(root).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <PreferencesProvider>
        <MoviesProvider>
          <HashRouter>
            <App />
          </HashRouter>
        </MoviesProvider>
      </PreferencesProvider>
    </QueryClientProvider>
  </StrictMode>,
);
