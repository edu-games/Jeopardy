# Classroom Jeopardy

A real-time multiplayer Jeopardy game for classrooms. Instructors build boards, run games, and control gameplay from a dashboard. Students join via a game code and buzz in from their phones. A projector view displays the board for the room.

## Tech Stack

- **Frontend/API**: SvelteKit (Svelte 5) + Tailwind CSS
- **Database**: Cloudflare D1 (SQLite) via Drizzle ORM
- **Real-time**: Cloudflare Durable Objects (WebSocket Hibernation API)
- **Hosting**: Cloudflare Pages + Workers

---

## Architecture

### Cloudflare Deployment

The app is split across two Cloudflare resources that must both be deployed:

```
┌─────────────────────────────────────────────┐     ┌──────────────────────────────────────┐
│  CF Pages: classroom-jeopardy               │     │  CF Worker: classroom-jeopardy-do    │
│  (wrangler.json)                            │     │  (wrangler.worker.json)              │
│                                             │     │                                      │
│  - Serves all pages & routes                │     │  - Hosts GameHub Durable Object      │
│  - REST API (boards, games, questions, etc) │     │  - Manages WebSocket connections     │
│  - Auth (instructor sessions)               │     │  - Handles real-time game events     │
│  - Bound to D1 database            ─────────┼─┐   │  - Bound to D1 database              │
│  - Bound to GAME_HUB namespace     ─────────┼─┼──►│  - Bound to GAME_HUB (self)          │
└─────────────────────────────────────────────┘ │   └──────────────────────────────────────┘
                                                 │                    │
                                                 └────────┬───────────┘
                                                          ▼
                                             ┌────────────────────────┐
                                             │  D1: jeopardy-db       │
                                             │  (shared SQLite DB)    │
                                             └────────────────────────┘
```

The Worker must be deployed before the Pages project, as Pages validates that `classroom-jeopardy-do` exists when processing its `GAME_HUB` binding.

### Real-time Flow

Each game has one `GameHub` Durable Object instance, keyed by `gameId`. The DO uses the WebSocket Hibernation API — it sleeps between messages to keep costs low.

```
Instructor browser          Student browser(s)          Projector browser
       │                           │                            │
       │ WS /api/ws/[gameId]       │                            │
       │    ?role=instructor       │ WS /api/ws/[gameId]        │
       │──────────────────────────►│    ?role=student           │
       │                           │───────────────────────────►│
       │                           │     WS /api/ws/[gameId]    │
       │                           │         ?role=projector    │
       │                           │────────────────────────────►
       │                                                        │
       │          All connections land in the same GameHub DO   │
       │◄──────────────────── broadcast() ─────────────────────►│
```

WebSocket connections are proxied through the Pages API (`/api/ws/[gameId]`), which looks up the game in D1, gets the `GameHub` stub for that `gameId`, and upgrades the connection into the DO.

### D1 Database Schema

```
instructors ──┬── questions ──── question_tags ──── tags
              │
              ├── boards ──── categories ──── board_question_slots ──── questions
              │
              └── games ──┬── teams ──── students
                          ├── students
                          └── game_state
```

| Table | Purpose |
|---|---|
| `instructors` | Authenticated teacher accounts |
| `sessions` | Instructor login sessions |
| `questions` | Question bank (clue shown + correct response) |
| `tags` | Labels for filtering questions |
| `boards` | A named set of categories and questions |
| `categories` | Column headers on a board (up to 6) |
| `board_question_slots` | Each cell: category + question + points + row/column position |
| `games` | A running or completed game instance with a join code |
| `teams` | Teams within a game, with scores |
| `students` | Players who joined a game |
| `game_state` | Live state: current question, answered slots, buzzer status |

### WebSocket Message Protocol

All messages are JSON. Clients send to the GameHub DO:

| Message | Sent by | Description |
|---|---|---|
| `start-game` | instructor | Transitions game `LOBBY` → `IN_PROGRESS` |
| `end-game` | instructor | Transitions game to `COMPLETED`, broadcasts final scores |
| `reveal-question` | instructor | Opens a question slot, broadcasts clue to all clients |
| `answer` | instructor | Marks answer correct/incorrect, updates team score |
| `enable-buzzer` | instructor | Re-opens the buzzer for the next student to buzz in |
| `assign-team` | instructor | Assigns a student to a team |
| `buzzer` | student | First buzz-in; disables buzzer for others, broadcasts winner |

The DO broadcasts events back to all connected clients (`game-started`, `question-revealed`, `buzzer-pressed`, `answer-submitted`, `team-assigned`, etc.).

---

## Project Structure

```
src/
├── lib/
│   ├── server/
│   │   ├── game-hub.ts       # GameHub Durable Object (WebSocket + game logic)
│   │   ├── schema.ts         # Drizzle ORM schema
│   │   ├── db.ts             # D1 database initializer
│   │   ├── auth.ts           # Session auth helpers
│   │   └── qr.ts             # QR code generation for join links
│   └── components/           # Svelte UI components
├── routes/
│   ├── api/
│   │   ├── ws/[gameId]/      # WebSocket upgrade → GameHub DO
│   │   ├── games/            # Game CRUD
│   │   ├── boards/           # Board CRUD
│   │   ├── questions/        # Question bank (incl. import/export)
│   │   ├── students/join/    # Student join endpoint
│   │   └── auth/logout/
│   ├── dashboard/            # Instructor UI
│   │   └── games/[id]/
│   │       ├── lobby/        # Pre-game lobby with student list
│   │       ├── play/         # Instructor game control view
│   │       └── results/      # Post-game scores
│   └── game/[code]/
│       ├── play/             # Student game view (buzzer)
│       ├── projector/        # Room display view
│       └── results/          # End-of-game results
├── do-worker.ts              # DO Worker entry point (exports GameHub)
└── app.d.ts                  # Cloudflare env type declarations

drizzle/                      # D1 migration files
wrangler.json                 # Pages config (binds D1 + GAME_HUB)
wrangler.worker.json          # DO Worker config (defines GameHub + migrations)
```

---

## Game Flow

```
Instructor creates game
        │
        ▼
Students join via code / QR ──► LOBBY (waiting room)
        │
        ▼  instructor clicks Start
   IN_PROGRESS
        │
        ├── instructor reveals a question slot
        │         │
        │         ▼
        │   students buzz in ──► first buzz locks others out
        │         │
        │         ▼
        │   instructor marks correct / incorrect ──► score updates broadcast
        │         │
        │         └── repeat until board complete
        │
        ▼  instructor clicks End
   COMPLETED ──► results page (scores ranked by team)
```

---

## Development

```bash
npm install

# Local dev server
npm run dev

# Local Cloudflare Pages dev (with D1 + DO)
npm run cf:dev

# Type checking
npm run check
```

### Database

```bash
# Generate a new migration after schema changes
npm run db:generate

# Apply migrations locally
npm run db:migrate:local

# Apply migrations to production D1
npm run db:migrate:prod
```

---

## Deployment

The DO Worker must be deployed before the Pages project. The `cf:deploy` script handles ordering:

```bash
# 1. Build the SvelteKit app
npm run build

# 2. Deploy DO Worker, then Pages project
npm run cf:deploy
```

Or deploy individually:

```bash
npm run cf:deploy:do     # deploys classroom-jeopardy-do Worker (GameHub DO)
npm run cf:deploy:pages  # deploys classroom-jeopardy Pages project
```

> On the first deploy of the DO Worker, wrangler will prompt to confirm the Durable Object migration. Type `y` to proceed.

---

## Features

- **Instructor dashboard**: manage question banks (with tag filtering, JSON import/export), boards, and games
- **Game lobby**: students join by code or QR scan, instructor assigns teams manually or randomly
- **Live gameplay**: instructor controls question reveal; students buzz in from their phones
- **Projector view**: full-screen board display for the classroom
- **Scoring**: automatic point tracking with correct/incorrect buttons; Daily Double support
- **Results**: ranked final scores after game ends

## License

MIT
