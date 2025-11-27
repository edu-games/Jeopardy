import bcrypt from "bcrypt";
import { dev } from "$app/environment";
import type { Cookies } from "@sveltejs/kit";
import prisma from "./prisma";

const SESSION_COOKIE_NAME = "session";
const SALT_ROUNDS = 10;

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Create a session for an instructor
 */
export async function createSession(
  instructorId: string,
  cookies: Cookies,
): Promise<string> {
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

  // Store session in database
  const session = await prisma.session.create({
    data: {
      instructorId,
      expiresAt,
    },
  });

  // Set cookie
  cookies.set(SESSION_COOKIE_NAME, session.id, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: !dev,
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });

  return session.id;
}

/**
 * Get the instructor from a session
 */
export async function getInstructorFromSession(cookies: Cookies) {
  const sessionId = cookies.get(SESSION_COOKIE_NAME);
  if (!sessionId) return null;

  // Get session from database
  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: {
      instructor: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
    },
  });

  if (!session) return null;

  // Check if session expired
  if (session.expiresAt < new Date()) {
    // Delete expired session
    await prisma.session.delete({
      where: { id: sessionId },
    });
    return null;
  }

  return session.instructor;
}

/**
 * Delete a session (logout)
 */
export async function deleteSession(cookies: Cookies): Promise<void> {
  const sessionId = cookies.get(SESSION_COOKIE_NAME);
  if (sessionId) {
    // Delete session from database
    await prisma.session
      .delete({
        where: { id: sessionId },
      })
      .catch(() => {
        // Ignore errors if session doesn't exist
      });
  }
  cookies.delete(SESSION_COOKIE_NAME, { path: "/" });
}

/**
 * Clean up expired sessions (should be called periodically)
 */
export async function cleanupExpiredSessions(): Promise<void> {
  await prisma.session.deleteMany({
    where: {
      expiresAt: {
        lt: new Date(),
      },
    },
  });
}

// Clean up expired sessions every hour
if (dev) {
  setInterval(
    () => {
      cleanupExpiredSessions().catch(console.error);
    },
    60 * 60 * 1000,
  );
}
