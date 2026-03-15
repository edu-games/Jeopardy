import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDb } from '$lib/server/db';
import { tags, questionTags } from '$lib/server/schema';
import { eq, asc, count } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';

export const GET: RequestHandler = async ({ locals, platform }) => {
	if (!locals.instructor) throw error(401, 'Unauthorized');

	const db = getDb(platform!.env.DB);

	const allTags = await db
		.select({
			id: tags.id,
			name: tags.name,
			createdAt: tags.createdAt,
			questionCount: count(questionTags.tagId)
		})
		.from(tags)
		.leftJoin(questionTags, eq(tags.id, questionTags.tagId))
		.groupBy(tags.id)
		.orderBy(asc(tags.name));

	return json({ tags: allTags });
};

export const POST: RequestHandler = async ({ locals, request, platform }) => {
	if (!locals.instructor) throw error(401, 'Unauthorized');

	const data = await request.json();
	const { name } = data;

	if (!name || typeof name !== 'string' || name.trim().length === 0) {
		throw error(400, 'Tag name is required');
	}

	const db = getDb(platform!.env.DB);
	const trimmed = name.trim();

	const existing = await db.select().from(tags).where(eq(tags.name, trimmed)).get();
	if (existing) return json(existing);

	const id = createId();
	const now = new Date().toISOString();
	await db.insert(tags).values({ id, name: trimmed, createdAt: now });

	return json({ id, name: trimmed, createdAt: now }, { status: 201 });
};
