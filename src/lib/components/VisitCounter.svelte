<script lang="ts">
	import { onMount } from 'svelte';

	type VisitResponse = {
		configured: boolean;
		total: number | null;
		page: number | null;
	};

	let total = $state<number | null>(null);
	let configured = $state<boolean | null>(null);
	let unavailable = $state(false);
	const formattedTotal = $derived(total === null ? '—' : new Intl.NumberFormat('en').format(total));

	onMount(async () => {
		const path = window.location.pathname;
		const sessionKey = `insomniyuck:visited:${path}`;
		let alreadyCounted = false;

		try {
			alreadyCounted = sessionStorage.getItem(sessionKey) === '1';
		} catch {
			// Browsers with restricted storage still get a counter without blocking the page.
		}

		try {
			const response = alreadyCounted
				? await fetch(`/api/visit?path=${encodeURIComponent(path)}`, { cache: 'no-store' })
				: await fetch('/api/visit', {
						method: 'POST',
						headers: { 'content-type': 'application/json' },
						body: JSON.stringify({ path })
					});

			if (!response.ok) throw new Error('Visit endpoint unavailable');
			const result = (await response.json()) as VisitResponse;
			configured = result.configured;
			total = result.total;

			if (result.configured && !alreadyCounted) {
				try { sessionStorage.setItem(sessionKey, '1'); } catch { /* Storage is optional. */ }
			}
		} catch {
			unavailable = true;
		}
	});
</script>

<aside aria-label="Website visit count">
	<span class="stamp">Readership</span>
	<div>
		<strong>{configured === null && !unavailable ? '…' : formattedTotal}</strong>
		<small>{#if unavailable}counter unavailable{:else if configured === false}connect Redis to begin{:else}recorded visits{/if}</small>
	</div>
	<i aria-hidden="true">No.<br />001</i>
</aside>

<style>
	aside {
		position: relative;
		display: inline-grid;
		grid-template-columns: auto 1fr auto;
		align-items: center;
		gap: 1rem;
		margin-top: 2.5rem;
		padding: .65rem .8rem;
		color: var(--ink);
		border: 1px solid var(--line-strong);
		background: color-mix(in srgb, var(--paper-raised) 78%, transparent);
		box-shadow: 3px 4px 0 color-mix(in srgb, var(--ink) 10%, transparent);
		transform: rotate(-.6deg);
	}

	.stamp {
		padding: .45rem .5rem;
		color: var(--rose);
		border: 1px dashed var(--rose);
		font-size: .48rem;
		font-weight: 600;
		letter-spacing: .13em;
		text-transform: uppercase;
		transform: rotate(-3deg);
	}

	aside > div { min-width: 6.5rem; }
	strong, small { display: block; }
	strong { font-family: var(--font-display); font-size: 1.65rem; font-weight: 500; line-height: .8; }
	small { margin-top: .45rem; color: var(--ink-soft); font-size: .5rem; letter-spacing: .09em; text-transform: uppercase; }
	i { padding-left: .7rem; color: var(--ink-soft); border-left: 1px solid var(--line); font-family: var(--font-display); font-size: .58rem; font-style: normal; line-height: 1.2; text-transform: uppercase; }

	@media (max-width: 640px) {
		aside { margin-top: 2rem; transform: none; }
	}
</style>
