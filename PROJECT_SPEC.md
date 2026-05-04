# Real-Time Multiplayer Jeopardy Game — Project Specification

## Overview

A real-time classroom Jeopardy game where an instructor controls gameplay from a dashboard, students join via a shareable code or QR code and buzz in on their phones, and a separate projector view displays the board and current question on a big screen.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | SvelteKit 5 + Tailwind CSS |
| Runtime | Cloudflare Pages (SvelteKit) + Cloudflare Workers (Durable Objects) |
| Database | Cloudflare D1 (SQLite) via Drizzle ORM |
| Auth | bcryptjs + session cookies |
| Real-time | WebSockets via Cloudflare Durable Objects (Hibernation API) |
| QR Codes | Server-side SVG generation (qrcode library) |
| IDs | CUID2 for all primary keys |

---

## Architecture

The app is split into two Cloudflare resources that share one D1 database:

1. **Cloudflare Pages** — SvelteKit app. Serves all UI, REST API routes, and auth. Binds to D1 and the `GAME_HUB` Durable Object namespace.
2. **Cloudflare Worker** — Hosts the `GameHub` Durable Object. Entry point: `src/do-worker.ts`. Must be deployed before Pages.

A custom Vite plugin (`inject-durable-objects`) bundles the DO class via esbuild and injects the `GameHub` export into the Pages build output so the single SvelteKit build serves both.

---

## Database Schema (11 Tables)

### Auth

**`instructors`**
- `id` — text PK (CUID2)
- `email` — text, unique
- `password` — text (bcrypt hash)
- `name` — text
- `createdAt`, `updatedAt` — text (ISO 8601)

**`sessions`**
- `id` — text PK
- `instructorId` — FK → instructors (cascade delete)
- `expiresAt` — text (ISO 8601, 30-day TTL)
- `createdAt`, `updatedAt` — text

### Content

**`questions`**
- `id` — text PK
- `answer` — text (the clue shown to players)
- `question` — text (the correct response, Jeopardy-style)
- `instructorId` — FK → instructors
- `createdAt`, `updatedAt` — text

**`tags`**
- `id` — text PK
- `name` — text, unique
- `createdAt` — text

**`questionTags`** (join table)
- `questionId` — FK → questions
- `tagId` — FK → tags
- Composite unique: (questionId, tagId)

### Boards

**`boards`**
- `id` — text PK
- `name`, `description` — text
- `instructorId` — FK → instructors
- `createdAt`, `updatedAt` — text

**`categories`**
- `id` — text PK
- `name` — text
- `order` — integer (0–5, left-to-right column position)
- `boardId` — FK → boards (cascade delete)
- `createdAt`, `updatedAt` — text

**`boardQuestionSlots`**
- `id` — text PK
- `categoryId` — FK → categories
- `questionId` — FK → questions
- `row` — integer (0–4, top-to-bottom)
- `column` — integer (0–5)
- `points` — integer
- `isDailyDouble` — boolean (default false)
- `createdAt`, `updatedAt` — text
- Unique constraint: (categoryId, row)

### Games

**`games`**
- `id` — text PK
- `code` — text, unique (6-char alphanumeric, confusable chars removed)
- `boardId` — FK → boards
- `instructorId` — FK → instructors
- `status` — text: `LOBBY | IN_PROGRESS | COMPLETED`
- `teamAssignment` — text: `MANUAL | RANDOM`
- `createdAt`, `updatedAt` — text

**`teams`**
- `id` — text PK
- `name` — text
- `color` — text (hex code)
- `score` — integer (default 0)
- `gameId` — FK → games (cascade delete)
- `createdAt`, `updatedAt` — text

**`students`**
- `id` — text PK
- `name` — text
- `gameId` — FK → games (cascade delete)
- `teamId` — FK → teams, nullable
- `buzzerAt` — text (ISO 8601 timestamp, null until buzzer pressed)
- `createdAt`, `updatedAt` — text

**`gameState`**
- `id` — text PK
- `gameId` — FK → games, unique (one state per game)
- `currentSlotId` — text, nullable
- `answeredSlots` — text (JSON array of slot IDs)
- `currentTeamId` — text, nullable
- `questionStartedAt` — text, nullable (ISO 8601)
- `buzzerEnabled` — boolean (default false)
- `currentWager` — integer, nullable (Daily Double only)
- `createdAt`, `updatedAt` — text

---

## Authentication

- Cookie name: `session` (httpOnly, secure, sameSite: lax)
- Session TTL: 30 days, stored in DB
- Passwords: bcryptjs with 10 salt rounds
- Server hook (`hooks.server.ts`) validates session on every request, populates `event.locals.instructor`
- Protected routes (`/dashboard/*`) redirect to `/login` if unauthenticated
- `/login` and `/register` redirect to `/dashboard` if already authenticated

---

## WebSocket Protocol (GameHub Durable Object)

Each game has one DO instance keyed by `gameId`. Clients connect to:

```
GET /api/ws/[gameId]?role=instructor|student|projector&instructorId=...&studentId=...
```

The SvelteKit route validates the request then proxies it into the DO using the Hibernation API. WebSockets are tagged with `[role, gameId, instructorId, studentId]`.

### On Connection (Server → Client)

| Message | Recipients | Payload |
|---|---|---|
| `connected` | All | `{ role }` |
| `game-state-snapshot` | All | Full game state: teams, board, answeredSlots, currentSlot, buzzerEnabled, currentWager, etc. |
| `connected-students-snapshot` | Instructor, Projector | Array of connected student IDs |

### During Gameplay (Client → Server → Broadcast)

| Message | Sender | Action | Broadcast |
|---|---|---|---|
| `start-game` | Instructor | Sets `status = IN_PROGRESS` | `game-started` |
| `end-game` | Instructor | Sets `status = COMPLETED`, queries final scores | `game-ended` with teams sorted by score |
| `reveal-question` | Instructor | Sets `currentSlotId`, `questionStartedAt`; enables buzzer unless Daily Double | `question-revealed` with full slot details |
| `close-question` | Instructor | Clears currentSlotId, currentTeamId, wager, buzzer | `question-closed` |
| `submit-wager` | Instructor | Sets `currentWager` + `currentTeamId` for Daily Double | `wager-submitted` |
| `answer` | Instructor | Awards/deducts points: `+points` correct, `-points` wrong; marks slot answered; clears state | `answer-submitted` with updated teams + answeredSlots |
| `enable-buzzer` | Instructor | Sets `buzzerEnabled = true` | `buzzer-enabled` |
| `buzzer` | Student | Records `buzzerAt`, sets `buzzerEnabled = false` | `buzzer-pressed` with student + team info |
| `assign-team` | Instructor | Updates `student.teamId` | `team-assigned` with updated students/teams |

### Triggered by REST (Server → Broadcast)

| Event | Trigger | Broadcast |
|---|---|---|
| Student joins | POST `/api/students/join` | `student-joined` to all clients |

### Error Handling

All errors return: `{ type: "error", message: string }`

---

## Routes

### Public

| Route | Description |
|---|---|
| `GET /` | Landing page, shows instructor login state |
| `GET/POST /login` | Email + password login, creates session, redirects to `/dashboard` |
| `GET/POST /register` | Create instructor account (name, email, password 8+ chars), redirects to `/dashboard` |

### Student Game Flow

| Route | Description |
|---|---|
| `GET /game/[code]/join` | Name entry form → POST `/api/students/join` → redirects to `/game/[code]/play?studentId=` |
| `GET /game/[code]/play` | Student view: board with answered slots, buzzer button, scoreboard, current question display |
| `GET /game/[code]/projector` | Projector/display view: large board, current question, team scores, connection status |
| `GET /game/[code]/results` | Final standings (only accessible when `status = COMPLETED`) |

### Instructor Dashboard

| Route | Description |
|---|---|
| `GET /dashboard` | Home, links to boards/questions/games |
| `GET /dashboard/questions` | List all questions with tag filtering and search; bulk import/export JSON |
| `GET/POST /dashboard/questions/new` | Create question: clue (answer), response (question), tags |
| `GET /dashboard/questions/[id]/edit` | Edit question |
| `GET /dashboard/boards` | List boards; shows completion badge (must have all 30 slots filled to use) |
| `GET/POST /dashboard/boards/new` | Create board: 6 categories × 5 questions |
| `GET /dashboard/boards/[id]/edit` | Edit board: assign questions to slots, mark Daily Doubles |
| `GET /dashboard/games` | List games grouped by status (LOBBY / IN_PROGRESS / COMPLETED) |
| `GET/POST /dashboard/games/new` | Create game: pick board, team count (2–6), team names + colors, assignment mode |
| `GET /dashboard/games/[id]/lobby` | Lobby: large game code display, QR code, connected students, team assignment, start button |
| `GET /dashboard/games/[id]/play` | Instructor control panel: reveal questions, manage buzzer, confirm answers, Daily Double wager, end game |
| `GET /dashboard/games/[id]/results` | Final standings with team members and scores |

### REST API

| Endpoint | Methods | Description |
|---|---|---|
| `/api/ws/[gameId]` | GET | WebSocket upgrade, proxied to GameHub DO |
| `/api/questions` | GET, POST | List/search questions; create question |
| `/api/questions/[id]` | GET, PUT, DELETE | CRUD for individual question |
| `/api/questions/import` | POST | Bulk import from JSON: `{ version: "1.0", questions: [...] }` |
| `/api/questions/export` | GET | Export all instructor questions as JSON |
| `/api/questions/search` | GET | Full-text search with tag filtering |
| `/api/boards` | GET, POST | List boards; create board with categories and slots |
| `/api/boards/[id]` | GET, PUT, DELETE | CRUD for individual board |
| `/api/games` | GET, POST | List games; create game (validates board has 30 slots, creates teams + gameState) |
| `/api/games/[id]` | GET | Full game with board, teams, students, gameState |
| `/api/students/join` | POST | Create student, assign team, broadcast `student-joined` |
| `/api/auth/logout` | POST | Delete session, clear cookie |

---

## UI Components

### `JeopardyBoard.svelte`
- Props: `categories[]`, `answeredSlots[]`
- Renders a 6-column × 5-row grid
- Column headers: category names
- Cells: point value (or checkmark icon if answered)
- Daily Doubles: yellow ring highlight
- Theme: dark navy blue background, yellow/gold text

### `QuestionDisplay.svelte`
- Props: `categoryName`, `points`, `isDailyDouble`, `clue`, `wager?`
- Full-screen clue display
- Header: category name + point value (or wager amount for Daily Double)
- Body: large, centered clue text
- Theme: blue gradient background

### `ConnectionStatus.svelte`
- Props: `status: 'connected' | 'connecting' | 'disconnected'`
- Renders: colored dot (green / yellow / red) + status label

---

## Game Flow (End-to-End)

### 1. Setup
1. Instructor registers/logs in
2. Creates questions (clue + correct response + optional tags)
3. Creates a board: names 6 categories, fills each with 5 questions (30 total slots); optionally marks any slot as Daily Double
4. Creates a game: selects board, sets team count (2–6), names/colors each team, chooses MANUAL or RANDOM team assignment

### 2. Lobby
1. Game code (6 chars) and QR code displayed prominently
2. Students navigate to join URL, enter name, get assigned to a team
3. RANDOM mode: auto-balances team sizes on join
4. MANUAL mode: students join unassigned; instructor drags/assigns in lobby
5. Instructor sees real-time student joins via WebSocket
6. Instructor clicks "Start Game" when ready (locks teams)

### 3. Play
1. All clients (instructor, students, projectors) connected via WebSocket
2. Instructor clicks a board cell to reveal a question; clue appears on all screens
3. **Regular question**: buzzer immediately opens for students
4. **Daily Double**: instructor selects team and enters wager first; then buzzer opens
5. First student to press buzzer locks it; instructor sees who buzzed with their team
6. Instructor marks answer correct or incorrect:
   - Correct: team score += points (or wager)
   - Incorrect: team score -= points (or wager)
7. Slot marked as answered on the board for all clients
8. Instructor can also manually close a question without scoring
9. Repeat until all desired questions answered

### 4. Results
1. Instructor clicks "End Game"
2. All clients receive `game-ended` broadcast with final scores
3. Results page shows final standings: teams sorted by score, with members listed

---

## Key Implementation Details

- **All timestamps**: ISO 8601 strings (avoids SQLite DATE type issues with JSON serialization)
- **Game codes**: 6-char alphanumeric, confusable characters removed (`I`, `O`, `l`, `0`, `1`)
- **Board validation**: Board must have exactly 30 filled slots before it can be used to create a game
- **Score logic**: `scoreChange = isCorrect ? +points : -points`; Daily Double uses `currentWager` instead of `slot.points`
- **Team assignment (RANDOM)**: On each student join, assign to the team with the fewest current members
- **Buzzer lock**: When a student presses the buzzer, `buzzerEnabled` is set to false and all other students' buzzers are disabled until the instructor re-enables or a new question is revealed
- **DO per game**: Each game gets its own Durable Object instance, keyed by `gameId`
- **WebSocket proxy**: The SvelteKit `/api/ws/[gameId]` route validates auth/role, then uses `platform.env.GAME_HUB.get(id).fetch()` to proxy into the DO

---

## File Structure

```
src/
├── app.d.ts                        # App.Locals + App.Platform type declarations
├── do-worker.ts                    # DO Worker entry point (exports GameHub)
├── hooks.server.ts                 # Session validation + route protection
├── lib/
│   ├── db.ts                       # getDb(d1) factory
│   ├── server/
│   │   ├── auth.ts                 # Session/password functions
│   │   ├── game-hub.ts             # GameHub Durable Object (WebSocket state machine)
│   │   ├── qr.ts                   # QR code + game code generation
│   │   └── schema.ts               # Full Drizzle schema with relations
│   └── components/
│       ├── JeopardyBoard.svelte
│       ├── QuestionDisplay.svelte
│       └── ConnectionStatus.svelte
└── routes/
    ├── +page.svelte                # Landing
    ├── login/
    ├── register/
    ├── game/[code]/
    │   ├── join/
    │   ├── play/
    │   ├── projector/
    │   └── results/
    ├── dashboard/
    │   ├── questions/
    │   ├── boards/
    │   └── games/
    └── api/
        ├── ws/[gameId]/
        ├── questions/
        ├── boards/
        ├── games/
        ├── students/join/
        └── auth/logout/

drizzle/                            # D1 migration files
wrangler.json                       # Pages deployment config
wrangler.worker.json                # DO Worker deployment config
vite.config.ts                      # Vite + inject-durable-objects plugin
```

---

## Platform Types (`src/app.d.ts`)

```typescript
declare global {
  namespace App {
    interface Locals {
      instructor: {
        id: string
        email: string
        name: string
      } | null
    }
    interface Platform {
      env: {
        DB: D1Database
        GAME_HUB: DurableObjectNamespace
      }
      context: {
        waitUntil(promise: Promise<unknown>): void
      }
      caches: CacheStorage & { default: Cache }
    }
  }
}
```
