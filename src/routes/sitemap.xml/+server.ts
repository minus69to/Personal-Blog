import type { RequestHandler } from './$types';
import { categoryDetails } from '$lib/data/categories';
import { posts } from '$lib/data/posts';

const origin = 'https://insomniyuck.me';

function escapeXml(value: string) {
	return value.replace(/[<>&'\"]/g, (character) => ({
		'<': '&lt;',
		'>': '&gt;',
		'&': '&amp;',
		"'": '&apos;',
		'"': '&quot;'
	})[character] ?? character);
}

export const GET: RequestHandler = () => {
	const publicPages = ['/', '/archive', '/about', ...Object.keys(categoryDetails).map((category) => `/${category}`)];
	const pageEntries = publicPages.map((path) => `<url><loc>${escapeXml(`${origin}${path}`)}</loc></url>`);
	const postEntries = posts.map((post) => [
		'<url>',
		`<loc>${escapeXml(`${origin}/post/${post.slug}`)}</loc>`,
		`<lastmod>${escapeXml(post.date)}</lastmod>`,
		'</url>'
	].join(''));
	const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${[...pageEntries, ...postEntries].join('')}</urlset>\n`;

	return new Response(sitemap, {
		headers: {
			'content-type': 'application/xml; charset=utf-8',
			'cache-control': 'public, max-age=3600'
		}
	});
};
