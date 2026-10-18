/* Shopping list for phone orders. Prices and availability are confirmed by phone. */
window.BJCart = {
  key: 'bj-cart-v1', items: [],
  esc(s){return String(s == null ? '' : s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));},
  init(){
    try{const saved=JSON.parse(localStorage.getItem(this.key)||'[]');this.items=Array.isArray(saved)?saved.filter(p=>p&&typeof p.name==='string'&&Number.isInteger(p.qty)&&p.qty>0).map(p=>({...p,qty:Math.min(99,p.qty)})):[];}catch{this.items=[];}
    this.render();
  },
  save(){try{localStorage.setItem(this.key,JSON.stringify(this.items));}catch{}this.render();},
  add(p,quantity=1){quantity=Math.max(1,Math.min(20,Math.floor(Number(quantity)||1)));const id=String(p.id||p.name);let item=this.items.find(x=>x.id===id);if(item)item.qty=Math.min(99,item.qty+quantity);else this.items.push({id,name:p.name,price:p.price||'',image:(p.images||[])[0]||'',qty:quantity});this.save();},
  money(n){return new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(n);},
  price(s){const m=String(s).trim().match(/^\$?\s*(\d+(?:,\d{3})*(?:\.\d{1,2})?)$/);return m?Math.round(Number(m[1].replace(/,/g,''))*100):null;},
  render(){
    const count=this.items.reduce((n,p)=>n+p.qty,0);
    document.querySelectorAll('[data-cart-count]').forEach(el=>el.textContent=count);
    const host=document.getElementById('cart-content');if(!host)return;
    const e=s=>this.esc(s);
    if(!count){host.innerHTML='<div class="cart-empty"><h2>Your cart is waiting for something special.</h2><p>Browse our collection and add the pieces you love.</p><a class="btn" href="/shop.html">Explore the shop</a></div>';return;}
    let subtotal=0,unknown=false;
    const rows=this.items.map((p,i)=>{const price=this.price(p.price);if(price===null)unknown=true;else subtotal+=price*p.qty;
      const img=typeof p.image==='string'&&/^\/assets\//.test(p.image)?`<img src="${e((window.BJ_API||'')+p.image)}" alt="${e(p.name)}">`:'';
      return `<article class="cart-item"><div class="cart-photo">${img}</div><div class="cart-details"><h2>${e(p.name)}</h2><p>${e(p.price||'Price confirmed by phone')}</p><div class="cart-controls"><label>Quantity <select data-qty="${i}" aria-label="Quantity for ${e(p.name)}">${Array.from({length:99},(_,j)=>`<option ${j+1===p.qty?'selected':''}>${j+1}</option>`).join('')}</select></label><button type="button" data-remove="${i}" aria-label="Remove ${e(p.name)}">Remove</button></div></div><strong class="cart-line-total">${price===null?'Confirm by phone':this.money(price*p.qty/100)}</strong></article>`;}).join('');
    host.innerHTML=`<div class="cart-layout"><div><div class="cart-list-head">${count} ${count===1?'item':'items'} in your cart</div>${rows}<a class="cart-continue" href="/shop.html">Continue shopping</a></div><aside class="cart-summary"><h2>Order summary</h2><div class="cart-subtotal"><span>${unknown?'Priced items subtotal':'Items subtotal'}</span><strong>${this.money(subtotal/100)}</strong></div><p>Shipping, tax, availability, and any custom details will be confirmed when you call.${unknown?' Some item prices also need confirmation.':''}</p><a class="cart-call" href="tel:+12246452752">Call to place your order</a><a class="cart-phone" href="tel:+12246452752">(224) 645-2752</a><p class="cart-note">Your cart is saved on this device. Adding items does not reserve them or place an order. No payment is taken online.</p></aside></div>`;
    host.querySelectorAll('[data-qty]').forEach(el=>el.onchange=()=>{this.items[+el.dataset.qty].qty=Math.max(1,Math.min(99,Number(el.value)||1));this.save();});
    host.querySelectorAll('[data-remove]').forEach(el=>el.onclick=()=>{this.items.splice(+el.dataset.remove,1);this.save();});
  }
};
document.addEventListener('DOMContentLoaded',()=>BJCart.init());

