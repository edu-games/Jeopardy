import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import prisma from '$lib/server/prisma';

export const load: PageServerLoad = async ({ locals, params }) => {
	// Get the board
	const board = await prisma.board.findFirst({
		where: {
			id: params.id,
			instructorId: locals.instructor!.id
		},
		include: {
			categories: {
				include: {
					slots: {
						include: {
							question: true
						}
					}
				},
				orderBy: {
					order: 'asc'
				}
			}
		}
	});

	if (!board) {
		throw error(404, 'Board not found');
	}

	// Get all questions for selection
	const questions = await prisma.question.findMany({
		where: {
			instructorId: locals.instructor!.id
		},
		include: {
			tags: {
				include: {
					tag: true
				}
			}
		},
		orderBy: {
			createdAt: 'desc'
		}
	});

	// Get all tags for filtering
	const tags = await prisma.tag.findMany({
		orderBy: {
			name: 'asc'
		}
	});

	return {
		board,
		questions,
		tags
	};
};
