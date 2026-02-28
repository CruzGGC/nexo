import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { profileUpdateSchema } from '$lib/validators/index.js';

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
			avatar: (locals.user['avatar'] as string) || ''
		}
	};
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
		if (!locals.user) {
			redirect(303, '/auth/login');
		}

		const formData = await request.formData();
		const username = formData.get('username') as string;
		const name = (formData.get('name') as string) || undefined;

		// Validate input at boundary
		const result = profileUpdateSchema.safeParse({ username, name });
		if (!result.success) {
			const fieldErrors = result.error.flatten().fieldErrors;
			return fail(400, {
				username,
				name: name ?? '',
				errors: {
					form: undefined as string | undefined,
					username: fieldErrors.username?.[0],
					name: fieldErrors.name?.[0]
				}
			});
		}

		try {
			await locals.pb.collection('users').update(locals.user.id, {
				username: result.data.username,
				name: result.data.name ?? ''
			});

			// Refresh auth store so the cookie gets updated
			await locals.pb.collection('users').authRefresh();
			locals.user = locals.pb.authStore.record;
		} catch (err: unknown) {
			const pbError = err as { response?: { data?: Record<string, { code: string }> } };
			const data = pbError?.response?.data;

			const errors: Record<string, string | undefined> = {};

			if (data?.username?.code === 'validation_not_unique') {
				errors.username = 'auth_erro_username_usado';
			} else {
				errors.form = 'auth_erro_generico';
			}

			return fail(400, {
				username,
				name: name ?? '',
				errors
			});
		}

		redirect(303, '/profile');
	}
};
