import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import prisma from '$lib/server/prisma';
import { broadcastToGame } from '$lib/server/realtime';

// POST /api/students/buzzer - Press buzzer
export const POST: RequestHandler = async ({ request }) => {
	const data = await request.json();
	const { studentId, gameId } = data;

	if (!studentId || typeof studentId !== 'string') {
		throw error(400, 'Student ID is required');
	}

	if (!gameId || typeof gameId !== 'string') {
		throw error(400, 'Game ID is required');
	}

	// Verify student exists and belongs to game
	const student = await prisma.student.findFirst({
		where: {
			id: studentId,
			gameId
		},
		include: {
			team: true,
			game: {
				include: {
					gameState: true
				}
			}
		}
	});

	if (!student) {
		throw error(404, 'Student not found');
	}

	if (student.game.status !== 'IN_PROGRESS') {
		throw error(400, 'Game is not in progress');
	}

	// Check if buzzer is enabled
	if (!student.game.gameState?.buzzerEnabled) {
		throw error(400, 'Buzzer is not enabled');
	}

	// Update student's buzzer timestamp
	const updatedStudent = await prisma.student.update({
		where: { id: studentId },
		data: {
			buzzerAt: new Date()
		}
	});

	// Broadcast buzzer press to all clients in the game
	if (student.team) {
		broadcastToGame(gameId, {
			type: 'buzzer-pressed',
			studentId: student.id,
			studentName: student.name,
			teamId: student.team.id,
			teamName: student.team.name,
			buzzerAt: updatedStudent.buzzerAt!.toISOString()
		});
	}

	return json({
		success: true,
		buzzerAt: updatedStudent.buzzerAt,
		team: student.team
	});
};
