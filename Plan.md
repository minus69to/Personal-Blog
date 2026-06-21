Build a personal diary style blog website using SvelteKit.

Tech stack:

* SvelteKit with TypeScript
* Vercel for hosting
* Cloudflare R2 for image and video storage
* Markdown or MDsveX for blog writing
* Optional simple admin/editor panel later
* Responsive design with dark mode

Main idea:
This website will be my personal diary and memory archive. It should include food experiences, restaurant visits, running and marathon memories, tours, books, movie reviews, quotes, friends, life events, photos, videos, and personal reflections.

Required sections:

1. Home

   * Short intro about me
   * Featured memories
   * Recent posts
   * Visit counter
   * Link to chithi.me for anonymous messages

2. Food Diary

   * Restaurant visits
   * Food photos
   * Restaurant name, location, date, rating, short story
   * Tags like burger, coffee, biryani, cafe

3. Travel Journal

   * Tour stories
   * Place, date, photos, videos
   * Map/location field if possible
   * Memory style writing

4. Running and Marathon

   * Marathon/running events
   * Distance, date, location, timing
   * Photos and notes

5. Books

   * Book reviews
   * Favorite quotes
   * Rating
   * Author, reading date, short thoughts

6. Movies

   * Movie reviews
   * Watched on laptop or cineplex
   * Rating, date, favorite quote
   * Review and personal thoughts

7. Life Notes

   * Personal events
   * Friends, memories, random diary entries
   * Photos/videos support

8. Quotes

   * Favorite movie/book quotes
   * Source name
   * Small personal note

9. Archive

   * All posts sorted by date
   * Filter by category, tag, year

10. About

* About me
* Interests
* Social links
* chithi.me anonymous comment link

Data model:
Create a common content schema for all posts.

Each post should support:

* title
* slug
* date
* category
* tags
* excerpt
* coverImage
* gallery images
* videos
* location
* rating optional
* quote optional
* body content in Markdown or MDsveX

Example categories:

* food
* travel
* running
* books
* movies
* life
* quotes

Project structure:
src/
lib/
components/
Navbar.svelte
Footer.svelte
PostCard.svelte
Gallery.svelte
VisitCounter.svelte
CategoryBadge.svelte
data/
posts.ts
utils/
r2.ts
slug.ts
routes/
+layout.svelte
+page.svelte
about/
archive/
food/
travel/
running/
books/
movies/
life/
quotes/
post/[slug]/
api/
upload/
visit/
content/
posts/
food/
travel/
running/
books/
movies/
life/
quotes/

Phase 1: Basic project setup

* Create a new SvelteKit project with TypeScript.
* Add clean responsive layout.
* Add Navbar and Footer.
* Add dark mode.
* Create Home, About, Archive, and category pages.
* Add sample posts manually.

Phase 2: Blog content system

* Add MDsveX or Markdown support.
* Store posts inside content/posts.
* Each post should have frontmatter.
* Generate post list automatically.
* Create dynamic route /post/[slug].
* Add tag and category filtering.

Phase 3: Media support

* Use Cloudflare R2 for storing images and videos.
* Add environment variables:
  R2_ACCOUNT_ID
  R2_ACCESS_KEY_ID
  R2_SECRET_ACCESS_KEY
  R2_BUCKET_NAME
  R2_PUBLIC_URL
* Create a server side upload API.
* Never expose R2 secret keys on frontend.
* Use presigned upload URLs or server side upload.
* Store uploaded image/video URLs in post metadata.

Phase 4: Easy add and modify system
First version:

* I can add posts by creating Markdown or MDsveX files manually.

Later version:

* Build a simple private admin page.
* Admin page should allow:

  * create post
  * edit post
  * upload images/videos
  * select category
  * add tags
  * preview post
* Protect admin page with a password or simple authentication.

Phase 5: Visit counter

* Add a simple visit counter.
* Track total visits.
* Track page wise visits if possible.
* Use a simple database or serverless storage.
* Show total visits on homepage.

Phase 6: Anonymous message link

* Add a visible chithi.me button/link.
* Text can be:
  “Leave me an anonymous note”
* Put it on homepage and about page.

Phase 7: Design style

* Personal, warm, minimal, diary-like.
* Not too corporate.
* Use card based layout.
* Large photo friendly design.
* Mobile first responsive design.
* Good typography for long writing.
* Gallery layout for food and travel posts.

Phase 8: Deployment

* Push project to GitHub.
* Deploy on Vercel.
* Use SvelteKit Vercel adapter.
* Add all environment variables in Vercel project settings.
* Test production build.
* Buy a domain.
* Connect domain with Vercel.

Important rules:

* Keep the code clean and beginner friendly.
* Add comments where needed.
* Make components reusable.
* Make it easy for me to add new categories later.
* Do not overcomplicate the first version.
* First build a working MVP, then add admin panel and advanced features.
