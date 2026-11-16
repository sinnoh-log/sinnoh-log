/* Team growth (Update 58): circuit trainers' teams grow as badges are won. Field trainers change on their own; rivals with
   an NPC sheet get proposals on the GM Desk. Veterans stay put. */
const fs=require('fs');const path=require('path');
const {open}=require('./lib');
let fails=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fails++;};
const click=(p,a)=>p.evaluate(a=>{const b=document.createElement('button');Object.entries(a).forEach(([k,v])=>b.dataset[k]=v);b.hidden=true;document.body.appendChild(b);b.click();b.remove();},a);
const W=(p,n)=>p.waitForTimeout(n||600);
const get=(p,path)=>p.evaluate(a=>window.__store.get(a),path);
const CH=JSON.parse(fs.readFileSync(path.join(__dirname,'fixtures/growth-species.json'),'utf8'));
const mon=(id,sp,ty,mv)=>({id,sp,ty:[ty,''],hp:{cur:30,max:30},base:{atk:5,def:4,spa:3,spd:4,spe:6},bonus:{atk:0,def:0,spa:0,spd:0,spe:0},mv:(mv||[]).map(n=>({name:n,freq:'At-Will',kind:'Physical',range:'Melee',type:'Normal',dice:'1d6',text:'',used:0})),ps:[],sh:{}});
const seedFn=S=>{
  Object.keys(CH).forEach(L=>{S['meta/pta_'+L]={v:1,j:JSON.stringify(CH[L])};});
  Object.assign(S['trainers/u1'],{level:4,badges:{}});
  Object.assign(S['trainers/u3'],{level:2,badges:{}});
  S['meta/conditions']={date:'2026-07-14',rkb:{seed:12345,n:300,wk:4},rk:{npc:[{k:'r1',n:'Rook Gallagher',p:5,s:'Aggressor',h:'Twinleaf',nt:'rv1'}]}};
  S['gm/nt_rv1']={name:'Rook Gallagher',cat:'rival',role:'Rookie · Aggressor',order:1,
    team:[mon('a','Shinx','Electric',['Tackle','Spark']),mon('b','Starly','Normal',['Quick Attack'])],
    q:{on:true,r:'1',cls:'competitor',ty:'Electric'},
    stages:[{id:'s0',bd:0,label:'Starting team',team:[mon('a','Shinx','Electric')],qr:'1'},{id:'s1',bd:1,label:'Later',team:[mon('z','Luxray','Electric')],qr:'2'}],grown:'s0'};
  return S;};
(async()=>{
  let {b,p,errs}=await open({admin:true,uid:'u1',tab:'gm',seedFn});
  await W(p,4500);
  let G=await get(p,'gm/teams');
  ok(G&&G.pb===0&&G.last&&G.last.why==='setup','the first visit saves everyone’s starting point (party average '+(G&&G.pb)+')');
  const F0=G.f||{};
  ok(Object.keys(F0).length===300,'every field trainer has a saved team ('+Object.keys(F0).length+')');
  const sz=await p.evaluate(()=>{const C=rdbCands(),f=S.teamGm.f;let bad=0,first=0,n=0;C.rows.filter(r=>r.kind==='bg').forEach(r=>{const e=f[r.id];n++;if(!e||e.sp.length>grTarget(r.bd)||e.sp.length<1||e.bd!==r.bd)bad++;const i=grInfo(e.sp[0]);if(i&&i.ty.includes(e.ty))first++;});return {bad,first,n};});
  ok(sz.bad===0,'each team’s size fits its trainer’s badges (2 at none, up to 6 at seven or more)');
  ok(sz.first>=sz.n*0.9,'their first Pokémon is their favourite type ('+sz.first+' of '+sz.n+')');
  ok(!(G.q||[]).length&&!(G.log||[]).length,'setting up changes nothing and asks nothing');

  // the rules
  const R=await p.evaluate(async()=>{
    const dex=await grLoadDex();
    const ev=(n,bd)=>grEvoOpts(n,bd,dex).map(o=>o.n).join('/');
    const vet=grStep(['Garchomp','Luxray','Staraptor','Machamp','Golem','Alakazam'],{bd:8,ty:'Dragon',style:'',rs:new Map()},dex,true);
    const strong=[];for(let i=0;i<200;i++){const x=grPick({bd:0,ty:'Electric',style:'',rs:new Map()},[]);if(x)strong.push(grInfo(x.n).s);}
    let imp=0;for(let i=0;i<400;i++){const x=grPick({bd:3,ty:'Water',style:'',rs:new Map()},[]);if(x&&GR_REGIONS.some(r=>r[1]===x.from&&r[1]!=='Sinnoh'))imp++;}
    return {ch:[0,2,3,5,6,7,8].map(GR_CHANCE).join(','),tg:[0,1,2,3,4,5,6,7,8].map(grTarget).join(''),
      shinx0:ev('Shinx',0),luxio3:ev('Luxio',3),luxio4:ev('Luxio',4),gabite5:ev('Gabite',5),gabite6:ev('Gabite',6),eevee2:ev('Eevee',2),eevee3:ev('Eevee',3).split('/').length,
      vet,maxS:Math.max(...strong),hi:RDB_BAND['1'][1],imp};
  });
  ok(R.ch==='1,1,0.5,0.5,0.15,0.15,0','a check grows the team always at 0–2 badges, half the time at 3–5, rarely at 6–7, never at 8');
  ok(R.tg==='233445566','teams aim for 2 Pokémon at no badges, rising to 6 at seven');
  ok(R.shinx0==='Luxio','a natural evolution can happen at any badge count (Shinx to Luxio at 0)');
  ok(R.luxio3===''&&R.luxio4==='Luxray','the last of three stages waits for 4 badges (Luxray)');
  ok(R.gabite5===''&&R.gabite6==='Garchomp','a pseudo-legend waits for 6 badges (Garchomp)');
  ok(R.eevee2===''&&R.eevee3===8,'stone evolutions wait for 3 badges (Eevee: none at 2, all eight at 3)');
  ok(R.vet===null,'six fully evolved Pokémon: nothing left to change');
  ok(R.maxS<=R.hi,'a rookie never catches anything stronger than a Novice’s band');
  ok(R.imp>=4&&R.imp<=70,'now and then a catch comes from another region ('+R.imp+' of 400)');
  errs.length=0;

  // a week on the rankings: field trainers who won a badge grow
  await p.evaluate(()=>{S.ui.rk.c='gym';});
  await click(p,{act:'rk_week'});await W(p,6000);
  G=await get(p,'gm/teams');
  const L1=(G.log||[]).filter(x=>x.why==='week');
  ok(L1.length>0,'after the week '+L1.length+' field trainers who won a badge changed their team (e.g. '+(L1[0]?L1[0].name+' '+L1[0].txt:'')+')');
  ok(L1.every(x=>x.bd<8&&x.after.length<=6),'nobody with eight badges changed, and nobody went past six');
  const V=await p.evaluate(()=>{const f=S.teamGm.f;return S.teamGm.log.every(x=>JSON.stringify(f[x.id].sp)===JSON.stringify(x.after));});
  ok(V,'each change is on the saved team');
  let nt=await p.evaluate(()=>S.gmNt.rv1);
  ok(nt.grown==='s0'&&nt.team[0].sp==='Shinx','the rival’s hand-written team no longer loads by itself');

  // the party earns a badge: everyone gets a check
  const q0=(G.q||[]).length,l0=(G.log||[]).length;
  await p.evaluate(()=>{entriesOf(S.trainers).filter(t=>t.name).forEach(t=>edit('t',t.id,'badges',{coal:true}));});
  await W(p,6000);
  G=await get(p,'gm/teams');
  const rq=(G.q||[]).filter(x=>x.nt==='rv1');
  ok(G.pb===1,'the party average went up to 1');
  ok(rq.length>=1&&rq.every(x=>x.why==='badge'),'Rook Gallagher has '+rq.length+' change(s) waiting: '+rq.map(x=>x.kind).join(', '));
  ok((G.log||[]).length>l0&&(G.log||[]).slice(l0).every(x=>x.why==='badge'),'field trainers grew too ('+((G.log||[]).length-l0)+')');
  let t=await p.evaluate(()=>{const e=document.getElementById('teamgrowth');return e?e.innerText:'';});
  ok(/Rival changes waiting/.test(t)&&/Rook Gallagher/.test(t)&&/The party earned a badge/.test(t),'the GM Desk lists them');

  // accept, reroll, skip
  const before=await p.evaluate(()=>JSON.parse(JSON.stringify(S.gmNt.rv1.team)));
  const first=rq[0];
  await click(p,{act:'gr_ok',k:first.k});await W(p,2500);
  nt=await p.evaluate(()=>S.gmNt.rv1);
  const applied=first.kind==='catch'?nt.team.length===before.length+1&&nt.team[nt.team.length-1].sp===first.sp
    :first.kind==='evolve'?nt.team.find(m=>m.id===first.mid).sp===first.to
    :first.kind==='swap'?nt.team.find(m=>m.sp===first.sp)&&!nt.team.some(m=>m.id===first.mid)
    :first.kind==='learn'?nt.team.find(m=>m.id===first.mid).mv.some(x=>x.name===first.move)
    :first.kind==='rank'?nt.q.r===first.to:false;
  ok(applied,'Accept puts it on the sheet ('+first.kind+': '+(first.sp||first.to||first.move||'')+')');
  ok(Array.isArray(nt.glog)&&nt.glog.slice(-1)[0].auto===1,'the sheet’s log records it');
  ok(!(await get(p,'gm/teams')).q.some(x=>x.k===first.k),'and it leaves the queue');
  await p.evaluate(()=>{const Q=S.teamGm.q.filter(x=>x.nt!=='rv1');Q.push({kind:'catch',sp:'Pachirisu',from:'Route 205',k:'test1',nt:'rv1',name:'Rook Gallagher',bd:1,why:'badge',wk:5,at:1});edit('gf','teams','q',Q);});await W(p,400);
  await click(p,{act:'gr_re',k:'test1'});await W(p,2500);
  const q2=(await get(p,'gm/teams')).q.filter(x=>x.nt==='rv1');
  ok(q2.length===1&&q2[0].k!=='test1'&&grTextOk(q2[0]),'Reroll replaces it with a different change ('+q2[0].kind+')');
  await click(p,{act:'gr_skip',k:q2[0].k});await W(p,500);
  ok(!(await get(p,'gm/teams')).q.some(x=>x.nt==='rv1'),'Skip drops it');

  // undo a field change
  const last=(await get(p,'gm/teams')).log.slice(-1)[0];
  await click(p,{act:'gr_undo',k:last.k});await W(p,600);
  G=await get(p,'gm/teams');
  ok(JSON.stringify(G.f[last.id].sp)===JSON.stringify(last.before)&&!G.log.some(x=>x.k===last.k),'Undo puts a field trainer’s team back');

  // road battles meet the saved team
  const rb=await p.evaluate(()=>{const C=rdbCands(),r=C.rows.find(x=>x.kind==='bg'&&S.teamGm.f[x.id].sp.length>=2),f=rdbFoe(r,{txt:'x'},C.W);return f.team.every(s=>S.teamGm.f[r.id].sp.includes(s))&&f.ty===S.teamGm.f[r.id].ty;});
  ok(rb,'a road battle brings members of the trainer’s saved team');

  // undo the week: its field changes go back
  const wkLog=(await get(p,'gm/teams')).log.filter(x=>x.why==='week');
  await click(p,{act:'rk_unweek'});await W(p,1200);
  G=await get(p,'gm/teams');
  ok(wkLog.length&&!G.log.some(x=>x.why==='week')&&wkLog.every(x=>x.steps.every(st=>st.kind==='catch'?!G.f[x.id].sp.includes(st.b)||x.before.includes(st.b):!G.f[x.id].sp.includes(st.b)||x.before.includes(st.b))),'undoing the week takes the field’s changes from it back out ('+wkLog.map(x=>x.name+': '+x.txt).join('; ')+')');
  ok(errs.length===0,'no page errors ('+errs.slice(0,3).join(' | ')+')');
  await b.close();

  // players never see any of it
  ({b,p,errs}=await open({admin:false,uid:'u1',tab:'overview',seedFn:S=>{seedFn(S);S['gm/teams']={pb:0,f:{b1:{sp:['Shinx'],bd:0,ty:'Electric'}},q:[{k:'x',kind:'catch',sp:'Pikachu',nt:'rv1',name:'Rook'}],log:[]};return S;}}));
  ok(await p.evaluate(()=>!S.teamGm||!Object.keys(S.teamGm).length),'a player’s browser never receives the saved teams or the queue');
  ok(await p.evaluate(()=>grDesk()===''),'and the panel is not drawn for them');
  ok(errs.length===0,'no page errors for a player');
  await b.close();
  console.log(fails?fails+' FAILED':'ALL PASSED');
})();
function grTextOk(x){return !!x&&['catch','evolve','swap','learn','rank'].includes(x.kind);}
