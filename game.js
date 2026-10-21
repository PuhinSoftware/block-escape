'use strict';
// Board coordinates use x (column), y (row). A tap removes a block only if the
// straight path in its arrow direction is clear of other blocks and walls.
const S=6, arrows={U:'↑',D:'↓',L:'←',R:'→'}, vectors={U:[0,-1],D:[0,1],L:[-1,0],R:[1,0]};
// Authored puzzle states; each is checked for solvability on initialization.
const raw=[
['1,1,R','3,1,D','3,3,R'],
['1,1,R','2,1,D','2,3,L','4,4,U'],
['1,2,R','3,2,R','3,4,R','1,4,R'],
['1,1,D','1,3,R','3,3,U','3,1,R','4,4,U'],
['1,1,R','2,1,D','2,3,R','4,3,U','4,1,R'],
['1,2,R','2,2,R','2,4,R','1,4,R','4,1,R','4,4,R'],
['1,1,D','1,3,R','3,3,U','3,1,R','4,2,D','4,4,L'],
['1,1,R','3,1,R','3,3,R','1,3,R','4,1,R','4,4,R','2,4,R'],
['1,1,R','1,4,R','4,4,R','4,1,R','2,1,R','2,3,R','3,3,R'],
['1,1,R','2,1,R','2,3,R','1,3,R','4,1,R','4,4,R','3,4,R','3,2,R']
];
const levels=raw.map((a,i)=>({walls: i>=5?[[0,0],[5,5]]:[],blocks:a.map((s,j)=>{let [x,y,dir]=s.split(',');return{id:j,x:+x,y:+y,dir}})}));
const $=id=>document.getElementById(id),board=$('board');let index=0,blocks=[],history=[],moves=0,sound=true,toastTimer;
let unlocked=1;try{unlocked=Math.max(1,Math.min(levels.length,Number(localStorage.getItem('blockEscapeUnlocked'))||1))}catch{}
function key(x,y){return `${x},${y}`}
function clearPath(block,items){let [dx,dy]=vectors[block.dir],x=block.x+dx,y=block.y+dy;const walls=new Set(levels[index].walls.map(p=>key(...p)));while(x>=0&&y>=0&&x<S&&y<S){if(walls.has(key(x,y))||items.some(b=>b.x===x&&b.y===y))return false;x+=dx;y+=dy}return true}
function solvable(items){if(!items.length)return true;return items.some(b=>clearPath(b,items)&&solvable(items.filter(t=>t.id!==b.id)))}
function load(i){index=i;blocks=levels[i].blocks.map(b=>({...b}));history=[];moves=0;hideModal();render();message('');}
function render(){board.style.setProperty('--size',S);const wallSet=new Set(levels[index].walls.map(p=>key(...p)));const map=new Map(blocks.map(b=>[key(b.x,b.y),b]));const frag=document.createDocumentFragment();for(let y=0;y<S;y++)for(let x=0;x<S;x++){const cell=document.createElement('div');cell.className='cell'+(wallSet.has(key(x,y))?' wall':'');const b=map.get(key(x,y));if(b){const btn=document.createElement('button');btn.className='block';btn.dataset.dir=b.dir;btn.textContent=arrows[b.dir];btn.setAttribute('aria-label',`Satır ${y+1}, sütun ${x+1}, ${b.dir} yönü`);btn.addEventListener('click',()=>tap(b.id,btn));cell.append(btn)}frag.append(cell)}board.replaceChildren(frag);$('levelLabel').textContent=`${String(index+1).padStart(2,'0')} / ${levels.length}`;$('remaining').textContent=blocks.length;$('moves').textContent=moves}
function message(t){$('toast').textContent=t;clearTimeout(toastTimer);if(t)toastTimer=setTimeout(()=>$('toast').textContent='',1800)}
function beep(freq=500){if(!sound)return;try{const C=window.AudioContext||window.webkitAudioContext;if(!C)return;const c=new C(),o=c.createOscillator(),g=c.createGain();o.frequency.value=freq;o.type='sine';g.gain.value=.045;o.connect(g);g.connect(c.destination);o.start();g.gain.exponentialRampToValueAtTime(.001,c.currentTime+.09);o.stop(c.currentTime+.1);o.onended=()=>c.close()}catch{}}
function tap(id,el){const b=blocks.find(x=>x.id===id);if(!b)return;if(!clearPath(b,blocks)){el.classList.add('blocked');setTimeout(()=>el.classList.remove('blocked'),250);message('Yol kapalı! Önce diğer bloğu çıkar.');beep(180);return}history.push(blocks.map(b=>({...b})));blocks=blocks.filter(x=>x.id!==id);moves++;beep(640);render();if(!blocks.length){if(index+1>=unlocked){unlocked=Math.min(levels.length,index+2);try{localStorage.setItem('blockEscapeUnlocked',unlocked)}catch{}}setTimeout(()=>showWin(),260)}}
function undo(){if(!history.length){message('Geri alınacak hamle yok.');return}blocks=history.pop();moves=Math.max(0,moves-1);render()}
function showWin(){showModal('Bölüm tamamlandı! 🎉',`${moves} hamlede bütün blokları temizledin.`,false);$('next').textContent=index===levels.length-1?'Başa dön ↻':'Sonraki bölüm →';$('next').onclick=()=>load(index===levels.length-1?0:index+1)}
function showModal(title,description,picker){$('modalTitle').textContent=title;$('modalText').textContent=description;$('levelPicker').classList.toggle('hidden',!picker);$('next').classList.toggle('hidden',picker);if(picker){$('levelPicker').replaceChildren();levels.forEach((_,i)=>{const b=document.createElement('button');b.textContent=i+1;b.disabled=i>=unlocked;b.onclick=()=>load(i);$('levelPicker').append(b)})}$('overlay').classList.remove('hidden')}
function hideModal(){$('overlay').classList.add('hidden')}
$('undo').onclick=undo;$('reset').onclick=()=>load(index);$('levelsBtn').onclick=()=>showModal('Bölüm seç',`Açık bölüm: ${unlocked}/${levels.length}`,true);$('close').onclick=hideModal;$('sound').onclick=()=>{sound=!sound;$('sound').textContent=sound?'♪':'♪̸';$('sound').setAttribute('aria-label',sound?'Sesi kapat':'Sesi aç')};
for(let i=0;i<levels.length;i++)if(!solvable(levels[i].blocks)){console.error(`Level ${i+1} unsolvable`)}
load(0);
