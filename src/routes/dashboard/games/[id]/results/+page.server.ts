import { error } from '@sveltejs/kit';
import { getDb } from '$lib/server/db';
import * as schema from '$lib/server/schema';
import { and, eq, desc } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, params, platform }) => {
	const db = getDb(platform!.env.DB);
	const game = await db.query.games.findFirst({
		where: and(eq(schema.games.id, params.id), eq(schema.games.instructorId, locals.instructor!.id)),
		with: {
			board: true,
			teams: {
				with: { students: true },
				orderBy: [desc(schema.teams.score)],
			},
			students: {
				with: { team: true },
			},
			gameState: true,
		},
	});

	if (!game) throw error(404, 'Game not found');
	if (game.status !== 'COMPLETED') throw error(400, 'Game is not yet completed');

	return { game };
};
