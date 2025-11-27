import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import prisma from '$lib/server/prisma';

// GET /api/questions - List all questions with optional filters
export const GET: RequestHandler = async ({ locals, url }) => {
	if (!locals.instructor) {
		throw error(401, 'Unauthorized');
	}

	const search = url.searchParams.get('search') || '';
	const tagIds = url.searchParams.getAll('tagId');
	const limit = parseInt(url.searchParams.get('limit') || '50');
	const offset = parseInt(url.searchParams.get('offset') || '0');

	// Build where clause
	const where: any = {
		instructorId: locals.instructor.id
	};

	// Add search filter
	if (search) {
		where.OR = [
			{ answer: { contains: search, mode: 'insensitive' } },
			{ question: { contains: search, mode: 'insensitive' } }
		];
	}

	// Add tag filter
	if (tagIds.length > 0) {
		where.tags = {
			some: {
				tagId: { in: tagIds }
			}
		};
	}

	const [questions, total] = await Promise.all([
		prisma.question.findMany({
			where,
			include: {
				tags: {
					include: {
						tag: true
					}
				}
			},
			orderBy: {
				createdAt: 'desc'
			},
			take: limit,
			skip: offset
		}),
		prisma.question.count({ where })
	]);

	return json({
		questions,
		total,
		limit,
		offset
	});
};

// POST /api/questions - Create a new question
export const POST: RequestHandler = async ({ locals, request }) => {
	if (!locals.instructor) {
		throw error(401, 'Unauthorized');
	}

	const data = await request.json();
	const { answer, question, tagIds = [] } = data;

	// Validation
	if (!answer || typeof answer !== 'string' || answer.trim().length === 0) {
		throw error(400, 'Answer is required');
	}

	if (!question || typeof question !== 'string' || question.trim().length === 0) {
		throw error(400, 'Question is required');
	}

	if (!Array.isArray(tagIds)) {
		throw error(400, 'Tag IDs must be an array');
	}

	// Create question with tags
	const newQuestion = await prisma.question.create({
		data: {
			answer: answer.trim(),
			question: question.trim(),
			instructorId: locals.instructor.id,
			tags: {
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

	return json(newQuestion, { status: 201 });
};
