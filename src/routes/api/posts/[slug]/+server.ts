import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getPublicPost } from '$lib/server/publicPosts';

export const GET: RequestHandler = async ({ params }) => {
	if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(params.slug)) return json({ error: 'Post not found' }, { status: 404 });
	const entry = await getPublicPost(params.slug);
	if (entry?.source === 'hidden') return json({ error: 'Post not found' }, { status: 410 });
	if (!entry || entry.source !== 'database') return json({ error: 'Post not found' }, { status: 404 });
	return json({ post: entry.post, body: entry.body }, {
		headers: { 'cache-control': 'public, max-age=0, s-maxage=60, stale-while-revalidate=300' }
	});
};
