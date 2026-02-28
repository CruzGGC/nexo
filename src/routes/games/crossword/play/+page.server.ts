import type { PageServerLoad } from './$types';
import {
	generateCrossword,
	toClientPuzzle,
	getDailySeed,
	DIFFICULTY_PRESETS
} from '$lib/games/crossword';

export const load: PageServerLoad = async ({ url }) => {
	const mode = url.searchParams.get('mode') || 'daily';
	const difficulty = url.searchParams.get('difficulty') || 'medium';

	const preset = DIFFICULTY_PRESETS[difficulty] || DIFFICULTY_PRESETS['medium'];

	let config = { ...preset };
	const puzzleSeed = mode === 'daily'
		? getDailySeed()
		: crypto.randomUUID().replace(/-/g, '').slice(0, 16);
	config.seed = puzzleSeed;

	const puzzle = generateCrossword(config);

	if (!puzzle) {
		return {
			puzzle: null,
			error: true,
			mode,
			difficulty
		};
	}

	const clientPuzzle = toClientPuzzle(puzzle);

	// Build a deterministic puzzle ID for score deduplication
	const puzzleDate = mode === 'daily' ? puzzleSeed : '';
	const puzzleId = `crossword-${difficulty}-${puzzleSeed}`;

	return {
		puzzle: clientPuzzle,
		// Store the full puzzle server-side for validation later
		// We pass the solution as a serialized string that the validate endpoint can use
		solutionHash: hashSolution(puzzle),
		error: false,
		mode,
		difficulty,
		puzzleId,
		puzzleDate,
		puzzleSeed
	};
};

/** Simple hash of the solution for server-side validation */
function hashSolution(puzzle: ReturnType<typeof generateCrossword>): string {
	if (!puzzle) return '';
	const solution = puzzle.entries
		.map((e) => `${e.number}${e.direction[0]}:${e.word}`)
		.sort()
		.join('|');
	// Simple hash — not crypto-secure, just for basic integrity
	let hash = 0;
	for (let i = 0; i < solution.length; i++) {
		const ch = solution.charCodeAt(i);
		hash = ((hash << 5) - hash + ch) | 0;
	}
	return hash.toString(36);
}
