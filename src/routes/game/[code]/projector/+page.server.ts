import { error } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import prisma from "$lib/server/prisma";
import { generateGameQRCode } from "$lib/server/qr";

export const load: PageServerLoad = async ({ params, url }) => {
  const gameCode = params.code;

  // Load game data
  const game = await prisma.game.findUnique({
    where: { code: gameCode.toUpperCase() },
    include: {
      board: {
        include: {
          categories: {
            include: {
              slots: {
                include: {
                  question: true,
                },
                orderBy: { row: "asc" },
              },
            },
            orderBy: { order: "asc" },
          },
        },
      },
      gameState: true,
    },
  });

  if (!game) {
    throw error(404, "Game not found");
  }

  // Generate QR code with dynamic base URL
  const baseUrl = `${url.protocol}//${url.host}`;

  return {
    game,
    baseUrl,
  };
};
