/* NPC coordinators in contests (Update 68): contest stats on an NPC's Pokémon (the sheet, packs), picking which of an NPC's
   Pokémon enter a contest, their stats at setup (saved to the sheet when the contest opens, kept in the GM's own copy),
   the check bonus from the Quick NPC rank, NPC stats in appeals, the Visual stage and the stat goal, and saved teams marked
   in ribbons for a coordinator on the Contest rankings. With PACKS set, the contest coordinators pack is imported too. */
const {open,data}=require('./lib');const fs=require('fs');const path=require('path');
let fails=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fails++;};
const click=(p,a)=>p.evaluate(a=>{const b=document.createElement('button');Object.entries(a).forEach(([k,v])=>b.dataset[k]=v);b.hidden=true;document.body.appendChild(b);b.click();b.remove();},a);
const W=(p,n)=>p.waitForTimeout(n||350);
const phb=data.moves.filter(m=>m.ph).map(m=>m.n);
/* the seeded contest list: move i is [Cool, Beauty, Cute, Clever, Tough][i%5] */
const nmon=(id,sp,ty,list,cs)=>Object.assign({id,sp,ty:[ty,''],hp:{cur:30,max:30},base:{atk:5,def:5,spa:5,spd:5,spe:6},mv:list.map(i=>({name:phb[i],type:ty})),ps:[],sh:{}},cs?{cs}:{});
const seedFn=S=>{
  S['trainers/u1/pokemon/p1'].moves=[{name:phb[1],freq:'At-Will',kind:'Physical',range:'Melee',type:'Water',dice:'2d6',text:'',used:0}];
  S['gm/nt_r1']={name:'Celeste Arnaud',cat:'coord',order:1,q:{on:true,r:'4',cls:'performer'},
    team:[nmon('a','Milotic','Water',[1,6,11],{beauty:6,cute:2}),nmon('b','Altaria','Dragon',[16,21],{beauty:4,cool:2}),nmon('c','Roserade','Grass',[26,31])]};
  S['gm/nt_r2']={name:'Jules Ferro',cat:'coord',order:2,team:[nmon('d','Eevee','Normal',[2,7])]};
  S['meta/conditions']={date:'2026-07-14',rkc:{npc:[{k:'x1',n:'Celeste Arnaud',p:250,s:'Beauty',h:'Hearthome',nt:'r1'},{k:'x2',n:'Rory Pendleton',p:160,s:'Cool',h:'Veilstone'}]}};
  return S;};
(async()=>{
  const {b,p,errs}=await open({admin:true,uid:'u1',tab:'contest',seedFn});
  const C=()=>p.evaluate(()=>JSON.parse(JSON.stringify(S.contest||{})));
  const main=()=>p.evaluate(()=>document.getElementById('main').innerText);
  const typeIn=(sel,val)=>p.evaluate(([sel,val])=>{const t=document.querySelector(sel);if(!t)return false;t.value=val;t.dispatchEvent(new Event('input',{bubbles:true}));t.dispatchEvent(new Event('change',{bubbles:true}));return true;},[sel,val]);

  // packs: contest stats in either shape
  const n1=await p.evaluate(()=>JSON.stringify([ntCsNorm({Beauty:5,cute:'2'}),ntCsNorm([1,2,3,4,5]),ntCsNorm({}),ntCsNorm(null)]));
  ok(n1==='[{"cool":0,"beauty":5,"cute":2,"clever":0,"tough":0},{"cool":1,"beauty":2,"cute":3,"clever":4,"tough":5},null,null]','a pack Pokémon’s contest stats: an object in any case, or five numbers');

  // the NPC sheet
  await p.evaluate(()=>{setTab('npc');S.ui.nt.open={r1:true};S.ui.nt.mon={a:true};render();});await W(p,600);
  let t=await main();
  ok(/Contest stats/i.test(t)&&/8 of 10/.test(t),'an NPC Pokémon’s sheet has a Contest stats box (8 of 10)');
  ok(await p.evaluate(()=>/●6 ★2/.test(document.querySelector('.ntmon').innerText)),'the closed Pokémon row shows its contest stats');
  await typeIn('[data-b="gt|r1|team.0.cs.clever"]','2');await W(p);
  ok(await p.evaluate(()=>num(S.gmNt.r1.team[0].cs.clever)===2),'typing a stat saves it on the NPC sheet');

  // setup: pick the Pokémon, the check bonus from the rank, the stats
  await p.evaluate(()=>{setTab('contest');S.ui.ct.v='live';render();});await W(p);
  await click(p,{act:'cs_new'});await W(p);
  await p.evaluate(()=>{const D=S.ui.cs;D.pcs.u1={on:true,m1:'p1',m2:''};D.nnt='r1';render();});await W(p);
  t=await main();
  ok(/An NPC sheet brings the Pokémon you pick/.test(t)&&await p.evaluate(()=>!!document.querySelector('select[data-u="cs.nm1"]')),'the add form offers the NPC’s Pokémon');
  await p.evaluate(()=>{S.ui.cs.nm1='b';});
  await click(p,{act:'cs_npcadd'});await W(p,600);
  let D=await p.evaluate(()=>JSON.parse(JSON.stringify(S.ui.cs)));
  let n=D.npcs[0];
  ok(n&&n.mons.length===1&&n.mons[0].mid==='b'&&n.mons[0].name==='Altaria'&&n.mons[0].cs.beauty===4&&n.mons[0].cs.cool===2,'the picked Pokémon enters with its moves and contest stats (Altaria, ●4 ◆2)');
  ok(n.cb===5,'an Ace Quick NPC’s check bonus starts at +5');
  await p.evaluate(()=>{S.ui.cs.nnt='r2';});await click(p,{act:'cs_npcadd'});await W(p,600);
  D=await p.evaluate(()=>JSON.parse(JSON.stringify(S.ui.cs)));
  ok(D.npcs[1]&&D.npcs[1].cb===3&&D.npcs[1].mons[0].mid==='d','an NPC who is not a Quick NPC starts at +3');
  // swap the Pokémon in the row, then change a stat
  t=await main();
  ok(/NPC sheet · Ace/.test(t),'the row names the NPC’s rank');
  await typeIn('select[data-csx="nmon"][data-i="0"][data-m="0"]','a');await W(p);
  D=await p.evaluate(()=>JSON.parse(JSON.stringify(S.ui.cs)));
  ok(D.npcs[0].mons[0].mid==='a'&&D.npcs[0].mons[0].name==='Milotic'&&D.npcs[0].mons[0].cs.beauty===6&&D.npcs[0].mons[0].cs.clever===2,'swapping the Pokémon in the row brings Milotic and its stats');
  await typeIn('input[data-csx="ncs"][data-i="0"][data-m="0"][data-t="beauty"]','7');await W(p);
  ok(await p.evaluate(()=>S.ui.cs.npcs[0].mons[0].cs.beauty===7&&num(S.gmNt.r1.team[0].cs.beauty)===6),'a stat changed at setup waits for the contest to open');
  await click(p,{act:'cs_open'});await W(p,700);
  let c=await C();
  const ne=c.eord.find(e=>c.ents[e].nt==='r1');
  ok(ne&&!JSON.stringify(c.ents[ne]).includes('"cs"'),'the table’s copy of the contest has no NPC contest stats');
  ok(await p.evaluate(e=>{const x=(S.contestGm.ncs||{})[e];return !!x&&x[0].beauty===7;},ne),'the GM’s own copy has them');
  ok(await p.evaluate(()=>num(S.gmNt.r1.team[0].cs.beauty)===7),'opening the contest saves the changed stat on Celeste’s sheet');

  // appeals: NPCs spend their stats
  await click(p,{act:'cs_start'});await W(p);
  const w=await p.evaluate(([e,n])=>{const W=csWork(S.contest,e,{j:0,m0:n,st:'3'});return {type:W.type,left:W.stLeft,stat:W.stat};},[ne,phb[1]]);
  ok(w.type==='Beauty'&&w.left===7&&w.stat===3,'an NPC’s appeal can spend its Beauty stat (7 left, spends 3)');
  await p.evaluate(([e,n])=>{edit('cs','contest','cur',e);S.ui.csa={e,j:'0',m0:n,m1:'',tf:'0',any:'',st:'3',real:false,sum:''};render();},[ne,phb[1]]);
  t=await main();
  ok(/Spend Beauty stat \(7 left\)/.test(t),'the appeal form offers the NPC’s stat');
  await click(p,{act:'cs_go',e:ne});await W(p);
  c=await C();
  ok(Number((c.ents[ne].spent||{}).Beauty)===3&&await p.evaluate(e=>csStatLeft(S.contest.ents[e],'Beauty',e)===4,ne),'the points are spent: 4 left');
  // the Visual stage and the stat goal
  ok(await p.evaluate(e=>csBestStat(S.contest.ents[e],'Beauty',e)===7,ne),'the Visual stage adds the NPC’s contest stat');
  ok(await p.evaluate(e=>{const A=csScores(S.contest,Object.assign({},S.contestGm,{goals:[[{k:'stat',t:'Beauty'}],[{k:'hp'}],[{k:'hp'}]]}));return A.J[0].goals[0].sc[e]===7;},ne),'“Highest Beauty contest stat” counts the NPC');

  // saved teams in ribbons for a coordinator on the Contest rankings
  await p.evaluate(()=>{ntSetStages('r1',[{gain:2,label:'After 2 more ribbons',team:[]}]);setTab('npc');S.ui.nt.open={r1:true};S.ui.nt.ed={r1:true};render();});await W(p,600);
  ok(await p.evaluate(()=>ntGrowBoard('r1')==='con'&&ntGrowBoard('r2')==='con'),'a coordinator’s saved teams are marked on the Contest rankings');
  const html=await p.evaluate(()=>ntGrowPanel('r1',S.gmNt.r1).s||String(ntGrowPanel('r1',S.gmNt.r1)));
  ok(/ribbons?<\/b>/.test(html)&&/At ribbons/.test(html)&&!/badges?<\/b>/.test(html),'Team growth counts ribbons, not badges');

  // the coordinators pack
  const DIR=process.env.PACKS,F=DIR&&path.join(DIR,'sinnoh-contest-rivals.json');
  if(F&&fs.existsSync(F)){
    const txt=fs.readFileSync(F,'utf8'),pk=JSON.parse(txt);
    ok(pk.npcs.length===30&&pk.npcs.every(r=>r.board==='con'&&r.cat==='coord'&&r.q&&r.q.cls==='performer'&&r.team.every(m=>m.cs&&m.mv.length===4)),'the pack: 30 coordinators on the Contest board, Quick NPC Performers, every Pokémon with four moves and contest stats');
    await p.evaluate(t=>ntImportPack({text:async()=>t}),txt);await W(p,3000);
    const N=await p.evaluate(()=>{const o={};Object.keys(S.gmNt).forEach(id=>{const x=S.gmNt[id];o[x.name]={id,n:ntTeam(x).length,cs:ntTeam(x).map(m=>ctStatTotal(ctStatsOf(m))),q:x.q||null,st:(x.stages||[]).length,cat:x.cat};});return o;});
    ok(Object.keys(N).length===30,'importing adds the 28 coordinators not already here ('+Object.keys(N).length+' NPCs now)');
    ok(N['Valentin Roux']&&N['Valentin Roux'].q.r==='4'&&N['Valentin Roux'].cs.every(x=>x>=9)&&N['Valentin Roux'].n===5,'Valentin Roux: an Ace with five Pokémon, each with contest stats');
    ok(N['Celeste Arnaud'].cs[2]>0,'Celeste, already here, has contest stats filled in for her Roserade, which had none');
    const rk=await p.evaluate(()=>{const L=(S.cond.rkc&&S.cond.rkc.npc)||[];return {n:L.length,cel:L.filter(x=>x.n==='Celeste Arnaud').length,link:L.filter(x=>x.nt).length};});
    ok(rk.n===29&&rk.cel===1&&rk.link===29,'the Contest rankings gain 27 new coordinators and link Rory, Celeste once, each linked to a sheet; Jules Ferro, an NPC already here and off the board, stays off ('+JSON.stringify(rk)+')');
    const st=await p.evaluate(id=>{const s=ntStages(S.gmNt[id]);return {n:s.length,b:ntGrowBoard(id)};},N['Rory Pendleton'].id);
    ok(st.n===2&&st.b==='con','Rory Pendleton has a later team, marked in ribbons');
    ok(await p.evaluate(id=>{const L=S.cond.rkc.npc.filter(x=>x.n==='Rory Pendleton');return L.length===1&&L[0].k==='x2'&&L[0].nt===id&&L[0].p===160;},N['Rory Pendleton'].id),'Rory, a sample rival on the board, links to his new sheet and keeps his points');
  }else console.log('SKIP the pack part: set PACKS to the folder with sinnoh-contest-rivals.json');
  ok(errs.length===0,'no page errors ('+errs.slice(0,3).join(' | ')+')');
  await b.close();
  console.log(fails?fails+' FAILED':'ALL PASSED');
  process.exit(fails?1:0);
})();
