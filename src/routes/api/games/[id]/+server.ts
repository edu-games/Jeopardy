import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import prisma from '$lib/server/prisma';

// GET /api/games/[id] - Get game details
export const GET: RequestHandler = async ({ params }) => {
	const game = await prisma.game.findUnique({
		where: { id: params.id },
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
			students: {
				orderBy: {
					createdAt: 'asc'
				}
			},
			gameState: true
		}
	});

	if (!game) {
		throw error(404, 'Game not found');
	}

	return json(game);
};
