/* Battle formats (Update 64): Open, Singles, Doubles and Tag decide how many Pokémon each trainer has on the field; the rest wait
   on the bench, out of the turn order and off the map. Recall and Send out (GM); a Pokémon sent out rolls initiative and slots
   in, taking the recalled one's square. NPC Pokémon can join as allies: GM-run, shown in full, on the players' side. */
const {open}=require('./lib');
let fails=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fails++;};
const click=(p,a)=>p.evaluate(a=>{const b=document.createElement('button');Object.entries(a).forEach(([k,v])=>b.dataset[k]=v);b.hidden=true;document.body.appendChild(b);b.click();b.remove();},a);
const W=(p,n)=>p.waitForTimeout(n||400);
const mon=(id,sp,ty,spe)=>({id,sp,ty:[ty,''],hp:{cur:30,max:30},base:{atk:5,def:5,spa:5,spd:5,spe:spe||5},bonus:{atk:0,def:0,spa:0,spd:0,spe:0},mv:[],ps:[],sh:{}});
const seedFn=S=>{
  S['trainers/u3/pokemon/c1']={species:'Cherubi',nick:'',types:['Grass'],slot:'party',order:1,createdAt:1,hp:{cur:24,max:24},moves:[]};
  S['trainers/u3/pokemon/c2']={species:'Growlithe',nick:'',types:['Fire'],slot:'party',order:2,createdAt:2,hp:{cur:26,max:26},moves:[]};
  S['gm/nt_f1']={name:'Fantina',cat:'gym',order:1,team:[mon('a','Haunter','Ghost',9),mon('b','Drifloon','Ghost',6),mon('c','Misdreavus','Ghost',8)]};
  S['gm/nt_b1']={name:'Brigid Galloway',cat:'trainer',order:2,team:[mon('d','Graveler','Rock',3),mon('e','Onix','Rock',7)]};
  S['gm/bmap']={v:1,w:500,h:500,gx:50,blank:true,grid:true};
  return S;};
(async()=>{
  const {b,p,errs}=await open({admin:true,uid:'u1',tab:'battle',seedFn});
  const st=()=>p.evaluate(()=>{const b=BT(),c=b.c||{};const nm=k=>(btInfo(k,true)||{}).name;
    return {fmt:b.fmt||'open',order:(b.order||[]).map(nm),bench:Object.keys(c).filter(k=>c[k].bn).map(nm).sort(),turn:nm(b.turn)};});
  const cidOf=n=>p.evaluate(n=>Object.keys(BT().c||{}).find(k=>(btInfo(k,true)||{}).name===n),n);
  const main=()=>p.evaluate(()=>document.getElementById('main').innerText);

  ok(await p.evaluate(()=>btFmt()==='open'&&btSlots()===0),'a battle starts in the Open format, as before');
  await click(p,{act:'b_fmt',v:'double'});await W(p);
  await click(p,{act:'b_addparty',uid:'u1'});await W(p);
  await p.evaluate(()=>ntTeamToBattle('f1'));await W(p);
  let s=await st();
  ok(s.fmt==='double'&&s.bench.join()==='Misdreavus,Veluza','Doubles: two on the field per trainer; Veluza and Misdreavus wait on the bench ('+s.bench.join(', ')+')');
  await click(p,{act:'b_init'});await W(p);
  s=await st();
  ok(s.order.length===5&&s.order.indexOf('Veluza')<0&&s.order.indexOf('Misdreavus')<0&&s.order.indexOf('Mira')>=0,'initiative leaves the bench out: '+s.order.join(', '));
  let t=await main();
  ok(/Your side/i.test(t)&&/Opponents/i.test(t)&&/Bench/i.test(t)&&/Send out/.test(t)&&/Recall/.test(t),'the page shows the field per side, the bench, Recall and Send out');
  ok(await p.evaluate(()=>{const cfg=bmCfg(),toks=bmTokens(cfg).filter(t=>t.side!=='t'&&t.side!=='n');return toks.length===4&&!toks.some(t=>['Veluza','Misdreavus'].includes(t.v.name));}),'benched Pokémon have no token on the map');

  // recall, then send out into the free slot
  const gy=await cidOf('Gyarados'),mk=await cidOf('Magikarp'),ve=await cidOf('Veluza');
  await click(p,{act:'b_recall',cid:gy});await W(p);
  s=await st();
  ok(s.bench.includes('Gyarados')&&s.order.indexOf('Gyarados')<0,'Recall sends Gyarados to the bench and out of the order');
  t=await main();
  ok(/Empty slot/.test(t),'a free slot shows as empty');
  await click(p,{act:'b_so',cid:ve});await W(p);
  t=await main();
  ok(/There is room on the field/.test(t),'Send out with room asks no one to come back');
  await click(p,{act:'b_sogo',cid:ve,out:''});await W(p);
  s=await st();
  const iv=await p.evaluate(ve=>({ini:btIni(ve),sp:btSpeed(ve)}),ve);
  ok(s.order.includes('Veluza')&&!s.bench.includes('Veluza')&&iv.ini===iv.sp,'Veluza comes out and slots in on its Speed ('+iv.ini+'): '+s.order.join(', '));

  // a full field: swap, d20 typed, and the map square passes on
  await click(p,{act:'b_mode',v:'d20'});await W(p);
  await p.evaluate(mk=>{edit('p',btC(mk).r,'bpos',{x:2,y:3,v:1});},mk);await W(p);
  await click(p,{act:'b_so',cid:gy});await W(p);
  t=await main();
  ok(/Swap for Magikarp/.test(t)&&/Swap for Veluza/.test(t)&&/d20 rolled/.test(t),'with a full field it asks who comes back, and takes a typed d20 in a d20 battle');
  await p.evaluate(()=>{S.ui.bt.soD='12';});
  await click(p,{act:'b_sogo',cid:gy,out:mk});await W(p);
  s=await st();
  const sw=await p.evaluate(([gy,mk])=>({ini:btIni(gy),sp:btSpeed(gy),gp:(getLocal('p',btC(gy).r)||{}).bpos,mp:(getLocal('p',btC(mk).r)||{}).bpos}),[gy,mk]);
  ok(s.bench.includes('Magikarp')&&s.order.includes('Gyarados')&&sw.ini===sw.sp+12,'Gyarados swaps in for Magikarp at d20 12 + Speed '+sw.sp+' = '+sw.ini);
  ok(sw.gp&&sw.gp.x===2&&sw.gp.y===3&&!sw.mp,'Gyarados takes Magikarp’s square on the map');

  // the turn moves on if the acting Pokémon is recalled
  const cur=await p.evaluate(()=>BT().turn);
  await click(p,{act:'b_recall',cid:cur});await W(p);
  ok(await p.evaluate(c=>BT().turn&&BT().turn!==c&&btC(BT().turn)&&!btC(BT().turn).bn,cur),'recalling the Pokémon whose turn it is passes the turn on');

  // formats switch
  await click(p,{act:'b_fmt',v:'single'});await W(p);
  s=await st();
  const per=await p.evaluate(()=>btGroups().map(G=>G.g+':'+G.field.length).join(' '));
  ok(/u:u1:1/.test(per)&&/n:f1:1/.test(per),'Singles leaves one on the field per trainer ('+per+')');
  await click(p,{act:'b_fmt',v:'open'});await W(p);
  s=await st();
  ok(!s.bench.length&&s.order.length===7,'Open brings everyone back into the order ('+s.order.length+')');

  // allies
  await click(p,{act:'b_fmt',v:'tag'});await W(p);
  await click(p,{act:'b_ntal',v:'1'});await W(p);
  await p.evaluate(()=>ntTeamToBattle('b1'));await W(p);
  const A=await p.evaluate(()=>{const c=BT().c||{},ks=Object.keys(c).filter(k=>c[k].al);
    return {n:ks.length,g:[...new Set(ks.map(k=>c[k].g))],gn:ks.map(k=>c[k].gn)[0],shown:ks.every(k=>c[k].pub&&c[k].pub.sp&&c[k].pub.ty),field:ks.filter(k=>!c[k].bn).length,
      side:btGroups().find(G=>G.g==='al:b1').side,tok:(()=>{const k=ks.find(x=>!c[x].bn);bmSetPos(k,5,5);return 1;})()};});
  await W(p);
  const tok=await p.evaluate(()=>{const cfg=bmCfg();const t=bmTokens(cfg).find(x=>x.al&&x.placed);return t?{vis:t.vis,cls:bmTok(cfg,t).s.indexOf('bmt ally')>=0}:null;});
  ok(A.n===2&&A.g.join()==='al:b1'&&A.gn==='Brigid Galloway'&&A.shown&&A.field===1&&A.side==='a','an NPC’s Pokémon join as allies: shown in full, on the players’ side, one on the field in Tag');
  ok(tok&&tok.vis&&tok.cls,'an ally’s token is blue and on the table’s map as soon as it is placed');
  t=await main();
  ok(/Brigid Galloway · ally/i.test(t)&&/GM runs/.test(t),'the field shows the ally under the partner’s name, run by the GM');
  const rowCls=await p.evaluate(()=>{const c=BT().c,k=Object.keys(c).find(x=>c[x].al&&!c[x].bn);const el=document.querySelector('.brow[data-cid="'+k+'"]');return el?el.className:'';});
  ok(/\bally\b/.test(rowCls),'its turn-order row is an ally row');

  // the players' view
  await p.evaluate(()=>{S.me.admin=false;render();});await W(p);
  t=await main();
  ok(!/Recall/.test(t)&&!/Send out/.test(t)&&/in reserve/.test(t)&&/Brigid Galloway/.test(t),'players see the field and bench without the controls; a foe’s bench is a count');
  await p.evaluate(()=>{S.me.admin=true;render();});await W(p);

  // the end
  await p.evaluate(()=>btEnd());await W(p);
  ok(await p.evaluate(()=>btFmt()==='open'),'End battle goes back to Open');
  ok(errs.length===0,'no page errors ('+errs.slice(0,3).join(' | ')+')');
  await b.close();
  console.log(fails?fails+' FAILED':'ALL PASSED');
})();
