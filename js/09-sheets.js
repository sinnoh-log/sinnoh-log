'use strict';
/* Sinnoh Trainer Log · 09-sheets. The files in js/ are classic scripts that share one scope: load them in order (see index.html). */
/* ---------- overview ---------- */
/* the trainer ID card: a number and a header colour worked out from the trainer's id, a front with the usual summary and a back with the combat stats */
const idHash=u=>{let n=7;String(u).split('').forEach(c=>{n=(n*31+c.charCodeAt(0))%1000003;});return n;};
const idNo=u=>{const n=idHash(u);return 'No. '+String(n%10000).padStart(4,'0')+'-'+String(Math.floor(n/10)%10000).padStart(4,'0');};
const ID_STAT=[['atk','ATK'],['def','DEF'],['spa','SPA'],['spd','SPD'],['spe','SPE']];
/* ---------- the League Card (overview): the trainer's official challenger card, front and back ---------- */
const LC_ACC=[['#E58FB0','Rose'],['#7FD69A','Leaf green'],['#8FC7E5','Ice blue'],['#F2C230','Gold'],['#F0904A','Ember orange'],['#B79CF2','Violet'],['#5ED0C8','Teal'],['#E85A5A','Red'],['#D9D4DC','Silver']];
const lcAcc=(uid,t)=>{const c=String(t.kitCol||'');return LC_ACC.some(x=>x[0]===c)?c:LC_ACC[idHash(uid)%LC_ACC.length][0];};
const lcNo=t=>{const n=String(t.kitNo==null?'':t.kitNo).replace(/\D/g,'').slice(0,3);return n?n.padStart(3,'0'):'---';};
const lcTier=n=>n>=7?'VANGUARD':n>=5?'WARDEN':n>=2?'PATHFINDER':'ROOKIE';
/* which circuits a trainer is on (Update 38): everyone is on both until a box on the sheet says otherwise */
const onGym=t=>!(t&&t.noGym),onCon=t=>!(t&&t.noCon),onAny=t=>onGym(t)||onCon(t);
function lcStats(uid,t){
  let pos=0,posC=0,w=0,l=0,ce=0,cr=0;
  try{const g=rkWith('gym',()=>rkRows().find(x=>x.id===uid));if(g){pos=g.pos;const r=g.rec||{};w=num(r.w);l=num(r.l);}
    const c=rkWith('con',()=>rkRows().find(x=>x.id===uid));if(c){posC=c.pos;const cc=c.con||{};ce=num(cc.e);cr=num(cc.r);}}catch(e){}
  const halls=ribHalls();
  if(!onGym(t))pos=posC;
  return {pos,w,l,ce,rib:Math.max(ribCount(t,halls),cr),need:ribNeedEff(halls)};
}
function trainerCard(uid){
  const t=S.trainers[uid];
  if(!onAny(t))return idCard(uid);
  const gy=onGym(t),cn=onCon(t);
  const mons=partyOf(uid);
  const bg=t.badges||{};
  const back=!!S.ui.flip[uid];
  const nb=badgeCount(t),st=lcStats(uid,t),no=lcNo(t),acc=lcAcc(uid,t);
  const lead=mons[0];
  const sp=(t.sponsors||[]).map(x=>x&&x.name).filter(Boolean);
  const lbl=(k,v)=>h`<div class="lcf"><span>${k}</span><b>${v}</b></div>`;
  return h`<article class="panel tcard lcard" ${raw('style="--acc:'+acc+'"')} aria-label="League Card for ${tName(t)}"><div class="lcin">
    ${back?h`<div class="lchead"><div><b class="lcnm">${tName(t)}</b><span class="lcsm">${no!=='---'?'No. '+no+' · ':''}${[t.cls,t.adv].filter(Boolean).join(' · ')||'Challenger'}</span></div>${no!=='---'?h`<b class="lcbig">${no}</b>`:''}</div>
      <div class="lcback">
        <div class="lcboxes">${(gy&&cn?[['Battles',st.w+st.l],['Wins',st.w],['Contests',st.ce],['Rank',st.pos?'#'+st.pos:'—']]:gy?[['Battles',st.w+st.l],['Wins',st.w],['Rank',st.pos?'#'+st.pos:'—']]:[['Contests',st.ce],['Ribbons',st.rib],['Rank',st.pos?'#'+st.pos:'—']]).map(([k,v])=>h`<div><span>${k}</span><b>${v}</b></div>`)}</div>
        ${gy?h`<div class="lcsec"><span class="lck">Badge band</span><div class="lcband">${BADGES.map(b=>h`<i class="${bg[b[0]]?'on':''}" ${raw('style="--bc:'+BADGE_COL[b[0]]+'"')} title="${b[1]} Badge${bg[b[0]]?'':' (not yet)'}"></i>`)}</div></div>`:''}
        <div class="lcsec"><span class="lck">Team</span><div class="lcteam">${mons.length?mons.map(m=>h`<span>${mName(m)}</span>`):h`<span class="lcempty">No Pokémon on hand</span>`}</div></div>
        <div class="lcgrid">${lbl('Endorsed by',t.endorser||'Not yet')}${lbl('Agency',String(t.agency||'').trim()||'Independent')}${lbl('Sponsors',sp.length?sp.slice(0,3).join(', '):'None yet')}${lbl('Signature play',t.sigPlay||'Not yet')}</div>
        ${t.quote?h`<p class="lcq">“${t.quote}”</p>`:''}
      </div>
      <div class="lcfoot"><span>Sinnoh League · Official ${gy?'challenger':'coordinator'} card</span><span>Season ${num(S.meta.season)||1}${no!=='---'?' · '+no+' / 999':''}</span></div>`
    :h`<div class="lchead"><span class="lcbrand"><svg width="18" height="21" viewBox="0 0 26 30" aria-hidden="true"><path d="M13 1 L25 6 V15 C25 22 19 27 13 29 C7 27 1 22 1 15 V6 Z" fill="none" stroke="currentColor" stroke-width="2.4"></path><path d="M13 8 L18 15 L13 22 L8 15 Z" fill="var(--acc)"></path></svg>SINNOH LEAGUE</span><span class="lcsm">SEASON ${num(S.meta.season)||1} · ${gy?lcTier(nb):'COORDINATOR'}</span></div>
      <div class="lcphoto"><button class="pbtn" data-act="view" data-uid="${uid}" data-tab="trainer" aria-label="Open sheet for ${tName(t)}">${pimg(t.img,tName(t),'tall',t.imgc)}</button>
        ${no!=='---'?h`<b class="lcno" aria-label="League number ${no}">${no}</b>`:''}
        <div class="lctags">${t.cls?h`<span class="on">${String(t.cls).toUpperCase()}</span>`:''}<span>${gy?'CHALLENGER':'COORDINATOR'}</span></div></div>
      <div class="lcstripe"></div>
      <div class="lcbody">
        <div class="row sp lcname"><h3>${tName(t)}</h3><span class="sub">${t.hometown||''}</span></div>
        <div class="lcstats">${(gy&&cn?[['Badges',nb+' / 8'],['Ribbons',st.rib+' / '+st.need],['Rank',st.pos?'#'+st.pos:'—']]:gy?[['Badges',nb+' / 8'],['Wins',st.w],['Rank',st.pos?'#'+st.pos:'—']]:[['Ribbons',st.rib+' / '+st.need],['Contests',st.ce],['Rank',st.pos?'#'+st.pos:'—']]).map(([k,v])=>h`<div><span>${k}</span><b>${v}</b></div>`)}</div>
        <div class="lcpartner"><span class="lck">Partner</span>${lead?h`${monIcon(lead)}<b>${mName(lead)}</b>${typeChips(lead)}`:h`<span class="sub">None yet</span>`}</div>
        <div class="hpline">${hpBar(t.hp)}<span class="mono">${num(t.hp&&t.hp.cur)}/${num(t.hp&&t.hp.max)} HP</span></div>
      </div>`}
    </div>
    <footer><button class="btn sm" data-act="idflip" data-uid="${uid}" aria-pressed="${String(back)}">${back?'Flip to front':'Flip card'}</button><button class="btn sm" data-act="view" data-uid="${uid}" data-tab="trainer">Sheet</button></footer>
  </article>`;
}
/* Trainer ID: the card for a trainer who is on neither circuit (Update 38) */
function idCard(uid){
  const t=S.trainers[uid],mons=partyOf(uid),back=!!S.ui.flip[uid],acc=lcAcc(uid,t),lead=mons[0],idn=idNo(uid);
  const lbl=(k,v)=>h`<div class="lcf"><span>${k}</span><b>${v}</b></div>`;
  return h`<article class="panel tcard lcard idc" ${raw('style="--acc:'+acc+'"')} aria-label="Trainer ID for ${tName(t)}"><div class="lcin">
    ${back?h`<div class="lchead"><div><b class="lcnm">${tName(t)}</b><span class="lcsm">${idn}</span></div></div>
      <div class="lcback">
        <div class="lcsec"><span class="lck">Team</span><div class="lcteam">${mons.length?mons.map(m=>h`<span>${mName(m)}</span>`):h`<span class="lcempty">No Pokémon on hand</span>`}</div></div>
        <div class="lcgrid">${lbl('Class',t.cls||'—')}${lbl('Role',t.adv||'—')}${lbl('Hometown',t.hometown||'—')}${lbl('Pokémon',mons.length)}</div>
        ${t.quote?h`<p class="lcq">“${t.quote}”</p>`:''}
      </div>
      <div class="lcfoot"><span>Sinnoh Region · Trainer ID</span><span>${idn}</span></div>`
    :h`<div class="lchead"><span class="lcbrand"><svg width="18" height="21" viewBox="0 0 26 30" aria-hidden="true"><path d="M13 1 L25 6 V15 C25 22 19 27 13 29 C7 27 1 22 1 15 V6 Z" fill="none" stroke="currentColor" stroke-width="2.4"></path><path d="M13 8 L18 15 L13 22 L8 15 Z" fill="var(--acc)"></path></svg>SINNOH REGION</span><span class="lcsm">TRAINER ID</span></div>
      <div class="lcphoto"><button class="pbtn" data-act="view" data-uid="${uid}" data-tab="trainer" aria-label="Open sheet for ${tName(t)}">${pimg(t.img,tName(t),'tall',t.imgc)}</button>
        <div class="lctags"><span class="on">${String(t.cls||'Trainer').toUpperCase()}</span></div></div>
      <div class="lcstripe"></div>
      <div class="lcbody">
        <div class="row sp lcname"><h3>${tName(t)}</h3><span class="sub">${t.hometown||''}</span></div>
        <div class="lcstats">${[['ID No.',idn.replace('No. ','')],['Class',t.cls||'—'],['Role',t.adv||'—']].map(([k,v])=>h`<div><span>${k}</span><b>${v}</b></div>`)}</div>
        <div class="lcpartner"><span class="lck">Partner</span>${lead?h`${monIcon(lead)}<b>${mName(lead)}</b>${typeChips(lead)}`:h`<span class="sub">None yet</span>`}</div>
        <div class="hpline">${hpBar(t.hp)}<span class="mono">${num(t.hp&&t.hp.cur)}/${num(t.hp&&t.hp.max)} HP</span></div>
      </div>`}
    </div>
    <footer><button class="btn sm" data-act="idflip" data-uid="${uid}" aria-pressed="${String(back)}">${back?'Flip to front':'Flip card'}</button><button class="btn sm" data-act="view" data-uid="${uid}" data-tab="trainer">Sheet</button></footer>
  </article>`;
}
/* kit and card details, on the sheet under Honors & career */
function kitPanel(uid,t,ro){
  return h`<section class="panel"><div class="ph"><h2>League kit & card</h2><span class="pill">No. ${lcNo(t)}</span></div>
    <div class="fgrid">${fText('League number (001–999)','t',uid,'kitNo',t,{ro,ph:'e.g. 012'})}
      ${fSel('Accent color','t',uid,'kitCol',t,LC_ACC,{ro,blank:'Pick one'})}
      ${fText('Endorsed by','t',uid,'endorser',t,{ro,ph:'Who backed your entry'})}
      ${fText('Signature play','t',uid,'sigPlay',t,{ro,ph:'A move fans know you for'})}
      ${fText('Card quote','t',uid,'quote',t,{ro,cls:'wide',ph:'A line from an interview'})}
      <div class="fld wide"><span class="fl">Circuits</span><span class="row">${fCheck('Not on the Gym circuit','t',uid,'noGym',t,ro)}${fCheck('Not on the Contest circuit','t',uid,'noCon',t,ro)}</span></div></div>
    <p class="sub">These fill in the League Card on the Overview. The number and accent are on your kit too. Tick a circuit your trainer is not on and they leave that Rankings list. Tick both and the Overview shows a Trainer ID instead of the League Card. Their points are kept if you untick it later.</p></section>`;
}
function feedItems(){
  const out=[];
  const add=(ts,kind,text)=>{if(ts)out.push({ts,kind,text});};
  Object.values(S.awards).forEach(a=>add(a.createdAt,'Honor',h`<b>${tName(S.trainers[a.uid])}</b> was awarded <b>${a.title}</b>${a.levelUp?' and gained a level':''}.`));
  Object.values(S.journal).forEach(e=>add(e.createdAt,'Journal',h`Session ${num(e.session)||'?'} logged: <b>${e.title||'Untitled entry'}</b>${e.addedBy?' by '+nm(e.addedBy):''}.`));
  Object.values(S.people).forEach(p=>add(p.createdAt,'Person',h`Met <b>${p.name||'someone'}</b>${p.place?' at '+p.place:''}.`));
  Object.values(S.leads).forEach(l=>add(l.createdAt,'Lead',h`New lead: <b>${l.title||'Untitled lead'}</b>.`));
  Object.values(S.timeline).forEach(e=>add(e.createdAt,'Timeline',h`<b>${e.title||'Untitled event'}</b> added to the timeline.`));
  Object.values(S.trainers).forEach(t=>add(t.createdAt,'Trainer',h`<b>${tName(t)}</b> joined the table.`));
  Object.entries(S.pokemon).forEach(([uid,mm])=>Object.values(mm).forEach(m=>add(m.createdAt,'Team',h`<b>${tName(S.trainers[uid])}</b> added <b>${mName(m)}</b>.`)));
  return out.sort((a,b)=>b.ts-a.ts).slice(0,14);
}
function heroHtml(){
  const src=imgSrc(S.banner&&S.banner.img);
  const m=S.meta;
  return h`<section class="hero ${src?'has-img':''}">
    ${src?h`<img class="hero-img" src="${src}" alt="">`:''}
    <div class="hero-in">
      <p class="eyebrow">${m.subtitle}</p>
      <h1>${m.campaign}</h1>
      <p class="hero-meta">${m.gm?h`<span>Game Master <b>${m.gm}</b></span>`:''}<span>Session <b class="mono">${num(m.session)||1}</b></span><span><b class="mono">${Object.keys(S.trainers).length}</b> ${Object.keys(S.trainers).length===1?'trainer':'trainers'}</span></p>
    </div>
    ${S.me.admin?h`<div class="hero-act">${imgPicker('bn','banner','img',S.banner,1400,420,170000,false)}</div>`:''}
  </section>`;
}
/* phone home: app tiles (Update 30); hidden on wide screens by CSS */
const TILES=[['trainer','Trainer'],['pokemon','Pokémon'],['dex','Pokédex'],['map','Map'],['journal','Journal'],['people','People'],['leads','Leads'],['battle','Battle'],['moves','Moves'],['contest','Contests'],['shop','Shop']];
function appTiles(){
  const tl=TILES.concat(S.me.admin?[['npc','NPCs'],['gm','GM Desk']]:[]);
  return h`<nav class="apptiles" aria-label="Apps">${tl.map(([k,l])=>h`<button class="at" data-act="tab" data-tab="${k}"><span class="atic" aria-hidden="true"></span><b>${l}</b>${tabCount(k)?h`<span class="n">${tabCount(k)}</span>`:''}</button>`)}</nav>`;
}
function overviewTab(){
  const ids=tids();
  const mine=S.me.id&&S.trainers[S.me.id];
  const story=entriesOf(S.journal).sort((a,b)=>num(b.session)-num(a.session)||num(b.createdAt)-num(a.createdAt)).slice(0,3);
  const leads=entriesOf(S.leads).filter(l=>!l.status||l.status==='open'||l.status==='chasing').slice(0,5);
  const feed=feedItems();
  return h`${heroHtml()}
    ${appTiles()}
    ${S.meta.pinned?h`<section class="pinned"><p class="eyebrow">From the GM</p><p class="prewrap">${S.meta.pinned}</p></section>`:''}
    ${!mine&&!S.me.admin&&S.me.id&&S.me.canWrite?h`<div class="banner">You have no trainer sheet yet. ${createCta()}</div>`:''}
    <div class="ov">
      <div class="ov-main">
        <section class="list"><div class="ph"><h2>Trainers</h2><span class="sub">${ids.length} at the table</span></div>
          ${ids.length?h`<div class="grid cards tc">${ids.map(trainerCard)}</div>`:emptyTrainer()}</section>
        <section class="list"><div class="ph"><h2>Story so far</h2><button class="btn sm" data-act="tab" data-tab="journal">Open journal</button></div>
          ${story.length?story.map(e=>h`<article class="entry"><h3>${e.title||'Untitled entry'}</h3><div class="meta"><span>Session ${num(e.session)||'?'}</span>${e.place?h`<span>${e.place}</span>`:''}</div>${e.body?h`<p class="prewrap">${String(e.body).slice(0,320)}${String(e.body).length>320?'…':''}</p>`:''}</article>`):h`<p class="sub">Nothing written yet. Session notes go in the Journal.</p>`}</section>
      </div>
      <aside class="ov-side">
        <section class="panel"><div class="ph"><h2>Activity</h2></div>
          ${feed.length?h`<ul class="feed">${feed.map(i=>h`<li><span class="k">${i.kind}</span><p>${i.text}</p><span class="when">${ago(i.ts)}</span></li>`)}</ul>`:h`<p class="sub">Activity from the table shows up here.</p>`}</section>
        <section class="panel"><div class="ph"><h2>Open leads</h2><button class="btn sm" data-act="tab" data-tab="leads">Open</button></div>
          ${leads.length?h`<ul class="mini-list">${leads.map(l=>h`<li><b>${l.title||'Untitled lead'}</b><span class="sub">${l.place||'Location unknown'}</span></li>`)}</ul>`:h`<p class="sub">No open leads.</p>`}</section>
      </aside>
    </div>`;
}
/* ---------- trainer tab ---------- */
function identityPanel(uid,t,ro,rd){
  if(rd)return h`<section class="panel"><div class="ph"><h2>Trainer</h2><span class="sub">Played by ${nm(uid)}</span></div>
    ${rdFacts([['Name',t.name],['Class',t.cls],['Advanced class',t.adv],['Level',num(t.level)||1],['Age',t.age],['Hometown',t.hometown],['Origin',t.origin],['Credits',num(t.credits)]])}
    ${String(t.bio||'').trim()?h`<div class="rdsec"><span class="fl">Looks, personality, goals</span><p class="rdnote">${t.bio}</p></div>`:''}</section>`;
  return h`<section class="panel"><div class="ph"><h2>Trainer</h2><span class="sub">Played by ${nm(uid)}</span></div>
    <div class="idrow"><div class="idimg">${picEditor('t',uid,t,ro)}${imgPicker('t',uid,'img',t,0,0,90000,ro,640)}${picFrame('t',uid,t,ro)}${galPanel('t',uid,t,ro)}</div>
    <div class="fgrid">
      ${fText('Name','t',uid,'name',t,{ro,cls:'wide'})}
      ${fSel('Class','t',uid,'cls',t,Object.keys(CLASSES),{ro,blank:'Not chosen'})}
      ${fSel('Advanced class','t',uid,'adv',t,CLASSES[t.cls]||[],{ro,blank:'None yet'})}
      ${fNum('Level','t',uid,'level',t,{ro,min:1,max:20})}
      ${fNum('Age','t',uid,'age',t,{ro,min:10,max:99})}
      ${fText('Hometown','t',uid,'hometown',t,{ro,list:'dl-places'})}
      ${fText('Origin','t',uid,'origin',t,{ro})}
      ${fNum('Credits','t',uid,'credits',t,{ro,min:0})}
      ${fArea('Looks, personality, goals','t',uid,'bio',t,{ro,rows:3,cls:'wide'})}
    </div></div></section>`;
}
function vitalsPanel(uid,t,ro){
  const tiles=STATS.map(([k,full,ab])=>{
    const raw0=t.stats&&t.stats[k];
    const m=mod(raw0);
    return h`<div class="stat lcd"><span class="sl">${ab}</span>
      <input type="number" inputmode="numeric" aria-label="${full}" ${bd('t',uid,'stats.'+k)} value="${raw0}" data-min="1" data-max="10" ${dis(ro)}>
      <span class="sm"><span>mod ${sgn(m)}</span>${ro?'':h`<button class="rollbtn" data-act="roll" data-label="${full} check" data-bonus="${m}" data-tal="0">d20</button>`}</span></div>`;
  });
  return h`<section class="panel"><div class="ph"><h2>Stats</h2><span class="sub">Modifier is half the stat, rounded down. Stats cap at 10.</span></div>
    <div class="stats">${hpTile('t',uid,t.hp,ro)}${tiles}</div></section>`;
}
function skillsPanel(uid,t,ro){
  const tal=t.talents||{};
  const groups=STAT_KEYS.map(k=>{
    const sk=SKILLS.filter(s=>s[2]===k);
    const m=mod(t.stats&&t.stats[k]);
    return h`<div class="sgroup"><h3><span>${STAT_NAME[k]} skills</span><span class="mono">${sgn(m)}</span></h3>
      ${sk.map(([key,name])=>{
        const lv=clamp(num(tal[key]),0,2);
        const tb=[0,2,5][lv];
        return h`<div class="skill"><span class="sname">${name}</span>
          <button class="tal t${lv}" data-act="talent" data-key="${key}" data-uid="${uid}" ${dis(ro)} title="Talent: none, +2, or +5 when taken twice">${['—','+2','+5'][lv]}</button>
          <span class="bonus">${sgn(m+tb)}</span>
          <button class="btn sm" data-act="roll" data-label="${name}" data-bonus="${m}" data-tal="${tb}" ${dis(ro)}>Roll</button></div>`;
      })}</div>`;
  });
  return h`<section class="panel"><div class="ph"><h2>Skills</h2>
    <div class="seg" role="group" aria-label="Roll mode">${[['normal','Normal'],['adv','Advantage'],['dis','Disadvantage']].map(([v,l])=>h`<button data-act="adv" data-v="${v}" aria-pressed="${String(S.ui.adv===v)}">${l}</button>`)}</div></div>
    ${groups}</section>`;
}
/* the Sinnoh League badge medal: eight jigsaw pieces round a crest (pieces lit when the badge is won) */
const BADGE_PZ={"defs":"<linearGradient id=\"pzgold\" x1=\"0\" y1=\"0\" x2=\"1\" y2=\"1\"><stop offset=\"0\" stop-color=\"#fff0b8\"/><stop offset=\".3\" stop-color=\"#d8a93c\"/><stop offset=\".6\" stop-color=\"#8a5f14\"/><stop offset=\"1\" stop-color=\"#f2d27a\"/></linearGradient><radialGradient id=\"pzdark\" cx=\".5\" cy=\".5\" r=\".7\"><stop offset=\"0\" stop-color=\"#2a2d44\"/><stop offset=\"1\" stop-color=\"#11131f\"/></radialGradient><radialGradient id=\"pzcoal\" gradientUnits=\"userSpaceOnUse\" cx=\"-10.0\" cy=\"-79.5\" r=\"48\"><stop offset=\"0\" stop-color=\"#ffd08a\"/><stop offset=\".5\" stop-color=\"#d98a2b\"/><stop offset=\"1\" stop-color=\"#5a3410\"/></radialGradient><radialGradient id=\"pzforest\" gradientUnits=\"userSpaceOnUse\" cx=\"37.7\" cy=\"-59.7\" r=\"48\"><stop offset=\"0\" stop-color=\"#a8e8a0\"/><stop offset=\".5\" stop-color=\"#3da64a\"/><stop offset=\"1\" stop-color=\"#14451c\"/></radialGradient><radialGradient id=\"pzcobble\" gradientUnits=\"userSpaceOnUse\" cx=\"57.5\" cy=\"-12.0\" r=\"48\"><stop offset=\"0\" stop-color=\"#ffb59e\"/><stop offset=\".5\" stop-color=\"#d9482b\"/><stop offset=\"1\" stop-color=\"#561509\"/></radialGradient><radialGradient id=\"pzrelic\" gradientUnits=\"userSpaceOnUse\" cx=\"37.7\" cy=\"35.7\" r=\"48\"><stop offset=\"0\" stop-color=\"#d7bcff\"/><stop offset=\".5\" stop-color=\"#8a5bd6\"/><stop offset=\"1\" stop-color=\"#2a1553\"/></radialGradient><radialGradient id=\"pzfen\" gradientUnits=\"userSpaceOnUse\" cx=\"-10.0\" cy=\"55.5\" r=\"48\"><stop offset=\"0\" stop-color=\"#ffc9ec\"/><stop offset=\".5\" stop-color=\"#e56fb4\"/><stop offset=\"1\" stop-color=\"#5e1648\"/></radialGradient><radialGradient id=\"pzmine\" gradientUnits=\"userSpaceOnUse\" cx=\"-57.7\" cy=\"35.7\" r=\"48\"><stop offset=\"0\" stop-color=\"#e6ecf6\"/><stop offset=\".5\" stop-color=\"#8f9db5\"/><stop offset=\"1\" stop-color=\"#2d3646\"/></radialGradient><radialGradient id=\"pzicicle\" gradientUnits=\"userSpaceOnUse\" cx=\"-77.5\" cy=\"-12.0\" r=\"48\"><stop offset=\"0\" stop-color=\"#e0f8ff\"/><stop offset=\".5\" stop-color=\"#69d3ee\"/><stop offset=\"1\" stop-color=\"#0f4a5c\"/></radialGradient><radialGradient id=\"pzbeacon\" gradientUnits=\"userSpaceOnUse\" cx=\"-57.7\" cy=\"-59.7\" r=\"48\"><stop offset=\"0\" stop-color=\"#d6ecff\"/><stop offset=\".5\" stop-color=\"#6fb2ee\"/><stop offset=\"1\" stop-color=\"#1c3d78\"/></radialGradient>","base":"<circle r=\"111\" fill=\"url(#pzgold)\" stroke=\"#4a3208\" stroke-width=\"2.5\"/><circle r=\"108\" fill=\"none\" stroke=\"#fff3c4\" stroke-opacity=\".6\" stroke-width=\".8\"/><circle r=\"102.2\" fill=\"#2e1f05\" stroke=\"#4a3208\" stroke-width=\"1\"/><circle cx=\"105.5\" cy=\"0.0\" r=\"1.7\" fill=\"url(#pzgold)\" stroke=\"#5b3d0a\" stroke-width=\".5\"/><circle cx=\"104.6\" cy=\"13.8\" r=\"1.7\" fill=\"url(#pzgold)\" stroke=\"#5b3d0a\" stroke-width=\".5\"/><circle cx=\"101.9\" cy=\"27.3\" r=\"1.7\" fill=\"url(#pzgold)\" stroke=\"#5b3d0a\" stroke-width=\".5\"/><circle cx=\"97.5\" cy=\"40.4\" r=\"1.7\" fill=\"url(#pzgold)\" stroke=\"#5b3d0a\" stroke-width=\".5\"/><circle cx=\"91.4\" cy=\"52.7\" r=\"1.7\" fill=\"url(#pzgold)\" stroke=\"#5b3d0a\" stroke-width=\".5\"/><circle cx=\"83.7\" cy=\"64.2\" r=\"1.7\" fill=\"url(#pzgold)\" stroke=\"#5b3d0a\" stroke-width=\".5\"/><circle cx=\"74.6\" cy=\"74.6\" r=\"1.7\" fill=\"url(#pzgold)\" stroke=\"#5b3d0a\" stroke-width=\".5\"/><circle cx=\"64.2\" cy=\"83.7\" r=\"1.7\" fill=\"url(#pzgold)\" stroke=\"#5b3d0a\" stroke-width=\".5\"/><circle cx=\"52.8\" cy=\"91.4\" r=\"1.7\" fill=\"url(#pzgold)\" stroke=\"#5b3d0a\" stroke-width=\".5\"/><circle cx=\"40.4\" cy=\"97.5\" r=\"1.7\" fill=\"url(#pzgold)\" stroke=\"#5b3d0a\" stroke-width=\".5\"/><circle cx=\"27.3\" cy=\"101.9\" r=\"1.7\" fill=\"url(#pzgold)\" stroke=\"#5b3d0a\" stroke-width=\".5\"/><circle cx=\"13.8\" cy=\"104.6\" r=\"1.7\" fill=\"url(#pzgold)\" stroke=\"#5b3d0a\" stroke-width=\".5\"/><circle cx=\"0.0\" cy=\"105.5\" r=\"1.7\" fill=\"url(#pzgold)\" stroke=\"#5b3d0a\" stroke-width=\".5\"/><circle cx=\"-13.8\" cy=\"104.6\" r=\"1.7\" fill=\"url(#pzgold)\" stroke=\"#5b3d0a\" stroke-width=\".5\"/><circle cx=\"-27.3\" cy=\"101.9\" r=\"1.7\" fill=\"url(#pzgold)\" stroke=\"#5b3d0a\" stroke-width=\".5\"/><circle cx=\"-40.4\" cy=\"97.5\" r=\"1.7\" fill=\"url(#pzgold)\" stroke=\"#5b3d0a\" stroke-width=\".5\"/><circle cx=\"-52.7\" cy=\"91.4\" r=\"1.7\" fill=\"url(#pzgold)\" stroke=\"#5b3d0a\" stroke-width=\".5\"/><circle cx=\"-64.2\" cy=\"83.7\" r=\"1.7\" fill=\"url(#pzgold)\" stroke=\"#5b3d0a\" stroke-width=\".5\"/><circle cx=\"-74.6\" cy=\"74.6\" r=\"1.7\" fill=\"url(#pzgold)\" stroke=\"#5b3d0a\" stroke-width=\".5\"/><circle cx=\"-83.7\" cy=\"64.2\" r=\"1.7\" fill=\"url(#pzgold)\" stroke=\"#5b3d0a\" stroke-width=\".5\"/><circle cx=\"-91.4\" cy=\"52.7\" r=\"1.7\" fill=\"url(#pzgold)\" stroke=\"#5b3d0a\" stroke-width=\".5\"/><circle cx=\"-97.5\" cy=\"40.4\" r=\"1.7\" fill=\"url(#pzgold)\" stroke=\"#5b3d0a\" stroke-width=\".5\"/><circle cx=\"-101.9\" cy=\"27.3\" r=\"1.7\" fill=\"url(#pzgold)\" stroke=\"#5b3d0a\" stroke-width=\".5\"/><circle cx=\"-104.6\" cy=\"13.8\" r=\"1.7\" fill=\"url(#pzgold)\" stroke=\"#5b3d0a\" stroke-width=\".5\"/><circle cx=\"-105.5\" cy=\"0.0\" r=\"1.7\" fill=\"url(#pzgold)\" stroke=\"#5b3d0a\" stroke-width=\".5\"/><circle cx=\"-104.6\" cy=\"-13.8\" r=\"1.7\" fill=\"url(#pzgold)\" stroke=\"#5b3d0a\" stroke-width=\".5\"/><circle cx=\"-101.9\" cy=\"-27.3\" r=\"1.7\" fill=\"url(#pzgold)\" stroke=\"#5b3d0a\" stroke-width=\".5\"/><circle cx=\"-97.5\" cy=\"-40.4\" r=\"1.7\" fill=\"url(#pzgold)\" stroke=\"#5b3d0a\" stroke-width=\".5\"/><circle cx=\"-91.4\" cy=\"-52.8\" r=\"1.7\" fill=\"url(#pzgold)\" stroke=\"#5b3d0a\" stroke-width=\".5\"/><circle cx=\"-83.7\" cy=\"-64.2\" r=\"1.7\" fill=\"url(#pzgold)\" stroke=\"#5b3d0a\" stroke-width=\".5\"/><circle cx=\"-74.6\" cy=\"-74.6\" r=\"1.7\" fill=\"url(#pzgold)\" stroke=\"#5b3d0a\" stroke-width=\".5\"/><circle cx=\"-64.2\" cy=\"-83.7\" r=\"1.7\" fill=\"url(#pzgold)\" stroke=\"#5b3d0a\" stroke-width=\".5\"/><circle cx=\"-52.8\" cy=\"-91.4\" r=\"1.7\" fill=\"url(#pzgold)\" stroke=\"#5b3d0a\" stroke-width=\".5\"/><circle cx=\"-40.4\" cy=\"-97.5\" r=\"1.7\" fill=\"url(#pzgold)\" stroke=\"#5b3d0a\" stroke-width=\".5\"/><circle cx=\"-27.3\" cy=\"-101.9\" r=\"1.7\" fill=\"url(#pzgold)\" stroke=\"#5b3d0a\" stroke-width=\".5\"/><circle cx=\"-13.8\" cy=\"-104.6\" r=\"1.7\" fill=\"url(#pzgold)\" stroke=\"#5b3d0a\" stroke-width=\".5\"/><circle cx=\"-0.0\" cy=\"-105.5\" r=\"1.7\" fill=\"url(#pzgold)\" stroke=\"#5b3d0a\" stroke-width=\".5\"/><circle cx=\"13.8\" cy=\"-104.6\" r=\"1.7\" fill=\"url(#pzgold)\" stroke=\"#5b3d0a\" stroke-width=\".5\"/><circle cx=\"27.3\" cy=\"-101.9\" r=\"1.7\" fill=\"url(#pzgold)\" stroke=\"#5b3d0a\" stroke-width=\".5\"/><circle cx=\"40.4\" cy=\"-97.5\" r=\"1.7\" fill=\"url(#pzgold)\" stroke=\"#5b3d0a\" stroke-width=\".5\"/><circle cx=\"52.8\" cy=\"-91.4\" r=\"1.7\" fill=\"url(#pzgold)\" stroke=\"#5b3d0a\" stroke-width=\".5\"/><circle cx=\"64.2\" cy=\"-83.7\" r=\"1.7\" fill=\"url(#pzgold)\" stroke=\"#5b3d0a\" stroke-width=\".5\"/><circle cx=\"74.6\" cy=\"-74.6\" r=\"1.7\" fill=\"url(#pzgold)\" stroke=\"#5b3d0a\" stroke-width=\".5\"/><circle cx=\"83.7\" cy=\"-64.2\" r=\"1.7\" fill=\"url(#pzgold)\" stroke=\"#5b3d0a\" stroke-width=\".5\"/><circle cx=\"91.4\" cy=\"-52.8\" r=\"1.7\" fill=\"url(#pzgold)\" stroke=\"#5b3d0a\" stroke-width=\".5\"/><circle cx=\"97.5\" cy=\"-40.4\" r=\"1.7\" fill=\"url(#pzgold)\" stroke=\"#5b3d0a\" stroke-width=\".5\"/><circle cx=\"101.9\" cy=\"-27.3\" r=\"1.7\" fill=\"url(#pzgold)\" stroke=\"#5b3d0a\" stroke-width=\".5\"/><circle cx=\"104.6\" cy=\"-13.8\" r=\"1.7\" fill=\"url(#pzgold)\" stroke=\"#5b3d0a\" stroke-width=\".5\"/>","crest1":"<circle r=\"31.5\" fill=\"#0d0f1c\" stroke=\"#3f2a06\" stroke-width=\"3\"/><circle r=\"31.5\" fill=\"none\" stroke=\"url(#pzgold)\" stroke-width=\"2\"/><circle r=\"27\" fill=\"#1c2150\" stroke=\"url(#pzgold)\" stroke-width=\".8\" stroke-dasharray=\"1.5 2.5\"/><polygon points=\"0.0,-25.0 4.2,-10.2 17.7,-17.7 10.2,-4.2 25.0,0.0 10.2,4.2 17.7,17.7 4.2,10.2 0.0,25.0 -4.2,10.2 -17.7,17.7 -10.2,4.2 -25.0,0.0 -10.2,-4.2 -17.7,-17.7 -4.2,-10.2\" fill=\"url(#pzgold)\" stroke=\"#3f2a06\" stroke-width=\"1.2\" stroke-linejoin=\"round\"/><polygon points=\"0.0,-12.0 2.8,-2.8 12.0,0.0 2.8,2.8 0.0,12.0 -2.8,2.8 -12.0,0.0 -2.8,-2.8\" fill=\"#fff3c4\" opacity=\"1\"/><circle r=\"3.4\" fill=\"#e04a4a\" stroke=\"#3f2a06\" stroke-width=\".8\"/>","crest0":"<circle r=\"31.5\" fill=\"#0d0f1c\" stroke=\"#3f2a06\" stroke-width=\"3\"/><circle r=\"31.5\" fill=\"none\" stroke=\"#4a4f6c\" stroke-width=\"2\"/><circle r=\"27\" fill=\"#151827\" stroke=\"#4a4f6c\" stroke-width=\".8\" stroke-dasharray=\"1.5 2.5\"/><polygon points=\"0.0,-25.0 4.2,-10.2 17.7,-17.7 10.2,-4.2 25.0,0.0 10.2,4.2 17.7,17.7 4.2,10.2 0.0,25.0 -4.2,10.2 -17.7,17.7 -10.2,4.2 -25.0,0.0 -10.2,-4.2 -17.7,-17.7 -4.2,-10.2\" fill=\"#2a2e48\" stroke=\"#3f2a06\" stroke-width=\"1.2\" stroke-linejoin=\"round\"/><polygon points=\"0.0,-12.0 2.8,-2.8 12.0,0.0 2.8,2.8 0.0,12.0 -2.8,2.8 -12.0,0.0 -2.8,-2.8\" fill=\"#575c7a\" opacity=\"0.5\"/><circle r=\"3.4\" fill=\"#3a3f5c\" stroke=\"#3f2a06\" stroke-width=\".8\"/>","p":{"coal":{"lit":"<g class=\"pz-coal\"><path class=\"hit\" d=\"M-12.25,-29.56 L-15.84,-38.25 L-12.15,-39.78 A7 7 0 1 0 -14.91,-46.43 L-18.60,-44.90 L-38.27,-92.39 A100 100 0 0 1 38.27,-92.39 L18.60,-44.90 L22.29,-43.37 A7 7 0 1 1 19.54,-36.72 L15.84,-38.25 L12.25,-29.56 A32 32 0 0 0 -12.25,-29.56Z\" fill=\"url(#pzcoal)\" stroke=\"#3f2a06\" stroke-width=\"3.6\" stroke-linejoin=\"round\"/><path d=\"M-12.25,-29.56 L-15.84,-38.25 L-12.15,-39.78 A7 7 0 1 0 -14.91,-46.43 L-18.60,-44.90 L-38.27,-92.39 A100 100 0 0 1 38.27,-92.39 L18.60,-44.90 L22.29,-43.37 A7 7 0 1 1 19.54,-36.72 L15.84,-38.25 L12.25,-29.56 A32 32 0 0 0 -12.25,-29.56Z\" fill=\"none\" stroke=\"url(#pzgold)\" stroke-width=\"1.9\" stroke-linejoin=\"round\"/><g transform=\"translate(0.0,-67.5) scale(.40)\"><line x1=\"-36\" y1=\"40\" x2=\"30\" y2=\"-32\" stroke=\"#fff3c4\" stroke-width=\"9.12\" stroke-linecap=\"round\"/><path d=\"M6,-50 Q40,-46 50,-12 Q36,-30 14,-32Z\" fill=\"none\" stroke=\"#fff3c4\" stroke-width=\"3.8\" stroke-linejoin=\"round\"/><polygon points=\"-34,2 -14,-26 18,-24 36,4 24,30 -8,36 -30,22\" fill=\"none\" stroke=\"#fff3c4\" stroke-width=\"3.8\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><path d=\"M-14,-26 L-4,6 L24,30 M-4,6 L-30,22 M18,-24 L-4,6 M36,4 L-4,6\" fill=\"none\" stroke=\"#5a3410\" stroke-width=\"2.6599999999999997\" stroke-linejoin=\"round\" opacity=\".75\"/></g><path id=\"pztcoal\" d=\"M-30.27,-83.16 A88.5 88.5 0 0 1 30.27,-83.16\" fill=\"none\"/><text font-family=\"Georgia,serif\" font-size=\"7.2\" font-weight=\"700\" letter-spacing=\"1.6\" fill=\"#f6e4a8\" text-anchor=\"middle\"><textPath href=\"#pztcoal\" startOffset=\"50%\">COAL</textPath></text></g>","dark":"<g class=\"pz-coal\"><path class=\"hit\" d=\"M-12.25,-29.56 L-15.84,-38.25 L-12.15,-39.78 A7 7 0 1 0 -14.91,-46.43 L-18.60,-44.90 L-38.27,-92.39 A100 100 0 0 1 38.27,-92.39 L18.60,-44.90 L22.29,-43.37 A7 7 0 1 1 19.54,-36.72 L15.84,-38.25 L12.25,-29.56 A32 32 0 0 0 -12.25,-29.56Z\" fill=\"url(#pzdark)\" stroke=\"#05060c\" stroke-width=\"3.2\" stroke-linejoin=\"round\"/><path d=\"M-12.25,-29.56 L-15.84,-38.25 L-12.15,-39.78 A7 7 0 1 0 -14.91,-46.43 L-18.60,-44.90 L-38.27,-92.39 A100 100 0 0 1 38.27,-92.39 L18.60,-44.90 L22.29,-43.37 A7 7 0 1 1 19.54,-36.72 L15.84,-38.25 L12.25,-29.56 A32 32 0 0 0 -12.25,-29.56Z\" fill=\"none\" stroke=\"#3a3f5c\" stroke-width=\"1\" stroke-linejoin=\"round\"/><g transform=\"translate(0.0,-67.5) scale(.40)\" opacity=\".16\"><line x1=\"-36\" y1=\"40\" x2=\"30\" y2=\"-32\" stroke=\"#8d93b8\" stroke-width=\"9.12\" stroke-linecap=\"round\"/><path d=\"M6,-50 Q40,-46 50,-12 Q36,-30 14,-32Z\" fill=\"none\" stroke=\"#8d93b8\" stroke-width=\"3.8\" stroke-linejoin=\"round\"/><polygon points=\"-34,2 -14,-26 18,-24 36,4 24,30 -8,36 -30,22\" fill=\"none\" stroke=\"#8d93b8\" stroke-width=\"3.8\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><path d=\"M-14,-26 L-4,6 L24,30 M-4,6 L-30,22 M18,-24 L-4,6 M36,4 L-4,6\" fill=\"none\" stroke=\"#5a3410\" stroke-width=\"2.6599999999999997\" stroke-linejoin=\"round\" opacity=\".75\"/></g></g>"},"forest":{"lit":"<g class=\"pz-forest\"><path class=\"hit\" d=\"M12.25,-29.56 L15.84,-38.25 L19.54,-36.72 A7 7 0 1 0 22.29,-43.37 L18.60,-44.90 L38.27,-92.39 A100 100 0 0 1 92.39,-38.27 L44.90,-18.60 L46.43,-14.91 A7 7 0 1 1 39.78,-12.15 L38.25,-15.84 L29.56,-12.25 A32 32 0 0 0 12.25,-29.56Z\" fill=\"url(#pzforest)\" stroke=\"#3f2a06\" stroke-width=\"3.6\" stroke-linejoin=\"round\"/><path d=\"M12.25,-29.56 L15.84,-38.25 L19.54,-36.72 A7 7 0 1 0 22.29,-43.37 L18.60,-44.90 L38.27,-92.39 A100 100 0 0 1 92.39,-38.27 L44.90,-18.60 L46.43,-14.91 A7 7 0 1 1 39.78,-12.15 L38.25,-15.84 L29.56,-12.25 A32 32 0 0 0 12.25,-29.56Z\" fill=\"none\" stroke=\"url(#pzgold)\" stroke-width=\"1.9\" stroke-linejoin=\"round\"/><g transform=\"translate(47.7,-47.7) scale(.40)\"><path d=\"M0,-46 C8,-44 14,-36 12,-28 C23,-30 31,-21 27,-11 C37,-9 41,4 31,10 C37,19 29,29 16,27 C14,35 6,41 0,44 Z\" fill=\"none\" stroke=\"#fff3c4\" stroke-width=\"3.8\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><path d=\"M0,-46 C8,-44 14,-36 12,-28 C23,-30 31,-21 27,-11 C37,-9 41,4 31,10 C37,19 29,29 16,27 C14,35 6,41 0,44 Z\" transform=\"scale(-1,1)\" fill=\"none\" stroke=\"#fff3c4\" stroke-width=\"3.8\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><path d=\"M0,-40 L0,52 M0,-18 L16,-28 M0,-18 L-16,-28 M0,0 L22,-8 M0,0 L-22,-8 M0,16 L18,10 M0,16 L-18,10\" fill=\"none\" stroke=\"#14451c\" stroke-width=\"3.04\" stroke-linecap=\"round\" opacity=\".8\"/><path d=\"M0,44 Q2,52 8,54\" fill=\"none\" stroke=\"#fff3c4\" stroke-width=\"5.319999999999999\" stroke-linecap=\"round\"/></g><path id=\"pztforest\" d=\"M37.40,-80.21 A88.5 88.5 0 0 1 80.21,-37.40\" fill=\"none\"/><text font-family=\"Georgia,serif\" font-size=\"7.2\" font-weight=\"700\" letter-spacing=\"1.6\" fill=\"#f6e4a8\" text-anchor=\"middle\"><textPath href=\"#pztforest\" startOffset=\"50%\">FOREST</textPath></text></g>","dark":"<g class=\"pz-forest\"><path class=\"hit\" d=\"M12.25,-29.56 L15.84,-38.25 L19.54,-36.72 A7 7 0 1 0 22.29,-43.37 L18.60,-44.90 L38.27,-92.39 A100 100 0 0 1 92.39,-38.27 L44.90,-18.60 L46.43,-14.91 A7 7 0 1 1 39.78,-12.15 L38.25,-15.84 L29.56,-12.25 A32 32 0 0 0 12.25,-29.56Z\" fill=\"url(#pzdark)\" stroke=\"#05060c\" stroke-width=\"3.2\" stroke-linejoin=\"round\"/><path d=\"M12.25,-29.56 L15.84,-38.25 L19.54,-36.72 A7 7 0 1 0 22.29,-43.37 L18.60,-44.90 L38.27,-92.39 A100 100 0 0 1 92.39,-38.27 L44.90,-18.60 L46.43,-14.91 A7 7 0 1 1 39.78,-12.15 L38.25,-15.84 L29.56,-12.25 A32 32 0 0 0 12.25,-29.56Z\" fill=\"none\" stroke=\"#3a3f5c\" stroke-width=\"1\" stroke-linejoin=\"round\"/><g transform=\"translate(47.7,-47.7) scale(.40)\" opacity=\".16\"><path d=\"M0,-46 C8,-44 14,-36 12,-28 C23,-30 31,-21 27,-11 C37,-9 41,4 31,10 C37,19 29,29 16,27 C14,35 6,41 0,44 Z\" fill=\"none\" stroke=\"#8d93b8\" stroke-width=\"3.8\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><path d=\"M0,-46 C8,-44 14,-36 12,-28 C23,-30 31,-21 27,-11 C37,-9 41,4 31,10 C37,19 29,29 16,27 C14,35 6,41 0,44 Z\" transform=\"scale(-1,1)\" fill=\"none\" stroke=\"#8d93b8\" stroke-width=\"3.8\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><path d=\"M0,-40 L0,52 M0,-18 L16,-28 M0,-18 L-16,-28 M0,0 L22,-8 M0,0 L-22,-8 M0,16 L18,10 M0,16 L-18,10\" fill=\"none\" stroke=\"#14451c\" stroke-width=\"3.04\" stroke-linecap=\"round\" opacity=\".8\"/><path d=\"M0,44 Q2,52 8,54\" fill=\"none\" stroke=\"#8d93b8\" stroke-width=\"5.319999999999999\" stroke-linecap=\"round\"/></g></g>"},"cobble":{"lit":"<g class=\"pz-cobble\"><path class=\"hit\" d=\"M29.56,-12.25 L38.25,-15.84 L39.78,-12.15 A7 7 0 1 0 46.43,-14.91 L44.90,-18.60 L92.39,-38.27 A100 100 0 0 1 92.39,38.27 L44.90,18.60 L43.37,22.29 A7 7 0 1 1 36.72,19.54 L38.25,15.84 L29.56,12.25 A32 32 0 0 0 29.56,-12.25Z\" fill=\"url(#pzcobble)\" stroke=\"#3f2a06\" stroke-width=\"3.6\" stroke-linejoin=\"round\"/><path d=\"M29.56,-12.25 L38.25,-15.84 L39.78,-12.15 A7 7 0 1 0 46.43,-14.91 L44.90,-18.60 L92.39,-38.27 A100 100 0 0 1 92.39,38.27 L44.90,18.60 L43.37,22.29 A7 7 0 1 1 36.72,19.54 L38.25,15.84 L29.56,12.25 A32 32 0 0 0 29.56,-12.25Z\" fill=\"none\" stroke=\"url(#pzgold)\" stroke-width=\"1.9\" stroke-linejoin=\"round\"/><g transform=\"translate(67.5,0.0) scale(.40)\"><circle cx=\"-19\" cy=\"-12\" r=\"8.5\" fill=\"none\" stroke=\"#fff3c4\" stroke-width=\"3.8\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><circle cx=\"-6.5\" cy=\"-12\" r=\"8.5\" fill=\"none\" stroke=\"#fff3c4\" stroke-width=\"3.8\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><circle cx=\"6.5\" cy=\"-12\" r=\"8.5\" fill=\"none\" stroke=\"#fff3c4\" stroke-width=\"3.8\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><circle cx=\"19\" cy=\"-12\" r=\"8.5\" fill=\"none\" stroke=\"#fff3c4\" stroke-width=\"3.8\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><rect x=\"-27\" y=\"-12\" width=\"54\" height=\"40\" rx=\"11\" fill=\"none\" stroke=\"#fff3c4\" stroke-width=\"3.8\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><path d=\"M-27,6 Q-40,0 -34,14 Q-28,24 -18,22\" fill=\"none\" stroke=\"#fff3c4\" stroke-width=\"3.8\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><path d=\"M-12,-8 L-12,10 M0,-8 L0,10 M12,-8 L12,10\" stroke=\"#561509\" stroke-width=\"3.04\" fill=\"none\" stroke-linecap=\"round\" opacity=\".7\"/><ellipse cx=\"-22\" cy=\"40\" rx=\"12\" ry=\"7\" fill=\"none\" stroke=\"#fff3c4\" stroke-width=\"3.8\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><ellipse cx=\"0\" cy=\"42\" rx=\"13\" ry=\"8\" fill=\"none\" stroke=\"#fff3c4\" stroke-width=\"3.8\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><ellipse cx=\"22\" cy=\"40\" rx=\"12\" ry=\"7\" fill=\"none\" stroke=\"#fff3c4\" stroke-width=\"3.8\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/></g><path id=\"pztcobble\" d=\"M88.80,32.32 A94.5 94.5 0 0 0 88.80,-32.32\" fill=\"none\"/><text font-family=\"Georgia,serif\" font-size=\"7.2\" font-weight=\"700\" letter-spacing=\"1.6\" fill=\"#f6e4a8\" text-anchor=\"middle\"><textPath href=\"#pztcobble\" startOffset=\"50%\">COBBLE</textPath></text></g>","dark":"<g class=\"pz-cobble\"><path class=\"hit\" d=\"M29.56,-12.25 L38.25,-15.84 L39.78,-12.15 A7 7 0 1 0 46.43,-14.91 L44.90,-18.60 L92.39,-38.27 A100 100 0 0 1 92.39,38.27 L44.90,18.60 L43.37,22.29 A7 7 0 1 1 36.72,19.54 L38.25,15.84 L29.56,12.25 A32 32 0 0 0 29.56,-12.25Z\" fill=\"url(#pzdark)\" stroke=\"#05060c\" stroke-width=\"3.2\" stroke-linejoin=\"round\"/><path d=\"M29.56,-12.25 L38.25,-15.84 L39.78,-12.15 A7 7 0 1 0 46.43,-14.91 L44.90,-18.60 L92.39,-38.27 A100 100 0 0 1 92.39,38.27 L44.90,18.60 L43.37,22.29 A7 7 0 1 1 36.72,19.54 L38.25,15.84 L29.56,12.25 A32 32 0 0 0 29.56,-12.25Z\" fill=\"none\" stroke=\"#3a3f5c\" stroke-width=\"1\" stroke-linejoin=\"round\"/><g transform=\"translate(67.5,0.0) scale(.40)\" opacity=\".16\"><circle cx=\"-19\" cy=\"-12\" r=\"8.5\" fill=\"none\" stroke=\"#8d93b8\" stroke-width=\"3.8\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><circle cx=\"-6.5\" cy=\"-12\" r=\"8.5\" fill=\"none\" stroke=\"#8d93b8\" stroke-width=\"3.8\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><circle cx=\"6.5\" cy=\"-12\" r=\"8.5\" fill=\"none\" stroke=\"#8d93b8\" stroke-width=\"3.8\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><circle cx=\"19\" cy=\"-12\" r=\"8.5\" fill=\"none\" stroke=\"#8d93b8\" stroke-width=\"3.8\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><rect x=\"-27\" y=\"-12\" width=\"54\" height=\"40\" rx=\"11\" fill=\"none\" stroke=\"#8d93b8\" stroke-width=\"3.8\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><path d=\"M-27,6 Q-40,0 -34,14 Q-28,24 -18,22\" fill=\"none\" stroke=\"#8d93b8\" stroke-width=\"3.8\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><path d=\"M-12,-8 L-12,10 M0,-8 L0,10 M12,-8 L12,10\" stroke=\"#561509\" stroke-width=\"3.04\" fill=\"none\" stroke-linecap=\"round\" opacity=\".7\"/><ellipse cx=\"-22\" cy=\"40\" rx=\"12\" ry=\"7\" fill=\"none\" stroke=\"#8d93b8\" stroke-width=\"3.8\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><ellipse cx=\"0\" cy=\"42\" rx=\"13\" ry=\"8\" fill=\"none\" stroke=\"#8d93b8\" stroke-width=\"3.8\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><ellipse cx=\"22\" cy=\"40\" rx=\"12\" ry=\"7\" fill=\"none\" stroke=\"#8d93b8\" stroke-width=\"3.8\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/></g></g>"},"relic":{"lit":"<g class=\"pz-relic\"><path class=\"hit\" d=\"M29.56,12.25 L38.25,15.84 L36.72,19.54 A7 7 0 1 0 43.37,22.29 L44.90,18.60 L92.39,38.27 A100 100 0 0 1 38.27,92.39 L18.60,44.90 L14.91,46.43 A7 7 0 1 1 12.15,39.78 L15.84,38.25 L12.25,29.56 A32 32 0 0 0 29.56,12.25Z\" fill=\"url(#pzrelic)\" stroke=\"#3f2a06\" stroke-width=\"3.6\" stroke-linejoin=\"round\"/><path d=\"M29.56,12.25 L38.25,15.84 L36.72,19.54 A7 7 0 1 0 43.37,22.29 L44.90,18.60 L92.39,38.27 A100 100 0 0 1 38.27,92.39 L18.60,44.90 L14.91,46.43 A7 7 0 1 1 12.15,39.78 L15.84,38.25 L12.25,29.56 A32 32 0 0 0 29.56,12.25Z\" fill=\"none\" stroke=\"url(#pzgold)\" stroke-width=\"1.9\" stroke-linejoin=\"round\"/><g transform=\"translate(47.7,47.7) scale(.40)\"><path d=\"M-28,-30 Q0,-44 28,-30 Q34,8 0,40 Q-34,8 -28,-30Z\" fill=\"none\" stroke=\"#fff3c4\" stroke-width=\"3.8\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><path d=\"M-20,-14 Q-13,-22 -6,-14 Q-13,-10 -20,-14Z M6,-14 Q13,-22 20,-14 Q13,-10 6,-14Z\" fill=\"#2a1553\"/><path d=\"M-12,12 Q0,26 12,12\" fill=\"none\" stroke=\"#2a1553\" stroke-width=\"4.18\" stroke-linecap=\"round\"/><path d=\"M20,-40 Q44,-48 40,-26 Q36,-14 44,-6 Q30,-12 32,-24 Q26,-30 20,-40Z\" fill=\"none\" stroke=\"#fff3c4\" stroke-width=\"3.8\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/></g><path id=\"pztrelic\" d=\"M39.94,85.65 A94.5 94.5 0 0 0 85.65,39.94\" fill=\"none\"/><text font-family=\"Georgia,serif\" font-size=\"7.2\" font-weight=\"700\" letter-spacing=\"1.6\" fill=\"#f6e4a8\" text-anchor=\"middle\"><textPath href=\"#pztrelic\" startOffset=\"50%\">RELIC</textPath></text></g>","dark":"<g class=\"pz-relic\"><path class=\"hit\" d=\"M29.56,12.25 L38.25,15.84 L36.72,19.54 A7 7 0 1 0 43.37,22.29 L44.90,18.60 L92.39,38.27 A100 100 0 0 1 38.27,92.39 L18.60,44.90 L14.91,46.43 A7 7 0 1 1 12.15,39.78 L15.84,38.25 L12.25,29.56 A32 32 0 0 0 29.56,12.25Z\" fill=\"url(#pzdark)\" stroke=\"#05060c\" stroke-width=\"3.2\" stroke-linejoin=\"round\"/><path d=\"M29.56,12.25 L38.25,15.84 L36.72,19.54 A7 7 0 1 0 43.37,22.29 L44.90,18.60 L92.39,38.27 A100 100 0 0 1 38.27,92.39 L18.60,44.90 L14.91,46.43 A7 7 0 1 1 12.15,39.78 L15.84,38.25 L12.25,29.56 A32 32 0 0 0 29.56,12.25Z\" fill=\"none\" stroke=\"#3a3f5c\" stroke-width=\"1\" stroke-linejoin=\"round\"/><g transform=\"translate(47.7,47.7) scale(.40)\" opacity=\".16\"><path d=\"M-28,-30 Q0,-44 28,-30 Q34,8 0,40 Q-34,8 -28,-30Z\" fill=\"none\" stroke=\"#8d93b8\" stroke-width=\"3.8\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><path d=\"M-20,-14 Q-13,-22 -6,-14 Q-13,-10 -20,-14Z M6,-14 Q13,-22 20,-14 Q13,-10 6,-14Z\" fill=\"#2a1553\"/><path d=\"M-12,12 Q0,26 12,12\" fill=\"none\" stroke=\"#2a1553\" stroke-width=\"4.18\" stroke-linecap=\"round\"/><path d=\"M20,-40 Q44,-48 40,-26 Q36,-14 44,-6 Q30,-12 32,-24 Q26,-30 20,-40Z\" fill=\"none\" stroke=\"#8d93b8\" stroke-width=\"3.8\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/></g></g>"},"fen":{"lit":"<g class=\"pz-fen\"><path class=\"hit\" d=\"M12.25,29.56 L15.84,38.25 L12.15,39.78 A7 7 0 1 0 14.91,46.43 L18.60,44.90 L38.27,92.39 A100 100 0 0 1 -38.27,92.39 L-18.60,44.90 L-22.29,43.37 A7 7 0 1 1 -19.54,36.72 L-15.84,38.25 L-12.25,29.56 A32 32 0 0 0 12.25,29.56Z\" fill=\"url(#pzfen)\" stroke=\"#3f2a06\" stroke-width=\"3.6\" stroke-linejoin=\"round\"/><path d=\"M12.25,29.56 L15.84,38.25 L12.15,39.78 A7 7 0 1 0 14.91,46.43 L18.60,44.90 L38.27,92.39 A100 100 0 0 1 -38.27,92.39 L-18.60,44.90 L-22.29,43.37 A7 7 0 1 1 -19.54,36.72 L-15.84,38.25 L-12.25,29.56 A32 32 0 0 0 12.25,29.56Z\" fill=\"none\" stroke=\"url(#pzgold)\" stroke-width=\"1.9\" stroke-linejoin=\"round\"/><g transform=\"translate(0.0,67.5) scale(.40)\"><g transform=\"rotate(0) translate(0,-31)\"><rect x=\"-3\" y=\"-1\" width=\"6\" height=\"10\" rx=\"2.5\" fill=\"none\" stroke=\"#fff3c4\" stroke-width=\"3.04\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><path d=\"M-10,0 Q-10,-13 0,-13 Q10,-13 10,0Z\" fill=\"none\" stroke=\"#fff3c4\" stroke-width=\"3.04\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><circle cx=\"-3.5\" cy=\"-6\" r=\"1.6\" fill=\"#5e1648\"/><circle cx=\"3.5\" cy=\"-7.5\" r=\"1.3\" fill=\"#5e1648\"/></g><g transform=\"rotate(60) translate(0,-31)\"><rect x=\"-3\" y=\"-1\" width=\"6\" height=\"10\" rx=\"2.5\" fill=\"none\" stroke=\"#fff3c4\" stroke-width=\"3.04\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><path d=\"M-10,0 Q-10,-13 0,-13 Q10,-13 10,0Z\" fill=\"none\" stroke=\"#fff3c4\" stroke-width=\"3.04\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><circle cx=\"-3.5\" cy=\"-6\" r=\"1.6\" fill=\"#5e1648\"/><circle cx=\"3.5\" cy=\"-7.5\" r=\"1.3\" fill=\"#5e1648\"/></g><g transform=\"rotate(120) translate(0,-31)\"><rect x=\"-3\" y=\"-1\" width=\"6\" height=\"10\" rx=\"2.5\" fill=\"none\" stroke=\"#fff3c4\" stroke-width=\"3.04\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><path d=\"M-10,0 Q-10,-13 0,-13 Q10,-13 10,0Z\" fill=\"none\" stroke=\"#fff3c4\" stroke-width=\"3.04\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><circle cx=\"-3.5\" cy=\"-6\" r=\"1.6\" fill=\"#5e1648\"/><circle cx=\"3.5\" cy=\"-7.5\" r=\"1.3\" fill=\"#5e1648\"/></g><g transform=\"rotate(180) translate(0,-31)\"><rect x=\"-3\" y=\"-1\" width=\"6\" height=\"10\" rx=\"2.5\" fill=\"none\" stroke=\"#fff3c4\" stroke-width=\"3.04\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><path d=\"M-10,0 Q-10,-13 0,-13 Q10,-13 10,0Z\" fill=\"none\" stroke=\"#fff3c4\" stroke-width=\"3.04\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><circle cx=\"-3.5\" cy=\"-6\" r=\"1.6\" fill=\"#5e1648\"/><circle cx=\"3.5\" cy=\"-7.5\" r=\"1.3\" fill=\"#5e1648\"/></g><g transform=\"rotate(240) translate(0,-31)\"><rect x=\"-3\" y=\"-1\" width=\"6\" height=\"10\" rx=\"2.5\" fill=\"none\" stroke=\"#fff3c4\" stroke-width=\"3.04\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><path d=\"M-10,0 Q-10,-13 0,-13 Q10,-13 10,0Z\" fill=\"none\" stroke=\"#fff3c4\" stroke-width=\"3.04\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><circle cx=\"-3.5\" cy=\"-6\" r=\"1.6\" fill=\"#5e1648\"/><circle cx=\"3.5\" cy=\"-7.5\" r=\"1.3\" fill=\"#5e1648\"/></g><g transform=\"rotate(300) translate(0,-31)\"><rect x=\"-3\" y=\"-1\" width=\"6\" height=\"10\" rx=\"2.5\" fill=\"none\" stroke=\"#fff3c4\" stroke-width=\"3.04\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><path d=\"M-10,0 Q-10,-13 0,-13 Q10,-13 10,0Z\" fill=\"none\" stroke=\"#fff3c4\" stroke-width=\"3.04\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><circle cx=\"-3.5\" cy=\"-6\" r=\"1.6\" fill=\"#5e1648\"/><circle cx=\"3.5\" cy=\"-7.5\" r=\"1.3\" fill=\"#5e1648\"/></g><polygon points=\"0.0,-17.0 3.5,-3.5 17.0,0.0 3.5,3.5 0.0,17.0 -3.5,3.5 -17.0,0.0 -3.5,-3.5\" fill=\"none\" stroke=\"#fff3c4\" stroke-width=\"3.8\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/></g><path id=\"pztfen\" d=\"M-32.32,88.80 A94.5 94.5 0 0 0 32.32,88.80\" fill=\"none\"/><text font-family=\"Georgia,serif\" font-size=\"7.2\" font-weight=\"700\" letter-spacing=\"1.6\" fill=\"#f6e4a8\" text-anchor=\"middle\"><textPath href=\"#pztfen\" startOffset=\"50%\">RING</textPath></text></g>","dark":"<g class=\"pz-fen\"><path class=\"hit\" d=\"M12.25,29.56 L15.84,38.25 L12.15,39.78 A7 7 0 1 0 14.91,46.43 L18.60,44.90 L38.27,92.39 A100 100 0 0 1 -38.27,92.39 L-18.60,44.90 L-22.29,43.37 A7 7 0 1 1 -19.54,36.72 L-15.84,38.25 L-12.25,29.56 A32 32 0 0 0 12.25,29.56Z\" fill=\"url(#pzdark)\" stroke=\"#05060c\" stroke-width=\"3.2\" stroke-linejoin=\"round\"/><path d=\"M12.25,29.56 L15.84,38.25 L12.15,39.78 A7 7 0 1 0 14.91,46.43 L18.60,44.90 L38.27,92.39 A100 100 0 0 1 -38.27,92.39 L-18.60,44.90 L-22.29,43.37 A7 7 0 1 1 -19.54,36.72 L-15.84,38.25 L-12.25,29.56 A32 32 0 0 0 12.25,29.56Z\" fill=\"none\" stroke=\"#3a3f5c\" stroke-width=\"1\" stroke-linejoin=\"round\"/><g transform=\"translate(0.0,67.5) scale(.40)\" opacity=\".16\"><g transform=\"rotate(0) translate(0,-31)\"><rect x=\"-3\" y=\"-1\" width=\"6\" height=\"10\" rx=\"2.5\" fill=\"none\" stroke=\"#8d93b8\" stroke-width=\"3.04\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><path d=\"M-10,0 Q-10,-13 0,-13 Q10,-13 10,0Z\" fill=\"none\" stroke=\"#8d93b8\" stroke-width=\"3.04\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><circle cx=\"-3.5\" cy=\"-6\" r=\"1.6\" fill=\"#5e1648\"/><circle cx=\"3.5\" cy=\"-7.5\" r=\"1.3\" fill=\"#5e1648\"/></g><g transform=\"rotate(60) translate(0,-31)\"><rect x=\"-3\" y=\"-1\" width=\"6\" height=\"10\" rx=\"2.5\" fill=\"none\" stroke=\"#8d93b8\" stroke-width=\"3.04\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><path d=\"M-10,0 Q-10,-13 0,-13 Q10,-13 10,0Z\" fill=\"none\" stroke=\"#8d93b8\" stroke-width=\"3.04\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><circle cx=\"-3.5\" cy=\"-6\" r=\"1.6\" fill=\"#5e1648\"/><circle cx=\"3.5\" cy=\"-7.5\" r=\"1.3\" fill=\"#5e1648\"/></g><g transform=\"rotate(120) translate(0,-31)\"><rect x=\"-3\" y=\"-1\" width=\"6\" height=\"10\" rx=\"2.5\" fill=\"none\" stroke=\"#8d93b8\" stroke-width=\"3.04\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><path d=\"M-10,0 Q-10,-13 0,-13 Q10,-13 10,0Z\" fill=\"none\" stroke=\"#8d93b8\" stroke-width=\"3.04\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><circle cx=\"-3.5\" cy=\"-6\" r=\"1.6\" fill=\"#5e1648\"/><circle cx=\"3.5\" cy=\"-7.5\" r=\"1.3\" fill=\"#5e1648\"/></g><g transform=\"rotate(180) translate(0,-31)\"><rect x=\"-3\" y=\"-1\" width=\"6\" height=\"10\" rx=\"2.5\" fill=\"none\" stroke=\"#8d93b8\" stroke-width=\"3.04\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><path d=\"M-10,0 Q-10,-13 0,-13 Q10,-13 10,0Z\" fill=\"none\" stroke=\"#8d93b8\" stroke-width=\"3.04\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><circle cx=\"-3.5\" cy=\"-6\" r=\"1.6\" fill=\"#5e1648\"/><circle cx=\"3.5\" cy=\"-7.5\" r=\"1.3\" fill=\"#5e1648\"/></g><g transform=\"rotate(240) translate(0,-31)\"><rect x=\"-3\" y=\"-1\" width=\"6\" height=\"10\" rx=\"2.5\" fill=\"none\" stroke=\"#8d93b8\" stroke-width=\"3.04\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><path d=\"M-10,0 Q-10,-13 0,-13 Q10,-13 10,0Z\" fill=\"none\" stroke=\"#8d93b8\" stroke-width=\"3.04\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><circle cx=\"-3.5\" cy=\"-6\" r=\"1.6\" fill=\"#5e1648\"/><circle cx=\"3.5\" cy=\"-7.5\" r=\"1.3\" fill=\"#5e1648\"/></g><g transform=\"rotate(300) translate(0,-31)\"><rect x=\"-3\" y=\"-1\" width=\"6\" height=\"10\" rx=\"2.5\" fill=\"none\" stroke=\"#8d93b8\" stroke-width=\"3.04\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><path d=\"M-10,0 Q-10,-13 0,-13 Q10,-13 10,0Z\" fill=\"none\" stroke=\"#8d93b8\" stroke-width=\"3.04\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><circle cx=\"-3.5\" cy=\"-6\" r=\"1.6\" fill=\"#5e1648\"/><circle cx=\"3.5\" cy=\"-7.5\" r=\"1.3\" fill=\"#5e1648\"/></g><polygon points=\"0.0,-17.0 3.5,-3.5 17.0,0.0 3.5,3.5 0.0,17.0 -3.5,3.5 -17.0,0.0 -3.5,-3.5\" fill=\"none\" stroke=\"#8d93b8\" stroke-width=\"3.8\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/></g></g>"},"mine":{"lit":"<g class=\"pz-mine\"><path class=\"hit\" d=\"M-12.25,29.56 L-15.84,38.25 L-19.54,36.72 A7 7 0 1 0 -22.29,43.37 L-18.60,44.90 L-38.27,92.39 A100 100 0 0 1 -92.39,38.27 L-44.90,18.60 L-46.43,14.91 A7 7 0 1 1 -39.78,12.15 L-38.25,15.84 L-29.56,12.25 A32 32 0 0 0 -12.25,29.56Z\" fill=\"url(#pzmine)\" stroke=\"#3f2a06\" stroke-width=\"3.6\" stroke-linejoin=\"round\"/><path d=\"M-12.25,29.56 L-15.84,38.25 L-19.54,36.72 A7 7 0 1 0 -22.29,43.37 L-18.60,44.90 L-38.27,92.39 A100 100 0 0 1 -92.39,38.27 L-44.90,18.60 L-46.43,14.91 A7 7 0 1 1 -39.78,12.15 L-38.25,15.84 L-29.56,12.25 A32 32 0 0 0 -12.25,29.56Z\" fill=\"none\" stroke=\"url(#pzgold)\" stroke-width=\"1.9\" stroke-linejoin=\"round\"/><g transform=\"translate(-47.7,47.7) scale(.40)\"><polygon points=\"-6.7,-35.4 -4.9,-45.7 4.9,-45.7 6.7,-35.4 15.3,-32.6 22.9,-39.9 30.9,-34.1 26.2,-24.6 31.5,-17.3 42.0,-18.8 45.0,-9.5 35.7,-4.5 35.7,4.5 45.0,9.5 42.0,18.8 31.5,17.3 26.2,24.6 30.9,34.1 22.9,39.9 15.3,32.6 6.7,35.4 4.9,45.7 -4.9,45.7 -6.7,35.4 -15.3,32.6 -22.9,39.9 -30.9,34.1 -26.2,24.6 -31.5,17.3 -42.0,18.8 -45.0,9.5 -35.7,4.5 -35.7,-4.5 -45.0,-9.5 -42.0,-18.8 -31.5,-17.3 -26.2,-24.6 -30.9,-34.1 -22.9,-39.9 -15.3,-32.6\" fill=\"none\" stroke=\"#fff3c4\" stroke-width=\"3.8\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><circle r=\"25\" fill=\"none\" stroke=\"#fff3c4\" stroke-width=\"3.8\"/><g fill=\"none\" stroke=\"#fff3c4\" stroke-width=\"3.42\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><circle cy=\"-15\" r=\"4.5\"/><path d=\"M0,-10 L0,16 M-9,-4 L9,-4 M-15,6 Q-14,17 0,17 Q14,17 15,6 M-15,6 L-19,10 M15,6 L19,10\"/></g></g><path id=\"pztmine\" d=\"M-85.65,39.94 A94.5 94.5 0 0 0 -39.94,85.65\" fill=\"none\"/><text font-family=\"Georgia,serif\" font-size=\"7.2\" font-weight=\"700\" letter-spacing=\"1.6\" fill=\"#f6e4a8\" text-anchor=\"middle\"><textPath href=\"#pztmine\" startOffset=\"50%\">MINE</textPath></text></g>","dark":"<g class=\"pz-mine\"><path class=\"hit\" d=\"M-12.25,29.56 L-15.84,38.25 L-19.54,36.72 A7 7 0 1 0 -22.29,43.37 L-18.60,44.90 L-38.27,92.39 A100 100 0 0 1 -92.39,38.27 L-44.90,18.60 L-46.43,14.91 A7 7 0 1 1 -39.78,12.15 L-38.25,15.84 L-29.56,12.25 A32 32 0 0 0 -12.25,29.56Z\" fill=\"url(#pzdark)\" stroke=\"#05060c\" stroke-width=\"3.2\" stroke-linejoin=\"round\"/><path d=\"M-12.25,29.56 L-15.84,38.25 L-19.54,36.72 A7 7 0 1 0 -22.29,43.37 L-18.60,44.90 L-38.27,92.39 A100 100 0 0 1 -92.39,38.27 L-44.90,18.60 L-46.43,14.91 A7 7 0 1 1 -39.78,12.15 L-38.25,15.84 L-29.56,12.25 A32 32 0 0 0 -12.25,29.56Z\" fill=\"none\" stroke=\"#3a3f5c\" stroke-width=\"1\" stroke-linejoin=\"round\"/><g transform=\"translate(-47.7,47.7) scale(.40)\" opacity=\".16\"><polygon points=\"-6.7,-35.4 -4.9,-45.7 4.9,-45.7 6.7,-35.4 15.3,-32.6 22.9,-39.9 30.9,-34.1 26.2,-24.6 31.5,-17.3 42.0,-18.8 45.0,-9.5 35.7,-4.5 35.7,4.5 45.0,9.5 42.0,18.8 31.5,17.3 26.2,24.6 30.9,34.1 22.9,39.9 15.3,32.6 6.7,35.4 4.9,45.7 -4.9,45.7 -6.7,35.4 -15.3,32.6 -22.9,39.9 -30.9,34.1 -26.2,24.6 -31.5,17.3 -42.0,18.8 -45.0,9.5 -35.7,4.5 -35.7,-4.5 -45.0,-9.5 -42.0,-18.8 -31.5,-17.3 -26.2,-24.6 -30.9,-34.1 -22.9,-39.9 -15.3,-32.6\" fill=\"none\" stroke=\"#8d93b8\" stroke-width=\"3.8\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><circle r=\"25\" fill=\"none\" stroke=\"#8d93b8\" stroke-width=\"3.8\"/><g fill=\"none\" stroke=\"#8d93b8\" stroke-width=\"3.42\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><circle cy=\"-15\" r=\"4.5\"/><path d=\"M0,-10 L0,16 M-9,-4 L9,-4 M-15,6 Q-14,17 0,17 Q14,17 15,6 M-15,6 L-19,10 M15,6 L19,10\"/></g></g></g>"},"icicle":{"lit":"<g class=\"pz-icicle\"><path class=\"hit\" d=\"M-29.56,12.25 L-38.25,15.84 L-39.78,12.15 A7 7 0 1 0 -46.43,14.91 L-44.90,18.60 L-92.39,38.27 A100 100 0 0 1 -92.39,-38.27 L-44.90,-18.60 L-43.37,-22.29 A7 7 0 1 1 -36.72,-19.54 L-38.25,-15.84 L-29.56,-12.25 A32 32 0 0 0 -29.56,12.25Z\" fill=\"url(#pzicicle)\" stroke=\"#3f2a06\" stroke-width=\"3.6\" stroke-linejoin=\"round\"/><path d=\"M-29.56,12.25 L-38.25,15.84 L-39.78,12.15 A7 7 0 1 0 -46.43,14.91 L-44.90,18.60 L-92.39,38.27 A100 100 0 0 1 -92.39,-38.27 L-44.90,-18.60 L-43.37,-22.29 A7 7 0 1 1 -36.72,-19.54 L-38.25,-15.84 L-29.56,-12.25 A32 32 0 0 0 -29.56,12.25Z\" fill=\"none\" stroke=\"url(#pzgold)\" stroke-width=\"1.9\" stroke-linejoin=\"round\"/><g transform=\"translate(-67.5,0.0) scale(.40)\"><g fill=\"none\" stroke=\"#fff3c4\" stroke-width=\"5.319999999999999\" stroke-linecap=\"round\"><g transform=\"rotate(0)\"><path d=\"M0,0 L0,-46 M0,-28 L-12,-40 M0,-28 L12,-40 M0,-14 L-8,-22 M0,-14 L8,-22\"/></g><g transform=\"rotate(60)\"><path d=\"M0,0 L0,-46 M0,-28 L-12,-40 M0,-28 L12,-40 M0,-14 L-8,-22 M0,-14 L8,-22\"/></g><g transform=\"rotate(120)\"><path d=\"M0,0 L0,-46 M0,-28 L-12,-40 M0,-28 L12,-40 M0,-14 L-8,-22 M0,-14 L8,-22\"/></g><g transform=\"rotate(180)\"><path d=\"M0,0 L0,-46 M0,-28 L-12,-40 M0,-28 L12,-40 M0,-14 L-8,-22 M0,-14 L8,-22\"/></g><g transform=\"rotate(240)\"><path d=\"M0,0 L0,-46 M0,-28 L-12,-40 M0,-28 L12,-40 M0,-14 L-8,-22 M0,-14 L8,-22\"/></g><g transform=\"rotate(300)\"><path d=\"M0,0 L0,-46 M0,-28 L-12,-40 M0,-28 L12,-40 M0,-14 L-8,-22 M0,-14 L8,-22\"/></g></g><polygon points=\"0.0,-13.0 11.3,-6.5 11.3,6.5 0.0,13.0 -11.3,6.5 -11.3,-6.5\" fill=\"none\" stroke=\"#fff3c4\" stroke-width=\"3.8\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/></g><path id=\"pzticicle\" d=\"M-83.16,30.27 A88.5 88.5 0 0 1 -83.16,-30.27\" fill=\"none\"/><text font-family=\"Georgia,serif\" font-size=\"7.2\" font-weight=\"700\" letter-spacing=\"1.6\" fill=\"#f6e4a8\" text-anchor=\"middle\"><textPath href=\"#pzticicle\" startOffset=\"50%\">ICICLE</textPath></text></g>","dark":"<g class=\"pz-icicle\"><path class=\"hit\" d=\"M-29.56,12.25 L-38.25,15.84 L-39.78,12.15 A7 7 0 1 0 -46.43,14.91 L-44.90,18.60 L-92.39,38.27 A100 100 0 0 1 -92.39,-38.27 L-44.90,-18.60 L-43.37,-22.29 A7 7 0 1 1 -36.72,-19.54 L-38.25,-15.84 L-29.56,-12.25 A32 32 0 0 0 -29.56,12.25Z\" fill=\"url(#pzdark)\" stroke=\"#05060c\" stroke-width=\"3.2\" stroke-linejoin=\"round\"/><path d=\"M-29.56,12.25 L-38.25,15.84 L-39.78,12.15 A7 7 0 1 0 -46.43,14.91 L-44.90,18.60 L-92.39,38.27 A100 100 0 0 1 -92.39,-38.27 L-44.90,-18.60 L-43.37,-22.29 A7 7 0 1 1 -36.72,-19.54 L-38.25,-15.84 L-29.56,-12.25 A32 32 0 0 0 -29.56,12.25Z\" fill=\"none\" stroke=\"#3a3f5c\" stroke-width=\"1\" stroke-linejoin=\"round\"/><g transform=\"translate(-67.5,0.0) scale(.40)\" opacity=\".16\"><g fill=\"none\" stroke=\"#8d93b8\" stroke-width=\"5.319999999999999\" stroke-linecap=\"round\"><g transform=\"rotate(0)\"><path d=\"M0,0 L0,-46 M0,-28 L-12,-40 M0,-28 L12,-40 M0,-14 L-8,-22 M0,-14 L8,-22\"/></g><g transform=\"rotate(60)\"><path d=\"M0,0 L0,-46 M0,-28 L-12,-40 M0,-28 L12,-40 M0,-14 L-8,-22 M0,-14 L8,-22\"/></g><g transform=\"rotate(120)\"><path d=\"M0,0 L0,-46 M0,-28 L-12,-40 M0,-28 L12,-40 M0,-14 L-8,-22 M0,-14 L8,-22\"/></g><g transform=\"rotate(180)\"><path d=\"M0,0 L0,-46 M0,-28 L-12,-40 M0,-28 L12,-40 M0,-14 L-8,-22 M0,-14 L8,-22\"/></g><g transform=\"rotate(240)\"><path d=\"M0,0 L0,-46 M0,-28 L-12,-40 M0,-28 L12,-40 M0,-14 L-8,-22 M0,-14 L8,-22\"/></g><g transform=\"rotate(300)\"><path d=\"M0,0 L0,-46 M0,-28 L-12,-40 M0,-28 L12,-40 M0,-14 L-8,-22 M0,-14 L8,-22\"/></g></g><polygon points=\"0.0,-13.0 11.3,-6.5 11.3,6.5 0.0,13.0 -11.3,6.5 -11.3,-6.5\" fill=\"none\" stroke=\"#8d93b8\" stroke-width=\"3.8\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/></g></g>"},"beacon":{"lit":"<g class=\"pz-beacon\"><path class=\"hit\" d=\"M-29.56,-12.25 L-38.25,-15.84 L-36.72,-19.54 A7 7 0 1 0 -43.37,-22.29 L-44.90,-18.60 L-92.39,-38.27 A100 100 0 0 1 -38.27,-92.39 L-18.60,-44.90 L-14.91,-46.43 A7 7 0 1 1 -12.15,-39.78 L-15.84,-38.25 L-12.25,-29.56 A32 32 0 0 0 -29.56,-12.25Z\" fill=\"url(#pzbeacon)\" stroke=\"#3f2a06\" stroke-width=\"3.6\" stroke-linejoin=\"round\"/><path d=\"M-29.56,-12.25 L-38.25,-15.84 L-36.72,-19.54 A7 7 0 1 0 -43.37,-22.29 L-44.90,-18.60 L-92.39,-38.27 A100 100 0 0 1 -38.27,-92.39 L-18.60,-44.90 L-14.91,-46.43 A7 7 0 1 1 -12.15,-39.78 L-15.84,-38.25 L-12.25,-29.56 A32 32 0 0 0 -29.56,-12.25Z\" fill=\"none\" stroke=\"url(#pzgold)\" stroke-width=\"1.9\" stroke-linejoin=\"round\"/><g transform=\"translate(-47.7,-47.7) scale(.40)\"><path d=\"M-11,40 L-6,6 L6,6 L11,40Z\" fill=\"none\" stroke=\"#fff3c4\" stroke-width=\"3.8\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><path d=\"M-8.5,24 L8.5,24 M-9.5,32 L9.5,32\" fill=\"none\" stroke=\"#1c3d78\" stroke-width=\"3.42\"/><rect x=\"-6.5\" y=\"-5\" width=\"13\" height=\"11\" fill=\"none\" stroke=\"#fff3c4\" stroke-width=\"3.8\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><path d=\"M-9,-5 L0,-15 L9,-5Z\" fill=\"none\" stroke=\"#fff3c4\" stroke-width=\"3.8\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><path d=\"M-9,0 L-34,-6 M9,0 L34,-6 M-9,3 L-32,8 M9,3 L32,8\" fill=\"none\" stroke=\"#fff3c4\" stroke-width=\"3.42\" stroke-linecap=\"round\" opacity=\".85\"/><path d=\"M-30,-34 Q-16,-50 0,-34 Q16,-50 30,-34 Q16,-40 0,-25 Q-16,-40 -30,-34Z\" fill=\"none\" stroke=\"#fff3c4\" stroke-width=\"3.8\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><path d=\"M-36,46 Q-27,40 -18,46 T0,46 T18,46 T36,46\" fill=\"none\" stroke=\"#fff3c4\" stroke-width=\"3.42\" stroke-linecap=\"round\"/></g><path id=\"pztbeacon\" d=\"M-80.21,-37.40 A88.5 88.5 0 0 1 -37.40,-80.21\" fill=\"none\"/><text font-family=\"Georgia,serif\" font-size=\"7.2\" font-weight=\"700\" letter-spacing=\"1.6\" fill=\"#f6e4a8\" text-anchor=\"middle\"><textPath href=\"#pztbeacon\" startOffset=\"50%\">GULL</textPath></text></g>","dark":"<g class=\"pz-beacon\"><path class=\"hit\" d=\"M-29.56,-12.25 L-38.25,-15.84 L-36.72,-19.54 A7 7 0 1 0 -43.37,-22.29 L-44.90,-18.60 L-92.39,-38.27 A100 100 0 0 1 -38.27,-92.39 L-18.60,-44.90 L-14.91,-46.43 A7 7 0 1 1 -12.15,-39.78 L-15.84,-38.25 L-12.25,-29.56 A32 32 0 0 0 -29.56,-12.25Z\" fill=\"url(#pzdark)\" stroke=\"#05060c\" stroke-width=\"3.2\" stroke-linejoin=\"round\"/><path d=\"M-29.56,-12.25 L-38.25,-15.84 L-36.72,-19.54 A7 7 0 1 0 -43.37,-22.29 L-44.90,-18.60 L-92.39,-38.27 A100 100 0 0 1 -38.27,-92.39 L-18.60,-44.90 L-14.91,-46.43 A7 7 0 1 1 -12.15,-39.78 L-15.84,-38.25 L-12.25,-29.56 A32 32 0 0 0 -29.56,-12.25Z\" fill=\"none\" stroke=\"#3a3f5c\" stroke-width=\"1\" stroke-linejoin=\"round\"/><g transform=\"translate(-47.7,-47.7) scale(.40)\" opacity=\".16\"><path d=\"M-11,40 L-6,6 L6,6 L11,40Z\" fill=\"none\" stroke=\"#8d93b8\" stroke-width=\"3.8\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><path d=\"M-8.5,24 L8.5,24 M-9.5,32 L9.5,32\" fill=\"none\" stroke=\"#1c3d78\" stroke-width=\"3.42\"/><rect x=\"-6.5\" y=\"-5\" width=\"13\" height=\"11\" fill=\"none\" stroke=\"#8d93b8\" stroke-width=\"3.8\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><path d=\"M-9,-5 L0,-15 L9,-5Z\" fill=\"none\" stroke=\"#8d93b8\" stroke-width=\"3.8\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><path d=\"M-9,0 L-34,-6 M9,0 L34,-6 M-9,3 L-32,8 M9,3 L32,8\" fill=\"none\" stroke=\"#8d93b8\" stroke-width=\"3.42\" stroke-linecap=\"round\" opacity=\".85\"/><path d=\"M-30,-34 Q-16,-50 0,-34 Q16,-50 30,-34 Q16,-40 0,-25 Q-16,-40 -30,-34Z\" fill=\"none\" stroke=\"#8d93b8\" stroke-width=\"3.8\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><path d=\"M-36,46 Q-27,40 -18,46 T0,46 T18,46 T36,46\" fill=\"none\" stroke=\"#8d93b8\" stroke-width=\"3.42\" stroke-linecap=\"round\"/></g></g>"}}};
const BADGE_COL={coal:'#E0742B',forest:'#3FA34D',cobble:'#6C8DB8',fen:'#E56FB4',relic:'#9A68D8',mine:'#8A94A8',icicle:'#6CCBEF',beacon:'#6FB2EE'};
/* simple original emblems, one per badge; drawn in the coin's own colour scheme by CSS */
const BADGE_GLYPH=(()=>{
  const pt=(r,a)=>(16+r*Math.cos(a)).toFixed(2)+','+(16+r*Math.sin(a)).toFixed(2);
  const star=(n,ro,ri)=>{const p=[];for(let i=0;i<n*2;i++)p.push(pt(i%2?ri:ro,Math.PI*i/n-Math.PI/2));return p.join(' ');};
  const gear=(()=>{const p=[];for(let i=0;i<8;i++){const b=i*Math.PI/4;[[-.23,10],[-.15,13.2],[.15,13.2],[.23,10]].forEach(q=>p.push(pt(q[1],b+q[0])));}return p.join(' ');})();
  const arm='M16 3.5v25M12.5 7.5L16 11l3.5-3.5M12.5 24.5L16 21l3.5 3.5';
  const dark='rgba(10,16,40,.38)';
  return{
    coal:'<path d="M16 3.5l9.5 5 3 9.5-5.5 8.5-9.5 2.5-8-6-.5-9.5z"/><path d="M16 3.5L14 14l-8.5 3.5M14 14l9.5 4M14 14l1.5 12.5" fill="none" stroke="'+dark+'" stroke-width="1.4" stroke-linejoin="round"/>',
    forest:'<path d="M4.5 27.5C4 13 13 4.5 27.5 4.5 28 19 19 28 4.5 27.5z"/><path d="M6.5 25.5L21 11" fill="none" stroke="'+dark+'" stroke-width="1.6" stroke-linecap="round"/>',
    cobble:'<circle cx="10.5" cy="20.5" r="6.2"/><circle cx="22" cy="21.5" r="5.2"/><circle cx="16" cy="10" r="5.8"/>',
    fen:'<path d="M16 3.5c5 7 10.5 12 10.5 17.2a10.5 10.5 0 0 1-21 0C5.5 15.5 11 10.5 16 3.5z"/><path d="M10.5 21a5.5 5.5 0 0 0 4.5 5" fill="none" stroke="'+dark+'" stroke-width="2" stroke-linecap="round"/>',
    relic:'<path d="M16 3l12 13-12 13L4 16z"/><circle cx="16" cy="16" r="4.2" fill="rgba(10,16,40,.4)"/><circle cx="16" cy="16" r="1.6"/>',
    mine:'<polygon points="'+gear+'"/><circle cx="16" cy="16" r="3.8" fill="rgba(10,16,40,.4)"/>',
    icicle:'<g fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="'+arm+'"/><path transform="rotate(60 16 16)" d="'+arm+'"/><path transform="rotate(120 16 16)" d="'+arm+'"/></g>',
    beacon:'<polygon points="'+star(8,13.5,6)+'"/><circle cx="16" cy="16" r="3.2" fill="rgba(10,16,40,.35)"/>'
  };
})();
const badgeGlyph=k=>raw('<svg class="gl" viewBox="0 0 32 32" aria-hidden="true" fill="currentColor">'+(BADGE_GLYPH[k]||'')+'</svg>');
function badgeCase(uid,t,ro){
  const bg=t.badges||{};
  const n=badgeCount(t);
  const pop=S.ui.pop;
  const on=k=>!!bg[k];
  return h`<div class="case pz ${n===8?'full':''}" role="group" aria-label="Badge case, ${n} of 8 earned">
    <div class="pzwrap"><svg class="pzbase" viewBox="-114 -114 228 228" aria-hidden="true">${raw('<defs>'+BADGE_PZ.defs+'</defs>'+BADGE_PZ.base+(n===8?BADGE_PZ.crest1:BADGE_PZ.crest0))}</svg>
    ${BADGES.map(([k,nameB,leader])=>h`<button class="pzp ${on(k)?'on':''}${on(k)&&pop&&pop.uid===uid&&pop.key===k?' pop':''}" data-act="badge" data-key="${k}" data-uid="${uid}" aria-pressed="${String(on(k))}" aria-label="${nameB} Badge, from ${leader}" title="${nameB} Badge, from ${leader}${t.bdate&&t.bdate[k]?', won '+clNice(t.bdate[k],{y:1}):''}" ${dis(ro)}><svg viewBox="-114 -114 228 228" aria-hidden="true">${raw(BADGE_PZ.p[k][on(k)?'lit':'dark'])}</svg></button>`)}</div>
    <ul class="pzkey">${BADGES.map(([k,nameB,leader])=>h`<li class="${on(k)?'on':''}"><b>${nameB}</b>${leader}</li>`)}</ul>
  </div>`;
}
/* ---------- Clearance: which restricted places a trainer may enter ----------
   Tiers follow the League's badge counts (as at the Survival Area): Trailhand 0–1, Pathfinder 2–4, Warden 5–6, Vanguard 7+.
   Contest ribbons count the same as badges, so a Coordinator is not stuck in the south. The GM can mark a trainer as holding
   a research permit or travelling with a hired guide, or override the tier (for example, to suspend a license). Those fields
   live on the trainer's own sheet (trainers/<uid>, field "clr"); the page only lets the GM change them.
   Each restricted place lists the tier it needs, and (when there is one) the lower tier that is enough with a guide or a permit. */
const CLR_TIERS=[['Trailhand','0–1 badges'],['Pathfinder','2–4 badges'],['Warden','5–6 badges'],['Vanguard','7+ badges']];
const CLR_REQ=[
  ['route-207','',1,0,null],
  ['route-211','',1,0,null],
  ['route-211','Spine section, past the Crossing Post (Ranger permit too)',2,1,null],
  ['route-212','',1,0,0],
  ['route-216','Ranger permit past the Crossing',2,1,null],
  ['route-217','',3,2,2],
  ['acuity-lakefront','',3,2,2],
  ['route-228','during a blizzard warning',2,0,null],
  ['route-229','once the snow closes in',1,0,null],
  ['route-239','during spring melt',1,0,null],
  ['mt-coronet-and-spear-pillar','tunnels',1,0,null],
  ['mt-coronet-and-spear-pillar','off the marked routes (a permit needs a Ranger escort)',2,null,1,1],
  ['eterna-forest','off the road or after dark',1,0,0,1],
  ['grand-marsh','off the boardwalks',1,0,0,1],
  ['battle-resort-route-226','',1,0,null],
  ['battle-resort-route-228','',1,0,null],
  ['battle-resort-route-227','',3,2,2],
  ['mt-stark','',3,2,2]
];
function clrOf(t){
  const c=(t&&t.clr)||{};
  const n=Math.max(badgeCount(t),ribCount(t));
  const auto=n>=7?3:n>=5?2:n>=2?1:0;
  const ov=c.tier==null?'':String(c.tier);
  const sus=ov==='x';
  const tier=sus?-1:(ov!==''&&CLR_TIERS[+ov]?+ov:auto);
  return {n,auto,tier,sus,over:ov!==''&&!sus,permit:!!c.permit,guide:!!c.guide};
}
function clrStatus(cl,need,g,pm){
  if(cl.sus)return ['warn','License suspended'];
  if(cl.tier>=need)return ['open','Cleared'];
  if(pm!=null&&cl.permit&&cl.tier>=pm)return ['open','On research permit'];
  if(g!=null&&cl.guide&&cl.tier>=g)return ['open','With guide'];
  const ways=[];
  if(g!=null&&cl.tier>=g)ways.push('a hired guide');
  if(pm!=null&&cl.tier>=pm)ways.push('a research permit');
  return ['warn',ways.length?'Needs '+ways.join(' or '):'Needs '+CLR_TIERS[need][0]];
}
function clrPanel(uid,t,ro){
  const cl=clrOf(t),gm=!!S.me.admin,lock=ro||!gm;
  const name=cl.sus?'Suspended':CLR_TIERS[cl.tier][0];
  const next=!cl.sus&&cl.tier<3?CLR_TIERS[cl.tier+1]:null;
  const nextAt=[2,5,7][cl.tier];
  return h`<div class="ribhead"><h3 class="refg">Clearance</h3><span class="pill ${cl.sus?'warn':'open'}">${name}</span>
      <span class="mono sub">${cl.over?'set by the GM':cl.n+' badges or ribbons'}</span></div>
    <p class="sub">${cl.sus?'This trainer\'s license is suspended: Rangers will turn them back from every restricted area.':
      next?'Next tier: '+next[0]+' at '+nextAt+' badges or ribbons.':'The highest tier: every restricted area is open.'}
      ${cl.permit?' Holds a research permit.':''}${cl.guide?' Travelling with a hired guide.':''}</p>
    <details class="clrd"><summary>Restricted areas</summary>
      <div class="clrl">${CLR_REQ.filter(r=>PD_BY[r[0]]).map(([id,part,need,g,pm,adv])=>{let st=clrStatus(cl,need,g,pm);if(adv&&st[0]==='warn'&&!cl.sus)st=['warn',st[1].replace(/^Needs/,'Not advised without')];return h`<div class="clrr"><span><button class="plink" data-act="place" data-id="${id}">${PD_BY[id].name}</button>${part?h` <span class="sub">${part}</span>`:''}</span><span class="pill ${st[0]}">${st[1]}</span></div>`;})}</div>
    </details>
    ${gm?h`<div class="fgrid">${fSel('Tier','t',uid,'clr.tier',t,[['','Automatic ('+CLR_TIERS[cl.auto][0]+')']].concat(CLR_TIERS.map((x,i)=>[String(i),x[0]+' (set by GM)'])).concat([['x','Suspended']]),{ro:lock})}
      <div class="fld"><span class="fl">Credentials</span>${fCheck('Research permit','t',uid,'clr.permit',t,lock)}${fCheck('Hired guide with the party','t',uid,'clr.guide',t,lock)}</div></div>`:''}`;
}

/* ----- badges count toward a Conference for two years after they are won (a table rule) -----
   Each badge remembers the in-game date it was won (trainers/<uid>, field "bdate"), when the calendar has a date. */
const BADGE_LIFE=730;
function clNextEvent(re,from){
  const base=from||clToday();if(!base)return '';
  let best='';
  clEvents().filter(e=>typeof re==='function'?re(e):re.test(e.n)).forEach(e=>{
    let d=e.d;
    if(e.y){const y=+base.slice(0,4);d=y+e.d.slice(4);if(d<base&&!(e.to&&(y+e.to.slice(4))>=base))d=(y+1)+e.d.slice(4);}
    else if(d<base&&!(e.to&&e.to>=base))return;
    if(!best||d<best)best=d;
  });
  return best;
}
function badgeValid(t){
  const won=BADGES.filter(b=>t.badges&&t.badges[b[0]]);
  if(!won.length)return '';
  const conf=clNextEvent(clIsConf);
  const bd=t.bdate||{};
  const late=conf?won.filter(b=>bd[b[0]]&&clDiff(bd[b[0]],conf)>BADGE_LIFE):[];
  const ok=won.length-late.length;
  return h`<p class="sub">Badges count toward a Conference for two years after they are won.${conf?h` Next Conference: <b>${clNice(conf,{y:1})}</b>. ${ok} of ${won.length} badges count for it${late.length?h`; expired by then: ${late.map(b=>b[1]+' (won '+clNice(bd[b[0]],{wd:false,y:1})+')').join(', ')}`:''}.`:''}</p>`;
}
function honorsPanel(uid,t,ro){
  const bg=t.badges||{};
  const hs=t.honors||[];
  const aw=entriesOf(S.awards).filter(a=>a.uid===uid).sort((a,b)=>num(b.createdAt)-num(a.createdAt));
  return h`<section class="panel"><div class="ph"><h2>Honors</h2><span class="mono sub">${badgeCount(t)}/8 Sinnoh badges</span></div>
    ${aw.length?h`<div class="list"><span class="fl">Awarded by the GM</span>${aw.map(a=>h`<div class="award"><div class="row sp"><b>${a.title}</b><span class="pill gm">${a.type}</span></div>${a.note?h`<p class="sub prewrap">${a.note}</p>`:''}<span class="sub">${dt(a.createdAt)}${a.session?' · Session '+a.session:''}${a.levelUp?' · +1 level':''}</span></div>`)}</div>`:''}
    ${badgeCase(uid,t,ro)}
    ${badgeValid(t)}
    ${ribCase(uid,t,ro)}
    ${clrPanel(uid,t,ro)}
    <div class="fgrid">${fNum('Pokédex owned','t',uid,'dex',t,{ro,min:0,max:999})}<p class="sub">Next certificate at ${(Math.floor(num(t.dex)/30)+1)*30} owned.</p></div>
    <div class="list">${hs.map((x,i)=>h`<div class="item"><div class="irow two">${fSel('Type','t',uid,'honors.'+i+'.type',t,HONOR_TYPES,{ro})}${rowBtns('t',uid,'honors',i,hs.length,ro)}</div>${fText('Title','t',uid,'honors.'+i+'.name',t,{ro})}${fText('Note','t',uid,'honors.'+i+'.note',t,{ro})}</div>`)}</div>
    ${ro?'':h`<div><button class="btn sm" data-act="add" ${bp('t',uid,'honors')} data-tpl="honor">Add honor</button></div>`}
  </section>`;
}
function featuresPanel(uid,t,ro,rd){
  const fs=t.features||[];
  if(rd)return h`<section class="panel"><div class="ph"><h2>Features</h2></div>${featRead(fs)||h`<p class="sub">No features written yet.</p>`}</section>`;
  return h`<section class="panel"><div class="ph"><h2>Features</h2>${ro?'':h`<button class="btn sm" data-act="add" ${bp('t',uid,'features')} data-tpl="feature">Add feature</button>`}</div>
    ${fs.length?h`<div class="list">${fs.map((x,i)=>h`<div class="item"><div class="irow two">${fText('Name','t',uid,'features.'+i+'.name',t,{ro})}${rowBtns('t',uid,'features',i,fs.length,ro)}</div>${fArea('What it does','t',uid,'features.'+i+'.text',t,{ro})}</div>`)}</div>`:h`<p class="sub">Class and origin features go here, in your own words.</p>`}
  </section>`;
}
function itemsPanel(uid,t,ro,rd){
  const it=t.items||[];
  if(rd)return h`<section class="panel"><div class="ph"><h2>Inventory</h2></div>
    ${it.length?h`<div class="list">${itemsRead('t',uid,t,it,ro,(x,i)=>h`${isKeyName(x.name)?h`<div class="kline">${keyChip(t)}<span class="sub">Lets your Pokémon Mega Evolve, once per battle.</span></div>`:''}${tmRow(uid,t,x,i,ro)}`)}</div>`:h`<p class="sub">Nothing carried yet.</p>`}</section>`;
  return h`<section class="panel"><div class="ph"><h2>Inventory</h2>${ro?'':h`<button class="btn sm" data-act="add" ${bp('t',uid,'items')} data-tpl="item">Add item</button>`}</div>
    ${it.length?h`<div class="list">${it.map((x,i)=>h`<div class="item"><div class="irow ic">${itemTile(x.name)}${fText('Item','t',uid,'items.'+i+'.name',t,{ro,list:'dl-items'})}${fNum('Qty','t',uid,'items.'+i+'.qty',t,{ro,min:0})}${rowBtns('t',uid,'items',i,it.length,ro)}</div>${fText('Note','t',uid,'items.'+i+'.note',t,{ro})}${isKeyName(x.name)?h`<div class="kline">${keyChip(t)}<span class="sub">Lets your Pokémon Mega Evolve, once per battle.</span></div>`:''}${tmRow(uid,t,x,i,ro)}</div>`)}</div>`:h`<p class="sub">Nothing carried yet.</p>`}
  </section>`;
}
/* the trainer sheet's ID card header (Update 30): a read-out of the fields edited below */
function sheetCard(uid,t){
  const bg=t.badges||{};
  const hp=t.hp||{};
  return h`<article class="panel idcard sheetcard idh${idHash(uid)%6}" aria-label="Trainer ID card">
    <div class="idhead"><span>SINNOH LEAGUE · TRAINER ID</span><span>${idNo(uid)}</span></div>
    <div class="scrow">
      <div class="scpic">${galOpen('t',uid,t,'tall')}</div>
      <div class="scinfo"><h2>${tName(t)}</h2>
        <p class="sub">${[t.cls,t.adv].filter(Boolean).join(' · ')||'Class not chosen'} · Level ${num(t.level)||1}</p>
        <p class="sub">${t.hometown?t.hometown+' · ':''}Played by ${nm(uid)}</p>
        <div class="row sp"><span class="dots" role="img" aria-label="${badgeCount(t)} of 8 badges">${BADGES.map(b=>h`<span class="dot ${bg[b[0]]?'on':''}" ${raw('style="--bc:'+BADGE_COL[b[0]]+'"')} title="${b[1]} Badge"></span>`)}</span><span class="mono sub">${badgeCount(t)}/8 badges</span></div>
        <div class="schp"><span class="sub">HP</span><span class="mono"><b>${num(hp.cur)}</b> / ${num(hp.max)}</span></div>
        ${hpBar(hp)}
      </div>
    </div>
    <div class="idcode" aria-hidden="true"></div>
  </article>`;
}
/* the sheet's sections (Update 34). On a phone one section shows at a time; on a wide screen "All" shows everything, as before. */
const SHEET_TABS=[['stats','Stats & skills'],['feat','Features'],['bag','Bag'],['honors','Honors & career'],['prof','Profile'],['all','All']];
function sheetTabNow(){
  const v=S.ui.sheetTab;
  if(SHEET_TABS.some(x=>x[0]===v))return v;
  return (window.innerWidth||1000)<880?'stats':'all';
}
function trainerTab(){
  const uid=S.viewUid;
  const t=S.trainers[uid];
  if(!t)return h`${trainerPicker()}${emptyTrainer()}`;
  const ro=!canEditT(uid);
  const ek='t'+uid,ed=!ro&&isEd(ek),rd=!ed;
  const tab=sheetTabNow(),show=g=>tab==='all'||tab===g;
  const c1=[show('prof')?identityPanel(uid,t,ro,rd):'',show('stats')?vitalsPanel(uid,t,ro):'',show('honors')?honorsPanel(uid,t,ro):'',show('honors')?rkSheetPanel(uid):'',show('honors')?kitPanel(uid,t,ro||rd):'',show('honors')?agPanel(uid,t,ro||rd):''];
  const c2=[show('stats')?skillsPanel(uid,t,ro):'',show('feat')?featuresPanel(uid,t,ro,rd):'',show('bag')?itemsPanel(uid,t,ro,rd):''];
  const n1=c1.filter(Boolean).length,n2=c2.filter(Boolean).length;
  return h`${trainerPicker()}
    ${!S.trainers[S.me.id]&&!S.me.admin&&S.me.id&&S.me.canWrite?h`<div class="banner">You have no trainer sheet yet. ${createCta()}</div>`:''}
    ${ro?h`<div class="banner">Viewing ${tName(t)}. Only ${nm(uid)} and the GM can change this sheet.</div>`:''}
    ${sheetCard(uid,t)}
    ${ro?'':ed?edBar(ek,'Editing '+tName(t)):h`<div class="row sp rdbar"><span class="sub">Stats, HP, rolls and item counts are live. Use Edit sheet for details, features and the bag list.</span>${edBtn(ek,'Edit sheet')}</div>`}
    <div class="shtabs" role="group" aria-label="Sheet sections">${SHEET_TABS.map(([k,l])=>h`<button class="shtab" data-act="shtab" data-v="${k}" aria-pressed="${String(tab===k)}">${l}</button>`)}</div>
    <div class="sheet ${n1&&n2?'':'one'} ${rd?'rd':''}">
      ${n1?h`<div class="col">${c1}</div>`:''}
      ${n2?h`<div class="col">${c2}</div>`:''}
    </div>
    ${ro||!ed||!show('prof')?'':deleteTrainerPanel(uid,t)}`;
}
function deleteTrainerPanel(uid,t){
  const n=monsOf(uid).length;
  const st=S.ui.delT;
  const word=(t.name||'').trim()||'delete';
  const mine=uid===S.me.id;
  const things=n+" Pokémon"+' and the honors recorded for '+(mine?'you':'this trainer');
  return h`<section class="panel dz"><div class="ph"><h2>Delete this trainer</h2></div>
    ${st.uid===uid?h`<p>This permanently deletes <b>${tName(t)}</b>, ${things}. It cannot be undone. To confirm, type <b>${word}</b> below.</p>
      <div class="fgrid"><label class="fld"><span class="fl">Type to confirm</span><input type="text" data-u="delT.text" data-nr value="${st.text}" autocomplete="off" spellcheck="false" maxlength="80"></label></div>
      <div class="row"><button class="btn sm danger armed" data-act="delTGo" data-uid="${uid}">Delete forever</button><button class="btn sm" data-act="delTCancel">Cancel</button></div>`
      :h`<p class="sub">Removes ${mine?'your':'this'} sheet, ${things}. You will be asked to confirm.</p>
      <div><button class="btn sm danger" data-act="delTOpen" data-uid="${uid}">Delete this trainer…</button></div>`}
  </section>`;
}

/* ---------- pokemon tab ---------- */
const effStat=(m,k)=>num(m.base&&m.base[k])+num(m.bonus&&m.bonus[k])+(m.up===k?1:0)-(m.down===k?1:0)+megaBonus(m,k);
const STAT_OPTS=STATS.map(s=>[s[0],s[1]]);

/* ----- read-first cards (Update 49). A card opens as a clean read view: only what changes in play is a live control
   (HP, status, combat stages, move uses, held item). The pencil switches that one card to the full form; Done switches back.
   The flag lives in S.ui.open under 'ed'+key, so the existing 'toggle' action flips it. ----- */
const PENCIL='<svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>';
const isEd=k=>!!S.ui.open['ed'+k];
function edBtn(k,label){return h`<button class="btn sm edbtn" data-act="toggle" data-key="${'ed'+k}">${raw(PENCIL)}<span>${label||'Edit details'}</span></button>`;}
function edBar(k,title){return h`<div class="edbar"><div><b>${title}</b><span class="sub">Changes save as you type.</span></div><button class="btn sm primary" data-act="toggle" data-key="${'ed'+k}">Done</button></div>`;}
function rdFacts(pairs){
  const xs=pairs.filter(x=>x&&x[1]!=null&&x[1]!=='');
  return xs.length?h`<dl class="rdfacts">${xs.map(([k,v])=>h`<div><dt>${k}</dt><dd>${v}</dd></div>`)}</dl>`:'';
}
function natureTxt(o){
  const nmOf=k=>{const st=STATS.find(x=>x[0]===k);return st?st[1]:'';};
  const eff=[o.up?'raises '+nmOf(o.up):'',o.down?'lowers '+nmOf(o.down):''].filter(Boolean).join(', ');
  return [o.natureName||'',eff?(o.natureName?'('+eff+')':eff):''].filter(Boolean).join(' ');
}
/* one move in the read view: the name is a button that opens the effect text; daily uses are tap-to-spend dots */
function mvRead(sc,id,path,x,ro,xkey,after){
  const mm=/^(\d+)\s*\/\s*day/i.exec(x.freq||'');
  const n=mm?clamp(+mm[1],1,9):0;
  const used=num(x.used);
  const open=!!S.ui.open[xkey];
  const sty=x.kind==='Style';
  const meta=[x.freq,sty?'':x.kind,x.range].filter(Boolean).join(' · ');
  return h`<div class="move rdmv ${sty?'mvstyle':''}">
    <div class="rdm1"><button class="rdmname" data-act="toggle" data-key="${xkey}" aria-expanded="${String(open)}"><b>${x.name||'Unnamed move'}</b><span class="sub">${meta}${meta?' · ':''}${open?'hide text':'show text'}</span></button>
      ${n?h`<span class="pips" role="group" aria-label="Daily uses of ${x.name||'this move'}">${Array.from({length:n},(_,j)=>h`<button class="pip ${j<used?'spent':''}" data-act="pip" ${bp(sc,id,path+'.used')} data-j="${j}" aria-label="Use ${j+1}${j<used?', spent':''}" ${dis(ro)}></button>`)}</span>`:''}
      ${x.dice?h`<span class="rddice">${x.dice}</span>`:''}${sty?h`<span class="pill sty">Style</span>`:''}${x.type?chipsOf([x.type]):''}</div>
    ${open?h`<p class="rdmtxt">${String(x.text||'').trim()||'No effect text written for this move.'}</p>`:''}
    ${after||''}
  </div>`;
}
function featRead(fs){
  const xs=(fs||[]).filter(x=>String(x.name||'').trim()||String(x.text||'').trim());
  return xs.length?h`<ul class="mini-list rdps">${xs.map(x=>h`<li><b>${x.name||'Unnamed feature'}</b><span class="sub rdnote">${x.text}</span></li>`)}</ul>`:'';
}
/* the bag in the read view: the count stays a live field, the rest is text */
function itemsRead(sc,id,doc,it,ro,extra){
  return (it||[]).map((x,i)=>h`<div class="item rdit"><div class="rdirow">${itemTile(x.name)}<div class="rditx"><b>${x.name||'Unnamed item'}</b>${String(x.note||'').trim()?h`<span class="sub">${x.note}</span>`:''}</div>${ro?h`<span class="rdqty">×${num(x.qty)}</span>`:fNum('Qty',sc,id,'items.'+i+'.qty',doc,{min:0})}</div>${extra?extra(x,i):''}</div>`);
}
function monRead(uid,m,ro){
  const id=uid+'/'+m.id,key='p'+id;
  const tiles=STATS.map(([k,full,ab])=>{
    const f=effStat(m,k);
    return h`<div class="stat lcd"><span class="sl">${ab}</span><span class="sv">${f}</span>
      <span class="sm"><span>mod ${sgn(mod(f))}</span>${megaBonus(m,k)?h`<span class="mbn">Mega ${sgn(megaBonus(m,k))}</span>`:''}${k==='spe'?h`<span>${f*5} ft</span>`:''}</span></div>`;
  });
  const ps=(m.passives||[]).filter(x=>String(x.name||'').trim()||String(x.text||'').trim());
  const mv=m.moves||[];
  const gl=S.gmLoy[m.id]||{};
  const L=clamp(num(gl.loyalty),0,5);
  const cs=ctStatsOf(m),ctot=ctStatTotal(cs);
  const itOpen=!ro&&!!S.ui.open['it'+key];
  return h`<div class="mb rd">
    <div class="rdtop"><div class="spr big">${monPic(m)}</div>
      <div class="rdtx">${rdFacts([['Species',m.species],['Gender',m.gender],['Size',[m.size,m.weight].filter(Boolean).join(', ')],['Monster die',m.die],['Nature',natureTxt(m)],['Poké Ball',m.ball],['Got it',m.caught]])||h`<p class="sub">Nothing filled in yet.</p>`}</div>
      ${ro?'':edBtn(key)}</div>
    <div class="stats">${hpTile('p',id,m.hp,ro)}${tiles}</div>
    <div class="lcd acc"><span>Attack ${sgn(mod(effStat(m,'atk')))}</span><span>Sp. Attack ${sgn(mod(effStat(m,'spa')))}</span><span>Effect ${sgn(mod(effStat(m,'spe')))}</span></div>
    <div class="rdsec"><span class="fl">Status</span>${ro?h`<span>${m.status||'None'}</span>`:afflChips('p',id,'status',m.status,false,'')}${afflNotes(m.status)}</div>
    <div class="stgbox"><div class="row sp"><span class="fl">Combat stages</span>${STATS.some(s=>stg(m,s[0]))?'':h`<span class="sub">none right now</span>`}</div>${stagePanel('p',id,'stages',m,ro,'')}</div>
    ${megaPanel(uid,m,ro)}
    <div class="rdsec rditem"><span class="fl">Held item</span>${itOpen?h`${fText('Held item','p',id,'item',m,{list:'dl-items'})}<button class="btn sm" data-act="toggle" data-key="${'it'+key}">Done</button>`:h`<span class="rdval">${m.item?h`${itemMini(m.item)}${m.item}`:'None'}</span>${ro?'':h`<button class="btn sm ghost" data-act="toggle" data-key="${'it'+key}">Change</button>`}`}</div>
    ${String(m.skills||'').trim()?h`<div class="rdsec"><span class="fl">Skills</span><span>${m.skills}</span></div>`:''}
    <div class="list"><div class="ph"><h2>Moves</h2><span class="sub">${mv.length?'Tap a move to read its effect.':''}</span></div>
      ${mv.length?mv.map((x,i)=>mvRead('p',id,'moves.'+i,x,ro,'mx'+key+'#'+i,ro||x.kind==='Style'||!String(x.name||'').trim()?'':h`<div class="row mvroll"><button class="btn sm ${S.ui.mr.key===mrKey(uid,m.id,i)?'primary':''}" data-act="b_mopen" data-uid="${uid}" data-pid="${m.id}" data-i="${i}" aria-expanded="${String(S.ui.mr.key===mrKey(uid,m.id,i))}">Roll ${x.name}</button></div>${moveForm(uid,m.id,i,x)}`)):h`<p class="sub">No moves listed yet.${ro?'':' Use Edit details to add them.'}</p>`}</div>
    <div class="list"><div class="ph"><h2>Passives</h2></div>
      ${ps.length?h`<ul class="mini-list rdps">${ps.map(x=>h`<li><b>${x.name||'Unnamed passive'}</b><span class="sub">${x.text}</span></li>`)}</ul>`:h`<p class="sub">No passives listed yet.</p>`}</div>
    ${ctot?h`<div class="rdsec"><span class="fl">Contest stats</span><span class="row">${CT_TYPES.filter(t=>num(cs[t])).map(t=>h`<span>${ctChip(t)} ${cs[t]}</span>`)}</span></div>`:''}
    ${String(m.notes||'').trim()?h`<div class="rdsec"><span class="fl">Notes</span><p class="rdnote">${m.notes}</p></div>`:''}
    ${S.me.admin?h`<div class="secret"><span class="fl">GM only · Loyalty</span>
      <div class="row"><div class="seg" role="group" aria-label="Loyalty">${[0,1,2,3,4,5].map(n=>h`<button data-act="loy" data-pid="${m.id}" data-uid="${uid}" data-n="${n}" aria-pressed="${String(L===n)}">${n}</button>`)}</div><span class="sub">${LOY_WORDS[L]}</span></div>
      ${String(gl.note||'').trim()?h`<p class="rdnote"><b>Private notes:</b> ${gl.note}</p>`:''}</div>`:''}
  </div>`;
}

function moveRow(id,m,x,i,ro){
  const mm=/^(\d+)\s*\/\s*day/i.exec(x.freq||'');
  const n=mm?clamp(+mm[1],1,9):0;
  const used=num(x.used);
  const p='moves.'+i+'.';
  const sty=x.kind==='Style';
  return h`<div class="move ${sty?'mvstyle':''}">
    <div class="mv1">
      ${fText('Move','p',id,p+'name',m,{ro,list:'dl-moves'})}
      ${fText('Uses','p',id,p+'freq',m,{ro,list:'dl-freq'})}
      ${n?h`<span class="pips" role="group" aria-label="Daily uses">${Array.from({length:n},(_,j)=>h`<button class="pip ${j<used?'spent':''}" data-act="pip" ${bp('p',id,'moves.'+i+'.used')} data-j="${j}" aria-label="Use ${j+1}" ${dis(ro)}></button>`)}</span>`:h`<span></span>`}
      ${rowBtns('p',id,'moves',i,(m.moves||[]).length,ro)}
    </div>
    ${ro||sty||!String(x.name||'').trim()?'':h`<div class="row mvroll"><button class="btn sm ${S.ui.mr.key===mrKey(id.split('/')[0],id.split('/')[1],i)?'primary':''}" data-act="b_mopen" data-uid="${id.split('/')[0]}" data-pid="${id.split('/')[1]}" data-i="${i}" aria-expanded="${String(S.ui.mr.key===mrKey(id.split('/')[0],id.split('/')[1],i))}">Roll ${x.name}</button></div>`}
    ${ro?'':moveForm(id.split('/')[0],id.split('/')[1],i,x)}
    <div class="mv2">
      ${fSel('Kind','p',id,p+'kind',m,KINDS,{ro})}
      ${fSel('Type','p',id,p+'type',m,TYPES,{ro})}
      ${fText('Range','p',id,p+'range',m,{ro})}
      ${fText('Damage','p',id,p+'dice',m,{ro,ph:'e.g. 3d8'})}
    </div>
    ${fArea('Effect','p',id,p+'text',m,{ro,rows:2})}
    ${sty?h`<p class="sub stynote"><span class="pill sty">Style</span> No attack roll and no damage. Use it when its text says to.${styleCount(m)>1&&!hasPassive(m,'luckycharm')?' A Pokémon normally has only one Style.':''}</p>`:''}
    ${ctLine(id,m,x,i,ro)}
  </div>`;
}

/* the five contest stats: written on the sheet, spent in the Appeal helper on the Contests page */
function csPanel(id,m,ro){
  const cs=ctStatsOf(m);
  const tot=ctStatTotal(cs);
  return h`<div class="list cspanel"><div class="ph"><h2>Contest stats</h2><span class="pill ${tot>10?'wary':''}">${tot} of 10</span></div>
    <div class="csgrid">${CT_TYPES.map(t=>h`<label class="fld cs"><span class="fl">${ctChip(t)}</span><input type="number" inputmode="numeric" aria-label="${t} contest stat" ${bd('p',id,'cs.'+t.toLowerCase())} value="${cs[t]}" ${attr('data-min',0)} ${attr('data-max',30)} ${dis(ro)}></label>`)}</div>
    <p class="sub">${tot>10?'That is more than the 10 points the handbook allows. Only scarves can push the total past 10. ':''}Points from Poffins and PokéBlocks. In a contest they can be spent on a move of the matching type; the Appeal helper on the Contests page keeps count.</p>
  </div>`;
}

function monBody(uid,m,ro,pos,len){
  const id=uid+'/'+m.id;
  if(ro||!isEd('p'+id))return monRead(uid,m,ro);
  const tiles=STATS.map(([k,full,ab])=>{
    const f=effStat(m,k);
    return h`<div class="stat lcd"><span class="sl">${ab}</span><span class="sv">${f}</span>
      <span class="sm"><span>mod ${sgn(mod(f))}</span>${megaBonus(m,k)?h`<span class="mbn">Mega ${sgn(megaBonus(m,k))}</span>`:''}${k==='spe'?h`<span>${f*5} ft</span>`:''}</span>
      <div class="mini"><label>Base<input type="number" ${bd('p',id,'base.'+k)} value="${m.base&&m.base[k]}" ${dis(ro)}></label><label>Adj<input type="number" ${bd('p',id,'bonus.'+k)} value="${m.bonus&&m.bonus[k]}" ${dis(ro)}></label></div></div>`;
  });
  const ps=m.passives||[];
  const mv=m.moves||[];
  const gl=S.gmLoy[m.id]||{};
  const L=clamp(num(gl.loyalty),0,5);
  return h`<div class="mb">
    ${edBar('p'+id,'Editing '+mName(m))}
    <div class="idrow"><div class="idimg sq"><div class="spr big">${monPic(m)}</div>${imgPicker('p',id,'img',m,320,320,50000,ro)}</div>
    <div class="fgrid">
      ${fText('Nickname','p',id,'nick',m,{ro})}
      ${fText('Species','p',id,'species',m,{ro,list:'dl-species'})}
      ${fSel('Gender','p',id,'gender',m,GENDERS,{ro,blank:'Not set'})}
      <div class="fld shn"><span class="fl">Colour</span>${fCheck('Shiny ✦','p',id,'shiny',m,ro)}</div>
      ${fSel('Type 1','p',id,'types.0',m,TYPES,{ro,blank:'None'})}
      ${fSel('Type 2','p',id,'types.1',m,TYPES,{ro,blank:'None'})}
      ${fSel('Size','p',id,'size',m,SIZES,{ro})}
      ${fSel('Weight','p',id,'weight',m,WEIGHTS,{ro})}
      ${fSel('Monster die','p',id,'die',m,DICE,{ro,blank:'Not set'})}
      ${(()=>{const r=ro?null:evoRecOf(m),hd=r?ptaDie(r):'';return hd&&hd!==m.die?h`<div class="fld"><span class="fl">Handbook die</span><button class="btn sm" data-act="p_die" data-id="${id}" data-v="${hd}">Use ${hd}</button></div>`:'';})()}
      ${fText('Held item','p',id,'item',m,{ro,list:'dl-items'})}
      ${fText('Nature','p',id,'natureName',m,{ro})}
      ${fSel('Nature raises','p',id,'up',m,STAT_OPTS,{ro,blank:'None'})}
      ${fSel('Nature lowers','p',id,'down',m,STAT_OPTS,{ro,blank:'None'})}
      ${fText('Status','p',id,'status',m,{ro,list:'dl-status'})}
      ${fText('Poké Ball','p',id,'ball',m,{ro,list:'dl-balls'})}
      ${fText('Where or how you got it','p',id,'caught',m,{ro,list:'dl-places',cls:'wide'})}
      ${ro?'':fillHint(uid,m)}
    </div></div>
    <div class="stats">${hpTile('p',id,m.hp,ro)}${tiles}</div>
    <div class="lcd acc"><span>Attack ${sgn(mod(effStat(m,'atk')))}</span><span>Sp. Attack ${sgn(mod(effStat(m,'spa')))}</span><span>Effect ${sgn(mod(effStat(m,'spe')))}</span></div>
    <div class="stgbox"><div class="row sp"><span class="fl">Combat stages</span>${STATS.some(s=>stg(m,s[0]))?'':h`<span class="sub">none right now</span>`}</div>${stagePanel('p',id,'stages',m,ro,'')}</div>
    ${megaPanel(uid,m,ro)}
    ${evoPanel(uid,m,ro)}
    ${fText('Skills','p',id,'skills',m,{ro,ph:'Short list, separated by commas'})}
    ${ro?'':psHint(uid,m)}
    <div class="list"><div class="ph"><h2>Passives</h2>${ro||ps.length>=TPL_MAX.passives?'':h`<button class="btn sm" data-act="add" ${bp('p',id,'passives')} data-tpl="passive">Add passive</button>`}<span class="sub">${ps.length>TPL_MAX.passives?ps.length+' (usual limit '+TPL_MAX.passives+')':ps.length+' of '+TPL_MAX.passives}</span></div>
      ${ps.map((x,i)=>h`<div class="item"><div class="irow two">${fText('Passive','p',id,'passives.'+i+'.name',m,{ro,list:'dl-passives'})}${rowBtns('p',id,'passives',i,ps.length,ro)}</div>${fArea('Effect','p',id,'passives.'+i+'.text',m,{ro})}</div>`)}</div>
    <div class="list"><div class="ph"><h2>Moves</h2>${ro||mv.length>=TPL_MAX.moves?'':h`<button class="btn sm" data-act="add" ${bp('p',id,'moves')} data-tpl="move">Add move</button>`}<span class="sub">${mv.length>TPL_MAX.moves?mv.length+' (usual limit '+TPL_MAX.moves+')':mv.length+' of '+TPL_MAX.moves}</span></div>
      ${mv.map((x,i)=>moveRow(id,m,x,i,ro))}</div>
    ${csPanel(id,m,ro)}
    ${fArea('Notes','p',id,'notes',m,{ro,rows:3})}
    ${S.me.admin?h`<div class="secret"><span class="fl">GM only · Loyalty</span>
      <div class="row"><div class="seg" role="group" aria-label="Loyalty">${[0,1,2,3,4,5].map(n=>h`<button data-act="loy" data-pid="${m.id}" data-uid="${uid}" data-n="${n}" aria-pressed="${String(L===n)}">${n}</button>`)}</div><span class="sub">${LOY_WORDS[L]}</span></div>
      ${fArea('Private notes on this Pokémon','gl',m.id,'note',gl,{rows:2})}</div>`:''}
    ${ro?'':h`<div class="row sp">
      <div class="row"><button class="btn sm" data-act="slot" data-uid="${uid}" data-pid="${m.id}">${m.slot==='box'?'Move to party':'Move to box'}</button>
        <button class="btn sm ghost" data-act="ord" data-uid="${uid}" data-pid="${m.id}" data-d="-1" ${pos===0?raw('disabled'):''} aria-label="Move earlier">↑</button>
        <button class="btn sm ghost" data-act="ord" data-uid="${uid}" data-pid="${m.id}" data-d="1" ${pos===len-1?raw('disabled'):''} aria-label="Move later">↓</button></div>
      ${delBtn('p',id,'Delete Pokémon')}</div>`}
  </div>`;
}

function monCard(uid,m,ro,pos,len){
  const key='p'+uid+'/'+m.id;
  const open=!!S.ui.open[key];
  const loy=S.me.admin?clamp(num((S.gmLoy[m.id]||{}).loyalty),0,5):null;
  const mon=megaOn(m);
  const spLabel=mon?(m.mega.form||'Mega form'):m.species;
  const pop=S.ui.megaPop&&S.ui.megaPop.pid===m.id&&S.ui.megaPop.uid===uid;
  const epop=S.ui.evoPop&&S.ui.evoPop.pid===m.id&&S.ui.evoPop.uid===uid;
  return h`<article class="mon ${open?'open':''} ${mon?'mega':''} ${pop?'megapop':''} ${epop?'evopop':''}" ${typeVars(m)}>
    <div class="mh">
      <div class="mt"><div class="spr">${monPic(m)}</div><div class="mtx"><h3>${mName(m)}</h3>
        <p class="sub">${[m.nick&&spLabel?spLabel:'',m.ball?h`${itemMini(m.ball)}${m.ball}`:'',m.item?h`${itemMini(m.item)}holding ${m.item}`:''].filter(x=>x!=='').map((b,i)=>h`${i?' · ':''}${b}`)}</p>
        <div class="types">${typeChips(m)}${genPill(m.gender)}${m.shiny===true?h`<span class="pill shiny"><span aria-hidden="true">✦</span> Shiny</span>`:''}${mon?h`<span class="pill mega">Mega</span>`:''}${m.status?h`<span class="pill status">${m.status}</span>`:''}${stgPills(m)}${loy!==null?h`<span class="pill gm">Loyalty ${loy}</span>`:''}</div></div>
        <button class="btn sm" data-act="toggle" data-key="${key}" aria-expanded="${String(open)}">${open?'Close':'Open'}</button></div>
      <div class="hpline">${hpBar(m.hp)}<span class="mono">${num(m.hp&&m.hp.cur)}/${num(m.hp&&m.hp.max)}</span></div>
      ${open?'':h`<p class="movesum">${(m.moves||[]).map(x=>x.name).filter(Boolean).join(' · ')||'No moves listed yet'}</p>`}
    </div>
    ${open?monBody(uid,m,ro,pos,len):''}
  </article>`;
}

function pokemonTab(){
  const uid=S.viewUid;
  const t=S.trainers[uid];
  if(!t)return h`${trainerPicker()}${emptyTrainer()}`;
  const ro=!canEditT(uid);
  const pt=partyOf(uid),bx=boxOf(uid);
  if(PTA.idx&&!ro)ptaLists();
  return h`${trainerPicker()}
    <section class="panel"><div class="ph"><h2>${tName(t)}’s Pokémon</h2>
      <div class="acts">${ro?'':h`<button class="btn primary sm" data-act="newMon">Add Pokémon</button><button class="btn sm" data-act="heal">Pokémon Center</button><button class="btn sm" data-act="rest">Rest 8h</button><button class="btn sm" data-act="endBattle">End battle</button>`}</div></div>
      <p class="sub">Carrying ${pt.length} of 6. Pokémon Center restores HP and clears status. Rest 8h refills daily move uses. End battle reverts Mega forms and recharges the Key Stone.</p>
      ${hasKey(t)?h`<div class="row">${keyChip(t,true)}</div>`:(pt.concat(bx).some(m=>m.mega)?h`<p class="sub">To Mega Evolve, add a Key Stone to the trainer’s inventory.</p>`:'')}</section>
    ${pt.length||bx.length?'':emptyState('No Pokémon yet',ro?'Nothing here yet.':'Add your starter to begin.')}
    ${pt.length?h`<div class="list"><div class="ph"><h2>Party</h2></div><div class="mons">${pt.map((m,i)=>monCard(uid,m,ro,i,pt.length))}</div></div>`:''}
    ${bx.length?h`<div class="list"><div class="ph"><h2>Box</h2><span class="sub">${bx.length} stored</span></div><div class="mons">${bx.map((m,i)=>monCard(uid,m,ro,i,bx.length))}</div></div>`:''}
    ${brPanel(uid,ro)}`;
}

/* ---------- people tab ---------- */
const entriesOf=(coll)=>Object.entries(coll).map(([id,e])=>Object.assign({id},e));
const attLabel=a=>(ATTITUDES.find(x=>x[0]===a)||ATTITUDES[0])[1];
/* ---------- sorting NPCs into kinds: chips with counts, a sort choice, and a switch to group by kind.
   sc is 'p' for the People page and 'n' for the GM's NPC trainers; the choices live in S.ui.f (this browser only). ---------- */
const CF_SORTS={
  p:[['name','Name A–Z'],['recent','Newest first'],['met','Session met'],['cat','Category'],['att','Attitude']],
  n:[['order','My order'],['name','Name A–Z'],['recent','Newest first'],['cat','Category'],['team','Most Pokémon']]
};
const CF_ATT=['friendly','neutral','wary','hostile','unknown'];
const cfCatIdx=(c,gm)=>{const i=npcCatList(gm).findIndex(x=>x[0]===c);return i<0?99:i;};
const cfPass=(want,c)=>!want||(want==='none'?c==='':c===want);
const cfName=(a,b)=>String(a||'').localeCompare(String(b||''));
function cfGroups(items,catOf,on,gm){
  if(!on)return [['',items]];
  return npcCatList(gm).map(x=>x[0]).concat(['']).map(k=>[k,items.filter(x=>catOf(x)===k)]).filter(g=>g[1].length);
}
const cfHead=(k,n)=>h`<div class="ph cfh"><h2>${k?npcCatName(k):'No category'}</h2><span class="sub">${n}</span></div>`;
function cfTools(sc,cats){
  const gm=sc==='n';
  const cur=S.ui.f[sc+'cat']||'';
  const cnt={};
  cats.forEach(c=>{cnt[c]=(cnt[c]||0)+1;});
  const chips=[['','All',cats.length]].concat(npcCatList(gm).filter(x=>cnt[x[0]]||cur===x[0]).map(x=>[x[0],x[1],cnt[x[0]]||0]));
  if(cnt['']||cur==='none')chips.push(['none','No category',cnt['']||0]);
  const sorts=CF_SORTS[sc];
  const sort=sorts.some(x=>x[0]===S.ui.f[sc+'sort'])?S.ui.f[sc+'sort']:sorts[0][0];
  return h`<div class="row evchips cfchips" role="group" aria-label="Show one kind of NPC">${chips.map(([k,l,n])=>h`<button class="btn sm chk" data-act="cf_cat" data-sc="${sc}" data-v="${k}" aria-pressed="${String(cur===k)}">${l} <span class="cfn">${n}</span></button>`)}</div>
    <div class="tools"><label class="fld"><span class="fl">Sort by</span><select data-u="f.${sc}sort">${sorts.map(([k,l])=>h`<option value="${k}" ${sort===k?raw('selected'):''}>${l}</option>`)}</select></label>
      <label class="row"><input type="checkbox" data-u="f.${sc}grp" ${S.ui.f[sc+'grp']?raw('checked'):''}><span>Group by category</span></label></div>`;
}
function cfAct(b){
  const d=b.dataset;
  if(d.act==='cf_cat'){S.ui.f[d.sc+'cat']=d.v;render();}
}
function personCard(p){
  const open=!!S.ui.open['ppl'+p.id];
  const gn=S.gmNpc[p.id]||{};
  const canE=canShared();
  if(open&&canE){
    return h`<article class="entry">
      <div class="idrow"><div class="idimg">${picEditor('ppl',p.id,p,false)}${imgPicker('ppl',p.id,'img',p,0,0,90000,false,640)}${picFrame('ppl',p.id,p,false)}${galPanel('ppl',p.id,p,false)}</div>
      <div class="fgrid">
        ${fText('Name','ppl',p.id,'name',p,{cls:'wide'})}
        ${fText('Role or title','ppl',p.id,'role',p)}
        ${fText('Where you met','ppl',p.id,'place',p,{list:'dl-places'})}
        ${fNum('Session met','ppl',p.id,'met',p,{min:0})}
        ${fSel('Attitude','ppl',p.id,'att',p,ATTITUDES)}
        ${fSel('Category','ppl',p.id,'cat',p,npcCatList(false),{blank:'Auto'+(npcCatGuess((p.role||'')+' '+(p.name||''),false)?': '+npcCatName(npcCatGuess((p.role||'')+' '+(p.name||''),false)):' (no guess yet)')})}
        ${fArea('What you know','ppl',p.id,'notes',p,{rows:3,cls:'wide'})}
      </div></div>
      ${fCheck('Pin to top','ppl',p.id,'pinned',p,false)}
      ${S.me.admin?h`<div class="secret"><span class="fl">GM only · Secret</span>${fArea('Hidden from players','gn',p.id,'secret',gn,{rows:3})}</div>`:''}
      <div class="row sp"><button class="btn sm" data-act="toggle" data-key="ppl${p.id}">Done</button>${canOwn(p)?delBtn('ppl',p.id,'Delete'):''}</div>
    </article>`;
  }
  return h`<article class="entry pcard">
    ${galOpen('ppl',p.id,p,'tall')}
    <div class="pc-body">
    <div class="row sp"><h3>${p.pinned?'★ ':''}${p.name||'Unnamed person'}</h3><span class="pill ${p.att||'unknown'}">${attLabel(p.att)}</span></div>
    <div class="meta">${npcCatOf(p.cat,(p.role||'')+' '+(p.name||''),false)?h`<span class="pill cat">${npcCatName(npcCatOf(p.cat,(p.role||'')+' '+(p.name||''),false))}</span>`:''}${p.role?h`<span>${p.role}</span>`:''}${p.place?h`<span>Met at ${p.place}</span>`:''}${p.met?h`<span>Session ${p.met}</span>`:''}</div>
    ${p.notes?h`<p class="prewrap">${p.notes}</p>`:h`<p class="sub">Nothing written down yet.</p>`}
    ${S.me.admin&&gn.secret?h`<div class="secret"><span class="fl">GM only · Secret</span><p class="prewrap">${gn.secret}</p></div>`:''}
    ${canE?h`<div><button class="btn sm" data-act="toggle" data-key="ppl${p.id}">Edit</button></div>`:''}
    </div>
  </article>`;
}
function peopleTab(){
  const q=String(S.ui.q.people||'').toLowerCase();
  const af=S.ui.f.att||'';
  const cat=S.ui.f.pcat||'';
  const sorts=CF_SORTS.p;
  const sort=sorts.some(x=>x[0]===S.ui.f.psort)?S.ui.f.psort:'name';
  const grp=!!S.ui.f.pgrp;
  const catOf=p=>npcCatOf(p.cat,(p.role||'')+' '+(p.name||''),false);
  const pubN=(S.npcPub&&S.npcPub.n)||{};
  const pubCat=id=>NPC_CATS.some(x=>x[0]===pubN[id].c)?pubN[id].c:'';
  const cats=Object.keys(S.people).map(id=>catOf(S.people[id])).concat(Object.keys(pubN).map(pubCat));
  const ord=(a,b)=>(b.pinned?1:0)-(a.pinned?1:0);
  const cmp={
    name:(a,b)=>cfName(a.name,b.name),
    recent:(a,b)=>num(b.createdAt)-num(a.createdAt)||cfName(a.name,b.name),
    met:(a,b)=>num(b.met)-num(a.met)||cfName(a.name,b.name),
    cat:(a,b)=>cfCatIdx(catOf(a),false)-cfCatIdx(catOf(b),false)||cfName(a.name,b.name),
    att:(a,b)=>CF_ATT.indexOf(a.att||'unknown')-CF_ATT.indexOf(b.att||'unknown')||cfName(a.name,b.name)
  }[sort];
  const list=entriesOf(S.people)
    .filter(p=>(!af||p.att===af)&&cfPass(cat,catOf(p))&&(!q||[p.name,p.role,p.place,p.notes].some(x=>String(x||'').toLowerCase().includes(q))))
    .sort((a,b)=>ord(a,b)||cmp(a,b));
  const total=Object.keys(S.people).length;
  const groups=cfGroups(list,catOf,grp,false);
  return h`${ntPublicPanel({cat,q,sort,grp,pubCat})}<section class="panel"><div class="ph"><h2>People you have met</h2>${canShared()?h`<button class="btn primary sm" data-act="newDoc" data-kind="ppl">Add person</button>`:''}</div>
    <p class="sub">Shared by the whole party. Anyone can add or edit; only the author or the GM can delete. Each person is sorted into a kind (gym leader, ranger, shopkeeper and so on); open one with Edit to change it.</p>
    ${cfTools('p',cats)}
    <div class="tools"><label class="fld"><span class="fl">Search</span><input type="search" data-u="q.people" value="${S.ui.q.people||''}" placeholder="Name, place, notes"></label>
      <label class="fld"><span class="fl">Attitude</span><select data-u="f.att"><option value="">Everyone</option>${ATTITUDES.map(([v,l])=>h`<option value="${v}" ${af===v?raw('selected'):''}>${l}</option>`)}</select></label></div></section>
    ${list.length?groups.map(([k,items])=>h`${grp?cfHead(k,items.length):''}<div class="grid cards">${items.map(personCard)}</div>`):emptyState(total?'No matches':'No one met yet',total?'Try a different search or filter.':'Add the people your trainers meet: gym leaders, rivals, shopkeepers, strangers who seemed off.')}`;
}

/* ---------- journal tab ---------- */
function entryCard(sc,e,shared){
  const key=sc+e.id;
  const open=!!S.ui.open[key];
  const canE=shared?canOwn(e):S.me.canWrite;
  if(open&&canE){
    return h`<article class="entry">
      <div class="fgrid">
        ${shared?fNum('Session','j',e.id,'session',e,{min:0}):''}
        ${fText('Title',sc,e.id,'title',e,{cls:'wide'})}
        ${shared?fText('Place','j',e.id,'place',e,{list:'dl-places'}):''}
        ${fArea(shared?'What happened':'Note',sc,e.id,'body',e,{rows:6,cls:'wide'})}
      </div>
      <div class="row sp"><div class="row"><button class="btn sm" data-act="toggle" data-key="${key}">Done</button>${shared?'':h`<button class="btn sm" data-act="shareNote" data-id="${e.id}">Share to party log</button>`}</div>${delBtn(sc,e.id,'Delete')}</div>
    </article>`;
  }
  return h`<article class="entry">
    <h3>${e.title||'Untitled entry'}</h3>
    <div class="meta">${shared?h`<span>Session ${num(e.session)||'?'}</span>`:''}${e.place?h`<span>${e.place}</span>`:''}${shared&&e.addedBy?h`<span>by ${nm(e.addedBy)}</span>`:''}<span>${dt(e.createdAt)}</span></div>
    ${e.body?h`<p class="prewrap">${e.body}</p>`:h`<p class="sub">Empty so far.</p>`}
    ${canE?h`<div><button class="btn sm" data-act="toggle" data-key="${key}">Edit</button></div>`:''}
  </article>`;
}
function journalTab(){
  const sub=S.ui.sub==='mine'?'mine':'party';
  const q=String(S.ui.q.journal||'').toLowerCase();
  const src=sub==='mine'?S.notes:S.journal;
  const list=entriesOf(src).filter(e=>!q||[e.title,e.body,e.place].some(x=>String(x||'').toLowerCase().includes(q)))
    .sort((a,b)=>sub==='mine'?num(b.createdAt)-num(a.createdAt):num(b.session)-num(a.session)||num(b.createdAt)-num(a.createdAt));
  return h`<section class="panel"><div class="ph"><div class="seg" role="group" aria-label="Journal"><button data-act="sub" data-v="party" aria-pressed="${String(sub==='party')}">Party log</button><button data-act="sub" data-v="mine" aria-pressed="${String(sub==='mine')}">My private notes</button></div>
      ${(sub==='mine'?S.me.id&&S.me.canWrite:canShared())?h`<button class="btn primary sm" data-act="newDoc" data-kind="${sub==='mine'?'n':'j'}">${sub==='mine'?'New note':'New entry'}</button>`:''}</div>
    <p class="sub">${sub==='mine'?'Only you can read these, not even the GM. Use Share to party log to publish one.':'Shared session log. Everyone at the table can read it.'}</p>
    <label class="fld"><span class="fl">Search</span><input type="search" data-u="q.journal" value="${S.ui.q.journal||''}" placeholder="Title, text, place"></label></section>
    ${list.length?h`<div class="list">${list.map(e=>entryCard(sub==='mine'?'n':'j',e,sub!=='mine'))}</div>`:emptyState(sub==='mine'?'No private notes':'No entries yet',sub==='mine'?'Theories, secrets, and reminders for yourself.':'Write up what happened after each session so the table stays in sync.')}`;
}

/* ---------- leads tab ---------- */
function leadCard(l){
  const open=!!S.ui.open['l'+l.id];
  const st=l.status||'open';
  if(open&&canShared()){
    return h`<article class="entry"><div class="fgrid">
      ${fText('Lead','l',l.id,'title',l,{cls:'wide'})}
      ${fSel('Status','l',l.id,'status',l,LEAD_STATES)}
      ${fText('Where','l',l.id,'place',l,{list:'dl-places'})}
      ${fArea('Details','l',l.id,'detail',l,{rows:3,cls:'wide'})}</div>
      <div class="row sp"><button class="btn sm" data-act="toggle" data-key="l${l.id}">Done</button>${canOwn(l)?delBtn('l',l.id,'Delete'):''}</div></article>`;
  }
  return h`<article class="entry"><div class="row sp"><h3>${l.title||'Untitled lead'}</h3><span class="pill ${st}">${(LEAD_STATES.find(x=>x[0]===st)||LEAD_STATES[0])[1]}</span></div>
    ${l.place?h`<div class="meta"><span>${l.place}</span></div>`:''}
    ${l.detail?h`<p class="prewrap">${l.detail}</p>`:''}
    ${canShared()?h`<div><button class="btn sm" data-act="toggle" data-key="l${l.id}">Edit</button></div>`:''}</article>`;
}
function leadsTab(){
  const list=entriesOf(S.leads);
  const order=['open','chasing','resolved','dead'];
  const groups=order.map(s=>[s,list.filter(l=>(l.status||'open')===s).sort((a,b)=>num(b.createdAt)-num(a.createdAt))]).filter(g=>g[1].length);
  return h`<section class="panel"><div class="ph"><h2>Leads</h2>${canShared()?h`<button class="btn primary sm" data-act="newDoc" data-kind="l">Add lead</button>`:''}</div>
    <p class="sub">Open questions and threads the party wants to follow. Shared by everyone.</p></section>
    ${groups.length?groups.map(([s,items])=>h`<div class="list"><div class="ph"><h2>${(LEAD_STATES.find(x=>x[0]===s)||LEAD_STATES[0])[1]}</h2><span class="sub">${items.length}</span></div><div class="grid cards">${items.map(leadCard)}</div></div>`):emptyState('No leads yet','Add anything strange you want to look into next.')}`;
}

/* ---------- timeline tab ---------- */
function tlItem(e){
  const key='tl'+e.id;
  const open=!!S.ui.open[key];
  const canE=canOwn(e);
  if(open&&canE){
    return h`<article class="entry tl-item">
      <div class="fgrid">
        ${fNum('Session','tl',e.id,'session',e,{min:0})}
        ${fText('In-world date','tl',e.id,'when',e,{ph:'e.g. Late autumn'})}
        ${fText('Title','tl',e.id,'title',e,{cls:'wide'})}
        ${fText('Place','tl',e.id,'place',e,{list:'dl-places',cls:'wide'})}
        ${fArea('What happened','tl',e.id,'body',e,{rows:4,cls:'wide'})}
      </div>
      <div class="row sp"><button class="btn sm" data-act="toggle" data-key="${key}">Done</button>${delBtn('tl',e.id,'Delete')}</div>
    </article>`;
  }
  return h`<article class="entry tl-item">
    <h3>${e.title||'Untitled event'}</h3>
    <div class="meta">${e.when?h`<span>${e.when}</span>`:''}${e.place?h`<span>${e.place}</span>`:''}${e.addedBy?h`<span>by ${nm(e.addedBy)}</span>`:''}</div>
    ${e.body?h`<p class="prewrap">${e.body}</p>`:''}
    ${canE?h`<div><button class="btn sm" data-act="toggle" data-key="${key}">Edit</button></div>`:''}
  </article>`;
}
function timelineTab(){
  const list=entriesOf(S.timeline).sort((a,b)=>num(a.session)-num(b.session)||num(a.createdAt)-num(b.createdAt));
  const groups=[];
  list.forEach(e=>{
    const s=num(e.session);
    const g=groups[groups.length-1];
    if(g&&g.s===s)g.items.push(e);else groups.push({s,items:[e]});
  });
  return h`<section class="panel"><div class="ph"><h2>Timeline</h2>${canShared()?h`<button class="btn primary sm" data-act="newDoc" data-kind="tl">Add event</button>`:''}</div>
    <p class="sub">The big beats of the story in the order they happened, grouped by session. Anyone can add; the author or the GM can edit and delete.</p></section>
    ${groups.length?groups.map(g=>h`<section class="list"><div class="ph"><h2>${g.s?'Session '+g.s:'Before the campaign'}</h2><span class="sub">${g.items.length} ${g.items.length===1?'event':'events'}</span></div><div class="tl">${g.items.map(tlItem)}</div></section>`)
      :emptyState('Nothing on the timeline yet','Add the moments that changed things: a gym won, a rival met, a place that was not what it seemed.')}`;
}

/* ---------- map tab ---------- */
const pinList=()=>entriesOf(S.pins).sort((a,b)=>num(a.createdAt)-num(b.createdAt)).map((p,i)=>Object.assign(p,{n:i+1}));
const pinKind=k=>(PIN_KINDS.find(x=>x[0]===k)||PIN_KINDS[0])[1];
function pinRow(p){
  const on=S.ui.selPin===p.id;
  const canE=canOwn(p);
  return h`<li class="${on?'on':''}">
    <button class="prow" data-act="selPin" data-id="${p.id}" aria-expanded="${String(on)}"><span class="pn ${p.kind||'place'}">${p.n}</span><span class="pl">${p.label||'Unnamed pin'}</span><span class="sub">${pinKind(p.kind)}</span></button>
    ${on?(canE?h`<div class="pdet">
        <div class="fgrid">
          ${fText('Label','pin',p.id,'label',p,{cls:'wide'})}
          ${fSel('Kind','pin',p.id,'kind',p,PIN_KINDS,{cls:'wide'})}
          ${fArea('Note','pin',p.id,'note',p,{rows:3,cls:'wide'})}
        </div>
        <div class="row"><span class="fl">Nudge</span>
          <button class="btn sm" data-act="nudge" data-id="${p.id}" data-dx="-0.02" data-dy="0" aria-label="Nudge left">←</button>
          <button class="btn sm" data-act="nudge" data-id="${p.id}" data-dx="0" data-dy="-0.02" aria-label="Nudge up">↑</button>
          <button class="btn sm" data-act="nudge" data-id="${p.id}" data-dx="0" data-dy="0.02" aria-label="Nudge down">↓</button>
          <button class="btn sm" data-act="nudge" data-id="${p.id}" data-dx="0.02" data-dy="0" aria-label="Nudge right">→</button>
          <button class="btn sm" data-act="movePin" data-id="${p.id}">Move on map</button></div>
        <div class="row sp"><span class="sub">${p.addedBy?'Placed by '+nm(p.addedBy):''}</span>${delBtn('pin',p.id,'Delete pin')}</div>
      </div>`
      :h`<div class="pdet">${p.note?h`<p class="prewrap">${p.note}</p>`:h`<p class="sub">No note.</p>`}<span class="sub">${p.addedBy?'Placed by '+nm(p.addedBy):''}</span></div>`):''}
  </li>`;
}
function mapPicker(){
  return h`<div class="row"><button class="btn sm" data-act="pick" data-img="map|map|img" data-w="0" data-h="0" data-cap="900000">${S.mapSrc?'Replace map':'Upload map'}</button>${S.mapSrc?h`<button class="btn sm ghost" data-act="rmMap">Remove map</button>`:''}</div>`;
}
/* ---------- GM desk ---------- */
function awardForm(){
  const a=S.ui.award;
  const ids=tids();
  const picked=ids.filter(u=>a.uids[u]).length;
  return h`<section class="panel"><div class="ph"><h2>Award honors</h2><span class="pill gm">GM only</span></div>
    <p class="sub">This system has no experience points. Honors are how trainers grow: badges, medals, ribbons, and moments worth remembering. Tick the box below to raise the level as part of the award.</p>
    ${ids.length?h`<div class="fl">Who earned it</div>
      <div class="row">${ids.map(u=>h`<button class="btn sm chk" data-act="awToggle" data-uid="${u}" aria-pressed="${String(!!a.uids[u])}">${tName(S.trainers[u])}</button>`)}
        <button class="btn sm ghost" data-act="awAll">${picked===ids.length?'Clear':'Everyone'}</button></div>
      <div class="fgrid">
        <label class="fld"><span class="fl">Kind of honor</span><select data-u="award.type">${AWARD_TYPES.map(t=>h`<option value="${t}" ${a.type===t?raw('selected'):''}>${t}</option>`)}</select></label>
        ${a.type==='Gym Badge'?h`<label class="fld"><span class="fl">Which badge</span><select data-u="award.badge">${BADGES.map(b=>h`<option value="${b[0]}" ${a.badge===b[0]?raw('selected'):''}>${b[1]} (${b[2]})</option>`)}</select></label>`:''}
        ${a.type==='Contest Ribbon'?h`<label class="fld"><span class="fl">Which ribbon</span><select data-u="award.ribbon">${ribHalls().map(x=>h`<option value="${x.k}" ${awardRibbon()===x.k?raw('selected'):''}>${x.n}${x.t?' ('+x.t+')':''}</option>`)}<option value="" ${awardRibbon()===''?raw('selected'):''}>Another ribbon (not in the case)</option></select></label>`:''}
        <label class="fld wide"><span class="fl">Title (optional)</span><input type="text" data-u="award.title" value="${a.title}" placeholder="${a.type==='Gym Badge'?'Defaults to the badge name':a.type==='Contest Ribbon'&&awardRibbon()?'Defaults to the ribbon name':'e.g. Saved the ferry'}" data-nr></label>
        <label class="fld wide"><span class="fl">Note for the trainer</span><textarea data-u="award.note" rows="2" data-nr>${raw('\n')}${a.note}</textarea></label>
      </div>
      <label class="row"><input type="checkbox" data-act="awLevel" ${a.levelUp?raw('checked'):''}><span>Raise level by 1 (max 20)</span></label>
      <div><button class="btn primary" data-act="awGive" ${picked?'':raw('disabled')}>Award${picked?' to '+picked+(picked===1?' trainer':' trainers'):''}</button></div>`
      :h`<p class="sub">No trainers yet. Players appear here once they create a sheet.</p>`}
  </section>`;
}
function awardHistory(){
  const list=entriesOf(S.awards).sort((a,b)=>num(b.createdAt)-num(a.createdAt)).slice(0,30);
  return h`<section class="panel"><div class="ph"><h2>Award history</h2><span class="sub">${Object.keys(S.awards).length} total</span></div>
    ${list.length?h`<ul class="mini-list">${list.map(a=>h`<li><div class="row sp"><span><b>${a.title}</b> <span class="sub">to ${tName(S.trainers[a.uid])}</span></span>${delBtn('aw',a.id,'Revoke')}</div><span class="sub">${a.type}${a.levelUp?' · +1 level':''} · ${dt(a.createdAt)}${a.session?' · Session '+a.session:''}</span></li>`)}</ul>
      <p class="sub">Revoking removes the award from the record. It does not take back a badge, ribbon or level already applied.</p>`
      :h`<p class="sub">Nothing awarded yet.</p>`}</section>`;
}

/* ---------- Talent agencies and sponsors (vault: Talent Agencies, Brands and Sponsors) ----------
   The trainer sheet keeps an agency (t.agency), the agent's name (t.agent), a standing 0-5 that only the GM sets (t.agSt),
   contract notes (t.agNote) and a list of sponsor deals (t.sponsors). The GM Desk explains the rules and lists every agency
   and sponsor, with the GM-only truth about the suspicious ones. */
const AG_STAND=[['0','0 · Dropped'],['1','1 · Signed'],['2','2 · Client'],['3','3 · Rising'],['4','4 · Featured'],['5','5 · Headliner']];
const AG_PERKS=[
  'The agency takes calls and handles fans, so you are not mobbed in towns. One paid booking a week (an appearance, exhibition or showcase).',
  'Negotiation: when a sponsor offer comes, the agent rolls once; on a success, more money or one fewer string. A publicist can handle your interviews.',
  'The agency’s signature perk. One bad headline a session is softened before it hits the rankings. Bookings pay double.',
  'One sponsor offer a season of your choice from the agency’s network. One free ferry, coach or Center stay each journey. The agency pays half your healing after sanctioned matches.',
  'The agency’s elite perk. One scandal a season goes away, and one closed door a season opens. The cut drops by 2 points.'];
/* [name, base, cut %, who it signs, signature perk (3), elite perk (5), code, agent, GM-only truth] */
const AGENCIES=[
  ['Northstar Talent Group','Jubilife',15,'battlers, Conference finalists, TV personalities','One national-sponsor offer a season (Pokétch Company, Jubilife TV, Veilstone Department Store, Crown Exchange Mutual).','A featured Jubilife TV segment and +1 rank on the popularity board.','The brand comes first: never embarrass a Northstar sponsor.','Marisol Vane',''],
  ['Lumiere & Crane','Hearthome',12,'coordinators, stage stars, Grand Festival champions','+2 on social checks with Contest judges, officials and Hearthome high society; invitations to private galas.','Maison Hearth dresses you for the Grand Festival, and a rehearsal on its stage.','Dignity: a public embarrassment costs 2 standing, not 1.','Theo Hartwell (publicist)',''],
  ['Coalface Sports Management','Oreburgh',10,'battlers, Rock, Ground and Fighting specialists','Free sparring with Oreburgh Gym trainers; 20% off Rock and Ground gear.','A private session with the Oreburgh Gym Leader; the Mining Co. as a sponsor without its usual strings.','Loyalty to Oreburgh in local disputes.','',''],
  ['Harborlight Agency','Canalave and Sunyshore',10,'coastal trainers, Water specialists, swimmers','Free coastal ferry passes; fishing-tournament invitations.','A chartered boat for one trip a season.','Never cross the ferry companies.','',''],
  ['Greenhouse Collective','Floaroma and Solaceon',5,'breeders, gardeners, farm kids','Discounts at Day Cares, berry farms and Poffin houses; a place to sleep in most small towns.','One rare seed, egg or breeding contact a season through the network.','Look after your Pokémon and your people.','“Auntie” Bea Sorrell (manager)',''],
  ['Frostline Talent','Snowpoint',8,'northern trainers, Ice specialists, rescue heroes','Free Snowline gear; a rescue guide on northern routes.','A research permit or guided entry into one badge-gated northern area.','Never refuse a rescue call.','',''],
  ['Fen & Fable','Pastoria',7,'marsh guides, Water trainers, folk performers','Training at the Pastoria Gym; a Grand Marsh guide.','A Grand Marsh day permit any time; the Gym’s backing in a public dispute.','Loyalty to the Pastoria Gym and the marsh community.','',''],
  ['Veilstone Combat Bureau','Veilstone',10,'Fighting-type trainers, martial artists','Once a month, a free training session that improves one Pokémon.','A sparring match against a Veilstone Gym trainer; Kurogane Dojo Wear as a sponsor.','Discipline: two public losses in a row cost 1 standing.','',''],
  ['Old Forest Talent','Eterna',8,'nature trainers, conservationists, documentary hosts','Permits into protected forests; a paid documentary segment.','A research permit or guided entry into one badge-gated wild area.','Never harm a protected habitat.','',''],
  ['Exchange Row Partners','Crown City',18,'wealthy clients, heirs, investment-backed challengers','Covers travel and healing costs; entry to the Weathervane Room.','One door a season that money can open.','Act like money: no public brawls, no cheap sponsors.','',''],
  ['Sinnoh League Athlete Services','Elite Four Island',0,'Conference qualifiers only','Free legal advice, injury support, media training (+2 on interview and press checks).','A meeting with an Elite Four member or League official.','Stay on-message; drop sponsors the League dislikes.','',''],
  ['Rising Star Academy & Talent','Jubilife',12,'teenage trainers and coordinators','Once a month, coaching that gives +2 on one skill for that month.','A showcase spot at a major Jubilife or Hearthome event.','Do every booking.','',''],
  ['Pokétch Live Creators','Jubilife',20,'trainers who stream their journeys','Income from views each session, more for exciting sessions.','A featured channel and a Pokétch sponsorship.','Keep the stream going: a dark week costs 1 standing.','',''],
  ['JTV Talent Office','Jubilife TV',0,'anyone who goes viral','Instant exposure; +1 rank on the popularity board after a televised win.','A regular Jubilife TV segment.','JTV owns the footage of every interview it arranges.','',''],
  ['Ladder Talent','Battle Resort Fight Area',20,'fighters on the Ladder','Triple appearance fees for exhibition bouts.','A fast-track placement one rung up the Ladder.','Take the fights you are booked for.','Dex Morrow','Some clients disappear from the Ladder and turn up in the illegal Undercard.'],
  ['Maison Lumiose Artistes','Kalos (Hearthome office)',15,'coordinators, models','International showcases and fashion work.','A Kalos showcase invitation, which takes a coordinator out of Sinnoh’s season.','Exclusivity: no other agency, no Sinnoh-only fashion labels.','',''],
  ['Candle Hill Casting','Hearthome',10,'stage performers, coordinators','Paid stage work and “performance and sleep wellness” retreats.','A role in the reopened opera house’s Inaugural Season.','Attend every retreat.','','Clients start having the same dream (Team Vesper Dream Clues, Vesper Opera House). Whether the agency knows is up to you.'],
  ['Halcyon Representation','Jubilife (mail-drop)',10,'struggling trainers','A large advance at signing (from standing 1, not 3).','—','Never read the fine print aloud.','','The contract takes prize money for years and its release fee is unpayable. The address matches Halcyon Metals, the broker in Fuego Ironworks Operations.'],
  ["Celestic Heritage Speakers", "Celestic Town", 6, "historians, mythology buffs, ruin guides", "Access to the Celestic archives; +2 on history and lore checks with elders and scholars.", "A private viewing of the shrine murals, and a lecture tour across Sinnoh.", "Respect sacred sites.", "", ""],
  ["Lab Coat Media", "Sandgem Town", 8, "researchers and field scientists who go public", "Loaned field equipment and a student assistant on the road.", "Co-authorship on a published regional survey, and a research permit of the client’s choice.", "No faked data, ever.", "", ""],
  ["Tidewatch Talent", "Battle Resort Survival Area", 12, "survivalists, wilderness challengers, off-route trainers", "Survival gear and a guided pass into one off-route zone a month.", "A sponsored off-route expedition, with Rangers notified and supplies dropped.", "Never need a rescue: a Ranger rescue costs 1 standing.", "", ""],
  ["Galar Bridge Sports", "Galar (Jubilife office)", 15, "stadium battlers who want the big-crowd style", "Invitations to stadium exhibition matches; +1 Hype at the start of televised battles (if you use Hype).", "A guest match in a Galar stadium in the off-season.", "Exclusivity: no other battle agency.", "", ""],
  ["Squallville Weatherwise", "Squallville", 8, "weather presenters, storm chasers, Water and Flying trainers", "The next day’s weather a day early (the GM tells you); storm-rated gear.", "A regular weather segment on Jubilife TV.", "Never fake a forecast.", "", ""],
  ["Majolica Makers Guild", "Majolica Town", 10, "artisans, designer trainers, shell and kit designers", "Custom ball shells and kit work at half price; a logo designed free.", "A signature merchandise line in shops across Sinnoh.", "Credit the makers.", "", ""],
  ["Daybreak Harbor & Line", "Daybreak Town", 6, "anglers, fishing champions, sailors", "Fishing Kit upgrades and a boat whenever the client is on the coast.", "Hosting the Daybreak fishing derby, and first cast at it.", "Respect the catch limits.", "", ""],
  ["Starfall Records", "Jubilife", 15, "singers, musical performers, coordinators with a voice", "Studio time and a spot opening for touring acts.", "A headline concert in Hearthome or Jubilife.", "No lip-sync scandals.", "", ""],
  ["Ranger Liaison Office", "Rangers’ union, Jubilife", 0, "trainers who do rescue and conservation work in public", "Priority route plans at Ranger stations; Ranger support on filed trips.", "An honorary Ranger badge, which opens some protected areas.", "Follow Ranger orders in the field.", "", ""],
  ["Nightjar Management", "Veilstone", 15, "battlers who need money fast", "Cash for every booking, paid that night.", "“Guaranteed” wins in exhibition bouts.", "Lose when you’re told to.", "", "A match-fixing ring that places bets through Crown Gaming House. Clients are told to throw exhibition matches; the guaranteed wins are opponents being paid to lose."]
];
/* [name, base, offers, catch, GM-only truth] */
const SPONSORS=[
  ['Pokétch Company','Jubilife','The newest Pokétch, apps, a stipend','Beta-test glitchy apps in public',''],
  ['Jubilife TV','Jubilife','Travel money and airtime','A camera crew on your biggest days',''],
  ['Veilstone Department Store','Veilstone','A store card and gear discounts','Weekend autograph signings',''],
  ['Crown Exchange Mutual','Crown City','Covers healing and injury costs','Adjusters review your battles; reckless play voids the policy',''],
  ['Oreburgh Mining Co.','Oreburgh','Escape Ropes, cave gear, mine access','Safety days; seen as on their side in labor disputes',''],
  ['Canalave Shipwrights’ Guild','Canalave','Coastal ferry passes','Christen new boats',''],
  ['Fuego Ironworks Cooperative','Fuego Ironworks','Custom gear and repairs','Wear their heavy kit, even in the heat','The Cooperative is honest; its sealed night-shift contract is Vesper’s.'],
  ['Sunyshore Solar Cooperative','Sunyshore','Pokémon Center vouchers, charging packs','Talk up solar in a city that argues about it',''],
  ['Snowpoint Thermal Outfitters','Snowpoint','Free Snowline gear','A commercial shot in a real blizzard',''],
  ['The Poffin House','Chocovine','Free Poffins and Contest snacks','Tastings and a Poffin named after you',''],
  ['Arrowroot Mill Ovens','Arrowroot','Baked goods and Berry blends','Your Pokémon’s face on the packaging',''],
  ['Floaroma Honey Collective','Floaroma','Honey and Sweet Scent supplies','Take their side against Valley Windworks',''],
  ['Alamos Lake-Aged Cheese','Alamos','Cash and cheese','A cheese-wheel patch on your kit',''],
  ['Lilypad Springs Resort','Lilypad','Free stays at the hot springs','Spa promo shoots',''],
  ['Sage Town Spice Merchants','Sage Town','Spice blends for Pokémon food','Cooking demos at the Sage Contest hall',''],
  ['Seventh Gate Athletics','Jubilife','Kit, gear and replica sales','Wear it everywhere',''],
  ['Petal & Thread','Floaroma','Stage outfits for rising coordinators','Wear the label on stage',''],
  ['Volt Line','Sunyshore','Flashy sportswear','Be flashy, every time',''],
  ['BioLeaf Rest','Sage Town','A sleep tonic and a stipend','Drink it on camera before big matches','BioLeaf is innocent; the Vesper Institute is its clinical-trial partner and takes a royalty.'],
  ['The Hush Tea Room','Emeragrove','Calming tea and a small stipend','Appear at a Hearthome tasting','The tea room is innocent; its biggest buyer is a Hearthome account tied to the Vesper Opera House.'],
  ['Aurelian Heritage Trust','Hearthome','Grants for “trainers who honor Sinnoh’s history”','Appear at Heritage Evenings at the opera house','A real charity, owned from above by Compass Meridian Trust.'],
  ['Vesper Institute Foundation','Jubilife','“Rest and Recovery” scholarships','Take part in a sleep study','Clean on paper; the study puts you in the Institute’s records.'],
  ['Battle Resort Promotions','Battle Resort','Big appearance fees','Exhibition bouts with looser rest rules','A recruiting path into the illegal Undercard.'],
  ['Crown Gaming House','Crown City','Huge money','League rules ban gambling-house patches','Taking it quietly is a scandal waiting to happen.'],
  ["Coil & Current", "Jubilife", "Batteries, chargers and a new Pokétch charger", "Unboxing videos", ""],
  ["Staravia Air", "Jubilife", "Flights between Jubilife, Sunyshore and Snowpoint", "Fly with the logo showing; delays are your problem", ""],
  ["Sinnoh Rail & Coach", "Jubilife", "A season rail and coach pass", "Ride the new lines on opening day, cameras present", ""],
  ["Amity Square Pet Supplies", "Hearthome", "Pokémon food, toys and grooming kits", "Your Pokémon in their ads", ""],
  ["Berry Bright Juice", "Pastoria", "Juice crates and Berry drinks", "Drink it after every televised win", ""],
  ["Gracidea Florists", "Emeragrove", "Flowers for contests and Gym walkouts", "A bouquet thrown to the crowd at every win", ""],
  ["Chocovine Cocoa Works", "Chocovine", "Chocolate, cocoa and travel snacks", "A Pokémon-shaped chocolate in your likeness", ""],
  ["Pastoria Rainworks", "Pastoria", "Umbrellas and rain gear", "Be seen in the rain", ""],
  ["Lakecrest Grand Hotel", "Valor Lakefront", "Rooms during the Grand Festival", "Attend the hotel’s gala dinner", ""],
  ["Dandelion Seed Vault", "Dandelion Island", "Rare seeds and Berry stock", "A season of volunteer work at the vault", ""],
  ["Anvil Strength Co.", "Battle Resort", "Training gear and weights", "Train in public at their gyms", ""],
  ["Jubilife Gamesworks", "Jubilife", "A cut of a video game with you in it", "They own your likeness for the game", ""],
  ["Coronet Outfitters", "Eterna", "Hiking gear and packs", "Field-test new gear on hard routes", ""],
  ["Maison Hearth", "Hearthome", "Couture for contests and galas", "Wear only Maison Hearth on stage", ""],
  ["Route Rack", "Everywhere", "Free basics and travel clothes", "Tacky ads in every store window", ""],
  ["Moonhaven", "Canalave", "Night-sky couture", "Wear it to night events", "Customers say the designer dreams the patterns. A red herring, or not."],
  ["Iron Island Assay House", "Iron Island", "Steel gear and ore souvenirs", "Visit the island’s mining days", "Sells pale, faintly ringing ore to a buyer nobody asks about (see Vesper Finances and Shell Companies)."],
  ["Calloway Technical Ceramics", "Majolica", "Porcelain prizes and trophies", "Hand them out at Majolica events", "Makes bulk porcelain half-masks for Mazzi & Daughters: the Company’s masks."],
  ["Lumen Data Works", "Jubilife", "Free cloud storage for Pokédex data and battle footage", "Your data stays on their servers", "Hosts Vesper’s Register; the sync node’s cover. A client’s footage is on the same servers."],
  ["Valley Windworks Energy", "Valley Windworks", "Pokémon Center vouchers and clean-power ads", "Speak at energy events; feud with the Floaroma Honey Collective", "Block 7 is leased to Marrow & Vane Instruments, Vesper’s “atmospheric observation” front."]
];
const agOf=t=>{const k=dexKey(t&&t.agency);return k?AGENCIES.find(a=>dexKey(a[0])===k)||null:null;};
function agPanel(uid,t,ro){
  const a=agOf(t),st=clamp(Math.round(num(t.agSt))||0,0,5),signed=String(t.agency||'').trim();
  const sp=Array.isArray(t.sponsors)?t.sponsors:[];
  const perk=(i)=>{const n=i+1,on=signed&&st>=n;
    const extra=a&&n===3?' Signature: '+a[4]:a&&n===5?' Elite: '+a[5]:'';
    return h`<li class="${on?'':'sub'}"><b>${AG_STAND[n][1]}</b>${on?'':' (locked)'} ${AG_PERKS[i]}${extra}</li>`;};
  return h`<section class="panel"><div class="ph"><h2>Agency & sponsors</h2>${signed?h`<span class="pill">Standing ${st}</span>`:h`<span class="pill">Independent</span>`}</div>
    <datalist id="dl-agencies">${AGENCIES.map(x=>h`<option value="${x[0]}">`)}</datalist>
    <datalist id="dl-sponsors">${SPONSORS.map(x=>h`<option value="${x[0]}">`)}</datalist>
    <div class="fgrid">${fText('Agency','t',uid,'agency',t,{ro,list:'dl-agencies',ph:'None yet'})}${fText('Agent or manager','t',uid,'agent',t,{ro,ph:a&&a[7]?a[7]:''})}
      ${fSel('Standing (set by the GM)','t',uid,'agSt',t,AG_STAND,{ro:ro||!S.me.admin})}</div>
    ${a?h`<p class="sub">${a[0]}, ${a[1]}. Signs ${a[3]}. Cut ${a[2]?a[2]+'%':'none'}. <b>Code:</b> ${a[6]}</p>`:signed?h`<p class="sub">A custom agency. Write its terms in the notes.</p>`:h`<p class="sub">No agency. Offers come after public wins and viral moments; the GM tells you when one calls.</p>`}
    ${signed?h`<ul class="reful agperks">${AG_PERKS.map((x,i)=>perk(i))}</ul>`:''}
    ${fArea('Contract notes','t',uid,'agNote',t,{ro,rows:2,ph:'Terms you agreed, favors owed, what the agent promised'})}
    <h3 class="refg">Sponsors</h3>
    ${sp.length?h`<div class="list">${sp.map((x,i)=>h`<div class="item"><div class="irow two">${fText('Sponsor','t',uid,'sponsors.'+i+'.name',t,{ro,list:'dl-sponsors'})}${rowBtns('t',uid,'sponsors',i,sp.length,ro)}</div>
      <div class="fgrid">${fText('They give','t',uid,'sponsors.'+i+'.offer',t,{ro})}${fText('You owe','t',uid,'sponsors.'+i+'.ask',t,{ro})}${fText('Until','t',uid,'sponsors.'+i+'.until',t,{ro,ph:'End of the season'})}</div></div>`)}</div>`:h`<p class="sub">No sponsors yet.</p>`}
    ${sp.length>2?h`<p class="sub">Only two sponsor patches fit on a League kit.</p>`:''}
    ${ro||sp.length>=6?'':h`<div><button class="btn sm" data-act="add" ${bp('t',uid,'sponsors')} data-tpl="sponsor">Add sponsor</button></div>`}
  </section>`;
}
const AG_OFFERS=['Halcyon Representation: a generous advance, today only','Pokétch Live Creators: “your journey would stream great”','JTV Talent Office, free, after a highlight aired','Ladder Talent: an exhibition bout at the Battle Resort','Rising Star Academy, through a parent or mentor','Northstar Talent Group, after a big crowd win','Lumiere & Crane (coordinators; otherwise Northstar)','Coalface Sports Management, if the trainer battled in Oreburgh','Harborlight Agency, on the coast','Greenhouse Collective, through a Day Care or farm contact','Frostline Talent, after anything heroic in the north','Fen & Fable, after anything in Pastoria or the Grand Marsh','Veilstone Combat Bureau, after a clean physical win','Old Forest Talent, after anything with wild Pokémon or research','Exchange Row Partners, through a rich patron','Maison Lumiose Artistes (coordinators; otherwise Northstar)','Candle Hill Casting, after a stage performance','Two agencies at once: roll twice; they compete','A rival’s agent tries to poach the trainer','Sinnoh League Athlete Services (Conference qualifiers; otherwise roll again)'];
function agDesk(){
  const ids=tids(),r=num(S.ui.agRoll);
  return h`<section class="panel"><div class="ph"><h2>Agencies and sponsors</h2><span class="pill gm">GM only</span></div>
    <p class="sub">How representation and sponsorship work in the campaign. The full notes are in the vault (Talent Agencies, Brands and Sponsors). Each trainer's agency, standing and sponsors are on their sheet under Honors &amp; career; only you can set standing.</p>
    ${ids.length?h`<div class="list">${ids.map(uid=>{const t=S.trainers[uid];return h`<div class="item"><div class="irow two"><span><b>${tName(t)}</b> <span class="sub">${String(t.agency||'').trim()||'Independent'}${(t.sponsors||[]).length?' · '+(t.sponsors||[]).map(x=>x.name).filter(Boolean).join(', '):''}</span></span>${fSel('Standing','t',uid,'agSt',t,AG_STAND,{})}</div></div>`;})}</div>`:''}
    ${refSec('ag_how','How signing works',h`<ul class="reful">
      <li>Nobody starts signed. Agencies call after a public win (a badge before a big crowd, a ribbon, a Conference place) or a viral moment on Jubilife TV. The big and the shady call first; small, honest agencies wait to be asked.</li>
      <li>An offer is a scene: the agent makes a pitch and names the terms. The trainer can sign, negotiate (one social roll for one concession), ask for time, or say no.</li>
      <li>Signing starts at standing 1. Write the agency on the sheet and set the standing here.</li>
      <li><b>Representatives:</b> an agent finds and negotiates deals; a publicist manages image and interviews; a manager runs the schedule. Rookies have none; stars have all three.</li></ul>`)}
    ${refSec('ag_stand','Standing: how it changes',h`<dl class="refdl">
      <dt>+1</dt><dd>A badge, ribbon or big public win; a month of every obligation met; a headline that makes the agency look good; a favor the agency asked for.</dd>
      <dt>−1</dt><dd>A missed obligation; a public embarrassment; refusing a deal the agent brought.</dd>
      <dt>−2</dt><dd>A scandal; working with a rival agency; breaking the agency's code.</dd>
      <dt>0</dt><dd>Dropped: all perks lost, a breakup headline runs, and some contracts charge a release fee.</dd>
      <dt>Limit</dt><dd>Standing rises at most once per session.</dd></dl>`)}
    ${refSec('ag_perks','Perks by standing',h`<dl class="refdl">${AG_PERKS.map((x,i)=>h`<dt>${AG_STAND[i+1][1]}</dt><dd>${x}</dd>`)}</dl>`)}
    ${refSec('ag_cost','The drawbacks',h`<ul class="reful">
      <li><b>The cut:</b> a share of sponsor and prize money, from 5% to 20%.</li>
      <li><b>Obligations:</b> about one booking a week, more at higher standing. They take time from travel and training.</li>
      <li><b>The code:</b> one rule a client must not break, worth −2 standing.</li>
      <li><b>Agendas and image:</b> agents push the deals that pay them; publicists decide how the trainer is presented.</li>
      <li><b>Leaving:</b> a release fee, a lost sponsor or a public feud.</li></ul>`)}
    ${refSec('ag_list','The agencies ('+AGENCIES.length+')',h`<dl class="refdl">${AGENCIES.map(a=>h`<dt>${a[0]}</dt><dd><span class="sub">${a[1]} · cut ${a[2]?a[2]+'%':'none'} · signs ${a[3]}${a[7]?' · '+a[7]:''}</span><br><b>Signature (3):</b> ${a[4]} <b>Elite (5):</b> ${a[5]} <b>Code:</b> ${a[6]}${a[8]?h`<br><span class="pill gm">Truth</span> ${a[8]}`:''}</dd>`)}</dl>`)}
    ${refSec('ag_spons','Sponsors ('+SPONSORS.length+')',h`<ul class="reful"><li>Offers come after a first badge or ribbon (local sponsors) and after a big public win (national names). Every deal has a catch: plan one moment where it clashes with what the trainer wants.</li><li>Two patches at most on a League kit. Contracts run one season, Opening Ceremony to Opening Ceremony. Sponsors walk after bad losses, scandals or a trainer who won't promote them.</li></ul>
      <dl class="refdl">${SPONSORS.map(x=>h`<dt>${x[0]}</dt><dd><span class="sub">${x[1]}</span> · <b>Gives:</b> ${x[2]} · <b>Asks:</b> ${x[3]}${x[4]?h`<br><span class="pill gm">Truth</span> ${x[4]}`:''}</dd>`)}</dl>`)}
    <div class="row"><button class="btn sm" data-act="ag_roll">Roll an agency offer (d20)</button>${r?h`<span><b class="mono">${r}</b> · ${AG_OFFERS[r-1]}</span>`:''}</div>
  </section>`;
}

function gmTab(){
  const ids=tids();
  const top=ids.map(u=>[u,badgeCount(S.trainers[u])]).sort((a,b)=>b[1]-a[1])[0];
  const rows=ids.map(uid=>partyOf(uid).concat(boxOf(uid)).map(m=>[uid,m])).reduce((a,b)=>a.concat(b),[]);
  return h`<section class="panel"><div class="ph"><h2>Table settings</h2><span class="pill gm">GM only</span></div>
    <div class="fgrid">
      ${fText('Campaign title','meta','table','campaign',S.meta,{cls:'wide'})}
      ${fText('Subtitle','meta','table','subtitle',S.meta,{cls:'wide'})}
      ${fText('Game Master name','meta','table','gm',S.meta)}
      ${fNum('Current session','meta','table','session',S.meta,{min:1})}
      ${fNum('League season','meta','table','season',S.meta,{min:1})}
      ${fArea('Pinned note for the party','meta','table','pinned',S.meta,{rows:3,cls:'wide',ph:'Shown at the top of the Overview'})}
    </div>
    <p class="sub">The banner is changed from the Overview page, the map from the Map page, and NPCs with portraits are added on the People page. Their secret notes are only visible to you.</p></section>
  ${hpxDesk()}
  ${nrDesk()}
  ${CFG?tableAccess():''}
  ${awardForm()}${awardHistory()}
  ${megaDesk()}
  ${giveDesk()}
  ${evoDesk()}${evoLogDesk()}${ptaDesk()}${lnDesk()}${encDesk()}${ccDesk()}${agDesk()}
  <section class="panel"><div class="ph"><h2>Party snapshot</h2></div>
    <p>${top?h`Highest badge count: <b class="mono">${top[1]}</b> (${tName(S.trainers[top[0]])}).`:'No trainers yet.'}</p>
    <p class="sub">Loyalty and NPC secrets are stored where only editors can read them. Players never receive that data.</p></section>
  <section class="panel"><div class="ph"><h2>Loyalty board</h2></div>
    ${rows.length?h`<ul class="mini-list">${rows.map(([uid,m])=>{const L=clamp(num((S.gmLoy[m.id]||{}).loyalty),0,5);return h`<li><div class="row sp"><span><b>${mName(m)}</b> <span class="sub">${tName(S.trainers[uid])}</span></span><span class="seg" role="group" aria-label="Loyalty for ${mName(m)}">${[0,1,2,3,4,5].map(n=>h`<button data-act="loy" data-pid="${m.id}" data-uid="${uid}" data-n="${n}" aria-pressed="${String(L===n)}">${n}</button>`)}</span></div></li>`;})}</ul>`:h`<p class="sub">No Pokémon on the table yet.</p>`}</section>
  ${CFG?'':h`<section class="panel"><div class="ph"><h2>Sharing</h2></div>
    <p class="sub">Invite each player from the Share menu as a Contributor so they can save their own sheet. Viewers and Commenters can read but not edit.</p></section>`}`;
}

/* ---------- places: hotspots on the map, hover card, place pages ---------- */
const PL_LABEL={city:'City',town:'Town',landmark:'Landmark',island:'Island',area:'Resort area',route:'Route'};
const natural=(a,b)=>a.name.localeCompare(b.name,undefined,{numeric:true});
const plSub=f=>f.t==='r'?(f.nick||'Route'):(PL_LABEL[f.kind]||'Place');
const plFact=(f,k)=>{const x=f.facts.find(y=>y[0]===k);return x?x[1]:'';};
const mapReady=()=>!!(S.mapSrc&&S.mapChunks.meta&&S.mapChunks.meta.kind==='sinnoh');
function plText(f){
  const r=S.places[f.id];
  const d=r&&typeof r.desc==='string'?r.desc.trim():'';
  return d||f.sum;
}
const plPic=f=>{const r=S.places[f.id];return r&&typeof r.img==='string'?r.img:'';};
function plShort(f){
  const t=plText(f).replace(/\s+/g,' ');
  if(t.length<=175)return t;
  const cut=t.slice(0,175);
  const k=Math.max(cut.lastIndexOf('. '),cut.lastIndexOf('! '),cut.lastIndexOf('? '));
  return k>70?cut.slice(0,k+1):cut.replace(/\s+\S*$/,'')+'…';
}

/* which places and roads touch which: read from each route's "Connects" line */
const PD_REL=(()=>{
  const rel={};
  PD.forEach(f=>{rel[f.id]=new Set();});
  const byLen=PD.slice().sort((a,b)=>b.name.length-a.name.length);
  PD.forEach(f=>{
    if(f.t!=='r')return;
    let rest=plFact(f,'Connects');
    byLen.forEach(g=>{
      if(g.id===f.id||rest.indexOf(g.name)<0)return;
      rest=rest.split(g.name).join('\u0000');
      rel[f.id].add(g.id);rel[g.id].add(f.id);
    });
  });
  return rel;
})();

/* ---------- picture: an uploaded one, or a crop of the map with the place marked ---------- */
function cropBox(f,aspect,minW){
  let w=Math.max(f.bb[2]-f.bb[0]+170,minW),hh=w/aspect;
  if(f.bb[3]-f.bb[1]+120>hh){hh=f.bb[3]-f.bb[1]+120;w=hh*aspect;}
  w=Math.min(w,MAP_W);hh=w/aspect;
  if(hh>MAP_H){hh=MAP_H;w=hh*aspect;}
  const x=clamp(f.cx-w/2,0,MAP_W-w),y=clamp(f.cy-hh/2,0,MAP_H-hh);
  return[Math.round(x),Math.round(y),Math.round(w),Math.round(hh)];
}
function plMark(f,w){
  if(f.t==='r'){
    const d=f.segs.map(s=>'M'+s.map(q=>q[0]+' '+q[1]).join('L')).join('');
    return h`<path d="${d}" fill="none" stroke="#0A0F1C" stroke-opacity=".85" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/><path d="${d}" fill="none" stroke="#FFD43B" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>`;
  }
  const r=Math.round(w*0.05);
  return h`<circle cx="${f.x}" cy="${f.y}" r="${r}" fill="none" stroke="#0A0F1C" stroke-opacity=".85" stroke-width="7" vector-effect="non-scaling-stroke"/><circle cx="${f.x}" cy="${f.y}" r="${r}" fill="none" stroke="#FFD43B" stroke-width="3.5" vector-effect="non-scaling-stroke"/>`;
}
function plThumb(f,o){
  const cls=o.cls||'';
  const own=plPic(f);
  const src=own?imgSrc(own):'';
  if(src)return h`<img class="pl-thumb ${cls}" src="${src}" width="640" height="360" alt="${f.name}">`;
  if(!mapReady())return h`<div class="pl-thumb none ${cls}" aria-hidden="true"><span>${f.name.charAt(0)}</span></div>`;
  const b=cropBox(f,o.aspect||16/9,o.minW||420);
  return h`<svg class="pl-thumb ${cls}" viewBox="${b[0]} ${b[1]} ${b[2]} ${b[3]}" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Map around ${f.name}"><image href="${S.mapSrc}" width="${MAP_W}" height="${MAP_H}"/>${plMark(f,b[2])}</svg>`;
}

/* ---------- invisible hit shapes over the map (built once) ---------- */
let HOT_STR='';
function hotMarkup(){
  if(HOT_STR)return HOT_STR;
  const mk=f=>{
    const d=f.t==='r'?f.segs.map(s=>'M'+s.map(q=>q[0]+' '+q[1]).join('L')).join(''):'M'+f.x+' '+f.y+'h0';
    if(f.t==='p')return '<g class="hs p" data-act="hs" data-pl="'+f.id+'"><circle class="hc" cx="'+f.x+'" cy="'+f.y+'" r="40"/><circle class="hv" cx="'+f.x+'" cy="'+f.y+'" r="40"/><path class="ht" d="'+d+'"/></g>';
    return '<g class="hs r" data-act="hs" data-pl="'+f.id+'"><path class="hc" d="'+d+'"/><path class="hv" d="'+d+'"/><path class="ht" d="'+d+'"/></g>';
  };
  HOT_STR='<svg class="hot" viewBox="0 0 '+MAP_W+' '+MAP_H+'" preserveAspectRatio="none" aria-hidden="true" focusable="false">'
    +PD.filter(f=>f.t==='r').map(mk).join('')+PD.filter(f=>f.t==='p').map(mk).join('')+'</svg>';
  return HOT_STR;
}

/* ---------- clearance overlay on the region map: restricted roads and places by tier, and a Ranger station marker on each road ---------- */
const CLR_COL=['','#D9921F','#E0572A','#C21F3A'];
const CLR_SEASONAL=new Set(['route-228','route-229','route-239']);
let CLR_OV_STR='';
function routeMid(f){
  const pts=[].concat(...f.segs);let tot=0;
  for(let i=1;i<pts.length;i++)tot+=Math.hypot(pts[i][0]-pts[i-1][0],pts[i][1]-pts[i-1][1]);
  let half=tot/2;
  for(let i=1;i<pts.length;i++){const d=Math.hypot(pts[i][0]-pts[i-1][0],pts[i][1]-pts[i-1][1]);if(half<=d){const k=d?half/d:0;return[pts[i-1][0]+k*(pts[i][0]-pts[i-1][0]),pts[i-1][1]+k*(pts[i][1]-pts[i-1][1])];}half-=d;}
  return pts[0]||[f.cx,f.cy];
}
function clrOverlay(){
  if(CLR_OV_STR)return CLR_OV_STR;
  const tierOf={};
  CLR_REQ.forEach(([id,part,need])=>{if(!part||!(id in tierOf))tierOf[id]=need;});
  const esc=t=>String(t).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;');
  let roads='',spots='',st='';
  PD.forEach(f=>{
    const t=tierOf[f.id];
    if(t&&f.t==='r'){
      const d=f.segs.map(s=>'M'+s.map(q=>q[0]+' '+q[1]).join('L')).join('');
      roads+='<path class="cb" d="'+d+'"/><path class="cr'+(CLR_SEASONAL.has(f.id)?' seas':'')+'" style="stroke:'+CLR_COL[t]+'" d="'+d+'"/>';
    }else if(t&&f.t==='p'){
      spots+='<circle class="cb" cx="'+f.x+'" cy="'+f.y+'" r="34"/><circle class="cr seas" style="stroke:'+CLR_COL[t]+'" cx="'+f.x+'" cy="'+f.y+'" r="34"/>';
    }
    const rs=f.t==='r'&&plFact(f,'Ranger station');
    if(rs){
      const m=routeMid(f);
      st+='<g class="rst" data-act="place" data-id="'+f.id+'" transform="translate('+m[0].toFixed(1)+' '+m[1].toFixed(1)+') scale(1.35)"><title>'+esc(f.name+': '+rs)+'</title><path class="rsb" d="M0-15 13-9V1C13 9 6 14 0 16-6 14-13 9-13 1V-9Z"/><path class="rsi" d="M-5 1 0-6 5 1M-3-1V6H3V-1"/></g>';
    }
  });
  CLR_OV_STR='<svg class="clrov" viewBox="0 0 '+MAP_W+' '+MAP_H+'" preserveAspectRatio="none" aria-hidden="true" focusable="false">'+roads+spots+st+'</svg>';
  return CLR_OV_STR;
}
function clrLegend(){
  const t=S.trainers[S.me.id],cl=!S.me.admin&&t?clrOf(t):null;
  return h`<div class="clrleg" aria-label="Map key"><span><i class="ln" ${raw('style="background:'+CLR_COL[1]+'"')}></i>Pathfinder (2+)</span><span><i class="ln" ${raw('style="background:'+CLR_COL[2]+'"')}></i>Warden (5+)</span><span><i class="ln" ${raw('style="background:'+CLR_COL[3]+'"')}></i>Vanguard (7+)</span><span><i class="ln dash"></i>Seasonal, or off the trail</span><span><svg class="rsk" viewBox="-16 -17 32 34" aria-hidden="true"><path class="rsb" d="M0-15 13-9V1C13 9 6 14 0 16-6 14-13 9-13 1V-9Z"/><path class="rsi" d="M-5 1 0-6 5 1M-3-1V6H3V-1"/></svg>Ranger station</span>${cl?h`<span class="sub">You: ${cl.sus?'license suspended':CLR_TIERS[cl.tier][0]}${cl.guide?', with a guide':''}${cl.permit?', research permit':''}</span>`:''}</div>`;
}

/* ---------- Travel: the road network, pace, daily distance and the travel planner ----------
   House rules for this table (not handbook text):
   - Distances are twice what the old notes said: every land time is doubled (TRAVEL_SCALE). Sea crossings keep their times.
   - Daily distance limit: a party walking with Pokémon covers a set number of miles a day, by the road's terrain rating.
   - Pace: Careful (1.5x the time, safer and better for finding things), Steady (the listed time), Push (0.75x the time, tiring).
   Each leg is [route id, from, to, fewest days, most days, terrain 1-5, note] in the old (unscaled) days on foot.
   Nodes are place ids, or "j:" junctions named in TR_JN. A route with no leg for a place simply does not reach it. */
const TRAVEL_SCALE=2;
const TR_MPD=[0,16,13,10,7,5];
const TR_TERRAIN=['','easy','fair','rough','hard','brutal'];
const TR_PACE={careful:[1.5,'Careful'],steady:[1,'Steady'],push:[0.75,'Push']};
const TR_JN={
  'j:207':'Southgate (Route 207 and 208 junction)','j:spine':'The Crossing (Route 216 and the Coronet Spine)','j:210':'Route 210 and 215 junction',
  'j:lake':'Crown Spur junction (Route 214)','j:218':'The Fork Stone (Route 218 and 234)','j:ring':'The Ring Junction (Route 233 and 234)',
  'j:sunrise':'The Sunrise Fork (Route 222)','j:213':'Three Gulls Crossing (Route 213)','j:209':'Garden Lane turn-off (Route 209)',
  'j:242':'Gate Village (Route 242)','j:212':'Fence Road (Route 212)','j:stark':'Stark Fork (Battle Resort)'
};
const TR_LEGS=[
  ['route-201','twinleaf-town','sandgem-town',2,2,1],
  ['route-201','twinleaf-town','verity-lakefront',0.5,0.5,1,'lakeside path'],
  ['route-202','sandgem-town','jubilife-city',3,4,2],
  ['route-203','jubilife-city','oreburgh-city',1,2,3],
  ['route-204','jubilife-city','floaroma-town',1,1,1],
  ['route-205','floaroma-town','eterna-forest',1,1,2],
  ['route-205','eterna-forest','eterna-city',1,1,2],
  ['route-205','floaroma-town','valley-windworks',1,1,2,'eastern branch'],
  ['route-206','eterna-city','206-bridge',2,2,2],
  ['route-206','206-bridge','oreburgh-city',3,4,2],
  ['route-207','oreburgh-city','j:207',1,2,3],
  ['route-208','j:207','hearthome-city',1,1,2],
  ['route-209','hearthome-city','j:209',1,1.5,2],
  ['route-209','j:209','solaceon-town',1,1.5,2],
  ['route-209','j:209','emeragrove-town',0.5,0.5,2,'the Garden Lane'],
  ['route-209','emeragrove-town','gracidea-flower-garden',2,2,3,'the Meadow Path; Garden Society permit in bloom season'],
  ['route-210','celestic-town','solaceon-town',2,2,3],
  ['route-210','solaceon-town','j:210',1,1,3],
  ['route-211','eterna-city','celestic-town',1,1,3,'through Mt. Coronet Pass'],
  ['route-211','j:spine','j:207',8,10,5,'the Coronet Spine'],
  ['route-212','hearthome-city','j:212',4,4,4],
  ['route-212','j:212','pastoria-city',2,4,4],
  ['route-212','j:212','grand-marsh',0.5,0.5,4,'boardwalk spur to the Marsh Gate'],
  ['route-213','pastoria-city','j:213',2,2,2],
  ['route-213','j:213','neighborly-town',2,2,2],
  ['route-214','veilstone-city','j:lake',2,2,2],
  ['route-214','j:lake','crown-city',1,1,2,'the Crown Spur'],
  ['route-214','j:lake','valor-lakefront-and-grand-festival',3,3,2,'the Lake Road'],
  ['route-214','valor-lakefront-and-grand-festival','neighborly-town',1,1,2],
  ['route-215','j:210','veilstone-city',4,4,3],
  ['route-216','greenstation-town','j:spine',3,4,4],
  ['route-217','greenstation-town','acuity-lakefront',4,4,5],
  ['route-217','acuity-lakefront','snowpoint-city',2,4,5],
  ['route-218','jubilife-city','j:218',2,3,2],
  ['route-218','j:218','canalave-city',1,1,2],
  ['route-219','sandgem-town','sandgem-port',1,1,1],
  ['route-220','sandgem-port','sage-town',5,6,3],
  ['route-221','pastoria-city','south-sinnoh-port',5,5,2],
  ['route-222','neighborly-town','j:sunrise',3,3,2],
  ['route-222','j:sunrise','daybreak-town',0.5,0.5,2],
  ['route-222','j:sunrise','camellia-town',0.5,0.5,2],
  ['route-222','camellia-town','sunyshore-city',1,1,2],
  ['route-224','arrowroot-town','brussel-town',1,2,2],
  ['route-224','brussel-town','neighborly-town',1,2,2],
  ['route-225','crown-city','arrowroot-town',1,2,2],
  ['route-225','arrowroot-town','sunyshore-city',2,2,2],
  ['route-226','snowpoint-city','lilypad-town',1,2,2],
  ['route-226','lilypad-town','lucario-kingdom',3,4,2,'to the Kingdom Gate Post'],
  ['route-226','lucario-kingdom','veilstone-city',4,5,2],
  ['route-227','greenstation-town','lilypad-town',2,2,2],
  ['route-228','shelter-town','greenstation-town',1,2,2],
  ['route-229','sandalstraw-town','shelter-town',2,2,2],
  ['route-230','sandalstraw-town','eterna-city',2,2,2],
  ['route-231','squallville','sandalstraw-town',3,3,3],
  ['route-232','chocovine-town','squallville',2,3,2],
  ['route-233','floaroma-town','j:ring',1,1,2],
  ['route-233','j:ring','chocovine-town',1,1,2],
  ['route-234','j:218','j:ring',2,2,1],
  ['route-235','jubilife-city','alamos-town',2,3,3],
  ['route-235','alamos-town','oreburgh-city',1,2,3],
  ['route-236','jubilife-city','oreburgh-city',3,4,2],
  ['route-237','sandgem-town','oreburgh-city',3,4,2],
  ['route-238','jubilife-city','bewilder-forest',2,2,3],
  ['route-238','bewilder-forest','sandgem-town',1,2,3],
  ['route-239','solaceon-town','michina-town',2,3,3],
  ['route-239','michina-town','michina-ruins',0.5,0.5,3,"the Pilgrims' Spur; Dig House pass"],
  ['route-240','hearthome-city','majolica-town',2,2,1],
  ['route-241','majolica-town','j:213',2,3,2],
  ['route-242','majolica-town','j:242',1.5,1.5,2],
  ['route-242','j:242','pastoria-city',1.5,1.5,2],
  ['route-242','j:242','safari-zone',0.5,0.5,2,'the Gate Spur'],
  ['battle-resort-route-225','battle-resort-fight-area','battle-resort-survival-area',4,5,3],
  ['battle-resort-route-226','battle-resort-survival-area','j:stark',3,4,3],
  ['battle-resort-route-227','j:stark','mt-stark',2,3,4],
  ['battle-resort-route-228','j:stark','battle-resort-port',5,6,4],
  ['battle-resort-route-229','battle-resort-port','resort-area',2,2,2],
  ['pavilion-road','champions-port','elite-four-island',1,1,2]
];
/* sea crossings: [from, to, hours, boat and schedule]. Not scaled and not affected by pace. */
const TR_SEA=[
  ['canalave-city','iron-island',9,'the Ironwright: Mon, Wed and Fri at dawn'],
  ['iron-island','squallville',5,'the ore barge'],
  ['veilstone-city','dandelion-island',3,'the Badge Ferry, alternate days'],
  ['dandelion-island','champions-port',3,'the Badge Ferry, alternate days'],
  ['sunyshore-city','champions-port',11,'the Halcyon: daily, 05:00'],
  ['sunyshore-city','crown-city',24,'the freighter Gannet, three times a week'],
  ['sunyshore-city','lily-of-the-valley-conference',14,'the Valerian, Conference season only'],
  ['champions-port','lily-of-the-valley-conference',4,'seasonal ferry'],
  ['lily-of-the-valley-conference','resort-area',1,'ferry'],
  ['resort-area','battle-resort-port',1,'sea shuttle']
];
const trName=id=>TR_JN[id]||(PD_BY[id]?PD_BY[id].name:id);
const trMid=l=>(l[3]+l[4])/2;
const trMiles=l=>Math.round(trMid(l)*TRAVEL_SCALE*TR_MPD[l[5]]);
const TR_SEASONAL=new Set(['route-228','route-229','route-239']);
function trReq(l){
  const part=l[6]==='the Coronet Spine';
  return CLR_REQ.find(r=>r[0]===l[0]&&(part?/^Spine/.test(r[1]):!r[1]))||null;
}
const TR_EDGES=(()=>{
  const e=[];
  TR_LEGS.forEach((l,i)=>{const x={k:'l'+i,leg:l,route:l[0]};e.push(Object.assign({a:l[1],b:l[2]},x),Object.assign({a:l[2],b:l[1]},x));});
  TR_SEA.forEach((s,i)=>{const x={k:'s'+i,sea:s};e.push(Object.assign({a:s[0],b:s[1]},x),Object.assign({a:s[1],b:s[0]},x));});
  return e;
})();
const TR_NODES=(()=>{const n=new Set();TR_EDGES.forEach(e=>{n.add(e.a);n.add(e.b);});return [...n].filter(id=>PD_BY[id]).map(id=>PD_BY[id]).sort(natural);})();
/* each route page gets its distance: the sum of its legs */
(function(){
  const by={};
  TR_LEGS.forEach(l=>{if(l[6]&&/lakeside|eastern branch|Garden Lane|Meadow Path|boardwalk|Pilgrims|Gate Spur|Coronet Spine|Crown Spur/.test(l[6]))return;(by[l[0]]=by[l[0]]||[]).push(l);});
  PD.forEach(f=>{
    const ls=by[f.id];if(!ls||f.t!=='r')return;
    const mi=ls.reduce((a,l)=>a+trMiles(l),0),st=ls[0][5];
    const at=f.facts.findIndex(([k])=>k==='Travel time');
    f.facts.splice(at<0?f.facts.length:at+1,0,['Distance','About '+mi+' miles on foot. Terrain: '+TR_TERRAIN[st]+', '+TR_MPD[st]+' miles a day at a steady pace']);
  });
})();
function trLegStatus(l,cl){
  if(!cl)return null;
  const r=trReq(l);
  if(!r)return {cls:'open',txt:'Open',block:false,seasonal:false};
  const st=clrStatus(cl,r[2],r[3],r[4]);
  const seas=TR_SEASONAL.has(l[0]);
  if(seas&&!clSeasonalOn(l[0]))return {cls:'open',txt:'Open (seasonal limit not in effect)',block:false,seasonal:false};
  return {cls:st[0],txt:st[1],block:st[0]==='warn',seasonal:seas};
}
function trPath(from,to,pace,cl,avoid){
  const m=TR_PACE[pace][0],dist={},prev={},done=new Set();
  const cost=e=>e.sea?e.sea[2]/24:trMid(e.leg)*TRAVEL_SCALE*m;
  dist[from]=0;
  for(;;){
    let u=null;Object.keys(dist).forEach(k=>{if(!done.has(k)&&(u===null||dist[k]<dist[u]))u=k;});
    if(u===null||u===to)break;
    done.add(u);
    TR_EDGES.forEach(e=>{
      if(e.a!==u||done.has(e.b))return;
      if(avoid&&e.leg){const s=trLegStatus(e.leg,cl);if(s&&s.block)return;}
      const d=dist[u]+cost(e);
      if(dist[e.b]==null||d<dist[e.b]){dist[e.b]=d;prev[e.b]=e;}
    });
  }
  if(dist[to]==null)return null;
  const steps=[];let n=to;
  while(n!==from){const e=prev[n];steps.unshift(e);n=e.a;}
  return steps;
}
function trSum(steps,pace,cl){
  const m=TR_PACE[pace][0];
  let lo=0,hi=0,hrs=0,mi=0,worst=0,block=false,seas=false;
  steps.forEach(e=>{
    if(e.sea){hrs+=e.sea[2];return;}
    const l=e.leg;lo+=l[3]*TRAVEL_SCALE*m;hi+=l[4]*TRAVEL_SCALE*m;mi+=trMiles(l);
    const f=PD_BY[l[0]],dg=f?((String(plFact(f,'Danger')).match(/★+/)||[''])[0]).length:0;
    if(dg>worst)worst=dg;
    const s=trLegStatus(l,cl);if(s&&s.block)block=true;if(s&&s.seasonal&&s.cls==='warn')seas=true;
  });
  return {lo,hi,hrs,mi,worst,block,seas};
}
const trDays=(lo,hi)=>{const r=x=>Math.round(x*2)/2;const f=x=>String(r(x)).replace('.5','½');const a=r(lo),b=r(hi);return a===b?f(a)+(a===1?' day':' days'):f(a)+'–'+f(b)+' days';};
const trStars=n=>'★'.repeat(n)+'☆'.repeat(5-n);
S.ui.tp=S.ui.tp||{from:'',to:'',pace:'steady',who:'',avoid:false,show:false};
function trWho(){
  const u=S.ui.tp;
  if(!S.me.admin)return S.trainers[S.me.id]?S.me.id:'';
  return S.trainers[u.who]?u.who:'';
}
function trPanel(){
  const u=S.ui.tp,who=trWho(),t=who?S.trainers[who]:null,cl=t?clrOf(t):null;
  const opt=(v,sel,l)=>h`<option value="${v}" ${v===sel?raw('selected'):''}>${l}</option>`;
  const ok=u.from&&u.to&&u.from!==u.to&&PD_BY[u.from]&&PD_BY[u.to];
  const path=ok?trPath(u.from,u.to,u.pace,cl,u.avoid):null;
  const sum=path?trSum(path,u.pace,cl):null;
  const alt=sum&&sum.block&&!u.avoid?trPath(u.from,u.to,u.pace,cl,true):null;
  const altSum=alt?trSum(alt,u.pace,cl):null;
  const timeTxt=s=>trDays(s.lo,s.hi)+(s.hrs?(s.lo||s.hi?' plus ':'')+s.hrs+' hours at sea':'');
  return h`<section class="panel" id="travelplanner"><div class="ph"><h2>Travel planner</h2><span class="sub">Land distances doubled · daily distance by terrain</span></div>
    <div class="fgrid">
      <label class="fld"><span class="fl">From</span><select data-u="tp.from"><option value="">Choose a place</option>${TR_NODES.map(f=>opt(f.id,u.from,f.name))}</select></label>
      <label class="fld"><span class="fl">To</span><select data-u="tp.to"><option value="">Choose a place</option>${TR_NODES.map(f=>opt(f.id,u.to,f.name))}</select></label>
      <label class="fld"><span class="fl">Pace</span><select data-u="tp.pace">${Object.keys(TR_PACE).map(k=>opt(k,u.pace,TR_PACE[k][1]))}</select></label>
      ${S.me.admin?h`<label class="fld"><span class="fl">Traveling as</span><select data-u="tp.who"><option value="">Nobody (ignore clearance)</option>${tids().map(id=>opt(id,who,tName(S.trainers[id])))}</select></label>`:''}
    </div>
    ${cl?h`<div class="row">${fCheckUi('Avoid routes I am not cleared for','tp.avoid',u.avoid)}<span class="sub">${tName(t)}: ${cl.sus?'license suspended':CLR_TIERS[cl.tier][0]}${cl.guide?', with a guide':''}${cl.permit?', research permit':''}</span></div>`:''}
    ${!ok?h`<p class="sub">Pick two places to see the way, the days on the road and what clearance it needs.</p>`
     :!path?h`<p class="sub">${u.avoid?'There is no way there on routes this trainer is cleared for.':'No mapped road or ferry connects these places yet.'}</p>`
     :h`<div class="tpsum">
        <div class="tpm"><span class="fl">Time on the road</span><b>${timeTxt(sum)}</b><span class="sub">${TR_PACE[u.pace][1]} pace</span></div>
        <div class="tpm"><span class="fl">On foot</span><b>${sum.mi} miles</b></div>
        <div class="tpm"><span class="fl">Worst danger</span><b>${sum.worst?trStars(sum.worst):'None'}</b></div>
        <div class="tpm"><span class="fl">Clearance</span><b class="${sum.block?'tpwarn':''}">${!cl?'Not checked':sum.block?'Restricted':sum.seas?'Seasonal limits':'All clear'}</b></div>
      </div>
      <ol class="tplegs">
        <li><span class="tpn">${trName(u.from)}</span><span class="sub">Start</span></li>
        ${path.map(e=>{
          if(e.sea)return h`<li><span class="tpn"><b>By sea</b> to ${trName(e.b)} <span class="sub">· ${e.sea[2]} hours · ${e.sea[3]}</span></span></li>`;
          const l=e.leg,f=PD_BY[l[0]],m=TR_PACE[u.pace][0],s=trLegStatus(l,cl),rs=f?plFact(f,'Ranger station'):'';
          return h`<li><span class="tpn"><button class="plink" data-act="place" data-id="${l[0]}">${f?f.name:l[0]}</button>${l[6]?h` <span class="sub">(${l[6]})</span>`:''} to ${trName(e.b)}
            <span class="sub">· ${trDays(l[3]*TRAVEL_SCALE*m,l[4]*TRAVEL_SCALE*m)} · ${trMiles(l)} mi, ${TR_TERRAIN[l[5]]} (${Math.round(TR_MPD[l[5]]/m)} mi a day) · ${f?plFact(f,'Danger'):''}${rs?' · Rangers: '+rs:''}</span></span>
            ${s?h`<span class="pill ${s.cls}">${s.seasonal&&s.cls==='warn'?'Seasonal: '+s.txt.toLowerCase():s.txt}</span>`:''}</li>`;})}
      </ol>
      ${altSum?h`<p class="sub tpalt">Avoiding restricted routes: ${timeTxt(altSum)}, ${altSum.mi} miles. <button class="lnk" data-act="tpAvoid">Use that way</button></p>`:''}
      <div class="row"><button class="btn sm" data-act="tpShow" aria-pressed="${String(!!u.show)}">${u.show?'Hide on map':'Show on map'}</button>${S.me.admin?h`<button class="btn sm primary" data-act="cl_start">${clTrip()&&!clTrip().done?'Start this trip instead':'Start this trip'}</button>`:''}</div>`}
    <details class="clrd"><summary>Travel rules</summary>
      <ul class="tprules">
        <li><b>Distances.</b> Sinnoh is bigger than the old notes said: every land travel time is doubled. Ferries keep their times.</li>
        <li><b>Daily distance.</b> A party walking with Pokémon covers, at a steady pace: ${TR_MPD.slice(1).map((d,i)=>TR_TERRAIN[i+1]+' ground '+d+' miles').join(', ')}. The terrain is the route's travel rating.</li>
        <li><b>Careful</b> (half again as long): +2 on Nature and Perception checks on the road, and the party is never caught by surprise.</li>
        <li><b>Steady:</b> the listed time.</li>
        <li><b>Off the road.</b> The semi-route moves at half speed and the off-route at a third. Both are advised against below Pathfinder and Warden but never stopped; file a route plan at a Ranger station for rescue cover.</li>
        <li><b>Push</b> (three quarters of the time): at the end of each pushed day, every trainer makes a Constitution check (the GM sets the difficulty). On a failure they are worn out: −2 on all skill checks until they spend a night at a Route House, an inn or a Pokémon Center.</li>
      </ul>
    </details>
  </section>`;
}
function fCheckUi(label,key,on){
  return h`<label class="row"><input type="checkbox" data-u="${key}" ${on?raw('checked'):''}><span>${label}</span></label>`;
}
/* the planned way, drawn over the map */
function trOverlay(){
  const u=S.ui.tp;
  if(!u.show||!u.from||!u.to)return '';
  const who=trWho(),cl=who?clrOf(S.trainers[who]):null;
  const path=trPath(u.from,u.to,u.pace,cl,u.avoid);
  if(!path)return '';
  const ids=[...new Set(path.filter(e=>e.leg).map(e=>e.route))];
  let s='';
  ids.forEach(id=>{const f=PD_BY[id];if(!f)return;const d=f.segs.map(g=>'M'+g.map(q=>q[0]+' '+q[1]).join('L')).join('');s+='<path class="tpb" d="'+d+'"/><path class="tpr" d="'+d+'"/>';});
  [u.from,u.to].forEach(id=>{const f=PD_BY[id];if(f&&f.t==='p')s+='<circle class="tpb" cx="'+f.x+'" cy="'+f.y+'" r="26"/><circle class="tpr" cx="'+f.x+'" cy="'+f.y+'" r="26"/>';});
  return '<svg class="clrov tpov" viewBox="0 0 '+MAP_W+' '+MAP_H+'" preserveAspectRatio="none" aria-hidden="true" focusable="false">'+s+'</svg>';
}

