import { getDb } from '$lib/server/db';
import * as schema from '$lib/server/schema';
import { eq, desc, asc } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, platform }) => {
	const db = getDb(platform!.env.DB);
	const boards = await db.query.boards.findMany({
		where: eq(schema.boards.instructorId, locals.instructor!.id),
		with: {
			categories: {
				with: {
					slots: {
						orderBy: [asc(schema.boardQuestionSlots.row)]
					}
				},
				orderBy: [asc(schema.categories.order)]
			},
			games: true
		},
		orderBy: [desc(schema.boards.createdAt)]
	});

	return {
		boards: boards.map((b) => ({ ...b, _count: { games: b.games.length } }))
	};
};
