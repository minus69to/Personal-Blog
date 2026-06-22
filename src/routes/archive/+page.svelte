<script lang="ts">
	import CategoryBadge from '$lib/components/CategoryBadge.svelte';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import { categoryNames, formatDate, type Category } from '$lib/data/posts';

	let { data } = $props();
	const posts = $derived(data.posts);

	let selectedCategory = $state<Category | 'all'>('all');
	let selectedYear = $state('all');
	let selectedTag = $state('all');
	let search = $state('');

	const years = $derived([...new Set(posts.map((post) => post.date.slice(0, 4)))]);
	const tags = $derived([...new Set(posts.flatMap((post) => post.tags))].sort());
	const filteredPosts = $derived(
		posts.filter((post) => {
			const query = search.trim().toLowerCase();
			return (
				(selectedCategory === 'all' || post.category === selectedCategory) &&
				(selectedYear === 'all' || post.date.startsWith(selectedYear)) &&
				(selectedTag === 'all' || post.tags.includes(selectedTag)) &&
				(!query || `${post.title} ${post.excerpt} ${post.tags.join(' ')}`.toLowerCase().includes(query))
			);
		})
	);

	function resetFilters() {
		selectedCategory = 'all';
		selectedYear = 'all';
		selectedTag = 'all';
		search = '';
	}
</script>

<svelte:head><title>Archive — Insomniyuck</title></svelte:head>

<main class="page-shell">
	<PageHeader kicker="Everything, in time" title="The archive" description="All the entries gathered in one place, beginning with the newest and wandering backward." mark="∞" />
	<section class="filters" aria-label="Filter the archive">
		<label class="search"><span>Search</span><input bind:value={search} type="search" placeholder="A title, feeling, place…" /></label>
		<label><span>Category</span><select bind:value={selectedCategory}><option value="all">All categories</option>{#each Object.entries(categoryNames) as [value, label]}<option {value}>{label}</option>{/each}</select></label>
		<label><span>Year</span><select bind:value={selectedYear}><option value="all">All years</option>{#each years as year}<option value={year}>{year}</option>{/each}</select></label>
		<label><span>Tag</span><select bind:value={selectedTag}><option value="all">All tags</option>{#each tags as tag}<option value={tag}>{tag}</option>{/each}</select></label>
	</section>
	<div class="results"><p><strong>{filteredPosts.length}</strong> {filteredPosts.length === 1 ? 'memory' : 'memories'} found</p><button onclick={resetFilters}>Clear filters</button></div>
	<section class="archive-list">
		{#each filteredPosts as post, index}
			<a href={`/post/${post.slug}`}>
				<span class="number">{String(index + 1).padStart(2, '0')}</span>
				<div><CategoryBadge category={post.category} /><h2>{post.title}</h2></div>
				<time datetime={post.date}>{formatDate(post.date)}</time>
				<span class="arrow">↗</span>
			</a>
		{/each}
		{#if filteredPosts.length === 0}
			<div class="empty"><span aria-hidden="true">◇</span><h2>No memories found</h2><p>Try a different category, tag, year, or search.</p><button onclick={resetFilters}>Show everything</button></div>
		{/if}
	</section>
</main>

<style>
	.filters { display: grid; grid-template-columns: minmax(14rem, 1.6fr) repeat(3, minmax(8rem, 1fr)); gap: .75rem; margin-top: clamp(3rem, 6vw, 5rem); padding: 1rem; border: 1px solid var(--line); border-radius: 1rem 1rem 1rem .25rem; background: color-mix(in srgb, var(--paper-raised) 75%, transparent); box-shadow: 0 14px 40px rgba(48,48,39,.05); }
	label span { display: block; margin: 0 0 .45rem .15rem; color: var(--ink-soft); font-size: .57rem; font-weight: 600; letter-spacing: .12em; text-transform: uppercase; }
	input, select { width: 100%; height: 2.9rem; padding: 0 .85rem; color: var(--ink); border: 1px solid var(--line); border-radius: .55rem; outline: none; background: var(--paper); font-size: .75rem; }
	input:focus, select:focus { border-color: var(--accent); box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 13%, transparent); }
	.results { display: flex; align-items: center; justify-content: space-between; padding: 1.25rem .25rem 0; color: var(--ink-soft); font-size: .68rem; }
	.results p { margin: 0; }
	.results strong { color: var(--ink); }
	.results button, .empty button { padding: 0; color: var(--accent-deep); border: 0; border-bottom: 1px solid var(--accent); background: transparent; font-family: var(--font-display); font-size: .95rem; font-style: italic; cursor: pointer; }
	.archive-list {
		padding-block: 1.5rem clamp(3rem, 7vw, 6rem);
	}

	.archive-list > a {
		position: relative;
		display: grid;
		grid-template-columns: 2.5rem 1fr auto 1.5rem;
		align-items: center;
		gap: clamp(1rem, 3vw, 2.5rem);
		margin-bottom: .75rem;
		padding: 1.35rem 1.5rem;
		border: 1px solid var(--line);
		border-radius: .08rem;
		background: color-mix(in srgb, var(--paper-raised) 70%, transparent);
		transition: transform 220ms ease, box-shadow 220ms ease, border-color 220ms ease;
	}

	.archive-list > a::before { position: absolute; top: 0; bottom: 0; left: 0; width: .25rem; content: ''; background: var(--accent); }
	.archive-list > a:nth-child(3n + 2)::before { background: var(--rose); }

	.archive-list > a:hover { border-color: color-mix(in srgb, var(--accent) 48%, var(--line)); box-shadow: 0 15px 35px rgba(48,48,39,.09); transform: translateY(-.2rem); }
	.archive-list > a:hover h2 { color: var(--accent-deep); transform: translateX(0.35rem); }
	.number, time { color: var(--ink-soft); font-size: 0.62rem; letter-spacing: 0.06em; }
	h2 { margin: 0.35rem 0 0; font-family: var(--font-display); font-size: clamp(1.45rem, 3vw, 2rem); font-weight: 500; transition: color 180ms ease, transform 180ms ease; }
	.arrow { color: var(--accent); }
	.empty { padding: clamp(4rem, 9vw, 7rem) 1rem; border: 1px dashed var(--line); border-radius: 1rem; text-align: center; }
	.empty > span { color: var(--accent); font-size: 2rem; }
	.empty h2 { margin: .8rem 0 .25rem; color: var(--ink); transform: none; }
	.empty p { margin: 0 0 1.5rem; color: var(--ink-soft); font-size: .75rem; }

	@media (max-width: 850px) { .filters { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
	@media (max-width: 600px) {
		.filters { grid-template-columns: 1fr; padding: .8rem; }
		.archive-list > a { grid-template-columns: 1.5rem 1fr auto; }
		time { display: none; }
		.archive-list > a { padding: 1.1rem .9rem; }
	}
</style>
