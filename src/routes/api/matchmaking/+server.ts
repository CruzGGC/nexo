import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { matchmakingJoinSchema } from '$lib/validators';
import { joinQueue, leaveQueue, getQueueStatus } from '$lib/multiplayer/matchmaking';

/**
 * POST /api/matchmaking
 * Join the matchmaking queue. Attempts immediate match.
 * Requires authentication.
 */
export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) {
		return json({ success: false, error: 'auth_required' }, { status: 401 });
	}

	try {
		const body = await request.json();
		const parsed = matchmakingJoinSchema.safeParse(body);

		if (!parsed.success) {
			return json(
				{ success: false, error: 'invalid_payload', details: parsed.error?.flatten().fieldErrors },
				{ status: 400 }
			);
		}

		const { gameType } = parsed.data!;
		const result = await joinQueue(
			locals.pb,
			locals.user.id,
			locals.user.username || locals.user.email,
			gameType
		);

		return json({ success: true, ...result });
	} catch (err) {
		console.error('Matchmaking join error:', err);
		return json({ success: false, error: 'matchmaking_failed' }, { status: 500 });
	}
};

/**
 * DELETE /api/matchmaking
 * Leave the matchmaking queue.
 */
export const DELETE: RequestHandler = async ({ locals }) => {
	if (!locals.user) {
		return json({ success: false, error: 'auth_required' }, { status: 401 });
	}

	try {
		const left = await leaveQueue(locals.pb, locals.user.id);
		return json({ success: left });
	} catch (err) {
		console.error('Matchmaking leave error:', err);
		return json({ success: false, error: 'leave_failed' }, { status: 500 });
	}
};

/**
 * GET /api/matchmaking
 * Poll for matchmaking status (queued / matched / none).
 */
export const GET: RequestHandler = async ({ locals }) => {
	if (!locals.user) {
		return json({ success: false, error: 'auth_required' }, { status: 401 });
	}

	try {
		const status = await getQueueStatus(locals.pb, locals.user.id);
		return json({ success: true, ...status });
	} catch (err) {
		console.error('Matchmaking status error:', err);
		return json({ success: false, error: 'status_failed' }, { status: 500 });
	}
};
