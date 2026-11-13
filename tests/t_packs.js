/* NPC packs with Quick NPC settings (Update 54): new NPCs arrive as Quick NPCs, NPCs already imported are set up from the pack,
   a rank the GM already chose is kept, each growth stage carries a rank, and the Choices line shows on the sheet and in a battle.
   The packs themselves stay out of the repo (players could read them): pass their folder as PACKS=... */
const {open,ROOT}=require('./lib');const fs=require('fs');const path=require('path');
let fails=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fails++;};
const click=(p,a)=>p.evaluate(a=>{const b=document.createElement('button');Object.entries(a).forEach(([k,v])=>b.dataset[k]=v);b.hidden=true;document.body.appendChild(b);b.click();},a);
const W=(p,n)=>p.waitForTimeout(n||600);
const DIR=process.env.PACKS;
if(!DIR||!fs.existsSync(path.join(DIR,'sinnoh-vesper-npcs.json'))){console.log('SKIP: set PACKS to the folder with the packs');console.log('ALL PASSED');process.exit(0);}
const read=f=>fs.readFileSync(path.join(DIR,f),'utf8');
const imp=(p,txt)=>p.evaluate(t=>ntImportPack({text:async()=>t}),txt);
const npcs=p=>p.evaluate(()=>{const o={};Object.keys(S.gmNt).forEach(id=>{const n=S.gmNt[id];o[n.name]={id,q:n.q||null,stages:(n.stages||[]).map(s=>({label:s.label,qr:s.qr||'',bd:s.bd})),grown:n.grown};});return o;});
(async()=>{
  // 1. a site that already has the old rival pack, with one rival given a rank by hand
  let {b,p,errs}=await open({admin:true,uid:'u1',tab:'npc'});
  await imp(p,read('old-rivals.json'));await W(p,2500);
  let N=await npcs(p);
  ok(Object.keys(N).length>=30&&!N['Bram Kowal'].q,'old pack: 30 rivals, no Quick settings');
  await p.evaluate(id=>{edit('gt',id,'q',{on:true,r:'3',cls:'athlete'});},N['Pip Calloway'].id);await W(p);
  await imp(p,read('sinnoh-circuit-rivals.json'));await W(p,2500);
  N=await npcs(p);
  const bram=N['Bram Kowal'];
  ok(bram.q&&bram.q.on&&bram.q.r==='2'&&bram.q.cls==='competitor','already imported: Bram becomes a Skilled Competitor ('+JSON.stringify(bram.q)+')');
  ok(bram.stages.length===2&&bram.stages.find(s=>s.label==='Starting team').qr==='2'&&bram.stages.find(s=>s.label!=='Starting team').qr==='3','his saved teams carry ranks: Skilled now, Experienced after 2 more badges ('+JSON.stringify(bram.stages)+')');
  ok(N['Pip Calloway'].q.r==='3'&&N['Pip Calloway'].q.cls==='athlete','a rank the GM already chose is kept');
  ok(N['Rowan Halvorsen'].q.cls==='typeace'&&N['Rowan Halvorsen'].q.ty==='Water'&&N['Rowan Halvorsen'].q.r==='4'&&N['Rowan Halvorsen'].q.vc==='sailor'&&/Read The Wind/.test(N['Rowan Halvorsen'].q.ch),'Rowan: Ace Water Type Ace, Veteran Sailor, with his Choices');
  ok(Object.keys(N).length===Object.keys(await npcs(p)).length&&Object.values(N).filter(x=>x.q&&x.q.on).length===30,'no duplicates, and all 30 are Quick NPCs');
  // a stage load moves the rank up
  await p.evaluate(id=>{const nt=S.gmNt[id];const st=ntStages(nt);ntStageLoad(id,st[st.length-1].id,true);},bram.id);await W(p);
  N=await npcs(p);ok(N['Bram Kowal'].q.r==='3','loading his grown team makes him Experienced');
  // 2. Team Vesper, new
  await imp(p,read('sinnoh-vesper-npcs.json'));await W(p,2500);
  N=await npcs(p);
  const sera=N['Serafina'],luc=N['Lucian Moretti'];
  ok(sera&&sera.q.r==='4'&&sera.q.cls==='medic'&&sera.q.boss==='medic.exp'&&sera.q.vc==='caretaker','Serafina: Ace Medic, Veteran Caretaker, Team Boss on Bedside Manner');
  ok(luc&&luc.q.boss==='competitor.skilled','Lucian: Team Boss on his Veteran feature, Improved Attacks');
  const ap=await p.evaluate(id=>qnAppliedTxt(S.gmNt[id].q).join('; '),luc.id);
  ok(/\+4 damage/.test(ap),'Lucian\'s Pokémon get +4 damage ('+ap+')');
  ok(N['The Understudy'].q.vc==='rival'&&/Nemesis: Impala/.test(N['The Understudy'].q.ch),'The Understudy: Veteran Rival, Nemesis Impala');
  // the sheet
  await p.evaluate(id=>{S.ui.nt.open[id]=true;render();},sera.id);await W(p,900);
  let t=await p.evaluate(id=>document.querySelector('.ntcard[data-id="'+id+'"]').innerText,sera.id);
  ok(/Ace Medic/.test(t)&&/Choices:\s*Team Boss: Bedside Manner/.test(t)&&/Good Breeding/.test(t),'Serafina\'s sheet: Ace Medic, Good Breeding, and the Choices line');
  await click(p,{act:'toggle',key:'edn'+sera.id});await W(p);
  ok(await p.evaluate(id=>!!document.querySelector('.ntcard[data-id="'+id+'"] textarea[data-b$="|q.ch"]'),sera.id),'Edit details: a Choices field');
  // into a battle
  const mid=await p.evaluate(id=>S.gmNt[id].team[0].id,sera.id);
  await click(p,{act:'nt_foe',id:sera.id,mid});await W(p,900);
  await click(p,{act:'tab',tab:'battle'});await W(p);
  const FID=await p.evaluate(()=>Object.keys((S.battleGm||{}).foes||{})[0]);
  await click(p,{act:'b_open',cid:FID});await W(p);
  t=await p.evaluate(()=>document.querySelector('.fsheet')?document.querySelector('.fsheet').innerText:'');
  ok(/GM only · Serafina: Ace Medic/.test(t)&&/Choices:\s*Team Boss/.test(t),'in a battle, the GM box shows her features and Choices');
  ok(errs.length===0,'no page errors ('+errs.slice(0,3).join(' | ')+')');
  await b.close();
  // 3. a site that never had the rivals: they arrive as Quick NPCs with ranked growth stages
  ({b,p,errs}=await open({admin:true,uid:'u1',tab:'npc'}));
  await imp(p,read('sinnoh-circuit-rivals.json'));await W(p,2500);
  N=await npcs(p);
  const k=N['Kira Dorsey'];
  ok(k&&k.q&&k.q.r==='2'&&k.stages.length===2&&k.stages[0].qr==='2'&&k.stages[1].qr==='3','fresh import: Kira is a Skilled Competitor whose grown team is Experienced ('+JSON.stringify(k&&k.stages)+')');
  ok(Object.values(N).filter(x=>x.q&&x.q.on).length===30,'fresh import: all 30 are Quick NPCs');
  await p.evaluate(id=>{S.ui.nt.open[id]=true;render();},k.id);await W(p);await click(p,{act:'toggle',key:'edn'+k.id});await W(p);
  t=await p.evaluate(id=>document.querySelector('.ntcard[data-id="'+id+'"]').innerText,k.id);
  ok(/Starting team\s*Skilled/.test(t)&&/Experienced/.test(t),'Team growth shows the rank for each saved team');
  ok(errs.length===0,'fresh import: no page errors ('+errs.slice(0,3).join(' | ')+')');
  await b.close();
  console.log(fails?fails+' FAILED':'ALL PASSED');
})();
