# Bitachon Judaica

Handcrafted Judaica catalog site. Live at https://bitachonjudaica.com

**Who you are working with:** this repo is used by the site owner, who is an artist, not a
developer. Explain things in plain language, never in jargon. Do not assume knowledge of
git, terminals, servers, or code. When something goes wrong, say what happened and what to
do about it in one or two sentences.

## Two places this site exists

1. **The preview site (Vercel).** Every pull request gets its own preview link, posted on the
   pull request a minute after it opens. This is the safe playground.
2. **The real site (bitachonjudaica.com).** Updates itself about a minute after a pull request
   is merged into `main` (GitHub Actions, `.github/workflows/deploy.yml`).

**Never run `./deploy.sh`, never try to reach the server, and never edit
`.github/workflows/`.** Your job ends at opening a pull request.

## The normal workflow

1. Make the change.
2. If you edited `build-pages.py`, run `python3 build-pages.py` so the generated pages
   update, and commit those too.
3. Open a pull request with a one-line plain-English title, like "Bigger homepage headline".
4. Tell the owner to open the Vercel preview link on the pull request, and to click
   **Merge** when she likes it. Merging puts it on the real site.

## Where things live

- **Products, categories, About text, and Contact text are NOT in this repo.** They live on
  the server and are edited through the web admin at https://bitachonjudaica.com/admin.
  Never add or edit products by writing code. If more products are needed, use the admin.
- Product photos also live only on the server. `public/assets/products/` is intentionally
  not in git, which is why previews load photos from the live site over the network.
- `build-pages.py` generates the homepage (`index.html`), shop, mezuzahs, apparel, about, bulk, shipping, contact, and
  category pages into `public/`. **Do not hand-edit those generated .html files**, edit
  `build-pages.py` instead, because rebuilding overwrites them.
- The homepage too: edit it in `build-pages.py`, never in `public/index.html`. Every deploy
  reruns `build-pages.py`, so a hand edit to any generated page is thrown away.
- `public/assets/site.css` is the shared stylesheet.
- `public/assets/store.js` renders the product grid and the popup.
- `server.js` is the engine that runs the real site. Never edit it. Merging does not deploy it,
  so a change there would silently not happen. If a request needs it, say Zach has to do it.

## How previews get real products

Every page sets `window.BJ_API`. On the live domain it is empty (use our own API). Anywhere
else, including Vercel previews and localhost, it points at `https://bitachonjudaica.com`
so the preview shows the real live products and photos. Keep any new fetch call and any new
product-image tag going through `BJ_API` (in `store.js`, use `this._base` and `this._img()`),
otherwise previews will show an empty store or broken images.

## Design rules

- Colors: off-white paper `#FAF9F4`, royal blue `#2B5C99`, gold `#B8923D`, ink `#26303C`.
- Fonts: Playfair Display (headings), Jost (body), Cinzel (the wordmark only).
- The feel is boutique and warm, not corporate. Generous white space.
- **Never use an em dash or an en dash anywhere**, in copy, code comments, or HTML. Use a
  comma, a period, or parentheses. Write ranges as "1 to 2".
- Check how it looks on a phone, not just a wide screen.

## Safety rules

- Never delete anything in the server's `data/` folder. That is the only copy of every product.
- Never commit passwords, keys, or the `.env` file.
- After a visual change, actually look at the page before saying it is done.
