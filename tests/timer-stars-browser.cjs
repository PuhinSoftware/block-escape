'use strict';
const {chromium,webkit}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
const {finish,moveLabel,settled}=require('./helpers.cjs');
const engine=process.env.BROWSER||'chromium';
const url='http://127.0.0.1:8080/?lab=timer';
const click=async(page,selector)=>page.locator(selector).evaluate(el=>el.click());
const advance=(page,ms)=>page.clock.runFor(ms);
async function legal(page){const name=await moveLabel(page);await page.getByRole('button',{name,exact:true}).evaluate(el=>el.click());await settled(page)}
(async()=>{
 const browser=await(engine==='webkit'?webkit:chromium).launch(engine==='chromium'?{executablePath:'/usr/bin/chromium',args:['--no-sandbox']}:{});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.clock.install();await page.clock.pauseAt(new Date());
  await page.addInitScript(()=>{localStorage.setItem('blockEscapeUnlocked','10');localStorage.setItem('blockEscapeUnlockedV06','17');localStorage.setItem('blockEscapeSound','off')});
  await page.goto(url);await page.waitForFunction(()=>levelsReady);
  await page.evaluate(()=>load(1));await advance(page,10000);assert.equal(await page.evaluate(()=>activeClock.remaining),45000,'menu paused');
  await page.emulateMedia({reducedMotion:'no-preference'});await click(page,'#playBtn');await page.evaluate(()=>load(1));
  await advance(page,100);assert.equal(await page.evaluate(()=>activeClock.remaining),45000,'opening transition paused');
  await page.evaluate(()=>screenTransition.finish());await page.waitForFunction(()=>!screenOpening);
  const animationLabel=await moveLabel(page);await page.getByRole('button',{name:animationLabel,exact:true}).evaluate(el=>{el.click();window.testExit=el.getAnimations()[0];testExit.pause()});
  await advance(page,100);assert.equal(await page.evaluate(()=>activeClock.remaining),45000,'actual exit animation paused');await page.evaluate(()=>testExit.finish());await settled(page);
  await page.emulateMedia({reducedMotion:'reduce'});await page.evaluate(()=>load(1));await advance(page,5000);assert.equal(await page.evaluate(()=>activeClock.remaining),40000);
  await click(page,'#levelsBtn');const paused=await page.evaluate(()=>activeClock.remaining);await advance(page,10000);assert.equal(await page.evaluate(()=>activeClock.remaining),paused,'picker paused');await click(page,'#close');
  await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});document.dispatchEvent(new Event('visibilitychange'))});await advance(page,60000);assert.equal(await page.evaluate(()=>activeClock.remaining),paused,'hidden page paused');
  await page.evaluate(()=>{delete document.hidden;document.dispatchEvent(new Event('visibilitychange'))});await advance(page,1000);assert.equal(await page.evaluate(()=>activeClock.remaining),paused-1000);
  await page.evaluate(()=>setBusy(true));const before=await page.evaluate(()=>activeClock.remaining);await advance(page,10000);assert.equal(await page.evaluate(()=>activeClock.remaining),before,'busy paused');await page.evaluate(()=>setBusy(false));
  await click(page,'#reset');assert.equal(await page.evaluate(()=>activeClock.remaining),45000);assert.equal(await page.locator('#levelProgress').getAttribute('aria-valuenow'),'0');
  await legal(page);assert.equal(Number(await page.locator('#levelProgress').getAttribute('aria-valuenow')),20);
  const blocked=await moveLabel(page,false);await page.getByRole('button',{name:blocked,exact:true}).evaluate(el=>el.click());await settled(page);assert.equal(await page.evaluate(()=>lives),2);assert.equal(Number(await page.locator('#levelProgress').getAttribute('aria-valuenow')),20,'collision keeps progress');
  await advance(page,35000);assert.equal(await page.locator('#timerHud').evaluate(el=>el.classList.contains('urgent')),true);
  await advance(page,10000);assert.equal(await page.locator('#modalTitle').textContent(),"TIME'S UP!");assert.equal(await page.evaluate(()=>activeClock.remaining),0);assert.equal(await page.evaluate(()=>playStatus),'failed');
  await advance(page,60000);assert.equal(await page.evaluate(()=>activeClock.remaining),0);await click(page,'#next');assert.deepEqual(await page.evaluate(()=>[lives,activeClock.remaining,blocks.length]),[3,45000,5]);assert.equal(await page.locator('#levelProgress').getAttribute('aria-valuenow'),'0');
  await advance(page,45000);await click(page,'#close');assert.equal(await page.locator('#menu').isVisible(),true);await click(page,'#playBtn');assert.equal(await page.evaluate(()=>activeClock.remaining),45000);
  for(let i=0;i<5;i++){await page.evaluate(i=>load(i),i);while(await page.locator('.block').count())await legal(page);assert.equal(await page.evaluate(()=>playStatus),'won');assert.equal(await page.locator('#levelProgress').getAttribute('aria-valuenow'),'100');assert.equal(await page.locator('#resultStars').getAttribute('aria-label'),'Performans: 3 / 3 yıldız');const t=await page.evaluate(()=>activeClock.elapsed);await advance(page,10000);assert.equal(await page.evaluate(()=>activeClock.elapsed),t)}
  await page.evaluate(()=>load(1));await advance(page,41000);while(await page.locator('.block').count())await legal(page);assert.equal(await page.locator('#resultStars').getAttribute('aria-label'),'Performans: 1 / 3 yıldız');assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem(STARS_KEY)).ratings['timer:2']),3,'best never downgraded');
  assert.deepEqual(await page.evaluate(()=>[localStorage.getItem('blockEscapeUnlocked'),localStorage.getItem('blockEscapeUnlockedV06')]),['10','17']);assert.deepEqual(errors,[]);
  await page.reload();await page.waitForFunction(()=>levelsReady);assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem(STARS_KEY)).ratings['timer:2']),3,'best survives reload');await page.close();
  console.log('PASS fake-clock lifecycle, timeout/retry/menu, collision progress, five labs, scoring and best storage');
  for(const width of [320,375,390,430]){
   const p=await browser.newPage({viewport:{width,height:844},isMobile:true,hasTouch:true});await p.goto(url);await p.locator('#playBtn').tap();await p.waitForFunction(()=>!screenOpening);
   await p.evaluate(()=>load(4));await p.locator('#board').scrollIntoViewIfNeeded();
   const base=await p.locator('.cell').evaluateAll(els=>els.map(el=>{const r=el.getBoundingClientRect();return [r.x+scrollX,r.y+scrollY,r.width,r.height]}));
   const check=async()=>{assert.equal(await p.evaluate(w=>document.documentElement.scrollWidth<=w,width),true);const cells=await p.locator('.cell').evaluateAll(els=>els.map(el=>{const r=el.getBoundingClientRect();return [r.x+scrollX,r.y+scrollY,r.width,r.height]}));assert.equal(cells.length,36);cells.forEach((r,i)=>{assert.ok(Math.abs(r[2]-r[3])<.2);r.forEach((v,j)=>assert.ok(Math.abs(v-base[i][j])<.2))});assert.ok(await p.locator('.block').evaluateAll(els=>els.every(el=>{const b=el.getBoundingClientRect(),c=el.parentElement.getBoundingClientRect();return b.left>=c.left-.2&&b.right<=c.right+.2&&b.top>=c.top-.2&&b.bottom<=c.bottom+.2})));assert.ok(await p.evaluate(()=>{const a=document.querySelector('.life-hud').getBoundingClientRect(),b=document.querySelector('#timerHud').getBoundingClientRect();return a.right<=b.left&&a.left>=0&&b.right<=innerWidth}))};
   await check();
   if(process.env.ARTIFACT_DIR){fs.mkdirSync(process.env.ARTIFACT_DIR,{recursive:true});await p.screenshot({path:`${process.env.ARTIFACT_DIR}/${engine}-timer-${width}.png`,fullPage:true})}
   // Capture real interpolated frames, then retarget while the previous fill runs.
   await legal(p);const target=await p.evaluate(()=>Number($('levelProgress').getAttribute('aria-valuenow'))/100);
   await p.waitForTimeout(90);const mid=await p.locator('#progressFill').evaluate(el=>new DOMMatrix(getComputedStyle(el).transform).a);assert.ok(mid>0&&mid<target,'continuous intermediate fill');
   await legal(p);const next=await p.locator('#progressFill').evaluate(el=>new DOMMatrix(getComputedStyle(el).transform).a);assert.ok(next>=mid&&next<target*2,'retarget without jumping');
   while(await p.locator('.block').count()>6)await legal(p);await check();
   if(width===390&&process.env.ARTIFACT_DIR)await p.screenshot({path:`${process.env.ARTIFACT_DIR}/${engine}-timer-progress-390.png`,fullPage:true});
   while(await p.locator('.block').count()>1)await legal(p);await check();await legal(p);await check();
   await p.waitForTimeout(650);assert.ok(Math.abs(await p.locator('#progressFill').evaluate(el=>new DOMMatrix(getComputedStyle(el).transform).a)-1)<.001);
   if(width===390&&process.env.ARTIFACT_DIR)await p.screenshot({path:`${process.env.ARTIFACT_DIR}/${engine}-timer-victory-390.png`,fullPage:true});
   await p.emulateMedia({reducedMotion:'reduce'});
   for(let i=0;i<5;i++){await p.evaluate(i=>load(i),i);await finish(p);assert.equal(await p.evaluate(()=>playStatus),'won')}
   await p.close();console.log(`PASS ${engine} ${width}px real touch, smooth retargeting, first/middle/final grid and HUD containment`);
  }
 }finally{await browser.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
