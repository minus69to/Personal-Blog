<script lang="ts">
	import { page } from '$app/state';
	import { onMount } from 'svelte';

	const links = [
		{ href: '/', label: 'Home' },
		{ href: '/food', label: 'Food' },
		{ href: '/travel', label: 'Travel' },
		{ href: '/running', label: 'Running' },
		{ href: '/books', label: 'Books' },
		{ href: '/movies', label: 'Movies' },
		{ href: '/thoughts', label: 'Thoughts' },
		{ href: '/quotes', label: 'Quotes' },
		{ href: '/archive', label: 'Archive' }
	];

	let menuOpen = $state(false);
	let dark = $state(false);

	onMount(() => {
		dark = document.documentElement.dataset.theme === 'dark';
	});

	function toggleTheme() {
		dark = !dark;
		document.documentElement.dataset.theme = dark ? 'dark' : 'light';
		localStorage.setItem('theme', dark ? 'dark' : 'light');
	}
</script>

<header class="site-header">
	<div class="edition-bar">
		<span>Vol. I · Est. 2026</span>
		<span>A personal chronicle of the beautifully ordinary</span>
		<span>Stories · Places · Passing thoughts</span>
	</div>

	<div class="masthead">
		<button
			class="menu-button"
			class:active={menuOpen}
			onclick={() => (menuOpen = !menuOpen)}
			aria-label="Toggle navigation"
			aria-expanded={menuOpen}
		><span></span><span></span></button>

		<a class="brand" href="/" aria-label="Insomniyuck home">
			<strong>Insomniyuck</strong>
			<small>The personal review</small>
		</a>

		<button class="theme-button" onclick={toggleTheme} aria-label={dark ? 'Use light theme' : 'Use dark theme'}>
			{#if dark}
				<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.66 6.34l1.41-1.41"/></svg>
			{:else}
				<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.4 15.2A8.5 8.5 0 0 1 8.8 3.6 8.5 8.5 0 1 0 20.4 15.2Z"/></svg>
			{/if}
		</button>
	</div>

	<nav class="mobile-nav" class:open={menuOpen} aria-label="Mobile navigation">
		{#each links as link, index}
			<a href={link.href} class:active={page.url.pathname === link.href} onclick={() => (menuOpen = false)}>
				<span>{String(index + 1).padStart(2, '0')}</span>{link.label}
			</a>
		{/each}
	</nav>
</header>

<nav class="desktop-nav" aria-label="Main navigation">
	{#each links as link}
		<a href={link.href} class:active={page.url.pathname === link.href}>{link.label}</a>
	{/each}
</nav>

<style>
	.site-header {
		position: relative;
		z-index: 20;
		width: var(--content);
		margin-inline: auto;
	}

	.edition-bar {
		display: grid;
		grid-template-columns: 1fr auto 1fr;
		gap: 1rem;
		padding: .65rem 0;
		color: var(--ink-soft);
		border-bottom: 1px solid var(--line-strong);
		font-size: .54rem;
		font-weight: 600;
		letter-spacing: .13em;
		text-transform: uppercase;
	}

	.edition-bar span:last-child { text-align: right; }

	.masthead {
		position: relative;
		display: grid;
		grid-template-columns: 2.75rem 1fr 2.75rem;
		align-items: center;
		padding: 1.35rem 0 1.15rem;
		border-bottom: 3px double var(--line-strong);
	}

	.brand {
		grid-column: 2;
		justify-self: center;
		text-align: center;
	}

	.brand strong,
	.brand small { display: block; }

	.brand strong {
		font-family: var(--font-display);
		font-size: clamp(3.4rem, 7vw, 5.8rem);
		font-weight: 500;
		line-height: .72;
		letter-spacing: -.065em;
	}

	.brand small {
		margin-top: .8rem;
		color: var(--rose);
		font-size: .56rem;
		font-weight: 600;
		letter-spacing: .32em;
		text-transform: uppercase;
	}

	.theme-button,
	.menu-button {
		display: grid;
		width: 2.5rem;
		height: 2.5rem;
		padding: 0;
		place-items: center;
		color: var(--ink);
		border: 1px solid var(--line);
		border-radius: 50%;
		background: color-mix(in srgb, var(--paper-raised) 48%, transparent);
		cursor: pointer;
	}

	.theme-button { grid-column: 3; justify-self: end; }
	.theme-button:hover { border-color: var(--accent); background: var(--accent-soft); }
	.theme-button svg { width: 1rem; fill: none; stroke: currentColor; stroke-linecap: round; stroke-linejoin: round; stroke-width: 1.6; }

	.menu-button { display: none; }
	.menu-button span { position: absolute; width: 1rem; height: 1px; background: currentColor; transition: transform 180ms ease; transform: translateY(-3px); }
	.menu-button span:last-child { transform: translateY(3px); }
	.menu-button.active span { transform: rotate(45deg); }
	.menu-button.active span:last-child { transform: rotate(-45deg); }

	.desktop-nav {
		position: sticky;
		top: 0;
		z-index: 100;
		display: flex;
		width: var(--content);
		margin-inline: auto;
		align-items: center;
		justify-content: center;
		gap: clamp(.7rem, 2.1vw, 2rem);
		padding: .85rem 0;
		border-top: 1px solid var(--line-strong);
		border-bottom: 1px solid var(--line-strong);
		background: color-mix(in srgb, var(--paper) 94%, transparent);
		box-shadow: 0 .65rem 1.4rem color-mix(in srgb, var(--paper) 68%, transparent);
		backdrop-filter: blur(14px) saturate(.85);
		-webkit-backdrop-filter: blur(14px) saturate(.85);
	}

	.mobile-nav { display: none; }

	.desktop-nav a,
	.mobile-nav a {
		position: relative;
		color: var(--ink-soft);
		font-size: .64rem;
		font-weight: 600;
		letter-spacing: .12em;
		text-transform: uppercase;
	}

	.mobile-nav a > span { display: none; }
	.desktop-nav a::after,
	.mobile-nav a::after { position: absolute; right: 0; bottom: -.9rem; left: 0; height: 3px; content: ''; background: var(--rose); transform: scaleX(0); transition: transform 180ms ease; }
	.desktop-nav a:hover,
	.desktop-nav a.active,
	.mobile-nav a:hover,
	.mobile-nav a.active { color: var(--ink); }
	.desktop-nav a:hover::after,
	.desktop-nav a.active::after,
	.mobile-nav a:hover::after,
	.mobile-nav a.active::after { transform: scaleX(1); }

	@media (max-width: 880px) {
		.desktop-nav { display: none; }
		.edition-bar { grid-template-columns: 1fr 1fr; }
		.edition-bar span:nth-child(2) { display: none; }
		.masthead { padding: 1rem 0; }
		.brand strong { font-size: clamp(2.5rem, 12vw, 3.7rem); }
		.brand small { margin-top: .55rem; letter-spacing: .22em; }
		.menu-button { position: relative; display: grid; grid-column: 1; grid-row: 1; }

		.mobile-nav {
			position: absolute;
			top: 100%;
			right: 0;
			left: 0;
			display: grid;
			grid-template-columns: repeat(2, 1fr);
			gap: 0;
			max-height: calc(100vh - 6rem);
			overflow-y: auto;
			padding: .75rem;
			border: 1px solid var(--line-strong);
			background: var(--paper-raised);
			box-shadow: var(--shadow);
			opacity: 0;
			visibility: hidden;
			transform: translateY(-.5rem);
			transition: opacity 180ms ease, transform 180ms ease, visibility 180ms;
		}

		.mobile-nav.open { opacity: 1; visibility: visible; transform: translateY(0); }
		.mobile-nav a { display: flex; gap: .75rem; padding: 1rem .75rem; border-bottom: 1px solid var(--line); }
		.mobile-nav a:nth-child(odd) { border-right: 1px solid var(--line); }
		.mobile-nav a > span { display: inline; color: var(--rose); font-family: var(--font-display); font-size: .75rem; }
		.mobile-nav a::after { display: none; }
	}

	@media (max-width: 480px) {
		.edition-bar { display: flex; justify-content: center; }
		.edition-bar span:last-child { display: none; }
		.brand small { display: none; }
		.mobile-nav { grid-template-columns: 1fr; }
		.mobile-nav a:nth-child(odd) { border-right: 0; }
	}
</style>
