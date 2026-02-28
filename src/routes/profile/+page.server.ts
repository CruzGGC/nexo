import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) {
		redirect(303, '/auth/login');
	}

	return {
		profile: {
			id: locals.user.id,
			username: (locals.user['username'] as string) || '',
			email: (locals.user['email'] as string) || '',
			name: (locals.user['name'] as string) || '',
			avatar: (locals.user['avatar'] as string) || '',
			created: locals.user.created || '',
			updated: locals.user.updated || ''
		}
	};
};
