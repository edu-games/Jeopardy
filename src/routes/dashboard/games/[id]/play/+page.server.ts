import { error } from '@sveltejs/kit';
import { getDb } from '$lib/server/db';
import * as schema from '$lib/server/schema';
import { and, eq, asc } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, params, platform }) => {
	const db = getDb(platform!.env.DB);
	const game = await db.query.games.findFirst({
		where: and(eq(schema.games.id, params.id), eq(schema.games.instructorId, locals.instructor!.id)),
		with: {
			board: {
				with: {
					categories: {
						with: {
							slots: {
								with: { question: true },
								orderBy: [asc(schema.boardQuestionSlots.row)],
							},
						},
						orderBy: [asc(schema.categories.order)],
					},
				},
			},
			teams: {
				with: { students: true },
				orderBy: [asc(schema.teams.createdAt)],
			},
			students: true,
			gameState: true,
		},
	});

	if (!game) throw error(404, 'Game not found');

	return { game };
};
