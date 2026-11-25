/* The timeline (Update 74): in-world dates, kinds and trainers, filters, a vertical line by session with Before the
   campaign first and Today last; the GM's hidden events (revealed later); milestones the site recorded become
   suggestions the GM adds, adds hidden, or dismisses. */
const {open}=require('./lib');
let fails=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fails++;};
const click=(p,a)=>p.evaluate(a=>{const b=document.createElement('button');Object.entries(a).forEach(([k,v])=>b.dataset[k]=v);b.hidden=true;document.body.appendChild(b);b.click();b.remove();},a);
const W=(p,n)=>p.waitForTimeout(n||500);
const seedFn=S=>{
  S['meta/conditions']={date:'3000-07-10',start:'3000-06-20',rkc:{log:[{k:'x1',u:'u4',p:10,w:'Placed second · Floaroma Contest',d:'3000-07-05',e:'second'},{k:'x2',u:'u4',p:-5,w:'Out in the first round',d:'3000-07-06',e:'early'}]}};
  S['timeline/t1']={session:1,when:'Early summer',title:'Left Solaceon',body:'The road north.',place:'Solaceon Town',addedBy:'u1',createdAt:1};
  S['timeline/t2']={session:2,date:'3000-06-28',kind:'gym',who:['u1'],title:'Lost to Fantina',body:'Zazu went down first.',place:'Hearthome City',addedBy:'u1',createdAt:3};
  S['timeline/t3']={session:2,date:'3000-06-26',kind:'catch',who:['u2'],title:'Jonas caught a Golett',body:'',place:'Route 209',addedBy:'u2',createdAt:4};
  S['timeline/t4']={session:0,ago:17,kind:'history',title:'Simone loses the Festival final',body:'By one Star Point.',addedBy:'u1',createdAt:2};
  S['awards/a1']={uid:'u1',type:'Gym Badge',title:'Relic Badge',note:'',badge:'relic',ribbon:'',levelUp:false,session:3,by:'u1',createdAt:5};
  Object.assign(S['trainers/u1'],{badges:{relic:true},bdate:{relic:'3000-07-01'}});
  Object.assign(S['trainers/u3'],{badges:{coal:true},bdate:{coal:'3000-06-25'}});
  S['gm/road']={log:[{k:'r1',date:'3000-07-03',foe:'Youngster Joey',fid:'f1',uid:'u2',pname:'Jonas',res:'clean',route:'',at:1},{k:'r2',date:'3000-07-04',foe:'Lass Amy',uid:'u2',res:'no',at:2}]};
  S['gm/dash']={hatched:[{k:'e1',uid:'u3',sp:'Deerling',d:'3000-07-08'}],trips:[{k:'t1',fromN:'Solaceon Town',toN:'Hearthome City',days:3,end:'3000-06-24'}]};
  S['journal/j1']={session:2,title:'The Relic Badge, almost',body:'',place:'',addedBy:'u1',createdAt:3};
  return S;};
(async()=>{
  const {b,p,errs}=await open({admin:true,uid:'u1',tab:'timeline',seedFn});
  await W(p,600);
  const main=()=>p.evaluate(()=>document.getElementById('main').innerText);
  const titles=()=>p.evaluate(()=>[...document.querySelectorAll('#main .tl-ev h3')].map(x=>x.textContent));
  const heads=()=>p.evaluate(()=>[...document.querySelectorAll('#main .tlg h2')].map(x=>x.textContent));
  let t=await main();
  ok((await heads()).join()==='Before the campaign,Session 1,Session 2','sessions in order, with Before the campaign first ('+(await heads()).join(', ')+')');
  ok((await titles()).join('|')==='Simone loses the Festival final|Left Solaceon|Jonas caught a Golett|Lost to Fantina','events by session, then by in-world date');
  ok(/17 years before the campaign/.test(t)&&/Early summer/.test(t)&&/28 June 3000/.test(t),'dates read as years before, a rough time, or the in-world date');
  ok(/Today/.test(t)&&/10 July 3000/.test(t),'a Today marker from the calendar');
  ok(/Journal: The Relic Badge, almost/.test(t),'a session links to its journal entry');
  // milestones
  let L=await p.evaluate(()=>tlSuggest().map(o=>({ms:o.ms,kind:o.kind,title:o.title,date:o.date,session:o.session})));
  const by=k=>L.find(o=>o.ms.indexOf(k)===0);
  ok(L.length===6,'six milestones to add ('+L.map(o=>o.ms).join(', ')+')');
  ok(by('aw:')&&by('aw:').title==='Mira earned the Relic Badge'&&by('aw:').date==='3000-07-01'&&by('aw:').session===3,'an award: Mira earned the Relic Badge, dated from the badge, in its own session');
  ok(by('bd:u3:coal')&&by('bd:u3:coal').kind==='gym','a badge with no award record (Cora’s Coal Badge)');
  ok(by('rk:con:x1')&&!L.some(o=>o.ms==='rk:con:x2'),'a contest placing, and not the minor “out in the first round”');
  ok(by('rd:r1')&&by('rd:r1').title==='Jonas beat Youngster Joey'&&!L.some(o=>o.ms==='rd:r2'),'a road battle won (and not one passed on)');
  ok(by('egg:e1')&&by('trip:t1')&&by('trip:t1').title==='The party reached Hearthome City','an egg hatched and a trip finished');
  ok(by('rd:r1').session===2,'a milestone without a session goes to the session of the latest event dated before it');
  ok(await p.evaluate(()=>tabCount('timeline'))===6,'the Timeline tab shows how many wait');
  t=await main();
  ok(/Milestones to add/.test(t)&&/Add hidden/.test(t)&&/Not now/.test(t),'the GM sees the milestones to add');
  // add one, add one hidden, dismiss one
  const idx=k=>p.evaluate(k=>tlSuggest().findIndex(o=>o.ms===k),k);
  await click(p,{act:'tl_ok',i:String(await idx('rd:r1'))});await W(p);
  ok(await p.evaluate(()=>Object.values(S.timeline).some(e=>e.ms==='rd:r1'&&e.kind==='battle'&&e.date==='3000-07-03'&&e.who[0]==='u2'&&e.session===2)),'Add puts it on the timeline with its kind, date, trainer and session');
  await click(p,{act:'tl_ok',i:String(await idx('trip:t1')),h:'1'});await W(p);
  ok(await p.evaluate(()=>Object.values(S.dashGm.tlh||{}).some(e=>e.ms==='trip:t1')&&!Object.values(S.timeline).some(e=>e.ms==='trip:t1')),'Add hidden keeps it in the GM’s own document');
  await click(p,{act:'tl_no',i:String(await idx('egg:e1'))});await W(p);
  L=await p.evaluate(()=>tlSuggest().map(o=>o.ms));
  ok(L.length===3&&L.indexOf('egg:e1')<0&&L.indexOf('rd:r1')<0&&L.indexOf('trip:t1')<0,'the three are gone from the list, and the dismissed one stays gone');
  // hidden events
  t=await main();
  ok(/The party reached Hearthome City/.test(t)&&/Reveal to the players/.test(t),'the GM sees the hidden event, with Reveal');
  await click(p,{act:'tl_newh'});await W(p);
  const hk=await p.evaluate(()=>Object.keys(S.dashGm.tlh).find(k=>!S.dashGm.tlh[k].ms));
  ok(hk&&await p.evaluate(k=>S.ui.open['tlh'+k]===true&&S.dashGm.tlh[k].date==='3000-07-10',hk),'Add hidden event opens a new hidden event dated today');
  await p.evaluate(k=>{const i=document.querySelector('[data-b="gd|dash|tlh.'+k+'.title"]');i.value='Vesper moves the Cage';i.dispatchEvent(new Event('input',{bubbles:true}));},hk);await W(p,700);
  await click(p,{act:'tl_who',id:hk,h:'1',uid:'u1'});await W(p);
  ok(await p.evaluate(k=>S.dashGm.tlh[k].title==='Vesper moves the Cage'&&S.dashGm.tlh[k].who.join()==='u1',hk),'its fields save to the GM’s document');
  await p.evaluate(k=>{S.ui.open['tlh'+k]=false;render();},hk);
  await click(p,{act:'tl_reveal',id:hk});await W(p);
  ok(await p.evaluate(()=>Object.values(S.timeline).some(e=>e.title==='Vesper moves the Cage'&&e.who.join()==='u1'))&&await p.evaluate(k=>!S.dashGm.tlh[k],hk),'Reveal moves it onto the shared timeline');
  await click(p,{act:'tl_hide',id:'t3'});await W(p);
  ok(await p.evaluate(()=>!S.timeline.t3&&Object.values(S.dashGm.tlh).some(e=>e.title==='Jonas caught a Golett')),'Hide from the players moves a shared event into the GM’s document');
  // filters
  await click(p,{act:'tl_kind',v:'gym'});await W(p);
  ok((await titles()).join()==='Lost to Fantina','the Gym chip shows gym events');
  await p.evaluate(()=>{S.ui.f.tlk='';S.ui.f.tlw='u2';render();});await W(p);
  let tt=await titles();
  ok(tt.indexOf('Jonas beat Youngster Joey')>=0&&tt.indexOf('Left Solaceon')>=0&&tt.indexOf('Lost to Fantina')<0,'Jonas’s story: his events and the whole party’s, not Mira’s ('+tt.join(' | ')+')');
  await p.evaluate(()=>{S.ui.f.tlw='';S.ui.q.tl='star point';render();});await W(p);
  ok((await titles()).join()==='Simone loses the Festival final','search reads what happened');
  await p.evaluate(()=>{S.ui.q.tl='';S.ui.f.tlc=true;render();});await W(p);
  ok(await p.evaluate(()=>document.querySelectorAll('#main .tl-ev.tlc').length>3&&!/Zazu went down first/.test(document.getElementById('main').innerText)),'Titles only hides the text');
  await p.evaluate(()=>{S.ui.f.tlc=false;render();});
  // editing a shared event
  await p.evaluate(()=>{S.ui.open.tlt1=true;render();});await W(p);
  ok(await p.evaluate(()=>!!document.querySelector('input[type="date"][data-b="tl|t1|date"]')&&!!document.querySelector('[data-b="tl|t1|kind"]')),'an event’s Edit has the in-world date and the kind');
  await click(p,{act:'tl_today',id:'t1'});await W(p);
  ok(await p.evaluate(()=>S.timeline.t1.date==='3000-07-10'),'Today sets the calendar’s date');
  // a new event
  await click(p,{act:'newDoc',kind:'tl'});await W(p);
  ok(await p.evaluate(()=>Object.values(S.timeline).some(e=>!e.title&&e.date==='3000-07-10'&&e.kind==='story')),'Add event starts on today’s in-world date');
  // a player
  await p.evaluate(()=>{S.me.admin=false;S.ui.open={};render();});await W(p);
  t=await main();
  ok(!/Milestones to add|Vesper moves|Reveal to the players|Hidden/.test(t.replace('Vesper moves the Cage',''))&&!/Jonas caught a Golett|The party reached Hearthome/.test(t),'a player sees no milestones and no hidden events');
  ok(/Vesper moves the Cage/.test(t),'but does see what the GM revealed');
  ok(errs.length===0,'no page errors ('+errs.slice(0,3).join(' | ')+')');
  await b.close();
  console.log(fails?fails+' FAILED':'ALL PASSED');
  process.exit(fails?1:0);
})();
