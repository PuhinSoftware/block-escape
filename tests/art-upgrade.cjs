const {firstLabels}=require('./helpers.cjs');
const {chromium,webkit}=require('playwright');
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const engine=process.env.BROWSER||'chromium';
if(!['chromium','webkit'].includes(engine))throw Error('Unknown BROWSER');
const directory=path.join(__dirname,'../assets/gameplay');
const names=fs.readdirSync(directory).filter(name=>/\.(webp|svg)$/.test(name));
const bytes=names.reduce((sum,name)=>sum+fs.statSync(path.join(directory,name)).size,0);
assert.ok(bytes<240*1024,`Gameplay art budget exceeded: ${bytes}`);
(async()=>{
const browser=await (engine==='webkit'?webkit:chromium).launch(engine==='chromium'?{executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']}:{});
try{
for(const [width,height] of [[320,568],[375,667],[390,844],[430,932]]){
const page=await browser.newPage({viewport:{width,height},isMobile:true,hasTouch:true});const requests=[];const failures=[];
page.on('request',req=>requests.push(new URL(req.url()).pathname));page.on('pageerror',e=>failures.push(e.message));
await page.goto('http://127.0.0.1:8080');await page.waitForFunction(()=>levelsReady);await page.locator('#playBtn').tap();await page.waitForFunction(()=>document.querySelector('.app').getAnimations().length===0);
await page.locator('.bloop-helper img').evaluate(img=>img.decode());
assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth));
assert.equal(await page.locator('.cell').count(),36);assert.equal(await page.locator('#undo').count(),0);
assert.ok((await page.locator('.bloop-helper img').boundingBox()).width>=90,'compact miner remains visible');
assert.ok(await page.locator('.bloop-helper img').evaluate(el=>el.getBoundingClientRect().bottom<=document.querySelector('#board').getBoundingClientRect().top),'helper stays above playable board');
assert.ok((await page.locator('.cell').first().evaluate(el=>getComputedStyle(el,'::before').backgroundImage)).includes('stone-cell.webp'));
assert.ok((await page.locator('.block').first().evaluate(el=>getComputedStyle(el,'::before').backgroundImage)).includes('block-'));
assert.ok((await page.locator('.block').first().evaluate(el=>getComputedStyle(el,'::after').backgroundImage)).includes('arrow-raised.svg'));
assert.ok((await page.locator('#homeBtn').evaluate(el=>getComputedStyle(el).backgroundImage)).includes('panel-blue.svg'));
assert.ok((await page.locator('#reset').evaluate(el=>getComputedStyle(el).backgroundImage)).includes('panel-gold.svg'));
assert.ok((await page.locator('.board-platform').evaluate(el=>getComputedStyle(el,'::before').backgroundImage)).includes('board-frame.svg'));
assert.equal(await page.locator('.board-decoration').evaluateAll(els=>els.every(el=>getComputedStyle(el).pointerEvents==='none')),true);
await page.locator('#board').scrollIntoViewIfNeeded();assert.equal(await page.locator('.block').evaluateAll(els=>els.every(el=>{const b=el.getBoundingClientRect(),c=el.parentElement.getBoundingClientRect();return b.width<=c.width+.1&&b.height<=c.height+.1&&document.elementFromPoint(b.x+b.width/2,b.y+b.height/2)===el})),true);
// Repeated cells share one request; large source PNGs are not used by gameplay.
assert.equal(requests.filter(url=>url.endsWith('/stone-cell.webp')).length,1);
assert.equal(requests.filter(url=>/^\/assets\/(miner-bloop|crystal-mine)\.png$/.test(url)).length,0);
const alpha=await page.evaluate(async()=>{const image=new Image();image.src='assets/gameplay/block-red.webp';await image.decode();const canvas=document.createElement('canvas');canvas.width=image.width;canvas.height=image.height;const ctx=canvas.getContext('2d');ctx.drawImage(image,0,0);return {corner:ctx.getImageData(0,0,1,1).data[3],center:ctx.getImageData(image.width>>1,image.height>>1,1,1).data[3]}});
assert.equal(alpha.corner,0);assert.equal(alpha.center,255);
if(process.env.ARTIFACT_DIR){fs.mkdirSync(process.env.ARTIFACT_DIR,{recursive:true});await page.screenshot({path:`${process.env.ARTIFACT_DIR}/art-${width}.png`,fullPage:true})}
await page.emulateMedia({reducedMotion:'reduce'});
for(const label of [firstLabels[0],firstLabels[1],firstLabels[2]]){await page.getByRole('button',{name:label,exact:true}).tap();await page.waitForFunction(()=>!busy)}
await page.locator('#next').tap();assert.equal(await page.locator('#levelLabel').textContent(),'02 / 25');
await page.evaluate(()=>load(5));
const skins=await page.locator('.block').evaluateAll(els=>els.map(el=>getComputedStyle(el,'::before').backgroundImage));
for(const color of ['red','blue','green','purple'])assert.ok(skins.some(skin=>skin.includes('block-'+color+'.webp')));
if(process.env.ARTIFACT_DIR)await page.screenshot({path:`${process.env.ARTIFACT_DIR}/art-level6-${width}.png`,fullPage:true});
await page.locator('#homeBtn').tap();assert.equal(await page.locator('#menu').isVisible(),true);assert.deepEqual(failures,[]);
console.log(`PASS ${engine} art ${width}x${height}: independent textures/skins/frames, alpha, one cached cell request, no source PNG requests, hit targets, four directions, menu; art ${bytes} bytes`);await page.close();
}
}finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
