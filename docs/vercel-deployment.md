# Vercel deployment

The project uses the official SvelteKit Vercel adapter. Connect the GitHub repository to Vercel and keep every private value in **Project Settings → Environment Variables**.

## Required production variables

Add these values to Production, Preview, and Development unless you intentionally want different credentials per environment:

```text
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=insomniyuck
R2_PUBLIC_URL=https://media.insomniyuck.me
MEDIA_UPLOAD_TOKEN=
```

Add these after the Upstash visit database is created:

```text
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

Never prefix private values with `PUBLIC_`, paste them into source files, or commit a populated `.env` file.

## Deploy from GitHub

1. Push the latest `main` branch to GitHub.
2. In Vercel, choose **Add New → Project** and import `minus69to/Personal-Blog`.
3. Keep the detected SvelteKit framework preset and default build settings.
4. Add the environment variables above before the first production deployment.
5. Deploy and verify `/`, `/post/blog-test`, `/studio/login`, and one R2 upload.

## Connect the domain

After the Vercel deployment works, add `insomniyuck.me` and `www.insomniyuck.me` under **Project Settings → Domains**. Vercel will show the DNS records to add in Cloudflare. Keep the separate `media.insomniyuck.me` R2 custom domain unchanged.

Environment-variable changes only apply to new deployments, so redeploy after adding or rotating a value.
