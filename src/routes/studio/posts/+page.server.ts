import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { ContentPostError, listContentPosts } from '$lib/server/contentPosts';
import { auditStaticPostImports } from '$lib/server/staticPostImports';
import { hasStudioSession } from '$lib/server/studioAuth';

export const load: PageServerLoad = async ({ cookies }) => {
	if (!(await hasStudioSession(cookies))) redirect(303, '/studio/login');
	try {
		const [posts, migration] = await Promise.all([listContentPosts(), auditStaticPostImports()]);
		return { posts, migration, error: '' };
	} catch (error) {
		const message = error instanceof ContentPostError ? error.message : 'Unable to open the post archive';
		return { posts: [], migration: { total: 0, ready: [], conflicts: [] }, error: message };
	}
};
