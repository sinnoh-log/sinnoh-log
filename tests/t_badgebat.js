/* Badge battles (Update 63): every badge battle is a double battle, set up from the Gym Leader's NPC sheet. Solo or tag; the tier
   comes from the challenger's badges (the partner with more, in a tag battle); team sizes 2/3/4/6 solo and 1/2/2/3 each in tag;
   the Head Gym Trainer is one rank below the Leader; partners come from circuit trainers waiting at that Gym. A badge logged for a
   circuit trainer now counts toward their badges, and a solo win is its own rankings event. */
const {open}=require('./lib');const fs=require('fs');const path=require('path');
let fails=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fails++;};
const click=(p,a)=>p.evaluate(a=>{const b=document.createElement('button');Object.entries(a).forEach(([k,v])=>b.dataset[k]=v);b.hidden=true;document.body.appendChild(b);b.click();b.remove();},a);
const W=(p,n)=>p.waitForTimeout(n||500);
const mon=(id,sp,ty)=>({id,sp,ty:[ty,''],hp:{cur:30,max:30},base:{atk:5,def:5,spa:5,spd:5,spe:5},bonus:{atk:0,def:0,spa:0,spd:0,spe:0},mv:[],ps:[],sh:{}});
const team=(pre,list)=>list.map((sp,i)=>mon(pre+i,sp,'Ghost'));
const seedFn=S=>{
  Object.assign(S['trainers/u1'],{level:6,badges:{coal:true,forest:true}});
  Object.assign(S['trainers/u3'],{level:2});
  S['meta/conditions']={date:'2026-07-14',rkb:{seed:12345,n:300,wk:22},rk:{npc:[]}};
  S['gm/nt_f1']={name:'Fantina',cat:'gym',order:1,team:team('a',['Duskull','Drifloon']),grown:'s0',q:{on:true,r:'1',cls:'typeace',ty:'Ghost'},
    stages:[{id:'s0',bd:0,label:'',team:team('b',['Duskull','Drifloon']),qr:'1'},{id:'s2',bd:2,label:'',team:team('c',['Haunter','Drifloon','Misdreavus']),qr:'2'},
      {id:'s5',bd:5,label:'',team:team('d',['Haunter','Drifblim','Mismagius','Dusclops']),qr:'3'},{id:'s7',bd:7,label:'',team:team('e',['Gengar','Drifblim','Mismagius','Dusknoir','Spiritomb']),qr:'4'}]};
  S['gm/nt_h1']={name:'Piers Halloran-Reed',cat:'league',gym:'relic',order:2,team:team('f',['Duskull']),grown:'h0',q:{on:true,r:'1',cls:'gymtrainer',ty:'Ghost'},
    stages:[{id:'h0',bd:0,label:'Starting team',team:team('g',['Duskull']),qr:'1'},{id:'h2',bd:2,label:'',team:team('h',['Duskull','Shuppet']),qr:'1'},
      {id:'h5',bd:5,label:'',team:team('i',['Banette','Duskull']),qr:'2'},{id:'h7',bd:7,label:'',team:team('j',['Dusclops','Banette','Lampent']),qr:'3'}]};
  S['gm/nt_v1']={name:'Volkner',cat:'gym',order:3,team:[]};
  return S;};
(async()=>{
  let {b,p,errs}=await open({admin:true,uid:'u1',tab:'npc',seedFn});
  const card=id=>p.evaluate(id=>{const e=document.querySelector('.ntcard[data-id="'+id+'"] .bdb');return e?e.innerText:'';},id);
  await p.evaluate(()=>{S.ui.nt.open.f1=true;S.ui.nt.open.v1=true;render();});await W(p);
  let t=await card('f1');
  ok(/Badge battle/.test(t)&&/Hearthome Gym · Relic Badge/.test(t)&&/Set up a badge battle/.test(t),'a Leader’s sheet has a Badge battle box, matched to her Gym ('+t.replace(/\n/g,' | ')+')');
  ok(/match a Gym/.test(await (async()=>{await click(p,{act:'bdb_open',id:'v1'});await W(p);return card('v1');})()),'a Leader with no Gym of that name is asked to choose one');
  ok(!(await card('h1')),'a Head Trainer’s sheet has no badge battle box');

  // solo
  await click(p,{act:'bdb_open',id:'f1'});await W(p);
  await click(p,{act:'bdb_a',id:'f1',v:'u3'});await W(p);
  let s=await p.evaluate(()=>{const s=bdbState('f1');return {tier:s.tier,n:s.n,lk:s.lk,lp:s.lp,tag:s.tag};});
  t=await card('f1');
  ok(s.tier==='1'&&s.n===2&&s.lk==='s0'&&s.lp.join()==='0,1','solo, 0 badges: tier 1, two a side, the team saved for 0 badges ('+JSON.stringify(s)+')');
  ok(/Tier 1/.test(t)&&/Solo:\s*2 Pokémon a side/.test(t)&&/\+30 RP/.test(t)&&/single-use TR/.test(t),'the box shows the tier, the size and the solo stakes');
  await click(p,{act:'bdb_a',id:'f1',v:'u1'});await W(p);
  s=await p.evaluate(()=>{const s=bdbState('f1');return {tier:s.tier,n:s.n,lk:s.lk,len:s.lt.length};});
  ok(s.tier==='2'&&s.n===3&&s.lk==='s2'&&s.len===3,'solo, 2 badges: tier 2, three a side, the team saved for 2 badges');
  const sizes=await p.evaluate(()=>['1','2','3','4'].map(r=>BDB_SOLO[r]+'/'+BDB_TAG[r]+'/'+BDB_DOWN[r]).join(' '));
  ok(sizes==='2/1/1 3/2/1 4/2/2 6/3/3','sizes by tier: solo 2/3/4/6, tag 1/2/2/3 each; Head Trainer Novice, Novice, Skilled, Experienced ('+sizes+')');

  // tag with another player
  await click(p,{act:'bdb_fmt',id:'f1',v:'tag'});await W(p);
  await click(p,{act:'bdb_p',id:'f1',v:'pc:u3'});await W(p);
  s=await p.evaluate(()=>{const s=bdbState('f1');return {tier:s.tier,n:s.n,P:s.P&&s.P.name,head:s.hn&&s.hn.name,hk:s.hk,hp:s.hp,lp:s.lp};});
  t=await card('f1');
  ok(s.tier==='2'&&s.n===2&&s.P==='Cora'&&s.head==='Piers Halloran-Reed'&&s.hk==='h2'&&s.hp.join()==='0,1'&&s.lp.join()==='0,1','tag with Cora (0) and Mira (2): tier 2 from Mira, two each, Piers with his tier 2 team ('+JSON.stringify(s)+')');
  ok(/Piers Halloran-Reed/.test(t)&&/one rank below the Leader/.test(t)&&/\+25 RP each/.test(t)&&/personal gift/.test(t),'the box shows the Head Trainer and the tag stakes');

  // circuit partners
  const F=await p.evaluate(()=>{const F=bdbField('relic','u1');const gi=RK_GYMS.findIndex(g=>g.k==='relic');
    return {n:F.here.length,allHere:F.here.every(x=>/Training around Hearthome City for the Relic Badge/.test(rdbLoc(x.r,F.W,rdbDay()).jt)),need:F.here.every(x=>rdbHeld(x.r,F.W)[gi]==null),bd:[...new Set(F.here.map(x=>x.bd))],first:F.here[0]&&F.here[0].key,W:F.W};});
  ok(F.n>0&&F.allHere&&F.need,'circuit partners: '+F.n+' trainers training around Hearthome for the Relic Badge, none holding it (badges '+F.bd.join(',')+')');
  await click(p,{act:'bdb_p',id:'f1',v:F.first});await W(p);
  s=await p.evaluate(()=>{const s=bdbState('f1');return {P:s.P&&s.P.name,pbd:s.P&&s.P.bd,tier:s.tier,n:s.n,lk:s.lk,hk:s.hk,saved:!!(S.teamGm&&S.teamGm.f&&S.teamGm.f[s.P.r.id])};});
  ok(s.P&&s.tier===String(s.pbd>=7?4:s.pbd>=5?3:s.pbd>=2?2:1)&&s.saved,'choosing '+s.P+' ('+s.pbd+' badges) sets the tier from the partner with more ('+s.tier+'), and saves their circuit team');
  t=await card('f1');
  ok(/partner ·/.test(t)&&/as allies on the players’ side/.test(t),'the partner’s team shows, and Send to the battle will add them as allies');

  // picking and sending
  await click(p,{act:'bdb_p',id:'f1',v:'pc:u3'});await W(p);
  await click(p,{act:'bdb_pick',id:'f1',role:'l',i:'2'});await W(p);
  t=await card('f1');
  s=await p.evaluate(()=>bdbState('f1').lp.join());
  ok(s==='0,1,2'&&/3 picked; the tier calls for 2/.test(t),'picking a third Leader Pokémon warns that the tier calls for two');
  await click(p,{act:'bdb_pick',id:'f1',role:'l',i:'0'});await W(p);
  await click(p,{act:'bdb_send',id:'f1'});await W(p,900);
  s=await p.evaluate(()=>{const f=S.gmNt.f1,h=S.gmNt.h1,fo=Object.values((S.battleGm||{}).foes||{});
    return {fg:f.grown,fr:f.q.r,hg:h.grown,hr:h.q.r,foes:fo.length,sp:fo.map(x=>x.sp).sort().join(','),own:[...new Set(fo.map(x=>x.nt))].sort().join(',')};});
  ok(s.fg==='s2'&&s.fr==='2'&&s.hg==='h2'&&s.hr==='1','sending loads the tier teams: Fantina Skilled with her 2-badge team, Piers Novice with his ('+JSON.stringify(s)+')');
  ok(s.foes===4&&s.sp==='Drifloon,Duskull,Misdreavus,Shuppet'&&s.own==='f1,h1','the picked Pokémon join the battle: Drifloon and Misdreavus for Fantina, Duskull and Shuppet for Piers');
  await click(p,{act:'bdb_send',id:'f1'});await W(p,700);
  ok(await p.evaluate(()=>Object.keys((S.battleGm||{}).foes||{}).length)===4,'sending again adds nobody twice');

  // a badge logged for a circuit trainer counts
  const L=await p.evaluate(key=>{
    const id=key.slice(3),before=rkWith('gym',()=>rkRows().find(r=>r.id===id).bd);
    rkWith('gym',()=>rkSave({log:rkLog().concat([{k:'tagwin',u:id,p:25,w:'Tag win at Hearthome',wk:num(rkB().wk),e:'badge'}])}));
    const after=rkWith('gym',()=>rkRows().find(r=>r.id===id).bd),still=bdbField('relic','u1').here.some(x=>x.key===key);
    return {before,after,still};
  },F.first);
  ok(L.after===L.before+1&&!L.still,'a badge logged for a circuit partner counts: '+L.before+' → '+L.after+' badges, and they stop waiting at Hearthome');
  ok(await p.evaluate(()=>{const e=RK_EVENTS.find(x=>x[0]==='solo');return !!e&&e[2]===30&&/solo/.test(e[1]);}),'the rankings have a “Won a Gym badge solo” event worth 30');

  // the Head Trainer link on any NPC
  await p.evaluate(()=>{S.ui.nt.open.h1=true;S.ui.open['ednh1']=true;render();});await W(p);
  const sel=await p.evaluate(()=>{const e=document.querySelector('.ntcard[data-id="h1"] select[data-b$="|gym"]');return e?e.value:null;});
  ok(sel==='relic','a Head Trainer’s Edit details names their Gym ('+sel+')');
  ok(await p.evaluate(()=>!document.querySelector('.ntcard[data-id="f1"] select[data-b$="|gym"]')||!S.ui.open['ednf1']),'a Leader’s Edit details has no Head Trainer field');
  ok(errs.length===0,'no page errors ('+errs.slice(0,3).join(' | ')+')');
  await b.close();

  // the Head Gym Trainers pack (kept out of the repo: pass PACKS=folder)
  const DIR=process.env.PACKS,pk=DIR&&path.join(DIR,'sinnoh-head-trainers.json');
  if(pk&&fs.existsSync(pk)){
    ({b,p,errs}=await open({admin:true,uid:'u1',tab:'npc',seedFn:S=>{S['meta/conditions']={date:'2026-07-14'};return S;}}));
    await p.evaluate(t=>ntImportPack({text:async()=>t}),fs.readFileSync(pk,'utf8'));await W(p,3000);
    const N=await p.evaluate(()=>Object.values(S.gmNt).map(n=>({n:n.name,gym:n.gym,cat:n.cat,q:n.q&&n.q.cls,r:n.q&&n.q.r,st:ntStages(n).map(s=>s.bd+':'+s.qr+':'+s.team.length).join(' ')})));
    ok(N.length===8&&new Set(N.map(x=>x.gym)).size===8&&N.every(x=>x.cat==='league'&&x.q==='gymtrainer'),'the pack brings eight Head Trainers, one per Gym, as League Gym Trainers');
    ok(N.every(x=>x.r==='1'&&x.st==='0:1:1 2:1:2 5:2:2 7:3:3'),'each has a team per tier (1, 2, 2, 3 Pokémon) at Novice, Novice, Skilled, Experienced ('+N[0].st+')');
    await p.evaluate(t=>ntImportPack({text:async()=>t}),fs.readFileSync(pk,'utf8'));await W(p,2000);
    ok(await p.evaluate(()=>Object.keys(S.gmNt).length)===8,'importing it again adds nobody twice');
    ok(errs.length===0,'pack: no page errors ('+errs.slice(0,3).join(' | ')+')');
    await b.close();
  }else console.log('SKIP: the Head Trainer pack (set PACKS)');
  console.log(fails?fails+' FAILED':'ALL PASSED');
})();
