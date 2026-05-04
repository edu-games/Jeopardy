import { error, fail, redirect } from '@sveltejs/kit';
import { getDb } from '$lib/server/db';
import * as schema from '$lib/server/schema';
import { and, eq, asc } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, params, platform }) => {
	const db = getDb(platform!.env.DB);
	const [question, allTags] = await Promise.all([
		db.query.questions.findFirst({
			where: and(
				eq(schema.questions.id, params.id),
				eq(schema.questions.instructorId, locals.instructor!.id)
			),
			with: { tags: { with: { tag: true } } }
		}),
		db.query.tags.findMany({ orderBy: [asc(schema.tags.name)] })
	]);

	if (!question) throw error(404, 'Question not found');

	return { question, allTags };
};

export const actions = {
	default: async ({ locals, params, request, platform }) => {
		const data = await request.formData();
		const clue = data.get('clue');
		const response = data.get('response');
		const tagInput = data.get('tags');
		const newTags = data.get('newTags');

		if (!clue || typeof clue !== 'string' || clue.trim().length === 0) {
			return fail(400, {
				error: 'Clue is required',
				clue: '',
				response: response?.toString() || ''
			});
		}
		if (!response || typeof response !== 'string' || response.trim().length === 0) {
			return fail(400, { error: 'Response is required', clue, response: '' });
		}

		const db = getDb(platform!.env.DB);
		const existing = await db.query.questions.findFirst({
			where: and(
				eq(schema.questions.id, params.id),
				eq(schema.questions.instructorId, locals.instructor!.id)
			)
		});
		if (!existing) throw error(404, 'Question not found');

		const selectedTagIds = tagInput ? tagInput.toString().split(',').filter(Boolean) : [];
		const newTagNames = newTags
			? newTags
					.toString()
					.split(',')
					.map((t) => t.trim())
					.filter(Boolean)
			: [];

		const createdTagIds: string[] = [];
		for (const tagName of newTagNames) {
			await db.insert(schema.tags).values({ id: createId(), name: tagName }).onConflictDoNothing();
			const tag = await db.query.tags.findFirst({ where: eq(schema.tags.name, tagName) });
			if (tag) createdTagIds.push(tag.id);
		}

		const allTagIds = [...selectedTagIds, ...createdTagIds];
		const now = new Date().toISOString();

		await db
			.update(schema.questions)
			.set({ clue: clue.trim(), response: response.trim(), updatedAt: now })
			.where(eq(schema.questions.id, params.id));

		await db.delete(schema.questionTags).where(eq(schema.questionTags.questionId, params.id));
		for (const tagId of allTagIds) {
			await db
				.insert(schema.questionTags)
				.values({ questionId: params.id, tagId })
				.onConflictDoNothing();
		}

		throw redirect(303, '/dashboard/questions');
	}
} satisfies Actions;
