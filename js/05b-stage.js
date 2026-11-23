'use strict';
/* Sinnoh Trainer Log · 05b-stage. The files in js/ are classic scripts that share one scope: load them in order (see index.html). */
/* ---------- The live contest stage (Update 66) ----------
   A contest run like a battle, on the Contests page (Live stage). Option B judging: each appeal goes to one judge, and its
   Heart Points count only toward that judge's Star Points; goals that do not depend on appeals are judged across everyone.
   Where things live:
     meta/contest   what the table sees: the hall, the type, the variations, the stage and round, the judges (favoured type,
                    Voltage, Electrified), every entrant's Heart Points, the appeal order and log, goals revealed by Insight,
                    and the awards once the GM shows them. Only the GM writes it.
     gm/contest     the judges' hidden goals and the GM's choices for goals the GM judges. Only the GM can read it.
     trainers/<uid>.ctap
                    a player's appeal, sent from their own screen when it is their turn. The GM's page scores it (the same sums
                    as the Appeal helper, ctCalc) and writes the result, so the GM's page must be open during the contest.
   The site rolls the d4s, or the appealer types the total of real dice. NPC coordinators: the GM picks the move and judge.
   Variations: Double Performance (two Pokémon, one move's contest type with the other's keyword), Super Contest (a random
   type each round), Festival (each judge a different favoured type each round), High Voltage (judges start at 1; a rise
   adds that many d4; an Electrified judge adds 5d4 instead of doubling).
   At the end, the GM reveals the awards and one button ticks the winner's ribbon and logs the contest circuit rankings. */
S.ui.cs=S.ui.cs||null;          /* the GM's setup draft */
S.ui.csa=S.ui.csa||{};          /* the appeal form: j, m0, m1, tf, any, st, real, sum, e (whose form) */
S.csUndo=S.csUndo||[];
const CS_JUDGES=['Mr. Contesta','Mr. Sukizo','Nurse Joy'];
/* goal kinds: [key, text ({t} is a contest or battle type), what {t} is] */
const CS_GOALS=[
  ['hp','Most Heart Points',''],
  ['ct','Most Heart Points with {t} moves','ct'],
  ['ty','Most Heart Points with {t}-type moves','ty'],
  ['one','Most Heart Points in one appeal',''],
  ['cnt','Most appeals made to this judge',''],
  ['el','First to Electrify this judge',''],
  ['up','Raised this judge’s Voltage most often',''],
  ['fin','Most Heart Points in the final round',''],
  ['var','Most different moves used',''],
  ['stat','Highest {t} contest stat','ct'],
  ['intro','Best introduction (you choose)',''],
  ['gm','Something else (you choose)','']
];
const CS_MANUAL=new Set(['intro','gm']);
const CS_JUDGED=new Set(['hp','ct','ty','one','cnt','el','up','fin']);   /* Option B: only appeals made to this judge */
const csGoal=k=>CS_GOALS.find(g=>g[0]===k)||CS_GOALS[0];
const csGoalTxt=g=>{const d=csGoal(g&&g.k);return g&&g.k==='gm'&&g.x?String(g.x):d[1].replace('{t}',(g&&g.t)||(d[2]==='ty'?'Normal':'Beauty'));};
const CSC=()=>S.contest||{};
const CSG=()=>S.contestGm||{};
const csOn=()=>!!CSC().on;
const csRnd=a=>a[Math.floor(Math.random()*a.length)];
const csEnts=()=>{const C=CSC();return (C.eord||[]).filter(e=>C.ents&&C.ents[e]);};
/* the contest type a judge rewards this round */
function csCType(C,j){
  const J=(C.judges||[])[j]||{};
  if(C.var&&C.var.fest&&J.fav)return J.fav;
  if(C.var&&C.var.sup&&C.rt)return C.rt;
  return C.type||'';
}
/* ----- an entrant's Pokémon and their contest moves ----- */
function csMonMoves(E,i){
  const mo=(E.mons||[])[i];
  if(!mo)return [];
  let list=[];
  if(E.k==='pc'){
    const m=getLocal('p',E.u+'/'+mo.pid);
    list=((m&&m.moves)||[]).filter(x=>x&&String(x.name||'').trim()).map(x=>({n:String(x.name).trim(),bt:x.type||'',ct:CT_TYPES.indexOf(x.ct)>=0?x.ct:''}));
  }else list=(mo.mv||[]).map(x=>({n:x.n,bt:x.t||'',ct:''}));
  return list.map(x=>{const c=ctOfRow({name:x.n,ct:x.ct});return c?Object.assign(x,{t:c.t,k:c.k}):null;}).filter(Boolean);
}
const csMonName=(E,i)=>{const mo=(E.mons||[])[i];if(!mo)return '';if(E.k==='pc'){const m=getLocal('p',E.u+'/'+mo.pid);return m?mName(Object.assign({id:mo.pid},m)):(mo.name||'Pokémon');}return mo.name||mo.sp||'Pokémon';};
function csStatLeft(E,type){
  if(E.k!=='pc'||!type)return 0;
  let best=0;
  (E.mons||[]).forEach(mo=>{const m=getLocal('p',E.u+'/'+mo.pid);if(m)best=Math.max(best,num(ctStatsOf(m)[type]));});
  return Math.max(0,best-num((E.spent||{})[type]));
}
/* ----- one appeal: the sums, shared by the form's preview and the GM's scoring ----- */
function csWork(C,eid,ap){
  const E=(C.ents||{})[eid];
  if(!E)return {err:'That contestant is not in the contest.'};
  const j=clamp(Math.round(num(ap.j)),0,2),J=(C.judges||[])[j];
  if(!J)return {err:'Choose a judge.'};
  const dbl=!!(C.var&&C.var.dbl)&&(E.mons||[]).length>1;
  const m0=csMonMoves(E,0).find(x=>x.n===ap.m0),m1=dbl?csMonMoves(E,1).find(x=>x.n===ap.m1):null;
  if(!m0||(dbl&&!m1))return {err:dbl?'Choose a move for each Pokémon.':'Choose a move.'};
  const tf=dbl&&num(ap.tf)===1?1:0;
  const mA=tf?m1:m0,mK=dbl?(tf?m0:m1):m0;
  const ctype=csCType(C,j);
  const type=mA.t==='Any'?(CT_TYPES.indexOf(ap.any)>=0?ap.any:(ctype||'Cool')):mA.t;
  const kw=mK.k;
  const R=num(C.round),logR=(C.log||[]).filter(x=>num(x.r)===R),ents=csEnts();
  const before=logR.length;
  const tot=e=>num((C.ents[e]||{}).hp);
  const low=tot(eid)<=Math.min(...ents.map(tot));
  const last2=logR.slice(-2);
  const both=last2.length===2&&last2.every(x=>num(x.v1)>num(x.v0));
  const maxed=logR.some(x=>x.rs);
  const alone=!logR.some(x=>num(x.j)===j&&x.e!==eid);
  const allBig=before>0&&logR.every(x=>num(x.dice)>=3);
  const lastHp=(before?clamp(num(logR[before-1].dice),1,3):2)+'d4';
  const used=[m0.n].concat(m1?[m1.n]:[]),prev=E.lastMv||[];
  const same=used.some(n=>prev.indexOf(n)>=0);
  const hv=!!(C.var&&C.var.hv);
  const stLeft=csStatLeft(E,type),stat=clamp(Math.round(num(ap.st)),0,stLeft);
  const c=ctCalc({kw,type,ctype,volt:num(J.v),elec:hv?false:!!J.el,first:before===0,last:before===ents.length-1,fin:R===5,low,both,maxed,before,alone,allBig,lastHp,
    ready:!!(C.ready||{})[eid],same,stat,noRaise:!!J.hold,noLower:!!J.exc});
  /* the judge's Voltage afterwards, with the keyword's effects and the round's locks */
  const rel=c.rel;
  let dv=kw==='Crowd Pleaser'?2:rel==='m'?1:rel==='x'?-1:0;
  if(J.hold&&dv>0)dv=0;
  if(J.exc&&dv<0)dv=0;
  const v0=num(J.v);
  const step=(v,d,Jx)=>{if(Jx.hold&&d>0)return v;if(Jx.exc&&d<0)return v;return clamp(v+d,0,5);};
  let v1=clamp(v0+dv,0,5);
  if(kw==='Incredible')v1=step(v1,1,J);
  if(kw==='Unsettling')v1=step(v1,-1,J);
  const parts=c.parts.map(p=>({n:p.n,why:p.why}));
  const reach=v0<5&&v1>=5;
  if(reach&&!c.reach&&!c.zero)parts.push({n:c.ready?6:3,why:'the judge reaches 5 Voltage'});
  if(hv&&!c.zero){
    if(v1>v0)parts.push({n:v1,why:'High Voltage: the judge rose to '+v1});
    if(J.el)parts.push({n:5,why:'High Voltage: the judge is Electrified'});
  }
  const dice=parts.reduce((a,p)=>a+p.n,0);
  return {E,J,j,dbl,m0,m1,mA,mK,type,kw,ctype,c,parts,dice,stat,stLeft,v0,v1,reach,zero:c.zero,x2:!hv&&c.x2,used,hv};
}
const csPartsTxt=w=>w.parts.length?w.parts.map(p=>p.n+'d4 '+p.why).join(' + '):'no dice';
/* the GM scores an appeal: rolls (or takes the typed total), and writes the result for everyone */
function csApply(eid,ap,by){
  if(!S.me.admin)return false;
  const C=CSC();
  if(!C.on||C.stage!=='appeal'){toast('The appeals have not started.');return false;}
  if((C.log||[]).some(x=>num(x.r)===num(C.round)&&x.e===eid)){toast('That contestant has already appealed this round.');return false;}
  const w=csWork(C,eid,ap);
  if(w.err){toast(w.err);return false;}
  S.csUndo.push(JSON.parse(JSON.stringify(C)));
  if(S.csUndo.length>12)S.csUndo.shift();
  const t=rdNum(ap.sum,0,999);
  const typed=t!=null&&w.dice>0;
  const rolled=[];
  if(!typed)for(let i=0;i<w.dice;i++)rolled.push(rnd(4));
  const sum=typed?clamp(t,w.dice,w.dice*4):rolled.reduce((a,b)=>a+b,0);
  const sub=sum+w.stat,total=w.zero?0:(w.x2?sub*2:sub);
  const judges=(C.judges||[]).map((J,k)=>{
    const o=Object.assign({},J);
    if(k===w.j)o.v=w.v1;
    else if(w.kw==='Incredible'&&!o.hold)o.v=clamp(num(o.v)+1,0,5);
    else if(w.kw==='Unsettling'&&!o.exc)o.v=clamp(num(o.v)-1,0,5);
    if(num(o.v)>=5)o.el=true;
    if(k===w.j&&w.kw==='Excitement')o.exc=true;
    if(k===w.j&&w.kw==='Hold That Thought')o.hold=true;
    return o;
  });
  const E=Object.assign({},w.E,{hp:num(w.E.hp)+total,lastMv:w.used});
  if(w.stat){E.spent=Object.assign({},E.spent||{});E.spent[w.type]=num(E.spent[w.type])+w.stat;}
  const ready=Object.assign({},C.ready||{});
  if(w.kw==='Get Ready!')ready[eid]=1;else delete ready[eid];
  const bts=[w.m0.bt].concat(w.m1?[w.m1.bt]:[]).filter(Boolean);
  const entry={r:num(C.round),e:eid,n:E.name,mon:[csMonName(E,0)].concat(w.dbl?[csMonName(E,1)]:[]).join(' & '),mv:w.used.join(' + '),t:w.type,bt:bts,kw:w.kw,j:w.j,
    dice:w.dice,rolled,sum,stat:w.stat,x2:w.x2?1:0,tot:total,v0:w.v0,v1:w.v1,rs:w.reach?1:0,zero:w.zero?1:0,rd:typed?1:0,by:by||'gm',at:Date.now()};
  const done=(C.done||[]).concat([eid]);
  const next=(C.order||[]).find(x=>done.indexOf(x)<0)||'';
  edit('cs','contest','judges',judges);
  edit('cs','contest','ents',Object.assign({},C.ents,{[eid]:E}));
  edit('cs','contest','ready',ready);
  if(w.kw==='Scrambler')edit('cs','contest','scr',1);
  edit('cs','contest','log',(C.log||[]).concat([entry]).slice(-80));
  edit('cs','contest','done',done);
  edit('cs','contest','cur',next);
  return true;
}
/* a player's appeal, sent from their screen, is scored on the GM's page while it is open */
let csPollKey='';
function csPoll(){
  if(!S.me.admin)return;
  const C=CSC();
  if(!C.on||C.stage!=='appeal'||!C.cur)return;
  const E=(C.ents||{})[C.cur];
  if(!E||E.k!=='pc')return;
  if(!CT.list){ctWarm();return;}   /* the contest move list is needed to score it */
  const t=S.trainers[E.u],ap=t&&t.ctap;
  if(!ap||ap.id!==C.id||num(ap.r)!==num(C.round)||ap.e!==C.cur)return;
  if((C.log||[]).some(x=>num(x.r)===num(C.round)&&x.e===C.cur))return;
  const key=C.id+'|'+C.round+'|'+C.cur+'|'+num(ap.at);
  if(csPollKey===key)return;
  csPollKey=key;
  setTimeout(()=>{if(csApply(ap.e,ap,'pc'))render();},0);
}
/* ----- rounds ----- */
function csOrderFor(C,round){
  const ents=csEnts();
  if(round<=1)return ents.slice();
  if(C.scr){const a=ents.slice();for(let i=a.length-1;i>0;i--){const k=Math.floor(Math.random()*(i+1));[a[i],a[k]]=[a[k],a[i]];}return a;}
  const spd=e=>{const E=C.ents[e];if(E.k!=='pc')return num(E.spd);const mo=(E.mons||[])[0],m=mo&&getLocal('p',E.u+'/'+mo.pid);return m?spdOf(Object.assign({id:mo.pid},m)):0;};
  return ents.slice().sort((a,z)=>num(C.ents[z].hp)-num(C.ents[a].hp)||spd(z)-spd(a));
}
function csFestTypes(){const a=CT_TYPES.slice();for(let i=a.length-1;i>0;i--){const k=Math.floor(Math.random()*(i+1));[a[i],a[k]]=[a[k],a[i]];}return a;}
function csStartRound(r){
  const C=CSC();
  const fest=C.var&&C.var.fest?csFestTypes():null;
  const judges=(C.judges||[]).map((J,k)=>Object.assign({},J,{hold:false,exc:false},fest?{fav:fest[k]}:{}));
  edit('cs','contest','judges',judges);
  if(C.var&&C.var.sup)edit('cs','contest','rt',csRnd(CT_TYPES));
  const ord=csOrderFor(C,r);
  edit('cs','contest','round',r);
  edit('cs','contest','order',ord);
  edit('cs','contest','done',[]);
  edit('cs','contest','cur',ord[0]||'');
  edit('cs','contest','scr',0);
}
/* ----- awards ----- */
function csScores(C,G){
  const log=C.log||[],ents=csEnts(),out=[];
  const goals=(G.goals||[]);
  (C.judges||[]).forEach((J,j)=>{
    const gl=(goals[j]||[]).slice(0,3);
    out.push({n:J.n,goals:gl.map((g,gi)=>{
      const sc={};ents.forEach(e=>{sc[e]=0;});
      const mine=e=>log.filter(x=>x.e===e&&(!CS_JUDGED.has(g.k)||num(x.j)===j));
      ents.forEach(e=>{
        const L=mine(e);
        switch(g.k){
          case 'hp':sc[e]=L.reduce((a,x)=>a+num(x.tot),0);break;
          case 'ct':sc[e]=L.filter(x=>x.t===g.t).reduce((a,x)=>a+num(x.tot),0);break;
          case 'ty':sc[e]=L.filter(x=>(x.bt||[]).indexOf(g.t)>=0).reduce((a,x)=>a+num(x.tot),0);break;
          case 'one':sc[e]=L.reduce((a,x)=>Math.max(a,num(x.tot)),0);break;
          case 'cnt':sc[e]=L.length;break;
          case 'up':sc[e]=L.filter(x=>num(x.v1)>num(x.v0)).length;break;
          case 'fin':sc[e]=L.filter(x=>num(x.r)===5).reduce((a,x)=>a+num(x.tot),0);break;
          case 'var':sc[e]=new Set(L.map(x=>x.mv)).size;break;
          case 'stat':{const E=C.ents[e];sc[e]=E.k==='pc'?Math.max(0,...(E.mons||[]).map(mo=>{const m=getLocal('p',E.u+'/'+mo.pid);return m?num(ctStatsOf(m)[g.t]):0;})):0;break;}
          default:break;
        }
      });
      if(g.k==='el'){const f=log.find(x=>x.rs&&num(x.j)===j);if(f)sc[f.e]=1;}
      const ov=(G.ov||{})[j+'-'+gi];
      let win=[];
      if(ov==='none')win=[];
      else if(ov&&sc[ov]!=null)win=[ov];
      else if(!CS_MANUAL.has(g.k)){const mx=Math.max(0,...ents.map(e=>sc[e]));if(mx>0)win=ents.filter(e=>sc[e]===mx);}
      return {g,gi,txt:csGoalTxt(g),sc,win,manual:CS_MANUAL.has(g.k)};
    })});
  });
  const stars={};ents.forEach(e=>{stars[e]=0;});
  out.forEach(J=>J.goals.forEach(x=>x.win.forEach(e=>{stars[e]++;})));
  const rank=ents.slice().sort((a,z)=>stars[z]-stars[a]||num(C.ents[z].hp)-num(C.ents[a].hp));
  return {J:out,stars,rank};
}
function csPlaces(C,aw){
  const r=aw.rank||[],st=aw.stars||{};
  if(!r.length)return {first:[],second:[]};
  const top=num(st[r[0]]);
  const first=top>0?r.filter(e=>num(st[e])===top):[];
  const rest=r.filter(e=>first.indexOf(e)<0),s2=rest.length?num(st[rest[0]]):0;
  const second=s2>0?rest.filter(e=>num(st[e])===s2):[];
  return {first,second};
}
function csReveal(){
  if(!S.me.admin)return;
  const C=CSC(),A=csScores(C,CSG());
  edit('cs','contest','aw',{J:A.J.map(J=>({n:J.n,goals:J.goals.map(x=>({txt:x.txt,win:x.win}))})),stars:A.stars,rank:A.rank});
  edit('cs','contest','stage','awards');
  edit('cs','contest','cur','');
  render();
}
/* the winner's ribbon in their case and an honor; the contest circuit rankings for the top places */
function csRecord(){
  if(!S.me.admin)return;
  const C=CSC(),aw=C.aw;
  if(!aw||C.rec){toast(C.rec?'Already recorded.':'Reveal the awards first.');return;}
  const P=csPlaces(C,aw),rib=ribHalls().find(x=>x.k===C.hall),now=Date.now(),msgs=[];
  P.first.forEach(e=>{
    const E=C.ents[e];
    if(E.k!=='pc'||!S.trainers[E.u])return;
    if(rib){
      const id=S.db.collection('awards').doc().id;
      newDoc('aw',id,{uid:E.u,type:'Contest Ribbon',title:rib.n+' Ribbon',note:C.name||'',badge:'',ribbon:rib.k,levelUp:false,session:num(S.meta.session)||1,by:S.me.id,createdAt:now});
      edit('t',E.u,'ribbons.'+rib.k,true);
      msgs.push(E.name+' takes the '+rib.n+' Ribbon');
    }
  });
  rkWith('con',()=>{
    const rows=rkRows(),W=num(rkB().wk);
    const idOf=E=>{if(E.k==='pc')return rows.some(r=>r.id===E.u)?E.u:'';const r=rows.find(x=>x.npc&&x.npc.nt&&x.npc.nt===E.nt);return r?r.id:'';};
    const ev=k=>RK_CEVENTS.find(x=>x[0]===k);
    const add=[];
    [['ribbon',P.first],['second',P.second]].forEach(([k,list])=>list.forEach(e=>{const id=idOf(C.ents[e]);if(id)add.push({k:rkKey(),u:id,p:ev(k)[2],w:ev(k)[1]+' · '+(C.name||'a contest'),wk:W,d:clToday()||'',at:now,e:k});}));
    if(add.length){rkSave({log:rkLog().concat(add)});msgs.push(add.length+' rankings '+(add.length===1?'entry':'entries'));}
  });
  edit('cs','contest','rec',1);
  edit('cs','contest','stage','done');
  toast(msgs.length?msgs.join('; ')+'.':'Recorded (no player won a ribbon).',true);
  render();
}
/* ----- setting up (GM) ----- */
function csDraft(){
  if(S.ui.cs)return S.ui.cs;
  const halls=ribHalls();
  S.ui.cs={hall:halls[0]?halls[0].k:'',type:'Beauty',var:{dbl:false,sup:false,fest:false,hv:false},
    judges:CS_JUDGES.map(n=>({n,goals:[]})),pcs:{},npcs:[],nn:'',nsp:'',nnt:''};
  S.ui.cs.judges.forEach((J,j)=>csRollGoals(J,'Beauty',j===0));
  return S.ui.cs;
}
/* the announced type decides one Star Point, so only the first judge's first goal is fixed to it */
function csRollGoals(J,type,first){
  const pool=CS_GOALS.filter(g=>!CS_MANUAL.has(g[0])&&(!first||g[0]!=='ct'));
  const out=first?[{k:'ct',t:type||csRnd(CT_TYPES)}]:[];
  while(out.length<3){const g=csRnd(pool);if(out.some(x=>x.k===g[0]))continue;out.push({k:g[0],t:g[2]==='ct'?csRnd(CT_TYPES):g[2]==='ty'?csRnd(TYPES):''});}
  J.goals=out;
}
async function csNpcMons(D){
  /* an NPC coordinator: from an NPC sheet (its first one or two Pokémon), or a name and species (natural moves) */
  const dbl=!!D.var.dbl,out=[];
  if(D.nnt&&NTS()[D.nnt]){
    const nt=NTS()[D.nnt];
    ntTeam(nt).slice(0,dbl?2:1).forEach(m=>out.push({sp:m.sp,name:m.nick||m.sp,mv:(m.mv||[]).map(x=>({n:x.name,t:x.type||''})).filter(x=>x.n)}));
    return {name:ntName(nt),nt:D.nnt,mons:out,spd:num(((ntTeam(nt)[0]||{}).base||{}).spe)};
  }
  const sps=String(D.nsp||'').split(/[,+&]/).map(x=>x.trim()).filter(Boolean).slice(0,dbl?2:1);
  for(const sp of sps){
    const pr=ptaResolve(sp);
    let rec=null;
    if(pr)rec=ptaRec(pr)||await ptaChunk(ptaLetter(ptaKey(pr))).then(()=>ptaRec(pr));
    const base=foeFromRec(rec,rec?null:speciesInfo(sp),sp);
    out.push({sp:base.sp||sp,name:base.sp||sp,mv:(base.mv||[]).map(x=>({n:x.name,t:x.type||''})).filter(x=>x.n)});
  }
  return {name:String(D.nn||'').trim()||'Coordinator',nt:'',mons:out,spd:0};
}
function csOpen(){
  if(!S.me.admin)return;
  const D=csDraft(),dbl=!!D.var.dbl;
  const ents={},eord=[];
  tids().forEach(uid=>{
    const p=D.pcs[uid];
    if(!p||!p.on)return;
    const mons=[p.m1,dbl?p.m2:''].filter(Boolean).map(pid=>({pid,name:''}));
    if(!mons.length||(dbl&&mons.length<2))return;
    const e='p_'+uid;ents[e]={k:'pc',u:uid,name:tName(S.trainers[uid]),mons,hp:0,spent:{},lastMv:[]};eord.push(e);
  });
  D.npcs.forEach((n,i)=>{const e='n_'+i+'_'+Date.now().toString(36);ents[e]=Object.assign({k:'npc',hp:0,spent:{},lastMv:[]},n);eord.push(e);});
  if(eord.length<2){toast('A contest needs at least two contestants'+(dbl?' with two Pokémon each':'')+'.');return;}
  const hall=ribHalls().find(x=>x.k===D.hall);
  const hv=!!D.var.hv;
  const C={v:1,on:true,id:'c'+Date.now().toString(36),hall:D.hall,name:hall?hall.n+' Contest':'Contest',type:D.var.sup?'':D.type,var:Object.assign({},D.var),
    stage:'intro',round:0,rt:'',judges:D.judges.map(J=>({n:String(J.n||'Judge').trim()||'Judge',fav:D.type,v:hv?1:0,el:false,hold:false,exc:false})),
    ents,eord,order:[],done:[],cur:'',log:[],ready:{},scr:0,gl:{},aw:null,rec:0,at:Date.now()};
  Object.keys(C).forEach(k=>edit('cs','contest',k,C[k]));
  edit('cg','contest','goals',D.judges.map(J=>J.goals.map(g=>({k:g.k,t:g.t||'',x:g.x||''}))));
  edit('cg','contest','ov',{});
  S.csUndo=[];S.ui.cs=null;
  toast('The contest is open. Introductions first: reveal any goals the players’ Insight checks earn, then start the appeals.',true);
  render();
}
function csClose(){
  if(!S.me.admin)return;
  edit('cs','contest','on',false);
  S.ui.csa={};S.csUndo=[];
  render();
}
/* ----- the page ----- */
const csVolt=(v,el)=>h`<span class="volt" aria-label="Voltage ${v} of 5">${[1,2,3,4,5].map(i=>h`<i class="${i<=v?'on':''}"></i>`)}</span> <span class="mono">${v}/5</span>`;
function csJudgesHtml(C,gm){
  const G=CSG().goals||[];
  return h`<div class="judges">${(C.judges||[]).map((J,j)=>{
    const ct=csCType(C,j);
    return h`<div class="judge ${J.el?'elec':''}"><div class="row sp"><b>${J.n}</b>${J.el?h`<span class="pill good">Electrified${C.var&&C.var.hv?' +5d4':' ×2'}</span>`:''}</div>
      <div class="row"><span class="sub">Favours</span> ${ct?ctChip(ct):h`<span class="sub">—</span>`}${J.hold?h`<span class="pill">Voltage held</span>`:''}${J.exc?h`<span class="pill">Can’t go down</span>`:''}</div>
      <div class="row"><span class="sub">Voltage</span> ${csVolt(num(J.v))}</div>
      <div class="goals">${[0,1,2].map(gi=>{const rv=(C.gl||{})[j+'-'+gi];const g=(G[j]||[])[gi];
        if(gm&&g)return h`<span>★ ${csGoalTxt(g)}${rv?h` <span class="pill good">revealed</span>`:C.stage==='intro'||C.stage==='appeal'?h` <button class="btn sm ghost" data-act="cs_rev" data-j="${j}" data-g="${gi}">Reveal</button>`:''}</span>`;
        return rv?h`<span>★ ${rv.t}${rv.by?h` <span class="sub">· ${rv.by}’s Insight</span>`:''}</span>`:h`<span class="sub">★ Hidden goal</span>`;})}</div></div>`;
  })}</div>`;
}
function csBoardHtml(C,gm){
  const ents=csEnts(),mx=Math.max(1,...ents.map(e=>num(C.ents[e].hp)));
  const sorted=ents.slice().sort((a,z)=>num(C.ents[z].hp)-num(C.ents[a].hp));
  return h`<ol class="score">${sorted.map((e,i)=>{const E=C.ents[e],now=C.cur===e,done=(C.done||[]).indexOf(e)>=0;
    return h`<li class="${now?'now':''}"><span class="bn">${i+1}</span><div><b>${E.name}</b> <span class="sub">${[0,1].map(k=>csMonName(E,k)).filter(Boolean).join(' & ')}</span>${now?h` <span class="pill good">Appealing</span>`:done&&C.stage==='appeal'?h` <span class="pill">Done</span>`:''}
      ${gm&&C.stage==='appeal'&&!now&&!done?h` <button class="btn sm ghost" data-act="cs_now" data-e="${e}">Goes now</button>`:''}
      ${gm&&C.stage==='intro'?h` <button class="btn sm ghost" data-act="cs_bonus" data-e="${e}" title="Add 1d4 Heart Points for the introduction">+1d4 intro</button>`:''}
      <span class="heartbar" style="${raw('width:'+Math.round(num(E.hp)/mx*100)+'%')}"></span></div><span class="hearts">♥ ${num(E.hp)}</span></li>`;})}</ol>`;
}
function csLogHtml(C,all){
  const R=num(C.round),rows=(C.log||[]).filter(x=>all||num(x.r)===R);
  if(!rows.length)return h`<p class="sub">No appeals yet${all?'':' this round'}.</p>`;
  return h`<ul class="applog">${rows.slice().reverse().map(x=>h`<li><b>${x.n}</b> · ${x.mon} · ${x.mv} (${x.t}, ${x.kw}) → ${((C.judges||[])[num(x.j)]||{}).n||'a judge'}: ${x.zero?'repeated move, no Heart Points':(num(x.dice)?x.dice+'d4 '+(x.rd?'typed '+x.sum:'['+(x.rolled||[]).join(', ')+']'):'no dice')+(num(x.stat)?' + '+x.stat+' stat':'')+(x.x2?' × 2':'')+' = '+x.tot+' ♥'}${num(x.cb)?' (+'+x.cb+' creativity)':''} · Voltage ${x.v0} → ${x.v1}${x.rs?' · Electrified!':''}${x.rd?h` <span class="pill rdp">real dice</span>`:''}</li>`)}</ul>`;
}
/* the appeal form: for the GM (any contestant) or a player (their own, on their turn) */
function csFormHtml(C,eid,gm){
  const E=C.ents[eid];
  if(!E)return '';
  const f=S.ui.csa;
  if(f.e!==eid){S.ui.csa={e:eid,j:'0',m0:'',m1:'',tf:'0',any:'',st:'',real:false,sum:''};}
  const a=S.ui.csa,dbl=!!(C.var&&C.var.dbl)&&(E.mons||[]).length>1;
  const L0=csMonMoves(E,0),L1=dbl?csMonMoves(E,1):[];
  if(!a.m0&&L0[0])a.m0=L0[0].n;
  if(dbl&&!a.m1&&L1[0])a.m1=L1[0].n;
  const w=csWork(C,eid,a);
  const sent=!gm&&E.k==='pc'&&S.trainers[E.u]&&S.trainers[E.u].ctap&&S.trainers[E.u].ctap.id===C.id&&num(S.trainers[E.u].ctap.r)===num(C.round);
  const mvSel=(k,L,lbl)=>h`<label class="fld"><span class="fl">${lbl}</span><select data-u="csa.${k}">${L.map(x=>h`<option value="${x.n}" ${a[k]===x.n?raw('selected'):''}>${x.n} · ${x.t} · ${x.k}</option>`)}</select></label>`;
  return h`<div class="appeal">
    ${!L0.length?h`<p class="sub bdbwarn">${csMonName(E,0)} knows no contest moves yet${E.k==='pc'?' (moves need the handbook’s contest list, or a contest type set on a tutored move)':''}.</p>`:''}
    <div class="mrgrid">
      ${mvSel('m0',L0,dbl?csMonName(E,0)+'’s move':'Move ('+csMonName(E,0)+')')}
      ${dbl?mvSel('m1',L1,csMonName(E,1)+'’s move'):''}
      <label class="fld"><span class="fl">Judge</span><select data-u="csa.j">${(C.judges||[]).map((J,j)=>h`<option value="${j}" ${String(a.j)===String(j)?raw('selected'):''}>${J.n}</option>`)}</select></label>
      ${dbl?h`<label class="fld"><span class="fl">Contest type from</span><select data-u="csa.tf"><option value="0" ${a.tf!=='1'?raw('selected'):''}>${csMonName(E,0)}’s move</option><option value="1" ${a.tf==='1'?raw('selected'):''}>${csMonName(E,1)}’s move</option></select></label>`:''}
      ${w.mA&&w.mA.t==='Any'?h`<label class="fld"><span class="fl">Contest type (Any)</span><select data-u="csa.any">${CT_TYPES.map(t=>h`<option ${w.type===t?raw('selected'):''}>${t}</option>`)}</select></label>`:''}
      ${w.stLeft?h`<label class="fld"><span class="fl">Spend ${w.type} stat (${w.stLeft} left)</span><input type="number" inputmode="numeric" min="0" max="${w.stLeft}" data-u="csa.st" value="${a.st||''}" placeholder="0"></label>`:''}
    </div>
    ${w.err?h`<p class="sub">${w.err}</p>`:h`<div class="row">${ctChip(w.type)} <span class="pill">${w.kw}</span> <span class="sub">${{m:'matches',c:'gets along with',x:'clashes with',n:'is neutral to'}[w.c.rel]} the judge’s ${w.ctype||'type'}</span></div>
      <p class="dhint">${w.zero?'A repeated move earns no Heart Points (its effects still happen).':'Roll '+w.dice+'d4: '+csPartsTxt(w)+'.'}${w.x2?' The judge is Electrified, so the total doubles.':''}${w.stat?' Plus '+w.stat+' from the '+w.type+' stat.':''} Voltage ${w.v0} → ${w.v1}${w.reach?': Electrified!':''}.</p>
      ${w.c.notes.length&&!w.zero?h`<p class="sub">${w.c.notes.join(' ')}</p>`:''}`}
    <div class="dicesw"><span class="fl">Dice</span><div class="seg" role="group" aria-label="Who rolls"><button data-act="cs_real" data-v="0" aria-pressed="${String(!a.real)}">The site rolls</button><button data-act="cs_real" data-v="1" aria-pressed="${String(!!a.real)}">I rolled real dice</button></div>
      ${a.real&&!w.err&&w.dice?h`<label class="fld csum"><span class="fl">Total of your ${w.dice}d4</span><input type="number" inputmode="numeric" min="${w.dice}" max="${w.dice*4}" data-u="csa.sum" data-nr value="${a.sum||''}"></label>`:''}</div>
    <div class="row"><button class="btn primary sm" data-act="cs_go" data-e="${eid}" ${w.err||sent?raw('disabled'):''}>${sent?'Sent: waiting for the GM’s screen':'Make the appeal'}</button>${gm&&E.k==='pc'?h`<span class="sub">${E.name} can send this from their own screen too.</span>`:''}</div>
  </div>`;
}
function csSetupHtml(){
  const D=csDraft(),halls=ribHalls(),ids=tids(),nts=ntIds().filter(id=>ntTeam(NTS()[id]).length);
  const dbl=!!D.var.dbl;
  const tog=(k,l,x)=>h`<label class="chip chkc"><input type="checkbox" data-act="cs_var" data-k="${k}" ${D.var[k]?raw('checked'):''}><span>${l}</span>${x?h` <span class="sub">${x}</span>`:''}</label>`;
  return h`<div class="ctstage">
    <div class="fgrid">
      <label class="fld"><span class="fl">Contest hall</span><select data-u="cs.hall">${halls.map(x=>h`<option value="${x.k}" ${D.hall===x.k?raw('selected'):''}>${x.n}</option>`)}</select></label>
      <label class="fld"><span class="fl">Contest type</span><select data-u="cs.type" ${D.var.sup?raw('disabled'):''}>${CT_TYPES.map(t=>h`<option ${D.type===t?raw('selected'):''}>${t}</option>`)}</select></label>
    </div>
    <div class="row evchips">${tog('dbl','Double Performance','two Pokémon each')}${tog('sup','Super Contest','a random type each round')}${tog('fest','Festival','each judge a type each round')}${tog('hv','High Voltage','judges start at 1')}</div>
    <h3 class="refg">Judges and their hidden goals <span class="pill gm">GM only</span></h3>
    <div class="judges">${D.judges.map((J,j)=>h`<div class="judge"><label class="fld"><span class="fl">Judge ${j+1}</span><input type="text" data-csx="jn" data-j="${j}" value="${J.n}"></label>
      ${J.goals.map((g,gi)=>{const d=csGoal(g.k);return h`<div class="cgoal"><select data-csx="gk" data-j="${j}" data-g="${gi}" aria-label="Goal ${gi+1}">${CS_GOALS.map(x=>h`<option value="${x[0]}" ${g.k===x[0]?raw('selected'):''}>${x[1].replace('{t}','…')}</option>`)}</select>
        ${d[2]?h`<select data-csx="gt" data-j="${j}" data-g="${gi}" aria-label="Type">${(d[2]==='ty'?TYPES:CT_TYPES).map(t=>h`<option ${g.t===t?raw('selected'):''}>${t}</option>`)}</select>`:''}
        ${g.k==='gm'?h`<input type="text" data-csx="gx" data-j="${j}" data-g="${gi}" value="${g.x||''}" placeholder="What earns it">`:''}</div>`;})}
      <button class="btn sm" data-act="cs_roll" data-j="${j}">Roll goals</button></div>`)}</div>
    <p class="sub">The announced contest type decides one Star Point, so Roll goals gives the first judge that goal and the others something else. Players never receive these until you reveal one (an Insight check) or the awards.</p>
    <h3 class="refg">Contestants</h3>
    <div class="bench">${ids.map(uid=>{const p=D.pcs[uid]||{},pt=monsOf(uid);
      return h`<div class="brl"><label class="chip chkc"><input type="checkbox" data-act="cs_pc" data-uid="${uid}" ${p.on?raw('checked'):''}><span>${tName(S.trainers[uid])}</span></label>
        ${p.on?h`<select data-csx="pm" data-uid="${uid}" data-k="m1" aria-label="Pokémon">${[h`<option value="">Pokémon…</option>`].concat(pt.map(m=>h`<option value="${m.id}" ${p.m1===m.id?raw('selected'):''}>${mName(m)}</option>`))}</select>
        ${dbl?h`<select data-csx="pm" data-uid="${uid}" data-k="m2" aria-label="Second Pokémon">${[h`<option value="">Second Pokémon…</option>`].concat(pt.map(m=>h`<option value="${m.id}" ${p.m2===m.id?raw('selected'):''}>${mName(m)}</option>`))}</select>`:''}`:''}</div>`;})}
      ${D.npcs.map((n,i)=>h`<div class="brl"><b>${n.name}</b><span class="sub">${n.mons.map(m=>m.name+' ('+m.mv.length+' moves)').join(' & ')}</span><button class="btn sm ghost" data-act="cs_npcdel" data-i="${i}">Remove</button></div>`)}
    </div>
    <div class="mgd"><b>Add an NPC coordinator</b><div class="fgrid">
      <label class="fld"><span class="fl">From an NPC sheet</span><select data-u="cs.nnt"><option value="">None (type a name)</option>${nts.map(id=>h`<option value="${id}" ${D.nnt===id?raw('selected'):''}>${ntName(NTS()[id])}</option>`)}</select></label>
      ${D.nnt?'':h`<label class="fld"><span class="fl">Name</span><input type="text" data-u="cs.nn" data-nr value="${D.nn}"></label><label class="fld"><span class="fl">Species${dbl?' (two, with a comma)':''}</span><input type="text" list="dl-species" data-u="cs.nsp" data-nr value="${D.nsp}"></label>`}</div>
      <button class="btn sm" data-act="cs_npcadd">Add coordinator</button><span class="sub">An NPC sheet brings its first ${dbl?'two Pokémon':'Pokémon'} and their moves; a species brings its natural moves.</span></div>
    <div class="row"><button class="btn primary sm" data-act="cs_open">Open the contest</button><button class="btn sm ghost" data-act="cs_cancel">Cancel</button></div>
  </div>`;
}
function csAwardsHtml(C,gm){
  const A=gm?csScores(C,CSG()):null,aw=C.aw;
  const ents=csEnts();
  if(gm&&C.stage==='appeal'){
    return h`<div class="csaward">${A.J.map((J,j)=>h`<div class="judge"><b>${J.n}</b><div class="goals">${J.goals.map(x=>h`<span>★ ${x.txt} → ${x.manual?'':h`<b>${x.win.map(e=>C.ents[e].name).join(', ')||'nobody'}</b>`}
      <select data-csx="ov" data-j="${j}" data-g="${x.gi}" aria-label="Who earns it"><option value="">${x.manual?'Choose…':'As counted'}</option><option value="none" ${(CSG().ov||{})[j+'-'+x.gi]==='none'?raw('selected'):''}>Nobody</option>${ents.map(e=>h`<option value="${e}" ${(CSG().ov||{})[j+'-'+x.gi]===e?raw('selected'):''}>${C.ents[e].name}</option>`)}</select></span>`)}</div></div>`)}</div>
      <p class="sub">The goals count only appeals made to that judge (Option B), except moves used, contest stats and the ones you judge. Pick a name to overrule the count.</p>`;
  }
  if(!aw)return '';
  return h`<div class="csaward">${(aw.J||[]).map(J=>h`<div class="judge"><b>${J.n}</b><div class="goals">${(J.goals||[]).map(x=>h`<span>★ ${x.txt} → <b>${(x.win||[]).map(e=>(C.ents[e]||{}).name).join(', ')||'nobody'}</b></span>`)}</div></div>`)}</div>`;
}
/* the final standings: Star Points, then Heart Points */
function csRankHtml(C){
  const aw=C.aw;
  if(!aw)return '';
  const P=csPlaces(C,aw);
  return h`<ol class="score">${(aw.rank||[]).map((e,i)=>{const E=C.ents[e]||{};return h`<li class="${P.first.indexOf(e)>=0?'now':''}"><span class="bn">${i+1}</span><div><b>${E.name}</b> <span class="sub">${num(E.hp)} ♥</span>${P.first.indexOf(e)>=0?h` <span class="pill good">Winner</span>`:P.second.indexOf(e)>=0?h` <span class="pill">Runner-up</span>`:''}</div><span class="hearts"><span class="star">${'★'.repeat(num((aw.stars||{})[e]))}</span> ${num((aw.stars||{})[e])}</span></li>`;})}</ol>`;
}
function csLiveView(){
  const C=CSC(),gm=!!S.me.admin;
  if(!C.on){
    if(gm&&S.ui.cs)return csSetupHtml();
    return h`<div class="ctstage"><p class="sub">${gm?'No contest is running. Set one up to run it here live: the players follow along on their own screens and make their appeals when it is their turn.':'No contest is running. When the GM starts one, it appears here.'}</p>
      ${gm?h`<button class="btn primary sm" data-act="cs_new">Set up a contest</button>`:''}</div>`;
  }
  const R=num(C.round),ents=csEnts();
  const myE=!gm?ents.find(e=>C.ents[e].k==='pc'&&canEditT(C.ents[e].u)&&C.cur===e):'';
  const stageTxt={intro:'Introductions',appeal:'Round '+R+' of 5',awards:'Awards',done:'Results recorded'}[C.stage]||'';
  return h`<div class="ctstage">
    <div class="row sp"><div class="rounds"><span class="fl">Round</span>${[1,2,3,4,5].map(i=>h`<i class="${i<R||C.stage==='awards'||C.stage==='done'?'done':i===R&&C.stage==='appeal'?'now':''}">${i}</i>`)}</div>
      <div class="row"><b>${C.name}</b> <span class="pill">${stageTxt}</span>${C.var&&C.var.sup?h`<span class="pill">Super Contest${C.rt?': '+C.rt:''}</span>`:C.type?ctChip(C.type):''}${C.var&&C.var.dbl?h`<span class="pill">Double Performance</span>`:''}${C.var&&C.var.fest?h`<span class="pill">Festival</span>`:''}${C.var&&C.var.hv?h`<span class="pill">High Voltage</span>`:''}</div></div>
    ${csJudgesHtml(C,gm)}
    <div class="field2">
      <div class="fside"><h3>Heart Points</h3>${csBoardHtml(C,gm)}</div>
      <div class="fside"><h3>${C.stage==='appeal'?(C.cur?'Appeal · '+(C.ents[C.cur]||{}).name:'Between appeals'):C.stage==='intro'?'Introductions':'Final standings'}</h3>
        ${C.stage==='appeal'&&C.cur&&(gm||myE)?csFormHtml(C,C.cur,gm):''}
        ${C.stage==='appeal'&&C.cur&&!gm&&!myE?h`<p class="sub">${(C.ents[C.cur]||{}).name} is appealing.</p>`:''}
        ${C.stage==='appeal'&&!C.cur?h`<p class="sub">${(C.done||[]).length>=ents.length?'Everyone has appealed this round.':'Waiting for the GM to call the next appeal.'}</p>`:''}
        ${C.stage==='intro'?h`<p class="sub">Each trainer may make one Insight check on a judge: the GM reveals a goal for a success. Some halls also give Heart Points for the introduction.</p>`:''}
        ${C.stage==='awards'||C.stage==='done'?csRankHtml(C):''}
      </div>
    </div>
    ${C.stage==='awards'||C.stage==='done'?h`<div class="fside"><h3>Star Points</h3>${csAwardsHtml(C,false)}</div>`:''}
    ${C.stage==='appeal'?h`<div class="fside"><h3>This round</h3>${csLogHtml(C,false)}</div>`:''}
    ${gm?csGmBar(C):''}
    ${gm&&C.stage==='appeal'?h`<details class="clrd"><summary>Star Points so far (GM only)</summary>${csAwardsHtml(C,true)}</details>`:''}
    ${C.stage!=='appeal'&&(C.log||[]).length?h`<details class="clrd"><summary>Every appeal</summary>${csLogHtml(C,true)}</details>`:''}
  </div>`;
}
function csGmBar(C){
  const R=num(C.round),all=(C.done||[]).length>=csEnts().length,last=(C.log||[]).slice(-1)[0];
  const ask=S.ui.confirm==='cs|close';
  return h`<div class="row csgm">
    ${C.stage==='intro'?h`<button class="btn primary sm" data-act="cs_start">Start the appeals</button>`:''}
    ${C.stage==='appeal'?h`${!C.cur&&!all?h`<button class="btn sm" data-act="cs_next">Next appealer</button>`:''}
      ${all?(R<5?h`<button class="btn primary sm" data-act="cs_round">Start round ${R+1}</button>`:h`<button class="btn primary sm" data-act="cs_awards">Reveal the awards</button>`):h`<button class="btn sm ghost" data-act="cs_skip">Skip ${C.cur?(C.ents[C.cur]||{}).name:'the next one'}</button>`}
      ${last&&num(last.r)===R&&num(last.cb)<2?h`<button class="btn sm ghost" data-act="cs_cre" title="The GM may add one or two d4 for a creative appeal">+1d4 creativity to ${last.n}</button>`:''}
      ${S.csUndo.length?h`<button class="btn sm ghost" data-act="cs_undo">Undo last</button>`:''}`:''}
    ${C.stage==='awards'&&!C.rec?h`<div class="sendout"><b>Record the results</b><span class="sub">Ticks the ${(ribHalls().find(x=>x.k===C.hall)||{n:'hall'}).n} Ribbon in the winner’s case (players only), adds an honor, and logs the contest circuit rankings: Won a contest ribbon for the winner, Placed second for the runner-up.</span><div class="row"><button class="btn primary sm" data-act="cs_rec">Record ribbon and rankings</button></div></div>`:''}
    <button class="btn sm danger ${ask?'armed':''}" data-act="cs_close">${ask?'Tap again to close the contest':'Close the contest'}</button>
  </div>`;
}
/* ----- actions and inputs ----- */
function csAct(b){
  const d=b.dataset,gm=!!S.me.admin,C=CSC();
  if(d.act==='cs_real'){S.ui.csa.real=d.v==='1';render();return;}
  if(d.act==='cs_go'){
    const E=(C.ents||{})[d.e];
    if(!E)return;
    const ap={id:C.id,r:num(C.round),e:d.e,j:num(S.ui.csa.j),m0:S.ui.csa.m0||'',m1:S.ui.csa.m1||'',tf:num(S.ui.csa.tf),any:S.ui.csa.any||'',st:num(S.ui.csa.st),sum:S.ui.csa.real?String(S.ui.csa.sum||''):'',at:Date.now()};
    const w=csWork(C,d.e,ap);
    if(w.err){toast(w.err);return;}
    if(S.ui.csa.real&&w.dice&&rdNum(ap.sum,w.dice,w.dice*4)==null){toast('Type the total of your '+w.dice+'d4 ('+w.dice+' to '+(w.dice*4)+').');return;}
    if(gm){if(csApply(d.e,ap,'gm')){S.ui.csa={};render();}return;}
    if(E.k!=='pc'||!canEditT(E.u)||C.cur!==d.e){toast('It is not your appeal.');return;}
    edit('t',E.u,'ctap',ap);
    toast('Appeal sent. The GM’s screen scores it in a moment.',true);
    render();return;
  }
  if(!gm)return;
  const D=S.ui.cs;
  switch(d.act){
    case 'cs_new':csDraft();render();break;
    case 'cs_cancel':S.ui.cs=null;render();break;
    case 'cs_var':if(D){D.var[d.k]=!!b.checked;if(d.k==='fest'&&b.checked)D.var.sup=false;if(d.k==='sup'&&b.checked)D.var.fest=false;render();}break;
    case 'cs_roll':if(D){csRollGoals(D.judges[num(d.j)],D.var.sup?'':D.type,num(d.j)===0);render();}break;
    case 'cs_pc':if(D){const p=D.pcs[d.uid]||(D.pcs[d.uid]={on:false,m1:'',m2:''});p.on=!!b.checked;const pt=partyOf(d.uid);if(p.on&&!p.m1&&pt[0])p.m1=pt[0].id;if(p.on&&!p.m2&&pt[1])p.m2=pt[1].id;render();}break;
    case 'cs_npcadd':if(D){
      if(!D.nnt&&!String(D.nsp||'').trim()){toast('Choose an NPC sheet, or type a name and species.');break;}
      csNpcMons(D).then(n=>{if(!n.mons.length){toast('No Pokémon found for that coordinator.');return;}if(D.var.dbl&&n.mons.length<2){toast('Double Performance needs two Pokémon.');return;}D.npcs.push(n);D.nn='';D.nsp='';D.nnt='';render();});break;}
    case 'cs_npcdel':if(D){D.npcs.splice(num(d.i),1);render();}break;
    case 'cs_open':csOpen();break;
    case 'cs_rev':{const g=((CSG().goals||[])[num(d.j)]||[])[num(d.g)];if(!g)break;const by=S.ui.csrb||'';edit('cs','contest','gl',Object.assign({},C.gl||{},{[d.j+'-'+d.g]:{t:csGoalTxt(g),by}}));render();break;}
    case 'cs_bonus':{const E=C.ents[d.e];if(!E)break;const r=rnd(4);edit('cs','contest','ents',Object.assign({},C.ents,{[d.e]:Object.assign({},E,{hp:num(E.hp)+r,ihp:num(E.ihp)+r})}));toast(E.name+': +'+r+' Heart Points for the introduction.',true);render();break;}
    case 'cs_start':csStartRound(1);edit('cs','contest','stage','appeal');render();break;
    case 'cs_round':csStartRound(num(C.round)+1);render();break;
    case 'cs_next':{const nx=(C.order||[]).find(x=>(C.done||[]).indexOf(x)<0)||'';edit('cs','contest','cur',nx);render();break;}
    case 'cs_now':edit('cs','contest','cur',d.e);S.ui.csa={};render();break;
    case 'cs_skip':{if(!C.cur)break;const done=(C.done||[]).concat([C.cur]);edit('cs','contest','done',done);edit('cs','contest','cur',(C.order||[]).find(x=>done.indexOf(x)<0)||'');render();break;}
    case 'cs_cre':{const lg=(C.log||[]).slice(),x=lg[lg.length-1];if(!x)break;const r=rnd(4),add=x.x2?r*2:r;lg[lg.length-1]=Object.assign({},x,{cb:num(x.cb)+1,tot:num(x.tot)+add});const E=C.ents[x.e];
      edit('cs','contest','log',lg);if(E)edit('cs','contest','ents',Object.assign({},C.ents,{[x.e]:Object.assign({},E,{hp:num(E.hp)+add})}));toast(x.n+': +'+add+' Heart Points for creativity.',true);render();break;}
    case 'cs_undo':{const prev=S.csUndo.pop();if(!prev)break;['judges','ents','ready','scr','log','done','cur'].forEach(k=>edit('cs','contest',k,prev[k]!=null?prev[k]:(k==='cur'?'':k==='scr'?0:k==='ready'?{}:[])));toast('The last appeal was undone.',true);render();break;}
    case 'cs_awards':csReveal();break;
    case 'cs_rec':csRecord();break;
    case 'cs_close':if(S.ui.confirm!=='cs|close'){S.ui.confirm='cs|close';render();break;}S.ui.confirm='';csClose();break;
  }
}
/* the setup's and awards' boxes and menus (data-csx), from the input listener */
function csInput(t){
  if(!S.me.admin)return;
  const d=t.dataset,D=S.ui.cs;
  switch(d.csx){
    case 'jn':if(D)D.judges[num(d.j)].n=t.value;return;
    case 'gx':if(D)D.judges[num(d.j)].goals[num(d.g)].x=t.value;return;
    case 'gk':if(D){const g=D.judges[num(d.j)].goals[num(d.g)],dd=csGoal(t.value);g.k=t.value;g.t=dd[2]==='ty'?'Normal':dd[2]==='ct'?D.type:'';}break;
    case 'gt':if(D)D.judges[num(d.j)].goals[num(d.g)].t=t.value;break;
    case 'pm':if(D&&D.pcs[d.uid])D.pcs[d.uid][d.k]=t.value;break;
    case 'ov':edit('cg','contest','ov',Object.assign({},CSG().ov||{},{[d.j+'-'+d.g]:t.value}));break;
  }
  render();
}
