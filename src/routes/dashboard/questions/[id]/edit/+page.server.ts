import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import prisma from '$lib/server/prisma';

export const load: PageServerLoad = async ({ locals, params }) => {
	// Get the question
	const question = await prisma.question.findFirst({
		where: {
			id: params.id,
			instructorId: locals.instructor!.id
		},
		include: {
			tags: {
				include: {
					tag: true
				}
			}
		}
	});

	if (!question) {
		throw error(404, 'Question not found');
	}

	// Get all tags for selection
	const allTags = await prisma.tag.findMany({
		orderBy: {
			name: 'asc'
		}
	});

	return {
		question,
		allTags
	};
};

export const actions = {
	default: async ({ locals, params, request }) => {
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

		// Check if question exists
		const existingQuestion = await prisma.question.findFirst({
			where: {
				id: params.id,
				instructorId: locals.instructor!.id
			}
		});

		if (!existingQuestion) {
			throw error(404, 'Question not found');
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

		// Update question
		await prisma.question.update({
			where: { id: params.id },
			data: {
				answer: answer.trim(),
				question: question.trim(),
				tags: {
					deleteMany: {},
					create: allTagIds.map((tagId) => ({
						tagId
					}))
				}
			}
		});

		throw redirect(303, '/dashboard/questions');
	}
} satisfies Actions;
