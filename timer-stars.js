'use strict';
const PerformanceRules=BlockEscapePerformance;
const activeClock=new PerformanceRules.ActiveClock();
const STARS_KEY='blockEscapeBestStarsV062';
let clockLoop=null,screenOpening=false,pageSuspended=false;
function clockCanRun(){return levelsReady&&!busy&&!screenOpening&&!pageSuspended&&!document.hidden&&!document.querySelector('.app').hidden&&$('overlay').classList.contains('hidden')&&playStatus==='playing'}
function syncClock(){
  clearTimeout(clockLoop);clockLoop=null;
  activeClock.sync(clockCanRun());
  const remaining=activeClock.remaining;
  $('timerValue').textContent=Number.isFinite(remaining)?`${Math.ceil(remaining/1000)} sn`:'Süresiz';
  $('timerHud').classList.toggle('urgent',remaining<=10000);
  if(remaining===0&&playStatus==='playing'){
    playStatus='failed';activeClock.sync(false);showFailed(true);setBusy(false);return;
  }
  if(activeClock.running&&Number.isFinite(remaining))clockLoop=setTimeout(syncClock,50);
}
function resetPerformance(){
  clearTimeout(clockLoop);activeClock.reset(levels[index].timeLimitSeconds);
  const fill=$('progressFill');fill.style.transition='none';fill.style.transform='scaleX(0)';void fill.offsetWidth;fill.style.transition='';
  updateProgress();syncClock();
}
function updateProgress(){
  const value=PerformanceRules.progress(levels[index].blocks.length-blocks.length,levels[index].blocks.length);
  $('levelProgress').setAttribute('aria-valuenow',String(value));
  $('progressFill').style.transform=`scaleX(${value/100})`;
  $('progressText').textContent=`${Math.round(value)}%`;
  document.querySelectorAll('.progress-star').forEach((star,i)=>star.classList.toggle('earned',value>=(i+1)*100/3-1e-8));
}
function showPerformance(){
  const stars=PerformanceRules.score(levels[index],{completed:true,lives,elapsedMs:activeClock.elapsed});
  const key=`${LAB_KIND||'v06'}:${levels[index].id}`;
  try{localStorage.setItem(STARS_KEY,JSON.stringify(PerformanceRules.bestRecord(localStorage.getItem(STARS_KEY),key,stars)))}catch{}
  const result=$('resultStars');result.hidden=false;result.setAttribute('aria-label',`Performans: ${stars} / 3 yıldız`);
  result.replaceChildren(...[1,2,3].map(n=>{const span=document.createElement('span');span.textContent=n<=stars?'★':'☆';span.style.setProperty('--delay',`${(n-1)*100}ms`);span.setAttribute('aria-hidden','true');return span}));
}
document.addEventListener('visibilitychange',syncClock);
window.addEventListener('pagehide',()=>{pageSuspended=true;syncClock()});
window.addEventListener('pageshow',()=>{pageSuspended=false;syncClock()});
