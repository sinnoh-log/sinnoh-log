const {open}=require('./lib');
let fails=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fails++;};
const click=(p,a)=>p.evaluate(a=>{const b=document.createElement('button');Object.entries(a).forEach(([k,v])=>b.dataset[k]=v);b.hidden=true;document.body.appendChild(b);b.click();},a);
const upd=(p,path,o)=>p.evaluate(([a,b])=>window.__db.doc(a).set(b,{merge:true}),[path,o]);
const mons=p=>p.evaluate(()=>{const o=[];window.__store.forEach((v,k)=>{if(/^trainers\/u1\/pokemon\//.test(k)&&v&&v.caught&&/Caught in the wild/.test(v.caught))o.push(v);});return o;});
(async()=>{
  const {b,p,errs}=await open({admin:true,uid:'u1',tab:'battle'});
  const fresh=n=>({sp:'Rattata',nick:'',ty:['Normal'],sz:'Small',wt:'Light',hp:{cur:20,max:20},base:{atk:3,def:3,spa:3,spd:5,spe:3},mv:[{name:'Tackle',freq:'At-Will',kind:'Physical',range:'Melee',type:'Normal',dice:'2d6',text:'',used:0}],ps:[],notes:'',sh:{},stages:{atk:0,def:0,spa:0,spd:0,spe:0},ini:5,bonus:{atk:0,def:0,spa:0,spd:0,spe:0}});
  for(const [k,chk] of [['alpha',m=>m.passives.some(x=>x.name==='Alpha')&&!m.passives.some(x=>/Alpha (Tenacity|Aura)|Wild Might/.test(x.name))&&m.hp.max===20&&m.size==='Small'],
                        ['totem',m=>m.moves.some(x=>x.name==='Totem Memory')&&!m.moves.some(x=>/Totemic/.test(x.name))&&!m.passives.some(x=>/Totem/.test(x.name))&&m.hp.max===20],
                        ['titan',m=>m.passives.some(x=>x.name==='Titanic')&&!m.passives.some(x=>/Titan Mystica|Massive|Vitality/.test(x.name))&&m.hp.max===38&&m.size==='Medium']]){
    await upd(p,'gm/battle',{foes:{c1:fresh()}});await p.waitForTimeout(900);
    await click(p,{act:'b_kind',cid:'c1',k});await p.waitForTimeout(1000);
    await click(p,{act:'b_give',cid:'c1'});await p.waitForTimeout(1200);
    const ms=await mons(p);const m=ms[ms.length-1];
    ok(!!m&&chk(m),k+': given to a trainer loses the wild parts and gains what it keeps ('+(m?JSON.stringify({hp:m.hp,size:m.size,ps:m.passives.map(x=>x.name),mv:m.moves.map(x=>x.name)}):'none')+')');
  }
  ok(errs.length===0,'no page errors ('+errs.slice(0,3).join(' | ')+')');
  await b.close();console.log(fails?fails+' FAILED':'ALL PASSED');
})();
