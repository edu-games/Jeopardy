import { error } from '@sveltejs/kit';
import { getDb } from '$lib/server/db';
import * as schema from '$lib/server/schema';
import { and, eq, asc } from 'drizzle-orm';
import { generateGameQRCode } from '$lib/server/qr';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, params, url, platform }) => {
	const db = getDb(platform!.env.DB);
	const game = await db.query.games.findFirst({
		where: and(eq(schema.games.id, params.id), eq(schema.games.instructorId, locals.instructor!.id)),
		with: {
			board: true,
			teams: {
				with: { students: true },
				orderBy: [asc(schema.teams.createdAt)],
			},
			students: {
				orderBy: [asc(schema.students.createdAt)],
			},
		},
	});

	if (!game) throw error(404, 'Game not found');
	if (game.status !== 'LOBBY') throw error(400, 'Game has already started');

	const baseUrl = `${url.protocol}//${url.host}`;
	const qrCode = await generateGameQRCode(game.code, baseUrl);

	return { game, qrCode, baseUrl };
};
