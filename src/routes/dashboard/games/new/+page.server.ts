import { getDb } from '$lib/server/db';
import * as schema from '$lib/server/schema';
import { eq, desc } from 'drizzle-orm';
import type { PageServerLoad } from './';

export const load: PageServerLoad = async ({ locals, platform }) => {
	const db = getDb(platform!.env.DB);
	const boards = await db.query.boards.findMany({
		where: eq(schema.boards.instructorId, locals.instructor!.id),
		with: {
			categories: {
				with: { slots: true }
			}
		},
		orderBy: [desc(schema.boards.createdAt)]
	});

	const completeBoards = boards.filter((board) => {
		const totalSlots = board.categories.reduce((sum, cat) => sum + cat.slots.length, 0);
		return totalSlots === 30;
	});

	return { boards: completeBoards };
};
