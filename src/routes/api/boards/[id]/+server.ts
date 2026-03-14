import { json, error } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { getDb } from "$lib/server/db";
import { boards, categories, boardQuestionSlots } from "$lib/server/schema";
import { eq } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";

export const GET: RequestHandler = async ({ locals, params, platform }) => {
	if (!locals.instructor) throw error(401, "Unauthorized");

	const db = getDb(platform!.env.DB);

	const board = await db.query.boards.findFirst({
		where: (b, { eq, and }) => and(eq(b.id, params.id), eq(b.instructorId, locals.instructor!.id)),
		with: {
			categories: {
				with: {
					slots: {
						with: { question: { with: { tags: { with: { tag: true } } } } },
						orderBy: (s, { asc }) => [asc(s.row)]
					}
				},
				orderBy: (c, { asc }) => [asc(c.order)]
			}
		}
	});

	if (!board) throw error(404, "Board not found");

	return json(board);
};

export const PUT: RequestHandler = async ({ locals, params, request, platform }) => {
	if (!locals.instructor) throw error(401, "Unauthorized");

	const data = await request.json();
	const { name, description, categories: cats } = data;

	if (!name || typeof name !== "string" || name.trim().length === 0) {
		throw error(400, "Board name is required");
	}
	if (!cats || !Array.isArray(cats) || cats.length !== 6) {
		throw error(400, "Board must have exactly 6 categories");
	}

	for (let i = 0; i < cats.length; i++) {
		const cat = cats[i];
		if (!cat.name || typeof cat.name !== "string") throw error(400, `Category ${i + 1} must have a name`);
		if (!cat.slots || !Array.isArray(cat.slots) || cat.slots.length !== 5) {
			throw error(400, `Category ${i + 1} must have exactly 5 question slots`);
		}
		for (let j = 0; j < cat.slots.length; j++) {
			const slot = cat.slots[j];
			if (!slot.questionId || typeof slot.questionId !== "string") {
				throw error(400, `Category ${i + 1}, slot ${j + 1} must have a question ID`);
			}
			if (typeof slot.points !== "number" || slot.points <= 0) {
				throw error(400, `Category ${i + 1}, slot ${j + 1} must have valid points`);
			}
		}
	}

	const db = getDb(platform!.env.DB);

	const existing = await db.query.boards.findFirst({
		where: (b, { eq, and }) => and(eq(b.id, params.id), eq(b.instructorId, locals.instructor!.id))
	});
	if (!existing) throw error(404, "Board not found");

	const now = new Date().toISOString();

	const catIds = cats.map(() => createId());

	const catInserts = cats.map((cat, i) =>
		db.insert(categories).values({
			id: catIds[i],
			name: cat.name.trim(),
			order: i,
			boardId: params.id,
			createdAt: now,
			updatedAt: now
		})
	);

	const slotInserts = cats.flatMap((cat, i) =>
		cat.slots.map((slot: { questionId: string; points: number; isDailyDouble?: boolean }, j: number) =>
			db.insert(boardQuestionSlots).values({
				id: createId(),
				categoryId: catIds[i],
				questionId: slot.questionId,
				row: j,
				column: i,
				points: slot.points,
				isDailyDouble: slot.isDailyDouble || false,
				createdAt: now,
				updatedAt: now
			})
		)
	);

	await db.batch([
		db.delete(categories).where(eq(categories.boardId, params.id)),
		db.update(boards)
			.set({ name: name.trim(), description: description?.trim() || null, updatedAt: now })
			.where(eq(boards.id, params.id)),
		...catInserts,
		...slotInserts
	]);

	const board = await db.query.boards.findFirst({
		where: (b, { eq }) => eq(b.id, params.id),
		with: {
			categories: {
				with: { slots: { with: { question: true } } },
				orderBy: (c, { asc }) => [asc(c.order)]
			}
		}
	});

	return json(board);
};

export const DELETE: RequestHandler = async ({ locals, params, platform }) => {
	if (!locals.instructor) throw error(401, "Unauthorized");

	const db = getDb(platform!.env.DB);

	const existing = await db.query.boards.findFirst({
		where: (b, { eq, and }) => and(eq(b.id, params.id), eq(b.instructorId, locals.instructor!.id))
	});
	if (!existing) throw error(404, "Board not found");

	await db.delete(boards).where(eq(boards.id, params.id));

	return json({ success: true });
};
