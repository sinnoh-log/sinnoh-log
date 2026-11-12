const {open}=require('./lib');
let fails=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fails++;};
const click=(p,a)=>p.evaluate(a=>{const b=document.createElement('button');Object.entries(a).forEach(([k,v])=>b.dataset[k]=v);b.hidden=true;document.body.appendChild(b);b.click();},a);
const upd=(p,path,o)=>p.evaluate(([a,b])=>window.__db.doc(a).set(b,{merge:true}),[path,o]);
const get=(p,path)=>p.evaluate(a=>window.__store.get(a),path);
const foe=async p=>((await get(p,'gm/battle'))||{}).foes.c1;
(async()=>{
  const {b,p,errs}=await open({admin:true,uid:'u1',tab:'battle'});
  const fresh=()=>({sp:'Rattata',nick:'',ty:['Normal'],sz:'Small',wt:'Light',hp:{cur:20,max:20},base:{atk:3,def:3,spa:3,spd:5,spe:3},mv:[{name:'Tackle',freq:'At-Will',kind:'Physical',range:'Melee',type:'Normal',dice:'2d6',text:'',used:0}],ps:[{name:'Run Away',text:'x'}],notes:'my note',sh:{},stages:{atk:0,def:0,spa:0,spd:0,spe:0},ini:5,bonus:{atk:0,def:0,spa:0,spd:0,spe:0}});
  await upd(p,'gm/battle',{foes:{c1:fresh()}});await p.waitForTimeout(400);
  // ALPHA
  await click(p,{act:'b_kind',cid:'c1',k:'alpha'});await p.waitForTimeout(1000);
  let f=await foe(p);
  ok(f.kind==='alpha'&&f.hp.max===40&&f.hp.cur===40,'alpha: HP doubled to 40/40 ('+JSON.stringify(f.hp)+')');
  ok(f.bonus.atk===5&&f.bonus.spa===5,'alpha: +5 Attack and Sp. Attack');
  ok(f.bonus.spd===10&&f.bonus.def===0,'alpha: the better defense (Sp. Def 5) raised to 15 (adj '+f.bonus.spd+')');
  ok(f.ps.some(x=>x.name==='Wild Alpha Aura')&&f.mv.length===4&&f.mv.some(x=>x.name==='Alpha Beam'),'alpha: passives and the three alpha moves added');
  ok(f.nick==='Alpha Rattata','alpha: named Alpha Rattata');
  // damage then switch to TOTEM
  {const g=await foe(p);g.hp={cur:30,max:40};await upd(p,'gm/battle',{foes:{c1:g}});await p.waitForTimeout(800);}
  await click(p,{act:'b_kind',cid:'c1',k:'totem'});await p.waitForTimeout(1000);
  f=await foe(p);
  ok(f.kind==='totem'&&f.hp.max===40&&f.hp.cur===30,'totem from a hurt alpha: HP back to 20 then doubled again, 30/40 kept ('+JSON.stringify(f.hp)+')');
  ok(f.bonus.atk===5&&f.bonus.spa===5&&f.bonus.spd===10,'totem: stat adjustments not stacked');
  ok(!f.ps.some(x=>/Alpha/.test(x.name))&&f.ps.some(x=>x.name==='Totemic Tenacity')&&f.mv.filter(x=>/Totemic/.test(x.name)).length===3&&!f.mv.some(x=>/Alpha/.test(x.name)),'totem: alpha parts gone, totem passives and 3 totem moves in');
  ok(f.nick==='Totem Rattata','totem: renamed');
  ok((f.notes.match(/ALPHA|TOTEM/g)||[]).length===1&&/my note/.test(f.notes),'notes: one kind line, own note kept');
  // TITAN
  await click(p,{act:'b_kind',cid:'c1',k:'titan'});await p.waitForTimeout(1000);
  f=await foe(p);
  ok(f.kind==='titan'&&f.hp.max===200&&f.hp.cur===150,'titan: max HP x10 (200), proportion kept ('+JSON.stringify(f.hp)+')');
  ok(f.sz==='Huge'&&f.wt==='Superweight','titan: size Huge, weight Superweight');
  ok(f.bonus.atk===0&&f.bonus.spa===0&&f.bonus.spd===0,'titan: no stat bonuses left over from the totem');
  ok(f.ps.some(x=>x.name==='Massive Impacts')&&!f.ps.some(x=>x.name==='Totemic Tenacity')&&!f.mv.some(x=>/Totemic/.test(x.name)),'titan: passives in, totem parts out');
  // capture panel reads it
  await click(p,{act:'cc_use',cid:'c1'});await p.waitForTimeout(1000);
  let t=await p.evaluate(()=>document.body.innerText);
  ok(/Titan cannot be caught with anything but a Master Ball/.test(t)||/not with this ball/.test(t),'catch calculator: titan blocked for normal balls');
  // UNDO
  await click(p,{act:'b_kind',cid:'c1',k:''});await p.waitForTimeout(1000);
  f=await foe(p);
  const base=fresh();
  ok(!f.kind&&f.hp.max===20&&f.hp.cur===15,'normal: HP back to 20 (15 left) ('+JSON.stringify(f.hp)+')');
  ok(f.sz==='Small'&&f.wt==='Light','normal: size and weight restored');
  ok(f.bonus.atk===0&&f.bonus.def===0&&f.bonus.spa===0&&f.bonus.spd===0,'normal: adjustments back to zero');
  ok(f.ps.length===1&&f.ps[0].name==='Run Away'&&f.mv.length===1&&f.mv[0].name==='Tackle','normal: original passive and move only');
  ok(f.nick===''&&f.notes==='my note','normal: name and note restored');
  // an older foe with only the alpha flag undoes too
  await upd(p,'gm/battle',{foes:{c1:Object.assign(fresh(),{alpha:1,alMax:20,hp:{cur:40,max:40},bonus:{atk:5,def:0,spa:5,spd:10,spe:0},nick:'Alpha Rattata',ps:[{name:'Wild Alpha Aura',text:''},{name:'Run Away',text:'x'}],mv:[{name:'Alpha Beam',freq:'1/day',kind:'Special',range:'',type:'Normal',dice:'5d20',text:'',used:0}],kind:'',kd:{}})}});await p.waitForTimeout(1000);
  await click(p,{act:'b_kind',cid:'c1',k:''});await p.waitForTimeout(1000);
  f=await foe(p);
  ok(!f.alpha&&f.hp.max===20&&f.bonus.atk===0&&f.bonus.spa===0&&f.nick==='','older alpha flag foe: undone cleanly');
  ok(errs.length===0,'no page errors ('+errs.slice(0,3).join(' | ')+')');
  await b.close();console.log(fails?fails+' FAILED':'ALL PASSED');
})();
