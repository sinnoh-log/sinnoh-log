'use strict';
/* Sinnoh Trainer Log · 09c-growth. The files in js/ are classic scripts that share one scope: load them in order (see index.html). */
/* ---------- Team growth (Update 58): circuit trainers' teams change as badges are won ----------
   Who: every trainer on the Gym circuit rankings. Rivals with an NPC sheet get proposals the GM accepts, rerolls or skips
   on the GM Desk; everyone else (the field, and rivals without a sheet) has a saved team that changes by itself.
   When: one growth check each time a trainer earns a badge (a week on the rankings, or a paced rival following the players),
   and one for everybody each time the party's average badge count goes up.
   How often a check becomes a step: 0-2 badges always, 3-5 half the time, 6-7 rarely (15%), 8 never. Nobody grows past six
   fully evolved Pokémon, so veterans stay put.
   A step: catch a Pokémon (from the routes between home and their latest Gym, leaning to their favourite type and their
   style; now and then one from another region), evolve one (natural any time; stone, item and place evolutions at 3+
   badges; the last stage of a three-stage line at 4+; pseudo-legends at 6+), learn a move (rivals with sheets), or swap the
   weakest of a full team for something better. A rival's Quick NPC rank rises with their badges, on the same marks as road
   battles. Hand-written saved teams no longer load for rivals on the rankings.
   Kept in gm/teams (GM only): pb (party average last seen), f {<row id>: {sp:[names], bd, ty}}, n {<sheet id>: {bd}},
   q [rival proposals], log [the field's changes, newest last, for undo] */

const GR_CHANCE=bd=>bd>=8?0:bd>=6?0.15:bd>=3?0.5:1;
const grTarget=bd=>bd>=7?6:bd>=5?5:bd>=3?4:bd>=1?3:2;
const GR_PSEUDO=new Set(['Dragonite','Tyranitar','Salamence','Metagross','Garchomp','Hydreigon','Goodra','Kommo-o','Dragapult','Baxcalibur']);
const GR_REGIONS=[[151,'Kanto'],[251,'Johto'],[386,'Hoenn'],[493,'Sinnoh'],[649,'Unova'],[721,'Kalos'],[809,'Alola'],[905,'Galar'],[1025,'Paldea']];
const grRegion=id=>(GR_REGIONS.find(r=>id<=r[0])||[0,'another region'])[1];
const GR_IMPORT=0.08;
const GR_LEG=[[638,649],[716,721],[772,773],[785,809],[888,898],[905,905],[984,995],[1001,1010],[1014,1025]];
const grLegend=(id,s,n)=>RDB_LEGEND.has(id)||GR_LEG.some(([a,b])=>id>=a&&id<=b)||(s>=580&&!GR_PSEUDO.has(n));
const grG=()=>S.teamGm||{};
const grQ=()=>Array.isArray(grG().q)?grG().q:[];
const grLog=()=>Array.isArray(grG().log)?grG().log:[];
const grPartyAvg=()=>{const ps=entriesOf(S.trainers).filter(t=>t.name);return ps.length?Math.floor(ps.reduce((a,t)=>a+badgeCount(t),0)/ps.length):0;};
const grRankN=r=>qnRankNum(r)||1;
S.ui.gr=S.ui.gr||{busy:false,msg:''};

/* ----- species ----- */
const GR_INFO=new Map();
function grInfo(n){
  const k=String(n||'').trim();if(!k)return null;
  if(GR_INFO.has(k))return GR_INFO.get(k);
  const i=speciesInfo(k);
  const o=i?{n:i.form?k:i.name,id:i.id,ty:i.types,s:rdbBst(i),b:i.base}:null;
  GR_INFO.set(k,o);return o;
}
let GR_NAT=null;
/* species from other regions a trainer might trade for or meet abroad */
function grImports(){
  if(GR_NAT)return GR_NAT;
  const o=[];
  for(let id=1;id<=DEXA.length;id++){
    if(id>=387&&id<=493)continue;
    const i=dexInfo(id),s=rdbBst(i);
    if(grLegend(id,s,i.name))continue;
    o.push({n:i.name,id,ty:i.types,s,b:i.base});
  }
  return (GR_NAT=o);
}
/* the evolutions the handbook lists, read once from every letter of the Pokédex: ev name -> [{n, c}], pre name -> from */
let GR_DEX=null;
async function grLoadDex(){
  if(GR_DEX)return GR_DEX;
  if(!PTA.idx)return null;
  const Ls=[...new Set(PTA.idx.names.map(n=>ptaLetter(ptaKey(n))))];
  const got=await Promise.all(Ls.map(L=>ptaChunk(L)));
  const ev=new Map(),pre=new Map();
  Ls.forEach(L=>{const c=PTA.chunks[L]||{};Object.keys(c).forEach(k=>{const r=c[k];if(r&&Array.isArray(r.ev)&&r.ev.length){
    ev.set(k,r.ev.filter(o=>o&&o.n).map(o=>({n:o.n,c:o.c||''})));
    r.ev.forEach(o=>{if(o&&o.n&&!pre.has(ptaKey(o.n)))pre.set(ptaKey(o.n),r.n);});
  }});});
  const dx={ev,pre};
  if(got.every(Boolean))GR_DEX=dx;
  return dx;
}
const grFinal=(n,dex)=>!dex||!(dex.ev.get(ptaKey(n))||[]).length;
/* the evolutions a trainer with this many badges may use */
function grEvoOpts(n,bd,dex){
  if(!dex)return [];
  const k=ptaKey(n),third=dex.pre.has(k);
  return (dex.ev.get(k)||[]).filter(o=>{
    if(o.c&&bd<3)return false;
    if(third&&!(dex.ev.get(ptaKey(o.n))||[]).length&&bd<4)return false;
    if(GR_PSEUDO.has(o.n)&&bd<6)return false;
    return !!grInfo(o.n)||!!ptaResolve(o.n);
  });
}
/* how well a species suits a battle style (0.3 to 2.5) */
function grStyleW(style,x){
  const b=x.b||{},atk=num(b.atk),spa=num(b.spa),def=num(b.def),spd=num(b.spd),spe=num(b.spe),tot=atk+spa+def+spd+spe||1;
  const sh=[atk,spa,def,spd,spe].map(v=>v/tot),mean=0.2,sd=Math.sqrt(sh.reduce((a,v)=>a+(v-mean)*(v-mean),0)/5);
  let w=1;
  if(style==='Aggressor')w=0.5+3*Math.max(atk,spa)/tot;
  else if(style==='Defender')w=0.5+2.5*(def+spd)/tot;
  else if(style==='Trickster')w=0.5+5*spe/tot;
  else if(style==='Generalist')w=1.6-6*sd;
  else if(style==='Showman')w=0.8+(x.ty[1]?0.4:0)+x.s/600;
  return clamp(w,0.3,2.5);
}
/* the routes on a trainer's road so far: home, each Gym in the order they won it, then their next Gym */
const GR_RS=new Map();
function grRouteSp(r,W){
  const home=RDB_TOWN[rdbHomeName(r.home)]||'jubilife-city',held=rdbHeld(r,W);
  const order=Object.keys(held).sort((a,b)=>num(held[a])-num(held[b])).map(Number);
  let next=0;while(held[next]!=null&&next<RK_GYMS.length)next++;
  const stops=[home].concat(order.map(g=>RDB_GYM_AT[RK_GYMS[g].k]),next<RK_GYMS.length?[RDB_GYM_AT[RK_GYMS[next].k]]:[]);
  const key=stops.join('>');
  if(GR_RS.has(key))return GR_RS.get(key);
  const routes=new Set();
  for(let i=1;i<stops.length;i++)(rdbPath(stops[i-1],stops[i])||[]).forEach(e=>{if(e.leg)routes.add(e.leg[0]);});
  const sp=new Map();
  routes.forEach(id=>{
    const z=ZN_ROUTES[id],nm=rdbRouteName(id);
    if(z)z[0].forEach(bm=>{const P=ZN_POOL[bm];if(P)['semi','off'].forEach(k=>(P[k]||[]).forEach(x=>{if(!sp.has(x[0]))sp.set(x[0],nm);}));});
    encTabs(id).forEach(t=>{if(t&&t.T)encRows(t.T).forEach(x=>{const n=String(x.sp||'').trim();if(encOk(x)&&n&&!sp.has(n))sp.set(n,nm);});});
  });
  GR_RS.set(key,sp);
  return sp;
}
/* one new Pokémon for a trainer: {n, from} or null. ctx {bd, ty, style, rs (route species -> route name)}; min: the
   strength it must beat (a swap) */
function grPick(ctx,have,min,only){
  const [lo,hi]=RDB_BAND[rdbRankOfBadges(ctx.bd)]||RDB_BAND['1'];
  const own=new Set(have.map(n=>(grInfo(n)||{n}).n));
  const tw=x=>x.ty.indexOf(ctx.ty)>=0?(ctx.style==='Specialist'?20:8):1;
  const ok=x=>x&&!own.has(x.n)&&x.s<=hi&&(!min||x.s>=min)&&(!only||x.ty.indexOf(ctx.ty)>=0);
  const pickFrom=list=>{
    const tot=list.reduce((a,c)=>a+c.w,0);if(!tot)return null;
    let z=Math.random()*tot;for(const c of list){z-=c.w;if(z<=0)return c;}return list[list.length-1];
  };
  if(!only&&Math.random()<GR_IMPORT){
    const c=pickFrom(grImports().filter(ok).map(x=>({x,w:tw(x)*grStyleW(ctx.style,x)*(x.s<lo?0.3:1)})));
    if(c)return {n:c.x.n,from:grRegion(c.x.id)};
  }
  const seen=new Set(),list=[];
  rdbLocal().concat([...ctx.rs.keys()].map(n=>({n}))).forEach(y=>{
    const x=grInfo(y.n);if(!ok(x)||seen.has(x.n))return;seen.add(x.n);
    const route=ctx.rs.get(y.n)||ctx.rs.get(x.n)||'';
    list.push({x,route,w:(route?1:0.35)*tw(x)*grStyleW(ctx.style,x)*(x.s<lo?0.3:1)});
  });
  const c=pickFrom(list);
  return c?{n:c.x.n,from:c.route||'Sinnoh'}:null;
}
/* the weakest member of a full team, if it is clearly behind the rest */
function grWeak(names,bd){
  if(names.length<6)return null;
  const [lo]=RDB_BAND[rdbRankOfBadges(bd)]||RDB_BAND['1'];
  const xs=names.map((n,i)=>({i,n,s:(grInfo(n)||{s:0}).s})).sort((a,b)=>a.s-b.s);
  const avg=xs.reduce((a,x)=>a+x.s,0)/xs.length;
  return xs[0].s<lo||xs[0].s<avg-90?xs[0]:null;
}
/* one growth step for a team of species names: {kind, ...} or null when they have nothing left to do */
function grStep(names,ctx,dex,canLearn){
  const bd=ctx.bd,evo=names.map((n,i)=>({i,n,o:grEvoOpts(n,bd,dex)})).filter(x=>x.o.length),weak=grWeak(names,bd);
  const done=names.length>=6&&names.every(n=>grFinal(n,dex))&&!weak;
  if(done)return null;
  const opts=[];
  if(names.length<6)opts.push(['catch',names.length<grTarget(bd)?6:1.5]);
  if(evo.length)opts.push(['evolve',4]);
  if(weak)opts.push(['swap',3]);
  if(canLearn)opts.push(['learn',2]);
  while(opts.length){
    const tot=opts.reduce((a,o)=>a+o[1],0);let z=Math.random()*tot,j=0;
    for(;j<opts.length-1;j++){z-=opts[j][1];if(z<=0)break;}
    const k=opts[j][0];opts.splice(j,1);
    if(k==='catch'){const p=grPick(ctx,names);if(p)return {kind:'catch',sp:p.n,from:p.from};}
    if(k==='evolve'){
      const x=evo[Math.floor(Math.random()*evo.length)];
      const fit=x.o.filter(o=>{const i=grInfo(o.n);return i&&i.ty.indexOf(ctx.ty)>=0;});
      const o=(fit.length?fit:x.o)[Math.floor(Math.random()*(fit.length||x.o.length))];
      return {kind:'evolve',i:x.i,from:x.n,to:o.n,c:o.c||''};
    }
    if(k==='swap'){const p=grPick(ctx,names,weak.s+50);if(p)return {kind:'swap',i:weak.i,from:weak.n,sp:p.n,origin:p.from};}
    if(k==='learn')return {kind:'learn'};
  }
  return null;
}
const grFrom=f=>!f?'':f==='Sinnoh'?'elsewhere in Sinnoh':GR_REGIONS.some(r=>r[1]===f)||f==='another region'?'from '+f:'on '+f;
function grText(st){
  if(st.kind==='catch')return 'caught '+st.sp+' '+grFrom(st.from);
  if(st.kind==='evolve')return st.from+' evolved into '+st.to+(st.c?' ('+st.c+')':'');
  if(st.kind==='swap')return 'swapped '+st.from+' for '+st.sp+(st.origin?' '+grFrom(st.origin):'');
  if(st.kind==='learn')return (st.sp||'A Pokémon')+' learned '+st.move+(st.drop?' in place of '+st.drop:'');
  if(st.kind==='rank')return 'rank '+(qnRankName(st.from)||st.from)+' to '+(qnRankName(st.to)||st.to);
  return '';
}

/* ----- the field's saved teams ----- */
function grCtx(r,W,ty){return {bd:num(r.bd),ty,style:r.lab||'',rs:grRouteSp(r,W)};}
function grNewTeam(r,W){
  const ty=rdbHomeType(r.name,rdbHomeName(r.home)),ctx=grCtx(r,W,ty),sp=[];
  /* their first Pokémon is always their favourite type */
  for(let i=0;i<grTarget(num(r.bd));i++){const p=(i===0&&grPick(ctx,sp,0,true))||grPick(ctx,sp);if(p)sp.push(p.n);}
  return {sp,bd:num(r.bd),ty};
}
/* a field trainer's (or sheetless rival's) team, made and saved the first time it is needed */
function grTeamOf(r,W){
  const e=(grG().f||{})[r.id];
  if(e&&Array.isArray(e.sp)&&e.sp.length)return e;
  if(!S.me.admin)return null;
  const t=grNewTeam(r,W);
  edit('gf','teams','f.'+r.id,t);
  return t;
}

/* ----- rivals with sheets: proposals ----- */
/* a rival's team as species names, with the proposals still waiting applied */
function grVirtual(id,Q){
  const team=ntTeam(NTS()[id]).map(m=>({mid:m.id,n:m.sp||m.species||''}));
  Q.filter(p=>p.nt===id).forEach(p=>{
    if(p.kind==='catch')team.push({mid:'',n:p.sp});
    else if(p.kind==='evolve'||p.kind==='swap'){const m=team.find(x=>x.mid===p.mid);if(m)m.n=p.kind==='evolve'?p.to:p.sp;}
  });
  return team;
}
const grMvAvg=def=>{const d=parseDice(def&&def.d);return d?d.n*((d.mon?8:d.s)+1)/2+d.f:4;};
/* the strongest attack a trainer with this many badges teaches: about 2d6 for a rookie, rising 3 a badge */
const grMvCap=bd=>9+3*num(bd);
const grMvScore=(def,types,style)=>{
  if(!def)return 0;
  if(def.k==='Effect')return 8*(style==='Trickster'?2:style==='Defender'?1.4:0.7);
  const avg=grMvAvg(def);
  const f=String(def.f||'');
  return avg*(types.indexOf(def.t)>=0?1.5:1)*(/1\/day/i.test(f)?1.35:/3\/day|scene/i.test(f)?1.2:/eot/i.test(f)?1.1:1)*(style==='Aggressor'?1.2:1);
};
/* the best new move for someone on the sheet: {mid, sp, move, drop} or null */
async function grLearnPick(id,style,Q,bd){
  if(PTA.idx)await ptaLists();
  await pxLoad();
  const L=PTA.lists;if(!L||!L.moveMap)return null;
  const busy=new Set(Q.filter(p=>p.nt===id&&p.mid).map(p=>p.mid));
  const best=[];
  for(const m of ntTeam(NTS()[id])){
    if(busy.has(m.id))continue;
    const types=(m.ty||[]).filter(Boolean),known=new Set((m.mv||[]).map(x=>dexKey(x.name)));
    const pool=new Set(),own=new Set();
    const pr=ptaResolve(m.sp);
    if(pr){const rec=ptaRec(pr)||await ptaChunk(ptaLetter(ptaKey(pr))).then(()=>ptaRec(pr));((rec&&rec.mv)||[]).forEach(x=>{const k=dexKey(typeof x==='string'?x:x.n||'');pool.add(k);own.add(k);});}
    const lr=PX.d?pxLearnable(m.sp,types):null;if(lr)lr.forEach((v,k)=>pool.add(k));
    const sc=k=>grMvScore(L.moveMap.get(k),types,style)*(own.has(k)?1.3:1);
    const fits=k=>{const def=L.moveMap.get(k);return def&&(def.k==='Effect'||grMvAvg(def)<=grMvCap(bd));};
    const cand=[...pool].filter(k=>k&&!known.has(k)&&fits(k)).map(k=>({k,s:sc(k)})).sort((a,b)=>b.s-a.s).slice(0,4);
    if(!cand.length)continue;
    const c=cand[Math.floor(Math.random()*Math.min(2,cand.length))];
    const mv=(m.mv||[]).map(x=>({n:x.name,s:sc(dexKey(x.name))})).sort((a,b)=>a.s-b.s);
    const full=mv.length>=TPL_MAX.moves,gain=c.s-(full?mv[0].s:0);
    if(gain>0.5)best.push({mid:m.id,sp:m.nick||m.sp,move:L.moveMap.get(c.k).n,drop:full?mv[0].n:'',gain});
  }
  if(!best.length)return null;
  best.sort((a,b)=>b.gain-a.gain);
  const x=best[Math.floor(Math.random()*Math.min(2,best.length))];delete x.gain;return x;
}
async function grRivalStep(id,r,W,dex,Q){
  const nt=NTS()[id];if(!nt)return null;
  const q=qnOf(nt),team=grVirtual(id,Q),names=team.map(x=>x.n);
  const ty=(q&&q.ty)||rdbMainType(ntTeam(nt))||rdbHomeType(r.name,rdbHomeName(r.home));
  const ctx=grCtx(r,W,ty);
  for(let tries=0;tries<4;tries++){
    const st=grStep(names,ctx,dex,true);
    if(!st)return null;
    if(st.kind==='learn'){const l=await grLearnPick(id,ctx.style,Q,ctx.bd);if(l)return Object.assign({kind:'learn'},l);continue;}
    if(st.kind==='evolve'||st.kind==='swap'){
      const m=team[st.i];if(!m||!m.mid||Q.some(p=>p.nt===id&&p.mid===m.mid))continue;
      return Object.assign(st,{mid:m.mid});
    }
    return st;
  }
  return null;
}
async function grRival(id,r,W,steps,why,wk,dex,Q){
  const nt=NTS()[id];let n=0;
  for(let s=0;s<steps;s++){
    if(Math.random()>=GR_CHANCE(num(r.bd)))continue;
    const st=await grRivalStep(id,r,W,dex,Q);
    if(st){Q.push(Object.assign(st,{k:rkKey(),nt:id,name:ntName(nt),bd:num(r.bd),why,wk,at:Date.now()}));n++;}
  }
  const q=qnOf(nt),want=rdbRankOfBadges(num(r.bd));
  if(q&&q.r&&grRankN(want)>grRankN(q.r)&&!Q.some(p=>p.nt===id&&p.kind==='rank')){Q.push({kind:'rank',from:q.r,to:want,k:rkKey(),nt:id,name:ntName(nt),bd:num(r.bd),why,wk,at:Date.now()});n++;}
  return n;
}

/* ----- the run: after a week, after a player's badge, or when asked ----- */
let grRunning=null;
function grRun(why,wk){
  if(!S.me.admin)return Promise.resolve(null);
  if(grRunning)return grRunning.then(()=>grRun(why,wk));
  grRunning=grRunNow(why,wk).finally(()=>{grRunning=null;});
  return grRunning;
}
async function grRunNow(why,wk){
  const C=rdbCands();
  if(!C.rows.length)return null;
  const dex=await grLoadDex();
  const W=C.W,G=grG(),F=Object.assign({},G.f||{}),N=Object.assign({},G.n||{}),Q=grQ().slice(),logs=[];
  const pAvg=grPartyAvg(),party=G.pb==null?0:Math.max(0,pAvg-num(G.pb));
  let made=0,field=0,rivals=0;
  for(const r of C.rows){
    const sid=r.kind==='rival'&&r.npc&&r.npc.nt&&NTS()[r.npc.nt]?r.npc.nt:'';
    if(sid){
      const last=N[sid]?num(N[sid].bd):num(r.bd),own=Math.max(0,num(r.bd)-last);
      N[sid]={bd:num(r.bd)};
      if(own+party)rivals+=await grRival(sid,r,W,own+party,why,wk,dex,Q);
      continue;
    }
    let e=F[r.id];
    if(!e||!Array.isArray(e.sp)||!e.sp.length){F[r.id]=grNewTeam(r,W);made++;continue;}
    const own=Math.max(0,num(r.bd)-num(e.bd)),steps=own+party;
    e=Object.assign({},e,{bd:num(r.bd)});
    const before=e.sp.slice(),done=[],steps2=[];
    for(let s=0;s<steps;s++){
      if(Math.random()>=GR_CHANCE(num(r.bd)))continue;
      const st=grStep(e.sp,grCtx(r,W,e.ty),dex,false);
      if(!st)break;
      const sp=e.sp.slice();
      if(st.kind==='catch')sp.push(st.sp);else if(st.kind==='evolve')sp[st.i]=st.to;else if(st.kind==='swap')sp[st.i]=st.sp;
      e.sp=sp;done.push(grText(st));steps2.push({kind:st.kind,a:st.kind==='catch'?'':st.from,b:st.kind==='evolve'?st.to:st.sp});
    }
    if(done.length){logs.push({k:rkKey(),id:r.id,name:r.name,bd:num(r.bd),txt:done.join('; '),before,after:e.sp.slice(),steps:steps2,bd0:num((F[r.id]||{}).bd),why,wk,at:Date.now()});field++;}
    F[r.id]=e;
  }
  edit('gf','teams','f',F);edit('gf','teams','n',N);edit('gf','teams','q',Q.slice(-200));edit('gf','teams','pb',pAvg);
  if(logs.length)edit('gf','teams','log',grLog().concat(logs).slice(-150));
  edit('gf','teams','last',{why,wk:num(wk),at:Date.now(),field,rivals,made});
  return {field,rivals,made};
}
const grSay=r=>!r?'':[r.field?r.field+' field trainer'+(r.field===1?'':'s')+' changed their team':'',r.rivals?r.rivals+' rival change'+(r.rivals===1?'':'s')+' wait'+(r.rivals===1?'s':'')+' on the GM Desk':''].filter(Boolean).join('; ');
/* the first time the GM opens the site after Update 58: save everyone's current team and badges, without growing */
let grBoot=false;
function grEnsure(){
  if(grBoot||!S.me.admin||!S.gmIn)return;
  const ok=rkWith('gym',()=>!!rkB().seed||rkNpcs().length>0);
  if(!ok)return;
  grBoot=true;
  if(grG().pb!=null)return;
  grRun('setup',rkWith('gym',()=>num(rkB().wk)));
}
/* takes one logged change back out of a team, even if more has changed since: a catch is released, an evolution or a swap
   is reversed where that Pokémon is still on the team */
function grInverse(sp,x){
  if(JSON.stringify(sp)===JSON.stringify(x.after))return x.before.slice();
  const out=sp.slice();
  (Array.isArray(x.steps)?x.steps:[]).slice().reverse().forEach(st=>{
    const i=out.lastIndexOf(st.b);if(i<0)return;
    if(st.kind==='catch')out.splice(i,1);else out[i]=st.a;
  });
  return out;
}
/* a week is undone: the field's changes from the weeks undone go back; waiting proposals from them are dropped */
function grUnweek(w){
  const G=grG(),F=Object.assign({},G.f||{});let n=0;
  const keep=[];
  grLog().slice().reverse().forEach(x=>{
    if(x.why==='week'&&num(x.wk)>w&&F[x.id]){F[x.id]=Object.assign({},F[x.id],{sp:grInverse(F[x.id].sp,x),bd:num(x.bd0)});n++;}
    else keep.unshift(x);
  });
  if(!n&&!grQ().some(p=>p.why==='week'&&num(p.wk)>w))return 0;
  edit('gf','teams','f',F);edit('gf','teams','log',keep);
  edit('gf','teams','q',grQ().filter(p=>!(p.why==='week'&&num(p.wk)>w)));
  return n;
}

/* ----- the GM's answers ----- */
async function grMon(sp){
  const pr=ptaResolve(sp);let rec=null;
  if(pr)rec=ptaRec(pr)||await ptaChunk(ptaLetter(ptaKey(pr))).then(()=>ptaRec(pr));
  const si=rec?null:speciesInfo(sp);
  const mon=Object.assign({id:newMonId(),nick:'',bonus:zeroStats(),notes:'',item:'',up:'',down:'',natureName:'',sh:{name:false,pic:false,types:false,item:false}},foeFromRec(rec,si,sp));
  mon.mega=ntMegaAuto(mon);
  return mon;
}
async function grAccept(k){
  if(!S.me.admin)return false;
  const p=grQ().find(x=>x.k===k);if(!p)return false;
  const id=p.nt,nt=NTS()[id];
  if(!nt){edit('gf','teams','q',grQ().filter(x=>x.k!==k));render();return false;}
  const team=ntTeam(nt).slice(),j=p.mid?team.findIndex(m=>m.id===p.mid):-1;
  if(p.mid&&j<0){toast('That Pokémon is no longer on '+ntName(nt)+'’s team. Reroll or skip it.');return false;}
  if(p.mid&&ntInBattle(id,p.mid)){toast('That Pokémon is in a battle. End the battle first.');return false;}
  if(p.kind==='catch'){if(team.length>=6){toast(ntName(nt)+' already has six Pokémon. Reroll it into something else.');return false;}team.push(await grMon(p.sp));}
  else if(p.kind==='swap'){const m=await grMon(p.sp);team[j]=m;}
  else if(p.kind==='evolve'){
    const m=team[j],nx=await grMon(p.to),keep=(m.mv||[]).slice(),have=new Set(keep.map(x=>dexKey(x.name)));
    (nx.mv||[]).forEach(x=>{if(keep.length<TPL_MAX.moves&&!have.has(dexKey(x.name)))keep.push(x);});
    team[j]=Object.assign({},nx,{id:m.id,nick:m.nick||'',item:m.item||'',notes:m.notes||'',natureName:m.natureName||'',mv:keep});
    team[j].mega=ntMegaAuto(team[j]);
  }else if(p.kind==='learn'){
    const m=team[j],L=PTA.lists,def=L&&L.moveMap&&L.moveMap.get(dexKey(p.move));
    const row=def?{name:def.n,freq:def.f||'At-Will',kind:def.k||'Physical',range:def.r||'',type:def.t||'Normal',dice:def.d||'',text:def.x||'',used:0}:{name:p.move,freq:'At-Will',kind:'Physical',range:'',type:'Normal',dice:'',text:'',used:0};
    let mv=(m.mv||[]).slice();
    const di=p.drop?mv.findIndex(x=>dexKey(x.name)===dexKey(p.drop)):-1;
    if(di>=0)mv[di]=row;else if(mv.length<TPL_MAX.moves)mv.push(row);else{toast('No free move slot. Reroll it.');return false;}
    team[j]=Object.assign({},m,{mv});
  }else if(p.kind==='rank'){
    if(nt.q)edit('gt',id,'q.r',p.to);
  }
  if(p.kind!=='rank')edit('gt',id,'team',team);
  edit('gt',id,'glog',(Array.isArray(nt.glog)?nt.glog:[]).concat([{why:p.why==='week'?'week':'badge',wk:num(p.wk),txt:grText(p),auto:1}]).slice(-20));
  edit('gf','teams','q',grQ().filter(x=>x.k!==k));
  return true;
}
async function grReroll(k){
  const p=grQ().find(x=>x.k===k);if(!p)return;
  const C=rdbCands(),r=C.rows.find(x=>x.npc&&x.npc.nt===p.nt);
  if(!r){toast('This rival is no longer on the Gym rankings.');return;}
  const Q=grQ().filter(x=>x.k!==k),dex=await grLoadDex();
  let st=null;
  for(let i=0;i<5&&!st;i++){const t=await grRivalStep(p.nt,r,C.W,dex,Q);if(t&&grText(t)!==grText(p))st=t;}
  if(!st){toast('Nothing else fits '+p.name+' right now.');return;}
  edit('gf','teams','q',grQ().map(x=>x.k===k?Object.assign(st,{k:rkKey(),nt:p.nt,name:p.name,bd:p.bd,why:p.why,wk:p.wk,at:Date.now()}):x));
  render();
}
function grUndo(k){
  const x=grLog().find(y=>y.k===k),F=Object.assign({},grG().f||{});
  if(!x)return;
  if(!F[x.id])return;
  F[x.id]=Object.assign({},F[x.id],{sp:grInverse(F[x.id].sp,x)});
  edit('gf','teams','f',F);edit('gf','teams','log',grLog().filter(y=>y.k!==k));
  toast(x.name+'’s team is back as it was.',true);render();
}
async function grAct(b){
  if(!S.me.admin)return;
  const d=b.dataset,u=S.ui.gr;
  if(u.busy)return;
  const run=async f=>{u.busy=true;render();try{await f();}finally{u.busy=false;render();}};
  switch(d.act){
    case 'gr_ok':await run(async()=>{if(await grAccept(d.k))toast('Done.',true);});break;
    case 'gr_okall':await run(async()=>{let n=0;for(const p of grQ().slice()){if(await grAccept(p.k))n++;}toast(n?'Accepted '+n+' change'+(n===1?'':'s')+'.':'Nothing to accept.',true);});break;
    case 'gr_re':await run(()=>grReroll(d.k));break;
    case 'gr_skip':edit('gf','teams','q',grQ().filter(x=>x.k!==d.k));render();break;
    case 'gr_undo':grUndo(d.k);break;
    case 'gr_check':await run(async()=>{const r=await grRun('check',rkWith('gym',()=>num(rkB().wk)));toast(grSay(r)||'Nobody has earned anything new since the last check.',true);});break;
  }
}
function grDesk(){
  if(!S.me.admin)return '';
  setTimeout(()=>{try{grEnsure();}catch(e){}},0);
  const G=grG(),Q=grQ(),f=G.f||{},nF=Object.keys(f).length,recent=grLog().slice(-8).reverse(),u=S.ui.gr,last=G.last;
  const byNt={};Q.forEach(p=>{(byNt[p.nt]=byNt[p.nt]||[]).push(p);});
  return h`<section class="panel" id="teamgrowth"><div class="ph"><h2>Team growth</h2><span class="pill gm">GM only</span></div>
    <p class="sub">Party average: <b>${G.pb!=null?G.pb:grPartyAvg()} badge${num(G.pb!=null?G.pb:grPartyAvg())===1?'':'s'}</b> · ${nF} saved team${nF===1?'':'s'} in the field${last&&last.at?h` · last check ${new Date(last.at).toLocaleDateString()}`:''}.</p>
    ${Q.length?h`<div class="row sp"><span class="fl">Rival changes waiting (${Q.length})</span><button class="btn sm" data-act="gr_okall" ${u.busy?raw('disabled'):''}>Accept all</button></div>
      <ul class="grq">${Object.keys(byNt).map(id=>h`<li><div><b>${byNt[id][0].name}</b> <span class="sub">· ${rkPl(num(byNt[id][byNt[id].length-1].bd),'badge')}</span></div>
        <ul class="grsteps">${byNt[id].map(p=>h`<li class="grrow"><span>${grText(p).replace(/^./,c=>c.toUpperCase())}. <span class="sub">${p.why==='week'?'Won a badge (week '+p.wk+')':p.why==='badge'?'The party earned a badge':'Check'}</span></span>
          <span class="grbtns"><button class="btn sm primary" data-act="gr_ok" data-k="${p.k}" ${u.busy?raw('disabled'):''}>Accept</button>${p.kind==='rank'?'':h`<button class="btn sm" data-act="gr_re" data-k="${p.k}" ${u.busy?raw('disabled'):''}>Reroll</button>`}<button class="btn sm ghost" data-act="gr_skip" data-k="${p.k}">Skip</button></span></li>`)}</ul></li>`)}</ul>`
      :h`<p class="sub">No rival changes waiting.</p>`}
    ${recent.length?h`<details class="grlog"><summary>Recent changes in the field</summary><ul class="grsteps grfield">${recent.map(x=>h`<li class="grrow"><span><b>${x.name}</b> ${x.txt}. <span class="sub">${rkPl(num(x.bd),'badge')}</span></span><button class="btn sm ghost" data-act="gr_undo" data-k="${x.k}">Undo</button></li>`)}</ul></details>`:''}
    <div class="row"><button class="btn sm" data-act="gr_check" ${u.busy?raw('disabled'):''}>${u.busy?'Working…':'Check for growth now'}</button></div>
    <details class="clrd"><summary>How team growth works</summary><ul class="tprules">
      <li><b>When.</b> One check each time a trainer wins a badge (when you run a week, or when a rival paced to the players follows them), and one for everyone when the party’s average badge count goes up.</li>
      <li><b>How often.</b> 0–2 badges: every check grows the team. 3–5: half the time. 6–7: rarely. 8: never. Nobody grows past six fully evolved Pokémon.</li>
      <li><b>What.</b> Catch a Pokémon from the routes between home and their latest Gym, leaning to their favourite type and style (now and then one from another region); evolve one (natural any time; stones, items and places at 3+ badges; the last of three stages at 4+; pseudo-legends at 6+); learn a stronger move (rivals); or swap the weakest of a full team.</li>
      <li><b>Rivals</b> with an NPC sheet wait here for you; a rival’s Quick NPC rank rises with their badges (2 Skilled, 4 Experienced, 6 Ace). <b>Field trainers</b> change on their own; road battles meet the team they have.</li>
    </ul></details>
  </section>`;
}
