import { sqliteTable, text, integer, unique } from 'drizzle-orm/sqlite-core';
import { relations, sql } from 'drizzle-orm';

// ─── Instructors ──────────────────────────────────────────────────────────────

export const instructors = sqliteTable('instructors', {
	id: text('id').primaryKey(),
	email: text('email').notNull().unique(),
	password: text('password').notNull(),
	name: text('name').notNull(),
	createdAt: text('created_at')
		.notNull()
		.default(sql`(datetime('now'))`),
	updatedAt: text('updated_at')
		.notNull()
		.default(sql`(datetime('now'))`)
});

export const instructorsRelations = relations(instructors, ({ many }) => ({
	questions: many(questions),
	boards: many(boards),
	games: many(games),
	sessions: many(sessions)
}));

// ─── Sessions ─────────────────────────────────────────────────────────────────

export const sessions = sqliteTable('sessions', {
	id: text('id').primaryKey(),
	instructorId: text('instructor_id')
		.notNull()
		.references(() => instructors.id, { onDelete: 'cascade' }),
	expiresAt: text('expires_at').notNull(),
	createdAt: text('created_at')
		.notNull()
		.default(sql`(datetime('now'))`),
	updatedAt: text('updated_at')
		.notNull()
		.default(sql`(datetime('now'))`)
});

export const sessionsRelations = relations(sessions, ({ one }) => ({
	instructor: one(instructors, {
		fields: [sessions.instructorId],
		references: [instructors.id]
	})
}));

// ─── Questions ────────────────────────────────────────────────────────────────

export const questions = sqliteTable('questions', {
	id: text('id').primaryKey(),
	clue: text('clue').notNull(),
	response: text('response').notNull(),
	instructorId: text('instructor_id')
		.notNull()
		.references(() => instructors.id, { onDelete: 'cascade' }),
	createdAt: text('created_at')
		.notNull()
		.default(sql`(datetime('now'))`),
	updatedAt: text('updated_at')
		.notNull()
		.default(sql`(datetime('now'))`)
});

export const questionsRelations = relations(questions, ({ one, many }) => ({
	instructor: one(instructors, {
		fields: [questions.instructorId],
		references: [instructors.id]
	}),
	tags: many(questionTags),
	boardSlots: many(boardQuestionSlots)
}));

// ─── Tags ─────────────────────────────────────────────────────────────────────

export const tags = sqliteTable('tags', {
	id: text('id').primaryKey(),
	name: text('name').notNull().unique(),
	createdAt: text('created_at')
		.notNull()
		.default(sql`(datetime('now'))`)
});

export const tagsRelations = relations(tags, ({ many }) => ({
	questions: many(questionTags)
}));

// ─── QuestionTags (join table) ────────────────────────────────────────────────

export const questionTags = sqliteTable(
	'question_tags',
	{
		questionId: text('question_id')
			.notNull()
			.references(() => questions.id, { onDelete: 'cascade' }),
		tagId: text('tag_id')
			.notNull()
			.references(() => tags.id, { onDelete: 'cascade' })
	},
	(t) => [unique().on(t.questionId, t.tagId)]
);

export const questionTagsRelations = relations(questionTags, ({ one }) => ({
	question: one(questions, {
		fields: [questionTags.questionId],
		references: [questions.id]
	}),
	tag: one(tags, {
		fields: [questionTags.tagId],
		references: [tags.id]
	})
}));

// ─── Boards ───────────────────────────────────────────────────────────────────

export const boards = sqliteTable('boards', {
	id: text('id').primaryKey(),
	name: text('name').notNull(),
	description: text('description'),
	instructorId: text('instructor_id')
		.notNull()
		.references(() => instructors.id, { onDelete: 'cascade' }),
	createdAt: text('created_at')
		.notNull()
		.default(sql`(datetime('now'))`),
	updatedAt: text('updated_at')
		.notNull()
		.default(sql`(datetime('now'))`)
});

export const boardsRelations = relations(boards, ({ one, many }) => ({
	instructor: one(instructors, {
		fields: [boards.instructorId],
		references: [instructors.id]
	}),
	categories: many(categories),
	games: many(games)
}));

// ─── Categories ───────────────────────────────────────────────────────────────

export const categories = sqliteTable('categories', {
	id: text('id').primaryKey(),
	name: text('name').notNull(),
	order: integer('order').notNull(), // 0-5 for positioning
	boardId: text('board_id')
		.notNull()
		.references(() => boards.id, { onDelete: 'cascade' }),
	createdAt: text('created_at')
		.notNull()
		.default(sql`(datetime('now'))`),
	updatedAt: text('updated_at')
		.notNull()
		.default(sql`(datetime('now'))`)
});

export const categoriesRelations = relations(categories, ({ one, many }) => ({
	board: one(boards, {
		fields: [categories.boardId],
		references: [boards.id]
	}),
	slots: many(boardQuestionSlots)
}));

// ─── BoardQuestionSlots ───────────────────────────────────────────────────────

export const boardQuestionSlots = sqliteTable(
	'board_question_slots',
	{
		id: text('id').primaryKey(),
		categoryId: text('category_id')
			.notNull()
			.references(() => categories.id, { onDelete: 'cascade' }),
		questionId: text('question_id')
			.notNull()
			.references(() => questions.id),
		row: integer('row').notNull(), // 0-4
		column: integer('column').notNull(), // 0-5
		points: integer('points').notNull(),
		isWildCard: integer('is_wild_card', { mode: 'boolean' }).notNull().default(false),
		createdAt: text('created_at')
			.notNull()
			.default(sql`(datetime('now'))`),
		updatedAt: text('updated_at')
			.notNull()
			.default(sql`(datetime('now'))`)
	},
	(t) => [unique().on(t.categoryId, t.row)]
);

export const boardQuestionSlotsRelations = relations(boardQuestionSlots, ({ one }) => ({
	category: one(categories, {
		fields: [boardQuestionSlots.categoryId],
		references: [categories.id]
	}),
	question: one(questions, {
		fields: [boardQuestionSlots.questionId],
		references: [questions.id]
	})
}));

// ─── Games ────────────────────────────────────────────────────────────────────

export const games = sqliteTable('games', {
	id: text('id').primaryKey(),
	code: text('code').notNull().unique(),
	boardId: text('board_id')
		.notNull()
		.references(() => boards.id),
	instructorId: text('instructor_id')
		.notNull()
		.references(() => instructors.id),
	// 'LOBBY' | 'IN_PROGRESS' | 'COMPLETED'
	status: text('status').notNull().default('LOBBY'),
	// 'MANUAL' | 'RANDOM'
	teamAssignment: text('team_assignment').notNull().default('RANDOM'),
	createdAt: text('created_at')
		.notNull()
		.default(sql`(datetime('now'))`),
	updatedAt: text('updated_at')
		.notNull()
		.default(sql`(datetime('now'))`)
});

export const gamesRelations = relations(games, ({ one, many }) => ({
	board: one(boards, {
		fields: [games.boardId],
		references: [boards.id]
	}),
	instructor: one(instructors, {
		fields: [games.instructorId],
		references: [instructors.id]
	}),
	teams: many(teams),
	students: many(students),
	gameState: one(gameState)
}));

// ─── Teams ────────────────────────────────────────────────────────────────────

export const teams = sqliteTable('teams', {
	id: text('id').primaryKey(),
	name: text('name').notNull(),
	color: text('color').notNull(),
	score: integer('score').notNull().default(0),
	gameId: text('game_id')
		.notNull()
		.references(() => games.id, { onDelete: 'cascade' }),
	createdAt: text('created_at')
		.notNull()
		.default(sql`(datetime('now'))`),
	updatedAt: text('updated_at')
		.notNull()
		.default(sql`(datetime('now'))`)
});

export const teamsRelations = relations(teams, ({ one, many }) => ({
	game: one(games, {
		fields: [teams.gameId],
		references: [games.id]
	}),
	students: many(students)
}));

// ─── Students ─────────────────────────────────────────────────────────────────

export const students = sqliteTable('students', {
	id: text('id').primaryKey(),
	name: text('name').notNull(),
	gameId: text('game_id')
		.notNull()
		.references(() => games.id, { onDelete: 'cascade' }),
	teamId: text('team_id').references(() => teams.id),
	buzzerAt: text('buzzer_at'), // ISO 8601 string or null
	createdAt: text('created_at')
		.notNull()
		.default(sql`(datetime('now'))`),
	updatedAt: text('updated_at')
		.notNull()
		.default(sql`(datetime('now'))`)
});

export const studentsRelations = relations(students, ({ one }) => ({
	game: one(games, {
		fields: [students.gameId],
		references: [games.id]
	}),
	team: one(teams, {
		fields: [students.teamId],
		references: [teams.id]
	})
}));

// ─── GameState ────────────────────────────────────────────────────────────────

export const gameState = sqliteTable('game_state', {
	id: text('id').primaryKey(),
	gameId: text('game_id')
		.notNull()
		.unique()
		.references(() => games.id, { onDelete: 'cascade' }),
	currentSlotId: text('current_slot_id'),
	// JSON-serialized string[]: BoardQuestionSlot IDs that have been answered
	answeredSlots: text('answered_slots').notNull().default('[]'),
	currentTeamId: text('current_team_id'),
	questionStartedAt: text('question_started_at'), // ISO 8601 string or null
	buzzerEnabled: integer('buzzer_enabled', { mode: 'boolean' }).notNull().default(false),
	currentWager: integer('current_wager'),
	createdAt: text('created_at')
		.notNull()
		.default(sql`(datetime('now'))`),
	updatedAt: text('updated_at')
		.notNull()
		.default(sql`(datetime('now'))`)
});

export const gameStateRelations = relations(gameState, ({ one }) => ({
	game: one(games, {
		fields: [gameState.gameId],
		references: [games.id]
	})
}));
