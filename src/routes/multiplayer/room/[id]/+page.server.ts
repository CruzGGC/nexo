import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getRoomState } from '$lib/multiplayer/matchmaking';

export const load: PageServerLoad = async ({ params, locals }) => {
	// Must be authenticated
	if (!locals.user) {
		redirect(302, '/auth/login');
	}

	const room = await getRoomState(locals.pb, params.id, locals.user.id);

	if (!room) {
		return {
			room: null,
			error: 'not_found' as const
		};
	}

	// Verify user is a participant
	const isParticipant = room.players.some(p => p.userId === locals.user!.id);
	if (!isParticipant) {
		return {
			room: null,
			error: 'not_participant' as const
		};
	}

	return {
		room: {
			id: room.id,
			gameType: room.gameType,
			status: room.status,
			players: room.players,
			turn: room.turn,
			boardState: room.boardState,
			round: room.round,
			winner: room.winner,
			isDraw: room.isDraw,
			version: room.version,
			roomCode: room.roomCode,
			isPrivate: room.isPrivate
		},
		error: null
	};
};
