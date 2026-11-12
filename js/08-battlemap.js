'use strict';
/* Sinnoh Trainer Log · 08-battlemap. The files in js/ are classic scripts that share one scope: load them in order (see index.html). */
/* ---------- Battle map: a picture or blank grid, a grid over it, and a token for each Pokémon and foe ----------
   Where things live, and why:
     gm/bmap, gm/bmi_<n>     the GM's working copy: the settings, the picture in chunks, and where each foe stands and
                             whether it is shown. Only the GM can read these, so a map that has not been shown is not on
                             anybody else's device.
     meta/bmap               what the table sees, only while the map is shown: the settings, and the foes the GM chose to show.
     mapimg/bm_<n>, bm_meta  the table's copy of the picture, in the collection the region map already uses.
     trainers/<uid>/pokemon/<id>.bpos
                             where a Pokémon stands, kept on its own sheet so its player can move it without the GM.
   No rules change: every one of these is a place the existing rules already cover. */
S.ui.bm=S.ui.bm||{zoom:1,sel:'',ruler:false,rl:null,rlText:'',cal:0,calA:null,cols:'',rows:'',cn:'',setup:false,zc:null};
S.ui.bt.view=S.ui.bt.view||'order';
S.bmap=S.bmap||{};S.bmGm=S.bmGm||{};S.bmGmCh=S.bmGmCh||{};S.bmGmSrc='';S.bmGmSig='';S.bmSrc='';S.bmSig='';

const BM_CH=150000;
/* how many squares a Pokémon covers on each side, by its size */
const BM_FP={Tiny:1,Small:1,Medium:1,Large:2,Huge:3,Gigantic:4};
const bmFoot=s=>BM_FP[s]||1;
const bmG=()=>S.bmGm||{};
const bmAvail=()=>!!(S.me.admin||(S.bmap&&S.bmap.on&&S.bmap.v));

/* the map this person is looking at: the GM sees the working copy, everyone else sees the shared one */
function bmCfg(){
  const adm=!!S.me.admin;
  const d=adm?bmG():(S.bmap&&S.bmap.on?S.bmap:null);
  if(!d||!d.v||!num(d.w)||!num(d.h))return null;
  const w=num(d.w),hh=num(d.h);
  const gx=Math.max(4,num(d.gx)||50);
  const ox=clamp(num(d.ox),0,w),oy=clamp(num(d.oy),0,hh);
  const obj=o=>o&&typeof o==='object'&&!Array.isArray(o)?o:{};
  return {v:d.v,w,h:hh,blank:!!d.blank,gx,ox,oy,cols:Math.max(1,Math.floor((w-ox)/gx+1e-6)),rows:Math.max(1,Math.floor((hh-oy)/gx+1e-6)),
    grid:d.grid!==false,name:String(d.name||''),src:d.blank?'':(adm?S.bmGmSrc:S.bmSrc),live:adm?!!d.live:true,adm,
    ter:Array.isArray(d.ter)?d.ter.map(String):[],tsh:d.tsh!==false,wt:d.wt!==false,mk:obj(d.mk),tp:obj(d.tp),
    fg:d.fg===true,fa:d.fa!==false,fv:clamp(Math.round(num(d.fv))||6,1,30),fw:d.fw!==false,
    fz:adm&&Array.isArray(d.fz)?d.fz.map(String):[],fr:!adm&&Array.isArray(d.fr)?d.fr.map(String):[]};
}
/* the picture comes in chunks: put them together once every one has arrived */
function bmJoin(chunks,n,v){
  let sig=v+'|'+n,out='';
  for(let i=0;i<n;i++){
    const c=chunks[i];
    if(!c||c.v!==v||typeof c.d!=='string')return null;
    sig+='|'+c.d.length;out+=c.d;
  }
  return {sig,out};
}
function bmAssembleGm(){
  const g=bmG();
  if(!g.v||g.blank||!num(g.n)){S.bmGmSrc='';S.bmGmSig='';return;}
  const n=num(g.n),ch=S.bmGmCh;
  let sig=g.v+'|'+n;
  for(let i=0;i<n;i++){const c=ch[i];if(!c||c.v!==g.v||typeof c.d!=='string'){S.bmGmSrc='';S.bmGmSig='';return;}sig+='|'+c.d.length;}
  if(sig===S.bmGmSig)return;
  const j=bmJoin(ch,n,g.v);
  S.bmGmSig=j?j.sig:'';S.bmGmSrc=j?imgSrc(j.out):'';
}
function bmAssemble(){
  const p=S.bmap||{},m=S.mapChunks&&S.mapChunks.bm_meta;
  if(!p.on||p.blank||!m||m.v!==p.v||!num(m.n)){S.bmSrc='';S.bmSig='';return;}
  const ch={};
  for(let i=0;i<num(m.n);i++)ch[i]=S.mapChunks['bm_'+i];
  const j=bmJoin(ch,num(m.n),p.v);
  if(!j){S.bmSrc='';S.bmSig='';return;}
  if(j.sig===S.bmSig)return;
  S.bmSig=j.sig;S.bmSrc=imgSrc(j.out);
}

/* ----- tokens ----- */
function bmTokens(cfg){
  const gm=!!S.me.admin,b=BT(),out=[];
  btOrder().forEach(cid=>{
    const c=b.c[cid],v=btInfo(cid,gm);
    if(!v)return;
    if(c.s==='t')return;   /* a trainer's token is made below, from their sheet */
    if(c.s==='a'){
      const m=getLocal('p',c.r)||{},bp=m.bpos;
      const ok=!!bp&&num(bp.v)===cfg.v&&num(bp.x)>=0&&num(bp.y)>=0;
      out.push({cid,side:'a',v,x:ok?num(bp.x):-1,y:ok?num(bp.y):-1,placed:ok,fp:bmFoot(m.size),mine:canEditT(v.uid),vis:true});
    }else{
      const e=gm?(bmG().f||{})[cid]:((S.bmap||{}).f||{})[cid];
      const ok=!!e&&num(e.x)>=0&&num(e.y)>=0;
      const fp=gm?bmFoot((foeOf(cid)||{}).sz):clamp(Math.round(num(e&&e.s))||1,1,4);
      out.push({cid,side:'f',v,x:ok?num(e.x):-1,y:ok?num(e.y):-1,placed:ok,fp,mine:gm,vis:gm?(ok&&num(e.vis)>0):true});
    }
  });
  bmTrainerToks(cfg,out);
  return out;
}
/* ----- trainer tokens: every player with a Pokémon in the battle, and every NPC trainer whose Pokémon are foes.
   A player's spot is kept on their trainer sheet (bpos), like their Pokémon's; an NPC's is kept by the GM (gm/bmap tn)
   and reaches the table only once the GM shows it, under the name the table knows them by. ----- */
function bmTrainerToks(cfg,out){
  const gm=!!S.me.admin,b=BT(),c=b.c||{};
  const pcs=new Set(),nts=new Set();
  Object.keys(c).forEach(cid=>{
    const x=c[cid];
    if(x.s==='a'){const uid=String(x.r||'').split('/')[0];if(S.trainers[uid])pcs.add(uid);}
    else if(x.s==='t'){if(S.trainers[x.u])pcs.add(x.u);}
    else if(gm){const f=foeOf(cid);if(f&&f.nt&&NTS()[f.nt])nts.add(f.nt);}
  });
  pcs.forEach(uid=>{
    const t=S.trainers[uid],bp=t.bpos,ok=!!bp&&num(bp.v)===cfg.v&&num(bp.x)>=0&&num(bp.y)>=0;
    const hp=t.hp&&num(t.hp.max)>0?{cur:num(t.hp.cur),max:num(t.hp.max)}:null;
    const v={name:tName(t),owner:tName(t),uid,hp,showHp:2,down:!!hp&&hp.cur<=0,status:'',types:[],tr:t,side:'t'};
    out.push({cid:'tr_'+uid,side:'t',v,x:ok?num(bp.x):-1,y:ok?num(bp.y):-1,placed:ok,fp:1,mine:canEditT(uid),vis:true});
  });
  if(gm){
    const tn=bmG().tn||{};
    nts.forEach(id=>{
      const nt=NTS()[id],e=tn[id],ok=!!e&&num(e.x)>=0&&num(e.y)>=0;
      const v={name:ntName(nt),owner:'NPC trainer',hp:null,showHp:0,down:false,status:'',types:[],nt,side:'n'};
      out.push({cid:'nt_'+id,side:'n',v,x:ok?num(e.x):-1,y:ok?num(e.y):-1,placed:ok,fp:1,mine:true,vis:ok&&num(e.vis)>0});
    });
  }else{
    const tn=(S.bmap||{}).tn||{};
    Object.keys(tn).forEach(id=>{
      const e=tn[id];
      const v={name:String(e.n||'Trainer'),owner:'Trainer',hp:null,showHp:0,down:false,status:'',types:[],side:'n'};
      out.push({cid:'nt_'+id,side:'n',v,x:num(e.x),y:num(e.y),placed:true,fp:1,mine:false,vis:true});
    });
  }
}
const bmPct=(n,d)=>(n/d*100).toFixed(4)+'%';
function bmShort(s){s=String(s||'');return s.length>14?s.slice(0,13)+'…':s;}
function bmTok(cfg,t){
  const v=t.v,hp=v.hp;
  const mx=hp?Math.max(1,num(hp.max)):0;
  const ratio=hp?clamp(num(hp.cur)/mx,0,1):null;
  const b=BT(),sel=S.ui.bm.sel===t.cid;
  const bc=b.on?btC(b.turn):null;
  const turn=!!b.on&&(b.turn===t.cid||(t.side==='t'&&!!bc&&bc.s==='t'&&'tr_'+bc.u===t.cid));
  const cls=['bmt',t.side==='a'?'ally':t.side==='t'?'ally tr':t.side==='n'?'foe tr':'foe',turn?'turn':'',v.down?'down':'',t.vis?'':'hid',sel?'sel':'',t.mine?'mine':''].filter(Boolean).join(' ');
  const pic=t.side==='a'?monPic(v.m):t.side==='t'?pimg((v.tr&&v.tr.img)||'',v.name,'thumb'):t.side==='n'?pimg('',v.name,'thumb'):foePic(v);
  const label=v.name+(t.side==='a'?', '+v.owner:t.side==='t'?', trainer':t.side==='n'?', NPC trainer':', foe')+(hp&&v.down?', down':'')+(hp?(v.showHp===1?', about '+Math.round(ratio*100)+' percent health':', '+num(hp.cur)+' of '+mx+' HP'):'')+(t.vis?'':', hidden from players')+', column '+(t.x+1)+', row '+(t.y+1)+(t.mine?'. Drag to move it, or use the arrow keys.':'');
  return h`<button type="button" class="${cls}" data-bmt="${t.cid}" data-act="bm_sel" data-cid="${t.cid}" aria-pressed="${String(sel)}" aria-label="${label}" title="${v.name}" style="left:${bmPct(cfg.ox+t.x*cfg.gx,cfg.w)};top:${bmPct(cfg.oy+t.y*cfg.gx,cfg.h)};width:${bmPct(t.fp*cfg.gx,cfg.w)};height:${bmPct(t.fp*cfg.gx,cfg.h)};--c:${(cfg.gx/cfg.w*100).toFixed(4)}cqw">
    <span class="bmt-pic">${pic}</span>${ratio!=null?h`<span class="bmt-hp ${hpCls({cur:ratio,max:1})}"><i style="width:${Math.round(ratio*100)}%"></i></span>`:''}${v.status?h`<span class="bmt-st">${String(v.status).slice(0,3).toUpperCase()}</span>`:''}${t.vis?'':h`<span class="bmt-eye" aria-hidden="true">hidden</span>`}<span class="bmt-nm">${bmShort(v.name)}</span></button>`;
}

/* ----- placing and moving ----- */
function bmClampXY(cfg,t,x,y){
  return {x:clamp(Math.round(x),0,Math.max(0,cfg.cols-t.fp)),y:clamp(Math.round(y),0,Math.max(0,cfg.rows-t.fp))};
}
/* o.free: the square was already checked (a drag does that as it goes) or the GM chose to ignore walls */
function bmSetPos(cid,x,y,o){
  const cfg=bmCfg();
  if(!cfg)return;
  const t=bmTokens(cfg).find(k=>k.cid===cid);
  if(!t||!t.mine)return;
  let p=bmClampXY(cfg,t,x,y),msg='';
  if(!(o&&o.free)&&bmWallsOn(cfg)){
    if(!t.placed){
      if(bmFootBlocked(cfg,t.fp,p.x,p.y)){toast('That square is a wall.');return;}
    }else{
      const r=bmWalk(cfg,t.fp,{x:t.x,y:t.y},p);
      if(r.blocked){
        if(r.x===t.x&&r.y===t.y){toast('A wall is in the way.');return;}
        msg='A wall stopped it.';
      }
      p={x:r.x,y:r.y};
    }
  }
  if(t.side==='t'){
    edit('t',cid.slice(3),'bpos',{x:p.x,y:p.y,v:cfg.v});
  }else if(t.side==='n'){
    const id=cid.slice(3),old=(bmG().tn||{})[id]||{};
    edit('bg','bmap','tn.'+id,{x:p.x,y:p.y,vis:num(old.vis)>0?1:0});
    bmSync();
  }else if(t.side==='a'){
    edit('p',btC(cid).r,'bpos',{x:p.x,y:p.y,v:cfg.v});
  }else{
    const old=(bmG().f||{})[cid]||{};
    edit('bg','bmap','f.'+cid,{x:p.x,y:p.y,vis:num(old.vis)>0?1:0});
    bmSync();
  }
  /* said after the save has started, or "Saving…" would replace it */
  if(msg)toast(msg);
  if(t.side==='a'||t.side==='t')bmFogSoon();
}
function bmOff(cid){
  const cfg=bmCfg();
  const t=cfg&&bmTokens(cfg).find(k=>k.cid===cid);
  if(!t||!t.mine)return;
  if(t.side==='t'){edit('t',cid.slice(3),'bpos',null);bmFogSoon();}
  else if(t.side==='n'){const tn=Object.assign({},bmG().tn||{});delete tn[cid.slice(3)];edit('bg','bmap','tn',tn);bmSync();}
  else if(t.side==='a'){edit('p',btC(cid).r,'bpos',null);bmFogSoon();}
  else{
    const f=Object.assign({},bmG().f||{});delete f[cid];
    edit('bg','bmap','f',f);bmSync();
  }
  if(S.ui.bm.sel===cid)S.ui.bm.sel='';
}
function bmFoeVis(cid,on){
  if(!S.me.admin)return;
  if(String(cid).indexOf('nt_')===0){const id=cid.slice(3);if((bmG().tn||{})[id]){edit('bg','bmap','tn.'+id+'.vis',on?1:0);bmSync();}return;}
  const e=(bmG().f||{})[cid];
  if(!e)return;
  edit('bg','bmap','f.'+cid+'.vis',on?1:0);
  bmSync();
}
/* keeps the table's copy in step with the GM's: the settings, and only the foes the GM has shown */
function bmSync(){
  if(!S.me.admin)return;
  const g=bmG();
  if(!g.v)return;
  const c=BT().c||{},f=g.f||{},keep={};
  let pruned=false;
  Object.keys(f).forEach(cid=>{if(c[cid]&&c[cid].s==='f')keep[cid]=f[cid];else pruned=true;});
  if(pruned)edit('bg','bmap','f',keep);
  const ntIn=new Set(Object.keys(keep).concat(Object.keys(c).filter(cid=>c[cid].s==='f')).map(cid=>(foeOf(cid)||{}).nt).filter(Boolean));
  const tnAll=g.tn||{},tnKeep={};let tnPr=false;
  Object.keys(tnAll).forEach(id=>{if(ntIn.has(id))tnKeep[id]=tnAll[id];else tnPr=true;});
  if(tnPr)edit('bg','bmap','tn',tnKeep);
  if(!g.live)return;
  const gc=bmCfg();
  /* fog of war: which squares the players can see is worked out here, because only the GM's device knows where the covered ones are */
  let fe=null;
  if(gc&&gc.fg){
    const r=bmFogEff(gc);
    if(r.merged)edit('bg','bmap','fz',r.fz);
    fe=r.rows;
  }
  const pubF={};
  Object.keys(keep).forEach(cid=>{
    const e=keep[cid];
    if(num(e.vis)>0&&num(e.x)>=0){
      const fp=bmFoot((foeOf(cid)||{}).sz);
      if(fe&&!bmRowsSeen(fe,num(e.x),num(e.y),fp))return;
      pubF[cid]={x:num(e.x),y:num(e.y),s:fp};
    }
  });
  const pubTn={};
  Object.keys(tnKeep).forEach(id=>{
    const e=tnKeep[id];
    if(num(e.vis)>0&&num(e.x)>=0){
      if(fe&&!bmRowsSeen(fe,num(e.x),num(e.y),1))return;
      const p=ntPub(id);
      pubTn[id]={x:num(e.x),y:num(e.y),n:p&&p.n?String(p.n):'Trainer'};
    }
  });
  /* terrain, markers and shapes reach the table only when the GM has chosen to show them, and not from covered squares */
  let ter=g.tsh===false||!Array.isArray(g.ter)?[]:g.ter.map(String);
  if(fe)ter=bmTerPack(ter.map((r,y)=>{let o='';for(let x=0;x<r.length;x++)o+=((fe[y]||'')[x]||'.')==='.'?'.':r[x];return o;}));
  const mkPub={},tpPub={};
  Object.keys(g.mk||{}).forEach(id=>{
    const m=g.mk[id];
    if(m&&num(m.vis)>0&&num(m.x)>=0&&num(m.y)>=0){
      if(fe&&((fe[num(m.y)]||'')[num(m.x)]||'.')==='.')return;
      mkPub[id]={x:num(m.x),y:num(m.y),k:String(m.k||'note'),l:String(m.l||'')};
    }
  });
  Object.keys(g.tp||{}).forEach(id=>{
    const t=g.tp[id];
    if(t&&num(t.sh)>0){
      const o={k:String(t.k||'burst'),x:num(t.x),y:num(t.y),n:num(t.n)||1,d:num(t.d),w:num(t.w)||1};
      if(t.b===0||t.b===false)o.b=0;
      else if(gc&&bmHasWalls(gc)){
        /* a player may not be able to see the walls, so a shape that walls cut short is sent as the squares it covers */
        const cl=bmTplCells(gc,o);
        if(cl.length<bmTplRaw(gc,o).length){o.c=[];cl.forEach(c=>{o.c.push(c[0],c[1]);});}
      }
      tpPub[id]=o;
    }
  });
  const want={on:true,v:g.v,w:num(g.w),h:num(g.h),blank:!!g.blank,gx:Math.max(4,num(g.gx)||50),ox:num(g.ox),oy:num(g.oy),grid:g.grid!==false,name:String(g.name||''),f:pubF,tn:pubTn,ter,wt:g.wt!==false,mk:mkPub,tp:tpPub,fg:!!fe,fr:fe||[]};
  const cur=S.bmap||{};
  Object.keys(want).forEach(k=>{if(JSON.stringify(cur[k])!==JSON.stringify(want[k]))edit('bm','bmap',k,want[k]);});
}
async function bmDropPublic(){
  const col=S.db.collection('mapimg');
  const m=S.mapChunks&&S.mapChunks.bm_meta;
  const n=Math.max(num(m&&m.n),0);
  try{
    await col.doc('bm_meta').delete();
    for(let i=0;i<n;i++)await col.doc('bm_'+i).delete();
  }catch(e){fail(e);}
}
async function bmLive(on){
  if(!S.me.admin)return;
  const g=bmG();
  if(!g.v){toast('Add a map first.');return;}
  if(on){
    if(!g.blank){
      const n=num(g.n);
      for(let i=0;i<n;i++){const c=S.bmGmCh[i];if(!c||c.v!==g.v){toast('The map picture is still loading. Try again in a moment.');return;}}
      setStatus('busy');
      try{
        const col=S.db.collection('mapimg');
        for(let i=0;i<n;i++)await col.doc('bm_'+i).set({d:S.bmGmCh[i].d,v:g.v});
        await col.doc('bm_meta').set({n,w:num(g.w),h:num(g.h),v:g.v});
      }catch(e){fail(e);return;}
    }
    edit('bg','bmap','live',true);
    bmSync();
    toast('The map is now shown to the players.',true);
  }else{
    edit('bg','bmap','live',false);
    putLocal('bm','bmap',{});
    edit('bm','bmap','on',false);
    await bmDropPublic();
    toast('The map is hidden from the players.',true);
  }
  render();
}
/* hides the shared copy, e.g. before a new map replaces it */
async function bmHidePublic(){
  if(!(S.bmap&&S.bmap.on)&&!(S.mapChunks&&S.mapChunks.bm_meta))return;
  putLocal('bm','bmap',{});
  edit('bm','bmap','on',false);
  await bmDropPublic();
}
async function bmDropChunks(from){
  const n=num(bmG().n);
  try{for(let i=from||0;i<Math.max(n,from||0);i++)await S.db.collection('gm').doc('bmi_'+i).delete();}catch(e){fail(e);}
}
async function bmUpload(file){
  const r=await fileToImage(file,{max:1600,q:0.8,cap:700000});
  const v=Date.now(),url=r.url,n=Math.ceil(url.length/BM_CH),col=S.db.collection('gm');
  const oldN=num(bmG().n);
  setStatus('busy');
  await bmHidePublic();
  for(let i=0;i<n;i++)await col.doc('bmi_'+i).set({d:url.slice(i*BM_CH,(i+1)*BM_CH),v});
  for(let i=n;i<oldN;i++)await col.doc('bmi_'+i).delete();
  const name=String(file.name||'Battle map').replace(/\.[a-z0-9]+$/i,'').slice(0,60)||'Battle map';
  const doc={v,name,w:r.w,h:r.h,blank:false,n,gx:Math.round(r.w/24*100)/100,ox:0,oy:0,grid:true,live:false,f:{}};
  putLocal('bg','bmap',doc);save('bg','bmap',doc,{create:true});
  S.ui.bm.sel='';S.ui.bm.setup=true;S.ui.bm.cn='24';
  toast('Map added. Now line up the grid, then show it to the players.',true);
  render();
}
async function bmBlank(){
  const u=S.ui.bm;
  const cols=clamp(Math.round(num(u.cols)||20),4,80),rows=clamp(Math.round(num(u.rows)||15),4,80);
  const v=Date.now(),oldN=num(bmG().n);
  setStatus('busy');
  await bmHidePublic();
  for(let i=0;i<oldN;i++)await S.db.collection('gm').doc('bmi_'+i).delete();
  const doc={v,name:'Blank grid',w:cols*50,h:rows*50,blank:true,n:0,gx:50,ox:0,oy:0,grid:true,live:false,f:{}};
  putLocal('bg','bmap',doc);save('bg','bmap',doc,{create:true});
  S.ui.bm.sel='';S.ui.bm.setup=true;
  toast('Blank grid added. Show it to the players when you are ready.',true);
  render();
}
async function bmRemoveMap(){
  const n=num(bmG().n);
  await bmHidePublic();
  S.ui.bm.sel='';
  await removeDoc('bg','bmap');
  for(let i=0;i<n;i++)await S.db.collection('gm').doc('bmi_'+i).delete();
  S.bmGmSrc='';S.bmGmSig='';
  toast('The map was removed.',true);
  render();
}
/* End battle: nobody is on the map any more. The map itself stays. */
function bmClearTokens(){
  if(!S.me.admin)return;
  Object.keys(BT().c||{}).forEach(cid=>{
    const c=BT().c[cid];
    if(c&&c.s==='a'){const m=getLocal('p',c.r);if(m&&m.bpos)edit('p',c.r,'bpos',null);}
  });
  if(bmG().v){edit('bg','bmap','f',{});if(Object.keys(bmG().tp||{}).length)edit('bg','bmap','tp',{});bmSync();}
}
function bmCols(){
  const g=bmG(),n=Math.round(num(S.ui.bm.cn));
  if(!g.v||g.blank||n<1)return;
  edit('bg','bmap','gx',Math.max(4,Math.round((num(g.w)-num(g.ox))/n*100)/100));
  bmSync();render();
}
/* two clicks on opposite corners of one square set the square size and where the grid starts */
function bmCalClick(p){
  const u=S.ui.bm;
  if(u.cal===1){u.calA=p;u.cal=2;render();return;}
  if(u.cal!==2||!u.calA)return;
  const a=u.calA;
  const gx=Math.max(4,Math.round((Math.abs(p.ix-a.ix)+Math.abs(p.iy-a.iy))/2*100)/100);
  edit('bg','bmap','gx',gx);
  edit('bg','bmap','ox',Math.round((Math.min(a.ix,p.ix)%gx)*100)/100);
  edit('bg','bmap','oy',Math.round((Math.min(a.iy,p.iy)%gx)*100)/100);
  u.cal=0;u.calA=null;
  bmSync();
  toast('Grid set from the square you marked.',true);
  render();
}
function bmReveal(on){
  if(!S.me.admin)return;
  const f=bmG().f||{};
  Object.keys(f).forEach(cid=>edit('bg','bmap','f.'+cid+'.vis',on?1:0));
  bmSync();render();
}

/* ----- pointer: dragging a token, the ruler, the calibration click ----- */
let bmDrag=null,bmRl=false,bmMoved=false,bmBusy=false,bmQueued=false;
function bmMapEl(){return document.getElementById('bmmap');}
function bmPoint(e){
  const el=bmMapEl(),cfg=bmCfg();
  if(!el||!cfg)return null;
  const r=el.getBoundingClientRect();
  return {ix:(e.clientX-r.left)/r.width*cfg.w,iy:(e.clientY-r.top)/r.height*cfg.h};
}
const bmCellOf=(cfg,p)=>({x:clamp(Math.floor((p.ix-cfg.ox)/cfg.gx),0,cfg.cols-1),y:clamp(Math.floor((p.iy-cfg.oy)/cfg.gx),0,cfg.rows-1)});
function bmDragStart(tok,e){
  const u=S.ui.bm;
  if(u.ruler||u.cal||u.tool==='tpl'||u.tool==='paint'||u.tool==='fog')return;
  const cfg=bmCfg();
  if(!cfg)return;
  let t;
  if(tok.classList.contains('bmk')){
    /* a marker: only the GM moves it */
    const m=cfg.adm&&cfg.mk[tok.dataset.id];
    if(!m)return;
    t={cid:'mk:'+tok.dataset.id,mkId:tok.dataset.id,x:num(m.x),y:num(m.y),fp:1,mine:true,placed:true};
  }else{
    t=bmTokens(cfg).find(k=>k.cid===tok.dataset.cid);
    if(!t||!t.mine||!t.placed)return;
  }
  const r=bmMapEl().getBoundingClientRect();
  bmDrag={cid:t.cid,mkId:t.mkId||'',el:tok,x0:e.clientX,y0:e.clientY,t,cfg,sc:r.width/cfg.w,moved:false,cell:{x:t.x,y:t.y},walls:!t.mkId&&bmWallsOn(cfg),blk:false};
  try{tok.setPointerCapture(e.pointerId);}catch(err){}
  bmBusy=true;
}
function bmDragMove(e){
  const d=bmDrag;
  if(!d)return;
  const dx=e.clientX-d.x0,dy=e.clientY-d.y0;
  if(!d.moved&&Math.hypot(dx,dy)<5)return;
  d.moved=true;d.el.classList.add('drag');
  const sq=d.cfg.gx*d.sc;
  const want=bmClampXY(d.cfg,d.t,d.t.x+dx/sq,d.t.y+dy/sq);
  /* the token follows the finger one square at a time and stops in front of a wall (the GM can hold Shift to go through) */
  if(d.walls&&!bmFree(e)){const r=bmWalk(d.cfg,d.t.fp,d.cell,want);d.cell={x:r.x,y:r.y};d.blk=r.blocked;}
  else{d.cell=want;d.blk=false;}
  d.el.classList.toggle('blk',d.blk);
  d.el.style.left=bmPct(d.cfg.ox+d.cell.x*d.cfg.gx,d.cfg.w);
  d.el.style.top=bmPct(d.cfg.oy+d.cell.y*d.cfg.gx,d.cfg.h);
  d.el.setAttribute('data-moved',Math.max(Math.abs(d.cell.x-d.t.x),Math.abs(d.cell.y-d.t.y))+' sq'+(d.blk?' · wall':''));
}
function bmDragEnd(){
  const d=bmDrag;
  if(!d)return;
  const late=bmQueued;
  bmDrag=null;bmBusy=false;bmQueued=false;
  if(d.moved){
    bmMoved=true;setTimeout(()=>{bmMoved=false;},60);
    if(d.mkId){
      if(d.cell.x!==d.t.x||d.cell.y!==d.t.y)bmMkMove(d.mkId,d.cell.x,d.cell.y);
      S.ui.bm.msel=d.mkId;S.ui.bm.sel='';
    }else{
      if(d.cell.x!==d.t.x||d.cell.y!==d.t.y)bmSetPos(d.cid,d.cell.x,d.cell.y,{free:true});
      if(d.blk)toast(d.cell.x!==d.t.x||d.cell.y!==d.t.y?'A wall stopped it.':'A wall is in the way.');
      S.ui.bm.sel=d.cid;S.ui.bm.msel='';
    }
    render();
  }else if(late){
    /* a plain tap: leave the token where it is until the tap's own click has been handled, or the click has nothing to land on */
    setTimeout(render,80);
  }
}
/* the ruler counts squares, with a diagonal step counting as one */
function bmRulerSvg(cfg,rl){
  if(!rl)return '';
  const cx=c=>cfg.ox+(c[0]+0.5)*cfg.gx,cy=c=>cfg.oy+(c[1]+0.5)*cfg.gx;
  const x1=cx(rl.a),y1=cy(rl.a),x2=cx(rl.b),y2=cy(rl.b);
  const n=Math.max(Math.abs(rl.a[0]-rl.b[0]),Math.abs(rl.a[1]-rl.b[1]));
  const fs=cfg.gx*0.5,sw=cfg.gx*0.12;
  const mx=(x1+x2)/2,my=(y1+y2)/2-cfg.gx*0.35;
  return '<line x1="'+x1+'" y1="'+y1+'" x2="'+x2+'" y2="'+y2+'" stroke="#000" stroke-opacity=".7" stroke-width="'+(sw*1.8)+'" stroke-linecap="round"/>'
    +'<line x1="'+x1+'" y1="'+y1+'" x2="'+x2+'" y2="'+y2+'" stroke="#ffd43b" stroke-width="'+sw+'" stroke-linecap="round"/>'
    +'<circle cx="'+x1+'" cy="'+y1+'" r="'+(sw*1.3)+'" fill="#ffd43b" stroke="#000" stroke-width="'+(sw*0.4)+'"/>'
    +'<text x="'+mx+'" y="'+my+'" text-anchor="middle" font-size="'+fs+'" font-weight="800" fill="#fff" stroke="#000" stroke-width="'+(fs*0.22)+'" paint-order="stroke" style="font-family:sans-serif">'+n+(n===1?' square':' squares')+'</text>';
}
function bmRulerText(rl){
  if(!rl)return '';
  const n=Math.max(Math.abs(rl.a[0]-rl.b[0]),Math.abs(rl.a[1]-rl.b[1]));
  return 'Ruler: '+n+(n===1?' square':' squares');
}
function bmRulerDraw(){
  const cfg=bmCfg(),g=document.getElementById('bmrl'),note=document.getElementById('bmrlnote');
  if(g&&cfg)g.innerHTML=bmRulerSvg(cfg,S.ui.bm.rl);
  if(note)note.textContent=bmRulerText(S.ui.bm.rl)||'Drag across the map to measure.';
}
function bmRulerStart(e){
  const cfg=bmCfg(),p=bmPoint(e);
  if(!cfg||!p)return;
  const c=bmCellOf(cfg,p);
  S.ui.bm.rl={a:[c.x,c.y],b:[c.x,c.y]};
  bmRl=true;bmBusy=true;
  try{bmMapEl().setPointerCapture(e.pointerId);}catch(err){}
  bmRulerDraw();
  e.preventDefault();
}
function bmRulerMove(e){
  const cfg=bmCfg(),p=bmPoint(e);
  if(!cfg||!p||!S.ui.bm.rl)return;
  const c=bmCellOf(cfg,p);
  S.ui.bm.rl.b=[c.x,c.y];
  bmRulerDraw();
}
function bmRulerEnd(){
  bmRl=false;bmBusy=false;
  if(bmQueued){bmQueued=false;setTimeout(render,80);}
}
/* the arrow keys move a focused token by one square (hold Shift for three) */
function bmKey(el,e){
  const cfg=bmCfg();
  if(!cfg)return false;
  if(el.classList.contains('bmk')){
    const m=cfg.adm&&cfg.mk[el.dataset.id];
    if(!m)return false;
    const s2=e.shiftKey?3:1;
    const mx={ArrowLeft:-s2,ArrowRight:s2}[e.key]||0,my={ArrowUp:-s2,ArrowDown:s2}[e.key]||0;
    if(!mx&&!my)return false;
    bmMkMove(el.dataset.id,num(m.x)+mx,num(m.y)+my);
    e.preventDefault();
    render();
    return true;
  }
  const t=bmTokens(cfg).find(k=>k.cid===el.dataset.cid);
  if(!t||!t.mine||!t.placed)return false;
  const s=e.shiftKey?3:1;
  const dx={ArrowLeft:-s,ArrowRight:s}[e.key]||0,dy={ArrowUp:-s,ArrowDown:s}[e.key]||0;
  if(!dx&&!dy)return false;
  bmSetPos(t.cid,t.x+dx,t.y+dy);
  e.preventDefault();
  render();
  return true;
}

/* the map keeps its scroll position across a redraw; after a zoom it keeps the same centre */
function bmScrollAfterRender(prev){
  const mv=document.getElementById('bmview');
  if(!mv)return;
  const zc=S.ui.bm.zc;
  if(zc){
    S.ui.bm.zc=null;
    mv.scrollLeft=zc[0]*mv.scrollWidth-mv.clientWidth/2;
    mv.scrollTop=zc[1]*mv.scrollHeight-mv.clientHeight/2;
  }else if(prev){mv.scrollLeft=prev[0];mv.scrollTop=prev[1];}
}

/* ----- the page ----- */
function bmSwitch(){
  if(!bmAvail())return '';
  const v=S.ui.bt.view==='map'?'map':'order';
  return h`<div class="row bmsw"><div class="seg" role="group" aria-label="Battle view"><button data-act="bm_view" data-v="order" aria-pressed="${String(v==='order')}">Turn order</button><button data-act="bm_view" data-v="map" aria-pressed="${String(v==='map')}">Map</button></div></div>`;
}
function bmTurnBar(){
  const b=BT(),gm=!!S.me.admin,ord=btOrder();
  const cur=b.turn&&ord.indexOf(b.turn)>=0?b.turn:'';
  const cv=cur?btInfo(cur,gm):null;
  const mine=cv&&(cv.side==='a'||cv.side==='t')&&canEditT(cv.uid);
  return h`<div class="row sp bmturn">${b.on&&cv?h`<p class="bnow ${mine?'mine':''}"><b>Round ${num(b.round)||1}</b> · ${mine?'Your turn: ':''}<b>${cv.name}</b> is acting${cv.side==='a'?' · '+cv.owner:''}</p>`:h`<span class="sub">${ord.length?(b.on?'':(gm?'Roll initiative on the Turn order page to start.':'The GM is setting up the battle.')):'No battle is running.'}</span>`}${gm&&b.on?h`<button class="btn sm" data-act="b_next">Next turn</button>`:''}</div>`;
}
function bmGridSvg(cfg){
  if(!cfg.grid)return '';
  const sw=Math.max(1,cfg.w/700),g=cfg.gx;
  return h`<svg class="bmgrid" viewBox="0 0 ${cfg.w} ${cfg.h}" preserveAspectRatio="none" aria-hidden="true"><defs><pattern id="bmpat" patternUnits="userSpaceOnUse" x="${cfg.ox}" y="${cfg.oy}" width="${g}" height="${g}"><path d="M${g} 0H0V${g}" fill="none" stroke="#000" stroke-opacity=".5" stroke-width="${sw*1.6}"/><path d="M${g} 0H0V${g}" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="${sw*0.7}"/></pattern></defs><rect width="${cfg.w}" height="${cfg.h}" fill="url(#bmpat)"/></svg>`;
}
function bmMarkSvg(cfg){
  const u=S.ui.bm;
  const r=cfg.gx*0.18;
  const dot=u.calA?'<circle cx="'+u.calA.ix+'" cy="'+u.calA.iy+'" r="'+r+'" fill="#ffd43b" stroke="#000" stroke-width="'+(r*0.3)+'"/>':'';
  const tpl=bmTpAll(cfg);
  return h`<svg class="bmov" viewBox="0 0 ${cfg.w} ${cfg.h}" preserveAspectRatio="none" aria-hidden="true"><g id="bmtp">${raw(bmTplSvg(cfg,tpl,u.tsel))}</g><g id="bmdr"></g><g id="bmrl">${raw(bmRulerSvg(cfg,u.ruler?u.rl:null))}</g><g>${raw(dot)}</g></svg>`;
}
function bmInfoBar(cfg,toks){
  const u=S.ui.bm,gm=!!S.me.admin;
  const mi=u.msel?bmMkInfo(cfg):'';
  if(mi)return mi;
  const t=toks.find(k=>k.cid===u.sel);
  if(!t)return h`<p class="sub bminfo" aria-live="polite">${u.cal===1?'Tap one corner of a grid square.':u.cal===2?'Now tap the opposite corner of the same square.':u.ruler?'Drag across the map to measure.':u.tool==='tpl'?'Tap a square to place the shape.':u.tool==='paint'?'Drag across the map to paint.':u.tool==='fog'?'Drag across the map to uncover or cover squares.':u.tool==='mark'?'Tap a square to drop a marker.':'Tap a token to select it. Drag a token you may move, or tap it and then tap a square.'}</p>`;
  const under=t.placed?bmTerUnder(cfg,t):[];
  const v=t.v,open=gm||((t.side==='a'||t.side==='t')&&canEditT(v.uid));
  return h`<div class="bminfo sel" aria-live="polite"><div class="row sp"><div class="btx"><b>${v.name}</b> <span class="sub">${t.side==='a'?v.owner:t.side==='t'?'Trainer':t.side==='n'?'NPC trainer':'Foe'}${t.placed?' · column '+(t.x+1)+', row '+(t.y+1):' · not on the map yet'}${under.length?' · on '+under.join(' and '):''}</span>
      <div class="types">${v.types&&v.types.length?chipsOf(v.types):''}${v.status?h`<span class="pill status">${v.status}</span>`:''}${v.down?h`<span class="pill">Down</span>`:''}${(t.side==='f'||t.side==='n')&&gm?h`<span class="pill ${t.vis?'good':'gm'}">${t.vis?'Shown to players':'Hidden from players'}</span>`:''}${t.side==='f'&&gm&&t.vis&&t.placed&&cfg.fg&&!bmRowsSeen(bmFe(cfg),t.x,t.y,t.fp)?h`<span class="pill gm">In the fog: players cannot see it</span>`:''}</div></div>
      <div class="bhp">${t.side==='n'?'':t.side==='t'?(v.hp?h`<span class="bhpw">${hpBar(v.hp)}<span class="mono">${v.hp.cur}/${v.hp.max}</span></span>`:''):btHpView(v)}</div></div>
    ${t.mine&&!t.placed?h`<p class="sub">Tap a square on the map to put it there.</p>`:''}
    ${bmReachBar(cfg,t,toks)}
    <div class="row bmbtns">${t.mine&&t.placed?h`<span class="bmnudge" role="group" aria-label="Move one square"><button class="btn sm" data-act="bm_nudge" data-dx="0" data-dy="-1" aria-label="Up one square">↑</button><button class="btn sm" data-act="bm_nudge" data-dx="-1" data-dy="0" aria-label="Left one square">←</button><button class="btn sm" data-act="bm_nudge" data-dx="1" data-dy="0" aria-label="Right one square">→</button><button class="btn sm" data-act="bm_nudge" data-dx="0" data-dy="1" aria-label="Down one square">↓</button></span><button class="btn sm" data-act="bm_off" data-cid="${t.cid}">Take off the map</button>`:''}
      ${gm&&(t.side==='f'||t.side==='n')&&t.placed?h`<button class="btn sm ${t.vis?'':'primary'}" data-act="bm_vis" data-cid="${t.cid}" data-on="${t.vis?0:1}">${t.vis?'Hide from players':'Show to players'}</button>`:''}
      ${open?h`<button class="btn sm ghost" data-act="bm_open" data-cid="${t.cid}">Open details</button>`:''}
      <button class="btn sm ghost" data-act="bm_desel">Done</button></div></div>`;
}
function bmTray(toks){
  const u=S.ui.bm;
  const un=toks.filter(t=>!t.placed&&t.mine);
  if(!un.length)return '';
  return h`<div class="bmtray"><span class="fl">Not on the map yet</span><div class="row evchips">${un.map(t=>h`<button class="btn sm chk" data-act="bm_sel" data-cid="${t.cid}" data-bmt="${t.cid}" aria-pressed="${String(u.sel===t.cid)}">${t.side==='a'?monIcon(t.v.m):t.side==='t'||t.side==='n'?pimg(t.side==='t'?((t.v.tr&&t.v.tr.img)||''):'',t.v.name,'thumb'):h`<span class="mi-ph unk" aria-hidden="true">?</span>`}${t.v.name}${t.side==='f'?h` <span class="sub">foe</span>`:''}</button>`)}</div>
    ${u.sel&&un.some(t=>t.cid===u.sel)?h`<p class="sub">Tap a square on the map to put it there.</p>`:''}</div>`;
}
function bmSetup(cfg){
  const g=bmG(),u=S.ui.bm,has=!!cfg;
  const live=!!g.live;
  const foes=Object.keys(g.f||{});
  const fnum=(label,path,v)=>h`<label class="fld"><span class="fl">${label}</span><input type="number" inputmode="decimal" step="any" ${bd('bg','bmap',path)} value="${v}"></label>`;
  return h`<div class="mgd bmsetup"><b>${has?'Map settings':'Add a map'}</b>
    <div class="row"><button class="btn sm primary" data-act="bm_pick">${has&&!g.blank?'Replace the picture':'Upload a picture'}</button>
      <span class="sub">A photo or drawing of the area. It is shrunk to fit and kept private until you show it.</span></div>
    <div class="fgrid"><label class="fld"><span class="fl">Blank grid: columns</span><input type="number" inputmode="numeric" min="4" max="80" data-u="bm.cols" data-nr value="${u.cols}" placeholder="20"></label>
      <label class="fld"><span class="fl">Rows</span><input type="number" inputmode="numeric" min="4" max="80" data-u="bm.rows" data-nr value="${u.rows}" placeholder="15"></label></div>
    <div class="row"><button class="btn sm" data-act="bm_blank">${has?'Replace with a blank grid':'Use a blank grid'}</button></div>
    ${has?h`<div class="bmcal"><b>Grid</b>
      ${g.blank?'':h`<p class="sub">Line the grid up with the squares printed on the picture: say how many squares run across it, or tap two opposite corners of one square, then fine-tune below.</p>
      <div class="row"><label class="fld"><span class="fl">Squares across</span><input type="number" inputmode="numeric" min="1" max="200" data-u="bm.cn" data-nr value="${u.cn}" placeholder="24"></label><button class="btn sm" data-act="bm_cols">Set</button>
        <button class="btn sm ${u.cal?'primary':''}" data-act="bm_cal" aria-pressed="${String(!!u.cal)}">${u.cal===1?'Tap the first corner…':u.cal===2?'Tap the opposite corner…':'Mark one square'}</button></div>
      <div class="fgrid">${fnum('Square size (pixels)','gx',g.gx)}${fnum('Offset across','ox',g.ox)}${fnum('Offset down','oy',g.oy)}</div>`}
      <label class="row"><input type="checkbox" ${bd('bg','bmap','grid')} ${g.grid!==false?raw('checked'):''}><span>Show the grid lines</span></label>
      <label class="row"><input type="checkbox" ${bd('bg','bmap','tsh')} ${g.tsh!==false?raw('checked'):''}><span>Show painted terrain to the players</span></label>
      <label class="row"><input type="checkbox" ${bd('bg','bmap','wt')} ${g.wt!==false?raw('checked'):''}><span>Walls stop tokens from moving onto or through them</span></label>
      <p class="sub">Paint Wall squares with Paint terrain. Attack shapes stop at walls too (you can turn that off for a single shape). Players are only stopped by walls they can see. Hold Shift while dragging or tapping to move a token through a wall yourself.</p></div>
    ${bmFogSettings(g,cfg)}
    <div class="bmlive"><b>Players</b>
      <p class="sub">${live?'The players can see this map, with the foes you have shown.':'The players cannot see this map yet.'}</p>
      <div class="row"><button class="btn sm ${live?'':'primary'}" data-act="bm_live" data-on="${live?0:1}">${live?'Hide the map from the players':'Show the map to the players'}</button>
        ${foes.length?h`<button class="btn sm" data-act="bm_revall">Show all foes</button><button class="btn sm" data-act="bm_hideall">Hide all foes</button>`:''}</div></div>
    <div class="row"><button class="btn sm ${S.ui.confirm==='bm|clr'?'armed':''}" data-act="bm_clear">${S.ui.confirm==='bm|clr'?'Tap again to clear every token':'Clear every token'}</button>
      <button class="btn sm danger ${S.ui.confirm==='bm|rm'?'armed':''}" data-act="bm_rm">${S.ui.confirm==='bm|rm'?'Tap again to remove the map':'Remove the map'}</button></div>`:''}
    ${bmSetup2(cfg)}
  </div>`;
}
/* full screen: the whole map panel fills the window (its tools, turn bar and tray come along). Where the browser allows it
   the page also goes truly full screen; on iPhone, which doesn't, the panel still covers the window. */
function bmFs(on){
  const u=S.ui.bm;
  u.full=!!on;
  const de=document.documentElement;
  try{
    if(on&&!document.fullscreenElement&&de.requestFullscreen){u.fullApi=true;de.requestFullscreen({navigationUI:'hide'}).catch(()=>{u.fullApi=false;});}
    if(!on&&document.fullscreenElement&&document.exitFullscreen){u.fullApi=false;document.exitFullscreen().catch(()=>{});}
  }catch(e){u.fullApi=false;}
  document.body.classList.toggle('bmfson',u.full);
  render();
  if(on)setTimeout(()=>{const el=document.querySelector('.bmp.bmfs');if(el)el.scrollTop=0;},0);
}
document.addEventListener('fullscreenchange',()=>{
  const u=S.ui.bm;
  if(!u)return;
  if(document.fullscreenElement){u.fullIn=true;return;}
  const was=u.fullIn;u.fullIn=false;
  if(u.full&&u.fullApi&&was){u.fullApi=false;u.full=false;document.body.classList.remove('bmfson');render();}
});
/* ----- the map window: a second browser window showing only the battle map, edge to edge, for a second screen or a TV.
   Opened from the battle map (#mapwin = what the players see, #mapwin-gm = the GM's own view). It follows the battle live
   from the database, so the first window keeps the controls. The player view never shows hidden foes or fogged squares,
   even when the GM is the one signed in. ----- */
S.mapWin='';
function bmWinMode(){const h=String(location.hash||'');return h==='#mapwin'?'p':h==='#mapwin-gm'?'g':'';}
function bmWinOpen(){
  const url=location.href.replace(/#.*$/,'')+'#mapwin';
  const w=window.open(url,'sinnoh-battle-map','popup,width=1280,height=800');
  if(!w)toast('Your browser blocked the new window. Allow pop-ups for this site, or open this address in a new window: '+url);
  else{try{w.focus();}catch(e){}}
}
function bmWinHtml(){
  const gmView=S.mapWin==='g'&&S.me.admin,was=S.me.admin;
  if(!gmView)S.me.admin=false;
  try{
    const cfg=bmCfg();
    const bar=h`<div class="bmwbar"><span class="pill">${gmView?'GM view':'Player view'}</span>
      ${was?h`<button class="btn sm" data-act="bmw_view">${gmView?'Switch to player view':'Switch to GM view'}</button>`:''}
      <button class="btn sm" data-act="bmw_fs">${document.fullscreenElement?'Exit full screen':'Full screen'}</button></div>`;
    if(!cfg)return h`<div class="bmwin empty">${bar}<p>${was&&!gmView?'The map is hidden from the players. Show it from the battle window, or switch to the GM view.':'No battle map is being shown yet.'}</p></div>`;
    const toks=bmTokens(cfg),placed=toks.filter(t=>t.placed&&(t.vis||gmView));
    const bg=cfg.blank?h`<div class="bmbg blank" style="aspect-ratio:${cfg.w}/${cfg.h}"></div>`:(cfg.src?h`<img class="bmbg" src="${cfg.src}" alt="" draggable="false" width="${cfg.w}" height="${cfg.h}" style="aspect-ratio:${cfg.w}/${cfg.h}">`:h`<div class="bmbg blank load" style="aspect-ratio:${cfg.w}/${cfg.h}"><span>Loading the map…</span></div>`);
    return h`<div class="bmwin ${gmView?'gmv':'plv'}">${bar}<div class="bmwturn">${bmTurnBar()}</div>
      <div class="bmwstage"><div class="bmmap bmwmap" id="bmmap" ${gmView?raw('data-act="bm_map"'):''} style="width:min(100vw,calc(100dvh * ${(cfg.w/cfg.h).toFixed(4)}))">${bg}${bmTerSvg(cfg)}${bmFcSvg(cfg)}${bmGridSvg(cfg)}${bmFogSvg(cfg)}${bmMarkSvg(cfg)}${bmMkList(cfg).map(m=>bmMkEl(cfg,m))}${placed.map(t=>bmTok(cfg,t))}</div></div></div>`;
  }finally{S.me.admin=was;}
}
function bmWinAct(d){
  if(d.act==='bmw_view'){location.hash=S.mapWin==='g'?'mapwin':'mapwin-gm';return;}
  if(d.act==='bmw_fs'){
    try{if(document.fullscreenElement)document.exitFullscreen();else document.documentElement.requestFullscreen({navigationUI:'hide'});}catch(e){}
    setTimeout(render,300);
  }
}
window.addEventListener('hashchange',()=>{const m=bmWinMode();if(m!==S.mapWin){S.mapWin=m;document.body.classList.toggle('mapwin',!!m);render();}});
document.addEventListener('fullscreenchange',()=>{if(S.mapWin)render();});
/* ----- how far a selected token can go, and how far a chosen move reaches (PTA 3.5: Pokémon move 5 ft per point of Speed,
   at least 5 ft; trainers 30 ft; a diagonal step is one square; Dash adds 30 ft in a straight line). Rough ground costs two
   squares; walls stop it. Shown only for tokens you may move. ----- */
const BM_SPD_PS={chlorophyll:'sunny',swiftswim:'rain',sandrush:'sand',slushrush:'hail'};
function bmMoveSq(t){
  if(t.side==='t'||t.side==='n')return 6;
  const v=t.v,spe=num(v&&v.stat&&v.stat.spe);
  const ps=t.side==='a'?((v.m&&v.m.passives)||[]):((v.f&&v.f.ps)||[]);
  const ks=psKeys(ps),wx=fcAt(t.cid);
  let bonus=0;Object.keys(BM_SPD_PS).forEach(k=>{if(ks.has(k)&&wx.indexOf(BM_SPD_PS[k])>=0)bonus+=2;});
  return Math.max(1,Math.floor(spe+bonus));
}
function bmReach(cfg,t,n){
  const walls=bmWallsOn(cfg),key=(x,y)=>x+','+y,cost={},q=[[t.x,t.y,0]];
  cost[key(t.x,t.y)]=0;
  const rough=(x,y)=>{for(let a=0;a<t.fp;a++)for(let b=0;b<t.fp;b++)if(bmTerAt(cfg,x+a,y+b)==='D')return true;return false;};
  while(q.length){
    q.sort((a,b)=>a[2]-b[2]);
    const [x,y,c]=q.shift();
    if(c>cost[key(x,y)])continue;
    for(let dx=-1;dx<=1;dx++)for(let dy=-1;dy<=1;dy++){
      if(!dx&&!dy)continue;
      const nx=x+dx,ny=y+dy;
      if(nx<0||ny<0||nx+t.fp>cfg.cols||ny+t.fp>cfg.rows)continue;
      if(walls&&!bmStepOk(cfg,t.fp,x,y,nx,ny))continue;
      const nc=c+(rough(nx,ny)?2:1);
      if(nc>n)continue;
      const k=key(nx,ny);
      if(cost[k]==null||nc<cost[k]){cost[k]=nc;q.push([nx,ny,nc]);}
    }
  }
  return cost;
}
/* a move's reach in squares: Melee 1, "Ranged(25ft…)" 5, Self 0; null when it can't be read */
function bmRangeSq(txt){
  const t=String(txt||'');
  const m=/(\d+)\s*ft/i.exec(t);
  if(/melee/i.test(t)&&!m)return 1;
  if(m)return Math.max(1,Math.floor(num(m[1])/5));
  if(/self/i.test(t))return 0;
  if(/melee/i.test(t))return 1;
  return null;
}
const bmMovesOf=t=>t.side==='a'?((t.v.m&&t.v.m.moves)||[]):t.side==='f'?((t.v.f&&t.v.f.mv)||[]):[];
function bmRangeCells(cfg,t,n){
  const out=[];
  for(let y=Math.max(0,t.y-n);y<=Math.min(cfg.rows-1,t.y+t.fp-1+n);y++)for(let x=Math.max(0,t.x-n);x<=Math.min(cfg.cols-1,t.x+t.fp-1+n);x++){
    if(x>=t.x&&x<t.x+t.fp&&y>=t.y&&y<t.y+t.fp)continue;
    out.push([x,y]);
  }
  return out;
}
function bmReachSvg(cfg,toks){
  const u=S.ui.bm,gm=!!S.me.admin;
  if(!u.sel||bmDrag||u.tool||u.ruler)return '';
  const t=toks.find(k=>k.cid===u.sel);
  if(!t||!t.placed||!(t.mine||gm))return '';
  let sv='';
  const g=cfg.gx,X=x=>cfg.ox+x*g,Y=y=>cfg.oy+y*g;
  if(u.mvShow!==false){
    const n=bmMoveSq(t)+(u.dash?6:0),c=bmReach(cfg,t,n);
    Object.keys(c).forEach(k=>{const [x,y]=k.split(',').map(Number);if(x===t.x&&y===t.y)return;sv+='<rect x="'+X(x)+'" y="'+Y(y)+'" width="'+(g*t.fp)+'" height="'+(g*t.fp)+'" fill="#2f80ed" fill-opacity=".16" stroke="#2f80ed" stroke-opacity=".35" stroke-width="'+(g*0.03)+'"/>';});
  }
  const mv=u.rmv!=null&&u.rmv!==''?bmMovesOf(t)[num(u.rmv)]:null;
  const rn=mv?bmRangeSq(mv.range):null;
  if(rn){bmRangeCells(cfg,t,rn).forEach(([x,y])=>{sv+='<rect x="'+X(x)+'" y="'+Y(y)+'" width="'+g+'" height="'+g+'" fill="#eb5757" fill-opacity=".14"/>';});
    sv+='<rect x="'+X(t.x-rn)+'" y="'+Y(t.y-rn)+'" width="'+g*(t.fp+2*rn)+'" height="'+g*(t.fp+2*rn)+'" fill="none" stroke="#eb5757" stroke-width="'+(g*0.06)+'" stroke-dasharray="'+(g*0.25)+' '+(g*0.15)+'"/>';}
  return sv?h`<svg class="bmov bmreach" viewBox="0 0 ${cfg.w} ${cfg.h}" preserveAspectRatio="none" aria-hidden="true">${raw(sv)}</svg>`:'';
}
/* the controls under a selected token, and who the chosen move can reach */
function bmReachBar(cfg,t,toks){
  const u=S.ui.bm,gm=!!S.me.admin;
  if(!t||!t.placed||!(t.mine||gm))return '';
  const n=bmMoveSq(t),mvs=bmMovesOf(t);
  const mv=u.rmv!=null&&u.rmv!==''?mvs[num(u.rmv)]:null,rn=mv?bmRangeSq(mv.range):null;
  let who='';
  if(rn){
    const inR=toks.filter(k=>k!==t&&k.placed&&(k.vis||gm)&&!(k.x>t.x+t.fp-1+rn||k.x+k.fp-1<t.x-rn||k.y>t.y+t.fp-1+rn||k.y+k.fp-1<t.y-rn));
    who=inR.length?'In range: '+inR.map(k=>k.v.name).join(', ')+'.':'Nobody is in range.';
  }
  return h`<div class="bmreachbar"><div class="row">
      <label class="row"><input type="checkbox" data-u="bm.mvShow" ${u.mvShow!==false?raw('checked'):''}><span>Movement: <b>${n+(u.dash?6:0)} squares</b> (${(n+(u.dash?6:0))*5} ft)</span></label>
      ${t.side==='a'||t.side==='f'?h`<label class="row"><input type="checkbox" data-u="bm.dash" ${u.dash?raw('checked'):''}><span>Dash (+30 ft, straight line only)</span></label>`:''}</div>
    ${mvs.length?h`<label class="fld"><span class="fl">Show a move’s range</span><select data-u="bm.rmv"><option value="">None</option>${mvs.map((m,i)=>h`<option value="${i}" ${String(u.rmv)===String(i)?raw('selected'):''}>${m.name||'Move '+(i+1)}${m.range?' · '+m.range:''}</option>`)}</select></label>`:''}
    ${mv?h`<p class="sub">${rn==null?'This move’s range can’t be read, so check it by hand.':rn===0?'This move targets the user.':who}</p>`:''}
  </div>`;
}
function bmapPanel(){
  const cfg=bmCfg(),gm=!!S.me.admin,u=S.ui.bm;
  if(!cfg){
    return h`<section class="panel bmp"><div class="ph"><h2>Battle map</h2>${gm?h`<span class="pill gm">GM only</span>`:''}</div>
      ${gm?h`<p class="sub">No battle map yet. Upload a picture of the area, or start with a blank grid.</p>${bmSetup(null)}`:h`<p class="sub">The GM has not shared a battle map.</p>`}</section>`;
  }
  const toks=bmTokens(cfg);
  const placed=toks.filter(t=>t.placed&&(t.vis||gm));
  const z=clamp(num(u.zoom)||1,1,4);
  const tool=!!(u.ruler||u.tool==='tpl'||u.tool==='paint'||u.tool==='fog');
  const mks=bmMkList(cfg);
  const tpl=bmTpAll(cfg);
  const bg=cfg.blank?h`<div class="bmbg blank" style="aspect-ratio:${cfg.w}/${cfg.h}"></div>`:(cfg.src?h`<img class="bmbg" src="${cfg.src}" alt="" draggable="false" width="${cfg.w}" height="${cfg.h}" style="aspect-ratio:${cfg.w}/${cfg.h}">`:h`<div class="bmbg blank load" style="aspect-ratio:${cfg.w}/${cfg.h}"><span>Loading the map…</span></div>`);
  return h`<section class="panel bmp ${u.full?'bmfs':''}"><div class="ph"><h2>Battle map</h2>${gm?(cfg.live?h`<span class="pill good">Shown to players</span>`:h`<span class="pill gm">Hidden from players</span>`):''}
      <div class="acts"><span class="seg" role="group" aria-label="Zoom">${[1,2,3,4].map(n=>h`<button data-act="bm_zoom" data-z="${n}" aria-pressed="${String(z===n)}">${n===1?'Fit':n+'×'}</button>`)}</span>
        <button class="btn sm ${u.ruler?'primary':''}" data-act="bm_ruler" aria-pressed="${String(!!u.ruler)}">Ruler</button>
        <button class="btn sm" data-act="bmw_open" title="Open just the map in its own window, for a second screen or a TV">Map window</button>
        <button class="btn sm ${u.full?'primary':''}" data-act="bm_full" aria-pressed="${String(!!u.full)}" title="${u.full?'Leave full screen (Esc)':'Fill the screen with the map'}">${u.full?'Exit full screen':'Full screen'}</button>
        ${gm?h`<button class="btn sm" data-act="bm_setup" aria-expanded="${String(!!u.setup)}">${u.setup?'Close settings':'Settings'}</button>`:''}</div></div>
    ${bmTurnBar()}
    ${bmTools(cfg)}
    ${bmOpts(cfg,toks)}
    ${u.ruler?h`<p class="sub" id="bmrlnote" aria-live="polite">${bmRulerText(u.rl)||'Drag across the map to measure.'}</p>`:''}
    <div class="bmview ${tool?'tool':''} ${u.cal?'cal':''}" id="bmview" role="region" aria-label="Battle map, scrollable" tabindex="0">
      <div class="bmmap" id="bmmap" data-act="bm_map" style="width:${z===1?(u.full?'min(100%,calc((100dvh - 160px) * '+(cfg.w/cfg.h).toFixed(4)+'))':'min(100%,'+(72*cfg.w/cfg.h).toFixed(3)+'vh)'):z*100+'%'}">${bg}${bmTerSvg(cfg)}${bmFcSvg(cfg)}${bmGridSvg(cfg)}${bmFogSvg(cfg)}${bmReachSvg(cfg,toks)}${bmMarkSvg(cfg)}${mks.map(m=>bmMkEl(cfg,m))}${placed.map(t=>bmTok(cfg,t))}</div></div>
    ${bmLegend(cfg)}
    ${gm&&cfg.fg?h`<p class="sub bmfogkey">Fog of war is on. Hatched squares are hidden from the players; lighter ones were seen earlier but are out of sight now.</p>`:''}
    ${bmInfoBar(cfg,toks)}
    ${bmTplList(cfg,toks,tpl)}
    ${bmTray(toks)}
    ${gm&&u.setup?bmSetup(cfg):''}
  </section>`;
}
function bmAct(b,e){
  const d=b.dataset,u=S.ui.bm,gm=!!S.me.admin;
  switch(d.act){
    case 'bm_view':S.ui.bt.view=d.v==='map'?'map':'order';render();break;
    case 'bm_zoom':{
      const mv=document.getElementById('bmview');
      if(mv&&mv.scrollWidth)u.zc=[(mv.scrollLeft+mv.clientWidth/2)/mv.scrollWidth,(mv.scrollTop+mv.clientHeight/2)/mv.scrollHeight];
      u.zoom=clamp(+d.z||1,1,4);render();break;}
    case 'bm_sel':{
      if(bmMoved)break;
      u.sel=u.sel===d.cid?'':d.cid;u.msel='';u.rmv='';u.dash=false;render();break;}
    case 'bm_desel':u.sel='';render();break;
    case 'bm_map':{
      if(bmMoved||bmRl)break;
      const cfg=bmCfg(),p=bmPoint(e);
      if(!cfg||!p)break;
      if(u.cal){bmCalClick(p);break;}
      if(u.ruler||u.tool==='tpl'||u.tool==='paint'||u.tool==='fog')break;
      if(u.tool==='mark'&&gm){const mc=bmCellOf(cfg,p);bmMkAdd(mc.x,mc.y);render();break;}
      if(!u.sel)break;
      const c=bmCellOf(cfg,p);
      const t=bmTokens(cfg).find(k=>k.cid===u.sel);
      if(!t||!t.mine)break;
      /* the tapped square becomes the token's top left, unless that would push it off the map */
      bmSetPos(u.sel,c.x,c.y,{free:bmFree(e)});render();break;}
    case 'bm_nudge':{
      const cfg=bmCfg();
      const t=cfg&&bmTokens(cfg).find(k=>k.cid===u.sel);
      if(!t||!t.mine||!t.placed)break;
      bmSetPos(t.cid,t.x+num(d.dx),t.y+num(d.dy));render();break;}
    case 'bm_off':bmOff(d.cid);render();break;
    case 'bm_vis':bmFoeVis(d.cid,d.on==='1');render();break;
    case 'bm_open':{const c=String(d.cid||'');if(c.indexOf('tr_')===0){S.viewUid=c.slice(3);setTab('trainer');break;}if(c.indexOf('nt_')===0){const id=c.slice(3);if(NTS()[id]){S.ui.nt.open[id]=true;S.ui.q.npc=ntName(NTS()[id]);setTab('npc');}break;}S.ui.bt.view='order';S.ui.bt.open[d.cid]=true;S.ui.bm.sel=d.cid;render();break;}
    case 'bm_full':bmFs(!u.full);break;
    case 'bm_ruler':u.ruler=!u.ruler;u.rl=null;u.cal=0;u.calA=null;if(u.ruler)u.tool='';render();break;
    case 'bm_setup':u.setup=!u.setup;render();break;
    case 'bm_cal':if(!gm)break;u.cal=u.cal?0:1;u.calA=null;u.ruler=false;if(u.cal)u.tool='';render();break;
    case 'bm_cols':if(gm)bmCols();break;
    case 'bm_pick':{
      if(!gm)break;
      S.pick={spec:'bmap|bmap|img',w:0,h:0,max:1600,cap:700000};
      const fp=document.getElementById('filepick');
      if(fp){fp.value='';fp.click();}
      break;}
    case 'bm_blank':if(gm)bmBlank();break;
    case 'bm_live':if(gm)bmLive(d.on==='1');break;
    case 'bm_revall':bmReveal(true);break;
    case 'bm_hideall':bmReveal(false);break;
    case 'bm_clear':if(gm)ntTwice('bm|clr',()=>{bmClearTokens();toast('Every token was taken off the map.',true);render();});break;
    case 'bm_rm':if(gm)ntTwice('bm|rm',()=>bmRemoveMap());break;
    default:bm2Act(b,e);
  }
}

/* ---------- Battle map, part two: range shapes, painted terrain, markers, saved formations, a library of saved maps ----------
   Where the new things live (all in places the existing rules already cover, so there is no rules change):
     gm/bmap            gains  ter (painted terrain, one string per row), tsh (show terrain to players), mk (markers),
                               tp (range shapes the GM drew), fm (saved formations)
     meta/bmap          gains  ter, mk, tp, but only what the GM has chosen to show, and only while the map is shown
     config/bsc_<id>    one saved map in the GM's library (settings, terrain, markers, formations); GM-only, like the table code
     config/bsi_<id>_<n> its picture, in chunks, so the library never slows down the live GM listener
   A player's own range shapes are never saved anywhere: they are for measuring at the table. */
S.ui.bm=Object.assign({tool:'',tk:'burst',tn:2,td:2,tw:1,tp:[],tsel:'',tshare:false,tb:true,pb:'W',pz:1,mk:'note',ml:'',msel:'',fn:'',sn:''},S.ui.bm);
S.bmLib=S.bmLib||{};

const BM_DIRS=[[0,-1],[1,-1],[1,0],[1,1],[0,1],[-1,1],[-1,0],[-1,-1]];
const BM_DIRN=['north','north-east','east','south-east','south','south-west','west','north-west'];
const BM_DARR=['↑','↗','→','↘','↓','↙','←','↖'];
const BM_TK=[['burst','Burst'],['cone','Cone'],['line','Line'],['blast','Blast']];
const BM_TKMAX={burst:10,cone:20,line:20,blast:10};
const BM_TER=[['W','Water'],['D','Rough ground'],['B','Wall'],['H','Hazard'],['C','Cover']];
const BM_TERK={};BM_TER.forEach(t=>{BM_TERK[t[0]]=t[1];});
const BM_MK=[['note','Note','i'],['trap','Trap','!'],['item','Item','★'],['exit','Exit','E'],['goal','Objective','◆'],['start','Start','S']];
const BM_MKD={};BM_MK.forEach(m=>{BM_MKD[m[0]]=m;});
const BM_TPMAX=6,BM_MKMAX=40,BM_FMMAX=8,BM_SCENES=6;
const bmLibOk=()=>!!(typeof CFG!=='undefined'&&CFG&&S.me.admin);
const bmFt=n=>n*5;

/* ===== walls =====
   A Wall square (terrain "B") stops two things: a range shape cannot reach past it, and a token cannot be moved onto or through it.
   Both use the same idea of a straight line from one square to another, counting a diagonal step as one square like the ruler. */
const bmRs=v=>v<0?-Math.round(-v):Math.round(v);
function bmWalls(cfg){
  if(cfg._w)return cfg._w;
  const s=new Set();
  cfg.ter.forEach((r,y)=>{if(y>=cfg.rows)return;for(let x=0;x<r.length&&x<cfg.cols;x++)if(r[x]==='B')s.add(x+','+y);});
  return (cfg._w=s);
}
const bmHasWalls=cfg=>bmWalls(cfg).size>0;
/* walls only stop tokens when the GM has left that switched on, and only the walls this person can see */
const bmWallsOn=cfg=>cfg.wt!==false&&bmHasWalls(cfg);
const bmFree=e=>!!(S.me.admin&&e&&e.shiftKey);
function bmFootBlocked(cfg,fp,x,y){
  const w=bmWalls(cfg);
  for(let a=0;a<fp;a++)for(let b=0;b<fp;b++)if(w.has((x+a)+','+(y+b)))return true;
  return false;
}
/* can the effect reach (x1,y1) from (x0,y0)? The squares in between must be open, and it cannot squeeze diagonally between two walls. */
function bmClearLine(cfg,x0,y0,x1,y1,seeWall){
  if(x0===x1&&y0===y1)return true;
  const w=bmWalls(cfg);
  /* sight (seeWall) can end on a wall: you see the wall, not what is behind it */
  if(!seeWall&&w.has(x1+','+y1))return false;
  const n=Math.max(Math.abs(x1-x0),Math.abs(y1-y0));
  let px=x0,py=y0;
  for(let i=1;i<=n;i++){
    const x=x0+bmRs((x1-x0)*i/n),y=y0+bmRs((y1-y0)*i/n);
    if(x!==px&&y!==py&&w.has(x+','+py)&&w.has(px+','+y))return false;
    if(i<n&&w.has(x+','+y))return false;
    px=x;py=y;
  }
  return true;
}
/* one step of a token, from (px,py) to a neighbouring square (x,y) */
function bmStepOk(cfg,fp,px,py,x,y){
  if(bmFootBlocked(cfg,fp,x,y))return false;
  if(x!==px&&y!==py&&bmFootBlocked(cfg,fp,x,py)&&bmFootBlocked(cfg,fp,px,y))return false;
  return true;
}
/* walks a token toward a square one step at a time and stops in front of the first wall */
function bmWalk(cfg,fp,from,to){
  let px=from.x,py=from.y;
  const n=Math.max(Math.abs(to.x-px),Math.abs(to.y-py));
  for(let i=1;i<=n;i++){
    const x=from.x+bmRs((to.x-from.x)*i/n),y=from.y+bmRs((to.y-from.y)*i/n);
    if(!bmStepOk(cfg,fp,px,py,x,y))return {x:px,y:py,blocked:true};
    px=x;py=y;
  }
  return {x:px,y:py,blocked:false};
}

/* ===== range shapes =====
   A square is 5 ft. Distances count a diagonal step as one square, the same as the ruler, so a Burst is a square block. */
function bmTplRaw(cfg,t){
  const n=Math.max(1,Math.round(num(t.n))||1),x0=num(t.x),y0=num(t.y),out=[];
  const add=(x,y)=>{if(x>=0&&y>=0&&x<cfg.cols&&y<cfg.rows)out.push([x,y]);};
  const d=((Math.round(num(t.d))%8)+8)%8,dx=BM_DIRS[d][0],dy=BM_DIRS[d][1];
  if(t.k==='burst'){
    for(let y=-n;y<=n;y++)for(let x=-n;x<=n;x++)add(x0+x,y0+y);
  }else if(t.k==='blast'){
    const a=Math.floor((n-1)/2);
    for(let y=0;y<n;y++)for(let x=0;x<n;x++)add(x0-a+x,y0-a+y);
  }else if(t.k==='line'){
    const w=clamp(Math.round(num(t.w))||1,1,5),lo=-Math.floor((w-1)/2);
    for(let k=1;k<=n;k++)for(let j=0;j<w;j++){
      const o=lo+j;
      /* straight lines widen sideways; diagonal ones widen across */
      if(dx===0||dy===0)add(x0+dx*k+(-dy)*o,y0+dy*k+dx*o);else add(x0+dx*k+o,y0+dy*k);
    }
  }else{
    /* a cone is as wide as it is long, widening evenly on both sides */
    if(dx===0||dy===0){
      for(let k=1;k<=n;k++){const hw=Math.floor(k/2);for(let o=-hw;o<=hw;o++)add(x0+dx*k+(-dy)*o,y0+dy*k+dx*o);}
    }else{
      for(let a=1;a<=n;a++)for(let b=1;b<=n;b++)if(Math.max(a,b)<=2*Math.min(a,b))add(x0+dx*a,y0+dy*b);
    }
  }
  return out;
}
/* the squares a shape covers: walls cut it short, unless that shape was set to ignore them.
   A shape the GM shared arrives with its squares already worked out (so a player who cannot see the walls still sees the same shape). */
function bmTplCells(cfg,t){
  if(!cfg.adm&&Array.isArray(t.c)){
    const out=[];
    for(let i=0;i+1<t.c.length;i+=2){const x=num(t.c[i]),y=num(t.c[i+1]);if(x>=0&&y>=0&&x<cfg.cols&&y<cfg.rows)out.push([x,y]);}
    return out;
  }
  const all=bmTplRaw(cfg,t);
  if(t.b===0||!bmHasWalls(cfg))return all;
  const x0=num(t.x),y0=num(t.y);
  return all.filter(c=>bmClearLine(cfg,x0,y0,c[0],c[1]));
}
const bmTplCut=(cfg,t)=>t.b!==0&&(Array.isArray(t.c)||bmHasWalls(cfg))&&bmTplCells(cfg,t).length<bmTplRaw(cfg,t).length;
function bmTplName(t){
  const n=Math.max(1,Math.round(num(t.n))||1),d=BM_DIRN[((Math.round(num(t.d))%8)+8)%8];
  if(t.k==='burst')return 'Burst, '+n+(n===1?' square':' squares')+' out ('+bmFt(n)+' ft)';
  if(t.k==='blast')return 'Blast, '+n+' by '+n+' ('+bmFt(n)+' ft)';
  if(t.k==='line'){const w=clamp(Math.round(num(t.w))||1,1,5);return 'Line, '+n+(n===1?' square':' squares')+' long'+(w>1?', '+w+' wide':'')+', pointing '+d;}
  return 'Cone, '+n+(n===1?' square':' squares')+' long, pointing '+d;
}
function bmTplHits(cfg,t,toks){
  const gm=cfg.adm,set=new Set(bmTplCells(cfg,t).map(c=>c[0]+','+c[1])),out=[];
  toks.forEach(k=>{
    if(!k.placed||!(k.vis||gm))return;
    let hit=false,centre=false;
    for(let a=0;a<k.fp;a++)for(let b=0;b<k.fp;b++){
      if(set.has((k.x+a)+','+(k.y+b)))hit=true;
      if(num(t.x)===k.x+a&&num(t.y)===k.y+b)centre=true;
    }
    if(hit)out.push({k,centre});
  });
  return out;
}
function bmHitsText(cfg,hits,t){
  if(!hits.length)return 'Nobody';
  const mid=t&&(t.k==='burst'||t.k==='blast')?' (at the centre)':' (on the starting square)';
  return hits.map(x=>x.k.v.name+(x.centre?mid:'')+(cfg.adm&&!x.k.vis?' (hidden)':'')).join(', ');
}
/* the shapes this person can see: the GM's own (saved on the GM's document), or the ones the GM shared plus the viewer's own */
function bmTpAll(cfg){
  const out=[],src=cfg.tp||{};
  Object.keys(src).sort().forEach(id=>{
    const t=src[id];
    if(!t||!BM_TK.some(k=>k[0]===t.k))return;
    out.push({id,k:t.k,x:num(t.x),y:num(t.y),n:num(t.n)||1,d:num(t.d),w:num(t.w)||1,b:t.b===0||t.b===false?0:1,c:Array.isArray(t.c)?t.c:undefined,own:cfg.adm,sh:cfg.adm?num(t.sh)>0:true});
  });
  if(!cfg.adm)(S.ui.bm.tp||[]).forEach(t=>out.push(Object.assign({own:true,sh:false,loc:true},t)));
  return out;
}
function bmTplSvg(cfg,list,sel){
  const g=cfg.gx;
  return list.map(t=>{
    const cells=bmTplCells(cfg,t);
    const cls='bmtpl k-'+t.k+(t.sh?' sh':'')+(t.draft?' draft':'')+(t.id&&t.id===sel?' sel':'');
    return '<g class="'+cls+'">'+cells.map(c=>'<rect x="'+(cfg.ox+c[0]*g)+'" y="'+(cfg.oy+c[1]*g)+'" width="'+g+'" height="'+g+'"/>').join('')
      +'<circle class="bmtpo" cx="'+(cfg.ox+(num(t.x)+0.5)*g)+'" cy="'+(cfg.oy+(num(t.y)+0.5)*g)+'" r="'+(g*0.2)+'"/></g>';
  }).join('');
}
function bmTplAdd(t){
  const cfg=bmCfg(),u=S.ui.bm;
  if(!cfg)return;
  const o={k:t.k,x:t.x,y:t.y,n:t.n,d:t.d,w:t.w,b:t.b===0?0:1};
  if(cfg.adm){
    const tp=Object.assign({},bmG().tp||{}),keys=Object.keys(tp).sort();
    while(keys.length>=BM_TPMAX)delete tp[keys.shift()];
    const id='t'+Date.now().toString(36)+Math.random().toString(36).slice(2,4);
    tp[id]=Object.assign({sh:u.tshare?1:0},o);
    edit('bg','bmap','tp',tp);
    u.tsel=id;
    bmSync();
  }else{
    const id='l'+Date.now().toString(36)+Math.random().toString(36).slice(2,4);
    u.tp=(u.tp||[]).concat([Object.assign({id},o)]).slice(-BM_TPMAX);
    u.tsel=id;
  }
}
function bmTplDel(id){
  const cfg=bmCfg(),u=S.ui.bm;
  if(!cfg)return;
  if(cfg.adm){const tp=Object.assign({},bmG().tp||{});delete tp[id];edit('bg','bmap','tp',tp);bmSync();}
  else u.tp=(u.tp||[]).filter(t=>t.id!==id);
  if(u.tsel===id)u.tsel='';
}
function bmTplShare(id,on){
  if(!S.me.admin||!(bmG().tp||{})[id])return;
  edit('bg','bmap','tp.'+id+'.sh',on?1:0);
  bmSync();
}
function bmTplClear(){
  const cfg=bmCfg();
  if(!cfg)return;
  if(cfg.adm){if(Object.keys(bmG().tp||{}).length){edit('bg','bmap','tp',{});bmSync();}}
  else S.ui.bm.tp=[];
  S.ui.bm.tsel='';
}
/* drawing: press where it starts. A cone or a line points where you drag; a burst or blast follows your finger. */
let bmTp=null,bmPn=null;
function bmTplDraft(){
  const u=S.ui.bm,d=bmTp;
  return d?{k:u.tk,x:d.x,y:d.y,n:clamp(Math.round(num(u.tn))||1,1,BM_TKMAX[u.tk]||10),d:d.d,w:clamp(Math.round(num(u.tw))||1,1,5),b:u.tb===false?0:1,draft:true}:null;
}
function bmTplDraw(){
  const cfg=bmCfg(),g=document.getElementById('bmdr'),note=document.getElementById('bmtpnote'),dr=bmTplDraft();
  if(!cfg)return;
  if(g)g.innerHTML=dr?bmTplSvg(cfg,[dr]):'';
  if(note)note.textContent=dr?bmTplName(dr)+'. In the area: '+bmHitsText(cfg,bmTplHits(cfg,dr,bmTokens(cfg)),dr)+'.':'';
}
function bmTplStart(e){
  const cfg=bmCfg(),p=bmPoint(e),u=S.ui.bm;
  if(!cfg||!p)return;
  const c=bmCellOf(cfg,p);
  bmTp={x:c.x,y:c.y,d:clamp(Math.round(num(u.td)),0,7),sx:e.clientX,sy:e.clientY};
  bmBusy=true;
  try{bmMapEl().setPointerCapture(e.pointerId);}catch(err){}
  bmTplDraw();
  e.preventDefault();
}
function bmTplMove(e){
  const d=bmTp,cfg=bmCfg(),p=bmPoint(e),u=S.ui.bm;
  if(!d||!cfg||!p)return;
  if(u.tk==='cone'||u.tk==='line'){
    const dx=e.clientX-d.sx,dy=e.clientY-d.sy;
    if(Math.hypot(dx,dy)>=12)d.d=(((Math.round(Math.atan2(dy,dx)/(Math.PI/4))+2)%8)+8)%8;
  }else{
    const c=bmCellOf(cfg,p);d.x=c.x;d.y=c.y;
  }
  bmTplDraw();
}
function bmTplEnd(){
  const dr=bmTplDraft();
  bmTp=null;bmBusy=false;
  if(dr){const o={k:dr.k,x:dr.x,y:dr.y,n:dr.n,d:dr.d,w:dr.w,b:dr.b};bmTplAdd(o);}
  bmQueued=false;
  render();
}

/* ===== painted terrain ===== */
function bmTerAt(cfg,x,y){return (cfg.ter[y]||'')[x]||'.';}
function bmTerUnder(cfg,t){
  const seen=[];
  for(let a=0;a<t.fp;a++)for(let b=0;b<t.fp;b++){
    const c=bmTerAt(cfg,t.x+a,t.y+b);
    if(BM_TERK[c]&&seen.indexOf(c)<0)seen.push(c);
  }
  return seen.map(c=>BM_TERK[c].toLowerCase());
}
function bmTerGrid(cfg){
  const g=[];
  for(let y=0;y<cfg.rows;y++){const r=cfg.ter[y]||'',a=[];for(let x=0;x<cfg.cols;x++)a.push(r[x]||'.');g.push(a);}
  return g;
}
const bmTerPack=rows=>{
  const r=rows.map(a=>(Array.isArray(a)?a.join(''):a).replace(/\.+$/,''));
  while(r.length&&!r[r.length-1])r.pop();
  return r;
};
function bmTerRuns(cfg,rows){
  let s='';
  const g=cfg.gx;
  for(let y=0;y<cfg.rows;y++){
    const r=rows[y]||'';
    let x=0;
    while(x<cfg.cols){
      const ch=r[x]||'.';
      let x2=x+1;
      while(x2<cfg.cols&&(r[x2]||'.')===ch)x2++;
      if(BM_TERK[ch])s+='<rect x="'+(cfg.ox+x*g)+'" y="'+(cfg.oy+y*g)+'" width="'+((x2-x)*g)+'" height="'+g+'" fill="url(#bmt'+ch+')"/>';
      x=x2;
    }
  }
  return s;
}
function bmTerDefs(cfg){
  const g=cfg.gx,f=n=>+(g*n).toFixed(3),sw=f(0.06);
  const p=(id,inner)=>'<pattern id="bmt'+id+'" patternUnits="userSpaceOnUse" x="'+cfg.ox+'" y="'+cfg.oy+'" width="'+g+'" height="'+g+'">'+inner+'</pattern>';
  const bg=(c,o)=>'<rect width="'+g+'" height="'+g+'" fill="'+c+'" fill-opacity="'+o+'"/>';
  return '<defs>'
    +p('W',bg('#2f7fe0',.4)+'<path d="M0 '+f(.3)+'Q'+f(.125)+' '+f(.15)+' '+f(.25)+' '+f(.3)+'T'+f(.5)+' '+f(.3)+'T'+f(.75)+' '+f(.3)+'T'+g+' '+f(.3)+'M0 '+f(.72)+'Q'+f(.125)+' '+f(.57)+' '+f(.25)+' '+f(.72)+'T'+f(.5)+' '+f(.72)+'T'+f(.75)+' '+f(.72)+'T'+g+' '+f(.72)+'" fill="none" stroke="#fff" stroke-opacity=".8" stroke-width="'+sw+'"/>')
    +p('D',bg('#b7791f',.38)+'<path d="M0 '+g+'L'+g+' 0M'+f(-.5)+' '+f(.5)+'L'+f(.5)+' '+f(-.5)+'M'+f(.5)+' '+f(1.5)+'L'+f(1.5)+' '+f(.5)+'" fill="none" stroke="#4a2f06" stroke-opacity=".75" stroke-width="'+sw+'"/>')
    +p('B',bg('#222',.84)+'<path d="M0 '+f(.5)+'H'+g+'M'+f(.5)+' 0V'+f(.5)+'M'+f(.25)+' '+f(.5)+'V'+g+'M'+f(.75)+' '+f(.5)+'V'+g+'" fill="none" stroke="#b6bcc2" stroke-opacity=".6" stroke-width="'+sw+'"/>')
    +p('H',bg('#e5483a',.4)+'<path d="M0 '+f(.5)+'L'+f(.5)+' 0M0 '+g+'L'+g+' 0M'+f(.5)+' '+g+'L'+g+' '+f(.5)+'" fill="none" stroke="#ffd43b" stroke-opacity=".9" stroke-width="'+f(.1)+'"/>')
    +p('C',bg('#2f9e44',.36)+'<circle cx="'+f(.25)+'" cy="'+f(.28)+'" r="'+f(.07)+'" fill="#144d1f" fill-opacity=".85"/><circle cx="'+f(.72)+'" cy="'+f(.3)+'" r="'+f(.07)+'" fill="#144d1f" fill-opacity=".85"/><circle cx="'+f(.5)+'" cy="'+f(.72)+'" r="'+f(.07)+'" fill="#144d1f" fill-opacity=".85"/>')
    +'</defs>';
}
function bmTerSvg(cfg){
  if(!cfg.ter.length&&!(cfg.adm&&S.ui.bm.tool==='paint'))return '';
  return h`<svg class="bmter" viewBox="0 0 ${cfg.w} ${cfg.h}" preserveAspectRatio="none" aria-hidden="true">${raw(bmTerDefs(cfg))}<g id="bmter">${raw(bmTerRuns(cfg,cfg.ter))}</g></svg>`;
}
function bmLegend(cfg){
  const present=new Set();
  cfg.ter.forEach(r=>{for(const ch of r)if(BM_TERK[ch])present.add(ch);});
  const all=cfg.adm&&S.ui.bm.tool==='paint';
  const list=BM_TER.filter(t=>all||present.has(t[0]));
  if(!list.length)return '';
  const g=cfg.gx;
  return h`<ul class="bmleg" aria-label="Terrain key">${list.map(t=>h`<li><svg class="bmswatch" viewBox="${cfg.ox} ${cfg.oy} ${g} ${g}" aria-hidden="true"><rect x="${cfg.ox}" y="${cfg.oy}" width="${g}" height="${g}" fill="url(#bmt${t[0]})"/></svg>${t[1]}</li>`)}</ul>`;
}
function bmPaintStamp(cfg,c){
  const d=bmPn;
  const s=clamp(Math.round(num(S.ui.bm.pz))||1,1,3),lo=-Math.floor((s-1)/2);
  for(let y=0;y<s;y++)for(let x=0;x<s;x++){
    const xx=c.x+lo+x,yy=c.y+lo+y;
    if(xx>=0&&yy>=0&&xx<cfg.cols&&yy<cfg.rows&&d.rows[yy][xx]!==d.ch){d.rows[yy][xx]=d.ch;d.n++;}
  }
}
function bmPaintDraw(){
  const cfg=bmCfg(),g=document.getElementById('bmter');
  if(g&&cfg&&bmPn)g.innerHTML=bmTerRuns(cfg,bmPn.rows.map(a=>a.join('')));
}
function bmPaintStart(e){
  const cfg=bmCfg(),p=bmPoint(e),u=S.ui.bm;
  if(!cfg||!p||!cfg.adm)return;
  const c=bmCellOf(cfg,p);
  bmPn={rows:bmTerGrid(cfg),last:c,ch:u.pb==='.'?'.':(BM_TERK[u.pb]?u.pb:'W'),n:0};
  bmBusy=true;
  try{bmMapEl().setPointerCapture(e.pointerId);}catch(err){}
  bmPaintStamp(cfg,c);bmPaintDraw();
  e.preventDefault();
}
function bmPaintMove(e){
  const d=bmPn,cfg=bmCfg(),p=bmPoint(e);
  if(!d||!cfg||!p)return;
  const c=bmCellOf(cfg,p);
  if(c.x===d.last.x&&c.y===d.last.y)return;
  /* fill in the squares between two samples so a fast stroke leaves no gaps */
  const steps=Math.max(Math.abs(c.x-d.last.x),Math.abs(c.y-d.last.y));
  for(let i=1;i<=steps;i++)bmPaintStamp(cfg,{x:Math.round(d.last.x+(c.x-d.last.x)*i/steps),y:Math.round(d.last.y+(c.y-d.last.y)*i/steps)});
  d.last=c;bmPaintDraw();
}
function bmPaintEnd(){
  const d=bmPn;
  bmPn=null;bmBusy=false;
  if(d&&d.n){edit('bg','bmap','ter',bmTerPack(d.rows));bmSync();}
  bmQueued=false;
  render();
}
function bmTerClear(){
  if(!S.me.admin)return;
  edit('bg','bmap','ter',[]);bmSync();
}

/* ===== markers ===== */
function bmMkList(cfg){
  return Object.keys(cfg.mk||{}).map(id=>Object.assign({id},cfg.mk[id])).filter(m=>m&&num(m.x)>=0&&num(m.y)>=0&&num(m.x)<cfg.cols&&num(m.y)<cfg.rows);
}
function bmMkEl(cfg,m){
  const gm=cfg.adm,u=S.ui.bm,sel=u.msel===m.id,d=BM_MKD[m.k]||BM_MKD.note;
  const shown=gm?num(m.vis)>0:true;
  const label=d[1]+(m.l?': '+m.l:'')+(gm&&!shown?', hidden from players':'')+', column '+(num(m.x)+1)+', row '+(num(m.y)+1)+(gm?'. Drag to move it, or use the arrow keys.':'');
  return h`<button type="button" class="bmk k-${d[0]} ${shown?'':'hid'} ${sel?'sel':''} ${gm?'mine':''}" data-bmk="${m.id}" data-id="${m.id}" data-act="bm_msel" aria-pressed="${String(sel)}" aria-label="${label}" title="${m.l||d[1]}" style="left:${bmPct(cfg.ox+num(m.x)*cfg.gx,cfg.w)};top:${bmPct(cfg.oy+num(m.y)*cfg.gx,cfg.h)};width:${bmPct(cfg.gx,cfg.w)};height:${bmPct(cfg.gx,cfg.h)};--c:${(cfg.gx/cfg.w*100).toFixed(4)}cqw"><span class="bmk-i" aria-hidden="true">${d[2]}</span><span class="bmk-nm">${m.l||d[1]}</span></button>`;
}
function bmMkAdd(x,y){
  const u=S.ui.bm,g=bmG(),mk=Object.assign({},g.mk||{});
  if(Object.keys(mk).length>=BM_MKMAX){toast('That is the most markers a map can hold ('+BM_MKMAX+'). Delete one first.');return;}
  const id='m'+Date.now().toString(36)+Math.random().toString(36).slice(2,4);
  mk[id]={x,y,k:BM_MKD[u.mk]?u.mk:'note',l:String(u.ml||'').trim().slice(0,40),vis:0};
  edit('bg','bmap','mk',mk);
  u.msel=id;u.sel='';u.ml='';
  bmSync();
}
function bmMkMove(id,x,y){
  const cfg=bmCfg();
  if(!cfg||!cfg.adm||!(bmG().mk||{})[id])return;
  edit('bg','bmap','mk.'+id+'.x',clamp(Math.round(x),0,cfg.cols-1));
  edit('bg','bmap','mk.'+id+'.y',clamp(Math.round(y),0,cfg.rows-1));
  bmSync();
}
function bmMkDel(id){
  if(!S.me.admin)return;
  const mk=Object.assign({},bmG().mk||{});
  delete mk[id];
  edit('bg','bmap','mk',mk);
  if(S.ui.bm.msel===id)S.ui.bm.msel='';
  bmSync();
}
function bmMkInfo(cfg){
  const u=S.ui.bm,m=bmMkList(cfg).find(k=>k.id===u.msel);
  if(!m)return '';
  const gm=cfg.adm,d=BM_MKD[m.k]||BM_MKD.note,shown=gm?num(m.vis)>0:true;
  if(!gm){
    return h`<div class="bminfo sel" aria-live="polite"><div class="row sp"><div class="btx"><b>${d[1]}</b> <span class="sub">column ${num(m.x)+1}, row ${num(m.y)+1}</span><p>${m.l||'No note.'}</p></div></div><div class="row bmbtns"><button class="btn sm ghost" data-act="bm_mdesel">Done</button></div></div>`;
  }
  const doc=bmG(),p='mk.'+m.id+'.';
  return h`<div class="bminfo sel" aria-live="polite"><div class="row sp"><div class="btx"><b>${d[1]} marker</b> <span class="sub">column ${num(m.x)+1}, row ${num(m.y)+1}</span> <span class="pill ${shown?'good':'gm'}">${shown?'Shown to players':'Hidden from players'}</span></div></div>
    <div class="fgrid">${fText('Note','bg','bmap',p+'l',doc,{ph:'What is here? (players see it only if you show the marker)'})}${fSel('Kind','bg','bmap',p+'k',doc,BM_MK.map(k=>[k[0],k[1]]))}</div>
    <div class="row bmbtns"><button class="btn sm ${shown?'':'primary'}" data-act="bm_mvis" data-id="${m.id}" data-on="${shown?0:1}">${shown?'Hide from players':'Show to players'}</button>
      <button class="btn sm danger" data-act="bm_mdel" data-id="${m.id}">Delete marker</button><button class="btn sm ghost" data-act="bm_mdesel">Done</button></div></div>`;
}

/* ===== formations: where everyone stands, saved by name ===== */
const bmRefKey=r=>String(r||'').replace('/','|');
function bmFmSave(){
  const u=S.ui.bm,g=bmG(),cfg=bmCfg();
  if(!S.me.admin||!cfg)return;
  const name=String(u.fn||'').trim().slice(0,30);
  if(!name){toast('Give the formation a name first.');return;}
  const fm=Object.assign({},g.fm||{});
  let id=Object.keys(fm).find(k=>fm[k].n===name);
  if(!id&&Object.keys(fm).length>=BM_FMMAX){toast('A map keeps up to '+BM_FMMAX+' formations. Delete one to make room.');return;}
  const toks=bmTokens(cfg).filter(t=>t.placed);
  if(!toks.length){toast('Put some tokens on the map first.');return;}
  const a={},f={};
  toks.forEach(t=>{
    if(t.side==='a'){const c=btC(t.cid);if(c)a[bmRefKey(c.r)]=[t.x,t.y];}
    else{const fo=foeOf(t.cid);if(fo&&fo.pn)f[fo.pn]=[t.x,t.y,t.vis?1:0];}
  });
  id=id||('f'+Date.now().toString(36));
  fm[id]={n:name,a,f};
  edit('bg','bmap','fm',fm);
  u.fn='';
  toast('Formation "'+name+'" saved.',true);
  render();
}
function bmFmUse(id){
  const g=bmG(),cfg=bmCfg(),fm=(g.fm||{})[id];
  if(!S.me.admin||!cfg||!fm)return;
  let n=0,skip=0;
  const wl=bmWallsOn(cfg);
  bmTokens(cfg).forEach(t=>{
    const c=btC(t.cid);
    if(!c)return;
    if(t.side==='a'){
      const p=(fm.a||{})[bmRefKey(c.r)];
      if(p){const q=bmClampXY(cfg,t,num(p[0]),num(p[1]));if(wl&&bmFootBlocked(cfg,t.fp,q.x,q.y)){skip++;return;}edit('p',c.r,'bpos',{x:q.x,y:q.y,v:cfg.v});n++;}
    }else{
      const fo=foeOf(t.cid),p=fo&&(fm.f||{})[fo.pn];
      if(p){const q=bmClampXY(cfg,t,num(p[0]),num(p[1]));if(wl&&bmFootBlocked(cfg,t.fp,q.x,q.y)){skip++;return;}edit('bg','bmap','f.'+t.cid,{x:q.x,y:q.y,vis:num(p[2])>0?1:0});n++;}
    }
  });
  bmSync();
  const sk=skip?' '+skip+' stayed where '+(skip===1?'it was':'they were')+', because a wall is on '+(skip===1?'its':'their')+' saved square.':'';
  toast(n||skip?'Formation "'+fm.n+'" put '+n+(n===1?' token':' tokens')+' in place.'+sk:'Nobody in this battle matches that formation.',!!n);
  render();
}
function bmFmDel(id){
  if(!S.me.admin)return;
  const fm=Object.assign({},bmG().fm||{});
  delete fm[id];
  edit('bg','bmap','fm',fm);
  render();
}

/* ===== the library of saved maps ===== */
async function bmSceneSave(){
  const u=S.ui.bm,g=bmG();
  if(!bmLibOk())return;
  if(!g.v){toast('Add a map first.');return;}
  const name=String(u.sn||'').trim().slice(0,40)||String(g.name||'Battle map').slice(0,40);
  let id=Object.keys(S.bmLib).find(k=>S.bmLib[k].name===name);
  if(!id&&Object.keys(S.bmLib).length>=BM_SCENES){toast('The library holds '+BM_SCENES+' maps. Delete one to make room.');return;}
  const n=g.blank?0:num(g.n);
  for(let i=0;i<n;i++){const c=S.bmGmCh[i];if(!c||c.v!==g.v){toast('The map picture is still loading. Try again in a moment.');return;}}
  id=id||('s'+Date.now().toString(36));
  const col=S.db.collection('config'),oldN=num((S.bmLib[id]||{}).n);
  const meta={kind:'bscene',name,at:Date.now(),v:g.v,w:num(g.w),h:num(g.h),blank:!!g.blank,n,gx:num(g.gx)||50,ox:num(g.ox),oy:num(g.oy),grid:g.grid!==false,
    ter:Array.isArray(g.ter)?g.ter:[],tsh:g.tsh!==false,wt:g.wt!==false,fg:g.fg===true,fa:g.fa!==false,fv:clamp(Math.round(num(g.fv))||6,1,30),fw:g.fw!==false,fz:bmFogHand(g.fz),mk:g.mk&&typeof g.mk==='object'?JSON.parse(JSON.stringify(g.mk)):{},fm:g.fm&&typeof g.fm==='object'?JSON.parse(JSON.stringify(g.fm)):{}};
  setStatus('busy');
  try{
    for(let i=0;i<n;i++)await col.doc('bsi_'+id+'_'+i).set({kind:'bsimg',d:S.bmGmCh[i].d,v:g.v});
    for(let i=n;i<oldN;i++)await col.doc('bsi_'+id+'_'+i).delete();
    await col.doc('bsc_'+id).set(meta);
  }catch(e){fail(e);return;}
  S.bmLib[id]=meta;
  u.sn='';
  if(!Q.size)setStatus('saved');
  toast('"'+name+'" is in the library.',true);
  render();
}
async function bmSceneUse(id){
  const sc=S.bmLib[id];
  if(!bmLibOk()||!sc)return;
  const col=S.db.collection('config'),n=sc.blank?0:num(sc.n),chunks=[];
  setStatus('busy');
  try{
    for(let i=0;i<n;i++){
      const s=await col.doc('bsi_'+id+'_'+i).get();
      if(!s.exists||typeof s.data().d!=='string')throw new Error('missing');
      chunks.push(s.data().d);
    }
  }catch(e){
    if(e&&e.code)fail(e);else{setStatus('saved');toast('That saved map is missing part of its picture. Save it again from the original.');}
    return;
  }
  const oldN=num(bmG().n),v=Date.now(),gcol=S.db.collection('gm');
  await bmHidePublic();
  try{
    for(let i=0;i<n;i++)await gcol.doc('bmi_'+i).set({d:chunks[i],v});
    for(let i=n;i<oldN;i++)await gcol.doc('bmi_'+i).delete();
  }catch(e){fail(e);return;}
  const doc={v,name:String(sc.name||'Battle map'),w:num(sc.w),h:num(sc.h),blank:!!sc.blank,n,gx:num(sc.gx)||50,ox:num(sc.ox),oy:num(sc.oy),grid:sc.grid!==false,live:false,f:{},tp:{},
    ter:Array.isArray(sc.ter)?sc.ter.slice():[],tsh:sc.tsh!==false,wt:sc.wt!==false,fg:sc.fg===true,fa:sc.fa!==false,fv:clamp(Math.round(num(sc.fv))||6,1,30),fw:sc.fw!==false,fz:Array.isArray(sc.fz)?sc.fz.slice():[],mk:sc.mk&&typeof sc.mk==='object'?JSON.parse(JSON.stringify(sc.mk)):{},fm:sc.fm&&typeof sc.fm==='object'?JSON.parse(JSON.stringify(sc.fm)):{}};
  putLocal('bg','bmap',doc);save('bg','bmap',doc,{create:true});
  const u=S.ui.bm;
  u.sel='';u.msel='';u.tsel='';u.tp=[];u.tool='';u.ruler=false;u.setup=true;
  toast('"'+doc.name+'" is the battle map now. Show it to the players when you are ready.',true);
  render();
}
async function bmSceneDel(id){
  if(!bmLibOk()||!S.bmLib[id])return;
  const col=S.db.collection('config'),n=num(S.bmLib[id].n);
  try{
    await col.doc('bsc_'+id).delete();
    for(let i=0;i<n;i++)await col.doc('bsi_'+id+'_'+i).delete();
  }catch(e){fail(e);return;}
  delete S.bmLib[id];
  toast('Removed from the library.',true);
  render();
}

/* ===== the page pieces ===== */
function bmStep(label,val,unit,act){
  return h`<span class="bmstep" role="group" aria-label="${label}"><button type="button" class="btn sm" data-act="${act}" data-d="-1" aria-label="${label}: smaller">−</button><span class="bmstepv" aria-live="polite"><b>${val}</b> ${unit}</span><button type="button" class="btn sm" data-act="${act}" data-d="1" aria-label="${label}: larger">+</button></span>`;
}
function bmTools(cfg){
  const u=S.ui.bm,gm=cfg.adm;
  const b=(tool,label)=>h`<button type="button" class="btn sm ${u.tool===tool?'primary':''}" data-act="bm_tool" data-tool="${tool}" aria-pressed="${String(u.tool===tool)}">${label}</button>`;
  return h`<div class="row bmtools" role="group" aria-label="Map tools">${b('tpl','Range shapes')}${gm?b('paint','Paint terrain'):''}${gm?b('mark','Add markers'):''}${gm?b('fog','Fog of war'):''}</div>`;
}
function bmOpts(cfg,toks){
  const u=S.ui.bm,gm=cfg.adm;
  if(u.tool==='tpl'){
    const k=u.tk,mx=BM_TKMAX[k]||10,n=clamp(Math.round(num(u.tn))||1,1,mx),w=clamp(Math.round(num(u.tw))||1,1,5);
    const dirs=[7,0,1,6,-1,2,5,4,3];
    const t=u.sel&&toks.find(x=>x.cid===u.sel&&x.placed);
    return h`<div class="bmopts" role="group" aria-label="Range shape options">
      <div class="row"><span class="seg" role="group" aria-label="Shape">${BM_TK.map(s=>h`<button type="button" data-act="bm_tk" data-v="${s[0]}" aria-pressed="${String(k===s[0])}">${s[1]}</button>`)}</span>
        ${bmStep('Size',n,k==='blast'?'by '+n+' ('+bmFt(n)+' ft)':(n===1?'square':'squares')+' ('+bmFt(n)+' ft)','bm_tn')}
        ${k==='line'?bmStep('Width',w,w===1?'square wide':'squares wide','bm_tw'):''}</div>
      ${k==='cone'||k==='line'?h`<div class="row"><span class="bmdir" role="group" aria-label="Direction, for a tap">${dirs.map(i=>i<0?h`<span aria-hidden="true"></span>`:h`<button type="button" data-act="bm_td" data-d="${i}" aria-pressed="${String(u.td===i)}" aria-label="Point ${BM_DIRN[i]}">${BM_DARR[i]}</button>`)}</span>
        <span class="sub">Pointing ${BM_DIRN[clamp(Math.round(num(u.td)),0,7)]}. Or press where it starts and drag the way it should point.</span></div>`:h`<p class="sub">${k==='burst'?'Tap the middle square. Everything within that many squares is covered.':'Tap the middle of the area. It covers the number of squares you chose on each side.'}</p>`}
      <div class="row">${t?h`<button type="button" class="btn sm" data-act="bm_tpon">Start from ${t.v.name}</button>`:''}
        ${gm?h`<label class="row"><input type="checkbox" data-u="bm.tshare" data-nr ${u.tshare?raw('checked'):''}><span>Show new shapes to the players</span></label>`:''}
        ${bmHasWalls(cfg)?h`<label class="row"><input type="checkbox" data-u="bm.tb" data-nr ${u.tb!==false?raw('checked'):''}><span>Walls stop new shapes</span></label>`:''}</div>
      <p class="sub" id="bmtpnote" aria-live="polite"></p></div>`;
  }
  if(u.tool==='paint'&&gm){
    return h`<div class="bmopts" role="group" aria-label="Terrain brush">
      <div class="row"><span class="seg" role="group" aria-label="Terrain">${BM_TER.map(t=>h`<button type="button" data-act="bm_pb" data-v="${t[0]}" aria-pressed="${String(u.pb===t[0])}">${t[1]}</button>`)}<button type="button" data-act="bm_pb" data-v="." aria-pressed="${String(u.pb==='.')}">Erase</button></span>
        <span class="seg" role="group" aria-label="Brush size">${[1,2,3].map(n=>h`<button type="button" data-act="bm_pz" data-v="${n}" aria-pressed="${String(num(u.pz)===n)}" aria-label="Brush ${n} by ${n}">${n}×${n}</button>`)}</span>
        <button type="button" class="btn sm ${S.ui.confirm==='bm|terclr'?'armed':''}" data-act="bm_terclr">${S.ui.confirm==='bm|terclr'?'Tap again to clear all terrain':'Clear all terrain'}</button></div>
      <p class="sub">Drag across the map to paint. ${cfg.tsh?'The players see the terrain.':'The players do not see the terrain (change this in Settings).'}${u.pb==='B'?' Walls stop attack shapes'+(cfg.wt!==false?' and keep tokens from moving through them':'')+'.':''}</p></div>`;
  }
  if(u.tool==='fog'&&gm)return bmFogOpts(cfg);
  if(u.tool==='mark'&&gm){
    return h`<div class="bmopts" role="group" aria-label="Marker options">
      <div class="row"><span class="seg" role="group" aria-label="Marker kind">${BM_MK.map(m=>h`<button type="button" data-act="bm_mkk" data-v="${m[0]}" aria-pressed="${String(u.mk===m[0])}"><span aria-hidden="true">${m[2]}</span> ${m[1]}</button>`)}</span>
        <label class="fld"><span class="fl">Note (optional)</span><input type="text" maxlength="40" data-u="bm.ml" data-nr value="${u.ml}" placeholder="e.g. Pressure plate"></label></div>
      <p class="sub">Tap a square to drop a marker. New markers start hidden from the players; select one to show it.</p></div>`;
  }
  return '';
}
function bmTplList(cfg,toks,list){
  if(!list.length)return '';
  const u=S.ui.bm,gm=cfg.adm;
  return h`<div class="bmtpls"><div class="row sp"><span class="fl">Range shapes</span><button type="button" class="btn sm ghost" data-act="bm_tpclear">${gm?'Remove all':'Remove mine'}</button></div>
    <ul class="bmtpl-list">${list.map(t=>h`<li class="${u.tsel===t.id?'sel':''}"><button type="button" class="bmtpl-pick" data-act="bm_tpsel" data-id="${t.id}" aria-pressed="${String(u.tsel===t.id)}"><b>${bmTplName(t)}</b>${t.sh&&!t.own?h` <span class="pill">From the GM</span>`:''}${gm&&t.sh?h` <span class="pill good">Shown to players</span>`:''}${bmTplCut(cfg,t)?h` <span class="pill">Cut short by walls</span>`:''}<span class="sub">In the area: ${bmHitsText(cfg,bmTplHits(cfg,t,toks),t)}.</span></button>
      <span class="row">${gm?h`<button type="button" class="btn sm" data-act="bm_tpshare" data-id="${t.id}" data-on="${t.sh?0:1}">${t.sh?'Hide from players':'Show to players'}</button>`:''}${t.own?h`<button type="button" class="btn sm ghost" data-act="bm_tpdel" data-id="${t.id}" aria-label="Remove this shape">Remove</button>`:''}</span></li>`)}</ul></div>`;
}
function bmSetup2(cfg){
  const g=bmG(),u=S.ui.bm,has=!!cfg;
  const fm=g.fm||{},fids=Object.keys(fm).sort((a,b)=>String(fm[a].n).localeCompare(String(fm[b].n)));
  const lib=S.bmLib||{},lids=Object.keys(lib).sort((a,b)=>num(lib[b].at)-num(lib[a].at));
  const cur=has&&g.v;
  return h`${has?h`<div class="bmfm"><b>Formations</b>
      <p class="sub">Save where everyone stands, then put them back later (a rematch, or the same map next session). Allies are matched by Pokémon, foes by their letter (Foe A, Foe B…). A saved foe keeps whether it was shown.</p>
      ${fids.length?h`<ul class="bmlist">${fids.map(id=>h`<li><span><b>${fm[id].n}</b> <span class="sub">${Object.keys(fm[id].a||{}).length} allies, ${Object.keys(fm[id].f||{}).length} foes</span></span><span class="row"><button type="button" class="btn sm" data-act="bm_fmuse" data-id="${id}">Put them there</button><button type="button" class="btn sm ghost ${S.ui.confirm==='bm|fd|'+id?'armed':''}" data-act="bm_fmdel" data-id="${id}">${S.ui.confirm==='bm|fd|'+id?'Tap again to delete':'Delete'}</button></span></li>`)}</ul>`:h`<p class="sub">No formations yet.</p>`}
      <div class="row"><label class="fld"><span class="fl">Name</span><input type="text" maxlength="30" data-u="bm.fn" data-nr value="${u.fn}" placeholder="e.g. Ambush at the gate"></label><button type="button" class="btn sm" data-act="bm_fmsave">Save where everyone stands</button></div></div>`:''}
    ${bmLibOk()?h`<div class="bmlib"><b>Saved maps</b>
      <p class="sub">Keep up to ${BM_SCENES} maps, with their grid, terrain, markers and formations, to swap between. Only you can see the library.</p>
      ${lids.length?h`<ul class="bmlist">${lids.map(id=>{const s=lib[id];const key='bm|su|'+id;return h`<li><span><b>${s.name}</b> <span class="sub">${s.blank?'Blank grid':'Picture'}, ${Math.max(1,Math.floor((num(s.w)-num(s.ox))/(num(s.gx)||50)+1e-6))} by ${Math.max(1,Math.floor((num(s.h)-num(s.oy))/(num(s.gx)||50)+1e-6))} squares</span></span><span class="row"><button type="button" class="btn sm ${S.ui.confirm===key?'armed':'primary'}" data-act="bm_scuse" data-id="${id}">${S.ui.confirm===key?'Tap again to replace the current map':'Use this map'}</button><button type="button" class="btn sm ghost ${S.ui.confirm==='bm|sd|'+id?'armed':''}" data-act="bm_scdel" data-id="${id}">${S.ui.confirm==='bm|sd|'+id?'Tap again to delete':'Delete'}</button></span></li>`;})}</ul>`:h`<p class="sub">Nothing saved yet.</p>`}
      ${cur?h`<div class="row"><label class="fld"><span class="fl">Save the current map as</span><input type="text" maxlength="40" data-u="bm.sn" data-nr value="${u.sn}" placeholder="${String(g.name||'Battle map')}"></label><button type="button" class="btn sm" data-act="bm_scsave">Save to the library</button></div>
        <p class="sub">Using a saved map replaces the current one, its terrain and its markers. Save the current one first if you want to keep it. A name you have used already is replaced.</p>`:''}</div>`:''}`;
}

/* ===== actions ===== */
function bm2Act(b,e){
  const d=b.dataset,u=S.ui.bm,gm=!!S.me.admin;
  switch(d.act){
    case 'bm_tool':{
      const t=d.tool;
      if((t==='paint'||t==='mark'||t==='fog')&&!gm)break;
      u.tool=u.tool===t?'':t;u.ruler=false;u.rl=null;u.cal=0;u.calA=null;
      if(u.tool==='paint'||u.tool==='fog')u.sel='';
      render();break;}
    case 'bm_tk':if(BM_TKMAX[d.v]){u.tk=d.v;u.tn=clamp(Math.round(num(u.tn))||1,1,BM_TKMAX[d.v]);}render();break;
    case 'bm_tn':u.tn=clamp((Math.round(num(u.tn))||1)+num(d.d),1,BM_TKMAX[u.tk]||10);render();break;
    case 'bm_tw':u.tw=clamp((Math.round(num(u.tw))||1)+num(d.d),1,5);render();break;
    case 'bm_td':u.td=clamp(Math.round(num(d.d)),0,7);render();break;
    case 'bm_tpsel':u.tsel=u.tsel===d.id?'':d.id;render();break;
    case 'bm_tpdel':bmTplDel(d.id);render();break;
    case 'bm_tpshare':bmTplShare(d.id,d.on==='1');render();break;
    case 'bm_tpclear':bmTplClear();render();break;
    case 'bm_tpon':{
      const cfg=bmCfg(),t=cfg&&bmTokens(cfg).find(k=>k.cid===u.sel&&k.placed);
      if(!t)break;
      const o=Math.floor((t.fp-1)/2);
      bmTplAdd({k:u.tk,x:t.x+o,y:t.y+o,n:clamp(Math.round(num(u.tn))||1,1,BM_TKMAX[u.tk]||10),d:clamp(Math.round(num(u.td)),0,7),w:clamp(Math.round(num(u.tw))||1,1,5),b:u.tb===false?0:1});
      render();break;}
    case 'bm_pb':if(gm&&(d.v==='.'||BM_TERK[d.v]))u.pb=d.v;render();break;
    case 'bm_pz':u.pz=clamp(Math.round(num(d.v))||1,1,3);render();break;
    case 'bm_terclr':if(gm)ntTwice('bm|terclr',()=>{bmTerClear();toast('The terrain was cleared.',true);render();});break;
    case 'bm_mkk':if(BM_MKD[d.v])u.mk=d.v;render();break;
    case 'bm_msel':{
      if(bmMoved)break;
      u.msel=u.msel===d.id?'':d.id;u.sel='';render();break;}
    case 'bm_mdesel':u.msel='';render();break;
    case 'bm_mvis':if(gm){edit('bg','bmap','mk.'+d.id+'.vis',d.on==='1'?1:0);bmSync();render();}break;
    case 'bm_mdel':if(gm){bmMkDel(d.id);render();}break;
    case 'bm_fmsave':if(gm)bmFmSave();break;
    case 'bm_fmuse':if(gm)bmFmUse(d.id);break;
    case 'bm_fmdel':if(gm)ntTwice('bm|fd|'+d.id,()=>bmFmDel(d.id));break;
    case 'bm_scsave':if(gm)bmSceneSave();break;
    case 'bm_scuse':if(gm){if(bmG().v)ntTwice('bm|su|'+d.id,()=>bmSceneUse(d.id));else bmSceneUse(d.id);}break;
    case 'bm_scdel':if(gm)ntTwice('bm|sd|'+d.id,()=>bmSceneDel(d.id));break;
    default:bm3Act(b,e);
  }
}

/* ---------- Battle map, part three: fog of war ----------
   The map can start covered. A square is uncovered for the players in two ways: the GM uncovers it by hand, or one of the
   players' Pokémon can see it (a sight range, and walls block sight). Squares a Pokémon has seen stay on the map, dimmed,
   when it moves on; the GM can also cover a square for good, even one a Pokémon is standing next to.
   Where it lives (all in documents the existing rules already cover, so there is no rules change):
     gm/bmap     gains  fg (fog on), fa (Pokémon uncover what they see), fv (sight range in squares), fw (walls block sight),
                        fz (one string per row: u = uncovered by hand, c = covered by hand, e = seen earlier, . = nothing yet)
     meta/bmap   gains  fg and fr (one string per row: v = in view, e = seen earlier, . = covered), worked out on the GM's device,
                        and everything else the GM shares is filtered through it: a foe, a marker or a wall in a covered
                        square is not in the table's copy at all.
   The fog is a cover over the picture. The picture file itself is still sent to the players, so a secret drawn into the
   picture is not protected; crop it before uploading. */
S.ui.bm=Object.assign({fb:'u',fs:1},S.ui.bm);

const BM_FB=[['u','Uncover'],['c','Cover'],['.','Undo']];

/* the squares each of the players' Pokémon can see, by hand and by sight, turned into what the table gets */
function bmFogSources(cfg){
  return bmTokens(cfg).filter(t=>(t.side==='a'||t.side==='t')&&t.placed&&!t.v.down);
}
function bmFogSig(cfg,src){
  return [cfg.fa?1:0,cfg.fv,cfg.fw?1:0,cfg.cols,cfg.rows,cfg.fz.join('/'),cfg.fa&&cfg.fw?cfg.ter.join('/'):'',src.map(t=>t.cid+':'+t.x+','+t.y+','+t.fp).join(';')].join('|');
}
/* GM side only. Returns {rows, fz, merged}: rows are what the players get (v, e or .), and when a Pokémon has just seen
   new squares, fz is the GM's rows with them remembered (merged is true then). The last answer is kept until something changes. */
function bmFogEff(cfg){
  const src=cfg.fa?bmFogSources(cfg):[];
  const key=bmFogSig(cfg,src);
  if(S.bmFogC&&S.bmFogC.key===key)return S.bmFogC;
  const live=new Set(),walls=cfg.fw&&bmHasWalls(cfg);
  src.forEach(t=>{
    const o=Math.floor((t.fp-1)/2),cx=t.x+o,cy=t.y+o,R=cfg.fv+Math.floor(t.fp/2);
    for(let y=Math.max(0,cy-R);y<=Math.min(cfg.rows-1,cy+R);y++){
      for(let x=Math.max(0,cx-R);x<=Math.min(cfg.cols-1,cx+R);x++){
        const k=x+','+y;
        if(live.has(k))continue;
        /* a wall can be seen, but nothing behind it */
        if(!walls||bmClearLine(cfg,cx,cy,x,y,true))live.add(k);
      }
    }
  });
  const rows=[],fz=[];
  let merged=false;
  for(let y=0;y<cfg.rows;y++){
    const m0=cfg.fz[y]||'';
    let r='',z='';
    for(let x=0;x<cfg.cols;x++){
      const m=m0[x]||'.',lv=live.has(x+','+y);
      r+=m==='c'?'.':(m==='u'||lv)?'v':m==='e'?'e':'.';
      let m2=m;
      if(m==='.'&&lv){m2='e';merged=true;}
      z+=m2;
    }
    rows.push(r);fz.push(z);
  }
  return (S.bmFogC={key,rows:bmTerPack(rows),fz:bmTerPack(fz),merged});
}
/* what a person sees: the GM sees the working out, everyone else the rows the GM published */
const bmFe=cfg=>cfg._fe||(cfg._fe=cfg.adm?bmFogEff(cfg).rows:cfg.fr);
const bmFogAt=(cfg,x,y)=>(bmFe(cfg)[y]||'')[x]||'.';
function bmRowsSeen(rows,x,y,fp){
  for(let a=0;a<fp;a++)for(let b=0;b<fp;b++)if(((rows[y+b]||'')[x+a]||'.')==='v')return true;
  return false;
}
let bmFogT=0;
/* a Pokémon moved: let the table's copy catch up in a moment (only the GM's device can do this) */
function bmFogSoon(){
  if(!S.me.admin||bmFogT)return;
  const g=bmG();
  if(!g.v||g.fg!==true||g.fa===false||!g.live)return;
  bmFogT=setTimeout(()=>{bmFogT=0;bmSync();},500);
}
/* a saved map keeps what the GM set by hand, not what was seen */
const bmFogHand=rows=>bmTerPack((Array.isArray(rows)?rows:[]).map(r=>String(r).replace(/e/g,'.')));

function bmFogSvg(cfg){
  if(!cfg.fg)return '';
  const rows=bmFe(cfg),g=cfg.gx,f=n=>+(g*n).toFixed(3);
  const rect=(x,y,w,hh)=>'<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+hh+'"/>';
  let hid='',dim='';
  /* the strips of picture outside the grid are covered too */
  const gx2=cfg.ox+cfg.cols*g,gy2=cfg.oy+cfg.rows*g;
  if(cfg.ox>0)hid+=rect(0,0,cfg.ox,cfg.h);
  if(cfg.oy>0)hid+=rect(cfg.ox,0,cfg.w-cfg.ox,cfg.oy);
  if(gx2<cfg.w)hid+=rect(gx2,cfg.oy,cfg.w-gx2,cfg.h-cfg.oy);
  if(gy2<cfg.h)hid+=rect(cfg.ox,gy2,gx2-cfg.ox,cfg.h-gy2);
  for(let y=0;y<cfg.rows;y++){
    const r=rows[y]||'';
    let x=0;
    while(x<cfg.cols){
      const ch=r[x]||'.';
      let x2=x+1;
      while(x2<cfg.cols&&(r[x2]||'.')===ch)x2++;
      if(ch!=='v'){const s=rect(cfg.ox+x*g,cfg.oy+y*g,(x2-x)*g,g);if(ch==='e')dim+=s;else hid+=s;}
      x=x2;
    }
  }
  const pat=cfg.adm?'<defs><pattern id="bmfgh" patternUnits="userSpaceOnUse" width="'+f(.2)+'" height="'+f(.2)+'" patternTransform="rotate(45)"><rect width="'+f(.2)+'" height="'+f(.2)+'" fill="#05070d" fill-opacity=".5"/><rect width="'+f(.07)+'" height="'+f(.2)+'" fill="#000" fill-opacity=".45"/></pattern></defs>':'';
  return h`<svg class="bmfog ${cfg.adm?'gm':''}" viewBox="0 0 ${cfg.w} ${cfg.h}" preserveAspectRatio="none" shape-rendering="crispEdges" aria-hidden="true">${raw(pat)}<g class="fg-hid">${raw(hid)}</g><g class="fg-dim">${raw(dim)}</g></svg>`;
}

/* ----- painting the fog by hand (GM) ----- */
let bmFp=null;
function bmFogGrid(cfg){
  const g=[];
  for(let y=0;y<cfg.rows;y++){const r=cfg.fz[y]||'',a=[];for(let x=0;x<cfg.cols;x++)a.push(r[x]||'.');g.push(a);}
  return g;
}
function bmFgStamp(cfg,c){
  const d=bmFp,s=clamp(Math.round(num(S.ui.bm.fs))||1,1,3),lo=-Math.floor((s-1)/2);
  for(let y=0;y<s;y++)for(let x=0;x<s;x++){
    const xx=c.x+lo+x,yy=c.y+lo+y;
    if(xx<0||yy<0||xx>=cfg.cols||yy>=cfg.rows)continue;
    const k=xx+','+yy;
    if(d.mark.has(k))continue;
    d.mark.add(k);
    if(d.rows[yy][xx]!==d.ch){d.rows[yy][xx]=d.ch;d.n++;}
  }
}
function bmFgDraw(){
  const cfg=bmCfg(),g=document.getElementById('bmdr');
  if(!g||!cfg||!bmFp)return;
  const col=bmFp.ch==='u'?'rgba(47,158,68,.55)':bmFp.ch==='c'?'rgba(229,72,58,.55)':'rgba(140,150,170,.55)';
  let s='';
  bmFp.mark.forEach(k=>{const p=k.split(',');s+='<rect x="'+(cfg.ox+p[0]*cfg.gx)+'" y="'+(cfg.oy+p[1]*cfg.gx)+'" width="'+cfg.gx+'" height="'+cfg.gx+'" fill="'+col+'"/>';});
  g.innerHTML=s;
}
function bmFgStart(e){
  const cfg=bmCfg(),p=bmPoint(e),u=S.ui.bm;
  if(!cfg||!p||!cfg.adm||!cfg.fg)return;
  const c=bmCellOf(cfg,p);
  bmFp={rows:bmFogGrid(cfg),last:c,ch:BM_FB.some(b=>b[0]===u.fb)?u.fb:'u',n:0,mark:new Set()};
  bmBusy=true;
  try{bmMapEl().setPointerCapture(e.pointerId);}catch(err){}
  bmFgStamp(cfg,c);bmFgDraw();
  e.preventDefault();
}
function bmFgMove(e){
  const d=bmFp,cfg=bmCfg(),p=bmPoint(e);
  if(!d||!cfg||!p)return;
  const c=bmCellOf(cfg,p);
  if(c.x===d.last.x&&c.y===d.last.y)return;
  const steps=Math.max(Math.abs(c.x-d.last.x),Math.abs(c.y-d.last.y));
  for(let i=1;i<=steps;i++)bmFgStamp(cfg,{x:Math.round(d.last.x+(c.x-d.last.x)*i/steps),y:Math.round(d.last.y+(c.y-d.last.y)*i/steps)});
  d.last=c;bmFgDraw();
}
function bmFgEnd(){
  const d=bmFp;
  bmFp=null;bmBusy=false;
  if(d&&d.n){edit('bg','bmap','fz',bmTerPack(d.rows));bmSync();}
  bmQueued=false;
  render();
}

/* ----- the page pieces ----- */
function bmFogOpts(cfg){
  const u=S.ui.bm;
  if(!cfg.fg){
    return h`<div class="bmopts" role="group" aria-label="Fog of war">
      <p class="sub">Fog of war is off, so the players see the whole map. Turn it on and the map starts covered for them.</p>
      <div class="row"><button type="button" class="btn sm primary" data-act="bm_fogon">Turn fog of war on</button></div></div>`;
  }
  return h`<div class="bmopts" role="group" aria-label="Fog of war">
    <div class="row"><span class="seg" role="group" aria-label="Brush">${BM_FB.map(b=>h`<button type="button" data-act="bm_fb" data-v="${b[0]}" aria-pressed="${String(u.fb===b[0])}">${b[1]}</button>`)}</span>
      <span class="seg" role="group" aria-label="Brush size">${[1,2,3].map(n=>h`<button type="button" data-act="bm_fs" data-v="${n}" aria-pressed="${String(num(u.fs)===n)}" aria-label="Brush ${n} by ${n}">${n}×${n}</button>`)}</span></div>
    <div class="row"><button type="button" class="btn sm" data-act="bm_fgall">Uncover everything</button>
      <button type="button" class="btn sm ${S.ui.confirm==='bm|fgn'?'armed':''}" data-act="bm_fgnone">${S.ui.confirm==='bm|fgn'?'Tap again to cover everything':'Cover everything again'}</button></div>
    <p class="sub">Drag across the map. <b>Uncover</b> shows squares to the players for good. <b>Cover</b> hides them, even from a Pokémon standing next to them. <b>Undo</b> puts a square back to normal (${cfg.fa?'hidden until a Pokémon sees it':'hidden'}). Hatched squares are hidden from the players; lighter ones were seen earlier but are out of sight now.</p></div>`;
}
function bmFogSettings(g,cfg){
  const on=g.fg===true;
  return h`<div class="bmfogset"><b>Fog of war</b>
    <label class="row"><input type="checkbox" ${bd('bg','bmap','fg')} ${on?raw('checked'):''}><span>Cover the map: players see only squares that are uncovered or in sight</span></label>
    ${on?h`<label class="row"><input type="checkbox" ${bd('bg','bmap','fa')} ${g.fa!==false?raw('checked'):''}><span>The players' Pokémon uncover what they can see as they move</span></label>
      <label class="row"><input type="checkbox" ${bd('bg','bmap','fw')} ${g.fw!==false?raw('checked'):''}><span>Walls block sight</span></label>
      <div class="fgrid"><label class="fld"><span class="fl">Sight range (squares)</span><input type="number" inputmode="numeric" min="1" max="30" ${bd('bg','bmap','fv')} value="${cfg?cfg.fv:6}"></label></div>`:''}
    <p class="sub">${on?'Squares a Pokémon has seen stay on the map, dimmed, after it moves on. Use the Fog of war tool above the map to uncover or cover squares by hand. ':''}The fog is a cover over the picture: foes, markers and walls in covered squares are not sent to the players, but the picture file is, so crop any secret out of it before you upload it.</p></div>`;
}

function bm3Act(b,e){
  const d=b.dataset,u=S.ui.bm,gm=!!S.me.admin;
  switch(d.act){
    case 'bm_fb':if(BM_FB.some(x=>x[0]===d.v))u.fb=d.v;render();break;
    case 'bm_fs':u.fs=clamp(Math.round(num(d.v))||1,1,3);render();break;
    case 'bm_fogon':if(gm){edit('bg','bmap','fg',true);bmSync();render();}break;
    case 'bm_fgall':{
      const cfg=bmCfg();
      if(!gm||!cfg)break;
      const rows=[];for(let y=0;y<cfg.rows;y++)rows.push('u'.repeat(cfg.cols));
      edit('bg','bmap','fz',rows);bmSync();toast('Everything is uncovered.',true);render();break;}
    case 'bm_fgnone':if(gm)ntTwice('bm|fgn',()=>{edit('bg','bmap','fz',[]);bmSync();toast('The map is covered again.',true);render();});break;
  }
}

