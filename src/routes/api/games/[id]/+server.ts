import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDb } from '$lib/server/db';
import * as schema from '$lib/server/schema';
import { eq, asc } from 'drizzle-orm';

// GET /api/games/[id] - Get game details
export const GET: RequestHandler = async ({ params, platform }) => {
	const db = getDb(platform!.env.DB);
	const game = await db.query.games.findFirst({
		where: eq(schema.games.id, params.id),
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
			students: {
				orderBy: [asc(schema.students.createdAt)],
			},
			gameState: true,
		},
	});

	if (!game) throw error(404, 'Game not found');

	return json(game);
};
