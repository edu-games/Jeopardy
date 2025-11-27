import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import prisma from '$lib/server/prisma';
import { generateGameCode } from '$lib/server/qr';

// POST /api/games - Create a new game
export const POST: RequestHandler = async ({ locals, request }) => {
	if (!locals.instructor) {
		throw error(401, 'Unauthorized');
	}

	const data = await request.json();
	const { boardId, teamCount, teamAssignment, teamNames, teamColors } = data;

	// Validation
	if (!boardId || typeof boardId !== 'string') {
		throw error(400, 'Board ID is required');
	}

	if (typeof teamCount !== 'number' || teamCount < 2 || teamCount > 6) {
		throw error(400, 'Team count must be between 2 and 6');
	}

	if (!teamAssignment || !['MANUAL', 'RANDOM'].includes(teamAssignment)) {
		throw error(400, 'Team assignment must be MANUAL or RANDOM');
	}

	// Verify board exists and belongs to instructor
	const board = await prisma.board.findFirst({
		where: {
			id: boardId,
			instructorId: locals.instructor.id
		},
		include: {
			categories: {
				include: {
					slots: true
				}
			}
		}
	});

	if (!board) {
		throw error(404, 'Board not found');
	}

	// Verify board is complete (30 slots)
	const totalSlots = board.categories.reduce((sum, cat) => sum + cat.slots.length, 0);
	if (totalSlots !== 30) {
		throw error(400, 'Board must be complete before creating a game');
	}

	// Generate unique game code
	let code = generateGameCode();
	let existingGame = await prisma.game.findUnique({ where: { code } });
	while (existingGame) {
		code = generateGameCode();
		existingGame = await prisma.game.findUnique({ where: { code } });
	}

	// Default team colors
	const defaultColors = ['#EF4444', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'];

	// Create game with teams
	const game = await prisma.game.create({
		data: {
			code,
			boardId,
			instructorId: locals.instructor.id,
			status: 'LOBBY',
			teamAssignment: teamAssignment as 'MANUAL' | 'RANDOM',
			teams: {
				create: Array.from({ length: teamCount }, (_, i) => ({
					name: teamNames?.[i] || `Team ${i + 1}`,
					color: teamColors?.[i] || defaultColors[i],
					score: 0
				}))
			},
			gameState: {
				create: {
					buzzerEnabled: false
				}
			}
		},
		include: {
			board: {
				include: {
					categories: {
						include: {
							slots: {
								include: {
									question: true
								}
							}
						}
					}
				}
			},
			teams: true,
			students: true,
			gameState: true
		}
	});

	return json(game, { status: 201 });
};
