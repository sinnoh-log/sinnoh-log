/* Battle helper (Update 50): proposals for hits and statuses, Recharge, the Alpha rider and spending move uses. */
const {open,ROOT}=require('./lib');
let fails=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fails++;};
const click=(p,a)=>p.evaluate(a=>{const b=document.createElement('button');Object.entries(a).forEach(([k,v])=>b.dataset[k]=v);b.hidden=true;document.body.appendChild(b);b.click();},a);
const upd=(p,path,o)=>p.evaluate(([a,b])=>window.__db.doc(a).set(b,{merge:true}),[path,o]);
const get=(p,path)=>p.evaluate(a=>window.__store.get(a),path);
const W=(p,n)=>p.waitForTimeout(n||600);
const mon=p=>get(p,'trainers/u1/pokemon/p1');
const helper=p=>p.evaluate(()=>{const e=document.querySelector('.aup');return e?e.innerText:'';});
const seedFn=S=>{Object.assign(S['trainers/u1/pokemon/p1'],{nick:'Volt',die:'d8',hp:{cur:30,max:30},base:{atk:6,def:4,spa:4,spd:4,spe:6},status:'Burned, Poisoned',
  moves:[{name:'Bite',freq:'At-Will',kind:'Physical',range:'Melee',type:'Dark',dice:'2d6',text:'',used:0},{name:'Crunch',freq:'1/day',kind:'Physical',range:'Melee',type:'Dark',dice:'3d8',text:'',used:0}]});return S;};
(async()=>{
  let {b,p,errs}=await open({admin:true,uid:'u1',tab:'battle',seedFn});
  await click(p,{act:'b_addally',uid:'u1',pid:'p1'});await W(p);
  await p.fill('input[data-u="bt.foeSp"]','Rattata');await p.dispatchEvent('input[data-u="bt.foeSp"]','input');await click(p,{act:'b_addfoe'});await W(p,1500);
  const FID=Object.keys(((await get(p,'gm/battle'))||{}).foes)[0];
  await upd(p,'gm/battle',{foes:{[FID]:{sp:'Rattata',nick:'',ty:['Normal'],sz:'Small',wt:'Light',die:'d6',hp:{cur:40,max:40},base:{atk:3,def:3,spa:3,spd:3,spe:1},st:'',
    mv:[{name:'Tackle',freq:'At-Will',kind:'Physical',range:'Melee',type:'Normal',dice:'2d6',text:'',used:0},{name:'Scratch',freq:'At-Will',kind:'Physical',range:'Melee',type:'Normal',dice:'2d6',text:'',used:0}],ps:[],notes:'',sh:{},stages:{atk:0,def:0,spa:0,spd:0,spe:0},bonus:{atk:0,def:0,spa:0,spd:0,spe:0}}}});
  await click(p,{act:'b_kind',cid:FID,k:'alpha'});await W(p);
  await click(p,{act:'b_init'});await W(p,900);
  const bt=()=>p.evaluate(()=>{let o=null;window.__store.forEach((v,k)=>{if(v&&v.order&&v.c&&'round' in v)o=Object.assign({k},v);});return o;});
  let B=await bt();
  const AID=Object.keys(B.c).find(k=>B.c[k].s==='a');
  ok(B.on&&B.bid>0&&B.turn===AID,'battle on, has an id, and the faster ally acts first');
  // ---- status at the start of the turn
  let t=await helper(p);
  ok(/Burned: Attack ▼/.test(t)&&/Burned: loses 1d6 HP/.test(t)&&/Poisoned: loses 1d10 HP/.test(t)&&/Affliction check/.test(t),'acting ally: Burned and Poisoned effects and a cure check are offered');
  ok((await mon(p)).hp.cur===30&&!((await mon(p)).stages||{}).atk,'nothing has changed before Accept');
  await click(p,{act:'b_au',cid:AID,k:'Burned:stg',a:'stg',x:'atk'});await W(p);
  ok((await mon(p)).stages.atk===-1,'Accept the stage drop: Attack ▼');
  await click(p,{act:'b_au',cid:AID,k:'Burned:hp',a:'hp',x:'Burned'});await W(p);
  const hp1=(await mon(p)).hp.cur;
  ok(hp1<30&&hp1>=24,'Accept burn damage: 1d6 taken ('+hp1+'/30)');
  await click(p,{act:'b_au',cid:AID,k:'Burned:hp',a:'hp',x:'Burned'});await W(p);
  ok((await mon(p)).hp.cur===hp1,'the same effect cannot be accepted twice in a round');
  await click(p,{act:'b_au',cid:AID,k:'Poisoned:hp',a:'skip'});await W(p);
  t=await helper(p);
  ok((await mon(p)).hp.cur===hp1&&!/Poisoned: loses/.test(t)&&!/Burned: loses/.test(t),'Skip leaves HP alone and both cards are gone');
  await click(p,{act:'b_au',cid:AID,k:'cure',a:'cure',x:'Poisoned'});await W(p);
  const st=(await mon(p)).status;
  ok(st==='Burned'||st==='Burned, Poisoned','cure check rolled: status is '+JSON.stringify(st));
  ok(!/Affliction check/.test(await helper(p)),'only one cure check a turn');
  // ---- spending uses
  await click(p,{act:'tab',tab:'pokemon'});await W(p);await click(p,{act:'toggle',key:'pu1/p1'});await W(p);
  await click(p,{act:'b_mopen',uid:'u1',pid:'p1',i:'1'});await W(p,400);
  await p.selectOption('select[data-u="mr.tgt"]',FID).catch(()=>{});await W(p,300);
  await click(p,{act:'b_mroll',uid:'u1',pid:'p1',i:'1'});await W(p);
  ok((await mon(p)).moves[1].used===1,'rolling a 1/day move spends its use');
  await click(p,{act:'b_mroll',uid:'u1',pid:'p1',i:'1'});await W(p);
  const rolls=((await get(p,'trainers/u1'))||{}).rolls||[];
  ok((await mon(p)).moves[1].used===1&&rolls.filter(r=>r.label==='Crunch').length===1,'no uses left: the second roll is refused');
  await click(p,{act:'b_mdmg',uid:'u1',pid:'p1',i:'1'});await W(p);
  ok((((await get(p,'trainers/u1'))||{}).rolls||[]).filter(r=>r.label==='Crunch').length===2,'Damage only still works and spends nothing');
  // ---- hits waiting (GM applies to the foe)
  await click(p,{act:'tab',tab:'battle'});await W(p);
  t=await helper(p);
  const r0=(((await get(p,'trainers/u1'))||{}).rolls||[]).find(r=>r.label==='Crunch'&&r.tgt===FID&&r.hit!==false);
  if(r0){
    ok(/Hits waiting/.test(t)&&/Crunch/.test(t),'a hit on the foe waits in the helper');
    const f0=(await get(p,'gm/battle')).foes[FID].hp.cur;
    await click(p,{act:'b_auhit',src:'u1',id:r0.id,v:'ap'});await W(p);
    const f1=(await get(p,'gm/battle')).foes[FID].hp.cur;
    ok(f1===Math.max(0,f0-r0.dm),'GM applies it: foe HP '+f0+' → '+f1+' (damage '+r0.dm+')');
    await click(p,{act:'b_auhit',src:'u1',id:r0.id,v:'ap'});await W(p);
    ok((await get(p,'gm/battle')).foes[FID].hp.cur===f1,'a hit cannot be applied twice');
  }else console.log('NOTE no Crunch roll with a target that hit; hit checks skipped');
  // ---- foe turn: Alpha rider and Recharge
  await click(p,{act:'b_next'});await W(p);
  B=await bt();ok(B.turn===FID,'next turn: the foe acts');
  await p.evaluate(a=>{S.ui.bt.tgt=a;},AID);
  const foe=async()=>(await get(p,'gm/battle')).foes[FID];
  const iBeam=(await foe()).mv.findIndex(x=>x.name==='Alpha Beam');
  for(const i of [0,1,0]){await click(p,{act:'b_fmroll',cid:FID,i:String(i)});await W(p,400);}await W(p,900);
  ok(JSON.stringify((await foe()).au.nm)===JSON.stringify({tackle:2,scratch:1}),'Normal-type moves are counted for the combat ('+JSON.stringify((await foe()).au.nm)+')');
  await click(p,{act:'b_fmroll',cid:FID,i:String(iBeam)});await W(p,1000);
  const beam=((await bt()).rolls||[]).find(r=>r.label==='Alpha Beam');
  const local=await p.evaluate(()=>S.rolls[0]&&S.rolls[0].dmd);
  ok(!!beam&&/6d12/.test(String(local)),'Alpha Beam after 3 other Normal moves rolls 6d12 ('+local+')');
  ok((await foe()).mv[iBeam].used===1&&(await foe()).au.rc===(await bt()).round,'Alpha Beam spends its use and sets Recharge');
  ok(await p.evaluate(()=>/Must recharge/.test(document.querySelector('.bord').innerText)),'the foe row shows Must recharge');
  // GM applies the beam to the ally through the log button
  if(beam&&beam.hit!==false){
    const h0=(await mon(p)).hp.cur;
    await click(p,{act:'b_apply',src:'gm',id:beam.id});await W(p);
    ok((await mon(p)).hp.cur===Math.max(0,h0-beam.dm),'Apply in the roll log still works ('+h0+' → '+(await mon(p)).hp.cur+')');
  }
  await upd(p,'trainers/u1/pokemon/p1',{hp:{cur:30,max:30},status:''});await W(p);
  await click(p,{act:'b_next'});await W(p);await click(p,{act:'b_next'});await W(p);
  B=await bt();t=await helper(p);
  ok(B.round===2&&B.turn===FID&&/Recharge: .* cannot act this turn/.test(t),'round 2, foe turn: the Recharge card shows');
  await click(p,{act:'b_au',cid:FID,k:'rc',a:'rc'});await W(p);
  ok(!(await foe()).au.rc&&!/Recharge:/.test(await helper(p)),'Recharged: the flag clears');
  await p.screenshot({path:ROOT+'/tests/out/helper_gm.png',fullPage:false});
  ok(errs.length===0,'GM: no page errors ('+errs.slice(0,3).join(' | ')+')');
  const snap=await p.evaluate(()=>{const o={};window.__store.forEach((v,k)=>o[k]=v);return o;});
  await b.close();
  // ---- the owner accepts a hit on their own Pokémon; another player cannot
  const hit={id:'hit1',at:Date.now()+5000,kind:'atk',label:'Tackle',type:'Normal',mk:'Physical',pk:'Foe A',tgt:AID,tn:'Volt',ac:15,hit:true,dm:7,ef:'n',gm:true,who:'GM'};
  const seed2=S=>{Object.keys(snap).forEach(k=>{S[k]=snap[k];});const bk=Object.keys(S).find(k=>S[k]&&S[k].order&&S[k].c);S[bk].rolls=[hit];S['trainers/u1/pokemon/p1'].hp={cur:30,max:30};S['trainers/u1/pokemon/p1'].status='Poisoned';return S;};
  ({b,p,errs}=await open({admin:false,uid:'u1',tab:'battle',seedFn:seed2}));
  t=await helper(p);
  ok(/Hits waiting/.test(t)&&/Tackle/.test(t)&&/7 damage/.test(t),'owner sees the hit on their own Pokémon');
  await click(p,{act:'b_auhit',src:'gm',id:'hit1',v:'ap'});await W(p);
  ok((await mon(p)).hp.cur===23&&(await mon(p)).au.ap.indexOf('hit1')>=0,'owner accepts: HP 30 → 23, marked on their Pokémon');
  ok(!/Hits waiting/.test(await helper(p))&&await p.evaluate(()=>/Applied/.test((document.querySelector('.rlog')||{}).innerText||'')),'the card is gone and the log says Applied');
  ok(errs.length===0,'owner: no page errors ('+errs.slice(0,3).join(' | ')+')');await b.close();
  ({b,p,errs}=await open({admin:false,uid:'u2',tab:'battle',seedFn:seed2}));
  t=await helper(p);
  ok(!/Hits waiting/.test(t)&&!/start of turn/.test(t),'another player gets no cards for it');
  await click(p,{act:'b_auhit',src:'gm',id:'hit1',v:'ap'});await W(p);
  ok((await mon(p)).hp.cur===30,'another player cannot apply it');
  ok(errs.length===0,'other player: no page errors ('+errs.slice(0,3).join(' | ')+')');await b.close();
  console.log(fails?fails+' FAILED':'ALL PASSED');
})();
