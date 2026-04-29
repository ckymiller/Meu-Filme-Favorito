# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.

## Artifacts

- **`artifacts/api-server`** — Express API.
  - `GET /api/healthz`
  - `GET /api/movies/search?q=...` — proxies TMDB v3 (`language=pt-BR`) for the autocomplete list.
  - `GET /api/movies/:tmdbId` — TMDB movie detail with PT-BR overview/tagline (falls back to EN-US when missing) plus genres, runtime and backdrop.
  - `GET/POST/PATCH/DELETE /api/me/movies(/:id)` and `POST /api/me/movies/bulk` — authenticated CRUD over the user's library, deduped by `tmdbId`.
  - `/api/auth/*` and `/api/mobile-auth/token-exchange` — Replit OIDC login (web cookie session + mobile bearer token).
  - Requires `TMDB_API_KEY`, `DATABASE_URL`, `SESSION_SECRET` and the standard Replit OIDC env vars.
- **`artifacts/filmes`** — Expo mobile app "Meus Filmes". Tracks movies with three categories ("Quero Ver", "Já Vi", "Desisti"), all sorted alphabetically (PT-BR collation). Movies are persisted client-side via AsyncStorage (`@meusfilmes/movies/v1`); when the user signs in, local movies are pushed to the server and the device then mirrors the server library. Tap a row or grid card to open the detail screen with the PT-BR synopsis; long-press (or the kebab button) to change status or remove. Header buttons toggle list/grid view and open the settings modal (account sign-in, view preference, app info). Auth uses Replit OIDC via `expo-auth-session` (token stored in `expo-secure-store` on native, `localStorage` on web).

## Environment

- `TMDB_API_KEY` — TMDB v3 API key. Used only by the API server, never shipped to the mobile bundle.
- `DATABASE_URL`, `SESSION_SECRET` — required by the API server for Postgres + cookie sessions.
- `EXPO_PUBLIC_DOMAIN`, `EXPO_PUBLIC_REPL_ID` — wired in the Expo dev script; the mobile app uses them to call the API and start the OIDC flow.
