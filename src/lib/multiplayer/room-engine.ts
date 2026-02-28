// ─── Room Engine ──────────────────────────────────────────────
//
// Server-authoritative room state machine. Processes player actions
// through a versioned pipeline that prevents stale writes and
// enforces turn order.
//
// The engine is game-agnostic — it delegates validation and state
// mutation to a GameRules implementation registered per game type.
//

import type { default as PocketBase } from 'pocketbase';
import type {
	GameRules,
	MultiplayerGameType,
	RoomPlayer,
	ActionResult,
	RoomClient
} from './types';

// ─── In-process room locks (single app instance) ─────────────

const roomLocks = new Map<string, Promise<unknown>>();

async function withRoomLock<T>(roomId: string, fn: () => Promise<T>): Promise<T> {
	const previous = roomLocks.get(roomId) ?? Promise.resolve();
	let release: () => void;
	const current = new Promise<void>((resolve) => {
		release = resolve;
	});
	const queued = previous.then(() => current);
	roomLocks.set(roomId, queued);

	await previous;
	try {
		return await fn();
	} finally {
		release!();
		if (roomLocks.get(roomId) === queued) {
			roomLocks.delete(roomId);
		}
	}
}

// ─── Game Rules Registry ──────────────────────────────────────

const gameRulesRegistry = new Map<string, GameRules>();

/**
 * Register a GameRules implementation for a game type.
 * Called once per game module at startup (Phase E).
 */
export function registerGameRules(rules: GameRules): void {
	gameRulesRegistry.set(rules.gameType, rules);
}

/**
 * Get the registered GameRules for a game type.
 */
export function getGameRules(gameType: string): GameRules | undefined {
	return gameRulesRegistry.get(gameType);
}

// ─── Room Lifecycle ───────────────────────────────────────────

/**
 * Mark a player as ready. When all players are ready, starts the game.
 */
export async function setPlayerReady(
	pb: PocketBase,
	roomId: string,
	userId: string,
	ready: boolean
): Promise<ActionResult> {
	return withRoomLock(roomId, async () => {
	try {
		const room = await pb.collection('rooms').getOne(roomId);

		const players: RoomPlayer[] = typeof room['players'] === 'string'
			? JSON.parse(room['players'] as string)
			: room['players'] as RoomPlayer[];

		const playerIndex = players.findIndex(p => p.userId === userId);
		if (playerIndex === -1) {
			return { success: false, error: 'not_participant' };
		}

		players[playerIndex].ready = ready;

		const updateData: Record<string, unknown> = {
			players: JSON.stringify(players),
			version: (room['version'] as number) + 1
		};

		// Check if all players are ready and we have enough players
		const gameType = room['gameType'] as string;
		const rules = getGameRules(gameType);
		const minPlayers = rules?.minPlayers ?? 2;

		if (players.length >= minPlayers && players.every(p => p.ready)) {
			// Start the game
			const playerIds = players.map(p => p.userId);
			const initialState = rules?.createInitialState(playerIds) ?? null;

			// First player goes first (can be overridden by game rules)
			const firstTurn = playerIds[0];

			updateData.status = 'playing';
			updateData.boardState = JSON.stringify(initialState);
			updateData.turn = firstTurn;
			updateData.round = 1;
		}

		await pb.collection('rooms').update(roomId, updateData);

		// Return updated room
		const updated = await pb.collection('rooms').getOne(roomId);
		return {
			success: true,
			room: parseRoomToClient(updated, userId)
		};
	} catch (err) {
		console.error('setPlayerReady error:', err);
		return { success: false, error: 'update_failed' };
	}
	});
}

/**
 * Process a player action through the versioned pipeline.
 *
 * 1. Validate version (reject stale)
 * 2. Validate turn (reject out-of-turn)
 * 3. Validate action legality (delegate to GameRules)
 * 4. Apply action (delegate to GameRules)
 * 5. Check winner
 * 6. Update room atomically
 * 7. Return new state
 */
export async function processAction(
	pb: PocketBase,
	roomId: string,
	userId: string,
	actionType: string,
	actionData: Record<string, unknown>,
	clientVersion: number
): Promise<ActionResult> {
	return withRoomLock(roomId, async () => {
	try {
		const room = await pb.collection('rooms').getOne(roomId);
		const roomVersion = room['version'] as number;
		const roomStatus = room['status'] as string;
		const gameType = room['gameType'] as string;

		// ── Gate: room must be playing ────────────────────
		if (roomStatus !== 'playing') {
			return { success: false, error: 'room_not_playing' };
		}

		// ── Gate: version check (anti-desync) ────────────
		if (clientVersion !== roomVersion) {
			return {
				success: false,
				error: 'version_mismatch'
			};
		}

		// ── Gate: participant check ──────────────────────
		const players: RoomPlayer[] = typeof room['players'] === 'string'
			? JSON.parse(room['players'] as string)
			: room['players'] as RoomPlayer[];

		if (!players.some(p => p.userId === userId)) {
			return { success: false, error: 'not_participant' };
		}

		// ── Gate: turn check ─────────────────────────────
		const currentTurn = room['turn'] as string;
		if (currentTurn && currentTurn !== userId) {
			return { success: false, error: 'not_your_turn' };
		}

		// ── Get game rules ───────────────────────────────
		const rules = getGameRules(gameType);
		if (!rules) {
			return { success: false, error: 'unknown_game_type' };
		}

		// ── Parse current state ──────────────────────────
		const boardState = typeof room['boardState'] === 'string'
			? JSON.parse(room['boardState'] as string)
			: room['boardState'];

		// ── Validate action ──────────────────────────────
		const validation = rules.validateAction(boardState, userId, { type: actionType, ...actionData });
		if (!validation.valid) {
			return { success: false, error: validation.error || 'invalid_action' };
		}

		// ── Apply action ─────────────────────────────────
		const newState = rules.applyAction(boardState, userId, { type: actionType, ...actionData });

		// ── Check winner ─────────────────────────────────
		const winCheck = rules.checkWinner(newState);

		// ── Build update ─────────────────────────────────
		const playerIds = players.map(p => p.userId);
		const nextTurn = winCheck.finished
			? ''
			: rules.getNextTurn(newState, userId, playerIds);

		const updateData: Record<string, unknown> = {
			boardState: JSON.stringify(newState),
			turn: nextTurn,
			version: roomVersion + 1
		};

		if (winCheck.finished) {
			updateData.status = 'finished';
			updateData.winner = winCheck.winner || '';
			updateData.isDraw = winCheck.isDraw || false;
		}

		// ── Atomic update ────────────────────────────────
		await pb.collection('rooms').update(roomId, updateData);

		// ── Return new state ─────────────────────────────
		const updated = await pb.collection('rooms').getOne(roomId);
		return {
			success: true,
			room: parseRoomToClient(updated, userId)
		};
	} catch (err) {
		console.error('processAction error:', err);
		return { success: false, error: 'action_failed' };
	}
	});
}

/**
 * Abandon a room. Called when a player disconnects or leaves mid-game.
 * If the game is still playing, the other player wins by forfeit.
 */
export async function abandonRoom(
	pb: PocketBase,
	roomId: string,
	userId: string
): Promise<ActionResult> {
	return withRoomLock(roomId, async () => {
	try {
		const room = await pb.collection('rooms').getOne(roomId);
		const status = room['status'] as string;

		if (status === 'finished' || status === 'abandoned') {
			return { success: true };
		}

		const players: RoomPlayer[] = typeof room['players'] === 'string'
			? JSON.parse(room['players'] as string)
			: room['players'] as RoomPlayer[];

		const updateData: Record<string, unknown> = {
			status: 'abandoned',
			version: (room['version'] as number) + 1
		};

		// If game was in progress, award win to the other player
		if (status === 'playing') {
			const otherPlayer = players.find(p => p.userId !== userId);
			if (otherPlayer) {
				updateData.winner = otherPlayer.userId;
				updateData.status = 'finished';
			}
		}

		await pb.collection('rooms').update(roomId, updateData);

		const updated = await pb.collection('rooms').getOne(roomId);
		return {
			success: true,
			room: parseRoomToClient(updated, userId)
		};
	} catch (err) {
		console.error('abandonRoom error:', err);
		return { success: false, error: 'abandon_failed' };
	}
	});
}

// ─── Helpers ──────────────────────────────────────────────────

/** Parse a PocketBase room record into a client-safe RoomClient */
function parseRoomToClient(record: Record<string, unknown>, viewerUserId?: string): RoomClient {
	const players: RoomPlayer[] = typeof record['players'] === 'string'
		? JSON.parse(record['players'] as string)
		: record['players'] as RoomPlayer[];

	const boardState = typeof record['boardState'] === 'string'
		? JSON.parse(record['boardState'] as string)
		: record['boardState'];

	let clientBoardState = boardState;
	if (viewerUserId) {
		const rules = getGameRules(record['gameType'] as string);
		if (rules?.sanitiseStateForPlayer) {
			clientBoardState = rules.sanitiseStateForPlayer(boardState, viewerUserId);
		}
	}

	return {
		id: record['id'] as string,
		gameType: record['gameType'] as MultiplayerGameType,
		status: record['status'] as RoomClient['status'],
		players,
		turn: record['turn'] as string,
		boardState: clientBoardState,
		round: record['round'] as number,
		winner: (record['winner'] as string) || null,
		isDraw: (record['isDraw'] as boolean) || false,
		version: record['version'] as number,
		roomCode: record['roomCode'] as string,
		isPrivate: (record['isPrivate'] as boolean) || false
	};
}
