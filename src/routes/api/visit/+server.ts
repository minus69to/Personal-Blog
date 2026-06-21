import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { cleanPagePath, readVisits, recordVisit } from '$lib/server/visits';

const responseHeaders = { 'cache-control': 'no-store, max-age=0' };

export const GET: RequestHandler = async ({ url }) => {
	try {
		const result = await readVisits(cleanPagePath(url.searchParams.get('path')));
		return json(result, { headers: responseHeaders });
	} catch (error) {
		console.error('Unable to read visit count', error);
		return json({ configured: true, total: null, page: null, error: 'Visit count unavailable' }, { status: 503, headers: responseHeaders });
	}
};

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = (await request.json().catch(() => ({}))) as { path?: unknown };
		const result = await recordVisit(cleanPagePath(body.path));
		return json(result, { headers: responseHeaders });
	} catch (error) {
		console.error('Unable to record visit', error);
		return json({ configured: true, total: null, page: null, error: 'Visit count unavailable' }, { status: 503, headers: responseHeaders });
	}
};
