<script lang="ts">
	import CategoryBadge from '$lib/components/CategoryBadge.svelte';
	import Gallery from '$lib/components/Gallery.svelte';
	import InlineMarkdown from '$lib/components/InlineMarkdown.svelte';
	import VideoGallery from '$lib/components/VideoGallery.svelte';
	import { formatDate } from '$lib/data/posts';
	let { data } = $props();
	const Content = $derived(data.content);
</script>

<svelte:head>
	<title>{data.post.title} — Insomniyuck</title>
	<meta name="description" content={data.post.excerpt} />
	<meta property="og:type" content="article" />
	<meta property="og:title" content={`${data.post.title} — Insomniyuck`} />
	<meta property="og:description" content={data.post.excerpt} />
	{#if data.post.coverImage}<meta property="og:image" content={data.post.coverImage} />{/if}
	<meta property="article:published_time" content={data.post.date} />
	<meta property="article:section" content={data.post.category} />
</svelte:head>

<article class="page-shell" lang={data.post.language}>
	<header>
		<CategoryBadge category={data.post.category} />
		<h1>{data.post.title}</h1>
		<p>{data.post.excerpt}</p>
		<div class="meta"><time datetime={data.post.date}>{formatDate(data.post.date)}</time>{#if data.post.location}<span>{data.post.location}</span>{/if}</div>
	</header>
	<div class="cover {data.post.coverTone}">
		{#if data.post.coverImage}<img src={data.post.coverImage} alt={`Cover for ${data.post.title}`} />{:else}<span>{data.post.category}</span>{/if}
	</div>
	<section class="story-layout">
		<aside>
			<p class="eyebrow">Filed under</p>
			<div class="tags">{#each data.post.tags as tag}<span>{tag}</span>{/each}</div>
			{#if data.post.rating}<div class="fact"><small>Rating</small><strong>{data.post.rating} / 5</strong></div>{/if}
			{#if data.post.location}<div class="fact"><small>Location</small><strong>{data.post.location}</strong></div>{/if}
			{#if data.post.source}<div class="fact"><small>Source</small><strong>{data.post.source}</strong></div>{/if}
		</aside>
		<div class="prose">
			{#if data.blocks}
				{#each data.blocks as block}
					{#if block.kind === 'heading'}
						{#if block.level === 3}<h3><InlineMarkdown text={block.text} /></h3>{:else}<h2><InlineMarkdown text={block.text} /></h2>{/if}
					{:else if block.kind === 'quote'}
						<blockquote><p><InlineMarkdown text={block.text} /></p></blockquote>
					{:else if block.kind === 'list'}
						<ul>{#each block.items as item}<li><InlineMarkdown text={item} /></li>{/each}</ul>
					{:else}
						<p><InlineMarkdown text={block.text} /></p>
					{/if}
				{/each}
			{:else if Content}
				<Content />
			{/if}
		</div>
	</section>
	{#if data.post.gallery.length}<Gallery images={data.post.gallery} title={data.post.title} />{/if}
	{#if data.post.videos.length}<VideoGallery videos={data.post.videos} title={data.post.title} />{/if}
	<footer class="post-footer"><a href={`/${data.post.category}`}>← Back to the collection</a><a href="/archive">View the archive →</a></footer>
</article>

<style>
	article { padding-bottom: clamp(5rem, 10vw, 9rem); }
	header { max-width: 52rem; margin: 0 auto; padding: clamp(4rem, 9vw, 7rem) 0 3rem; text-align: center; }
	h1 { margin: 1rem 0; font-family: var(--font-display); font-size: clamp(3.6rem, 9vw, 7rem); font-weight: 400; line-height: 0.85; letter-spacing: -0.055em; }
	header > p { max-width: 38rem; margin: 0 auto; color: var(--ink-soft); line-height: 1.8; }
	.meta { display: flex; justify-content: center; gap: 1.5rem; margin-top: 1.5rem; color: var(--ink-soft); font-size: 0.65rem; letter-spacing: 0.06em; }
	.cover { display: grid; min-height: clamp(24rem, 55vw, 43rem); place-items: center; color: rgba(255,255,255,.75); background: #aaa; font-family: var(--font-display); font-size: clamp(3rem, 8vw, 7rem); font-style: italic; }
	.cover { overflow: hidden; border-radius: 1.2rem 1.2rem 1.2rem .3rem; box-shadow: 0 24px 70px rgba(48,48,39,.11); }
	.cover img { width: 100%; height: 100%; min-height: inherit; object-fit: cover; }
	.cover.clay { background: linear-gradient(145deg, #c79377, #7e594d); }
	.cover.forest { background: linear-gradient(145deg, #a4ad8b, #4f5d4b); }
	.cover.dawn { background: linear-gradient(145deg, #d8b18a, #a87162); }
	.cover.ink { background: linear-gradient(145deg, #68717a, #343b43); }
	.cover.plum { background: linear-gradient(145deg, #9c7c85, #594951); }
	.cover.sand { background: linear-gradient(145deg, #d8c9a9, #a59173); }
	.cover.mist { background: linear-gradient(145deg, #b8c6c4, #758988); }
	.story-layout { display: grid; grid-template-columns: 11rem minmax(0, 40rem); justify-content: center; gap: clamp(3rem, 8vw, 7rem); padding-block: clamp(4rem, 9vw, 8rem); }
	aside { padding-top: .7rem; }
	.tags { display: flex; flex-wrap: wrap; gap: .4rem; margin-top: 1rem; }
	.tags span { padding: .35rem .65rem; border: 1px solid var(--line); border-radius: 999px; color: var(--ink-soft); font-size: .6rem; }
	.fact { margin-top: 2rem; padding-top: 1rem; border-top: 1px solid var(--line); }
	.fact small, .fact strong { display: block; }
	.fact small { margin-bottom: .35rem; color: var(--ink-soft); font-size: .58rem; letter-spacing: .12em; text-transform: uppercase; }
	.fact strong { font-family: var(--font-display); font-size: 1.15rem; font-weight: 500; }
	.prose { min-width: 0; }
	.prose :global(p) { margin: 0 0 1.5rem; color: color-mix(in srgb, var(--ink) 86%, var(--ink-soft)); font-family: var(--font-display); font-size: clamp(1.15rem, 2vw, 1.32rem); line-height: 1.75; }
	.prose :global(p:first-child::first-letter) { float: left; margin: .08em .1em 0 0; color: var(--accent-deep); font-size: 4.2em; line-height: .72; }
	.prose :global(h2) { margin: 3rem 0 1rem; font-family: var(--font-display); font-size: clamp(2rem, 4vw, 2.8rem); font-weight: 500; line-height: 1; }
	.prose :global(h3) { margin: 2.3rem 0 .8rem; font-family: var(--font-display); font-size: clamp(1.55rem, 3vw, 2.1rem); font-weight: 500; line-height: 1.15; }
	.prose :global(blockquote) { margin: 3rem 0; padding: 2rem 0 2rem 2rem; border-left: 1px solid var(--accent); }
	.prose :global(blockquote p) { margin: 0; color: var(--accent-deep); font-size: clamp(1.65rem, 4vw, 2.25rem); font-style: italic; line-height: 1.25; }
	.prose :global(ul) { margin: 1.5rem 0 2rem; padding: 0; list-style: none; }
	.prose :global(li) { padding: .7rem 0; border-bottom: 1px solid var(--line); font-family: var(--font-display); font-size: 1.15rem; }
	.prose :global(strong) { color: var(--ink); font-weight: 600; }
	.post-footer { display: flex; justify-content: space-between; max-width: 58rem; margin: 0 auto; padding-top: 2rem; border-top: 1px solid var(--line); }
	.post-footer a { color: var(--ink-soft); font-family: var(--font-display); font-size: 1rem; font-style: italic; }
	.post-footer a:hover { color: var(--accent-deep); }
	article:lang(bn) h1 { line-height: 1.08; letter-spacing: -.025em; }
	article:lang(bn) .prose :global(p) { line-height: 1.9; }
	article:lang(bn) .prose :global(h2) { line-height: 1.28; }
	article:lang(bn) .prose :global(p:first-child::first-letter) { margin-top: .02em; line-height: .85; }

	@media (max-width: 700px) {
		.story-layout { grid-template-columns: 1fr; gap: 2rem; }
		aside { display: grid; grid-template-columns: 1fr auto; align-items: start; gap: 1rem; padding-bottom: 1.5rem; border-bottom: 1px solid var(--line); }
		aside .eyebrow { grid-column: 1 / -1; }
		.fact { margin: 0; padding: 0; border: 0; text-align: right; }
		.post-footer { align-items: flex-start; flex-direction: column; gap: 1rem; }
	}
</style>
