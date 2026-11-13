/* Homebrew rules switch (Update 51): HP by Monster die, +1 power, extra daily uses, GM-only display, Alpha reminder, helper stat-drop fix. */
const {open,ROOT}=require('./lib');
let fails=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fails++;};
const click=(p,a)=>p.evaluate(a=>{const b=document.createElement('button');Object.entries(a).forEach(([k,v])=>b.dataset[k]=v);b.hidden=true;document.body.appendChild(b);b.click();},a);
const upd=(p,path,o)=>p.evaluate(([a,b])=>window.__db.doc(a).set(b,{merge:true}),[path,o]);
const get=(p,path)=>p.evaluate(a=>window.__store.get(a),path);
const W=(p,n)=>p.waitForTimeout(n||600);
const mon=(p,id)=>get(p,'trainers/u1/pokemon/'+(id||'p1'));
const seedFn=S=>{
  Object.assign(S['trainers/u1/pokemon/p1'],{nick:'Ember',species:'Houndoom',die:'d10',hp:{cur:20,max:40},hpx:1,base:{atk:9,def:5,spa:11,spd:8,spe:10},status:'',
    moves:[{name:'Crunch',freq:'3/day',kind:'Physical',range:'Melee',type:'Dark',dice:'3d8',text:'',used:0},{name:'Bite',freq:'At-Will',kind:'Physical',range:'Melee',type:'Dark',dice:'2d6',text:'',used:0},{name:'Flare Blitz',freq:'1/day',kind:'Physical',range:'Melee',type:'Fire',dice:'4dM',text:'',used:0}]});
  S['trainers/u1/pokemon/p2']=Object.assign({},S['trainers/u1/pokemon/p1'],{nick:'Pup',species:'Houndour',die:'d6',hp:{cur:36,max:36},hpx:1,
    moves:[{name:'Smog',freq:'3/day',kind:'Special',range:'Ranged',type:'Poison',dice:'2d6',text:'',used:0}]});
  S['trainers/u1/pokemon/p3']=Object.assign({},S['trainers/u1/pokemon/p1'],{nick:'Shell',species:'Shelgon',die:'d8',hp:{cur:44,max:44},hpx:1,
    moves:[{name:'Dragon Breath',freq:'At-Will',kind:'Special',range:'Ranged',type:'Dragon',dice:'3d6',text:'',used:0}]});
  return S;};
(async()=>{
  let {b,p,errs}=await open({admin:true,uid:'u1',tab:'gm',seedFn});
  const desk=()=>p.evaluate(()=>{const s=[...document.querySelectorAll('section.panel')].find(x=>/Rules in use/.test(x.innerText));return s?s.innerText:'';});
  let t=await desk();
  ok(/Rules as written/.test(t)&&/Homebrew/.test(t)&&!/HP multiplier for every Pokémon/.test(t),'GM Desk: the switch is there and the old multiplier setting is gone');
  ok((await mon(p)).hp.max===40,'before: HP as written');
  await click(p,{act:'hpx_hb',v:'1'});await W(p,900);
  ok((await get(p,'meta/table')||{}).hb===true,'switch on: saved');
  let m=await mon(p);
  ok(m.hp.max===60&&m.hp.cur===30&&m.hpx===1.5,'d10 Pokémon: 40 → 60 max, 20 → 30 current, marked ×1.5 ('+JSON.stringify(m.hp)+')');
  m=await mon(p,'p3');ok(m.hp.max===55&&m.hp.cur===55,'d8 Pokémon: 44 → 55 ('+JSON.stringify(m.hp)+')');
  m=await mon(p,'p2');ok(m.hp.max===36&&m.hp.cur===36,'d6 Pokémon unchanged');
  await click(p,{act:'hpx_rules'});await W(p,300);
  t=await desk();ok(/Two commands a round/.test(t)&&/Prey flees/.test(t)&&/Alphas act twice/.test(t)&&/×1\.25/.test(t),'GM rules page lists the house rules');
  // the GM sees what changed on a sheet
  await click(p,{act:'tab',tab:'pokemon'});await W(p);await click(p,{act:'toggle',key:'pu1/p1'});await W(p);
  t=await p.evaluate(()=>document.querySelector('article.mon.open').innerText);
  ok(/Homebrew: HP ×1\.5, \+1 power, 4\/day and 2\/day uses/.test(t),'GM view: the sheet notes what homebrew gives');
  ok(/4\/day/.test(t)&&/2\/day/.test(t)&&/4d8/.test(t)&&/5dM/.test(t)&&/At-Will/.test(t)&&/3d6/.test(t),'GM view: Crunch shows 4/day and 4d8, Flare Blitz 2/day and 5dM, Bite 3d6');
  ok(await p.evaluate(()=>document.querySelectorAll('article.mon.open .pip').length)===6,'use dots: 4 for Crunch and 2 for Flare Blitz');
  // rolling uses the extra die and the extra use
  await click(p,{act:'b_mopen',uid:'u1',pid:'p1',i:'0'});await W(p,400);
  for(let i=0;i<4;i++){await click(p,{act:'b_mroll',uid:'u1',pid:'p1',i:'0'});await W(p,500);}
  m=await mon(p);
  const rolls=((await get(p,'trainers/u1'))||{}).rolls||[];
  const cr=rolls.filter(r=>r.label==='Crunch');
  ok(m.moves[0].used===4&&cr.length===4,'Crunch can be rolled four times ('+m.moves[0].used+' used, '+cr.length+' rolls)');
  await click(p,{act:'b_mroll',uid:'u1',pid:'p1',i:'0'});await W(p,500);
  ok((((await get(p,'trainers/u1'))||{}).rolls||[]).filter(r=>r.label==='Crunch').length===4,'a fifth roll is refused');
  const dmd=await p.evaluate(()=>(S.rolls.find(r=>r.label==='Crunch')||{}).dmd||'');
  ok(/4d8|\b4 ?×|\(\d+(, ?\d+){3}\)/.test(dmd)||/4d8/.test(JSON.stringify(await p.evaluate(()=>S.rolls[0]))),'the damage roll uses 4d8 ('+dmd.slice(0,80)+')');
  ok(m.moves[0].freq==='3/day'&&m.moves[0].dice==='3d8','the saved move is unchanged');
  // Pokédex entry
  const dx=await p.evaluate(()=>{const r={n:'Salamence',ty:['Dragon','Flying'],hp:56,at:14,df:8,sa:11,sd:8,sp:10,dm:'1d12',mv:[{n:'Dragon Claw',f:'3/day',k:'Physical',t:'Dragon',d:'3d8',r:'Melee'}]};const el=document.createElement('div');el.innerHTML=dxRecView(r,false).s;return el.innerText;});
  ok(/HP\s*84/.test(dx)&&/book 56/.test(dx)&&/4\/day/.test(dx)&&/4d8/.test(dx),'Pokédex (GM): HP 84 with "book 56", Dragon Claw 4/day and 4d8');
  // a foe: alpha reminder and the helper fix
  await click(p,{act:'tab',tab:'battle'});await W(p);
  await p.fill('input[data-u="bt.foeSp"]','Houndour');await p.dispatchEvent('input[data-u="bt.foeSp"]','input');await click(p,{act:'b_addfoe'});await W(p,1500);
  const FID=Object.keys(((await get(p,'gm/battle'))||{}).foes)[0];
  await click(p,{act:'b_kind',cid:FID,k:'alpha'});await W(p);
  ok(await p.evaluate(()=>/Acts twice/.test(document.querySelector('.bord')?document.querySelector('.bord').innerText:document.body.innerText)),'Alpha in the turn order: "Acts twice" (GM, homebrew on)');
  await click(p,{act:'b_addally',uid:'u1',pid:'p2'});await W(p);
  await upd(p,'trainers/u1/pokemon/p2',{status:'Burned',stages:{atk:-1,def:0,spa:0,spd:0,spe:0}});await W(p);
  await click(p,{act:'b_init'});await W(p,900);
  const bt=await p.evaluate(()=>{let o=null;window.__store.forEach((v,k)=>{if(v&&v.order&&v.c&&'round' in v)o=v;});return o;});
  const AID=Object.keys(bt.c).find(k=>bt.c[k].s==='a');
  const items=await p.evaluate(a=>auTurnItems(a).map(x=>x.txt),AID);
  ok(!items.some(x=>/Attack ▼ at the start/.test(x))&&items.some(x=>/Burned: loses 1d6/.test(x)),'helper: a Burned Pokémon already at Attack ▼ is not offered another drop');
  await upd(p,'trainers/u1/pokemon/p2',{stages:{atk:0,def:0,spa:0,spd:0,spe:0}});await W(p);
  ok((await p.evaluate(a=>auTurnItems(a).map(x=>x.txt),AID)).some(x=>/Attack ▼ at the start/.test(x)),'helper: without the ▼ it is offered once');
  await p.screenshot({path:ROOT+'/tests/out/homebrew_gm.png',fullPage:false});
  ok(errs.length===0,'GM: no page errors ('+errs.slice(0,3).join(' | ')+')');
  const snap=await p.evaluate(()=>{const o={};window.__store.forEach((v,k)=>o[k]=v);return o;});
  await b.close();
  // a player sees the numbers but no label, no switch and no "book" HP
  ({b,p,errs}=await open({admin:false,uid:'u1',tab:'pokemon',seedFn:S=>{Object.keys(snap).forEach(k=>{S[k]=snap[k];});return S;}}));
  await click(p,{act:'toggle',key:'pu1/p1'});await W(p);
  t=await p.evaluate(()=>document.body.innerText);
  ok(/60/.test(t)&&/4\/day/.test(t)&&/4d8/.test(t),'player: sees HP 60, 4/day and 4d8');
  {const mm=t.match(/.{0,60}(Homebrew|homebrew|Rules in use|book \d).{0,60}/);ok(!mm,'player: nothing says homebrew'+(mm?' ('+mm[0]+')':''));}
  const dx2=await p.evaluate(()=>{const r={n:'Salamence',ty:['Dragon','Flying'],hp:56,at:14,df:8,sa:11,sd:8,sp:10,dm:'1d12',mv:[{n:'Dragon Claw',f:'3/day',k:'Physical',t:'Dragon',d:'3d8',r:'Melee'}]};const el=document.createElement('div');el.innerHTML=dxRecView(r,false).s;return el.innerText;});
  ok(/HP\s*84/.test(dx2)&&!/book/.test(dx2)&&/4\/day/.test(dx2),'player Pokédex: HP 84 and 4/day, with no "book" number');
  ok(errs.length===0,'player: no page errors ('+errs.slice(0,3).join(' | ')+')');
  await b.close();
  // switching back undoes it
  ({b,p,errs}=await open({admin:true,uid:'u1',tab:'gm',seedFn:S=>{Object.keys(snap).forEach(k=>{S[k]=snap[k];});return S;}}));
  await click(p,{act:'hpx_hb',v:'0'});await W(p,900);
  m=await mon(p);ok(m.hp.max===40&&m.hpx===1,'switch off: back to 40 max ('+JSON.stringify(m.hp)+')');
  m=await mon(p,'p3');ok(m.hp.max===44,'switch off: d8 back to 44');
  const fo=(await get(p,'gm/battle')).foes[FID];
  const amax=snap['gm/battle'].foes[FID].hp.max;
  ok(fo&&amax>0&&fo.hp.max===amax,'a foe with no Monster die keeps its alpha HP ('+amax+' → '+(fo&&fo.hp.max)+')');
  ok(errs.length===0,'GM again: no page errors ('+errs.slice(0,3).join(' | ')+')');
  await b.close();console.log(fails?fails+' FAILED':'ALL PASSED');
})();
