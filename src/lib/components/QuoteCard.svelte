<script lang="ts">
	import { formatDate, type Post } from '$lib/data/posts';
	let { post }: { post: Post } = $props();
</script>

<article>
	<a href={`/post/${post.slug}`} aria-label={`Read ${post.title}`}>
		<span class="quote-mark" aria-hidden="true">“</span>
		<blockquote>{post.quote ?? post.excerpt}</blockquote>
		<div class="source">
			<div><strong>{post.source ?? post.title}</strong><small>{formatDate(post.date)}</small></div>
			<span>↗</span>
		</div>
	</a>
</article>

<style>
	article {
		position: relative;
		overflow: hidden;
		border: 1px solid var(--line);
		border-radius: 1.25rem 1.25rem 1.25rem 0.25rem;
		background: linear-gradient(145deg, var(--paper-raised), color-mix(in srgb, var(--accent-soft) 55%, var(--paper-raised)));
		box-shadow: 0 12px 35px rgba(48, 48, 39, 0.06);
		transition: transform 260ms ease, box-shadow 260ms ease, border-color 260ms ease;
	}

	article:hover {
		border-color: color-mix(in srgb, var(--accent) 50%, var(--line));
		box-shadow: 0 24px 60px rgba(48, 48, 39, 0.13);
		transform: translateY(-0.45rem) rotate(-0.35deg);
	}

	a { display: flex; min-height: 23rem; flex-direction: column; justify-content: space-between; padding: clamp(2rem, 5vw, 4rem); }
	.quote-mark { position: absolute; top: -3.5rem; right: 1rem; color: color-mix(in srgb, var(--accent) 13%, transparent); font-family: var(--font-display); font-size: 15rem; line-height: 1; transition: transform 350ms ease; }
	article:hover .quote-mark { transform: translateY(.5rem) rotate(5deg); }
	blockquote { position: relative; z-index: 1; max-width: 40rem; margin: auto 0; color: var(--ink); font-family: var(--font-display); font-size: clamp(2rem, 5vw, 3.6rem); font-style: italic; line-height: 1.08; }
	.source { position: relative; z-index: 1; display: flex; align-items: end; justify-content: space-between; gap: 2rem; margin-top: 3rem; padding-top: 1.2rem; border-top: 1px solid var(--line); }
	.source strong, .source small { display: block; }
	.source strong { font-family: var(--font-display); font-size: 1.05rem; font-weight: 500; }
	.source small { margin-top: .2rem; color: var(--ink-soft); font-size: .58rem; letter-spacing: .07em; }
	.source > span { color: var(--accent-deep); transition: transform 180ms ease; }
	article:hover .source > span { transform: translate(.2rem, -.2rem); }
</style>
