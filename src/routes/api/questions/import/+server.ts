import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import prisma from '$lib/server/prisma';

interface ImportQuestion {
	answer: string;
	question: string;
	tags: string[];
}

// POST /api/questions/import - Bulk import questions
export const POST: RequestHandler = async ({ locals, request }) => {
	if (!locals.instructor) {
		throw error(401, 'Unauthorized');
	}

	const data = await request.json();
	const { questions } = data;

	if (!Array.isArray(questions)) {
		throw error(400, 'Questions must be an array');
	}

	// Validate all questions
	for (const q of questions) {
		if (!q.answer || typeof q.answer !== 'string') {
			throw error(400, 'Each question must have an answer');
		}
		if (!q.question || typeof q.question !== 'string') {
			throw error(400, 'Each question must have a question');
		}
		if (!Array.isArray(q.tags)) {
			throw error(400, 'Each question must have a tags array');
		}
	}

	// Collect all unique tag names
	const allTagNames = new Set<string>();
	questions.forEach((q: ImportQuestion) => {
		q.tags.forEach((tag) => allTagNames.add(tag));
	});

	// Get or create tags
	const tagMap = new Map<string, string>();
	for (const tagName of allTagNames) {
		const tag = await prisma.tag.upsert({
			where: { name: tagName },
			update: {},
			create: { name: tagName }
		});
		tagMap.set(tagName, tag.id);
	}

	// Create questions with tags
	const createdQuestions = await Promise.all(
		questions.map((q: ImportQuestion) =>
			prisma.question.create({
				data: {
					answer: q.answer.trim(),
					question: q.question.trim(),
					instructorId: locals.instructor!.id,
					tags: {
						create: q.tags.map((tagName) => ({
							tagId: tagMap.get(tagName)!
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
			})
		)
	);

	return json({
		imported: createdQuestions.length,
		questions: createdQuestions
	}, { status: 201 });
};
