import { getDb } from '$lib/server/db';
import * as schema from '$lib/server/schema';
import { eq, desc, asc } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, platform }) => {
	const db = getDb(platform!.env.DB);
	const [questions, tags] = await Promise.all([
		db.query.questions.findMany({
			where: eq(schema.questions.instructorId, locals.instructor!.id),
			with: { tags: { with: { tag: true } } },
			orderBy: [desc(schema.questions.createdAt)],
		}),
		db.query.tags.findMany({ orderBy: [asc(schema.tags.name)] }),
	]);

	return { questions, tags };
};
