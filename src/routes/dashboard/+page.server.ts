import { getDb } from '$lib/server/db';
import * as schema from '$lib/server/schema';
import { eq, sql } from 'drizzle-orm';
import type { PageServerLoad } from './';

export const load: PageServerLoad = async ({ locals, platform }) => {
	const db = getDb(platform!.env.DB);
	const instructorId = locals.instructor!.id;

	const [questionCount, boardCount, gameCount] = await Promise.all([
		db
			.select({ count: sql<number>`count(*)` })
			.from(schema.questions)
			.where(eq(schema.questions.instructorId, instructorId))
			.get(),
		db
			.select({ count: sql<number>`count(*)` })
			.from(schema.boards)
			.where(eq(schema.boards.instructorId, instructorId))
			.get(),
		db
			.select({ count: sql<number>`count(*)` })
			.from(schema.games)
			.where(eq(schema.games.instructorId, instructorId))
			.get()
	]);

	return {
		stats: {
			questions: questionCount?.count ?? 0,
			boards: boardCount?.count ?? 0,
			games: gameCount?.count ?? 0
		}
	};
};
