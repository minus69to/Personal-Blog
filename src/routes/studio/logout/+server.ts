import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { clearStudioSession } from '$lib/server/studioAuth';

export const POST: RequestHandler = ({ cookies }) => {
	clearStudioSession(cookies);
	redirect(303, '/studio/login');
};
