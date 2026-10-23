const {moveLabel,tapLegal,finish}=require('./helpers.cjs');
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const settled=page=>page.waitForFunction(()=>document.getElementById('board').getAttribute('aria-busy')!=='true');
(async()=>{
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
try {
const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'});
const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error' && !m.location().url.endsWith('/favicon.ico'))errors.push(m.text())});
const response=await page.goto('http://127.0.0.1:8080');await page.waitForFunction(()=>levelsReady);await page.locator('#playBtn').click();assert.equal(response.status(),200);
for(const file of ['game.js','style.css'])assert.equal((await page.request.get('http://127.0.0.1:8080/'+file)).status(),200);
await page.locator('#sound').click();await settled(page);
assert.equal(await page.locator('.cell').count(),36);
assert.equal(await page.locator('.block').count(),3);
await page.evaluate(()=>load(1));await page.getByRole('button',{name:await moveLabel(page,false),exact:true}).click();await settled(page);
assert.equal(await page.locator('#moves').textContent(),'0');assert.equal(await page.locator('.block').count(),4);await page.evaluate(()=>load(0));
await tapLegal(page);
assert.equal(await page.locator('#moves').textContent(),'1');assert.equal(await page.locator('.block').count(),2);
await page.locator('#reset').click();await settled(page);assert.equal(await page.locator('.block').count(),3);
for(let i=0;i<25;i++){
assert.equal(await page.locator('#levelLabel').textContent(),`${String(i+1).padStart(2,'0')} / 25`);
let count=await page.locator('.block').count();
for(let j=0;j<count;j++){
const label=await page.evaluate(()=>{const b=blocks.find(b=>clearPath(b,blocks));if(!b)throw Error('No valid move');return `Satır ${b.y+1}, sütun ${b.x+1}, ${b.dir} yönü`});
await page.getByRole('button',{name:label,exact:true}).click();await settled(page);
}
await page.locator('#overlay').waitFor({state:'visible'});assert.equal(await page.locator('#remaining').textContent(),'0');
await page.locator('#next').click();await settled(page);
}
assert.equal(await page.evaluate(()=>localStorage.getItem('blockEscapeUnlockedV06')),'25');
await page.reload();await page.locator('#playBtn').click();await page.locator('#levelsBtn').click();await settled(page);assert.equal(await page.locator('#levelPicker button:enabled').count(),25);
assert.deepEqual(errors,[]);
await page.locator('#close').click();await settled(page);
assert.equal(await page.locator('#sound').getAttribute('aria-pressed'),'false');
await page.reload();await page.locator('#playBtn').click();assert.equal(await page.locator('#sound').getAttribute('aria-pressed'),'false');
assert.equal(await page.evaluate(()=>localStorage.getItem('blockEscapeUnlockedV06')),'25');
await page.locator('#sound').click();await settled(page);await page.reload();await page.locator('#playBtn').click();
assert.equal(await page.locator('#sound').getAttribute('aria-pressed'),'true');
assert.ok((await page.locator('#sound').boundingBox()).width>=44);
// Instrument the Web Audio boundary to verify tones and lifecycle without speakers.
const audio=await browser.newPage({hasTouch:true});
await audio.addInitScript(()=>{
window.audioCalls={contexts:0,resumes:0,tones:[],disconnects:0};
window.AudioContext=class{
constructor(){audioCalls.contexts++;this.state='suspended';this.currentTime=0;this.destination={}}
resume(){audioCalls.resumes++;this.state='running';return Promise.resolve()}
suspend(){this.state='suspended';return Promise.resolve()}
createOscillator(){return {frequency:{setValueAtTime:f=>audioCalls.tones.push(f)},connect(){},disconnect(){audioCalls.disconnects++},start(){},stop(){setTimeout(()=>this.onended?.(),0)}}}
createGain(){return {gain:{setValueAtTime(){},exponentialRampToValueAtTime(){}},connect(){},disconnect(){audioCalls.disconnects++}}}
};
});
await audio.goto('http://127.0.0.1:8080');assert.equal(await audio.evaluate(()=>audioCalls.contexts),0);await audio.locator('#playBtn').click();assert.equal(await audio.evaluate(()=>audioCalls.contexts),1);
await audio.evaluate(()=>load(1));await audio.getByRole('button',{name:await moveLabel(audio,false),exact:true}).click();await settled(audio);
await audio.evaluate(()=>{load(0);Object.defineProperty(GameAudio.context,'currentTime',{get:()=>performance.now()/1000})});await finish(audio);
await audio.waitForFunction(()=>audioCalls.disconnects>=18);
assert.deepEqual(await audio.evaluate(()=>audioCalls.tones),[180,640,640,640,784,988,1175,1480,1760]);
assert.equal(await audio.evaluate(()=>audioCalls.contexts),1);
await audio.locator('#close').click();
await audio.evaluate(()=>GameAudio.setSetting('sfxEnabled',false));await settled(audio);
const tones=await audio.evaluate(()=>audioCalls.tones.length);
await audio.locator('#reset').click();await settled(audio);
await tapLegal(audio);
assert.equal(await audio.evaluate(()=>audioCalls.tones.length),tones);
await audio.close();
for(const mode of ['missing','rejected','storage']){
const fallback=await browser.newPage({hasTouch:true});const failures=[];fallback.on('pageerror',e=>failures.push(e.message));
await fallback.addInitScript(mode=>{
if(mode==='missing'){window.AudioContext=undefined;window.webkitAudioContext=undefined}
if(mode==='rejected')window.AudioContext=class{constructor(){this.state='suspended'}resume(){return Promise.reject(Error('policy'))}};
if(mode==='storage'){Storage.prototype.getItem=()=>{throw Error('storage denied')};Storage.prototype.setItem=()=>{throw Error('storage denied')}};
},mode);
await fallback.goto('http://127.0.0.1:8080');await fallback.locator('#playBtn').click();
await tapLegal(fallback);
assert.equal(await fallback.locator('#moves').textContent(),'1');
await fallback.locator('#sound').click();await settled(fallback);assert.equal(await fallback.locator('#sound').getAttribute('aria-pressed'),'false');
assert.deepEqual(failures,[]);await fallback.close();
}
console.log('PASS: audio tones, shared context, mute/reload, preserved progress, gesture startup, cleanup, missing audio, rejected resume, denied storage');
console.log('PASS: mobile viewport, assets, blocked move, move, reset, all 25 levels, progress persistence; no browser errors');
} finally {await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
