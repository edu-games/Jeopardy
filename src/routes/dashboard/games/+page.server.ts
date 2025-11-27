import type { PageServerLoad } from './$types';
import prisma from '$lib/server/prisma';

export const load: PageServerLoad = async ({ locals }) => {
	// Get all games for this instructor
	const games = await prisma.game.findMany({
		where: {
			instructorId: locals.instructor!.id
		},
		include: {
			board: true,
			teams: true,
			students: true,
			_count: {
				select: {
					students: true
				}
			}
		},
		orderBy: {
			createdAt: 'desc'
		}
	});

	return {
		games
	};
};
