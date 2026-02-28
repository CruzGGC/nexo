import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { roomCreateSchema, roomJoinSchema } from '$lib/validators';
import { createPrivateRoom, joinRoomByCode } from '$lib/multiplayer/matchmaking';

/**
 * POST /api/rooms
 * Create a private room. Returns roomId + roomCode for sharing.
 * Requires authentication.
 */
export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) {
		return json({ success: false, error: 'auth_required' }, { status: 401 });
	}

	try {
		const body = await request.json();
		const parsed = roomCreateSchema.safeParse(body);

		if (!parsed.success) {
			return json(
				{ success: false, error: 'invalid_payload', details: parsed.error?.flatten().fieldErrors },
				{ status: 400 }
			);
		}

		const { gameType } = parsed.data!;
		const result = await createPrivateRoom(
			locals.pb,
			locals.user.id,
			locals.user.username || locals.user.email,
			gameType
		);

		return json({ success: true, ...result });
	} catch (err) {
		console.error('Room create error:', err);
		return json({ success: false, error: 'create_failed' }, { status: 500 });
	}
};
