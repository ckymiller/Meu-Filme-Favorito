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

- **`artifacts/api-server`** — Express API. Exposes `/api/healthz` and `/api/movies/search?q=...` (proxies TMDB v3 with `language=pt-BR`, returns `{tmdbId, titlePtBr, originalTitle, year, rating, posterUrl}`). Requires `TMDB_API_KEY` secret.
- **`artifacts/filmes`** — Expo mobile app "Meus Filmes". Tracks movies with three categories ("Quero Ver", "Já Vi", "Desisti"), all sorted alphabetically by Brazilian Portuguese title. Movies are persisted client-side via AsyncStorage (`@meusfilmes/movies/v1`). The add screen searches via the API server; users can also add movies manually when no result matches. Tap a movie row to change its status or remove it.

## Environment

- `TMDB_API_KEY` — TMDB v3 API key. Used only by the API server, never shipped to the mobile bundle.
