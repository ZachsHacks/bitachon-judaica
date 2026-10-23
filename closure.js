/* Server-authoritative shopping availability. Calendar: https://www.hebcal.com/home/195/jewish-calendar-rest-api */
const fs = require('fs');
const path = require('path');
const NOTICE = 'OUR SHOP IS CLOSED FOR SHABBOS AND YOM. PLEASE VISIT US AGAIN AFTERWARD.';
const DAY = 86400000;
function validateConfig(c) {
  if(typeof c.timeZone !== 'string' || !c.timeZone || typeof c.enabled !== 'boolean' || !Number.isInteger(c.geonameId) || c.geonameId < 1 || typeof c.diaspora !== 'boolean' || !Number.isInteger(c.candleMinutes) || c.candleMinutes < 0 || c.candleMinutes > 90 || !(c.havdalahMinutes === null || Number.isInteger(c.havdalahMinutes) && c.havdalahMinutes > 0 && c.havdalahMinutes <= 120)) throw Error('Invalid closure configuration');
  new Intl.DateTimeFormat('en-US', {timeZone:c.timeZone}).format();
  return c;
}
function calendarUrl(c, year) {
  validateConfig(c);
  const q = new URLSearchParams({v:'1',cfg:'json',start:(year-1)+'-01-01',end:(year+1)+'-12-31',maj:'on',s:'on',c:'on',geo:'geoname',geonameid:String(c.geonameId),i:c.diaspora?'off':'on',b:String(c.candleMinutes),leyning:'off'});
  if(c.havdalahMinutes === null) q.set('M','on'); else q.set('m',String(c.havdalahMinutes));
  return 'https://www.hebcal.com/hebcal?'+q;
}
function intervalsFromCalendar(data) {
  if(!Array.isArray(data.items)) throw Error('Missing calendar events');
  const events = data.items.filter(e=>['candles','havdalah'].includes(e.category)).map(e=>{
    if(!/^\d{4}-\d{2}-\d{2}T.*(?:Z|[+-]\d{2}:\d{2})$/.test(e.date)) throw Error('Missing timezone on calendar event');
    const time=Date.parse(e.date);if(!Number.isFinite(time))throw Error('Invalid calendar time');return {...e,time};
  }).sort((a,b)=>a.time-b.time || (a.category==='candles'?-1:1));
  const out=[];let start=null;
  for(const e of events){
    if(e.category==='candles'){if(start===null)start=e.time;}
    else if(start!==null){if(e.time<=start || e.time-start>4*DAY)throw Error('Invalid closure interval');out.push([start,e.time]);start=null;}
  }
  if(out.length<40)throw Error('Incomplete calendar');
  const merged=[];
  for(const item of out){const last=merged.at(-1);if(last && item[0]<=last[1])last[1]=Math.max(last[1],item[1]);else merged.push(item);}
  return merged;
}
function makeSnapshot(data, config, year) {
  if(data.location?.tzid!==config.timeZone || Number(data.location?.geonameid)!==config.geonameId)throw Error('Calendar location mismatch');
  return {config,source:calendarUrl(config,year),fetchedAt:new Date().toISOString(),validFrom:Date.UTC(year-1,0,8),validUntil:Date.UTC(year+1,11,24),intervals:intervalsFromCalendar(data)};
}
function statusFor(snapshot, config, now=Date.now()) {
  if(!config.enabled)return {enabled:false,status:'disabled',closed:false,notice:NOTICE};
  if(!snapshot || JSON.stringify(snapshot.config)!==JSON.stringify(config) || now<snapshot.validFrom || now>=snapshot.validUntil)return {enabled:true,status:'unavailable',closed:true,notice:'Shopping is temporarily unavailable. Please try again later.'};
  const active=snapshot.intervals.find(([start,end])=>now>=start && now<end);
  const next=snapshot.intervals.find(([start])=>start>now);
  return {serverTime:now,enabled:true,status:active?'closed':'open',closed:!!active,notice:NOTICE,location:'GeoNames '+config.geonameId,timeZone:config.timeZone,nextChange:active?active[1]:(next?.[0]||snapshot.validUntil),source:'Hebcal',candleMinutes:config.candleMinutes,havdalah:config.havdalahMinutes===null?'8.5 degrees below horizon':config.havdalahMinutes+' minutes after sunset',diaspora:config.diaspora};
}
function normalizedPath(raw) {
  try{return decodeURIComponent(new URL(raw,'http://localhost').pathname).replace(/\/+$/,'').toLowerCase()||'/';}catch{return null;}
}
function isCommercePath(raw) {
  const p=normalizedPath(raw);
  return p===null || p==='/shop-out' || /(?:^|\/)(?:checkout|checkouts|create-checkout-session|orders?|payments?|payment-links|purchase|buy|pay)(?:\/|$)/.test(p);
}
function enforce(req,res,state) {
  if(!state.closed || !isCommercePath(req.url))return false;
  res.writeHead(state.status==='unavailable'?503:403,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});
  res.end(JSON.stringify({error:state.status==='unavailable'?'shopping_unavailable':'shop_closed',message:state.notice,reopensAt:state.status==='closed'?state.nextChange:null}));return true;
}
function createClosure({directory=__dirname,fetchImpl=fetch,clock=Date.now}={}) {
  const configFile=path.join(directory,'closure-config.json');
  const cacheFile=path.join(directory,'data','closure-cache.json');
  let config,snapshot,pending;
  function reloadConfig(){try{config=validateConfig(JSON.parse(fs.readFileSync(configFile,'utf8')));}catch{config={enabled:true};snapshot=null;}}
  reloadConfig();
  try{snapshot=JSON.parse(fs.readFileSync(cacheFile,'utf8'));}catch{try{snapshot=JSON.parse(fs.readFileSync(path.join(directory,'closure-seed.json'),'utf8'));}catch{}}
  async function refresh(){
    if(pending)return pending;
    pending=(async()=>{reloadConfig();validateConfig(config);if(!config.enabled)return;const year=new Date(clock()).getUTCFullYear();const r=await fetchImpl(calendarUrl(config,year),{signal:AbortSignal.timeout(10000)});if(!r.ok)throw Error('Calendar request failed');const next=makeSnapshot(await r.json(),config,year);fs.mkdirSync(path.dirname(cacheFile),{recursive:true});fs.writeFileSync(cacheFile+'.tmp',JSON.stringify(next));fs.renameSync(cacheFile+'.tmp',cacheFile);snapshot=next;})().catch(e=>{console.error('Closure calendar refresh failed:',e.message);}).finally(()=>{pending=null;});
    return pending;
  }
  const timer=setInterval(refresh,6*3600000);timer.unref();refresh();
  return {status:()=>statusFor(snapshot,config,clock()),refresh,stop:()=>clearInterval(timer)};
}
module.exports={NOTICE,validateConfig,calendarUrl,intervalsFromCalendar,makeSnapshot,statusFor,normalizedPath,isCommercePath,enforce,createClosure};
