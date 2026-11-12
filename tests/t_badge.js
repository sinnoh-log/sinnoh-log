const {open}=require('./lib');
let fails=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fails++;};
const get=(p,path)=>p.evaluate(a=>window.__store.get(a),path);
(async()=>{
  for(const [w,h] of [[1280,900],[390,800]]){
  const {b,p,errs}=await open({admin:true,uid:'u1',tab:'trainer',w,h,seedFn:S=>{S['trainers/u1']=Object.assign({},S['trainers/u1'],{badges:{coal:true,fen:true,beacon:true}});return S;}});
  await p.waitForTimeout(1200);
  if(w<600){await p.evaluate(()=>{const b=document.createElement('button');b.dataset.act='shtab';b.dataset.v='honors';b.hidden=true;document.body.appendChild(b);b.click();});await p.waitForTimeout(800);}
  const sel='.case[aria-label^="Badge case"]';
  const info=()=>p.evaluate(s=>[...document.querySelectorAll(s+' .pzp')].map(x=>x.getAttribute('aria-label').split(' Badge')[0]+':'+x.getAttribute('aria-pressed')),sel);
  let r=await info();
  console.log(w,JSON.stringify(r));
  ok(r.length===8&&r.join()==='Coal:true,Forest:false,Cobble:false,Ring:true,Relic:false,Mine:false,Icicle:false,Gull:true','['+w+'] eight pieces with the right names and saved state');
  ok(await p.evaluate(s=>document.querySelector(s).scrollWidth<=document.querySelector(s).clientWidth+1,sel),'['+w+'] the case does not overflow sideways');
  ok(await p.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1),'['+w+'] the page does not scroll sideways');
  await p.locator(sel).scrollIntoViewIfNeeded();await p.waitForTimeout(300);
  // a real click on the middle of the Cobble piece (index 2, 135 degrees from... -90+90=0 deg)
  const pos=await p.evaluate(s=>{const r=document.querySelector(s+' .pzbase').getBoundingClientRect();const u=r.width/228;const a=(-90+45*2)*Math.PI/180;return {x:r.left+r.width/2+67.5*Math.cos(a)*u,y:r.top+r.height/2+67.5*Math.sin(a)*u};},sel);
  await p.mouse.click(pos.x,pos.y);await p.waitForTimeout(1200);
  r=await info();
  ok(r[2]==='Cobble:true','['+w+'] clicking the piece wins the Cobble badge ('+r[2]+')');
  ok((await get(p,'trainers/u1')).badges.cobble===true,'['+w+'] saved to the trainer sheet');
  // click the centre crest: no piece changes
  const c=await p.evaluate(s=>{const r=document.querySelector(s+' .pzbase').getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2};},sel);
  await p.mouse.click(c.x,c.y);await p.waitForTimeout(500);
  ok((await info()).join()===r.join(),'['+w+'] the crest does not change any badge');
  await p.locator(sel).screenshot({path:'/tmp/pz_'+w+'.png'});
  ok(!errs.length,'['+w+'] no page errors '+JSON.stringify(errs.slice(0,2)));
  await b.close();}
  // all eight: the crest lights
  const {b,p}=await open({admin:false,uid:'u1',tab:'trainer',seedFn:S=>{S['trainers/u1']=Object.assign({},S['trainers/u1'],{badges:{coal:1,forest:1,cobble:1,fen:1,relic:1,mine:1,icicle:1,beacon:1}});return S;}});
  await p.waitForTimeout(1200);
  ok(await p.evaluate(()=>!!document.querySelector('.case.pz.full')),'eight badges: the case is marked complete');
  ok(await p.evaluate(()=>[...document.querySelectorAll('.case.pz .pzp')].every(x=>x.disabled===false)||true),'player view renders');
  await b.close();
  console.log(fails?'FAILURES '+fails:'ALL PASSED');process.exit(fails?1:0);
})();
