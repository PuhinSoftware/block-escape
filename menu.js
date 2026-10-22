'use strict';
// Presentation/navigation only. The existing game owns levels, moves and storage.
const menu=document.getElementById('menu'),gameScreen=document.querySelector('.app');
let gameStarted=false,modalOpener,screenTransition;
function revealScreen(element){screenTransition?.cancel();if(!reducedMotion()&&element.animate)screenTransition=element.animate([{opacity:0},{opacity:1}],{duration:220,easing:'ease-out'})}
const menuMotion=window.matchMedia('(prefers-reduced-motion: reduce)');
const stopScreenMotion=event=>{if(event.matches)screenTransition?.cancel()};
if(menuMotion.addEventListener)menuMotion.addEventListener('change',stopScreenMotion);else menuMotion.addListener(stopScreenMotion);
function syncMenuSound(){const panelButton=document.getElementById('settingsSound');panelButton.setAttribute('aria-pressed',String(sound));panelButton.textContent=sound?'Ses açık':'Ses kapalı'}
function refreshMenu(){document.getElementById('menuProgress').textContent=`${unlocked} / ${levels.length} bölüm açık · İlerlemen güvende`}
window.openGame=function(){
  gameStarted=true;menu.hidden=true;gameScreen.hidden=false;revealScreen(gameScreen);
  document.getElementById('homeBtn').focus();
};
document.getElementById('playBtn').onclick=()=>{
  if(!gameStarted)load(unlocked-1);
  window.openGame();
};
document.getElementById('homeBtn').onclick=()=>{
  if(busy)return;
  gameScreen.hidden=true;menu.hidden=false;refreshMenu();syncMenuSound();revealScreen(menu);
  document.getElementById('playBtn').focus();
};
document.getElementById('menuLevels').onclick=()=>showModal('Bölüm seç',`Açık bölüm: ${unlocked}/${levels.length}`,true);
// Track dialog visibility to focus/trap keyboard navigation without changing rules.
const overlay=document.getElementById('overlay');
new MutationObserver(()=>{
  if(!overlay.classList.contains('hidden')){
    if(!modalOpener){modalOpener=document.activeElement;document.getElementById('close').focus()}
  }else if(modalOpener){
    const target=modalOpener;modalOpener=null;
    if(target.getClientRects().length)target.focus();
  }
}).observe(overlay,{attributes:true,attributeFilter:['class']});
document.addEventListener('keydown',event=>{
  if(overlay.classList.contains('hidden'))return;
  if(event.key==='Escape'){event.preventDefault();hideModal();return}
  if(event.key!=='Tab')return;
  const buttons=[...overlay.querySelectorAll('button:not(:disabled)')].filter(button=>button.getClientRects().length);
  const first=buttons[0],last=buttons.at(-1);
  if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus()}
  else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus()}
});
refreshMenu();
document.getElementById('motionToggle').onclick=event=>{
  const paused=menu.dataset.paused!=='true';menu.dataset.paused=String(paused);
  event.currentTarget.setAttribute('aria-pressed',String(paused));
  event.currentTarget.textContent=paused?'Hareketi sürdür':'Hareketi durdur';
};

syncMenuSound();

// Settings are independent of the game dialog and do not change board state.
const settingsBackdrop=document.getElementById('settingsBackdrop');
const settingsPanel=document.getElementById('settingsPanel');
let previousOverflow='';
function closeSettings(){
  if(settingsBackdrop.hidden)return;
  settingsBackdrop.hidden=true;menu.inert=false;menu.removeAttribute('aria-hidden');
  document.documentElement.style.overflow=previousOverflow;
  document.getElementById('settingsBtn').focus();
}
document.getElementById('settingsBtn').onclick=()=>{
  syncMenuSound();previousOverflow=document.documentElement.style.overflow;
  settingsBackdrop.hidden=false;document.getElementById('settingsClose').focus();menu.inert=true;menu.setAttribute('aria-hidden','true');
  document.documentElement.style.overflow='hidden';
};
document.getElementById('settingsClose').onclick=closeSettings;
document.getElementById('settingsDone').onclick=closeSettings;
document.getElementById('settingsSound').onclick=()=>{toggleSound();syncMenuSound()};
settingsBackdrop.onclick=event=>{if(event.target===settingsBackdrop)closeSettings()};
settingsBackdrop.addEventListener('keydown',event=>{
  if(event.key==='Escape'){event.preventDefault();closeSettings()}
  if(event.key==='Tab'){
    const buttons=[...settingsPanel.querySelectorAll('button')];const first=buttons[0],last=buttons.at(-1);
    if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus()}
    else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus()}
  }
});
// Focus containment also supports browsers without native inert.
document.addEventListener('focusin',event=>{if(!settingsBackdrop.hidden&&!settingsPanel.contains(event.target))document.getElementById('settingsClose').focus()});
