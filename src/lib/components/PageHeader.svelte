<script lang="ts">
	let { kicker, title, description, mark }: { kicker: string; title: string; description: string; mark?: string } = $props();
</script>

<header>
	<div>
		<p class="eyebrow">{kicker}</p>
		<h1>{title}</h1>
	</div>
	<p class="description">{description}</p>
	{#if mark}<span class="mark" aria-hidden="true">{mark}</span>{/if}
</header>

<style>
	header {
		position: relative;
		display: grid;
		grid-template-columns: 1fr minmax(16rem, 0.65fr);
		align-items: end;
		gap: 3rem;
		padding: clamp(4rem, 9vw, 7rem) 0 clamp(3rem, 7vw, 5rem);
		border-bottom: 1px solid var(--line);
	}

	h1 {
		margin: 0.7rem 0 0;
		font-family: var(--font-display);
		font-size: clamp(3.8rem, 9vw, 7rem);
		font-weight: 400;
		line-height: 0.82;
		letter-spacing: -0.055em;
	}

	.description {
		position: relative;
		z-index: 1;
		margin: 0;
		color: var(--ink-soft);
		font-size: 0.92rem;
		line-height: 1.8;
	}

	.mark {
		position: absolute;
		right: 0;
		bottom: -0.15em;
		color: color-mix(in srgb, var(--accent) 12%, transparent);
		font-family: var(--font-display);
		font-size: clamp(7rem, 18vw, 14rem);
		line-height: 1;
	}

	@media (max-width: 680px) {
		header {
			grid-template-columns: 1fr;
			gap: 1.5rem;
		}
	}
</style>
