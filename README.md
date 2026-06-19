# Bitachon Judaica

Static website for Bitachon Judaica (handcrafted Judaica). Live at https://bitachonjudaica.com

## Structure
- `public/` — the deployable site (index.html + menu pages + assets). Served as-is.
- `public/assets/site.css` — shared styles for the subpages.
- `build-pages.py` — regenerates the subpages (shop, mezuzahs, apparel, about, bulk, shipping, contact) with a shared header/footer.
- `server.js` — tiny dependency-free static file server (port 3015) used on the VPS.

The homepage source is the Option 3 refined-light design (`public/index.html`).

## Hosting & deploy
Self-hosted on the Hostinger VPS (NOT Vercel). PM2 app `bitachon-site` runs `server.js`
on port 3015; Traefik routes the domain with auto Let's Encrypt TLS.

Deploy = rsync the site up (no git push, no restart needed):

```bash
rsync -az public/ root@srv811922.hstgr.cloud:/opt/bitachon-site/public/
```

## DNS
Registered at GoDaddy. `A @ -> 168.231.75.68`; `www` is a CNAME to the apex.
