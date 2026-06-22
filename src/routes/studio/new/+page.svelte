<script lang="ts">
	import { onDestroy, onMount } from 'svelte';

	type PreviewBlock = { kind: 'heading' | 'paragraph' | 'quote' | 'list'; text: string; level?: number };
	type UploadResult = { publicUrl: string; uploadUrl: string; requiredHeaders: Record<string, string> };
	type PhotoStatus = 'ready' | 'signing' | 'uploading' | 'done' | 'error';
	type PhotoItem = {
		id: string;
		file?: File;
		preview: string;
		publicUrl: string;
		status: PhotoStatus;
		error: string;
	};
	type DatabasePost = {
		title: string; slug: string; date: string; language: 'en' | 'bn'; category: string; tags: string[];
		excerpt: string; coverTone: string; coverImage?: string; gallery: string[]; videos: string[];
		location?: string; rating?: number; quote?: string; source?: string; featured: boolean; body: string;
		status: 'draft' | 'published';
	};

	const categories = ['food', 'travel', 'running', 'books', 'movies', 'thoughts', 'life', 'quotes'];
	const tones = ['clay', 'forest', 'dawn', 'ink', 'plum', 'sand', 'mist'];
	const MAX_PHOTOS = 20;
	const today = new Date().toISOString().slice(0, 10);

	let title = $state('');
	let slug = $state('');
	let slugTouched = $state(false);
	let date = $state(today);
	let language = $state<'en' | 'bn'>('en');
	let category = $state('thoughts');
	let tags = $state('');
	let excerpt = $state('');
	let coverTone = $state('mist');
	let coverImage = $state('');
	let gallery = $state('');
	let photos = $state<PhotoItem[]>([]);
	let coverPhotoId = $state('');
	let photoMessage = $state('');
	let videos = $state('');
	let location = $state('');
	let rating = $state('');
	let quote = $state('');
	let source = $state('');
	let featured = $state(false);
	let body = $state('Begin with the moment you want to remember.\n\n## A small detail\n\nWrite what made it stay with you.');
	let copied = $state(false);
	let loadedFilename = $state('');
	let importMessage = $state('');
	let databaseSlug = $state('');
	let savePhase = $state<'idle' | 'saving' | 'saved' | 'error'>('idle');
	let saveMessage = $state('');
	let savedStatus = $state<'draft' | 'published' | null>(null);
	let coverPreview = $derived(photos.find((photo) => photo.id === coverPhotoId)?.preview || coverImage);
	let uploadingPhotos = $derived(photos.some((photo) => photo.status === 'signing' || photo.status === 'uploading'));

	function slugify(value: string) {
		return value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);
	}

	function titleChanged() {
		if (!slugTouched) slug = slugify(title);
	}

	function list(value: string) {
		return value.split(/[\n,]/).map((item) => item.trim()).filter(Boolean);
	}

	function revokeLocalPreviews(items = photos) {
		for (const photo of items) if (photo.file) URL.revokeObjectURL(photo.preview);
	}

	function syncMediaFields() {
		const cover = photos.find((photo) => photo.id === coverPhotoId);
		coverImage = cover?.publicUrl || '';
		gallery = photos
			.filter((photo) => photo.id !== coverPhotoId && photo.publicUrl)
			.map((photo) => photo.publicUrl)
			.join('\n');
	}

	function hydratePhotos(cover: string, galleryImages: string[]) {
		revokeLocalPreviews();
		const urls = [cover, ...galleryImages].filter((url, index, all) => Boolean(url) && all.indexOf(url) === index);
		photos = urls.map((url) => ({
			id: crypto.randomUUID(),
			preview: url,
			publicUrl: url,
			status: 'done',
			error: ''
		}));
		coverPhotoId = cover ? photos.find((photo) => photo.publicUrl === cover)?.id || '' : '';
		if (!coverPhotoId && photos.length) coverPhotoId = photos[0].id;
		photoMessage = '';
		syncMediaFields();
	}

	function selectPhotos(event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		const chosen = Array.from(input.files ?? []);
		const available = Math.max(0, MAX_PHOTOS - photos.length);
		const accepted = chosen.slice(0, available).map((file) => ({
			id: crypto.randomUUID(),
			file,
			preview: URL.createObjectURL(file),
			publicUrl: '',
			status: 'ready' as const,
			error: ''
		}));
		photos = [...photos, ...accepted];
		if (!coverPhotoId && accepted.length) coverPhotoId = accepted[0].id;
		photoMessage = chosen.length > available
			? `This post can hold up to ${MAX_PHOTOS} photographs. The first ${accepted.length} were added.`
			: `${accepted.length} ${accepted.length === 1 ? 'photograph' : 'photographs'} added. Choose one as the title photo.`;
		input.value = '';
		syncMediaFields();
	}

	function chooseCover(id: string) {
		coverPhotoId = id;
		photoMessage = 'Main photocard photo selected.';
		syncMediaFields();
	}

	function removePhoto(id: string) {
		const removed = photos.find((photo) => photo.id === id);
		if (removed?.file) URL.revokeObjectURL(removed.preview);
		photos = photos.filter((photo) => photo.id !== id);
		if (coverPhotoId === id) coverPhotoId = photos[0]?.id || '';
		photoMessage = photos.length ? 'Photograph removed.' : '';
		syncMediaFields();
	}

	function updatePhoto(id: string, changes: Partial<PhotoItem>) {
		photos = photos.map((photo) => photo.id === id ? { ...photo, ...changes } : photo);
	}

	async function uploadPhoto(photo: PhotoItem) {
		if (!photo.file || photo.publicUrl) return;
		updatePhoto(photo.id, { status: 'signing', error: '' });
		try {
			const response = await fetch('/api/upload/presign', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({
					filename: photo.file.name,
					contentType: photo.file.type,
					size: photo.file.size,
					folder: category
				})
			});
			const payload = await response.json().catch(() => ({})) as UploadResult & { error?: string };
			if (!response.ok || !payload.uploadUrl) throw new Error(payload.error || 'Unable to prepare this photograph.');
			updatePhoto(photo.id, { status: 'uploading' });
			const uploaded = await fetch(payload.uploadUrl, {
				method: 'PUT',
				headers: payload.requiredHeaders,
				body: photo.file
			});
			if (!uploaded.ok) throw new Error(`Upload failed (${uploaded.status})`);
			updatePhoto(photo.id, { status: 'done', publicUrl: payload.publicUrl });
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Upload failed';
			updatePhoto(photo.id, { status: 'error', error: message });
			throw new Error(`${photo.file.name}: ${message}`);
		}
	}

	async function uploadPendingPhotos() {
		const pending = photos.filter((photo) => photo.file && !photo.publicUrl);
		if (!pending.length) return;
		photoMessage = `Uploading ${pending.length} ${pending.length === 1 ? 'photograph' : 'photographs'}…`;
		for (const photo of pending) await uploadPhoto(photo);
		syncMediaFields();
		photoMessage = `${pending.length} ${pending.length === 1 ? 'photograph' : 'photographs'} uploaded and attached.`;
	}

	function yaml(value: string) {
		return JSON.stringify(value.trim());
	}

	function parseYamlValue(raw: string): unknown {
		const value = raw.trim();
		if (value === '') return '';
		try {
			if (/^(\[|\{|"|true$|false$|-?\d)/.test(value)) return JSON.parse(value);
		} catch {
			// Fall back to plain YAML text for older hand-written posts.
		}
		if (value.startsWith("'") && value.endsWith("'")) return value.slice(1, -1).replace(/''/g, "'");
		return value;
	}

	async function openExisting(event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;
		importMessage = '';
		try {
			const text = await file.text();
			const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
			if (!match) throw new Error('This file does not contain valid frontmatter markers.');
			const metadata: Record<string, unknown> = {};
			for (const line of match[1].split(/\r?\n/)) {
				const divider = line.indexOf(':');
				if (divider < 1) continue;
				metadata[line.slice(0, divider).trim()] = parseYamlValue(line.slice(divider + 1));
			}
			const strings = (value: unknown) => Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
			title = typeof metadata.title === 'string' ? metadata.title : '';
			slug = typeof metadata.slug === 'string' ? metadata.slug : slugify(title);
			slugTouched = true;
			date = typeof metadata.date === 'string' ? metadata.date : today;
			language = metadata.language === 'bn' ? 'bn' : 'en';
			category = typeof metadata.category === 'string' && categories.includes(metadata.category) ? metadata.category : 'thoughts';
			tags = strings(metadata.tags).join(', ');
			excerpt = typeof metadata.excerpt === 'string' ? metadata.excerpt : '';
			coverTone = typeof metadata.coverTone === 'string' && tones.includes(metadata.coverTone) ? metadata.coverTone : 'mist';
			const importedCover = typeof metadata.coverImage === 'string' ? metadata.coverImage : '';
			const importedGallery = strings(metadata.gallery);
			hydratePhotos(importedCover, importedGallery);
			videos = strings(metadata.videos).join('\n');
			location = typeof metadata.location === 'string' ? metadata.location : '';
			rating = typeof metadata.rating === 'number' ? String(metadata.rating) : '';
			quote = typeof metadata.quote === 'string' ? metadata.quote : '';
			source = typeof metadata.source === 'string' ? metadata.source : '';
			featured = metadata.featured === true;
			body = match[2].trim();
			databaseSlug = '';
			savedStatus = null;
			savePhase = 'idle';
			saveMessage = '';
			loadedFilename = file.name;
			importMessage = 'Post opened. Edit it below, then download the replacement file.';
		} catch (error) {
			loadedFilename = '';
			importMessage = error instanceof Error ? error.message : 'Unable to open this post.';
		} finally {
			input.value = '';
		}
	}

	function buildPost() {
		const lines = [
			'---',
			`title: ${yaml(title || 'Untitled memory')}`,
			`slug: ${yaml(slug || 'untitled-memory')}`,
			`date: ${yaml(date)}`,
			`language: ${language}`,
			`category: ${category}`,
			`tags: ${JSON.stringify(list(tags))}`,
			`excerpt: ${yaml(excerpt || 'A memory still waiting for its short introduction.')}`,
			`coverTone: ${coverTone}`
		];
		if (coverImage.trim()) lines.push(`coverImage: ${yaml(coverImage)}`);
		lines.push(`gallery: ${JSON.stringify(list(gallery))}`);
		lines.push(`videos: ${JSON.stringify(list(videos))}`);
		if (location.trim()) lines.push(`location: ${yaml(location)}`);
		if (rating !== '' && Number(rating) >= 0 && Number(rating) <= 5) lines.push(`rating: ${Number(rating)}`);
		if (quote.trim()) lines.push(`quote: ${yaml(quote)}`);
		if (source.trim()) lines.push(`source: ${yaml(source)}`);
		lines.push(`featured: ${featured}`);
		lines.push('---', '', body.trim(), '');
		return lines.join('\n');
	}

	function parseMarkdown(value: string): PreviewBlock[] {
		const blocks: PreviewBlock[] = [];
		let paragraph: string[] = [];
		const flush = () => {
			if (paragraph.length) blocks.push({ kind: 'paragraph', text: paragraph.join(' ') });
			paragraph = [];
		};
		for (const raw of value.split('\n')) {
			const line = raw.trim();
			if (!line) { flush(); continue; }
			const heading = line.match(/^(#{1,3})\s+(.+)$/);
			if (heading) { flush(); blocks.push({ kind: 'heading', text: heading[2], level: heading[1].length }); continue; }
			if (line.startsWith('> ')) { flush(); blocks.push({ kind: 'quote', text: line.slice(2) }); continue; }
			if (/^[-*]\s+/.test(line)) { flush(); blocks.push({ kind: 'list', text: line.replace(/^[-*]\s+/, '') }); continue; }
			paragraph.push(line);
		}
		flush();
		return blocks;
	}

	let generated = $derived(buildPost());
	let preview = $derived(parseMarkdown(body));
	let ready = $derived(Boolean(title.trim() && slug.trim() && date && excerpt.trim() && body.trim()));

	async function copyPost() {
		await navigator.clipboard.writeText(generated);
		copied = true;
		setTimeout(() => (copied = false), 1800);
	}

	function downloadPost() {
		if (!ready) return;
		const blob = new Blob([generated], { type: 'text/markdown;charset=utf-8' });
		const url = URL.createObjectURL(blob);
		const anchor = document.createElement('a');
		anchor.href = url;
		anchor.download = `${slug}.svx`;
		anchor.click();
		URL.revokeObjectURL(url);
	}

	function databasePayload(status: 'draft' | 'published') {
		return {
			title: title.trim(),
			slug: slug.trim(),
			date,
			language,
			category,
			tags: list(tags),
			excerpt: excerpt.trim(),
			coverTone,
			coverImage: coverImage.trim() || undefined,
			gallery: list(gallery),
			videos: list(videos),
			location: location.trim() || undefined,
			rating: rating === '' ? undefined : Number(rating),
			quote: quote.trim() || undefined,
			source: source.trim() || undefined,
			featured,
			body: body.trim(),
			status
		};
	}

	async function saveToDatabase(status: 'draft' | 'published') {
		if (!ready || savePhase === 'saving') return;
		savePhase = 'saving';
		saveMessage = status === 'draft' ? 'Saving this draft…' : 'Publishing this memory…';
		try {
			await uploadPendingPhotos();
			const editing = Boolean(databaseSlug);
			const response = await fetch(editing ? `/api/studio/posts/${databaseSlug}` : '/api/studio/posts', {
				method: editing ? 'PUT' : 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify(databasePayload(status))
			});
			const result = await response.json().catch(() => ({})) as { post?: { slug: string }; error?: string };
			if (!response.ok || !result.post) throw new Error(result.error || 'The database could not save this post.');
			databaseSlug = result.post.slug;
			savedStatus = status;
			savePhase = 'saved';
			saveMessage = status === 'draft'
				? 'Draft saved privately in the development archive.'
				: 'Published in the development archive. It is ready for the next local preview step.';
		} catch (error) {
			savePhase = 'error';
			saveMessage = error instanceof Error ? error.message : 'Unable to save this post.';
		}
	}

	function applyDatabasePost(post: DatabasePost) {
		title = post.title;
		slug = post.slug;
		slugTouched = true;
		date = post.date;
		language = post.language;
		category = categories.includes(post.category) ? post.category : 'thoughts';
		tags = post.tags.join(', ');
		excerpt = post.excerpt;
		coverTone = tones.includes(post.coverTone) ? post.coverTone : 'mist';
		hydratePhotos(post.coverImage ?? '', post.gallery);
		videos = post.videos.join('\n');
		location = post.location ?? '';
		rating = post.rating === undefined ? '' : String(post.rating);
		quote = post.quote ?? '';
		source = post.source ?? '';
		featured = post.featured;
		body = post.body;
		databaseSlug = post.slug;
		savedStatus = post.status;
		loadedFilename = `Database post · ${post.slug}`;
	}

	onMount(async () => {
		const requestedSlug = new URLSearchParams(window.location.search).get('slug');
		if (!requestedSlug) return;
		savePhase = 'saving';
		saveMessage = 'Opening the saved post…';
		try {
			const response = await fetch(`/api/studio/posts/${encodeURIComponent(requestedSlug)}`);
			const result = await response.json().catch(() => ({})) as { post?: DatabasePost; error?: string };
			if (!response.ok || !result.post) throw new Error(result.error || 'Unable to open this database post.');
			applyDatabasePost(result.post);
			savePhase = 'saved';
			saveMessage = result.post.status === 'draft' ? 'Private draft opened for editing.' : 'Published post opened for editing.';
		} catch (error) {
			savePhase = 'error';
			saveMessage = error instanceof Error ? error.message : 'Unable to open this database post.';
		}
	});

	onDestroy(() => revokeLocalPreviews());
</script>

<svelte:head>
	<title>Writing Desk — Insomniyuck</title>
	<meta name="robots" content="noindex,nofollow" />
</svelte:head>

<main class="page-shell editor">
	<header class="editor-header">
		<div>
			<p class="eyebrow">Private editorial room</p>
			<h1>Writing desk</h1>
			<p>Shape a memory into a finished page, ready for the archive.</p>
		</div>
		<nav aria-label="Studio sections"><a href="/studio">Media desk</a><a href="/studio/posts">Post archive</a><span>Writing desk</span></nav>
	</header>
	<section class="open-strip">
		<div><p class="eyebrow">Continue an edition</p><strong>{loadedFilename || 'Edit an existing post'}</strong>{#if importMessage}<small>{importMessage}</small>{/if}</div>
		<label class="open-button"><input type="file" accept=".svx,.md,text/markdown" onchange={openExisting} /><span>Open .svx file</span></label>
	</section>

	<div class="workspace">
		<form class="form-sheet" onsubmit={(event) => event.preventDefault()}>
			<span class="clip" aria-hidden="true"></span>
			<div class="section-heading"><span>01</span><div><p class="eyebrow">The edition</p><h2>Essential details</h2></div></div>
			<div class="wide field"><label for="title">Title *</label><input id="title" bind:value={title} oninput={titleChanged} placeholder="The afternoon the rain stayed" required /></div>
			<div class="field"><label for="slug">URL slug *</label><input id="slug" bind:value={slug} oninput={() => { slugTouched = true; slug = slugify(slug); }} placeholder="the-afternoon-rain-stayed" required disabled={Boolean(databaseSlug)} />{#if databaseSlug}<small class="help">The URL is locked after the first save.</small>{/if}</div>
			<div class="field"><label for="date">Date *</label><input id="date" type="date" bind:value={date} required /></div>
			<div class="field"><label for="language">Writing language</label><select id="language" bind:value={language}><option value="en">English</option><option value="bn">বাংলা</option></select></div>
			<div class="field"><label for="category">Section</label><select id="category" bind:value={category}>{#each categories as item}<option value={item}>{item}</option>{/each}</select></div>
			<div class="field"><label for="tone">Cover tone</label><select id="tone" bind:value={coverTone}>{#each tones as tone}<option value={tone}>{tone}</option>{/each}</select></div>
			<div class="wide field"><label for="tags">Tags <small>comma-separated</small></label><input id="tags" bind:value={tags} placeholder="rain, cafe, dhaka" /></div>
			<div class="wide field"><label for="excerpt">Short introduction *</label><textarea id="excerpt" rows="3" bind:value={excerpt} placeholder="One or two sentences shown on cards and archive pages." required></textarea></div>

			<div class="section-heading wide"><span>02</span><div><p class="eyebrow">Photographic notes</p><h2>Media & context</h2></div></div>
			<div class="wide photo-field">
				<div class="photo-heading"><div><label for="post-photos">Post photographs</label><small>Select several at once, then choose one as the main photo shown on post cards and at the top of the post.</small></div><span>{photos.length} / {MAX_PHOTOS}</span></div>
				<label class="photo-picker" class:disabled={photos.length >= MAX_PHOTOS || uploadingPhotos}>
					<input id="post-photos" type="file" multiple accept="image/jpeg,image/png,image/webp,image/avif,image/gif" onchange={selectPhotos} disabled={photos.length >= MAX_PHOTOS || uploadingPhotos} />
					<span>＋</span><strong>{photos.length ? 'Add more photographs' : 'Choose photographs'}</strong><small>JPG, PNG, WebP, AVIF or GIF · 15 MB each</small>
				</label>
				{#if photos.length}
					<div class="photo-grid">
						{#each photos as photo, index}
							<article class:cover-choice={photo.id === coverPhotoId} class:error={photo.status === 'error'}>
								<button class="photo-preview" type="button" onclick={() => chooseCover(photo.id)} aria-label={`Use photograph ${index + 1} as the main photocard photo`} aria-pressed={photo.id === coverPhotoId}>
									<img src={photo.preview} alt={`Post photograph ${index + 1}`} />
									{#if photo.id === coverPhotoId}<span class="cover-badge">✓ Main photocard photo</span>{:else}<span class="cover-prompt">Set as main photo</span>{/if}
								</button>
								<div class="photo-meta"><small>{photo.error || (photo.status === 'done' ? 'Ready' : photo.status === 'ready' ? 'Selected' : 'Uploading…')}</small><button type="button" onclick={() => removePhoto(photo.id)} disabled={uploadingPhotos} aria-label={`Remove photograph ${index + 1}`}>Remove</button></div>
							</article>
						{/each}
					</div>
				{/if}
				{#if photoMessage}<p class="photo-message" aria-live="polite">{photoMessage}</p>{/if}
			</div>
			<div class="wide field"><label for="videos">Video URLs <small>one per line</small></label><textarea id="videos" rows="4" bind:value={videos}></textarea></div>
			<div class="field"><label for="location">Location</label><input id="location" bind:value={location} placeholder="Dhaka" /></div>
			<div class="field"><label for="rating">Rating <small>0–5</small></label><input id="rating" type="number" min="0" max="5" step="0.5" bind:value={rating} /></div>
			<div class="field"><label for="quote">Favourite quote</label><textarea id="quote" rows="3" bind:value={quote}></textarea></div>
			<div class="field"><label for="source">Quote source</label><input id="source" bind:value={source} placeholder="Book, film, or person" /></div>
			<label class="featured wide"><input type="checkbox" bind:checked={featured} /><span>Feature this memory on the front page</span></label>

			<div class="section-heading wide"><span>03</span><div><p class="eyebrow">The story</p><h2>Markdown body</h2></div></div>
			<div class="wide field"><label for="body">Your writing *</label><textarea class="body-input" id="body" rows="20" bind:value={body} required></textarea><small class="help">Use ## for headings, &gt; for a quotation, and - for a list.</small></div>
		</form>

		<aside class="proof-column">
			<section class="proof" lang={language}>
				<p class="proof-label">Reader's proof</p>
				{#if coverPreview}<img class="cover" src={coverPreview} alt="Post cover preview" />{/if}
				{#if photos.length > 1}<div class="proof-gallery" aria-label="Additional photograph preview">{#each photos.filter((photo) => photo.id !== coverPhotoId).slice(0, 4) as photo}<img src={photo.preview} alt="" />{/each}</div>{/if}
				<p class="proof-category">{category} · {date}</p>
				<h2>{title || 'An untitled memory'}</h2>
				<p class="proof-excerpt">{excerpt || 'The short introduction will appear here.'}</p>
				<div class="story">
					{#each preview as block}
						{#if block.kind === 'heading'}<h3 class:large={block.level === 1}>{block.text}</h3>
						{:else if block.kind === 'quote'}<blockquote>{block.text}</blockquote>
						{:else if block.kind === 'list'}<p class="list">• {block.text}</p>
						{:else}<p>{block.text}</p>{/if}
					{/each}
				</div>
			</section>

			<section class="publish-card">
				<p class="eyebrow">Database filing</p>
				<h2>{savedStatus === 'published' ? 'Published edition' : savedStatus === 'draft' ? 'Private draft' : 'Ready to save'}</h2>
				<p>Save directly from Studio. These local records stay separate from the live website while we test.</p>
				<div class="publish-actions">
					<button class="secondary" type="button" onclick={() => saveToDatabase('draft')} disabled={!ready || savePhase === 'saving'}>{savePhase === 'saving' ? 'Working…' : 'Save draft'}</button>
					<button type="button" onclick={() => saveToDatabase('published')} disabled={!ready || savePhase === 'saving'}>{savePhase === 'saving' ? 'Working…' : 'Publish now'}</button>
				</div>
				{#if saveMessage}<p class:success={savePhase === 'saved'} class:error={savePhase === 'error'} class="save-message" aria-live="polite">{saveMessage}</p>{/if}
				{#if !ready}<small>Complete the title, slug, date, introduction, and story first.</small>{/if}
			</section>

			<section class="export-card">
				<p class="eyebrow">Portable backup</p>
				<h2>{slug || 'your-post-file'}.svx</h2>
				<p>Keep a downloadable copy whenever you want an offline archive of your writing.</p>
				<button type="button" onclick={downloadPost} disabled={!ready}>Download post file</button>
				<button class="secondary" type="button" onclick={copyPost}>{copied ? 'Copied' : 'Copy full MDsveX'}</button>
				{#if !ready}<small>Complete the title, slug, date, introduction, and story first.</small>{/if}
			</section>
		</aside>
	</div>
</main>

<style>
	.editor { padding: clamp(3rem, 8vw, 6rem) 0 clamp(5rem, 10vw, 8rem); }
	.editor-header { display: flex; align-items: end; justify-content: space-between; gap: 2rem; padding-bottom: 2.5rem; border-bottom: 3px double var(--line-strong); }
	h1 { margin: .55rem 0 .5rem; font-family: var(--font-display); font-size: clamp(4rem, 10vw, 7rem); font-weight: 400; line-height: .78; letter-spacing: -.055em; }
	.editor-header > div > p:not(.eyebrow) { margin: 1rem 0 0; color: var(--ink-soft); font-family: var(--font-display); font-size: 1.15rem; }
	nav { display: flex; gap: 1rem; align-items: center; font-size: .6rem; font-weight: 600; letter-spacing: .12em; text-transform: uppercase; }
	nav a { color: var(--ink-soft); }
	nav span { padding-bottom: .25rem; border-bottom: 2px solid var(--rose); }
	.open-strip { display: flex; align-items: center; justify-content: space-between; gap: 1.5rem; margin-top: 2rem; padding: 1rem 1.2rem; border: 1px solid var(--line); background: color-mix(in srgb, var(--paper-raised) 62%, transparent); }
	.open-strip > div { display: grid; gap: .25rem; }
	.open-strip strong { font-family: var(--font-display); font-size: 1.2rem; font-weight: 500; }
	.open-strip small { color: var(--ink-soft); font-size: .65rem; }
	.open-button { flex: 0 0 auto; padding: .75rem 1rem; color: var(--paper-raised); border: 1px solid var(--accent-deep); background: var(--accent-deep); cursor: pointer; font-size: .6rem; font-weight: 600; letter-spacing: .12em; text-transform: uppercase; }
	.open-button input { position: absolute; width: 1px; height: 1px; overflow: hidden; opacity: 0; }
	.workspace { display: grid; grid-template-columns: minmax(0, 1.25fr) minmax(20rem, .75fr); gap: clamp(2rem, 5vw, 4rem); align-items: start; padding-top: 4rem; }
	.form-sheet { position: relative; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1.3rem; padding: clamp(1.5rem, 4vw, 3rem); border: 1px solid var(--line-strong); background: var(--paper-raised); box-shadow: var(--shadow); }
	.clip { position: absolute; top: -1rem; right: 3rem; width: 1.2rem; height: 3.7rem; border: 2px solid var(--ink-soft); border-radius: .8rem; transform: rotate(7deg); }
	.wide { grid-column: 1 / -1; }
	.section-heading { display: flex; grid-column: 1 / -1; gap: 1rem; align-items: center; margin: 1.4rem 0 .2rem; padding: 1.15rem 0 .8rem; border-top: 3px double var(--line-strong); }
	.section-heading:first-of-type { margin-top: 0; padding-top: 0; border-top: 0; }
	.section-heading > span { color: var(--rose); font-family: var(--font-display); font-size: 2.5rem; line-height: 1; }
	.section-heading h2 { margin: .15rem 0 0; font-family: var(--font-display); font-size: 1.8rem; font-weight: 500; }
	.field { display: grid; align-content: start; gap: .45rem; }
	.field > label, .featured, .photo-heading label { font-size: .58rem; font-weight: 600; letter-spacing: .13em; text-transform: uppercase; }
	label small { color: var(--ink-soft); font-weight: 400; letter-spacing: 0; text-transform: none; }
	input, textarea, select { width: 100%; padding: .78rem .85rem; color: var(--ink); border: 1px solid var(--line); border-radius: 0; background: color-mix(in srgb, var(--paper) 68%, transparent); }
	textarea { resize: vertical; line-height: 1.5; }
	.body-input { min-height: 28rem; font-family: ui-monospace, SFMono-Regular, Consolas, monospace; font-size: .83rem; line-height: 1.7; }
	.help { color: var(--ink-soft); font-size: .65rem; }
	.featured { display: flex; gap: .75rem; align-items: center; padding: 1rem; border: 1px solid var(--line); cursor: pointer; }
	.featured input { width: 1rem; height: 1rem; accent-color: var(--accent-deep); }
	.photo-field { display: grid; gap: 1rem; }
	.photo-heading { display: flex; align-items: end; justify-content: space-between; gap: 1rem; }
	.photo-heading > div { display: grid; gap: .35rem; }
	.photo-heading small, .photo-message { color: var(--ink-soft); font-size: .65rem; line-height: 1.5; }
	.photo-heading > span { color: var(--rose); font-family: var(--font-display); font-size: 1.1rem; }
	.photo-picker { display: grid; min-height: 9rem; padding: 1.4rem; place-items: center; align-content: center; text-align: center; border: 1px dashed var(--line-strong); background: color-mix(in srgb, var(--paper) 52%, transparent); cursor: pointer; }
	.photo-picker:hover { border-color: var(--accent); background: var(--accent-soft); }
	.photo-picker.disabled { cursor: not-allowed; opacity: .5; }
	.photo-picker input { position: absolute; width: 1px; height: 1px; overflow: hidden; opacity: 0; }
	.photo-picker > span { display: grid; width: 2.2rem; height: 2.2rem; margin-bottom: .45rem; place-items: center; color: var(--accent-deep); border: 1px solid var(--accent); border-radius: 50%; font-size: 1.3rem; }
	.photo-picker strong { font-family: var(--font-display); font-size: 1.25rem; font-weight: 500; }
	.photo-picker small { margin-top: .25rem; color: var(--ink-soft); font-size: .6rem; }
	.photo-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: .8rem; }
	.photo-grid article { min-width: 0; padding: .4rem .4rem .6rem; border: 1px solid var(--line); background: var(--photo-mat); box-shadow: 0 7px 18px rgba(0,0,0,.08); }
	.photo-grid article.cover-choice { border-color: var(--accent-deep); box-shadow: 0 0 0 2px var(--accent-soft), 0 9px 22px rgba(0,0,0,.12); }
	.photo-grid article.error { border-color: var(--rose); }
	.photo-preview { position: relative; display: block; width: 100%; padding: 0; overflow: hidden; color: white; border: 0; background: #171813; cursor: pointer; }
	.photo-preview img { display: block; width: 100%; aspect-ratio: 1; object-fit: cover; transition: transform 220ms ease, opacity 220ms ease; }
	.photo-preview:hover img { opacity: .76; transform: scale(1.025); }
	.cover-badge, .cover-prompt { position: absolute; right: .4rem; bottom: .4rem; left: .4rem; padding: .4rem; background: rgba(20,21,17,.78); font-size: .48rem; font-weight: 700; letter-spacing: .1em; text-align: center; text-transform: uppercase; }
	.cover-badge { color: var(--photo-mat); background: color-mix(in srgb, var(--accent-deep) 88%, transparent); }
	.cover-prompt { opacity: 0; transition: opacity 180ms ease; }
	.photo-preview:hover .cover-prompt, .photo-preview:focus-visible .cover-prompt { opacity: 1; }
	.photo-meta { display: flex; align-items: center; justify-content: space-between; gap: .4rem; padding-top: .45rem; }
	.photo-meta small { overflow: hidden; color: #5b574c; font-size: .5rem; text-overflow: ellipsis; text-transform: capitalize; white-space: nowrap; }
	.photo-meta button { padding: .2rem 0; color: #7b4f43; border: 0; background: transparent; cursor: pointer; font-size: .48rem; font-weight: 700; letter-spacing: .05em; text-transform: uppercase; }
	.photo-meta button:disabled { cursor: wait; opacity: .45; }
	.photo-message { margin: 0; }
	.proof-column { position: sticky; top: 1.5rem; display: grid; gap: 1.5rem; }
	.proof, .publish-card, .export-card { position: relative; padding: clamp(1.5rem, 4vw, 2.5rem); border: 1px solid var(--line-strong); background: var(--paper-raised); box-shadow: var(--shadow); transform: rotate(.25deg); }
	.proof::before { position: absolute; top: -.7rem; left: 36%; width: 7rem; height: 1.5rem; content: ''; background: color-mix(in srgb, var(--accent-soft) 78%, transparent); transform: rotate(-2deg); }
	.proof-label { margin: 0 0 1.5rem; padding-bottom: .65rem; color: var(--ink-soft); border-bottom: 1px solid var(--line); font-size: .54rem; font-weight: 600; letter-spacing: .16em; text-transform: uppercase; }
	.cover { display: block; width: 100%; aspect-ratio: 4 / 3; margin-bottom: 1.4rem; padding: .5rem .5rem 1.35rem; object-fit: cover; border: 1px solid var(--line); background: var(--photo-mat); transform: rotate(-.5deg); }
	.proof-gallery { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: .35rem; margin: -1rem 0 1.4rem; }
	.proof-gallery img { display: block; width: 100%; aspect-ratio: 1; padding: .18rem; object-fit: cover; border: 1px solid var(--line); background: var(--photo-mat); }
	.proof-category { color: var(--accent-deep); font-size: .56rem; font-weight: 600; letter-spacing: .14em; text-transform: uppercase; }
	.proof > h2 { margin: .5rem 0 .8rem; font-family: var(--font-display); font-size: clamp(2.4rem, 5vw, 3.5rem); font-weight: 400; line-height: .92; letter-spacing: -.035em; }
	.proof-excerpt { color: var(--ink-soft); font-family: var(--font-display); font-size: 1.12rem; font-style: italic; line-height: 1.5; }
	.story { margin-top: 2rem; padding-top: 1.4rem; border-top: 1px solid var(--line); }
	.story p { margin: 0 0 1rem; font-family: var(--font-display); font-size: 1.05rem; line-height: 1.65; }
	.story h3 { margin: 1.8rem 0 .6rem; font-family: var(--font-display); font-size: 1.65rem; font-weight: 500; }
	.story h3.large { font-size: 2rem; }
	.story blockquote { margin: 1.5rem 0; padding-left: 1rem; color: var(--ink-soft); border-left: 2px solid var(--rose); font-family: var(--font-display); font-size: 1.25rem; font-style: italic; }
	.story .list { margin: .25rem 0; }
	.proof:lang(bn) > h2 { line-height: 1.18; letter-spacing: -.02em; }
	.proof:lang(bn) .story p { line-height: 1.85; }
	.proof:lang(bn) .story h3 { line-height: 1.3; }
	.publish-card { transform: rotate(-.2deg); }
	.publish-card h2, .export-card h2 { margin: .5rem 0; overflow-wrap: anywhere; font-family: var(--font-display); font-size: 1.7rem; font-weight: 500; }
	.publish-card > p:not(.eyebrow):not(.save-message), .export-card p:not(.eyebrow) { color: var(--ink-soft); font-size: .72rem; line-height: 1.6; }
	.publish-actions { display: grid; grid-template-columns: 1fr 1fr; gap: .65rem; margin-top: 1rem; }
	.publish-card button, .export-card button { width: 100%; padding: .85rem; color: var(--paper-raised); border: 1px solid var(--accent-deep); background: var(--accent-deep); cursor: pointer; font-size: .6rem; font-weight: 600; letter-spacing: .12em; text-transform: uppercase; }
	.publish-card button.secondary { color: var(--ink); background: transparent; }
	.publish-card button:disabled, .export-card button:disabled { cursor: not-allowed; opacity: .45; }
	.publish-card > small { display: block; margin-top: .75rem; color: var(--rose); font-size: .62rem; }
	.save-message { margin: .85rem 0 0; font-size: .67rem; line-height: 1.5; }
	.save-message.success { color: var(--accent-deep); }
	.save-message.error { color: var(--rose); }
	.export-card { transform: rotate(-.3deg); }
	.export-card button { margin-top: .75rem; }
	.export-card button.secondary { color: var(--ink); background: transparent; }
	.export-card > small { display: block; margin-top: .75rem; color: var(--rose); font-size: .62rem; }
	@media (max-width: 900px) { .workspace { grid-template-columns: 1fr; } .proof-column { position: static; grid-template-columns: 1fr 1fr; } }
	@media (max-width: 680px) { .editor-header { align-items: start; flex-direction: column; } .open-strip { align-items: stretch; flex-direction: column; } .open-button { text-align: center; } .form-sheet { grid-template-columns: 1fr; } .wide, .section-heading { grid-column: 1; } .proof-column { grid-template-columns: 1fr; } .photo-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
	@media (max-width: 430px) { .photo-heading { align-items: start; flex-direction: column; } .photo-grid { grid-template-columns: 1fr; } }
</style>
