// Renders the storefront: search, category nav, product grid, and the detail popup.
// Category switching and search are client-side (no page reload). Data is fetched once and cached.
// Previews (Vercel/localhost) read products and photos from the live site via window.BJ_API.
window.BJStore = {
  esc(s){ return (s||'').replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); },
  EMAIL: 'bitachonjudaica@gmail.com',
  _list: [], _all: null, _cfg: null, _pid: 'products', _nid: 'catnav', _cat: null, _q: '',
  get _base(){ return window.BJ_API || ''; },
  // Product photos live only on the live server, so preview builds must load them from there.
  _img(s){ return this._base + (s || ''); },
  async _products(){ if(!this._all){ try { this._all = await fetch(this._base+'/api/products').then(r=>r.json()); } catch { this._all = []; } } return this._all; },
  async _config(){ if(!this._cfg){ try { this._cfg = await fetch(this._base+'/api/config').then(r=>r.json()); } catch { this._cfg = {}; } } return this._cfg; },

  // ---- search ----
  _match(p, q){
    if(!q) return true;
    const hay = [p.name, p.tagline, p.description, (p.categories||[]).join(' '), (p.tags||[]).join(' ')].join(' ').toLowerCase();
    // every word must appear somewhere, so "baby cup" finds a customized baby cup
    return q.toLowerCase().split(/\s+/).filter(Boolean).every(w => hay.indexOf(w) !== -1);
  },
  renderSearch(id){
    const el = document.getElementById(id); if(!el) return;
    el.innerHTML = `<div class="searchbox">
      <input id="bj-q" type="search" placeholder="Search the shop" aria-label="Search products" autocomplete="off" value="${this.esc(this._q)}">
      <button type="button" id="bj-qx" aria-label="Clear search">&times;</button>
    </div><div class="searchnote" id="bj-qnote" role="status" aria-live="polite"></div>`;
    const input = document.getElementById('bj-q');
    let t;
    input.oninput = () => { clearTimeout(t); t = setTimeout(() => { this._q = input.value.trim(); this.render(this._pid, this._cat, true); }, 150); };
    document.getElementById('bj-qx').onclick = () => { input.value=''; this._q=''; this.render(this._pid, this._cat, true); input.focus(); };
  },

  card(p, i){
    const img = (p.images && p.images[0])
      ? `<div class="ph"><img src="${this.esc(this._img(p.images[0]))}" alt="${this.esc(p.name)}" loading="lazy"></div>`
      : `<div class="ph"></div>`;
    const more = (p.images && p.images.length > 1) ? `<span class="more">${p.images.length} photos</span>` : '';
    const tags = (p.tags || []).map(t => `<span class="chip">${this.esc(t)}</span>`).join('');
    const sub = p.tagline ? `<p class="cdesc">${this.esc(p.tagline)}</p>` : '';
    // Show the description on the card. She was clear that nobody will click to find out what something is.
    const desc = p.description ? `<p class="cbody">${this.esc(p.description)}</p>` : '';
    const price = `<div class="cprice${p.price?'':' price-note'}">${this.esc(p.price || 'Ask us for pricing')}</div>`;
    // Bumper stickers are long and thin, so they get a full row instead of being a stamp in a square.
    // ponytail: keyed off the category name; switch to a per-product flag if other wide items appear.
    const wide = (p.categories || []).includes('Bumper Stickers') ? ' wide' : '';
    return `<div class="cat prod${wide}" data-i="${i}">${img}${more}<h3>${this.esc(p.name)}</h3>${price}${sub}${desc}${tags?`<div class="chips">${tags}</div>`:''}<button class="product-details" type="button" aria-label="View ${this.esc(p.name)}">View details <span aria-hidden="true">&rarr;</span></button></div>`;
  },

  async render(id, category, keepScroll){
    this._pid = id; this._cat = category || null;
    const el = document.getElementById(id); if(!el) return;
    const all = await this._products();
    const list = (all||[]).filter(p =>
      p.available !== false &&
      (!category || (p.categories||[]).includes(category)) &&
      this._match(p, this._q));
    this._list = list;
    el.innerHTML = list.length
      ? list.map((p,i) => this.card(p,i)).join('')
      : `<p class="empty">${this._q ? 'Nothing matched "'+this.esc(this._q)+'". Try a different word.' : 'New pieces coming soon.'}</p>`;
    el.querySelectorAll('.prod').forEach(c => c.onclick = () => this.open(list[+c.dataset.i]));
    const note = document.getElementById('bj-qnote');
    if (note) note.textContent = this._q ? `${list.length} ${list.length===1?'result':'results'}` : `${list.length} products to explore`;
    if (!keepScroll) window.scrollTo({ top: 0 });
  },

  async renderCats(id, active){
    this._nid = id;
    const el = document.getElementById(id); if(!el) return;
    const [cfg, all] = [await this._config(), await this._products()];
    // Only show categories that actually have something in them, so the nav never leads to an
    // empty page. A category reappears on its own as soon as a product is added to it.
    const count = c => (all||[]).filter(p => p.available !== false && (p.categories||[]).includes(c)).length;
    const chip = (label, cat, on, n) => `<a class="catchip${on?' on':''}" href="${cat?('/category.html?c='+encodeURIComponent(cat)):'/shop.html'}" data-cat="${this.esc(cat||'')}">${this.esc(label)}${n?`<span class="n">${n}</span>`:''}</a>`;
    const total = (all||[]).filter(p => p.available !== false).length;
    el.innerHTML = chip('Everything', '', !active, total)
      + (cfg.categories||[]).filter(c => c === active || count(c)).map(c => chip(c, c, c===active, count(c))).join('');
    el.querySelectorAll('.catchip').forEach(a => a.onclick = e => { e.preventDefault(); this.go(a.dataset.cat || null); });
  },

  // Homepage: a visual tile per category so everything she sells is visible at a glance.
  async renderTiles(id){
    const el = document.getElementById(id); if(!el) return;
    const [cfg, all] = [await this._config(), await this._products()];
    const live = (all||[]).filter(p => p.available !== false);
    const tiles = (cfg.categories||[]).map(c => {
      const items = live.filter(p => (p.categories||[]).includes(c));
      if(!items.length) return '';
      const hero = items.find(p => (p.images||[]).length);
      const photo = hero ? `<img src="${this.esc(this._img(hero.images[0]))}" alt="" loading="lazy">` : '';
      return `<a class="tile" href="/category.html?c=${encodeURIComponent(c)}">
        <div class="tph">${photo}</div>
        <div class="tname">${this.esc(c)}</div>
        <div class="tcount">${items.length} ${items.length===1?'item':'items'}</div>
      </a>`;
    }).join('');
    el.innerHTML = tiles || '<p class="empty">Adding pieces now.</p>';
  },

  // client-side category switch: update URL, title, active chip, and products in place
  go(category){
    history.pushState({ c: category || '' }, '', category ? '/category.html?c=' + encodeURIComponent(category) : '/shop.html');
    this._apply(category);
  },
  _apply(category){
    const t = document.getElementById('cat-title');
    if (t) t.textContent = category || 'Everything';
    document.title = (category || 'Shop') + ' | Bitachon Judaica';
    this.renderCats(this._nid, category || null);
    this.render(this._pid, category || null);
  },
  renderFromQuery(id, titleId){
    const c = new URLSearchParams(location.search).get('c') || '';
    if (titleId) document.getElementById(titleId).textContent = c || 'Everything';
    if (c) document.title = c + ' | Bitachon Judaica';
    return this.render(id, c || null);
  },

  open(p){
    if(!p) return;
    const imgs = p.images && p.images.length ? p.images : [];
    const thumbs = imgs.length > 1 ? `<div class="lb-thumbs">${imgs.map((s,i)=>`<img src="${this.esc(this._img(s))}" data-t="${i}" class="${i===0?'on':''}">`).join('')}</div>` : '';
    const tags = (p.tags||[]).map(t=>`<span class="chip">${this.esc(t)}</span>`).join('');
    const subject = encodeURIComponent('Question about: ' + (p.name||''));
    let box = document.getElementById('bj-lb');
    if(!box){ box = document.createElement('div'); box.id='bj-lb'; document.body.appendChild(box); }
    box.innerHTML = `<div class="lb-back"></div><div class="lb-card">
      <button class="lb-x" aria-label="Close">&times;</button>
      <div class="lb-media">${imgs.length?`<img id="lb-main" src="${this.esc(this._img(imgs[0]))}">`:''}${thumbs}</div>
      <div class="lb-info">
        <h2>${this.esc(p.name)}</h2>
        ${p.tagline?`<p class="lb-tag">${this.esc(p.tagline)}</p>`:''}
        ${p.price?`<div class="lb-price">${this.esc(p.price)}</div>`:''}
        ${p.description?`<p class="lb-desc">${this.esc(p.description)}</p>`:''}
        ${tags?`<div class="chips">${tags}</div>`:''}
        <button type="button" class="lb-inquire lb-inquire-button" id="add-to-cart">Add to cart</button><a class="phone-order" href="tel:+12246452752">Questions? Call (224) 645-2752</a>
      </div></div>`;
    box.querySelector('#add-to-cart').onclick=()=>{ if(window.BJCart){ BJCart.add(p); box.querySelector('#add-to-cart').textContent='Added to cart'; } };
    box.style.display='flex'; document.body.style.overflow='hidden';
    const close=()=>{box.style.display='none';document.body.style.overflow='';};
    box.querySelector('.lb-back').onclick=close; box.querySelector('.lb-x').onclick=close;
    box.querySelectorAll('[data-t]').forEach(t=>t.onclick=()=>{document.getElementById('lb-main').src=t.src;box.querySelectorAll('[data-t]').forEach(x=>x.classList.remove('on'));t.classList.add('on');});
  }
};
// back/forward buttons re-render in place instead of a hard reload
window.addEventListener('popstate', () => {
  const c = location.pathname.indexOf('category') !== -1 ? (new URLSearchParams(location.search).get('c') || null) : null;
  BJStore._apply(c);
});
// Escape closes the popup.
window.addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  const box = document.getElementById('bj-lb');
  if (box && box.style.display === 'flex') { box.style.display = 'none'; document.body.style.overflow = ''; }
});


