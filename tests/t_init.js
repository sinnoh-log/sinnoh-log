/* Typed initiative (Update 57): the GM types the rolls players call out, as a d20 (Speed added) or a total; empty boxes are
   rolled at the start and kept mid-fight; ties go to the higher Speed, then a roll; whose turn it is survives a re-sort. */
const {open,ROOT}=require('./lib');
let fails=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fails++;};
const click=(p,a)=>p.evaluate(a=>{const b=document.createElement('button');Object.entries(a).forEach(([k,v])=>b.dataset[k]=v);b.hidden=true;document.body.appendChild(b);b.click();b.remove();},a);
const W=(p,n)=>p.waitForTimeout(n||600);
const type=(p,cid,v)=>p.evaluate(([cid,v])=>{const el=document.querySelector('[data-inib="'+cid+'"]');el.value=v;el.dispatchEvent(new Event('input',{bubbles:true}));},[cid,v]);
const seedFn=S=>{
  Object.assign(S['trainers/u1/pokemon/p1'],{nick:'Fast',hp:{cur:30,max:30},base:{atk:5,def:5,spa:5,spd:5,spe:8}});
  Object.assign(S['trainers/u1/pokemon/p2'],{nick:'Slow',hp:{cur:30,max:30},base:{atk:5,def:5,spa:5,spd:5,spe:2}});
  return S;};
(async()=>{
  let {b,p,errs}=await open({admin:true,uid:'u1',tab:'battle',seedFn});
  await click(p,{act:'b_addally',uid:'u1',pid:'p1'});await W(p,300);
  await click(p,{act:'b_addally',uid:'u1',pid:'p2'});await W(p,300);
  await p.fill('input[data-u="bt.foeSp"]','Rattata');await p.dispatchEvent('input[data-u="bt.foeSp"]','input');await click(p,{act:'b_addfoe'});await W(p,1500);
  const ids=await p.evaluate(()=>{const c=BT().c,o={};Object.keys(c).forEach(k=>{const x=c[k];o[x.s==='f'?'foe':x.r.split('/')[1]]=k;});return o;});
  const sp=await p.evaluate(ids=>({p1:btSpeed(ids.p1),p2:btSpeed(ids.p2),foe:btSpeed(ids.foe)}),ids);
  ok(sp.p1>sp.p2,'two allies with different Speed ('+sp.p1+' and '+sp.p2+') and a foe (Speed '+sp.foe+')');
  ok(await p.evaluate(()=>!!document.querySelector('.btl [data-act="b_iniopen"]')),'the turn order has an Initiative button');
  await click(p,{act:'b_iniopen'});await W(p,300);
  let dlg=await p.evaluate(()=>{const d=document.querySelector('.inidlg');return d?{rows:d.querySelectorAll('.inilist li').length,txt:d.innerText,role:d.getAttribute('role'),focus:document.activeElement&&document.activeElement.dataset.inib||''}:null;});
  ok(dlg&&dlg.rows===3&&dlg.role==='dialog'&&/Speed \d+/.test(dlg.txt)&&/Start the battle/.test(dlg.txt),'the form lists all three with their Speed and offers Start the battle');
  ok(dlg&&dlg.focus!=='','the first box has the focus');
  await type(p,ids.p1,'25');
  ok(/A d20 is 1 to 20/.test(await p.evaluate(id=>document.getElementById('initot-'+id).textContent,ids.p1)),'a d20 over 20 is flagged at once');
  await click(p,{act:'b_iniapply'});await W(p,300);
  ok(await p.evaluate(()=>!BT().on&&S.ui.ini.open),'it will not start with a bad roll');
  await type(p,ids.p1,'15');
  ok(await p.evaluate(([id,s])=>document.getElementById('initot-'+id).textContent==='15 + '+s+' Speed = '+(15+s),[ids.p1,sp.p1]),'d20 15: the sum beside the box adds Speed as you type');
  await click(p,{act:'b_initog',cid:ids.p2,v:'tot'});await W(p,200);
  await type(p,ids.p2,'40');
  ok(await p.evaluate(id=>document.getElementById('initot-'+id).textContent,ids.p2)==='= 40','Total: the number is used as it is');
  ok(await p.evaluate(id=>document.querySelector('[data-inib="'+id+'"]').value,ids.p1)==='15','switching another row keeps what was typed');
  await click(p,{act:'b_iniapply'});await W(p,600);
  let bt=await p.evaluate(()=>({on:BT().on,round:BT().round,mode:BT().mode,order:BT().order,turn:BT().turn,open:S.ui.ini.open}));
  const ini=await p.evaluate(ids=>({p1:btIni(ids.p1),p2:btIni(ids.p2),foe:btIni(ids.foe)}),ids);
  ok(bt.on&&bt.round===1&&bt.mode==='d20'&&!bt.open,'Start the battle: round 1, d20 + Speed mode, the form closes');
  ok(ini.p1===15+sp.p1&&ini.p2===40,'typed: '+ini.p1+' and '+ini.p2);
  ok(ini.foe>sp.foe&&ini.foe<=sp.foe+20,'the empty foe box was rolled d20 + Speed ('+ini.foe+')');
  const want=[['p1',ini.p1,sp.p1],['p2',ini.p2,sp.p2],['foe',ini.foe,sp.foe]].sort((a,z)=>z[1]-a[1]||z[2]-a[2]).map(x=>ids[x[0]]);
  ok(JSON.stringify(bt.order)===JSON.stringify(want)||(ini.foe===ini.p1),'the order runs highest first');
  ok(bt.turn===bt.order[0],'the first in the order acts first');
  // mid-fight: move on a turn, then change one number
  await click(p,{act:'b_next'});await W(p,400);
  const acting=await p.evaluate(()=>BT().turn);
  await click(p,{act:'b_iniopen'});await W(p,300);
  dlg=await p.evaluate(()=>document.querySelector('.inidlg').innerText);
  ok(/now \d+/.test(dlg)&&/Re-sort the order/.test(dlg)&&/keeps its current number/.test(dlg),'mid-fight the form shows each current number and offers a re-sort');
  await click(p,{act:'b_initog',cid:ids.p2,v:'tot'});await type(p,ids.p2,'-3');
  await click(p,{act:'b_iniapply'});await W(p,600);
  bt=await p.evaluate(()=>({order:BT().order,turn:BT().turn,round:BT().round}));
  const ini2=await p.evaluate(ids=>({p1:btIni(ids.p1),p2:btIni(ids.p2),foe:btIni(ids.foe)}),ids);
  ok(bt.order[2]===ids.p2&&ini2.p2===-3,'Slow’s new total of −3 puts it last');
  ok(ini2.p1===ini.p1&&ini2.foe===ini.foe,'the empty boxes kept their numbers');
  ok(bt.turn===acting&&bt.round===1,'whose turn it is did not change');
  // ties: the faster one first
  await click(p,{act:'b_iniopen'});await W(p,300);
  await click(p,{act:'b_initog',cid:ids.p1,v:'tot'});await click(p,{act:'b_initog',cid:ids.p2,v:'tot'});await click(p,{act:'b_initog',cid:ids.foe,v:'tot'});
  await type(p,ids.p2,'12');await type(p,ids.p1,'12');await type(p,ids.foe,'2');
  await click(p,{act:'b_iniapply'});await W(p,600);
  bt=await p.evaluate(()=>({order:BT().order}));
  ok(bt.order[0]===ids.p1&&bt.order[1]===ids.p2,'a tie at 12: the higher Speed goes first');
  ok(await p.evaluate(()=>{const o=BT().order,a={ini:5,sp:3,tb:1},z={ini:5,sp:3,tb:9};return btCmp(a,z)>0&&btCmp({ini:6,sp:0,tb:0},{ini:5,sp:9,tb:9})<0;}),'equal Speed too: the tie roll decides; a higher initiative always wins');
  // a late joiner gets a number; the form can fix it
  await click(p,{act:'b_addally',uid:'u1',pid:'p3'});await W(p,500);
  const p3=await p.evaluate(()=>Object.keys(BT().c).find(k=>BT().c[k].r==='u1/p3'));
  await click(p,{act:'b_iniopen'});await W(p,300);
  await type(p,p3,'20');await click(p,{act:'b_iniapply'});await W(p,600);
  ok(await p.evaluate(([c,id])=>btIni(c)===20+btSpeed(c)&&BT().order[0]===c,[p3,p3]),'a late joiner’s d20 of 20 puts them first');
  // Escape and Close
  await click(p,{act:'b_iniopen'});await W(p,300);
  await p.keyboard.press('Escape');await W(p,300);
  ok(await p.evaluate(()=>!document.querySelector('.inidlg')&&!S.ui.ini.open&&document.activeElement&&document.activeElement.dataset.act==='b_iniopen'),'Escape closes the form and returns to the Initiative button');
  // the map has the button too
  ok(await p.evaluate(()=>String(bmTurnBar().s||bmTurnBar()).indexOf('data-act="b_iniopen"')>=0),'the Battle map’s turn bar has the Initiative button');
  // the old buttons still sort ties by Speed
  await click(p,{act:'b_mode',v:'speed'});await click(p,{act:'b_init'});await W(p,600);
  ok(await p.evaluate(()=>{const o=BT().order;for(let i=1;i<o.length;i++){if(btIni(o[i])>btIni(o[i-1]))return false;}return true;}),'Roll initiative still sorts highest first');
  ok(errs.length===0,'no page errors ('+errs.slice(0,3).join(' | ')+')');
  await b.close();

  // a player
  ({b,p,errs}=await open({admin:false,uid:'u1',tab:'battle',seedFn}));
  await p.evaluate(()=>{S.ui.ini.open=true;render();});await W(p,300);
  ok(await p.evaluate(()=>!document.querySelector('[data-act="b_iniopen"]')&&!document.querySelector('.inidlg')),'players get no Initiative button and no form');
  ok(errs.length===0,'no page errors for a player');
  await b.close();

  // phone width
  ({b,p,errs}=await open({admin:true,uid:'u1',tab:'battle',seedFn,w:390,h:844}));
  await click(p,{act:'b_addally',uid:'u1',pid:'p1'});await W(p,300);
  await click(p,{act:'b_addally',uid:'u1',pid:'p2'});await W(p,300);
  await click(p,{act:'b_iniopen'});await W(p,400);
  const ov=await p.evaluate(()=>{const d=document.querySelector('.inidlg').getBoundingClientRect();const li=document.querySelector('.inilist li').getBoundingClientRect();return {vw:window.innerWidth,r:Math.round(d.right),l:Math.round(d.left),lir:Math.round(li.right),sw:document.documentElement.scrollWidth};});
  ok(ov.l>=0&&ov.r<=ov.vw&&ov.lir<=ov.vw&&ov.sw<=ov.vw+1,'at phone width the form fits ('+JSON.stringify(ov)+')');
  await p.screenshot({path:ROOT+'/tests/out/init-phone.png'});
  ok(errs.length===0,'no page errors at phone width');
  await b.close();
  console.log(fails?fails+' FAILED':'ALL PASSED');
})();
