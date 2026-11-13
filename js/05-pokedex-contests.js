'use strict';
/* Sinnoh Trainer Log · 05-pokedex-contests. The files in js/ are classic scripts that share one scope: load them in order (see index.html). */
/* ---------- Pokédex ----------
   Names, types, evolution links and the Sinnoh regional order are bundled with the page (dexinfo.js, dexref.js).
   The handbook entry (stats, passives, moves, evolutions) comes from the table's own database once the GM has imported it (pta.js).
   The in-game description is read from PokeAPI's public data on GitHub when an entry is opened, and is not stored anywhere.
   What a trainer has seen or caught is kept on the trainer sheet (field dx). The GM can lock the book so species fill in as they are met. */
S.ui.dx=S.ui.dx||{q:'',reg:'nat',gen:'',type:'',show:'all',page:1,sel:0,y:0};
if(S.ui.dx.sy===undefined){S.ui.dx.sy=false;S.ui.dx.fm=null;}

const DXN=DEXA.length;
const DXPAGE=60;
const DXGEN=[['I','Kanto',1,151],['II','Johto',152,251],['III','Hoenn',252,386],['IV','Sinnoh',387,493],['V','Unova',494,649],['VI','Kalos',650,721],['VII','Alola',722,809],['VIII','Galar',810,905],['IX','Paldea',906,1025]];
const DXSINL=DEXSIN.split(',').map(Number);
const DXSINNO=new Map(DXSINL.map((id,i)=>[id,i+1]));
const DXPRE=new Map(),DXKIDS=new Map();
DEXPRE.split(',').forEach(s=>{
  const p=s.split(':'),a=+p[0],b=+p[1];
  if(!a||!b)return;
  DXPRE.set(a,b);
  if(!DXKIDS.has(b))DXKIDS.set(b,[]);
  DXKIDS.get(b).push(a);
});
let DXK=null;
const dxKeyOf=id=>{if(!DXK)DXK=DEXA.map(dexKey);return DXK[id-1];};
const DXTY=[];
const dxTypes=id=>DXTY[id]||(DXTY[id]=dexInfo(id).types.filter(Boolean));
const dxNo=n=>String(n).padStart(3,'0');
const dxArt=id=>[SPR_BASE+'other/official-artwork/'+id+'.png'].concat(spriteSrcs(id)).filter(u=>!SPR_BAD.has(u));

/* ----- what the viewing trainer knows ----- */
const dxUid=()=>S.me.admin?S.viewUid:S.me.id;
const dxLocked=()=>!!(S.megaOk&&S.megaOk.dx_lock===true);
function dxOwned(uid){
  const s=new Set();
  if(uid)monsOf(uid).forEach(m=>{const si=speciesInfo(m.species);if(si)s.add(si.id);});
  return s;
}
/* species on a foe the GM has shown the players (picture visible), as the players see it */
function dxBattle(){
  const s=new Set();
  try{
    btOrder().forEach(cid=>{
      const v=btInfo(cid,false);
      if(v&&v.side==='f'&&v.sp){const id=dexId(v.sp);if(id)s.add(id);}
    });
    /* a Pokémon the GM has shown with its picture, on an NPC the table has met, counts as seen */
    const nn=(S.npcPub&&S.npcPub.n)||{};
    Object.keys(nn).forEach(k=>(nn[k].m||[]).forEach(m=>{if(m&&m.sp){const id=dexId(m.sp);if(id)s.add(id);}}));
  }catch(e){}
  return s;
}
function dxCtx(){
  const uid=dxUid();
  const t=uid&&S.trainers[uid]?S.trainers[uid]:null;
  return {uid:t?uid:null,t,own:t?dxOwned(uid):new Set(),bat:dxBattle(),reg:(t&&t.dx)||{}};
}
/* 0 not met, 1 seen, 2 caught */
const dxStat=(c,id)=>Math.max(num(c.reg['n'+id]),c.own.has(id)?2:0,c.bat.has(id)?1:0);
/* what this viewer may read: 0 nothing, 1 the basics, 2 everything. The GM always reads everything. */
const dxVis=(c,id)=>(!dxLocked()||S.me.admin)?2:dxStat(c,id);
const dxCan=c=>!!(c.uid&&canEditT(c.uid)&&(!dxLocked()||S.me.admin));

/* ----- the list ----- */
const dxIds=()=>S.ui.dx.reg==='sin'?DXSINL:Array.from({length:DXN},(_,i)=>i+1);
const dxNum=id=>S.ui.dx.reg==='sin'?DXSINNO.get(id):id;
function dxList(c){
  const d=S.ui.dx;
  const q=String(d.q||'').trim().replace(/^#/,'');
  const qk=dexKey(q);
  const digits=/^\d+$/.test(q)?+q:0;
  const g=d.gen?DXGEN[+d.gen-1]:null;
  return dxIds().filter(id=>{
    if(g&&(id<g[2]||id>g[3]))return false;
    const v=dxVis(c,id),s=dxStat(c,id);
    if(d.show==='seen'&&s<1)return false;
    if(d.show==='caught'&&s<2)return false;
    if(d.show==='missing'&&s>=2)return false;
    if(d.type&&(v<1||dxTypes(id).indexOf(d.type)<0))return false;
    if(q){
      if(digits)return dxNum(id)===digits;
      if(!qk||v<1||dxKeyOf(id).indexOf(qk)<0)return false;
    }
    return true;
  });
}
function dxTally(c){
  let seen=0,got=0;
  const ids=dxIds();
  ids.forEach(id=>{const s=dxStat(c,id);if(s>=1)seen++;if(s>=2)got++;});
  return {seen,got,total:ids.length};
}
function dxCard(c,id){
  const n=dxNum(id),v=dxVis(c,id),s=dxStat(c,id);
  if(!v)return h`<li><button class="dxc unk" data-act="dx_open" data-id="${id}" aria-label="Number ${n}, not discovered yet"><span class="dxno">#${dxNo(n)}</span><span class="dxph" aria-hidden="true"></span><span class="dxnm">???</span></button></li>`;
  const srcs=spriteSrcs(id);
  return h`<li><button class="dxc ${s>=2?'got':s?'seen':''}" data-act="dx_open" data-id="${id}">
    <span class="dxno">#${dxNo(n)}</span>
    ${srcs.length?h`<img class="sp dxim" src="${srcs[0]}" data-fb="${srcs.slice(1).join('|')}" data-ini="${DEXA[id-1].charAt(0)}" alt="" width="64" height="64" loading="lazy" decoding="async">`:h`<span class="dxph" aria-hidden="true"></span>`}
    <span class="dxnm">${DEXA[id-1]}</span>
    <span class="types">${chipsOf(dxTypes(id))}</span>
    ${s?h`<span class="pill ${s>=2?'good':''}">${s>=2?'Caught':'Seen'}</span>`:''}
  </button></li>`;
}
function dxResults(c){
  const d=S.ui.dx;
  const ids=dxList(c);
  const shown=ids.slice(0,d.page*DXPAGE);
  const filtered=!!(d.q||d.gen||d.type||d.show!=='all');
  return h`<p class="sub" id="dxcount" aria-live="polite">${ids.length===1?'1 species':ids.length+' species'}${ids.length>shown.length?' · showing '+shown.length:''}</p>
    ${ids.length?h`<ul class="dxgrid">${shown.map(id=>dxCard(c,id))}</ul>`:h`<p class="sub">Nothing matches.${filtered?h` <button class="btn sm" data-act="dx_clear">Clear the filters</button>`:''}</p>`}
    ${ids.length>shown.length?h`<div class="row"><button class="btn" data-act="dx_more">Show ${Math.min(DXPAGE,ids.length-shown.length)} more</button></div>`:''}`;
}
/* typing in the search box redraws only the results, so the box keeps its place */
function dxRefresh(){
  const el=$('#dxres');
  if(el)el.innerHTML=dxResults(dxCtx()).s;
}

function dxSyncRow(c){
  if(!c.uid||!dxCan(c))return '';
  const miss=[...c.own].filter(id=>num(c.reg['n'+id])<2).length;
  const tl=dxTally(c);
  const dexNow=num(c.t.dex);
  const need=dexNow!==tl.got;
  if(!miss&&!need)return '';
  return h`<div class="row">${miss?h`<button class="btn sm" data-act="dx_rec">Record ${miss} owned species as caught</button>`:''}${need?h`<button class="btn sm" data-act="dx_sync">Set “Pokédex owned” on the trainer sheet to ${tl.got}</button>`:''}</div>`;
}

/* ---------- Breeding and move learning: egg groups, proficiencies, TMs ----------
   From the PTA 3 Pokédex: each family's biology line (egg groups, hatch time, diet, habitat) and its proficiencies, plus
   every proficiency group's move list, the signature moves (never teachable) and the basic tutoring list (Player's Handbook).
   The GM imports pta-extra.json once (GM Desk, Handbook data); it is kept in meta/pta_extra like the rest of the handbook
   text, so it is not part of the public site. Species records: {eg, hr, di, hb, fam, pr:[{g, only, note}]}. */
const PX={d:null,busy:null,fail:0,sp:null,base:null};
function pxLoad(){
  if(PX.d)return Promise.resolve(PX.d);
  if(PX.busy)return PX.busy;
  if(!S.db||(PX.fail&&Date.now()-PX.fail<30000))return Promise.resolve(null);
  PX.busy=S.db.collection('meta').doc('pta_extra').get().then(s=>{
    PX.busy=null;
    const d=s.exists?jparse((s.data()||{}).j):null;
    if(d)pxSet(d);else PX.fail=Date.now();
    scheduleRender();return PX.d;
  },()=>{PX.busy=null;PX.fail=Date.now();return null;});
  return PX.busy;
}
function pxSet(d){
  PX.d=d;PX.sp=new Map();PX.base=new Map();
  Object.entries(d.species||{}).forEach(([n,v])=>{
    PX.sp.set(dexKey(n),Object.assign({n},v));
    const b=dexKey(String(n).replace(/\s*\(.*$/,''));
    if(!PX.base.has(b))PX.base.set(b,Object.assign({n},v));
  });
  PX.lists={};Object.entries(d.lists||{}).forEach(([g,a])=>{PX.lists[g]=new Set(a.map(dexKey));});
  PX.sig=new Set((d.signature||[]).map(dexKey));PX.basic=new Set((d.basic||[]).map(dexKey));
  PX.names={};Object.values(d.lists||{}).concat([d.basic||[]]).forEach(a=>a.forEach(m=>{PX.names[dexKey(m)]=m;}));
  PX.lists0=PX.lists;PX.sig0=PX.sig;PX.ln=new Map();PX.lnSet=new Map();
  lnApply();
}
const pxReady=()=>{if(!PX.d)pxLoad();return !!PX.d;};
/* the record for a species name, trying the exact form first and then the base species */
function pxRec(name){
  if(!PX.d||!name)return null;
  return PX.sp.get(dexKey(name))||PX.base.get(dexKey(String(name).replace(/\s*\(.*$/,'')))||null;
}
/* which move-list keys a proficiency group opens */
function pxGroupKeys(p){
  const g=p.g,note=String(p.note||'').toLowerCase();
  if(g==='Martial'){const k=['Martial','Punches','Kicks'];return note.includes('no kicks')?['Martial','Punches']:note.includes('no punches')?['Martial','Kicks']:k;}
  if(g==='Elemental Attack')return ['Elemental Attack','Elemental Attack E','Elemental Attack F','Elemental Attack I'];
  return [g];
}
/* every move a species can be taught: Map moveKey -> {name, via:[group labels]} */
const pxLearnMemo=new Map();
function pxLearnable(name,types){
  const r=pxRec(name);if(!r)return null;
  const key=r.n+'|'+(types||[]).join(',');
  if(pxLearnMemo.has(key))return pxLearnMemo.get(key);
  const out=new Map(),add=(mk,via)=>{if(PX.sig.has(mk))return;const o=out.get(mk)||{name:PX.names[mk]||mk,via:[]};if(!o.via.includes(via))o.via.push(via);out.set(mk,o);};
  const pr=r.pr||[],noAny=pr.some(p=>/no moves from any/i.test(p.g));
  pr.forEach(p=>{if(/no moves from any/i.test(p.g))return;pxGroupKeys(p).forEach(k=>{const L=PX.lists[k];if(L)L.forEach(mk=>add(mk,p.g));});});
  if(!noAny&&PX.lists.Any)PX.lists.Any.forEach(mk=>add(mk,'Any'));
  if((types||[]).includes('Normal')&&PX.lists['Normal Block']&&!pr.some(p=>p.g==='Normal Block'))PX.lists['Normal Block'].forEach(mk=>add(mk,'Normal Block'));
  if(PX.ln)PX.ln.forEach((e,mk)=>{
    if(e.m==='any')add(mk,'Anyone');
    else if(e.m==='ty'){if((types||[]).some(t=>(e.ty||[]).includes(t)))add(mk,'Own type');}
    else if(e.m==='sp'){const ss=PX.lnSet.get(mk);if(ss&&(ss.has(dexKey(String(r.n).replace(/\s*\(.*$/,'')))||ss.has(dexKey(r.n))))add(mk,'Species list');}
  });
  pxLearnMemo.set(key,out);
  return out;
}
const pxCan=(name,types,move)=>{const L=pxLearnable(name,types);return L?L.get(dexKey(move))||null:null;};
const pxMove=n=>{const L=PTA.lists;return (L&&L.moveMap&&L.moveMap.get(dexKey(n)))||null;};
const pxFreq=n=>{const m=pxMove(n);return m&&m.f?String(m.f):'';};
/* ----- the Pokédex: biology, proficiencies and the moves this species can be taught ----- */
function dxLearn(id){
  if(!PTA.idx)return '';
  if(!pxReady())return PX.fail?h`<section class="panel"><div class="ph"><h2>Breeding and moves</h2></div><p class="sub">${S.me.admin?'Egg groups and proficiencies are not imported yet. Import pta-extra.json under Handbook data in the GM Desk.':'The GM has not imported egg groups and proficiencies yet.'}</p></section>`:'';
  const nm=DEXA[id-1],r=pxRec(nm);
  if(!r)return h`<section class="panel"><div class="ph"><h2>Breeding and moves</h2></div><p class="sub">${nm} has no biology or proficiency entry in the handbook.</p></section>`;
  if(PTA.idx&&!PTA.lists)ptaLists();
  const L=pxLearnable(nm,dxTypes(id))||new Map(),u=S.ui.dx;
  const groups={};L.forEach((o,mk)=>{o.via.forEach(v=>{(groups[v]=groups[v]||[]).push(o.name);});});
  const order=Object.keys(groups).sort((a,b)=>(a==='Any')-(b==='Any')||(a==='Normal Block')-(b==='Normal Block')||a.localeCompare(b));
  const q=dexKey(u.lq||'');
  const qn=/^\d{1,3}$/.test(q)?num(q):0;
  const mv=n=>{const m=pxMove(n),bt=PX.basic.has(dexKey(n)),no=tmNo(n);return h`<span class="lmv ${q&&(qn?no===qn:dexKey(n).includes(q))?'hit':''}" title="${[no?'TM, TR or HM '+tmPad(no):''].concat(m?[m.f,m.t,m.k]:[]).filter(Boolean).join(' · ')}">${no?h`<small class="tmno">${tmPad(no)}</small> `:''}${m&&m.t?chipsOf([m.t]):''}${n}${m&&m.f?h` <small>${m.f}</small>`:''}${bt?h` <small class="bt">basic tutor</small>`:''}</span>`;};
  return h`<section class="panel"><div class="ph"><h2>Breeding and moves</h2><span class="sub">From the PTA Pokédex</span></div>
    <div class="lbio">
      <div><span class="fl">Egg groups</span><b>${(r.eg||[]).length?r.eg.join(' · '):'None listed'}</b></div>
      <div><span class="fl">Hatches in</span><b>${r.hr||'—'}</b></div>
      <div><span class="fl">Diet</span><b>${r.di||'—'}</b></div>
      <div><span class="fl">Habitat</span><b>${r.hb||'—'}</b></div></div>
    <p class="fl">Proficiencies</p>
    <div class="row lprof">${(r.pr||[]).map(p=>h`<span class="pill ${/no moves/i.test(p.g)?'warn':''}">${p.g}${p.note?' ('+p.note+')':''}</span>`)}${(r.pr||[]).some(p=>/no moves from any/i.test(p.g))?'':h`<span class="pill">Any</span>`}${dxTypes(id).includes('Normal')&&!(r.pr||[]).some(p=>p.g==='Normal Block')?h`<span class="pill">Normal Block (Normal type)</span>`:''}</div>
    <details class="lcan" ${u.lopen?raw('open'):''}><summary data-act="dx_lopen">Moves it can be taught (${L.size})</summary>
      <p class="sub">A TM, a TR, a tutor or a breeding parent can teach any move below. The small number is the move's disk number: TM, TR and HM with that number all teach it, so 024 is TM 024, TR 024 or HM 024. Signature moves never appear. A note on a proficiency (like "Melee attacks") limits which of that list's moves fit; check it before teaching.</p>
      <label class="fld"><span class="fl">Find a move</span><input type="search" data-u="dx.lq" value="${u.lq||''}" placeholder="Thunderbolt or 024" data-nr autocomplete="off"></label>
      <div id="lcanlist">${order.map(g=>h`<div class="lgrp"><b>${g}</b><div class="lmvs">${groups[g].slice().sort().map(mv)}</div></div>`)}</div>
    </details>
  </section>`;
}
/* the Pokédex home: which species can learn a move */
function dxMoveFinder(){
  if(!PTA.idx||!pxReady())return '';
  const u=S.ui.dx;
  return h`<section class="panel"><div class="ph"><h2>Who can learn it?</h2></div>
    <label class="fld"><span class="fl">Move</span><input type="search" data-u="dx.mq" value="${u.mq||''}" list="dl-moves" placeholder="Will-O-Wisp or 061" autocomplete="off" data-nr></label>
    <div id="mqres">${dxMqRes()}</div>
  </section>`;
}
function dxMqRes(){
  const u=S.ui.dx,raw0=String(u.mq||'').trim(),nq=/^(?:tm|tr|hm)?\s*#?\s*(\d{1,3})$/i.exec(raw0);
  const q=nq&&TMNO[num(nq[1])-1]?TMNO[num(nq[1])-1]:raw0,qno=tmNo(q);
  let res=null;
  if(q.length>=3&&PX.d){
    const mk=dexKey(q),hits=[];
    if(PX.sig.has(mk))res={sig:true};
    else{DEXA.forEach((nm,i)=>{const o=pxCan(nm,dxTypes(i+1),q);if(o)hits.push([i+1,nm,o.via]);});res={hits,known:!!PX.names[mk]};}
  }
  return h`${res?res.sig?h`<p class="sub">${q} is a signature move: it can't be taught to anything.</p>`
      :res.hits.length?h`<p class="sub">${res.hits.length} species can be taught ${PX.names[dexKey(q)]||q}${qno?h` with TM, TR or HM <b>${tmPad(qno)}</b>`:''}.</p><div class="lwho">${res.hits.slice(0,120).map(([id,nm,via])=>h`<button class="btn sm ghost" data-act="dx_open" data-id="${id}" title="${via.join(', ')}">${nm}</button>`)}${res.hits.length>120?h`<span class="sub">and ${res.hits.length-120} more</span>`:''}</div>`
      :h`<p class="sub">${res.known?'No species in the Pokédex has a proficiency for that move.':'That move isn’t on any proficiency list. Check the spelling, or it may only come from evolution.'}</p>`:h`<p class="sub">Type a move or a disk number (like 024 or TM 24) to see every species whose proficiencies let it be taught.</p>`}`;
}
/* ----- TMs and TRs in a trainer's bag ----- */
/* Every teachable move has one number (GM Reference: TMs, TRs and HMs). As in the Player's Handbook (p. 171) the number names
   the move and the disk sets the uses: TM 024, TR 024 and HM 024 all teach Thunderbolt. 001-092 keep Sinnoh's TM numbers,
   093-102 are the field moves, 103-433 are the rest alphabetically. */
const TMNO='Focus Punch|Dragon Claw|Water Pulse|Scald|Roar|Toxic|Hail|Bulldoze|Bullet Seed|Hidden Power|Sunny Day|Taunt|Ice Beam|Blizzard|Hyper Beam|Light Screen|Protect|Rain Dance|Giga Drain|Safeguard|Frustration|Solar Beam|Iron Tail|Thunderbolt|Thunder|Earthquake|Return|Dig|Psychic|Shadow Ball|Brick Break|Double Team|Reflect|Shock Wave|Flamethrower|Sludge Bomb|Sandstorm|Fire Blast|Rock Tomb|Aerial Ace|Wild Charge|Facade|Dazzling Gleam|Rest|Attract|Thief|Steel Wing|Smack Down|Round|Overheat|Roost|Focus Blast|Energy Ball|Echoed Voice|Brine|Acrobatics|Charge Beam|Endure|Dragon Pulse|Drain Punch|Will-O-Wisp|Silver Wind|Low Sweep|Incinerate|Shadow Claw|Payback|Venoshock|Giga Impact|Retaliate|Flash|Stone Edge|Avalanche|Thunder Wave|Gyro Ball|Snarl|Stealth Rock|Dragon Tail|Electro Ball|Dark Pulse|Rock Slide|X-Scissor|Sleep Talk|Sludge Wave|Poison Jab|Dream Eater|Grass Knot|Swagger|Psyshock|Hex|Substitute|Flash Cannon|Trick Room|Cut|Fly|Strength|Defog|Rock Smash|Surf|Waterfall|Rock Climb|Whirlpool|Dive|Absorb|Acid Spray|Acupressure|After You|Air Cutter|Air Dart|Air Slash|Alluring Voice|Ally Switch|Ancient Power|Aqua Jet|Aqua Ring|Aqua Tail|Aromatherapy|Assurance|Astonish|Aura Sphere|Aurora Beam|Aurora Veil|Axe Kick|Belch|Belly Drum|Bide|Bite|Blaze Kick|Block|Body Press|Body Slam|Boomburst|Brave Bird|Breaking Swipe|Brutal Hit|Brutal Swing|Bubble|Bubble Beam|Bug Bite|Bug Buzz|Bullet Punch|Burning Jealousy|Celebrate|Charge|Chilling Water|Chip Away|Clear Smog|Clearing Smog|Close Combat|Coaching|Comet Punch|Confuse Ray|Confusion|Confusioning|Corrosive Gas|Counter|Covet|Cross Chop|Cross Poison|Crunch|Crush Claw|Curse|Darkest Lariat|Destiny Bond|Detect|Disable|Disarming Voice|Discharge|Dizzy Punch|Double Edge|Double Hit|Double Kick|Double Slap|Draco Meteor|Dragon Breath|Dragon Rage|Dragon Rush|Draining Kiss|Drill Peck|Drill Run|Dual Chop|Dual Wingbeat|Dynamic Punch|Earth Power|Electric Terrain|Ember|Emberish|Encore|Endeavor|Expanding Force|Extrasensory|Fairy Wind|Fake Out|Feint Attack|Fell Stinger|Final Gambit|Fire Fang|Fire Punch|Fire Spin|Flail|Flame Burst|Flame Charge|Flame Wheel|Flare Blitz|Flatter|Focus Energy|Follow Me|Force Palm|Foresight|Freeze-Dry|Frost Breath|Fury Attack|Fury Cutter|Fury Swipes|Future Sight|Gastro Acid|Grassy Glide|Grassy Terrain|Gravity|Growl|Gunk Shot|Gust|Hammer Arm|Haze|Head Smash|Headbutt|Heal Block|Heal Pulse|Healing Wish|Heat Wave|Heavy Slam|Helping Hand|High Jump Kick|Hold Back|Horn Attack|Hurricane|Hydro Pump|Hyper Fang|Hyper Voice|Hypnosis|Ice Fang|Ice Punch|Ice Shard|Ice Spinner|Icicle Crash|Icicle Spear|Icy Breeze|Icy Wind|Inferno|Infestation|Iron Head|Jump Kick|Karate Chop|Karate Slap|Knock Off|Laser Focus|Lash Out|Lava Plume|Leaf Blade|Leaf Storm|Leafage|Leech Life|Leech Seed|Leer|Lick|Life Dew|Liquidation|Low Kick|Lucky Chant|Lunge|Mach Punch|Magic Coat|Magic Room|Magical Leaf|Magnet Pull|Magnet Rise|Mean Look|Mega Drain|Mega Kick|Mega Punch|Megahorn|Memento|Metal Burst|Metal Claw|Metal Cut|Meteor Beam|Meteor Rain|Mirror Coat|Mirror Move|Mist|Misty Terrain|Moonblast|Moonwrecker|Mud Bomb|Mud Shot|Mud Sport|Mud Throw|Mud-Slap|Muddy Water|Mystical Fire|Night Shade|Night Slash|Nuzzle|Ominous Wind|Outrage|P Stomping Tantrum|Pain Split|Peck|Petal Blizzard|Petal Dance|Phantom Force|Pin Missile|Play Rough|Poison Fang|Poison Gas|Poison Powder|Poison Sting|Poltergeist|Pounce|Pound|Powder|Powder Snow|Power Gem|Power-Up Punch|Psionic Fury|Psybeam|Psychic Fangs|Psychic Terrain|Psycho Cut|Punishment|Pursuit|Quash|Quick Attack|Rage|Rage Powder|Rapid Spin|Razor Leaf|Razor Wind|Refresh|Revenge|Reversal|Rising Voltage|Rock Blast|Rock Throw|Rolling Kick|Rollout|Sand Attack|Sand Tomb|Scale Shot|Scorching Sands|Scratch|Seed Bomb|Seismic Toss|Shadow Sneak|Signal Beam|Sing|Skitter Smack|Sky Attack|Sky Drop|Sky Uppercut|Slam|Slash|Sleep Powder|Slippin Slide|Smart Strike|Smog|Smoke Screen|Snore|Snowscape|Soak|Solar Blade|Sonic Boom|Spark|Spike Cannon|Spikes|Spit Up|Splash|Spook|Steamroller|Steel Beam|Steel Roller|Stockpile|Stomp|Stomping Tantrum|Struggle Bug|Struggling Bug|Stun Spore|Submission|Sucker Punch|Supercell Slam|Superpower|Supersonic|Swallow|Sweet Kiss|Sweet Scent|Swift|Switcheroo|Synchronoise|Synthesis|Tackle|Tail Slap|Take Down|Teleport|Temper Flare|Terrain Pulse|Terrify|Thrash|Throat Chop|Thunder Fang|Thunder Punch|Thunder Shock|Tickle|Tidepools|Toxic Spikes|Trailblaze|Trick|Triple Axel|Twineedle|Twister|Twisting Gust|Uproar|Vacuum Wave|Venom Drench|Vital Throw|Void Fury|Wake-Up Slap|Water Sport|Whirlwind|Wing Attack|Wish|Wonder Room|Yawn|Zap Cannon|Zen Headbutt'.split('|');
const TMNO_BY=new Map(TMNO.map((n,i)=>[dexKey(n),i+1]));
const tmNo=m=>TMNO_BY.get(dexKey(m))||0;
const tmPad=n=>String(n).padStart(3,'0');
const tmLabel=(kind,m)=>{const n=tmNo(m);return kind+(n?' '+tmPad(n):'')+' '+m;};
const TM_RE=/^\s*(TM|TR|HM)\s*(?:[:\-–#]\s*)?(?:(\d{1,3})\b\s*[:\-–]?\s*)?(.*?)\s*$/i;
const tmParse=name=>{const m=TM_RE.exec(String(name||''));if(!m)return null;
  const byNo=m[2]?TMNO[num(m[2])-1]:'',mv=pxMove(m[3]||byNo)||(byNo&&m[3]?pxMove(byNo):null);
  return mv?{kind:m[1].toUpperCase(),move:mv.n,mv,no:tmNo(mv.n)}:null;};
const tmUses=(x,kind)=>x.uses==null||x.uses===''?(kind==='TR'?1:kind==='HM'?Infinity:3):num(x.uses);
const TM_PRICE={TM:{'At-Will':4800,'3/day':11800,'1/day':26800},TR:{'At-Will':2400,'3/day':5900,'1/day':13400}};
function tmPrice(kind,mv){const f=/1\/day/i.test(mv.f||'')?'1/day':/3\/day/i.test(mv.f||'')?'3/day':'At-Will';return (TM_PRICE[kind]||{})[f]||null;}
function tmRow(uid,t,x,i,ro){
  const p=tmParse(x.name);if(!p)return '';
  const u=S.ui.tm||{},open=u.uid===uid&&u.i===i,uses=tmUses(x,p.kind);
  if(!open)return h`<div class="tmrow"><span class="sub">${p.no?p.kind+' '+tmPad(p.no):p.kind} for ${chipsOf([p.mv.t||'Normal'])} ${p.move} · ${p.mv.f||''} · ${uses===Infinity?'unlimited uses':uses+(uses===1?' use':' uses')+' left on this disk'}</span>${ro?'':h`<button class="btn sm" data-act="tm_open" data-uid="${uid}" data-i="${i}">Teach</button>`}</div>`;
  const mons=partyOf(uid).concat(boxOf(uid));
  const m=mons.find(z=>z.id===u.pid)||null;
  const can=m?pxCan(m.species,m.types,p.move):null,known=m&&(m.moves||[]).some(z=>dexKey(z.name)===dexKey(p.move));
  const cap=t&&/move tutor/i.test([t.cls,t.adv].join(' '))?8:6,full=m&&(m.moves||[]).length>=cap;
  return h`<div class="tmrow open"><div class="fgrid"><label class="fld"><span class="fl">Teach ${p.move} to</span><select data-u="tm.pid"><option value="">Pick a Pokémon</option>${mons.map(z=>h`<option value="${z.id}" ${z.id===u.pid?raw('selected'):''}>${mName(z)}${z.nick&&z.species?' ('+z.species+')':''}</option>`)}</select></label>
    ${m&&full?h`<label class="fld"><span class="fl">It knows ${cap} moves. Replace</span><select data-u="tm.rep"><option value="">Pick a move to forget</option>${(m.moves||[]).map((z,k)=>h`<option value="${k}" ${String(k)===String(u.rep)?raw('selected'):''}>${z.name}</option>`)}</select></label>`:''}</div>
    ${m?known?h`<p class="sub">${mName(m)} already knows ${p.move}.</p>`:!PX.d?h`<p class="sub">Proficiency data isn’t loaded, so the machine can’t check compatibility.</p>`:can?h`<p class="sub good">Compatible: ${p.move} is on its ${can.via.join(' and ')} list.</p>`:h`<p class="sub bad">The machine refuses: ${mName(m)} has no proficiency for ${p.move}.</p>`:''}
    <div class="row"><button class="btn sm primary" data-act="tm_use" data-uid="${uid}" data-i="${i}" ${m&&!known&&(can||!PX.d)&&(!full||u.rep!=='')?'':raw('disabled')}>Use the ${p.kind}</button><button class="btn sm ghost" data-act="tm_close">Cancel</button></div></div>`;
}
function tmAct(b){
  const d=b.dataset;S.ui.tm=S.ui.tm||{};const u=S.ui.tm;
  if(d.act==='tm_open'){S.ui.tm={uid:d.uid,i:num(d.i),pid:'',rep:''};if(PTA.idx&&!PTA.lists)ptaLists();pxLoad();render();return;}
  if(d.act==='tm_close'){S.ui.tm={};render();return;}
  if(d.act!=='tm_use')return;
  const uid=d.uid,t=S.trainers[uid];if(!t||!canEditT(uid))return;
  const items=(t.items||[]).map(x=>Object.assign({},x)),x=items[num(d.i)],p=x&&tmParse(x.name);if(!p)return;
  const m=partyOf(uid).concat(boxOf(uid)).find(z=>z.id===u.pid);if(!m){toast('Pick a Pokémon first.');return;}
  if(PX.d&&!pxCan(m.species,m.types,p.move)){toast('The machine refuses: no proficiency for '+p.move+'.');return;}
  const nm={name:p.mv.n,freq:p.mv.f||'At-Will',kind:p.mv.k||'Physical',range:p.mv.r||'',type:p.mv.t||'Normal',dice:p.mv.d||'',text:p.mv.x||'',used:0};
  const mv=(m.moves||[]).slice(),cap=/move tutor/i.test([t.cls,t.adv].join(' '))?8:6;
  let lost='';
  if(mv.length>=cap){const k=num(u.rep);if(u.rep===''||!mv[k]){toast('Pick a move to forget.');return;}lost=mv[k].name;mv[k]=nm;}else mv.push(nm);
  edit('p',uid+'/'+m.id,'moves',mv);
  const left=tmUses(x,p.kind)-1;
  if(left===Infinity||left>0)x.uses=left===Infinity?'':left;
  else{const q=x.qty===''||x.qty==null?1:num(x.qty);if(q>1){x.qty=q-1;x.uses='';}else items.splice(num(d.i),1);}
  edit('t',uid,'items',items);
  S.ui.tm={};
  toast(mName(m)+' learned '+p.move+(lost?' and forgot '+lost:'')+'.',true);render();
}
/* ----- breeding: can two Pokémon produce an egg, and what might it inherit ----- */
function brPanel(uid,ro){
  const mons=partyOf(uid).concat(boxOf(uid));
  if(mons.length<1||!PTA.idx)return '';
  if(!pxReady())return '';
  if(!PTA.lists)ptaLists();
  const u=S.ui.br=S.ui.br||{ma:'',pa:''};
  const all=[];Object.keys(S.trainers).forEach(k=>partyOf(k).concat(boxOf(k)).forEach(z=>all.push([k,z])));
  const find=id=>{const e=all.find(([k,z])=>k+'/'+z.id===id);return e?{uid:e[0],m:e[1]}:null;};
  const A=find(u.ma),B=find(u.pa);
  const opt=cur=>h`<option value="">Pick a Pokémon</option>${Object.keys(S.trainers).map(k=>{const ms=partyOf(k).concat(boxOf(k));return ms.length?h`<optgroup label="${tName(S.trainers[k])}">${ms.map(z=>h`<option value="${k}/${z.id}" ${k+'/'+z.id===cur?raw('selected'):''}>${mName(z)}${z.nick&&z.species?' ('+z.species+')':''}${z.gender?' '+(z.gender==='Male'?'♂':z.gender==='Female'?'♀':''):''}</option>`)}</optgroup>`:'';})}`;
  let body='';
  if(A&&B){
    const ra=pxRec(A.m.species),rb=pxRec(B.m.species);
    const isD=r=>r&&/^ditto$/i.test(r.n);
    const ega=(ra&&ra.eg)||[],egb=(rb&&rb.eg)||[];
    const shared=ega.filter(g=>egb.includes(g));
    const und=g=>/undiscovered|no eggs/i.test(g.join(' '));
    const ga=A.m.gender||'',gb=B.m.gender||'';
    const prob=[];
    if(u.ma===u.pa)prob.push('Pick two different Pokémon.');
    if(!ra||!rb)prob.push('One of them has no biology entry in the handbook.');
    else if(isD(ra)&&isD(rb))prob.push('Two Ditto can’t breed with each other.');
    else if(!(isD(ra)||isD(rb))){
      if(und(ega)||und(egb))prob.push('One of them is in a group that doesn’t breed.');
      else if(!shared.length)prob.push('They share no egg group ('+(ega.join(' / ')||'none')+' and '+(egb.join(' / ')||'none')+').');
      if(ga&&gb&&ga===gb)prob.push('They are both '+ga.toLowerCase()+'.');
      if((ga==='Genderless'||gb==='Genderless'))prob.push('A genderless Pokémon can only breed with a Ditto.');
    }else if(und(isD(ra)?egb:ega))prob.push('That Pokémon can’t breed, even with a Ditto.');
    const mom=isD(ra)?B:isD(rb)?A:(ga==='Female'?A:gb==='Female'?B:A),dad=mom===A?B:A,rm=mom===A?ra:rb;
    const baby=rm?String(rm.fam||rm.n).split(' / ')[0]:'';
    const bt=pxRec(baby)||rm;
    const bid=DEXA.findIndex(n=>dexKey(n)===dexKey(baby))+1;
    const inh=prob.length?[]:(dad.m.moves||[]).filter(z=>pxCan(baby,bid?dxTypes(bid):[],z.name));
    const kids=z=>num(z.kids);
    body=h`${prob.length?h`<p class="sub bad">${prob.join(' ')}</p>`:h`<p class="sub good">They can produce an egg${shared.length?' (shared egg group: '+shared.join(', ')+')':' (Ditto breeds with any Pokémon that can)'}.</p>`}
      ${prob.length?'':h`<div class="lbio"><div><span class="fl">The egg hatches as</span><b>${baby||'—'}</b></div><div><span class="fl">Hatches in</span><b>${(bt&&bt.hr)||'—'}</b></div><div><span class="fl">Nature</span><b>Either parent’s, or new</b></div></div>
        <p class="fl">Moves it might inherit from ${mName(dad.m)}</p>
        ${inh.length?h`<div class="lmvs">${inh.map(z=>h`<span class="lmv">${chipsOf([z.type||'Normal'])}${z.name}</span>`)}</div>`:h`<p class="sub">None of the father’s moves fit the baby’s proficiencies.</p>`}
        <p class="sub">Each day both have spent at least 4 hours together, and get along at least as acquaintances, each owner may roll for an egg. Both must be at least two weeks old.</p>
        <div class="row"><span class="sub">Eggs raised in your care: ${mName(A.m)} ${kids(A.m)}, ${mName(B.m)} ${kids(B.m)}. Breeders’ Prolific Parents starts at 3.</span>${ro?'':h`<button class="btn sm" data-act="br_egg">Record an egg</button>`}</div>`}`;
  }
  return h`<section class="panel"><div class="ph"><h2>Breeding</h2><span class="sub">Egg groups from the PTA Pokédex</span></div>
    <div class="fgrid"><label class="fld"><span class="fl">One parent</span><select data-u="br.ma">${opt(u.ma)}</select></label>
      <label class="fld"><span class="fl">The other</span><select data-u="br.pa">${opt(u.pa)}</select></label></div>
    ${body}</section>`;
}
function brAct(b){
  const u=S.ui.br||{};
  if(b.dataset.act!=='br_egg')return;
  [u.ma,u.pa].forEach(id=>{if(!id)return;const k=id.indexOf('/'),uid=id.slice(0,k),pid=id.slice(k+1);if(!canEditT(uid))return;const m=partyOf(uid).concat(boxOf(uid)).find(z=>z.id===pid);if(m)edit('p',id,'kids',num(m.kids)+1);});
  toast('Egg recorded for both parents.',true);render();
}
/* end breeding and move learning */
S.ui.br=S.ui.br||{ma:'',pa:''};S.ui.tm=S.ui.tm||{};
function dexTab(){
  const c=dxCtx();
  const d=S.ui.dx;
  if(d.sel>=1&&d.sel<=DXN)return dxDetail(c);
  const tl=dxTally(c);
  const locked=dxLocked();
  const pct=Math.round(100*tl.got/Math.max(1,tl.total));
  const sp=Math.round(100*tl.seen/Math.max(1,tl.total));
  return h`<section class="panel dxp"><div class="ph"><h2>Pokédex</h2>
      <div class="acts">${c.uid?h`<span class="pill">Seen ${tl.seen}</span><span class="pill good">Caught ${tl.got}</span>`:''}${locked?h`<span class="pill gm">Locked</span>`:''}</div></div>
    ${S.me.admin?trainerPicker():''}
    ${!c.uid&&!S.me.admin&&S.me.id&&S.me.canWrite?h`<div class="banner">You have no trainer sheet yet, so nothing is marked. ${createCta()}</div>`:''}
    ${!c.uid&&S.me.admin?h`<p class="sub">No trainer is selected, so nothing is marked.</p>`:''}
    ${c.uid?h`<div class="dxprog" role="img" aria-label="${tl.got} caught and ${tl.seen} seen out of ${tl.total}"><i class="s" ${raw('style="width:'+sp+'%"')}></i><i class="c" ${raw('style="width:'+pct+'%"')}></i></div>`:''}
    <p class="sub">${locked&&!S.me.admin?'The GM keeps the Pokédex locked: a species fills in when you catch one or meet it in battle. ':''}${c.uid?(S.me.admin?'Showing '+tName(c.t)+'. ':'')+'A Pokémon in your party or box counts as caught, and a foe the GM shows you in battle counts as seen.':'Names, types and handbook entries for every species.'}</p>
    ${S.me.admin?h`<label class="row"><input type="checkbox" data-act="dx_lock" ${locked?raw('checked'):''}><span>Lock the Pokédex for players (unmet species show as ???)</span></label>`:''}
    ${dxSyncRow(c)}
    <div class="dxf">
      <label class="fld dxq"><span class="fl">Search</span><input type="search" data-u="dx.q" data-nr value="${d.q||''}" placeholder="Name or number" autocomplete="off"></label>
      <label class="fld"><span class="fl">Region</span><select data-u="dx.reg"><option value="nat" ${d.reg!=='sin'?raw('selected'):''}>National (${DXN})</option><option value="sin" ${d.reg==='sin'?raw('selected'):''}>Sinnoh (${DXSINL.length})</option></select></label>
      <label class="fld"><span class="fl">Generation</span><select data-u="dx.gen"><option value="">All</option>${DXGEN.map((g,i)=>h`<option value="${i+1}" ${String(d.gen)===String(i+1)?raw('selected'):''}>${g[0]} · ${g[1]}</option>`)}</select></label>
      <label class="fld"><span class="fl">Type</span><select data-u="dx.type"><option value="">All types</option>${TYPES.map(t=>h`<option value="${t}" ${d.type===t?raw('selected'):''}>${t}</option>`)}</select></label>
      <label class="fld"><span class="fl">Show</span><select data-u="dx.show">${[['all','Everything'],['seen','Seen or caught'],['caught','Caught'],['missing','Not caught yet']].map(([k,l])=>h`<option value="${k}" ${d.show===k?raw('selected'):''}>${l}</option>`)}</select></label>
    </div>
    <div id="dxres">${dxResults(c)}</div>
  </section>
  ${dxMoveFinder()}`;
}

/* ----- one entry ----- */
const DXG={};
const DXAPI='https://raw.githubusercontent.com/PokeAPI/api-data/master/data/api/v2/pokemon-species/';
const dxClean=t=>String(t||'').replace(/\u00ad\s*/g,'').replace(/[\n\f\r]+/g,' ').replace(/\s+/g,' ').trim();
const dxTitle=s=>String(s||'').replace(/-/g,' ').replace(/\b[a-z]/g,m=>m.toUpperCase());
function dxLoad(id,force){
  const g=DXG[id];
  if(g&&(g.st==='busy'||g.st==='ok'||(g.st==='err'&&!force)))return;
  DXG[id]={st:'busy'};
  const ctl=typeof AbortController!=='undefined'?new AbortController():null;
  const to=setTimeout(()=>{if(ctl)ctl.abort();},12000);
  let p;
  try{p=fetch(DXAPI+id+'/index.json',ctl?{signal:ctl.signal}:{});}catch(e){p=Promise.reject(e);}
  p.then(r=>{if(!r.ok)throw new Error('http '+r.status);return r.json();}).then(j=>{
    clearTimeout(to);
    const en=x=>x&&x.language&&x.language.name==='en';
    const ft=(j.flavor_text_entries||[]).filter(en);
    const by=v=>ft.find(x=>x.version&&x.version.name===v);
    const pick=by('platinum')||by('diamond')||by('pearl')||ft[ft.length-1]||null;
    const ge=(j.genera||[]).find(en);
    DXG[id]={st:'ok',genus:ge?String(ge.genus||''):'',text:pick?dxClean(pick.flavor_text):'',ver:pick&&pick.version?String(pick.version.name||''):'',
      habitat:j.habitat&&j.habitat.name?String(j.habitat.name):'',legendary:!!j.is_legendary,mythical:!!j.is_mythical,baby:!!j.is_baby};
    scheduleRender();
  }).catch(()=>{clearTimeout(to);DXG[id]={st:'err'};scheduleRender();});
}
function dxGameView(id){
  const g=DXG[id];
  if(!g||g.st==='busy')return h`<p class="sub">Loading the game entry…</p>`;
  if(g.st==='err')return h`<p class="sub">The game entry could not be loaded. It is read from PokeAPI on GitHub, so it needs an internet connection. <button class="btn sm" data-act="dx_retry" data-id="${id}">Retry</button></p>`;
  return h`${g.text?h`<blockquote class="dxquote">${g.text}</blockquote><p class="sub">Pokémon ${dxTitle(g.ver)}${g.genus?' · '+g.genus:''}</p>`:h`<p class="sub">No game entry text was found.</p>`}
    ${g.habitat||g.legendary||g.mythical||g.baby?h`<div class="row">${g.legendary?h`<span class="pill gm">Legendary</span>`:''}${g.mythical?h`<span class="pill gm">Mythical</span>`:''}${g.baby?h`<span class="pill">Baby</span>`:''}${g.habitat?h`<span class="pill">Habitat: ${dxTitle(g.habitat)}</span>`:''}</div>`:''}`;
}

function dxChip(c,x,cur){
  const v=dxVis(c,x);
  const srcs=v?spriteSrcs(x):[];
  return h`<button class="dxch ${x===cur?'cur':''}" data-act="dx_open" data-id="${x}" ${x===cur?raw('aria-current="true"'):''}>${srcs.length?h`<img class="sp mi" src="${srcs[0]}" data-fb="${srcs.slice(1).join('|')}" alt="" width="40" height="40" loading="lazy" decoding="async">`:h`<span class="mi-ph" aria-hidden="true"></span>`}<span>${v?DEXA[x-1]:'???'}</span></button>`;
}
function dxFamily(c,id){
  let root=id,n=0;
  while(DXPRE.has(root)&&n++<6)root=DXPRE.get(root);
  if(root===id&&!(DXKIDS.get(id)||[]).length)return h`<p class="sub">${DEXA[id-1]} does not evolve and has no earlier form.</p>`;
  const node=x=>h`<li>${dxChip(c,x,id)}${(DXKIDS.get(x)||[]).length?h`<ul>${(DXKIDS.get(x)||[]).map(k=>node(k))}</ul>`:''}</li>`;
  return h`<ul class="dxtree">${node(root)}</ul>`;
}
function dxForms(id){
  const fm=FORMS.filter(f=>f.b===id);
  const mg=MEGAS.filter(x=>x.b===id);
  if(!fm.length&&!mg.length)return '';
  return h`<section class="panel"><div class="ph"><h2>Other forms</h2></div>
    <ul class="dxforms">${fm.map(f=>h`<li><b>${f.n}</b> ${chipsOf(typePair(f.t))}</li>`)}${mg.map(x=>h`<li><b>${x.f}</b> ${chipsOf(typePair(x.t))} <span class="sub">${x.st}</span></li>`)}</ul></section>`;
}

/* legendary categories from the GM Guide: the label, the suggested base capture rate and a line of what they are */
const LEG_CAT={
  'Time-Displaced':{l:'Time-Displaced',c:-25,t:'Lost in time. One turning up usually means a portal is letting the past or future meddle with the present.'},
  'Ultra Beast':{l:'Ultra Beast',c:-25,t:'From another dimension. Invasive and quick to attack, but Poké Balls can hold them.'},
  'Man-made':{l:'Man-made Legendary',c:-50,t:'Created by people. Powerful, but not gods, so a Poké Ball may weaken their strength.'},
  'Nature':{l:'Being of Nature / Oddity',c:-100,t:'Holds domain over some force in the world. Not unique, though exceedingly rare.'},
  'God':{l:'God',c:-500,t:'Unique and untamable. It would only consider a Poké Ball after being shown dominance.'}
};
const legTag=r=>r&&r.cat==='Ultra Beast'?'Ultra Beast':r&&r.cat==='Time-Displaced'?'Paradox':'Legendary';
function dxLegend(r){
  const c=r.cat&&LEG_CAT[r.cat];
  if(!c)return '';
  return h`<div class="dxleg" role="note"><div class="row"><span class="pill leg">${c.l}${r.sub?' · '+r.sub:''}</span><span class="pill">Base capture rate ${c.c}</span></div>
    <p class="sub">${c.t} A captured one loses its ${legTag(r)} moves, passives and features, and its HP drops, rarely above 100.</p></div>`;
}
function dxRecView(r,many){
  const dsd=dieSides(ptaDie(r));
  const stats=[['HP',Math.round(num(r.hp)*hpx(ptaDie(r))),false],['Atk',r.at,true],['Def',r.df,true],['SpA',r.sa,true],['SpD',r.sd,true],['Spe',r.sp,true]];
  const ps=r.ps||[],mv=r.mv||[],sk=r.sk||[];
  const lt=legTag(r);
  return h`<div class="dxrec">
    ${many?h`<h3 class="refg">${r.n}</h3>`:''}
    <div class="row">${chipsOf(r.ty)}<span class="pill">${r.sz||'Medium'}</span><span class="pill">${r.wt||'Medium'}</span></div>
    ${dxLegend(r)}
    <div class="dxst">${stats.map(([l,v,m])=>h`<div class="dxs"><span>${l}</span><b>${num(v)}</b>${m?h`<small>${sgn(mod(num(v)))}</small>`:(l==='HP'&&S.me.admin&&hpx(ptaDie(r))!==1?h`<small title="GM only: the Pokédex HP, before the homebrew multiplier">book ${num(r.hp)}</small>`:'')}</div>`)}</div>
    ${sk.length?h`<p><b>Skills</b> ${sk.map(x=>x.n+(x.t?' ('+x.t+')':'')).join(', ')}</p>`:''}
    ${ps.length?h`<h3 class="refg">Passives</h3><dl class="refdl">${ps.map(x=>h`<dt>${x.n}${x.lg?h` <span class="pill leg">${lt}</span>`:''}</dt><dd>${x.t||''}</dd>`)}</dl>`:''}
    ${mv.length?h`<h3 class="refg">Moves</h3><ul class="dxmvs">${mv.map(x=>h`<li><div class="row"><b>${x.n}</b>${tmNo(x.n)?h`<span class="pill tmno" title="TM, TR or HM ${tmPad(tmNo(x.n))} teaches this move">No. ${tmPad(tmNo(x.n))}</span>`:''}${chipsOf([x.t])}<span class="pill">${x.k||''}</span><span class="pill">${hbFreq(x.f||'',dsd)}</span>${x.lg?h`<span class="pill leg">${lt}</span>`:''}</div>
      <p class="sub">${[x.r,hbDice(x.d,dsd)].filter(Boolean).join(' · ')}</p>${x.x?h`<p>${x.x}</p>`:''}</li>`)}</ul>`:''}
  </div>`;
}
function dxEvoLinks(c,r){
  const ev=r.ev||[];
  if(!ev.length)return '';
  return h`<h3 class="refg">Evolves into</h3><ul class="dxevs">${ev.map(e=>{
    const t=dexId(e.n);
    const v=t?dxVis(c,t):0;
    return h`<li>${t?h`<button class="dxch" data-act="dx_open" data-id="${t}"><span>${v?e.n:'???'}</span></button>`:h`<b>${e.n}</b>`}${e.c?h` <span class="sub">${e.c}</span>`:''}</li>`;
  })}</ul>`;
}
function dxHandbook(c,id){
  const nm=DEXA[id-1];
  const I=PTA.idx;
  const fb=dexInfo(id);
  const fallback=h`<p class="sub">Game base stats ÷ 15, as used to fill in a new Pokémon:</p><div class="dxst">${STATS.map(s=>h`<div class="dxs"><span>${s[2]}</span><b>${fb.base[s[0]]}</b><small>${sgn(mod(fb.base[s[0]]))}</small></div>`)}</div>`;
  if(!I)return h`<p class="sub">${S.me.admin?'The handbook data has not been imported yet. Import it in the GM Desk to see full entries here.':'The GM has not imported the handbook data yet, so only the basics are shown.'}</p>${fallback}`;
  let names=(I.base.get(ptaKey(nm))||[]).slice();
  if(!names.length){const r=ptaResolve(nm);if(r)names=[r];}
  if(!names.length)return h`<p class="sub">${nm} is not in the handbook.</p>${fallback}`;
  names.sort((a,b)=>(dexKey(b)===dexKey(nm))-(dexKey(a)===dexKey(nm)));
  const L=ptaLetter(ptaKey(nm));
  if(!PTA.chunks[L]){
    return PTA.fail[L]&&Date.now()-PTA.fail[L]<30000?h`<p class="sub">The handbook entry could not be loaded right now.</p>${fallback}`:h`<p class="sub">Loading the handbook entry…</p>`;
  }
  const recs=names.map(n=>ptaRec(n)).filter(Boolean);
  if(!recs.length)return h`<p class="sub">${nm} is not in the handbook.</p>${fallback}`;
  return h`${recs.map(r=>h`${dxRecView(r,recs.length>1)}${dxEvoLinks(c,r)}`)}`;
}

function dxMarks(c,id,s){
  if(!c.uid)return '';
  if(c.own.has(id))return h`<span class="pill good">Caught · it is in ${S.me.admin?tName(c.t)+'’s':'your'} party or box</span>`;
  const can=dxCan(c);
  const reg=num(c.reg['n'+id]);
  const note=c.bat.has(id)&&reg<1?h`<span class="pill">Seen in the current battle</span>`:'';
  if(!can)return h`${s?h`<span class="pill ${s>=2?'good':''}">${s>=2?'Caught':'Seen'}</span>`:h`<span class="pill">Not met</span>`}${note}`;
  return h`<div class="seg" role="group" aria-label="Pokédex mark for ${DEXA[id-1]}">${[[0,'Not met'],[1,'Seen'],[2,'Caught']].map(([n,l])=>h`<button data-act="dx_mark" data-id="${id}" data-v="${n}" aria-pressed="${String(reg===n)}">${l}</button>`)}</div>${note}`;
}
function dxStepIds(c,id){
  const l=dxList(c);
  const i=l.indexOf(id);
  if(i>=0)return {prev:l[i-1]||0,next:l[i+1]||0};
  return {prev:id>1?id-1:0,next:id<DXN?id+1:0};
}
/* ----- forms: base, regional, alternate, campaign-only, Mega ----- */
const dxArtOf=(sid,shiny)=>{
  const A=SPR_BASE+'other/official-artwork/';
  const l=shiny?[A+'shiny/'+sid+'.png']:[];
  l.push(A+sid+'.png');
  return l.concat(spriteSrcs(sid,shiny)).filter((u,i,a)=>a.indexOf(u)===i&&!SPR_BAD.has(u));
};
function dxFormList(id){
  const tp=n=>{const r=ptaRec(n);return r&&r.ty?r.ty.filter(Boolean):null;};
  const l=[{k:'b',label:DEXA[id-1],sid:id,types:dxTypes(id),sub:'Base form'}];
  FORMS.filter(f=>f.b===id).forEach(f=>l.push({k:'f'+f.i,label:f.n,sid:f.i,types:typePair(f.t).filter(Boolean),sub:f.r+' form'}));
  (DXALT[id]||[]).forEach(a=>l.push({k:'a'+a[0],label:a[0],sid:a[1],types:tp(a[0])||dxTypes(id),sub:'Alternate form'}));
  (DXNOART[id]||[]).forEach(n=>l.push({k:'n'+n,label:n,sid:id,types:tp(n)||dxTypes(id),sub:'Campaign form',noart:true}));
  MEGAS.filter(x=>x.b===id).forEach(x=>l.push({k:'m'+x.i,label:x.f,sid:x.i,types:typePair(x.t).filter(Boolean),sub:'Mega Evolution · '+x.st,mega:true}));
  return l;
}
function dxCurForm(id,l){
  const d=S.ui.dx;
  return (d.fm&&d.fm.id===id&&l.find(f=>f.k===d.fm.k))||l[0];
}
function dxFormPick(id,l,cur){
  if(l.length<2)return '';
  return h`<div class="dxfp" role="group" aria-label="Forms of ${DEXA[id-1]}">${l.map(f=>{
    const s=spriteSrcs(f.sid);
    return h`<button class="dxfb ${f===cur?'cur':''}" data-act="dx_form" data-k="${f.k}" aria-pressed="${String(f===cur)}" title="${f.label}">${s.length?h`<img class="sp mi" src="${s[0]}" data-fb="${s.slice(1).join('|')}" alt="" width="40" height="40" loading="lazy" decoding="async">`:h`<span class="mi-ph" aria-hidden="true"></span>`}<span>${f.mega?f.label.replace(/^Mega /,'Mega '):f.label.replace(DEXA[id-1],'').replace(/^[\s(]+|[\s)]+$/g,'')||'Base'}</span></button>`;})}</div>`;
}
function dxDetail(c){
  const d=S.ui.dx,id=d.sel;
  const nm=DEXA[id-1];
  const v=dxVis(c,id),s=dxStat(c,id);
  const n=dxNum(id);
  const st=dxStepIds(c,id);
  const top=h`<section class="panel dxp"><div class="ph">
      <button class="btn sm" data-act="dx_back">← All Pokémon</button>
      <div class="acts"><button class="btn sm" data-act="dx_step" data-d="-1" ${st.prev?'':raw('disabled')} aria-label="Previous entry">←</button><button class="btn sm" data-act="dx_step" data-d="1" ${st.next?'':raw('disabled')} aria-label="Next entry">→</button></div></div>`;
  if(!v){
    return h`${top}<div class="dxhead"><div class="dxartw" aria-hidden="true"></div><div class="dxinfo"><p class="dxno">No. ${dxNo(id)}${DXSINNO.has(id)?' · Sinnoh '+dxNo(DXSINNO.get(id)):''}</p><h2 class="dxname">???</h2>
      <p class="sub">Nobody at the table has met this Pokémon yet. It fills in when you catch one or the GM shows you one in battle.</p></div></div></section>`;
  }
  if(v>=2){dxLoad(id);if(PTA.idx)ptaWarm(nm);}
  const fl=dxFormList(id),cf=dxCurForm(id,fl),sy=!!S.ui.dx.sy;
  const srcs=dxArtOf(cf.sid,sy);
  const sinNo=DXSINNO.has(id)?DXSINNO.get(id):0;
  const gi=Math.max(0,DXGEN.findIndex(x=>id<=x[3]));
  const g=DXG[id];
  const head=h`<div class="dxhead">
      <div class="dxartcol"><div class="dxartw">${srcs.length?h`<img class="sp dxart" src="${srcs[0]}" data-fb="${srcs.slice(1).join('|')}" data-ini="${nm.charAt(0)}" alt="${cf.label+(sy?' (shiny)':'')}" width="160" height="160" decoding="async">`:''}</div><button class="btn sm dxsy" data-act="dx_shiny" aria-pressed="${String(sy)}">✨ Shiny</button></div>
      <div class="dxinfo">
        <p class="dxno">No. ${dxNo(id)}${sinNo?' · Sinnoh '+dxNo(sinNo):''} · Gen ${DXGEN[gi][0]} (${DXGEN[gi][1]})</p>
        <h2 class="dxname">${nm}</h2>
        ${g&&g.st==='ok'&&g.genus&&v>=2?h`<p class="sub">${g.genus}</p>`:''}
        <div class="types">${chipsOf(cf.types)}</div>
        ${fl.length>1?h`<p class="sub dxfc">${cf.k==='b'?'Showing the base form':cf.label+' · '+cf.sub}${cf.noart?' · no official art for this form, showing the base form':''}</p>`:''}
        ${dxFormPick(id,fl,cf)}
        <div class="row dxmk">${dxMarks(c,id,s)}</div>
        ${S.me.admin&&c.uid?h`<div class="row"><button class="btn sm" data-act="dx_all" data-id="${id}">Mark seen for every trainer</button></div>`:''}
      </div></div>`;
  if(v<2){
    return h`${top}${head}<p class="sub">You have seen it. Catch one to read the full entry.</p></section>
      <section class="panel"><div class="ph"><h2>Evolution family</h2></div>${dxFamily(c,id)}</section>`;
  }
  return h`${top}${head}</section>
    <section class="panel"><div class="ph"><h2>Game entry</h2></div>${dxGameView(id)}</section>
    <section class="panel"><div class="ph"><h2>Handbook</h2></div>${dxHandbook(c,id)}</section>
    ${dxLearn(id)}
    <section class="panel"><div class="ph"><h2>Evolution family</h2></div>${dxFamily(c,id)}</section>
    ${dxForms(id)}`;
}

/* ----- actions ----- */
function dxMarkSet(uid,id,v){
  if(!S.trainers[uid])return;
  edit('t',uid,'dx.n'+id,v);
}
function dxAct(b){
  const d=b.dataset,x=S.ui.dx;
  switch(d.act){
    case 'dx_lopen':x.lopen=!x.lopen;return;
    case 'dx_shiny':x.sy=!x.sy;render();return;
    case 'dx_form':x.fm={id:x.sel,k:String(d.k)};render();return;
    case 'dx_open':{
      const id=num(d.id);
      if(id<1||id>DXN)break;
      if(!x.sel)x.y=window.scrollY;
      x.sel=id;S.ui.toTop=true;render();break;}
    case 'dx_back':x.sel=0;render();window.scrollTo(0,x.y||0);break;
    case 'dx_step':{
      const st=dxStepIds(dxCtx(),x.sel);
      const to=num(d.d)<0?st.prev:st.next;
      if(to){x.sel=to;S.ui.toTop=true;render();}
      break;}
    case 'dx_more':x.page++;dxRefresh();break;
    case 'dx_clear':x.q='';x.gen='';x.type='';x.show='all';x.page=1;render();break;
    case 'dx_retry':dxLoad(num(d.id),true);render();break;
    case 'dx_mark':{
      const c=dxCtx();
      if(!dxCan(c))break;
      dxMarkSet(c.uid,num(d.id),clamp(num(d.v),0,2));
      render();break;}
    case 'dx_all':{
      if(!S.me.admin)break;
      const id=num(d.id);
      let k=0;
      tids().forEach(u=>{const t=S.trainers[u];if(t&&num(t.dx&&t.dx['n'+id])<1){dxMarkSet(u,id,1);k++;}});
      toast(k?'Marked '+DEXA[id-1]+' as seen for '+k+' trainer'+(k===1?'':'s')+'.':'Every trainer has already met '+DEXA[id-1]+'.',true);
      render();break;}
    case 'dx_rec':{
      const c=dxCtx();
      if(!dxCan(c))break;
      let k=0;
      c.own.forEach(id=>{if(num(c.reg['n'+id])<2){dxMarkSet(c.uid,id,2);k++;}});
      toast('Recorded '+k+' species as caught.',true);
      render();break;}
    case 'dx_sync':{
      const c=dxCtx();
      if(!dxCan(c))break;
      const tl=dxTally(c);
      edit('t',c.uid,'dex',tl.got);
      toast('Pokédex owned is now '+tl.got+'.',true);
      render();break;}
    case 'dx_lock':
      if(!S.me.admin)break;
      edit('mg','mega','dx_lock',!!b.checked);
      render();break;
  }
}
/* ---------- Contests: contest types, keywords, the contest move list and an appeal helper ----------
   The way a contest runs and what each keyword does are condensed here in plain words from the PTA 3.5 Players Handbook
   (Contests, Contest Keywords). It is a memory aid, not a copy of the book: the handbook has the full rules.
   Which contest type and keyword each move has comes from the handbook's Contest Moves table. Like the rest of the handbook text,
   that table is not part of this site's files. The GM imports it once (GM Desk, Handbook data) and it is kept in the table's
   database (meta/pta_contest), where only signed-in members can read it. */
const CT_TYPES=['Cool','Beauty','Cute','Clever','Tough'];   /* the order they sit in around the handbook's wheel */
const CT_ICON={Cool:'◆',Beauty:'●',Cute:'★',Clever:'■',Tough:'▼',Any:'✦'};
const CT_VIEWS=[['moves','Contest moves'],['keys','Keywords'],['help','Appeal helper'],['how','How contests work'],['ex','Example (Option B)'],['rib','Ribbons']];
S.ui.ct=S.ui.ct||{v:'moves',q:'',type:'',kw:'',show:'all',page:1,mv:'',mvt:'',ctype:'',volt:'0',elec:false,first:false,last:false,fin:false,low:false,both:false,maxed:false,before:'0',alone:false,allBig:false,lastHp:'2d4',ready:false,same:false,stat:'0',res:null,mon:'',sfrom:'',spent:{}};
const CT_PAGE=80;

/* two types on the wheel: the same type, next to each other (they get along), or across from each other (they clash) */
function ctRel(a,b){
  const i=CT_TYPES.indexOf(a),j=CT_TYPES.indexOf(b);
  if(i<0||j<0)return 'n';
  if(i===j)return 'm';
  return Math.min((i-j+5)%5,(j-i+5)%5)===1?'c':'x';
}
const ctClash=t=>CT_TYPES.filter(x=>ctRel(t,x)==='x');
const ctNear=t=>CT_TYPES.filter(x=>ctRel(t,x)==='c');

/* the 22 keywords: name, the Heart Points it starts with, the dice it always has (null when it depends), and what it does */
const CT_KW=[
  {k:'Appeal',hp:'3d4',n:3,fx:'Nothing special.'},
  {k:'Attention Grabber',hp:'Special',n:null,fx:'Roll the same number of d4 as the last move used (1d4, 2d4 or 3d4), plus one more die.'},
  {k:'Big Show',hp:'Special',n:null,fx:'Roll 8d4 if every contestant before you rolled at least 3d4 this round. It only works if you appeal last in the final round.'},
  {k:'Catching Up',hp:'1d4',n:1,fx:'Roll 3d4 more if you have the fewest total Heart Points right now.'},
  {k:'Crowd Pleaser',hp:'1d4',n:1,fx:'Raises the judge’s Voltage by exactly 2, whatever the move’s contest type.'},
  {k:'Excitement',hp:'2d4',n:2,fx:'The judge’s Voltage cannot go down for the rest of the round.'},
  {k:'Final Appeal',hp:'2d4',n:2,fx:'Roll 2d4 more if this is the final round.'},
  {k:'Get Ready!',hp:'None',n:0,fx:'No Heart Points of its own. On your next appeal you roll twice the dice you normally would.'},
  {k:'Good Show!',hp:'1d4',n:1,fx:'Roll 3d4 more if Voltage was raised on both of the last two appeals this round.'},
  {k:'Hold That Thought',hp:'2d4',n:2,fx:'After your appeal, the judge’s Voltage cannot be raised for the rest of the round.'},
  {k:'Incredible',hp:'1d4',n:1,fx:'Raises every judge’s Voltage by 1, whatever the contest types.'},
  {k:'Incentives',hp:'2d4',n:2,fx:'Roll 2d4 more when your appeal raises the judge’s Voltage.'},
  {k:'Inversed Appeal',hp:'Special',n:null,fx:'Roll 4d4, minus 1d4 for every point of the judge’s Voltage.'},
  {k:'Reflective Appeal',hp:'Special',n:null,fx:'Roll 1d4 for every point of the judge’s Voltage, up to 4d4.'},
  {k:'Reliable',hp:'2d4',n:2,fx:'You may use the same move next round and still earn Heart Points. When you do, roll 1d4 more.'},
  {k:'Round Ender',hp:'2d4',n:2,fx:'Roll 2d4 more if you appeal last this round.'},
  {k:'Round Starter',hp:'2d4',n:2,fx:'Roll 2d4 more if you appeal first this round.'},
  {k:'Scrambler',hp:'2d4',n:2,fx:'The order of appeals next round is randomised, and everyone must follow it.'},
  {k:'Seen Nothing Yet',hp:'2d4',n:2,fx:'Roll 2d4 more if anyone has raised a judge’s Voltage to the maximum this round.'},
  {k:'Special Attention',hp:'1d4',n:1,fx:'Roll 3d4 more if at least two appeals came before yours and nobody else appealed to your judge this round.'},
  {k:'Torrential Appeal',hp:'Special',n:null,fx:'Roll 1d4 for every contestant who appealed before you this round.'},
  {k:'Unsettling',hp:'2d4',n:2,fx:'Lowers every judge’s Voltage by 1.'}
];
const CT_KWMAP=new Map(CT_KW.map(x=>[dexKey(x.k),x]));
const ctKw=k=>CT_KWMAP.get(dexKey(k))||null;

/* ----- the move list, read from the table's database ----- */
const CT={list:null,map:null,sub:null,busy:null,fail:0,none:false};
function ctSet(arr){
  const list=[],map=new Map();
  (Array.isArray(arr)?arr:[]).forEach(a=>{
    if(!Array.isArray(a)||!a[0]||!a[2])return;
    const e={n:String(a[0]),t:String(a[1]||''),k:String(a[2]),note:a[3]?String(a[3]):''};
    list.push(e);
    map.set(dexKey(e.n),e);
  });
  CT.list=list.length?list:null;
  CT.map=list.length?map:null;
  CT.none=!list.length;
}
function ctLoad(){
  if(CT.list)return Promise.resolve(CT.list);
  if(CT.busy)return CT.busy;
  if(!S.db||(CT.fail&&Date.now()-CT.fail<30000))return Promise.resolve(null);
  let done,first=true;
  const p=new Promise(r=>{done=r;});
  CT.busy=p;
  const fin=v=>{if(first){first=false;clearTimeout(to);CT.busy=null;if(!v&&!CT.none)CT.fail=Date.now();done(v);}};
  const to=setTimeout(()=>fin(null),9000);
  if(CT.sub)try{CT.sub();}catch(e){}
  CT.sub=S.db.collection('meta').doc('pta_contest').onSnapshot(s=>{
    if(!s.exists){
      if(s.metadata&&s.metadata.fromCache)return;
      ctSet(null);
    }else ctSet(jparse((s.data()||{}).j));
    fin(CT.list);
    scheduleRender();
  },()=>fin(null));
  return p;
}
function ctWarm(){
  if(CT.list||CT.busy||CT.none||!S.db||(CT.fail&&Date.now()-CT.fail<30000))return;
  ctLoad().then(()=>scheduleRender());
}
const ctOf=name=>(CT.map&&CT.map.get(dexKey(name)))||null;
/* what a Pokémon's move is in a contest: its entry in the handbook list, or an Appeal move of the type its tutor picked */
function ctOfRow(x){
  const e=ctOf(x&&x.name);
  if(e)return {t:e.t,k:e.k,note:e.note,own:false};
  const t=x&&CT_TYPES.indexOf(x.ct)>=0?x.ct:'';
  return t?{t,k:'Appeal',note:'',own:true}:null;
}
const ctChip=t=>h`<span class="ct ${String(t||'').toLowerCase()}"><span aria-hidden="true">${CT_ICON[t]||''}</span>${t==='Any'?'Any type':t}</span>`;

/* the line under a move on the Pokémon sheet */
function ctLine(id,m,x,i,ro){
  ctWarm();
  if(!CT.list||!String(x.name||'').trim())return '';
  const c=ctOfRow(x);
  if(c){
    const kw=ctKw(c.k);
    return h`<div class="ctrow"><span class="fl">Contest</span>${ctChip(c.t)}<b>${c.k}</b><span class="sub">${kw?kw.hp+' Heart Points':''}${c.own?' · tutored move':''}</span>
      <button class="btn sm" data-act="ct_use" data-name="${x.name}" data-pid="${m.id}" ${c.own?attr('data-ct',c.t):''}>Appeal</button>
      ${kw?h`<span class="sub ctfx">${kw.fx}</span>`:''}${c.note?h`<span class="sub ctfx">${c.note}</span>`:''}</div>`;
  }
  if(ro)return '';
  return h`<div class="ctrow">${fSel('Contest type','p',id,'moves.'+i+'.ct',m,CT_TYPES,{blank:'Not on the handbook list',cls:'ctsel'})}<span class="sub ctfx">A move taught by a tutor is an Appeal move, and the tutor picks its contest type.</span></div>`;
}

/* ----- what the viewing trainer's Pokémon know ----- */
function ctMine(){
  const uid=dxUid();
  if(!uid||!S.trainers[uid])return {uid:null,mons:[]};
  return {uid,mons:monsOf(uid).map(m=>({id:m.id,name:mName(m),sp:m.species||'',cs:ctStatsOf(m),moves:(m.moves||[]).map(x=>({n:String(x&&x.name||'').trim(),ct:x&&CT_TYPES.indexOf(x.ct)>=0?x.ct:''})).filter(x=>x.n)})).filter(m=>m.moves.length)};
}

/* the contest type a player set on a tutored move of theirs, found by the move's name */
function ctOwnType(name){
  const k=dexKey(name);
  const mons=ctMine().mons;
  for(let i=0;i<mons.length;i++){
    const x=mons[i].moves.find(y=>dexKey(y.n)===k&&y.ct);
    if(x)return x.ct;
  }
  return '';
}

/* a Pokémon's five contest stats, keyed by contest type: {Cool:n,Beauty:n,...} */
function ctStatsOf(m){
  const cs=(m&&m.cs)||{};
  const o={};
  CT_TYPES.forEach(t=>{o[t]=clamp(Math.round(num(cs[t.toLowerCase()])),0,30);});
  return o;
}
const ctStatTotal=cs=>CT_TYPES.reduce((a,t)=>a+num(cs[t]),0);
/* the Pokémon the helper is working with, if it is one of the viewed trainer's */
function ctMon(){
  const id=S.ui.ct.mon;
  return id?(ctMine().mons.find(m=>m.id===id)||null):null;
}
const ctSpent=(mon,t)=>num(((S.ui.ct.spent||{})[mon.id]||{})[t]);
const ctLeft=(mon,t)=>Math.max(0,num(mon.cs[t])-ctSpent(mon,t));
/* which of its stats this appeal would draw on: the move's own type, or the one the player picks for an any-type move */
function ctStatType(p,mon){
  if(p.type==='Any'){
    const o=S.ui.ct;
    if(CT_TYPES.indexOf(o.sfrom)>=0)return o.sfrom;
    let best=CT_TYPES[0];
    CT_TYPES.forEach(t=>{if(ctLeft(mon,t)>ctLeft(mon,best))best=t;});
    return best;
  }
  return CT_TYPES.indexOf(p.type)>=0?p.type:'';
}
/* what the chosen Pokémon can spend on this move, or null when no Pokémon is chosen */
function ctAvail(){
  const mon=ctMon(),p=ctPickInfo();
  if(!mon||!p.type)return null;
  const t=ctStatType(p,mon);
  if(!t)return null;
  return {mon,t,left:ctLeft(mon,t),total:num(mon.cs[t])};
}
const ctAnySpent=()=>{const sp=S.ui.ct.spent||{};return Object.keys(sp).some(k=>CT_TYPES.some(t=>num(sp[k][t])>0));};

/* ----- the appeal helper's arithmetic. Nothing here touches the database. ----- */
/* o: kw, type (the move's), ctype (the contest's), volt, elec, first, last, fin, low, both, maxed, before, alone, allBig, lastHp, ready, same, stat */
function ctCalc(o){
  const kw=o.kw||'Appeal';
  const volt=clamp(Math.round(num(o.volt)),0,5);
  const before=clamp(Math.round(num(o.before)),0,9);
  const rel=o.ctype?ctRel(o.type,o.ctype):'n';
  const parts=[],notes=[],after=[];
  const add=(n,why)=>{if(n>0)parts.push({n,why});};
  /* what the move does to the judge's Voltage */
  let dv=rel==='m'?1:rel==='x'?-1:0;
  if(kw==='Crowd Pleaser')dv=2;
  const raises=dv>0&&volt<5;
  const reach=volt<5&&volt+dv>=5;
  switch(kw){
    case 'Appeal':add(3,'Appeal');break;
    case 'Attention Grabber':{const n=clamp(Math.round(num(String(o.lastHp||'2d4').replace(/d.*$/,''))),1,3);add(n+1,'the last move’s '+n+'d4 and one more die');break;}
    case 'Big Show':
      if(o.last&&o.fin&&o.allBig)add(8,'Big Show');
      else notes.push('Big Show only works if you appeal last in the final round and every contestant before you rolled at least 3d4. Otherwise it earns no dice.');
      break;
    case 'Catching Up':add(1,'Catching Up');if(o.low)add(3,'you have the fewest Heart Points');break;
    case 'Crowd Pleaser':add(1,'Crowd Pleaser');break;
    case 'Excitement':add(2,'Excitement');break;
    case 'Final Appeal':add(2,'Final Appeal');if(o.fin)add(2,'it is the final round');break;
    case 'Get Ready!':break;
    case 'Good Show!':add(1,'Good Show!');if(o.both)add(3,'Voltage was raised on both of the last two appeals');break;
    case 'Hold That Thought':add(2,'Hold That Thought');break;
    case 'Incredible':add(1,'Incredible');break;
    case 'Incentives':add(2,'Incentives');if(raises)add(2,'your appeal raises the Voltage');break;
    case 'Inversed Appeal':add(Math.max(0,4-volt),'4d4 minus 1d4 for each point of Voltage');break;
    case 'Reflective Appeal':add(Math.min(4,volt),'1d4 for each point of Voltage, up to 4d4');break;
    case 'Reliable':add(2,'Reliable');if(o.same)add(1,'you repeated a Reliable move');break;
    case 'Round Ender':add(2,'Round Ender');if(o.last)add(2,'you appeal last');break;
    case 'Round Starter':add(2,'Round Starter');if(o.first)add(2,'you appeal first');break;
    case 'Scrambler':add(2,'Scrambler');break;
    case 'Seen Nothing Yet':add(2,'Seen Nothing Yet');if(o.maxed)add(2,'someone raised a judge’s Voltage to the maximum');break;
    case 'Special Attention':add(1,'Special Attention');if(before>=2&&o.alone)add(3,'nobody else appealed to this judge');break;
    case 'Torrential Appeal':add(before,'1d4 for each contestant before you');break;
    case 'Unsettling':add(2,'Unsettling');break;
    default:break;
  }
  if(rel==='m')add(1,'the move matches the contest type');
  if(reach)add(3,'the judge reaches 5 Voltage');
  /* the same move twice in a row earns nothing, except a Reliable one */
  const zero=!!o.same&&kw!=='Reliable';
  if(zero){parts.length=0;notes.push('The same move twice in a row earns no Heart Points at all. Its effects still happen.');}
  let mult=1;
  if(o.ready&&!zero){mult*=2;parts.forEach(p=>{p.n*=2;});}
  const stat=clamp(Math.round(num(o.stat)),0,40);
  const dice=parts.reduce((a,p)=>a+p.n,0);
  const x2=!!o.elec&&!zero;
  /* what to do to the judge afterwards */
  if(kw==='Crowd Pleaser')after.push(volt>=5?'The judge is already at the maximum Voltage.':'Raise the judge’s Voltage by exactly 2.');
  else if(rel==='m')after.push(volt>=5?'The judge is already at the maximum Voltage.':'Raise the judge’s Voltage by 1: the move matches the contest type.');
  else if(rel==='x')after.push('Lower the judge’s Voltage by 1: the move clashes with the contest type.');
  else if(rel==='c')after.push('The move gets along with the contest type, so the Voltage does not change.');
  if(reach)after.push('The judge is now Electrified: every later appeal to them earns double Heart Points.');
  if(kw==='Incredible')after.push('Raise every judge’s Voltage by 1.');
  if(kw==='Unsettling')after.push('Lower every judge’s Voltage by 1.');
  if(kw==='Excitement')after.push('The judge’s Voltage cannot go down for the rest of the round.');
  if(kw==='Hold That Thought')after.push('The judge’s Voltage cannot be raised for the rest of the round.');
  if(kw==='Scrambler')after.push('Randomise the order of appeals for the next round.');
  if(kw==='Get Ready!')after.push('On your next appeal, roll twice the dice you normally would.');
  return {kw,rel,parts,dice,stat:zero?0:stat,x2,ready:!!o.ready&&!zero,zero,notes,after,raises,reach};
}
const ctDiceTxt=c=>c.parts.length?c.parts.map(p=>p.n+'d4 '+p.why).join(' + '):'no dice';
function ctDo(c){
  const rolled=[];
  for(let i=0;i<c.dice;i++)rolled.push(rnd(4));
  const sum=rolled.reduce((a,b)=>a+b,0);
  const sub=sum+c.stat;
  const total=c.zero?0:(c.x2?sub*2:sub);
  return {rolled,sum,total,sub};
}
function ctDetail(c,r){
  let s=(c.dice?c.dice+'d4 ['+r.rolled.join(', ')+']':'no dice')+(c.stat?' + '+c.stat+' contest stat':'')+(c.x2?' × 2 Electrified':'')+' = '+r.total;
  if(c.ready)s+=' (dice doubled by Get Ready!)';
  return s;
}

/* ----- the move the helper is working on ----- */
function ctPickInfo(){
  const o=S.ui.ct;
  const name=String(o.mv||'').trim();
  const e=name?ctOf(name):null;
  const type=e?e.t:(CT_TYPES.indexOf(o.mvt)>=0?o.mvt:'');
  return {name,e,type,kw:e?e.k:'Appeal'};
}
function ctState(){
  const o=S.ui.ct,p=ctPickInfo();
  const av=ctAvail();
  return {kw:p.kw,type:p.type,ctype:o.ctype,volt:o.volt,elec:o.elec,first:o.first,last:o.last,fin:o.fin,low:o.low,both:o.both,maxed:o.maxed,before:o.before,alone:o.alone,allBig:o.allBig,lastHp:o.lastHp,ready:o.ready,same:o.same,stat:av?Math.min(num(o.stat),av.left):o.stat};
}

/* ----- the page ----- */
const ctSel=(key,label,opts,cur)=>h`<label class="fld"><span class="fl">${label}</span><select data-u="ct.${key}">${opts.map(op=>{const v=Array.isArray(op)?op[0]:op;const l=Array.isArray(op)?op[1]:op;return h`<option value="${v}" ${String(v)===String(cur)?raw('selected'):''}>${l}</option>`;})}</select></label>`;
const ctChk=(key,label)=>h`<label class="row"><input type="checkbox" data-u="ct.${key}" ${S.ui.ct[key]?raw('checked'):''}><span>${label}</span></label>`;
const ctNums=(a,b)=>Array.from({length:b-a+1},(_,i)=>String(a+i));

function ctGate(){
  if(CT.list)return '';
  if(CT.busy||(!CT.none&&!CT.fail))return h`<p class="sub" role="status">Loading the contest move list…</p>`;
  if(S.me.admin)return h`<div class="banner">The contest move list is not loaded. If you have not imported the newest handbook data yet, open the GM Desk, choose <b>Import again</b> under Handbook data, and pick the newest <b>pta-handbook-data.json</b>.</div>`;
  return CT.none
    ?h`<div class="banner">The contest move list has not been added yet. Ask your GM to import the newest handbook data.</div>`
    :h`<p class="sub bad" role="status">The contest move list could not be loaded just now. Reload the page to try again.</p>`;
}

function ctMovesView(){
  const o=S.ui.ct;
  const mine=ctMine();
  const gate=ctGate();
  return h`${S.me.admin?trainerPicker():''}
    ${gate}
    ${CT.list&&mine.mons.length?h`<h3 class="refg">${S.me.admin?tName(S.trainers[mine.uid])+'’s Pokémon':'Your Pokémon'}</h3>
      <div class="ctmons">${mine.mons.map(m=>h`<div class="ctmon"><p class="ctmn"><b>${m.name}</b>${m.sp&&m.sp!==m.name?h` <span class="sub">${m.sp}</span>`:''}</p>
        <ul class="ctlist">${m.moves.map(x=>{
          const e=ctOf(x.n);
          const kw=e?ctKw(e.k):null;
          const own=!e&&x.ct;
          return h`<li><span class="ctt">${e?ctChip(e.t):own?ctChip(x.ct):h`<span class="sub">Not listed</span>`}</span><span class="ctn">${x.n}</span><span class="ctk">${e?h`<b>${e.k}</b> <span class="sub">${kw?kw.hp:''}</span>`:own?h`<b>Appeal</b> <span class="sub">3d4 · tutored move</span>`:h`<span class="sub">Appeal, the tutor picks the type</span>`}</span><button class="btn sm" data-act="ct_use" data-name="${x.n}" data-pid="${m.id}">Appeal</button></li>`;
        })}</ul></div>`)}</div>`:''}
    ${CT.list?h`<h3 class="refg">Every contest move</h3>
    <div class="dxf">
      <label class="fld dxq"><span class="fl">Search</span><input type="search" data-u="ct.q" data-nr value="${o.q||''}" placeholder="Move name" autocomplete="off"></label>
      ${ctSel('type','Contest type',[['','All types']].concat(CT_TYPES.concat(['Any']).map(t=>[t,t==='Any'?'Any type':t])),o.type)}
      ${ctSel('kw','Keyword',[['','All keywords']].concat(CT_KW.map(x=>[x.k,x.k])),o.kw)}
      ${mine.mons.length?ctSel('show','Show',[['all','Every move'],['mine','Moves my Pokémon know']],o.show):''}
    </div>
    <div id="ctres">${ctResults()}</div>`:''}`;
}
function ctFiltered(){
  const o=S.ui.ct;
  const q=dexKey(o.q);
  let known=null;
  if(o.show==='mine'){
    const mm=ctMine().mons;
    if(mm.length){known=new Set();mm.forEach(m=>m.moves.forEach(x=>known.add(dexKey(x.n))));}
  }
  return (CT.list||[]).filter(e=>(!q||dexKey(e.n).indexOf(q)>=0)&&(!o.type||e.t===o.type)&&(!o.kw||e.k===o.kw)&&(!known||known.has(dexKey(e.n))));
}
function ctResults(){
  const o=S.ui.ct;
  const all=ctFiltered();
  const shown=all.slice(0,o.page*CT_PAGE);
  const filtered=!!(o.q||o.type||o.kw||o.show!=='all');
  return h`<p class="sub" id="ctcount" aria-live="polite">${all.length===1?'1 move':all.length+' moves'}${all.length>shown.length?' · showing '+shown.length:''}</p>
    ${all.length?h`<ul class="ctlist">${shown.map(e=>{
      const kw=ctKw(e.k);
      return h`<li><span class="ctt">${ctChip(e.t)}</span><span class="ctn">${e.n}</span><span class="ctk"><b>${e.k}</b> <span class="sub">${kw?kw.hp:''}</span>${e.note?h` <span class="sub">${e.note}</span>`:''}</span><button class="btn sm" data-act="ct_use" data-name="${e.n}">Appeal</button></li>`;
    })}</ul>`:h`<p class="sub">Nothing matches.${filtered?h` <button class="btn sm" data-act="ct_clear">Clear the filters</button>`:''}</p>`}
    ${all.length>shown.length?h`<div class="row"><button class="btn" data-act="ct_more">Show ${Math.min(CT_PAGE,all.length-shown.length)} more</button></div>`:''}`;
}
/* typing in the search box redraws only the results, so the box keeps its place */
function ctRefresh(){
  const el=$('#ctres');
  if(el)el.innerHTML=ctResults().s;
}

function ctKeysView(){
  const cnt={};
  (CT.list||[]).forEach(e=>{cnt[e.k]=(cnt[e.k]||0)+1;});
  return h`<p class="sub">Every contest move has one keyword. The keyword says how many d4 the appeal rolls for Heart Points and what else it does. In a contest, moves can be used again and again, so a move’s 1/day or 3/day limit does not apply.</p>
    ${ctGate()}
    <dl class="refdl ctkw">${CT_KW.map(x=>h`<dt>${x.k}<br><span class="pill">${x.hp}</span></dt><dd>${x.fx}${CT.list?h`<br><button class="btn sm ghost" data-act="ct_kw" data-k="${x.k}">${cnt[x.k]||0} move${(cnt[x.k]||0)===1?'':'s'}</button>`:''}</dd>`)}</dl>`;
}

/* ----- the appeal helper ----- */
function ctHelpBody(){
  const o=S.ui.ct;
  const p=ctPickInfo();
  const tn=!p.name;
  const needs={first:p.kw==='Round Starter',last:p.kw==='Round Ender'||p.kw==='Big Show',fin:p.kw==='Final Appeal'||p.kw==='Big Show',low:p.kw==='Catching Up',both:p.kw==='Good Show!',maxed:p.kw==='Seen Nothing Yet',
    before:p.kw==='Torrential Appeal'||p.kw==='Special Attention',alone:p.kw==='Special Attention',allBig:p.kw==='Big Show',lastHp:p.kw==='Attention Grabber'};
  if(tn)return h`<p class="sub">Type a move name above, or pick one of your Pokémon’s moves, and the helper works out what to roll.</p>`;
  if(!p.type)return h`<p class="sub">“${p.name}” is not on the handbook’s contest list. A tutored move is an Appeal move, and its tutor picks the contest type.</p>
    <div class="mrgrid refmx">${ctSel('mvt','Contest type of this move',[['','Pick a type']].concat(CT_TYPES),o.mvt)}</div>`;
  const av=ctAvail();
  const st=ctState();
  const c=ctCalc(st);
  const kwi=ctKw(p.kw);
  const rel=c.rel;
  return h`<p class="ctsum">${ctChip(p.type)} <b>${p.name}</b> · ${p.kw} <span class="sub">${kwi?kwi.hp+' Heart Points':''}</span></p>
    ${kwi?h`<p class="sub">${kwi.fx}</p>`:''}
    ${p.e&&p.e.note?h`<p class="sub">${p.e.note}</p>`:''}
    <div class="mrgrid refmx">
      ${ctSel('ctype','Type of this contest',[['','Not announced / none']].concat(CT_TYPES),o.ctype)}
      ${ctSel('volt','The judge’s Voltage now',ctNums(0,5),o.volt)}
      ${av?(p.type==='Any'?ctSel('sfrom','Spend from which stat',CT_TYPES.map(t=>[t,t+' · '+ctLeft(av.mon,t)+' left']),av.t):''):''}
      ${av?ctSel('stat','Contest stat points you spend ('+av.t+', '+av.left+' left)',ctNums(0,av.left),String(Math.min(num(o.stat),av.left))):ctSel('stat','Contest stat points you spend',ctNums(0,10),o.stat)}
      ${needs.before?ctSel('before','Contestants who appealed before you this round',ctNums(0,9),o.before):''}
      ${needs.lastHp?ctSel('lastHp','Heart Points dice of the last move used',['1d4','2d4','3d4'],o.lastHp):''}
    </div>
    <div class="ctchecks">
      ${needs.first?ctChk('first','You appeal first this round'):''}
      ${needs.last?ctChk('last','You appeal last this round'):''}
      ${needs.fin?ctChk('fin','This is the final round'):''}
      ${needs.low?ctChk('low','You have the fewest total Heart Points'):''}
      ${needs.both?ctChk('both','Voltage was raised on both of the last two appeals this round'):''}
      ${needs.maxed?ctChk('maxed','Someone raised a judge’s Voltage to the maximum this round'):''}
      ${needs.alone?ctChk('alone','Nobody else appealed to this judge this round'):''}
      ${needs.allBig?ctChk('allBig','Every contestant before you rolled at least 3d4'):''}
      ${p.kw!=='Reliable'?ctChk('same','You used this same move on your last appeal'):ctChk('same','You used this same Reliable move last round')}
      ${ctChk('ready','Your last appeal was Get Ready! (roll double)')}
      ${ctChk('elec','This judge is Electrified (double Heart Points)')}
    </div>
    <div class="ctcalc" role="status" aria-live="polite">
      <p><b>${c.zero?'No Heart Points':c.dice+'d4'+(c.stat?' + '+c.stat:'')+(c.x2?' × 2':'')}</b>${rel==='m'?h` <span class="pill good">Matches the contest</span>`:rel==='x'?h` <span class="pill bad">Clashes with the contest</span>`:rel==='c'?h` <span class="pill">Gets along with the contest</span>`:''}</p>
      ${c.parts.length?h`<ul class="reful">${c.parts.map(x=>h`<li>${x.n}d4 · ${x.why}</li>`)}${c.stat?h`<li>+${c.stat} · contest stat points spent</li>`:''}</ul>`:''}
      ${c.notes.map(n=>h`<p class="sub">${n}</p>`)}
    </div>
    <div class="row"><button class="btn primary" data-act="ct_roll">Roll the appeal</button><button class="btn" data-act="ct_reset">Reset</button></div>
    ${o.res?ctResult(o.res):''}
    ${c.after.length?h`<h3 class="refg">After your appeal</h3><ul class="reful">${c.after.map(x=>h`<li>${x}</li>`)}</ul>`:''}
    <p class="sub">When you describe your appeal (about ten seconds), the GM may add one or two secret d4 rolls for it. The GM rolls those, not you.</p>`;
}
function ctResult(r){
  return h`<div class="ctres" role="status" aria-live="polite"><span class="k">HEART POINTS</span><div class="big">${r.total}</div><div class="sub">${r.name} · ${r.detail}</div></div>`;
}
function ctHelpView(){
  const o=S.ui.ct;
  const mine=ctMine();
  const mon=ctMon();
  const pool=mon?[mon]:mine.mons;
  const opt=(m,x)=>h`<option value="${m.id+'|'+x.n}" ${m.id===o.mon&&dexKey(x.n)===dexKey(o.mv)?raw('selected'):''}>${x.n}</option>`;
  return h`<p class="sub">Pick a move and say what is going on in the round. The helper adds up the dice from the move’s keyword, rolls them, and tells you what happens to the judge’s Voltage. It is a memory aid: the handbook has the full rules.</p>
    ${ctGate()}
    <div class="mrgrid refmx">
      ${mine.mons.length?h`<label class="fld"><span class="fl">Pokémon (to use its contest stats)</span><select data-u="ct.monsel"><option value="">Not using contest stats</option>${mine.mons.map(m=>h`<option value="${m.id}" ${m.id===o.mon?raw('selected'):''}>${m.name}</option>`)}</select></label>`:''}
      <label class="fld"><span class="fl">Move</span><input type="text" data-u="ct.mv" data-nr list="dl-ctmoves" value="${o.mv||''}" placeholder="Start typing a move" autocomplete="off"></label>
      ${mine.mons.length?h`<label class="fld"><span class="fl">Or ${mon?mon.name+'’s':'one of your Pokémon’s'} moves</span><select data-u="ct.mvsel"><option value="">Choose…</option>${mon?mon.moves.map(x=>opt(mon,x)):pool.map(m=>h`<optgroup label="${m.name}">${m.moves.map(x=>opt(m,x))}</optgroup>`)}</select></label>`:''}
    </div>
    ${mon?h`<div class="ctstats" aria-label="${mon.name}’s contest stats, points left out of points written">${CT_TYPES.map(t=>h`<span class="ctst">${ctChip(t)} <b>${ctLeft(mon,t)}</b><span class="sub">/${mon.cs[t]}</span></span>`)}${ctStatTotal(mon.cs)?'':h`<span class="sub">No contest stats are written on its sheet yet.</span>`}</div>`:''}
    ${ctAnySpent()?h`<div class="row"><button class="btn sm" data-act="ct_restore">New contest: restore all stat points</button><span class="sub">Points spent in a contest come back at the end of it.</span></div>`:''}
    <datalist id="dl-ctmoves">${(CT.list||[]).map(e=>h`<option value="${e.n}">`)}</datalist>
    <div id="cthelp">${ctHelpBody()}</div>`;
}
function ctHelpRefresh(){
  const el=$('#cthelp');
  if(el)el.innerHTML=ctHelpBody().s;
}

/* ----- how a contest runs, in plain words ----- */
function ctHowView(){
  const wheel=CT_TYPES.map(t=>h`<li>${ctChip(t)} <span class="sub">gets along with</span> ${ctNear(t).map(x=>ctChip(x))} <span class="sub">and clashes with</span> ${ctClash(t).map(x=>ctChip(x))}</li>`);
  return h`<div class="refp">
    ${refSec('ct_what','What a contest is',h`<ul class="reful">
      <li>Instead of knocking each other out, coordinators try to impress a panel of judges. Usually there are three judges, and each has three Star Points to give.</li>
      <li>Each judge has a hidden goal for each Star Point, such as the most Heart Points overall, or the most Heart Points with Clever moves or Fire-type moves. You earn the point by meeting the goal by the end of the contest. Whoever has the most Star Points wins a Contest Ribbon.</li>
      <li>Appeals earn Heart Points. The judges keep track of them and use them to decide who gets which Star Point.</li>
      <li>At least one contest type is announced at the start, and at least one judge favours it. That only decides one Star Point, so watch the judges for clues about the others.</li>
    </ul>`)}
    ${refSec('ct_types','Contest types',h`<p class="sub">Every move has a contest type as well as its battle type: Cool, Beauty, Cute, Clever or Tough. Around the handbook’s wheel, neighbours get along and the two types across from each other clash.</p>
      <ul class="ctwheel">${wheel}</ul>
      <ul class="reful"><li><b>Cool</b> rewards confidence, precision and strong stage presence.</li><li><b>Beauty</b> rewards grace, elegance and visual harmony.</li><li><b>Cute</b> rewards charm, personality and audience appeal.</li><li><b>Clever</b> rewards creativity, strategy and the unexpected.</li><li><b>Tough</b> rewards endurance, resilience and intensity.</li></ul>`)}
    ${refSec('ct_stages','The three stages',h`<h3 class="refg">Introduction</h3>
      <ul class="reful"><li>Everyone introduces themselves. Each trainer may make one Insight check on a single judge. A success reveals one hidden goal, and a very good roll may reveal several.</li>
      <li>The favoured contest type is announced. Moves of that type raise the judge’s excitement.</li>
      <li>If a judge wants an initial appeal, a Pokémon comes out and its grooming, contest stats and any accessories are looked over. Some contests give Heart Points for this.</li></ul>
      <h3 class="refg">Appeal stage</h3>
      <ul class="reful"><li>There are five rounds. In each round you pick a judge to perform for, pick a move, and use its keyword to work out your Heart Points.</li>
      <li>If the move’s contest type matches the contest’s type, roll 1d4 more Heart Points and raise that judge’s Voltage by 1 afterwards. If it clashes, lower the Voltage by 1 instead. If it gets along with the contest type, nothing changes.</li>
      <li>When a judge’s Voltage reaches 5, the contestant who got it there gets 3d4 more Heart Points on that appeal, and the judge is Electrified for the rest of the contest: every appeal to them earns double Heart Points.</li>
      <li>Using the same move twice in a row earns no Heart Points, though its effects and Voltage changes still happen. Reliable moves are the exception.</li>
      <li>Within a round, contestants appeal in any order. If several want to go at once, the fastest Pokémon goes first. If nobody wants to, the judges pick whoever has the most Heart Points, with Speed breaking ties.</li>
      <li>Describe your appeal in about ten seconds. The GM may add one or two secret d4 rolls for good creativity.</li></ul>
      <h3 class="refg">Award stage</h3>
      <ul class="reful"><li>Each judge announces their goals one by one and hands out Star Points. The trainer with the most Star Points wins a Contest Ribbon, and big contests may give a runner-up ribbon. A tie can mean shared first place.</li>
      <li>A trainer can earn several ribbons across different contests, but only one honour per contest hall.</li></ul>`)}
    ${refSec('ct_stats','Contest stats',h`<ul class="reful"><li>Each Pokémon has five contest stats, one for each contest type. They start at zero and grow when you feed it special foods such as Poffins and PokéBlocks.</li>
      <li>A Pokémon can have 10 points in total, split however you like. Scarves can push the total above 10. Once spent on food, they are permanent.</li>
      <li>During the introduction or any appeal, you may spend points from a stat to add that many to your Heart Points, but only when the move’s contest type matches that stat. Everything is restored at the end of the contest.</li>
      <li>Write a Pokémon’s five stats in the Contest stats box on its sheet. In the Appeal helper, pick that Pokémon and the helper will only let you spend what is left in the matching stat, and count what you have spent until you press the restore button for a new contest.</li></ul>`)}
    ${refSec('ct_var','Variations',h`<dl class="refdl">
      <dt>Trainer Appeal</dt><dd>The trainer’s own speeches, music, feats or attacks can earn Heart Points too.</dd>
      <dt>Super Contest</dt><dd>A contest type is picked at random at the start of every round.</dd>
      <dt>Festival</dt><dd>Each judge announces a different favoured type every round.</dd>
      <dt>High Voltage</dt><dd>Each judge starts at 1 Voltage. Whenever a judge’s Voltage rises, the appeal adds that many d4. Electrified judges add 5d4 rather than doubling.</dd>
      <dt>Rival Showcase</dt><dd>Contestants are paired off and judged against each other every round.</dd>
      <dt>Audience Participation</dt><dd>Exciting the crowd or matching its tastes can earn bonus Heart Points.</dd>
      <dt>Double Performance</dt><dd>Two Pokémon appeal together each round, and the two moves are combined: take the contest type from one and the keyword from the other. Neither can repeat last round’s move unless it is Reliable.</dd>
      <dt>Extra stages</dt><dd>Judges can add a Fashion Show (Cute, Beauty), Pokéathlon (Tough), PokéStar Heroes (Cool), Talent Show (Clever) or a Dummy round that scores damage done to a stage dummy. They award extra Star Points.</dd></dl>`)}
    ${refSec('ct_optb','House rule: Option B',h`<p>Each appeal is made to one judge. That judge’s Voltage changes, and the appeal’s Heart Points count only toward that judge’s Star Point categories. Categories that don’t depend on appeals (dress, stats, appearance) are judged across all contestants.</p>
      <p class="sub">The handbook is not clear on whether a Star Point category counts every appeal or only the ones made to that judge, so a table has to pick. This is the second, more tactical choice.</p>
      <button class="btn sm" data-act="ct_view" data-v="ex">See a full example contest</button>`)}
    ${refSec('ct_tut','Moves that are not on the list',h`<p class="sub">A move taught by a tutor that is not on the handbook’s list is an Appeal move. The tutor picks its contest type when the move is learned. On a Pokémon’s sheet you can set that type under the move.</p>`)}
  </div>`;
}

/* ----- a whole contest played out under the Option B house rule ----- */
const ctB=s=>raw(esc(String(s)).replace(/\*\*(.+?)\*\*/g,'<b>$1</b>'));
const CT_EX={
  judges:[
    ['Brutus','head judge, public',['Most Heart Points from Tough moves','Highest total Heart Points','Most appeals made to him']],
    ['Rosa','a regular',['Most Heart Points from Electric-type moves','Most Heart Points from Clever moves','Best-dressed trainer (not appeal-based)']],
    ['Madame Vex','mystery judge',['Most Heart Points from non-damaging moves','Most different contest types used','Pokémon that most looks like its trainer (not appeal-based)']]
  ],
  cons:[
    ['Ren','player','Luxray',[['Tackle','Tough','Appeal'],['Zing Zap','Tough','Appeal'],['Thunder Wave','Cool','Excitement'],['Bide','Tough','Final Appeal']],'All of Brutus’s categories (DC 10), plus Rosa’s Electric category (DC 20)'],
    ['Mae','player','Roserade',[['Absorb','Clever','Good Show!'],['Toxic','Clever','Excitement'],['Acid Armor','Tough','Hold That Thought']],'Brutus’s categories, plus Rosa’s Clever category (Insight check)'],
    ['Garrett','NPC Grand Festival coordinator','Infernape',[['Flamethrower','Beauty','Round Starter'],['Darkest Lariat','Cool','Special Attention'],['Bitter Blade','Cool','Good Show!'],['Tackle','Tough','Appeal']],'Four categories; plans to take Brutus’s total and Vex’s variety category']
  ],
  rounds:[
    {t:'Round 1',rows:[
      ['Garrett → **Vex**',['Flamethrower','Beauty','Round Starter'],'2d4 + 2d4 for going first = 4d4','**10**','Clash, but Vex is already at 0'],
      ['Ren → **Brutus**',['Zing Zap','Tough','Appeal'],'3d4 + 1d4 match = 4d4','**11**','Brutus 0 → **1**'],
      ['Mae → **Rosa**',['Toxic','Clever','Excitement'],'2d4','**5**','Gets along, no change; Rosa’s Voltage can’t drop this round']
    ],note:'Garrett goes first to trigger Round Starter. Ren starts building Brutus toward Electrified.'},
    {t:'Round 2',rows:[
      ['Ren → **Brutus**',['Tackle','Tough','Appeal'],'4d4','**10**','Brutus 1 → **2**'],
      ['Mae → **Brutus**',['Acid Armor','Tough','Hold That Thought'],'2d4 + 1d4 match = 3d4','**7**','Brutus 2 → **3**; Brutus can’t rise again this round'],
      ['Garrett → **Brutus**',['Bitter Blade','Cool','Good Show!'],'1d4 + 3d4 (both earlier appeals this round raised Voltage) = 4d4','**10**','Gets along, no change']
    ],note:'Garrett waited for two Voltage raises in a row, then cashed in Good Show!. Mae’s Hold That Thought blocked nothing here, but it would have stopped a Tough move from Garrett.'},
    {t:'Round 3',rows:[
      ['Ren → **Brutus**',['Zing Zap','Tough','Appeal'],'4d4','**9**','Brutus 3 → **4**'],
      ['Mae → **Rosa**',['Absorb','Clever','Good Show!'],'1d4 (only one appeal came before, so no bonus)','**2**','No change'],
      ['Garrett → **Vex**',['Darkest Lariat','Cool','Special Attention'],'1d4 + 3d4 (two appeals came before him; nobody else performed for Vex) = 4d4','**11**','No change']
    ],note:'Ren can use Zing Zap again because his last move was Tackle. Brutus is one step from Electrified.'},
    {t:'Round 4',rows:[
      ['Garrett → **Brutus**',['Tackle','Tough','Appeal'],'3d4 + 1d4 match + 3d4 for reaching 5 = 7d4','**18**','Brutus 4 → **5: Electrified**'],
      ['Ren → **Brutus**',['Tackle','Tough','Appeal'],'4d4 = 10, doubled','**20**','Already at maximum'],
      ['Mae → **Rosa**',['Toxic','Clever','Excitement'],'2d4','**6**','No change']
    ],note:'The turning point: Ren raised Brutus, but Garrett jumped in first and took the +3d4 for reaching 5. Electrified still benefits everyone, so Ren’s Tackle earns double.'},
    {t:'Round 5 (final round)',rows:[
      ['Ren → **Brutus**',['Bide','Tough','Final Appeal'],'2d4 + 2d4 final round + 1d4 match = 5d4 = 13, doubled','**26**','Already at maximum'],
      ['Garrett → **Brutus**',['Flamethrower','Beauty','Round Starter'],'2d4 (not first) = 5, doubled','**10**','Clash: 5 → 4, but Brutus stays Electrified'],
      ['Mae → **Vex**',['Acid Armor','Tough','Hold That Thought'],'2d4 + 1d4 match = 3d4','**8**','Vex 0 → **1**']
    ],note:'Garrett can’t use Tackle again because he used it last round, so he settles for a weaker doubled appeal.'}
  ],
  awards:[
    ['Brutus','Saw Ren 5 times (11 + 10 + 9 + 20 + 26 = 76, all from Tough moves), Garrett 3 times (10 + 18 + 10 = 38, of which 18 from Tough moves) and Mae once (7, from a Tough move).',[
      ['Most Heart Points from Tough moves','**Ren** (76)'],['Highest total Heart Points','**Ren** (76)'],['Most appeals made to him','**Ren** (5)']]],
    ['Rosa','Only ever saw Mae (Toxic 5, Absorb 2, Toxic 6).',[
      ['Most Heart Points from Electric-type moves','**Not awarded.** Ren knew this category existed but spent every Electric move on Brutus, so Rosa never saw them.'],
      ['Most Heart Points from Clever moves','**Mae** (13)'],['Best-dressed trainer','**Mae** (GM’s call: a coordinated garden-themed outfit)']]],
    ['Madame Vex','Saw Garrett twice (Beauty and Cool moves) and Mae once (a Tough move).',[
      ['Most Heart Points from non-damaging moves','**Mae** (Acid Armor, 8)'],['Most different contest types used','**Garrett** (2 types against Mae’s 1)'],['Pokémon that most looks like its trainer','**Garrett** (GM’s call: wild hair, fiery temper)']]]
  ],
  stand:[['Ren',3,76],['Mae',3,28],['Garrett',2,59]],
  lessons:[
    ['Heart Points alone don’t win.','Garrett had the second-highest total but finished last, because his points were spread across judges and categories.'],
    ['Picking a judge has a cost.','Ren swept Brutus but left Rosa’s Electric point unclaimed. One Electric appeal to Rosa would have won him the contest outright.'],
    ['Scouting pays off.','Mae took Rosa’s Clever point because her Insight check revealed it, then grabbed Vex’s non-damaging point in the final round.'],
    ['Racing for Voltage matters.','Garrett let Ren build Brutus’s Voltage, then stole the +3d4 for reaching 5.']
  ]
};
function cxTable(cols,rows,cls){
  return h`<div class="cxw"><table class="cxt ${cls||''}"><thead><tr>${cols.map(c=>h`<th scope="col">${c}</th>`)}</tr></thead><tbody>${rows.map(r=>h`<tr>${r.map((c,i)=>h`<td data-l="${cols[i]}"><div class="cxc">${c}</div></td>`)}</tr>`)}</tbody></table></div>`;
}
const cxMv=m=>h`${ctChip(m[1])} <b>${m[0]}</b> <span class="sub">${m[2]}</span>`;
function ctExView(){
  const X=CT_EX;
  return h`<div class="refp ctex">
    <div class="cxrule" role="note"><p class="fl">The Option B rule</p>
      <p>Each appeal is made to <b>one judge</b>. That judge’s Voltage changes, and the appeal’s Heart Points count <b>only toward that judge’s Star Point categories</b>. Categories that don’t depend on appeals (dress, stats, appearance) are judged across all contestants.</p>
      <p class="sub">Option A is the simpler version: every category counts every appeal, whichever judge it was aimed at, so choosing a judge only matters for Voltage. If your players are new to contests, run the first one with Option A to teach the basics, then switch to B.</p></div>
    <p class="sub">A worked contest, to show how Option B plays out. It uses three contestants so it is easy to follow; real contests usually have four or five. The movesets are made up for the example. Each move’s contest type and keyword come from the handbook’s list, so you can check any of them on the Contest moves page, and the dice follow the Keywords page.</p>
    <h3 class="refg">The setup</h3>
    <p><b>Contest:</b> Solaceon Town, ${ctChip('Tough')} contest. ${ctChip('Clever')} and ${ctChip('Cool')} moves get along with Tough; ${ctChip('Beauty')} and ${ctChip('Cute')} moves clash. All three judges start at 0 Voltage.</p>
    <p class="fl">Judges and their hidden Star Point categories</p>
    ${cxTable(['Judge','Star Point 1','Star Point 2','Star Point 3'],X.judges.map(j=>[h`<b>${j[0]}</b> <span class="sub">(${j[1]})</span>`].concat(j[2])))}
    <p class="fl">Contestants</p>
    ${cxTable(['Contestant','Pokémon','Moves (contest type, keyword)','Scouted beforehand'],X.cons.map(c=>[h`<b>${c[0]}</b> <span class="sub">(${c[1]})</span>`,c[2],h`<ul class="cxmv">${c[3].map(m=>h`<li>${cxMv(m)}</li>`)}</ul>`,c[4]]))}
    <p class="fl">Dice reminders</p>
    <ul class="reful">
      <li><b>Matching move:</b> a Tough move rolls +1d4 and raises the chosen judge’s Voltage by 1.</li>
      <li><b>Clashing move:</b> lowers that judge’s Voltage by 1.</li>
      <li><b>Reaching 5:</b> the appeal that takes a judge to 5 Voltage rolls +3d4, and that judge is Electrified for the rest of the contest (double Heart Points for everyone).</li>
    </ul>
    <h3 class="refg">The rounds</h3>
    <p class="sub">Brutus becomes the centre of the contest: Ren builds his Voltage for three rounds, Garrett steals the Electrified bonus in round 4, and both cash in on double points at the end.</p>
    ${X.rounds.map(r=>h`<h4 class="cxh">${r.t}</h4>
      ${cxTable(['Order','Who → Judge','Move','Dice','Heart Points','Voltage'],r.rows.map((x,i)=>[String(i+1),ctB(x[0]),cxMv(x[1]),x[2],ctB(x[3]),ctB(x[4])]),'cxr')}
      <p class="sub">${r.note}</p>`)}
    <h3 class="refg">The awards</h3>
    <p class="sub">Under Option B, each judge looks only at the appeals made to them, so Ren sweeps Brutus while Rosa’s Electric Star Point goes unclaimed.</p>
    ${X.awards.map(a=>h`<h4 class="cxh">${a[0]}</h4><p class="sub">${a[1]}</p>${cxTable(['Star Point','Winner'],a[2].map(r=>[r[0],ctB(r[1])]))}`)}
    <h3 class="refg">Final standings</h3>
    <p>Ren and Mae tie on Star Points; total Heart Points breaks the tie, so <b>Ren wins the ribbon</b>. A shared first place is also allowed.</p>
    ${cxTable(['Contestant','Star Points','Total Heart Points'],X.stand.map(r=>[r[0],String(r[1]),String(r[2])]))}
    <h3 class="refg">What this example shows</h3>
    <ul class="reful">${X.lessons.map(l=>h`<li><b>${l[0]}</b> ${l[1]}</li>`)}</ul>
  </div>`;
}

/* ----- Who can learn what (Update 37): rules per move on top of the proficiency groups -----
   learn = {v:1, base:{...}, mv:{...}}: base holds the rules that came with the data file, mv the GM's own changes (they win).
   Each rule is moveKey: {n, m:'g'|'sp'|'any'|'ty'|'gm', g:[groups], sp:[species], ty:[types]}
   g: the move joins those proficiency groups. sp: only those species (and the evolutions listed with them). any: every Pokémon.
   ty: Pokémon of those types. gm: nobody, unless the GM adds it. Kept inside meta/pta_lists, so the database rules do not change. */
S.ui.ln=S.ui.ln||{mv:'',m:'g',txt:'',msg:'',bad:false};
function lnApply(){
  if(!PX.d||!PX.lists0)return;
  PX.lists={};Object.keys(PX.lists0).forEach(g=>{PX.lists[g]=new Set(PX.lists0[g]);});
  PX.sig=new Set(PX.sig0);PX.ln=new Map();PX.lnSet=new Map();
  const ln=PTA.lists&&PTA.lists.learn;
  const eff=ln?Object.assign({},ln.base||{},ln.mv||{}):null;
  if(eff){
    Object.keys(eff).forEach(mk=>{
      const e=eff[mk];if(!e)return;
      Object.keys(PX.lists).forEach(g=>PX.lists[g].delete(mk));
      PX.sig.delete(mk);
      if(e.n&&!PX.names[mk])PX.names[mk]=e.n;
      if(e.m==='g')(e.g||[]).forEach(g=>{(PX.lists[g]=PX.lists[g]||new Set()).add(mk);});
      else{
        PX.ln.set(mk,e);
        if(e.m==='sp')PX.lnSet.set(mk,new Set((e.sp||[]).map(dexKey)));
      }
    });
  }
  pxLearnMemo.clear();
}
/* what the rule for one move is, in words and as a kind (g, sp, any, ty, gm, sig, none) */
function lnInfo(name){
  if(!PX.d)return null;
  const mk=dexKey(name),e=PX.ln&&PX.ln.get(mk);
  if(e){
    if(e.m==='any')return {k:'any',t:'Anyone can learn it'};
    if(e.m==='ty')return {k:'ty',t:'Pokémon of type '+(e.ty||[]).join(' or ')};
    if(e.m==='gm')return {k:'gm',t:'By GM decision: only the GM can add it'};
    if(e.m==='sp'){const n=(e.sp||[]).length;return {k:'sp',t:'Species list ('+n+'): '+(e.sp||[]).slice(0,8).join(', ')+(n>8?' …':'')};}
  }
  const gs=Object.keys(PX.lists).filter(g=>PX.lists[g].has(mk));
  if(gs.length)return {k:'g',g:gs,t:'Groups: '+gs.join(', ')};
  if(PX.sig.has(mk))return {k:'sig',t:'Signature move: not teachable'};
  return {k:'none',t:'Not on any list'};
}
async function lnWrite(learn){
  const L=PTA.lists;
  await S.db.collection('meta').doc('pta_lists').set({v:1,j:JSON.stringify({moves:L.moves,passives:L.passives,skills:L.skills,megas:L.megas,learn})});
  L.learn=learn;lnApply();
}
const lnSpecies=()=>{const s=new Set();(PTA.idx?PTA.idx.names:[]).forEach(n=>s.add(dexKey(String(n).replace(/\s*\(.*$/,''))));DEXA.forEach(n=>s.add(dexKey(n)));return s;};
function lnLoadMove(u){
  const L=PTA.lists,def=L&&L.moveMap.get(dexKey(u.mv));
  if(!def){u.cur=null;return;}
  const mk=dexKey(def.n),e=PX.ln&&PX.ln.get(mk),i=lnInfo(def.n);
  u.cur=def.n;
  if(e&&e.m==='sp'){u.m='sp';u.txt=(e.sp||[]).join(', ');}
  else if(e&&e.m==='ty'){u.m='ty';u.txt=(e.ty||[]).join(', ');}
  else if(e&&(e.m==='any'||e.m==='gm')){u.m=e.m;u.txt='';}
  else{u.m='g';u.txt=i&&i.g?i.g.join(', '):'';}
  u.msg='';u.bad=false;
}
function lnBody(){
  const u=S.ui.ln,i=u.cur?lnInfo(u.cur):null;
  const hint={g:'Proficiency groups, separated by commas (for example Slashing, Water). A Pokémon can learn the move if it has a proficiency in any of them.',sp:'Species names, separated by commas. Give the evolutions too: a Pokémon only gets the move if its own name is on the list.',ty:'Types, separated by commas (for example Bug). Pokémon with any of those types can learn it.',any:'Every Pokémon can learn it.',gm:'Nobody can learn it unless the GM adds it from the Moves tab.'}[u.m];
  return h`${u.cur?h`<p class="sub"><b>${u.cur}</b> now: ${i?i.t:'rules not loaded'}.</p>`:h`<p class="sub">Type a handbook move above.</p>`}
    ${u.cur?h`<div class="fgrid"><label class="fld"><span class="fl">Who can learn it</span><select data-u="ln.m">${[['g','Proficiency groups'],['sp','Species list'],['ty','Own type'],['any','Anyone'],['gm','By GM decision']].map(([v,l])=>h`<option value="${v}" ${v===u.m?raw('selected'):''}>${l}</option>`)}</select></label></div>
      ${u.m==='g'||u.m==='sp'||u.m==='ty'?h`<label class="fld wide"><span class="fl">${u.m==='g'?'Groups':u.m==='sp'?'Species':'Types'}</span><textarea rows="${u.m==='sp'?6:2}" data-u="ln.txt" data-nr>${u.txt||''}</textarea></label>`:''}
      <p class="sub">${hint}</p>
      ${u.msg?h`<p class="sub ${u.bad?'bad':'good'}" role="status">${u.msg}</p>`:''}
      <div class="row"><button class="btn sm primary" data-act="ln_save">Save</button><button class="btn sm ghost" data-act="ln_revert">Undo my change</button></div>`:''}`;
}
function lnDesk(){
  if(!PTA.idx)return '';
  pxReady();
  if(!PTA.lists)ptaLists().then(()=>scheduleRender());
  const u=S.ui.ln;
  return h`<section class="panel"><div class="ph"><h2>Who can learn each move</h2><span class="pill gm">GM only</span></div>
    <p class="sub">Every move is learnable through proficiency groups, a list of species, a type, by anyone, or only by your decision. Pick a move to see and change its rule. Changes apply to everyone at once. Importing the handbook data file again updates the defaults and keeps your changes.</p>
    ${PX.d&&PTA.lists?h`<label class="fld"><span class="fl">Move</span><input type="search" data-u="ln.mv" data-nr list="dl-moves" value="${u.mv||''}" placeholder="Move name" autocomplete="off"></label>
      <div id="lnbody">${lnBody()}</div>
      <p class="sub">Groups: ${Object.keys(PX.lists).sort().join(', ')}.</p>`:h`<p class="sub" role="status">Loading…</p>`}
  </section>`;
}
function lnRefresh(){const el=$('#lnbody');if(el)el.innerHTML=lnBody().s;}
function lnInput(key,t){
  const u=S.ui.ln;
  if(key==='mv'){lnLoadMove(u);lnRefresh();return true;}
  if(key==='m'){u.txt='';u.msg='';lnRefresh();return true;}
  return false;
}
async function lnAct(b){
  const d=b.dataset,u=S.ui.ln;
  if(!S.me.admin||!u.cur||!PTA.lists)return;
  const L=PTA.lists,learn={v:1,base:(L.learn&&L.learn.base)||{},mv:Object.assign({},(L.learn&&L.learn.mv)||{})},mk=dexKey(u.cur);
  const items=String(u.txt||'').split(/[,;\n]+/).map(x=>x.trim()).filter(Boolean);
  if(d.act==='ln_revert'){
    delete learn.mv[mk];
  }else{
    const e={n:u.cur,m:u.m};
    if(u.m==='g'){
      const known=Object.keys(PX.lists),bad=[],gs=[];
      items.forEach(x=>{const f=known.find(g=>dexKey(g)===dexKey(x));if(f)gs.push(f);else bad.push(x);});
      if(bad.length){u.msg='Not a group: '+bad.join(', ')+'.';u.bad=true;lnRefresh();return;}
      if(!gs.length){u.msg='Add at least one group, or choose another option.';u.bad=true;lnRefresh();return;}
      e.g=Array.from(new Set(gs));
    }else if(u.m==='sp'){
      const known=lnSpecies(),bad=items.filter(x=>!known.has(dexKey(String(x).replace(/\s*\(.*$/,''))));
      if(bad.length){u.msg='Not a species I know: '+bad.join(', ')+'.';u.bad=true;lnRefresh();return;}
      if(!items.length){u.msg='Add at least one species, or choose another option.';u.bad=true;lnRefresh();return;}
      e.sp=Array.from(new Set(items.map(x=>String(x).replace(/\s*\(.*$/,'').trim())));
    }else if(u.m==='ty'){
      const ts=items.map(x=>TYPES.find(t=>t.toLowerCase()===x.toLowerCase())||'');
      if(!items.length||ts.some(x=>!x)){u.msg='Use type names such as Bug or Fire.';u.bad=true;lnRefresh();return;}
      e.ty=Array.from(new Set(ts));
    }
    learn.mv[mk]=e;
  }
  try{await lnWrite(learn);}
  catch(err){u.msg='That did not save ('+((err&&err.code)||'error')+'). Try again.';u.bad=true;lnRefresh();return;}
  lnLoadMove(u);
  u.msg=d.act==='ln_revert'?'Back to the default rule.':'Saved.';u.bad=false;
  lnRefresh();toast('Saved the rule for '+u.cur+'.',true);
}

/* ----- Moves tab (Update 36): every move in the Players Handbook, with its contest entry, and an Add button ----- */
S.ui.mvx=S.ui.mvx||{q:'',type:'',kind:'',freq:'',ct:'',kw:'',grp:'',mon:'',page:1,arm:''};
const MVX_PAGE=40;
const mvxAll=()=>((PTA.lists&&PTA.lists.moves)||[]).filter(m=>m&&m.ph);
function mvxFiltered(){
  const o=S.ui.mvx,q=dexKey(o.q);
  return mvxAll().filter(m=>{
    if(q&&dexKey(m.n).indexOf(q)<0)return false;
    if(o.type&&m.t!==o.type)return false;
    if(o.kind&&m.k!==o.kind)return false;
    if(o.freq&&m.f!==o.freq)return false;
    if(o.grp){const li=lnInfo(m.n);if(!li)return false;if(o.grp.charAt(0)==='~'){if(li.k!==o.grp.slice(1))return false;}else if(!(li.k==='g'&&li.g.indexOf(o.grp)>=0))return false;}
    if(o.ct||o.kw){
      const e=ctOf(m.n);
      if(!e)return false;
      if(o.ct&&e.t!==o.ct)return false;
      if(o.kw&&e.k!==o.kw)return false;
    }
    return true;
  });
}
function mvxMons(){
  const uid=dxUid();
  if(!uid||!S.trainers[uid])return {uid:null,mons:[],can:false};
  return {uid,mons:partyOf(uid).concat(boxOf(uid)),can:canEditT(uid)};
}
function mvxCard(m,mx){
  const o=S.ui.mvx;
  const e=ctOf(m.n),kw=e?ctKw(e.k):null;
  const mon=mx.mons.find(z=>z.id===o.mon)||null;
  const known=mon&&(mon.moves||[]).some(z=>dexKey(z.name)===dexKey(m.n));
  const sty=m.k==='Style';
  const armed=o.arm===m.n;
  const li=lnInfo(m.n);
  const can=mon&&PX.d?pxCan(mon.species,mon.types,m.n):null;
  const blocked=!!(mon&&PX.d&&!can&&!known);
  const gmOk=S.me.admin;
  return h`<article class="move mvxc ${sty?'mvstyle':''}">
    <div class="mvxh"><b class="mvxn">${m.n}</b>${chipsOf([m.t])}<span class="pill ${sty?'sty':''}">${m.k}</span></div>
    <p class="sub mvxm">${m.f||''}${m.r?' · '+m.r:''}${m.d?' · Damage '+m.d:''}</p>
    ${m.x?h`<p class="mvxx">${m.x}</p>`:''}
    <p class="mvxct">${e?h`${ctChip(e.t)} <b>${e.k}</b>${kw?h` <span class="sub">${kw.hp}</span>`:''}${e.note?h` <span class="sub">${e.note}</span>`:''}${kw&&kw.fx?h`<br><span class="sub">${kw.fx}</span>`:''}`:h`<span class="sub">${CT.list?'Not on the contest list. If a tutor teaches it, it is an Appeal move.':'Contest entry not loaded.'}</span>`}</p>
    ${li?h`<p class="sub mvxl"><b>Who can learn it:</b> ${li.t}</p>`:''}
    ${mx.can?h`<div class="row"><button class="btn sm ${armed||(blocked&&gmOk)?'danger armed':''}" data-act="mvx_add" data-n="${m.n}" ${mon&&!known&&(!blocked||gmOk)?'':raw('disabled')}>${known?'Already known':!mon?'Pick a Pokémon above':blocked?(gmOk?'Add anyway (GM)':mName(mon)+' can’t learn it'):armed?'Tap again to add anyway':'Add to '+mName(mon)}</button>${mon&&PX.d&&can?h`<span class="sub good">${mName(mon)} can learn it: ${can.via.join(', ')}</span>`:''}</div>`:''}
  </article>`;
}
function mvxResults(){
  const o=S.ui.mvx,mx=mvxMons();
  const all=mvxFiltered(),shown=all.slice(0,o.page*MVX_PAGE);
  const filt=!!(o.q||o.type||o.kind||o.freq||o.ct||o.kw||o.grp);
  return h`<p class="sub" id="mvxcount" aria-live="polite">${all.length===1?'1 move':all.length+' moves'}${all.length>shown.length?' · showing '+shown.length:''}</p>
    ${all.length?h`<div class="mvxlist">${shown.map(m=>mvxCard(m,mx))}</div>`:h`<p class="sub">Nothing matches.${filt?h` <button class="btn sm" data-act="mvx_clear">Clear the filters</button>`:''}</p>`}
    ${all.length>shown.length?h`<div class="row"><button class="btn" data-act="mvx_more">Show ${Math.min(MVX_PAGE,all.length-shown.length)} more</button></div>`:''}`;
}
function mvxRefresh(){const el=$('#mvxres');if(el)el.innerHTML=mvxResults().s;}
const mvxSel=(key,label,opts,cur)=>h`<label class="fld"><span class="fl">${label}</span><select data-u="mvx.${key}">${opts.map(op=>h`<option value="${op[0]}" ${String(op[0])===String(cur)?raw('selected'):''}>${op[1]}</option>`)}</select></label>`;
function mvxTab(){
  ctWarm();pxReady();
  if(PTA.idx&&!PTA.lists)ptaLists().then(()=>scheduleRender());
  const o=S.ui.mvx,mx=mvxMons(),all=mvxAll();
  let body;
  if(!PTA.lists){
    body=PTA.idx?h`<p class="sub" role="status">Loading the moves…</p>`:h`<div class="banner">The handbook data has not been added yet. ${S.me.admin?'Open the GM Desk and import the newest pta-handbook-data.json.':'Ask your GM to import it.'}</div>`;
  }else if(!all.length){
    body=h`<div class="banner">The handbook moves are not in the data yet. ${S.me.admin?'Open the GM Desk, choose Import again under Handbook data, and pick the newest pta-handbook-data.json.':'Ask your GM to import the newest handbook data.'}</div>`;
  }else{
    if(mx.mons.length&&!mx.mons.some(z=>z.id===o.mon))o.mon='';
    body=h`${CT.list?'':h`<p class="sub">Contest entries are not loaded, so only battle details show.</p>`}
      <div class="dxf">
        <label class="fld dxq"><span class="fl">Search</span><input type="search" data-u="mvx.q" data-nr value="${o.q||''}" placeholder="Move name" autocomplete="off"></label>
        ${mvxSel('type','Type',[['','All types']].concat(TYPES.map(t=>[t,t])),o.type)}
        ${mvxSel('kind','Kind',[['','All kinds'],['Physical','Physical'],['Special','Special'],['Effect','Effect'],['Style','Style']],o.kind)}
        ${mvxSel('freq','Frequency',[['','Any frequency'],['At-Will','At-Will'],['3/day','3/day'],['1/day','1/day']],o.freq)}
        ${PX.d?mvxSel('grp','Who can learn it',[['','Any rule'],['~sp','Species list'],['~ty','Own type'],['~any','Open to every Pokémon'],['~gm','By GM decision'],['~sig','Not teachable'],['~none','Not on any list']].concat(Object.keys(PX.lists).sort().map(g=>[g,'Group: '+g])),o.grp):''}
        ${CT.list?mvxSel('ct','Contest type',[['','All contest types']].concat(CT_TYPES.concat(['Any']).map(t=>[t,t==='Any'?'Any type':t])),o.ct):''}
        ${CT.list?mvxSel('kw','Contest keyword',[['','All keywords']].concat(CT_KW.map(x=>[x.k,x.k])),o.kw):''}
      </div>
      ${mx.can&&mx.mons.length?h`<div class="dxf">${mvxSel('mon','Add moves to',[['','Pick a Pokémon']].concat(mx.mons.map(z=>[z.id,mName(z)+' ('+((z.moves||[]).length)+' moves)'])),o.mon)}</div>`:mx.can?h`<p class="sub">Add a Pokémon to your party or box to use the Add buttons.</p>`:''}
      <div id="mvxres">${mvxResults()}</div>`;
  }
  return h`<section class="panel mvxp"><div class="ph"><h2>Moves</h2>${all.length?h`<span class="pill">${all.length} moves</span>`:''}</div>
    ${S.me.admin?trainerPicker():''}
    ${body}
  </section>`;
}
function mvxInput(key,t){
  const o=S.ui.mvx;
  if(key==='q'){o.page=1;o.arm='';mvxRefresh();return true;}
  if(key==='mon'){o.arm='';return false;}
  o.page=1;o.arm='';
  return false;
}
function mvxAct(b){
  const d=b.dataset,o=S.ui.mvx;
  if(d.act==='mvx_more'){o.page++;mvxRefresh();return;}
  if(d.act==='mvx_clear'){o.q='';o.type='';o.kind='';o.freq='';o.ct='';o.kw='';o.grp='';o.page=1;o.arm='';render();return;}
  if(d.act!=='mvx_add')return;
  const mx=mvxMons();
  if(!mx.uid||!mx.can)return;
  const m=mx.mons.find(z=>z.id===o.mon);
  if(!m){toast('Pick a Pokémon first.');return;}
  const def=PTA.lists&&PTA.lists.moveMap.get(dexKey(d.n));
  if(!def)return;
  const mv=(m.moves||[]).slice();
  if(mv.some(z=>dexKey(z.name)===dexKey(def.n))){toast(mName(m)+' already knows '+def.n+'.');return;}
  if(PX.d&&!S.me.admin&&!pxCan(m.species,m.types,def.n)){toast(mName(m)+' can’t learn '+def.n+'. Ask your GM.');return;}
  const t=S.trainers[mx.uid],cap=/move tutor/i.test([t.cls,t.adv].join(' '))?8:TPL_MAX.moves;
  if(mv.length>=cap){toast(mName(m)+' already knows '+cap+' moves. Remove one on the Pokémon page first.');return;}
  if(def.k==='Style'&&styleCount(m)>=1&&!hasPassive(m,'luckycharm')&&o.arm!==def.n){
    o.arm=def.n;render();toast(mName(m)+' already has a Style move. Tap again to add this one anyway.');return;
  }
  mv.push({name:def.n,freq:def.f||'At-Will',kind:def.k||'Physical',range:def.r||'',type:def.t||'Normal',dice:def.d||'',text:def.x||'',used:0});
  edit('p',mx.uid+'/'+m.id,'moves',mv);
  o.arm='';
  toast(mName(m)+' learned '+def.n+'.',true);render();
}

function ctTab(){
  ctWarm();
  const o=S.ui.ct;
  if(!CT_VIEWS.some(v=>v[0]===o.v))o.v='moves';
  const body=o.v==='keys'?ctKeysView():o.v==='help'?ctHelpView():o.v==='how'?ctHowView():o.v==='ex'?ctExView():o.v==='rib'?ribView():ctMovesView();
  return h`<section class="panel ctp"><div class="ph"><h2>Contests</h2>${CT.list?h`<span class="pill">${CT.list.length} moves</span>`:''}</div>
    <div class="seg" role="group" aria-label="Contest pages">${CT_VIEWS.map(([k,l])=>h`<button data-act="ct_view" data-v="${k}" aria-pressed="${String(o.v===k)}">${l}</button>`)}</div>
    <div class="ctbody">${body}</div>
  </section>`;
}

/* typing and choosing in the contest page's boxes. Returns true when it redrew by itself. */
function ctInput(key,t){
  const o=S.ui.ct;
  if(key==='q'){o.page=1;ctRefresh();return true;}
  if(key==='mv'){o.mvt=ctOwnType(o.mv);o.res=null;o.stat='0';ctHelpRefresh();return true;}
  if(key==='monsel'){o.mon=t.value||'';o.stat='0';}
  if(key==='mvsel'){
    const v=String(t.value||''),i=v.indexOf('|');
    if(i>0){o.mon=v.slice(0,i);o.mv=v.slice(i+1);o.mvt=ctOwnType(o.mv);o.stat='0';}
  }
  if(key==='type'||key==='kw'||key==='show')o.page=1;
  o.res=null;
  return false;
}
function ctAct(b){
  const d=b.dataset,o=S.ui.ct;
  switch(d.act){
    case 'ct_view':o.v=d.v;render();break;
    case 'ct_more':o.page++;ctRefresh();break;
    case 'ct_clear':o.q='';o.type='';o.kw='';o.show='all';o.page=1;render();break;
    case 'ct_kw':o.kw=d.k;o.q='';o.type='';o.show='all';o.page=1;o.v='moves';S.ui.toTop=true;render();break;
    case 'ct_use':
      o.mv=d.name||'';o.mvt=d.ct||ctOwnType(d.name);o.res=null;o.v='help';o.stat='0';
      if(d.pid)o.mon=d.pid;
      if(S.tab!=='contest'){setTab('contest');}else{S.ui.toTop=true;render();}
      break;
    case 'ct_restore':o.spent={};o.stat='0';o.res=null;render();break;
    case 'ct_reset':
      Object.assign(o,{ctype:'',volt:'0',elec:false,first:false,last:false,fin:false,low:false,both:false,maxed:false,before:'0',alone:false,allBig:false,lastHp:'2d4',ready:false,same:false,stat:'0',res:null});
      render();break;
    case 'ct_roll':{
      const p=ctPickInfo();
      if(!p.name||!p.type)return;
      const av=ctAvail();
      const c=ctCalc(ctState());
      const r=ctDo(c);
      const det=ctDetail(c,r)+(av&&c.stat?' ('+av.mon.name+'’s '+av.t+', '+(av.left-c.stat)+' left)':'');
      o.res={name:p.name,total:r.total,detail:det};
      logRoll(chkEntry('Appeal: '+p.name+(av?' ('+av.mon.name+')':''),r.total,det));
      if(av&&c.stat>0){
        o.spent=o.spent||{};
        const sp=o.spent[av.mon.id]=o.spent[av.mon.id]||{};
        sp[av.t]=num(sp[av.t])+c.stat;
        o.stat='0';
      }
      render();
      break;}
    default:break;
  }
}

/* ---------- Today: time of day, weather, season, moon, tide and festival week ----------
   One shared set of conditions for the whole party, kept in meta/conditions (everyone can read it, only the GM can change it).
   Every player sees it as a strip under the title, and the screen shows it: sun, rain, snow, fog, storm, night sky and so on.
   Each viewer can switch the screen effects off. The GM's wild encounter tables read the same conditions. */
S.ui.cd=S.ui.cd||{open:false};
const CD_T=[['dawn','Dawn'],['day','Day'],['dusk','Dusk'],['night','Night']];
const CD_X=[['clear','Clear'],['cloudy','Cloudy'],['rain','Rain'],['storm','Storm'],['fog','Fog'],['snow','Snow'],['blizzard','Blizzard'],['windy','Windy']];
const CD_S=[['spring','Spring'],['summer','Summer'],['autumn','Autumn'],['winter','Winter']];
const CD_M=[['new','New moon'],['waxing','Waxing'],['full','Full moon'],['waning','Waning']];
const CD_D=[['high','High tide'],['low','Low tide']];
const CD_LAB={};[CD_T,CD_X,CD_S,CD_M,CD_D].forEach(g=>g.forEach(p=>{CD_LAB[p[0]]=p[1];}));
/* how likely each kind of weather is in each season (Sinnoh is cool and wet, with a long snowy winter in the north) */
const CD_ODDS={
  spring:{clear:30,cloudy:20,rain:28,storm:6,fog:8,windy:8},
  summer:{clear:45,cloudy:15,rain:15,storm:12,fog:5,windy:8},
  autumn:{clear:25,cloudy:25,rain:22,storm:6,fog:14,windy:8},
  winter:{clear:18,cloudy:18,snow:30,blizzard:8,fog:10,rain:8,windy:8}
};
function cdSeasonNow(){const m=new Date().getMonth();return m<2||m===11?'winter':m<5?'spring':m<8?'summer':'autumn';}
const cdOk=(list,v)=>list.some(p=>p[0]===v);
function cdGet(){
  const c=S.cond||{};
  return {
    t:cdOk(CD_T,c.t)?c.t:'day',
    x:cdOk(CD_X,c.x)?c.x:'clear',
    s:cdOk(CD_S,c.s)?c.s:cdSeasonNow(),
    m:cdOk(CD_M,c.m)?c.m:'waxing',
    d:cdOk(CD_D,c.d)?c.d:'high',
    f:c.f===true
  };
}
const cdSig=()=>{const c=cdGet();return [c.t,c.x,c.s,c.m,c.d,c.f?1:0].join('|');};
function cdText(){
  const c=cdGet();
  const bits=[CD_LAB[c.t],CD_LAB[c.x],CD_LAB[c.s]];
  if(c.t==='night')bits.push(CD_LAB[c.m]);
  if(c.d==='low')bits.push('Low tide');
  if(c.f)bits.push('Festival week');
  return bits.join(', ');
}

/* ----- icons ----- */
const CDI_CLOUD='<path d="M7 18a4 4 0 0 1-.6-7.96A6 6 0 0 1 18 9.5 4.3 4.3 0 0 1 17.5 18z"/>';
const CDI={
  dawn:'<path d="M3 19h18M7 19a5 5 0 0 1 10 0M12 4v5M9.5 6.5L12 4l2.5 2.5M4.6 10.6l1.4 1.4M19.4 10.6L18 12"/>',
  day:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8"/>',
  dusk:'<path d="M3 19h18M7 19a5 5 0 0 1 10 0M12 4v5M9.5 6.5L12 9l2.5-2.5M4.6 10.6l1.4 1.4M19.4 10.6L18 12"/>',
  night:'<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>',
  clear:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8"/>',
  cloudy:CDI_CLOUD,
  rain:'<g transform="translate(0 -3)">'+CDI_CLOUD+'</g><path d="M8 19l-1 3M12 19l-1 3M16 19l-1 3"/>',
  storm:'<g transform="translate(0 -3)">'+CDI_CLOUD+'</g><path d="M12.5 15l-2.5 4h4l-2.5 4"/>',
  fog:'<path d="M3 7h13M6 11h15M3 15h13M8 19h11"/>',
  snow:'<path d="M12 3v18M4.2 7.5l15.6 9M19.8 7.5l-15.6 9M9.5 4.5L12 7l2.5-2.5M9.5 19.5L12 17l2.5 2.5"/>',
  blizzard:'<path d="M12 3v18M4.2 7.5l15.6 9M19.8 7.5l-15.6 9"/><path d="M2 5h5M17 20h5" />',
  windy:'<path d="M3 9h10a3 3 0 1 0-3-3M3 14h14a3 3 0 1 1-3 3M3 19h6"/>',
  spring:'<path d="M12 21V12M12 12c0-4 3-6.5 7.5-6.5 0 4.5-3 6.5-7.5 6.5zM12 16c0-3-2.2-5-6-5 0 3 2.2 5 6 5z"/>',
  summer:'<circle cx="12" cy="12" r="3.5"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6L7 7M17 17l1.4 1.4M5.6 18.4L7 17M17 7l1.4-1.4"/>',
  autumn:'<path d="M5 19C5 10 10 5 20 5c0 10-5 15-13 15M5 19L14 10"/>',
  winter:'<path d="M12 3v18M4.2 7.5l15.6 9M19.8 7.5l-15.6 9"/>',
  moon:'<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>',
  tide:'<path d="M3 9c3 0 3 2 6 2s3-2 6-2 3 2 6 2M3 15c3 0 3 2 6 2s3-2 6-2 3 2 6 2"/>',
  festival:'<path d="M12 3l2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.4 6.6 19.5l1.2-6-4.5-4.2 6.1-.7z"/>',
  cal:'<rect x="3.5" y="5" width="17" height="15" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
  fx:'<path d="M5 15a4 4 0 0 1-.4-8A6 6 0 0 1 16 8a3.6 3.6 0 0 1 .4 7.2M9 18l-.8 2.5M13 18l-.8 2.5"/>'
};
const cdIcon=k=>raw('<svg class="cdi" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">'+(CDI[k]||'')+'</svg>');

/* ----- the strip under the title ----- */
function cdChip(kind,label,icon){return h`<span class="td-chip" data-kind="${kind}">${cdIcon(icon||kind)}<b>${label}</b></span>`;}
function cdSeg(label,key,list,cur){
  return h`<div class="td-grp"><span class="fl">${label}</span><div class="seg" role="group" aria-label="${label}">${list.map(p=>h`<button data-act="cd_set" data-k="${key}" data-v="${p[0]}" aria-pressed="${String(cur===p[0])}">${p[1]}</button>`)}</div></div>`;
}
function todayHtml(){
  if(S.noDb||!S.ready)return '';
  const c=cdGet(),adm=!!S.me.admin,open=adm&&S.ui.cd.open,fxOn=wxOn();
  return h`<section class="today" aria-label="Today in Sinnoh">
    <div class="td-row">
      <div class="td-chips" role="status" aria-live="polite" aria-label="Conditions now: ${cdText()}">
        ${clToday()?h`<button class="td-chip tdcal" data-act="tab" data-tab="cal" title="Open the calendar">${cdIcon('cal')}<b>${clNice(clToday())}</b></button>`:''}${cdChip('t',CD_LAB[c.t],c.t)}${cdChip('x',CD_LAB[c.x],c.x)}${cdChip('s',CD_LAB[c.s],c.s)}${c.t==='night'?cdChip('m',CD_LAB[c.m],'moon'):''}${c.d==='low'?cdChip('d','Low tide','tide'):''}${c.f?cdChip('f','Festival week','festival'):''}
      </div>
      <div class="td-acts">
        <button class="btn sm ghost" data-act="cd_fx" aria-pressed="${String(fxOn)}" title="Show weather and light effects on the screen">${cdIcon('fx')} Effects: ${fxOn?'on':'off'}</button>
        ${adm?h`<button class="btn sm" data-act="cd_edit" aria-expanded="${String(open)}">${open?'Done':'Change'}</button>`:''}
      </div>
    </div>
    ${open?h`<div class="td-edit">
      ${cdSeg('Time of day','t',CD_T,c.t)}${cdSeg('Weather','x',CD_X,c.x)}${cdSeg('Season','s',CD_S,c.s)}${cdSeg('Moon','m',CD_M,c.m)}${cdSeg('Tide','d',CD_D,c.d)}
      <div class="td-grp"><span class="fl">Quick</span><div class="row">${clToday()?h`<button class="btn sm" data-act="cl_next">Next day</button>`:''}<button class="btn sm" data-act="cd_adv">Next time of day</button><button class="btn sm" data-act="cd_roll">Roll the weather</button><button class="btn sm" data-act="cd_fest" aria-pressed="${String(c.f)}">Festival week: ${c.f?'on':'off'}</button></div></div>
      <p class="sub">Everyone sees this strip and the weather on their screen. Your wild encounter tables use it too, so a rainy night gives different odds than a clear morning.</p>
    </div>`:''}
  </section>`;
}
function renderToday(){
  const el=$('#today');
  if(!el)return;
  const html=todayHtml();
  const s=html===''?'':html.s;
  if(el.dataset.sig===s)return;
  el.dataset.sig=s;
  el.innerHTML=s;
}
function cdWeatherRoll(season){
  const odds=CD_ODDS[season]||CD_ODDS.spring;
  const keys=Object.keys(odds);
  let r=Math.random()*keys.reduce((a,k)=>a+odds[k],0);
  for(const k of keys){if(r<odds[k])return k;r-=odds[k];}
  return 'clear';
}
function cdAct(b){
  if(!S.me.admin&&b.dataset.act!=='cd_fx')return;
  const d=b.dataset;
  switch(d.act){
    case 'cd_fx':wxSetOn(!wxOn());wxSync(true);renderToday();break;
    case 'cd_edit':S.ui.cd.open=!S.ui.cd.open;renderToday();break;
    case 'cd_set':{
      const lists={t:CD_T,x:CD_X,s:CD_S,m:CD_M,d:CD_D};
      if(lists[d.k]&&cdOk(lists[d.k],d.v)){edit('cd','conditions',d.k,d.v);}
      cdChanged();break;}
    case 'cd_adv':{
      const order=CD_T.map(p=>p[0]),cur=cdGet().t;
      edit('cd','conditions','t',order[(order.indexOf(cur)+1)%order.length]);
      cdChanged();break;}
    case 'cd_roll':{
      const c=cdGet();
      edit('cd','conditions','x',cdWeatherRoll(c.s));
      cdChanged();break;}
    case 'cd_fest':edit('cd','conditions','f',!cdGet().f);cdChanged();break;
    default:break;
  }
}
function cdChanged(){
  /* the doc was edited locally; show it at once, then let the rest of the page catch up */
  renderToday();wxSync();
  if(S.tab==='place'||S.tab==='battle')scheduleRender();
}

/* ---------- the screen: tint, sun, stars, moon, rain, snow, fog, wind and lightning ----------
   Everything sits above the page, ignores clicks, and stops when the tab is hidden. With "reduce motion" on, the picture is drawn once and does not move. */
const WX={root:null,cv:null,cx:null,raf:0,last:0,sig:'',W:0,H:0,dpr:1,parts:[],stars:[],blobs:[],flash:0,nextFlash:0,kind:'',c:null,reduced:false};
function wxOn(){try{return localStorage.getItem('stl.fx')!=='off';}catch(e){return true;}}
function wxSetOn(v){try{localStorage.setItem('stl.fx',v?'on':'off');}catch(e){}}
function wxReduce(){try{return !!(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches);}catch(e){return false;}}
function wxInit(){
  if(WX.root)return true;
  if(!document.body)return false;
  const r=document.createElement('div');
  r.id='wxfx';r.className='wxfx';r.setAttribute('aria-hidden','true');
  r.innerHTML='<div class="wxtint"></div><div class="wxsun"></div><canvas class="wxcv"></canvas>';
  document.body.appendChild(r);
  WX.root=r;WX.cv=r.querySelector('canvas');
  try{WX.cx=WX.cv.getContext('2d');}catch(e){WX.cx=null;}
  window.addEventListener('resize',()=>{WX.sig='';wxSync(true);});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)wxStop();else wxSync(true);});
  return true;
}
function wxStop(){if(WX.raf){cancelAnimationFrame(WX.raf);WX.raf=0;}}
function wxSize(){
  const dpr=Math.min(window.devicePixelRatio||1,1.5);
  WX.dpr=dpr;WX.W=window.innerWidth||800;WX.H=window.innerHeight||600;
  WX.cv.width=Math.round(WX.W*dpr);WX.cv.height=Math.round(WX.H*dpr);
  WX.cv.style.width=WX.W+'px';WX.cv.style.height=WX.H+'px';
  if(WX.cx)WX.cx.setTransform(dpr,0,0,dpr,0,0);
}
const rr=(a,b)=>a+Math.random()*(b-a);
function wxBuild(c){
  const area=WX.W*WX.H,x=c.x;
  WX.parts=[];WX.stars=[];WX.blobs=[];
  const mk=(n,f)=>{for(let i=0;i<n;i++)WX.parts.push(f());};
  if(x==='rain'||x==='storm'){
    const heavy=x==='storm';
    mk(clamp(Math.round(area/(heavy?5200:8200)),70,heavy?330:230),()=>({x:rr(-60,WX.W+60),y:rr(0,WX.H),l:rr(11,heavy?26:20),v:rr(heavy?820:640,heavy?1150:900),a:rr(.22,.5)}));
  }else if(x==='snow'){
    mk(clamp(Math.round(area/11000),45,170),()=>({x:rr(0,WX.W),y:rr(0,WX.H),r:rr(1,3),v:rr(35,85),ph:rr(0,6.28),a:rr(.55,.95)}));
  }else if(x==='blizzard'){
    mk(clamp(Math.round(area/4400),130,360),()=>({x:rr(0,WX.W),y:rr(0,WX.H),r:rr(.9,2.4),v:rr(150,280),vx:rr(-520,-330),a:rr(.6,.95)}));
  }else if(x==='windy'){
    mk(26,()=>({x:rr(0,WX.W),y:rr(0,WX.H),l:rr(18,40),v:rr(520,820),vy:rr(30,90),a:rr(.25,.5),h:Math.random()<.5?1:0}));
  }
  if(x==='fog'||x==='cloudy'){
    const n=x==='fog'?6:4;
    for(let i=0;i<n;i++)WX.blobs.push({x:rr(0,WX.W),y:rr(WX.H*.15,WX.H*.95),r:rr(.3,.55)*Math.max(WX.W,WX.H*1.2),v:rr(5,15)*(Math.random()<.5?-1:1),a:x==='fog'?rr(.1,.17):rr(.05,.09)});
  }
  if(c.t==='night'){
    const n=(x==='clear'||x==='windy')?clamp(Math.round(area/9000),50,160):x==='cloudy'?clamp(Math.round(area/26000),12,50):0;
    for(let i=0;i<n;i++)WX.stars.push({x:rr(0,WX.W),y:rr(0,WX.H*.8),r:rr(.4,1.5),ph:rr(0,6.28),a:rr(.35,.95)});
  }
}
function wxMoon(cx,c){
  if(c.t!=='night'||c.x==='storm'||c.x==='blizzard'||c.x==='fog'||c.x==='rain'||c.x==='snow')return;
  const x=WX.W<640?54:86,y=WX.H<500?60:92,R=WX.W<640?15:22,ph=c.m;
  cx.save();
  cx.globalAlpha=c.x==='cloudy'?.5:.9;
  const glow=cx.createRadialGradient(x,y,R*.6,x,y,R*3.2);
  glow.addColorStop(0,ph==='new'?'rgba(150,170,230,.05)':'rgba(220,230,255,.28)');glow.addColorStop(1,'rgba(220,230,255,0)');
  cx.fillStyle=glow;cx.beginPath();cx.arc(x,y,R*3.2,0,6.283);cx.fill();
  if(ph==='full'){
    cx.fillStyle='#F3F1DC';cx.beginPath();cx.arc(x,y,R,0,6.283);cx.fill();
    cx.fillStyle='rgba(180,176,150,.35)';[[-.3,-.2,.22],[.25,.15,.17],[-.05,.38,.12]].forEach(k=>{cx.beginPath();cx.arc(x+k[0]*R,y+k[1]*R,k[2]*R,0,6.283);cx.fill();});
  }else if(ph==='new'){
    cx.strokeStyle='rgba(190,205,245,.55)';cx.lineWidth=1.4;cx.beginPath();cx.arc(x,y,R,0,6.283);cx.stroke();
    cx.fillStyle='rgba(20,28,64,.55)';cx.beginPath();cx.arc(x,y,R-1,0,6.283);cx.fill();
  }else{
    /* a crescent: the lit side is on the right while the moon grows, on the left while it shrinks */
    const dir=ph==='waxing'?1:-1;
    cx.save();
    cx.beginPath();cx.arc(x,y,R,0,6.283);cx.clip();
    cx.fillStyle='#F3F1DC';
    cx.beginPath();cx.rect(x-R,y-R,R*2,R*2);
    cx.moveTo(x-dir*R*.55+R*.95,y);cx.arc(x-dir*R*.55,y,R*.95,0,6.283);
    cx.fill('evenodd');
    cx.restore();
  }
  cx.restore();
}
function wxDraw(dt,ts){
  const cx=WX.cx,c=WX.c;
  if(!cx||!c)return;
  cx.clearRect(0,0,WX.W,WX.H);
  /* stars */
  if(WX.stars.length){
    WX.stars.forEach(s=>{
      const tw=WX.reduced?1:.65+.35*Math.sin(ts/900+s.ph);
      cx.globalAlpha=s.a*tw;cx.fillStyle='#EEF2FF';cx.beginPath();cx.arc(s.x,s.y,s.r,0,6.283);cx.fill();
    });
    cx.globalAlpha=1;
  }
  wxMoon(cx,c);
  /* fog and cloud banks */
  if(WX.blobs.length){
    const night=c.t==='night',col=night?'150,165,205':c.x==='cloudy'?'135,145,165':'236,240,246';
    WX.blobs.forEach(b=>{
      b.x+=b.v*dt;
      if(b.v>0&&b.x-b.r>WX.W)b.x=-b.r;else if(b.v<0&&b.x+b.r<0)b.x=WX.W+b.r;
      const g=cx.createRadialGradient(b.x,b.y,b.r*.1,b.x,b.y,b.r);
      g.addColorStop(0,'rgba('+col+','+b.a+')');g.addColorStop(1,'rgba('+col+',0)');
      cx.fillStyle=g;cx.fillRect(b.x-b.r,b.y-b.r,b.r*2,b.r*2);
    });
  }
  /* rain and storm */
  if(c.x==='rain'||c.x==='storm'){
    const slant=c.x==='storm'?.32:.14;
    cx.lineWidth=c.x==='storm'?1.5:1.2;cx.lineCap='round';
    WX.parts.forEach(p=>{
      p.y+=p.v*dt;p.x-=p.v*slant*dt;
      if(p.y>WX.H+30){p.y=-p.l-rr(0,60);p.x=rr(-40,WX.W+90);}
      if(p.x<-60)p.x+=WX.W+120;
      cx.strokeStyle='rgba('+(c.t==='night'?'170,190,235':'120,150,205')+','+p.a+')';
      cx.beginPath();cx.moveTo(p.x,p.y);cx.lineTo(p.x+p.l*slant,p.y-p.l);cx.stroke();
    });
    if(c.x==='storm'&&!WX.reduced){
      if(ts>WX.nextFlash){WX.flash=1;WX.nextFlash=ts+rr(4200,10500);}
      if(WX.flash>0){cx.fillStyle='rgba(235,240,255,'+(WX.flash*.42)+')';cx.fillRect(0,0,WX.W,WX.H);WX.flash=Math.max(0,WX.flash-dt*3.4);}
    }
  }
  /* snow */
  if(c.x==='snow'){
    cx.fillStyle='#fff';
    WX.parts.forEach(p=>{
      p.y+=p.v*dt;p.ph+=dt*1.4;p.x+=Math.sin(p.ph)*18*dt;
      if(p.y>WX.H+6){p.y=-6;p.x=rr(0,WX.W);}
      cx.globalAlpha=p.a;cx.beginPath();cx.arc(p.x,p.y,p.r,0,6.283);cx.fill();
    });
    cx.globalAlpha=1;
  }
  if(c.x==='blizzard'){
    cx.fillStyle='#fff';
    WX.parts.forEach(p=>{
      p.y+=p.v*dt;p.x+=p.vx*dt;
      if(p.x<-8){p.x=WX.W+8;p.y=rr(0,WX.H);}
      if(p.y>WX.H+6){p.y=-6;}
      cx.globalAlpha=p.a;cx.beginPath();cx.arc(p.x,p.y,p.r,0,6.283);cx.fill();
    });
    cx.globalAlpha=1;
  }
  /* wind: leaves in autumn, loose petals and blades otherwise */
  if(c.x==='windy'){
    const col=c.s==='autumn'?'196,120,52':c.s==='spring'?'244,176,196':c.s==='winter'?'225,235,245':'170,200,140';
    cx.lineWidth=2.2;cx.lineCap='round';
    WX.parts.forEach(p=>{
      p.x+=p.v*dt;p.y+=p.vy*dt+Math.sin(ts/400+p.x*.01)*.6;
      if(p.x>WX.W+50){p.x=-50;p.y=rr(0,WX.H);}
      if(p.y>WX.H+20)p.y=-20;
      cx.strokeStyle='rgba('+col+','+p.a+')';
      cx.beginPath();cx.moveTo(p.x,p.y);cx.lineTo(p.x-p.l,p.y-(p.h?3:1));cx.stroke();
    });
  }
}
function wxLoop(ts){
  WX.raf=0;
  if(document.hidden||!WX.root||WX.root.hidden)return;
  const dt=Math.min(.06,Math.max(0,(ts-WX.last)/1000));
  if(ts-WX.last>=WX.gap){WX.last=ts;wxDraw(dt,ts);}
  WX.raf=requestAnimationFrame(wxLoop);
}
/* bring the screen in line with the conditions (cheap when nothing changed) */
function wxSync(force){
  if(!wxInit())return;
  const on=wxOn()&&!S.noDb;
  WX.root.hidden=!on;
  if(!on){wxStop();WX.sig='';return;}
  const red=wxReduce();
  const sig=cdSig()+'|'+red+'|'+(window.innerWidth||0)+'x'+(window.innerHeight||0);
  if(!force&&sig===WX.sig)return;
  WX.sig=sig;WX.reduced=red;
  const c=cdGet();WX.c=c;
  const r=WX.root;
  r.dataset.t=c.t;r.dataset.x=c.x;r.dataset.s=c.s;
  wxStop();
  wxSize();wxBuild(c);
  WX.nextFlash=performance.now()+rr(2500,6000);
  if(!WX.cx)return;
  /* a clear day or a still sky has nothing that moves: draw it once and leave the screen alone */
  const moving=WX.parts.length||WX.blobs.length;
  WX.gap=moving?30:90;
  if(red||!(moving||WX.stars.length)){wxDraw(0,0);return;}
  WX.last=0;WX.raf=requestAnimationFrame(wxLoop);
}
/* ---------- Wild encounters ----------
   A place's GM page can hold a table of the Pokémon that turn up there. The table is kept in the same document as the place's GM notes
   (gm/place_<id>), which only the GM can read, so the players never receive it and nothing here needs a new database rule.
   The odds you see are the odds right now: they follow the shared Today bar (time of day, weather, season, moon, tide, festival week)
   plus the situations the GM switches on by hand (a zone, a flag, a ferry day). Rolling gives a single encounter, a horde sized by the
   place's Danger, a same-species swarm, or a catch while fishing. Some groups have an alpha. Every Pokémon carries the PTA book's
   rarity (for the GM) and a realistic local rarity worked out from its odds right now. */
S.ui.enc=Object.assign({res:{},pick:'',z:{},ed:{},tb:{},mo:{},np:'',df:'',imp:{mode:'add'},wo:{}},S.ui.enc||{});
const ENC_MAX=60;
const ENC_OOR='Out-of-region';
TPL.enc=()=>({sp:'',w:10,lo:1,hi:1,bk:'U'});
const ENC_BK={C:['●','Common'],U:['◆','Uncommon'],R:['★','Rare'],L:['✦','Legendary']};
/* the players whose wishes are tracked. Each has a level on a row (wl, wl2: 1 interested, 2 really wants, 3 wants an alpha), a name on the place's GM page (wln, wln2) and, if you like, a reason (wr, wr2) */
const ENC_WISH=[{l:'wl',n:'wln',r:'wr',d:'A player'},{l:'wl2',n:'wln2',r:'wr2',d:'A second player'}];
const encWishOf=(o,gp)=>{
  const out=[];
  ENC_WISH.forEach((w,i)=>{const lv=Math.round(Number(o&&o[w.l]))||0;if(lv>0)out.push({i,lv:Math.min(3,lv),who:String((gp&&gp[w.n])||w.d),why:String((o&&o[w.r])||'')});});
  return out;
};
const ENC_DIFF=[['easy','Easy',[0,1],'0–1 basic Pokémon per player'],['normal','Normal',[1,2],'1–2 basic or once-evolved per player'],['hard','Hard',[2,3],'2–3 per player, mostly evolved'],['danger','Dangerous',[3,4],'3–4 fully evolved per player']];
const ENC_DG={1:'easy',2:'easy',3:'normal',4:'hard',5:'danger'};
const ENC_HORDE_MAX=12;
const ENC_LEVELS=[['1','Interested'],['2','Really wants'],['3','Wants an alpha']];

