import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { roomActionSchema } from '$lib/validators';
import { processAction, setPlayerReady, abandonRoom } from '$lib/multiplayer/room-engine';

/**
 * POST /api/rooms/[id]/action
 *
 * Submit a player action to the room engine.
 * Supports special action types:
 *   - "ready" / "not_ready" — toggle ready state in waiting room
 *   - "abandon" — leave/forfeit the game
 *   - anything else — delegated to game-specific rules
 *
 * Requires authentication. Player must be a room participant.
 */
export const POST: RequestHandler = async ({ params, request, locals }) => {
	if (!locals.user) {
		return json({ success: false, error: 'auth_required' }, { status: 401 });
	}

	try {
		const body = await request.json();
		const parsed = roomActionSchema.safeParse(body);

		if (!parsed.success) {
			return json(
				{ success: false, error: 'invalid_payload', details: parsed.error?.flatten().fieldErrors },
				{ status: 400 }
			);
		}

		const { actionType, actionData, version } = parsed.data!;
		const roomId = params.id;
		const userId = locals.user.id;

		let result;

		// Handle special action types
		switch (actionType) {
			case 'ready':
				result = await setPlayerReady(locals.pb, roomId, userId, true);
				break;

			case 'not_ready':
				result = await setPlayerReady(locals.pb, roomId, userId, false);
				break;

			case 'abandon':
				result = await abandonRoom(locals.pb, roomId, userId);
				break;

			default:
				// Game-specific action — route through the versioned pipeline
				result = await processAction(
					locals.pb,
					roomId,
					userId,
					actionType,
					actionData,
					version
				);
				break;
		}

		if (!result.success) {
			// Map specific errors to HTTP status codes
			const statusMap: Record<string, number> = {
				not_participant: 403,
				not_your_turn: 409,
				version_mismatch: 409,
				room_not_playing: 409,
				unknown_game_type: 400,
				invalid_action: 400
			};
			const status = statusMap[result.error || ''] || 500;

			return json(
				{ success: false, error: result.error },
				{ status }
			);
		}

		return json({
			success: true,
			room: result.room
		});
	} catch (err) {
		console.error('Room action error:', err);
		return json({ success: false, error: 'action_failed' }, { status: 500 });
	}
};
