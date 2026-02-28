import type { PageServerLoad } from './$types';
import {
	generateWordsearch,
	toClientPuzzle,
	getDailySeed,
	DIFFICULTY_PRESETS
} from '$lib/games/wordsearch';

export const load: PageServerLoad = async ({ url }) => {
	const mode = url.searchParams.get('mode') || 'daily';
	const difficulty = url.searchParams.get('difficulty') || 'medium';

	const preset = DIFFICULTY_PRESETS[difficulty] || DIFFICULTY_PRESETS['medium'];

	let config = { ...preset };
	const puzzleSeed = mode === 'daily'
		? getDailySeed()
		: crypto.randomUUID().replace(/-/g, '').slice(0, 16);
	config.seed = puzzleSeed;

	const puzzle = generateWordsearch(config);

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
	const puzzleId = `wordsearch-${difficulty}-${puzzleSeed}`;

	return {
		puzzle: clientPuzzle,
		error: false,
		mode,
		difficulty,
		puzzleId,
		puzzleDate,
		puzzleSeed
	};
};
