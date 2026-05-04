import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDb } from '$lib/server/db';
import { tags, questions, questionTags } from '$lib/server/schema';
import { eq } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';

interface ImportQuestion {
	clue: string;
	response: string;
	tags: string[];
}

export const POST: RequestHandler = async ({ locals, request, platform }) => {
	if (!locals.instructor) throw error(401, 'Unauthorized');

	const data = await request.json();
	const { questions: importedQuestions } = data;

	if (!Array.isArray(importedQuestions)) throw error(400, 'Questions must be an array');

	for (const q of importedQuestions) {
		if (!q.clue || typeof q.clue !== 'string')
			throw error(400, 'Each question must have a clue');
		if (!q.response || typeof q.response !== 'string')
			throw error(400, 'Each question must have a response');
		if (!Array.isArray(q.tags)) throw error(400, 'Each question must have a tags array');
	}

	const db = getDb(platform!.env.DB);

	// Collect unique tag names
	const allTagNames = new Set<string>();
	importedQuestions.forEach((q: ImportQuestion) => q.tags.forEach((tag) => allTagNames.add(tag)));

	// Upsert tags
	const tagMap = new Map<string, string>();
	for (const tagName of allTagNames) {
		await db
			.insert(tags)
			.values({ id: createId(), name: tagName, createdAt: new Date().toISOString() })
			.onConflictDoNothing();
		const tag = await db.select().from(tags).where(eq(tags.name, tagName)).get();
		if (tag) tagMap.set(tagName, tag.id);
	}

	const created: string[] = [];
	const now = new Date().toISOString();

	for (const q of importedQuestions as ImportQuestion[]) {
		const id = createId();
		await db.insert(questions).values({
			id,
			clue: q.clue.trim(),
			response: q.response.trim(),
			instructorId: locals.instructor!.id,
			createdAt: now,
			updatedAt: now
		});
		if (q.tags.length > 0) {
			await db
				.insert(questionTags)
				.values(q.tags.map((tagName) => ({ questionId: id, tagId: tagMap.get(tagName)! })));
		}
		created.push(id);
	}

	return json({ imported: created.length }, { status: 201 });
};
