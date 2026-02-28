// ─── PocketBase Realtime Helpers ──────────────────────────────
//
// Client-side helpers for subscribing to PocketBase realtime events.
// Used to get live room updates without polling.
//

import { pb } from '$lib/pocketbase';
import type { RoomClient, RoomPlayer, MultiplayerGameType } from './types';

/** Callback for room state changes */
export type RoomUpdateCallback = (room: RoomClient) => void;

/** Callback for errors */
export type RoomErrorCallback = (error: Error) => void;

/**
 * Subscribe to realtime updates for a specific room.
 * Returns an unsubscribe function.
 *
 * Uses PocketBase's built-in realtime (SSE under the hood).
 * The `rooms` collection must have realtime enabled in PocketBase admin.
 */
export function subscribeToRoom(
	roomId: string,
	onUpdate: RoomUpdateCallback,
	onError?: RoomErrorCallback
): () => void {
	let unsubscribed = false;

	pb.collection('rooms').subscribe(roomId, (event) => {
		if (unsubscribed) return;

		try {
			const record = event.record;
			const room = parseRealtimeRecord(record);
			onUpdate(room);
		} catch (err) {
			onError?.(err instanceof Error ? err : new Error(String(err)));
		}
	}).catch((err) => {
		if (!unsubscribed) {
			onError?.(err instanceof Error ? err : new Error(String(err)));
		}
	});

	return () => {
		unsubscribed = true;
		pb.collection('rooms').unsubscribe(roomId).catch(() => {
			// Ignore unsubscribe errors
		});
	};
}

/**
 * Subscribe to all rooms for matchmaking status updates.
 * Used when waiting in a matchmaking queue to detect room creation.
 */
export function subscribeToMatchmaking(
	userId: string,
	onMatched: (roomId: string) => void,
	onError?: RoomErrorCallback
): () => void {
	let unsubscribed = false;

	pb.collection('matchmaking_queue').subscribe('*', (event) => {
		if (unsubscribed) return;

		try {
			const record = event.record;
			if (
				record['userId'] === userId &&
				record['status'] === 'matched' &&
				record['roomId']
			) {
				onMatched(record['roomId'] as string);
			}
		} catch (err) {
			onError?.(err instanceof Error ? err : new Error(String(err)));
		}
	}).catch((err) => {
		if (!unsubscribed) {
			onError?.(err instanceof Error ? err : new Error(String(err)));
		}
	});

	return () => {
		unsubscribed = true;
		pb.collection('matchmaking_queue').unsubscribe('*').catch(() => {
			// Ignore unsubscribe errors
		});
	};
}

// ─── Helpers ──────────────────────────────────────────────────

/** Parse a PocketBase realtime record into a RoomClient */
function parseRealtimeRecord(record: Record<string, unknown>): RoomClient {
	const players: RoomPlayer[] = typeof record['players'] === 'string'
		? JSON.parse(record['players'] as string)
		: (record['players'] as RoomPlayer[]) || [];

	const boardState = typeof record['boardState'] === 'string'
		? JSON.parse(record['boardState'] as string)
		: record['boardState'];

	return {
		id: record['id'] as string,
		gameType: record['gameType'] as MultiplayerGameType,
		status: record['status'] as RoomClient['status'],
		players,
		turn: (record['turn'] as string) || '',
		boardState,
		round: (record['round'] as number) || 0,
		winner: (record['winner'] as string) || null,
		isDraw: (record['isDraw'] as boolean) || false,
		version: (record['version'] as number) || 0,
		roomCode: (record['roomCode'] as string) || '',
		isPrivate: (record['isPrivate'] as boolean) || false
	};
}
