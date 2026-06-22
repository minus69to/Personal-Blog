import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { ContentPostError, restoreContentPostBatch, restoreDeletedContentSlugs } from '$lib/server/contentPosts';
import { hasStudioSession } from '$lib/server/studioAuth';

export const POST: RequestHandler = async ({ request, cookies }) => {
	if (!(await hasStudioSession(cookies))) return json({ error: 'Unauthorized' }, { status: 401 });
	try {
		const input = await request.json() as { posts?: unknown; deletedSlugs?: unknown; overwrite?: unknown };
		if (input.deletedSlugs !== undefined) {
			if (!Array.isArray(input.deletedSlugs)) throw new ContentPostError('Deleted slugs must be a list');
			const restored = await restoreDeletedContentSlugs(input.deletedSlugs);
			return json({ restoredDeletedSlugs: restored }, { headers: { 'cache-control': 'no-store' } });
		}
		if (!Array.isArray(input.posts)) throw new ContentPostError('Posts must be a list');
		return json(await restoreContentPostBatch(input.posts, input.overwrite === true), {
			headers: { 'cache-control': 'no-store' }
		});
	} catch (error) {
		const status = error instanceof ContentPostError ? error.status : 500;
		return json({ error: error instanceof Error ? error.message : 'Unable to restore backup' }, { status });
	}
};
