'use strict';
const Rules=BlockEscapeRules;
const S=Rules.GRID_SIZE,arrows={U:'↑',D:'↓',L:'←',R:'→'},vectors=Rules.VECTORS;
const levels=[];
const PROGRESS_KEY='blockEscapeUnlockedV06';
const requestedLab=new URLSearchParams(location.search).get('lab');
const LAB_KIND=['collision','timer'].includes(requestedLab)?requestedLab:null,LAB_MODE=!!LAB_KIND;
const $=id=>document.getElementById(id),board=$('board');let index=0,blocks=[],moves=0,sound=true,toastTimer,audioContext,busy=false;
let unlocked=1,catalog=null,levelsReady=false,lives=3,playStatus='playing';
try{sound=localStorage.getItem('blockEscapeSound')!=='off'}catch{}
function key(x,y){return `${x},${y}`}
function clearPath(block,items){return Rules.canExit(levels[index],items,block.id)}
async function initializeLevels(){
  const json=async path=>{const response=await fetch(path);if(!response.ok)throw Error(`HTTP ${response.status}: ${path}`);return response.json()};
  if(LAB_MODE){
    const data=await json(`levels/lab/${LAB_KIND}-v1.json`);
    if(data.schemaVersion!==1||data.mode!==`${LAB_KIND}-lab`||!Array.isArray(data.levels)||data.levels.length!==5||data.levels.some((level,i)=>!Rules.validateLevel(level).valid||level.id!==i+1||typeof level.title!=='string'||typeof level.hint!=='string'))throw Error('Invalid collision lab');
    levels.splice(0,levels.length,...data.levels);unlocked=5;levelsReady=true;load(0);return;
  }
  const nextCatalog=await json('levels/catalog.json');
  const header=BlockEscapeCatalog.validateCatalog(nextCatalog);if(!header.valid)throw Error(header.errors.join('; '));
  const packs=await Promise.all(nextCatalog.packs.map(async pack=>{
    const data=await json('levels/'+pack.path);
    if(data.schemaVersion!==1||!Array.isArray(data.levels)||data.levels.length!==pack.count||data.levels.some(level=>level.worldId!==pack.worldId))throw Error('Invalid level pack');
    return data.levels;
  }));
  const nextLevels=packs.flat().sort((a,b)=>a.id-b.id),validation=BlockEscapeCatalog.validateCatalog(nextCatalog,nextLevels);
  if(!validation.valid)throw Error(validation.errors.join('; '));
  levels.splice(0,levels.length,...nextLevels);catalog=nextCatalog;
  unlocked=1;try{const stored=Number(localStorage.getItem(PROGRESS_KEY));if(Number.isInteger(stored)&&stored>=1)unlocked=Math.min(levels.length,stored)}catch{}
  levelsReady=true;load(0);
}
function load(i){if(busy||!levelsReady||!Number.isInteger(i)||!levels[i])return;index=i;adoptState(Rules.createState(levels[i]));activeClock.reset(levels[i].timeLimitSeconds);hideModal();render();message('');resetPerformance();}
function currentState(){return {blocks,moves,lives,status:playStatus}}
function adoptState(state){blocks=state.blocks;moves=state.moves;lives=state.lives;playStatus=state.status}
function render(){board.style.setProperty('--size',S);const wallSet=new Set((levels[index].walls||[]).map(p=>key(...p)));const map=new Map(blocks.map(b=>[key(b.x,b.y),b]));const frag=document.createDocumentFragment();for(let y=0;y<S;y++)for(let x=0;x<S;x++){const cell=document.createElement('div');cell.className='cell'+(wallSet.has(key(x,y))?' wall':'');const b=map.get(key(x,y));if(b){const btn=document.createElement('button');btn.className='block';btn.dataset.dir=b.dir;btn.textContent=arrows[b.dir];btn.setAttribute('aria-label',`Satır ${y+1}, sütun ${x+1}, ${b.dir} yönü`);btn.addEventListener('click',()=>tap(b.id,btn));cell.append(btn)}frag.append(cell)}board.replaceChildren(frag);$('levelLabel').textContent=`${String(index+1).padStart(2,'0')} / ${levels.length}`;$('remaining').textContent=blocks.length;$('moves').textContent=moves;updateLives();$('labBanner').hidden=!LAB_MODE;document.querySelector('.game-footer p').textContent=LAB_MODE?'Test modu · İlerleme kaydedilmez.':'İlerlemen bu tarayıcıda güvende.';if(LAB_MODE){$('labBanner').textContent=`TEST ${index+1} · ${levels[index].title}`;$('hint').textContent=levels[index].hint}}
function message(t){$('toast').textContent=t;clearTimeout(toastTimer);if(t)toastTimer=setTimeout(()=>$('toast').textContent='',1800)}
// Create/resume only inside a user gesture. One context serves every effect.
function updateSoundButton(){const button=$('sound');button.textContent=sound?'♪':'♪̸';button.setAttribute('aria-pressed',String(sound));button.setAttribute('aria-label',sound?'Sesi kapat':'Sesi aç');button.title=sound?'Ses açık':'Ses kapalı'}
function playSound(effect){
  if(!sound)return;
  try{
    const Audio=window.AudioContext||window.webkitAudioContext;
    if(!Audio)return;
    if(!audioContext||audioContext.state==='closed')audioContext=new Audio();
    const context=audioContext;
    const schedule=()=>{
      if(!sound||context.state!=='running')return;
      const notes=effect==='win'?[640,800,960]:effect==='blocked'?[180]:[640];
      const start=context.currentTime;
      notes.forEach((frequency,i)=>{
        const oscillator=context.createOscillator(),gain=context.createGain();
        const time=start+i*.12;
        oscillator.type=effect==='blocked'?'triangle':'sine';
        oscillator.frequency.setValueAtTime(frequency,time);
        gain.gain.setValueAtTime(.045,time);
        gain.gain.exponentialRampToValueAtTime(.001,time+.1);
        oscillator.connect(gain);gain.connect(context.destination);
        oscillator.start(time);oscillator.stop(time+.11);
        oscillator.onended=()=>{oscillator.disconnect();gain.disconnect()};
      });
    };
    // Rejected resume (autoplay policy/background tab) must not break gameplay.
    if(context.state!=='running')context.resume().then(()=>{try{schedule()}catch{}}).catch(()=>{});
    else schedule();
  }catch{} // Missing or unavailable audio is an optional enhancement.
}
function toggleSound(){
  sound=!sound;
  try{localStorage.setItem('blockEscapeSound',sound?'on':'off')}catch{}
  updateSoundButton();
  if(sound)playSound('move');
  else if(audioContext){try{audioContext.suspend().catch(()=>{})}catch{}}
}
function setBusy(value){
  syncClock();
  busy=value;
  syncClock();board.setAttribute('aria-busy',String(value));
  document.querySelectorAll('.block,#reset,#levelsBtn,#homeBtn').forEach(button=>button.disabled=value||(playStatus!=='playing'&&button.classList.contains('block')));
}
function reducedMotion(){return window.matchMedia('(prefers-reduced-motion: reduce)').matches}
async function animateBlock(element,block,blocked){
  if(reducedMotion()||!element.animate)return;
  const rect=element.getBoundingClientRect(),bounds=board.getBoundingClientRect();
  const [dx,dy]=vectors[block.dir];
  const distance=dx>0?bounds.right-rect.left:dx<0?rect.right-bounds.left:dy>0?bounds.bottom-rect.top:rect.bottom-bounds.top;
  const frames=blocked?
    [{transform:'translateX(0)'},{transform:'translateX(-4px)'},{transform:'translateX(4px)'},{transform:'translateX(0)'}]:
    [{transform:'translate(0,0)',opacity:1},{transform:`translate(${dx*distance}px,${dy*distance}px)`,opacity:1}];
  element.classList.add(blocked?'blocked':'exiting');
  if(!blocked)element.parentElement.classList.add('exiting-cell');
  let animation,timer;
  try{
    animation=element.animate(frames,{duration:blocked?180:380,easing:blocked?'ease-in-out':'cubic-bezier(.4,0,.8,1)',fill:'forwards'});
    // Hidden tabs or cancelled animations must never leave input locked.
    await Promise.race([animation.finished,new Promise(resolve=>{timer=setTimeout(resolve,500)})]);
  }catch{}finally{clearTimeout(timer);animation?.cancel();element.classList.remove('blocked','exiting');element.parentElement?.classList.remove('exiting-cell')}
}
async function tap(id,el){
  syncClock();
  if(busy||playStatus!=='playing')return;
  const b=blocks.find(x=>x.id===id);if(!b)return;
  setBusy(true);
  try{
    const outcome=Rules.transition(levels[index],currentState(),id);
    if(outcome.type==='collision'){
      prepareCollisionAudio();
      await animateCollision(el,b,outcome.contact,()=>{
        adoptState(outcome.state);updateLives(lives);playSound('blocked');
        message(lives?`Çarpışma! ${lives} canın kaldı.`:'Canların bitti. Yeniden deneyebilirsin.');
      });
      if(playStatus==='failed')showFailed();
      return;
    }
    if(outcome.type!=='exit')return;
    adoptState(outcome.state);
    playSound(blocks.length?'move':'win');
    await animateBlock(el,b,false);
    render();updateProgress();
    if(Rules.isWon(blocks)){
      if(!LAB_MODE&&index+1>=unlocked){unlocked=Math.min(levels.length,index+2);try{localStorage.setItem(PROGRESS_KEY,unlocked)}catch{}}
      showWin();
    }
  }finally{setBusy(false)}
}
function showWin(){showModal('Bölüm tamamlandı! 🎉',`${moves} hamlede bütün blokları temizledin.`,false);showPerformance();$('next').textContent=index===levels.length-1?'Başa dön ↻':'Sonraki bölüm →';$('next').onclick=()=>load(index===levels.length-1?0:index+1)}
function showFailed(timeout=false){showModal(timeout?"TIME'S UP!":'LEVEL FAILED',timeout?'Süre doldu. Yeni bir denemeye hazır mısın?':'Üç canın bitti. Yolları inceleyip yeniden dene.',false);$('overlay').classList.remove('celebrating');$('overlay').classList.add('failed');$('next').textContent='Tekrar Dene';$('next').onclick=()=>load(index);$('close').textContent='Ana Menü';$('close').onclick=()=>{hideModal(true);window.returnToMenu?.()}}
function showModal(title,description,picker){if(busy&&picker)return;$('resultStars').hidden=true;$('overlay').classList.remove('failed');$('close').textContent='Kapat';$('close').onclick=()=>hideModal();$('overlay').classList.toggle('celebrating',!picker);$('modalTitle').textContent=title;$('modalText').textContent=description;$('levelPicker').classList.toggle('hidden',!picker);$('next').classList.toggle('hidden',picker);if(picker){$('levelPicker').replaceChildren();levels.forEach((_,i)=>{const b=document.createElement('button');b.textContent=i+1;b.disabled=i>=unlocked;b.onclick=()=>{load(i);window.openGame?.()};$('levelPicker').append(b)})}$('overlay').classList.remove('hidden');syncClock()}
function hideModal(force=false){if(playStatus==='failed'&&$('overlay').classList.contains('failed')&&!force)return;$('overlay').classList.add('hidden');syncClock()}
$('reset').onclick=()=>load(index);$('levelsBtn').onclick=()=>showModal('Bölüm seç',`Açık bölüm: ${unlocked}/${levels.length}`,true);$('close').onclick=hideModal;$('sound').onclick=toggleSound;
updateSoundButton();
