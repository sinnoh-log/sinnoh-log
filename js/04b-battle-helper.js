'use strict';
/* Sinnoh Trainer Log · 04b-battle-helper. The files in js/ are classic scripts that share one scope: load them in order (see index.html). */
/* ---------- Battle helper (Update 50): the site works out routine effects and offers them; nothing changes until someone accepts ----------
   What it offers:
   - a hit waiting to be taken off the target's HP (the GM for anyone, a player for their own Pokémon);
   - at the start of a turn, what the acting Pokémon's statuses do (stage drops, HP loss, one cure check);
   - a Recharge turn after a move that says so;
   and what it does on its own when a move is rolled: spends a daily use, and counts Normal-type moves for the Alpha rider.
   Each combatant carries a small record, `au`, on its own sheet (a player's Pokémon document, or the foe's sheet in the GM's notes),
   so the usual permissions decide who may accept: {b: battle id, rd: round the ticks belong to, d: {key: 1}, tox, dz, rc, nm: {move: n}, ap: [roll ids], sk: [roll ids]}. */
const AU_HP={Burned:[1,6],Frostbitten:[1,6],Poisoned:[1,10]};
const AU_STG={Burned:'atk',Frostbitten:'spa',Paralyzed:'spe'};
const AU_IMM={Burned:['Fire'],Frostbitten:['Ice'],Paralyzed:['Electric'],Poisoned:['Poison','Steel'],Toxified:['Poison','Steel']};
const AU_NOTE={
  Paralyzed:'When it attacks, roll a Paralysis check: 16+ cures it, 11+ acts normally, 10 or less gives Speed ▼▼.',
  Confused:'Movement is halved. When it attacks, roll a Confusion check: 16+ cures it, 11+ uses the chosen move, 10 or less uses a random move.',
  Drowsy:'Movement is halved, and every move that is not At-Will counts as 1/day.',
  Bound:'It cannot move freely, and its attacks on anyone but the Binder are at disadvantage. Cure check 16, unless the Binder also rolls 16.',
  Entranced:'Movement is halved unless toward the Entrancer, and its attacks on the Entrancer are at disadvantage.',
  Dazed:'Its next attack or skill check is at disadvantage, then the daze ends.',
  Disabled:'One of its moves cannot be used.'
};
const AU_CURE=['Burned','Frostbitten','Paralyzed','Poisoned','Toxified','Confused','Entranced','Drowsy'];
const AU_DZ=[16,14,12,10,8,6];
const AU_RIDER=/at least 3 other Normal-type moves this combat/i;

/* where a combatant's record lives: a player's Pokémon document, or the foe's sheet */
function auLoc(cid){
  const c=btC(cid);
  if(!c)return null;
  if(c.s==='a'){const doc=getLocal('p',c.r);return doc?{sc:'p',id:c.r,pre:'',doc,stKey:'status',uid:String(c.r).split('/')[0]}:null;}
  if(c.s==='f'){const f=S.me.admin?foeOf(cid):null;return f?{sc:'gb',id:'battle',pre:'foes.'+cid+'.',doc:f,stKey:'st',uid:''}:null;}
  return null;
}
const auCan=L=>!!L&&(L.sc==='p'?canEditT(L.uid):!!S.me.admin);
function auGet(cid){
  const L=auLoc(cid),a=L&&L.doc.au;
  const bid=num(BT().bid);
  if(!a||!bid||num(a.b)!==bid)return {b:bid,rd:0,d:{},tox:0,dz:0,rc:0,nm:{},ap:[],sk:[]};
  return {b:bid,rd:num(a.rd),d:Object.assign({},a.d),tox:num(a.tox),dz:num(a.dz),rc:num(a.rc),nm:Object.assign({},a.nm),ap:(a.ap||[]).slice(),sk:(a.sk||[]).slice()};
}
function auSet(cid,fn){
  const L=auLoc(cid);
  if(!auCan(L)||!num(BT().bid))return false;
  const a=auGet(cid);
  fn(a);
  a.ap=a.ap.slice(-20);a.sk=a.sk.slice(-20);
  edit(L.sc,L.id,L.pre+'au',a);
  return true;
}
const auRound=()=>num(BT().round)||1;
const auDone=(a,key)=>a.rd===auRound()&&!!a.d[key];
function auMark(cid,key,more){
  return auSet(cid,a=>{if(a.rd!==auRound()){a.rd=auRound();a.d={};}a.d[key]=1;if(more)more(a);});
}
/* the handbook's name for a status, however it was typed */
const auStatuses=st=>{const seen=[];afflList(st).forEach(x=>{const i=affInfoFor(x);if(i&&seen.indexOf(i[0])<0)seen.push(i[0]);});return seen;};
function auCureDc(s,types,a){
  if(s==='Burned')return types.some(t=>t==='Ice'||t==='Water')?11:16;
  if(s==='Frostbitten')return types.indexOf('Fire')>=0?11:16;
  if(s==='Drowsy')return AU_DZ[Math.min(a.dz,AU_DZ.length-1)];
  return 16;
}

/* what to offer for the combatant acting now. Each item: {key, txt, btns:[[label, action, extra]], skip} */
function auTurnItems(cid){
  const gm=!!S.me.admin;
  const L=auLoc(cid);
  if(!auCan(L))return [];
  const v=btInfo(cid,gm);
  if(!v||v.down)return [];
  const a=auGet(cid),types=v.types||[],out=[];
  if(a.rc&&auRound()>a.rc&&!auDone(a,'rc'))out.push({key:'rc',txt:'Recharge: '+v.name+' cannot act this turn, and attacks against it have advantage.',btns:[['Recharged','rc','']],skip:false});
  const sts=auStatuses(v.status);
  sts.forEach(s=>{
    const imm=(AU_IMM[s]||[]).filter(t=>types.indexOf(t)>=0);
    if(imm.length){out.push({key:s+':imm',txt:s+': '+v.name+' is '+imm.join(' and ')+' type, so it is immune.',btns:[['Remove '+s,'rm',s]],skip:true});return;}
    const k=AU_STG[s];
    if(k&&!auDone(a,s+':stg')){
      const low=stg(L.doc,k)<=-STG_MAX;
      out.push({key:s+':stg',txt:s+': '+STAT_NAME[k]+' ▼ at the start of its turn.'+(low?' It is already at ▼▼▼.':''),btns:low?[]:[['Lower '+STAT_NAME[k],'stg',k]],skip:true});
    }
    const hp=s==='Toxified'?[a.tox+1,8]:AU_HP[s];
    if(hp&&!auDone(a,s+':hp'))out.push({key:s+':hp',txt:s+': loses '+hp[0]+'d'+hp[1]+' HP when it acts.',btns:[['Roll and apply','hp',s]],skip:true});
    if(AU_NOTE[s])out.push({key:'',txt:s+': '+AU_NOTE[s],btns:[],skip:false});
  });
  const cur=sts.filter(s=>AU_CURE.indexOf(s)>=0&&!(AU_IMM[s]||[]).some(t=>types.indexOf(t)>=0));
  if(cur.length&&!auDone(a,'cure'))out.push({key:'cure',txt:'Affliction check: one each turn, to cure one status.',btns:cur.map(s=>['Check '+s+' ('+auCureDc(s,types,a)+'+)','cure',s]),skip:true});
  return out;
}
function auDo(cid,key,act,x){
  const L=auLoc(cid);
  if(!auCan(L)||!BT().on)return;
  const v=btInfo(cid,!!S.me.admin);
  if(!v)return;
  const a=auGet(cid);
  if(key&&auDone(a,key))return;
  const who=v.name;
  if(act==='skip'){auMark(cid,key);render();return;}
  if(act==='rc'){auMark(cid,'rc',z=>{z.rc=0;});toast(who+' has recharged.',true);render();return;}
  if(act==='stg'){
    auMark(cid,key);
    btStage(L.sc,L.id,L.pre+'stages',x,-1,L.sc==='gb'?cid:'');
    toast(who+': '+STAT_NAME[x]+' ▼.',true);return;
  }
  if(act==='hp'){
    const hp=x==='Toxified'?[a.tox+1,8]:AU_HP[x];
    if(!hp)return;
    let t=0;const rs=[];for(let i=0;i<hp[0];i++){const r=rnd(hp[1]);rs.push(r);t+=r;}
    auMark(cid,key,z=>{if(x==='Toxified')z.tox=a.tox+1;});
    btHp(cid,-t);
    toast(who+' loses '+t+' HP to '+x+' ('+hp[0]+'d'+hp[1]+': '+rs.join(', ')+').',true);return;
  }
  if(act==='rm'||act==='cure'){
    let ok=true,msg='';
    if(act==='cure'){
      const dc=auCureDc(x,v.types||[],a),r=rnd(20);
      ok=r>=dc;
      const e=chkEntry(who+': '+x+' cure check',r,'d20 = '+r+', needs '+dc+(ok?' · cured':' · not cured'));
      if(L.sc==='gb')e.gm=true;
      logRoll(e);renderRoll();
      msg=who+' rolls '+r+' against '+dc+': '+(ok?x+' is cured.':'still '+x+'.');
      auMark(cid,'cure',z=>{if(x==='Drowsy')z.dz=ok?0:a.dz+1;if(ok&&x==='Toxified')z.tox=0;});
    }else{auMark(cid,key,z=>{if(x==='Toxified')z.tox=0;});msg=x+' removed from '+who+'.';}
    if(ok){
      const cur=getIn(L.doc,L.stKey);
      const left=afflList(cur).filter(s=>{const i=affInfoFor(s);return !(i&&i[0]===x);}).join(', ');
      edit(L.sc,L.id,L.pre+L.stKey,left);
      if(L.sc==='gb')foePublish(cid);
    }
    toast(msg,true);render();return;
  }
}

/* ----- hits waiting to be applied ----- */
function auRollSeen(r){
  if(r.ap)return r.ap==='skip'?'skip':'ap';
  const c=r.tgt&&btC(r.tgt);
  if(c&&c.s==='a'){const a=auGet(r.tgt);if(a.ap.indexOf(r.id)>=0)return 'ap';if(a.sk.indexOf(r.id)>=0)return 'skip';}
  return '';
}
/* who may accept a roll on its target: the GM always; a player when the target is their own Pokémon */
function auCanHit(r){
  if(r.kind!=='atk'||r.dm==null||!r.tgt)return false;
  const c=btC(r.tgt);
  if(!c)return false;
  if(S.me.admin)return true;
  return c.s==='a'&&canEditT(String(c.r).split('/')[0]);
}
function auHits(){
  const bid=num(BT().bid);
  if(!BT().on)return [];
  return allRolls().slice(0,14).filter(r=>auCanHit(r)&&r.hit!==false&&(!bid||num(r.at)>=bid)&&!auRollSeen(r));
}
function auHit(src,id,how){
  const list=src==='gm'?(BT().rolls||[]):((S.trainers[src]&&S.trainers[src].rolls)||[]);
  const r=list.find(z=>z.id===id);
  if(!r||!auCanHit(Object.assign({},r))||auRollSeen(r))return;
  if(S.me.admin){
    if(how==='skip'){
      const arr=list.map(z=>z.id===id?Object.assign({},z,{ap:'skip'}):z);
      if(src==='gm')edit('bt','battle','rolls',arr);else edit('t',src,'rolls',arr);
      render();
    }else applyRoll(src,id);
    return;
  }
  /* a player, on their own Pokémon: the roll's own record belongs to someone else, so the tick goes on the target */
  if(!auSet(r.tgt,a=>{(how==='skip'?a.sk:a.ap).push(id);}))return;
  if(how!=='skip'){
    const dm=num(r.dm),heal=num(r.heal);
    if(dm)btHp(r.tgt,-dm);
    if(heal)btHp(r.tgt,heal);
    toast((r.tn||'Your Pokémon')+(heal&&!dm?' heals '+heal:' takes '+dm)+'.',true);
  }
  render();
}

/* ----- when a move is rolled: uses, the Alpha rider, Recharge ----- */
/* Returns null to stop the roll, or {x, done()}: x is the move to roll (dice raised when a rider applies), done() records what the roll used. */
function auRollPrep(sc,id,path,x,cid,onlyDmg){
  const mm=/^(\d+)\s*\/\s*day/i.exec(x.freq||'');
  const n=mm?clamp(+mm[1],1,9):0,used=num(x.used);
  if(!onlyDmg&&n&&used>=n){toast((x.name||'That move')+' has no uses left today. Tap one of its dots to clear it if that is wrong.');return null;}
  const inB=!!cid&&!!BT().on&&!!num(BT().bid);
  let mv=x,note='';
  if(inB&&AU_RIDER.test(x.text||'')){
    const nm=auGet(cid).nm,others=Object.keys(nm).filter(k=>k!==dexKey(x.name)).reduce((s,k)=>s+num(nm[k]),0);
    const dm=/^\s*(\d+)\s*d/i.exec(x.dice||'');
    if(others>=3&&dm){mv=Object.assign({},x,{dice:String(x.dice).replace(/^\s*\d+/,String(+dm[1]+2))});note=' +2d power: '+others+' other Normal-type moves used this combat.';}
  }
  return {x:mv,done(){
    if(onlyDmg)return;
    if(n)edit(sc,id,path+'.used',used+1);
    if(inB){
      const rc=/\brecharge\b/i.test(x.text||'');
      if(x.type==='Normal'||rc)auSet(cid,a=>{if(x.type==='Normal'){const k=dexKey(x.name);a.nm[k]=num(a.nm[k])+1;}if(rc)a.rc=auRound();});
      if(rc)note+=' It must recharge on its next turn.';
    }
    if(note)toast((x.name||'The move')+':'+note,true);
  }};
}

/* ----- the page pieces ----- */
function auPill(cid){
  if(!BT().on)return '';
  const L=auLoc(cid);
  if(!L)return '';
  const a=auGet(cid);
  return a.rc?h`<span class="pill wary">Must recharge</span>`:'';
}
function auPanel(){
  const b=BT();
  if(!b.on)return '';
  const cur=b.turn&&btC(b.turn)?b.turn:'';
  const items=cur?auTurnItems(cur):[];
  const hits=auHits();
  if(!items.length&&!hits.length)return '';
  const cv=cur?btInfo(cur,!!S.me.admin):null;
  return h`<div class="aup" role="region" aria-label="Battle helper"><div class="row sp"><b class="auh">Battle helper</b><span class="sub">Nothing changes until you accept.</span></div>
    ${items.length?h`<div class="aug"><span class="fl">${cv?cv.name:'Now acting'} · start of turn</span>
      ${items.map(it=>h`<div class="auc ${it.key?'':'note'}"><span class="autx">${it.txt}</span>${it.btns.length||it.skip?h`<span class="row aub">${it.btns.map(([l,act,x])=>h`<button class="btn sm primary" data-act="b_au" data-cid="${cur}" data-k="${it.key}" data-a="${act}" data-x="${x}">${l}</button>`)}${it.skip?h`<button class="btn sm ghost" data-act="b_au" data-cid="${cur}" data-k="${it.key}" data-a="skip">Skip</button>`:''}</span>`:''}</div>`)}</div>`:''}
    ${hits.length?h`<div class="aug"><span class="fl">Hits waiting</span>
      ${hits.map(r=>h`<div class="auc"><span class="autx"><b>${r.pk||r.who||'Someone'}</b> · ${r.label} → <b>${r.tn||'target'}</b>: ${r.heal&&!r.dm?'heals '+r.heal:r.dm+' damage'}${r.crit?' (critical)':''}${r.ef&&r.ef!=='n'?' · '+EFF_LBL[r.ef]:''}${r.hit==null?' · no accuracy roll':''}</span>
        <span class="row aub"><button class="btn sm primary" data-act="b_auhit" data-src="${r.src}" data-id="${r.id}" data-v="ap">Apply ${r.dm}</button><button class="btn sm ghost" data-act="b_auhit" data-src="${r.src}" data-id="${r.id}" data-v="skip">Skip</button></span></div>`)}</div>`:''}
  </div>`;
}
