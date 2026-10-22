(function(root,factory){
 if(typeof module==='object'&&module.exports)module.exports=factory(require('./rules.js'));
 else root.BlockEscapeCatalog=factory(root.BlockEscapeRules);
})(typeof globalThis!=='undefined'?globalThis:this,function(Rules){
 'use strict';
 function validateCatalog(catalog,levels){
  const errors=[];
  if(!catalog||catalog.schemaVersion!==1||catalog.catalogVersion!=='v0.6')return {valid:false,errors:['unsupported catalog']};
  if(catalog.plannedCount!==300)errors.push('plannedCount must be 300');
  if(!Number.isInteger(catalog.availableCount)||catalog.availableCount<1||catalog.availableCount>300)errors.push('invalid availableCount');
  if(!Array.isArray(catalog.worlds)||catalog.worlds.length!==4)errors.push('four planned worlds required');
  else {const ids=new Set();catalog.worlds.forEach((world,i)=>{if(!world||typeof world.id!=='string'||world.id!==Rules.WORLD_IDS[i]||ids.has(world.id)||typeof world.name!=='string'||world.start!==i*75+1||world.end!==(i+1)*75)errors.push('invalid world range/identity');ids.add(world?.id)})}
  if(!Array.isArray(catalog.packs)||!catalog.packs.length)errors.push('packs required');
  else {const paths=new Set();for(const pack of catalog.packs){if(!pack||!/^v1\/[a-z0-9-]+\.json$/.test(pack.path)||paths.has(pack.path)||!Number.isInteger(pack.count)||pack.count<1||pack.count>25||!(Array.isArray(catalog.worlds)&&catalog.worlds.some(w=>w?.id===pack.worldId)))errors.push('invalid pack');paths.add(pack?.path)}if(catalog.packs.reduce((n,p)=>n+(p?.count||0),0)!==catalog.availableCount)errors.push('pack counts differ')}
  if(levels!==undefined){
   if(!Array.isArray(levels)||levels.length!==catalog.availableCount)errors.push('available level count differs');
   else levels.forEach((level,i)=>{
    const validation=Rules.validateLevel(level);if(!validation.valid)errors.push(`level ${i+1}: ${validation.errors.join(', ')}`);
    if(level?.id!==i+1)errors.push('levels must have unique contiguous ids starting at 1');
    const world=(Array.isArray(catalog.worlds)?catalog.worlds:[]).find(w=>w&&level?.id>=w.start&&level?.id<=w.end);if(!world||level?.worldId!==world.id)errors.push('level/world range mismatch');
   });
  }
  return {valid:errors.length===0,errors};
 }
 return Object.freeze({validateCatalog});
});
