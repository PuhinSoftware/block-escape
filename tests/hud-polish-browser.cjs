'use strict';
const {chromium,webkit}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
const {moveLabel,settled,finish}=require('./helpers.cjs');
const engine=process.env.BROWSER||'chromium',url='http://127.0.0.1:8080/?lab=timer';
const click=(p,s)=>p.locator(s).evaluate(el=>el.click());
async function move(p,legal=true){await p.getByRole('button',{name:await moveLabel(p,legal),exact:true}).evaluate(el=>el.click());await settled(p)}
async function complete(p){while(await p.locator('.block').count())await move(p)}
const potential=p=>p.locator('#potentialStars').getAttribute('data-stars');
const notes=p=>p.evaluate(()=>audioLog.filter(n=>[784,988,1175,1480,1760].includes(n.frequency)));
async function shot(p,name){if(process.env.ARTIFACT_DIR){fs.mkdirSync(process.env.ARTIFACT_DIR,{recursive:true});await p.screenshot({path:`${process.env.ARTIFACT_DIR}/${engine}-${name}.png`,fullPage:true})}}
(async()=>{
const browser=await(engine==='webkit'?webkit:chromium).launch(engine==='chromium'?{executablePath:'/usr/bin/chromium',args:['--no-sandbox']}:{});
try{
 const p=await browser.newPage({viewport:{width:390,height:844},hasTouch:true,reducedMotion:'reduce'}),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.addInitScript(()=>{
  window.audioLog=[];window.contexts=0;window.connected=0;
  window.AudioContext=class{
   constructor(){contexts++;this.state='suspended';this.destination={}}
   get currentTime(){return performance.now()/1000}
   resume(){this.state='running';return Promise.resolve()}
   suspend(){this.state='suspended';return Promise.resolve()}
   createOscillator(){return {frequency:{setValueAtTime:(frequency,time)=>audioLog.push({frequency,time})},connect(){connected++},disconnect(){if(!this.disconnected){connected--;this.disconnected=true}},start(){},stop(time){clearTimeout(this.timer);this.timer=setTimeout(()=>this.onended?.(),Math.max(0,(time??0)*1000-performance.now()))}}}
   createGain(){return {gain:{setValueAtTime(){},exponentialRampToValueAtTime(){}},connect(){connected++},disconnect(){if(!this.disconnected){connected--;this.disconnected=true}}}}
  };
 });
 await p.clock.install();await p.clock.pauseAt(new Date());await p.goto(url);await p.waitForFunction(()=>levelsReady);await click(p,'#playBtn');
 assert.equal(await potential(p),'3');assert.equal(await p.locator('#levelProgress span').count(),0);
 for(const stars of [3,2,1]){
  await p.evaluate(()=>{load(0);audioLog=[]});for(let i=3;i>stars;i--)await move(p,false);
  assert.equal(await potential(p),String(stars));assert.equal(await p.locator('#progressText').textContent(),'0 / 3');
  await complete(p);assert.equal(await p.locator('#resultStars').getAttribute('aria-label'),`Performans: ${stars} / 3 yıldız`);
  await p.clock.runFor(1);assert.equal(await p.locator('#resultStars .awarded').count(),1);
  await p.clock.runFor(260);assert.equal(await p.locator('#resultStars .awarded').count(),Math.min(2,stars));
  await p.clock.runFor(260);assert.equal(await p.locator('#resultStars .awarded').count(),stars);
  const cues=await notes(p);assert.deepEqual(cues.map(n=>n.frequency),stars===3?[784,988,1175,1480,1760]:stars===2?[784,988]:[784]);assert.equal(new Set(cues.map(n=>n.time)).size,stars);
  for(let step=0;step<50&&await p.evaluate(()=>GameAudio.voices.size>0);step++)await p.clock.runFor(50);assert.equal(await p.evaluate(()=>GameAudio.voices.size),0);assert.equal(await p.evaluate(()=>connected),1);assert.equal(await p.evaluate(()=>JSON.parse(localStorage.getItem(STARS_KEY)).ratings['timer:1']),3);
 }
 assert.equal(await p.evaluate(()=>contexts),1);
 await p.evaluate(()=>{load(1);audioLog=[]});await p.clock.runFor(25000);assert.equal(await potential(p),'3');await p.clock.runFor(50);assert.equal(await potential(p),'2');await p.clock.runFor(15000);assert.equal(await potential(p),'1');await p.clock.runFor(5000);assert.equal(await potential(p),'0');assert.equal(await p.locator('#modalTitle').textContent(),"TIME'S UP!");assert.equal(await p.locator('#resultStars').isHidden(),true);assert.equal((await notes(p)).length,0);
 await click(p,'#next');assert.equal(await potential(p),'3');assert.deepEqual(await p.evaluate(()=>[lives,activeClock.remaining]),[3,45000]);assert.equal(await p.locator('#progressText').textContent(),'0 / 5');
 await p.evaluate(()=>load(0));for(let i=0;i<3;i++)await move(p,false);assert.equal(await potential(p),'0');assert.equal(await p.locator('#modalTitle').textContent(),'LEVEL FAILED');assert.equal(await p.locator('#resultStars').isHidden(),true);await p.clock.runFor(1000);assert.equal((await notes(p)).length,0);
 await p.evaluate(()=>{load(0);audioLog=[]});await p.evaluate(()=>{GameAudio.setSetting('sfxEnabled',!GameAudio.settings.sfxEnabled);GameAudio.unlock()});await complete(p);await p.clock.runFor(1000);assert.equal((await notes(p)).length,0);assert.equal(await p.locator('#resultStars .awarded').count(),3);
 await p.evaluate(()=>load(0));await p.evaluate(()=>{GameAudio.setSetting('sfxEnabled',!GameAudio.settings.sfxEnabled);GameAudio.unlock()});await p.evaluate(()=>audioLog=[]);await complete(p);await p.clock.runFor(1);assert.equal((await notes(p)).length,1);await click(p,'#next');await p.clock.runFor(1000);assert.equal((await notes(p)).length,1);assert.equal(await p.evaluate(()=>connected),1);
 await p.evaluate(()=>{load(0);audioLog=[]});await complete(p);await click(p,'#close');await p.clock.runFor(1000);assert.equal((await notes(p)).length,0);await p.evaluate(()=>{load(0);audioLog=[]});await complete(p);await p.clock.runFor(1);await p.evaluate(()=>{GameAudio.setSetting('sfxEnabled',!GameAudio.settings.sfxEnabled);GameAudio.unlock()});await p.clock.runFor(1000);assert.equal((await notes(p)).length,1,'muting during reveal stops subsequent cues');assert.equal(await p.evaluate(()=>connected),1);
 assert.deepEqual(errors,[]);await p.close();
 console.log('PASS A-H: potential, 3/2/1 results, thresholds, failures/retry, best storage, sequential audio/mute/cancellation/cleanup');
 for(const width of [320,375,390,430]){
  const page=await browser.newPage({viewport:{width,height:width===320?568:844},isMobile:true,hasTouch:true});await page.addInitScript(()=>localStorage.setItem('blockEscapeSound','off'));await page.goto(url);await page.locator('#playBtn').tap();await page.waitForFunction(()=>!screenOpening);
  const layout=await page.evaluate(()=>{const rect=s=>{const r=document.querySelector(s).getBoundingClientRect();return {x:r.x,y:r.y,height:r.height,right:r.right,bottom:r.bottom}};return {panel:rect('.star-progress'),rail:rect('.progress-hud'),reward:rect('.potential-reward'),status:rect('.status-rail'),caption:rect('.mine-caption'),scrollWidth:document.documentElement.scrollWidth,scrollHeight:document.documentElement.scrollHeight,viewport:innerHeight}});
  assert.equal(layout.panel.height,28);assert.ok(layout.panel.right<layout.reward.x);assert.ok(layout.status.bottom<=layout.rail.y);assert.ok(layout.rail.bottom<=layout.caption.y);assert.ok(layout.scrollWidth<=width);assert.ok(await page.locator('.progress-caption').evaluate(el=>el.scrollWidth<=el.clientWidth));assert.ok(await page.locator('.potential-reward small').evaluate(el=>el.scrollWidth<=el.clientWidth));await shot(page,`hud-${width}`);
  await page.getByRole('button',{name:await moveLabel(page,false),exact:true}).tap();await settled(page);assert.equal(await potential(page),'2');assert.equal(await page.locator('#potentialStars .lost').count(),1);assert.equal(await page.locator('#progressText').textContent(),'0 / 3');if(width===390)await shot(page,'hud-two-potential-390');
  await move(page);await page.waitForTimeout(80);const fraction=await page.locator('#progressFill').evaluate(el=>new DOMMatrix(getComputedStyle(el).transform).a);assert.ok(fraction>0&&fraction<1/3);
  await finish(page);await page.waitForTimeout(800);assert.equal(await page.locator('#resultStars .awarded').count(),2);assert.equal(await page.locator('#resultStars span:not(.awarded)').textContent(),'☆');assert.ok(await page.locator('.modal').evaluate(el=>{const r=el.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth&&r.top>=0&&r.bottom<=innerHeight}));if(width===390)await shot(page,'hud-two-result-390');
  await page.locator('#next').tap();await page.emulateMedia({reducedMotion:'reduce'});assert.equal(await page.locator('#potentialStars span').first().evaluate(el=>getComputedStyle(el).transitionDuration),'0s');assert.ok(await page.locator('.cell').evaluateAll(els=>els.length===36&&els.every(el=>{const r=el.getBoundingClientRect();return Math.abs(r.width-r.height)<.1})));
  console.log(`PASS ${engine} ${width}px: 28px HUD, geometry, smooth fill, two-star potential/result; document ${layout.scrollHeight}px / viewport ${layout.viewport}px`);await page.close();
 }
 for(const mode of ['missing','rejected','throwing']){
  const page=await browser.newPage({hasTouch:true,reducedMotion:'reduce'}),failures=[];page.on('pageerror',e=>failures.push(e.message));await page.addInitScript(mode=>{if(mode==='missing'){window.AudioContext=undefined;window.webkitAudioContext=undefined}else window.AudioContext=class{constructor(){this.state=mode==='rejected'?'suspended':'running';this.currentTime=0}resume(){return Promise.reject(Error('policy'))}createOscillator(){throw Error('unavailable')}}},mode);
  await page.goto(url);await page.locator('#playBtn').click();await complete(page);await page.waitForTimeout(800);assert.equal(await page.locator('#resultStars .awarded').count(),3);await page.locator('#next').click();assert.equal(await page.evaluate(()=>index),1);assert.deepEqual(failures,[]);await page.close();
 }
 console.log('PASS missing/rejected/throwing Web Audio: victory and next remain usable');
}finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
