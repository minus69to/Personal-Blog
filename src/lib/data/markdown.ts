export type MarkdownBlock =
	| { kind: 'heading'; level: 2 | 3; text: string }
	| { kind: 'paragraph'; text: string }
	| { kind: 'quote'; text: string }
	| { kind: 'list'; items: string[] };

export type InlineMarkdownSegment = { kind: 'text' | 'strong' | 'emphasis'; text: string };

export function parseInlineMarkdown(value: string): InlineMarkdownSegment[] {
	const segments: InlineMarkdownSegment[] = [];
	const pattern = /(\*\*[^*\n]+\*\*|\*[^*\n]+\*)/g;
	let cursor = 0;
	for (const match of value.matchAll(pattern)) {
		const index = match.index ?? 0;
		if (index > cursor) segments.push({ kind: 'text', text: value.slice(cursor, index) });
		const token = match[0];
		segments.push(token.startsWith('**')
			? { kind: 'strong', text: token.slice(2, -2) }
			: { kind: 'emphasis', text: token.slice(1, -1) });
		cursor = index + token.length;
	}
	if (cursor < value.length) segments.push({ kind: 'text', text: value.slice(cursor) });
	return segments.length ? segments : [{ kind: 'text', text: value }];
}

export function parseMarkdownBlocks(markdown: string): MarkdownBlock[] {
	const blocks: MarkdownBlock[] = [];
	let paragraph: string[] = [];
	let list: string[] = [];
	const flushParagraph = () => {
		if (paragraph.length) blocks.push({ kind: 'paragraph', text: paragraph.join(' ') });
		paragraph = [];
	};
	const flushList = () => {
		if (list.length) blocks.push({ kind: 'list', items: list });
		list = [];
	};

	for (const rawLine of markdown.split(/\r?\n/)) {
		const line = rawLine.trim();
		if (!line) {
			flushParagraph();
			flushList();
			continue;
		}
		const heading = line.match(/^(#{1,3})\s+(.+)$/);
		if (heading) {
			flushParagraph();
			flushList();
			blocks.push({ kind: 'heading', level: heading[1].length >= 3 ? 3 : 2, text: heading[2] });
			continue;
		}
		if (line.startsWith('> ')) {
			flushParagraph();
			flushList();
			blocks.push({ kind: 'quote', text: line.slice(2) });
			continue;
		}
		if (/^[-*]\s+/.test(line)) {
			flushParagraph();
			list.push(line.replace(/^[-*]\s+/, ''));
			continue;
		}
		flushList();
		paragraph.push(line);
	}
	flushParagraph();
	flushList();
	return blocks;
}
