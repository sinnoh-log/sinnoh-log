'use strict';
/* Sinnoh Trainer Log · 04c-format. The files in js/ are classic scripts that share one scope: load them in order (see index.html). */
/* ---------- Battle formats (Update 64): Open, Singles, Doubles, Tag; the field, the bench, Recall and Send out; allies ----------
   meta/battle.fmt says how many Pokémon each trainer has on the field: Singles 1, Doubles 2, Tag 1 (two trainers a side).
   Open (the default, and what End battle goes back to) puts everyone in the turn order at once, as before.
   A combatant on the bench has c.bn = true and is left out of the order (and so off the map). Sending one out rolls its
   initiative the way the battle does (Speed, or d20 + Speed, with the d20 typed or rolled) and slots it in where it lands;
   it takes the recalled Pokémon's square on the map.
   Groups: a player's Pokémon belong to their trainer (u:<uid>); a foe to its NPC trainer (n:<npc id>) or to the wild (w);
   an ally to its partner (al:<npc id or key>). c.g holds a foe's or ally's group, so players can see whose side it is on.
   Allies are foe sheets with f.al = true: only the GM changes or rolls for them, everything about them is shown to the
   table, and they fight on the players' side (blue on the map). Only the GM can recall and send out. */
const BT_FMTS=[['open','Open'],['single','Singles'],['double','Doubles'],['tag','Tag']];
const BT_SLOTS={single:1,double:2,tag:1};
const BT_FMT_TXT={
  open:'Everyone added is in the turn order at once, as for a wild horde.',
  single:'One Pokémon on the field per trainer. The rest wait on the bench, out of the turn order.',
  double:'Two Pokémon on the field per trainer. The rest wait on the bench, out of the turn order.',
  tag:'One Pokémon on the field per trainer, with partners side by side. The rest wait on the bench, out of the turn order.'
};
const btFmt=()=>BT_SLOTS[BT().fmt]?BT().fmt:'open';
const btSlots=()=>BT_SLOTS[btFmt()]||0;
function btFoeG(f){
  if(!f)return 'w';
  if(f.al)return 'al:'+(f.nt||f.ag||'x');
  return f.nt?'n:'+f.nt:'w';
}
function btGKey(c){
  if(!c)return '';
  if(c.s==='a')return 'u:'+String(c.r||'').split('/')[0];
  if(c.s==='f')return c.g||'w';
  return '';
}
const btGSide=g=>g.indexOf('u:')===0||g.indexOf('al:')===0?'a':'f';
/* a group's Pokémon on the field, in turn order */
function btFieldOf(g){
  const b=BT(),c=b.c||{},ord=b.order||[];
  const pos=k=>{const i=ord.indexOf(k);return i<0?1e9:i;};
  return Object.keys(c).filter(k=>btGKey(c[k])===g&&!c[k].bn).sort((x,y)=>pos(x)-pos(y));
}
const btBenchOf=g=>{const c=BT().c||{};return Object.keys(c).filter(k=>btGKey(c[k])===g&&c[k].bn);};
function btGName(g,gm){
  if(g.indexOf('u:')===0){const t=S.trainers[g.slice(2)];return t?tName(t):'Trainer';}
  if(g==='w')return 'Wild Pokémon';
  const c=BT().c||{},ks=Object.keys(c).filter(k=>btGKey(c[k])===g);
  if(g.indexOf('al:')===0){const k=ks.find(x=>c[x].gn);return k?c[k].gn:'Ally';}
  if(gm){const nt=NTS()[g.slice(2)];if(nt)return ntName(nt);}
  const k=ks.find(x=>c[x].pub&&c[x].pub.o);
  return k?c[k].pub.o:'Opponent';
}
function btGroups(){
  const c=BT().c||{},seen=[];
  Object.keys(c).forEach(k=>{const g=btGKey(c[k]);if(g&&seen.indexOf(g)<0)seen.push(g);});
  const rank=g=>g.indexOf('u:')===0?0:g.indexOf('al:')===0?1:g.indexOf('n:')===0?2:3,ti=tids();
  seen.sort((a,z)=>rank(a)-rank(z)||(rank(a)===0?ti.indexOf(a.slice(2))-ti.indexOf(z.slice(2)):0));
  return seen.map(g=>({g,side:btGSide(g),field:btFieldOf(g),bench:btBenchOf(g)}));
}
/* a foe sheet that fights for the players: shown in full, grouped under its partner's name */
function btMakeAlly(f,own,ag){
  f.al=true;f.sh=Object.assign({},SHOW_ALL);
  if(own)f.own=String(own);
  if(ag)f.ag=String(ag);
  return f;
}
/* ----- the map follows the switch ----- */
function btMapPos(cid){
  const c=btC(cid);
  if(!c)return null;
  if(c.s==='a'){const m=getLocal('p',c.r);return m&&m.bpos?Object.assign({},m.bpos):null;}
  const e=(bmG().f||{})[cid];
  return e&&num(e.x)>=0?{x:num(e.x),y:num(e.y),vis:num(e.vis)}:null;
}
function btMapClear(cid){
  const c=btC(cid);
  if(!c)return;
  if(c.s==='a'){const m=getLocal('p',c.r);if(m&&m.bpos)edit('p',c.r,'bpos',null);}
  else if((bmG().f||{})[cid]){const f=Object.assign({},bmG().f);delete f[cid];edit('bg','bmap','f',f);}
}
function btMapPut(cid,pos){
  const c=btC(cid),cfg=bmCfg();
  if(!pos||!c||!cfg)return;
  if(c.s==='a'){if(num(pos.v)===cfg.v)edit('p',c.r,'bpos',{x:num(pos.x),y:num(pos.y),v:cfg.v});}
  else edit('bg','bmap','f.'+cid,{x:num(pos.x),y:num(pos.y),vis:c.al?1:(num(pos.vis)>0?1:0)});
}
/* ----- recall and send out (GM) ----- */
function btRecall(cid,quiet){
  if(!S.me.admin)return;
  const b=BT(),c=btC(cid);
  if(!c||c.s==='t'||c.bn)return;
  const ord=(b.order||[]).slice(),i=ord.indexOf(cid);
  if(b.turn===cid){const rest=ord.filter(x=>x!==cid);edit('bt','battle','turn',rest.length?(rest[i]||rest[0]):'');}
  if(i>=0)ord.splice(i,1);
  edit('bt','battle','order',ord);
  edit('bt','battle','c.'+cid+'.bn',true);
  btMapClear(cid);
  if(S.ui.bm&&S.ui.bm.sel===cid)S.ui.bm.sel='';
  bmSync();
  if(!quiet){const v=btInfo(cid,true);toast((v?v.name:'It')+' is back on the bench.',true);render();}
}
/* out: the field Pokémon it replaces (same trainer). typed: the d20 the GM typed, for a d20 + Speed battle (blank rolls it) */
function btSendOut(cid,out,typed,quiet){
  if(!S.me.admin)return false;
  const c=btC(cid);
  if(!c||!c.bn)return false;
  const g=btGKey(c);
  let pos=null,outName='';
  const oc=out?btC(out):null;
  if(oc&&!oc.bn&&btGKey(oc)===g){pos=btMapPos(out);outName=(btInfo(out,true)||{}).name||'';btRecall(out,true);}
  else if(btSlots()&&btFieldOf(g).length>=btSlots()){if(!quiet)toast('The field is full for '+btGName(g,true)+'. Choose who comes back first.');return false;}
  const b=BT(),sp=btSpeed(cid),t=Math.round(num(typed));
  const d=b.mode==='d20'?(t>=1&&t<=20?t:rnd(20)):0,ini=sp+d,tb=rnd(20);
  edit('bt','battle','c.'+cid+'.bn',false);
  btSetIni(cid,ini,tb);
  const B=BT(),ord=(B.order||[]).filter(x=>B.c&&B.c[x]&&x!==cid);
  let at=ord.length;
  for(let i=0;i<ord.length;i++){if(btCmp({ini,sp,tb},{ini:btIni(ord[i]),sp:btSpeed(ord[i]),tb:btTb(ord[i])})<0){at=i;break;}}
  ord.splice(at,0,cid);
  edit('bt','battle','order',ord);
  if(B.on&&!B.turn)edit('bt','battle','turn',cid);
  if(pos)btMapPut(cid,pos);
  bmSync();
  if(!quiet){
    S.ui.bt.so=null;S.ui.bt.soD='';
    const v=btInfo(cid,true),prev=at>0?btInfo(ord[at-1],true):null;
    toast((v?v.name:'It')+' is out'+(outName?' for '+outName:'')+': initiative '+ini+(b.mode==='d20'?' (d20 '+d+(t>=1&&t<=20?', typed':'')+' + Speed '+sp+')':' (its Speed)')+', '+(prev?'after '+prev.name:'first in the order')+'.',true);
    render();
  }
  return true;
}
function btSetFmt(v){
  if(!S.me.admin)return;
  const f=BT_SLOTS[v]?v:'open';
  edit('bt','battle','fmt',f);
  if(f==='open'){
    const c=BT().c||{};
    Object.keys(c).filter(k=>c[k].bn).forEach(k=>btSendOut(k,'',0,true));
  }else{
    const N=BT_SLOTS[f];
    btGroups().forEach(G=>{
      G.field.slice(N).forEach(k=>btRecall(k,true));
      const room=N-Math.min(N,G.field.length);
      G.bench.filter(k=>!btIsDown(k)).slice(0,room).forEach(k=>btSendOut(k,'',0,true));
    });
  }
  S.ui.bt.so=null;
  render();
}
/* ----- what the page shows ----- */
function btFmtRow(gm){
  const f=btFmt();
  if(!gm)return f==='open'?'':h`<p class="sub"><span class="pill">${BT_FMTS.find(x=>x[0]===f)[1]}</span> ${BT_FMT_TXT[f]}</p>`;
  return h`<div class="fmtrow"><span class="fl">Format</span><div class="seg" role="group" aria-label="Battle format">${BT_FMTS.map(([k,l])=>h`<button data-act="b_fmt" data-v="${k}" aria-pressed="${String(f===k)}">${l}</button>`)}</div><span class="sub">${BT_FMT_TXT[f]}</span></div>`;
}
function btSlotHtml(cid,gm,turn){
  const v=btInfo(cid,gm);
  if(!v)return '';
  const pic=v.side==='a'?monPic(v.m):foePic(v);
  return h`<div class="fslot ${turn?'turn':''} ${v.down?'down':''}" data-cid="${cid}"><span class="spr bs ${v.side==='f'&&!v.pic?'unk':''}" ${v.side==='a'?typeVars(v.m):typeVars({types:v.types||[]})}>${pic}</span>
    <div class="fsx"><b>${v.name}</b>${turn?h` <span class="pill good">Acting</span>`:''}${v.down?h` <span class="pill">Down</span>`:''}${v.al&&gm?h` <span class="pill gm">GM runs</span>`:''}
      <div class="types">${v.types&&v.types.length?chipsOf(v.types):''}${v.status?h`<span class="pill status">${v.status}</span>`:''}</div>${btHpView(v)}</div>
    ${gm?h`<button class="btn sm" data-act="b_recall" data-cid="${cid}">Recall</button>`:''}</div>`;
}
function btFieldPanel(gm){
  const N=btSlots();
  if(!N)return '';
  const G=btGroups();
  if(!G.length)return '';
  const cur=BT().on?BT().turn:'';
  const side=s=>G.filter(x=>x.side===s).map(x=>h`<div class="fgrp"><div class="fwho">${btGName(x.g,gm)}${x.g.indexOf('al:')===0?' · ally':''}</div>
    ${x.field.map(cid=>btSlotHtml(cid,gm,cur===cid))}
    ${Array.from({length:Math.max(0,N-x.field.length)},()=>h`<div class="fslot empty"><span class="sub">Empty slot${gm&&x.bench.length?': send one out from the bench':''}</span></div>`)}</div>`);
  return h`<div class="field2">
    <div class="fside"><h3>Your side</h3>${G.some(x=>x.side==='a')?side('a'):h`<p class="sub">Nobody yet.</p>`}</div>
    <div class="fside foe"><h3>Opponents</h3>${G.some(x=>x.side==='f')?side('f'):h`<p class="sub">Nobody yet.</p>`}</div>
  </div>`;
}
function btBenchPanel(gm){
  if(!btSlots())return '';
  const G=btGroups().filter(x=>x.bench.length);
  if(!G.length)return '';
  const so=S.ui.bt.so&&btC(S.ui.bt.so.cid)&&btC(S.ui.bt.so.cid).bn?S.ui.bt.so:null;
  const rows=G.map(x=>{
    const secret=!gm&&x.side==='f';
    if(secret)return h`<div class="brl"><b>${btGName(x.g,gm)}</b><span class="sub">${x.bench.length} Pokémon in reserve</span></div>`;
    return h`<div class="brl"><b>${btGName(x.g,gm)}</b>${x.bench.map(cid=>{const v=btInfo(cid,gm);if(!v)return '';
      return v.down?h`<span class="bchip out">${v.name} · fainted</span>`:h`<span class="bchip ${so&&so.cid===cid?'on':''}">${v.name}${gm?h` <button data-act="b_so" data-cid="${cid}" aria-pressed="${String(!!(so&&so.cid===cid))}">Send out</button>`:''}</span>`;})}</div>`;
  });
  return h`<h3 class="refg">Bench</h3><div class="bench">${rows}</div>${gm&&so?btSoPanel(so.cid):''}`;
}
function btSoPanel(cid){
  const c=btC(cid),v=btInfo(cid,true);
  if(!c||!v)return '';
  const g=btGKey(c),field=btFieldOf(g),full=field.length>=btSlots(),d20=BT().mode==='d20';
  const who=btGName(g,true);
  return h`<div class="sendout"><b>Send out ${v.name} for ${who}?</b>
    <span class="sub">${full?(field.length===1?(btInfo(field[0],true)||{}).name+' goes back to the bench. ':'Choose who goes back to the bench. '):'There is room on the field. '}${v.name} rolls initiative (${d20?'d20 + Speed':'its Speed'}, as this battle does) and joins the order where it lands${full?', on that Pokémon’s square on the map':''}.</span>
    ${d20?h`<label class="fld soin"><span class="fl">d20 rolled (blank: the site rolls)</span><input type="number" inputmode="numeric" min="1" max="20" data-u="bt.soD" data-nr value="${S.ui.bt.soD||''}"></label>`:''}
    <div class="row">${full?field.map(o=>{const ov=btInfo(o,true)||{};return h`<button class="btn sm primary" data-act="b_sogo" data-cid="${cid}" data-out="${o}">${field.length===1?'Send out '+v.name:'Swap for '+ov.name+(ov.down?' (down)':'')}</button>`;}):h`<button class="btn sm primary" data-act="b_sogo" data-cid="${cid}" data-out="">Send out ${v.name}</button>`}
      <button class="btn sm ghost" data-act="b_socx">Cancel</button></div></div>`;
}
function btFmtAct(d){
  if(!S.me.admin)return;
  switch(d.act){
    case 'b_fmt':btSetFmt(d.v);break;
    case 'b_recall':btRecall(d.cid);break;
    case 'b_so':S.ui.bt.so=S.ui.bt.so&&S.ui.bt.so.cid===d.cid?null:{cid:d.cid};render();break;
    case 'b_sogo':btSendOut(d.cid,d.out||'',S.ui.bt.soD);break;
    case 'b_socx':S.ui.bt.so=null;S.ui.bt.soD='';render();break;
  }
}
