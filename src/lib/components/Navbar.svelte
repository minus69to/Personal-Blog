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
	<div class="nav-wrap">
		<a class="brand" href="/" aria-label="Insomniyuck home">
			<strong>Insomniyuck</strong><span aria-hidden="true">.</span>
		</a>

		<nav class:open={menuOpen} aria-label="Main navigation">
			{#each links as link}
				<a
					href={link.href}
					class:active={page.url.pathname === link.href}
					onclick={() => (menuOpen = false)}>{link.label}</a
				>
			{/each}
		</nav>

		<div class="actions">
			<button class="theme-button" onclick={toggleTheme} aria-label={dark ? 'Use light theme' : 'Use dark theme'}>
				{#if dark}
					<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.66 6.34l1.41-1.41"/></svg>
				{:else}
					<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.4 15.2A8.5 8.5 0 0 1 8.8 3.6 8.5 8.5 0 1 0 20.4 15.2Z"/></svg>
				{/if}
			</button>
			<button
				class="menu-button"
				class:active={menuOpen}
				onclick={() => (menuOpen = !menuOpen)}
				aria-label="Toggle navigation"
				aria-expanded={menuOpen}
			>
				<span></span><span></span>
			</button>
		</div>
	</div>
</header>

<style>
	.site-header {
		position: sticky;
		top: 0;
		z-index: 20;
		border-bottom: 1px solid var(--line);
		background: color-mix(in srgb, var(--paper) 90%, transparent);
		backdrop-filter: blur(18px);
	}

	.nav-wrap {
		display: flex;
		align-items: center;
		justify-content: space-between;
		width: var(--content);
		height: 5.5rem;
		margin-inline: auto;
	}

	.brand {
		display: flex;
		align-items: baseline;
		font-family: var(--font-display);
	}

	.brand strong {
		font-size: 1.65rem;
		font-weight: 500;
		letter-spacing: -0.04em;
	}

	.brand > span {
		color: var(--rose);
		font-size: 1.7rem;
	}

	nav {
		display: flex;
		align-items: center;
		gap: clamp(0.9rem, 2vw, 1.9rem);
		margin-left: auto;
	}

	nav a {
		position: relative;
		padding-block: 0.6rem;
		color: var(--ink-soft);
		font-size: 0.7rem;
		font-weight: 500;
		letter-spacing: 0.1em;
		text-transform: uppercase;
	}

	nav a::after {
		position: absolute;
		right: 0;
		bottom: 0.18rem;
		left: 0;
		height: 1px;
		content: '';
		background: var(--accent);
		transform: scaleX(0);
		transition: transform 180ms ease;
	}

	nav a:hover,
	nav a.active {
		color: var(--ink);
	}

	nav a:hover::after,
	nav a.active::after {
		transform: scaleX(1);
	}

	.actions {
		display: flex;
		align-items: center;
		gap: 0.35rem;
		margin-left: 1.5rem;
	}

	.theme-button,
	.menu-button {
		display: grid;
		width: 2.4rem;
		height: 2.4rem;
		padding: 0;
		place-items: center;
		color: var(--ink);
		border: 0;
		border-radius: 50%;
		background: transparent;
		cursor: pointer;
	}

	.theme-button:hover {
		background: var(--accent-soft);
	}

	.theme-button svg {
		width: 1.05rem;
		fill: none;
		stroke: currentColor;
		stroke-linecap: round;
		stroke-linejoin: round;
		stroke-width: 1.6;
	}

	.menu-button {
		display: none;
	}

	.menu-button span {
		position: absolute;
		width: 1rem;
		height: 1px;
		background: currentColor;
		transition: transform 180ms ease;
		transform: translateY(-3px);
	}

	.menu-button span:last-child {
		transform: translateY(3px);
	}

	.menu-button.active span {
		transform: rotate(45deg);
	}

	.menu-button.active span:last-child {
		transform: rotate(-45deg);
	}

	@media (max-width: 880px) {
		.nav-wrap {
			height: 4.75rem;
		}

		.menu-button {
			position: relative;
			display: grid;
		}

		nav {
			position: absolute;
			top: calc(100% + 1px);
			right: 0;
			left: 0;
			display: grid;
			gap: 0;
			padding: 0.75rem 1rem 1.25rem;
			max-height: calc(100vh - 4.75rem);
			overflow-y: auto;
			border-bottom: 1px solid var(--line);
			background: var(--paper-raised);
			box-shadow: var(--shadow);
			opacity: 0;
			visibility: hidden;
			transform: translateY(-0.5rem);
			transition: opacity 180ms ease, transform 180ms ease, visibility 180ms;
		}

		nav.open {
			opacity: 1;
			visibility: visible;
			transform: translateY(0);
		}

		nav a {
			padding: 0.8rem 0.5rem;
			border-bottom: 1px solid var(--line);
		}

		nav a::after {
			display: none;
		}

		.actions {
			margin-left: auto;
		}
	}

</style>
