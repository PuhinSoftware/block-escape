'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {Manager,KEY,DEFAULTS,readSettings}=require('../audio-manager.js');
const store=(values={})=>({getItem:k=>values[k]??null,setItem:(k,v)=>values[k]=v,values});
function fixture(){
 const storage=store(),events=[];let hidden=false,contexts=0;
 const param=()=>({value:0,setValueAtTime(v){this.value=v},setTargetAtTime(v){this.value=v},exponentialRampToValueAtTime(){},cancelScheduledValues(){}});
 const node=()=>({connect(){},disconnect(){},gain:param()});
 const context={state:'running',currentTime:1,destination:{},createGain:node,createMediaElementSource:node,createOscillator:()=>({...node(),frequency:param(),start(){},stop(){}}),createBufferSource:()=>({...node(),start(){},stop(){}}),resume(){events.push('resume');this.state='running';return Promise.resolve()},close(){return Promise.resolve()}};
 const media={paused:true,currentTime:9,ownerDocument:{createElement:()=>({})},addEventListener(){},replaceChildren(...sources){this.sources=sources},load(){events.push('load')},pause(){this.paused=true},play(){events.push('play');this.paused=false;return Promise.resolve()}};
 const manager=new Manager({storage,media,createContext:()=>{contexts++;return context},fetcher:()=>Promise.reject(Error('offline')),isHidden:()=>hidden});
 return {manager,media,context,storage,events,get contexts(){return contexts},hide:v=>hidden=v};
}
test('defaults, legacy mute migration, versioned precedence, validation and denied storage',()=>{
 assert.deepEqual(readSettings(store()),DEFAULTS);
 const legacy=store({blockEscapeSound:'off',blockEscapeUnlockedV06:'17'});assert.equal(readSettings(legacy).musicEnabled,false);assert.equal(readSettings(legacy).sfxEnabled,false);
 legacy.setItem(KEY,JSON.stringify({...DEFAULTS,musicVolume:7,sfxVolume:-2}));assert.equal(readSettings(legacy).musicEnabled,true);assert.equal(readSettings(legacy).musicVolume,1);assert.equal(readSettings(legacy).sfxVolume,0);assert.equal(legacy.getItem('blockEscapeSound'),'off');assert.equal(legacy.getItem('blockEscapeUnlockedV06'),'17');assert.deepEqual(readSettings({getItem(){throw Error('denied')}}),DEFAULTS);
});
test('one gesture-created context, independent gains, same-world music continuity and menu pause',async()=>{
 const f=fixture(),m=f.manager;assert.equal(f.contexts,0);m.setScene('playing');assert.ok(!f.events.includes('play'));m.unlock();await Promise.resolve();assert.equal(f.contexts,1);assert.equal(m.musicGain.gain.value,.3);assert.equal(m.sfxGain.gain.value,.7);m.unlock();m.setScene('playing');assert.equal(f.contexts,1);assert.equal(f.events.filter(e=>e==='play').length,1);assert.equal(f.media.currentTime,9);
 m.setSetting('sfxEnabled',false);assert.equal(f.media.paused,false);m.setSetting('musicEnabled',false);assert.equal(f.media.paused,true);m.setSetting('sfxEnabled',true);assert.equal(m.effect('collision'),true);m.setScene('menu');assert.equal(f.media.paused,true);assert.equal(m.effect('collision'),false);
});
test('visibility never starts opted-out music or background effects, resume and ducking',async()=>{
 const f=fixture(),m=f.manager;m.setScene('playing');m.unlock();await Promise.resolve();f.hide(true);m.visibility();assert.equal(f.media.paused,true);assert.equal(m.effect('star_1'),false);m.setSetting('musicEnabled',false);f.hide(false);m.visibility();assert.equal(f.media.paused,true);m.setSetting('musicEnabled',true);await new Promise(resolve=>setImmediate(resolve));assert.equal(f.media.paused,false);m.setScene('won');assert.ok(Math.abs(m.musicGain.gain.value-.105)<1e-9);m.restoreMusic();assert.equal(m.musicGain.gain.value,.3);m.setScene('failed');assert.ok(m.musicGain.gain.value<.3);f.context.state='interrupted';m.visibility();await Promise.resolve();assert.equal(f.context.state,'running');assert.equal(f.contexts,1);
});
test('bounded voices, duplicate guard, sound cleanup and disposal',()=>{
 const f=fixture(),m=f.manager;m.setScene('won');m.unlock();assert.equal(m.effect('star_3'),true);assert.equal(m.voices.size,3);assert.equal(m.effect('star_3'),false);m.setScene('playing');for(let i=0;i<100;i++){f.context.currentTime+=.1;m.effect(i%2?'collision':'block_exit');assert.equal(m.voices.size,1)}m.setSetting('sfxVolume',0);assert.equal(m.voices.size,0);m.dispose();assert.equal(m.effect('star_1'),false);assert.equal(f.media.paused,true);
});
test('missing or rejected APIs never throw into gameplay',async()=>{
 const f=fixture();f.manager.createContext=()=>{throw Error('missing')};assert.doesNotThrow(()=>f.manager.unlock());assert.equal(f.manager.effect('collision'),false);
 const g=fixture();g.context.state='suspended';g.context.resume=()=>Promise.reject(Error('policy'));assert.doesNotThrow(()=>g.manager.unlock());await new Promise(resolve=>setImmediate(resolve));assert.equal(g.manager.effect('collision'),false);
});
