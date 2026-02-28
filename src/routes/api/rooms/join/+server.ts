import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { roomJoinSchema } from '$lib/validators';
import { joinRoomByCode } from '$lib/multiplayer/matchmaking';

/**
 * POST /api/rooms/join
 * Join a room by code. Used for private rooms.
 * Requires authentication.
 */
export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) {
		return json({ success: false, error: 'auth_required' }, { status: 401 });
	}

	try {
		const body = await request.json();
		const parsed = roomJoinSchema.safeParse(body);

		if (!parsed.success) {
			return json(
				{ success: false, error: 'invalid_payload', details: parsed.error?.flatten().fieldErrors },
				{ status: 400 }
			);
		}

		const { roomCode } = parsed.data!;
		const result = await joinRoomByCode(
			locals.pb,
			locals.user.id,
			locals.user.username || locals.user.email,
			roomCode
		);

		if (!result.success) {
			return json(
				{ success: false, error: result.error },
				{ status: result.error === 'room_full' ? 409 : 404 }
			);
		}

		return json({ success: true, roomId: result.roomId });
	} catch (err) {
		console.error('Room join error:', err);
		return json({ success: false, error: 'join_failed' }, { status: 500 });
	}
};
