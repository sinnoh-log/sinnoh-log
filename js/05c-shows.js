'use strict';
/* Sinnoh Trainer Log · 05c-shows. The files in js/ are classic scripts that share one scope: load them in order (see index.html). */
/* ---------- More for the contest stage (Update 67) ----------
   Trainer Appeal: once per contest, a trainer adds a skill check to one of their appeals, against a number the GM sets: a success
     adds 2d4 Heart Points to that appeal, beating it by 5 or more 4d4 (not doubled by an Electrified judge).
   Rival Showcase: the GM pairs contestants at setup; after each round, whoever earned more Heart Points in their pair that round
     gets 2d4 more (a tie gets nothing), counted for the judge they appealed to.
   Audience Participation: a crowd meter (0–10) everyone sees, with a favourite contest type. An appeal of that type +2, a raised
     Voltage +1, Electrifying a judge +2, a Trainer Appeal that lands +1, creativity +1; a repeated move only −1. Filling it pays the
     appealer 3d4 and empties it.
   Before the appeals, in this order: the Poffin Cook-Off (Chocovine), the Super Contest's Visual and Dance stages, then any extra
     stages. Cook-Off, Visual and Dance give Heart Points that count toward every judge's Heart Point goals; an extra stage is one
     roll each and its top contestant earns a Star Point.
     Cook-Off: a check; every 5 points is 1d4. Visual: a check + the Pokémon's contest stat in the contest type + 2 for fitting the
     theme; every 5 points is 1d4. Dance: four beats, the lead turning through the contestants; each beat everyone rolls, a dancer
     who matches or beats the lead gets 1d4, and the lead 1d4 for each dancer who misses.
   Hall twists: Celestic (composure: a clashing move loses 1d4), Chocovine (the Cook-Off), Daybreak (final-round appeals +1d4);
     Sage's tasting round is an extra stage.
   Hall presets fill in the setup when a hall is picked; the GM can save their own (gm/contest.presets).
   A player's check is the trainer's skill (the stat's modifier and the talent); an NPC's is the bonus the GM gives them at setup.
   The GM rolls the stages, typing a player's real d20 when they roll one. */
S.ui.csp=S.ui.csp||{d:{},th:{},mv:{},dm:{},k:''};
const CS_XS=[
  ['fashion','Fashion Show','Cute and Beauty','perform','Accessories, grooming and a turn on the runway.'],
  ['athlon','Pokéathlon','Tough','athletics','A short athletic course.'],
  ['heroes','PokéStar Heroes','Cool','perform','A scripted scene for the cameras.'],
  ['talent','Talent Show','Clever','sleight','A trick, a puzzle or a skill only this pair can do.'],
  ['dummy','Dummy round','Any','','One damaging move each at a stage dummy: the most damage wins.'],
  ['tasting','Tasting round','Clever','nature','A dish or Poffin for the judges to taste.']
];
const CS_TW=[['celestic','Composure','Celestic: a clashing move loses 1d4.'],['cook','Poffin Cook-Off','Chocovine: the night before, a cooking check gives starting Heart Points.'],['dawn','First light','Daybreak: final-round appeals get +1d4.']];
const CS_PRE_NAME={cook:'Poffin Cook-Off',vis:'Visual stage',dan:'Dance stage'};
const csXs=k=>CS_XS.find(x=>x[0]===k)||null;
const csPreName=k=>k.indexOf('x:')===0?((csXs(k.slice(2))||[])[1]||'Extra stage'):CS_PRE_NAME[k]||k;
const csSkName=k=>(SKILLS.find(s=>s[0]===k)||[0,k||'a check'])[1];
/* built-in presets, from each hall's own description on the map */
const CS_PRESETS={
  jubilife:{type:'Cool',var:{ap:1},note:'Televised: the crowd counts.'},
  floaroma:{type:'Cute',xs:['fashion'],note:'A flower-show Fashion Show first.'},
  hearthome:{type:'Beauty',var:{vis:1,dan:1,sup:1,ap:1},theme:'Elegant',note:'The Super Contest Hall: Visual and Dance stages, a random type each round, the hardest field.'},
  majolica:{month:1,xs:['fashion'],theme:'Glazed',note:'A different category each month.'},
  solaceon:{type:'Cute',var:{ta:1},note:'Beginner-friendly: trainers can show off too.'},
  celestic:{type:'Beauty',tw:{celestic:1},note:'Heritage Contest, judged on composure.'},
  sage:{type:'Clever',xs:['tasting'],note:'A tasting round before the appeals.'},
  chocovine:{type:'Cute',tw:{cook:1},note:'The Poffin Cook-Off the night before.'},
  sandalstraw:{type:'Tough',var:{vis:1},theme:'Natural, woven costumes',note:'Woven costumes win favour.'},
  lilypad:{type:'Beauty',var:{dbl:1},xs:['fashion'],note:'Beauty and Cute together.'},
  snowpoint:{type:'Cool',var:{hv:1},note:'The Midwinter Appeal Cup runs hot.'},
  arrowroot:{type:'Tough',xs:['athlon'],note:'Millhall: a Pokéathlon course.'},
  brussel:{type:'Beauty',var:{ap:1},note:'The Greenhouse crowd.'},
  neighborly:{type:'Clever',xs:['talent'],var:{rs:1},note:'Crossroads: rivals and a Talent Show.'},
  daybreak:{type:'Cool',tw:{dawn:1},note:'The final round at first light.'},
  aqua:{type:'Beauty',var:{fest:1,dbl:1,ap:1,ta:1},xs:['heroes'],note:'The Wallace Cup: every category.'}
};
const CS_VARK=['dbl','sup','fest','hv','ta','rs','ap','vis','dan'];
function csMonthType(){const d=clParse(clToday());const m=d?d.getUTCMonth():new Date().getMonth();return CT_TYPES[m%5];}
/* a hall's preset, the GM's own first */
function csPresetOf(hall){
  const own=((CSG().presets||{})[hall]);
  if(own)return Object.assign({own:true},own);
  const p=CS_PRESETS[hall];
  return p?Object.assign({},p,p.month?{type:csMonthType()}:{}):null;
}
function csApplyPreset(D,hall){
  const p=csPresetOf(hall);
  if(!p)return false;
  D.type=CT_TYPES.indexOf(p.type)>=0?p.type:D.type;
  D.var={};CS_VARK.forEach(k=>{D.var[k]=!!(p.var||{})[k];});
  D.xs={};(p.xs||[]).forEach(k=>{if(csXs(k))D.xs[k]=true;});
  D.tw={};Object.keys(p.tw||{}).forEach(k=>{if(CS_TW.some(t=>t[0]===k))D.tw[k]=!!p.tw[k];});
  D.theme=String(p.theme||'');
  if(p.tdc)D.tdc=num(p.tdc);
  if(p.sk)D.sk=Object.assign({},D.sk,p.sk);
  D.note=String(p.note||'')+(p.own?' (your saved preset)':'');
  if(D.judges&&D.judges[0]&&D.judges[0].goals[0]&&D.judges[0].goals[0].k==='ct')D.judges[0].goals[0].t=D.type;
  return true;
}
function csSavePreset(D){
  const p={type:D.type,var:Object.assign({},D.var),xs:Object.keys(D.xs||{}).filter(k=>D.xs[k]),tw:Object.assign({},D.tw),theme:D.theme||'',tdc:num(D.tdc)||15,sk:Object.assign({},D.sk),note:'Saved for this hall.'};
  edit('cg','contest','presets',Object.assign({},CSG().presets||{},{[D.hall]:p}));
}
/* the bonus a contestant adds to a check */
function csChkBonus(C,eid,skill){
  const E=(C.ents||{})[eid];
  if(!E)return 0;
  if(E.k!=='pc')return num(E.cb);
  const t=S.trainers[E.u],sk=SKILLS.find(s=>s[0]===skill);
  if(!t||!sk)return 0;
  return mod(num(t.stats&&t.stats[sk[2]]))+[0,2,5][clamp(num((t.talents||{})[skill]),0,2)];
}
function csBestStat(E,type,eid){
  /* Update 68: NPCs' contest stats count too (the GM's own copy) */
  return Math.max(0,...csMonStats(E,eid).map(cs=>type?num(cs[type]):Math.max(...CT_TYPES.map(t=>num(cs[t])))));
}
const csRollD4=n=>{const r=[];for(let i=0;i<n;i++)r.push(rnd(4));return r;};
const csSum=a=>a.reduce((x,y)=>x+y,0);
/* ----- Trainer Appeal ----- */
function csTaRoll(C,eid,sk,typed){
  const b=csChkBonus(C,eid,sk),t=rdNum(typed,1,20),d=t!=null?t:rnd(20),tot=d+b,dc=num(C.tdc)||15;
  const dice=tot>=dc+5?4:tot>=dc?2:0,rolled=csRollD4(dice);
  return {sk,d,b,t:tot,dc,dice,rolled,hp:csSum(rolled),typed:t!=null?1:0};
}
/* ----- the crowd ----- */
function csCrowdAfter(C,gain){
  if(!(C.var&&C.var.ap))return {crowd:num(C.crowd),pay:0,rolled:[]};
  let c=clamp(num(C.crowd)+gain,0,10);
  if(c>=10){const r=csRollD4(3);return {crowd:0,pay:csSum(r),rolled:r};}
  return {crowd:c,pay:0,rolled:[]};
}
/* ----- Rival Showcase: after a round, each pair's higher scorer gets 2d4 ----- */
function csRivalBonus(R){
  const C=CSC();
  if(!(C.var&&C.var.rs)||!(C.pairs||[]).length||(C.rsd||{})[R])return;
  const log=(C.log||[]).slice(),ents=Object.assign({},C.ents);
  const got=e=>log.filter(x=>num(x.r)===R&&x.e===e&&!x.k).reduce((a,x)=>a+num(x.tot),0);
  (C.pairs||[]).forEach(([a,z])=>{
    if(!ents[a]||!ents[z])return;
    const ga=got(a),gz=got(z);
    if(ga===gz)return;
    const w=ga>gz?a:z,l=w===a?z:a,r=csRollD4(2),hp=csSum(r);
    const ap=log.find(x=>num(x.r)===R&&x.e===w&&!x.k);
    log.push({k:'rs',r:R,e:w,n:ents[w].name,j:ap?num(ap.j):0,tot:hp,rolled:r,vs:ents[l].name,at:Date.now()});
    ents[w]=Object.assign({},ents[w],{hp:num(ents[w].hp)+hp});
  });
  edit('cs','contest','log',log.slice(-120));
  edit('cs','contest','ents',ents);
  edit('cs','contest','rsd',Object.assign({},C.rsd||{},{[R]:1}));
}
/* ----- the stages before the appeals ----- */
function csPreList(D){
  const out=[];
  if(D.tw&&D.tw.cook)out.push('cook');
  if(D.var&&D.var.vis)out.push('vis');
  if(D.var&&D.var.dan)out.push('dan');
  CS_XS.forEach(x=>{if(D.xs&&D.xs[x[0]])out.push('x:'+x[0]);});
  return out;
}
const csPreKey=C=>(C.pre||[])[num(C.pi)]||'';
const csPreSkill=(C,k)=>(C.sk||{})[k.indexOf('x:')===0?k.slice(2):k]||(k==='cook'?'nature':k.indexOf('x:')===0?((csXs(k.slice(2))||[])[3]||'perform'):'perform');
/* the dummy round: one damaging move's dice, the same-type bonus, and a player's attack modifier */
function csDummyMoves(E){
  const out=[];
  (E.mons||[]).forEach((mo,i)=>{
    let list=[],types=[],m=null;
    if(E.k==='pc'){m=getLocal('p',E.u+'/'+mo.pid);list=((m&&m.moves)||[]).map(x=>({n:String(x.name||'').trim(),d:x.dice||'',t:x.type||'',k:x.kind||''}));types=m?effTypes(m):[];}
    else{list=(mo.mv||[]).map(x=>{const p=pxMove(x.n);return {n:x.n,d:p?p.d:'',t:x.t||(p&&p.t)||'',k:p?p.k:''};});types=mo.ty||[];}
    list.filter(x=>x.n&&parseDice(x.d)&&!parseDice(x.d).mon).forEach(x=>out.push(Object.assign(x,{i,types,m})));
  });
  return out;
}
function csDummyRoll(E,mvName,typed){
  const x=csDummyMoves(E).find(y=>y.n===mvName)||csDummyMoves(E)[0];
  if(!x)return {t:0,txt:'no damaging move'};
  const dc=parseDice(x.d),t=rdNum(typed,dc.n,dc.n*dc.s);
  const r=t!=null?[]:Array.from({length:dc.n},()=>rnd(dc.s));
  const sum=t!=null?t:csSum(r);
  const stab=x.types.indexOf(x.t)>=0?4:0;
  const st=x.m&&(x.k==='Physical'||x.k==='Special')?mod(effStat(Object.assign({id:''},x.m),x.k==='Special'?'spa':'atk')):0;
  const tot=Math.max(0,sum+dc.f+stab+st);
  return {t:tot,mv:x.n,txt:x.n+': '+dc.n+'d'+dc.s+(t!=null?' typed '+t:' ['+r.join(', ')+']')+(dc.f?' '+sgn(dc.f):'')+(stab?' +4 same-type':'')+(st?' '+sgn(st)+' stat':'')+' = '+tot,typed:t!=null?1:0};
}
/* scoring a stage (GM): every contestant at once, with any d20 the GM typed */
function csPreScore(){
  if(!S.me.admin)return;
  const C=CSC(),k=csPreKey(C);
  if(!k||k==='dan')return;
  const ents=csEnts(),U=S.ui.csp,sk=csPreSkill(C,k),res={},E2=Object.assign({},C.ents);
  ents.forEach(e=>{
    const E=C.ents[e];
    if(k==='x:dummy'){const r=csDummyRoll(E,U.mv[e],U.dm[e]);res[e]={t:r.t,txt:r.txt,rd:r.typed};return;}
    const td=rdNum(U.d[e],1,20),d=td!=null?td:rnd(20),b=csChkBonus(C,e,sk);
    let tot=d+b,extra='';
    if(k==='vis'){const st=csBestStat(E,C.type||'',e);const th=U.th[e]?2:0;tot+=st+th;extra=(st?' + '+st+' contest stat':'')+(th?' + 2 theme':'');}
    const r={d,b,t:tot,rd:td!=null?1:0,txt:'d20 '+d+(td!=null?' typed':'')+' '+sgn(b)+' '+csSkName(sk)+extra+' = '+tot};
    if(k==='cook'||k==='vis'){r.dice=Math.floor(tot/5);r.rolled=csRollD4(r.dice);r.hp=csSum(r.rolled);E2[e]=Object.assign({},E,{hp:num(E.hp)+r.hp,sh:num(E.sh)+r.hp});}
    res[e]=r;
  });
  let win=[];
  if(k.indexOf('x:')===0){const mx=Math.max(0,...ents.map(e=>num(res[e].t)));if(mx>0)win=ents.filter(e=>num(res[e].t)===mx);}
  edit('cs','contest','pr',Object.assign({},C.pr||{},{[k]:{res,win,done:1,sk}}));
  if(k==='cook'||k==='vis')edit('cs','contest','ents',E2);
  S.ui.csp={d:{},th:{},mv:{},dm:{},k:''};
  render();
}
/* the dance: one beat at a time, then the dice */
function csDanceBeat(){
  if(!S.me.admin)return;
  const C=CSC(),ents=csEnts(),P=(C.pr||{}).dan||{beats:[]},beats=(P.beats||[]).slice();
  if(beats.length>=4)return;
  const b=beats.length,lead=ents[b%ents.length],sk=csPreSkill(C,'dan'),U=S.ui.csp,res={};
  ents.forEach(e=>{const td=rdNum(U.d[e],1,20),d=td!=null?td:rnd(20),bn=csChkBonus(C,e,sk);res[e]={d,t:d+bn,rd:td!=null?1:0};});
  beats.push({lead,res});
  edit('cs','contest','pr',Object.assign({},C.pr||{},{dan:{beats,done:0,sk}}));
  S.ui.csp.d={};
  render();
}
function csDanceDice(beats,ents){
  const n={};ents.forEach(e=>{n[e]=0;});
  (beats||[]).forEach(B=>{const L=num((B.res[B.lead]||{}).t);ents.forEach(e=>{if(e===B.lead)return;if(num((B.res[e]||{}).t)>=L)n[e]++;else n[B.lead]++;});});
  return n;
}
function csDanceScore(){
  if(!S.me.admin)return;
  const C=CSC(),ents=csEnts(),P=(C.pr||{}).dan||{};
  if((P.beats||[]).length<4)return;
  const n=csDanceDice(P.beats,ents),res={},E2=Object.assign({},C.ents);
  ents.forEach(e=>{const r=csRollD4(n[e]);res[e]={dice:n[e],rolled:r,hp:csSum(r)};E2[e]=Object.assign({},C.ents[e],{hp:num(C.ents[e].hp)+res[e].hp,sh:num(C.ents[e].sh)+res[e].hp});});
  edit('cs','contest','pr',Object.assign({},C.pr||{},{dan:Object.assign({},P,{res,done:1})}));
  edit('cs','contest','ents',E2);
  render();
}
function csPreNext(){
  if(!S.me.admin)return;
  const C=CSC(),i=num(C.pi)+1;
  S.ui.csp={d:{},th:{},mv:{},dm:{},k:''};
  if(i<(C.pre||[]).length){edit('cs','contest','pi',i);render();return;}
  csStartRound(1);edit('cs','contest','stage','appeal');render();
}
/* ----- what the stages look like ----- */
function csPreHtml(C,gm){
  const k=csPreKey(C);
  if(!k)return '';
  const ents=csEnts(),P=(C.pr||{})[k]||{},sk=csPreSkill(C,k),U=S.ui.csp,x=k.indexOf('x:')===0?csXs(k.slice(2)):null;
  const nm=e=>(C.ents[e]||{}).name||'';
  const step=h`<span class="pill">${num(C.pi)+1} of ${(C.pre||[]).length} before the appeals</span>`;
  const what=k==='cook'?'Each trainer makes a '+csSkName(sk)+' check; every 5 points is 1d4 Heart Points, counted for every judge.'
    :k==='vis'?'Theme: '+(C.theme||'the contest type')+'. Each trainer makes a '+csSkName(sk)+' check, plus the Pokémon’s '+(C.type||'best')+' contest stat, plus 2 for fitting the theme; every 5 points is 1d4 Heart Points, counted for every judge.'
    :k==='dan'?'Four beats, the lead turning through the contestants. Each beat everyone makes a '+csSkName(sk)+' check: a dancer who matches or beats the lead gets 1d4, and the lead 1d4 for each dancer who misses. The Heart Points count for every judge.'
    :x?(x[4]+' '+(k==='x:dummy'?'':'Each trainer makes one '+csSkName(sk)+' check.')+' The top contestant earns a Star Point.'):'';
  const sel=gm&&!P.done&&k!=='x:dummy'?h`<label class="fld cssk"><span class="fl">Check</span><select data-csx="psk" data-k="${k}">${SKILLS.map(s=>h`<option value="${s[0]}" ${s[0]===sk?raw('selected'):''}>${s[1]}</option>`)}</select></label>`:'';
  let body='';
  if(k==='dan'){
    const beats=P.beats||[],n=csDanceDice(beats,ents);
    body=h`<table class="cstab"><thead><tr><th>Contestant</th>${[0,1,2,3].map(b=>h`<th>Beat ${b+1}${beats[b]?h`<br><span class="sub">lead ${nm(beats[b].lead)}</span>`:b===beats.length?h`<br><span class="sub">lead ${nm(ents[b%ents.length])}</span>`:''}</th>`)}<th>${P.done?'Heart Points':'Dice so far'}</th></tr></thead>
      <tbody>${ents.map(e=>h`<tr><td><b>${nm(e)}</b> <span class="sub">${sgn(csChkBonus(C,e,sk))}</span></td>${[0,1,2,3].map(b=>{const B=beats[b];if(B){const r=B.res[e]||{},L=num((B.res[B.lead]||{}).t);return h`<td class="${e===B.lead?'lead':num(r.t)>=L?'hit':'miss'}">${num(r.t)}${r.rd?'*':''}</td>`;}
        return b===beats.length&&gm&&!P.done?h`<td><input type="number" inputmode="numeric" min="1" max="20" class="csd" data-csx="pd" data-e="${e}" value="${U.d[e]||''}" placeholder="d20" aria-label="${nm(e)}’s d20 for beat ${b+1}"></td>`:h`<td></td>`;})}
        <td>${P.done?h`<b>♥ ${num((P.res||{})[e]&&P.res[e].hp)}</b> <span class="sub">${num((P.res||{})[e]&&P.res[e].dice)}d4</span>`:n[e]+'d4'}</td></tr>`)}</tbody></table>
      <p class="sub">* typed from real dice. A blank box is rolled by the site.</p>
      ${gm&&!P.done?(beats.length<4?h`<button class="btn primary sm" data-act="cs_beat">Dance beat ${beats.length+1}</button>`:h`<button class="btn primary sm" data-act="cs_dscore">Roll the Heart Points</button>`):''}`;
  }else if(P.done){
    body=h`<ul class="applog">${ents.map(e=>{const r=(P.res||{})[e]||{};return h`<li><b>${nm(e)}</b> · ${r.txt||''}${r.hp!=null?h` → <b>${r.dice}d4 [${(r.rolled||[]).join(', ')}] = ${r.hp} ♥</b>`:''}${(P.win||[]).indexOf(e)>=0?h` <span class="pill good">★ Star Point</span>`:''}${r.rd?h` <span class="pill rdp">real dice</span>`:''}</li>`;})}</ul>`;
  }else if(gm){
    body=h`<div class="cspre">${ents.map(e=>{const E=C.ents[e];
      if(k==='x:dummy'){const L=csDummyMoves(E);return h`<div class="brl"><b>${nm(e)}</b>${L.length?h`<select data-csx="pmv" data-e="${e}" aria-label="${nm(e)}’s move">${L.map(m=>h`<option ${U.mv[e]===m.n?raw('selected'):''}>${m.n}</option>`)}</select><input type="number" inputmode="numeric" class="csd" data-csx="pdm" data-e="${e}" value="${U.dm[e]||''}" placeholder="damage dice" aria-label="${nm(e)}’s damage dice total">`:h`<span class="sub">no damaging move</span>`}</div>`;}
      return h`<div class="brl"><b>${nm(e)}</b><span class="sub">${sgn(csChkBonus(C,e,sk))} ${csSkName(sk)}${k==='vis'&&csBestStat(E,C.type||'',e)?' + '+csBestStat(E,C.type||'',e)+' stat':''}</span>
        <input type="number" inputmode="numeric" min="1" max="20" class="csd" data-csx="pd" data-e="${e}" value="${U.d[e]||''}" placeholder="d20" aria-label="${nm(e)}’s d20">
        ${k==='vis'?h`<label class="chip chkc"><input type="checkbox" data-act="cs_pth" data-e="${e}" ${U.th[e]?raw('checked'):''}><span>Fits the theme</span></label>`:''}</div>`;})}
      <p class="sub">Type a player’s d20 if they rolled real dice; a blank box is rolled by the site.</p>
      <button class="btn primary sm" data-act="cs_pscore">Roll ${csPreName(k)}</button></div>`;
  }else body=h`<p class="sub">The GM is running the ${csPreName(k)}.</p>`;
  const last=num(C.pi)+1>=(C.pre||[]).length;
  return h`<div class="fside cspreb"><div class="row sp"><h3>${csPreName(k)}</h3>${step}</div><p class="sub">${what}</p>${sel}${body}
    ${gm&&P.done?h`<div class="row"><button class="btn primary sm" data-act="cs_pnext">${last?'Start the appeals':'Next: '+csPreName(C.pre[num(C.pi)+1])}</button></div>`:''}</div>`;
}
function csCrowdHtml(C){
  if(!(C.var&&C.var.ap))return '';
  const c=num(C.crowd);
  return h`<div class="crowd" aria-label="Crowd meter ${c} of 10"><span class="fl">Crowd</span><span class="cmeter">${Array.from({length:10},(_,i)=>h`<i class="${i<c?'on':''}"></i>`)}</span><span class="mono">${c}/10</span><span class="sub">loves</span> ${C.cfav?ctChip(C.cfav):''}</div>`;
}
/* the extra parts of the setup form */
function csSetupMore(D){
  const tog=(k,l,x)=>h`<label class="chip chkc"><input type="checkbox" data-act="cs_var" data-k="${k}" ${D.var[k]?raw('checked'):''}><span>${l}</span>${x?h` <span class="sub">${x}</span>`:''}</label>`;
  const skSel=(k,lbl)=>h`<label class="fld cssk"><span class="fl">${lbl}</span><select data-csx="dsk" data-k="${k}">${SKILLS.map(s=>h`<option value="${s[0]}" ${(D.sk[k]||'')===s[0]?raw('selected'):''}>${s[1]}</option>`)}</select></label>`;
  const ents=[].concat(tids().filter(u=>D.pcs[u]&&D.pcs[u].on).map(u=>['p_'+u,tName(S.trainers[u])]),D.npcs.map(n=>[n.id,n.name]));
  return h`<div class="row evchips">${tog('ta','Trainer Appeal','once per contest')}${tog('rs','Rival Showcase','pairs, +2d4 a round')}${tog('ap','Audience Participation','a crowd meter')}</div>
    ${D.var.ta?h`<div class="fgrid"><label class="fld"><span class="fl">Trainer Appeal target</span><input type="number" inputmode="numeric" min="5" max="40" data-csx="tdc" value="${D.tdc||15}"></label><p class="sub">Success: 2d4 on that appeal. Beat it by 5 or more: 4d4.</p></div>`:''}
    <h3 class="refg">Before the appeals</h3>
    <div class="row evchips">${tog('vis','Visual stage','Super Contest')}${tog('dan','Dance stage','Super Contest')}${CS_XS.map(x=>h`<label class="chip chkc"><input type="checkbox" data-act="cs_xs" data-k="${x[0]}" ${D.xs[x[0]]?raw('checked'):''}><span>${x[1]}</span> <span class="sub">${x[2]}</span></label>`)}</div>
    <div class="fgrid">${D.var.vis?h`<label class="fld"><span class="fl">Visual theme</span><input type="text" data-csx="theme" value="${D.theme||''}" placeholder="e.g. Elegant"></label>${skSel('vis','Visual check')}`:''}${D.var.dan?skSel('dan','Dance check'):''}
      ${CS_XS.filter(x=>D.xs[x[0]]&&x[3]).map(x=>skSel(x[0],x[1]+' check'))}${D.tw.cook?skSel('cook','Cook-Off check'):''}</div>
    <h3 class="refg">Hall twists</h3>
    <div class="row evchips">${CS_TW.map(t=>h`<label class="chip chkc"><input type="checkbox" data-act="cs_tw" data-k="${t[0]}" ${D.tw[t[0]]?raw('checked'):''}><span>${t[1]}</span> <span class="sub">${t[2]}</span></label>`)}</div>
    ${D.var.rs&&ents.length>1?h`<h3 class="refg">Rival pairs</h3><div class="bench">${ents.map(([e,n])=>h`<div class="brl"><b>${n}</b><select data-csx="pair" data-e="${e}" aria-label="${n}’s rival"><option value="">No rival</option>${ents.filter(x=>x[0]!==e).map(([o,on])=>h`<option value="${o}" ${D.pairs[e]===o?raw('selected'):''}>${on}</option>`)}</select></div>`)}</div>`:''}`;
}
