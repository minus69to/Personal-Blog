import { dev } from '$app/environment';
import { env } from '$env/dynamic/private';
import { Redis } from '@upstash/redis';

const categories = ['food', 'travel', 'running', 'books', 'movies', 'thoughts', 'life', 'quotes'] as const;
const coverTones = ['clay', 'forest', 'dawn', 'ink', 'plum', 'sand', 'mist'] as const;
const statuses = ['draft', 'published'] as const;

export type ContentPost = {
	title: string;
	slug: string;
	date: string;
	language: 'en' | 'bn';
	category: (typeof categories)[number];
	tags: string[];
	excerpt: string;
	coverTone: (typeof coverTones)[number];
	coverImage?: string;
	gallery: string[];
	videos: string[];
	location?: string;
	rating?: number;
	quote?: string;
	source?: string;
	featured: boolean;
	body: string;
	status: (typeof statuses)[number];
	createdAt: string;
	updatedAt: string;
};

export type ContentPostInput = Omit<ContentPost, 'createdAt' | 'updatedAt'>;
export type ContentPostSummary = Omit<ContentPost, 'body'>;

export class ContentPostError extends Error {
	constructor(message: string, readonly status = 400) {
		super(message);
	}
}

let client: Redis | undefined;

function credentials() {
	return {
		url: env.UPSTASH_REDIS_REST_URL || env.UPSTASH_REDIS_REST_KV_REST_API_URL,
		token: env.UPSTASH_REDIS_REST_TOKEN || env.UPSTASH_REDIS_REST_KV_REST_API_TOKEN
	};
}

function namespace() {
	const custom = env.CONTENT_NAMESPACE?.trim();
	return custom || `insomniyuck:content:${dev ? 'dev' : 'production'}`;
}

function listKey() {
	return `${namespace()}:slugs`;
}

function deletedKey() {
	return `${namespace()}:deleted-slugs`;
}

function postKey(slug: string) {
	return `${namespace()}:post:${slug}`;
}

function summaryKey(slug: string) {
	return `${namespace()}:summary:${slug}`;
}

function summary(post: ContentPost): ContentPostSummary {
	const { body: _body, ...postSummary } = post;
	return postSummary;
}

function database() {
	const { url, token } = credentials();
	if (!url || !token) throw new ContentPostError('Content database is not configured', 503);
	client ??= new Redis({ url, token, enableAutoPipelining: true });
	return client;
}

export function contentPostsConfigured() {
	const { url, token } = credentials();
	return Boolean(url && token);
}

function object(value: unknown) {
	if (!value || typeof value !== 'object' || Array.isArray(value)) {
		throw new ContentPostError('Post must be a JSON object');
	}
	return value as Record<string, unknown>;
}

function text(value: unknown, field: string, maximum: number) {
	if (typeof value !== 'string' || value.trim() === '') throw new ContentPostError(`${field} is required`);
	const clean = value.trim();
	if (clean.length > maximum) throw new ContentPostError(`${field} is too long`);
	return clean;
}

function optionalText(value: unknown, field: string, maximum: number) {
	if (value === undefined || value === null || value === '') return undefined;
	return text(value, field, maximum);
}

function list(value: unknown, field: string, maximumItems: number) {
	if (!Array.isArray(value) || value.some((item) => typeof item !== 'string')) {
		throw new ContentPostError(`${field} must be a list of text values`);
	}
	if (value.length > maximumItems) throw new ContentPostError(`${field} has too many items`);
	return value.map((item) => item.trim()).filter(Boolean);
}

function mediaList(value: unknown, field: string, maximumItems: number) {
	const values = list(value, field, maximumItems);
	for (const item of values) {
		if (!/^https:\/\//i.test(item)) throw new ContentPostError(`${field} must contain HTTPS URLs`);
	}
	return values;
}

function member<T extends readonly string[]>(value: unknown, field: string, values: T): T[number] {
	if (typeof value !== 'string' || !values.includes(value)) {
		throw new ContentPostError(`${field} is invalid`);
	}
	return value as T[number];
}

export function validateContentPost(value: unknown, expectedSlug?: string): ContentPostInput {
	const input = object(value);
	const slug = text(input.slug, 'slug', 80).toLowerCase();
	if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
		throw new ContentPostError('slug must contain lowercase letters, numbers, and hyphens only');
	}
	if (expectedSlug && slug !== expectedSlug) throw new ContentPostError('A post slug cannot be changed');

	const date = text(input.date, 'date', 10);
	if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(`${date}T00:00:00Z`))) {
		throw new ContentPostError('date must use YYYY-MM-DD');
	}
	const rating = input.rating === undefined || input.rating === null || input.rating === ''
		? undefined
		: Number(input.rating);
	if (rating !== undefined && (!Number.isFinite(rating) || rating < 0 || rating > 5)) {
		throw new ContentPostError('rating must be between 0 and 5');
	}

	const coverImage = optionalText(input.coverImage, 'coverImage', 2048);
	if (coverImage && !/^https:\/\//i.test(coverImage)) throw new ContentPostError('coverImage must be an HTTPS URL');

	return {
		title: text(input.title, 'title', 180),
		slug,
		date,
		language: member(input.language ?? 'en', 'language', ['en', 'bn'] as const),
		category: member(input.category, 'category', categories),
		tags: list(input.tags ?? [], 'tags', 24).map((tag) => text(tag, 'tag', 60)),
		excerpt: text(input.excerpt, 'excerpt', 500),
		coverTone: member(input.coverTone, 'coverTone', coverTones),
		coverImage,
		gallery: mediaList(input.gallery ?? [], 'gallery', 100),
		videos: mediaList(input.videos ?? [], 'videos', 30),
		location: optionalText(input.location, 'location', 120),
		rating,
		quote: optionalText(input.quote, 'quote', 1000),
		source: optionalText(input.source, 'source', 240),
		featured: input.featured === true,
		body: text(input.body, 'body', 250_000),
		status: member(input.status ?? 'draft', 'status', statuses)
	};
}

export async function listContentPosts() {
	const redis = database();
	const slugs = await redis.smembers<string[]>(listKey());
	if (slugs.length === 0) return [];
	const records = await redis.mget<(ContentPostSummary | null)[]>(...slugs.map(summaryKey));
	const missingSlugs = slugs.filter((_, index) => !records[index]);
	if (missingSlugs.length) {
		const legacyPosts = await redis.mget<(ContentPost | null)[]>(...missingSlugs.map(postKey));
		for (let index = 0; index < missingSlugs.length; index += 1) {
			const post = legacyPosts[index];
			if (!post) continue;
			const postSummary = summary(post);
			records[slugs.indexOf(missingSlugs[index])] = postSummary;
			await redis.set(summaryKey(post.slug), postSummary);
		}
	}
	return records
		.filter((post): post is ContentPostSummary => Boolean(post))
		.sort((left, right) => Date.parse(right.date) - Date.parse(left.date) || right.updatedAt.localeCompare(left.updatedAt));
}

export async function getContentPost(slug: string) {
	return database().get<ContentPost>(postKey(slug));
}

export async function listContentPostSlugs() {
	return (await listContentPosts()).map((post) => post.slug);
}

export async function listDeletedContentSlugs() {
	return database().smembers<string[]>(deletedKey());
}

export async function getContentPostBatch(slugs: string[]) {
	if (slugs.length === 0) return [];
	return (await database().mget<(ContentPost | null)[]>(...slugs.map(postKey)))
		.filter((post): post is ContentPost => Boolean(post));
}

function validTimestamp(value: unknown, fallback: string) {
	if (typeof value !== 'string' || Number.isNaN(Date.parse(value))) return fallback;
	return new Date(value).toISOString();
}

export async function restoreContentPostBatch(values: unknown[], overwrite = false) {
	if (!Array.isArray(values) || values.length === 0 || values.length > 20) {
		throw new ContentPostError('Restore batches must contain between 1 and 20 posts');
	}
	const now = new Date().toISOString();
	const restored = values.map((value) => {
		const input = validateContentPost(value);
		const record = value as Record<string, unknown>;
		return {
			...input,
			createdAt: validTimestamp(record.createdAt, now),
			updatedAt: validTimestamp(record.updatedAt, now)
		} satisfies ContentPost;
	});
	if (new Set(restored.map((post) => post.slug)).size !== restored.length) {
		throw new ContentPostError('A restore batch contains duplicate post slugs');
	}

	const redis = database();
	const existing = await redis.mget<(ContentPost | null)[]>(...restored.map((post) => postKey(post.slug)));
	const transaction = redis.multi();
	const imported: string[] = [];
	const replaced: string[] = [];
	const skipped: string[] = [];
	for (let index = 0; index < restored.length; index += 1) {
		const post = restored[index];
		if (existing[index] && !overwrite) {
			skipped.push(post.slug);
			continue;
		}
		if (existing[index]) replaced.push(post.slug);
		else imported.push(post.slug);
		transaction.set(postKey(post.slug), post);
		transaction.set(summaryKey(post.slug), summary(post));
		transaction.sadd(listKey(), post.slug);
		transaction.srem(deletedKey(), post.slug);
	}
	if (imported.length || replaced.length) await transaction.exec();
	return { imported, replaced, skipped };
}

export async function restoreDeletedContentSlugs(values: unknown[]) {
	if (!Array.isArray(values) || values.length > 5000) throw new ContentPostError('Deleted slugs are invalid');
	const slugs = values.map((value) => {
		if (typeof value !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)) {
			throw new ContentPostError('A deleted post slug is invalid');
		}
		return value;
	});
	if (slugs.length) {
		const transaction = database().multi();
		for (const slug of slugs) transaction.sadd(deletedKey(), slug);
		await transaction.exec();
	}
	return slugs.length;
}

export async function createContentPost(value: unknown) {
	const input = validateContentPost(value);
	const redis = database();
	if (await redis.exists(postKey(input.slug))) throw new ContentPostError('A post with this slug already exists', 409);
	const now = new Date().toISOString();
	const post: ContentPost = { ...input, createdAt: now, updatedAt: now };
	const transaction = redis.multi();
	transaction.set(postKey(post.slug), post);
	transaction.set(summaryKey(post.slug), summary(post));
	transaction.sadd(listKey(), post.slug);
	transaction.srem(deletedKey(), post.slug);
	await transaction.exec();
	return post;
}

export async function updateContentPost(slug: string, value: unknown) {
	const redis = database();
	const current = await redis.get<ContentPost>(postKey(slug));
	if (!current) throw new ContentPostError('Post not found', 404);
	const input = validateContentPost(value, slug);
	const post: ContentPost = { ...input, createdAt: current.createdAt, updatedAt: new Date().toISOString() };
	const transaction = redis.multi();
	transaction.set(postKey(slug), post);
	transaction.set(summaryKey(slug), summary(post));
	await transaction.exec();
	return post;
}

export async function deleteContentPost(slug: string) {
	const redis = database();
	const transaction = redis.multi();
	transaction.del(postKey(slug));
	transaction.del(summaryKey(slug));
	transaction.srem(listKey(), slug);
	transaction.sadd(deletedKey(), slug);
	await transaction.exec();
}
