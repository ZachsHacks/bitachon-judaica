const test=require('node:test');
const assert=require('node:assert/strict');
const vm=require('vm');
const fs=require('fs');
const snapshot=require('../closure-seed.json');
test('shop links, phone ordering and Add to cart close and reopen without changing saved content',async()=>{
 let now=Date.parse('2026-03-06T17:27:59-06:00');
 const original='https://example.com/shop';
 const a={tagName:'A',dataset:{},attrs:{href:original},getAttribute(k){return this.attrs[k]??null},setAttribute(k,v){this.attrs[k]=v},removeAttribute(k){delete this.attrs[k]}};
 const button={...a,tagName:'BUTTON',dataset:{},attrs:{},disabled:false};
 const banner={hidden:true,textContent:''};const ticks=[],events={};
 const document={hidden:false,querySelector:s=>s==='.shabbos-notice'?banner:{},querySelectorAll:()=>[a,button],addEventListener:(e,f)=>{events[e]=f}};
 const context={document,window:{BJ_API:''},WeakMap,Promise,Number,Date:{now:()=>now},AbortSignal,Error,MutationObserver:class{observe(){}},setInterval:(f)=>ticks.push(f),fetch:async url=>url.includes('/api/')?{ok:false}:{ok:true,json:async()=>snapshot}};
 vm.runInNewContext(fs.readFileSync('public/assets/store-closure.js','utf8'),context);
 await new Promise(resolve=>setImmediate(resolve));assert.equal(banner.hidden,true);assert.equal(a.attrs.href,original);
 now=Date.parse('2026-03-06T17:28:00-06:00');ticks[0]();assert.equal(banner.hidden,false);assert.equal(banner.textContent,'OUR SHOP IS CLOSED FOR SHABBOS AND YOM. PLEASE VISIT US AGAIN AFTERWARD.');assert.equal(a.attrs.href,undefined);assert.equal(button.disabled,true);
 let prevented=false;events.click({target:{closest:()=>a},preventDefault(){prevented=true},stopImmediatePropagation(){}});assert.equal(prevented,true);
 now=Date.parse('2026-03-07T18:29:00-06:00');ticks[0]();assert.equal(a.attrs.href,original);assert.equal(button.disabled,false);assert.equal(banner.hidden,true);
});
