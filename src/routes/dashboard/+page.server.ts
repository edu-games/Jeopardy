import prisma from "$lib/server/prisma";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals }) => {
  const instructorId = locals.instructor!.id;

  // Fetch stats for the instructor
  const [questionCount, boardCount, gameCount] = await Promise.all([
    prisma.question.count({
      where: { instructorId },
    }),
    prisma.board.count({
      where: { instructorId },
    }),
    prisma.game.count({
      where: { instructorId },
    }),
  ]);

  return {
    stats: {
      questions: questionCount,
      boards: boardCount,
      games: gameCount,
    },
  };
};
