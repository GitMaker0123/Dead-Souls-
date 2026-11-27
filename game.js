(()=>{'use strict';
const $=id=>document.getElementById(id),canvas=$('screen'),ctx=canvas.getContext('2d'),W=960,H=576;
const SFX=(name)=>window.DeadAudio?.play(name);
const keys=new Set();const stick={x:0,y:0,pointer:null},touchAttack={held:false};
const SAVEKEY='dead-souls-mce1809-beta02-profiles';let profiles=loadProfiles(),slot=null,player=null,enemies=[],particles=[],state='home',wave=1,kills=0,clock=0,last=0,shake=0,attackHeld=false,notice='',projectiles=[],decor=[],bossTitleTime=0,arenaTime=0;
const BOSSES=[
{name:'Alquimista Maluco',kind:'alchemist',hp:430,speed:63,dmg:14,color:'#9ada65'},
{name:'Açougueiro',kind:'butcher',hp:580,speed:61,dmg:26,color:'#c77b7c'},
{name:'Ceifador',kind:'reaper',hp:455,speed:88,dmg:19,color:'#ad97d5'},
{name:'Cavaleiro Sem Nome',kind:'nameless',hp:520,speed:85,dmg:21,color:'#c7c5b0'},
{name:'Rei de Lugar Nenhum',kind:'king',hp:670,speed:53,dmg:25,color:'#dcb86c'},
{name:'Cavaleiro da Guarda Real',kind:'guard',hp:610,speed:70,dmg:20,color:'#78a5d5'},
{name:'Executor do Palácio',kind:'executioner',hp:760,speed:47,dmg:33,color:'#bb7784'},
{name:'Cavaleiro Corrompido',kind:'corrupted',hp:580,speed:89,dmg:22,color:'#b18dce'},
{name:'Andarilho do Abismo, Artorias',kind:'abyss',hp:680,speed:112,dmg:25,color:'#7c91d4'}
];
let previousBoss=-1;
// Beta 0.5: salas encadeadas, fogueiras físicas, frascos e controle.
let checkpointRoom=1, roomCleared=false, bonfire=null, doorOpen=false, snow=[], gamepadDirection={x:0,y:0}, lastPadButtons=[], padAttackHeld=false, healingAnim=0, roomToast=0;
const HEALS_MAX=3, HEAL_AMOUNT=38;
function roomHasBonfire(n){return n===1||n%5===4||n%5===1}
function roomName(){return 'PÁTIO EXTERNO · SALA '+wave+(wave%5===0?' · CHEFE':'')}
function setBonfire(){bonfire=roomHasBonfire(wave)?{x:174,y:296}:null}
function nearFire(){return bonfire&&player&&Math.hypot(player.x-bonfire.x,player.y-bonfire.y)<85}
function restAtFire(){if(state!=='playing'||!nearFire()||enemies.length>0)return;player.hp=player.maxHp;player.stamina=player.maxStamina;player.flasks=HEALS_MAX;checkpointRoom=wave;saveCheckpoint();SFX('checkpoint');$('restHint').textContent='Vida, vigor e 3 frascos restaurados. Progresso salvo na Sala '+wave+'.';$('restDesc').textContent='O fogo antigo protege a sua jornada. Sala '+wave+'.';refreshHUD();setPage('rest')}
function interact(){if(state!=='playing')return;if(nearFire()){if(enemies.length===0)restAtFire();else{notice='Elimine os inimigos antes de descansar';roomToast=2.5}}else if(doorOpen&&player.y<105&&Math.abs(player.x-W/2)<115){nextRoom()}else{notice='Aproxime-se de uma fogueira ou passagem';roomToast=2}}
function heal(){if(state!=='playing'||player.flasks<=0||player.hp>=player.maxHp||player.dashTime>0||player.healCD>0)return;player.flasks--;player.hp=Math.min(player.maxHp,player.hp+HEAL_AMOUNT);player.healCD=1;healingAnim=.45;player.invuln=Math.max(player.invuln,.15);SFX('checkpoint');spark(player.x,player.y,'#dca36b',18);refreshHUD()}
function nextRoom(){if(!doorOpen||state!=='playing')return;wave++;saveCheckpoint(false);enterRoom();}
let gamepadActive=false,padMenuRepeat=0,padLastAxis=0;
function menuFocusables(){const page=document.querySelector('.menuPage:not([hidden])');return page?[...page.querySelectorAll('button:not(:disabled),select,input[type="range"]')].filter(el=>el.getClientRects().length):[]}
function stepMenu(n){const els=menuFocusables();if(!els.length)return;const idx=els.indexOf(document.activeElement);const next=els[(idx+n+els.length)%els.length];els.forEach(e=>e.classList.remove('pad-selected'));next.classList.add('pad-selected');next.focus({preventScroll:true})}
function navigateBack(){if(state==='settings'){setPage(settingsFrom||'home')}else if(state==='saves'){menuHome()}else if(state==='paused'||state==='rest'){setPage('playing')}else if(state==='dead'){menuHome()}else if(state==='exit'){menuHome()}else if(state==='intro'){setPage('saves')}}
let settingsFrom='home';
function pollPad(dt=0){const pads=navigator.getGamepads?.()||[];const gp=[...pads].find(Boolean);gamepadDirection={x:0,y:0};
if(!gp){if(gamepadActive){gamepadActive=false;$('touchControls').hidden=state!=='playing'}lastPadButtons=[];padAttackHeld=false;return}
if(!gamepadActive){gamepadActive=true;$('touchControls').hidden=true}
let x=gp.axes?.[0]||0,y=gp.axes?.[1]||0;if(Math.abs(x)<.18)x=0;if(Math.abs(y)<.18)y=0;gamepadDirection={x,y};
const pressed=i=>!!gp.buttons?.[i]?.pressed;const edge=(i,fn)=>{if(pressed(i)&&!lastPadButtons[i])fn()};
if(state==='playing'){edge(0,interact);edge(1,dash);edge(2,heal);edge(9,pause);edge(7,strongAttack);padAttackHeld=pressed(5)}
else{padAttackHeld=false;const up=pressed(12)||y<-.6,down=pressed(13)||y>.6;const nav=up?-1:down?1:0;padMenuRepeat-=dt;if(nav&&(!padLastAxis||padMenuRepeat<=0)){stepMenu(nav);padMenuRepeat=.22}if(!nav)padMenuRepeat=0;padLastAxis=nav;
edge(0,()=>{const el=document.activeElement;const targets=menuFocusables();if(targets.includes(el))el.click();else targets[0]?.click()});edge(1,navigateBack);edge(9,()=>{if(state==='paused')setPage('playing')});
if(pressed(14)||pressed(15)){const el=document.activeElement;if(el?.tagName==='INPUT'&&el.type==='range')el.value=Math.max(0,Math.min(100,Number(el.value)+(pressed(15)?5:-5)))}
}
lastPadButtons=gp.buttons.map(b=>b.pressed);
}
function generateSnow(){snow=Array.from({length:48},()=>({x:Math.random()*W,y:Math.random()*H,r:rand(.8,2.8),v:rand(13,38),seed:rand(0,100)}))}
function updateSnow(dt){for(const q of snow){q.y+=q.v*dt;q.x+=(24+Math.sin(arenaTime*.7+q.seed)*13)*dt;if(q.y>H+10){q.y=-10;q.x=rand(-50,W)}if(q.x>W+10)q.x=-10}}

const rand=(a,b)=>a+Math.random()*(b-a),clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const groundLayer=document.createElement('canvas');groundLayer.width=W;groundLayer.height=H;
{const c=groundLayer.getContext('2d');const ground=c.createLinearGradient(0,0,W,H);ground.addColorStop(0,'#202d3a');ground.addColorStop(1,'#101a29');c.fillStyle=ground;c.fillRect(0,0,W,H);
for(let y=0;y<H;y+=48)for(let x=0;x<W;x+=64){const off=(Math.floor(y/48)%2)*32;c.fillStyle=((Math.floor(x/64)+Math.floor(y/48))%3===0)?'#253646':'#202d3c';c.fillRect(x+off+2,y+2,60,44);c.strokeStyle='#35485a';c.lineWidth=1;c.strokeRect(x+off+2.5,y+2.5,60,44)}
for(let i=0;i<30;i++){const x=45+((i*181+37)%870),y=35+((i*97+19)%505);c.strokeStyle='#1019239c';c.lineWidth=2;c.beginPath();c.moveTo(x-12,y+7);c.lineTo(x,y);c.lineTo(x+9,y+12);c.stroke();c.fillStyle='#3e4650';c.fillRect(x+4,y+8,2,2);if(i%3===0){c.fillStyle='#b7cad755';c.fillRect(x-12,y+13,26,5)}}}
function loadProfiles(){try{let x=JSON.parse(localStorage.getItem(SAVEKEY)||'[]');return Array.isArray(x)?x.filter(v=>v&&typeof v.name==='string').slice(0,3):[]}catch{return []}}
let database=null;let dbReady=false;let savePending=false;
function openDatabase(){return new Promise(resolve=>{if(!('indexedDB' in window)){resolve(null);return}try{const req=indexedDB.open('DeadSouls_MCE1809',1);req.onupgradeneeded=()=>{const db=req.result;for(const name of ['perfis','partidas','configuracoes','estatisticas'])if(!db.objectStoreNames.contains(name))db.createObjectStore(name)};req.onsuccess=()=>resolve(req.result);req.onerror=()=>resolve(null)}catch{resolve(null)}})}
function storeProfiles(){if(!database)return;try{const tx=database.transaction('perfis','readwrite');tx.objectStore('perfis').put(profiles,'slots');tx.onerror=()=>console.warn('Não foi possível persistir perfis no IndexedDB')}catch(e){console.warn(e)}}
function persist(){if(database){storeProfiles();return true}try{localStorage.setItem(SAVEKEY,JSON.stringify(profiles));return true}catch{console.warn('Armazenamento local cheio; salvamento pendente no IndexedDB');savePending=true;return false}}
async function initDatabase(){database=await openDatabase();if(database){await new Promise(resolve=>{try{const tx=database.transaction('perfis','readonly'),req=tx.objectStore('perfis').get('slots');req.onsuccess=()=>{if(Array.isArray(req.result)){profiles=req.result.filter(v=>v&&typeof v.name==='string').slice(0,3)}else{storeProfiles()}resolve()};req.onerror=()=>resolve()}catch{resolve()}});if(savePending){storeProfiles();savePending=false}}dbReady=true;profileList();setPage('home')}

function fmt(s){s=Math.max(0,Math.floor(s));return String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0')}
function setPage(page){state=page;menuDrawn=false;const map={home:'menuHome',saves:'menuSaves',rest:'menuRest',dead:'menuDeath',paused:'menuPause',exit:'menuExit',settings:'menuSettings',intro:'menuIntro'};for(const el of document.querySelectorAll('.menuPage'))el.hidden=el.id!==map[page];$('message').hidden=page==='playing';$('statusText').textContent=({home:'Menu inicial',saves:'Escolher save',rest:'Ponto de descanso',playing:'Em combate',dead:'Você Não Resistiu',paused:'Pausado',exit:'Menu de saída'})[page]||page;keys.clear();touchAttack.held=false;releaseStick();$('touchControls').hidden=page!=='playing'||gamepadActive;$('pauseBtn').hidden=page!=='playing';requestAnimationFrame(()=>{const first=document.querySelector('.menuPage:not([hidden]) button:not(:disabled)');if(first)first.focus({preventScroll:true})})}
let lastHudAt=0;function refreshHUD(force=false){if(!player)return;const now=performance.now();if(!force&&now-lastHudAt<180)return;lastHudAt=now;$('lifeBar').style.width=clamp(player.hp/player.maxHp*100,0,100)+'%';$('energyBar').style.width=clamp(player.stamina/player.maxStamina*100,0,100)+'%';$('lifeText').textContent=`${Math.ceil(player.hp)} / ${player.maxHp}`;$('energyText').textContent=`${Math.floor(player.stamina)} / ${player.maxStamina}`;$('wave').textContent=wave;$('flasksText').textContent=(player.flasks??3)+' / 3';$('kills').textContent=kills;$('timer').textContent=fmt(clock);$('activeProfile').textContent=profiles[slot]?.name||'Nenhum';}
function makePlayer(){return{x:W/2,y:H/2,r:18,hp:100,maxHp:100,flasks:HEALS_MAX,healCD:0,gender:profiles[slot]?.gender||'masculino',stamina:120,maxStamina:120,dx:0,dy:1,attackCD:0,attackTimer:0,heavyWindup:0,heavyStrike:0,dashCD:0,dashTime:0,invuln:0,dashX:0,dashY:0,flash:0}}
function menuHome(){slot=null;setPage('home');refreshHUD()}
function selectProfile(i){slot=i;const d=profiles[i];if(!d)return;wave=d.checkpointRoom||d.wave||1;checkpointRoom=wave;kills=d.kills||0;clock=d.clock||0;player=makePlayer();enemies=[];particles=[];projectiles=[];
 if(wave===1&&!sessionStorage.getItem('dead-souls-intro-viewed')){introPage=0;renderIntro();setPage('intro')}else enterRoom();}
function profileList(){$('saveList').replaceChildren();profiles.forEach((p,i)=>{let el=document.createElement('div');el.className='saveSlot';let open=document.createElement('button');open.className='slotOpen';open.textContent=`${p.name} · Sala ${p.checkpointRoom||p.wave||1} · ${p.gender==='feminino'?'Ágil':'Guardião'}`;open.onclick=()=>selectProfile(i);let del=document.createElement('button');del.className='slotDelete';del.textContent='Excluir';del.onclick=()=>{if(confirm(`Excluir o save de ${p.name}?`)){profiles.splice(i,1);persist();profileList()}};el.append(open,del);$('saveList').append(el)});$('createSave').disabled=profiles.length>=3}
function saveCheckpoint(atFire=true){if(slot===null||!profiles[slot])return false;profiles[slot].wave=atFire?wave:checkpointRoom;profiles[slot].checkpointRoom=checkpointRoom;profiles[slot].kills=kills;profiles[slot].clock=clock;profiles[slot].updated=new Date().toISOString();return persist()}
function prepareRest(){// Compatibilidade com saves antigos; o descanso agora é interação física.
 enemies=[];particles=[];projectiles=[];bossTitleTime=0;roomCleared=true;doorOpen=true;setBonfire();player.x=bonfire?bonfire.x+45:W/2;player.y=bonfire?bonfire.y:H*.7;player.stamina=player.maxStamina;player.hp=player.maxHp;player.flasks=HEALS_MAX;checkpointRoom=wave;saveCheckpoint();refreshHUD();setPage('playing');}
function pickBoss(){let i=Math.floor(Math.random()*BOSSES.length);if(i===previousBoss)i=(i+1+Math.floor(Math.random()*(BOSSES.length-1)))%BOSSES.length;previousBoss=i;const base=BOSSES[i],scale=1+Math.max(0,Math.floor(wave/5)-1)*.21;return {...base,name:base.name,type:'boss',x:W/2,y:118,r:28,hp:Math.round(base.hp*scale),maxHp:Math.round(base.hp*scale),speed:base.speed*(1+Math.min(.26,(wave/5-1)*.025)),attackCD:1.25,flash:0,windup:0,hit:false,phase:0,telegraph:null,pattern:0,strafe:1,comboLeft:0,spin:.3};}
function enterRoom(){player.x=W/2;player.y=H*.75;player.invuln=.85;player.dashCD=0;enemies=[];particles=[];projectiles=[];bossTitleTime=0;roomCleared=false;doorOpen=false;arenaTime=0;setBonfire();
 if(wave===1){roomCleared=true;doorOpen=true;notice='Aproxime-se da fogueira e toque em INTERAGIR';roomToast=5;}
 else if(wave%5===0){const boss=pickBoss();enemies.push(boss);bossTitleTime=3.2;$('bossBanner').textContent=boss.name;$('bossBanner').hidden=false;SFX('boss');}
 else {for(let i=0;i<Math.min(2+Math.floor(wave/2),8);i++)spawnEnemy();$('bossBanner').hidden=true;}
 if(wave!==1)$('bossBanner').hidden=wave%5!==0;
 refreshHUD();setPage('playing');}
function enterWave(){enterRoom()}
function spawnEnemy(){const r=Math.random(),type=r<.20?'brute':r<.43?'runner':r<.67?'archer':r<.83?'spearman':'wanderer';let x,y,n=0;do{const side=Math.floor(rand(0,4));x=side===0?67:side===1?W-67:rand(80,W-80);y=side===2?75:side===3?H-75:rand(75,H-75)}while((Math.hypot(x-player.x,y-player.y)<205||(bonfire&&Math.hypot(x-bonfire.x,y-bonfire.y)<110)||Math.abs(x-W/2)<110&&y<150)&&n++<60);
 const base={brute:[91,39,22,22],runner:[35,76,14,9],archer:[41,52,16,11],spearman:[62,58,18,15],wanderer:[52,53,17,13]}[type],scale=1+Math.min(1.1,(wave-1)*.045);
 enemies.push({x,y,r:base[2],type,speed:base[1],hp:Math.round(base[0]*scale),maxHp:Math.round(base[0]*scale),dmg:base[3],attackCD:rand(.6,1.6),flash:0,windup:0,hit:false,strafe:Math.random()<.5?-1:1});}
function fireProjectile(e,angle,speed=235,damage=12,color='#d89bf0',size=8){if(projectiles.length>180)return;projectiles.push({x:e.x,y:e.y,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,r:size,dmg:damage,life:4,color});}
function applyPlayerDamage(dmg,x,y){if(state!=='playing'||player.invuln>0)return;player.hp=Math.max(0,player.hp-dmg);player.invuln=.65;player.flash=.22;shake=.15;SFX('hit');spark(player.x,player.y,'#ff899a',15);if(player.hp<=0)die()}
function updateBoss(e,dt){
 e.attackCD=Math.max(0,e.attackCD-dt);e.flash=Math.max(0,e.flash-dt);const dx=player.x-e.x,dy=player.y-e.y,dist=Math.max(1,Math.hypot(dx,dy)),aim=Math.atan2(dy,dx);
 if(e.telegraph){const t=e.telegraph;t.t-=dt;if(t.t<=0){e.telegraph=null;e.attackCD=(e.kind==='abyss'||e.kind==='reaper')?.68:1.18;SFX('enemy');
  if(t.type==='burst'||t.type==='spiral'){let count=t.count||12;for(let n=0;n<count;n++)fireProjectile(e,2*Math.PI*n/count+(t.offset||0),t.speed||190,t.damage,e.color,t.type==='spiral'?7:9);if(t.type==='spiral')e.spin+=.55;}
  else if(t.type==='fan'||t.type==='wideFan'){const n=t.type==='wideFan'?7:5,step=t.type==='wideFan'?.24:.20;for(let i=0;i<n;i++)fireProjectile(e,t.angle+(i-(n-1)/2)*step,t.speed||250,t.damage,e.color,8);}
  else if(t.type==='cross'){for(let i=0;i<8;i++)fireProjectile(e,t.angle+i*Math.PI/4,235,t.damage,e.color,8);}
  else if(t.type==='dash'||t.type==='doubleDash'){const moved=t.range;const oldX=e.x,oldY=e.y;e.x=clamp(e.x+Math.cos(t.angle)*moved,52,W-52);e.y=clamp(e.y+Math.sin(t.angle)*moved,52,H-52);spark(e.x,e.y,e.color,24);let ux=e.x-oldX,uy=e.y-oldY,den=ux*ux+uy*uy||1,proj=clamp(((player.x-oldX)*ux+(player.y-oldY)*uy)/den,0,1);const near=Math.hypot(player.x-(oldX+proj*ux),player.y-(oldY+proj*uy));if(near<player.r+e.r+8)applyPlayerDamage(t.damage,e.x,e.y);if(t.type==='doubleDash'&&e.comboLeft>0){e.comboLeft--;e.telegraph={type:'dash',angle:Math.atan2(player.y-e.y,player.x-e.x),range:170,damage:Math.round(e.dmg*.75),t:.38,initial:.38};}}
  else if(t.type==='slam'){spark(e.x,e.y,e.color,30);shake=.18;if(Math.hypot(player.x-e.x,player.y-e.y)<t.radius)applyPlayerDamage(t.damage,e.x,e.y);}
  else if(t.type==='line'){for(let j=0;j<4;j++)fireProjectile(e,t.angle+(j-1.5)*.095,315,t.damage,e.color,8);}
 }return}
 const rage=e.hp/e.maxHp<.43,pace=rage?1.22:1;const ranged=['alchemist','king'].includes(e.kind),ideal=ranged?190:e.kind==='executioner'?78:72;
 if(dist>ideal+14){e.x=clamp(e.x+dx/dist*e.speed*pace*dt,50,W-50);e.y=clamp(e.y+dy/dist*e.speed*pace*dt,50,H-50)}else if(dist<ideal-35){e.x=clamp(e.x-dx/dist*e.speed*.5*dt,50,W-50);e.y=clamp(e.y-dy/dist*e.speed*.5*dt,50,H-50)}
 if(e.attackCD<=0){e.pattern++;let t;const n=e.pattern;
 switch(e.kind){
  case'alchemist':t=n%3===0?{type:'spiral',count:15,speed:178,damage:12,offset:e.spin}:{type:'wideFan',angle:aim,damage:13,speed:222};break;
  case'butcher':t=n%3===0?{type:'dash',angle:aim,range:155,damage:e.dmg}:{type:'slam',radius:112,damage:e.dmg+7};break;
  case'reaper':t=n%3===0?{type:'burst',count:12,speed:205,damage:13,offset:e.spin}:{type:'dash',angle:aim,range:225,damage:e.dmg};break;
  case'nameless':t=n%3===0?{type:'fan',angle:aim,speed:260,damage:17}:{type:'doubleDash',angle:aim,range:182,damage:e.dmg};e.comboLeft=t.type==='doubleDash'?1:0;break;
  case'king':t=n%3===0?{type:'cross',angle:e.spin,damage:15}:{type:'burst',count:16,speed:188,damage:12,offset:e.spin};e.spin+=.23;break;
  case'guard':t=n%3===0?{type:'slam',radius:140,damage:e.dmg+3}:{type:'line',angle:aim,damage:19};break;
  case'executioner':t=n%3===0?{type:'burst',count:8,speed:175,damage:18}:{type:'slam',radius:160,damage:e.dmg+10};break;
  case'corrupted':t=n%3===0?{type:'wideFan',angle:aim,speed:280,damage:17}:{type:'dash',angle:aim,range:220,damage:e.dmg};break;
  case'abyss':t=n%4===0?{type:'slam',radius:125,damage:e.dmg+8}:n%3===0?{type:'fan',angle:aim,speed:305,damage:18}:{type:'doubleDash',angle:aim,range:240,damage:e.dmg};e.comboLeft=t.type==='doubleDash'?(rage?2:1):0;break;
  default:t={type:'dash',angle:aim,range:160,damage:e.dmg};
 }
 const base=e.kind==='abyss'?.58:['reaper','corrupted'].includes(e.kind)?.65:['king','alchemist'].includes(e.kind)?.88:.95;const delay=rage?base*.85:base;e.telegraph={...t,t:delay,initial:delay};e.attackCD=delay+1.1;
 }
}
function updateEnemy(e,dt){if(e.type==='boss'){updateBoss(e,dt);return}e.attackCD=Math.max(0,e.attackCD-dt);e.flash=Math.max(0,e.flash-dt);const dx=player.x-e.x,dy=player.y-e.y,dist=Math.hypot(dx,dy)||1;
 if(e.windup>0){e.windup-=dt;if(e.windup<=0){e.attackCD=e.type==='runner'?1.2:e.type==='archer'?2:e.type==='brute'?1.55:1.3;if(e.type==='archer')fireProjectile(e,Math.atan2(dy,dx),235,e.dmg,'#e8af70',7);else if(dist<e.r+player.r+(e.type==='spearman'?65:27))applyPlayerDamage(e.dmg,e.x,e.y);}return}
 const desired=e.type==='archer'?210:e.type==='spearman'?68: e.r+player.r+21;
 if(dist>desired+10){e.x=clamp(e.x+dx/dist*e.speed*dt,42,W-42);e.y=clamp(e.y+dy/dist*e.speed*dt,42,H-42)}else if(e.type==='archer'&&dist<desired-45){e.x=clamp(e.x-dx/dist*e.speed*.7*dt,42,W-42);e.y=clamp(e.y-dy/dist*e.speed*.7*dt,42,H-42)}
 else if(e.attackCD<=0){e.windup=e.type==='runner'?.34:e.type==='brute'?.7:e.type==='archer'?.68:e.type==='spearman'?.48:.46;}
}
function spark(x,y,col,num=8){for(let i=0;i<num;i++){const a=rand(0,Math.PI*2),v=rand(55,175),life=rand(.18,.42);particles.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,life,maxLife:life,col})}}
function strike(heavy=false){
 if(state!=='playing'||!player)return;
 SFX('attack');player.attackTimer=heavy?.30:.17;
 let got=false;
 for(const e of enemies){
  const dx=e.x-player.x,dy=e.y-player.y,dist=Math.hypot(dx,dy);
  if(dist<(heavy?135:105)&&dx*player.dx+dy*player.dy>dist*(heavy?-.03:.12)){
   const base=e.type==='boss'?(heavy?63:32):(heavy?75:38);
   e.hp-=base*(player.gender==='feminino'?.9:1);
   e.flash=heavy?.21:.13;
   e.x=clamp(e.x+player.dx*(heavy?34:19),45,W-45);
   e.y=clamp(e.y+player.dy*(heavy?34:19),45,H-45);
   spark(e.x,e.y,heavy?'#f3be78':'#b6fae2',heavy?18:8);
   got=true;
  }
 }
 if(got)shake=heavy?.12:.055;
}
function attack(){if(state!=='playing'||player.attackCD>0||player.dashTime>0||player.heavyWindup>0)return;player.attackCD=.38;strike(false)}
function strongAttack(){
 if(state!=='playing'||!player||player.attackCD>0||player.dashTime>0||player.heavyWindup>0)return;
 // R2: golpe pesado com 0,46 s de preparação e intervalo de 1,25 s.
 player.attackCD=1.25;
 player.heavyWindup=.46;
 player.heavyStrike=.46;
 SFX('attack');
 spark(player.x+player.dx*18,player.y+player.dy*18,'#e8b87b',5);
}
function direction(){let x=Number(keys.has('d')||keys.has('arrowright'))-Number(keys.has('a')||keys.has('arrowleft'));let y=Number(keys.has('s')||keys.has('arrowdown'))-Number(keys.has('w')||keys.has('arrowup'));if(Math.hypot(x,y)>0){let l=Math.hypot(x,y);return{x:x/l,y:y/l}}return Math.hypot(gamepadDirection.x,gamepadDirection.y)>.18?gamepadDirection:{x:stick.x,y:stick.y}}
function dash(){if(state!=='playing'||player.dashCD>0||player.stamina<25||player.heavyWindup>0)return;SFX('dash');let d=direction(),m=Math.hypot(d.x,d.y);if(m<.15){d={x:player.dx,y:player.dy};m=1}player.dashX=d.x/m;player.dashY=d.y/m;player.dx=player.dashX;player.dy=player.dashY;player.stamina-=25;player.dashCD=.55;player.dashTime=.22;player.invuln=.30;spark(player.x,player.y,'#70e5f6',14)}
function die(){SFX('death');player.hp=0;refreshHUD();$('deathInfo').textContent=`Você caiu na sala ${wave}. O último descanso foi na sala ${checkpointRoom}.`;setPage('dead')}
function update(dt){if(state!=='playing')return;clock+=dt;arenaTime+=dt;bossTitleTime=Math.max(0,bossTitleTime-dt);if(bossTitleTime<=0)$('bossBanner').hidden=true;const p=player;p.attackCD=Math.max(0,p.attackCD-dt);
 if(p.heavyWindup>0){p.heavyWindup=Math.max(0,p.heavyWindup-dt);if(p.heavyWindup===0)strike(true)}
 p.attackTimer=Math.max(0,p.attackTimer-dt);p.dashCD=Math.max(0,p.dashCD-dt);p.dashTime=Math.max(0,p.dashTime-dt);p.invuln=Math.max(0,p.invuln-dt);p.flash=Math.max(0,p.flash-dt);p.healCD=Math.max(0,p.healCD-dt);healingAnim=Math.max(0,healingAnim-dt);roomToast=Math.max(0,roomToast-dt);updateSnow(dt);p.stamina=Math.min(p.maxStamina,p.stamina+dt*23);
 let move=direction(),len=Math.hypot(move.x,move.y);if(len>.12&&p.dashTime<=0){p.dx=move.x/len;p.dy=move.y/len;}let vx=p.dashTime>0?p.dashX*510:move.x*(p.gender==='feminino'?268:245),vy=p.dashTime>0?p.dashY*510:move.y*(p.gender==='feminino'?268:245);p.x=clamp(p.x+vx*dt,44,W-44);p.y=clamp(p.y+vy*dt,44,H-44);if(doorOpen&&p.y<80&&Math.abs(p.x-W/2)<72){nextRoom();return}if(touchAttack.held||padAttackHeld||keys.has('j')||keys.has(' '))attack();
 for(const e of enemies){updateEnemy(e,dt);if(state!=='playing')break}
 if(state!=='playing')return;
 for(let i=projectiles.length-1;i>=0;i--){const b=projectiles[i];b.x+=b.vx*dt;b.y+=b.vy*dt;b.life-=dt;if(b.life<=0||b.x<26||b.y<24||b.x>W-26||b.y>H-24){projectiles.splice(i,1);continue}if(Math.hypot(b.x-p.x,b.y-p.y)<b.r+p.r){applyPlayerDamage(b.dmg,b.x,b.y);projectiles.splice(i,1);if(state!=='playing')return;}}
 for(let i=enemies.length-1;i>=0;i--)if(enemies[i].hp<=0){const e=enemies[i];spark(e.x,e.y,e.type==='boss'?'#d7a7ff':'#a2f4cb',e.type==='boss'?42:14);enemies.splice(i,1);kills++;p.stamina=Math.min(p.maxStamina,p.stamina+(e.type==='boss'?20:8))}
 if(enemies.length===0&&!roomCleared){SFX('win');roomCleared=true;doorOpen=true;notice='SALA LIMPA! A passagem ao norte está aberta.';roomToast=4;}
 for(let i=particles.length-1;i>=0;i--){const q=particles[i];q.x+=q.vx*dt;q.y+=q.vy*dt;q.life-=dt;if(q.life<=0)particles.splice(i,1)}shake=Math.max(0,shake-dt);refreshHUD();}
function render(){ctx.clearRect(0,0,W,H);ctx.save();if(shake)ctx.translate(rand(-3,3),rand(-3,3));
 ctx.drawImage(groundLayer,0,0);
 ctx.fillStyle='#101721';ctx.fillRect(0,0,W,33);ctx.fillRect(0,H-30,W,30);ctx.fillRect(0,0,31,H);ctx.fillRect(W-31,0,31,H);
 for(const [x,y] of [[110,93],[W-110,93],[110,H-92],[W-110,H-92]]){ctx.fillStyle='#090f1a88';ctx.beginPath();ctx.ellipse(x+7,y+14,34,14,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#3d4c5e';ctx.fillRect(x-22,y-24,44,48);ctx.fillStyle='#526174';ctx.fillRect(x-27,y-29,54,13);ctx.fillStyle='#182638';ctx.fillRect(x-15,y-8,30,23);ctx.fillStyle='#384c62';ctx.fillRect(x-26,y+19,52,10);ctx.fillStyle='#9e6f53';ctx.fillRect(x-4,y-35,8,9);ctx.shadowColor='#f9a45a';ctx.shadowBlur=18;ctx.fillStyle='#f6bb69';ctx.beginPath();ctx.ellipse(x,y-40,6,10,Math.sin(arenaTime*3)*.2,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0}
 // Vitrais e portão.
 ctx.fillStyle='#0a111d';ctx.fillRect(W/2-74,0,148,44);ctx.fillStyle=doorOpen?'#668d86':'#455268';ctx.fillRect(W/2-64,0,128,29);for(let x=W/2-55;x<W/2+60;x+=22){ctx.fillStyle=doorOpen?'#a8d2c8':'#334f69';ctx.fillRect(x,2,7,27)}if(doorOpen){ctx.fillStyle='#e5f5ec';ctx.textAlign='center';ctx.font='bold 13px Georgia';ctx.fillText('PASSAGEM ABERTA',W/2,63);ctx.textAlign='left'}
 // Fogueira fixa no mapa: só pode ser usada quando a sala estiver segura.
 if(bonfire){const x=bonfire.x,y=bonfire.y;ctx.fillStyle='#141a25';ctx.beginPath();ctx.ellipse(x,y+21,59,18,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#76534a';ctx.fillRect(x-29,y+7,58,12);ctx.save();ctx.shadowColor='#ff8c3c';ctx.shadowBlur=35;ctx.fillStyle='#ffbd75';ctx.beginPath();ctx.moveTo(x-19,y+12);ctx.lineTo(x-7,y-27);ctx.lineTo(x+1,y-10);ctx.lineTo(x+11,y-37);ctx.lineTo(x+21,y+12);ctx.fill();ctx.fillStyle='#f8e5a5';ctx.beginPath();ctx.moveTo(x-7,y+11);ctx.lineTo(x+4,y-19);ctx.lineTo(x+12,y+11);ctx.fill();ctx.restore();if(nearFire()&&state==='playing'){ctx.fillStyle='#f8e7bf';ctx.font='bold 13px system-ui';ctx.textAlign='center';ctx.fillText(enemies.length?'FOGUEIRA BLOQUEADA':'[E / B] DESCANSAR',x,y-60);ctx.textAlign='left'}}
 // Partículas de neve animadas, com vento lateral constante.
 for(const q of snow){ctx.fillStyle='rgba(219,237,248,.70)';ctx.beginPath();ctx.arc(q.x,q.y,q.r,0,Math.PI*2);ctx.fill()}
 if(roomToast>0){ctx.fillStyle='#e8ddc2';ctx.textAlign='center';ctx.font='bold 17px Georgia';ctx.fillText(notice,W/2,H-42);ctx.textAlign='left'}
 for(const b of projectiles){ctx.shadowColor=b.color;ctx.shadowBlur=14;ctx.fillStyle=b.color;ctx.beginPath();ctx.arc(b.x,b.y,b.r,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0}
 for(const e of enemies){const boss=e.type==='boss',r=e.r;ctx.fillStyle='#040a11a8';ctx.beginPath();ctx.ellipse(e.x+5,e.y+r*.75,r*1.2,10,0,0,Math.PI*2);ctx.fill();
 if(e.telegraph){const t=e.telegraph;ctx.save();ctx.globalAlpha=.18+.27*(1-t.t/t.initial);ctx.strokeStyle='#ff7a7a';ctx.fillStyle='#f24e6380';ctx.lineWidth=5;if(t.type==='slam'){ctx.beginPath();ctx.arc(e.x,e.y,t.radius,0,Math.PI*2);ctx.fill();ctx.stroke()}else if(t.type==='dash'||t.type==='doubleDash'){ctx.beginPath();ctx.moveTo(e.x,e.y);ctx.lineTo(e.x+Math.cos(t.angle)*t.range,e.y+Math.sin(t.angle)*t.range);ctx.stroke()}else if(['fan','wideFan','line'].includes(t.type)){const spread=t.type==='wideFan'?.72:t.type==='line'?.17:.48;ctx.beginPath();ctx.moveTo(e.x,e.y);ctx.arc(e.x,e.y,175,t.angle-spread,t.angle+spread);ctx.closePath();ctx.fill();ctx.stroke()}else{ctx.beginPath();ctx.arc(e.x,e.y,t.type==='cross'?120:90,0,Math.PI*2);ctx.stroke()}ctx.restore()}
 if(e.windup>0){ctx.strokeStyle='#ffce6c';ctx.lineWidth=3;ctx.beginPath();ctx.arc(e.x,e.y,r+9,0,Math.PI*2);ctx.stroke()}
 // Sprite humanoide pré-renderizado: elmo, torso, braços, pernas, capa e arma distinta.
 const variant=boss?e.kind:'';
 const type=boss?'boss':e.type;
 window.DeadActors?.draw(ctx,type,e.x,e.y,r,variant,!!e.flash,arenaTime+(e.x*.01),player&&player.x<e.x?-1:1);
 if(e.hp<e.maxHp&&!boss){ctx.fillStyle='#090f1b';ctx.fillRect(e.x-23,e.y-r-15,46,6);ctx.fillStyle='#d97985';ctx.fillRect(e.x-23,e.y-r-15,46*Math.max(0,e.hp)/e.maxHp,6)}}
 if(player){const p=player;
 ctx.fillStyle='#030a14a8';ctx.beginPath();ctx.ellipse(p.x,p.y+16,19,8,0,0,Math.PI*2);ctx.fill();
 if(p.dashTime>0){ctx.fillStyle='#8be4f855';ctx.beginPath();ctx.moveTo(p.x-p.dx*20-p.dy*14,p.y-p.dy*20+p.dx*14);ctx.lineTo(p.x-p.dx*78,p.y-p.dy*78);ctx.lineTo(p.x-p.dx*20+p.dy*14,p.y-p.dy*20-p.dx*14);ctx.fill()}
 ctx.globalAlpha=p.invuln>0&&Math.floor(performance.now()/85)%2===0?.56:1;
 window.DeadActors?.draw(ctx,p.gender==='feminino'?'female':'male',p.x,p.y,p.gender==='feminino'?19:22,'',p.flash>0,arenaTime+p.x*.003,p.dx<0?-1:1);
 ctx.globalAlpha=1;
 if(healingAnim>0){ctx.strokeStyle='#f7ce8b';ctx.lineWidth=5;ctx.beginPath();ctx.arc(p.x,p.y,32+healingAnim*24,0,Math.PI*2);ctx.stroke()}
 if(p.heavyWindup>0){ctx.strokeStyle='#f3be78';ctx.lineWidth=4;ctx.beginPath();ctx.arc(p.x,p.y,41,-Math.PI/2,-Math.PI/2+Math.PI*2*(1-p.heavyWindup/.46));ctx.stroke()}
 if(p.attackTimer>0){ctx.strokeStyle=p.attackCD>.7?'#ffd29b':'#b3ffeb';ctx.lineWidth=9;ctx.lineCap='round';ctx.beginPath();const a=Math.atan2(p.dy,p.dx);ctx.arc(p.x,p.y,66,a-.8,a+.8);ctx.stroke()}}
 for(const part of particles){ctx.globalAlpha=Math.max(0,part.life/part.maxLife);ctx.fillStyle=part.col;ctx.fillRect(part.x,part.y,5,5)}ctx.globalAlpha=1;
 const boss=enemies.find(e=>e.type==='boss');if(boss){const bw=360,bx=(W-bw)/2,by=46;ctx.fillStyle='#0a121ccf';ctx.fillRect(bx-7,by-7,bw+14,33);ctx.fillStyle='#512b43';ctx.fillRect(bx,by,bw,12);ctx.fillStyle=boss.color;ctx.fillRect(bx,by,bw*Math.max(0,boss.hp)/boss.maxHp,12);ctx.fillStyle='#f8ecdd';ctx.textAlign='center';ctx.font='bold 14px Georgia,serif';ctx.fillText(boss.name,W/2,by+28);ctx.textAlign='left'}
 ctx.fillStyle='#cddcea';ctx.font='bold 15px system-ui';ctx.fillText(roomName(),37,26);ctx.restore()}
let frameStamp=0;
function loop(now){requestAnimationFrame(loop);if(now-frameStamp<33)return;const dt=last?Math.min(.05,(now-last)/1000):0;frameStamp=now;last=now;pollPad(dt);if(state==='playing'){update(dt);render()}else if(!menuDrawn){render();menuDrawn=true}}
let menuDrawn=false;requestAnimationFrame(loop);
// Menu e saves
$('goSaves').onclick=()=>{enterFullscreen();profileList();setPage('saves')};$('backHome').onclick=menuHome;$('exitHome').onclick=()=>setPage('exit');$('exitBack').onclick=menuHome;
$('createSave').onclick=()=>{if(profiles.length>=3)return;const name=(gamepadActive?('Guerreiro '+(profiles.length+1)):prompt('Qual será o nome do novo personagem?','Guerreiro'))?.trim();if(!name)return;profiles.push({name:name.slice(0,30),gender:$('characterStyle').value,wave:1,checkpointRoom:1,kills:0,clock:0});if(persist()){profileList();selectProfile(profiles.length-1)}else profiles.pop()};
$('healBtn').onclick=()=>{player.hp=player.maxHp;player.stamina=player.maxStamina;player.flasks=HEALS_MAX;refreshHUD();$('restHint').textContent='Vida, vigor e 3 frascos restaurados!'};
$('saveBtn').onclick=()=>{$('restHint').textContent=saveCheckpoint()?'Jornada salva nesta fogueira!':'Não foi possível salvar.'};$('startWave').onclick=()=>{setPage('playing')};$('restToMenu').onclick=menuHome;
$('retryBtn').onclick=()=>{const d=profiles[slot];if(d){wave=d.checkpointRoom||d.wave||1;checkpointRoom=wave;kills=d.kills||0;clock=d.clock||0;player=makePlayer();enterRoom()}else menuHome()};$('deathMenu').onclick=menuHome;
$('resumeBtn').onclick=()=>setPage('playing');$('pauseSave').onclick=()=>{$('statusText').textContent='Salve interagindo com uma fogueira segura'};$('pauseMenu').onclick=menuHome;
function pause(){if(state==='playing')setPage('paused');else if(state==='paused')setPage('playing')}$('pauseBtn').onclick=pause;$('menuBtn').onclick=()=>{if(state==='playing')setPage('paused');else menuHome()};

let introPage=0;
const INTRO=[
 {head:'I · A QUEDA',text:'Há muito tempo, um rei, seus fiéis súditos e todo o seu reino foram consumidos por uma praga aparentemente infinita. Desesperados por uma cura, procuraram respostas onde jamais deveriam ter procurado. Mas, em vez da salvação, encontraram a loucura.'},
 {head:'II · O SACRIFÍCIO',text:'Acreditando que o sangue e as almas dos cidadãos poderiam destruir a praga, o rei e seus seguidores sacrificaram o próprio povo. A praga apenas se espalhou. Todos os que carregavam a marca sofreram até perder a sanidade... e, por fim, a própria alma.'},
 {head:'III · A ALMA QUE RESISTE',text:'Mas você... você é diferente. Uma alma marcada, sim. Porém, há algo que a praga não conseguiu consumir: vontade. Resistência. Uma chama que insiste em permanecer acesa. Será você a chama que consumirá a praga e devolverá a paz a este reino morto?'}
];
function renderIntro(){const data=INTRO[introPage];$('introCount').textContent=`${introPage+1} / ${INTRO.length}`;$('introTitle').textContent=data.head;$('introText').textContent=data.text;$('introNext').textContent=introPage===2?'DESPERTAR NO PÁTIO EXTERNO':'CONTINUAR';$('menuIntro').dataset.scene=String(introPage+1)}
function finishIntro(){sessionStorage.setItem('dead-souls-intro-viewed','1');enterRoom();}
$('introNext').onclick=()=>{if(introPage<2){introPage++;renderIntro()}else finishIntro()};
$('introSkip').onclick=finishIntro;

// Joystick com movimento analógico de 360° e intensidade proporcional
const joy=$('joystick'),knob=$('joystickKnob');function releaseStick(){stick.x=0;stick.y=0;stick.pointer=null;if(knob)knob.style.transform='translate(0px, 0px)';joy?.classList.remove('held')}
function readStick(e){const r=joy.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2;let x=e.clientX-cx,y=e.clientY-cy;const max=r.width*.30,dist=Math.hypot(x,y),scale=dist>max?max/dist:1;x*=scale;y*=scale;stick.x=Math.abs(x/max)<.13?0:x/max;stick.y=Math.abs(y/max)<.13?0:y/max;knob.style.transform=`translate(${x}px, ${y}px)`}
joy.addEventListener('pointerdown',e=>{e.preventDefault();if(stick.pointer!==null)return;stick.pointer=e.pointerId;joy.setPointerCapture(e.pointerId);joy.classList.add('held');readStick(e)});joy.addEventListener('pointermove',e=>{if(stick.pointer!==e.pointerId)return;e.preventDefault();readStick(e)});for(const k of ['pointerup','pointercancel','lostpointercapture'])joy.addEventListener(k,e=>{if(stick.pointer===e.pointerId)releaseStick()});
function bindAction(id,fn,continuous=false){const b=$(id);b.addEventListener('pointerdown',e=>{e.preventDefault();b.setPointerCapture(e.pointerId);b.classList.add('active');if(continuous)touchAttack.held=true;fn()});for(const k of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(k,()=>{b.classList.remove('active');if(continuous)touchAttack.held=false})}bindAction('attackBtn',attack,true);bindAction('strongAttackBtn',strongAttack);bindAction('dashBtn',dash);bindAction('healActionBtn',heal);bindAction('interactBtn',interact);
window.addEventListener('keydown',e=>{const k=e.key.toLowerCase();if(['arrowup','arrowdown','arrowleft','arrowright',' ','shift'].includes(k))e.preventDefault();if(!keys.has(k)){if(k==='shift'||k==='k')dash();if(k==='l')strongAttack();if(k==='escape')pause();if(k==='e')interact();if(k==='h'||k==='q')heal()}keys.add(k)});window.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));window.addEventListener('blur',()=>{keys.clear();releaseStick();touchAttack.held=false;if(state==='playing')pause()});document.addEventListener('visibilitychange',()=>{if(document.hidden&&state==='playing')pause()});
async function enterFullscreen(){try{if(!document.fullscreenElement){await document.documentElement.requestFullscreen?.({navigationUI:'hide'})}await screen.orientation?.lock?.('landscape')}catch(e){const hint=$('orientationHint');if(hint)hint.textContent='Gire o celular; o navegador pode limitar a tela cheia.'}}
$('fullscreenBtn').onclick=enterFullscreen;$('quickFullscreen').onclick=enterFullscreen;$('settingsFullscreen').onclick=enterFullscreen;
$('homeSettings').onclick=()=>{settingsFrom='home';setPage('settings')};$('pauseSettings').onclick=()=>{settingsFrom='paused';setPage('settings')};$('settingsBack').onclick=()=>setPage(settingsFrom);
window.addEventListener('gamepadconnected',()=>{gamepadActive=true;$('touchControls').hidden=true});
window.addEventListener('gamepaddisconnected',()=>{gamepadActive=false;$('touchControls').hidden=state!=='playing'});
window.DeadActors?.preload();generateSnow();player=makePlayer();refreshHUD(true);setPage('home');initDatabase();
})();
