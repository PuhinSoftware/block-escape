const {chromium,webkit}=require('playwright');
const engine=process.env.BROWSER||'chromium';
if(!['chromium','webkit'].includes(engine))throw Error('Unknown BROWSER');
const assert=require('node:assert/strict');
(async()=>{
const browser=await (engine==='webkit'?webkit:chromium).launch(engine==='chromium'?{executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']}:{});
try{
for(const [width,height] of [[320,568],[375,667],[390,844],[430,932]]){
const page=await browser.newPage({viewport:{width,height},isMobile:true,hasTouch:true});
await page.goto('http://127.0.0.1:8080');
assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
assert.equal(await page.locator('#menu button').count(),3,'only play, levels and settings controls');
const audioBefore=await page.evaluate(()=>audioContext===undefined);assert.equal(audioBefore,true);
await page.locator('#settingsBtn').tap();await page.locator('#settingsSound').tap();assert.equal(await page.evaluate(()=>localStorage.getItem('blockEscapeSound')),'off');
assert.equal(await page.locator('#settingsSound').getAttribute('aria-pressed'),'false');await page.locator('#settingsDone').tap();
// Sample actual rendered animation transforms, not just animation names.
for(const selector of ['.bloop-layer','.cloud-one','.island-layer']){
const changed=await page.locator(selector).evaluate(el=>{const a=el.getAnimations()[0];a.pause();a.currentTime=0;const first=getComputedStyle(el).transform+' '+getComputedStyle(el).translate;a.currentTime=a.effect.getTiming().duration/2;const second=getComputedStyle(el).transform+' '+getComputedStyle(el).translate;a.play();return first!==second});assert.equal(changed,true,selector);
}
await page.locator('#playBtn').scrollIntoViewIfNeeded();
const rect=await page.locator('#playBtn').boundingBox();await page.mouse.move(rect.x+rect.width/2,rect.y+rect.height/2);await page.mouse.down();
await page.waitForFunction(()=>getComputedStyle(document.getElementById('playBtn')).transform!=='none');
await page.mouse.up();
assert.equal(await page.locator('.app').isVisible(),true);
assert.equal(await page.locator('#sound').getAttribute('aria-pressed'),'false');
await page.locator('#sound').tap();await page.locator('#homeBtn').tap();
await page.locator('#settingsBtn').tap();assert.equal(await page.locator('#settingsSound').getAttribute('aria-pressed'),'true');await page.locator('#settingsDone').tap();
await page.emulateMedia({reducedMotion:'reduce'});await page.waitForFunction(()=>matchMedia('(prefers-reduced-motion: reduce)').matches);
for(const selector of ['.bloop-layer','.cloud-one','.island-layer'])assert.equal(await page.locator(selector).evaluate(el=>getComputedStyle(el).animationName),'none');
await page.locator('#playBtn').tap();assert.equal(await page.locator('.app').evaluate(el=>el.getAnimations().length),0);
console.log(`PASS reference menu ${width}x${height}: independent animated layers, touch/press, sound sync, reduced motion`);await page.close();
}
}finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
