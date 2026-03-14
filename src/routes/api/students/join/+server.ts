import { json, error } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { getDb } from "$lib/server/db";
import { students } from "$lib/server/schema";
import { eq } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";

export const POST: RequestHandler = async ({ request, platform }) => {
	const data = await request.json();
	const { gameCode, name } = data;

	if (!gameCode || typeof gameCode !== "string") throw error(400, "Game code is required");
	if (!name || typeof name !== "string" || name.trim().length === 0) throw error(400, "Name is required");

	const db = getDb(platform!.env.DB);

	const game = await db.query.games.findFirst({
		where: (g, { eq }) => eq(g.code, gameCode.toUpperCase()),
		with: { teams: { with: { students: true } } }
	});

	if (!game) throw error(404, "Game not found. Please check the game code.");
	if (game.status !== "LOBBY") throw error(400, "Game has already started. Cannot join now.");

	const existing = await db.query.students.findFirst({
		where: (s, { eq, and }) => and(eq(s.gameId, game.id), eq(s.name, name.trim()))
	});
	if (existing) throw error(400, "Name is already taken. Please choose a different name.");

	const now = new Date().toISOString();
	const studentId = createId();
	let teamId: string | null = null;

	if (game.teamAssignment === "RANDOM") {
		const teamCounts = game.teams.map((t) => ({ id: t.id, count: t.students.length }));
		teamCounts.sort((a, b) => a.count - b.count);
		teamId = teamCounts[0].id;
	}

	await db.insert(students).values({
		id: studentId,
		name: name.trim(),
		gameId: game.id,
		teamId,
		createdAt: now,
		updatedAt: now
	});

	const student = await db.query.students.findFirst({
		where: (s, { eq }) => eq(s.id, studentId),
		with: { team: true }
	});

	// Broadcast student-joined via the GameHub DO
	try {
		const hub = platform!.env.GAME_HUB;
		const stub = hub.get(hub.idFromName(game.id));
		const updatedGame = await db.query.games.findFirst({
			where: (g, { eq }) => eq(g.id, game.id),
			with: {
				students: { with: { team: true } },
				teams: { with: { students: true } }
			}
		});
		if (updatedGame) {
			await stub.fetch("http://internal/broadcast", {
				method: "POST",
				body: JSON.stringify({ type: "student-joined", students: updatedGame.students, teams: updatedGame.teams }),
				headers: { "Content-Type": "application/json" }
			});
		}
	} catch {
		// Broadcast failure is non-fatal
	}

	return json({ student, gameId: game.id }, { status: 201 });
};
