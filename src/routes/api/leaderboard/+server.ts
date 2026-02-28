import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { GAME_TYPES, DIFFICULTIES, GAME_MODES, LEADERBOARD_PERIODS } from '$lib/validators';
import type { LeaderboardPeriod } from '$lib/validators';

/**
 * GET /api/leaderboard
 *
 * Queries top scores from PocketBase `scores` collection.
 * Supports filtering by gameType, difficulty, mode, and time period.
 */
export const GET: RequestHandler = async ({ url, locals }) => {
	try {
		const gameType = url.searchParams.get('gameType') || 'crossword';
		const difficulty = url.searchParams.get('difficulty') || '';
		const mode = url.searchParams.get('mode') || '';
		const period = (url.searchParams.get('period') || 'all') as LeaderboardPeriod;
		const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
		const perPage = Math.min(50, Math.max(1, parseInt(url.searchParams.get('perPage') || '20', 10)));

		// Validate gameType
		if (!GAME_TYPES.includes(gameType as typeof GAME_TYPES[number])) {
			return json({ success: false, error: 'Invalid gameType' }, { status: 400 });
		}

		// Build filter
		const filters: string[] = [`gameType = "${gameType}"`];

		if (difficulty && DIFFICULTIES.includes(difficulty as typeof DIFFICULTIES[number])) {
			filters.push(`difficulty = "${difficulty}"`);
		}

		if (mode && GAME_MODES.includes(mode as typeof GAME_MODES[number])) {
			filters.push(`mode = "${mode}"`);
		}

		// Time period filter
		const periodFilter = getPeriodFilter(period);
		if (periodFilter) {
			filters.push(periodFilter);
		}

		const filter = filters.join(' && ');

		const result = await locals.pb.collection('scores').getList(page, perPage, {
			filter,
			sort: '-score,+timeSeconds',
			expand: 'user'
		});

		// Transform records into a clean response
		const entries = result.items.map((item, index) => ({
			rank: (page - 1) * perPage + index + 1,
			scoreId: item.id,
			userId: item['user'] as string,
			username: (item.expand as Record<string, Record<string, unknown>>)?.['user']?.['username'] as string || 'Anónimo',
			avatar: (item.expand as Record<string, Record<string, unknown>>)?.['user']?.['avatar'] as string || '',
			score: item['score'] as number,
			timeSeconds: item['timeSeconds'] as number,
			hintsUsed: item['hintsUsed'] as number,
			difficulty: item['difficulty'] as string,
			mode: item['mode'] as string,
			puzzleDate: item['puzzleDate'] as string || '',
			createdAt: item.created
		}));

		return json({
			success: true,
			entries,
			page: result.page,
			perPage: result.perPage,
			totalItems: result.totalItems,
			totalPages: result.totalPages
		});
	} catch (err) {
		console.error(`[${locals.requestId}] Leaderboard query error:`, err);

		// If PocketBase collection doesn't exist yet, return empty
		return json({
			success: true,
			entries: [],
			page: 1,
			perPage: 20,
			totalItems: 0,
			totalPages: 0
		});
	}
};

function getPeriodFilter(period: LeaderboardPeriod): string | null {
	const now = new Date();

	switch (period) {
		case 'today': {
			const todayStr = now.toISOString().split('T')[0];
			return `created >= "${todayStr} 00:00:00"`;
		}
		case 'week': {
			const weekAgo = new Date(now);
			weekAgo.setDate(weekAgo.getDate() - 7);
			return `created >= "${weekAgo.toISOString()}"`;
		}
		case 'month': {
			const monthAgo = new Date(now);
			monthAgo.setMonth(monthAgo.getMonth() - 1);
			return `created >= "${monthAgo.toISOString()}"`;
		}
		case 'all':
		default:
			return null;
	}
}
