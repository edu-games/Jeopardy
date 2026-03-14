import { getDb } from "$lib/server/db";
import * as schema from "$lib/server/schema";
import { eq, desc } from "drizzle-orm";
import type { PageServerLoad } from "./";

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
