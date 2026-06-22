import type { RequestHandler } from './$types';

const robots = `User-agent: *
Allow: /
Disallow: /studio
Disallow: /api/

Sitemap: https://insomniyuck.me/sitemap.xml
`;

export const GET: RequestHandler = () => new Response(robots, {
	headers: {
		'content-type': 'text/plain; charset=utf-8',
		'cache-control': 'public, max-age=3600'
	}
});
