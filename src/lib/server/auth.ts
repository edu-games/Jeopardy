import bcryptjs from 'bcryptjs';
import type { Cookies } from '@sveltejs/kit';
import { eq, lt } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';
import { type DB } from './db';
import { sessions, instructors } from './schema';

const SESSION_COOKIE_NAME = 'session';
const SALT_ROUNDS = 10;

/**
 * Hash a password using bcryptjs
 */
export async function hashPassword(password: string): Promise<string> {
	return bcryptjs.hash(password, SALT_ROUNDS);
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
	return bcryptjs.compare(password, hash);
}

/**
 * Create a session for an instructor
 */
export async function createSession(
	instructorId: string,
	cookies: Cookies,
	db: DB
): Promise<string> {
	const id = createId();
	const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days
	const now = new Date().toISOString();

	await db.insert(sessions).values({ id, instructorId, expiresAt, createdAt: now, updatedAt: now });

	cookies.set(SESSION_COOKIE_NAME, id, {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		secure: true,
		maxAge: 60 * 60 * 24 * 30 // 30 days
	});

	return id;
}

/**
 * Get the instructor from a session
 */
export async function getInstructorFromSession(cookies: Cookies, db: DB) {
	const sessionId = cookies.get(SESSION_COOKIE_NAME);
	if (!sessionId) return null;

	const result = await db
		.select({
			session: sessions,
			instructor: {
				id: instructors.id,
				email: instructors.email,
				name: instructors.name
			}
		})
		.from(sessions)
		.innerJoin(instructors, eq(sessions.instructorId, instructors.id))
		.where(eq(sessions.id, sessionId))
		.get();

	if (!result) return null;

	// Check if session expired
	if (new Date(result.session.expiresAt) < new Date()) {
		await db.delete(sessions).where(eq(sessions.id, sessionId));
		return null;
	}

	return result.instructor;
}

/**
 * Delete a session (logout)
 */
export async function deleteSession(cookies: Cookies, db: DB): Promise<void> {
	const sessionId = cookies.get(SESSION_COOKIE_NAME);
	if (sessionId) {
		await db
			.delete(sessions)
			.where(eq(sessions.id, sessionId))
			.catch(() => {});
	}
	cookies.delete(SESSION_COOKIE_NAME, { path: '/' });
}

/**
 * Clean up expired sessions
 */
export async function cleanupExpiredSessions(db: DB): Promise<void> {
	await db.delete(sessions).where(lt(sessions.expiresAt, new Date().toISOString()));
}
