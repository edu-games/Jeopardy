import { json, error } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { getDb } from "$lib/server/db";
import { games, teams, gameState, boards } from "$lib/server/schema";
import { eq } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";
import { generateGameCode } from "$lib/server/qr";

export const POST: RequestHandler = async ({ locals, request, platform }) => {
	if (!locals.instructor) throw error(401, "Unauthorized");

	const data = await request.json();
	const { boardId, teamCount, teamAssignment, teamNames, teamColors } = data;

	if (!boardId || typeof boardId !== "string") throw error(400, "Board ID is required");
	if (typeof teamCount !== "number" || teamCount < 2 || teamCount > 6) {
		throw error(400, "Team count must be between 2 and 6");
	}
	if (!teamAssignment || !["MANUAL", "RANDOM"].includes(teamAssignment)) {
		throw error(400, "Team assignment must be MANUAL or RANDOM");
	}

	const db = getDb(platform!.env.DB);

	const board = await db.query.boards.findFirst({
		where: (b, { eq, and }) => and(eq(b.id, boardId), eq(b.instructorId, locals.instructor!.id)),
		with: { categories: { with: { slots: true } } }
	});

	if (!board) throw error(404, "Board not found");

	const totalSlots = board.categories.reduce((sum, cat) => sum + cat.slots.length, 0);
	if (totalSlots !== 30) throw error(400, "Board must be complete before creating a game");

	// Generate unique game code
	let code = generateGameCode();
	while (await db.query.games.findFirst({ where: (g, { eq }) => eq(g.code, code) })) {
		code = generateGameCode();
	}

	const defaultColors = ["#EF4444", "#3B82F6", "#10B981", "#F59E0B", "#8B5CF6", "#EC4899"];
	const now = new Date().toISOString();
	const gameId = createId();

	const teamInserts = Array.from({ length: teamCount }, (_, i) =>
		db.insert(teams).values({
			id: createId(),
			name: teamNames?.[i] || `Team ${i + 1}`,
			color: teamColors?.[i] || defaultColors[i],
			score: 0,
			gameId,
			createdAt: now,
			updatedAt: now
		})
	);

	await db.batch([
		db.insert(games).values({
			id: gameId,
			code,
			boardId,
			instructorId: locals.instructor!.id,
			status: "LOBBY",
			teamAssignment,
			createdAt: now,
			updatedAt: now
		}),
		...teamInserts,
		db.insert(gameState).values({
			id: createId(),
			gameId,
			answeredSlots: "[]",
			buzzerEnabled: false,
			createdAt: now,
			updatedAt: now
		})
	]);

	const game = await db.query.games.findFirst({
		where: (g, { eq }) => eq(g.id, gameId),
		with: {
			board: { with: { categories: { with: { slots: { with: { question: true } } } } } },
			teams: true,
			students: true,
			gameState: true
		}
	});

	return json(game, { status: 201 });
};
