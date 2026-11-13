/* Quick NPCs (Update 52): Quick NPC sheets, features applied in battle, per-combat uses, squads, wild ranks, swarms, capture. */
const {open,ROOT}=require('./lib');
let fails=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fails++;};
const click=(p,a)=>p.evaluate(a=>{const b=document.createElement('button');Object.entries(a).forEach(([k,v])=>b.dataset[k]=v);b.hidden=true;document.body.appendChild(b);b.click();},a);
const upd=(p,path,o)=>p.evaluate(([a,b])=>window.__db.doc(a).set(b,{merge:true}),[path,o]);
const get=(p,path)=>p.evaluate(a=>window.__store.get(a),path);
const W=(p,n)=>p.waitForTimeout(n||600);
const foes=async p=>((await get(p,'gm/battle'))||{}).foes||{};
(async()=>{
  let {b,p,errs}=await open({admin:true,uid:'u1',tab:'npc'});
  await click(p,{act:'nt_new'});await W(p,900);
  const nid=await p.evaluate(()=>document.querySelector('.ntcard').dataset.id);
  // the Full / Quick switch is in Edit details
  ok(await p.evaluate(()=>/Quick NPC/.test(document.querySelector('.ntbody').innerText)),'new NPC: the Full / Quick choice is shown');
  await click(p,{act:'nt_qon',id:nid,v:'1'});await W(p);
  ok(((await get(p,'gm/nt_'+nid))||{}).q.on===true,'Quick NPC: saved');
  ok(await p.evaluate(()=>!/Trainer sheet/.test(document.querySelector('.ntbody').innerText)&&/Rank/.test(document.querySelector('.ntbody').innerText)),'Quick mode hides the full trainer sheet and shows rank and class');
  await upd(p,'gm/nt_'+nid,{name:'Boss Rhea',q:{on:true,r:'4',cls:'competitor',boss:'competitor.ace',vc:'thug',vt:'skilled',sq:0},
    team:[{id:'m1',nick:'',sp:'Houndoom',ty:['Dark','Fire'],die:'d10',hp:{cur:48,max:48},base:{atk:9,def:5,spa:11,spd:8,spe:10},bonus:{atk:0,def:0,spa:0,spd:0,spe:0},up:'atk',down:'spa',natureName:'Adamant',
      ps:[{name:'Flash Fire',text:'x'}],mv:[{name:'Crunch',freq:'3/day',kind:'Physical',range:'Melee',type:'Dark',dice:'3d8',text:'',used:0},{name:'Bite',freq:'At-Will',kind:'Physical',range:'Melee',type:'Dark',dice:'2d6',text:'',used:0}],sh:{}}]});
  await W(p);
  await click(p,{act:'toggle',key:'edn'+nid});await W(p);
  let t=await p.evaluate(()=>document.querySelector('.ntbody').innerText);
  ok(/Ace Competitor/.test(t)&&/Improved Attacks/.test(t)&&/Even Better/.test(t)&&/Ace\b/.test(t)&&/Veteran · Thug Skilled/.test(t)&&/Crusher/.test(t),'read view: Ace Competitor with all three features and the Veteran Thug feature');
  ok(/Champion: numbers doubled/.test(t)&&/\+14 damage with all moves/.test(t)&&/3\/day moves become 2 per combat/.test(t),'Champion doubles Even Better: +2 and +12 = +14 damage');
  ok(/Skill check \(d20 \+ 4\)/.test(t),'skill check button rolls d20 + Rank');
  await click(p,{act:'nt_roll',label:'Boss Rhea: skill check',bonus:'4',tal:'3'});await W(p,400);
  ok(await p.evaluate(()=>(S.rolls[0]||{}).label==='Boss Rhea: skill check'),'skill check is rolled and logged');
  // into a battle
  await click(p,{act:'tab',tab:'battle'});await W(p);
  await click(p,{act:'nt_foe',id:nid,mid:'m1'});await W(p,900);
  let fo=await foes(p);const FID=Object.keys(fo)[0];let f=fo[FID];
  ok(f&&f.pc===2&&f.qn&&f.qn.dmg===14&&f.bonus.def===0&&f.up===''&&f.down==='','in battle: 2 per combat, +14 damage, neutral nature ('+JSON.stringify(f&&{pc:f.pc,qn:f.qn,up:f.up})+')');
  await click(p,{act:'b_open',cid:FID});await W(p);
  t=await p.evaluate(()=>document.querySelector('.fsheet').innerText);
  ok(/2\/combat/.test(t)&&/Boss Rhea: Ace Competitor/.test(t)&&/Crusher/.test(t),'foe sheet: Crunch shows 2/combat and the trainer features box is there');
  ok(await p.evaluate(()=>document.querySelectorAll('.fsheet .rdmv .pip').length)===2,'Crunch has two use dots');
  await p.evaluate(()=>{S.ui.bt.tgt='';});
  for(let i=0;i<3;i++){await click(p,{act:'b_fmroll',cid:FID,i:'0'});await W(p,500);}
  fo=await foes(p);f=fo[FID];
  ok(f.mv[0].used===2,'a third roll of Crunch in the same combat is refused ('+f.mv[0].used+' used)');
  const dmd=await p.evaluate(()=>(S.rolls.find(r=>r.label==='Crunch')||{}).dmd||'');
  ok(/\+14/.test(dmd)||/14/.test(dmd),'the damage roll includes the +14 ('+dmd.slice(0,90)+')');
  // feature dots belong to this battle
  await click(p,{act:'b_init'});await W(p,900);
  const bid=await p.evaluate(()=>BT().bid);
  await p.click('.qnbox .pip');await W(p);
  let nt=await get(p,'gm/nt_'+nid);
  ok(nt.q.u&&nt.q.u.b===bid&&nt.q.u.k['thug.skilled']===1,'tapping a feature dot spends Crusher for this battle');
  // squad
  await upd(p,'gm/nt_'+nid,{q:Object.assign({},nt.q,{sq:4})});await W(p);
  await click(p,{act:'b_rm',cid:FID});await W(p);await p.evaluate(c=>btRemove(c),FID);await W(p);
  await click(p,{act:'nt_foe',id:nid,mid:'m1'});await W(p,900);
  fo=await foes(p);const F2=Object.keys(fo).find(k=>fo[k].qn);
  ok(fo[F2].qn.sq===4&&await p.evaluate(()=>/Squad: 2 of 4 command/.test(document.querySelector('.bord').innerText)),'squad of 4: "Squad: 2 of 4 command" in the turn order');
  // wild ranks
  await p.fill('input[data-u="bt.foeSp"]','Rattata');await p.dispatchEvent('input[data-u="bt.foeSp"]','input');await click(p,{act:'b_addfoe'});await W(p,1500);
  fo=await foes(p);const WID=Object.keys(fo).find(k=>!fo[k].qn);
  const base=fo[WID].hp.max;
  await click(p,{act:'b_qrank',cid:WID,r:'exp'});await W(p);
  f=(await foes(p))[WID];
  ok(f.qr&&f.qr.r==='exp'&&f.hp.max===base*2&&f.pc===2,'Experienced wild: HP '+base+' → '+f.hp.max+', 2 per combat');
  await click(p,{act:'b_qwc',cid:WID,v:'bruiser'});await W(p);await click(p,{act:'b_qen',cid:WID,v:'alpha'});await W(p);
  f=(await foes(p))[WID];
  ok(f.qr.wc==='bruiser'&&f.qr.en==='alpha'&&f.hp.max===base*2,'wild class Bruiser and Enhanced Alpha chosen; HP unchanged');
  ok(await p.evaluate(()=>/Experienced Bruiser/.test(document.querySelector('.bord').innerText)&&/Two turns/.test(document.querySelector('.bord').innerText)),'turn order: "Experienced Bruiser" and "Two turns"');
  await click(p,{act:'b_kind',cid:WID,k:'alpha'});await W(p);
  ok(!(await foes(p))[WID].kind,'a ranked foe cannot also be made a GM Guide Alpha');
  const cc=async()=>p.evaluate(c=>{const el=document.createElement('div');el.innerHTML=ccFoeLine(c,foeOf(c)).s;return el.innerText;},WID);
  ok(/not with this ball/.test(await cc()),'catch: blocked at 30 HP or more');
  await p.evaluate(([c,m])=>{edit('gb','battle','foes.'+c+'.hp',{cur:25,max:m});render();},[WID,f.hp.max]);await W(p);
  ok(!/not with this ball/.test(await cc()),'catch: allowed below 30 HP');
  await click(p,{act:'b_qrank',cid:WID,r:'ace'});await W(p);
  f=(await foes(p))[WID];
  ok(f.hp.max===base*2+150&&f.pc===5,'Ace wild: HP '+f.hp.max+' (double plus 150), 5 per combat');
  // +4 to affliction checks
  await p.evaluate(c=>{edit('gb','battle','foes.'+c+'.st','Burned');},WID);await W(p);
  await p.evaluate(c=>{edit('bt','battle','turn',c);},WID);await W(p);
  await p.evaluate(c=>auDo(c,'cure','cure','Burned'),WID);await W(p);
  ok(await p.evaluate(()=>/\+ 4 \(wild rank\)/.test((S.rolls[0]||{}).detail||JSON.stringify(S.rolls[0]))),'affliction check adds +4 for an Ace wild');
  // capture: rank bonuses gone, captured passive noted
  await p.evaluate(()=>{S.ui.bt.giveTo='u1';});
  await click(p,{act:'b_give',cid:WID});await W(p,900);
  const mons=await p.evaluate(()=>{const o=[];window.__store.forEach((v,k)=>{if(/^trainers\/u1\/pokemon\//.test(k)&&v&&/Caught in the wild/.test(v.caught||''))o.push(v);});return o;});
  const got=mons[mons.length-1];
  ok(got&&got.hp.max===base,'caught: back to its written HP ('+(got&&got.hp.max)+')');
  const gl=await p.evaluate(()=>{let o=null;window.__store.forEach((v,k)=>{if(/^gm\/loy_/.test(k))o=v;});return o;});
  ok(gl&&/Thick Hide/.test(gl.note)&&/Ferocity/.test(gl.note),'capture note lists the Captured passives (Bruiser and Alpha)');
  // swarm
  await click(p,{act:'b_swarm'});await W(p,300);
  await p.fill('input[data-u="bt.foeSp"]','Zubat');await p.dispatchEvent('input[data-u="bt.foeSp"]','input');
  await p.fill('input[data-u="bt.foeN"]','6');await p.dispatchEvent('input[data-u="bt.foeN"]','input');
  await click(p,{act:'b_addfoe'});await W(p,1600);
  fo=await foes(p);const sw=Object.values(fo).filter(x=>x.sw);
  ok(sw.length===6&&sw.every(x=>x.qr&&x.qr.r==='swarm'&&x.pc===2),'swarm of 6 added, each a swarm member with 2 per combat');
  ok(sw[0].hp.max===Math.max(1,Math.round(sw[0].qr.h0.max/2)),'swarm member HP halved ('+sw[0].qr.h0.max+' → '+sw[0].hp.max+')');
  ok(await p.evaluate(()=>/Swarm: 2 of 6 act/.test(document.querySelector('.bord').innerText)),'turn order: "Swarm: 2 of 6 act"');
  await p.screenshot({path:ROOT+'/tests/out/quicknpc_battle.png',fullPage:false});
  // homebrew on: the NPC's d10 Houndoom keeps 2 per combat but gets +1 power
  await p.evaluate(()=>{edit('meta','table','hb',true);render();});await W(p);
  await click(p,{act:'b_open',cid:F2});await W(p);
  t=await p.evaluate(c=>{const s=[...document.querySelectorAll('.fsheet')].map(x=>x.innerText).join('\n');return s;},F2);
  ok(/2\/combat/.test(t)&&/4d8/.test(t)&&!/4\/day/.test(t),'homebrew: Crunch is 2/combat and 4d8 for a Quick NPC Pokémon');
  ok(errs.length===0,'GM: no page errors ('+errs.slice(0,3).join(' | ')+')');
  const snap=await p.evaluate(()=>{const o={};window.__store.forEach((v,k)=>o[k]=v);return o;});
  await b.close();
  ({b,p,errs}=await open({admin:false,uid:'u1',tab:'battle',seedFn:S=>{Object.keys(snap).forEach(k=>{if(!/^gm\//.test(k))S[k]=snap[k];});return S;}}));
  t=await p.evaluate(()=>document.body.innerText);
  ok(!/Squad|Swarm|Wild rank|Competitor|Crusher|Bruiser/.test(t),'player: no Quick NPC details on the Battle page');
  ok(errs.length===0,'player: no page errors ('+errs.slice(0,3).join(' | ')+')');
  await b.close();console.log(fails?fails+' FAILED':'ALL PASSED');
})();
