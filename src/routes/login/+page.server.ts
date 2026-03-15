import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { createSession, verifyPassword } from '$lib/server/auth';
import { getDb } from '$lib/server/db';
import { eq } from 'drizzle-orm';
import { instructors } from '$lib/server/schema';

export const load: PageServerLoad = async ({ locals }) => {
	if (locals.instructor) {
		throw redirect(303, '/dashboard');
	}
	return {};
};

export const actions = {
	default: async ({ request, cookies, platform }) => {
		const data = await request.formData();
		const email = data.get('email');
		const password = data.get('password');

		if (!email || typeof email !== 'string') {
			return fail(400, { error: 'Email is required', email: '' });
		}

		if (!password || typeof password !== 'string') {
			return fail(400, { error: 'Password is required', email });
		}

		const db = getDb(platform!.env.DB);

		const instructor = await db
			.select()
			.from(instructors)
			.where(eq(instructors.email, email))
			.get();

		if (!instructor) {
			return fail(400, { error: 'Invalid email or password', email });
		}

		const validPassword = await verifyPassword(password, instructor.password);
		if (!validPassword) {
			return fail(400, { error: 'Invalid email or password', email });
		}

		await createSession(instructor.id, cookies, db);

		throw redirect(303, '/dashboard');
	}
} satisfies Actions;
