const {open,ROOT}=require('./lib');
const tabs=['overview','journal','timeline','cal','people','leads','map','trainer','pokemon','dex','battle','moves','contest','rank','shop','gm','npc'];
(async()=>{
  let bad=0;
  for(const admin of [false,true]){
    for(const tab of tabs){
      if(!admin&&(tab==='gm'||tab==='npc'))continue;
      const {b,p,errs}=await open({admin,uid:'u1',tab});
      const txt=(await p.locator('body').innerText()).length;
      if(errs.length||txt<200){bad++;console.log('PROBLEM',admin?'GM':'player',tab,errs.slice(0,2),txt);}
      await b.close();
    }
  }
  console.log(bad?bad+' problems':'all tabs load without errors (player and GM)');
  // phone width
  const {b,p,errs}=await open({admin:false,uid:'u1',tab:'moves',w:390,h:844});
  await p.selectOption('select[data-u="mvx.mon"]','p1');await p.waitForTimeout(300);
  const ov=await p.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth+2);
  console.log('phone: horizontal overflow =',ov);
  await p.screenshot({path:ROOT+'/tests/out/moves_phone.png'});
  await b.close();
})();
