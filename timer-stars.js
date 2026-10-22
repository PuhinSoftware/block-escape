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
  updatePotential();
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
  $('progressText').textContent=`${levels[index].blocks.length-blocks.length} / ${levels[index].blocks.length}`;
  $('levelProgress').setAttribute('aria-valuetext',`${levels[index].blocks.length-blocks.length} / ${levels[index].blocks.length} blok çıkarıldı`);
}
function updatePotential(){
  if(!levelsReady)return;
  const stars=PerformanceRules.potential(levels[index],{lives,elapsedMs:activeClock.elapsed,status:playStatus});
  const element=$('potentialStars');
  // Do not rewrite accessibility attributes on every timer tick.
  if(element.dataset.stars===String(stars))return;
  element.dataset.stars=String(stars);
  element.setAttribute('aria-label',stars?`Potansiyel ödül: en fazla ${stars} yıldız`:'Başarısız bölüm: ödül kazanılmadı');
  element.querySelectorAll('span').forEach((star,i)=>star.classList.toggle('lost',i>=stars));
}
let rewardTimers=[],rewardRun=0;
function cancelRewardPresentation(){
  rewardRun++;rewardTimers.forEach(clearTimeout);rewardTimers=[];
  stopStarSounds();
}
function showPerformance(){
  cancelRewardPresentation();
  const stars=PerformanceRules.score(levels[index],{completed:true,lives,elapsedMs:activeClock.elapsed});
  const key=`${LAB_KIND||'v06'}:${levels[index].id}`;
  try{localStorage.setItem(STARS_KEY,JSON.stringify(PerformanceRules.bestRecord(localStorage.getItem(STARS_KEY),key,stars)))}catch{}
  const result=$('resultStars');result.hidden=false;result.setAttribute('aria-label',`Performans: ${stars} / 3 yıldız`);
  const slots=[1,2,3].map(()=>{const span=document.createElement('span');span.textContent='☆';span.setAttribute('aria-hidden','true');return span});
  result.replaceChildren(...slots);
  const run=rewardRun;
  const reveal=n=>{
    if(run!==rewardRun||playStatus!=='won'||$('overlay').classList.contains('hidden'))return;
    slots[n-1].textContent='★';slots[n-1].classList.add('awarded');
    if(!document.hidden)playStarSound(n);
  };
  // Each cue is tied to the actual reveal, never to progression milestones.
  for(let n=1;n<=stars;n++)rewardTimers.push(setTimeout(()=>reveal(n),(n-1)*260));
}
document.addEventListener('visibilitychange',()=>{syncClock();if(document.hidden)stopStarSounds()});
window.addEventListener('pagehide',()=>{pageSuspended=true;syncClock()});
window.addEventListener('pageshow',()=>{pageSuspended=false;syncClock()});
