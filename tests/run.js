/* Runs every tests/t_*.js in turn and prints one line per file. Usage: node tests/run.js [name ...]
   Needs Node and Playwright with Chromium (npm i playwright && npx playwright install chromium). */
const fs=require('fs');const path=require('path');const {spawnSync}=require('child_process');
const want=process.argv.slice(2);
const files=fs.readdirSync(__dirname).filter(f=>/^t_.*\.js$/.test(f)&&(!want.length||want.some(w=>f.includes(w)))).sort();
fs.mkdirSync(path.join(__dirname,'out'),{recursive:true});
let bad=0;
for(const f of files){
  const r=spawnSync(process.execPath,[path.join(__dirname,f)],{encoding:'utf8',timeout:300000});
  const out=(r.stdout||'')+(r.stderr||'');
  const pass=(out.match(/^PASS /gm)||[]).length,fail=(out.match(/^FAIL /gm)||[]).length;
  const ok=r.status===0&&!fail&&!/FAILED|Error:/.test(out);
  if(!ok)bad++;
  console.log((ok?'ok   ':'FAIL ')+f.padEnd(18)+pass+' passed'+(fail?', '+fail+' failed':''));
  if(!ok)console.log(out.split('\n').filter(l=>/^FAIL |Error|FAILED/.test(l)).slice(0,12).map(l=>'       '+l).join('\n'));
}
console.log(bad?bad+' test file(s) failed':'All '+files.length+' test files passed');
process.exit(bad?1:0);
