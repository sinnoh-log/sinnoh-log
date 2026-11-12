const {open}=require('./lib');
let fails=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fails++;};
const click=(p,a)=>p.evaluate(a=>{const b=document.createElement('button');Object.entries(a).forEach(([k,v])=>b.dataset[k]=v);b.hidden=true;document.body.appendChild(b);b.click();},a);
const upd=(p,path,o)=>p.evaluate(([a,b])=>window.__db.doc(a).set(b,{merge:true}),[path,o]);
const get=(p,path)=>p.evaluate(a=>window.__store.get(a),path);
let CID='c1';
const foe=async p=>((await get(p,'gm/battle'))||{}).foes[CID];
const fresh=()=>({sp:'Rattata',nick:'',ty:['Normal'],sz:'Small',wt:'Light',hp:{cur:20,max:20},base:{atk:3,def:3,spa:3,spd:5,spe:3},mv:[{name:'Tackle',freq:'At-Will',kind:'Physical',range:'Melee',type:'Normal',dice:'2d6',text:'',used:0}],ps:[{name:'Run Away',text:'x'}],notes:'',sh:{},stages:{atk:0,def:0,spa:0,spd:0,spe:0},ini:5,bonus:{atk:0,def:0,spa:0,spd:0,spe:0}});
(async()=>{
  const {b,p,errs}=await open({admin:true,uid:'u1',tab:'battle'});
  await p.fill('input[data-u="bt.foeSp"]','Rattata');await p.dispatchEvent('input[data-u="bt.foeSp"]','input');await click(p,{act:'b_addfoe'});await p.waitForTimeout(1500);
  CID=Object.keys(((await get(p,'gm/battle'))||{}).foes)[0];
  await upd(p,'gm/battle',{foes:{[CID]:fresh()}});await p.waitForTimeout(500);
  await click(p,{act:'b_open',cid:CID});await p.waitForTimeout(600);await click(p,{act:'toggle',key:'edf'+CID});await p.waitForTimeout(500);
  { const t0=await p.evaluate(()=>document.body.innerText); ok(/Kind of wild Pokémon|Choose a kind to apply/.test(t0)||/Normal\s*Alpha\s*Totem\s*Titan/.test(t0),'foe sheet is open and the Kind row is visible'); }
  // ALPHA 3.5 content
  await click(p,{act:'b_kind',cid:CID,k:'alpha'});await p.waitForTimeout(900);
  let f=await foe(p);const mvn=n=>f.mv.find(x=>x.name===n),psn=n=>f.ps.find(x=>x.name===n);
  ok(mvn('Alpha Beam')&&mvn('Alpha Beam').dice==='4d12'&&mvn('Alpha Beam').kind==='Special'&&/35ft/.test(mvn('Alpha Beam').range),'alpha beam: 4d12 Special, 35ft beam');
  ok(mvn('Alpha Impact')&&mvn('Alpha Impact').dice==='4d12'&&mvn('Alpha Impact').kind==='Physical'&&/10ft/.test(mvn('Alpha Impact').range),'alpha impact: 4d12 Physical, 10ft burst');
  ok(/3 other Normal-type moves/.test(mvn('Alpha Beam').text)&&/\+2d power/.test(mvn('Alpha Beam').text)&&/Must Recharge/.test(mvn('Alpha Beam').text)&&!/Accuracy/.test(mvn('Alpha Beam').text),'alpha beam text: +2d rider, Recharge, no accuracy penalty');
  ok(/heal 15 HP/.test(mvn('Alpha Restoration').text)&&!/1d12/.test(mvn('Alpha Restoration').text)&&mvn('Alpha Restoration').freq==='3/day','alpha restoration: flat 15 HP, 3/day');
  ok(/^Temporary Passive/.test(psn('Alpha Tenacity').text)&&/^Temporary Passive/.test(psn('Wild Might').text)&&/limit of four Passives/.test(psn('Wild Alpha Aura').text),'alpha passives are marked temporary');
  ok(f.kd&&f.kd.v===2,'alpha: kd.v is 2');
  ok(f.hp.max===40&&f.bonus.atk===5&&f.bonus.spa===5&&f.bonus.spd===10,'alpha: HP and stat bonuses unchanged');
  let t=await p.evaluate(()=>document.body.innerText);
  ok(!/older 3\.0 text/.test(t),'fresh alpha: no outdated-text notice');
  // TOTEM
  await click(p,{act:'b_kind',cid:CID,k:'totem'});await p.waitForTimeout(900);
  f=await foe(p);
  ok(/flat \+2 to Attack and Special Attack \(not ▲\)/.test(mvn('Totemic Power').text)&&/can stack/.test(mvn('Totemic Power').text),'totemic power: flat +2, can stack');
  ok(/flat \+2 to Attack and Special Attack \(not ▲\)/.test(mvn('Totemic Call').text),'totemic call: flat +2');
  ok(/^Temporary Passive/.test(psn('Totemic Tenacity').text)&&/^Temporary Passive/.test(psn('Totemic Spirit').text),'totem passives marked temporary');
  ok(mvn('Totemic Guardian')&&/3d8/.test(mvn('Totemic Guardian').dice),'totemic guardian: 3d8 unchanged ('+(mvn('Totemic Guardian')||{}).dice+')');
  // TITAN
  await click(p,{act:'b_kind',cid:CID,k:'titan'});await p.waitForTimeout(900);
  f=await foe(p);
  ok(f.ps.filter(x=>/^Temporary Passive/.test(x.text)).length===3,'titan: all three passives marked temporary');
  ok(f.hp.max===200&&f.kd.v===2,'titan: HP x10 and kd.v 2');
  // OLDER FOE (3.0 text, no kd.v) shows the notice, and re-tapping refreshes it
  const old=Object.assign(fresh(),{kind:'alpha',kd:{mul:2,v:0},nick:'Alpha Rattata',hp:{cur:30,max:40},bonus:{atk:5,def:0,spa:5,spd:10,spe:0},
    ps:[{name:'Wild Alpha Aura',text:'old'},{name:'Alpha Tenacity',text:'old'},{name:'Wild Might',text:'old'},{name:'Run Away',text:'x'}],
    mv:[{name:'Tackle',freq:'At-Will',kind:'Physical',range:'Melee',type:'Normal',dice:'2d6',text:'',used:0},{name:'Alpha Beam',freq:'1/day',kind:'Special',range:'Ranged (25ft beam)',type:'Normal',dice:'5d20',text:'old',used:0},{name:'Alpha Impact',freq:'1/day',kind:'Physical',range:'Melee (10ft burst)',type:'Normal',dice:'5d20',text:'old',used:0},{name:'Alpha Restoration',freq:'3/day',kind:'Effect',range:'Self',type:'Normal',dice:'',text:'old',used:0}]});
  await upd(p,'gm/battle',{foes:{[CID]:old}});await p.waitForTimeout(900);
  t=await p.evaluate(()=>document.body.innerText);
  ok(/older 3\.0 text/.test(t),'older alpha: shows the 3.0-text notice');
  await click(p,{act:'b_kind',cid:CID,k:'alpha'});await p.waitForTimeout(1000);
  f=await foe(p);
  ok(f.kd.v===2&&f.mv.find(x=>x.name==='Alpha Beam').dice==='4d12'&&f.ps.find(x=>x.name==='Wild Might').text.startsWith('Temporary Passive'),'older alpha: re-tap refreshes to 3.5 text');
  ok(f.hp.max===40&&f.hp.cur===30,'older alpha: HP kept in proportion ('+JSON.stringify(f.hp)+')');
  ok(f.bonus.atk===5&&f.bonus.spa===5&&f.bonus.spd===10,'older alpha: bonuses not stacked');
  ok(f.mv.filter(x=>x.name==='Alpha Beam').length===1&&f.ps.filter(x=>x.name==='Wild Might').length===1&&f.nick==='Alpha Rattata','older alpha: no duplicate moves, passives or name');
  t=await p.evaluate(()=>document.body.innerText);
  ok(!/older 3\.0 text/.test(t),'older alpha: notice gone after refresh');
  // UNDO from a refreshed alpha
  await click(p,{act:'b_kind',cid:CID,k:''});await p.waitForTimeout(900);
  f=await foe(p);
  ok(!f.kind&&f.hp.max===20&&f.hp.cur===15&&f.mv.length===1&&f.ps.length===1&&f.nick==='','undo from refreshed alpha: back to normal');
  // NO notice on a normal foe, and no notice on kind pickers
  t=await p.evaluate(()=>document.body.innerText);
  ok(!/older 3\.0 text/.test(t),'normal foe: no notice');
  // GIVE: knocked out vs awake. The note goes to the status line (last) and to the Pokémon's GM-only private notes.
  const caughtIds=()=>p.evaluate(()=>{const o=[];window.__store.forEach((v,k)=>{if(/^trainers\/u1\/pokemon\//.test(k)&&v&&v.caught&&/Caught in the wild/.test(v.caught))o.push(k.split('/').pop());});return o;});
  for(const k of ['alpha','totem','titan']){
    for(const ko of [true,false]){
      await upd(p,'gm/battle',{foes:{[CID]:fresh()}});await p.waitForTimeout(600);
      await click(p,{act:'b_kind',cid:CID,k});await p.waitForTimeout(800);
      {const g=await foe(p);g.hp={cur:ko?0:g.hp.max-1,max:g.hp.max};await upd(p,'gm/battle',{foes:{[CID]:g}});await p.waitForTimeout(600);}
      const before=await caughtIds();
      await click(p,{act:'b_give',cid:CID});await p.waitForTimeout(700);
      const status=await p.evaluate(()=>(document.getElementById('savestate')||{}).textContent||'');
      const after=await caughtIds();const pid=after.find(x=>!before.includes(x));
      const gl=pid?await get(p,'gm/loy_'+pid):null;
      const label=k+' '+(ko?'knocked out':'awake');
      ok(!!pid,label+': Pokémon created');
      ok(/now belongs to/.test(status)&&/private GM notes/.test(status),label+': status line still shows the note after the writes start ('+status.slice(0,60)+'…)');
      ok(!!gl&&/^Capture note:/.test(gl.note||'')&&gl.pid===pid&&gl.uid==='u1',label+': note saved in the GM private notes');
      ok(!!gl&&/starts at Loyalty 0/.test(gl.note||'')===ko&&(ko?gl.loyalty===0:gl.loyalty===undefined),label+': Loyalty 0 '+(ko?'set and noted':'not set, not noted'));
      if(k!=='totem')ok(!!gl&&/more than four Passives/.test(gl.note||''),label+': "more than four Passives" wording');
    }
  }
  ok(errs.length===0,'no page errors ('+errs.slice(0,3).join(' | ')+')');
  await b.close();console.log(fails?fails+' FAILED':'ALL PASSED');
})();
