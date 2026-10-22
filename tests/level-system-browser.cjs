'use strict';
const {chromium,webkit}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
const {tapLegal,moveLabel,settled}=require('./helpers.cjs');
const report=require('../reports/levels-v06.json'),catalog=require('../levels/catalog.json');
const pack=require('../levels/v1/crystal-mines-001-025.json');
const engine=process.env.BROWSER||'chromium';
if(!['chromium','webkit'].includes(engine))throw Error('Unknown BROWSER');
const url='http://127.0.0.1:8080';
async function geometry(page){return page.locator('.cell').evaluateAll(els=>els.map(el=>{const r=el.getBoundingClientRect();return {x:r.x+scrollX,y:r.y+scrollY,width:r.width,height:r.height}}))}
async function check(page,baseline,stage){
 const viewport=page.viewportSize().width;assert.ok(await page.evaluate(width=>document.documentElement.scrollWidth<=width&&innerWidth<=width,viewport),stage+' true viewport overflow');
 const cells=await geometry(page);assert.equal(cells.length,36);
 cells.forEach((r,i)=>{assert.ok(Math.abs(r.width-r.height)<.1,stage+' square');for(const key of ['x','y','width','height'])assert.ok(Math.abs(r[key]-baseline[i][key])<.1,stage+' stable '+key)});
 assert.ok(await page.locator('.block').evaluateAll(els=>els.every(el=>{const b=el.getBoundingClientRect(),c=el.parentElement.getBoundingClientRect();return b.left>=c.left-.1&&b.right<=c.right+.1&&b.top>=c.top-.1&&b.bottom<=c.bottom+.1})),stage+' block containment');
}
async function shot(page,name){if(process.env.ARTIFACT_DIR){fs.mkdirSync(process.env.ARTIFACT_DIR,{recursive:true});await page.screenshot({path:`${process.env.ARTIFACT_DIR}/${engine}-${name}.png`,fullPage:true})}}
(async()=>{
const browser=await (engine==='webkit'?webkit:chromium).launch(engine==='chromium'?{executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']}:{});
try{
 for(const [width,height] of [[320,568],[375,667],[390,844],[430,932]]){
  const page=await browser.newPage({viewport:{width,height},isMobile:true,hasTouch:true,reducedMotion:'reduce'}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{localStorage.setItem('blockEscapeUnlocked','10');localStorage.setItem('blockEscapeSound','off')});
  await page.goto(url);await page.waitForFunction(()=>levelsReady);
  assert.equal(await page.evaluate(()=>unlocked),1,'old progress must not unlock new puzzles');
  await page.locator('#menuLevels').tap();assert.equal(await page.locator('#levelPicker button').count(),25);assert.equal(await page.locator('#levelPicker button:enabled').count(),1);await page.locator('#close').tap();await page.locator('#playBtn').tap();
  for(let i=0;i<25;i++){
   assert.equal(await page.locator('#levelLabel').textContent(),`${String(i+1).padStart(2,'0')} / 25`);
   const baseline=await geometry(page),count=report.results[i].blockCount;
   if(width===320&&i===0){const old=await page.addStyleTag({content:'.crystals-right{right:-15px}'});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth),'old rotated decoration must reproduce overflow');await old.evaluate(el=>el.remove())}
   assert.equal(await page.locator('.block').count(),count);await check(page,baseline,`${width}/${i+1}/initial`);
   if([0,4,9,14,24].includes(i))await shot(page,`level-${i+1}-${width}`);
   // Verify a real hit target rather than programmatically invoking the game handler.
   if(i===1){await page.getByRole('button',{name:await moveLabel(page,false),exact:true}).tap();await settled(page);assert.equal(await page.locator('#moves').textContent(),'0')}
   if(i===12){await tapLegal(page);await page.locator('#reset').tap();assert.equal(await page.locator('.block').count(),count);assert.equal(await page.locator('#moves').textContent(),'0');await check(page,baseline,'reset')}
   for(let n=0;n<count;n++){await tapLegal(page);assert.equal(await page.locator('#moves').textContent(),String(n+1));if([0,Math.floor(count/2),count-1].includes(n))await check(page,baseline,`${width}/${i+1}/${n+1}`)}
   assert.equal(await page.locator('#overlay').isVisible(),true);assert.equal(await page.locator('#remaining').textContent(),'0');
   assert.equal(await page.evaluate(()=>localStorage.getItem('blockEscapeUnlockedV06')),String(Math.min(25,i+2)));
   assert.equal(await page.evaluate(()=>localStorage.getItem('blockEscapeUnlocked')),'10');
   if(i<24)await page.locator('#next').tap();
  }
  await page.locator('#close').tap();await page.locator('#homeBtn').tap();await page.locator('#menuLevels').tap();assert.equal(await page.locator('#levelPicker button:enabled').count(),25);await shot(page,`picker-${width}`);await page.locator('#close').tap();
  await page.reload();await page.locator('#playBtn').tap();assert.equal(await page.locator('#levelLabel').textContent(),'25 / 25');assert.equal(await page.locator('#sound').getAttribute('aria-pressed'),'false');assert.equal(await page.evaluate(()=>localStorage.getItem('blockEscapeUnlocked')),'10');
  assert.deepEqual(errors,[]);await page.close();console.log(`PASS ${engine} ${width}px: all 25 levels / 375 real touch moves, 36-cell first/middle/final geometry, reset, blocked move, 25-only picker, old/new progress isolation and reload`);
 }
 // Network/schema failures cannot expose a partially loaded or empty playable catalog.
 for(const mode of ['network','version','pack','overlap']){
  const page=await browser.newPage({reducedMotion:'reduce',hasTouch:true});const errors=[];page.on('pageerror',e=>errors.push(e.message));
  const pattern=mode==='network'||mode==='version'?'**/levels/catalog.json':'**/levels/v1/*.json';
  await page.route(pattern,route=>{if(mode==='network')return route.abort();if(mode==='version')return route.fulfill({json:{...catalog,schemaVersion:999}});const data=structuredClone(pack);if(mode==='pack')data.levels.pop();else data.levels[0].blocks[1]={...data.levels[0].blocks[0],id:1};return route.fulfill({json:data})});
  await page.goto(url);await page.locator('#retryLevels').waitFor({state:'visible'});assert.equal(await page.locator('#playBtn').isDisabled(),true);assert.equal(await page.locator('#menuLevels').isDisabled(),true);assert.equal(await page.evaluate(()=>levelsReady),false);
  await page.unroute(pattern);await page.locator('#retryLevels').click();await page.locator('#playBtn').click();assert.equal(await page.locator('.cell').count(),36);await tapLegal(page);assert.deepEqual(errors,[]);await page.close();
 }
 console.log('PASS catalog network/version/count/overlap failures: disabled play, accessible retry, successful recovery');
 for(const value of ['garbage','-1','1.5','999','25']){
  const page=await browser.newPage({reducedMotion:'reduce',hasTouch:true});await page.addInitScript(value=>{localStorage.setItem('blockEscapeUnlocked','10');localStorage.setItem('blockEscapeUnlockedV06',value)},value);await page.goto(url);await page.waitForFunction(()=>levelsReady);assert.equal(await page.evaluate(()=>unlocked),value==='999'||value==='25'?25:1);assert.equal(await page.evaluate(()=>localStorage.getItem('blockEscapeUnlocked')),'10');await page.close();
 }
 console.log('PASS invalid/new progress handling, maximum published level clamp, legacy key preservation');
 // GitHub Pages-style subdirectory: all JSON and script URLs resolve relative to it.
 const page=await browser.newPage({reducedMotion:'reduce',hasTouch:true});
 await page.route('**/block-escape/**',async route=>{const requestUrl=new URL(route.request().url());const response=await page.request.get(url+requestUrl.pathname.replace(/^\/block-escape/,'/') .replace('//','/'));await route.fulfill({response})});
 await page.goto(url+'/block-escape/');await page.locator('#playBtn').click();assert.equal(await page.locator('.cell').count(),36);await tapLegal(page);await page.close();console.log('PASS project-subdirectory relative JSON/assets and play');
}finally{await browser.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
