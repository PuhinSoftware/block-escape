'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {Manager}=require('../audio-manager.js');
function wavSeconds(name){const b=fs.readFileSync(`assets/audio/sfx/${name}.wav`);return b.readUInt32LE(40)/b.readUInt32LE(28)}
function fixture(){
 const sources=[],gains=[];let hidden=false;
 const context={state:'running',currentTime:0,destination:{},createGain(){const events=[];const gain={value:1,setValueAtTime(v,t){this.value=v;events.push(['set',v,t])},setTargetAtTime(v,t){this.value=v;events.push(['target',v,t])},exponentialRampToValueAtTime(v,t){events.push(['ramp',v,t])},cancelScheduledValues(){}};const node={gain,events,connect(){},disconnect(){}};gains.push(node);return node},createMediaElementSource(){return {connect(){},disconnect(){}}},createBufferSource(){const source={connect(){},disconnect(){},start(t){this.startAt=t;this.endAt=t+this.buffer.duration},stop(t=context.currentTime){this.stops.push(t);this.endAt=Math.min(this.endAt??Infinity,t)},stops:[]};sources.push(source);return source},resume(){return Promise.resolve()},close(){return Promise.resolve()}};
 const media={paused:true,currentTime:10,plays:0,pauses:0,ownerDocument:{createElement:()=>({})},addEventListener(){},replaceChildren(){},load(){},play(){this.plays++;this.paused=false;return Promise.resolve()},pause(){this.pauses++;this.paused=true}};
 const manager=new Manager({media,createContext:()=>context,fetcher:()=>Promise.reject(),isHidden:()=>hidden});manager.setScene('playing');manager.unlock();manager.buffers.set('level_win',{duration:wavSeconds('results/level_win')});for(let n=1;n<=3;n++)manager.buffers.set(`star_${n}`,{duration:wavSeconds(`rewards/star_${n}`)});manager.buffers.set('collision',{duration:.33});manager.setScene('won');
 function advance(seconds){context.currentTime+=seconds;for(const source of sources)if(!source.ended&&source.endAt<=context.currentTime){source.ended=true;source.onended?.()}}
 return {manager,context,media,sources,gains,advance,hide(){hidden=true;manager.visibility()}};
}
test('a started victory cannot be replaced or retriggered by another reward',()=>{
 const f=fixture(),m=f.manager;assert.equal(m.effect('level_win'),true);const win=f.sources.at(-1);f.advance(.3);assert.equal(m.effect('star_1'),false);assert.equal(m.effect('level_win'),false);assert.equal(win.stops.length,0,'no early or redundant stop on natural sample');f.advance(1.1);assert.equal(win.ended,true);assert.equal(m.effect('level_win'),false,'one victory per attempt even after natural completion');
});
test('decoded victory retains its own envelope through the actual 1.4s file duration',()=>{
 const f=fixture();assert.equal(wavSeconds('results/level_win'),1.4);f.manager.effect('level_win');const voice=f.gains.at(-1);assert.equal(voice.events.some(e=>e[0]==='ramp'),false,'do not exponentially erase a mastered sample');assert.equal(f.sources.at(-1).stops.length,0);f.advance(1.39);assert.equal(f.manager.voices.size,1);f.advance(.02);assert.equal(f.manager.voices.size,0);
});
test('sample completion fires once; volume changes and music smoothing do not cancel victory',()=>{
 const f=fixture();let completions=0;f.manager.effect('level_win',{onEnded:result=>{assert.equal(result.cancelled,false);completions++}});const win=f.sources.at(-1),plays=f.media.plays,pauses=f.media.pauses;f.advance(.4);f.manager.setSetting('musicVolume',.45);f.manager.setSetting('sfxVolume',.5);f.manager.restoreMusic();assert.equal(win.stops.length,0);assert.equal(f.media.plays,plays);assert.equal(f.media.pauses,pauses);assert.equal(f.media.paused,false);f.advance(1);assert.equal(completions,1);win.onended?.();assert.equal(completions,1);
});
for(const action of ['mute','zero','menu','next','hidden','dispose'])test(`${action} cancels victory once without scheduling another reward`,()=>{
 const f=fixture();let cancelled=0;f.manager.effect('level_win',{onEnded:r=>{assert.equal(r.cancelled,true);cancelled++}});f.advance(.3);if(action==='mute')f.manager.setSetting('sfxEnabled',false);if(action==='zero')f.manager.setSetting('sfxVolume',0);if(action==='menu')f.manager.setScene('menu');if(action==='next')f.manager.setScene('playing');if(action==='hidden')f.hide();if(action==='dispose')f.manager.dispose();assert.equal(cancelled,1);assert.equal(f.manager.voices.size,0);f.advance(10);assert.equal(cancelled,1);
});
module.exports={fixture,wavSeconds};
