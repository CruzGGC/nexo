/**
 * Shared domain types — used across client and server.
 * All types are inferred from Zod validators to maintain a single source of truth.
 */

export type {
	AuthLoginInput,
	AuthRegisterInput,
	UserProfile,
	ProfileUpdateInput,
	PaginationParams,
	ApiErrorResponse,
	GameType,
	Difficulty,
	GameMode,
	LeaderboardPeriod,
	ScoreSubmitInput,
	ScoreRecord,
	LeaderboardQuery,
	MultiplayerGameTypeValidator,
	MatchmakingJoinInput,
	RoomCreateInput,
	RoomJoinInput,
	RoomActionInput
} from '$lib/validators/index.js';

export {
	GAME_TYPES,
	DIFFICULTIES,
	GAME_MODES,
	LEADERBOARD_PERIODS,
	MULTIPLAYER_GAME_TYPES,
	ROOM_STATUSES
} from '$lib/validators/index.js';
