/* ---------- Contest judges (Update 72) ----------
   A judge pack (sinnoh-judge-pack, imported on the Contests page) gives the GM a roster of judges and a panel for each hall:
   the hall's head judge, a Contest Committee judge who rotates by in-game month, and a local guest. Each judge leans toward
   some hidden goals (Roll goals mostly picks from them) and has a tell the GM reads out when a player passes an Insight check.
   The roster is kept in gm/contest (field jr), which only the GM can read; the judge's name and public role go on the stage. */
const CSJ_SEATS=[['head','Head judges'],['circuit','Contest Committee'],['festival','Festival judges'],['guest','Guest judges']];
const csRoster=()=>{const r=CSG().jr;return r&&r.judges&&typeof r.judges==='object'?r:null;};
const csJudge=k=>{const R=csRoster();return k&&R&&R.judges[k]?R.judges[k]:null;};
const csjKey=s=>String(s||'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,40);
/* one leaning: a goal kind (one of CS_GOALS), with a contest or battle type, or the text of a goal the GM judges */
function csjLean(x){
  if(!x||typeof x!=='object')return null;
  const d=CS_GOALS.find(g=>g[0]===x.k);
  if(!d)return null;
  const o={k:d[0]};
  if(d[2]==='ct'&&CT_TYPES.indexOf(x.t)>=0)o.t=x.t;
  if(d[2]==='ty'&&TYPES.indexOf(x.t)>=0)o.t=x.t;
  if(d[0]==='gm')o.x=String(x.x||'').slice(0,120);
  return o;
}
/* the panel key a hall uses, and the hall-like panels a pack may add (the Grand Festival) */
function csjPanelList(){
  const R=csRoster();if(!R)return [];
  const halls=ribHalls(),P=R.panels||{};
  const out=halls.filter(x=>P[x.k]).map(x=>({k:x.k,n:x.n}));
  Object.keys(P).forEach(k=>{if(!out.some(x=>x.k===k))out.push({k,n:String(P[k].n||k)});});
  return out;
}
/* this month's Contest Committee judge at a hall: the rotation moves one hall along each in-game month */
function csjCircuit(hall){
  const R=csRoster();if(!R)return '';
  const pool=(R.circuit||[]).filter(k=>R.judges[k]);
  if(!pool.length)return '';
  const keys=ribHalls().map(x=>x.k).concat(Object.keys(R.panels||{}));
  const hi=Math.max(0,keys.indexOf(hall));
  const dt=clParse(clToday());
  const m=dt?dt.getUTCFullYear()*12+dt.getUTCMonth():0;
  return pool[(m+hi)%pool.length];
}
const csjSeat=k=>{const J=csJudge(k);return {k:J?k:'',n:J?J.n:'Judge',r:J?String(J.r||''):'',goals:[]};};
/* load a hall's panel into the setup draft: head judge, Committee judge (or the panel's fixed second judge), first guest */
function csLoadPanel(D,key){
  const R=csRoster();if(!R||!D)return false;
  const P=(R.panels||{})[key];if(!P)return false;
  const head=csJudge(P.head)?P.head:'';
  const second=csJudge(P.second)?P.second:csjCircuit(key);
  const guest=(P.guests||[]).find(k=>csJudge(k)&&k!==head&&k!==second)||'';
  D.judges=[head,second,guest].map((k,j)=>k?csjSeat(k):{k:'',n:CS_JUDGES[j],r:'',goals:[]});
  D.panel=key;
  D.judges.forEach((J,j)=>csRollGoals(J,D.var&&D.var.sup?'':D.type,j===0));
  return true;
}
/* the leanings of a draft judge, shuffled; Roll goals takes most goals from here */
function csjLeans(J){
  const R=J&&csJudge(J.k);
  const l=(R&&Array.isArray(R.lean)?R.lean:[]).map(csjLean).filter(Boolean);
  for(let i=l.length-1;i>0;i--){const z=Math.floor(Math.random()*(i+1));[l[i],l[z]]=[l[z],l[i]];}
  return l;
}
/* the judge picker on the setup: this hall's judges first, then the Committee, festival judges, guests and the other halls */
function csjPicker(D,J,j){
  const R=csRoster();
  if(!R)return h`<label class="fld"><span class="fl">Judge ${j+1}</span><input type="text" data-csx="jn" data-j="${j}" value="${J.n}"></label>`;
  const P=(R.panels||{})[D.panel||D.hall]||{},mine=new Set([P.head,P.second].concat(P.guests||[]).filter(Boolean));
  const all=Object.keys(R.judges).sort((a,z)=>String(R.judges[a].n).localeCompare(String(R.judges[z].n)));
  const opt=k=>h`<option value="${k}" ${J.k===k?raw('selected'):''}>${R.judges[k].n}${k===csjCircuit(D.panel||D.hall)&&R.judges[k].seat==='circuit'?' (this month)':''}</option>`;
  const here=[P.head,P.second].concat(P.guests||[]).filter((k,i,a)=>k&&R.judges[k]&&a.indexOf(k)===i);
  return h`<label class="fld"><span class="fl">Judge ${j+1}</span><select data-csx="jk" data-j="${j}">
      ${here.length?h`<optgroup label="This panel">${here.map(opt)}</optgroup>`:''}
      ${CSJ_SEATS.map(([s,l])=>{const ks=all.filter(k=>!mine.has(k)&&(R.judges[k].seat||'guest')===s);return ks.length?h`<optgroup label="${l}">${ks.map(opt)}</optgroup>`:'';})}
      <optgroup label="Someone else"><option value="" ${J.k?'':raw('selected')}>Type a name…</option></optgroup>
    </select></label>
    ${J.k?'':h`<label class="fld"><span class="fl">Name</span><input type="text" data-csx="jn" data-j="${j}" value="${J.n}"></label>`}
    ${J.k?csjAbout(J.k,false):''}`;
}
const CSJ_ANY={ct:'Most Heart Points with one contest type’s moves',ty:'Most Heart Points with one type’s moves',stat:'Highest contest stat of one type'};
const csjLeanTxt=l=>!l.t&&CSJ_ANY[l.k]?CSJ_ANY[l.k]:l.k==='gm'&&l.x?l.x+' (you choose)':csGoalTxt({k:l.k,t:l.t||'',x:l.x||''});
/* what the GM sees about a judge: role, leanings, tell, notes */
function csjAbout(k,full){
  const J=csJudge(k);if(!J)return '';
  const L=(J.lean||[]).map(csjLean).filter(Boolean);
  return h`<div class="csj">${J.r?h`<p class="sub">${J.r}</p>`:''}
    ${L.length?h`<p class="csjl"><b>Leans toward</b> ${L.map(csjLeanTxt).join(' · ')}</p>`:''}
    ${J.tell?h`<p class="csjt"><b>Tell</b> ${J.tell}</p>`:''}
    ${full&&J.note?h`<p class="sub">${J.note}</p>`:''}</div>`;
}
/* the roster, under the setup: import, load a panel, and every judge's leanings and tell */
function csjRosterHtml(D){
  const R=csRoster();
  const n=R?Object.keys(R.judges).length:0,pl=csjPanelList();
  return h`<div class="csjr"><div class="row sp"><span><b>Judge roster</b> <span class="sub">${R?n+' judges'+(R.name?' · '+R.name:''):'none yet: every hall starts with Mr. Contesta, Mr. Sukizo and Nurse Joy'}</span></span>
      <span class="row">${R&&pl.length?h`<label class="fld"><span class="fl">Load the panel for</span><select data-csx="jp">${pl.map(x=>h`<option value="${x.k}" ${(D.panel||D.hall)===x.k?raw('selected'):''}>${x.n}</option>`)}</select></label>`:''}
        ${R?h`<button class="btn sm ghost" data-act="cs_jro" aria-expanded="${String(!!D.jro)}">${D.jro?'Hide the roster':'Show the roster'}</button>`:''}
        <button class="btn sm ${R?'ghost':''}" data-act="cs_jpack">${R?'Import again':'Import a judge pack'}</button></span></div>
    ${!R?h`<p class="sub">A judge pack (sinnoh-contest-judges.json) gives every hall its own head judge, a Contest Committee judge who rotates each month and a local guest, each leaning toward the goals that suit them.</p>`:''}
    ${R&&D.jro?CSJ_SEATS.map(([s,l])=>{const ks=Object.keys(R.judges).filter(k=>(R.judges[k].seat||'guest')===s).sort((a,z)=>String(R.judges[a].n).localeCompare(String(R.judges[z].n)));
      return ks.length?h`<h4>${l}</h4><div class="csjg">${ks.map(k=>h`<div class="judge"><b>${R.judges[k].n}</b>${csjAbout(k,true)}</div>`)}</div>`:'';}):''}
  </div>`;
}
/* reading a judge pack: replaces the roster; contests already set up keep their judges */
async function csjImport(file){
  if(!S.me.admin||!file)return;
  let d=null;
  try{d=JSON.parse(await file.text());}catch(e){}
  if(!d||d.format!=='sinnoh-judge-pack'||!Array.isArray(d.judges)){toast('That is not a judge pack. Choose sinnoh-contest-judges.json.');return;}
  const judges={};
  d.judges.forEach(x=>{
    if(!x||!String(x.n||'').trim())return;
    let k=csjKey(x.k||x.n);if(!k)return;
    while(judges[k])k+='-2';
    judges[k]={n:String(x.n).trim().slice(0,60),r:String(x.r||'').slice(0,120),seat:CSJ_SEATS.some(s=>s[0]===x.seat)?x.seat:'guest',
      halls:Array.isArray(x.halls)?x.halls.map(String).slice(0,20):[],lean:(Array.isArray(x.lean)?x.lean:[]).map(csjLean).filter(Boolean).slice(0,6),
      tell:String(x.tell||'').slice(0,400),note:String(x.note||'').slice(0,800)};
  });
  const ref=k=>{const kk=csjKey(k);return judges[kk]?kk:'';};
  const panels={};
  Object.keys(d.panels||{}).forEach(pk=>{
    const p=d.panels[pk];if(!p||typeof p!=='object')return;
    const key=csjKey(pk);if(!key)return;
    panels[key]={n:String(p.n||'').slice(0,60),head:ref(p.head),second:ref(p.second),guests:(Array.isArray(p.guests)?p.guests:[]).map(ref).filter(Boolean).slice(0,8)};
  });
  const circuit=(Array.isArray(d.circuit)?d.circuit.map(ref):Object.keys(judges).filter(k=>judges[k].seat==='circuit')).filter(Boolean);
  const n=Object.keys(judges).length;
  if(!n){toast('That judge pack has no judges in it.');return;}
  edit('cg','contest','jr',{v:1,name:String(d.name||'').slice(0,80),judges,panels,circuit,at:Date.now()});
  if(S.ui.cs)csLoadPanel(S.ui.cs,S.ui.cs.hall);
  const halls=ribHalls().filter(x=>panels[x.k]).length;
  toast('Imported '+n+' judges'+(halls?', with panels for '+halls+' hall'+(halls===1?'':'s'):'')+'. Contests you set up now start with each hall’s panel.',true);
  render();
}
