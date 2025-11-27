import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import prisma from '$lib/server/prisma';

// DELETE /api/tags/[id] - Delete a tag
export const DELETE: RequestHandler = async ({ locals, params }) => {
	if (!locals.instructor) {
		throw error(401, 'Unauthorized');
	}

	const tag = await prisma.tag.findUnique({
		where: { id: params.id }
	});

	if (!tag) {
		throw error(404, 'Tag not found');
	}

	await prisma.tag.delete({
		where: { id: params.id }
	});

	return json({ success: true });
};
