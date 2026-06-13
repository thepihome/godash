# Fix MIME type error on godash.gobunnyy.com

## Browser error

```
Refused to execute script from 'https://godash.gobunnyy.com/static/js/main.*.js'
because its MIME type ('text/html') is not executable
```

## Cause

`gobunny.pages.dev` works. `godash.gobunnyy.com` does not.

Both serve the same Pages deployment, but the **custom domain CDN edge cache** stored `index.html` at the JavaScript URL. The browser receives HTML when it expects JS.

This is **CDN edge cache on the `gobunnyy.com` zone** — not Cloudflare Pages build cache.

## Fix (required once)

1. Cloudflare Dashboard → **`gobunnyy.com` zone** (not Workers & Pages)
2. **Caching** → **Configuration** → **Custom Purge**
3. Purge by prefix: `godash.gobunnyy.com/static/`
4. Hard refresh: **Cmd+Shift+R**

Also check **Caching** → **Cache Rules** on `gobunnyy.com` for rules that cache `godash.gobunnyy.com` or `/static/*` with long TTL / immutable.

## Verify

```bash
curl -sI "https://godash.gobunnyy.com/static/js/main.2928db5d.js" | grep -i content-type
```

Expected: `content-type: application/javascript`

## After login works — backend CORS

```bash
cd backend
wrangler secret put FRONTEND_URLS
# https://gobunny.pages.dev,https://godash.gobunnyy.com
```

Add `https://godash.gobunnyy.com` to Google OAuth authorized JavaScript origins.
