<script lang="ts">
	import { formatDate, type Post } from '$lib/data/posts';
	import CategoryBadge from './CategoryBadge.svelte';

	let { post, large = false }: { post: Post; large?: boolean } = $props();
</script>

<article class={post.category} class:large lang={post.language}>
	<span class="paperclip" aria-hidden="true"></span>
	<span class="postage" aria-hidden="true"><small>memory</small><strong>{post.date.slice(0, 4)}</strong></span>
	<span class="issue-tab" aria-hidden="true">No. {post.slug.length.toString().padStart(2, '0')}</span>
	<a class="cover {post.coverTone}" href={`/post/${post.slug}`} aria-label={`Read ${post.title}`}>
		{#if post.coverImage}<img src={post.coverImage} alt="" loading="lazy" />{/if}
		<span class="cover-word">{post.category}</span>
		<span class="cover-mark" aria-hidden="true">✦</span>
	</a>
	<div class="card-copy">
		<div class="meta">
			<CategoryBadge category={post.category} />
			<time datetime={post.date}>{formatDate(post.date)}</time>
		</div>
		<h3><a href={`/post/${post.slug}`}>{post.title}</a></h3>
		<p>{post.excerpt}</p>
		<div class="details">
			{#if post.location}<span>{post.location}</span>{/if}
			{#if post.rating}<span>{post.rating} / 5</span>{/if}
		</div>
	</div>
</article>

<style>
	article {
		--tilt: -0.35deg;
		position: relative;
		display: grid;
		gap: 1.2rem;
		padding: 0.85rem 0.85rem 1.35rem;
		border: 1px solid var(--line);
		border-radius: 0.35rem;
		background:
			linear-gradient(115deg, transparent 48%, color-mix(in srgb, var(--line) 32%, transparent) 49%, transparent 50%) 0 0 / 1.8rem 1.8rem,
			var(--paper-raised);
		box-shadow: 0 12px 28px rgba(48, 48, 39, 0.09), 0 2px 3px rgba(48, 48, 39, 0.06);
		transform: rotate(var(--tilt));
		transition: transform 260ms ease, border-color 260ms ease, box-shadow 260ms ease;
	}

	article:nth-child(3n + 2) { --tilt: 0.45deg; }
	article:nth-child(3n) { --tilt: -0.15deg; }

	article:hover {
		border-color: color-mix(in srgb, var(--accent) 48%, var(--line));
		box-shadow: 0 24px 55px rgba(48, 48, 39, 0.12);
		transform: translateY(-0.55rem) rotate(0deg);
	}

	.paperclip {
		position: absolute;
		top: -0.95rem;
		left: 1.45rem;
		z-index: 5;
		width: 1.15rem;
		height: 3.35rem;
		border: 2px solid color-mix(in srgb, var(--ink-soft) 72%, #b9b7ad);
		border-bottom-color: transparent;
		border-radius: 999px 999px 0 0;
		filter: drop-shadow(1px 2px 1px rgba(0,0,0,.16));
		transform: rotate(8deg);
	}

	.paperclip::after {
		position: absolute;
		top: .35rem;
		left: .25rem;
		width: .45rem;
		height: 2.35rem;
		content: '';
		border: 1.5px solid color-mix(in srgb, var(--ink-soft) 72%, #b9b7ad);
		border-bottom-color: transparent;
		border-radius: 999px 999px 0 0;
	}

	.postage {
		position: absolute;
		top: 1.3rem;
		right: 1.25rem;
		z-index: 4;
		display: grid;
		width: 3.65rem;
		height: 4.2rem;
		place-content: center;
		color: rgba(255,255,255,.86);
		border: 1px dashed rgba(255,255,255,.72);
		background: color-mix(in srgb, var(--rose) 78%, transparent);
		box-shadow: 0 0 0 3px color-mix(in srgb, var(--rose) 78%, transparent), 0 5px 12px rgba(0,0,0,.12);
		text-align: center;
		transform: rotate(5deg);
		transition: transform 260ms ease;
	}

	.postage small,
	.postage strong { display: block; }
	.postage small { font-size: .42rem; font-weight: 600; letter-spacing: .15em; text-transform: uppercase; }
	.postage strong { margin-top: .15rem; font-family: var(--font-display); font-size: 1rem; font-weight: 500; }
	article:hover .postage { transform: rotate(1deg) translateY(-.15rem); }

	.issue-tab {
		position: absolute;
		right: -.3rem;
		bottom: 1.15rem;
		z-index: 3;
		padding: .32rem .7rem;
		color: var(--paper-raised);
		background: var(--ink);
		font-size: .45rem;
		font-weight: 600;
		letter-spacing: .13em;
		text-transform: uppercase;
		transform: rotate(-90deg) translateX(100%);
		transform-origin: right bottom;
	}

	.cover {
		position: relative;
		display: flex;
		min-height: 17rem;
		align-items: flex-end;
		overflow: hidden;
		padding: 1rem;
		border: .35rem solid var(--photo-mat);
		border-radius: 0.1rem;
		background: #d7c7b8;
		isolation: isolate;
	}

	.cover::before,
	.cover::after {
		position: absolute;
		content: '';
		border: 1px solid color-mix(in srgb, white 35%, transparent);
		border-radius: 50%;
		transition: transform 500ms cubic-bezier(.2,.7,.2,1);
	}

	.cover::before {
		top: -20%;
		right: -20%;
		width: 80%;
		aspect-ratio: 1;
	}

	.cover::after {
		top: 18%;
		right: 10%;
		width: 42%;
		aspect-ratio: 1;
	}

	.cover.clay { background: linear-gradient(145deg, #c79377, #7e594d); }
	.cover.forest { background: linear-gradient(145deg, #a4ad8b, #4f5d4b); }
	.cover.dawn { background: linear-gradient(145deg, #d8b18a, #a87162); }
	.cover.ink { background: linear-gradient(145deg, #68717a, #343b43); }
	.cover.plum { background: linear-gradient(145deg, #9c7c85, #594951); }
	.cover.sand { background: linear-gradient(145deg, #d8c9a9, #a59173); }
	.cover.mist { background: linear-gradient(145deg, #b8c6c4, #758988); }
	article.food .postage { background: #9a695c; box-shadow: 0 0 0 3px #9a695c, 0 5px 12px rgba(0,0,0,.12); }
	article.travel .postage { background: #68755c; box-shadow: 0 0 0 3px #68755c, 0 5px 12px rgba(0,0,0,.12); }
	article.running .postage { background: #a57957; box-shadow: 0 0 0 3px #a57957, 0 5px 12px rgba(0,0,0,.12); }
	article.books .postage { background: #5e6972; box-shadow: 0 0 0 3px #5e6972, 0 5px 12px rgba(0,0,0,.12); }
	article.movies .postage { background: #7d626b; box-shadow: 0 0 0 3px #7d626b, 0 5px 12px rgba(0,0,0,.12); }
	article.thoughts .postage,
	article.life .postage { background: #7b8070; box-shadow: 0 0 0 3px #7b8070, 0 5px 12px rgba(0,0,0,.12); }

	.cover img {
		position: absolute;
		inset: 0;
		z-index: -1;
		width: 100%;
		height: 100%;
		object-fit: cover;
		transition: transform 650ms cubic-bezier(.2,.7,.2,1), filter 300ms ease;
	}

	article:hover .cover::before { transform: translate(-8%, 8%) scale(1.08); }
	article:hover .cover::after { transform: translate(-12%, 10%) scale(.94); }
	article:hover .cover img { filter: saturate(1.05); transform: scale(1.045); }

	.cover-word {
		position: relative;
		z-index: 1;
		color: rgba(255, 255, 255, 0.82);
		font-family: var(--font-display);
		font-size: 2.1rem;
		font-style: italic;
	}

	.cover-mark {
		position: absolute;
		right: 1rem;
		bottom: 1rem;
		color: rgba(255, 255, 255, 0.72);
		font-size: 0.7rem;
	}

	.card-copy {
		padding-inline: 0.45rem;
	}

	.meta,
	.details {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
	}

	time,
	.details {
		color: var(--ink-soft);
		font-size: 0.65rem;
		letter-spacing: 0.05em;
	}

	h3 {
		margin: 0.7rem 0 0.45rem;
		font-family: var(--font-display);
		font-size: clamp(1.65rem, 3vw, 2.1rem);
		font-weight: 500;
		line-height: 1;
		letter-spacing: -0.025em;
	}

	h3 a:hover {
		color: var(--accent-deep);
	}

	p {
		margin: 0;
		color: var(--ink-soft);
		font-size: 0.84rem;
		line-height: 1.7;
	}

	.details {
		justify-content: flex-start;
		margin-top: 0.8rem;
	}

	.details span + span::before {
		margin-right: 1rem;
		content: '·';
	}

	article.large {
		grid-template-columns: minmax(0, 1.2fr) minmax(16rem, 0.8fr);
		align-items: center;
		gap: clamp(2rem, 6vw, 5rem);
		padding: 1rem;
		transform: rotate(-.15deg);
	}

	article.large .cover {
		min-height: 31rem;
	}

	article.large h3 {
		font-size: clamp(2.4rem, 5vw, 4.4rem);
	}

	article.large p {
		font-size: 0.95rem;
	}

	article.large .card-copy { padding-right: clamp(1rem, 4vw, 3rem); }

	@media (max-width: 700px) {
		article,
		article.large { transform: none; }
		article:hover { transform: translateY(-.3rem); }
		.paperclip { left: 1.2rem; }
		.postage { top: 1.25rem; right: 1.15rem; transform: rotate(3deg) scale(.9); transform-origin: top right; }

		article.large {
			grid-template-columns: 1fr;
		}

		article.large .cover {
			min-height: 22rem;
		}

		article.large .card-copy { padding: 0 .45rem .5rem; }
	}
</style>
