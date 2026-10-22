'use strict';
// Translate/rotate/reflect together with arrow vectors; ids are presentation only.
const V=require('../engine/rules.js').VECTORS;
function variants(level){
 const result=[];
 for(let mirror=0;mirror<2;mirror++)for(let turns=0;turns<4;turns++){
  const point=(x,y)=>{if(mirror)x=5-x;for(let i=0;i<turns;i++)[x,y]=[5-y,x];return [x,y]};
  const direction=dir=>{let [x,y]=V[dir];if(mirror)x=-x;for(let i=0;i<turns;i++)[x,y]=[-y,x];return Object.keys(V).find(k=>V[k][0]===x&&V[k][1]===y)};
  const blocks=level.blocks.map(b=>{const [x,y]=point(b.x,b.y);return {x,y,dir:direction(b.dir)}}),walls=(level.walls||[]).map(w=>point(...w));
  const points=[...blocks.map(b=>[b.x,b.y]),...walls];const minX=Math.min(...points.map(p=>p[0])),minY=Math.min(...points.map(p=>p[1]));
  result.push([...blocks.map(b=>`${b.x-minX},${b.y-minY},${b.dir}`),...walls.map(w=>`${w[0]-minX},${w[1]-minY},W`)].sort());
 }
 return result;
}
function signature(level){return variants(level).map(v=>v.join(';')).sort()[0]}
function similarity(a,b){
 const left=new Set(variants(a)[0]);return Math.max(...variants(b).map(v=>{const intersection=v.filter(p=>left.has(p)).length;return intersection/(left.size+v.length-intersection)}));
}
function profile(id){
 const tutorial=id<=5,easy=id<=10;
 const blockCount=id<=25?id+2:Math.min(29,20+Math.floor((id-26)/15));
 return {blockCount,difficulty:tutorial?'tutorial':easy?'easy':id<=17?'medium':'hard',minDepth:id===1?1:Math.min(11,2+Math.floor((id-2)/3)),maxInitialLegal:id<=2?blockCount:Math.max(2,Math.ceil(blockCount*(tutorial?.72:easy?.58:.4))),minDirections:id===1?2:id===2?2:id<=5?3:4,minSpan:id<=3?3:id<=10?4:5};
}
function qualityErrors(level,stats,previous,retired){
 const p=profile(level.id),errors=[];
 if(!stats)return ['unsolvable'];
 if(level.difficulty!==p.difficulty)errors.push('difficulty target');
 if(level.blocks.length!==p.blockCount)errors.push('density target');
 if(stats.dependencyDepth<p.minDepth)errors.push('dependency depth');
 if(stats.initialLegalMoves>p.maxInitialLegal)errors.push('too many immediately free blocks');
 if(stats.directionCount<p.minDirections)errors.push('direction variety');
 if(stats.rowCount<p.minSpan||stats.columnCount<p.minSpan)errors.push('board coverage');
 const key=signature(level);
 if(retired.includes(key)||previous.some(other=>signature(other)===key))errors.push('duplicate/retired layout');
 if(previous.some(other=>similarity(level,other)>.65))errors.push('near duplicate');
 return errors;
}
module.exports={variants,signature,similarity,profile,qualityErrors};
