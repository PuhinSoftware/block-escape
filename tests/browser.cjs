const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
try {
const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error' && !m.location().url.endsWith('/favicon.ico'))errors.push(m.text())});
const response=await page.goto('http://127.0.0.1:8080');assert.equal(response.status(),200);
for(const file of ['game.js','style.css'])assert.equal((await page.request.get('http://127.0.0.1:8080/'+file)).status(),200);
await page.locator('#sound').click();
assert.equal(await page.locator('.cell').count(),36);
assert.equal(await page.locator('.block').count(),3);
await page.getByRole('button',{name:'Satır 2, sütun 2, R yönü',exact:true}).click();
assert.equal(await page.locator('#moves').textContent(),'0');assert.equal(await page.locator('.block').count(),3);
await page.getByRole('button',{name:'Satır 4, sütun 4, R yönü',exact:true}).click();
assert.equal(await page.locator('#moves').textContent(),'1');assert.equal(await page.locator('.block').count(),2);
await page.locator('#undo').click();assert.equal(await page.locator('.block').count(),3);assert.equal(await page.locator('#moves').textContent(),'0');
await page.getByRole('button',{name:'Satır 4, sütun 4, R yönü',exact:true}).click();
await page.locator('#reset').click();assert.equal(await page.locator('.block').count(),3);
for(let i=0;i<10;i++){
assert.equal(await page.locator('#levelLabel').textContent(),`${String(i+1).padStart(2,'0')} / 10`);
let count=await page.locator('.block').count();
for(let j=0;j<count;j++){
const label=await page.evaluate(()=>{const b=blocks.find(b=>clearPath(b,blocks));if(!b)throw Error('No valid move');return `Satır ${b.y+1}, sütun ${b.x+1}, ${b.dir} yönü`});
await page.getByRole('button',{name:label,exact:true}).click();
}
await page.locator('#overlay').waitFor({state:'visible'});assert.equal(await page.locator('#remaining').textContent(),'0');
await page.locator('#next').click();
}
assert.equal(await page.evaluate(()=>localStorage.getItem('blockEscapeUnlocked')),'10');
await page.reload();await page.locator('#levelsBtn').click();assert.equal(await page.locator('#levelPicker button:enabled').count(),10);
assert.deepEqual(errors,[]);
await page.locator('#close').click();
assert.equal(await page.locator('#sound').getAttribute('aria-pressed'),'false');
await page.reload();assert.equal(await page.locator('#sound').getAttribute('aria-pressed'),'false');
assert.equal(await page.evaluate(()=>localStorage.getItem('blockEscapeUnlocked')),'10');
await page.locator('#sound').click();await page.reload();
assert.equal(await page.locator('#sound').getAttribute('aria-pressed'),'true');
assert.ok((await page.locator('#sound').boundingBox()).width>=44);
// Instrument the Web Audio boundary to verify tones and lifecycle without speakers.
const audio=await browser.newPage();
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
await audio.goto('http://127.0.0.1:8080');assert.equal(await audio.evaluate(()=>audioCalls.contexts),0);
await audio.getByRole('button',{name:'Satır 2, sütun 2, R yönü',exact:true}).click();
await audio.getByRole('button',{name:'Satır 4, sütun 4, R yönü',exact:true}).click();
await audio.getByRole('button',{name:'Satır 2, sütun 4, D yönü',exact:true}).click();
await audio.getByRole('button',{name:'Satır 2, sütun 2, R yönü',exact:true}).click();
await audio.waitForFunction(()=>audioCalls.disconnects===12);
assert.deepEqual(await audio.evaluate(()=>audioCalls.tones),[180,640,640,640,800,960]);
assert.equal(await audio.evaluate(()=>audioCalls.contexts),1);
await audio.locator('#sound').click();
const tones=await audio.evaluate(()=>audioCalls.tones.length);
await audio.locator('#reset').click();
await audio.getByRole('button',{name:'Satır 4, sütun 4, R yönü',exact:true}).click();
assert.equal(await audio.evaluate(()=>audioCalls.tones.length),tones);
await audio.close();
for(const mode of ['missing','rejected','storage']){
const fallback=await browser.newPage();const failures=[];fallback.on('pageerror',e=>failures.push(e.message));
await fallback.addInitScript(mode=>{
if(mode==='missing'){window.AudioContext=undefined;window.webkitAudioContext=undefined}
if(mode==='rejected')window.AudioContext=class{constructor(){this.state='suspended'}resume(){return Promise.reject(Error('policy'))}};
if(mode==='storage'){Storage.prototype.getItem=()=>{throw Error('storage denied')};Storage.prototype.setItem=()=>{throw Error('storage denied')}};
},mode);
await fallback.goto('http://127.0.0.1:8080');
await fallback.getByRole('button',{name:'Satır 4, sütun 4, R yönü',exact:true}).click();
assert.equal(await fallback.locator('#moves').textContent(),'1');
await fallback.locator('#sound').click();assert.equal(await fallback.locator('#sound').getAttribute('aria-pressed'),'false');
assert.deepEqual(failures,[]);await fallback.close();
}
console.log('PASS: audio tones, shared context, mute/reload, preserved progress, gesture startup, cleanup, missing audio, rejected resume, denied storage');
console.log('PASS: mobile viewport, assets, blocked move, move, undo, reset, all 10 levels, progress persistence; no browser errors');
} finally {await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
