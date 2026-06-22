import type { Component } from 'svelte';

export const categoryNames = {
	food: 'Food Diary',
	travel: 'Travel Journal',
	running: 'Running & Marathon',
	books: 'Books',
	movies: 'Movies',
	thoughts: 'Thoughts',
	life: 'Life Notes',
	quotes: 'Quotes'
} as const;

export type Category = keyof typeof categoryNames;
export type CoverTone = 'clay' | 'forest' | 'dawn' | 'ink' | 'plum' | 'sand' | 'mist';

export type Post = {
	title: string;
	slug: string;
	date: string;
	language: 'en' | 'bn';
	category: Category;
	tags: string[];
	excerpt: string;
	coverTone: CoverTone;
	coverImage?: string;
	gallery: string[];
	videos: string[];
	location?: string;
	rating?: number;
	quote?: string;
	source?: string;
	featured: boolean;
	contentPath: string;
};

type ContentModule = {
	metadata: Record<string, unknown>;
	default: Component;
};

const contentModules = import.meta.glob('/content/posts/**/*.svx', { eager: true }) as Record<
	string,
	ContentModule
>;

const categories = Object.keys(categoryNames) as Category[];
const coverTones: CoverTone[] = ['clay', 'forest', 'dawn', 'ink', 'plum', 'sand', 'mist'];

function requiredString(value: unknown, field: string, path: string) {
	if (typeof value !== 'string' || value.trim() === '') {
		throw new Error(`${path}: frontmatter field "${field}" must be a non-empty string`);
	}
	return value;
}

function stringList(value: unknown, field: string, path: string) {
	if (value === undefined) return [];
	if (!Array.isArray(value) || value.some((item) => typeof item !== 'string')) {
		throw new Error(`${path}: frontmatter field "${field}" must be a list of strings`);
	}
	return value as string[];
}

function parsePost(value: unknown, contentPath: string): Post {
	if (!value || typeof value !== 'object') {
		throw new Error(`${contentPath}: missing frontmatter`);
	}

	const meta = value as Record<string, unknown>;
	const category = requiredString(meta.category, 'category', contentPath);
	const coverTone = requiredString(meta.coverTone, 'coverTone', contentPath);
	const date = requiredString(meta.date, 'date', contentPath);

	if (!categories.includes(category as Category)) {
		throw new Error(`${contentPath}: unknown category "${category}"`);
	}
	if (!coverTones.includes(coverTone as CoverTone)) {
		throw new Error(`${contentPath}: unknown cover tone "${coverTone}"`);
	}
	if (Number.isNaN(Date.parse(date))) {
		throw new Error(`${contentPath}: frontmatter field "date" must be a valid date`);
	}
	if (meta.rating !== undefined && (typeof meta.rating !== 'number' || meta.rating < 0 || meta.rating > 5)) {
		throw new Error(`${contentPath}: rating must be a number from 0 to 5`);
	}

	return {
		title: requiredString(meta.title, 'title', contentPath),
		slug: requiredString(meta.slug, 'slug', contentPath),
		date,
		language: meta.language === 'bn' ? 'bn' : 'en',
		category: category as Category,
		tags: stringList(meta.tags, 'tags', contentPath),
		excerpt: requiredString(meta.excerpt, 'excerpt', contentPath),
		coverTone: coverTone as CoverTone,
		coverImage: typeof meta.coverImage === 'string' ? meta.coverImage : undefined,
		gallery: stringList(meta.gallery, 'gallery', contentPath),
		videos: stringList(meta.videos, 'videos', contentPath),
		location: typeof meta.location === 'string' ? meta.location : undefined,
		rating: typeof meta.rating === 'number' ? meta.rating : undefined,
		quote: typeof meta.quote === 'string' ? meta.quote : undefined,
		source: typeof meta.source === 'string' ? meta.source : undefined,
		featured: meta.featured === true,
		contentPath
	};
}

export const posts = Object.entries(contentModules)
	.map(([path, module]) => parsePost(module.metadata, path))
	.sort((a, b) => Date.parse(b.date) - Date.parse(a.date));

const duplicateSlug = posts.find((post, index) => posts.findIndex((item) => item.slug === post.slug) !== index);
if (duplicateSlug) throw new Error(`Duplicate post slug: "${duplicateSlug.slug}"`);

export async function getPost(slug: string) {
	const post = posts.find((entry) => entry.slug === slug);
	if (!post) return undefined;

	const module = contentModules[post.contentPath];
	if (!module) throw new Error(`No content module found for ${post.contentPath}`);

	return { post, content: module.default };
}

export function formatDate(date: string) {
	return new Intl.DateTimeFormat('en', {
		day: 'numeric',
		month: 'long',
		year: 'numeric',
		timeZone: 'UTC'
	}).format(new Date(date));
}
