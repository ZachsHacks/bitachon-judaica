// Run with PLAYWRIGHT_PATH pointing to an installed Playwright module. No dev server.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright');
const root = path.resolve(__dirname, '../public');
const evidence = process.env.EVIDENCE_DIR || '/tmp/bitachon-qa';
fs.mkdirSync(evidence, {recursive:true});
const photoMapText = fs.readFileSync(path.join(root,'assets/catalog-photos.js'),'utf8');
const sandbox = {window:{BJ_API:'https://bitachonjudaica.com'}};
require('node:vm').runInNewContext(photoMapText,sandbox);
assert.equal(Object.keys(sandbox.window.BJPhotoMap).length,58);
assert.equal(sandbox.window.BJPhoto('/assets/new.jpg'),'https://bitachonjudaica.com/assets/new.jpg');
for(const target of Object.values(sandbox.window.BJPhotoMap)) assert.ok(fs.existsSync(path.join(root,target)));
const image = Object.keys(sandbox.window.BJPhotoMap)[0];
const products = Array.from({length:16},(_,i)=>({id:String(i),name:i===15?'Bubbe Coffee Cup':`Piece ${i}`,price:'$18',tagline:'Handmade test piece',description:'Full description for the preview test.',available:true,categories:i===15?['Gifts']:['Art'],tags:[],images:[image]}));
const config = {categories:['Art','Gifts','Empty']};
(async()=>{
 const browser=await chromium.launch({headless:true});
 const page=await browser.newPage({viewport:{width:1440,height:1000}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/api/products',r=>r.fulfill({json:products}));
 await page.route('**/api/config',r=>r.fulfill({json:config}));
 await page.route('https://bitachon.test/**',async r=>{
  let name=new URL(r.request().url()).pathname;if(name==='/')name='/index.html';
  const file=path.join(root,name);
  if(!file.startsWith(root+path.sep)||!fs.existsSync(file)){await r.fulfill({status:404,body:'Not found'});return;}
  const ext=path.extname(file),mime={'.html':'text/html','.css':'text/css','.js':'text/javascript','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg'}[ext]||'application/octet-stream';
  await r.fulfill({body:fs.readFileSync(file),contentType:mime});
 });
 await page.goto('https://bitachon.test/');
 await page.waitForFunction(()=>document.querySelectorAll('.prod').length===12);
 assert.equal(await page.locator('audio').count(),0);
 assert.equal(await page.locator('.category-section').count(),0);
 assert.equal(await page.locator('.catchip[data-cat="Empty"]').count(),0);
 assert.equal(await page.locator('#bj-q').isVisible(),true);
 assert.match(await page.locator('.collection-more').textContent(),/16/);
 // Search must include products beyond the initial twelve and bring results below the search.
 await page.locator('#bj-q').fill('Bubbe');
 await page.waitForFunction(()=>document.querySelectorAll('.prod').length===1);
 assert.match(await page.locator('.prod h3').textContent(),/Bubbe/);
 assert.equal(await page.locator('.gift-discovery').isVisible(),false);
 await page.locator('#bj-q').fill('zznomatches');
 await page.waitForSelector('.empty');assert.match(await page.locator('.empty').textContent(),/Nothing matched/);
 await page.getByRole('button',{name:'Clear search'}).click();
 await page.waitForFunction(()=>document.querySelectorAll('.prod').length===12);
 assert.equal(await page.locator('.gift-discovery').isVisible(),true);
 // Homepage category chips must load full pages, never retain a truncated preview at /shop.html.
 await page.locator('.catchip[data-cat=""]').click();
 await page.waitForURL('**/shop.html');await page.waitForFunction(()=>document.querySelectorAll('.prod').length===16);
 await page.goto('https://bitachon.test/');await page.waitForSelector('.catchip[data-cat="Gifts"]');
 await page.locator('.catchip[data-cat="Gifts"]').click();await page.waitForURL('**/category.html?c=Gifts');
 await page.waitForFunction(()=>document.querySelectorAll('.prod').length===1);
 assert.equal(await page.locator('#cat-title').textContent(),'Gifts');
 await page.goto('https://bitachon.test/');await page.waitForFunction(()=>document.querySelectorAll('.prod').length===12);
 // Open details, add to local-only cart, and verify the same image mapping is used there.
 await page.locator('.product-details').first().click();await page.waitForSelector('#lb-main');
 assert.match(await page.locator('#lb-main').getAttribute('src'),/catalog-clean/);
 await page.locator('#add-to-cart').click();assert.equal(await page.locator('[data-cart-count]').textContent(),'1');
 await page.keyboard.press('Escape');await page.goto('https://bitachon.test/cart.html');
 await page.waitForSelector('.cart-item');assert.match(await page.locator('.cart-photo img').getAttribute('src'),/catalog-clean/);
 await page.getByRole('button',{name:'Remove Piece 0'}).click();await page.waitForSelector('.cart-empty');
 await page.goto('https://bitachon.test/shop.html');await page.waitForFunction(()=>document.querySelectorAll('.prod').length===16);
 await page.locator('.catchip[data-cat="Gifts"]').click();await page.waitForFunction(()=>document.querySelectorAll('.prod').length===1);
 await page.goBack();await page.waitForFunction(()=>document.querySelectorAll('.prod').length===16);
 await page.goto('https://bitachon.test/');await page.waitForSelector('.prod');
 // External links must not navigate until the visitor explicitly continues.
 let outboundRequests=0;
 await page.context().route('https://external.example/**',r=>{outboundRequests++;return r.fulfill({body:'Approved external test destination',contentType:'text/html'});});
 await page.evaluate(()=>{const a=document.createElement('a');a.id='external-test';a.href='https://external.example/find?tag=retained';a.target='_blank';a.rel='sponsored';a.textContent='Test external destination';document.body.prepend(a);});
 await page.locator('#external-test').click();
 assert.equal(await page.locator('.external-warning').evaluate(e=>e.open),true);
 assert.equal(outboundRequests,0);
 assert.match(await page.locator('#external-warning-body').textContent(),/may contain pritzus/);
 assert.equal(await page.evaluate(()=>document.activeElement.textContent),'Stay here');
 await page.getByRole('button',{name:'Stay here'}).click();
 assert.equal(await page.locator('.external-warning').evaluate(e=>e.open),false);
 assert.equal(outboundRequests,0);
 await page.locator('#external-test').click();await page.keyboard.press('Escape');
 assert.equal(await page.locator('.external-warning').evaluate(e=>e.open),false);
 await page.locator('#external-test').focus();await page.keyboard.press('Enter');
 assert.equal(await page.locator('.external-warning').evaluate(e=>e.open),true);
 const popupPromise=page.context().waitForEvent('page');
 await page.getByRole('link',{name:'Continue to website'}).click();
 const popup=await popupPromise;await popup.waitForLoadState();
 assert.equal(popup.url(),'https://external.example/find?tag=retained');assert.equal(outboundRequests,1);await popup.close();
 await page.waitForFunction(()=>!document.querySelector('.external-warning').open);
 await page.locator('#external-test').click({button:'middle'});
 assert.equal(await page.locator('.external-warning').evaluate(e=>e.open),true);assert.equal(outboundRequests,1);
 await page.getByRole('button',{name:'Stay here'}).click();
 await page.evaluate(()=>{const a=document.createElement('a');a.id='internal-test';a.href='#collection';a.textContent='Internal test';document.body.prepend(a);});
 await page.locator('#internal-test').click();assert.equal(await page.locator('.external-warning').evaluate(e=>e.open),false);
 await page.evaluate(()=>{document.querySelector('#external-test').remove();document.querySelector('#internal-test').remove();window.scrollTo(0,0)});
 console.log('PASS: external warning, exact text, no navigation on cancel/Escape, default stay focus, keyboard, middle click, internal links and confirmed URL/tracking preservation.');
 for(const width of [1440,390]){
  await page.setViewportSize({width,height:1000});await page.evaluate(()=>document.fonts.ready);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`overflow at ${width}`);
  await page.screenshot({path:path.join(evidence,`fixture-${width}.png`),fullPage:true});
  await page.locator('.gift-buttons a').first().click();
  await page.screenshot({path:path.join(evidence,`warning-${width}.png`)});
  assert.equal(await page.locator('.external-warning').evaluate(e=>e.scrollWidth>e.clientWidth),false);
  await page.getByRole('button',{name:'Stay here'}).click();
 }
 assert.deepEqual(errors,[]);
 console.log('PASS: homepage, full collection, search beyond preview, clear/empty states, category/back navigation, photo mapping, local cart, mobile/desktop, no JS errors.');
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
