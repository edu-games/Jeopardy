import { PrismaClient } from '@prisma/client';
import { dev } from '$app/environment';

// Prevent multiple instances of Prisma Client in development
declare global {
	// eslint-disable-next-line no-var
	var prisma: PrismaClient | undefined;
}

const prisma = global.prisma || new PrismaClient();

if (dev) {
	global.prisma = prisma;
}

export default prisma;
