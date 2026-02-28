import PocketBase from 'pocketbase';
import type { Handle } from '@sveltejs/kit';
import { registerAllGameRules } from '$lib/multiplayer/register-games';
import { ensurePocketBaseCollections } from '$lib/server/pocketbase-bootstrap';

const POCKETBASE_URL = process.env.POCKETBASE_URL || 'http://localhost:8090';

// Register all multiplayer game rules once at startup
registerAllGameRules();

// Bootstrap required PocketBase collections once at startup
void ensurePocketBaseCollections();

// ─── In-memory rate limiter ────────────────────────────────
interface RateBucket {
	count: number;
	resetAt: number;
}

const rateBuckets = new Map<string, RateBucket>();

// Cleanup stale buckets every 5 minutes
setInterval(() => {
	const now = Date.now();
	for (const [key, bucket] of rateBuckets) {
		if (bucket.resetAt < now) {
			rateBuckets.delete(key);
		}
	}
}, 5 * 60 * 1000);

/**
 * Check if a request should be rate-limited.
 * Returns true if the request exceeds the limit.
 */
function isRateLimited(key: string, maxRequests: number, windowMs: number): boolean {
	const now = Date.now();
	const bucket = rateBuckets.get(key);

	if (!bucket || bucket.resetAt < now) {
		rateBuckets.set(key, { count: 1, resetAt: now + windowMs });
		return false;
	}

	bucket.count++;
	return bucket.count > maxRequests;
}

function getClientIP(request: Request): string {
	return (
		request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
		request.headers.get('x-real-ip') ||
		'unknown'
	);
}

// Rate limit rules: [pathPrefix, maxRequests, windowMs]
const RATE_LIMITS: Array<{ prefix: string; max: number; windowMs: number }> = [
	{ prefix: '/auth/login', max: 10, windowMs: 60_000 },
	{ prefix: '/auth/register', max: 5, windowMs: 60_000 },
	{ prefix: '/api/matchmaking', max: 20, windowMs: 60_000 },
	{ prefix: '/api/scores', max: 15, windowMs: 60_000 },
	{ prefix: '/api/rooms', max: 30, windowMs: 60_000 },
	{ prefix: '/api/crossword/validate', max: 30, windowMs: 60_000 },
	{ prefix: '/api/wordsearch/validate', max: 30, windowMs: 60_000 }
];

// ─── Security headers ──────────────────────────────────────
const SECURITY_HEADERS: Record<string, string> = {
	'X-Content-Type-Options': 'nosniff',
	'X-Frame-Options': 'DENY',
	'X-XSS-Protection': '1; mode=block',
	'Referrer-Policy': 'strict-origin-when-cross-origin',
	'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
	'Strict-Transport-Security': 'max-age=31536000; includeSubDomains'
};

// ─── Handle hook ────────────────────────────────────────────
export const handle: Handle = async ({ event, resolve }) => {
	const { request, url } = event;
	const startTime = performance.now();

	// Generate request ID for structured logging
	event.locals.requestId = crypto.randomUUID();

	// ── Rate limiting ──
	const ip = getClientIP(request);
	const pathname = url.pathname;

	for (const rule of RATE_LIMITS) {
		if (pathname.startsWith(rule.prefix)) {
			const key = `${ip}:${rule.prefix}`;
			if (isRateLimited(key, rule.max, rule.windowMs)) {
				console.warn(
					JSON.stringify({
						level: 'warn',
						event: 'rate_limited',
						ip,
						path: pathname,
						requestId: event.locals.requestId,
						ts: new Date().toISOString()
					})
				);
				return new Response(JSON.stringify({ error: 'Too many requests' }), {
					status: 429,
					headers: {
						'Content-Type': 'application/json',
						'Retry-After': '60',
						...SECURITY_HEADERS
					}
				});
			}
			break; // Only match first rule
		}
	}

	// ── PocketBase auth ──
	event.locals.pb = new PocketBase(POCKETBASE_URL);
	event.locals.pb.authStore.loadFromCookie(request.headers.get('cookie') || '');

	try {
		if (event.locals.pb.authStore.isValid) {
			await event.locals.pb.collection('users').authRefresh();
			event.locals.user = event.locals.pb.authStore.record;
		} else {
			event.locals.user = null;
		}
	} catch (_) {
		event.locals.pb.authStore.clear();
		event.locals.user = null;
	}

	// ── Resolve request ──
	const response = await resolve(event);

	// ── Security headers ──
	for (const [header, value] of Object.entries(SECURITY_HEADERS)) {
		response.headers.set(header, value);
	}

	// ── Auth cookie ──
	response.headers.append('set-cookie', event.locals.pb.authStore.exportToCookie());

	// ── Structured request log ──
	const durationMs = Math.round(performance.now() - startTime);
	if (pathname.startsWith('/api/') || request.method !== 'GET') {
		console.log(
			JSON.stringify({
				level: 'info',
				event: 'request',
				method: request.method,
				path: pathname,
				status: response.status,
				durationMs,
				ip,
				userId: event.locals.user?.id ?? null,
				requestId: event.locals.requestId,
				ts: new Date().toISOString()
			})
		);
	}

	return response;
};
