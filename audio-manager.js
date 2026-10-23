(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.BlockEscapeAudio=api})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const KEY='blockEscapeAudioV063';
  const DEFAULTS=Object.freeze({schemaVersion:1,musicEnabled:true,sfxEnabled:true,musicVolume:.3,sfxVolume:.7});
  const WORLDS=Object.freeze({'crystal-mines':[{src:'assets/audio/music/crystal-mines.ogg',type:'audio/ogg; codecs="vorbis"'},{src:'assets/audio/music/crystal-mines.mp3',type:'audio/mpeg'}]});
  const EFFECTS=Object.freeze({block_exit:'blocks/block_exit',collision:'blocks/collision',level_win:'results/level_win',level_failed:'results/level_failed',time_up:'results/time_up',star_1:'rewards/star_1',star_2:'rewards/star_2',star_3:'rewards/star_3'});
  function readSettings(storage){
    let legacy,raw;try{legacy=storage?.getItem('blockEscapeSound');raw=JSON.parse(storage?.getItem(KEY)||'null')}catch{}
    const fallback={...DEFAULTS,...(legacy==='off'?{musicEnabled:false,sfxEnabled:false}:{})};
    if(!raw||raw.schemaVersion!==1)return fallback;
    for(const k of ['musicEnabled','sfxEnabled'])if(typeof raw[k]==='boolean')fallback[k]=raw[k];
    for(const k of ['musicVolume','sfxVolume'])if(typeof raw[k]==='number'&&Number.isFinite(raw[k]))fallback[k]=Math.max(0,Math.min(1,raw[k]));
    return fallback;
  }
  class Manager{
    constructor({storage,media,createContext,fetcher,isHidden=()=>false,onChange=()=>{}}){
      this.storage=storage;this.media=media;this.createContext=createContext;this.fetcher=fetcher;this.isHidden=isHidden;this.onChange=onChange;
      this.settings=readSettings(storage);this.context=undefined;this.buffers=new Map();this.loading=new Set();this.voices=new Set();this.cues=new Map();this.effectEpoch=0;this.victoryPlayed=false;this.gainTargets=new WeakMap();this.scene='menu';this.world=null;this.ducked=false;this.suspended=false;this.disposed=false;this.unlocked=false;this.pendingPlay=null;this.musicFailed=false;this.lastEffects=new Map();this.musicRevision=0;
      media.loop=true;media.preload='none';media.addEventListener('error',()=>{this.musicFailed=true;this.pauseMusic()});
      this.save();
    }
    save(){try{this.storage?.setItem(KEY,JSON.stringify(this.settings))}catch{}}
    setSetting(key,value){
      if(['musicEnabled','sfxEnabled'].includes(key)&&typeof value==='boolean')this.settings[key]=value;
      else if(['musicVolume','sfxVolume'].includes(key)&&Number.isFinite(value))this.settings[key]=Math.max(0,Math.min(1,value));else return;
      this.save();if(!this.settings.sfxEnabled||!this.settings.sfxVolume)this.stopEffects();this.applyVolumes();this.syncMusic();this.onChange();
    }
    // Called synchronously ONLY from input handlers. Never create/resume on timers.
    unlock(){
      if(this.disposed||(!this.settings.musicEnabled&&!this.settings.sfxEnabled))return;
      try{
        if(!this.context){
          this.context=this.createContext();
          this.sfxGain=this.context.createGain();this.sfxGain.connect(this.context.destination);
          if(this.context.createMediaElementSource){this.musicSource=this.context.createMediaElementSource(this.media);this.musicGain=this.context.createGain();this.musicSource.connect(this.musicGain);this.musicGain.connect(this.context.destination)}
        }
        this.unlocked=true;this.applyVolumes();
        if(this.context.state!=='running')Promise.resolve(this.context.resume()).then(()=>this.syncMusic()).catch(()=>{});
        this.preloadEffects();this.syncMusic();
      }catch{} // Optional audio must never affect a move or navigation.
    }
    preloadEffects(){
      if(!this.context?.decodeAudioData||!this.settings.sfxEnabled)return;
      for(const [name,path] of Object.entries(EFFECTS)){
        if(this.loading.has(name)||this.buffers.has(name))continue;this.loading.add(name);
        // Failed assets are attempted once per session; fallback has zero latency.
        Promise.resolve().then(()=>this.fetcher(`assets/audio/sfx/${path}.wav`)).then(r=>{if(!r.ok)throw Error('audio HTTP');return r.arrayBuffer()}).then(data=>this.context.decodeAudioData(data)).then(buffer=>{if(!this.disposed)this.buffers.set(name,buffer)}).catch(()=>{});
      }
    }
    setScene(scene,world=this.world||'crystal-mines'){
      if(this.disposed)return;
      if(scene!==this.scene){this.stopEffects();this.victoryPlayed=false}
      this.scene=scene;this.ducked=scene==='won'||scene==='failed';
      if(world!==this.world){
        this.pauseMusic();this.world=world;this.musicFailed=false;
        this.sourceWorld=null;
      }
      this.applyVolumes();this.syncMusic();
    }
    applyVolumes(){
      const set=(node,value)=>{
        if(!node||!this.context||this.gainTargets.get(node)===value)return;
        try{
          const p=node.gain,t=this.context.currentTime,current=p.value;
          if(p.cancelAndHoldAtTime)p.cancelAndHoldAtTime(t);
          else{p.cancelScheduledValues?.(t);p.setValueAtTime(current,t)}
          if(p.setTargetAtTime)p.setTargetAtTime(value,t,.07);else p.setValueAtTime(value,t);
          this.gainTargets.set(node,value);
        }catch{}
      };
      set(this.sfxGain,this.settings.sfxEnabled?this.settings.sfxVolume:0);
      set(this.musicGain,this.settings.musicEnabled?this.settings.musicVolume*(this.ducked?.35:1):0);
    }
    canPlayMusic(){return !this.disposed&&this.unlocked&&this.musicGain&&this.settings.musicEnabled&&this.settings.musicVolume>0&&this.scene!=='menu'&&!this.isHidden()&&!this.suspended&&!this.musicFailed&&!!WORLDS[this.world]}
    pauseMusic(){this.musicRevision++;try{this.media.pause()}catch{}}
    syncMusic(){
      if(!this.canPlayMusic()){this.pauseMusic();return}
      if(this.sourceWorld!==this.world){
        this.media.replaceChildren(...WORLDS[this.world].map(source=>{const el=this.media.ownerDocument.createElement('source');el.src=source.src;el.type=source.type;return el}));
        this.sourceWorld=this.world;this.media.load?.();
      }
      if(!this.media.paused||this.pendingPlay)return;
      try{
        const revision=this.musicRevision,pending=Promise.resolve(this.media.play());this.pendingPlay=pending;
        pending.then(()=>{if(!this.canPlayMusic())this.pauseMusic()}).catch(()=>{}).finally(()=>{if(this.pendingPlay===pending){this.pendingPlay=null;if(revision!==this.musicRevision&&this.canPlayMusic()&&this.media.paused)this.syncMusic()}});
      }catch{}
    }
    visibility(suspended=this.suspended){this.suspended=suspended;if(this.isHidden()||suspended)this.stopEffects();else if(this.unlocked&&this.context&&this.context.state!=='running'&&this.context.state!=='closed'&&(this.settings.musicEnabled||this.settings.sfxEnabled)){try{Promise.resolve(this.context.resume()).then(()=>this.syncMusic()).catch(()=>{})}catch{}}this.syncMusic()}
    stopEffects(channel){
      if(!channel)this.effectEpoch++;
      for(const cue of [...this.cues.values()])if(!channel||cue.channel===channel)cue.cancel();
    }
    effect(name,{onEnded,maxDuration}={}){
      if(this.disposed||!Object.prototype.hasOwnProperty.call(EFFECTS,name)||!this.settings.sfxEnabled||!this.settings.sfxVolume||this.isHidden()||this.suspended||this.scene==='menu'||this.context?.state!=='running')return false;
      const reward=name.startsWith('star_')||name==='level_win',channel=reward?'reward':'gameplay';
      if(reward&&this.scene!=='won')return false;
      if(!reward&&this.scene==='won')return false;
      if(reward&&this.victoryPlayed)return false;
      const now=this.context.currentTime,last=this.lastEffects.get(name);if(last!==undefined&&now-last<.045)return false;
      this.lastEffects.set(name,now);this.stopEffects(channel);
      const cue={name,channel,voices:new Set(),building:true,done:false,cancelled:false};
      cue.finish=()=>{
        if(cue.done||cue.building||cue.voices.size)return;
        cue.done=true;if(this.cues.get(channel)===cue)this.cues.delete(channel);
        try{onEnded?.({cancelled:cue.cancelled})}catch{}
      };
      cue.cancel=()=>{cue.cancelled=true;for(const voice of [...cue.voices]){try{voice.source.stop()}catch{}voice.cleanup()}cue.finish()};
      this.cues.set(channel,cue);
      try{
        const buffer=this.buffers.get(name);
        if(buffer){
          const source=this.context.createBufferSource();source.buffer=buffer;
          const duration=Number.isFinite(maxDuration)&&maxDuration>0?Math.min(buffer.duration,maxDuration):buffer.duration;
          // Mastered samples already contain their envelope. Let the buffer end naturally.
          this.voice(source,.32,duration,cue,true,duration<buffer.duration);
        }else{
          const notes={block_exit:[640],collision:[180],level_win:[660,880],level_failed:[150],time_up:[240],star_1:[784],star_2:[988],star_3:[1175,1480,1760]}[name];
          for(const frequency of notes){const source=this.context.createOscillator();source.type=name==='collision'?'triangle':'sine';source.frequency.setValueAtTime(frequency,now);this.voice(source,.045/notes.length,.18,cue,false,false)}
        }
        if(name==='level_win')this.victoryPlayed=true;
        cue.building=false;cue.finish();return true;
      }catch{cue.building=false;cue.cancel();return false}
    }
    voice(source,volume,duration,cue,sample,trimmed){
      const gain=this.context.createGain(),voice={source,gain};let cleaned=false;
      voice.cleanup=()=>{if(cleaned)return;cleaned=true;try{source.disconnect();gain.disconnect()}catch{}this.voices.delete(voice);cue.voices.delete(voice);cue.finish()};
      this.voices.add(voice);cue.voices.add(voice);const t=this.context.currentTime;
      if(sample){
        gain.gain.setValueAtTime(volume,t);
        if(trimmed){gain.gain.setValueAtTime(volume,t+Math.max(0,duration-.025));gain.gain.exponentialRampToValueAtTime(.0001,t+duration)}
      }else{
        gain.gain.setValueAtTime(.0001,t);gain.gain.exponentialRampToValueAtTime(volume,t+.012);gain.gain.exponentialRampToValueAtTime(.0001,t+duration);
      }
      source.connect(gain);gain.connect(this.sfxGain);source.onended=voice.cleanup;
      if(sample&&trimmed)source.start(t,0,duration);else source.start(t);
      if(!sample)source.stop(t+duration+.01);
    }
    restoreMusic(){if(this.scene==='won'){this.ducked=false;this.applyVolumes()}}
    dispose(){this.disposed=true;this.pauseMusic();this.stopEffects();this.buffers.clear();try{this.musicSource?.disconnect();this.musicGain?.disconnect();this.sfxGain?.disconnect();this.context?.close()?.catch(()=>{})}catch{}}
  }
  return Object.freeze({KEY,DEFAULTS,WORLDS,EFFECTS,readSettings,Manager});
});
