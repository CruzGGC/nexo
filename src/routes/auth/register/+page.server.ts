import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { authRegisterSchema } from '$lib/validators/index.js';

export const load: PageServerLoad = async ({ locals }) => {
	if (locals.user) {
		redirect(303, '/');
	}
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
		const formData = await request.formData();
		const username = formData.get('username') as string;
		const email = formData.get('email') as string;
		const password = formData.get('password') as string;
		const passwordConfirm = formData.get('passwordConfirm') as string;

		// Validate input at boundary
		const result = authRegisterSchema.safeParse({ username, email, password, passwordConfirm });
		if (!result.success) {
			const fieldErrors = result.error.flatten().fieldErrors;
			return fail(400, {
				username,
				email,
				errors: {
					form: undefined as string | undefined,
					username: fieldErrors.username?.[0],
					email: fieldErrors.email?.[0],
					password: fieldErrors.password?.[0],
					passwordConfirm: fieldErrors.passwordConfirm?.[0]
				}
			});
		}

		try {
			// Create user in PocketBase
			await locals.pb.collection('users').create({
				username,
				name: username,
				email,
				password,
				passwordConfirm
			});

			// Auto-login after registration
			await locals.pb.collection('users').authWithPassword(email, password);
		} catch (err: unknown) {
			const pbError = err as { response?: { data?: Record<string, { code: string }> } };
			const data = pbError?.response?.data;

			let formError: string | undefined = undefined;
			let emailError: string | undefined = undefined;
			let usernameError: string | undefined = undefined;

			if (data?.email?.code === 'validation_invalid_email' || data?.email?.code === 'validation_not_unique') {
				emailError = 'auth_erro_email_usado';
			}
			if (data?.username?.code === 'validation_not_unique') {
				usernameError = 'auth_erro_username_usado';
			}

			if (!emailError && !usernameError) {
				formError = 'auth_erro_generico';
			}

			return fail(400, {
				username,
				email,
				errors: {
					form: formError,
					username: usernameError,
					email: emailError,
					password: undefined as string | undefined,
					passwordConfirm: undefined as string | undefined
				}
			});
		}

		redirect(303, '/');
	}
};
