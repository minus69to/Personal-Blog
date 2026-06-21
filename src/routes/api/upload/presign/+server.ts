import { env } from '$env/dynamic/private';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createPresignedUpload, r2Configured, uploadAuthorizationConfigured, validateUpload } from '$lib/server/r2';
import { hasStudioSession } from '$lib/server/studioAuth';

async function digest(value: string) {
	return new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)));
}

async function authorized(header: string | null) {
	const provided = header?.match(/^Bearer\s+(.+)$/i)?.[1] ?? '';
	const expected = env.MEDIA_UPLOAD_TOKEN ?? '';
	if (expected.length < 32) return false;
	const [providedHash, expectedHash] = await Promise.all([digest(provided), digest(expected)]);
	let difference = 0;
	for (let index = 0; index < expectedHash.length; index += 1) difference |= providedHash[index] ^ expectedHash[index];
	return difference === 0;
}

export const POST: RequestHandler = async ({ request, cookies }) => {
	if (!r2Configured() || !uploadAuthorizationConfigured()) {
		return json({ error: 'Media uploads are not configured' }, { status: 503 });
	}
	if (!(await authorized(request.headers.get('authorization'))) && !(await hasStudioSession(cookies))) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const input = validateUpload(await request.json());
		return json(await createPresignedUpload(input), {
			headers: { 'cache-control': 'no-store, max-age=0' }
		});
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unable to prepare upload';
		const configurationError = message === 'R2 is not configured';
		return json(
			{ error: configurationError ? 'Media uploads are not configured' : message },
			{ status: configurationError ? 503 : 400 }
		);
	}
};
