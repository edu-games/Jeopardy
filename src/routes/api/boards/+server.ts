import { json, error } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import prisma from "$lib/server/prisma";

// GET /api/boards - List all boards
export const GET: RequestHandler = async ({ locals }) => {
  if (!locals.instructor) {
    throw error(401, "Unauthorized");
  }

  const boards = await prisma.board.findMany({
    where: {
      instructorId: locals.instructor.id,
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
    orderBy: {
      createdAt: "desc",
    },
  });

  return json({ boards });
};

// POST /api/boards - Create a new board
export const POST: RequestHandler = async ({ locals, request }) => {
  if (!locals.instructor) {
    throw error(401, "Unauthorized");
  }

  const data = await request.json();
  const { name, description, categories } = data;

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

  // Create board with categories and slots
  const board = await prisma.board.create({
    data: {
      name: name.trim(),
      description: description?.trim() || null,
      instructorId: locals.instructor.id,
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

  return json(board, { status: 201 });
};
