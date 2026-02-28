import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import {
	generateWordsearch,
	getDailySeed,
	DIFFICULTY_PRESETS
} from '$lib/games/wordsearch';
import { createScoreProof } from '$lib/server/score-proof';

/**
 * POST /api/wordsearch/validate
 *
 * Validates a completed wordsearch puzzle.
 * For daily puzzles, regenerates server-side to verify.
 * For random puzzles, trusts the client completion signal.
 */
export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();
		const { mode, difficulty, foundWords, elapsedSeconds, hintsUsed, puzzleId, puzzleDate, puzzleSeed } = body;

		if (!foundWords || !Array.isArray(foundWords) || typeof puzzleId !== 'string' || !puzzleId) {
			return json({ valid: false, error: 'Invalid payload' }, { status: 400 });
		}

		const preset = DIFFICULTY_PRESETS[difficulty] || DIFFICULTY_PRESETS['medium'];
		const config = { ...preset };

		if (mode === 'daily') {
			config.seed = getDailySeed();
		} else {
			if (typeof puzzleSeed !== 'string' || !puzzleSeed) {
				return json({ valid: false, error: 'Missing puzzle seed' }, { status: 400 });
			}
			config.seed = puzzleSeed;
		}

		const puzzle = generateWordsearch(config);
		if (!puzzle) {
			return json({ valid: false, error: 'Could not regenerate puzzle' }, { status: 500 });
		}

		// Verify all found words are in the puzzle
		const puzzleWords = new Set(puzzle.words.map((w) => w.word));
		const allValid = foundWords.every((w: string) => puzzleWords.has(w));
		const allFound = foundWords.length >= puzzle.words.length;
		const isValid = allValid && allFound;

		const safeTime = Math.max(0, Number(elapsedSeconds) || 0);
		const safeHints = Math.max(0, Number(hintsUsed) || 0);
		const safePuzzleDate = typeof puzzleDate === 'string' ? puzzleDate : '';
		const computedScore = isValid ? calculateScore(safeTime, safeHints) : 0;
		const scoreProof = isValid
			? createScoreProof({
					gameType: 'wordsearch',
					difficulty,
					mode,
					puzzleId,
					puzzleDate: safePuzzleDate,
					score: computedScore,
					timeSeconds: safeTime,
					hintsUsed: safeHints
				})
			: null;

		return json({
			valid: isValid,
			score: computedScore,
			serverValidated: true,
			scoreProof
		});
	} catch {
		return json({ valid: false, error: 'Server error' }, { status: 500 });
	}
};

function calculateScore(elapsedSeconds: number, hintsUsed: number): number {
	// Base score: 1000
	// Time penalty: -1 per second after 60s
	// Hint penalty: -75 per hint (higher than crossword since reveal gives full word)
	const base = 1000;
	const timePenalty = Math.max(0, elapsedSeconds - 60);
	const hintPenalty = hintsUsed * 75;
	return Math.max(0, base - timePenalty - hintPenalty);
}
