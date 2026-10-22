'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),{createHash}=require('node:crypto');
const R=require('../engine/rules.js'),{solve}=require('../tools/solver.cjs'),{verify}=require('../tools/validate-collision.cjs');
const lab=require('../levels/lab/collision-v1.json').levels;
const level=(blocks,walls=[])=>({...lab[0],blocks,walls});
test('ray finds nearest block, not just adjacent cell, in all four directions',()=>{
 for(const [dir,[dx,dy]] of Object.entries(R.VECTORS)){
  const x=dx<0?5:dx>0?0:2,y=dy<0?5:dy>0?0:2;
  const a={id:0,x,y,dir},b={id:1,x:x+dx*3,y:y+dy*3,dir},c={id:2,x:x+dx*4,y:y+dy*4,dir};const l=level([a,b,c]);
  assert.deepEqual(R.traceMove(l,l.blocks,0),{type:'collision',contact:{kind:'block',id:1,x:b.x,y:b.y},distance:3});
  const state=R.createState(l),out=R.transition(l,state,0);assert.equal(out.state.lives,2);assert.deepEqual(out.state.blocks,state.blocks);assert.equal(state.lives,3);assert.equal(out.state.moves,0);
 }
});
test('nearest wall wins over farther block; adjacent obstacle and edge exits',()=>{
 const l=level([{id:0,x:0,y:0,dir:'R'},{id:1,x:5,y:0,dir:'U'}],[[2,0]]);assert.equal(R.traceMove(l,l.blocks,0).contact.kind,'wall');assert.equal(R.traceMove(l,l.blocks,0).distance,2);assert.equal(solve(l).status,'unsolvable');
 const adjacent={...l,walls:[[1,0]]};assert.equal(R.traceMove(adjacent,l.blocks,0).distance,1);
 assert.equal(R.traceMove(l,l.blocks,1).type,'exit');
});
test('three hits fail exactly once; retry creates independent state; successful exits preserve lives',()=>{
 const l=lab[0];let state=R.createState(l);for(let i=0;i<3;i++)state=R.transition(l,state,0).state;
 assert.equal(state.status,'failed');assert.equal(state.lives,0);assert.strictEqual(R.transition(l,state,0).state,state);assert.equal(R.transition(l,state,1).type,'ignored');
 const retry=R.createState(l);assert.equal(retry.lives,3);assert.equal(retry.moves,0);assert.notStrictEqual(retry.blocks,l.blocks);const good=R.transition(l,retry,1);assert.equal(good.state.lives,3);assert.equal(good.state.moves,1);assert.equal(good.state.blocks.length,2);
});
test('all five designed labs solve with 3 lives and also after two errors; wrong paths fail after third',()=>{
 const results=verify();assert.equal(results.length,5);assert.equal(results[2].metrics.blockCount,results[3].metrics.blockCount);assert.notEqual(results[2].metrics.dependencyDepth,results[3].metrics.dependencyDepth);
 for(const result of results)assert.equal(result.livesRemaining,3);
});
test('legal removals cannot introduce a permanent lock; invalid and terminal taps have no cost',()=>{
 for(const l of lab){const state=R.createState(l);for(const id of R.legalMoves(l)){const next=R.transition(l,state,id).state;assert.equal(solve({...l,blocks:next.blocks}).status,'solved')}assert.equal(R.transition(l,state,999).type,'ignored')}
 const l=level([{id:0,x:0,y:0,dir:'U'}]),win=R.transition(l,R.createState(l),0).state;assert.equal(win.status,'won');assert.equal(R.transition(l,win,0).type,'ignored');
});
test('published catalog, all 25 level bytes, reports and legacy exclusions are unchanged from v0.6',()=>{
 for(const [file,hash] of Object.entries(require('./fixtures/v06-hashes.json')))assert.equal(createHash('sha256').update(fs.readFileSync(file)).digest('hex'),hash,file);
});
