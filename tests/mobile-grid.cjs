const {firstLabels}=require('./helpers.cjs');
const {chromium,webkit}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const engine=process.env.BROWSER||'chromium';
if(!['chromium','webkit'].includes(engine))throw Error('BROWSER must be chromium or webkit');
(async()=>{
const browser=await (engine==='webkit'?webkit:chromium).launch(engine==='chromium'?{executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']}:{});
try{
for(const width of [320,375,390,430])for(const enlarged of [false,true]){
const page=await browser.newPage({viewport:{width,height:900},isMobile:true,hasTouch:true,reducedMotion:'reduce'});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.goto('http://127.0.0.1:8080');await page.waitForFunction(()=>levelsReady);await page.locator('#playBtn').click();await page.locator('#sound').tap();
// Deliberate oversized glyph: tests intrinsic-content independence, not Safari emulation.
if(enlarged)await page.addStyleTag({content:'.app .block{font-size:96px}'});
const cells=()=>page.locator('.cell').evaluateAll(els=>els.map(el=>{const r=el.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height}}));
const initial=await cells();
const check=async stage=>{
const current=await cells();assert.equal(current.length,36);
current.forEach((r,i)=>{
assert.ok(Math.abs(r.width-r.height)<.1,`${engine}/${width}/${enlarged}/${stage}: square cell ${i}`);
for(const key of ['x','y','width','height'])assert.ok(Math.abs(r[key]-initial[i][key])<.1,`${stage}: cell ${i} ${key} changed`);
});
const sizes=await page.locator('.block').evaluateAll(els=>els.map(el=>{const b=el.getBoundingClientRect(),c=el.parentElement.getBoundingClientRect();return {block:{x:b.x,y:b.y,right:b.right,bottom:b.bottom,width:b.width,height:b.height},cell:{x:c.x,y:c.y,right:c.right,bottom:c.bottom,width:c.width,height:c.height}}}));
for(const {block:b,cell:c} of sizes){
assert.ok(b.x>=c.x-.1&&b.y>=c.y-.1&&b.right<=c.right+.1&&b.bottom<=c.bottom+.1,`${engine}/${width}/${enlarged}/${stage}: button escapes cell ${JSON.stringify({b,c})}`);
assert.ok(Math.abs(b.width-c.width)<.1&&Math.abs(b.height-c.height)<.1,'button must fill cell');
}
assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth),'page overflow');
};
await check('initial');
if(process.env.ARTIFACT_DIR){fs.mkdirSync(process.env.ARTIFACT_DIR,{recursive:true});await page.screenshot({path:`${process.env.ARTIFACT_DIR}/${engine}-${width}-${enlarged?'enlarged':'normal'}.png`,fullPage:true});}
for(const [i,label] of [firstLabels[0],firstLabels[1],firstLabels[2]].entries()){
await page.getByRole('button',{name:label,exact:true}).tap();await page.waitForFunction(()=>!busy);await check(['first','middle','last'][i]);
}
await page.locator('#close').tap();await page.locator('#reset').tap();await check('reset');
// Sample every move in all published levels, including empty boards.
for(let level=0;level<25;level++){
await page.evaluate(i=>load(i),level);await check(`level ${level+1} initial`);
while(await page.locator('.block').count()){
await page.evaluate(async()=>{const b=blocks.find(b=>clearPath(b,blocks));if(!b)throw Error('Unsolvable level');const el=[...document.querySelectorAll('.block')].find(el=>el.getAttribute('aria-label')===`Satır ${b.y+1}, sütun ${b.x+1}, ${b.dir} yönü`);await tap(b.id,el)});
await check(`level ${level+1} move`);
}
}
assert.deepEqual(errors,[]);
console.log(`PASS ${engine} ${width}px ${enlarged?'oversized-content':'normal'}: cells, button containment, first/middle/last move, reset`);
await page.close();
}
}finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
