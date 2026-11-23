'use strict';
/* Sinnoh Trainer Log · 09e-badge. The files in js/ are classic scripts that share one scope: load them in order (see index.html). */
/* ---------- Badge battles (Update 63): every badge battle is a double battle ----------
   Set up from a Gym Leader's NPC sheet (GM only). Two formats, the challenger's choice:
   Solo: one challenger commands two Pokémon on the field at once against the Leader.
   Tag: two challengers (another player, or a circuit trainer waiting at this Gym) each command one Pokémon on the field,
   against the Leader and the Gym's Head Gym Trainer.
   The tier comes from the challenger's badges; in a tag battle, from whichever partner has more:
   0–1 badges tier 1, 2–4 tier 2, 5–6 tier 3, 7 tier 4 (as glRank). Pokémon a side: solo 2 / 3 / 4 / 6; tag, each trainer 1 / 2 / 2 / 3.
   The Leader uses the team saved for that badge count (Team growth on their sheet) at the tier's rank; the Head Trainer is the NPC
   whose sheet names this Gym (nt.gym), one Quick NPC rank below the Leader, never below Novice.
   Partners: circuit trainers training around this Gym's town for its badge (from the road battle walk), and tracked rivals who
   still need it. A solo win is worth 5 RP more on the rankings ('Won a Gym badge solo').
   Nothing new is stored: the setup lives in S.ui.bdb, keyed by the Leader's NPC id. A Head Trainer's link is nt.gym on their sheet. */
S.ui.bdb=S.ui.bdb||{};
const BDB_SOLO={'1':2,'2':3,'3':4,'4':6};
const BDB_TAG={'1':1,'2':2,'3':2,'4':3};
const BDB_BDS={'1':'0–1 badges','2':'2–4 badges','3':'5–6 badges','4':'7 badges'};
/* the Head Trainer's rank: one below the Leader's at that tier, never below Novice */
const BDB_DOWN={'1':'1','2':'1','3':'2','4':'3'};
const BDB_SHOW=6;
const bdbUi=id=>S.ui.bdb[id]||(S.ui.bdb[id]={open:false,fmt:'solo',a:'',p:'',all:false,pick:{}});
/* a Gym's town without City or Town: Hearthome Gym */
const bdbTown=gk=>trName(RDB_GYM_AT[gk]).replace(/ (City|Town)$/,'');
const bdbPcs=()=>tids().filter(id=>S.trainers[id]&&S.trainers[id].name);
const bdbMonTxt=m=>m?(m.nick&&m.sp&&m.nick!==m.sp?m.nick+' ('+m.sp+')':(m.nick||m.sp||m.species||'Pokémon')):'';
/* the Gym a Leader's sheet runs: chosen on the sheet (nt.gym), else matched by the Leader's name */
function bdbGymOf(nt){
  if(!nt)return null;
  const set=RK_GYMS.find(g=>g.k===nt.gym);
  if(set)return set;
  const n=ntName(nt).toLowerCase(),k=glKey(nt);
  return RK_GYMS.find(g=>{const ln=String(rkGymName(g)||'').toLowerCase().trim();return !!ln&&(n.indexOf(ln)>=0||(!!k&&ln.indexOf(k)>=0));})||null;
}
const bdbHeadId=gk=>ntIds().find(id=>{const nt=NTS()[id];return nt&&nt.gym===gk&&!glIs(nt);})||'';
/* the saved team for a badge count: the highest mark at or below it, else the lowest saved team, else none (the sheet's own team) */
function bdbStage(nt,bd){
  const st=ntStages(nt);
  if(!st.length)return null;
  const at=st.filter(x=>num(x.bd)<=bd);
  return at.length?at[at.length-1]:st[0];
}
const bdbTeamAt=(nt,st)=>st?(Array.isArray(st.team)?st.team:[]):ntTeam(nt);
function bdbPicks(u,role,key,len,n){
  const p=u.pick[role+'|'+key];
  return Array.isArray(p)?p.filter(i=>i<len):Array.from({length:Math.min(n,len)},(_,i)=>i);
}
/* circuit trainers who still need this Gym's badge: here (training around its town) and tracked rivals anywhere else */
function bdbField(gk,aUid){
  const gi=RK_GYMS.findIndex(g=>g.k===gk);
  if(gi<0)return {here:[],rivals:[],W:0};
  return rkWith('gym',()=>{
    const C=rdbCands(),day=rdbDay(),here=[],rivals=[];
    const me=rkRows().find(x=>x.id===aUid),ref=me?me.pos:C.avg;
    C.rows.forEach(r=>{
      if(rdbHeld(r,C.W)[gi]!=null)return;
      const L=rdbLoc(r,C.W,day);
      const x={key:'rk:'+r.id,r,name:r.name,bd:num(r.bd),rival:r.kind==='rival',tn:rdbTierName(r.peak),pos:r.pos,where:L.txt,d:Math.abs(r.pos-ref)};
      if(L.goal===gk&&L.here)here.push(x);else if(x.rival)rivals.push(x);
    });
    here.sort((a,b)=>(b.rival?1:0)-(a.rival?1:0)||a.d-b.d);
    rivals.sort((a,b)=>a.d-b.d);
    return {here,rivals,W:C.W};
  });
}
function bdbPartner(u,F){
  const p=String(u.p||'');
  if(p.indexOf('pc:')===0){const id=p.slice(3),t=S.trainers[id];return t&&t.name&&id!==u.a?{kind:'pc',id,key:p,name:tName(t),bd:badgeCount(t),t}:null;}
  if(p.indexOf('rk:')===0&&F){const x=F.here.concat(F.rivals).find(y=>y.key===p);return x?Object.assign({kind:'rk'},x):null;}
  return null;
}
/* a partner's team, as names */
function bdbPartnerTeam(P){
  if(!P)return [];
  if(P.kind==='pc')return partyOf(P.id).map(mName);
  const nt=P.r.npc&&P.r.npc.nt?NTS()[P.r.npc.nt]:null;
  if(nt)return ntTeam(nt).map(bdbMonTxt);
  const e=(grG().f||{})[P.r.id];
  return e&&Array.isArray(e.sp)?e.sp.slice():[];
}
/* everything the panel and its buttons need, worked out once */
function bdbState(id){
  const nt=NTS()[id],g=bdbGymOf(nt);
  if(!nt||!g)return null;
  const u=bdbUi(id),tag=u.fmt==='tag';
  const A=S.trainers[u.a]&&S.trainers[u.a].name?S.trainers[u.a]:null;
  const F=tag?bdbField(g.k,u.a):null,P=tag&&A?bdbPartner(u,F):null;
  const aBd=A?badgeCount(A):0,tierBd=Math.max(aBd,P?P.bd:0),tier=glRank(tierBd);
  const n=tag?BDB_TAG[tier]:BDB_SOLO[tier];
  const ls=bdbStage(nt,tierBd),lt=bdbTeamAt(nt,ls),lk=ls?ls.id:'cur';
  const hid=tag?bdbHeadId(g.k):'',hn=hid?NTS()[hid]:null,hs=hn?bdbStage(hn,tierBd):null,ht=hn?bdbTeamAt(hn,hs):[],hk=hs?hs.id:'cur';
  return {id,nt,u,g,tag,A,F,P,aBd,tierBd,tier,n,ls,lt,lk,lp:bdbPicks(u,'l',lk,lt.length,n),hid,hn,hs,ht,hk,hp:bdbPicks(u,'h',hk,ht.length,n)};
}
/* put the tier's saved teams on the Leader's and Head Trainer's sheets, with their ranks */
function bdbLoad(id){
  const s=bdbState(id);
  if(!s)return false;
  let ok=true;
  if(s.ls&&s.nt.grown!==s.ls.id)ok=ntStageLoad(id,s.ls.id);
  const lr=glRank(s.tierBd),ln=NTS()[id];
  if(ok&&qnOf(ln)&&ln.q.r!==lr)edit('gt',id,'q.r',lr);
  if(ok&&s.hn){
    if(s.hs&&s.hn.grown!==s.hs.id)ok=ntStageLoad(s.hid,s.hs.id);
    const hr=BDB_DOWN[s.tier],hn=NTS()[s.hid];
    if(ok&&qnOf(hn)&&hn.q.r!==hr)edit('gt',s.hid,'q.r',hr);
  }
  return ok;
}
async function bdbSend(id){
  const s=bdbState(id);
  if(!s)return;
  if(!s.A){toast('Choose the challenger first.');return;}
  if(!bdbLoad(id)){render();return;}
  /* Update 64: the battle takes the badge battle's format, and an NPC partner's Pokémon join as allies */
  const fmt=s.tag?'tag':'double';
  if(btFmt()!==fmt)btSetFmt(fmt);
  const add=(nid,picks,al)=>{const team=ntTeam(NTS()[nid]);let k=0;picks.forEach(i=>{const m=team[i];if(m&&!ntInBattle(nid,m.id)){ntToBattle(nid,m.id,true,al);k++;}});return k;};
  const a=add(id,s.lp),b=s.tag&&s.hid?add(s.hid,s.hp):0;
  let c=0;
  const P=s.P;
  if(s.tag&&P&&P.kind==='rk'){
    const pn=P.r.npc&&P.r.npc.nt&&NTS()[P.r.npc.nt]?P.r.npc.nt:'';
    if(pn)c=add(pn,Array.from({length:s.n},(_,i)=>i),true);
    else{
      const fo=foesOf(),inB=Object.keys(fo).some(k=>fo[k].al&&fo[k].ag===P.r.id&&btC(k));
      const tm=(grTeamOf(P.r,s.F.W)||{}).sp||[];
      if(!inB)for(const sp of tm.slice(0,s.n)){await btAddFoeSp(sp,1,'','',{ally:true,own:P.name,ag:P.r.id});c++;}
    }
  }
  const parts=[];
  if(a)parts.push(a+' Pokémon from '+ntName(s.nt));
  if(b)parts.push(b+' from '+ntName(NTS()[s.hid]));
  if(c)parts.push(c+' of '+P.name+'’s as allies');
  toast(parts.length?'A '+(s.tag?'tag':'double')+' battle: added '+parts.join(', ')+'. Foes stay hidden until you show them. Add the players’ Pokémon on the Battle page.':'Nothing new to add: those Pokémon are already in the battle.',true);
  render();
}
function bdbAct(b){
  if(!S.me.admin)return;
  const d=b.dataset,u=bdbUi(d.id);
  switch(d.act){
    case 'bdb_open':u.open=!u.open;break;
    case 'bdb_fmt':u.fmt=d.v==='tag'?'tag':'solo';break;
    case 'bdb_a':u.a=d.v;if(u.p==='pc:'+d.v)u.p='';break;
    case 'bdb_p':{
      u.p=u.p===d.v?'':d.v;
      /* a field trainer gets their circuit team saved the first time they are chosen */
      if(u.p.indexOf('rk:')===0){
        const g=bdbGymOf(NTS()[d.id]),F=g?bdbField(g.k,u.a):null,x=F?F.here.concat(F.rivals).find(y=>y.key===u.p):null;
        if(x&&!(x.r.npc&&x.r.npc.nt))grTeamOf(x.r,F.W);
      }
      break;}
    case 'bdb_all':u.all=!u.all;break;
    case 'bdb_pick':{
      const s=bdbState(d.id);if(!s)break;
      const role=d.role==='h'?'h':'l',key=role==='h'?s.hk:s.lk,cur=(role==='h'?s.hp:s.lp).slice(),i=num(d.i),j=cur.indexOf(i);
      if(j>=0)cur.splice(j,1);else cur.push(i);
      u.pick[role+'|'+key]=cur.sort((x,y)=>x-y);
      break;}
    case 'bdb_load':{
      const s=bdbState(d.id);
      if(s&&bdbLoad(d.id))toast(ntName(s.nt)+(s.hn?' and '+ntName(s.hn):'')+' now use their tier '+s.tier+' team'+(s.hn?'s':'')+'.',true);
      break;}
    case 'bdb_send':bdbSend(d.id);return;
  }
  render();
}
/* ----- the panel on a Gym Leader's sheet ----- */
function bdbTeamHtml(id,role,nt,team,picks,n,rank,src){
  const short=team.length<n;
  return h`<div class="bdbside"><div class="row sp"><span><b>${ntName(nt)}</b> <span class="pill">${qnRankName(rank)||'Novice'}</span> <span class="sub">${src}</span></span><span class="sub">brings ${n} · ${picks.length} picked</span></div>
    ${team.length?h`<span class="seg bdbmons" role="group" aria-label="${ntName(nt)}’s Pokémon for this battle">${team.map((m,i)=>{const j=picks.indexOf(i);return h`<button data-act="bdb_pick" data-id="${id}" data-role="${role}" data-i="${i}" aria-pressed="${String(j>=0)}">${j>=0?(j+1)+'. ':''}${bdbMonTxt(m)}</button>`;})}</span>`:h`<p class="sub">No Pokémon on this sheet yet.</p>`}
    ${short?h`<p class="sub bdbwarn">Only ${team.length} saved; this tier calls for ${n}. Save a bigger team under Team growth (Edit details).</p>`:picks.length!==n?h`<p class="sub bdbwarn">${picks.length} picked; the tier calls for ${n}.</p>`:''}
  </div>`;
}
function bdbPanel(id,nt){
  if(!S.me.admin||!glIs(nt))return '';
  const u=bdbUi(id),g=bdbGymOf(nt);
  const where=g?bdbTown(g.k)+' Gym · '+g.badge+' Badge':'';
  if(!u.open)return h`<div class="mgate bdb"><div class="row sp"><span><span class="fl">Badge battle</span> <span class="sub">${where?where+' · ':''}a double battle, solo or tag</span></span><button class="btn sm primary" data-act="bdb_open" data-id="${id}" aria-expanded="false">Set up a badge battle</button></div></div>`;
  const head=h`<div class="row sp"><span><span class="fl">Badge battle</span> <span class="pill gm">GM only</span> <span class="sub">${where}</span></span><button class="btn sm ghost" data-act="bdb_open" data-id="${id}" aria-expanded="true">Close</button></div>`;
  if(!g)return h`<div class="mgate bdb">${head}<p class="sub">This Leader’s name doesn’t match a Gym. Choose theirs:</p>
    ${fSel('Gym','gt',id,'gym',nt,RK_GYMS.map(x=>[x.k,bdbTown(x.k)+' Gym · '+x.badge+' Badge']),{blank:'Choose the Gym'})}</div>`;
  const s=bdbState(id),pcs=bdbPcs(),tag=s.tag,A=s.A;
  const seg=(act,v,on,label,extra)=>h`<button data-act="${act}" data-id="${id}" data-v="${v}" aria-pressed="${String(!!on)}">${label}${extra?h` <span class="sub">${extra}</span>`:''}</button>`;
  const has=t=>!!(t&&t.badges&&t.badges[g.k]);
  /* partners */
  let partner='';
  if(tag&&A){
    const F=s.F,others=pcs.filter(x=>x!==u.a),here=u.all?F.here:F.here.slice(0,BDB_SHOW);
    partner=h`<div class="fld"><span class="fl">Partner</span>
      ${others.length?h`<div class="row"><span class="sub">Another player:</span><span class="seg" role="group" aria-label="Partner from the party">${others.map(x=>seg('bdb_p','pc:'+x,u.p==='pc:'+x,tName(S.trainers[x]),rkPl(badgeCount(S.trainers[x]),'badge')+(has(S.trainers[x])?', has it':'')))}</span></div>`:''}
      <p class="sub">Waiting at this Gym: ${F.here.length?rkPl(F.here.length,'circuit trainer')+' training around '+bdbTown(g.k)+' for the '+g.badge+' Badge today.':'nobody from the circuit is training around '+bdbTown(g.k)+' for this badge today.'}</p>
      ${here.length?h`<ul class="bdbfield">${here.map(x=>h`<li><span><b>${x.name}</b>${x.rival?h` <span class="pill">Rival</span>`:''} <span class="sub">${rkPl(x.bd,'badge')} · ${x.tn} · #${x.pos} · ${x.where}</span></span><button class="btn sm ${u.p===x.key?'primary':''}" data-act="bdb_p" data-id="${id}" data-v="${x.key}" aria-pressed="${String(u.p===x.key)}">${u.p===x.key?'Partner ✓':'Choose'}</button></li>`)}</ul>`:''}
      ${F.here.length>BDB_SHOW?h`<button class="btn sm ghost" data-act="bdb_all" data-id="${id}">${u.all?'Show fewer':'Show all '+F.here.length}</button>`:''}
      ${F.rivals.length?h`<div class="row"><span class="sub">Tracked rivals who still need it:</span><span class="seg" role="group" aria-label="Rivals as partners">${F.rivals.map(x=>seg('bdb_p',x.key,u.p===x.key,x.name,rkPl(x.bd,'badge')))}</span></div>`:''}
    </div>`;
  }
  const P=s.P,R=glRank(s.tierBd);
  const setBy=!A?'':tag&&P?(P.bd>s.aBd?P.name+'’s '+rkPl(P.bd,'badge')+' (the partner with more)':tName(A)+'’s '+rkPl(s.aBd,'badge')+(P.bd===s.aBd?' (both hold '+s.aBd+')':' (the partner with more)')):tName(A)+'’s '+rkPl(s.aBd,'badge');
  const lsrc=s.ls?'saved team for '+rkPl(num(s.ls.bd),'badge'):'the team on the sheet (no saved teams)';
  const hsrc=s.hs?'saved team for '+rkPl(num(s.hs.bd),'badge'):'the team on the sheet';
  const gift=num(R)<=2?'the Gym’s move as a single-use TR':'the Gym’s TM';
  return h`<div class="mgate bdb">${head}
    <p class="sub">Every badge battle is a double battle: two Pokémon on the field per side. Solo, the challenger commands both; tag, two challengers command one each against the Leader and the Head Gym Trainer.</p>
    <div class="row"><span class="fl">Format</span><span class="seg" role="group" aria-label="Format">${seg('bdb_fmt','solo',!tag,'Solo')}${seg('bdb_fmt','tag',tag,'Tag')}</span></div>
    <div class="row"><span class="fl">Challenger</span>${pcs.length?h`<span class="seg" role="group" aria-label="Challenger">${pcs.map(x=>seg('bdb_a',x,u.a===x,tName(S.trainers[x]),rkPl(badgeCount(S.trainers[x]),'badge')+(has(S.trainers[x])?', has it':'')))}</span>`:h`<span class="sub">No player characters yet.</span>`}</div>
    ${A&&has(A)?h`<p class="sub bdbwarn">${tName(A)} already holds the ${g.badge} Badge. For a rematch, use Gym battle under Road battles on the Calendar.</p>`:''}
    ${partner}
    ${tag&&P&&P.kind==='pc'&&has(P.t)?h`<p class="sub bdbwarn">${P.name} already holds the ${g.badge} Badge.</p>`:''}
    ${!A?h`<p class="sub">Choose the challenger to see the tier and the teams.</p>`:h`
    <div class="bdbtier"><b>Tier ${s.tier}</b> <span class="sub">(${BDB_BDS[s.tier]}), set by ${setBy}.</span>
      <div>${tag?h`<b>Tag:</b> each trainer brings ${s.n}, one on the field each.${P?'':' Choose a partner.'}`:h`<b>Solo:</b> ${s.n} Pokémon a side, two on the field at once.`}</div></div>
    ${bdbTeamHtml(id,'l',nt,s.lt,s.lp,s.n,R,lsrc)}
    ${tag?(s.hn?bdbTeamHtml(id,'h',s.hn,s.ht,s.hp,s.n,BDB_DOWN[s.tier],hsrc+' · one rank below the Leader'):h`<div class="bdbside"><p class="sub bdbwarn">This Gym has no Head Gym Trainer yet. Import the Head Gym Trainers pack, or set “Head Gym Trainer at” in any NPC’s Edit details.</p></div>`):''}
    ${tag&&P?h`<div class="bdbside ally"><div class="row sp"><span><b>${P.name}</b> <span class="sub">partner · ${rkPl(P.bd,'badge')}${P.kind==='rk'?' · '+P.tn:''}</span></span><span class="sub">brings ${s.n}</span></div>
      <p>${bdbPartnerTeam(P).join(', ')||'No team saved yet.'}</p>
      ${P.kind==='rk'?h`<p class="sub">Send to the battle adds the first ${s.n} as allies on the players’ side. Only you run them.</p>`:''}</div>`:''}
    <p class="sub bdbstake">${tag?h`<b>A win:</b> both partners take the ${g.badge} Badge and ${gift}; +25 RP each (Won a Gym badge). The Leader’s personal gift goes to whoever impressed them. <b>A loss:</b> −10 RP each. Log an NPC partner on the rankings too: a logged badge counts toward their badges.`
      :h`<b>A win:</b> the ${g.badge} Badge and ${gift}; +30 RP (log Won a Gym badge solo: the +25 for the badge and +5 for winning alone). <b>A loss:</b> −10 RP.`}</p>
    <div class="row"><button class="btn sm" data-act="bdb_load" data-id="${id}">Load these teams</button><button class="btn sm primary" data-act="bdb_send" data-id="${id}">Send to the battle</button><span class="sub">Loading swaps in the saved team, so save any damage or changes to the current one first.</span></div>`}
    <details class="clrd"><summary>How badge battles work</summary><ul class="tprules">
      <li><b>Double battles.</b> Every badge battle puts two Pokémon on the field per side. Solo: the challenger commands both against the Leader. Tag: two challengers command one each, against the Leader and the Head Gym Trainer.</li>
      <li><b>Tier.</b> The challenger’s badges set it (in a tag battle, the partner with more): 0–1 tier 1, 2–4 tier 2, 5–6 tier 3, 7 tier 4. The Leader uses the team saved for that count, at Novice, Skilled, Experienced or Ace.</li>
      <li><b>Size.</b> Solo: 2, 3, 4 or 6 Pokémon a side. Tag: each trainer brings 1, 2, 2 or 3.</li>
      <li><b>Head Gym Trainer.</b> One Quick NPC rank below the Leader (never below Novice), with a team saved for each tier.</li>
      <li><b>Partners.</b> Another player, or a circuit trainer training around this Gym’s town for its badge. Tracked rivals who still need it can partner from anywhere.</li>
      <li><b>Stakes.</b> Each winner takes the badge and the Gym’s move; +25 RP each, +30 for a solo win. A loss is −10 RP each.</li>
    </ul></details>
  </div>`;
}
