/* People as one list (Update 73): an NPC the GM shows and the party's entry for the same person are one card (what the
   GM revealed on top, the party's notes below). Same names link by themselves; the GM links or unlinks by hand. A shown NPC
   nobody has written about gets Add party notes. One set of filters covers everyone. */
const {open}=require('./lib');
let fails=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fails++;};
const click=(p,a)=>p.evaluate(a=>{const b=document.createElement('button');Object.entries(a).forEach(([k,v])=>b.dataset[k]=v);b.hidden=true;document.body.appendChild(b);b.click();b.remove();},a);
const W=(p,n)=>p.waitForTimeout(n||500);
const nt=(name,role,cat,o)=>Object.assign({name,role,cat,place:'',notes:'',cls:'Ace Trainer',adv:'',level:30,hp:{cur:40,max:40},stats:{atk:3,def:3,spa:3,spd:3,spe:3},items:[],team:[],
  rev:{on:1,role:1,place:0,notes:1,pic:0,cls:1,stats:0,items:0},order:1,createdAt:1},o||{});
const seedFn=S=>{
  S['people/pa']={name:'Fantina',role:'',place:'Hearthome',met:2,att:'friendly',notes:'Loves opera. Owes Impala a favour.',pinned:false,addedBy:'u2',createdAt:10};
  S['people/pb']={name:'Woman in the green coat',role:'',place:'Eterna Forest',met:3,att:'wary',notes:'Followed us for an hour.',pinned:false,addedBy:'u2',createdAt:20};
  S['people/pc']={name:'Tomas Vey',role:'Hostel owner',place:'Jubilife',met:1,att:'friendly',notes:'',pinned:true,addedBy:'u1',createdAt:5};
  S['gm/nt_a']=nt('Fantina','Hearthome Gym Leader','gym',{notes:'She smiles like she knows the ending.',team:[{id:'m1',sp:'Mismagius',sh:{name:1,pic:1,types:1}}]});
  S['gm/nt_b']=nt('Gardenia','Eterna Gym Leader','gym');
  S['gm/nt_c']=nt('Garrick Voss','Collector','other',{notes:'Smells of tobacco.'});
  S['gm/npc_pa']={secret:'Fantina knows about the Silver Cage.'};
  return S;};
(async()=>{
  const {b,p,errs}=await open({admin:true,uid:'u1',tab:'people',seedFn});
  await p.evaluate(()=>{['a','b','c'].forEach(id=>ntPublish(id));});await W(p,800);
  const cards=()=>p.evaluate(()=>[...document.querySelectorAll('#main article.pcard h3')].map(x=>x.textContent.replace('★ ','').trim()));
  const main=()=>p.evaluate(()=>document.getElementById('main').innerText);
  ok(await p.evaluate(()=>Object.keys((S.npcPub&&S.npcPub.n)||{}).length)===3,'three NPCs are shown to the table');
  let c=await cards(),t=await main();
  ok(c.length===5&&c.filter(x=>x==='Fantina').length===1,'one list: Fantina is one card (the shown NPC and the party’s entry), five cards in all ('+c.join(', ')+')');
  ok(!/Trainers you have met/.test(t),'no separate “Trainers you have met” section any more');
  ok(c[0]==='Tomas Vey','a pinned entry stays at the top');
  const fan=await p.evaluate(()=>{const a=[...document.querySelectorAll('#main article.pcard')].find(x=>x.querySelector('h3').textContent.includes('Fantina'));return a.innerText;});
  ok(/Shown by the GM/.test(fan)&&/knows the ending/.test(fan)&&/Hearthome Gym Leader/.test(fan)&&/Friendly/.test(fan)&&/Loves opera/.test(fan)&&/Level 30/.test(fan),'Fantina’s card: the GM’s role, level and note on top, the party’s attitude and notes below');
  ok(/Team \(1\)/.test(fan)&&!/Mismagius/.test(fan),'her team is folded under Team (1)');
  ok(/Silver Cage/.test(fan)&&/Open NPC sheet/.test(fan)&&/Unlink/.test(fan),'the GM sees the secret, Open NPC sheet and Unlink');
  ok(await p.evaluate(()=>tabCount('people'))===5,'the menu counts cards (5)');
  // the team
  await click(p,{act:'toggle',key:'ptppa'});await W(p);
  t=await main();
  ok(/Mismagius/.test(t)&&/Hide the team/.test(t),'Team (1) opens her shown Pokémon');
  // filters
  await p.evaluate(()=>{S.ui.f.ptr=true;render();});await W(p);
  c=await cards();
  ok(c.length===3&&c.indexOf('Tomas Vey')<0,'Trainers only: the three NPCs the GM has shown ('+c.join(', ')+')');
  await p.evaluate(()=>{S.ui.f.ptr=false;S.ui.q.people='collector';render();});await W(p);
  ok((await cards()).join()==='Garrick Voss','search covers what the GM revealed (“collector”)');
  await p.evaluate(()=>{S.ui.q.people='opera';render();});await W(p);
  ok((await cards()).join()==='Fantina','and the party’s notes (“opera”)');
  await p.evaluate(()=>{S.ui.q.people='';S.ui.f.pcat='gym';render();});await W(p);
  c=await cards();
  ok(c.length===2&&c.indexOf('Gardenia')>=0&&c.indexOf('Fantina')>=0,'the Gym Leader chip finds both Gym Leaders, shown or not');
  await p.evaluate(()=>{S.ui.f.pcat='';render();});await W(p);
  // linking by hand
  await p.evaluate(()=>pplLink('pb','b'));await W(p);
  c=await cards();
  const gar=await p.evaluate(()=>{const a=[...document.querySelectorAll('#main article.pcard')].find(x=>x.querySelector('h3').textContent.includes('Gardenia'));return a.innerText;});
  ok(c.length===4&&c.indexOf('Woman in the green coat')<0&&/The party’s entry: Woman in the green coat/.test(gar)&&/Followed us/.test(gar),'the GM links “Woman in the green coat” to Gardenia: one card, under her real name, with the party’s notes');
  // unlinking
  await click(p,{act:'ppl_unlink',id:'pa'});await W(p);
  c=await cards();
  ok(c.filter(x=>x==='Fantina').length===2&&await p.evaluate(()=>JSON.stringify(S.people.pa.nolink)==='["a"]'),'Unlink splits Fantina into two cards, and they stay split');
  await p.evaluate(()=>{S.ui.open.pplpa=true;render();});await W(p);
  ok(await p.evaluate(()=>{const s=document.querySelector('[data-pplnk="pa"]');return s&&s.value==='';}),'the entry’s Edit has the GM’s “Same person as” menu, set to no one');
  await p.evaluate(()=>{const s=document.querySelector('[data-pplnk="pa"]');s.value='a';s.dispatchEvent(new Event('change',{bubbles:true}));});await W(p);
  ok(await p.evaluate(()=>S.people.pa.nt==='a'&&JSON.stringify(S.people.pa.nolink)==='[]'),'choosing Fantina there links them again');
  await p.evaluate(()=>{S.ui.open.pplpa=false;render();});await W(p);
  // party notes on a shown NPC
  const before=await p.evaluate(()=>Object.keys(S.people).length);
  await click(p,{act:'ppl_notes',id:'c'});await W(p,700);
  const np=await p.evaluate(()=>Object.values(S.people).find(x=>x.nt==='c'));
  c=await cards();
  ok(np&&np.name==='Garrick Voss'&&await p.evaluate(()=>Object.keys(S.people).length)===before+1&&c.filter(x=>x==='Garrick Voss').length<=1,'Add party notes on Garrick makes the party’s entry, linked to him (still one card)');
  // open the sheet
  await click(p,{act:'ppl_sheet',id:'a'});await W(p);
  ok(await p.evaluate(()=>S.tab==='npc'&&S.ui.nt.open.a===true),'Open NPC sheet goes to NPC trainers with Fantina open');
  // a player
  await p.evaluate(()=>{S.me.admin=false;S.ui.open={};setTab('people');});await W(p,600);
  t=await main();
  ok(!/Open NPC sheet|Unlink|Silver Cage/.test(t)&&/Shown by the GM/.test(t)&&/Edit/.test(t),'a player sees the cards and Edit, not the GM’s secret or link tools');
  ok(errs.length===0,'no page errors ('+errs.slice(0,3).join(' | ')+')');
  await b.close();
  console.log(fails?fails+' FAILED':'ALL PASSED');
  process.exit(fails?1:0);
})();
