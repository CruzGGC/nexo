import PocketBase from 'pocketbase';
import { env } from '$env/dynamic/private';

let bootstrapPromise: Promise<void> | null = null;

function field(name: string, type: string, extras: Record<string, unknown> = {}) {
	return {
		name,
		type,
		required: false,
		presentable: false,
		hidden: false,
		system: false,
		...extras
	};
}

const AUTH_RULE = '@request.auth.id != ""';

const REQUIRED_COLLECTIONS: Array<Record<string, unknown>> = [
	{
		name: 'matchmaking_queue',
		type: 'base',
		listRule: AUTH_RULE,
		viewRule: AUTH_RULE,
		createRule: AUTH_RULE,
		updateRule: AUTH_RULE,
		deleteRule: AUTH_RULE,
		fields: [
			field('userId', 'text', { required: true, max: 32 }),
			field('username', 'text', { required: true, max: 64 }),
			field('gameType', 'text', { required: true, max: 24 }),
			field('status', 'text', { required: true, max: 24 }),
			field('roomId', 'text', { max: 32 })
		]
	},
	{
		name: 'rooms',
		type: 'base',
		listRule: AUTH_RULE,
		viewRule: AUTH_RULE,
		createRule: AUTH_RULE,
		updateRule: AUTH_RULE,
		deleteRule: AUTH_RULE,
		fields: [
			field('gameType', 'text', { required: true, max: 24 }),
			field('status', 'text', { required: true, max: 24 }),
			field('players', 'json', { required: true }),
			field('turn', 'text', { max: 32 }),
			field('boardState', 'json'),
			field('round', 'number'),
			field('winner', 'text', { max: 32 }),
			field('isDraw', 'bool'),
			field('version', 'number'),
			field('roomCode', 'text', { required: true, max: 12 }),
			field('isPrivate', 'bool')
		]
	},
	{
		name: 'scores',
		type: 'base',
		listRule: AUTH_RULE,
		viewRule: AUTH_RULE,
		createRule: AUTH_RULE,
		updateRule: AUTH_RULE,
		deleteRule: AUTH_RULE,
		fields: [
			field('user', 'text', { required: true, max: 32 }),
			field('gameType', 'text', { required: true, max: 24 }),
			field('difficulty', 'text', { required: true, max: 24 }),
			field('mode', 'text', { required: true, max: 24 }),
			field('score', 'number', { required: true }),
			field('timeSeconds', 'number', { required: true }),
			field('hintsUsed', 'number', { required: true }),
			field('puzzleId', 'text', { required: true, max: 96 }),
			field('puzzleDate', 'text', { max: 16 })
		]
	}
];

async function authAsSuperuser(pb: PocketBase): Promise<boolean> {
	const email = env.POCKETBASE_ADMIN_EMAIL;
	const password = env.POCKETBASE_ADMIN_PASSWORD;
	if (!email || !password) return false;

	try {
		await pb.collection('_superusers').authWithPassword(email, password);
		return true;
	} catch {
		return false;
	}
}

export async function ensurePocketBaseCollections(): Promise<void> {
	if (bootstrapPromise) return bootstrapPromise;

	bootstrapPromise = (async () => {
		const baseUrl = env.POCKETBASE_URL || 'http://localhost:8090';
		const pb = new PocketBase(baseUrl);
		const adminOk = await authAsSuperuser(pb);
		if (!adminOk) {
			console.warn('PocketBase bootstrap skipped: invalid/missing superuser credentials');
			return;
		}

		let existingNames = new Set<string>();
		try {
			const all = await pb.collections.getFullList();
			existingNames = new Set(all.map((collection: { name: string }) => collection.name));
		} catch (error) {
			console.warn('PocketBase bootstrap failed while listing collections:', error);
			return;
		}

		for (const collection of REQUIRED_COLLECTIONS) {
			const name = collection['name'] as string;
			if (existingNames.has(name)) continue;

			try {
				await pb.collections.create(collection);
				console.log(`PocketBase bootstrap: created collection ${name}`);
			} catch (error) {
				console.error(`PocketBase bootstrap: failed creating collection ${name}`, error);
			}
		}
	})();

	return bootstrapPromise;
}
