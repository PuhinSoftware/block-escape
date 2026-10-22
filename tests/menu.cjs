const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
(async()=>{
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
try{
for(const width of [320,375,390,430,1280]){
const page=await browser.newPage({viewport:{width,height:844},hasTouch:width<500,isMobile:width<500});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.addInitScript(()=>{localStorage.setItem('blockEscapeUnlocked','10');localStorage.setItem('blockEscapeUnlockedV06','3');localStorage.setItem('blockEscapeSound','off')});
await page.goto('http://127.0.0.1:8080');await page.waitForFunction(()=>levelsReady);
assert.equal(await page.locator('.app').isVisible(),false);
assert.equal(await page.locator('#menu').isVisible(),true);
assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth));
for(const id of ['playBtn','menuLevels']){const r=await page.locator('#'+id).boundingBox();assert.ok(r.height>=44&&r.width>=44)}
for(const asset of ['.island-layer','.bloop-layer'])assert.equal(await page.locator(asset).evaluate(img=>img.complete&&img.naturalWidth>0),true);
if(process.env.ARTIFACT_DIR){fs.mkdirSync(process.env.ARTIFACT_DIR,{recursive:true});await page.screenshot({path:`${process.env.ARTIFACT_DIR}/menu-${width}.png`,fullPage:true})}
await page.locator('#settingsBtn').click();await page.locator('#motionToggle').click();assert.equal(await page.locator('.island-layer').evaluate(el=>getComputedStyle(el).animationPlayState),'paused');await page.locator('#motionToggle').click();await page.locator('#settingsDone').click();
await page.locator('#menuLevels').click();
assert.equal(await page.locator('#levelPicker button:enabled').count(),3);
assert.equal(await page.locator('#close').evaluate(el=>el===document.activeElement),true);
await page.keyboard.press('Tab');assert.equal(await page.locator('#levelPicker button').first().evaluate(el=>el===document.activeElement),true);
await page.keyboard.press('Escape');assert.equal(await page.locator('#menuLevels').evaluate(el=>el===document.activeElement),true);
await page.locator('#playBtn').focus();await page.keyboard.press('Enter');
assert.equal(await page.locator('#levelLabel').textContent(),'03 / 25');
assert.equal(await page.locator('#menu').isVisible(),false);
const label=await page.evaluate(()=>{const b=blocks.find(b=>clearPath(b,blocks));return `Satır ${b.y+1}, sütun ${b.x+1}, ${b.dir} yönü`});
await page.getByRole('button',{name:label,exact:true}).click();await page.waitForFunction(()=>!busy);
await page.locator('#homeBtn').click();await page.locator('#playBtn').click();
assert.equal(await page.locator('#moves').textContent(),'1');
await page.locator('#homeBtn').click();await page.locator('#menuLevels').click();await page.locator('#levelPicker button').nth(1).click();
assert.equal(await page.locator('#levelLabel').textContent(),'02 / 25');assert.equal(await page.locator('#menu').isVisible(),false);
assert.equal(await page.evaluate(()=>localStorage.getItem('blockEscapeUnlocked')),'10');
assert.equal(await page.evaluate(()=>localStorage.getItem('blockEscapeSound')),'off');
await page.locator('#homeBtn').click();await page.emulateMedia({reducedMotion:'reduce'});
assert.equal(await page.locator('.island-layer').evaluate(el=>getComputedStyle(el).animationName),'none');
assert.equal(await page.locator('.bloop-layer').evaluate(el=>getComputedStyle(el).animationName),'none');
assert.deepEqual(errors,[]);console.log(`PASS menu ${width}px: layers/assets, play/resume, saved levels, keyboard/dialog, reduced motion, storage`);await page.close();
}
}finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
