<script lang="ts">
	import { parseInlineMarkdown } from '$lib/data/markdown';
	let { text }: { text: string } = $props();
	let segments = $derived(parseInlineMarkdown(text));
</script>

{#each segments as segment}
	{#if segment.kind === 'strong'}<strong>{segment.text}</strong>
	{:else if segment.kind === 'emphasis'}<em>{segment.text}</em>
	{:else}{segment.text}{/if}
{/each}
