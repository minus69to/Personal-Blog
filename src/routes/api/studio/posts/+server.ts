import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createContentPost, ContentPostError, listContentPosts } from '$lib/server/contentPosts';
import { hasStudioSession } from '$lib/server/studioAuth';

function failure(error: unknown) {
	const status = error instanceof ContentPostError ? error.status : 500;
	const message = error instanceof Error ? error.message : 'Unable to access posts';
	return json({ error: status === 500 ? 'Unable to access posts' : message }, { status });
}

export const GET: RequestHandler = async ({ cookies }) => {
	if (!(await hasStudioSession(cookies))) return json({ error: 'Unauthorized' }, { status: 401 });
	try {
		return json({ posts: await listContentPosts() }, { headers: { 'cache-control': 'no-store' } });
	} catch (error) {
		return failure(error);
	}
};

export const POST: RequestHandler = async ({ cookies, request }) => {
	if (!(await hasStudioSession(cookies))) return json({ error: 'Unauthorized' }, { status: 401 });
	try {
		return json({ post: await createContentPost(await request.json()) }, {
			status: 201,
			headers: { 'cache-control': 'no-store' }
		});
	} catch (error) {
		return failure(error);
	}
};
