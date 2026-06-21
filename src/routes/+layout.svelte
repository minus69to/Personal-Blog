<script lang="ts">
	import '../app.css';
	import Footer from '$lib/components/Footer.svelte';
	import Navbar from '$lib/components/Navbar.svelte';

	let { children } = $props();
</script>

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
