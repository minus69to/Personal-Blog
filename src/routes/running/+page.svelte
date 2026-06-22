<script lang="ts">import CategoryPage from '$lib/components/CategoryPage.svelte'; let { data } = $props();</script>
<CategoryPage category="running" posts={data.posts} />
