<script lang="ts">
	type PreviewBlock = { kind: 'heading' | 'paragraph' | 'quote' | 'list'; text: string; level?: number };

	const categories = ['food', 'travel', 'running', 'books', 'movies', 'thoughts', 'life', 'quotes'];
	const tones = ['clay', 'forest', 'dawn', 'ink', 'plum', 'sand', 'mist'];
	const today = new Date().toISOString().slice(0, 10);

	let title = $state('');
	let slug = $state('');
	let slugTouched = $state(false);
	let date = $state(today);
	let category = $state('thoughts');
	let tags = $state('');
	let excerpt = $state('');
	let coverTone = $state('mist');
	let coverImage = $state('');
	let gallery = $state('');
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

	function slugify(value: string) {
		return value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);
	}

	function titleChanged() {
		if (!slugTouched) slug = slugify(title);
	}

	function list(value: string) {
		return value.split(/[\n,]/).map((item) => item.trim()).filter(Boolean);
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
			category = typeof metadata.category === 'string' && categories.includes(metadata.category) ? metadata.category : 'thoughts';
			tags = strings(metadata.tags).join(', ');
			excerpt = typeof metadata.excerpt === 'string' ? metadata.excerpt : '';
			coverTone = typeof metadata.coverTone === 'string' && tones.includes(metadata.coverTone) ? metadata.coverTone : 'mist';
			coverImage = typeof metadata.coverImage === 'string' ? metadata.coverImage : '';
			gallery = strings(metadata.gallery).join('\n');
			videos = strings(metadata.videos).join('\n');
			location = typeof metadata.location === 'string' ? metadata.location : '';
			rating = typeof metadata.rating === 'number' ? String(metadata.rating) : '';
			quote = typeof metadata.quote === 'string' ? metadata.quote : '';
			source = typeof metadata.source === 'string' ? metadata.source : '';
			featured = metadata.featured === true;
			body = match[2].trim();
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
		<nav aria-label="Studio sections"><a href="/studio">Media desk</a><span>Writing desk</span></nav>
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
			<div class="field"><label for="slug">URL slug *</label><input id="slug" bind:value={slug} oninput={() => { slugTouched = true; slug = slugify(slug); }} placeholder="the-afternoon-rain-stayed" required /></div>
			<div class="field"><label for="date">Date *</label><input id="date" type="date" bind:value={date} required /></div>
			<div class="field"><label for="category">Section</label><select id="category" bind:value={category}>{#each categories as item}<option value={item}>{item}</option>{/each}</select></div>
			<div class="field"><label for="tone">Cover tone</label><select id="tone" bind:value={coverTone}>{#each tones as tone}<option value={tone}>{tone}</option>{/each}</select></div>
			<div class="wide field"><label for="tags">Tags <small>comma-separated</small></label><input id="tags" bind:value={tags} placeholder="rain, cafe, dhaka" /></div>
			<div class="wide field"><label for="excerpt">Short introduction *</label><textarea id="excerpt" rows="3" bind:value={excerpt} placeholder="One or two sentences shown on cards and archive pages." required></textarea></div>

			<div class="section-heading wide"><span>02</span><div><p class="eyebrow">Photographic notes</p><h2>Media & context</h2></div></div>
			<div class="wide field"><label for="cover">Cover image URL</label><input id="cover" type="url" bind:value={coverImage} placeholder="https://media.insomniyuck.me/…" /></div>
			<div class="field"><label for="gallery">Gallery URLs <small>one per line</small></label><textarea id="gallery" rows="5" bind:value={gallery}></textarea></div>
			<div class="field"><label for="videos">Video URLs <small>one per line</small></label><textarea id="videos" rows="5" bind:value={videos}></textarea></div>
			<div class="field"><label for="location">Location</label><input id="location" bind:value={location} placeholder="Dhaka" /></div>
			<div class="field"><label for="rating">Rating <small>0–5</small></label><input id="rating" type="number" min="0" max="5" step="0.5" bind:value={rating} /></div>
			<div class="field"><label for="quote">Favourite quote</label><textarea id="quote" rows="3" bind:value={quote}></textarea></div>
			<div class="field"><label for="source">Quote source</label><input id="source" bind:value={source} placeholder="Book, film, or person" /></div>
			<label class="featured wide"><input type="checkbox" bind:checked={featured} /><span>Feature this memory on the front page</span></label>

			<div class="section-heading wide"><span>03</span><div><p class="eyebrow">The story</p><h2>Markdown body</h2></div></div>
			<div class="wide field"><label for="body">Your writing *</label><textarea class="body-input" id="body" rows="20" bind:value={body} required></textarea><small class="help">Use ## for headings, &gt; for a quotation, and - for a list.</small></div>
		</form>

		<aside class="proof-column">
			<section class="proof">
				<p class="proof-label">Reader's proof</p>
				{#if coverImage}<img class="cover" src={coverImage} alt="Post cover preview" />{/if}
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

			<section class="export-card">
				<p class="eyebrow">Ready for filing</p>
				<h2>{slug || 'your-post-file'}.svx</h2>
				<p>Save this file inside <code>content/posts/{category}/</code>, then commit and deploy it.</p>
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
	.field > label, .featured { font-size: .58rem; font-weight: 600; letter-spacing: .13em; text-transform: uppercase; }
	label small { color: var(--ink-soft); font-weight: 400; letter-spacing: 0; text-transform: none; }
	input, textarea, select { width: 100%; padding: .78rem .85rem; color: var(--ink); border: 1px solid var(--line); border-radius: 0; background: color-mix(in srgb, var(--paper) 68%, transparent); }
	textarea { resize: vertical; line-height: 1.5; }
	.body-input { min-height: 28rem; font-family: ui-monospace, SFMono-Regular, Consolas, monospace; font-size: .83rem; line-height: 1.7; }
	.help { color: var(--ink-soft); font-size: .65rem; }
	.featured { display: flex; gap: .75rem; align-items: center; padding: 1rem; border: 1px solid var(--line); cursor: pointer; }
	.featured input { width: 1rem; height: 1rem; accent-color: var(--accent-deep); }
	.proof-column { position: sticky; top: 1.5rem; display: grid; gap: 1.5rem; }
	.proof, .export-card { position: relative; padding: clamp(1.5rem, 4vw, 2.5rem); border: 1px solid var(--line-strong); background: var(--paper-raised); box-shadow: var(--shadow); transform: rotate(.25deg); }
	.proof::before { position: absolute; top: -.7rem; left: 36%; width: 7rem; height: 1.5rem; content: ''; background: color-mix(in srgb, var(--accent-soft) 78%, transparent); transform: rotate(-2deg); }
	.proof-label { margin: 0 0 1.5rem; padding-bottom: .65rem; color: var(--ink-soft); border-bottom: 1px solid var(--line); font-size: .54rem; font-weight: 600; letter-spacing: .16em; text-transform: uppercase; }
	.cover { display: block; width: 100%; aspect-ratio: 4 / 3; margin-bottom: 1.4rem; padding: .5rem .5rem 1.35rem; object-fit: cover; border: 1px solid var(--line); background: var(--photo-mat); transform: rotate(-.5deg); }
	.proof-category { color: var(--accent-deep); font-size: .56rem; font-weight: 600; letter-spacing: .14em; text-transform: uppercase; }
	.proof > h2 { margin: .5rem 0 .8rem; font-family: var(--font-display); font-size: clamp(2.4rem, 5vw, 3.5rem); font-weight: 400; line-height: .92; letter-spacing: -.035em; }
	.proof-excerpt { color: var(--ink-soft); font-family: var(--font-display); font-size: 1.12rem; font-style: italic; line-height: 1.5; }
	.story { margin-top: 2rem; padding-top: 1.4rem; border-top: 1px solid var(--line); }
	.story p { margin: 0 0 1rem; font-family: var(--font-display); font-size: 1.05rem; line-height: 1.65; }
	.story h3 { margin: 1.8rem 0 .6rem; font-family: var(--font-display); font-size: 1.65rem; font-weight: 500; }
	.story h3.large { font-size: 2rem; }
	.story blockquote { margin: 1.5rem 0; padding-left: 1rem; color: var(--ink-soft); border-left: 2px solid var(--rose); font-family: var(--font-display); font-size: 1.25rem; font-style: italic; }
	.story .list { margin: .25rem 0; }
	.export-card { transform: rotate(-.3deg); }
	.export-card h2 { margin: .5rem 0; overflow-wrap: anywhere; font-family: var(--font-display); font-size: 1.7rem; font-weight: 500; }
	.export-card p:not(.eyebrow) { color: var(--ink-soft); font-size: .72rem; line-height: 1.6; }
	code { color: var(--ink); }
	.export-card button { width: 100%; margin-top: .75rem; padding: .85rem; color: var(--paper-raised); border: 1px solid var(--accent-deep); background: var(--accent-deep); cursor: pointer; font-size: .6rem; font-weight: 600; letter-spacing: .12em; text-transform: uppercase; }
	.export-card button.secondary { color: var(--ink); background: transparent; }
	.export-card button:disabled { cursor: not-allowed; opacity: .45; }
	.export-card > small { display: block; margin-top: .75rem; color: var(--rose); font-size: .62rem; }
	@media (max-width: 900px) { .workspace { grid-template-columns: 1fr; } .proof-column { position: static; grid-template-columns: 1fr 1fr; } }
	@media (max-width: 680px) { .editor-header { align-items: start; flex-direction: column; } .open-strip { align-items: stretch; flex-direction: column; } .open-button { text-align: center; } .form-sheet { grid-template-columns: 1fr; } .wide, .section-heading { grid-column: 1; } .proof-column { grid-template-columns: 1fr; } }
</style>
