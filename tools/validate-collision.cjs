'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict');
const Rules=require('../engine/rules.js'),{solve,metrics}=require('./solver.cjs');
const data=require('../levels/lab/collision-v1.json');
function verify(){
 assert.equal(data.schemaVersion,1);assert.equal(data.mode,'collision-lab');assert.equal(data.levels.length,5);
 return data.levels.map((level,i)=>{
  assert.equal(level.id,i+1);assert.equal(Rules.validateLevel(level).valid,true);
  const solution=solve(level);assert.equal(solution.status,'solved');
  const replay=state=>{for(const id of solution.solution){const move=Rules.transition(level,state,id);assert.equal(move.type,'exit');state=move.state}assert.equal(state.status,'won');return state};
  const perfect=replay(Rules.createState(level));assert.equal(perfect.lives,3);
  const blocked=level.blocks.find(b=>Rules.traceMove(level,level.blocks,b.id).type==='collision');assert.ok(blocked);
  let state=Rules.createState(level);const mistakes=[];
  for(let n=1;n<=3;n++){const outcome=Rules.transition(level,state,blocked.id);assert.equal(outcome.type,'collision');assert.deepEqual(outcome.state.blocks,level.blocks);assert.equal(outcome.state.lives,3-n);mistakes.push({tap:blocked.id,lives:outcome.state.lives,status:outcome.state.status,contact:outcome.contact});state=outcome.state;if(n===2)assert.equal(replay(state).lives,1)}
  assert.equal(state.status,'failed');assert.equal(Rules.transition(level,state,solution.solution[0]).type,'ignored');
  return {id:level.id,title:level.title,minimumMoves:solution.minimumMoves,solution:solution.solution,livesRemaining:perfect.lives,metrics:metrics(level),wrongMoves:mistakes};
 });
}
module.exports={verify};
if(require.main===module){
 const results=verify(),out=JSON.stringify({schemaVersion:1,mode:'collision-lab',results},null,2)+'\n',file='reports/collision-solutions.json';
 if(process.argv.includes('--write'))fs.writeFileSync(file,out);else assert.equal(fs.readFileSync(file,'utf8'),out,'collision report is stale');
 console.log('PASS 5 collision labs: optimal zero-damage solutions, two-error recovery, third-error failure and terminal input guard');
}
