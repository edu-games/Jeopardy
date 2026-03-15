import { getDb } from "$lib/server/db";
import * as schema from "$lib/server/schema";
import { eq, desc, and } from "drizzle-orm";
import { fail } from "@sveltejs/kit";
import type { PageServerLoad, Actions } from "./";

export const load: PageServerLoad = async ({ locals, platform }) => {
	const db = getDb(platform!.env.DB);
	const games = await db.query.games.findMany({
		where: eq(schema.games.instructorId, locals.instructor!.id),
		with: {
			board: true,
			teams: true,
			students: true,
		},
		orderBy: [desc(schema.games.createdAt)],
	});

	return {
		games: games.map((g) => ({ ...g, _count: { students: g.students.length } })),
	};
};

export const actions: Actions = {
	delete: async ({ request, locals, platform }) => {
		const db = getDb(platform!.env.DB);
		const formData = await request.formData();
		const gameId = formData.get("gameId") as string;

		if (!gameId) return fail(400, { error: "Missing game ID" });

		const game = await db.query.games.findFirst({
			where: and(
				eq(schema.games.id, gameId),
				eq(schema.games.instructorId, locals.instructor!.id)
			),
		});

		if (!game) return fail(404, { error: "Game not found" });
		if (game.status === "IN_PROGRESS") return fail(400, { error: "Cannot delete a game in progress" });

		await db.delete(schema.games).where(eq(schema.games.id, gameId));
	}
};
