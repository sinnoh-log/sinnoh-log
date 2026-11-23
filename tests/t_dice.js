/* Typed dice (Update 65): players' move rolls, checks and the GM's foe rolls can take the dice rolled at the table.
   The form says which dice to roll; the site adds the modifiers; a natural 20 is still a critical hit; logged rolls say "real dice". */
const {open}=require('./lib');
let fails=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fails++;};
const click=(p,a)=>p.evaluate(a=>{const b=document.createElement('button');Object.entries(a).forEach(([k,v])=>b.dataset[k]=v);b.hidden=true;document.body.appendChild(b);b.click();b.remove();},a);
const W=(p,n)=>p.waitForTimeout(n||400);
const seedFn=S=>{
  Object.assign(S['trainers/u1/pokemon/p1'],{stats:{atk:7,def:5,spa:4,spd:5,spe:6}});
  return S;};
(async()=>{
  const {b,p,errs}=await open({admin:true,uid:'u1',tab:'pokemon',seedFn});
  const last=()=>p.evaluate(()=>{const r=S.rolls[0];return r?{ac:r.ac,dm:r.dm,acd:r.acd||'',dmd:r.dmd||'',crit:!!r.crit,rd:!!r.rd,total:r.total,detail:r.detail||'',label:r.label}:null;});
  const n0=await p.evaluate(()=>S.rolls.length);

  // the move form
  await p.evaluate(()=>{S.ui.open['pu1/p1']=true;S.ui.mr={key:mrKey('u1','p1',0),tgt:'',eff:'auto'};S.ui.rd.mr=true;render();});await W(p);
  const form=await p.evaluate(()=>{const e=document.querySelector('.mrform');return e?e.innerText:'';});
  ok(/I rolled real dice/.test(form)&&/Roll 1d20 for accuracy and 2d6 for damage/.test(form),'the move form has the switch and says what to roll ('+(form.match(/Roll 1d20[^\n]*/)||[''])[0]+')');
  ok(/d20 \(the face you rolled\)/.test(form)&&/Damage dice total \(2d6\)/.test(form)&&/Log attack/.test(form),'it has a d20 box, a damage box for 2d6, and Log attack');
  await click(p,{act:'b_mroll',uid:'u1',pid:'p1',i:'0'});await W(p);
  ok(await p.evaluate(n=>S.rolls.length===n,n0),'nothing is logged until the d20 is typed');
  await p.evaluate(()=>{S.ui.mr.td20='14';S.ui.mr.tdmg='13';});
  await click(p,{act:'b_mroll',uid:'u1',pid:'p1',i:'0'});await W(p);
  ok(await p.evaluate(n=>S.rolls.length===n,n0),'a damage total too big for 2d6 is refused');
  await p.evaluate(()=>{S.ui.mr.td20='14';S.ui.mr.tdmg='9';});
  await click(p,{act:'b_mroll',uid:'u1',pid:'p1',i:'0'});await W(p);
  let r=await last();
  const want=await p.evaluate(()=>{const m=Object.assign({id:'p1'},getLocal('p','u1/p1'));const c=atkCalc(Object.assign(mrOpts(m,hbMove(m.moves[0],monDie(m)),false,'u1','p1'),{typed:{d20:14,dmg:9}}));return {ac:c.ac.tot,dm:c.dm.tot};});
  ok(r&&r.rd&&r.ac===want.ac&&r.dm===want.dm&&/d20 14 typed/.test(r.acd)&&/2d6: typed 9/.test(r.dmd),'typed dice are logged with the modifiers added: accuracy '+(r&&r.ac)+', damage '+(r&&r.dm)+' ('+(r&&r.dmd)+')');
  ok(await p.evaluate(()=>!S.ui.mr.td20&&!S.ui.mr.tdmg),'the boxes clear after logging');
  await p.evaluate(()=>{S.ui.mr.td20='20';S.ui.mr.tdmg='';});
  await click(p,{act:'b_mroll',uid:'u1',pid:'p1',i:'0'});await W(p);
  r=await last();
  const crit=await p.evaluate(()=>{const m=Object.assign({id:'p1'},getLocal('p','u1/p1'));const c=atkCalc(Object.assign(mrOpts(m,hbMove(m.moves[0],monDie(m)),false,'u1','p1'),{typed:{d20:20,dmg:null}}));return c.dm.tot;});
  ok(r.crit&&r.dm===crit&&/every die at its top face/.test(r.dmd),'a typed natural 20 is a critical hit, with every damage die at 6 and no damage box needed ('+r.dm+')');
  await p.evaluate(()=>{S.ui.mr.tdmg='7';});
  await click(p,{act:'b_mdmg',uid:'u1',pid:'p1',i:'0'});await W(p);
  r=await last();
  ok(r.ac==null&&r.rd&&/typed 7/.test(r.dmd),'Damage only takes just the damage total');
  await p.evaluate(()=>{S.ui.rd.mr=false;S.ui.mr.td20='';});
  await click(p,{act:'b_mroll',uid:'u1',pid:'p1',i:'0'});await W(p);
  r=await last();
  ok(!r.rd&&!/typed/.test(r.acd),'with the switch off, the site rolls as before');

  // checks
  await p.evaluate(()=>{setTab('trainer');});await W(p,700);
  await click(p,{act:'rd_sw',k:'chk',v:'1'});await W(p);
  const tr=await p.evaluate(()=>document.getElementById('main').innerText);
  ok(/d20 you rolled/.test(tr),'the Trainer sheet has the typed box for checks');
  await click(p,{act:'roll',label:'Athletics',bonus:'2',tal:'2'});await W(p);
  r=await last();
  ok(r.label!=='Athletics'||r.rd!==true,'a check is not logged until the d20 is typed');
  await p.evaluate(()=>{S.ui.rd.cv='27';});
  await click(p,{act:'roll',label:'Athletics',bonus:'2',tal:'2'});await W(p);
  r=await last();
  ok(r.label==='Athletics'&&r.total===31&&r.rd&&/d20 27 typed/.test(r.detail),'a typed check adds the modifier and talent; a 20 that rolled on counts up to 40 ('+r.detail+')');

  // the GM's foe
  await p.evaluate(async()=>{setTab('battle');await btAddFoeSp('Houndour',1,'','',null);});await W(p,900);
  const fid=await p.evaluate(()=>Object.keys(foesOf())[0]);
  await p.evaluate(fid=>{edit('gb','battle','foes.'+fid+'.mv',[{name:'Ember',freq:'At-Will',kind:'Special',range:'Ranged',type:'Fire',dice:'2d8',text:'',used:0}]);S.ui.bt.open[fid]=true;S.ui.rd.foe=true;render();},fid);await W(p);
  const fb=await p.evaluate(fid=>{const e=document.querySelector('.brow[data-cid="'+fid+'"]');return e?e.innerText:'';},fid);
  ok(/Roll 1d20 for accuracy and 2d8 for damage/.test(fb)&&/Log attack/.test(fb),'a foe’s moves say what to roll when the GM uses real dice');
  await p.evaluate(()=>{S.ui.bt.td20='11';S.ui.bt.tdmg='10';});
  await click(p,{act:'b_fmroll',cid:fid,i:'0'});await W(p);
  r=await last();
  ok(r&&r.rd&&/d20 11 typed/.test(r.acd)&&/typed 10/.test(r.dmd),'the GM’s typed foe roll is logged as real dice');
  const log=await p.evaluate(()=>document.querySelector('.rlog')?document.querySelector('.rlog').innerText:'');
  ok(/real dice/.test(log),'the table’s roll log marks real dice');
  ok(errs.length===0,'no page errors ('+errs.slice(0,3).join(' | ')+')');
  await b.close();
  console.log(fails?fails+' FAILED':'ALL PASSED');
})();
