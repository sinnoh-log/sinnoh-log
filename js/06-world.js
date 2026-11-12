'use strict';
/* Sinnoh Trainer Log · 06-world. The files in js/ are classic scripts that share one scope: load them in order (see index.html). */
/* =========================== the odds (no page code in here) =========================== */
const encKey=s=>String(s==null?'':s).trim().toLowerCase();
/* does a modifier's "when" match the conditions c = {t,x,s,m,d,f}? every part named must match */
function encWhenOk(w,c){
  if(!w)return true;
  const have={t:c.t,x:c.x,s:c.s,m:c.m,d:c.d,f:c.f?'on':'off'};
  return Object.keys(w).every(k=>{const a=w[k];return !Array.isArray(a)||!a.length||a.indexOf(have[k])>=0;});
}
/* a modifier is on when its "when" matches and, for a situation the GM switches on by hand (z), the GM has switched it on */
const encModOn=(m,c,z)=>encWhenOk(m.w,c)&&(!m.z||!!(z&&z[m.id]));
function encEff(T,c,z){
  const rows=(Array.isArray(T.enc)?T.enc:[]).filter(r=>r&&String(r.sp||'').trim());
  let W=[];
  const rowOf=sp=>rows.find(r=>encKey(r.sp)===encKey(sp))||null;
  rows.forEach(r=>{const w=Math.max(0,num(r.w));W.push({k:encKey(r.sp),sp:String(r.sp).trim(),w,b:w,row:r});});
  const eo=Math.max(0,num(T.eo));
  W.push({k:'~oor',sp:ENC_OOR,w:eo,b:eo,oor:1,row:null});
  const get=sp=>encKey(sp)===encKey(ENC_OOR)?W.find(e=>e.oor):W.find(e=>e.k===encKey(sp));
  const ensure=(sp,bk)=>{let e=get(sp);if(!e){e={k:encKey(sp),sp:String(sp).trim(),w:0,b:0,row:rowOf(sp),bk};W.push(e);}return e;};
  const sum=()=>W.reduce((a,e)=>a+e.w,0);
  /* add v to the listed entries together, sharing it out in proportion to their weights */
  const spread=(list,v)=>{
    const tot=list.reduce((a,e)=>a+e.w,0);
    if(!list.length)return;
    list.forEach(e=>{e.w=Math.max(0,e.w+(tot>0?v*e.w/tot:v/list.length));});
  };
  let rt=1,nn=null,only='';
  const fish=[],act=[];
  (Array.isArray(T.em)?T.em:[]).forEach(m=>{
    if(!m||!encModOn(m,c,z))return;
    if(!(Array.isArray(m.fish)&&!(m.fx||[]).length&&m.rt==null&&!m.only&&!m.nn))act.push(m);
    if(m.rt!=null)rt*=Math.max(0,num(m.rt));
    if(Array.isArray(m.nn)&&m.nn.length===2)nn=[num(m.nn[0]),num(m.nn[1])];
    if(Array.isArray(m.fish))fish.push({id:m.id,lb:m.lb,list:m.fish,tx:m.tx||''});
    if(Array.isArray(m.only)){
      W=[];
      m.only.forEach(o=>{
        if(o.s===ENC_OOR)W.push({k:'~oor',sp:ENC_OOR,w:Math.max(0,num(o.w)),b:0,oor:1,row:null});
        else W.push({k:encKey(o.s),sp:String(o.s).trim(),w:Math.max(0,num(o.w)),b:0,row:rowOf(o.s),bk:o.bk});
      });
      only=m.lb||'a special place';
    }
    const fx=Array.isArray(m.fx)?m.fx:[];
    const named=new Set();
    fx.forEach(f=>{if(f.s!=='*')(Array.isArray(f.s)?f.s:[f.s]).forEach(s=>named.add(encKey(s)));});
    const before=sum();
    fx.forEach(f=>{
      const a=f.a,v=num(f.v);
      if(f.s==='*'){
        const tg=W.filter(e=>!e.oor&&!named.has(e.k)&&e.w>0);
        if(a==='+'){if(f.each)tg.forEach(e=>{e.w=Math.max(0,e.w+v);});else spread(tg,v);}
        else if(a==='x')tg.forEach(e=>{e.w=e.w*v;});
        return;
      }
      const names=Array.isArray(f.s)?f.s:[f.s];
      if(a==='>'){
        const to=Array.isArray(f.to)?f.to:[];
        if(!to.length)return;
        names.forEach(n=>{
          const e=get(n);
          if(!e||e.w<=0)return;
          const tot=e.w;e.w=0;
          to.forEach(t=>{ensure(t).w+=tot/to.length;});
        });
        return;
      }
      if(a==='+'&&f.cb){spread(names.map(get).filter(Boolean),v);return;}
      names.forEach(n=>{
        let e=get(n);
        if(a==='+'){if(!e&&v>0)e=ensure(n);if(e)e.w=Math.max(0,e.w+v);}
        else if(a==='='){if(!e&&v>0)e=ensure(n);if(e)e.w=Math.max(0,v);}
        else if(a==='x'){if(e)e.w=e.w*v;}
      });
    });
    /* "taking from": whatever this modifier added or removed overall is paid for by (or handed to) the named species */
    if(Array.isArray(m.tk)&&m.tk.length){
      const delta=sum()-before;
      const tg=m.tk.map(get).filter(Boolean);
      const tot=tg.reduce((a,e)=>a+e.w,0);
      if(tg.length&&Math.abs(delta)>1e-9){
        if(delta>0){const take=Math.min(delta,tot);tg.forEach(e=>{e.w=Math.max(0,e.w-(tot>0?take*e.w/tot:0));});}
        else tg.forEach(e=>{e.w+=tot>0?(-delta)*e.w/tot:(-delta)/tg.length;});
      }
    }
  });
  const total=sum();
  const baseTotal=rows.reduce((a,r)=>a+Math.max(0,num(r.w)),0)+eo;
  W.forEach(e=>{e.p=total>0?e.w/total*100:0;e.bp=baseTotal>0?e.b/baseTotal*100:0;});
  return {W,total,rt,nn,fish,act,only};
}
function encPickW(list){
  const tot=list.reduce((a,e)=>a+e.w,0);
  if(tot<=0)return null;
  let r=Math.random()*tot,last=null;
  for(let i=0;i<list.length;i++){
    if(list[i].w<=0)continue;
    last=list[i];
    if(r<list[i].w)return list[i];
    r-=list[i].w;
  }
  return last;
}
const encRand=(a,b)=>a+Math.floor(Math.random()*(b-a+1));
const encGrp=r=>{const lo=clamp(Math.round(num(r&&r.lo))||1,1,8);const hi=clamp(Math.round(num(r&&r.hi))||lo,lo,8);return encRand(lo,hi);};
/* what a table's Danger asks for: easy, normal, hard or danger */
const encDiffOf=T=>ENC_DG[clamp(Math.round(num(T.dg))||1,1,5)]||'easy';
/* how many wild Pokémon a horde is: the GM Guide's range per player, for each player */
function encHordeN(diff,players){
  const d=ENC_DIFF.find(x=>x[0]===diff)||ENC_DIFF[1];
  let n=0;
  for(let i=0;i<Math.max(1,players);i++)n+=encRand(d[2][0],d[2][1]);
  return clamp(n,1,ENC_HORDE_MAX);
}
function encVisitor(T){
  const ev=Array.isArray(T.ev)?T.ev.filter(v=>v&&v.sp):[];
  if(!ev.length)return null;
  const die=T.evd==='d8'?8:6;
  const roll=encRand(1,die);
  const v=ev[(roll-1)%ev.length];
  return {sp:v.sp,o:v.o||'',y:v.y||'',roll,die,wl:num(v.wl),wl2:num(v.wl2),wr:v.wr||'',wr2:v.wr2||''};
}
/* how common something is here, in plain words, from its chance among everything that turns up right now */
const encPct=p=>p>=5?Math.round(p):Math.round(p*10)/10;
function encLocal(p){return p>=15?'Abundant':p>=8?'Common':p>=4?'Uncommon':p>=2?'Rare':p>0?'Very rare':'Not around now';}
/* the "no encounter" gates: a reduced rate (rt) and a d6 range of nothing (nn) */
function encGate(E){
  if(E.rt<=0)return 'No random encounters in these conditions.';
  if(E.rt<1&&Math.random()>=E.rt)return 'Quiet. At '+Math.round(E.rt*100)+'% of the usual rate, nothing stirs this time.';
  if(E.nn){
    const d=encRand(1,6);
    if(d>=E.nn[0]&&d<=E.nn[1])return 'd6 → '+d+'. The place is still: nothing at all turns up.';
  }
  return '';
}
function encLine(T,e,n,E,alphaOk){
  const r=e.row||{};
  const L={sp:e.sp,n,a:0,p:Math.round(e.p*10)/10,bk:r.bk||e.bk||'',wl:num(r.wl),wl2:num(r.wl2),wr:r.wr||'',wr2:r.wr2||'',so:r.so?1:0,al:num(r.al)};
  if(alphaOk&&num(r.al)>0&&Math.random()*100<num(r.al))L.a=1;
  return L;
}
const encMerge=(lines,L)=>{
  const o=lines.find(x=>x.sp===L.sp&&!x.vi&&!L.vi&&x.a===L.a);
  if(o)o.n+=L.n;else lines.push(L);
};
/* one roll. mode: enc (a group), horde, swarm, or fish (with the fishing modifier's id). Returns {lines, none, why, ...} */
function encRollT(T,c,z,o){
  o=o||{};
  const E=encEff(T,c,z);
  const out={kind:o.mode||'enc',lines:[],none:false,why:'',E:{rt:E.rt,nn:E.nn,only:E.only}};
  const mode=out.kind;
  if(mode==='fish'){
    const f=E.fish.find(x=>x.id===o.fid);
    if(!f||!f.list.length){out.none=true;out.why=f&&f.tx?f.tx:'Nothing to catch here.';return out;}
    const L=f.list.map(x=>({sp:x.s,w:Math.max(0,num(x.w)),oor:x.s===ENC_OOR,bk:x.bk,k:encKey(x.s),row:null}));
    const tot=L.reduce((a,x)=>a+x.w,0);
    const pick=encPickW(L);
    if(!pick){out.none=true;out.why='Nothing bites.';return out;}
    out.fishLb=f.lb;
    if(pick.oor){
      const v=encVisitor(T);
      if(!v){out.none=true;out.why='Nothing bites.';return out;}
      out.lines.push({sp:v.sp,n:1,a:0,p:Math.round(pick.w/tot*1000)/10,bk:'',wl:v.wl,wl2:v.wl2,wr:v.wr,wr2:v.wr2,vi:v});
    }else{
      const r=(T.enc||[]).find(x=>encKey(x.sp)===pick.k)||{};
      out.lines.push({sp:pick.sp,n:1,a:0,p:Math.round(pick.w/tot*1000)/10,bk:pick.bk||r.bk||'',wl:num(r.wl),wl2:num(r.wl2),wr:r.wr||'',wr2:r.wr2||'',so:0,al:0});
    }
    return out;
  }
  const gate=encGate(E);
  if(gate){out.none=true;out.why=gate;return out;}
  const pool=E.W.filter(e=>e.w>0);
  if(!pool.length){out.none=true;out.why='This table has nothing in it to roll.';return out;}
  if(mode==='swarm'){
    const sw=pool.filter(e=>e.row&&e.row.sw&&!e.oor);
    const e=encPickW(sw);
    if(!e){out.none=true;out.why='Nothing here comes in swarms.';return out;}
    const L=encLine(T,e,encRand(3,6),E,true);
    out.lines.push(L);
    return out;
  }
  const visit=e=>{
    const v=encVisitor(T);
    if(!v)return null;
    return {sp:v.sp,n:1,a:0,p:Math.round(e.p*10)/10,bk:'',wl:v.wl,wl2:v.wl2,wr:v.wr,wr2:v.wr2,vi:v};
  };
  if(mode==='horde'){
    const N=o.n||1;
    let got=0,guard=0,alphaDone=false;
    while(got<N&&guard++<60){
      const e=encPickW(pool);
      if(!e)break;
      let L;
      if(e.oor){L=visit(e);if(!L)continue;}
      else{
        const n=Math.min(encGrp(e.row),N-got);
        L=encLine(T,e,n,E,!alphaDone);
        if(L.a)alphaDone=true;
      }
      got+=L.n;
      encMerge(out.lines,L);
    }
    out.n=got;
    return out;
  }
  const e=encPickW(pool);
  if(e.oor){
    const L=visit(e);
    if(!L){out.none=true;out.why='A stranger might have passed through, but nothing the table names.';return out;}
    out.lines.push(L);
    return out;
  }
  out.lines.push(encLine(T,e,encGrp(e.row),E,true));
  return out;
}
/* parsing and writing a modifier's effects as plain lines, for the editor.
   Pikachu +8 · Pikachu =10 · Pikachu x2 · Pikachu > Raichu, Raichu, Pichu · Swinub / Snover -15 (shared) · * -33 (shared by the rest) · * each -2 */
function encFxParse(text){
  const out=[],bad=[];
  String(text||'').split(/\n/).forEach(raw0=>{
    let s=raw0.trim();
    if(!s)return;
    let m;
    if((m=s.match(/^(.+?)\s+>\s+(.+)$/))){
      const src=m[1].split(/\s*\/\s*/).map(x=>x.trim()).filter(Boolean);
      out.push({s:src.length>1?src:src[0],a:'>',to:m[2].split(',').map(x=>x.trim()).filter(Boolean)});
      return;
    }
    m=s.match(/^(.+?)\s*(=|x|\+|-)\s*(\d+(?:\.\d+)?)\s*$/i);
    if(!m){bad.push(s);return;}
    let names=m[1].trim(),each=false;
    if(/^\*\s+each$/i.test(names)){names='*';each=true;}
    const op=m[2].toLowerCase();
    let v=Number(m[3]);
    let a=op==='x'?'x':op==='='?'=':'+';
    if(op==='-')v=-v;
    const list=names.split(/\s*\/\s*/).map(x=>x.trim()).filter(Boolean);
    const f={s:list.length>1?list:list[0],a,v};
    if(list.length>1&&a==='+')f.cb=1;
    if(each)f.each=1;
    out.push(f);
  });
  return {fx:out,bad};
}
function encFxText(fx){
  return (fx||[]).map(f=>{
    const nm=Array.isArray(f.s)?f.s.join(' / '):f.s;
    if(f.a==='>')return nm+' > '+(f.to||[]).join(', ');
    if(f.a==='=')return nm+' ='+f.v;
    if(f.a==='x')return nm+' x'+f.v;
    return (f.s==='*'&&f.each?'* each':nm)+' '+(num(f.v)<0?'-':'+')+Math.abs(num(f.v));
  }).join('\n');
}
/* bringing the wishes of a newer file into a table the GM already has. Only wishes move: a wished Pokémon is added if the table lacks it,
   and the wish and its reason are set where the GM has none. Weights, notes and everything else the GM set are left alone. */
const ENC_WISHKEYS=['wl','wl2','wr','wr2'];
const encWished=r=>!!r&&(num(r.wl)>0||num(r.wl2)>0);
function encMergeList(curList,incList,add){
  const out=(Array.isArray(curList)?curList:[]).map(r=>Object.assign({},r));
  let added=0,marked=0,cleared=0;
  (Array.isArray(incList)?incList:[]).forEach(n=>{
    if(!n||!String(n.sp||'').trim())return;
    const o=out.find(r=>encKey(r.sp)===encKey(n.sp));
    if(o){
      /* the file is the list: a mark or reason on a row takes the file's value, and goes when the file no longer has it */
      ENC_WISHKEYS.forEach(f=>{
        const nv=n[f],ov=o[f],nh=!(nv===undefined||nv===null||nv===''||nv===0),oh=!(ov===undefined||ov===null||ov===''||ov===0);
        if(nh&&(!oh||ov!==nv)){o[f]=nv;if(f==='wl'||f==='wl2')marked++;}
        else if(!nh&&oh){delete o[f];if(f==='wl'||f==='wl2')cleared++;}
      });
    }else if(add&&encWished(n)&&out.length<ENC_MAX){
      out.push(Object.assign({},n));added++;
      marked+=(num(n.wl)>0?1:0)+(num(n.wl2)>0?1:0);
    }
  });
  return {list:out,added,marked,cleared};
}
/* returns {patch, added, marked, changed}; patch holds only the fields that changed, ready for a merge-write */
function encMergeDoc(cur,inc,names){
  cur=cur||{};inc=inc||{};names=names||{};
  const patch={};let added=0,marked=0,cleared=0;
  const m=encMergeList(cur.enc,inc.enc,true);
  const v=Array.isArray(cur.ev)?encMergeList(cur.ev,inc.ev,false):null;
  if(m.added||m.marked||m.cleared||(v&&(v.marked||v.cleared))){
    patch.enc=m.list;added+=m.added;marked+=m.marked;cleared+=m.cleared;
    if(v&&(v.marked||v.cleared)){patch.ev=v.list;marked+=v.marked;cleared+=v.cleared;}
  }
  if(Array.isArray(cur.ex)&&Array.isArray(inc.ex)){
    let hit=false;
    const ex=cur.ex.map(e=>{
      const n=inc.ex.find(x=>x&&e&&x.nm===e.nm);
      if(!n||!e)return e;
      const a=encMergeList(e.enc,n.enc,true),b=Array.isArray(e.ev)?encMergeList(e.ev,n.ev,false):null;
      if(!(a.added||a.marked||a.cleared||(b&&(b.marked||b.cleared))))return e;
      hit=true;added+=a.added;marked+=a.marked+(b?b.marked:0);cleared+=a.cleared+(b?b.cleared:0);
      return Object.assign({},e,{enc:a.list},b&&(b.marked||b.cleared)?{ev:b.list}:{});
    });
    if(hit)patch.ex=ex;
  }
  const touched=Object.keys(patch).length>0;
  if(touched||added||marked||cleared){
    if(names.wln&&!cur.wln)patch.wln=String(names.wln);
    if(names.wln2&&!cur.wln2)patch.wln2=String(names.wln2);
  }
  return {patch,added,marked,cleared,changed:touched};
}
/* =========================== end of the odds =========================== */

const encGp=pid=>S.gmPl[pid]||{};
/* a place's tables: the main one, then any extra ones (a landmark inside the same page) */
function encTabs(pid){
  const g=encGp(pid);
  const out=[{k:0,nm:'',pre:'',T:g}];
  (Array.isArray(g.ex)?g.ex:[]).forEach((e,i)=>out.push({k:i+1,nm:(e&&e.nm)||'Another table',pre:'ex.'+i+'.',T:e||{}}));
  return out;
}
const encTab=(pid,k)=>{const t=encTabs(pid);return t[k!=null&&t[k]?k:(S.ui.enc.tb[pid]||0)]||t[0];};
const encRows=T=>Array.isArray(T.enc)?T.enc:[];
const encOk=x=>!!(x&&String(x.sp||'').trim()&&num(x.w)>0);
const encValid=pid=>encRows(encGp(pid)).filter(encOk);
const encTotal=rows=>rows.reduce((a,x)=>a+num(x.w),0);
/* the places with something to roll, each table as its own entry */
function encPlaces(){
  const out=[];
  Object.keys(S.gmPl||{}).forEach(id=>{
    const f=PD_BY[id];
    if(!f)return;
    encTabs(id).forEach(t=>{if(encRows(t.T).some(encOk))out.push({v:id+(t.k?'#'+t.k:''),id,k:t.k,name:f.name+(t.k?' · '+t.nm:'')});});
  });
  return out.sort(natural);
}
const encRef=v=>{const p=String(v||'').split('#');return {id:p[0],k:p[1]?+p[1]:0};};
const encZ=(pid,k)=>{const key=pid+'|'+k;return S.ui.enc.z[key]||(S.ui.enc.z[key]={});};
const encPlayers=()=>clamp(Math.round(num(S.ui.enc.np))||tids().length||1,1,8);
const encDiffNow=T=>{const d=S.ui.enc.df;return ENC_DIFF.some(x=>x[0]===d)?d:encDiffOf(T);};

function encRollRef(pid,k,mode,fid){
  const t=encTab(pid,k);
  const T=t.T;
  const o={mode,fid};
  if(mode==='horde')o.n=encHordeN(encDiffNow(T),encPlayers());
  const r=encRollT(T,cdGet(),encZ(pid,t.k),o);
  r.pid=pid;r.k=t.k;r.cond=cdText();
  if(mode==='horde'){r.diff=encDiffNow(T);r.players=encPlayers();r.want=o.n;}
  return r;
}

/* ----- adding what turned up to the battle ----- */
const encKindWord={enc:'encounter',horde:'horde',swarm:'swarm',fish:'catch'};
async function encToBattle(pid,res){
  if(!S.me.admin||!res||res.none)return;
  const f=PD_BY[pid];
  const where=(f?f.name:'a place')+(res.k?' · '+encTab(pid,res.k).nm:'');
  for(const L of res.lines){
    const note='Wild '+(encKindWord[res.kind]||'encounter')+' at '+where+(L.vi?' (visitor'+(L.vi.o?' from '+L.vi.o:'')+')':'')+(L.a?' · ALPHA':'');
    if(L.n-L.a>0)await btAddFoeSp(L.sp,L.n-L.a,'',note);
    if(L.a)await btAddFoeSp(L.sp,1,'',note,{alpha:true});
  }
  render();
}

/* ----- the panel on a place's page ----- */
const encMd=s=>raw(esc(s).replace(/\*\*(.+?)\*\*/g,'<b>$1</b>'));
const encBk=bk=>ENC_BK[bk]?h`<span class="pill encbk" title="Rarity in the PTA books (GM only)">${ENC_BK[bk][0]} ${ENC_BK[bk][1]}</span>`:'';
const encWlText=(gp,w,i)=>{const k=ENC_WISH[i||0];const who=(gp&&gp[k.n])||k.d;return w===3?who+' wants an alpha':w===2?who+' really wants this':who+' is interested';};
/* the wish pills for a row, a visitor or a result line; with the reasons if asked */
const encWishPills=(gp,o,why)=>encWishOf(o,gp).map(x=>h` <span class="pill encwl w${x.lv} p${x.i+1}" ${why||!x.why?'':raw('title="'+esc(x.why)+'"')}>${encWlText(gp,x.lv,x.i)}</span>${why&&x.why?h` <span class="sub">${x.why}</span>`:''}`);
function encNeeds(w){
  if(!w)return '';
  const bits=[];
  ['t','x','s','m','d','f'].forEach(k=>{
    const a=w[k];
    if(!Array.isArray(a)||!a.length)return;
    bits.push(a.map(v=>k==='f'?(v==='on'?'Festival week':'Not festival week'):(CD_LAB[v]||v)).join(' or '));
  });
  return bits.join(' + ');
}
function encResult(pid,r){
  const f=PD_BY[pid],gp=encGp(pid);
  if(r.none)return h`<div class="ctres encres" role="status" aria-live="polite"><span class="k">NOTHING</span><div class="big">Nothing turns up</div><div class="sub">${r.why}</div><div class="sub">${r.cond}</div>
    <div class="row"><button class="btn sm" data-act="en_roll" data-id="${pid}" data-k="${r.k}" data-m="${r.kind}" data-f="${r.fid||''}">Roll again</button></div></div>`;
  const lead=r.lines[0];
  const title=r.lines.map(L=>(L.a?'Alpha ':'')+L.sp+(L.n>1?' ×'+L.n:'')).join(', ');
  const diff=r.kind==='horde'?ENC_DIFF.find(x=>x[0]===r.diff):null;
  return h`<div class="ctres encres" role="status" aria-live="polite"><span class="k">${(encKindWord[r.kind]||'encounter').toUpperCase()}${r.fishLb?' · '+r.fishLb.toUpperCase():''}</span>
    <div class="big">${title}</div>
    ${r.lines.map(L=>h`<div class="encline">${L.a?h`<span class="pill encal">ALPHA</span> `:''}<b>${L.sp}</b>${L.n>1?' ×'+L.n:''}
      ${L.vi?h`<span class="sub">Out-of-region visitor${L.vi.o?' from '+L.vi.o:''} (d${L.vi.die} → ${L.vi.roll}). ${L.vi.y}</span>${encWishPills(gp,L,true)}`
        :h`<span class="sub">${encPct(L.p)}% here · ${encLocal(L.p)}</span> ${encBk(L.bk)}${L.so?h` <span class="pill">herd or pack</span>`:''}${encWishPills(gp,L,true)}`}</div>`)}
    ${r.kind==='horde'?h`<div class="sub">A horde for ${r.players} ${r.players===1?'player':'players'} on ${diff?diff[1]:'Normal'}: ${diff?diff[3]:''} (${r.want} wanted${r.n!==r.want?', '+r.n+' rolled':''}).</div>`:''}
    ${r.kind==='swarm'?h`<div class="sub">A swarm of one kind. 3–6 of them.</div>`:''}
    <div class="sub">${r.cond}${r.E&&r.E.only?' · '+r.E.only:''}</div>
    ${lead&&lead.a?h`<div class="sub">Alpha: HP doubled, +5 Attack and Special Attack, the better defense raised to 15, and the Alpha Aura moves are added when it joins the battle. It can lead the others.</div>`:''}
    <div class="row"><button class="btn primary sm" data-act="en_tobattle" data-id="${pid}">Add to the battle</button>
      <button class="btn sm" data-act="en_roll" data-id="${pid}" data-k="${r.k}" data-m="${r.kind}" data-f="${r.fid||''}">Roll again</button>
      ${lead&&!lead.vi?h`<button class="btn sm ghost" data-act="en_alpha" data-id="${pid}">${lead.a?'Make it a normal one':'Make one an alpha'}</button>`:''}</div></div>`;
}
function encRowView(gp,e,sorted){
  const r=e.row||{};
  const bk=r.bk||e.bk||'';
  return h`<li class="encr ${e.p<=0?'zero':''}">
    <span class="encn"><b>${e.sp}</b>${r.so?h` <span class="pill">herd or pack</span>`:''}${r.sw?h` <span class="pill">swarms</span>`:''}${num(r.al)>0?h` <span class="pill encal" title="Chance that a group of these has an alpha">alpha ${num(r.al)}%</span>`:''}${encWishPills(gp,r)}</span>
    <span class="encp" style="--p:${Math.min(100,Math.round(e.p))}%"><b>${encPct(e.p)}%</b> now${Math.abs(e.p-e.bp)>=0.5?h` <small>(${encPct(e.bp)}% usually)</small>`:''}</span>
    <span class="encl">${encLocal(e.p)}</span>
    ${encBk(bk)}
    <span class="sub encg">${num(r.lo)||1}${num(r.hi)>num(r.lo)?'–'+num(r.hi):''} at a time${r.n?' · '+r.n:''}</span>
  </li>`;
}
function encEditRow(pid,pre,gp,T,x,i,len){
  const p=pre+'enc.'+i+'.';
  return h`<div class="encrow ${String(x.sp||'').trim()?'':'off'}">
    ${fText('Pokémon','gp',pid,p+'sp',gp,{list:'dl-species',cls:'c-sp'})}
    ${fNum('Weight','gp',pid,p+'w',gp,{min:0,max:1000})}
    ${fNum('Min','gp',pid,p+'lo',gp,{min:1,max:8})}
    ${fNum('Max','gp',pid,p+'hi',gp,{min:1,max:8})}
    ${fNum('Alpha %','gp',pid,p+'al',gp,{min:0,max:100})}
    ${fSel('Book rarity','gp',pid,p+'bk',gp,[['C','● Common'],['U','◆ Uncommon'],['R','★ Rare']],{blank:'Not set'})}
    ${fSel(gp.wln2?'Wanted by '+(gp.wln||'player 1'):'Wanted','gp',pid,p+'wl',gp,ENC_LEVELS,{blank:'No'})}
    ${fSel('Wanted by '+(gp.wln2||'player 2'),'gp',pid,p+'wl2',gp,ENC_LEVELS,{blank:'No'})}
    ${num(x.wl)>0?fText('Why '+(gp.wln||'player 1')+' wants it','gp',pid,p+'wr',gp,{cls:'c-nt'}):''}${num(x.wl2)>0?fText('Why '+(gp.wln2||'player 2')+' wants it','gp',pid,p+'wr2',gp,{cls:'c-nt'}):''}
    <div class="fld"><span class="fl">Groups</span><span class="row">${fCheck('Herd','gp',pid,p+'so',gp)}${fCheck('Swarm','gp',pid,p+'sw',gp)}</span></div>
    ${fText('Note','gp',pid,p+'n',gp,{cls:'c-nt'})}
    ${rowBtns('gp',pid,pre+'enc',i,len,false)}</div>`;
}
function encModEditor(pid,pre,gp,T,m,i,len){
  const p=pre+'em.'+i+'.';
  const w=m.w||{};
  const groups=[['t','Time',CD_T],['x','Weather',CD_X],['s','Season',CD_S],['m','Moon',CD_M],['d','Tide',CD_D],['f','Festival',[['on','Festival week'],['off','Not festival week']]]];
  const key=pid+'|'+pre+'|'+i;
  const open=!!S.ui.enc.mo[key];
  const head=h`<button class="encsum" data-act="en_mo" data-key="${key}" aria-expanded="${String(open)}"><b>${m.lb||'New situation'}</b> <span class="sub">${m.z?'switched on by hand':'automatic'}${encNeeds(m.w)?' · '+encNeeds(m.w):''}</span></button>`;
  if(!open)return h`<div class="encmod">${head}</div>`;
  return h`<div class="encmod">${head}
    <div class="fgrid">${fText('Name','gp',pid,p+'lb',gp,{})}${fCheck('Switch on by hand (a situation, like a zone)','gp',pid,p+'z',gp)}
      ${fNum('Encounter rate ×','gp',pid,p+'rt',gp,{min:0,max:1})}</div>
    ${groups.map(g=>h`<div class="fld"><span class="fl">${g[1]}</span><div class="row evchips">${g[2].map(op=>h`<button class="chip enchip" data-act="en_wh" data-id="${pid}" data-pre="${pre}" data-i="${i}" data-w="${g[0]}" data-v="${op[0]}" aria-pressed="${String((w[g[0]]||[]).indexOf(op[0])>=0)}">${op[1]}</button>`)}</div></div>`)}
    <p class="sub">Leave a group empty to match anything. Everything named must match at once.</p>
    <label class="fld"><span class="fl">What it changes (one per line)</span><textarea data-encfx="${esc(pid+'|'+pre+'|'+i)}" rows="4" data-nr>${raw('\n')}${encFxText(m.fx)}</textarea></label>
    <p class="sub">Examples: <code>Pikachu +8</code> · <code>Pikachu =10</code> · <code>Pikachu x2</code> · <code>Pikachu &gt; Raichu, Pichu</code> (becomes) · <code>Swinub / Snover -15</code> (shared) · <code>* -10</code> (shared by the rest) · <code>* each -2</code>.</p>
    <label class="fld"><span class="fl">Taking from (species names, comma separated)</span><input type="text" data-encl="${esc(pid+'|'+pre+'|'+i+'|tk')}" value="${(m.tk||[]).join(', ')}" data-nr></label>
    ${fArea('Note for you','gp',pid,p+'tx',gp,{rows:2})}
    ${(m.fish||m.only)?h`<p class="sub">This one also carries a fixed list of ${m.only?'what lives there':'what bites'} that came with the encounter data.</p>`:''}
    <div class="row"><button class="btn sm danger" data-act="del" ${bp('gp',pid,pre+'em')} data-i="${i}">Delete this</button>${rowBtns('gp',pid,pre+'em',i,len,false)}</div>
  </div>`;
}
function encPanel(f){
  const pid=f.id,gp=encGp(pid);
  const tabs=encTabs(pid);
  const t=encTab(pid);
  const T=t.T,pre=t.pre;
  const rows=encRows(T);
  const c=cdGet();
  const z=encZ(pid,t.k);
  const E=encEff(T,c,z);
  const res=S.ui.enc.res[pid];
  const ed=!!S.ui.enc.ed[pid];
  const mods=Array.isArray(T.em)?T.em:[];
  const chips=mods.filter(m=>m.z);
  const autos=mods.filter(m=>!m.z);
  const autoOn=autos.filter(m=>encWhenOk(m.w,c));
  const autoOff=autos.filter(m=>!encWhenOk(m.w,c));
  const shown=E.W.filter(e=>e.sp&&(e.w>0||e.b>0)&&!e.oor).sort((a,b)=>b.p-a.p||b.bp-a.bp);
  const oor=E.W.find(e=>e.oor);
  const diff=encDiffNow(T);
  const dd=ENC_DIFF.find(x=>x[0]===diff)||ENC_DIFF[1];
  const hasSw=E.W.some(e=>e.w>0&&e.row&&e.row.sw&&!e.oor);
  const used=!!T.eoUsed;
  return h`<section class="panel encp"><div class="ph"><h2>Wild encounters</h2><span class="pill gm">GM only</span>
      <span class="pill" title="How dangerous this place is. It sets the size of a horde.">Danger ${Math.round(num(T.dg))||1} · ${ENC_DIFF.find(x=>x[0]===encDiffOf(T))[1]}</span>
      ${T.dr?h`<span class="pill status">Draft: check it</span>`:''}
      <div class="acts"><button class="btn sm ${ed?'primary':''}" data-act="en_edit" data-id="${pid}" aria-pressed="${String(ed)}">${ed?'Done editing':'Edit table'}</button></div></div>
    ${tabs.length>1?h`<div class="seg" role="group" aria-label="Table">${tabs.map(x=>h`<button data-act="en_tab" data-id="${pid}" data-k="${x.k}" aria-pressed="${String(x.k===t.k)}">${x.k?x.nm:f.name}</button>`)}</div>`:''}
    ${T.dr?h`<p class="sub bad">This table was drafted from the nearest places${Array.isArray(T.nb)&&T.nb.length?' ('+T.nb.join(', ')+')':''} because the notes had no list for it. Read it over and change what does not fit.</p>`:''}
    <p class="sub encnow"><b>Right now:</b> ${cdText()}. The chances below use the conditions on the Today bar${chips.length?' and the situations you switch on':''}.</p>
    ${chips.length?h`<div class="fld"><span class="fl">Situations here</span><div class="row evchips">${chips.map(m=>{
      const on=!!z[m.id],ok=encWhenOk(m.w,c);
      return h`<button class="chip enchip" data-act="en_zone" data-id="${pid}" data-k="${t.k}" data-m="${m.id}" aria-pressed="${String(on)}" title="${m.tx||''}">${m.lb}${on&&!ok?h` <small>(waits for ${encNeeds(m.w)})</small>`:(!on&&encNeeds(m.w)?h` <small>(${encNeeds(m.w)})</small>`:'')}</button>`;})}</div></div>`:''}
    ${E.act.length?h`<div class="encfx"><span class="fl">In effect now</span><ul class="mini-list">${E.act.map(m=>h`<li><b>${m.lb}</b>${m.tx?h` <span class="sub">${encMd(m.tx)}</span>`:''}${m.nt?h` <span class="sub">${m.nt}</span>`:''}</li>`)}</ul>
      ${E.rt<1?h`<p class="sub">Encounter rate ${E.rt<=0?'none':'×'+Math.round(E.rt*100)/100}.</p>`:''}${E.nn?h`<p class="sub">On a d6 of ${E.nn[0]}–${E.nn[1]}, nothing happens.</p>`:''}</div>`:''}
    ${autoOff.length?h`<details class="encoff"><summary>${autoOff.length} other ${autoOff.length===1?'condition':'conditions'} change this table</summary><ul class="mini-list">${autoOff.map(m=>h`<li><b>${m.lb}</b> <span class="sub">needs ${encNeeds(m.w)||'a switch'}${m.tx?' · '+m.tx.replace(/\*\*/g,''):''}</span></li>`)}</ul></details>`:''}
    ${shown.length?h`<ul class="enclist2" aria-label="What can turn up now">${shown.map(e=>encRowView(gp,e))}</ul>`:h`<p class="sub">Nothing here yet. Add the Pokémon that live in this place.</p>`}
    ${oor&&oor.w>0?h`<p class="sub">${encPct(oor.p)}% of the time it is a visitor from another region. Roll ${T.evd==='d8'?'d8':'d6'} on the visitor list (${(T.ev||[]).length} listed).</p>`:''}
    ${(Array.isArray(T.ev)&&T.ev.length)?h`<details class="encoff"><summary>Visitors from other regions</summary><ol class="mini-list">${T.ev.map(v=>h`<li><b>${v.sp}</b> <span class="sub">${v.o?'('+v.o+') ':''}${v.y||''}</span>${encWishPills(gp,v,true)}</li>`)}</ol></details>`:''}
    ${T.eon?h`<div class="mgd encone"><b>Once per campaign</b> ${used?h`<span class="pill">Used</span>`:''}<p class="sub">${encMd(T.eon)}</p><div class="row"><button class="btn sm" data-act="en_used" data-id="${pid}" data-k="${t.k}">${used?'Mark as not used':'Mark as used'}</button></div></div>`:''}
    <div class="fgrid encroll">
      <label class="fld"><span class="fl">Players</span><input type="number" min="1" max="8" data-u="enc.np" value="${S.ui.enc.np===''?'':encPlayers()}" placeholder="${tids().length||1}" data-nr></label>
      <label class="fld"><span class="fl">Horde difficulty</span><select data-u="enc.df"><option value="" ${S.ui.enc.df?'':raw('selected')}>From Danger (${ENC_DIFF.find(x=>x[0]===encDiffOf(T))[1]})</option>${ENC_DIFF.map(x=>h`<option value="${x[0]}" ${S.ui.enc.df===x[0]?raw('selected'):''}>${x[1]}</option>`)}</select></label>
    </div>
    <p class="sub">A horde for ${encPlayers()} ${encPlayers()===1?'player':'players'} on ${dd[1]} is ${dd[2][0]*encPlayers()}–${Math.min(ENC_HORDE_MAX,dd[2][1]*encPlayers())} wild Pokémon (${dd[3]}).</p>
    <div class="row"><button class="btn primary sm" data-act="en_roll" data-id="${pid}" data-k="${t.k}" data-m="enc" ${shown.length?'':raw('disabled')}>Roll an encounter</button>
      <button class="btn sm" data-act="en_roll" data-id="${pid}" data-k="${t.k}" data-m="horde" ${shown.length?'':raw('disabled')}>Roll a horde</button>
      <button class="btn sm" data-act="en_roll" data-id="${pid}" data-k="${t.k}" data-m="swarm" ${hasSw?'':raw('disabled')}>Roll a swarm</button>
      ${E.fish.map(fm=>h`<button class="btn sm" data-act="en_roll" data-id="${pid}" data-k="${t.k}" data-m="fish" data-f="${fm.id}">Cast a line · ${fm.lb}</button>`)}</div>
    ${res?encResult(pid,res):''}
    ${ed?h`<div class="enced"><h3>Edit this table</h3>
      <p class="sub">A weight of 30 out of a total of about 100 is a 30% chance. A weight of 0 means it only turns up when a condition adds it. Min and Max say how many come at once. Alpha % is the chance that a group has an alpha. The players never see any of this.</p>
      <div class="fgrid">${fNum('Danger (1–5)','gp',pid,pre+'dg',gp,{min:1,max:5})}${fNum('Visitor weight','gp',pid,pre+'eo',gp,{min:0,max:100})}
        <label class="fld"><span class="fl">Visitor die</span><select ${bd('gp',pid,pre+'evd')}>${[['d6','d6'],['d8','d8']].map(o=>h`<option value="${o[0]}" ${T.evd===o[0]?raw('selected'):''}>${o[1]}</option>`)}</select></label>
        ${pre===''?fText('Name for the player you track','gp',pid,'wln',gp,{ph:'e.g. Implala'}):''}
        ${pre===''?fText('Name for a second player','gp',pid,'wln2',gp,{ph:'e.g. the second character'}):''}</div>
      ${rows.length?h`<div class="enclist">${rows.map((x,i)=>encEditRow(pid,pre,gp,T,x,i,rows.length))}</div>`:h`<p class="sub">No rows yet.</p>`}
      <div class="row"><button class="btn sm" data-act="en_new" data-id="${pid}" data-k="${t.k}" ${rows.length>=ENC_MAX?raw('disabled'):''}>Add a Pokémon</button>
        <span class="sub">${rows.length} of ${ENC_MAX}</span></div>
      <h3>Conditions and situations</h3>
      ${mods.map((m,i)=>encModEditor(pid,pre,gp,T,m,i,mods.length))}
      <div class="row"><button class="btn sm" data-act="en_mnew" data-id="${pid}" data-k="${t.k}">Add a condition</button></div>
    </div>`:''}
    ${fArea('Notes for this table','gp',pid,pre+'encNote',gp,{rows:2,ph:'e.g. Only in tall grass. Roll once every ten minutes.'})}
  </section>`;
}

/* ----- the box on the Battle page ----- */
function encBattlePanel(){
  const pl=encPlaces();
  const e=S.ui.enc;
  if(!pl.length)return h`<div class="mgd"><b>Wild encounter</b><p class="sub">Roll from a place's table of Pokémon and add what turns up as foes. Import the encounter data in GM Desk, or make a table from a place's page on the Map (GM only).</p></div>`;
  const cur=pl.some(p=>p.v===e.pick)?e.pick:pl[0].v;
  return h`<div class="mgd"><b>Wild encounter</b>
    <p class="sub">Roll from a place's table and add what turns up as foes. The odds follow the Today bar (${cdText()}). They start hidden, like any foe.</p>
    <div class="fgrid"><label class="fld"><span class="fl">Where</span><select data-u="enc.pick">${pl.map(p=>h`<option value="${p.v}" ${p.v===cur?raw('selected'):''}>${p.name}</option>`)}</select></label></div>
    <div class="row"><button class="btn primary sm" data-act="en_rollbattle" data-v="${cur}" data-m="enc">Roll and add</button>
      <button class="btn sm" data-act="en_rollbattle" data-v="${cur}" data-m="horde">Horde</button>
      <button class="btn sm" data-act="en_rollbattle" data-v="${cur}" data-m="swarm">Swarm</button></div></div>`;
}

/* ----- GM Desk: import and export ----- */
/* who wants what, and where it turns up: one list per tracked player, from each table's usual chances */
function encWishIndex(){
  const c={t:'day',x:'clear',s:'spring',m:'waxing',d:'high',f:false};
  const res=ENC_WISH.map(()=>({}));
  encPlaces().forEach(pl=>{
    const t=encTab(pl.id,pl.k);
    const E=encEff(t.T,c,{});
    E.W.filter(e=>!e.oor&&e.b>0).forEach(e=>{
      const r=e.row||{};
      ENC_WISH.forEach((w,i)=>{
        const lv=num(r[w.l]);
        if(lv<=0)return;
        const o=res[i][e.sp]||(res[i][e.sp]={sp:e.sp,lv:0,why:'',places:[]});
        o.lv=Math.max(o.lv,lv);
        if(!o.why&&r[w.r])o.why=String(r[w.r]);
        o.places.push({name:pl.name,p:e.bp});
      });
    });
  });
  return res.map(m=>Object.keys(m).map(k=>m[k]).sort((a,b)=>a.sp<b.sp?-1:a.sp>b.sp?1:0));
}
const encWishName=i=>Object.keys(S.gmPl||{}).map(id=>(S.gmPl[id]||{})[ENC_WISH[i].n]).find(x=>x)||'';
function encWishList(x){
  const gp={};
  gp[ENC_WISH[x.i].n]=x.name;
  return h`<ul class="mini-list encwish" aria-label="${x.name||ENC_WISH[x.i].d}: wished Pokémon">${x.list.map(o=>{
    const ps=o.places.slice().sort((a,b)=>b.p-a.p);
    return h`<li><b>${o.sp}</b>${o.lv>1?h` <span class="pill encwl w${o.lv} p${x.i+1}">${encWlText(gp,o.lv,x.i)}</span>`:''} <span class="sub">${o.why?o.why+' · ':''}${ps.slice(0,4).map(p=>p.name+' '+encPct(p.p)+'%').join(', ')}${ps.length>4?' and '+(ps.length-4)+' more':''}</span></li>`;})}</ul>`;
}
function encDesk(){
  const im=S.ui.enc.imp||{};
  const have=Object.keys(S.gmPl||{}).filter(id=>PD_BY[id]&&encRows(encGp(id)).length).length;
  const wo=S.ui.enc.wo||{};
  const idx=have?encWishIndex():null;
  const wishes=idx?ENC_WISH.map((w,i)=>idx[i].length?{i,name:encWishName(i),list:idx[i]}:null).filter(Boolean):[];
  const mode=im.mode==='replace'?'replace':im.mode==='wish'?'wish':'add';
  return h`<section class="panel"><div class="ph"><h2>Encounter data</h2><span class="pill gm">GM only</span>
      <div class="acts"><button class="btn sm" data-act="en_pick" ${im.busy?raw('disabled'):''}>Import encounter data</button>
        <button class="btn sm ghost" data-act="en_exp" ${S.dl&&have?'':raw('disabled')}>Download tables</button>
        <button class="btn sm ghost" data-act="en_csv" ${S.dl&&have?'':raw('disabled')}>Rarity sheet (CSV)</button></div></div>
    <p class="sub">${have?have+' places have a table of wild Pokémon.':'No places have a table yet.'} Choose <b>sinnoh-encounter-data.json</b> from the update download. Every place gets its Pokémon with their chances, the PTA book rarity, hordes, swarms, alphas, and how the chances shift with time of day, weather, season, moon, tide and festival week. The tables go into your private GM notes, not into the public site.</p>
    <div class="row evchips" role="group" aria-label="When a place already has a table"><button class="chip enchip" data-act="en_mode" data-v="add" aria-pressed="${String(mode==='add')}">Only places without a table</button><button class="chip enchip" data-act="en_mode" data-v="wish" aria-pressed="${String(mode==='wish')}">Update wishes in existing tables</button><button class="chip enchip" data-act="en_mode" data-v="replace" aria-pressed="${String(mode==='replace')}">Replace every table</button></div>
    <p class="sub">${mode==='replace'?'Every place in the file gets the new table. Tables you wrote yourself are overwritten. Your GM notes on each place are kept.':mode==='wish'?'Use this after an update that changes a wish list. A place with a table gets the wished Pokémon it lacks, and its wish marks and reasons are brought in line with the file (a wish the file no longer has is removed); the chances, notes and conditions you set are left alone. Places without a table get the whole table. Your GM notes are always kept.':'Places where you already wrote a table keep it. Your GM notes are always kept.'}</p>
    ${im.busy?h`<progress class="ptaprog" max="${num(im.total)}" value="${num(im.done)}" aria-label="Import progress"></progress>`:''}
    ${im.msg?h`<p class="sub ${im.bad?'bad':''}" role="status">${im.msg}</p>`:''}
    <div class="mgd"><b>Semi-route and off-route tables</b>
      <p class="sub">Each wild route gets a "Semi-route" and, where the land is still wild, an "Off-route" table beside its main one: stronger, warier Pokémon drawn from the route's terrain (forest, coast, marsh, mountain, cave, snow and so on). Your main tables are not touched. Roll them from the route's page like any other table.</p>
      <div class="row">${znMissing()?h`<button class="btn sm" data-act="zn_load">Add ${znMissing()} zone tables</button>`:h`<span class="sub">Every route has its zone tables.</span>`}</div></div>
    <div class="mgd"><b>Fishing</b>
      <p class="sub">Every town, landmark and route with water (${Object.keys(FS_PLACES).length} places) gets a <b>Cast a line</b> button on its main table, with a catch list for its kind of water: sea, lake, river, stream, marsh, pond, hot springs, ice hole or cave pool. A place that already has a fishing option is left alone, and you can edit any list afterwards under Conditions and situations. The place pages tell the players where fishing is possible.</p>
      <div class="row">${fsMissingIds().length?h`<button class="btn sm" data-act="fs_load">Add fishing to ${fsMissingIds().length} places</button>`:h`<span class="sub">Every place with water has fishing.</span>`}</div></div>
    ${wishes.length?h`<div class="encwishes"><h3>Wished Pokémon</h3><p class="sub">Where each Pokémon a player wants turns up, with its usual chance there.</p>
      ${wishes.map(x=>h`<div class="fld"><button class="btn sm ${wo[x.i]?'primary':''}" data-act="en_wo" data-i="${x.i}" aria-expanded="${String(!!wo[x.i])}">${x.name||ENC_WISH[x.i].d} · ${x.list.length} Pokémon</button>${wo[x.i]?encWishList(x):''}</div>`)}</div>`:''}
  </section>`;
}
/* what goes into a place's GM document */
function encDocOf(p,wln,wln2){
  const o={};
  ['dg','enc','em','ev','evd','eo','eon','dr','nb','nm','ex'].forEach(k=>{if(p[k]!==undefined)o[k]=p[k];});
  if(!p.dr)o.dr=false;
  o.eoUsed=false;
  if(wln)o.wln=String(wln);
  if(wln2)o.wln2=String(wln2);
  o.ei=Date.now();
  return o;
}
async function encImport(file){
  const im=S.ui.enc.imp=S.ui.enc.imp||{mode:'add'};
  const say=(msg,bad)=>{im.msg=msg;im.bad=!!bad;im.busy=false;scheduleRender();};
  let d=null;
  try{d=JSON.parse(await file.text());}catch(e){}
  if(!d||d.format!=='sinnoh-encounters'||!d.places||typeof d.places!=='object'){say('That is not the encounter data file. Use sinnoh-encounter-data.json from the update download.',true);return;}
  const mode=im.mode==='replace'?'replace':im.mode==='wish'?'wish':'add';
  const names={wln:d.wln,wln2:d.wln2};
  const ids=Object.keys(d.places).filter(id=>PD_BY[id]&&d.places[id]&&Array.isArray(d.places[id].enc));
  /* what would be written: {id, doc, fresh|added|marked} */
  const plan=[];
  let skipped=0;
  ids.forEach(id=>{
    const has=encRows(encGp(id)).length>0;
    if(mode==='replace'||!has){plan.push({id,doc:encDocOf(d.places[id],d.wln,d.wln2),fresh:1});return;}
    if(mode==='wish'){
      const m=encMergeDoc(encGp(id),d.places[id],names);
      if(m.changed)plan.push({id,doc:Object.assign(m.patch,{ei:Date.now()}),added:m.added,marked:m.marked,cleared:m.cleared});
      else skipped++;
      return;
    }
    skipped++;
  });
  if(!plan.length){
    if(mode==='wish'){say('Nothing to change. Your tables already match every Pokémon and wish in this file.',false);return;}
    const more=ids.some(id=>encRows(encGp(id)).length&&encMergeDoc(encGp(id),d.places[id],names).changed);
    say('Nothing to import. All '+ids.length+' places already have a table.'+(more?' This file does carry wished Pokémon your tables do not have yet: choose “Update wishes in existing tables” and import again.':' Choose “Replace every table” to overwrite them.'),!more);
    return;
  }
  im.busy=true;im.done=0;im.total=plan.length;im.msg='Importing…';im.bad=false;scheduleRender();
  try{
    let batch=S.db.batch(),n=0;
    for(const x of plan){
      batch.set(S.db.collection('gm').doc('place_'+x.id),x.doc,{merge:true});
      n++;
      if(n>=15){await batch.commit();im.done+=n;n=0;batch=S.db.batch();scheduleRender();}
    }
    if(n){await batch.commit();im.done+=n;}
  }catch(e){say('The import stopped ('+((e&&e.code)||'error')+'). Some of it may be saved. Run it again to finish.',true);return;}
  if(mode==='wish'){
    const fresh=plan.filter(x=>x.fresh).length,upd=plan.length-fresh;
    const add=plan.reduce((a,x)=>a+(x.added||0),0),mk=plan.reduce((a,x)=>a+(x.marked||0),0),cl=plan.reduce((a,x)=>a+(x.cleared||0),0);
    say('Updated '+upd+' places: added '+add+' Pokémon and marked '+mk+' wishes'+(cl?' and removed '+cl:'')+(fresh?'; imported '+fresh+' new tables':'')+'. Weights and notes you wrote were left alone.',false);
    return;
  }
  say('Imported tables for '+plan.length+' places'+(skipped?'; kept '+skipped+' that already had one':'')+'.',false);
}
function encExport(){
  if(!S.dl)return;
  const places={};
  Object.keys(S.gmPl||{}).forEach(id=>{
    const g=S.gmPl[id];
    if(!PD_BY[id]||!encRows(g).length)return;
    const o={};
    ['dg','enc','em','ev','evd','eo','eon','dr','nb','nm','ex'].forEach(k=>{if(g[k]!==undefined)o[k]=g[k];});
    places[id]=o;
  });
  const wln=Object.keys(S.gmPl).map(id=>S.gmPl[id].wln).find(x=>x)||'';
  const wln2=Object.keys(S.gmPl).map(id=>S.gmPl[id].wln2).find(x=>x)||'';
  return S.dl.save({filename:'sinnoh-encounter-data.json',data:JSON.stringify(Object.assign({format:'sinnoh-encounters',v:3,wln},wln2?{wln2}:{},{places}))}).catch(e=>{if(!e||e.code!=='declined')toast('Could not offer the download');});
}
function encCsv(){
  if(!S.dl)return;
  const q=s=>'"'+String(s==null?'':s).replace(/"/g,'""')+'"';
  const lines=[['Place','Table','Pokemon','PTA book rarity','Usual chance %','Group','Herd or pack','Swarms','Alpha chance %','Wanted','Note'].map(q).join(',')];
  const c={t:'day',x:'clear',s:'spring',m:'waxing',d:'high',f:false};
  encPlaces().forEach(pl=>{
    const t=encTab(pl.id,pl.k),T=t.T,gp=encGp(pl.id);
    const E=encEff(T,c,{});
    E.W.filter(e=>!e.oor&&(e.b>0)).sort((a,b)=>b.bp-a.bp).forEach(e=>{
      const r=e.row||{};
      lines.push([PD_BY[pl.id].name,t.k?t.nm:'',e.sp,ENC_BK[r.bk]?ENC_BK[r.bk][1]:'',Math.round(e.bp*10)/10,(num(r.lo)||1)+(num(r.hi)>num(r.lo)?'-'+num(r.hi):''),r.so?'yes':'',r.sw?'yes':'',num(r.al)||'',encWishOf(r,gp).map(x=>encWlText(gp,x.lv,x.i)+(x.why?' ('+x.why+')':'')).join('; '),r.n||''].map(q).join(','));
    });
  });
  return S.dl.save({filename:'sinnoh-pokemon-rarity.csv',data:'﻿'+lines.join('\r\n'),mime:'text/csv'}).catch(e=>{if(!e||e.code!=='declined')toast('Could not offer the download');});
}
/* text boxes that are not plain fields */
function encFxEdit(t){
  const p=String(t.dataset.encfx).split('|');
  const r=encFxParse(t.value);
  edit('gp',p[0],p[1]+'em.'+p[2]+'.fx',r.fx);
  if(r.bad.length)toast('Could not read: '+r.bad.slice(0,2).join(' · ')+(r.bad.length>2?' …':''));
  render();
}
function encListEdit(t){
  const p=String(t.dataset.encl).split('|');
  const list=t.value.split(',').map(x=>x.trim()).filter(Boolean);
  edit('gp',p[0],p[1]+'em.'+p[2]+'.'+p[3],list.length?list:null);
  render();
}

async function encAct(b){
  if(!S.me.admin)return;
  const d=b.dataset,pid=d.id;
  switch(d.act){
    case 'en_new':{
      const t=encTab(pid,+d.k||0);
      const arr=encRows(t.T).slice();
      if(arr.length>=ENC_MAX)break;
      arr.push(TPL.enc());
      edit('gp',pid,t.pre+'enc',arr);
      render();
      break;}
    case 'en_mnew':{
      const t=encTab(pid,+d.k||0);
      const arr=(Array.isArray(t.T.em)?t.T.em:[]).slice();
      let n=1;while(arr.some(m=>m.id==='m'+n))n++;
      arr.push({id:'m'+n,lb:'New condition',fx:[],tx:''});
      S.ui.enc.mo[pid+'|'+t.pre+'|'+(arr.length-1)]=true;
      edit('gp',pid,t.pre+'em',arr);
      render();
      break;}
    case 'en_wh':{
      const pre=d.pre||'';
      const T=pre?(encGp(pid).ex||[])[+pre.split('.')[1]]:encGp(pid);
      const m=T&&(T.em||[])[+d.i];
      if(!m)break;
      const w=Object.assign({},m.w||{});
      const a=(w[d.w]||[]).slice();
      const at=a.indexOf(d.v);
      if(at>=0)a.splice(at,1);else a.push(d.v);
      if(a.length)w[d.w]=a;else delete w[d.w];
      edit('gp',pid,pre+'em.'+d.i+'.w',Object.keys(w).length?w:null);
      render();
      break;}
    case 'en_edit':S.ui.enc.ed[pid]=!S.ui.enc.ed[pid];render();break;
    case 'en_mo':S.ui.enc.mo[d.key]=!S.ui.enc.mo[d.key];render();break;
    case 'en_tab':S.ui.enc.tb[pid]=+d.k||0;delete S.ui.enc.res[pid];render();break;
    case 'en_zone':{
      const z=encZ(pid,+d.k||0);
      z[d.m]=!z[d.m];
      render();
      break;}
    case 'en_used':{
      const t=encTab(pid,+d.k||0);
      edit('gp',pid,t.pre+'eoUsed',!t.T.eoUsed);
      render();
      break;}
    case 'en_roll':{
      const r=encRollRef(pid,+d.k||0,d.m||'enc',d.f);
      r.fid=d.f||'';
      S.ui.enc.res[pid]=r;
      render();
      break;}
    case 'en_alpha':{
      const r=S.ui.enc.res[pid];
      if(!r||r.none||!r.lines.length)break;
      const L=r.lines[0];
      L.a=L.a?0:1;
      render();
      break;}
    case 'en_tobattle':{
      const r=S.ui.enc.res[pid];
      if(!r||r.none)break;
      delete S.ui.enc.res[pid];
      await encToBattle(pid,r);
      setTab('battle');
      break;}
    case 'en_rollbattle':{
      const ref=encRef(d.v);
      const r=encRollRef(ref.id,ref.k,d.m||'enc','');
      if(r.none){toast(r.why||'Nothing turns up.');break;}
      await encToBattle(ref.id,r);
      break;}
    case 'en_pick':{const fp=$('#encfile');if(fp)fp.click();break;}
    case 'en_mode':S.ui.enc.imp.mode=d.v==='replace'?'replace':d.v==='wish'?'wish':'add';render();break;
    case 'en_wo':{const wo=S.ui.enc.wo=S.ui.enc.wo||{};wo[d.i]=!wo[d.i];render();break;}
    case 'en_exp':encExport();break;
    case 'en_csv':encCsv();break;
    default:break;
  }
}
/* ===== Catch calculator: GM only (GM Desk and the Battle page). Players never get this code path:
   both panels are drawn only when S.me.admin is set, and nothing here is written to a shared document. ===== */
S.ui.cc=Object.assign({sp:'',rar:'C',stage:'1',base:'',hpm:'max',cur:'',max:'',start:'wild',aff:{},alpha:false,titan:false,ball:'great',cond:false,cust:'',oth:'',foe:'',res:null},S.ui.cc||{});

/* cc-engine */
/* base capture rate by the rarity symbol of the family and the stage it is at (PTA 3.5) */
const CC_BASE={C:{1:50,2:35,3:20},U:{1:40,2:25,3:10},R:{1:30,2:15,3:0}};
const CC_RAR=[['C','● Common'],['U','◆ Uncommon'],['R','★ Rare']];
const CC_STAGE=[['1','First stage'],['2','Second stage'],['3','Final stage']];
const CC_HP=[['max','At full HP',-25],['dmg','Hurt, but not below half',-10],['half','Below half HP',0],['low','Hurt and under 10 HP',20],['zero','At 0 HP or lower',75],['num','Work it out from HP numbers',null]];
const CC_START=[['amb','The wild Pokémon was ambushed',-25],['wild','The wild Pokémon started it',0],['pl','Your side started it, and it knew you were there',10]];
const CC_AFF={Burned:10,Confused:10,Entranced:10,Poisoned:10,Toxified:10,Drowsy:15,Frostbitten:15,Paralyzed:15,Bound:0,Dazed:0,Disabled:0};
/* [key, name, modifier, condition (empty when the ball has none)]; a ball with a condition counts +10 when it is not met */
const CC_BALLS=[
  ['basic','Basic Ball',5,''],['great','Great Ball',0,''],['ultra','Ultra Ball',-5,''],['master','Master Ball',-100,''],
  ['friend','Friend Ball',0,''],['heal','Heal Ball',0,''],['cherish','Cherish Ball',-5,''],['luxury','Luxury Ball',-5,''],['premier','Premier Ball',-5,''],
  ['dive','Dive Ball',-12,'the target is in water'],['dusk','Dusk Ball',-7,'it is night'],['fast','Fast Ball',-8,'the target acts before your Pokémon'],
  ['lure','Lure Ball',-10,'its condition is met'],['quick','Quick Ball',-16,'it is your first action'],['repeat','Repeat Ball',-10,'its condition is met'],
  ['timer1','Timer Ball (1 minute)',-10,'the fight has lasted 1 minute'],['timer2','Timer Ball (2 minutes)',-18,'the fight has lasted 2 minutes'],
  ['dream','Dream Ball',-10,'the target is afflicted'],['heavy','Heavy Ball',-15,'the target is Heavy or Superweight'],
  ['level','Level Ball',-10,'the target is fully evolved and has evolved at least once'],['love','Love Ball',-10,'the target shares a type with one of your active Pokémon'],
  ['moon','Moon Ball',-10,'the target evolves with a stone'],['nest','Nest Ball',-10,'the target can evolve but has not'],['net','Net Ball',-15,'the target is Bug or Water'],
  ['beast','Beast Ball',-25,'the target is from a parallel dimension'],['strange','Strange Ball',-25,'the target is temporally displaced'],
  ['env','Environment Ball',-12,'you are in the matching environment'],['park','Park, Safari or Sport Ball',-25,'it is used on its specific target']
];
const ccBallOf=k=>CC_BALLS.find(b=>b[0]===k)||CC_BALLS[1];
function ccHpPick(mode,cur,max){
  if(mode!=='num'){const r=CC_HP.find(x=>x[0]===mode)||CC_HP[0];return {mod:r[2],half:mode==='half'||mode==='low'||mode==='zero',label:r[1]};}
  const c=Number(cur),m=Number(max);
  if(!Number.isFinite(c)||!Number.isFinite(m)||m<=0||cur===''||max==='')return {mod:-25,half:false,label:'At full HP (no numbers yet)'};
  const mods=[];
  if(c>=m)mods.push(-25);
  if(c<m)mods.push(-10);
  if(c*2<m)mods.push(0);
  if(c<10&&c<m)mods.push(20);
  if(c<=0)mods.push(75);
  return {mod:Math.max.apply(null,mods),half:c*2<=m,label:c+' of '+m+' HP'};
}
/* o: {rar,stage,base,hpm,cur,max,start,aff:{name:true},alpha,titan,ball,cond,cust,oth} -> the whole sum */
function ccCalc(o){
  const lines=[],notes=[];
  const bs=String(o.base==null?'':o.base).trim();
  let base=bs!==''&&Number.isFinite(Number(bs))?Number(bs):((CC_BASE[o.rar]||CC_BASE.C)[o.stage]);
  if(base==null||!Number.isFinite(base))base=0;
  lines.push(['Base rate'+(bs!==''?' (set by hand)':''),base]);
  const hp=ccHpPick(o.hpm,o.cur,o.max);
  let hmod=hp.mod,half=hp.half;
  if(o.alpha||o.titan){hmod=-25;notes.push('Alpha, Totem and Titan Pokémon count as full HP for the capture rate.');}
  lines.push(['HP: '+(o.alpha||o.titan?'treated as full HP':hp.label),hmod]);
  const st=CC_START.find(x=>x[0]===o.start)||CC_START[1];
  lines.push(['Start of the fight: '+st[1].toLowerCase(),st[2]]);
  const affs=Object.keys(o.aff||{}).filter(k=>o.aff[k]&&CC_AFF[k]!=null);
  let am=0,an='';
  affs.forEach(k=>{if(an===''||CC_AFF[k]>am){am=CC_AFF[k];an=k;}});
  lines.push([affs.length?'Status: '+an+(affs.length>1?' (best of '+affs.length+')':''):'Status: none',am]);
  const oth=Number(o.oth);
  if(Number.isFinite(oth)&&o.oth!==''&&oth!==0)lines.push(['Other change to the rate',oth]);
  const rate=lines.reduce((a,l)=>a+l[1],0);
  const b=ccBallOf(o.ball);
  let bm=b[2],bn=b[1];
  if(b[3]&&!o.cond){bm=10;bn+=' (condition not met)';}
  const cu=Number(o.cust);
  if(Number.isFinite(cu)&&o.cust!==''){bm=cu;bn='Custom ball';}
  const master=o.ball==='master'&&!(o.cust!==''&&Number.isFinite(cu));
  let blocked='';
  if(o.titan&&!master)blocked='A Titan cannot be caught with anything but a Master Ball.';
  else if(o.alpha&&!master&&!half)blocked='An Alpha, Totem or Titan can only be caught with a Master Ball unless it is at half of its max HP or lower.';
  /* d100 + ball modifier must come out under the rate, with no ties */
  let need=Math.max(0,Math.min(100,rate-bm-1));
  let chance=need;
  if(master&&!blocked){chance=100;need=100;notes.push('A Master Ball does not fail.');}
  if(blocked){chance=0;need=0;}
  if(rate<=0&&!master&&!blocked)notes.push('With this rate only a very good ball gives any chance.');
  if(half&&!blocked)notes.push('Below half HP the throw itself cannot miss.');
  else notes.push('Roll a d20 accuracy check for the throw first (against its Speed).');
  return {rate,lines,ball:bm,ballName:bn,need,chance,blocked,notes,half};
}
/* end cc-engine */

const ccS=()=>S.ui.cc;
/* rarity symbol used in the encounter tables, when this species has been placed in one */
function ccRarityOf(sp){
  const k=encKey(sp);
  if(!k)return '';
  const cnt={};
  Object.keys(S.gmPl||{}).forEach(id=>{
    const g=S.gmPl[id]||{};
    [g].concat(Array.isArray(g.ex)?g.ex:[]).forEach(T=>{(Array.isArray(T&&T.enc)?T.enc:[]).forEach(r=>{if(r&&encKey(r.sp)===k&&/^[CUR]$/.test(r.bk||''))cnt[r.bk]=(cnt[r.bk]||0)+1;});});
  });
  return Object.keys(cnt).sort((a,b)=>cnt[b]-cnt[a])[0]||'';
}
function ccStageOf(sp){
  try{
    const n=ptaResolve(sp);
    const rec=n?ptaRec(n):null;
    if(rec&&!(Array.isArray(rec.ev)&&rec.ev.length))return '3';
  }catch(e){}
  return '';
}
function ccFillFrom(f){
  const c=ccS();
  c.sp=f.sp||'';
  const r=ccRarityOf(f.sp);if(r)c.rar=r;
  const sg=ccStageOf(f.sp);if(sg)c.stage=sg;
  c.hpm='num';
  c.cur=String(num(f.hp&&f.hp.cur));c.max=String(num(f.hp&&f.hp.max));
  c.aff={};
  afflList(f.st).forEach(a=>{const k=Object.keys(CC_AFF).find(x=>dexKey(x)===dexKey(a));if(k)c.aff[k]=true;});
  c.alpha=foeKind(f)==='alpha'||foeKind(f)==='totem';c.titan=foeKind(f)==='titan';
  c.res=null;
}
function ccInput(opts){
  const c=ccS();
  return {rar:c.rar,stage:c.stage,base:c.base,hpm:c.hpm,cur:c.cur,max:c.max,start:c.start,aff:c.aff,alpha:c.alpha,titan:c.titan,ball:c.ball,cond:c.cond,cust:c.cust,oth:c.oth};
}
const ccPct=n=>(Math.round(n*10)/10)+'%';
function ccResult(){
  const c=ccS(),r=ccCalc(ccInput());
  const roll=c.res;
  return h`<div class="ccbox" aria-live="polite">
    <div class="ccbig"><span class="mono">${ccPct(r.chance)}</span><span class="sub"> chance with ${r.ballName}</span></div>
    ${r.blocked?h`<p class="ccno">${r.blocked}</p>`:h`<p class="sub">Roll <b>d100</b> and add <b class="mono">${sgn(r.ball)}</b> for the ball. It is caught if the total is <b>under ${r.rate}</b>, so a d100 of <b class="mono">${r.need}</b> or lower works${r.need<=0?' (it cannot work)':''}.</p>`}
    <ul class="mini-list cclines">${r.lines.map(l=>h`<li class="row sp"><span>${l[0]}</span><b class="mono">${l[1]===0?'0':sgn(l[1])}</b></li>`)}
      <li class="row sp ccsum"><span>Capture rate</span><b class="mono">${r.rate}</b></li></ul>
    ${r.notes.map(n=>h`<p class="sub">${n}</p>`)}
    ${roll?h`<p class="ccroll">Throw d20: <b class="mono">${roll.d20}</b> · d100: <b class="mono">${roll.d}</b> ${sgn(r.ball)} = <b class="mono">${roll.d+r.ball}</b> · ${!r.blocked&&(r.chance>=100||roll.d+r.ball<r.rate)?h`<span class="pill good">Caught</span>`:h`<span class="pill bad">${r.blocked?'Cannot be caught':'It breaks free'}</span>`} <span class="sub">(only you see this)</span></p>`:''}
  </div>`;
}
function ccPanel(where){
  if(!S.me.admin)return '';
  const c=ccS();
  const foes=where==='bat'?Object.keys(foesOf()).map(k=>[k,foesOf()[k]]).filter(x=>x[1]):[];
  const bl=ccBallOf(c.ball);
  return h`<div class="mgd secret cc"><span class="fl">GM only · Catch calculator</span>
    <p class="sub">PTA 3.5 capture rules. Nothing here is shown to or saved for the players.</p>
    ${foes.length?h`<div class="row"><label class="fld inl"><span class="fl">Use a foe</span><select data-u="cc.foe"><option value="">Choose a foe</option>${foes.map(([k,f])=>h`<option value="${k}" ${c.foe===k?raw('selected'):''}>${f.nick||f.sp||k}</option>`)}</select></label>
      <button class="btn sm" data-act="cc_foe" ${c.foe&&foesOf()[c.foe]?'':raw('disabled')}>Fill from this foe</button></div>`:''}
    <div class="fgrid">
      <label class="fld"><span class="fl">Species (to look up rarity)</span><input type="text" list="dl-species" data-u="cc.sp" data-nr value="${c.sp}" placeholder="e.g. Staravia"></label>
      <label class="fld"><span class="fl">Rarity of the family</span><select data-u="cc.rar">${CC_RAR.map(([k,l])=>h`<option value="${k}" ${c.rar===k?raw('selected'):''}>${l}</option>`)}</select></label>
      <label class="fld"><span class="fl">Stage</span><select data-u="cc.stage">${CC_STAGE.map(([k,l])=>h`<option value="${k}" ${c.stage===k?raw('selected'):''}>${l}</option>`)}</select></label>
      <label class="fld"><span class="fl">Base rate by hand (optional)</span><input type="number" inputmode="numeric" data-u="cc.base" data-nr value="${c.base}"></label>
    </div>
    <div class="row"><button class="btn sm" data-act="cc_lookup">Look up from the encounter tables</button></div>
    <div class="fgrid">
      <label class="fld"><span class="fl">Its health</span><select data-u="cc.hpm">${CC_HP.map(([k,l])=>h`<option value="${k}" ${c.hpm===k?raw('selected'):''}>${l}</option>`)}</select></label>
      ${c.hpm==='num'?h`<label class="fld"><span class="fl">HP now</span><input type="number" inputmode="numeric" data-u="cc.cur" data-nr value="${c.cur}"></label>
      <label class="fld"><span class="fl">HP max</span><input type="number" inputmode="numeric" data-u="cc.max" data-nr value="${c.max}"></label>`:''}
      <label class="fld"><span class="fl">How the fight started</span><select data-u="cc.start">${CC_START.map(([k,l])=>h`<option value="${k}" ${c.start===k?raw('selected'):''}>${l}</option>`)}</select></label>
    </div>
    <div class="fl">Status (the best one counts)</div>
    <div class="row evchips" role="group" aria-label="Status for the capture rate">${Object.keys(CC_AFF).map(a=>h`<button class="btn sm chk" data-act="cc_aff" data-a="${a}" aria-pressed="${String(!!c.aff[a])}">${a}</button>`)}</div>
    <div class="row evchips"><label class="chip chkc"><input type="checkbox" data-u="cc.alpha" ${c.alpha?raw('checked'):''}><span>Alpha or Totem</span></label>
      <label class="chip chkc"><input type="checkbox" data-u="cc.titan" ${c.titan?raw('checked'):''}><span>Titan</span></label></div>
    <div class="fgrid">
      <label class="fld"><span class="fl">Poké Ball</span><select data-u="cc.ball">${CC_BALLS.map(b=>h`<option value="${b[0]}" ${c.ball===b[0]?raw('selected'):''}>${b[1]} (${sgn(b[2])})</option>`)}</select></label>
      <label class="fld"><span class="fl">Custom ball modifier (optional)</span><input type="number" inputmode="numeric" data-u="cc.cust" data-nr value="${c.cust}" placeholder="replaces the ball"></label>
      <label class="fld"><span class="fl">Other change to the rate</span><input type="number" inputmode="numeric" data-u="cc.oth" data-nr value="${c.oth}" placeholder="0"></label>
    </div>
    ${bl[3]?h`<label class="row"><input type="checkbox" data-u="cc.cond" ${c.cond?raw('checked'):''}><span>${bl[1]}: ${bl[3]}. If not, it counts +10.</span></label>`:''}
    <div class="ccres">${ccResult()}</div>
    <div class="row"><button class="btn primary sm" data-act="cc_roll">Roll the throw and the catch</button><button class="btn sm ghost" data-act="cc_reset">Reset</button></div>
  </div>`;
}
/* one line under a foe's sheet: odds with the ball picked in the calculator */
function ccFoeLine(cid,f){
  if(!S.me.admin||!f)return '';
  const sv=ccInput();
  const r=(()=>{
    const ra=ccRarityOf(f.sp),sg=ccStageOf(f.sp);
    const aff={};afflList(f.st).forEach(a=>{const k=Object.keys(CC_AFF).find(x=>dexKey(x)===dexKey(a));if(k)aff[k]=true;});
    return ccCalc(Object.assign({},sv,{rar:ra||sv.rar,stage:sg||sv.stage,hpm:'num',cur:String(num(f.hp&&f.hp.cur)),max:String(num(f.hp&&f.hp.max)),aff,alpha:foeKind(f)==='alpha'||foeKind(f)==='totem',titan:foeKind(f)==='titan'}));
  })();
  return h`<div class="row cc1"><span class="sub">Catch chance now with ${r.ballName}: <b class="mono">${ccPct(r.chance)}</b>${r.blocked?' (not with this ball)':''}</span><button class="btn sm" data-act="cc_use" data-cid="${cid}">Open in calculator</button></div>`;
}
function ccAct(b){
  if(!S.me.admin)return;
  const c=ccS(),d=b.dataset;
  switch(d.act){
    case 'cc_aff':c.aff[d.a]=!c.aff[d.a];c.res=null;render();break;
    case 'cc_foe':{const f=foesOf()[c.foe];if(f)ccFillFrom(f);render();break;}
    case 'cc_use':{const f=foesOf()[d.cid];if(f){c.foe=d.cid;ccFillFrom(f);render();toast('Filled the calculator from '+(f.nick||f.sp)+'. It is in Who is fighting.',true);}break;}
    case 'cc_lookup':{
      const r=ccRarityOf(c.sp),sg=ccStageOf(c.sp);
      if(r)c.rar=r;if(sg)c.stage=sg;
      toast(r?'Rarity '+(CC_RAR.find(x=>x[0]===r)||[0,r])[1]+(sg?', final stage.':'.'):'Not in the encounter tables. Choose the rarity by hand.',!!r);
      render();break;
    }
    case 'cc_roll':{
      c.res={d20:rnd(20),d:rnd(100)};
      render();break;
    }
    case 'cc_reset':S.ui.cc=Object.assign({},{sp:'',rar:'C',stage:'1',base:'',hpm:'max',cur:'',max:'',start:'wild',aff:{},alpha:false,titan:false,ball:'great',cond:false,cust:'',oth:'',foe:'',res:null});render();break;
  }
}
function ccDesk(){
  if(!S.me.admin)return '';
  return h`<section class="panel"><div class="ph"><h2>Catch calculator</h2><span class="pill gm">GM only</span></div>${ccPanel('desk')}</section>`;
}
/* The shop catalog: every priced item in the Players Handbook (and the extra items in the second handbook), grouped by kind.
   Each entry is [name, group, price, description]. A price of null means the book gives none. */
const SCAT_CATS=["Poké Balls", "Potions", "Status cures", "Revives", "Energy", "Battle boosters", "Vitamins", "Mints", "Repels", "Herbs", "Held items", "Berries", "Contest", "Evolution stones", "TMs and TRs", "Packs and kits", "Utility", "Survival gear", "Clothing and armor", "Tech", "Camping and play", "Rare", "General goods"];
const SCAT=[["Basic Ball",0,100,"+5 to your capture roll."],["Great Ball",0,600,"+0 to your capture roll."],["Ultra Ball",0,1000,"-5 from your capture roll."],["Master Ball",0,null,"-100 from your capture roll. The Master Ball can and will often fail when thrown at legendary Pokémon."],["Park Ball",0,550,"-20 from your capture roll against domesticated wild Pokémon."],["Safari Ball",0,550,"-20 from your capture roll against domesticated wild Pokémon."],["Sport Ball",0,550,"-20 from your capture roll against domesticated wild Pokémon."],["Cherish Ball",0,1500,"-5 from your capture roll. Captured Pokémon are more easily befriended."],["Luxury Ball",0,1500,"-5 from your capture roll. Captured Pokémon are more easily befriended."],["Premier Ball",0,1500,"-5 from your capture roll. Captured Pokémon are more easily befriended."],["Dive Ball",0,1250,"-12 from your capture roll if the Pokémon is in water."],["Dusk Ball",0,1150,"-7 from your capture roll if it’s night time (no sunlight)."],["Fast Ball",0,1250,"-8 from your capture roll on a Pokémon that acts before your Pokémon."],["Lure Ball",0,1250,"-10 from your capture roll if you lured the wild Pokémon into combat."],["Quick Ball",0,1550,"-16 from your capture roll if thrown as your first action during combat."],["Repeat Ball",0,1250,"-10 from your capture roll if the Pokémon already had a Poké Ball thrown at it this encounter."],["Timer Ball",0,1450,"-10 from your capture roll if the encounter has lasted at least one min; -18 from your capture roll if the encounter has lasted at least two mins."],["Friend Ball",0,1000,"+0 to your capture roll. Captured Pokémon are more easily befriended."],["Heal Ball",0,1000,"+0 to your capture roll. Captured Pokémon are healed 20 hit points."],["Dream Ball",0,1250,"-10 from your capture roll if the Pokémon is afflicted."],["Heavy Ball",0,1250,"-15 from your capture roll if the Pokémon is Heavy or Superweight."],["Level Ball",0,1250,"-10 from your capture roll if the Pokémon is fully evolved, and did evolve at least once."],["Love Ball",0,1250,"-10 from your capture roll if the target shares a type with one of your active Pokémon."],["Moon Ball",0,1250,"-10 from your capture roll if the Pokémon evolves with an evolution stone."],["Nest Ball",0,1250,"-10 from your capture roll if the Pokémon can evolve, but is not evolved."],["Net Ball",0,1250,"-15 from your capture roll when used against a Bug or Water type Pokémon."],["Beast Ball",0,null,"-25 from your capture roll if the Pokémon is from a parallel dimension."],["Strange Ball",0,null,"-25 from your capture roll if the Pokémon is temporally displaced."],["Potion",1,25,"Heals a Pokémon 12 HP."],["Super Potion",1,250,"Heals a Pokémon 24 HP."],["Hyper Potion",1,550,"Heals a Pokémon 36 HP."],["Max Potion",1,850,"Heals a Pokémon to their Max HP."],["Full Restore",1,1200,"Heals a Pokémon to their Max HP and cures them of any afflictions."],["Potion Water",1,100,"Heals a human 10 HP."],["Super Soda",1,300,"Heals a human 20 HP."],["Hyper Lemonade",1,550,"Heals a human 30 HP."],["Moo Moo Milk",1,175,"Heals anything 8 HP. 164"],["Antidote",2,120,"Cures a Pokémon or human of Poisoned or Toxified."],["Awakening",2,120,"Cures a Pokémon or human of Drowsy."],["Burn Heal",2,120,"Cures a Pokémon or human of Burned."],["Ice Heal",2,120,"Cures a Pokémon or human of Frostbite."],["Paralyze Heal",2,120,"Cures a Pokémon or human of Paralysis."],["Touga Spray",2,120,"Cures a Pokémon of Entranced."],["Full Heal",2,520,"Cures a Pokémon or human of all afflictions."],["Revive",3,1350,"Restore an unconscious Pokémon to half of its max HP."],["Max Revive",3,2950,"Restore an unconscious Pokémon to its max HP."],["Ether",4,480,"A Pokémon’s strength is partially restored and regains a single use of one of its 3/day moves."],["Elixir",4,1280,"A Pokémon’s strength is partially Restored and regains a single use of one of its 1/day moves."],["Max Ether",4,2280,"A Pokémon’s strength is partially restored. Choose two 3/day and/or 1/day moves to restore one each of the moves uses."],["Max Elixir",4,3480,"A Pokémon’s strength is partially restored. Choose two 3/day and/or 1/day moves to restore all of the moves uses."],["X Attack",5,240,"Gives a Pokémon Attack▲."],["X Defend",5,240,"Gives a Pokémon Defense▲."],["X Special",5,240,"Gives a Pokémon SpAttack▲."],["X Sp. Def",5,240,"Gives a Pokémon SpDefense▲."],["X Speed",5,240,"Gives a Pokémon Speed▲."],["X Accuracy",5,240,"Increases a Pokémon’s AC by +1."],["Dire Hit",5,840,"The next attack the Pokémon makes is Lethal."],["Guard Spec.",5,440,"The next time the Pokémon would get ▼from a foe, ignore it."],["HP Up",6,800,"Increase HP by 4 for two weeks."],["Protein",6,800,"Increase Attack by 1 for two weeks."],["Iron",6,800,"Increase Defense by 1 for two weeks."],["Calcium",6,800,"Increase Special Attack by 1 for two weeks."],["Zinc",6,800,"Increase Special Defense by 1 for two weeks."],["Carbos",6,800,"Increase speed by 1 for two weeks."],["PP UP",6,1200,"Increase the frequency of a 3/day move to 4/day for one week."],["PP Max",6,1900,"Increase the frequency of a 1/day move to 2/day(1/combat) for one week."],["Cinnaleaf Mint",7,8750,"Raise Attack 1 point, then lower a non-Attack non-HP stat 1 point."],["Stonebalm Mint",7,8750,"Raise Defense 1 point, then lower a non-Defense non-HP stat 1 point."],["Spearmist Mint",7,8750,"Raise Special Attack 1 point, then lower a non-Special Attack non-HP stat 1 point."],["Calmrest Mint",7,8750,"Raise Special Defense 1 point, then lower a non-Special Defense non-HP stat 1 point."],["Lightwind Mint",7,8750,"Raise Speed 1 point, then lower a non-Speed non-HP stat 1 point."],["Pureleaf Mint",7,8750,"Do not add to or subtract from any stats after removing the effects of the Pokémon’s Nature."],["Repel",8,150,"Wild Pokémon find the smell repulsive for one hour after applied, but may ignore it to protect something precious to them."],["Super Repel",8,400,"Wild Pokémon find the smell repulsive for three hours after applied, but may ignore it to protect something precious to them."],["Max Repel",8,1000,"Wild Pokémon find the smell repulsive for ten hours after applied, but may ignore it to protect something precious to them."],["Heal Powder",9,480,"Removes any affliction"],["Energy Powder",9,125,"Recovers 30 Hit Points (Pokémon)"],["Energy Root",9,400,"Recovers 48 Hit Points (Pokémon)"],["Revival Herb",9,1000,"Recovers an unconscious Pokémon to half of their max HP."],["Ability Shield",10,1350,"Your passives cannot be disabled or replaced by any foe’s effects during combat."],["Absorb Bulb",10,300,"When you are hit by a Water-type attack, Absorb Bulb is destroyed and you get SpAttack▲."],["Adrenaline Orb",10,2550,"If you get Attack▼or SpAttack▼from a foe’s effects, you get Speed▲. If you get Attack▼▼or SpAttack▼▼from a foe’s effects, you get Speed▲▲."],["Air Balloon",10,1350,"You are immune to Ground-type attacks. If you are hit by any other type of attack, Air Balloon is destroyed."],["Assault Vest",10,2550,"Your Special Defense is +2. You may not use moves that do not have power."],["Big Root",10,2550,"Whenever you would recover HP or gain temporary HP after dealing damage to a foe, gain +1d4 temporary HP."],["Binding Band",10,2550,"If you use an attack that binds a target, the target loses 1d4 HP at the end of each of your turns if they are still Bound."],["Black Sludge",10,1050,"As an action, consume and destroy Black Sludge. Poison-types regain 1d4 HP after acting until at max HP. All other Pokémon are Poisoned by consuming Black Sludge."],["Bright Powder",10,850,"As a free action, destroy Bright Powder. Until your next turn, if you are targeted by an attack, the attacker must roll +2 higher in order to hit you during AC."],["Cell Battery",10,300,"When you are hit by a Electric-type attack, Cell Battery is destroyed and you get Attack▲."],["Choice Band",10,2550,"Your Attack stat is +2. Whenever you use a move, that is the only move you can use for the rest of the encounter."],["Choice Scarf",10,2550,"Your Speed stat is +2. Whenever you use a move, that is the only move you can use for the rest of the encounter."],["Choice Specs",10,2550,"Your Special Attack stat is +2. Whenever you use a move, that is the only move you can use for the rest of the encounter."],["Clear Amulet",10,1350,"You are immune to getting ▼from the effects of your foe’s Styles."],["Covert Cloak",10,1350,"You are immune to the effects of your foe’s held items."],["Destiny Knot",10,1750,"When you become Entranced, the Pokémon who caused your Entranced becomes Entranced with you as well."],["Eviolite",10,2550,"If you can still potentially evolve, your Defense and Special Defense stats are +1."],["Expert Belt",10,2550,"When you hit with a super-effective or extremely-effective attack, deal an additional +2 damage."],["Flame Orb",10,1350,"After acting, you are Burned."],["Float Stone",10,1350,"If you are Heavy (weight), you are treated as Medium (weight). This is also true for Medium to Light and Light to Featherweight. You get +15ft movement speed."],["Focus Band",10,1950,"If you would be knocked out, you may roll 1d20. On 17 or higher, you are instead set to 1 hit point and the Focus Band is destroyed."],["Focus Sash",10,2550,"If you would be knocked out from a single attack when you were at max hit points, instead you are set to 1 hit point once per battle."],["Grip Claw",10,1950,"If you bind a foe and your foe tries to escape, they must roll +4 higher to escape successfully."],["Heavy Boots",10,2550,"The first time you would take damage from a Hazard per combat, ignore that damage."],["Iron Ball",10,1350,"If you are Featherweight (weight), you are treated as Light (weight). This is also true for Light to Medium and Medium to Heavy."],["King’s Rock",10,2550,"On your first single-target attack per day, the attack gains the following effect: “18 or higher during AC inflicts Dazed.”"],["Lagging Tail",10,1350,"You act last during each round of combat."],["Leftovers",10,2550,"As an action, consume and destroy Leftovers. Regain 1d6 HP after acting until you are at max HP."],["Life Orb",10,2550,"Your attacks have +1d6 power. After acting, no matter what actions you take, you lose 1d6 HP."],["Luminous Moss",10,300,"When you are hit by a Water-type attack, Luminous Moss is destroyed and you get SpDefense▲."],["Mental Herb",10,650,"As a free action, consume and destroy Mental Herb. If a foe does anything to try and prevent you from using any of your moves, it fails."],["Metronome",10,2550,"Your attacks have +1d4 power for each other time the same attack has been used that encounter (max +3d4)."],["Mirror Herb",10,350,"As a free Reaction [When a foe gets▲], consume and destroy Mental Herb. Gain the same ▲that the foe just gained."],["Muscle Band",10,3550,"Your Physical attacks deal +1 damage."],["Power Herb",10,850,"As a free Reaction [When you use a move with multiple turns], consume and destroy Power Herb."],["Protective Pads",10,2550,"If you would be damaged as a result of making a melee attack against a foe by a foe’s passive or other effect, ignore that damage."],["Quick Claw",10,2550,"On your first single-target melee attack with at-will frequency per day, the attack gains the following effect: “This attack has Priority.”"],["Razor Claw",10,2550,"On your first single-target melee attack per day, the attack gains the following effect: “This attack is Lethal.”"],["Razor Fang",10,2550,"Your Latched attacks deal +2 damage."],["Ring Target",10,1050,"You lose all of your type immunities. When hit by an attack that you are usually immune to, treat the damage as ineffective."],["Rocky Helmet",10,3550,"Whenever you are hit by an attack at melee range, the attacker loses 1d4 HP."],["Safety Goggles",10,2550,"You are immune to damaging effects from Weather."],["Scope Lens",10,2550,"On your first single-target ranged attack per day, the attack gains the following effect: “This attack is Lethal.”"],["Shed Shell",10,450,"As a free Reaction [When you become Bound by a foe], destroy Shed Shell. You are no longer Bound."],["Shell Bell",10,3550,"Whenever you hit with an attack, you can drop your highest rolled damage result. If you do, recover 1d4 HP."],["Snowball",10,300,"When you are hit by a Ice-type attack, Snowball is destroyed and you get Attack▲."],["Sticky Barb",10,2050,"Whenever you move more than 10ft during your turn, you lose 1d4 HP. If you are hit by a melee range attack, give Sticky Barb to the attacker."],["Throat Spray",10,1850,"Your Sound attacks deal +2 damage."],["Toxic Orb",10,1350,"After acting, you are Poisoned."],["White Herb",10,650,"As a free action, consume and destroy White Herb. Get rid of any ▼ that you have."],["Wide Lens",10,3550,"Your effect moves have +1 Accuracy."],["Wise Glasses",10,3550,"Your Special attacks deal +1 damage."],["Zoom Lens",10,3550,"On your first attack per combat, your attack has +2 Accuracy and -4 power."],["Elemental Boon (choose a type)",10,1850,"Elemental Boons have many names and each correspond to each Pokémon type (Soft Sand for Ground, Silk Scarf for Normal, Never Melt Ice for Ice, etc.)."],["Elemental Plate (choose a type)",10,19800,"Elemental Plates are rare artifacts named per Pokémon type (Bug Plate, Dark Plate, etc.)."],["Weather/Terrain/Zone Rock",10,450,"These items are named after the Weather, Terrain, or Zone that the held item affects (Sunny Rock, Tricky Rock, Grassy Rock, etc.)."],["Weather/Terrain/Zone Seed",10,450,"These items are named after the Weather, Terrain, or Zone that the held item affects (Rainy Seed, Gravity Seed, Electric Seed, etc.)."],["Oran Berry",11,25,"Heals a Pokémon 5 HP."],["Sitrus Berry",11,120,"Heals a Pokémon 12 HP. (uncommon in the wild)"],["Aguav Berry",11,850,"Heals 1/3 of a Pokémon’s max HP, then they are Confused. (uncommon in the wild)"],["Figy Berry",11,850,"Heals 1/3 of a Pokémon’s max HP, then they are Confused. (uncommon in the wild)"],["Iapapa Berry",11,850,"Heals 1/3 of a Pokémon’s max HP, then they are Confused. (uncommon in the wild)"],["Mago Berry",11,850,"Heals 1/3 of a Pokémon’s max HP, then they are Confused. (uncommon in the wild)"],["Wiki Berry",11,850,"Heals 1/3 of a Pokémon’s max HP, then they are Confused. (uncommon in the wild)"],["Aspear Berry",11,120,"Cures Frostbite"],["Cheri Berry",11,120,"Cures Paralysis"],["Chesto Berry",11,120,"Cures Drowsy"],["Pecha Berry",11,120,"Cures Poisoned and Toxified"],["Persim Berry",11,120,"Cures Confused"],["Rawst Berry",11,120,"Cures Burns"],["Lum Berry",11,580,"Cures all Afflictions (uncommon in the wild)"],["Grepa Berry",11,680,"When you have SpDefense▼ you get SpDefense▲. (rare in the wild)"],["Hondew Berry",11,680,"When you have SpAttack▼ you get SpAttack▲. (rare in the wild)"],["Kelpsy Berry",11,680,"When you have Attack▼ you get Attack▲. (rare in the wild)"],["Pomeg Berry",11,1080,"When you have ▼ you get a matching ▲. (rare in the wild)"],["Qualot Berry",11,680,"When you have Defense▼ you get Defense▲. (rare in the wild)"],["Tamato Berry",11,680,"When you have Speed▼ you get Speed▲. (rare in the wild)"],["Babiri Berry",11,540,"Protection from Steel. (uncommon in the wild)"],["Charti Berry",11,540,"Protection from Rock. (uncommon in the wild)"],["Chilan Berry",11,540,"Protection from Normal. (uncommon in the wild)"],["Chople Berry",11,540,"Protection from Fighting. (uncommon in the wild)"],["Coba Berry",11,540,"Protection from Flying. (uncommon in the wild)"],["Colbur Berry",11,540,"Protection from Dark. (uncommon in the wild)"],["Haban Berry",11,540,"Protection from Dragon. (uncommon in the wild)"],["Kasib Berry",11,540,"Protection from Ghost. (uncommon in the wild)"],["Kebia Berry",11,540,"Protection from Poison. (uncommon in the wild)"],["Occa Berry",11,540,"Protection from Fire. (uncommon in the wild)"],["Passho Berry",11,540,"Protection from Water. (uncommon in the wild)"],["Payapa Berry",11,540,"Protection from Psychic. (uncommon in the wild)"],["Rindo Berry",11,540,"Protection from Grass. (uncommon in the wild)"],["Roseli Berry",11,540,"Protection from Fairy. (uncommon in the wild)"],["Shuca Berry",11,540,"Protection from Ground. (uncommon in the wild)"],["Tanga Berry",11,540,"Protection from Bug. (uncommon in the wild)"],["Wacan Berry",11,540,"Protection from Electric. (uncommon in the wild)"],["Yache Berry",11,540,"Protection from Ice. (uncommon in the wild)"],["Apicot Berry",11,1880,"At half HP or lower, you get SpDefense▲. (rare in the wild)"],["Ganlon Berry",11,1880,"At half HP or lower, you get Defense▲. (rare in the wild)"],["Lansat Berry",11,1880,"At half HP or lower, your next attack is Lethal. (rare in the wild)"],["Liechi Berry",11,1880,"At half HP or lower, you get Attack▲. (rare in the wild)"],["Micle Berry",11,1880,"At half HP or lower, increase your AC by +1 until the end of combat. (rare in the wild)"],["Petaya Berry",11,1880,"At half HP or lower, you get SpAttack▲. (rare in the wild)"],["Salac Berry",11,1880,"At half HP or lower, you get Speed▲. (rare in the wild)"],["Starf Berry",11,1280,"At half HP or lower, get a random ▲. (rare in the wild)"],["Custap Berry",11,null,"When at 6 HP or less, your next At-Will attack has Priority. (rare in the wild)"],["Enigma Berry",11,null,"When hit by a super-effective or extremely-effective attack, restore HP equal to 1/4th of your max HP. (rare in the wild)"],["Jacoba Berry",11,null,"When hit by a melee Attack move, the attacker loses HP equal to 1/4th the damage you just took. (rare in the wild)"],["Kee Berry",11,null,"When hit by an Attack move, increase Defense by 1 for 2 mins. (rare in the wild)"],["Leppa Berry",11,null,"Restore the use of one 3/day frequency move as if you’ve had an extended rest. (rare in the wild)"],["Maranga Berry",11,null,"When hit by an Sp. Atk move, increase Sp. Def by 1 for 2 mins. (rare in the wild)"],["Rowap Berry",11,null,"When hit by a ranged Sp. Atk move, the offender loses HP equal to 1/4th the damage you just took. (rare in the wild)"],["Belue Berry",11,120,"No special effect; used for contest treats and berry food."],["Bluk Berry",11,120,"No special effect; used for contest treats and berry food."],["Cornn Berry",11,120,"No special effect; used for contest treats and berry food."],["Durin Berry",11,120,"No special effect; used for contest treats and berry food."],["Magost Berry",11,120,"No special effect; used for contest treats and berry food."],["Nanab Berry",11,120,"No special effect; used for contest treats and berry food."],["Nomel Berry",11,120,"No special effect; used for contest treats and berry food."],["Pamtre Berry",11,120,"No special effect; used for contest treats and berry food."],["Pinap Berry",11,120,"No special effect; used for contest treats and berry food."],["Rabuta Berry",11,120,"No special effect; used for contest treats and berry food."],["Razz Berry",11,120,"No special effect; used for contest treats and berry food."],["Spelon Berry",11,120,"No special effect; used for contest treats and berry food."],["Watmel Berry",11,120,"No special effect; used for contest treats and berry food."],["Wepear Berry",11,120,"No special effect; used for contest treats and berry food."],["Beautiful Bandanna",12,2280,"Beauty contest stat is +2 while worn."],["Clever Cravat",12,2280,"Clever contest stat is +2 while worn."],["Cool Kerchief",12,2280,"Cool contest stat is +2 while worn."],["Cute Comforter",12,2280,"Cute contest stat is +2 while worn."],["Tough Tippet",12,2280,"Tough contest stat is +2 while worn."],["Sweet PokéBlock (level 1)",12,980,"Raises Cute stat +1"],["Dry & Sweet Poffin (level 2)",12,1880,"Raises both Beauty and Cute stat +2"],["Bitter Donut (level 4)",12,3680,"Raises Clever stat +4"],["Spicy PokéBlock (level 5)",12,4580,"Raises Cool stat +5"],["Null Poffin (level 4)",12,480,"Permanently lowers 4 Contest stats. (They can be raised again.)"],["Dawn Stone",13,9800,"Induces evolution in certain species of Pokémon."],["Dusk Stone",13,9800,"Induces evolution in certain species of Pokémon."],["Fire Stone",13,9800,"Induces evolution in certain species of Pokémon."],["Ice Stone",13,9800,"Induces evolution in certain species of Pokémon."],["Leaf Stone",13,9800,"Induces evolution in certain species of Pokémon."],["Moon Stone",13,9800,"Induces evolution in certain species of Pokémon."],["Shiny Stone",13,9800,"Induces evolution in certain species of Pokémon."],["Sun Stone",13,9800,"Induces evolution in certain species of Pokémon."],["Thunder Stone",13,9800,"Induces evolution in certain species of Pokémon."],["Water Stone",13,9800,"Induces evolution in certain species of Pokémon."],["TM (At-Will)",14,4800,"Teaches an at-will move. 3 uses."],["TM (3/day)",14,11800,"Teaches a 3/day move. 3 uses."],["TM (1/day)",14,26800,"Teaches a 1/day move. 3 uses."],["TR (At-Will)",14,2400,"Teaches an at-will move. 1 use."],["TR (3/day)",14,5900,"Teaches a 3/day move. 1 use."],["TR (1/day)",14,13400,"Teaches a 1/day move. 1 use."],["HM (At-Will)",14,null,"Teaches an at-will move. Unlimited uses. Hard to price and hard to find."],["HM (3/day)",14,null,"Teaches a 3/day move. Unlimited uses. Hard to price and hard to find."],["HM (1/day)",14,null,"Teaches a 1/day move. Unlimited uses. Hard to price and hard to find."],["Basic Tool Kit",15,95,"Basic tools for basic repairs or maintenance. (8 lbs)"],["Camera Bag",15,220,"Everything you need as a traveling photographer, minus the camera. (3 lbs)"],["Cooking Kit",15,850,"For the chef on the go, in the wilds. (35 lbs)"],["Dig Kit",15,150,"Whatever you’re looking for, this should help. (15 lbs)"],["Drawing Kit",15,35,"For an artist, or maybe just a doodler. (4 lbs)"],["Studious Pack",15,260,"Useful things for a trainer with a knack for academics. (10 lbs)"],["Traveler’s Pack",15,150,"Really useful gear for extended travel through the wilds. (15 lbs)"],["Trainer’s Pack",15,140,"Basic goods for a trainer who’s starting their journey. (5 lbs)"],["Engineer’s Tool Kit",15,1050,"If you’re building something on the go, or taking something else apart, maybe you’ll need this? (15 lbs)"],["Field Survey Kit",15,200,"If any trainers want to do some research while out in the wilds, these tools will help. (8 lbs)"],["Fishing Kit",15,250,"For trainers who are looking to lure underwater Pokémon to the surface. (8 lbs)"],["Grooming Kit",15,150,"Your Pokémon will always look their best when you’re using this kit. (4 lbs)"],["Make Up Kit",15,150,"You will always look your best when you’re with this kit. (4 lbs)"],["Medical Field Kit",15,1750,"Even if you’re not entirely sure how to use it, it’s very useful to have. (10 lbs)"],["Mess Kit",15,10,"Everything you need to enjoy a meal on the go. (1.5 lbs)"],["Miscreant’s Pack",15,300,"There’s no real reason to have this, let alone sell it. This may not be easily found and available in stores. (10 lbs)"],["Performer’s Pack",15,700,"Perfect for trainers who travel as entertainers, coordinators, or influencers. (9 lbs)"],["Poké Ball Smith Kit",15,1250,"If you’re planning to make your own Poké Balls, this will be necessary. (15 lbs)"],["Portable Chemistry Set",15,800,"Science on the go! (12 lbs)"],["Ruin Explorer’s Pack",15,325,"Intended for trainers investigating ancient sites, abandoned structures, and lost routes. (11 lbs)"],["Sewing Kit",15,325,"This is useful for the designer on the go. (20 lbs)"],["Spiritualist’ Pack",15,140,"For those who travel and spread the word of various greater beings. (5 lbs)"],["Arctic Travel Pack",15,575,"For exposure to cold climates and snow-covered routes. (14 lbs)"],["Climber’s Pack",15,350,"Steep routes, cliffs, and elevated terrain. (12 lbs)"],["Coastal & Open Water Pack",15,525,"For long island routes, shoreline travel, and open-water crossings. (11 lbs)"],["Extreme Weather Pack",15,425,"For routes with dangerous or unpredictable weather conditions. (7 lbs)"],["Swamp & Wetlands Pack",15,575,"Built for travel through marshes, bogs, and flooded wilds. (10 lbs)"],["Volcanic Route Pack",15,850,"Intended for travel near active volcanic zones and other dangerous extreme heat environments. (9 lbs)"],["Berry Planter",16,2800,"A portable planter that can turn one berry into two or three when watered daily. (Same item as the Portable Berry Planter.)"],["Egg Incubator",16,1350,"Egg incubators are electronic, reusable containers that safely keep and warm Pokémon eggs. (15 lbs)"],["Folding Bicycle",16,950,"A 3-speed bike that folds onto itself. (25 lbs)"],["Lure Module Launcher",16,950,"An electronic setup that deploys scent/light emitters that last for 30 mins that attract Pokémon to your location in wild spaces. (15 lbs)"],["Portable Berry Planter",16,2800,"By planting a berry in a portable berry planter, you create a mini-ecosystem for the berry to rapidly grow into a fruit bearing shrub, often producing two or even three…"],["Signal Scanner",16,650,"Handheld device that detects nearby electronic signals (50ft), recent Poké Ball activity (2 minutes), and strong energy emissions nearby (150ft)."],["Solar Charger",16,50,"An unfolding solar panel that charges devices."],["Blizzard Wear",17,1050,"Carefully made clothes for humans protect them from harmful hail and snowstorms."],["Desert Gear",17,1050,"Carefully made clothes for humans protect them from harmful sandstorms and desert winds."],["Diving Gear",17,1050,"Self contained underwater breathing apparatus . Allows for humans to explore underwater with enough air to breathe for two hours."],["Hazmat Suit",17,750,"Full-body protective suit used to shield trainers from dangerous chemical, biological, radiological, or nuclear harms."],["Wet Suit",17,750,"Insulated body suit for diving in any waters. Includes gloves and flippers ."],["Ninja Tabi",18,800,"+2 to a Acrobatics skill check. You can use only one clothing or equipment bonus per day."],["Bracing Sleeves",18,800,"+2 to a Athletics skill check. You can use only one clothing or equipment bonus per day."],["Domino Mask",18,800,"+2 to a Bluff / Deception skill check. You can use only one clothing or equipment bonus per day."],["Pyramid Hat",18,800,"+2 to a Concentration skill check. You can use only one clothing or equipment bonus per day."],["Padded Jacket",18,800,"+2 to a Constitution skill check. You can use only one clothing or equipment bonus per day."],["Fine Ascot",18,800,"+2 to a Diplomacy skill check. You can use only one clothing or equipment bonus per day."],["Fingerless Gloves",18,800,"+2 to a Engineering / Operation skill check. You can use only one clothing or equipment bonus per day."],["Grand Monocle",18,800,"+2 to a History skill check. You can use only one clothing or equipment bonus per day."],["Cozy Scarf",18,800,"+2 to a Insight skill check. You can use only one clothing or equipment bonus per day."],["Wrist Magnifier",18,800,"+2 to a Investigate skill check. You can use only one clothing or equipment bonus per day."],["New Stethoscope",18,800,"+2 to a Medicine skill check. You can use only one clothing or equipment bonus per day."],["Field Boots",18,800,"+2 to a Nature skill check. You can use only one clothing or equipment bonus per day."],["Tech Visor",18,800,"+2 to a Perception skill check. You can use only one clothing or equipment bonus per day."],["Baller Hacky Sack",18,800,"+2 to a Perform skill check. You can use only one clothing or equipment bonus per day."],["Soft Brush",18,800,"+2 to a Pokémon Handling skill check. You can use only one clothing or equipment bonus per day."],["AR Goggles",18,800,"+2 to a Programming skill check. You can use only one clothing or equipment bonus per day."],["Loose Overcoat",18,800,"+2 to a Sleight of Hand skill check. You can use only one clothing or equipment bonus per day."],["Silent Sneakers",18,800,"+2 to a Stealth skill check. You can use only one clothing or equipment bonus per day."],["Studded Leather",18,1250,"+1 Defense during accuracy checks made against you. (10 lbs)"],["Chainmail",18,3450,"+2 Defense during accuracy checks made against you, and you move 10 ft less per turn. (20 lbs)"],["Full Plate Armor",18,9650,"+3 Defense during accuracy checks made against you, and you move 20 ft less per turn. (50 lbs)"],["Nimble Spandex",18,1250,"+1 Special Defense during accuracy checks made against you. (1 lb)"],["Arctic Wetsuit",18,775,"Cold-resistant wetsuit with gloves and flippers. Swim in frigid water without damage; +4 to Constitution checks against cold."],["All-Sight Helmet",18,975,"+4 to Perception checks in the dark, fog or other obstacles to sight or hearing."],["Biome Camouflage",18,675,"Fatigues for one terrain. +4 to Stealth checks while wearing the matching suit."],["Cleated Boots",18,95,"Your movement is not hindered by mud or other slippery terrain."],["Cross-country Skis",18,675,"+15 ft movement per turn on snow or sand; other terrain is difficult."],["Divers Suit",18,200,"Swimsuit for temperate waters, with flippers. Movement is not hindered underwater."],["Hooked-Finger Gloves",18,675,"+4 to Acrobatics checks when climbing a tree, mountainside or other non-metal surface."],["Ice Vest",18,675,"Cooling vest. +4 to Constitution checks to endure desert or volcano heat."],["Noise Neutralizers",18,675,"Noise-cancelling headset. +4 to Concentration checks when focusing without physical pressure."],["Purrloin Suit",18,675,"Dark full-body suit. +4 to Stealth checks in an urban setting."],["Rebreather",18,9950,"Oxygen recycler: up to 30 minutes of air underwater, then must be cleaned and dried for 1 hour."],["Rollerblades",18,675,"+15 ft movement per turn on smooth surfaces; rough terrain is difficult."],["Snow Suit",18,675,"Warm jacket and pants with hand warmers. +4 to Constitution checks to endure the cold."],["Snow Treks",18,250,"Treat difficult terrain created by ice or snow as normal terrain."],["Pokédex",19,600,"Identifies Pokémon with its camera and brings up their data. About the size of a smartphone."],["C-Gear",19,280,"Wrist-worn smart device connected to your phone or Pokédex: calls, GPS, trainer IDs and more."],["Pokégear",19,280,"Wrist-worn smart device connected to your phone or Pokédex: calls, GPS, trainer IDs and more."],["PokéNav",19,280,"Wrist-worn smart device connected to your phone or Pokédex: calls, GPS, trainer IDs and more."],["Pokétch",19,280,"Wrist-worn smart device connected to your phone or Pokédex: calls, GPS, trainer IDs and more."],["Vs. Seeker",19,280,"Wrist-worn smart device connected to your phone or Pokédex: calls, GPS, trainer IDs and more."],["Xtransceiver",19,280,"Wrist-worn smart device connected to your phone or Pokédex: calls, GPS, trainer IDs and more."],["Pokémon Box Link",19,198000,"Portable access to the Pokémon Bank from anywhere with a signal. Needs about three hours of charging a week. (20 lbs)"],["Backup Solar Battery",19,100,"Recharges with a solar charger. Charges up to four devices from zero to full."],["Ball (Basic)",20,2,"A Poké Ball-sized ball for fetch and simple games."],["Ball (Durable)",20,5,"A tougher ball that resists sharp teeth and extreme temperatures."],["Camping Heater",20,40,"Solar-powered, rechargeable heater for a tent. Runs eight hours on a full charge."],["Camping Stove (Gas)",20,120,"Small gas stove with two fuel canisters (six hours each). Extra canisters 10 P. (4 lbs)"],["Chew/String Toy",20,10,"A chew or string toy in assorted shapes for Pokémon enrichment."],["Chew/String Toy (Tough)",20,15,"A difficult-to-destroy chew or string toy, good for carnivorous Pokémon."],["Campfire Set",20,45,"Kit for cooking outdoors: lighter, fire starters, collapsible stand, tinfoil and a canteen."],["Curry Campfire Kit",20,80,"Everything for Galarian-style curry: pot, stand, fan, ladle and ingredients for 3 large pots. (4 lbs)"],["Frisbee",20,5,"A plastic disk for playing fetch."],["Tea Campfire Kit",20,30,"Metal teapot, four mugs and two starter boxes of teabags. (2 lbs)"],["Tray Feeder",20,100,"Collapsible feeder that attracts small wild Pokémon, depending on the bait. (10 lbs)"],["Feeder Fruit",20,100,"Bait that attracts avian and Bug-type Pokémon, and some furry Pokémon."],["Feeder Nectar",20,100,"Bait that attracts avian, Bug-type and some Grass-type Pokémon."],["Feeder Seeds",20,100,"Bait that attracts avian and small furry Pokémon."],["Ranger Styler",21,8000,"ILLEGAL to sell or buy. Electronic restraint system that makes a wild Pokémon Helpful for a time."],["Snag Machine",21,68000,"EXTREMELY ILLEGAL. Lets thrown Poké Balls capture owned Pokémon; fails on loyalty 3 or higher."],["Dynamax Band",21,48000,"Once per day near a Power Spot, a Pokémon with loyalty 2+ can Dynamax or Gigantamax for 1 minute."],["Mega Ring (Key Stone holder)",21,48000,"Once per day, a Pokémon with a Mega Stone and loyalty 2+ can Mega Evolve for 10 minutes. Needs a Key Stone."],["Mega Stone",21,98000,"A rare stone that enables Mega Evolution for one species."],["Key Stone",21,98000,"The stone worn in a Mega Ring to trigger Mega Evolution."],["Tera Orb",21,48000,"Once per day, a Pokémon with a Tera Type and loyalty 2+ can Terastallize for 10 minutes."],["Z-Ring",21,48000,"With a Z-Crystal attached, once per day a Pokémon with loyalty 2+ can use a Z-Move."],["Z-Crystal",21,98000,"Enables a specific type of Z-Move when used with a Z-Ring."],["Backpack",22,5,""],["Ball bearings (25)",22,10,""],["Bedroll",22,5,""],["Binoculars (Digital)",22,45,""],["Blanket",22,2,""],["Blanket (Winter)",22,10,""],["Block and Tackle",22,50,""],["Bolt Cutter",22,10,""],["Book (Hardcover)",22,10,""],["Book (Paperback)",22,5,""],["Bottle (Glass)",22,3,""],["Bottle (Metal)",22,8,""],["Briefcase",22,5,""],["Cable (Steel, 25 ft)",22,20,""],["Camera (Digital High End)",22,2850,""],["Camera (Digital)",22,450,""],["Camera (Film High End)",22,1050,""],["Canteen",22,5,""],["Case (Aluminum)",22,20,""],["Carabiner (4)",22,6,""],["Cell Phone",22,80,""],["Chain (10 ft)",22,5,""],["Chalk (10 Sticks)",22,1,""],["Clothes (Brand Names)",22,100,""],["Clothes (Custom-Fit High End)",22,1250,""],["Clothes (Designer Brands)",22,350,""],["Clothes (Camo Fatigue)",22,65,""],["Clothes (Generic Brands)",22,35,""],["Clothes (Workout / Outdoors)",22,20,""],["Computer (Desktop)",22,780,""],["Computer (Laptop)",22,1080,""],["Computer (Tablet)",22,880,""],["Cooler bag (Foldable)",22,10,""],["Crowbar",22,10,""],["Duct Tape",22,5,""],["Flashlight",22,2,""],["Flask",22,4,""],["Gas Mask",22,25,""],["Grappling Hook",22,10,""],["Hammer",22,10,""],["Hammer (Sledge)",22,15,""],["Handheld Transceiver (Pair)",22,60,""],["Ink (Bottle)",22,10,""],["Jacket (Rain)",22,65,""],["Jacket (Snow)",22,145,""],["Jacket (Windbreaker)",22,50,""],["Knife (Folding)",22,10,""],["Ladder (Folding, 10ft)",22,15,""],["Lantern (fuel)",22,20,""],["Lantern (battery)",22,20,""],["Lantern (solar)",22,45,""],["Lighter",22,2,""],["Lock (Combination)",22,5,""],["Lock (With Key)",22,6,""],["Luggage Bag (Wheeled)",22,5,""],["Messenger Bag",22,5,""],["Memory Stick (100gb)",22,45,""],["Metal Detector",22,30,""],["Mirror (Signal)",22,4,""],["Mobile Trailer Home (for 1)",22,19800,""],["Mobile Trailer Home (for 4)",22,39800,""],["Multi-Purpose Tool",22,20,""],["Nails (100)",22,5,""],["Night-Vision Goggles",22,350,""],["Nintendo Switch",22,350,""],["Padlock and Key",22,10,""],["Pencils (10 Coloring)",22,2,""],["Pencils (10 Graphite)",22,2,""],["Pens (10 Coloring)",22,2,""],["Pens (5 Writing)",22,2,""],["Pick",22,10,""],["Pitons (5)",22,5,""],["Pokémon Card Booster Pack",22,4,""],["Pole (Steel, 10 ft)",22,5,""],["Rope (50 ft)",22,5,""],["Saddle (Large)",22,35,""],["Saddle (Massive)",22,55,""],["Saddle (Small)",22,15,""],["Shovel (Folding)",22,10,""],["Smartphone",22,580,""],["Soap / Shampoo / Toothpaste",22,4,""],["Tent (Folding, Two-Person)",22,35,""],["Tarp (6x8 ft)",22,10,""],["Tarp (10x12 ft)",22,20,""],["Thermos",22,10,""],["Torch (5)",22,5,""],["Vehicle (Bus)",22,248800,""],["Vehicle (Car)",22,49800,""],["Vehicle (Camper)",22,124800,""],["Vehicle (Motorcycle)",22,4980,""],["Vehicle (Truck)",22,69800,""],["Vehicle (Van)",22,49800,""],["Vial",22,5,""],["Wallet",22,5,""],["Whistle",22,2,""],["Zip Ties (30)",22,10,""]];

/* The Sinnoh shop set: every shop in the campaign's shop inventories, at handbook prices with each shop's own markups.
   Each entry is [preset id, place id, shop name, note players see, items]; each item is [name, kind, price, stock (null = unlimited), description].
   The GM loads them from the Shop page; nothing is written until then. */
const SINNOH_SHOPS=[["twinleaf-town~twinleafgeneralstore","twinleaf-town","Twinleaf General Store","Fishing line and work boots; not much League gear.",[["Potion","Potions",25,null,"Heals a Pokémon 12 HP."],["Antidote","Status cures",120,null,"Cures a Pokémon or human of Poisoned or Toxified."],["Potion Water","Potions",100,null,"Heals a human 10 HP."],["Repel","Repels",150,null,"Wild Pokémon find the smell repulsive for one hour after applied, but may ignore it to protect something precious to them."],["Basic Ball","Poké Balls",100,3,"+5 to your capture roll."],["Fishing Kit","Packs and kits",250,null,"For trainers who are looking to lure underwater Pokémon to the surface. (8 lbs)"],["Mess Kit","Packs and kits",10,null,"Everything you need to enjoy a meal on the go. (1.5 lbs)"],["Canteen","General goods",5,null,""],["Rope (50 ft)","General goods",5,null,""],["Flashlight","General goods",2,null,""],["Backpack","General goods",5,null,""],["Clothes (Workout / Outdoors)","General goods",20,null,""]]],["sandgem-town~sandgemgeneralstore","sandgem-town","Sandgem General Store","Last real stock-up before Jubilife.",[["Potion","Potions",25,null,"Heals a Pokémon 12 HP."],["Super Potion","Potions",250,null,"Heals a Pokémon 24 HP."],["Antidote","Status cures",120,null,"Cures a Pokémon or human of Poisoned or Toxified."],["Paralyze Heal","Status cures",120,null,"Cures a Pokémon or human of Paralysis."],["Awakening","Status cures",120,null,"Cures a Pokémon or human of Drowsy."],["Potion Water","Potions",100,null,"Heals a human 10 HP."],["Repel","Repels",150,null,"Wild Pokémon find the smell repulsive for one hour after applied, but may ignore it to protect something precious to them."],["Basic Ball","Poké Balls",100,null,"+5 to your capture roll."],["Great Ball","Poké Balls",600,3,"+0 to your capture roll."],["Trainer’s Pack","Packs and kits",140,null,"Basic goods for a trainer who’s starting their journey. (5 lbs)"],["Traveler’s Pack","Packs and kits",150,null,"Really useful gear for extended travel through the wilds. (15 lbs)"],["Oran Berry","Berries",25,null,"Heals a Pokémon 5 HP."],["Pecha Berry","Berries",120,null,"Cures Poisoned and Toxified"]]],["sandgem-town~hawthornelabfrontdesk","sandgem-town","Hawthorne Lab front desk","At cost to licensed trainers. Lydia expects field notes in return.",[["Field Survey Kit","Packs and kits",200,null,"If any trainers want to do some research while out in the wilds, these tools will help. (8 lbs)"],["Studious Pack","Packs and kits",260,null,"Useful things for a trainer with a knack for academics. (10 lbs)"],["Book (Paperback)","General goods",5,null,""],["Vial","General goods",5,null,""]]],["jubilife-city~jubilifedepartmentstore","jubilife-city","Jubilife Department Store","Central Jubilife: prices 10% over book.",[["Potion","Potions",28,null,"Heals a Pokémon 12 HP."],["Super Potion","Potions",275,null,"Heals a Pokémon 24 HP."],["Hyper Potion","Potions",605,null,"Heals a Pokémon 36 HP."],["Max Potion","Potions",935,null,"Heals a Pokémon to their Max HP."],["Full Restore","Potions",1320,null,"Heals a Pokémon to their Max HP and cures them of any afflictions."],["Full Heal","Status cures",572,null,"Cures a Pokémon or human of all afflictions."],["Revive","Revives",1485,null,"Restore an unconscious Pokémon to half of its max HP."],["Ether","Energy",528,null,"A Pokémon’s strength is partially restored and regains a single use of one of its 3/day moves."],["Elixir","Energy",1408,3,"A Pokémon’s strength is partially Restored and regains a single use of one of its 1/day moves."],["Super Repel","Repels",440,null,"Wild Pokémon find the smell repulsive for three hours after applied, but may ignore it to protect something precious to them."],["Max Repel","Repels",1100,null,"Wild Pokémon find the smell repulsive for ten hours after applied, but may ignore it to protect something precious to them."],["Great Ball","Poké Balls",660,null,"+0 to your capture roll."],["Ultra Ball","Poké Balls",1100,null,"-5 from your capture roll."],["Heal Ball","Poké Balls",1100,null,"+0 to your capture roll. Captured Pokémon are healed 20 hit points."],["Luxury Ball","Poké Balls",1650,null,"-5 from your capture roll. Captured Pokémon are more easily befriended."],["Premier Ball","Poké Balls",1650,null,"-5 from your capture roll. Captured Pokémon are more easily befriended."],["HP Up","Vitamins",880,null,"Special order: arrives in 1d3 days. Increase HP by 4 for two weeks."],["Protein","Vitamins",880,null,"Special order: arrives in 1d3 days. Increase Attack by 1 for two weeks."],["Iron","Vitamins",880,null,"Special order: arrives in 1d3 days. Increase Defense by 1 for two weeks."],["Calcium","Vitamins",880,null,"Special order: arrives in 1d3 days. Increase Special Attack by 1 for two weeks."],["Zinc","Vitamins",880,null,"Special order: arrives in 1d3 days. Increase Special Defense by 1 for two weeks."],["Carbos","Vitamins",880,null,"Special order: arrives in 1d3 days. Increase speed by 1 for two weeks."],["Smartphone","General goods",638,null,""],["Computer (Laptop)","General goods",1188,null,""],["Computer (Tablet)","General goods",968,null,""],["Camera (Digital)","General goods",495,null,""],["Clothes (Designer Brands)","General goods",385,null,""]]],["jubilife-city~poketchcompanystore","jubilife-city","Pokétch Company Store","Headquarters showroom.",[["Pokétch","Tech",280,null,"Wrist-worn smart device connected to your phone or Pokédex: calls, GPS, trainer IDs and more."],["Signal Scanner","Utility",650,null,"Handheld device that detects nearby electronic signals (50ft), recent Poké Ball activity (2 minutes), and strong energy emissions nearby (150ft)."],["Solar Charger","Utility",50,null,"An unfolding solar panel that charges devices."],["Handheld Transceiver (Pair)","General goods",60,null,""],["Memory Stick (100gb)","General goods",45,null,""]]],["jubilife-city~trainerdistrictoutfitters","jubilife-city","Trainer District outfitters","Cheaper than downtown. Not every stall here is honest.",[["Basic Ball","Poké Balls",90,null,"+5 to your capture roll."],["Great Ball","Poké Balls",600,null,"+0 to your capture roll."],["Potion","Potions",25,null,"Heals a Pokémon 12 HP."],["Super Potion","Potions",250,null,"Heals a Pokémon 24 HP."],["Trainer’s Pack","Packs and kits",140,null,"Basic goods for a trainer who’s starting their journey. (5 lbs)"],["Traveler’s Pack","Packs and kits",150,null,"Really useful gear for extended travel through the wilds. (15 lbs)"],["Climber’s Pack","Packs and kits",350,null,"Steep routes, cliffs, and elevated terrain. (12 lbs)"],["Cooking Kit","Packs and kits",850,null,"For the chef on the go, in the wilds. (35 lbs)"],["Medical Field Kit","Packs and kits",1750,null,"Even if you’re not entirely sure how to use it, it’s very useful to have. (10 lbs)"],["Tent (Folding, Two-Person)","General goods",35,null,""],["Bedroll","General goods",5,null,""],["Lantern (solar)","General goods",45,null,""],["Folding Bicycle","Utility",950,null,"A 3-speed bike that folds onto itself. (25 lbs)"],["Grooming Kit","Packs and kits",150,null,"Your Pokémon will always look their best when you’re using this kit. (4 lbs)"]]],["jubilife-city~oldjubilifeproducemarket","jubilife-city","Old Jubilife produce market","Berries rotate with the season.",[["Moo Moo Milk","Potions",175,null,"Heals anything 8 HP. 164"],["Oran Berry","Berries",25,null,"Heals a Pokémon 5 HP."],["Sitrus Berry","Berries",120,null,"Heals a Pokémon 12 HP. (uncommon in the wild)"],["Cheri Berry","Berries",120,null,"Cures Paralysis"],["Chesto Berry","Berries",120,null,"Cures Drowsy"],["Pecha Berry","Berries",120,null,"Cures Poisoned and Toxified"],["Rawst Berry","Berries",120,null,"Cures Burns"],["Aspear Berry","Berries",120,null,"Cures Frostbite"],["Lum Berry","Berries",580,3,"Cures all Afflictions (uncommon in the wild)"],["Razz Berry","Berries",120,null,"No special effect; used for contest treats and berry food."],["Bluk Berry","Berries",120,null,"No special effect; used for contest treats and berry food."],["Nanab Berry","Berries",120,null,"No special effect; used for contest treats and berry food."],["Pinap Berry","Berries",120,null,"No special effect; used for contest treats and berry food."]]],["jubilife-city~junctionbattleplazastalls","jubilife-city","Junction Battle Plaza stalls","Battle supplies by the arenas.",[["X Attack","Battle boosters",240,null,"Gives a Pokémon Attack▲."],["X Defend","Battle boosters",240,null,"Gives a Pokémon Defense▲."],["X Special","Battle boosters",240,null,"Gives a Pokémon SpAttack▲."],["X Sp. Def","Battle boosters",240,null,"Gives a Pokémon SpDefense▲."],["X Speed","Battle boosters",240,null,"Gives a Pokémon Speed▲."],["X Accuracy","Battle boosters",240,null,"Increases a Pokémon’s AC by +1."],["Dire Hit","Battle boosters",840,null,"The next attack the Pokémon makes is Lethal."],["Guard Spec.","Battle boosters",440,null,"The next time the Pokémon would get ▼from a foe, ignore it."],["Ether","Energy",480,null,"A Pokémon’s strength is partially restored and regains a single use of one of its 3/day moves."],["Cell Battery","Held items",300,null,"When you are hit by a Electric-type attack, Cell Battery is destroyed and you get Attack▲."],["Absorb Bulb","Held items",300,null,"When you are hit by a Water-type attack, Absorb Bulb is destroyed and you get SpAttack▲."],["Snowball","Held items",300,null,"When you are hit by a Ice-type attack, Snowball is destroyed and you get Attack▲."],["Luminous Moss","Held items",300,null,"When you are hit by a Water-type attack, Luminous Moss is destroyed and you get SpDefense▲."],["White Herb","Held items",650,null,"As a free action, consume and destroy White Herb. Get rid of any ▼ that you have."],["Mental Herb","Held items",650,null,"As a free action, consume and destroy Mental Herb. If a foe does anything to try and prevent you from using any of your moves, it fails."],["Shed Shell","Held items",450,null,"As a free Reaction [When you become Bound by a foe], destroy Shed Shell. You are no longer Bound."]]],["oreburgh-city~oreburghmart","oreburgh-city","Oreburgh Mart","The best shopping street since Jubilife.",[["Potion","Potions",25,null,"Heals a Pokémon 12 HP."],["Super Potion","Potions",250,null,"Heals a Pokémon 24 HP."],["Hyper Potion","Potions",550,null,"Heals a Pokémon 36 HP."],["Full Heal","Status cures",520,null,"Cures a Pokémon or human of all afflictions."],["Revive","Revives",1350,null,"Restore an unconscious Pokémon to half of its max HP."],["Super Repel","Repels",400,null,"Wild Pokémon find the smell repulsive for three hours after applied, but may ignore it to protect something precious to them."],["Great Ball","Poké Balls",600,null,"+0 to your capture roll."],["Ultra Ball","Poké Balls",1000,null,"-5 from your capture roll."],["Heavy Ball","Poké Balls",1250,null,"-15 from your capture roll if the Pokémon is Heavy or Superweight."],["Super Soda","Potions",300,null,"Heals a human 20 HP."],["X Defend","Battle boosters",240,null,"Gives a Pokémon Defense▲."]]],["oreburgh-city~pitheadsupply","oreburgh-city","Pithead Supply","The miners' store.",[["Dig Kit","Packs and kits",150,null,"Whatever you’re looking for, this should help. (15 lbs)"],["Ruin Explorer’s Pack","Packs and kits",325,null,"Intended for trainers investigating ancient sites, abandoned structures, and lost routes. (11 lbs)"],["Pick","General goods",10,null,""],["Hammer (Sledge)","General goods",15,null,""],["Gas Mask","General goods",25,null,""],["Lantern (battery)","General goods",20,null,""],["Rope (50 ft)","General goods",5,null,""],["Hazmat Suit","Survival gear",750,null,"Full-body protective suit used to shield trainers from dangerous chemical, biological, radiological, or nuclear harms."],["Basic Tool Kit","Packs and kits",95,null,"Basic tools for basic repairs or maintenance. (8 lbs)"],["Hard Stone (Rock Elemental Boon)","Held items",1850,null,"Elemental Boons have many names and each correspond to each Pokémon type (Soft Sand for Ground, Silk Scarf for Normal, Never Melt Ice for Ice, etc.)."],["Iron Ball","Held items",1350,null,"If you are Featherweight (weight), you are treated as Light (weight). This is also true for Light to Medium and Medium to Heavy."]]],["alamos-town~alamosdairycooperative","alamos-town","Alamos Dairy Cooperative","Milk from the Upper Pastures, sold at the tasting counter.",[["Moo Moo Milk","Potions",140,null,"Heals anything 8 HP. 164"]]],["alamos-town~terracewoolshops","alamos-town","Terrace wool shops","Wool from the Upper Pastures.",[["Blanket","General goods",2,null,""],["Blanket (Winter)","General goods",10,null,""],["Clothes (Workout / Outdoors)","General goods",20,null,""],["Jacket (Snow)","General goods",145,null,""],["Sewing Kit","Packs and kits",325,null,"This is useful for the designer on the go. (20 lbs)"]]],["canalave-city~gantryandgale","canalave-city","Gantry and Gale","Ship chandlery that outfits half of Sinnoh's Rangers.",[["Coastal & Open Water Pack","Packs and kits",525,null,"For long island routes, shoreline travel, and open-water crossings. (11 lbs)"],["Diving Gear","Survival gear",1050,null,"Self contained underwater breathing apparatus . Allows for humans to explore underwater with enough air to breathe for two hours."],["Wet Suit","Survival gear",750,null,"Insulated body suit for diving in any waters. Includes gloves and flippers ."],["Climber’s Pack","Packs and kits",350,null,"Steep routes, cliffs, and elevated terrain. (12 lbs)"],["Rope (50 ft)","General goods",5,null,""],["Cable (Steel, 25 ft)","General goods",20,null,""],["Block and Tackle","General goods",50,null,""],["Lantern (fuel)","General goods",20,null,""],["Mirror (Signal)","General goods",4,null,""],["Handheld Transceiver (Pair)","General goods",60,null,""],["Dive Ball","Poké Balls",1250,null,"-12 from your capture roll if the Pokémon is in water."],["Net Ball","Poké Balls",1250,null,"-15 from your capture roll when used against a Bug or Water type Pokémon."]]],["canalave-city~quaysidemart","canalave-city","Quayside Mart","",[["Potion","Potions",25,null,"Heals a Pokémon 12 HP."],["Super Potion","Potions",250,null,"Heals a Pokémon 24 HP."],["Hyper Potion","Potions",550,null,"Heals a Pokémon 36 HP."],["Full Heal","Status cures",520,null,"Cures a Pokémon or human of all afflictions."],["Revive","Revives",1350,null,"Restore an unconscious Pokémon to half of its max HP."],["Super Repel","Repels",400,null,"Wild Pokémon find the smell repulsive for three hours after applied, but may ignore it to protect something precious to them."],["Great Ball","Poké Balls",600,null,"+0 to your capture roll."],["Ultra Ball","Poké Balls",1000,null,"-5 from your capture roll."],["Dive Ball","Poké Balls",1250,null,"-12 from your capture roll if the Pokémon is in water."],["Iron","Vitamins",800,3,"Increase Defense by 1 for two weeks."]]],["canalave-city~steelwrightshallcounter","canalave-city","Steelwrights' Hall counter","",[["Metal Coat (Steel Elemental Boon)","Held items",1850,null,"Elemental Boons have many names and each correspond to each Pokémon type (Soft Sand for Ground, Silk Scarf for Normal, Never Melt Ice for Ice, etc.)."],["Engineer’s Tool Kit","Packs and kits",1050,null,"If you’re building something on the go, or taking something else apart, maybe you’ll need this? (15 lbs)"],["Basic Tool Kit","Packs and kits",95,null,"Basic tools for basic repairs or maintenance. (8 lbs)"],["Poké Ball Smith Kit","Packs and kits",1250,null,"If you’re planning to make your own Poké Balls, this will be necessary. (15 lbs)"]]],["canalave-city~libraryhillbookshops","canalave-city","Library Hill bookshops","",[["Book (Hardcover)","General goods",10,null,""],["Book (Paperback)","General goods",5,null,""],["Studious Pack","Packs and kits",260,null,"Useful things for a trainer with a knack for academics. (10 lbs)"],["Drawing Kit","Packs and kits",35,null,"For an artist, or maybe just a doodler. (4 lbs)"],["Ink (Bottle)","General goods",10,null,""]]],["canalave-city~westmouthfishmarket","canalave-city","Westmouth fish market","",[["Fishing Kit","Packs and kits",250,null,"For trainers who are looking to lure underwater Pokémon to the surface. (8 lbs)"],["Cooler bag (Foldable)","General goods",10,null,""],["Thermos","General goods",10,null,""]]],["floaroma-town~floaromaflowershop","floaroma-town","Floaroma Flower Shop","Doubles as a trainer supply store. Antidotes and Pecha are cheaper than in the city.",[["Potion","Potions",25,null,"Heals a Pokémon 12 HP."],["Super Potion","Potions",250,null,"Heals a Pokémon 24 HP."],["Antidote","Status cures",100,null,"Cures a Pokémon or human of Poisoned or Toxified."],["Paralyze Heal","Status cures",120,null,"Cures a Pokémon or human of Paralysis."],["Awakening","Status cures",120,null,"Cures a Pokémon or human of Drowsy."],["Repel","Repels",150,null,"Wild Pokémon find the smell repulsive for one hour after applied, but may ignore it to protect something precious to them."],["Basic Ball","Poké Balls",100,null,"+5 to your capture roll."],["Great Ball","Poké Balls",600,null,"+0 to your capture roll."],["Pecha Berry","Berries",100,null,"Cures Poisoned and Toxified"],["Oran Berry","Berries",25,null,"Heals a Pokémon 5 HP."],["Cheri Berry","Berries",120,null,"Cures Paralysis"],["Chesto Berry","Berries",120,null,"Cures Drowsy"],["Miracle Seed (Grass Elemental Boon)","Held items",1850,3,"Elemental Boons have many names and each correspond to each Pokémon type (Soft Sand for Ground, Silk Scarf for Normal, Never Melt Ice for Ice, etc.)."]]],["floaroma-town~honeycooperativestall","floaroma-town","Honey cooperative stall","Sweet berries for Contest treats.",[["Pecha Berry","Berries",120,null,"Cures Poisoned and Toxified"],["Nanab Berry","Berries",120,null,"No special effect; used for contest treats and berry food."],["Magost Berry","Berries",120,null,"No special effect; used for contest treats and berry food."]]],["chocovine-town~vinecourtfactoryshop","chocovine-town","Vinecourt factory shop","Tours end here.",[["Poffin (level 1)","Contest",980,null,"A contest treat (level 1). Raises a contest stat by 1; the flavor decides which."],["Poffin (level 2)","Contest",1880,null,"A contest treat (level 2). Raises a contest stat by 2; the flavor decides which."],["Poffin (level 3)","Contest",2780,3,"A contest treat (level 3). Raises a contest stat by 3; the flavor decides which."],["Moo Moo Milk","Potions",175,null,"Heals anything 8 HP. 164"]]],["chocovine-town~thepoffinhouse","chocovine-town","The Poffin House","Stove rental by the hour; ask at the counter. Berries rotate with the season.",[["Bluk Berry","Berries",120,null,"No special effect; used for contest treats and berry food."],["Nanab Berry","Berries",120,null,"No special effect; used for contest treats and berry food."],["Pinap Berry","Berries",120,null,"No special effect; used for contest treats and berry food."],["Razz Berry","Berries",120,null,"No special effect; used for contest treats and berry food."],["Wepear Berry","Berries",120,null,"No special effect; used for contest treats and berry food."],["Cornn Berry","Berries",120,null,"No special effect; used for contest treats and berry food."],["Magost Berry","Berries",120,null,"No special effect; used for contest treats and berry food."],["Rabuta Berry","Berries",120,null,"No special effect; used for contest treats and berry food."],["Nomel Berry","Berries",120,null,"No special effect; used for contest treats and berry food."],["Spelon Berry","Berries",120,null,"No special effect; used for contest treats and berry food."],["Pamtre Berry","Berries",120,null,"No special effect; used for contest treats and berry food."],["Watmel Berry","Berries",120,null,"No special effect; used for contest treats and berry food."],["Durin Berry","Berries",120,null,"No special effect; used for contest treats and berry food."],["Belue Berry","Berries",120,null,"No special effect; used for contest treats and berry food."]]],["chocovine-town~nibstreetgeneralstore","chocovine-town","Nib Street general store","",[["Potion","Potions",25,null,"Heals a Pokémon 12 HP."],["Super Potion","Potions",250,null,"Heals a Pokémon 24 HP."],["Full Heal","Status cures",520,null,"Cures a Pokémon or human of all afflictions."],["Repel","Repels",150,null,"Wild Pokémon find the smell repulsive for one hour after applied, but may ignore it to protect something precious to them."],["Great Ball","Poké Balls",600,null,"+0 to your capture roll."],["Cooking Kit","Packs and kits",850,null,"For the chef on the go, in the wilds. (35 lbs)"],["Mess Kit","Packs and kits",10,null,"Everything you need to enjoy a meal on the go. (1.5 lbs)"]]],["chocovine-town~hallrowcostumerooms","chocovine-town","Hall Row costume rooms","",[["Beautiful Bandanna","Contest",2280,null,"Beauty contest stat is +2 while worn."],["Clever Cravat","Contest",2280,null,"Clever contest stat is +2 while worn."],["Cool Kerchief","Contest",2280,null,"Cool contest stat is +2 while worn."],["Cute Comforter","Contest",2280,null,"Cute contest stat is +2 while worn."],["Tough Tippet","Contest",2280,null,"Tough contest stat is +2 while worn."],["Performer’s Pack","Packs and kits",700,null,"Perfect for trainers who travel as entertainers, coordinators, or influencers. (9 lbs)"],["Sewing Kit","Packs and kits",325,null,"This is useful for the designer on the go. (20 lbs)"],["Make Up Kit","Packs and kits",150,null,"You will always look your best when you’re with this kit. (4 lbs)"]]],["squallville~callowaydaughterschandlery","squallville","Calloway & Daughters Chandlery","The best waterproofs in the west. Boat hire at the counter.",[["Extreme Weather Pack","Packs and kits",425,null,"For routes with dangerous or unpredictable weather conditions. (7 lbs)"],["Coastal & Open Water Pack","Packs and kits",525,null,"For long island routes, shoreline travel, and open-water crossings. (11 lbs)"],["Jacket (Rain)","General goods",65,null,""],["Lantern (fuel)","General goods",20,null,""],["Rope (50 ft)","General goods",5,null,""],["Mirror (Signal)","General goods",4,null,""],["Fishing Kit","Packs and kits",250,null,"For trainers who are looking to lure underwater Pokémon to the surface. (8 lbs)"],["Wet Suit","Survival gear",750,null,"Insulated body suit for diving in any waters. Includes gloves and flippers ."],["Damp Rock (Weather Rock)","Held items",450,null,"These items are named after the Weather, Terrain, or Zone that the held item affects (Sunny Rock, Tricky Rock, Grassy Rock, etc.)."],["Dive Ball","Poké Balls",1250,null,"-12 from your capture roll if the Pokémon is in water."],["Net Ball","Poké Balls",1250,null,"-15 from your capture roll when used against a Bug or Water type Pokémon."]]],["squallville~leecenterstormstock","squallville","Lee Center storm stock","Extra stock behind the Center counter.",[["Super Potion","Potions",250,null,"Heals a Pokémon 24 HP."],["Full Heal","Status cures",520,3,"Cures a Pokémon or human of all afflictions."],["Revive","Revives",1350,3,"Restore an unconscious Pokémon to half of its max HP."]]],["sandalstraw-town~threshingyardmarket","sandalstraw-town","Threshing Yard market","Woven straw goods and Guild trail footwear.",[["Clothes (Workout / Outdoors)","General goods",20,null,""],["Blanket (Winter)","General goods",10,null,""],["Jacket (Snow)","General goods",145,null,""],["Moon Ball","Poké Balls",1250,3,"-10 from your capture roll if the Pokémon evolves with an evolution stone."]]],["sandalstraw-town~readeoutfitters","sandalstraw-town","Reade Outfitters","Factory copies of Guild footwear at half the craft price.",[["Arctic Travel Pack","Packs and kits",575,null,"For exposure to cold climates and snow-covered routes. (14 lbs)"],["Traveler’s Pack","Packs and kits",150,null,"Really useful gear for extended travel through the wilds. (15 lbs)"],["Climber’s Pack","Packs and kits",350,null,"Steep routes, cliffs, and elevated terrain. (12 lbs)"],["Blizzard Wear","Survival gear",1050,null,"Carefully made clothes for humans protect them from harmful hail and snowstorms."],["Lantern (battery)","General goods",20,null,""]]],["eterna-city~oldtownmart","eterna-city","Old Town Mart","",[["Potion","Potions",25,null,"Heals a Pokémon 12 HP."],["Super Potion","Potions",250,null,"Heals a Pokémon 24 HP."],["Hyper Potion","Potions",550,null,"Heals a Pokémon 36 HP."],["Antidote","Status cures",120,null,"Cures a Pokémon or human of Poisoned or Toxified."],["Burn Heal","Status cures",120,null,"Cures a Pokémon or human of Burned."],["Awakening","Status cures",120,null,"Cures a Pokémon or human of Drowsy."],["Full Heal","Status cures",520,null,"Cures a Pokémon or human of all afflictions."],["Revive","Revives",1350,null,"Restore an unconscious Pokémon to half of its max HP."],["Super Repel","Repels",400,null,"Wild Pokémon find the smell repulsive for three hours after applied, but may ignore it to protect something precious to them."],["Great Ball","Poké Balls",600,null,"+0 to your capture roll."],["Ultra Ball","Poké Balls",1000,null,"-5 from your capture roll."],["Nest Ball","Poké Balls",1250,null,"-10 from your capture roll if the Pokémon can evolve, but is not evolved."],["Net Ball","Poké Balls",1250,null,"-15 from your capture roll when used against a Bug or Water type Pokémon."]]],["eterna-city~thebikeshop","eterna-city","The Bike Shop","Gateway to the Cycling Road; one-way rentals to Oreburgh.",[["Folding Bicycle","Utility",950,null,"A 3-speed bike that folds onto itself. (25 lbs)"],["Basic Tool Kit","Packs and kits",95,null,"Basic tools for basic repairs or maintenance. (8 lbs)"],["Clothes (Workout / Outdoors)","General goods",20,null,""]]],["eterna-city~greenwayherbalist","eterna-city","Greenway herbalist","",[["Heal Powder","Herbs",480,null,"Removes any affliction"],["Energy Powder","Herbs",125,null,"Recovers 30 Hit Points (Pokémon)"],["Energy Root","Herbs",400,null,"Recovers 48 Hit Points (Pokémon)"],["Revival Herb","Herbs",1000,null,"Recovers an unconscious Pokémon to half of their max HP."],["Big Root","Held items",2550,3,"Whenever you would recover HP or gain temporary HP after dealing damage to a foe, gain +1d4 temporary HP."],["Grassy Seed (Terrain Seed)","Held items",450,null,"These items are named after the Weather, Terrain, or Zone that the held item affects (Rainy Seed, Gravity Seed, Electric Seed, etc.)."]]],["hearthome-city~pokeballboutique","hearthome-city","Poké Ball Boutique","Custom Ball seals and capsules.",[["Cherish Ball","Poké Balls",1500,null,"-5 from your capture roll. Captured Pokémon are more easily befriended."],["Luxury Ball","Poké Balls",1500,null,"-5 from your capture roll. Captured Pokémon are more easily befriended."],["Premier Ball","Poké Balls",1500,null,"-5 from your capture roll. Captured Pokémon are more easily befriended."],["Friend Ball","Poké Balls",1000,null,"+0 to your capture roll. Captured Pokémon are more easily befriended."],["Heal Ball","Poké Balls",1000,null,"+0 to your capture roll. Captured Pokémon are healed 20 hit points."],["Great Ball","Poké Balls",600,null,"+0 to your capture roll."]]],["hearthome-city~supercontesthallshop","hearthome-city","Super Contest Hall shop","",[["Beautiful Bandanna","Contest",2280,null,"Beauty contest stat is +2 while worn."],["Clever Cravat","Contest",2280,null,"Clever contest stat is +2 while worn."],["Cool Kerchief","Contest",2280,null,"Cool contest stat is +2 while worn."],["Cute Comforter","Contest",2280,null,"Cute contest stat is +2 while worn."],["Tough Tippet","Contest",2280,null,"Tough contest stat is +2 while worn."],["Poffin (level 1)","Contest",980,null,"A contest treat (level 1). Raises a contest stat by 1; the flavor decides which."],["Poffin (level 2)","Contest",1880,null,"A contest treat (level 2). Raises a contest stat by 2; the flavor decides which."],["Poffin (level 3)","Contest",2780,null,"A contest treat (level 3). Raises a contest stat by 3; the flavor decides which."],["Performer’s Pack","Packs and kits",700,null,"Perfect for trainers who travel as entertainers, coordinators, or influencers. (9 lbs)"],["Make Up Kit","Packs and kits",150,null,"You will always look your best when you’re with this kit. (4 lbs)"],["Grooming Kit","Packs and kits",150,null,"Your Pokémon will always look their best when you’re using this kit. (4 lbs)"]]],["hearthome-city~plazamart","hearthome-city","Plaza Mart","",[["Potion","Potions",25,null,"Heals a Pokémon 12 HP."],["Super Potion","Potions",250,null,"Heals a Pokémon 24 HP."],["Hyper Potion","Potions",550,null,"Heals a Pokémon 36 HP."],["Max Potion","Potions",850,null,"Heals a Pokémon to their Max HP."],["Full Heal","Status cures",520,null,"Cures a Pokémon or human of all afflictions."],["Revive","Revives",1350,null,"Restore an unconscious Pokémon to half of its max HP."],["Ether","Energy",480,null,"A Pokémon’s strength is partially restored and regains a single use of one of its 3/day moves."],["Super Repel","Repels",400,null,"Wild Pokémon find the smell repulsive for three hours after applied, but may ignore it to protect something precious to them."],["Great Ball","Poké Balls",600,null,"+0 to your capture roll."],["Ultra Ball","Poké Balls",1000,null,"-5 from your capture roll."],["Dusk Ball","Poké Balls",1150,null,"-7 from your capture roll if it’s night time (no sunlight)."],["X Attack","Battle boosters",240,null,"Gives a Pokémon Attack▲."],["X Defend","Battle boosters",240,null,"Gives a Pokémon Defense▲."],["X Special","Battle boosters",240,null,"Gives a Pokémon SpAttack▲."],["X Sp. Def","Battle boosters",240,null,"Gives a Pokémon SpDefense▲."],["X Speed","Battle boosters",240,null,"Gives a Pokémon Speed▲."],["X Accuracy","Battle boosters",240,null,"Increases a Pokémon’s AC by +1."]]],["hearthome-city~riversidecurioshops","hearthome-city","Riverside curio shops","",[["Spell Tag (Ghost Elemental Boon)","Held items",1850,null,"Elemental Boons have many names and each correspond to each Pokémon type (Soft Sand for Ground, Silk Scarf for Normal, Never Melt Ice for Ice, etc.)."],["Silk Scarf (Normal Elemental Boon)","Held items",1850,null,"Elemental Boons have many names and each correspond to each Pokémon type (Soft Sand for Ground, Silk Scarf for Normal, Never Melt Ice for Ice, etc.)."],["Bright Powder","Held items",850,null,"As a free action, destroy Bright Powder. Until your next turn, if you are targeted by an attack, the attacker must roll +2 higher in order to hit you during AC."],["Clothes (Designer Brands)","General goods",350,null,""],["Camera (Film High End)","General goods",1050,null,""]]],["hearthome-city~riversideauctionhouse","hearthome-city","Riverside auction house","Monthly auction; lots vary.",[["Elemental Plate (choose a type)","Held items",19800,3,"Elemental Plates are rare artifacts named per Pokémon type (Bug Plate, Dark Plate, etc.)."],["Fire Stone","Evolution stones",9800,3,"Induces evolution in certain species of Pokémon."],["Water Stone","Evolution stones",9800,3,"Induces evolution in certain species of Pokémon."],["Thunder Stone","Evolution stones",9800,3,"Induces evolution in certain species of Pokémon."],["Leaf Stone","Evolution stones",9800,3,"Induces evolution in certain species of Pokémon."],["Moon Stone","Evolution stones",9800,3,"Induces evolution in certain species of Pokémon."]]],["solaceon-town~marketrowdaycaresupply","solaceon-town","Market Row Day Care supply","",[["Egg Incubator","Utility",1350,null,"Egg incubators are electronic, reusable containers that safely keep and warm Pokémon eggs. (15 lbs)"],["Destiny Knot","Held items",1750,null,"When you become Entranced, the Pokémon who caused your Entranced becomes Entranced with you as well."],["Portable Berry Planter","Utility",2800,null,"By planting a berry in a portable berry planter, you create a mini-ecosystem for the berry to rapidly grow into a fruit bearing shrub, often producing two or even three…"],["Grooming Kit","Packs and kits",150,null,"Your Pokémon will always look their best when you’re using this kit. (4 lbs)"],["Moo Moo Milk","Potions",175,null,"Heals anything 8 HP. 164"],["Oran Berry","Berries",25,null,"Heals a Pokémon 5 HP."],["Sitrus Berry","Berries",120,null,"Heals a Pokémon 12 HP. (uncommon in the wild)"],["Pecha Berry","Berries",120,null,"Cures Poisoned and Toxified"],["Rawst Berry","Berries",120,null,"Cures Burns"]]],["solaceon-town~marketrowsecondhandbooks","solaceon-town","Market Row secondhand books","",[["Book (Paperback)","General goods",5,null,""],["Book (Hardcover)","General goods",10,null,""],["Studious Pack","Packs and kits",260,null,"Useful things for a trainer with a knack for academics. (10 lbs)"]]],["solaceon-town~solaceoncentercounterextras","solaceon-town","Solaceon Center counter extras","",[["Super Potion","Potions",250,null,"Heals a Pokémon 24 HP."],["Full Heal","Status cures",520,null,"Cures a Pokémon or human of all afflictions."],["Great Ball","Poké Balls",600,null,"+0 to your capture roll."]]],["emeragrove-town~hedgerowglasshouses","emeragrove-town","Hedge Row glasshouses","",[["Sitrus Berry","Berries",120,null,"Heals a Pokémon 12 HP. (uncommon in the wild)"],["Lum Berry","Berries",580,3,"Cures all Afflictions (uncommon in the wild)"],["Oran Berry","Berries",25,null,"Heals a Pokémon 5 HP."],["Energy Root","Herbs",400,null,"Recovers 48 Hit Points (Pokémon)"],["Heal Powder","Herbs",480,null,"Removes any affliction"],["Portable Berry Planter","Utility",2800,null,"By planting a berry in a portable berry planter, you create a mini-ecosystem for the berry to rapidly grow into a fruit bearing shrub, often producing two or even three…"],["Grassy Seed (Terrain Seed)","Held items",450,null,"These items are named after the Weather, Terrain, or Zone that the held item affects (Rainy Seed, Gravity Seed, Electric Seed, etc.)."]]],["emeragrove-town~thehumhouse","emeragrove-town","The Hum House","Honey, and sweet berries for treats.",[["Pecha Berry","Berries",120,null,"Cures Poisoned and Toxified"],["Nanab Berry","Berries",120,null,"No special effect; used for contest treats and berry food."],["Magost Berry","Berries",120,null,"No special effect; used for contest treats and berry food."]]],["emeragrove-town~thehushtearoom","emeragrove-town","The Hush Tea Room","Famous for Hush tea.",[["Moo Moo Milk","Potions",175,null,"Heals anything 8 HP. 164"]]],["celestic-town~belllanegeneralstore","celestic-town","Bell Lane general store","",[["Potion","Potions",25,null,"Heals a Pokémon 12 HP."],["Super Potion","Potions",250,null,"Heals a Pokémon 24 HP."],["Awakening","Status cures",120,null,"Cures a Pokémon or human of Drowsy."],["Antidote","Status cures",120,null,"Cures a Pokémon or human of Poisoned or Toxified."],["Repel","Repels",150,null,"Wild Pokémon find the smell repulsive for one hour after applied, but may ignore it to protect something precious to them."],["Great Ball","Poké Balls",600,null,"+0 to your capture roll."],["Climber’s Pack","Packs and kits",350,null,"Steep routes, cliffs, and elevated terrain. (12 lbs)"],["Ruin Explorer’s Pack","Packs and kits",325,null,"Intended for trainers investigating ancient sites, abandoned structures, and lost routes. (11 lbs)"],["Spiritualist’ Pack","Packs and kits",140,null,"For those who travel and spread the word of various greater beings. (5 lbs)"],["Lantern (fuel)","General goods",20,null,""]]],["celestic-town~weavinghallstall","celestic-town","Weaving Hall stall","Woven goods and wind bells.",[["Blanket (Winter)","General goods",10,null,""]]],["michina-town~tallowtwine","michina-town","Tallow & Twine","General store and expedition outfitter. In winter, prices rise 15%.",[["Potion","Potions",25,null,"Heals a Pokémon 12 HP."],["Super Potion","Potions",250,null,"Heals a Pokémon 24 HP."],["Full Heal","Status cures",520,3,"Cures a Pokémon or human of all afflictions."],["Repel","Repels",150,null,"Wild Pokémon find the smell repulsive for one hour after applied, but may ignore it to protect something precious to them."],["Great Ball","Poké Balls",600,null,"+0 to your capture roll."],["Climber’s Pack","Packs and kits",350,null,"Steep routes, cliffs, and elevated terrain. (12 lbs)"],["Arctic Travel Pack","Packs and kits",575,null,"For exposure to cold climates and snow-covered routes. (14 lbs)"],["Pitons (5)","General goods",5,null,""],["Rope (50 ft)","General goods",5,null,""],["Blanket (Winter)","General goods",10,null,""],["Lantern (fuel)","General goods",20,null,""],["Dig Kit","Packs and kits",150,null,"Whatever you’re looking for, this should help. (15 lbs)"],["Ruin Explorer’s Pack","Packs and kits",325,null,"Intended for trainers investigating ancient sites, abandoned structures, and lost routes. (11 lbs)"]]],["pastoria-city~ringdistrictmart","pastoria-city","Ring District Mart","",[["Potion","Potions",25,null,"Heals a Pokémon 12 HP."],["Super Potion","Potions",250,null,"Heals a Pokémon 24 HP."],["Hyper Potion","Potions",550,null,"Heals a Pokémon 36 HP."],["Max Potion","Potions",850,null,"Heals a Pokémon to their Max HP."],["Full Heal","Status cures",520,null,"Cures a Pokémon or human of all afflictions."],["Revive","Revives",1350,null,"Restore an unconscious Pokémon to half of its max HP."],["Super Repel","Repels",400,null,"Wild Pokémon find the smell repulsive for three hours after applied, but may ignore it to protect something precious to them."],["Great Ball","Poké Balls",600,null,"+0 to your capture roll."],["Ultra Ball","Poké Balls",1000,null,"-5 from your capture roll."],["Net Ball","Poké Balls",1250,null,"-15 from your capture roll when used against a Bug or Water type Pokémon."],["Dive Ball","Poké Balls",1250,null,"-12 from your capture roll if the Pokémon is in water."],["Mystic Water (Water Elemental Boon)","Held items",1850,null,"Elemental Boons have many names and each correspond to each Pokémon type (Soft Sand for Ground, Silk Scarf for Normal, Never Melt Ice for Ice, etc.)."]]],["pastoria-city~reedmarket","pastoria-city","Reedmarket","Floating stalls that move with the tide. Some stalls fence poached goods.",[["Antidote","Status cures",100,null,"Cures a Pokémon or human of Poisoned or Toxified."],["Pecha Berry","Berries",100,null,"Cures Poisoned and Toxified"],["Swamp & Wetlands Pack","Packs and kits",575,null,"Built for travel through marshes, bogs, and flooded wilds. (10 lbs)"],["Fishing Kit","Packs and kits",250,null,"For trainers who are looking to lure underwater Pokémon to the surface. (8 lbs)"],["Rope (50 ft)","General goods",5,null,""]]],["pastoria-city~orrellberrygardens","pastoria-city","Orrell Berry Gardens","Seed swaps on weekends. Berries rotate with the season.",[["Sitrus Berry","Berries",120,null,"Heals a Pokémon 12 HP. (uncommon in the wild)"],["Lum Berry","Berries",580,null,"Cures all Afflictions (uncommon in the wild)"],["Rindo Berry","Berries",540,null,"Protection from Grass. (uncommon in the wild)"],["Passho Berry","Berries",540,null,"Protection from Water. (uncommon in the wild)"],["Wacan Berry","Berries",540,null,"Protection from Electric. (uncommon in the wild)"],["Kebia Berry","Berries",540,null,"Protection from Poison. (uncommon in the wild)"],["Shuca Berry","Berries",540,null,"Protection from Ground. (uncommon in the wild)"],["Pomeg Berry","Berries",1080,3,"When you have ▼ you get a matching ▲. (rare in the wild)"],["Portable Berry Planter","Utility",2800,null,"By planting a berry in a portable berry planter, you create a mini-ecosystem for the berry to rapidly grow into a fruit bearing shrub, often producing two or even three…"]]],["pastoria-city~marshcliniccounter","pastoria-city","Marsh Clinic counter","The \"Venom Lab\".",[["Antidote","Status cures",120,null,"Cures a Pokémon or human of Poisoned or Toxified."],["Full Heal","Status cures",520,null,"Cures a Pokémon or human of all afflictions."],["Medical Field Kit","Packs and kits",1750,null,"Even if you’re not entirely sure how to use it, it’s very useful to have. (10 lbs)"],["Hazmat Suit","Survival gear",750,null,"Full-body protective suit used to shield trainers from dangerous chemical, biological, radiological, or nuclear harms."]]],["majolica-town~glazehallshop","majolica-town","Glaze Hall shop","",[["Beautiful Bandanna","Contest",2280,null,"Beauty contest stat is +2 while worn."],["Cute Comforter","Contest",2280,null,"Cute contest stat is +2 while worn."],["Cool Kerchief","Contest",2280,null,"Cool contest stat is +2 while worn."],["Poffin (level 1)","Contest",980,null,"A contest treat (level 1). Raises a contest stat by 1; the flavor decides which."],["Poffin (level 2)","Contest",1880,null,"A contest treat (level 2). Raises a contest stat by 2; the flavor decides which."],["Make Up Kit","Packs and kits",150,null,"You will always look your best when you’re with this kit. (4 lbs)"],["Performer’s Pack","Packs and kits",700,null,"Perfect for trainers who travel as entertainers, coordinators, or influencers. (9 lbs)"]]],["majolica-town~kilnrowsupply","majolica-town","Kiln Row supply","Tiles and pottery too.",[["Charcoal (Fire Elemental Boon)","Held items",1850,null,"Elemental Boons have many names and each correspond to each Pokémon type (Soft Sand for Ground, Silk Scarf for Normal, Never Melt Ice for Ice, etc.)."],["Heat Rock (Weather Rock)","Held items",450,null,"These items are named after the Weather, Terrain, or Zone that the held item affects (Sunny Rock, Tricky Rock, Grassy Rock, etc.)."],["Basic Tool Kit","Packs and kits",95,null,"Basic tools for basic repairs or maintenance. (8 lbs)"],["Drawing Kit","Packs and kits",35,null,"For an artist, or maybe just a doodler. (4 lbs)"]]],["majolica-town~glazequartergeneralstore","majolica-town","Glaze Quarter general store","",[["Potion","Potions",25,null,"Heals a Pokémon 12 HP."],["Super Potion","Potions",250,null,"Heals a Pokémon 24 HP."],["Burn Heal","Status cures",120,null,"Cures a Pokémon or human of Burned."],["Full Heal","Status cures",520,null,"Cures a Pokémon or human of all afflictions."],["Repel","Repels",150,null,"Wild Pokémon find the smell repulsive for one hour after applied, but may ignore it to protect something precious to them."],["Great Ball","Poké Balls",600,null,"+0 to your capture roll."],["Ultra Ball","Poké Balls",1000,null,"-5 from your capture roll."]]],["sage-town~thebundledhour","sage-town","The Bundled Hour","Mother Verbena's apothecary. Mints are special order.",[["Heal Powder","Herbs",480,null,"Removes any affliction"],["Energy Powder","Herbs",125,null,"Recovers 30 Hit Points (Pokémon)"],["Energy Root","Herbs",400,null,"Recovers 48 Hit Points (Pokémon)"],["Revival Herb","Herbs",1000,null,"Recovers an unconscious Pokémon to half of their max HP."],["White Herb","Held items",650,null,"As a free action, consume and destroy White Herb. Get rid of any ▼ that you have."],["Mental Herb","Held items",650,null,"As a free action, consume and destroy Mental Herb. If a foe does anything to try and prevent you from using any of your moves, it fails."],["Power Herb","Held items",850,null,"As a free Reaction [When you use a move with multiple turns], consume and destroy Power Herb."],["Mirror Herb","Held items",350,null,"As a free Reaction [When a foe gets▲], consume and destroy Mental Herb. Gain the same ▲that the foe just gained."],["Cinnaleaf Mint","Mints",8750,null,"Special order: arrives in 1d3 days. Raise Attack 1 point, then lower a non-Attack non-HP stat 1 point."],["Stonebalm Mint","Mints",8750,null,"Special order: arrives in 1d3 days. Raise Defense 1 point, then lower a non-Defense non-HP stat 1 point."],["Spearmist Mint","Mints",8750,null,"Special order: arrives in 1d3 days. Raise Special Attack 1 point, then lower a non-Special Attack non-HP stat 1 point."],["Calmrest Mint","Mints",8750,null,"Special order: arrives in 1d3 days. Raise Special Defense 1 point, then lower a non-Special Defense non-HP stat 1 point."],["Lightwind Mint","Mints",8750,null,"Special order: arrives in 1d3 days. Raise Speed 1 point, then lower a non-Speed non-HP stat 1 point."],["Pureleaf Mint","Mints",8750,null,"Special order: arrives in 1d3 days. Do not add to or subtract from any stats after removing the effects of the Pokémon’s Nature."]]],["sage-town~saltroadmarket","sage-town","Salt Road Market","Spice stalls; prices set in the weighing hall.",[["Cheri Berry","Berries",120,null,"Cures Paralysis"],["Razz Berry","Berries",120,null,"No special effect; used for contest treats and berry food."],["Nomel Berry","Berries",120,null,"No special effect; used for contest treats and berry food."],["Spelon Berry","Berries",120,null,"No special effect; used for contest treats and berry food."],["Figy Berry","Berries",850,null,"Heals 1/3 of a Pokémon’s max HP, then they are Confused. (uncommon in the wild)"],["Tamato Berry","Berries",680,3,"When you have Speed▼ you get Speed▲. (rare in the wild)"],["Cooking Kit","Packs and kits",850,null,"For the chef on the go, in the wilds. (35 lbs)"],["Mess Kit","Packs and kits",10,null,"Everything you need to enjoy a meal on the go. (1.5 lbs)"]]],["sage-town~sagecenterherbtonics","sage-town","Sage Center herb tonics","",[["Energy Powder","Herbs",125,null,"Recovers 30 Hit Points (Pokémon)"],["Heal Powder","Herbs",480,null,"Removes any affliction"]]],["sage-town~smokehouserow","sage-town","Smokehouse Row","Smoked fish and trail rations.",[["Thermos","General goods",10,null,""],["Canteen","General goods",5,null,""]]],["veilstone-city~veilstonedeptstoremedicine","veilstone-city","Veilstone Dept. Store: medicine","Best-stocked store in eastern Sinnoh.",[["Potion","Potions",25,null,"Heals a Pokémon 12 HP."],["Super Potion","Potions",250,null,"Heals a Pokémon 24 HP."],["Hyper Potion","Potions",550,null,"Heals a Pokémon 36 HP."],["Max Potion","Potions",850,null,"Heals a Pokémon to their Max HP."],["Full Restore","Potions",1200,null,"Heals a Pokémon to their Max HP and cures them of any afflictions."],["Full Heal","Status cures",520,null,"Cures a Pokémon or human of all afflictions."],["Revive","Revives",1350,null,"Restore an unconscious Pokémon to half of its max HP."],["Ether","Energy",480,null,"A Pokémon’s strength is partially restored and regains a single use of one of its 3/day moves."],["Elixir","Energy",1280,null,"A Pokémon’s strength is partially Restored and regains a single use of one of its 1/day moves."],["X Attack","Battle boosters",240,null,"Gives a Pokémon Attack▲."],["X Defend","Battle boosters",240,null,"Gives a Pokémon Defense▲."],["X Special","Battle boosters",240,null,"Gives a Pokémon SpAttack▲."],["X Sp. Def","Battle boosters",240,null,"Gives a Pokémon SpDefense▲."],["X Speed","Battle boosters",240,null,"Gives a Pokémon Speed▲."],["X Accuracy","Battle boosters",240,null,"Increases a Pokémon’s AC by +1."],["Dire Hit","Battle boosters",840,null,"The next attack the Pokémon makes is Lethal."],["Guard Spec.","Battle boosters",440,null,"The next time the Pokémon would get ▼from a foe, ignore it."],["Super Repel","Repels",400,null,"Wild Pokémon find the smell repulsive for three hours after applied, but may ignore it to protect something precious to them."],["Max Repel","Repels",1000,null,"Wild Pokémon find the smell repulsive for ten hours after applied, but may ignore it to protect something precious to them."]]],["veilstone-city~veilstonedeptstorepokeballs","veilstone-city","Veilstone Dept. Store: Poké Balls","",[["Great Ball","Poké Balls",600,null,"+0 to your capture roll."],["Ultra Ball","Poké Balls",1000,null,"-5 from your capture roll."],["Quick Ball","Poké Balls",1550,null,"-16 from your capture roll if thrown as your first action during combat."],["Timer Ball","Poké Balls",1450,null,"-10 from your capture roll if the encounter has lasted at least one min; -18 from your capture roll if the encounter has lasted at least two mins."],["Repeat Ball","Poké Balls",1250,null,"-10 from your capture roll if the Pokémon already had a Poké Ball thrown at it this encounter."],["Fast Ball","Poké Balls",1250,null,"-8 from your capture roll on a Pokémon that acts before your Pokémon."],["Level Ball","Poké Balls",1250,null,"-10 from your capture roll if the Pokémon is fully evolved, and did evolve at least once."],["Luxury Ball","Poké Balls",1500,null,"-5 from your capture roll. Captured Pokémon are more easily befriended."]]],["veilstone-city~veilstonedeptstoretms","veilstone-city","Veilstone Dept. Store: TMs","Rotating stock: ask which moves are in.",[["TM (At-Will)","TMs and TRs",4800,null,"Teaches an at-will move. 3 uses."],["TM (3/day)","TMs and TRs",11800,null,"Teaches a 3/day move. 3 uses."],["TM (1/day)","TMs and TRs",26800,null,"Teaches a 1/day move. 3 uses."],["TR (At-Will)","TMs and TRs",2400,null,"Teaches an at-will move. 1 use."],["TR (3/day)","TMs and TRs",5900,null,"Teaches a 3/day move. 1 use."],["TR (1/day)","TMs and TRs",13400,null,"Teaches a 1/day move. 1 use."]]],["veilstone-city~veilstonedeptstorehelditems","veilstone-city","Veilstone Dept. Store: held items","",[["Choice Band","Held items",2550,null,"Your Attack stat is +2. Whenever you use a move, that is the only move you can use for the rest of the encounter."],["Choice Scarf","Held items",2550,null,"Your Speed stat is +2. Whenever you use a move, that is the only move you can use for the rest of the encounter."],["Choice Specs","Held items",2550,null,"Your Special Attack stat is +2. Whenever you use a move, that is the only move you can use for the rest of the encounter."],["Life Orb","Held items",2550,null,"Your attacks have +1d6 power. After acting, no matter what actions you take, you lose 1d6 HP."],["Leftovers","Held items",2550,null,"As an action, consume and destroy Leftovers. Regain 1d6 HP after acting until you are at max HP."],["Focus Sash","Held items",2550,null,"If you would be knocked out from a single attack when you were at max hit points, instead you are set to 1 hit point once per battle."],["Expert Belt","Held items",2550,null,"When you hit with a super-effective or extremely-effective attack, deal an additional +2 damage."],["Assault Vest","Held items",2550,null,"Your Special Defense is +2. You may not use moves that do not have power."],["Muscle Band","Held items",3550,null,"Your Physical attacks deal +1 damage."],["Wise Glasses","Held items",3550,null,"Your Special attacks deal +1 damage."],["Scope Lens","Held items",2550,null,"On your first single-target ranged attack per day, the attack gains the following effect: “This attack is Lethal.”"],["Quick Claw","Held items",2550,null,"On your first single-target melee attack with at-will frequency per day, the attack gains the following effect: “This attack has Priority.”"],["Air Balloon","Held items",1350,null,"You are immune to Ground-type attacks. If you are hit by any other type of attack, Air Balloon is destroyed."],["Eviolite","Held items",2550,null,"If you can still potentially evolve, your Defense and Special Defense stats are +1."]]],["veilstone-city~veilstonedeptstorevitaminsandstones","veilstone-city","Veilstone Dept. Store: vitamins and stones","",[["HP Up","Vitamins",800,null,"Increase HP by 4 for two weeks."],["Protein","Vitamins",800,null,"Increase Attack by 1 for two weeks."],["Iron","Vitamins",800,null,"Increase Defense by 1 for two weeks."],["Calcium","Vitamins",800,null,"Increase Special Attack by 1 for two weeks."],["Zinc","Vitamins",800,null,"Increase Special Defense by 1 for two weeks."],["Carbos","Vitamins",800,null,"Increase speed by 1 for two weeks."],["PP UP","Vitamins",1200,null,"Increase the frequency of a 3/day move to 4/day for one week."],["PP Max","Vitamins",1900,null,"Increase the frequency of a 1/day move to 2/day(1/combat) for one week."],["Fire Stone","Evolution stones",9800,3,"Induces evolution in certain species of Pokémon."],["Water Stone","Evolution stones",9800,3,"Induces evolution in certain species of Pokémon."],["Thunder Stone","Evolution stones",9800,3,"Induces evolution in certain species of Pokémon."],["Leaf Stone","Evolution stones",9800,3,"Induces evolution in certain species of Pokémon."],["Moon Stone","Evolution stones",9800,3,"Induces evolution in certain species of Pokémon."]]],["veilstone-city~veilstonedeptstorefashion","veilstone-city","Veilstone Dept. Store: fashion","",[["Clothes (Designer Brands)","General goods",350,null,""],["Clothes (Brand Names)","General goods",100,null,""],["Clothes (Custom-Fit High End)","General goods",1250,null,""]]],["veilstone-city~cliffwalkdojoshop","veilstone-city","Cliff Walk dojo shop","",[["Black Belt (Fighting Elemental Boon)","Held items",1850,null,"Elemental Boons have many names and each correspond to each Pokémon type (Soft Sand for Ground, Silk Scarf for Normal, Never Melt Ice for Ice, etc.)."],["Protective Pads","Held items",2550,null,"If you would be damaged as a result of making a melee attack against a foe by a foe’s passive or other effect, ignore that damage."],["Muscle Band","Held items",3550,null,"Your Physical attacks deal +1 damage."],["Super Soda","Potions",300,null,"Heals a human 20 HP."]]],["crown-city~bellweatherdaughters","crown-city","Bellweather & Daughters","Travel outfitters on the Terrace: 15% over book.",[["Traveler’s Pack","Packs and kits",173,null,"Really useful gear for extended travel through the wilds. (15 lbs)"],["Climber’s Pack","Packs and kits",403,null,"Steep routes, cliffs, and elevated terrain. (12 lbs)"],["Coastal & Open Water Pack","Packs and kits",604,null,"For long island routes, shoreline travel, and open-water crossings. (11 lbs)"],["Extreme Weather Pack","Packs and kits",489,null,"For routes with dangerous or unpredictable weather conditions. (7 lbs)"],["Cooking Kit","Packs and kits",978,null,"For the chef on the go, in the wilds. (35 lbs)"],["Camera Bag","Packs and kits",253,null,"Everything you need as a traveling photographer, minus the camera. (3 lbs)"],["Folding Bicycle","Utility",1093,null,"A 3-speed bike that folds onto itself. (25 lbs)"]]],["crown-city~anchorcompasschandlery","crown-city","Anchor & Compass Chandlery","Ropes, lamps and tide tables.",[["Rope (50 ft)","General goods",5,null,""],["Lantern (fuel)","General goods",20,null,""],["Lantern (solar)","General goods",45,null,""],["Mirror (Signal)","General goods",4,null,""],["Wet Suit","Survival gear",750,null,"Insulated body suit for diving in any waters. Includes gloves and flippers ."],["Diving Gear","Survival gear",1050,null,"Self contained underwater breathing apparatus . Allows for humans to explore underwater with enough air to breathe for two hours."],["Dive Ball","Poké Balls",1250,null,"-12 from your capture roll if the Pokémon is in water."]]],["crown-city~marrowmedicalsupply","crown-city","Marrow Medical Supply","",[["Max Potion","Potions",850,null,"Heals a Pokémon to their Max HP."],["Full Restore","Potions",1200,null,"Heals a Pokémon to their Max HP and cures them of any afflictions."],["Full Heal","Status cures",520,null,"Cures a Pokémon or human of all afflictions."],["Revive","Revives",1350,null,"Restore an unconscious Pokémon to half of its max HP."],["Max Revive","Revives",2950,3,"Restore an unconscious Pokémon to its max HP."],["Max Ether","Energy",2280,null,"A Pokémon’s strength is partially restored. Choose two 3/day and/or 1/day moves to restore one each of the moves uses."],["Medical Field Kit","Packs and kits",1750,null,"Even if you’re not entirely sure how to use it, it’s very useful to have. (10 lbs)"]]],["crown-city~theribbonwalk","crown-city","The Ribbon Walk","Contest supply shops, ribbon-makers and costume rooms.",[["Beautiful Bandanna","Contest",2280,null,"Beauty contest stat is +2 while worn."],["Clever Cravat","Contest",2280,null,"Clever contest stat is +2 while worn."],["Cool Kerchief","Contest",2280,null,"Cool contest stat is +2 while worn."],["Cute Comforter","Contest",2280,null,"Cute contest stat is +2 while worn."],["Tough Tippet","Contest",2280,null,"Tough contest stat is +2 while worn."],["Poffin (level 1)","Contest",980,null,"A contest treat (level 1). Raises a contest stat by 1; the flavor decides which."],["Poffin (level 2)","Contest",1880,null,"A contest treat (level 2). Raises a contest stat by 2; the flavor decides which."],["Poffin (level 3)","Contest",2780,null,"A contest treat (level 3). Raises a contest stat by 3; the flavor decides which."],["Performer’s Pack","Packs and kits",700,null,"Perfect for trainers who travel as entertainers, coordinators, or influencers. (9 lbs)"],["Make Up Kit","Packs and kits",150,null,"You will always look your best when you’re with this kit. (4 lbs)"],["Sewing Kit","Packs and kits",325,null,"This is useful for the designer on the go. (20 lbs)"],["Clothes (Custom-Fit High End)","General goods",1250,null,""],["Cherish Ball","Poké Balls",1500,null,"-5 from your capture roll. Captured Pokémon are more easily befriended."]]],["crown-city~crownexchangebulkberryfloor","crown-city","Crown Exchange bulk berry floor","By the crate, 10% off book; minimum 10.",[["Sitrus Berry","Berries",108,null,"Heals a Pokémon 12 HP. (uncommon in the wild)"],["Lum Berry","Berries",522,null,"Cures all Afflictions (uncommon in the wild)"],["Cheri Berry","Berries",108,null,"Cures Paralysis"],["Chesto Berry","Berries",108,null,"Cures Drowsy"],["Pecha Berry","Berries",108,null,"Cures Poisoned and Toxified"],["Rawst Berry","Berries",108,null,"Cures Burns"],["Aspear Berry","Berries",108,null,"Cures Frostbite"],["Persim Berry","Berries",108,null,"Cures Confused"]]],["arrowroot-town~bakersrowpoffincounters","arrowroot-town","Bakers' Row Poffin counters","The cheapest place in Sinnoh to feed a Pokémon well: 10% off.",[["Poffin (level 1)","Contest",882,null,"A contest treat (level 1). Raises a contest stat by 1; the flavor decides which."],["Poffin (level 2)","Contest",1692,null,"A contest treat (level 2). Raises a contest stat by 2; the flavor decides which."],["Poffin (level 3)","Contest",2502,3,"A contest treat (level 3). Raises a contest stat by 3; the flavor decides which."],["Moo Moo Milk","Potions",175,null,"Heals anything 8 HP. 164"]]],["arrowroot-town~junctiongeneralstore","arrowroot-town","Junction general store","",[["Potion","Potions",25,null,"Heals a Pokémon 12 HP."],["Super Potion","Potions",250,null,"Heals a Pokémon 24 HP."],["Full Heal","Status cures",520,null,"Cures a Pokémon or human of all afflictions."],["Repel","Repels",150,null,"Wild Pokémon find the smell repulsive for one hour after applied, but may ignore it to protect something precious to them."],["Great Ball","Poké Balls",600,null,"+0 to your capture roll."],["Traveler’s Pack","Packs and kits",150,null,"Really useful gear for extended travel through the wilds. (15 lbs)"],["Tent (Folding, Two-Person)","General goods",35,null,""]]],["brussel-town~oldsquaremarket","brussel-town","Old Square market","",[["Miracle Seed (Grass Elemental Boon)","Held items",1850,null,"Elemental Boons have many names and each correspond to each Pokémon type (Soft Sand for Ground, Silk Scarf for Normal, Never Melt Ice for Ice, etc.)."],["Grassy Seed (Terrain Seed)","Held items",450,null,"These items are named after the Weather, Terrain, or Zone that the held item affects (Rainy Seed, Gravity Seed, Electric Seed, etc.)."],["Big Root","Held items",2550,3,"Whenever you would recover HP or gain temporary HP after dealing damage to a foe, gain +1d4 temporary HP."],["Sitrus Berry","Berries",120,null,"Heals a Pokémon 12 HP. (uncommon in the wild)"],["Rindo Berry","Berries",540,null,"Protection from Grass. (uncommon in the wild)"]]],["brussel-town~sawyersrowsupply","brussel-town","Sawyers' Row supply","",[["Basic Tool Kit","Packs and kits",95,null,"Basic tools for basic repairs or maintenance. (8 lbs)"],["Rope (50 ft)","General goods",5,null,""],["Ladder (Folding, 10ft)","General goods",15,null,""],["Gas Mask","General goods",25,null,""],["Lantern (battery)","General goods",20,null,""]]],["neighborly-town~gatemarket","neighborly-town","Gate Market","Cheap Contest costumes: knock-offs, 10% off.",[["Beautiful Bandanna","Contest",2050,null,"Beauty contest stat is +2 while worn."],["Clever Cravat","Contest",2050,null,"Clever contest stat is +2 while worn."],["Cool Kerchief","Contest",2050,null,"Cool contest stat is +2 while worn."],["Cute Comforter","Contest",2050,null,"Cute contest stat is +2 while worn."],["Tough Tippet","Contest",2050,null,"Tough contest stat is +2 while worn."],["Traveler’s Pack","Packs and kits",150,null,"Really useful gear for extended travel through the wilds. (15 lbs)"],["Trainer’s Pack","Packs and kits",140,null,"Basic goods for a trainer who’s starting their journey. (5 lbs)"],["Bedroll","General goods",5,null,""],["Potion","Potions",25,null,"Heals a Pokémon 12 HP."],["Super Potion","Potions",250,null,"Heals a Pokémon 24 HP."],["Antidote","Status cures",120,null,"Cures a Pokémon or human of Poisoned or Toxified."],["Oran Berry","Berries",25,null,"Heals a Pokémon 5 HP."],["Pecha Berry","Berries",120,null,"Cures Poisoned and Toxified"]]],["neighborly-town~lanternrowgeneralstore","neighborly-town","Lantern Row general store","",[["Repel","Repels",150,null,"Wild Pokémon find the smell repulsive for one hour after applied, but may ignore it to protect something precious to them."],["Super Repel","Repels",400,null,"Wild Pokémon find the smell repulsive for three hours after applied, but may ignore it to protect something precious to them."],["Great Ball","Poké Balls",600,null,"+0 to your capture roll."],["Ultra Ball","Poké Balls",1000,null,"-5 from your capture roll."],["Full Heal","Status cures",520,null,"Cures a Pokémon or human of all afflictions."],["Revive","Revives",1350,null,"Restore an unconscious Pokémon to half of its max HP."]]],["daybreak-town~harborcoopcounter","daybreak-town","Harbor Co-op counter","",[["Fishing Kit","Packs and kits",250,null,"For trainers who are looking to lure underwater Pokémon to the surface. (8 lbs)"],["Dive Ball","Poké Balls",1250,null,"-12 from your capture roll if the Pokémon is in water."],["Net Ball","Poké Balls",1250,null,"-15 from your capture roll when used against a Bug or Water type Pokémon."],["Wet Suit","Survival gear",750,null,"Insulated body suit for diving in any waters. Includes gloves and flippers ."],["Potion","Potions",25,null,"Heals a Pokémon 12 HP."],["Super Potion","Potions",250,null,"Heals a Pokémon 24 HP."],["Repel","Repels",150,null,"Wild Pokémon find the smell repulsive for one hour after applied, but may ignore it to protect something precious to them."]]],["daybreak-town~breakfastpier","daybreak-town","Breakfast Pier","Opens at four in the morning.",[["Moo Moo Milk","Potions",175,null,"Heals anything 8 HP. 164"],["Super Soda","Potions",300,null,"Heals a human 20 HP."]]],["camellia-town~presslanecooperative","camellia-town","Press Lane Cooperative","Camellia lamp oil and hair oil.",[["Lantern (fuel)","General goods",20,null,""],["Soap / Shampoo / Toothpaste","General goods",4,null,""]]],["camellia-town~roadgateshop","camellia-town","Road Gate shop","",[["Potion","Potions",25,null,"Heals a Pokémon 12 HP."],["Antidote","Status cures",120,null,"Cures a Pokémon or human of Poisoned or Toxified."],["Repel","Repels",150,null,"Wild Pokémon find the smell repulsive for one hour after applied, but may ignore it to protect something precious to them."],["Great Ball","Poké Balls",600,null,"+0 to your capture roll."],["Potion Water","Potions",100,null,"Heals a human 10 HP."]]],["sunyshore-city~harborsidemart","sunyshore-city","Harborside Mart","Last stop before the League ferries.",[["Hyper Potion","Potions",550,null,"Heals a Pokémon 36 HP."],["Max Potion","Potions",850,null,"Heals a Pokémon to their Max HP."],["Full Restore","Potions",1200,null,"Heals a Pokémon to their Max HP and cures them of any afflictions."],["Full Heal","Status cures",520,null,"Cures a Pokémon or human of all afflictions."],["Revive","Revives",1350,null,"Restore an unconscious Pokémon to half of its max HP."],["Max Revive","Revives",2950,3,"Restore an unconscious Pokémon to its max HP."],["Max Ether","Energy",2280,null,"A Pokémon’s strength is partially restored. Choose two 3/day and/or 1/day moves to restore one each of the moves uses."],["Max Elixir","Energy",3480,3,"A Pokémon’s strength is partially restored. Choose two 3/day and/or 1/day moves to restore all of the moves uses."],["Max Repel","Repels",1000,null,"Wild Pokémon find the smell repulsive for ten hours after applied, but may ignore it to protect something precious to them."],["Ultra Ball","Poké Balls",1000,null,"-5 from your capture roll."],["Quick Ball","Poké Balls",1550,null,"-16 from your capture roll if thrown as your first action during combat."],["Timer Ball","Poké Balls",1450,null,"-10 from your capture roll if the encounter has lasted at least one min; -18 from your capture roll if the encounter has lasted at least two mins."]]],["sunyshore-city~kestrelcablesgear","sunyshore-city","Kestrel Cables & Gear","Insulated gloves and charge packs.",[["Cell Battery","Held items",300,null,"When you are hit by a Electric-type attack, Cell Battery is destroyed and you get Attack▲."],["Magnet (Electric Elemental Boon)","Held items",1850,null,"Elemental Boons have many names and each correspond to each Pokémon type (Soft Sand for Ground, Silk Scarf for Normal, Never Melt Ice for Ice, etc.)."],["Electric Seed (Terrain Seed)","Held items",450,null,"These items are named after the Weather, Terrain, or Zone that the held item affects (Rainy Seed, Gravity Seed, Electric Seed, etc.)."],["Solar Charger","Utility",50,null,"An unfolding solar panel that charges devices."],["Signal Scanner","Utility",650,null,"Handheld device that detects nearby electronic signals (50ft), recent Poké Ball activity (2 minutes), and strong energy emissions nearby (150ft)."]]],["sunyshore-city~thebrasslamp","sunyshore-city","The Brass Lamp","Antique lanterns too; ask the owner.",[["Lantern (fuel)","General goods",20,null,""],["Lantern (battery)","General goods",20,null,""],["Lantern (solar)","General goods",45,null,""]]],["sunyshore-city~marketpier","sunyshore-city","Market Pier","Repair booths and a Camellia-tea stand.",[["Fishing Kit","Packs and kits",250,null,"For trainers who are looking to lure underwater Pokémon to the surface. (8 lbs)"],["Thermos","General goods",10,null,""]]],["greenstation-town~lastlayeroutfitters","greenstation-town","Last Layer Outfitters","Rent at 10% of the price per day. Winter prices 10% higher.",[["Arctic Travel Pack","Packs and kits",575,null,"For exposure to cold climates and snow-covered routes. (14 lbs)"],["Blizzard Wear","Survival gear",1050,null,"Carefully made clothes for humans protect them from harmful hail and snowstorms."],["Extreme Weather Pack","Packs and kits",425,null,"For routes with dangerous or unpredictable weather conditions. (7 lbs)"],["Climber’s Pack","Packs and kits",350,null,"Steep routes, cliffs, and elevated terrain. (12 lbs)"],["Jacket (Snow)","General goods",145,null,""],["Blanket (Winter)","General goods",10,null,""],["Pitons (5)","General goods",5,null,""],["Rope (50 ft)","General goods",5,null,""],["Thermos","General goods",10,null,""],["Icy Rock (Weather Rock)","Held items",450,null,"These items are named after the Weather, Terrain, or Zone that the held item affects (Sunny Rock, Tricky Rock, Grassy Rock, etc.)."]]],["greenstation-town~theturntablemarket","greenstation-town","The Turntable market","",[["Potion","Potions",25,null,"Heals a Pokémon 12 HP."],["Super Potion","Potions",250,null,"Heals a Pokémon 24 HP."],["Ice Heal","Status cures",120,null,"Cures a Pokémon or human of Frostbite."],["Full Heal","Status cures",520,null,"Cures a Pokémon or human of all afflictions."],["Super Repel","Repels",400,null,"Wild Pokémon find the smell repulsive for three hours after applied, but may ignore it to protect something precious to them."],["Great Ball","Poké Balls",600,null,"+0 to your capture roll."],["Ultra Ball","Poké Balls",1000,null,"-5 from your capture roll."],["Aspear Berry","Berries",120,null,"Cures Frostbite"],["Super Soda","Potions",300,null,"Heals a human 20 HP."]]],["greenstation-town~rivaloutfitter","greenstation-town","Rival outfitter","Rents Magby as warming companions. The Rangers object.",[["Blizzard Wear","Survival gear",945,null,"Carefully made clothes for humans protect them from harmful hail and snowstorms."]]],["snowpoint-city~southgatemart","snowpoint-city","Southgate Mart","",[["Potion","Potions",25,null,"Heals a Pokémon 12 HP."],["Super Potion","Potions",250,null,"Heals a Pokémon 24 HP."],["Hyper Potion","Potions",550,null,"Heals a Pokémon 36 HP."],["Max Potion","Potions",850,null,"Heals a Pokémon to their Max HP."],["Ice Heal","Status cures",120,null,"Cures a Pokémon or human of Frostbite."],["Full Heal","Status cures",520,null,"Cures a Pokémon or human of all afflictions."],["Revive","Revives",1350,null,"Restore an unconscious Pokémon to half of its max HP."],["Super Repel","Repels",400,null,"Wild Pokémon find the smell repulsive for three hours after applied, but may ignore it to protect something precious to them."],["Max Repel","Repels",1000,null,"Wild Pokémon find the smell repulsive for ten hours after applied, but may ignore it to protect something precious to them."],["Great Ball","Poké Balls",600,null,"+0 to your capture roll."],["Ultra Ball","Poké Balls",1000,null,"-5 from your capture roll."],["Dusk Ball","Poké Balls",1150,null,"-7 from your capture roll if it’s night time (no sunlight)."]]],["snowpoint-city~patrolhousesupply","snowpoint-city","Patrol House supply","",[["Arctic Travel Pack","Packs and kits",575,null,"For exposure to cold climates and snow-covered routes. (14 lbs)"],["Blizzard Wear","Survival gear",1050,null,"Carefully made clothes for humans protect them from harmful hail and snowstorms."],["Medical Field Kit","Packs and kits",1750,null,"Even if you’re not entirely sure how to use it, it’s very useful to have. (10 lbs)"],["Handheld Transceiver (Pair)","General goods",60,null,""],["Mirror (Signal)","General goods",4,null,""],["Lantern (battery)","General goods",20,null,""]]],["snowpoint-city~floeharborcoop","snowpoint-city","Floe Harbor Co-op","Ice-hole tackle and weather lore.",[["Fishing Kit","Packs and kits",250,null,"For trainers who are looking to lure underwater Pokémon to the surface. (8 lbs)"],["Never-Melt Ice (Ice Elemental Boon)","Held items",1850,null,"Elemental Boons have many names and each correspond to each Pokémon type (Soft Sand for Ground, Silk Scarf for Normal, Never Melt Ice for Ice, etc.)."],["Icy Rock (Weather Rock)","Held items",450,null,"These items are named after the Weather, Terrain, or Zone that the held item affects (Sunny Rock, Tricky Rock, Grassy Rock, etc.)."],["Snowball","Held items",300,null,"When you are hit by a Ice-type attack, Snowball is destroyed and you get Attack▲."]]],["snowpoint-city~frosthallcontestshop","snowpoint-city","Frost Hall Contest shop","",[["Cool Kerchief","Contest",2280,null,"Cool contest stat is +2 while worn."],["Beautiful Bandanna","Contest",2280,null,"Beauty contest stat is +2 while worn."],["Poffin (level 1)","Contest",980,null,"A contest treat (level 1). Raises a contest stat by 1; the flavor decides which."]]],["lilypad-town~steamrowcraftshops","lilypad-town","Steam Row craft shops","",[["Soap / Shampoo / Toothpaste","General goods",4,null,""],["Blanket (Winter)","General goods",10,null,""],["Make Up Kit","Packs and kits",150,null,"You will always look your best when you’re with this kit. (4 lbs)"],["Beautiful Bandanna","Contest",2280,null,"Beauty contest stat is +2 while worn."],["Cute Comforter","Contest",2280,null,"Cute contest stat is +2 while worn."]]],["lilypad-town~terracedgardensstall","lilypad-town","Terraced Gardens stall","Winter greens and soup too.",[["Sitrus Berry","Berries",120,null,"Heals a Pokémon 12 HP. (uncommon in the wild)"],["Aspear Berry","Berries",120,null,"Cures Frostbite"],["Rawst Berry","Berries",120,null,"Cures Burns"]]],["lilypad-town~depotyardgeneralstore","lilypad-town","Depot Yard general store","",[["Potion","Potions",25,null,"Heals a Pokémon 12 HP."],["Super Potion","Potions",250,null,"Heals a Pokémon 24 HP."],["Ice Heal","Status cures",120,null,"Cures a Pokémon or human of Frostbite."],["Repel","Repels",150,null,"Wild Pokémon find the smell repulsive for one hour after applied, but may ignore it to protect something precious to them."],["Great Ball","Poké Balls",600,null,"+0 to your capture roll."],["Jacket (Snow)","General goods",145,null,""],["Shovel (Folding)","General goods",10,null,""]]],["shelter-town~lamprowoilstore","shelter-town","Lamp Row oil store","",[["Lantern (fuel)","General goods",20,null,""],["Lantern (solar)","General goods",45,null,""],["Torch (5)","General goods",5,null,""],["Lighter","General goods",2,null,""]]],["shelter-town~weaversyards","shelter-town","Weavers' Yards","Shelter scarves, sold across Sinnoh.",[["Blanket (Winter)","General goods",10,null,""],["Clothes (Workout / Outdoors)","General goods",20,null,""],["Cozy Scarf","Clothing and armor",800,null,"+2 to a Insight skill check. You can use only one clothing or equipment bonus per day."]]],["shelter-town~sheltercentercounterextras","shelter-town","Shelter Center counter extras","",[["Ice Heal","Status cures",120,null,"Cures a Pokémon or human of Frostbite."],["Super Potion","Potions",250,null,"Heals a Pokémon 24 HP."],["Full Heal","Status cures",520,3,"Cures a Pokémon or human of all afflictions."]]],["iron-island~moonrunwaitinghousecounter","iron-island","Moon Run Waiting House counter","Ferried in: 10% over book.",[["Potion","Potions",28,null,"Heals a Pokémon 12 HP."],["Super Potion","Potions",275,null,"Heals a Pokémon 24 HP."],["Repel","Repels",165,null,"Wild Pokémon find the smell repulsive for one hour after applied, but may ignore it to protect something precious to them."],["Great Ball","Poké Balls",660,null,"+0 to your capture roll."],["Heavy Ball","Poké Balls",1375,null,"-15 from your capture roll if the Pokémon is Heavy or Superweight."],["Lantern (battery)","General goods",22,null,""],["Gas Mask","General goods",28,null,""]]],["iron-island~tallyhallminersstore","iron-island","Tally Hall miners' store","",[["Pick","General goods",10,null,""],["Hammer (Sledge)","General goods",15,null,""],["Dig Kit","Packs and kits",150,null,"Whatever you’re looking for, this should help. (15 lbs)"],["Metal Coat (Steel Elemental Boon)","Held items",1850,null,"Elemental Boons have many names and each correspond to each Pokémon type (Soft Sand for Ground, Silk Scarf for Normal, Never Melt Ice for Ice, etc.)."],["Iron Ball","Held items",1350,null,"If you are Featherweight (weight), you are treated as Light (weight). This is also true for Light to Medium and Medium to Heavy."]]],["dandelion-island~fluffmarket","dandelion-island","Fluff Market","Dandelion Down pillows and quilts.",[["Blanket","General goods",2,null,""],["Blanket (Winter)","General goods",10,null,""],["Sharp Beak (Flying Elemental Boon)","Held items",1850,3,"Elemental Boons have many names and each correspond to each Pokémon type (Soft Sand for Ground, Silk Scarf for Normal, Never Melt Ice for Ice, etc.)."]]],["dandelion-island~windwrightsyard","dandelion-island","Windwright's Yard","Wind chimes and mill parts.",[["Basic Tool Kit","Packs and kits",105,null,"Basic tools for basic repairs or maintenance. (8 lbs)"]]],["champions-port~registrarsrowleaguesupply","champions-port","Registrar's Row League Supply","Ferried in: 10% over book.",[["Max Potion","Potions",935,null,"Heals a Pokémon to their Max HP."],["Full Restore","Potions",1320,null,"Heals a Pokémon to their Max HP and cures them of any afflictions."],["Full Heal","Status cures",572,null,"Cures a Pokémon or human of all afflictions."],["Revive","Revives",1485,null,"Restore an unconscious Pokémon to half of its max HP."],["Max Revive","Revives",3245,null,"Restore an unconscious Pokémon to its max HP."],["Max Ether","Energy",2508,null,"A Pokémon’s strength is partially restored. Choose two 3/day and/or 1/day moves to restore one each of the moves uses."],["Max Elixir","Energy",3828,null,"A Pokémon’s strength is partially restored. Choose two 3/day and/or 1/day moves to restore all of the moves uses."],["X Attack","Battle boosters",264,null,"Gives a Pokémon Attack▲."],["X Defend","Battle boosters",264,null,"Gives a Pokémon Defense▲."],["X Special","Battle boosters",264,null,"Gives a Pokémon SpAttack▲."],["X Sp. Def","Battle boosters",264,null,"Gives a Pokémon SpDefense▲."],["X Speed","Battle boosters",264,null,"Gives a Pokémon Speed▲."],["X Accuracy","Battle boosters",264,null,"Increases a Pokémon’s AC by +1."],["Dire Hit","Battle boosters",924,null,"The next attack the Pokémon makes is Lethal."],["Guard Spec.","Battle boosters",484,null,"The next time the Pokémon would get ▼from a foe, ignore it."],["Ultra Ball","Poké Balls",1100,null,"-5 from your capture roll."]]],["champions-port~netstreetfishmarket","champions-port","Net Street Fish Market","Smoked fish and stew.",[["Moo Moo Milk","Potions",175,null,"Heals anything 8 HP. 164"]]],["champions-port~resthousevending","champions-port","Rest House vending","",[["Super Soda","Potions",330,null,"Heals a human 20 HP."],["Hyper Lemonade","Potions",605,null,"Heals a human 30 HP."],["Potion Water","Potions",110,null,"Heals a human 10 HP."]]],["elite-four-island~trainerquartermart","elite-four-island","Trainer Quarter Mart","Ferried in: 10% over book.",[["Max Potion","Potions",935,null,"Heals a Pokémon to their Max HP."],["Full Restore","Potions",1320,null,"Heals a Pokémon to their Max HP and cures them of any afflictions."],["Full Heal","Status cures",572,null,"Cures a Pokémon or human of all afflictions."],["Revive","Revives",1485,null,"Restore an unconscious Pokémon to half of its max HP."],["Max Revive","Revives",3245,null,"Restore an unconscious Pokémon to its max HP."],["Max Ether","Energy",2508,null,"A Pokémon’s strength is partially restored. Choose two 3/day and/or 1/day moves to restore one each of the moves uses."],["Max Elixir","Energy",3828,null,"A Pokémon’s strength is partially restored. Choose two 3/day and/or 1/day moves to restore all of the moves uses."],["X Attack","Battle boosters",264,null,"Gives a Pokémon Attack▲."],["X Defend","Battle boosters",264,null,"Gives a Pokémon Defense▲."],["X Special","Battle boosters",264,null,"Gives a Pokémon SpAttack▲."],["X Sp. Def","Battle boosters",264,null,"Gives a Pokémon SpDefense▲."],["X Speed","Battle boosters",264,null,"Gives a Pokémon Speed▲."],["X Accuracy","Battle boosters",264,null,"Increases a Pokémon’s AC by +1."],["Dire Hit","Battle boosters",924,null,"The next attack the Pokémon makes is Lethal."],["Guard Spec.","Battle boosters",484,null,"The next time the Pokémon would get ▼from a foe, ignore it."],["Ultra Ball","Poké Balls",1100,null,"-5 from your capture roll."],["Clothes (Brand Names)","General goods",110,null,""],["Camera (Digital)","General goods",495,null,""]]],["elite-four-island~halloffamegiftshop","elite-four-island","Hall of Fame gift shop","",[["Book (Hardcover)","General goods",11,null,""],["Premier Ball","Poké Balls",1650,null,"-5 from your capture roll. Captured Pokémon are more easily befriended."]]],["resort-area~tidewrackoutfitters","resort-area","Tidewrack Outfitters","Gear for trainers who got it wrong the first time. 25% over book without a Training Pass.",[["Coastal & Open Water Pack","Packs and kits",656,null,"For long island routes, shoreline travel, and open-water crossings. (11 lbs)"],["Volcanic Route Pack","Packs and kits",1063,null,"Intended for travel near active volcanic zones and other dangerous extreme heat environments. (9 lbs)"],["Extreme Weather Pack","Packs and kits",531,null,"For routes with dangerous or unpredictable weather conditions. (7 lbs)"],["Wet Suit","Survival gear",938,null,"Insulated body suit for diving in any waters. Includes gloves and flippers ."],["Diving Gear","Survival gear",1313,null,"Self contained underwater breathing apparatus . Allows for humans to explore underwater with enough air to breathe for two hours."],["Hazmat Suit","Survival gear",938,null,"Full-body protective suit used to shield trainers from dangerous chemical, biological, radiological, or nuclear harms."]]],["resort-area~quaynightmarket","resort-area","Quay night market","25% over book without a Training Pass.",[["Beautiful Bandanna","Contest",2850,null,"Beauty contest stat is +2 while worn."],["Clever Cravat","Contest",2850,null,"Clever contest stat is +2 while worn."],["Cool Kerchief","Contest",2850,null,"Cool contest stat is +2 while worn."],["Cute Comforter","Contest",2850,null,"Cute contest stat is +2 while worn."],["Tough Tippet","Contest",2850,null,"Tough contest stat is +2 while worn."],["Poffin (level 1)","Contest",1225,null,"A contest treat (level 1). Raises a contest stat by 1; the flavor decides which."],["Moo Moo Milk","Potions",219,null,"Heals anything 8 HP. 164"],["Sitrus Berry","Berries",150,null,"Heals a Pokémon 12 HP. (uncommon in the wild)"]]],["resort-area~oldcovemarket","resort-area","Old Cove market","Never advertised. Book prices.",[["Fishing Kit","Packs and kits",250,null,"For trainers who are looking to lure underwater Pokémon to the surface. (8 lbs)"],["Dive Ball","Poké Balls",1250,null,"-12 from your capture roll if the Pokémon is in water."],["Oran Berry","Berries",25,null,"Heals a Pokémon 5 HP."],["Pecha Berry","Berries",120,null,"Cures Poisoned and Toxified"]]],["battle-resort-survival-area~lastkit","battle-resort-survival-area","Last Kit","The camp store. Runs short when the resupply boat is late. Repairs too.",[["Potion","Potions",25,null,"Heals a Pokémon 12 HP."],["Super Potion","Potions",250,null,"Heals a Pokémon 24 HP."],["Antidote","Status cures",120,null,"Cures a Pokémon or human of Poisoned or Toxified."],["Burn Heal","Status cures",120,null,"Cures a Pokémon or human of Burned."],["Full Heal","Status cures",520,3,"Cures a Pokémon or human of all afflictions."],["Revive","Revives",1350,3,"Restore an unconscious Pokémon to half of its max HP."],["Trainer’s Pack","Packs and kits",140,null,"Basic goods for a trainer who’s starting their journey. (5 lbs)"],["Climber’s Pack","Packs and kits",350,null,"Steep routes, cliffs, and elevated terrain. (12 lbs)"],["Volcanic Route Pack","Packs and kits",850,null,"Intended for travel near active volcanic zones and other dangerous extreme heat environments. (9 lbs)"],["Medical Field Kit","Packs and kits",1750,null,"Even if you’re not entirely sure how to use it, it’s very useful to have. (10 lbs)"],["Rope (50 ft)","General goods",5,null,""],["Canteen","General goods",5,null,""]]],["battle-resort-fight-area~thecommonsgearshops","battle-resort-fight-area","The Commons gear shops","",[["Choice Band","Held items",2550,null,"Your Attack stat is +2. Whenever you use a move, that is the only move you can use for the rest of the encounter."],["Choice Scarf","Held items",2550,null,"Your Speed stat is +2. Whenever you use a move, that is the only move you can use for the rest of the encounter."],["Choice Specs","Held items",2550,null,"Your Special Attack stat is +2. Whenever you use a move, that is the only move you can use for the rest of the encounter."],["Life Orb","Held items",2550,null,"Your attacks have +1d6 power. After acting, no matter what actions you take, you lose 1d6 HP."],["Focus Sash","Held items",2550,null,"If you would be knocked out from a single attack when you were at max hit points, instead you are set to 1 hit point once per battle."],["Assault Vest","Held items",2550,null,"Your Special Defense is +2. You may not use moves that do not have power."],["Rocky Helmet","Held items",3550,null,"Whenever you are hit by an attack at melee range, the attacker loses 1d4 HP."],["Occa Berry","Berries",540,null,"Protection from Fire. (uncommon in the wild)"],["Passho Berry","Berries",540,null,"Protection from Water. (uncommon in the wild)"],["Wacan Berry","Berries",540,null,"Protection from Electric. (uncommon in the wild)"],["Rindo Berry","Berries",540,null,"Protection from Grass. (uncommon in the wild)"],["Yache Berry","Berries",540,null,"Protection from Ice. (uncommon in the wild)"],["Chople Berry","Berries",540,null,"Protection from Fighting. (uncommon in the wild)"],["Kebia Berry","Berries",540,null,"Protection from Poison. (uncommon in the wild)"],["Shuca Berry","Berries",540,null,"Protection from Ground. (uncommon in the wild)"],["Salac Berry","Berries",1880,3,"At half HP or lower, you get Speed▲. (rare in the wild)"],["Liechi Berry","Berries",1880,3,"At half HP or lower, you get Attack▲. (rare in the wild)"],["Petaya Berry","Berries",1880,3,"At half HP or lower, you get SpAttack▲. (rare in the wild)"],["X Attack","Battle boosters",240,null,"Gives a Pokémon Attack▲."],["X Defend","Battle boosters",240,null,"Gives a Pokémon Defense▲."],["X Special","Battle boosters",240,null,"Gives a Pokémon SpAttack▲."],["X Sp. Def","Battle boosters",240,null,"Gives a Pokémon SpDefense▲."],["X Speed","Battle boosters",240,null,"Gives a Pokémon Speed▲."],["X Accuracy","Battle boosters",240,null,"Increases a Pokémon’s AC by +1."],["TM (At-Will)","TMs and TRs",4800,null,"Teaches an at-will move. 3 uses."],["TR (3/day)","TMs and TRs",5900,null,"Teaches a 3/day move. 1 use."]]],["battle-resort-fight-area~commonsfoodstalls","battle-resort-fight-area","Commons food stalls","",[["Super Soda","Potions",300,null,"Heals a human 20 HP."],["Hyper Lemonade","Potions",550,null,"Heals a human 30 HP."],["Moo Moo Milk","Potions",175,null,"Heals anything 8 HP. 164"]]],["battle-resort-fight-area~theundercard","battle-resort-fight-area","The Undercard","Black market under the Docks. Ask around.",[["Miscreant’s Pack","Packs and kits",300,null,"There’s no real reason to have this, let alone sell it. This may not be easily found and available in stores. (10 lbs)"]]],["route-202~travelingmerchantroute202","route-202","Traveling merchant (Route 202)","Sandgem–Jubilife road. Stock varies.",[["Potion","Potions",28,null,"Heals a Pokémon 12 HP."],["Super Potion","Potions",275,null,"Heals a Pokémon 24 HP."],["Antidote","Status cures",132,null,"Cures a Pokémon or human of Poisoned or Toxified."],["Repel","Repels",165,null,"Wild Pokémon find the smell repulsive for one hour after applied, but may ignore it to protect something precious to them."],["Basic Ball","Poké Balls",110,null,"+5 to your capture roll."],["Oran Berry","Berries",28,null,"Heals a Pokémon 5 HP."]]],["route-204~middayhoneystalls","route-204","Midday honey stalls","Honey and cut flowers too.",[["Oran Berry","Berries",25,null,"Heals a Pokémon 5 HP."],["Pecha Berry","Berries",100,null,"Cures Poisoned and Toxified"]]],["route-206~larchpost","route-206","Larch Post","Route House ration store and bike workshop.",[["Potion","Potions",28,null,"Heals a Pokémon 12 HP."],["Antidote","Status cures",130,null,"Cures a Pokémon or human of Poisoned or Toxified."],["Potion Water","Potions",110,null,"Heals a human 10 HP."],["Repel","Repels",165,null,"Wild Pokémon find the smell repulsive for one hour after applied, but may ignore it to protect something precious to them."],["Basic Ball","Poké Balls",110,null,"+5 to your capture roll."],["Canteen","General goods",5,null,""],["Bedroll","General goods",5,null,""],["Basic Tool Kit","Packs and kits",95,null,"Basic tools for basic repairs or maintenance. (8 lbs)"]]],["route-206~bridgekeepershouse","route-206","Bridge Keepers' House","Café, tool store and first-aid room on the 206 Bridge.",[["Basic Tool Kit","Packs and kits",95,null,"Basic tools for basic repairs or maintenance. (8 lbs)"],["Rope (50 ft)","General goods",5,null,""],["Potion","Potions",25,null,"Heals a Pokémon 12 HP."],["Super Potion","Potions",250,null,"Heals a Pokémon 24 HP."],["Medical Field Kit","Packs and kits",1750,3,"Even if you’re not entirely sure how to use it, it’s very useful to have. (10 lbs)"]]],["route-210~cafecabin","route-210","Café Cabin","Snacks and rumors.",[["Moo Moo Milk","Potions",175,null,"Heals anything 8 HP. 164"],["Super Soda","Potions",300,null,"Heals a human 20 HP."]]],["route-212~heronpost","route-212","Heron Post","Route House ration store.",[["Potion","Potions",28,null,"Heals a Pokémon 12 HP."],["Antidote","Status cures",130,null,"Cures a Pokémon or human of Poisoned or Toxified."],["Potion Water","Potions",110,null,"Heals a human 10 HP."],["Repel","Repels",165,null,"Wild Pokémon find the smell repulsive for one hour after applied, but may ignore it to protect something precious to them."],["Basic Ball","Poké Balls",110,null,"+5 to your capture roll."],["Canteen","General goods",5,null,""],["Bedroll","General goods",5,null,""],["Swamp & Wetlands Pack","Packs and kits",575,null,"Built for travel through marshes, bogs, and flooded wilds. (10 lbs)"]]],["route-214~milestonemarket","route-214","Milestone Market","Vendors at every tenth kilometer post. Contest costumes are knock-offs.",[["Oran Berry","Berries",25,null,"Heals a Pokémon 5 HP."],["Sitrus Berry","Berries",120,null,"Heals a Pokémon 12 HP. (uncommon in the wild)"],["Beautiful Bandanna","Contest",2050,null,"Beauty contest stat is +2 while worn."],["Cute Comforter","Contest",2050,null,"Cute contest stat is +2 while worn."],["Cool Kerchief","Contest",2050,null,"Cool contest stat is +2 while worn."]]],["route-218~greenhousemilecafe","route-218","Greenhouse Mile café","",[["Super Soda","Potions",300,null,"Heals a human 20 HP."],["Moo Moo Milk","Potions",175,null,"Heals anything 8 HP. 164"],["Sitrus Berry","Berries",120,null,"Heals a Pokémon 12 HP. (uncommon in the wild)"]]],["route-227~steamhaltcafe","route-227","Steam Halt café","Hot soup and every opinion on the Rail Society.",[["Thermos","General goods",10,null,""],["Blanket (Winter)","General goods",10,null,""],["Ice Heal","Status cures",120,null,"Cures a Pokémon or human of Frostbite."]]],["route-229~sandalstrawgatestalls","route-229","Sandalstraw Gate stalls","Straw Guild snow-boots and hot cider.",[["Jacket (Snow)","General goods",145,null,""]]],["route-232~saltpanssaltshop","route-232","Salt Pans salt shop","Something unusual on the back shelf.",[["Shell Bell","Held items",3550,3,"Whenever you hit with an attack, you can drop your highest rolled damage result. If you do, recover 1d4 HP."]]],["route-233~orchardmilestalls","route-233","Orchard Mile stalls","Pick your own: 20% off. Honesty boxes.",[["Oran Berry","Berries",20,null,"Heals a Pokémon 5 HP."],["Sitrus Berry","Berries",96,null,"Heals a Pokémon 12 HP. (uncommon in the wild)"],["Cheri Berry","Berries",96,null,"Cures Paralysis"],["Pecha Berry","Berries",96,null,"Cures Poisoned and Toxified"],["Rawst Berry","Berries",96,null,"Cures Burns"],["Bluk Berry","Berries",96,null,"No special effect; used for contest treats and berry food."],["Nanab Berry","Berries",96,null,"No special effect; used for contest treats and berry food."],["Pinap Berry","Berries",96,null,"No special effect; used for contest treats and berry food."]]],["route-234~berryrowpickersstalls","route-234","Berry Row pickers' stalls","Pick your own: 20% off.",[["Oran Berry","Berries",20,null,"Heals a Pokémon 5 HP."],["Sitrus Berry","Berries",96,null,"Heals a Pokémon 12 HP. (uncommon in the wild)"],["Cheri Berry","Berries",96,null,"Cures Paralysis"],["Pecha Berry","Berries",96,null,"Cures Poisoned and Toxified"],["Rawst Berry","Berries",96,null,"Cures Burns"],["Bluk Berry","Berries",96,null,"No special effect; used for contest treats and berry food."],["Nanab Berry","Berries",96,null,"No special effect; used for contest treats and berry food."],["Pinap Berry","Berries",96,null,"No special effect; used for contest treats and berry food."],["Lum Berry","Berries",580,3,"Cures all Afflictions (uncommon in the wild)"]]],["route-236~dustmansrest","route-236","Dustman's Rest","Route House ration store. Hot buns at the coach stops.",[["Potion","Potions",28,null,"Heals a Pokémon 12 HP."],["Antidote","Status cures",130,null,"Cures a Pokémon or human of Poisoned or Toxified."],["Potion Water","Potions",110,null,"Heals a human 10 HP."],["Repel","Repels",165,null,"Wild Pokémon find the smell repulsive for one hour after applied, but may ignore it to protect something precious to them."],["Basic Ball","Poké Balls",110,null,"+5 to your capture roll."],["Canteen","General goods",5,null,""],["Bedroll","General goods",5,null,""]]],["route-239~terracerest","route-239","Terrace Rest","Route House ration store. Michina cheese.",[["Potion","Potions",28,null,"Heals a Pokémon 12 HP."],["Antidote","Status cures",130,null,"Cures a Pokémon or human of Poisoned or Toxified."],["Potion Water","Potions",110,null,"Heals a human 10 HP."],["Repel","Repels",165,null,"Wild Pokémon find the smell repulsive for one hour after applied, but may ignore it to protect something precious to them."],["Basic Ball","Poké Balls",110,null,"+5 to your capture roll."],["Canteen","General goods",5,null,""],["Bedroll","General goods",5,null,""]]],["route-242~gatevillageshops","route-242","Gate Village shops","Souvenirs and the Preserve shop.",[["Field Survey Kit","Packs and kits",200,null,"If any trainers want to do some research while out in the wilds, these tools will help. (8 lbs)"],["Camera (Digital)","General goods",495,null,""],["Binoculars (Digital)","General goods",50,null,""]]],["sandgem-port~fishermenscoop","sandgem-port","Fishermen's Co-op","Chowder on Fridays.",[["Fishing Kit","Packs and kits",250,null,"For trainers who are looking to lure underwater Pokémon to the surface. (8 lbs)"],["Dive Ball","Poké Balls",1250,null,"-12 from your capture roll if the Pokémon is in water."],["Coastal & Open Water Pack","Packs and kits",525,null,"For long island routes, shoreline travel, and open-water crossings. (11 lbs)"]]],["south-sinnoh-port~lighthouserowshops","south-sinnoh-port","Lighthouse Row shops","",[["Potion","Potions",25,null,"Heals a Pokémon 12 HP."],["Super Potion","Potions",250,null,"Heals a Pokémon 24 HP."],["Full Heal","Status cures",520,null,"Cures a Pokémon or human of all afflictions."],["Great Ball","Poké Balls",600,null,"+0 to your capture roll."],["Ultra Ball","Poké Balls",1000,null,"-5 from your capture roll."],["Traveler’s Pack","Packs and kits",150,null,"Really useful gear for extended travel through the wilds. (15 lbs)"]]],["south-sinnoh-port~nightmarket","south-sinnoh-port","Night Market","After dark on Berth Six. Held items at 20% off, no questions asked.",[["Choice Band","Held items",2040,null,"Your Attack stat is +2. Whenever you use a move, that is the only move you can use for the rest of the encounter."],["Leftovers","Held items",2040,null,"As an action, consume and destroy Leftovers. Regain 1d6 HP after acting until you are at max HP."],["Life Orb","Held items",2040,null,"Your attacks have +1d6 power. After acting, no matter what actions you take, you lose 1d6 HP."],["Quick Claw","Held items",2040,null,"On your first single-target melee attack with at-will frequency per day, the attack gains the following effect: “This attack has Priority.”"],["Scope Lens","Held items",2040,null,"On your first single-target ranged attack per day, the attack gains the following effect: “This attack is Lethal.”"]]],["grand-marsh~marshgateshop","grand-marsh","Marsh Gate shop","Guide hut and sightings board. Safari Balls work only in the Safari Zone.",[["Safari Ball","Poké Balls",550,null,"-20 from your capture roll against domesticated wild Pokémon."],["Swamp & Wetlands Pack","Packs and kits",575,null,"Built for travel through marshes, bogs, and flooded wilds. (10 lbs)"],["Antidote","Status cures",120,null,"Cures a Pokémon or human of Poisoned or Toxified."],["Repel","Repels",150,null,"Wild Pokémon find the smell repulsive for one hour after applied, but may ignore it to protect something precious to them."],["Binoculars (Digital)","General goods",45,null,""]]],["valor-lakefront-and-grand-festival~festivalgreenstalls","valor-lakefront-and-grand-festival","Festival Green stalls","Open during the Grand Festival.",[["Beautiful Bandanna","Contest",2280,null,"Beauty contest stat is +2 while worn."],["Clever Cravat","Contest",2280,null,"Clever contest stat is +2 while worn."],["Cool Kerchief","Contest",2280,null,"Cool contest stat is +2 while worn."],["Cute Comforter","Contest",2280,null,"Cute contest stat is +2 while worn."],["Tough Tippet","Contest",2280,null,"Tough contest stat is +2 while worn."],["Poffin (level 1)","Contest",980,null,"A contest treat (level 1). Raises a contest stat by 1; the flavor decides which."],["Poffin (level 2)","Contest",1880,null,"A contest treat (level 2). Raises a contest stat by 2; the flavor decides which."]]],["acuity-lakefront~thelodgecounter","acuity-lakefront","The Lodge counter","10% over book.",[["Arctic Travel Pack","Packs and kits",633,null,"For exposure to cold climates and snow-covered routes. (14 lbs)"],["Blizzard Wear","Survival gear",1155,null,"Carefully made clothes for humans protect them from harmful hail and snowstorms."],["Ice Heal","Status cures",132,null,"Cures a Pokémon or human of Frostbite."],["Super Potion","Potions",275,null,"Heals a Pokémon 24 HP."],["Thermos","General goods",11,null,""]]],["lily-of-the-valley-conference~concoursevendors","lily-of-the-valley-conference","Concourse vendors","Conference merchandise too.",[["Max Potion","Potions",935,null,"Heals a Pokémon to their Max HP."],["Full Restore","Potions",1320,null,"Heals a Pokémon to their Max HP and cures them of any afflictions."],["Revive","Revives",1485,null,"Restore an unconscious Pokémon to half of its max HP."],["X Attack","Battle boosters",264,null,"Gives a Pokémon Attack▲."],["X Defend","Battle boosters",264,null,"Gives a Pokémon Defense▲."],["X Special","Battle boosters",264,null,"Gives a Pokémon SpAttack▲."],["X Sp. Def","Battle boosters",264,null,"Gives a Pokémon SpDefense▲."],["X Speed","Battle boosters",264,null,"Gives a Pokémon Speed▲."],["X Accuracy","Battle boosters",264,null,"Increases a Pokémon’s AC by +1."],["Premier Ball","Poké Balls",1650,null,"-5 from your capture roll. Captured Pokémon are more easily befriended."]]],["valley-windworks~windworksvisitorkiosk","valley-windworks","Windworks visitor kiosk","",[["Solar Charger","Utility",50,null,"An unfolding solar panel that charges devices."],["Thermos","General goods",10,null,""]]],["celestic-town~rangerpostattunnelgate","celestic-town","Ranger Post at Tunnel Gate","Escape-route maps are free.",[["Rope (50 ft)","General goods",5,null,""],["Lantern (battery)","General goods",20,null,""],["Climber’s Pack","Packs and kits",350,null,"Steep routes, cliffs, and elevated terrain. (12 lbs)"],["Repel","Repels",150,null,"Wild Pokémon find the smell repulsive for one hour after applied, but may ignore it to protect something precious to them."]]]];

/* ---------- Shops ----------
   The GM builds shops and puts them on places. Each shop has its own stock and prices.
   Where things live (no new database rule is needed):
     gm/shops    the GM's full list of shops, including closed ones, hidden items and items still locked.     Only the GM can read it.
     meta/shops  what the players see: only open shops, and in them only the items that are for sale right now.   The GM's page keeps it up to date.
   Players buy from their own browser. A purchase changes only the buyer's own trainer sheet (credits, inventory, a count of what they bought,
   and a purchase record), which the rules already let a player edit. The units left of a limited item are the stock the GM set minus what all
   the trainers' sheets say they have bought, so everyone sees the same number without any shared counter. */
S.ui.shop=S.ui.shop||{view:'floor',sel:'',who:'',cat:'',q:'',qty:{},edit:'',newname:'',tpl:'',addq:'',dstock:'5',addcat:'',rpick:'',lshop:'',lwho:'',ln:60,del:'',fpl:'',ppl:''};
const SHOP_MAX=200,SHOP_ITEMS_MAX=250,SHOP_LOG_MAX=300,SHOP_DOC_MAX=800000;
const SCAT_BY=(()=>{const m=new Map();SCAT.forEach(x=>{const k=dexKey(x[0]);if(!m.has(k))m.set(k,x);});return m;})();
const SHOP_OTHER='Other';
const SHOP_CATS=SCAT_CATS.concat([SHOP_OTHER]);
const fmtP=n=>Math.round(num(n)).toLocaleString('en-US')+' P';
const plName=id=>PD_BY[id]?PD_BY[id].name:'';
let SHOP_PLOPT=null;
const shPlOpt=()=>SHOP_PLOPT||(SHOP_PLOPT=PD.slice().sort(natural).map(f=>[f.id,f.name]));
let shSeq=0;
const shKey=()=>Math.random().toString(36).slice(2,6)+(shSeq++).toString(36)+Date.now().toString(36).slice(-3);

const shG=()=>(S.shopGm&&S.shopGm.shops)||{};
const shP=()=>(S.shopPub&&S.shopPub.shops)||{};
const shRc=()=>(S.shopPub&&S.shopPub.rc)||{};
const shOrder=m=>Object.keys(m).sort((a,b)=>num(m[a].at)-num(m[b].at)||a.localeCompare(b));
const shCanon=v=>JSON.stringify(v,(k,x)=>x&&typeof x==='object'&&!Array.isArray(x)?Object.keys(x).sort().reduce((o,kk)=>{o[kk]=x[kk];return o;},{}):x);

/* how many of an item the trainers have bought between them, and how many are left */
function shSold(sid,k){
  let n=0;
  Object.keys(S.trainers).forEach(u=>{const b=S.trainers[u]&&S.trainers[u].shopBought;if(b&&b[sid])n+=num(b[sid][k]);});
  return n;
}
const shStockOf=x=>(x.stock==null||x.stock==='')?null:Math.max(0,Math.floor(num(x.stock)));
function shLeft(sid,k,s){return s==null?Infinity:Math.max(0,s-shSold(sid,k));}

/* ----- what the players are allowed to see ----- */
function shPubShops(){
  const g=shG(),rc=shRc(),out={};
  shOrder(g).forEach(id=>{
    const s=g[id];
    if(!s)return;
    const seen=s.place&&rc[s.place];
    if(!s.open&&!seen)return;
    const o={n:String(s.name||'Shop'),pl:String(s.place||''),o:s.open?1:0,t:String(s.note||''),at:num(s.at),it:[]};
    if(s.open){
      (Array.isArray(s.items)?s.items:[]).forEach(x=>{
        if(!x||x.hide||x.price==null||x.price==='')return;
        if(x.unlock&&!rc[x.unlock])return;
        o.it.push({k:String(x.k),n:String(x.name||'Item'),c:String(x.cat||''),p:Math.max(0,Math.round(num(x.price))),s:shStockOf(x),d:String(x.desc||'')});
      });
    }
    out[id]=o;
  });
  return out;
}
let shTimer=0;
function shPubSoon(){
  if(!S.me.admin)return;
  clearTimeout(shTimer);
  shTimer=setTimeout(()=>{
    shTimer=0;
    const nv=shPubShops();
    if(shCanon(nv)===shCanon(shP()))return;
    edit('sh','shops','shops',nv);
  },120);
}
function shSetReached(pid,on){
  if(!S.me.admin||!PD_BY[pid])return;
  const rc=Object.assign({},shRc());
  if(on)rc[pid]=true;else delete rc[pid];
  edit('sh','shops','rc',rc);
  shPubSoon();
}

/* ----- buying ----- */
const shBuyer=()=>S.me.admin?(S.trainers[S.ui.shop.who]?S.ui.shop.who:(tids()[0]||'')):S.me.id;
function shBuy(sid,k,qtyRaw){
  const uid=shBuyer(),t=S.trainers[uid];
  if(!t){toast(S.me.admin?'There is no trainer to sell to yet.':'Make your trainer sheet first, then you can shop.');return;}
  if(!S.me.admin&&!S.me.canWrite){toast('You can only look at the table right now.');return;}
  const sh=shP()[sid];
  if(!sh||!sh.o){toast('That shop is closed.');return;}
  const it=(sh.it||[]).find(x=>x.k===k);
  if(!it){toast('That item is not for sale.');return;}
  const qty=clamp(Math.floor(num(qtyRaw))||1,1,99);
  const left=shLeft(sid,k,it.s);
  if(qty>left){toast(left>0?'Only '+left+' left of '+it.n+'.':it.n+' is sold out.');return;}
  const total=it.p*qty,have=num(t.credits);
  if(total>have){toast('Not enough credits: that costs '+fmtP(total)+' and '+(S.me.admin?tName(t):'you')+' '+(S.me.admin?'has':'have')+' '+fmtP(have)+'.');return;}
  edit('t',uid,'credits',have-total);
  const items=(t.items||[]).map(x=>Object.assign({},x));
  const key=dexKey(it.n);
  const row=items.find(x=>dexKey(x.name)===key&&!String(x.note||'').trim());
  if(row)row.qty=num(row.qty)+qty;else items.push({name:it.n,qty,note:''});
  edit('t',uid,'items',items);
  const sb=JSON.parse(JSON.stringify(t.shopBought||{}));
  if(!sb[sid])sb[sid]={};
  sb[sid][k]=num(sb[sid][k])+qty;
  edit('t',uid,'shopBought',sb);
  const log=(Array.isArray(t.shopLog)?t.shopLog:[]).concat([{t:Date.now(),sid,sn:sh.n,k,n:it.n,q:qty,p:it.p,c:total,by:S.me.id}]).slice(-SHOP_LOG_MAX);
  edit('t',uid,'shopLog',log);
  S.ui.shop.qty[sid+'|'+k]=1;
  toast((S.me.admin?'Sold ':'Bought ')+qty+' × '+it.n+' for '+fmtP(total)+(S.me.admin?' to '+tName(t):'')+'.',true);
  render();
}

/* the quantity box next to Buy: keep it between 1 and what is left, and remember it across redraws */
function shQty(t){
  const mx=num(t.max)||99;
  let v=Math.floor(num(t.value));
  if(t.value!==''&&v<1)v=1;
  if(v>mx)v=mx;
  if(t.value!==''&&String(v)!==t.value)t.value=String(v);
  S.ui.shop.qty[t.dataset.sq]=t.value===''?1:v;
}

/* ----- the shop floor: what a player sees ----- */
function shItemsHtml(){
  const u=S.ui.shop,pub=shP(),sh=pub[u.sel];
  if(!sh)return h``;
  if(!sh.o)return h`<p class="sub">This shop is closed right now.${sh.t?h` “${sh.t}”`:''}</p>`;
  const q=String(u.q||'').trim().toLowerCase();
  let list=(sh.it||[]).filter(x=>(!u.cat||x.c===u.cat)&&(!q||(x.n+' '+x.d).toLowerCase().indexOf(q)>=0));
  if(!(sh.it||[]).length)return h`<p class="sub">Nothing is on the shelves yet.</p>`;
  if(!list.length)return h`<p class="sub">Nothing here matches.</p>`;
  const rows=list.map(x=>({x,left:shLeft(u.sel,x.k,x.s)}));
  rows.sort((a,b)=>(a.left===0)-(b.left===0));
  const t=S.trainers[shBuyer()];
  const have=num(t&&t.credits);
  return h`<div class="splist">${rows.map(({x,left})=>{
    const qk=u.sel+'|'+x.k;
    const q0=clamp(Math.floor(num(u.qty[qk]))||1,1,99);
    return h`<div class="spitem ${left===0?'out':''}">
      <div class="spmain">${itemTile(x.n)}<div><b>${x.n}</b>${x.c?h` <span class="pill">${x.c}</span>`:''}${x.d?h`<p class="sub">${x.d}</p>`:''}</div></div>
      <div class="spprice ${x.p>have?'poor':''}">${fmtP(x.p)}</div>
      <div class="spleft">${left===Infinity?'':left===0?'Sold out':left+' left'}</div>
      <div class="spbuy"><input type="number" inputmode="numeric" min="1" max="${left===Infinity?99:Math.max(1,Math.min(99,left))}" value="${q0}" data-sq="${qk}" aria-label="How many ${x.n}"><button class="btn primary sm" data-act="sp_buy" data-sid="${u.sel}" data-k="${x.k}" ${left===0?raw('disabled'):''}>Buy</button></div>
    </div>`;}
  )}</div>`;
}
function shRefresh(){const el=document.getElementById('shoplist');if(el)el.innerHTML=shItemsHtml().s;}
function shFloor(){
  const u=S.ui.shop,pub=shP(),ids=shOrder(pub);
  if(!pub[u.sel])u.sel=(ids.find(i=>pub[i].o)||ids[0]||'');
  const sh=pub[u.sel];
  const uid=shBuyer(),t=S.trainers[uid];
  const cats=sh&&sh.o?[...new Set((sh.it||[]).map(x=>x.c).filter(Boolean))]:[];
  const mine=(t&&Array.isArray(t.shopLog)?t.shopLog:[]).slice(-8).reverse();
  return h`<section class="panel spp"><div class="ph"><h2>Shops</h2>${t?h`<span class="pill credit">${S.me.admin?tName(t)+': ':'You have '}${fmtP(t.credits)}</span>`:''}</div>
    ${!t&&!S.me.admin?h`<div class="banner">You have no trainer sheet yet, so you cannot buy anything. Make one on the Trainer page.</div>`:''}
    ${S.me.admin?h`<div class="fgrid"><label class="fld"><span class="fl">Sell to</span><select data-u="shop.who">${tids().map(id=>h`<option value="${id}" ${id===uid?raw('selected'):''}>${tName(S.trainers[id])}</option>`)}</select></label></div>`:''}
    ${ids.length?h`<div class="sppicks" role="group" aria-label="Shops">${ids.map(id=>h`<button class="sppick" data-act="sp_pick" data-id="${id}" aria-pressed="${String(id===u.sel)}"><b>${pub[id].n}</b><span>${pub[id].pl?plName(pub[id].pl):'Travelling'}</span>${pub[id].o?'':h`<em>Closed</em>`}</button>`)}</div>`
      :h`<p class="sub">No shops are open right now. The GM opens them as the party reaches a town.</p>`}
    ${sh?h`<div class="sphead"><h3>${sh.n}</h3>${sh.pl?h`<span class="sub">${plName(sh.pl)}</span>`:''}${sh.o?h`<span class="pill open">Open</span>`:h`<span class="pill">Closed</span>`}</div>
      ${sh.o&&sh.t?h`<p class="sub">“${sh.t}”</p>`:''}
      ${sh.o&&(sh.it||[]).length?h`<div class="fgrid spflt"><label class="fld"><span class="fl">Search</span><input type="search" data-u="shop.q" value="${u.q}" placeholder="Name or effect" data-nr></label>
        <label class="fld"><span class="fl">Kind</span><select data-u="shop.cat"><option value="">All</option>${cats.map(c=>h`<option value="${c}" ${c===u.cat?raw('selected'):''}>${c}</option>`)}</select></label></div>`:''}
      <div id="shoplist">${shItemsHtml()}</div>`:''}
  </section>
  ${t&&mine.length?h`<section class="panel"><div class="ph"><h2>${S.me.admin?tName(t)+'’s':'Your'} recent purchases</h2></div>
    <div class="spmine">${mine.map(e=>h`<div class="row sp"><span>${e.q} × ${e.n} <span class="sub">${e.sn||''}</span></span><span class="mono">${fmtP(e.c)}</span></div>`)}</div></section>`:''}`;
}

/* ----- the GM's editor ----- */
const SHOP_TPL=[
  ['','An empty shop'],
  ['center','Mart in a Pokémon Center: travel medicine and basic balls'],
  ['mart','Poké Mart: balls, medicine, repels and berries'],
  ['dept','Department store: packs, gear, clothes, tech and goods'],
  ['spec','Specialty shop: stones, TMs, held items and vitamins']
];
function shTplRows(t){
  const by=name=>{const x=SCAT_BY.get(dexKey(name));return x?[x]:[];};
  const cat=names=>SCAT.filter(x=>names.indexOf(SCAT_CATS[x[1]])>=0);
  if(t==='center')return cat(['Potions','Status cures','Revives','Repels']).concat(by('Basic Ball'),by('Great Ball'),by('Ultra Ball'));
  if(t==='mart')return cat(['Poké Balls','Potions','Status cures','Revives','Energy','Battle boosters','Repels','Herbs']).concat(['Oran Berry','Sitrus Berry','Cheri Berry','Chesto Berry','Pecha Berry','Rawst Berry','Aspear Berry','Persim Berry'].reduce((a,n)=>a.concat(by(n)),[]));
  if(t==='dept')return cat(['Packs and kits','Utility','Survival gear','Clothing and armor','Tech','Camping and play','General goods']);
  if(t==='spec')return cat(['Evolution stones','TMs and TRs','Held items','Vitamins','Mints','Contest']);
  return [];
}
const shMkItem=(x,stock)=>({k:shKey(),name:x[0],cat:SCAT_CATS[x[1]],price:x[2],stock,desc:x[3],unlock:'',hide:false});
const shDefStock=()=>{const v=String(S.ui.shop.dstock==null?'':S.ui.shop.dstock).trim();return v===''?null:Math.max(0,Math.floor(num(v)));};
function shRoom(){
  if(JSON.stringify(S.shopGm||{}).length>SHOP_DOC_MAX){toast('The shop list is nearly full. Delete a shop or some items before adding more.');return false;}
  return true;
}
function shEditor(){
  const g=shG(),ids=shOrder(g),u=S.ui.shop,rc=shRc();
  if(!g[u.edit])u.edit=ids.length===1?ids[0]:'';
  const sid=u.edit;
  const s=sid?g[sid]:null;
  const P='shops.'+sid+'.';
  const reached=Object.keys(rc).filter(id=>PD_BY[id]).map(id=>PD_BY[id]).sort(natural);
  const shown=ids.filter(id=>!u.fpl||g[id].place===u.fpl).sort((a,b)=>plName(g[a].place||'').localeCompare(plName(g[b].place||''),undefined,{numeric:true}));
  const usedPl=[...new Set(ids.map(id=>g[id].place).filter(x=>x&&PD_BY[x]))].map(x=>PD_BY[x]).sort(natural);
  return h`<section class="panel"><div class="ph"><h2>Your shops</h2><span class="pill gm">GM only</span><span class="sub">${ids.length} of ${SHOP_MAX}</span></div>
    <p class="sub">Each shop has its own stock and prices. Put it on a place, then open it when the party gets there. Closed shops are hidden from the players, except in places the party has already reached, where they see a Closed sign.</p>
    ${shPresetBox(g)}
    ${ids.length>8?h`<div class="row"><label class="fld"><span class="fl">Show shops in</span><select data-u="shop.fpl"><option value="">Every place</option>${usedPl.map(f=>h`<option value="${f.id}" ${f.id===u.fpl?raw('selected'):''}>${f.name}</option>`)}</select></label></div>`:''}
    ${shown.length?h`<div class="splist">${shown.map(id=>{const x=g[id];return h`<div class="spitem">
      <div class="spmain"><div><b>${x.name||'Shop'}</b> <span class="pill ${x.open?'open':''}">${x.open?'Open':'Closed'}</span><p class="sub">${x.place?plName(x.place):'Not on the map'} · ${(x.items||[]).length} items</p></div></div>
      <div class="spbuy"><button class="btn sm" data-act="sp_toggle" data-id="${id}">${x.open?'Close shop':'Open shop'}</button><button class="btn sm ${id===sid?'primary':''}" data-act="sp_edit" data-id="${id}">${id===sid?'Editing':'Edit'}</button></div></div>`;})}</div>`:h`<p class="sub">No shops yet. Make the first one below.</p>`}
    <div class="mgd"><b>New shop</b>
      <div class="fgrid"><label class="fld"><span class="fl">Name</span><input type="text" data-u="shop.newname" value="${u.newname}" placeholder="e.g. Jubilife Poké Mart" data-nr></label>
        <label class="fld"><span class="fl">Start with</span><select data-u="shop.tpl">${SHOP_TPL.map(([k,l])=>h`<option value="${k}" ${k===u.tpl?raw('selected'):''}>${l}</option>`)}</select></label>
        <label class="fld"><span class="fl">Stock of each (blank = unlimited)</span><input type="number" inputmode="numeric" min="0" data-u="shop.dstock" value="${u.dstock}" data-nr></label></div>
      <div class="row"><button class="btn primary sm" data-act="sp_new" ${ids.length>=SHOP_MAX?raw('disabled'):''}>Make the shop</button></div></div>
  </section>
  <section class="panel"><div class="ph"><h2>Where the party has been</h2><span class="pill gm">GM only</span></div>
    <p class="sub">An item can wait for a place: it only goes on sale once the party has reached it. You can also tick a place on its own page on the Map.</p>
    ${reached.length?h`<div class="row spchips">${reached.map(f=>h`<button class="btn sm" data-act="sp_reach" data-id="${f.id}" aria-label="Remove ${f.name}">${f.name} ×</button>`)}</div>`:h`<p class="sub">No places marked yet.</p>`}
    <div class="row"><label class="fld"><span class="fl">Mark a place as reached</span><select data-u="shop.rpick"><option value="">Choose a place</option>${shPlOpt().filter(([id])=>!rc[id]).map(([id,n])=>h`<option value="${id}" ${id===u.rpick?raw('selected'):''}>${n}</option>`)}</select></label>
      <button class="btn sm" data-act="sp_reachadd" ${u.rpick?'':raw('disabled')}>Mark reached</button></div>
  </section>
  ${s?shEdit1(sid,s,P):''}`;
}
/* the Sinnoh shop set: load the campaign's shops (closed) into the GM's list; shops already loaded are skipped */
const shPreLoaded=g=>new Set(Object.keys(g).map(id=>g[id]&&g[id].pre).filter(Boolean));
function shPresetBox(g){
  const u=S.ui.shop,have=shPreLoaded(g);
  const left=SINNOH_SHOPS.filter(x=>!have.has(x[0]));
  const pls=[...new Set(left.map(x=>x[1]))].map(id=>PD_BY[id]).filter(Boolean).sort(natural);
  if(!left.length)return h`<p class="sub">All ${SINNOH_SHOPS.length} shops from the Sinnoh shop set are loaded.</p>`;
  return h`<div class="mgd"><b>Sinnoh shop set</b>
    <p class="sub">${left.length} shops in ${pls.length} places from the campaign's shop inventories, at handbook prices with each shop's own markups. They load closed, already placed on the map; open each one when the party arrives.</p>
    <div class="row"><label class="fld"><span class="fl">Load the shops for</span><select data-u="shop.ppl"><option value="">Choose a place</option>${pls.map(f=>h`<option value="${f.id}" ${f.id===u.ppl?raw('selected'):''}>${f.name}</option>`)}</select></label>
      <button class="btn sm" data-act="sp_preset" data-id="${u.ppl}" ${u.ppl?'':raw('disabled')}>Load</button>
      <button class="btn sm primary" data-act="sp_preset" data-id="*">Load all ${left.length}</button></div></div>`;
}
function shLoadPreset(which){
  const g=shG(),have=shPreLoaded(g),all=Object.assign({},g);
  let n=0,full=false;const t=Date.now();
  SINNOH_SHOPS.forEach(([pre,place,name,note,items],i)=>{
    if(have.has(pre)||(which!=='*'&&place!==which))return;
    if(Object.keys(all).length>=SHOP_MAX){full=true;return;}
    all[shKey()]={pre,name,place,open:false,note,at:t+i,items:items.map(([nm,cat,price,stock,desc])=>({k:shKey(),name:nm,cat,price,stock,desc,unlock:'',hide:false}))};
    n++;
  });
  if(JSON.stringify({shops:all}).length>SHOP_DOC_MAX){toast('That would make the shop list too big. Delete some shops first, or load one place at a time.');return;}
  if(!n){toast(full?'The shop list is full ('+SHOP_MAX+' shops).':'Those shops are already loaded.');return;}
  edit('sg','shops','shops',all);
  S.ui.shop.ppl='';
  toast('Loaded '+n+' shop'+(n===1?'':'s')+'. They are closed until you open them.'+(full?' Some did not fit: the list is full.':''),true);
}
function shEdit1(sid,s,P){
  const u=S.ui.shop,items=Array.isArray(s.items)?s.items:[];
  return h`<section class="panel"><div class="ph"><h2>${s.name||'Shop'}</h2><span class="pill gm">GM only</span><span class="sub">${items.length} of ${SHOP_ITEMS_MAX} items</span></div>
    <div class="fgrid">${fText('Shop name','sg','shops',P+'name',S.shopGm,{})}
      ${fSel('Where it is','sg','shops',P+'place',S.shopGm,shPlOpt(),{blank:'Not on the map'})}
      ${fText('A note players see (optional)','sg','shops',P+'note',S.shopGm,{ph:'e.g. Back in ten minutes'})}</div>
    <div class="row">${fCheck('Open for business','sg','shops',P+'open',S.shopGm,false)}</div>
    ${items.length?h`<div class="spedlist">${items.map((x,i)=>{
      const p=P+'items.'+i+'.',stock=shStockOf(x),sold=shSold(sid,x.k),locked=x.unlock&&!shRc()[x.unlock];
      return h`<div class="spedrow ${x.hide?'off':''}">
        <div class="sped1">${fText('Item','sg','shops',p+'name',S.shopGm,{list:'dl-scat'})}${fNum('Price (P)','sg','shops',p+'price',S.shopGm,{min:0})}${fNum('Stock','sg','shops',p+'stock',S.shopGm,{min:0})}</div>
        <div class="sped2">${fSel('Kind','sg','shops',p+'cat',S.shopGm,SHOP_CATS,{blank:'None'})}${fSel('On sale once the party reaches','sg','shops',p+'unlock',S.shopGm,shPlOpt(),{blank:'Always'})}
          <div class="fld"><span class="fl">Status</span><div class="row">${fCheck('Hidden',  'sg','shops',p+'hide',S.shopGm,false)}</div></div></div>
        ${fText('Description','sg','shops',p+'desc',S.shopGm,{})}
        <div class="row sp"><span class="spnotes">${x.price==null||x.price===''?h`<span class="pill warn">Needs a price</span>`:''}${x.hide?h`<span class="pill">Hidden</span>`:''}${locked?h`<span class="pill">Locked until ${plName(x.unlock)}</span>`:''}
          ${stock==null?h`<span class="pill">Unlimited</span>`:h`<span class="pill">${sold} sold · ${Math.max(0,stock-sold)} left</span>`}${stock!=null&&sold>stock?h`<span class="pill warn">Sold ${sold-stock} too many</span>`:''}</span>
          ${rowBtns('sg','shops','shops.'+sid+'.items',i,items.length,false)}</div></div>`;})}</div>`:h`<p class="sub">Nothing on the shelves yet. Add items below.</p>`}
    <div class="mgd"><b>Stock the shelves</b>
      <p class="sub">Type an item from the handbook and its price and description fill in. For a TM or TR, type it with its move or its number, like <b>TM Thunderbolt</b>, <b>TM 024</b> or <b>TR 028</b>, and it's priced by the move's frequency. Anything else you type becomes a custom item you price yourself.</p>
      <div class="fgrid"><label class="fld"><span class="fl">Item</span><input type="text" list="dl-scat" data-u="shop.addq" value="${u.addq}" placeholder="e.g. Great Ball" data-nr></label>
        <label class="fld"><span class="fl">Stock (blank = unlimited)</span><input type="number" inputmode="numeric" min="0" data-u="shop.dstock" value="${u.dstock}" data-nr></label></div>
      <div class="row"><button class="btn sm" data-act="sp_additem" ${items.length>=SHOP_ITEMS_MAX?raw('disabled'):''}>Add the item</button></div>
      <div class="fgrid"><label class="fld"><span class="fl">Or add a whole group</span><select data-u="shop.addcat"><option value="">Choose a kind</option>${SCAT_CATS.map(c=>h`<option value="${c}" ${c===u.addcat?raw('selected'):''}>${c} (${SCAT.filter(x=>SCAT_CATS[x[1]]===c&&x[2]!=null).length})</option>`)}</select></label></div>
      <div class="row"><button class="btn sm" data-act="sp_addcat" ${u.addcat?'':raw('disabled')}>Add every priced item in that group</button></div></div>
    <div class="mgd"><b>Delete this shop</b>
      ${u.del===sid?h`<p class="sub">This removes the shop and its stock list. Purchases already made stay in the players' logs.</p><div class="row"><button class="btn sm danger" data-act="sp_delyes" data-id="${sid}">Yes, delete ${s.name||'this shop'}</button><button class="btn sm" data-act="sp_delno">Keep it</button></div>`
        :h`<div class="row"><button class="btn sm danger" data-act="sp_del" data-id="${sid}">Delete the shop</button></div>`}</div>
  </section>`;
}

/* ----- the GM's purchase log ----- */
function shLogRows(){
  const out=[];
  Object.keys(S.trainers).forEach(uid=>{(Array.isArray(S.trainers[uid].shopLog)?S.trainers[uid].shopLog:[]).forEach(e=>{if(e&&typeof e==='object')out.push(Object.assign({u:uid},e));});});
  return out.sort((a,b)=>num(b.t)-num(a.t));
}
function shLogView(){
  const u=S.ui.shop,all=shLogRows();
  const shops=[...new Map(all.map(e=>[e.sid,e.sn||'Shop'])).entries()];
  let rows=all.filter(e=>(!u.lshop||e.sid===u.lshop)&&(!u.lwho||e.u===u.lwho));
  const total=rows.reduce((a,e)=>a+num(e.c),0);
  const over=[];
  const g=shG();
  Object.keys(g).forEach(id=>{(g[id].items||[]).forEach(x=>{const st=shStockOf(x);if(st!=null){const so=shSold(id,x.k);if(so>st)over.push({shop:g[id].name||'Shop',item:x.name,n:so-st});}});});
  const shown=rows.slice(0,u.ln);
  const when=t=>{const d=new Date(num(t));return d.toLocaleDateString(undefined,{month:'short',day:'numeric'})+' '+d.toLocaleTimeString(undefined,{hour:'numeric',minute:'2-digit'});};
  return h`<section class="panel"><div class="ph"><h2>Purchase log</h2><span class="pill gm">GM only</span><span class="sub">${rows.length} purchases · ${fmtP(total)}</span></div>
    ${over.length?h`<div class="banner">Sold more than the stock: ${over.map(o=>o.item+' at '+o.shop+' (by '+o.n+')').join('; ')}. Two players bought the last one at the same moment. Fix it on the players' sheets or raise the stock.</div>`:''}
    <div class="fgrid"><label class="fld"><span class="fl">Shop</span><select data-u="shop.lshop"><option value="">All shops</option>${shops.map(([id,n])=>h`<option value="${id}" ${id===u.lshop?raw('selected'):''}>${n}</option>`)}</select></label>
      <label class="fld"><span class="fl">Trainer</span><select data-u="shop.lwho"><option value="">Everyone</option>${tids().map(id=>h`<option value="${id}" ${id===u.lwho?raw('selected'):''}>${tName(S.trainers[id])}</option>`)}</select></label></div>
    ${shown.length?h`<div class="splog">${shown.map(e=>h`<div class="splrow"><span class="when">${when(e.t)}</span><span><b>${tName(S.trainers[e.u])}</b> bought ${e.q} × ${e.n}${num(e.q)>1?h` <span class="sub">at ${fmtP(e.p)} each</span>`:''}<span class="sub"> · ${e.sn||'Shop'}${e.by&&e.by!==e.u?' · sold by the GM':''}</span></span><span class="mono">${fmtP(e.c)}</span></div>`)}</div>
      ${rows.length>shown.length?h`<div class="row"><button class="btn sm" data-act="sp_logmore">Show more (${rows.length-shown.length} older)</button></div>`:''}`
      :h`<p class="sub">No purchases yet.</p>`}
    <p class="sub">Each trainer's sheet keeps its last ${SHOP_LOG_MAX} purchases. The log is built from those sheets.</p>
  </section>`;
}

/* ----- the Shop page ----- */
function shopTab(){
  const u=S.ui.shop;
  if(!S.me.admin)u.view='floor';
  const views=[['floor','Shop floor'],['edit','Edit shops'],['log','Purchase log']];
  return h`${S.me.admin?h`<div class="seg" role="group" aria-label="Shop pages">${views.map(([k,l])=>h`<button data-act="sp_view" data-v="${k}" aria-pressed="${String(u.view===k)}">${l}</button>`)}</div>`:''}
    ${u.view==='edit'&&S.me.admin?shEditor():u.view==='log'&&S.me.admin?shLogView():shFloor()}`;
}

/* ----- on a place's page ----- */
function shPlacePanel(f){
  const admin=!!S.me.admin,rc=shRc();
  if(admin){
    const g=shG(),here=shOrder(g).filter(id=>g[id].place===f.id);
    return h`<section class="panel"><div class="ph"><h2>Shops and the party</h2><span class="pill gm">GM only</span></div>
      <div class="row"><button class="btn sm sppick1" data-act="sp_reach" data-id="${f.id}" aria-pressed="${String(!!rc[f.id])}">${rc[f.id]?'✓ The party has reached '+f.name:'The party has reached '+f.name}</button></div>
      <p class="sub">Items that wait for ${f.name} go on sale once this is ticked.</p>
      ${here.length?h`<div class="splist">${here.map(id=>h`<div class="spitem"><div class="spmain"><div><b>${g[id].name||'Shop'}</b> <span class="pill ${g[id].open?'open':''}">${g[id].open?'Open':'Closed'}</span><p class="sub">${(g[id].items||[]).length} items</p></div></div>
        <div class="spbuy"><button class="btn sm" data-act="sp_toggle" data-id="${id}">${g[id].open?'Close shop':'Open shop'}</button><button class="btn sm" data-act="sp_edit" data-id="${id}">Edit</button></div></div>`)}</div>`
        :h`<p class="sub">No shop is on this place. Make one on the Shop page and choose this place for it.</p>`}
    </section>`;
  }
  const pub=shP(),here=shOrder(pub).filter(id=>pub[id].pl===f.id);
  if(!here.length)return '';
  return h`<section class="panel"><div class="ph"><h2>Shops here</h2></div>
    <div class="splist">${here.map(id=>h`<div class="spitem"><div class="spmain"><div><b>${pub[id].n}</b> <span class="pill ${pub[id].o?'open':''}">${pub[id].o?'Open':'Closed'}</span></div></div>
      <div class="spbuy">${pub[id].o?h`<button class="btn primary sm" data-act="sp_visit" data-id="${id}">Go shopping</button>`:''}</div></div>`)}</div></section>`;
}

/* ----- clicks ----- */
function shAct(b){
  const d=b.dataset,u=S.ui.shop;
  switch(d.act){
    case 'sp_view':u.view=d.v;render();break;
    case 'sp_pick':u.sel=d.id;u.q='';u.cat='';render();break;
    case 'sp_visit':u.sel=d.id;u.view='floor';u.q='';u.cat='';setTab('shop');break;
    case 'sp_buy':{
      const inp=b.parentNode.querySelector('input[data-sq]');
      shBuy(d.sid,d.k,inp?inp.value:1);
      break;}
    default:break;
  }
  if(!S.me.admin)return;
  const g=shG();
  switch(d.act){
    case 'sp_toggle':{
      if(!g[d.id])break;
      edit('sg','shops','shops.'+d.id+'.open',!g[d.id].open);
      render();break;}
    case 'sp_edit':u.edit=d.id;u.view='edit';u.del='';render();break;
    case 'sp_new':{
      if(Object.keys(g).length>=SHOP_MAX||!shRoom())break;
      const id=shKey(),name=String(u.newname||'').trim()||'New shop';
      const st=shDefStock();
      const rows=shTplRows(u.tpl).filter(x=>x[2]!=null).map(x=>shMkItem(x,st));
      const all=Object.assign({},g);
      all[id]={name,place:'',open:false,note:'',at:Date.now(),items:rows};
      edit('sg','shops','shops',all);
      u.edit=id;u.newname='';u.tpl='';u.view='edit';
      toast('“'+name+'” is made. It is closed until you open it.',true);
      render();break;}
    case 'sp_preset':if(d.id)shLoadPreset(d.id);render();break;
    case 'sp_del':u.del=d.id;render();break;
    case 'sp_delno':u.del='';render();break;
    case 'sp_delyes':{
      const all=Object.assign({},g);
      delete all[d.id];
      edit('sg','shops','shops',all);
      u.del='';if(u.edit===d.id)u.edit='';
      render();break;}
    case 'sp_additem':{
      const s=g[u.edit];
      if(!s||!shRoom())break;
      const name=String(u.addq||'').trim();
      if(!name){toast('Type the item to add first.');break;}
      const items=(Array.isArray(s.items)?s.items:[]).slice();
      if(items.length>=SHOP_ITEMS_MAX)break;
      if(TM_RE.test(name)&&!SCAT_BY.get(dexKey(name))&&PTA.idx&&!PTA.lists&&!b._again){ptaLists().then(()=>{b._again=1;shAct(b);});break;}
      const hit=SCAT_BY.get(dexKey(name)),tm=!hit&&tmParse(name);
      if(tm&&tm.kind!=='HM'){const nm=tmLabel(tm.kind,tm.move);items.push({k:shKey(),name:nm,cat:'TMs and TRs',price:tmPrice(tm.kind,tm.mv),stock:shDefStock(),desc:'Teaches '+tm.move+' ('+(tm.mv.f||'At-Will')+', '+(tm.mv.t||'Normal')+'). '+(tm.kind==='TR'?'1 use.':'3 uses.')+' Only to a Pokémon with a proficiency for it.',unlock:'',hide:false});edit('sg','shops','shops.'+u.edit+'.items',items);u.addq='';toast('Added '+nm+'.',true);render();break;}
      items.push(hit?shMkItem(hit,shDefStock()):{k:shKey(),name,cat:'',price:null,stock:shDefStock(),desc:'',unlock:'',hide:false});
      edit('sg','shops','shops.'+u.edit+'.items',items);
      u.addq='';
      toast(hit?'Added '+hit[0]+'.':'Added “'+name+'”. Give it a price so players can buy it.',true);
      render();break;}
    case 'sp_addcat':{
      const s=g[u.edit];
      if(!s||!u.addcat||!shRoom())break;
      const items=(Array.isArray(s.items)?s.items:[]).slice();
      const have=new Set(items.map(x=>dexKey(x.name)));
      const st=shDefStock();
      let n=0;
      SCAT.forEach(x=>{
        if(SCAT_CATS[x[1]]!==u.addcat||x[2]==null||have.has(dexKey(x[0]))||items.length>=SHOP_ITEMS_MAX)return;
        items.push(shMkItem(x,st));n++;
      });
      edit('sg','shops','shops.'+u.edit+'.items',items);
      toast(n?'Added '+n+' items.':'Everything in that group is already here.',true);
      render();break;}
    case 'sp_reach':shSetReached(d.id,!shRc()[d.id]);render();break;
    case 'sp_reachadd':if(u.rpick){shSetReached(u.rpick,true);u.rpick='';}render();break;
    case 'sp_logmore':u.ln+=60;render();break;
    default:break;
  }
}

/* ---------- Contest ribbons and the road to the Grand Festival ----------
   Every trainer sheet has a ribbon case, like the gym badge case: one slot per contest hall, ticked when the trainer wins a
   ribbon there. The case is kept on the trainer's own sheet (trainers/<uid>, field "ribbons"), so the owner and the GM can
   tick it and the existing rules already allow it.
   Which ribbons exist, and how many a trainer needs for the Grand Festival, belongs to the whole table, so it is kept with the
   other table settings (meta/table: "ribbonHalls" and "ribbonNeed"), which every member reads and only the GM writes.
   Until the GM changes the list, the table uses the 16 contest halls on its map (CT_HALLS), including the Aqua Ribbon of the
   Wallace Cup at Lake Valor. Five ribbons from five different halls open the Grand Festival.
   Nothing here is handbook text. The contest rules it points to are written in the table's own words. */
/* the contest halls on the table's map. [ribbon key, ribbon name, place id, hall, contest type, monthly rule, when (words)]
   A monthly rule is {n: which week (1-4, or -1 for the last), wd: weekday (0 Sunday ... 6 Saturday), len: days, mo: months it runs (1-12)}. */
const CT_HALLS=[
  ['jubilife','Jubilife','jubilife-city','Jubilife Contest Hall (Broadcast District)','Cool',{n:4,wd:0,len:1},'the fourth Sunday of every month, televised'],
  ['floaroma','Floaroma','floaroma-town','Floaroma Contest Hall','Cute',{n:1,wd:0,len:1},'the first Sunday of every month'],
  ['hearthome','Hearthome','hearthome-city','Super Contest Hall','All categories, the hardest field',{n:1,wd:6,len:2},'the first weekend of every month'],
  ['majolica','Majolica','majolica-town','The Glaze Hall','A different category each month; ceramic ribbons',{n:2,wd:6,len:2},'the second weekend of every month'],
  ['solaceon','Solaceon','solaceon-town','Solaceon Contest Center','Any category, beginner-friendly',{n:3,wd:6,len:1},'the third Saturday of every month'],
  ['celestic','Celestic','celestic-town','The Rite Hall','Beauty (Heritage Contests, judged on composure)',null,'four times a year: 20 March, 21 June, 22 September and 21 December'],
  ['sage','Sage','sage-town','The Spice Hall','Clever, with tasting rounds',{n:2,wd:6,len:1},'the second Saturday of every month'],
  ['chocovine','Chocovine','chocovine-town','The Sweet Stage','Cute, with the Poffin Cook-Off the night before',{n:-1,wd:6,len:2},'the last weekend of every month'],
  ['sandalstraw','Sandalstraw','sandalstraw-town','The Rotunda','Tough (natural, woven costumes win favor)',{n:1,wd:6,len:1},'the first Saturday of every month'],
  ['lilypad','Lilypad','lilypad-town','The Steam Hall','Beauty and Cute, plus the Lily Cup in February',{n:4,wd:6,len:1},'the fourth Saturday of every month'],
  ['snowpoint','Snowpoint','snowpoint-city','Frost Hall','Cool, plus the Midwinter Appeal Cup',{n:3,wd:6,len:2,mo:[12,1,2,3]},'the third weekend of each month, December to March'],
  ['arrowroot','Millrace','arrowroot-town','Millhall','Tough',{n:2,wd:6,len:1,mo:[10,11,12,1,2,3,4,5,6,7]},'the second Saturday of each month, October to July; the Valor Circuit qualifier on 15 August'],
  ['brussel','Greenhouse','brussel-town','The Greenhouse Hall','Beauty',{n:3,wd:6,len:1,mo:[10,11,12,1,2,3,4,5,6,7]},'the third Saturday of each month, October to July; the Valor Circuit qualifier on 25 August'],
  ['neighborly','Crossroads','neighborly-town','Crossroads Hall','Clever',{n:4,wd:6,len:1,mo:[10,11,12,1,2,3,4,5,6,7]},'the fourth Saturday of each month, October to July; the Valor Circuit qualifier on 4 September'],
  ['daybreak','Sunrise','daybreak-town','Sunrise Hall','Cool (the final round at first light)',{n:1,wd:0,len:1,mo:[10,11,12,1,2,3,4,5,6,7]},'the first Sunday of each month at dawn, October to July; the Valor Circuit final qualifier on 12 September'],
  ['aqua','Aqua','valor-lakefront-and-grand-festival','The Wallace Cup at Lake Valor','Invitational, all categories',null,'once a year, 25–26 July']
];
const RIB_DEFAULT=CT_HALLS.map(x=>[x[0],x[1],(PD_BY[x[2]]?PD_BY[x[2]].name:'')+' · '+x[3]+' · '+x[4].split(/[,(;]/)[0].trim()]);
/* each hall's place page says what it runs and when */
CT_HALLS.forEach(x=>{const f=PD_BY[x[2]];if(!f)return;f.facts.push(['Contest hall',x[3]+': '+x[4]+'. Contests '+x[6]+'. Wins earn the '+x[1]+' Ribbon.']);});
const RIB_NEED=5,RIB_MAX=40;
S.ui.rib=S.ui.rib||{reset:false};
['rb_ready','rb_road','rb_gf'].forEach(k=>{if(S.ui.ref&&S.ui.ref.open&&!(k in S.ui.ref.open))S.ui.ref.open[k]=true;});

const ribCustom=()=>Array.isArray(S.meta.ribbonHalls);
const ribDefaults=()=>RIB_DEFAULT.map(([k,n,t])=>({k,n,t}));
function ribHalls(){
  const src=ribCustom()?S.meta.ribbonHalls:ribDefaults();
  const seen=new Set(),out=[];
  src.forEach(x=>{
    if(!x||typeof x!=='object')return;
    const k=String(x.k||'');
    if(!k||seen.has(k))return;
    seen.add(k);
    out.push({k,n:String(x.n||'').trim()||'Unnamed',t:String(x.t||'').trim()});
  });
  return out;
}
const ribNeedEff=halls=>Math.min(clamp(Math.floor(num(S.meta.ribbonNeed))||RIB_NEED,1,RIB_MAX),Math.max(1,halls.length));
const ribCount=(t,halls)=>(halls||ribHalls()).filter(x=>t&&t.ribbons&&t.ribbons[x.k]).length;
const ribColor=k=>{let a=7;for(let i=0;i<k.length;i++)a=(a*31+k.charCodeAt(i))>>>0;return 'hsl('+(a%360)+' 62% 52%)';};
/* a simple original rosette with two tails; drawn in each ribbon's own colour by CSS */
const RIB_GLYPH=(()=>{
  const p=[];
  for(let i=0;i<24;i++){const r=i%2?9:11,a=Math.PI*i/12-Math.PI/2;p.push((16+r*Math.cos(a)).toFixed(2)+','+(12.5+r*Math.sin(a)).toFixed(2));}
  return raw('<svg class="gl" viewBox="0 0 32 32" aria-hidden="true" fill="currentColor"><path d="M10.5 19.5L6.8 29.6l4.7-2.3 2.9 3.7 2-10.2z"/><path d="M21.5 19.5l3.7 10.1-4.7-2.3-2.9 3.7-2-10.2z" opacity=".82"/><polygon points="'+p.join(' ')+'"/><circle cx="16" cy="12.5" r="5" fill="rgba(10,16,40,.38)"/><circle cx="16" cy="12.5" r="2" fill="rgba(255,255,255,.85)"/></svg>');
})();
const ribBar=(n,need)=>h`<div class="rbar" role="img" aria-label="${n} of ${need} ribbons toward the Grand Festival"><i ${raw('style="width:'+Math.min(100,Math.round(100*n/Math.max(1,need)))+'%"')}></i></div>`;
/* a short line for the overview card */
function ribBrief(t){
  const halls=ribHalls(),n=ribCount(t,halls),need=ribNeedEff(halls);
  return n>=need?n+' · Grand Festival ✓':n+' of '+need;
}

/* ----- the ribbon case on a trainer sheet ----- */
function ribCase(uid,t,ro){
  const halls=ribHalls(),n=ribCount(t,halls),need=ribNeedEff(halls);
  const rb=t.ribbons||{},pop=S.ui.pop,left=Math.max(0,need-n);
  return h`<div class="ribhead"><h3 class="refg">Contest ribbons</h3><span class="mono sub">${n}/${halls.length}</span>
      <span class="pill ${left?'':'open'}">${left?left+' more for the Grand Festival':'Qualified for the Grand Festival'}</span></div>
    ${ribBar(n,need)}
    ${halls.length?h`<div class="case rib ${left?'':'full'}" role="group" aria-label="Ribbon case, ${n} of ${halls.length} earned">
      ${halls.map(x=>h`<button class="slot ${rb[x.k]?'on':''}${rb[x.k]&&pop&&pop.uid===uid&&pop.key==='r:'+x.k?' pop':''}" ${raw('style="--bc:'+ribColor(x.k)+'"')} data-act="rb_toggle" data-key="${x.k}" data-uid="${uid}" aria-pressed="${String(!!rb[x.k])}" title="${x.n} Ribbon${x.t?', '+x.t:''}" ${dis(ro)}><span class="medal">${RIB_GLYPH}</span><span class="bn">${x.n}</span>${x.t?h`<small>${x.t}</small>`:''}</button>`)}
    </div>`:h`<p class="sub">The GM has not set up any ribbons yet.</p>`}
    <p class="sub">${need} ribbons from ${need} different contest halls opens the Grand Festival. <button class="lnk" data-act="rb_goto">How it works</button></p>`;
}

/* ----- the Ribbons page inside Contests ----- */
function ribView(){
  const halls=ribHalls(),need=ribNeedEff(halls),ids=tids(),custom=ribCustom();
  const holders=k=>ids.filter(u=>S.trainers[u]&&S.trainers[u].ribbons&&S.trainers[u].ribbons[k]).map(u=>tName(S.trainers[u]));
  const ready=ids.map(u=>{const t=S.trainers[u];const n=ribCount(t,halls);return h`<div class="ribrow"><span class="rn"><b>${tName(t)}</b></span><span class="mono sub">${n} of ${need}</span>${ribBar(n,need)}<span class="pill ${n>=need?'open':''}">${n>=need?'Qualified':(need-n)+' to go'}</span></div>`;});
  return h`<div class="refp">
    <p class="sub">The ribbon case on each trainer sheet tracks contest ribbons the way the badge case tracks gym badges. This page is how the table gets from the first ribbon to the Grand Festival.</p>
    ${refSec('rb_ready','Who is ready for the Grand Festival',ids.length?h`<div class="ribrows">${ready}</div><p class="sub">${need} ribbons from ${need} different contest halls qualify a trainer.</p>`:h`<p class="sub">No trainers yet.</p>`)}
    ${refSec('rb_road','The road to the Grand Festival',h`<ul class="reful">
      <li><b>Win ribbons.</b> A contest hall gives its Contest Ribbon to whoever has the most Star Points at the end of the Award stage. Each hall has its own ribbon, which goes in the ribbon case on the trainer sheet. Winning again at a hall whose ribbon you already hold does not add to the count: it is one honour per contest hall.</li>
      <li><b>${need} ribbons from ${need} different halls.</b> Collect that many and you are invited to the Grand Festival. Each must come from a different hall. The GM can change the number below.</li>
      <li><b>Registering.</b> Your first ribbon registers you in the region’s contest circuit. The GM’s Guide says the Grand Festival is usually held a week or two before the League championships, and that circuits can have strict expectations for attire and how you carry yourself.</li>
      <li><b>Using the ribbons up.</b> In the anime, the ribbons used to enter a Grand Festival cannot be used again. If your table wants that, the GM can untick those ribbons on the sheet afterwards.</li>
    </ul>`)}
    ${refSec('rb_gf','How the Grand Festival runs',h`<ul class="reful">
      <li><b>Appeal stage: Double Performance.</b> Every trainer brings two Pokémon, and both take part in each of the five appeals. Each round, both Pokémon pick a move and the two are combined: take the contest type from one move and the keyword from the other. Neither Pokémon can repeat the move it used last round unless that move is Reliable. This is the handbook’s variant, and the Sinnoh Grand Festival in the anime used it.</li>
      <li><b>The cut.</b> The best performers go on to the finals. In the anime, 32 of the 108 coordinators moved on, in four blocks of eight. Choose the number that fits the size of your field.</li>
      <li><b>Finals: Rival Showcase.</b> Trainers are paired off and perform in direct opposition each round. Appeals are judged against each other rather than alone, and a typical Star Point is “most rounds won against opposing coordinators”. The winner of the last pairing takes the Ribbon Cup and the title of Top Coordinator.</li>
      <li><b>The prize.</b> The GM’s Guide says a Grand Festival champion can walk away with over 400,000 Pokécredits, sometimes more than a League championship pays.</li>
      <li>The handbook’s Double Performance and Rival Showcase rules are on the <button class="lnk" data-act="ct_view" data-v="how">How contests work</button> page under Variations.</li>
    </ul>`)}
    ${refSec('rb_circ',custom?'This table’s contest circuit':'The Sinnoh contest circuit',h`
      <p class="sub">${custom?'The GM has set up this table’s own list of ribbons.':'These are the contest halls on the region map: one ribbon each, plus the Aqua Ribbon of the Wallace Cup at Lake Valor. Each hall has its own type of contest and holds one every month; see the Calendar and each town’s page. The GM can rename them or add others.'}</p>
      ${halls.length?h`<ul class="ribl">${halls.map(x=>{const w=holders(x.k);return h`<li><span class="ribdot" ${raw('style="--bc:'+ribColor(x.k)+'"')}></span><b>${x.n} Ribbon</b>${x.t?h` <span class="sub">${x.t}</span>`:''}${w.length?h`<span class="ribwho">${w.join(', ')}</span>`:''}</li>`;})}</ul>`:h`<p class="sub">No ribbons yet.</p>`}`)}
    ${S.me.admin?ribEditor(custom):''}
  </div>`;
}

/* ----- the GM's editor ----- */
const ids_holding=k=>tids().filter(u=>S.trainers[u]&&S.trainers[u].ribbons&&S.trainers[u].ribbons[k]).length;
function ribEditor(custom){
  const raws=custom?S.meta.ribbonHalls:[];
  return h`<section class="panel ribed"><div class="ph"><h2>Set up the ribbons</h2><span class="pill gm">GM only</span></div>
    <div class="fgrid">${fNum('Ribbons needed for the Grand Festival','meta','table','ribbonNeed',S.meta,{min:1,max:RIB_MAX})}</div>
    ${custom?h`<div class="spedlist">${raws.map((x,i)=>h`<div class="spedrow"><div class="sped1">${fText('Ribbon name (without the word Ribbon)','meta','table','ribbonHalls.'+i+'.n',S.meta,{ph:'e.g. Jubilife'})}${fText('Town or event','meta','table','ribbonHalls.'+i+'.t',S.meta,{ph:'e.g. Jubilife City'})}</div>
        <div class="row sp"><span class="sub">${ids_holding(x&&x.k)} of ${tids().length} trainers hold it</span>${rowBtns('meta','table','ribbonHalls',i,raws.length,false)}</div></div>`)}</div>
      <div class="row"><button class="btn sm" data-act="rb_add" ${raws.length>=RIB_MAX?raw('disabled'):''}>Add a ribbon</button>
        ${S.ui.rib.reset?h`<button class="btn sm danger" data-act="rb_resetyes">Yes, go back to the map’s list</button><button class="btn sm" data-act="rb_resetno">Keep my list</button>`:h`<button class="btn sm ghost" data-act="rb_reset">Use the map’s list again</button>`}</div>
      <p class="sub">Removing a ribbon takes it out of every trainer’s case and count. The ticks stay saved on the sheets, but only ribbons on this list are counted or shown.</p>`
      :h`<p class="sub">The table is using the ${RIB_DEFAULT.length} contest halls on the map. To rename them, remove some, or add your own, start from that list.</p>
      <div class="row"><button class="btn sm" data-act="rb_custom">Edit the list</button></div>`}
  </section>`;
}

function ribAct(b){
  const d=b.dataset,o=S.ui.rib;
  switch(d.act){
    case 'rb_toggle':{
      const t=S.trainers[d.uid];
      if(!t||!canEditT(d.uid))return;
      const on=!(t.ribbons&&t.ribbons[d.key]);
      edit('t',d.uid,'ribbons.'+d.key,on);
      if(on){const p={uid:d.uid,key:'r:'+d.key};S.ui.pop=p;setTimeout(()=>{if(S.ui.pop===p)S.ui.pop=null;},1400);}
      else S.ui.pop=null;
      render();break;}
    case 'rb_goto':
      S.ui.ct.v='rib';S.ui.toTop=true;
      if(S.tab!=='contest')setTab('contest');else render();
      break;
    case 'rb_custom':
      if(!S.me.admin||ribCustom())return;
      edit('meta','table','ribbonHalls',ribDefaults());
      render();break;
    case 'rb_add':{
      if(!S.me.admin||!ribCustom())return;
      const arr=S.meta.ribbonHalls.slice();
      if(arr.length>=RIB_MAX)return;
      arr.push({k:'c'+Date.now().toString(36)+Math.floor(Math.random()*1296).toString(36),n:'',t:''});
      edit('meta','table','ribbonHalls',arr);
      render();break;}
    case 'rb_reset':o.reset=true;render();break;
    case 'rb_resetno':o.reset=false;render();break;
    case 'rb_resetyes':
      if(!S.me.admin)return;
      o.reset=false;
      edit('meta','table','ribbonHalls',null);
      render();break;
  }
}

/* the ribbon chosen in the Award honors form: the first ribbon until the GM picks, "" for a ribbon with no slot in the case */
function awardRibbon(){
  const a=S.ui.award,halls=ribHalls();
  if(a.ribbon==='')return '';
  return halls.some(x=>x.k===a.ribbon)?a.ribbon:(halls[0]?halls[0].k:'');
}

