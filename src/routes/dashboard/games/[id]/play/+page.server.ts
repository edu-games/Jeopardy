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
			board: {
				include: {
					categories: {
						include: {
							slots: {
								include: {
									question: true
								},
								orderBy: {
									position: 'asc'
								}
							}
						},
						orderBy: {
							order: 'asc'
						}
					}
				}
			},
			teams: {
				include: {
					students: true
				},
				orderBy: {
					createdAt: 'asc'
				}
			},
			students: true,
			gameState: true
		}
	});

	if (!game) {
		throw error(404, 'Game not found');
	}

	if (game.status !== 'IN_PROGRESS') {
		throw error(400, 'Game is not in progress');
	}

	return {
		game
	};
};
