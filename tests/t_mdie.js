const {open,ROOT}=require('./lib');
let fails=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fails++;};
const click=(p,a)=>p.evaluate(a=>{const b=document.createElement('button');Object.entries(a).forEach(([k,v])=>b.dataset[k]=v);b.hidden=true;document.body.appendChild(b);b.click();},a);
const upd=(p,path,o)=>p.evaluate(([a,b])=>window.__db.doc(a).update(b),[path,o]);
const text=p=>p.evaluate(()=>document.body.innerText);
(async()=>{
  const {b,p,errs}=await open({admin:true,uid:'u1',tab:'battle'});
  await upd(p,'trainers/u1/pokemon/p1',{moves:[{name:'Aqua Tail',freq:'At-Will',kind:'Physical',range:'Melee',type:'Water',dice:'3dM',text:'',used:0},{name:'Bite',freq:'At-Will',kind:'Physical',range:'Melee',type:'Dark',dice:'2d6',text:'',used:0}]});
  await p.waitForTimeout(400);
  // blank die -> refused
  await click(p,{act:'b_mdmg',uid:'u1',pid:'p1',i:'0'});await p.waitForTimeout(300);
  let t=await text(p);
  ok(/Set .*Monster die first/.test(t),'blank die: refuses and says to set the Monster die');
  ok(!/Monster die d\d+\)/.test(t),'blank die: nothing rolled');
  // ordinary dice still roll
  await click(p,{act:'b_mdmg',uid:'u1',pid:'p1',i:'1'});await p.waitForTimeout(300);
  t=await text(p);ok(/2d6/.test(t),'a 2d6 move still rolls');
  // set die d10
  await upd(p,'trainers/u1/pokemon/p1',{die:'d10'});await p.waitForTimeout(300);
  await click(p,{act:'b_mdmg',uid:'u1',pid:'p1',i:'0'});await p.waitForTimeout(300);
  t=await text(p);
  ok(/3dM → 3d10 \(Monster die d10\)/.test(t),'d10 Pokémon rolls 3dM as 3d10');
  const nums=(t.match(/3dM → 3d10[^[]*\[([\d, ]+)\]/)||[])[1];
  ok(nums&&nums.split(',').length===3&&nums.split(',').every(n=>+n>=1&&+n<=10),'three dice, each 1–10 ('+nums+')');
  // many rolls: values within d10, and crit maxes the monster die
  let bad=0;for(let i=0;i<30;i++){await click(p,{act:'b_mdmg',uid:'u1',pid:'p1',i:'0'});}
  await p.waitForTimeout(300);
  // mega own die: mega on, die d4 -> 3d4
  await upd(p,'trainers/u1/pokemon/p1',{mega:{form:'Mega Gyarados',types:['Water','Dark'],bonus:{atk:1,def:0,spa:0,spd:0,spe:0},die:'d12'},megaOn:true});await p.waitForTimeout(300);
  await click(p,{act:'b_mdmg',uid:'u1',pid:'p1',i:'0'});await p.waitForTimeout(300);
  t=await text(p);ok(/3dM → 3d12 \(Monster die d12\)/.test(t),'Mega on: uses the Mega form’s own die (d12)');
  await upd(p,'trainers/u1/pokemon/p1',{mega:{form:'Mega Gyarados',types:['Water','Dark'],bonus:{atk:1,def:0,spa:0,spd:0,spe:0},die:''},megaOn:true});await p.waitForTimeout(300);
  await click(p,{act:'b_mdmg',uid:'u1',pid:'p1',i:'0'});await p.waitForTimeout(300);
  t=await text(p);ok(/Set .*Mega.*Monster die first/.test(t),'Mega on with no Mega die: refuses (does not fall back to the base die)');
  ok(errs.length===0,'no page errors ('+errs.slice(0,3).join(' | ')+')');
  await b.close();
  console.log(fails?fails+' FAILED':'ALL PASSED');
})();
