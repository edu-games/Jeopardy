import { json, error } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import prisma from "$lib/server/prisma";
import { broadcastToGame } from "$lib/server/realtime";

// POST /api/games/[id]/assign-team - Assign student to team
export const POST: RequestHandler = async ({ locals, params, request }) => {
  if (!locals.instructor) {
    throw error(401, "Unauthorized");
  }

  const data = await request.json();
  const { studentId, teamId } = data;

  if (!studentId || typeof studentId !== "string") {
    throw error(400, "Student ID is required");
  }

  if (!teamId || typeof teamId !== "string") {
    throw error(400, "Team ID is required");
  }

  // Verify game belongs to instructor
  const game = await prisma.game.findFirst({
    where: {
      id: params.id,
      instructorId: locals.instructor.id,
    },
  });

  if (!game) {
    throw error(404, "Game not found");
  }

  // Verify student exists in game
  const student = await prisma.student.findFirst({
    where: {
      id: studentId,
      gameId: params.id,
    },
  });

  if (!student) {
    throw error(404, "Student not found");
  }

  // Verify team exists in game
  const team = await prisma.team.findFirst({
    where: {
      id: teamId,
      gameId: params.id,
    },
  });

  if (!team) {
    throw error(404, "Team not found");
  }

  // Assign student to team
  const updatedStudent = await prisma.student.update({
    where: { id: studentId },
    data: {
      teamId,
    },
    include: {
      team: true,
    },
  });

  // Get updated students and teams to broadcast
  const updatedGame = await prisma.game.findUnique({
    where: { id: params.id },
    include: {
      students: {
        include: {
          team: true,
        },
      },
      teams: {
        include: {
          students: true,
        },
      },
    },
  });

  // Broadcast team-assigned event to all connected clients
  if (updatedGame) {
    broadcastToGame(params.id, {
      type: "team-assigned",
      students: updatedGame.students,
      teams: updatedGame.teams,
    });
  }

  return json(updatedStudent);
};
