/**
 * Wordsearch grid generator.
 *
 * Algorithm:
 * 1. Filter word bank by difficulty
 * 2. Shuffle words with seeded PRNG
 * 3. Attempt to place each word in the grid (try random positions/directions)
 * 4. Fill remaining cells with random uppercase letters
 * 5. For daily puzzles, use seeded PRNG for deterministic output
 */

import type {
	WordDirection,
	WordPlacement,
	WordsearchPuzzle,
	WordsearchPuzzleClient,
	WordsearchWordClient,
	WordsearchGeneratorConfig
} from './types';
import { wordsearchBank, type WordsearchEntry } from './words';

// ─── Seeded PRNG (Mulberry32) ──────────────────────────

function mulberry32(seed: number): () => number {
	return () => {
		seed |= 0;
		seed = (seed + 0x6d2b79f5) | 0;
		let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

function seedFromString(str: string): number {
	let hash = 0;
	for (let i = 0; i < str.length; i++) {
		const ch = str.charCodeAt(i);
		hash = ((hash << 5) - hash + ch) | 0;
	}
	return hash;
}

// ─── Shuffle ───────────────────────────────────────────

function shuffle<T>(arr: T[], random: () => number): T[] {
	const result = [...arr];
	for (let i = result.length - 1; i > 0; i--) {
		const j = Math.floor(random() * (i + 1));
		[result[i], result[j]] = [result[j], result[i]];
	}
	return result;
}

// ─── Direction vectors ──────────────────────────────────

const DIRECTION_DELTAS: Record<WordDirection, { dr: number; dc: number }> = {
	right: { dr: 0, dc: 1 },
	down: { dr: 1, dc: 0 },
	'right-down': { dr: 1, dc: 1 },
	'right-up': { dr: -1, dc: 1 },
	left: { dr: 0, dc: -1 },
	up: { dr: -1, dc: 0 },
	'left-down': { dr: 1, dc: -1 },
	'left-up': { dr: -1, dc: -1 }
};

/** Get allowed directions based on config */
function getAllowedDirections(config: WordsearchGeneratorConfig): WordDirection[] {
	const dirs: WordDirection[] = ['right', 'down'];

	if (config.allowDiagonal) {
		dirs.push('right-down', 'right-up');
	}

	if (config.allowReversed) {
		dirs.push('left', 'up');
		if (config.allowDiagonal) {
			dirs.push('left-down', 'left-up');
		}
	}

	return dirs;
}

// ─── Grid helpers ───────────────────────────────────────

function createEmptyGrid(width: number, height: number): (string | null)[][] {
	return Array.from({ length: height }, () => Array(width).fill(null));
}

function canPlace(
	grid: (string | null)[][],
	word: string,
	row: number,
	col: number,
	direction: WordDirection,
	width: number,
	height: number
): boolean {
	const { dr, dc } = DIRECTION_DELTAS[direction];

	for (let i = 0; i < word.length; i++) {
		const r = row + dr * i;
		const c = col + dc * i;

		// Bounds check
		if (r < 0 || r >= height || c < 0 || c >= width) {
			return false;
		}

		const cell = grid[r][c];
		// Cell must be empty or have the same letter (intersection)
		if (cell !== null && cell !== word[i]) {
			return false;
		}
	}

	return true;
}

function placeWord(
	grid: (string | null)[][],
	word: string,
	row: number,
	col: number,
	direction: WordDirection
): void {
	const { dr, dc } = DIRECTION_DELTAS[direction];
	for (let i = 0; i < word.length; i++) {
		grid[row + dr * i][col + dc * i] = word[i];
	}
}

// ─── Fill empty cells with random letters ───────────────

const FILL_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

function fillGrid(grid: (string | null)[][], random: () => number): string[][] {
	return grid.map((row) =>
		row.map((cell) =>
			cell !== null ? cell : FILL_LETTERS[Math.floor(random() * FILL_LETTERS.length)]
		)
	);
}

// ─── Puzzle ID ──────────────────────────────────────────

function generatePuzzleId(seed: string | undefined, random: () => number): string {
	if (seed) {
		return `ws-daily-${seed}`;
	}
	const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
	let id = 'ws-';
	for (let i = 0; i < 8; i++) {
		id += chars[Math.floor(random() * chars.length)];
	}
	return id;
}

// ─── Main generator ─────────────────────────────────────

const DEFAULT_CONFIG: WordsearchGeneratorConfig = {
	width: 12,
	height: 12,
	minWords: 8,
	maxWords: 15,
	difficulty: 'medium',
	maxAttempts: 100,
	allowDiagonal: false,
	allowReversed: false,
	seed: undefined
};

export function generateWordsearch(
	config: Partial<WordsearchGeneratorConfig> = {}
): WordsearchPuzzle | null {
	const cfg: WordsearchGeneratorConfig = { ...DEFAULT_CONFIG, ...config };
	const random = cfg.seed ? mulberry32(seedFromString(cfg.seed)) : mulberry32(Date.now());

	// Filter words by difficulty tier (include easier tiers too)
	const difficultyOrder = { easy: 0, medium: 1, hard: 2 };
	const maxDiff = difficultyOrder[cfg.difficulty];
	const eligible = wordsearchBank.filter((w) => difficultyOrder[w.difficulty] <= maxDiff);

	if (eligible.length < cfg.minWords) return null;

	let bestResult: { placements: WordPlacement[]; grid: (string | null)[][] } | null = null;
	let bestCount = 0;

	const allowedDirs = getAllowedDirections(cfg);

	for (let attempt = 0; attempt < cfg.maxAttempts; attempt++) {
		const result = attemptPlacement(cfg, eligible, allowedDirs, random);
		if (result && result.placements.length > bestCount) {
			bestCount = result.placements.length;
			bestResult = result;

			// If we meet the target, stop early
			if (bestCount >= cfg.minWords) break;
		}
	}

	if (!bestResult || bestResult.placements.length < cfg.minWords) return null;

	// Fill empty cells with random letters
	const filledGrid = fillGrid(bestResult.grid, random);

	return {
		id: generatePuzzleId(cfg.seed, random),
		width: cfg.width,
		height: cfg.height,
		grid: filledGrid,
		words: bestResult.placements,
		difficulty: cfg.difficulty,
		generatedAt: new Date().toISOString(),
		seed: cfg.seed
	};
}

function attemptPlacement(
	cfg: WordsearchGeneratorConfig,
	eligible: WordsearchEntry[],
	allowedDirs: WordDirection[],
	random: () => number
): { placements: WordPlacement[]; grid: (string | null)[][] } | null {
	const grid = createEmptyGrid(cfg.width, cfg.height);
	const placements: WordPlacement[] = [];
	const usedWords = new Set<string>();

	// Shuffle eligible words
	const words = shuffle(eligible, random);

	for (const entry of words) {
		if (placements.length >= cfg.maxWords) break;
		if (usedWords.has(entry.word)) continue;

		// Ensure word fits in the grid at all
		if (entry.word.length > Math.max(cfg.width, cfg.height)) continue;

		// Try random positions and directions
		const shuffledDirs = shuffle(allowedDirs, random);
		let placed = false;

		for (const dir of shuffledDirs) {
			if (placed) break;

			// Generate candidate positions
			const candidates = generateCandidates(cfg.width, cfg.height, entry.word.length, dir, random);

			for (const { row, col } of candidates) {
				if (canPlace(grid, entry.word, row, col, dir, cfg.width, cfg.height)) {
					placeWord(grid, entry.word, row, col, dir);
					placements.push({
						word: entry.word,
						displayWord: entry.display,
						hint: entry.hint,
						row,
						col,
						direction: dir
					});
					usedWords.add(entry.word);
					placed = true;
					break;
				}
			}
		}
	}

	return placements.length > 0 ? { placements, grid } : null;
}

/** Generate random candidate positions for a word in a given direction */
function generateCandidates(
	width: number,
	height: number,
	wordLen: number,
	direction: WordDirection,
	random: () => number
): { row: number; col: number }[] {
	const { dr, dc } = DIRECTION_DELTAS[direction];
	const candidates: { row: number; col: number }[] = [];

	// Calculate valid ranges
	const minRow = dr < 0 ? wordLen - 1 : 0;
	const maxRow = dr > 0 ? height - wordLen : height - 1;
	const minCol = dc < 0 ? wordLen - 1 : 0;
	const maxCol = dc > 0 ? width - wordLen : width - 1;

	if (maxRow < minRow || maxCol < minCol) return candidates;

	// Generate all valid positions
	for (let r = minRow; r <= maxRow; r++) {
		for (let c = minCol; c <= maxCol; c++) {
			candidates.push({ row: r, col: c });
		}
	}

	// Shuffle and return limited set for performance
	return shuffle(candidates, random).slice(0, 20);
}

// ─── Client-safe conversion ─────────────────────────────

export function toClientPuzzle(puzzle: WordsearchPuzzle): WordsearchPuzzleClient {
	const words: WordsearchWordClient[] = puzzle.words.map((w) => ({
		word: w.word,
		displayWord: w.displayWord,
		hint: w.hint,
		found: false
	}));

	// Sort words alphabetically for display
	words.sort((a, b) => a.displayWord.localeCompare(b.displayWord, 'pt'));

	return {
		id: puzzle.id,
		width: puzzle.width,
		height: puzzle.height,
		grid: puzzle.grid,
		words,
		difficulty: puzzle.difficulty,
		generatedAt: puzzle.generatedAt
	};
}

// ─── Validation ─────────────────────────────────────────

/**
 * Validate that a selected sequence of cells matches a word in the puzzle.
 * Returns the matched word or null.
 */
export function validateSelection(
	puzzle: WordsearchPuzzle,
	cells: { row: number; col: number }[]
): string | null {
	if (cells.length < 2) return null;

	// Extract the word from grid cells
	const selectedWord = cells.map((c) => puzzle.grid[c.row][c.col]).join('');

	// Check against placed words
	for (const placement of puzzle.words) {
		if (placement.word === selectedWord) {
			// Verify the cells match the placement position
			const { dr, dc } = DIRECTION_DELTAS[placement.direction];
			let matches = true;

			if (cells.length !== placement.word.length) continue;

			for (let i = 0; i < cells.length; i++) {
				const expectedRow = placement.row + dr * i;
				const expectedCol = placement.col + dc * i;
				if (cells[i].row !== expectedRow || cells[i].col !== expectedCol) {
					matches = false;
					break;
				}
			}

			if (matches) return placement.word;

			// Also check reverse selection (player drags from end to start)
			matches = true;
			for (let i = 0; i < cells.length; i++) {
				const ri = cells.length - 1 - i;
				const expectedRow = placement.row + dr * ri;
				const expectedCol = placement.col + dc * ri;
				if (cells[i].row !== expectedRow || cells[i].col !== expectedCol) {
					matches = false;
					break;
				}
			}

			if (matches) return placement.word;
		}
	}

	return null;
}

// ─── Daily seed ─────────────────────────────────────────

export function getDailySeed(date?: Date): string {
	const d = date || new Date();
	const year = d.getFullYear();
	const month = String(d.getMonth() + 1).padStart(2, '0');
	const day = String(d.getDate()).padStart(2, '0');
	return `wordsearch-${year}-${month}-${day}`;
}

// ─── Difficulty presets ─────────────────────────────────

export const DIFFICULTY_PRESETS: Record<string, Partial<WordsearchGeneratorConfig>> = {
	easy: {
		width: 10,
		height: 10,
		minWords: 6,
		maxWords: 10,
		difficulty: 'easy',
		maxAttempts: 100,
		allowDiagonal: false,
		allowReversed: false
	},
	medium: {
		width: 13,
		height: 13,
		minWords: 10,
		maxWords: 16,
		difficulty: 'medium',
		maxAttempts: 100,
		allowDiagonal: true,
		allowReversed: false
	},
	hard: {
		width: 15,
		height: 15,
		minWords: 14,
		maxWords: 22,
		difficulty: 'hard',
		maxAttempts: 120,
		allowDiagonal: true,
		allowReversed: true
	}
};
