// ─── Multiplayer Domain Types ──────────────────────────────────
//
// Shared types for the matchmaking service and room engine.
// Game-specific logic (Tic-Tac-Toe, Battleship) plugs in via the
// GameRules interface — defined here, implemented per-game in Phase E.
//

// ─── Constants ────────────────────────────────────────────────

export const ROOM_STATUSES = ['waiting', 'playing', 'finished', 'abandoned'] as const;
export type RoomStatus = (typeof ROOM_STATUSES)[number];

export const MATCHMAKING_STATUSES = ['queued', 'matched', 'cancelled', 'expired'] as const;
export type MatchmakingStatus = (typeof MATCHMAKING_STATUSES)[number];

/** Game types that support multiplayer */
export const MULTIPLAYER_GAME_TYPES = ['tictactoe', 'battleship'] as const;
export type MultiplayerGameType = (typeof MULTIPLAYER_GAME_TYPES)[number];

// ─── Room ─────────────────────────────────────────────────────

export interface RoomPlayer {
	userId: string;
	username: string;
	ready: boolean;
}

/**
 * Canonical room state — stored in PocketBase `rooms` collection.
 * The `boardState` field is a JSON blob whose shape depends on gameType.
 * The `version` field prevents stale-write conflicts (optimistic concurrency).
 */
export interface Room {
	id: string;
	gameType: MultiplayerGameType;
	status: RoomStatus;
	players: RoomPlayer[];
	turn: string; // userId of whose turn it is (empty if not applicable)
	boardState: unknown; // game-specific JSON — opaque at this layer
	round: number;
	winner: string | null; // userId of winner, null if draw or ongoing
	isDraw: boolean;
	version: number;
	roomCode: string; // 6-char alphanumeric code for private rooms
	isPrivate: boolean;
	createdAt: string;
	updatedAt: string;
}

/** Client-safe room view — same as Room but with sanitised boardState */
export interface RoomClient {
	id: string;
	gameType: MultiplayerGameType;
	status: RoomStatus;
	players: RoomPlayer[];
	turn: string;
	boardState: unknown;
	round: number;
	winner: string | null;
	isDraw: boolean;
	version: number;
	roomCode: string;
	isPrivate: boolean;
}

// ─── Matchmaking ──────────────────────────────────────────────

export interface MatchmakingEntry {
	id: string;
	userId: string;
	username: string;
	gameType: MultiplayerGameType;
	status: MatchmakingStatus;
	roomId: string | null; // set when matched
	createdAt: string;
}

// ─── Actions ──────────────────────────────────────────────────

/**
 * A player action submitted to the room engine.
 * `actionType` and `actionData` are game-specific.
 * `version` is the client's last-known room version (anti-desync).
 */
export interface PlayerAction {
	actionType: string;
	actionData: Record<string, unknown>;
	version: number;
}

/** Result of processing an action through the room engine */
export interface ActionResult {
	success: boolean;
	error?: string;
	room?: RoomClient;
}

// ─── Game Rules Interface ─────────────────────────────────────
//
// Each multiplayer game implements this interface. The room engine
// calls these methods generically — the game module owns the logic.
//

export interface GameRules<TState = unknown, TAction = unknown> {
	/** Identifier matching MultiplayerGameType */
	gameType: MultiplayerGameType;

	/** How many players this game requires */
	minPlayers: number;
	maxPlayers: number;

	/** Create the initial board/game state when a room starts */
	createInitialState(playerIds: string[]): TState;

	/**
	 * Validate whether an action is legal given current state.
	 * Must NOT mutate state.
	 */
	validateAction(
		state: TState,
		playerId: string,
		action: TAction
	): { valid: boolean; error?: string };

	/**
	 * Apply a validated action and return the new state.
	 * Must be pure — no side effects.
	 */
	applyAction(state: TState, playerId: string, action: TAction): TState;

	/**
	 * Check if the game is over. Returns the result.
	 * - finished: false → game continues
	 * - finished: true, winner set → someone won
	 * - finished: true, winner null, isDraw true → draw
	 */
	checkWinner(state: TState): {
		finished: boolean;
		winner?: string | null;
		isDraw?: boolean;
	};

	/**
	 * Determine whose turn is next after an action.
	 * For simultaneous games (like Battleship placement), may return the same player.
	 */
	getNextTurn(state: TState, currentPlayerId: string, playerIds: string[]): string;

	/**
	 * Sanitise state for a specific player (e.g. hide opponent's ships in Battleship).
	 * If null, the full state is sent to all players.
	 */
	sanitiseStateForPlayer?(state: TState, playerId: string): unknown;
}

// ─── Room Code ────────────────────────────────────────────────

/** Characters used in room codes (no ambiguous chars: 0/O, 1/I/L) */
const ROOM_CODE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const ROOM_CODE_LENGTH = 6;

/** Generate a random room code */
export function generateRoomCode(): string {
	let code = '';
	for (let i = 0; i < ROOM_CODE_LENGTH; i++) {
		code += ROOM_CODE_CHARS[Math.floor(Math.random() * ROOM_CODE_CHARS.length)];
	}
	return code;
}
