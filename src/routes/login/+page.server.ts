import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import prisma from '$lib/server/prisma';
import { createSession, verifyPassword } from '$lib/server/auth';

export const load: PageServerLoad = async ({ locals }) => {
	// Redirect if already logged in (handled by hooks, but double-check)
	if (locals.instructor) {
		throw redirect(303, '/dashboard');
	}
	return {};
};

export const actions = {
	default: async ({ request, cookies }) => {
		const data = await request.formData();
		const email = data.get('email');
		const password = data.get('password');

		// Validation
		if (!email || typeof email !== 'string') {
			return fail(400, { error: 'Email is required', email: '' });
		}

		if (!password || typeof password !== 'string') {
			return fail(400, { error: 'Password is required', email });
		}

		// Find instructor
		const instructor = await prisma.instructor.findUnique({
			where: { email }
		});

		if (!instructor) {
			return fail(400, { error: 'Invalid email or password', email });
		}

		// Verify password
		const validPassword = await verifyPassword(password, instructor.password);
		if (!validPassword) {
			return fail(400, { error: 'Invalid email or password', email });
		}

		// Create session
		await createSession(instructor.id, cookies);

		// Redirect to dashboard
		throw redirect(303, '/dashboard');
	}
} satisfies Actions;
