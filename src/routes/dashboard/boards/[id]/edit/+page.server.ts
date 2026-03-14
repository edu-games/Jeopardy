import { error } from '@sveltejs/kit';
import { getDb } from '$lib/server/db';
import * as schema from '$lib/server/schema';
import { and, eq, desc, asc } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, params, platform }) => {
	const db = getDb(platform!.env.DB);
	const [board, questions, tags] = await Promise.all([
		db.query.boards.findFirst({
			where: and(eq(schema.boards.id, params.id), eq(schema.boards.instructorId, locals.instructor!.id)),
			with: {
				categories: {
					with: {
						slots: {
							with: { question: true },
							orderBy: [asc(schema.boardQuestionSlots.row)],
						},
					},
					orderBy: [asc(schema.categories.order)],
				},
			},
		}),
		db.query.questions.findMany({
			where: eq(schema.questions.instructorId, locals.instructor!.id),
			with: { tags: { with: { tag: true } } },
			orderBy: [desc(schema.questions.createdAt)],
		}),
		db.query.tags.findMany({ orderBy: [asc(schema.tags.name)] }),
	]);

	if (!board) throw error(404, 'Board not found');

	return { board, questions, tags };
};
