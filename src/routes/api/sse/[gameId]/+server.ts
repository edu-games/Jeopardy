import type { RequestHandler } from './$types';
import { addClient, removeClient } from '$lib/server/realtime';
import { error } from '@sveltejs/kit';
import prisma from '$lib/server/prisma';

// GET /api/sse/[gameId] - Server-Sent Events endpoint
export const GET: RequestHandler = async ({ params }) => {
	const { gameId } = params;

	// Verify game exists
	const game = await prisma.game.findUnique({
		where: { id: gameId }
	});

	if (!game) {
		throw error(404, 'Game not found');
	}

	// Generate unique client ID
	const clientId = `${gameId}-${Date.now()}-${Math.random().toString(36).substring(7)}`;

	// Create readable stream for SSE
	const stream = new ReadableStream({
		start(controller) {
			// Add client to active connections
			addClient(clientId, gameId, controller);

			// Send initial connection event
			const welcomeMessage = `data: ${JSON.stringify({ type: 'connected', clientId })}\n\n`;
			controller.enqueue(new TextEncoder().encode(welcomeMessage));
		},
		cancel() {
			// Remove client when connection closes
			removeClient(clientId);
		}
	});

	// Return SSE response with proper headers
	return new Response(stream, {
		headers: {
			'Content-Type': 'text/event-stream',
			'Cache-Control': 'no-cache',
			'Connection': 'keep-alive',
			'X-Accel-Buffering': 'no' // Disable nginx buffering
		}
	});
};
