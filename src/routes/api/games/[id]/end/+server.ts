import { json, error } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import prisma from "$lib/server/prisma";
import { broadcastToGame } from "$lib/server/realtime";

// POST /api/games/[id]/end - End/cancel a game
export const POST: RequestHandler = async ({ locals, params }) => {
  if (!locals.instructor) {
    throw error(401, "Unauthorized");
  }

  const game = await prisma.game.findFirst({
    where: {
      id: params.id,
      instructorId: locals.instructor.id,
    },
  });

  if (!game) {
    throw error(404, "Game not found");
  }

  if (game.status === "COMPLETED") {
    throw error(400, "Game is already completed");
  }

  // Update game status to COMPLETED
  const updatedGame = await prisma.game.update({
    where: { id: params.id },
    data: {
      status: "COMPLETED",
    },
    include: {
      teams: true,
      students: true,
      gameState: true,
    },
  });

  // Broadcast game-ended event to all connected clients
  broadcastToGame(updatedGame.id, {
    type: "game-ended",
    status: updatedGame.status,
  });

  return json(updatedGame);
};
