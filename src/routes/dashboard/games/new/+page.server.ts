import type { PageServerLoad } from './$types';
import prisma from '$lib/server/prisma';

export const load: PageServerLoad = async ({ locals }) => {
	// Get all complete boards
	const boards = await prisma.board.findMany({
		where: {
			instructorId: locals.instructor!.id
		},
		include: {
			categories: {
				include: {
					slots: true
				}
			}
		},
		orderBy: {
			createdAt: 'desc'
		}
	});

	// Filter to only complete boards (30 slots)
	const completeBoards = boards.filter((board) => {
		const totalSlots = board.categories.reduce((sum, cat) => sum + cat.slots.length, 0);
		return totalSlots === 30;
	});

	return {
		boards: completeBoards
	};
};
