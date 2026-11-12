const {open,ROOT}=require('./lib');
let fails=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fails++;};
const click=(p,a)=>p.evaluate(a=>{const b=document.createElement('button');Object.entries(a).forEach(([k,v])=>b.dataset[k]=v);b.hidden=true;document.body.appendChild(b);b.click();},a);
const upd=(p,path,o)=>p.evaluate(([a,b])=>window.__db.doc(a).set(b,{merge:true}),[path,o]);
const text=p=>p.evaluate(()=>document.body.innerText);
(async()=>{
  const {b,p,errs}=await open({admin:true,uid:'u1',tab:'battle'});
  const mv=[{name:'Body Slam',freq:'At-Will',kind:'Physical',range:'Melee',type:'Normal',dice:'3dM',text:'',used:0}];
  await upd(p,'gm/battle',{foes:{c1:{sp:'Rattata',nick:'',ty:['Normal'],hp:{cur:20,max:20},base:{atk:3,def:3,spa:3,spd:3,spe:3},mv,ps:[],sh:{},stg:{},ini:5}}});
  await p.waitForTimeout(500);
  await click(p,{act:'b_fmdmg',cid:'c1',i:'0'});await p.waitForTimeout(300);
  let t=await text(p);ok(/Set .*Monster die first/.test(t),'foe with no die: refuses');
  await upd(p,'gm/battle',{foes:{c1:{sp:'Rattata',nick:'',ty:['Normal'],hp:{cur:20,max:20},base:{atk:3,def:3,spa:3,spd:3,spe:3},mv,ps:[],sh:{},stg:{},ini:5,die:'d8'}}});await p.waitForTimeout(300);
  await click(p,{act:'b_fmdmg',cid:'c1',i:'0'});await p.waitForTimeout(300);
  t=await text(p);console.log(t.split('\n').filter(l=>/Monster|dM|Body Slam|Damage/.test(l)).slice(0,6).join(' // '));ok(/3dM → 3d8 \(Monster die d8\)/.test(t),'foe d8 rolls 3dM as 3d8');
  // crit on a player's roll: every die is the top face
  await upd(p,'trainers/u1/pokemon/p1',{die:'d10',moves:[{name:'Aqua Tail',freq:'At-Will',kind:'Physical',range:'Melee',type:'Water',dice:'3dM',text:'',used:0}]});await p.waitForTimeout(300);
  await click(p,{act:'b_mopen',uid:'u1',pid:'p1',i:'0'});await p.waitForTimeout(300);
  const cb=p.locator('input[data-u="mr.crit"]');
  if(await cb.count()){await cb.check();}else{await p.evaluate(()=>{const i=document.createElement('input');i.type='checkbox';i.dataset.u='mr.crit';i.dataset.nr='1';i.hidden=true;document.body.appendChild(i);i.checked=true;i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));});}
  await p.waitForTimeout(200);
  await click(p,{act:'b_mdmg',uid:'u1',pid:'p1',i:'0'});await p.waitForTimeout(300);
  t=await text(p);
  console.log(t.split('\n').filter(l=>/dM|critical|Aqua/.test(l)).slice(0,6).join(' // '));
  const m=t.match(/3dM → 3d10[^[]*critical[^[]*\[([\d, ]+)\]/);
  ok(!!m&&m[1].split(',').every(n=>+n===10),'crit: every die shows the top face of the Monster die ('+(m&&m[1])+')');
  ok(errs.length===0,'no page errors ('+errs.slice(0,3).join(' | ')+')');
  await b.close();console.log(fails?fails+' FAILED':'ALL PASSED');
})();
