# Bitachon Judaica

Handcrafted Judaica catalog site. Live at https://bitachonjudaica.com

**Who you are working with:** this repo is used by the site owner, who is an artist, not a
developer. Explain things in plain language, never in jargon. Do not assume knowledge of
git, terminals, servers, or code. When something goes wrong, say what happened and what to
do about it in one or two sentences.

## Two places this site exists

1. **The preview site (Vercel).** Auto-builds from GitHub every time changes are pushed.
   This is the safe playground for redesign work. Breaking it costs nothing.
2. **The real site (a private server).** Only Zach deploys there, by running `./deploy.sh`
   from his own machine.

**If you are not Zach, never run `./deploy.sh` and never try to reach the server.** Your job
ends at pushing to GitHub. The preview updates itself a minute later.

## The normal workflow

1. Make the change.
2. If you edited `build-pages.py`, run `python3 build-pages.py` so the generated pages
   update, and commit those too.
3. Commit, then push to a **branch**, never straight to `main`.
4. Open a pull request. That emails Zach so he can look before anything reaches the real site.

## Where things live

- **Products, categories, About text, and Contact text are NOT in this repo.** They live on
  the server and are edited through the web admin at https://bitachonjudaica.com/admin.
  Never add or edit products by writing code. If more products are needed, use the admin.
- Product photos also live only on the server. `public/assets/products/` is intentionally
  not in git, which is why previews load photos from the live site over the network.
- `build-pages.py` generates shop, mezuzahs, apparel, about, bulk, shipping, contact, and
  category pages into `public/`. **Do not hand-edit those generated .html files**, edit
  `build-pages.py` instead, because rebuilding overwrites them.
- `public/index.html` is the homepage and IS hand-edited directly.
- `public/assets/site.css` is the shared stylesheet.
- `public/assets/store.js` renders the product grid and the popup.
- `server.js` is the engine that runs the real site. Leave it alone unless asked.

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
