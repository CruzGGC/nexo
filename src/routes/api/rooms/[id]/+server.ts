import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getRoomState } from '$lib/multiplayer/matchmaking';

/**
 * GET /api/rooms/[id]
 * Get current room state. Requires authentication.
 * Sanitises board state per-player if the game rules support it.
 */
export const GET: RequestHandler = async ({ params, locals }) => {
	if (!locals.user) {
		return json({ success: false, error: 'auth_required' }, { status: 401 });
	}

	try {
		const room = await getRoomState(locals.pb, params.id, locals.user.id);

		if (!room) {
			return json({ success: false, error: 'room_not_found' }, { status: 404 });
		}

		// Verify user is a participant
		const isParticipant = room.players.some(p => p.userId === locals.user!.id);
		if (!isParticipant) {
			return json({ success: false, error: 'not_participant' }, { status: 403 });
		}

		return json({
			success: true,
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
			}
		});
	} catch (err) {
		console.error('Room get error:', err);
		return json({ success: false, error: 'fetch_failed' }, { status: 500 });
	}
};
