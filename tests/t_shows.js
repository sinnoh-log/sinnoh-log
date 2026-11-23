/* More for the contest stage (Update 67): hall presets (built in and saved), the Poffin Cook-Off, the Visual and Dance stages,
   extra stages with a Star Point, Trainer Appeal, Rival Showcase, the crowd meter, and the Celestic and Daybreak twists. */
const {open,data}=require('./lib');
let fails=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fails++;};
const click=(p,a)=>p.evaluate(a=>{const b=document.createElement('button');Object.entries(a).forEach(([k,v])=>b.dataset[k]=v);b.hidden=true;document.body.appendChild(b);b.click();b.remove();},a);
const W=(p,n)=>p.waitForTimeout(n||350);
const phb=data.moves.filter(m=>m.ph).map(m=>m.n);
/* the seeded contest list: move i is [Cool, Beauty, Cute, Clever, Tough][i%5] with [Reliable, Good Show!, Attention Grabber, Reflective Appeal][i%4] */
const mv=i=>({name:phb[i],freq:'At-Will',kind:'Physical',range:'Melee',type:'Water',dice:'2d6',text:'',used:0});
const seedFn=S=>{
  Object.assign(S['trainers/u1'],{stats:{atk:6,def:4,spa:5,spd:8,spe:6},talents:{perform:2,nature:1}});
  S['trainers/u1/pokemon/p1'].moves=[mv(1),mv(3),mv(6),mv(11)];
  S['trainers/u1/pokemon/p1'].cs={beauty:3};
  S['gm/nt_r1']={name:'Rosa Vint',cat:'rival',order:1,team:[{id:'a',sp:'Altaria',ty:['Dragon','Flying'],hp:{cur:30,max:30},base:{atk:5,def:5,spa:5,spd:5,spe:7},mv:[{name:phb[16],type:'Dragon'},{name:phb[21],type:'Flying'}],ps:[],sh:{}}]};
  S['meta/conditions']={date:'2026-07-14'};
  return S;};
(async()=>{
  const {b,p,errs}=await open({admin:true,uid:'u1',tab:'contest',seedFn});
  const C=()=>p.evaluate(()=>JSON.parse(JSON.stringify(S.contest||{})));
  const main=()=>p.evaluate(()=>document.getElementById('main').innerText);
  const setIn=(csx,attrs,val)=>p.evaluate(([csx,attrs,val])=>{const t=document.createElement(csx==='pth'?'input':'select');t.dataset.csx=csx;Object.entries(attrs).forEach(([k,v])=>t.dataset[k]=v);if(t.tagName==='SELECT'){const o=document.createElement('option');o.value=val;t.appendChild(o);}t.value=val;document.body.appendChild(t);t.dispatchEvent(new Event('input',{bubbles:true}));t.remove();},[csx,attrs,val]);
  await p.evaluate(()=>{S.ui.ct.v='live';render();});await W(p,800);
  await click(p,{act:'cs_new'});await W(p);

  // presets
  await setIn('hall',{},'hearthome');await W(p);
  let D=await p.evaluate(()=>JSON.parse(JSON.stringify(S.ui.cs)));
  ok(D.var.vis&&D.var.dan&&D.var.sup&&D.var.ap&&D.theme==='Elegant'&&/Super Contest Hall/.test(D.note),'Hearthome’s preset: Visual and Dance stages, a random type each round, the crowd, theme Elegant');
  await setIn('hall',{},'sage');await W(p);
  D=await p.evaluate(()=>JSON.parse(JSON.stringify(S.ui.cs)));
  ok(D.type==='Clever'&&D.xs.tasting&&!D.var.vis,'Sage’s preset: Clever, with a tasting round');
  await setIn('hall',{},'majolica');await W(p);
  ok(await p.evaluate(()=>S.ui.cs.type===CT_TYPES[6%5]),'Majolica’s type follows the month (July: '+(await p.evaluate(()=>S.ui.cs.type))+')');
  await setIn('hall',{},'floaroma');await W(p);
  await p.evaluate(()=>{S.ui.cs.var.ta=true;S.ui.cs.tdc=12;});
  await click(p,{act:'cs_psave'});await W(p);
  await setIn('hall',{},'sage');await W(p);
  await setIn('hall',{},'floaroma');await W(p);
  D=await p.evaluate(()=>JSON.parse(JSON.stringify(S.ui.cs)));
  ok(D.var.ta&&num0(D.tdc)===12&&/your saved preset/.test(D.note)&&!!(await p.evaluate(()=>S.contestGm.presets&&S.contestGm.presets.floaroma)),'a saved preset comes back when the hall is picked again (in the GM’s document)');
  let t=await main();
  ok(/Trainer Appeal/.test(t)&&/Rival Showcase/.test(t)&&/Audience Participation/.test(t)&&/Visual stage/.test(t)&&/Pokéathlon/.test(t)&&/Dummy round/.test(t)&&/Composure/.test(t),'the setup has the new options, the extra stages and the hall twists');

  // a contest with everything
  await setIn('hall',{},'celestic');await W(p);
  await p.evaluate(()=>{const D=S.ui.cs;D.type='Beauty';Object.assign(D.var,{ta:true,rs:true,ap:true,vis:true,dan:true,sup:false,fest:false,hv:false,dbl:false});
    D.xs={fashion:true,dummy:true};D.tw={celestic:true,cook:true,dawn:true};D.theme='Moonlight';D.tdc=15;D.pcs.u1={on:true,m1:'p1'};D.nnt='r1';render();});
  await click(p,{act:'cs_npcadd'});await W(p,800);
  const nid=await p.evaluate(()=>S.ui.cs.npcs[0].id);
  await setIn('pair',{e:'p_u1'},nid);await W(p);
  ok(await p.evaluate(n=>S.ui.cs.pairs.p_u1===n&&S.ui.cs.pairs[n]==='p_u1',nid),'rival pairs go both ways');
  await setIn('ncb',{i:'0'},'4');
  await click(p,{act:'cs_open'});await W(p,700);
  let c=await C();
  ok(c.pre.join()==='cook,vis,dan,x:fashion,x:dummy'&&c.pairs.length===1&&c.cfav&&c.crowd===0&&c.tdc===15&&c.ents[nid].cb===4,'the contest opens with the Cook-Off, Visual, Dance, Fashion Show and Dummy round before the appeals, one rival pair and a crowd ('+c.cfav+')');
  t=await main();
  ok(/Crowd/.test(t)&&/Start: Poffin Cook-Off/.test(t)&&/Before the appeals|Introductions/i.test(t),'the stage shows the crowd meter and the GM’s Start: Poffin Cook-Off');

  // the Cook-Off
  await click(p,{act:'cs_pre'});await W(p);
  const bon=await p.evaluate(()=>({nat:csChkBonus(S.contest,'p_u1','nature'),perf:csChkBonus(S.contest,'p_u1','perform')}));
  ok(bon.nat===2+2&&bon.perf===4+5,'a player’s check adds the stat’s modifier and the talent (Nature +'+bon.nat+', Perform +'+bon.perf+')');
  await p.evaluate(()=>{S.ui.csp.d.p_u1='17';});
  await click(p,{act:'cs_pscore'});await W(p);
  c=await C();
  let r=c.pr.cook.res.p_u1;
  ok(r.t===21&&r.dice===4&&c.ents.p_u1.sh===r.hp&&c.ents.p_u1.hp===r.hp&&r.rd===1,'the Cook-Off: d20 17 typed + Nature 4 = 21, so 4d4 = '+r.hp+' Heart Points for every judge');

  // Visual
  await click(p,{act:'cs_pnext'});await W(p);
  await p.evaluate(()=>{S.ui.csp.d.p_u1='10';S.ui.csp.th.p_u1=true;});
  await click(p,{act:'cs_pscore'});await W(p);
  c=await C();
  r=c.pr.vis.res.p_u1;
  ok(r.t===10+9+3+2&&/3 contest stat/.test(r.txt)&&/2 theme/.test(r.txt)&&r.dice===4,'Visual: d20 10 + Perform 9 + Beauty stat 3 + 2 for the theme = 24, so 4d4');

  // Dance
  await click(p,{act:'cs_pnext'});await W(p);
  for(let bt=0;bt<4;bt++){await p.evaluate(([n,bt])=>{S.ui.csp.d.p_u1=bt%2?'2':'19';S.ui.csp.d[n]=bt%2?'18':'3';},[nid,bt]);await click(p,{act:'cs_beat'});await W(p,250);}
  c=await C();
  const dd=await p.evaluate(()=>csDanceDice(S.contest.pr.dan.beats,csEnts()));
  ok(c.pr.dan.beats.length===4&&c.pr.dan.beats[0].lead===c.eord[0]&&c.pr.dan.beats[1].lead===c.eord[1],'four beats, the lead turning through the contestants');
  t=await main();
  ok(/Beat 4/.test(t)&&/Roll the Heart Points/.test(t),'the dance table shows every beat');
  await click(p,{act:'cs_dscore'});await W(p);
  c=await C();
  ok(c.pr.dan.done&&c.pr.dan.res.p_u1.dice===dd.p_u1&&c.pr.dan.res[nid].dice===dd[nid]&&dd.p_u1+dd[nid]===4,'the dance pays 1d4 per beat to whoever matched the lead, or to the lead for each miss ('+dd.p_u1+' and '+dd[nid]+')');

  // Fashion Show and the Dummy round
  await click(p,{act:'cs_pnext'});await W(p);
  await p.evaluate(n=>{S.ui.csp.d.p_u1='15';S.ui.csp.d[n]='2';},nid);
  await click(p,{act:'cs_pscore'});await W(p);
  c=await C();
  ok(c.pr['x:fashion'].win.join()==='p_u1'&&!c.ents.p_u1.hp_from_fashion,'the Fashion Show’s top contestant earns its Star Point (no Heart Points)');
  await click(p,{act:'cs_pnext'});await W(p);
  t=await main();
  ok(/Dummy round/.test(t)&&/Roll Dummy round/.test(t)&&await p.evaluate(()=>!!document.querySelector('select[data-csx="pmv"]')),'the Dummy round asks for a damaging move');
  await p.evaluate(n=>{S.ui.csp.mv.p_u1=S.trainers&&csDummyMoves(S.contest.ents.p_u1)[0].n;S.ui.csp.dm.p_u1='12';},nid);
  await click(p,{act:'cs_pscore'});await W(p);
  c=await C();
  r=c.pr['x:dummy'].res.p_u1;
  ok(r&&r.t>=12&&/typed 12/.test(r.txt),'Dummy round: '+r.txt);
  await click(p,{act:'cs_pnext'});await W(p);
  c=await C();
  ok(c.stage==='appeal'&&c.round===1,'after the last stage, the appeals start');

  // round 1: a Trainer Appeal and the crowd
  await p.evaluate(()=>{edit('cs','contest','cfav','Beauty');edit('cs','contest','crowd',8);edit('cs','contest','cur','p_u1');});
  await p.evaluate(n=>{S.ui.csa={e:'p_u1',j:'0',m0:n,m1:'',tf:'0',any:'',st:'',real:true,sum:'5',ta:true,tsk:'perform',td:'20'};render();},phb[1]);
  t=await main();
  ok(/Add a Trainer Appeal/.test(t)&&/vs 15/.test(t),'the appeal form offers the Trainer Appeal, against 15');
  const hp0=(await C()).ents.p_u1.hp;
  await click(p,{act:'cs_go',e:'p_u1'});await W(p);
  c=await C();
  let L=c.log[c.log.length-1];
  ok(L.ta&&L.ta.t===29&&L.ta.dice===4&&c.ents.p_u1.ta===1,'Trainer Appeal: d20 20 + Perform 9 = 29, beating 15 by 5 or more: 4d4 = '+(L.ta&&L.ta.hp));
  ok(L.cr>0&&c.crowd===0&&c.ents.p_u1.hp===hp0+L.tot,'a Beauty appeal that raises the Voltage fills the crowd (8 + 2 + 1 + 1): +'+L.cr+' and the meter empties');
  await p.evaluate(()=>{edit('cs','contest','cur','p_u1');});
  ok(await p.evaluate(()=>{S.ui.csa={};render();return !/Add a Trainer Appeal/.test(document.getElementById('main').innerText);}),'a Trainer Appeal is once per contest');
  await p.evaluate(()=>{edit('cs','contest','cur','');});
  await click(p,{act:'cs_skip'});await W(p);
  await p.evaluate(n=>{edit('cs','contest','cur',n);},nid);
  await click(p,{act:'cs_skip'});await W(p);
  await click(p,{act:'cs_round'});await W(p);
  c=await C();
  const rv=c.log.find(x=>x.k==='rs'&&x.r===1);
  ok(rv&&rv.e==='p_u1'&&rv.vs==='Rosa Vint'&&rv.tot>=2&&c.round===2,'Rival Showcase: Mira out-scored Rosa in round 1 and gets 2d4 (+'+(rv&&rv.tot)+')');

  // round 2: Celestic composure
  await p.evaluate(()=>{edit('cs','contest','cur','p_u1');});
  const w=await p.evaluate(n=>csWork(S.contest,'p_u1',{j:1,m0:n}),phb[3]);
  ok(w.pen===true&&w.c.rel==='x','a Clever move clashes with Beauty: Composure applies');
  await p.evaluate(n=>{S.ui.csa={e:'p_u1',j:'1',m0:n,real:false};},phb[3]);
  await click(p,{act:'cs_go',e:'p_u1'});await W(p);
  c=await C();
  L=c.log[c.log.length-1];
  ok(L.pen>=1&&L.pen<=4,'it loses 1d4 (−'+L.pen+')');
  await p.evaluate(()=>{edit('cs','contest','crowd',9);edit('cs','contest','cfav','Clever');edit('cs','contest','round',3);edit('cs','contest','done',[]);edit('cs','contest','cur','p_u1');});
  await p.evaluate(n=>{S.ui.csa={e:'p_u1',j:'1',m0:n,real:false};},phb[3]);
  await click(p,{act:'cs_go',e:'p_u1'});await W(p);
  c=await C();
  L=c.log[c.log.length-1];
  ok(L.zero===1&&L.tot===0&&!L.cr&&c.crowd===8,'a repeated move only costs the crowd (9 → '+c.crowd+'), even when it matches the favourite');

  // Daybreak and the awards
  await p.evaluate(()=>{edit('cs','contest','round',5);});
  const dw=await p.evaluate(n=>csWork(S.contest,'p_u1',{j:2,m0:n}).parts.map(x=>x.why).join('|'),phb[6]);
  ok(/first light/.test(dw),'Daybreak: final-round appeals get +1d4 for first light');
  await p.evaluate(()=>{edit('cs','contest','done',S.contest.eord.slice());edit('cs','contest','cur','');});
  await click(p,{act:'cs_awards'});await W(p);
  c=await C();
  ok(c.aw&&(c.aw.X||[]).length===2&&c.aw.X[0].n==='Fashion Show'&&c.aw.X[0].win.join()==='p_u1'&&c.aw.stars.p_u1>=1,'the awards list the extra stages, and the Fashion Show Star Point counts');
  const hpG=await p.evaluate(()=>{const A=csScores(S.contest,{goals:[[{k:'hp'}],[{k:'hp'}],[{k:'hp'}]]});return A.J[2].goals[0].sc.p_u1;});
  ok(hpG>=c.ents.p_u1.sh,'stage Heart Points count toward every judge’s Most Heart Points goal');
  t=await main();
  ok(/Extra stages/.test(t)&&/Fashion Show/.test(t),'the table sees the extra stages in the awards');
  ok(errs.length===0,'no page errors ('+errs.slice(0,3).join(' | ')+')');
  await b.close();
  console.log(fails?fails+' FAILED':'ALL PASSED');
})();
function num0(v){return +v||0;}
