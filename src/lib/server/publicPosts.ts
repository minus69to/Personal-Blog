import { getPost, posts as staticPosts, type Post } from '$lib/data/posts';
import { contentPostsConfigured, getContentPost, listContentPosts, listDeletedContentSlugs, type ContentPostSummary } from './contentPosts';

function metadata(post: ContentPostSummary): Post {
	return {
		title: post.title,
		slug: post.slug,
		date: post.date,
		language: post.language,
		category: post.category,
		tags: post.tags,
		excerpt: post.excerpt,
		coverTone: post.coverTone,
		coverImage: post.coverImage,
		gallery: post.gallery,
		videos: post.videos,
		location: post.location,
		rating: post.rating,
		quote: post.quote,
		source: post.source,
		featured: post.featured,
		contentPath: `database:${post.slug}`
	};
}

async function databaseState() {
	if (!contentPostsConfigured()) return { posts: [] as ContentPostSummary[], deletedSlugs: [] as string[] };
	try {
		const [posts, deletedSlugs] = await Promise.all([listContentPosts(), listDeletedContentSlugs()]);
		return { posts, deletedSlugs };
	} catch {
		// Static posts remain available if the content database is temporarily unreachable.
		return { posts: [] as ContentPostSummary[], deletedSlugs: [] as string[] };
	}
}

export async function listPublicPosts() {
	const { posts: databasePosts, deletedSlugs } = await databaseState();
	const occupiedSlugs = new Set(databasePosts.map((post) => post.slug));
	const hiddenSlugs = new Set(deletedSlugs);
	return [
		...databasePosts.filter((post) => post.status === 'published').map(metadata),
		...staticPosts.filter((post) => !occupiedSlugs.has(post.slug) && !hiddenSlugs.has(post.slug))
	].sort((left, right) => Date.parse(right.date) - Date.parse(left.date));
}

export async function getPublicPost(slug: string) {
	if (contentPostsConfigured()) {
		try {
			const databasePost = await getContentPost(slug);
			if (databasePost?.status === 'published') {
				return { post: metadata(databasePost), body: databasePost.body, source: 'database' as const };
			}
			if (databasePost) return { source: 'hidden' as const };
			if ((await listDeletedContentSlugs()).includes(slug)) return { source: 'hidden' as const };
		} catch {
			// Fall through to a static post when possible.
		}
	}
	const staticPost = await getPost(slug);
	return staticPost ? { ...staticPost, body: null, source: 'static' as const } : undefined;
}
