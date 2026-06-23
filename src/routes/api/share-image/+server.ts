import { env } from '$env/dynamic/private';
import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

const MAX_IMAGE_SIZE = 15 * 1024 * 1024;
const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif']);

function allowedTarget(value: string | null) {
	if (!value || !env.R2_PUBLIC_URL) return undefined;
	try {
		const target = new URL(value);
		const publicBase = new URL(env.R2_PUBLIC_URL.endsWith('/') ? env.R2_PUBLIC_URL : `${env.R2_PUBLIC_URL}/`);
		if (target.protocol !== 'https:' || target.origin !== publicBase.origin || !target.pathname.startsWith(publicBase.pathname)) return undefined;
		return target;
	} catch {
		return undefined;
	}
}

export const GET: RequestHandler = async ({ url, fetch }) => {
	const target = allowedTarget(url.searchParams.get('url'));
	if (!target) error(400, 'Unsupported story image');

	const response = await fetch(target, { headers: { accept: 'image/*' } });
	if (!response.ok) error(502, 'Unable to load story image');

	const contentType = response.headers.get('content-type')?.split(';')[0].toLowerCase() ?? '';
	const declaredSize = Number(response.headers.get('content-length') ?? 0);
	if (!IMAGE_TYPES.has(contentType) || declaredSize > MAX_IMAGE_SIZE) error(415, 'Unsupported story image');

	const image = await response.arrayBuffer();
	if (image.byteLength > MAX_IMAGE_SIZE) error(413, 'Story image is too large');

	return new Response(image, {
		headers: {
			'content-type': contentType,
			'cache-control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800',
			'content-length': String(image.byteLength),
			'x-content-type-options': 'nosniff'
		}
	});
};
