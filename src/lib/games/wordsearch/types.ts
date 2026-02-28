/**
 * Wordsearch puzzle types — shared across generator, server, and UI.
 */

export type WordDirection =
	| 'right'
	| 'down'
	| 'right-down'
	| 'right-up'
	| 'left'
	| 'up'
	| 'left-down'
	| 'left-up';

/** A placed word in the grid */
export interface WordPlacement {
	/** The word (uppercase, no diacritics) */
	word: string;
	/** Display word (may include diacritics for clue display) */
	displayWord: string;
	/** Optional hint/category */
	hint?: string;
	/** Row start (0-based) */
	row: number;
	/** Column start (0-based) */
	col: number;
	/** Direction of placement */
	direction: WordDirection;
	/** Whether this word has been found by the player */
	found?: boolean;
}

/** The generated puzzle (server-side, includes placements) */
export interface WordsearchPuzzle {
	/** Unique puzzle identifier */
	id: string;
	/** Grid dimensions */
	width: number;
	height: number;
	/** The letter grid (uppercase) */
	grid: string[][];
	/** All placed words with positions */
	words: WordPlacement[];
	/** Difficulty tier */
	difficulty: 'easy' | 'medium' | 'hard';
	/** Timestamp of generation */
	generatedAt: string;
	/** Seed for deterministic generation */
	seed?: string;
}

/** Client-safe puzzle (grid + word list, no positions revealed) */
export interface WordsearchPuzzleClient {
	id: string;
	width: number;
	height: number;
	/** The letter grid */
	grid: string[][];
	/** Words to find (without positions) */
	words: WordsearchWordClient[];
	difficulty: 'easy' | 'medium' | 'hard';
	generatedAt: string;
}

/** Client-safe word (no position info) */
export interface WordsearchWordClient {
	word: string;
	displayWord: string;
	hint?: string;
	found: boolean;
}

/** A cell position */
export interface CellPosition {
	row: number;
	col: number;
}

/** Player selection state */
export interface WordsearchSelection {
	/** Starting cell of selection */
	start: CellPosition | null;
	/** Current end cell of selection */
	end: CellPosition | null;
	/** Cells currently highlighted during drag */
	cells: CellPosition[];
}

/** Player's game state */
export interface WordsearchGameState {
	puzzle: WordsearchPuzzleClient;
	/** Set of found word strings */
	foundWords: Set<string>;
	/** Cells that are part of found words (for persistent highlighting) */
	foundCells: Set<string>;
	/** Current selection */
	selection: WordsearchSelection;
	/** Timer in seconds */
	elapsedSeconds: number;
	/** Hints used */
	hintsUsed: number;
	/** Is game complete */
	isComplete: boolean;
	/** Is game paused */
	isPaused: boolean;
	startedAt: string;
}

/** Generator configuration */
export interface WordsearchGeneratorConfig {
	width: number;
	height: number;
	minWords: number;
	maxWords: number;
	difficulty: 'easy' | 'medium' | 'hard';
	seed?: string;
	maxAttempts: number;
	/** Allow diagonal words */
	allowDiagonal: boolean;
	/** Allow reversed words */
	allowReversed: boolean;
}
