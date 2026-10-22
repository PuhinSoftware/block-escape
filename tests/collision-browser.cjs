'use strict';
const {chromium,webkit}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
const {moveLabel,tapLegal,finish,settled}=require('./helpers.cjs');
const engine=process.env.BROWSER||'chromium';if(!['chromium','webkit'].includes(engine))throw Error('Unknown engine');
const labURL='http://127.0.0.1:8080/?lab=collision';
async function shot(page,name){if(process.env.ARTIFACT_DIR){fs.mkdirSync(process.env.ARTIFACT_DIR,{recursive:true});await page.screenshot({path:`${process.env.ARTIFACT_DIR}/${engine}-${name}.png`,fullPage:true})}}
const geometry=page=>page.locator('.cell').evaluateAll(els=>els.map(el=>{const r=el.getBoundingClientRect();return [r.x+scrollX,r.y+scrollY,r.width,r.height]}));
async function check(page,baseline,width){const current=await geometry(page);assert.equal(current.length,36);current.forEach((r,i)=>{assert.ok(Math.abs(r[2]-r[3])<.1);r.forEach((v,j)=>assert.ok(Math.abs(v-baseline[i][j])<.1))});assert.ok(await page.evaluate(w=>document.documentElement.scrollWidth<=w&&innerWidth<=w,width));assert.ok(await page.locator('.block').evaluateAll(els=>els.every(el=>{const b=el.getBoundingClientRect(),c=el.parentElement.getBoundingClientRect();return b.left>=c.left-.1&&b.top>=c.top-.1&&b.right<=c.right+.1&&b.bottom<=c.bottom+.1})))}
(async()=>{
const browser=await(engine==='webkit'?webkit:chromium).launch(engine==='chromium'?{executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']}:{});
try{
 for(const [width,height] of [[320,568],[375,667],[390,844],[430,932]]){
  const page=await browser.newPage({viewport:{width,height},isMobile:true,hasTouch:true}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{localStorage.setItem('blockEscapeUnlocked','10');localStorage.setItem('blockEscapeUnlockedV06','17');localStorage.setItem('blockEscapeSound','off');window.vibrations=[];Object.defineProperty(navigator,'vibrate',{configurable:true,value:n=>{vibrations.push(n);return true}})});
  await page.goto(labURL);await page.locator('#playBtn').tap();await page.waitForFunction(()=>document.querySelector('.app').getAnimations().length===0);
  assert.equal(await page.evaluate(()=>lives),3);assert.equal(await page.locator('.heart:not(.empty)').count(),3);assert.equal(await page.locator('#levelLabel').textContent(),'01 / 5');
  await page.locator('#board').scrollIntoViewIfNeeded();const baseline=await geometry(page),label=await moveLabel(page,false);const tile=page.getByRole('button',{name:label,exact:true}),initial=await tile.boundingBox();const initialDocument=await tile.evaluate(el=>{const r=el.getBoundingClientRect();return [r.x+scrollX,r.y+scrollY,r.width,r.height]});
  // Observe the exact contact frame before the return animation, including spark.
  await tile.evaluate(el=>{window.contactTile=el;new MutationObserver(()=>{if(lives===2&&!window.contactFrame){const r=contactTile.getBoundingClientRect(),target=document.querySelectorAll('.cell')[2*6+4].getBoundingClientRect();window.contactFrame={right:r.right,targetLeft:target.left,sparks:document.querySelectorAll('.collision-spark').length,heartAnimation:getComputedStyle(document.querySelector('.heart-loss')).animationName,lives,blocks:blocks.length}}}).observe(document.getElementById('lives'),{attributes:true});el.click();el.dispatchEvent(new MouseEvent('click',{bubbles:true}));const a=el.getAnimations()[0];a.pause();a.currentTime=90;window.travelAnimation=a});
  const mid=await tile.boundingBox();assert.ok(mid.x>initial.x+5,'travels across empty cells before contact');assert.equal(await page.evaluate(()=>busy),true);assert.equal(await page.locator('#reset').isDisabled(),true);assert.equal(await page.locator('#homeBtn').isDisabled(),true);
  await shot(page,`collision-travel-${width}`);await page.evaluate(()=>travelAnimation.finish());await settled(page);
  const contact=await page.evaluate(()=>contactFrame);assert.ok(Math.abs(contact.right-contact.targetLeft)<.2,'stops at first obstacle edge, no overlap');assert.equal(contact.sparks,1);assert.equal(contact.heartAnimation,'heart-loss');assert.equal(await page.evaluate(()=>audioContext===undefined),true,'mute suppresses collision audio context');assert.equal(contact.blocks,3);assert.equal(contact.lives,2);
  assert.equal(await page.evaluate(()=>lives),2);assert.equal(await page.locator('.heart:not(.empty)').count(),2);assert.equal(await page.locator('#moves').textContent(),'0');const restored=await tile.evaluate(el=>{const r=el.getBoundingClientRect();return [r.x+scrollX,r.y+scrollY,r.width,r.height]});restored.forEach((v,i)=>assert.ok(Math.abs(v-initialDocument[i])<.1,'returns to original document position'));await check(page,baseline,width);assert.deepEqual(await page.evaluate(()=>vibrations),[15]);assert.equal(await page.locator('.collision-spark').count(),0);
  await tile.tap();await settled(page);await tile.tap();await settled(page);
  assert.equal(await page.locator('#modalTitle').textContent(),'LEVEL FAILED');assert.equal(await page.evaluate(()=>lives),0);assert.equal(await page.locator('#next').textContent(),'Tekrar Dene');assert.equal(await page.locator('#close').textContent(),'Ana Menü');assert.equal(await page.locator('.victory-art').isVisible(),false);
  await shot(page,`collision-failed-${width}`);
  await page.keyboard.press('Escape');assert.equal(await page.locator('#overlay').isVisible(),true,'failed board cannot resume via Escape');
  await page.evaluate(()=>document.querySelector('.block').click());assert.equal(await page.evaluate(()=>lives),0);assert.equal(await page.locator('.block').count(),3);
  await page.locator('#next').tap();assert.equal(await page.evaluate(()=>lives),3);assert.equal(await page.locator('.block').count(),3);assert.equal(await page.locator('#moves').textContent(),'0');await check(page,baseline,width);
  await page.emulateMedia({reducedMotion:'reduce'});await page.waitForFunction(()=>reducedMotion());
  const beforeVibration=await page.evaluate(()=>vibrations.length);await page.getByRole('button',{name:await moveLabel(page,false),exact:true}).tap();await settled(page);assert.equal(await page.evaluate(()=>lives),2);assert.equal(await page.locator('.colliding,.collision-spark').count(),0);assert.equal(await page.evaluate(()=>vibrations.length),beforeVibration);assert.ok(await page.locator('.heart').evaluateAll(els=>els.every(el=>getComputedStyle(el).animationName==='none')));
  await finish(page);assert.equal(await page.evaluate(()=>lives),2);await page.locator('#next').tap();assert.equal(await page.evaluate(()=>lives),3);assert.equal(await page.locator('#levelLabel').textContent(),'02 / 5');
  for(let i=1;i<5;i++){await finish(page);assert.equal(await page.evaluate(()=>lives),3);if(i<4)await page.locator('#next').tap()}
  await page.locator('#close').tap();await page.locator('#reset').tap();await shot(page,`collision-lab5-${width}`);
  assert.equal(await page.evaluate(()=>localStorage.getItem('blockEscapeUnlockedV06')),'17');assert.equal(await page.evaluate(()=>localStorage.getItem('blockEscapeUnlocked')),'10');
  // Failure -> menu -> play restarts this test, never a finished/zero-life board.
  for(let n=0;n<3;n++){await page.getByRole('button',{name:await moveLabel(page,false),exact:true}).tap();await settled(page)}
  await page.locator('#close').tap();assert.equal(await page.locator('#menu').isVisible(),true);await page.locator('#menuLevels').tap();await page.keyboard.press('Escape');assert.equal(await page.locator('#overlay').isVisible(),false);await page.locator('#playBtn').tap();assert.equal(await page.evaluate(()=>lives),3);assert.equal(await page.locator('#levelLabel').textContent(),'05 / 5');
  await page.locator('#homeBtn').tap();await page.locator('#menuLevels').tap();assert.equal(await page.locator('#levelPicker button:enabled').count(),5);
  await page.goto('http://127.0.0.1:8080');await page.locator('#playBtn').tap();assert.equal(await page.locator('#levelLabel').textContent(),'17 / 25');assert.equal(await page.evaluate(()=>lives),3);assert.equal(await page.locator('#labBanner').isVisible(),false);await page.locator('#levelsBtn').tap();assert.equal(await page.locator('#levelPicker button').count(),25);
  assert.deepEqual(errors,[]);await page.close();console.log(`PASS ${engine} collision ${width}px: visible distant contact/return, spark, one-life duplicate guard, three-hit failure/retry/menu, reduced motion, all 5 labs, 36 square cells and 25-level save isolation`);
 }
 // Unsupported and throwing vibration / animation APIs remain nonfatal.
 for(const mode of ['missing','throwing','animation','cancel','paused']){
  const page=await browser.newPage({hasTouch:true}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(mode=>{if(mode==='missing'||mode==='throwing')Object.defineProperty(navigator,'vibrate',{value:mode==='missing'?undefined:()=>{throw Error('unsupported')}})},mode);
  await page.goto(labURL);await page.locator('#playBtn').click();
  if(mode==='animation')await page.evaluate(()=>{Element.prototype.animate=undefined});
  const tile=page.getByRole('button',{name:await moveLabel(page,false),exact:true});
  if(mode==='cancel'||mode==='paused')await tile.evaluate((el,mode)=>{el.click();el.getAnimations().forEach(a=>mode==='cancel'?a.cancel():a.pause())},mode);else await tile.click();
  await settled(page);assert.equal(await page.evaluate(()=>lives),2);assert.equal(await page.locator('.block').count(),3);assert.equal(await page.locator('#reset').isEnabled(),true);assert.deepEqual(errors,[]);await page.close();
 }
 console.log('PASS collision vibration/animation absence, exceptions, cancellation and paused timeline cleanup');
 // Negative fixtures: a fixed wall on a ray makes that block permanently stuck.
 // They exercise visual contact in every direction, not additional playable labs.
 for(const dir of ['U','D','L','R']){
  const page=await browser.newPage({hasTouch:true});await page.goto(labURL);await page.locator('#playBtn').click();
  await page.evaluate(dir=>{const [dx,dy]=vectors[dir],x=dx<0?5:dx>0?0:2,y=dy<0?5:dy>0?0:2;levels[0]={...levels[0],blocks:[{id:0,x,y,dir}],walls:[[x+dx*3,y+dy*3]]};load(0)},dir);
  const before=await page.evaluate(()=>JSON.stringify(blocks));await page.locator('.block').click();await settled(page);assert.equal(await page.evaluate(()=>lives),2);assert.equal(await page.evaluate(()=>JSON.stringify(blocks)),before);assert.equal(await page.locator('.cell.wall').count(),1);await page.close();
 }
 console.log('PASS distant fixed-wall collision and return in U/D/L/R');
 const normal=await browser.newPage({hasTouch:true,reducedMotion:'reduce'});
 await normal.addInitScript(()=>localStorage.setItem('blockEscapeUnlockedV06','2'));
 await normal.goto('http://127.0.0.1:8080');await normal.locator('#playBtn').click();
 for(let n=0;n<3;n++){await normal.getByRole('button',{name:await moveLabel(normal,false),exact:true}).tap();await settled(normal)}
 assert.equal(await normal.evaluate(()=>localStorage.getItem('blockEscapeUnlockedV06')),'2');await normal.locator('#next').tap();await finish(normal);assert.equal(await normal.evaluate(()=>localStorage.getItem('blockEscapeUnlockedV06')),'3');await normal.locator('#next').tap();assert.equal(await normal.evaluate(()=>lives),3);await normal.close();
 console.log('PASS normal catalog failure preserves progress; retry/win unlocks next level with fresh lives');

}finally{await browser.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
