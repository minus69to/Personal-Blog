<script lang="ts">
	import '../app.css';
	import { page } from '$app/state';
	import Footer from '$lib/components/Footer.svelte';
	import Navbar from '$lib/components/Navbar.svelte';

	let { children } = $props();
	const siteOrigin = 'https://insomniyuck.me';
	let canonicalUrl = $derived(`${siteOrigin}${page.url.pathname === '/' ? '' : page.url.pathname}`);
</script>

<svelte:head>
	<link rel="canonical" href={canonicalUrl} />
	<meta property="og:site_name" content="Insomniyuck" />
	<meta property="og:url" content={canonicalUrl} />
	<meta name="twitter:card" content="summary" />
</svelte:head>

<div class="site-frame">
	<Navbar />
	<div class="content">{@render children()}</div>
	<Footer />
</div>

<style>
	.site-frame {
		position: relative;
		z-index: 1;
		display: flex;
		min-height: 100vh;
		flex-direction: column;
	}

	.content {
		flex: 1;
	}
</style>
