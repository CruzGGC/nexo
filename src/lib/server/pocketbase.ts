import PocketBase from 'pocketbase';
import { POCKETBASE_URL } from '$env/static/private';

/**
 * Create a server-side PocketBase instance.
 * Each request should get its own instance to avoid auth state leaking between requests.
 */
export function createServerPB(): PocketBase {
	return new PocketBase(POCKETBASE_URL);
}
