import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { ContentPostError, deleteContentPost, getContentPost, updateContentPost } from '$lib/server/contentPosts';
import { hasStudioSession } from '$lib/server/studioAuth';

function failure(error: unknown) {
	const status = error instanceof ContentPostError ? error.status : 500;
	const message = error instanceof Error ? error.message : 'Unable to access post';
	return json({ error: status === 500 ? 'Unable to access post' : message }, { status });
}

function validSlug(slug: string) {
	if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new ContentPostError('Invalid post slug');
	return slug;
}

export const GET: RequestHandler = async ({ cookies, params }) => {
	if (!(await hasStudioSession(cookies))) return json({ error: 'Unauthorized' }, { status: 401 });
	try {
		const post = await getContentPost(validSlug(params.slug));
		if (!post) throw new ContentPostError('Post not found', 404);
		return json({ post }, { headers: { 'cache-control': 'no-store' } });
	} catch (error) {
		return failure(error);
	}
};

export const PUT: RequestHandler = async ({ cookies, params, request }) => {
	if (!(await hasStudioSession(cookies))) return json({ error: 'Unauthorized' }, { status: 401 });
	try {
		const post = await updateContentPost(validSlug(params.slug), await request.json());
		return json({ post }, { headers: { 'cache-control': 'no-store' } });
	} catch (error) {
		return failure(error);
	}
};

export const DELETE: RequestHandler = async ({ cookies, params }) => {
	if (!(await hasStudioSession(cookies))) return json({ error: 'Unauthorized' }, { status: 401 });
	try {
		await deleteContentPost(validSlug(params.slug));
		return new Response(null, { status: 204, headers: { 'cache-control': 'no-store' } });
	} catch (error) {
		return failure(error);
	}
};
