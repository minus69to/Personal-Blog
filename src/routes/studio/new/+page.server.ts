import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { hasStudioSession } from '$lib/server/studioAuth';

export const load: PageServerLoad = async ({ cookies }) => {
	if (!(await hasStudioSession(cookies))) redirect(303, '/studio/login');
	return {};
};
