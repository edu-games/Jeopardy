import bcrypt from 'bcrypt';
import { dev } from '$app/environment';
import type { Cookies } from '@sveltejs/kit';
import prisma from './prisma';

const SESSION_COOKIE_NAME = 'session';
const SALT_ROUNDS = 10;

// Simple in-memory session store for development
// In production, use Redis or database-backed sessions
const sessions = new Map<string, { instructorId: string; expiresAt: number }>();

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
	return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
	return bcrypt.compare(password, hash);
}

/**
 * Generate a random session ID
 */
function generateSessionId(): string {
	return crypto.randomUUID();
}

/**
 * Create a session for an instructor
 */
export async function createSession(instructorId: string, cookies: Cookies): Promise<string> {
	const sessionId = generateSessionId();
	const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days

	// Store session
	sessions.set(sessionId, { instructorId, expiresAt });

	// Set cookie
	cookies.set(SESSION_COOKIE_NAME, sessionId, {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		secure: !dev,
		maxAge: 60 * 60 * 24 * 7 // 7 days
	});

	return sessionId;
}

/**
 * Get the instructor from a session
 */
export async function getInstructorFromSession(cookies: Cookies) {
	const sessionId = cookies.get(SESSION_COOKIE_NAME);
	if (!sessionId) return null;

	const session = sessions.get(sessionId);
	if (!session) return null;

	// Check if session expired
	if (session.expiresAt < Date.now()) {
		sessions.delete(sessionId);
		return null;
	}

	// Get instructor from database
	const instructor = await prisma.instructor.findUnique({
		where: { id: session.instructorId },
		select: {
			id: true,
			email: true,
			name: true
		}
	});

	return instructor;
}

/**
 * Delete a session (logout)
 */
export async function deleteSession(cookies: Cookies): Promise<void> {
	const sessionId = cookies.get(SESSION_COOKIE_NAME);
	if (sessionId) {
		sessions.delete(sessionId);
	}
	cookies.delete(SESSION_COOKIE_NAME, { path: '/' });
}

/**
 * Clean up expired sessions (should be called periodically)
 */
export function cleanupExpiredSessions(): void {
	const now = Date.now();
	for (const [sessionId, session] of sessions.entries()) {
		if (session.expiresAt < now) {
			sessions.delete(sessionId);
		}
	}
}

// Clean up expired sessions every hour in development
if (dev) {
	setInterval(cleanupExpiredSessions, 60 * 60 * 1000);
}
