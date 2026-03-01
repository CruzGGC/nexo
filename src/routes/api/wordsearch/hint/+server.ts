import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import {
	generateWordsearch,
	getDailySeed,
	DIFFICULTY_PRESETS
} from '$lib/games/wordsearch';
import type { WordDirection } from '$lib/games/wordsearch';

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

/**
 * POST /api/wordsearch/hint
 * Reveals one unfound word and its exact cell path.
 */
export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();
		const { mode, difficulty, puzzleSeed, foundWords } = body;

		if (!Array.isArray(foundWords)) {
			return json({ success: false, error: 'invalid_payload' }, { status: 400 });
		}

		const preset = DIFFICULTY_PRESETS[difficulty] || DIFFICULTY_PRESETS['medium'];
		const config = { ...preset };

		if (mode === 'daily') {
			config.seed = getDailySeed();
		} else {
			if (typeof puzzleSeed !== 'string' || !puzzleSeed) {
				return json({ success: false, error: 'missing_seed' }, { status: 400 });
			}
			config.seed = puzzleSeed;
		}

		const puzzle = generateWordsearch(config);
		if (!puzzle) {
			return json({ success: false, error: 'puzzle_regen_failed' }, { status: 500 });
		}

		const foundSet = new Set<string>(foundWords.filter((value) => typeof value === 'string'));
		const nextPlacement = puzzle.words.find((word) => !foundSet.has(word.word));

		if (!nextPlacement) {
			return json({ success: false, error: 'all_found' }, { status: 409 });
		}

		const { dr, dc } = DIRECTION_DELTAS[nextPlacement.direction];
		const cells = Array.from({ length: nextPlacement.word.length }, (_, index) => ({
			row: nextPlacement.row + dr * index,
			col: nextPlacement.col + dc * index
		}));

		return json({
			success: true,
			word: nextPlacement.word,
			cells
		});
	} catch {
		return json({ success: false, error: 'server_error' }, { status: 500 });
	}
};
