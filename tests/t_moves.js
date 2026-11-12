const {open,ROOT}=require('./lib');
let fails=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fails++;};
const card=(p,n)=>p.locator('.mvxc',{has:p.locator('.mvxn',{hasText:new RegExp('^'+n+'$')})});
const btn=(p,n)=>card(p,n).locator('button[data-act="mvx_add"]');
const monMoves=(p,uid,id)=>p.evaluate(([u,i])=>(window.__store.get('trainers/'+u+'/pokemon/'+i).moves||[]).map(m=>m.name),[uid,id]);
const search=async(p,q)=>{await p.fill('input[data-u="mvx.q"]',q);await p.waitForTimeout(150);};
(async()=>{
  // ---- player
  let {b,p,errs}=await open({admin:false,uid:'u1',tab:'moves'});
  await p.selectOption('select[data-u="mvx.mon"]','p1');await p.waitForTimeout(200);
  await search(p,'Dragon Dance');
  ok(await card(p,'Dragon Dance').count()===1,'Dragon Dance card found');
  ok(!(await btn(p,'Dragon Dance').isDisabled()),'Gyarados: Add enabled for Dragon Dance');
  await btn(p,'Dragon Dance').click();await p.waitForTimeout(600);
  ok((await monMoves(p,'u1','p1')).includes('Dragon Dance'),'Dragon Dance written to the Pokémon in the database');
  ok((await btn(p,'Dragon Dance').textContent()).includes('Already known'),'button now says Already known');
  await search(p,'Aqua Cutter');
  ok(await btn(p,'Aqua Cutter').isDisabled(),'Gyarados: Aqua Cutter blocked');
  ok((await btn(p,'Aqua Cutter').textContent()).includes('can’t learn'),'blocked label says it can’t learn it');
  await p.selectOption('select[data-u="mvx.mon"]','p3');await p.waitForTimeout(200);
  ok(!(await btn(p,'Aqua Cutter').isDisabled()),'Veluza: Aqua Cutter enabled');
  await btn(p,'Aqua Cutter').click();await p.waitForTimeout(500);
  ok((await monMoves(p,'u1','p3')).includes('Aqua Cutter'),'Veluza learned Aqua Cutter');
  // style warning: Gyarados has Dragon Dance (Style); Intimidate is another Style it can learn
  await p.selectOption('select[data-u="mvx.mon"]','p1');await search(p,'Intimidate');
  ok(!(await btn(p,'Intimidate').isDisabled()),'Gyarados can learn Intimidate');
  await btn(p,'Intimidate').click();await p.waitForTimeout(300);
  ok(!(await monMoves(p,'u1','p1')).includes('Intimidate'),'second Style needs a second tap');
  ok((await btn(p,'Intimidate').textContent()).includes('Tap again'),'button asks for a second tap');
  await btn(p,'Intimidate').click();await p.waitForTimeout(500);
  ok((await monMoves(p,'u1','p1')).includes('Intimidate'),'second tap adds the Style move');
  // filters
  await search(p,'');await p.selectOption('select[data-u="mvx.grp"]','~gm');await p.waitForTimeout(200);
  const names=await p.locator('.mvxc .mvxn').allTextContents();
  ok(JSON.stringify(names.sort())===JSON.stringify(['Arena Trap','Migraine','Tea Time']),'By GM decision filter shows exactly 3 moves: '+names.join(', '));
  await p.selectOption('select[data-u="mvx.grp"]','Slashing');await p.waitForTimeout(200);
  ok((await p.locator('.mvxc').count())>5,'Slashing group filter lists moves');
  await p.selectOption('select[data-u="mvx.grp"]','');await p.selectOption('select[data-u="mvx.ct"]','Cute');await p.waitForTimeout(200);
  const ct=await p.locator('.mvxct').allTextContents();
  ok(ct.length>0&&ct.every(t=>t.includes('Cute')),'contest type filter only shows Cute moves');
  await p.screenshot({path:ROOT+'/tests/out/moves2.png'});
  ok(errs.length===0,'no page errors ('+errs.slice(0,3).join(' | ')+')');
  await b.close();
  // ---- admin
  ({b,p,errs}=await open({admin:true,uid:'u1',tab:'moves'}));
  await p.selectOption('select[data-u="mvx.mon"]','p2');await p.waitForTimeout(200);
  await search(p,'Aqua Cutter');
  ok((await btn(p,'Aqua Cutter').textContent()).includes('Add anyway (GM)'),'GM sees Add anyway for Magikarp');
  await btn(p,'Aqua Cutter').click();await p.waitForTimeout(500);
  ok((await monMoves(p,'u1','p2')).includes('Aqua Cutter'),'GM override wrote the move');
  ok(errs.length===0,'admin: no page errors ('+errs.slice(0,3).join(' | ')+')');
  await b.close();
  console.log(fails?fails+' FAILED':'ALL PASSED');
})();
