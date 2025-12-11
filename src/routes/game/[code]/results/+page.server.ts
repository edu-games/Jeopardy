import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import prisma from '$lib/server/prisma';

export const load: PageServerLoad = async ({ params, url }) => {
	const gameCode = params.code;
	const studentId = url.searchParams.get('studentId');

	if (!studentId) {
		throw error(400, 'Student ID is required');
	}

	// Load game data
	const game = await prisma.game.findUnique({
		where: { code: gameCode.toUpperCase() },
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
			gameState: true
		}
	});

	if (!game) {
		throw error(404, 'Game not found');
	}

	if (game.status !== 'COMPLETED') {
		throw error(400, 'Game is not yet completed');
	}

	// Load student data
	const student = await prisma.student.findFirst({
		where: {
			id: studentId,
			gameId: game.id
		},
		include: {
			team: true
		}
	});

	if (!student) {
		throw error(404, 'Student not found in this game');
	}

	return {
		game,
		student
	};
};
