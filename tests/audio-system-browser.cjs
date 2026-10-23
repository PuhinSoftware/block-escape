'use strict';
const {chromium,webkit}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
const {moveLabel,settled,finish}=require('./helpers.cjs');
const engine=process.env.BROWSER||'chromium',base='http://127.0.0.1:8080';
async function shot(p,name){if(process.env.ARTIFACT_DIR){fs.mkdirSync(process.env.ARTIFACT_DIR,{recursive:true});await p.screenshot({path:`${process.env.ARTIFACT_DIR}/${engine}-${name}.png`,fullPage:true})}}
async function instrument(p){await p.addInitScript(()=>{const Native=window.AudioContext||window.webkitAudioContext;window.createdContexts=0;if(Native)window.AudioContext=class extends Native{constructor(...args){super(...args);createdContexts++}}});}
async function observe(p){await p.evaluate(()=>{window.effectEvents=[];const effect=GameAudio.effect.bind(GameAudio);GameAudio.effect=name=>{const played=effect(name);effectEvents.push({name,played,at:performance.now()});return played}})}
async function move(p,legal=true){await p.getByRole('button',{name:await moveLabel(p,legal),exact:true}).tap();await settled(p)}
const played=p=>p.evaluate(()=>effectEvents.filter(e=>e.played).map(e=>e.name));
(async()=>{
 const browser=await(engine==='webkit'?webkit:chromium).launch(engine==='chromium'?{executablePath:'/usr/bin/chromium',args:['--no-sandbox']}:{});
 try{
  const p=await browser.newPage({hasTouch:true,reducedMotion:'reduce'}),errors=[],requests=[];p.on('pageerror',e=>errors.push(e.message));p.on('request',r=>requests.push(r.url()));await instrument(p);await p.goto(base+'/?lab=timer');await p.waitForFunction(()=>levelsReady);
  assert.equal(await p.evaluate(()=>createdContexts),0);assert.equal(requests.some(u=>u.includes('/assets/audio/')),false,'no audio fetch before gesture');
  await p.locator('#playBtn').tap();await p.waitForFunction(()=>GameAudio.buffers.size===8&&!GameAudio.media.paused);await observe(p);
  assert.deepEqual(await p.evaluate(()=>[GameAudio.settings.musicVolume,GameAudio.settings.sfxVolume]),[.3,.7]);await p.waitForTimeout(200);assert.ok(Math.abs(await p.evaluate(()=>GameAudio.musicGain.gain.value)-.3)<.01);assert.ok(Math.abs(await p.evaluate(()=>GameAudio.sfxGain.gain.value)-.7)<.01);
  assert.ok(await p.evaluate(()=>GameAudio.media.currentSrc.endsWith('.ogg')));assert.equal(await p.locator('#worldMusic source[type="audio/mpeg"]').count(),1);
  await p.evaluate(()=>GameAudio.media.currentTime=63.7);await p.waitForFunction(()=>GameAudio.media.currentTime<2&&!GameAudio.media.paused);
  const before=await p.evaluate(()=>GameAudio.media.currentTime);await p.evaluate(()=>load(1));await p.waitForTimeout(100);assert.ok(await p.evaluate(t=>GameAudio.media.currentTime>=t,before),'same-world continuous');assert.equal(await p.evaluate(()=>createdContexts),1);
  await p.locator('#sound').tap();assert.equal(await p.evaluate(()=>GameAudio.media.paused),true);await move(p);assert.ok((await played(p)).includes('block_exit'),'music off does not mute effects');
  await p.locator('#sound').tap();await p.evaluate(()=>GameAudio.setSetting('sfxEnabled',false));await p.waitForFunction(()=>!GameAudio.media.paused);await p.evaluate(()=>effectEvents=[]);await move(p);assert.deepEqual(await played(p),[],'effects off keeps music');
  await p.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});document.dispatchEvent(new Event('visibilitychange'))});assert.equal(await p.evaluate(()=>GameAudio.media.paused),true);assert.equal(await p.evaluate(()=>GameAudio.effect('collision')),false);
  await p.evaluate(()=>GameAudio.setSetting('musicEnabled',false));await p.evaluate(()=>{delete document.hidden;document.dispatchEvent(new Event('visibilitychange'))});assert.equal(await p.evaluate(()=>GameAudio.media.paused),true);
  await p.locator('#sound').tap();await p.waitForFunction(()=>!GameAudio.media.paused);await p.locator('#homeBtn').tap();assert.equal(await p.evaluate(()=>GameAudio.media.paused),true);
  await p.locator('#settingsBtn').tap();await p.locator('#musicVolume').fill('41');await p.locator('#effectsVolume').fill('62');await p.locator('#settingsEffects').tap();await p.locator('#settingsDone').tap();await p.reload();await p.waitForFunction(()=>levelsReady);assert.deepEqual(await p.evaluate(()=>[GameAudio.settings.musicVolume,GameAudio.settings.sfxVolume,GameAudio.settings.sfxEnabled]),[.41,.62,true]);
  await p.locator('#playBtn').tap();await p.waitForFunction(()=>GameAudio.buffers.size===8);await observe(p);
  for(const stars of [1,2,3]){
   await p.evaluate(()=>{load(0);effectEvents=[]});for(let i=3;i>stars;i--)await move(p,false);await finish(p);await p.waitForTimeout(2100);
   const events=await p.evaluate(()=>effectEvents.filter(e=>e.played));assert.deepEqual(events.filter(e=>e.name.startsWith('star_')).map(e=>e.name),Array.from({length:stars},(_,i)=>`star_${i+1}`));
   const win=events.find(e=>e.name==='level_win'),last=events.filter(e=>e.name.startsWith('star_')).at(-1);assert.ok(win&&win.at-last.at>=1000,'victory follows star tail');assert.equal(await p.locator('#resultStars .awarded').count(),stars);
   await p.waitForFunction(()=>!GameAudio.ducked&&Math.abs(GameAudio.musicGain.gain.value-.41)<.02);
  }
  await p.evaluate(()=>{load(0);effectEvents=[]});for(let i=0;i<3;i++)await move(p,false);assert.ok((await played(p)).includes('level_failed'));assert.ok(!(await played(p)).includes('time_up'));
  await p.clock.install();await p.clock.pauseAt(new Date());await p.evaluate(()=>{load(1);effectEvents=[]});await p.clock.runFor(45001);assert.equal(await p.locator('#modalTitle').textContent(),"TIME'S UP!");assert.ok((await played(p)).includes('time_up'));assert.ok(!(await played(p)).includes('level_failed'));
  assert.ok(!requests.some(u=>u.includes('/sources/')),'never request music master');assert.equal(await p.evaluate(()=>createdContexts),1);assert.deepEqual(errors,[]);await p.close();
  console.log('PASS defaults/gains, real OGG and 8 WAVs, independent mute, persistence, same-world continuity, menu/hidden, 1/2/3 stars, duck/restore, distinct failure/timeout, one context');
  const fallbackMusic=await browser.newPage({hasTouch:true});await fallbackMusic.route('**/*.ogg',route=>route.fulfill({status:404,body:'missing OGG'}));await fallbackMusic.goto(base);await fallbackMusic.locator('#playBtn').tap();await fallbackMusic.waitForFunction(()=>GameAudio.media.currentSrc.endsWith('.mp3')&&!GameAudio.media.paused);await fallbackMusic.close();console.log('PASS OGG loop boundary and real MP3 source fallback after OGG failure');
  const legacy=await browser.newPage({hasTouch:true});await legacy.addInitScript(()=>{localStorage.setItem('blockEscapeSound','off');localStorage.setItem('blockEscapeUnlockedV06','17')});await legacy.goto(base);await legacy.locator('#playBtn').tap();assert.deepEqual(await legacy.evaluate(()=>[GameAudio.settings.musicEnabled,GameAudio.settings.sfxEnabled,GameAudio.context,localStorage.getItem('blockEscapeSound'),localStorage.getItem('blockEscapeUnlockedV06')]),[false,false,undefined,'off','17']);await legacy.close();
  for(const mode of ['files','api','storage','play']){
   const page=await browser.newPage({hasTouch:true,reducedMotion:'reduce'}),failures=[];page.on('pageerror',e=>failures.push(e.message));
   if(mode==='files')await page.route('**/assets/audio/**',route=>route.fulfill({status:404,body:'missing'}));
   if(mode==='api')await page.addInitScript(()=>{window.AudioContext=class{constructor(){throw Error('blocked')}};window.webkitAudioContext=undefined});
   if(mode==='storage')await page.addInitScript(()=>{Storage.prototype.getItem=()=>{throw Error('denied')};Storage.prototype.setItem=()=>{throw Error('denied')}});
   if(mode==='play')await page.addInitScript(()=>{HTMLMediaElement.prototype.play=()=>Promise.reject(Error('NotAllowedError'))});
   await page.goto(base+'/?lab=timer');await page.locator('#playBtn').tap();await finish(page);assert.equal(await page.evaluate(()=>playStatus),'won');await page.locator('#next').tap();assert.equal(await page.evaluate(()=>index),1);assert.deepEqual(failures,[]);await page.close();
  }
  console.log('PASS legacy mute/old progress preservation, failed files/API/play/storage: gameplay continues');
  for(const width of [320,375,390,430]){
   const page=await browser.newPage({viewport:{width,height:width===320?568:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'});await page.goto(base);await page.locator('#settingsBtn').tap();
   assert.ok(await page.evaluate(w=>document.documentElement.scrollWidth<=w,width));
   const bounds=await page.locator('#settingsPanel button,#settingsPanel input').evaluateAll(els=>els.map(el=>{const r=el.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom}}));
   for(const [i,a] of bounds.entries()){assert.ok(a.left>=0&&a.right<=width&&a.top>=0&&a.bottom<=page.viewportSize().height,'settings control fits viewport');for(const b of bounds.slice(i+1))assert.ok(Math.min(a.right,b.right)<=Math.max(a.left,b.left)||Math.min(a.bottom,b.bottom)<=Math.max(a.top,b.top),'settings controls do not overlap')}

   for(const id of ['settingsSound','settingsEffects','musicVolume','effectsVolume'])assert.ok(await page.locator('#'+id).evaluate(el=>el.getBoundingClientRect().height>=44));
   await page.locator('#musicVolume').focus();await page.keyboard.press('ArrowRight');assert.equal(await page.locator('#musicVolume').inputValue(),'31');await page.locator('#effectsVolume').fill('55');await page.locator('#settingsEffects').tap();assert.equal(await page.locator('#settingsSound').getAttribute('aria-pressed'),'true');
   await page.locator('#settingsClose').scrollIntoViewIfNeeded();await shot(page,`audio-settings-${width}`);await page.locator('#settingsDone').tap();await page.locator('#playBtn').tap();await move(page);assert.ok(await page.locator('.cell').evaluateAll(els=>els.length===36&&els.every(el=>Math.abs(el.getBoundingClientRect().width-el.getBoundingClientRect().height)<.1)));await page.close();console.log(`PASS ${width}px settings: independent controls, keyboard range, 44px targets, no overflow and playable board`);
  }
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
