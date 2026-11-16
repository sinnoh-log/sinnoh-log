/* Road battles (Update 56): a GM-only panel that rolls the trainers the party meets on the road, settles one opposed roll per
   battle, rolls what it cost, pays out on a button and records the battle on the Gym circuit rankings. */
const {open,ROOT}=require('./lib');
let fails=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fails++;};
const click=(p,a)=>p.evaluate(a=>{const b=document.createElement('button');Object.entries(a).forEach(([k,v])=>b.dataset[k]=v);b.hidden=true;document.body.appendChild(b);b.click();b.remove();},a);
const W=(p,n)=>p.waitForTimeout(n||500);
const mon=(id,sp,ty)=>({id,sp,ty:[ty,''],hp:{cur:30,max:30},base:{atk:5,def:5,spa:5,spd:5,spe:5},bonus:{atk:0,def:0,spa:0,spd:0,spe:0},mv:[],ps:[],sh:{}});
const seedFn=S=>{
  Object.assign(S['trainers/u1'],{level:6,badges:{coal:true,forest:true},credits:1000});
  Object.assign(S['trainers/u3'],{level:1,credits:100});
  S['trainers/u3/pokemon/c1']={species:'Cherubi',nick:'',types:['Grass'],slot:'party',order:1,createdAt:1,hp:{cur:20,max:24},moves:[]};
  S['meta/conditions']={date:'2026-07-14',
    rkb:{seed:12345,n:300,wk:4},
    rk:{npc:[{k:'r1',n:'Dawn Ortega',p:120,s:'',h:'Hearthome',nt:'rv1'}]},
    trip:{from:'jubilife-city',to:'oreburgh-city',pace:'steady',who:'',steps:[{r:'route-203',a:'jubilife-city',b:'oreburgh-city',n:'',t:3,days:3}],pos:0,into:1,day:1,start:'2026-07-13',log:[],done:false,zone:'road'}};
  S['gm/nt_rv1']={name:'Dawn Ortega',cat:'rival',order:1,team:[mon('a','Drifloon','Ghost'),mon('b','Misdreavus','Ghost'),mon('c','Mismagius','Ghost')],q:{on:true,r:'2',cls:'performer',ty:'Ghost'}};
  return S;};
(async()=>{
  let {b,p,errs}=await open({admin:true,uid:'u1',tab:'cal',seedFn});
  const txt=()=>p.evaluate(()=>{const e=document.getElementById('roadbattles');return e?e.innerText:'';});
  let t=await txt();
  ok(/Road battles/.test(t)&&/GM only/.test(t),'the GM sees the Road battles panel on the Calendar');
  ok(/On Route 203, Jubilife City to Oreburgh City/.test(t),'it follows the trip: the party is on Route 203 ('+t.split('\n').find(l=>/Route 203/.test(l))+')');

  // the numbers
  const U=await p.evaluate(()=>({
    res:[5,4,0,-1,-4,-5,-12].map(rdbResult).join(','),
    lv:[1,5,6,10,11,20].map(rdbLvlBonus).join(','),bd:[0,1,2,3,4,8].map(rdbBdBonus).join(','),
    prize:[0,3,8].map(rdbPrize).join(','),rank:[0,1,2,3,4,5,6,8].map(rdbRankOfBadges).join(''),
    road:RDB_COUNT.road.join(''),semi:RDB_COUNT.semi.join(''),off:RDB_COUNT.off.join('')}));
  ok(U.res==='clean,hard,hard,close,close,rout,rout','margins: 5+ clean, 0–4 hard (ties to the player), −1 to −4 close, −5 or worse rout');
  ok(U.lv==='1,1,2,2,3,4'&&U.bd==='0,0,1,1,2,4','player bonus: +1 per 5 levels rounded up, +1 per 2 badges');
  ok(U.prize==='300,1200,2700','prize: 300 P × (loser’s badges + 1)');
  ok(U.rank==='11223344','rank from badges: 0–1 Novice, 2–3 Skilled, 4–5 Experienced, 6+ Ace');
  ok(U.road==='001112'&&U.semi==='000011'&&U.off==='000001','d6 by zone: road 3–5 one, 6 two; semi 5–6 one; off 6 one');

  // travelling trainers
  const M=await p.evaluate(()=>{
    const C=rdbCands(),d0=rdbDay();let moved=0,onRoute=0;
    C.rows.slice(0,120).forEach(r=>{const a=rdbLoc(r,C.W,d0),b=rdbLoc(r,C.W+1,d0+3);if(a.txt!==b.txt)moved++;if(a.route)onRoute++;});
    const P=rdbParty(),hop=rdbHops(P.nodes);
    const near=C.rows.filter(r=>rdbNear(P,rdbLoc(r,C.W,d0),hop)>=12).length;
    return {n:C.rows.length,moved,onRoute,near,ex:rdbLoc(C.rows[0],C.W,d0).txt};
  });
  ok(M.n===301,'the whole board can turn up: 300 field trainers and the tracked rival ('+M.n+')');
  ok(M.moved>60&&M.onRoute>40,'trainers travel: '+M.moved+' of 120 are somewhere else a week and 3 days later; '+M.onRoute+' are out on a route today (e.g. “'+M.ex+'”)');
  ok(M.near>=1,'some trainers are on Route 203 with the party today ('+M.near+')');
  const D=await p.evaluate(()=>{
    let same=0,n=0;const P=rdbParty(),hop=rdbHops(P.nodes),C=rdbCands();
    const byId={};C.rows.forEach(r=>{byId[r.id]=r;});
    for(let i=0;i<150;i++){const f=rdbDraw(1,new Set()).foes[0];if(!f)continue;n++;const L=rdbLoc(byId[f.id],C.W,rdbDay());if(rdbNear(P,L,hop)>=2)same++;}
    return {same,n};
  });
  ok(D.n===150&&D.same/D.n>0.7,'the draw favours trainers near the party: '+D.same+' of '+D.n+' were on Route 203 or a town away');
  const T=await p.evaluate(()=>{
    const C=rdbCands(),out=[];
    C.rows.filter(r=>r.kind==='bg').slice(0,40).forEach(r=>{const f=rdbFoe(r,{txt:'x'},C.W);const sv=(S.teamGm.f||{})[r.id]||grTeamOf(r,C.W);out.push({ty:f.ty,team:f.team,okTy:!!sv&&f.ty===sv.ty&&f.team.every(s=>sv.sp.includes(s)),match:f.team.filter(s=>{const i=speciesInfo(s);return i&&i.types.indexOf(f.ty)>=0;}).length,n:f.n,rank:f.rank,size:f.team.length,bonus:f.rb+f.bb,bd:f.bd});});
    const rv=C.rows.find(r=>r.id==='n_r1'),fr=rdbFoe(rv,{txt:'x'},C.W);
    const home=rdbHomeType('Somebody','Oreburgh'),away=rdbHomeType('Somebody','Kanto');
    return {out,fr,home,away,rocky:['Rock','Ground','Steel','Fighting'].includes(home),hasAway:TYPES.includes(away)};
  });
  const mt=T.out.reduce((a,x)=>a+x.match,0),all=T.out.reduce((a,x)=>a+x.size,0);
  ok(mt/all>0.4,'most of what they bring is their favourite type ('+mt+' of '+all+')');
  ok(T.out.every(x=>x.okTy&&x.size===x.n),'every field trainer brings members of their saved team, sized to the challenge, favouring their type (e.g. '+T.out[0].ty+': '+T.out[0].team.join(', ')+')');
  ok(T.out.every(x=>x.rank===(x.bd>=6?'4':x.bd>=4?'3':x.bd>=2?'2':'1')&&x.bonus===({'1':1,'2':2,'3':3,'4':4}[x.rank]+Math.floor(x.bd/2))),'foe bonus = rank (from badges) + 1 per 2 badges');
  ok(T.out.every(x=>x.n>=({'1':1,'2':1,'3':2,'4':3}[x.rank])&&x.n<=({'1':1,'2':2,'3':3,'4':3}[x.rank])),'challenge size by rank: Novice 1, Skilled 1–2, Experienced 2–3, Ace 3');
  ok(T.fr.rank==='2'&&T.fr.ty==='Ghost'&&T.fr.team.every(s=>['Drifloon','Misdreavus','Mismagius'].includes(s))&&T.fr.team.length===T.fr.n,'a rival with a Quick NPC sheet keeps the sheet’s rank, type and team ('+T.fr.team.join(', ')+')');
  ok(T.rocky&&T.hasAway,'hometown sets the type: Oreburgh leans Rock, Ground, Steel or Fighting ('+T.home+'); a visitor from Kanto can be anything');

  // the day: a 6 on the road brings two
  await p.evaluate(()=>{S.ui.rdb.d6='6';});
  await click(p,{act:'rdb_roll'});await W(p);
  let cur=await p.evaluate(()=>S.roadGm.cur);
  ok(cur&&cur.d6===6&&cur.typed===1&&cur.want===2&&cur.foes.length===2,'your d6 of 6 on the road: two trainers want a battle');
  t=await txt();
  ok(/two trainers want a battle/.test(t)&&/Wants a \d-on-\d battle/.test(t)&&/Their roll: d20 \+ \d/.test(t)&&/(On the way from|Training around|Touring Sinnoh|Resting in) /.test(t),'each card shows their journey, the challenge, the team and the foe’s roll');
  const [f1,f2]=cur.foes;
  // decline, then undo
  await click(p,{act:'rdb_no',k:f1.k});await W(p);
  ok(await p.evaluate(k=>S.roadGm.cur.foes.find(x=>x.k===k).st,f1.k)==='no'&&await p.evaluate(()=>S.roadGm.log.slice(-1)[0].res)==='no','Declined: the card says so and the log keeps it');
  await click(p,{act:'rdb_undo',k:f1.k});await W(p);
  ok(await p.evaluate(k=>S.roadGm.cur.foes.find(x=>x.k===k).st,f1.k)==='open'&&await p.evaluate(()=>S.roadGm.log.length)===0,'Undo puts the challenge back');
  // swap
  await click(p,{act:'rdb_swap',k:f1.k});await W(p);
  cur=await p.evaluate(()=>S.roadGm.cur);
  ok(cur.foes.length===2&&!cur.foes.some(x=>x.k===f1.k)&&cur.foes[0].id!==f2.id,'Swap for another trainer puts someone new in that slot');
  const f3=cur.foes[0];
  // settle: who, mons, rolls
  await click(p,{act:'rdb_who',k:f2.k,v:'u1'});await W(p,300);
  await click(p,{act:'rdb_settle',k:f2.k});await W(p,300);
  ok(await p.evaluate(k=>S.roadGm.cur.foes.find(x=>x.k===k).st,f2.k)==='open','no d20 yet: nothing is settled');
  t=await txt();
  ok(/Mira: d20 \+ 2 for level 6 \+ 1 for 2 badges = d20 \+ 3/.test(t),'the player’s bonus: level 6 (+2) and 2 badges (+1)');
  for(const id of ['p1','p2','p3'].slice(0,f2.n))await click(p,{act:'rdb_mon',k:f2.k,id});
  const extra=['p1','p2','p3'][f2.n];if(extra)await click(p,{act:'rdb_mon',k:f2.k,id:extra});await W(p,300);
  ok(await p.evaluate(k=>S.ui.rdb.f[k].mons.length,f2.k)===f2.n,'the player picks exactly as many Pokémon as the challenge ('+f2.n+')');
  await p.evaluate(k=>{const el=document.querySelector('[data-rdb="'+k+'|pd"]');el.value='20';el.dispatchEvent(new Event('input',{bubbles:true}));},f2.k);
  await p.evaluate(k=>{S.ui.rdb.f[k].fd='1';},f2.k);
  const before=await p.evaluate(()=>rkWith('gym',()=>rkBattles().length));
  await click(p,{act:'rdb_settle',k:f2.k});await W(p,700);
  let F=await p.evaluate(k=>S.roadGm.cur.foes.find(x=>x.k===k),f2.k);
  ok(F.st==='done'&&F.fight.res==='clean'&&F.fight.pt===23&&F.fight.ft===1+f2.rb+f2.bb,'Mira 20 + 3 = 23 against 1 + '+(f2.rb+f2.bb)+': a clean win');
  ok(F.fight.prize===300*(f2.bd+1)&&F.fight.pay===F.fight.prize,'she wins 300 P × ('+f2.bd+' badges + 1) = '+F.fight.prize+' P');
  ok(F.fight.mons.length===f2.n&&F.fight.mons.every(m=>!m.faint&&m.pct>=10&&m.pct<=40&&m.uses>=0&&m.uses<=1),'clean win costs: d4 × 10% HP each, 0–1 daily uses, nobody faints');
  ok(await p.evaluate(()=>S.trainers.u1.credits)===1000&&JSON.stringify(await p.evaluate(()=>S.pokemon.u1.p1.hp))==='{"cur":30,"max":30}','nothing is applied by itself: credits and HP unchanged');
  const B=await p.evaluate(()=>rkWith('gym',()=>({n:rkBattles().length,last:rkBattles().slice(-1)[0],log:rkLog().filter(e=>e.bt===rkBattles().slice(-1)[0].k)})));
  ok(B.n===before+1&&B.last.kind==='public'&&B.last.a==='u1'&&B.last.b===f2.id&&B.last.win==='a'&&B.last.road===1&&B.last.w==='A road battle on Route 203.','recorded on the Gym rankings as a public battle where the party met them ('+(B.last.w||'')+')');
  ok(B.log.some(e=>e.u==='u1'&&(e.p===5||e.p===10))&&B.log.some(e=>e.u===f2.id&&e.p===-5),'points: +5 or +10 to Mira, −5 to the foe');
  await click(p,{act:'rdb_pay',k:f2.k});await W(p,500);
  ok(await p.evaluate(()=>S.trainers.u1.credits)===1000+F.fight.prize,'Pay out adds the prize to Mira’s credits');
  await click(p,{act:'rdb_pay',k:f2.k});await W(p,300);
  ok(await p.evaluate(()=>S.trainers.u1.credits)===1000+F.fight.prize,'paying twice does nothing');
  // undo the battle: points and money go back
  await click(p,{act:'rdb_undo',k:f2.k});await W(p,600);
  ok(await p.evaluate(()=>S.trainers.u1.credits)===1000&&await p.evaluate(()=>rkWith('gym',()=>rkBattles().length))===before,'Undo this battle takes back the money and the rankings record');
  // a rout
  await p.evaluate(k=>{const x=S.ui.rdb.f[k];x.pd='1';x.fd='20';},f2.k);
  await click(p,{act:'rdb_settle',k:f2.k});await W(p,700);
  F=await p.evaluate(k=>S.roadGm.cur.foes.find(x=>x.k===k),f2.k);
  ok(F.fight.res==='rout'&&F.fight.mons.every(m=>m.faint&&m.uses>=2&&m.uses<=3)&&F.fight.pay===-900,'a rout: every Pokémon faints, 2–3 daily uses each, Mira owes 300 × (2 + 1) = 900 P');
  await click(p,{act:'rdb_pay',k:f2.k});await W(p,500);
  ok(await p.evaluate(()=>S.trainers.u1.credits)===100,'Pay out takes 900 P from Mira');
  ok(await p.evaluate(()=>rkWith('gym',()=>rkBattles().slice(-1)[0].win))==='b','the loss is on the rankings too');
  // Cora can't pay what she doesn't have
  await click(p,{act:'rdb_who',k:f3.k,v:'u3'});await W(p,300);
  await click(p,{act:'rdb_mon',k:f3.k,id:'c1'});
  await p.evaluate(k=>{const x=S.ui.rdb.f[k];x.pd='1';x.fd='20';},f3.k);
  await click(p,{act:'rdb_settle',k:f3.k});await W(p,700);
  F=await p.evaluate(k=>S.roadGm.cur.foes.find(x=>x.k===k),f3.k);
  ok(F.fight&&F.fight.mons.length===1,'a player with fewer Pokémon than the challenge sends what they have');
  await click(p,{act:'rdb_pay',k:f3.k});await W(p,500);
  ok(await p.evaluate(()=>S.trainers.u3.credits)===0&&/all they had/.test(await txt()),'a loser short of money pays all they have');
  t=await txt();
  ok(/What it cost \(apply by hand\)/.test(t)&&/faints/.test(t)&&/Recorded on the Gym rankings/.test(t),'the card lists the costs to apply by hand and what the rankings recorded');
  ok(await p.evaluate(()=>S.roadGm.log.length)===2,'the log keeps both battles');
  await p.screenshot({path:ROOT+'/tests/out/road.png',fullPage:true});
  // the rankings feed shows the result, not the rolls
  await p.evaluate(()=>{setTab('rank');});await W(p,800);
  const feed=await p.evaluate(()=>document.body.innerText);
  ok(/Mira[^\n]*beat|beat[^\n]*Mira/.test(feed)&&/A road battle on Route 203/.test(feed)&&!/d20/.test(feed.split('Road battles')[0]||''),'the rankings feed shows the road battle and who won');
  // the Rankings page's own Save the battle still works through the shared recorder
  const nb=await p.evaluate(()=>rkWith('gym',()=>rkBattles().length));
  await p.evaluate(()=>{Object.assign(S.ui.rk,{c:'gym',ba:'u3',bb:'b5',bwin:'b',bk:'public',bw:''});});
  await click(p,{act:'rk_btadd'});await W(p,600);
  const hand=await p.evaluate(()=>rkWith('gym',()=>{const x=rkBattles().slice(-1)[0];return {n:rkBattles().length,x,pts:rkLog().filter(e=>e.bt===x.k).map(e=>e.u+':'+e.p).sort().join(',')};}));
  ok(hand.n===nb+1&&hand.x.a==='u3'&&hand.x.b==='b5'&&hand.x.win==='b'&&/u3:-5/.test(hand.pts)&&/b5:(5|10)/.test(hand.pts)&&!hand.x.road,'Save the battle on the Rankings page still records a battle by hand ('+hand.pts+')');
  ok(errs.length===0,'no page errors ('+errs.slice(0,3).join(' | ')+')');
  await b.close();

  // the players never see it
  ({b,p,errs}=await open({admin:false,uid:'u1',tab:'cal',seedFn}));
  const pv=await p.evaluate(()=>({el:!!document.getElementById('roadbattles'),admin:!!S.me.admin,tab:S.tab,hit:(document.body.innerText.match(/.{0,60}Road battles.{0,60}/)||[''])[0],gm:Object.keys(S.roadGm||{}).length}));
  ok(!pv.el&&!pv.hit&&!pv.gm,'a player sees no Road battles panel on the Calendar and has no road data ('+JSON.stringify(pv)+')');
  await p.evaluate(()=>{setTab('map');});await W(p,800);
  ok(await p.evaluate(()=>!document.getElementById('roadbattles')),'nor on the Map');
  ok(errs.length===0,'no page errors for a player');
  await b.close();

  // phone width
  ({b,p,errs}=await open({admin:true,uid:'u1',tab:'map',seedFn,w:390,h:860}));
  await p.evaluate(()=>{S.ui.rdb.d6='6';});await click(p,{act:'rdb_roll'});await W(p,600);
  await p.evaluate(()=>{const k=S.roadGm.cur.foes[0].k;S.ui.rdb.f[k]={uid:'u1',pd:'',fd:'',mons:[]};render();document.getElementById('roadbattles').scrollIntoView();});await W(p,400);
  const ov=await p.evaluate(()=>{const e=document.getElementById('roadbattles');return {pw:document.documentElement.scrollWidth,vw:window.innerWidth,ew:e.getBoundingClientRect().right};});
  ok(ov.pw<=ov.vw+1&&ov.ew<=ov.vw+1,'at phone width the panel fits without sideways scrolling ('+JSON.stringify(ov)+')');
  await p.screenshot({path:ROOT+'/tests/out/road-phone.png'});
  ok(errs.length===0,'no page errors at phone width');
  await b.close();
  console.log(fails?fails+' FAILED':'ALL PASSED');
})();
