'use strict';
/* Sinnoh Trainer Log · 02-species. The files in js/ are classic scripts that share one scope: load them in order (see index.html). */
/* ---------- species look-up, auto-fill and Mega Evolution ---------- */
/* PTA stats here are a game base stat divided by 15, rounded, never below 1 (Bulbasaur 49/49/65/65/45 becomes 3/3/4/4/3). */
const STAT_DIV=15;
const statFrom=v=>Math.max(1,Math.round(num(v)/STAT_DIV));
const DEXA=DEXN.split('|');
const DEXT=DEXD.split('|');
const REGION_RE=/\b(alola|alolan|galar|galarian|hisui|hisuian|paldea|paldean)\b/i;
const REGION_OF={alola:'Alola',alolan:'Alola',galar:'Galar',galarian:'Galar',hisui:'Hisui',hisuian:'Hisui',paldea:'Paldea',paldean:'Paldea'};
const typePair=a=>[a[0]===''||a[0]==null?'':(TYPES[a[0]]||''),a[1]===''||a[1]==null?'':(TYPES[a[1]]||'')];
const sameArr=(a,b)=>a.length===b.length&&a.every((x,i)=>x===b[i]);
function infoFrom(id,sid,name,types,raw,form){
  const base={};
  STAT_KEYS.forEach((k,i)=>{base[k]=statFrom(raw[i]);});
  return {id,sid,name,types,base,form:form||null};
}
function dexInfo(id){
  const p=DEXT[id-1].split('.');
  return infoFrom(id,id,DEXA[id-1],typePair([+p[0],p[1]===''?'':+p[1]]),p.slice(2).map(Number),null);
}
/* "Lucario", "alolan vulpix", "Zorua-Hisui" and "Shiny Lucario" all resolve; anything else returns null */
function speciesInfo(sp){
  const s=String(sp==null?'':sp);
  if(!s.trim())return null;
  const rm=REGION_RE.exec(s);
  const id=dexId(rm?s.replace(REGION_RE,' '):s);
  if(!id)return null;
  if(rm){
    const reg=REGION_OF[rm[1].toLowerCase()];
    const low=s.toLowerCase();
    const c=FORMS.filter(f=>f.b===id&&f.r===reg);
    const f=c.find(x=>x.x&&low.indexOf(x.x)>=0)||c[0];
    if(f)return infoFrom(id,f.i,f.n,typePair(f.t),f.s,f);
  }
  return dexInfo(id);
}
function infoBySid(sid){
  sid=num(sid);
  if(sid>0&&sid<=DEXT.length)return dexInfo(sid);
  const f=FORMS.find(x=>x.i===sid);
  return f?infoFrom(f.b,f.i,f.n,typePair(f.t),f.s,f):null;
}
const baseList=b=>STAT_KEYS.map(k=>num(b&&b[k]));

/* ---------- Mega forms ---------- */
const megasFor=sp=>{const si=speciesInfo(sp);return si&&!si.form?MEGAS.filter(x=>x.b===si.id):[];};
/* the handbook's own entry for a Mega form (stat bonuses and Mega passive), once the GM has imported it */
const hbMega=f=>{const L=PTA.lists;return (L&&L.megaMap&&L.megaMap.get(dexKey(f)))||null;};
function megaPreset(x,si){
  const bonus={};
  STAT_KEYS.forEach((k,i)=>{bonus[k]=statFrom(x.s[i])-si.base[k];});
  const o={form:x.f,stone:x.st,types:typePair(x.t),bonus,ability:x.a,sid:x.i,auto:true};
  if(x.mv)o.move=x.mv;
  const hb=hbMega(x.f);
  if(hb){
    STAT_KEYS.forEach(k=>{bonus[k]=num(hb.bon&&hb.bon[k]);});
    o.types=[(hb.ty||[])[0]||'',(hb.ty||[])[1]||''];
    if((hb.ps||[]).length)o.ability=hb.ps.map(p=>p.t?p.n+': '+p.t:p.n).join(' · ');
  }
  return o;
}
function pickMega(m,list){
  const k=dexKey(m.item);
  return (k&&list.find(x=>x.st&&k.indexOf(dexKey(x.st))>=0))||list[0];
}
const megaOn=m=>!!(m&&m.mega&&m.megaOn);
const effTypes=m=>{
  const mt=megaOn(m)?(m.mega.types||[]).filter(Boolean):[];
  return mt.length?mt:((m&&m.types)||[]).filter(Boolean);
};
const megaBonus=(m,k)=>megaOn(m)?num(m.mega.bonus&&m.mega.bonus[k]):0;
const megaAllowed=m=>!!(S.megaOk&&S.megaOk['p_'+m.id]);

/* ---------- Key Stone: a trainer carries one, and it works once per battle ---------- */
const KEY_RE=/key\s*-?\s*stone|keystone|mega\s*(bracelet|ring|cuff|charm|glasses|anchor|band|pendant)/i;
const isKeyName=n=>KEY_RE.test(String(n||''));
const hasKey=t=>!!(t&&(t.items||[]).some(x=>isKeyName(x.name)&&(x.qty==null||x.qty===''||num(x.qty)>0)));
const keyCharged=t=>hasKey(t)&&!t.megaUsed;
function keyChip(t,big){
  if(!hasKey(t))return '';
  const ok=!t.megaUsed;
  return h`<span class="kchip ${ok?'ready':'spent'} ${big?'big':''}" title="${ok?'The Key Stone is charged. One Mega Evolution this battle.':'The Key Stone was used this battle. It recharges when the battle ends.'}"><i class="kgem" aria-hidden="true"></i>${ok?'Key Stone ready':'Key Stone spent'}</span>`;
}
function megaChecks(uid,m){
  const t=S.trainers[uid]||{};
  const mg=m.mega||{};
  const kItem=dexKey(m.item);
  let holds,holdLabel;
  if(mg.move){
    holds=(m.moves||[]).some(x=>dexKey(x.name)===dexKey(mg.move));
    holdLabel='Knows '+mg.move;
  }else if(mg.stone){
    holds=!!kItem&&kItem.indexOf(dexKey(mg.stone))>=0;
    holdLabel='Holding '+mg.stone;
  }else{holds=true;holdLabel='No Mega Stone listed';}
  return [
    {ok:holds,label:holdLabel},
    {ok:hasKey(t),label:'Trainer carries a Key Stone'},
    {ok:keyCharged(t),label:'Key Stone not used yet this battle'},
    {ok:megaAllowed(m),label:'GM has approved this Pokémon'}
  ];
}

/* ---------- sprites: the Mega sprite while mega-evolved, then the species sprite, then the base species ---------- */
function monSprites(m){
  const out=[];
  const sy=m.shiny===true;
  if(megaOn(m)&&num(m.mega.sid)>0){
    if(sy)out.push(SPR_BASE+'shiny/'+num(m.mega.sid)+'.png');
    out.push(SPR_BASE+num(m.mega.sid)+'.png');
  }
  const si=speciesInfo(m.species);
  if(si){
    spriteSrcs(si.sid,sy).forEach(u=>out.push(u));
    if(si.sid!==si.id)spriteSrcs(si.id,sy).forEach(u=>out.push(u));
    if(sy){spriteSrcs(si.sid).forEach(u=>out.push(u));}
  }
  return out.filter((u,i)=>out.indexOf(u)===i&&!SPR_BAD.has(u));
}

/* ---------- auto-fill from the species name ---------- */
function fillFromSpecies(uid,pid,force){
  const id=uid+'/'+pid;
  const m=getLocal('p',id);
  const si=m&&speciesInfo(m.species);
  if(!si)return null;
  const prev=m.autoSid?infoBySid(m.autoSid):null;
  const curT=[(m.types||[])[0]||'',(m.types||[])[1]||''];
  const curB=baseList(m.base);
  const defB=curB.every(v=>v===3)||curB.every(v=>v===0);
  const sg=m.autoSig||{};
  const tOk=force||(!curT[0]&&!curT[1])||(prev&&sameArr(curT,prev.types))||sg.ty===hsh(curT.join('/'));
  const bOk=force||defB||(prev&&sameArr(curB,baseList(prev.base)))||sg.ba===hsh(curB.join(','));
  const res={name:si.name,types:si.types,base:si.base,setT:false,setB:false,keepT:!tOk,keepB:!bOk};
  if(tOk&&!sameArr(curT,si.types)){edit('p',id,'types',si.types.slice());res.setT=true;}
  if(bOk&&!sameArr(curB,baseList(si.base))){edit('p',id,'base',Object.assign({},m.base||{},si.base));res.setB=true;}
  if(num(m.autoSid)!==si.sid)edit('p',id,'autoSid',si.sid);
  return res;
}
/* keeps a Pokémon's Mega details in step with its species while they are still the auto-filled ones */
function syncMega(uid,pid,keepOn){
  const id=uid+'/'+pid;
  const m=getLocal('p',id);
  const si=m&&speciesInfo(m.species);
  if(!m)return '';
  const list=si&&!si.form?MEGAS.filter(x=>x.b===si.id):[];
  const cur=m.mega;
  if(!list.length){
    if(cur&&cur.auto){edit('p',id,'mega',null);edit('p',id,'megaOn',false);}
    return '';
  }
  if(!cur||cur.auto){
    const x=keepOn&&cur?(list.find(y=>y.f===cur.form)||pickMega(m,list)):pickMega(m,list);
    const pre=megaPreset(x,si);
    if(cur&&cur.form===x.f&&sameArr(baseList(cur.bonus),baseList(pre.bonus))&&cur.ability===pre.ability&&sameArr((cur.types||[]).filter(Boolean),pre.types.filter(Boolean)))return '';
    edit('p',id,'mega',pre);
    if(m.megaOn&&!keepOn)edit('p',id,'megaOn',false);
    return keepOn&&cur&&cur.form===x.f?'':x.f;
  }
  return '';
}
/* the basic fill: types and base stats worked out from the game's own numbers, used when the handbook has no entry */
function basicSpecies(uid,pid,force){
  const m0=getLocal('p',uid+'/'+pid);
  const si0=m0&&speciesInfo(m0.species);
  if(!si0)return false;
  if(!force&&num(m0.autoSid)===si0.sid&&!m0.autoPta)return true;   /* already filled in for this species */
  const r=fillFromSpecies(uid,pid,force);
  if(!r)return false;
  if(m0.autoPta)edit('p',uid+'/'+pid,'autoPta','');
  const mf=syncMega(uid,pid);
  const bits=[];
  if(r.setT||r.setB||force)bits.push('Filled in '+r.name+': '+r.types.filter(Boolean).join(' / ')+' · '+STATS.map(s=>s[2]+' '+r.base[s[0]]).join(' '));
  if(r.keepT||r.keepB)bits.push('Kept the '+(r.keepT&&r.keepB?'types and stats':r.keepT?'types':'stats')+' you set.');
  if(mf)bits.push(mf+' details added.');
  if(bits.length)toast(bits.join(' '),true);
  return true;
}
/* species box: the handbook entry when there is one (stats, passives, moves), otherwise the basic fill */
function applySpecies(uid,pid,force){
  const m0=getLocal('p',uid+'/'+pid);
  if(!m0)return false;
  const pr=ptaResolve(m0.species);
  if(!pr)return basicSpecies(uid,pid,force);
  const k=ptaKey(pr);
  if(!force&&m0.autoPta===k)return true;
  if(ptaRec(pr)){ptaApply(uid,pid,ptaRec(pr),force);return true;}
  ptaChunk(ptaLetter(k)).then(()=>{
    const m=getLocal('p',uid+'/'+pid);
    if(!m||ptaResolve(m.species)!==pr)return;
    if(ptaRec(pr))ptaApply(uid,pid,ptaRec(pr),force);
    else basicSpecies(uid,pid,force);
    scheduleRender();
  });
  return true;
}
/* a redraw after a blur waits for the pointer to come up, so the click that caused the blur still lands */
function renderSoon(){
  let done=false;
  const go=()=>{if(done)return;done=true;document.removeEventListener('pointerup',go,true);scheduleRender();};
  document.addEventListener('pointerup',go,true);
  setTimeout(go,350);
}
/* the species box was picked from the list, changed, or left: fill in the rest */
function onSpeciesChange(t){
  if(ptaRowFill(t))return true;
  if(foeRowFill(t))return true;
  if(ntRowFill(t))return true;
  const m=/^p\|([^|]+)\/([^|]+)\|species$/.exec(t.dataset.b||'');
  if(!m)return false;
  if(!getLocal('p',m[1]+'/'+m[2]))return true;
  const before=Q.size;
  if(applySpecies(m[1],m[2],false)&&(Q.size!==before||S.noteUntil>Date.now()))renderSoon();
  return true;
}
function fillHint(uid,m){
  const pr=ptaResolve(m.species);
  if(pr){
    const rec=ptaRec(pr);
    if(!rec)ptaWarm(pr);
    const F=rec&&ptaFields(rec);
    if(F&&ptaSame(m,F))return h`<p class="sub wide fillrow">Types, stats, passives and moves match the handbook entry for ${rec.n}.</p>`;
    const ask=S.ui.confirm==='fill|'+m.id;
    return h`<div class="wide fillrow"><button class="btn sm ${ask?'danger armed':''}" data-act="autofill" data-uid="${uid}" data-pid="${m.id}">${ask?'Tap again to replace your passives and moves':'Fill from the handbook: '+(rec?rec.n:pr)}</button></div>`;
  }
  const si=speciesInfo(m.species);
  if(!si)return '';
  const curT=[(m.types||[])[0]||'',(m.types||[])[1]||''];
  const same=sameArr(curT,si.types)&&sameArr(baseList(m.base),baseList(si.base));
  if(same)return h`<p class="sub wide fillrow">Types and base stats match ${si.name}.</p>`;
  return h`<div class="wide fillrow"><button class="btn sm" data-act="autofill" data-uid="${uid}" data-pid="${m.id}">Fill types and base stats from ${si.name}</button></div>`;
}
/* the Fill button: the handbook entry when there is one, and a second tap before it replaces edits the player made */
async function fillClick(uid,pid){
  const id=uid+'/'+pid;
  const m=getLocal('p',id);
  if(!m)return;
  const pr=ptaResolve(m.species);
  if(!pr){basicSpecies(uid,pid,true);render();return;}
  const rec=ptaRec(pr)||(await ptaChunk(ptaLetter(ptaKey(pr))).then(()=>ptaRec(pr)));
  const m2=getLocal('p',id);
  if(!m2)return;
  if(!rec){basicSpecies(uid,pid,true);render();return;}
  const key='fill|'+pid;
  if(ptaWouldReplace(m2,ptaFields(rec))&&S.ui.confirm!==key){
    S.ui.confirm=key;render();
    setTimeout(()=>{if(S.ui.confirm===key){S.ui.confirm=null;render();}},4000);
    return;
  }
  S.ui.confirm=null;
  ptaApply(uid,pid,rec,true);
  render();
}

/* ---------- Pokémon-card panel ---------- */
function bonusText(m){
  const b=(m.mega&&m.mega.bonus)||{};
  const t=STATS.filter(s=>num(b[s[0]])!==0).map(s=>sgn(num(b[s[0]]))+' '+s[2]);
  return t.length?t.join(' · '):'No stat changes';
}
function megaPanel(uid,m,ro){
  const forms=megasFor(m.species);
  const mg=m.mega;
  if(!mg&&!forms.length)return '';
  const pid=m.id,id=uid+'/'+pid;
  if(!mg){
    return h`<section class="megap"><div class="mph"><h4><i class="kgem" aria-hidden="true"></i>Mega Evolution</h4></div>
      <p class="sub">${m.species} can Mega Evolve${forms.length>1?' in '+forms.length+' ways':''}. Add its details to see what it needs.</p>
      ${ro?'':h`<div class="row"><button class="btn sm" data-act="megaAdd" data-uid="${uid}" data-pid="${pid}">Add Mega Evolution details</button></div>`}</section>`;
  }
  const on=megaOn(m);
  const checks=megaChecks(uid,m);
  const can=checks.every(c=>c.ok);
  const lacking=checks.filter(c=>!c.ok).map(c=>c.label);
  const tr=S.trainers[uid]||{};
  const ekey='mg'+id;
  const edOpen=!!S.ui.open[ekey];
  const okGate=megaAllowed(m);
  return h`<section class="megap ${on?'on':''}"><div class="mph"><h4><i class="kgem" aria-hidden="true"></i>Mega Evolution</h4>
      <span class="pill ${on?'mega':can?'good':''}">${on?'Mega-evolved':can?'Ready':'Locked'}</span>${keyChip(tr)}</div>
    <div class="mgsum lcd"><b class="mgf">${mg.form||'Mega form'}</b>
      <span class="mgt">${chipsOf((mg.types||[]).filter(Boolean))}</span>
      <span class="mgb">${bonusText(m)}</span>
      <span class="mga">${mg.ability?'Ability: '+mg.ability:'No ability listed'}</span></div>
    <ul class="chk">${checks.map(c=>h`<li class="${c.ok?'ok':'no'}"><span class="mk" aria-hidden="true">${c.ok?'✓':'✗'}</span><span class="sr">${c.ok?'Met: ':'Not met: '}</span>${c.label}</li>`)}</ul>
    ${ro?'':h`<div class="row">
      ${on?h`<button class="btn sm" data-act="megaRevert" data-uid="${uid}" data-pid="${pid}">Revert to normal</button>`
          :h`<button class="btn sm primary" data-act="megaGo" data-uid="${uid}" data-pid="${pid}" ${can?'':raw('disabled')}>Mega Evolve</button>`}
      <button class="btn sm ghost" data-act="toggle" data-key="${ekey}" aria-expanded="${String(edOpen)}">${edOpen?'Hide details':'Edit details'}</button>
      ${!on&&!can?h`<span class="sub">Needs: ${lacking.join(', ')}</span>`:''}</div>`}
    ${S.me.admin?h`<div class="mgate secret"><span class="fl">GM only · Mega approval</span>
      <div class="row"><div class="seg" role="group" aria-label="Allow Mega Evolution">
        <button data-act="megaGate" data-pid="${pid}" data-v="1" aria-pressed="${String(okGate)}">Allowed</button>
        <button data-act="megaGate" data-pid="${pid}" data-v="0" aria-pressed="${String(!okGate)}">Not allowed</button></div>
        <span class="sub">${okGate?'This Pokémon may Mega Evolve.':'The player cannot Mega Evolve it yet.'}</span></div></div>`:''}
    ${!ro&&edOpen?h`<div class="mgedit">
      ${forms.length>1?h`<div class="row"><span class="fl">Form</span><div class="seg" role="group" aria-label="Mega form">${forms.map((x,i)=>h`<button data-act="megaForm" data-uid="${uid}" data-pid="${pid}" data-n="${i}" aria-pressed="${String(x.f===mg.form)}">${x.f.replace(/^Mega /,'')}</button>`)}</div></div>`:''}
      <div class="fgrid">
        ${fText('Form name','p',id,'mega.form',m)}
        ${fText('Mega Stone','p',id,'mega.stone',m,{list:'dl-items'})}
        ${fSel('Type 1','p',id,'mega.types.0',m,TYPES,{blank:'None'})}
        ${fSel('Type 2','p',id,'mega.types.1',m,TYPES,{blank:'None'})}
        ${fSel('Mega Monster die','p',id,'mega.die',m,DICE,{blank:'Not set'})}
        ${fText('Ability','p',id,'mega.ability',m,{cls:'wide'})}
        ${STATS.map(s=>fNum(s[2]+' bonus','p',id,'mega.bonus.'+s[0],m))}
      </div>
      <div class="row">${forms.length?h`<button class="btn sm" data-act="megaReset" data-uid="${uid}" data-pid="${pid}">Reset to official values</button>`:''}
        <button class="btn sm danger" data-act="megaDrop" data-uid="${uid}" data-pid="${pid}">Remove Mega details</button></div>
    </div>`:''}
  </section>`;
}

/* ---------- actions ---------- */
function megaAdd(uid,pid,n){
  const id=uid+'/'+pid;
  const m=getLocal('p',id);
  const si=m&&speciesInfo(m.species);
  if(!si||si.form)return;
  const list=MEGAS.filter(x=>x.b===si.id);
  if(!list.length)return;
  const x=n!=null&&list[n]?list[n]:pickMega(m,list);
  edit('p',id,'mega',megaPreset(x,si));
  if(m.megaOn)edit('p',id,'megaOn',false);
  render();
}
function megaGo(uid,pid){
  const id=uid+'/'+pid;
  const m=getLocal('p',id);
  if(!m||!m.mega||m.megaOn||!canEditT(uid))return;
  const mm=Object.assign({id:pid},m);
  if(!megaChecks(uid,mm).every(c=>c.ok)){toast('Not ready yet. Check the list on the card.');return;}
  edit('p',id,'megaOn',true);
  edit('t',uid,'megaUsed',true);
  const p={uid,pid};
  S.ui.megaPop=p;
  setTimeout(()=>{if(S.ui.megaPop===p){S.ui.megaPop=null;scheduleRender();}},1800);
  toast(mName(mm)+' Mega Evolved into '+(m.mega.form||'its Mega form')+'!',true);
  render();
}
function megaRevert(uid,pid){
  const id=uid+'/'+pid;
  const m=getLocal('p',id);
  if(!m||!m.megaOn||!canEditT(uid))return;
  edit('p',id,'megaOn',false);
  toast('Back to normal. The Key Stone stays spent until the battle ends.',true);
  render();
}
function megaGate(pid,on){
  if(!S.me.admin)return;
  edit('mg','mega','p_'+pid,!!on);
  render();
}
function endBattle(uid){
  let n=0;
  const t=S.trainers[uid];
  if(t&&t.megaUsed){edit('t',uid,'megaUsed',false);n++;}
  monsOf(uid).forEach(m=>{
    if(m.megaOn){edit('p',uid+'/'+m.id,'megaOn',false);n++;}
    if(STATS.some(s=>stg(m,s[0])))edit('p',uid+'/'+m.id,'stages',{atk:0,def:0,spa:0,spd:0,spe:0});
  });
  return n;
}
function endBattleAll(){
  let n=0;
  tids().forEach(u=>{n+=endBattle(u);});
  n+=ntEndBattle();
  toast(n?'Battle over for everyone. Mega forms reverted and Key Stones recharged.':'Nothing to reset. No Key Stone was spent.',true);
  render();
}

/* ---------- Mega Evolution for Pokémon the GM runs: an NPC trainer's roster, and the foes in a battle ----------
   The GM is the one who decides, so nothing here is locked. The checklist says what the rules normally ask for. */
/* what a Pokémon needs in hand: the stone it holds, or the move it knows (Rayquaza) */
function megaHold(item,moves,mg){
  mg=mg||{};
  if(mg.move)return {ok:(moves||[]).some(x=>dexKey(x.name)===dexKey(mg.move)),label:'Knows '+mg.move};
  if(mg.stone){const k=dexKey(item);return {ok:!!k&&k.indexOf(dexKey(mg.stone))>=0,label:'Holding '+mg.stone};}
  return {ok:true,label:'No Mega Stone listed'};
}
/* o: {kind:'nt'|'foe', sc, id, P (path to the Pokémon), doc, mon, attrs (data attributes naming it), checks, chip, ekey} */
function megaRunPanel(o){
  const m=o.mon,mg=m.mega;
  const forms=megasFor(m.sp);
  if(!mg&&!forms.length)return '';
  const k=o.kind,pre=k==='foe'?'b':'nt';
  if(!mg){
    return h`<section class="megap"><div class="mph"><h4><i class="kgem" aria-hidden="true"></i>Mega Evolution</h4></div>
      <p class="sub">${m.sp} can Mega Evolve${forms.length>1?' in '+forms.length+' ways':''}. Add its details to see what it needs.</p>
      <div class="row"><button class="btn sm" data-act="${pre}_mgadd" ${o.attrs}>Add Mega Evolution details</button></div></section>`;
  }
  const on=!!m.megaOn;
  const lacking=o.checks.filter(c=>!c.ok).map(c=>c.label);
  const edOpen=!!S.ui.open[o.ekey];
  const P=o.P;
  return h`<section class="megap ${on?'on':''}"><div class="mph"><h4><i class="kgem" aria-hidden="true"></i>Mega Evolution</h4>
      ${k==='foe'?h`<span class="pill ${on?'mega':''}">${on?'Mega-evolved':'Not evolved'}</span>`:''}${o.chip||''}</div>
    <div class="mgsum lcd"><b class="mgf">${mg.form||'Mega form'}</b>
      <span class="mgt">${chipsOf((mg.types||[]).filter(Boolean))}</span>
      <span class="mgb">${bonusText(m)}</span>
      <span class="mga">${mg.ability?'Ability: '+mg.ability:'No ability listed'}</span></div>
    <ul class="chk">${o.checks.map(c=>h`<li class="${c.ok?'ok':'no'}"><span class="mk" aria-hidden="true">${c.ok?'✓':'✗'}</span><span class="sr">${c.ok?'Met: ':'Not met: '}</span>${c.label}</li>`)}</ul>
    <div class="row">
      ${k==='foe'?(on?h`<button class="btn sm" data-act="b_mgr" ${o.attrs}>Revert to normal</button>`:h`<button class="btn sm primary" data-act="b_mgo" ${o.attrs}>Mega Evolve</button>`):''}
      ${k==='nt'?h`<button class="btn sm" data-act="nt_mgready" ${o.attrs}>Give it the stone and a Key Stone</button>`:''}
      <button class="btn sm ghost" data-act="toggle" data-key="${o.ekey}" aria-expanded="${String(edOpen)}">${edOpen?'Hide details':'Edit details'}</button>
      ${lacking.length&&!on?h`<span class="sub">Normally needs: ${lacking.join(', ')}. You can still do it.</span>`:''}</div>
    ${edOpen?h`<div class="mgedit">
      ${forms.length>1?h`<div class="row"><span class="fl">Form</span><div class="seg" role="group" aria-label="Mega form">${forms.map((x,i)=>h`<button data-act="${pre}_mgform" ${o.attrs} data-n="${i}" aria-pressed="${String(x.f===mg.form)}">${x.f.replace(/^Mega /,'')}</button>`)}</div></div>`:''}
      <div class="fgrid">
        ${fText('Form name',o.sc,o.id,P+'mega.form',o.doc)}
        ${fText('Mega Stone',o.sc,o.id,P+'mega.stone',o.doc,{list:'dl-items'})}
        ${fSel('Type 1',o.sc,o.id,P+'mega.types.0',o.doc,TYPES,{blank:'None'})}
        ${fSel('Type 2',o.sc,o.id,P+'mega.types.1',o.doc,TYPES,{blank:'None'})}
        ${fSel('Mega Monster die',o.sc,o.id,P+'mega.die',o.doc,DICE,{blank:'Not set'})}
        ${fText('Ability',o.sc,o.id,P+'mega.ability',o.doc,{cls:'wide'})}
        ${STATS.map(s=>fNum(s[2]+' bonus',o.sc,o.id,P+'mega.bonus.'+s[0],o.doc))}
      </div>
      <div class="row">${forms.length?h`<button class="btn sm" data-act="${pre}_mgreset" ${o.attrs}>Reset to official values</button>`:''}
        <button class="btn sm danger" data-act="${pre}_mgdrop" ${o.attrs}>Remove Mega details</button></div>
    </div>`:''}
  </section>`;
}
/* where a Pokémon's sheet lives, so one set of actions serves an NPC's roster and a foe */
function mgTarget(kind,d){
  if(!S.me.admin)return null;
  if(kind==='nt'){
    const nt=NTS()[d.id];
    const i=nt?ntTeam(nt).findIndex(x=>x.id===d.mid):-1;
    if(i<0)return null;
    return {sc:'gt',id:d.id,P:'team.'+i+'.',mon:()=>ntTeam(NTS()[d.id])[i],done:()=>ntPublish(d.id)};
  }
  if(!foeOf(d.cid))return null;
  return {sc:'gb',id:'battle',P:'foes.'+d.cid+'.',mon:()=>foeOf(d.cid),done:()=>foePublish(d.cid)};
}
function mgAct(kind,op,d,again){
  /* the official numbers come from the handbook's Mega list, so wait for it if it has not loaded yet */
  if(!again&&PTA.idx&&!PTA.lists&&/^mg(add|form|reset)$/.test(op)){ptaLists().then(()=>mgAct(kind,op,d,true),()=>mgAct(kind,op,d,true));return;}
  const tg=mgTarget(kind,d);
  if(!tg)return;
  const m=tg.mon();
  if(!m)return;
  const si=speciesInfo(m.sp);
  const list=si&&!si.form?MEGAS.filter(x=>x.b===si.id):[];
  const E=(p,v)=>edit(tg.sc,tg.id,tg.P+p,v);
  switch(op){
    case 'mgadd':{
      if(!list.length)break;
      E('mega',megaPreset(pickMega(m,list),si));
      if(m.megaOn)E('megaOn',false);
      break;}
    case 'mgform':{
      const x=list[num(d.n)];
      if(!x)break;
      E('mega',megaPreset(x,si));
      if(m.megaOn)E('megaOn',false);
      break;}
    case 'mgreset':{
      const x=list.find(y=>y.f===(m.mega&&m.mega.form))||pickMega(m,list);
      if(!x)break;
      E('mega',megaPreset(x,si));
      toast('Reset to the official '+x.f+' values.',true);
      break;}
    case 'mgdrop':
      E('mega',null);
      if(m.megaOn)E('megaOn',false);
      break;
    case 'mgready':{
      const nt=NTS()[d.id];
      if(!m.mega||!nt)break;
      const hold=megaHold(m.item,m.mv,m.mega);
      if(!hold.ok&&m.mega.stone)E('item',m.mega.stone);
      if(!hasKey(nt))edit('gt',d.id,'items',(nt.items||[]).concat([{name:'Key Stone',qty:1,note:''}]));
      toast(ntMonName(m)+' now holds '+(m.mega.stone||'its stone')+', and '+ntName(nt)+' carries a Key Stone.',true);
      break;}
    case 'mgo':{
      if(!m.mega||m.megaOn)break;
      E('megaOn',true);
      E('sh.mega',1);
      if(m.nt&&NTS()[m.nt])edit('gt',m.nt,'megaUsed',true);
      toast(foeLabel(m)+' Mega Evolved into '+(m.mega.form||'its Mega form')+'!',true);
      break;}
    case 'mgr':
      if(!m.megaOn)break;
      E('megaOn',false);
      toast('Back to normal.',true);
      break;
  }
  tg.done();
  render();
}

/* ---------- GM Desk panel ---------- */
function megaDesk(){
  const ids=tids();
  const rows=ids.map(uid=>{
    const mons=monsOf(uid).filter(m=>m.mega||megasFor(m.species).length);
    return {uid,t:S.trainers[uid],mons};
  });
  const any=rows.some(r=>r.mons.length);
  return h`<section class="panel"><div class="ph"><h2>Mega Evolution</h2><span class="pill gm">GM only</span>
      <div class="acts"><button class="btn sm" data-act="endBattleAll">End battle for everyone</button></div></div>
    <p class="sub">A Pokémon can Mega Evolve only if you mark it Allowed. Each trainer can do it once per battle, tied to their Key Stone. Ending the battle reverts every Mega form and recharges every Key Stone.</p>
    ${any?rows.filter(r=>r.mons.length).map(r=>h`<div class="mgd"><div class="row sp"><b>${tName(r.t)}</b>${hasKey(r.t)?keyChip(r.t):h`<span class="pill">No Key Stone</span>`}</div>
      <ul class="mini-list">${r.mons.map(m=>{
        const mm=m.mega;
        const stoneOk=mm&&mm.stone?dexKey(m.item).indexOf(dexKey(mm.stone))>=0:false;
        const ok=megaAllowed(m);
        return h`<li><div class="row sp"><span class="mgn">${monIcon(m)}<span><b>${mName(m)}</b> ${megaOn(m)?h`<span class="pill mega">Mega-evolved</span>`:''}<br><span class="sub">${mm?mm.form+(mm.stone?(stoneOk?' · holding ':' · needs ')+mm.stone:''):'Mega details not added yet'}</span></span></span>
          <span class="seg" role="group" aria-label="Allow ${mName(m)} to Mega Evolve"><button data-act="megaGate" data-pid="${m.id}" data-v="1" aria-pressed="${String(ok)}">Allowed</button><button data-act="megaGate" data-pid="${m.id}" data-v="0" aria-pressed="${String(!ok)}">Not allowed</button></span></div></li>`;})}</ul></div>`)
      :h`<p class="sub">No Pokémon with a Mega form yet. Once a player enters one (Lucario, Gengar, Charizard…), it shows up here.</p>`}
  </section>`;
}
function megaReset(uid,pid){
  const id=uid+'/'+pid;
  const m=getLocal('p',id);
  const si=m&&speciesInfo(m.species);
  if(!si||si.form)return;
  const list=MEGAS.filter(x=>x.b===si.id);
  if(!list.length)return;
  const x=list.find(y=>y.f===(m.mega&&m.mega.form))||pickMega(m,list);
  edit('p',id,'mega',megaPreset(x,si));
  toast('Reset to the official '+x.f+' values.',true);
  render();
}
function megaDrop(uid,pid){
  const id=uid+'/'+pid;
  if(!getLocal('p',id))return;
  edit('p',id,'mega',null);
  edit('p',id,'megaOn',false);
  render();
}
/* typing "Key Stone" in a bag row shows its charge line at once, without redrawing under the cursor */
function liveKeyLine(input,uid,doc){
  const box=input.closest&&input.closest('.item');
  if(!box)return;
  let line=box.querySelector(':scope > .kline');
  if(isKeyName(input.value)){
    const c=keyChip(doc||S.trainers[uid]);
    if(!line){line=document.createElement('div');line.className='kline';box.appendChild(line);}
    line.innerHTML=((c&&c.s)||'')+'<span class="sub">Lets your Pokémon Mega Evolve, once per battle.</span>';
  }else if(line)line.remove();
}

/* ---------- PTA handbook data: species, moves, passives ----------
   The text comes from the PTA 3 handbooks. It is not part of this site's files. The GM imports it once
   (GM Desk, Handbook data) and it is kept in the table's database, where only signed-in members can read it.
   Each document holds one JSON string, so the database has almost nothing to index. */
const PTA={idx:null,chunks:{},subs:{},busy:{},fail:{},lists:null,listsSub:null,listsBusy:null,listsFail:0};
const ptaKey=s=>dexKey(String(s==null?'':s).replace(/\bshiny\b/ig,' '));
const ptaLetter=k=>/^[a-z]/.test(k)?k.charAt(0):'_';
const hsh=v=>{let x=5381;const s=String(v);for(let i=0;i<s.length;i++)x=((x<<5)+x+s.charCodeAt(i))|0;return (x>>>0).toString(36);};
const NAME_RE=/^p\|([^|]+)\/([^|]+)\|(moves|passives)\.(\d+)\.name$/;
const jparse=s=>{try{return JSON.parse(s);}catch(e){return null;}};

/* the list of every species name in the handbook */
function ptaSetIdx(d){
  const names=d&&jparse(d.j);
  if(!Array.isArray(names)||!names.length){PTA.idx=null;ptaFillLists();return;}
  const byKey=new Map(),base=new Map();
  names.forEach(n=>{
    byKey.set(ptaKey(n),n);
    const b=ptaKey(String(n).replace(/\s*\(.*$/,''));
    if(!base.has(b))base.set(b,[]);
    base.get(b).push(n);
  });
  PTA.idx={names,byKey,base,t:num(d.t),ver:num(d.v)};
  ptaFillLists();
}
/* "Pikachu", "shiny pikachu" and "Zigzagoon (Urban)" find an entry; regional forms are left to the basic list */
function ptaResolve(sp){
  const I=PTA.idx;
  if(!I)return null;
  const k=ptaKey(sp);
  if(!k)return null;
  if(I.byKey.has(k))return I.byKey.get(k);
  if(REGION_RE.test(String(sp)))return null;
  const b=I.base.get(k);
  return b&&b.length?b[0]:null;
}
const ptaRec=name=>{const k=ptaKey(name),c=PTA.chunks[ptaLetter(k)];return (c&&c[k])||null;};

/* one document per first letter, read when a species of that letter is first needed */
function ptaChunk(L){
  if(PTA.chunks[L])return Promise.resolve(PTA.chunks[L]);
  if(PTA.busy[L])return PTA.busy[L];
  if(!S.db)return Promise.resolve(null);
  let done;
  const p=new Promise(r=>{done=r;});
  PTA.busy[L]=p;
  let first=true;
  const fin=v=>{if(first){first=false;clearTimeout(to);delete PTA.busy[L];if(!v)PTA.fail[L]=Date.now();done(v);}};
  const to=setTimeout(()=>fin(null),9000);
  if(PTA.subs[L])try{PTA.subs[L]();}catch(e){}
  PTA.subs[L]=S.db.collection('meta').doc('pta_'+L).onSnapshot(s=>{
    if(!s.exists){
      if(s.metadata&&s.metadata.fromCache)return;
      PTA.chunks[L]={};
    }else PTA.chunks[L]=jparse((s.data()||{}).j)||{};
    const was=!first;
    fin(PTA.chunks[L]);
    if(was)scheduleRender();
  },()=>fin(null));
  return p;
}
function ptaWarm(name){
  const L=ptaLetter(ptaKey(name));
  if(PTA.chunks[L]||PTA.busy[L]||(PTA.fail[L]&&Date.now()-PTA.fail[L]<30000))return;
  ptaChunk(L).then(()=>scheduleRender());
}

/* every move, passive and skill, for the name boxes */
function ptaLists(){
  if(PTA.lists)return Promise.resolve(PTA.lists);
  if(PTA.listsBusy)return PTA.listsBusy;
  if(!S.db||!PTA.idx||(PTA.listsFail&&Date.now()-PTA.listsFail<30000))return Promise.resolve(null);
  let done,first=true;
  const p=new Promise(r=>{done=r;});
  PTA.listsBusy=p;
  const fin=v=>{if(first){first=false;clearTimeout(to);PTA.listsBusy=null;if(!v)PTA.listsFail=Date.now();done(v);}};
  const to=setTimeout(()=>fin(null),9000);
  PTA.listsSub=S.db.collection('meta').doc('pta_lists').onSnapshot(s=>{
    if(!s.exists){if(s.metadata&&s.metadata.fromCache)return;fin(null);return;}
    const d=jparse((s.data()||{}).j)||{};
    const mk=a=>{const m=new Map();(a||[]).forEach(x=>m.set(dexKey(x.n),x));return m;};
    PTA.lists={moves:d.moves||[],passives:d.passives||[],skills:d.skills||[],megas:d.megas||[],moveMap:mk(d.moves),passMap:mk(d.passives),megaMap:mk(d.megas),learn:d.learn||null};
    lnApply();
    ptaFillLists();
    ptaResyncMegas();
    fin(PTA.lists);
  },()=>fin(null));
  return p;
}

function ptaFillLists(){
  const ds=$('#dl-species');
  if(ds){
    const have=new Set(DEXN.split('|').map(dexKey));
    const extra=PTA.idx?PTA.idx.names.filter(n=>!have.has(dexKey(n))):[];
    ds.innerHTML=DEXN.split('|').concat(extra).map(n=>'<option value="'+esc(n)+'">').join('');
  }
  const L=PTA.lists;
  const dm=$('#dl-moves'),dp=$('#dl-passives');
  if(dm)dm.innerHTML=L?L.moves.map(x=>'<option value="'+esc(x.n)+'">').join(''):'';
  if(dp)dp.innerHTML=L?L.passives.map(x=>'<option value="'+esc(x.n)+'">').join(''):'';
}

/* Mega details that were filled in automatically pick up the handbook's numbers once they are available (the player's own Pokémon only) */
function ptaResyncMegas(){
  if(!S.me.id||!S.ready)return;
  setTimeout(()=>{
    monsOf(S.me.id).forEach(m=>{if(m.mega&&m.mega.auto&&canEditT(S.me.id))syncMega(S.me.id,m.id,true);});
    scheduleRender();
  },0);
}

/* ---------- a handbook entry as the fields of a Pokémon sheet ---------- */
/* the handbook writes a Monster die as 1d6, 1d8…; a sheet holds it as d6, d8… ('' when the handbook has none) */
function ptaDie(r){
  const m=/^\s*1?\s*d\s*(\d+)\s*$/i.exec(String(r&&r.dm||''));
  const d=m?'d'+m[1]:'';
  return DICE.indexOf(d)>=0?d:'';
}
function ptaFields(r){
  const t=(r.ty||[]).slice(0,2);
  const gloss=x=>x.t&&x.t.length<=48?x.n+' ('+x.t+')':x.n;
  return {
    types:[t[0]||'',t[1]||''],
    base:{atk:num(r.at),def:num(r.df),spa:num(r.sa),spd:num(r.sd),spe:num(r.sp)},
    hp:Math.round(num(r.hp)*hpx()),
    die:ptaDie(r),
    size:SIZES.indexOf(r.sz)>=0?r.sz:'Medium',
    weight:WEIGHTS.indexOf(r.wt)>=0?r.wt:'Medium',
    skills:(r.sk||[]).map(gloss).join(', '),
    passives:(r.ps||[]).map(x=>({name:x.n,text:x.t||''})),
    moves:(r.mv||[]).map(x=>({name:x.n,freq:x.f||'At-Will',kind:x.k||'Physical',range:x.r||'',type:x.t||'Normal',dice:x.d||'',text:x.x||'',used:0}))
  };
}
const sigPs=a=>hsh(JSON.stringify((a||[]).map(x=>[x.name||'',x.text||''])));
const sigMv=a=>hsh(JSON.stringify((a||[]).map(x=>[x.name||'',x.freq||'',x.kind||'',x.range||'',x.type||'',x.dice||'',x.text||''])));
const namesOf=a=>(a||[]).map(x=>dexKey(x.name)).join('|');
function ptaSame(m,F){
  const curT=[(m.types||[])[0]||'',(m.types||[])[1]||''];
  return sameArr(curT,F.types)&&sameArr(baseList(m.base),baseList(F.base))&&num(m.hp&&m.hp.max)===F.hp
    &&m.size===F.size&&m.weight===F.weight&&namesOf(m.passives)===namesOf(F.passives)&&namesOf(m.moves)===namesOf(F.moves);
}
/* true when the Pokémon already has passives or moves of the player's own that a fill would replace */
function ptaWouldReplace(m,F){
  const sig=m.autoSig||{};
  const ps=m.passives||[],mv=m.moves||[];
  const ownPs=ps.length&&sig.ps!==sigPs(ps)&&sigPs(ps)!==sigPs(F.passives);
  const ownMv=mv.length&&sig.mv!==sigMv(mv)&&sigMv(mv)!==sigMv(F.moves);
  return !!(ownPs||ownMv);
}

/* fills in a Pokémon from its handbook entry. Fields the player has changed since the last fill are left alone, unless force is set. */
function ptaApply(uid,pid,rec,force){
  const id=uid+'/'+pid;
  const m=getLocal('p',id);
  if(!m)return false;
  const F=ptaFields(rec);
  const sig=Object.assign({},m.autoSig||{});
  const si=speciesInfo(m.species);
  const prev=m.autoSid?infoBySid(m.autoSid):null;
  const curT=[(m.types||[])[0]||'',(m.types||[])[1]||''];
  const curB=baseList(m.base);
  const hp=m.hp||{};
  const ps=m.passives||[],mv=m.moves||[];
  const was=(k,cur)=>sig[k]===hsh(cur);
  const ok={
    ty:force||(!curT[0]&&!curT[1])||was('ty',curT.join('/'))||!!(prev&&sameArr(curT,prev.types)),
    ba:force||curB.every(v=>v===3)||curB.every(v=>v===0)||was('ba',curB.join(','))||!!(prev&&sameArr(curB,baseList(prev.base))),
    hp:force||!num(hp.max)||(num(hp.max)===20&&num(hp.cur)===20)||was('hp',String(num(hp.max))),
    sz:force||!m.size||m.size==='Medium'||was('sz',m.size),
    wt:force||!m.weight||m.weight==='Medium'||was('wt',m.weight),
    sk:force||!String(m.skills||'').trim()||was('sk',String(m.skills||'')),
    ps:force||!ps.length||sig.ps===sigPs(ps),
    mv:force||!mv.length||sig.mv===sigMv(mv),
    /* a die that is blank, the sheet's untouched d6, or the one a fill set earlier is the handbook's to change; a die the player picked stays */
    di:!!F.die&&(force||!m.die||was('di',String(m.die))||(m.die==='d6'&&!sig.di))
  };
  const kept=[];
  if(ok.ty){edit('p',id,'types',F.types.slice());sig.ty=hsh(F.types.join('/'));}else kept.push('types');
  if(ok.ba){edit('p',id,'base',Object.assign({},m.base||{},F.base));sig.ba=hsh(baseList(F.base).join(','));}else kept.push('base stats');
  if(ok.hp){
    const cur=num(hp.cur)>=num(hp.max)?F.hp:Math.min(num(hp.cur),F.hp);
    edit('p',id,'hp',Object.assign({},hp,{cur,max:F.hp}));sig.hp=hsh(String(F.hp));
    edit('p',id,'hpx',hpx());
  }else kept.push('HP');
  if(ok.di){edit('p',id,'die',F.die);sig.di=hsh(F.die);}else if(F.die&&m.die!==F.die)kept.push('Monster die');
  if(ok.sz){edit('p',id,'size',F.size);sig.sz=hsh(F.size);}else kept.push('size');
  if(ok.wt){edit('p',id,'weight',F.weight);sig.wt=hsh(F.weight);}else kept.push('weight');
  if(ok.sk){edit('p',id,'skills',F.skills);sig.sk=hsh(F.skills);}else kept.push('skills');
  if(ok.ps){edit('p',id,'passives',F.passives.map(x=>Object.assign({},x)));sig.ps=sigPs(F.passives);}else kept.push('passives');
  if(ok.mv){edit('p',id,'moves',F.moves.map(x=>Object.assign({},x)));sig.mv=sigMv(F.moves);}else kept.push('moves');
  edit('p',id,'autoSig',sig);
  edit('p',id,'psRef',psEffect(ok.ps?F.passives:ps));
  edit('p',id,'autoPta',ptaKey(rec.n));
  if(si&&num(m.autoSid)!==si.sid)edit('p',id,'autoSid',si.sid);
  const mf=syncMega(uid,pid);
  const bits=['Filled in '+rec.n+' from the handbook: '+F.types.filter(Boolean).join(' / ')+' · HP '+F.hp+(F.die?' · Monster die '+F.die:'')+' · '+F.passives.length+' passive'+(F.passives.length===1?'':'s')+' · '+F.moves.length+' move'+(F.moves.length===1?'':'s')+'.'];
  if(kept.length)bits.push('Kept your '+kept.join(', ')+'.');
  if(mf)bits.push(mf+' details added.');
  toast(bits.join(' '),true);
  return true;
}

/* typing a move or passive name fills in the rest of its row, when the row is still empty */
function ptaRowFill(t){
  const mt=NAME_RE.exec(t.dataset.b||'');
  if(!mt)return false;
  const uid=mt[1],pid=mt[2],kind=mt[3],i=+mt[4];
  const id=uid+'/'+pid;
  const go=()=>{
    const m=getLocal('p',id);
    const L=PTA.lists;
    const row=m&&(m[kind]||[])[i];
    if(!row||!L)return;
    const def=(kind==='moves'?L.moveMap:L.passMap).get(dexKey(row.name));
    if(!def)return;
    let next,msg;
    if(kind==='moves'){
      if(String(row.text||'').trim()||String(row.dice||'').trim())return;
      next=Object.assign({},row,{name:def.n,freq:def.f||row.freq,kind:def.k||row.kind,range:def.r||row.range,type:def.t||row.type,dice:def.d||'',text:def.x||''});
      msg='Filled in '+def.n+' from the handbook.';
    }else{
      if(String(row.text||'').trim())return;
      next=Object.assign({},row,{name:def.n,text:def.t||''});
      msg='Filled in '+def.n+' from the handbook.';
    }
    edit('p',id,kind,m[kind].map((x,j)=>j===i?next:x));
    toast(msg,true);
    renderSoon();
  };
  if(PTA.lists)go();
  else ptaLists().then(go);
  return true;
}

/* ---------- GM Desk: import ---------- */
/* ---------- House rule: every Pokémon's HP is the handbook number times a multiplier (the GM sets it; the default is double) ---------- */
function hpx(){
  const v=Math.round(Number(S.meta&&S.meta.hpx));
  return v>=1&&v<=5?v:1;
}
/* the multiplier a Pokémon's current HP was set up at. Sheets from before the rule have no mark, which means ×1. */
function hpxOf(m){
  const v=Math.round(num(m&&m.hpx));
  return v>=1?v:1;
}
/* every Pokémon whose HP is at a different multiplier from the table's: players' Pokémon, NPC teams and foes in the battle */
function hpxList(){
  const want=hpx(),out=[];
  const add=(sc,id,path,m,who,cid)=>{
    const hp=m&&m.hp;
    if(!hp||num(hp.max)<=0||hpxOf(m)===want)return;
    /* a blank sheet (20 / 20 and never filled in) has no real HP to scale; filling it in from the handbook already uses the new number */
    if(sc==='p'&&num(hp.max)===20&&num(hp.cur)===20&&!(m.autoSig&&m.autoSig.hp))return;
    out.push({sc,id,path,m,hp,from:hpxOf(m),cid:cid||'',who});
  };
  Object.keys(S.pokemon||{}).forEach(uid=>{
    const box=S.pokemon[uid]||{};
    Object.keys(box).forEach(pid=>add('p',uid+'/'+pid,'',box[pid],(box[pid].nick||box[pid].species||'Pokémon')+' ('+tName(S.trainers[uid])+')'));
  });
  Object.keys(S.gmNt||{}).forEach(nid=>{
    const nt=S.gmNt[nid];
    (Array.isArray(nt&&nt.team)?nt.team:[]).forEach((m,i)=>add('gt',nid,'team.'+i+'.',m,(m.nick||m.sp||'Pokémon')+' ('+ntName(nt)+')'));
  });
  const fo=(S.battleGm&&S.battleGm.foes)||{};
  Object.keys(fo).forEach(cid=>add('gb','battle','foes.'+cid+'.',fo[cid],(fo[cid].nick||fo[cid].sp||'Foe')+' (in the battle)',cid));
  return out;
}
/* current and maximum HP both change by the same factor, so damage already taken stays in proportion */
function hpxApply(){
  if(!S.me.admin)return;
  const want=hpx(),list=hpxList();
  if(!list.length){toast('Every Pokémon is already at ×'+want+'.');return;}
  list.forEach(x=>{
    const k=want/x.from;
    const oldMax=num(x.hp.max),oldCur=num(x.hp.cur);
    const max=Math.max(1,Math.round(oldMax*k));
    const cur=oldCur<=0?0:clamp(Math.round(oldCur*k),1,max);
    edit(x.sc,x.id,x.path+'hp',Object.assign({},x.hp,{cur,max}));
    edit(x.sc,x.id,x.path+'hpx',want);
    if(x.sc==='p'&&x.m.autoSig&&x.m.autoSig.hp===hsh(String(oldMax)))edit('p',x.id,'autoSig.hp',hsh(String(max)));
    if(x.sc==='gb'){
      if(num(x.m.alMax)>0)edit('gb','battle',x.path+'alMax',Math.max(1,Math.round(num(x.m.alMax)*k)));
      foePublish(x.cid);
    }
  });
  toast('Set '+list.length+' Pokémon to ×'+want+' HP.',true);
  render();
}
function hpxAct(b){
  if(b.dataset.act==='hpx_apply')hpxApply();
}
function hpxDesk(){
  const want=hpx(),list=hpxList();
  return h`<section class="panel"><div class="ph"><h2>Pokémon HP</h2><span class="pill gm">GM only</span></div>
    <div class="fgrid">${fNum('HP multiplier for every Pokémon','meta','table','hpx',S.meta,{min:1,max:5})}</div>
    <p class="sub">The handbook’s HP is multiplied by this number: 1 is the book, 2 is double. It is used when a Pokémon is filled in from the handbook, when it evolves, for wild foes and for NPC teams. The Pokédex shows the multiplied number.</p>
    ${list.length?h`<div class="hpxgo" role="status"><p><b>${list.length}</b> Pokémon on the site were set up at a different multiplier.</p>
      <p class="sub">${list.slice(0,8).map(x=>x.who).join(', ')}${list.length>8?' and '+(list.length-8)+' more':''}.</p>
      <p class="sub">Their current and maximum HP both change to match ×${want}, so damage already taken stays in proportion. Do this once, right after you change the number.</p>
      <button class="btn primary" data-act="hpx_apply">Set all ${list.length} to ×${want} HP</button></div>`
      :h`<p class="sub"><b>Every Pokémon on the site is at ×${want} HP.</b> New ones filled in from the handbook use it automatically.</p>`}
  </section>`;
}

/* ---------- GM Desk: bring NPC teams up to the current handbook ----------
   NPC teams were filled in from the handbook when they were imported, so they keep whatever that book said then.
   This scans every team (and each growth stage), shows what would change, and only then writes it. A Pokémon keeps its
   nickname, notes, held item, Mega details and the moves the NPC chose; each of those moves takes its numbers from the handbook. */
S.ui.nr=S.ui.nr||{};
function nrTeams(){
  const out=[];
  Object.keys(S.gmNt||{}).forEach(nid=>{
    const nt=S.gmNt[nid];
    if(!nt)return;
    if(Array.isArray(nt.team)&&nt.team.length)out.push({nid,nt,stage:-1,label:'',list:nt.team});
    (Array.isArray(nt.stages)?nt.stages:[]).forEach((st,j)=>{if(st&&Array.isArray(st.team)&&st.team.length)out.push({nid,nt,stage:j,label:String(st.label||'')||(num(st.bd)+' badges'),list:st.team});});
  });
  return out;
}
async function nrRec(sp){
  const pr=ptaResolve(sp);
  if(!pr)return null;
  return ptaRec(pr)||await ptaChunk(ptaLetter(ptaKey(pr))).then(()=>ptaRec(pr));
}
/* the Pokémon as the current handbook has it, and what differs */
function nrRefresh(m,rec){
  const F=ptaFields(rec);
  const bits=[];
  const curT=[(m.ty||[])[0]||'',(m.ty||[])[1]||''];
  const typeCh=!sameArr(curT,F.types);
  const stCh=!sameArr(baseList(m.base),baseList(F.base));
  const oldMax=num(m.hp&&m.hp.max),oldCur=num(m.hp&&m.hp.cur);
  const hpCh=oldMax!==F.hp;
  const szCh=(m.sz||'Medium')!==F.size||(m.wt||'Medium')!==F.weight;
  const psCh=namesOf((m.ps||[]).map(x=>({name:x.name})))!==namesOf(F.passives);
  const skCh=String(m.sk||'')!==F.skills;
  const nat=new Map(F.moves.map(x=>[dexKey(x.name),x]));
  const L=PTA.lists;
  let mvCh=0,mvMiss=[];
  const mv=(m.mv||[]).map(x=>{
    const k=dexKey(x.name);
    const def=nat.get(k)||(L&&L.moveMap&&L.moveMap.get(k)?(d=>({name:d.n,freq:d.f||'At-Will',kind:d.k||'Physical',range:d.r||'',type:d.t||'Normal',dice:d.d||'',text:d.x||''}))(L.moveMap.get(k)):null);
    if(!def){mvMiss.push(x.name);return x;}
    const nx=Object.assign({},x,{name:def.name,freq:def.freq,kind:def.kind,range:def.range,type:def.type,dice:def.dice,text:def.text});
    if(sigMv([x])!==sigMv([nx]))mvCh++;
    return nx;
  });
  if(typeCh)bits.push('types '+curT.filter(Boolean).join('/')+' → '+F.types.filter(Boolean).join('/'));
  if(stCh)bits.push('base stats');
  if(hpCh)bits.push('HP '+oldMax+' → '+F.hp);
  if(szCh)bits.push('size or weight');
  if(psCh)bits.push('passives');
  if(skCh)bits.push('skills');
  if(mvCh)bits.push(mvCh+' move'+(mvCh===1?'':'s')+' updated');
  const mon=Object.assign({},m,{sp:rec.n,ty:F.types.slice(),sz:F.size,wt:F.weight,base:Object.assign({},m.base||{},F.base),sk:F.skills,ps:F.passives.map(x=>Object.assign({},x)),mv,hpx:hpx(),
    hp:Object.assign({},m.hp||{},{max:F.hp,cur:oldCur<=0?0:(oldMax>0&&oldCur<oldMax?clamp(Math.round(oldCur*F.hp/oldMax),1,F.hp):F.hp)})});
  return {mon,bits,miss:mvMiss};
}
async function nrScan(){
  const u=S.ui.nr;
  if(u.busy||!S.me.admin)return;
  u.busy=true;u.msg='';render();
  try{
    if(!PTA.lists)await ptaLists();
    const rows=[],unk=[];let total=0,same=0;
    for(const g of nrTeams()){
      for(const m of g.list){
        if(!m||!String(m.sp||'').trim())continue;
        total++;
        const rec=await nrRec(m.sp);
        if(!rec){unk.push(String(m.sp)+' ('+ntName(g.nt)+')');continue;}
        const r=nrRefresh(m,rec);
        if(!r.bits.length&&!r.miss.length){same++;continue;}
        rows.push({who:ntName(g.nt)+(g.label?' · '+g.label:''),sp:m.nick?m.nick+' ('+rec.n+')':rec.n,bits:r.bits,miss:r.miss});
      }
    }
    Object.assign(u,{rows,unk,total,same,done:true});
  }catch(e){u.msg='The scan stopped. Try again.';u.bad=true;}
  u.busy=false;render();
}
async function nrApply(){
  const u=S.ui.nr;
  if(u.busy||!S.me.admin)return;
  u.busy=true;render();
  let n=0,npcs=0;
  try{
    if(!PTA.lists)await ptaLists();
    const fix=async list=>{const out=[];for(const m of list){const rec=m&&String(m.sp||'').trim()?await nrRec(m.sp):null;if(!rec){out.push(m);continue;}const r=nrRefresh(m,rec);if(r.bits.length)n++;out.push(r.mon);}return out;};
    for(const nid of Object.keys(S.gmNt||{})){
      const nt=S.gmNt[nid];
      if(!nt)continue;
      let touched=false;
      if(Array.isArray(nt.team)&&nt.team.length){edit('gt',nid,'team',await fix(nt.team));touched=true;}
      if(Array.isArray(nt.stages)&&nt.stages.length){const st=[];for(const s of nt.stages)st.push(s&&Array.isArray(s.team)?Object.assign({},s,{team:await fix(s.team)}):s);edit('gt',nid,'stages',st);touched=true;}
      if(touched)npcs++;
    }
    u.msg='Updated '+n+' Pokémon on '+npcs+' NPCs from the current handbook.';u.bad=false;u.done=false;u.rows=[];
  }catch(e){u.msg='The update stopped part way ('+((e&&e.code)||'error')+'). Scan again to see what is left.';u.bad=true;}
  u.busy=false;render();
}
function nrBackup(){
  if(!S.dl)return;
  const npcs={};
  Object.keys(S.gmNt||{}).forEach(id=>{const nt=S.gmNt[id];if(nt&&(ntTeam(nt).length||(nt.stages||[]).length))npcs[id]={name:nt.name||'',team:nt.team||[],stages:nt.stages||[]};});
  S.dl.save({filename:'sinnoh-npc-teams-backup.json',data:JSON.stringify({format:'sinnoh-npc-teams-backup',v:1,npcs})}).then(()=>{S.ui.nr.msg='Backup saved.';S.ui.nr.bad=false;render();}).catch(e=>{if(!e||e.code!=='declined'){S.ui.nr.msg='The backup could not be saved.';S.ui.nr.bad=true;render();}});
}
function nrAct(b){
  switch(b.dataset.act){
    case 'nr_scan':nrScan();break;
    case 'nr_apply':nrApply();break;
    case 'nr_backup':nrBackup();break;
  }
}
function nrDesk(){
  const u=S.ui.nr;
  const teams=nrTeams().reduce((a,g)=>a+g.list.length,0);
  return h`<section class="panel"><div class="ph"><h2>NPC teams and the handbook</h2><span class="pill gm">GM only</span>
      <div class="acts"><button class="btn sm" data-act="nr_scan" ${u.busy||!PTA.idx?raw('disabled'):''}>${u.busy?'Working…':u.done?'Scan again':'Scan NPC teams'}</button></div></div>
    <p class="sub">NPC teams keep the stats, passives and move details from when they were imported. This checks every NPC Pokémon (${teams} on the site, including growth stages) against the current handbook and shows what would change before anything is written. Nicknames, notes, held items, Mega details and each NPC’s chosen moves are kept.</p>
    ${PTA.idx?'':h`<p class="sub">Import the handbook data above first.</p>`}
    ${u.msg?h`<p class="sub ${u.bad?'bad':''}" role="status">${u.msg}</p>`:''}
    ${u.done?(u.rows.length||u.unk.length?h`<div class="hpxgo" role="status">
      <p><b>${u.rows.length}</b> of ${u.total} NPC Pokémon differ from the handbook${u.same?'; '+u.same+' already match':''}.</p>
      ${u.rows.length?h`<ul class="mini-list">${u.rows.slice(0,40).map(r=>h`<li><b>${r.sp}</b> <span class="sub">${r.who}: ${r.bits.join(', ')||'no changes'}${r.miss.length?'. Not in the handbook, kept as is: '+r.miss.join(', '):''}</span></li>`)}</ul>${u.rows.length>40?h`<p class="sub">…and ${u.rows.length-40} more.</p>`:''}`:''}
      ${u.unk.length?h`<p class="sub">Not found in the handbook, left alone: ${u.unk.slice(0,12).join(', ')}${u.unk.length>12?' and '+(u.unk.length-12)+' more':''}.</p>`:''}
      ${u.rows.length?h`<div class="row"><button class="btn sm" data-act="nr_backup" ${S.dl?'':raw('disabled')}>Download a backup first</button><button class="btn primary" data-act="nr_apply" ${u.busy?raw('disabled'):''}>Update ${u.rows.length} Pokémon</button></div><p class="sub">Their HP uses the table’s ×${hpx()} multiplier, and damage already taken stays in proportion.</p>`:''}</div>`
      :h`<p class="sub"><b>Every NPC Pokémon already matches the handbook.</b></p>`):''}
  </section>`
}

function ptaDesk(){
  const I=PTA.idx,im=S.ui.pta||{};
  const when=I&&I.t?new Date(I.t).toLocaleDateString(undefined,{year:'numeric',month:'short',day:'numeric'}):'';
  return h`<section class="panel"><div class="ph"><h2>Handbook data</h2><span class="pill gm">GM only</span>
      <div class="acts"><button class="btn sm" data-act="ptaPick" ${im.busy?raw('disabled'):''}>${I?'Import again':'Import handbook data'}</button></div></div>
    ${I?h`<p class="sub">${I.names.length} Pokémon from the PTA 3 books are in your database${when?', imported '+when:''}. Type a species and its stats, passives and moves fill in. Type a move or passive name and its details fill in.${I.ver>=2?' Evolution lines are included.':' This copy has no evolution lines. Import again with the newest file to turn evolution on.'}${I.ver>=3?' Contest moves are included.':' This copy has no contest moves. Import again with the newest file to add them.'}${I.ver>=4?' The legendary Pokémon from the Game Master’s Guide are included.':' This copy has no legendary Pokémon. Import again with the newest file to add them.'}</p>`
      :h`<p class="sub">Not imported yet. Choose <b>pta-handbook-data.json</b> from the update download. This fills in stats, passives and moves when someone types a species. The handbook text goes into your database, not into the public site.</p>`}
    ${I?(pxLoad(),h`<p class="sub">${PX.d?'Egg groups and proficiencies: imported ('+Object.keys(PX.d.species||{}).length+' Pokémon). Import pta-extra.json again to replace them.':PX.busy?'Checking for egg groups and proficiencies…':h`Egg groups and proficiencies: not imported yet. Use Import again and pick <b>pta-extra.json</b>.`}</p>`):''}
    ${im.busy?h`<progress class="ptaprog" max="${num(im.total)}" value="${num(im.done)}" aria-label="Import progress"></progress>`:''}
    ${im.msg?h`<p class="sub ${im.bad?'bad':''}" role="status">${im.msg}</p>`:''}
  </section>`;
}
async function ptaImport(file){
  const im=S.ui.pta=S.ui.pta||{};
  const say=(msg,bad)=>{im.msg=msg;im.bad=!!bad;im.busy=false;scheduleRender();};
  let d=null;
  try{d=JSON.parse(await file.text());}catch(e){}
  if(d&&d.format==='sinnoh-pta-extra'&&d.species&&d.lists){
    im.busy=true;im.done=0;im.total=1;im.msg='Importing egg groups and proficiencies…';im.bad=false;scheduleRender();
    try{await S.db.collection('meta').doc('pta_extra').set({v:num(d.v)||1,t:Date.now(),j:JSON.stringify(d)});}
    catch(e){say('The import stopped ('+((e&&e.code)||'error')+'). Run it again.',true);return;}
    pxSet(d);pxLearnMemo.clear();
    say('Imported egg groups and proficiencies for '+Object.keys(d.species).length+' Pokémon, '+Object.keys(d.lists).length+' move groups and '+(d.signature||[]).length+' signature moves.');return;
  }
  if(!d||d.format!=='sinnoh-pta-handbook'||!Array.isArray(d.species)||!d.species.length){say('That is not the handbook data file. Use pta-handbook-data.json from the update download.',true);return;}
  const groups={};
  d.species.forEach(s=>{const k=ptaKey(s&&s.n);if(!k)return;const L=ptaLetter(k);(groups[L]||(groups[L]={}))[k]=s;});
  const letters=Object.keys(groups).sort();
  const cm=Array.isArray(d.contest)&&d.contest.length?d.contest:null;
  im.busy=true;im.done=0;im.total=letters.length+2+(cm?1:0);im.msg='Importing…';im.bad=false;scheduleRender();
  try{
    for(const L of letters){
      await S.db.collection('meta').doc('pta_'+L).set({v:1,j:JSON.stringify(groups[L])});
      im.done++;scheduleRender();
    }
    await S.db.collection('meta').doc('pta_lists').set({v:1,j:JSON.stringify({moves:d.moves||[],passives:d.passives||[],skills:d.skills||[],megas:d.megas||[],learn:(()=>{const pv=PTA.lists&&PTA.lists.learn;return d.learn?{v:1,base:d.learn.mv||{},mv:(pv&&pv.base&&pv.mv)||{}}:pv||null;})()})});
    im.done++;
    if(cm){await S.db.collection('meta').doc('pta_contest').set({v:1,j:JSON.stringify(cm)});im.done++;}
    await S.db.collection('meta').doc('pta_idx').set({v:num(d.v)||1,t:Date.now(),j:JSON.stringify(d.species.map(s=>s.n))});
    im.done++;
  }catch(e){say('The import stopped ('+((e&&e.code)||'error')+'). Some of it may be saved. Run it again to finish.',true);return;}
  say('Imported '+d.species.length+' Pokémon, '+(d.moves||[]).length+' moves, '+(d.passives||[]).length+(cm?' passives, ':' passives and ')+(d.megas||[]).length+' Mega forms'+(cm?' and '+cm.length+' contest moves':'')+'.',false);
}

/* ---------- Evolution, and stat passives ----------
   The Pokédex lists what each species evolves into and what that needs: a stone, a place or time, or nothing
   for a natural evolution. The GM approves an evolution the way a Mega Evolution is approved. Approval is tied to
   the species the Pokémon is today, so it closes by itself once the Pokémon has evolved.
   The Pokédex stat blocks already include their stat passives (Power Up, Agility +2 Speed, and so on), so a passive
   never adds to the stats shown. When a passive that changes stats is added or removed by hand, the card offers
   to move that difference into the Adj boxes. */

/* ----- stat passives ----- */
const EVO_FLAT=(()=>{
  const o={};
  [['Power Up',{atk:1}],['Thick Hide',{def:1}],['Focused',{spa:1}],['Vigilant',{spd:1}],['Nimble',{spe:1}],
   ['Mighty',{atk:2}],['Fortified',{def:2}],['Amplified',{spa:2}],['Invulnerable',{spd:2}],['Volant',{spe:2}]]
    .forEach(a=>{o[dexKey(a[0])]=a[1];});
  return o;
})();
const PS_WORD={'special attack':'spa','special defense':'spd','attack':'atk','defense':'def','speed':'spe'};
/* "+2 Speed" and "+1 Attack, +1 Defense" are stat passives. Anything else is left to the players. */
function psParse(text){
  const t=String(text==null?'':text).trim().replace(/\.$/,'');
  if(!t)return null;
  const e={};
  const parts=t.split(/\s*,\s*/);
  for(let i=0;i<parts.length;i++){
    const m=/^\+(\d)\s+(special attack|special defense|attack|defense|speed)$/i.exec(parts[i].trim());
    if(!m)return null;
    const k=PS_WORD[m[2].toLowerCase()];
    e[k]=(e[k]||0)+(+m[1]);
  }
  return e;
}
function psEffect(list){
  const out={atk:0,def:0,spa:0,spd:0,spe:0};
  (list||[]).forEach(p=>{
    const k=dexKey(p&&p.name);
    if(!k)return;
    let e=EVO_FLAT[k]||psParse(p.text);
    if(!e&&!String(p.text||'').trim()&&PTA.lists){const d=PTA.lists.passMap.get(k);if(d)e=psParse(d.t);}
    if(e)STAT_KEYS.forEach(s=>{out[s]+=num(e[s]);});
  });
  return out;
}
/* what the passives added the last time the Pokémon was filled in from the handbook or evolved */
function psRefOf(m){
  if(m.psRef&&typeof m.psRef==='object')return m.psRef;
  if(m.autoPta&&ptaKey(m.species)===m.autoPta){
    const r=ptaRec(m.autoPta);
    if(r)return psEffect((r.ps||[]).map(x=>({name:x.n,text:x.t||''})));
  }
  return null;
}
function psDelta(m){
  const ref=psRefOf(m);
  if(!ref)return null;
  const cur=psEffect(m.passives);
  const d={};let any=false;
  STAT_KEYS.forEach(k=>{d[k]=cur[k]-num(ref[k]);if(d[k])any=true;});
  return any?d:null;
}
function psHint(uid,m){
  const d=psDelta(m);
  if(!d)return '';
  const bits=STAT_KEYS.filter(k=>d[k]).map(k=>sgn(d[k])+' '+STATS.find(s=>s[0]===k)[1]);
  return h`<div class="pshint" role="status"><span>Passives changed: <b>${bits.join(', ')}</b>. The stat boxes already count the passives the handbook lists, so this difference is not in them yet.</span>
    <span class="row"><button class="btn sm" data-act="psAdj" data-uid="${uid}" data-pid="${m.id}">Add to Adj</button><button class="btn sm ghost" data-act="psKeep" data-uid="${uid}" data-pid="${m.id}">Leave it</button></span></div>`;
}
function psAdj(uid,pid){
  const id=uid+'/'+pid;
  const m=getLocal('p',id);
  const d=m&&psDelta(m);
  if(!d)return;
  STAT_KEYS.forEach(k=>{if(d[k])edit('p',id,'bonus.'+k,num(m.bonus&&m.bonus[k])+d[k]);});
  edit('p',id,'psRef',psEffect(m.passives));
  toast('Added the passive change to the Adj boxes.',true);
  render();
}
function psKeep(uid,pid){
  const id=uid+'/'+pid;
  const m=getLocal('p',id);
  if(!m)return;
  edit('p',id,'psRef',psEffect(m.passives));
  render();
}

/* ----- approval ----- */
const evoGate=m=>{const v=S.megaOk&&S.megaOk['e_'+m.id];return typeof v==='string'?v:'';};
const evoFree=()=>!!(S.megaOk&&S.megaOk.e_open===true);
function evoOk(m,to){
  if(S.me.admin||evoFree())return true;
  const g=evoGate(m).split('|');
  if(!g[0]||g[0]!==ptaKey(m.species))return false;
  return !g[1]||g[1]===ptaKey(to);
}
function monById(pid){
  const ids=tids();
  for(let i=0;i<ids.length;i++){
    const m=monsOf(ids[i]).find(x=>x.id===pid);
    if(m)return {uid:ids[i],m};
  }
  return null;
}
function evoGateSet(pid,on,target){
  if(!S.me.admin)return;
  const f=monById(pid);
  if(!f)return;
  const k=ptaKey(f.m.species);
  edit('mg','mega','e_'+pid,on?(target?k+'|'+ptaKey(target):k):'');
  render();
}
function evoTarget(pid,val){
  if(!S.me.admin)return;
  evoGateSet(pid,true,val);
}
function evoOpenSet(on){
  if(!S.me.admin)return;
  edit('mg','mega','e_open',!!on);
  render();
}

/* ----- what a Pokémon can become ----- */
const evoRecOf=m=>{const pr=ptaResolve(m.species);return pr?ptaRec(pr):null;};
const stoneOf=c=>{const x=/\b([A-Za-z]+) Stone\b/.exec(c||'');return x?x[1]+' Stone':'';};
function bagStone(uid,name){
  const t=S.trainers[uid];
  if(!t||!name)return -1;
  const k=dexKey(name);
  return (t.items||[]).findIndex(x=>x&&dexKey(x.name).indexOf(k)>=0&&(x.qty==null||x.qty===''||num(x.qty)>0));
}
const splitTop=s=>{
  const out=[];let d=0,cur='';
  String(s==null?'':s).split('').forEach(ch=>{
    if(ch==='(')d++;
    if(ch===')')d=Math.max(0,d-1);
    if(ch===','&&!d){if(cur.trim())out.push(cur.trim());cur='';}else cur+=ch;
  });
  if(cur.trim())out.push(cur.trim());
  return out;
};
const skillKey=t=>dexKey(String(t).replace(/\s*\(.*$/,''));

/* the whole change, worked out before anything is written */
function evoPlan(uid,pid,m,toRec,cond){
  const F=ptaFields(toRec);
  const oldRec=evoRecOf(m);
  const oldF=oldRec?ptaFields(oldRec):null;
  /* passives: the new entry's list; the player's own rows win where both have the passive; passives they added themselves stay */
  const curPs=(m.passives||[]).filter(x=>x&&String(x.name||'').trim());
  const oldPs=new Set((oldRec?oldRec.ps:[]).map(x=>dexKey(x.n)));
  const newPs=new Set((toRec.ps||[]).map(x=>dexKey(x.n)));
  const own=curPs.filter(x=>{const k=dexKey(x.name);return !newPs.has(k)&&(!oldRec||!oldPs.has(k));});
  const passives=F.passives.map(x=>{
    const mine=curPs.find(c=>dexKey(c.name)===dexKey(x.name));
    return Object.assign({},mine||x);
  }).concat(own.map(x=>Object.assign({},x))).slice(0,TPL_MAX.passives);
  const gained=F.passives.filter(x=>!curPs.some(c=>dexKey(c.name)===dexKey(x.name))).map(x=>x.name);
  const dropped=curPs.filter(x=>{const k=dexKey(x.name);return !newPs.has(k)&&oldRec&&oldPs.has(k);}).map(x=>x.name);
  /* skills */
  const oldSk=new Set(splitTop(oldF?oldF.skills:'').map(skillKey));
  const newSk=new Set(splitTop(F.skills).map(skillKey));
  const ownSk=splitTop(m.skills).filter(t=>{const k=skillKey(t);return k&&!newSk.has(k)&&(!oldF||!oldSk.has(k));});
  const skills=splitTop(F.skills).concat(ownSk).join(', ');
  /* moves: everything the Pokémon knows is kept, and free slots take the new entry's moves */
  const cur=(m.moves||[]).filter(x=>x&&String(x.name||'').trim());
  const have=new Set(cur.map(x=>dexKey(x.name)));
  const inNew=new Set(F.moves.map(x=>dexKey(x.name)));
  const cands=cur.map(x=>({row:Object.assign({},x),isNew:false,inNew:inNew.has(dexKey(x.name)),sel:true}));
  F.moves.forEach(x=>{if(!have.has(dexKey(x.name)))cands.push({row:Object.assign({},x),isNew:true,inNew:true,sel:false});});
  let free=TPL_MAX.moves-cands.filter(c=>c.sel).length;
  cands.forEach(c=>{if(c.isNew&&free>0){c.sel=true;free--;}});
  const st=stoneOf(cond);
  const stone=st?{name:st,i:bagStone(uid,st)}:null;
  const oldB=baseList(m.base);
  const hp=m.hp||{};
  const rows=[{ab:'HP',o:Math.round(num(hp.max)*hpx()/hpxOf(m)),n:F.hp}].concat(STATS.map((s,i)=>({ab:s[2],o:oldB[i],n:num(F.base[s[0]])})));
  return {uid,pid,from:m.species,to:toRec.n,F,cands,passives,gained,dropped,own:own.map(x=>x.name),skills,stone,rows,cond:cond||''};
}
const evoMoveCount=p=>p.cands.filter(c=>c.sel).length;

async function evoPick(uid,pid,to){
  const id=uid+'/'+pid;
  const m0=getLocal('p',id);
  const m=m0&&Object.assign({id:pid},m0);
  if(!m||!canEditT(uid))return;
  if(megaOn(m)){toast('Revert the Mega form first.');return;}
  if(!evoOk(m,to)){toast('The GM has not approved this evolution yet.');return;}
  const k=ptaKey(to);
  const rec=ptaRec(to)||await ptaChunk(ptaLetter(k)).then(()=>ptaRec(to));
  if(!rec){toast('That species is not in the handbook data.');return;}
  const m2=getLocal('p',id);
  if(!m2)return;
  const from=evoRecOf(m2);
  const opt=((from&&from.ev)||[]).find(o=>ptaKey(o.n)===ptaKey(rec.n));
  S.ui.evo=evoPlan(uid,pid,m2,rec,opt&&opt.c);
  render();
}
function evoMv(n){
  const p=S.ui.evo;
  if(!p||!p.cands[n])return;
  p.cands[n].sel=!p.cands[n].sel;
  render();
}
function evoMvBook(){
  const p=S.ui.evo;
  if(!p)return;
  let left=TPL_MAX.moves;
  p.cands.forEach(c=>{c.sel=c.inNew&&left>0;if(c.sel)left--;});
  render();
}
function evoCancel(){S.ui.evo=null;render();}

const EVO_KEEP=['species','types','base','hp','hpx','size','weight','skills','passives','moves','autoSig','autoPta','autoSid','psRef','mega','megaOn'];
async function evoGo(uid,pid){
  const p=S.ui.evo;
  const id=uid+'/'+pid;
  if(!p||p.uid!==uid||p.pid!==pid)return;
  const m0=getLocal('p',id);
  const m=m0&&Object.assign({id:pid},m0);
  if(!m||!canEditT(uid))return;
  if(megaOn(m)){toast('Revert the Mega form first.');return;}
  if(!evoOk(m,p.to)){toast('The GM has not approved this evolution yet.');return;}
  const rec=ptaRec(p.to);
  if(!rec){toast('That species is not in the handbook data.');return;}
  const mv=p.cands.filter(c=>c.sel);
  if(mv.length>TPL_MAX.moves){toast('A Pokémon can know '+TPL_MAX.moves+' moves. Untick '+(mv.length-TPL_MAX.moves)+'.');return;}
  const F=p.F;
  const nm=mName(m);
  /* a copy of the old sheet, so a wrong pick can be undone */
  const snap={};
  EVO_KEEP.forEach(k=>{snap[k]=m[k]===undefined?null:JSON.parse(JSON.stringify(m[k]));});
  const undo={from:m.species,to:rec.n,at:Date.now(),snap};
  if(p.stone&&p.stone.i>=0){
    const t=S.trainers[uid];
    const it=t&&(t.items||[])[p.stone.i];
    if(it&&dexKey(it.name).indexOf(dexKey(p.stone.name))>=0){
      const q=it.qty;
      undo.stone={i:p.stone.i,qty:q==null?'':q,name:p.stone.name};
      edit('t',uid,'items.'+p.stone.i+'.qty',q==null||q===''?0:Math.max(0,num(q)-1));
    }
  }
  edit('p',id,'species',rec.n);
  edit('p',id,'types',F.types.slice());
  edit('p',id,'base',Object.assign({},m.base||{},F.base));
  const hp=m.hp||{};
  /* an older sheet is brought to the table's multiplier first, so the damage it has taken stays in proportion */
  const hk=hpx()/hpxOf(m);
  const oldMax=num(hp.max)*hk,oldCur=num(hp.cur)*hk;
  const cur=!oldMax?F.hp:(oldCur<=0?0:clamp(F.hp-Math.round(oldMax-oldCur),1,F.hp));
  edit('p',id,'hp',Object.assign({},hp,{cur,max:F.hp}));
  edit('p',id,'hpx',hpx());
  edit('p',id,'size',F.size);
  edit('p',id,'weight',F.weight);
  edit('p',id,'skills',p.skills);
  edit('p',id,'passives',p.passives.map(x=>Object.assign({},x)));
  const moves=mv.map(c=>Object.assign({},c.row));
  edit('p',id,'moves',moves);
  const sig=Object.assign({},m.autoSig||{});
  sig.ty=hsh(F.types.join('/'));sig.ba=hsh(baseList(F.base).join(','));sig.hp=hsh(String(F.hp));sig.sz=hsh(F.size);sig.wt=hsh(F.weight);
  sig.sk=p.skills===F.skills?hsh(F.skills):'';
  sig.ps=sigPs(p.passives)===sigPs(F.passives)?sigPs(F.passives):'';
  sig.mv=sigMv(moves)===sigMv(F.moves)?sigMv(F.moves):'';
  edit('p',id,'autoSig',sig);
  edit('p',id,'autoPta',ptaKey(rec.n));
  const si=speciesInfo(rec.n);
  if(si)edit('p',id,'autoSid',si.sid);
  edit('p',id,'psRef',psEffect(p.passives));
  edit('p',id,'evoUndo',undo);
  edit('p',id,'evoLog',(Array.isArray(m.evoLog)?m.evoLog:[]).concat([{at:undo.at,from:undo.from,to:rec.n}]).slice(-12));
  const mf=syncMega(uid,pid);
  S.ui.evo=null;
  const pop={uid,pid};
  S.ui.evoPop=pop;
  setTimeout(()=>{if(S.ui.evoPop===pop){S.ui.evoPop=null;scheduleRender();}},1800);
  const bits=[nm+' evolved into '+rec.n+'!'];
  if(undo.stone)bits.push('Used up 1 '+undo.stone.name+'.');
  if(mf)bits.push(mf+' details added.');
  toast(bits.join(' '),true);
  render();
}
function evoUndo(uid,pid){
  const id=uid+'/'+pid;
  const m=getLocal('p',id);
  const U=m&&m.evoUndo;
  if(!U||!U.snap)return;
  EVO_KEEP.forEach(k=>{if(k in U.snap)edit('p',id,k,U.snap[k]);});
  if(U.stone&&U.stone.i>=0){
    const t=S.trainers[uid];
    const it=t&&(t.items||[])[U.stone.i];
    if(it&&dexKey(it.name).indexOf(dexKey(U.stone.name))>=0)edit('t',uid,'items.'+U.stone.i+'.qty',U.stone.qty);
  }
  edit('p',id,'evoUndo',null);
  edit('p',id,'evoLog',(Array.isArray(m.evoLog)?m.evoLog:[]).filter(x=>x&&x.at!==U.at));
  toast('Back to '+U.from+'.',true);
  render();
}
function evoKeep(uid,pid){
  if(!getLocal('p',uid+'/'+pid))return;
  edit('p',uid+'/'+pid,'evoUndo',null);
  render();
}
async function evoAny(uid,pid){
  if(!S.me.admin)return;
  const inp=document.querySelector('input[data-evoany="'+pid+'"]');
  const v=inp&&inp.value;
  const pr=ptaResolve(v);
  if(!pr){toast(v&&String(v).trim()?'That species is not in the handbook data.':'Type a species first.');return;}
  evoPick(uid,pid,pr);
}

/* ----- the card ----- */
function condText(o,uid){
  if(!o.c)return 'Natural: it evolves on its own when it feels ready. Training and a good bond help.';
  const st=stoneOf(o.c);
  let s='Needs: '+o.c;
  if(st)s+=bagStone(uid,st)>=0?' (you have one in your bag)':' (none in your bag)';
  return s;
}
function evoPlanView(uid,m,p){
  const n=evoMoveCount(p);
  const over=n>TPL_MAX.moves;
  const F=p.F;
  const oldT=[(m.types||[])[0]||'',(m.types||[])[1]||''].filter(Boolean);
  const typesSame=sameArr(oldT,F.types.filter(Boolean));
  return h`<div class="evplan">
    <div class="mgsum lcd"><b class="mgf">${p.from} → ${p.to}</b>
      <span class="mgt">${chipsOf(F.types.filter(Boolean))}</span>
      <span class="mgb">${typesSame?'Same type':'New type'} · ${F.size} · ${F.weight}</span></div>
    <div class="evstats lcd" role="group" aria-label="Stat changes">${p.rows.map(r=>h`<div class="evs"><span class="sl">${r.ab}</span><span class="evv">${r.o} → <b>${r.n}</b></span><span class="evd ${r.n>r.o?'up':r.n<r.o?'dn':''}">${r.n===r.o?'same':sgn(r.n-r.o)}</span></div>`)}</div>
    <p class="sub">Base stats, HP, size, weight and type come from the new entry. Your nature and Adj boxes stay as they are. Damage already taken carries over.</p>
    ${p.gained.length||p.dropped.length||p.own.length?h`<p class="sub evpass"><b>Passives.</b>${p.gained.length?h` New: ${p.gained.join(', ')}.`:''}${p.dropped.length?h` Gone: ${p.dropped.join(', ')}.`:''}${p.own.length?h` Yours, kept: ${p.own.join(', ')}.`:''}</p>`:h`<p class="sub evpass"><b>Passives.</b> Same as the new entry.</p>`}
    <div class="evmv"><div class="row sp"><span class="fl">Moves</span><span class="sub ${over?'bad':''}">${n} of ${TPL_MAX.moves}</span></div>
      <p class="sub">Your current moves stay unless you untick them. Tap a move to include or leave it out.</p>
      <div class="row evchips">${p.cands.map((c,i)=>h`<button class="btn sm chk" data-act="evoMv" data-n="${i}" aria-pressed="${String(c.sel)}">${c.row.name}${c.isNew?' (new)':''}</button>`)}</div>
      <div class="row"><button class="btn sm ghost" data-act="evoMvBook">Use the handbook’s moves</button></div></div>
    ${p.stone?h`<p class="sub">${p.stone.i>=0?'Uses up 1 '+p.stone.name+' from the bag.':'No '+p.stone.name+' in the bag. The GM can still allow it.'}</p>`:''}
    <div class="row"><button class="btn primary sm" data-act="evoGo" data-uid="${uid}" data-pid="${m.id}" ${over?raw('disabled'):''}>Evolve into ${p.to}</button>
      <button class="btn sm ghost" data-act="evoCancel">Cancel</button>
      ${over?h`<span class="sub bad">Untick ${n-TPL_MAX.moves} move${n-TPL_MAX.moves===1?'':'s'} first.</span>`:''}</div>
  </div>`;
}
function evoPanel(uid,m,ro){
  if(ro||!PTA.idx)return '';
  const pr=ptaResolve(m.species);
  const rec=pr?ptaRec(pr):null;
  if(pr&&!rec)ptaWarm(pr);
  const opts=(rec&&rec.ev)||[];
  const U=m.evoUndo;
  if(!opts.length&&!(U&&U.snap))return '';
  const pid=m.id,id=uid+'/'+pid;
  let plan=S.ui.evo&&S.ui.evo.uid===uid&&S.ui.evo.pid===pid?S.ui.evo:null;
  if(plan&&plan.from!==m.species)plan=null;
  const gm=!!S.me.admin;
  const key=ptaKey(m.species);
  const g=evoGate(m).split('|');
  const gateOn=g[0]===key;
  const free=evoFree();
  const blocked=megaOn(m);
  const okFor=o=>!blocked&&evoOk(m,o.n);
  const anyOk=opts.some(okFor);
  const pill=!opts.length?'':(anyOk?h`<span class="pill good">Ready</span>`:h`<span class="pill">Waiting for the GM</span>`);
  return h`<section class="megap evop"><div class="mph"><h4><i class="egem" aria-hidden="true">»</i>Evolution</h4>${pill}</div>
    ${U&&U.snap?h`<div class="row evundo"><span class="sub">Evolved from ${U.from}.</span><button class="btn sm" data-act="evoUndo" data-uid="${uid}" data-pid="${pid}">Undo evolution</button><button class="btn sm ghost" data-act="evoKeep" data-uid="${uid}" data-pid="${pid}">Keep it</button></div>`:''}
    ${plan?evoPlanView(uid,m,plan):(opts.length?h`
      <ul class="evopts">${opts.map(o=>h`<li><div class="eo-t"><b>${o.n}</b><span class="sub">${condText(o,uid)}</span></div>
        <button class="btn sm primary" data-act="evoPick" data-uid="${uid}" data-pid="${pid}" data-to="${o.n}" ${okFor(o)?'':raw('disabled')}>Evolve</button></li>`)}</ul>
      ${blocked?h`<p class="sub">Revert the Mega form before evolving.</p>`:(!anyOk?h`<p class="sub">Ask your GM to approve an evolution for this Pokémon.</p>`:'')}`:'')}
    ${gm&&!plan?h`<div class="mgate secret"><span class="fl">GM only · Evolution</span>
      ${opts.length?h`<div class="row"><div class="seg" role="group" aria-label="Allow evolution"><button data-act="evoGate" data-pid="${pid}" data-v="1" aria-pressed="${String(gateOn||free)}">Allowed</button><button data-act="evoGate" data-pid="${pid}" data-v="0" aria-pressed="${String(!gateOn&&!free)}">Not allowed</button></div>
        ${opts.length>1?h`<label class="evsel"><span class="sr">Form the player may pick</span><select data-evot="1" data-pid="${pid}"><option value="">Any form</option>${opts.map(o=>h`<option value="${ptaKey(o.n)}" ${gateOn&&g[1]===ptaKey(o.n)?raw('selected'):''}>${o.n} only</option>`)}</select></label>`:''}
        <span class="sub">${free?'Everyone may evolve freely (set in the GM Desk).':gateOn?'The player can evolve this Pokémon'+(g[1]?' into the form you picked':'')+'.':'The player cannot evolve it yet.'}</span></div>`:''}
      <div class="row"><label class="evany"><span class="sr">Evolve into any other species</span><input type="text" list="dl-species" data-evoany="${pid}" placeholder="Any other species, for a special case"></label><button class="btn sm" data-act="evoAny" data-uid="${uid}" data-pid="${pid}">Evolve into it</button></div></div>`:''}
  </section>`;
}

/* ----- GM Desk ----- */
function evoDesk(){
  const I=PTA.idx;
  if(!I)return '';
  const free=evoFree();
  const rows=tids().map(uid=>({uid,t:S.trainers[uid],mons:monsOf(uid).map(m=>{
    const pr=ptaResolve(m.species);
    const rec=pr?ptaRec(pr):null;
    if(pr&&!rec)ptaWarm(pr);
    return {m,rec};
  }).filter(x=>x.rec&&x.rec.ev&&x.rec.ev.length)}));
  const any=rows.some(r=>r.mons.length);
  return h`<section class="panel"><div class="ph"><h2>Evolution</h2><span class="pill gm">GM only</span></div>
    <p class="sub">A player can evolve a Pokémon only after you allow it, and only into the form you pick (or any form it can become). Allowing it is tied to the species the Pokémon is today, so it closes by itself after the evolution. You can always evolve any Pokémon from its own card.</p>
    <div class="row"><div class="seg" role="group" aria-label="Approval for evolution"><button data-act="evoOpen" data-v="0" aria-pressed="${String(!free)}">I approve each one</button><button data-act="evoOpen" data-v="1" aria-pressed="${String(free)}">Players may evolve freely</button></div></div>
    ${I.ver<2?h`<p class="sub bad">The handbook data in your database has no evolution lines yet. Import the newest pta-handbook-data.json below.</p>`:
      (any?rows.filter(r=>r.mons.length).map(r=>h`<div class="mgd"><div class="row sp"><b>${tName(r.t)}</b></div>
        <ul class="mini-list">${r.mons.map(x=>{
          const m=x.m,opts=x.rec.ev;
          const g=evoGate(m).split('|');
          const on=g[0]===ptaKey(m.species);
          return h`<li><div class="row sp"><span class="mgn">${monIcon(m)}<span><b>${mName(m)}</b><br><span class="sub">${m.species} → ${opts.map(o=>o.n).join(', ')}</span></span></span>
            <span class="row">${opts.length>1?h`<label class="evsel"><span class="sr">Form for ${mName(m)}</span><select data-evot="1" data-pid="${m.id}"><option value="">Any form</option>${opts.map(o=>h`<option value="${ptaKey(o.n)}" ${on&&g[1]===ptaKey(o.n)?raw('selected'):''}>${o.n} only</option>`)}</select></label>`:''}
            <span class="seg" role="group" aria-label="Allow ${mName(m)} to evolve"><button data-act="evoGate" data-pid="${m.id}" data-v="1" aria-pressed="${String(on||free)}">Allowed</button><button data-act="evoGate" data-pid="${m.id}" data-v="0" aria-pressed="${String(!on&&!free)}">Not allowed</button></span></span></div></li>`;})}</ul></div>`)
        :h`<p class="sub">No Pokémon that can still evolve yet.</p>`)}
  </section>`;
}

