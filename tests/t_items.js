/* Item pictures (Update 53): every item tile and small item icon keeps its square shape and fits its tile, on a computer and on a phone. */
const {open,ROOT}=require('./lib');const fs=require('fs');const path=require('path');
let fails=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fails++;};
const click=(p,a)=>p.evaluate(a=>{const b=document.createElement('button');Object.entries(a).forEach(([k,v])=>b.dataset[k]=v);b.hidden=true;document.body.appendChild(b);b.click();},a);
const W=(p,n)=>p.waitForTimeout(n||600);
const FX=path.join(__dirname,'fixtures/items/');
const seedFn=S=>{Object.assign(S['trainers/u1'],{items:[{name:'Poke Ball',qty:5,note:''},{name:'Potion',qty:2,note:'Two left'},{name:'Magnet',qty:1,note:''}]});Object.assign(S['trainers/u1/pokemon/p1'],{item:'Magnet',ball:'Poke Ball'});
  S['gm/nt_x1']={name:'Rhea',order:1,items:[{name:'Poke Ball',qty:3,note:''},{name:'Potion',qty:1,note:''}],team:[]};return S;};
/* measure every loaded item picture: its drawn size and the tile around it */
const measure=p=>p.evaluate(()=>[...document.querySelectorAll('img.sp.it')].filter(i=>i.naturalWidth>0&&i.offsetParent).map(i=>{const r=i.getBoundingClientRect(),t=i.closest('.itile'),tr=t?t.getBoundingClientRect():null;
  return {mini:i.classList.contains('mini'),w:Math.round(r.width),h:Math.round(r.height),tw:tr?Math.round(tr.width):0,th:tr?Math.round(tr.height):0,fit:getComputedStyle(i).objectFit};}));
const check=(list,where)=>{
  ok(list.length>0,where+': item pictures are drawn ('+list.length+')');
  const bad=list.filter(x=>Math.abs(x.w-x.h)>1||(x.tw&&(x.w>x.tw||x.h>x.th))||x.fit!=='contain');
  ok(!bad.length,where+': every picture is square and fits its tile'+(bad.length?' ('+JSON.stringify(bad[0])+')':''));
};
async function routeSprites(p){
  await p.route(/raw\.githubusercontent\.com\/PokeAPI\/sprites\/master\/sprites\/items\/(.*)\.png/,r=>{const f=FX+r.request().url().split('/').pop();
    if(fs.existsSync(f))r.fulfill({status:200,contentType:'image/png',body:fs.readFileSync(f)});else r.fulfill({status:404,body:''});});
  await p.reload();await W(p,1500);
}
(async()=>{
  for(const [w,label] of [[1280,'computer'],[390,'phone']]){
    let {b,p,errs}=await open({admin:true,uid:'u1',tab:'trainer',w,h:1200,seedFn});
    await routeSprites(p);
    await click(p,{act:'shtab',v:'bag'});await W(p);
    check(await measure(p),label+', bag');
    const rd=(await measure(p)).filter(x=>!x.mini);
    ok(rd.length>0&&rd.every(x=>x.w>=30&&x.w<=x.tw),label+', bag: pictures are at least their own size ('+rd.map(x=>x.w+'x'+x.h+' in '+x.tw).join(', ')+')');
    await click(p,{act:'toggle',key:'edtu1'});await W(p);
    check(await measure(p),label+', bag (Edit)');
    if(w===1280)await p.locator('section.panel',{hasText:'Inventory'}).first().screenshot({path:ROOT+'/tests/out/items_edit.png'});
    // a Pokémon's held item and ball
    await click(p,{act:'tab',tab:'pokemon'});await W(p);await click(p,{act:'toggle',key:'pu1/p1'});await W(p,900);
    const mini=(await measure(p)).filter(x=>x.mini);
    ok(mini.length>0&&mini.every(x=>x.w===x.h),label+', Pokémon sheet: the held item and ball icons are square ('+mini.map(x=>x.w+'x'+x.h).join(', ')+')');
    // the Shop tile, drawn into the page with the Shop's own markup
    await p.evaluate(()=>{const d=document.createElement('div');d.className='splist';d.innerHTML='<div class="spitem"><div class="spmain">'+itemTile('Poke Ball').s+'<div><b>Poke Ball</b><p class="sub">'+'A long description of the item that wraps over several lines on a phone screen. '.repeat(3)+'</p></div></div></div>';document.querySelector('main').prepend(d);});
    await W(p,800);
    check((await measure(p)).filter(x=>!x.mini),label+', Shop');
    // an NPC's inventory
    await click(p,{act:'tab',tab:'npc'});await W(p);
    await p.evaluate(()=>{S.ui.nt.open.x1=true;render();});await W(p,900);
    check(await measure(p),label+', NPC inventory');
    if(w===390)await p.screenshot({path:ROOT+'/tests/out/items_phone.png'});
    ok(errs.length===0,label+': no page errors ('+errs.slice(0,3).join(' | ')+')');
    await b.close();
  }
  console.log(fails?fails+' FAILED':'ALL PASSED');
})();
