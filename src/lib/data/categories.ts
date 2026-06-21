import type { Category } from './posts';

export type CategoryDetails = {
	title: string;
	kicker: string;
	description: string;
	mark: string;
};

export const categoryDetails: Record<Category, CategoryDetails> = {
	food: {
		title: 'Food Diary',
		kicker: 'Meals worth remembering',
		description: 'Tables found, flavours loved, and the little stories served alongside them.',
		mark: '01'
	},
	travel: {
		title: 'Travel Journal',
		kicker: 'Notes from elsewhere',
		description: 'Unhurried stories from roads, cities, hills, and every beautiful detour.',
		mark: '02'
	},
	running: {
		title: 'Running & Marathon',
		kicker: 'Miles in motion',
		description: 'Early starts, difficult kilometres, finish lines, and lessons carried home.',
		mark: '03'
	},
	books: {
		title: 'Books',
		kicker: 'From the reading chair',
		description: 'Books that stayed, underlined sentences, and thoughts from the margins.',
		mark: '04'
	},
	movies: {
		title: 'Movies',
		kicker: 'After the credits',
		description: 'Films watched in dark rooms and the feelings that followed me into the light.',
		mark: '05'
	},
	thoughts: {
		title: 'Thoughts',
		kicker: 'Things passing through',
		description: 'Random thoughts, unfinished ideas, old memories, and the small things occupying my mind.',
		mark: '06'
	},
	life: {
		title: 'Life Notes',
		kicker: 'The beautiful ordinary',
		description: 'Friends, small celebrations, passing thoughts, and days I want to remember.',
		mark: '07'
	},
	quotes: {
		title: 'Quotes',
		kicker: 'Words worth keeping',
		description: 'Lines from books, films, and conversations, with a small note of my own.',
		mark: '08'
	}
};
