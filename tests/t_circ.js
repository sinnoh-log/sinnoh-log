const {open,ROOT}=require('./lib');
let fails=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fails++;};
const cardOf=(p,n)=>p.locator('article.tcard',{has:p.locator('h3',{hasText:n})});
(async()=>{
  let {b,p,errs}=await open({admin:false,uid:'u1',tab:'overview'});
  ok(await p.locator('article.tcard').count()===4,'overview shows 4 trainer cards');
  const t=async n=>(await cardOf(p,n).first().innerText()).replace(/\s+/g,' ');
  const m=await t('Mira'),j=await t('Jonas'),c=await t('Cora'),i=await t('Ines');
  ok(/CHALLENGER/i.test(m)&&/Ribbons/i.test(m)&&/Badges/i.test(m),'Mira (both): League Card with Badges and Ribbons');
  ok(/CHALLENGER/i.test(c)&&/Badges/i.test(c)&&!/Ribbons/i.test(c),'Cora (Gym only): Badges, no Ribbons');
  ok(/COORDINATOR/i.test(i)&&/Ribbons/i.test(i)&&!/Badges/i.test(i),'Ines (Contest only): Ribbons, no Badges');
  ok(/TRAINER ID/i.test(j)&&/Class/i.test(j)&&/ID No/i.test(j)&&!/CHALLENGER/i.test(j),'Jonas (neither): Trainer ID card');
  await p.locator('article.tcard',{has:p.locator('h3',{hasText:'Jonas'})}).screenshot({path:ROOT+'/tests/out/id_front.png'});
  await p.locator('article.tcard',{has:p.locator('h3',{hasText:'Ines'})}).screenshot({path:ROOT+'/tests/out/con_front.png'});
  await p.screenshot({path:ROOT+'/tests/out/overview.png'});
  // flip ID card
  await cardOf(p,'Jonas').locator('button[data-act="idflip"]').click();await p.waitForTimeout(200);
  const back=(await p.locator('article.tcard.idc').first().innerText()).replace(/\s+/g,' ');
  ok(/Trainer ID/i.test(back)&&/Team/i.test(back)&&/Quiet life/.test(back),'ID card back shows team and quote');
  // rankings
  await p.click('button[data-act="tab"][data-tab="rank"]');await p.waitForTimeout(800);
  let rk=(await p.locator('main, #app, body').first().innerText());
  const rows=async()=> (await p.locator('#rklist, .rktab, table').allInnerTexts()).join(' ');
  let g=await rows();
  ok(/Mira/.test(g)&&/Cora/.test(g)&&!/Jonas/.test(g)&&!/Ines/.test(g),'Gym rankings: Mira and Cora only');
  await p.click('button[data-act="rk_c"][data-v="con"]');await p.waitForTimeout(500);
  g=await rows();
  ok(/Mira/.test(g)&&/Ines/.test(g)&&!/Jonas/.test(g)&&!/Cora/.test(g),'Contest rankings: Mira and Ines only');
  await p.screenshot({path:ROOT+'/tests/out/rank_con.png'});
  // sheet toggle as the player
  await p.click('button[data-act="tab"][data-tab="trainer"]');await p.waitForTimeout(800);
  /* the circuit switches are setup, so they sit under Edit sheet (Update 49) */
  await p.evaluate(()=>{const b=document.createElement('button');b.dataset.act='toggle';b.dataset.key='edtu1';b.hidden=true;document.body.appendChild(b);b.click();});await p.waitForTimeout(500);
  const lab=p.locator('label',{hasText:'Not on the Gym circuit'});
  ok(await lab.count()===1,'sheet shows the Gym toggle');
  await lab.locator('input').check();await p.waitForTimeout(800);
  const w=await p.evaluate(()=>window.__store.get('trainers/u1').noGym);
  ok(w===true,'ticking it saves noGym=true on the trainer');
  await p.click('button[data-act="tab"][data-tab="rank"]');await p.waitForTimeout(500);
  await p.click('button[data-act="rk_c"][data-v="gym"]');await p.waitForTimeout(500);
  g=await rows();ok(!/Mira/.test(g)&&/Cora/.test(g),'Mira left the Gym list after ticking');
  await p.click('button[data-act="tab"][data-tab="overview"]');await p.waitForTimeout(500);
  ok(/COORDINATOR/i.test(await t('Mira')),'Mira now shows the coordinator card');
  await lab.count();
  await p.click('button[data-act="tab"][data-tab="trainer"]');await p.waitForTimeout(500);
  await p.locator('label',{hasText:'Not on the Contest circuit'}).locator('input').check();await p.waitForTimeout(700);
  await p.click('button[data-act="tab"][data-tab="overview"]');await p.waitForTimeout(500);
  ok(/TRAINER ID/i.test(await t('Mira')),'Mira now shows the Trainer ID');
  // untick both: back, points kept (no data deleted)
  await p.click('button[data-act="tab"][data-tab="trainer"]');await p.waitForTimeout(400);
  await p.locator('label',{hasText:'Not on the Gym circuit'}).locator('input').uncheck();await p.locator('label',{hasText:'Not on the Contest circuit'}).locator('input').uncheck();await p.waitForTimeout(700);
  await p.click('button[data-act="tab"][data-tab="overview"]');await p.waitForTimeout(400);
  ok(/CHALLENGER/i.test(await t('Mira'))&&/Badges/i.test(await t('Mira')),'unticking both restores the League Card');
  ok(errs.length===0,'no page errors ('+errs.slice(0,3).join(' | ')+')');
  await b.close();
  console.log(fails?fails+' FAILED':'ALL PASSED');
})();
