'use strict';
/* Sinnoh Trainer Log · 10-calendar-main. The files in js/ are classic scripts that share one scope: load them in order (see index.html). */
/* ---------- Calendar and the daily travel roll ----------
   The in-game date lives with the shared conditions (meta/conditions: "date", "start", "ev" for events, "trip" for the journey
   under way), which every member reads and only the GM writes. When the GM sets the date or moves to the next day, the season
   and the moon follow it, so the Today strip, the wild encounter odds and the seasonal route limits all follow the calendar.
   A trip is a planned way from the travel planner. Each "Roll the day" moves the party one day along it: it rolls the weather
   for the season, checks for a wild encounter on the route (using the GM's encounter table when the route has one) and rolls
   a road event. Everything rolled goes into the trip's log, which the GM can copy into the journal. */
S.ui.cl=Object.assign({view:'',sel:'',date:'',start:'',en:'',ed:'',ey:false,ep:''},S.ui.cl||{});
const CL_YEAR='3000';
const CL_MON=['January','February','March','April','May','June','July','August','September','October','November','December'];
const CL_WD=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const clParse=s=>{const m=/^(\d{1,5})-(\d{2})-(\d{2})$/.exec(String(s||''));if(!m)return null;const d=new Date(Date.UTC(+m[1],+m[2]-1,+m[3]));return isNaN(d)?null:d;};
const clFmt=d=>d.getUTCFullYear()+'-'+String(d.getUTCMonth()+1).padStart(2,'0')+'-'+String(d.getUTCDate()).padStart(2,'0');
const clAdd=(s,n)=>{const d=clParse(s);if(!d)return '';d.setUTCDate(d.getUTCDate()+n);return clFmt(d);};
const clDiff=(a,b)=>{const x=clParse(a),y=clParse(b);return x&&y?Math.round((y-x)/864e5):0;};
const clNice=(s,o)=>{const d=clParse(s);if(!d)return '';return (o&&o.wd===false?'':CL_WD[d.getUTCDay()]+' ')+d.getUTCDate()+' '+CL_MON[d.getUTCMonth()]+(o&&o.y?' '+d.getUTCFullYear():'');};
function clSeason(s){const d=clParse(s);if(!d)return '';const m=d.getUTCMonth();return m<2||m===11?'winter':m<5?'spring':m<8?'summer':'autumn';}
function clMoon(s){
  const d=clParse(s);if(!d)return '';
  const age=(((d-Date.UTC(2000,0,6))/864e5)%29.530588+29.530588)%29.530588;
  return age<1.8||age>27.7?'new':age<12.9?'waxing':age<16.6?'full':'waning';
}
const clToday=()=>{const c=S.cond||{};return clParse(c.date)?c.date:'';};
const clStart=()=>{const c=S.cond||{};return clParse(c.start)?c.start:clToday();};
const clDayNo=s=>s&&clStart()?clDiff(clStart(),s)+1:0;
const clIsConf=e=>/conference/i.test(e.n)&&!/registration|closed|gyms/i.test(e.n);
const clIsFest=e=>/grand festival/i.test(e.n);
const clEvents=()=>{const c=S.cond||{};return Array.isArray(c.ev)?c.ev.filter(e=>e&&e.n&&clParse(e.d)):[];};
function clNth(y,m,n,wd){
  if(n>0){const f=new Date(Date.UTC(y,m,1)),day=1+((wd-f.getUTCDay()+7)%7)+(n-1)*7;return day>new Date(Date.UTC(y,m+1,0)).getUTCDate()?null:new Date(Date.UTC(y,m,day));}
  const l=new Date(Date.UTC(y,m+1,0));return new Date(Date.UTC(y,m,l.getUTCDate()-((l.getUTCDay()-wd+7)%7)));
}
function clMonthlyOn(r,d){
  for(let back=0;back<2;back++){
    const y=d.getUTCFullYear(),m=d.getUTCMonth()-back,yy=y+Math.floor(m/12),mm=((m%12)+12)%12;
    if(r.mo&&r.mo.indexOf(mm+1)<0)continue;
    const st=clNth(yy,mm,r.n,r.wd);
    if(st&&d>=st&&(d-st)/864e5<(r.len||1))return true;
  }
  return false;
}
function clEventsOn(s){
  const d=clParse(s);if(!d)return [];
  return clEvents().filter(e=>{
    if(e.mr)return clMonthlyOn(e.mr,d);
    const x=clParse(e.d),end=e.to&&clParse(e.to)?clParse(e.to):x;
    if(e.y){const md=v=>v.getUTCMonth()*40+v.getUTCDate(),k=md(d);return md(x)<=md(end)?k>=md(x)&&k<=md(end):k>=md(x)||k<=md(end);}
    return d>=x&&d<=end;
  });
}
/* ferries by the calendar: which sail on a given date */
const CL_SAIL={
  'the Ironwright: Mon, Wed and Fri at dawn':d=>[1,3,5].indexOf(d.getUTCDay())>=0,
  'the Badge Ferry, alternate days':d=>Math.floor(d/864e5)%2===0,
  'the freighter Gannet, three times a week':d=>[2,4,6].indexOf(d.getUTCDay())>=0,
  'the Valerian, Conference season only':d=>clEventsOn(clFmt(d)).some(clIsConf),
  'seasonal ferry':d=>clSeason(clFmt(d))==='summer'
};
const clSails=(sea,s)=>{const d=clParse(s);if(!d)return true;const f=CL_SAIL[sea[3]];return f?f(d):true;};
function clSailingsOn(s){return TR_SEA.filter(x=>CL_SAIL[x[3]]&&clSails(x,s)).map(x=>x[3].split(':')[0].replace(/^the /,'The ')+' ('+trName(x[0])+' and '+trName(x[1])+')');}
/* the seasonal route limits follow the conditions */
function clSeasonalOn(route){
  const c=cdGet();
  if(route==='route-228')return c.x==='blizzard';
  if(route==='route-229')return c.s==='winter';
  if(route==='route-239')return c.s==='spring';
  return true;
}
/* set the date: season and moon follow */
function clSetDate(s,o){
  if(!S.me.admin||!clParse(s))return;
  edit('cd','conditions','date',s);
  if(!clParse((S.cond||{}).start))edit('cd','conditions','start',s);
  edit('cd','conditions','s',clSeason(s));
  edit('cd','conditions','m',clMoon(s));
  let x=cdGet().x;
  if(o&&o.dawn){x=cdWeatherRoll(clSeason(s));edit('cd','conditions','t','dawn');edit('cd','conditions','x',x);edit('cd','conditions','d',Math.random()<0.5?'high':'low');}
  cdChanged();
  return x;
}

/* ----- road events: d20, read with the route's danger ----- */
const CL_EVENTS=[
  [1,'A washed-out stretch or a fallen tree. The detour costs half a day.',0.5],
  [2,'A Ranger patrol stops the party, checks licenses and shares the road conditions ahead.'],
  [3,'Another trainer on the road asks for a battle.'],
  [4,'A traveling merchant: roll a few items from the nearest town\'s shop at +10%.'],
  [5,'A lost or injured wild Pokémon by the path. Helping it takes an hour or two.'],
  [6,'An abandoned camp: a little food, a used Potion, and tracks leading off the trail.'],
  [7,'Good ground and a tailwind. The party makes up half a day.',-0.5],
  [8,'A courier, a cart or a coach passes. Someone has news from the next town.'],
  [9,'A sighting: something rare at a distance. A Nature check tells what it was.'],
  [10,'Rival tracks: somebody passed this way a day ahead.'],
  [11,'A territorial wild Pokémon blocks the path and must be calmed, driven off or avoided.'],
  [12,'Supplies spoil or go missing overnight. The next town looks very good.'],
  [13,'A Route House or campsite with good company: a story, a rumor or a lead.']
];
function clRoadEvent(danger){
  const r=encRand(1,20);
  if(r<=7)return {r,txt:'',d:0};
  const pool=CL_EVENTS.filter(e=>danger>=3||e[0]!==11);
  const e=pool[(r+danger*3)%pool.length];
  return {r,txt:e[1],d:e[2]||0};
}

/* ----- the trip ----- */
const clTrip=()=>{const t=(S.cond||{}).trip;return t&&Array.isArray(t.steps)&&t.steps.length?t:null;};
function clTripFromPlan(){
  const u=S.ui.tp,who=trWho(),cl=who?clrOf(S.trainers[who]):null;
  const path=trPath(u.from,u.to,u.pace,cl,u.avoid);
  if(!path)return null;
  const m=TR_PACE[u.pace][0];
  const steps=path.map(e=>{
    if(e.sea)return {sea:1,a:e.a,b:e.b,h:e.sea[2],boat:e.sea[3],days:Math.max(1,Math.ceil(e.sea[2]/24))};
    const l=e.leg;
    return {r:l[0],a:e.a,b:e.b,n:l[6]||'',t:l[5],days:Math.max(0.5,Math.round(trMid(l)*TRAVEL_SCALE*m*2)/2)};
  });
  return {from:u.from,to:u.to,pace:u.pace,who,steps,pos:0,into:0,day:0,start:clToday(),log:[],done:false};
}
function clRollDay(){
  const T=clTrip();if(!T||T.done||!S.me.admin)return;
  const t=JSON.parse(JSON.stringify(T));
  let date=clToday(),x;
  if(date&&t.day>0){date=clAdd(date,1);x=clSetDate(date,{dawn:true});}
  else if(date)x=cdGet().x;
  else{x=cdWeatherRoll(cdGet().s);edit('cd','conditions','x',x);edit('cd','conditions','t','dawn');cdChanged();}
  t.day+=1;
  const st=t.steps[t.pos];
  const entry={n:t.day,date:date||'',wx:CD_LAB[x]||'',at:'',prog:'',enc:'',sp:[],ev:'',push:t.pace==='push'};
  if(st.sea){
    const ok=!date||clSails({3:st.boat},date)||t.into>0;
    entry.at='At sea: '+trName(st.a)+' to '+trName(st.b);
    if(!ok){entry.at='Waiting in '+trName(st.a)+' for '+st.boat.split(':')[0];entry.prog='No sailing today.';}
    else{t.into+=1;entry.prog=st.h+' hours aboard '+st.boat.split(':')[0]+'.';if(t.into>=st.days){t.pos+=1;t.into=0;}}
  }else{
    const f=PD_BY[st.r],dg=f?((String(plFact(f,'Danger')).match(/★+/)||[''])[0]).length:1;
    const zr=ZN_ROUTES[st.r];
    let zn=t.zone==='semi'||t.zone==='off'?t.zone:'road';
    if(zn!=='road'&&!zr)zn='road';
    if(zn==='off'&&zr&&!zr[2]){zn='semi';entry.prog='No off-route left here: the party keeps to the semi-route.';}
    let move=zn==='semi'?0.5:zn==='off'?1/3:1;
    if(x==='blizzard'&&st.t>=2){move=0;entry.prog='The blizzard pins the party down: no progress today.';}
    else if(x==='storm'&&st.t>=3){move=move*0.5;entry.prog='The storm halves the day\'s progress.';}
    const ev=clRoadEvent(dg);
    if(ev.txt){entry.ev=ev.txt;move=Math.max(0,move-ev.d);}
    entry.at=(f?f.name:st.r)+(st.n?' ('+st.n+')':'')+' toward '+trName(st.b);
    const chance=Math.min(0.7,(0.1+0.08*dg)*(t.pace==='careful'?0.75:t.pace==='push'?1.15:1)*(zn==='semi'?0.85:zn==='off'?0.7:1));
    if(zn!=='road')entry.zone=zn;
    if(Math.random()<chance){
      const tabs=encTabs(st.r),want=zn==='semi'?'Semi-route':zn==='off'?'Off-route':'',tab=want?tabs.find(x=>x.nm===want):tabs[0],T0=tab&&tab.T;
      if(T0&&encRows(T0).filter(encOk).length){
        const r=encRollRef(st.r,tab.k,'enc');
        if(r.none)entry.enc='Something stirred, but: '+r.why;
        else{entry.enc='Wild encounter';entry.sp=r.lines.map(L=>(L.n>1?L.n+'× ':'')+L.sp+(L.a?' (alpha)':''));}
      }else entry.enc='Wild encounter (this route has no '+(want?want.toLowerCase()+' ':'')+'encounter table yet)';
    }
    t.into+=move;
    const left=st.days-t.into;
    if(left<=0){
      entry.prog=(entry.prog?entry.prog+' ':'')+'Reached '+trName(st.b)+'.';
      const carry=-left;t.pos+=1;t.into=0;
      if(carry>0&&t.steps[t.pos]&&!t.steps[t.pos].sea)t.into=carry;
    }else if(!entry.prog||move>0)entry.prog=(entry.prog?entry.prog+' ':'')+'About '+(Math.round(left*2)/2)+(left===1?' day':' days')+' left on this stretch.';
  }
  if(t.pos>=t.steps.length){t.done=true;entry.prog=entry.prog.replace('Reached '+trName(t.to)+'.','').trim();entry.prog=(entry.prog?entry.prog+' ':'')+'Arrived at '+trName(t.to)+'.';}
  if(!st.sea&&Math.random()<0.12){const pool=rkRoadPool();if(pool.length){const r=pool[Math.floor(Math.random()*pool.length)];entry.riv={id:r.id,c:r.c,n:r.name,txt:r.name+' ('+(r.c==='con'?'Contest':'Gym')+' circuit #'+r.pos+', '+r.rec+')'};}}
  t.log=t.log.concat([entry]).slice(-120);
  edit('cd','conditions','trip',t);
  render();
}
function clTripText(t){
  return t.log.map(e=>'Day '+e.n+(e.date?' ('+clNice(e.date)+')':'')+': '+e.at+'. '+e.wx+'. '+e.prog+(e.enc?' '+e.enc+(e.sp.length?': '+e.sp.join(', '):'')+'.':'')+(e.ev?' '+e.ev:'')+(e.riv?' On the road: '+e.riv.txt+'.':'')+(e.push?' Pushed: Constitution check.':'')+(e.zone?' ('+(e.zone==='semi'?'semi-route':'off-route')+')':'')).join('\n');
}
function clTripPanel(){
  const t=clTrip();if(!t)return '';
  const gm=!!S.me.admin,last=t.log.slice(-8).reverse();
  const total=t.steps.reduce((a,s)=>a+s.days,0);
  const doneDays=t.steps.slice(0,t.pos).reduce((a,s)=>a+s.days,0)+t.into;
  return h`<section class="panel"><div class="ph"><h2>On the road</h2><span class="sub">${trName(t.from)} to ${trName(t.to)} · ${TR_PACE[t.pace][1]} pace · day ${t.day}</span></div>
    <div class="rbar" role="img" aria-label="${Math.round(100*doneDays/Math.max(total,1))}% of the way"><i ${raw('style="width:'+Math.min(100,Math.round(100*doneDays/Math.max(total,1)))+'%"')}></i></div>
    ${t.done?h`<p><b>Arrived at ${trName(t.to)}</b> after ${t.day} ${t.day===1?'day':'days'}.</p>`:''}
    ${last.length?h`<ol class="tplog">${last.map(e=>h`<li><b>Day ${e.n}${e.date?h` · ${clNice(e.date)}`:''}</b> <span class="sub">${e.wx}</span><div>${e.at}. ${e.prog}</div>
      ${e.enc?h`<div class="tpenc">${e.enc}${gm&&e.sp.length?': '+e.sp.join(', '):''}</div>`:''}${e.ev?h`<div>${e.ev}</div>`:''}${gm&&e.riv?h`<div class="tpenc">On the road: ${e.riv.txt}. <button class="btn sm ghost" data-act="rk_goto" data-c="${e.riv.c}" data-id="${e.riv.id}">Open their card</button></div>`:''}${e.push?h`<div class="sub">Pushed: every trainer makes a Constitution check tonight.</div>`:''}${e.zone==='semi'?h`<div class="sub">Semi-route: Nature 12 to keep the heading; Perception 13 before any encounter.</div>`:e.zone==='off'?h`<div class="sub">Off-route: Nature 16 twice today; Perception 16 on watch; Insight or Pokémon Handling 17 before any fight; Constitution 14 tonight without a proper camp.</div>`:''}</li>`)}</ol>`
      :h`<p class="sub">${gm?'Roll the first day when the party sets out.':'The party is about to set out.'}</p>`}
    ${gm&&!t.done?h`<div class="row"><span class="fl">Where the party travels</span><span class="seg" role="group" aria-label="Zone">${[['road','On the road'],['semi','Semi-route'],['off','Off-route']].map(([v,l])=>h`<button data-act="zn_zone" data-v="${v}" aria-pressed="${String((t.zone||'road')===v)}">${l}</button>`)}</span></div>`:''}
    ${gm?h`<div class="row">${t.done?'':h`<button class="btn primary sm" data-act="cl_roll">Roll the day</button>`}<button class="btn sm" data-act="cl_journal" ${t.log.length?'':raw('disabled')}>Copy the log to the journal</button><button class="btn sm ghost" data-act="cl_end">${t.done?'Clear the trip':'Abandon the trip'}</button></div>
      <p class="sub">Each roll moves the party one day: weather for the season, a wild encounter check from the route's danger (and its table), and a road event. Wild Pokémon names show only to you.</p>`:''}
  </section>`;
}

/* ----- event categories, filters and sorting ----- */
const CL_CATS=[['league','League'],['contest','Contests'],['festival','Festivals'],['season','Seasons and nature'],['other','Other']];
function clCatOf(e){
  if(e.c&&CL_CATS.some(c=>c[0]===e.c))return e.c;
  const n=String(e.n||'');
  if(e.mr||/contest|cup\b|qualifier|grand festival|appeal/i.test(n))return 'contest';
  if(/conference|gym|registration|ladder finals|cohort|trainer school|route \d|marker poles/i.test(n))return 'league';
  if(e.bg||/gracidea bloom|ski season|spring launch|hoppip/i.test(n))return 'season';
  if(e.y&&/festival|fair|night|walk|rumble|burned|equinox|harvest|vigil/i.test(n))return 'festival';
  return 'other';
}
S.ui.clf=Object.assign({cats:{},q:'',sort:'date'},S.ui.clf||{});
const clCatOn=e=>{const on=S.ui.clf.cats;return !Object.keys(on).some(k=>on[k])||!!on[clCatOf(e)];};
function clFilterBar(){
  const f=S.ui.clf,ev=clEvents(),cnt=k=>ev.filter(e=>clCatOf(e)===k).length;
  return h`<div class="calfilt">
    <div class="row evchips" role="group" aria-label="Show categories">${CL_CATS.filter(c=>cnt(c[0])).map(([k,l])=>h`<button class="chip enchip" data-act="cl_cat" data-v="${k}" aria-pressed="${String(!!f.cats[k])}">${l} <span class="mono">${cnt(k)}</span></button>`)}${Object.keys(f.cats).some(k=>f.cats[k])?h`<button class="lnk" data-act="cl_catall">Show all</button>`:''}</div>
    <div class="fgrid"><label class="fld"><span class="fl">Search</span><input type="search" data-u="clf.q" value="${f.q}" placeholder="Name or place" data-nr></label>
      <label class="fld"><span class="fl">Sort by</span><select data-u="clf.sort">${[['date','Date in the year'],['cat','Category'],['name','Name'],['place','Place']].map(([v,l])=>h`<option value="${v}" ${v===f.sort?raw('selected'):''}>${l}</option>`)}</select></label></div>
    <p class="sub">The categories you pick also filter the calendar above.</p></div>`;
}
function clListHtml(){
  const f=S.ui.clf,gm=!!S.me.admin,q=String(f.q||'').trim().toLowerCase();
  const plN=e=>e.pl&&PD_BY[e.pl]?PD_BY[e.pl].name:'';
  let list=clEvents().filter(clCatOn).filter(e=>!q||(e.n+' '+plN(e)).toLowerCase().indexOf(q)>=0);
  const byDate=(a,b)=>(a.mr?1:0)-(b.mr?1:0)||a.d.slice(5).localeCompare(b.d.slice(5));
  const sorters={date:byDate,name:(a,b)=>a.n.localeCompare(b.n),place:(a,b)=>(plN(a)||'~').localeCompare(plN(b)||'~')||byDate(a,b),cat:(a,b)=>CL_CATS.findIndex(c=>c[0]===clCatOf(a))-CL_CATS.findIndex(c=>c[0]===clCatOf(b))||byDate(a,b)};
  list=list.slice().sort(sorters[f.sort]||byDate);
  if(!list.length)return h`<p class="sub">No events match.</p>`;
  const row=e=>h`<li><span><b>${e.n}</b> <span class="sub">${e.mr?(e.sched||'every month'):h`${clNice(e.d,{wd:false,y:!e.y})}${e.to?' to '+clNice(e.to,{wd:false,y:!e.y}):''}${e.y?' · every year':''}`}${e.bg?' · season':''}${plN(e)?' · '+plN(e):''}</span></span>
    <span class="row">${f.sort==='cat'?'':h`<span class="pill">${(CL_CATS.find(c=>c[0]===clCatOf(e))||[0,''])[1]}</span>`}${gm?h`<select class="clcatsel" data-clcat="${e.k}" aria-label="Category for ${e.n}">${CL_CATS.map(([k,l])=>h`<option value="${k}" ${k===clCatOf(e)?raw('selected'):''}>${l}</option>`)}</select><button class="btn sm ghost" data-act="cl_evdel" data-v="${e.k}">Remove</button>`:''}</span></li>`;
  if(f.sort==='cat')return h`${CL_CATS.filter(c=>list.some(e=>clCatOf(e)===c[0])).map(([k,l])=>h`<h3 class="calcat">${l}</h3><ul class="calev">${list.filter(e=>clCatOf(e)===k).map(row)}</ul>`)}`;
  return h`<ul class="calev">${list.map(row)}</ul>`;
}
function clListRefresh(){const el=document.getElementById('callist');if(el)el.innerHTML=clListHtml().s;}
/* ----- the Calendar page ----- */
/* Sinnoh's yearly calendar: [name, start MM-DD, end MM-DD, place id, long season (shown on the day, not in the grid)] */
const CL_PRESET=[
  ['Spring Flower Festival','03-20','03-22','floaroma-town'],
  ['Spring Launch (the Hoppip release)','04-10','','dandelion-island'],
  ['Rainy Day Rumble','04-18','','pastoria-city'],
  ['The Gift Walk','04-25','','lucario-kingdom'],
  ['Wool Fair','05-03','05-04','alamos-town'],
  ['Gracidea bloom','05-10','05-31','gracidea-flower-garden',1],
  ['Conference registration closes','05-13','','lily-of-the-valley-conference'],
  ['Gratitude Festival','05-17','05-18','emeragrove-town'],
  ['Gyms closed for the Conference','06-10','06-24','',1],
  ['Lily of the Valley Conference','06-13','06-21','lily-of-the-valley-conference'],
  ['Survival Area summer cohorts','06-01','08-31','battle-resort-survival-area',1],
  ['Lantern Terraces summer festival','07-15','07-17','floaroma-flower-fields'],
  ['Wallace Cup','07-25','07-26','valor-lakefront-and-grand-festival'],
  ['Millhall Qualifier (Valor Circuit 1)','08-15','','arrowroot-town'],
  ['Ladder Finals','08-20','08-23','battle-resort-fight-area'],
  ['Greenhouse Hall Qualifier (Valor Circuit 2)','08-25','','brussel-town'],
  ['Trainer school year starts','09-01','','sandgem-town'],
  ['Crossroads Qualifier (Valor Circuit 3)','09-04','','neighborly-town'],
  ['Sunrise Hall final qualifier (Valor Circuit 4)','09-12','','daybreak-town'],
  ['Grand Festival (Festival Week)','09-18','09-21','valor-lakefront-and-grand-festival'],
  ['Equinox lamp-setting','09-22','','michina-town'],
  ['Weighing Hall harvest','10-01','10-03','arrowroot-town'],
  ['Forge Fair (Fuego Ironworks)','10-08','10-09',''],
  ['Squall Night','10-15','','squallville'],
  ['Eterna Lantern Walk','10-24','10-26','eterna-city'],
  ['Route 217 marker poles replaced','10-27','10-31','route-217'],
  ['The Sleeper is burned','12-21','','sandalstraw-town'],
  ['Midwinter Appeal Cup','12-23','','snowpoint-city'],
  ['Ski season','12-01','03-31','snowpoint-city',1],
  ['Frost Festival','01-08','01-11','snowpoint-city'],
  ['Winter Bloom lantern festival','02-01','02-07','camellia-town'],
  ['Lily Cup','02-14','02-15','lilypad-town'],
  ['The Vigil','02-20','','acuity-lakefront'],
  ['Celestic Heritage Contest, spring (Beauty)','03-20','','celestic-town'],
  ['Celestic Heritage Contest, summer (Beauty)','06-21','','celestic-town'],
  ['Celestic Heritage Contest, autumn (Beauty)','09-22','','celestic-town'],
  ['Celestic Heritage Contest, winter (Beauty)','12-21','','celestic-town']
];
/* each hall's monthly contest, for the calendar: [name, hall key] */
const CL_CONTESTS=[['Jubilife contest (Cool)','jubilife'],['Floaroma contest (Cute)','floaroma'],['Hearthome Super Contest (all categories)','hearthome'],
  ['Majolica contest (category changes monthly)','majolica'],['Solaceon contest (any category)','solaceon'],['Sage contest (Clever)','sage'],
  ['Chocovine contest (Cute)','chocovine'],['Sandalstraw contest (Tough)','sandalstraw'],['Lilypad contest (Beauty, Cute)','lilypad'],
  ['Snowpoint contest (Cool)','snowpoint'],['Arrowroot contest (Tough)','arrowroot'],['Brussel contest (Beauty)','brussel'],
  ['Neighborly contest (Clever)','neighborly'],['Daybreak contest (Cool)','daybreak']];
const clAllPresetNames=()=>CL_PRESET.map(p=>p[0]).concat(CL_CONTESTS.map(c=>c[0]));
/* ---------- Circuit rankings ----------
   The Gym circuit and the Contest circuit are televised sports (see the League doc), each with its own board:
   the Gym board counts Ranking Points (RP) in rk/rkb, the Contest board Contest Points (CP) in rkc/rkcb, laid out the same way.
   Kept in meta/conditions, which only the GM can write and everyone at the table can read:
     rk.log  [{k, u, p, w, wk, d, at, e, bt, t}]  one entry per result; u = trainer uid, "n_<k>" rival or "b<i>" field trainer;
                                       wk = the season week it happened; e = what happened; bt = the logged battle it came from;
                                       t:'tier' = a new-standing notice (0 points)
     rk.bt   [{k, a, b, win, kind, w, wk, d, at}]  battles the GM logged (Gym board); a/b may be a Gym, "g_<badge>"
     rk.npc  [{k, n, p, s, h, b}]    tracked rivals: name, last season's points, label, home or note, b = field index they came from
     rk.lab  {uid: label}            the label commentators gave each player;  rk.card {id: {team, seen, mood, notes}}
     rkb     {seed, n, wk, met, gone, hist}  the generated field (rebuilt from the seed), the season week, who the party has met,
                                       field trainers turned into rivals, and each player's place by week.
   Results count in full for 52 weeks and at half until week 78. Players move only by what the GM records; the field and the
   rivals also battle (or enter contests) every week in a simulation replayed from the seed. */
const RK_EVENTS=[['trial','Passed a Gym Trial',5],['badge','Won a Gym badge',25],['gymloss','Lost a Gym challenge',-10],['up','Beat a higher-ranked trainer',10],['down','Beat a lower-ranked trainer',5],['loss','Lost a public battle',-5],['viral','A moment went viral',5],['scandal','Scandal or bad press',-15],['break','Won against their label',10],['other','Something else',0]];
const RK_TIERS=[[300,'Top 10','Headline matches, the Champion’s attention, enemies'],[200,'Top 50','Interviews, agency offers, Ace recruiters watching'],[100,'Top 150','Sponsor offers start; Halfway Cup seeding'],[50,'Ranked','A name on the board; local fans'],[-Infinity,'Unranked rookie','Nothing yet']];
const RK_LABELS=['Aggressor','Defender','Generalist','Trickster','Specialist','Showman'];
const RK_CURVE=[[50,300],[100,150],[200,50],[300,10],[400,1]];
const RK_SAMPLE=[{n:'Mira Castellane',p:260,s:'Aggressor',h:'Ace cadet; last year’s Conference top eight'},{n:'Harper Vance',p:180,s:'Defender',h:'Canalave'},{n:'Tomás Reyes',p:120,s:'Generalist',h:'Hearthome'},{n:'Lena Okabe',p:70,s:'Showman',h:'Jubilife; a coordinator who battles'},{n:'Kit Halloway',p:35,s:'',h:'Twinleaf; a rookie this season'}];
const RK_CEVENTS=[['ribbon','Won a contest ribbon',15],['second','Placed second',10],['final','Reached the final round',5],['early','Out in the first round',-5],['combo','A showstopping combo',5],['festival','Qualified for the Grand Festival',25],['viral','A moment went viral',5],['scandal','Scandal or bad press',-15],['break','Won outside their specialty',10],['other','Something else',0]];
const RK_CTIERS=[[300,'Top 10','Grand Festival favorite; Wallace Cup invitations'],[200,'Top 50','Magazine features, headline slots at the big halls'],[100,'Top 150','Sponsor offers start; Grand Festival seeding'],[50,'Ranked','A name on the board; local fans'],[-Infinity,'Unranked rookie','Nothing yet']];
const RK_CLABELS=['Cool','Beauty','Cute','Clever','Tough','All-rounder'];
const RK_CSAMPLE=[{n:'Celeste Arnaud',p:250,s:'Beauty',h:'Hearthome; last year’s Grand Festival finalist'},{n:'Rory Pendleton',p:160,s:'Cool',h:'Veilstone'},{n:'Lena Okabe',p:110,s:'Clever',h:'Jubilife; a coordinator who battles'},{n:'Mai Takeda',p:80,s:'Cute',h:'Floaroma'},{n:'Jules Ferro',p:30,s:'',h:'Solaceon; a rookie this season'}];
/* the two boards: where each keeps its data, and what it counts */
const RK_C={
  gym:{d:'rk',b:'rkb',unit:'RP',name:'Gym circuit',events:RK_EVENTS,tiers:RK_TIERS,labels:RK_LABELS,sample:RK_SAMPLE,labWord:'Style',def:'badge',
    intro:'Every Gym battle, Trial and public battle on the circuit is broadcast, and Ranking Points decide Conference seeds, sponsors and who the recruiters watch. The League posts the standings weekly.',
    note:'After a trainer’s second Gym, the commentators give them a style label. Rivals and Gym Leaders prepare for it, so winning against type pays.',
    rec:r=>r.bd+' badge'+(r.bd===1?'':'s'),ph:'Beat Gardenia in Eterna',qph:'Veilstone, Defender, Ortega…'},
  con:{d:'rkc',b:'rkcb',unit:'CP',name:'Contest circuit',events:RK_CEVENTS,tiers:RK_CTIERS,labels:RK_CLABELS,sample:RK_CSAMPLE,labWord:'Specialty',def:'ribbon',
    intro:'Every contest at every hall is broadcast too, and Contest Points decide Grand Festival seeds, sponsors and which halls want a coordinator headlining.',
    note:'Commentators tag each coordinator with the category they win in. Judges expect it, so winning outside it pays.',
    rec:r=>r.rb+' ribbon'+(r.rb===1?'':'s'),ph:'Ribbon at the Hearthome Hall',qph:'Hearthome, Beauty, Arnaud…'}
};
const rkC=()=>RK_C[S.ui.rk&&S.ui.rk.c==='con'?'con':'gym'];
const RK_FIRST='Aaron Abigail Adaeze Adrian Aiko Alder Alma Amara Anders Anika Arjun Astrid Aurelio Ayla Basil Beatriz Bennett Bianca Bo Brigid Caleb Camille Carmen Cass Cedric Chiara Cyrus Dahlia Dante Darius Delphine Desmond Dmitri Elena Elias Elif Emeka Esme Ezra Fatima Felix Fern Finn Freya Gabriel Gemma Gideon Greta Hana Hector Helga Ines Ingrid Iolanthe Ivan Jada Jasper Javier Joon Juniper Kai Kamala Kasimir Keira Kenji Kofi Lark Leander Leila Linnea Lorenzo Luca Lucia Mabel Mads Malik Marisol Mateo Maya Mikko Mina Nadia Naveen Nico Nina Noor Odette Olu Orla Oskar Paloma Petra Priya Quentin Quinn Rafael Ravi Rhea Rosalind Rowan Sable Saoirse Sami Selma Silas Sora Stellan Sunniva Talia Tariq Thea Tobias Ulla Valentin Vera Wren Xiomara Yara Yusuf Zara Zeke'.split(' ');
const RK_LAST='Abernathy Achebe Albescu Alvarez Amari Anand Arkwright Asano Bach Balogun Barros Bellamy Bergstrom Blackwood Bosch Brannigan Calloway Castellanos Chandra Corrigan Dahl Delacroix Dorsey Duarte Ekwueme Ellery Esposito Falk Fairweather Ferreira Fitch Galloway Garza Gunnarsson Haddad Halvorsen Hargrove Hayashi Holm Ibarra Ishikawa Iversen Jandali Jovanovic Kalinowski Kamau Kestrel Kowalski Laine Lindqvist Lockhart Lund Macari Mbeki Moreau Nakamura Navarro Nilsen Novak Obi Okonkwo Olsen Ortega Pace Pajari Quill Quintero Rasmussen Reyes Rook Salgado Sato Severin Silva Solberg Strand Sundqvist Takeda Tanaka Thorne Underhill Usman Valdez Vasquez Varga Vick Wainwright Whitlock Winter Yamada Yilmaz Zamora Zhou'.split(' ');
const RK_TOWNS=['Twinleaf','Sandgem','Jubilife','Oreburgh','Floaroma','Eterna','Hearthome','Solaceon','Veilstone','Pastoria','Celestic','Canalave','Snowpoint','Sunyshore','Survival Area','Resort Area','Fight Area','Jubilife','Hearthome','Veilstone','Kanto','Johto','Hoenn','Unova','Kalos'];
const rkHash=(a,b,c)=>{let x=Math.imul(a|0,0x9E3779B1)^Math.imul((b|0)+0x632BE5AB,0x85EBCA77)^Math.imul((c|0)+0x7F4A7C15,0xC2B2AE3D);x^=x>>>16;x=Math.imul(x,0x85EBCA6B);x^=x>>>13;x=Math.imul(x,0xC2B2AE35);x^=x>>>16;x=Math.imul(x^(x>>>15),0x2C1B3C6D);x^=x>>>12;return (x>>>0)/4294967296;};
/* RP for a given place on the board at the start of the season: the inverse of RK_CURVE */
function rkRpAtRank(r){
  const c=RK_CURVE.slice().reverse();
  if(r<=1)return 400;
  for(let i=1;i<c.length;i++){const [pa,ra]=c[i-1],[pb,rb]=c[i];if(r<=rb)return pa+(pb-pa)*(r-ra)/(rb-ra);}
  return 50;
}
/* ----- the season engine -----
   Results count in full for a year (52 weeks), at half for six months more (to week 78), then drop off.
   Field trainers and tracked rivals battle each week (the Contest board: enter contests); every point they gain or lose comes
   from a result, and the whole season is replayed from the seed, so it always adds up and Undo a week is exact.
   A trainer's starting points are last season's results, spread over the 78 weeks before week 0, expiring on the same clock. */
const RK_FULL=52,RK_HALF=78;
const rkWt=age=>age<RK_FULL?1:age<RK_HALF?0.5:0;
function rkPtsAt(res,W){let s=0;for(const r of res){if(num(r.wk)>W)continue;s+=num(r.p)*rkWt(W-num(r.wk));}return Math.round(s);}
const RK_GYMS=BADGES.map((b,i)=>({id:'g_'+b[0],k:b[0],badge:b[1],name:b[2],lvl:i}));
const rkGymSkill=l=>1350+50*l;
/* each Gym's reputation shifts how hard its Leader is for every challenger; the GM can also rename a Leader. Kept in rk.gym */
const RK_REPS=[['easy','Easy',-100],['standard','Standard',0],['tough','Tough',90],['brutal','Brutal',180]];
const rkGymSet=()=>{const g=S.cond&&S.cond.rk&&S.cond.rk.gym;return g||{};};
const rkGymRep=id=>{const r=(rkGymSet()[id]||{}).rep;return RK_REPS.find(x=>x[0]===r)||RK_REPS[1];};
const rkGymName=g=>(rkGymSet()[g.id]||{}).name||g.name;
const RK_BADGE_LIFE=104;
const rkSkillOf=P=>1300+1.5*Math.max(0,P);
const rkWinP=(a,b)=>1/(1+Math.pow(10,(b-a)/400));
const rkStrHash=s=>{let x=7;for(const c of String(s))x=(Math.imul(x,31)+c.charCodeAt(0))|0;return x;};
/* the hidden traits behind one competitor: R(k) is their own steady random number */
function rkTraits(R,P0,rookie){
  const pre=[];
  if(P0>0){
    const wk=[],rr=[];let tot=0;
    for(let j=0;j<5;j++){const w=-(1+Math.floor(R(20+j)*77)),r=0.3+R(30+j);wk.push(w);rr.push(r);tot+=r*rkWt(-w);}
    for(let j=0;j<5;j++)pre.push({wk:wk[j],p:tot?rr[j]*P0/tot:0,pre:1});
  }
  const b0=rookie?0:Math.min(8,Math.floor(P0/20+R(12)*3)),bw=[];
  for(let j=0;j<b0;j++)bw.push(-(1+Math.floor(R(50+j)*(RK_BADGE_LIFE-1))));
  return {P0,pre,skill0:rkSkillOf(P0)+(R(9)-0.5)*120,grow:rookie?1+R(10)*4:-0.5+R(10)*2,act:0.4+R(11)*0.6,b0,bw};
}
const rkFieldMemo={};
function rkGenField(seed,n){
  const C=rkC(),key=C.d+'|'+seed+'|'+n;
  if(rkFieldMemo[key])return rkFieldMemo[key];
  const rookies=Math.round(n*0.2),used={},list=[];
  for(let i=0;i<n;i++){
    const R=k=>rkHash(seed,i,k);
    let nm='';
    for(let t=0;t<6&&(!nm||used[nm]);t++)nm=RK_FIRST[Math.floor(R(1+t*7)*RK_FIRST.length)]+' '+RK_LAST[Math.floor(R(2+t*7)*RK_LAST.length)];
    used[nm]=1;
    const rookie=i>=n-rookies;
    const P0=rookie?Math.floor(R(3)*45):Math.round(rkRpAtRank((i+1)*300/(n-rookies))*(0.92+R(4)*0.16));
    list.push(Object.assign({i,name:nm,home:RK_TOWNS[Math.floor(R(7)*RK_TOWNS.length)],lab:R(6)<0.25?'':C.labels[Math.floor(R(8)*C.labels.length)],sid:i},rkTraits(R,P0,rookie)));
  }
  rkFieldMemo[key]=list;
  return list;
}
/* rivals who are not in the field yet take over the field trainer whose starting points are closest to theirs, so the board
   keeps its size (300 stays 300). Skips field trainers the party has met, written notes on, or recorded results for. */
function rkFold(b){
  const C=RK_C[b],bb=(S.cond&&S.cond[C.b])||{},dd=(S.cond&&S.cond[C.d])||{};
  if(!bb.seed)return 0;
  const was=S.ui.rk.c;S.ui.rk.c=b;
  const field=rkGenField(num(bb.seed),num(bb.n)||300);
  S.ui.rk.c=was;
  const npc=(Array.isArray(dd.npc)?dd.npc:[]).slice(),gone=Object.assign({},bb.gone||{});
  const busy=new Set(Object.keys(gone).map(Number));
  npc.forEach(r=>{if(r.b!=null)busy.add(num(r.b));});
  Object.keys(bb.met||{}).concat(Object.keys(dd.card||{})).forEach(k=>{if(/^b\d+$/.test(k))busy.add(+k.slice(1));});
  (Array.isArray(dd.log)?dd.log:[]).forEach(e=>{if(/^b\d+$/.test(e.u||''))busy.add(+e.u.slice(1));});
  (Array.isArray(dd.bt)?dd.bt:[]).forEach(x=>[x.a,x.b].forEach(v=>{if(/^b\d+$/.test(v||''))busy.add(+String(v).slice(1));}));
  let n=0;
  npc.map((r,j)=>[r,j]).filter(([r])=>r.b==null).sort((x,y)=>num(y[0].p)-num(x[0].p)).forEach(([r,j])=>{
    let best=-1,bd=Infinity;
    field.forEach(g=>{if(busy.has(g.i))return;const dl=Math.abs(num(g.P0)-num(r.p));if(dl<bd){bd=dl;best=g.i;}});
    if(best<0)return;
    busy.add(best);gone[best]=true;npc[j]=Object.assign({},r,{b:best});n++;
  });
  if(n){edit('cd','conditions',C.d,Object.assign({},dd,{npc}));edit('cd','conditions',C.b,Object.assign({},bb,{gone}));}
  return n;
}
function rkGenRival(seed,r){
  const hk=rkStrHash(r.k),R=k=>rkHash(seed^0x5bd1e995,hk,k),P0=num(r.p);
  return Object.assign({sid:100000+(hk&0xffff)},rkTraits(R,P0,P0<50));
}
const rkBattles=()=>Array.isArray(rkD().bt)?rkD().bt:[];
const rkRec=()=>({w:0,l:0,seq:[],h2h:{}});
function rkRecAdd(REC,id,opp,win,kind,wk){
  const r=REC[id]||(REC[id]=rkRec());
  if(win)r.w++;else r.l++;
  r.seq.push({o:opp,win,kind,wk});
  const hh=r.h2h[opp]||(r.h2h[opp]=[0,0]);hh[win?0:1]++;
}
/* ----- rivals paced to the players (Gym board): r.pw = '' (their own season) | 'party' (the party's average badges) | a
   player's id; r.po = -1 behind, 0 even, 1 ahead. Their badge count on the board follows that pace, so their team grows
   with the players. r.pt = 1 just above / -1 just below: each week their points are pulled toward that player's. ----- */
const RK_TETHER=12;
function rkPaceBase(pw){
  if(pw==='party'){const ps=entriesOf(S.trainers).filter(t=>t.name);return ps.length?Math.floor(ps.reduce((a,t)=>a+badgeCount(t),0)/ps.length):0;}
  const t=S.trainers[pw];return t?badgeCount(t):null;
}
function rkPaceBd(r){
  if(!r||!r.pw)return null;
  const b=rkPaceBase(r.pw);
  return b==null?null:clamp(b+clamp(Math.round(num(r.po)),-1,1),0,8);
}
const rkEngMemo={};
function rkEngine(){
  const C=rkC(),gymC=C===RK_C.gym,b=rkB(),W=num(b.wk),seed=num(b.seed)||7,n=b.seed?(num(b.n)||300):0;
  const log=rkLog(),bt=rkBattles(),npcs=rkNpcs(),gone=b.gone||{};
  const paced=gymC?npcs.filter(x=>x.pw).map(x=>[x.k,rkPaceBd(x),x.pt&&S.trainers[x.pw]?x.pw:'',num(x.pt)]):[];
  const key=[C.d,seed,n,W,JSON.stringify(npcs.map(x=>[x.k,x.b,x.p])),JSON.stringify(paced),JSON.stringify(gone),log.length,log.length?log[log.length-1].k:'',bt.length,bt.length?bt[bt.length-1].k:'',JSON.stringify(rkGymSet())].join('|');
  if(rkEngMemo[C.d]&&rkEngMemo[C.d].key===key)return rkEngMemo[C.d].out;
  const field=n?rkGenField(seed,n):[];
  const E={},REC={},CON={};
  const mk=(id,g)=>{const held={};(g.bw||[]).forEach((wk,j)=>{held[j]=wk;});return {id,g,res:g.pre.slice().sort((x,y)=>x.wk-y.wk),held,full:0,half:0,i52:0,i78:0};};
  const nb=e=>Object.keys(e.held).length;
  const UP={};
  field.forEach(g=>{if(!gone[g.i])E['b'+g.i]=mk('b'+g.i,g);});
  npcs.forEach(r=>{const g=r.b!=null&&field[r.b]?field[r.b]:rkGenRival(seed,r);E['n_'+r.k]=mk('n_'+r.k,g);});
  const ents=Object.values(E);
  const byW=(arr)=>{const o={};arr.forEach(e=>{const w=Math.max(0,num(e.wk));(o[w]=o[w]||[]).push(e);});return o;};
  const logW=byW(log.filter(e=>E[e.u])),btW=byW(bt);
  const add=(e,w,p)=>{e.res.push({wk:w,p});e.full+=p;};
  const age=w=>ents.forEach(e=>{
    for(const j in e.held)if(w-e.held[j]>=RK_BADGE_LIFE)delete e.held[j];
    const r=e.res;
    while(e.i52<r.length&&r[e.i52].wk<=w-RK_FULL){e.full-=r[e.i52].p;e.half+=r[e.i52].p;e.i52++;}
    while(e.i78<r.length&&r[e.i78].wk<=w-RK_HALF){e.half-=r[e.i78].p;e.i78++;}
  });
  const pts=e=>e.full+0.5*e.half;
  const skill=(e,w)=>e.g.skill0+e.g.grow*w;
  const R=(e,w,k)=>rkHash(seed+(gymC?0:977),e.g.sid*131+k,w);
  const con=id=>CON[id]||(CON[id]={e:0,r:0,s:0,f:0,seq:[]});
  const endOfWeek=w=>{
    (logW[w]||[]).forEach(x=>add(E[x.u],w,num(x.p)));
    if(gymC)(btW[w]||[]).forEach(x=>{if(x.kind==='trial')return;const aw=x.win==='a';rkRecAdd(REC,x.a,x.b,aw,x.kind,w);rkRecAdd(REC,x.b,x.a,!aw,x.kind,w);});
    if(!gymC)(logW[w]||[]).concat((log.filter(e=>!E[e.u]&&Math.max(0,num(e.wk))===w))).forEach(x=>{
      const pl={ribbon:1,second:2,final:4,early:8}[x.e];if(!pl)return;
      const c=con(x.u);c.e++;if(pl===1)c.r++;if(pl===2)c.s++;if(pl<=4)c.f++;c.seq.push({pl,wk:w});});
  };
  ents.forEach(e=>{e.res.forEach(r=>{e.full+=r.p;});});
  age(0);endOfWeek(0);
  for(let w=1;w<=W;w++){
    age(w);
    const order=ents.slice().sort((x,y)=>pts(y)-pts(x)||x.id.localeCompare(y.id));
    const pos={};order.forEach((e,i)=>{pos[e.id]=i;});
    if(gymC){
      order.forEach(e=>{
        const n0=nb(e);
        if(n0>=8||R(e,w,1)>=0.2)return;
        let gi=0;while(e.held[gi]!=null)gi++;
        const gym=RK_GYMS[gi],s=skill(e,w),gs=rkGymSkill(n0)+rkGymRep(gym.id)[2];
        if(R(e,w,2)>=rkWinP(s,gs-150))return;
        add(e,w,5);
        const win=R(e,w,3)<rkWinP(s,gs);
        add(e,w,win?25:-10);if(win)e.held[gi]=w;
        rkRecAdd(REC,e.id,gym.id,win,'gym',w);rkRecAdd(REC,gym.id,e.id,!win,'gym',w);
      });
      for(let rd=0;rd<3;rd++){
        const go=e=>R(e,w,10+rd)<(rd===0?0.9:rd===1?e.g.act:e.g.act*0.5),taken={};
        for(let i=0;i<order.length;i++){
          const a=order[i];if(taken[a.id]||!go(a))continue;
          const cand=[];for(let j=i+1;j<order.length&&j<=i+12;j++){const c=order[j];if(!taken[c.id]&&go(c))cand.push(c);}
          if(!cand.length)continue;
          const o=cand[Math.floor(R(a,w,20+rd)*cand.length)];
          taken[a.id]=taken[o.id]=1;
          const aw=R(a,w,30+rd)<rkWinP(skill(a,w),skill(o,w)),wn=aw?a:o,ls=aw?o:a;
          add(wn,w,pos[ls.id]<pos[wn.id]?10:5);add(ls,w,-5);
          const gap=pos[wn.id]-pos[ls.id];if(gap>0&&(!UP[w]||gap>UP[w].gap))UP[w]={wn:wn.id,ls:ls.id,gap};
          rkRecAdd(REC,a.id,o.id,aw,'public',w);rkRecAdd(REC,o.id,a.id,!aw,'public',w);
        }
      }
    }else{
      const ent=order.filter(e=>R(e,w,40)<e.g.act).map(e=>({e,k:pts(e)+(R(e,w,41)-0.5)*60})).sort((x,y)=>y.k-x.k).map(x=>x.e);
      const groups=[];for(let i=0;i<ent.length;i+=8)groups.push(ent.slice(i,i+8));
      if(groups.length>1&&groups[groups.length-1].length<4)groups[groups.length-2]=groups[groups.length-2].concat(groups.pop());
      const PL=[15,10,5,5];
      groups.forEach(gp=>{
        if(gp.length<2)return;
        gp.map(e=>({e,s:skill(e,w)+(R(e,w,42)-0.5)*300})).sort((x,y)=>y.s-x.s).forEach((x,i)=>{
          add(x.e,w,i<4?PL[i]:-5);
          const c=con(x.e.id);c.e++;if(i===0)c.r++;if(i===1)c.s++;if(i<4)c.f++;c.seq.push({pl:i+1,wk:w});
        });
      });
    }
    endOfWeek(w);
    paced.forEach(([k,,pid,pt])=>{
      const e=E['n_'+k];if(!e||!pid||!pt)return;
      const pp=rkPtsAt(log.filter(x=>x.u===pid),w),d=pp+pt*RK_TETHER-pts(e);
      if(Math.abs(d)>=1)add(e,w,Math.round(d*0.5));
    });
  }
  const out={W,E:{},REC,CON,UP};
  ents.forEach(e=>{out.E[e.id]={pts:Math.round(pts(e)),prev:W?rkPtsAt(e.res,W-1):Math.round(pts(e)),badges:nb(e)};});
  paced.forEach(([k,bd])=>{const o=out.E['n_'+k];if(o&&bd!=null)o.badges=bd;});
  rkEngMemo[C.d]={key,out};
  return out;
}
S.ui.rk=Object.assign({c:'gym',both:false,who:{},ev:'badge',pts:'',why:'',nn:'',np:'',ns:'',nh:'',all:false,view:'near',q:'',lim:50,open:'',ba:'',bb:'',bwin:'',bk:'public',bw:''},S.ui.rk||{});
const rkD=()=>(S.cond&&S.cond[rkC().d])||{};
const rkB=()=>(S.cond&&S.cond[rkC().b])||{};
const rkLog=()=>Array.isArray(rkD().log)?rkD().log:[];
const rkNpcs=()=>Array.isArray(rkD().npc)?rkD().npc:[];
const rkKey=()=>Math.random().toString(36).slice(2,9);
function rkSave(patch){edit('cd','conditions',rkC().d,Object.assign({},rkD(),patch));}
function rkSaveB(patch){edit('cd','conditions',rkC().b,Object.assign({},rkB(),patch));}
/* where RP puts a trainer among everyone in Sinnoh's circuit; 0 = unranked */
function rkEst(p){
  if(p<RK_CURVE[0][0])return 0;
  for(let i=1;i<RK_CURVE.length;i++){
    const [a,ra]=RK_CURVE[i-1],[b,rb]=RK_CURVE[i];
    if(p<b)return Math.max(1,Math.round(ra+(rb-ra)*(p-a)/(b-a)));
  }
  return 1;
}
const rkTier=p=>rkC().tiers.find(t=>p>=t[0]);
const rkSgn=n=>n>0?'+'+n:n<0?'−'+Math.abs(n):'0';
function rkLabSel(attr,cur){
  return h`<select class="clcatsel" ${raw(attr)} aria-label="${rkC().labWord}"><option value="">No label yet</option>${rkC().labels.map(l=>h`<option ${l===cur?raw('selected'):''}>${l}</option>`)}</select>`;
}
/* the rows the current view shows; null marks a gap */
function rkVisible(rows){
  const u=S.ui.rk,q=String(u.q||'').trim().toLowerCase();
  const big=rows.length>40;
  let out=rows;
  if(q)out=rows.filter(r=>(r.name+' '+(r.home||'')+' '+(r.lab||'')).toLowerCase().includes(q));
  else if(u.view==='known')out=rows.filter(r=>r.kind!=='bg'||r.met);
  else if(u.view==='near'&&big){
    const keep=new Set();
    rows.forEach((r,i)=>{if(r.kind==='pc')for(let j=Math.max(0,i-5);j<=Math.min(rows.length-1,i+5);j++)keep.add(j);});
    if(!keep.size)for(let j=0;j<10;j++)keep.add(j);
    const idx=[...keep].sort((a,b)=>a-b),res=[];
    idx.forEach((j,n)=>{if(n&&j>idx[n-1]+1)res.push(null);res.push(rows[j]);});
    if(idx[0]>0)res.unshift(null);
    return res;
  }
  if(!q&&(u.view==='all'||!big)&&out.length>u.lim)return out.slice(0,u.lim).concat(['more']);
  return out;
}
/* rival cards: what the party knows about a rival or someone they've met. rk.card {id: {team, seen, mood, notes}} */
const RK_MOODS=['Friendly','Neutral','Rival','Hostile'];
const rkCards=()=>rkD().card||{};
const rkHasCard=id=>{const c=rkCards()[id];return !!(c&&(c.team||c.seen||c.mood||c.notes));};
const rkCanCard=r=>r.kind==='rival'||r.met||(!!S.me.admin&&r.kind!=='pc');
function rkCard(r){
  const c=rkCards()[r.id]||{},gm=!!S.me.admin;
  if(gm){
    const f=(k,l,ph,area)=>h`<label class="fld"><span class="fl">${l}</span>${area?h`<textarea rows="3" data-rkcard="${r.id}" data-f="${k}" placeholder="${ph}">${c[k]||''}</textarea>`:h`<input type="text" data-rkcard="${r.id}" data-f="${k}" value="${c[k]||''}" placeholder="${ph}">`}</label>`;
    return h`<div class="rkcard"><div class="fgrid">${f('team','Known team','Garchomp, Togekiss, ???')}${f('seen','Last seen','Hearthome Gym, week 3')}
      <label class="fld"><span class="fl">How they feel about the party</span><select data-rkcard="${r.id}" data-f="mood"><option value="">Unknown</option>${RK_MOODS.map(m=>h`<option ${m===c.mood?raw('selected'):''}>${m}</option>`)}</select></label></div>
      ${f('notes','Notes the players can read','Opens with Sandstorm; hates losing to coordinators.',true)}
      <p class="sub">${r.kind==='rival'||r.met?'Players can read this card.':'Players see this card once you mark this trainer as met.'}</p></div>`;
  }
  if(!rkHasCard(r.id))return h`<div class="rkcard"><p class="sub">The party doesn’t know much about ${r.name} yet.</p></div>`;
  return h`<div class="rkcard">${c.mood?h`<span class="pill rkmood ${c.mood.toLowerCase()}">${c.mood}</span>`:''}
    ${c.team?h`<p><span class="fl">Team</span><br>${c.team}</p>`:''}${c.seen?h`<p><span class="fl">Last seen</span><br>${c.seen}</p>`:''}${c.notes?h`<p class="prewrap"><span class="fl">Notes</span><br>${c.notes}</p>`:''}</div>`;
}
/* rank history: a snapshot of the players' places each time the GM runs a week. rkb.hist [{w, d, r:{uid:[pos, of]}}] */
function rkSnap(w){
  const rows=rkRows(),r={};
  rows.forEach(x=>{if(x.kind==='pc')r[x.id]=[x.pos,rows.length,x.pts];});
  return {w,d:clToday()||'',r};
}
function rkSpark(uid,name){
  const hist=(Array.isArray(rkB().hist)?rkB().hist:[]).filter(e=>e.r&&e.r[uid]);
  if(hist.length<2)return h`<div class="rkspark"><b>${name}</b><p class="sub">${hist.length?'#'+hist[0].r[uid][0]+' in week '+hist[0].w+'. The line starts after the next week.':'The line starts when the GM runs the first week.'}</p></div>`;
  const W=320,H=120,L=34,Rr=14,T=14,B=26;
  const ps=hist.map(e=>e.r[uid][0]),lo=Math.min(...ps),hi=Math.max(...ps),span=Math.max(4,hi-lo);
  const X=i=>L+(W-L-Rr)*i/(hist.length-1),Y=v=>T+(H-T-B)*(v-lo)/span;
  const pts=hist.map((e,i)=>X(i).toFixed(1)+','+Y(e.r[uid][0]).toFixed(1)).join(' ');
  const first=ps[0],last=ps[ps.length-1],moved=first-last;
  return h`<div class="rkspark"><div class="row sp"><b>${name}</b><span class="mono ${moved>0?'rkp up':moved<0?'rkp down':'sub'}">#${last}${moved?h` (${moved>0?'up '+moved:'down '+(-moved)})`:''}</span></div>
    <svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${name}: from #${first} to #${last} over ${hist.length-1} weeks">
      <line x1="${L}" x2="${W-Rr}" y1="${Y(lo)}" y2="${Y(lo)}" stroke="var(--line)" stroke-dasharray="3 3"/>
      <line x1="${L}" x2="${W-Rr}" y1="${Y(hi)}" y2="${Y(hi)}" stroke="var(--line)" stroke-dasharray="3 3"/>
      <text x="${L-6}" y="${Y(lo)+4}" text-anchor="end" font-size="11" fill="var(--muted)">#${lo}</text>
      <text x="${L-6}" y="${Y(hi)+4}" text-anchor="end" font-size="11" fill="var(--muted)">#${hi}</text>
      <polyline points="${pts}" fill="none" stroke="var(--accent)" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>
      ${hist.map((e,i)=>h`<circle cx="${X(i).toFixed(1)}" cy="${Y(e.r[uid][0]).toFixed(1)}" r="${i===hist.length-1?4:2.5}" fill="var(--accent)"><title>Week ${e.w}: #${e.r[uid][0]} of ${e.r[uid][1]}</title></circle>`)}
      <text x="${L}" y="${H-6}" font-size="11" fill="var(--muted)">Week ${hist[0].w}</text>
      <text x="${W-Rr}" y="${H-6}" text-anchor="end" font-size="11" fill="var(--muted)">Week ${hist[hist.length-1].w}</text>
    </svg></div>`;
}
/* tier alerts: a news line when a player's points cross into a new standing */
function rkTierNews(C,id,before,after){
  const tb=C.tiers.find(t=>before>=t[0]),ta=C.tiers.find(t=>after>=t[0]);
  if(!tb||!ta||tb===ta)return null;
  const tr=S.trainers[id],nm=tr?tName(tr):'A player',up=after>before;
  return {k:rkKey(),u:id,p:0,t:'tier',w:up?nm+' is now '+ta[1]+' on the '+C.name+': '+ta[2].charAt(0).toLowerCase()+ta[2].slice(1)+'.':nm+' has dropped to '+ta[1]+' on the '+C.name+'.',d:clToday()||'',at:Date.now()+1};
}
function rkRows(){
  const EN=rkEngine(),W=EN.W,log=rkLog();
  const lab=rkD().lab||{},b=rkB(),met=b.met||{},gone=b.gone||{};
  const field=b.seed?rkGenField(num(b.seed),num(b.n)||300):[];
  const conB=rkC()===RK_C.con;
  const rows=entriesOf(S.trainers).filter(t=>t.name&&(conB?onCon(t):onGym(t))).map(t=>{const m=log.filter(e=>e.u===t.id),p=rkPtsAt(m,W);return {id:t.id,name:tName(t),pts:p,wk:W?p-rkPtsAt(m,W-1):0,lab:lab[t.id]||'',kind:'pc',bd:badgeCount(t),rb:ribCount(t)};})
    .concat(rkNpcs().map(n=>{const x=EN.E['n_'+n.k]||{pts:0,prev:0,badges:0};return {id:'n_'+n.k,k:n.k,name:n.n||'Unnamed rival',pts:x.pts,wk:x.pts-x.prev,lab:n.s||'',kind:'rival',home:n.h||'',bd:x.badges};}))
    .concat(field.filter(f=>!gone[f.i]&&EN.E['b'+f.i]).map(f=>{const x=EN.E['b'+f.i];return {id:'b'+f.i,i:f.i,kind:'bg',name:f.name,home:f.home,lab:f.lab,pts:x.pts,wk:x.pts-x.prev,bd:x.badges};}));
  rows.forEach(r=>{r.met=r.kind!=='pc'&&!!met[r.id];r.rec=EN.REC[r.id]||null;r.con=EN.CON[r.id]||null;});
  rows.sort((a,b)=>b.pts-a.pts||(a.kind==='pc'?-1:b.kind==='pc'?1:0)||a.name.localeCompare(b.name));
  rows.forEach((r,i)=>{r.pos=i+1;});
  return rows;
}
const rkPl=(n,w)=>n+' '+w+(n===1?'':'s');
const rkOrd=n=>n+(n%100>=11&&n%100<=13?'th':['th','st','nd','rd'][n%10]||'th');
function rkRecText(r){
  if(rkC()===RK_C.con){const c=r.con||{e:0,r:0};return rkPl(r.kind==='pc'?Math.max(r.rb||0,c.r):c.r,'ribbon')+' · '+rkPl(c.e,'contest');}
  const c=r.rec||{w:0,l:0};return c.w+'–'+c.l+(r.bd!=null?' · '+rkPl(r.bd,'badge'):'');
}
function rkStreak(seq){
  if(!seq||!seq.length)return '';
  const last=seq[seq.length-1].win;let n=0;
  for(let i=seq.length-1;i>=0&&seq[i].win===last;i--)n++;
  return (last?'W':'L')+n;
}
/* a lookup from any id on the board (or a Gym) to a display name */
function rkNamer(rows){
  const m={};entriesOf(S.trainers).forEach(t=>{if(t.name)m[t.id]=tName(t);});rows.forEach(r=>{m[r.id]=r.name;});
  RK_GYMS.forEach(g=>{m[g.id]=rkGymName(g)+' ('+g.badge+' Gym)';});
  return id=>m[id]||'Someone no longer listed';
}
function rkProfile(r,nameOf){
  const gm=!!S.me.admin;
  let stats;
  if(rkC()===RK_C.con){
    const c=r.con||{e:0,r:0,s:0,f:0,seq:[]},last=c.seq.slice(-5);
    stats=h`<div class="rkstats">${[['Contests',c.e],['Ribbons',r.kind==='pc'?Math.max(r.rb||0,c.r):c.r],['Second',c.s],['Finals',c.f]].map(x=>h`<div><span class="sub">${x[0]}</span><b>${x[1]}</b></div>`)}</div>
      ${last.length?h`<div class="rklast"><span class="sub">Last ${last.length}</span>${last.map(x=>h`<span class="pill ${x.pl===1?'rkmetp':''}">${rkOrd(x.pl)}</span>`)}</div>`:h`<p class="sub">No contests yet this season.</p>`}`;
  }else{
    const c=r.rec||rkRec(),tot=c.w+c.l,last=c.seq.slice(-5),st=rkStreak(c.seq);
    const hh=Object.entries(c.h2h).sort((a,b)=>(b[1][0]+b[1][1])-(a[1][0]+a[1][1])).slice(0,6);
    stats=h`<div class="rkstats">${[['Record',c.w+'–'+c.l],['Win rate',tot?Math.round(100*c.w/tot)+'%':'—'],['Streak',st||'—'],['Badges',r.bd!=null?r.bd:'—']].map(x=>h`<div><span class="sub">${x[0]}</span><b class="${x[0]==='Streak'&&st?(st[0]==='W'?'rkp up':'rkp down'):''}">${x[1]}</b></div>`)}</div>
      ${last.length?h`<div class="rklast"><span class="sub">Last ${last.length}</span>${last.map(x=>h`<i class="rkdot ${x.win?'w':'l'}" title="${x.win?'Beat':'Lost to'} ${nameOf(x.o)}, week ${x.wk}"></i>`)}</div>`:h`<p class="sub">No battles yet this season.</p>`}
      ${hh.length?h`<div class="rkh2h"><span class="fl">Head-to-head</span>${hh.map(([o,v])=>h`<div class="row sp"><span>${nameOf(o)}</span><b class="mono">${v[0]}–${v[1]}</b></div>`)}</div>`:''}`;
  }
  return h`<div class="rkprof">${stats}
    ${r.kind!=='pc'&&(r.kind==='rival'||r.met||gm)?rkCard(r):''}
    ${gm&&r.kind!=='pc'?h`<div class="row"><button class="btn sm ghost" data-act="rk_met" data-id="${r.id}" aria-pressed="${r.met?'true':'false'}">${r.met?'Met ✓':'Mark met'}</button>${r.kind==='bg'?h`<button class="btn sm ghost" data-act="rk_track" data-i="${r.i}">Make a rival</button>`:''}</div>`:''}</div>`;
}
function rkBoardHtml(){
  const gm=!!S.me.admin,C=rkC(),rows=rkRows(),vis=rkVisible(rows),nameOf=rkNamer(rows);
  if(!vis.length)return h`<p class="sub">${S.ui.rk.q?'No one matches that search.':S.ui.rk.view==='known'?'The party hasn’t met anyone on the board yet.':'No one is on the board yet.'}</p>`;
  const cell=r=>h`<tr class="${r.kind==='pc'?'rkpc':''} ${r.met?'rkmet':''}">
      <td data-l="#"><div class="cxc"><b class="mono">${r.pos}</b></div></td>
      <td data-l="Trainer"><div class="cxc"><button class="rkname" data-act="rk_open" data-id="${r.id}" aria-expanded="${S.ui.rk.open===r.id?'true':'false'}"><b>${r.name}</b></button>${r.kind==='pc'?h` <span class="pill rkpill">Player</span>`:''}${r.met?h` <span class="pill rkmetp">Met</span>`:''}${r.kind==='rival'?h` <span class="pill">Rival</span>`:''}${r.home?h`<br><span class="sub">${r.home}</span>`:''}</div></td>
      <td data-l="${C.unit}"><div class="cxc"><b class="mono">${r.pts<0?'−'+Math.abs(r.pts):r.pts}</b>${r.wk?h` <span class="sub rkwk ${r.wk>0?'up':'down'}">${rkSgn(r.wk)}</span>`:''}</div></td>
      <td data-l="${C.labWord}"><div class="cxc">${gm&&r.kind==='pc'?rkLabSel('data-rklab="'+r.id+'"',r.lab):gm&&r.kind==='rival'?rkLabSel('data-rknlab="'+r.k+'"',r.lab):r.lab?h`<span class="pill">${r.lab}</span>`:h`<span class="sub">None yet</span>`}</div></td>
      <td data-l="Record"><div class="cxc"><span class="sub">${rkRecText(r)}</span></div></td></tr>
    ${S.ui.rk.open===r.id?h`<tr class="rkcardrow"><td colspan="5"><div class="cxc">${rkProfile(r,nameOf)}</div></td></tr>`:''}`;
  return h`<div class="cxw"><table class="cxt rkt"><thead><tr>${['#','Trainer',C.unit,C.labWord,'Record'].map(c=>h`<th scope="col">${c}</th>`)}</tr></thead><tbody>
    ${vis.map(r=>r===null?h`<tr class="rkgap"><td colspan="5"><div class="cxc sub">⋮</div></td></tr>`:r==='more'?h`<tr class="rkgap"><td colspan="5"><div class="cxc"><button class="btn sm ghost" data-act="rk_more">Show 50 more</button></div></td></tr>`:cell(r))}
  </tbody></table></div>`;
}
function rkListRefresh(){const el=document.getElementById('rklist');if(el)el.innerHTML=rkBoardHtml().s;}
/* ----- logged battles (Gym board): one record, points for both sides ----- */
const RK_BKINDS=[['public','Public battle'],['gym','Gym battle'],['trial','Gym Trial'],['cup','Halfway Cup'],['conf','Conference']];
const rkIsGym=id=>String(id||'').indexOf('g_')===0;
/* points each side gets: {a, b}; null with a reason when the pairing doesn't fit the kind */
function rkBattlePts(a,b,win,kind,rows){
  if(!a||!b)return {err:'Pick both trainers.'};
  if(win!=='a'&&win!=='b')return {err:'Tap Won? beside the winner.'};
  if(a===b)return {err:'Pick two different trainers.'};
  const ga=rkIsGym(a),gb=rkIsGym(b);
  if(kind==='gym'||kind==='trial'){
    if(ga===gb)return {err:kind==='gym'?'A Gym battle needs one Gym and one challenger.':'A Trial needs one Gym and one challenger.'};
    const chA=!ga,chWin=(win==='a')===chA,o={a:0,b:0};
    o[chA?'a':'b']=kind==='gym'?(chWin?25:-10):(chWin?5:0);
    return o;
  }
  if(ga||gb)return {err:'Gyms only take part in Gym battles and Trials.'};
  const pos=id=>{const r=rows.find(x=>x.id===id);return r?r.pos:1e9;};
  const wid=win==='a'?a:b,lid=win==='a'?b:a,o={};
  o[win==='a'?'a':'b']=pos(lid)<pos(wid)?10:5;o[win==='a'?'b':'a']=-5;
  return o;
}
function rkBattlePanel(rows){
  const u=S.ui.rk,nameOf=rkNamer(rows);
  const opts=cur=>{
    const og=(l,list)=>list.length?h`<optgroup label="${l}">${list.map(r=>h`<option value="${r.id}" ${r.id===cur?raw('selected'):''}>${r.name}${r.kind?' (#'+r.pos+')':''}</option>`)}</optgroup>`:'';
    return h`<option value="">Pick a trainer</option>${og('Players',rows.filter(r=>r.kind==='pc'))}${og('Rivals',rows.filter(r=>r.kind==='rival'))}${og('Gyms',RK_GYMS.map(g=>({id:g.id,name:rkGymName(g)+' ('+g.badge+' Gym)'})))}${og('Field',rows.filter(r=>r.kind==='bg').slice().sort((x,y)=>x.name.localeCompare(y.name)))}`;
  };
  const pv=rkBattlePts(u.ba,u.bb,u.bwin,u.bk,rows);
  const side=k=>h`<button class="btn sm ${u.bwin===k?'primary':'ghost'}" data-act="rk_bwin" data-v="${k}" aria-pressed="${u.bwin===k?'true':'false'}">${u.bwin===k?'Winner':'Won?'}</button>`;
  return h`<section class="panel"><div class="ph"><h2>Record a battle</h2><span class="sub">Only you see this</span></div>
    <div class="rkvs"><label class="fld"><span class="fl">Trainer</span><select data-u="rk.ba">${opts(u.ba)}</select></label>${side('a')}
      <span class="sub">vs</span>
      <label class="fld"><span class="fl">Opponent</span><select data-u="rk.bb">${opts(u.bb)}</select></label>${side('b')}</div>
    <div class="fgrid"><label class="fld"><span class="fl">Kind of battle</span><select data-u="rk.bk">${RK_BKINDS.map(k=>h`<option value="${k[0]}" ${k[0]===u.bk?raw('selected'):''}>${k[1]}</option>`)}</select></label>
      <label class="fld"><span class="fl">Headline (optional)</span><input type="text" data-u="rk.bw" value="${u.bw}" placeholder="Upset at the Hearthome Pavilion" data-nr></label></div>
    <p class="sub">${pv.err?pv.err:h`${nameOf(u.ba)} <b class="${pv.a>0?'rkp up':pv.a<0?'rkp down':''}">${rkSgn(pv.a)} RP</b> · ${nameOf(u.bb)} <b class="${pv.b>0?'rkp up':pv.b<0?'rkp down':''}">${rkSgn(pv.b)} RP</b>${u.bk==='gym'||u.bk==='trial'?'':' · beating a higher-ranked trainer is worth +10, a lower-ranked one +5'}`}</p>
    <div class="row"><button class="btn sm primary" data-act="rk_btadd">Save the battle</button><span class="sub">Week ${num(rkB().wk)}. It counts toward both trainers’ records${u.bk==='gym'?' and the Gym’s':''}. Award the badge on the trainer sheet as usual.</span></div>
  </section>`;
}
function rkGymPanel(){
  const EN=rkEngine(),gm=!!S.me.admin,set=rkGymSet();
  const rows=RK_GYMS.map(g=>{const c=EN.REC[g.id]||rkRec(),t=c.w+c.l,st=rkStreak(c.seq),rep=rkGymRep(g.id);
    return [g.badge+' Badge',
      gm?h`<input type="text" class="rkgname" data-rkgym="${g.id}" data-f="name" value="${(set[g.id]||{}).name||''}" placeholder="${g.name}" aria-label="Leader of the ${g.badge} Gym">`:rkGymName(g),
      gm?h`<select class="clcatsel" data-rkgym="${g.id}" data-f="rep" aria-label="Reputation">${RK_REPS.map(r=>h`<option value="${r[0]}" ${r===rep?raw('selected'):''}>${r[1]}</option>`)}</select>`:(rep[0]==='standard'?h`<span class="sub">Standard</span>`:h`<span class="pill ${rep[0]==='brutal'||rep[0]==='tough'?'rkrep':''}">${rep[1]}</span>`),
      h`${c.w}–${c.l}${st?h` <span class="sub">· ${st}</span>`:''}`,t?Math.round(100*c.w/t)+'%':'—'];});
  return h`<section class="panel"><div class="ph"><h2>The Gyms</h2><span class="sub">Against challengers this season</span></div>
    ${cxTable(['Gym','Leader','Reputation','Record','Win rate'],rows)}
    <p class="sub">Leaders scale their teams to the challenger's badges, so later Gyms are harder for everyone; a Tough or Brutal Gym is harder still.${gm?' Renaming a Leader here changes the name on this page only.':''}</p></section>`;
}
/* ----- weekly headlines: drafted when the GM runs a week, published when the GM says so. rk.heads [{k, wk, txt, pub}] ----- */
const rkHeads=()=>Array.isArray(rkD().heads)?rkD().heads:[];
function rkDraftHeads(W){
  if(!W)return [];
  const C=rkC(),gymC=C===RK_C.gym,EN=rkEngine(),rows=rkRows(),nameOf=rkNamer(rows),out=[];
  const before=rows.slice().sort((a,b)=>(b.pts-b.wk)-(a.pts-a.wk)||a.name.localeCompare(b.name)),pp={};before.forEach((r,i)=>{pp[r.id]=i+1;});
  const mv=rows.map(r=>({r,d:pp[r.id]-r.pos}));
  const pick=(arr,i)=>arr[Math.abs(rkHash(W,i,C===RK_C.gym?1:2)*arr.length|0)%arr.length];
  const dash=(t)=>'Dash Moreno: '+t,ing=(t)=>'Ingrid Solberg: '+t;
  const up=mv.filter(x=>x.r.kind!=='pc'&&x.r.pos<=150).sort((a,b)=>b.d-a.d)[0];
  if(up&&up.d>=5)out.push(pick([dash(up.r.name+' rockets up '+up.d+' spots to #'+up.r.pos+'! Somebody check what they’re eating!'),ing(up.r.name+' climbed '+up.d+' places to #'+up.r.pos+'. A good week, but one good week is not a season.'),up.r.name+' is the week’s biggest climber: up '+up.d+' to #'+up.r.pos+'.'],1));
  const dn=mv.filter(x=>x.r.kind!=='pc'&&pp[x.r.id]<=150).sort((a,b)=>a.d-b.d)[0];
  if(dn&&dn.d<=-5)out.push(pick([ing(dn.r.name+' fell '+(-dn.d)+' spots to #'+dn.r.pos+'. A week to forget, and the field won\u2019t wait.'),dash('Ouch. '+dn.r.name+' tumbles '+(-dn.d)+' places to #'+dn.r.pos+'. Rough week!'),dn.r.name+' slides '+(-dn.d)+' spots to #'+dn.r.pos+'.'],2));
  mv.filter(x=>x.r.kind==='pc'&&x.d>=8).forEach(x=>out.push(dash('Keep an eye on '+x.r.name+': up '+x.d+' places to #'+x.r.pos+' this week.')));
  rows.filter(r=>r.pos<=10&&pp[r.id]>10).slice(0,1).forEach(r=>out.push(r.name+' breaks into the top 10 at #'+r.pos+'.'));
  const u=EN.UP&&EN.UP[W];
  if(gymC&&u&&u.gap>=15)out.push(pick([dash('UPSET! '+nameOf(u.wn)+' takes down '+nameOf(u.ls)+', ranked '+u.gap+' places higher!'),ing(nameOf(u.wn)+' beat '+nameOf(u.ls)+' despite a '+u.gap+'-place gap. Not a fluke, judging by the tape.')],3));
  if(gymC){
    const gw=RK_GYMS.map(g=>{const c=EN.REC[g.id]||rkRec(),wk=c.seq.filter(x=>x.wk===W);return {g,w:wk.filter(x=>x.win).length,l:wk.filter(x=>!x.win).length,st:rkStreak(c.seq)};});
    const wall=gw.filter(x=>x.w>=3&&x.l===0).sort((a,b)=>b.w-a.w)[0];
    if(wall)out.push(pick([dash('Nobody got past '+rkGymName(wall.g)+' this week: '+wall.w+' challengers, '+wall.w+' losses!'),ing(rkGymName(wall.g)+' went '+wall.w+'–0 at the '+wall.g.badge+' Gym. Challengers keep bringing the wrong answers.')],4));
    const soft=gw.filter(x=>x.l>=4&&x.l>x.w).sort((a,b)=>b.l-a.l)[0];
    if(soft)out.push(ing(soft.l+' challengers left the '+soft.g.badge+' Gym with a badge this week. '+rkGymName(soft.g)+' will want answers.'));
  }else{
    const rib=rows.filter(r=>r.kind!=='pc'&&r.con&&r.con.seq.some(x=>x.wk===W&&x.pl===1)&&r.con.r>=3).sort((a,b)=>b.con.r-a.con.r)[0];
    if(rib)out.push(dash(rib.name+' takes another ribbon, that’s '+rib.con.r+' this season!'));
  }
  return out.slice(0,5).map(txt=>({k:rkKey(),wk:W,txt,pub:false}));
}
function rkHeadPanel(){
  const dr=rkHeads().filter(x=>!x.pub);
  if(!dr.length)return '';
  return h`<section class="panel"><div class="ph"><h2>Headline drafts</h2><span class="sub">Only you see these until you publish</span></div>
    <ul class="mini-list">${dr.map(x=>h`<li><textarea rows="2" data-rkhead="${x.k}" aria-label="Headline">${x.txt}</textarea><div class="row"><button class="btn sm" data-act="rk_hpub" data-k="${x.k}">Publish</button><button class="btn sm ghost" data-act="rk_hdel" data-k="${x.k}">Delete</button><span class="sub">Week ${x.wk}</span></div></li>`)}</ul>
    <div class="row"><button class="btn sm primary" data-act="rk_hpuball">Publish all</button></div></section>`;
}
/* ----- the circuits on a trainer's own sheet ----- */
function rkWith(c,fn){const u=S.ui.rk,old=u.c;u.c=c;try{return fn();}finally{u.c=old;}}
function rkSheetPanel(uid){
  const g=rkWith('gym',()=>{const rows=rkRows();return {r:rows.find(x=>x.id===uid),n:rows.length,nm:rkNamer(rows)};});
  const c=rkWith('con',()=>{const rows=rkRows();return {r:rows.find(x=>x.id===uid),n:rows.length};});
  if(!g.r&&!c.r)return '';
  const gr=g.r&&g.r.rec||rkRec(),last=gr.seq.slice(-5),st=rkStreak(gr.seq),cc=c.r&&c.r.con||{e:0,r:0};
  return h`<section class="panel"><div class="ph"><h2>On the circuits</h2><button class="btn sm ghost" data-act="tab" data-tab="rank">Rankings</button></div>
    <div class="rkstats rkstats2">
      <div><span class="sub">Gym circuit</span><b>${g.r?'#'+g.r.pos:'—'}</b><span class="sub">${g.r?g.r.pts+' RP of '+g.n+' trainers':''}</span></div>
      <div><span class="sub">Record</span><b>${gr.w}–${gr.l}</b><span class="sub">${st?'Streak '+st:'No battles yet'}</span></div>
      <div><span class="sub">Contest circuit</span><b>${c.r?'#'+c.r.pos:'—'}</b><span class="sub">${c.r?c.r.pts+' CP of '+c.n:''}</span></div>
      <div><span class="sub">Contests</span><b>${cc.e}</b><span class="sub">${rkPl(c.r?Math.max(c.r.rb||0,cc.r):cc.r,'ribbon')}</span></div></div>
    ${last.length?h`<div class="rklast"><span class="sub">${last.length===1?'Last battle':'Last '+last.length+' battles'}</span>${last.map(x=>h`<i class="rkdot ${x.win?'w':'l'}" title="${x.win?'Beat':'Lost to'} ${g.nm(x.o)}, week ${x.wk}"></i>`)}</div>`:''}
  </section>`;
}
/* ----- rivals on the road: who might turn up on a travel day (tracked rivals and anyone the party has met, either board) ----- */
function rkRoadPool(){
  const out=[];
  ['gym','con'].forEach(c=>rkWith(c,()=>rkRows().forEach(r=>{if((r.kind==='rival'||r.met)&&!out.some(o=>o.name===r.name))out.push({id:r.id,c,name:r.name,pos:r.pos,unit:rkC().unit,rec:rkRecText(r),home:r.home||''});})));
  return out;
}
function rkGoto(c,id){const u=S.ui.rk;u.c=c==='con'?'con':'gym';u.open=id;u.view='known';u.q='';setTab('rank');}
function rkTab(){
  const gm=!!S.me.admin,u=S.ui.rk,rows=rkRows(),nameOf=rkNamer(rows),C=rkC(),gymC=C===RK_C.gym;
  const log=rkLog(),bts=gymC?rkBattles():[],btK={};bts.forEach(x=>{btK[x.k]=x;});
  const items=log.filter(e=>!e.bt).map(e=>({t:'e',e,wk:num(e.wk),at:num(e.at)})).concat(bts.map(x=>({t:'b',x,wk:num(x.wk),at:num(x.at)}))).concat(rkHeads().filter(x=>x.pub).map(x=>({t:'h',x,wk:num(x.wk),at:num(x.at)||1e15}))).sort((a,b)=>b.wk-a.wk||b.at-a.at);
  const big=rows.length>40,b=rkB(),known=rows.filter(r=>r.met).length;
  const ev=C.events.find(e=>e[0]===u.ev)||C.events[0];
  const feed=u.all?items:items.slice(0,25);
  const pcs=rows.filter(r=>r.kind==='pc');
  const rm=(act,k)=>gm?h`<button class="btn sm ghost" data-act="${act}" data-k="${k}" aria-label="Remove this entry">Remove</button>`:'';
  const ptsOf=(bk,id)=>{const e=log.find(x=>x.bt===bk&&x.u===id);return e?num(e.p):0;};
  const chip=p=>p?h` <span class="mono rkp ${p>0?'up':'down'}">${rkSgn(p)}</span>`:'';
  const item=it=>{
    if(it.t==='h')return h`<li class="rkhead"><div class="row sp"><span><span class="pill">Headline</span> ${it.x.txt}</span>${rm('rk_hdel',it.x.k)}</div><span class="sub">Week ${it.wk}</span></li>`;
    if(it.t==='b'){const x=it.x,wn=x.win==='a'?x.a:x.b,ls=x.win==='a'?x.b:x.a,kn=(RK_BKINDS.find(k=>k[0]===x.kind)||['',''])[1];
      return h`<li><div class="row sp"><span><b>${nameOf(wn)}</b>${chip(ptsOf(x.k,wn))} ${x.kind==='trial'?'passed the Trial against':'beat'} <b>${nameOf(ls)}</b>${chip(ptsOf(x.k,ls))}</span>${rm('rk_btdel',x.k)}</div>${x.w?h`<span>${x.w}</span>`:''}<span class="sub">${kn} · week ${x.wk}${x.d?' · '+clNice(x.d,{y:1}):''}</span></li>`;}
    const e=it.e;
    if(e.t==='tier')return h`<li class="rktier"><div class="row sp"><span><span class="pill rkmetp">New standing</span> ${e.w}</span>${rm('rk_del',e.k)}</div><span class="sub">Week ${num(e.wk)}${e.d?' · '+clNice(e.d,{y:1}):''}</span></li>`;
    return h`<li><div class="row sp"><span><b>${nameOf(e.u)}</b> <span class="mono rkp ${num(e.p)>=0?'up':'down'}">${rkSgn(num(e.p))} ${C.unit}</span></span>${rm('rk_del',e.k)}</div><span>${e.w}</span><span class="sub">Week ${num(e.wk)}${e.d?' · '+clNice(e.d,{y:1}):''}</span></li>`;
  };
  const seg=(v,l)=>h`<button class="shtab" data-act="rk_view" data-v="${v}" aria-pressed="${u.view===v?'true':'false'}">${l}</button>`;
  const cseg=(v,l)=>h`<button class="shtab" data-act="rk_c" data-v="${v}" aria-pressed="${(u.c==='con'?'con':'gym')===v?'true':'false'}">${l}</button>`;
  return h`<div class="shtabs" role="group" aria-label="Which rankings">${cseg('gym','Gym circuit')}${cseg('con','Contest circuit')}</div>
  <section class="panel"><div class="ph"><h2>${C.name} rankings</h2><span class="sub">Week ${num(b.wk)} of the season · ${rows.length} trainers</span></div>
    <p class="sub">${C.intro}</p>
    ${pcs.length&&big?h`<div class="rkme">${pcs.map(r=>h`<span><b>${r.name}</b> <span class="mono">#${r.pos}</span> <span class="sub">of ${rows.length} · ${r.pts} ${C.unit}</span></span>`)}</div>`:''}
    ${big?h`<div class="shtabs" role="group" aria-label="Which trainers">${seg('near','Near us')}${seg('known','People we know'+(known?' ('+known+')':''))}${seg('all','Everyone')}</div>
      <label class="fld"><span class="fl">Search by name, town or ${C.labWord.toLowerCase()}</span><input type="search" data-u="rk.q" value="${u.q}" placeholder="${C.qph}"></label>`:''}
    <div id="rklist">${rkBoardHtml()}</div>
    <p class="sub">${big&&u.view==='near'&&!u.q?'Showing the five trainers above and below each player. ':''}Tap a name for their ${gymC?'record and head-to-head':'contest results'}.</p>
  </section>
  ${pcs.length?h`<section class="panel"><div class="ph"><h2>The climb</h2><span class="sub">Place on the board, week by week</span></div>
    <div class="rksparks">${pcs.map(r=>rkSpark(r.id,r.name))}</div></section>`:''}
  ${gm?rkHeadPanel():''}
  ${gm&&gymC?rkBattlePanel(rows):''}
  ${gm?h`<section class="panel"><div class="ph"><h2>The week</h2><span class="sub">Only you see this</span></div>
    <p class="sub">Week ${num(b.wk)} of the season. Running a week records where each player stands for The climb, and the ${b.seed?'field and tracked rivals':'tracked rivals'} ${gymC?'battle each other and take on the Gyms':'enter the week’s contests'}. Players only move when you record their results.</p>
    <div class="row"><button class="btn sm primary" data-act="rk_week">Run the week</button>${num(b.wk)?h`<button class="btn sm ghost" data-act="rk_unweek">Undo a week</button>`:''}${b.seed?h`<button class="btn sm ghost" data-act="rk_bgclear">Remove the field</button>`:''}</div>
    ${b.seed?h`<p class="sub">${num(b.n)} background ${gymC?'trainers':'coordinators'} on the board.</p>`
      :h`<p class="sub">Fill the board with a few hundred generated ${gymC?'trainers':'coordinators'} so the players can see where they stand in all of Sinnoh. Each has a name, home town, ${C.labWord.toLowerCase()} and last season’s ${C.unit}, and they ${gymC?'battle':'compete'} every time you run a week.</p>
      <div class="row"><button class="btn sm" data-act="rk_bgfill" data-n="300">Add 300</button><button class="btn sm ghost" data-act="rk_bgfill" data-n="150">Add 150</button></div>`}
  </section>
  <section class="panel"><div class="ph"><h2>${gymC?'Other results':'Record a result'}</h2><span class="sub">Only you see this</span></div>
    <div class="rkwho">${rows.filter(r=>r.kind!=='bg').map(r=>h`<label class="row"><input type="checkbox" data-rkwho="${r.id}" ${u.who[r.id]?raw('checked'):''}><span>${r.name}</span></label>`)}</div>
    <p class="sub">${gymC?'For anything that isn’t a battle: a viral moment, a scandal, a badge won off-screen. Record battles above so they count toward records. ':''}Points go to players and tracked rivals; make a field trainer a rival first.</p>
    <div class="fgrid">
      <label class="fld"><span class="fl">What happened</span><select data-u="rk.ev">${C.events.map(e=>h`<option value="${e[0]}" ${e[0]===u.ev?raw('selected'):''}>${e[1]}${e[0]==='other'?'':' ('+rkSgn(e[2])+')'}</option>`)}</select></label>
      <label class="fld"><span class="fl">Points (blank = ${rkSgn(ev[2])})</span><input type="number" step="1" data-u="rk.pts" value="${u.pts}" data-nr></label>
      <label class="fld"><span class="fl">Headline (optional)</span><input type="text" data-u="rk.why" value="${u.why}" placeholder="${C.ph}" data-nr></label></div>
    <div class="row"><label class="row"><input type="checkbox" data-u="rk.both" ${u.both?raw('checked'):''} data-nr><span>Also count it on the ${gymC?'Contest':'Gym'} circuit</span></label></div>
    <div class="row"><button class="btn sm primary" data-act="rk_add">Award</button><span class="sub">Week ${num(b.wk)}${clToday()?', '+clNice(clToday(),{y:1}):''}.</span></div>
  </section>`:''}
  <section class="panel"><div class="ph"><h2>Ranking news</h2><span class="sub">${items.length}</span></div>
    ${items.length?h`<ul class="mini-list">${feed.map(item)}</ul>
      ${items.length>25?h`<button class="btn sm ghost" data-act="rk_all">${u.all?'Show the latest 25':'Show all '+items.length}</button>`:''}`
      :h`<p class="sub">No results yet this season.</p>`}
  </section>
  ${gymC?rkGymPanel():''}
  <section class="panel"><div class="ph"><h2>What the standings get you</h2></div>
    ${cxTable([C.unit,'Standing','What it gets you'],C.tiers.map((t,i)=>[i===C.tiers.length-1?'0–49':t[0]+(i?'–'+(C.tiers[i-1][0]-1):'+'),t[1],t[2]]))}
    ${gm?cxTable(['Result',C.unit],C.events.filter(e=>e[0]!=='other').map(e=>[e[1],rkSgn(e[2])])):''}
    <p class="sub">Results count in full for a year, at half for six months more, then drop off. ${C.note}</p>
  </section>
  ${gm?h`<section class="panel"><div class="ph"><h2>Rivals</h2><span class="sub">${rkNpcs().length}</span></div>
    ${rkNpcs().length?h`<ul class="mini-list">${rkNpcs().map(n=>h`<li><div class="row sp"><span><b>${n.n}</b> <span class="sub">${n.b!=null?'from the field':'started at '+num(n.p)+' '+C.unit}${n.h?' · '+n.h:''}</span></span><span class="row">${n.nt&&NTS()[n.nt]?h`<button class="btn sm" data-act="rk_ntopen" data-id="${n.nt}">NPC sheet</button>`:''}<button class="btn sm ghost" data-act="rk_ndel" data-k="${n.k}">Remove</button></span></div></li>`)}</ul>`:h`<p class="sub">Rivals are the trainers the players keep running into. They ${gymC?'battle':'compete'} every week like the field, and you can record their results by hand too.</p>`}
    <div class="fgrid">
      <label class="fld"><span class="fl">Name</span><input type="text" data-u="rk.nn" value="${u.nn}" data-nr></label>
      <label class="fld"><span class="fl">Last season’s ${C.unit}</span><input type="number" step="1" data-u="rk.np" value="${u.np}" placeholder="0" data-nr></label>
      <label class="fld"><span class="fl">Home or note</span><input type="text" data-u="rk.nh" value="${u.nh}" placeholder="Veilstone" data-nr></label>
      <label class="fld"><span class="fl">${C.labWord}</span><select data-u="rk.ns" data-nr><option value="">None yet</option>${C.labels.map(l=>h`<option ${l===u.ns?raw('selected'):''}>${l}</option>`)}</select></label></div>
    <div class="row"><button class="btn sm" data-act="rk_nadd">Add the rival</button>${rkB().seed&&rkNpcs().some(n=>n.b==null)?h`<button class="btn sm ghost" data-act="rk_fold" title="Each rival replaces the field trainer with the closest points, so the board keeps its size">Put rivals in the field</button>`:''}${rkNpcs().some(n=>C.sample.some(s=>s.n===n.n))?'':h`<button class="btn sm ghost" data-act="rk_sample">Add five sample rivals</button>`}</div>
  </section>`:''}`;
}
function rkAct(b){
  const d=b.dataset,u=S.ui.rk,gm=!!S.me.admin;
  if(d.act==='rk_all'){u.all=!u.all;render();return;}
  if(d.act==='rk_c'){u.c=d.v==='con'?'con':'gym';u.who={};u.q='';u.lim=50;u.open='';u.ev=rkC().def;u.pts='';u.both=false;render();return;}
  if(d.act==='rk_view'){u.view=d.v;u.q='';u.lim=50;render();return;}
  if(d.act==='rk_goto'){rkGoto(d.c,d.id);return;}
  if(d.act==='rk_open'){u.open=u.open===d.id?'':d.id;rkListRefresh();return;}
  if(d.act==='rk_more'){u.view=u.view==='near'?'all':u.view;u.lim+=50;rkListRefresh();return;}
  if(!gm)return;
  const bb=rkB(),W=num(bb.wk);
  switch(d.act){
    case 'rk_bwin':u.bwin=d.v;render();break;
    case 'rk_btadd':{
      const rows=rkRows(),pv=rkBattlePts(u.ba,u.bb,u.bwin,u.bk,rows);
      if(pv.err){toast(pv.err);break;}
      if(u.bwin!=='a'&&u.bwin!=='b'){toast('Pick the winner.');break;}
      const k=rkKey(),at=Date.now(),day=clToday()||'',kn=(RK_BKINDS.find(x=>x[0]===u.bk)||RK_BKINDS[0])[1];
      const nameOf=rkNamer(rows),wn=u.bwin==='a'?u.ba:u.bb,ls=u.bwin==='a'?u.bb:u.ba;
      const w=String(u.bw||'').trim()||kn+': '+nameOf(wn)+' beat '+nameOf(ls);
      const add=[],tn=[],log=rkLog();
      [['a',u.ba],['b',u.bb]].forEach(([s,id])=>{
        const p=pv[s];if(rkIsGym(id)||!p)return;
        add.push({k:rkKey(),u:id,p,w,wk:W,d:day,at,bt:k,e:u.bk});
        if(S.trainers[id]){const m=log.filter(e=>e.u===id),t=rkTierNews(rkC(),id,rkPtsAt(m,W),rkPtsAt(m,W)+p);if(t){t.wk=W;tn.push(t);}}
      });
      rkSave({bt:rkBattles().concat([{k,a:u.ba,b:u.bb,win:u.bwin,kind:u.bk,w:String(u.bw||'').trim(),wk:W,d:day,at}]),log:log.concat(add,tn)});
      toast(tn.length?tn[0].w:'Battle saved.',true);
      u.ba='';u.bb='';u.bwin='';u.bw='';render();break;}
    case 'rk_btdel':rkSave({bt:rkBattles().filter(x=>x.k!==d.k),log:rkLog().filter(e=>e.bt!==d.k)});render();break;
    case 'rk_add':{
      const ids=Object.keys(u.who).filter(k=>u.who[k]);
      if(!ids.length){toast('Pick who earned the points.');break;}
      const C=rkC(),ev=C.events.find(e=>e[0]===u.ev)||C.events[0];
      const ps=String(u.pts||'').trim(),p=ps===''?ev[2]:Math.round(num(ps));
      if(!p){toast('Give a number of points.');break;}
      const w=String(u.why||'').trim()||ev[1];
      const mk=wk=>ids.map(id=>({k:rkKey(),u:id,p,w,wk,d:clToday()||'',at:Date.now(),e:ev[0]}));
      const news=(Cx,lg,list,wk)=>list.filter(id=>S.trainers[id]).map(id=>{const m=lg.filter(e=>e.u===id),t=rkTierNews(Cx,id,rkPtsAt(m,wk),rkPtsAt(m,wk)+p);if(t)t.wk=wk;return t;}).filter(Boolean);
      const tn=news(C,rkLog(),ids,W);
      rkSave({log:rkLog().concat(mk(W),tn)});
      if(u.both){const O=RK_C[u.c==='con'?'gym':'con'],od=(S.cond&&S.cond[O.d])||{},ob=(S.cond&&S.cond[O.b])||{},ow=num(ob.wk),olog=Array.isArray(od.log)?od.log:[],oid=ids.filter(id=>id.indexOf('n_')!==0);
        if(oid.length)edit('cd','conditions',O.d,Object.assign({},od,{log:olog.concat(mk(ow).filter(e=>oid.includes(e.u)).map(e=>Object.assign(e,{e:''})),news(O,olog,oid,ow))}));}
      toast(tn.length?tn[0].w:rkSgn(p)+' '+C.unit+' logged for '+ids.length+(ids.length===1?' trainer.':' trainers.'),true);
      u.who={};u.pts='';u.why='';render();break;}
    case 'rk_del':rkSave({log:rkLog().filter(e=>e.k!==d.k)});render();break;
    case 'rk_nadd':{
      const n=String(u.nn||'').trim();
      if(!n){toast('Give the rival a name.');break;}
      rkSave({npc:rkNpcs().concat([{k:rkKey(),n,p:Math.round(num(u.np)),s:u.ns||'',h:String(u.nh||'').trim()}])});
      u.nn='';u.np='';u.ns='';u.nh='';render();break;}
    case 'rk_ntopen':{if(NTS()[d.id]){S.ui.nt.open[d.id]=true;ntEnsure(d.id);S.ui.q.npc=ntName(NTS()[d.id]);setTab('npc');}break;}
    case 'rk_fold':{const f=rkFold(rkC()===RK_C.con?'con':'gym');toast(f?f+' rival'+(f===1?' takes':'s take')+' the place of field trainers. The board keeps its size.':'Every rival is already in the field.',true);render();break;}
    case 'rk_ndel':{
      const n=rkNpcs().find(x=>x.k===d.k);
      rkSave({npc:rkNpcs().filter(x=>x.k!==d.k),log:rkLog().filter(e=>e.u!=='n_'+d.k)});
      if(n&&n.b!=null&&bb.gone){const g=Object.assign({},bb.gone);delete g[n.b];const m=Object.assign({},bb.met||{});if(m['n_'+d.k]){delete m['n_'+d.k];m['b'+n.b]=true;}rkSaveB({gone:g,met:m});}
      render();break;}
    case 'rk_sample':rkSave({npc:rkNpcs().concat(rkC().sample.filter(s=>!rkNpcs().some(n=>n.n===s.n)).map(s=>Object.assign({k:rkKey()},s)))});render();break;
    case 'rk_bgfill':{{const EN=rkEngine();rkSave({npc:rkNpcs().map(r=>{const o=Object.assign({},r);if(o.b!=null){const x=EN.E['n_'+r.k];if(x)o.p=Math.max(0,Math.round(x.pts));delete o.b;}return o;})});}rkSaveB({seed:1+Math.floor(Math.random()*2e9),n:num(d.n)||300,wk:W,met:Object.fromEntries(Object.entries(bb.met||{}).filter(([k])=>k.indexOf('b')!==0)),gone:{}});const f=rkFold(rkC()===RK_C.con?'con':'gym');if(f)toast(f+' rival'+(f===1?' takes':'s take')+' the place of field trainers.',true);render();break;}
    case 'rk_bgclear':
      if(S.ui.confirm!=='rk_bgclear'){S.ui.confirm='rk_bgclear';toast('Press Remove the field again to remove all background trainers.');break;}
      S.ui.confirm=null;rkSaveB({seed:0,n:0,met:Object.fromEntries(Object.entries(bb.met||{}).filter(([k])=>k.indexOf('b')!==0)),gone:{}});render();break;
    case 'rk_week':{
      const hist=(Array.isArray(bb.hist)?bb.hist:[]).filter(e=>num(e.w)<=W);
      if(!hist.some(e=>num(e.w)===W))hist.push(rkSnap(W));
      rkSaveB({wk:W+1});
      rkSaveB({hist:hist.concat([rkSnap(W+1)]).slice(-80)});
      const dr=rkDraftHeads(W+1);if(dr.length)rkSave({heads:rkHeads().concat(dr).slice(-200)});
      const gr=rkC()===RK_C.gym?ntGrowAll('week',W+1):[];
      toast('Week '+(W+1)+': the results are in.'+(gr.length?' New teams: '+gr.join(', ')+'.':''),true);render();break;}
    case 'rk_unweek':{const w=Math.max(0,W-1);if(rkC()===RK_C.gym){const ug=ntUngrow(w);if(ug.length)toast('Week undone. Teams put back: '+ug.join(', ')+'.',true);}rkSaveB({wk:w,hist:(Array.isArray(bb.hist)?bb.hist:[]).filter(e=>num(e.w)<=w)});if(rkHeads().some(x=>num(x.wk)>w))rkSave({heads:rkHeads().filter(x=>num(x.wk)<=w)});render();break;}
    case 'rk_hpub':rkSave({heads:rkHeads().map(x=>x.k===d.k?Object.assign({},x,{pub:true,at:Date.now()}):x)});render();break;
    case 'rk_hpuball':{const at=Date.now();rkSave({heads:rkHeads().map((x,i)=>x.pub?x:Object.assign({},x,{pub:true,at:at+i}))});render();break;}
    case 'rk_hdel':rkSave({heads:rkHeads().filter(x=>x.k!==d.k)});render();break;
    case 'rk_met':{const m=Object.assign({},bb.met||{});if(m[d.id])delete m[d.id];else m[d.id]=true;rkSaveB({met:m});rkListRefresh();break;}
    case 'rk_track':{
      const i=num(d.i),f=bb.seed?rkGenField(num(bb.seed),num(bb.n)||300)[i]:null;if(!f)break;
      const k=rkKey(),m=Object.assign({},bb.met||{});
      if(m['b'+i]){delete m['b'+i];m['n_'+k]=true;}
      const cards=Object.assign({},rkCards());if(cards['b'+i]){cards['n_'+k]=cards['b'+i];delete cards['b'+i];}
      if(u.open==='b'+i)u.open='n_'+k;
      const ren=x=>x===('b'+i)?'n_'+k:x;
      rkSave({npc:rkNpcs().concat([{k,n:f.name,p:0,s:f.lab,h:f.home,b:i}]),card:cards,log:rkLog().map(e=>e.u==='b'+i?Object.assign({},e,{u:'n_'+k}):e),bt:rkBattles().map(x=>Object.assign({},x,{a:ren(x.a),b:ren(x.b)}))});
      rkSaveB({gone:Object.assign({},bb.gone||{},{[i]:true}),met:m});
      toast(f.name+' is now a tracked rival.',true);render();break;}
  }
}
function rkChange(t){
  const d=t.dataset;
  if(d.rkwho!=null){S.ui.rk.who[d.rkwho]=t.checked;return true;}
  if(!S.me.admin)return false;
  if(d.rkhead!=null){rkSave({heads:rkHeads().map(x=>x.k===d.rkhead?Object.assign({},x,{txt:String(t.value||'').trim()}):x)});return true;}
  if(d.rkgym!=null&&d.f){const cur=(S.cond&&S.cond.rk)||{},g=Object.assign({},cur.gym||{});g[d.rkgym]=Object.assign({},g[d.rkgym]||{},{[d.f]:String(t.value||'').trim()});edit('cd','conditions','rk',Object.assign({},cur,{gym:g}));render();return true;}
  if(d.rkcard!=null&&d.f){const cards=Object.assign({},rkCards());cards[d.rkcard]=Object.assign({},cards[d.rkcard]||{},{[d.f]:String(t.value||'').trim()});rkSave({card:cards});if(d.f==='mood')rkListRefresh();return true;}
  if(d.rklab!=null){rkSave({lab:Object.assign({},rkD().lab||{},{[d.rklab]:t.value})});render();return true;}
  if(d.ntpace!=null&&d.f){const v=d.f==='pw'?t.value:num(t.value);rkWith('gym',()=>rkSave({npc:rkNpcs().map(n=>{if(n.k!==d.ntpace)return n;const o=Object.assign({},n,{[d.f]:v});if(d.f==='pw'&&(!v||v==='party'))o.pt=0;return o;})}));ntBadgeChanged();render();return true;}
  if(d.ntlab!=null){const b=d.b==='con'?'con':'gym';rkWith(b,()=>rkSave({npc:rkNpcs().map(n=>n.k===d.k?Object.assign({},n,{s:t.value}):n)}));render();return true;}
  if(d.rknlab!=null){rkSave({npc:rkNpcs().map(n=>n.k===d.rknlab?Object.assign({},n,{s:t.value}):n)});render();return true;}
  return false;
}
/* end circuit rankings */
function calTab(){
  const today=clToday(),u=S.ui.cl,gm=!!S.me.admin;
  const view=u.view&&clParse(u.view+'-01')?u.view:(today||clStart()||CL_YEAR+'-07-01').slice(0,7);
  const first=clParse(view+'-01'),y=first.getUTCFullYear(),mo=first.getUTCMonth();
  const lead=(first.getUTCDay()+6)%7,len=new Date(Date.UTC(y,mo+1,0)).getUTCDate();
  const cells=[];for(let i=0;i<lead;i++)cells.push(null);for(let d=1;d<=len;d++)cells.push(clFmt(new Date(Date.UTC(y,mo,d))));
  const t=clTrip(),tripDays=new Set(t?t.log.map(e=>e.date).filter(Boolean):[]);
  const sel=u.sel&&clParse(u.sel)?u.sel:today;
  const prevM=clFmt(new Date(Date.UTC(y,mo-1,1))).slice(0,7),nextM=clFmt(new Date(Date.UTC(y,mo+1,1))).slice(0,7);
  const selEv=sel?clEventsOn(sel):[],selSail=sel?clSailingsOn(sel):[],selLog=t&&sel?t.log.filter(e=>e.date===sel):[];
  return h`<section class="panel"><div class="ph"><h2>Calendar</h2>${today?h`<span class="sub">Today: ${clNice(today,{y:1})}${clDayNo(today)>0?' · day '+clDayNo(today)+' of the journey':''}</span>`:h`<span class="sub">The GM has not set the date yet.</span>`}</div>
    ${gm?h`<div class="row"><label class="fld"><span class="fl">${today?'Change the date':'Set the date'}</span><input type="date" data-u="cl.date" value="${u.date||today||CL_YEAR+'-07-12'}" min="0001-01-01" max="9999-12-31" data-nr></label>
      <button class="btn sm" data-act="cl_set">Set</button>${today?h`<button class="btn sm primary" data-act="cl_next">Next day</button>`:''}</div>
      <div class="row"><label class="fld"><span class="fl">The journey began on</span><input type="date" data-u="cl.start" value="${u.start||clStart()||CL_YEAR+'-07-12'}" min="0001-01-01" max="9999-12-31" data-nr></label>
        <button class="btn sm" data-act="cl_setstart">Set</button><span class="sub">${clStart()?'Day 1 is '+clNice(clStart(),{y:1})+'.':'Day 1 starts on the first date you set.'}</span></div>
      <p class="sub">Season and moon follow the date. Next day also rolls the weather and starts the day at dawn. The journey's start only sets the day count.</p>`:''}
    <div class="calhd"><button class="btn sm ghost" data-act="cl_view" data-v="${prevM}" aria-label="Previous month">‹</button><b>${CL_MON[mo]} ${y}</b><button class="btn sm ghost" data-act="cl_view" data-v="${nextM}" aria-label="Next month">›</button>${today?h`<button class="btn sm ghost" data-act="cl_view" data-v="${today.slice(0,7)}">Today</button>`:''}</div>
    <div class="calgrid" role="grid">${['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(w=>h`<span class="calwd">${w}</span>`)}
      ${cells.map(s=>s?h`<button class="calday ${s===today?'today':''} ${s===sel?'sel':''} ${tripDays.has(s)?'trip':''}" data-act="cl_sel" data-v="${s}" aria-label="${clNice(s,{y:1})}"><span>${+s.slice(8)}</span>${clEventsOn(s).filter(e=>!e.bg&&clCatOn(e)).slice(0,2).map(e=>h`<i>${e.n}</i>`)}${clEventsOn(s).filter(e=>!e.bg&&clCatOn(e)).length>2?h`<i class="calmore">+${clEventsOn(s).filter(e=>!e.bg&&clCatOn(e)).length-2} more</i>`:''}${clEventsOn(s).some(e=>e.bg&&clCatOn(e))?h`<b class="calbg" title="${clEventsOn(s).filter(e=>e.bg).map(e=>e.n).join(', ')}"></b>`:''}</button>`:h`<span></span>`)}</div>
    ${sel?h`<div class="calsel"><b>${clNice(sel,{y:1})}</b>${clDayNo(sel)>0?h` <span class="sub">· day ${clDayNo(sel)}</span>`:''} <span class="sub">· ${CD_LAB[clSeason(sel)]} · ${CD_LAB[clMoon(sel)]}</span>
      ${selEv.length?h`<ul class="mini-list">${selEv.map(e=>h`<li>${e.n}${e.pl&&PD_BY[e.pl]?h` <span class="sub">· ${PD_BY[e.pl].name}</span>`:''}</li>`)}</ul>`:''}
      ${selSail.length?h`<p class="sub">Sailing: ${selSail.join('; ')}.</p>`:''}
      ${selLog.map(e=>h`<p class="sub">Day ${e.n} on the road: ${e.at}. ${e.wx}.</p>`)}</div>`:''}
  </section>
  ${clTripPanel()}
  <section class="panel"><div class="ph"><h2>Events</h2><span class="sub">${clEvents().length}</span></div>
    ${clEvents().length?clFilterBar():''}
    ${clEvents().length?h`<div id="callist">${clListHtml()}</div>`
      :h`<p class="sub">${gm?'Add the dates that matter: the Grand Festival, the Conference, festivals and deadlines.':'No events yet.'}</p>`}
    ${gm?h`<div class="mgd"><b>Add an event</b><div class="fgrid">
      <label class="fld"><span class="fl">Name</span><input type="text" data-u="cl.en" value="${u.en}" placeholder="Lily of the Valley Conference" data-nr></label>
      <label class="fld"><span class="fl">Starts</span><input type="date" data-u="cl.ed" value="${u.ed}" data-nr></label>
      <label class="fld"><span class="fl">Ends (optional)</span><input type="date" data-u="cl.ee" value="${u.ee||''}" data-nr></label>
      <label class="fld"><span class="fl">Category</span><select data-u="cl.ec" data-nr>${CL_CATS.map(([k,l])=>h`<option value="${k}" ${k===(u.ec||'other')?raw('selected'):''}>${l}</option>`)}</select></label>
      <label class="fld"><span class="fl">Where (optional)</span><select data-u="cl.ep" data-nr><option value="">Nowhere in particular</option>${PD.slice().sort(natural).map(f=>h`<option value="${f.id}" ${f.id===u.ep?raw('selected'):''}>${f.name}</option>`)}</select></label></div>
      <div class="row"><label class="row"><input type="checkbox" data-u="cl.ey" ${u.ey?raw('checked'):''} data-nr><span>Every year</span></label><button class="btn sm" data-act="cl_evadd">Add the event</button></div>
      <p class="sub">An event named with "Conference" runs the Valerian ferry from Sunyshore while it lasts.</p>
      ${clAllPresetNames().every(n=>clEvents().some(e=>e.n.toLowerCase()===n.toLowerCase()))?'':h`<div class="row"><button class="btn sm" data-act="cl_preset">Add Sinnoh's yearly calendar</button><span class="sub">The Conference, the Grand Festival, a monthly contest at every hall, the Valor Circuit, and the local festivals and seasons. Ones already here are skipped; change or remove any after.</span></div>`}</div>`:''}
  </section>`;
}
function clAct(b){
  const d=b.dataset,u=S.ui.cl,gm=!!S.me.admin;
  const fromBox=k=>{const el=document.querySelector('[data-u="cl.'+k+'"]');if(el&&el.value&&!u[k])u[k]=el.value;};
  if(d.act==='cl_set')fromBox('date');if(d.act==='cl_setstart')fromBox('start');
  switch(d.act){
    case 'cl_view':u.view=d.v;render();break;
    case 'cl_sel':u.sel=d.v;render();break;
    case 'cl_set':if(gm&&clParse(u.date)){clSetDate(u.date);u.view=u.date.slice(0,7);u.sel=u.date;render();}else toast('Pick a date first.');break;
    case 'cl_setstart':
      if(!gm)break;
      if(!clParse(u.start)){toast('Pick the start date first.');break;}
      edit('cd','conditions','start',u.start);
      if(!clToday())clSetDate(u.start);
      toast('The journey began on '+clNice(u.start,{y:1})+'.',true);u.start='';render();break;
    case 'cl_next':if(gm&&clToday()){const n=clAdd(clToday(),1);clSetDate(n,{dawn:true});u.sel=n;u.view=n.slice(0,7);render();}break;
    case 'cl_evadd':{
      if(!gm)break;
      const n=String(u.en||'').trim();
      if(!n||!clParse(u.ed)){toast('Give the event a name and a start date.');break;}
      const ev=clEvents().concat([{k:Math.random().toString(36).slice(2,9),n,d:u.ed,to:clParse(u.ee)?u.ee:'',y:!!u.ey,pl:u.ep||'',c:u.ec||'other'}]);
      edit('cd','conditions','ev',ev);u.en='';u.ed='';u.ee='';u.ey=false;u.ep='';render();break;}
    case 'cl_cat':S.ui.clf.cats[d.v]=!S.ui.clf.cats[d.v];render();break;
    case 'cl_catall':S.ui.clf.cats={};render();break;
    case 'cl_preset':{
      if(!gm)break;
      const y=(clToday()||clStart()||CL_YEAR+'-01-01').slice(0,4),ev=clEvents().slice();
      const have=n=>ev.some(e=>e.n.toLowerCase()===n.toLowerCase())||(n==='Lily of the Valley Conference'&&ev.some(clIsConf))||(n==='Grand Festival (Festival Week)'&&ev.some(clIsFest));
      let n=0;
      CL_PRESET.forEach(([name,a,b,pl,bg])=>{if(have(name))return;ev.push({k:Math.random().toString(36).slice(2,9),n:name,d:y+'-'+a,to:b?y+'-'+b:'',y:true,pl:PD_BY[pl]?pl:'',bg:!!bg});n++;});
      CL_CONTESTS.forEach(([name,key])=>{const hl=CT_HALLS.find(x=>x[0]===key);if(!hl||!hl[5]||have(name))return;ev.push({k:Math.random().toString(36).slice(2,9),n:name,d:y+'-01-01',to:'',y:false,mr:hl[5],sched:hl[6],pl:hl[2]});n++;});
      edit('cd','conditions','ev',ev);toast(n?'Added '+n+' yearly events.':'They are all on the calendar already.',true);render();break;}
    case 'cl_evdel':if(gm){edit('cd','conditions','ev',clEvents().filter(e=>e.k!==d.v));render();}break;
    case 'cl_start':{
      if(!gm)break;
      const t=clTripFromPlan();
      if(!t){toast('Plan a way first.');break;}
      edit('cd','conditions','trip',t);toast('Trip started. Roll each day as the party travels.',true);render();break;}
    case 'cl_roll':clRollDay();break;
    case 'cl_end':if(gm){edit('cd','conditions','trip',null);render();}break;
    case 'cl_journal':{
      const t=clTrip();if(!gm||!t||!t.log.length)break;
      const id=S.db.collection('journal').doc().id;
      newDoc('j',id,{session:num(S.meta.session)||1,title:'On the road: '+trName(t.from)+' to '+trName(t.to),body:clTripText(t),place:PD_BY[t.to]?PD_BY[t.to].name:'',addedBy:S.me.id,createdAt:Date.now()});
      toast('The trip log is in the journal.',true);break;}
    default:break;
  }
}

/* ---------- Wild zones: semi-route and off-route encounter tables ----------
   Every wild route has up to three zones: the road (primary route), the semi-route just off it, and the off-route beyond
   the markers. Going off the road is advised against below a badge tier but never stopped. The primary table is the route's
   existing table; the GM loads a "Semi-route" and an "Off-route" table onto each route from these pools (they become extra
   tables on the route's GM page, kept in gm/place_<id> like the rest). Each pool row: [species, weight, group low, group high,
   rarity C/U/R, alpha %]. A route draws from one to three biomes; the first counts most. */
const ZN_POOL={
  forest:{
    semi:[['Kricketune',12,1,2,'C'],['Staravia',10,2,4,'C'],['Roselia',8,1,2,'U'],['Murkrow',7,1,3,'U'],['Pachirisu',6,1,2,'C'],['Beautifly',5,1,1,'U'],['Dustox',5,1,1,'U'],['Teddiursa',5,1,2,'U'],['Noctowl',5,1,1,'U'],['Cherrim',4,1,2,'U'],['Ursaring',3,1,1,'R',8],['Breloom',3,1,1,'R']],
    off:[['Ursaring',10,1,2,'U',10],['Staraptor',8,1,2,'U',6],['Vespiquen',7,1,1,'U',10],['Breloom',6,1,1,'U'],['Noctowl',7,1,1,'U'],['Roserade',5,1,1,'R'],['Ariados',6,1,2,'U'],['Honchkrow',4,1,1,'R',12],['Heracross',4,1,1,'R'],['Pinsir',3,1,1,'R'],['Yanmega',3,1,1,'R'],['Tangrowth',2,1,1,'R']]
  },
  grass:{
    semi:[['Staravia',10,2,4,'C'],['Bibarel',10,1,3,'C'],['Kricketune',8,1,2,'C'],['Luxio',7,2,3,'U'],['Ponyta',7,2,4,'U'],['Buneary',6,1,2,'C'],['Glameow',6,1,2,'C'],['Tauros',5,3,6,'U'],['Miltank',4,1,3,'U'],['Girafarig',3,1,1,'R'],['Lopunny',2,1,1,'R']],
    off:[['Luxray',10,1,3,'U',10],['Staraptor',9,1,2,'U',6],['Tauros',8,4,8,'U',8],['Rapidash',6,2,4,'U',6],['Purugly',5,1,1,'U'],['Miltank',5,2,4,'U'],['Lopunny',4,1,1,'R'],['Girafarig',4,1,1,'R'],['Arcanine',2,1,1,'R',10]]
  },
  flower:{
    semi:[['Combee',10,3,6,'C'],['Cherubi',9,1,3,'C'],['Roselia',8,1,2,'U'],['Burmy',7,1,2,'C'],['Mothim',5,1,1,'U'],['Wormadam',4,1,1,'U'],['Pachirisu',5,1,2,'C'],['Gloom',5,1,2,'U'],['Cherrim',4,1,2,'U']],
    off:[['Vespiquen',9,1,1,'U',12],['Roserade',7,1,1,'U'],['Cherrim',7,2,4,'U'],['Vileplume',5,1,1,'U'],['Bellossom',4,1,2,'U'],['Heracross',4,1,1,'R'],['Tropius',2,1,1,'R',8]]
  },
  coast:{
    semi:[['Wingull',10,2,5,'C'],['Pelipper',9,1,2,'C'],['Shellos',9,2,4,'C'],['Buizel',8,1,2,'C'],['Tentacool',8,2,4,'C'],['Finneon',6,1,3,'U'],['Chatot',5,1,2,'U'],['Remoraid',5,2,4,'U'],['Mantyke',3,1,1,'R']],
    off:[['Gastrodon',10,1,2,'U'],['Tentacruel',8,1,3,'U',8],['Floatzel',8,1,2,'U'],['Lumineon',6,1,2,'U'],['Pelipper',6,1,3,'C'],['Octillery',4,1,1,'U'],['Sharpedo',4,2,4,'R',10],['Mantine',3,1,1,'R'],['Gyarados',3,1,1,'R',12],['Lapras',1,1,1,'R']]
  },
  marsh:{
    semi:[['Croagunk',10,1,2,'C'],['Skorupi',9,1,2,'C'],['Quagsire',8,1,2,'C'],['Stunky',6,1,2,'C'],['Carnivine',6,1,1,'U'],['Yanma',6,1,2,'U'],['Bibarel',5,1,2,'C'],['Marill',5,1,2,'C'],['Gastrodon',4,1,1,'U'],['Tangela',4,1,1,'U']],
    off:[['Toxicroak',10,1,2,'U',10],['Drapion',8,1,1,'U',10],['Carnivine',8,1,2,'U'],['Skuntank',5,1,2,'U'],['Quagsire',6,1,3,'C'],['Yanmega',5,1,1,'R'],['Gastrodon',5,1,2,'U'],['Azumarill',4,1,2,'U'],['Arbok',4,1,1,'U'],['Tangrowth',3,1,1,'R'],['Kecleon',2,1,1,'R']]
  },
  mountain:{
    semi:[['Geodude',10,2,4,'C'],['Graveler',8,1,2,'C'],['Machoke',7,1,2,'U'],['Ponyta',6,1,3,'U'],['Meditite',6,1,1,'U'],['Bronzor',5,1,2,'U'],['Hippopotas',5,1,2,'U'],['Chingling',4,1,1,'U'],['Nosepass',4,1,1,'U'],['Bonsly',4,1,1,'U'],['Gible',2,1,1,'R'],['Riolu',2,1,1,'R'],['Absol',2,1,1,'R']],
    off:[['Golem',7,1,2,'U',8],['Machamp',6,1,2,'U',8],['Medicham',5,1,1,'U'],['Bronzong',5,1,1,'U'],['Sudowoodo',5,1,1,'U'],['Hippowdon',4,1,2,'U',8],['Rhydon',4,1,1,'U',8],['Absol',4,1,1,'R'],['Gabite',3,1,1,'R',8],['Probopass',3,1,1,'R'],['Steelix',3,1,1,'R',10],['Lucario',2,1,1,'R'],['Garchomp',1,1,1,'R',15]]
  },
  cave:{
    semi:[['Golbat',12,2,5,'C'],['Geodude',10,2,4,'C'],['Graveler',8,1,2,'C'],['Onix',6,1,1,'U'],['Bronzor',5,1,2,'U'],['Machop',5,1,2,'C'],['Clefairy',4,1,3,'U'],['Chingling',4,1,1,'U'],['Nosepass',4,1,1,'U'],['Gible',3,1,1,'R'],['Sableye',2,1,1,'R']],
    off:[['Crobat',7,1,3,'U',8],['Golem',6,1,2,'U',8],['Steelix',5,1,1,'R',10],['Rhydon',4,1,1,'U'],['Gabite',4,1,1,'R',8],['Probopass',3,1,1,'R'],['Sableye',3,1,1,'R'],['Clefable',2,1,1,'R'],['Garchomp',1,1,1,'R',15]]
  },
  snow:{
    semi:[['Snover',12,2,3,'C'],['Swinub',9,2,4,'C'],['Snorunt',9,1,2,'C'],['Sneasel',7,1,3,'U'],['Piloswine',5,1,2,'U'],['Delibird',5,1,2,'U'],['Machoke',4,1,1,'U'],['Noctowl',4,1,1,'U'],['Glalie',3,1,1,'R'],['Froslass',3,1,1,'R']],
    off:[['Abomasnow',9,1,2,'U',12],['Weavile',7,2,4,'U',10],['Mamoswine',6,1,3,'R',12],['Piloswine',6,2,4,'U'],['Glalie',5,1,1,'U'],['Froslass',5,1,1,'R'],['Sneasel',5,2,3,'U'],['Absol',3,1,1,'R'],['Glaceon',1,1,1,'R']]
  },
  volcanic:{
    semi:[['Slugma',10,1,3,'C'],['Numel',8,2,4,'C'],['Ponyta',8,1,3,'C'],['Houndour',8,2,3,'U'],['Geodude',8,2,3,'C'],['Graveler',6,1,2,'C'],['Torkoal',4,1,1,'U'],['Magby',4,1,1,'U']],
    off:[['Houndoom',8,2,3,'U',10],['Magcargo',8,1,2,'U'],['Camerupt',6,1,2,'U',8],['Golem',6,1,2,'U'],['Rapidash',5,1,3,'U'],['Torkoal',4,1,1,'U'],['Magmar',4,1,1,'R'],['Magmortar',2,1,1,'R',10]]
  },
  lake:{
    semi:[['Psyduck',10,1,3,'C'],['Buizel',10,1,2,'C'],['Bibarel',8,1,3,'C'],['Marill',6,1,2,'C'],['Goldeen',6,1,3,'C'],['Barboach',6,1,2,'U'],['Wooper',5,1,2,'C'],['Shellos',5,1,3,'C'],['Golduck',4,1,1,'U']],
    off:[['Floatzel',8,1,2,'U'],['Golduck',8,1,2,'U'],['Whiscash',6,1,1,'U',10],['Seaking',6,1,2,'U'],['Quagsire',6,1,2,'C'],['Azumarill',5,1,2,'U'],['Gyarados',5,1,1,'R',12],['Lapras',1,1,1,'R'],['Milotic',1,1,1,'R']]
  },
  ghost:{
    semi:[['Murkrow',8,2,4,'C'],['Gastly',8,1,2,'C'],['Duskull',8,1,1,'C'],['Haunter',6,1,1,'U'],['Misdreavus',6,1,1,'U'],['Drifloon',6,1,2,'U'],['Stunky',5,1,2,'C']],
    off:[['Dusclops',7,1,1,'U'],['Drifblim',6,1,2,'U'],['Honchkrow',6,1,1,'R',12],['Gengar',5,1,1,'R',10],['Mismagius',4,1,1,'R'],['Haunter',5,1,2,'U'],['Spiritomb',1,1,1,'R']]
  },
  moor:{
    semi:[['Ponyta',10,2,4,'C'],['Swablu',8,2,4,'C'],['Staravia',8,2,3,'C'],['Tauros',6,3,6,'U'],['Scyther',4,1,1,'R'],['Kricketune',6,1,2,'C'],['Hoothoot',6,1,2,'C'],['Stunky',5,1,2,'C']],
    off:[['Rapidash',9,2,4,'U',8],['Altaria',8,1,2,'U',8],['Tauros',8,4,8,'U',8],['Staraptor',6,1,2,'U'],['Scyther',4,1,1,'R',8],['Noctowl',6,1,1,'U'],['Skuntank',4,1,1,'U'],['Absol',2,1,1,'R']]
  },
  power:{
    semi:[['Shinx',10,2,4,'C'],['Luxio',8,1,3,'U'],['Pachirisu',8,1,2,'C'],['Magnemite',9,2,4,'C'],['Voltorb',6,1,2,'C'],['Elekid',4,1,1,'U'],['Raichu',3,1,1,'R']],
    off:[['Luxray',10,1,3,'U',10],['Magneton',8,1,2,'U'],['Electabuzz',5,1,1,'U'],['Electrode',5,1,2,'U'],['Raichu',4,1,1,'R'],['Electivire',2,1,1,'R',10],['Magnezone',2,1,1,'R'],['Rotom',1,1,1,'R']]
  }
};
/* each route: [biomes in order of weight, has a semi-route, has an off-route]. Paved roads near towns have no off-route left. */
const ZN_ROUTES={
  'route-201':[['grass','lake'],1,1],'route-202':[['forest','grass'],1,0],'route-203':[['mountain','cave'],1,1],'route-204':[['flower','grass'],1,0],
  'route-205':[['lake','forest'],1,1],'route-206':[['mountain','grass'],1,1],'route-207':[['cave'],1,1],'route-208':[['grass','mountain'],1,1],
  'route-209':[['grass','ghost','flower'],1,1],'route-210':[['moor','ghost','mountain'],1,1],'route-211':[['mountain','snow','cave'],1,1],'route-212':[['marsh','lake'],1,1],
  'route-213':[['coast'],1,1],'route-214':[['grass','lake'],1,1],'route-215':[['mountain','grass'],1,1],'route-216':[['snow','mountain'],1,1],
  'route-217':[['snow'],1,1],'route-218':[['grass','coast'],1,0],'route-219':[['coast'],1,0],'route-220':[['coast','grass'],1,1],
  'route-221':[['grass','coast'],1,0],'route-222':[['coast','grass'],1,1],'route-224':[['forest','flower'],1,1],'route-225':[['power','grass'],1,1],
  'route-226':[['snow','grass','mountain'],1,1],'route-227':[['cave','lake'],1,1],'route-228':[['snow','forest'],1,1],'route-229':[['snow','flower'],1,1],
  'route-230':[['forest'],1,1],'route-231':[['moor'],1,1],'route-232':[['coast'],1,1],'route-233':[['flower','grass'],1,0],
  'route-234':[['flower','grass'],1,1],'route-235':[['mountain','lake'],1,1],'route-236':[['grass'],1,0],'route-237':[['mountain','grass'],1,0],
  'route-238':[['forest'],1,1],'route-239':[['mountain','lake'],1,1],'route-240':[['grass'],1,0],'route-241':[['lake','grass'],1,0],
  'route-242':[['grass','marsh'],1,0],'battle-resort-route-225':[['forest'],1,1],'battle-resort-route-226':[['moor','lake'],1,1],
  'battle-resort-route-227':[['volcanic'],1,1],'battle-resort-route-228':[['mountain','coast'],1,1],'battle-resort-route-229':[['coast'],1,1]
};
const ZN_TIER=[1,2,2,1];
function znTable(id,zone){
  const r=ZN_ROUTES[id];if(!r)return null;
  const f=PD_BY[id],dg=f?((String(plFact(f,'Danger')).match(/★+/)||[''])[0]).length||1:1;
  const by=new Map();
  r[0].forEach((b,i)=>{
    const m=[1,0.6,0.4][i]||0.3;
    (ZN_POOL[b][zone]||[]).forEach(([sp,w,lo,hi,bk,al])=>{
      const o=by.get(sp);
      if(o){o.w+=w*m;}else by.set(sp,{sp,w:w*m,lo,hi,bk,al:al||0});
    });
  });
  const rows=[...by.values()].sort((a,b)=>b.w-a.w).slice(0,12).map(o=>Object.assign({sp:o.sp,w:Math.max(1,Math.round(o.w)),lo:o.lo,hi:o.hi,bk:o.bk},o.al?{al:o.al}:{}));
  return {nm:zone==='semi'?'Semi-route':'Off-route',dg:Math.min(5,dg+(zone==='semi'?1:2)),enc:rows,em:[],ev:[]};
}
/* the route pages say which zones each route has */
Object.keys(ZN_ROUTES).forEach(id=>{
  const f=PD_BY[id],r=ZN_ROUTES[id];if(!f)return;
  f.facts.push(['Wild zones',r[2]?'Road, semi-route and off-route. Off the road is advised from Pathfinder (2+ badges); the off-route from Warden (5+). Not enforced, but Rangers only come with a filed route plan.':'Road and semi-route only: farms and towns have taken the rest. The semi-route is advised from Pathfinder (2+ badges).']);
});
function znLoad(){
  if(!S.me.admin)return;
  let n=0;
  Object.keys(ZN_ROUTES).forEach(id=>{
    const g=encGp(id),ex=Array.isArray(g.ex)?g.ex.slice():[];
    const add=[];
    if(ZN_ROUTES[id][1]&&!ex.some(e=>e&&e.nm==='Semi-route'))add.push(znTable(id,'semi'));
    if(ZN_ROUTES[id][2]&&!ex.some(e=>e&&e.nm==='Off-route'))add.push(znTable(id,'off'));
    if(!add.length)return;
    edit('gp',id,'ex',ex.concat(add.filter(Boolean)));n+=add.length;
  });
  toast(n?'Added '+n+' semi-route and off-route tables.':'Every route already has its zone tables.',true);
  render();
}
function znMissing(){return Object.keys(ZN_ROUTES).reduce((a,id)=>{const ex=Array.isArray(encGp(id).ex)?encGp(id).ex:[];return a+(ZN_ROUTES[id][1]&&!ex.some(e=>e&&e.nm==='Semi-route')?1:0)+(ZN_ROUTES[id][2]&&!ex.some(e=>e&&e.nm==='Off-route')?1:0);},0);}


/* ---------- Fishing: a "Cast a line" option at every place with water ----------
   Each water kind has its own catch list [species, weight, rarity]. The GM Desk adds a fishing option to the main table of
   every place listed in FS_PLACES that has no fishing option yet (kept in gm/place_<id> like the rest, so players never see
   the list). The place page tells the players that fishing is possible there, and needs a Fishing Kit. */
const FS_POOL={
  sea:[['Magikarp',22,'C'],['Tentacool',18,'C'],['Finneon',14,'C'],['Remoraid',10,'U'],['Shellos',10,'C'],['Horsea',6,'U'],['Mantyke',5,'U'],['Chinchou',4,'U'],['Qwilfish',3,'U'],['Lumineon',3,'U'],['Octillery',2,'U'],['Tentacruel',2,'U'],['Gyarados',1,'R']],
  lake:[['Magikarp',30,'C'],['Goldeen',20,'C'],['Barboach',16,'C'],['Psyduck',8,'C'],['Wooper',6,'C'],['Seaking',6,'U'],['Whiscash',4,'U'],['Shellos',4,'U'],['Gyarados',2,'R']],
  river:[['Magikarp',28,'C'],['Goldeen',22,'C'],['Barboach',14,'C'],['Wooper',8,'C'],['Psyduck',6,'C'],['Seaking',6,'U'],['Remoraid',4,'U'],['Whiscash',3,'U'],['Gyarados',2,'R']],
  stream:[['Magikarp',30,'C'],['Goldeen',26,'C'],['Barboach',12,'C'],['Wooper',10,'C'],['Psyduck',8,'C'],['Seaking',4,'U']],
  marsh:[['Barboach',22,'C'],['Magikarp',20,'C'],['Wooper',18,'C'],['Goldeen',10,'C'],['Quagsire',8,'U'],['Whiscash',6,'U'],['Shellos',6,'C'],['Gyarados',2,'R']],
  pond:[['Magikarp',35,'C'],['Goldeen',22,'C'],['Wooper',12,'C'],['Psyduck',10,'C'],['Barboach',10,'C'],['Marill',5,'C'],['Seaking',4,'U']],
  hot:[['Magikarp',25,'C'],['Goldeen',20,'C'],['Psyduck',18,'C'],['Wooper',12,'C'],['Barboach',10,'C'],['Marill',8,'C'],['Golduck',3,'U']],
  ice:[['Magikarp',30,'C'],['Goldeen',20,'C'],['Barboach',14,'C'],['Seaking',10,'U'],['Whiscash',8,'U'],['Gyarados',3,'R']],
  cave:[['Magikarp',30,'C'],['Barboach',20,'C'],['Goldeen',18,'C'],['Whiscash',8,'U'],['Seaking',6,'U'],['Gyarados',2,'R']]
};
const FS_LB={sea:'Sea',lake:'Lake',river:'River',stream:'Stream',marsh:'Marsh',pond:'Pond',hot:'Hot springs',ice:'Ice hole',cave:'Cave pool'};
const FS_WORD={sea:'sea',lake:'lake',river:'river',stream:'stream',marsh:'marsh',pond:'pond',hot:'hot-spring pool',ice:'ice-hole',cave:'underground pool'};
const FS_PLACES={
  'snowpoint-city':['sea'],'lilypad-town':['hot'],'sandalstraw-town':['sea','river'],'iron-island':['sea'],'battle-resort-fight-area':['sea'],
  'battle-resort-survival-area':['marsh','sea'],'resort-area':['sea'],'squallville':['sea'],'veilstone-city':['sea'],'dandelion-island':['sea'],
  'champions-port':['sea'],'elite-four-island':['sea'],'chocovine-town':['sea'],'michina-town':['pond'],'crown-city':['sea','lake'],
  'canalave-city':['sea'],'alamos-town':['lake'],'majolica-town':['pond'],'brussel-town':['river'],'arrowroot-town':['river'],'camellia-town':['sea'],
  'sunyshore-city':['sea'],'neighborly-town':['lake','sea'],'daybreak-town':['sea'],'pastoria-city':['marsh','sea'],'sage-town':['sea'],'greenstation-town':['marsh'],
  'acuity-lakefront':['ice'],'fullmoon-island':['sea','pond'],'newmoon-island':['sea'],'lucario-kingdom':['sea'],'battle-resort-port':['sea'],
  'lily-of-the-valley-conference':['sea'],'206-bridge':['river'],'valley-windworks':['pond'],'mt-coronet-and-spear-pillar':['cave'],
  'gracidea-flower-garden':['stream'],'grand-marsh':['marsh'],'safari-zone':['marsh'],'valor-lakefront-and-grand-festival':['lake'],
  'verity-lakefront':['lake'],'sandgem-port':['sea'],'south-sinnoh-port':['sea'],
  'route-201':['pond'],'route-202':['stream'],'route-205':['river'],'route-206':['river'],'route-208':['river'],'route-212':['marsh'],'route-213':['sea'],
  'route-214':['lake'],'route-217':['ice'],'route-218':['sea'],'route-219':['sea'],'route-220':['sea'],'route-221':['marsh','sea'],'route-222':['sea'],
  'route-224':['lake'],'route-225':['sea'],'route-226':['sea'],'route-227':['cave'],'route-230':['river'],'route-231':['lake','sea'],'route-232':['sea'],
  'route-233':['sea','river'],'route-234':['sea'],'route-235':['lake'],'route-237':['pond'],'route-238':['stream'],'route-239':['stream'],'route-241':['pond'],
  'route-242':['marsh'],'battle-resort-route-225':['stream'],'battle-resort-route-226':['marsh','sea'],'battle-resort-route-227':['stream'],
  'battle-resort-route-228':['stream','sea'],'battle-resort-route-229':['sea']
};
/* extra catches and notes for particular places */
const FS_EXTRA={'mt-coronet-and-spear-pillar':{cave:[['Feebas',6,'R']]}};
const FS_NOTE={
  'newmoon-island':'Everything within five kilometers of the coast is the League’s Closed Water. Fishing here is illegal, and Rangers patrol it.',
  'grand-marsh':'Fishing only from the boardwalks, with a day permit from the marsh office.',
  'safari-zone':'Fishing is allowed only at the marked wetland pools, under the Safari Zone’s rules.',
  'acuity-lakefront':'Ice fishing: cut a hole through the ice, or fish the open water at the edge.',
  'route-217':'Ice fishing through the frozen lake. The ice groans at night.',
  'mt-coronet-and-spear-pillar':'The underground lake inside the mountain. A few spots hold Feebas, and they shift from year to year.',
  'route-227':'The warm, foggy pools in the middle of the tunnel.',
  'lilypad-town':'The open pools that never freeze. Ask before casting into a bathing pool.'
};
const fsHas=T=>(Array.isArray(T&&T.em)?T.em:[]).some(m=>m&&Array.isArray(m.fish));
function fsMods(id){
  return (FS_PLACES[id]||[]).map(k=>{
    const ex=(FS_EXTRA[id]&&FS_EXTRA[id][k])||[];
    const list=FS_POOL[k].concat(ex).map(([s,w,bk])=>({s,w,bk}));
    return {id:'fish-'+k,lb:'Fishing · '+FS_LB[k],fish:list,fx:[],tx:'Needs a Fishing Kit. Cast a line to roll a catch.'+(FS_NOTE[id]?' '+FS_NOTE[id]:'')};
  });
}
const fsMissingIds=()=>Object.keys(FS_PLACES).filter(id=>PD_BY[id]&&!fsHas(encGp(id)));
function fsLoad(){
  if(!S.me.admin)return;
  const ids=fsMissingIds();
  ids.forEach(id=>{const g=encGp(id),em=Array.isArray(g.em)?g.em.slice():[];edit('gp',id,'em',em.concat(fsMods(id)));});
  toast(ids.length?'Added fishing to '+ids.length+' places.':'Every place with water already has fishing.',true);
  render();
}
/* the place pages tell the players where they can fish */
Object.keys(FS_PLACES).forEach(id=>{
  const f=PD_BY[id],k=FS_PLACES[id];if(!f)return;
  const w=k.map(x=>FS_WORD[x]);
  const what=(w.length>1?w.slice(0,-1).join(', ')+' and '+w[w.length-1]:w[0]);
  f.facts.push(['Fishing',id==='newmoon-island'?'Possible, but the coast is the League’s Closed Water: fishing there is illegal.':what.charAt(0).toUpperCase()+what.slice(1)+' fishing. Bring a Fishing Kit.']);
});


/* ---------- Berry foraging on the routes ----------
   Each route's terrain (ZN_ROUTES) decides which berries grow there; the season on the Today bar decides which are
   ripe. Rows: [berry, weight, tier C/U/R, seasons (p spring, s summer, a autumn, w winter)]. A Nature check sets how
   much is found (Poor, Good, Great); autumn is harvest time (+1) and winter is lean (−1). Tiers follow the
   Botanist's lists in the Player's Handbook: common, uncommon (Fruit Seeker), rare (Rare Berry Seeker). */
const FG_POOL={
  forest:[['Oran',10,'C','psa'],['Pecha',8,'C','ps'],['Cheri',7,'C','ps'],['Razz',5,'C','ps'],['Chesto',6,'C','saw'],['Bluk',6,'C','sa'],['Persim',6,'C','a'],['Rawst',5,'C','psa'],['Aspear',3,'C','aw'],['Sitrus',3,'U','a'],['Mago',2,'U','a'],['Lum',1,'U','sa'],['Leppa',1,'R','a']],
  grass:[['Oran',10,'C','psa'],['Razz',8,'C','ps'],['Bluk',6,'C','sa'],['Nanab',6,'C','s'],['Pecha',6,'C','ps'],['Pinap',5,'C','s'],['Wepear',5,'C','sa'],['Cheri',5,'C','ps'],['Aspear',3,'C','aw'],['Sitrus',2,'U','a'],['Pomeg',2,'U','a'],['Qualot',1,'U','s'],['Lansat',1,'R','a']],
  flower:[['Pecha',10,'C','ps'],['Cheri',8,'C','ps'],['Razz',7,'C','ps'],['Pinap',6,'C','s'],['Nanab',5,'C','s'],['Qualot',3,'U','ps'],['Hondew',2,'U','s'],['Lum',2,'U','ps'],['Grepa',2,'U','sa'],['Petaya',1,'R','s']],
  coast:[['Oran',8,'C','psa'],['Rawst',6,'C','sa'],['Watmel',6,'C','s'],['Pinap',5,'C','s'],['Nomel',5,'C','sa'],['Aspear',3,'C','aw'],['Wiki',3,'U','sa'],['Kelpsy',3,'U','sa'],['Passho',2,'U','sa'],['Wacan',2,'U','s'],['Starf',1,'R','s']],
  marsh:[['Rawst',8,'C','psa'],['Pecha',6,'C','ps'],['Rabuta',6,'C','sa'],['Cornn',5,'C','sa'],['Wepear',5,'C','sa'],['Chesto',3,'C','aw'],['Kebia',3,'U','sa'],['Rindo',3,'U','ps'],['Passho',2,'U','s'],['Payapa',1,'U','a'],['Lansat',1,'R','a']],
  mountain:[['Aspear',8,'C','aw'],['Chesto',7,'C','saw'],['Cheri',6,'C','ps'],['Persim',6,'C','a'],['Durin',4,'C','a'],['Magost',4,'C','sa'],['Shuca',2,'U','sa'],['Charti',2,'U','sa'],['Tamato',2,'U','a'],['Ganlon',1,'R','a']],
  cave:[['Chesto',8,'C','psaw'],['Rawst',5,'C','psaw'],['Magost',4,'C','psaw'],['Babiri',2,'U','psaw'],['Kasib',2,'U','psaw'],['Charti',2,'U','psaw'],['Leppa',1,'R','psaw']],
  snow:[['Aspear',10,'C','saw'],['Chesto',5,'C','aw'],['Persim',4,'C','a'],['Nomel',4,'C','sa'],['Oran',4,'C','s'],['Spelon',3,'C','sa'],['Cheri',3,'C','s'],['Yache',3,'U','aw'],['Belue',2,'C','sa'],['Kee',1,'R','w']],
  volcanic:[['Rawst',10,'C','psaw'],['Cheri',6,'C','ps'],['Spelon',6,'C','sa'],['Occa',3,'U','psaw'],['Tamato',3,'U','sa'],['Figy',3,'U','sa'],['Liechi',1,'R','sa']],
  lake:[['Oran',8,'C','psa'],['Pecha',6,'C','ps'],['Wepear',6,'C','sa'],['Rawst',5,'C','psa'],['Razz',4,'C','ps'],['Nanab',4,'C','s'],['Watmel',3,'C','s'],['Aspear',3,'C','aw'],['Kelpsy',3,'U','sa'],['Passho',2,'U','s'],['Lum',1,'U','s']],
  ghost:[['Chesto',8,'C','psaw'],['Persim',6,'C','a'],['Bluk',6,'C','sa'],['Kasib',3,'U','aw'],['Colbur',2,'U','aw'],['Custap',1,'R','a']],
  moor:[['Oran',6,'C','psa'],['Razz',6,'C','ps'],['Bluk',6,'C','sa'],['Persim',4,'C','a'],['Aspear',3,'C','aw'],['Pomeg',3,'U','a'],['Hondew',3,'U','sa'],['Aguav',3,'U','sa'],['Salac',1,'R','sa']],
  power:[['Cheri',8,'C','ps'],['Oran',6,'C','psa'],['Pinap',5,'C','s'],['Aspear',3,'C','aw'],['Wacan',3,'U','sa'],['Shuca',2,'U','sa'],['Micle',1,'R','sa']]
};
const FG_SEASON={spring:'p',summer:'s',autumn:'a',winter:'w'};
const FG_TIER={C:'Common',U:'Uncommon',R:'Rare'};
/* what grows on a route this season: [{b, w, t}] merged across its terrains, the first terrain counting most */
function fgPool(id,season){
  const r=ZN_ROUTES[id];if(!r)return [];
  const k=FG_SEASON[season]||'s',by=new Map();
  r[0].forEach((bm,i)=>{const m=[1,0.6,0.4][i]||0.3;(FG_POOL[bm]||[]).forEach(([b,w,t,ss])=>{if(ss.indexOf(k)<0)return;const o=by.get(b);if(o)o.w+=w*m;else by.set(b,{b,w:w*m,t});});});
  return [...by.values()].sort((a,b)=>b.w-a.w);
}
const fgD=n=>1+Math.floor(Math.random()*n);
/* q: 'poor' (failed Nature check), 'good' (success), 'great' (beat it by 5 or more) */
function fgRoll(id,season,q){
  const all=fgPool(id,season);
  const pool=q==='great'?all:q==='good'?all.filter(x=>x.t!=='R'):all.filter(x=>x.t==='C');
  let n=q==='great'?fgD(3)+1:q==='good'?fgD(3):(Math.random()<0.5?1:0);
  if(season==='autumn'&&q!=='poor')n+=1;
  if(season==='winter')n=Math.max(0,n-1);
  const got=new Map();
  for(let i=0;i<n&&pool.length;i++){const pick=encPickW(pool.map(x=>Object.assign({},x)));if(pick)got.set(pick.b,(got.get(pick.b)||0)+1);}
  return {q,season,list:[...got.entries()].map(([b,c])=>({b,c,t:(all.find(x=>x.b===b)||{}).t||'C'}))};
}
function fgPanel(f){
  if(!ZN_ROUTES[f.id])return '';
  const c=cdGet(),all=fgPool(f.id,c.s),u=S.ui.fg=S.ui.fg||{};
  const res=u.id===f.id?u.res:null,mine=S.trainers[S.me.id]&&canEditT(S.me.id);
  const names=t=>all.filter(x=>x.t===t).map(x=>x.b);
  return h`<section class="panel"><div class="ph"><h2>Berry foraging</h2><span class="pill">${CD_LAB[c.s]}</span></div>
    ${all.length?h`<p class="sub">Ripe here this ${CD_LAB[c.s].toLowerCase()}: <b>${names('C').join(', ')||'nothing common'}</b>${names('U').length?h`. Less often: ${names('U').join(', ')}`:''}${names('R').length?'. Now and then, something rare.':'.'}</p>`
      :h`<p class="sub">Nothing ripens here in ${CD_LAB[c.s].toLowerCase()}.</p>`}
    <p class="sub">Spend an hour and make a Nature check. A failed check finds little; a success finds a few; beating the target by 5 or more finds more, and maybe something uncommon or rare. Autumn is harvest time (one extra berry); winter is lean (one fewer). Botanists: Berry Finder, Fruit Seeker and Rare Berry Seeker let you name the berry instead (Player's Handbook).</p>
    <div class="row"><button class="btn sm" data-act="fg_roll" data-id="${f.id}" data-q="poor" ${all.length?'':raw('disabled')}>Forage · failed check</button><button class="btn sm" data-act="fg_roll" data-id="${f.id}" data-q="good" ${all.length?'':raw('disabled')}>Forage · success</button><button class="btn sm primary" data-act="fg_roll" data-id="${f.id}" data-q="great" ${all.length?'':raw('disabled')}>Forage · great success</button></div>
    ${res?h`<div class="ctres" role="status" aria-live="polite">${res.list.length?h`<span class="k">FOUND</span><div class="row">${res.list.map(x=>h`<span class="pill ${x.t==='R'?'leg':''}">${x.c} × ${x.b} Berry${x.t!=='C'?' · '+FG_TIER[x.t]:''}</span>`)}</div>
        ${mine&&!u.added?h`<div class="row"><button class="btn sm" data-act="fg_bag">Put them in my bag</button></div>`:u.added?h`<p class="sub">In your bag.</p>`:''}`
      :h`<span class="k">NOTHING</span> <span class="sub">An hour of searching, and only leaves.</span>`}</div>`:''}
  </section>`;
}
function fgAct(b){
  const d=b.dataset,u=S.ui.fg=S.ui.fg||{};
  if(d.act==='fg_roll'){u.id=d.id;u.res=fgRoll(d.id,cdGet().s,d.q);u.added=false;render();return;}
  if(d.act==='fg_bag'){
    const uid=S.me.id,t=S.trainers[uid];if(!t||!canEditT(uid)||!u.res||u.added)return;
    const items=(t.items||[]).map(x=>Object.assign({},x));
    u.res.list.forEach(x=>{const nm=x.b+' Berry',it=items.find(y=>dexKey(y.name)===dexKey(nm));if(it)it.qty=num(it.qty===''||it.qty==null?1:it.qty)+x.c;else items.push({name:nm,qty:x.c,note:'Foraged'});});
    edit('t',uid,'items',items);u.added=true;toast('Added to your bag.',true);render();
  }
}

/* rings round towns keep a steady on-screen size whatever the zoom */
function sizeHot(){
  const svg=$('svg.hot');
  if(!svg)return;
  const k=svg.getBoundingClientRect().width/MAP_W;
  if(!k)return;
  const r=(15/k).toFixed(1);
  svg.querySelectorAll('.hs.p circle').forEach(c=>c.setAttribute('r',r));
}
let szq=0;
window.addEventListener('resize',()=>{if(szq)return;szq=requestAnimationFrame(()=>{szq=0;sizeHot();});});

/* ---------- places list beside the map ---------- */
const PL_FILTERS=[['all','All'],['settle','Towns'],['land','Landmarks'],['route','Routes']];
function plMatches(){
  const q=String(S.ui.q.places||'').trim().toLowerCase();
  const fl=S.ui.f.places||'all';
  return PD.filter(f=>{
    if(fl!=='all'&&f.g!==fl)return false;
    if(!q)return true;
    return (f.name+' '+(f.nick||'')+' '+plFact(f,'Gym')).toLowerCase().indexOf(q)>=0;
  }).sort(natural);
}
function plRows(){
  const L=plMatches();
  if(!L.length)return h`<li class="sub plnone">Nothing matches that search.</li>`;
  return h`${L.map(f=>h`<li><button class="plrow" data-act="place" data-id="${f.id}"><span class="pk ${f.g}" aria-hidden="true"></span><span class="pnm">${f.name}</span><span class="sub">${plSub(f)}</span></button></li>`)}`;
}
function refreshPlaceList(){
  const ul=$('#plrows');
  if(!ul)return;
  ul.innerHTML=plRows().s;
  const c=$('#plcount');
  if(c)c.textContent=String(plMatches().length);
  syncHl();
}
function placesPanel(){
  return h`<div class="ph"><h2>Places</h2><span class="sub mono" id="plcount">${plMatches().length}</span></div>
    <input type="search" class="plq" data-pq="1" value="${S.ui.q.places||''}" placeholder="Search places, routes, gyms" aria-label="Search places" autocomplete="off">
    <div class="seg" role="group" aria-label="Filter places">${PL_FILTERS.map(([k,l])=>h`<button data-act="pf" data-v="${k}" aria-pressed="${String((S.ui.f.places||'all')===k)}">${l}</button>`)}</div>
    <ul class="plrows" id="plrows">${plRows()}</ul>`;
}

/* ---------- hover card, highlight ---------- */
let tipId='',tipTimer=0,lastPT='mouse';
const tipNode=()=>document.getElementById('ptip');
const coarse=()=>!!(window.matchMedia&&matchMedia('(hover:none)').matches);
function setHl(id){
  document.querySelectorAll('.hs.on,.plrow.on').forEach(el=>el.classList.remove('on'));
  S.hl=id||'';
  if(id)document.querySelectorAll('.hs[data-pl="'+id+'"],.plrow[data-id="'+id+'"]').forEach(el=>el.classList.add('on'));
}
function syncHl(){setHl(S.hl);}
function tipHtml(f){
  const gym=plFact(f,'Gym');
  return h`<div class="tp-pic">${plThumb(f,{aspect:16/9,minW:420,cls:'tp'})}</div><div class="tp-body"><span class="tp-kind">${plSub(f)}${gym?' · Gym':''}</span><b class="tp-name">${f.name}</b><span class="tp-sum">${plShort(f)}</span><span class="tp-go">Open page →</span></div>`;
}
function placeTip(el,x,y){
  if(coarse()){el.classList.add('sheet');return;}
  el.classList.remove('sheet');
  const W=el.offsetWidth||300,H=el.offsetHeight||200;
  const vw=document.documentElement.clientWidth,vh=window.innerHeight;
  let l=x+14,t=y+14;
  if(l+W>vw-8)l=x-W-14;
  if(l<8)l=Math.max(8,vw-W-8);
  if(t+H>vh-8)t=y-H-14;
  if(t<8)t=8;
  el.style.left=Math.round(l)+'px';
  el.style.top=Math.round(t)+'px';
}
function showTip(id,x,y){
  const f=PD_BY[id],el=tipNode();
  if(!f||!el)return;
  clearTimeout(tipTimer);
  if(tipId!==id||el.hidden){
    tipId=id;
    el.innerHTML=tipHtml(f).s;
    el.setAttribute('data-id',id);
    el.hidden=false;
    placeTip(el,x,y);
  }
  setHl(id);
}
function hideTip(now){
  clearTimeout(tipTimer);
  const go=()=>{const el=tipNode();if(el)el.hidden=true;tipId='';setHl('');};
  if(now)go();else tipTimer=setTimeout(go,320);
}
function openPlace(id){
  if(!PD_BY[id])return;
  hideTip(true);
  S.placeId=id;S.ui.navOpen=false;
  setTab('place');
}
function showOnMap(id){
  const f=PD_BY[id];
  if(!f)return;
  hideTip(true);
  S.ui.focusPl=id;
  if(S.ui.zoom<2)S.ui.zoom=2;
  setTab('map');
}
/* after a render: scroll position of the zoomed map, and the "show on map" jump */
function mapScrollAfterRender(prev){
  sizeHot();
  const mv=$('#mapview');
  if(!mv)return;
  const sw=mv.scrollWidth,sh=mv.scrollHeight;
  let cx=null,cy=null;
  if(S.ui.focusPl&&PD_BY[S.ui.focusPl]){
    const f=PD_BY[S.ui.focusPl];cx=f.cx/MAP_W;cy=f.cy/MAP_H;
    const id=S.ui.focusPl;S.ui.focusPl=null;
    S.ui.zoomC=null;
    setTimeout(()=>{S.hl=id;syncHl();setTimeout(()=>{if(S.hl===id&&tipNode().hidden)setHl('');},3200);},0);
  }else if(S.ui.zoomC){cx=S.ui.zoomC[0];cy=S.ui.zoomC[1];S.ui.zoomC=null;}
  if(cx!=null){
    mv.scrollLeft=Math.max(0,cx*sw-mv.clientWidth/2);
    mv.scrollTop=Math.max(0,cy*sh-mv.clientHeight/2);
  }else if(prev){mv.scrollLeft=prev[0];mv.scrollTop=prev[1];}
}
function setZoom(z){
  const mv=$('#mapview');
  if(mv&&mv.scrollWidth){
    S.ui.zoomC=[(mv.scrollLeft+mv.clientWidth/2)/mv.scrollWidth,(mv.scrollTop+mv.clientHeight/2)/mv.scrollHeight];
  }
  S.ui.zoom=z;
  hideTip(true);
  render();
}

document.addEventListener('pointerdown',e=>{lastPT=e.pointerType||'mouse';},true);
document.addEventListener('pointerover',e=>{
  if(e.pointerType==='touch')return;
  const t=e.target;
  if(!t||!t.closest)return;
  const hs=t.closest('.hs');
  if(hs){
    if(tipId===hs.dataset.pl&&!tipNode().hidden)clearTimeout(tipTimer);
    else showTip(hs.dataset.pl,e.clientX,e.clientY);
    return;
  }
  if(t.closest('#ptip')){clearTimeout(tipTimer);return;}
  const row=t.closest('.plrow');
  if(row)setHl(row.dataset.id);
});
document.addEventListener('pointerout',e=>{
  if(e.pointerType==='touch')return;
  const t=e.target,to=e.relatedTarget;
  if(!t||!t.closest)return;
  const hs=t.closest('.hs');
  if(hs){
    if(!(to&&to.closest&&to.closest('#ptip,.hs[data-pl="'+hs.dataset.pl+'"]')))hideTip();
    return;
  }
  if(t.closest('#ptip')){
    if(!(to&&to.closest&&to.closest('#ptip,.hs')))hideTip();
    return;
  }
  if(t.closest('.plrow')&&!(to&&to.closest&&to.closest('.plrow')))setHl(tipId||'');
});
document.addEventListener('focusin',e=>{const r=e.target.closest&&e.target.closest('.plrow');if(r)setHl(r.dataset.id);});
document.addEventListener('focusout',e=>{const r=e.target.closest&&e.target.closest('.plrow');if(r)setHl(tipId||'');});
document.addEventListener('scroll',e=>{if(e.target&&e.target.id==='mapview')hideTip(true);},true);
window.addEventListener('resize',()=>hideTip(true));

/* ---------- the map page ---------- */
function mapTab(){
  const pins=pinList();
  const mode=S.ui.pinMode||'';
  const placing=mode==='add'||mode.indexOf('move:')===0;
  const mm=S.mapChunks.meta||{};
  const mapW=clamp(num(mm.w),1,4000)||4,mapH=clamp(num(mm.h),1,4000)||3;
  const hot=mapReady()&&!placing;
  const hint=placing?(mode==='add'?'Click or tap the map where the pin goes.':'Click or tap the new spot for this pin.')
    :hot?(coarse()?'Tap a town, landmark or road to preview it, then tap the card to open its page.':'Hover a town, landmark or road to preview it. Click to open its page.')
    :'Pins are shared by the whole party. Select one to read or edit it.';
  const sub=S.ui.mapSub==='pins'||!mapReady()?'pins':'places';
  return h`<section class="panel"><div class="ph"><h2>Region map</h2>
      <div class="acts">${mapReady()?h`<button class="btn sm" data-act="clrOv" aria-pressed="${String(S.ui.clrOv!==false)}">${S.ui.clrOv!==false?'Hide':'Show'} clearance and Rangers</button>`:''}${S.mapSrc?h`<span class="seg" role="group" aria-label="Zoom">${[1,2,3].map(z=>h`<button data-act="zoom" data-z="${z}" aria-pressed="${String(S.ui.zoom===z)}">${z===1?'Fit':z+'×'}</button>`)}</span>`:''}${canShared()?(placing?h`<button class="btn sm" data-act="pinMode" data-v="">Cancel</button>`:h`<button class="btn primary sm" data-act="pinMode" data-v="add">Drop a pin</button><button class="btn sm" data-act="pinCenter">Pin at center</button>`):''}${S.me.admin?mapPicker():''}</div></div>
      <p class="sub" aria-live="polite">${hint}</p>${hot&&S.ui.clrOv!==false?clrLegend():''}</section>
    <div class="maplay">
      <div class="mapview z${S.ui.zoom}" id="mapview" role="region" aria-label="Region map, scrollable" tabindex="0">
        <div class="mapwrap ${S.mapSrc?'':'blank'} ${placing?'placing':''}" ${placing?raw('data-act="mapClick"'):''}>
          ${S.mapSrc?h`<img class="mapimg" src="${S.mapSrc}" width="${mapW}" height="${mapH}" alt="Map of the region" draggable="false">`:h`<p class="mapnote">No map uploaded yet. ${S.me.admin?'Use Upload map above.':'The GM can upload one.'}</p>`}
          ${hot?raw(hotMarkup()):''}
          ${hot&&S.ui.clrOv!==false?raw(clrOverlay()):''}
          ${hot?raw(trOverlay()):''}
          ${pins.map(p=>h`<button class="mpin ${p.kind||'place'} ${S.ui.selPin===p.id?'sel':''}" data-act="selPin" data-id="${p.id}" data-x="${clamp(num(p.x),0,1)}" data-y="${clamp(num(p.y),0,1)}" aria-label="Pin ${p.n}: ${p.label||'unnamed'}">${p.n}</button>`)}
        </div>
      </div>
      <aside class="panel">
        ${mapReady()?h`<div class="seg" role="group" aria-label="Side list"><button data-act="msub" data-v="places" aria-pressed="${String(sub==='places')}">Places</button><button data-act="msub" data-v="pins" aria-pressed="${String(sub==='pins')}">Pins <span class="mono">${pins.length}</span></button></div>`:''}
        ${sub==='places'?placesPanel()
          :h`<div class="ph"><h2>Pins</h2><span class="sub">${pins.length}</span></div>
            ${pins.length?h`<ul class="pinlist">${pins.map(pinRow)}</ul>`:h`<p class="sub">No pins yet. Mark the places your party has been or wants to go.</p>`}`}
      </aside>
    </div>
    ${clTripPanel()}
    ${trPanel()}`;
}

/* ---------- a place's own page ---------- */
function recordsFor(f){
  const k=f.name.toLowerCase();
  const m=c=>entriesOf(c).filter(e=>String(e.place||'').trim().toLowerCase()===k);
  return{people:m(S.people),journal:m(S.journal),leads:m(S.leads),timeline:m(S.timeline)};
}
function chipBtns(list){
  return h`<div class="row plchips">${list.map(g=>h`<button class="btn sm" data-act="place" data-id="${g.id}">${g.name}</button>`)}</div>`;
}
function placeTab(){
  const f=PD_BY[S.placeId];
  if(!f)return h`<section class="panel"><div class="ph"><h2>Place not found</h2></div><div><button class="btn" data-act="tab" data-tab="map">Back to the map</button></div></section>`;
  const admin=!!S.me.admin;
  const rel=[...PD_REL[f.id]].map(i=>PD_BY[i]).sort(natural);
  const roads=rel.filter(x=>x.t==='r'),spots=rel.filter(x=>x.t==='p');
  const rec=recordsFor(f);
  const nrec=rec.people.length+rec.journal.length+rec.leads.length+rec.timeline.length;
  const doc=S.places[f.id]||{};
  const gp=S.gmPl[f.id]||{};
  const facts=f.facts;
  return h`<div class="row"><button class="btn sm" data-act="tab" data-tab="map">← Back to the map</button>${mapReady()?h`<button class="btn sm" data-act="showMap" data-id="${f.id}">Show on map</button>`:''}</div>
    <section class="panel plhero">
      <div class="pl-pic">${plThumb(f,{aspect:16/9,minW:620,cls:'big'})}</div>
      <div class="pl-head"><p class="eyebrow">${plSub(f)}${plFact(f,'Gym')?' · Gym':''}</p><h2 class="pl-name">${f.name}</h2></div>
      ${admin?h`<div class="fld">${fArea('Description players read','pl',f.id,'desc',{desc:plText(f)},{rows:5})}
          <div class="row">${imgPicker('pl',f.id,'img',doc,640,360,90000,false)}${doc.desc&&String(doc.desc).trim()?h`<button class="btn sm ghost" data-act="plReset" data-id="${f.id}">Use the original text</button>`:''}</div>
          <p class="sub">Changes are saved for everyone. With no uploaded picture, a crop of the map is shown.</p></div>`
        :h`<p class="prewrap pl-text">${plText(f)}</p>`}
      ${facts.length?h`<dl class="pl-facts">${facts.map(([k,v])=>h`<div><dt>${k}</dt><dd>${v}</dd></div>`)}</dl>`:''}
    </section>
    ${roads.length||spots.length?h`<section class="panel"><div class="ph"><h2>${f.t==='r'?'Where it leads':'Roads and neighbors'}</h2></div>
      ${f.t==='p'&&roads.length?h`<div class="fld"><span class="fl">Roads</span>${chipBtns(roads)}</div>`:''}
      ${f.t==='p'&&spots.length?h`<div class="fld"><span class="fl">Nearby places</span>${chipBtns(spots)}</div>`:''}
      ${f.t==='r'&&spots.length?h`<div class="fld"><span class="fl">Places on this road</span>${chipBtns(spots)}</div>`:''}
      ${f.t==='r'&&roads.length?h`<div class="fld"><span class="fl">Joins</span>${chipBtns(roads)}</div>`:''}
    </section>`:''}
    <section class="panel"><div class="ph"><h2>Your party's records here</h2><span class="sub">${nrec}</span></div>
      ${nrec?h`<div class="plrec">
        ${rec.people.length?h`<div class="fld"><span class="fl">People</span><ul class="mini-list">${rec.people.map(p=>h`<li><button class="plink" data-act="tab" data-tab="people">${p.name||'Unnamed'}</button> <span class="sub">${p.role||''}</span></li>`)}</ul></div>`:''}
        ${rec.journal.length?h`<div class="fld"><span class="fl">Journal</span><ul class="mini-list">${rec.journal.map(p=>h`<li><button class="plink" data-act="tab" data-tab="journal">${p.title||'Untitled entry'}</button> <span class="sub">Session ${num(p.session)||'?'}</span></li>`)}</ul></div>`:''}
        ${rec.leads.length?h`<div class="fld"><span class="fl">Leads</span><ul class="mini-list">${rec.leads.map(p=>h`<li><button class="plink" data-act="tab" data-tab="leads">${p.title||'Untitled lead'}</button> <span class="sub">${p.status||'open'}</span></li>`)}</ul></div>`:''}
        ${rec.timeline.length?h`<div class="fld"><span class="fl">Timeline</span><ul class="mini-list">${rec.timeline.map(p=>h`<li><button class="plink" data-act="tab" data-tab="timeline">${p.title||'Untitled event'}</button> <span class="sub">Session ${num(p.session)||'?'}</span></li>`)}</ul></div>`:''}
      </div>`
      :h`<p class="sub">Nothing yet. Fill in the Place field on a person, journal entry, lead or timeline event with “${f.name}” and it will show up here.</p>`}
    </section>
    ${admin?h`<section class="panel"><div class="ph"><h2>GM notes</h2><span class="pill gm">GM only</span></div>
      ${fArea('','gp',f.id,'notes',gp,{rows:5,ph:'Secrets, hooks and what is really here. Players never receive this.'})}</section>`:''}
    ${fgPanel(f)}
    ${shPlacePanel(f)}
    ${admin?encPanel(f):''}`;
}

/* ---------- standalone build only: account page and table access (GM) ---------- */
function tableAccess(){
  const codeNow=S.ui.inv.code!=null?S.ui.inv.code:((S.invite&&S.invite.code)||'');
  const mem=Object.keys(S.members).filter(u=>u!==S.me.id).sort((a,b)=>num(S.members[a].joinedAt)-num(S.members[b].joinedAt));
  return h`<section class="panel"><div class="ph"><h2>Table access</h2><span class="pill gm">GM only</span></div>
    <p class="sub">Players create an account on this site and enter the table code to join. Change the code to stop new people joining. Anyone who already joined keeps access until you remove them.</p>
    <div class="fgrid"><label class="fld wide"><span class="fl">Table code</span><input type="text" data-u="inv.code" data-nr value="${codeNow}" autocomplete="off" spellcheck="false" maxlength="64" placeholder="At least 6 characters, such as a short phrase"></label></div>
    <div class="row"><button class="btn primary sm" data-act="invSave">Save code</button><span class="sub">${S.invite&&S.invite.code?'A code is set.':'No code is set yet, so nobody can join.'}</span></div>
    <div class="fl">Players (${mem.length})</div>
    ${mem.length?h`<ul class="mini-list">${mem.map(u=>{const armed=S.ui.confirm==='mem|'+u;return h`<li><div class="row sp"><span><b>${S.names[u]||'A player'}</b> <span class="sub">${S.trainers[u]?'Sheet: '+tName(S.trainers[u]):'No sheet yet'} · joined ${dt(S.members[u].joinedAt)}</span></span><button class="btn sm danger ${armed?'armed':''}" data-act="rmMember" data-uid="${u}">${armed?'Tap again to confirm':'Remove'}</button></div></li>`;})}</ul>
      <p class="sub">Removing a player ends their access, but anyone who still knows the table code can join again, so change the code too if you want to keep someone out. Their character stays on the table until you delete it.</p>`
      :h`<p class="sub">Nobody has joined yet.</p>`}
  </section>`;
}
function accountTab(){
  const api=CFG&&CFG.api;
  if(!api)return emptyState('Account','Account tools are not available in this view.');
  const nameNow=S.ui.acct.name!=null?S.ui.acct.name:(S.names[S.me.id]||api.displayName()||'');
  return h`<section class="panel"><div class="ph"><h2>Your account</h2></div>
    <div class="fgrid">
      <label class="fld wide"><span class="fl">Display name</span><input type="text" data-u="acct.name" data-nr value="${nameNow}" maxlength="40" autocomplete="nickname"></label>
      <div class="fld wide"><span class="fl">Signed in as</span><span>${api.email()||'(no email on this account)'}</span></div>
    </div>
    <p class="sub">Your display name is what the GM and other players see next to your character, notes and journal entries.</p>
    <div class="row"><button class="btn primary sm" data-act="acctName">Save name</button>${api.canReset()?h`<button class="btn sm" data-act="acctReset">Email me a password reset link</button>`:''}<button class="btn sm ghost" data-act="signOut">Sign out</button></div>
    ${S.ui.acct.msg?h`<p class="sub" role="status">${S.ui.acct.msg}</p>`:''}</section>
  <section class="panel"><div class="ph"><h2>Appearance</h2></div>
    <div class="seg" role="group" aria-label="Theme">${[['auto','Auto'],['light','Day'],['dark','Night']].map(([v,l])=>h`<button data-act="themeSet" data-v="${v}" aria-pressed="${String(themePref()===v)}">${l}</button>`)}</div>
    <p class="sub">Auto follows your device. The choice is remembered on this device only.</p></section>
  <section class="panel"><div class="ph"><h2>What you can change</h2></div>
    <p class="sub">You control your own character sheet, your own Pokémon, and what you add yourself. Anyone can edit the shared People and Leads notes, but only the person who added an entry (or the GM) can delete it. The GM can change anything. Your private notes are visible only to you.</p></section>`;
}

/* ---------- rolling ---------- */
const d20=()=>1+Math.floor(Math.random()*20);
function rollOnce(){
  const a=d20();
  if(a===20){const b=d20();return{base:20+b,txt:'20, then '+b+' (+20)'};}
  return{base:a,txt:String(a)};
}

/* ---------- page chrome ---------- */
const navGroups=()=>{const g=S.me.admin?NAV.concat([GM_NAV]):NAV;return CFG?g.concat([['You',[['account','Account']]]]):g;};
function tabCount(k){
  if(k==='people')return Object.keys(S.people).length;
  if(k==='battle')return S.battle&&S.battle.on?'LIVE':0;
  if(k==='leads')return entriesOf(S.leads).filter(l=>!l.status||l.status==='open'||l.status==='chasing').length;
  return 0;
}
function headerHtml(){
  const m=S.meta;
  const t=PAGE_LABEL[S.tab]||'Overview';
  return h`<button class="btn sm menu-btn" data-act="menu" aria-expanded="${String(!!S.ui.navOpen)}" aria-controls="side">Menu</button>
    <div class="bar-t"><p class="eyebrow">${m.campaign}</p>${S.tab==='overview'?h`<p class="bar-title">${t}</p>`:h`<h1 class="bar-title">${t}</h1>`}</div>
    <div class="bar-r">${onlineHtml()}<button class="btn sm ghost themebtn" data-act="theme" aria-label="${themeEff()==='dark'?'Switch to the day theme':'Switch to the night theme'}" title="${themeEff()==='dark'?'Day theme':'Night theme'}">${themeEff()==='dark'?ICON_SUN:ICON_MOON}</button>${S.me.admin?h`<span class="chip gm">GM</span>`:''}<span class="chip">Session ${num(m.session)||1}</span><span id="savestate" class="save ${S.save.cls}" aria-live="polite">${S.save.text}</span></div>`;
}
function renderHead(){const el=$('#head');if(el)el.innerHTML=headerHtml().s;}
function sideHtml(){
  if(S.noDb)return '';
  return h`<div class="brand"><span class="logo" aria-hidden="true"><i>LOG</i></span><div><b>${S.meta.campaign}</b><small>${S.meta.gm?'Game Master '+S.meta.gm:'Trainer Log'}</small></div></div>
    <nav aria-label="Sections">${navGroups().map(([title,items])=>h`<div class="ng"><p class="nt">${title}</p>${items.map(([k,l])=>h`<button class="nv" data-act="tab" data-tab="${k}" aria-current="${S.tab===k||(k==='map'&&S.tab==='place')?'page':'false'}"><span>${l}</span>${tabCount(k)?h`<span class="n">${tabCount(k)}</span>`:''}</button>`)}</div>`)}</nav>`;
}
function banners(){
  if(!S.me.canWrite)return h`<div class="banner warn">${CFG?'You can read this table but not change it.':'You can read this table but not change it. Ask the GM to share the page with you as a Contributor.'}</div>`;
  if(S.ui.writeFail)return h`<div class="banner warn">${CFG?'Your last change did not save. You may not have permission to change that, or you may be offline. Reload the page and try again.':'Your last change did not save. You may only have view access. Ask the GM to share the page with you as a Contributor.'}</div>`;
  return '';
}
function footer(){
  return h`<div class="foot"><span>${S.me.id?'Your private notes are visible only to you.':''}</span>${S.dl&&S.me.id?h`<button class="btn sm ghost" data-act="export">Download my backup</button>`:''}${CFG?h`<button class="btn sm ghost" data-act="signOut">Sign out</button>`:''}<span class="ver">Version ${BUILD}</span></div>`;
}
function mainHtml(){
  if(S.noDb)return emptyState('This tracker needs a signed-in view','Open it from your claude.ai link while signed in. The shared table is stored with the page, so it cannot load anywhere else.');
  if(!S.ready)return h`<p class="loading">OPENING THE TABLE…</p>`;
  if(S.mapWin)return bmWinHtml();
  const views={cal:calTab,overview:overviewTab,journal:journalTab,timeline:timelineTab,people:peopleTab,leads:leadsTab,map:mapTab,place:placeTab,trainer:trainerTab,pokemon:pokemonTab,dex:dexTab,battle:battleTab,moves:mvxTab,contest:ctTab,rank:rkTab,shop:shopTab,gm:gmTab,npc:npcTab,account:accountTab};
  let tab=S.tab;
  if((tab==='gm'||tab==='npc')&&!S.me.admin)tab='overview';
  if(tab==='account'&&!CFG)tab='overview';
  return h`${banners()}${(views[tab]||overviewTab)()}${footer()}`;
}
function fixView(){
  if(!S.ready)return;
  if(S.viewUid&&S.trainers[S.viewUid])return;
  const ids=tids();
  S.viewUid=(S.me.id&&S.trainers[S.me.id])?S.me.id:(ids[0]||null);
}
function setPresence(){
  if(!S.room)return;
  try{Promise.resolve(S.room.presence({tab:S.tab})).catch(()=>{});}catch(e){}
}
function positionPins(){
  document.querySelectorAll('.mpin[data-x]').forEach(el=>{
    el.style.left=(+el.dataset.x*100)+'%';
    el.style.top=(+el.dataset.y*100)+'%';
  });
}

/* ---------- render with focus kept ---------- */
function captureFocus(){
  const a=document.activeElement;
  if(!a||!a.dataset)return null;
  if(a.classList&&(a.classList.contains('ptr')||a.classList.contains('ptz')))return{at:'fr',k:(a.classList.contains('ptz')?'ptz':'ptr')+'|'+a.dataset.id};
  const at=a.dataset.b!=null?'b':a.dataset.u!=null?'u':a.dataset.pq!=null?'pq':a.dataset.bmt!=null?'bmt':a.dataset.bmk!=null?'bmk':null;
  if(!at)return null;
  let s=null,en=null;
  try{s=a.selectionStart;en=a.selectionEnd;}catch(e){}
  return{at,k:a.dataset[at],s,en};
}
function restoreFocus(fc){
  if(!fc)return;
  if(fc.at==='fr'){
    const p=fc.k.split('|'),el=document.querySelector((p[0]==='ptz'?'.ptz':'.ptr.edit')+'[data-id="'+CSS.escape(p[1])+'"]');
    if(el)el.focus({preventScroll:true});
    return;
  }
  const el=document.querySelector('[data-'+fc.at+'="'+CSS.escape(fc.k)+'"]');
  if(!el||el.disabled)return;
  el.focus({preventScroll:true});
  try{if(fc.s!=null&&el.setSelectionRange)el.setSelectionRange(fc.s,fc.en);}catch(e){}
}
function render(){
  /* while a token is being dragged or the ruler is out, the page is left alone; one render follows when the finger lifts */
  if(bmBusy&&(bmDrag||bmRl||bmTp||bmPn)){bmQueued=true;return;}
  bmBusy=false;
  fixView();
  const fc=captureFocus();
  const a=document.activeElement;
  const navKey=a&&a.classList&&a.classList.contains('nv')?a.dataset.tab:null;
  const y=window.scrollY;
  const mv0=$('#mapview');
  const mprev=mv0?[mv0.scrollLeft,mv0.scrollTop]:null;
  const bv0=$('#bmview');
  const bprev=bv0?[bv0.scrollLeft,bv0.scrollTop]:null;
  renderHead();
  renderToday();wxSync();
  const sh=$('#shell');
  sh.classList.toggle('nav-open',!!S.ui.navOpen);
  sh.classList.toggle('no-side',!!S.noDb);
  const sig=navGroups().map(g=>g[1].map(x=>x[0]+tabCount(x[0])).join()).join('|')+'|'+S.tab+'|'+S.noDb+'|'+S.meta.campaign+'|'+S.meta.gm;
  if(sig!==S._tsig){
    S._tsig=sig;
    $('#side').innerHTML=sideHtml().s;
    if(navKey){const el=document.querySelector('.nv[data-tab="'+navKey+'"]');if(el)el.focus({preventScroll:true});}
  }
  $('#main').innerHTML=mainHtml().s;
  renderRoll();
  lbxRender();
  restoreFocus(fc);
  positionPins();
  mapScrollAfterRender(mprev);
  bmScrollAfterRender(bprev);
  if(S.tab!=='map')hideTip(true);else syncHl();
  if(S.ui.toTop){S.ui.toTop=false;window.scrollTo(0,0);}else window.scrollTo(0,y);
  ensureNames();
}
async function ensureNames(){
  if(!S.user)return;
  const want=new Set(Object.keys(S.trainers));
  [S.people,S.journal,S.leads,S.timeline,S.pins].forEach(c=>Object.keys(c).forEach(k=>{if(c[k].addedBy)want.add(c[k].addedBy);}));
  Object.keys(S.members).forEach(u=>want.add(u));
  S.peers.forEach(p=>{if(p.by)want.add(p.by);});
  const need=[...want].filter(u=>!(u in S.names));
  if(!need.length)return;
  need.forEach(u=>{S.names[u]='';});
  try{
    const ps=await S.user.profiles(need);
    let changed=false;
    need.forEach(u=>{
      const pr=ps[u];
      if(pr&&pr.name){S.names[u]=pr.name;changed=true;}
      if(pr&&typeof pr.avatarUrl==='string'&&/^data:image\//.test(pr.avatarUrl)){S.avatars[u]=pr.avatarUrl;changed=true;}
    });
    if(changed)scheduleRender();
  }catch(e){}
}
function toast(msg,ok){
  S.noteUntil=0;
  setStatus(ok?'note':'err',msg);
  S.noteUntil=Date.now()+3500;
  const tk=S.noteTok=(S.noteTok||0)+1;
  setTimeout(()=>{if(S.noteTok!==tk)return;S.noteUntil=0;setStatus(Q.size?'busy':'saved');},3500);
}
function setTab(t){if(S.ui.bm&&S.ui.bm.full&&t!==S.tab)bmFs(false);S.tab=t;lsSet('stl.tab',t);S.ui.toTop=true;setPresence();render();}

/* ---------- actions ---------- */
function addEntry(kind){
  const now=Date.now();
  if(kind==='ppl'){
    const id=S.db.collection('people').doc().id;
    newDoc('ppl',id,{name:'',role:'',place:'',met:num(S.meta.session)||1,att:'unknown',notes:'',pinned:false,addedBy:S.me.id,createdAt:now});
    S.ui.open['ppl'+id]=true;
  }else if(kind==='j'){
    const id=S.db.collection('journal').doc().id;
    newDoc('j',id,{session:num(S.meta.session)||1,title:'',body:'',place:'',addedBy:S.me.id,createdAt:now});
    S.ui.open['j'+id]=true;
  }else if(kind==='l'){
    const id=S.db.collection('leads').doc().id;
    newDoc('l',id,{title:'',detail:'',place:'',status:'open',addedBy:S.me.id,createdAt:now});
    S.ui.open['l'+id]=true;
  }else if(kind==='tl'){
    const id=S.db.collection('timeline').doc().id;
    newDoc('tl',id,{session:num(S.meta.session)||1,when:'',title:'',body:'',place:'',addedBy:S.me.id,createdAt:now});
    S.ui.open['tl'+id]=true;
  }else if(kind==='n'){
    const id=S.db.doc('data/users/'+S.me.id+'/profile').collection('notes').doc().id;
    newDoc('n',id,{title:'',body:'',createdAt:now});
    S.ui.open['n'+id]=true;
  }
  render();
}
function newPin(x,y){
  const id=S.db.collection('pins').doc().id;
  newDoc('pin',id,{x,y,label:'',note:'',kind:'place',addedBy:S.me.id,createdAt:Date.now()});
  S.ui.selPin=id;
}
function giveAwards(){
  const a=S.ui.award;
  const ids=tids().filter(u=>a.uids[u]);
  if(!ids.length){toast('Pick at least one trainer');return;}
  const bdg=BADGES.find(b=>b[0]===a.badge);
  const rk=a.type==='Contest Ribbon'?awardRibbon():'';
  const rib=rk?ribHalls().find(x=>x.k===rk):null;
  const title=String(a.title||'').trim()||(a.type==='Gym Badge'&&bdg?bdg[1]+' Badge':rib?rib.n+' Ribbon':a.type);
  const now=Date.now();
  ids.forEach(uid=>{
    const id=S.db.collection('awards').doc().id;
    newDoc('aw',id,{uid,type:a.type,title,note:a.note||'',badge:a.type==='Gym Badge'?a.badge:'',ribbon:rib?rib.k:'',levelUp:!!a.levelUp,session:num(S.meta.session)||1,by:S.me.id,createdAt:now});
    const t=S.trainers[uid];
    if(a.type==='Gym Badge'&&a.badge){edit('t',uid,'badges.'+a.badge,true);edit('t',uid,'bdate.'+a.badge,clToday());const p={uid,key:a.badge};S.ui.pop=p;setTimeout(()=>{if(S.ui.pop===p)S.ui.pop=null;},1400);}
    if(rib){edit('t',uid,'ribbons.'+rib.k,true);const p={uid,key:'r:'+rib.k};S.ui.pop=p;setTimeout(()=>{if(S.ui.pop===p)S.ui.pop=null;},1400);}
    if(a.levelUp&&t)edit('t',uid,'level',clamp(num(t.level||1)+1,1,20));
  });
  a.uids={};a.title='';a.note='';
  toast('Awarded to '+ids.length+(ids.length===1?' trainer':' trainers'),true);
  render();
}
async function uploadMap(file){
  const r=await fileToImage(file,{max:2048,q:0.82,cap:1300000});
  /* hover highlights only line up when the picture has the Sinnoh map's proportions */
  const sinn=Math.abs((r.w/r.h)/(MAP_W/MAP_H)-1)<0.03;
  const url=r.url,v=Date.now(),CH=150000;
  const n=Math.ceil(url.length/CH);
  const col=S.db.collection('mapimg');
  const old=num(S.mapChunks.meta&&S.mapChunks.meta.n);
  for(let i=0;i<n;i++)await col.doc('c'+i).set({d:url.slice(i*CH,(i+1)*CH),v});
  await col.doc('meta').set({n,w:r.w,h:r.h,v,updatedAt:v,kind:sinn?'sinnoh':''});
  for(let i=n;i<old;i++)await col.doc('c'+i).delete();
  return sinn;
}
async function deleteTrainer(uid){
  const t=S.trainers[uid];
  if(!t)return;
  const db=S.db;
  const pids=monsOf(uid).map(m=>m.id);
  const awIds=entriesOf(S.awards).filter(a=>a.uid===uid).map(a=>a.id);
  /* forget queued saves so nothing is written back after the delete */
  Array.from(Q.keys()).forEach(k=>{if(k==='t|'+uid||k.indexOf('p|'+uid+'/')===0){clearTimeout(Q.get(k).timer);Q.delete(k);}});
  const tref=db.collection('trainers').doc(uid);
  const batch=db.batch();
  pids.forEach(id=>batch.delete(tref.collection('pokemon').doc(id)));
  awIds.forEach(id=>batch.delete(db.collection('awards').doc(id)));
  if(S.me.admin)pids.forEach(id=>batch.delete(db.collection('gm').doc('loy_'+id)));
  batch.delete(tref);
  /* local state first, like every other delete here; the live listeners put things back if the server refuses */
  delete S.trainers[uid];delete S.pokemon[uid];
  awIds.forEach(id=>{delete S.awards[id];});
  S.ui.delT={uid:null,text:''};
  if(S.viewUid===uid)S.viewUid=null;
  setStatus('busy');render();
  try{
    await batch.commit();
    toast('Trainer deleted',true);
  }catch(e){
    fail(e);
    toast('Could not delete that trainer.');
  }
}
async function removeMap(){
  const col=S.db.collection('mapimg');
  const old=num(S.mapChunks.meta&&S.mapChunks.meta.n);
  try{
    await col.doc('meta').delete();
    for(let i=0;i<old;i++)await col.doc('c'+i).delete();
  }catch(e){fail(e);}
}
function act(b,e){
  const d=b.dataset;
  if(d.act&&d.act.indexOf('b_')===0){batAct(b,e);return;}
  if(d.act&&d.act.indexOf('dx_')===0){dxAct(b,e);return;}
  if(d.act&&d.act.indexOf('ct_')===0){ctAct(b,e);return;}
  if(d.act&&d.act.indexOf('mvx_')===0){mvxAct(b);return;}
  if(d.act&&d.act.indexOf('ln_')===0){lnAct(b);return;}
  if(d.act&&d.act.indexOf('en_')===0){encAct(b);return;}
  if(d.act&&d.act.indexOf('cc_')===0){ccAct(b);return;}
  if(d.act&&d.act.indexOf('hpx_')===0){hpxAct(b);return;}
  if(d.act&&d.act.indexOf('nr_')===0){nrAct(b);return;}
  if(d.act&&d.act.indexOf('cd_')===0){cdAct(b);return;}
  if(d.act&&d.act.indexOf('cl_')===0){clAct(b);return;}
  if(d.act&&d.act.indexOf('rk_')===0){rkAct(b);return;}
  if(d.act&&d.act.indexOf('tm_')===0){tmAct(b);return;}
  if(d.act&&d.act.indexOf('br_')===0){brAct(b);return;}
  if(d.act==='zn_load'){znLoad();return;}
  if(d.act&&d.act.indexOf('fg_')===0){fgAct(b);return;}
  if(d.act==='ag_roll'){S.ui.agRoll=1+Math.floor(Math.random()*20);render();return;}
  if(d.act==='fs_load'){fsLoad();return;}
  if(d.act==='zn_zone'){if(S.me.admin&&clTrip()){const t=JSON.parse(JSON.stringify(clTrip()));t.zone=d.v;edit('cd','conditions','trip',t);render();}return;}
  if(d.act&&d.act.indexOf('sp_')===0){shAct(b);return;}
  if(d.act&&d.act.indexOf('rb_')===0){ribAct(b);return;}
  if(d.act&&d.act.indexOf('nt_')===0){ntAct(b,e);return;}
  if(d.act&&d.act.indexOf('cf_')===0){cfAct(b);return;}
  if(d.act==='idflip'){S.ui.flip[d.uid]=!S.ui.flip[d.uid];render();return;}
  if(d.act==='bmw_open'){bmWinOpen();return;}
  if(d.act==='fc_add'){fcAdd(S.ui.bt.fck||'sunny',S.ui.bt.fcc||'');return;}
  if(d.act==='fc_rm'){fcRemove(d.id);return;}
  if(d.act==='fc_after'){fcApplyAfter(d.cid,d.k);return;}
  if(d.act&&d.act.indexOf('bmw_')===0){bmWinAct(d);return;}
  if(d.act&&d.act.indexOf('bm_')===0){bmAct(b,e);return;}
  switch(d.act){
    case 'tab':S.ui.navOpen=false;setTab(d.tab);break;
    case 'menu':{
      S.ui.navOpen=!S.ui.navOpen;render();
      const f=S.ui.navOpen?$('.nv[aria-current="page"]')||$('.nv'):$('.menu-btn');
      if(f)f.focus({preventScroll:true});
      break;}
    case 'hs':{
      if(lastPT==='touch'||coarse()){
        if(tipId===d.pl&&!tipNode().hidden){openPlace(d.pl);break;}
        showTip(d.pl,e.clientX,e.clientY);break;
      }
      openPlace(d.pl);break;}
    case 'place':openPlace(d.id);break;
    case 'showMap':showOnMap(d.id);break;
    case 'zoom':setZoom(clamp(num(d.z),1,3));break;
    case 'msub':S.ui.mapSub=d.v;render();break;
    case 'clrOv':S.ui.clrOv=S.ui.clrOv===false;render();break;
    case 'tpShow':S.ui.tp.show=!S.ui.tp.show;render();if(S.ui.tp.show){const v=document.getElementById('mapview');if(v)v.scrollIntoView({behavior:'smooth',block:'center'});}break;
    case 'tpAvoid':S.ui.tp.avoid=true;render();break;
    case 'pf':S.ui.f.places=d.v;render();break;
    case 'plReset':edit('pl',d.id,'desc','');render();break;
    case 'pinMode':S.ui.pinMode=d.v||'';render();break;
    case 'movePin':S.ui.pinMode='move:'+d.id;render();break;
    case 'pinCenter':if(canShared()){newPin(0.5,0.5);render();}break;
    case 'mapClick':{
      const r=b.getBoundingClientRect();
      if(!r.width||!r.height||!e)break;
      const rx=Math.round(clamp((e.clientX-r.left)/r.width,0,1)*10000)/10000;
      const ry=Math.round(clamp((e.clientY-r.top)/r.height,0,1)*10000)/10000;
      const mode=S.ui.pinMode||'';
      if(mode==='add')newPin(rx,ry);
      else if(mode.indexOf('move:')===0){const id=mode.slice(5);if(S.pins[id]){edit('pin',id,'x',rx);edit('pin',id,'y',ry);}}
      S.ui.pinMode='';render();break;}
    case 'selPin':S.ui.selPin=S.ui.selPin===d.id?null:d.id;render();break;
    case 'nudge':{
      const p=S.pins[d.id];
      if(!p)break;
      edit('pin',d.id,'x',clamp(Math.round((num(p.x)+num(d.dx))*10000)/10000,0,1));
      edit('pin',d.id,'y',clamp(Math.round((num(p.y)+num(d.dy))*10000)/10000,0,1));
      render();break;}
    case 'galPick':
    case 'pick':{
      S.pick={spec:d.img,w:+d.w||0,h:+d.h||0,max:+d.max||0,cap:+d.cap||60000};
      const fp=$('#filepick');
      if(fp){fp.value='';fp.click();}
      break;}
    case 'rmImg':{const p=d.p.split('|');
      const dd=p[2]==='img'&&(p[0]==='t'||p[0]==='ppl'||p[0]==='gt')?galDoc(p[0],p[1]):null,al=dd?galAlts(dd):[];
      const was=dd&&dd.img;
      if(al.length){edit(p[0],p[1],'img',al[0]);edit(p[0],p[1],'imgs',al.slice(1));}else edit(p[0],p[1],p[2],'');
      if(dd)picDrop(was);if(GAL_MAX[p[0]]&&p[2]==='img')edit(p[0],p[1],'imgc',{x:50,y:50,z:1});if(p[0]==='gt')ntPublish(p[1]);render();break;}
    case 'lbx':lbxOpen(d.k);break;
    case 'fr0':if(frCan(d.sc,d.id)){edit(d.sc,d.id,'imgc',{x:50,y:50,z:1});render();}break;
    case 'shtab':S.ui.sheetTab=d.v;render();break;
    case 'lbxn':lbxStep(+d.dir||1,+d.dir<0?'lbx-p':'lbx-n');break;
    case 'galUse':galUse(d.sc,d.id,+d.i);break;
    case 'galRm':galRm(d.sc,d.id,+d.i);break;
    case 'lbxx':lbxClose();break;
    case 'rmMap':removeMap();break;
    case 'delTOpen':{
      if(!canEditT(d.uid))break;
      S.ui.delT={uid:d.uid,text:''};render();
      const i=$('input[data-u="delT.text"]');if(i)i.focus();
      break;}
    case 'delTCancel':S.ui.delT={uid:null,text:''};render();break;
    case 'delTGo':{
      const t=S.trainers[d.uid];
      if(!t||!canEditT(d.uid))break;
      const word=(t.name||'').trim()||'delete';
      if(String(S.ui.delT.text||'').trim().toLowerCase()!==word.toLowerCase()){toast('That does not match. Type "'+word+'" to confirm.');break;}
      deleteTrainer(d.uid);break;}
    case 'signOut':if(CFG&&CFG.api)CFG.api.signOut();break;
    case 'acctName':{
      const n=String(S.ui.acct.name!=null?S.ui.acct.name:'').trim().slice(0,40);
      if(!n){S.ui.acct.msg='Enter a name first.';render();break;}
      CFG.api.setName(n).then(()=>{S.names[S.me.id]=n;S.ui.acct.name=null;S.ui.acct.msg='Name saved.';render();})
        .catch(()=>{S.ui.acct.msg='Could not save the name.';render();});
      break;}
    case 'acctReset':
      CFG.api.resetPassword().then(()=>{S.ui.acct.msg='Reset link sent. Check your email.';render();})
        .catch(()=>{S.ui.acct.msg='Could not send the reset link.';render();});
      break;
    case 'invSave':{
      const c=String(S.ui.inv.code!=null?S.ui.inv.code:'').trim();
      if(c.length<6){toast('Use at least 6 characters');break;}
      S.db.collection('config').doc('invite').set({code:c}).then(()=>{S.ui.inv.code=null;toast('Table code saved',true);render();}).catch(fail);
      break;}
    case 'rmMember':{
      const key='mem|'+d.uid;
      if(S.ui.confirm===key){S.ui.confirm=null;S.db.collection('members').doc(d.uid).delete().then(()=>toast('Player removed',true)).catch(fail);render();}
      else{S.ui.confirm=key;render();setTimeout(()=>{if(S.ui.confirm===key){S.ui.confirm=null;render();}},4000);}
      break;}
    case 'awToggle':S.ui.award.uids[d.uid]=!S.ui.award.uids[d.uid];render();break;
    case 'awAll':{
      const ids=tids();
      const all=ids.every(u=>S.ui.award.uids[u]);
      S.ui.award.uids={};
      if(!all)ids.forEach(u=>{S.ui.award.uids[u]=true;});
      render();break;}
    case 'awLevel':S.ui.award.levelUp=!S.ui.award.levelUp;render();break;
    case 'awGive':giveAwards();break;
    case 'view':
      S.viewUid=d.uid;lsSet('stl.view',d.uid);
      if(d.tab)setTab(d.tab);else render();
      break;
    case 'newTrainer':{
      const id=S.me.id;
      if(!id||S.trainers[id])break;
      newDoc('t',id,{owner:id,name:'',cls:'',adv:'',level:1,age:16,hometown:'',origin:'',bio:'',hp:{cur:20,max:20},stats:{atk:2,def:2,spa:2,spd:2,spe:2},talents:{},features:[],items:[],credits:0,badges:{},honors:[],dex:0,createdAt:Date.now()});
      S.ui.open['edt'+id]=true;
      S.viewUid=id;setTab('trainer');
      break;}
    case 'hp':{
      const doc=getLocal(d.sc,d.id);
      if(!doc)break;
      const hp=doc.hp||{cur:0,max:0};
      edit(d.sc,d.id,'hp.cur',clamp(num(hp.cur)+num(d.d),0,Math.max(0,num(hp.max))));
      render();break;}
    case 'talent':{
      const t=S.trainers[d.uid];
      if(!t)break;
      const lv=clamp(num((t.talents||{})[d.key]),0,2);
      edit('t',d.uid,'talents.'+d.key,(lv+1)%3);
      render();break;}
    case 'badge':{
      const t=S.trainers[d.uid];
      if(!t)break;
      const turnOn=!(t.badges&&t.badges[d.key]);
      edit('t',d.uid,'badges.'+d.key,turnOn);
      edit('t',d.uid,'bdate.'+d.key,turnOn?clToday():'');
      if(turnOn){const p={uid:d.uid,key:d.key};S.ui.pop=p;setTimeout(()=>{if(S.ui.pop===p)S.ui.pop=null;},1400);}
      else S.ui.pop=null;
      render();break;}
    case 'theme':setTheme(themeEff()==='dark'?'light':'dark');break;
    case 'themeSet':setTheme(d.v);break;
    case 'roll':doRoll(d.label,num(d.bonus),num(d.tal));renderRoll();break;
    case 'closeRoll':S.ui.rollHidden=true;renderRoll();break;
    case 'adv':S.ui.adv=d.v;render();break;
    case 'add':case 'del':case 'mv':{
      const parts=d.p.split('|');
      const sc=parts[0],id=parts[1],path=parts[2];
      const doc=getLocal(sc,id);
      if(!doc)break;
      const arr=(getIn(doc,path)||[]).slice();
      if(d.act==='add'){
        if(TPL_MAX[path]&&arr.length>=TPL_MAX[path])break;
        arr.push(TPL[d.tpl]());
      }else if(d.act==='del'){
        arr.splice(num(d.i),1);
      }else{
        const i=num(d.i),j=i+num(d.d);
        if(j<0||j>=arr.length)break;
        const tmp=arr[i];arr[i]=arr[j];arr[j]=tmp;
      }
      edit(sc,id,path,arr);
      if(sc==='gt')ntPublish(id);
      render();break;}
    case 'pip':{
      const parts=d.p.split('|');
      const doc=getLocal(parts[0],parts[1]);
      if(!doc)break;
      const used=num(getIn(doc,parts[2]));
      const j=num(d.j);
      edit(parts[0],parts[1],parts[2],j<used?j:j+1);
      render();break;}
    case 'newMon':{
      const uid=S.viewUid;
      if(!canEditT(uid))break;
      const id=S.db.collection('trainers').doc(uid).collection('pokemon').doc().id;
      newDoc('p',uid+'/'+id,{owner:uid,nick:'',species:'',types:['',''],size:'Medium',weight:'Medium',die:'d6',hp:{cur:20,max:20},base:{atk:3,def:3,spa:3,spd:3,spe:3},bonus:{atk:0,def:0,spa:0,spd:0,spe:0},up:'',down:'',natureName:'',skills:'',passives:[],moves:[],item:'',status:'',caught:'',notes:'',slot:partyOf(uid).length<6?'party':'box',order:Date.now(),createdAt:Date.now()});
      S.ui.open['p'+uid+'/'+id]=true;
      S.ui.open['edp'+uid+'/'+id]=true;
      render();break;}
    case 'toggle':S.ui.open[d.key]=!S.ui.open[d.key];render();break;
    case 'slot':{
      const id=d.uid+'/'+d.pid;
      const m=getLocal('p',id);
      if(!m)break;
      if(m.slot==='box'){
        if(partyOf(d.uid).length>=6){toast('Party is full. Move one to the box first.');break;}
        edit('p',id,'slot','party');
      }else edit('p',id,'slot','box');
      render();break;}
    case 'ord':{
      const m=getLocal('p',d.uid+'/'+d.pid);
      if(!m)break;
      const grp=(m.slot==='box'?boxOf:partyOf)(d.uid);
      const i=grp.findIndex(x=>x.id===d.pid);
      const j=i+num(d.d);
      if(i<0||j<0||j>=grp.length)break;
      const A=grp[i],B=grp[j];
      let oa=num(A.order),ob=num(B.order);
      if(oa===ob)ob=oa+num(d.d);
      edit('p',d.uid+'/'+A.id,'order',ob);
      edit('p',d.uid+'/'+B.id,'order',oa);
      render();break;}
    case 'heal':{
      monsOf(S.viewUid).forEach(m=>{
        const id=S.viewUid+'/'+m.id;
        edit('p',id,'hp.cur',num(m.hp&&m.hp.max));
        edit('p',id,'status','');
      });
      endBattle(S.viewUid);
      render();break;}
    case 'rest':{
      monsOf(S.viewUid).forEach(m=>{
        if(!(m.moves||[]).length)return;
        edit('p',S.viewUid+'/'+m.id,'moves',m.moves.map(x=>Object.assign({},x,{used:0})));
      });
      endBattle(S.viewUid);
      render();break;}
    case 'endBattle':{
      if(!canEditT(S.viewUid))break;
      const n=endBattle(S.viewUid);
      toast(n?'Battle over. Mega forms reverted and the Key Stone is charged.':'Battle over. Nothing needed resetting.',true);
      render();break;}
    case 'endBattleAll':if(S.me.admin)endBattleAll();break;
    case 'megaAdd':if(canEditT(d.uid))megaAdd(d.uid,d.pid);break;
    case 'megaForm':if(canEditT(d.uid))megaAdd(d.uid,d.pid,num(d.n));break;
    case 'megaReset':if(canEditT(d.uid))megaReset(d.uid,d.pid);break;
    case 'megaDrop':if(canEditT(d.uid))megaDrop(d.uid,d.pid);break;
    case 'megaGo':megaGo(d.uid,d.pid);break;
    case 'megaRevert':megaRevert(d.uid,d.pid);break;
    case 'megaGate':megaGate(d.pid,d.v==='1');break;
    case 'evoPick':if(canEditT(d.uid))evoPick(d.uid,d.pid,d.to);break;
    case 'evoMv':evoMv(num(d.n));break;
    case 'evoMvBook':evoMvBook();break;
    case 'evoCancel':evoCancel();break;
    case 'evoGo':evoGo(d.uid,d.pid);break;
    case 'evoUndo':if(canEditT(d.uid))evoUndo(d.uid,d.pid);break;
    case 'evoKeep':if(canEditT(d.uid))evoKeep(d.uid,d.pid);break;
    case 'evoGate':evoGateSet(d.pid,d.v==='1');break;
    case 'evoOpen':evoOpenSet(d.v==='1');break;
    case 'evoAny':evoAny(d.uid,d.pid);break;
    case 'psAdj':if(canEditT(d.uid))psAdj(d.uid,d.pid);break;
    case 'psKeep':if(canEditT(d.uid))psKeep(d.uid,d.pid);break;
    case 'p_die':if(/^d\d+$/.test(d.v||'')&&DICE.indexOf(d.v)>=0){edit('p',d.id,'die',d.v);const m=getLocal('p',d.id);if(m){const sg=Object.assign({},m.autoSig||{});sg.di=hsh(d.v);edit('p',d.id,'autoSig',sg);}toast('Monster die set to '+d.v+'.',true);}render();break;
    case 'autofill':{
      if(!canEditT(d.uid))break;
      fillClick(d.uid,d.pid);
      break;}
    case 'ptaPick':{
      if(!S.me.admin)break;
      const fp=$('#ptafile');
      if(fp)fp.click();
      break;}
    case 'newDoc':addEntry(d.kind);break;
    case 'delDoc':{
      const key=d.sc+'|'+d.id;
      if(S.ui.confirm===key){S.ui.confirm=null;removeDoc(d.sc,d.id);}
      else{
        S.ui.confirm=key;render();
        setTimeout(()=>{if(S.ui.confirm===key){S.ui.confirm=null;render();}},4000);
      }
      break;}
    case 'shareNote':{
      const n=S.notes[d.id];
      if(!n)break;
      const id=S.db.collection('journal').doc().id;
      newDoc('j',id,{session:num(S.meta.session)||1,title:n.title||'',body:n.body||'',place:'',addedBy:S.me.id,createdAt:Date.now()});
      toast('Copied to the party log');
      render();break;}
    case 'loy':{
      const cur=S.gmLoy[d.pid]||{uid:d.uid,pid:d.pid};
      cur.loyalty=num(d.n);
      S.gmLoy[d.pid]=cur;
      save('gl',d.pid,{loyalty:cur.loyalty});
      render();break;}
    case 'sub':S.ui.sub=d.v;render();break;
    case 'export':exportBackup();break;
  }
}
async function exportBackup(){
  if(!S.dl)return;
  const me=S.me.id;
  const out={app:'Sinnoh Trainer Log',exportedAt:new Date().toISOString(),trainer:S.trainers[me]||null,pokemon:S.pokemon[me]||{},privateNotes:S.notes};
  if(S.me.admin)out.table={trainers:S.trainers,pokemon:S.pokemon,people:S.people,journal:S.journal,leads:S.leads,timeline:S.timeline,awards:S.awards,pins:S.pins,meta:S.meta,megaApproval:S.megaOk,loyalty:S.gmLoy,npcSecrets:S.gmNpc,npcTrainers:S.gmNt,npcPublic:S.npcPub,placePages:S.places,placeNotes:S.gmPl,battleMapSettings:S.bmGm};
  try{await S.dl.save({filename:'sinnoh-trainer-log-backup.json',data:JSON.stringify(out,null,2)});}
  catch(e){if(!e||e.code!=='declined')toast('Could not offer the download');}
}

/* ---------- input wiring ---------- */
function onBound(t){
  const s=t.dataset.b;
  const i1=s.indexOf('|'),i2=s.indexOf('|',i1+1);
  const sc=s.slice(0,i1),id=s.slice(i1+1,i2),path=s.slice(i2+1);
  let v;
  if(t.type==='checkbox')v=t.checked;
  else if(t.type==='number'){
    v=t.value===''?null:Number(t.value);
    if(v!=null&&Number.isFinite(v)){
      const mx=t.dataset.max,mn=t.dataset.min;
      if(mx!==undefined&&v>+mx)v=+mx;
      if(mn!==undefined&&v<+mn)v=+mn;
    }else if(v!=null)v=null;
  }else v=t.value;
  edit(sc,id,path,v);
  if(sc==='t'&&path==='cls')edit('t',id,'adv','');
  if(sc==='t'&&/^items\.\d+\.name$/.test(path)){liveItemIcon(t);liveKeyLine(t,id);}
  if(sc==='p'&&/^mega\.(?!auto)/.test(path))edit(sc,id,'mega.auto',false);
  if(sc==='gb'&&/^foes\.[^.]+\./.test(path))foePublish(path.split('.')[1]);
  if(sc==='gt'&&path==='cls')edit('gt',id,'adv','');
  if(sc==='gt'&&/^items\.\d+\.name$/.test(path)){liveItemIcon(t);liveKeyLine(t,id,NTS()[id]);}
  if(sc==='gt')ntPublish(id);
  if(sc==='bg')bmSync();
  if(!('nr' in t.dataset))render();
}
document.addEventListener('input',e=>{
  const t=e.target;
  if(!t||!t.dataset)return;
  if(t.classList&&t.classList.contains('ptz')){ntFrameZoom(t,false);return;}
  if(t.dataset.pq!=null){S.ui.q.places=t.value;refreshPlaceList();return;}
  if(t.dataset.sq!=null){shQty(t);return;}
  if(t.dataset.b!=null){onBound(t);if(e.inputType==='insertReplacementText')onSpeciesChange(t);return;}
  if(t.dataset.u!=null){
    const k=t.dataset.u.split('.');
    S.ui[k[0]][k[1]]=t.type==='checkbox'?t.checked:t.value;
    if(k[0]==='dx'&&k[1]==='mq'){const el=document.getElementById('mqres');if(el)el.innerHTML=dxMqRes().s;return;}
    if(k[0]==='dx'&&k[1]==='lq'){const q=dexKey(t.value);document.querySelectorAll('#lcanlist .lmv').forEach(el=>{el.classList.toggle('hit',!!q&&dexKey(el.textContent).includes(q));});return;}
    if(k[0]==='dx'){S.ui.dx.page=1;if(k[1]==='q'){dxRefresh();return;}}
    if(k[0]==='ct'&&ctInput(k[1],t))return;
    if(k[0]==='mvx'&&mvxInput(k[1],t))return;
    if(k[0]==='ln'&&lnInput(k[1],t))return;
    if(k[0]==='shop'&&k[1]==='q'){shRefresh();return;}
    if(k[0]==='clf'&&k[1]==='q'){clListRefresh();return;}
    if(k[0]==='rk'&&k[1]==='q'){rkListRefresh();return;}
    if(k[0]==='cc'&&('nr' in t.dataset)){S.ui.cc.res=null;document.querySelectorAll('.ccres').forEach(el=>{el.innerHTML=ccResult();});return;}
    if(!('nr' in t.dataset))render();
  }
});
document.addEventListener('click',e=>{
  if(e.target.closest&&!e.target.closest('.hs,#ptip'))hideTip(true);
  const b=e.target.closest&&e.target.closest('[data-act]');
  if(!b||b.disabled)return;
  if(b.tagName==='A')e.preventDefault();
  act(b,e);
});
document.addEventListener('change',async e=>{
  const t=e.target;
  if(t&&t.dataset&&rkChange(t))return;
  if(t&&t.dataset&&t.dataset.clcat&&S.me.admin){edit('cd','conditions','ev',clEvents().map(x=>x.k===t.dataset.clcat?Object.assign({},x,{c:t.value}):x));render();return;}
  if(t&&t.dataset&&t.dataset.b&&onSpeciesChange(t))return;
  if(t&&t.dataset&&t.dataset.evot!=null){evoTarget(t.dataset.pid,t.value);return;}
  if(t&&t.classList&&t.classList.contains('ptz')){ntFrameZoom(t,true);return;}
  if(t&&t.dataset&&t.dataset.encfx!=null){if(S.me.admin)encFxEdit(t);return;}
  if(t&&t.dataset&&t.dataset.encl!=null){if(S.me.admin)encListEdit(t);return;}
  if(t&&t.id==='encfile'){
    const f=t.files&&t.files[0];
    try{t.value='';}catch(err){}
    if(f&&S.me.admin)encImport(f);
    return;
  }
  if(t&&t.id==='ntpackfile'){
    const f=t.files&&t.files[0];
    try{t.value='';}catch(err){}
    if(f&&S.me.admin)ntImportPack(f);
    return;
  }
  if(t&&t.id==='ptafile'){
    const f=t.files&&t.files[0];
    try{t.value='';}catch(err){}
    if(f&&S.me.admin)ptaImport(f);
    return;
  }
  if(!t||t.id!=='filepick')return;
  const f=t.files&&t.files[0];
  const pk=S.pick;
  try{t.value='';}catch(err){}
  if(!f||!pk)return;
  if(!/^image\//.test(f.type)){toast('That file is not a picture');return;}
  const parts=pk.spec.split('|');
  try{
    setStatus('busy');
    let late='';
    if(parts[0]==='map'){if(!(await uploadMap(f)))late='Map saved. Its shape does not match the Sinnoh map, so hover highlights are off.';}
    else if(parts[0]==='bmap'){if(S.me.admin)await bmUpload(f);}
    else if(parts[2]==='imgs'&&GAL_MAX[parts[0]]){const r=await fileToImage(f,{max:pk.max||640,cap:pk.cap});if(galAdd(parts[0],parts[1],r.url)){late=await picStore(f,r.url);}else late='That card already holds the most pictures. Remove one first.';}
    else{const r=await fileToImage(f,{w:pk.w,h:pk.h,max:pk.max||undefined,cap:pk.cap});const gd=GAL_MAX[parts[0]]&&parts[2]==='img'?galDoc(parts[0],parts[1]):null;const was=gd&&gd.img;edit(parts[0],parts[1],parts[2],r.url);if(gd){picDrop(was);late=await picStore(f,r.url);}if(GAL_MAX[parts[0]]&&parts[2]==='img'){edit(parts[0],parts[1],'imgc',{x:50,y:50,z:1});}if(parts[0]==='gt')ntPublish(parts[1]);}
    if(!Q.size)setStatus('saved');
    render();
    if(late)toast(late);
  }catch(err){
    if(err&&err.code)fail(err);
    else toast(err&&err.message==='too big'?'That picture is too large even after shrinking. Try another one.':'Could not read that picture');
  }
});
document.addEventListener('pointerdown',e=>{
  const f=e.target.closest&&e.target.closest('.ptr.edit');
  if(f&&(e.button==null||e.button===0))ntFrameStart(f,e);
  if(!e.target.closest||(e.button!=null&&e.button!==0))return;
  if(e.target.closest('#bmmap')){
    const u=S.ui.bm;
    if(u.ruler)bmRulerStart(e);
    else if(u.tool==='tpl')bmTplStart(e);
    else if(u.tool==='paint')bmPaintStart(e);
    else if(u.tool==='fog')bmFgStart(e);
    else{const k=e.target.closest('.bmt,.bmk');if(k)bmDragStart(k,e);}
  }
});
/* a picture inside a token must never start the browser's own picture drag, which would cancel ours */
document.addEventListener('dragstart',e=>{if(e.target&&e.target.closest&&e.target.closest('#bmmap'))e.preventDefault();});
document.addEventListener('pointermove',e=>{if(ntFrDrag)ntFrameMove(e);if(bmDrag)bmDragMove(e);if(bmRl)bmRulerMove(e);if(bmTp)bmTplMove(e);if(bmPn)bmPaintMove(e);if(bmFp)bmFgMove(e);});
const pointerEnd=()=>{if(ntFrDrag)ntFrameEnd();if(bmDrag)bmDragEnd();if(bmRl)bmRulerEnd();if(bmTp)bmTplEnd();if(bmPn)bmPaintEnd();if(bmFp)bmFgEnd();};
document.addEventListener('pointerup',pointerEnd);
document.addEventListener('pointercancel',pointerEnd);
document.addEventListener('lostpointercapture',e=>{if(e.target&&e.target.closest&&(bmDrag||bmRl||bmTp||bmPn||bmFp))setTimeout(pointerEnd,0);});
document.addEventListener('focusout',e=>{
  const t=e.target;
  if(t&&t.dataset&&t.dataset.b)onSpeciesChange(t);
});
document.addEventListener('keydown',e=>{
  if(S.ui.lbx){
    if(e.key==='Escape'){e.preventDefault();lbxClose();return;}
    if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();lbxStep(e.key==='ArrowLeft'?-1:1,e.key==='ArrowLeft'?'lbx-p':'lbx-n');return;}
    if(e.key==='Tab'){e.preventDefault();const bs=[...document.querySelectorAll('#lbx button')];const at=bs.indexOf(document.activeElement);const nx=bs.length?bs[(at+(e.shiftKey?-1:1)+bs.length)%bs.length]:null;if(nx)nx.focus({preventScroll:true});return;}
  }
  if(e.target&&e.target.classList&&e.target.classList.contains('ptr')&&e.target.classList.contains('edit')&&ntFrameKey(e.target,e))return;
  if(e.target&&e.target.classList&&(e.target.classList.contains('bmt')||e.target.classList.contains('bmk'))&&bmKey(e.target,e))return;
  if(e.key==='Escape'&&S.ui.bm&&S.ui.bm.full&&!S.ui.lbx){e.preventDefault();bmFs(false);return;}
  if(e.key==='Escape'&&tipId)hideTip(true);
  if(e.key==='Escape'&&S.ui.navOpen){S.ui.navOpen=false;render();const m=$('.menu-btn');if(m)m.focus({preventScroll:true});}
});

/* ---------- start ---------- */
async function boot(){
  S.mapWin=bmWinMode();if(S.mapWin)document.body.classList.add('mapwin');
  applyTheme(themePref());
  const di=$('#dl-items');
  if(di)di.innerHTML=ITEMSL.split('|').map(s=>'<option value="'+esc(itemLabel(s))+'">').join('');
  const dsc=$('#dl-scat');
  if(dsc)dsc.innerHTML=SCAT.map(x=>'<option value="'+esc(x[0])+'">').join('');
  const dbl=$('#dl-balls');
  if(dbl)dbl.innerHTML=BALLS.map(s=>'<option value="'+esc(itemLabel(s))+'">').join('');
  const ds=$('#dl-species');
  if(ds)ds.innerHTML=DEXN.split('|').map(n=>'<option value="'+esc(n)+'">').join('');
  const dl=$('#dl-places');
  if(dl)dl.innerHTML=PLACES.map(p=>'<option value="'+esc(p)+'">').join('');
  const t0=lsGet('stl.tab');
  if(t0&&PAGE_LABEL[t0]&&t0!=='place'&&(t0!=='account'||CFG))S.tab=t0;
  S.viewUid=lsGet('stl.view')||null;
  render();
  const got=await Promise.all([use('db'),use('user'),use('downloads')]);
  S.user=got[1];S.dl=got[2];
  if(!got[0]){S.noDb=true;S.ready=true;render();return;}
  S.db=got[0];
  try{
    if(S.user){
      S.me.id=await S.user.id();
      S.me.admin=await S.user.canEdit();
      const cw=await S.user.can('data.write');
      S.me.canWrite=(cw!==false)&&(S.me.id!=null||S.me.admin);
    }else S.me.canWrite=false;
  }catch(e){}
  startWatches();
  startRoom();
  render();
  setTimeout(markReady,6000);
}
boot();
