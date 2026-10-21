const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
try{
const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
const settled=()=>page.waitForFunction(()=>document.getElementById('board').getAttribute('aria-busy')!=='true');
await page.goto('http://127.0.0.1:8080');await page.locator('#playBtn').click();await page.locator('#sound').tap();
assert.ok(!(await page.locator('meta[name=viewport]').getAttribute('content')).includes('maximum-scale'));
// Dispatch duplicates in the same task, before a single animation frame can finish.
const state=await page.evaluate(()=>{
const button=document.querySelector('[aria-label="Satır 4, sütun 4, R yönü"]');
button.click();button.dispatchEvent(new MouseEvent('click',{bubbles:true}));
return {moves,remaining:blocks.length,busy,disabled:document.getElementById('reset').disabled,exiting:button.classList.contains('exiting')};
});
assert.deepEqual(state,{moves:1,remaining:2,busy:true,disabled:true,exiting:true});
await settled();assert.equal(await page.locator('.block').count(),2);
await page.locator('#undo').tap();assert.equal(await page.locator('.block').count(),3);
await page.getByRole('button',{name:'Satır 2, sütun 2, R yönü',exact:true}).tap();
assert.equal(await page.locator('#moves').textContent(),'0');
await settled();assert.equal(await page.locator('.block.blocked').count(),0);
// All arrow vectors must produce correctly signed travel and opacity keyframes.
for(const dir of ['U','D','L','R']){
const frames=await page.evaluate(dir=>{
const el=document.querySelector('.block');
const promise=animateBlock(el,{dir},false);
const animation=el.getAnimations()[0];const frames=animation.effect.getKeyframes();animation.cancel();
return promise.then(()=>frames);
},dir);
const transform=frames.at(-1).transform;
const [x,y]=transform.match(/-?[\d.]+(?=px)/g).map(Number);
assert.equal(Math.sign(x),dir==='L'?-1:dir==='R'?1:0);
assert.equal(Math.sign(y),dir==='U'?-1:dir==='D'?1:0);
assert.equal(frames.at(-1).opacity,'1');
}
// Cancellation cannot strand the board lock.
await page.evaluate(()=>{document.querySelector('[aria-label="Satır 4, sütun 4, R yönü"]').click();document.querySelector('.exiting').getAnimations().forEach(a=>a.cancel())});
await settled();assert.equal(await page.locator('#reset').isEnabled(),true);
await page.locator('#reset').tap();
// Runtime reduced-motion preference skips movement while preserving move semantics.
await page.emulateMedia({reducedMotion:'reduce'});
await page.getByRole('button',{name:'Satır 4, sütun 4, R yönü',exact:true}).tap();await settled();
assert.equal(await page.locator('.exiting').count(),0);assert.equal(await page.locator('#moves').textContent(),'1');
for(const label of ['Satır 2, sütun 4, D yönü','Satır 2, sütun 2, R yönü']){await page.getByRole('button',{name:label,exact:true}).tap();await settled()}
assert.equal(await page.locator('#overlay').isVisible(),true);
assert.equal(await page.locator('.modal').evaluate(el=>getComputedStyle(el).animationName),'none');
assert.equal(await page.evaluate(()=>localStorage.getItem('blockEscapeUnlocked')),'2');
await page.locator('#next').tap();assert.equal(await page.locator('#levelLabel').textContent(),'02 / 10');
await page.emulateMedia({reducedMotion:'no-preference'});
await page.evaluate(()=>load(0));
for(const label of ['Satır 4, sütun 4, R yönü','Satır 2, sütun 4, D yönü','Satır 2, sütun 2, R yönü']){await page.getByRole('button',{name:label,exact:true}).tap();await settled()}
assert.equal(await page.locator('.modal').evaluate(el=>getComputedStyle(el).animationName),'celebrate');
await page.locator('#close').tap();await page.locator('#undo').tap();assert.equal(await page.locator('.block').count(),1);
await page.locator('#reset').tap();assert.equal(await page.locator('.block').count(),3);
// Missing animation APIs and paused timelines must also release the lock.
await page.evaluate(()=>{Element.prototype.animate=undefined});
await page.getByRole('button',{name:'Satır 4, sütun 4, R yönü',exact:true}).tap();await settled();
assert.equal(await page.locator('#moves').textContent(),'1');
await page.reload();await page.locator('#playBtn').click();await page.evaluate(()=>load(0));await page.evaluate(()=>{document.querySelector('[aria-label="Satır 4, sütun 4, R yönü"]').click();document.querySelector('.exiting').getAnimations().forEach(a=>a.pause())});
await settled();assert.equal(await page.locator('#reset').isEnabled(),true);
assert.deepEqual(errors,[]);
console.log('PASS: touch, direction U/D/L/R, duplicate input lock, blocked feedback, cancellation, reduced motion, success animation, undo/reset and saved unlocking');
}finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
