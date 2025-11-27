import type { PageServerLoad } from './$types';
import prisma from '$lib/server/prisma';

export const load: PageServerLoad = async ({ locals }) => {
	// Get all boards for this instructor
	const boards = await prisma.board.findMany({
		where: {
			instructorId: locals.instructor!.id
		},
		include: {
			categories: {
				include: {
					slots: true
				}
			},
			_count: {
				select: {
					games: true
				}
			}
		},
		orderBy: {
			createdAt: 'desc'
		}
	});

	return {
		boards
	};
};
