import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { createStudioSession, hasStudioSession, studioAuthConfigured, verifyStudioPassword } from '$lib/server/studioAuth';

export const load: PageServerLoad = async ({ cookies }) => {
	if (await hasStudioSession(cookies)) redirect(303, '/studio');
	return { configured: studioAuthConfigured() };
};

export const actions: Actions = {
	default: async ({ cookies, request }) => {
		if (!studioAuthConfigured()) return fail(503, { unavailable: true });
		const form = await request.formData();
		const password = form.get('password');
		if (typeof password !== 'string' || !(await verifyStudioPassword(password))) {
			return fail(401, { incorrect: true });
		}
		await createStudioSession(cookies);
		redirect(303, '/studio');
	}
};
