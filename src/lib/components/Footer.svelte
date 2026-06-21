<footer>
	<div class="footer-inner">
		<div>
			<p class="eyebrow">A note to self</p>
			<p class="sign-off">Notice the ordinary.</p>
		</div>
		<div class="footer-meta">
			<a href="/about">About</a>
			<a href="https://chithi.me" target="_blank" rel="noreferrer">Leave an anonymous note ↗</a>
			<span>© {new Date().getFullYear()} Insomniyuck</span>
		</div>
	</div>
</footer>

<style>
	footer {
		margin-top: auto;
	}

	.footer-inner {
		display: flex;
		align-items: flex-end;
		justify-content: space-between;
		width: var(--content);
		margin-inline: auto;
		padding-block: 4rem 3rem;
		border-top: 1px solid var(--line);
	}

	.sign-off {
		margin: 0.55rem 0 0;
		font-family: var(--font-display);
		font-size: clamp(1.6rem, 3vw, 2.3rem);
		font-style: italic;
	}

	.footer-meta {
		display: flex;
		gap: 1.25rem;
		color: var(--ink-soft);
		font-size: 0.68rem;
		letter-spacing: 0.04em;
	}

	.footer-meta a:hover {
		color: var(--accent);
	}

	@media (max-width: 720px) {
		.footer-inner,
		.footer-meta {
			align-items: flex-start;
			flex-direction: column;
		}

		.footer-inner {
			gap: 2rem;
		}

		.footer-meta {
			gap: 0.65rem;
		}
	}
</style>
