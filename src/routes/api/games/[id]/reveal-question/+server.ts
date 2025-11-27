import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import prisma from '$lib/server/prisma';
import { broadcastToGame } from '$lib/server/realtime';

// POST /api/games/[id]/reveal-question - Reveal a question
export const POST: RequestHandler = async ({ locals, params, request }) => {
	if (!locals.instructor) {
		throw error(401, 'Unauthorized');
	}

	const data = await request.json();
	const { slotId } = data;

	if (!slotId || typeof slotId !== 'string') {
		throw error(400, 'Slot ID is required');
	}

	// Verify game belongs to instructor
	const game = await prisma.game.findFirst({
		where: {
			id: params.id,
			instructorId: locals.instructor.id
		},
		include: {
			gameState: true
		}
	});

	if (!game) {
		throw error(404, 'Game not found');
	}

	if (game.status !== 'IN_PROGRESS') {
		throw error(400, 'Game is not in progress');
	}

	// Verify slot exists and hasn't been answered
	const slot = await prisma.boardQuestionSlot.findUnique({
		where: { id: slotId },
		include: {
			category: {
				include: {
					board: true
				}
			}
		}
	});

	if (!slot) {
		throw error(404, 'Question slot not found');
	}

	if (slot.category.board.id !== game.boardId) {
		throw error(400, 'Slot does not belong to this game board');
	}

	// Check if already answered
	if (game.gameState?.answeredSlots.includes(slotId)) {
		throw error(400, 'Question has already been answered');
	}

	// Update game state
	const updatedGameState = await prisma.gameState.update({
		where: { gameId: params.id },
		data: {
			currentSlotId: slotId,
			questionStartedAt: new Date(),
			buzzerEnabled: !slot.isDailyDouble // Enable buzzer unless it's a Daily Double
		}
	});

	// Get full slot data with question
	const fullSlot = await prisma.boardQuestionSlot.findUnique({
		where: { id: slotId },
		include: {
			question: true,
			category: true
		}
	});

	// Broadcast to all clients
	broadcastToGame(params.id, {
		type: 'question-revealed',
		slotId,
		currentSlot: fullSlot,
		buzzerEnabled: updatedGameState.buzzerEnabled
	});

	return json({ gameState: updatedGameState });
};
