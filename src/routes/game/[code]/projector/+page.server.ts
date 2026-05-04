import { error } from '@sveltejs/kit';
import { getDb } from '$lib/server/db';
import * as schema from '$lib/server/schema';
import { eq, asc } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, url, platform }) => {
	const db = getDb(platform!.env.DB);
	const game = await db.query.games.findFirst({
		where: eq(schema.games.code, params.code.toUpperCase()),
		with: {
			board: {
				with: {
					categories: {
						with: {
							slots: {
								with: { question: true },
								orderBy: [asc(schema.boardQuestionSlots.row)]
							}
						},
						orderBy: [asc(schema.categories.order)]
					}
				}
			},
			gameState: true
		}
	});

	if (!game) throw error(404, 'Game not found');

	const baseUrl = `${url.protocol}//${url.host}`;
	return { game, baseUrl };
};
