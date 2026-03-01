// ─── Matchmaking Service ──────────────────────────────────────
//
// Server-side matchmaking logic. Handles queue management and
// player pairing. Uses PocketBase `matchmaking_queue` and `rooms`
// collections.
//

import type { default as PocketBase } from 'pocketbase';
import { generateRoomCode } from './types';
import type { MultiplayerGameType, RoomPlayer } from './types';
import { getGameRules } from './room-engine';

const queueLocks = new Map<string, Promise<unknown>>();
const roomCodeLocks = new Map<string, Promise<unknown>>();

interface PocketBaseErrorLike {
	status?: number;
	response?: {
		code?: number;
		message?: string;
	};
	message?: string;
}

function isNotFoundError(error: unknown): boolean {
	const pbError = error as PocketBaseErrorLike;
	return pbError?.status === 404 || pbError?.response?.code === 404;
}

function logMatchmakingError(event: string, details: Record<string, unknown>, error: unknown): void {
	const pbError = error as PocketBaseErrorLike;
	console.error(
		JSON.stringify({
			level: 'error',
			event,
			...details,
			error: pbError?.response?.message || pbError?.message || 'unknown_error',
			ts: new Date().toISOString()
		})
	);
}

async function withLock<T>(map: Map<string, Promise<unknown>>, key: string, fn: () => Promise<T>): Promise<T> {
	const previous = map.get(key) ?? Promise.resolve();
	let release: () => void;
	const current = new Promise<void>((resolve) => {
		release = resolve;
	});
	const queued = previous.then(() => current);
	map.set(key, queued);

	await previous;
	try {
		return await fn();
	} finally {
		release!();
		if (map.get(key) === queued) {
			map.delete(key);
		}
	}
}

/**
 * Add a player to the matchmaking queue.
 * Immediately attempts to find a match.
 * Returns { queued: true } if waiting, or { matched: true, roomId } if paired.
 */
export async function joinQueue(
	pb: PocketBase,
	userId: string,
	username: string,
	gameType: MultiplayerGameType
): Promise<{ queued: boolean; matched: boolean; roomId?: string; entryId?: string }> {
	return withLock(queueLocks, `join:${userId}`, async () => {
		let existing: { id: string } | null = null;

		try {
			existing = await pb.collection('matchmaking_queue').getFirstListItem(
				`userId = "${userId}" && status = "queued"`
			);
		} catch (error) {
			if (!isNotFoundError(error)) {
				logMatchmakingError('matchmaking_join_lookup_failed', { userId, gameType }, error);
				throw error;
			}
		}

		if (existing) {
			const matchResult = await tryMatch(pb, existing.id, userId, username, gameType);
			if (matchResult) {
				return { queued: false, matched: true, roomId: matchResult };
			}
			return { queued: true, matched: false, entryId: existing.id };
		}

		const entry = await pb.collection('matchmaking_queue').create({
			userId,
			username,
			gameType,
			status: 'queued',
			roomId: ''
		});

		const matchResult = await tryMatch(pb, entry.id, userId, username, gameType);
		if (matchResult) {
			return { queued: false, matched: true, roomId: matchResult };
		}

		return { queued: true, matched: false, entryId: entry.id };
	});
}

/**
 * Try to match this player with another queued player for the same game type.
 * If a match is found, creates a room and updates both queue entries.
 */
async function tryMatch(
	pb: PocketBase,
	entryId: string,
	userId: string,
	username: string,
	gameType: MultiplayerGameType
): Promise<string | null> {
	return withLock(queueLocks, `match:${gameType}`, async () => {
		let opponent: Record<string, unknown> | null = null;

		try {
			opponent = await pb.collection('matchmaking_queue').getFirstListItem(
				`gameType = "${gameType}" && status = "queued" && userId != "${userId}"`,
				{ sort: '+created' }
			);
		} catch (error) {
			if (isNotFoundError(error)) {
				return null;
			}
			logMatchmakingError('matchmaking_opponent_lookup_failed', { userId, gameType, entryId }, error);
			throw error;
		}

		if (!opponent) return null;

		const roomCode = generateRoomCode();
		const players: RoomPlayer[] = [
			{ userId: opponent['userId'] as string, username: opponent['username'] as string, ready: true },
			{ userId, username, ready: true }
		];

		const room = await pb.collection('rooms').create({
			gameType,
			status: 'waiting',
			players: JSON.stringify(players),
			turn: '',
			boardState: JSON.stringify(null),
			round: 0,
			winner: '',
			isDraw: false,
			version: 0,
			roomCode,
			isPrivate: false
		});

		await Promise.all([
			pb.collection('matchmaking_queue').update(opponent.id as string, {
				status: 'matched',
				roomId: room.id
			}),
			pb.collection('matchmaking_queue').update(entryId, {
				status: 'matched',
				roomId: room.id
			})
		]);

		return room.id;
	});
}

/**
 * Remove a player from the matchmaking queue.
 */
export async function leaveQueue(
	pb: PocketBase,
	userId: string
): Promise<boolean> {
	try {
		const entry = await pb.collection('matchmaking_queue').getFirstListItem(
			`userId = "${userId}" && status = "queued"`
		);
		await pb.collection('matchmaking_queue').update(entry.id, {
			status: 'cancelled'
		});
		return true;
	} catch (error) {
		if (isNotFoundError(error)) {
			return true;
		}
		logMatchmakingError('matchmaking_leave_failed', { userId }, error);
		return false;
	}
}

/**
 * Check matchmaking status for a player.
 * Returns current queue status and roomId if matched.
 */
export async function getQueueStatus(
	pb: PocketBase,
	userId: string
): Promise<{ status: 'queued' | 'matched' | 'none'; roomId?: string; entryId?: string }> {
	try {
		const entry = await pb.collection('matchmaking_queue').getFirstListItem(
			`userId = "${userId}" && (status = "queued" || status = "matched")`,
			{ sort: '-created' }
		);

		return {
			status: entry['status'] as 'queued' | 'matched',
			roomId: entry['roomId'] as string || undefined,
			entryId: entry.id
		};
	} catch (error) {
		if (!isNotFoundError(error)) {
			logMatchmakingError('matchmaking_status_failed', { userId }, error);
			throw error;
		}
		return { status: 'none' };
	}
}

/**
 * Create a private room (no matchmaking queue).
 * Returns the room ID and code.
 */
export async function createPrivateRoom(
	pb: PocketBase,
	userId: string,
	username: string,
	gameType: MultiplayerGameType
): Promise<{ roomId: string; roomCode: string }> {
	const roomCode = generateRoomCode();
	const players: RoomPlayer[] = [
		{ userId, username, ready: false }
	];

	const room = await pb.collection('rooms').create({
		gameType,
		status: 'waiting',
		players: JSON.stringify(players),
		turn: '',
		boardState: JSON.stringify(null),
		round: 0,
		winner: '',
		isDraw: false,
		version: 0,
		roomCode,
		isPrivate: true
	});

	return { roomId: room.id, roomCode };
}

/**
 * Join a room by code. Used for private rooms.
 */
export async function joinRoomByCode(
	pb: PocketBase,
	userId: string,
	username: string,
	roomCode: string
): Promise<{ success: boolean; roomId?: string; error?: string }> {
	return withLock(roomCodeLocks, `room:${roomCode}`, async () => {
		try {
			const room = await pb.collection('rooms').getFirstListItem(
				`roomCode = "${roomCode}" && status = "waiting"`
			);

			const players: RoomPlayer[] = typeof room['players'] === 'string'
				? JSON.parse(room['players'] as string)
				: room['players'] as RoomPlayer[];

			if (players.some(p => p.userId === userId)) {
				return { success: true, roomId: room.id };
			}

			if (players.length >= 2) {
				return { success: false, error: 'room_full' };
			}

			players.push({ userId, username, ready: false });

			await pb.collection('rooms').update(room.id, {
				players: JSON.stringify(players),
				version: (room['version'] as number) + 1
			});

			return { success: true, roomId: room.id };
		} catch (error) {
			if (isNotFoundError(error)) {
				return { success: false, error: 'room_not_found' };
			}
			logMatchmakingError('room_join_failed', { userId, roomCode }, error);
			return { success: false, error: 'join_failed' };
		}
	});
}

/**
 * Get room state. Parses JSON fields.
 */
export async function getRoomState(
	pb: PocketBase,
	roomId: string,
	viewerUserId?: string
): Promise<{
	id: string;
	gameType: MultiplayerGameType;
	status: string;
	players: RoomPlayer[];
	turn: string;
	boardState: unknown;
	round: number;
	winner: string;
	isDraw: boolean;
	version: number;
	roomCode: string;
	isPrivate: boolean;
} | null> {
	try {
		const room = await pb.collection('rooms').getOne(roomId);

		const players: RoomPlayer[] = typeof room['players'] === 'string'
			? JSON.parse(room['players'] as string)
			: room['players'] as RoomPlayer[];

		const boardState = typeof room['boardState'] === 'string'
			? JSON.parse(room['boardState'] as string)
			: room['boardState'];

		let clientBoardState = boardState;
		if (viewerUserId) {
			const rules = getGameRules(room['gameType'] as string);
			if (rules?.sanitiseStateForPlayer) {
				clientBoardState = rules.sanitiseStateForPlayer(boardState, viewerUserId);
			}
		}

		return {
			id: room.id,
			gameType: room['gameType'] as MultiplayerGameType,
			status: room['status'] as string,
			players,
			turn: room['turn'] as string,
			boardState: clientBoardState,
			round: room['round'] as number,
			winner: room['winner'] as string,
			isDraw: room['isDraw'] as boolean,
			version: room['version'] as number,
			roomCode: room['roomCode'] as string,
			isPrivate: room['isPrivate'] as boolean
		};
	} catch (error) {
		if (!isNotFoundError(error)) {
			logMatchmakingError('room_state_failed', { roomId, viewerUserId: viewerUserId ?? null }, error);
		}
		return null;
	}
}
