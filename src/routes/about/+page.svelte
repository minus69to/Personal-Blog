<script lang="ts">
	import PageHeader from '$lib/components/PageHeader.svelte';
</script>

<svelte:head><title>About — Insomniyuck</title></svelte:head>

<main class="page-shell">
	<PageHeader kicker="A little introduction" title="About this diary" description="The person behind the pages—and the reason these small moments have a place to stay." mark="i" />
	<section class="about-grid">
		<div class="portrait">
			<img src="/image/about-photo.jpg" alt="Souvik writing on his laptop" />
		</div>
		<div class="story">
			<p class="opening">Hello. This is my small corner of the internet.</p>
			<p>I made Insomniyuck as a home for memories that would otherwise live between camera rolls, old messages, and half-finished notes.</p>
			<p>Here I keep stories about food, distant roads, running, books, films, friends, and the wonderfully ordinary days between bigger events.</p>
			<blockquote>Not a highlight reel. Just a life, noticed carefully.</blockquote>
			<div class="interests">
				<span>long runs</span><span>good coffee</span><span>quiet films</span><span>window seats</span>
			</div>
			<a class="note-link" href="https://chithi.me/insomniyuck" target="_blank" rel="noopener noreferrer">Send me an anonymous message →</a>
		</div>
	</section>
</main>

<style>
	.about-grid {
		display: grid;
		grid-template-columns: minmax(15rem, 0.75fr) minmax(18rem, 1fr);
		gap: clamp(3rem, 9vw, 8rem);
		padding-block: clamp(4rem, 9vw, 8rem);
	}

	.portrait {
		min-height: 34rem;
		overflow: hidden;
		background: linear-gradient(145deg, var(--accent-soft), color-mix(in srgb, var(--rose) 42%, var(--paper)));
		box-shadow: var(--shadow);
		transform: rotate(-1.5deg);
	}

	.portrait img {
		display: block;
		width: 100%;
		height: 100%;
		min-height: 34rem;
		object-fit: cover;
		object-position: center;
		filter: saturate(0.9) contrast(0.97);
	}

	.story {
		align-self: center;
		padding: clamp(1.5rem, 4vw, 3rem);
		border: 1px solid var(--line);
		border-radius: 1.2rem 1.2rem 1.2rem .3rem;
		background: color-mix(in srgb, var(--paper-raised) 70%, transparent);
		box-shadow: 0 18px 50px rgba(48,48,39,.06);
	}

	.story p {
		color: var(--ink-soft);
		font-size: 0.94rem;
		line-height: 1.9;
	}

	.story .opening {
		margin-top: 0;
		color: var(--ink);
		font-family: var(--font-display);
		font-size: 2.2rem;
		line-height: 1.1;
	}

	blockquote {
		margin: 2.5rem 0;
		padding: 1.5rem 0 1.5rem 2rem;
		border-left: 1px solid var(--accent);
		font-family: var(--font-display);
		font-size: 1.6rem;
		font-style: italic;
	}

	.interests {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		margin-bottom: 2.5rem;
	}

	.interests span {
		padding: 0.45rem 0.8rem;
		border: 1px solid var(--line);
		border-radius: 999px;
		color: var(--ink-soft);
		font-size: 0.66rem;
	}

	.note-link {
		padding-bottom: 0.4rem;
		border-bottom: 1px solid var(--accent);
		font-family: var(--font-display);
		font-size: 1.1rem;
		font-style: italic;
	}

	@media (max-width: 700px) {
		.about-grid { grid-template-columns: 1fr; }
		.portrait { min-height: 26rem; }
		.portrait img { min-height: 26rem; }
	}
</style>
