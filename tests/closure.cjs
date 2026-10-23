const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('fs');
const http=require('http');
const c=require('../closure');
const config=require('../closure-config.json');
const data=require('./fixtures/chicago-2026.json');
const snapshot=c.makeSnapshot(data,config,2026);
const state=date=>c.statusFor(snapshot,config,Date.parse(date));
test('Chicago location, diaspora and documented solar conventions are explicit',()=>{
 const url=new URL(c.calendarUrl(config,2026));assert.equal(url.searchParams.get('geonameid'),'4887398');assert.equal(url.searchParams.get('i'),'off');assert.equal(url.searchParams.get('b'),'18');assert.equal(url.searchParams.get('M'),'on');assert.equal(config.timeZone,'America/Chicago');
});
test('closes exactly at candles, reopens exactly at final havdalah',()=>{
 assert.equal(state('2026-03-06T17:27:59-06:00').closed,false);assert.equal(state('2026-03-06T17:28:00-06:00').closed,true);assert.equal(state('2026-03-07T18:28:59-06:00').closed,true);assert.equal(state('2026-03-07T18:29:00-06:00').closed,false);
});
test('spring and autumn DST use offset-aware solar timestamps',()=>{
 for(const time of ['2026-03-06T17:28:00-06:00','2026-03-13T18:37:00-05:00','2026-10-30T17:29:00-05:00','2026-11-06T16:20:00-06:00']){assert.equal(state(time).closed,true);assert.equal(c.statusFor(snapshot,config,Date.parse(time)-1).closed,false);}
});
test('all diaspora Yom Tov days close and ordinary intermediate weekdays stay open',()=>{
 const holidays=data.items.filter(e=>e.yomtov===true);assert.equal(holidays.length,13);
 for(const day of holidays)assert.equal(state(day.date+'T12:00:00-05:00').closed,true,day.title);
 for(const day of ['2026-04-06','2026-04-07','2026-09-28','2026-09-29','2026-09-30','2026-10-01'])assert.equal(state(day+'T12:00:00-05:00').closed,false,day);
});
test('consecutive festival and Shabbos dates never briefly reopen',()=>{
 for(let time=Date.parse('2026-04-01T20:00:00-05:00');time<Date.parse('2026-04-04T19:00:00-05:00');time+=60000)assert.equal(c.statusFor(snapshot,config,time).closed,true);
 assert.equal(state('2026-09-11T18:48:00-05:00').closed,true);assert.equal(state('2026-09-13T19:44:59-05:00').closed,true);assert.equal(state('2026-09-13T19:45:00-05:00').closed,false);
});
test('expired or location-mismatched calendars fail closed',()=>{
 assert.equal(c.statusFor(null,config).closed,true);assert.equal(c.statusFor(snapshot,{...config,timeZone:'America/New_York'}).closed,true);assert.equal(c.statusFor(snapshot,config,snapshot.validUntil).closed,true);
 assert.throws(()=>c.makeSnapshot({...data,location:{...data.location,tzid:'UTC'}},config,2026));
});
test('server blocks direct and encoded order/payment routes before downstream work',async()=>{
 let closed=true,created=0;
 const server=http.createServer((req,res)=>{if(c.enforce(req,res,{closed,status:closed?'closed':'open',notice:c.NOTICE}))return;created++;res.writeHead(200);res.end('test handler only');});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 try{const base='http://127.0.0.1:'+server.address().port;for(const route of ['/api/orders','/api/checkout','/api/payment','/create-checkout-session','/API/%63HECKOUT/','/checkout/session','/shop-out?to=https%3A%2F%2Fexample.com'])for(const method of ['GET','POST']){const r=await fetch(base+route,{method});assert.equal(r.status,403,route);}
 assert.equal(created,0);closed=false;assert.equal((await fetch(base+'/api/orders',{method:'POST'})).status,200);assert.equal(created,1);
 }finally{await new Promise(resolve=>server.close(resolve));}
});
test('invalid calendar settings and unzoned events are rejected',()=>{
 assert.throws(()=>c.validateConfig({...config,timeZone:'Not/AZone'}));assert.throws(()=>c.validateConfig({...config,candleMinutes:-1}));assert.throws(()=>c.intervalsFromCalendar({items:[{category:'candles',date:'2026-01-02T17:00:00'}]}));
});
