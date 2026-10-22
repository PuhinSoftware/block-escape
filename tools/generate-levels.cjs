'use strict';
const fs=require('node:fs'),path=require('node:path');
const Rules=require('../engine/rules.js'),{solve,metrics}=require('./solver.cjs'),{profile,qualityErrors}=require('./level-quality.cjs');
const retired=require('../levels/retired-signatures.json');
const WORLDS=[{id:'crystal-mines',name:'Kristal Madenleri',start:1,end:75},{id:'coral-kingdom',name:'Mercan Krallığı',start:76,end:150},{id:'sky-islands',name:'Gökyüzü Adaları',start:151,end:225},{id:'star-galaxy',name:'Yıldız Galaksisi',start:226,end:300}];
function random(seed){let value=2166136261;for(const char of String(seed)){value^=char.charCodeAt(0);value=Math.imul(value,16777619)}return ()=>{value+=0x6D2B79F5;let t=value;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296}}
function shuffled(items,rng){const result=items.slice();for(let i=result.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[result[i],result[j]]=[result[j],result[i]]}return result}
function candidate(id,rng,deadline){
 const p=profile(id),level={schemaVersion:1,id,worldId:WORLDS.find(w=>id>=w.start&&id<=w.end).id,difficulty:p.difficulty,gridSize:6,walls:[],blocks:[]};
 for(let step=0;step<p.blockCount;step++){
  if(performance.now()>=deadline)throw Error('Generation time limit exceeded; no files written');
  const occupied=new Set(level.blocks.map(b=>`${b.x},${b.y}`)),options=[];
  for(let y=0;y<6;y++)for(let x=0;x<6;x++)if(!occupied.has(`${x},${y}`))for(const dir of Object.keys(Rules.VECTORS)){
   const block={id:step,x,y,dir};if(Rules.canExit(level,[...level.blocks,block],step))options.push(block);
  }
  if(!options.length)return null;
  const ranked=shuffled(options,rng).slice(0,28).map(block=>{
   const stats=metrics({...level,blocks:[...level.blocks,block]});
   const score=Math.min(stats.dependencyDepth,p.minDepth)*3-Math.max(0,stats.dependencyDepth-p.minDepth)*.5+stats.blockedRatio*2+Math.min(stats.directionCount,p.minDirections)*.4+(stats.rowCount+stats.columnCount)*.13+rng()*2.8;
   return {block,score};
  }).sort((a,b)=>b.score-a.score);
  level.blocks.push(ranked[0].block);
 }
 return level;
}
function generate({seed='crystal-v06-2026',count=25,maxAttempts=300,timeoutMs=60000}={}){
 if(typeof seed!=='string'||!seed||!Number.isInteger(count)||count<1||count>300||!Number.isInteger(maxAttempts)||maxAttempts<1||!Number.isFinite(timeoutMs)||timeoutMs<0)throw Error('Invalid generation options');
 const deadline=performance.now()+timeoutMs,levels=[],results=[];
 for(let id=1;id<=count;id++){
  const rng=random(`${seed}:level:${id}`);let accepted=false;
  for(let attempt=1;attempt<=maxAttempts;attempt++){
   if(performance.now()>=deadline)throw Error(`Generation time limit at level ${id}; no files written`);
   const level=candidate(id,rng,deadline);if(!level)continue;
   const stats=metrics(level),errors=qualityErrors(level,stats,levels,retired);if(errors.length)continue;
   const solution=solve(level);if(solution.status!=='solved')continue;
   level.generation={seed,levelSeed:`${seed}:level:${id}`,attempt,qualityVersion:1};levels.push(level);
   results.push({id,worldId:level.worldId,blockCount:stats.blockCount,minimumMoves:solution.minimumMoves,difficulty:level.difficulty,valid:true,status:solution.status,solution:solution.solution,metrics:stats,generationAttempts:attempt});accepted=true;break;
  }
  if(!accepted)throw Error(`No quality layout for level ${id} within ${maxAttempts} attempts; no files written`);
 }
 const packs=[];
 for(let offset=0;offset<levels.length;offset+=25){const group=levels.slice(offset,offset+25),worldId=group[0].worldId;packs.push({worldId,path:`v1/${worldId}-${String(group[0].id).padStart(3,'0')}-${String(group.at(-1).id).padStart(3,'0')}.json`,count:group.length,data:{schemaVersion:1,levels:group}})}
 const catalog={schemaVersion:1,catalogVersion:'v0.6',plannedCount:300,availableCount:levels.length,worlds:WORLDS,packs:packs.map(({data,...entry})=>entry)};
 const report={schemaVersion:1,catalogVersion:'v0.6',seed,count,qualityVersion:1,shortestSolutionProof:'Each successful move removes exactly one block; removing a block cannot add blockers. Every complete legal ordering is optimal and has blockCount moves.',results};
 const markdown=`# v0.6 level verification\n\nSeed: \`${seed}\`. Available: ${levels.length}; planned: 300. Minimum moves are exact (one removal per block). Difficulty measures dependency depth/blocked paths, not alternative solution lengths.\n\n| Level | World | Blocks | Minimum moves | Difficulty | Valid | Dependency depth | Initially legal |\n| --- | --- | ---: | ---: | --- | --- | ---: | ---: |\n`+results.map(r=>`| ${r.id} | ${r.worldId} | ${r.blockCount} | ${r.minimumMoves} | ${r.difficulty} | yes | ${r.metrics.dependencyDepth} | ${r.metrics.initialLegalMoves} |`).join('\n')+'\n';
 return {catalog,packs,report,markdown};
}
function outputs(result){const out={'levels/catalog.json':JSON.stringify(result.catalog,null,2)+'\n','reports/levels-v06.json':JSON.stringify(result.report,null,2)+'\n','reports/levels-v06.md':result.markdown};for(const pack of result.packs)out['levels/'+pack.path]=JSON.stringify(pack.data,null,2)+'\n';return out}
module.exports={generate,outputs,random,WORLDS};
if(require.main===module){
 try{const args=process.argv.slice(2),options={};let check=false;
 for(let i=0;i<args.length;i++){if(args[i]==='--check'){check=true;continue}const key={'--seed':'seed','--count':'count','--max-attempts':'maxAttempts','--timeout-ms':'timeoutMs'}[args[i]];if(!key||args[i+1]===undefined)throw Error('Unknown/incomplete argument '+args[i]);const value=args[++i];options[key]=key==='seed'?value:Number(value)}
 const result=generate(options),files=outputs(result);
 for(const [file,content] of Object.entries(files)){if(check){if(!fs.existsSync(file)||fs.readFileSync(file,'utf8')!==content)throw Error('Generated data differs: '+file)}else{fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,content)}}
 console.log(`${check?'Verified reproducibility':'Generated'} ${result.report.count} levels; seed ${result.report.seed}`);
 }catch(error){console.error(error.message);process.exitCode=1}
}
