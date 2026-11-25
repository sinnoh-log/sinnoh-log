/* ---------- Timeline (Update 74) ----------
   Events (timeline/…, shared) carry an in-world date from the calendar (date, YYYY-MM-DD), a rough time (when, free text),
   years before the campaign (ago), a kind, and the trainers in it (who). The GM also keeps hidden events in gm/dash (tlh),
   revealed to the table when the GM chooses. Milestones the site already records (awards, badges, rankings entries, road
   battles, eggs hatched, trips finished) become suggestions for the GM to add, add hidden, or dismiss (gm/dash tlm).
   The page is a vertical line by session, with "Before the campaign" first and Today at the end. */
const TL_KINDS=[['story','Story'],['gym','Gym'],['contest','Contest'],['battle','Battle'],['catch','Catch'],['travel','Travel'],['discovery','Discovery'],['history','History']];
const TL_RK_SKIP=new Set(['badge','solo','ribbon','down','early']);   /* badges and ribbons come from the awards; minor entries are left out */
const tlKind=e=>TL_KINDS.some(k=>k[0]===(e&&e.kind))?e.kind:'story';
const tlKindName=k=>(TL_KINDS.find(x=>x[0]===k)||TL_KINDS[0])[1];
const tlHid=()=>{const o=dashG().tlh;return o&&typeof o==='object'?o:{};};
const tlWho=e=>Array.isArray(e&&e.who)?e.who.filter(u=>S.trainers[u]):[];
const tlAgo=e=>Math.max(0,Math.round(num(e&&e.ago)));
const tlPre=e=>tlAgo(e)>0||!num(e.session);
function tlWhen(e){
  const a=tlAgo(e);
  return [a?a+(a===1?' year':' years')+' before the campaign':'',clParse(e.date)?clNice(e.date,{y:1}):'',String(e.when||'').trim()].filter(Boolean).join(' · ');
}
/* every event: shared ones, and for the GM the hidden ones */
function tlAll(){
  const out=entriesOf(S.timeline).map(e=>({e,id:e.id,hid:false}));
  if(S.me.admin){const H=tlHid();Object.keys(H).forEach(k=>{const e=H[k];if(e&&typeof e==='object')out.push({e:Object.assign({},e,{id:k}),id:k,hid:true});});}
  return out;
}
/* the session a milestone most likely belongs to: the latest session of an event or award dated on or before it */
function tlSessionFor(d){
  const cur=num(S.meta.session)||1;
  if(!clParse(d))return cur;
  let best=0;
  entriesOf(S.timeline).forEach(e=>{if(clParse(e.date)&&e.date<=d&&num(e.session)>best)best=num(e.session);});
  entriesOf(S.awards).forEach(a=>{if(clParse(a.d)&&a.d<=d&&num(a.session)>best)best=num(a.session);});
  return best||cur;
}
/* ----- milestones the site already records, for the GM to add ----- */
function tlTripRow(T){
  const last=(T.log||[])[T.log.length-1]||{};
  return {k:clTripKey(T),fromN:trName(T.from),toN:trName(T.to),days:num(T.day),end:last.date||clToday()||''};
}
function tlLogTrip(T){
  if(!S.me.admin||!T)return;
  const L=Array.isArray(dashG().trips)?dashG().trips:[],r=tlTripRow(T);
  if(!L.some(x=>x.k===r.k))edit('gd','dash','trips',L.concat([r]).slice(-200));
}
function tlLogHatch(e){
  if(!S.me.admin||!e)return;
  const L=Array.isArray(dashG().hatched)?dashG().hatched:[];
  edit('gd','dash','hatched',L.concat([{k:e.k,uid:e.uid,sp:e.sp,d:clToday()||''}]).slice(-200));
}
function tlSuggest(){
  if(!S.me.admin)return [];
  const seen=Object.assign({},dashG().tlm||{});
  entriesOf(S.timeline).forEach(e=>{if(e.ms)seen[tlMk(e.ms)]=1;});
  Object.values(tlHid()).forEach(e=>{if(e&&e.ms)seen[tlMk(e.ms)]=1;});
  const out=[],add=o=>{if(!(tlMk(o.ms) in seen))out.push(o);};
  const who=u=>tName(S.trainers[u]);
  const aws=entriesOf(S.awards);
  aws.forEach(a=>{
    if(!S.trainers[a.uid])return;
    const bdg=a.type==='Gym Badge'&&a.badge;
    add({ms:'aw:'+a.id,kind:bdg?'gym':a.type==='Contest Ribbon'?'contest':'story',title:who(a.uid)+' earned '+tlThe(String(a.title||'').trim()||a.type),body:String(a.note||''),who:[a.uid],
      session:num(a.session),date:a.d||(bdg&&((S.trainers[a.uid].bdate||{})[a.badge]))||''});
  });
  tids().forEach(u=>{const t=S.trainers[u];BADGES.forEach(b=>{
    if(!(t.badges||{})[b[0]]||aws.some(a=>a.uid===u&&a.badge===b[0]))return;
    add({ms:'bd:'+u+':'+b[0],kind:'gym',title:who(u)+' won the '+b[1]+' Badge',body:'Beat '+b[2]+'.',who:[u],date:(t.bdate||{})[b[0]]||''});
  });});
  [['gym','rk'],['con','rkc']].forEach(([c,dk])=>{
    const L=((S.cond||{})[dk]||{}).log;
    (Array.isArray(L)?L:[]).forEach(x=>{
      if(!x||!S.trainers[x.u]||(x.t!=='tier'&&TL_RK_SKIP.has(x.e)))return;
      add({ms:'rk:'+c+':'+x.k,kind:c==='con'?'contest':['up','loss'].indexOf(x.e)>=0?'battle':'gym',title:x.t==='tier'?String(x.w||''):who(x.u)+': '+String(x.w||''),who:[x.u],date:x.d||''});
    });
  });
  (Array.isArray((S.roadGm||{}).log)?S.roadGm.log:[]).forEach(x=>{
    if(!x||!x.uid||!S.trainers[x.uid]||x.res==='no')return;
    const win=x.res==='clean'||x.res==='hard';
    add({ms:'rd:'+x.k,kind:'battle',title:(x.pname||who(x.uid))+(win?' beat ':' lost to ')+x.foe,place:x.route?rdbRouteName(x.route):'',who:[x.uid],date:x.date||''});
  });
  (Array.isArray(dashG().hatched)?dashG().hatched:[]).forEach(x=>{if(x&&S.trainers[x.uid])add({ms:'egg:'+x.k,kind:'catch',title:who(x.uid)+'’s '+x.sp+' hatched',who:[x.uid],date:x.d||''});});
  const trips=(Array.isArray(dashG().trips)?dashG().trips:[]).slice(),T=clTrip();
  if(T&&T.done&&!trips.some(x=>x.k===clTripKey(T)))trips.push(tlTripRow(T));
  trips.forEach(x=>add({ms:'trip:'+x.k,kind:'travel',title:'The party reached '+x.toN,body:num(x.days)+' day'+(num(x.days)===1?'':'s')+' on the road from '+x.fromN+'.',place:x.toN,who:[],date:x.end||''}));
  out.forEach(o=>{if(!o.session)o.session=tlSessionFor(o.date);});
  return out.sort((a,b)=>String(a.date||'~').localeCompare(String(b.date||'~')));
}
const tlThe=t=>/^(the|a|an) /i.test(t)?t:'the '+t;
const tlMk=ms=>String(ms||'').replace(/[.~*/\[\]]/g,'_');
const tlFields=o=>({session:num(o.session)||1,date:clParse(o.date)?o.date:'',when:'',ago:0,title:String(o.title||''),place:String(o.place||''),body:String(o.body||''),kind:tlKind(o),who:(o.who||[]).slice(),ms:o.ms||''});
function tlApprove(o,hidden){
  const now=Date.now();
  if(hidden)edit('gd','dash','tlh.'+rkKey(),Object.assign(tlFields(o),{addedBy:S.me.id,createdAt:now}));
  else{const id=S.db.collection('timeline').doc().id;newDoc('tl',id,Object.assign(tlFields(o),{addedBy:S.me.id,createdAt:now}));}
  edit('gd','dash','tlm.'+tlMk(o.ms),1);
}
function tlSuggestHtml(){
  const L=tlSuggest();
  if(!L.length)return '';
  const shown=L.slice(0,20);
  return h`<section class="panel tlsug" aria-label="Milestones to add"><div class="ph"><h2>Milestones to add <span class="pill">${L.length}</span></h2><span class="row"><button class="btn sm" data-act="tl_okall">Add all</button><button class="btn sm ghost" data-act="tl_noall">Dismiss all</button></span></div>
    <ul class="tlsl">${shown.map((o,i)=>h`<li class="tk-${o.kind}"><span class="tl-dot" aria-hidden="true"></span><span class="tlsn"><b>${o.title}</b><span class="sub">${[tlKindName(o.kind),clParse(o.date)?clNice(o.date,{y:1}):'','session '+o.session,o.place||''].filter(Boolean).join(' · ')}</span></span>
      <span class="row"><button class="btn sm" data-act="tl_ok" data-i="${i}">Add</button><button class="btn sm ghost" data-act="tl_ok" data-i="${i}" data-h="1">Add hidden</button><button class="btn sm ghost" data-act="tl_no" data-i="${i}">Not now</button></span></li>`)}</ul>
    ${L.length>shown.length?h`<p class="sub">And ${L.length-shown.length} more.</p>`:''}
    <p class="sub">Things the site has recorded: awards, badges, rankings entries, road battles, eggs hatched and trips. Nothing goes on the timeline until you add it; you can edit it afterwards. “Not now” hides one for good.</p></section>`;
}
/* ----- one event ----- */
function tlEdit(x){
  const e=x.e,hid=x.hid,sc=hid?'gd':'tl',did=hid?'dash':x.id,base=hid?'tlh.'+x.id+'.':'',doc=hid?dashG():e;
  const ids=tids(),w=tlWho(e);
  return h`<li class="tl-ev tk-${tlKind(e)} ${hid?'tlhid':''}"><span class="tl-dot" aria-hidden="true"></span><div class="entry tl-body">
    ${hid?h`<p class="sub"><span class="pill gm">Hidden</span> Only you can see this until you reveal it.</p>`:''}
    <div class="fgrid">
      ${fText('Title',sc,did,base+'title',doc,{cls:'wide'})}
      ${fSel('Kind',sc,did,base+'kind',doc,TL_KINDS)}
      ${fNum('Session',sc,did,base+'session',doc,{min:0})}
      <label class="fld"><span class="fl">In-world date</span><span class="row"><input type="date" ${bd(sc,did,base+'date')} value="${clParse(getIn(doc,base+'date'))?getIn(doc,base+'date'):''}">${clToday()?h`<button class="btn sm ghost" data-act="tl_today" data-id="${x.id}" data-h="${hid?'1':''}">Today</button>`:''}</span></label>
      ${fText('Or a rough time',sc,did,base+'when',doc,{ph:'e.g. Late autumn'})}
      ${fNum('Years before the campaign',sc,did,base+'ago',doc,{min:0})}
      ${fText('Place',sc,did,base+'place',doc,{list:'dl-places'})}
      ${fArea('What happened',sc,did,base+'body',doc,{rows:4,cls:'wide'})}
    </div>
    ${ids.length?h`<div class="row evchips" role="group" aria-label="Who was in it"><span class="fl">Who</span>${ids.map(u=>h`<button class="btn sm chk" data-act="tl_who" data-id="${x.id}" data-h="${hid?'1':''}" data-uid="${u}" aria-pressed="${String(w.indexOf(u)>=0)}">${tName(S.trainers[u])}</button>`)}<span class="sub">${w.length?'':'Nobody ticked: the whole party.'}</span></div>`:''}
    <p class="sub">Session 0, or any years before the campaign, puts it under Before the campaign.</p>
    <div class="row sp"><button class="btn sm" data-act="toggle" data-key="${(hid?'tlh':'tl')+x.id}">Done</button>${hid?h`<button class="btn sm ghost" data-act="tl_hdel" data-id="${x.id}">Delete</button>`:delBtn('tl',x.id,'Delete')}</div>
  </div></li>`;
}
function tlItem(x,compact){
  const e=x.e,hid=x.hid,key=(hid?'tlh':'tl')+x.id;
  const canE=hid?S.me.admin:canOwn(e);
  if(S.ui.open[key]&&canE)return tlEdit(x);
  const k=tlKind(e),w=tlWho(e),when=tlWhen(e);
  return h`<li class="tl-ev tk-${k} ${hid?'tlhid':''} ${compact?'tlc':''}"><span class="tl-dot" aria-hidden="true"></span><div class="tl-body ${compact?'':'entry'}">
    <div class="row sp"><h3>${e.title||'Untitled event'}</h3><span class="row"><span class="pill tk">${tlKindName(k)}</span>${hid?h`<span class="pill gm">Hidden</span>`:''}</span></div>
    <div class="meta">${when?h`<span>${when}</span>`:''}${e.place?h`<span>${e.place}</span>`:''}${w.length?h`<span>${w.map(u=>tName(S.trainers[u])).join(', ')}</span>`:''}${!compact&&e.addedBy&&!hid?h`<span>by ${nm(e.addedBy)}</span>`:''}</div>
    ${!compact&&e.body?h`<p class="prewrap">${e.body}</p>`:''}
    ${!compact&&(canE||S.me.admin)?h`<div class="row">${canE?h`<button class="btn sm" data-act="toggle" data-key="${key}">Edit</button>`:''}${S.me.admin?(hid?h`<button class="btn sm" data-act="tl_reveal" data-id="${x.id}">Reveal to the players</button>`:h`<button class="btn sm ghost" data-act="tl_hide" data-id="${x.id}">Hide from the players</button>`):''}</div>`:''}
  </div></li>`;
}
/* ----- the page ----- */
function timelineTab(){
  const gm=!!S.me.admin;
  const q=String(S.ui.q.tl||'').toLowerCase(),kf=S.ui.f.tlk||'',wf=S.ui.f.tlw&&S.trainers[S.ui.f.tlw]?S.ui.f.tlw:'',compact=!!S.ui.f.tlc,showH=gm&&!S.ui.f.tlnh;
  const all=tlAll().filter(x=>!x.hid||showH);
  const list=all.filter(x=>{const e=x.e,w=tlWho(e);
    return (!kf||tlKind(e)===kf)&&(!wf||!w.length||w.indexOf(wf)>=0)&&(!q||[e.title,e.body,e.place,e.when,tlWhen(e)].concat(w.map(u=>tName(S.trainers[u]))).join(' ').toLowerCase().includes(q));});
  const cnt={};all.forEach(x=>{const k=tlKind(x.e);cnt[k]=(cnt[k]||0)+1;});
  const byDate=(a,b)=>String(clParse(a.e.date)?a.e.date:'~').localeCompare(String(clParse(b.e.date)?b.e.date:'~'))||num(a.e.createdAt)-num(b.e.createdAt);
  const pre=list.filter(x=>tlPre(x.e)).sort((a,b)=>tlAgo(b.e)-tlAgo(a.e)||byDate(a,b));
  const ss=[...new Set(list.filter(x=>!tlPre(x.e)).map(x=>num(x.e.session)))].sort((a,b)=>a-b);
  const groups=(pre.length?[[0,pre]]:[]).concat(ss.map(s=>[s,list.filter(x=>!tlPre(x.e)&&num(x.e.session)===s).sort(byDate)]));
  const jr=s=>entriesOf(S.journal).filter(j=>num(j.session)===s).sort((a,b)=>num(a.createdAt)-num(b.createdAt))[0];
  const today=clToday();
  return h`${gm?tlSuggestHtml():''}<section class="panel"><div class="ph"><h2>Timeline</h2><span class="row">${canShared()?h`<button class="btn primary sm" data-act="newDoc" data-kind="tl">Add event</button>`:''}${gm?h`<button class="btn sm" data-act="tl_newh">Add hidden event</button>`:''}</span></div>
    <p class="sub">The story in the order it happened, by session, with in-world dates from the calendar. Anyone can add an event; its author or the GM can edit it.${gm?' Hidden events are yours alone until you reveal them.':''}</p>
    <div class="row evchips cfchips" role="group" aria-label="Show one kind of event"><button class="btn sm chk" data-act="tl_kind" data-v="" aria-pressed="${String(!kf)}">All <span class="cfn">${all.length}</span></button>${TL_KINDS.filter(([k])=>cnt[k]||kf===k).map(([k,l])=>h`<button class="btn sm chk tkb tk-${k}" data-act="tl_kind" data-v="${k}" aria-pressed="${String(kf===k)}">${l} <span class="cfn">${cnt[k]||0}</span></button>`)}</div>
    <div class="tools"><label class="fld"><span class="fl">Search</span><input type="search" data-u="q.tl" value="${S.ui.q.tl||''}" placeholder="Title, place, what happened"></label>
      ${tids().length?h`<label class="fld"><span class="fl">Whose story</span><select data-u="f.tlw"><option value="">Everyone’s</option>${tids().map(u=>h`<option value="${u}" ${wf===u?raw('selected'):''}>${tName(S.trainers[u])}’s</option>`)}</select></label>`:''}
      <label class="row"><input type="checkbox" data-u="f.tlc" ${compact?raw('checked'):''}><span>Titles only</span></label>
      ${gm?h`<label class="row"><input type="checkbox" data-u="f.tlnh" ${S.ui.f.tlnh?raw('checked'):''}><span>Hide my hidden events</span></label>`:''}</div>
    ${wf?h`<p class="sub">${tName(S.trainers[wf])}’s events, and the whole party’s.</p>`:''}</section>
    ${groups.length?h`<div class="tlwrap">${groups.map(([s,items])=>{const j=s?jr(s):null;
      return h`<section class="tlg"><div class="ph"><h2>${s?'Session '+s:'Before the campaign'}</h2><span class="row"><span class="sub">${items.length} ${items.length===1?'event':'events'}</span>${j?h`<button class="btn sm ghost" data-act="tl_jr" data-s="${s}">Journal: ${j.title||'Session '+s}</button>`:''}</span></div>
        <ul class="tl-line">${items.map(x=>tlItem(x,compact))}</ul></section>`;})}
      ${today&&!kf&&!q?h`<div class="tl-now"><span class="tl-dot" aria-hidden="true"></span><b>Today</b> <span class="sub">${clNice(today,{y:1})}</span></div>`:''}</div>`
      :emptyState(all.length?'No matches':'Nothing on the timeline yet',all.length?'Try a different search or filter.':'Add the moments that changed things: a gym won, a rival met, a place that was not what it seemed.')}`;
}
/* ----- actions ----- */
function tlAct(b){
  const d=b.dataset,gm=!!S.me.admin;
  const loc=()=>{const hid=d.h==='1';return hid?{sc:'gd',id:'dash',base:'tlh.'+d.id+'.',e:tlHid()[d.id]}:{sc:'tl',id:d.id,base:'',e:S.timeline[d.id]};};
  switch(d.act){
    case 'tl_kind':S.ui.f.tlk=d.v||'';render();break;
    case 'tl_who':{const L=loc();if(!L.e)break;if(d.h==='1'?!gm:!canOwn(L.e))break;const w=tlWho(L.e),i=w.indexOf(d.uid);if(i>=0)w.splice(i,1);else w.push(d.uid);edit(L.sc,L.id,L.base+'who',w);render();break;}
    case 'tl_today':{const L=loc();if(!L.e||!clToday())break;if(d.h==='1'?!gm:!canOwn(L.e))break;edit(L.sc,L.id,L.base+'date',clToday());render();break;}
    case 'tl_jr':{const j=entriesOf(S.journal).filter(x=>num(x.session)===num(d.s))[0];S.ui.sub='party';S.ui.q.journal=j&&j.title?j.title:'';setTab('journal');break;}
  }
  if(!gm)return;
  switch(d.act){
    case 'tl_newh':{const k=rkKey();edit('gd','dash','tlh.'+k,{session:num(S.meta.session)||1,date:clToday()||'',when:'',ago:0,title:'',place:'',body:'',kind:'story',who:[],ms:'',addedBy:S.me.id,createdAt:Date.now()});S.ui.open['tlh'+k]=true;render();break;}
    case 'tl_hdel':{const H=Object.assign({},tlHid());delete H[d.id];edit('gd','dash','tlh',H);render();break;}
    case 'tl_reveal':{const H=Object.assign({},tlHid()),e=H[d.id];if(!e)break;const id=S.db.collection('timeline').doc().id;
      newDoc('tl',id,Object.assign(tlFields(e),{when:String(e.when||''),ago:tlAgo(e),addedBy:e.addedBy||S.me.id,createdAt:num(e.createdAt)||Date.now()}));
      delete H[d.id];edit('gd','dash','tlh',H);toast('Revealed: '+(e.title||'the event')+'.',true);render();break;}
    case 'tl_hide':{const e=S.timeline[d.id];if(!e)break;
      edit('gd','dash','tlh.'+rkKey(),Object.assign(tlFields(e),{when:String(e.when||''),ago:tlAgo(e),addedBy:e.addedBy||S.me.id,createdAt:num(e.createdAt)||Date.now()}));
      removeDoc('tl',d.id);toast('Hidden from the players.',true);render();break;}
    case 'tl_ok':{const o=tlSuggest()[num(d.i)];if(!o)break;tlApprove(o,d.h==='1');render();break;}
    case 'tl_no':{const o=tlSuggest()[num(d.i)];if(!o)break;edit('gd','dash','tlm.'+tlMk(o.ms),0);render();break;}
    case 'tl_okall':{const L=tlSuggest();L.forEach(o=>tlApprove(o,false));toast('Added '+L.length+' milestone'+(L.length===1?'':'s')+' to the timeline.',true);render();break;}
    case 'tl_noall':{const L=tlSuggest(),m=Object.assign({},dashG().tlm||{});L.forEach(o=>{m[tlMk(o.ms)]=0;});edit('gd','dash','tlm',m);toast('Dismissed '+L.length+'.',true);render();break;}
  }
}
