/* The live contest stage (Update 66): set up (hall, type, variations, judges' hidden goals, contestants), introductions with
   revealed goals, five rounds of appeals scored with the Appeal helper's sums (Option B: each appeal counts for one judge),
   players' appeals sent from their own screen and scored on the GM's page, typed dice, undo, and awards that tick the
   ribbon and log the contest rankings. */
const {open,data}=require('./lib');
let fails=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fails++;};
const click=(p,a)=>p.evaluate(a=>{const b=document.createElement('button');Object.entries(a).forEach(([k,v])=>b.dataset[k]=v);b.hidden=true;document.body.appendChild(b);b.click();b.remove();},a);
const W=(p,n)=>p.waitForTimeout(n||400);
const phb=data.moves.filter(m=>m.ph).map(m=>m.n);
/* the seeded contest list: move i is [Cool, Beauty, Cute, Clever, Tough][i%5] with [Reliable, Good Show!, Attention Grabber, Reflective Appeal][i%4] */
const mv=i=>({name:phb[i],freq:'At-Will',kind:'Physical',range:'Melee',type:'Water',dice:'2d6',text:'',used:0});
const seedFn=S=>{
  S['trainers/u1/pokemon/p1'].moves=[mv(1),mv(0),mv(6)];
  S['trainers/u1/pokemon/p1'].cs={beauty:3};
  S['trainers/u3']=Object.assign(S['trainers/u3'],{noCon:false});
  S['trainers/u3/pokemon/c1']={species:'Cherubi',nick:'',types:['Grass'],slot:'party',order:1,createdAt:1,hp:{cur:24,max:24},moves:[mv(6),mv(11)]};
  S['gm/nt_r1']={name:'Rosa Vint',cat:'rival',order:1,team:[{id:'a',sp:'Altaria',ty:['Dragon','Flying'],hp:{cur:30,max:30},base:{atk:5,def:5,spa:5,spd:5,spe:7},mv:[{name:phb[16],type:'Dragon'},{name:phb[21],type:'Flying'}],ps:[],sh:{}}]};
  S['meta/conditions']={date:'2026-07-14',rkcb:{seed:7,n:20,wk:2}};
  return S;};
(async()=>{
  const {b,p,errs}=await open({admin:true,uid:'u1',tab:'contest',seedFn});
  const C=()=>p.evaluate(()=>JSON.parse(JSON.stringify(S.contest||{})));
  const main=()=>p.evaluate(()=>document.getElementById('main').innerText);
  await p.evaluate(()=>{S.ui.ct.v='live';render();});await W(p,800);
  let t=await main();
  ok(/Live stage/.test(t)&&/Set up a contest/.test(t),'the Contests page opens on the Live stage, with Set up a contest for the GM');

  // setting up
  await click(p,{act:'cs_new'});await W(p);
  await p.evaluate(()=>{const D=S.ui.cs;D.hall='hearthome';D.type='Beauty';
    D.judges[0].goals=[{k:'ct',t:'Beauty'},{k:'hp',t:''},{k:'cnt',t:''}];
    D.judges[1].goals=[{k:'one',t:''},{k:'el',t:''},{k:'var',t:''}];
    D.judges[2].goals=[{k:'intro',t:''},{k:'ty',t:'Water'},{k:'fin',t:''}];
    D.pcs.u1={on:true,m1:'p1',m2:''};D.pcs.u3={on:true,m1:'c1',m2:''};D.nnt='r1';render();});await W(p);
  t=await main();
  ok(/Judges and their hidden goals/i.test(t)&&/Contestants/i.test(t)&&/Double Performance/.test(t)&&/High Voltage/.test(t),'the setup has the hall, type, variations, judges’ goals and contestants');
  await click(p,{act:'cs_roll',j:'0'});await W(p);
  ok(await p.evaluate(()=>{const g=S.ui.cs.judges[0].goals,g1=S.ui.cs.judges[1].goals;return g.length===3&&g[0].k==='ct'&&g[0].t==='Beauty'&&new Set(g.map(x=>x.k)).size===3&&g1.length===3&&new Set(g1.map(x=>x.k)).size===3;}),'Roll goals gives three different goals; the first judge’s first is the contest type');
  await p.evaluate(()=>{S.ui.cs.judges[0].goals=[{k:'ct',t:'Beauty'},{k:'hp',t:''},{k:'cnt',t:''}];});
  await click(p,{act:'cs_npcadd'});await W(p,800);
  ok(await p.evaluate(()=>S.ui.cs.npcs.length===1&&S.ui.cs.npcs[0].name==='Rosa Vint'&&S.ui.cs.npcs[0].mons[0].mv.length===2),'an NPC coordinator comes from an NPC sheet, with their Pokémon’s moves');
  await click(p,{act:'cs_open'});await W(p,700);
  let c=await C();
  const goalsPub=JSON.stringify(c).indexOf('Most appeals made')>=0;
  ok(c.on&&c.stage==='intro'&&c.eord.length===3&&c.judges.length===3&&c.name==='Hearthome Contest'&&!goalsPub,'the contest opens at the introductions, three contestants, and no hidden goal in the table’s copy');
  ok(await p.evaluate(()=>(S.contestGm.goals||[]).length===3),'the judges’ goals are in the GM’s own document');
  ok(await p.evaluate(()=>tabCount('contest')==='LIVE'),'the menu shows LIVE next to Contests');
  await click(p,{act:'cs_rev',j:'0',g:'2'});await W(p);
  c=await C();
  ok(c.gl&&c.gl['0-2']&&/Most appeals made/.test(c.gl['0-2'].t),'a goal revealed by an Insight check reaches the table');
  const ihp=await p.evaluate(()=>num(S.contest.ents.p_u3.hp));
  await click(p,{act:'cs_bonus',e:'p_u3'});await W(p);
  ok(await p.evaluate(h=>num(S.contest.ents.p_u3.hp)>h,ihp),'the GM can give 1d4 Heart Points for an introduction');

  // round 1
  await click(p,{act:'cs_start'});await W(p);
  c=await C();
  ok(c.stage==='appeal'&&c.round===1&&c.cur===c.eord[0]&&c.order.join()===c.eord.join(),'the appeals start: round 1 in entry order, '+c.ents[c.cur].name+' first');
  const ap1=await p.evaluate(n=>{S.ui.csa={e:'p_u1',j:'0',m0:n,m1:'',tf:'0',any:'',st:'2',real:false,sum:''};render();const w=csWork(S.contest,'p_u1',S.ui.csa);return {dice:w.dice,kw:w.kw,type:w.type,v1:w.v1,stat:w.stat};},phb[1]);
  ok(ap1.kw==='Good Show!'&&ap1.type==='Beauty'&&ap1.dice===2&&ap1.v1===1&&ap1.stat===2,'Mira’s appeal: Good Show! (1d4) + 1d4 matching Beauty, 2 from the Beauty stat, Voltage 0 → 1');
  t=await main();
  ok(/Roll 2d4/.test(t)&&/Voltage 0 → 1/.test(t),'the form says what to roll and what happens to the Voltage');
  await click(p,{act:'cs_go',e:'p_u1'});await W(p);
  c=await C();
  let L=c.log[c.log.length-1];
  ok(L&&L.e==='p_u1'&&L.dice===2&&L.tot===L.sum+2&&c.judges[0].v===1&&c.ents.p_u1.hp===L.tot&&c.ents.p_u1.spent.Beauty===2&&c.cur==='p_u3','the GM’s page scores it: '+L.tot+' ♥, Voltage 1, the stat spent, and Cora is next');

  // a player's appeal from their own screen
  await p.evaluate(n=>{S.me.admin=false;S.me.id='u3';S.ui.csa={};render();},phb[6]);await W(p);
  t=await main();
  ok(/Make the appeal/.test(t)&&!/Most Heart Points with Beauty/.test(t)&&/Most appeals made/.test(t),'Cora sees her own appeal form, the revealed goal, and none of the hidden ones');
  await p.evaluate(n=>{S.ui.csa.m0=n;S.ui.csa.j='1';},phb[6]);
  await p.evaluate(()=>{const b=document.querySelector('[data-act="cs_go"]');b.click();});await W(p);
  ok(await p.evaluate(()=>!!(S.trainers.u3.ctap&&S.trainers.u3.ctap.e==='p_u3'&&S.trainers.u3.ctap.j===1)),'her appeal is sent on her own sheet');
  t=await main();
  ok(/waiting for the GM/.test(t),'her button says it is waiting for the GM’s screen');
  await p.evaluate(()=>{S.me.admin=true;S.me.id='u1';render();});await W(p,800);
  c=await C();
  L=c.log[c.log.length-1];
  ok(L&&L.e==='p_u3'&&L.by==='pc'&&num0(L.j)===1&&c.cur===c.order[2],'the GM’s page scores Cora’s appeal by itself ('+(L&&L.tot)+' ♥ to '+(c.judges[1]||{}).n+')');

  // an NPC, with real dice typed
  const ne=c.cur;
  const nw=await p.evaluate(([e,n])=>{S.ui.csa={e,j:'1',m0:n,m1:'',tf:'0',any:'',st:'',real:true,sum:'99'};render();return csWork(S.contest,e,S.ui.csa).dice;},[ne,phb[16]]);
  await click(p,{act:'cs_go',e:ne});await W(p);
  ok(await p.evaluate(()=>S.contest.log.length)===2,'a typed total the dice cannot make is refused');
  await p.evaluate(s=>{S.ui.csa.sum=String(s);},nw);
  await click(p,{act:'cs_go',e:ne});await W(p);
  c=await C();
  L=c.log[c.log.length-1];
  ok(L&&L.e===ne&&L.rd===1&&L.sum===nw,'Rosa’s appeal with typed dice: '+nw+'d4 typed '+nw+' (the GM picked the move and judge)');
  t=await main();
  ok(/Start round 2/.test(t)&&/real dice/.test(t),'after everyone, the GM starts round 2; the log marks real dice');

  // undo
  await click(p,{act:'cs_undo'});await W(p);
  c=await C();
  ok(c.log.length===2&&c.cur===ne,'Undo last takes Rosa’s appeal back');
  await p.evaluate(([e,n])=>{S.ui.csa={e,j:'0',m0:n,m1:'',tf:'0',any:'',st:'',real:false,sum:''};},[ne,phb[16]]);
  await click(p,{act:'cs_go',e:ne});await W(p);

  // round 2: order by Heart Points, a repeated move earns nothing
  await click(p,{act:'cs_round'});await W(p);
  c=await C();
  const byHp=c.eord.slice().sort((a,z)=>c.ents[z].hp-c.ents[a].hp);
  const hps=c.order.map(e=>c.ents[e].hp);
  ok(c.round===2&&hps.every((v,i)=>i===0||hps[i-1]>=v)&&c.order[0]&&c.ents[c.order[0]].hp===c.ents[byHp[0]].hp&&c.done.length===0,'round 2 goes in order of Heart Points ('+hps.join(', ')+')');
  await p.evaluate(()=>{edit('cs','contest','cur','p_u1');});
  await p.evaluate(n=>{S.ui.csa={e:'p_u1',j:'0',m0:n,m1:'',tf:'0',any:'',st:'',real:false,sum:''};},phb[1]);
  await click(p,{act:'cs_go',e:'p_u1'});await W(p);
  c=await C();
  L=c.log[c.log.length-1];
  ok(L.zero===1&&L.tot===0,'the same move twice in a row earns no Heart Points');

  // Electrified
  await p.evaluate(()=>{const j=S.contest.judges.map(x=>Object.assign({},x));j[0].v=4;edit('cs','contest','judges',j);edit('cs','contest','cur','p_u3');});
  const el=await p.evaluate(n=>{S.ui.csa={e:'p_u3',j:'0',m0:n,m1:'',tf:'0',any:'',st:'',real:false,sum:''};return csWork(S.contest,'p_u3',S.ui.csa);},phb[11]);
  await click(p,{act:'cs_go',e:'p_u3'});await W(p);
  c=await C();
  L=c.log[c.log.length-1];
  ok(el.v1===5&&L.rs===1&&c.judges[0].el===true&&el.parts.some(x=>/reaches 5/.test(x.why)),'reaching 5 Voltage Electrifies the judge and adds 3d4');
  const x2=await p.evaluate(()=>{const w=csWork(S.contest,S.contest.order.find(e=>e!=='p_u3'&&e!=='p_u1'),{j:0,m0:S.contest.ents[S.contest.order.find(e=>e!=='p_u3'&&e!=='p_u1')].mons[0].mv[0].n});return w.x2;});
  ok(x2===true,'later appeals to an Electrified judge double');

  // the variations, worked on a small made-up contest
  const V=await p.evaluate(([a,bb])=>{
    const base={on:1,round:1,type:'Beauty',var:{},judges:[{n:'A',fav:'Beauty',v:0}],eord:['x','y'],log:[],
      ents:{x:{k:'npc',name:'X',mons:[{name:'One',mv:[{n:a}]},{name:'Two',mv:[{n:bb}]}],hp:0},y:{k:'npc',name:'Y',mons:[{name:'Z',mv:[{n:a}]}],hp:0}}};
    const D=Object.assign({},base,{var:{dbl:1}});
    const w0=csWork(D,'x',{j:0,m0:a,m1:bb,tf:0}),w1=csWork(D,'x',{j:0,m0:a,m1:bb,tf:1});
    const H=Object.assign({},base,{var:{hv:1},judges:[{n:'A',fav:'Beauty',v:1}]});
    const h1=csWork(H,'y',{j:0,m0:a});
    const HE=Object.assign({},base,{var:{hv:1},judges:[{n:'A',fav:'Beauty',v:5,el:true}]});
    const h2=csWork(HE,'y',{j:0,m0:a});
    const SU=Object.assign({},base,{var:{sup:1},rt:'Cool'});
    const FE=Object.assign({},base,{var:{fest:1},judges:[{n:'A',fav:'Cute',v:0}]});
    const HO=Object.assign({},base,{judges:[{n:'A',fav:'Beauty',v:2,hold:true}]});
    return {d0:[w0.type,w0.kw],d1:[w1.type,w1.kw],hv:h1.parts.map(p=>p.why+':'+p.n),hvx2:h2.x2,hvel:h2.parts.some(p=>/Electrified/.test(p.why)&&p.n===5),
      sup:csCType(SU,0),fest:csCType(FE,0),hold:csWork(HO,'y',{j:0,m0:a}).v1};
  },[phb[1],phb[0]]);
  ok(V.d0.join()==='Beauty,Reliable'&&V.d1.join()==='Cool,Good Show!','Double Performance: one move’s contest type with the other’s keyword, either way round');
  ok(V.hv.some(x=>/High Voltage: the judge rose to 2:2/.test(x))&&V.hvx2===false&&V.hvel,'High Voltage: a rise adds that many d4; an Electrified judge adds 5d4 instead of doubling');
  ok(V.sup==='Cool'&&V.fest==='Cute','Super Contest uses the round’s type; Festival the judge’s own');
  ok(V.hold===2,'Hold That Thought keeps a judge’s Voltage from rising');

  // to the awards
  for(let r=0;r<40;r++){
    const s=await p.evaluate(()=>({round:S.contest.round,cur:S.contest.cur,all:(S.contest.done||[]).length>=S.contest.eord.length}));
    if(s.round>=5&&s.all)break;
    if(s.all)await click(p,{act:'cs_round'});else await click(p,{act:'cs_skip'});
    await W(p,250);
  }
  ok(await p.evaluate(()=>S.contest.round===5),'five rounds');
  t=await main();
  ok(/Reveal the awards/.test(t)&&/Star Points so far/.test(t),'after round 5 the GM can reveal the awards');
  const sc=await p.evaluate(()=>{const A=csScores(S.contest,S.contestGm);return A.J.map(J=>J.goals.map(g=>g.txt+'→'+g.win.join('/')).join(' | '));});
  ok(sc.length===3&&/Most Heart Points with Beauty moves/.test(sc[0])&&/Best introduction/.test(sc[2]),'the GM sees each goal and who has earned it so far');
  await p.evaluate(()=>{const ov={};[0,1,2].forEach(j=>[0,1,2].forEach(g=>{ov[j+'-'+g]='p_u1';}));ov['2-0']='p_u3';edit('cg','contest','ov',ov);});await W(p);
  await click(p,{act:'cs_awards'});await W(p);
  c=await C();
  ok(c.stage==='awards'&&c.aw&&c.aw.stars.p_u1===8&&c.aw.stars.p_u3===1&&c.aw.rank[0]==='p_u1','the awards: Mira 8 Star Points, Cora 1 (the GM overruled the counts)');
  t=await main();
  ok(/Winner/.test(t)&&/Record ribbon and rankings/.test(t)&&/Most Heart Points with Beauty moves/.test(t),'the table sees the goals, the winners and the GM’s Record button');
  await click(p,{act:'cs_rec'});await W(p,900);
  const R=await p.evaluate(()=>({rib:!!(S.trainers.u1.ribbons||{}).hearthome,aw:Object.values(S.awards).some(a=>a.uid==='u1'&&a.type==='Contest Ribbon'&&a.ribbon==='hearthome'),
    rk:rkWith('con',()=>rkLog().filter(e=>e.u==='u1'&&e.e==='ribbon').length),rk2:rkWith('con',()=>rkLog().filter(e=>e.u==='u3'&&e.e==='second').length),done:S.contest.stage}));
  ok(R.rib&&R.aw,'Mira’s Hearthome ribbon is ticked, with a Contest Ribbon honor');
  ok(R.rk===1&&R.rk2===1&&R.done==='done','the contest circuit rankings log Won a contest ribbon for Mira and Placed second for Cora');
  await click(p,{act:'cs_close'});await click(p,{act:'cs_close'});await W(p);
  ok(await p.evaluate(()=>!S.contest.on&&tabCount('contest')===0),'Close the contest takes it off the stage');
  ok(errs.length===0,'no page errors ('+errs.slice(0,3).join(' | ')+')');
  await b.close();
  console.log(fails?fails+' FAILED':'ALL PASSED');
})();
function num0(v){return +v||0;}
