// ─── Multiplayer module barrel export ──────────────────────────
//
// Re-exports types, constants, utilities, and services from the
// multiplayer domain.
//

export {
	// Constants
	ROOM_STATUSES,
	MATCHMAKING_STATUSES,
	MULTIPLAYER_GAME_TYPES,

	// Types
	type RoomStatus,
	type MatchmakingStatus,
	type MultiplayerGameType,
	type RoomPlayer,
	type Room,
	type RoomClient,
	type MatchmakingEntry,
	type PlayerAction,
	type ActionResult,
	type GameRules,

	// Utilities
	generateRoomCode
} from './types';

// Matchmaking service
export {
	joinQueue,
	leaveQueue,
	getQueueStatus,
	createPrivateRoom,
	joinRoomByCode,
	getRoomState
} from './matchmaking';

// Room engine
export {
	registerGameRules,
	getGameRules,
	setPlayerReady,
	processAction,
	abandonRoom
} from './room-engine';

// Realtime helpers (client-side only)
export {
	subscribeToRoom,
	subscribeToMatchmaking,
	type RoomUpdateCallback,
	type RoomErrorCallback
} from './realtime';

// Game registration (server-side)
export { registerAllGameRules } from './register-games';
