import { createContentPost, getContentPost, validateContentPost, type ContentPostInput } from './contentPosts';

const rawPostModules = import.meta.glob('/content/posts/**/*.svx', {
	eager: true,
	query: '?raw',
	import: 'default'
}) as Record<string, string>;

function parseValue(raw: string): unknown {
	const value = raw.trim();
	if (value === 'true') return true;
	if (value === 'false') return false;
	if (/^-?\d+(?:\.\d+)?$/.test(value)) return Number(value);
	if (value.startsWith("'") && value.endsWith("'")) return value.slice(1, -1).replace(/''/g, "'");
	if (value.startsWith('"') && value.endsWith('"')) {
		try { return JSON.parse(value); } catch { return value.slice(1, -1); }
	}
	if (value.startsWith('[') && value.endsWith(']')) {
		const contents = value.slice(1, -1).trim();
		return contents ? contents.split(',').map((item) => String(parseValue(item)).trim()).filter(Boolean) : [];
	}
	return value;
}

function parseStaticPost(source: string, path: string): ContentPostInput {
	const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
	if (!match) throw new Error(`${path} has invalid frontmatter`);
	const metadata: Record<string, unknown> = {};
	for (const line of match[1].split(/\r?\n/)) {
		const divider = line.indexOf(':');
		if (divider < 1) continue;
		metadata[line.slice(0, divider).trim()] = parseValue(line.slice(divider + 1));
	}
	return validateContentPost({
		...metadata,
		language: metadata.language ?? 'en',
		gallery: metadata.gallery ?? [],
		videos: metadata.videos ?? [],
		body: match[2].trim(),
		status: 'published'
	});
}

export function staticPostInputs() {
	return Object.entries(rawPostModules)
		.map(([path, source]) => ({ path, post: parseStaticPost(source, path) }))
		.sort((left, right) => left.post.slug.localeCompare(right.post.slug));
}

export async function auditStaticPostImports() {
	const inputs = staticPostInputs();
	const existing = await Promise.all(inputs.map(({ post }) => getContentPost(post.slug)));
	return {
		total: inputs.length,
		ready: inputs.filter((_, index) => !existing[index]).map(({ post }) => post.slug),
		conflicts: inputs.filter((_, index) => Boolean(existing[index])).map(({ post }) => post.slug)
	};
}

export async function importStaticPosts() {
	const imported: string[] = [];
	const skipped: string[] = [];
	const failed: { slug: string; error: string }[] = [];
	for (const { post } of staticPostInputs()) {
		if (await getContentPost(post.slug)) {
			skipped.push(post.slug);
			continue;
		}
		try {
			await createContentPost(post);
			imported.push(post.slug);
		} catch (error) {
			failed.push({ slug: post.slug, error: error instanceof Error ? error.message : 'Import failed' });
		}
	}
	return { imported, skipped, failed };
}
