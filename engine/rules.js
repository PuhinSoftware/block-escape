(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.BlockEscapeRules=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const GRID_SIZE=6;
  const WORLD_IDS=Object.freeze(['crystal-mines','coral-kingdom','sky-islands','star-galaxy']);
  const own=(object,key)=>Object.prototype.hasOwnProperty.call(object,key);
  const VECTORS=Object.freeze({U:Object.freeze([0,-1]),D:Object.freeze([0,1]),L:Object.freeze([-1,0]),R:Object.freeze([1,0])});
  function validateLevel(level){
    const errors=[];
    if(!level||typeof level!=='object'||Array.isArray(level))return {valid:false,errors:['level must be an object']};
    if(level.schemaVersion!==1)errors.push('schemaVersion must be 1');
    if(!Number.isInteger(level.id)||level.id<1||level.id>300)errors.push('id must be 1..300');
    if(!WORLD_IDS.includes(level.worldId))errors.push('unknown worldId');
    if(!['tutorial','easy','medium','hard'].includes(level.difficulty))errors.push('unknown difficulty');
    if(level.gridSize!==GRID_SIZE)errors.push('gridSize must be 6');
    const occupied=new Set(),ids=new Set();
    const inside=(x,y)=>Number.isInteger(x)&&Number.isInteger(y)&&x>=0&&y>=0&&x<GRID_SIZE&&y<GRID_SIZE;
    if(!Array.isArray(level.blocks)||!level.blocks.length||level.blocks.length>36)errors.push('blocks must contain 1..36 items');
    else for(const block of level.blocks){
      if(!block||typeof block!=='object'){errors.push('invalid block');continue}
      if(!Number.isInteger(block.id)||block.id<0||ids.has(block.id))errors.push('block ids must be unique nonnegative integers');
      ids.add(block.id);
      if(!inside(block.x,block.y))errors.push('block outside grid');
      if(typeof block.dir!=='string'||!own(VECTORS,block.dir))errors.push('unknown direction');
      const cell=`${block.x},${block.y}`;if(occupied.has(cell))errors.push('overlapping blocks');occupied.add(cell);
    }
    if(level.walls!==undefined&&!Array.isArray(level.walls))errors.push('walls must be an array');
    else for(const wall of level.walls||[]){
      if(!Array.isArray(wall)||wall.length!==2||!inside(...wall)){errors.push('invalid wall');continue}
      const cell=wall.join(',');if(occupied.has(cell))errors.push('overlapping wall/block');occupied.add(cell);
    }
    return {valid:errors.length===0,errors};
  }
  function ray(level,block){
    const vector=VECTORS[block.dir];if(!vector)return [];
    const cells=[];let x=block.x+vector[0],y=block.y+vector[1];
    while(x>=0&&y>=0&&x<level.gridSize&&y<level.gridSize){cells.push([x,y]);x+=vector[0];y+=vector[1]}
    return cells;
  }
  // A full ordered ray finds the first contact, including distant obstacles.
  // Contact carries a typed obstacle so future mechanics can resolve it here.
  function traceMove(level,items,id){
    const block=items.find(item=>item.id===id);
    if(!block||!own(VECTORS,block.dir))return {type:'ignored'};
    let distance=0;
    for(const [x,y] of ray(level,block)){
      distance++;
      const other=items.find(item=>item.id!==id&&item.x===x&&item.y===y);
      if(other)return {type:'collision',contact:{kind:'block',id:other.id,x,y},distance};
      if((level.walls||[]).some(w=>w[0]===x&&w[1]===y))return {type:'collision',contact:{kind:'wall',x,y},distance};
    }
    return {type:'exit',distance:distance+1};
  }
  function canExit(level,items,id){return traceMove(level,items,id).type==='exit'}
  function createState(level){
    return {blocks:level.blocks.map(b=>({...b})),moves:0,lives:3,status:'playing'};
  }
  // Immutable state boundary shared by UI and solver. Rejected taps cost no move;
  // collisions cost exactly one life and preserve every board coordinate.
  function transition(level,state,id){
    if(state.status!=='playing'||state.lives<=0)return {type:'ignored',state};
    const outcome=traceMove(level,state.blocks,id);
    if(outcome.type==='ignored')return {...outcome,state};
    if(outcome.type==='collision'){
      const lives=state.lives-1;
      return {...outcome,state:{...state,lives,status:lives===0?'failed':'playing'}};
    }
    const blocks=state.blocks.filter(block=>block.id!==id);
    return {...outcome,state:{...state,blocks,moves:state.moves+1,status:isWon(blocks)?'won':'playing'}};
  }
  function legalMoves(level,items=level.blocks){return items.filter(block=>canExit(level,items,block.id)).map(block=>block.id)}
  function applyMove(level,items,id){
    if(!canExit(level,items,id))return {moved:false,blocks:items};
    return {moved:true,blocks:items.filter(block=>block.id!==id)};
  }
  function isWon(items){return items.length===0}
  return Object.freeze({GRID_SIZE,WORLD_IDS,VECTORS,validateLevel,ray,traceMove,createState,transition,canExit,legalMoves,applyMove,isWon});
});
