import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDb } from '$lib/server/db';

export const GET: RequestHandler = async ({ params, locals, platform, url, request }) => {
	const db = getDb(platform!.env.DB);

	const game = await db.query.games.findFirst({
		where: (g, { eq }) => eq(g.id, params.gameId)
	});
	if (!game) throw error(404, 'Game not found');

	const role = url.searchParams.get('role');
	if (!role || !['instructor', 'student', 'projector'].includes(role)) {
		throw error(400, 'Valid role is required: instructor, student, or projector');
	}

	let instructorId = '';
	let studentId = '';

	if (role === 'instructor' || role === 'projector') {
		if (!locals.instructor) throw error(401, 'Unauthorized');
		if (role === 'instructor' && locals.instructor.id !== game.instructorId) {
			throw error(403, 'Forbidden');
		}
		instructorId = locals.instructor.id;
	} else if (role === 'student') {
		studentId = url.searchParams.get('studentId') || '';
	}

	const hub = platform!.env.GAME_HUB;
	const id = hub.idFromName(params.gameId);
	const stub = hub.get(id);

	const doUrl = new URL('http://internal/ws');
	doUrl.searchParams.set('role', role);
	doUrl.searchParams.set('gameId', params.gameId);
	doUrl.searchParams.set('instructorId', instructorId);
	doUrl.searchParams.set('studentId', studentId);

	return stub.fetch(doUrl.toString(), request) as Promise<Response>;
};
