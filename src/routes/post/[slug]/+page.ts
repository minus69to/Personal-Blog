import { error } from '@sveltejs/kit';
import { getPost } from '$lib/data/posts';
import { parseMarkdownBlocks } from '$lib/data/markdown';


export async function load({ params, fetch }) {
	const response = await fetch(`/api/posts/${params.slug}`);
	if (response.status === 410) error(404, 'Memory not found');
	if (response.ok) {
		const entry = await response.json();
		return { post: entry.post, content: null, blocks: parseMarkdownBlocks(entry.body), source: 'database' as const };
	}
	const entry = await getPost(params.slug);
	if (!entry) error(404, 'Memory not found');
	return { ...entry, blocks: null, source: 'static' as const };
}
