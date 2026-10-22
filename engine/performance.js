(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.BlockEscapePerformance=api})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  function progress(removed,total){return total>0?Math.max(0,Math.min(100,removed/total*100)):0}
  function score(level,{completed,lives,elapsedMs}){
    if(!completed)return 0;
    const limits=level.starThresholds||{};
    if(!level.timeLimitSeconds)return lives===3?3:lives>=2?2:1;
    const three=limits.threeSeconds??level.timeLimitSeconds*.6,two=limits.twoSeconds??level.timeLimitSeconds*.9;
    return lives===3&&elapsedMs<=three*1000?3:lives>=2&&elapsedMs<=two*1000?2:1;
  }
  // One monotonic accumulator. Synchronize BEFORE changing the running flag.
  class ActiveClock{
    constructor(now=()=>performance.now()){this.now=now;this.reset()}
    reset(limit){this.limit=limit==null?Infinity:limit*1000;this.elapsed=0;this.running=false;this.last=this.now()}
    sync(running){const now=this.now();if(this.running)this.elapsed=Math.min(this.limit,this.elapsed+Math.max(0,now-this.last));this.last=now;this.running=running&&this.remaining>0;return this.remaining}
    get remaining(){return Math.max(0,this.limit-this.elapsed)}
  }
  function bestRecord(raw,key,stars){
    let record;try{record=JSON.parse(raw)}catch{}
    if(!record||record.schemaVersion!==1||!record.ratings||typeof record.ratings!=='object'||Array.isArray(record.ratings))record={schemaVersion:1,ratings:{}};
    const old=record.ratings[key];record.ratings[key]=Math.max(Number.isInteger(old)&&old>=1&&old<=3?old:0,stars);
    return record;
  }
  return Object.freeze({progress,score,ActiveClock,bestRecord});
});
