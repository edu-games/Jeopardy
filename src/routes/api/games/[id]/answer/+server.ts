import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import prisma from '$lib/server/prisma';
import { broadcastToGame } from '$lib/server/realtime';

// POST /api/games/[id]/answer - Submit answer and update score
export const POST: RequestHandler = async ({ locals, params, request }) => {
	if (!locals.instructor) {
		throw error(401, 'Unauthorized');
	}

	const data = await request.json();
	const { teamId, isCorrect } = data;

	if (!teamId || typeof teamId !== 'string') {
		throw error(400, 'Team ID is required');
	}

	if (typeof isCorrect !== 'boolean') {
		throw error(400, 'isCorrect must be a boolean');
	}

	// Verify game belongs to instructor
	const game = await prisma.game.findFirst({
		where: {
			id: params.id,
			instructorId: locals.instructor.id
		},
		include: {
			gameState: true,
			teams: true
		}
	});

	if (!game) {
		throw error(404, 'Game not found');
	}

	if (game.status !== 'IN_PROGRESS') {
		throw error(400, 'Game is not in progress');
	}

	if (!game.gameState?.currentSlotId) {
		throw error(400, 'No question is currently active');
	}

	// Verify team exists in game
	const team = game.teams.find((t) => t.id === teamId);
	if (!team) {
		throw error(404, 'Team not found');
	}

	// Get the current slot to get point value
	const slot = await prisma.boardQuestionSlot.findUnique({
		where: { id: game.gameState.currentSlotId }
	});

	if (!slot) {
		throw error(404, 'Question slot not found');
	}

	// Calculate score change
	const scoreChange = isCorrect ? slot.points : -slot.points;

	// Update team score
	await prisma.team.update({
		where: { id: teamId },
		data: {
			score: {
				increment: scoreChange
			}
		}
	});

	// Mark question as answered and clear current state
	const updatedGameState = await prisma.gameState.update({
		where: { gameId: params.id },
		data: {
			answeredSlots: {
				push: game.gameState.currentSlotId
			},
			currentSlotId: null,
			currentTeamId: null,
			questionStartedAt: null,
			buzzerEnabled: false
		}
	});

	// Get updated teams with student count
	const updatedTeams = await prisma.team.findMany({
		where: { gameId: params.id },
		include: {
			students: true
		},
		orderBy: { createdAt: 'asc' }
	});

	// Broadcast score update to all clients
	broadcastToGame(params.id, {
		type: 'answer-submitted',
		teams: updatedTeams,
		answeredSlots: updatedGameState.answeredSlots,
		currentSlotId: updatedGameState.currentSlotId
	});

	return json({
		gameState: updatedGameState,
		teams: updatedTeams,
		scoreChange,
		isCorrect
	});
};
