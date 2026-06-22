# Writing diary entries

Posts live in category folders inside `content/posts`. To add one, copy an existing `.svx` file into the matching folder, rename it, and edit its frontmatter and Markdown body.

## Frontmatter template

```yaml
---
title: The title readers will see
slug: a-unique-url-friendly-slug
date: '2026-06-21'
language: en
category: food
tags: [coffee, friends]
excerpt: A short description used on cards and in search previews.
coverTone: clay
coverImage: ''
gallery: []
videos: []
location: Dhaka
rating: 4.5
quote: ''
source: ''
featured: false
---
```

Write the story below the second `---` using normal Markdown. Headings use `##`, emphasis uses `*italic*`, bold text uses `**bold**`, and quotes begin with `>`.

## Allowed values

- `category`: `food`, `travel`, `running`, `books`, `movies`, `thoughts`, `life`, or `quotes`
- `coverTone`: `clay`, `forest`, `dawn`, `ink`, `plum`, `sand`, or `mist`
- `rating`: optional number from `0` to `5`
- `featured`: `true` or `false`

The development server automatically reloads after a file is added or edited. Invalid or missing required fields produce a clear error naming the affected file.

## Adding photos and videos

For local media, place files inside `static/media` and reference them from frontmatter with a leading slash:

```yaml
coverImage: /media/my-memory/cover.jpg
gallery:
  - /media/my-memory/photo-01.jpg
  - /media/my-memory/photo-02.jpg
videos:
  - /media/my-memory/short-clip.mp4
```

Remote Cloudflare R2 public URLs can be used in exactly the same fields later. Keep image files reasonably compressed and add captions or subtitles to videos when possible.

Use `language: bn` for a Bangla post. Bangla is supported in titles, excerpts, tags, quotes, and the Markdown body. Keep the `slug` in English transliteration for a clean, reliable URL.
