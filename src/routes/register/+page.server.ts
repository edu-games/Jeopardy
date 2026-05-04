import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { createSession, hashPassword } from '$lib/server/auth';
import { getDb } from '$lib/server/db';
import { eq } from 'drizzle-orm';
import { instructors } from '$lib/server/schema';
import { createId } from '@paralleldrive/cuid2';

export const load: PageServerLoad = async ({ locals }) => {
	if (locals.instructor) {
		throw redirect(303, '/dashboard');
	}
	return {};
};

export const actions = {
	default: async ({ request, cookies, platform }) => {
		const data = await request.formData();
		const name = data.get('name');
		const email = data.get('email');
		const password = data.get('password');
		const confirmPassword = data.get('confirmPassword');

		if (!name || typeof name !== 'string' || name.length < 2) {
			return fail(400, { error: 'Name must be at least 2 characters', name: '', email: '' });
		}

		if (!email || typeof email !== 'string' || !email.includes('@')) {
			return fail(400, { error: 'Valid email is required', name, email: '' });
		}

		if (!password || typeof password !== 'string' || password.length < 8) {
			return fail(400, { error: 'Password must be at least 8 characters', name, email });
		}

		if (password !== confirmPassword) {
			return fail(400, { error: 'Passwords do not match', name, email });
		}

		const db = getDb(platform!.env.DB);

		const existing = await db
			.select({ id: instructors.id })
			.from(instructors)
			.where(eq(instructors.email, email))
			.get();

		if (existing) {
			return fail(400, { error: 'Email already in use', name, email });
		}

		const hashedPassword = await hashPassword(password);
		const id = createId();
		const now = new Date().toISOString();

		await db
			.insert(instructors)
			.values({ id, name, email, password: hashedPassword, createdAt: now, updatedAt: now });

		await createSession(id, cookies, db);

		throw redirect(303, '/dashboard');
	}
} satisfies Actions;
