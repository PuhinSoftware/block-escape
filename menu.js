'use strict';
// Presentation/navigation only. The existing game owns levels, moves and storage.
const menu=document.getElementById('menu'),gameScreen=document.querySelector('.app');
let gameStarted=false,modalOpener;
function refreshMenu(){document.getElementById('menuProgress').textContent=`${unlocked} / ${levels.length} bölüm açık · İlerlemen güvende`}
window.openGame=function(){
  gameStarted=true;menu.hidden=true;gameScreen.hidden=false;
  document.getElementById('homeBtn').focus();
};
document.getElementById('playBtn').onclick=()=>{
  if(!gameStarted)load(unlocked-1);
  window.openGame();
};
document.getElementById('homeBtn').onclick=()=>{
  if(busy)return;
  gameScreen.hidden=true;menu.hidden=false;refreshMenu();
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
