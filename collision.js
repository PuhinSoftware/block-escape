'use strict';
// Lightweight presentation only; collision coordinates come from Rules.traceMove.
function prepareCollisionAudio(){GameAudio.unlock()}
function updateLives(lost=-1){
  $('lives').setAttribute('aria-label',`Kalan can: ${lives} / 3`);
  $('lives').querySelectorAll('.heart').forEach((heart,i)=>{
    heart.classList.toggle('empty',i>=lives);
    heart.classList.toggle('heart-loss',i===lost&&!reducedMotion());
  });
}
async function collisionStage(element,frames,duration){
  if(reducedMotion()||!element.animate)return;
  let animation,timer;
  const preference=matchMedia('(prefers-reduced-motion: reduce)');
  const stop=()=>animation?.cancel();
  try{
    animation=element.animate(frames,{duration,easing:'ease-in-out',fill:'forwards'});
    if(preference.addEventListener)preference.addEventListener('change',stop);else preference.addListener(stop);
    await Promise.race([animation.finished,new Promise(resolve=>{timer=setTimeout(resolve,duration+120)})]);
  }catch{}finally{
    clearTimeout(timer);animation?.cancel();
    if(preference.removeEventListener)preference.removeEventListener('change',stop);else preference.removeListener(stop);
  }
}
async function animateCollision(element,block,contact,impact){
  if(reducedMotion()||!element.animate){impact();return}
  const from=element.getBoundingClientRect();
  const obstacle=board.children[contact.y*S+contact.x].getBoundingClientRect();
  const [dx,dy]=vectors[block.dir];
  const travel=Math.max(0,dx>0?obstacle.left-from.right:dx<0?from.left-obstacle.right:dy>0?obstacle.top-from.bottom:from.top-obstacle.bottom);
  const x=dx*travel,y=dy*travel,at=`translate(${x}px,${y}px)`;
  const point={x:dx>0?obstacle.left:dx<0?obstacle.right:from.x+from.width/2,y:dy>0?obstacle.top:dy<0?obstacle.bottom:from.y+from.height/2};
  let spark;
  element.classList.add('colliding');element.parentElement.classList.add('exiting-cell');
  try{
    await collisionStage(element,[{transform:'translate(0,0)'},{transform:at}],180);
    element.style.transform=at;
    impact();
    if(!reducedMotion()){
      try{navigator.vibrate?.(15)}catch{}
      const bounds=board.getBoundingClientRect();
      spark=document.createElement('i');spark.className='collision-spark';spark.setAttribute('aria-hidden','true');
      spark.style.left=`${point.x-bounds.left-board.clientLeft}px`;spark.style.top=`${point.y-bounds.top-board.clientTop}px`;board.append(spark);
    }
    await collisionStage(element,[{transform:at},{transform:`translate(${x-dx*3-dy*2}px,${y-dy*3-dx*2}px)`},{transform:at}],100);
    await collisionStage(element,[{transform:at},{transform:'translate(0,0)'}],160);
  }finally{
    spark?.remove();element.style.removeProperty('transform');element.classList.remove('colliding');element.parentElement?.classList.remove('exiting-cell');
  }
}
