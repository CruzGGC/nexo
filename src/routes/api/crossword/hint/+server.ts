import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import {
	generateCrossword,
	getDailySeed,
	DIFFICULTY_PRESETS
} from '$lib/games/crossword';

/**
 * POST /api/crossword/hint
 * Reveals the solution letter for a selected cell.
 */
export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();
		const { mode, difficulty, puzzleSeed, row, col } = body;

		if (typeof row !== 'number' || typeof col !== 'number') {
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

		const puzzle = generateCrossword(config);
		if (!puzzle) {
			return json({ success: false, error: 'puzzle_regen_failed' }, { status: 500 });
		}

		if (
			row < 0 ||
			col < 0 ||
			row >= puzzle.height ||
			col >= puzzle.width
		) {
			return json({ success: false, error: 'out_of_bounds' }, { status: 400 });
		}

		const letter = puzzle.grid[row][col];
		if (!letter) {
			return json({ success: false, error: 'not_letter_cell' }, { status: 400 });
		}

		return json({
			success: true,
			letter
		});
	} catch {
		return json({ success: false, error: 'server_error' }, { status: 500 });
	}
};
