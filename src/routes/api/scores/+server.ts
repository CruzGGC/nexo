import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { scoreSubmitSchema } from '$lib/validators';
import { verifyScoreProof } from '$lib/server/score-proof';

/**
 * POST /api/scores
 *
 * Server-authoritative score submission.
 * Validates the payload and writes to PocketBase `scores` collection.
 * Requires authenticated user.
 */
export const POST: RequestHandler = async ({ request, locals }) => {
	try {
		// Must be authenticated
		if (!locals.user) {
			return json(
				{ success: false, error: 'Authentication required' },
				{ status: 401 }
			);
		}

		const body = await request.json();
		const parsed = scoreSubmitSchema.safeParse(body);

		if (!parsed.success) {
			return json(
				{
					success: false,
					error: 'Invalid payload',
					details: parsed.error?.flatten().fieldErrors
				},
				{ status: 400 }
			);
		}

		const data = parsed.data!;
		const proofClaims = verifyScoreProof(data.scoreProof, {
			gameType: data.gameType,
			difficulty: data.difficulty,
			mode: data.mode,
			puzzleId: data.puzzleId,
			puzzleDate: data.puzzleDate || '',
			timeSeconds: data.timeSeconds,
			hintsUsed: data.hintsUsed
		});

		if (!proofClaims) {
			return json(
				{ success: false, error: 'Invalid score proof' },
				{ status: 400 }
			);
		}

		const validatedScore = proofClaims.score;
		const validatedTime = proofClaims.timeSeconds;
		const validatedHints = proofClaims.hintsUsed;

		// Prevent duplicate daily scores (one per user per puzzle per game type)
		if (data.mode === 'daily' && data.puzzleDate) {
			try {
				const existing = await locals.pb.collection('scores').getFirstListItem(
					`user = "${locals.user.id}" && gameType = "${data.gameType}" && puzzleDate = "${data.puzzleDate}" && mode = "daily"`
				);

				if (existing) {
					// Already submitted — update only if better score
					if (validatedScore > (existing['score'] as number)) {
						await locals.pb.collection('scores').update(existing.id, {
							score: validatedScore,
							timeSeconds: validatedTime,
							hintsUsed: validatedHints
						});

						return json({
							success: true,
							updated: true,
							scoreId: existing.id,
							score: validatedScore
						});
					}

					return json({
						success: true,
						updated: false,
						scoreId: existing.id,
						message: 'Existing score is better'
					});
				}
			} catch {
				// No existing record found — proceed to create
			}
		}

		// Create new score record
		const record = await locals.pb.collection('scores').create({
			user: locals.user.id,
			gameType: data.gameType,
			difficulty: data.difficulty,
			mode: data.mode,
			score: validatedScore,
			timeSeconds: validatedTime,
			hintsUsed: validatedHints,
			puzzleId: data.puzzleId,
			puzzleDate: data.puzzleDate || ''
		});

		return json({
			success: true,
			updated: false,
			scoreId: record.id,
			score: validatedScore
		});
	} catch (err) {
		console.error(`[${locals.requestId}] Score submission error:`, err);
		return json(
			{ success: false, error: 'Failed to save score' },
			{ status: 500 }
		);
	}
};
