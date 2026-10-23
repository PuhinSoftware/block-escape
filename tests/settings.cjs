const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
(async()=>{
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
try{
for(const [width,height] of [[320,568],[375,667],[390,844],[430,932]]){
const page=await browser.newPage({viewport:{width,height},isMobile:true,hasTouch:true});const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.goto('http://127.0.0.1:8080');await page.waitForFunction(()=>levelsReady);
assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth));
const play=await page.locator('#playBtn').boundingBox(),progress=await page.locator('#menuProgress').boundingBox();assert.ok(play.height>=72);assert.ok(progress.y+progress.height<=height,'controls fit short screens');assert.ok(height-progress.y-progress.height<65,'bottom whitespace reduced');
const settings=await page.locator('#settingsBtn').boundingBox();assert.ok(settings.width>=44&&settings.height>=44);assert.equal(await page.locator('#menuSound').count(),0);
if(process.env.ARTIFACT_DIR){fs.mkdirSync(process.env.ARTIFACT_DIR,{recursive:true});await page.screenshot({path:`${process.env.ARTIFACT_DIR}/menu-${width}.png`,fullPage:true})}
await page.locator('#settingsBtn').tap();assert.equal(await page.locator('#settingsPanel').isVisible(),true);const panel=await page.locator('#settingsPanel').boundingBox();assert.ok(panel.x>=0&&panel.y>=0&&panel.x+panel.width<=width&&panel.y+panel.height<=height,'panel fits viewport');assert.equal(await page.locator('#settingsClose').evaluate(el=>el===document.activeElement),true);
assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth));
await page.keyboard.press('Shift+Tab');assert.equal(await page.locator('#settingsDone').evaluate(el=>el===document.activeElement),true);
await page.keyboard.press('Tab');assert.equal(await page.locator('#settingsClose').evaluate(el=>el===document.activeElement),true);
await page.locator('#settingsSound').tap();assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('blockEscapeAudioV063')).musicEnabled),false);assert.equal(await page.locator('#settingsSound').getAttribute('aria-pressed'),'false');
await page.locator('#motionToggle').tap();assert.equal(await page.locator('#playBtn').evaluate(el=>getComputedStyle(el).animationPlayState),'paused');assert.equal(await page.locator('.bloop-layer').evaluate(el=>getComputedStyle(el).animationPlayState),'paused');
if(process.env.ARTIFACT_DIR)await page.screenshot({path:`${process.env.ARTIFACT_DIR}/settings-${width}.png`,fullPage:true});
await page.keyboard.press('Escape');assert.equal(await page.locator('#settingsBackdrop').isVisible(),false);assert.equal(await page.locator('#settingsBtn').evaluate(el=>el===document.activeElement),true);assert.equal(await page.locator('#menu').evaluate(el=>el.inert),false);
await page.locator('#settingsBtn').tap();assert.equal(await page.locator('#settingsSound').getAttribute('aria-pressed'),'false');await page.locator('#motionToggle').tap();await page.locator('#settingsSound').tap();await page.locator('#settingsDone').tap();
await page.locator('#playBtn').tap();assert.equal(await page.locator('#sound').getAttribute('aria-pressed'),'true');await page.locator('#sound').tap();await page.locator('#homeBtn').tap();await page.locator('#settingsBtn').tap();assert.equal(await page.locator('#settingsSound').getAttribute('aria-pressed'),'false');await page.locator('#settingsClose').tap();
await page.emulateMedia({reducedMotion:'reduce'});assert.equal(await page.locator('#playBtn').evaluate(el=>getComputedStyle(el).animationName),'none');
await page.reload();await page.locator('#settingsBtn').tap();assert.equal(await page.locator('#settingsSound').getAttribute('aria-pressed'),'false');assert.deepEqual(errors,[]);
console.log(`PASS settings ${width}x${height}: balanced layout, no overflow, focus trap/return, touch, sound sync/persistence, motion/pulse, reduced motion`);await page.close();
}
}finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
