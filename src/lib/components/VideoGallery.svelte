<script lang="ts">
	let { videos, title }: { videos: string[]; title: string } = $props();
</script>

<section aria-labelledby="video-heading">
	<div class="heading"><p class="eyebrow">In motion</p><h2 id="video-heading">Moving memories</h2></div>
	<div class="videos">
		{#each videos as video, index}
			<figure>
				<video src={video} controls preload="metadata" aria-label={`${title} — video ${index + 1}`}>
					<track kind="captions" />
				</video>
				<figcaption>Clip {String(index + 1).padStart(2, '0')}</figcaption>
			</figure>
		{/each}
	</div>
</section>

<style>
	section { width: var(--content); margin: 0 auto clamp(5rem, 10vw, 9rem); padding-top: clamp(3rem, 7vw, 6rem); border-top: 1px solid var(--line); }
	.heading { margin-bottom: 2rem; }
	h2 { margin: .6rem 0 0; font-family: var(--font-display); font-size: clamp(2.2rem, 5vw, 3.8rem); font-weight: 400; line-height: 1; }
	.videos { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1rem; }
	figure { margin: 0; padding: .65rem; border: 1px solid var(--line); border-radius: 1rem 1rem 1rem .2rem; background: var(--paper-raised); box-shadow: 0 15px 40px rgba(48,48,39,.06); }
	video { display: block; width: 100%; max-height: 32rem; border-radius: .65rem; background: #10110f; }
	figcaption { padding: .75rem .25rem .2rem; color: var(--ink-soft); font-size: .6rem; letter-spacing: .12em; text-transform: uppercase; }
	@media (max-width: 680px) { .videos { grid-template-columns: 1fr; } }
</style>
