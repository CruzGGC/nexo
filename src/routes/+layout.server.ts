import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
	return {
		user: locals.user
			? {
					id: locals.user.id,
					username: (locals.user['username'] as string) || '',
					email: locals.user['email'] as string,
					name: (locals.user['name'] as string) || '',
					avatar: (locals.user['avatar'] as string) || ''
				}
			: null
	};
};
