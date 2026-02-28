import PocketBase from 'pocketbase';
import { PUBLIC_POCKETBASE_URL } from '$env/static/public';

function createPocketBase(): PocketBase {
	return new PocketBase(PUBLIC_POCKETBASE_URL);
}

export const pb = createPocketBase();
