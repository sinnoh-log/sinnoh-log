/* Fill to six moves (Update 70): an NPC Pokémon keeps every move it has and fills its empty slots with its natural moves,
   then moves it can be taught; one Pokémon, one NPC (team and saved teams) or every NPC at once. Re-importing a pack with
   longer move lists tops up Pokémon whose moves all came from the pack. With PACKS set, the Gym rivals and Head Gym Trainers
   packs are checked for six moves each. */
const fs=require('fs');const path=require('path');
const {open}=require('./lib');
let fails=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fails++;};
const click=(p,a)=>p.evaluate(a=>{const b=document.createElement('button');Object.entries(a).forEach(([k,v])=>b.dataset[k]=v);b.hidden=true;document.body.appendChild(b);b.click();b.remove();},a);
const W=(p,n)=>p.waitForTimeout(n||600);
const CH=JSON.parse(fs.readFileSync(path.join(__dirname,'fixtures/growth-species.json'),'utf8'));
const mv=n=>({name:n,freq:'At-Will',kind:'Physical',range:'Melee',type:'Fighting',dice:'2d6',text:'',used:2});
const mon=(id,sp,ty,list)=>({id,sp,ty:[ty,''],hp:{cur:30,max:30},base:{atk:5,def:4,spa:3,spd:4,spe:6},mv:list.map(mv),ps:[],sh:{}});
const seedFn=S=>{
  Object.keys(CH).forEach(L=>{S['meta/pta_'+L]={v:1,j:JSON.stringify(CH[L])};});
  S['gm/nt_a']={name:'Kira Dorsey',cat:'rival',order:1,team:[mon('m1','Machop','Fighting',['Karate Chop','Rock Smash']),mon('m2','Shinx','Electric',['Tackle','Spark','Bite','Charge','Howl','Thunder Fang'])],
    stages:[{id:'s1',bd:2,label:'After 2 more badges',team:[mon('m3','Machoke','Fighting',['Karate Chop'])]}]};
  S['gm/nt_b']={name:'Wendell Haddad',cat:'rival',order:2,team:[mon('m4','Shellos','Water',['Water Pulse'])]};
  return S;};
(async()=>{
  const {b,p,errs}=await open({admin:true,uid:'u1',tab:'npc',seedFn});
  const team=id=>p.evaluate(id=>JSON.parse(JSON.stringify(S.gmNt[id])),id);
  await p.evaluate(()=>{S.ui.nt.open={a:true};S.ui.open.edna=true;S.ui.nt.mon={m1:true};render();});await W(p);
  let t=await p.evaluate(()=>document.getElementById('main').innerText);
  ok(/Fill to six moves/.test(t)&&/Fill all to six moves/.test(t)&&/Fill every NPC to six moves/.test(t),'the buttons: one Pokémon, one NPC, every NPC');
  // one Pokémon
  await click(p,{act:'nt_six',id:'a',mid:'m1'});await W(p,1200);
  let A=await team('a');
  const m1=A.team[0].mv.map(x=>x.name);
  ok(m1.length===6&&m1[0]==='Karate Chop'&&m1[1]==='Rock Smash'&&A.team[0].mv[0].used===2,'Machop keeps its two moves (and their uses) and has six now: '+m1.join(', '));
  ok(['Low Kick','Foresight','Focus Energy'].every(n=>m1.includes(n)),'its natural moves come first (Low Kick, Foresight, Focus Energy)');
  ok(new Set(m1).size===6&&m1.filter(n=>/Focus Energy|Swords Dance|Bulk Up|Work Up/.test(n)).length<=1,'no repeats, and at most one Style move');
  ok(A.team[1].mv.length===6&&A.stages[0].team[0].mv.length===1,'only that Pokémon changed');
  // one NPC: team and saved teams
  await click(p,{act:'nt_sixnpc',id:'a'});await W(p,1200);
  A=await team('a');
  ok(A.stages[0].team[0].mv.length===6&&A.stages[0].team[0].mv[0].name==='Karate Chop','the NPC button fills their saved teams too (Machoke: '+A.stages[0].team[0].mv.map(x=>x.name).join(', ')+')');
  ok(A.team[1].mv.map(x=>x.name).join()==='Tackle,Spark,Bite,Charge,Howl,Thunder Fang','a Pokémon with six moves is left alone');
  // every NPC, with two taps
  await click(p,{act:'nt_sixall'});await W(p);
  ok((await team('b')).team[0].mv.length===1,'the every-NPC button asks for a second tap');
  await click(p,{act:'nt_sixall'});await W(p,1500);
  const B=await team('b');
  ok(B.team[0].mv.length===6&&B.team[0].mv[0].name==='Water Pulse','the second tap fills every NPC (Shellos: '+B.team[0].mv.map(x=>x.name).join(', ')+')');
  t=await p.evaluate(()=>document.getElementById('main').innerText);
  ok(!/Fill every NPC to six moves/.test(t),'with everyone at six, the button goes away');

  // the packs
  const DIR=process.env.PACKS;
  const rd=f=>DIR&&fs.existsSync(path.join(DIR,f))?JSON.parse(fs.readFileSync(path.join(DIR,f),'utf8')):null;
  const R=rd('sinnoh-circuit-rivals-quick.json'),H=rd('sinnoh-head-trainers.json');
  const all=r=>r.team.concat(...(r.stages||[]).map(s=>s.team));
  if(R&&H){
    ok(R.npcs.length===30&&R.npcs.every(r=>all(r).every(m=>Array.isArray(m.mv)&&m.mv.length===6&&new Set(m.mv).size===6)),'the Gym rivals pack: every Pokémon (later teams too) has six different moves');
    ok(H.npcs.length===8&&H.npcs.every(r=>all(r).every(m=>Array.isArray(m.mv)&&m.mv.length===6&&new Set(m.mv).size===6)),'the Head Gym Trainers pack: every Pokémon has six different moves');
  }else console.log('SKIP the pack part: set PACKS to the folder with the packs');
  ok(errs.length===0,'no page errors ('+errs.slice(0,3).join(' | ')+')');
  await b.close();
  console.log(fails?fails+' FAILED':'ALL PASSED');
  process.exit(fails?1:0);
})();
