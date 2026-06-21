# Cloudflare R2 setup

The site generates short-lived presigned `PUT` URLs so images and videos upload directly from a trusted client to R2. Cloudflare credentials stay on the server and never enter the browser bundle.

## 1. Create and expose the bucket

1. In Cloudflare, open **Storage & databases → R2** and create a bucket.
2. Connect a custom public domain to the bucket, or enable its public `r2.dev` URL for initial testing.
3. Save that origin as `R2_PUBLIC_URL` without a trailing slash.

## 2. Create scoped credentials

Create an R2 API token with **Object Read & Write** permission, scoped only to this media bucket. Save its Access Key ID and Secret Access Key immediately; Cloudflare does not show the secret again.

Configure these private environment variables locally and in Vercel:

```text
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=
R2_PUBLIC_URL=https://media.example.com
MEDIA_UPLOAD_TOKEN=a-random-secret-with-at-least-32-characters
```

Never prefix these variables with `PUBLIC_` and never commit a populated `.env` file.

## 3. Configure browser upload CORS

Apply this policy to the R2 bucket, replacing the example production origin with the real site domain. Keep localhost while developing.

```json
[
  {
    "AllowedOrigins": ["http://localhost:5173", "https://example.com"],
    "AllowedMethods": ["PUT"],
    "AllowedHeaders": ["Content-Type"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

## 4. Private media studio

Open `/studio` and sign in with the value stored in `MEDIA_UPLOAD_TOKEN`. The password is checked only on the server. A signed, HTTP-only session cookie keeps the studio open for 12 hours, and **Close studio** ends the session immediately.

Choose an image or video, select its archive section, and upload it. The studio previews the file and returns the permanent public URL for use in post frontmatter.

Use `/studio/new` to prepare a post with structured metadata and a live reading proof. Download the generated `.svx` file into the matching `content/posts/<category>/` folder, then commit it with the site.

To revise a post, choose **Open .svx file** on the writing desk and select it from `content/posts`. Make changes, download the replacement, and overwrite the original file in the same category folder.

## 5. Upload API

The studio calls `POST /api/upload/presign` using its signed session cookie. Trusted scripts may alternatively send `Authorization: Bearer <MEDIA_UPLOAD_TOKEN>`. JSON metadata uses this shape:

```json
{
  "filename": "rainy-cafe.jpg",
  "contentType": "image/jpeg",
  "size": 2450000,
  "folder": "food"
}
```

The response contains `uploadUrl`, `publicUrl`, and `requiredHeaders`. Upload the exact file using `PUT uploadUrl` with the returned `Content-Type`, then store `publicUrl` in a post's `coverImage`, `gallery`, or `videos` frontmatter field.

Presigned URLs expire after five minutes. Images are limited to 15 MB and videos to 250 MB when requesting a URL. Because R2 presigned `PUT` URLs cannot enforce body-size policy themselves, keep the signing endpoint private and treat its URLs as temporary bearer credentials.
