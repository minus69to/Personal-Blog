<script lang="ts">
	import { posts, type Category } from '$lib/data/posts';
	import { categoryDetails } from '$lib/data/categories';
	import PageHeader from './PageHeader.svelte';
	import PostCard from './PostCard.svelte';
	import QuoteCard from './QuoteCard.svelte';

	let { category }: { category: Category } = $props();
	const details = $derived(categoryDetails[category]);
	const categoryPosts = $derived(posts.filter((post) => post.category === category));
</script>

<svelte:head>
	<title>{details.title} — Insomniyuck</title>
	<meta name="description" content={details.description} />
</svelte:head>

<main class="page-shell">
	<PageHeader {...details} />
	<section class="post-list" class:single={categoryPosts.length === 1} aria-label={`${details.title} posts`}>
		{#each categoryPosts as post}
			{#if category === 'quotes'}
				<QuoteCard {post} />
			{:else}
				<PostCard {post} large={categoryPosts.length === 1} />
			{/if}
		{/each}
	</section>
</main>

<style>
	.post-list {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: clamp(3rem, 7vw, 6rem) clamp(2rem, 5vw, 4rem);
		padding-block: clamp(4rem, 8vw, 7rem);
	}

	.post-list.single {
		grid-template-columns: 1fr;
	}

	@media (max-width: 700px) {
		.post-list {
			grid-template-columns: 1fr;
		}
	}
</style>
