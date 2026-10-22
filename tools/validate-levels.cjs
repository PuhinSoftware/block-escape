'use strict';
const fs=require('node:fs'),path=require('node:path');
const {validateCatalog}=require('../engine/catalog.js'),{solve,metrics}=require('./solver.cjs'),{qualityErrors}=require('./level-quality.cjs');
const retired=require('../levels/retired-signatures.json');
function readLevels(){
 const catalog=JSON.parse(fs.readFileSync('levels/catalog.json','utf8'));
 const head=validateCatalog(catalog);if(!head.valid)throw Error(head.errors.join('; '));
 const levels=[];
 for(const pack of catalog.packs){const data=JSON.parse(fs.readFileSync(path.join('levels',pack.path),'utf8'));if(data.schemaVersion!==1||data.levels.length!==pack.count||data.levels.some(l=>l.worldId!==pack.worldId))throw Error('Invalid pack '+pack.path);levels.push(...data.levels)}
 const validation=validateCatalog(catalog,levels);if(!validation.valid)throw Error(validation.errors.join('; '));return {catalog,levels};
}
function validateAll(){
 const {catalog,levels}=readLevels();const previous=[],results=[];
 for(const level of levels){const solution=solve(level),stats=solution.status==='solved'?metrics(level):null;const errors=qualityErrors(level,stats,previous,retired);if(solution.status!=='solved'||errors.length)throw Error(`Level ${level.id}: ${solution.status}; ${errors.join(', ')}`);previous.push(level);results.push({id:level.id,worldId:level.worldId,difficulty:level.difficulty,blockCount:level.blocks.length,minimumMoves:solution.minimumMoves,solution:solution.solution,metrics:stats})}
 const report=JSON.parse(fs.readFileSync('reports/levels-v06.json','utf8'));
 if(report.count!==levels.length||report.results.length!==levels.length)throw Error('Report count differs');
 for(const result of results){const recorded=report.results.find(r=>r.id===result.id);if(!recorded?.valid||recorded.status!=='solved'||JSON.stringify(recorded.solution)!==JSON.stringify(result.solution)||recorded.minimumMoves!==result.minimumMoves||recorded.worldId!==result.worldId||recorded.difficulty!==result.difficulty||recorded.blockCount!==result.blockCount||JSON.stringify(recorded.metrics)!==JSON.stringify(result.metrics))throw Error('Stale report for level '+result.id)}
 return {catalog,levels,results};
}
module.exports={readLevels,validateAll};
if(require.main===module)try{const result=validateAll();console.log(`PASS ${result.levels.length} valid, distinct, quality-filtered and optimally solved levels; reports current`)}catch(error){console.error(error.message);process.exitCode=1}
