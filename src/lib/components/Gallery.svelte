<script lang="ts">
	let { images, title }: { images: string[]; title: string } = $props();
	let activeIndex = $state<number | null>(null);

	function close() {
		activeIndex = null;
	}

	function move(direction: number) {
		if (activeIndex === null) return;
		activeIndex = (activeIndex + direction + images.length) % images.length;
	}

	function handleKey(event: KeyboardEvent) {
		if (activeIndex === null) return;
		if (event.key === 'Escape') close();
		if (event.key === 'ArrowLeft') move(-1);
		if (event.key === 'ArrowRight') move(1);
	}

	$effect(() => {
		if (activeIndex === null) return;
		document.body.style.overflow = 'hidden';
		return () => {
			document.body.style.overflow = '';
		};
	});
</script>

<svelte:window onkeydown={handleKey} />

<section class="gallery-section" aria-labelledby="gallery-heading">
	<div class="gallery-heading">
		<div>
			<p class="eyebrow">In photographs</p>
			<h2 id="gallery-heading">A few frames from the memory</h2>
		</div>
		<span>{images.length} {images.length === 1 ? 'image' : 'images'}</span>
	</div>

	<div class="gallery" class:single={images.length === 1} class:pair={images.length === 2}>
		{#each images as image, index}
			<button onclick={() => (activeIndex = index)} aria-label={`Open image ${index + 1} of ${images.length}`}>
				<img src={image} alt={`${title} — photograph ${index + 1}`} loading="lazy" />
				<span aria-hidden="true">View ↗</span>
			</button>
		{/each}
	</div>
</section>

{#if activeIndex !== null}
	<div class="lightbox" role="dialog" aria-modal="true" aria-label={`${title} image viewer`}>
		<button class="backdrop" onclick={close} aria-label="Close image viewer"></button>
		<div class="viewer">
			<div class="viewer-top"><span>{activeIndex + 1} / {images.length}</span><button onclick={close} aria-label="Close image viewer">Close ×</button></div>
			<img src={images[activeIndex]} alt={`${title} — photograph ${activeIndex + 1}`} />
			{#if images.length > 1}
				<button class="previous" onclick={() => move(-1)} aria-label="Previous image">←</button>
				<button class="next" onclick={() => move(1)} aria-label="Next image">→</button>
			{/if}
		</div>
	</div>
{/if}

<style>
	.gallery-section { width: var(--content); margin: 0 auto clamp(5rem, 10vw, 9rem); padding-top: clamp(3rem, 7vw, 6rem); border-top: 1px solid var(--line); }
	.gallery-heading { display: flex; align-items: end; justify-content: space-between; gap: 2rem; margin-bottom: 2rem; }
	.gallery-heading h2 { margin: .6rem 0 0; font-family: var(--font-display); font-size: clamp(2.2rem, 5vw, 3.8rem); font-weight: 400; line-height: 1; }
	.gallery-heading > span { color: var(--ink-soft); font-size: .62rem; letter-spacing: .1em; text-transform: uppercase; }
	.gallery { display: grid; grid-template-columns: 1.25fr .75fr; grid-template-rows: repeat(2, minmax(12rem, 18rem)); gap: .85rem; }
	.gallery.single, .gallery.pair { grid-template-columns: repeat(auto-fit, minmax(16rem, 1fr)); grid-template-rows: minmax(22rem, 34rem); }
	.gallery button { position: relative; overflow: visible; padding: .55rem .55rem 1.7rem; border: 1px solid var(--line); border-radius: .18rem; background: var(--paper-raised); box-shadow: 0 12px 28px rgba(48,48,39,.1); cursor: zoom-in; transition: transform 220ms ease, box-shadow 220ms ease; }
	.gallery button:nth-child(odd) { transform: rotate(-.35deg); }
	.gallery button:nth-child(even) { transform: rotate(.45deg); }
	.gallery button::before { position: absolute; top: -.6rem; left: 50%; z-index: 2; width: 4.5rem; height: 1.45rem; content: ''; background: color-mix(in srgb, var(--accent-soft) 72%, transparent); box-shadow: 0 1px 3px rgba(48,48,39,.08); transform: translateX(-50%) rotate(-2deg); }
	.gallery button:hover { z-index: 2; box-shadow: 0 22px 48px rgba(48,48,39,.17); transform: translateY(-.35rem) rotate(0); }
	.gallery button:first-child { grid-row: 1 / 3; }
	.gallery.single button:first-child, .gallery.pair button:first-child { grid-row: auto; }
	.gallery img { display: block; width: 100%; height: 100%; object-fit: cover; transition: transform 600ms cubic-bezier(.2,.7,.2,1), filter 250ms ease; }
	.gallery button:hover img { filter: saturate(1.06); transform: scale(1.035); }
	.gallery button > span { position: absolute; right: .7rem; bottom: .5rem; color: var(--ink-soft); font-family: var(--font-display); font-size: .72rem; font-style: italic; letter-spacing: .04em; opacity: .75; transition: opacity 180ms ease, transform 180ms ease; }
	.gallery button:hover > span { opacity: 1; transform: translateY(0); }
	.lightbox { position: fixed; inset: 0; z-index: 100; display: grid; place-items: center; padding: clamp(.75rem, 3vw, 2rem); }
	.backdrop { position: absolute; inset: 0; border: 0; background: rgba(12,13,11,.9); cursor: zoom-out; backdrop-filter: blur(12px); }
	.viewer { position: relative; z-index: 1; display: grid; width: min(72rem, 100%); height: min(82vh, 48rem); place-items: center; }
	.viewer img { max-width: 100%; max-height: calc(100% - 3rem); object-fit: contain; box-shadow: 0 30px 90px rgba(0,0,0,.35); }
	.viewer-top { position: absolute; top: 0; right: 0; left: 0; display: flex; justify-content: space-between; color: rgba(255,255,255,.72); font-size: .68rem; letter-spacing: .08em; }
	.viewer-top button, .previous, .next { color: #fff; border: 0; background: transparent; cursor: pointer; }
	.previous, .next { position: absolute; top: 50%; display: grid; width: 2.8rem; height: 2.8rem; place-items: center; border: 1px solid rgba(255,255,255,.3); border-radius: 50%; background: rgba(20,20,17,.4); transform: translateY(-50%); }
	.previous { left: 0; }
	.next { right: 0; }

	@media (max-width: 680px) {
		.gallery-heading { align-items: start; flex-direction: column; gap: .75rem; }
		.gallery { grid-template-columns: repeat(2, minmax(0, 1fr)); grid-template-rows: 18rem 12rem; gap: .55rem; }
		.gallery button:first-child { grid-column: 1 / -1; grid-row: auto; }
		.gallery.single, .gallery.pair { grid-template-columns: 1fr; grid-template-rows: none; }
		.gallery.single button, .gallery.pair button { min-height: 18rem; }
		.gallery.single button:first-child, .gallery.pair button:first-child { grid-column: auto; }
		.gallery button:nth-child(n) { transform: none; }
		.gallery button:hover { transform: translateY(-.2rem); }
		.viewer { height: 84vh; }
		.previous, .next { top: auto; bottom: 0; }
	}
</style>
