<script lang="ts">
	type UploadResult = { publicUrl: string; uploadUrl: string; requiredHeaders: Record<string, string> };
	type UploadStatus = 'ready' | 'signing' | 'uploading' | 'done' | 'error';
	type UploadItem = { id: string; file: File; preview: string; status: UploadStatus; publicUrl: string; error: string };

	const folders = ['general', 'food', 'travel', 'running', 'books', 'movies', 'thoughts', 'quotes'];
	const MAX_BATCH = 20;
	let files = $state<UploadItem[]>([]);
	let folder = $state('general');
	let phase = $state<'idle' | 'uploading' | 'done' | 'error'>('idle');
	let message = $state('');
	let copied = $state(false);
	let uploading = $derived(files.some((item) => item.status === 'signing' || item.status === 'uploading'));
	let pendingCount = $derived(files.filter((item) => item.status === 'ready' || item.status === 'error').length);
	let successfulUrls = $derived(files.filter((item) => item.status === 'done').map((item) => item.publicUrl));

	function formatSize(bytes: number) {
		return bytes < 1024 * 1024 ? `${Math.round(bytes / 1024)} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
	}

	function updateItem(id: string, changes: Partial<UploadItem>) {
		files = files.map((item) => item.id === id ? { ...item, ...changes } : item);
	}

	function selectFiles(event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		for (const item of files) URL.revokeObjectURL(item.preview);
		const chosen = Array.from(input.files ?? []);
		files = chosen.slice(0, MAX_BATCH).map((file) => ({
			id: crypto.randomUUID(),
			file,
			preview: URL.createObjectURL(file),
			status: 'ready',
			publicUrl: '',
			error: ''
		}));
		phase = 'idle';
		message = chosen.length > MAX_BATCH ? `The first ${MAX_BATCH} files were selected. Upload another batch afterward.` : '';
		copied = false;
		input.value = '';
	}

	function removeFile(id: string) {
		const item = files.find((entry) => entry.id === id);
		if (item) URL.revokeObjectURL(item.preview);
		files = files.filter((entry) => entry.id !== id);
		message = '';
	}

	async function uploadItem(item: UploadItem) {
		updateItem(item.id, { status: 'signing', error: '' });
		try {
			const response = await fetch('/api/upload/presign', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ filename: item.file.name, contentType: item.file.type, size: item.file.size, folder })
			});
			const payload = await response.json();
			if (!response.ok) throw new Error(payload.error ?? 'Unable to prepare upload');
			const result = payload as UploadResult;
			updateItem(item.id, { status: 'uploading' });
			const uploaded = await fetch(result.uploadUrl, { method: 'PUT', headers: result.requiredHeaders, body: item.file });
			if (!uploaded.ok) throw new Error(`Upload failed (${uploaded.status})`);
			updateItem(item.id, { status: 'done', publicUrl: result.publicUrl });
		} catch (error) {
			updateItem(item.id, { status: 'error', error: error instanceof Error ? error.message : 'Upload failed' });
		}
	}

	async function uploadAll() {
		if (!pendingCount || uploading) return;
		phase = 'uploading';
		message = `Filing ${pendingCount} ${pendingCount === 1 ? 'item' : 'items'} in sequence…`;
		const queue = files.filter((item) => item.status === 'ready' || item.status === 'error');
		for (const item of queue) await uploadItem(item);
		const failed = files.filter((item) => item.status === 'error').length;
		const completed = files.filter((item) => item.status === 'done').length;
		phase = failed ? 'error' : 'done';
		message = failed
			? `${completed} filed safely; ${failed} failed. Use the button to retry failed files.`
			: `${completed} ${completed === 1 ? 'file' : 'files'} filed safely in the media archive.`;
	}

	async function copyUrls() {
		await navigator.clipboard.writeText(successfulUrls.join('\n'));
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
				<input type="file" multiple accept="image/jpeg,image/png,image/webp,image/avif,image/gif,video/mp4,video/webm,video/quicktime" onchange={selectFiles} />
				<span class="plus">+</span>
				<strong>{files.length ? 'Choose another batch' : 'Choose photographs or films'}</strong>
				<small>Up to {MAX_BATCH} files · images 15 MB each · videos 250 MB each</small>
			</label>

			<div class="field">
				<label for="folder">Archive section</label>
				<select id="folder" bind:value={folder}>
					{#each folders as option}<option value={option}>{option}</option>{/each}
				</select>
			</div>

			{#if files.length}
				<div class="queue">
					{#each files as item, index}
						<div class="queue-item" class:error={item.status === 'error'}>
							<span class="number">{String(index + 1).padStart(2, '0')}</span>
							<div><strong>{item.file.name}</strong><small>{item.error || `${formatSize(item.file.size)} · ${item.status}`}</small></div>
							{#if item.status === 'done'}<span class="check" aria-label="Uploaded">✓</span>{:else}<button type="button" onclick={() => removeFile(item.id)} disabled={uploading} aria-label={`Remove ${item.file.name}`}>×</button>{/if}
						</div>
					{/each}
				</div>
			{/if}

			<button class="upload-button" type="button" onclick={uploadAll} disabled={!pendingCount || uploading}>
				{uploading ? 'Uploading batch…' : pendingCount ? `Upload ${pendingCount} ${pendingCount === 1 ? 'file' : 'files'}` : files.length ? 'Batch complete' : 'Select files first'}
			</button>
			{#if message}<p class:success={phase === 'done'} class:error={phase === 'error'} class="status" aria-live="polite">{message}</p>{/if}
		</div>

		<aside class="preview-sheet">
			<p class="issue">Contact proof / {files.length || '—'}</p>
			<div class="contact-sheet" class:empty={!files.length}>
				{#if files.length}
					{#each files as item, index}
						<figure class:uploaded={item.status === 'done'} class:failed={item.status === 'error'}>
							{#if item.file.type.startsWith('image/')}<img src={item.preview} alt={`Selected upload ${index + 1}`} />
							{:else}<video src={item.preview} muted preload="metadata"></video>{/if}
							<figcaption>{String(index + 1).padStart(2, '0')} · {item.status}</figcaption>
						</figure>
					{/each}
				{:else}
					<span>No proof selected</span>
				{/if}
			</div>
			{#if successfulUrls.length}
				<div class="result">
					<label for="media-urls">Published media URLs ({successfulUrls.length})</label>
					<textarea id="media-urls" value={successfulUrls.join('\n')} rows={Math.min(successfulUrls.length + 1, 8)} readonly></textarea>
					<button type="button" onclick={copyUrls}>{copied ? 'Copied all URLs' : 'Copy all URLs'}</button>
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
	select, .result textarea { width: 100%; padding: .75rem .8rem; color: var(--ink); border: 1px solid var(--line); border-radius: 0; background: var(--paper); }
	.queue { display: grid; margin-top: 1.25rem; border-top: 1px solid var(--line); }
	.queue-item { display: grid; grid-template-columns: auto minmax(0, 1fr) auto; align-items: center; gap: .75rem; padding: .75rem 0; border-bottom: 1px solid var(--line); }
	.queue-item .number { color: var(--rose); font-family: var(--font-display); font-size: 1rem; }
	.queue-item div { min-width: 0; }
	.queue-item strong, .queue-item small { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
	.queue-item strong { font-size: .68rem; font-weight: 500; }
	.queue-item small { margin-top: .15rem; color: var(--ink-soft); font-size: .58rem; text-transform: capitalize; }
	.queue-item.error small { color: var(--rose); }
	.queue-item button { width: 1.65rem; height: 1.65rem; padding: 0; color: var(--ink-soft); border: 1px solid var(--line); border-radius: 50%; background: transparent; cursor: pointer; }
	.queue-item button:disabled { cursor: wait; opacity: .4; }
	.queue-item .check { display: grid; width: 1.65rem; height: 1.65rem; place-items: center; color: var(--paper-raised); border-radius: 50%; background: var(--accent-deep); font-size: .7rem; }
	.upload-button, .result button { width: 100%; margin-top: 1.5rem; padding: .9rem 1rem; color: var(--paper-raised); border: 1px solid var(--accent-deep); background: var(--accent-deep); cursor: pointer; font-size: .63rem; font-weight: 600; letter-spacing: .13em; text-transform: uppercase; }
	.upload-button:hover, .result button:hover { background: var(--rose); border-color: var(--rose); }
	.upload-button:disabled { cursor: not-allowed; opacity: .5; }
	.status { margin: 1rem 0 0; color: var(--ink-soft); font-size: .72rem; }
	.status.success { color: var(--accent-deep); }
	.status.error { color: var(--rose); }
	.contact-sheet { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: .75rem; }
	.contact-sheet.empty { min-height: 18rem; place-items: center; color: var(--ink-soft); border: .65rem solid var(--photo-mat); background: color-mix(in srgb, var(--ink) 6%, var(--paper)); box-shadow: 0 7px 20px rgba(0,0,0,.12); }
	.contact-sheet.empty span { font-family: var(--font-display); font-size: 1.2rem; font-style: italic; }
	figure { position: relative; margin: 0; padding: .4rem .4rem 1.55rem; border: 1px solid var(--line); background: var(--photo-mat); box-shadow: 0 5px 14px rgba(0,0,0,.1); transform: rotate(-.45deg); }
	figure:nth-child(even) { transform: rotate(.55deg); }
	figure::after { position: absolute; inset: .4rem .4rem 1.55rem; pointer-events: none; content: ''; border: 2px solid transparent; }
	figure.uploaded::after { border-color: var(--accent); }
	figure.failed::after { border-color: var(--rose); }
	figure img, figure video { display: block; width: 100%; aspect-ratio: 1; object-fit: cover; background: #111; }
	figcaption { position: absolute; right: .5rem; bottom: .4rem; left: .5rem; overflow: hidden; color: #4a473e; font-size: .5rem; letter-spacing: .08em; text-overflow: ellipsis; text-transform: uppercase; white-space: nowrap; }
	.result { display: grid; gap: .65rem; margin-top: 1.5rem; }
	.result textarea { resize: vertical; font-family: ui-monospace, SFMono-Regular, Consolas, monospace; font-size: .62rem; line-height: 1.5; }
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
