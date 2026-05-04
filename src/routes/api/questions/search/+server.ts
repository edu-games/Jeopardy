import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDb } from '$lib/server/db';

export const GET: RequestHandler = async ({ locals, url, platform }) => {
	if (!locals.instructor) throw error(401, 'Unauthorized');

	const tagNames = url.searchParams.getAll('tag');
	const searchTerm = url.searchParams.get('q') || '';

	const db = getDb(platform!.env.DB);

	const results = await db.query.questions.findMany({
		where: (q, { eq, and, or, like }) => {
			const conditions = [eq(q.instructorId, locals.instructor!.id)];
			if (searchTerm) {
				conditions.push(
					or(like(q.clue, `%${searchTerm}%`), like(q.response, `%${searchTerm}%`))!
				);
			}
			return and(...conditions);
		},
		with: { tags: { with: { tag: true } } },
		orderBy: (q, { desc }) => [desc(q.createdAt)]
	});

	// Filter by tag names (in memory)
	const filtered =
		tagNames.length > 0
			? results.filter((q) => q.tags.some((t) => tagNames.includes(t.tag.name)))
			: results;

	return json({ questions: filtered });
};
