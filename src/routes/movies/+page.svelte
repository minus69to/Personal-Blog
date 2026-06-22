<script lang="ts">import CategoryPage from '$lib/components/CategoryPage.svelte'; let { data } = $props();</script>
<CategoryPage category="movies" posts={data.posts} />
