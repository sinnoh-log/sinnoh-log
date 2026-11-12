const {open,ROOT}=require('./lib');
let fails=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fails++;};
const art=p=>p.locator('img.dxart');
const go=async(p,id)=>{await p.evaluate(i=>{let b=document.querySelector('[data-act="dx_open"][data-id="'+i+'"]');if(!b){b=document.createElement('button');b.dataset.act='dx_open';b.dataset.id=i;b.hidden=true;document.body.appendChild(b);}b.click();},id);await p.waitForTimeout(300);};
(async()=>{
  for(const w of [1280,390]){
  const {b,p,errs}=await open({admin:true,uid:'u1',tab:'dex',w});
  await p.waitForTimeout(300);
  await go(p,6);
  ok(await p.locator('.dxfp .dxfb').count()===3,w+': Charizard shows Base + Mega X + Mega Y ('+await p.locator('.dxfp .dxfb').count()+')');
  const base=await art(p).getAttribute('src');
  ok(/official-artwork\/6\.png$/.test(base),'base art is official artwork #6');
  await p.locator('.dxfb',{hasText:'Mega Charizard X'}).click();await p.waitForTimeout(200);
  ok(/official-artwork\/10034\.png$/.test(await art(p).getAttribute('src')),'Mega X art id 10034');
  ok((await p.locator('.dxfc').textContent()).includes('Mega Evolution'),'caption names Mega Evolution');
  ok((await p.locator('.dxinfo .types').textContent()).toLowerCase().includes('dragon'),'Mega X types include Dragon');
  await p.click('.dxsy');await p.waitForTimeout(200);
  ok(/official-artwork\/shiny\/10034\.png$/.test(await art(p).getAttribute('src')),'shiny toggle switches to shiny Mega art');
  ok((await p.locator('.dxsy').getAttribute('aria-pressed'))==='true','shiny button pressed');
  await p.screenshot({path:ROOT+'/tests/out/forms_'+w+'.png'});
  if(w===390) ok(await p.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1),'no horizontal overflow at phone width');
  // other entry resets the form but keeps shiny
  await p.click('[data-act="dx_step"][data-d="1"]');await p.waitForTimeout(200);
  ok(/official-artwork\/shiny\/7\.png$/.test(await art(p).getAttribute('src')),'next entry: base form, shiny kept');
  // alternate forms and campaign-only forms
  await p.click('[data-act="dx_back"]');await go(p,413);
  ok(await p.locator('.dxfb').count()>=3,'Wormadam shows cloak forms');
  await p.locator('.dxfb',{hasText:/Sand/}).click();await p.waitForTimeout(200);
  ok(/official-artwork\/shiny\/10\d+\.png$/.test(await art(p).getAttribute('src')),'Wormadam Sand Cloak uses its own art');
  await p.click('[data-act="dx_back"]');await go(p,105);
  await p.locator('.dxfb',{hasText:/Volcanic/}).click();await p.waitForTimeout(200);
  ok((await p.locator('.dxfc').textContent()).includes('no official art'),'Marowak (Volcanic) says no official art');
  ok(/105\.png$/.test(await art(p).getAttribute('src')),'…and shows the base art');
  await p.click('[data-act="dx_back"]');await go(p,27);
  ok(await p.locator('.dxfb',{hasText:/Alolan/}).count()===1,'Sandshrew shows Alolan form');
  await p.click('[data-act="dx_back"]');await go(p,132);
  ok(await p.locator('.dxfb').count()===0,'Ditto (no forms) shows no picker');
  ok(errs.length===0,w+': no page errors ('+errs.slice(0,3).join(' | ')+')');
  await b.close();}
  console.log(fails?fails+' FAILED':'ALL PASSED');
})();
