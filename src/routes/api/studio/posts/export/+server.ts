import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getContentPostBatch, listContentPostSlugs, listDeletedContentSlugs } from '$lib/server/contentPosts';
import { hasStudioSession } from '$lib/server/studioAuth';

const BATCH_SIZE = 20;

export const GET: RequestHandler = async ({ cookies }) => {
	if (!(await hasStudioSession(cookies))) return json({ error: 'Unauthorized' }, { status: 401 });

	try {
		const [slugs, deletedSlugs] = await Promise.all([listContentPostSlugs(), listDeletedContentSlugs()]);
		const exportedAt = new Date().toISOString();
		const encoder = new TextEncoder();
		const stream = new ReadableStream<Uint8Array>({
			async start(controller) {
				try {
					controller.enqueue(encoder.encode(JSON.stringify({ schemaVersion: 1, exportedAt, postCount: slugs.length, deletedSlugs }).slice(0, -1) + ',"posts":['));
					let first = true;
					for (let index = 0; index < slugs.length; index += BATCH_SIZE) {
						const posts = await getContentPostBatch(slugs.slice(index, index + BATCH_SIZE));
						for (const post of posts) {
							controller.enqueue(encoder.encode(`${first ? '' : ','}${JSON.stringify(post)}`));
							first = false;
						}
					}
					controller.enqueue(encoder.encode(']}\n'));
					controller.close();
				} catch (error) {
					controller.error(error);
				}
			}
		});
		const date = exportedAt.slice(0, 10);
		return new Response(stream, {
			headers: {
				'content-type': 'application/json; charset=utf-8',
				'content-disposition': `attachment; filename="insomniyuck-posts-${date}.json"`,
				'cache-control': 'no-store, max-age=0',
				'x-content-type-options': 'nosniff'
			}
		});
	} catch (error) {
		return json({ error: error instanceof Error ? error.message : 'Unable to create backup' }, { status: 500 });
	}
};
