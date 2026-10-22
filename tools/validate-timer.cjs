'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs');
const {solve}=require('./solver.cjs'),{levels,mode,schemaVersion}=require('../levels/lab/timer-v1.json');
assert.equal(schemaVersion,1);assert.equal(mode,'timer-lab');assert.equal(levels.length,5);
const rows=levels.map((level,i)=>{assert.equal(level.id,i+1);assert.equal(level.timeLimitSeconds??null,[null,45,40,35,30][i]);const result=solve(level);assert.equal(result.status,'solved');return {id:level.id,title:level.title,blocks:level.blocks.length,timeLimitSeconds:level.timeLimitSeconds??null,minimumMoves:result.minimumMoves,solution:result.solution,status:result.status}});
const report=JSON.stringify({schemaVersion:1,note:'Experimental active-play limits, not production balance. Layouts intentionally reuse the verified collision lab.',levels:rows},null,2)+'\n';
const path='reports/timer-lab-v062.json';
if(process.argv.includes('--write'))fs.writeFileSync(path,report);else assert.equal(fs.readFileSync(path,'utf8'),report);
console.log('PASS five timer labs: valid, solved, exact minimum moves; report reproducible');
