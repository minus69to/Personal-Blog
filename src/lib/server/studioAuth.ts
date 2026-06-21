import { dev } from '$app/environment';
import { env } from '$env/dynamic/private';
import type { Cookies } from '@sveltejs/kit';

export const STUDIO_COOKIE = 'insomniyuck_studio';
const SESSION_SECONDS = 12 * 60 * 60;
const encoder = new TextEncoder();

function configuredSecret() {
	const secret = env.MEDIA_UPLOAD_TOKEN ?? '';
	return secret.length >= 32 ? secret : null;
}

function base64Url(bytes: Uint8Array) {
	const binary = Array.from(bytes, (byte) => String.fromCharCode(byte)).join('');
	return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function digest(value: string) {
	return new Uint8Array(await crypto.subtle.digest('SHA-256', encoder.encode(value)));
}

async function signature(payload: string, secret: string) {
	const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
	return base64Url(new Uint8Array(await crypto.subtle.sign('HMAC', key, encoder.encode(payload))));
}

function constantTimeEqual(left: string, right: string) {
	const length = Math.max(left.length, right.length);
	let difference = left.length ^ right.length;
	for (let index = 0; index < length; index += 1) {
		difference |= (left.charCodeAt(index) || 0) ^ (right.charCodeAt(index) || 0);
	}
	return difference === 0;
}

export function studioAuthConfigured() {
	return Boolean(configuredSecret());
}

export async function verifyStudioPassword(password: string) {
	const secret = configuredSecret();
	if (!secret) return false;
	const [provided, expected] = await Promise.all([digest(password), digest(secret)]);
	let difference = 0;
	for (let index = 0; index < expected.length; index += 1) difference |= provided[index] ^ expected[index];
	return difference === 0;
}

export async function createStudioSession(cookies: Cookies) {
	const secret = configuredSecret();
	if (!secret) throw new Error('Studio authentication is not configured');
	const expires = Math.floor(Date.now() / 1000) + SESSION_SECONDS;
	const payload = `${expires}.${crypto.randomUUID()}`;
	const token = `${payload}.${await signature(payload, secret)}`;
	cookies.set(STUDIO_COOKIE, token, {
		path: '/',
		httpOnly: true,
		sameSite: 'strict',
		secure: !dev,
		maxAge: SESSION_SECONDS
	});
}

export async function hasStudioSession(cookies: Cookies) {
	const secret = configuredSecret();
	const token = cookies.get(STUDIO_COOKIE);
	if (!secret || !token) return false;
	const parts = token.split('.');
	if (parts.length !== 3) return false;
	const [expires, nonce, suppliedSignature] = parts;
	if (!/^\d+$/.test(expires) || Number(expires) <= Math.floor(Date.now() / 1000)) return false;
	const payload = `${expires}.${nonce}`;
	return constantTimeEqual(suppliedSignature, await signature(payload, secret));
}

export function clearStudioSession(cookies: Cookies) {
	cookies.delete(STUDIO_COOKIE, { path: '/' });
}
