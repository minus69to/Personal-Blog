<script lang="ts">
	import { categoryNames, type Category } from '$lib/data/posts';
	let { category }: { category: Category } = $props();
</script>

<span>{categoryNames[category]}</span>

<style>
	span {
		display: inline-flex;
		align-items: center;
		color: var(--accent-deep);
		font-size: 0.6rem;
		font-weight: 600;
		letter-spacing: 0.15em;
		text-transform: uppercase;
	}

	span::before {
		width: 1.4rem;
		height: 1px;
		margin-right: 0.55rem;
		content: '';
		background: var(--accent);
	}
</style>
