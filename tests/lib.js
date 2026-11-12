/* Test helper: opens index.html in headless Chromium with an in-memory stand-in for the database (fake.js) and a small seed table. */
const fs=require('fs');const path=require('path');const {chromium}=require('playwright');
const ROOT=path.resolve(__dirname,'..');
const data=JSON.parse(fs.readFileSync(path.join(__dirname,'fixtures/handbook.json'),'utf8'));
const extra=JSON.parse(fs.readFileSync(path.join(__dirname,'fixtures/extra.json'),'utf8'));
/* A tiny static server for the repo. The real backend (Firebase) is left out: backend.js, firebase-config.js and vendor/ are served empty,
   so the page talks to the in-memory database in fake.js and no test ever touches the live table. */
const http=require('http');
const MIME={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json','.css':'text/css','.png':'image/png','.svg':'image/svg+xml','.webp':'image/webp','.jpg':'image/jpeg'};
let base=null;
function serve(){
  if(base)return base;
  base=new Promise(res=>{
    const srv=http.createServer((q,r)=>{
      const u=decodeURIComponent(q.url.split('?')[0]);
      if(u==='/backend.js'||u==='/firebase-config.js'||u.startsWith('/vendor/')){r.writeHead(200,{'content-type':MIME['.js']});r.end('');return;}
      const f=path.join(ROOT,path.normalize(u));
      if(!f.startsWith(ROOT)||!fs.existsSync(f)||fs.statSync(f).isDirectory()){r.writeHead(404);r.end();return;}
      r.writeHead(200,{'content-type':MIME[path.extname(f)]||'application/octet-stream'});fs.createReadStream(f).pipe(r);
    });
    srv.listen(0,'127.0.0.1',()=>{srv.unref();res('http://127.0.0.1:'+srv.address().port);});
  });
  return base;
}
const phb=data.moves.filter(m=>m.ph);
function seed(){
  const S={};
  const mon=(sp,ty,mv,o)=>Object.assign({species:sp,nick:'',types:ty,slot:'party',order:1,createdAt:1,lvl:10,hp:{cur:30,max:30},moves:mv||[]},o||{});
  const tr=(n,o)=>Object.assign({name:n,hometown:'Twinleaf',cls:'Ranger',adv:'Scout',hp:{cur:20,max:20},badges:{},createdAt:1,order:1},o||{});
  S['trainers/u1']=tr('Mira');
  S['trainers/u2']=tr('Jonas',{noGym:true,noCon:true,quote:'Quiet life'});
  S['trainers/u3']=tr('Cora',{noCon:true});
  S['trainers/u4']=tr('Ines',{noGym:true});
  S['trainers/u1/pokemon/p1']=mon('Gyarados',['Water','Flying'],[{name:'Bite',freq:'At-Will',kind:'Physical',range:'Melee',type:'Dark',dice:'2d6',text:'',used:0}]);
  S['trainers/u1/pokemon/p2']=mon('Magikarp',['Water'],[],{order:2});
  S['trainers/u1/pokemon/p3']=mon('Veluza',['Water','Psychic'],[],{order:3});
  S['trainers/u2/pokemon/q1']=mon('Eevee',['Normal'],[]);
  S['meta/pta_lists']={v:1,j:JSON.stringify({moves:data.moves,passives:data.passives,skills:data.skills,megas:data.megas,learn:{v:1,base:data.learn.mv,mv:{}}})};
  S['meta/pta_extra']={v:1,j:JSON.stringify(extra)};
  S['meta/pta_idx']={v:5,t:Date.now(),j:JSON.stringify(data.names)};
  const kws=['Reliable','Good Show!','Attention Grabber','Reflective Appeal'],cts=['Cool','Beauty','Cute','Clever','Tough'];
  S['meta/pta_contest']={v:1,j:JSON.stringify(phb.slice(0,200).map((m,i)=>[m.n,cts[i%5],kws[i%4],'']))};
  return S;
}
async function open({admin=false,uid='u1',tab='overview',w=1280,h=900,seedFn}={}){
  const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:w,height:h}});const p=await ctx.newPage();
  const errs=[];p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('console',m=>{if(m.type()==='error'&&!/net::|Failed to load|vendor|404/i.test(m.text()))errs.push('CONSOLE '+m.text());});
  const S=seedFn?seedFn(seed()):seed();
  await p.addInitScript(({S,admin,uid,tab})=>{window.__SEED=S;window.__ADMIN=admin;window.__UID=uid;try{localStorage.setItem('stl.tab',tab);localStorage.setItem('stl.view',uid);}catch(e){}},{S,admin,uid,tab});
  await p.addInitScript({content:fs.readFileSync(path.join(__dirname,'fake.js'),'utf8')});
  await p.goto(await serve()+'/index.html');
  await p.waitForTimeout(2500);
  return {b,p,errs};
}
module.exports={open,seed,data,ROOT};
