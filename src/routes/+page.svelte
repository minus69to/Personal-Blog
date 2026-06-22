<script lang="ts">
	import PostCard from '$lib/components/PostCard.svelte';
	import VisitCounter from '$lib/components/VisitCounter.svelte';
	import { categoryDetails } from '$lib/data/categories';
	import { posts } from '$lib/data/posts';

	const featured = posts.filter((post) => post.featured);
</script>

<svelte:head>
	<title>Insomniyuck</title>
	<meta
		name="description"
		content="A personal diary of food, places, motion, stories, and the moments between them."
	/>
	<meta property="og:type" content="website" />
	<meta property="og:title" content="Insomniyuck — A personal memory archive" />
	<meta property="og:description" content="A personal diary of food, places, motion, stories, and the moments between them." />
</svelte:head>

<main class="page-shell">
	<section class="hero">
		<div class="margin-note" aria-hidden="true">
			<span>est.</span>
			<i></i>
			<span>2026</span>
		</div>

		<div class="hero-copy">
			<p class="eyebrow">A personal memory archive</p>
			<h1>Small moments,<br /><em>kept with care.</em></h1>
			<p class="intro">A quiet corner for meals shared, roads taken, miles run, stories loved, and all the beautiful in-between.</p>
			<a class="soft-link" href="/archive">Wander through the archive <span>→</span></a>
			<div><VisitCounter /></div>
		</div>

		<div class="keepsake" aria-label="A decorative journal keepsake">
			<span class="tape"></span>
			<div class="botanical" aria-hidden="true">
				<svg viewBox="0 0 180 230">
					<path d="M88 217C91 169 86 121 100 73C106 50 119 28 134 12" />
					<path d="M98 82C75 75 58 57 54 34C77 38 96 57 98 82Z" />
					<path d="M91 124C113 113 138 114 157 127C139 144 110 143 91 124Z" />
					<path d="M88 166C68 157 52 139 50 116C74 122 88 142 88 166Z" />
					<path d="M105 63C125 63 144 53 156 36C134 30 113 42 105 63Z" />
				</svg>
			</div>
			<div class="caption">
				<span>Entry no. 001</span>
				<p>Collecting days<br />before they drift away.</p>
			</div>
		</div>

		<p class="side-script">places · people · passing thoughts</p>
	</section>

	<section class="featured">
		<div class="section-heading">
			<div>
				<p class="eyebrow">Selected pages</p>
				<h2>Featured memories</h2>
			</div>
			<p>A few recent moments from the diary—still warm around the edges.</p>
		</div>
		<div class="featured-grid">
			{#each featured as post}<PostCard {post} />{/each}
		</div>
	</section>

	<section class="shelves">
		<div class="shelf-title">
			<p class="eyebrow">Eight little shelves</p>
			<h2>Browse by feeling</h2>
		</div>
		<div class="category-list">
			{#each Object.entries(categoryDetails) as [slug, category]}
				<a href={`/${slug}`}>
					<span>{category.mark}</span>
					<strong>{category.title}</strong>
					<i>↗</i>
				</a>
			{/each}
		</div>
	</section>

	<section class="note-invite">
		<span aria-hidden="true">“</span>
		<div>
			<p class="eyebrow">Say something softly</p>
			<h2>Some words are easier<br />when they arrive unnamed.</h2>
		</div>
		<a href="https://ngl.link/insomniyuck1" target="_blank" rel="noreferrer">Send me an anonymous message <i>→</i></a>
	</section>
</main>

<style>
	main {
		padding-block: clamp(3rem, 8vw, 7rem) clamp(5rem, 10vw, 9rem);
	}

	.hero {
		position: relative;
		display: grid;
		min-height: 35rem;
		grid-template-columns: 2.5rem minmax(0, 1fr) minmax(16rem, 0.56fr);
		align-items: center;
		gap: clamp(2rem, 6vw, 6rem);
	}

	.margin-note {
		display: flex;
		align-self: stretch;
		align-items: center;
		flex-direction: column;
		gap: 0.8rem;
		padding-block: 1rem;
		color: var(--ink-soft);
		font-size: 0.58rem;
		letter-spacing: 0.16em;
		text-transform: uppercase;
		writing-mode: vertical-rl;
	}

	.margin-note i {
		width: 1px;
		height: 100%;
		background: var(--line);
	}

	.hero-copy {
		position: relative;
		z-index: 2;
		max-width: 44rem;
	}

	h1 {
		margin: 1rem 0 1.5rem;
		font-family: var(--font-display);
		font-size: clamp(4.3rem, 8vw, 7.5rem);
		font-weight: 400;
		line-height: 0.78;
		letter-spacing: -0.055em;
	}

	h1 em {
		color: var(--accent-deep);
		font-weight: 400;
	}

	.intro {
		max-width: 34rem;
		margin: 0;
		color: var(--ink-soft);
		font-size: clamp(0.95rem, 1.5vw, 1.08rem);
		line-height: 1.8;
	}

	.soft-link {
		display: inline-flex;
		align-items: center;
		gap: 0.75rem;
		margin-top: 2rem;
		padding-bottom: 0.4rem;
		border-bottom: 1px solid var(--accent);
		font-family: var(--font-display);
		font-size: 1.18rem;
		font-style: italic;
	}

	.soft-link span {
		font-family: 'DM Sans', sans-serif;
		font-style: normal;
		transition: transform 180ms ease;
	}

	.soft-link:hover span {
		transform: translateX(0.25rem);
	}

	.keepsake {
		position: relative;
		width: min(100%, 20rem);
		margin-left: auto;
		padding: 1.1rem 1.1rem 1.5rem;
		background: var(--paper-raised);
		box-shadow: var(--shadow);
		transform: rotate(2.5deg);
	}

	.keepsake::before {
		position: absolute;
		inset: 0.55rem;
		content: '';
		border: 1px solid var(--line);
		pointer-events: none;
	}

	.tape {
		position: absolute;
		top: -1rem;
		left: 50%;
		z-index: 2;
		width: 5.5rem;
		height: 2rem;
		background: color-mix(in srgb, var(--accent-soft) 70%, transparent);
		transform: translateX(-50%) rotate(-3deg);
	}

	.botanical {
		display: grid;
		min-height: 21rem;
		place-items: center;
		background: color-mix(in srgb, var(--accent-soft) 44%, var(--paper-raised));
	}

	.botanical svg {
		width: 65%;
		fill: color-mix(in srgb, var(--accent) 13%, transparent);
		stroke: var(--accent-deep);
		stroke-linecap: round;
		stroke-linejoin: round;
		stroke-width: 1.25;
	}

	.caption {
		position: relative;
		padding: 1.3rem 0.5rem 0.25rem;
	}

	.caption span {
		color: var(--rose);
		font-size: 0.58rem;
		font-weight: 600;
		letter-spacing: 0.18em;
		text-transform: uppercase;
	}

	.caption p {
		margin: 0.4rem 0 0;
		font-family: var(--font-display);
		font-size: 1.25rem;
		font-style: italic;
		line-height: 1.1;
	}

	.side-script {
		position: absolute;
		right: -1rem;
		bottom: -1.5rem;
		margin: 0;
		color: var(--ink-soft);
		font-family: var(--font-display);
		font-size: 0.95rem;
		font-style: italic;
		letter-spacing: 0.06em;
	}

	@media (max-width: 850px) {
		.hero {
			grid-template-columns: minmax(0, 1fr) minmax(13rem, 0.55fr);
			gap: 2rem;
		}

		.margin-note,
		.side-script {
			display: none;
		}

		h1 {
			font-size: clamp(3.7rem, 10vw, 6rem);
		}

		.botanical {
			min-height: 17rem;
		}
	}

	@media (max-width: 640px) {
		main {
			padding-top: 4rem;
		}

		.hero {
			min-height: auto;
			grid-template-columns: 1fr;
		}

		.hero-copy {
			text-align: center;
		}

		h1 {
			font-size: clamp(3.8rem, 19vw, 5.5rem);
		}

		.intro {
			margin-inline: auto;
		}

		.keepsake {
			width: min(82%, 18rem);
			margin: 3.5rem auto 0;
		}
	}

	.featured,
	.shelves {
		margin-bottom: clamp(2rem, 5vw, 4rem);
		padding: clamp(3rem, 7vw, 6rem) 0;
		border-top: 3px double var(--line-strong);
		border-bottom: 1px solid var(--line-strong);
	}

	.section-heading {
		display: flex;
		align-items: end;
		justify-content: space-between;
		gap: 2rem;
		margin-bottom: 3rem;
	}

	.section-heading h2,
	.shelf-title h2,
	.note-invite h2 {
		margin: 0.55rem 0 0;
		font-family: var(--font-display);
		font-size: clamp(2.7rem, 6vw, 5rem);
		font-weight: 400;
		line-height: 0.95;
		letter-spacing: -0.045em;
	}

	.section-heading > p {
		max-width: 22rem;
		margin: 0;
		color: var(--ink-soft);
		font-size: 0.82rem;
		line-height: 1.7;
	}

	.featured-grid {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: clamp(1.5rem, 4vw, 3rem);
	}

	.shelves {
		display: grid;
		grid-template-columns: minmax(14rem, 0.7fr) 1.3fr;
		gap: clamp(3rem, 8vw, 8rem);
	}

	.shelf-title h2 {
		max-width: 17rem;
	}

	.category-list {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 0.75rem;
	}

	.category-list a {
		position: relative;
		display: grid;
		grid-template-columns: 2rem 1fr auto;
		align-items: center;
		gap: 1rem;
		padding: 1.15rem;
		border: 1px solid var(--line);
		border-radius: .12rem;
		background: var(--paper-raised);
		box-shadow: 3px 3px 0 color-mix(in srgb, var(--ink) 12%, transparent);
		transition: color 180ms ease, transform 220ms ease, box-shadow 220ms ease, border-color 220ms ease;
	}

	.category-list a:hover {
		color: var(--accent-deep);
		border-color: color-mix(in srgb, var(--accent) 50%, var(--line));
		box-shadow: 5px 6px 0 color-mix(in srgb, var(--ink) 15%, transparent);
		transform: translate(-.15rem, -.2rem);
	}

	.category-list a:nth-child(3n + 2) { background: var(--accent-soft); }
	.category-list a:nth-child(3n) { background: color-mix(in srgb, var(--rose) 11%, var(--paper-raised)); }
	.category-list a::after { position: absolute; top: -.35rem; right: 1rem; width: 1.8rem; height: .7rem; content: ''; background: color-mix(in srgb, var(--rose) 30%, transparent); transform: rotate(3deg); }

	.category-list span {
		color: var(--ink-soft);
		font-size: 0.58rem;
	}

	.category-list strong {
		font-family: var(--font-display);
		font-size: 1.45rem;
		font-weight: 500;
	}

	.category-list i,
	.note-invite i {
		font-style: normal;
	}

	.note-invite {
		position: relative;
		display: grid;
		grid-template-columns: 1fr auto;
		align-items: end;
		gap: 2rem;
		overflow: hidden;
		margin-bottom: clamp(5rem, 9vw, 8rem);
		padding: clamp(3rem, 6vw, 5rem);
		border: 1px solid color-mix(in srgb, var(--accent) 35%, var(--line));
		border-radius: .15rem;
		background: var(--accent-soft);
		box-shadow: 8px 9px 0 color-mix(in srgb, var(--ink) 11%, transparent);
		transform: rotate(-.15deg);
	}

	.note-invite::before { position: absolute; top: -.6rem; left: 50%; width: 6rem; height: 1.5rem; content: ''; background: color-mix(in srgb, var(--paper-raised) 72%, transparent); transform: translateX(-50%) rotate(1deg); }

	.note-invite > span {
		position: absolute;
		top: -3.5rem;
		right: 8%;
		color: color-mix(in srgb, var(--accent) 16%, transparent);
		font-family: var(--font-display);
		font-size: 18rem;
		line-height: 1;
	}

	.note-invite > div,
	.note-invite a {
		position: relative;
		z-index: 1;
	}

	.note-invite a {
		padding-bottom: 0.5rem;
		border-bottom: 1px solid var(--accent);
		font-family: var(--font-display);
		font-size: 1.05rem;
		font-style: italic;
	}

	@media (max-width: 760px) {
		.section-heading,
		.note-invite {
			align-items: start;
			flex-direction: column;
		}

		.featured-grid,
		.shelves,
		.note-invite {
			grid-template-columns: 1fr;
		}

		.featured-grid {
			gap: 3.5rem;
		}

		.note-invite a {
			justify-self: start;
		}

		.category-list { grid-template-columns: 1fr; }
	}
</style>
