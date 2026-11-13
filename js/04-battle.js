'use strict';
/* Sinnoh Trainer Log · 04-battle. The files in js/ are classic scripts that share one scope: load them in order (see index.html). */
/* ---------- Battle: turn order, health, stages and status, foes the GM keeps hidden, giving Pokémon, evolution log ----------
   Two documents hold a battle:
     meta/battle  what everyone at the table can see (the order, round, whose turn, the GM's public rolls, and for each
                  foe only the parts the GM has chosen to show). Only the GM can write it.
     gm/battle    the foes themselves: health, stats, moves, notes. Firestore's rules let only the GM read it, so a
                  player's browser never receives it. Hiding a foe is therefore done by the database, not by the screen. */
S.ui.bt=S.ui.bt||{amt:'',foeSp:'',foeNick:'',foeN:1,tgt:'',eff:'auto',open:{},giveTo:''};
S.ui.give=S.ui.give||{uid:'',sp:'',nick:'',caught:''};

const BT=()=>S.battle||{};
const btC=cid=>(BT().c||{})[cid]||null;
const foesOf=()=>(S.battleGm&&S.battleGm.foes)||{};
const foeOf=cid=>foesOf()[cid]||null;
/* a foe's number is its base and Adj, its nature, and its Mega bonus while it is Mega-evolved, the same sum a player's Pokémon uses */
const fStat=(f,k)=>effStat(f||{},k);
/* its types: the Mega form's while Mega-evolved */
const foeTypes=f=>{
  const mt=megaOn(f)?(f.mega.types||[]).filter(Boolean):[];
  return mt.length?mt:((f&&f.ty)||[]).filter(Boolean);
};
const fSpd=f=>fStat(f,'spe')+5*stg(f,'spe');
const newCid=()=>'c'+Date.now().toString(36)+Math.random().toString(36).slice(2,5);
const stgObj=o=>({atk:stg(o,'atk'),def:stg(o,'def'),spa:stg(o,'spa'),spd:stg(o,'spd'),spe:stg(o,'spe')});
const SHOW_ALL={name:1,pic:1,types:1,hp:2,st:1,item:1,mega:1};
const SHOW_NONE={name:0,pic:0,types:0,hp:0,st:0,item:0,mega:0};
const zeroStats=()=>({atk:0,def:0,spa:0,spd:0,spe:0});

/* what the table sees of a foe, worked out from its secret sheet and the GM's choices. No empty values: the database refuses them. */
function foePub(f){
  const sh=f.sh||{};
  const hp=f.hp||{cur:0,max:0};
  const mx=Math.max(1,num(hp.max));
  const p=Math.round(clamp(num(hp.cur)/mx,0,1)*100)/100;
  const hv=num(sh.hp);
  /* the Mega form is only part of what the table sees once the GM ticks "Mega form" */
  const mgOn=megaOn(f)&&num(sh.mega)>0;
  const item=String(f.item||'').trim();
  return {
    n:sh.name?(f.nick||(mgOn&&f.mega.form)||f.sp||'Foe'):(f.pn||'Foe'),
    sp:sh.pic?(f.sp||''):'',
    ms:sh.pic&&mgOn&&num(f.mega.sid)>0?num(f.mega.sid):0,
    sy:sh.pic&&f.shiny===true?1:0,
    ty:sh.types?(mgOn?foeTypes(f):(f.ty||[]).filter(Boolean)):null,
    hp:hv>=2?{p,c:num(hp.cur),m:num(hp.max)}:hv===1?{p}:null,
    st:sh.st?String(f.st||''):null,
    sg:sh.st?stgObj(f):null,
    it:num(sh.item)&&item?item:null,
    mg:mgOn?(sh.name&&f.mega.form?String(f.mega.form):'Mega'):null,
    o:ntOwnerLabel(f),
    down:num(hp.cur)<=0
  };
}
function foePublish(cid){
  const f=foeOf(cid);
  if(!f||!btC(cid))return;
  edit('bt','battle','c.'+cid+'.pub',foePub(f));
  const sh=f.sh||{};
  if(f.nt&&(num(sh.name)||num(sh.pic)))ntScout(f.nt,f.sp);
}
const foeLabel=f=>f.nick||f.sp||'Foe';

/* Everything the viewer may know about one combatant. full is true only for the GM looking at a foe. */
function btInfo(cid,full){
  const c=btC(cid);
  if(!c)return null;
  if(c.s==='a'){
    const ref=String(c.r||'');
    const k=ref.indexOf('/');
    const uid=ref.slice(0,k),pid=ref.slice(k+1);
    const m0=getLocal('p',ref);
    if(!m0)return null;
    const m=Object.assign({id:pid},m0);
    return {cid,side:'a',uid,pid,ref,m,name:mName(m),owner:tName(S.trainers[uid]),types:effTypes(m),
      stat:{def:effStat(m,'def'),spd:effStat(m,'spd'),spe:spdOf(m)},stage:{def:stg(m,'def'),spd:stg(m,'spd')},
      hp:m.hp||{cur:0,max:0},down:num(m.hp&&m.hp.cur)<=0,status:m.status||'',stages:stgObj(m),showHp:2,pic:true};
  }
  if(c.s==='t'){
    const t=S.trainers[c.u];
    if(!t)return null;
    const hp=t.hp&&num(t.hp.max)>0?{cur:num(t.hp.cur),max:num(t.hp.max)}:null;
    return {cid,side:'t',uid:c.u,tr:t,name:tName(t),owner:tName(t),types:[],stat:null,stage:null,hp,down:!!hp&&hp.cur<=0,status:'',stages:null,showHp:hp?2:0,pic:true};
  }
  const f=full&&S.me.admin?foeOf(cid):null;
  if(f){
    return {cid,side:'f',f,name:foeLabel(f),pubName:foePub(f).n,types:foeTypes(f),mega:megaOn(f),ms:megaOn(f)?num(f.mega.sid):0,itemTxt:String(f.item||'').trim(),
      stat:{def:fStat(f,'def'),spd:fStat(f,'spd'),spe:fSpd(f)},stage:{def:stg(f,'def'),spd:stg(f,'spd')},
      hp:f.hp||{cur:0,max:0},down:num(f.hp&&f.hp.cur)<=0,status:f.st||'',stages:stgObj(f),showHp:2,pic:true,sy:f.shiny===true?1:0};
  }
  const p=c.pub||{};
  return {cid,side:'f',name:p.n||'Unknown foe',types:p.ty&&p.ty.length?p.ty:null,stat:null,
    stage:p.sg?{def:num(p.sg.def),spd:num(p.sg.spd)}:null,
    hp:p.hp?{cur:num(p.hp.c!=null?p.hp.c:Math.round(num(p.hp.p)*100)),max:p.hp.m!=null?num(p.hp.m):100,p:num(p.hp.p),exact:p.hp.c!=null}:null,
    down:!!p.down,status:p.st||'',stages:p.sg||null,showHp:p.hp?(p.hp.c!=null?2:1):0,pub:p,pic:!!p.sp,sp:p.sp||'',mg:p.mg||null,ms:num(p.ms),sy:num(p.sy),itemTxt:p.it||''};
}

/* ----- order and turns ----- */
function btOrder(){
  const b=BT();
  return (b.order||[]).filter(cid=>{
    const c=b.c&&b.c[cid];
    if(!c)return false;
    return c.s==='a'?!!getLocal('p',c.r):c.s==='t'?!!S.trainers[c.u]:true;
  });
}
const btIsDown=cid=>{
  const v=btInfo(cid,!!S.me.admin);
  return !v||v.down;
};
function btSpeed(cid){
  const c=btC(cid);
  if(!c)return 0;
  if(c.s==='a'){const m=getLocal('p',c.r);return m?spdOf(Object.assign({id:''},m)):0;}
  if(c.s==='t'){const t=S.trainers[c.u];return t?num(t.stats&&t.stats.spe):0;}
  const f=foeOf(cid);
  return f?fSpd(f):0;
}
/* an ally's number is public; a foe's stays in the GM's secret sheet, because it would give away its Speed */
function btIni(cid){
  const c=btC(cid);
  if(!c)return 0;
  if(c.s==='a'||c.s==='t')return num(c.ini);
  const f=foeOf(cid);
  return f?num(f.ini):0;
}
function btSetIni(cid,ini,tb){
  const c=btC(cid);
  if(!c)return;
  if(c.s==='a'||c.s==='t'){edit('bt','battle','c.'+cid+'.ini',ini);edit('bt','battle','c.'+cid+'.tb',tb);}
  else{edit('gb','battle','foes.'+cid+'.ini',ini);edit('gb','battle','foes.'+cid+'.tb',tb);}
}
function btTb(cid){
  const c=btC(cid);
  if(!c)return 0;
  if(c.s==='a'||c.s==='t')return num(c.tb);
  const f=foeOf(cid);
  return f?num(f.tb):0;
}
function btRollInit(){
  if(!S.me.admin)return;
  const b=BT();
  const ids=Object.keys(b.c||{}).filter(cid=>btInfo(cid,true));
  if(!ids.length){toast('Add some Pokémon or foes first.');return;}
  const d20m=b.mode==='d20';
  const rows=ids.map(cid=>({cid,ini:btSpeed(cid)+(d20m?rnd(20):0),tb:rnd(20)}));
  rows.sort((a,z)=>z.ini-a.ini||z.tb-a.tb);
  rows.forEach(r=>btSetIni(r.cid,r.ini,r.tb));
  edit('bt','battle','order',rows.map(r=>r.cid));
  const first=rows.find(r=>!btIsDown(r.cid))||rows[0];
  edit('bt','battle','turn',first.cid);
  edit('bt','battle','round',1);
  if(!b.on||!num(b.bid))edit('bt','battle','bid',Date.now());   /* a new fight: the helper's per-battle counts start again */
  edit('bt','battle','on',true);
  toast(d20m?'Initiative rolled: d20 plus Speed.':'Turn order set by Speed.',true);
  render();
}
/* Speed went up or down mid-fight: put everyone back in Speed order, keeping whose turn it is */
function btResort(){
  if(!S.me.admin)return;
  const b=BT();
  const ids=btOrder();
  const rows=ids.map(cid=>({cid,ini:btSpeed(cid),tb:btTb(cid)||rnd(20)}));
  rows.sort((a,z)=>z.ini-a.ini||z.tb-a.tb);
  rows.forEach(r=>btSetIni(r.cid,r.ini,r.tb));
  edit('bt','battle','order',rows.map(r=>r.cid));
  render();
}
function btNext(){
  if(!S.me.admin)return;
  const b=BT();
  if(!b.on)return;
  const ord=btOrder();
  if(!ord.length)return;
  let i=ord.indexOf(b.turn),round=num(b.round)||1,cand=null;
  for(let s=0;s<ord.length;s++){
    i++;
    if(i>=ord.length){i=0;round++;}
    if(!btIsDown(ord[i])){cand=ord[i];break;}
  }
  if(!cand){toast('Everyone is down.');return;}
  edit('bt','battle','turn',cand);
  edit('bt','battle','round',round);
  fcExpire(round);
  render();
}
function btTurnTo(cid){
  if(!S.me.admin||!btC(cid))return;
  edit('bt','battle','turn',cid);
  render();
}
function btMove(cid,d){
  if(!S.me.admin)return;
  const ord=(BT().order||[]).slice();
  const i=ord.indexOf(cid),j=i+d;
  if(i<0||j<0||j>=ord.length)return;
  const t=ord[i];ord[i]=ord[j];ord[j]=t;
  edit('bt','battle','order',ord);
  render();
}
function btSetMode(v){
  if(!S.me.admin)return;
  edit('bt','battle','mode',v==='d20'?'d20':'speed');
  render();
}

/* ----- adding and removing combatants ----- */
function btInsert(cid,obj,ini,tb){
  const b=BT();
  edit('bt','battle','c.'+cid,obj);
  const ord=(b.order||[]).filter(x=>b.c&&b.c[x]&&x!==cid);
  let at=ord.length;
  for(let i=0;i<ord.length;i++){
    const oi=btIni(ord[i]),ot=btTb(ord[i]);
    if(ini>oi||(ini===oi&&tb>ot)){at=i;break;}
  }
  ord.splice(at,0,cid);
  edit('bt','battle','order',ord);
  btSetIni(cid,ini,tb);
}
function btAddAlly(uid,pid,quiet){
  if(!S.me.admin)return;
  const ref=uid+'/'+pid;
  const m=getLocal('p',ref);
  if(!m)return;
  const b=BT();
  if(Object.keys(b.c||{}).some(k=>b.c[k].s==='a'&&b.c[k].r===ref))return;
  const cid=newCid();
  const sp=spdOf(Object.assign({id:pid},m));
  btInsert(cid,{s:'a',r:ref},sp+(b.mode==='d20'?rnd(20):0),rnd(20));
  if(!quiet)render();
}
/* a trainer takes a turn of their own: initiative from their Speed stat, the same way as a Pokémon */
const btTrainerIn=uid=>Object.keys(BT().c||{}).some(k=>BT().c[k].s==='t'&&BT().c[k].u===uid);
function btAddTrainer(uid,quiet){
  if(!S.me.admin)return;
  const t=S.trainers[uid];
  if(!t||btTrainerIn(uid))return;
  const b=BT();
  const cid=newCid();
  btInsert(cid,{s:'t',u:uid},num(t.stats&&t.stats.spe)+(b.mode==='d20'?rnd(20):0),rnd(20));
  if(!quiet)render();
}
function btAddParty(uid){
  if(!S.me.admin)return;
  btAddTrainer(uid,true);
  partyOf(uid).forEach(m=>btAddAlly(uid,m.id,true));
  render();
}
function foeFromRec(rec,si,sp){
  if(rec){
    const F=ptaFields(rec);
    return {sp:rec.n,ty:F.types,sz:F.size,wt:F.weight,hp:{cur:F.hp,max:F.hp},hpx:hpx(F.die),base:F.base,sk:F.skills,ps:F.passives,mv:F.moves,die:F.die};
  }
  if(si)return {sp:si.name,ty:si.types.slice(),sz:'Medium',wt:'Medium',hp:{cur:20,max:20},base:Object.assign({},si.base),sk:'',ps:[],mv:[]};
  return {sp,ty:['',''],sz:'Medium',wt:'Medium',hp:{cur:20,max:20},base:{atk:3,def:3,spa:3,spd:3,spe:3},sk:'',ps:[],mv:[]};
}
function foeLetter(){
  const used=new Set(Object.keys(foesOf()).map(k=>foesOf()[k].pn));
  for(let i=0;i<26;i++){const n='Foe '+String.fromCharCode(65+i);if(!used.has(n))return n;}
  return 'Foe '+(used.size+1);
}
async function btAddFoe(){
  if(!S.me.admin)return;
  const u=S.ui.bt;
  const sp=String(u.foeSp||'').trim();
  if(!sp){toast('Type a species first.');return;}
  const sw=!!u.foeSw;
  const n=clamp(Math.round(num(u.foeN))||1,1,sw?40:8);
  if(sw&&n<2){toast('A Swarm needs at least two Pokémon.');return;}
  await btAddFoeSp(sp,n,n===1?String(u.foeNick||'').trim():'','',sw?{swarm:{n,g:'w'+Date.now().toString(36)}}:null);
  u.foeSp='';u.foeNick='';u.foeN=1;u.foeSw=false;
  render();
}
/* ----- Alpha, Totem and Titan Pokémon (PTA GM Guide, Encounter Building, converted to the 3.5 rules in Update 48: Alpha Beam and Alpha Impact are the 3.5 Hyper Beam and Giga Impact, the aura's Passives are temporary Passives, healing is a flat number). The GM can set a kind on any foe, even one already in the battle, and undo it. ----- */
const ALPHA_PS=[
  {name:'Wild Alpha Aura',text:'While wild, this Pokémon has Alpha Beam, Alpha Impact and Alpha Restoration and the temporary Passives Alpha Tenacity and Wild Might. Temporary Passives do not count toward the limit of four Passives. It loses the aura if it is captured.'},
  {name:'Alpha Tenacity',text:'Temporary Passive. Cannot be captured by non-Master Poké Balls unless it is at half of its max HP or lower. It is always treated as at full HP when working out the capture rate.'},
  {name:'Wild Might',text:'Temporary Passive. HP doubled, +5 Attack, +5 Special Attack, and Defense or Special Defense raised to 15.'}
];
const ALPHA_MV=[
  {name:'Alpha Beam',freq:'1/day',kind:'Special',range:'Ranged (35ft beam)',type:'Normal',dice:'4d12',text:'If you have used at least 3 other Normal-type moves this combat, +2d power. Must Recharge: you cannot act next round, and attacks against you have advantage.',used:0},
  {name:'Alpha Impact',freq:'1/day',kind:'Physical',range:'Melee (10ft burst)',type:'Normal',dice:'4d12',text:'If you have used at least 3 other Normal-type moves this combat, +2d power. Must Recharge: you cannot act next round, and attacks against you have advantage.',used:0},
  {name:'Alpha Restoration',freq:'3/day',kind:'Effect',range:'Self',type:'Normal',dice:'',text:'You heal 15 HP. Your uses of Alpha Beam and Alpha Impact are restored as if you had rested.',used:0}
];
const TOTEM_PS=[
  {name:'Wild Totem Spirit',text:'While wild, this Pokémon has Totemic Power, Totemic Call and Totemic Guardian and the temporary Passives Totemic Tenacity and Totemic Spirit. Temporary Passives do not count toward the limit of four Passives. It loses them if it is captured.'},
  {name:'Totemic Tenacity',text:'Temporary Passive. Cannot be captured by non-Master Poké Balls unless it is at half of its max HP or lower. It is always treated as at full HP when working out the capture rate.'},
  {name:'Totemic Spirit',text:'Temporary Passive. HP doubled, +5 Attack, +5 Special Attack, and Defense or Special Defense raised to 15.'}
];
const TOTEM_MV=[
  {name:'Totemic Power',freq:'1/day',kind:'Effect',range:'Ranged (25ft burst)',type:'Normal',dice:'',text:'All allies (up to 10 including yourself) within range get a flat +2 to Attack and Special Attack (not ▲) for 10 minutes. Totemic Power can stack.',used:0},
  {name:'Totemic Call',freq:'At-Will',kind:'Effect',range:'Self',type:'Normal',dice:'',text:'If you have 2 or more allies with you in combat, Totemic Call fails. Summon 1d4 allies to the encounter. The allies who show up get a flat +2 to Attack and Special Attack (not ▲) for 10 minutes.',used:0},
  {name:'Totemic Guardian',freq:'3/day',kind:'Special',range:'Ranged (25ft burst)',type:'Normal',dice:'3d8',text:'Attack or Special Attack. All allies (up to 10 including yourself) within range are healed HP equal to the amount of damage Totemic Guardian would have dealt.',used:0}
];
const TITAN_PS=[
  {name:'Titan Mystica',text:'Temporary Passive. Cannot be captured by non-Master Poké Balls. Size and weight are increased to at least Huge.'},
  {name:'Massive Impacts',text:'Temporary Passive. Single-target melee attacks have their range changed to Ranged (15ft Burst), and ranged attacks gain (15ft Blast) if they did not already have a Blast radius or any other special range modifier.'},
  {name:'Titanic Vitality',text:'Temporary Passive. Max HP is multiplied by 10. Temporary Passives do not count toward the limit of four Passives.'}
];
const KIND_DEF={
  alpha:{label:'Alpha',ps:ALPHA_PS,mv:ALPHA_MV,mul:2,stat:1,title:'Wild Might'},
  totem:{label:'Totem',ps:TOTEM_PS,mv:TOTEM_MV,mul:2,stat:1,title:'Totemic Spirit'},
  titan:{label:'Titan',ps:TITAN_PS,mv:[],mul:10,stat:0,title:'Titanic Vitality'}
};
const ALPHA_NAMES=new Set([].concat(ALPHA_PS,TOTEM_PS,TITAN_PS,ALPHA_MV,TOTEM_MV).map(x=>x.name));
const FOE_SIZES=['Tiny','Small','Medium','Large','Huge','Gigantic'];
/* which kind a foe is: alpha, totem, titan or '' (older foes only have the alpha flag) */
const foeKind=f=>f?(KIND_DEF[f.kind]?f.kind:(f.alpha?'alpha':'')):'';
/* takes a kind off a foe: HP, stat adjustments, size, passives, moves, name and note go back */
function foeKindUndo(f){
  const k=foeKind(f);
  if(!k)return f;
  const d=KIND_DEF[k],kd=f.kd&&typeof f.kd==='object'?f.kd:{};
  const mul=num(kd.mul)||d.mul;
  const hp=f.hp||{cur:20,max:20};
  let mx=Math.max(1,Math.round(num(hp.max)/mul));
  if(!num(kd.mul)&&num(f.alMax)>0)mx=num(f.alMax);
  const cu=num(hp.cur);
  f.hp={cur:cu<=0?0:Math.max(1,Math.min(mx,Math.round(cu/mul))),max:mx};
  if(d.stat){
    const bn=Object.assign(zeroStats(),f.bonus||{});
    bn.atk=num(bn.atk)-5;bn.spa=num(bn.spa)-5;
    if(kd.dk&&num(kd.da))bn[kd.dk]=num(bn[kd.dk])-num(kd.da);
    f.bonus=bn;
  }
  if(kd.sz)f.sz=kd.sz;
  if(kd.wt)f.wt=kd.wt;
  f.ps=(f.ps||[]).filter(x=>!ALPHA_NAMES.has(x.name));
  f.mv=(f.mv||[]).filter(x=>!ALPHA_NAMES.has(x.name));
  if(kd.nick){if(f.nick===kd.nick)f.nick='';}
  else if(k==='alpha'&&f.nick==='Alpha '+(f.sp||''))f.nick='';
  let nt=String(f.notes||'');
  if(kd.note)nt=nt.replace('\n'+kd.note,'').replace(kd.note,'');
  else nt=nt.split('\n').filter(x=>x.indexOf('ALPHA. Wild Might')!==0).join('\n');
  f.notes=nt;
  f.kind='';f.kd={};f.alpha=0;f.alMax=0;
  return f;
}
/* sets a kind on a foe. Any kind it already has is taken off first, so switching is clean. */
function foeKindApply(f,k){
  const d=KIND_DEF[k];
  if(!f||!d)return f;
  foeKindUndo(f);
  const kd={mul:d.mul,v:2};
  const hp=f.hp||{cur:20,max:20};
  const mx=Math.max(1,num(hp.max)),cu=Math.max(0,num(hp.cur));
  f.hp={cur:cu*d.mul,max:mx*d.mul};
  const bs=f.base||{};
  const bn=Object.assign(zeroStats(),f.bonus||{});
  let note=k==='titan'?'TITAN. Titanic Vitality: max HP ×10, size and weight at least Huge, melee attacks become 15 ft bursts. It cannot be caught with a normal ball.':'';
  if(d.stat){
    bn.atk=num(bn.atk)+5;bn.spa=num(bn.spa)+5;
    /* the better of Defense and Special Defense is raised to 15; change the Adj boxes if you want the other one */
    const dk=num(bs.def)+num(bn.def)>=num(bs.spd)+num(bn.spd)?'def':'spd';
    const cur=num(bs[dk])+num(bn[dk]);
    if(cur<15){bn[dk]=num(bn[dk])+15-cur;kd.dk=dk;kd.da=15-cur;}
    note=k.toUpperCase()+'. '+d.title+': HP doubled, +5 Attack and Special Attack, '+(dk==='def'?'Defense':'Special Defense')+' raised to 15 (change the Adj boxes if you want the other one).';
  }
  f.bonus=bn;
  if(k==='titan'){
    kd.sz=f.sz||'Medium';kd.wt=f.wt||'Medium';
    if(FOE_SIZES.indexOf(f.sz||'Medium')<4)f.sz='Huge';
    if(WEIGHTS.indexOf(f.wt||'Medium')<4)f.wt='Superweight';
  }
  f.ps=(f.ps||[]).concat(d.ps.map(x=>Object.assign({},x)));
  f.mv=(f.mv||[]).concat(d.mv.map(x=>Object.assign({},x)));
  if(!String(f.nick||'').trim()){f.nick=d.label+' '+(f.sp||'');kd.nick=f.nick;}
  if(note){kd.note=note;f.notes=(f.notes?f.notes+'\n':'')+note;}
  f.kind=k;f.kd=kd;f.alpha=d.stat?1:0;f.alMax=d.stat?mx:0;
  return f;
}
function foeMakeAlpha(f){return f&&!foeKind(f)?foeKindApply(f,'alpha'):f;}
/* the GM's switch on a foe's sheet */
function foeSetKind(cid,k){
  if(!S.me.admin)return;
  const f=foeOf(cid);
  if(!f)return;
  if(k&&f.qr){toast('This foe has a Quick wild rank. Set its rank to None first: a foe uses one or the other.');return;}
  const nf=JSON.parse(JSON.stringify(f));
  if(k&&KIND_DEF[k])foeKindApply(nf,k);else foeKindUndo(nf);
  edit('gb','battle','foes.'+cid,nf);
  foePublish(cid);
  toast((nf.nick||nf.sp||'The foe')+(k&&KIND_DEF[k]?' is now a '+KIND_DEF[k].label+'.':' is back to normal.'),true);
  render();
}
/* n hidden foes of one species, from the handbook data when it has the species. note goes on each foe's secret sheet. */
async function btAddFoeSp(sp,n,nick,note,opts){
  const pr=ptaResolve(sp);
  let rec=null;
  if(pr)rec=ptaRec(pr)||await ptaChunk(ptaLetter(ptaKey(pr))).then(()=>ptaRec(pr));
  const si=rec?null:speciesInfo(sp);
  const b=BT();
  for(let i=0;i<n;i++){
    const cid=newCid();
    const base=foeFromRec(rec,si,sp);
    const f=Object.assign({nick:nick||'',bonus:zeroStats(),stages:zeroStats(),st:'',notes:note||'',sh:Object.assign({},SHOW_NONE),pn:foeLetter()},base);
    if(opts&&opts.alpha)foeKindApply(f,'alpha');else if(opts&&opts.kind)foeKindApply(f,opts.kind);
    else if(opts&&opts.swarm){qwApply(f,'swarm');f.sw=opts.swarm;}
    edit('gb','battle','foes.'+cid,f);
    btInsert(cid,{s:'f',pub:foePub(f)},fSpd(f)+(b.mode==='d20'?rnd(20):0),rnd(20));
  }
  toast(n+(n===1?' foe':' foes')+' added'+(note?' ('+((opts&&opts.alpha)?'alpha ':'')+sp+')':'')+(rec||si?'':'. That species is not in the data, so fill in its numbers by hand')+'.',true);
}
function btRemove(cid){
  if(!S.me.admin)return;
  const b=BT();
  const c=b.c&&b.c[cid];
  if(!c)return;
  const ord=(b.order||[]).slice();
  const i=ord.indexOf(cid);
  if(b.turn===cid){
    const rest=ord.filter(x=>x!==cid);
    edit('bt','battle','turn',rest.length?(rest[i]||rest[0]):'');
  }
  if(i>=0)ord.splice(i,1);
  const nc=Object.assign({},b.c);delete nc[cid];
  edit('bt','battle','c',nc);
  edit('bt','battle','order',ord);
  if(c.s==='f'){const nf=Object.assign({},foesOf());delete nf[cid];edit('gb','battle','foes',nf);}
  else if(c.s==='a'){const m=getLocal('p',c.r);if(m&&m.bpos)edit('p',c.r,'bpos',null);}
  delete S.ui.bt.open[cid];
  if(S.ui.bm&&S.ui.bm.sel===cid)S.ui.bm.sel='';
  bmSync();
  render();
}
function btEnd(){
  if(!S.me.admin)return;
  bmClearTokens();
  edit('bt','battle','on',false);
  edit('bt','battle','c',{});
  edit('bt','battle','order',[]);
  edit('bt','battle','turn','');
  edit('bt','battle','round',0);
  edit('bt','battle','bid',0);
  edit('bt','battle','fc',[]);
  edit('gb','battle','foes',{});
  S.ui.bt.open={};
  endBattleAll();
}

/* ----- health, stages and status, for a Pokémon on the table or a foe in the GM's sheet ----- */
function canTouch(sc,id){
  if(sc==='p')return canEditT(String(id).split('/')[0]);
  if(sc==='gb')return !!S.me.admin;
  return false;
}
function btHp(cid,delta){
  const c=btC(cid);
  if(!c)return;
  if(c.s==='a'){
    const m=getLocal('p',c.r);
    if(!m||!canEditT(String(c.r).split('/')[0]))return;
    const hp=m.hp||{cur:0,max:0};
    edit('p',c.r,'hp.cur',clamp(num(hp.cur)+delta,0,Math.max(0,num(hp.max))));
  }else if(c.s==='t'){
    const t=S.trainers[c.u];
    if(!t||!canEditT(c.u))return;
    const hp=t.hp||{cur:0,max:0};
    edit('t',c.u,'hp.cur',clamp(num(hp.cur)+delta,0,Math.max(0,num(hp.max))));
  }else{
    const f=foeOf(cid);
    if(!f||!S.me.admin)return;
    const hp=f.hp||{cur:0,max:0};
    edit('gb','battle','foes.'+cid+'.hp.cur',clamp(num(hp.cur)+delta,0,Math.max(0,num(hp.max))));
    foePublish(cid);
  }
  render();
}
function btStage(sc,id,path,k,d,cid){
  if(!canTouch(sc,id))return;
  const doc=getLocal(sc,id);
  if(!doc)return;
  edit(sc,id,path+'.'+k,clamp(num(getIn(doc,path+'.'+k))+d,-STG_MAX,STG_MAX));
  if(cid&&sc==='gb')foePublish(cid);
  render();
}
function btAffl(sc,id,path,a,cid){
  if(!canTouch(sc,id))return;
  const doc=getLocal(sc,id);
  if(!doc)return;
  edit(sc,id,path,afflToggle(getIn(doc,path),a));
  if(cid&&sc==='gb')foePublish(cid);
  render();
}
function applyRoll(src,id){
  if(!S.me.admin)return;
  const list=src==='gm'?(BT().rolls||[]):((S.trainers[src]&&S.trainers[src].rolls)||[]);
  const i=list.findIndex(r=>r.id===id);
  if(i<0)return;
  const r=list[i];
  if(r.ap||r.dm==null||!r.tgt||!btC(r.tgt))return;
  /* a player's roll against a hidden foe: the foe's own passives are applied now, on the GM's side */
  let dm=num(r.dm),heal=num(r.heal);const notes=[];
  const tf=!r.pd&&!r.mb?foeOf(r.tgt):null;
  if(tf&&dm>0){
    const D=psDefMods({mv:{name:r.label},rng:r.mr||'',k:r.mk||'Physical',tPs:tf.ps||[],tHp:tf.hp},r.type||'',EFF_CODES[r.ef]||EFF_CODES.n);
    if(D.imm){dm=0;notes.push(D.imm+': immune');}
    else{
      if(D.dmg){dm=Math.max(0,dm+D.dmg);notes.push(...D.notes.filter(x=>!/die$/.test(x)));}
      D.dbl.forEach(n=>{dm*=2;notes.push(n+' ×2');});
      D.half.forEach(n=>{dm=Math.floor(dm/2);notes.push(n+' ½');});
      if(D.absorb){heal=Math.floor(dm/2);dm=0;notes.push(D.absorb+': heals '+heal);}
      if(D.step)notes.push(D.notes.filter(x=>/die$/.test(x)).join(', ')+' (take one die off by hand)');
    }
  }
  if(dm)btHp(r.tgt,-dm);
  if(heal)btHp(r.tgt,heal);
  const arr=list.map((x,j)=>j===i?Object.assign({},x,{ap:true}):x);
  if(src==='gm')edit('bt','battle','rolls',arr);else edit('t',src,'rolls',arr);
  toast((r.tn||'The target')+(heal?' heals '+heal:' takes '+dm)+'.'+(notes.length?' '+notes.join(', ')+'.':''),true);
  render();
}

/* ----- the GM rolls for a foe ----- */
function foeRoll(cid,i,onlyDmg){
  if(!S.me.admin)return;
  const f=foeOf(cid);
  const x=f&&(f.mv||[])[i];
  if(!x)return;
  const k=KINDS.indexOf(x.kind)>=0?x.kind:'Physical';
  const ks=kindStat(k);
  const u=S.ui.bt;
  if(needDie(x,monDie(f),foeLabel(f)+(megaOn(f)?' (Mega)':'')))return;
  const info=u.tgt&&btC(u.tgt)?btInfo(u.tgt,true):null;
  const prep=auRollPrep('gb','battle','foes.'+cid+'.mv.'+i,effMove(x,f),cid,!!onlyDmg);
  if(!prep)return;
  const c=atkCalc({
    mv:prep.x,die:monDie(f),aTypes:foeTypes(f),aAcc:isEff(k)?fSpd(f):fStat(f,ks.acc),aDmg:ks.dmg?fStat(f,ks.dmg):0,aStage:ks.dmg?stg(f,ks.dmg):0,
    tTypes:info?info.types:null,tDef:info&&info.stat?(isEff(k)?info.stat.spe:info.stat[fcSwapDef(u.tgt,ks.def)]):null,tStage:info&&info.stage&&ks.dmg?num(info.stage[ks.def]):0,
    eff:u.eff||'auto',adv:S.ui.adv,onlyDmg:!!onlyDmg,crit:false,dmgBonus:num(f.qn&&f.qn.dmg),
    aPs:f.ps,aHp:f.hp,tPs:info?(info.side==='a'?(info.m.passives||[]):((info.f&&info.f.ps)||[])):null,tHp:info?(info.side==='a'?info.hp:(info.f&&info.f.hp)):null,tog:psTog(u),
    fcA:fcAt(cid),fcT:u.tgt?fcAt(u.tgt):[]
  });
  if(!c.ac&&!c.dm){toast('That move has no damage listed. Use Roll attack for the accuracy check.');return;}
  const {e,local}=atkEntry(c,foePub(f).n,info?{cid:u.tgt,name:info.name}:null,true);
  logRoll(e,local);
  prep.done();
  renderRoll();
  render();
}

/* typing a move's name in a foe's sheet fills in the rest of the row from the handbook, when the row is still empty */
const FOE_MV_RE=/^gb\|battle\|foes\.([^.]+)\.mv\.(\d+)\.name$/;
function foeRowFill(t){
  const mt=FOE_MV_RE.exec(t.dataset.b||'');
  if(!mt)return false;
  const cid=mt[1],i=+mt[2];
  const go=()=>{
    const f=foeOf(cid);
    const row=f&&(f.mv||[])[i];
    const L=PTA.lists;
    if(!row||!L)return;
    const def=L.moveMap.get(dexKey(row.name));
    if(!def)return;
    if(String(row.text||'').trim()||String(row.dice||'').trim())return;
    const next=Object.assign({},row,{name:def.n,freq:def.f||row.freq,kind:def.k||row.kind,range:def.r||row.range,type:def.t||row.type,dice:def.d||'',text:def.x||''});
    edit('gb','battle','foes.'+cid+'.mv',f.mv.map((x,j)=>j===i?next:x));
    toast('Filled in '+def.n+' from the handbook.',true);
    renderSoon();
  };
  if(PTA.lists)go();else ptaLists().then(go);
  return true;
}

/* ----- a foe the party catches, or a Pokémon the GM hands out ----- */
function blankMon(uid,over){
  return Object.assign({owner:uid,nick:'',species:'',types:['',''],size:'Medium',weight:'Medium',die:'d6',hp:{cur:20,max:20},base:{atk:3,def:3,spa:3,spd:3,spe:3},bonus:zeroStats(),up:'',down:'',natureName:'',skills:'',passives:[],moves:[],item:'',status:'',caught:'',notes:'',slot:partyOf(uid).length<6?'party':'box',order:Date.now(),createdAt:Date.now()},over||{});
}
async function giveMon(){
  if(!S.me.admin)return;
  const g=S.ui.give;
  const uid=g.uid&&S.trainers[g.uid]?g.uid:tids()[0];
  const sp=String(g.sp||'').trim();
  const nick=String(g.nick||'').trim(),caught=String(g.caught||'').trim();
  if(!uid){toast('There are no trainers yet.');return;}
  if(!sp){toast('Type a species first.');return;}
  g.sp='';g.nick='';g.caught='';
  /* load the handbook page for this species first, so the sheet fills in at once and the note below is the last word */
  const pr=ptaResolve(sp);
  if(pr&&!ptaRec(pr)){try{await ptaChunk(ptaLetter(ptaKey(pr)));}catch(e){}}
  const id=S.db.collection('trainers').doc(uid).collection('pokemon').doc().id;
  newDoc('p',uid+'/'+id,blankMon(uid,{nick,species:sp,caught}));
  const known=!!(ptaResolve(sp)||speciesInfo(sp));
  if(known)applySpecies(uid,id,true);
  const slot=(getLocal('p',uid+'/'+id)||{}).slot;
  toast('Gave '+sp+' to '+tName(S.trainers[uid])+(slot==='box'?' (their party is full, so it went to the box)':'')+(known?'. Its numbers were filled in from the data':'. That species is not in the data, so fill in its numbers by hand')+'.',true);
  render();
}
function foeGive(cid){
  if(!S.me.admin)return;
  const f=foeOf(cid);
  const uid=S.ui.bt.giveTo&&S.trainers[S.ui.bt.giveTo]?S.ui.bt.giveTo:tids()[0];
  if(!f||!uid)return;
  const id=S.db.collection('trainers').doc(uid).collection('pokemon').doc().id;
  /* a captured Alpha, Totem or Titan loses what the wild gave it (GM Guide) and gains the small thing it keeps */
  const g=JSON.parse(JSON.stringify(f));
  const qnote=qnStrip(g);
  const k0=foeKind(g);
  if(k0)foeKindUndo(g);
  let hp=g.hp||{cur:20,max:20};
  let nick=g.nick||'',ps=(g.ps||[]).map(x=>Object.assign({},x)),mv=(g.mv||[]).map(x=>Object.assign({},x,{used:0}));
  let sz=g.sz||'Medium',note='';
  if(k0==='alpha'){
    ps.push({name:'Alpha',text:'+1 Attack or +1 Special Attack, and +1 Defense or +1 Special Defense. Once chosen, the bonuses cannot be changed.'});
    note=' It lost the alpha aura and has the passive Alpha: choose its +1 bonuses on its sheet. If it now has more than four Passives, one must go.'+(num((f.hp||{}).cur)<=0?' It was knocked out when it was caught, so by the 3.5 capture rules it starts at Loyalty 0 (set it on the Loyalty board).':'');
  }else if(k0==='totem'){
    mv.push({name:'Totem Memory',freq:'1/day',kind:'Effect',range:'Ranged (25ft burst)',type:'Normal',dice:'',text:'All allies (up to 10 including yourself) within range get a flat +2 to Attack or Special Attack (not ▲) for 10 minutes. If you ever replace Totem Memory on your move list, it can never be learned again.',used:0});
    note=' It lost its totem powers and has the move Totem Memory.'+(num((f.hp||{}).cur)<=0?' It was knocked out when it was caught, so by the 3.5 capture rules it starts at Loyalty 0 (set it on the Loyalty board).':'');
  }else if(k0==='titan'){
    ps.push({name:'Titanic',text:'Your Max HP is increased by 18. If Titanic is ever removed, it can never be learned again.'});
    hp={cur:num(hp.cur)>0?num(hp.cur)+18:0,max:num(hp.max)+18};
    const i=FOE_SIZES.indexOf(sz);
    if(i>=0&&i<FOE_SIZES.length-1)sz=FOE_SIZES[i+1];
    note=' It shrank to one size above its species and has the passive Titanic (+18 max HP). If it now has more than four Passives, one must go.'+(num((f.hp||{}).cur)<=0?' It was knocked out when it was caught, so by the 3.5 capture rules it starts at Loyalty 0 (set it on the Loyalty board).':'');
  }
  newDoc('p',uid+'/'+id,blankMon(uid,Object.assign({
    nick,species:f.sp||'',types:[(f.ty||[])[0]||'',(f.ty||[])[1]||''],size:sz,weight:g.wt||'Medium',
    hp:{cur:Math.max(1,num(hp.cur)),max:Math.max(1,num(hp.max))},base:Object.assign({atk:3,def:3,spa:3,spd:3,spe:3},f.base),
    skills:f.sk||'',passives:ps,moves:mv,
    item:f.item||'',up:f.up||'',down:f.down||'',natureName:f.natureName||'',gender:f.gender||'',die:f.die||'',shiny:f.shiny===true,mega:f.mega?JSON.parse(JSON.stringify(f.mega)):null,
    caught:'Caught in the wild, session '+(num(S.meta.session)||1)
  },f.hpx?{hpx:num(f.hpx)}:{})));
  note+=qnote;
  /* the note is also kept in the Pokémon's GM-only private notes, because the status line is overwritten by "Saving…" within a moment */
  if(note)newDoc('gl',id,Object.assign({uid,pid:id,note:'Capture note:'+note},num((f.hp||{}).cur)<=0?{loyalty:0}:{}));
  btRemove(cid);
  toast((f.sp||'The foe')+' now belongs to '+tName(S.trainers[uid])+'.'+note+(note?' This is saved in its private GM notes.':''),true);
}

/* =================== views =================== */
function foePic(v){
  if(v.pic&&(v.sp||(v.f&&v.f.sp)))return monPic({species:v.sp||(v.f&&v.f.sp),nick:v.name,img:'',mega:v.ms?{sid:v.ms}:null,megaOn:!!v.ms,shiny:num(v.sy)>0});
  return h`<span class="sp-ini unk" aria-hidden="true">?</span>`;
}
function btHpView(v){
  if(!v.hp)return h`<span class="sub">Health hidden</span>`;
  if(v.side==='f'&&!v.f&&v.showHp===1){
    return h`<span class="bhpw">${hpBar({cur:Math.round(num(v.hp.p)*100),max:100})}</span>`;
  }
  return h`<span class="bhpw">${hpBar(v.hp)}<span class="mono">${num(v.hp.cur)}/${num(v.hp.max)}</span></span>`;
}
function btRow(cid,idx,gm,turn){
  const v=btInfo(cid,gm);
  if(!v)return '';
  const open=!!S.ui.bt.open[cid];
  const mine=(v.side==='a'||v.side==='t')&&canEditT(v.uid);
  const canOpen=gm||mine;
  const secret=v.side==='f'&&gm&&v.f;
  const ini=v.side==='a'||v.side==='t'?num(btC(cid).ini):(gm?btIni(cid):null);
  const own=secret?ntFoeOwner(v.f):(v.pub&&v.pub.o)||'';
  const sub=v.side==='a'?v.owner:v.side==='t'?'Trainer':'Foe'+(own?' · '+own:'')+(secret?' · players see “'+v.pubName+'”':'');
  const types=v.types&&v.types.length?chipsOf(v.types):'';
  const hidden=v.side==='f'&&!secret&&!v.types;
  return h`<li class="brow ${v.side==='a'||v.side==='t'?'ally':'foe'} ${turn?'turn':''} ${v.down?'down':''}" data-cid="${cid}">
    <div class="bmain">
      <span class="bn" aria-label="Position ${idx+1}">${idx+1}</span>
      <span class="bpic"><span class="spr bs ${v.side==='f'&&!v.pic?'unk':''}" ${v.side==='a'?typeVars(v.m):typeVars({types:v.types||[]})}>${v.side==='a'?monPic(v.m):v.side==='t'?pimg((v.tr&&v.tr.img)||'',v.name,'thumb'):foePic(v)}</span></span>
      <div class="btx"><b class="bnm">${v.name}</b>${turn?h` <span class="pill good">Acting</span>`:''}${secret&&foeKind(v.f)?h` <span class="pill encal">${KIND_DEF[foeKind(v.f)].label}</span>`:''}${v.down?h` <span class="pill">Down</span>`:''}
        <span class="sub">${sub}${ini!=null&&ini!==0?' · initiative '+ini:''}</span>
        <div class="types">${types}${hidden?h`<span class="pill">Types unknown</span>`:''}${v.mega||v.mg?h`<span class="pill mega">Mega</span>`:''}${v.itemTxt&&v.side==='f'?h`<span class="pill">Holding ${v.itemTxt}</span>`:''}${v.status?h`<span class="pill status">${v.status}</span>`:''}${v.stages?stgPills({stages:v.stages}):''}${auPill(cid)}${secret?h`<span class="pill gm">GM sheet</span>`:''}</div></div>
      <div class="bhp">${btHpView(v)}</div>
      ${canOpen?h`<button class="btn sm" data-act="b_open" data-cid="${cid}" aria-expanded="${String(open)}">${open?'Close':'Details'}</button>`:''}
    </div>
    ${open&&canOpen?(v.side==='a'?btAllyBody(cid,v,gm,idx):v.side==='t'?btTrainerBody(cid,v,gm,idx):btFoeBody(cid,v,idx)):''}
  </li>`;
}
function btAmt(cid,canHeal){
  return h`<div class="row bamt"><div class="hpbtns lcdbtns">${[-5,-1,1,5].map(d=>h`<button data-act="b_hp" data-cid="${cid}" data-d="${d}">${d>0?'+'+d:'−'+Math.abs(d)}</button>`)}</div>
    <label class="fld"><span class="fl">Amount</span><input type="number" inputmode="numeric" data-u="bt.amt" data-nr value="${S.ui.bt.amt}" placeholder="0"></label>
    <button class="btn sm danger" data-act="b_dmg" data-cid="${cid}">Damage</button><button class="btn sm" data-act="b_heal" data-cid="${cid}">Heal</button></div>`;
}
function btOrderBtns(cid,idx){
  const n=btOrder().length;
  return h`<div class="row"><button class="btn sm" data-act="b_turn" data-cid="${cid}">Acts now</button>
    <button class="btn sm ghost" data-act="b_ord" data-cid="${cid}" data-d="-1" ${idx===0?raw('disabled'):''} aria-label="Move earlier in the order">↑</button>
    <button class="btn sm ghost" data-act="b_ord" data-cid="${cid}" data-d="1" ${idx===n-1?raw('disabled'):''} aria-label="Move later in the order">↓</button>
    <button class="btn sm danger ${S.ui.confirm==='bt|'+cid?'armed':''}" data-act="b_rm" data-cid="${cid}">${S.ui.confirm==='bt|'+cid?'Tap again to remove':'Remove from battle'}</button></div>`;
}
function btAllyBody(cid,v,gm,idx){
  const id=v.ref;
  return h`<div class="bbody">
    ${btAmt(cid)}
    <div class="fl">Status</div>${afflChips('p',id,'status',v.status,false,'')}${afflNotes(v.status)}
    <div class="fl">Combat stages</div>${stagePanel('p',id,'stages',v.m,false,'')}
    <div class="row"><button class="btn sm" data-act="b_card" data-uid="${v.uid}" data-pid="${v.pid}">Open the card</button></div>
    ${gm?btOrderBtns(cid,idx):''}
  </div>`;
}
function btTrainerBody(cid,v,gm,idx){
  return h`<div class="bbody">
    ${v.hp?btAmt(cid):h`<p class="sub">Set ${v.name}’s HP on the trainer sheet to track it here.</p>`}
    <div class="row"><button class="btn sm" data-act="b_trainer" data-uid="${v.uid}">Open the trainer</button></div>
    ${gm?btOrderBtns(cid,idx):''}
  </div>`;
}
function foeMegaPanel(cid,f){
  const nt=f.nt?NTS()[f.nt]:null;
  const checks=[megaHold(f.item,f.mv,f.mega)];
  if(nt)checks.push({ok:hasKey(nt),label:ntName(nt)+' carries a Key Stone'},{ok:keyCharged(nt),label:'Key Stone not used yet this battle'});
  return megaRunPanel({kind:'foe',sc:'gb',id:'battle',P:'foes.'+cid+'.',doc:S.battleGm,mon:f,attrs:h`data-cid="${cid}"`,checks,chip:nt?keyChip(nt):'',ekey:'mgf'+cid});
}
function btFoeBody(cid,v,idx){
  const f=v.f;
  if(PTA.idx)ptaLists();
  if(!f)return h`<div class="bbody"><p class="sub">This foe’s sheet is missing from your secret notes.</p>${btOrderBtns(cid,idx)}</div>`;
  const P='foes.'+cid+'.';
  const sh=f.sh||{};
  const allies=btOrder().map(x=>btInfo(x,true)).filter(x=>x&&x.side==='a');
  const pub=foePub(f);
  const tr=tids();
  const mvs=f.mv||[];
  const ek='f'+cid,ed=isEd(ek);
  const psOpen=!!S.ui.open['fps'+cid];
  return h`<div class="bbody fsheet ${ed?'':'rd'}">
    ${ed?edBar(ek,'Editing '+(f.nick||f.sp||'this foe')):h`<div class="rdtop foe"><div class="rdtx">${rdFacts([['Species',f.sp],['Gender',f.gender],['Size',[f.sz,f.wt].filter(Boolean).join(', ')],['Monster die',f.die],['Nature',natureTxt(f)],['Held item',f.item]])}${hbNote(f.die,monDie(f))&&!f.pc?h`<p class="sub hbn">${hbNote(f.die,monDie(f))}</p>`:''}</div>${edBtn(ek)}</div>${qnFoeBox(cid,f)}`}
    ${ed?'':h`<div class="mgate secret rdsee"><span class="fl">GM only · what the players see</span>
      <p class="sub"><b>${pub.n}</b>${pub.sp?'':' (no picture)'}${pub.ty?' · '+(pub.ty.join(' / ')||'types'):' · types hidden'}${pub.hp?(pub.hp.c!=null?' · health '+pub.hp.c+'/'+pub.hp.m:' · health bar'):' · health hidden'}${pub.it?' · holding '+pub.it:''}${pub.mg?' · Mega-evolved':''}${pub.down?' · Down':''}</p>
      <div class="row"><button class="btn sm" data-act="b_reveal" data-cid="${cid}" data-v="all">Show everything</button><button class="btn sm ghost" data-act="b_reveal" data-cid="${cid}" data-v="none">Hide everything</button></div></div>`}
    ${!ed?'':h`<div class="mgate secret"><span class="fl">GM only · what the players see</span>
      <div class="row evchips" role="group" aria-label="Show players">
        ${[['name','Name'],['pic','Picture'],['types','Types'],['st','Status and stages'],['item','Held item'],['mega','Mega form']].map(([k,l])=>h`<label class="chip chkc"><input type="checkbox" ${bd('gb','battle',P+'sh.'+k)} ${num(sh[k])?raw('checked'):''}><span>${l}</span></label>`)}
        <label class="fld inl"><span class="fl">Health</span><select ${bd('gb','battle',P+'sh.hp')}>${[[0,'Hidden'],[1,'Bar only'],[2,'Numbers']].map(([n,l])=>h`<option value="${n}" ${num(sh.hp)===n?raw('selected'):''}>${l}</option>`)}</select></label></div>
      <div class="row"><button class="btn sm" data-act="b_reveal" data-cid="${cid}" data-v="all">Show everything</button><button class="btn sm ghost" data-act="b_reveal" data-cid="${cid}" data-v="none">Hide everything</button>
        ${fText('Name while hidden','gb','battle',P+'pn',S.battleGm,{})}</div>
      <p class="sub">Players now see: <b>${pub.n}</b>${pub.sp?'':' (no picture)'}${pub.ty?' · '+(pub.ty.join(' / ')||'types'):' · types hidden'}${pub.hp?(pub.hp.c!=null?' · health '+pub.hp.c+'/'+pub.hp.m:' · health bar'):' · health hidden'}${pub.it?' · holding '+pub.it:''}${pub.mg?' · Mega-evolved'+(pub.ms?' (shows its Mega picture)':''):''}${pub.down?' · Down':''}. Their phones never receive the numbers you keep hidden.</p></div>`}
    ${btAmt(cid)}
    ${ntFoeOwner(f)?h`<p class="sub">Belongs to <b>${ntFoeOwner(f)}</b>${ntOwnerLabel(f)?' (the table has met them)':' (the table has not been told about them)'}.</p>`:''}
    ${!ed?'':h`<div class="fgrid">
      ${fText('Name','gb','battle',P+'nick',S.battleGm,{})}
      ${fText('Species','gb','battle',P+'sp',S.battleGm,{list:'dl-species'})}
      ${fSel('Type 1','gb','battle',P+'ty.0',S.battleGm,TYPES,{blank:'None'})}
      ${fSel('Type 2','gb','battle',P+'ty.1',S.battleGm,TYPES,{blank:'None'})}
      ${fNum('HP now','gb','battle',P+'hp.cur',S.battleGm,{min:0})}
      ${fNum('HP max','gb','battle',P+'hp.max',S.battleGm,{min:1})}
      ${fSel('Monster die','gb','battle',P+'die',S.battleGm,DICE,{blank:'Not set'})}
      ${fSel('Gender','gb','battle',P+'gender',S.battleGm,GENDERS,{blank:'Not set'})}
      <div class="fld shn"><span class="fl">Colour</span>${fCheck('Shiny ✦','gb','battle',P+'shiny',S.battleGm,false)}</div>
      ${fText('Held item','gb','battle',P+'item',S.battleGm,{list:'dl-items'})}
      ${fSel('Nature raises','gb','battle',P+'up',S.battleGm,STAT_OPTS,{blank:'None'})}
      ${fSel('Nature lowers','gb','battle',P+'down',S.battleGm,STAT_OPTS,{blank:'None'})}
    </div>
    <div class="mgd secret fkind"><span class="fl">GM only · Alpha, Totem or Titan</span>
      <div class="row evchips" role="group" aria-label="Kind of wild Pokémon">${[['','Normal'],['alpha','Alpha'],['totem','Totem'],['titan','Titan']].map(([k,l])=>h`<button class="btn sm chk" data-act="b_kind" data-cid="${cid}" data-k="${k}" aria-pressed="${String(foeKind(f)===k)}">${l}</button>`)}</div>
      <p class="sub">${foeKind(f)?'Doubled HP, stat bonuses, new passives and moves are in place (Titan: HP ×10 and Huge size). Choose Normal to undo them.':'Choose a kind to apply the PTA GM Guide rules, converted to 3.5, to this foe. You can undo it at any time.'}</p>${foeKind(f)&&num(f.kd&&f.kd.v)<2?h`<p class="sub">This foe has the older 3.0 text. Tap its kind again to bring it up to 3.5. Current HP stays in proportion.</p>`:''}</div>`}
    ${!ed?'':qwRow(cid,f)}
    ${!ed&&foeKind(f)&&num(f.kd&&f.kd.v)<2?h`<p class="sub">This foe has the older 3.0 text. Open Edit details and tap its kind again to bring it up to 3.5.</p>`:''}
    <div class="stats">${STATS.map(s=>h`<div class="stat lcd"><span class="sl">${s[2]}</span><span class="sv">${fStat(f,s[0])}</span><span class="sm"><span>mod ${sgn(mod(fStat(f,s[0])))}</span>${megaBonus(f,s[0])?h`<span class="mbn">Mega ${sgn(megaBonus(f,s[0]))}</span>`:''}</span>
      ${!ed?'':h`<div class="mini"><label>Base<input type="number" ${bd('gb','battle',P+'base.'+s[0])} value="${num(f.base&&f.base[s[0]])}"></label><label>Adj<input type="number" ${bd('gb','battle',P+'bonus.'+s[0])} value="${num(f.bonus&&f.bonus[s[0]])}"></label></div>`}</div>`)}</div>
    <div class="fl">Status</div>${afflChips('gb','battle',P+'st',f.st,false,cid)}${afflNotes(f.st)}
    ${ccFoeLine(cid,f)}
    <div class="fl">Combat stages</div>${stagePanel('gb','battle',P+'stages',f,false,cid)}
    ${foeMegaPanel(cid,f)}
    <div class="list"><div class="ph"><h3>Moves</h3>${ed?h`<button class="btn sm" data-act="add" ${bp('gb','battle',P+'mv')} data-tpl="move">Add move</button>`:h`<span class="sub">${mvs.length?'Tap a move to read its effect.':''}</span>`}</div>
      <div class="mrgrid fopt"><label class="fld"><span class="fl">Target</span><select data-u="bt.tgt"><option value="">No target</option>${allies.map(a=>h`<option value="${a.cid}" ${S.ui.bt.tgt===a.cid?raw('selected'):''}>${a.name} (${a.owner})</option>`)}</select></label>
        <label class="fld"><span class="fl">Type advantage</span><select data-u="bt.eff">${EFF_PICK.map(([k,l])=>h`<option value="${k}" ${(S.ui.bt.eff||'auto')===k?raw('selected'):''}>${l}</option>`)}</select></label></div>
      ${mrPsLine('bt',f,S.ui.bt.tgt&&btC(S.ui.bt.tgt)?((x=>x?(x.side==='a'?x.m:x.f):null)(btInfo(S.ui.bt.tgt,true))):null,null)}
      <div class="row"><div class="seg" role="group" aria-label="Roll mode">${[['normal','Normal'],['adv','Advantage'],['dis','Disadvantage']].map(([k,l])=>h`<button data-act="adv" data-v="${k}" aria-pressed="${String(S.ui.adv===k)}">${l}</button>`)}</div>
        <label class="row"><input type="checkbox" data-act="b_secret" ${S.ui.secret?raw('checked'):''}><span>Roll in secret (not shared)</span></label></div>
      ${!mvs.length?h`<p class="sub">No moves yet. ${ed?'Add one, or type a move name to fill it in from the handbook.':'Use Edit details to add them.'}</p>`:!ed?mvs.map((x,i)=>mvRead('gb','battle',P+'mv.'+i,effMove(x,f),false,'fmx'+cid+'#'+i,x.kind==='Style'?'':h`<div class="row"><button class="btn primary sm" data-act="b_fmroll" data-cid="${cid}" data-i="${i}">Roll attack</button><button class="btn sm" data-act="b_fmdmg" data-cid="${cid}" data-i="${i}">Damage only</button></div>`)):mvs.map((x,i)=>h`<div class="move ${x.kind==='Style'?'mvstyle':''}"><div class="mv1">${fText('Move','gb','battle',P+'mv.'+i+'.name',S.battleGm,{list:'dl-moves'})}${fText('Uses','gb','battle',P+'mv.'+i+'.freq',S.battleGm,{})}<span></span>${rowBtns('gb','battle',P+'mv',i,mvs.length,false)}</div>
        <div class="mv2">${fSel('Kind','gb','battle',P+'mv.'+i+'.kind',S.battleGm,KINDS,{})}${fSel('Type','gb','battle',P+'mv.'+i+'.type',S.battleGm,TYPES,{})}${fText('Range','gb','battle',P+'mv.'+i+'.range',S.battleGm,{})}${fText('Damage','gb','battle',P+'mv.'+i+'.dice',S.battleGm,{ph:'e.g. 3d8'})}</div>
        ${fArea('Effect','gb','battle',P+'mv.'+i+'.text',S.battleGm,{rows:2})}
        ${x.kind==='Style'?h`<p class="sub stynote"><span class="pill sty">Style</span> No attack roll and no damage.</p>`:h`<div class="row"><button class="btn primary sm" data-act="b_fmroll" data-cid="${cid}" data-i="${i}">Roll attack</button><button class="btn sm" data-act="b_fmdmg" data-cid="${cid}" data-i="${i}">Damage only</button></div>`}</div>`)}
    </div>
    ${(f.ps||[]).length?(ed||psOpen?h`<div class="list"><div class="ph"><h3>Passives</h3>${ed?'':h`<button class="btn sm ghost" data-act="toggle" data-key="${'fps'+cid}" aria-expanded="true">Hide</button>`}</div><ul class="mini-list">${f.ps.map(x=>h`<li><b>${x.name}</b><br><span class="sub">${x.text}</span></li>`)}</ul></div>`:h`<button class="rdfold" data-act="toggle" data-key="${'fps'+cid}" aria-expanded="false"><b>Passives (${f.ps.length})</b><span class="sub">${f.ps.map(x=>x.name).filter(Boolean).join(', ')}</span><span aria-hidden="true">▸</span></button>`):''}
    ${ed?fArea('Notes (only you see these)','gb','battle',P+'notes',S.battleGm,{rows:2}):String(f.notes||'').trim()?h`<div class="rdsec secret"><span class="fl">GM only · Notes</span><p class="rdnote">${f.notes}</p></div>`:''}
    ${tr.length?h`<div class="row"><label class="fld inl"><span class="fl">Caught by</span><select data-u="bt.giveTo">${tr.map(u=>h`<option value="${u}" ${(S.ui.bt.giveTo||tr[0])===u?raw('selected'):''}>${tName(S.trainers[u])}</option>`)}</select></label>
      <button class="btn sm" data-act="b_give" data-cid="${cid}">Give to trainer</button><span class="sub">Copies its sheet and health to their party or box, then removes it here.</span></div>`:''}
    ${btOrderBtns(cid,idx)}
  </div>`;
}
function btAddPanel(){
  const ids=tids();
  const b=BT();
  const inB=ref=>Object.keys(b.c||{}).some(k=>b.c[k].s==='a'&&b.c[k].r===ref);
  const u=S.ui.bt;
  return h`<section class="panel"><div class="ph"><h2>Who is fighting</h2><span class="pill gm">GM only</span></div>
    ${ids.length?ids.map(uid=>{
      const pt=partyOf(uid);
      return h`<div class="mgd"><div class="row sp"><b>${tName(S.trainers[uid])}</b><button class="btn sm" data-act="b_addparty" data-uid="${uid}" ${(!btTrainerIn(uid))||(pt.length&&!pt.every(m=>inB(uid+'/'+m.id)))?'':raw('disabled')}>Add trainer and party</button></div>
        <div class="row evchips"><button class="btn sm chk" data-act="b_addtrainer" data-uid="${uid}" aria-pressed="${String(btTrainerIn(uid))}" ${btTrainerIn(uid)?raw('disabled'):''}>${tName(S.trainers[uid])} (trainer)</button></div>
        ${pt.length?h`<div class="row evchips">${pt.map(m=>h`<button class="btn sm chk" data-act="b_addally" data-uid="${uid}" data-pid="${m.id}" aria-pressed="${String(inB(uid+'/'+m.id))}" ${inB(uid+'/'+m.id)?raw('disabled'):''}>${monIcon(m)}${mName(m)}</button>`)}</div>`:h`<p class="sub">No Pokémon in the party.</p>`}</div>`;
    }):h`<p class="sub">No trainers yet.</p>`}
    <div class="mgd"><b>Add a foe</b>
      <p class="sub">A foe has its own sheet that only you can read. Players see only what you choose to show: by default a name like “Foe A”, no picture, no types and no health.</p>
      <div class="fgrid">
        <label class="fld"><span class="fl">Species</span><input type="text" list="dl-species" data-u="bt.foeSp" data-nr value="${u.foeSp}" placeholder="e.g. Houndoom"></label>
        <label class="fld"><span class="fl">Name (optional)</span><input type="text" data-u="bt.foeNick" data-nr value="${u.foeNick}"></label>
        <label class="fld"><span class="fl">How many</span><input type="number" inputmode="numeric" min="1" max="${u.foeSw?40:8}" data-u="bt.foeN" data-nr value="${u.foeN}"></label>
      </div>
      <div class="row"><button class="btn primary sm" data-act="b_addfoe">${u.foeSw?'Add swarm':'Add foe'}</button><button class="btn sm chk" data-act="b_swarm" aria-pressed="${String(!!u.foeSw)}" title="Quick NPC rules: halved HP, and a quarter of the swarm acts each round">As a Swarm</button></div>
      ${u.foeSw?h`<p class="sub">Swarm: each member's max HP is halved, 3/day moves are 2 per combat, and only a quarter of the swarm (rounded up) takes turns each round. Up to 40 members.</p>`:''}</div>
    ${encBattlePanel()}
    ${ccPanel('bat')}
    ${ntBattlePanel()}
  </section>`;
}
/* the Battle page has two views of the same fight: the turn order, and the map */
function battleTab(){
  const sw=bmSwitch();
  return h`${sw}${fcPanel()}${bmAvail()&&S.ui.bt.view==='map'?bmapPanel():battleOrderTab()}`;
}
function battleOrderTab(){
  const b=BT(),gm=!!S.me.admin;
  const ord=btOrder();
  const cur=b.turn&&ord.indexOf(b.turn)>=0?b.turn:'';
  const cv=cur?btInfo(cur,gm):null;
  const ask=S.ui.confirm==='bt|end';
  const mineNow=cv&&(cv.side==='a'||cv.side==='t')&&canEditT(cv.uid);
  return h`<section class="panel btl"><div class="ph"><h2>Battle</h2>${b.on?h`<span class="pill good">Round ${num(b.round)||1}</span>`:h`<span class="pill">${ord.length?'Setting up':'No battle'}</span>`}
      ${gm?h`<div class="acts"><button class="btn primary sm" data-act="b_init" ${ord.length?'':raw('disabled')}>${b.on?'Roll initiative again':'Roll initiative'}</button><button class="btn sm" data-act="b_next" ${b.on?'':raw('disabled')}>Next turn</button>${b.on&&b.mode!=='d20'?h`<button class="btn sm" data-act="b_resort">Re-sort by Speed</button>`:''}<button class="btn sm danger ${ask?'armed':''}" data-act="b_end">${ask?'Tap again to end it for everyone':'End battle'}</button></div>`:''}</div>
    ${gm?h`<div class="row"><div class="seg" role="group" aria-label="How turn order is decided"><button data-act="b_mode" data-v="speed" aria-pressed="${String(b.mode!=='d20')}">Highest Speed first</button><button data-act="b_mode" data-v="d20" aria-pressed="${String(b.mode==='d20')}">d20 + Speed</button></div></div>`:''}
    ${b.on&&cv?h`<p class="bnow ${mineNow?'mine':''}">${mineNow?'Your turn: ':''}<b>${cv.name}</b> is acting${cv.side==='a'?' · '+cv.owner:''}.</p>`:(ord.length?h`<p class="sub">${b.on?'':(gm?'Add everyone, then roll initiative.':'The GM is setting up the battle.')}</p>`:h`<p class="sub">${gm?'Nothing here yet. Add your players’ Pokémon and any foes below.':'No battle is running. When the GM starts one, the turn order shows up here.'}</p>`)}
    ${auPanel()}
    ${ord.length?h`<ol class="bord">${ord.map((cid,i)=>btRow(cid,i,gm,cur===cid))}</ol>`:''}
  </section>
  ${gm?btAddPanel():''}
  <section class="panel"><div class="ph"><h2>Table rolls</h2>${gm?h`<div class="acts"><label class="row"><input type="checkbox" data-act="b_secret" ${S.ui.secret?raw('checked'):''}><span>Roll in secret</span></label><button class="btn sm danger ${S.ui.confirm==='bt|clr'?'armed':''}" data-act="b_clear">${S.ui.confirm==='bt|clr'?'Tap again to clear':'Clear the log'}</button></div>`:''}</div>
    ${rollLogView(30,gm)}</section>
  ${refPanel()}`;
}

/* ----- GM Desk: give a Pokémon, evolution log ----- */
function giveDesk(){
  const ids=tids();
  const g=S.ui.give;
  const uid=g.uid&&S.trainers[g.uid]?g.uid:ids[0];
  return h`<section class="panel"><div class="ph"><h2>Give a Pokémon</h2><span class="pill gm">GM only</span></div>
    <p class="sub">Pick a trainer and a species. Stats, passives and moves fill in from the handbook, and it goes to their party (or the box if the party is full).</p>
    ${ids.length?h`<div class="fgrid">
      <label class="fld"><span class="fl">Trainer</span><select data-u="give.uid">${ids.map(u=>h`<option value="${u}" ${uid===u?raw('selected'):''}>${tName(S.trainers[u])}</option>`)}</select></label>
      <label class="fld"><span class="fl">Species</span><input type="text" list="dl-species" data-u="give.sp" data-nr value="${g.sp}" placeholder="e.g. Riolu"></label>
      <label class="fld"><span class="fl">Nickname (optional)</span><input type="text" data-u="give.nick" data-nr value="${g.nick}"></label>
      <label class="fld wide"><span class="fl">Where or how they got it (optional)</span><input type="text" list="dl-places" data-u="give.caught" data-nr value="${g.caught}"></label>
    </div>
    <div class="row"><button class="btn primary sm" data-act="b_giveMon">Give it</button></div>`:h`<p class="sub">No trainers yet. Players appear here once they create a sheet.</p>`}
  </section>`;
}
function evoLogRows(){
  const rows=[];
  tids().forEach(uid=>{
    monsOf(uid).forEach(m=>{(m.evoLog||[]).forEach(x=>{if(x&&x.at)rows.push({uid,m,at:num(x.at),from:x.from,to:x.to});});});
  });
  return rows.sort((a,b)=>b.at-a.at);
}
function evoLogDesk(){
  const rows=evoLogRows().slice(0,40);
  return h`<section class="panel"><div class="ph"><h2>Evolution log</h2><span class="pill gm">GM only</span></div>
    ${rows.length?h`<ul class="mini-list">${rows.map(r=>h`<li><div class="row sp"><span><span class="mgn">${monIcon(r.m)}<span><b>${mName(r.m)}</b> <span class="sub">${tName(S.trainers[r.uid])}</span><br>${r.from} → <b>${r.to}</b></span></span></span><span class="sub">${new Date(r.at).toLocaleDateString(undefined,{month:'short',day:'numeric'})} · ${hhmm(r.at)}</span></div></li>`)}</ul>
      <p class="sub">Shows evolutions made since this version. An undone evolution is removed from the list.</p>`
      :h`<p class="sub">No evolutions recorded yet. Each one, by a player or by you, is listed here with the date.</p>`}
  </section>`;
}

/* ----- actions ----- */
function batAct(b,e){
  const d=b.dataset;
  if(qnBattleAct(d))return;
  switch(d.act){
    case 'b_open':S.ui.bt.open[d.cid]=!S.ui.bt.open[d.cid];render();break;
    case 'b_hp':btHp(d.cid,num(d.d));break;
    case 'b_dmg':{const n=Math.abs(num(S.ui.bt.amt));if(n)btHp(d.cid,-n);else toast('Type an amount first.');break;}
    case 'b_heal':{const n=Math.abs(num(S.ui.bt.amt));if(n)btHp(d.cid,n);else toast('Type an amount first.');break;}
    case 'b_stg':btStage(d.sc,d.id,d.path,d.k,num(d.d),d.cid);break;
    case 'b_aff':btAffl(d.sc,d.id,d.path,d.a,d.cid);break;
    case 'b_init':btRollInit();break;
    case 'b_next':btNext();break;
    case 'b_resort':btResort();break;
    case 'b_mode':btSetMode(d.v);break;
    case 'b_turn':btTurnTo(d.cid);break;
    case 'b_ord':btMove(d.cid,num(d.d));break;
    case 'b_addally':btAddAlly(d.uid,d.pid);break;
    case 'b_addparty':btAddParty(d.uid);break;
    case 'b_addtrainer':btAddTrainer(d.uid);break;
    case 'b_trainer':S.viewUid=d.uid;setTab('trainer');break;
    case 'b_addfoe':btAddFoe();break;
    case 'b_rm':{
      const key='bt|'+d.cid;
      if(S.ui.confirm===key){S.ui.confirm=null;btRemove(d.cid);}
      else{S.ui.confirm=key;render();setTimeout(()=>{if(S.ui.confirm===key){S.ui.confirm=null;render();}},4000);}
      break;}
    case 'b_end':{
      if(S.ui.confirm==='bt|end'){S.ui.confirm=null;btEnd();}
      else{S.ui.confirm='bt|end';render();setTimeout(()=>{if(S.ui.confirm==='bt|end'){S.ui.confirm=null;render();}},4000);}
      break;}
    case 'b_clear':{
      if(!S.me.admin)break;
      if(S.ui.confirm==='bt|clr'){
        S.ui.confirm=null;
        tids().forEach(u=>{if((S.trainers[u].rolls||[]).length)edit('t',u,'rolls',[]);});
        edit('bt','battle','rolls',[]);
        S.rolls=[];renderRoll();render();
      }else{S.ui.confirm='bt|clr';render();setTimeout(()=>{if(S.ui.confirm==='bt|clr'){S.ui.confirm=null;render();}},4000);}
      break;}
    case 'b_secret':S.ui.secret=!!b.checked;render();break;
    case 'b_reveal':{
      if(!S.me.admin)break;
      edit('gb','battle','foes.'+d.cid+'.sh',Object.assign({},d.v==='all'?SHOW_ALL:SHOW_NONE));
      foePublish(d.cid);render();break;}
    case 'b_give':foeGive(d.cid);break;
    case 'b_kind':foeSetKind(d.cid,d.k||'');break;
    case 'b_mgadd':case 'b_mgform':case 'b_mgreset':case 'b_mgdrop':case 'b_mgo':case 'b_mgr':mgAct('foe',d.act.slice(2),d);break;
    case 'b_giveMon':giveMon();break;
    case 'b_apply':auHit(d.src,d.id,'ap');break;
    case 'b_auhit':auHit(d.src,d.id,d.v);break;
    case 'b_au':auDo(d.cid,d.k,d.a,d.x||'');break;
    case 'b_fmroll':foeRoll(d.cid,num(d.i),false);break;
    case 'b_fmdmg':foeRoll(d.cid,num(d.i),true);break;
    case 'b_mopen':{
      const key=mrKey(d.uid,d.pid,d.i);
      S.ui.mr=S.ui.mr.key===key?{}:{key,tgt:'',eff:'auto',acc:'',dmg:'',crit:false};
      render();break;}
    case 'b_mclose':S.ui.mr={};render();break;
    case 'b_mroll':moveRoll(d.uid,d.pid,num(d.i),false);break;
    case 'b_mdmg':moveRoll(d.uid,d.pid,num(d.i),true);break;
    case 'b_ref':S.ui.ref.open[d.k]=!S.ui.ref.open[d.k];render();break;
    case 'b_card':
      S.viewUid=d.uid;S.ui.open['p'+d.uid+'/'+d.pid]=true;setTab('pokemon');break;
  }
}

