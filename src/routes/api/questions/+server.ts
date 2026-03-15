import { json, error } from "@sveltejs/kit";
import type { RequestHandler } from "./";
import { getDb } from "$lib/server/db";
import { questions, questionTags } from "$lib/server/schema";
import { like, or, and } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";

export const GET: RequestHandler = async ({ locals, url, platform }) => {
	if (!locals.instructor) throw error(401, "Unauthorized");

	const search = url.searchParams.get("search") || "";
	const tagIds = url.searchParams.getAll("tagId");
	const limit = parseInt(url.searchParams.get("limit") || "50");
	const offset = parseInt(url.searchParams.get("offset") || "0");

	const db = getDb(platform!.env.DB);

	const results = await db.query.questions.findMany({
		where: (q, { eq, and, or, like }) => {
			const conditions = [eq(q.instructorId, locals.instructor!.id)];
			if (search) {
				conditions.push(or(like(q.answer, `%${search}%`), like(q.question, `%${search}%`))!);
			}
			return and(...conditions);
		},
		with: { tags: { with: { tag: true } } },
		orderBy: (q, { desc }) => [desc(q.createdAt)],
		limit,
		offset
	});

	const filtered =
		tagIds.length > 0
			? results.filter((q) => q.tags.some((t) => tagIds.includes(t.tagId)))
			: results;

	return json({ questions: filtered, total: filtered.length, limit, offset });
};

export const POST: RequestHandler = async ({ locals, request, platform }) => {
	if (!locals.instructor) throw error(401, "Unauthorized");

	const data = await request.json();
	const { answer, question, tagIds = [] } = data;

	if (!answer || typeof answer !== "string" || answer.trim().length === 0) {
		throw error(400, "Answer is required");
	}
	if (!question || typeof question !== "string" || question.trim().length === 0) {
		throw error(400, "Question is required");
	}
	if (!Array.isArray(tagIds)) throw error(400, "Tag IDs must be an array");

	const db = getDb(platform!.env.DB);
	const id = createId();
	const now = new Date().toISOString();

	await db.insert(questions).values({
		id,
		answer: answer.trim(),
		question: question.trim(),
		instructorId: locals.instructor.id,
		createdAt: now,
		updatedAt: now
	});

	if (tagIds.length > 0) {
		await db.insert(questionTags).values(tagIds.map((tagId: string) => ({ questionId: id, tagId })));
	}

	const newQuestion = await db.query.questions.findFirst({
		where: (q, { eq }) => eq(q.id, id),
		with: { tags: { with: { tag: true } } }
	});

	return json(newQuestion, { status: 201 });
};
