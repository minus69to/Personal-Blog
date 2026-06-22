import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { importStaticPosts } from '$lib/server/staticPostImports';
import { hasStudioSession } from '$lib/server/studioAuth';

export const POST: RequestHandler = async ({ cookies }) => {
	if (!(await hasStudioSession(cookies))) return json({ error: 'Unauthorized' }, { status: 401 });
	try {
		const result = await importStaticPosts();
		return json(result, { status: result.failed.length ? 207 : 200, headers: { 'cache-control': 'no-store' } });
	} catch (error) {
		return json({ error: error instanceof Error ? error.message : 'Unable to import static posts' }, { status: 500 });
	}
};
