'use strict';
/* Sinnoh Trainer Log · 03-rolls. The files in js/ are classic scripts that share one scope: load them in order (see index.html). */
/* ---------- Rolls: type chart, combat stages, attack rolls and the table's shared roll log ----------
   The rules come from the PTA 3.5 Players Handbook (Making an Accuracy Check, Calculating Damage, Stat Ups and Downs).
   Accuracy:  1d20 + the attacker's stat modifier, against the target's Defense, Sp. Defense or Speed (Effect moves).
   Damage:    the move's dice, +1 die per step of type advantage, -1 per step of resistance, +1 per Attack stage up and per
              Defense stage down (the reverse for stages the other way), then the stat modifier and +4 for a same-type move.
              A natural 20 on the accuracy roll is a critical hit: every die counts as its highest face. */
S.ui.mr=S.ui.mr||{};

/* the book's type chart: "+" super effective, "-" resisted, "0" no effect. One line per attacking type. */
const TCH_SRC={
  Bug:'+Dark,Grass,Psychic|-Fairy,Fighting,Fire,Flying,Ghost,Poison,Steel|',
  Dark:'+Ghost,Psychic|-Dark,Fairy,Fighting|',
  Dragon:'+Dragon|-Steel|Fairy',
  Electric:'+Flying,Water|-Dragon,Electric,Grass|Ground',
  Fairy:'+Dark,Dragon,Fighting|-Fire,Poison,Steel|',
  Fighting:'+Dark,Ice,Normal,Rock,Steel|-Bug,Fairy,Flying,Poison,Psychic|Ghost',
  Fire:'+Bug,Grass,Ice,Steel|-Dragon,Fire,Rock,Water|',
  Flying:'+Bug,Fighting,Grass|-Electric,Rock,Steel|',
  Ghost:'+Ghost,Psychic|-Dark|Normal',
  Grass:'+Ground,Rock,Water|-Bug,Dragon,Fire,Flying,Grass,Poison,Steel|',
  Ground:'+Electric,Fire,Poison,Rock,Steel|-Bug,Grass|Flying',
  Ice:'+Dragon,Flying,Grass,Ground|-Fire,Ice,Steel,Water|',
  Normal:'|-Rock,Steel|Ghost',
  Poison:'+Fairy,Grass|-Ghost,Ground,Poison,Rock|Steel',
  Psychic:'+Fighting,Poison|-Psychic,Steel|Dark',
  Rock:'+Bug,Fire,Flying,Ice|-Fighting,Ground,Steel|',
  Steel:'+Fairy,Ice,Rock|-Electric,Fire,Steel,Water|',
  Water:'+Fire,Ground,Rock|-Dragon,Grass,Water|'
};
const TCH={};
Object.keys(TCH_SRC).forEach(a=>{
  const parts=TCH_SRC[a].split('|'),o={};
  (parts[0]||'').replace(/^\+/,'').split(',').filter(Boolean).forEach(t=>{o[t]=1;});
  (parts[1]||'').replace(/^-/,'').split(',').filter(Boolean).forEach(t=>{o[t]=-1;});
  (parts[2]||'').split(',').filter(Boolean).forEach(t=>{o[t]='i';});
  TCH[a]=o;
});
/* how a move of one type lands on a target of one or two types: c is a code, d is the number of dice added or removed */
function effOf(mvType,types){
  const row=TCH[mvType];
  const ts=(types||[]).filter(Boolean);
  if(!row||!ts.length)return {c:'n',d:0};
  let d=0;
  for(let i=0;i<ts.length;i++){
    const v=row[ts[i]];
    if(v==='i')return {c:'i',d:0};
    d+=v||0;
  }
  d=clamp(d,-2,2);
  return {c:['h','r','n','s','x'][d+2],d};
}
const EFF_CODES={n:{c:'n',d:0},s:{c:'s',d:1},x:{c:'x',d:2},r:{c:'r',d:-1},h:{c:'h',d:-2},i:{c:'i',d:0}};
const EFF_LBL={n:'Neutral',s:'Super effective',x:'Extremely effective',r:'Resisted',h:'Shielded',i:'No effect'};
const EFF_PICK=[['auto','Automatic'],['n','Neutral'],['s','Super effective (+1 die)'],['x','Extremely effective (+2 dice)'],['r','Resisted (−1 die)'],['h','Shielded (−2 dice)'],['i','No effect']];

/* ----- combat stages: -3 to +3 per stat, shown as ▲ and ▼ ----- */
const STG_MAX=3;
const stg=(o,k)=>clamp(Math.round(num(o&&o.stages&&o.stages[k])),-STG_MAX,STG_MAX);
const stgTxt=n=>n>0?'▲'.repeat(n):n<0?'▼'.repeat(-n):'–';
/* Speed ▲ and ▼ move the Speed stat itself, by 5 for each step */
const spdOf=m=>effStat(m,'spe')+5*stg(m,'spe');
const stgPills=o=>STATS.filter(s=>stg(o,s[0])).map(s=>h`<span class="pill stg ${stg(o,s[0])>0?'up':'dn'}">${s[2]}${stgTxt(stg(o,s[0]))}</span>`);
/* the five steppers. sc/id/path say where the stages are stored: a Pokémon's own sheet or a foe's secret sheet. */
function stagePanel(sc,id,path,o,ro,cid){
  return h`<div class="stgrow" role="group" aria-label="Combat stages">${STATS.map(s=>{
    const v=stg(o,s[0]);
    return h`<div class="stg ${v>0?'up':v<0?'dn':''}"><span class="sl">${s[2]}</span>
      ${ro?'':h`<button class="btn sm ghost" data-act="b_stg" data-sc="${sc}" data-id="${id}" data-path="${path}" data-k="${s[0]}" data-d="-1" data-cid="${cid||''}" aria-label="Lower ${s[1]} stage" ${v<=-STG_MAX?raw('disabled'):''}>−</button>`}
      <b class="sv" aria-label="${s[1]} stage ${v}">${stgTxt(v)}</b>
      ${ro?'':h`<button class="btn sm ghost" data-act="b_stg" data-sc="${sc}" data-id="${id}" data-path="${path}" data-k="${s[0]}" data-d="1" data-cid="${cid||''}" aria-label="Raise ${s[1]} stage" ${v>=STG_MAX?raw('disabled'):''}>+</button>`}</div>`;
  })}</div>`;
}

/* ----- afflictions ----- */
const AFFL=['Bound','Burned','Confused','Dazed','Disabled','Drowsy','Entranced','Frostbitten','Paralyzed','Poisoned','Toxified'];
const afflList=s=>String(s||'').split(/\s*[,;/]\s*/).map(x=>x.trim()).filter(Boolean);
const afflHas=(s,a)=>afflList(s).some(x=>dexKey(x)===dexKey(a));
const afflToggle=(s,a)=>{
  const l=afflList(s);
  return (afflHas(s,a)?l.filter(x=>dexKey(x)!==dexKey(a)):l.concat([a])).join(', ');
};
function afflChips(sc,id,path,cur,ro,cid){
  return h`<div class="row evchips" role="group" aria-label="Status">${AFFL.map(a=>h`<button class="btn sm chk" data-act="b_aff" data-sc="${sc}" data-id="${id}" data-path="${path}" data-a="${a}" data-cid="${cid||''}" aria-pressed="${String(afflHas(cur,a))}" ${dis(ro)}>${a}</button>`)}</div>`;
}

/* ----- dice ----- */
const rnd=n=>1+Math.floor(Math.random()*n);
function parseDice(s){
  const m=/^\s*(\d+)\s*d\s*(\d+|M)\s*(?:([+\-−])\s*(\d+))?\s*$/i.exec(String(s==null?'':s));
  if(!m)return null;
  const mon=/m/i.test(m[2]);
  return {n:+m[1],s:mon?0:+m[2],mon,f:m[3]?(m[3]==='+'?1:-1)*(+m[4]):0};
}
function d20adv(mode){
  const a=rnd(20);
  if(mode!=='adv'&&mode!=='dis')return {v:a,all:[a]};
  const b=rnd(20);
  return {v:mode==='adv'?Math.max(a,b):Math.min(a,b),all:[a,b]};
}
/* a Pokémon's or foe's Monster die as a number of sides (0 when not set); a Mega form uses its own */
const dieSides=v=>{const m=/^d?(\d+)$/i.exec(String(v==null?'':v).trim());return m?+m[1]:0;};
const monDie=m=>m?dieSides(megaOn(m)?(m.mega&&m.mega.die):m.die):0;
/* a move written NdM needs the roller's Monster die; says so and returns true when it is missing */
function needDie(x,die,who){
  const dc=parseDice(x&&x.dice);
  if(!(dc&&dc.mon)||die>0)return false;
  toast('Set '+who+'’s Monster die first. '+(x.name||'This move')+' rolls '+dc.n+'dM, and '+who+' has none set.');
  return true;
}
const kindStat=k=>k==='Special'?{acc:'spa',dmg:'spa',def:'spd',ab:'SpA',dab:'SpDef'}:isEff(k)?{acc:'spe',dmg:null,def:'spe',ab:'Spe',dab:'Spe'}:{acc:'atk',dmg:'atk',def:'def',ab:'Atk',dab:'Def'};

/* One attack, worked out in full. o:
   mv {name,kind,type,dice}  aTypes  aAcc (the accuracy stat)  aDmg (the damage stat)  aStage (Attack or Sp. Attack stage)
   tTypes (null when the target's types are not known)  tDef (null when unknown)  tStage (null when unknown)
   eff ('auto' or a code)  accBonus  dmgBonus  adv  onlyDmg  crit
   Nothing here touches the database. */
/* ---------- passives in attack rolls ----------
   Ability passives from the PTA3 Pokédex's Ability Passive List that change an attack roll: damage boosts, type changes,
   immunities, absorption and damage reductions. Ones that depend on something the site can't see (weather, who acted
   first, a foe that just joined) are tick boxes on the roll. A target's passives count only when the roller can see
   them: the GM always can; a player's roll against a hidden foe gets them when the GM presses Apply. */
const PS_REC=['bravebird','doubleedge','flareblitz','headsmash','takedown','volttackle','woodhammer','wildcharge','headcharge','submission','wavecrash','lightofruin','highjumpkick','jumpkick','chloroblast','steelbeam','mindblown','struggle'];
const PS_WIND=['aircutter','blizzard','fairywind','gust','heatwave','hurricane','icywind','petalblizzard','twister','whirlwind'];
const PS_GRP={punch:['Punches',/punch|uppercut|hammer arm|meteor mash/i],bite:['Fangs',/bite|fang|crunch|jaw lock|fishious/i],slash:['Slashing',/slash|claw|cut|blade|razor|x-scissor|night slash|leaf blade|sacred sword/i],pulse:['Pulse',/pulse|aura sphere|dark pulse|dragon pulse|origin pulse/i],sound:['Sound',/song|sing|roar|growl|screech|hyper voice|boomburst|bug buzz|echoed voice|round|snore|uproar|perish song|disarming voice|overdrive|sparkling aria|clanging/i]};
function psInGrp(g,name){
  const k=dexKey(name),G=PS_GRP[g];
  const L=PX.d&&PX.d.lists&&PX.d.lists[G[0]];
  if(Array.isArray(L)&&L.length)return L.some(x=>dexKey(x)===k);
  return G[1].test(String(name||''));
}
const PS_TCH={aerilate:'Flying',pixilate:'Fairy',refrigerate:'Ice',galvanize:'Electric'};
/* tick boxes: [key, passive, side, label] */
const PS_SIT=[
  ['analytic','analytic','a','Analytic: the target already acted this round (+4)'],
  ['stakeout','stakeout','a','Stakeout: the target just joined (+4)'],
  ['sheerforce','sheerforce','a','Sheer Force: drop the move’s added effects (+4)'],
  ['solarpower','solarpower','a','Solar Power: Sunny weather (+4)'],
  ['sandforce','sandforce','a','Sand Force: Sandstorming weather (+4 Rock and Ground)'],
  ['hustle','hustle','a','Hustle: has not missed yet this encounter (−2 Accuracy)'],
  ['sandveil','sandveil','d','Sand Veil: Sandstorming weather (−1 Accuracy against it)'],
  ['snowcloak','snowcloak','d','Snow Cloak: Hailing weather (−1 Accuracy against it)'],
  ['tangledfeet','tangledfeet','d','Tangled Feet: it is Confused (−1 Accuracy against it)']
];
const psTog=u=>{const o={};Object.keys(u||{}).forEach(k=>{if(k.indexOf('ps_')===0&&u[k])o[k.slice(3)]=true;});return o;};
const psKeys=list=>new Set((list||[]).map(p=>dexKey(p&&(p.name||p.n))).filter(Boolean));
const styleCount=m=>((m&&m.moves)||[]).filter(x=>x&&x.kind==='Style').length;
const hasPassive=(m,k)=>psKeys(m&&m.passives).has(k);
/* the tick boxes that matter for this attacker (and target, when its passives are known) */
function psSitFor(aPs,tPs){
  const A=psKeys(aPs),T=psKeys(tPs);
  return PS_SIT.filter(x=>(x[2]==='a'?A:T).has(x[1]));
}
/* o: {mv, type, k, rng, aTypes, aPs, tPs (null = unknown), aHp, tHp, tog} → changes to make to the roll */
function psAtkMods(o){
  const A=psKeys(o.aPs),T=o.tPs?psKeys(o.tPs):new Set(),tog=o.tog||{};
  const mvName=String(o.mv&&o.mv.name||''),mk=dexKey(mvName),melee=/melee/i.test(o.rng||''),ranged=!melee&&/ranged|ft/i.test(o.rng||'');
  const r={type:o.type,acc:0,dmg:0,notes:[],tech:false,ignoreT:A.has('moldbreaker')};
  const low=o.aHp&&num(o.aHp.max)>0&&num(o.aHp.cur)<20;
  const say=(n,t)=>r.notes.push(n+' '+t);
  /* type changes first: they decide same-type and effectiveness */
  if(r.type==='Normal')for(const k in PS_TCH)if(A.has(k)){r.type=PS_TCH[k];say(cap1(k),'(Normal → '+r.type+')');break;}
  if(A.has('liquidvoice')&&psInGrp('sound',mvName)&&r.type!=='Water'){r.type='Water';say('Liquid Voice','(sound → Water)');}
  if(A.has('normalize')&&r.type!=='Normal'){r.type='Normal';say('Normalize','(→ Normal)');}
  const t=r.type,same=(o.aTypes||[]).indexOf(t)>=0;
  /* accuracy */
  if(A.has('compoundeyes')&&ranged){r.acc+=1;say('Compound Eyes','+1 Acc');}
  if(A.has('hustle')&&tog.hustle){r.acc-=2;say('Hustle','−2 Acc');}
  if(A.has('skilllink')&&/scatter/i.test((o.rng||'')+' '+(o.mv&&o.mv.text||''))){r.acc+=2;say('Skill Link','+2 Acc');}
  if(!r.ignoreT)[['sandveil','Sand Veil'],['snowcloak','Snow Cloak'],['tangledfeet','Tangled Feet']].forEach(([k,n])=>{if(T.has(k)&&tog[k]){r.acc-=1;say(n,'−1 Acc');}});
  if(isEff(o.k))return r;
  /* damage */
  const add=(n,v)=>{r.dmg+=v;say(n,(v>0?'+':'−')+Math.abs(v));};
  if(A.has('adaptability')&&same)add('Adaptability',4);
  [['blaze','Fire','Blaze'],['torrent','Water','Torrent'],['overgrow','Grass','Overgrow'],['swarm','Bug','Swarm']].forEach(([k,ty,n])=>{if(A.has(k)&&low&&t===ty)add(n,4);});
  if(A.has('angershell')&&low)add('Anger Shell',4);
  if(A.has('ironfist')&&psInGrp('punch',mvName))add('Iron Fist',4);
  if(A.has('strongjaw')&&psInGrp('bite',mvName))add('Strong Jaw',4);
  if(A.has('megalauncher')&&psInGrp('pulse',mvName))add('Mega Launcher',4);
  if((A.has('sharpness')||A.has('toughclaws'))&&psInGrp('slash',mvName))add(A.has('sharpness')?'Sharpness':'Tough Claws',4);
  if(A.has('punkrock')&&psInGrp('sound',mvName))add('Punk Rock',4);
  if(A.has('steelworker')&&t==='Steel')add('Steelworker',4);
  if(A.has('rockypayload')&&t==='Rock')add('Rocky Payload',4);
  if(A.has('waterbubble')&&t==='Water')add('Water Bubble',4);
  if(A.has('reckless')&&PS_REC.indexOf(mk)>=0)add('Reckless',4);
  if(A.has('analytic')&&tog.analytic)add('Analytic',4);
  if(A.has('stakeout')&&tog.stakeout)add('Stakeout',4);
  if(A.has('sheerforce')&&tog.sheerforce)add('Sheer Force',4);
  if(A.has('solarpower')&&tog.solarpower)add('Solar Power',4);
  if(A.has('sandforce')&&tog.sandforce&&(t==='Rock'||t==='Ground'))add('Sand Force',4);
  if(A.has('technician')){r.tech=true;r.notes.push('Technician (1s and 2s count as 3)');}
  r.tinted=A.has('tintedlens');r.sniper=A.has('sniper');
  return r;
}
/* the target's side: immunity, absorption, a resist step, flat reductions, halving */
function psDefMods(o,t,eff){
  const T=psKeys(o.tPs),r={imm:'',absorb:'',step:0,dmg:0,half:[],dbl:[],notes:[]};
  if(!o.tPs||!T.size)return r;
  const mvName=String(o.mv&&o.mv.name||''),melee=/melee/i.test(o.rng||''),sound=psInGrp('sound',mvName);
  const im=(k,n,cond)=>{if(!r.imm&&T.has(k)&&cond)r.imm=n;};
  im('flashfire','Flash Fire',t==='Fire');im('wellbakedbody','Well-Baked Body',t==='Fire');
  im('sapsipper','Sap Sipper',t==='Grass');im('dryskin','Dry Skin',t==='Water');
  im('motordrive','Motor Drive',t==='Electric');im('lightningrod','Lightning Rod',t==='Electric');im('stormdrain','Storm Drain',t==='Water');
  im('levitate','Levitate',t==='Ground');im('soundproof','Soundproof',sound);
  if(!r.imm){
    if(T.has('voltabsorb')&&t==='Electric')r.absorb='Volt Absorb';
    else if(T.has('waterabsorb')&&t==='Water')r.absorb='Water Absorb';
    else if(T.has('eartheater')&&t==='Ground')r.absorb='Earth Eater';
  }
  if(T.has('heatproof')&&t==='Fire'){r.step-=1;r.notes.push('Heatproof −1 die');}
  if(T.has('purifyingsalt')&&t==='Ghost'){r.step-=1;r.notes.push('Purifying Salt −1 die');}
  const sub=(n,v)=>{r.dmg-=v;r.notes.push(n+' −'+v);};
  if(T.has('thickfat')&&(t==='Fire'||t==='Ice'))sub('Thick Fat',4);
  if(T.has('waterbubble')&&t==='Fire')sub('Water Bubble',4);
  if(T.has('punkrock')&&sound)sub('Punk Rock',4);
  if(T.has('multiscale')&&o.tHp&&num(o.tHp.max)>0&&num(o.tHp.cur)>=num(o.tHp.max))sub('Multiscale',4);
  if((T.has('filter')||T.has('solidrock'))&&eff&&(eff.c==='s'||eff.c==='x'))sub(T.has('filter')?'Filter':'Solid Rock',4);
  if(T.has('fluffy')&&melee)r.half.push('Fluffy');
  if(T.has('fluffy')&&t==='Fire')r.dbl.push('Fluffy');
  if(T.has('furcoat')&&o.k==='Physical')r.half.push('Fur Coat');
  return r;
}
const cap1=k=>({aerilate:'Aerilate',pixilate:'Pixilate',refrigerate:'Refrigerate',galvanize:'Galvanize'})[k]||k;
/* ---------- field conditions: Terrain, Weather and Zones (PTA 3.5 Players Handbook, Field Conditions) ----------
   Each is a circle 60 ft across (6 squares out from the square it was made on), or the whole battlefield when there's no
   map spot. They last two minutes (20 rounds of 6 seconds). A new one of the same kind of condition replaces an older one
   whose circle it reaches. Kept on the shared battle document, so everyone sees them; only the GM adds and removes them.
   battle.fc [{id, k, x, y (null = whole field), rd (round made), by (who made it, a name)}] */
const FC_R=6,FC_LIFE=20;
const FC_K={
  electric:{c:'t',n:'Electric Terrain',col:'#e6b800',up:{Electric:4},note:'Anyone on the ground is immune to Drowsy and Entranced.'},
  flowery:{c:'t',n:'Flowery Terrain',col:'#e86aa8',up:{Fairy:4,Grass:4},turn:'Fairy- and Grass-types get Defense▲ or SpDefense▲ at the start of their turn.'},
  grassy:{c:'t',n:'Grassy Terrain',col:'#3fae6a',up:{Grass:4},after:{heal:[1,8]},turn:'Anyone who acts here recovers 1d8 HP after acting.'},
  misty:{c:'t',n:'Misty Terrain',col:'#c28ae8',up:{Fairy:4},dragon:true,note:'Dragon-type attacks are resisted here, and no one can be given afflictions.'},
  muddy:{c:'t',n:'Muddy Terrain',col:'#8a6a45',up:{Ground:4,Electric:-8}},
  psychic:{c:'t',n:'Psychic Terrain',col:'#b05fd0',up:{Psychic:4},note:'Anyone on the ground takes no damage from Reaction moves or Priority moves used out of turn order.'},
  wet:{c:'t',n:'Wet Terrain',col:'#3aa6d8',up:{Water:4,Fire:-8},note:'Flopper and Beached are ignored while acting here.'},
  hail:{c:'w',n:'Hailing Weather',col:'#8fc3e8',up:{Ice:4},after:{dmg:[2,4],ex:['Ice']},turn:'Anyone who acts here takes 2d4 after acting unless they are Ice-type.'},
  hazy:{c:'w',n:'Hazy Weather',col:'#9a938a',hazy:true,turn:'Anyone who acts here loses all Stat ▲/▼. Attacks made in or into it get no Accuracy bonuses.'},
  mistyw:{c:'w',n:'Misty Weather',col:'#d6b6f2',up:{Fairy:4,Ghost:4},note:'No one here can be given ▼.'},
  pyro:{c:'w',n:'Pyroclastic Weather',col:'#d94b3d',up:{Fire:4},after:{dmg:[2,4],ex:['Fire']},turn:'Anyone who acts here takes 2d4 after acting unless they are Fire-type.'},
  rain:{c:'w',n:'Raining Weather',col:'#2f6fd6',up:{Water:4,Fire:-8}},
  sand:{c:'w',n:'Sandstorming Weather',col:'#c79a5a',up:{Rock:4},after:{dmg:[2,4],ex:['Ground','Rock','Steel']},turn:'Anyone who acts here takes 2d4 after acting unless they are Ground-, Rock- or Steel-type.'},
  snow:{c:'w',n:'Snowy Weather',col:'#bcd4e6',up:{Ice:4},turn:'Ice-types get Defense▲ or SpDefense▲ at the start of their turn.'},
  sunny:{c:'w',n:'Sunny Weather',col:'#f08a24',up:{Fire:4,Water:-8}},
  gusty:{c:'w',n:'Gusty Weather',col:'#5fb3a1',up:{Flying:4},turn:'Flying-types and their adjacent allies get Speed▲ at the start of their turn.'},
  gravity:{c:'z',n:'Gravitized Zone',col:'#555b66',acc:1,grav:true,note:'No one can leave the ground; Ground-type immunities count as resisted.'},
  ionic:{c:'z',n:'Ionic Zone',col:'#d9b400',ionic:true,note:'Normal-type moves are Electric-type.'},
  magical:{c:'z',n:'Magical Zone',col:'#8a4fd0',note:'Held items lose their abilities and medicine items do nothing (Mega Stones still work).'},
  tricky:{c:'z',n:'Tricky Zone',col:'#2e9e5b',note:'Turn order is reversed. Priority moves used out of order make the user act last.'},
  wonderful:{c:'z',n:'Wonderful Zone',col:'#d4a017',swap:true,note:'Defense and Special Defense are swapped.'}
};
const FC_CAT={t:'Terrain',w:'Weather',z:'Zone'};
const fcList=()=>(Array.isArray(BT().fc)?BT().fc:[]).filter(x=>x&&FC_K[x.k]);
/* where a combatant stands on the map the viewer can see: {x,y,fp} or null */
function fcPos(cid){
  const cfg=bmAvail()?bmCfg():null;
  if(!cfg)return null;
  const t=bmTokens(cfg).find(k=>k.cid===cid);
  return t&&t.placed?{x:t.x,y:t.y,fp:t.fp}:null;
}
function fcCovers(f,p){
  if(f.x==null||f.y==null)return true;
  if(!p)return false;
  const cx=num(f.x)+0.5,cy=num(f.y)+0.5,tx=p.x+p.fp/2,ty=p.y+p.fp/2;
  return Math.hypot(tx-cx,ty-cy)<=FC_R+0.01;
}
/* the condition keys that reach a combatant */
function fcAt(cid){
  const L=fcList();
  if(!L.length||!cid)return [];
  const p=fcPos(cid);
  return L.filter(f=>fcCovers(f,p)).map(f=>f.k);
}
function fcAdd(k,center){
  if(!S.me.admin||!FC_K[k])return;
  const b=BT(),rd=num(b.round)||1;
  let x=null,y=null,by='';
  if(center){const p=fcPos(center),v=btInfo(center,true);if(p){x=p.x+Math.floor(p.fp/2);y=p.y+Math.floor(p.fp/2);}by=v?v.name:'';}
  const cat=FC_K[k].c;
  const keep=fcList().filter(f=>{
    if(FC_K[f.k].c!==cat)return true;
    if(f.x==null||x==null)return false;
    return Math.hypot(num(f.x)-x,num(f.y)-y)>FC_R*2;
  });
  const gone=fcList().length-keep.length;
  edit('bt','battle','fc',keep.concat([{id:'fc'+Date.now().toString(36),k,x,y,rd,by}]));
  toast(FC_K[k].n+(x==null?' covers the whole battlefield':' is up around '+(by||'that spot'))+' until the end of round '+(rd+FC_LIFE)+'.'+(gone?' It replaced the older '+FC_CAT[cat].toLowerCase()+'.':''),true);
  render();
}
function fcRemove(id){if(S.me.admin){edit('bt','battle','fc',fcList().filter(f=>f.id!==id));render();}}
/* two minutes are up: called when the round moves on */
function fcExpire(round){
  if(!S.me.admin)return;
  const L=fcList(),keep=L.filter(f=>num(round)<=num(f.rd)+FC_LIFE);
  if(keep.length!==L.length){edit('bt','battle','fc',keep);toast((L.length-keep.length)+' field condition'+(L.length-keep.length===1?' has':'s have')+' worn off.',true);}
}
/* what reaches the combatant who is acting now: reminders, and the after-acting HP changes as a button for the GM */
function fcTurnNotes(cid){
  const ks=fcAt(cid);if(!ks.length)return [];
  const v=btInfo(cid,!!S.me.admin),types=(v&&v.types)||[];
  const out=[];
  ks.forEach(k=>{
    const K=FC_K[k];
    if(K.after&&K.after.ex&&types.some(t=>K.after.ex.indexOf(t)>=0))return;
    if(K.turn)out.push({k,txt:K.n+': '+K.turn,act:K.after?(K.after.dmg?'dmg':'heal'):''});
  });
  return out;
}
function fcApplyAfter(cid,k){
  if(!S.me.admin)return;
  const K=FC_K[k];if(!K||!K.after)return;
  const [n,d]=K.after.dmg||K.after.heal;
  let t=0;const rs=[];for(let i=0;i<n;i++){const r=rnd(d);rs.push(r);t+=r;}
  const v=btInfo(cid,true);
  btHp(cid,K.after.dmg?-t:t);
  toast((v?v.name:'It')+(K.after.dmg?' takes ':' recovers ')+t+' ('+n+'d'+d+': '+rs.join(', ')+') from '+K.n+'.',true);
  render();
}
function fcPanel(){
  const b=BT(),gm=!!S.me.admin,L=fcList(),u=S.ui.bt;
  if(!gm&&!L.length)return '';
  if(!b.on&&!L.length)return '';
  const rd=num(b.round)||1;
  const placed=bmAvail()&&bmCfg()?bmTokens(bmCfg()).filter(t=>t.placed&&(t.side==='a'||t.side==='f')):[];
  const cur=b.on&&b.turn?b.turn:'';
  const notes=cur?fcTurnNotes(cur):[];
  return h`<section class="panel fcp"><div class="ph"><h2>Field conditions</h2><span class="sub">${L.length?L.length+' active':'None'}</span></div>
    ${L.length?h`<ul class="fclist">${L.map(f=>{const K=FC_K[f.k],left=num(f.rd)+FC_LIFE-rd;return h`<li><span class="fcdot" style="background:${K.col}"></span><span><b>${K.n}</b> <span class="sub">${FC_CAT[K.c]} · ${f.x==null?'whole battlefield':'around '+(f.by||'column '+(num(f.x)+1)+', row '+(num(f.y)+1))} · ${left>0?left+' round'+(left===1?'':'s')+' left':'ends this round'}</span>${K.up?h`<br><span class="sub">${Object.keys(K.up).map(t=>t+' attacks '+(K.up[t]>0?'+':'−')+Math.abs(K.up[t])).join(', ')}</span>`:''}${K.note?h`<br><span class="sub">${K.note}</span>`:''}</span>${gm?h`<button class="btn sm ghost" data-act="fc_rm" data-id="${f.id}">Remove</button>`:''}</li>`;})}</ul>`:''}
    ${notes.length?h`<div class="fcnow"><b>${(btInfo(cur,gm)||{}).name||'Now acting'}</b>${notes.map(n=>h`<div class="row sp"><span class="sub">${n.txt}</span>${gm&&n.act?h`<button class="btn sm" data-act="fc_after" data-cid="${cur}" data-k="${n.k}">${n.act==='dmg'?'Roll and apply damage':'Roll and heal'}</button>`:''}</div>`)}</div>`:''}
    ${L.length?h`<label class="row"><input type="checkbox" data-u="bt.fcAnim" ${S.ui.bt.fcAnim!==false?raw('checked'):''}><span>Animate on the map (this device)</span></label>`:''}
    ${gm?h`<div class="row fcadd"><label class="fld"><span class="fl">Add</span><select data-u="bt.fck">${['t','w','z'].map(c=>h`<optgroup label="${FC_CAT[c]}">${Object.keys(FC_K).filter(k=>FC_K[k].c===c).map(k=>h`<option value="${k}" ${u.fck===k?raw('selected'):''}>${FC_K[k].n}</option>`)}</optgroup>`)}</select></label>
      <label class="fld"><span class="fl">Centred on</span><select data-u="bt.fcc"><option value="">The whole battlefield</option>${placed.map(t=>h`<option value="${t.cid}" ${u.fcc===t.cid?raw('selected'):''}>${t.v.name}${t.side==='f'?' (foe)':''}</option>`)}</select></label>
      <button class="btn sm primary" data-act="fc_add">Add</button></div>
      <p class="sub">A condition made by a move is a circle 60 ft across around whoever used it; place their token on the map first to centre it there. Attacks made inside it get its bonuses on their own, and it wears off after 20 rounds.</p>`:''}
  </section>`;
}
/* the circles on the map */
/* ----- the circles on the map, animated: each condition gets its own moving pattern (rain falling, sand blowing, sparks
   flickering…) clipped to its circle. SVG animation, so it costs little and needs no script. Turned off by the "Animate"
   box on the Field conditions panel, or by the device's reduced-motion setting. ----- */
function fcAnimOn(){
  if(S.ui.bt&&S.ui.bt.fcAnim===false)return false;
  try{if(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches)return false;}catch(e){}
  return true;
}
/* pattern tiles: P = two squares. mv(dx,dy,dur) slides the tile; seamless because it moves by whole tiles */
function fcFx(k,id,g,A,box){
  const P=g*2,f=n=>(+n).toFixed(2);
  const mv=(dx,dy,d)=>A?'<animateTransform attributeName="patternTransform" type="translate" from="0 0" to="'+f(dx)+' '+f(dy)+'" dur="'+d+'s" repeatCount="indefinite"/>':'';
  const pat=(inner,anim,w,hh)=>'<pattern id="'+id+'" patternUnits="userSpaceOnUse" width="'+f(w||P)+'" height="'+f(hh||P)+'">'+inner+anim+'</pattern>';
  const blink=(d,b)=>A?'<animate attributeName="opacity" values="0;1;0" dur="'+d+'s" begin="'+(b||0)+'s" repeatCount="indefinite"/>':'';
  const dots=(n,rr,col,op)=>{let o='';for(let i=0;i<n;i++){const x=((i*37)%97)/97*P,y=((i*61)%89)/89*P;o+='<circle cx="'+f(x)+'" cy="'+f(y)+'" r="'+f(rr*(0.7+((i*13)%7)/10))+'" fill="'+col+'" opacity="'+op+'"/>';}return o;};
  const cx=box.cx,cy=box.cy,R=box.r;
  let defs='',top='';
  switch(k){
    case 'rain':{let o='';for(let i=0;i<6;i++){const x=i/6*P+((i*17)%11)/11*g*0.2,y=((i*41)%23)/23*P;o+='<line x1="'+f(x)+'" y1="'+f(y)+'" x2="'+f(x-g*0.15)+'" y2="'+f(y+g*0.55)+'" stroke="#9fc4ff" stroke-width="'+f(g*0.05)+'" stroke-linecap="round" opacity=".85"/>';}
      defs=pat(o+o.replace(/y1="([\d.]+)"/g,(m,v)=>'y1="'+f(+v-P)+'"').replace(/y2="([\d.]+)"/g,(m,v)=>'y2="'+f(+v-P)+'"'),mv(0,P,0.55));break;}
    case 'hail':defs=pat(dots(7,g*0.075,'#5d9bd6',0.95)+dots(4,g*0.05,'#9cc6ec',0.95),mv(0,P,0.9));break;
    case 'snow':defs=pat(dots(9,g*0.07,'#ffffff',1).replace(/opacity="1"/g,'opacity="1" stroke="#8fb3d1" stroke-width="'+f(g*0.02)+'"'),mv(P,P*2,7));break;
    case 'sand':{let o='';for(let i=0;i<8;i++){const x=((i*29)%31)/31*P,y=((i*43)%37)/37*P;o+='<line x1="'+f(x)+'" y1="'+f(y)+'" x2="'+f(x+g*0.35)+'" y2="'+f(y+g*0.05)+'" stroke="#d9b07a" stroke-width="'+f(g*0.05)+'" stroke-linecap="round" opacity=".8"/>';}
      defs=pat(o+dots(6,g*0.03,'#b98b52',0.8),mv(P,0,0.7));break;}
    case 'gusty':{let o='';for(let i=0;i<2;i++){const y=(i+0.5)/2*P,x=((i*23)%19)/19*P*0.5;o+='<path d="M'+f(x)+' '+f(y)+' q'+f(g*0.4)+' '+f(-g*0.18)+' '+f(g*0.8)+' 0 t'+f(g*0.8)+' 0" fill="none" stroke="#2f8f78" stroke-width="'+f(g*0.045)+'" stroke-linecap="round" opacity=".5"/>';}
      defs=pat(o,mv(P,0,1.4));break;}
    case 'pyro':defs=pat(dots(6,g*0.05,'#ffb347',0.95)+dots(4,g*0.035,'#ff5a36',0.9),mv(0,-P,2.2));break;
    case 'hazy':defs=pat('<ellipse cx="'+f(P*0.3)+'" cy="'+f(P*0.4)+'" rx="'+f(P*0.35)+'" ry="'+f(P*0.18)+'" fill="#a39b90" opacity=".35"/><ellipse cx="'+f(P*0.8)+'" cy="'+f(P*0.85)+'" rx="'+f(P*0.3)+'" ry="'+f(P*0.14)+'" fill="#8f877c" opacity=".3"/>',mv(P,0,14));break;
    case 'mistyw':case 'misty':defs=pat('<ellipse cx="'+f(P*0.25)+'" cy="'+f(P*0.3)+'" rx="'+f(P*0.3)+'" ry="'+f(P*0.16)+'" fill="#f3e3ff" opacity=".55"/><ellipse cx="'+f(P*0.75)+'" cy="'+f(P*0.78)+'" rx="'+f(P*0.32)+'" ry="'+f(P*0.15)+'" fill="#ffd9f1" opacity=".45"/>',mv(P,0,k==='misty'?16:11));break;
    case 'sunny':{
      defs='<radialGradient id="'+id+'g"><stop offset="0" stop-color="#fff3b0" stop-opacity=".55"/><stop offset="1" stop-color="#f08a24" stop-opacity="0"/></radialGradient>';
      let rays='';for(let i=0;i<12;i++){const t=i/12*Math.PI*2;rays+='<line x1="'+f(cx+Math.cos(t)*R*0.2)+'" y1="'+f(cy+Math.sin(t)*R*0.2)+'" x2="'+f(cx+Math.cos(t)*R)+'" y2="'+f(cy+Math.sin(t)*R)+'" stroke="#ffd166" stroke-width="'+f(g*0.25)+'" stroke-linecap="round" opacity=".35"/>';}
      top='<circle cx="'+f(cx)+'" cy="'+f(cy)+'" r="'+f(R)+'" fill="url(#'+id+'g)"/><g>'+rays+(A?'<animateTransform attributeName="transform" type="rotate" from="0 '+f(cx)+' '+f(cy)+'" to="360 '+f(cx)+' '+f(cy)+'" dur="40s" repeatCount="indefinite"/>':'')+'</g>';
      return {defs,top,fill:''};}
    case 'electric':{const z=(x,y)=>'<path d="M'+f(x)+' '+f(y)+' l'+f(g*0.18)+' '+f(g*0.2)+' l'+f(-g*0.12)+' '+f(g*0.05)+' l'+f(g*0.2)+' '+f(g*0.25)+'" fill="none" stroke="#d39e00" stroke-width="'+f(g*0.07)+'" stroke-linejoin="round"/>';
      defs=pat('<g>'+z(P*0.15,P*0.1)+z(P*0.6,P*0.55)+blink(0.9,0)+'</g><g>'+z(P*0.55,P*0.05)+z(P*0.1,P*0.6)+blink(0.9,0.45)+'</g>','');break;}
    case 'grassy':{let o='';for(let i=0;i<5;i++){const x=((i*31)%29)/29*P,y=((i*47)%41)/41*P+g*0.3;o+='<path d="M'+f(x)+' '+f(y)+' q'+f(-g*0.05)+' '+f(-g*0.25)+' '+f(-g*0.12)+' '+f(-g*0.35)+' M'+f(x)+' '+f(y)+' q'+f(g*0.02)+' '+f(-g*0.25)+' '+f(g*0.1)+' '+f(-g*0.38)+'" fill="none" stroke="#3f9a52" stroke-width="'+f(g*0.05)+'" stroke-linecap="round"/>';}
      defs=pat(o,A?'<animateTransform attributeName="patternTransform" type="skewX" values="-6;6;-6" dur="3.2s" repeatCount="indefinite"/>':'');break;}
    case 'flowery':{let o='';for(let i=0;i<5;i++){const x=((i*31)%29)/29*P,y=((i*47)%41)/41*P;o+='<ellipse cx="'+f(x)+'" cy="'+f(y)+'" rx="'+f(g*0.09)+'" ry="'+f(g*0.05)+'" fill="'+(i%2?'#ff9fcf':'#ffe08a')+'" transform="rotate('+(i*40)+' '+f(x)+' '+f(y)+')" opacity=".9"/>';}
      defs=pat(o,mv(P,P,9));break;}
    case 'muddy':defs=pat('<ellipse cx="'+f(P*0.3)+'" cy="'+f(P*0.35)+'" rx="'+f(g*0.35)+'" ry="'+f(g*0.2)+'" fill="#6b4a2b" opacity=".45"/><ellipse cx="'+f(P*0.75)+'" cy="'+f(P*0.8)+'" rx="'+f(g*0.28)+'" ry="'+f(g*0.16)+'" fill="#7a5532" opacity=".4"/><circle cx="'+f(P*0.32)+'" cy="'+f(P*0.33)+'" r="'+f(g*0.06)+'" fill="#a07a50">'+(A?'<animate attributeName="r" values="0;'+f(g*0.08)+';0" dur="2.6s" repeatCount="indefinite"/>':'')+'</circle>','');break;
    case 'wet':defs=pat('<circle cx="'+f(P*0.3)+'" cy="'+f(P*0.35)+'" r="'+f(g*0.3)+'" fill="none" stroke="#2f8fd0" stroke-width="'+f(g*0.04)+'">'+(A?'<animate attributeName="r" values="0;'+f(g*0.45)+'" dur="2.2s" repeatCount="indefinite"/><animate attributeName="opacity" values="1;0" dur="2.2s" repeatCount="indefinite"/>':'')+'</circle><circle cx="'+f(P*0.78)+'" cy="'+f(P*0.8)+'" r="'+f(g*0.3)+'" fill="none" stroke="#2f8fd0" stroke-width="'+f(g*0.04)+'">'+(A?'<animate attributeName="r" values="0;'+f(g*0.45)+'" dur="2.2s" begin="1.1s" repeatCount="indefinite"/><animate attributeName="opacity" values="1;0" dur="2.2s" begin="1.1s" repeatCount="indefinite"/>':'')+'</circle>','');break;
    case 'psychic':case 'gravity':{
      let o='';for(let i=0;i<3;i++){const d=3,b=i*d/3,up=k==='psychic';o+='<circle cx="'+f(cx)+'" cy="'+f(cy)+'" r="'+f(up?R*0.1:R)+'" fill="none" stroke="'+(up?'#e6a6ff':'#cfd3da')+'" stroke-width="'+f(g*0.08)+'" opacity="0">'+(A?'<animate attributeName="r" values="'+(up?f(R*0.1)+';'+f(R):f(R)+';'+f(R*0.1))+'" dur="'+d+'s" begin="'+b+'s" repeatCount="indefinite"/><animate attributeName="opacity" values="0;.8;0" dur="'+d+'s" begin="'+b+'s" repeatCount="indefinite"/>':'')+'</circle>';}
      if(!A)o='<circle cx="'+f(cx)+'" cy="'+f(cy)+'" r="'+f(R*0.6)+'" fill="none" stroke="'+(k==='psychic'?'#e6a6ff':'#cfd3da')+'" stroke-width="'+f(g*0.08)+'" opacity=".6"/>';
      return {defs:'',top:o,fill:''};}
    case 'ionic':{const z=(x,y)=>'<path d="M'+f(x)+' '+f(y)+' l'+f(g*0.15)+' '+f(g*0.15)+' l'+f(-g*0.1)+' '+f(g*0.04)+' l'+f(g*0.15)+' '+f(g*0.18)+'" fill="none" stroke="#c99700" stroke-width="'+f(g*0.06)+'"/>';
      defs=pat('<g>'+z(P*0.2,P*0.2)+blink(0.6,0)+'</g><g>'+z(P*0.65,P*0.6)+blink(0.6,0.3)+'</g>','');break;}
    case 'magical':case 'wonderful':{const col=k==='magical'?'#9b5de5':'#d4a017';let o='';[[0.2,0.25,0],[0.7,0.3,0.5],[0.45,0.75,1],[0.85,0.85,1.5]].forEach(([x,y,b])=>{o+='<path d="M'+f(P*x)+' '+f(P*y-g*0.12)+' L'+f(P*x+g*0.04)+' '+f(P*y)+' L'+f(P*x)+' '+f(P*y+g*0.12)+' L'+f(P*x-g*0.04)+' '+f(P*y)+'Z" fill="'+col+'">'+blink(2,b)+'</path>';});
      defs=pat(o,'');break;}
    case 'tricky':{
      const o='<circle cx="'+f(cx)+'" cy="'+f(cy)+'" r="'+f(R*0.85)+'" fill="none" stroke="#7fe0a8" stroke-width="'+f(g*0.1)+'" stroke-dasharray="'+f(g*0.6)+' '+f(g*0.4)+'" opacity=".7">'+(A?'<animateTransform attributeName="transform" type="rotate" from="0 '+f(cx)+' '+f(cy)+'" to="-360 '+f(cx)+' '+f(cy)+'" dur="12s" repeatCount="indefinite"/>':'')+'</circle>';
      return {defs:'',top:o,fill:''};}
  }
  return {defs,top,fill:defs?'url(#'+id+')':''};
}
function bmFcSvg(cfg){
  const L=fcList();if(!L.length)return '';
  const A=fcAnimOn(),g=cfg.gx;
  let defs='',s='';
  L.forEach((f,i)=>{
    const K=FC_K[f.k],id='fcx'+i+String(f.id||'').replace(/[^a-z0-9]/gi,'');
    const whole=f.x==null;
    const cx=whole?cfg.w/2:cfg.ox+(num(f.x)+0.5)*g,cy=whole?cfg.h/2:cfg.oy+(num(f.y)+0.5)*g,r=whole?Math.hypot(cfg.w,cfg.h)/2:(FC_R+0.5)*g;
    const fx=fcFx(f.k,id,g,A,{cx,cy,r});
    defs+=fx.defs+'<clipPath id="'+id+'c">'+(whole?'<rect x="0" y="0" width="'+cfg.w+'" height="'+cfg.h+'"/>':'<circle cx="'+cx+'" cy="'+cy+'" r="'+r+'"/>')+'</clipPath>';
    const shape=whole?'<rect x="0" y="0" width="'+cfg.w+'" height="'+cfg.h+'"':'<circle cx="'+cx+'" cy="'+cy+'" r="'+r+'"';
    s+=shape+' fill="'+K.col+'" fill-opacity="'+(whole?'.08':'.16')+'"/>';
    s+='<g clip-path="url(#'+id+'c)">'+(fx.fill?shape+' fill="'+fx.fill+'"/>':'')+(fx.top||'')+'</g>';
    if(!whole)s+='<circle cx="'+cx+'" cy="'+cy+'" r="'+r+'" fill="none" stroke="'+K.col+'" stroke-width="'+(g*0.08)+'" stroke-dasharray="'+(g*0.3)+' '+(g*0.2)+'">'+(A?'<animate attributeName="stroke-dashoffset" from="0" to="'+(g*-1)+'" dur="2s" repeatCount="indefinite"/>':'')+'</circle>';
    const lx=whole?g*3.2:Math.min(Math.max(cx,g*3),cfg.w-g*3),ly=whole?g*0.7+i*g*0.55:Math.max(g*0.6,cy-r+g*0.55);
    s+='<text x="'+lx+'" y="'+ly+'" text-anchor="middle" font-size="'+(g*0.42)+'" font-weight="700" fill="'+K.col+'" stroke="#fff" stroke-width="'+(g*0.08)+'" paint-order="stroke">'+esc(K.n)+'</text>';
  });
  return h`<svg class="bmov bmfc" viewBox="0 0 ${cfg.w} ${cfg.h}" preserveAspectRatio="none" aria-hidden="true"><defs>${raw(defs)}</defs>${raw(s)}</svg>`;
}
/* the roll's side: what the conditions around the attacker and the target change */
function fcMods(aKeys,tKeys){
  const A=aKeys||[],T=tKeys||[],has=(L,p)=>L.some(k=>FC_K[k][p]);
  return {A,T,ionic:has(A,'ionic'),acc:(has(A,'acc')||has(T,'acc'))?1:0,hazy:A.indexOf('hazy')>=0||T.indexOf('hazy')>=0,
    dragon:has(T,'dragon'),grav:has(A,'grav')||has(T,'grav'),swap:has(T,'swap'),
    tog:{solarpower:A.indexOf('sunny')>=0,sandforce:A.indexOf('sand')>=0,sandveil:T.indexOf('sand')>=0,snowcloak:T.indexOf('hail')>=0}};
}
const btCidOf=ref=>{const c=BT().c||{};return Object.keys(c).find(k=>c[k].s==='a'&&c[k].r===ref)||'';};
/* in a Wonderful Zone the target's Defense and Special Defense trade places */
const fcSwapDef=(cid,def)=>cid&&(def==='def'||def==='spd')&&fcAt(cid).some(k=>FC_K[k].swap)?(def==='def'?'spd':'def'):def;
function atkCalc(o){
  const mv=o.mv||{};
  const k=KINDS.indexOf(mv.kind)>=0?mv.kind:'Physical';
  const ks=kindStat(k);
  const FM=fcMods(o.fcA,o.fcT);
  const tog=Object.assign({},o.tog||{});Object.keys(FM.tog).forEach(k=>{if(FM.tog[k])tog[k]=true;});
  const P=psAtkMods({mv,type:mv.type||'',k,rng:mv.range||'',aTypes:o.aTypes,aPs:o.aPs,tPs:o.tPs,aHp:o.aHp,tog});
  if(FM.ionic&&P.type==='Normal'){P.type='Electric';P.notes.push('Ionic Zone (Normal → Electric)');}
  const tPs=P.ignoreT?null:o.tPs;
  const out={k,mv:mv.name||'Move',type:P.type||mv.type||'',ps:P.notes.slice(),pd:!!o.tPs||P.ignoreT,mb:P.ignoreT,rng:mv.range||''};
  if(P.ignoreT&&o.tPs&&psKeys(o.tPs).size)out.ps.push('Mold Breaker (ignores the target’s passives)');
  let crit=!!o.crit;
  if(!o.onlyDmg){
    const r=d20adv(o.adv);
    const mm=mod(o.aAcc);
    let bonus=num(o.accBonus)+P.acc+FM.acc;
    if(FM.acc)out.ps.push('Gravitized Zone +1 Acc');
    if(FM.hazy&&bonus>0){bonus=0;out.ps.push('Hazy Weather (no Accuracy bonuses)');}
    const tot=r.v+mm+bonus;
    out.ac={tot,d:r.v,all:r.all,mod:mm,bonus,adv:o.adv==='adv'||o.adv==='dis'?o.adv:'normal',ab:ks.ab};
    crit=r.v===20;
    if(o.tDef!=null){out.vs=num(o.tDef);out.vsAb=ks.dab;out.hit=tot>=num(o.tDef);}
  }
  out.crit=crit;
  const dc=parseDice(mv.dice);
  if(!dc)return out;
  /* NdM: the dice are the attacker's own Monster die; with none set there is nothing to roll */
  if(dc.mon){
    if(!(num(o.die)>0))return out;
    dc.s=num(o.die);
  }
  const plain=isEff(k);
  const ty=out.type;
  let eff=EFF_CODES.n;
  if(!plain){
    if(o.eff&&o.eff!=='auto'&&EFF_CODES[o.eff])eff=EFF_CODES[o.eff];
    else if(o.tTypes){
      eff=effOf(ty,o.tTypes);
      if(eff.c==='i'&&psKeys(o.aPs).has('scrappy')&&(ty==='Normal'||ty==='Fighting')&&o.tTypes.indexOf('Ghost')>=0){eff=effOf(ty,o.tTypes.filter(x=>x!=='Ghost'));out.ps.push('Scrappy (hits Ghost)');}
    }
  }
  if(!plain&&(!o.eff||o.eff==='auto')&&o.tTypes){
    if(FM.grav&&ty==='Ground'&&eff.c==='i'){eff=EFF_CODES.r;out.ps.push('Gravitized Zone (immunity counts as resisted)');}
    if(FM.dragon&&ty==='Dragon'&&eff.c!=='r'&&eff.c!=='h'&&eff.c!=='i'){eff=EFF_CODES.r;out.ps.push('Misty Terrain (Dragon resisted)');}
  }
  const tPsF=FM.grav&&tPs?tPs.filter(p=>dexKey(p&&(p.name||p.n))!=='levitate'):tPs;
  const D=plain?psDefMods({},ty,eff):psDefMods({mv,rng:mv.range||'',k,tPs:tPsF,tHp:o.tHp},ty,eff);
  out.ef=eff.c;
  if(eff.c==='i'){out.dm={tot:0,imm:true,base:dc.n,s:dc.s,rolled:[],n:0,ef:'i'};return out;}
  if(D.imm){out.ps.push(D.imm+' (immune)');out.dm={tot:0,imm:true,psImm:D.imm,base:dc.n,s:dc.s,rolled:[],n:0,ef:eff.c};return out;}
  const stageD=plain?0:num(o.aStage)-num(o.tStage);
  const n=Math.max(0,dc.n+(plain?0:eff.d+D.step)+stageD);
  const rolled=[];
  for(let i=0;i<n;i++){let v=crit?dc.s:rnd(dc.s);if(P.tech&&v<3)v=3;rolled.push(v);}
  const sum=rolled.reduce((a,b)=>a+b,0);
  const stab=!plain&&ty&&(o.aTypes||[]).indexOf(ty)>=0?4:0;
  const stat=plain||!ks.dmg?0:mod(o.aDmg);
  let psd=plain?0:P.dmg;
  if(!plain&&P.tinted&&(eff.c==='r'||eff.c==='h')){psd+=4;out.ps.push('Tinted Lens +4');}
  if(!plain&&P.sniper&&crit){psd+=8;out.ps.push('Sniper +8');}
  if(!plain){psd+=D.dmg;out.ps.push(...D.notes);}
  if(!plain)FM.A.forEach(k=>{const v=(FC_K[k].up||{})[ty];if(v){psd+=v;out.ps.push(FC_K[k].n+' '+(v>0?'+':'−')+Math.abs(v));}});
  const extra=num(o.dmgBonus);
  let tot=Math.max(0,sum+dc.f+stat+stab+extra+psd);
  if(!plain){D.dbl.forEach(n=>{tot*=2;out.ps.push(n+' ×2');});D.half.forEach(n=>{tot=Math.floor(tot/2);out.ps.push(n+' ½');});}
  let heal=0;
  if(!plain&&D.absorb){heal=Math.floor(tot/2);out.ps.push(D.absorb+': heals '+heal+' instead');tot=0;}
  out.dm={tot,base:dc.n,n,s:dc.s,mon:!!dc.mon,rolled,eff:eff.d,stageD,fixed:dc.f,stat,stab,extra,psd,heal,absorb:D.absorb,ef:eff.c,ab:ks.ab};
  return out;
}
const dieWord=n=>Math.abs(n)+(Math.abs(n)===1?' die':' dice');
function acText(c){
  const a=c.ac;
  if(!a)return '';
  const d=a.adv==='adv'?'advantage '+a.all.join(' / ')+' → '+a.d:a.adv==='dis'?'disadvantage '+a.all.join(' / ')+' → '+a.d:String(a.d);
  let s='d20 '+d+(a.mod?' + '+a.ab+' '+a.mod:'')+(a.bonus?' '+sgn(a.bonus):'')+' = '+a.tot;
  if(c.crit)s+=' · natural 20!';
  if(c.vs!=null)s+=' vs '+c.vsAb+' '+c.vs+(c.hit?' · hit':' · miss');
  return s;
}
function dmText(c){
  const m=c.dm;
  if(!m)return '';
  if(m.imm)return (m.psImm?m.psImm+': immune':EFF_LBL.i)+': no damage.';
  const bits=[];
  if(m.eff)bits.push((m.eff>0?'+':'−')+dieWord(m.eff)+' '+EFF_LBL[m.ef].toLowerCase());
  if(m.stageD)bits.push((m.stageD>0?'+':'−')+dieWord(m.stageD)+' from stages');
  const dice=(m.mon?m.base+'dM → ':'')+m.base+'d'+m.s+(bits.length?' ('+bits.join(', ')+') = '+m.n+'d'+m.s:'')+(m.mon?' (Monster die d'+m.s+')':'');
  let s=dice+(c.crit?' · critical, every die at its top face':'')+': ['+m.rolled.join(', ')+']';
  const add=[];
  if(m.fixed)add.push(sgn(m.fixed));
  if(m.stat)add.push('+'+m.stat+' '+m.ab);
  if(m.stab)add.push('+4 same-type');
  if(m.extra)add.push(sgn(m.extra));
  if(m.psd)add.push(sgn(m.psd)+' passives and field');
  return s+(add.length?' '+add.join(' '):'')+' = '+m.tot+(c.ps&&c.ps.length?' · '+c.ps.join(', '):'');
}

/* ----- the roll log ----- */
function rollWho(){
  const uid=S.me.id,t=uid&&S.trainers[uid];
  return t&&t.name?t.name:(S.me.admin?(S.meta.gm||'GM'):'Someone');
}
/* Local box first (full detail), then the table's log. e.gm marks a roll the GM makes for a foe. */
function logRoll(e,local){
  e.id=Date.now().toString(36)+Math.random().toString(36).slice(2,5);
  e.at=Date.now();
  S.rolls.unshift(local||e);
  S.rolls=S.rolls.slice(0,6);
  S.ui.rollHidden=false;
  if(S.ui.secret&&S.me.admin)return;
  const uid=S.me.id;
  if(e.gm&&S.me.admin){
    e.who=S.meta.gm||'GM';
    edit('bt','battle','rolls',[e].concat((S.battle&&S.battle.rolls)||[]).slice(0,20));
  }else if(uid&&S.trainers[uid]&&canEditT(uid)){
    e.who=tName(S.trainers[uid]);
    edit('t',uid,'rolls',[e].concat(S.trainers[uid].rolls||[]).slice(0,20));
  }else if(S.me.admin){
    e.who=S.meta.gm||'GM';
    edit('bt','battle','rolls',[e].concat((S.battle&&S.battle.rolls)||[]).slice(0,20));
  }
}
/* the box and the log get the same facts. A foe's attack shows only its totals, never the foe's own numbers. */
function atkEntry(c,who,tgt,foe){
  const e={kind:'atk',label:c.mv,type:c.type,mk:c.k,mr:c.rng||'',pd:!!c.pd,mb:!!c.mb,pk:who||'',tgt:tgt&&tgt.cid||'',tn:tgt&&tgt.name||''};
  if(c.dm&&c.dm.heal)e.heal=c.dm.heal;
  if(c.ac)e.ac=c.ac.tot;
  if(c.crit)e.crit=true;
  if(c.hit!=null)e.hit=!!c.hit;
  if(c.dm){e.dm=c.dm.tot;e.ef=c.dm.ef;}
  const local=Object.assign({},e,{acd:acText(c),dmd:dmText(c)});
  if(!foe){e.acd=local.acd;e.dmd=local.dmd;}
  if(foe)e.gm=true;
  return {e,local};
}
/* Attack-only text from the old Pokétch box also reads fine for a check */
function chkEntry(label,total,detail){
  return {kind:'chk',label,total,detail};
}
function allRolls(){
  const out=[];
  Object.keys(S.trainers).forEach(uid=>{(S.trainers[uid].rolls||[]).forEach((r,i)=>out.push(Object.assign({src:uid,i},r)));});
  ((S.battle&&S.battle.rolls)||[]).forEach((r,i)=>out.push(Object.assign({src:'gm',i},r)));
  return out.filter(r=>r&&r.at).sort((a,b)=>num(b.at)-num(a.at));
}
const hhmm=ts=>new Date(ts).toLocaleTimeString(undefined,{hour:'numeric',minute:'2-digit'});
function rollRowText(r){
  if(r.kind==='atk'){
    const bits=[];
    if(r.ac!=null)bits.push('Accuracy '+r.ac+(r.crit?' (natural 20)':''));
    if(r.dm!=null)bits.push('Damage '+r.dm);
    return bits.join(' · ')||'Used';
  }
  return String(r.total);
}
function rollLogView(limit,gm){
  const rows=allRolls().slice(0,limit||30);
  if(!rows.length)return h`<p class="sub">Nothing rolled yet. Rolls from the Trainer sheet and the Pokémon cards appear here for everyone.</p>`;
  return h`<ol class="rlog">${rows.map(r=>{
    const ap=auCanHit(r),seen=ap?auRollSeen(r):'';
    return h`<li class="${r.kind==='atk'?'atk':''}"><span class="rt">${hhmm(r.at)}</span>
      <span class="rb"><b>${r.who||'Someone'}</b>${r.pk?h` · ${r.pk}`:''} · ${r.label}${r.tn?h` <span class="sub">→ ${r.tn}</span>`:''}
        <span class="rv">${rollRowText(r)}${r.hit===true?h` <span class="pill good">Hit</span>`:r.hit===false?h` <span class="pill">Miss</span>`:''}${r.crit?h` <span class="pill gm">Crit</span>`:''}${r.ef&&r.ef!=='n'?h` <span class="pill">${EFF_LBL[r.ef]}</span>`:''}</span>
        ${r.acd||r.dmd?h`<span class="sub rd">${[r.acd,r.dmd].filter(Boolean).join(' · ')}</span>`:(r.detail?h`<span class="sub rd">${r.detail}</span>`:'')}</span>
      ${ap?(seen?h`<span class="pill">${seen==='skip'?'Skipped':'Applied'}</span>`:h`<button class="btn sm" data-act="b_apply" data-src="${r.src}" data-id="${r.id}">Apply ${r.dm} to ${r.tn||'target'}</button>`):''}</li>`;
  })}</ol>`;
}

/* ----- rolling a move from a Pokémon card ----- */
const mrKey=(uid,pid,i)=>uid+'/'+pid+'#'+i;
/* the targets a player may pick: the others in the battle, by the name everyone can see */
function btTargets(exceptRef){
  const b=S.battle||{};
  if(!b.on)return [];
  return (b.order||[]).filter(cid=>b.c&&b.c[cid]&&b.c[cid].r!==exceptRef).map(cid=>{
    const v=btInfo(cid,false);
    return v?{cid,name:v.name+(v.side==='a'?' ('+v.owner+')':'')}:null;
  }).filter(Boolean);
}
/* the passives line on a roll form: which apply on their own, and tick boxes for the situational ones */
function mrPsLine(scope,att,tgt,x){
  const aPs=att?(att.passives||att.ps||[]):[],tPs=tgt?(tgt.passives||tgt.ps||[]):null;
  const sit=psSitFor(aPs,tPs),u=scope==='mr'?S.ui.mr:S.ui.bt,tog=psTog(u);
  const auto=psKeys(aPs);
  const known=['adaptability','blaze','torrent','overgrow','swarm','angershell','ironfist','strongjaw','megalauncher','sharpness','toughclaws','punkrock','steelworker','rockypayload','waterbubble','reckless','technician','tintedlens','sniper','compoundeyes','skilllink','aerilate','pixilate','refrigerate','galvanize','liquidvoice','normalize','scrappy','moldbreaker'];
  const on=aPs.filter(p=>known.indexOf(dexKey(p.name||p.n))>=0).map(p=>p.name||p.n);
  if(!on.length&&!sit.length)return '';
  return h`<div class="psline">${on.length?h`<p class="sub">Passives counted when they apply: <b>${on.join(', ')}</b>.${tPs?' The target’s passives count too.':' A hidden foe’s passives are applied when the GM presses Apply.'}</p>`:''}
    ${sit.length?h`<div class="row evchips">${sit.map(([k,,,l])=>h`<label class="chip chkc"><input type="checkbox" data-u="${scope}.ps_${k}" data-nr ${tog[k]?raw('checked'):''}><span>${l}</span></label>`)}</div>`:''}</div>`;
}
function moveForm(uid,pid,i,x){
  const key=mrKey(uid,pid,i);
  const f=S.ui.mr;
  if(f.key!==key)return '';
  const tg=btTargets(uid+'/'+pid);
  const info=f.tgt?btInfo(f.tgt,false):null;
  const known=info&&info.types;
  const plain=isEff(x.kind);
  return h`<div class="mrform lcd" role="group" aria-label="Roll ${x.name||'move'}">
    <div class="mrgrid">
      ${tg.length?h`<label class="fld"><span class="fl">Target</span><select data-u="mr.tgt"><option value="">No target</option>${tg.map(t=>h`<option value="${t.cid}" ${f.tgt===t.cid?raw('selected'):''}>${t.name}</option>`)}</select></label>`:''}
      ${plain?'':h`<label class="fld"><span class="fl">Type advantage</span><select data-u="mr.eff">${EFF_PICK.map(([v,l])=>h`<option value="${v}" ${(f.eff||'auto')===v?raw('selected'):''}>${l}</option>`)}</select></label>`}
      <label class="fld"><span class="fl">Accuracy bonus</span><input type="number" inputmode="numeric" data-u="mr.acc" data-nr value="${f.acc||''}" placeholder="0"></label>
      <label class="fld"><span class="fl">Damage bonus</span><input type="number" inputmode="numeric" data-u="mr.dmg" data-nr value="${f.dmg||''}" placeholder="0"></label>
    </div>
    ${mrPsLine('mr',getLocal('p',uid+'/'+pid),info&&info.side==='a'?info.m:null,x)}
    ${plain?'':h`<p class="sub">${known?'Automatic uses '+info.name+'’s types, which the GM has shown.':(f.tgt?'This target’s types are hidden, so pick the advantage yourself once the GM tells you.':'Automatic treats it as neutral unless you pick a target whose types are shown.')}</p>`}
    <div class="row"><div class="seg" role="group" aria-label="Roll mode">${[['normal','Normal'],['adv','Advantage'],['dis','Disadvantage']].map(([v,l])=>h`<button data-act="adv" data-v="${v}" aria-pressed="${String(S.ui.adv===v)}">${l}</button>`)}</div>
      <label class="row"><input type="checkbox" data-u="mr.crit" data-nr ${f.crit?raw('checked'):''}><span>Critical hit (damage only)</span></label></div>
    <div class="row"><button class="btn primary sm" data-act="b_mroll" data-uid="${uid}" data-pid="${pid}" data-i="${i}">Roll attack</button>
      <button class="btn sm" data-act="b_mdmg" data-uid="${uid}" data-pid="${pid}" data-i="${i}">Damage only</button>
      <button class="btn sm ghost" data-act="b_mclose">Close</button></div>
  </div>`;
}
function moveRoll(uid,pid,i,onlyDmg){
  const m0=getLocal('p',uid+'/'+pid);
  if(!m0||!canEditT(uid))return;
  const m=Object.assign({id:pid},m0);
  const x=(m.moves||[])[i];
  if(!x)return;
  const f=S.ui.mr;
  const k=KINDS.indexOf(x.kind)>=0?x.kind:'Physical';
  const ks=kindStat(k);
  if(needDie(x,monDie(m),mName(m)+(megaOn(m)?' (Mega)':'')))return;
  const info=f.tgt?btInfo(f.tgt,false):null;
  const tgtBit=info?{cid:f.tgt,name:info.name}:null;
  const prep=auRollPrep('p',uid+'/'+pid,'moves.'+i,hbMove(x,monDie(m)),btCidOf(uid+'/'+pid),!!onlyDmg);
  if(!prep)return;
  /* a target's Defense and stages are used only when everyone can see them (a player's Pokémon always can) */
  const c=atkCalc({
    mv:prep.x,die:monDie(m),aTypes:effTypes(m),aAcc:isEff(k)?spdOf(m):effStat(m,ks.acc),aDmg:ks.dmg?effStat(m,ks.dmg):0,aStage:ks.dmg?stg(m,ks.dmg):0,
    tTypes:info?info.types:null,tDef:info&&info.stat?(isEff(k)?info.stat.spe:info.stat[fcSwapDef(f.tgt,ks.def)]):null,tStage:info&&info.stage&&ks.dmg?num(info.stage[ks.def]):0,
    eff:f.eff||'auto',accBonus:num(f.acc),dmgBonus:num(f.dmg),adv:S.ui.adv,onlyDmg:!!onlyDmg,crit:!!onlyDmg&&!!f.crit,
    aPs:m.passives,aHp:m.hp,tPs:info&&info.side==='a'?(info.m.passives||[]):null,tHp:info&&info.side==='a'?info.hp:null,tog:psTog(f),
    fcA:fcAt(btCidOf(uid+'/'+pid)),fcT:f.tgt?fcAt(f.tgt):[]
  });
  if(!c.ac&&!c.dm){toast('That move has no damage listed, so there is nothing to roll. Use Roll attack for the accuracy check.');return;}
  const who=mName(m);
  const {e,local}=atkEntry(c,who,tgtBit,false);
  logRoll(e,local);
  prep.done();
  renderRoll();
  render();
}

/* the old Pokétch box, now with attack rolls */
function renderRoll(){
  const el=$('#rollbox');
  const r=S.rolls[0];
  if(!r||S.ui.rollHidden){el.hidden=true;el.innerHTML='';return;}
  el.hidden=false;
  const head=r.kind==='atk'?(r.pk?r.pk+' · ':'')+r.label:r.label;
  const more=S.rolls.length>1?h`<ul>${S.rolls.slice(1,5).map(x=>h`<li>${x.kind==='atk'?(x.pk?x.pk+' · ':'')+x.label+': '+rollRowText(x):x.label+': '+x.total}</li>`)}</ul>`:'';
  if(r.kind==='atk'){
    el.innerHTML=h`<div class="rh"><span>Pokétch · ${head}</span><button data-act="closeRoll" aria-label="Close roll panel">×</button></div>
      <div class="two">${r.ac!=null?h`<div><span class="k">ACCURACY</span><div class="big sm">${r.ac}</div></div>`:''}${r.dm!=null?h`<div><span class="k">DAMAGE</span><div class="big sm">${r.dm}</div></div>`:''}</div>
      ${r.tn?h`<div class="det">Target: ${r.tn}${r.hit===true?' · hit':r.hit===false?' · miss':''}${r.crit?' · critical':''}</div>`:(r.crit?h`<div class="det">Critical hit</div>`:'')}
      ${r.acd?h`<div class="det dim">${r.acd}</div>`:''}${r.dmd?h`<div class="det dim">${r.dmd}</div>`:''}${more}`.s;
    return;
  }
  el.innerHTML=h`<div class="rh"><span>Pokétch · ${r.label}</span><button data-act="closeRoll" aria-label="Close roll panel">×</button></div><div class="big">${r.total}</div><div class="det">${r.detail}</div>${more}`.s;
}

/* skill and stat checks from the Trainer sheet: same roll as before, and now shared */
function doRoll(label,m,tal){
  const r1=rollOnce();
  let pick=r1,note='';
  if(S.ui.adv!=='normal'){
    const r2=rollOnce();
    const better=S.ui.adv==='adv';
    pick=(better?r2.base>r1.base:r2.base<r1.base)?r2:r1;
    note=' ('+(better?'advantage':'disadvantage')+': '+r1.base+' / '+r2.base+')';
  }
  const total=pick.base+m+tal;
  const e=chkEntry(label,total,'d20 '+pick.txt+' = '+pick.base+' + mod '+m+(tal?' + talent '+tal:'')+note);
  logRoll(e);
}

/* ---------- Combat reference: a short reminder, on the Battle page, of what afflictions, stages and field conditions do ----------
   Condensed from the PTA 3.5 Players Handbook (Afflictions, Stat Ups and Stat Downs, Field Conditions, Calculating Damage).
   It is a memory aid in plain words, not a copy of the book: the handbook has the full rules. */
S.ui.ref=S.ui.ref||{open:{},atk:'Fire',d1:'Grass',d2:''};

const AFF_GEN='Once at the start of your turn, as a free action, you may make one Affliction check to cure one of your afflictions. If you spend your whole turn standing still, you take no damage from afflictions and can still make those checks.';
const AFF_INFO=[
  ['Bound','Stuck to another character, the Binder. No held items. You cannot move unless you are heavier than the Binder (if you do, it is dragged along). Attacks on anyone but the Binder are at disadvantage, and the Binder has advantage against you. Cure check: 16, unless the Binder also rolls 16 to hold on. It ends if either of you is at 0 HP.'],
  ['Burned','Attack ▼ at the start of your turn, and lose 1d6 HP when you act. Cure check: 16 (11 if you are Ice or Water). Fire types are immune.'],
  ['Confused','Movement is halved. When you attack, roll a Confusion check: 16 or more cures you, 11 or more uses the move you chose, 10 or less uses another of your moves at random on the same target (it can hurt allies). Cure check: 16.'],
  ['Dazed','Your next attack or skill check is at disadvantage. After it, or if you take damage, you are cured and cannot be Dazed again until the end of your next turn.'],
  ['Disabled','Applies to a single move, which cannot be used until the Pokémon has been out of combat for a minute, knocked out, or returned to its ball.'],
  ['Drowsy','Movement is halved and every move or feature that is not At-Will becomes 1/day. Cure check: 16, then 14, 12, 10, 8 and 6 on later turns.'],
  ['Entranced','Movement is halved unless you move toward the Entrancer. Your attacks on the Entrancer are at disadvantage and it has advantage against you. Cure check: 16, and being hit by the Entrancer cures it. Trainers cannot be Entranced.'],
  ['Frostbitten','Sp. Attack ▼ at the start of your turn, and lose 1d6 HP when you act. Cure check: 16 (11 if you are Fire). Ice types are immune.'],
  ['Paralyzed','No held items, and Speed ▼ at the start of your turn. When you attack, roll a Paralysis check: 16 or more cures you, 11 or more lets you act normally, 10 or less gives you Speed ▼▼ (max ▼▼▼). Cure check: 16. Electric types are immune.'],
  ['Poisoned','Lose 1d10 HP when you act. Cure check: 16. Reaching 0 HP also cures it. Poison and Steel types are immune.'],
  ['Toxified','Lose 1d8 HP when you act, then 2d8, 3d8 and so on each turn until cured. Cure check: 16. Reaching 0 HP also cures it. Poison and Steel types are immune.']
];
const AFF_ALIAS={burn:'Burned',frostbite:'Frostbitten',paralysis:'Paralyzed',poison:'Poisoned',toxic:'Toxified',bind:'Bound',disable:'Disabled',confusion:'Confused',daze:'Dazed',entrance:'Entranced'};
/* a status written by hand ("burn", "Paralysis") still finds its entry */
function affInfoFor(name){
  const k=dexKey(name);
  if(!k)return null;
  const want=AFF_ALIAS[k]||null;
  return AFF_INFO.find(x=>(want&&x[0]===want)||dexKey(x[0])===k)||null;
}
/* what each active status does, under a Pokémon's status buttons */
function afflNotes(status){
  const seen=new Set();
  const rows=afflList(status).map(a=>affInfoFor(a)).filter(x=>x&&!seen.has(x[0])&&seen.add(x[0]));
  if(!rows.length)return '';
  return h`<ul class="affnotes" aria-label="What these statuses do">${rows.map(x=>h`<li><b>${x[0]}.</b> ${x[1]}</li>`)}</ul>`;
}

const STAGE_RULES=[
  'Attack ▲ or ▼ changes how many dice you roll with damaging Physical attacks. Sp. Attack does the same for Special attacks.',
  'Defense ▲ or ▼ changes how many dice are rolled against you by Physical attacks. Sp. Defense does the same for Special attacks.',
  'Speed ▲ or ▼ changes your Speed stat itself, by 5 for each step. That can change the turn order, and it makes Effect moves easier or harder to land. Speed ▼ never lowers your movement below 10 ft.',
  'In the Battle page, each step is one die: a ▲ on the attacker or a ▼ on the target adds a die, and the reverse removes one.',
  '▲ and ▼ in the same stat cancel one for one (Attack ▲▲ and Attack ▼ leave Attack ▲).',
  'They do not stack with themselves: getting ▲ while you already have ▲▲ leaves ▲▲. Effects written “(Max ▲▲)” stack, but only up to that maximum.'
];
const FIELD_INFO=[
  ['Terrain',[
    ['Electric','Grounded Pokémon are immune to Drowsy and Entranced. Electric attacks +4.'],
    ['Flowery','At the start of their turns, Fairy and Grass types get Defense ▲ or Sp. Defense ▲. Fairy and Grass attacks +4.'],
    ['Grassy','Anyone who acts recovers 1d8 HP afterward. Grass attacks +4.'],
    ['Misty','Dragon attacks are resisted unless the target already resists them, and nobody can be given afflictions. Fairy attacks +4.'],
    ['Muddy','Electric attacks −8, Ground attacks +4.'],
    ['Psychic','Grounded Pokémon take no damage from Reaction or Priority moves used out of turn. Psychic attacks +4.'],
    ['Wet','Fire attacks −8, Water attacks +4. Flopper and Beached skills are ignored.']
  ]],
  ['Weather',[
    ['Hailing','Anyone who acts takes 2d4 afterward unless Ice. Ice attacks +4.'],
    ['Hazy','Anyone who acts loses all stat ▲ and ▼. Attacks cannot add bonuses to their accuracy.'],
    ['Misty','Nobody can be given ▼. Fairy and Ghost attacks +4.'],
    ['Pyroclastic','Anyone who acts takes 2d4 afterward unless Fire. Fire attacks +4.'],
    ['Raining','Water attacks +4, Fire attacks −8.'],
    ['Sandstorming','Anyone who acts takes 2d4 afterward unless Ground, Rock or Steel. Rock attacks +4.'],
    ['Snowy','Ice types get Defense ▲ or Sp. Defense ▲ at the start of their turns. Ice attacks +4.'],
    ['Sunny','Fire attacks +4, Water attacks −8.'],
    ['Gusty','Flying types and their adjacent allies get Speed ▲ at the start of their turns. Flying attacks +4.']
  ]],
  ['Zone',[
    ['Gravitized','Nobody can leave the ground, attacks get +1 accuracy, and Ground immunities become resistances.'],
    ['Ionic','All Normal moves are treated as Electric.'],
    ['Magical','Held items lose their effects and medicine items cannot be used (Mega Stones and Z-Crystals still work).'],
    ['Tricky','The initiative order is reversed, and a Priority move used out of turn acts last instead of first.'],
    ['Wonderful','Defense and Sp. Defense are swapped.']
  ]]
];
const ROLL_RULES=[
  'Accuracy check: d20 plus the stat modifier of the attacker (Attack, Sp. Attack, or Speed for Effect moves). It hits if it meets the target’s Defense, Sp. Defense, or Speed. A natural 20 is a critical hit: every damage die counts as its top face.',
  'Damage: the move’s dice, plus the stat modifier. Add 4 if the move’s type matches one of the user’s types.',
  'Type matchups change the dice: super effective +1 die, extremely effective +2, resisted −1, shielded −2, and no effect means no damage.',
  'Stages change the dice too (see Stat ▲ and ▼). Effect moves roll accuracy only.'
];

/* ----- the type matchup helper ----- */
function matchupView(){
  const r=S.ui.ref;
  const def=[r.d1,r.d2].filter(Boolean).filter((x,i,a)=>a.indexOf(x)===i);
  const e=r.atk&&def.length?effOf(r.atk,def):null;
  const groups=[['x','Extremely effective against it (+2 dice)'],['s','Super effective (+1 die)'],['r','Resisted (−1 die)'],['h','Shielded (−2 dice)'],['i','No effect']];
  const by={x:[],s:[],r:[],h:[],i:[]};
  if(def.length)TYPES.forEach(a=>{const g=effOf(a,def);if(by[g.c])by[g.c].push(a);});
  const opt=(v,cur,blank)=>h`${blank?h`<option value="">${blank}</option>`:''}${TYPES.map(t=>h`<option value="${t}" ${cur===t?raw('selected'):''}>${t}</option>`)}`;
  return h`<div class="mrgrid refmx">
      <label class="fld"><span class="fl">A move of type</span><select data-u="ref.atk">${opt('atk',r.atk,'Pick a type')}</select></label>
      <label class="fld"><span class="fl">hits a Pokémon of type</span><select data-u="ref.d1">${opt('d1',r.d1,'Pick a type')}</select></label>
      <label class="fld"><span class="fl">and (optional)</span><select data-u="ref.d2">${opt('d2',r.d2,'No second type')}</select></label>
    </div>
    ${e?h`<p class="refres" role="status"><span class="ty ${r.atk.toLowerCase()}">${r.atk}</span> on ${chipsOf(def)}: <b>${EFF_LBL[e.c]}</b>${e.d?' ('+(e.d>0?'+':'−')+dieWord(e.d)+')':''}</p>`:h`<p class="sub">Pick an attacking type and at least one defending type.</p>`}
    ${def.length?h`<div class="refgrps"><p class="fl">What hits ${def.join(' / ')} (every attacking type)</p>
      ${groups.map(([c,l])=>by[c].length?h`<div class="refgrp"><span class="sub">${l}</span><div class="types">${chipsOf(by[c])}</div></div>`:'')}</div>`:''}`;
}

/* ----- the panel ----- */
function refSec(k,title,body){
  const open=!!S.ui.ref.open[k];
  return h`<div class="refsec"><button class="refh" data-act="b_ref" data-k="${k}" aria-expanded="${String(open)}"><span>${title}</span><span class="refx" aria-hidden="true">${open?'−':'+'}</span></button>${open?h`<div class="refb">${body}</div>`:''}</div>`;
}
function refPanel(){
  return h`<section class="panel refp"><div class="ph"><h2>Combat reference</h2></div>
    <p class="sub">A quick reminder in plain words. The handbook has the full rules.</p>
    ${refSec('aff','Afflictions',h`<p class="sub">${AFF_GEN}</p><dl class="refdl">${AFF_INFO.map(x=>h`<dt>${x[0]}</dt><dd>${x[1]}</dd>`)}</dl>`)}
    ${refSec('stg','Stat ▲ and ▼',h`<ul class="reful">${STAGE_RULES.map(x=>h`<li>${x}</li>`)}</ul>`)}
    ${refSec('fld','Weather, terrain and zones',h`<p class="sub">Each lasts two minutes, centred on whoever created it. A new one of the same kind replaces the old.</p>${FIELD_INFO.map(([g,l])=>h`<h3 class="refg">${g}</h3><dl class="refdl">${l.map(x=>h`<dt>${x[0]}</dt><dd>${x[1]}</dd>`)}</dl>`)}`)}
    ${refSec('typ','Type matchups',matchupView())}
    ${refSec('rol','Rolls at a glance',h`<ul class="reful">${ROLL_RULES.map(x=>h`<li>${x}</li>`)}</ul>`)}
  </section>`;
}

