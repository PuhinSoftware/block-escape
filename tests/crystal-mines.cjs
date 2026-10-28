const {firstLabels}=require('./helpers.cjs');
const {chromium,webkit}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const engine=process.env.BROWSER||'chromium';
if(!['chromium','webkit'].includes(engine))throw Error('Unknown BROWSER');
assert.doesNotMatch(fs.readFileSync('game.js','utf8'),/\b(?:undo|history)\b/,'removed action/state must not return');
(async()=>{
const browser=await (engine==='webkit'?webkit:chromium).launch(engine==='chromium'?{executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']}:{});
try{
for(const [width,height] of [[320,568],[375,667],[390,844],[430,932]]){
const page=await browser.newPage({viewport:{width,height},isMobile:true,hasTouch:true});const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.goto('http://127.0.0.1:8080');await page.waitForFunction(()=>levelsReady);await page.locator('#playBtn').tap();await page.waitForFunction(()=>document.querySelector('.app').getAnimations().length===0);
assert.equal(await page.locator('#undo').count(),0);assert.equal(await page.evaluate(()=>typeof undo),'undefined');
assert.deepEqual(await page.locator('.controls button').evaluateAll(buttons=>buttons.map(button=>button.id)),['reset','levelsBtn']);
assert.deepEqual(await page.locator('.hud-level strong,.hud strong').evaluateAll(counters=>counters.map(counter=>counter.id)),['levelLabel','moves','remaining']);
assert.equal(await page.locator('.app h1').textContent(),'KRİSTAL MADENLERİ');
assert.equal(await page.locator('.bloop-helper img').evaluate(img=>img.complete&&img.naturalWidth>0&&img.src.endsWith('gameplay/miner-bloop.webp')),true);
assert.ok((await page.request.get('http://127.0.0.1:8080/assets/gameplay/crystal-mine.webp')).ok());
assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth));
const measure=()=>page.locator('.cell').evaluateAll(cells=>cells.map(cell=>{const r=cell.getBoundingClientRect();return [r.x+scrollX,r.y+scrollY,r.width,r.height]}));
const initial=await measure();assert.equal(initial.length,36);
const validate=async()=>{const current=await measure();current.forEach((rect,i)=>{assert.ok(Math.abs(rect[2]-rect[3])<.1);rect.forEach((v,j)=>assert.ok(Math.abs(v-initial[i][j])<.1))});assert.ok(await page.locator('.block').evaluateAll(els=>els.every(el=>{const b=el.getBoundingClientRect(),c=el.parentElement.getBoundingClientRect();return b.left>=c.left-.1&&b.top>=c.top-.1&&b.right<=c.right+.1&&b.bottom<=c.bottom+.1})));};
await validate();
if(process.env.ARTIFACT_DIR){fs.mkdirSync(process.env.ARTIFACT_DIR,{recursive:true});await page.screenshot({path:`${process.env.ARTIFACT_DIR}/mines-${width}.png`,fullPage:true})}
await page.getByRole('button',{name:firstLabels[0],exact:true}).tap();await page.waitForFunction(()=>!busy);await validate();
await page.keyboard.press('Control+z');await page.keyboard.press('Meta+z');assert.equal(await page.locator('#moves').textContent(),'1');assert.equal(await page.locator('.block').count(),2);
await page.locator('#reset').tap();assert.equal(await page.locator('#moves').textContent(),'0');assert.equal(await page.locator('.block').count(),3);await validate();
for(const label of [firstLabels[0],firstLabels[1],firstLabels[2]]){await page.getByRole('button',{name:label,exact:true}).tap();await page.waitForFunction(()=>!busy);await validate()}
assert.equal(await page.locator('#overlay').isVisible(),true);assert.equal(await page.evaluate(()=>localStorage.getItem('blockEscapeUnlockedV06')),'2');
if(process.env.ARTIFACT_DIR)await page.screenshot({path:`${process.env.ARTIFACT_DIR}/mines-win-${width}.png`,fullPage:true});
await page.locator('#close').tap();await page.locator('#levelsBtn').tap();assert.equal(await page.locator('#levelPicker button:enabled').count(),2);assert.equal(await page.locator('.victory-art').isVisible(),false);
await page.locator('#levelPicker button').nth(1).tap();assert.equal(await page.locator('#levelLabel').textContent(),'02 / 25');
await page.locator('#sound').tap();await page.locator('#homeBtn').tap();await page.locator('#settingsBtn').tap();assert.equal(await page.locator('#settingsSound').getAttribute('aria-pressed'),'false');await page.locator('#settingsDone').tap();
await page.locator('#playBtn').tap();assert.equal(await page.locator('#levelLabel').textContent(),'02 / 25');
await page.emulateMedia({reducedMotion:'reduce'});await page.waitForFunction(()=>matchMedia('(prefers-reduced-motion: reduce)').matches);
assert.equal(await page.locator('.bloop-helper').evaluate(el=>el.getAnimations({subtree:true}).length),0);assert.deepEqual(errors,[]);
console.log(`PASS ${engine} crystal mines ${width}x${height}: 6x6 geometry, controls/HUD, removed action/state/shortcuts, reset, win/unlock, picker, menu/sound, reduced motion`);await page.close();
}
}finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
