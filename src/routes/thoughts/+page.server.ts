import type { PageServerLoad } from './$types';
import { loadPublicCategory } from '$lib/server/categoryLoad';
export const load: PageServerLoad = () => loadPublicCategory('thoughts');
