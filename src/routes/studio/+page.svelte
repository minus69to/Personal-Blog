<script lang="ts">
	type UploadResult = { publicUrl: string; uploadUrl: string; requiredHeaders: Record<string, string> };

	const folders = ['general', 'food', 'travel', 'running', 'books', 'movies', 'thoughts', 'quotes'];
	let selected = $state<File | null>(null);
	let folder = $state('general');
	let preview = $state('');
	let phase = $state<'idle' | 'signing' | 'uploading' | 'done' | 'error'>('idle');
	let message = $state('');
	let publicUrl = $state('');
	let copied = $state(false);

	function formatSize(bytes: number) {
		return bytes < 1024 * 1024 ? `${Math.round(bytes / 1024)} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
	}

	function selectFile(event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		selected = input.files?.[0] ?? null;
		if (preview) URL.revokeObjectURL(preview);
		preview = selected ? URL.createObjectURL(selected) : '';
		phase = 'idle';
		message = '';
		publicUrl = '';
		copied = false;
	}

	async function upload() {
		if (!selected) return;
		phase = 'signing';
		message = 'Preparing a private upload ticket…';
		publicUrl = '';
		try {
			const response = await fetch('/api/upload/presign', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ filename: selected.name, contentType: selected.type, size: selected.size, folder })
			});
			const payload = await response.json();
			if (!response.ok) throw new Error(payload.error ?? 'Unable to prepare upload');
			const result = payload as UploadResult;
			phase = 'uploading';
			message = 'Sending the original file to the media archive…';
			const uploaded = await fetch(result.uploadUrl, { method: 'PUT', headers: result.requiredHeaders, body: selected });
			if (!uploaded.ok) throw new Error(`Upload failed (${uploaded.status})`);
			publicUrl = result.publicUrl;
			phase = 'done';
			message = 'Filed safely in the media archive.';
		} catch (error) {
			phase = 'error';
			message = error instanceof Error ? error.message : 'The upload could not be completed.';
		}
	}

	async function copyUrl() {
		await navigator.clipboard.writeText(publicUrl);
		copied = true;
		setTimeout(() => (copied = false), 1800);
	}
</script>

<svelte:head>
	<title>Editorial Studio — Insomniyuck</title>
	<meta name="robots" content="noindex,nofollow" />
</svelte:head>

<main class="page-shell studio">
	<header class="studio-header">
		<div>
			<p class="eyebrow">Private editorial room</p>
			<h1>Media desk</h1>
			<p>Prepare photographs and films for the next issue of your personal chronicle.</p>
		</div>
		<div class="studio-actions"><a href="/studio/new">Write a new post</a><form method="POST" action="/studio/logout"><button class="logout" type="submit">Close studio</button></form></div>
	</header>

	<section class="desk-grid">
		<div class="upload-sheet">
			<span class="tape" aria-hidden="true"></span>
			<p class="issue">File note / 01</p>
			<label class="file-drop">
				<input type="file" accept="image/jpeg,image/png,image/webp,image/avif,image/gif,video/mp4,video/webm,video/quicktime" onchange={selectFile} />
				<span class="plus">+</span>
				<strong>{selected ? 'Choose another file' : 'Choose a photograph or film'}</strong>
				<small>Images up to 15 MB · videos up to 250 MB</small>
			</label>

			<div class="field">
				<label for="folder">Archive section</label>
				<select id="folder" bind:value={folder}>
					{#each folders as option}<option value={option}>{option}</option>{/each}
				</select>
			</div>

			{#if selected}
				<div class="file-meta">
					<span>{selected.name}</span><span>{formatSize(selected.size)}</span>
				</div>
			{/if}

			<button class="upload-button" type="button" onclick={upload} disabled={!selected || phase === 'signing' || phase === 'uploading'}>
				{phase === 'signing' ? 'Preparing…' : phase === 'uploading' ? 'Uploading…' : 'File in media archive'}
			</button>
			{#if message}<p class:success={phase === 'done'} class:error={phase === 'error'} class="status" aria-live="polite">{message}</p>{/if}
		</div>

		<aside class="preview-sheet">
			<p class="issue">Contact proof</p>
			<div class="preview">
				{#if selected?.type.startsWith('image/') && preview}
					<img src={preview} alt="Selected upload preview" />
				{:else if selected?.type.startsWith('video/') && preview}
					<video src={preview} controls muted></video>
				{:else}
					<span>No proof selected</span>
				{/if}
			</div>
			{#if publicUrl}
				<div class="result">
					<label for="media-url">Published media URL</label>
					<input id="media-url" value={publicUrl} readonly />
					<button type="button" onclick={copyUrl}>{copied ? 'Copied' : 'Copy URL'}</button>
				</div>
			{:else}
				<p class="hint">After upload, the permanent URL appears here for use in a post cover, gallery, or video field.</p>
			{/if}
		</aside>
	</section>
</main>

<style>
	.studio { padding: clamp(3rem, 8vw, 6rem) 0 clamp(5rem, 10vw, 8rem); }
	.studio-header { display: flex; align-items: end; justify-content: space-between; gap: 2rem; padding-bottom: 2.5rem; border-bottom: 3px double var(--line-strong); }
	h1 { margin: .55rem 0 .5rem; font-family: var(--font-display); font-size: clamp(4rem, 10vw, 7rem); font-weight: 400; line-height: .78; letter-spacing: -.055em; }
	.studio-header p:not(.eyebrow) { max-width: 39rem; margin: 1rem 0 0; color: var(--ink-soft); font-family: var(--font-display); font-size: 1.15rem; }
	.logout { padding: .7rem 1rem; color: var(--ink-soft); border: 1px solid var(--line-strong); background: transparent; cursor: pointer; font-size: .6rem; font-weight: 600; letter-spacing: .13em; text-transform: uppercase; }
	.studio-actions { display: flex; gap: .7rem; align-items: center; }
	.studio-actions > a { padding: .75rem 1rem; color: var(--paper-raised); border: 1px solid var(--accent-deep); background: var(--accent-deep); font-size: .6rem; font-weight: 600; letter-spacing: .13em; text-transform: uppercase; }
	.desk-grid { display: grid; grid-template-columns: minmax(0, 1fr) minmax(18rem, .78fr); gap: clamp(2rem, 6vw, 5rem); align-items: start; padding-top: 4rem; }
	.upload-sheet, .preview-sheet { position: relative; padding: clamp(1.5rem, 4vw, 2.5rem); border: 1px solid var(--line-strong); background: var(--paper-raised); box-shadow: var(--shadow); }
	.upload-sheet { transform: rotate(-.2deg); }
	.preview-sheet { margin-top: 2rem; transform: rotate(.45deg); }
	.issue { margin: 0 0 1.25rem; padding-bottom: .65rem; color: var(--ink-soft); border-bottom: 1px solid var(--line); font-size: .55rem; font-weight: 600; letter-spacing: .17em; text-transform: uppercase; }
	.tape { position: absolute; top: -.8rem; left: 42%; width: 7rem; height: 1.7rem; background: color-mix(in srgb, var(--accent-soft) 76%, transparent); opacity: .82; transform: rotate(-2deg); }
	.file-drop { display: grid; min-height: 13rem; padding: 2rem; place-items: center; align-content: center; text-align: center; border: 1px dashed var(--line-strong); cursor: pointer; background: color-mix(in srgb, var(--paper) 48%, transparent); }
	.file-drop:hover { border-color: var(--accent); background: var(--accent-soft); }
	.file-drop input { position: absolute; width: 1px; height: 1px; overflow: hidden; opacity: 0; }
	.file-drop strong { font-family: var(--font-display); font-size: 1.45rem; font-weight: 500; }
	.file-drop small { margin-top: .4rem; color: var(--ink-soft); font-size: .66rem; }
	.plus { display: grid; width: 2.5rem; height: 2.5rem; margin-bottom: .75rem; place-items: center; color: var(--accent-deep); border: 1px solid var(--accent); border-radius: 50%; font-family: var(--font-display); font-size: 1.8rem; }
	.field { display: grid; grid-template-columns: 1fr 1fr; align-items: center; gap: 1rem; margin-top: 1.5rem; }
	.field label, .result label { font-size: .58rem; font-weight: 600; letter-spacing: .13em; text-transform: uppercase; }
	select, .result input { width: 100%; padding: .75rem .8rem; color: var(--ink); border: 1px solid var(--line); border-radius: 0; background: var(--paper); }
	.file-meta { display: flex; justify-content: space-between; gap: 1rem; margin-top: 1.25rem; color: var(--ink-soft); font-size: .68rem; }
	.file-meta span:first-child { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
	.upload-button, .result button { width: 100%; margin-top: 1.5rem; padding: .9rem 1rem; color: var(--paper-raised); border: 1px solid var(--accent-deep); background: var(--accent-deep); cursor: pointer; font-size: .63rem; font-weight: 600; letter-spacing: .13em; text-transform: uppercase; }
	.upload-button:hover, .result button:hover { background: var(--rose); border-color: var(--rose); }
	.upload-button:disabled { cursor: not-allowed; opacity: .5; }
	.status { margin: 1rem 0 0; color: var(--ink-soft); font-size: .72rem; }
	.status.success { color: var(--accent-deep); }
	.status.error { color: var(--rose); }
	.preview { display: grid; aspect-ratio: 4 / 3; overflow: hidden; place-items: center; color: var(--ink-soft); border: .65rem solid var(--photo-mat); background: color-mix(in srgb, var(--ink) 6%, var(--paper)); box-shadow: 0 7px 20px rgba(0,0,0,.12); }
	.preview img, .preview video { width: 100%; height: 100%; object-fit: contain; background: #111; }
	.preview span { font-family: var(--font-display); font-size: 1.2rem; font-style: italic; }
	.result { display: grid; gap: .65rem; margin-top: 1.5rem; }
	.result button { margin-top: 0; }
	.hint { margin: 1.25rem 0 0; color: var(--ink-soft); font-size: .72rem; line-height: 1.65; }
	@media (max-width: 760px) {
		.studio-header { align-items: start; flex-direction: column; }
		.studio-actions { flex-wrap: wrap; }
		.desk-grid { grid-template-columns: 1fr; padding-top: 2.5rem; }
		.preview-sheet { margin-top: 0; }
	}
	@media (max-width: 480px) {
		.field { grid-template-columns: 1fr; gap: .5rem; }
		.upload-sheet, .preview-sheet { padding: 1.15rem; }
		.file-drop { min-height: 11rem; padding: 1.25rem; }
	}
</style>
