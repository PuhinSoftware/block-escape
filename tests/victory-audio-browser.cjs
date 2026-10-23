'use strict';
const {chromium,webkit}=require('playwright'),assert=require('node:assert/strict');
const engine=process.env.BROWSER||'chromium';
async function move(page,legal=true){await page.evaluate(async legal=>{const b=blocks.find(b=>clearPath(b,blocks)===legal);if(!b)throw Error('move missing');const button=[...document.querySelectorAll('.block')].find(el=>el.getAttribute('aria-label')===`Satır ${b.y+1}, sütun ${b.x+1}, ${b.dir} yönü`);await tap(b.id,button)},legal)}
async function win(page,stars){await page.evaluate(()=>{if(document.querySelector('.app').hidden)window.openGame();load(0);audioTrace=[]});for(let n=3;n>stars;n--)await move(page,false);while(await page.locator('.block').count())await move(page)}
(async()=>{
 const browser=await(engine==='webkit'?webkit:chromium).launch(engine==='chromium'?{executablePath:'/usr/bin/chromium',args:['--no-sandbox']}:{});
 try{
  const page=await browser.newPage({hasTouch:true,reducedMotion:'reduce'}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{const Audio=window.AudioContext||window.webkitAudioContext;window.audioContexts=0;window.AudioContext=class extends Audio{constructor(...args){super(...args);audioContexts++}}});
  await page.goto('http://127.0.0.1:8080/?lab=timer');await page.locator('#playBtn').tap();await page.waitForFunction(()=>GameAudio.buffers.size===8&&!GameAudio.media.paused);
  await page.evaluate(()=>{
   window.audioTrace=[];
   const record=(type,name,extra={})=>audioTrace.push({type,name,at:GameAudio.context.currentTime,...extra});
   const original=GameAudio.voice.bind(GameAudio);
   GameAudio.voice=(source,volume,duration,cue,...rest)=>{
    const start=source.start.bind(source),stop=source.stop.bind(source);
    source.start=(...args)=>{record('start',cue.name,{duration,bufferDuration:source.buffer?.duration});return start(...args)};
    source.stop=(...args)=>{record('stop',cue.name);return stop(...args)};
    source.addEventListener('ended',()=>record('ended',cue.name));return original(source,volume,duration,cue,...rest);
   };
   for(const method of ['play','pause']){const original=GameAudio.media[method].bind(GameAudio.media);GameAudio.media[method]=(...args)=>{record('media',method);return original(...args)}}
  });
  for(const stars of [1,2,3]){
   await win(page,stars);await page.waitForFunction(()=>audioTrace.some(e=>e.type==='start'&&e.name==='level_win'));
   await page.evaluate(()=>{if(GameAudio.effect('star_1')||GameAudio.effect('level_win')||GameAudio.effect('block_exit'))throw Error('victory protection failed')});
   const mediaStart=await page.evaluate(()=>GameAudio.media.currentTime);await page.waitForTimeout(200);
   await page.evaluate(()=>{GameAudio.setSetting('musicVolume',.4);GameAudio.setSetting('sfxVolume',.6)});
   await page.waitForFunction(()=>audioTrace.some(e=>e.type==='ended'&&e.name==='level_win'));
   const events=await page.evaluate(()=>audioTrace),victoryStart=events.filter(e=>e.type==='start'&&e.name==='level_win'),victoryEnd=events.find(e=>e.type==='ended'&&e.name==='level_win');
   assert.equal(victoryStart.length,1);assert.ok(Math.abs(victoryEnd.at-victoryStart[0].at-1.4)<.08,'whole actual victory file reaches native ended');assert.equal(events.some(e=>e.type==='stop'&&e.name==='level_win'),false);
   const starStarts=events.filter(e=>e.type==='start'&&e.name.startsWith('star_'));assert.deepEqual(starStarts.map(e=>e.name),Array.from({length:stars},(_,i)=>`star_${i+1}`));const last=events.find(e=>e.type==='ended'&&e.name===`star_${stars}`);const gap=victoryStart[0].at-last.at;assert.ok(gap>=-.01&&gap<.05,'victory follows native star end without an artificial silent gap');
   assert.ok(Math.abs(starStarts.at(-1).duration-starStarts.at(-1).bufferDuration)<.001,'final star is not clipped');
   assert.equal(events.some(e=>e.type==='media'),false,'ducking/restoration never pauses or restarts music');assert.ok(await page.evaluate(t=>GameAudio.media.currentTime>t,mediaStart));assert.equal(await page.evaluate(()=>GameAudio.media.paused),false);await page.waitForFunction(()=>!GameAudio.ducked&&GameAudio.musicGain.gain.value>.38);
   assert.equal(await page.evaluate(()=>GameAudio.effect('level_win')),false,'late duplicate rejected');
   console.log(`PASS ${stars} star(s): natural star tail -> one full 1.4s victory; no explicit stop, no music restart; live volume changes safe; gap ${gap.toFixed(3)}s`);
  }
  // Render the real WAV offline, including the production gain path. Its middle notes must survive.
  const ratio=await page.evaluate(async()=>{
   const offline=new OfflineAudioContext(1,64000,32000),bytes=await(await fetch('assets/audio/sfx/results/level_win.wav')).arrayBuffer(),buffer=await offline.decodeAudioData(bytes);
   const context={state:'running',currentTime:0,destination:offline.destination,createGain:()=>offline.createGain(),createBufferSource:()=>offline.createBufferSource()};
   const media={paused:true,addEventListener(){},pause(){}};
   const manager=new BlockEscapeAudio.Manager({media,createContext:()=>context,isHidden:()=>false});manager.setScene('won');manager.unlock();manager.buffers.set('level_win',buffer);manager.effect('level_win');
   const rendered=await offline.startRendering(),original=buffer.getChannelData(0),actual=rendered.getChannelData(0);let a=0,b=0;for(let i=12800;i<19200;i++){a+=actual[i]**2;b+=original[i]**2}return Math.sqrt(a/b);
  });
  assert.ok(Math.abs(ratio-.224)<.005,`mastered middle notes keep their expected gain, got ${ratio}`);console.log(`PASS offline real-WAV rendering: middle-section RMS gain ${ratio.toFixed(6)} (expected .32 × .70)`);
  for(const action of ['mute','zero','menu','next','hidden']){
   await page.evaluate(()=>{GameAudio.setSetting('sfxEnabled',true);GameAudio.setSetting('sfxVolume',.7)});await win(page,1);await page.waitForFunction(()=>audioTrace.some(e=>e.type==='start'&&e.name==='level_win'));await page.waitForTimeout(100);
   if(action==='mute')await page.evaluate(()=>GameAudio.setSetting('sfxEnabled',false));
   if(action==='zero')await page.evaluate(()=>GameAudio.setSetting('sfxVolume',0));
   if(action==='menu'){await page.locator('#close').tap();await page.locator('#homeBtn').tap()}
   if(action==='next')await page.locator('#next').tap();
   if(action==='hidden')await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});document.dispatchEvent(new Event('visibilitychange'))});
   assert.equal(await page.evaluate(()=>GameAudio.voices.size),0);if(action==='mute'||action==='zero')assert.equal(await page.evaluate(()=>GameAudio.ducked),false,'muted rewards release music duck');assert.equal(await page.evaluate(()=>audioTrace.filter(e=>e.type==='stop'&&e.name==='level_win').length),1);
   if(action==='hidden'){assert.equal(await page.evaluate(()=>GameAudio.media.paused),true);await page.evaluate(()=>{delete document.hidden;document.dispatchEvent(new Event('visibilitychange'))});await page.waitForFunction(()=>!GameAudio.media.paused)}
   await page.waitForTimeout(1500);assert.equal(await page.evaluate(()=>audioTrace.filter(e=>e.type==='start'&&e.name==='level_win').length),1,'cancelled victory is never replayed');
   console.log(`PASS ${action} during victory: explicit cancellation, no late/repeated reward`);
  }
  await page.evaluate(()=>{GameAudio.setSetting('sfxEnabled',true);GameAudio.setSetting('sfxVolume',.7)});await win(page,3);await page.waitForFunction(()=>audioTrace.some(e=>e.type==='start'&&e.name==='star_1'));
  await page.evaluate(()=>{GameAudio.setSetting('sfxEnabled',false);GameAudio.setSetting('sfxEnabled',true)});await page.waitForTimeout(1800);assert.equal(await page.evaluate(()=>audioTrace.filter(e=>e.type==='start'&&e.name==='level_win').length),0,'unmuting cannot resurrect cancelled pending reward cues');
  console.log('PASS mute/unmute during stars: pending victory remains cancelled');
  assert.equal(await page.evaluate(()=>audioContexts),1);assert.deepEqual(errors,[]);await page.close();
 }finally{await browser.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
