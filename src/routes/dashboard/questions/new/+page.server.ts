import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import prisma from '$lib/server/prisma';

export const load: PageServerLoad = async () => {
	// Get all tags for selection
	const tags = await prisma.tag.findMany({
		orderBy: {
			name: 'asc'
		}
	});

	return {
		tags
	};
};

export const actions = {
	default: async ({ locals, request }) => {
		const data = await request.formData();
		const answer = data.get('answer');
		const question = data.get('question');
		const tagInput = data.get('tags');
		const newTags = data.get('newTags');

		// Validation
		if (!answer || typeof answer !== 'string' || answer.trim().length === 0) {
			return fail(400, {
				error: 'Answer is required',
				answer: '',
				question: question?.toString() || ''
			});
		}

		if (!question || typeof question !== 'string' || question.trim().length === 0) {
			return fail(400, {
				error: 'Question is required',
				answer,
				question: ''
			});
		}

		// Parse selected tags
		const selectedTagIds = tagInput ? tagInput.toString().split(',').filter(Boolean) : [];

		// Parse and create new tags
		const newTagNames = newTags
			? newTags
					.toString()
					.split(',')
					.map((t) => t.trim())
					.filter(Boolean)
			: [];

		const createdTagIds: string[] = [];
		for (const tagName of newTagNames) {
			const tag = await prisma.tag.upsert({
				where: { name: tagName },
				update: {},
				create: { name: tagName }
			});
			createdTagIds.push(tag.id);
		}

		// Combine all tag IDs
		const allTagIds = [...selectedTagIds, ...createdTagIds];

		// Create question
		await prisma.question.create({
			data: {
				answer: answer.trim(),
				question: question.trim(),
				instructorId: locals.instructor!.id,
				tags: {
					create: allTagIds.map((tagId) => ({
						tagId
					}))
				}
			}
		});

		throw redirect(303, '/dashboard/questions');
	}
} satisfies Actions;
