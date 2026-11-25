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
/* a contestant's Pokémon's contest stats: a player's from its sheet; an NPC's from the GM's own copy (gm/contest.ncs, Update 68) */
function csMonStats(E,eid,G){
  if(!E)return [];
  if(E.k==='pc')return (E.mons||[]).map(mo=>ctStatsOf(getLocal('p',E.u+'/'+mo.pid)));
  const L=(((G||CSG()).ncs||{})[eid])||[];
  return (E.mons||[]).map((mo,i)=>ctStatsOf({cs:L[i]||mo.cs||{}}));
}
const csTopStat=(E,eid,type,G)=>Math.max(0,...csMonStats(E,eid,G).map(c=>num(c[type])));
function csStatLeft(E,type,eid){
  if(!E||!type)return 0;
  return Math.max(0,csTopStat(E,eid,type)-num((E.spent||{})[type]));
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
  const stLeft=csStatLeft(E,type,eid),stat=clamp(Math.round(num(ap.st)),0,stLeft);
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
  /* hall twists (Update 67) */
  if(C.tw&&C.tw.dawn&&R===5&&!c.zero)parts.push({n:1,why:'first light'});
  const pen=!!(C.tw&&C.tw.celestic&&rel==='x'&&!c.zero);
  const dice=parts.reduce((a,p)=>a+p.n,0);
  return {E,J,j,dbl,m0,m1,mA,mK,type,kw,ctype,c,parts,dice,stat,stLeft,v0,v1,reach,zero:c.zero,x2:!hv&&c.x2,used,hv,pen};
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
  const sub=sum+w.stat;
  let total=w.zero?0:(w.x2?sub*2:sub);
  const pen=w.pen?rnd(4):0;
  total=Math.max(0,total-pen);
  const ta=C.var&&C.var.ta&&ap.ta&&!w.E.ta?csTaRoll(C,eid,ap.tsk||'perform',ap.td):null;
  if(ta)total+=ta.hp;
  const cr=csCrowdAfter(C,w.zero?-1:(C.cfav&&w.type===C.cfav?2:0)+(w.v1>w.v0?1:0)+(w.reach?2:0)+(ta&&ta.hp?1:0));/* a repeated move only costs the crowd */
  total+=cr.pay;
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
  const E=Object.assign({},w.E,{hp:num(w.E.hp)+total,lastMv:w.used},ta?{ta:1}:{});
  if(w.stat){E.spent=Object.assign({},E.spent||{});E.spent[w.type]=num(E.spent[w.type])+w.stat;}
  const ready=Object.assign({},C.ready||{});
  if(w.kw==='Get Ready!')ready[eid]=1;else delete ready[eid];
  const bts=[w.m0.bt].concat(w.m1?[w.m1.bt]:[]).filter(Boolean);
  const entry={r:num(C.round),e:eid,n:E.name,mon:[csMonName(E,0)].concat(w.dbl?[csMonName(E,1)]:[]).join(' & '),mv:w.used.join(' + '),t:w.type,bt:bts,kw:w.kw,j:w.j,
    dice:w.dice,rolled,sum,stat:w.stat,x2:w.x2?1:0,tot:total,v0:w.v0,v1:w.v1,rs:w.reach?1:0,zero:w.zero?1:0,rd:typed?1:0,by:by||'gm',at:Date.now()};
  if(pen)entry.pen=pen;
  if(ta)entry.ta=ta;
  if(cr.pay){entry.cr=cr.pay;entry.crr=cr.rolled;}
  if(C.var&&C.var.ap)edit('cs','contest','crowd',cr.crowd);
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
        const L=mine(e),A=L.filter(x=>!x.k);   /* A: the appeals themselves; L also has Rival Showcase bonuses */
        switch(g.k){
          case 'hp':sc[e]=L.reduce((a,x)=>a+num(x.tot),0)+num(C.ents[e].sh);break;
          case 'ct':sc[e]=A.filter(x=>x.t===g.t).reduce((a,x)=>a+num(x.tot),0);break;
          case 'ty':sc[e]=A.filter(x=>(x.bt||[]).indexOf(g.t)>=0).reduce((a,x)=>a+num(x.tot),0);break;
          case 'one':sc[e]=A.reduce((a,x)=>Math.max(a,num(x.tot)),0);break;
          case 'cnt':sc[e]=A.length;break;
          case 'up':sc[e]=A.filter(x=>num(x.v1)>num(x.v0)).length;break;
          case 'fin':sc[e]=L.filter(x=>num(x.r)===5).reduce((a,x)=>a+num(x.tot),0);break;
          case 'var':sc[e]=new Set(A.map(x=>x.mv)).size;break;
          case 'stat':sc[e]=csTopStat(C.ents[e],e,g.t,G);break;
          default:break;
        }
      });
      if(g.k==='el'){const f=log.find(x=>!x.k&&x.rs&&num(x.j)===j);if(f)sc[f.e]=1;}
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
  /* an extra stage's winner earns a Star Point (Update 67) */
  const X=(C.pre||[]).filter(k=>k.indexOf('x:')===0&&(C.pr||{})[k]&&C.pr[k].done).map(k=>({n:csPreName(k),win:(C.pr[k].win||[]).filter(e=>stars[e]!=null)}));
  X.forEach(x=>x.win.forEach(e=>{stars[e]++;}));
  const rank=ents.slice().sort((a,z)=>stars[z]-stars[a]||num(C.ents[z].hp)-num(C.ents[a].hp));
  return {J:out,X,stars,rank};
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
  edit('cs','contest','aw',{J:A.J.map(J=>({n:J.n,goals:J.goals.map(x=>({txt:x.txt,win:x.win}))})),X:A.X,stars:A.stars,rank:A.rank});
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
  S.ui.cs={hall:halls[0]?halls[0].k:'',type:'Beauty',var:{dbl:false,sup:false,fest:false,hv:false,ta:false,rs:false,ap:false,vis:false,dan:false},xs:{},tw:{},tdc:15,theme:'',note:'',
    sk:{vis:'perform',dan:'perform',cook:'nature',fashion:'perform',athlon:'athletics',heroes:'perform',talent:'sleight',tasting:'nature'},pairs:{},
    judges:CS_JUDGES.map(n=>({k:'',n,r:'',goals:[]})),panel:'',pcs:{},npcs:[],nn:'',nsp:'',nnt:'',nm1:'',nm2:''};
  csApplyPreset(S.ui.cs,S.ui.cs.hall);
  /* Update 72: with a judge pack, the hall's own panel (which rolls their goals from what they lean toward) */
  if(!csLoadPanel(S.ui.cs,S.ui.cs.hall))S.ui.cs.judges.forEach((J,j)=>csRollGoals(J,S.ui.cs.type,j===0));
  return S.ui.cs;
}
/* the announced type decides one Star Point, so only the first judge's first goal is fixed to it */
function csRollGoals(J,type,first){
  const pool=CS_GOALS.filter(g=>!CS_MANUAL.has(g[0])&&(!first||g[0]!=='ct'));
  const out=first?[{k:'ct',t:type||csRnd(CT_TYPES)}]:[];
  /* Update 72: a judge from the judge pack takes most goals from the ones they lean toward */
  const lean=csjLeans(J).filter(l=>!(first&&l.k==='ct'));
  let n=0;
  while(out.length<3&&n++<300){
    if(lean.length&&Math.random()<0.75){
      const l=lean.shift(),d=csGoal(l.k);
      if((first&&l.k==='ct')||out.some(x=>x.k===l.k))continue;
      out.push({k:l.k,t:l.t||(d[2]==='ct'?csRnd(CT_TYPES):d[2]==='ty'?csRnd(TYPES):''),x:l.x||''});continue;
    }
    const g=csRnd(pool);if(out.some(x=>x.k===g[0]))continue;out.push({k:g[0],t:g[2]==='ct'?csRnd(CT_TYPES):g[2]==='ty'?csRnd(TYPES):''});
  }
  J.goals=out;
}
/* Update 68: an NPC's check bonus starts from their Quick NPC rank (Novice +2, Skilled or Specialist +3, Experienced +4, Ace +5) */
const csQnCb=nt=>{const q=qnOf(nt),r=q&&q.r;return r==='4'?5:r==='3'?4:r==='2'||r==='2s'?3:r==='1'?2:3;};
const csCsLow=m=>{const c=ctStatsOf(m),o={};CT_TYPES.forEach(t=>{o[t.toLowerCase()]=num(c[t]);});return o;};
/* one of an NPC sheet's Pokémon as it enters a contest: moves, types and contest stats */
const csNpcMon=m=>({mid:m.id,sp:m.sp,name:m.nick||m.sp,ty:(m.ty||[]).filter(Boolean),mv:(m.mv||[]).map(x=>({n:x.name,t:x.type||''})).filter(x=>x.n),cs:csCsLow(m),spd:num((m.base||{}).spe)});
/* the Pokémon the GM picked from an NPC sheet (the first ones when nothing is picked) */
function csNpcPicks(nt,ids,dbl){
  const team=ntTeam(nt),out=[];
  (ids||[]).forEach(id=>{const m=team.find(x=>x.id===id);if(m&&out.indexOf(m)<0)out.push(m);});
  team.forEach(m=>{if(out.length<(dbl?2:1)&&out.indexOf(m)<0)out.push(m);});
  return out.slice(0,dbl?2:1);
}
async function csNpcMons(D){
  /* an NPC coordinator: from an NPC sheet (the Pokémon picked, Update 68), or a name and species (natural moves) */
  const dbl=!!D.var.dbl,out=[];
  if(D.nnt&&NTS()[D.nnt]){
    const nt=NTS()[D.nnt];
    csNpcPicks(nt,[D.nm1,dbl?D.nm2:''],dbl).forEach(m=>out.push(csNpcMon(m)));
    return {id:'n_'+Date.now().toString(36)+Math.random().toString(36).slice(2,5),name:ntName(nt),nt:D.nnt,mons:out,spd:num((out[0]||{}).spd),cb:csQnCb(nt)};
  }
  const sps=String(D.nsp||'').split(/[,+&]/).map(x=>x.trim()).filter(Boolean).slice(0,dbl?2:1);
  for(const sp of sps){
    const pr=ptaResolve(sp);
    let rec=null;
    if(pr)rec=ptaRec(pr)||await ptaChunk(ptaLetter(ptaKey(pr))).then(()=>ptaRec(pr));
    const base=foeFromRec(rec,rec?null:speciesInfo(sp),sp);
    out.push({sp:base.sp||sp,name:base.sp||sp,ty:(base.ty||[]).filter(Boolean),mv:(base.mv||[]).map(x=>({n:x.name,t:x.type||''})).filter(x=>x.n),cs:csCsLow(null)});
  }
  return {id:'n_'+Date.now().toString(36)+Math.random().toString(36).slice(2,5),name:String(D.nn||'').trim()||'Coordinator',nt:'',mons:out,spd:0,cb:3};
}
/* contest stats changed at setup are saved on the NPC's sheet when the contest opens (Update 68) */
function csNpcSaveStats(D){
  (D.npcs||[]).forEach(n=>{
    const nt=n.nt&&NTS()[n.nt];if(!nt)return;
    const team=ntTeam(nt);
    (n.mons||[]).forEach(mo=>{
      const i=team.findIndex(x=>x.id===mo.mid);if(i<0||!mo.cs)return;
      const cur=csCsLow(team[i]);
      if(CT_TYPES.some(t=>num(cur[t.toLowerCase()])!==num(mo.cs[t.toLowerCase()])))edit('gt',n.nt,'team.'+i+'.cs',Object.assign({},mo.cs));
    });
  });
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
  const ncs={};
  D.npcs.forEach((n,i)=>{const e=n.id||('n_'+i+'_'+Date.now().toString(36));
    ents[e]=Object.assign({k:'npc',hp:0,sh:0,spent:{},lastMv:[]},n,{mons:(n.mons||[]).map(mo=>{const o=Object.assign({},mo);delete o.cs;delete o.spd;return o;})});eord.push(e);
    ncs[e]=(n.mons||[]).map(mo=>Object.assign({},mo.cs||{}));});
  if(eord.length<2){toast('A contest needs at least two contestants'+(dbl?' with two Pokémon each':'')+'.');return;}
  const hall=ribHalls().find(x=>x.k===D.hall);
  const hv=!!D.var.hv;
  const pairs=[],seen=new Set();
  if(D.var.rs)Object.keys(D.pairs||{}).forEach(a=>{const z=D.pairs[a];if(!z||!ents[a]||!ents[z]||seen.has(a)||seen.has(z))return;seen.add(a);seen.add(z);pairs.push([a,z]);});
  const vr={};CS_VARK.forEach(k=>{vr[k]=!!D.var[k];});
  const C={v:2,on:true,id:'c'+Date.now().toString(36),hall:D.hall,name:hall?hall.n+' Contest':'Contest',type:D.var.sup?'':D.type,var:vr,
    stage:'intro',round:0,rt:'',judges:D.judges.map(J=>({n:String(J.n||'Judge').trim()||'Judge',k:String(J.k||''),r:String(J.r||''),fav:D.type,v:hv?1:0,el:false,hold:false,exc:false})),
    ents,eord,order:[],done:[],cur:'',log:[],ready:{},scr:0,gl:{},aw:null,rec:0,at:Date.now(),
    pre:csPreList(D),pi:0,pr:{},sk:Object.assign({},D.sk),theme:String(D.theme||''),tdc:clamp(Math.round(num(D.tdc))||15,5,40),tw:Object.assign({},D.tw),
    pairs,rsd:{},crowd:0,cfav:vr.ap?csRnd(CT_TYPES):''};
  Object.keys(C).forEach(k=>edit('cs','contest',k,C[k]));
  edit('cg','contest','ncs',ncs);
  csNpcSaveStats(D);
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
    const R=gm&&csJudge(J.k);
    return h`<div class="judge ${J.el?'elec':''}"><div class="row sp"><b>${J.n}</b>${J.el?h`<span class="pill good">Electrified${C.var&&C.var.hv?' +5d4':' ×2'}</span>`:''}</div>
      ${J.r?h`<p class="sub csjrole">${J.r}</p>`:''}
      ${R&&R.tell?h`<p class="csjt"><b>Tell</b> ${R.tell} <span class="pill gm">GM</span></p>`:''}
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
    const pr=(C.pairs||[]).find(p=>p.indexOf(e)>=0),riv=pr?C.ents[pr[0]===e?pr[1]:pr[0]]:null;
    return h`<li class="${now?'now':''}"><span class="bn">${i+1}</span><div><b>${E.name}</b> <span class="sub">${[0,1].map(k=>csMonName(E,k)).filter(Boolean).join(' & ')}${riv?' · vs '+riv.name:''}</span>${C.var&&C.var.ta&&E.ta?h` <span class="pill">Trainer Appeal used</span>`:''}${now?h` <span class="pill good">Appealing</span>`:done&&C.stage==='appeal'?h` <span class="pill">Done</span>`:''}
      ${gm&&C.stage==='appeal'&&!now&&!done?h` <button class="btn sm ghost" data-act="cs_now" data-e="${e}">Goes now</button>`:''}
      ${gm&&C.stage==='intro'?h` <button class="btn sm ghost" data-act="cs_bonus" data-e="${e}" title="Add 1d4 Heart Points for the introduction">+1d4 intro</button>`:''}
      <span class="heartbar" style="${raw('width:'+Math.round(num(E.hp)/mx*100)+'%')}"></span></div><span class="hearts">♥ ${num(E.hp)}</span></li>`;})}</ol>`;
}
function csLogHtml(C,all){
  const R=num(C.round),rows=(C.log||[]).filter(x=>all||num(x.r)===R);
  if(!rows.length)return h`<p class="sub">No appeals yet${all?'':' this round'}.</p>`;
  return h`<ul class="applog">${rows.slice().reverse().map(x=>x.k==='rs'?h`<li><b>${x.n}</b> · Rival Showcase: beat ${x.vs} this round, 2d4 [${(x.rolled||[]).join(', ')}] = +${x.tot} ♥</li>`:h`<li><b>${x.n}</b> · ${x.mon} · ${x.mv} (${x.t}, ${x.kw}) → ${((C.judges||[])[num(x.j)]||{}).n||'a judge'}: ${x.zero?'repeated move, no Heart Points':(num(x.dice)?x.dice+'d4 '+(x.rd?'typed '+x.sum:'['+(x.rolled||[]).join(', ')+']'):'no dice')+(num(x.stat)?' + '+x.stat+' stat':'')+(x.x2?' × 2':'')+' = '+x.tot+' ♥'}${num(x.cb)?' (+'+x.cb+' creativity)':''}${x.pen?' (−'+x.pen+' composure)':''}${x.ta?' · Trainer Appeal: '+csSkName(x.ta.sk)+' '+x.ta.t+' vs '+x.ta.dc+(x.ta.hp?', +'+x.ta.hp:', no Heart Points'):''}${x.cr?' · the crowd erupts: +'+x.cr:''} · Voltage ${x.v0} → ${x.v1}${x.rs?' · Electrified!':''}${x.rd?h` <span class="pill rdp">real dice</span>`:''}</li>`)}</ul>`;
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
    ${C.var&&C.var.ta&&!E.ta?csTaForm(C,eid,a):''}
    ${!w.err&&w.pen?h`<p class="sub">Composure (Celestic): this move clashes, so it loses 1d4.</p>`:''}
    <div class="dicesw"><span class="fl">Dice</span><div class="seg" role="group" aria-label="Who rolls"><button data-act="cs_real" data-v="0" aria-pressed="${String(!a.real)}">The site rolls</button><button data-act="cs_real" data-v="1" aria-pressed="${String(!!a.real)}">I rolled real dice</button></div>
      ${a.real&&!w.err&&w.dice?h`<label class="fld csum"><span class="fl">Total of your ${w.dice}d4</span><input type="number" inputmode="numeric" min="${w.dice}" max="${w.dice*4}" data-u="csa.sum" data-nr value="${a.sum||''}"></label>`:''}</div>
    <div class="row"><button class="btn primary sm" data-act="cs_go" data-e="${eid}" ${w.err||sent?raw('disabled'):''}>${sent?'Sent: waiting for the GM’s screen':'Make the appeal'}</button>${gm&&E.k==='pc'?h`<span class="sub">${E.name} can send this from their own screen too.</span>`:''}</div>
  </div>`;
}
/* Update 68: which of an NPC sheet's Pokémon enter, picked before adding */
function csNpcPickSel(D,dbl){
  const nt=NTS()[D.nnt],team=ntTeam(nt),cur=csNpcPicks(nt,[D.nm1,dbl?D.nm2:''],dbl);
  const opt=(k,sel)=>h`<label class="fld"><span class="fl">${k==='nm2'?'Second Pokémon':'Pokémon'}</span><select data-u="cs.${k}">${team.map(m=>h`<option value="${m.id}" ${sel&&sel.id===m.id?raw('selected'):''}>${ntMonName(m)}${m.nick&&m.sp?' ('+m.sp+')':''}${ctStatTotal(ctStatsOf(m))?' · '+CT_TYPES.filter(t=>ctStatsOf(m)[t]).map(t=>CT_ICON[t]+ctStatsOf(m)[t]).join(' '):''}</option>`)}</select></label>`;
  return h`${opt('nm1',cur[0])}${dbl?opt('nm2',cur[1]):''}`;
}
/* an NPC coordinator in the setup: their Pokémon (swappable when they come from a sheet), each one's contest stats, and the check bonus */
function csNpcRow(n,i,dbl){
  const nt=n.nt&&NTS()[n.nt],team=nt?ntTeam(nt):[];
  return h`<div class="csnpcb">
    <div class="brl csnpc"><b>${n.name}</b><span class="sub">${nt?'NPC sheet'+(qnOf(nt)&&nt.q.r?' · '+qnRankName(nt.q.r):''):'by species'}</span><label class="fld csncb"><span class="fl">Check bonus</span><input type="number" inputmode="numeric" data-csx="ncb" data-i="${i}" value="${num(n.cb)}"></label><button class="btn sm ghost" data-act="cs_npcdel" data-i="${i}">Remove</button></div>
    ${(n.mons||[]).map((mo,mi)=>h`<div class="csnm">
      ${nt&&team.length>1?h`<select data-csx="nmon" data-i="${i}" data-m="${mi}" aria-label="${n.name}’s ${mi?'second ':''}Pokémon">${team.map(m=>h`<option value="${m.id}" ${m.id===mo.mid?raw('selected'):''} ${(n.mons||[]).some((o,oi)=>oi!==mi&&o.mid===m.id)?raw('disabled'):''}>${ntMonName(m)}${m.nick&&m.sp?' ('+m.sp+')':''}</option>`)}</select>`:h`<b class="csnmn">${mo.name}</b>`}
      <span class="sub">${(mo.mv||[]).length} moves</span>
      <div class="csmini" role="group" aria-label="${mo.name}’s contest stats">${CT_TYPES.map(t=>h`<label class="fld cs"><span class="fl"><span class="ct ${t.toLowerCase()}" title="${t}"><span aria-hidden="true">${CT_ICON[t]}</span><span class="cts">${t}</span></span></span><input type="number" inputmode="numeric" min="0" max="30" data-csx="ncs" data-i="${i}" data-m="${mi}" data-t="${t.toLowerCase()}" aria-label="${t} contest stat" value="${num((mo.cs||{})[t.toLowerCase()])}"></label>`)}</div>
    </div>`)}
  </div>`;
}
function csSetupHtml(){
  const D=csDraft(),halls=ribHalls(),ids=tids(),nts=ntIds().filter(id=>ntTeam(NTS()[id]).length);
  const dbl=!!D.var.dbl;
  const tog=(k,l,x)=>h`<label class="chip chkc"><input type="checkbox" data-act="cs_var" data-k="${k}" ${D.var[k]?raw('checked'):''}><span>${l}</span>${x?h` <span class="sub">${x}</span>`:''}</label>`;
  return h`<div class="ctstage">
    <div class="fgrid">
      <label class="fld"><span class="fl">Contest hall</span><select data-csx="hall">${halls.map(x=>h`<option value="${x.k}" ${D.hall===x.k?raw('selected'):''}>${x.n}</option>`)}</select></label>
      <label class="fld"><span class="fl">Contest type</span><select data-u="cs.type" ${D.var.sup?raw('disabled'):''}>${CT_TYPES.map(t=>h`<option ${D.type===t?raw('selected'):''}>${t}</option>`)}</select></label>
    </div>
    <div class="row"><span class="sub">${D.note?'Preset: '+D.note:'No preset for this hall.'}</span><button class="btn sm ghost" data-act="cs_psave">Save as this hall’s preset</button></div>
    <div class="row evchips">${tog('dbl','Double Performance','two Pokémon each')}${tog('sup','Super Contest','a random type each round')}${tog('fest','Festival','each judge a type each round')}${tog('hv','High Voltage','judges start at 1')}</div>
    ${csSetupMore(D)}
    <h3 class="refg">Judges and their hidden goals <span class="pill gm">GM only</span></h3>
    <div class="judges">${D.judges.map((J,j)=>h`<div class="judge">${csjPicker(D,J,j)}
      ${J.goals.map((g,gi)=>{const d=csGoal(g.k);return h`<div class="cgoal"><select data-csx="gk" data-j="${j}" data-g="${gi}" aria-label="Goal ${gi+1}">${CS_GOALS.map(x=>h`<option value="${x[0]}" ${g.k===x[0]?raw('selected'):''}>${x[1].replace('{t}','…')}</option>`)}</select>
        ${d[2]?h`<select data-csx="gt" data-j="${j}" data-g="${gi}" aria-label="Type">${(d[2]==='ty'?TYPES:CT_TYPES).map(t=>h`<option ${g.t===t?raw('selected'):''}>${t}</option>`)}</select>`:''}
        ${g.k==='gm'?h`<input type="text" data-csx="gx" data-j="${j}" data-g="${gi}" value="${g.x||''}" placeholder="What earns it">`:''}</div>`;})}
      <button class="btn sm" data-act="cs_roll" data-j="${j}">Roll goals</button></div>`)}</div>
    <p class="sub">The announced contest type decides one Star Point, so Roll goals gives the first judge that goal and the others something else.${csRoster()?' Judges from your judge pack take most of their goals from what they lean toward.':''} Players never receive these until you reveal one (an Insight check) or the awards.</p>
    ${csjRosterHtml(D)}
    <h3 class="refg">Contestants</h3>
    <div class="bench">${ids.map(uid=>{const p=D.pcs[uid]||{},pt=monsOf(uid);
      return h`<div class="brl"><label class="chip chkc"><input type="checkbox" data-act="cs_pc" data-uid="${uid}" ${p.on?raw('checked'):''}><span>${tName(S.trainers[uid])}</span></label>
        ${p.on?h`<select data-csx="pm" data-uid="${uid}" data-k="m1" aria-label="Pokémon">${[h`<option value="">Pokémon…</option>`].concat(pt.map(m=>h`<option value="${m.id}" ${p.m1===m.id?raw('selected'):''}>${mName(m)}</option>`))}</select>
        ${dbl?h`<select data-csx="pm" data-uid="${uid}" data-k="m2" aria-label="Second Pokémon">${[h`<option value="">Second Pokémon…</option>`].concat(pt.map(m=>h`<option value="${m.id}" ${p.m2===m.id?raw('selected'):''}>${mName(m)}</option>`))}</select>`:''}`:''}</div>`;})}
      ${D.npcs.map((n,i)=>csNpcRow(n,i,dbl))}
    </div>
    <div class="mgd"><b>Add an NPC coordinator</b><div class="fgrid">
      <label class="fld"><span class="fl">From an NPC sheet</span><select data-u="cs.nnt"><option value="">None (type a name)</option>${nts.map(id=>h`<option value="${id}" ${D.nnt===id?raw('selected'):''}>${ntName(NTS()[id])}</option>`)}</select></label>
      ${D.nnt&&NTS()[D.nnt]?csNpcPickSel(D,dbl):''}
      ${D.nnt?'':h`<label class="fld"><span class="fl">Name</span><input type="text" data-u="cs.nn" data-nr value="${D.nn}"></label><label class="fld"><span class="fl">Species${dbl?' (two, with a comma)':''}</span><input type="text" list="dl-species" data-u="cs.nsp" data-nr value="${D.nsp}"></label>`}</div>
      <div class="row"><button class="btn sm" data-act="cs_npcadd">Add coordinator</button><span class="sub">An NPC sheet brings the ${dbl?'two Pokémon':'Pokémon'} you pick, with their moves and contest stats, and a check bonus from their Quick NPC rank; a species brings its natural moves.</span></div></div>
    <div class="row"><button class="btn primary sm" data-act="cs_open">Open the contest</button><button class="btn sm ghost" data-act="cs_cancel">Cancel</button></div>
  </div>`;
}
function csAwardsHtml(C,gm){
  const A=gm?csScores(C,CSG()):null,aw=C.aw;
  const ents=csEnts();
  if(gm&&C.stage==='appeal'){
    return h`<div class="csaward">${A.X.length?h`<div class="judge"><b>Extra stages</b><div class="goals">${A.X.map(x=>h`<span>★ ${x.n} → <b>${x.win.map(e=>C.ents[e].name).join(', ')||'nobody'}</b></span>`)}</div></div>`:''}${A.J.map((J,j)=>h`<div class="judge"><b>${J.n}</b><div class="goals">${J.goals.map(x=>h`<span>★ ${x.txt} → ${x.manual?'':h`<b>${x.win.map(e=>C.ents[e].name).join(', ')||'nobody'}</b>`}
      <select data-csx="ov" data-j="${j}" data-g="${x.gi}" aria-label="Who earns it"><option value="">${x.manual?'Choose…':'As counted'}</option><option value="none" ${(CSG().ov||{})[j+'-'+x.gi]==='none'?raw('selected'):''}>Nobody</option>${ents.map(e=>h`<option value="${e}" ${(CSG().ov||{})[j+'-'+x.gi]===e?raw('selected'):''}>${C.ents[e].name}</option>`)}</select></span>`)}</div></div>`)}</div>
      <p class="sub">The goals count only appeals made to that judge (Option B), except moves used, contest stats and the ones you judge. Pick a name to overrule the count.</p>`;
  }
  if(!aw)return '';
  return h`<div class="csaward">${(aw.X||[]).length?h`<div class="judge"><b>Extra stages</b><div class="goals">${aw.X.map(x=>h`<span>★ ${x.n} → <b>${(x.win||[]).map(e=>(C.ents[e]||{}).name).join(', ')||'nobody'}</b></span>`)}</div></div>`:''}${(aw.J||[]).map(J=>h`<div class="judge"><b>${J.n}</b><div class="goals">${(J.goals||[]).map(x=>h`<span>★ ${x.txt} → <b>${(x.win||[]).map(e=>(C.ents[e]||{}).name).join(', ')||'nobody'}</b></span>`)}</div></div>`)}</div>`;
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
  const stageTxt={intro:'Introductions',pre:csPreName(csPreKey(C)),appeal:'Round '+R+' of 5',awards:'Awards',done:'Results recorded'}[C.stage]||'';
  const V=C.var||{},tw=C.tw||{};
  return h`<div class="ctstage">
    <div class="row sp"><div class="rounds"><span class="fl">Round</span>${[1,2,3,4,5].map(i=>h`<i class="${i<R||C.stage==='awards'||C.stage==='done'?'done':i===R&&C.stage==='appeal'?'now':''}">${i}</i>`)}</div>
      <div class="row"><b>${C.name}</b> <span class="pill">${stageTxt}</span>${C.var&&C.var.sup?h`<span class="pill">Super Contest${C.rt?': '+C.rt:''}</span>`:C.type?ctChip(C.type):''}${C.var&&C.var.dbl?h`<span class="pill">Double Performance</span>`:''}${C.var&&C.var.fest?h`<span class="pill">Festival</span>`:''}${C.var&&C.var.hv?h`<span class="pill">High Voltage</span>`:''}${V.ta?h`<span class="pill">Trainer Appeal</span>`:''}${V.rs?h`<span class="pill">Rival Showcase</span>`:''}${CS_TW.filter(t=>tw[t[0]]).map(t=>h`<span class="pill" title="${t[2]}">${t[1]}</span>`)}</div></div>
    ${csCrowdHtml(C)}
    ${csJudgesHtml(C,gm)}
    <div class="field2">
      <div class="fside"><h3>Heart Points</h3>${csBoardHtml(C,gm)}</div>
      <div class="fside"><h3>${C.stage==='appeal'?(C.cur?'Appeal · '+(C.ents[C.cur]||{}).name:'Between appeals'):C.stage==='intro'?'Introductions':C.stage==='pre'?'Before the appeals':'Final standings'}</h3>
        ${C.stage==='pre'||(C.stage==='intro'&&(C.pre||[]).length)?h`<ol class="cspl">${(C.pre||[]).map((k,i)=>h`<li class="${C.stage==='pre'&&i===num(C.pi)?'now':((C.pr||{})[k]||{}).done?'done':''}">${csPreName(k)}${((C.pr||{})[k]||{}).done?' ✓':''}</li>`)}<li>The appeals: five rounds</li></ol>`:''}
        ${C.stage==='appeal'&&C.cur&&(gm||myE)?csFormHtml(C,C.cur,gm):''}
        ${C.stage==='appeal'&&C.cur&&!gm&&!myE?h`<p class="sub">${(C.ents[C.cur]||{}).name} is appealing.</p>`:''}
        ${C.stage==='appeal'&&!C.cur?h`<p class="sub">${(C.done||[]).length>=ents.length?'Everyone has appealed this round.':'Waiting for the GM to call the next appeal.'}</p>`:''}
        ${C.stage==='intro'?h`<p class="sub">Each trainer may make one Insight check on a judge: the GM reveals a goal for a success. Some halls also give Heart Points for the introduction.</p>`:''}
        ${C.stage==='awards'||C.stage==='done'?csRankHtml(C):''}
      </div>
    </div>
    ${C.stage==='pre'?csPreHtml(C,gm):''}
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
    ${C.stage==='intro'?((C.pre||[]).length?h`<button class="btn primary sm" data-act="cs_pre">Start: ${csPreName(C.pre[0])}</button>`:h`<button class="btn primary sm" data-act="cs_start">Start the appeals</button>`):''}
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
    const ap={id:C.id,r:num(C.round),e:d.e,j:num(S.ui.csa.j),m0:S.ui.csa.m0||'',m1:S.ui.csa.m1||'',tf:num(S.ui.csa.tf),any:S.ui.csa.any||'',st:num(S.ui.csa.st),sum:S.ui.csa.real?String(S.ui.csa.sum||''):'',
      ta:!!S.ui.csa.ta,tsk:S.ui.csa.tsk||'perform',td:S.ui.csa.real?String(S.ui.csa.td||''):'',at:Date.now()};
    if(ap.ta&&S.ui.csa.real&&rdNum(ap.td,1,20)==null){toast('Type the d20 for the Trainer Appeal (1 to 20).');return;}
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
      csNpcMons(D).then(n=>{if(!n.mons.length){toast('No Pokémon found for that coordinator.');return;}if(D.var.dbl&&n.mons.length<2){toast('Double Performance needs two Pokémon.');return;}D.npcs.push(n);D.nn='';D.nsp='';D.nnt='';D.nm1='';D.nm2='';render();});break;}
    case 'cs_npcdel':if(D){const gone=(D.npcs[num(d.i)]||{}).id;D.npcs.splice(num(d.i),1);Object.keys(D.pairs).forEach(k=>{if(k===gone||D.pairs[k]===gone)delete D.pairs[k];});render();}break;
    case 'cs_open':csOpen();break;
    case 'cs_jpack':{const fp=$('#jpackfile');if(fp)fp.click();break;}
    case 'cs_jro':if(D){D.jro=!D.jro;render();}break;
    case 'cs_rev':{const g=((CSG().goals||[])[num(d.j)]||[])[num(d.g)];if(!g)break;const by=S.ui.csrb||'';edit('cs','contest','gl',Object.assign({},C.gl||{},{[d.j+'-'+d.g]:{t:csGoalTxt(g),by}}));render();break;}
    case 'cs_bonus':{const E=C.ents[d.e];if(!E)break;const r=rnd(4);edit('cs','contest','ents',Object.assign({},C.ents,{[d.e]:Object.assign({},E,{hp:num(E.hp)+r,ihp:num(E.ihp)+r})}));toast(E.name+': +'+r+' Heart Points for the introduction.',true);render();break;}
    case 'cs_start':csStartRound(1);edit('cs','contest','stage','appeal');render();break;
    case 'cs_pre':edit('cs','contest','stage','pre');edit('cs','contest','pi',0);S.ui.csp={d:{},th:{},mv:{},dm:{},k:''};render();break;
    case 'cs_pscore':csPreScore();break;
    case 'cs_beat':csDanceBeat();break;
    case 'cs_dscore':csDanceScore();break;
    case 'cs_pnext':csPreNext();break;
    case 'cs_pth':S.ui.csp.th[d.e]=!!b.checked;break;
    case 'cs_xs':if(D){D.xs[d.k]=!!b.checked;render();}break;
    case 'cs_tw':if(D){D.tw[d.k]=!!b.checked;render();}break;
    case 'cs_psave':if(D){csSavePreset(D);D.note='Saved for this hall (your preset).';toast('Saved as the '+((ribHalls().find(x=>x.k===D.hall)||{}).n||'hall')+' preset.',true);render();}break;
    case 'cs_round':csRivalBonus(num(C.round));csStartRound(num(C.round)+1);render();break;
    case 'cs_next':{const nx=(C.order||[]).find(x=>(C.done||[]).indexOf(x)<0)||'';edit('cs','contest','cur',nx);render();break;}
    case 'cs_now':edit('cs','contest','cur',d.e);S.ui.csa={};render();break;
    case 'cs_skip':{if(!C.cur)break;const done=(C.done||[]).concat([C.cur]);edit('cs','contest','done',done);edit('cs','contest','cur',(C.order||[]).find(x=>done.indexOf(x)<0)||'');render();break;}
    case 'cs_cre':{const lg=(C.log||[]).slice(),x=lg[lg.length-1];if(!x)break;const r=rnd(4),add=x.x2?r*2:r;lg[lg.length-1]=Object.assign({},x,{cb:num(x.cb)+1,tot:num(x.tot)+add});const E=C.ents[x.e];
      /* creativity also lifts the crowd */
      const cr=csCrowdAfter(C,1);if(cr.pay){lg[lg.length-1].cr=num(x.cr)+cr.pay;lg[lg.length-1].tot+=cr.pay;}if(C.var&&C.var.ap)edit('cs','contest','crowd',cr.crowd);
      edit('cs','contest','log',lg);if(E)edit('cs','contest','ents',Object.assign({},C.ents,{[x.e]:Object.assign({},E,{hp:num(E.hp)+add+cr.pay})}));toast(x.n+': +'+add+' Heart Points for creativity'+(cr.pay?', and the crowd erupts: +'+cr.pay:'')+'.',true);render();break;}
    case 'cs_undo':{const prev=S.csUndo.pop();if(!prev)break;['judges','ents','ready','scr','log','done','cur','crowd'].forEach(k=>edit('cs','contest',k,prev[k]!=null?prev[k]:(k==='cur'?'':k==='scr'||k==='crowd'?0:k==='ready'?{}:[])));toast('The last appeal was undone.',true);render();break;}
    case 'cs_awards':csRivalBonus(num(C.round));csReveal();break;
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
    case 'hall':if(D){D.hall=t.value;if(!csApplyPreset(D,D.hall))D.note='';if(!csLoadPanel(D,D.hall))D.panel='';}break;
    /* Update 72: pick a judge from the roster (or type a name), or load another hall's panel */
    case 'jk':if(D&&D.judges[num(d.j)]){const J=D.judges[num(d.j)],R=csJudge(t.value);if(R){J.k=t.value;J.n=R.n;J.r=String(R.r||'');}else{J.k='';J.r='';}csRollGoals(J,D.var.sup?'':D.type,num(d.j)===0);}break;
    case 'jp':if(D)csLoadPanel(D,t.value);break;
    case 'tdc':if(D)D.tdc=t.value;return;
    case 'theme':if(D)D.theme=t.value;return;
    case 'dsk':if(D)D.sk[d.k]=t.value;break;
    case 'ncb':if(D&&D.npcs[num(d.i)])D.npcs[num(d.i)].cb=Math.round(num(t.value));return;
    /* Update 68: an NPC's contest stats at setup (saved to their sheet when the contest opens), and swapping their Pokémon */
    case 'ncs':{const n=D&&D.npcs[num(d.i)],mo=n&&n.mons[num(d.m)];if(mo&&CT_TYPES.some(x=>x.toLowerCase()===d.t)){mo.cs=Object.assign({},mo.cs||{},{[d.t]:clamp(Math.round(num(t.value)),0,30)});}return;}
    case 'nmon':{const n=D&&D.npcs[num(d.i)],nt=n&&n.nt&&NTS()[n.nt],m=nt&&ntTeam(nt).find(x=>x.id===t.value);
      if(m&&!n.mons.some((o,oi)=>oi!==num(d.m)&&o.mid===m.id)){n.mons[num(d.m)]=csNpcMon(m);if(num(d.m)===0)n.spd=csNpcMon(m).spd;}break;}
    case 'pair':if(D){const e=d.e,old=D.pairs[e];if(old&&D.pairs[old]===e)delete D.pairs[old];delete D.pairs[e];
      if(t.value){const o=t.value,oo=D.pairs[o];if(oo)delete D.pairs[oo];D.pairs[e]=o;D.pairs[o]=e;}}break;
    case 'psk':{const C=CSC(),k=String(d.k||''),key=k.indexOf('x:')===0?k.slice(2):k;edit('cs','contest','sk',Object.assign({},C.sk||{},{[key]:t.value}));break;}
    case 'pd':S.ui.csp.d[d.e]=t.value;return;
    case 'pdm':S.ui.csp.dm[d.e]=t.value;return;
    case 'pmv':S.ui.csp.mv[d.e]=t.value;break;
  }
  render();
}
/* the Trainer Appeal box on the appeal form (Update 67): once per contest */
function csTaForm(C,eid,a){
  const sk=a.tsk||'perform',b=csChkBonus(C,eid,sk),dc=num(C.tdc)||15;
  return h`<div class="csta"><label class="chip chkc"><input type="checkbox" data-u="csa.ta" ${a.ta?raw('checked'):''}><span>Add a Trainer Appeal</span> <span class="sub">once per contest</span></label>
    ${a.ta?h`<label class="fld"><span class="fl">Skill</span><select data-u="csa.tsk">${SKILLS.map(s=>h`<option value="${s[0]}" ${s[0]===sk?raw('selected'):''}>${s[1]}</option>`)}</select></label>
      ${a.real?h`<label class="fld csum"><span class="fl">Trainer’s d20</span><input type="number" inputmode="numeric" min="1" max="20" data-u="csa.td" data-nr value="${a.td||''}"></label>`:''}
      <span class="sub">d20 ${sgn(b)} vs ${dc}: success 2d4 on this appeal, ${dc+5} or more 4d4.</span>`:''}</div>`;
}
