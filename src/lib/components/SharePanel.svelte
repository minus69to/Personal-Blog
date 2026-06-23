<script lang="ts">
	import { onMount } from 'svelte';

	let {
		title,
		excerpt,
		path,
		coverImage,
		compact = false
	}: {
		title: string;
		excerpt: string;
		path: string;
		coverImage?: string;
		compact?: boolean;
	} = $props();

	let shareUrl = $state('');
	let message = $state('');
	let working = $state(false);
	let shareDialog: HTMLDialogElement;
	let resetTimer: ReturnType<typeof setTimeout> | undefined;

	let shareText = $derived(`${title} — Insomniyuck`);
	let encodedUrl = $derived(encodeURIComponent(shareUrl));
	let encodedMessage = $derived(encodeURIComponent(`${shareText}\n${excerpt}\n${shareUrl}`));

	type CapacitorBridge = {
		isNativePlatform?: () => boolean;
		isPluginAvailable?: (name: string) => boolean;
		Plugins?: {
			InstagramStory?: {
				share: (options: { imageData: string; contentUrl: string }) => Promise<{ opened: boolean; attributionConfigured: boolean }>;
			};
		};
	};

	onMount(() => {
		shareUrl = new URL(path, window.location.origin).href;
		return () => {
			if (resetTimer) clearTimeout(resetTimer);
		};
	});

	function announce(value: string) {
		message = value;
		if (resetTimer) clearTimeout(resetTimer);
		resetTimer = setTimeout(() => (message = ''), 2600);
	}

	async function copyLink() {
		try {
			await navigator.clipboard.writeText(shareUrl);
			announce('Link copied.');
		} catch {
			announce('Unable to copy the link on this device.');
		}
	}

	async function sharePost() {
		if (!shareUrl) return;
		if (!navigator.share) {
			await copyLink();
			return;
		}
		try {
			await navigator.share({ title: shareText, text: excerpt, url: shareUrl });
		} catch (error) {
			if (error instanceof DOMException && error.name === 'AbortError') return;
			announce('Sharing was unavailable. Try one of the options below.');
		}
	}

	function wrapText(context: CanvasRenderingContext2D, value: string, maxWidth: number) {
		const words = value.trim().split(/\s+/);
		const lines: string[] = [];
		let current = '';
		for (const word of words) {
			const candidate = current ? `${current} ${word}` : word;
			if (context.measureText(candidate).width <= maxWidth || !current) current = candidate;
			else {
				lines.push(current);
				current = word;
			}
		}
		if (current) lines.push(current);
		return lines;
	}

	async function loadCover(url: string) {
		const image = new Image();
		const target = new URL(url, window.location.origin);
		image.src = target.origin === window.location.origin
			? target.href
			: `/api/share-image?url=${encodeURIComponent(target.href)}`;
		await image.decode();
		return image;
	}

	function drawCover(context: CanvasRenderingContext2D, image: HTMLImageElement) {
		const left = 0;
		const top = 0;
		const width = 1080;
		const height = 1920;
		const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight);
		const sourceWidth = width / scale;
		const sourceHeight = height / scale;
		const sourceX = (image.naturalWidth - sourceWidth) / 2;
		const sourceY = (image.naturalHeight - sourceHeight) / 2;
		context.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, left, top, width, height);
	}

	async function createStoryCard() {
		await document.fonts?.ready;
		const canvas = document.createElement('canvas');
		canvas.width = 1080;
		canvas.height = 1920;
		const context = canvas.getContext('2d');
		if (!context) throw new Error('Canvas is unavailable');

		const background = context.createLinearGradient(0, 0, 1080, 1920);
		background.addColorStop(0, '#a98f7f');
		background.addColorStop(1, '#4d5146');
		context.fillStyle = background;
		context.fillRect(0, 0, 1080, 1920);

		if (coverImage) {
			try {
				drawCover(context, await loadCover(coverImage));
			} catch {
				// The designed fallback remains shareable if a remote image blocks canvas access.
			}
		}

		const shade = context.createLinearGradient(0, 700, 0, 1920);
		shade.addColorStop(0, 'rgba(20, 20, 16, 0)');
		shade.addColorStop(1, 'rgba(20, 20, 16, .58)');
		context.fillStyle = shade;
		context.fillRect(0, 650, 1080, 1270);

		const cardLeft = 64;
		const cardTop = 1260;
		const cardWidth = 952;
		const cardHeight = 510;
		context.save();
		context.shadowColor = 'rgba(20, 20, 16, .28)';
		context.shadowBlur = 42;
		context.shadowOffsetY = 16;
		context.fillStyle = 'rgba(247, 242, 233, .96)';
		context.beginPath();
		context.roundRect(cardLeft, cardTop, cardWidth, cardHeight, 34);
		context.fill();
		context.restore();

		context.fillStyle = '#8b5d50';
		context.font = '600 24px "DM Sans", sans-serif';
		context.letterSpacing = '6px';
		context.fillText('INSOMNIYUCK', 118, cardTop + 78);
		context.letterSpacing = '0px';

		context.fillStyle = '#292a24';
		context.font = '500 72px "Cormorant Garamond", serif';
		const titleLines = wrapText(context, title, 840).slice(0, 3);
		titleLines.forEach((line, index) => context.fillText(line, 118, cardTop + 175 + index * 72));

		const excerptTop = cardTop + 215 + titleLines.length * 72;
		context.fillStyle = '#656259';
		context.font = '30px "Cormorant Garamond", serif';
		const excerptLines = wrapText(context, excerpt, 830).slice(0, 2);
		excerptLines.forEach((line, index) => context.fillText(line, 118, excerptTop + index * 40));

		context.fillStyle = '#8b5d50';
		context.font = '600 22px "DM Sans", sans-serif';
		context.fillText('insomniyuck.me', 118, cardTop + cardHeight - 48);

		return new Promise<Blob>((resolve, reject) => {
			canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('Unable to create story card')), 'image/png');
		});
	}

	function blobBase64(blob: Blob) {
		return new Promise<string>((resolve, reject) => {
			const reader = new FileReader();
			reader.onerror = () => reject(reader.error ?? new Error('Unable to read story image'));
			reader.onload = () => {
				const result = typeof reader.result === 'string' ? reader.result : '';
				resolve(result.slice(result.indexOf(',') + 1));
			};
			reader.readAsDataURL(blob);
		});
	}

	function capacitorBridge() {
		return (window as Window & { Capacitor?: CapacitorBridge }).Capacitor;
	}

	async function shareStoryCard() {
		if (working) return;
		working = true;
		try {
			const blob = await createStoryCard();
			const file = new File([blob], `${path.split('/').filter(Boolean).at(-1) || 'insomniyuck'}-story.png`, { type: 'image/png' });
			const capacitor = capacitorBridge();
			const nativePlugin = capacitor?.Plugins?.InstagramStory;
			if (capacitor?.isNativePlatform?.() && capacitor.isPluginAvailable?.('InstagramStory') && nativePlugin) {
				const result = await nativePlugin.share({ imageData: await blobBase64(blob), contentUrl: shareUrl });
				if (!result.attributionConfigured) {
					announce('Instagram opened. Add the Link sticker if attribution is not shown.');
				}
			} else if (navigator.share && navigator.canShare?.({ files: [file] })) {
				await navigator.share({ files: [file], title: shareText, text: shareUrl });
			} else {
				announce('Direct Story sharing is available inside the Android app.');
			}
		} catch (error) {
			if (!(error instanceof DOMException && error.name === 'AbortError')) announce('Unable to prepare the story card.');
		} finally {
			working = false;
		}
	}
</script>

<section class="share-control" class:compact aria-label="Share this post">
	<button class="share-trigger" type="button" onclick={() => shareDialog.showModal()} aria-label={`Share ${title}`} title="Share this post">
		<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="18" cy="5" r="2.5"></circle><circle cx="6" cy="12" r="2.5"></circle><circle cx="18" cy="19" r="2.5"></circle><path d="m8.2 10.8 7.6-4.5M8.2 13.2l7.6 4.5"></path></svg>
	</button>
	<dialog bind:this={shareDialog} onclick={(event) => { if (event.target === shareDialog) shareDialog.close(); }}>
		<div class="sheet">
			<div class="sheet-heading">
				<div><p>Pass it on</p><h2>Share this memory</h2></div>
				<button class="close" type="button" onclick={() => shareDialog.close()} aria-label="Close sharing options">×</button>
			</div>
			<button class="story" type="button" onclick={shareStoryCard} disabled={working}>
				<span class="story-preview" style:background-image={coverImage ? `url(${coverImage})` : undefined}><i>Story</i></span>
				<span><small>Photo + title card</small><strong>{working ? 'Preparing…' : 'Share to Stories'}</strong></span>
			</button>
			<div class="destinations" aria-label="Sharing options">
				<button type="button" onclick={sharePost}><span class="option-icon">↗</span>More</button>
				<a href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`} target="_blank" rel="noopener noreferrer"><span class="option-icon">f</span>Facebook</a>
				<a href={`https://wa.me/?text=${encodedMessage}`} target="_blank" rel="noopener noreferrer"><span class="option-icon">W</span>WhatsApp</a>
				<a href={`https://t.me/share/url?url=${encodedUrl}&text=${encodeURIComponent(shareText)}`} target="_blank" rel="noopener noreferrer"><span class="option-icon">T</span>Telegram</a>
				<button type="button" onclick={copyLink}><span class="option-icon">⌁</span>Copy link</button>
			</div>
			{#if message}<p class="message" aria-live="polite">{message}</p>{/if}
		</div>
	</dialog>
</section>

<style>
	.share-control { display: flex; max-width: 58rem; margin: 0 auto 1.25rem; justify-content: flex-end; }
	.share-trigger { display: grid; width: 2.65rem; height: 2.65rem; padding: 0; place-items: center; color: var(--ink-soft); border: 1px solid var(--line-strong); border-radius: 50%; background: var(--paper-raised); box-shadow: 0 6px 18px rgba(40,40,34,.08); cursor: pointer; transition: color 160ms ease, border-color 160ms ease, transform 160ms ease; }
	.share-trigger:hover { color: var(--accent-deep); border-color: var(--accent); transform: translateY(-2px); }
	.share-trigger svg { width: 1rem; fill: none; stroke: currentColor; stroke-linecap: round; stroke-width: 1.7; }
	dialog { width: min(92vw, 31rem); max-height: 90vh; padding: 0; overflow: visible; color: var(--ink); border: 0; border-radius: 1rem; background: transparent; }
	dialog::backdrop { background: rgba(26,27,23,.56); backdrop-filter: blur(3px); }
	.sheet { padding: 1.5rem; overflow: hidden; border: 1px solid var(--line-strong); border-radius: 1rem; background: var(--paper-raised); box-shadow: 0 28px 80px rgba(20,20,17,.28); }
	.sheet-heading { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; }
	.sheet-heading p { margin: 0 0 .25rem; color: var(--rose); font-size: .52rem; font-weight: 700; letter-spacing: .15em; text-transform: uppercase; }
	h2 { margin: 0; font-family: var(--font-display); font-size: 1.8rem; font-weight: 500; }
	.close { width: 2rem; height: 2rem; padding: 0 0 .15rem; color: var(--ink-soft); border: 1px solid var(--line); border-radius: 50%; background: transparent; cursor: pointer; font-family: var(--font-display); font-size: 1.5rem; line-height: 1; }
	.story { display: flex; width: 100%; align-items: center; gap: 1rem; margin-top: 1.25rem; padding: .7rem; color: var(--ink); border: 1px solid var(--line-strong); border-radius: .75rem; background: color-mix(in srgb, var(--paper) 72%, transparent); cursor: pointer; text-align: left; }
	.story:hover { border-color: var(--accent); background: var(--accent-soft); }
	.story-preview { position: relative; display: block; flex: 0 0 3.4rem; height: 4.8rem; overflow: hidden; border-radius: .35rem; background-color: #7b8070; background-position: center; background-size: cover; }
	.story-preview::after { position: absolute; right: .3rem; bottom: .35rem; left: .3rem; height: 1.4rem; content: ''; border-radius: .15rem; background: rgba(247,242,233,.94); box-shadow: 0 2px 6px rgba(0,0,0,.2); }
	.story-preview i { position: absolute; z-index: 1; right: .45rem; bottom: .7rem; left: .45rem; color: #493f38; font-family: var(--font-display); font-size: .52rem; font-style: normal; }
	.story > span:last-child { display: grid; gap: .2rem; }
	.story small { color: var(--rose); font-size: .5rem; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; }
	.story strong { font-family: var(--font-display); font-size: 1.2rem; font-weight: 500; }
	.story:disabled { cursor: wait; opacity: .6; }
	.destinations { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: .5rem; margin-top: 1rem; }
	.destinations button, .destinations a { display: grid; min-width: 0; gap: .4rem; justify-items: center; padding: .45rem .15rem; color: var(--ink-soft); border: 0; background: transparent; cursor: pointer; font-size: .48rem; font-weight: 700; letter-spacing: .04em; text-align: center; text-transform: uppercase; }
	.destinations button:hover, .destinations a:hover { color: var(--accent-deep); }
	.option-icon { display: grid; width: 2.55rem; height: 2.55rem; place-items: center; color: var(--ink); border: 1px solid var(--line); border-radius: 50%; background: var(--paper); font-family: var(--font-display); font-size: .9rem; font-weight: 600; text-transform: none; }
	.destinations button:hover .option-icon, .destinations a:hover .option-icon { border-color: var(--accent); background: var(--accent-soft); }
	button:focus-visible, a:focus-visible { outline: 2px solid var(--accent-deep); outline-offset: 3px; }
	.message { margin: .8rem 0 0; color: var(--accent-deep); font-size: .65rem; line-height: 1.45; }
	.share-control.compact { margin: .9rem 0 0; }

	@media (max-width: 520px) {
		dialog { width: 100%; max-width: none; max-height: 85vh; margin: auto 0 0; }
		.sheet { border-radius: 1rem 1rem 0 0; }
		.destinations { overflow-x: auto; }
	}
</style>
