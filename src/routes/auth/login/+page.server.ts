import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { authLoginSchema } from '$lib/validators/index.js';

export const load: PageServerLoad = async ({ locals }) => {
	if (locals.user) {
		redirect(303, '/');
	}
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
		const formData = await request.formData();
		const email = formData.get('email') as string;
		const password = formData.get('password') as string;

		// Validate input at boundary
		const result = authLoginSchema.safeParse({ email, password });
		if (!result.success) {
			const fieldErrors = result.error.flatten().fieldErrors;
			return fail(400, {
				email,
				errors: {
					form: undefined as string | undefined,
					email: fieldErrors.email?.[0],
					password: fieldErrors.password?.[0]
				}
			});
		}

		try {
			await locals.pb.collection('users').authWithPassword(email, password);
		} catch (err: unknown) {
			return fail(400, {
				email,
				errors: {
					form: 'auth_erro_credenciais' as string | undefined,
					email: undefined as string | undefined,
					password: undefined as string | undefined
				}
			});
		}

		redirect(303, '/');
	}
};
