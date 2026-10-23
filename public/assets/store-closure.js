/* Shopping controls follow the configured calendar; installed server checks remain authoritative. */
(() => {
  const NOTICE='OUR SHOP IS CLOSED FOR SHABBOS AND YOM. PLEASE VISIT US AGAIN AFTERWARD.';
  let state={closed:true,status:'unavailable'}, calendar, serverState, serverOffset=0, pending;
  const saved=new WeakMap();
  const shopping='.gift-discovery a,.external-continue,a[href^="/shop-out?"],.cart-call,.cart-phone,.phone-order,#add-to-cart';
  function current(){
    const now=Date.now()+serverOffset;
    if(serverState && (serverState.status==='unavailable' || serverState.enabled===false || now<serverState.nextChange))return serverState;
    if(!calendar || now<calendar.validFrom || now>=calendar.validUntil)return {closed:true,status:'unavailable'};
    if(!calendar.config.enabled)return {closed:false,status:'disabled'};
    const active=calendar.intervals.find(([start,end])=>now>=start && now<end);
    return {closed:!!active,status:active?'closed':'open',notice:NOTICE};
  }
  function update(){
    state=current();
    const banner=document.querySelector('.shabbos-notice');
    if(banner && !banner.hasAttribute('data-persistent-notice')){banner.hidden=!state.closed;banner.textContent=state.notice||(state.status==='closed'?NOTICE:'Shopping is temporarily unavailable. Please try again later.');}
    document.querySelectorAll(shopping+', [data-closure-disabled]').forEach(el=>{
      if(state.closed){
        if(!saved.has(el))saved.set(el,{href:el.getAttribute('href'),disabled:el.disabled});
        el.dataset.closureDisabled='true';el.setAttribute('aria-disabled','true');
        if(el.tagName==='A')el.removeAttribute('href');else el.disabled=true;
      }else if(saved.has(el)){
        const prev=saved.get(el);if(prev.href!==null)el.setAttribute('href',prev.href);if(el.tagName!=='A')el.disabled=!!prev.disabled;
        delete el.dataset.closureDisabled;el.removeAttribute('aria-disabled');saved.delete(el);
      }
    });
  }
  function refresh(){
    if(pending)return pending;
    pending=Promise.allSettled([
      fetch((window.BJ_API||'')+'/api/store-status',{cache:'no-store',signal:AbortSignal.timeout(5000)}).then(r=>{if(!r.ok)throw Error('unavailable');return r.json();}).then(s=>{if(typeof s.closed!=='boolean')throw Error('bad status');serverState=s;serverOffset=Number.isFinite(s.serverTime)?s.serverTime-Date.now():0;}),
      fetch('/assets/closure-calendar.json',{cache:'no-store',signal:AbortSignal.timeout(5000)}).then(r=>{if(!r.ok)throw Error('calendar unavailable');return r.json();}).then(c=>{if(!Array.isArray(c.intervals)||!c.config||!Number.isFinite(c.validFrom)||!Number.isFinite(c.validUntil))throw Error('bad calendar');calendar=c;})
    ]).finally(()=>{pending=null;update();});return pending;
  }
  for(const type of ['click','auxclick'])document.addEventListener(type,event=>{
    const el=event.target.closest?.('[data-closure-disabled],'+shopping);
    if(el){state=current();if(state.closed){event.preventDefault();event.stopImmediatePropagation();update();}}
  },true);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden){update();refresh();}});
  new MutationObserver(update).observe(document.querySelector('main'),{childList:true,subtree:true});
  update();refresh();setInterval(update,1000);setInterval(refresh,60000);
})();
