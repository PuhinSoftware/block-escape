'use strict';
// Short original placeholders on the existing shared Web Audio context.
// Replace only these cues when recorded crystal sounds become available.
const STAR_CUES=Object.freeze([[784],[988],[1175,1480,1760]]);
const starVoices=new Set();
function stopStarSounds(){
  for(const voice of starVoices){try{voice.oscillator.stop()}catch{}voice.cleanup()}
  starVoices.clear();
}
function playStarSound(number){
  // Context creation/resume belongs to the preceding input gesture, never a timer.
  if(!sound||!audioContext||audioContext.state!=='running'||!STAR_CUES[number-1])return;
  stopStarSounds();
  const context=audioContext,start=context.currentTime,duration=.18;
  try{
    for(const frequency of STAR_CUES[number-1]){
      const oscillator=context.createOscillator(),gain=context.createGain(),voice={oscillator,gain};
      let cleaned=false;voice.cleanup=()=>{if(cleaned)return;cleaned=true;try{oscillator.disconnect();gain.disconnect()}catch{}starVoices.delete(voice)};
      starVoices.add(voice);oscillator.type='sine';oscillator.frequency.setValueAtTime(frequency,start);
      gain.gain.setValueAtTime(.0001,start);
      // A gentle attack avoids clicks; divide chord gain to retain a modest volume.
      gain.gain.exponentialRampToValueAtTime(.035/STAR_CUES[number-1].length,start+.012);
      gain.gain.exponentialRampToValueAtTime(.0001,start+duration);
      oscillator.connect(gain);gain.connect(context.destination);
      oscillator.onended=voice.cleanup;
      oscillator.start(start);oscillator.stop(start+duration+.01);
    }
  }catch{stopStarSounds()}
}
