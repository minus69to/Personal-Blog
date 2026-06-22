<script lang="ts">
	let { data } = $props();
	let posts = $state<typeof data.posts>([]);
	let filter = $state<'all' | 'draft' | 'published'>('all');
	let query = $state('');
	let deleting = $state('');
	let message = $state('');
	let migration = $state<typeof data.migration>({ total: 0, ready: [], conflicts: [] });
	let importing = $state(false);
	let restoring = $state(false);
	let overwriteRestore = $state(false);
	let initialized = false;
	$effect(() => {
		if (initialized) return;
		posts = data.posts;
		migration = data.migration;
		message = data.error;
		initialized = true;
	});
	let visiblePosts = $derived(posts.filter((post) => {
		const matchesStatus = filter === 'all' || post.status === filter;
		const needle = query.trim().toLowerCase();
		const matchesQuery = !needle || `${post.title} ${post.category} ${post.tags.join(' ')}`.toLowerCase().includes(needle);
		return matchesStatus && matchesQuery;
	}));

	function formatDate(value: string) {
		return new Intl.DateTimeFormat('en', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(value));
	}

	async function removePost(slug: string, title: string) {
		if (!confirm(`Delete “${title}”? This cannot be undone.`)) return;
		deleting = slug;
		message = '';
		try {
			const response = await fetch(`/api/studio/posts/${slug}`, { method: 'DELETE' });
			if (!response.ok) {
				const result = await response.json().catch(() => ({})) as { error?: string };
				throw new Error(result.error || 'Unable to delete this post.');
			}
			posts = posts.filter((post) => post.slug !== slug);
			message = `“${title}” was removed from the development archive.`;
		} catch (error) {
			message = error instanceof Error ? error.message : 'Unable to delete this post.';
		} finally {
			deleting = '';
		}
	}

	async function importLegacyPosts() {
		if (!migration.ready.length || importing) return;
		importing = true;
		message = `Importing ${migration.ready.length} existing ${migration.ready.length === 1 ? 'post' : 'posts'}…`;
		try {
			const response = await fetch('/api/studio/posts/import-static', { method: 'POST' });
			const result = await response.json().catch(() => ({})) as { imported?: string[]; skipped?: string[]; failed?: { slug: string }[]; error?: string };
			if (!response.ok && response.status !== 207) throw new Error(result.error || 'Unable to import existing posts.');
			if (result.failed?.length) throw new Error(`${result.failed.length} posts could not be imported.`);
			message = `${result.imported?.length ?? 0} existing posts imported safely. Refreshing the archive…`;
			window.location.reload();
		} catch (error) {
			message = error instanceof Error ? error.message : 'Unable to import existing posts.';
			importing = false;
		}
	}

	async function restoreBackup(event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		const file = input.files?.[0];
		input.value = '';
		if (!file || restoring) return;
		if (file.size > 50 * 1024 * 1024) {
			message = 'This backup is larger than 50 MB. Restore it in smaller archive files.';
			return;
		}
		if (overwriteRestore && !confirm('Replace database posts that have the same slug as this backup?')) return;
		restoring = true;
		message = `Reading ${file.name}…`;
		try {
			const backup = JSON.parse(await file.text()) as { schemaVersion?: unknown; posts?: unknown; deletedSlugs?: unknown };
			if (backup.schemaVersion !== 1 || !Array.isArray(backup.posts)) throw new Error('This is not an Insomniyuck Studio backup file.');
			if (backup.posts.length > 5000) throw new Error('This backup contains too many posts for one restore.');
			let imported = 0;
			let replaced = 0;
			let skipped = 0;
			for (let index = 0; index < backup.posts.length; index += 20) {
				message = `Restoring posts ${index + 1}–${Math.min(index + 20, backup.posts.length)} of ${backup.posts.length}…`;
				const response = await fetch('/api/studio/posts/restore', {
					method: 'POST',
					headers: { 'content-type': 'application/json' },
					body: JSON.stringify({ posts: backup.posts.slice(index, index + 20), overwrite: overwriteRestore })
				});
				const result = await response.json().catch(() => ({})) as { imported?: string[]; replaced?: string[]; skipped?: string[]; error?: string };
				if (!response.ok) throw new Error(result.error || `Restore stopped near post ${index + 1}.`);
				imported += result.imported?.length ?? 0;
				replaced += result.replaced?.length ?? 0;
				skipped += result.skipped?.length ?? 0;
			}
			if (Array.isArray(backup.deletedSlugs) && backup.deletedSlugs.length) {
				const response = await fetch('/api/studio/posts/restore', {
					method: 'POST',
					headers: { 'content-type': 'application/json' },
					body: JSON.stringify({ deletedSlugs: backup.deletedSlugs })
				});
				const result = await response.json().catch(() => ({})) as { error?: string };
				if (!response.ok) throw new Error(result.error || 'Posts restored, but deletion history could not be restored.');
			}
			message = `Restore complete: ${imported} added, ${replaced} replaced, ${skipped} already present. Refreshing the archive…`;
			window.location.reload();
		} catch (error) {
			message = error instanceof Error ? error.message : 'Unable to restore this backup.';
			restoring = false;
		}
	}
</script>

<svelte:head>
	<title>Post Archive — Insomniyuck Studio</title>
	<meta name="robots" content="noindex,nofollow" />
</svelte:head>

<main class="page-shell archive-desk">
	<header class="archive-header">
		<div>
			<p class="eyebrow">Private editorial room</p>
			<h1>Post archive</h1>
			<p>Review every draft and published edition filed in the development database.</p>
		</div>
		<nav aria-label="Studio sections"><a href="/studio">Media desk</a><a href="/studio/new">Write new</a><span>Post archive</span></nav>
	</header>

	<section class="controls" aria-label="Post filters">
		<div class="tabs">
			<button class:active={filter === 'all'} type="button" onclick={() => filter = 'all'}>All <span>{posts.length}</span></button>
			<button class:active={filter === 'draft'} type="button" onclick={() => filter = 'draft'}>Drafts <span>{posts.filter((post) => post.status === 'draft').length}</span></button>
			<button class:active={filter === 'published'} type="button" onclick={() => filter = 'published'}>Published <span>{posts.filter((post) => post.status === 'published').length}</span></button>
		</div>
		<label><span>Search the archive</span><input type="search" bind:value={query} placeholder="Title, section, or tag" /></label>
	</section>

	{#if message}<p class="notice" aria-live="polite">{message}</p>{/if}
	{#if migration.total}
		<section class="migration-card">
			<div>
				<p class="eyebrow">Legacy shelf</p>
				<h2>Existing `.svx` editions</h2>
				<p>{migration.conflicts.length} already in the database · {migration.ready.length} ready to import · nothing will be overwritten.</p>
			</div>
			<button type="button" onclick={importLegacyPosts} disabled={!migration.ready.length || importing}>{importing ? 'Importing…' : migration.ready.length ? `Import ${migration.ready.length} posts` : 'Import complete'}</button>
		</section>
	{/if}
	<section class="backup-card">
		<div>
			<p class="eyebrow">Private backup</p>
			<h2>Carry the whole archive</h2>
			<p>Download every draft, published post, timestamp, and full Markdown story as one portable JSON file.</p>
		</div>
		<div class="backup-actions">
			<a href="/api/studio/posts/export" download>Download backup</a>
			<label class="restore-button" class:disabled={restoring}><input type="file" accept="application/json,.json" onchange={restoreBackup} disabled={restoring} /><span>{restoring ? 'Restoring…' : 'Restore backup'}</span></label>
			<label class="overwrite"><input type="checkbox" bind:checked={overwriteRestore} disabled={restoring} /><span>Replace matching posts</span></label>
		</div>
	</section>

	<section class="post-stack" aria-label="Saved posts">
		{#each visiblePosts as post, index (post.slug)}
			<article class:published={post.status === 'published'}>
				<div class="folio">{String(index + 1).padStart(2, '0')}</div>
				<div class="post-copy">
					<div class="meta"><span class="status">{post.status}</span><span>{post.category}</span><span>{formatDate(post.date)}</span><span>{post.language === 'bn' ? 'বাংলা' : 'English'}</span></div>
					<h2 lang={post.language}>{post.title}</h2>
					<p lang={post.language}>{post.excerpt}</p>
					{#if post.tags.length}<div class="tags">{#each post.tags as tag}<span>#{tag}</span>{/each}</div>{/if}
				</div>
				<div class="actions">
					<a href={`/studio/new?slug=${encodeURIComponent(post.slug)}`}>Edit post</a>
					<button type="button" onclick={() => removePost(post.slug, post.title)} disabled={deleting === post.slug}>{deleting === post.slug ? 'Deleting…' : 'Delete'}</button>
				</div>
			</article>
		{:else}
			<div class="empty">
				<p class="eyebrow">No folios found</p>
				<h2>{posts.length ? 'Nothing matches this filter.' : 'The database archive is still empty.'}</h2>
				<a href="/studio/new">Write the first post →</a>
			</div>
		{/each}
	</section>
</main>

<style>
	.archive-desk { padding: clamp(3rem, 8vw, 6rem) 0 clamp(5rem, 10vw, 8rem); }
	.archive-header { display: flex; align-items: end; justify-content: space-between; gap: 2rem; padding-bottom: 2.5rem; border-bottom: 3px double var(--line-strong); }
	h1 { margin: .55rem 0 .5rem; font-family: var(--font-display); font-size: clamp(4rem, 10vw, 7rem); font-weight: 400; line-height: .78; letter-spacing: -.055em; }
	.archive-header > div > p:not(.eyebrow) { margin: 1rem 0 0; color: var(--ink-soft); font-family: var(--font-display); font-size: 1.15rem; }
	nav { display: flex; flex-wrap: wrap; gap: 1rem; align-items: center; font-size: .6rem; font-weight: 600; letter-spacing: .12em; text-transform: uppercase; }
	nav a { color: var(--ink-soft); }
	nav span { padding-bottom: .25rem; border-bottom: 2px solid var(--rose); }
	.controls { display: flex; justify-content: space-between; gap: 1.5rem; align-items: end; margin: 2rem 0 2.5rem; padding: 1rem 1.2rem; border: 1px solid var(--line); background: color-mix(in srgb, var(--paper-raised) 62%, transparent); }
	.tabs { display: flex; flex-wrap: wrap; gap: .35rem; }
	.tabs button { padding: .65rem .8rem; color: var(--ink-soft); border: 1px solid transparent; background: transparent; cursor: pointer; font-size: .58rem; font-weight: 600; letter-spacing: .1em; text-transform: uppercase; }
	.tabs button.active { color: var(--ink); border-color: var(--line-strong); background: var(--paper-raised); }
	.tabs span { margin-left: .25rem; color: var(--rose); }
	.controls label { display: grid; min-width: min(19rem, 100%); gap: .35rem; color: var(--ink-soft); font-size: .54rem; font-weight: 600; letter-spacing: .12em; text-transform: uppercase; }
	.controls input { width: 100%; padding: .7rem .8rem; color: var(--ink); border: 1px solid var(--line); border-radius: 0; background: var(--paper); }
	.notice { margin: -1rem 0 1.5rem; padding: .8rem 1rem; color: var(--accent-deep); border-left: 2px solid var(--accent); background: var(--accent-soft); font-size: .7rem; }
	.migration-card, .backup-card { display: flex; align-items: center; justify-content: space-between; gap: 2rem; margin-bottom: 2rem; padding: 1.4rem 1.6rem; border: 1px dashed var(--line-strong); background: color-mix(in srgb, var(--accent-soft) 52%, var(--paper-raised)); }
	.backup-card { background: color-mix(in srgb, var(--paper-raised) 76%, transparent); transform: rotate(-.08deg); }
	.migration-card h2, .backup-card h2 { margin: .35rem 0; font-size: 1.8rem; }
	.migration-card p:not(.eyebrow), .backup-card p:not(.eyebrow) { margin: 0; color: var(--ink-soft); font-size: .68rem; }
	.migration-card button { flex: 0 0 auto; padding: .8rem 1rem; color: var(--paper-raised); border: 1px solid var(--accent-deep); background: var(--accent-deep); cursor: pointer; font-size: .58rem; font-weight: 600; letter-spacing: .1em; text-transform: uppercase; }
	.migration-card button:disabled { cursor: default; opacity: .5; }
	.backup-actions { display: grid; flex: 0 0 auto; grid-template-columns: 1fr 1fr; gap: .55rem; }
	.backup-card a, .restore-button { padding: .8rem 1rem; color: var(--paper-raised); border: 1px solid var(--accent-deep); background: var(--accent-deep); cursor: pointer; font-size: .58rem; font-weight: 600; letter-spacing: .1em; text-align: center; text-transform: uppercase; }
	.restore-button { color: var(--ink); background: transparent; }
	.restore-button.disabled { cursor: wait; opacity: .5; }
	.restore-button input { position: absolute; width: 1px; height: 1px; overflow: hidden; opacity: 0; }
	.overwrite { display: flex; grid-column: 1 / -1; gap: .5rem; align-items: center; justify-content: end; color: var(--ink-soft); cursor: pointer; font-size: .55rem; }
	.overwrite input { width: .9rem; height: .9rem; accent-color: var(--accent-deep); }
	.post-stack { display: grid; gap: 1.2rem; }
	article { position: relative; display: grid; grid-template-columns: auto minmax(0, 1fr) auto; gap: 1.4rem; align-items: center; padding: clamp(1.2rem, 3vw, 2rem); border: 1px solid var(--line-strong); background: var(--paper-raised); box-shadow: var(--shadow); }
	article:nth-child(even) { transform: rotate(.1deg); }
	article::before { position: absolute; top: -.45rem; left: 12%; width: 5rem; height: .9rem; content: ''; background: color-mix(in srgb, var(--accent-soft) 76%, transparent); transform: rotate(-2deg); }
	.folio { color: var(--rose); font-family: var(--font-display); font-size: 2rem; }
	.post-copy { min-width: 0; }
	.meta { display: flex; flex-wrap: wrap; gap: .55rem 1rem; color: var(--ink-soft); font-size: .52rem; font-weight: 600; letter-spacing: .11em; text-transform: uppercase; }
	.meta .status { color: var(--rose); }
	article.published .meta .status { color: var(--accent-deep); }
	h2 { margin: .55rem 0 .35rem; font-family: var(--font-display); font-size: clamp(1.8rem, 4vw, 2.6rem); font-weight: 500; line-height: 1; }
	h2:lang(bn) { line-height: 1.25; }
	.post-copy > p { max-width: 48rem; margin: 0; color: var(--ink-soft); font-family: var(--font-display); font-size: 1rem; line-height: 1.5; }
	.tags { display: flex; flex-wrap: wrap; gap: .5rem; margin-top: .65rem; color: var(--accent-deep); font-size: .56rem; }
	.actions { display: grid; min-width: 7.5rem; gap: .55rem; }
	.actions a, .actions button { padding: .7rem .85rem; text-align: center; border: 1px solid var(--accent-deep); cursor: pointer; font-size: .56rem; font-weight: 600; letter-spacing: .1em; text-transform: uppercase; }
	.actions a { color: var(--paper-raised); background: var(--accent-deep); }
	.actions button { color: var(--rose); border-color: var(--line-strong); background: transparent; }
	.actions button:disabled { cursor: wait; opacity: .5; }
	.empty { padding: clamp(3rem, 8vw, 6rem) 1rem; text-align: center; border: 1px dashed var(--line-strong); background: color-mix(in srgb, var(--paper-raised) 55%, transparent); }
	.empty h2 { margin: .7rem 0 1.5rem; }
	.empty a { color: var(--accent-deep); border-bottom: 1px solid var(--accent); font-family: var(--font-display); font-style: italic; }
	@media (max-width: 760px) { .archive-header, .controls, .migration-card, .backup-card { align-items: stretch; flex-direction: column; } article { grid-template-columns: auto minmax(0, 1fr); } .actions { grid-column: 1 / -1; grid-template-columns: 1fr 1fr; } }
	@media (max-width: 540px) { .backup-actions { grid-template-columns: 1fr; } .overwrite { grid-column: 1; justify-content: start; } }
	@media (max-width: 480px) { article { gap: .8rem; padding: 1rem; } .folio { font-size: 1.4rem; } .controls { padding: .8rem; } .actions { grid-template-columns: 1fr; } }
</style>
