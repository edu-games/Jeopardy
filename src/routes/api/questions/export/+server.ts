import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDb } from '$lib/server/db';

export const GET: RequestHandler = async ({ locals, platform }) => {
	if (!locals.instructor) throw error(401, 'Unauthorized');

	const db = getDb(platform!.env.DB);

	const questions = await db.query.questions.findMany({
		where: (q, { eq }) => eq(q.instructorId, locals.instructor!.id),
		with: { tags: { with: { tag: true } } },
		orderBy: (q, { desc }) => [desc(q.createdAt)]
	});

	const exportData = questions.map((q) => ({
		clue: q.clue,
		response: q.response,
		tags: q.tags.map((t) => t.tag.name)
	}));

	return json({
		version: '1.0',
		exportedAt: new Date().toISOString(),
		instructor: locals.instructor!.email,
		count: exportData.length,
		questions: exportData
	});
};
