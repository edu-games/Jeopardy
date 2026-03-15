import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDb } from '$lib/server/db';
import { tags } from '$lib/server/schema';
import { eq } from 'drizzle-orm';

export const DELETE: RequestHandler = async ({ locals, params, platform }) => {
	if (!locals.instructor) throw error(401, 'Unauthorized');

	const db = getDb(platform!.env.DB);

	const tag = await db.select().from(tags).where(eq(tags.id, params.id)).get();
	if (!tag) throw error(404, 'Tag not found');

	await db.delete(tags).where(eq(tags.id, params.id));

	return json({ success: true });
};
