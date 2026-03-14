import type { Handle } from '@sveltejs/kit';
import { getInstructorFromSession } from '$lib/server/auth';
import { getDb } from '$lib/server/db';

export const handle: Handle = async ({ event, resolve }) => {
	const db = getDb(event.platform!.env.DB);

	// Get instructor from session if exists
	const instructor = await getInstructorFromSession(event.cookies, db);

	// Add instructor to locals so it's available in all routes
	event.locals.instructor = instructor;

	// Check if route requires authentication
	const isProtectedRoute = event.url.pathname.startsWith('/dashboard');
	const isAuthRoute =
		event.url.pathname.startsWith('/login') || event.url.pathname.startsWith('/register');

	if (isProtectedRoute && !instructor) {
		return Response.redirect(new URL('/login', event.url.origin), 303);
	}

	if (isAuthRoute && instructor) {
		return Response.redirect(new URL('/dashboard', event.url.origin), 303);
	}

	const response = await resolve(event);
	return response;
};
