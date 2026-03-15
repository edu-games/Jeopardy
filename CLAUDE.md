# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Local dev (Vite only, no D1/DO)
npm run dev

# Local Cloudflare dev with D1 + Durable Objects (preferred)
npm run cf:dev

# Type checking
npm run check

# Database migrations
npm run db:generate          # generate migration after schema changes
npm run db:migrate:local     # apply to local D1
npm run db:migrate:prod      # apply to production D1

# Deploy (DO Worker must go before Pages)
npm run cf:deploy            # full deploy (DO then Pages)
npm run cf:deploy:do         # just the DO Worker
npm run cf:deploy:pages      # just the Pages project
```

No test suite exists in this project.

## Architecture

This is a real-time multiplayer Jeopardy game split across two Cloudflare resources:

- **Cloudflare Pages** (`wrangler.json`): SvelteKit app — serves all UI pages, REST API, and auth. Binds to D1 and the `GAME_HUB` Durable Object namespace.
- **Cloudflare Worker** (`wrangler.worker.json`): Hosts the `GameHub` Durable Object. Entry point is `src/do-worker.ts`. Must be deployed first.

Both share the same **D1 SQLite database** (`jeopardy-db`).

### Real-time (WebSocket)

All live game state goes through the `GameHub` Durable Object (`src/lib/server/game-hub.ts`). Each game has one DO instance keyed by `gameId`.

- Browsers connect via `/api/ws/[gameId]?role=instructor|student|projector`
- The SvelteKit API route (`src/routes/api/ws/[gameId]/+server.ts`) validates the request, then proxies it into the DO using `platform.env.GAME_HUB.get(id).fetch()`
- The DO uses the **WebSocket Hibernation API** — it sleeps between messages
- The DO broadcasts game events to all connected clients

### Authentication

Instructor-only. Session-based via httpOnly cookies. Logic lives in `src/lib/server/auth.ts`. The server hook (`src/hooks.server.ts`) populates `event.locals.instructor` and redirects unauthenticated requests away from `/dashboard/*`.

### Database Schema

Drizzle ORM with SQLite dialect. Schema defined in `src/lib/server/schema.ts`, migrations in `drizzle/`. Key tables:

- `instructors` / `sessions` — auth
- `questions` / `tags` / `question_tags` — question bank
- `boards` / `categories` / `board_question_slots` — board templates
- `games` / `teams` / `students` / `game_state` — live game data

### Vite Plugin

`vite.config.ts` includes a custom `inject-durable-objects` plugin that bundles `src/do-worker.ts` via esbuild and injects the `GameHub` export into the Pages build output. This is what lets the single SvelteKit build serve both the Pages app and export the DO class.

### Cloudflare Platform Types

`src/app.d.ts` declares `App.Platform.env` with `DB: D1Database` and `GAME_HUB: DurableObjectNamespace`. Access these in server routes via `event.platform.env`.

### WebSocket Message Protocol

Instructor → DO: `start-game`, `end-game`, `reveal-question`, `answer`, `enable-buzzer`, `assign-team`
Student → DO: `buzzer`
DO → all clients (broadcasts): `game-started`, `question-revealed`, `buzzer-pressed`, `answer-submitted`, `team-assigned`, etc.
