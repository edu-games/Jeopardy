import { error } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import prisma from "$lib/server/prisma";
import { generateGameQRCode } from "$lib/server/qr";

export const load: PageServerLoad = async ({ locals, params, url }) => {
  const game = await prisma.game.findFirst({
    where: {
      id: params.id,
      instructorId: locals.instructor!.id,
    },
    include: {
      board: true,
      teams: {
        include: {
          students: true,
        },
        orderBy: {
          createdAt: "asc",
        },
      },
      students: {
        orderBy: {
          createdAt: "asc",
        },
      },
    },
  });

  if (!game) {
    throw error(404, "Game not found");
  }

  if (game.status !== "LOBBY") {
    throw error(400, "Game has already started");
  }

  // Generate QR code with dynamic base URL
  const baseUrl = `${url.protocol}//${url.host}`;
  const qrCode = await generateGameQRCode(game.code, baseUrl);

  return {
    game,
    qrCode,
    baseUrl,
  };
};
