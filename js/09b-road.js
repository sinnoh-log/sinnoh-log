'use strict';
/* Sinnoh Trainer Log · 09b-road. The files in js/ are classic scripts that share one scope: load them in order (see index.html). */
/* ---------- Road battles (Update 56): a GM-only tool for the trainers the party meets between towns ----------
   The GM presses Roll for trainers once a travel day. A d6, read by the zone the party travels in, says how many trainers want
   a battle. They come from the Gym circuit rankings (field trainers and tracked rivals), weighted toward whoever is near the
   party right now and close to the players in the standings. Every trainer on the board travels: they set off from home, walk
   to their next Gym, rest a few days after each badge and set off again, so where they are follows the in-game date and the
   rankings week.
   A trainer's rank comes from their badges (a rival with a Quick NPC sheet keeps the sheet's rank); their favourite type comes
   from their hometown; their team is named from the species that live in Sinnoh. Rank sets the size of the challenge.
   One opposed roll settles a battle: the player's real d20 + level (+1 per 5) + badges (+1 per 2), against the foe's d20 +
   rank (+1 to +4) + badges (+1 per 2). The margin picks one of four results; the result rolls what the battle cost the
   Pokémon that fought, shown for the GM to apply by hand. The winner takes 300 P × (the loser's badges + 1); Pay out moves it.
   The battle is recorded on the Gym rankings as a public battle, so the feed shows who won but never the rolls.
   Kept in gm/road (GM only): cur {k, d6, zone, date, at, wide, foes[]}, log [] (the last 120 battles and refusals) */

const RDB_ZONES=[['road','On the road'],['semi','Semi-route'],['off','Off-route']];
/* trainers a d6 brings, by zone: index 0 is a roll of 1 */
const RDB_COUNT={road:[0,0,1,1,1,2],semi:[0,0,0,0,1,1],off:[0,0,0,0,0,1]};
const RDB_SIZE={'1':[1,1],'2':[1,2],'2s':[1,2],'3':[2,3],'4':[3,3]};
const rdbRankOfBadges=bd=>bd>=6?'4':bd>=4?'3':bd>=2?'2':'1';
/* Update 61: both sides use their best-ever tier on the Gym circuit (Unranked rookie +1, Ranked +2, Top 150 +3,
   Top 50 +4, Top 10 +5) plus 1 per 2 badges. Level no longer counts. */
const rdbTierIx=p=>{const T=RK_C.gym.tiers,i=T.findIndex(t=>num(p)>=t[0]);return i<0?T.length-1:i;};
const rdbTierB=p=>RK_C.gym.tiers.length-rdbTierIx(p);
const rdbTierName=p=>RK_C.gym.tiers[rdbTierIx(p)][1];
/* a player's best-ever points on the Gym circuit (0 when they are not on it) */
const rdbPeakOf=uid=>rkWith('gym',()=>{const r=rkRows().find(x=>x.id===uid);return r?num(r.peak):0;});
/* Gym battles off the badge path (rematches, exhibitions, the trainers inside a Gym): a Leader is at full strength
   (+9, a Top 10 trainer with eight badges) moved by the Gym's reputation; a Gym trainer matches whoever answers.
   They pay prize money but never count on the rankings. */
const RDB_GKINDS=[['rematch','Leader rematch'],['exhibition','Exhibition with the Leader'],['trainer','A Gym trainer']];
const RDB_REP_ADJ={easy:-1,standard:0,tough:1,brutal:2};
const rdbIsGym=f=>f&&(f.kind==='gl'||f.kind==='gt');
/* the foe's bonus: pb is the player's, which a Gym trainer copies */
const rdbFoeB=(f,pb)=>f.kind==='gt'?pb:f.kind==='gl'?9+num(f.rep):(f.tb!=null?num(f.tb):num(f.rb))+num(f.bb);
const rdbBdBonus=b=>Math.floor(clamp(num(b),0,8)/2);
const RDB_PRIZE=300;
const rdbPrize=bd=>RDB_PRIZE*(clamp(Math.round(num(bd)),0,8)+1);
/* the four results: id, name, what it means at the table */
const RDB_RES=[
  ['clean','Clean win','The player wins by 5 or more.'],
  ['hard','Hard-fought win','The player wins by 0 to 4. Ties go to the player.'],
  ['close','Close loss','The player loses by 1 to 4.'],
  ['rout','Rout','The player loses by 5 or more.']
];
const rdbResult=m=>m>=5?'clean':m>=0?'hard':m>=-4?'close':'rout';
const rdbResName=r=>(RDB_RES.find(x=>x[0]===r)||['',''])[1];
/* what a result costs each Pokémon the player sent out: HP is d4 × hp% of max; uses = daily uses spent [low, high];
   f = who faints (the last one out, or all); inj = an injury on a d6 roll of this or lower */
const RDB_COST={clean:{hp:10,u:[0,1],f:'',inj:0},hard:{hp:15,u:[1,2],f:'',inj:0},close:{hp:20,u:[1,2],f:'last',inj:1},rout:{hp:0,u:[2,3],f:'all',inj:2}};
/* hometowns on the board and the types their trainers favour (the first counts most) */
const RDB_TOWN={Twinleaf:'twinleaf-town',Sandgem:'sandgem-town',Jubilife:'jubilife-city',Oreburgh:'oreburgh-city',Floaroma:'floaroma-town',
  Eterna:'eterna-city',Hearthome:'hearthome-city',Solaceon:'solaceon-town',Veilstone:'veilstone-city',Pastoria:'pastoria-city',Celestic:'celestic-town',
  Canalave:'canalave-city',Snowpoint:'snowpoint-city',Sunyshore:'sunyshore-city','Survival Area':'battle-resort-survival-area','Resort Area':'resort-area',
  'Fight Area':'battle-resort-fight-area',Kanto:'canalave-city',Johto:'canalave-city',Kalos:'canalave-city',Hoenn:'sunyshore-city',Unova:'sunyshore-city'};
const RDB_AWAY=new Set(['Kanto','Johto','Hoenn','Unova','Kalos']);
const RDB_HOME_TY={
  'twinleaf-town':['Normal','Grass','Water','Flying'],'sandgem-town':['Water','Normal','Bug'],'jubilife-city':['Normal','Electric','Psychic','Steel'],
  'oreburgh-city':['Rock','Ground','Steel','Fighting'],'floaroma-town':['Grass','Bug','Fairy'],'eterna-city':['Grass','Bug','Poison'],
  'hearthome-city':['Ghost','Fairy','Normal'],'solaceon-town':['Ghost','Psychic','Normal'],'veilstone-city':['Fighting','Psychic','Rock'],
  'pastoria-city':['Fairy','Water','Poison'],'celestic-town':['Psychic','Dragon','Normal'],'canalave-city':['Steel','Water','Psychic'],
  'snowpoint-city':['Ice','Water'],'sunyshore-city':['Flying','Electric','Water'],'battle-resort-survival-area':['Ground','Rock','Fighting'],
  'resort-area':['Water','Fairy','Normal'],'battle-resort-fight-area':['Fighting','Dragon','Steel']
};
/* where each Gym is, by badge */
const RDB_GYM_AT={coal:'oreburgh-city',forest:'eterna-city',cobble:'veilstone-city',fen:'pastoria-city',relic:'hearthome-city',mine:'canalave-city',icicle:'snowpoint-city',beacon:'sunyshore-city'};
const RDB_CONF='lily-of-the-valley-conference';
/* the base-stat totals that suit each rank (a team is named from these) */
const RDB_BAND={'1':[0,330],'2':[290,420],'2s':[290,420],'3':[380,500],'4':[450,999]};
const RDB_LEGEND=new Set([144,145,146,150,151,243,244,245,249,250,251,377,378,379,380,381,382,383,384,385,386,480,481,482,483,484,485,486,487,488,489,490,491,492,493]);

S.ui.rdb=Object.assign({at:'',zone:'',d6:'',f:{},gym:'coal',gk:'rematch',gn:'3'},S.ui.rdb||{});
const rdbG=()=>S.roadGm||{};
const rdbCur=()=>{const c=rdbG().cur;return c&&Array.isArray(c.foes)?c:null;};
const rdbLog=()=>Array.isArray(rdbG().log)?rdbG().log:[];
const rdbDay=()=>{const d=clParse(clToday());return d?Math.floor(d.getTime()/864e5):0;};
const rdbH=(s,a,b)=>rkHash(rkStrHash(s),a,b);

/* ----- where people are ----- */
function rdbHomeName(txt){
  const s=String(txt||'').trim().toLowerCase();
  if(!s)return '';
  const ks=Object.keys(RDB_TOWN);
  return ks.find(k=>s.indexOf(k.toLowerCase())===0)||ks.find(k=>s.indexOf(k.toLowerCase())>=0)||'';
}
const rdbPathMemo={};
function rdbPath(a,b){
  const k=a+'>'+b;
  if(!(k in rdbPathMemo))rdbPathMemo[k]=a===b?[]:(trPath(a,b,'steady',null,false)||null);
  return rdbPathMemo[k];
}
const rdbEdgeDays=e=>e.sea?Math.max(1,Math.ceil(e.sea[2]/24)):trMid(e.leg)*TRAVEL_SCALE;
const rdbRouteName=id=>PD_BY[id]?PD_BY[id].name:id;
/* the badges a trainer holds, by Gym (index into RK_GYMS) and the week won. A rival paced to the players has a count only. */
function rdbHeld(r,W){
  const h=r.held||{},n=Object.keys(h).length;
  if(n===num(r.bd))return h;
  const o={};
  for(let j=0;j<num(r.bd);j++)o[j]=W-2-(num(r.bd)-1-j)*4-Math.floor(rdbH(r.name,40+j,3)*3);
  return o;
}
/* where a trainer on the board is on a given day: {nodes, route, sea, txt (where they are), jt (their journey)} */
const RDB_TOUR=['oreburgh-city','eterna-city','veilstone-city','pastoria-city','hearthome-city','canalave-city','snowpoint-city','sunyshore-city','celestic-town','battle-resort-survival-area','jubilife-city'];
function rdbWalk(r,from,to,days,pace,why,jt){
  const path=from===to?[]:rdbPath(from,to);
  if(path){
    let left=days;
    for(const e of path){
      const d=rdbEdgeDays(e)*pace;
      if(left<d){
        if(e.sea)return {nodes:[e.a,e.b],route:'',sea:1,txt:'At sea from '+trName(e.a)+' to '+trName(e.b),jt};
        return {nodes:[e.a,e.b],route:e.leg[0],txt:'On '+rdbRouteName(e.leg[0])+', between '+trName(e.a)+' and '+trName(e.b),jt};
      }
      left-=d;
    }
  }
  return null;
}
function rdbLoc(r,W,day){
  const R=k=>rdbH(r.name,k,91);
  const homeNm=rdbHomeName(r.home),home=RDB_TOWN[homeNm]||'jubilife-city';
  const held=rdbHeld(r,W);
  let last=-1,lw=-Infinity;
  Object.keys(held).forEach(g=>{if(num(held[g])>lw){lw=num(held[g]);last=+g;}});
  let next=0;while(held[next]!=null&&next<RK_GYMS.length)next++;
  const from=last>=0?RDB_GYM_AT[RK_GYMS[last].k]:home;
  const goal=next<RK_GYMS.length?RK_GYMS[next]:null;
  if(last<0)lw=-(1+Math.floor(R(1)*6));
  const pace=0.85+R(2)*0.45,rest=1+Math.floor(R(3)*3);
  const days=(W-lw)*7+(((day%7)+7)%7)-rest;
  if(days<0){const b=RK_GYMS[last];return {nodes:[from],route:'',txt:'In '+trName(from),jt:'Resting in '+trName(from)+(b?' after winning the '+b.badge+' Badge':'')};}
  /* all eight badges: they tour Sinnoh until the Conference, a new town every couple of weeks */
  if(!goal){
    const span=10+Math.floor(R(4)*8),leg=Math.floor(days/span),stop=i=>RDB_TOUR[Math.floor(rdbH(r.name,i,93)*RDB_TOUR.length)];
    let a=leg?stop(leg-1):from,z=stop(leg);if(z===a)z=RDB_TOUR[(RDB_TOUR.indexOf(z)+1)%RDB_TOUR.length];
    const jt='Touring Sinnoh with all eight badges, '+trName(a)+' to '+trName(z)+', before the Conference';
    const w=rdbWalk(r,a,z,days-leg*span,pace,'',jt);
    if(w)return w;
    return rdbAround(r,z,day,jt);
  }
  const to=RDB_GYM_AT[goal.k];
  const jt=from===to?'Training around '+trName(to)+' for the '+goal.badge+' Badge':'On the way from '+trName(from)+' to '+trName(to)+' for the '+goal.badge+' Badge';
  const w=rdbWalk(r,from,to,days,pace,'',jt);
  if(w)return w;
  return rdbAround(r,to,day,'Training around '+trName(to)+' for the '+goal.badge+' Badge');
}
/* once there, they train in and around the town until they win, on a different road each day */
function rdbAround(r,at,day,jt){
  const around=TR_EDGES.filter(e=>e.a===at&&e.leg);
  const pick=Math.floor(rdbH(r.name,day,92)*(around.length+1));
  if(!pick)return {nodes:[at],route:'',txt:'In '+trName(at),jt};
  const e=around[pick-1];
  return {nodes:[e.a,e.b],route:e.leg[0],txt:'On '+rdbRouteName(e.leg[0])+', near '+trName(at),jt};
}
/* where the party is: the place the GM picked, or where the trip has reached */
function rdbParty(){
  const at=S.ui.rdb.at,t=clTrip();
  if(at&&at!=='trip'){
    if(PD_BY[at]&&PD_BY[at].t==='r'){
      const ns=new Set();TR_LEGS.forEach(l=>{if(l[0]===at){ns.add(l[1]);ns.add(l[2]);}});
      return {nodes:[...ns],route:at,txt:'On '+rdbRouteName(at)};
    }
    return {nodes:[at],route:'',txt:'In '+trName(at)};
  }
  if(t&&!t.done){
    const st=t.steps[t.pos]||t.steps[t.steps.length-1];
    if(st.sea)return {nodes:[st.a,st.b],route:'',sea:1,txt:'At sea, '+trName(st.a)+' to '+trName(st.b)};
    return {nodes:[st.a,st.b],route:st.r,txt:'On '+rdbRouteName(st.r)+', '+trName(st.a)+' to '+trName(st.b)};
  }
  if(t&&t.done)return {nodes:[t.to],route:'',txt:'In '+trName(t.to)};
  return null;
}
const rdbZone=()=>{const z=S.ui.rdb.zone,t=clTrip();return RDB_COUNT[z]?z:(t&&!t.done&&RDB_COUNT[t.zone]?t.zone:'road');};
/* steps on foot from where the party is to every place */
function rdbHops(nodes){
  const d={},q=nodes.slice();nodes.forEach(n=>{d[n]=0;});
  while(q.length){const u=q.shift();TR_EDGES.forEach(e=>{if(e.a===u&&!e.sea&&d[e.b]==null){d[e.b]=d[u]+1;q.push(e.b);}});}
  return d;
}
/* how likely a trainer is to cross the party's path: the same route counts most; a trainer resting in town less */
function rdbNear(P,L,hop){
  if(!P||P.sea||L.sea)return 0;
  if(P.route&&L.route===P.route)return 12;
  const d=Math.min.apply(null,L.nodes.map(n=>hop[n]==null?99:hop[n]));
  return (L.route?1:0.5)*(d===0?5:d===1?2:d===2?0.6:d===3?0.15:0);
}

/* ----- who could turn up ----- */
function rdbCands(){
  return rkWith('gym',()=>{
    const b=rkB(),W=num(b.wk),rows=rkRows(),EN=rkEngine(),npcs=rkNpcs();
    const pcs=rows.filter(r=>r.kind==='pc');
    const avg=pcs.length?pcs.reduce((a,r)=>a+r.pos,0)/pcs.length:rows.length/2;
    return {W,avg,rows:rows.filter(r=>r.kind!=='pc').map(r=>Object.assign({},r,{held:(EN.E[r.id]||{}).held||{},recTxt:rkRecText(r),
      npc:r.kind==='rival'?npcs.find(n=>'n_'+n.k===r.id)||null:null}))};
  });
}
function rdbDraw(n,skip){
  const C=rdbCands(),P=rdbParty(),day=rdbDay(),hop=P?rdbHops(P.nodes):{};
  const list=C.rows.filter(r=>!skip.has(r.id)).map(r=>{
    const L=rdbLoc(r,C.W,day),st=1/(1+Math.abs(r.pos-C.avg)/40),rv=r.kind==='rival'?2:1;
    return {r,L,w:rdbNear(P,L,hop)*st*rv,st:st*rv};
  });
  let pool=list.filter(x=>x.w>0),wide=false;
  if(!pool.length&&list.length){pool=list.map(x=>Object.assign(x,{w:x.st}));wide=true;}
  const out=[];
  for(let i=0;i<n&&pool.length;i++){
    const tot=pool.reduce((a,x)=>a+x.w,0);let z=Math.random()*tot,j=0;
    for(;j<pool.length-1;j++){z-=pool[j].w;if(z<=0)break;}
    out.push(pool[j]);pool.splice(j,1);
  }
  return {foes:out.map(x=>Object.assign(rdbFoe(x.r,x.L,C.W),{route:P&&P.route||'',place:P?P.txt:''})),wide,none:!C.rows.length};
}

/* ----- their team ----- */
const rdbBst=i=>STAT_KEYS.reduce((a,k)=>a+num(i.base[k]),0)*15*1.2;
let RDB_NAT=null;
function rdbNational(){
  if(RDB_NAT)return RDB_NAT;
  const o=[];
  for(let id=1;id<=493&&id<=DEXA.length;id++){if(RDB_LEGEND.has(id))continue;const i=dexInfo(id);o.push({n:i.name,ty:i.types,s:rdbBst(i)});}
  return (RDB_NAT=o);
}
/* the species Sinnoh's wild tables hold: the zone pools and every table the GM has written */
function rdbLocal(){
  const names=new Set();
  Object.keys(ZN_POOL).forEach(b=>['semi','off'].forEach(k=>(ZN_POOL[b][k]||[]).forEach(x=>names.add(x[0]))));
  Object.values(S.gmPl||{}).forEach(g=>[g].concat(Array.isArray(g&&g.ex)?g.ex:[]).forEach(T=>{if(T)encRows(T).forEach(x=>{if(encOk(x))names.add(String(x.sp).trim());});}));
  const o=[],seen=new Set();
  names.forEach(nm=>{const i=speciesInfo(nm);if(!i||RDB_LEGEND.has(i.id))return;const n=i.form?nm:i.name;if(seen.has(n))return;seen.add(n);o.push({n,ty:i.types,s:rdbBst(i)});});
  return o;
}
function rdbTeam(ty,rank,n,seed,have){
  if(n<=0)return [];
  const [lo,hi]=RDB_BAND[rank]||RDB_BAND['1'];
  const fit=list=>list.filter(x=>x.ty.indexOf(ty)>=0&&have.indexOf(x.n)<0);
  const inBand=x=>x.s>=lo&&x.s<=hi;
  const loc=fit(rdbLocal());
  let pick=loc.filter(inBand);
  if(pick.length<n)pick=pick.concat(fit(rdbNational()).filter(x=>inBand(x)&&!pick.some(y=>y.n===x.n)));
  if(pick.length<n){
    const mid=(lo+Math.min(hi,620))/2;
    const rest=loc.concat(fit(rdbNational())).filter(x=>!pick.some(y=>y.n===x.n)).sort((a,b)=>Math.abs(a.s-mid)-Math.abs(b.s-mid));
    pick=pick.concat(rest.slice(0,n-pick.length));
  }
  const out=[],h=rkStrHash(seed);
  for(let j=0;j<n&&pick.length;j++){const i=Math.floor(rkHash(h,j,77)*pick.length);out.push(pick[i].n);pick.splice(i,1);}
  return out;
}
function rdbMainType(team){
  const c={};
  team.forEach(m=>(Array.isArray(m.ty)?m.ty:Array.isArray(m.types)?m.types:[]).forEach(t=>{if(t)c[t]=(c[t]||0)+1;}));
  return Object.keys(c).sort((a,b)=>c[b]-c[a])[0]||'';
}
function rdbHomeType(name,homeNm){
  const pool=RDB_AWAY.has(homeNm)?TYPES:(RDB_HOME_TY[RDB_TOWN[homeNm]]||TYPES);
  const wt=pool===TYPES?pool.map(()=>1):pool.map((_,i)=>i===0?3:i===1?2:1);
  let z=rdbH(name,23,5)*wt.reduce((a,b)=>a+b,0);
  for(let i=0;i<pool.length;i++){z-=wt[i];if(z<0)return pool[i];}
  return pool[0];
}
function rdbFoe(r,L,W){
  const nt=r.npc&&r.npc.nt?NTS()[r.npc.nt]:null,q=nt?qnOf(nt):null;
  const rank=q&&q.r&&RDB_SIZE[q.r]?q.r:rdbRankOfBadges(num(r.bd));
  const sz=RDB_SIZE[rank],n=sz[0]+Math.floor(Math.random()*(sz[1]-sz[0]+1));
  const homeNm=rdbHomeName(r.home);
  let ty=q&&q.ty?q.ty:'',team=[];
  if(nt&&Array.isArray(nt.team)&&nt.team.length){team=nt.team.map(m=>m.sp||m.species).filter(Boolean).slice(0,n);if(!ty)ty=rdbMainType(nt.team);}
  const saved=!nt?grTeamOf(r,W):null;
  if(saved&&saved.sp.length){
    if(!ty)ty=saved.ty||'';
    const pool=saved.sp.slice(),h0=rkStrHash(r.name+'|'+W);
    for(let j=0;j<n&&pool.length;j++){const i=Math.floor(rkHash(h0,j,61)*pool.length);team.push(pool[i]);pool.splice(i,1);}
  }
  if(!ty)ty=rdbHomeType(r.name,homeNm);
  if(team.length<n&&!(saved&&saved.sp.length))team=team.concat(rdbTeam(ty,rank,n-team.length,r.name+'|'+W,team));
  const tb=rdbTierB(r.peak),bb=rdbBdBonus(r.bd);
  return {k:rkKey(),id:r.id,kind:r.kind,name:r.name,home:homeNm||String(r.home||'').split(/[;,]/)[0].trim(),lab:r.lab||'',rank,bd:num(r.bd),pos:r.pos,rec:r.recTxt||'',
    ty,n:team.length?Math.min(n,team.length):n,team,where:L.txt,jt:L.jt||'',tb,tn:rdbTierName(r.peak),bb,st:'open'};
}

/* ----- the battle ----- */
function rdbCosts(res,mons){
  const c=RDB_COST[res],win=res==='clean'||res==='hard';
  const out=mons.map((m,i)=>{
    const max=num(m.hp&&m.hp.max),cur=m.hp&&m.hp.cur!=null&&m.hp.cur!==''?num(m.hp.cur):max;
    const faint=c.f==='all'||(c.f==='last'&&i===mons.length-1);
    const d4=encRand(1,4),pct=faint?0:c.hp*d4;
    let hp=faint?cur:Math.max(1,Math.round(max*pct/100)),hold=false;
    if(!faint&&hp>=cur){if(win){hp=Math.max(0,cur-1);hold=true;}}
    const ko=faint||(!hold&&hp>=cur);
    return {id:m.id,name:mName(m),max,cur,d4:faint?0:d4,pct,hp:Math.min(hp,cur),after:ko?0:Math.max(0,cur-hp),faint:ko,hold,uses:encRand(c.u[0],c.u[1])};
  });
  let inj=null;
  if(c.inj&&out.length){const r=encRand(1,6);if(r<=c.inj){const m=out[encRand(0,out.length-1)];inj={id:m.id,name:m.name,r};}}
  return {mons:out,inj};
}
const rdbUi=k=>S.ui.rdb.f[k]||(S.ui.rdb.f[k]={uid:'',pd:'',fd:'',mons:[]});
function rdbSaveCur(cur){edit('gr','road','cur',cur);}
function rdbSaveLog(log){edit('gr','road','log',log.slice(-120));}
function rdbSetFoe(k,patch){
  const cur=rdbCur();if(!cur)return null;
  const c=JSON.parse(JSON.stringify(cur));
  const f=c.foes.find(x=>x.k===k);if(!f)return null;
  Object.assign(f,patch);rdbSaveCur(c);return f;
}
function rdbSettle(k){
  const cur=rdbCur(),f=cur&&cur.foes.find(x=>x.k===k),u=rdbUi(k);
  if(!f||f.st!=='open')return;
  const t=S.trainers[u.uid];
  if(!t){toast('Pick who answers the challenge.');return;}
  const pd=Math.round(num(u.pd));
  if(String(u.pd).trim()===''||pd<1||pd>20){toast('Type the player’s d20 roll (1 to 20).');return;}
  let fd=Math.round(num(u.fd));
  if(String(u.fd).trim()===''){fd=encRand(1,20);u.fd=String(fd);}
  if(fd<1||fd>20){toast('The foe’s d20 must be 1 to 20.');return;}
  const party=partyOf(u.uid),need=Math.min(f.n,party.length);
  const mons=u.mons.map(id=>party.find(m=>m.id===id)).filter(Boolean);
  if(!party.length){toast(tName(t)+' has no Pokémon with them.');return;}
  if(mons.length!==need){toast('Pick '+need+' Pokémon for '+tName(t)+' ('+mons.length+' picked).');return;}
  const pk=rdbPeakOf(u.uid),tb=rdbTierB(pk),bd=badgeCount(t),bb=rdbBdBonus(bd),pb=tb+bb,fb=rdbFoeB(f,pb),pt=pd+pb,ft=fd+fb,m=pt-ft,res=rdbResult(m),win=m>=0;
  const cost=rdbCosts(res,mons);
  /* the loser pays 300 P × (their badges + 1); a Leader pays the top rate, a Gym trainer the player's own rate */
  const prize=f.kind==='gl'?(win?rdbPrize(8):rdbPrize(bd)):f.kind==='gt'?rdbPrize(bd):rdbPrize(win?f.bd:bd);
  const fight={uid:u.uid,pname:tName(t),pbd:bd,pd,tb,tn:rdbTierName(pk),bb,pb,fb,pt,fd,ft,m,res,win,mons:cost.mons,inj:cost.inj,prize,pay:win?prize:-prize,paid:0,moved:0,bt:'',pts:null,why:''};
  /* the rankings: a public battle, if the player is on the Gym board and the foe still is */
  if(rdbIsGym(f))fight.why='Gym rematches, exhibitions and Gym trainers do not count on the rankings.';
  else if(onGym(t)){
    const where=f.route?' on '+rdbRouteName(f.route):f.place?' '+f.place.charAt(0).toLowerCase()+f.place.slice(1):'';
    const r=rkWith('gym',()=>rkSaveBattle(u.uid,f.id,win?'a':'b','public','A road battle'+where+'.',{road:1}));
    if(r.err)fight.why=r.err;else{fight.bt=r.k;fight.pts={a:num(r.pv.a),b:num(r.pv.b)};}
  }else fight.why=tName(t)+' is not on the Gym circuit rankings, so nothing was recorded there.';
  rdbSetFoe(k,{st:'done',fight});
  rdbSaveLog(rdbLog().concat([{k,date:clToday()||'',at:Date.now(),foe:f.name,fid:f.id,uid:u.uid,pname:fight.pname,res,m,pay:fight.pay,paid:0,route:f.route||''}]));
  delete S.ui.rdb.f[k];
  toast(rdbResName(res)+': '+(win?fight.pname+' wins '+fmtP(prize):f.name+' wins '+fmtP(prize))+'.',true);
  render();
}
function rdbPay(k){
  const f=(rdbCur()||{foes:[]}).foes.find(x=>x.k===k),F=f&&f.fight;
  if(!F||F.paid)return;
  const t=S.trainers[F.uid];if(!t){toast('That trainer is gone.');return;}
  const have=num(t.credits),moved=F.pay>=0?F.pay:-Math.min(have,-F.pay);
  edit('t',F.uid,'credits',have+moved);
  rdbSetFoe(k,{fight:Object.assign({},F,{paid:1,moved})});
  rdbSaveLog(rdbLog().map(x=>x.k===k?Object.assign({},x,{paid:1,moved}):x));
  toast(moved>=0?tName(t)+' gets '+fmtP(moved)+'.':tName(t)+' pays '+fmtP(-moved)+(moved!==F.pay?' (all they had).':'.'),true);
  render();
}
function rdbUndo(k){
  const f=(rdbCur()||{foes:[]}).foes.find(x=>x.k===k);if(!f)return;
  if(f.st==='done'&&f.fight){
    const F=f.fight;
    if(F.bt)rkWith('gym',()=>rkSave({bt:rkBattles().filter(x=>x.k!==F.bt),log:rkLog().filter(e=>e.bt!==F.bt)}));
    if(F.paid&&S.trainers[F.uid]){const back=Math.round(num(F.moved));if(back)edit('t',F.uid,'credits',Math.max(0,num(S.trainers[F.uid].credits)-back));}
    S.ui.rdb.f[k]={uid:F.uid,pd:String(F.pd),fd:String(F.fd),mons:F.mons.map(m=>m.id)};
  }
  rdbSetFoe(k,{st:'open',fight:null});
  rdbSaveLog(rdbLog().filter(x=>x.k!==k));
  render();
}
function rdbRoll(){
  const P=rdbParty();
  if(!P){toast('Start a trip or pick where the party is first.');return;}
  const u=S.ui.rdb,zone=rdbZone(),typed=Math.round(num(u.d6));
  const d6=typed>=1&&typed<=6?typed:encRand(1,6);
  const n=RDB_COUNT[zone][d6-1];
  const dr=n?rdbDraw(n,new Set()):{foes:[],wide:false,none:false};
  /* Gym battles still waiting (open, or won or lost but not paid) stay on the list */
  const keep=rdbCur()?rdbCur().foes.filter(f=>rdbIsGym(f)&&rdbUnfinished(f)):[];
  rdbSaveCur({k:rkKey(),d6,zone,date:clToday()||'',at:P.txt,typed:typed>=1&&typed<=6?1:0,want:n,wide:dr.wide?1:0,none:dr.none?1:0,foes:dr.foes.concat(keep)});
  u.d6='';Object.keys(u.f).forEach(k=>{if(!keep.some(f=>f.k===k))delete u.f[k];});
  render();
}
const rdbUnfinished=f=>f.st==='open'||(f.st==='done'&&f.fight&&!f.fight.paid);
/* the Leader's NPC sheet, if there is one: matched by the Leader's name */
function rdbLeaderSheet(name){
  const n=String(name||'').toLowerCase();
  const id=ntIds().find(i=>{const nt=NTS()[i];return nt&&(String(nt.name||'').toLowerCase()===n||(glKey(nt)&&n.indexOf(glKey(nt))>=0));});
  return id?NTS()[id]:null;
}
function rdbGymFoe(gk,mode,n){
  const g=RK_GYMS.find(x=>x.k===gk)||RK_GYMS[0],town=RDB_GYM_AT[g.k],lname=rkGymName(g),nt=rdbLeaderSheet(lname),q=nt?qnOf(nt):null;
  const prof=GL_QUICK[nt?glKey(nt):lname.toLowerCase().split(/\s+/).find(w=>GL_QUICK[w])||'']||{};
  /* the Leader's strongest team: the saved team for the most badges, else the team on the sheet */
  const st=nt?ntStages(nt):[],top=st.length?st[st.length-1].team:null,full=(Array.isArray(top)&&top.length?top:nt?ntTeam(nt):[]).map(m=>m.sp||m.species).filter(Boolean);
  const ty=(q&&q.ty)||prof.ty||rdbMainType(nt?ntTeam(nt):[])||'Normal';
  const rp=rkGymRep(g.id);
  if(mode==='trainer'){
    const avg=grPartyAvg(),nm=(rkGenField(num(Date.now()%9973)+7,1)[0]||{name:'Sam'}).name.split(' ')[0];
    return {k:rkKey(),id:'gt_'+rkKey(),kind:'gt',mode,gym:g.k,name:'Gym trainer '+nm,home:trName(town),rank:rdbRankOfBadges(avg),bd:avg,pos:null,rec:'',ty,n,
      team:rdbTeam(ty,rdbRankOfBadges(avg),n,'gt|'+Date.now(),[]),where:'',jt:'Trains under '+lname+' at the '+trName(town)+' Gym; matched to whoever answers',route:'',place:'In the '+trName(town)+' Gym',st:'open'};
  }
  const team=full.slice(0,n);
  if(team.length<n)team.push(...rdbTeam(ty,'4',n-team.length,'gl|'+g.k,team));
  return {k:rkKey(),id:g.id,kind:'gl',mode,gym:g.k,name:lname,home:trName(town),rank:'4',bd:8,pos:null,rec:'',ty,n,team,where:'',
    jt:(mode==='rematch'?'A rematch':'An exhibition')+' with the '+g.badge+' Badge Leader, at full strength',route:'',place:'In the '+trName(town)+' Gym',rep:RDB_REP_ADJ[rp[0]]||0,repName:rp[1],st:'open'};
}
function rdbGymAdd(){
  const u=S.ui.rdb,n=clamp(Math.round(num(u.gn))||3,1,6),f=rdbGymFoe(u.gym||'coal',u.gk||'rematch',n);
  const cur=rdbCur(),today=clToday()||'';
  let c;
  if(cur&&cur.date===today)c=JSON.parse(JSON.stringify(cur));
  else c={k:rkKey(),d6:0,zone:rdbZone(),date:today,at:'',want:0,foes:cur?cur.foes.filter(x=>rdbIsGym(x)&&rdbUnfinished(x)):[],gymOnly:1};
  c.foes.push(f);rdbSaveCur(c);
  toast(f.kind==='gl'?f.name+(f.mode==='rematch'?' rematch':' exhibition')+' added: '+n+'-on-'+n+'.':f.name+' is ready at the '+f.home+' Gym.',true);
  render();
}
function rdbSwap(k){
  const cur=rdbCur();if(!cur)return;
  if(rdbIsGym(cur.foes.find(x=>x.k===k)))return;
  const skip=new Set(cur.foes.map(x=>x.id)),dr=rdbDraw(1,skip);
  if(!dr.foes.length){toast('Nobody else on the board to swap in.');return;}
  const c=JSON.parse(JSON.stringify(cur));
  c.foes=c.foes.map(x=>x.k===k?dr.foes[0]:x);
  delete S.ui.rdb.f[k];
  rdbSaveCur(c);render();
}
function rdbAct(b){
  if(!S.me.admin)return;
  const d=b.dataset,u=S.ui.rdb;
  switch(d.act){
    case 'rdb_zone':u.zone=d.v;render();break;
    case 'rdb_roll':rdbRoll();break;
    case 'rdb_gym':rdbGymAdd();break;
    case 'rdb_clear':edit('gr','road','cur',null);u.f={};render();break;
    case 'rdb_no':{const f=rdbSetFoe(d.k,{st:'no'});if(f)rdbSaveLog(rdbLog().concat([{k:d.k,date:clToday()||'',at:Date.now(),foe:f.name,fid:f.id,res:'no'}]));render();break;}
    case 'rdb_undo':rdbUndo(d.k);break;
    case 'rdb_swap':rdbSwap(d.k);break;
    case 'rdb_who':{const x=rdbUi(d.k);if(x.uid!==d.v){x.uid=d.v;x.mons=[];}render();break;}
    case 'rdb_mon':{
      const x=rdbUi(d.k),f=(rdbCur()||{foes:[]}).foes.find(y=>y.k===d.k);if(!f)break;
      const i=x.mons.indexOf(d.id);
      if(i>=0)x.mons.splice(i,1);
      else if(x.mons.length<f.n)x.mons.push(d.id);
      else toast('This challenge is '+f.n+'-on-'+f.n+'. Take one out first.');
      render();break;}
    case 'rdb_froll':{rdbUi(d.k).fd=String(encRand(1,20));render();break;}
    case 'rdb_settle':rdbSettle(d.k);break;
    case 'rdb_pay':rdbPay(d.k);break;
  }
}
/* the d20 boxes keep what is typed without redrawing the page */
function rdbInput(t){const [k,f]=String(t.dataset.rdb).split('|');if(k&&(f==='pd'||f==='fd'))rdbUi(k)[f]=t.value;}

/* ----- the panel ----- */
function rdbPlaceOpts(sel,trip){
  const opt=(v,l)=>h`<option value="${v}" ${v===sel?raw('selected'):''}>${l}</option>`;
  const routes=[...new Set(TR_LEGS.map(l=>l[0]))].filter(id=>PD_BY[id]).map(id=>PD_BY[id]).sort(natural);
  return h`${trip?opt('trip','Where the trip has reached'):opt('','Choose a place')}
    <optgroup label="Towns and places">${TR_NODES.filter(f=>f.t!=='r').map(f=>opt(f.id,f.name))}</optgroup>
    <optgroup label="Routes">${routes.map(f=>opt(f.id,f.name))}</optgroup>`;
}
function rdbFoeHtml(f){
  const u=rdbUi(f.k),F=f.fight,rk=qnRankName(f.rank)||'Novice',gym=rdbIsGym(f),old=f.tb==null&&!gym;
  const mode=gym?(RDB_GKINDS.find(x=>x[0]===f.mode)||['','Gym battle'])[1]:'';
  const facts=gym?[f.home+' Gym',f.kind==='gl'?'Gym Leader':'Gym trainer']:[f.home,rk,rkPl(f.bd,'badge'),f.tn?'best tier '+f.tn:'','#'+f.pos+' on the Gym board',String(f.rec||'').replace(/ · \d+ badges?$/,'')];
  const head=h`<div class="row sp"><span><b>${f.name}</b>${f.kind==='rival'?h` <span class="pill">Rival</span>`:''}${gym?h` <span class="pill gm">${mode}</span>`:''} <span class="sub">${facts.filter(Boolean).join(' · ')}</span></span>
    ${f.st==='no'?h`<span class="pill">${gym?'Called off':'Declined'}</span>`:f.st==='done'?h`<span class="pill ${F&&F.win?'resolved':'wary'}">${rdbResName(F&&F.res)}</span>`:''}</div>`;
  const repTxt=f.kind==='gl'&&num(f.rep)?' '+(num(f.rep)>0?'+ ':'− ')+Math.abs(num(f.rep))+' for a '+String(f.repName||'').toLowerCase()+' Gym':'';
  const roll=f.kind==='gl'?'d20 + 9 at full strength'+repTxt+' = d20 + '+(9+num(f.rep))+'.'
    :f.kind==='gt'?'matched to whoever answers: the same bonus as the player.'
    :old?'d20 + '+f.rb+' for rank + '+f.bb+' for badges = d20 + '+(num(f.rb)+num(f.bb))+'.'
    :'d20 + '+f.tb+' for their best tier ('+f.tn+') + '+f.bb+' for badges = d20 + '+(f.tb+f.bb)+'.';
  const info=h`<div class="rdbwhere">${f.jt||f.where}.</div>
    <div><b>${gym?'A '+f.n+'-on-'+f.n+' battle.':'Wants a '+f.n+'-on-'+f.n+' battle.'}</b> ${gym?'Uses':'Favours'} ${f.ty}-types: ${f.team.join(', ')||'no team named'}.</div>
    <div class="sub">Their roll: ${roll}</div>`;
  if(f.st==='no')return h`<div class="rdbf no">${head}<div class="row"><span class="sub">${gym?'Called off. No money.':'The party passed. No points, no money.'}</span><button class="btn sm ghost" data-act="rdb_undo" data-k="${f.k}">Undo</button></div></div>`;
  if(f.st==='done'&&F){
    const rp=F.pts?h`Recorded on the Gym rankings: ${F.pname} <b>${rkSgn(F.pts.a)} RP</b>, ${f.name} <b>${rkSgn(F.pts.b)} RP</b>.`:h`${F.why||'Not recorded on the rankings.'}`;
    return h`<div class="rdbf done">${head}${info}
      <div class="rdbres ${F.win?'win':'loss'}"><span><b>${rdbResName(F.res)}</b>, by ${Math.abs(F.m)}${F.m===0?' (a tie goes to the player)':''}.</span>
        <span class="sub">${F.pname}: ${F.pd} + ${F.tb!=null?F.tb+' tier':F.lv+' level'} + ${F.bb} badges = <b>${F.pt}</b> · ${f.name}: ${F.fd} + ${F.fb!=null?F.fb:num(f.rb)+num(f.bb)} = <b>${F.ft}</b></span></div>
      <div><span class="fl">What it cost (apply by hand)</span><ul class="rdbcost">${F.mons.map(m=>h`<li><b>${m.name}</b>: ${m.faint?h`<span class="rdbko">faints</span> (${m.cur} HP lost)`:h`−${m.hp} HP (${m.pct}% of ${m.max}) → ${m.after}/${m.max}${m.hold?', hangs on':''}`}; ${m.uses?'spends '+m.uses+' daily '+(m.uses===1?'use':'uses'):'no daily uses spent'}</li>`)}</ul>
        ${F.inj?h`<p><span class="rdbko">Injury:</span> ${F.inj.name} is hurt (d6 rolled ${F.inj.r}). What that means is your call.</p>`:F.res==='close'||F.res==='rout'?h`<p class="sub">Injury check: no injury.</p>`:''}</div>
      <div class="row"><span>${F.win?h`<b>${F.pname}</b> wins <b>${fmtP(F.prize)}</b> from ${f.name}.`:h`<b>${F.pname}</b> owes ${f.name} <b>${fmtP(F.prize)}</b>.`}</span>
        ${F.paid?h`<span class="pill resolved">${F.win?'Paid':'Paid '+fmtP(-num(F.moved))+(-num(F.moved)<F.prize?' (all they had)':'')}</span>`:h`<button class="btn sm primary" data-act="rdb_pay" data-k="${f.k}">Pay out</button>`}</div>
      <p class="sub">${rp}</p>
      <div class="row"><button class="btn sm ghost" data-act="rdb_undo" data-k="${f.k}">Undo this battle</button></div></div>`;
  }
  const pcs=tids().filter(id=>S.trainers[id]&&S.trainers[id].name),t=S.trainers[u.uid];
  const party=t?partyOf(u.uid):[],need=t?Math.min(f.n,party.length):f.n;
  const pk=t?rdbPeakOf(u.uid):0,tb=rdbTierB(pk),bd=t?badgeCount(t):0;
  return h`<div class="rdbf">${head}${info}
    <div class="fld"><span class="fl">Who answers</span><span class="seg" role="group" aria-label="Who answers ${f.name}">${pcs.map(id=>h`<button data-act="rdb_who" data-k="${f.k}" data-v="${id}" aria-pressed="${String(u.uid===id)}">${tName(S.trainers[id])}</button>`)}</span></div>
    ${t?h`<p class="sub">${tName(t)}: d20 + ${tb} for their best tier (${rdbTierName(pk)}) + ${rdbBdBonus(bd)} for ${rkPl(bd,'badge')} = d20 + ${tb+rdbBdBonus(bd)}${f.kind==='gt'?', and the Gym trainer matches it':''}.</p>
      <div class="fld"><span class="fl">${tName(t)} sends out ${need} (${u.mons.length} picked)</span>
        ${party.length?h`<span class="seg rdbmons" role="group" aria-label="Pokémon for this battle">${party.map(m=>{const i=u.mons.indexOf(m.id);return h`<button data-act="rdb_mon" data-k="${f.k}" data-id="${m.id}" aria-pressed="${String(i>=0)}">${i>=0?(i+1)+'. ':''}${mName(m)} <span class="sub">${m.hp?num(m.hp.cur)+'/'+num(m.hp.max):''}</span></button>`;})}</span>`:h`<span class="sub">No Pokémon with them.</span>`}</div>
      <div class="fgrid">
        <label class="fld"><span class="fl">${tName(t)}’s d20 (their real roll)</span><input type="number" min="1" max="20" inputmode="numeric" data-rdb="${f.k}|pd" value="${u.pd}"></label>
        <label class="fld"><span class="fl">${f.name}’s d20</span><span class="row"><input type="number" min="1" max="20" inputmode="numeric" data-rdb="${f.k}|fd" value="${u.fd}" placeholder="Rolled if empty"><button class="btn sm" data-act="rdb_froll" data-k="${f.k}">Roll</button></span></label>
      </div>`:''}
    <div class="row">${t?h`<button class="btn sm primary" data-act="rdb_settle" data-k="${f.k}">Settle the battle</button>`:''}<button class="btn sm" data-act="rdb_no" data-k="${f.k}">${gym?'Call it off':'Declined'}</button>${gym?'':h`<button class="btn sm ghost" data-act="rdb_swap" data-k="${f.k}">Swap for another trainer</button>`}</div>
  </div>`;
}
function rdbPanel(){
  if(!S.me.admin)return '';
  const u=S.ui.rdb,cur=rdbCur(),t=clTrip(),trip=!!(t&&!t.done);
  if(!u.at&&trip)u.at='trip';
  if(u.at==='trip'&&!trip)u.at='';
  const P=rdbParty(),zone=rdbZone(),seeded=rkWith('gym',()=>!!rkB().seed||rkNpcs().length>0);
  const recent=rdbLog().slice(-6).reverse();
  return h`<section class="panel rdb" id="roadbattles"><div class="ph"><h2>Road battles</h2><span class="pill">GM only</span></div>
    <p class="sub">Roll once per travel day. Players never see this panel; a battle reaches the rankings feed only when you settle it.</p>
    <div class="fgrid">
      <label class="fld"><span class="fl">Where the party is</span><select data-u="rdb.at">${rdbPlaceOpts(u.at,trip)}</select></label>
      <label class="fld"><span class="fl">Your d6 (optional)</span><input type="number" min="1" max="6" inputmode="numeric" data-u="rdb.d6" data-nr value="${u.d6}" placeholder="Rolled if empty"></label>
    </div>
    <div class="row"><span class="fl">Zone</span><span class="seg" role="group" aria-label="Zone">${RDB_ZONES.map(([v,l])=>h`<button data-act="rdb_zone" data-v="${v}" aria-pressed="${String(zone===v)}">${l}</button>`)}</span></div>
    <p class="sub">${P?P.txt+'. ':'Start a trip or choose where the party is. '}On the road a 3–5 brings one trainer and a 6 brings two; on the semi-route a 5–6 brings one; off-route only a 6.</p>
    ${seeded?'':h`<p class="sub rdbwarn">The Gym circuit rankings have no field trainers or rivals yet, so nobody can turn up. Fill the board on the Rankings page first.</p>`}
    <div class="row"><button class="btn primary sm" data-act="rdb_roll" ${P?'':raw('disabled')}>Roll for trainers</button>${cur?h`<button class="btn sm ghost" data-act="rdb_clear">Clear the day</button>`:''}</div>
    <div class="rdbgym" role="group" aria-label="Gym battle"><span class="fl">Gym battle</span>
      <div class="fgrid">
        <label class="fld"><span class="fl">Gym</span><select data-u="rdb.gym" data-nr>${RK_GYMS.map(g=>h`<option value="${g.k}" ${g.k===u.gym?raw('selected'):''}>${trName(RDB_GYM_AT[g.k])}: ${rkGymName(g)}</option>`)}</select></label>
        <label class="fld"><span class="fl">Against</span><select data-u="rdb.gk" data-nr>${RDB_GKINDS.map(([v,l])=>h`<option value="${v}" ${v===u.gk?raw('selected'):''}>${l}</option>`)}</select></label>
        <label class="fld"><span class="fl">Pokémon a side</span><select data-u="rdb.gn" data-nr>${[1,2,3,4,5,6].map(n=>h`<option value="${n}" ${String(n)===String(u.gn)?raw('selected'):''}>${n}</option>`)}</select></label>
      </div>
      <div class="row"><button class="btn sm" data-act="rdb_gym">Add the Gym battle</button><span class="sub">Rematches, exhibitions and Gym trainers only, never a badge battle. Prize money, no ranking points.</span></div>
    </div>
    ${cur?h`<div class="rdbday">${cur.gymOnly?h`<p><b>${cur.date?clNice(cur.date)+' · ':''}Gym battles</b></p>`:h`<p><b>${cur.date?clNice(cur.date)+' · ':''}d6: ${cur.d6}</b>${cur.typed?' (your roll)':''} ${(RDB_ZONES.find(z=>z[0]===cur.zone)||['',''])[1].toLowerCase()}, ${cur.at.charAt(0).toLowerCase()+cur.at.slice(1)}: ${cur.want?(cur.want===1?'one trainer wants':'two trainers want')+' a battle.':'nobody challenges the party today.'}</p>`}
      ${cur.wide?h`<p class="sub">Nobody on the board is walking near the party today, so ${cur.foes.length===1?'this trainer was':'these trainers were'} picked by standing alone.</p>`:''}
      ${cur.want&&!cur.foes.length?h`<p class="sub">The board has nobody to send.</p>`:''}
      ${cur.foes.map(rdbFoeHtml)}</div>`:''}
    ${recent.length?h`<details class="rdblog"><summary>Recent road battles</summary><ul class="mini-list">${recent.map(x=>h`<li>${x.date?clNice(x.date)+': ':''}${x.res==='no'?h`passed on ${x.foe}`:h`${x.pname} vs ${x.foe}, ${rdbResName(x.res).toLowerCase()} (${x.pay>=0?'+':'−'}${fmtP(Math.abs(num(x.pay)))}${x.paid?', paid':''})`}</li>`)}</ul></details>`:''}
    <details class="clrd"><summary>How road battles work</summary><ul class="tprules">
      <li><b>Who turns up.</b> Trainers on the Gym circuit rankings travel too: from home to their next Gym, resting a few days after each badge. The ones walking the party’s road are likeliest, then those a town or two away; those close to the players in the standings come up more, and tracked rivals twice as often.</li>
      <li><b>Rank and challenge.</b> 0–1 badges Novice (1-on-1), 2–3 Skilled (1 or 2), 4–5 Experienced (2 or 3), 6+ Ace (3). A rival with a Quick NPC sheet keeps the sheet’s rank and team. The party chooses who answers, and anyone may decline.</li>
      <li><b>The roll.</b> Both sides: d20 + their best-ever tier on the Gym circuit (Unranked rookie +1, Ranked +2, Top 150 +3, Top 50 +4, Top 10 +5) + 1 per 2 badges. The player rolls real dice. Win by 5+ clean win, 0–4 hard-fought win, lose by 1–4 close loss, 5+ rout.</li>
      <li><b>The cost.</b> Each Pokémon sent out loses d4 × 10% of its max HP on a clean win, × 15% on a hard win, × 20% on a close loss (and the last one out faints); in a rout all of them faint. Daily uses: 0–1 each on a clean win, 1–2 on a hard win or close loss, 2–3 in a rout. An injury comes on a 1 in 6 after a close loss, 1–2 after a rout. Nothing is applied for you.</li>
      <li><b>Money and standing.</b> The winner takes 300 P × (the loser’s badges + 1). It counts as a public battle on the rankings: +5 RP to the winner (+10 for beating a higher-ranked trainer), −5 to the loser.</li>
      <li><b>Gym battles.</b> Rematches and exhibitions put the Leader at full strength (d20 + 9, one less for an easy Gym, up to two more for a brutal one) with their strongest saved team; a Gym trainer matches whoever answers. You choose how many Pokémon a side. A Leader who loses pays the top prize (2,700 P); a player who loses pays as usual. Nothing goes on the rankings, and badge battles are never settled this way.</li>
    </ul></details>
  </section>`;
}
