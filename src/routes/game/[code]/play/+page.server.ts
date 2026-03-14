import { error } from '@sveltejs/kit';
import { getDb } from '$lib/server/db';
import * as schema from '$lib/server/schema';
import { and, eq, asc } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, url, platform }) => {
	const db = getDb(platform!.env.DB);
	const gameCode = params.code;
	const studentId = url.searchParams.get('studentId');

	if (!studentId) throw error(400, 'Student ID is required');

	const [game, student] = await Promise.all([
		db.query.games.findFirst({
			where: eq(schema.games.code, gameCode.toUpperCase()),
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
				},
				gameState: true,
			},
		}),
		db.query.students.findFirst({
			where: eq(schema.students.id, studentId),
			with: { team: true },
		}),
	]);

	if (!game) throw error(404, 'Game not found');
	if (!student || student.gameId !== game.id) throw error(404, 'Student not found in this game');

	return { game, student };
};
