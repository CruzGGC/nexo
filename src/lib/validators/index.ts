/**
 * Shared validators — Zod schemas used at every boundary (client forms, server endpoints, hooks).
 * Types are inferred from schemas: single source of truth.
 */
import * as z from 'zod';

// ─── Auth ──────────────────────────────────────────────

export const authLoginSchema = z.object({
	email: z.email('Email inválido'),
	password: z.string().min(8, 'A palavra-passe deve ter pelo menos 8 caracteres')
});

export const authRegisterSchema = z.object({
	username: z
		.string()
		.min(3, 'O nome de utilizador deve ter pelo menos 3 caracteres')
		.max(24, 'O nome de utilizador não pode exceder 24 caracteres')
		.regex(
			/^[a-zA-Z0-9_-]+$/,
			'O nome de utilizador só pode conter letras, números, _ e -'
		),
	email: z.email('Email inválido'),
	password: z.string().min(8, 'A palavra-passe deve ter pelo menos 8 caracteres'),
	passwordConfirm: z.string()
}).refine((data) => data.password === data.passwordConfirm, {
	message: 'As palavras-passe não coincidem',
	path: ['passwordConfirm']
});

// ─── Pagination ────────────────────────────────────────

export const paginationSchema = z.object({
	page: z.number().int().min(1).default(1),
	perPage: z.number().int().min(1).max(100).default(20)
});

// ─── API Error ─────────────────────────────────────────

export const apiErrorSchema = z.object({
	code: z.number().int(),
	message: z.string(),
	details: z.record(z.string(), z.unknown()).optional()
});

// ─── Inferred types ────────────────────────────────────

export type AuthLoginInput = z.infer<typeof authLoginSchema>;
export type AuthRegisterInput = z.infer<typeof authRegisterSchema>;
export type PaginationParams = z.infer<typeof paginationSchema>;
export type ApiErrorResponse = z.infer<typeof apiErrorSchema>;

// ─── User profile (read-only shape from PocketBase) ───

export const userProfileSchema = z.object({
	id: z.string(),
	username: z.string(),
	email: z.string(),
	avatar: z.string().optional(),
	created: z.string(),
	updated: z.string()
});

export type UserProfile = z.infer<typeof userProfileSchema>;

// ─── Profile update ────────────────────────────────────

export const profileUpdateSchema = z.object({
	username: z
		.string()
		.min(3, 'O nome de utilizador deve ter pelo menos 3 caracteres')
		.max(24, 'O nome de utilizador não pode exceder 24 caracteres')
		.regex(
			/^[a-zA-Z0-9_-]+$/,
			'O nome de utilizador só pode conter letras, números, _ e -'
		),
	name: z.string().max(64, 'O nome não pode exceder 64 caracteres').optional()
});

export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;

// ─── Scores ────────────────────────────────────────────

export const GAME_TYPES = ['crossword', 'wordsearch', 'tictactoe', 'battleship'] as const;
export const DIFFICULTIES = ['easy', 'medium', 'hard'] as const;
export const GAME_MODES = ['daily', 'random'] as const;
export const LEADERBOARD_PERIODS = ['today', 'week', 'month', 'all'] as const;

export type GameType = (typeof GAME_TYPES)[number];
export type Difficulty = (typeof DIFFICULTIES)[number];
export type GameMode = (typeof GAME_MODES)[number];
export type LeaderboardPeriod = (typeof LEADERBOARD_PERIODS)[number];

export const scoreSubmitSchema = z.object({
	gameType: z.enum(GAME_TYPES),
	difficulty: z.enum(DIFFICULTIES),
	mode: z.enum(GAME_MODES),
	scoreProof: z.string().min(20),
	score: z.number().int().min(0).max(10000),
	timeSeconds: z.number().int().min(0),
	hintsUsed: z.number().int().min(0),
	puzzleId: z.string().min(1).max(64),
	/** Date string for daily puzzles (YYYY-MM-DD), empty for random */
	puzzleDate: z.string().max(10).optional()
});

export type ScoreSubmitInput = z.infer<typeof scoreSubmitSchema>;

/** Shape of a score record as returned from PocketBase */
export const scoreRecordSchema = z.object({
	id: z.string(),
	user: z.string(),
	gameType: z.string(),
	difficulty: z.string(),
	mode: z.string(),
	score: z.number(),
	timeSeconds: z.number(),
	hintsUsed: z.number(),
	puzzleId: z.string(),
	puzzleDate: z.string().optional(),
	created: z.string(),
	/** Expanded user data (from PB expand) */
	expand: z.object({
		user: z.object({
			id: z.string(),
			username: z.string(),
			avatar: z.string().optional()
		}).optional()
	}).optional()
});

export type ScoreRecord = z.infer<typeof scoreRecordSchema>;

export const leaderboardQuerySchema = z.object({
	gameType: z.enum(GAME_TYPES),
	difficulty: z.enum(DIFFICULTIES).optional(),
	mode: z.enum(GAME_MODES).optional(),
	period: z.enum(LEADERBOARD_PERIODS).default('all'),
	page: z.number().int().min(1).default(1),
	perPage: z.number().int().min(1).max(100).default(20)
});

export type LeaderboardQuery = z.infer<typeof leaderboardQuerySchema>;

// ─── Multiplayer ───────────────────────────────────────

export const MULTIPLAYER_GAME_TYPES = ['tictactoe', 'battleship'] as const;
export const ROOM_STATUSES = ['waiting', 'playing', 'finished', 'abandoned'] as const;

export type MultiplayerGameTypeValidator = (typeof MULTIPLAYER_GAME_TYPES)[number];

/** POST /api/matchmaking/join */
export const matchmakingJoinSchema = z.object({
	gameType: z.enum(MULTIPLAYER_GAME_TYPES)
});

export type MatchmakingJoinInput = z.infer<typeof matchmakingJoinSchema>;

/** POST /api/rooms (create private room) */
export const roomCreateSchema = z.object({
	gameType: z.enum(MULTIPLAYER_GAME_TYPES)
});

export type RoomCreateInput = z.infer<typeof roomCreateSchema>;

/** POST /api/rooms/join */
export const roomJoinSchema = z.object({
	roomCode: z
		.string()
		.length(6, 'O código da sala deve ter 6 caracteres')
		.regex(/^[A-Z0-9]+$/, 'Código de sala inválido')
});

export type RoomJoinInput = z.infer<typeof roomJoinSchema>;

/** POST /api/rooms/[id]/action */
export const roomActionSchema = z.object({
	actionType: z.string().min(1).max(32),
	actionData: z.record(z.string(), z.unknown()).default({}),
	version: z.number().int().min(0)
});

export type RoomActionInput = z.infer<typeof roomActionSchema>;
