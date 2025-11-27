# Classroom Jeopardy Game - Implementation Plan

## Project Overview

A web-based Jeopardy game built for classroom settings where an instructor manages the game and students participate in teams. Built with SvelteKit, Tailwind CSS, Vercel, Neon DB, and Prisma.

**Note**: This plan has been updated to follow SvelteKit conventions and best practices including:

- File-based routing with `+page.svelte` and `+server.ts` files
- Form actions using `+page.server.ts`
- Session-based authentication with `hooks.server.ts`
- Components in `src/lib/components/`
- Server-only code in `src/lib/server/`
- SSE for real-time updates

## Technology Stack

- **Frontend Framework**: SvelteKit
- **Styling**: Tailwind CSS
- **Database**: Neon (Serverless Postgres)
- **ORM**: Prisma
- **Hosting**: Vercel (with adapter-vercel)
- **Real-time Updates**: Server-Sent Events (SSE)
- **Authentication**: Session-based with cookies (using hooks.server.ts)
- **QR Code Generation**: qrcode library

## Core Features & Requirements

### 1. User Roles

- **Instructor**: Single authenticated user who controls the game
- **Students**: Unauthenticated users who join via QR code

### 2. Question Bank Management (Instructor)

- Create and manage reusable questions:
  - Answer (the clue shown to players)
  - Question (the correct response)
  - Tags for categorization and easy searching
  - No point values (assigned at board level)
- Search and filter questions by tags
- Import/export question sets
- Questions are independent, reusable entities

### 3. Board Building (Instructor)

- Create/edit Jeopardy boards:
  - 6 categories per board
  - 5 questions per category (selected from question bank)
  - Assign point values per position (typically 200, 400, 600, 800, 1000)
  - Mark specific questions as Daily Doubles on the board
  - Reuse questions across multiple boards
- Board templates for quick setup
- Same question can appear in different boards with different point values

### 4. Game Setup (Instructor)

- Select a board for the game
- Configure teams:
  - Set number of teams
  - Assign team names/colors
  - Choose assignment mode: manual or random
- Generate shareable QR code for student join

### 5. Student Join Flow

- Scan QR code → Join page
- Enter name
- Get assigned to team (manual approval or auto-random)
- See team assignment and current score

### 6. Gameplay Flow

- Instructor view:
  - Full Jeopardy board with all categories and point values
  - Click card → Question reveals to instructor
  - Mark answer as correct/incorrect
  - Track which team is answering
  - See all team scores
  - Control game flow (next question, reset, etc.)
- Student view:
  - Team name and color
  - Current team score
  - Buzzer button (when question is active)
  - Simple, minimal UI

### 7. Game Mechanics

- Team selection for each question
- Question reveal
- Buzzer system (first to buzz gets to answer)
- Correct answer: Add points to team score
- Incorrect answer: Subtract points, allow other teams to buzz
- Daily Double: Only selected team can wager and answer
- Track which questions have been answered

## Database Schema

### Models

```prisma
model Instructor {
  id        String     @id @default(cuid())
  email     String     @unique
  password  String     // hashed
  name      String
  questions Question[] // Question bank owned by instructor
  boards    Board[]
  games     Game[]
  createdAt DateTime   @default(now())
  updatedAt DateTime   @updatedAt
}

model Question {
  id           String              @id @default(cuid())
  answer       String              // The clue shown to players
  question     String              // The correct response
  instructorId String
  instructor   Instructor          @relation(fields: [instructorId], references: [id], onDelete: Cascade)
  tags         QuestionTag[]
  boardSlots   BoardQuestionSlot[] // Questions can be used in multiple boards
  createdAt    DateTime            @default(now())
  updatedAt    DateTime            @updatedAt
}

model Tag {
  id        String        @id @default(cuid())
  name      String        @unique
  questions QuestionTag[]
  createdAt DateTime      @default(now())
}

model QuestionTag {
  questionId String
  question   Question @relation(fields: [questionId], references: [id], onDelete: Cascade)
  tagId      String
  tag        Tag      @relation(fields: [tagId], references: [id], onDelete: Cascade)

  @@id([questionId, tagId])
}

model Board {
  id           String     @id @default(cuid())
  name         String
  description  String?
  instructorId String
  instructor   Instructor @relation(fields: [instructorId], references: [id], onDelete: Cascade)
  categories   Category[]
  games        Game[]
  createdAt    DateTime   @default(now())
  updatedAt    DateTime   @updatedAt
}

model Category {
  id         String              @id @default(cuid())
  name       String
  order      Int                 // 0-5 for positioning
  boardId    String
  board      Board               @relation(fields: [boardId], references: [id], onDelete: Cascade)
  slots      BoardQuestionSlot[] // 5 slots per category
  createdAt  DateTime            @default(now())
  updatedAt  DateTime            @updatedAt
}

// Join table linking questions to board positions with point values
model BoardQuestionSlot {
  id            String   @id @default(cuid())
  categoryId    String
  category      Category @relation(fields: [categoryId], references: [id], onDelete: Cascade)
  questionId    String
  question      Question @relation(fields: [questionId], references: [id])
  position      Int      // 0-4 (row position in category)
  points        Int      // Point value for this position (200, 400, 600, 800, 1000)
  isDailyDouble Boolean  @default(false)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@unique([categoryId, position])
}

model Game {
  id              String        @id @default(cuid())
  code            String        @unique // Join code for QR
  boardId         String
  board           Board         @relation(fields: [boardId], references: [id])
  instructorId    String
  instructor      Instructor    @relation(fields: [instructorId], references: [id])
  status          GameStatus    @default(LOBBY)
  teamAssignment  TeamAssignment @default(RANDOM)
  teams           Team[]
  students        Student[]
  gameState       GameState?
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
}

enum GameStatus {
  LOBBY
  IN_PROGRESS
  COMPLETED
}

enum TeamAssignment {
  MANUAL
  RANDOM
}

model Team {
  id        String    @id @default(cuid())
  name      String
  color     String
  score     Int       @default(0)
  gameId    String
  game      Game      @relation(fields: [gameId], references: [id], onDelete: Cascade)
  students  Student[]
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
}

model Student {
  id        String   @id @default(cuid())
  name      String
  gameId    String
  game      Game     @relation(fields: [gameId], references: [id], onDelete: Cascade)
  teamId    String?
  team      Team?    @relation(fields: [teamId], references: [id])
  buzzerAt  DateTime? // Last buzzer press timestamp
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model GameState {
  id                String   @id @default(cuid())
  gameId            String   @unique
  game              Game     @relation(fields: [gameId], references: [id], onDelete: Cascade)
  currentSlotId     String?  // Current BoardQuestionSlot being played
  answeredSlots     String[] // Array of BoardQuestionSlot IDs that have been answered
  currentTeamId     String?  // Team currently answering
  questionStartedAt DateTime?
  buzzerEnabled     Boolean  @default(false)
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
}
```

## Application Structure

```
/
├── src/
│   ├── routes/
│   │   ├── +page.svelte              # Landing page
│   │   ├── +layout.svelte            # Root layout
│   │   ├── +layout.server.ts         # Root layout server load
│   │   ├── login/
│   │   │   ├── +page.svelte          # Login page
│   │   │   └── +page.server.ts       # Login form actions
│   │   ├── register/
│   │   │   ├── +page.svelte          # Registration page
│   │   │   └── +page.server.ts       # Register form actions
│   │   ├── dashboard/
│   │   │   ├── +layout.svelte        # Dashboard layout (protected)
│   │   │   ├── +layout.server.ts     # Auth check
│   │   │   ├── +page.svelte          # Dashboard home
│   │   │   ├── questions/
│   │   │   │   ├── +page.svelte      # Question list/search
│   │   │   │   ├── +page.server.ts   # Load questions
│   │   │   │   ├── new/
│   │   │   │   │   ├── +page.svelte  # Create question
│   │   │   │   │   └── +page.server.ts # Create action
│   │   │   │   └── [questionId]/
│   │   │   │       ├── edit/
│   │   │   │       │   ├── +page.svelte
│   │   │   │       │   └── +page.server.ts
│   │   │   │       └── +page.server.ts # Delete action
│   │   │   ├── boards/
│   │   │   │   ├── +page.svelte      # Board list
│   │   │   │   ├── +page.server.ts   # Load boards
│   │   │   │   ├── new/
│   │   │   │   │   ├── +page.svelte
│   │   │   │   │   └── +page.server.ts
│   │   │   │   └── [boardId]/
│   │   │   │       ├── edit/
│   │   │   │       │   ├── +page.svelte
│   │   │   │       │   └── +page.server.ts
│   │   │   │       └── +page.server.ts
│   │   │   └── games/
│   │   │       ├── +page.svelte      # Game list
│   │   │       ├── +page.server.ts
│   │   │       └── new/
│   │   │           ├── +page.svelte
│   │   │           └── +page.server.ts
│   │   ├── game/
│   │   │   └── [gameId]/
│   │   │       ├── instructor/
│   │   │       │   ├── +page.svelte  # Instructor view
│   │   │       │   └── +page.server.ts
│   │   │       ├── join/
│   │   │       │   ├── +page.svelte  # Student join
│   │   │       │   └── +page.server.ts
│   │   │       └── play/
│   │   │           ├── +page.svelte  # Student play view
│   │   │           └── +page.server.ts
│   │   └── api/
│   │       ├── auth/
│   │       │   ├── login/
│   │       │   │   └── +server.ts    # Login API
│   │       │   ├── logout/
│   │       │   │   └── +server.ts    # Logout API
│   │       │   └── me/
│   │       │       └── +server.ts    # Current user API
│   │       ├── questions/
│   │       │   ├── +server.ts        # List/Create questions
│   │       │   ├── [id]/
│   │       │   │   └── +server.ts    # Get/Update/Delete
│   │       │   ├── search/
│   │       │   │   └── +server.ts    # Search by tags
│   │       │   ├── import/
│   │       │   │   └── +server.ts    # Bulk import
│   │       │   └── export/
│   │       │       └── +server.ts    # Export all
│   │       ├── tags/
│   │       │   ├── +server.ts        # List/Create tags
│   │       │   └── [id]/
│   │       │       └── +server.ts    # Delete tag
│   │       ├── boards/
│   │       │   ├── +server.ts        # List/Create boards
│   │       │   └── [id]/
│   │       │       └── +server.ts    # Get/Update/Delete
│   │       ├── games/
│   │       │   ├── +server.ts        # Create game
│   │       │   └── [id]/
│   │       │       ├── +server.ts    # Get game
│   │       │       ├── start/
│   │       │       │   └── +server.ts
│   │       │       ├── end/
│   │       │       │   └── +server.ts
│   │       │       ├── reveal-question/
│   │       │       │   └── +server.ts
│   │       │       ├── answer/
│   │       │       │   └── +server.ts
│   │       │       └── assign-team/
│   │       │           └── +server.ts
│   │       ├── students/
│   │       │   ├── join/
│   │       │   │   └── +server.ts    # Join game
│   │       │   └── buzzer/
│   │       │       └── +server.ts    # Press buzzer
│   │       └── sse/
│   │           └── [gameId]/
│   │               └── +server.ts    # SSE endpoint
│   ├── lib/
│   │   ├── components/
│   │   │   ├── auth/
│   │   │   │   └── ProtectedRoute.svelte
│   │   │   ├── question-bank/
│   │   │   │   ├── QuestionList.svelte
│   │   │   │   ├── QuestionForm.svelte
│   │   │   │   ├── TagSelector.svelte
│   │   │   │   └── QuestionSearch.svelte
│   │   │   ├── board/
│   │   │   │   ├── BoardEditor.svelte
│   │   │   │   ├── CategoryEditor.svelte
│   │   │   │   ├── QuestionSlotPicker.svelte
│   │   │   │   └── PointValueSelector.svelte
│   │   │   ├── game/
│   │   │   │   ├── JeopardyBoard.svelte
│   │   │   │   ├── QuestionCard.svelte
│   │   │   │   ├── TeamScoreboard.svelte
│   │   │   │   ├── QuestionModal.svelte
│   │   │   │   ├── BuzzerButton.svelte
│   │   │   │   ├── TeamAssignment.svelte
│   │   │   │   └── QRCodeDisplay.svelte
│   │   │   └── ui/
│   │   │       └── [shadcn-svelte]   # Button, Card, Input, etc.
│   │   ├── server/
│   │   │   ├── prisma.ts             # Prisma client
│   │   │   ├── auth.ts               # Auth utilities
│   │   │   ├── qr.ts                 # QR code generation
│   │   │   └── realtime.ts           # SSE logic
│   │   └── stores/
│   │       └── game.ts               # Client-side game stores
│   ├── hooks.server.ts               # SvelteKit hooks (auth)
│   └── app.css                       # Tailwind imports
├── static/                           # Public assets
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── svelte.config.js
├── vite.config.ts
├── tailwind.config.js
└── package.json
```

## Implementation Phases

### ✅ Phase 1: Project Setup & Authentication (COMPLETED)

1. ✅ Initialize SvelteKit project with TypeScript
2. ✅ Install and configure Tailwind CSS
3. ✅ Install Prisma and configure Neon database connection
4. ✅ Set up Prisma schema and run initial migration
5. ✅ Implement session-based authentication in hooks.server.ts
6. ✅ Create login/register pages with form actions
7. ✅ Create protected route layout for dashboard

### ✅ Phase 2: Question Bank System (COMPLETED)

1. ✅ Create API endpoints (+server.ts) for question CRUD
2. ✅ Implement tag system API endpoints
3. ✅ Build question creation/edit forms using SvelteKit form actions
4. ✅ Create question list page with search and tag filters
5. ✅ Add export/import functionality for question sets (JSON)

### ✅ Phase 3: Board Management (COMPLETED)

1. ✅ Create board CRUD API endpoints (+server.ts)
2. ✅ Build board editor Svelte component with 6 categories
3. ✅ Create question slot picker component to select from question bank
4. ✅ Implement point value assignment UI (5 per category)
5. ✅ Add Daily Double marking functionality
6. ✅ Create board preview component with validation
7. ✅ Build board list page with management features

### ✅ Phase 4: Game Creation & Setup (COMPLETED)

1. ✅ Create game API endpoints and form actions
2. ✅ Build team configuration interface (Svelte components)
3. ✅ Implement QR code generation using qrcode library
4. ✅ Create student join page with form submission
5. ✅ Implement manual vs random team assignment logic

### ✅ Phase 5: Instructor Game View (COMPLETED)

1. ✅ Build Jeopardy board Svelte component with clickable cards
2. ✅ Create question reveal modal component
3. ✅ Add correct/incorrect button handlers with form actions
4. ✅ Implement team score tracking with Svelte stores
5. ✅ Add visual feedback for answered questions (CSS states)
6. ✅ Create game state management using Svelte stores and reactive statements

### ✅ Phase 6: Student Game View (COMPLETED)

1. ✅ Build simple student UI Svelte component with team info
2. ✅ Create team score display component
3. ✅ Implement buzzer button component with form submission
4. ⏭️ Add real-time updates using SSE and Svelte stores (moved to Phase 7)
5. ✅ Handle buzzer lock/unlock states based on game state

### ✅ Phase 7: Real-time Communication (COMPLETED)

1. ✅ Implement SSE endpoint (+server.ts) with proper headers
2. ✅ Create server-side broadcast mechanism for game state updates
3. ✅ Handle buzzer press API endpoint with timestamp validation and broadcasting
4. ✅ Implement real-time score updates via SSE
5. ✅ Add question state synchronization across all clients

### Phase 8: Advanced Features

1. Implement Daily Double with wager UI component and validation
2. Create game history page with results display
3. Add export/import functionality for boards (JSON)
4. Implement multiple game rounds support
5. Add sound effects and Svelte transitions/animations

### Phase 9: Polish & Deployment

1. Refine responsive design with Tailwind breakpoints
2. Add comprehensive error handling and form validation
3. Implement loading states with Svelte's loading data
4. Add ARIA labels and keyboard navigation for accessibility
5. Configure environment variables (.env and Vercel)
6. Install and configure @sveltejs/adapter-vercel
7. Run and verify database migrations on Neon
8. Add unit tests with Vitest and E2E tests with Playwright

## Key Technical Considerations

### Question Bank Architecture

- Questions are completely separate from boards
- Questions store only answer/question text and tags
- Point values assigned when question is added to a board slot
- Same question can appear in multiple boards with different points
- Efficient search/filter using tag-based indexing

### Board Building Flow

1. Create board with name/description
2. Add 6 categories
3. For each category, add 5 question slots
4. For each slot: select question from bank, assign points, optionally mark as Daily Double
5. Validation: Ensure all 30 slots are filled before board can be used

### Real-time Updates

Use Server-Sent Events (SSE) for simplicity:

- Instructor actions broadcast to all students
- Students send buzzer presses via POST
- Game state updates pushed to all clients

### QR Code Join Flow

1. Generate unique game code (e.g., 6-char alphanumeric)
2. Create QR code pointing to: `https://yourapp.com/game/{gameCode}/join`
3. Students scan → join page → enter name → auto-assign or wait for instructor

### Buzzer Logic

- When question revealed, enable buzzers for all students
- First buzzer press locks out others
- Instructor sees who buzzed first
- Correct: Award points, disable buzzers, next question
- Incorrect: Subtract points, re-enable buzzers for remaining teams

### Score Management

- All score updates handled server-side
- Points come from BoardQuestionSlot, not Question
- Optimistic updates on client
- Verify through real-time sync

### Security

- Instructor routes protected by authentication
- Game codes expire or can be deactivated
- Rate limiting on buzzer endpoint
- Input validation on all forms

## Design Considerations

### Question Bank UI

- Clean, searchable interface
- Tag pills for quick filtering
- Batch operations (delete, export)
- Preview of question usage (how many boards use it)
- Quick add button with modal form

### Board Builder UI

- Visual grid layout (6 columns × 5 rows)
- Click slot → modal to pick question from bank
- Dropdown or inline editor for point values
- Daily Double toggle per slot
- Visual validation (highlight empty slots)
- Drag-and-drop for reordering questions (optional)

### Instructor View

- Classic Jeopardy board aesthetic (blue background, gold text)
- Large, readable category names
- Point values clearly visible
- Clicked/answered cards visually distinct (darker/grayed out)
- Prominent team scoreboard
- Clear question modal with large text

### Student View

- Minimal, distraction-free interface
- Large buzzer button (primary action)
- Team color accent
- Score prominently displayed
- Mobile-first design (students likely on phones)

### Color Scheme (Classic Jeopardy)

- Primary: Blue (#060CE9)
- Accent: Gold/Yellow (#FFD700)
- Background: Dark blue gradient
- Text: White/Light yellow
- Team colors: Red, Blue, Green, Yellow, Purple, Orange

## Environment Variables

```env
DATABASE_URL=              # Neon Postgres connection string
SESSION_SECRET=            # For session cookie encryption (use crypto.randomBytes(32).toString('hex'))
PUBLIC_APP_URL=            # Public app URL for QR codes (e.g., https://yourapp.vercel.app)
NODE_ENV=                  # production/development
```

## API Endpoints Summary

All endpoints are implemented as SvelteKit +server.ts files with RequestHandler exports.

### Authentication

- `POST /api/auth/login` - Instructor login (returns session cookie)
- `POST /api/auth/logout` - Logout (clears session)
- `GET /api/auth/me` - Current instructor info

Note: Registration can be handled via page form actions in `/register/+page.server.ts`

### Question Bank

- `GET /api/questions` - List all questions (with search/filter query params)
- `POST /api/questions` - Create question
- `GET /api/questions/[id]` - Get question details
- `PUT /api/questions/[id]` - Update question
- `DELETE /api/questions/[id]` - Delete question
- `GET /api/questions/search` - Search by tags (query params)
- `POST /api/questions/import` - Bulk import questions (JSON body)
- `GET /api/questions/export` - Export question bank (JSON response)

### Tags

- `GET /api/tags` - List all tags
- `POST /api/tags` - Create tag
- `DELETE /api/tags/[id]` - Delete tag

### Boards

- `GET /api/boards` - List all boards
- `POST /api/boards` - Create board
- `GET /api/boards/[id]` - Get board details (with categories and slots)
- `PUT /api/boards/[id]` - Update board
- `DELETE /api/boards/[id]` - Delete board

### Games

- `POST /api/games` - Create new game (returns game code)
- `GET /api/games/[id]` - Get game state
- `POST /api/games/[id]/start` - Start game
- `POST /api/games/[id]/end` - End game
- `POST /api/games/[id]/reveal-question` - Reveal question
- `POST /api/games/[id]/answer` - Mark answer correct/incorrect
- `POST /api/games/[id]/assign-team` - Assign student to team

### Students

- `POST /api/students/join` - Join game (body: {name, gameCode})
- `POST /api/students/buzzer` - Press buzzer (body: {studentId, gameId})
- `GET /api/sse/[gameId]` - SSE connection for real-time updates

## Success Metrics

- Instructor can create 10 questions in < 5 minutes
- Instructor can build a board from existing questions in < 3 minutes
- Questions can be reused across multiple boards seamlessly
- Tag-based search returns results in < 500ms
- Students can join game in < 30 seconds
- Buzzer response time < 200ms
- No score synchronization issues
- Game runs smoothly with 30+ students

## Future Enhancements

- Final Jeopardy round with wagers
- Multiple rounds (Jeopardy, Double Jeopardy)
- Image/video support in questions
- Collaborative question banks (share between instructors)
- Question difficulty ratings
- Question usage analytics (track which questions are used most)
- Suggested questions based on category/tags
- Leaderboard across multiple games
- Student statistics and performance tracking
- Mobile app version
- Voice control for instructor
- Automatic question reading (text-to-speech)
- Pre-built question packs by subject (Math, Science, History, etc.)

---

## Sources

Game rules and mechanics researched from:

- [How to Play Jeopardy! - Rutgers](https://tag.rutgers.edu/wp-content/uploads/2014/05/Jeopardy-instructions.pdf)
- [Jeopardy! - Wikipedia](https://en.wikipedia.org/wiki/Jeopardy!)
- [How to play Jeopardy! Official Rules - UltraBoardGames](https://www.ultraboardgames.com/jeopardy/game-rules.php)
- [Game Rules - Jeopardy.com](https://www.jeopardy.com/jbuzz/tagged/game-rules)
