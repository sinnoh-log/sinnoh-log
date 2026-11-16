'use strict';
/* Sinnoh Trainer Log · 09d-dash. The files in js/ are classic scripts that share one scope: load them in order (see index.html). */
/* ---------- GM Dashboard (Update 59): one GM-only page for everything that needs tracking day to day ----------
   Top: today (date, time, weather), the reminders, and buttons for the time of day, the weather and the next day.
   Then today's checklist: rest the party, once-a-day gear, the travel day, road trainers, the weekly rankings on the
   weekday the GM picks, eggs. Items the site can see for itself tick themselves; the rest are ticked by hand.
   Then a card per player character: level, HP, credits, badges, ribbons, rank on each circuit, and each party Pokémon's
   HP, status, daily move uses spent, loyalty and whether it can evolve. Then the trip and road battles (the same panels
   as on the Calendar), the weekly jobs, eggs and a to-do list.
   Kept in gm/dash (GM only): wd (weekday the weeks run, 0 = Sunday), day {date, done{}}, wk {gym, con} (date each week
   was last run), eggs [{k, uid, sp, due, days}], todo [{k, t, done}] */

S.ui.gd=Object.assign({euid:'',esp:'',edays:'',todo:''},S.ui.gd||{});
const dashG=()=>S.dashGm||{};
const dashWd=()=>{const w=dashG().wd;return w==null?0:clamp(Math.round(num(w)),0,6);};
const DASH_WD=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const dashEggs=()=>Array.isArray(dashG().eggs)?dashG().eggs:[];
const dashTodo=()=>Array.isArray(dashG().todo)?dashG().todo:[];
const dashPcs=()=>tids().filter(id=>S.trainers[id]&&S.trainers[id].name);
const dashDone=()=>{const d=dashG().day,t=clToday()||'';return d&&d.date===t&&d.done?d.done:{};};
function dashTick(k,on){const done=Object.assign({},dashDone());if(on)done[k]=1;else delete done[k];edit('gd','dash','day',{date:clToday()||'',done});}
/* called when a rankings week is run, from any page */
function dashWeekRan(b){if(!S.me.admin)return;edit('gd','dash','wk',Object.assign({},dashG().wk||{},{[b]:clToday()||'ran'}));}
/* the most recent day (today included) that falls on the GM's weekday */
function dashLastWd(){const t=clParse(clToday());if(!t)return '';return clAdd(clToday(),-((t.getUTCDay()-dashWd()+7)%7));}
/* is this board's week due? '' no · 'today' · 'late' (the weekday has passed since it was last run) */
function dashWeekDue(b){
  const today=clToday();if(!today)return '';
  const seeded=rkWith(b,()=>!!rkB().seed||rkNpcs().length>0||entriesOf(S.trainers).some(t=>t.name));
  if(!seeded)return '';
  const last=(dashG().wk||{})[b]||'',lw=dashLastWd();
  if(last&&clParse(last)&&clDiff(last,lw)<=0)return '';
  if(lw===today)return 'today';
  return last&&clParse(last)?'late':'';
}
const dashEggLeft=e=>{const t=clToday();return t&&clParse(e.due)?clDiff(t,e.due):num(e.days);};
/* daily move uses: [spent, total] across a Pokémon's limited moves */
function dashUses(m){
  let used=0,tot=0;
  (m.moves||[]).forEach(x=>{const f=/(\d+)\s*\/\s*day/i.exec(String(x.freq||''));if(!f)return;tot+=+f[1];used+=Math.min(+f[1],num(x.used));});
  return [used,tot];
}
const dashDown=m=>num(m.hp&&m.hp.max)>0&&num(m.hp&&m.hp.cur)<=0;
function dashRest(uid){monsOf(uid).forEach(m=>{if((m.moves||[]).some(x=>num(x.used)))edit('p',uid+'/'+m.id,'moves',m.moves.map(x=>Object.assign({},x,{used:0})));});endBattle(uid);}
function dashHeal(uid){monsOf(uid).forEach(m=>{const id=uid+'/'+m.id;edit('p',id,'hp.cur',num(m.hp&&m.hp.max));edit('p',id,'status','');});endBattle(uid);}

/* ----- reminders: [{t (text), tab?, act?, lab?, lvl}] ----- */
function dashReminders(){
  if(!S.me.admin||!S.ready)return [];
  const out=[],today=clToday()||'',pcs=dashPcs();
  if(!today)out.push({t:'The calendar has no date yet. Set today’s date so days, weeks and eggs can count.',tab:'cal',lab:'Open the Calendar',lvl:'warn'});
  if(S.battle&&S.battle.on)out.push({t:'A battle is running (round '+(num(S.battle.round)||1)+').',tab:'battle',lab:'Open the battle'});
  [['gym','Gym'],['con','Contest']].forEach(([b,l])=>{
    const due=dashWeekDue(b);
    if(due)out.push({t:due==='today'?'It is '+DASH_WD[dashWd()]+': run the '+l+' circuit week.':'The '+l+' circuit week is overdue (last run '+clNice((dashG().wk||{})[b])+').',act:'gd_week',v:b,lab:'Run the '+l+' week',lvl:due==='late'?'warn':''});
    const dr=rkWith(b,()=>rkHeads().filter(x=>!x.pub).length);
    if(dr)out.push({t:dr+' '+l+' circuit headline'+(dr===1?'':'s')+' waiting to be published.',act:'gd_hpub',v:b,lab:'Publish all'});
  });
  const q=grQ().length;
  if(q)out.push({t:q+' rival team change'+(q===1?'':'s')+' waiting for you.',act:'gr_okall',lab:'Accept all',tab2:'gm'});
  dashEggs().forEach(e=>{if(dashEggLeft(e)<=0)out.push({t:tName(S.trainers[e.uid])+'’s '+e.sp+' egg is ready to hatch.',act:'gd_hatch',k:e.k,lab:'Hatch',lvl:'good'});});
  const t=clTrip();
  if(t&&t.done)out.push({t:'The party has arrived at '+trName(t.to)+'. Copy the log to the journal if you want it, then clear the trip.',lab:'',lvl:''});
  if(t&&!t.done&&today&&!t.log.some(e=>e.date===today))out.push({t:'The party is travelling and today has not been rolled.',act:'cl_roll',lab:'Roll the day'});
  const cur=rdbCur();
  if(cur){
    const open=cur.foes.filter(f=>f.st==='open').length,unpaid=cur.foes.filter(f=>f.st==='done'&&f.fight&&!f.fight.paid).length;
    if(open)out.push({t:open+' road challenge'+(open===1?' is':'s are')+' waiting for an answer.',lab:''});
    if(unpaid)out.push({t:unpaid+' road battle prize'+(unpaid===1?' has':'s have')+' not been paid out.',lab:''});
  }
  pcs.forEach(uid=>{
    const down=partyOf(uid).filter(dashDown);
    if(down.length)out.push({t:tName(S.trainers[uid])+': '+down.map(mName).join(', ')+' '+(down.length===1?'has':'have')+' fainted.',act:'gd_heal',v:uid,lab:'Pokémon Center',lvl:'warn'});
  });
  if(today){
    clEventsOn(today).forEach(e=>out.push({t:'Today: '+e.n+(e.pl&&PD_BY[e.pl]?' ('+PD_BY[e.pl].name+')':'')+'.',tab:'cal',lab:'Calendar'}));
    clEventsOn(clAdd(today,1)).forEach(e=>{if(!clEventsOn(today).some(x=>x.k===e.k))out.push({t:'Tomorrow: '+e.n+'.',tab:'cal',lab:'Calendar'});});
  }
  const td=dashTodo().filter(x=>!x.done).length;
  if(td)out.push({t:td+' item'+(td===1?'':'s')+' on your to-do list.',lab:''});
  return out;
}

/* ----- today's checklist: [{k, t, sub, auto (ticks itself), on, btn}] ----- */
function dashChecklist(){
  const today=clToday()||'',done=dashDone(),t=clTrip(),pcs=dashPcs(),out=[];
  const spent=pcs.some(uid=>monsOf(uid).some(m=>dashUses(m)[0]>0));
  out.push({k:'rest',t:'Rest: refill daily move uses',sub:spent?'Some Pokémon have spent daily uses.':'Nobody has any daily uses spent.',on:!!done.rest||!spent,auto:!spent,act:'gd_rest',v:'all',lab:'Rest everyone'});
  out.push({k:'gear',t:'Reset once-a-day gear',sub:'Key Stones, Dynamax Bands, Tera Orbs, Z-Rings, first-attack held items, the one clothing bonus.',on:!!done.gear});
  if(t&&!t.done){
    const rolled=!!today&&t.log.some(e=>e.date===today);
    out.push({k:'trip',t:'Roll the travel day',sub:rolled?'Rolled.':'Weather, progress, encounters and road events.',on:rolled||!!done.trip,auto:rolled,act:'cl_roll',lab:'Roll the day'});
    const cur=rdbCur(),rb=!!cur&&!!today&&cur.date===today;
    out.push({k:'road',t:'Roll for trainers on the road',sub:rb?(cur.want?cur.foes.length+' trainer'+(cur.foes.length===1?'':'s')+' turned up.':'Nobody challenged the party.'):'One d6 by zone.',on:rb||!!done.road,auto:rb,act:'rdb_roll',lab:'Roll for trainers'});
  }
  [['gym','Gym'],['con','Contest']].forEach(([b,l])=>{
    const due=dashWeekDue(b),ranToday=!!today&&(dashG().wk||{})[b]===today;
    if(due||ranToday)out.push({k:'wk'+b,t:'Run the '+l+' circuit week',sub:ranToday?'Run today.':due==='late'?'Overdue.':DASH_WD[dashWd()]+' is rankings day.',on:ranToday,auto:true,act:'gd_week',v:b,lab:'Run the week'});
  });
  const ready=dashEggs().filter(e=>dashEggLeft(e)<=0);
  if(ready.length)out.push({k:'egg',t:'Hatch '+ready.length+' egg'+(ready.length===1?'':'s'),sub:ready.map(e=>e.sp+' ('+tName(S.trainers[e.uid])+')').join(', '),on:false,auto:true});
  if(today){const ev=clEventsOn(today);if(ev.length)out.push({k:'cal',t:'Today on the calendar',sub:ev.map(e=>e.n).join(', '),on:!!done.cal});}
  return out;
}

/* ----- actions ----- */
async function dashHatch(k){
  const e=dashEggs().find(x=>x.k===k);if(!e)return;
  if(!S.trainers[e.uid]){toast('That trainer is gone. Remove the egg instead.');return;}
  S.ui.give=Object.assign(S.ui.give||{},{uid:e.uid,sp:e.sp,nick:'',caught:'Hatched from an egg'+(clToday()?' on '+clNice(clToday()):'')});
  await giveMon();
  edit('gd','dash','eggs',dashEggs().filter(x=>x.k!==k));
  render();
}
function dashEggAdd(){
  const u=S.ui.gd,uid=u.euid&&S.trainers[u.euid]?u.euid:dashPcs()[0],sp=String(u.esp||'').trim();
  if(!uid){toast('There are no trainers yet.');return;}
  if(!sp){toast('Type the species the egg will hatch into.');return;}
  if(!clToday()){toast('Set today’s date on the Calendar first, so the egg can count days.');return;}
  const r=pxRec(sp),auto=r&&parseInt(r.hr,10);
  const days=String(u.edays).trim()!==''?Math.max(0,Math.round(num(u.edays))):(auto||10);
  edit('gd','dash','eggs',dashEggs().concat([{k:rkKey(),uid,sp:(speciesInfo(sp)||{name:sp}).name||sp,days,due:clAdd(clToday(),days),at:clToday()}]));
  toast(tName(S.trainers[uid])+' has a '+sp+' egg: '+days+' day'+(days===1?'':'s')+' to hatch'+(String(u.edays).trim()===''?(auto?' (from the Pokédex)':' (no hatch time in the Pokédex, so 10)'):'')+'.',true);
  u.esp='';u.edays='';render();
}
function dashAct(b){
  if(!S.me.admin)return;
  const d=b.dataset,u=S.ui.gd;
  switch(d.act){
    case 'gd_next':{
      if(!clToday()){toast('Set today’s date on the Calendar first.');setTab('cal');break;}
      const n=clAdd(clToday(),1);clSetDate(n,{dawn:true});S.ui.cl.sel=n;S.ui.cl.view=n.slice(0,7);
      toast('A new day: '+clNice(n)+'. Work through today’s checklist.',true);render();
      const el=document.getElementById('dashcheck');if(el)el.scrollIntoView({block:'start'});
      break;}
    case 'gd_adv':{const order=CD_T.map(p=>p[0]),cur=cdGet().t;edit('cd','conditions','t',order[(order.indexOf(cur)+1)%order.length]);cdChanged();render();break;}
    case 'gd_wx':edit('cd','conditions','x',cdWeatherRoll(cdGet().s));cdChanged();render();break;
    case 'gd_rest':{
      const ids=d.v==='all'?dashPcs():[d.v];ids.forEach(dashRest);
      if(d.v==='all')dashTick('rest',true);
      toast(d.v==='all'?'Everyone rested: daily move uses are refilled.':tName(S.trainers[d.v])+'’s team rested.',true);render();break;}
    case 'gd_heal':{
      if(d.v==='all'&&S.ui.confirm!=='gd_heal'){S.ui.confirm='gd_heal';render();break;}
      S.ui.confirm=null;
      const ids=d.v==='all'?dashPcs():[d.v];ids.forEach(dashHeal);
      toast(d.v==='all'?'Everyone’s Pokémon are healed.':tName(S.trainers[d.v])+'’s Pokémon are healed.',true);render();break;}
    case 'gd_tick':dashTick(d.k,!dashDone()[d.k]);render();break;
    case 'gd_week':rkWith(d.v==='con'?'con':'gym',()=>rkAct({dataset:{act:'rk_week'}}));break;
    case 'gd_hpub':rkWith(d.v==='con'?'con':'gym',()=>rkAct({dataset:{act:'rk_hpuball'}}));toast('Headlines published.',true);break;
    case 'gd_hatch':dashHatch(d.k);break;
    case 'gd_eggadd':dashEggAdd();break;
    case 'gd_eggdel':edit('gd','dash','eggs',dashEggs().filter(x=>x.k!==d.k));render();break;
    case 'gd_eggday':{const n=num(d.d);edit('gd','dash','eggs',dashEggs().map(x=>x.k===d.k?Object.assign({},x,{due:clAdd(x.due,n)}):x));render();break;}
    case 'gd_todoadd':{const t=String(u.todo||'').trim();if(!t){toast('Type something to do first.');break;}edit('gd','dash','todo',dashTodo().concat([{k:rkKey(),t:t.slice(0,200),done:false}]).slice(-80));u.todo='';render();break;}
    case 'gd_todo':edit('gd','dash','todo',dashTodo().map(x=>x.k===d.k?Object.assign({},x,{done:!x.done}):x));render();break;
    case 'gd_tododel':edit('gd','dash','todo',dashTodo().filter(x=>x.k!==d.k));render();break;
    case 'gd_todoclr':edit('gd','dash','todo',dashTodo().filter(x=>!x.done));render();break;
    case 'gd_sheet':S.viewUid=d.v;setTab(d.t==='mon'?'pokemon':'trainer');break;
    case 'gd_wd':break;
  }
}
/* the weekday picker */
function dashChange(t){
  if(t.dataset.gdwd==null||!S.me.admin)return false;
  edit('gd','dash','wd',clamp(Math.round(num(t.value)),0,6));render();return true;
}

/* ----- the page ----- */
function dashBtn(r){
  if(r.act)return h`<button class="btn sm" data-act="${r.act}" ${r.v?raw('data-v="'+esc(r.v)+'"'):''} ${r.k?raw('data-k="'+esc(r.k)+'"'):''}>${r.lab}</button>`;
  if(r.tab)return h`<button class="btn sm ghost" data-act="tab" data-tab="${r.tab}">${r.lab}</button>`;
  return '';
}
function dashPcCard(uid){
  const t=S.trainers[uid],party=partyOf(uid),box=boxOf(uid).length;
  const g=onGym(t)?rkWith('gym',()=>rkRows().find(x=>x.id===uid)):null,c=onCon(t)?rkWith('con',()=>rkRows().find(x=>x.id===uid)):null;
  const facts=[['Level',Math.round(num(t.level))||1],['HP',t.hp&&num(t.hp.max)?num(t.hp.cur)+'/'+num(t.hp.max):'—'],['Credits',fmtP(t.credits)],['Badges',badgeCount(t)],['Ribbons',ribCount(t)],
    ['Gym rank',g?'#'+g.pos:'—'],['Contest rank',c?'#'+c.pos:'—']];
  return h`<article class="dashpc"><div class="row sp"><h3>${tName(t)}</h3><span class="row"><button class="btn sm" data-act="gd_rest" data-v="${uid}">Rest 8h</button><button class="btn sm" data-act="gd_heal" data-v="${uid}">Pokémon Center</button><button class="btn sm ghost" data-act="gd_sheet" data-v="${uid}">Sheet</button></span></div>
    <dl class="dashfacts">${facts.map(([k,v])=>h`<div><dt>${k}</dt><dd>${v}</dd></div>`)}</dl>
    ${party.length?h`<ul class="dashmons">${party.map(m=>{
      const [used,tot]=dashUses(m),L=clamp(num((S.gmLoy[m.id]||{}).loyalty),0,5),down=dashDown(m);
      const pr=PTA.idx?ptaResolve(m.species):null,rec=pr?ptaRec(pr):null;if(pr&&!rec)ptaWarm(pr);
      const canEvo=!!(rec&&rec.ev&&rec.ev.length),gate=canEvo&&(evoFree()||evoGate(m).split('|')[0]===ptaKey(m.species));
      return h`<li class="${down?'down':''}"><div class="row sp"><span><b>${mName(m)}</b>${m.nick&&m.species?h` <span class="sub">${m.species}</span>`:''}</span><span class="mono">${num(m.hp&&m.hp.cur)}/${num(m.hp&&m.hp.max)}</span></div>
        ${hpBar(m.hp)}
        <div class="row dashtags">${down?h`<span class="pill status">Fainted</span>`:''}${m.status?h`<span class="pill status">${m.status}</span>`:''}
          <span class="pill ${tot&&used>=tot?'wary':''}">${tot?used+' of '+tot+' daily uses spent':'No daily moves'}</span>
          <span class="pill">Loyalty ${L} · ${LOY_WORDS[L]}</span>
          ${megaOn(m)?h`<span class="pill mega">Mega</span>`:''}
          ${canEvo?h`<button class="btn sm ${gate?'':'ghost'}" data-act="evoGate" data-pid="${m.id}" data-v="${gate?'0':'1'}" aria-pressed="${String(!!gate)}">${gate?'Evolution allowed':'Can evolve: allow'}</button>`:''}</div></li>`;})}</ul>`
      :h`<p class="sub">No Pokémon in the party.</p>`}
    ${box?h`<p class="sub">${box} more in the box.</p>`:''}</article>`;
}
function dashTab(){
  if(!S.me.admin)return '';
  const today=clToday()||'',c=cdGet(),rem=dashReminders(),list=dashChecklist(),pcs=dashPcs(),t=clTrip(),u=S.ui.gd;
  const left=list.filter(x=>!x.on).length,eggs=dashEggs().slice().sort((a,b)=>dashEggLeft(a)-dashEggLeft(b)),todo=dashTodo();
  const armed=S.ui.confirm==='gd_heal',q=grQ().length;
  const drafts={gym:rkWith('gym',()=>rkHeads().filter(x=>!x.pub).length),con:rkWith('con',()=>rkHeads().filter(x=>!x.pub).length)};
  const wk={gym:rkWith('gym',()=>num(rkB().wk)),con:rkWith('con',()=>num(rkB().wk))};
  return h`<section class="panel dash" id="dashtop"><div class="ph"><h2>${today?clNice(today,{y:true}):'No date set'}</h2><span class="pill gm">GM only</span></div>
      <p class="dashnow">${[CD_LAB[c.t],CD_LAB[c.x],CD_LAB[c.s],CD_LAB[c.m],CD_LAB[c.d]].filter(Boolean).join(' · ')}${t&&!t.done?' · On the road to '+trName(t.to)+', day '+t.day:''}</p>
      <div class="row"><button class="btn primary sm" data-act="gd_next">Start the next day</button><button class="btn sm" data-act="gd_adv">Next time of day</button><button class="btn sm" data-act="gd_wx">Roll the weather</button>
        <button class="btn sm" data-act="gd_rest" data-v="all">Rest everyone</button><button class="btn sm ${armed?'danger armed':''}" data-act="gd_heal" data-v="all">${armed?'Tap again to heal everyone':'Pokémon Center: everyone'}</button></div>
      <h3 class="dashh">Reminders${rem.length?h` <span class="pill ${rem.some(r=>r.lvl==='warn')?'wary':''}">${rem.length}</span>`:''}</h3>
      ${rem.length?h`<ul class="dashrem">${rem.map(r=>h`<li class="${r.lvl||''}"><span>${r.t}</span>${dashBtn(r)}</li>`)}</ul>`:h`<p class="sub">Nothing needs you right now.</p>`}
    </section>
    <section class="panel dash" id="dashcheck"><div class="ph"><h2>Today’s checklist</h2><span class="pill ${left?'':'good'}">${left?left+' to do':'All done'}</span></div>
      <ul class="dashlist">${list.map(x=>h`<li class="${x.on?'on':''}">
        ${x.auto?h`<span class="dashbox ${x.on?'on':''}" role="img" aria-label="${x.on?'Done':'Not done'}">${x.on?'✓':''}</span>`:h`<button class="dashbox ${x.on?'on':''}" data-act="gd_tick" data-k="${x.k}" role="checkbox" aria-checked="${String(!!x.on)}" aria-label="${x.t}">${x.on?'✓':''}</button>`}
        <span class="dashit"><b>${x.t}</b><span class="sub">${x.sub||''}</span></span>
        ${x.act&&!x.on?h`<button class="btn sm" data-act="${x.act}" ${x.v?raw('data-v="'+esc(x.v)+'"'):''}>${x.lab}</button>`:''}</li>`)}</ul>
      <p class="sub">The list starts again each new day. Ticks with a round box fill themselves in when the site sees the job is done.</p>
    </section>
    <section class="panel dash"><div class="ph"><h2>The party</h2></div>
      ${pcs.length?h`<div class="dashpcs">${pcs.map(dashPcCard)}</div>`:h`<p class="sub">No trainers yet.</p>`}</section>
    ${t?clTripPanel():h`<section class="panel dash"><div class="ph"><h2>On the road</h2></div><p class="sub">No trip is running. Plan one on the Map page.</p><div class="row"><button class="btn sm ghost" data-act="tab" data-tab="map">Open the Map</button></div></section>`}
    ${rdbPanel()}
    <section class="panel dash"><div class="ph"><h2>Weekly</h2></div>
      <div class="row"><label class="fld"><span class="fl">Rankings day</span><select data-gdwd="1" aria-label="Rankings day">${DASH_WD.map((n,i)=>h`<option value="${i}" ${i===dashWd()?raw('selected'):''}>${n}</option>`)}</select></label></div>
      <ul class="dashrem">${[['gym','Gym'],['con','Contest']].map(([b,l])=>{const last=(dashG().wk||{})[b];return h`<li><span><b>${l} circuit</b>, week ${wk[b]}. ${last&&clParse(last)?'Last run '+clNice(last)+'.':'Not run from here yet.'}${drafts[b]?' '+drafts[b]+' headline draft'+(drafts[b]===1?'':'s')+'.':''}</span>
        <span class="row"><button class="btn sm" data-act="gd_week" data-v="${b}">Run the week</button>${drafts[b]?h`<button class="btn sm" data-act="gd_hpub" data-v="${b}">Publish headlines</button>`:''}</span></li>`;})}
        <li><span><b>Rival team changes</b>: ${q?q+' waiting.':'none waiting.'}</span><span class="row">${q?h`<button class="btn sm" data-act="gr_okall">Accept all</button>`:''}<button class="btn sm ghost" data-act="tab" data-tab="gm">Review on the GM Desk</button></span></li></ul>
    </section>
    <section class="panel dash" id="dasheggs"><div class="ph"><h2>Eggs</h2></div>
      ${eggs.length?h`<ul class="dashrem">${eggs.map(e=>{const d=dashEggLeft(e);return h`<li class="${d<=0?'good':''}"><span><b>${e.sp}</b> · ${tName(S.trainers[e.uid])} · ${d<=0?'ready to hatch':d+' day'+(d===1?'':'s')+' left'}${clParse(e.due)?h` <span class="sub">(${clNice(e.due)})</span>`:''}</span>
        <span class="row"><button class="btn sm ${d<=0?'primary':''}" data-act="gd_hatch" data-k="${e.k}">${d<=0?'Hatch':'Hatch now'}</button><button class="btn sm ghost" data-act="gd_eggday" data-k="${e.k}" data-d="-1" aria-label="One day sooner">−1</button><button class="btn sm ghost" data-act="gd_eggday" data-k="${e.k}" data-d="1" aria-label="One day later">+1</button><button class="btn sm ghost" data-act="gd_eggdel" data-k="${e.k}">Remove</button></span></li>`;})}</ul>`:h`<p class="sub">Nobody is carrying an egg.</p>`}
      <div class="fgrid">
        <label class="fld"><span class="fl">Carried by</span><select data-u="gd.euid" data-nr>${pcs.map(id=>h`<option value="${id}" ${id===u.euid?raw('selected'):''}>${tName(S.trainers[id])}</option>`)}</select></label>
        <label class="fld"><span class="fl">Hatches into</span><input type="text" data-u="gd.esp" data-nr value="${u.esp}" list="dl-species" placeholder="Species"></label>
        <label class="fld"><span class="fl">Days (blank: Pokédex)</span><input type="number" min="0" inputmode="numeric" data-u="gd.edays" data-nr value="${u.edays}" placeholder="From the Pokédex"></label>
      </div>
      <div class="row"><button class="btn sm" data-act="gd_eggadd">Add the egg</button></div>
      <p class="sub">Eggs count down as the calendar moves. Hatch gives the Pokémon to the player, filled in from the Pokédex.</p>
    </section>
    <section class="panel dash" id="dashtodo"><div class="ph"><h2>To do</h2>${todo.some(x=>x.done)?h`<div class="acts"><button class="btn sm ghost" data-act="gd_todoclr">Clear done</button></div>`:''}</div>
      ${todo.length?h`<ul class="dashlist">${todo.map(x=>h`<li class="${x.done?'on':''}"><button class="dashbox ${x.done?'on':''}" data-act="gd_todo" data-k="${x.k}" role="checkbox" aria-checked="${String(!!x.done)}" aria-label="${x.t}">${x.done?'✓':''}</button><span class="dashit"><b>${x.t}</b></span><button class="btn sm ghost" data-act="gd_tododel" data-k="${x.k}" aria-label="${'Remove '+x.t}">Remove</button></li>`)}</ul>`:h`<p class="sub">Nothing on the list.</p>`}
      <div class="row"><label class="fld dashgrow"><span class="fl">New item</span><input type="text" data-u="gd.todo" data-nr value="${u.todo}" maxlength="200" placeholder="e.g. Pay Impala’s agency booking"></label><button class="btn sm" data-act="gd_todoadd">Add</button></div>
    </section>`;
}
