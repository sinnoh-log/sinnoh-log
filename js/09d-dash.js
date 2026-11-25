'use strict';
/* Sinnoh Trainer Log · 09d-dash. The files in js/ are classic scripts that share one scope: load them in order (see index.html). */
/* ---------- GM Dashboard (Update 59, reworked in Update 60): one GM-only page for everything tracked day to day ----------
   Top: today's date and conditions, with the buttons grouped as Time, Party care and Weekly.
   Today: one list of every job and alert, each once, with its button and its tick (see dashToday).
   The party: a card per player character, with quick edits on each Pokémon (HP, daily uses, status, loyalty) and a
   More menu (evolution, box, its page); the box opens under the party.
   The trip and road battles fold to one line each; open them for the full panels from the Calendar.
   Then the weekly jobs, eggs and a to-do list.
   Kept in gm/dash (GM only): wd (weekday the weeks run, 0 = Sunday), day {date, done{}}, wk {gym, con} (date each week
   was last run), eggs [{k, uid, sp, due, days}], todo [{k, t, done}] */

S.ui.gd=Object.assign({euid:'',esp:'',edays:'',todo:'',open:{}},S.ui.gd||{});
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

/* ----- today: one list of every job and alert, each once, with its button and its tick ----------
   kind: 'tick' (you tick it), 'auto' (ticks itself when the site sees it done), 'note' (an alert that goes away when
   dealt with). lvl: '' | 'warn' | 'good'. btns: [{act, v, k, lab, tab, primary}] */
function dashToday(){
  if(!S.me.admin||!S.ready)return [];
  const out=[],today=clToday()||'',done=dashDone(),pcs=dashPcs(),t=clTrip(),cur=rdbCur();
  const add=o=>out.push(Object.assign({sub:'',lvl:'',btns:[],on:false},o));
  if(!today)add({k:'nodate',kind:'note',lvl:'warn',t:'The calendar has no date yet',sub:'Set today’s date so days, weeks and eggs can count.',btns:[{tab:'cal',lab:'Open the Calendar'}]});
  if(S.battle&&S.battle.on)add({k:'battle',kind:'note',t:'A battle is running',sub:'Round '+(num(S.battle.round)||1)+'.',btns:[{tab:'battle',lab:'Open the battle'}]});
  pcs.forEach(uid=>{
    const down=partyOf(uid).filter(dashDown);
    if(down.length)add({k:'down'+uid,kind:'note',lvl:'warn',t:tName(S.trainers[uid])+': '+down.map(mName).join(', ')+' '+(down.length===1?'has':'have')+' fainted',btns:[{act:'gd_heal',v:uid,lab:'Pokémon Center'}]});
  });
  const spent=pcs.some(uid=>monsOf(uid).some(m=>dashUses(m)[0]>0));
  add({k:'rest',kind:spent?'tick':'auto',t:'Rest: refill daily move uses',sub:spent?'Some Pokémon have spent daily uses.':'Nobody has spent any daily uses.',on:!!done.rest||!spent,btns:spent?[{act:'gd_rest',v:'all',lab:'Rest everyone'}]:[]});
  add({k:'gear',kind:'tick',t:'Reset once-a-day gear',sub:'Key Stones, Dynamax Bands, Tera Orbs, Z-Rings, first-attack held items, the one clothing bonus.',on:!!done.gear});
  if(t&&!t.done){
    const rolled=!!today&&t.log.some(e=>e.date===today);
    add({k:'trip',kind:'auto',t:'Roll the travel day',sub:rolled?'Rolled.':'Weather, progress, encounters and road events.',on:rolled,btns:[{act:'cl_roll',lab:'Roll the day'}]});
    const rb=!!cur&&!!today&&cur.date===today&&!cur.gymOnly;
    add({k:'road',kind:'auto',t:'Roll for trainers on the road',sub:rb?(cur.want?cur.foes.length+' trainer'+(cur.foes.length===1?'':'s')+' turned up.':'Nobody challenged the party.'):'One d6 by zone.',on:rb,btns:[{act:'rdb_roll',lab:'Roll for trainers'}]});
  }
  if(t&&t.done)add({k:'arrived',kind:'note',t:'The party has arrived at '+trName(t.to),sub:'Copy the log to the journal if you want it, then clear the trip.',btns:[{act:'gd_show',v:'trip',lab:'Show the trip'}]});
  if(cur){
    const open=cur.foes.filter(f=>f.st==='open').length,unpaid=cur.foes.filter(f=>f.st==='done'&&f.fight&&!f.fight.paid).length;
    if(open)add({k:'rdbopen',kind:'note',lvl:'warn',t:open+' road challenge'+(open===1?' is':'s are')+' waiting for an answer',btns:[{act:'gd_show',v:'road',lab:'Answer'}]});
    if(unpaid)add({k:'rdbpay',kind:'note',t:unpaid+' road battle prize'+(unpaid===1?' has':'s have')+' not been paid out',btns:[{act:'gd_show',v:'road',lab:'Show'}]});
  }
  [['gym','Gym'],['con','Contest']].forEach(([b,l])=>{
    const due=dashWeekDue(b),ranToday=!!today&&(dashG().wk||{})[b]===today;
    if(due||ranToday)add({k:'wk'+b,kind:'auto',lvl:due==='late'?'warn':'',t:'Run the '+l+' circuit week',sub:ranToday?'Run today.':due==='late'?'Overdue: last run '+clNice((dashG().wk||{})[b])+'.':DASH_WD[dashWd()]+' is rankings day.',on:ranToday,btns:[{act:'gd_week',v:b,lab:'Run the week'}]});
    const dr=rkWith(b,()=>rkHeads().filter(x=>!x.pub).length);
    if(dr)add({k:'hd'+b,kind:'note',t:dr+' '+l+' circuit headline'+(dr===1?'':'s')+' waiting to be published',btns:[{act:'gd_hpub',v:b,lab:'Publish all'}]});
  });
  const q=grQ().length;
  if(q)add({k:'grq',kind:'note',t:q+' rival team change'+(q===1?'':'s')+' waiting for you',btns:[{act:'gr_okall',lab:'Accept all'},{tab:'gm',lab:'Review'}]});
  dashEggs().forEach(e=>{if(dashEggLeft(e)<=0)add({k:'egg'+e.k,kind:'note',lvl:'good',t:tName(S.trainers[e.uid])+'’s '+e.sp+' egg is ready to hatch',btns:[{act:'gd_hatch',k:e.k,lab:'Hatch',primary:true}]});});
  if(today){
    const ev=clEventsOn(today);
    if(ev.length)add({k:'cal',kind:'tick',t:'Today on the calendar',sub:ev.map(e=>e.n+(e.pl&&PD_BY[e.pl]?' ('+PD_BY[e.pl].name+')':'')).join(', '),on:!!done.cal});
    const tm=clEventsOn(clAdd(today,1)).filter(e=>!ev.some(x=>x.k===e.k));
    if(tm.length)add({k:'tmrw',kind:'note',t:'Tomorrow: '+tm.map(e=>e.n).join(', '),btns:[{tab:'cal',lab:'Calendar'}]});
  }
  return out.filter(x=>!x.on).concat(out.filter(x=>x.on));
}
/* what still needs doing (the menu count) */
const dashReminders=()=>dashToday().filter(x=>!x.on&&x.k!=='tmrw');

/* ----- quick edits on the party cards ----- */
/* HP box: "-9" or "+5" changes it by that much; a plain number sets it */
function dashHpInput(t){
  const [uid,pid]=String(t.dataset.gdhp).split('|'),m=(S.pokemon[uid]||{})[pid];
  const v=String(t.value||'').trim().replace(/[−–]/g,'-');t.value='';
  if(!m||!v)return;
  const mx=num(m.hp&&m.hp.max),cur=num(m.hp&&m.hp.cur);
  let n;
  if(/^[+-]\s*\d+$/.test(v))n=cur+Number(v.replace(/\s/g,''));
  else if(/^\d+$/.test(v))n=Number(v);
  else{toast('Type a change like −9 or +5, or a new total.');return;}
  n=clamp(n,0,mx||n);
  edit('p',uid+'/'+pid,'hp.cur',n);
  toast(mName(m)+': '+n+'/'+mx+' HP'+(n<=0?', fainted':'')+'.',true);render();
}
function dashLoyInput(t){
  const [uid,pid]=String(t.dataset.gdloy).split('|'),n=clamp(Math.round(num(t.value)),0,5);
  const c=S.gmLoy[pid]||{uid,pid};c.loyalty=n;S.gmLoy[pid]=c;save('gl',pid,{loyalty:n});render();
}
/* one more daily use of a move; past its limit it goes back to none */
function dashUse(uid,pid,i){
  const m=(S.pokemon[uid]||{})[pid];if(!m||!Array.isArray(m.moves)||!m.moves[i])return;
  const x=m.moves[i],f=/(\d+)\s*\/\s*day/i.exec(String(x.freq||''));if(!f)return;
  const mx=+f[1],u=num(x.used),nu=u>=mx?0:u+1;
  edit('p',uid+'/'+pid,'moves',m.moves.map((y,j)=>j===i?Object.assign({},y,{used:nu}):y));render();
}
/* folded sections: what the GM chose, else road battles open themselves while a challenge or a prize is waiting */
const dashRoadBusy=()=>{const c=rdbCur();return !!c&&c.foes.some(f=>f.st==='open'||(f.st==='done'&&f.fight&&!f.fight.paid));};
const dashIsOpen=k=>{const v=S.ui.gd.open[k];return v===undefined?(k==='road'?dashRoadBusy():false):!!v;};
/* ----- actions ----- */
async function dashHatch(k){
  const e=dashEggs().find(x=>x.k===k);if(!e)return;
  if(!S.trainers[e.uid]){toast('That trainer is gone. Remove the egg instead.');return;}
  S.ui.give=Object.assign(S.ui.give||{},{uid:e.uid,sp:e.sp,nick:'',caught:'Hatched from an egg'+(clToday()?' on '+clNice(clToday()):'')});
  await giveMon();
  tlLogHatch(e);
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
      const el=document.getElementById('dashtoday');if(el)el.scrollIntoView({block:'start'});
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
    case 'gd_open':{const k=d.v;u.open[k]=!dashIsOpen(k);
      render();if(k==='trip'||k==='road'){const el=document.getElementById(k==='trip'?'dashtrip':'dashroad');if(el&&u.open[k])el.scrollIntoView({block:'start'});}break;}
    case 'gd_show':{u.open[d.v]=true;render();const el=document.getElementById(d.v==='trip'?'dashtrip':'dashroad');if(el)el.scrollIntoView({block:'start'});break;}
    case 'gd_use':dashUse(d.uid,d.pid,num(d.i));break;
    case 'gd_stclr':edit('p',d.uid+'/'+d.pid,'status','');render();break;
    case 'gd_mon':S.viewUid=d.uid;S.ui.open['p'+d.uid+'/'+d.pid]=true;setTab('pokemon');break;
  }
}
/* the weekday picker */
function dashChange(t){
  if(!S.me.admin)return false;
  if(t.dataset.gdhp!=null){dashHpInput(t);return true;}
  if(t.dataset.gdloy!=null){dashLoyInput(t);return true;}
  if(t.dataset.gdwd==null)return false;
  edit('gd','dash','wd',clamp(Math.round(num(t.value)),0,6));render();return true;
}

/* ----- the page ----- */
function dashBtn(r){
  if(r.act)return h`<button class="btn sm ${r.primary?'primary':''}" data-act="${r.act}" ${r.v?raw('data-v="'+esc(r.v)+'"'):''} ${r.k?raw('data-k="'+esc(r.k)+'"'):''}>${r.lab}</button>`;
  if(r.tab)return h`<button class="btn sm ghost" data-act="tab" data-tab="${r.tab}">${r.lab}</button>`;
  return '';
}
function dashTodayHtml(){
  const list=dashToday(),left=list.filter(x=>!x.on).length;
  return h`<section class="panel dash" id="dashtoday"><div class="ph"><h2>Today</h2><span class="pill ${left?(list.some(x=>!x.on&&x.lvl==='warn')?'wary':''):'good'}">${left?left+' to do':'All done'}</span></div>
    ${list.length?h`<ul class="dashlist">${list.map(x=>h`<li class="${(x.on?'on ':'')+(x.lvl||'')}">
      ${x.kind==='tick'?h`<button class="dashbox ${x.on?'on':''}" data-act="gd_tick" data-k="${x.k}" role="checkbox" aria-checked="${String(!!x.on)}" aria-label="${x.t}">${x.on?'✓':''}</button>`
        :x.kind==='auto'?h`<span class="dashbox round ${x.on?'on':''}" role="img" aria-label="${x.on?'Done':'Not done yet'}">${x.on?'✓':''}</span>`
        :h`<span class="dashdot ${x.lvl||''}" aria-hidden="true"></span>`}
      <span class="dashit"><b>${x.t}</b>${x.sub?h`<span class="sub">${x.sub}</span>`:''}</span>
      ${x.on?'':h`<span class="dashbtns">${x.btns.map(dashBtn)}</span>`}</li>`)}</ul>`:h`<p class="sub">Nothing needs you right now.</p>`}
    <p class="sub">Square boxes are yours to tick; round ones tick themselves when the site sees the job done. Alerts go away once dealt with. The list starts again each new day.</p>
  </section>`;
}
function dashMonRow(uid,m){
  const pid=m.id,[used,tot]=dashUses(m),L=clamp(num((S.gmLoy[pid]||{}).loyalty),0,5),down=dashDown(m),more=dashIsOpen('m'+pid);
  const pr=PTA.idx?ptaResolve(m.species):null,rec=pr?ptaRec(pr):null;if(pr&&!rec)ptaWarm(pr);
  const canEvo=!!(rec&&rec.ev&&rec.ev.length),gate=canEvo&&(evoFree()||evoGate(m).split('|')[0]===ptaKey(m.species));
  const lim=(m.moves||[]).map((x,i)=>({x,i,f:/(\d+)\s*\/\s*day/i.exec(String(x.freq||''))})).filter(o=>o.f);
  const nm=mName(m),boxed=m.slot==='box';
  return h`<li class="${down?'down':''}"><div class="row sp dashmh"><span><b>${nm}</b>${m.nick&&m.species?h` <span class="sub">${m.species}</span>`:''}${m.status?h` <span class="pill status">${m.status} <button class="pillx" data-act="gd_stclr" data-uid="${uid}" data-pid="${pid}" aria-label="${'Clear '+nm+'’s status'}">×</button></span>`:''}${down?h` <span class="pill status">Fainted</span>`:''}${megaOn(m)?h` <span class="pill mega">Mega</span>`:''}</span>
      <span class="row dashhp"><span class="mono">${num(m.hp&&m.hp.cur)}/${num(m.hp&&m.hp.max)}</span><input type="text" inputmode="text" class="dashhpin" data-gdhp="${uid}|${pid}" placeholder="±HP" aria-label="${'Change '+nm+'’s HP: −9 or +5, or a new total'}"></span></div>
    ${hpBar(m.hp)}
    <div class="row dashtags">${lim.length?lim.map(o=>{const mx=+o.f[1],u=Math.min(mx,num(o.x.used));return h`<button class="btn sm dashuse ${u>=mx?'full':''}" data-act="gd_use" data-uid="${uid}" data-pid="${pid}" data-i="${o.i}" aria-label="${o.x.name+': '+u+' of '+mx+' daily uses spent. Press to spend one'+(u>=mx?' (resets to none)':'')}">${o.x.name} <b>${u}/${mx}</b></button>`;}):h`<span class="pill">No daily moves</span>`}
      <label class="dashloy"><span class="sr">Loyalty for ${nm}</span><select data-gdloy="${uid}|${pid}" aria-label="${'Loyalty for '+nm}">${[0,1,2,3,4,5].map(n=>h`<option value="${n}" ${n===L?raw('selected'):''}>Loyalty ${n} · ${LOY_WORDS[n]}</option>`)}</select></label>
      <button class="btn sm ghost" data-act="gd_open" data-v="${'m'+pid}" aria-expanded="${String(more)}">${more?'Less':'More'}${canEvo&&gate?' · evolution allowed':''}</button></div>
    ${more?h`<div class="row dashmore">
      ${canEvo?h`<span class="seg" role="group" aria-label="${'Allow '+nm+' to evolve'}"><button data-act="evoGate" data-pid="${pid}" data-v="1" aria-pressed="${String(!!gate)}">Evolution allowed</button><button data-act="evoGate" data-pid="${pid}" data-v="0" aria-pressed="${String(!gate)}">Not yet</button></span>`:h`<span class="sub">${rec?'Does not evolve.':PTA.idx?'Checking the Pokédex…':'No Pokédex loaded.'}</span>`}
      <button class="btn sm" data-act="slot" data-uid="${uid}" data-pid="${pid}">${boxed?'Move to the party':'Move to the box'}</button>
      <button class="btn sm ghost" data-act="gd_mon" data-uid="${uid}" data-pid="${pid}">Open its page</button></div>`:''}
  </li>`;
}
function dashPcCard(uid){
  const t=S.trainers[uid],party=partyOf(uid),box=boxOf(uid),bo=dashIsOpen('b'+uid);
  const g=onGym(t)?rkWith('gym',()=>rkRows().find(x=>x.id===uid)):null,c=onCon(t)?rkWith('con',()=>rkRows().find(x=>x.id===uid)):null;
  const facts=[['Level',Math.round(num(t.level))||1],['HP',t.hp&&num(t.hp.max)?num(t.hp.cur)+'/'+num(t.hp.max):'—'],['Credits',fmtP(t.credits)],['Badges',badgeCount(t)],['Ribbons',ribCount(t)],
    ['Gym rank',g?'#'+g.pos:'—'],['Contest rank',c?'#'+c.pos:'—']];
  return h`<article class="dashpc"><div class="row sp"><h3>${tName(t)}</h3><span class="row"><button class="btn sm" data-act="gd_rest" data-v="${uid}">Rest 8h</button><button class="btn sm" data-act="gd_heal" data-v="${uid}">Pokémon Center</button><button class="btn sm ghost" data-act="gd_sheet" data-v="${uid}">Sheet</button></span></div>
    <dl class="dashfacts">${facts.map(([k,v])=>h`<div><dt>${k}</dt><dd>${v}</dd></div>`)}</dl>
    ${party.length?h`<ul class="dashmons">${party.map(m=>dashMonRow(uid,m))}</ul>`:h`<p class="sub">No Pokémon in the party.</p>`}
    ${box.length?h`<button class="btn sm ghost dashboxbtn" data-act="gd_open" data-v="${'b'+uid}" aria-expanded="${String(bo)}">${bo?'Hide the box':'The box ('+box.length+')'}</button>
      ${bo?h`<ul class="dashmons boxed">${box.map(m=>dashMonRow(uid,m))}</ul>`:''}`:''}
  </article>`;
}
/* the trip and road battles, folded to one line each unless opened */
function dashTripHtml(){
  const t=clTrip();
  if(!t)return h`<section class="panel dash" id="dashtrip"><div class="ph"><h2>On the road</h2></div><p class="sub">No trip is running. Plan one on the Map page.</p><div class="row"><button class="btn sm ghost" data-act="tab" data-tab="map">Open the Map</button></div></section>`;
  const op=dashIsOpen('trip');
  if(op)return h`<div class="dashfold" id="dashtrip"><button class="btn sm ghost" data-act="gd_open" data-v="trip" aria-expanded="true">Fold the trip</button></div>${clTripPanel()}`;
  const tot=t.steps.reduce((a,s)=>a+num(s.days),0)||1,gone=t.done?tot:t.steps.slice(0,t.pos).reduce((a,s)=>a+num(s.days),0)+num(t.into);
  const last=t.log.length?clDayFull(t,t.log[t.log.length-1]):null,today=clToday()||'',rolled=!!today&&t.log.some(e=>e.date===today);
  return h`<section class="panel dash" id="dashtrip"><div class="ph"><h2>On the road</h2><button class="btn sm ghost" data-act="gd_open" data-v="trip" aria-expanded="false">Show the full trip</button></div>
    <p><b>${trName(t.from)} to ${trName(t.to)}</b> · ${t.done?'arrived':'day '+t.day} · ${(RDB_ZONES.find(z=>z[0]===rdbZone())||['',''])[1]}</p>
    <progress class="dashprog" max="${tot}" value="${Math.min(tot,gone)}" aria-label="Trip progress"></progress>
    ${last?h`<p class="sub">Last rolled, day ${last.n}: ${[last.wx,last.at,last.enc?(last.enc+((last.sp||[]).length?': '+last.sp.join(', '):'')):'',last.ev||''].filter(Boolean).join(' · ')}</p>`:h`<p class="sub">No days rolled yet.</p>`}
    ${t.done?'':h`<div class="row"><button class="btn sm ${rolled?'':'primary'}" data-act="cl_roll">${rolled?'Roll another day':'Roll the day'}</button></div>`}
  </section>`;
}
function dashRoadHtml(){
  const cur=rdbCur(),today=clToday()||'',t=clTrip();
  const op=dashIsOpen('road');
  if(op)return h`<div class="dashfold" id="dashroad"><button class="btn sm ghost" data-act="gd_open" data-v="road" aria-expanded="true">Fold road battles</button></div>${rdbPanel()}`;
  const fl=fs=>fs.map(f=>f.name+' ('+(f.st==='open'?'waiting':f.st==='no'?(rdbIsGym(f)?'called off':'declined'):rdbResName(f.fight&&f.fight.res).toLowerCase())+')').join(', ');
  const P=rdbParty(),when=cur?(cur.date===today?'Today':cur.date?clNice(cur.date):'Last roll'):'';
  const line=!cur?'Not rolled yet.':cur.gymOnly?when+', Gym battles: '+fl(cur.foes)+'.':when+': d6 '+cur.d6+', '+(cur.foes.length?fl(cur.foes):'nobody challenged the party')+'.';
  return h`<section class="panel dash" id="dashroad"><div class="ph"><h2>Road battles</h2><button class="btn sm ghost" data-act="gd_open" data-v="road" aria-expanded="false">Show road battles</button></div>
    <p>${line}</p>
    <div class="row"><button class="btn sm" data-act="rdb_roll" ${P?'':raw('disabled')}>Roll for trainers</button>${P?'':h`<span class="sub">Start a trip, or open road battles to pick where the party is.</span>`}</div>
  </section>`;
}
function dashTab(){
  if(!S.me.admin)return '';
  const today=clToday()||'',c=cdGet(),pcs=dashPcs(),t=clTrip(),u=S.ui.gd;
  const eggs=dashEggs().slice().sort((a,b)=>dashEggLeft(a)-dashEggLeft(b)),todo=dashTodo();
  const armed=S.ui.confirm==='gd_heal',q=grQ().length;
  const drafts={gym:rkWith('gym',()=>rkHeads().filter(x=>!x.pub).length),con:rkWith('con',()=>rkHeads().filter(x=>!x.pub).length)};
  const wk={gym:rkWith('gym',()=>num(rkB().wk)),con:rkWith('con',()=>num(rkB().wk))};
  return h`<section class="panel dash" id="dashtop"><div class="ph"><h2>${today?clNice(today,{y:true}):'No date set'}</h2><span class="pill gm">GM only</span></div>
      <p class="dashnow">${[CD_LAB[c.t],CD_LAB[c.x],CD_LAB[c.s],CD_LAB[c.m],CD_LAB[c.d]].filter(Boolean).join(' · ')}${t&&!t.done?' · On the road to '+trName(t.to)+', day '+t.day:''}</p>
      <div class="dashgrps">
        <div class="dashgrp" role="group" aria-label="Time"><span class="fl">Time</span><span class="row"><button class="btn primary sm" data-act="gd_next">Start the next day</button><button class="btn sm" data-act="gd_adv">Next time of day</button><button class="btn sm" data-act="gd_wx">Roll the weather</button></span></div>
        <div class="dashgrp" role="group" aria-label="Party care"><span class="fl">Party care</span><span class="row"><button class="btn sm" data-act="gd_rest" data-v="all">Rest everyone</button><button class="btn sm ${armed?'danger armed':''}" data-act="gd_heal" data-v="all">${armed?'Tap again to heal everyone':'Pokémon Center: everyone'}</button></span></div>
        <div class="dashgrp" role="group" aria-label="Weekly"><span class="fl">Weekly</span><span class="row"><button class="btn sm" data-act="gd_week" data-v="gym">Run the Gym week</button><button class="btn sm" data-act="gd_week" data-v="con">Run the Contest week</button></span></div>
      </div>
    </section>
    ${dashTodayHtml()}
    <section class="panel dash"><div class="ph"><h2>The party</h2></div>
      ${pcs.length?h`<div class="dashpcs">${pcs.map(dashPcCard)}</div><p class="sub">HP boxes take a change like −9 or +5, or a new total. Press a move to spend a daily use.</p>`:h`<p class="sub">No trainers yet.</p>`}</section>
    ${dashTripHtml()}
    ${dashRoadHtml()}
    <section class="panel dash" id="dashweek"><div class="ph"><h2>Weekly</h2></div>
      <div class="row"><label class="fld"><span class="fl">Rankings day</span><select data-gdwd="1" aria-label="Rankings day">${DASH_WD.map((n,i)=>h`<option value="${i}" ${i===dashWd()?raw('selected'):''}>${n}</option>`)}</select></label></div>
      <ul class="dashrem">${[['gym','Gym'],['con','Contest']].map(([b,l])=>{const last=(dashG().wk||{})[b];return h`<li><span><b>${l} circuit</b>, week ${wk[b]}. ${last&&clParse(last)?'Last run '+clNice(last)+'.':'Not run from here yet.'}${drafts[b]?' '+drafts[b]+' headline draft'+(drafts[b]===1?'':'s')+'.':''}</span>
        <span class="row">${drafts[b]?h`<button class="btn sm" data-act="gd_hpub" data-v="${b}">Publish headlines</button>`:''}</span></li>`;})}
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
