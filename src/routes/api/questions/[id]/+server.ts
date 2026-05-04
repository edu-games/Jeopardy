import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDb } from '$lib/server/db';
import { questions, questionTags } from '$lib/server/schema';
import { eq } from 'drizzle-orm';

export const GET: RequestHandler = async ({ locals, params, platform }) => {
	if (!locals.instructor) throw error(401, 'Unauthorized');

	const db = getDb(platform!.env.DB);

	const question = await db.query.questions.findFirst({
		where: (q, { eq, and }) => and(eq(q.id, params.id), eq(q.instructorId, locals.instructor!.id)),
		with: { tags: { with: { tag: true } } }
	});

	if (!question) throw error(404, 'Question not found');

	return json(question);
};

export const PUT: RequestHandler = async ({ locals, params, request, platform }) => {
	if (!locals.instructor) throw error(401, 'Unauthorized');

	const data = await request.json();
	const { clue, response, tagIds = [] } = data;

	if (!clue || typeof clue !== 'string' || clue.trim().length === 0) {
		throw error(400, 'Clue is required');
	}
	if (!response || typeof response !== 'string' || response.trim().length === 0) {
		throw error(400, 'Response is required');
	}

	const db = getDb(platform!.env.DB);

	const existing = await db.query.questions.findFirst({
		where: (q, { eq, and }) => and(eq(q.id, params.id), eq(q.instructorId, locals.instructor!.id))
	});
	if (!existing) throw error(404, 'Question not found');

	const now = new Date().toISOString();
	await db
		.update(questions)
		.set({ clue: clue.trim(), response: response.trim(), updatedAt: now })
		.where(eq(questions.id, params.id));

	// Replace tags
	await db.delete(questionTags).where(eq(questionTags.questionId, params.id));
	if (tagIds.length > 0) {
		await db
			.insert(questionTags)
			.values(tagIds.map((tagId: string) => ({ questionId: params.id, tagId })));
	}

	const updated = await db.query.questions.findFirst({
		where: (q, { eq }) => eq(q.id, params.id),
		with: { tags: { with: { tag: true } } }
	});

	return json(updated);
};

export const DELETE: RequestHandler = async ({ locals, params, platform }) => {
	if (!locals.instructor) throw error(401, 'Unauthorized');

	const db = getDb(platform!.env.DB);

	const existing = await db.query.questions.findFirst({
		where: (q, { eq, and }) => and(eq(q.id, params.id), eq(q.instructorId, locals.instructor!.id))
	});
	if (!existing) throw error(404, 'Question not found');

	await db.delete(questions).where(eq(questions.id, params.id));

	return json({ success: true });
};
