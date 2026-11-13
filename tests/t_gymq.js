/* Gym Leaders as Quick NPCs (Update 55): one click sets up every Gym Leader without a rank as a Type Ace in their Gym's type,
   with a Veteran feature that fits them; the rank follows the challenger's badges through their saved tier teams. */
const {open,ROOT}=require('./lib');
let fails=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fails++;};
const click=(p,a)=>p.evaluate(a=>{const b=document.createElement('button');Object.entries(a).forEach(([k,v])=>b.dataset[k]=v);b.hidden=true;document.body.appendChild(b);b.click();},a);
const W=(p,n)=>p.waitForTimeout(n||600);
const mon=(id,sp,ty)=>({id,sp,ty:[ty,''],hp:{cur:30,max:30},base:{atk:5,def:5,spa:5,spd:5,spe:5},bonus:{atk:0,def:0,spa:0,spd:0,spe:0},mv:[],ps:[],sh:{}});
const seedFn=S=>{
  S['gm/nt_gl1']={name:'Roark',role:'Gym Leader, Oreburgh',cat:'gym',order:1,team:[mon('a','Geodude','Rock'),mon('b','Cranidos','Rock')]};
  const tiers=[[0,['Cleffa','Snubbull']],[2,['Togetic','Kirlia','Hatenna']],[5,['Mawile','Azumarill','Hattrem','Gardevoir']],[7,['Togekiss','Azumarill','Mawile','Gardevoir','Hatterene']]];
  const st=tiers.map(([bd,sps],i)=>({id:'s'+i,bd,label:'Tier '+(i+1),team:sps.map((sp,j)=>mon('t'+i+j,sp,'Fairy'))}));
  S['gm/nt_gl2']={name:'Klevin',role:'Pastoria Gym Leader',cat:'gym',order:2,team:st[2].team,stages:st,grown:'s2'};
  S['gm/nt_gl3']={name:'Aria Voss',role:'Gym Leader',cat:'gym',order:3,team:['Pikachu','Luxray','Magnezone','Jolteon','Rotom'].map((sp,i)=>mon('e'+i,sp,'Electric'))};
  S['gm/nt_gl4']={name:'Fantina',role:'Gym Leader',cat:'gym',order:4,team:[mon('f','Gastly','Ghost')],q:{on:true,r:'4',cls:'performer'}};
  S['gm/nt_rv1']={name:'Marina Lopez',role:'Rival',cat:'rival',order:5,team:[mon('g','Wingull','Water')]};
  return S;};
(async()=>{
  let {b,p,errs}=await open({admin:true,uid:'u1',tab:'npc',seedFn});
  ok(await p.evaluate(()=>/Set up 3 Gym Leaders as Quick NPCs/.test(document.body.innerText)),'NPC trainers: a button to set up the 3 Gym Leaders without a rank');
  await click(p,{act:'nt_glq'});await W(p,900);
  const N=await p.evaluate(()=>{const o={};Object.keys(S.gmNt).forEach(id=>o[S.gmNt[id].name]={id,q:S.gmNt[id].q||null,st:(S.gmNt[id].stages||[]).map(s=>s.bd+':'+(s.qr||''))});return o;});
  const R=N['Roark'].q,K=N['Klevin'].q,A=N['Aria Voss'].q;
  ok(R&&R.on&&R.cls==='typeace'&&R.ty==='Rock'&&R.r==='1'&&R.vc==='backpacker','Roark: Rock Type Ace, Novice with his 2-Pokémon tier 1 team, Veteran Backpacker ('+JSON.stringify(R)+')');
  ok(K&&K.ty==='Fairy'&&K.r==='3'&&K.vc==='ladygentleman'&&/Robert's Rules/.test(K.ch),'Klevin: Fairy Type Ace, Experienced with his 5-6 badge team loaded, Good Manners rule in Choices');
  ok(N['Klevin'].st.join(',')==='0:1,2:2,5:3,7:4','Klevin\'s saved tier teams carry Novice, Skilled, Experienced, Ace ('+N['Klevin'].st.join(',')+')');
  ok(A&&A.ty==='Electric'&&A.r==='4'&&A.vc==='gymtrainer'&&/type Electric/.test(A.ch),'a Leader not on the list: the type most of their team shares, Ace with 5 Pokémon, Gym Trainer lesson');
  ok(N['Fantina'].q.cls==='performer'&&N['Fantina'].q.r==='4','a Leader you already ranked is left alone');
  ok(!N['Marina Lopez'].q,'a rival who shares a Leader\'s name is not touched');
  ok(await p.evaluate(()=>!/Set up \d+ Gym Leader/.test(document.body.innerText)),'the button goes away once every Leader has a rank');
  // loading the tier team for a 7-badge challenger makes him an Ace
  await p.evaluate(()=>ntStageLoad('gl2','s3',true));await W(p);
  ok(await p.evaluate(()=>S.gmNt.gl2.q.r)==='4','loading his 7+ badge team makes Klevin an Ace');
  // saving a new tier team at 3 badges gets the rank for that mark
  await p.evaluate(()=>{S.ui.nt.stb_gl2='3';});await click(p,{act:'nt_stnew',id:'gl2'});await W(p);
  ok(await p.evaluate(()=>(S.gmNt.gl2.stages.find(s=>s.bd===3)||{}).qr)==='2','a team saved at 3 badges is Skilled');
  // his sheet and features
  await p.evaluate(()=>{S.ui.nt.open.gl2=true;render();});await W(p,900);
  const t=await p.evaluate(()=>document.querySelector('.ntcard[data-id="gl2"]').innerText);
  ok(/Ace Type Ace · Fairy/.test(t)&&/Overflowing Power/.test(t)&&/Good Manners/.test(t)&&/Cute Charm/.test(t),'Klevin\'s sheet at Ace: Overflowing Power, Cute Charm, Good Manners');
  await p.evaluate(()=>{S.ui.nt.open.gl1=true;render();});await W(p,600);
  const tr=await p.evaluate(()=>document.querySelector('.ntcard[data-id="gl1"]').innerText);
  ok(/Novices have no useful features/.test(tr),'Roark at tier 1: no features, as the tutorial fight intends');
  ok(/rank follows the challenger's badges/.test(tr)&&!/Amateurs/.test(tr)&&/Skill check \(d20 \+ 4\)/.test(tr),'a Leader\'s sheet explains the tiers instead of calling him an amateur, and skill checks use +4');
  await p.screenshot({path:ROOT+'/tests/out/gymq.png'});
  ok(errs.length===0,'no page errors ('+errs.slice(0,3).join(' | ')+')');
  await b.close();console.log(fails?fails+' FAILED':'ALL PASSED');
})();
