import type { PageServerLoad } from './$types';
import { listPublicPosts } from '$lib/server/publicPosts';

export const load: PageServerLoad = async () => ({ posts: await listPublicPosts() });
