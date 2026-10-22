'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const R=require('../engine/rules.js'),{validateCatalog}=require('../engine/catalog.js');
const {solve,metrics}=require('../tools/solver.cjs'),{generate,outputs,random}=require('../tools/generate-levels.cjs');
const {signature,similarity,qualityErrors}=require('../tools/level-quality.cjs');
const {validateAll}=require('../tools/validate-levels.cjs');
const {catalog,levels}=validateAll();
const fixture=(blocks,walls=[])=>({schemaVersion:1,id:1,worldId:'crystal-mines',difficulty:'tutorial',gridSize:6,blocks,walls});
// Independent legacy rule oracle: scan the complete directional path to the edge.
function legacyCanExit(level,items,b){let x=b.x,y=b.y;const [dx,dy]={U:[0,-1],D:[0,1],L:[-1,0],R:[1,0]}[b.dir];for(x+=dx,y+=dy;x>=0&&y>=0&&x<6&&y<6;x+=dx,y+=dy){if(items.some(a=>a.x===x&&a.y===y)||(level.walls||[]).some(a=>a[0]===x&&a[1]===y))return false}return true}
function independentBFS(level){const queue=[[level.blocks,0]],seen=new Set();for(let i=0;i<queue.length;i++){const [items,n]=queue[i];if(!items.length)return n;for(const b of items)if(legacyCanExit(level,items,b)){const next=items.filter(a=>a!==b),key=next.map(a=>a.id).join(',');if(!seen.has(key)){seen.add(key);queue.push([next,n+1])}}}return null}
test('strict schema/semantic validation rejects malformed, overlapping, out-of-range data',()=>{
 assert.equal(R.validateLevel(levels[0]).valid,true);
 for(const change of [{schemaVersion:2},{id:0},{worldId:'fake'},{difficulty:'expert'},{gridSize:5},{blocks:[]},{blocks:null},{blocks:[null]},{walls:[[6,0]]},{walls:[[0,0],[0,0]]}])assert.equal(R.validateLevel({...levels[0],...change}).valid,false,JSON.stringify(change));
 for(const change of [{x:-1},{y:6},{x:1.5},{dir:'toString'},{dir:'X'},{dir:['R']},{id:-1}])assert.equal(R.validateLevel(fixture([{id:0,x:0,y:0,dir:'R',...change}])).valid,false);
 assert.equal(R.validateLevel(fixture([{id:0,x:0,y:0,dir:'R'},{id:0,x:1,y:1,dir:'U'}])).valid,false);
 assert.equal(R.validateLevel(fixture([{id:0,x:0,y:0,dir:'R'},{id:1,x:0,y:0,dir:'D'}])).valid,false);
 assert.equal(R.validateLevel(fixture([{id:0,x:0,y:0,dir:'R'}],[[0,0]])).valid,false);
});
test('all four rays, walls, immutable moves, blocked moves and win condition',()=>{
 for(const dir of ['U','D','L','R']){const b={id:0,x:2,y:2,dir},[dx,dy]=R.VECTORS[dir],l=fixture([b]);assert.equal(R.canExit(l,l.blocks,0),true);const wall=[2+dx,2+dy];assert.equal(R.canExit({...l,walls:[wall]},l.blocks,0),false);const blocked=fixture([b,{id:1,x:wall[0],y:wall[1],dir}]);assert.equal(R.applyMove(blocked,blocked.blocks,0).moved,false);const out=R.applyMove(l,l.blocks,0);assert.equal(l.blocks.length,1);assert.equal(R.isWon(out.blocks),true)}
 assert.equal(R.applyMove(levels[0],levels[0].blocks,999).moved,false);
});
test('greedy solver matches independent exhaustive shortest-path search on 240 small boards',()=>{
 const rng=random('independent-rule-corpus');let solved=0,deadlocks=0;
 for(let n=0;n<240;n++){const cells=Array.from({length:36},(_,i)=>i);const take=()=>cells.splice(Math.floor(rng()*cells.length),1)[0];const bs=Array.from({length:1+n%7},(_,id)=>{const p=take();return {id,x:p%6,y:Math.floor(p/6),dir:['U','D','L','R'][Math.floor(rng()*4)]}});const w=take(),l=fixture(bs,n%3===0?[[w%6,Math.floor(w/6)]]:[]);for(const b of bs)assert.equal(R.canExit(l,bs,b.id),legacyCanExit(l,bs,b));const minimum=independentBFS(l),out=solve(l);assert.equal(out.minimumMoves,minimum);assert.equal(out.status,minimum===null?'unsolvable':'solved');if(minimum===null)deadlocks++;else solved++}
 assert.ok(solved>0&&deadlocks>0);
});
test('cycles, wall deadlocks, invalid inputs and bounded solver failures are explicit',()=>{
 assert.equal(solve(fixture([{id:0,x:0,y:0,dir:'R'},{id:1,x:1,y:0,dir:'L'}])).status,'unsolvable');
 assert.equal(solve(fixture([{id:0,x:0,y:0,dir:'R'}],[[5,0]])).status,'unsolvable');
 assert.equal(solve(null).status,'invalid');assert.equal(solve(levels[24],{maxExpansions:1}).status,'limit');assert.equal(solve(levels[0],{timeoutMs:0}).status,'limit');
});
test('catalog validates world boundaries, pack safety and only 25 published levels',()=>{
 assert.equal(validateCatalog(catalog,levels).valid,true);assert.equal(catalog.availableCount,25);assert.equal(catalog.plannedCount,300);assert.equal(catalog.packs.length,1);
 for(const change of [{schemaVersion:2},{worlds:null},{worlds:{}},{worlds:[null,null,null,null]},{availableCount:300},{packs:[{path:'../game.js',count:25,worldId:'crystal-mines'}]}])assert.equal(validateCatalog({...catalog,...change},levels).valid,false);
 assert.equal(validateCatalog(catalog,[...levels.slice(0,24),{...levels[24],id:24}]).valid,false);
 assert.equal(validateCatalog(catalog,[...levels.slice(0,24),{...levels[24],worldId:'coral-kingdom'}]).valid,false);
});
test('published solutions replay to empty board, exact optimum and graded quality',()=>{
 const retired=require('../levels/retired-signatures.json');let depth=0;
 for(const [i,l] of levels.entries()){let items=l.blocks;const out=solve(l);assert.equal(out.minimumMoves,l.blocks.length);for(const id of out.solution){const move=R.applyMove(l,items,id);assert.equal(move.moved,true);items=move.blocks}assert.equal(items.length,0);const stats=metrics(l);assert.equal(l.blocks.length,i+3);assert.ok(stats.dependencyDepth>=depth);depth=stats.dependencyDepth;assert.deepEqual(qualityErrors(l,stats,levels.slice(0,i),retired),[]);assert.equal(l.difficulty,i<5?'tutorial':i<10?'easy':i<17?'medium':'hard');if(i<5)assert.ok(stats.dependencyDepth<=3)}
});
test('quality filter rejects sparse, trivial, retired, rotated and near-duplicate layouts',()=>{
 const base=levels[12],rotate=l=>({...l,blocks:l.blocks.map(b=>({...b,x:5-b.y,y:b.x,dir:{U:'R',R:'D',D:'L',L:'U'}[b.dir]}))});
 assert.equal(signature(base),signature(rotate(base)));assert.equal(similarity(base,rotate(base)),1);
 assert.ok(qualityErrors(base,metrics(base),[rotate(base)],[]).includes('near duplicate'));
 assert.ok(qualityErrors(base,metrics(base),[],[signature(base)]).includes('duplicate/retired layout'));
 const sparse={...base,blocks:base.blocks.slice(0,1)};assert.ok(qualityErrors(sparse,metrics(sparse),[],[]).includes('density target'));
 const shifted={...levels[0],blocks:levels[0].blocks.map(b=>({...b,id:b.id+10}))};assert.equal(signature(shifted),signature(levels[0]));
});
test('same seed regenerates every JSON/report byte; other seeds differ; prefix remains stable',()=>{
 const a=generate();for(const [name,content] of Object.entries(outputs(a)))assert.equal(fs.readFileSync(name,'utf8'),content,name);
 const b=generate({count:5});assert.deepEqual(a.packs[0].data.levels.slice(0,5),b.packs[0].data.levels);
 const c=generate({seed:'another-seed',count:5});assert.notDeepEqual(c.packs[0].data.levels,b.packs[0].data.levels);
});
test('generator has finite attempt/time limits and invalid-option checks',()=>{
 assert.throws(()=>generate({timeoutMs:0}),/time limit/);assert.throws(()=>generate({count:301}),/Invalid/);assert.throws(()=>generate({maxAttempts:0}),/Invalid/);
 // This seed needs a quality retry; one attempt must stop, never silently accept.
 assert.throws(()=>generate({seed:'bounded-failure',count:25,maxAttempts:1}),/within 1 attempts/);
});

test('catalog can represent all four 75-level ranges without publishing them',()=>{
 const future=structuredClone(catalog);future.availableCount=300;future.packs=[];
 for(let offset=0;offset<300;offset+=25)future.packs.push({worldId:R.WORLD_IDS[Math.floor(offset/75)],path:`v1/future-${offset+1}.json`,count:25});
 const fixtures=Array.from({length:300},(_,i)=>({...levels[0],id:i+1,worldId:R.WORLD_IDS[Math.floor(i/75)]}));
 assert.equal(validateCatalog(future,fixtures).valid,true);
 for(const index of [74,75,149,150,224,225,299]){const invalid=fixtures.map(l=>({...l}));invalid[index].worldId='wrong-world';assert.equal(validateCatalog(future,invalid).valid,false)}
 assert.equal(require('../levels/catalog.json').availableCount,25,'test must not publish future fixtures');
});
