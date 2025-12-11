import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import prisma from '$lib/server/prisma';

export const load: PageServerLoad = async ({ locals, params }) => {
	const game = await prisma.game.findFirst({
		where: {
			id: params.id,
			instructorId: locals.instructor!.id
		},
		include: {
			board: true,
			teams: {
				include: {
					students: true
				},
				orderBy: {
					score: 'desc' // Order by highest score first
				}
			},
			students: {
				include: {
					team: true
				}
			},
			gameState: true
		}
	});

	if (!game) {
		throw error(404, 'Game not found');
	}

	if (game.status !== 'COMPLETED') {
		throw error(400, 'Game is not yet completed');
	}

	return {
		game
	};
};
