/* Run after changing closure-config.json, then rebuild and publish the generated calendar. */
const fs=require('fs');
const path=require('path');
const {calendarUrl,makeSnapshot}=require('../closure');
const config=require('../closure-config.json');
(async()=>{
 const year=new Date().getUTCFullYear();
 const response=await fetch(calendarUrl(config,year),{signal:AbortSignal.timeout(20000)});
 if(!response.ok)throw Error('Hebcal calendar download failed');
 const snapshot=makeSnapshot(await response.json(),config,year);
 for(const file of ['closure-seed.json','public/assets/closure-calendar.json']){
  const target=path.join(__dirname,'..',file);fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,JSON.stringify(snapshot,null,2)+'\n');
 }
 console.log('Updated calendar for '+config.timeZone+' using '+snapshot.source);
})().catch(error=>{console.error(error.message);process.exitCode=1;});
