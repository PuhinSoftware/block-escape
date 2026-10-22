'use strict';
const Rules=require('../engine/rules.js');
// Removal only deletes blockers: every legal move preserves solvability.
// Therefore any complete legal ordering is optimal: exactly one move per block.
function solve(level,{maxExpansions=5000,timeoutMs=1000}={}){
  const validation=Rules.validateLevel(level);
  if(!validation.valid)return {status:'invalid',errors:validation.errors,solution:[],minimumMoves:null,expansions:0};
  if(!Number.isInteger(maxExpansions)||maxExpansions<0||!Number.isFinite(timeoutMs)||timeoutMs<0)throw Error('Invalid solver limits');
  const deadline=performance.now()+timeoutMs;let state=Rules.createState(level),expansions=0;const solution=[];
  while(state.status!=='won'){
    let selected;
    for(const block of state.blocks){
      if(expansions>=maxExpansions||performance.now()>=deadline)return {status:'limit',solution,minimumMoves:null,expansions};
      expansions++;
      if(Rules.traceMove(level,state.blocks,block.id).type==='exit'){selected=block.id;break}
    }
    if(selected===undefined)return {status:'unsolvable',solution,minimumMoves:null,expansions};
    state=Rules.transition(level,state,selected).state;solution.push(selected);
  }
  return {status:'solved',solution,minimumMoves:solution.length,expansions};
}
function metrics(level){
  let items=level.blocks.slice(),layers=0;const frontiers=[];
  while(items.length){const legal=Rules.legalMoves(level,items);if(!legal.length)return null;frontiers.push(legal.length);const gone=new Set(legal);items=items.filter(b=>!gone.has(b.id));layers++}
  return {blockCount:level.blocks.length,density:Number((level.blocks.length/36).toFixed(3)),dependencyDepth:layers,initialLegalMoves:frontiers[0],blockedRatio:Number((1-frontiers[0]/level.blocks.length).toFixed(3)),directionCount:new Set(level.blocks.map(b=>b.dir)).size,rowCount:new Set(level.blocks.map(b=>b.y)).size,columnCount:new Set(level.blocks.map(b=>b.x)).size,frontiers};
}
module.exports={solve,metrics};
if(require.main===module){const fs=require('node:fs');const level=JSON.parse(fs.readFileSync(process.argv[2],'utf8'));const result=solve(level);console.log(JSON.stringify({...result,metrics:result.status==='solved'?metrics(level):null},null,2));process.exitCode=result.status==='solved'?0:1}
