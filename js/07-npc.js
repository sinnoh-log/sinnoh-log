'use strict';
/* Sinnoh Trainer Log · 07-npc. The files in js/ are classic scripts that share one scope: load them in order (see index.html). */
/* ---------- NPC trainers: people the GM runs, with Pokémon of their own ----------
   Same idea as the hidden foes in a battle, with two documents:
     gm/nt_<id>   the NPC itself: notes, secrets and every Pokémon's full sheet. Firestore's rules let only the GM read it,
                  so a player's browser never receives it.
     meta/npcs    what the table may see: only the NPCs the GM has shown, and of those only the parts ticked.
   A Pokémon on an NPC's team is copied into a battle as a foe (gm/battle), so the battle's own reveal controls apply. */
S.ui.nt=S.ui.nt||{open:{},mon:{},more:{}};

const NTS=()=>S.gmNt||{};
const ntIds=()=>Object.keys(NTS()).sort((a,b)=>num(NTS()[a].order)-num(NTS()[b].order)||num(NTS()[a].createdAt)-num(NTS()[b].createdAt));
const ntName=nt=>(nt&&String(nt.name||'').trim())||'Unnamed NPC';
const ntTeam=nt=>(nt&&Array.isArray(nt.team))?nt.team:[];
const ntPub=id=>(S.npcPub&&S.npcPub.n&&S.npcPub.n[id])||null;
const newMonId=()=>'m'+Date.now().toString(36)+Math.random().toString(36).slice(2,5);
const ntMonName=m=>m.nick||m.sp||'New Pokémon';
const ntShown=m=>{const s=(m&&m.sh)||{};return !!(num(s.name)||num(s.pic)||num(s.types)||num(s.item));};
/* the trainer's name on a foe, once the table has been shown that NPC */
const ntOwnerLabel=f=>{const p=f&&f.nt?ntPub(f.nt):null;return p?p.n:null;};
/* the GM's own view of whose Pokémon a foe is */
const ntFoeOwner=f=>f?(f.nt&&NTS()[f.nt]?ntName(NTS()[f.nt]):(f.own||'')):'';
function ntInBattle(id,mid){
  const fo=foesOf();
  return Object.keys(fo).some(cid=>fo[cid].nt===id&&fo[cid].ni===mid&&btC(cid));
}

/* the kind of NPC this is: the one picked, else a guess from the role and name. Villain faction is GM only. */
const ntCat=nt=>npcCatOf(nt.cat,(nt.role||'')+' '+ntName(nt),true);
/* the table gets a kind from the public list only; a Villain faction NPC is filed under nothing */
const ntCatPub=nt=>{const c=ntCat(nt);return NPC_CATS.some(x=>x[0]===c)?c:null;};

/* ----- what the table sees ----- */
function ntPubOf(nt){
  if(!nt||!num(nt.rev&&nt.rev.on))return null;
  const r=nt.rev||{};
  const txt=k=>String(nt[k]||'').trim();
  const cls=[txt('cls'),txt('adv')].filter(Boolean).join(' · ');
  const st=nt.stats||{},hp=nt.hp||{};
  return {
    n:ntName(nt),
    c:ntCatPub(nt),
    r:num(r.role)&&txt('role')?txt('role'):null,
    pl:num(r.place)&&txt('place')?txt('place'):null,
    b:num(r.notes)&&txt('notes')?txt('notes'):null,
    lv:num(r.cls)?(num(nt.level)||null):null,
    cl:num(r.cls)&&cls?cls:null,
    st:num(r.stats)?{hp:num(hp.max),atk:num(st.atk),def:num(st.def),spa:num(st.spa),spd:num(st.spd),spe:num(st.spe)}:null,
    it:num(r.items)?(nt.items||[]).filter(x=>String(x&&x.name||'').trim()).map(x=>({n:String(x.name).trim(),q:num(x.qty)})):null,
    m:ntTeam(nt).filter(ntShown).map(m=>{
      const s=m.sh||{};
      const it=String(m.item||'').trim();
      return {i:String(m.id||''),n:num(s.name)?ntMonName(m):'Unknown Pokémon',sp:num(s.pic)?String(m.sp||''):'',ty:num(s.types)?(m.ty||[]).filter(Boolean):null,it:num(s.item)&&it?it:null};
    })
  };
}
/* The portrait. The GM's copy sits in the NPC's own document (`img`, the whole picture, plus `imgc`, how it sits in the frame),
   which only the GM can read. The table's copy is a separate small document, mapimg/npc_<id>, that exists only while the NPC is
   shown and its Picture box is ticked. It rides in the collection the map already uses, so the existing rules cover it. */
const ntImgOk=v=>/^data:image\//.test(String(v||''));
const ntPicDoc=id=>'npc_'+id;
/* how the picture sits in its frame: the point that stays put (x, y in percent) and the zoom */
const ntCrop=c=>{
  c=c||{};
  return {x:clamp(Math.round(num(c.x==null?50:c.x)*10)/10,0,100),y:clamp(Math.round(num(c.y==null?50:c.y)*10)/10,0,100),z:clamp(Math.round(num(c.z==null?1:c.z)*100)/100,1,3)};
};
const ntPicOf=id=>{const c=S.mapChunks&&S.mapChunks[ntPicDoc(id)];return c&&ntImgOk(c.d)?c.d:'';};
const ntPicCrop=id=>ntCrop(S.mapChunks&&S.mapChunks[ntPicDoc(id)]&&S.mapChunks[ntPicDoc(id)].c);
function ntPicSync(id){
  if(!S.me.admin)return;
  const nt=NTS()[id];
  const r=(nt&&nt.rev)||{};
  const want=nt&&num(r.on)&&num(r.pic)&&ntImgOk(nt.img)?String(nt.img):'';
  const have=ntPicOf(id);
  if(!want&&!have)return;
  const wc=ntCrop(nt&&nt.imgc),hc=ntPicCrop(id);
  if(want&&want===have&&JSON.stringify(wc)===JSON.stringify(hc))return;
  const k=ntPicDoc(id),ref=S.db.collection('mapimg').doc(k),v=Date.now();
  if(want&&want===have){
    /* only the frame changed: no need to send the picture again */
    S.mapChunks[k]=Object.assign({},S.mapChunks[k],{c:wc,v});
    ref.update({c:wc,v}).catch(e=>fail(e));
  }else if(want){
    S.mapChunks[k]={d:want,c:wc,v};
    ref.set({d:want,c:wc,v}).catch(e=>fail(e));
  }else{
    delete S.mapChunks[k];
    ref.delete().catch(e=>fail(e));
  }
}
/* the picture in its frame. cls: "thumb" (square), "edit" (the GM's, draggable) or nothing (4:5 portrait) */
function ntPortrait(src,crop,cls,attrs){
  const u=imgSrc(src);
  if(!u)return '';
  const c=ntCrop(crop);
  return h`<div class="ptr ${cls||''}" ${attrs||''} ${raw('style="--x:'+c.x+'%;--y:'+c.y+'%;--z:'+c.z+'"')}><img src="${u}" alt="" draggable="false"></div>`;
}
/* the frame controls under the GM's picture */
function ntFramePanel(id,nt,sc){
  sc=sc||'gt';
  const c=ntCrop(nt.imgc);
  return h`<div class="ptfr"><label class="fld"><span class="fl">Zoom</span><input type="range" class="ptz" data-sc="${sc}" data-id="${id}" min="1" max="3" step="0.05" value="${c.z}" aria-label="Zoom the picture"></label>
    <div class="row"><button class="btn sm" data-act="${sc==='gt'?'nt_fr0':'fr0'}" data-sc="${sc}" data-id="${id}">Reset frame</button><button class="btn sm" data-act="lbx" data-k="${sc+'|'+id}">View full picture</button></div>
    <span class="sub">Drag the picture to move it. Arrow keys work too.</span></div>`;
}
/* ----- moving and zooming the picture in its frame ----- */
let ntFrDrag=null,ntFrTimer=0;
/* who may move the picture: the GM for an NPC, the owner (or the GM) for a trainer, anyone at the table for a person */
function frCan(sc,id){
  if(sc==='gt')return !!S.me.admin;
  if(sc==='t')return canEditT(id);
  if(sc==='ppl')return canShared();
  return false;
}
function ntFrameSave(id,c,sc){
  sc=sc||'gt';
  edit(sc,id,'imgc',ntCrop(c));
  clearTimeout(ntFrTimer);
  /* an NPC's table copy is updated; the other pictures show up on the cards when the page redraws */
  ntFrTimer=setTimeout(()=>{if(sc==='gt')ntPublish(id);else render();},350);
}
function ntFrameApply(f,c){
  const im=f&&f.querySelector('img');
  if(!im)return;
  const set=el=>{el.style.setProperty('--x',c.x+'%');el.style.setProperty('--y',c.y+'%');el.style.setProperty('--z',c.z);};
  set(f);
  /* the small picture on her card in the list follows along */
  const th=f.closest('.ntcard')&&f.closest('.ntcard').querySelector('.nthd .ptr');
  if(th)set(th);
}
/* how far the zoomed picture overhangs the frame, in pixels: a full sweep of x or y from 0 to 100 moves the picture by this much */
function ntFrameGeom(f,z){
  const im=f.querySelector('img'),r=f.getBoundingClientRect();
  const nw=im&&im.naturalWidth||r.width,nh=im&&im.naturalHeight||r.height;
  const k=Math.max(r.width/nw,r.height/nh);
  return {ox:nw*k*z-r.width,oy:nh*k*z-r.height};
}
function ntFrameStart(f,e){
  const id=f.dataset.id,sc=f.dataset.sc||'gt',nt=galDoc(sc,id);
  if(!nt||!frCan(sc,id))return;
  const c=ntCrop(nt.imgc);
  ntFrDrag={id,sc,f,x0:e.clientX,y0:e.clientY,c0:c,c,g:ntFrameGeom(f,c.z)};
  try{f.setPointerCapture(e.pointerId);}catch(err){}
  try{f.focus({preventScroll:true});}catch(err){}
  f.classList.add('drag');
  e.preventDefault();
}
function ntFrameMove(e){
  const d=ntFrDrag;
  if(!d)return;
  const c=Object.assign({},d.c0);
  if(d.g.ox>0.5)c.x=clamp(d.c0.x-(e.clientX-d.x0)/d.g.ox*100,0,100);
  if(d.g.oy>0.5)c.y=clamp(d.c0.y-(e.clientY-d.y0)/d.g.oy*100,0,100);
  d.c=ntCrop(c);
  ntFrameApply(d.f,d.c);
}
function ntFrameEnd(){
  const d=ntFrDrag;
  if(!d)return;
  ntFrDrag=null;
  d.f.classList.remove('drag');
  if(JSON.stringify(d.c)!==JSON.stringify(d.c0))ntFrameSave(d.id,d.c,d.sc);
}
function ntFrameKey(f,e){
  const id=f.dataset.id,sc=f.dataset.sc||'gt',nt=galDoc(sc,id);
  if(!nt||!frCan(sc,id))return false;
  const step=e.shiftKey?10:3;
  const dx={ArrowRight:-step,ArrowLeft:step}[e.key]||0,dy={ArrowDown:-step,ArrowUp:step}[e.key]||0;
  if(!dx&&!dy)return false;
  const c=ntCrop(nt.imgc),g=ntFrameGeom(f,c.z);
  if(g.ox>0.5)c.x=clamp(c.x+dx,0,100);
  if(g.oy>0.5)c.y=clamp(c.y+dy,0,100);
  const n=ntCrop(c);
  ntFrameApply(f,n);
  ntFrameSave(id,n,sc);
  e.preventDefault();
  return true;
}
function ntFrameZoom(t,commit){
  const id=t.dataset.id,sc=t.dataset.sc||'gt',nt=galDoc(sc,id);
  if(!nt||!frCan(sc,id))return;
  const c=ntCrop(Object.assign({},nt.imgc,{z:+t.value}));
  const f=t.closest('.idimg')&&t.closest('.idimg').querySelector('.ptr.edit');
  if(f)ntFrameApply(f,c);
  if(commit)ntFrameSave(id,c,sc);
}
/* ----- sharp copies (Update 32): the small picture stays on the card's own document; a larger one sits in `pics`, named after the small one ----- */
const HIRES=new Map(),HIRES_BUSY=new Set();
function picId(str){
  let h1=0xdeadbeef,h2=0x41c6ce57;
  for(let i=0;i<str.length;i++){const c=str.charCodeAt(i);h1=Math.imul(h1^c,2654435761);h2=Math.imul(h2^c,1597334677);}
  h1=Math.imul(h1^(h1>>>16),2246822507)^Math.imul(h2^(h2>>>13),3266489909);
  h2=Math.imul(h2^(h2>>>16),2246822507)^Math.imul(h1^(h1>>>13),3266489909);
  return 'h'+(h2>>>0).toString(16).padStart(8,'0')+(h1>>>0).toString(16).padStart(8,'0')+'-'+str.length;
}
/* the sharp copy for a small picture: the text if it is known, '' if there is none, undefined while it is still being fetched */
function hiGet(thumb){
  if(!ntImgOk(thumb)||!S.db)return '';
  const id=picId(thumb);
  if(HIRES.has(id))return HIRES.get(id);
  if(!HIRES_BUSY.has(id)){
    HIRES_BUSY.add(id);
    Promise.resolve().then(()=>S.db.collection('pics').doc(id).get()).then(sn=>{
      const d=sn&&sn.exists?(sn.data()||{}).d:'';
      HIRES.set(id,typeof d==='string'&&JPEG_RE.test(d)?d:'');
    },()=>{HIRES.set(id,'');}).then(()=>{HIRES_BUSY.delete(id);lbxRender();});
  }
  return undefined;
}
/* saves a sharper copy next to a freshly uploaded picture; returns a note for the person when it could not be kept */
async function picStore(file,thumb){
  try{
    const r=await fileToImage(file,{max:1600,q:0.86,cap:380000});
    if(r.url.length<=thumb.length*1.15)return '';
    const id=picId(thumb);
    await S.db.collection('pics').doc(id).set({owner:S.me.id,d:r.url,at:Date.now()});
    HIRES.set(id,r.url);
    return '';
  }catch(e){
    return e&&e.code==='permission-denied'?'Picture saved, but its sharp copy could not be kept. Publish the new firestore.rules to turn that on.':'';
  }
}
function picDrop(thumb){
  if(!ntImgOk(thumb)||!S.db)return;
  const id=picId(thumb);
  HIRES.delete(id);
  try{Promise.resolve(S.db.collection('pics').doc(id).delete()).catch(()=>{});}catch(e){}
}
/* ----- the full picture, in front of the page ----- */
/* ----- more pictures (Update 31): the main photo is the document's `img`; the others sit in `imgs` ----- */
const GAL_MAX={t:5,ppl:5,gt:4};
const GAL_CAP={t:70000,ppl:70000,gt:110000};
function galDoc(sc,id){return sc==='gt'?(NTS()[id]||null):(typeof getLocal==='function'?getLocal(sc,id):null);}
function galAlts(doc){return doc&&Array.isArray(doc.imgs)?doc.imgs.filter(ntImgOk):[];}
function galList(doc){
  const out=[];
  if(doc&&ntImgOk(doc.img))out.push({src:doc.img,main:true,i:-1});
  galAlts(doc).forEach((s,i)=>out.push({src:s,main:false,i}));
  return out;
}
function galName(sc,doc){return sc==='t'?tName(doc):sc==='gt'?ntName(doc):(doc&&doc.name)||'Person';}
/* a picture that opens the viewer, with a count when there is more than one; falls back to the plain portrait */
function galOpen(sc,id,doc,cls){
  const list=galList(doc),name=galName(sc,doc);
  if(!list.length)return pimg('',name,cls);
  return h`<button class="galopen" data-act="lbx" data-k="${sc+'|'+id}" aria-label="${'Enlarge the picture of '+name+(list.length>1?' ('+list.length+' pictures)':'')}" title="Enlarge">${pimg(doc.img||list[0].src,name,cls,doc.img?doc.imgc:null)}${list.length>1?h`<span class="galn" aria-hidden="true">${list.length}</span>`:''}</button>`;
}
/* the picture area on an editor: a frame to drag and zoom when the viewer may change it, otherwise a picture that opens large */
function picEditor(sc,id,doc,ro){
  if(ro||!ntImgOk(doc.img))return galOpen(sc,id,doc,'tall');
  return ntPortrait(doc.img,doc.imgc,'edit',h`data-sc="${sc}" data-id="${id}" tabindex="0" role="group" aria-label="Picture frame. Drag to move the picture, or use the arrow keys."`);
}
function picFrame(sc,id,doc,ro){return !ro&&ntImgOk(doc.img)?ntFramePanel(id,doc,sc):'';}
function galPanel(sc,id,doc,ro){
  const list=galList(doc);
  if(ro&&list.length<2)return '';
  const left=GAL_MAX[sc]-galAlts(doc).length;
  return h`<div class="gal" role="group" aria-label="Pictures">
    ${list.length?h`<ul class="galt">${list.map((e,k)=>h`<li class="${e.main?'on':''}"><button class="galb" data-act="lbx" data-k="${sc+'|'+id+'|'+k}" aria-label="${'Enlarge picture '+(k+1)+' of '+list.length+(e.main?' (the main photo)':'')}"><img src="${imgSrc(e.src)}" alt=""></button>${e.main?h`<span class="pill">Main</span>`:ro?'':h`<span class="galacts"><button class="btn sm" data-act="galUse" data-sc="${sc}" data-id="${id}" data-i="${e.i}">Use as main</button><button class="btn sm ghost" data-act="galRm" data-sc="${sc}" data-id="${id}" data-i="${e.i}" aria-label="${'Remove picture '+(k+1)}">Remove</button></span>`}</li>`)}</ul>`:''}
    ${ro?'':left>0?h`<div class="row"><button class="btn sm" data-act="galPick" data-img="${sc+'|'+id+'|imgs'}" data-w="0" data-h="0" data-max="${sc==='gt'?900:640}" data-cap="${GAL_CAP[sc]}">${list.length?'Add another picture':'Add a picture'}</button><span class="sub">${list.length} of ${GAL_MAX[sc]+1}</span></div>`:h`<span class="sub">That is the most pictures one card can hold. Remove one to add another.</span>`}
  </div>`;
}
function galAfter(sc,id){if(sc==='gt')ntPublish(id);}
function galUse(sc,id,i){
  const doc=galDoc(sc,id);if(!doc)return;
  const alts=galAlts(doc),pick=alts[i];if(!pick)return;
  if(ntImgOk(doc.img))alts[i]=doc.img;else alts.splice(i,1);
  edit(sc,id,'img',pick);edit(sc,id,'imgs',alts);
  edit(sc,id,'imgc',{x:50,y:50,z:1});
  galAfter(sc,id);render();
}
function galRm(sc,id,i){
  const doc=galDoc(sc,id);if(!doc)return;
  const alts=galAlts(doc);if(i<0||i>=alts.length)return;
  const gone=alts.splice(i,1)[0];edit(sc,id,'imgs',alts);picDrop(gone);render();
}
/* adds a new picture: becomes the main photo when there is none yet */
function galAdd(sc,id,url){
  const doc=galDoc(sc,id);if(!doc)return false;
  if(!ntImgOk(doc.img)){edit(sc,id,'img',url);edit(sc,id,'imgc',{x:50,y:50,z:1});galAfter(sc,id);return true;}
  const alts=galAlts(doc);
  if(alts.length>=GAL_MAX[sc])return false;
  alts.push(url);edit(sc,id,'imgs',alts);return true;
}
/* ----- the full picture, in front of the page ----- */
function lbxParts(k){const p=String(k||'').split('|');return {kind:p[0],id:p[1],i:Math.max(0,parseInt(p[2],10)||0)};}
function lbxSrc(k){
  const q=lbxParts(k),id=q.id;
  if(q.kind==='npc'){
    const src=ntPicOf(id),pub=S.npcPub&&S.npcPub.n&&S.npcPub.n[id];
    return src?{src,name:(pub&&pub.n)||'Trainer',i:0,n:1}:null;
  }
  if(q.kind==='gt'&&!S.me.admin)return null;
  if(q.kind==='gt'||q.kind==='t'||q.kind==='ppl'){
    const doc=galDoc(q.kind,id),list=galList(doc);
    if(!list.length)return null;
    const i=Math.min(q.i,list.length-1);
    return {src:list[i].src,name:galName(q.kind,doc),i,n:list.length,main:list[i].main};
  }
  return null;
}
function lbxRender(){
  const el=$('#lbx');
  if(!el)return;
  const v=S.ui.lbx?lbxSrc(S.ui.lbx):null;
  if(!v){
    if(S.ui.lbx)S.ui.lbx=null;
    if(!el.hidden){el.hidden=true;el.innerHTML='';document.documentElement.classList.remove('lbx-on');}
    return;
  }
  const hi=hiGet(v.src);
  const sig=S.ui.lbx+'|'+v.src.length+'|'+v.name+'|'+v.n+'|'+(hi?'h':hi===undefined?'w':'t');
  if(!el.hidden&&el.dataset.sig===sig)return;
  el.dataset.sig=sig;
  el.hidden=false;
  document.documentElement.classList.add('lbx-on');
  const nav=v.n>1;
  el.innerHTML=h`<figure class="lbx-card" role="dialog" aria-modal="true" aria-label="${'Picture of '+v.name}"><img src="${imgSrc(hi||v.src)}" alt="${'Picture of '+v.name}"><figcaption>${nav?h`<button class="btn sm" id="lbx-p" data-act="lbxn" data-dir="-1" aria-label="Previous picture">‹ Previous</button>`:''}<b>${v.name}${nav?h` <span class="lbx-c">${v.i+1} of ${v.n}${v.main?' · main':''}</span>`:''}</b>${nav?h`<button class="btn sm" id="lbx-n" data-act="lbxn" data-dir="1" aria-label="Next picture">Next ›</button>`:''}<button class="btn sm" id="lbx-x" data-act="lbxx">Close</button>${hi===undefined?h`<span class="lbx-c" role="status">Loading the sharp copy…</span>`:''}</figcaption></figure>`.s;
}
function lbxStep(dir,focusId){
  const q=lbxParts(S.ui.lbx),v=lbxSrc(S.ui.lbx);
  if(!v||v.n<2)return;
  S.ui.lbx=q.kind+'|'+q.id+'|'+((v.i+dir+v.n)%v.n);
  lbxRender();
  const b=$('#'+(focusId||'lbx-n'));if(b)b.focus({preventScroll:true});
}
function lbxOpen(k){
  if(!lbxSrc(k))return;
  S.ui.lbx=k;
  lbxRender();
  const b=$('#lbx-x');
  if(b)b.focus({preventScroll:true});
}
function lbxClose(){
  const k=S.ui.lbx;
  S.ui.lbx=null;
  lbxRender();
  if(k){const q=lbxParts(k),base=q.kind+'|'+q.id;const b=document.querySelector('[data-act="lbx"][data-k="'+CSS.escape(base)+'"]')||document.querySelector('[data-act="lbx"][data-k^="'+CSS.escape(base+'|')+'"]');if(b)b.focus({preventScroll:true});}
}
/* writes the public copy only when it has changed. Hiding the NPC removes it. */
function ntPublish(id){
  if(!S.me.admin)return;
  const nt=NTS()[id];
  const o=nt?ntPubOf(nt):null;
  const cur=(S.npcPub&&S.npcPub.n)||{};
  if(o){
    if(JSON.stringify(cur[id])!==JSON.stringify(o))edit('np','npcs','n.'+id,o);
  }else if(cur[id]){
    const n=Object.assign({},cur);delete n[id];
    edit('np','npcs','n',n);
  }
  /* foes of this NPC carry the trainer's name once it is shown, and lose it when it is hidden again */
  const fo=foesOf();
  Object.keys(fo).forEach(cid=>{if(fo[cid].nt===id&&btC(cid))foePublish(cid);});
  ntPicSync(id);
}
function ntPreview(nt){
  const p=ntPubOf(nt);
  if(!p)return 'Nothing. The table does not know this NPC exists.';
  const bits=['the name “'+p.n+'”'];
  if(p.c)bits.push('the category “'+npcCatName(p.c)+'”');
  if(p.r)bits.push('the role');
  if(p.pl)bits.push('where you met');
  if(num(nt.rev&&nt.rev.pic)&&ntImgOk(nt.img))bits.push('the picture');
  if(p.b)bits.push('your notes');
  if(p.lv!=null||p.cl)bits.push('level and class');
  if(p.st)bits.push('stats');
  if(p.it)bits.push(p.it.length+(p.it.length===1?' item':' items'));
  bits.push(p.m.length?p.m.length+(p.m.length===1?' Pokémon':' Pokémon')+' (what you ticked for each)':'no Pokémon');
  return bits.join(', ');
}

/* ----- building the roster ----- */
function ntNew(){
  if(!S.me.admin)return;
  const id=S.db.collection('gm').doc().id;
  newDoc('gt',id,{name:'',role:'',place:'',notes:'',secret:'',cls:'',adv:'',level:1,hp:{cur:20,max:20},stats:{atk:2,def:2,spa:2,spd:2,spe:2},talents:{},features:[],items:[],megaUsed:false,team:[],rev:{on:false,role:false,place:false,notes:false,pic:false,cls:false,stats:false,items:false},img:'',order:Date.now(),createdAt:Date.now()});
  S.ui.nt.open[id]=true;
  S.ui.open['edn'+id]=true;
  render();
}
/* ----- NPC packs: a JSON file of trainers with teams (format sinnoh-npc-pack). Each becomes an NPC trainer;
   one with a board and RP also joins the Gym or Contest rankings as a rival, linked to its NPC by nt.
   Pack rows: {name, role, cat, place, level, notes, secret, board:'gym'|'con', rp, label,
               team:[{sp, nick, mv:[move names], item, notes}]}. Species and moves are filled from the handbook data. */
/* the Pokémon of one team in an NPC pack, filled from the handbook data */
async function ntPackTeam(list,L,miss,cnt){
  const team=[];
  for(const m of (Array.isArray(list)?list:[])){
    const sp=String(m.sp||'').trim();
    if(!sp)continue;
    const pr=ptaResolve(sp);
    let rec=null;
    if(pr)rec=ptaRec(pr)||await ptaChunk(ptaLetter(ptaKey(pr))).then(()=>ptaRec(pr));
    const si=rec?null:speciesInfo(sp);
    if(!rec)cnt.noDex++;
    const base=foeFromRec(rec,si,sp);
    const nat=new Map((base.mv||[]).map(x=>[dexKey(x.name),x]));
    const mv=(Array.isArray(m.mv)?m.mv:[]).map(n=>{
      const k=dexKey(n),a=nat.get(k);
      if(a)return Object.assign({},a,{used:0});
      const def=L&&L.moveMap.get(k);
      if(def)return {name:def.n,freq:def.f||'At-Will',kind:def.k||'Physical',range:def.r||'',type:def.t||'Normal',dice:def.d||'',text:def.x||'',used:0};
      miss.push(sp+' ('+n+')');
      return {name:String(n),freq:'At-Will',kind:'Physical',range:'',type:'Normal',dice:'',text:'',used:0};
    });
    const mon=Object.assign({id:newMonId(),nick:String(m.nick||''),bonus:zeroStats(),notes:String(m.notes||''),item:String(m.item||''),up:'',down:'',natureName:'',sh:{name:false,pic:false,types:false,item:false}},base);
    if(mv.length)mon.mv=mv;
    mon.mega=ntMegaAuto(mon);
    team.push(mon);
  }
  return team;
}
async function ntImportPack(file){
  if(!S.me.admin||!file)return;
  let d=null;
  try{d=JSON.parse(await file.text());}catch(e){}
  if(!d||d.format!=='sinnoh-npc-pack'||!Array.isArray(d.npcs)){toast('That is not an NPC pack. Choose sinnoh-circuit-rivals.json.');return;}
  toast('Adding '+d.npcs.length+' NPC trainers…',true);
  if(PTA.idx)await ptaLists();
  const L=PTA.lists;
  const have=new Set(ntIds().map(id=>ntName(NTS()[id]).toLowerCase()));
  const add={gym:[],con:[]};
  const t0=Date.now(),miss=[];
  let made=0,skip=0;const cnt={noDex:0},grow=[];
  for(let i=0;i<d.npcs.length;i++){
    const p=d.npcs[i]||{};
    const name=String(p.name||'').trim();
    if(!name)continue;
    if(have.has(name.toLowerCase())){
      const ex=ntIds().find(x=>ntName(NTS()[x]).toLowerCase()===name.toLowerCase());
      if(ex&&Array.isArray(p.stages)&&p.stages.length&&!(Array.isArray(NTS()[ex].stages)&&NTS()[ex].stages.length)){
        const st=[];for(const g of p.stages)st.push({gain:num(g.gain),label:String(g.label||''),team:await ntPackTeam(g.team,L,miss,cnt)});
        grow.push({id:ex,st});
      }else skip++;
      continue;
    }
    have.add(name.toLowerCase());
    const team=await ntPackTeam(p.team,L,miss,cnt);
    const id=S.db.collection('gm').doc().id;
    const cat=NPC_CATS.concat(NPC_CAT_GM).some(x=>x[0]===p.cat)?p.cat:'';
    newDoc('gt',id,{name,role:String(p.role||''),cat,place:String(p.place||''),notes:String(p.notes||''),secret:String(p.secret||''),cls:'',adv:'',
      level:Math.max(1,Math.round(num(p.level))||1),hp:{cur:20,max:20},stats:{atk:2,def:2,spa:2,spd:2,spe:2},talents:{},features:[],items:[],megaUsed:false,team,
      rev:{on:false,role:false,place:false,notes:false,pic:false,cls:false,stats:false,items:false},img:'',order:t0+i,createdAt:t0+i});
    made++;
    if(Array.isArray(p.stages)&&p.stages.length){const st=[];for(const g of p.stages)st.push({gain:num(g.gain),label:String(g.label||''),team:await ntPackTeam(g.team,L,miss,cnt)});grow.push({id,st});}
    const b=p.board==='con'?'con':p.board==='gym'?'gym':'';
    if(b&&p.rp!=null&&p.rp!==''){
      const cur=(S.cond&&S.cond[RK_C[b].d])||{};
      const same=(Array.isArray(cur.npc)?cur.npc:[]).find(x=>String(x.n||'').toLowerCase()===name.toLowerCase());
      if(same&&!same.nt)edit('cd','conditions',RK_C[b].d,Object.assign({},cur,{npc:cur.npc.map(x=>x===same?Object.assign({},x,{nt:id}):x)}));
      if(!same)
        add[b].push({k:rkKey(),n:name,p:Math.round(num(p.rp)),s:RK_C[b].labels.indexOf(p.label)>=0?p.label:'',h:String(p.place||'').trim(),nt:id});
    }
  }
  ['gym','con'].forEach(b=>{
    if(!add[b].length)return;
    const dk=RK_C[b].d,cur=(S.cond&&S.cond[dk])||{};
    edit('cd','conditions',dk,Object.assign({},cur,{npc:(Array.isArray(cur.npc)?cur.npc:[]).concat(add[b])}));
  });
  const folded=rkFold('gym')+rkFold('con');
  grow.forEach(({id,st})=>ntSetStages(id,st));
  const nr=add.gym.length+add.con.length;
  toast('Added '+made+' NPC trainer'+(made===1?'':'s')+(nr?', '+nr+' of them as rivals in the rankings'+(folded?' (taking the place of '+folded+' field trainer'+(folded===1?'':'s')+')':''):'')+(grow.length?'. '+grow.length+' can grow their teams':'')+(skip?'. Skipped '+skip+' already here':'')
    +(cnt.noDex?'. '+cnt.noDex+' Pokémon were not in the handbook data, so check their numbers':'')+(miss.length?'. Fill in by hand: '+miss.slice(0,6).join(', ')+(miss.length>6?' and '+(miss.length-6)+' more':''):'')+'.',true);
  render();
}
/* NPCs made before the trainer sheet existed get its fields the first time they are opened */
function ntEnsure(id){
  const nt=NTS()[id];
  if(!nt)return;
  const d={cls:'',adv:'',level:1,hp:{cur:20,max:20},stats:{atk:2,def:2,spa:2,spd:2,spe:2},talents:{},features:[],items:[],megaUsed:false};
  Object.keys(d).forEach(k=>{if(nt[k]===undefined)edit('gt',id,k,d[k]);});
  ['cls','stats','items','pic'].forEach(k=>{if(!nt.rev||nt.rev[k]===undefined)edit('gt',id,'rev.'+k,false);});
}
/* a Pokémon whose species can Mega Evolve starts with the official details, ready to be switched on in a battle */
function ntMegaAuto(mon){
  const si=speciesInfo(mon.sp);
  const list=si&&!si.form?MEGAS.filter(x=>x.b===si.id):[];
  return list.length?megaPreset(pickMega(mon,list),si):null;
}
/* the Key Stone charge comes back when the battle ends */
function ntEndBattle(){
  if(!S.me.admin)return 0;
  let n=0;
  ntIds().forEach(id=>{if(NTS()[id].megaUsed){edit('gt',id,'megaUsed',false);n++;}});
  return n;
}
/* a d20 check for an NPC, rolled by the GM and logged under the GM's name unless "Roll in secret" is on */
function ntRoll(label,bonus,tal){
  const r1=rollOnce();
  let pick=r1,note='';
  if(S.ui.adv!=='normal'){
    const r2=rollOnce();
    const better=S.ui.adv==='adv';
    pick=(better?r2.base>r1.base:r2.base<r1.base)?r2:r1;
    note=' ('+(better?'advantage':'disadvantage')+': '+r1.base+' / '+r2.base+')';
  }
  const e=chkEntry(label,pick.base+bonus+tal,'d20 '+pick.txt+' = '+pick.base+' + mod '+bonus+(tal?' + talent '+tal:'')+note);
  e.gm=true;
  logRoll(e);
  renderRoll();
}
async function ntAddMon(id){
  if(!S.me.admin||!NTS()[id])return;
  const u=S.ui.nt;
  const sp=String(u['sp_'+id]||'').trim(),nick=String(u['nk_'+id]||'').trim();
  if(!sp){toast('Type a species first.');return;}
  u['sp_'+id]='';u['nk_'+id]='';
  const pr=ptaResolve(sp);
  let rec=null;
  if(pr)rec=ptaRec(pr)||await ptaChunk(ptaLetter(ptaKey(pr))).then(()=>ptaRec(pr));
  const si=rec?null:speciesInfo(sp);
  const nt=NTS()[id];
  if(!nt)return;
  const mid=newMonId();
  const mon=Object.assign({id:mid,nick,bonus:zeroStats(),notes:'',item:'',up:'',down:'',natureName:'',sh:{name:false,pic:false,types:false,item:false}},foeFromRec(rec,si,sp));
  mon.mega=ntMegaAuto(mon);
  edit('gt',id,'team',ntTeam(nt).concat([mon]));
  u.mon={};u.mon[mid]=true;
  toast('Gave '+sp+' to '+ntName(nt)+(rec||si?'':'. That species is not in the data, so fill in its numbers by hand')+(mon.mega?'. Mega Evolution details added ('+mon.mega.form+')':'')+'.',true);
  render();
}
/* replaces a Pokémon's types, stats, passives and moves with the handbook entry for its species */
async function ntFillMon(id,mid){
  if(!S.me.admin)return;
  const nt=NTS()[id];
  const i=ntTeam(nt).findIndex(x=>x.id===mid);
  if(i<0)return;
  const sp=ntConfSp(nt,i);
  const pr=ptaResolve(sp);
  let rec=null;
  if(pr)rec=ptaRec(pr)||await ptaChunk(ptaLetter(ptaKey(pr))).then(()=>ptaRec(pr));
  const si=rec?null:speciesInfo(sp);
  if(!rec&&!si){toast('That species is not in the data.');return;}
  const cur=NTS()[id];
  const j=ntTeam(cur).findIndex(x=>x.id===mid);
  if(j<0)return;
  const m=ntTeam(cur)[j];
  const next=Object.assign({},m,foeFromRec(rec,si,sp),{bonus:zeroStats()});
  /* Mega details you changed by hand are kept; the official ones follow the species */
  next.mega=m.mega&&!m.mega.auto?m.mega:ntMegaAuto(next);
  edit('gt',id,'team.'+j,next);
  toast('Filled in '+(rec?rec.n:si.name)+' from the '+(rec?'handbook':'game data')+'.',true);
  render();
}
const ntConfSp=(nt,i)=>String((ntTeam(nt)[i]||{}).sp||'');

/* typing a move's name in a roster Pokémon's sheet fills in the rest of the row from the handbook, when the row is still empty */
const NT_MV_RE=/^gt\|([^|]+)\|team\.(\d+)\.mv\.(\d+)\.name$/;
function ntRowFill(t){
  const mt=NT_MV_RE.exec(t.dataset.b||'');
  if(!mt)return false;
  const id=mt[1],i=+mt[2],k=+mt[3];
  const go=()=>{
    const m=ntTeam(NTS()[id])[i];
    const row=m&&(m.mv||[])[k];
    const L=PTA.lists;
    if(!row||!L)return;
    const def=L.moveMap.get(dexKey(row.name));
    if(!def)return;
    if(String(row.text||'').trim()||String(row.dice||'').trim())return;
    const next=Object.assign({},row,{name:def.n,freq:def.f||row.freq,kind:def.k||row.kind,range:def.r||row.range,type:def.t||row.type,dice:def.d||'',text:def.x||''});
    edit('gt',id,'team.'+i+'.mv',m.mv.map((x,j)=>j===k?next:x));
    toast('Filled in '+def.n+' from the handbook.',true);
    renderSoon();
  };
  if(PTA.lists)go();else ptaLists().then(go);
  return true;
}

/* ----- into a battle ----- */
function ntFoeFrom(id,nt,m){
  const hp=m.hp||{cur:20,max:20};
  const mx=Math.max(1,num(hp.max));
  return Object.assign({nick:m.nick||'',sp:m.sp||'',ty:[(m.ty||[])[0]||'',(m.ty||[])[1]||''],sz:m.sz||'Medium',wt:m.wt||'Medium',
    hp:{cur:clamp(num(hp.cur)>0?num(hp.cur):mx,1,mx),max:mx},
    base:Object.assign({atk:3,def:3,spa:3,spd:3,spe:3},m.base),bonus:Object.assign(zeroStats(),m.bonus),stages:zeroStats(),st:'',
    notes:m.notes||'',sk:m.sk||'',ps:(m.ps||[]).map(x=>Object.assign({},x)),mv:(m.mv||[]).map(x=>Object.assign({},x,{used:0})),
    item:m.item||'',up:m.up||'',down:m.down||'',natureName:m.natureName||'',gender:m.gender||'',die:m.die||'',shiny:m.shiny===true,
    mega:m.mega?JSON.parse(JSON.stringify(m.mega)):null,megaOn:false,
    sh:{name:num(m.sh&&m.sh.name),pic:num(m.sh&&m.sh.pic),types:num(m.sh&&m.sh.types),st:0,hp:0,item:num(m.sh&&m.sh.item),mega:0},
    pn:foeLetter(),nt:id,ni:m.id,own:ntName(nt)},m.hpx?{hpx:num(m.hpx)}:{});
}
function ntToBattle(id,mid,quiet){
  if(!S.me.admin)return;
  const nt=NTS()[id];
  const m=nt&&ntTeam(nt).find(x=>x.id===mid);
  if(!m||ntInBattle(id,mid))return;
  const b=BT();
  const cid=newCid();
  const f=ntFoeFrom(id,nt,m);
  edit('gb','battle','foes.'+cid,f);
  btInsert(cid,{s:'f',pub:foePub(f)},fSpd(f)+(b.mode==='d20'?rnd(20):0),rnd(20));
  if(!quiet)render();
}
function ntTeamToBattle(id){
  if(!S.me.admin)return;
  const nt=NTS()[id];
  const left=ntTeam(nt).filter(m=>!ntInBattle(id,m.id));
  left.forEach(m=>ntToBattle(id,m.id,true));
  if(left.length)toast(left.length+(left.length===1?' Pokémon':' Pokémon')+' from '+ntName(nt)+' added to the battle, hidden from the players until you show them.',true);
  render();
}
function ntDelete(id){
  if(!S.me.admin||!NTS()[id])return;
  const nt=NTS()[id];
  const cur=(S.npcPub&&S.npcPub.n)||{};
  if(cur[id]){const n=Object.assign({},cur);delete n[id];edit('np','npcs','n',n);}
  /* foes already in a battle stay, but lose the link and the trainer's name */
  const fo=foesOf();
  Object.keys(fo).forEach(cid=>{if(fo[cid].nt===id){edit('gb','battle','foes.'+cid+'.nt','');edit('gb','battle','foes.'+cid+'.ni','');foePublish(cid);}});
  /* rivals stay on the rankings under their last name, without the link */
  NT_BOARDS.forEach(([b])=>{const dk=RK_C[b].d,dd=(S.cond&&S.cond[dk])||{},list=Array.isArray(dd.npc)?dd.npc:[];if(list.some(r=>r.nt===id))edit('cd','conditions',dk,Object.assign({},dd,{npc:list.map(r=>{if(r.nt!==id)return r;const o=Object.assign({},r);delete o.nt;return o;})}));});
  delete S.ui.nt.open[id];
  removeDoc('gt',id);
  ntPicSync(id);
  toast(ntName(nt)+' was deleted.',true);
}
function ntTwice(key,fn){
  if(S.ui.confirm===key){S.ui.confirm=null;fn();return;}
  S.ui.confirm=key;render();
  setTimeout(()=>{if(S.ui.confirm===key){S.ui.confirm=null;render();}},4000);
}

/* ----- the GM's page ----- */
function ntMegaPanel(id,nt,m,i){
  const checks=[megaHold(m.item,m.mv,m.mega),{ok:hasKey(nt),label:ntName(nt)+' carries a Key Stone'}];
  return megaRunPanel({kind:'nt',sc:'gt',id,P:'team.'+i+'.',doc:nt,mon:m,attrs:h`data-id="${id}" data-mid="${m.id}"`,checks,chip:keyChip(nt),ekey:'mgn'+m.id});
}
function ntMonBody(id,nt,m,i,len){
  const P='team.'+i+'.';
  const s=m.sh||{};
  const mvs=m.mv||[],ps=m.ps||[];
  const ask=S.ui.confirm==='ntf|'+m.id,askRm=S.ui.confirm==='ntr|'+m.id;
  return h`<div class="bbody fsheet">
    <div class="mgate secret"><span class="fl">GM only · what the players see of this Pokémon (once the NPC is shown, or in a battle)</span>
      <div class="row evchips" role="group" aria-label="Show players">
        ${[['name','Name'],['pic','Picture'],['types','Types'],['item','Held item']].map(([k,l])=>h`<label class="chip chkc"><input type="checkbox" ${bd('gt',id,P+'sh.'+k)} ${num(s[k])?raw('checked'):''}><span>${l}</span></label>`)}
        <button class="btn sm" data-act="nt_see" data-id="${id}" data-mid="${m.id}" data-v="all">Show all</button><button class="btn sm ghost" data-act="nt_see" data-id="${id}" data-mid="${m.id}" data-v="none">Hide all</button></div>
      <p class="sub">${ntShown(m)?'Hidden from the players until the NPC is shown.':'Nothing shown.'} The rest of this sheet, its moves and your notes never reach their phones.</p></div>
    <div class="fgrid">
      ${fText('Name','gt',id,P+'nick',nt,{})}
      ${fText('Species','gt',id,P+'sp',nt,{list:'dl-species'})}
      ${fSel('Type 1','gt',id,P+'ty.0',nt,TYPES,{blank:'None'})}
      ${fSel('Type 2','gt',id,P+'ty.1',nt,TYPES,{blank:'None'})}
      ${fNum('HP now','gt',id,P+'hp.cur',nt,{min:0})}
      ${fNum('HP max','gt',id,P+'hp.max',nt,{min:1})}
      ${fSel('Size','gt',id,P+'sz',nt,SIZES,{})}
      ${fSel('Weight','gt',id,P+'wt',nt,WEIGHTS,{})}
      ${fText('Held item','gt',id,P+'item',nt,{list:'dl-items'})}
      ${fSel('Gender','gt',id,P+'gender',nt,GENDERS,{blank:'Not set'})}
      <div class="fld shn"><span class="fl">Colour</span>${fCheck('Shiny ✦','gt',id,P+'shiny',nt,false)}</div>
      ${fText('Nature','gt',id,P+'natureName',nt,{})}
      ${fSel('Nature raises','gt',id,P+'up',nt,STAT_OPTS,{blank:'None'})}
      ${fSel('Nature lowers','gt',id,P+'down',nt,STAT_OPTS,{blank:'None'})}
      ${fText('Skills','gt',id,P+'sk',nt,{cls:'wide',ph:'Short list, separated by commas'})}
    </div>
    <div class="stats">${STATS.map(st=>h`<div class="stat lcd"><span class="sl">${st[2]}</span><span class="sv">${fStat(m,st[0])}</span><span class="sm"><span>mod ${sgn(mod(fStat(m,st[0])))}</span></span>
      <div class="mini"><label>Base<input type="number" ${bd('gt',id,P+'base.'+st[0])} value="${num(m.base&&m.base[st[0]])}"></label><label>Adj<input type="number" ${bd('gt',id,P+'bonus.'+st[0])} value="${num(m.bonus&&m.bonus[st[0]])}"></label></div></div>`)}</div>
    ${ntMegaPanel(id,nt,m,i)}
    <div class="list"><div class="ph"><h3>Moves</h3><button class="btn sm" data-act="add" ${bp('gt',id,P+'mv')} data-tpl="move">Add move</button></div>
      ${mvs.length?mvs.map((x,k)=>h`<div class="move"><div class="mv1">${fText('Move','gt',id,P+'mv.'+k+'.name',nt,{list:'dl-moves'})}${fText('Uses','gt',id,P+'mv.'+k+'.freq',nt,{})}<span></span>${rowBtns('gt',id,P+'mv',k,mvs.length,false)}</div>
        <div class="mv2">${fSel('Kind','gt',id,P+'mv.'+k+'.kind',nt,KINDS,{})}${fSel('Type','gt',id,P+'mv.'+k+'.type',nt,TYPES,{})}${fText('Range','gt',id,P+'mv.'+k+'.range',nt,{})}${fText('Damage','gt',id,P+'mv.'+k+'.dice',nt,{ph:'e.g. 3d8'})}</div>
        ${fArea('Effect','gt',id,P+'mv.'+k+'.text',nt,{rows:2})}</div>`):h`<p class="sub">No moves yet. Add one, or type a move name to fill it in from the handbook.</p>`}
    </div>
    <div class="list"><div class="ph"><h3>Passives</h3><button class="btn sm" data-act="add" ${bp('gt',id,P+'ps')} data-tpl="passive">Add passive</button></div>
      ${ps.length?ps.map((x,k)=>h`<div class="item"><div class="irow two">${fText('Passive','gt',id,P+'ps.'+k+'.name',nt,{list:'dl-passives'})}${rowBtns('gt',id,P+'ps',k,ps.length,false)}</div>${fArea('What it does','gt',id,P+'ps.'+k+'.text',nt,{rows:2})}</div>`):h`<p class="sub">No passives.</p>`}
    </div>
    ${fArea('Notes about this Pokémon (only you see these)','gt',id,P+'notes',nt,{rows:2})}
    <div class="row">
      <button class="btn sm ${ask?'danger armed':''}" data-act="nt_fill" data-id="${id}" data-mid="${m.id}">${ask?'Tap again to replace its stats, passives and moves':'Fill from the handbook'}</button>
      <button class="btn sm danger ${askRm?'armed':''}" data-act="nt_monrm" data-id="${id}" data-mid="${m.id}">${askRm?'Tap again to remove it':'Remove Pokémon'}</button>
      <span class="ibtns"><button class="btn sm ghost" data-act="mv" ${bp('gt',id,'team')} data-i="${i}" data-d="-1" ${i===0?raw('disabled'):''} aria-label="Move earlier">↑</button><button class="btn sm ghost" data-act="mv" ${bp('gt',id,'team')} data-i="${i}" data-d="1" ${i===len-1?raw('disabled'):''} aria-label="Move later">↓</button></span></div>
  </div>`;
}
function ntMonRow(id,nt,m,i,len){
  const open=!!S.ui.nt.mon[m.id];
  const inB=ntInBattle(id,m.id);
  return h`<div class="ntmon" data-mid="${m.id}">
    <div class="row sp"><span class="row ntmh">${monIcon({species:m.sp})}<b>${ntMonName(m)}</b>${m.nick&&m.sp?h`<span class="sub">${m.sp}</span>`:''}${chipsOf(m.ty)}${m.item?h`<span class="pill">${itemMini(m.item)}${m.item}</span>`:''}${m.mega&&megaHold(m.item,m.mv,m.mega).ok&&hasKey(nt)?h`<span class="pill mega">Mega-ready</span>`:''}${ntShown(m)?h`<span class="pill good">Some shown</span>`:h`<span class="pill">Hidden</span>`}${inB?h`<span class="pill gm">In battle</span>`:''}</span>
      <span class="row"><button class="btn sm" data-act="nt_foe" data-id="${id}" data-mid="${m.id}" ${inB?raw('disabled'):''}>Add to battle</button><button class="btn sm" data-act="nt_mon" data-mid="${m.id}" aria-expanded="${String(open)}">${open?'Close':'Edit'}</button></span></div>
    ${open?ntMonBody(id,nt,m,i,len):''}
  </div>`;
}
function ntSheet(id,nt,ed){
  const st=nt.stats||{},tal=nt.talents||{},it=nt.items||[],fs=nt.features||[];
  const more=!!S.ui.nt.more[id];
  const who=ntName(nt);
  return h`<div class="ntsheet">
    <div class="ph"><h3>Trainer sheet</h3><span class="sub">Level, class, stats and bag. The table sees them only if you tick them${ed?' above':' in Edit details'}.</span></div>
    ${!ed?'':h`<div class="fgrid">
      ${fNum('Level','gt',id,'level',nt,{min:1,max:20})}
      ${fSel('Class','gt',id,'cls',nt,Object.keys(CLASSES),{blank:'Not chosen'})}
      ${fSel('Advanced class','gt',id,'adv',nt,CLASSES[nt.cls]||[],{blank:'None yet'})}
    </div>`}
    <div class="stats">${hpTile('gt',id,nt.hp,false)}${STATS.map(([k,full,ab])=>h`<div class="stat lcd"><span class="sl">${ab}</span>
      <input type="number" inputmode="numeric" aria-label="${full}" ${bd('gt',id,'stats.'+k)} value="${st[k]}" data-min="1" data-max="10">
      <span class="sm"><span>mod ${sgn(mod(st[k]))}</span><button class="rollbtn" data-act="nt_roll" data-label="${who}: ${full} check" data-bonus="${mod(st[k])}" data-tal="0">d20</button></span></div>`)}</div>
    <div class="row"><label class="row"><input type="checkbox" data-act="b_secret" ${S.ui.secret?raw('checked'):''}><span>Roll in secret (not shared)</span></label>
      <button class="btn sm ghost" data-act="nt_more" data-id="${id}" aria-expanded="${String(more)}">${more?'Hide skills and features':'Skills and features'}</button></div>
    ${more?h`<div class="ntmore">
      ${STAT_KEYS.map(k=>{
        const m=mod(st[k]);
        return h`<div class="sgroup"><h3><span>${STAT_NAME[k]} skills</span><span class="mono">${sgn(m)}</span></h3>
          ${SKILLS.filter(x=>x[2]===k).map(([key,name])=>{
            const lv=clamp(num(tal[key]),0,2),tb=[0,2,5][lv];
            return h`<div class="skill"><span class="sname">${name}</span>
              <button class="tal t${lv}" data-act="nt_tal" data-id="${id}" data-key="${key}" title="Talent: none, +2, or +5 when taken twice">${['—','+2','+5'][lv]}</button>
              <span class="bonus">${sgn(m+tb)}</span>
              <button class="btn sm" data-act="nt_roll" data-label="${who}: ${name}" data-bonus="${m}" data-tal="${tb}">Roll</button></div>`;})}</div>`;})}
      <div class="list"><div class="ph"><h3>Features</h3>${ed?h`<button class="btn sm" data-act="add" ${bp('gt',id,'features')} data-tpl="feature">Add feature</button>`:''}</div>
        ${!ed?(featRead(fs)||h`<p class="sub">No features written yet.</p>`):fs.length?fs.map((x,i)=>h`<div class="item"><div class="irow two">${fText('Name','gt',id,'features.'+i+'.name',nt,{})}${rowBtns('gt',id,'features',i,fs.length,false)}</div>${fArea('What it does','gt',id,'features.'+i+'.text',nt,{rows:2})}</div>`):h`<p class="sub">Class features, in your own words. Only you see these.</p>`}</div>
    </div>`:''}
    <div class="list"><div class="ph"><h3>Inventory</h3>${ed?h`<button class="btn sm" data-act="add" ${bp('gt',id,'items')} data-tpl="item">Add item</button>`:''}</div>
      ${!ed&&it.length?itemsRead('gt',id,nt,it,false,(x,i)=>isKeyName(x.name)?h`<div class="kline">${keyChip(nt)}<span class="sub">Lets ${who}'s Pokémon Mega Evolve, once per battle.</span>${nt.megaUsed?h`<button class="btn sm" data-act="nt_recharge" data-id="${id}">Recharge it</button>`:''}</div>`:''):it.length?it.map((x,i)=>h`<div class="item"><div class="irow ic">${itemTile(x.name)}${fText('Item','gt',id,'items.'+i+'.name',nt,{list:'dl-items'})}${fNum('Qty','gt',id,'items.'+i+'.qty',nt,{min:0})}${rowBtns('gt',id,'items',i,it.length,false)}</div>${fText('Note (only you see this)','gt',id,'items.'+i+'.note',nt,{})}${isKeyName(x.name)?h`<div class="kline">${keyChip(nt)}<span class="sub">Lets ${who}'s Pokémon Mega Evolve, once per battle.</span>${nt.megaUsed?h`<button class="btn sm" data-act="nt_recharge" data-id="${id}">Recharge it</button>`:''}</div>`:''}</div>`):h`<p class="sub">Nothing in the bag. A Key Stone here lets this NPC's Pokémon Mega Evolve.</p>`}
    </div>
  </div>`;
}
/* ----- NPC trainers on the rankings: a rival with nt = this NPC's id. The NPC is the source of truth for the name and
   hometown, so renaming an NPC renames its rival on both boards (the rankings are public, the NPC is not, so the
   name is copied over rather than read live). ----- */
const NT_BOARDS=[['gym','Gym circuit'],['con','Contest circuit']];
function ntRanks(id){
  const out=[];
  NT_BOARDS.forEach(([b,l])=>{
    const dd=(S.cond&&S.cond[RK_C[b].d])||{};
    (Array.isArray(dd.npc)?dd.npc:[]).forEach(r=>{if(r.nt===id)out.push({b,l,r});});
  });
  return out;
}
const ntSyncT={};
function ntSyncRank(id){
  clearTimeout(ntSyncT[id]);
  ntSyncT[id]=setTimeout(()=>{
    const nt=NTS()[id];if(!nt||!S.me.admin)return;
    const n=String(nt.name||'').trim(),h=String(nt.place||'').trim();
    NT_BOARDS.forEach(([b])=>{
      const dk=RK_C[b].d,dd=(S.cond&&S.cond[dk])||{},list=Array.isArray(dd.npc)?dd.npc:[];
      let ch=false;
      const next=list.map(r=>{if(r.nt!==id)return r;const o=Object.assign({},r);if(n&&o.n!==n){o.n=n;ch=true;}if(o.h!==h){o.h=h;ch=true;}return o;});
      if(ch)edit('cd','conditions',dk,Object.assign({},dd,{npc:next}));
    });
  },700);
}
/* where this NPC stands: place, points and label on each board it is on */
function ntRankInfo(b,r){
  return rkWith(b,()=>{const row=rkRows().find(x=>x.id==='n_'+r.k);return row?{pos:row.pos,pts:Math.round(row.pts),bd:row.bd}:null;});
}
/* ----- team growth: an NPC keeps several versions of their team, each for a badge count. The starting team is the first.
   When the GM runs a week on the Gym rankings, an NPC whose rival has reached the next mark switches to that team.
   nt.stages [{id, bd, label, team}]   nt.grown = the stage in use   nt.bd0 = badges when the stages were set ----- */
const ntStages=nt=>(nt&&Array.isArray(nt.stages)?nt.stages:[]).slice().sort((a,b)=>num(a.bd)-num(b.bd));
const ntStageId=()=>'s'+Date.now().toString(36)+Math.random().toString(36).slice(2,5);
/* the badges this NPC's rival holds on the Gym rankings, or null when it is not on that board */
function ntBadges(id){
  const L=ntRanks(id).find(x=>x.b==='gym');
  if(!L)return null;
  const x=ntRankInfo('gym',L.r);
  return x?x.bd:null;
}
const ntCopyTeam=team=>(team||[]).map(m=>Object.assign(JSON.parse(JSON.stringify(m)),{id:newMonId()}));
/* stages from a pack: gain = badges past where the rival stands now */
function ntSetStages(id,list){
  const nt=NTS()[id];if(!nt)return;
  const b0=ntBadges(id)||0;
  const st=[{id:ntStageId(),bd:b0,label:'Starting team',team:ntCopyTeam(ntTeam(nt))}];
  list.forEach((g,i)=>st.push({id:ntStageId()+i,bd:b0+Math.max(1,num(g.gain)),label:g.label||'',team:g.team}));
  edit('gt',id,'stages',st);edit('gt',id,'grown',st[0].id);edit('gt',id,'bd0',b0);
}
function ntStageLoad(id,sid,quiet){
  const nt=NTS()[id],st=ntStages(nt).find(x=>x.id===sid);
  if(!nt||!st)return false;
  if(ntTeam(nt).some(m=>ntInBattle(id,m.id))){if(!quiet)toast('Part of this team is in a battle. End the battle first.');return false;}
  edit('gt',id,'team',ntCopyTeam(st.team));edit('gt',id,'grown',sid);
  return true;
}
/* after a week: every NPC whose rival has passed the next mark moves up (never down) */
function ntGrowAll(why,wk){
  const out=[];
  ntIds().forEach(id=>{
    const nt=NTS()[id],st=ntStages(nt);
    if(st.length<2)return;
    const bd=ntBadges(id);if(bd==null)return;
    const cur=st.find(x=>x.id===nt.grown)||st[0];
    const next=st.filter(x=>num(x.bd)<=bd&&num(x.bd)>num(cur.bd)).pop();
    if(next&&ntStageLoad(id,next.id,true)){
      edit('gt',id,'glog',(Array.isArray(nt.glog)?nt.glog:[]).concat([{why:why||'week',wk:num(wk),from:cur.id,to:next.id}]).slice(-20));
      out.push(ntName(nt));
    }
  });
  return out;
}
/* undoing a week puts back the teams that grew in the weeks being undone (growth from a player's badge stays) */
function ntUngrow(w){
  const out=[];
  ntIds().forEach(id=>{
    const nt=NTS()[id],g=Array.isArray(nt.glog)?nt.glog:[];
    const undo=g.filter(x=>x.why==='week'&&num(x.wk)>w);
    if(!undo.length)return;
    if(ntStageLoad(id,undo[0].from,true)){edit('gt',id,'glog',g.filter(x=>!(x.why==='week'&&num(x.wk)>w)));out.push(ntName(nt));}
  });
  return out;
}
/* a player's badges changed: rivals paced to the players may have reached their next team */
let ntBadgeT=0;
function ntBadgeChanged(){
  clearTimeout(ntBadgeT);
  ntBadgeT=setTimeout(()=>{
    if(!S.me.admin)return;
    const W=num(((S.cond&&S.cond[RK_C.gym.b])||{}).wk);
    const gr=rkWith('gym',()=>ntGrowAll('badge',W));
    if(gr.length){toast('New badge, new rival teams: '+gr.join(', ')+'.',true);render();}
  },800);
}
function ntGrowPanel(id,nt){
  const st=ntStages(nt),bd=ntBadges(id),u=S.ui.nt;
  const cur=st.find(x=>x.id===nt.grown);
  return h`<div class="mgate"><span class="fl">Team growth</span>
    <p class="sub">${bd!=null?h`On the Gym rankings with <b>${bd} badge${bd===1?'':'s'}</b>. `:'Not on the Gym rankings, so teams change only when you load them. '}Each saved team has a badge mark. When you run a week on the rankings and this rival has reached the next mark, the team below replaces the current one. Damage, nicknames and changes to the current team are not kept, so save it first if you want them.</p>
    ${st.length?h`<ul class="mini-list">${st.map(x=>h`<li><div class="row sp"><span><b>${num(x.bd)} badge${num(x.bd)===1?'':'s'}</b>${x.label?h` <span class="sub">${x.label}</span>`:''} ${cur&&cur.id===x.id?h`<span class="pill good">In use</span>`:''}<br><span class="sub">${(x.team||[]).map(m=>m.nick||m.sp).join(', ')||'No Pokémon'}</span></span>
      <span class="row"><button class="btn sm" data-act="nt_stload" data-id="${id}" data-sid="${x.id}">Load now</button><button class="btn sm ghost" data-act="nt_stsave" data-id="${id}" data-sid="${x.id}" title="Replace this saved team with the current team">Overwrite</button><button class="btn sm ghost" data-act="nt_strm" data-id="${id}" data-sid="${x.id}">Remove</button></span></div></li>`)}</ul>`:''}
    <div class="row"><label class="fld inl"><span class="fl">At badges</span><input type="number" min="0" max="8" data-u="nt.stb_${id}" data-nr value="${u['stb_'+id]==null?'':u['stb_'+id]}" placeholder="${bd!=null?bd:0}"></label><button class="btn sm" data-act="nt_stnew" data-id="${id}">Save the current team at that mark</button></div>
  </div>`;
}
function ntGrowAct(d){
  const nt=NTS()[d.id];if(!nt)return;
  const st=ntStages(nt);
  if(d.act==='nt_stload'){if(ntStageLoad(d.id,d.sid))toast(ntName(nt)+' now uses that team.',true);render();return;}
  if(d.act==='nt_stsave'){edit('gt',d.id,'stages',st.map(x=>x.id===d.sid?Object.assign({},x,{team:ntCopyTeam(ntTeam(nt))}):x));toast('Saved the current team over it.',true);render();return;}
  if(d.act==='nt_strm'){edit('gt',d.id,'stages',st.filter(x=>x.id!==d.sid));render();return;}
  if(d.act==='nt_stnew'){
    const raw=S.ui.nt['stb_'+d.id],bd=clamp(Math.round(num(raw===''||raw==null?(ntBadges(d.id)||0):raw)),0,8);
    const sid=ntStageId();
    edit('gt',d.id,'stages',st.filter(x=>num(x.bd)!==bd).concat([{id:sid,bd,label:'',team:ntCopyTeam(ntTeam(nt))}]));
    if(!nt.grown||!st.some(x=>x.id===nt.grown))edit('gt',d.id,'grown',sid);
    S.ui.nt['stb_'+d.id]='';
    toast('Saved the current team at '+bd+' badge'+(bd===1?'':'s')+'.',true);render();
  }
}
/* ----- scouting: a Pokémon an NPC shows in a battle goes on their rival's Known team, and the party has now met them ----- */
function ntScout(ntId,sp){
  sp=String(sp||'').trim();
  if(!ntId||!sp||!S.me.admin)return;
  ntRanks(ntId).forEach(({b,r})=>{
    const C=RK_C[b],dd=(S.cond&&S.cond[C.d])||{},bb=(S.cond&&S.cond[C.b])||{},id='n_'+r.k;
    const cards=Object.assign({},dd.card||{}),c=Object.assign({},cards[id]||{});
    const list=String(c.team||'').split(',').map(x=>x.trim()).filter(x=>x&&x!=='???');
    const W=num(bb.wk);
    let ch=false;
    if(!list.some(x=>x.toLowerCase()===sp.toLowerCase())){list.push(sp);c.team=list.join(', ');ch=true;}
    const seen='Battle, week '+W;
    if(!c.seen){c.seen=seen;ch=true;}
    if(ch){cards[id]=c;edit('cd','conditions',C.d,Object.assign({},dd,{card:cards}));}
    if(!(bb.met||{})[id])edit('cd','conditions',C.b,Object.assign({},bb,{met:Object.assign({},bb.met||{},{[id]:true})}));
  });
}
function ntPaceRow(id,r){
  const pcs=entriesOf(S.trainers).filter(t=>t.name);
  const sel=(f,opts,v)=>h`<select data-ntpace="${r.k}" data-f="${f}">${opts.map(([k,l])=>h`<option value="${k}" ${String(k)===String(v)?raw('selected'):''}>${l}</option>`)}</select>`;
  const pw=r.pw&&(r.pw==='party'||S.trainers[r.pw])?r.pw:'';
  const bd=rkPaceBd(r);
  return h`<div class="row ntpace">
    <label class="fld inl"><span class="fl">Grows with</span>${sel('pw',[['','Their own season'],['party','The party (average badges)']].concat(pcs.map(t=>[t.id,tName(t)])),pw)}</label>
    ${pw?h`<label class="fld inl"><span class="fl">Pace</span>${sel('po',[[1,'One badge ahead'],[0,'Even'],[-1,'One badge behind']],clamp(Math.round(num(r.po)),-1,1))}</label>`:''}
    ${pw&&pw!=='party'?h`<label class="fld inl"><span class="fl">Points</span>${sel('pt',[[0,'Their own'],[1,'Stay just above '+tName(S.trainers[pw])],[-1,'Stay just below '+tName(S.trainers[pw])]],num(r.pt))}</label>`:''}
    ${pw&&bd!=null?h`<span class="sub">Shows ${bd} badge${bd===1?'':'s'} on the board.</span>`:''}
  </div>`;
}
function ntRankPanel(id,nt){
  const L=ntRanks(id),on=new Set(L.map(x=>x.b)),u=S.ui.nt;
  return h`<div class="mgate"><span class="fl">Rankings</span>
    ${L.length?h`<ul class="mini-list">${L.map(({b,l,r})=>{const x=ntRankInfo(b,r),C=RK_C[b];return h`<li><div class="row sp"><span><b>${l}</b> ${x?h`<span class="pill">#${x.pos}</span> <span class="mono">${x.pts} ${C.unit}</span>${b==='gym'?h` <span class="sub">${x.bd} badge${x.bd===1?'':'s'}</span>`:''}`:''}
        <label class="fld inl"><span class="fl">${C.labWord}</span><select data-ntlab="${id}" data-b="${b}" data-k="${r.k}"><option value="">None yet</option>${C.labels.map(v=>h`<option ${v===r.s?raw('selected'):''}>${v}</option>`)}</select></label></span>
        ${b==='gym'?ntPaceRow(id,r):''}
        <span class="row"><button class="btn sm" data-act="nt_rkgo" data-b="${b}" data-k="${r.k}">Open in rankings</button><button class="btn sm ghost" data-act="nt_rkrm" data-b="${b}" data-k="${r.k}">Take off the board</button></span></div></li>`;})}</ul>
      <p class="sub">The name and hometown follow this sheet: rename the NPC and the rankings change with it.</p>`:h`<p class="sub">Not on the rankings. Add them and they battle (or enter contests) every week with the field.</p>`}
    ${NT_BOARDS.filter(([b])=>!on.has(b)).map(([b,l])=>h`<div class="row"><label class="fld inl"><span class="fl">Starting ${RK_C[b].unit}</span><input type="number" min="0" max="450" data-u="nt.rp_${b}_${id}" data-nr value="${u['rp_'+b+'_'+id]==null?'':u['rp_'+b+'_'+id]}" placeholder="0"></label><button class="btn sm" data-act="nt_rkadd" data-id="${id}" data-b="${b}">Add to the ${l}</button></div>`)}
  </div>`;
}
function ntRankAct(d){
  const u=S.ui.nt;
  if(d.act==='nt_rkgo'){rkGoto(d.b,'n_'+d.k);return;}
  if(d.act==='nt_rkrm'){
    const key='ntrk|'+d.b+'|'+d.k;
    if(S.ui.confirm!==key){S.ui.confirm=key;toast('Press Take off the board again. Their results on that board are removed too; the NPC stays.');render();return;}
    S.ui.confirm='';
    rkWith(d.b,()=>{rkSave({npc:rkNpcs().filter(x=>x.k!==d.k),log:rkLog().filter(e=>e.u!=='n_'+d.k)});});
    toast('Taken off the '+(d.b==='con'?'Contest':'Gym')+' rankings.',true);render();return;
  }
  if(d.act==='nt_rkadd'){
    const nt=NTS()[d.id];if(!nt)return;
    const b=d.b==='con'?'con':'gym',p=Math.max(0,Math.round(num(u['rp_'+b+'_'+d.id])));
    rkWith(b,()=>{
      const ex=rkNpcs().find(x=>!x.nt&&String(x.n||'').toLowerCase()===ntName(nt).toLowerCase());
      if(ex)rkSave({npc:rkNpcs().map(x=>x===ex?Object.assign({},x,{nt:d.id}):x)});
      else rkSave({npc:rkNpcs().concat([{k:rkKey(),n:ntName(nt),p,s:'',h:String(nt.place||'').trim(),nt:d.id}])});
    });
    const f=rkFold(b);
    u['rp_'+b+'_'+d.id]='';
    toast(ntName(nt)+' is on the '+(b==='con'?'Contest':'Gym')+' rankings'+(f?', in place of a field trainer':'')+'.',true);render();
  }
}
function ntBody(id,nt){
  const r=nt.rev||{};
  const on=!!num(r.on);
  const team=ntTeam(nt);
  const left=team.filter(m=>!ntInBattle(id,m.id)).length;
  const askDel=S.ui.confirm==='ntd|'+id;
  const ek='n'+id,ed=isEd(ek);
  return h`<div class="ntbody ${ed?'':'rd'}">
    ${ed?edBar(ek,'Editing '+ntName(nt)):h`<div class="rdtop foe"><div class="rdtx">${rdFacts([['Role or title',nt.role],['Where you met',nt.place],['Category',ntCat(nt)?npcCatName(ntCat(nt)):''],['Level and class',['Level '+(num(nt.level)||1),nt.cls,nt.adv].filter(Boolean).join(' · ')]])}</div>${edBtn(ek)}</div>
    <div class="mgate secret rdsee"><span class="fl">GM only · what the players see</span><p class="sub">${on?h`Shown to the table: ${ntPreview(nt)}.`:'Hidden from the table.'} Change this in Edit details.</p></div>
    ${String(nt.notes||'').trim()?h`<div class="rdsec"><span class="fl">Notes the table learns once you show them</span><p class="rdnote">${nt.notes}</p></div>`:''}
    ${String(nt.secret||'').trim()?h`<div class="rdsec secret"><span class="fl">GM only · Secret</span><p class="rdnote">${nt.secret}</p></div>`:''}`}
    ${!ed?'':h`<div class="mgate secret"><span class="fl">GM only · what the players see</span>
      <label class="row"><input type="checkbox" ${bd('gt',id,'rev.on')} ${on?raw('checked'):''}><span><b>Show this NPC to the table</b></span></label>
      <div class="row evchips" role="group" aria-label="Also show">
        ${[['role','Role'],['place','Where you met'],['notes','Your notes'],['pic','Picture'],['cls','Level and class'],['stats','Stats'],['items','Items']].map(([k,l])=>h`<label class="chip chkc"><input type="checkbox" ${bd('gt',id,'rev.'+k)} ${num(r[k])?raw('checked'):''} ${on?'':raw('disabled')}><span>${l}</span></label>`)}</div>
      <p class="sub">Players now see: ${ntPreview(nt)}. It appears under <b>People</b>, in <b>Trainers you have met</b>. Their Pokémon appear there once you tick what to show for each one below.</p></div>`}
    ${ed?ntRankPanel(id,nt):''}
    ${ed?ntGrowPanel(id,nt):''}
    ${!ed?'':h`<div class="idrow"><div class="idimg">${ntImgOk(nt.img)?ntPortrait(nt.img,nt.imgc,'edit',h`data-id="${id}" tabindex="0" role="group" aria-label="Picture frame. Drag to move the picture, or use the arrow keys."`):pimg('',ntName(nt),'tall')}${imgPicker('gt',id,'img',nt,0,0,160000,false,900)}${galPanel('gt',id,nt,false)}${ntImgOk(nt.img)?ntFramePanel(id,nt):''}<span class="sub">${ntImgOk(nt.img)?(num(r.pic)&&on?'The table sees this picture.':'Only you see this picture. Tick Picture above to show it.'):'A portrait for this NPC. It stays hidden until you tick Picture.'}</span></div>
    <div class="fgrid">
      ${fText('Name','gt',id,'name',nt,{cls:'wide'})}
      ${fText('Role or title','gt',id,'role',nt,{ph:'e.g. Gym Leader, Team Galactic grunt'})}
      ${fText('Where you met','gt',id,'place',nt,{list:'dl-places'})}
      ${fSel('Category','gt',id,'cat',nt,npcCatList(true),{blank:'Auto'+(ntCat(nt)?': '+npcCatName(ntCat(nt)):' (no guess yet)')})}
      ${fArea('Notes the table learns once you show them','gt',id,'notes',nt,{rows:3,cls:'wide'})}
      ${fArea('Secret (only you see this)','gt',id,'secret',nt,{rows:3,cls:'wide'})}
    </div></div>`}
    ${ntSheet(id,nt,ed)}
    <div class="ph"><h3>Pokémon</h3><button class="btn sm primary" data-act="nt_team" data-id="${id}" ${left?'':raw('disabled')}>Add the whole team to the battle</button></div>
    ${team.length?h`<div class="ntteam">${team.map((m,i)=>ntMonRow(id,nt,m,i,team.length))}</div>`:h`<p class="sub">No Pokémon yet. ${ed?'Add one below':'Use Edit details to add one'}: its stats, passives and moves fill in from the handbook.</p>`}
    ${!ed?'':h`<div class="mgd"><b>Give this NPC a Pokémon</b>
      <div class="fgrid">
        <label class="fld"><span class="fl">Species</span><input type="text" list="dl-species" data-u="nt.sp_${id}" data-nr value="${S.ui.nt['sp_'+id]||''}" placeholder="e.g. Garchomp"></label>
        <label class="fld"><span class="fl">Name (optional)</span><input type="text" data-u="nt.nk_${id}" data-nr value="${S.ui.nt['nk_'+id]||''}"></label>
      </div>
      <div class="row"><button class="btn primary sm" data-act="nt_add" data-id="${id}">Add Pokémon</button></div></div>
    <div class="row"><button class="btn sm danger ${askDel?'armed':''}" data-act="nt_rm" data-id="${id}">${askDel?'Tap again to delete this NPC and its Pokémon':'Delete this NPC'}</button></div>`}
  </div>`;
}
function ntCard(id){
  const nt=NTS()[id];
  const open=!!S.ui.nt.open[id];
  const pub=ntPub(id);
  const team=ntTeam(nt);
  return h`<article class="entry ntcard" data-id="${id}">
    <div class="row sp"><div class="nthd">${ntImgOk(nt.img)?ntPortrait(nt.img,nt.imgc,'thumb'):pimg('',ntName(nt),'thumb')}<div><h3>${ntName(nt)}</h3><div class="meta">${ntCat(nt)?h`<span class="pill cat ${ntCat(nt)==='villain'?'ves':''}">${npcCatName(ntCat(nt))}</span>`:''}${nt.role?h`<span>${nt.role}</span>`:''}${nt.place?h`<span>${nt.place}</span>`:''}<span>${team.length} Pokémon</span>${ntRanks(id).map(({b,r})=>{const x=ntRankInfo(b,r);return x?h`<span class="pill">${b==='con'?'Contests':'Gyms'} #${x.pos}</span>`:'';})}</div></div></div>
      <div class="row">${pub?h`<span class="pill good">Shown to players</span>`:h`<span class="pill">Hidden</span>`}<button class="btn sm" data-act="nt_open" data-id="${id}" aria-expanded="${String(open)}">${open?'Close':'Open'}</button></div></div>
    ${open?ntBody(id,nt):''}
  </article>`;
}
function npcTab(){
  if(PTA.idx)ptaLists();
  const all=ntIds();
  const cat=S.ui.f.ncat||'';
  const sorts=CF_SORTS.n;
  const sort=sorts.some(x=>x[0]===S.ui.f.nsort)?S.ui.f.nsort:'order';
  const grp=!!S.ui.f.ngrp;
  const q=String(S.ui.q.npc||'').toLowerCase();
  const nm=id=>ntName(NTS()[id]);
  const cmp={
    order:()=>0,
    name:(a,b)=>cfName(nm(a),nm(b)),
    recent:(a,b)=>num(NTS()[b].createdAt)-num(NTS()[a].createdAt),
    cat:(a,b)=>cfCatIdx(ntCat(NTS()[a]),true)-cfCatIdx(ntCat(NTS()[b]),true)||cfName(nm(a),nm(b)),
    team:(a,b)=>ntTeam(NTS()[b]).length-ntTeam(NTS()[a]).length||cfName(nm(a),nm(b))
  }[sort];
  const ids=all.filter(id=>{const t=NTS()[id];return cfPass(cat,ntCat(t))&&(!q||[ntName(t),t.role,t.place,t.notes].some(x=>String(x||'').toLowerCase().includes(q)));}).sort(cmp);
  const groups=cfGroups(ids,id=>ntCat(NTS()[id]),grp,true);
  return h`<section class="panel"><div class="ph"><h2>NPC trainers</h2><span class="pill gm">GM only</span><div class="acts"><button class="btn sm" data-act="nt_pack">Import NPC pack</button><button class="btn primary sm" data-act="nt_new">New NPC trainer</button></div></div>
    <p class="sub">Create a trainer, give them Pokémon, and add them to a battle. Everything here stays in a document only you can read. The players see an NPC only after you tick <b>Show this NPC to the table</b>, and then only what you ticked, including for each Pokémon. In a battle the Pokémon start hidden as “Foe A”, “Foe B”. Each NPC has a <b>Category</b> (auto-guessed from the role until you pick one). Villain faction is a category only you can see; the table never learns it.</p>
    ${all.length?h`${cfTools('n',all.map(id=>ntCat(NTS()[id])))}
      <div class="tools"><label class="fld"><span class="fl">Search</span><input type="search" data-u="q.npc" value="${S.ui.q.npc||''}" placeholder="Name, role, place, notes"></label></div>`:''}</section>
  ${ids.length?groups.map(([k,items])=>h`${grp?cfHead(k,items.length):''}<div class="list">${items.map(ntCard)}</div>`):all.length?emptyState('No matches','Try a different search or category.'):emptyState('No NPC trainers yet','Make one for a rival, a gym leader or a stranger with a team. Nothing you put here reaches the players until you show it.',h`<button class="btn primary" data-act="nt_new">New NPC trainer</button>`)}`;
}

/* ----- what players see: People page ----- */
function ntPubMon(m){
  const id=m.sp?dexId(m.sp):0;
  const srcs=id?spriteSrcs(id):[];
  return h`<span class="ntpm">${srcs.length?h`<img class="sp mi" src="${srcs[0]}" data-fb="${srcs.slice(1).join('|')}" alt="" width="40" height="40" loading="lazy" decoding="async">`:h`<span class="mi-ph" aria-hidden="true"></span>`}<span class="ntpn"><b>${m.n}</b>${m.ty&&m.ty.length?h`<span class="types">${chipsOf(m.ty)}</span>`:''}${m.it?h`<span class="sub">${itemMini(m.it)}holding ${m.it}</span>`:''}</span></span>`;
}
function ntPublicPanel(o){
  o=o||{};
  const n=(S.npcPub&&S.npcPub.n)||{};
  const q=o.q||'';
  const cOf=o.pubCat||(id=>'');
  const nm=id=>String(n[id].n);
  let ids=Object.keys(n).filter(id=>cfPass(o.cat||'',cOf(id))&&(!q||[n[id].n,n[id].r,n[id].pl,n[id].b].some(x=>String(x||'').toLowerCase().includes(q))));
  ids.sort(o.sort==='cat'?(a,b)=>cfCatIdx(cOf(a),false)-cfCatIdx(cOf(b),false)||cfName(nm(a),nm(b)):(a,b)=>cfName(nm(a),nm(b)));
  if(!ids.length)return '';
  const groups=cfGroups(ids,cOf,!!o.grp,false);
  return h`<section class="panel ntpub"><div class="ph"><h2>Trainers you have met</h2>${S.me.admin?h`<span class="pill gm">What the players see</span>`:''}</div>
    ${groups.map(([k,its])=>h`${o.grp?cfHead(k,its.length):''}    <div class="grid cards">${its.map(id=>{const p=n[id],pic=ntPicOf(id);return h`<article class="entry pcard">${pic?h`<div class="ptrcol"><button class="ptrbtn" data-act="lbx" data-k="${'npc|'+id}" aria-label="${'View the full picture of '+p.n}" title="View the full picture">${ntPortrait(pic,ntPicCrop(id),'')}</button><span class="ptrh">Tap to enlarge</span></div>`:''}<div class="pc-body">
      <h3>${p.n}</h3>
      <div class="meta">${npcCatName(p.c)&&NPC_CATS.some(x=>x[0]===p.c)?h`<span class="pill cat">${npcCatName(p.c)}</span>`:''}${p.r?h`<span>${p.r}</span>`:''}${p.pl?h`<span>Met at ${p.pl}</span>`:''}${p.lv!=null?h`<span>Level ${p.lv}</span>`:''}${p.cl?h`<span>${p.cl}</span>`:''}</div>
      ${p.st?h`<div class="ntst lcd">${[['HP',p.st.hp],['Atk',p.st.atk],['Def',p.st.def],['SpA',p.st.spa],['SpD',p.st.spd],['Spd',p.st.spe]].map(([l,v])=>h`<span><i>${l}</i><b>${v}</b></span>`)}</div>`:''}
      ${p.it&&p.it.length?h`<div class="ntits">${p.it.map(x=>h`<span class="ntit">${itemMini(x.n)}${x.n}${x.q>1?' ×'+x.q:''}</span>`)}</div>`:''}
      ${p.b?h`<p class="prewrap">${p.b}</p>`:''}
      ${(p.m||[]).length?h`<div class="ntpms">${p.m.map(ntPubMon)}</div>`:''}
    </div></article>`;})}</div>`)}</section>`;
}
/* in the battle's "Who is fighting" panel */
function ntBattlePanel(){
  const ids=ntIds().filter(id=>ntTeam(NTS()[id]).length);
  if(!ids.length)return '';
  return h`<div class="mgd"><b>NPC trainers</b>
    <p class="sub">Their Pokémon join as foes with their own sheets, hidden from the players until you show them.</p>
    ${ids.map(id=>{const nt=NTS()[id],team=ntTeam(nt),left=team.filter(m=>!ntInBattle(id,m.id)).length;
      return h`<div class="row sp"><b>${ntName(nt)}${ntCat(nt)?h` <span class="pill cat ${ntCat(nt)==='villain'?'ves':''}">${npcCatName(ntCat(nt))}</span>`:''}</b><button class="btn sm" data-act="nt_team" data-id="${id}" ${left?'':raw('disabled')}>Add whole team</button></div>
        <div class="row evchips">${team.map(m=>h`<button class="btn sm chk" data-act="nt_foe" data-id="${id}" data-mid="${m.id}" aria-pressed="${String(ntInBattle(id,m.id))}" ${ntInBattle(id,m.id)?raw('disabled'):''}>${monIcon({species:m.sp})}${ntMonName(m)}</button>`)}</div>`;})}
  </div>`;
}

/* ----- actions ----- */
function ntAct(b){
  const d=b.dataset;
  if(!S.me.admin)return;
  switch(d.act){
    case 'nt_new':ntNew();break;
    case 'nt_rkgo':case 'nt_rkrm':case 'nt_rkadd':ntRankAct(d);break;
    case 'nt_stload':case 'nt_stsave':case 'nt_strm':case 'nt_stnew':ntGrowAct(d);break;
    case 'nt_pack':{const fp=$('#ntpackfile');if(fp)fp.click();break;}
    case 'nt_open':S.ui.nt.open[d.id]=!S.ui.nt.open[d.id];if(S.ui.nt.open[d.id])ntEnsure(d.id);render();break;
    case 'nt_more':S.ui.nt.more[d.id]=!S.ui.nt.more[d.id];render();break;
    case 'nt_tal':{
      const nt=NTS()[d.id];
      if(!nt)break;
      edit('gt',d.id,'talents.'+d.key,(clamp(num((nt.talents||{})[d.key]),0,2)+1)%3);
      render();break;}
    case 'nt_roll':ntRoll(d.label,num(d.bonus),num(d.tal));break;
    case 'nt_fr0':{const sc=d.sc||'gt';edit(sc,d.id,'imgc',{x:50,y:50,z:1});if(sc==='gt')ntPublish(d.id);render();break;}
    case 'nt_recharge':edit('gt',d.id,'megaUsed',false);render();break;
    case 'nt_mgadd':case 'nt_mgform':case 'nt_mgreset':case 'nt_mgdrop':case 'nt_mgready':mgAct('nt',d.act.slice(3),d);break;
    case 'nt_mon':S.ui.nt.mon[d.mid]=!S.ui.nt.mon[d.mid];render();break;
    case 'nt_add':ntAddMon(d.id);break;
    case 'nt_foe':ntToBattle(d.id,d.mid);break;
    case 'nt_team':ntTeamToBattle(d.id);break;
    case 'nt_see':{
      const nt=NTS()[d.id];
      const i=ntTeam(nt).findIndex(x=>x.id===d.mid);
      if(i<0)break;
      const on=d.v==='all';
      edit('gt',d.id,'team.'+i+'.sh',{name:on,pic:on,types:on,item:on});
      ntPublish(d.id);render();break;}
    case 'nt_fill':ntTwice('ntf|'+d.mid,()=>ntFillMon(d.id,d.mid));break;
    case 'nt_monrm':ntTwice('ntr|'+d.mid,()=>{
      const nt=NTS()[d.id];
      edit('gt',d.id,'team',ntTeam(nt).filter(x=>x.id!==d.mid));
      delete S.ui.nt.mon[d.mid];
      const fo=foesOf();
      Object.keys(fo).forEach(cid=>{if(fo[cid].nt===d.id&&fo[cid].ni===d.mid)edit('gb','battle','foes.'+cid+'.ni','');});
      ntPublish(d.id);render();
    });break;
    case 'nt_rm':ntTwice('ntd|'+d.id,()=>ntDelete(d.id));break;
  }
}

