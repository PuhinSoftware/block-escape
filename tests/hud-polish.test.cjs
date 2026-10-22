'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const P=require('../engine/performance.js');
const timed={timeLimitSeconds:45,starThresholds:{threeSeconds:25,twoSeconds:40}};
test('potential uses current lives and exact score thresholds without prediction',()=>{
 for(const lives of [1,2,3])for(const elapsedMs of [0,25000,25001,40000,40001,44999]){
  assert.equal(P.potential(timed,{lives,elapsedMs}),P.score(timed,{completed:true,lives,elapsedMs}));
 }
 assert.equal(P.potential(timed,{lives:3,elapsedMs:25000}),3);
 assert.equal(P.potential(timed,{lives:3,elapsedMs:25001}),2);
 assert.equal(P.potential(timed,{lives:3,elapsedMs:40001}),1);
 assert.equal(P.potential(timed,{lives:2,elapsedMs:0}),2);
});
test('untimed lives, minimum successful rating and zero-reward failure are distinct',()=>{
 for(const lives of [1,2,3])assert.equal(P.potential({},{lives,elapsedMs:1e9}),lives);
 assert.equal(P.potential(timed,{lives:1,elapsedMs:44999}),1);
 assert.equal(P.potential(timed,{lives:3,elapsedMs:45000}),0);
 assert.equal(P.potential(timed,{lives:0,elapsedMs:0}),0);
 assert.equal(P.potential(timed,{lives:3,elapsedMs:0,status:'failed'}),0);
 assert.equal(P.score(timed,{completed:false,lives:3,elapsedMs:45000}),0);
});
test('potential never increases while active time or damage increases',()=>{
 for(let lives=3;lives>=1;lives--){let last=3;for(let elapsedMs=0;elapsedMs<=45000;elapsedMs+=250){const next=P.potential(timed,{lives,elapsedMs});assert.ok(next<=last);last=next}}
});
