import { json, error } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import prisma from "$lib/server/prisma";

// GET /api/boards/[id] - Get a single board
export const GET: RequestHandler = async ({ locals, params }) => {
  if (!locals.instructor) {
    throw error(401, "Unauthorized");
  }

  const board = await prisma.board.findFirst({
    where: {
      id: params.id,
      instructorId: locals.instructor.id,
    },
    include: {
      categories: {
        include: {
          slots: {
            include: {
              question: {
                include: {
                  tags: {
                    include: {
                      tag: true,
                    },
                  },
                },
              },
            },
            orderBy: {
              row: "asc",
            },
          },
        },
        orderBy: {
          order: "asc",
        },
      },
    },
  });

  if (!board) {
    throw error(404, "Board not found");
  }

  return json(board);
};

// PUT /api/boards/[id] - Update a board
export const PUT: RequestHandler = async ({ locals, params, request }) => {
  if (!locals.instructor) {
    throw error(401, "Unauthorized");
  }

  const data = await request.json();
  const { name, description, categories } = data;

  // Check if board exists and belongs to instructor
  const existingBoard = await prisma.board.findFirst({
    where: {
      id: params.id,
      instructorId: locals.instructor.id,
    },
  });

  if (!existingBoard) {
    throw error(404, "Board not found");
  }

  // Validation
  if (!name || typeof name !== "string" || name.trim().length === 0) {
    throw error(400, "Board name is required");
  }

  if (!categories || !Array.isArray(categories) || categories.length !== 6) {
    throw error(400, "Board must have exactly 6 categories");
  }

  // Validate categories
  for (let i = 0; i < categories.length; i++) {
    const category = categories[i];
    if (!category.name || typeof category.name !== "string") {
      throw error(400, `Category ${i + 1} must have a name`);
    }
    if (
      !category.slots ||
      !Array.isArray(category.slots) ||
      category.slots.length !== 5
    ) {
      throw error(400, `Category ${i + 1} must have exactly 5 question slots`);
    }

    // Validate slots
    for (let j = 0; j < category.slots.length; j++) {
      const slot = category.slots[j];
      if (!slot.questionId || typeof slot.questionId !== "string") {
        throw error(
          400,
          `Category ${i + 1}, slot ${j + 1} must have a question ID`,
        );
      }
      if (typeof slot.points !== "number" || slot.points <= 0) {
        throw error(
          400,
          `Category ${i + 1}, slot ${j + 1} must have valid points`,
        );
      }
    }
  }

  // Delete existing categories and slots
  await prisma.category.deleteMany({
    where: { boardId: params.id },
  });

  // Update board with new categories and slots
  const board = await prisma.board.update({
    where: { id: params.id },
    data: {
      name: name.trim(),
      description: description?.trim() || null,
      categories: {
        create: categories.map((category: any, index: number) => ({
          name: category.name.trim(),
          order: index,
          slots: {
            create: category.slots.map((slot: any, slotIndex: number) => ({
              questionId: slot.questionId,
              row: slotIndex,
              column: index,
              points: slot.points,
              isDailyDouble: slot.isDailyDouble || false,
            })),
          },
        })),
      },
    },
    include: {
      categories: {
        include: {
          slots: {
            include: {
              question: true,
            },
          },
        },
        orderBy: {
          order: "asc",
        },
      },
    },
  });

  return json(board);
};

// DELETE /api/boards/[id] - Delete a board
export const DELETE: RequestHandler = async ({ locals, params }) => {
  if (!locals.instructor) {
    throw error(401, "Unauthorized");
  }

  // Check if board exists and belongs to instructor
  const existingBoard = await prisma.board.findFirst({
    where: {
      id: params.id,
      instructorId: locals.instructor.id,
    },
  });

  if (!existingBoard) {
    throw error(404, "Board not found");
  }

  await prisma.board.delete({
    where: { id: params.id },
  });

  return json({ success: true });
};
