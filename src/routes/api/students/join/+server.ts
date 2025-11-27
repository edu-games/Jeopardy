import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import prisma from '$lib/server/prisma';

// POST /api/students/join - Join a game
export const POST: RequestHandler = async ({ request }) => {
	const data = await request.json();
	const { gameCode, name } = data;

	// Validation
	if (!gameCode || typeof gameCode !== 'string') {
		throw error(400, 'Game code is required');
	}

	if (!name || typeof name !== 'string' || name.trim().length === 0) {
		throw error(400, 'Name is required');
	}

	// Find game by code
	const game = await prisma.game.findUnique({
		where: { code: gameCode.toUpperCase() },
		include: {
			teams: {
				include: {
					students: true
				}
			}
		}
	});

	if (!game) {
		throw error(404, 'Game not found. Please check the game code.');
	}

	if (game.status !== 'LOBBY') {
		throw error(400, 'Game has already started. Cannot join now.');
	}

	// Check if name is already taken in this game
	const existingStudent = await prisma.student.findFirst({
		where: {
			gameId: game.id,
			name: name.trim()
		}
	});

	if (existingStudent) {
		throw error(400, 'Name is already taken. Please choose a different name.');
	}

	// Create student
	let student;
	if (game.teamAssignment === 'RANDOM') {
		// Auto-assign to team with fewest students
		const teamCounts = game.teams.map((team) => ({
			id: team.id,
			count: team.students.length
		}));
		teamCounts.sort((a, b) => a.count - b.count);
		const teamId = teamCounts[0].id;

		student = await prisma.student.create({
			data: {
				name: name.trim(),
				gameId: game.id,
				teamId
			},
			include: {
				team: true
			}
		});
	} else {
		// Manual assignment - create without team
		student = await prisma.student.create({
			data: {
				name: name.trim(),
				gameId: game.id
			}
		});
	}

	return json({ student, gameId: game.id }, { status: 201 });
};
