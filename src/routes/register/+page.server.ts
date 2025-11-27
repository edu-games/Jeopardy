import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import prisma from '$lib/server/prisma';
import { createSession, hashPassword } from '$lib/server/auth';

export const load: PageServerLoad = async ({ locals }) => {
	// Redirect if already logged in
	if (locals.instructor) {
		throw redirect(303, '/dashboard');
	}
	return {};
};

export const actions = {
	default: async ({ request, cookies }) => {
		const data = await request.formData();
		const name = data.get('name');
		const email = data.get('email');
		const password = data.get('password');
		const confirmPassword = data.get('confirmPassword');

		// Validation
		if (!name || typeof name !== 'string' || name.length < 2) {
			return fail(400, { error: 'Name must be at least 2 characters', name: '', email: '' });
		}

		if (!email || typeof email !== 'string' || !email.includes('@')) {
			return fail(400, { error: 'Valid email is required', name, email: '' });
		}

		if (!password || typeof password !== 'string' || password.length < 8) {
			return fail(400, {
				error: 'Password must be at least 8 characters',
				name,
				email
			});
		}

		if (password !== confirmPassword) {
			return fail(400, { error: 'Passwords do not match', name, email });
		}

		// Check if email already exists
		const existingInstructor = await prisma.instructor.findUnique({
			where: { email }
		});

		if (existingInstructor) {
			return fail(400, { error: 'Email already in use', name, email });
		}

		// Hash password
		const hashedPassword = await hashPassword(password);

		// Create instructor
		const instructor = await prisma.instructor.create({
			data: {
				name,
				email,
				password: hashedPassword
			}
		});

		// Create session
		await createSession(instructor.id, cookies);

		// Redirect to dashboard
		throw redirect(303, '/dashboard');
	}
} satisfies Actions;
