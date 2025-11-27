import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import prisma from '$lib/server/prisma';

// GET /api/questions/[id] - Get a single question
export const GET: RequestHandler = async ({ locals, params }) => {
	if (!locals.instructor) {
		throw error(401, 'Unauthorized');
	}

	const question = await prisma.question.findFirst({
		where: {
			id: params.id,
			instructorId: locals.instructor.id
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

	return json(question);
};

// PUT /api/questions/[id] - Update a question
export const PUT: RequestHandler = async ({ locals, params, request }) => {
	if (!locals.instructor) {
		throw error(401, 'Unauthorized');
	}

	const data = await request.json();
	const { answer, question, tagIds = [] } = data;

	// Check if question exists and belongs to instructor
	const existingQuestion = await prisma.question.findFirst({
		where: {
			id: params.id,
			instructorId: locals.instructor.id
		}
	});

	if (!existingQuestion) {
		throw error(404, 'Question not found');
	}

	// Validation
	if (!answer || typeof answer !== 'string' || answer.trim().length === 0) {
		throw error(400, 'Answer is required');
	}

	if (!question || typeof question !== 'string' || question.trim().length === 0) {
		throw error(400, 'Question is required');
	}

	// Update question and tags
	const updatedQuestion = await prisma.question.update({
		where: { id: params.id },
		data: {
			answer: answer.trim(),
			question: question.trim(),
			tags: {
				// Delete existing tags
				deleteMany: {},
				// Create new tags
				create: tagIds.map((tagId: string) => ({
					tagId
				}))
			}
		},
		include: {
			tags: {
				include: {
					tag: true
				}
			}
		}
	});

	return json(updatedQuestion);
};

// DELETE /api/questions/[id] - Delete a question
export const DELETE: RequestHandler = async ({ locals, params }) => {
	if (!locals.instructor) {
		throw error(401, 'Unauthorized');
	}

	// Check if question exists and belongs to instructor
	const existingQuestion = await prisma.question.findFirst({
		where: {
			id: params.id,
			instructorId: locals.instructor.id
		}
	});

	if (!existingQuestion) {
		throw error(404, 'Question not found');
	}

	await prisma.question.delete({
		where: { id: params.id }
	});

	return json({ success: true });
};
