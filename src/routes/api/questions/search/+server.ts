import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import prisma from '$lib/server/prisma';

// GET /api/questions/search - Search questions by tags
export const GET: RequestHandler = async ({ locals, url }) => {
	if (!locals.instructor) {
		throw error(401, 'Unauthorized');
	}

	const tagNames = url.searchParams.getAll('tag');
	const searchTerm = url.searchParams.get('q') || '';

	// Build where clause
	const where: any = {
		instructorId: locals.instructor.id
	};

	// Add text search
	if (searchTerm) {
		where.OR = [
			{ answer: { contains: searchTerm, mode: 'insensitive' } },
			{ question: { contains: searchTerm, mode: 'insensitive' } }
		];
	}

	// Add tag filter by name
	if (tagNames.length > 0) {
		where.tags = {
			some: {
				tag: {
					name: { in: tagNames }
				}
			}
		};
	}

	const questions = await prisma.question.findMany({
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
		}
	});

	return json({ questions });
};
