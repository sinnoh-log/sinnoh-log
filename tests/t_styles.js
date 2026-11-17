/* Battle styles are the GM's (Update 62): players see no Style column on the Gym circuit, cannot search by style and are
   not told about style labels. The GM sees and edits them as before; contest specialties still show to everyone. */
const {open}=require('./lib');
let fails=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fails++;};
const STYLES=/Aggressor|Defender|Generalist|Trickster|Specialist|Showman/g;
const seedFn=S=>{S['meta/conditions']={date:'2026-07-11',rkb:{seed:12345,n:300,wk:4},rk:{lab:{u1:'Aggressor'},npc:[{k:'r1',n:'Rook Gallagher',p:120,s:'Trickster',h:'Twinleaf'}]}};return S;};
const look=async p=>{
  await p.evaluate(()=>{S.ui.rk.view='all';S.ui.rk.c='gym';S.ui.rk.q='';S.ui.rk.open='n_r1';render();});await p.waitForTimeout(400);
  const r=await p.evaluate(()=>{const t=document.getElementById('main').innerText;return {col:[...document.querySelectorAll('.rkt thead th')].map(x=>x.textContent).join('|'),labs:(t.match(/Aggressor|Defender|Generalist|Trickster|Specialist|Showman/g)||[]).length,note:/style label/.test(t),ph:(document.querySelector('input[data-u="rk.q"]')||{}).placeholder||'',cells:document.querySelector('.rkt tbody tr:not(.rkgap)').children.length};});
  await p.evaluate(()=>{S.ui.rk.q='trickster';render();});await p.waitForTimeout(300);
  r.found=await p.evaluate(()=>document.querySelectorAll('.rkt tbody tr:not(.rkgap):not(.rkcardrow)').length);
  await p.evaluate(()=>{S.ui.rk.q='';S.ui.rk.c='con';render();});await p.waitForTimeout(300);
  r.con=await p.evaluate(()=>[...document.querySelectorAll('.rkt thead th')].map(x=>x.textContent).join('|'));
  return r;
};
(async()=>{
  let {b,p,errs}=await open({admin:false,uid:'u1',tab:'rank',seedFn});
  await p.waitForTimeout(1500);
  let r=await look(p);
  ok(r.col==='#|Trainer|RP|Record'&&r.cells===4,'players: the Gym circuit has no Style column');
  ok(r.labs===0&&!r.note,'players: no style names anywhere on the page, even on a rival’s open card, and no note about style labels');
  ok(r.found===0&&r.ph==='Veilstone, Ortega…','players: searching “trickster” finds no one, and the search hint leaves styles out');
  ok(r.con==='#|Trainer|CP|Specialty|Record','players: the Contest circuit still shows specialties');
  ok(errs.length===0,'no page errors for a player');
  await b.close();
  ({b,p,errs}=await open({admin:true,uid:'u1',tab:'rank',seedFn}));
  await p.waitForTimeout(1500);
  r=await look(p);
  ok(r.col==='#|Trainer|RP|Style|Record'&&r.labs>10&&r.found>0,'the GM still sees, edits and searches styles');
  ok(await p.evaluate(()=>{S.ui.rk.c='gym';render();return /Players do not see style labels/.test(document.getElementById('main').innerText);}),'and is reminded that players do not see them');
  ok(errs.length===0,'no page errors for the GM');
  await b.close();
  console.log(fails?fails+' FAILED':'ALL PASSED');
})();
