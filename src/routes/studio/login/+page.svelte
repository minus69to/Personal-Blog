<script lang="ts">
	import { enhance } from '$app/forms';
	let { data, form } = $props();
	let submitting = $state(false);
</script>

<svelte:head>
	<title>Private Studio — Insomniyuck</title>
	<meta name="robots" content="noindex,nofollow" />
</svelte:head>

<main class="login-shell">
	<section class="login-card">
		<span class="clip" aria-hidden="true"></span>
		<p class="eyebrow">Private correspondence</p>
		<h1>The back room</h1>
		<p class="intro">A quiet entrance to the editorial desk. Use the private studio password to continue.</p>

		{#if !data.configured || form?.unavailable}
			<p class="notice error">Studio authentication has not been configured.</p>
		{:else}
			<form method="POST" use:enhance={() => {
				submitting = true;
				return async ({ update }) => {
					await update();
					submitting = false;
				};
			}}>
				<label for="password">Studio password</label>
				<input id="password" name="password" type="password" autocomplete="current-password" required />
				{#if form?.incorrect}<p class="notice error">That password does not match.</p>{/if}
				<button type="submit" disabled={submitting}>{submitting ? 'Opening…' : 'Enter the studio'}</button>
			</form>
		{/if}
		<a class="home-link" href="/">← Return to the front page</a>
	</section>
</main>

<style>
	.login-shell { display: grid; min-height: 72vh; padding: clamp(4rem, 10vw, 8rem) 1rem; place-items: center; }
	.login-card { position: relative; width: min(31rem, 100%); padding: clamp(2.2rem, 7vw, 4rem); border: 1px solid var(--line-strong); background: var(--paper-raised); box-shadow: 12px 14px 0 color-mix(in srgb, var(--accent) 18%, transparent), var(--shadow); transform: rotate(-.35deg); }
	.login-card::after { position: absolute; inset: .55rem; pointer-events: none; content: ''; border: 1px solid var(--line); }
	.clip { position: absolute; z-index: 2; top: -1.15rem; right: 2.5rem; width: 1.25rem; height: 3.8rem; border: 2px solid var(--ink-soft); border-radius: .8rem; transform: rotate(8deg); }
	h1 { margin: .55rem 0 1rem; font-family: var(--font-display); font-size: clamp(3.2rem, 10vw, 5rem); font-weight: 400; line-height: .82; letter-spacing: -.05em; }
	.intro { margin: 0 0 2rem; color: var(--ink-soft); font-family: var(--font-display); font-size: 1.2rem; line-height: 1.5; }
	form { position: relative; z-index: 1; display: grid; gap: .75rem; }
	label { font-size: .62rem; font-weight: 600; letter-spacing: .16em; text-transform: uppercase; }
	input { width: 100%; padding: .9rem 1rem; color: var(--ink); border: 1px solid var(--line-strong); border-radius: 0; background: color-mix(in srgb, var(--paper) 72%, transparent); }
	button { margin-top: .5rem; padding: .95rem 1.2rem; color: var(--paper-raised); border: 1px solid var(--accent-deep); background: var(--accent-deep); cursor: pointer; font-size: .68rem; font-weight: 600; letter-spacing: .14em; text-transform: uppercase; }
	button:hover { background: var(--rose); border-color: var(--rose); }
	button:disabled { cursor: wait; opacity: .65; }
	.notice { position: relative; z-index: 1; margin: .2rem 0; font-size: .78rem; }
	.error { color: var(--rose); }
	.home-link { position: relative; z-index: 1; display: inline-block; margin-top: 2rem; color: var(--ink-soft); font-size: .7rem; }
</style>
