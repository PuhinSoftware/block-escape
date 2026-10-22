const {chromium,webkit}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const engine=process.env.BROWSER||'chromium';
if(!['chromium','webkit'].includes(engine))throw Error('Unknown BROWSER');
(async()=>{
const browser=await (engine==='webkit'?webkit:chromium).launch(engine==='chromium'?{executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']}:{});
try{
for(const [width,height] of [[320,568],[375,667],[390,844],[430,932]]){
const page=await browser.newPage({viewport:{width,height},isMobile:true,hasTouch:true});const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.goto('http://127.0.0.1:8080');await page.locator('#playBtn').tap();await page.locator('#sound').tap();await page.waitForFunction(()=>document.querySelector('.app').getAnimations().length===0);
const settled=()=>page.waitForFunction(()=>!busy);
const geometry=()=>page.locator('.cell').evaluateAll(els=>els.map(el=>{const r=el.getBoundingClientRect();return {x:r.x+scrollX,y:r.y+scrollY,width:r.width,height:r.height}}));
const baseline=await geometry();
const check=async stage=>{
assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${stage}: horizontal overflow`);
const cells=await geometry();assert.equal(cells.length,36);cells.forEach((r,i)=>{assert.ok(Math.abs(r.width-r.height)<.1);for(const key of ['x','y','width','height'])assert.ok(Math.abs(r[key]-baseline[i][key])<.1,`${stage}: cell ${i} ${key}`)});
assert.ok(await page.locator('.block').evaluateAll(els=>els.every(el=>{const b=el.getBoundingClientRect(),c=el.parentElement.getBoundingClientRect();return b.width<=c.width+.1&&b.height<=c.height+.1&&b.left>=c.left-.1&&b.top>=c.top-.1&&b.right<=c.right+.1&&b.bottom<=c.bottom+.1})),`${stage}: block containment`);
};
await check('initial');
assert.equal(await page.locator('.bloop-helper').evaluate(el=>getComputedStyle(el).pointerEvents),'none');
await page.locator('#board').scrollIntoViewIfNeeded();
assert.ok(await page.locator('.block').evaluateAll(els=>els.every(el=>{const r=el.getBoundingClientRect();return document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)===el})),'tiles unobstructed');
for(const id of ['homeBtn','sound','reset','levelsBtn']){const r=await page.locator('#'+id).boundingBox();assert.ok(r.width>=44&&r.height>=44)}
if(process.env.ARTIFACT_DIR){fs.mkdirSync(process.env.ARTIFACT_DIR,{recursive:true});await page.screenshot({path:`${process.env.ARTIFACT_DIR}/gameplay-${width}.png`,fullPage:true})}
for(const [i,label] of ['Satır 4, sütun 4, R yönü','Satır 2, sütun 4, D yönü','Satır 2, sütun 2, R yönü'].entries()){
await page.getByRole('button',{name:label,exact:true}).tap();await settled();await check(['first','middle','last'][i]);
}
assert.equal(await page.locator('.victory-art').isVisible(),true);assert.equal(await page.locator('.modal').evaluate(el=>getComputedStyle(el).animationName),'celebrate');
if(process.env.ARTIFACT_DIR)await page.screenshot({path:`${process.env.ARTIFACT_DIR}/victory-${width}.png`,fullPage:true});
await page.locator('#close').tap();
await page.locator('#reset').tap();await check('reset');assert.equal(await page.locator('.block').count(),3);
await page.locator('#homeBtn').tap();assert.equal(await page.locator('#menu').isVisible(),true);await page.locator('#settingsBtn').tap();assert.equal(await page.locator('#settingsSound').getAttribute('aria-pressed'),'false');await page.locator('#settingsDone').tap();
await page.locator('#playBtn').tap();assert.equal(await page.locator('#levelLabel').textContent(),'01 / 10');assert.equal(await page.evaluate(()=>localStorage.getItem('blockEscapeUnlocked')),'2');
await page.emulateMedia({reducedMotion:'reduce'});
for(const label of ['Satır 4, sütun 4, R yönü','Satır 2, sütun 4, D yönü','Satır 2, sütun 2, R yönü']){await page.getByRole('button',{name:label,exact:true}).tap();await settled()}
assert.equal(await page.locator('.modal').evaluate(el=>getComputedStyle(el).animationName),'none');assert.equal(await page.locator('.confetti-one').isVisible(),false);
assert.deepEqual(errors,[]);console.log(`PASS ${engine} gameplay ${width}x${height}: frame/cards, 36 square cells, no tile overflow, helper nonblocking, victory/reduced motion, reset/menu/storage`);await page.close();
}
}finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
