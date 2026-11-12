/* in-memory stand-in for window.claude: a Firestore-like db plus a user. Seed arrives as window.__SEED = {path: data}. */
(function(){
  const store=new Map();const L=[];   // L: listeners {kind,path,fn}
  Object.entries(window.__SEED||{}).forEach(([p,d])=>store.set(p,JSON.parse(JSON.stringify(d))));
  const parentOf=p=>p.slice(0,p.lastIndexOf('/'));
  const idOf=p=>p.slice(p.lastIndexOf('/')+1);
  const clone=o=>o==null?o:JSON.parse(JSON.stringify(o));
  const dsnap=p=>({id:idOf(p),exists:store.has(p),data:()=>clone(store.get(p)),metadata:{fromCache:false}});
  const csnap=(c,filt)=>{const docs=[];store.forEach((v,p)=>{if(parentOf(p)===c&&(!filt||filt(v)))docs.push(dsnap(p));});return {docs,size:docs.length,forEach:f=>docs.forEach(f),metadata:{fromCache:false}};};
  const notify=p=>{L.slice().forEach(l=>{if(l.kind==='doc'&&l.path===p||l.kind==='col'&&l.path===parentOf(p))Promise.resolve().then(()=>l.fn());});};
  const setIn=(o,parts,v)=>{let c=o;for(let i=0;i<parts.length-1;i++){if(c[parts[i]]==null||typeof c[parts[i]]!=='object')c[parts[i]]={};c=c[parts[i]];}c[parts[parts.length-1]]=v;};
  let uid=1;
  function docRef(p){return {id:idOf(p),path:p,
    collection:n=>colRef(p+'/'+n),
    get:async()=>dsnap(p),
    set:async(d,o)=>{const nv=clone(d);if(o&&o.merge&&store.has(p))store.set(p,Object.assign(store.get(p),nv));else store.set(p,nv);window.__writes.push(['set',p]);notify(p);},
    update:async(patch)=>{if(!store.has(p)){const e=new Error('nf');e.code='not-found';throw e;}const cur=store.get(p);Object.keys(patch).forEach(k=>setIn(cur,k.split('.'),clone(patch[k])));window.__writes.push(['update',p,Object.keys(patch)]);notify(p);},
    delete:async()=>{store.delete(p);window.__writes.push(['delete',p]);notify(p);},
    onSnapshot:(fn,err)=>{const l={kind:'doc',path:p,fn:()=>fn(dsnap(p))};L.push(l);Promise.resolve().then(l.fn);return ()=>{const i=L.indexOf(l);if(i>=0)L.splice(i,1);};}};}
  function colRef(c,filt){return {path:c,
    doc:id=>docRef(c+'/'+(id||('auto'+(uid++)))),
    where:(f,op,v)=>colRef(c,x=>x&&x[f]===v),
    orderBy:()=>colRef(c,filt),limit:()=>colRef(c,filt),
    get:async()=>csnap(c,filt),
    onSnapshot:(fn)=>{const l={kind:'col',path:c,fn:()=>fn(csnap(c,filt))};L.push(l);Promise.resolve().then(l.fn);return ()=>{const i=L.indexOf(l);if(i>=0)L.splice(i,1);};}};}
  const db={collection:colRef,doc:p=>docRef(p),batch:()=>{const ops=[];return {set:(r,d)=>ops.push(()=>r.set(d)),update:(r,d)=>ops.push(()=>r.update(d)),delete:r=>ops.push(()=>r.delete()),commit:async()=>{for(const o of ops)await o();}};}};
  window.__writes=[];window.__store=store;window.__db=db;
  const user={id:async()=>window.__UID||'u1',canEdit:async()=>!!window.__ADMIN,can:async()=>true,isOwner:()=>!!window.__ADMIN,me:async()=>({}),profiles:async()=>({})};
  window.claude={use:async n=>n==='db'?db:n==='user'?user:null};
})();
