import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
	// This check is redundant due to hooks.server.ts, but good to be explicit
	if (!locals.instructor) {
		throw redirect(303, '/login');
	}

	return {
		instructor: locals.instructor
	};
};
