import { error } from '@sveltejs/kit';
import { getPost } from '$lib/data/posts';

export async function load({ params }) {
	const entry = await getPost(params.slug);
	if (!entry) error(404, 'Memory not found');
	return entry;
}
