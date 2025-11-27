import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import prisma from '$lib/server/prisma';

// GET /api/tags - List all tags
export const GET: RequestHandler = async ({ locals }) => {
	if (!locals.instructor) {
		throw error(401, 'Unauthorized');
	}

	const tags = await prisma.tag.findMany({
		orderBy: {
			name: 'asc'
		},
		include: {
			_count: {
				select: {
					questions: true
				}
			}
		}
	});

	return json({ tags });
};

// POST /api/tags - Create a new tag
export const POST: RequestHandler = async ({ locals, request }) => {
	if (!locals.instructor) {
		throw error(401, 'Unauthorized');
	}

	const data = await request.json();
	const { name } = data;

	if (!name || typeof name !== 'string' || name.trim().length === 0) {
		throw error(400, 'Tag name is required');
	}

	// Check if tag already exists
	const existing = await prisma.tag.findUnique({
		where: { name: name.trim() }
	});

	if (existing) {
		return json(existing);
	}

	const tag = await prisma.tag.create({
		data: {
			name: name.trim()
		}
	});

	return json(tag, { status: 201 });
};
