/* GM Dashboard (Update 59): a GM-only page with today, reminders, the day's checklist, a card per PC, the trip, the weekly
   jobs, eggs and a to-do list. */
const {open,ROOT}=require('./lib');
let fails=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fails++;};
const click=(p,a)=>p.evaluate(a=>{const b=document.createElement('button');Object.entries(a).forEach(([k,v])=>b.dataset[k]=v);b.hidden=true;document.body.appendChild(b);b.click();b.remove();},a);
const W=(p,n)=>p.waitForTimeout(n||500);
const get=(p,path)=>p.evaluate(a=>a==='gm/dash'?JSON.parse(JSON.stringify(S.dashGm||{})):a==='meta/conditions'?JSON.parse(JSON.stringify(S.cond||{})):window.__store.get(a),path);
const txt=p=>p.evaluate(()=>document.getElementById('main').innerText);
const seedFn=S=>{
  Object.assign(S['trainers/u1'],{level:6,badges:{coal:true},credits:1200,hp:{cur:18,max:20}});
  Object.assign(S['trainers/u1/pokemon/p1'],{nick:'Fang',hp:{cur:0,max:30},status:'Poisoned',moves:[{name:'Bite',freq:'At-Will',used:0},{name:'Crunch',freq:'1/day',used:1},{name:'Aqua Tail',freq:'3/day',used:2}]});
  Object.assign(S['trainers/u1/pokemon/p2'],{hp:{cur:12,max:30},moves:[{name:'Splash',freq:'At-Will',used:0}]});
  S['gm/loy_p1']={loyalty:4};
  /* 2026-07-11 is a Saturday */
  S['meta/conditions']={date:'2026-07-11',t:'day',x:'clear',s:'summer',m:'full',d:'high',rkb:{seed:12345,n:300,wk:4},
    ev:[{k:'e1',n:'Test Festival',d:'2026-07-12',to:'',y:false,pl:''}],
    trip:{k:'t1',from:'jubilife-city',to:'oreburgh-city',pace:'steady',who:'',steps:[{r:'route-203',a:'jubilife-city',b:'oreburgh-city',n:'',t:3,days:6}],pos:0,into:0,day:0,start:'2026-07-11',log:[],done:false,zone:'road'}};
  return S;};
(async()=>{
  let {b,p,errs}=await open({admin:true,uid:'u1',tab:'dash',seedFn});
  await W(p,3500);
  ok(await p.evaluate(()=>[...document.querySelectorAll('.nv')].some(x=>x.dataset.tab==='dash'&&/GM Dashboard/.test(x.textContent))),'the menu has a GM Dashboard page');
  let t=await txt(p);
  ok(/Sat 11 July 2026/.test(t)&&/Day · Clear · Summer · Full moon · High tide/.test(t)&&/On the road to Oreburgh City/.test(t),'the top shows today: the date, conditions and the trip');
  ok(/Tomorrow: Test Festival/.test(t)&&/Fang has fainted/.test(t)&&/Roll the travel day/.test(t),'Today lists tomorrow’s event, a fainted Pokémon and the travel day');
  ok(!/Run the Gym circuit week/.test(t),'no week job on a Saturday when rankings day is Sunday');
  const dup=await p.evaluate(()=>{const ks=dashToday().map(x=>x.k);return ks.length===new Set(ks).size&&!document.getElementById('dashcheck')&&document.querySelectorAll('#dashtoday li').length===ks.length;});
  ok(dup,'each job appears once, in one Today list (no separate reminders)');
  const grp=await p.evaluate(()=>[...document.querySelectorAll('#dashtop .dashgrp')].map(g=>g.getAttribute('aria-label')).join(','));
  ok(grp==='Time,Party care,Weekly','the top buttons are grouped: '+grp);
  const fold=await p.evaluate(()=>({trip:!!document.querySelector('#dashtrip [data-act="gd_open"]')&&!document.querySelector('.tplog,#main [data-act="cl_journal"]'),road:!document.getElementById('roadbattles')}));
  ok(fold.trip&&fold.road,'the trip and road battles start folded to a summary');
  // the PC card
  const card=await p.evaluate(()=>{const c=[...document.querySelectorAll('.dashpc')].find(x=>/Mira/.test(x.innerText));return c?c.innerText.replace(/\s+/g,' '):'';});
  ok(/LEVEL 6|Level 6/i.test(card)&&/18\/20/.test(card)&&/1,200 P/.test(card)&&/Badges 1/i.test(card)&&/Gym rank #\d+/i.test(card),'Mira’s card: level, HP, credits, badges and Gym rank');
  ok(/Fang/.test(card)&&/0\/30/.test(card)&&/Fainted/.test(card)&&/Poisoned/.test(card)&&/Crunch 1\/1/.test(card)&&/Aqua Tail 2\/3/.test(card)&&await p.evaluate(()=>document.querySelector('select[data-gdloy="u1|p1"]').value==='4'),'her Pokémon: HP, fainted, status, each daily move’s uses, loyalty');
  ok(/No daily moves/.test(card),'a Pokémon with only At-Will moves says so');
  // checklist
  // quick edits
  await p.evaluate(()=>{const i=document.querySelector('input[data-gdhp="u1|p2"]');i.value='-5';i.dispatchEvent(new Event('change',{bubbles:true}));});await W(p,400);
  ok(await p.evaluate(()=>S.pokemon.u1.p2.hp.cur)===7,'typing −5 in the HP box takes 5 HP (12 to 7)');
  await p.evaluate(()=>{const i=document.querySelector('input[data-gdhp="u1|p2"]');i.value='+40';i.dispatchEvent(new Event('change',{bubbles:true}));});await W(p,400);
  ok(await p.evaluate(()=>S.pokemon.u1.p2.hp.cur)===30,'+40 heals, but not past max HP');
  await p.evaluate(()=>{const i=document.querySelector('input[data-gdhp="u1|p2"]');i.value='12';i.dispatchEvent(new Event('change',{bubbles:true}));});await W(p,400);
  ok(await p.evaluate(()=>S.pokemon.u1.p2.hp.cur)===12,'a plain number sets HP');
  await click(p,{act:'gd_use',uid:'u1',pid:'p1',i:'2'});await W(p,300);
  ok(await p.evaluate(()=>S.pokemon.u1.p1.moves[2].used)===3,'pressing Aqua Tail spends a use (2 to 3)');
  await click(p,{act:'gd_use',uid:'u1',pid:'p1',i:'2'});await W(p,300);
  ok(await p.evaluate(()=>S.pokemon.u1.p1.moves[2].used)===0,'pressing it once more past its limit resets it');
  await click(p,{act:'gd_use',uid:'u1',pid:'p1',i:'2'});await click(p,{act:'gd_use',uid:'u1',pid:'p1',i:'2'});await W(p,300);
  await p.evaluate(()=>{const s=document.querySelector('select[data-gdloy="u1|p1"]');s.value='2';s.dispatchEvent(new Event('change',{bubbles:true}));});await W(p,400);
  ok(await p.evaluate(()=>S.gmLoy.p1.loyalty)===2,'loyalty changes from the card');
  await p.evaluate(()=>{const s=document.querySelector('select[data-gdloy="u1|p1"]');s.value='4';s.dispatchEvent(new Event('change',{bubbles:true}));});await W(p,300);
  await click(p,{act:'gd_stclr',uid:'u1',pid:'p1'});await W(p,300);
  ok(await p.evaluate(()=>!S.pokemon.u1.p1.status),'the × on a status clears it');
  await p.evaluate(()=>{edit('p','u1/p1','status','Poisoned');});await W(p,200);
  await click(p,{act:'gd_open',v:'mp2'});await W(p,300);
  ok(await p.evaluate(()=>{const li=[...document.querySelectorAll('.dashmons li')].find(x=>/Magikarp/.test(x.innerText));return !!li&&!!li.querySelector('[data-act="slot"]')&&!!li.querySelector('[data-act="gd_mon"]');}),'More opens the Pokémon’s menu: box and its page (evolution when it can evolve)');
  await click(p,{act:'slot',uid:'u1',pid:'p2'});await W(p,400);
  ok(await p.evaluate(()=>S.pokemon.u1.p2.slot==='box'&&/The box \(1\)/.test(document.getElementById('main').innerText)),'Move to the box sends it there, and the card shows The box (1)');
  await click(p,{act:'gd_open',v:'bu1'});await W(p,300);
  ok(await p.evaluate(()=>!!document.querySelector('.dashmons.boxed')&&/Magikarp/.test(document.querySelector('.dashmons.boxed').innerText)),'the box opens under the party with the same controls');
  await click(p,{act:'slot',uid:'u1',pid:'p2'});await W(p,400);
  let list=await p.evaluate(()=>dashToday().filter(x=>x.kind!=='note').map(x=>x.k+':'+(x.on?1:0)).join(','));
  ok(list==='rest:0,gear:0,trip:0,road:0','today’s jobs: rest, gear, the travel day, road trainers ('+list+')');
  await click(p,{act:'gd_rest',v:'all'});await W(p,600);
  ok(await p.evaluate(()=>S.pokemon.u1.p1.moves.every(x=>!x.used))&&(await get(p,'gm/dash')).day.done.rest===1,'Rest everyone refills daily uses and ticks the box');
  await click(p,{act:'gd_tick',k:'gear'});await W(p,300);
  await click(p,{act:'cl_roll'});await W(p,800);
  await p.evaluate(()=>{S.ui.rdb.d6='4';});await click(p,{act:'rdb_roll'});await W(p,800);
  list=await p.evaluate(()=>dashToday().filter(x=>x.kind!=='note').map(x=>x.k+':'+(x.on?1:0)).join(','));
  ok(list.split(',').sort().join(',')==='gear:1,rest:1,road:1,trip:1','rolling the day and rolling for trainers tick themselves ('+list+')');
  ok(await p.evaluate(()=>{const it=[...document.querySelectorAll('#dashtoday li')];return it.length&&it.slice(-4).every(li=>li.classList.contains('on'));}),'done jobs drop to the bottom of the list');
  const roadOpen=await p.evaluate(()=>({busy:dashRoadBusy(),open:!!document.getElementById('roadbattles')}));
  ok(roadOpen.open===roadOpen.busy,'road battles open by themselves while a challenge waits ('+JSON.stringify(roadOpen)+')');
  await click(p,{act:'gd_open',v:'trip'});await W(p,400);
  ok(await p.evaluate(()=>!!document.querySelector('[data-act="cl_journal"]')),'Show the full trip opens the whole trip panel');
  await click(p,{act:'gd_open',v:'trip'});await W(p,300);
  ok(await p.evaluate(()=>!document.querySelector('[data-act="cl_journal"]')),'and folds it again');
  // heal: one trainer
  await click(p,{act:'gd_heal',v:'u1'});await W(p,500);
  ok(await p.evaluate(()=>S.pokemon.u1.p1.hp.cur===30&&!S.pokemon.u1.p1.status),'Pokémon Center heals Mira’s team');
  await click(p,{act:'gd_heal',v:'all'});await W(p,300);
  ok(await p.evaluate(()=>S.ui.confirm==='gd_heal'),'healing everyone asks for a second tap');
  // time
  await click(p,{act:'gd_adv'});await W(p,300);
  const tod=await p.evaluate(()=>S.cond.t);ok(tod==='dusk','Next time of day moves day to dusk ('+tod+')');
  // eggs
  await p.evaluate(()=>{Object.assign(S.ui.gd,{euid:'u1',esp:'Pichu',edays:''});});
  await click(p,{act:'gd_eggadd'});await W(p,500);
  let eg=(await get(p,'gm/dash')).eggs;
  const hr=await p.evaluate(()=>parseInt((pxRec('Pichu')||{}).hr,10)||10);
  ok(eg.length===1&&eg[0].sp==='Pichu'&&eg[0].days===hr&&eg[0].due==='2026-07-'+String(11+hr).padStart(2,'0'),'an egg takes its hatch time from the Pokédex ('+hr+' days)');
  await p.evaluate(()=>{Object.assign(S.ui.gd,{euid:'u1',esp:'Shinx',edays:'1'});});
  await click(p,{act:'gd_eggadd'});await W(p,500);
  // the next day: Sunday, rankings day
  await click(p,{act:'gd_next'});await W(p,900);
  const cd=await get(p,'meta/conditions');
  ok(cd.date==='2026-07-12'&&cd.t==='dawn','Start the next day moves the calendar to Sunday at dawn');
  list=await p.evaluate(()=>dashToday().map(x=>x.k+':'+(x.on?1:0)).join(','));
  ok(/gear:0/.test(list)&&/trip:0/.test(list)&&/road:0/.test(list)&&/wkgym:0/.test(list)&&/egg\w+:0/.test(list)&&/cal:0/.test(list),'the list starts again, with the weekly rankings, the ready egg and today’s event ('+list+')');
  t=await txt(p);
  ok(/Run the Gym circuit week/.test(t)&&/Sunday is rankings day/.test(t)&&/Shinx egg is ready to hatch/.test(t)&&/Today on the calendar/.test(t)&&/Test Festival/.test(t),'Today shows rankings day, the egg and today’s event');
  ok(/Pichu · Mira · \d+ days left/.test(t.replace(/\s+/g,' ')),'the other egg counts down with the calendar');
  const n0=await p.evaluate(()=>monsOf('u1').length);
  const eggK=await p.evaluate(()=>S.dashGm.eggs.find(e=>e.sp==='Shinx').k);
  await click(p,{act:'gd_hatch',k:eggK});await W(p,1500);
  ok(await p.evaluate(n=>monsOf('u1').length===n+1&&monsOf('u1').some(m=>m.species==='Shinx'&&/Hatched from an egg/.test(m.caught||'')),n0)&&(await get(p,'gm/dash')).eggs.length===1,'Hatch gives Mira the Shinx and removes the egg');
  // the week
  await click(p,{act:'gd_week',v:'gym'});await W(p,1500);
  ok((await get(p,'meta/conditions')).rkb.wk===5&&(await get(p,'gm/dash')).wk.gym==='2026-07-12','Run the week from the dashboard runs the Gym circuit week and notes the date');
  ok(await p.evaluate(()=>!dashWeekDue('gym')&&dashToday().find(x=>x.k==='wkgym').on),'the week job ticks itself');
  const hd=await p.evaluate(()=>rkWith('gym',()=>rkHeads().filter(x=>!x.pub).length));
  if(hd){await click(p,{act:'gd_hpub',v:'gym'});await W(p,600);}
  ok(await p.evaluate(()=>rkWith('gym',()=>rkHeads().filter(x=>!x.pub).length))===0,'Publish headlines publishes the drafts ('+hd+')');
  // a missed week shows as overdue
  await p.evaluate(()=>{clSetDate('2026-07-21',{dawn:true});render();});await W(p,600);
  ok(await p.evaluate(()=>dashWeekDue('gym'))==='late'&&/Overdue: last run/.test(await txt(p)),'a rankings day that passed without a week shows as overdue');
  // weekday picker
  await p.evaluate(()=>{const s=document.querySelector('select[data-gdwd]');s.value='2';s.dispatchEvent(new Event('change',{bubbles:true}));});await W(p,500);
  ok((await get(p,'gm/dash')).wd===2&&await p.evaluate(()=>dashWeekDue('con'))==='today','rankings day can be changed (Tuesday the 21st: due today)');
  // to-do
  await p.evaluate(()=>{S.ui.gd.todo='Pay the agency booking';});await click(p,{act:'gd_todoadd'});await W(p,400);
  let td=await p.evaluate(()=>S.dashGm.todo||[]);
  ok(td.length===1&&td[0].t==='Pay the agency booking'&&!td[0].done,'a to-do item is added');
  await click(p,{act:'gd_todo',k:td[0].k});await W(p,300);await click(p,{act:'gd_todoclr'});await W(p,400);
  ok(await p.evaluate(()=>S.dashGm.todo.length)===0,'ticked and cleared');
  ok(await p.evaluate(()=>{const n=[...document.querySelectorAll('.nv')].find(x=>x.dataset.tab==='dash');return /\d/.test(n.textContent);}),'the menu shows how many reminders are waiting');
  await p.evaluate(()=>window.scrollTo(0,0));await p.screenshot({path:ROOT+'/tests/out/dash.png',fullPage:true});
  ok(errs.length===0,'no page errors ('+errs.slice(0,3).join(' | ')+')');
  await b.close();

  // players
  ({b,p,errs}=await open({admin:false,uid:'u1',tab:'dash',seedFn:S=>{seedFn(S);S['gm/dash']={eggs:[{k:'x',uid:'u1',sp:'Togepi',due:'2026-07-20',days:9}],todo:[{k:'y',t:'secret',done:false}]};return S;}}));
  await W(p,800);
  ok(await p.evaluate(()=>![...document.querySelectorAll('.nv,.at')].some(x=>x.dataset.tab==='dash')&&!document.getElementById('dashtop')&&!/Togepi|secret/.test(document.body.innerText)),'a player has no GM Dashboard: not in the menu, not drawn, even if the page is asked for');
  ok(await p.evaluate(()=>!S.dashGm||!Object.keys(S.dashGm).length),'and never receives its data');
  ok(errs.length===0,'no page errors for a player');
  await b.close();

  // phone
  ({b,p,errs}=await open({admin:true,uid:'u1',tab:'dash',seedFn,w:390,h:844}));
  await W(p,3000);
  const ov=await p.evaluate(()=>({sw:document.documentElement.scrollWidth,vw:window.innerWidth,wide:[...document.querySelectorAll('#main *')].filter(e=>e.getBoundingClientRect().right>window.innerWidth+1&&!e.closest('.rbar')).length}));
  ok(ov.sw<=ov.vw+1&&ov.wide===0,'at phone width nothing runs off the side ('+JSON.stringify(ov)+')');
  await p.screenshot({path:ROOT+'/tests/out/dash-phone.png',fullPage:true});
  ok(errs.length===0,'no page errors at phone width');
  await b.close();
  console.log(fails?fails+' FAILED':'ALL PASSED');
})();
