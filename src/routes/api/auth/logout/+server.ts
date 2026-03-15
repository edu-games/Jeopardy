import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { deleteSession } from '$lib/server/auth';
import { getDb } from '$lib/server/db';

export const POST: RequestHandler = async ({ cookies, platform }) => {
	const db = getDb(platform!.env.DB);
	await deleteSession(cookies, db);
	return json({ success: true });
};
