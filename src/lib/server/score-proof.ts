import { createHmac, timingSafeEqual } from 'node:crypto';
import { env } from '$env/dynamic/private';
import type { Difficulty, GameMode, GameType } from '$lib/validators';

export interface ScoreProofClaims {
	gameType: GameType;
	difficulty: Difficulty;
	mode: GameMode;
	puzzleId: string;
	puzzleDate: string;
	score: number;
	timeSeconds: number;
	hintsUsed: number;
	expiresAt: number;
}

const DEFAULT_DEV_SECRET = 'dev-score-secret-change-me';

function getSecret(): string {
	return env.SCORE_PROOF_SECRET || DEFAULT_DEV_SECRET;
}

function toBase64Url(input: string | Buffer): string {
	return Buffer.from(input)
		.toString('base64')
		.replace(/\+/g, '-')
		.replace(/\//g, '_')
		.replace(/=+$/g, '');
}

function fromBase64Url(input: string): Buffer {
	const padded = input + '='.repeat((4 - (input.length % 4 || 4)) % 4);
	return Buffer.from(padded.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
}

function signPayload(payloadBase64: string): string {
	return toBase64Url(createHmac('sha256', getSecret()).update(payloadBase64).digest());
}

export function createScoreProof(claims: Omit<ScoreProofClaims, 'expiresAt'>, ttlMs = 10 * 60 * 1000): string {
	const payloadObj: ScoreProofClaims = {
		...claims,
		expiresAt: Date.now() + ttlMs
	};
	const payloadBase64 = toBase64Url(JSON.stringify(payloadObj));
	const signature = signPayload(payloadBase64);
	return `${payloadBase64}.${signature}`;
}

export function verifyScoreProof(
	proof: string,
	constraints: {
		gameType: GameType;
		difficulty: Difficulty;
		mode: GameMode;
		puzzleId: string;
		puzzleDate?: string;
		timeSeconds: number;
		hintsUsed: number;
	}
): ScoreProofClaims | null {
	try {
		const [payloadBase64, signature] = proof.split('.');
		if (!payloadBase64 || !signature) return null;

		const expectedSig = signPayload(payloadBase64);
		const sigA = fromBase64Url(signature);
		const sigB = fromBase64Url(expectedSig);
		if (sigA.length !== sigB.length || !timingSafeEqual(sigA, sigB)) {
			return null;
		}

		const claims = JSON.parse(fromBase64Url(payloadBase64).toString('utf8')) as ScoreProofClaims;
		if (!claims || typeof claims !== 'object') return null;
		if (Date.now() > claims.expiresAt) return null;

		const expectedPuzzleDate = constraints.puzzleDate || '';
		if (
			claims.gameType !== constraints.gameType ||
			claims.difficulty !== constraints.difficulty ||
			claims.mode !== constraints.mode ||
			claims.puzzleId !== constraints.puzzleId ||
			(claims.puzzleDate || '') !== expectedPuzzleDate ||
			claims.timeSeconds !== constraints.timeSeconds ||
			claims.hintsUsed !== constraints.hintsUsed
		) {
			return null;
		}

		return claims;
	} catch {
		return null;
	}
}
