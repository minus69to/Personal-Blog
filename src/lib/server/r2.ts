import { env } from '$env/dynamic/private';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const IMAGE_LIMIT = 15 * 1024 * 1024;
const VIDEO_LIMIT = 250 * 1024 * 1024;
const URL_LIFETIME_SECONDS = 5 * 60;

const fileTypes = {
	'image/jpeg': { extension: 'jpg', kind: 'image', maxSize: IMAGE_LIMIT },
	'image/png': { extension: 'png', kind: 'image', maxSize: IMAGE_LIMIT },
	'image/webp': { extension: 'webp', kind: 'image', maxSize: IMAGE_LIMIT },
	'image/avif': { extension: 'avif', kind: 'image', maxSize: IMAGE_LIMIT },
	'image/gif': { extension: 'gif', kind: 'image', maxSize: IMAGE_LIMIT },
	'video/mp4': { extension: 'mp4', kind: 'video', maxSize: VIDEO_LIMIT },
	'video/webm': { extension: 'webm', kind: 'video', maxSize: VIDEO_LIMIT },
	'video/quicktime': { extension: 'mov', kind: 'video', maxSize: VIDEO_LIMIT }
} as const;

type AllowedType = keyof typeof fileTypes;

let client: S3Client | undefined;

function configuration() {
	const config = {
		accountId: env.R2_ACCOUNT_ID,
		accessKeyId: env.R2_ACCESS_KEY_ID,
		secretAccessKey: env.R2_SECRET_ACCESS_KEY,
		bucket: env.R2_BUCKET_NAME,
		publicUrl: env.R2_PUBLIC_URL
	};
	if (Object.values(config).some((value) => !value)) throw new Error('R2 is not configured');
	return config as Record<keyof typeof config, string>;
}

export function r2Configured() {
	return Boolean(
		env.R2_ACCOUNT_ID &&
		env.R2_ACCESS_KEY_ID &&
		env.R2_SECRET_ACCESS_KEY &&
		env.R2_BUCKET_NAME &&
		env.R2_PUBLIC_URL
	);
}

export function uploadAuthorizationConfigured() {
	return Boolean(env.MEDIA_UPLOAD_TOKEN && env.MEDIA_UPLOAD_TOKEN.length >= 32);
}

function s3() {
	const config = configuration();
	client ??= new S3Client({
		region: 'auto',
		endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
		credentials: {
			accessKeyId: config.accessKeyId,
			secretAccessKey: config.secretAccessKey
		}
	});
	return client;
}

function safeName(filename: string) {
	const withoutExtension = filename.replace(/\.[^.]+$/, '');
	return withoutExtension
		.normalize('NFKD')
		.replace(/[^a-zA-Z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '')
		.toLowerCase()
		.slice(0, 70) || 'memory';
}

function safeFolder(folder: unknown) {
	if (typeof folder !== 'string') return 'general';
	return folder.replace(/[^a-zA-Z0-9_-]/g, '').toLowerCase().slice(0, 32) || 'general';
}

export function validateUpload(input: unknown) {
	if (!input || typeof input !== 'object') throw new Error('Upload details are required');
	const data = input as Record<string, unknown>;
	if (typeof data.filename !== 'string' || data.filename.trim() === '') throw new Error('A filename is required');
	if (typeof data.contentType !== 'string' || !(data.contentType in fileTypes)) throw new Error('Unsupported image or video type');
	if (typeof data.size !== 'number' || !Number.isSafeInteger(data.size) || data.size <= 0) throw new Error('A valid file size is required');

	const contentType = data.contentType as AllowedType;
	const type = fileTypes[contentType];
	if (data.size > type.maxSize) {
		const limit = Math.round(type.maxSize / 1024 / 1024);
		throw new Error(`${type.kind === 'image' ? 'Images' : 'Videos'} must be ${limit} MB or smaller`);
	}

	return {
		filename: safeName(data.filename),
		contentType,
		extension: type.extension,
		folder: safeFolder(data.folder)
	};
}

export async function createPresignedUpload(input: ReturnType<typeof validateUpload>) {
	const config = configuration();
	const date = new Date();
	const year = date.getUTCFullYear();
	const month = String(date.getUTCMonth() + 1).padStart(2, '0');
	const key = `media/${input.folder}/${year}/${month}/${crypto.randomUUID()}-${input.filename}.${input.extension}`;
	const command = new PutObjectCommand({
		Bucket: config.bucket,
		Key: key,
		ContentType: input.contentType
	});
	const uploadUrl = await getSignedUrl(s3(), command, { expiresIn: URL_LIFETIME_SECONDS });
	const publicBase = config.publicUrl.replace(/\/+$/, '');
	const publicUrl = `${publicBase}/${key.split('/').map(encodeURIComponent).join('/')}`;

	return {
		key,
		uploadUrl,
		publicUrl,
		expiresIn: URL_LIFETIME_SECONDS,
		requiredHeaders: { 'content-type': input.contentType }
	};
}
