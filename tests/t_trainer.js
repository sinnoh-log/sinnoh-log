const {open}=require('./lib');
let fails=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fails++;};
const click=(p,a)=>p.evaluate(a=>{const b=document.createElement('button');Object.entries(a).forEach(([k,v])=>b.dataset[k]=v);b.hidden=true;document.body.appendChild(b);b.click();setTimeout(()=>b.remove(),50);},a);
const get=(p,path)=>p.evaluate(a=>window.__store.get(a),path);
const upd=(p,path,o)=>p.evaluate(([a,b])=>window.__db.doc(a).set(b,{merge:true}),[path,o]);
(async()=>{
  const {b,p,errs}=await open({admin:true,uid:'u1',tab:'battle'});
  await upd(p,'trainers/u1',{stats:{spe:6},hp:{cur:20,max:20}});
  await upd(p,'trainers/u2',{stats:{spe:9},hp:{cur:15,max:15}});
  await p.waitForTimeout(600);
  const txt=()=>p.evaluate(()=>document.body.innerText);
  ok(/Mira \(trainer\)/.test(await txt()),'the Who is fighting panel offers each trainer');
  await click(p,{act:'b_addtrainer',uid:'u1'});await click(p,{act:'b_addtrainer',uid:'u2'});await p.waitForTimeout(1200);
  await click(p,{act:'b_addtrainer',uid:'u1'});await p.waitForTimeout(800);   // twice: ignored
  let bt=await get(p,'meta/battle');
  const cs=Object.values(bt.c||{});
  ok(cs.length===2&&cs.every(c=>c.s==='t'),'two trainers in the battle, none doubled ('+cs.length+')');
  await click(p,{act:'b_addally',uid:'u1',pid:'p1'});await p.waitForTimeout(800);
  await click(p,{act:'b_init'});await p.waitForTimeout(1500);
  bt=await get(p,'meta/battle');
  const names=bt.order.map(cid=>bt.c[cid].s==='t'?'T'+bt.c[cid].u:'A'+bt.c[cid].r);
  console.log(names.join(' > '));
  ok(bt.on&&names.length===3,'initiative rolled with the trainers in the order');
  ok(names.indexOf('Tu2')<names.indexOf('Tu1'),'Speed 9 trainer acts before Speed 6 trainer');
  let t=await txt();
  ok(/Jonas/.test(t)&&/Mira/.test(t)&&/Trainer/.test(t),'rows show the trainers');
  // next turn walks through trainers
  const first=bt.turn;
  await click(p,{act:'b_next'});await p.waitForTimeout(800);
  bt=await get(p,'meta/battle');
  ok(bt.turn&&bt.turn!==first,'Next turn moves on');
  // HP on a trainer
  const cid=bt.order.find(c=>bt.c[c].s==='t'&&bt.c[c].u==='u2');
  await click(p,{act:'b_hp',cid,d:'-5'});await p.waitForTimeout(1200);
  ok((await get(p,'trainers/u2')).hp.cur===10,'damage on a trainer row lowers the trainer’s HP (15 to '+(await get(p,'trainers/u2')).hp.cur+')');
  // removal
  await click(p,{act:'b_rm',cid});await p.waitForTimeout(500);await click(p,{act:'b_rm',cid});await p.waitForTimeout(1000);
  bt=await get(p,'meta/battle');
  ok(!bt.c[cid]&&!bt.order.includes(cid),'trainer removed from the battle');
  ok(!errs.length,'no page errors '+JSON.stringify(errs.slice(0,2)));
  await b.close();
  // a player's own view
  const r=await open({admin:false,uid:'u1',tab:'battle',seedFn:S=>{S['trainers/u1']=Object.assign({},S['trainers/u1'],{stats:{spe:6},hp:{cur:20,max:20}});S['meta/battle']={on:true,round:1,mode:'speed',turn:'x1',order:['x1','x2'],c:{x1:{s:'t',u:'u1',ini:6,tb:3},x2:{s:'t',u:'u2',ini:5,tb:2}}};return S;}});
  await r.p.waitForTimeout(1200);
  const pt=await r.p.evaluate(()=>document.body.innerText);
  ok(/Your turn/.test(pt),'player sees "Your turn" when their trainer acts');
  ok(/Jonas/.test(pt),'player sees the other trainer in the order');
  ok(!r.errs.length,'no errors for the player '+JSON.stringify(r.errs.slice(0,2)));
  await r.b.close();
  console.log(fails?'FAILURES '+fails:'ALL PASSED');process.exit(fails?1:0);
})();
