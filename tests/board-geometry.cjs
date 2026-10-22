const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
(async()=>{
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
try{
for(const [name,options] of [['mobile',{viewport:{width:390,height:844},isMobile:true,hasTouch:true}],['desktop',{viewport:{width:1280,height:900}}]]){
const page=await browser.newPage({...options,reducedMotion:'no-preference'});
await page.goto('http://127.0.0.1:8080');await page.locator('#playBtn').click();await page.locator('#sound').click();
const measure=()=>page.locator('.cell').evaluateAll(cells=>cells.map(el=>{const r=el.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height}}));
const baseline=await measure();
const same=async stage=>{
const cells=await measure();assert.equal(cells.length,36);
cells.forEach((r,i)=>{
assert.ok(Math.abs(r.width-r.height)<.1,`${name} ${stage}: cell ${i} must be square (${r.width}x${r.height})`);
for(const key of ['x','y','width','height'])assert.ok(Math.abs(r[key]-baseline[i][key])<.1,`${name} ${stage}: cell ${i} ${key} changed`);
assert.ok(Math.abs(r.width-cells[0].width)<.1);assert.ok(Math.abs(r.height-cells[0].height)<.1);
});
};
await same('initial');
// The first level exercises first, middle and final removal, including empty rows.
for(const [i,label] of ['Satır 4, sütun 4, R yönü','Satır 2, sütun 4, D yönü','Satır 2, sütun 2, R yönü'].entries()){
const button=page.getByRole('button',{name:label,exact:true});
const before=await button.boundingBox();
await button.evaluate(el=>{window.movingTile=el;el.click();const a=el.getAnimations()[0];a.pause();a.currentTime=0;window.exitAnimation=a});
await same(`move ${i+1} start`);
const snapshot=async progress=>{
await page.evaluate(p=>{exitAnimation.currentTime=exitAnimation.effect.getTiming().duration*p},progress);
await page.evaluate(()=>new Promise(requestAnimationFrame));
return page.evaluate(()=>{const r=movingTile.getBoundingClientRect();const b=document.getElementById('board').getBoundingClientRect();return {connected:movingTile.isConnected,x:r.x,y:r.y,right:r.right,bottom:r.bottom,opacity:Number(getComputedStyle(movingTile).opacity),frontmost:document.elementFromPoint(Math.min(r.x+r.width/2,b.right-4),Math.min(r.y+r.height/2,b.bottom-4))===movingTile,board:{x:b.x,y:b.y,right:b.right,bottom:b.bottom},busy,disabled:document.getElementById('reset').disabled}});
};
const mid=await snapshot(.5);assert.equal(mid.connected,true);assert.equal(mid.busy,true);assert.equal(mid.disabled,true);
assert.equal(mid.frontmost,true,'moving tile must paint above adjacent cells');
assert.ok(mid.opacity>=.95,`${name}: moving tile faded too early`);
if(i===1){assert.ok(mid.y>before.y+5);assert.ok(mid.y<mid.board.bottom)}else{assert.ok(mid.x>before.x+5);assert.ok(mid.x<mid.board.right)}
await same(`move ${i+1} midpoint`);
if(i===0 && process.env.ARTIFACT_DIR){fs.mkdirSync(process.env.ARTIFACT_DIR,{recursive:true});await page.locator('#board').screenshot({path:`${process.env.ARTIFACT_DIR}/${name}-midpoint.png`});}
const near=await snapshot(.9);assert.equal(near.connected,true);
if(i===1)assert.ok(near.bottom>near.board.bottom-20);else assert.ok(near.right>near.board.right-20);
// A duplicate synthetic event must not commit another move while disabled.
await page.evaluate(()=>{movingTile.dispatchEvent(new MouseEvent('click',{bubbles:true}));window.movesDuringExit=moves;exitAnimation.finish()});
await page.waitForFunction(()=>!busy);assert.equal(await page.evaluate(()=>movesDuringExit),i+1);
assert.equal(await page.evaluate(()=>movingTile.isConnected),false);
await same(`move ${i+1} completed`);
}
await page.locator('#close').click();
await page.locator('#reset').click();await same('reset');
console.log(`PASS ${name}: 36 square equal cells; unchanged first/middle/final move geometry; visible midpoint/edge travel; DOM retained; duplicate guard; reset`);
await page.close();
}
}finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
