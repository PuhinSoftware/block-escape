'use strict';
let audioStorage;try{audioStorage=localStorage}catch{}
const GameAudio=new BlockEscapeAudio.Manager({storage:audioStorage,media:document.getElementById('worldMusic'),createContext:()=>{const Audio=window.AudioContext||window.webkitAudioContext;return new Audio()},fetcher:path=>fetch(path),isHidden:()=>document.hidden,onChange:()=>syncAudioControls()});
function syncAudioControls(){
  const s=GameAudio.settings;
  for(const [id,enabled,label] of [['sound',s.musicEnabled,'Müzik'],['settingsSound',s.musicEnabled,'Müzik'],['settingsEffects',s.sfxEnabled,'Efektler']]){
    const button=document.getElementById(id);button.setAttribute('aria-pressed',String(enabled));button.setAttribute('aria-label',`${label==='Müzik'?'Müziği':'Efektleri'} ${enabled?'kapat':'aç'}`);button.textContent=id==='sound'?(enabled?'♪':'♪̸'):(enabled?'Açık':'Kapalı');if(id==='sound')button.title=`Müzik ${enabled?'açık':'kapalı'}`;
  }
  for(const [id,key] of [['musicVolume','musicVolume'],['effectsVolume','sfxVolume']]){const value=Math.round(s[key]*100);document.getElementById(id).value=value;document.getElementById(id+'Value').textContent=`%${value}`;document.getElementById(id).setAttribute('aria-valuetext',`%${value}`)}
}
function toggleMusic(){GameAudio.setSetting('musicEnabled',!GameAudio.settings.musicEnabled);GameAudio.unlock()}
function toggleEffects(){GameAudio.setSetting('sfxEnabled',!GameAudio.settings.sfxEnabled);GameAudio.unlock()}
for(const [id,key] of [['musicVolume','musicVolume'],['effectsVolume','sfxVolume']])document.getElementById(id).addEventListener('input',event=>{GameAudio.setSetting(key,Number(event.target.value)/100);GameAudio.unlock()});
document.getElementById('settingsEffects').onclick=toggleEffects;
document.addEventListener('visibilitychange',()=>GameAudio.visibility());
window.addEventListener('pagehide',event=>{if(event.persisted)GameAudio.visibility(true);else GameAudio.dispose()});
window.addEventListener('pageshow',()=>GameAudio.visibility(false));
syncAudioControls();
