import { error } from '@sveltejs/kit';
import { getDb } from '$lib/server/db';
import * as schema from '$lib/server/schema';
import { and, eq, desc } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, url, platform }) => {
	const db = getDb(platform!.env.DB);
	const gameCode = params.code;
	const studentId = url.searchParams.get('studentId');

	if (!studentId) throw error(400, 'Student ID is required');

	const game = await db.query.games.findFirst({
		where: eq(schema.games.code, gameCode.toUpperCase()),
		with: {
			board: true,
			teams: {
				with: { students: true },
				orderBy: [desc(schema.teams.score)]
			},
			gameState: true
		}
	});

	if (!game) throw error(404, 'Game not found');
	if (game.status !== 'COMPLETED') throw error(400, 'Game is not yet completed');

	const student = await db.query.students.findFirst({
		where: and(eq(schema.students.id, studentId), eq(schema.students.gameId, game.id)),
		with: { team: true }
	});

	if (!student) throw error(404, 'Student not found in this game');

	return { game, student };
};
