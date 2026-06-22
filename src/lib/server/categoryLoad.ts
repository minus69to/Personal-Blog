import type { Category } from '$lib/data/posts';
import { listPublicPosts } from './publicPosts';

export async function loadPublicCategory(category: Category) {
	return { posts: (await listPublicPosts()).filter((post) => post.category === category) };
}
