'use strict';
const {solve}=require('../tools/solver.cjs');
const {levels}=require('../levels/v1/crystal-mines-001-025.json');
const label=b=>`Satır ${b.y+1}, sütun ${b.x+1}, ${b.dir} yönü`;
const firstBlocks=solve(levels[0]).solution.map(id=>levels[0].blocks.find(b=>b.id===id));
const firstLabels=firstBlocks.map(label);
const settled=page=>page.waitForFunction(()=>!busy);
async function moveLabel(page,legal=true){return page.evaluate(legal=>{const b=blocks.find(b=>clearPath(b,blocks)===legal);if(!b)throw Error('Expected '+(legal?'legal':'blocked')+' move');return `Satır ${b.y+1}, sütun ${b.x+1}, ${b.dir} yönü`},legal)}
async function tapLegal(page){await page.getByRole('button',{name:await moveLabel(page),exact:true}).tap();await settled(page)}
async function finish(page){while(await page.locator('.block').count())await tapLegal(page)}
module.exports={firstLabels,firstBlocks,settled,moveLabel,tapLegal,finish};
