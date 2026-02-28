/**
 * Crossword puzzle types — shared across generator, server, and UI.
 */

export type Direction = 'across' | 'down';

/** A single clue/word placement on the grid */
export interface CrosswordEntry {
	/** Unique number label (1, 2, 3...) */
	number: number;
	/** The answer word (uppercase, no accents in grid) */
	word: string;
	/** The display clue text (PT-PT) */
	clue: string;
	/** Direction of the word */
	direction: Direction;
	/** Row index (0-based) */
	row: number;
	/** Column index (0-based) */
	col: number;
}

/** The generated puzzle (server-side, includes answers) */
export interface CrosswordPuzzle {
	/** Unique puzzle identifier */
	id: string;
	/** Grid dimensions */
	width: number;
	height: number;
	/** All placed entries with answers */
	entries: CrosswordEntry[];
	/** The solution grid (null = black cell, letter = filled) */
	grid: (string | null)[][];
	/** Difficulty tier */
	difficulty: 'easy' | 'medium' | 'hard';
	/** Timestamp of generation */
	generatedAt: string;
	/** Seed used for deterministic generation (daily puzzles) */
	seed?: string;
}

/** Client-safe puzzle (no answers in grid, no answer words) */
export interface CrosswordPuzzleClient {
	id: string;
	width: number;
	height: number;
	/** Entries without the answer word */
	entries: CrosswordClueClient[];
	/** Grid structure: true = letter cell, false = black cell */
	cellMap: boolean[][];
	/** Number labels: 0 = no number, N = clue number */
	numberMap: number[][];
	difficulty: 'easy' | 'medium' | 'hard';
	generatedAt: string;
}

/** Client-safe clue (no answer) */
export interface CrosswordClueClient {
	number: number;
	clue: string;
	direction: Direction;
	row: number;
	col: number;
	/** Length of the answer word */
	length: number;
}

/** A cell position */
export interface CellPosition {
	row: number;
	col: number;
}

/** Player's current game state (client-side) */
export interface CrosswordGameState {
	/** The puzzle being played */
	puzzle: CrosswordPuzzleClient;
	/** Player's current input grid (empty string = unfilled) */
	playerGrid: string[][];
	/** Currently selected cell */
	selectedCell: CellPosition | null;
	/** Current input direction */
	currentDirection: Direction;
	/** Currently active clue number */
	activeClueNumber: number | null;
	/** Timer in seconds */
	elapsedSeconds: number;
	/** Whether the game is complete */
	isComplete: boolean;
	/** Whether the game is paused */
	isPaused: boolean;
	/** Hints used (penalty count) */
	hintsUsed: number;
	/** Timestamp when the game started */
	startedAt: string;
}

/** Word entry in the word bank */
export interface WordBankEntry {
	/** The word (uppercase, no diacritics in grid representation) */
	word: string;
	/** The clue in PT-PT */
	clue: string;
	/** Difficulty category */
	difficulty: 'easy' | 'medium' | 'hard';
	/** Optional category for themed puzzles */
	category?: string;
}

/** Generator configuration */
export interface GeneratorConfig {
	/** Target grid width */
	width: number;
	/** Target grid height */
	height: number;
	/** Minimum words to place */
	minWords: number;
	/** Maximum words to attempt */
	maxWords: number;
	/** Difficulty filter */
	difficulty: 'easy' | 'medium' | 'hard';
	/** Deterministic seed (for daily puzzles) */
	seed?: string;
	/** Maximum generation attempts before accepting best result */
	maxAttempts: number;
	/** Minimum intersections required for quality */
	minIntersections: number;
}
