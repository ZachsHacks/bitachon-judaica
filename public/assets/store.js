// Renders products from /api/products into a .cats grid, with a lightbox gallery for multiple images.
// Category switching is client-side (no page reload) to keep it smooth. products/config are fetched once and cached.
window.BJStore = {
  esc(s){ return (s||'').replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); },
  _list: [], _all: null, _cfg: null, _pid: 'products', _nid: 'catnav', _cat: null,
  async _products(){ if(!this._all){ try { this._all = await fetch('/api/products').then(r=>r.json()); } catch { this._all = []; } } return this._all; },
  async _config(){ if(!this._cfg){ try { this._cfg = await fetch('/api/config').then(r=>r.json()); } catch { this._cfg = {}; } } return this._cfg; },
  card(p, i){
    const img = (p.images && p.images[0]) ? `<div class="ph"><img src="${this.esc(p.images[0])}" alt="${this.esc(p.name)}"></div>` : `<div class="ph"></div>`;
    const tags = (p.tags || []).map(t => `<span class="chip">${this.esc(t)}</span>`).join('');
    const sub = p.tagline ? `<p class="cdesc">${this.esc(p.tagline)}</p>` : '';
    const price = p.price ? `<div class="cprice">${this.esc(p.price)}</div>` : '';
    return `<div class="cat prod" data-i="${i}">${img}<h3>${this.esc(p.name)}</h3>${price}${sub}${tags?`<div class="chips">${tags}</div>`:''}</div>`;
  },
  async render(id, category){
    this._pid = id; this._cat = category || null;
    const el = document.getElementById(id); if(!el) return;
    const all = await this._products();
    const list = (all||[]).filter(p => p.available !== false && (!category || (p.categories||[]).includes(category)));
    this._list = list;
    el.innerHTML = list.length ? list.map((p,i) => this.card(p,i)).join('') : '<p class="empty">New pieces coming soon.</p>';
    el.querySelectorAll('.prod').forEach(c => c.onclick = () => this.open(list[+c.dataset.i]));
  },
  async renderCats(id, active){
    this._nid = id;
    const el = document.getElementById(id); if(!el) return;
    const cfg = await this._config();
    const chip = (label, cat, on) => `<a class="catchip${on?' on':''}" href="${cat?('/category.html?c='+encodeURIComponent(cat)):'/shop.html'}" data-cat="${this.esc(cat||'')}">${this.esc(label)}</a>`;
    el.innerHTML = chip('All', '', !active) + (cfg.categories||[]).map(c => chip(c, c, c===active)).join('');
    el.querySelectorAll('.catchip').forEach(a => a.onclick = e => { e.preventDefault(); this.go(a.dataset.cat || null); });
  },
  // client-side category switch: update URL, title, active chip, and products in place
  go(category){
    const url = category ? '/category.html?c=' + encodeURIComponent(category) : '/shop.html';
    history.pushState({ c: category || '' }, '', url);
    this._apply(category);
  },
  _apply(category){
    const t = document.getElementById('cat-title');
    if (t) t.textContent = category || 'Shop';
    document.title = (category || 'Shop') + ' | Bitachon Judaica';
    this.renderCats(this._nid, category || null);
    this.render(this._pid, category || null);
    window.scrollTo({ top: 0 });
  },
  renderFromQuery(id, titleId){
    const c = new URLSearchParams(location.search).get('c') || '';
    if (titleId && c){ document.getElementById(titleId).textContent = c; document.title = c + ' | Bitachon Judaica'; }
    return this.render(id, c || null);
  },
  open(p){
    if(!p) return;
    const imgs = p.images && p.images.length ? p.images : [];
    const thumbs = imgs.length > 1 ? `<div class="lb-thumbs">${imgs.map((s,i)=>`<img src="${this.esc(s)}" data-t="${i}" class="${i===0?'on':''}">`).join('')}</div>` : '';
    const tags = (p.tags||[]).map(t=>`<span class="chip">${this.esc(t)}</span>`).join('');
    let box = document.getElementById('bj-lb');
    if(!box){ box = document.createElement('div'); box.id='bj-lb'; document.body.appendChild(box); }
    box.innerHTML = `<div class="lb-back"></div><div class="lb-card">
      <button class="lb-x">×</button>
      <div class="lb-media">${imgs.length?`<img id="lb-main" src="${this.esc(imgs[0])}">`:''}${thumbs}</div>
      <div class="lb-info">
        <h2>${this.esc(p.name)}</h2>
        ${p.tagline?`<p class="lb-tag">${this.esc(p.tagline)}</p>`:''}
        ${p.price?`<div class="lb-price">${this.esc(p.price)}</div>`:''}
        ${p.description?`<p class="lb-desc">${this.esc(p.description)}</p>`:''}
        ${tags?`<div class="chips">${tags}</div>`:''}
        <a class="lb-inquire" href="/contact.html">Inquire about this piece</a>
      </div></div>`;
    box.style.display='block'; document.body.style.overflow='hidden';
    const close=()=>{box.style.display='none';document.body.style.overflow='';};
    box.querySelector('.lb-back').onclick=close; box.querySelector('.lb-x').onclick=close;
    box.querySelectorAll('[data-t]').forEach(t=>t.onclick=()=>{document.getElementById('lb-main').src=t.src;box.querySelectorAll('[data-t]').forEach(x=>x.classList.remove('on'));t.classList.add('on');});
  }
};
// back/forward buttons re-render in place instead of a hard reload
window.addEventListener('popstate', () => {
  const onCategory = location.pathname.indexOf('category') !== -1;
  const c = onCategory ? (new URLSearchParams(location.search).get('c') || null) : null;
  BJStore._apply(c);
});
