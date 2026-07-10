// Renders products from /api/products into a .cats grid. Used by shop/category pages.
window.BJStore = {
  esc(s){ return (s||'').replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); },
  card(p){
    const img = p.image ? `<div class="ph"><img src="${this.esc(p.image)}" alt="${this.esc(p.name)}"></div>`
                        : `<div class="ph"></div>`;
    const price = p.price ? `<div class="cprice">${this.esc(p.price)}</div>` : '';
    const desc = p.description ? `<p class="cdesc">${this.esc(p.description)}</p>` : '';
    return `<div class="cat">${img}<h3>${this.esc(p.name)}</h3>${price}${desc}</div>`;
  },
  async render(id, category){
    const el = document.getElementById(id); if(!el) return;
    let all = []; try { all = await fetch('/api/products').then(r => r.json()); } catch {}
    const list = (all||[]).filter(p => p.available !== false && (!category || p.category === category));
    el.innerHTML = list.length ? list.map(p => this.card(p)).join('')
      : '<p class="empty">New pieces coming soon.</p>';
  },
  renderFromQuery(id, titleId){
    const c = new URLSearchParams(location.search).get('c') || '';
    if (titleId && c){ document.getElementById(titleId).textContent = c; document.title = c + ' | Bitachon Judaica'; }
    return this.render(id, c || null);
  }
};
