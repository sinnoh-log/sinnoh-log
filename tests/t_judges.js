/* Contest judges (Update 72): a judge pack gives the GM a roster and a panel for each hall (head judge, a Contest Committee
   judge who rotates each in-game month, a local guest). Judges lean toward some hidden goals and have a tell for the GM.
   Without a pack nothing changes. With JUDGES set to the folder with sinnoh-contest-judges.json, that pack is used;
   otherwise a small one built here. */
const fs=require('fs');const path=require('path');
const {open}=require('./lib');
let fails=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fails++;};
const click=(p,a)=>p.evaluate(a=>{const b=document.createElement('button');Object.entries(a).forEach(([k,v])=>b.dataset[k]=v);b.hidden=true;document.body.appendChild(b);b.click();b.remove();},a);
const W=(p,n)=>p.waitForTimeout(n||500);
const pick=(p,sel,v)=>p.evaluate(([sel,v])=>{const s=document.querySelector(sel);s.value=v;s.dispatchEvent(new Event('input',{bubbles:true}));},[sel,v]);
const DIR=process.env.JUDGES;
const real=DIR&&fs.existsSync(path.join(DIR,'sinnoh-contest-judges.json'));
const L=(k,t,x)=>Object.assign({k},t?{t}:{},x?{x}:{});
const small={format:'sinnoh-judge-pack',v:1,name:'Test judges',
  judges:[
    {k:'sterling',n:'Margo Sterling',r:'Head judge, Jubilife Contest Hall',seat:'head',lean:[L('one'),L('el'),L('intro')],tell:'She glances at the monitor.',note:'Producer.'},
    {k:'voss',n:'Mireille Voss',r:'Director and head judge, Super Contest Hall',seat:'head',lean:[L('intro'),L('fin'),L('ct')],tell:'She never looks at the trainer.',note:''},
    {k:'anselm',n:'Anselm Hargrove',r:'Contest Committee judge',seat:'circuit',lean:[L('hp'),L('fin'),L('stat')],tell:'He writes after the round.',note:''},
    {k:'quintero',n:'Rafael Quintero',r:'Contest Committee judge',seat:'circuit',lean:[L('el'),L('up'),L('one')],tell:'He mouths the count.',note:''},
    {k:'vik',n:'Hanne Vik',r:'Contest Committee judge',seat:'circuit',lean:[L('ct'),L('cnt'),L('fin')],tell:'Bow to her.',note:''},
    {k:'contesta',n:'Mr. Contesta',r:'Chairman of the Pokémon Contest Committee',seat:'festival',lean:[L('hp')],tell:'Wonderful!',note:''},
    {k:'sukizo',n:'Mr. Sukizo',r:'Contest Committee',seat:'festival',lean:[L('one')],tell:'Remarkable!',note:''},
    {k:'renaud',n:'Tobias Renaud',r:'Head Judge, the Grand Festival',seat:'festival',lean:[L('fin')],tell:'Pen.',note:''},
    {k:'joy',n:'Nurse Joy',r:'Guest judge',seat:'guest',lean:[L('gm',null,'Healthiest, happiest Pokémon on stage'),L('intro')],tell:'Every scratch.',note:''},
    {k:'fantina',n:'Fantina',r:'Guest judge; Hearthome Gym Leader',seat:'guest',lean:[L('ty','Ghost')],tell:'She mouths the lines.',note:''},
    {k:'dawn',n:'Dawn',r:'Guest judge; Contest star',seat:'guest',lean:[L('intro')],tell:'Reads the trainer.',note:''}],
  panels:{jubilife:{n:'Jubilife',head:'sterling',guests:['joy','dawn']},hearthome:{n:'Hearthome',head:'voss',guests:['fantina','dawn','joy']},
    festival:{n:'Grand Festival',head:'renaud',second:'contesta',guests:['sukizo','dawn']}},
  circuit:['anselm','quintero','vik']};
const PACK=real?fs.readFileSync(path.join(DIR,'sinnoh-contest-judges.json'),'utf8'):JSON.stringify(small);
(async()=>{
  const {b,p,errs}=await open({admin:true,uid:'u1',tab:'contest'});
  const main=()=>p.evaluate(()=>document.getElementById('main').innerText);
  const draft=()=>p.evaluate(()=>S.ui.cs.judges.map(J=>({k:J.k,n:J.n,r:J.r,goals:J.goals})));
  await p.evaluate(()=>{S.ui.ct.v='live';render();});await W(p,800);
  // without a pack, nothing changes
  await click(p,{act:'cs_new'});await W(p);
  let d=await draft(),t=await main();
  ok(d.map(x=>x.n).join()==='Mr. Contesta,Mr. Sukizo,Nurse Joy'&&await p.evaluate(()=>document.querySelectorAll('[data-csx="jn"]').length)===3,'without a judge pack: Mr. Contesta, Mr. Sukizo and Nurse Joy, with names to type');
  ok(/Judge roster/.test(t)&&/none yet/.test(t)&&/Import a judge pack/.test(t),'the roster says there is none yet and offers the import');
  // importing
  await p.evaluate(()=>csjImport({text:async()=>JSON.stringify({format:'sinnoh-npc-pack',npcs:[]})}));await W(p);
  ok(!(await p.evaluate(()=>!!csRoster())),'an NPC pack is not taken as a judge pack');
  await p.evaluate(t=>csjImport({text:async()=>t}),PACK);await W(p,800);
  const R=await p.evaluate(()=>JSON.parse(JSON.stringify(csRoster())));
  const nJ=JSON.parse(PACK).judges.length;
  ok(R&&Object.keys(R.judges).length===nJ&&R.panels.hearthome&&R.panels.hearthome.head==='voss'&&R.circuit.length>=3,'the judge pack is imported: '+nJ+' judges, the halls’ panels and the Committee rotation');
  ok(await p.evaluate(()=>!JSON.stringify(S.contest||{}).includes('never looks at the trainer')),'the roster (with the tells) is in the GM’s own document, not the table’s');
  // the open setup takes the first hall's panel at once
  d=await draft();
  const hall0=await p.evaluate(()=>S.ui.cs.hall);
  ok(hall0==='jubilife'&&d[0].k==='sterling'&&R.circuit.indexOf(d[1].k)>=0&&d[2].k==='joy','the setup loads the hall’s panel: '+d.map(x=>x.n).join(', '));
  ok(await p.evaluate(k=>k===csjCircuit('jubilife'),d[1].k),'the second judge is this month’s Contest Committee judge');
  // rotation by month
  const rot=await p.evaluate(()=>{const out=[];const old=S.cond&&S.cond.date;S.cond=S.cond||{};['3000-06-10','3000-07-10','3000-08-10'].forEach(x=>{S.cond.date=x;out.push(csjCircuit('jubilife')+'|'+csjCircuit('hearthome'));});S.cond.date=old;return out;});
  ok(new Set(rot.map(x=>x.split('|')[0])).size===3&&rot.every(x=>x.split('|')[0]!==x.split('|')[1]),'the Committee judge rotates each month, and halls get different ones the same month ('+rot.join(' · ')+')');
  // another hall
  await pick(p,'[data-csx="hall"]','hearthome');await W(p);
  d=await draft();
  ok(d[0].n==='Mireille Voss'&&d[2].n==='Fantina'&&R.circuit.indexOf(d[1].k)>=0,'choosing Hearthome loads its panel: '+d.map(x=>x.n).join(', '));
  ok(d[0].goals[0].k==='ct'&&d[0].goals.filter(g=>g.k==='ct').length===1&&d.every(J=>J.goals.length===3&&new Set(J.goals.map(g=>g.k)).size===3),'every judge has three different goals, and the head judge’s first is the contest type');
  t=await main();
  ok(/Leans toward/.test(t)&&/Tell/.test(t)&&/never looks at the trainer/.test(t)&&/\(this month\)/.test(t),'the GM sees each judge’s role, leanings and tell, and which Committee judge is this month’s');
  // leanings
  const share=await p.evaluate(()=>{let hit=0,all=0;const lean=new Set(['el','up','one']);for(let i=0;i<300;i++){const J={k:'quintero',goals:[]};csRollGoals(J,'Cool',false);J.goals.forEach(g=>{all++;if(lean.has(g.k))hit++;});}return hit/all;});
  ok(share>0.6,'Roll goals mostly picks what the judge leans toward ('+Math.round(share*100)+'% for Rafael Quintero; at random it would be about 30%)');
  const joy=await p.evaluate(()=>{let n=0;for(let i=0;i<100;i++){const J={k:'joy',goals:[]};csRollGoals(J,'Cool',false);if(J.goals.some(g=>g.k==='gm'&&/Healthiest/.test(g.x)))n++;}return n;});
  ok(joy>50,'a goal the GM judges comes with its text (Nurse Joy’s “Healthiest, happiest Pokémon” in '+joy+' of 100 rolls)');
  // swapping a judge
  await pick(p,'[data-csx="jk"][data-j="2"]','dawn');await W(p);
  d=await draft();
  ok(d[2].k==='dawn'&&d[2].n==='Dawn'&&/Contest star/.test(d[2].r)&&d[2].goals.length===3,'swapping the third judge for Dawn gives her name, role and new goals');
  await pick(p,'[data-csx="jk"][data-j="2"]','');await W(p);
  d=await draft();
  ok(d[2].k===''&&await p.evaluate(()=>!!document.querySelector('[data-csx="jn"][data-j="2"]')),'“Type a name…” gives a name box for someone not in the roster');
  await p.evaluate(()=>{const i=document.querySelector('[data-csx="jn"][data-j="2"]');i.value='Lady Caroline';i.dispatchEvent(new Event('input',{bubbles:true}));});
  // a panel that is not a hall
  await pick(p,'[data-csx="jp"]','festival');await W(p);
  d=await draft();
  ok(d.map(x=>x.n).join()==='Tobias Renaud,Mr. Contesta,Mr. Sukizo','Load the panel for: Grand Festival gives Tobias Renaud, Mr. Contesta and Mr. Sukizo');
  // the roster list
  await click(p,{act:'cs_jro'});await W(p);
  t=await main();
  ok(/Head judges/.test(t)&&/Contest Committee/.test(t)&&/Guest judges/.test(t)&&/Hide the roster/.test(t),'Show the roster lists every judge by seat');
  // opening the contest
  await p.evaluate(()=>{const D=S.ui.cs;D.pcs.u1={on:true,m1:'p1',m2:''};D.pcs.u2={on:true,m1:'q1',m2:''};render();});await W(p);
  await click(p,{act:'cs_open'});await W(p,800);
  const pub=await p.evaluate(()=>JSON.parse(JSON.stringify(S.contest.judges)));
  ok(pub.length===3&&pub[0].k==='renaud'&&/Grand Festival/.test(pub[0].r)&&!JSON.stringify(pub).includes('Pen.'),'the table’s copy has each judge’s name and role, and no tell');
  t=await main();
  ok(/Head Judge, the Grand Festival/.test(t)&&/Tell/.test(t),'on the stage the GM sees the role and the tell');
  await p.evaluate(()=>{S.me.admin=false;render();});await W(p);
  t=await main();
  ok(/Head Judge, the Grand Festival/.test(t)&&!/Tell/.test(t),'a player sees the role, not the tell');
  ok(errs.length===0,'no page errors ('+errs.slice(0,3).join(' | ')+')');
  await b.close();
  console.log(real?'(used the real judge pack)':'(used a small judge pack; set JUDGES to use the real one)');
  console.log(fails?fails+' FAILED':'ALL PASSED');
  process.exit(fails?1:0);
})();
