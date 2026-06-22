import { env } from '$env/dynamic/private';
import { Redis } from '@upstash/redis';

const TOTAL_KEY = 'insomniyuck:visits:total';
const PAGE_PREFIX = 'insomniyuck:visits:page:';

let client: Redis | undefined;

function credentials() {
	return {
		url: env.UPSTASH_REDIS_REST_URL || env.UPSTASH_REDIS_REST_KV_REST_API_URL,
		token: env.UPSTASH_REDIS_REST_TOKEN || env.UPSTASH_REDIS_REST_KV_REST_API_TOKEN
	};
}

export function visitsConfigured() {
	const { url, token } = credentials();
	return Boolean(url && token);
}

function redis() {
	const { url, token } = credentials();
	if (!url || !token) return undefined;
	client ??= new Redis({
		url,
		token,
		enableAutoPipelining: true
	});
	return client;
}

export function cleanPagePath(value: unknown) {
	if (typeof value !== 'string') return '/';
	const path = value.trim().slice(0, 160);
	if (!path.startsWith('/') || path.includes('..')) return '/';
	return path.replace(/[^a-zA-Z0-9/_-]/g, '') || '/';
}

export async function readVisits(path: string) {
	const database = redis();
	if (!database) return { configured: false as const, total: null, page: null };

	const [total, page] = await Promise.all([
		database.get<number>(TOTAL_KEY),
		database.get<number>(`${PAGE_PREFIX}${path}`)
	]);

	return { configured: true as const, total: total ?? 0, page: page ?? 0 };
}

export async function recordVisit(path: string) {
	const database = redis();
	if (!database) return { configured: false as const, total: null, page: null };

	const transaction = database.multi();
	transaction.incr(TOTAL_KEY);
	transaction.incr(`${PAGE_PREFIX}${path}`);
	const [total, page] = await transaction.exec<[number, number]>();

	return { configured: true as const, total, page };
}
