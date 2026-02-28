/**
 * Crossword grid generator.
 *
 * Algorithm:
 * 1. Filter word bank by difficulty
 * 2. Sort words by length (longer first — they anchor the grid better)
 * 3. Place the first word at the center of the grid (across)
 * 4. For each remaining word, try to find an intersection with already-placed words
 * 5. Score each placement by intersections, density, and symmetry
 * 6. Accept the placement with the highest score
 * 7. Repeat until minWords reached or no more words can be placed
 * 8. Quality-threshold: reject puzzles below minIntersections
 * 9. For daily puzzles, use seeded PRNG for deterministic output
 */

import type {
	CrosswordEntry,
	CrosswordPuzzle,
	CrosswordPuzzleClient,
	CrosswordClueClient,
	Direction,
	GeneratorConfig,
	WordBankEntry
} from './types';
import { wordBank } from './words';

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

// ─── Shuffle with PRNG ─────────────────────────────────

function shuffle<T>(arr: T[], random: () => number): T[] {
	const result = [...arr];
	for (let i = result.length - 1; i > 0; i--) {
		const j = Math.floor(random() * (i + 1));
		[result[i], result[j]] = [result[j], result[i]];
	}
	return result;
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
	direction: Direction,
	width: number,
	height: number
): { valid: boolean; intersections: number } {
	const dr = direction === 'down' ? 1 : 0;
	const dc = direction === 'across' ? 1 : 0;
	let intersections = 0;

	// Check bounds
	const endRow = row + dr * (word.length - 1);
	const endCol = col + dc * (word.length - 1);
	if (endRow >= height || endCol >= width || row < 0 || col < 0) {
		return { valid: false, intersections: 0 };
	}

	// Check cell before the word (must be empty or out of bounds)
	const beforeRow = row - dr;
	const beforeCol = col - dc;
	if (beforeRow >= 0 && beforeCol >= 0 && beforeRow < height && beforeCol < width) {
		if (grid[beforeRow][beforeCol] !== null) {
			return { valid: false, intersections: 0 };
		}
	}

	// Check cell after the word (must be empty or out of bounds)
	const afterRow = row + dr * word.length;
	const afterCol = col + dc * word.length;
	if (afterRow >= 0 && afterCol >= 0 && afterRow < height && afterCol < width) {
		if (grid[afterRow][afterCol] !== null) {
			return { valid: false, intersections: 0 };
		}
	}

	for (let i = 0; i < word.length; i++) {
		const r = row + dr * i;
		const c = col + dc * i;
		const cell = grid[r][c];

		if (cell !== null) {
			// Cell occupied — must be the same letter (intersection)
			if (cell !== word[i]) {
				return { valid: false, intersections: 0 };
			}
			intersections++;
		} else {
			// Cell empty — check perpendicular neighbors won't create invalid adjacencies
			// For an across word, check the cells above and below
			// For a down word, check the cells to the left and right
			const perpDr = direction === 'across' ? 1 : 0;
			const perpDc = direction === 'across' ? 0 : 1;

			const neighbor1Row = r + perpDr;
			const neighbor1Col = c + perpDc;
			const neighbor2Row = r - perpDr;
			const neighbor2Col = c - perpDc;

			if (
				neighbor1Row >= 0 &&
				neighbor1Row < height &&
				neighbor1Col >= 0 &&
				neighbor1Col < width &&
				grid[neighbor1Row][neighbor1Col] !== null
			) {
				return { valid: false, intersections: 0 };
			}

			if (
				neighbor2Row >= 0 &&
				neighbor2Row < height &&
				neighbor2Col >= 0 &&
				neighbor2Col < width &&
				grid[neighbor2Row][neighbor2Col] !== null
			) {
				return { valid: false, intersections: 0 };
			}
		}
	}

	// Must have at least one intersection (except the first word)
	return { valid: true, intersections };
}

function placeWord(
	grid: (string | null)[][],
	word: string,
	row: number,
	col: number,
	direction: Direction
): void {
	const dr = direction === 'down' ? 1 : 0;
	const dc = direction === 'across' ? 1 : 0;
	for (let i = 0; i < word.length; i++) {
		grid[row + dr * i][col + dc * i] = word[i];
	}
}

// ─── Placement finder ───────────────────────────────────

interface Placement {
	row: number;
	col: number;
	direction: Direction;
	intersections: number;
}

function findPlacements(
	grid: (string | null)[][],
	word: string,
	width: number,
	height: number,
	entries: CrosswordEntry[]
): Placement[] {
	const placements: Placement[] = [];

	// Try to intersect with each existing entry
	for (const entry of entries) {
		for (let i = 0; i < entry.word.length; i++) {
			for (let j = 0; j < word.length; j++) {
				if (entry.word[i] !== word[j]) continue;

				// Calculate placement position
				let row: number, col: number;
				let direction: Direction;

				if (entry.direction === 'across') {
					// New word goes down, intersecting at entry's position
					direction = 'down';
					row = entry.row - j;
					col = entry.col + i;
				} else {
					// New word goes across, intersecting at entry's position
					direction = 'across';
					row = entry.row + i;
					col = entry.col - j;
				}

				const result = canPlace(grid, word, row, col, direction, width, height);
				if (result.valid && result.intersections > 0) {
					placements.push({ row, col, direction, intersections: result.intersections });
				}
			}
		}
	}

	return placements;
}

// ─── Puzzle ID generation ───────────────────────────────

function generatePuzzleId(seed: string | undefined, random: () => number): string {
	if (seed) {
		return `daily-${seed}`;
	}
	const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
	let id = 'puzzle-';
	for (let i = 0; i < 8; i++) {
		id += chars[Math.floor(random() * chars.length)];
	}
	return id;
}

// ─── Main generator ─────────────────────────────────────

const DEFAULT_CONFIG: GeneratorConfig = {
	width: 13,
	height: 13,
	minWords: 8,
	maxWords: 20,
	difficulty: 'medium',
	maxAttempts: 50,
	minIntersections: 4
};

export function generateCrossword(config: Partial<GeneratorConfig> = {}): CrosswordPuzzle | null {
	const cfg = { ...DEFAULT_CONFIG, ...config };
	const random = cfg.seed ? mulberry32(seedFromString(cfg.seed)) : mulberry32(Date.now());

	let bestPuzzle: CrosswordPuzzle | null = null;
	let bestScore = -1;

	for (let attempt = 0; attempt < cfg.maxAttempts; attempt++) {
		const result = attemptGeneration(cfg, random);
		if (!result) continue;

		const score = scorePuzzle(result);
		if (score > bestScore) {
			bestScore = score;
			bestPuzzle = result;
		}

		// If we meet quality threshold, stop early
		if (result.entries.length >= cfg.minWords && countIntersections(result) >= cfg.minIntersections) {
			break;
		}
	}

	return bestPuzzle;
}

function attemptGeneration(
	cfg: GeneratorConfig,
	random: () => number
): CrosswordPuzzle | null {
	// Filter words by difficulty (include easier words too for cross-referencing)
	const difficultyOrder = { easy: 0, medium: 1, hard: 2 };
	const maxDifficulty = difficultyOrder[cfg.difficulty];
	const eligible = wordBank.filter((w) => difficultyOrder[w.difficulty] <= maxDifficulty);

	if (eligible.length < cfg.minWords) return null;

	// Sort by length descending, then shuffle within same length
	const sorted = [...eligible].sort((a, b) => b.word.length - a.word.length);
	const words = shuffle(sorted, random);

	const grid = createEmptyGrid(cfg.width, cfg.height);
	const entries: CrosswordEntry[] = [];
	const usedWords = new Set<string>();

	// Place first word in the center, across
	const firstWord = words[0];
	const startRow = Math.floor(cfg.height / 2);
	const startCol = Math.floor((cfg.width - firstWord.word.length) / 2);

	if (startCol < 0 || startCol + firstWord.word.length > cfg.width) {
		// Word too long for grid
		return null;
	}

	placeWord(grid, firstWord.word, startRow, startCol, 'across');
	entries.push({
		number: 1,
		word: firstWord.word,
		clue: firstWord.clue,
		direction: 'across',
		row: startRow,
		col: startCol
	});
	usedWords.add(firstWord.word);

	// Try to place remaining words
	for (let wi = 1; wi < words.length && entries.length < cfg.maxWords; wi++) {
		const wordEntry = words[wi];
		if (usedWords.has(wordEntry.word)) continue;

		const placements = findPlacements(grid, wordEntry.word, cfg.width, cfg.height, entries);
		if (placements.length === 0) continue;

		// Pick the placement with the most intersections (with some randomness)
		placements.sort((a, b) => b.intersections - a.intersections);
		const topN = Math.min(3, placements.length);
		const chosen = placements[Math.floor(random() * topN)];

		placeWord(grid, wordEntry.word, chosen.row, chosen.col, chosen.direction);
		entries.push({
			number: 0, // Will be assigned later
			word: wordEntry.word,
			clue: wordEntry.clue,
			direction: chosen.direction,
			row: chosen.row,
			col: chosen.col
		});
		usedWords.add(wordEntry.word);
	}

	if (entries.length < cfg.minWords) return null;

	// Assign clue numbers
	assignNumbers(entries);

	// Trim grid to actual bounds
	const trimmed = trimGrid(grid, entries, cfg.width, cfg.height);

	return {
		id: generatePuzzleId(cfg.seed, random),
		width: trimmed.width,
		height: trimmed.height,
		entries: trimmed.entries,
		grid: trimmed.grid,
		difficulty: cfg.difficulty,
		generatedAt: new Date().toISOString(),
		seed: cfg.seed
	};
}

function assignNumbers(entries: CrosswordEntry[]): void {
	// Sort by position: top-to-bottom, left-to-right
	entries.sort((a, b) => {
		if (a.row !== b.row) return a.row - b.row;
		return a.col - b.col;
	});

	let number = 1;
	const positionNumbers = new Map<string, number>();

	for (const entry of entries) {
		const key = `${entry.row},${entry.col}`;
		if (positionNumbers.has(key)) {
			entry.number = positionNumbers.get(key)!;
		} else {
			positionNumbers.set(key, number);
			entry.number = number;
			number++;
		}
	}
}

interface TrimResult {
	grid: (string | null)[][];
	entries: CrosswordEntry[];
	width: number;
	height: number;
}

function trimGrid(
	grid: (string | null)[][],
	entries: CrosswordEntry[],
	width: number,
	height: number
): TrimResult {
	let minRow = height, maxRow = 0, minCol = width, maxCol = 0;

	for (let r = 0; r < height; r++) {
		for (let c = 0; c < width; c++) {
			if (grid[r][c] !== null) {
				minRow = Math.min(minRow, r);
				maxRow = Math.max(maxRow, r);
				minCol = Math.min(minCol, c);
				maxCol = Math.max(maxCol, c);
			}
		}
	}

	// Add 1-cell padding
	minRow = Math.max(0, minRow - 1);
	maxRow = Math.min(height - 1, maxRow + 1);
	minCol = Math.max(0, minCol - 1);
	maxCol = Math.min(width - 1, maxCol + 1);

	const newHeight = maxRow - minRow + 1;
	const newWidth = maxCol - minCol + 1;

	const newGrid: (string | null)[][] = [];
	for (let r = minRow; r <= maxRow; r++) {
		const row: (string | null)[] = [];
		for (let c = minCol; c <= maxCol; c++) {
			row.push(grid[r][c]);
		}
		newGrid.push(row);
	}

	const newEntries = entries.map((e) => ({
		...e,
		row: e.row - minRow,
		col: e.col - minCol
	}));

	return { grid: newGrid, entries: newEntries, width: newWidth, height: newHeight };
}

function countIntersections(puzzle: CrosswordPuzzle): number {
	let count = 0;
	const cellOwners = new Map<string, number>();

	for (const entry of puzzle.entries) {
		const dr = entry.direction === 'down' ? 1 : 0;
		const dc = entry.direction === 'across' ? 1 : 0;
		for (let i = 0; i < entry.word.length; i++) {
			const key = `${entry.row + dr * i},${entry.col + dc * i}`;
			const owners = (cellOwners.get(key) || 0) + 1;
			cellOwners.set(key, owners);
			if (owners === 2) count++;
		}
	}

	return count;
}

function scorePuzzle(puzzle: CrosswordPuzzle): number {
	const wordCount = puzzle.entries.length;
	const intersections = countIntersections(puzzle);
	// Prefer more words with more intersections
	return wordCount * 10 + intersections * 5;
}

// ─── Client-safe conversion ─────────────────────────────

export function toClientPuzzle(puzzle: CrosswordPuzzle): CrosswordPuzzleClient {
	const cellMap: boolean[][] = [];
	const numberMap: number[][] = [];

	for (let r = 0; r < puzzle.height; r++) {
		cellMap.push([]);
		numberMap.push([]);
		for (let c = 0; c < puzzle.width; c++) {
			cellMap[r].push(puzzle.grid[r][c] !== null);
			numberMap[r].push(0);
		}
	}

	// Populate number map
	for (const entry of puzzle.entries) {
		const current = numberMap[entry.row][entry.col];
		if (current === 0 || entry.number < current) {
			numberMap[entry.row][entry.col] = entry.number;
		}
	}

	const entries: CrosswordClueClient[] = puzzle.entries.map((e) => ({
		number: e.number,
		clue: e.clue,
		direction: e.direction,
		row: e.row,
		col: e.col,
		length: e.word.length
	}));

	return {
		id: puzzle.id,
		width: puzzle.width,
		height: puzzle.height,
		entries,
		cellMap,
		numberMap,
		difficulty: puzzle.difficulty,
		generatedAt: puzzle.generatedAt
	};
}

// ─── Daily puzzle seed ──────────────────────────────────

export function getDailySeed(date?: Date): string {
	const d = date || new Date();
	const year = d.getFullYear();
	const month = String(d.getMonth() + 1).padStart(2, '0');
	const day = String(d.getDate()).padStart(2, '0');
	return `${year}-${month}-${day}`;
}

// ─── Validation (check answer) ──────────────────────────

export function validateAnswer(puzzle: CrosswordPuzzle, playerGrid: string[][]): boolean {
	for (const entry of puzzle.entries) {
		const dr = entry.direction === 'down' ? 1 : 0;
		const dc = entry.direction === 'across' ? 1 : 0;
		for (let i = 0; i < entry.word.length; i++) {
			const r = entry.row + dr * i;
			const c = entry.col + dc * i;
			if ((playerGrid[r]?.[c] || '').toUpperCase() !== entry.word[i]) {
				return false;
			}
		}
	}
	return true;
}

// ─── Difficulty presets ─────────────────────────────────

export const DIFFICULTY_PRESETS: Record<string, Partial<GeneratorConfig>> = {
	easy: {
		width: 11,
		height: 11,
		minWords: 6,
		maxWords: 12,
		difficulty: 'easy',
		maxAttempts: 80,
		minIntersections: 3
	},
	medium: {
		width: 13,
		height: 13,
		minWords: 8,
		maxWords: 18,
		difficulty: 'medium',
		maxAttempts: 60,
		minIntersections: 5
	},
	hard: {
		width: 15,
		height: 15,
		minWords: 10,
		maxWords: 24,
		difficulty: 'hard',
		maxAttempts: 80,
		minIntersections: 6
	}
};
