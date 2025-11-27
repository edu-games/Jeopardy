import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import prisma from '$lib/server/prisma';

// GET /api/questions/export - Export all questions as JSON
export const GET: RequestHandler = async ({ locals }) => {
	if (!locals.instructor) {
		throw error(401, 'Unauthorized');
	}

	const questions = await prisma.question.findMany({
		where: {
			instructorId: locals.instructor.id
		},
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

	// Format for export
	const exportData = questions.map((q) => ({
		answer: q.answer,
		question: q.question,
		tags: q.tags.map((t) => t.tag.name)
	}));

	return json({
		version: '1.0',
		exportedAt: new Date().toISOString(),
		instructor: locals.instructor.email,
		count: exportData.length,
		questions: exportData
	});
};
