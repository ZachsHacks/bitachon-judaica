// Renders products from /api/products into a .cats grid, with a lightbox gallery for multiple images.
window.BJStore = {
  esc(s){ return (s||'').replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); },
  _list: [],
  card(p, i){
    const img = (p.images && p.images[0]) ? `<div class="ph"><img src="${this.esc(p.images[0])}" alt="${this.esc(p.name)}"></div>` : `<div class="ph"></div>`;
    const tags = (p.tags || []).map(t => `<span class="chip">${this.esc(t)}</span>`).join('');
    const sub = p.tagline ? `<p class="cdesc">${this.esc(p.tagline)}</p>` : '';
    const price = p.price ? `<div class="cprice">${this.esc(p.price)}</div>` : '';
    return `<div class="cat prod" data-i="${i}">${img}<h3>${this.esc(p.name)}</h3>${price}${sub}${tags?`<div class="chips">${tags}</div>`:''}</div>`;
  },
  async render(id, category){
    const el = document.getElementById(id); if(!el) return;
    let all = []; try { all = await fetch('/api/products').then(r => r.json()); } catch {}
    const list = (all||[]).filter(p => p.available !== false && (!category || (p.categories||[]).includes(category)));
    this._list = list;
    el.innerHTML = list.length ? list.map((p,i) => this.card(p,i)).join('') : '<p class="empty">New pieces coming soon.</p>';
    el.querySelectorAll('.prod').forEach(c => c.onclick = () => this.open(list[+c.dataset.i]));
  },
  async renderCats(id){
    const el = document.getElementById(id); if(!el) return;
    let cfg = {}; try { cfg = await fetch('/api/config').then(r => r.json()); } catch {}
    el.innerHTML = (cfg.categories||[]).map(c => `<a class="catchip" href="/category.html?c=${encodeURIComponent(c)}">${this.esc(c)}</a>`).join('');
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
