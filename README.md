# Classroom Jeopardy Game

A web-based Jeopardy game built for classroom settings where an instructor manages the game and students participate in teams.

## Tech Stack

- **Frontend**: SvelteKit + Tailwind CSS
- **Database**: Neon (Serverless Postgres)
- **ORM**: Prisma
- **Hosting**: Vercel
- **Real-time**: Server-Sent Events (SSE)

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Database

1. Create a free account at [Neon](https://neon.tech)
2. Create a new project and database
3. Copy your connection string
4. Update `.env` file with your database URL:

```env
DATABASE_URL="your-neon-connection-string-here"
```

### 3. Run Database Migrations

```bash
npx prisma migrate dev
```

This will create all the necessary tables in your database.

### 4. Generate Session Secret

Generate a secure session secret:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Add it to your `.env` file:

```env
SESSION_SECRET="your-generated-secret-here"
```

### 5. Start Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## Project Structure

```
src/
├── routes/              # SvelteKit file-based routing
│   ├── +page.svelte    # Landing page
│   ├── login/          # Login page
│   ├── register/       # Registration page
│   ├── dashboard/      # Protected instructor dashboard
│   └── api/            # API endpoints
├── lib/
│   ├── components/     # Reusable Svelte components
│   └── server/         # Server-only code (Prisma, auth, etc.)
└── app.css            # Tailwind CSS imports

prisma/
└── schema.prisma      # Database schema
```

## Features

### ✅ Implemented (Phases 1-5)

- **Authentication System**: Secure instructor login and registration
- **Question Bank Management**:
  - Create, edit, and delete questions
  - Search and filter questions by text or tags
  - Tag system for categorization
  - Export questions to JSON
  - Import questions from JSON
  - Reusable questions across multiple boards
- **Board Management**:
  - Create custom Jeopardy boards with 6 categories
  - Select questions from question bank for each slot (5 per category)
  - Assign custom point values (default 200-1000)
  - Mark Daily Doubles
  - Edit and delete boards
  - Progress tracking and validation
  - Visual board preview
- **Game Creation & Setup**:
  - Create games from complete boards
  - Generate QR codes for student join
  - Configure 2-6 teams with custom names and colors
  - Manual or automatic team assignment
  - Game lobby with real-time student tracking
  - Copy join URL for easy sharing
- **Student Join Flow**:
  - Scan QR code or enter game code
  - Enter name to join game
  - Automatic or manual team assignment
  - Team confirmation screen
- **Instructor Game Play**:
  - Classic Jeopardy board UI with blue/gold theme
  - 6x5 grid of clickable question cards
  - Real-time team scoreboard
  - Question reveal modal with clue and response
  - Team selection for answering
  - Correct/Incorrect scoring buttons
  - Automatic score calculation (+/- points)
  - Visual feedback for answered questions
  - Daily Double indication
  - Progress tracking
- **Dashboard**: Protected instructor area with quick actions

- **Student Game View**:
  - Scan QR code or enter game code to join
  - Team assignment and score display
  - Live question clues when revealed by instructor
  - Interactive buzzer button (large, red, prominent)
  - Buzzer enabled/disabled states based on game rules
  - Visual feedback for buzzer presses
  - All teams scoreboard
  - Waiting states for lobby and between questions
  - Daily Double indication

- **Real-time Updates** (SSE):
  - Server-Sent Events for live game synchronization
  - Real-time score updates across all clients
  - Buzzer press notifications to instructor
  - Question reveal broadcast to all students
  - Automatic state synchronization

### 🚧 Coming Next (Phase 8+)

- **Advanced Features**: Final Jeopardy, sound effects, animations
- **Game History**: View past games and results
- **Enhanced UI**: Transitions, animations, sound effects

## Development

### Prisma Commands

```bash
# Create a new migration
npx prisma migrate dev --name migration_name

# Reset database
npx prisma migrate reset

# Open Prisma Studio (database GUI)
npx prisma studio

# Generate Prisma Client (after schema changes)
npx prisma generate
```

### Build for Production

```bash
npm run build
npm run preview
```

## Deployment

This project is configured for Vercel deployment:

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

## Environment Variables

Required environment variables (see `.env.example`):

- `DATABASE_URL` - Neon Postgres connection string
- `SESSION_SECRET` - Random secret for session encryption
- `PUBLIC_APP_URL` - Your app's public URL
- `NODE_ENV` - Environment (development/production)

## License

MIT
