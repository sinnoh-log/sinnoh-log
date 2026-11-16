/* Trip secrets (Update 57): a travel day's encounters, road events and rival sightings live in gm/road, which only the GM
   can read. Players see the weather and how far the party got. Older trips move their secrets over when the GM opens them.
   The journal copy includes the secrets only when the GM ticks the box. */
const {open}=require('./lib');
let fails=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fails++;};
const click=(p,a)=>p.evaluate(a=>{const b=document.createElement('button');Object.entries(a).forEach(([k,v])=>b.dataset[k]=v);b.hidden=true;document.body.appendChild(b);b.click();b.remove();},a);
const W=(p,n)=>p.waitForTimeout(n||600);
const get=(p,path)=>p.evaluate(a=>window.__store.get(a),path);
const OLD=[
  {n:1,date:'2026-07-13',wx:'Clear',at:'Route 203 toward Oreburgh City',prog:'About 2 days left on this stretch.',enc:'Wild encounter',sp:['2× Shinx','Starly'],ev:'A rockslide blocks the path.',push:false},
  {n:2,date:'2026-07-14',wx:'Rain',at:'Route 203 toward Oreburgh City',prog:'About 1 day left on this stretch.',enc:'',sp:[],ev:'',riv:{id:'n_r1',c:'gym',n:'Dawn Ortega',txt:'Dawn Ortega (Gym circuit #120, 2–1)'},push:false}
];
const trip={k:'',from:'jubilife-city',to:'oreburgh-city',pace:'steady',who:'',steps:[{r:'route-203',a:'jubilife-city',b:'oreburgh-city',n:'',t:3,days:3}],pos:0,into:2,day:2,start:'2026-07-12',log:OLD,done:false,zone:'road'};
const seedOld=S=>{S['meta/conditions']={date:'2026-07-14',trip:JSON.parse(JSON.stringify(trip))};return S;};
(async()=>{
  // the GM opens an older trip: its secrets move to gm/road
  let {b,p,errs}=await open({admin:true,uid:'u1',tab:'cal',seedFn:seedOld});
  await W(p,1500);
  let pub=(await get(p,'meta/conditions')).trip,gm=((await get(p,'gm/road'))||{}).trip;
  ok(pub&&pub.log.length===2&&pub.log.every(e=>!('enc' in e)&&!('sp' in e)&&!('ev' in e)&&!('riv' in e)),'an older trip’s encounters, events and sightings leave the shared record');
  ok(gm&&gm.k&&gm.d&&gm.d[1]&&gm.d[1].enc==='Wild encounter'&&gm.d[1].sp.length===2&&gm.d[1].ev&&gm.d[2]&&gm.d[2].riv&&!gm.d[2].enc,'they are kept in the GM’s storage, day by day');
  ok(pub.log[0].wx==='Clear'&&/2 days left/.test(pub.log[0].prog),'the weather and progress stay shared');
  let t=await p.evaluate(()=>document.body.innerText);
  ok(/Wild encounter: 2× Shinx, Starly/.test(t)&&/rockslide/.test(t)&&/On the road: Dawn Ortega/.test(t),'the GM still sees them on the trip panel');
  // roll some days: nothing secret is shared
  for(let i=0;i<6;i++){await click(p,{act:'cl_roll'});await W(p,350);}
  pub=(await get(p,'meta/conditions')).trip;gm=(await get(p,'gm/road')).trip;
  ok(pub.log.length>=3&&pub.log.every(e=>!('enc' in e)&&!('ev' in e)&&!('riv' in e)&&!('sp' in e)),'new days keep only weather and progress in the shared record ('+pub.log.length+' days)');
  ok(gm.d[1]&&gm.d[1].sp.length===2,'rolling new days keeps the older days’ secrets');
  const rolled=await p.evaluate(()=>{const t=clTrip();return t.log.map(e=>clDayFull(t,e)).filter(clHasSecret).length;});
  ok(rolled>=2,'the GM’s view joins the two back together ('+rolled+' days with something hidden)');
  // the journal
  await click(p,{act:'cl_journal'});await W(p,600);
  let J=await p.evaluate(()=>Object.values(S.journal).map(j=>j.body));
  ok(J.length===1&&!/Shinx|rockslide|Dawn Ortega/.test(J[0])&&/Day 1/.test(J[0])&&/Clear/.test(J[0]),'Copy the log to the journal: weather and progress only, unless you tick the box');
  await p.evaluate(()=>{const c=document.querySelector('input[data-u="clj.all"]');c.click();});await W(p,200);
  await click(p,{act:'cl_journal'});await W(p,600);
  J=await p.evaluate(()=>Object.values(S.journal).map(j=>j.body));
  ok(J.length===2&&J.some(x=>/2× Shinx, Starly/.test(x)&&/rockslide/.test(x)&&/Dawn Ortega/.test(x)),'with “Include encounters and events” ticked, the copy has everything');
  ok(errs.length===0,'no page errors ('+errs.slice(0,3).join(' | ')+')');
  // a new trip starts clean
  await click(p,{act:'cl_end'});await W(p,1200);
  const endA=(await get(p,'meta/conditions')).trip,endB=((await get(p,'gm/road'))||{}).trip;
  ok(!endA&&!endB,'ending the trip clears both records ('+JSON.stringify([!!endA,endB&&Object.keys(endB)])+')');
  await b.close();

  // a player
  const seedNew=S=>{const tp=JSON.parse(JSON.stringify(trip));tp.k='abc';tp.log=OLD.map(e=>{const x=Object.assign({},e);delete x.enc;delete x.sp;delete x.ev;delete x.riv;return x;});
    S['meta/conditions']={date:'2026-07-14',trip:tp};S['gm/road']={trip:{k:'abc',d:{1:{enc:'Wild encounter',sp:['2× Shinx'],ev:'A rockslide blocks the path.'},2:{riv:OLD[1].riv}}}};return S;};
  ({b,p,errs}=await open({admin:false,uid:'u1',tab:'cal',seedFn:seedNew}));
  t=await p.evaluate(()=>document.body.innerText);
  ok(/On the road/.test(t)&&/Day 1/.test(t)&&/Clear/.test(t)&&/2 days left/.test(t),'a player sees the trip’s days, weather and progress');
  ok(!/Wild encounter|Shinx|rockslide|Dawn Ortega|Roll the day/.test(t),'but no encounters, events, sightings or roll button');
  ok(await p.evaluate(()=>!S.roadGm||!S.roadGm.trip),'and their browser never receives the GM’s part');
  ok(errs.length===0,'no page errors for a player');
  await b.close();

  // a player looking at an older trip the GM has not opened yet: still nothing secret on screen
  ({b,p,errs}=await open({admin:false,uid:'u1',tab:'cal',seedFn:seedOld}));
  t=await p.evaluate(()=>document.body.innerText);
  ok(!/Wild encounter|Shinx|rockslide|Dawn Ortega/.test(t),'an older trip’s secrets are hidden on a player’s screen even before the GM moves them');
  ok(errs.length===0,'no page errors');
  await b.close();
  console.log(fails?fails+' FAILED':'ALL PASSED');
})();
