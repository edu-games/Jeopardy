import { fail, redirect } from '@sveltejs/kit';
import { getDb } from '$lib/server/db';
import * as schema from '$lib/server/schema';
import { eq, asc } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ platform }) => {
	const db = getDb(platform!.env.DB);
	const tags = await db.query.tags.findMany({
		orderBy: [asc(schema.tags.name)],
	});
	return { tags };
};

export const actions = {
	default: async ({ locals, request, platform }) => {
		const data = await request.formData();
		const answer = data.get('answer');
		const question = data.get('question');
		const tagInput = data.get('tags');
		const newTags = data.get('newTags');

		if (!answer || typeof answer !== 'string' || answer.trim().length === 0) {
			return fail(400, { error: 'Answer is required', answer: '', question: question?.toString() || '' });
		}
		if (!question || typeof question !== 'string' || question.trim().length === 0) {
			return fail(400, { error: 'Question is required', answer, question: '' });
		}

		const db = getDb(platform!.env.DB);
		const selectedTagIds = tagInput ? tagInput.toString().split(',').filter(Boolean) : [];
		const newTagNames = newTags
			? newTags.toString().split(',').map((t) => t.trim()).filter(Boolean)
			: [];

		const createdTagIds: string[] = [];
		for (const tagName of newTagNames) {
			await db.insert(schema.tags).values({ id: createId(), name: tagName }).onConflictDoNothing();
			const tag = await db.query.tags.findFirst({ where: eq(schema.tags.name, tagName) });
			if (tag) createdTagIds.push(tag.id);
		}

		const allTagIds = [...selectedTagIds, ...createdTagIds];
		const questionId = createId();
		const now = new Date().toISOString();

		await db.insert(schema.questions).values({
			id: questionId,
			answer: answer.trim(),
			question: question.trim(),
			instructorId: locals.instructor!.id,
			createdAt: now,
			updatedAt: now,
		});

		for (const tagId of allTagIds) {
			await db.insert(schema.questionTags).values({ questionId, tagId }).onConflictDoNothing();
		}

		throw redirect(303, '/dashboard/questions');
	}
} satisfies Actions;
