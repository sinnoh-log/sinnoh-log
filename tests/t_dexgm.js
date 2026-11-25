/* GM-only Pokédex marks (Update 71): only the GM's marks count. A Pokémon in a party or box, or a foe the GM shows, becomes a
   suggestion the GM approves or dismisses. The first time the GM's page sees a trainer, what the old rules showed is saved
   as GM marks, so nothing disappears. Each entry shows every trainer with Not met / Seen / Caught. Players can't change marks. */
const {open}=require('./lib');
let fails=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fails++;};
const click=(p,a)=>p.evaluate(a=>{const b=document.createElement('button');Object.entries(a).forEach(([k,v])=>b.dataset[k]=v);b.hidden=true;document.body.appendChild(b);b.click();b.remove();},a);
const W=(p,n)=>p.waitForTimeout(n||500);
const go=async(p,id)=>{await click(p,{act:'dx_open',id:String(id)});await W(p,400);};
const txt=p=>p.evaluate(()=>document.getElementById('main').innerText);
(async()=>{
  /* ---------- the GM ---------- */
  {
    const seedFn=S=>{
      S['trainers/u1'].dx={n25:1};                       // Mira has already been marked as having seen Pikachu
      S['trainers/u4'].dxv=2;                              // Ines was already moved over: she keeps exactly what she has
      S['meta/npcs']={n:{a:{m:[{sp:'Shinx'}]}}};           // the GM has shown a Shinx
      return S;};
    const {b,p,errs}=await open({admin:true,uid:'u1',tab:'dex',seedFn});
    await W(p,800);
    const id=n=>p.evaluate(n=>dexId(n),n);
    const [GY,MK,VE,EE,SH,BU,ST]=await Promise.all(['Gyarados','Magikarp','Veluza','Eevee','Shinx','Buneary','Starly'].map(id));
    const dx=u=>p.evaluate(u=>Object.assign({},S.trainers[u].dx||{},{v:S.trainers[u].dxv}),u);
    let m1=await dx('u1'),m2=await dx('u2'),m3=await dx('u3'),m4=await dx('u4');
    ok(m1['n'+GY]===2&&m1['n'+MK]===2&&m1['n'+VE]===2&&m1.n25===1&&m1.v===2,'Mira: her three Pokémon are saved as caught, Pikachu stays seen');
    ok(m2['n'+EE]===2&&m2.v===2,'Jonas: his Eevee is saved as caught');
    ok(m1['n'+SH]===1&&m2['n'+SH]===1&&m3['n'+SH]===1,'the Shinx the GM showed is saved as seen for everyone who was moved over');
    ok(!m4['n'+SH],'a trainer already moved over is left alone');
    let t=await txt(p);
    ok(await p.evaluate(()=>!!document.querySelector('.dxsug'))&&/Shinx/.test(t)&&/Ines/.test(t),'what is left shows under To confirm (the Shinx, for Ines)');
    ok(await p.evaluate(()=>dxSuggest().length)===1,'one suggestion');
    // a migration waits for the trainer's Pokémon
    ok(await p.evaluate(()=>{const keep=S.pokemon.u3,tv=S.trainers.u3.dxv;S.trainers.u3.dxv=0;delete S.pokemon.u3;dxMigrate();const r=S.trainers.u3.dxv;S.pokemon.u3=keep;S.trainers.u3.dxv=tv;return r;})===0,'nothing is saved for a trainer until their Pokémon have loaded');

    // new things happen: Jonas boxes a Buneary, the GM shows a Starly
    await p.evaluate(()=>{const db=window.__db;db.collection('trainers').doc('u2').collection('pokemon').doc('q2').set({species:'Buneary',nick:'',types:['Normal'],slot:'box',order:2,createdAt:2,lvl:8,hp:{cur:20,max:20},moves:[]});
      db.collection('meta').doc('npcs').set({n:{a:{m:[{sp:'Shinx'},{sp:'Starly'}]}}});});
    await W(p,800);
    m2=await dx('u2');
    ok(!m2['n'+BU],'a new catch does not count by itself');
    let L=await p.evaluate(()=>dxSuggest().map(o=>({k:o.k,id:o.id,uids:o.uids,where:o.where})));
    const bu=L.find(o=>o.k==='c'&&o.id===BU),st=L.find(o=>o.k==='s'&&o.id===ST);
    ok(bu&&bu.uids.join()==='u2'&&bu.where==='box','the Buneary is suggested as caught, for Jonas, in his box');
    ok(st&&st.uids.length===4,'the Starly is suggested as seen for all four trainers');
    ok(await p.evaluate(()=>tabCount('dex'))===L.length,'the Pokédex tab shows how many wait ('+L.length+')');
    t=await txt(p);
    ok(/in Jonas’s box/.test(t)&&/shown to Mira, Jonas, Cora, Ines/.test(t),'the list says why (in Jonas’s box; shown to the table, with the names)');
    // approve the Buneary, dismiss the Starly
    await click(p,{act:'dx_sg',i:String(L.indexOf(L.find(o=>o.k==='c'&&o.id===BU))),v:'1'});await W(p);
    ok((await dx('u2'))['n'+BU]===2,'Mark caught saves it as caught');
    L=await p.evaluate(()=>dxSuggest().map(o=>({k:o.k,id:o.id})));
    await click(p,{act:'dx_sg',i:String(L.findIndex(o=>o.k==='s'&&o.id===ST)),v:'0'});await W(p);
    ok(!(await dx('u1'))['n'+ST],'Not now does not mark it');
    const dis=await p.evaluate(()=>JSON.parse(JSON.stringify(S.dashGm.dxd||{})));
    ok(['u1','u2','u3','u4'].every(u=>dis[u]&&dis[u]['s'+ST]===1),'Not now is remembered for each trainer (GM-only)');
    ok(!(await p.evaluate(ST=>dxSuggest().some(o=>o.id===ST),ST)),'a dismissed suggestion stays gone');
    // approve all
    await click(p,{act:'dx_sgall',v:'1'});await W(p);
    ok((await dx('u4'))['n'+SH]===1&&await p.evaluate(()=>dxSuggest().length)===0,'Approve all saves the rest (Ines has seen Shinx) and empties the list');
    ok(await p.evaluate(()=>!document.querySelector('.dxsug')),'with nothing to confirm, the box goes away');

    // an entry: a row per trainer
    await go(p,EE);
    const rows=await p.evaluate(()=>[...document.querySelectorAll('.dxwr')].map(r=>r.querySelector('b').textContent+':'+([...r.querySelectorAll('[aria-pressed="true"]')].map(x=>x.textContent).join())));
    ok(rows.length===4&&rows[1]==='Jonas:Caught'&&rows[2]==='Cora:Not met','every trainer has a row with their mark ('+rows.join(' | ')+')');
    await p.click('.dxwr:nth-child(3) [data-act="dx_mark"][data-v="1"]');await W(p);
    ok((await dx('u3'))['n'+EE]===1,'the GM marks Cora as having seen Eevee from her row');
    await p.click('.dxwr:nth-child(2) [data-act="dx_mark"][data-v="0"]');await W(p);
    ok(!(await dx('u2'))['n'+EE]&&await p.evaluate(()=>[...document.querySelectorAll('.dxwr')][1].innerText).then(s=>/in their party or box/.test(s)),'set back to Not met, Jonas’s row notes the Eevee in his party');
    ok(await p.evaluate(()=>dxSuggest().some(o=>o.k==='c'&&o.uids[0]==='u2')),'and it is suggested again');
    ok(errs.length===0,'no page errors ('+errs.slice(0,3).join(' | ')+')');
    await b.close();
  }
  /* ---------- a player ---------- */
  {
    const seedFn=S=>{
      Object.keys(S).filter(k=>/^trainers\/u\d$/.test(k)).forEach(k=>{S[k].dxv=2;});
      S['trainers/u2'].dx={n133:1};                       // the GM has marked Jonas's Eevee as seen, not caught
      S['meta/mega']={dx_lock:true};
      return S;};
    const {b,p,errs}=await open({admin:false,uid:'u2',tab:'dex',seedFn});
    await W(p,800);
    let t=await txt(p);
    ok(/The GM marks what you have seen and caught/.test(t)&&!/To confirm/.test(t),'a player reads who marks the Pokédex, and has nothing to confirm');
    await go(p,133);
    t=await txt(p);
    ok(/Seen/.test(t)&&/In your party or box · waiting for the GM/.test(t),'the Eevee shows as Seen, waiting for the GM');
    ok(/The full entry opens once the GM marks it caught/.test(t),'with the book locked, the full entry waits for the GM');
    ok(await p.evaluate(()=>document.querySelectorAll('[data-act="dx_mark"]').length)===0,'no mark buttons for a player');
    await click(p,{act:'dx_mark',uid:'u2',id:'133',v:'2'});await W(p);
    ok(await p.evaluate(()=>S.trainers.u2.dx.n133)===1,'a player cannot change a mark');
    await go(p,25);
    t=await txt(p);
    ok(/\?\?\?/.test(t)&&/when the GM marks it/.test(t),'an unmarked species stays ???');
    ok(errs.length===0,'no page errors ('+errs.slice(0,3).join(' | ')+')');
    await b.close();
  }
  console.log(fails?fails+' FAILED':'ALL PASSED');
  process.exit(fails?1:0);
})();
