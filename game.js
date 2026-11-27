(()=>{'use strict';
const $=id=>document.getElementById(id),canvas=$('screen'),ctx=canvas.getContext('2d'),W=960,H=576;
// Demo 1.0 — áudio desativado até o futuro pacote de sons, conforme decisão do criador.
const SFX=()=>{};
const setMusic=()=>{};
const RPG=window.DeadRPG;let rpg=RPG.fresh('masculino'),chest=null,trapTiles=[],introElapsed=0,introHold=0,essenceToast=0;
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
// Pré-Demo 1.2: área com salas ligadas por corredores norte/sul/leste/oeste.
let checkpointRoom=1,roomX=0,roomDepth=0,checkpointX=0,checkpointDepth=0;
let roomCleared=false,bonfire=null,doorOpen=false,snow=[],gamepadDirection={x:0,y:0},lastPadButtons=[],padAttackHeld=false,healingAnim=0,roomToast=0;
let clearedRooms=new Set(),defeatedBosses=new Set(),visitedRooms=new Set(),restPose=0;
const HEALS_MAX=3,HEAL_AMOUNT=38,MAX_DEPTH=24,LEFT_BRANCHES=new Set([2,5,8,11,14,17,20,23]),RIGHT_BRANCHES=new Set([3,6,9,12,15,18,21,23]);
const FIRE_DEPTHS=new Set([0,8,16,22]);let footstepClock=0;
function roomKey(x=roomX,d=roomDepth){return `${x}:${d}`}
function roomExists(x,d){if(d<0||d>MAX_DEPTH||Math.abs(x)>2)return false;
 if(x===0)return true;
 if(x===-1)return LEFT_BRANCHES.has(d);
 if(x===1)return RIGHT_BRANCHES.has(d);
 if(x===-2)return d===8||d===17;
 return d===12||d===21;
}
function roomDoors(){return{north:roomX===0&&roomExists(roomX,roomDepth+1),south:roomX===0&&roomExists(roomX,roomDepth-1),west:roomExists(roomX-1,roomDepth),east:roomExists(roomX+1,roomDepth)}}
function roomHasBonfire(){return roomX===0&&FIRE_DEPTHS.has(roomDepth)}
function roomName(){const wing=roomX<0?'ALA OESTE':roomX>0?'ALA LESTE':'CAMINHO PRINCIPAL';const special=roomX===0&&roomDepth===12?' · CAVALEIRO CORROMPIDO':roomX===0&&roomDepth===24?' · EXECUTOR DO PALÁCIO':'';return `PÁTIO EXTERNO · ${wing} · SALA ${roomDepth+1}${special}`}
function setBonfire(){bonfire=roomHasBonfire()?{x:174,y:296}:null}
function nearFire(){return !!(bonfire&&player&&Math.hypot(player.x-bonfire.x,player.y-bonfire.y)<92)}
function restAtFire(){if(state!=='playing'||!nearFire()||enemies.length>0)return;
 recalculatePlayer(true);player.hp=player.maxHp;player.stamina=player.maxStamina;player.flasks=HEALS_MAX;
 checkpointX=roomX;checkpointDepth=roomDepth;checkpointRoom=roomDepth+1;
 // Após sentar, inimigos comuns de salas antes limpas voltarão ao próximo acesso.
 clearedRooms=new Set([...defeatedBosses]);for(const depth of FIRE_DEPTHS)clearedRooms.add(roomKey(0,depth));
 roomCleared=true;doorOpen=true;restPose=.9;
 const saved=saveCheckpoint();notice=saved?'FOGUEIRA ACESA · VIDA, VIGOR E 3 CURAS RESTAURADOS · INIMIGOS RETORNARAM':'FOGUEIRA ACESA · NÃO FOI POSSÍVEL SALVAR';roomToast=4.5;
 spark(bonfire.x,bonfire.y,'#f7b66d',22);refreshHUD(true);
}
function heal(){if(state!=='playing'||player.flasks<=0||player.hp>=player.maxHp||player.dashTime>0||player.healCD>0)return;
 player.flasks--;player.hp=Math.min(player.maxHp,player.hp+Math.round(HEAL_AMOUNT*(rpg.equipped.pingente==='ember_pendant'?Math.min(1.5,1.15+Math.max(0,rpg.attributes.fe-10)*.01):1)));player.healCD=1;healingAnim=.45;player.invuln=Math.max(player.invuln,.15);
 spark(player.x,player.y,'#dca36b',15);refreshHUD(true);
}
function recalculatePlayer(restore=false){if(!player)return;const st=RPG.stats(rpg),priorHp=player.maxHp,priorSt=player.maxStamina;player.maxHp=st.hp;player.maxStamina=st.stamina;player.hp=restore?st.hp:Math.max(1,Math.min(st.hp,player.hp+Math.max(0,st.hp-priorHp)));player.stamina=restore?st.stamina:Math.min(st.stamina,player.stamina+Math.max(0,st.stamina-priorSt));refreshHUD(true)}
const CHEST_ROOMS=new Set(['0:3','0:6','0:10','0:15','0:19','0:22','-1:2','1:3','-1:5','1:6','-2:8','1:12','-1:14','-2:17','1:18','2:21']);
const MIMIC_ROOMS=new Set(['-1:5','1:12','-2:17']);
function roomChest(){const key=roomKey();if(!CHEST_ROOMS.has(key)||rpg.openedChests.includes(key))return null;return{x:roomX<0?650:roomX>0?285:roomDepth%2?720:250,y:295,kind:MIMIC_ROOMS.has(key)?'mimic':'normal',key,awake:false}}
function nearChest(){return chest&&player&&Math.hypot(player.x-chest.x,player.y-chest.y)<78}
function rewardChest(c){const rewards={'0:3':'shard','0:6':'steel_sword','0:10':'frost_pendant','0:15':'guardian_soul','0:19':'long_spear','0:22':'great_soul','-1:2':'soul','1:3':'iron_axe','-1:5':'ember_pendant','1:6':'knight_soul','-2:8':'imperial_soul','1:12':'knight_armor','-1:14':'great_soul','-2:17':'guardian_soul','1:18':'steel_sword','2:21':'imperial_soul'};return rewards[c?.key||roomKey()]||'shard'}
function openChest(){if(!chest||chest.awake||!nearChest())return;
 if(chest.kind==='mimic'){chest.awake=true;roomCleared=false;doorOpen=false;const b={type:'mimic',name:'Mímico do Pátio',color:'#d29675',x:chest.x,y:chest.y,r:32,hp:235+roomDepth*11,maxHp:235+roomDepth*11,speed:55,dmg:24,attackCD:1.25,flash:0,windup:0,animTime:0,frozen:0,slowAfter:0};enemies.push(b);notice='MÍMICO! A ARMADILHA DESPERTOU';roomToast=4;spark(chest.x,chest.y,'#eb8174',25);return}
 const loot=rewardChest(chest);RPG.addItem(rpg,loot);rpg.openedChests.push(chest.key);notice='BAÚ ABERTO · '+RPG.definitions[loot].name.toUpperCase();roomToast=4;chest=null;saveCheckpoint();refreshHUD(true);
}
function makeTraps(){const id=roomKey();trapTiles=[];if(roomHasBonfire()||roomX===0&&(roomDepth===12||roomDepth===24)||roomDepth<2)return;
 if((roomDepth+Math.abs(roomX)*2)%3!==1&&roomX===0)return;
 const seed=roomDepth*17+roomX*67;for(let i=0;i<(roomDepth>12?2:1);i++)trapTiles.push({x:380+(seed+i*141)%270,y:222+(seed+i*31)%165,r:30+(i%2)*4,offset:(i*1.4+roomDepth*.3)%3.5});}
function updateTraps(dt){for(const q of trapTiles){const cycle=(arenaTime+q.offset)%4.1;q.warning=cycle<1.3;q.active=cycle>=1.3&&cycle<2.15;if(q.active&&Math.hypot(player.x-q.x,player.y-q.y)<q.r+player.r*.5)applyPlayerDamage(12+Math.floor(roomDepth/6)*2,q.x,q.y)}}
function interact(){if(state!=='playing'||restPose>0)return;
 if(nearFire()){restAtFire();return}if(nearChest()){openChest();return}
 if(roomCleared){const d=roomDoors();const p=player;
 if(d.north&&p.y<113&&Math.abs(p.x-W/2)<125){travel(0,1);return}
 if(d.south&&p.y>H-113&&Math.abs(p.x-W/2)<125){travel(0,-1);return}
 if(d.west&&p.x<115&&Math.abs(p.y-H/2)<130){travel(-1,0);return}
 if(d.east&&p.x>W-115&&Math.abs(p.y-H/2)<130){travel(1,0);return}
 }
 notice=roomCleared?'Aproxime-se de passagem, baú ou fogueira':'Elimine os inimigos para liberar as saídas';roomToast=2.5;
}
function travel(dx,dy){if(!roomCleared||!roomExists(roomX+dx,roomDepth+dy)||state!=='playing')return false;
 roomX+=dx;roomDepth+=dy;wave=roomDepth+1;
 enterRoom(dx===1?'west':dx===-1?'east':dy===1?'south':'north');return true;
}
let gamepadActive=false,padMenuRepeat=0,padLastAxis=0;
function menuFocusables(){const page=document.querySelector('.menuPage:not([hidden])');return page?[...page.querySelectorAll('button:not(:disabled),select,input[type="range"]')].filter(el=>el.getClientRects().length):[]}
function stepMenu(n){const els=menuFocusables();if(!els.length)return;const idx=els.indexOf(document.activeElement);focusMenu(els[(idx+n+els.length)%els.length]);}
function focusMenu(el){if(!el)return;menuFocusables().forEach(e=>e.classList.remove('pad-selected'));el.classList.add('pad-selected');el.focus({preventScroll:true});}
function stepMenu2D(dx,dy){const els=menuFocusables();if(!els.length)return;const cur=els.includes(document.activeElement)?document.activeElement:els[0];const box=cur.getBoundingClientRect();const cx=box.left+box.width/2,cy=box.top+box.height/2;let best=null,bestScore=Infinity;
 for(const el of els){if(el===cur)continue;const r=el.getBoundingClientRect(),xx=r.left+r.width/2-cx,yy=r.top+r.height/2-cy;const along=xx*dx+yy*dy,cross=Math.abs(xx*dy-yy*dx);if(along<4)continue;const score=along+cross*2.25;if(score<bestScore){best=el;bestScore=score}}
 if(best)focusMenu(best);else{ // Repetição circular apenas quando não há item na direção.
   const ordered=els.map(e=>({e,r:e.getBoundingClientRect()})).sort((a,b)=>dy?(a.r.top-b.r.top||a.r.left-b.r.left):(a.r.left-b.r.left||a.r.top-b.r.top));focusMenu((dx+dy>0?ordered[0]:ordered[ordered.length-1]).e);
 }}
function navigateBack(){if(state==='settings'){setPage(settingsFrom||'home')}else if(state==='saves'){menuHome()}else if(state==='create'){setPage('saves')}else if(state==='paused'||state==='rest'){setPage('playing')}else if(state==='dead'){menuHome()}else if(state==='exit'){menuHome()}else if(state==='intro'){setPage('saves')}else if(['inventory','attributes','ending'].includes(state)){setPage('playing')}}
let settingsFrom='home';
function pollPad(dt=0){const pads=navigator.getGamepads?.()||[];const gp=[...pads].find(Boolean);gamepadDirection={x:0,y:0};
if(!gp){if(gamepadActive){gamepadActive=false;$('touchControls').hidden=state!=='playing'}lastPadButtons=[];padAttackHeld=false;return}
if(!gamepadActive){gamepadActive=true;$('touchControls').hidden=true}
let x=gp.axes?.[0]||0,y=gp.axes?.[1]||0;if(Math.abs(x)<.18)x=0;if(Math.abs(y)<.18)y=0;gamepadDirection={x,y};
const pressed=i=>!!gp.buttons?.[i]?.pressed;const edge=(i,fn)=>{if(pressed(i)&&!lastPadButtons[i])fn()};
if(state==='playing'){edge(0,interact);edge(1,dash);edge(2,heal);edge(3,openInventory);edge(4,openAttributes);edge(9,pause);edge(7,strongAttack);padAttackHeld=pressed(5)}
else{padAttackHeld=false;const up=pressed(12)||y<-.6,down=pressed(13)||y>.6,left=pressed(14)||x<-.6,right=pressed(15)||x>.6;const nx=left?-1:right?1:0,ny=up?-1:down?1:0,nav=nx||ny;padMenuRepeat-=dt;if(nav&&(!padLastAxis||padMenuRepeat<=0)){stepMenu2D(nx,ny);padMenuRepeat=.19}if(!nav)padMenuRepeat=0;padLastAxis=nav;
edge(0,()=>{const el=document.activeElement;const targets=menuFocusables();if(targets.includes(el))el.click();else targets[0]?.click()});edge(1,()=>{if(state==='create'&&document.activeElement?.closest('#letterKeyboard')){editName('back');return}navigateBack()});edge(9,()=>{if(state==='paused')setPage('playing')});
if(pressed(14)||pressed(15)){const el=document.activeElement;if(el?.tagName==='INPUT'&&el.type==='range')el.value=Math.max(0,Math.min(100,Number(el.value)+(pressed(15)?5:-5)))}
}
if(state==='intro'&&pressed(9)){introHold+=dt;if(introHold>=1.5){introHold=-999;finishIntro()}}else introHold=0;lastPadButtons=gp.buttons.map(b=>b.pressed);
}
function generateSnow(){snow=Array.from({length:48},()=>({x:Math.random()*W,y:Math.random()*H,r:rand(.8,2.8),v:rand(13,38),seed:rand(0,100)}))}
function updateSnow(dt){for(const q of snow){q.y+=q.v*dt;q.x+=(24+Math.sin(arenaTime*.7+q.seed)*13)*dt;if(q.y>H+10){q.y=-10;q.x=rand(-50,W)}if(q.x>W+10)q.x=-10}}

const rand=(a,b)=>a+Math.random()*(b-a),clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const groundLayer=document.createElement('canvas');groundLayer.width=W;groundLayer.height=H;
{const c=groundLayer.getContext('2d');const ground=c.createLinearGradient(0,0,W,H);ground.addColorStop(0,'#202d3a');ground.addColorStop(1,'#101a29');c.fillStyle=ground;c.fillRect(0,0,W,H);
for(let y=0;y<H;y+=48)for(let x=0;x<W;x+=64){const off=(Math.floor(y/48)%2)*32;c.fillStyle=((Math.floor(x/64)+Math.floor(y/48))%3===0)?'#253646':'#202d3c';c.fillRect(x+off+2,y+2,60,44);c.strokeStyle='#35485a';c.lineWidth=1;c.strokeRect(x+off+2.5,y+2.5,60,44)}
for(let i=0;i<30;i++){const x=45+((i*181+37)%870),y=35+((i*97+19)%505);c.strokeStyle='#1019239c';c.lineWidth=2;c.beginPath();c.moveTo(x-12,y+7);c.lineTo(x,y);c.lineTo(x+9,y+12);c.stroke();c.fillStyle='#3e4650';c.fillRect(x+4,y+8,2,2);if(i%3===0){c.fillStyle='#b7cad755';c.fillRect(x-12,y+13,26,5)}}}
// Pré-Demo 1.1: elementos fixos detalhados desenhados uma única vez na camada de chão.
function detailCourtyard(){const c=groundLayer.getContext('2d');c.save();
 // Linhas de pedra irregular, manchas de neve e fissuras nas juntas.
 for(let i=0;i<110;i++){const x=33+(i*167%896),y=40+(i*113%480),r=4+(i*7%21);
  c.fillStyle=i%4?'#b3cadd18':'#dceaf026';c.beginPath();c.ellipse(x,y,r,r*.30,(i%5)*.3,0,Math.PI*2);c.fill();
  if(i%3===0){c.strokeStyle='#111e2a88';c.lineWidth=1.5;c.beginPath();c.moveTo(x-13,y-6);c.lineTo(x,y+2);c.lineTo(x+7,y-5);c.lineTo(x+14,y-2);c.stroke()}
 }
 // Muralhas gastas, arcos laterais, neve na base dos muros.
 for(const side of [0,1]){const xx=side?W-43:0;c.fillStyle='#263747';c.fillRect(xx,0,43,H);
  for(let y=0;y<H;y+=40){c.fillStyle=y%80?'#3c4b58':'#344656';c.fillRect(xx+4,y+2,35,35);c.strokeStyle='#101a27';c.strokeRect(xx+4,y+2,35,35);c.fillStyle='#c3d4d75e';c.fillRect(xx+7,y+3,27,3)}
  for(let yy of [130,320,480]){c.fillStyle='#101a25';c.beginPath();c.arc(side?W-22:22,yy,16,Math.PI,Math.PI*2);c.fill();c.fillRect(xx+7,yy,30,37)}
 }
 // Escadaria do portão, corrimões e lajes tortas.
 for(let j=0;j<4;j++){c.fillStyle=j%2?'#334a58':'#2e4050';c.fillRect(W/2-110+j*5,33+j*12,220-j*10,12);c.fillStyle='#b1c5d34a';c.fillRect(W/2-107+j*5,34+j*12,214-j*10,2)}
 // Pedras cobertas por gelo e raízes de árvores mortas.
 for(let i=0;i<19;i++){const x=60+(i*211%833),y=110+(i*163%370);if(Math.hypot(x-174,y-296)<84)continue;c.fillStyle='#172530';c.beginPath();c.moveTo(x-14,y+9);c.lineTo(x-7,y-7);c.lineTo(x+7,y-12);c.lineTo(x+19,y+5);c.closePath();c.fill();c.fillStyle='#879da477';c.beginPath();c.moveTo(x-8,y-5);c.lineTo(x+7,y-12);c.lineTo(x+14,y-1);c.closePath();c.fill();c.strokeStyle='#d4e5e8a0';c.lineWidth=2;c.beginPath();c.moveTo(x-10,y-4);c.lineTo(x+2,y-10);c.stroke()}
 c.restore();}
detailCourtyard();
function loadProfiles(){try{let x=JSON.parse(localStorage.getItem(SAVEKEY)||'[]');return Array.isArray(x)?x.filter(v=>v&&typeof v.name==='string').slice(0,3):[]}catch{return []}}
let database=null;let dbReady=false;let savePending=false;
function openDatabase(){return new Promise(resolve=>{if(!('indexedDB' in window)){resolve(null);return}try{const req=indexedDB.open('DeadSouls_MCE1809',1);req.onupgradeneeded=()=>{const db=req.result;for(const name of ['perfis','partidas','configuracoes','estatisticas'])if(!db.objectStoreNames.contains(name))db.createObjectStore(name)};req.onsuccess=()=>resolve(req.result);req.onerror=()=>resolve(null)}catch{resolve(null)}})}
function storeProfiles(){if(!database)return;try{const tx=database.transaction('perfis','readwrite');tx.objectStore('perfis').put(profiles,'slots');tx.onerror=()=>console.warn('Não foi possível persistir perfis no IndexedDB')}catch(e){console.warn(e)}}
function persist(){if(database){storeProfiles();return true}try{localStorage.setItem(SAVEKEY,JSON.stringify(profiles));return true}catch{console.warn('Armazenamento local cheio; salvamento pendente no IndexedDB');savePending=true;return false}}
async function initDatabase(){database=await openDatabase();if(database){await new Promise(resolve=>{try{const tx=database.transaction('perfis','readonly'),req=tx.objectStore('perfis').get('slots');req.onsuccess=()=>{if(Array.isArray(req.result)){profiles=req.result.filter(v=>v&&typeof v.name==='string').slice(0,3)}else{storeProfiles()}resolve()};req.onerror=()=>resolve()}catch{resolve()}});if(savePending){storeProfiles();savePending=false}}dbReady=true;profileList();setPage('home')}

function fmt(s){s=Math.max(0,Math.floor(s));return String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0')}
function setPage(page){state=page;menuDrawn=false;setMusic(page==='playing'?(enemies.some(e=>e.type==='boss')?'boss':(nearFire()?'bonfire':'silence')):page==='rest'?'bonfire':page==='dead'?'silence':'menu');const map={home:'menuHome',saves:'menuSaves',rest:'menuRest',dead:'menuDeath',paused:'menuPause',exit:'menuExit',settings:'menuSettings',intro:'menuIntro',create:'menuCreate',inventory:'menuInventory',attributes:'menuAttributes',ending:'menuEnding'};for(const el of document.querySelectorAll('.menuPage'))el.hidden=el.id!==map[page];$('message').hidden=page==='playing';$('statusText').textContent=({home:'Menu inicial',saves:'Escolher save',rest:'Ponto de descanso',playing:'Em combate',dead:'Você Não Resistiu',paused:'Pausado',exit:'Menu de saída'})[page]||page;keys.clear();touchAttack.held=false;releaseStick();$('touchControls').hidden=page!=='playing'||gamepadActive;$('pauseBtn').hidden=page!=='playing';$('inventoryBtn').hidden=page!=='playing';$('attributesBtn').hidden=page!=='playing';requestAnimationFrame(()=>{const first=document.querySelector('.menuPage:not([hidden]) button:not(:disabled)');if(first)first.focus({preventScroll:true})})}
let lastHudAt=0;function refreshHUD(force=false){if(!player)return;const now=performance.now();if(!force&&now-lastHudAt<180)return;lastHudAt=now;$('lifeBar').style.width=clamp(player.hp/player.maxHp*100,0,100)+'%';$('energyBar').style.width=clamp(player.stamina/player.maxStamina*100,0,100)+'%';$('lifeText').textContent=`${Math.ceil(player.hp)} / ${player.maxHp}`;$('energyText').textContent=`${Math.floor(player.stamina)} / ${player.maxStamina}`;$('wave').textContent=String(roomDepth+1)+(roomX<0?' O'+Math.abs(roomX):roomX>0?' L'+roomX:'');$('flasksText').textContent=(player.flasks??3)+' / 3';$('kills').textContent=kills;$('timer').textContent=fmt(clock);$('essenceText').textContent=Number(rpg.essence).toLocaleString('pt-BR');$('levelText').textContent=String(rpg.level);$('activeProfile').textContent=profiles[slot]?.name||'Nenhum';}
function makePlayer(){const stats=RPG.stats(rpg);return{x:W/2,y:H/2,r:18,hp:stats.hp,maxHp:stats.hp,flasks:HEALS_MAX,healCD:0,gender:profiles[slot]?.gender||'masculino',stamina:stats.stamina,maxStamina:stats.stamina,dx:0,dy:1,attackCD:0,attackTimer:0,heavyWindup:0,heavyStrike:0,dashCD:0,dashTime:0,invuln:0,dashX:0,dashY:0,flash:0}}
function menuHome(){slot=null;setPage('home');refreshHUD()}
function selectProfile(i){slot=i;const d=profiles[i];if(!d)return;
 checkpointDepth=Number.isInteger(d.checkpointDepth)?Math.min(MAX_DEPTH,Math.max(0,d.checkpointDepth)):Math.min(MAX_DEPTH,Math.max(0,(d.checkpointRoom||d.wave||1)-1));
 checkpointX=Number.isInteger(d.checkpointX)&&roomExists(d.checkpointX,checkpointDepth)?d.checkpointX:0;
 roomDepth=checkpointDepth;roomX=checkpointX;wave=roomDepth+1;checkpointRoom=wave;
 kills=d.kills||0;clock=d.clock||0;rpg=RPG.safe(d.rpg,d.gender);defeatedBosses=new Set(Array.isArray(d.defeatedBosses)?d.defeatedBosses:[]);
 clearedRooms=new Set([...defeatedBosses]);for(const depth of FIRE_DEPTHS)clearedRooms.add(roomKey(0,depth));
 visitedRooms=new Set();player=makePlayer();enemies=[];particles=[];projectiles=[];
 if(roomDepth===0&&!sessionStorage.getItem('dead-souls-intro-viewed')){introPage=0;renderIntro();setPage('intro')}else enterRoom();}
function profileList(){$('saveList').replaceChildren();profiles.forEach((p,i)=>{let el=document.createElement('div');el.className='saveSlot';let open=document.createElement('button');open.className='slotOpen';open.textContent=`${p.name} · Sala ${p.checkpointRoom||p.wave||1}${p.checkpointX?(' / '+(p.checkpointX<0?'Oeste':'Leste')):''} · ${p.gender==='feminino'?'Andarilha':'Guardião'} · Nv.${p.rpg?.level||1}`;open.onclick=()=>selectProfile(i);let del=document.createElement('button');del.className='slotDelete';del.textContent='Excluir';del.onclick=()=>{if(confirm(`Excluir o save de ${p.name}?`)){profiles.splice(i,1);persist();profileList()}};el.append(open,del);$('saveList').append(el)});$('createSave').disabled=profiles.length>=3}
function saveCheckpoint(){if(slot===null||!profiles[slot])return false;
 const d=profiles[slot];d.wave=checkpointDepth+1;d.checkpointRoom=checkpointDepth+1;d.checkpointDepth=checkpointDepth;d.checkpointX=checkpointX;
 d.defeatedBosses=[...defeatedBosses];d.rpg=rpg;d.kills=kills;d.clock=clock;d.updated=new Date().toISOString();return persist();}

function prepareRest(){// Compatibilidade com chamadas antigas; não mostra menu de descanso.
 if(bonfire&&nearFire())restAtFire();else setPage('playing');}
function pickBoss(){const which=roomDepth===MAX_DEPTH?'executioner':'corrupted';
 const base=BOSSES.find(b=>b.kind===which)||BOSSES[0];
 return {...base,type:'boss',x:W/2,y:150,r:29,hp:base.hp,maxHp:base.hp,speed:base.speed,attackCD:1.25,flash:0,windup:0,hit:false,phase:0,telegraph:null,pattern:0,strafe:1,comboLeft:0,spin:.3};}
function enterRoom(entry='start'){wave=roomDepth+1;
 player.x=entry==='west'?125:entry==='east'?W-125:W/2;
 player.y=entry==='north'?100:entry==='south'?H-100:H*.73;
 player.invuln=.85;player.dashCD=0;enemies=[];particles=[];projectiles=[];bossTitleTime=0;arenaTime=0;roomToast=0;setBonfire();
 visitedRooms.add(roomKey());chest=roomChest();makeTraps();roomCleared=clearedRooms.has(roomKey())||roomHasBonfire()||defeatedBosses.has(roomKey());doorOpen=roomCleared;
 if(roomCleared){notice=bonfire?'Aproxime-se e interaja para SENTAR na fogueira':'SALA SEGURA · ESCOLHA UMA PASSAGEM';roomToast=2.7;$('bossBanner').hidden=true}
 else if(roomX===0&&(roomDepth===12||roomDepth===MAX_DEPTH)){
 const boss=pickBoss();enemies.push(boss);bossTitleTime=3.4;$('bossBanner').textContent=boss.name;$('bossBanner').hidden=false;
 }else{const count=Math.min(2+Math.floor(roomDepth/4)+Math.min(2,Math.abs(roomX)),7);
 for(let i=0;i<count;i++)spawnEnemy();$('bossBanner').hidden=true;}
 refreshHUD(true);setPage('playing');}
function enterWave(){enterRoom()}
function spawnEnemy(){const r=Math.random(),type=r<.20?'brute':r<.43?'runner':r<.67?'archer':r<.83?'spearman':'wanderer';let x,y,n=0;do{const side=Math.floor(rand(0,4));x=side===0?67:side===1?W-67:rand(80,W-80);y=side===2?75:side===3?H-75:rand(75,H-75)}while((Math.hypot(x-player.x,y-player.y)<205||(bonfire&&Math.hypot(x-bonfire.x,y-bonfire.y)<110)||Math.abs(x-W/2)<110&&y<150)&&n++<60);
 const base={brute:[91,39,22,22],runner:[35,76,14,9],archer:[41,52,16,11],spearman:[62,58,18,15],wanderer:[52,53,17,13]}[type],scale=1+Math.min(1.1,(wave-1)*.045);
 enemies.push({x,y,r:base[2],type,speed:base[1],hp:Math.round(base[0]*scale),maxHp:Math.round(base[0]*scale),dmg:base[3],attackCD:rand(.6,1.6),flash:0,windup:0,hit:false,strafe:Math.random()<.5?-1:1});}
function fireProjectile(e,angle,speed=235,damage=12,color='#d89bf0',size=8){if(projectiles.length>180)return;projectiles.push({x:e.x,y:e.y,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,r:size,dmg:damage,life:4,color});}
function applyPlayerDamage(dmg,x,y){if(state!=='playing'||player.invuln>0)return;player.hp=Math.max(0,player.hp-Math.max(1,Math.round(dmg*(1-RPG.stats(rpg).defense))));player.invuln=.65;player.flash=.22;shake=.15;if(player.hp>0)SFX(player.gender==='feminino'?'hitFemale':'hitMale');spark(player.x,player.y,'#ff899a',15);if(player.hp<=0)die()}
function updateBoss(e,dt){
 e.slowAfter=Math.max(0,(e.slowAfter||0)-dt);
 e.attackCD=Math.max(0,e.attackCD-dt);e.flash=Math.max(0,e.flash-dt);const dx=player.x-e.x,dy=player.y-e.y,dist=Math.max(1,Math.hypot(dx,dy)),aim=Math.atan2(dy,dx);
 if(e.telegraph){const t=e.telegraph;t.t-=dt;if(t.t<=0){e.telegraph=null;e.attackCD=(e.kind==='abyss'||e.kind==='reaper')?.68:1.18;SFX('enemy');
  if(t.type==='burst'||t.type==='spiral'){let count=t.count||12;for(let n=0;n<count;n++)fireProjectile(e,2*Math.PI*n/count+(t.offset||0),t.speed||190,t.damage,e.color,t.type==='spiral'?7:9);if(t.type==='spiral')e.spin+=.55;}
  else if(t.type==='fan'||t.type==='wideFan'){const n=t.type==='wideFan'?7:5,step=t.type==='wideFan'?.24:.20;for(let i=0;i<n;i++)fireProjectile(e,t.angle+(i-(n-1)/2)*step,t.speed||250,t.damage,e.color,8);}
  else if(t.type==='cross'){for(let i=0;i<8;i++)fireProjectile(e,t.angle+i*Math.PI/4,235,t.damage,e.color,8);}
  else if(t.type==='dash'||t.type==='doubleDash'){const moved=t.range;const oldX=e.x,oldY=e.y;e.x=clamp(e.x+Math.cos(t.angle)*moved,52,W-52);e.y=clamp(e.y+Math.sin(t.angle)*moved,52,H-52);spark(e.x,e.y,e.color,24);let ux=e.x-oldX,uy=e.y-oldY,den=ux*ux+uy*uy||1,proj=clamp(((player.x-oldX)*ux+(player.y-oldY)*uy)/den,0,1);const near=Math.hypot(player.x-(oldX+proj*ux),player.y-(oldY+proj*uy));if(near<player.r+e.r+8)applyPlayerDamage(t.damage,e.x,e.y);if(t.type==='doubleDash'&&e.comboLeft>0){e.comboLeft--;e.telegraph={type:'dash',angle:Math.atan2(player.y-e.y,player.x-e.x),range:170,damage:Math.round(e.dmg*.75),t:.38,initial:.38};}}
  else if(t.type==='slam'){spark(e.x,e.y,e.color,30);shake=.18;if(Math.hypot(player.x-e.x,player.y-e.y)<t.radius)applyPlayerDamage(t.damage,e.x,e.y);}
  else if(t.type==='line'){for(let j=0;j<4;j++)fireProjectile(e,t.angle+(j-1.5)*.095,315,t.damage,e.color,8);}
 }return}
 const rage=e.hp/e.maxHp<.43,pace=(rage?1.22:1)*(e.slowAfter>0?.90:1);const ranged=['alchemist','king'].includes(e.kind),ideal=ranged?190:e.kind==='executioner'?78:72;
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
function updateEnemy(e,dt){if(e.type==='boss'){updateBoss(e,dt);return}if(e.type==='mimic'){updateMimic(e,dt);return}if(e.frozen>0){e.frozen=Math.max(0,e.frozen-dt);if(e.frozen===0)e.slowAfter=5;return}e.slowAfter=Math.max(0,(e.slowAfter||0)-dt);e.attackCD=Math.max(0,e.attackCD-dt);e.flash=Math.max(0,e.flash-dt);const dx=player.x-e.x,dy=player.y-e.y,dist=Math.hypot(dx,dy)||1;
 if(e.windup>0){e.windup-=dt;if(e.windup<=0){e.attackCD=e.type==='runner'?1.2:e.type==='archer'?2:e.type==='brute'?1.55:1.3;if(e.type==='archer')fireProjectile(e,Math.atan2(dy,dx),235,e.dmg,'#e8af70',7);else if(dist<e.r+player.r+(e.type==='spearman'?65:27))applyPlayerDamage(e.dmg,e.x,e.y);}return}
 const desired=e.type==='archer'?210:e.type==='spearman'?68: e.r+player.r+21;
 if(dist>desired+10){e.x=clamp(e.x+dx/dist*e.speed*(e.slowAfter>0?.90:1)*dt,42,W-42);e.y=clamp(e.y+dy/dist*e.speed*(e.slowAfter>0?.90:1)*dt,42,H-42)}else if(e.type==='archer'&&dist<desired-45){e.x=clamp(e.x-dx/dist*e.speed*.7*dt,42,W-42);e.y=clamp(e.y-dy/dist*e.speed*.7*dt,42,H-42)}
 else if(e.attackCD<=0){e.windup=e.type==='runner'?.34:e.type==='brute'?.7:e.type==='archer'?.68:e.type==='spearman'?.48:.46;}
}
function updateMimic(e,dt){e.attackCD=Math.max(0,e.attackCD-dt);e.flash=Math.max(0,e.flash-dt);const dx=player.x-e.x,dy=player.y-e.y,dist=Math.max(1,Math.hypot(dx,dy));if(e.windup>0){e.windup-=dt;if(e.windup<=0){e.windup=0;e.attackCD=1.45;if(dist<e.r+player.r+38)applyPlayerDamage(e.dmg,e.x,e.y)}return}if(dist>75){e.x=clamp(e.x+dx/dist*e.speed*dt,45,W-45);e.y=clamp(e.y+dy/dist*e.speed*dt,45,H-45)}else if(e.attackCD===0)e.windup=.55}
function spark(x,y,col,num=8){for(let i=0;i<num;i++){const a=rand(0,Math.PI*2),v=rand(55,175),life=rand(.18,.42);particles.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,life,maxLife:life,col})}}
function strike(heavy=false){
 if(state!=='playing'||!player)return;
 SFX('attack');player.attackTimer=heavy?.30:.17;
 let got=false;
 for(const e of enemies){
  const dx=e.x-player.x,dy=e.y-player.y,dist=Math.hypot(dx,dy);
  if(dist<(heavy?135:105)*(RPG.definitions[rpg.equipped.arma]?.range||1)&&dx*player.dx+dy*player.dy>dist*(heavy?-.03:.12)){
   const base=e.type==='boss'?(heavy?63:32):(heavy?75:38);
   e.hp-=base*RPG.damage(rpg)*(player.gender==='feminino'?.9:1);if(rpg.equipped.pingente==='frost_pendant'&&Math.random()<Math.min(.35,.18+Math.max(0,rpg.attributes.inteligencia-10)*.005)){if(e.type==='boss')e.slowAfter=2;else if(e.type!=='mimic'&&e.frozen<=0){e.frozen=5;spark(e.x,e.y,'#9adeff',12)}}
   e.flash=heavy?.21:.13;
   e.x=clamp(e.x+player.dx*(heavy?34:19),45,W-45);
   e.y=clamp(e.y+player.dy*(heavy?34:19),45,H-45);
   spark(e.x,e.y,heavy?'#f3be78':'#b6fae2',heavy?18:8);
   got=true;
  }
 }
 if(got)shake=heavy?.12:.055;
}
function attack(){if(state!=='playing'||player.attackCD>0||player.dashTime>0||player.heavyWindup>0)return;if(player.stamina<8)return;player.stamina-=8;player.attackCD=.38*(RPG.definitions[rpg.equipped.arma]?.attackSpeed||1);strike(false)}
function strongAttack(){
 if(state!=='playing'||!player||player.attackCD>0||player.dashTime>0||player.heavyWindup>0)return;
 // R2: golpe pesado com 0,46 s de preparação e intervalo de 1,25 s.
 if(player.stamina<18)return;player.stamina-=18;player.attackCD=1.25*(RPG.definitions[rpg.equipped.arma]?.attackSpeed||1);
 player.heavyWindup=.46;
 player.heavyStrike=.46;
 SFX('attack');
 spark(player.x+player.dx*18,player.y+player.dy*18,'#e8b87b',5);
}
function direction(){let x=Number(keys.has('d')||keys.has('arrowright'))-Number(keys.has('a')||keys.has('arrowleft'));let y=Number(keys.has('s')||keys.has('arrowdown'))-Number(keys.has('w')||keys.has('arrowup'));if(Math.hypot(x,y)>0){let l=Math.hypot(x,y);return{x:x/l,y:y/l}}return Math.hypot(gamepadDirection.x,gamepadDirection.y)>.18?gamepadDirection:{x:stick.x,y:stick.y}}
function dash(){if(state!=='playing'||player.dashCD>0||player.stamina<25||player.heavyWindup>0||RPG.stats(rpg).load>1)return;SFX('dash');let d=direction(),m=Math.hypot(d.x,d.y);if(m<.15){d={x:player.dx,y:player.dy};m=1}player.dashX=d.x/m;player.dashY=d.y/m;player.dx=player.dashX;player.dy=player.dashY;player.stamina-=25;player.dashCD=.55;player.dashTime=.22;player.invuln=.30;spark(player.x,player.y,'#70e5f6',14)}
function die(){SFX('death');RPG.death(rpg,roomKey(),player.x,player.y);if(profiles[slot])profiles[slot].rpg=rpg;persist();player.hp=0;refreshHUD();$('deathInfo').textContent=`Você caiu na sala ${wave}. Sua Essência ficou no local da morte. Frascos e Almas Cristalizadas foram preservados.`;setPage('dead')}
function update(dt){if(state!=='playing')return;clock+=dt;arenaTime+=dt;bossTitleTime=Math.max(0,bossTitleTime-dt);if(bossTitleTime<=0)$('bossBanner').hidden=true;const p=player;p.attackCD=Math.max(0,p.attackCD-dt);
 if(p.heavyWindup>0){p.heavyWindup=Math.max(0,p.heavyWindup-dt);if(p.heavyWindup===0)strike(true)}
 p.attackTimer=Math.max(0,p.attackTimer-dt);p.dashCD=Math.max(0,p.dashCD-dt);p.dashTime=Math.max(0,p.dashTime-dt);p.invuln=Math.max(0,p.invuln-dt);p.flash=Math.max(0,p.flash-dt);p.healCD=Math.max(0,p.healCD-dt);healingAnim=Math.max(0,healingAnim-dt);roomToast=Math.max(0,roomToast-dt);restPose=Math.max(0,restPose-dt);updateSnow(dt);p.stamina=Math.min(p.maxStamina,p.stamina+dt*23);
 let move=restPose>0?{x:0,y:0}:direction(),len=Math.hypot(move.x,move.y);if(len>.12&&p.dashTime<=0){p.dx=move.x/len;p.dy=move.y/len;}const gearSpeed=RPG.stats(rpg).move;let vx=p.dashTime>0?p.dashX*510:move.x*(p.gender==='feminino'?268:255)*gearSpeed,vy=p.dashTime>0?p.dashY*510:move.y*(p.gender==='feminino'?268:255)*gearSpeed;p.x=clamp(p.x+vx*dt,44,W-44);p.y=clamp(p.y+vy*dt,44,H-44);p.moving=Math.hypot(vx,vy)>38;p.animTime=(p.animTime||0)+(p.moving?dt*2.5:dt*.1);
 if(p.moving&&p.dashTime<=0){footstepClock-=dt;if(footstepClock<=0){SFX('step');footstepClock=p.gender==='feminino'?.30:.34}}else footstepClock=0;if(rpg.drop?.room===roomKey()&&Math.hypot(player.x-rpg.drop.x,player.y-rpg.drop.y)<44){const taken=RPG.recover(rpg);notice='ESSÊNCIA RECUPERADA · +'+taken.toLocaleString('pt-BR');roomToast=3;persist()}updateTraps(dt);if(roomCleared){const d=roomDoors();
 if(d.north&&p.y<58&&Math.abs(p.x-W/2)<67){travel(0,1);return}
 if(d.south&&p.y>H-58&&Math.abs(p.x-W/2)<67){travel(0,-1);return}
 if(d.west&&p.x<58&&Math.abs(p.y-H/2)<72){travel(-1,0);return}
 if(d.east&&p.x>W-58&&Math.abs(p.y-H/2)<72){travel(1,0);return}}
if(touchAttack.held||padAttackHeld||keys.has('j')||keys.has(' '))attack();
 for(const e of enemies){const ox=e.x,oy=e.y;updateEnemy(e,dt);e.moving=Math.hypot(e.x-ox,e.y-oy)>dt*9;e.animTime=(e.animTime||0)+(e.moving?dt*2.3:dt*.08);if(state!=='playing')break}
 if(state!=='playing')return;
 for(let i=projectiles.length-1;i>=0;i--){const b=projectiles[i];b.x+=b.vx*dt;b.y+=b.vy*dt;b.life-=dt;if(b.life<=0||b.x<26||b.y<24||b.x>W-26||b.y>H-24){projectiles.splice(i,1);continue}if(Math.hypot(b.x-p.x,b.y-p.y)<b.r+p.r){applyPlayerDamage(b.dmg,b.x,b.y);projectiles.splice(i,1);if(state!=='playing')return;}}
 for(let i=enemies.length-1;i>=0;i--)if(enemies[i].hp<=0){const e=enemies[i];spark(e.x,e.y,e.type==='boss'?'#d7a7ff':'#a2f4cb',e.type==='boss'?42:14);enemies.splice(i,1);kills++;
 const gained=e.type==='boss'?(e.kind==='executioner'?2000:1050):RPG.killReward(e.type,roomDepth);rpg.essence+=gained;essenceToast=2.2;
 if(e.type==='mimic'){const key=roomKey();if(!rpg.openedChests.includes(key))rpg.openedChests.push(key);const loot=rewardChest(chest||{key});RPG.addItem(rpg,loot);chest=null;notice='MÍMICO DERROTADO · '+RPG.definitions[loot].name.toUpperCase();roomToast=4;saveCheckpoint()}
 if(e.type==='boss'){RPG.addItem(rpg,e.kind==='executioner'?'executioner_boss_soul':'corrupted_boss_soul');notice='ALMA CRISTALIZADA DO CHEFE ADQUIRIDA';roomToast=4.5;}
 p.stamina=Math.min(p.maxStamina,p.stamina+(e.type==='boss'?20:8))}
 if(enemies.length===0&&!roomCleared){roomCleared=true;doorOpen=true;clearedRooms.add(roomKey());
 const bossRoom=roomX===0&&(roomDepth===12||roomDepth===MAX_DEPTH);
 if(bossRoom){defeatedBosses.add(roomKey());saveCheckpoint();}
 notice=roomDepth===MAX_DEPTH&&bossRoom?'PÁTIO EXTERNO CONCLUÍDO · A PRÓXIMA ÁREA VIRÁ NA DEMO FUTURA':bossRoom?'CHEFE DERROTADO · CAMINHO LIBERADO':'SALA LIMPA · PASSAGENS LIBERADAS';roomToast=bossRoom?8:4;if(roomDepth===MAX_DEPTH&&bossRoom){setPage('ending');renderEnding();}}

 for(let i=particles.length-1;i>=0;i--){const q=particles[i];q.x+=q.vx*dt;q.y+=q.vy*dt;q.life-=dt;if(q.life<=0)particles.splice(i,1)}shake=Math.max(0,shake-dt);refreshHUD();}
function drawMimic(c,e){c.save();c.translate(e.x,e.y);let wobble=Math.sin(arenaTime*8)*3;c.fillStyle='#291c24';c.fillRect(-30,-12+wobble,60,44);c.fillStyle='#8c5a50';c.fillRect(-33,-30+wobble,66,24);c.strokeStyle='#d2b08b';c.lineWidth=5;c.strokeRect(-31,-12+wobble,62,44);c.fillStyle='#e6c7a1';for(let x=-26;x<=22;x+=11){c.beginPath();c.moveTo(x,1+wobble);c.lineTo(x+5,16+wobble);c.lineTo(x+10,1+wobble);c.fill()}c.fillStyle='#f7e3a7';c.fillRect(-18,-20+wobble,9,5);c.fillRect(10,-20+wobble,9,5);c.strokeStyle='#392335';c.lineWidth=7;for(const x of [-20,20]){c.beginPath();c.moveTo(x,29);c.lineTo(x*1.3,44+Math.sin(arenaTime*7+x)*4);c.stroke()}if(e.windup>0){c.strokeStyle='#ffbd7e';c.lineWidth=3;c.beginPath();c.arc(0,0,43,0,Math.PI*2);c.stroke()}c.restore()}
function render(){ctx.clearRect(0,0,W,H);ctx.save();if(shake)ctx.translate(rand(-3,3),rand(-3,3));
 window.DeadWorld.drawBackground(ctx,roomX,roomDepth);
 ctx.fillStyle='#101721';ctx.fillRect(0,0,W,33);ctx.fillRect(0,H-30,W,30);ctx.fillRect(0,0,31,H);ctx.fillRect(W-31,0,31,H);
 for(const [x,y] of [[110,93],[W-110,93],[110,H-92],[W-110,H-92]]){ctx.fillStyle='#090f1a88';ctx.beginPath();ctx.ellipse(x+7,y+14,34,14,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#3d4c5e';ctx.fillRect(x-22,y-24,44,48);ctx.fillStyle='#526174';ctx.fillRect(x-27,y-29,54,13);ctx.fillStyle='#182638';ctx.fillRect(x-15,y-8,30,23);ctx.fillStyle='#384c62';ctx.fillRect(x-26,y+19,52,10);ctx.fillStyle='#9e6f53';ctx.fillRect(x-4,y-35,8,9);ctx.shadowColor='#f9a45a';ctx.shadowBlur=18;ctx.fillStyle='#f6bb69';ctx.beginPath();ctx.ellipse(x,y-40,6,10,Math.sin(arenaTime*3)*.2,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0}
 // Saídas se adaptam ao mapa: norte, sul, oeste e leste.
 window.DeadWorld.drawPassages(ctx,roomDoors(),roomCleared);
 // Fogueira fixa no mapa: só pode ser usada quando a sala estiver segura.
 if(bonfire){window.DeadWorld.bonfire(ctx,bonfire.x,bonfire.y,arenaTime,nearFire());
 if(nearFire()&&state==='playing'){
 ctx.fillStyle='#f8e7bf';ctx.font='bold 13px system-ui';ctx.textAlign='center';
 ctx.fillText('[E / A] SENTAR NA FOGUEIRA',bonfire.x,bonfire.y-119);ctx.textAlign='left';}}
 // Baús de ferro e madeira, e placas de armadilhas no chão.
 for(const q of trapTiles){const pulse=(arenaTime+q.offset)%4.1;ctx.save();ctx.translate(q.x,q.y);ctx.fillStyle=q.active?'#902b37bb':q.warning?'#c49a4b7a':'#45576a66';ctx.strokeStyle=q.active?'#ff8a85':'#859aaa';ctx.lineWidth=3;ctx.fillRect(-q.r,-q.r*.65,q.r*2,q.r*1.3);ctx.strokeRect(-q.r,-q.r*.65,q.r*2,q.r*1.3);for(let k=-1;k<=1;k++){ctx.beginPath();ctx.moveTo(k*17,-q.r*.5);ctx.lineTo(k*17+4,q.r*.5);ctx.stroke()}if(q.active){ctx.fillStyle='#f4bdab';ctx.fillRect(-q.r+6,-q.r*.4,q.r*2-12,8)}ctx.restore()}
 if(chest){ctx.save();ctx.translate(chest.x,chest.y);ctx.fillStyle='#080f1a99';ctx.beginPath();ctx.ellipse(2,21,37,13,0,0,Math.PI*2);ctx.fill();ctx.fillStyle=chest.awake?'#75403b':'#65503b';ctx.fillRect(-29,-3,58,31);ctx.fillStyle='#917454';ctx.fillRect(-31,-19,62,19);ctx.fillStyle='#c2a36e';for(const dx of [-22,17])ctx.fillRect(dx,-20,5,51);ctx.fillRect(-8,-5,16,12);ctx.fillStyle='#2d2222';ctx.fillRect(-5,-3,10,8);if(nearChest()){ctx.fillStyle='#f0ddaa';ctx.font='bold 12px system-ui';ctx.textAlign='center';ctx.fillText('[A / E] ABRIR BAÚ',0,-35);ctx.textAlign='left'}ctx.restore()}
 if(rpg.drop?.room===roomKey()){const d=rpg.drop;ctx.save();ctx.translate(d.x,d.y);ctx.shadowColor='#a5e8fa';ctx.shadowBlur=25;ctx.fillStyle='#9ddff3';ctx.beginPath();ctx.arc(0,Math.sin(arenaTime*2)*4,17,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;ctx.fillStyle='#e8f7ff';ctx.textAlign='center';ctx.font='bold 11px system-ui';ctx.fillText('ESSÊNCIA PERDIDA',0,-29);ctx.textAlign='left';ctx.restore()}
 // Partículas de neve animadas, com vento lateral constante.
 for(const q of snow){ctx.fillStyle='rgba(219,237,248,.70)';ctx.beginPath();ctx.arc(q.x,q.y,q.r,0,Math.PI*2);ctx.fill()}
 if(roomToast>0){ctx.fillStyle='#0b1823c9';ctx.fillRect(185,H-131,590,44);ctx.fillStyle='#f4e6c8';ctx.textAlign='center';ctx.font='bold 14px Georgia';ctx.fillText(notice,W/2,H-104,555);ctx.textAlign='left'}
 for(const b of projectiles){ctx.shadowColor=b.color;ctx.shadowBlur=14;ctx.fillStyle=b.color;ctx.beginPath();ctx.arc(b.x,b.y,b.r,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0}
 for(const e of enemies){const boss=e.type==='boss',r=e.r;ctx.fillStyle='#040a11a8';ctx.beginPath();ctx.ellipse(e.x+5,e.y+r*.75,r*1.2,10,0,0,Math.PI*2);ctx.fill();
 if(e.telegraph){const t=e.telegraph;ctx.save();ctx.globalAlpha=.18+.27*(1-t.t/t.initial);ctx.strokeStyle='#ff7a7a';ctx.fillStyle='#f24e6380';ctx.lineWidth=5;if(t.type==='slam'){ctx.beginPath();ctx.arc(e.x,e.y,t.radius,0,Math.PI*2);ctx.fill();ctx.stroke()}else if(t.type==='dash'||t.type==='doubleDash'){ctx.beginPath();ctx.moveTo(e.x,e.y);ctx.lineTo(e.x+Math.cos(t.angle)*t.range,e.y+Math.sin(t.angle)*t.range);ctx.stroke()}else if(['fan','wideFan','line'].includes(t.type)){const spread=t.type==='wideFan'?.72:t.type==='line'?.17:.48;ctx.beginPath();ctx.moveTo(e.x,e.y);ctx.arc(e.x,e.y,175,t.angle-spread,t.angle+spread);ctx.closePath();ctx.fill();ctx.stroke()}else{ctx.beginPath();ctx.arc(e.x,e.y,t.type==='cross'?120:90,0,Math.PI*2);ctx.stroke()}ctx.restore()}
 if(e.windup>0){ctx.strokeStyle='#ffce6c';ctx.lineWidth=3;ctx.beginPath();ctx.arc(e.x,e.y,r+9,0,Math.PI*2);ctx.stroke()}
 // Sprite humanoide pré-renderizado: elmo, torso, braços, pernas, capa e arma distinta.
 if(e.type==='mimic'){drawMimic(ctx,e);continue}const variant=boss?e.kind:'';
 const type=boss?'boss':e.type;
 window.DeadActors?.draw(ctx,type,e.x,e.y,r,variant,!!e.flash,e.animTime||0,player&&player.x<e.x?-1:1,!!e.moving,e.windup>0);
 if(e.hp<e.maxHp&&!boss){ctx.fillStyle='#090f1b';ctx.fillRect(e.x-23,e.y-r-15,46,6);ctx.fillStyle='#d97985';ctx.fillRect(e.x-23,e.y-r-15,46*Math.max(0,e.hp)/e.maxHp,6)}}
 if(player){const p=player;
 ctx.fillStyle='#030a14a8';ctx.beginPath();ctx.ellipse(p.x,p.y+16,19,8,0,0,Math.PI*2);ctx.fill();
 if(p.dashTime>0){ctx.fillStyle='#8be4f855';ctx.beginPath();ctx.moveTo(p.x-p.dx*20-p.dy*14,p.y-p.dy*20+p.dx*14);ctx.lineTo(p.x-p.dx*78,p.y-p.dy*78);ctx.lineTo(p.x-p.dx*20+p.dy*14,p.y-p.dy*20-p.dx*14);ctx.fill()}
 ctx.globalAlpha=p.invuln>0&&Math.floor(performance.now()/85)%2===0?.56:1;
 window.DeadActors?.draw(ctx,p.gender==='feminino'?'female':'male',p.x,p.y,p.gender==='feminino'?19:22,'',p.flash>0,p.animTime||0,p.dx<0?-1:1,!!p.moving,p.attackTimer>0||p.heavyWindup>0);
 ctx.globalAlpha=1;
 if(healingAnim>0){ctx.strokeStyle='#f7ce8b';ctx.lineWidth=5;ctx.beginPath();ctx.arc(p.x,p.y,32+healingAnim*24,0,Math.PI*2);ctx.stroke()}
 if(p.heavyWindup>0){ctx.strokeStyle='#f3be78';ctx.lineWidth=4;ctx.beginPath();ctx.arc(p.x,p.y,41,-Math.PI/2,-Math.PI/2+Math.PI*2*(1-p.heavyWindup/.46));ctx.stroke()}
 if(p.attackTimer>0){ctx.strokeStyle=p.attackCD>.7?'#ffd29b':'#b3ffeb';ctx.lineWidth=9;ctx.lineCap='round';ctx.beginPath();const a=Math.atan2(p.dy,p.dx);ctx.arc(p.x,p.y,66,a-.8,a+.8);ctx.stroke()}}
 for(const part of particles){ctx.globalAlpha=Math.max(0,part.life/part.maxLife);ctx.fillStyle=part.col;ctx.fillRect(part.x,part.y,5,5)}ctx.globalAlpha=1;
 const boss=enemies.find(e=>e.type==='boss'||e.type==='mimic');if(boss){const bw=360,bx=(W-bw)/2,by=46;ctx.fillStyle='#0a121ccf';ctx.fillRect(bx-7,by-7,bw+14,33);ctx.fillStyle='#512b43';ctx.fillRect(bx,by,bw,12);ctx.fillStyle=boss.color;ctx.fillRect(bx,by,bw*Math.max(0,boss.hp)/boss.maxHp,12);ctx.fillStyle='#f8ecdd';ctx.textAlign='center';ctx.font='bold 14px Georgia,serif';ctx.fillText(boss.name,W/2,by+28);ctx.textAlign='left'}
 if(!boss){ctx.fillStyle='#0a1921c9';ctx.fillRect(226,62,508,28);ctx.fillStyle='#cddcea';ctx.font='bold 13px system-ui';ctx.textAlign='center';ctx.fillText(roomName(),W/2,81,485);ctx.textAlign='left'}ctx.restore()}
let frameStamp=0;
function loop(now){requestAnimationFrame(loop);if(now-frameStamp<33)return;const dt=last?Math.min(.05,(now-last)/1000):0;frameStamp=now;last=now;pollPad(dt);if(state==='intro'){introElapsed+=dt;if(introElapsed>=15){introElapsed=0;if(introPage<INTRO.length-1){introPage++;renderIntro()}else finishIntro()}}if(state==='playing'){update(dt);render()}else if(!menuDrawn){render();menuDrawn=true}}
let menuDrawn=false;requestAnimationFrame(loop);
// Menu e saves
$('goSaves').onclick=()=>{enterFullscreen();profileList();setPage('saves')};$('backHome').onclick=menuHome;$('exitHome').onclick=()=>setPage('exit');$('exitBack').onclick=menuHome;
let typedName='',selectedGender='masculino';
function updateName(){ $('typedName').textContent=typedName||'SEU NOME...';$('confirmCreate').disabled=!typedName.trim(); }
function editName(k){if(k==='back')typedName=typedName.slice(0,-1);else if(k==='space'){if(typedName.length<16)typedName+=' '}else if(k==='ok'){createProfile();return}else if(typedName.length<16)typedName+=k;updateName();}
function makeKeyboard(){const keyboard=$('letterKeyboard');keyboard.replaceChildren();for(const key of 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'){const btn=document.createElement('button');btn.type='button';btn.textContent=key;btn.setAttribute('aria-label','Adicionar '+key);btn.onclick=()=>editName(key);keyboard.append(btn)}for(const [label,key] of [['ESPAÇO','space'],['APAGAR','back'],['PRONTO','ok']]){const btn=document.createElement('button');btn.textContent=label;btn.type='button';btn.className='wideKey';btn.onclick=()=>editName(key);keyboard.append(btn)}}
function chooseGender(g){selectedGender=g;$('genderMale').classList.toggle('chosen',g==='masculino');$('genderFemale').classList.toggle('chosen',g==='feminino');}
function createProfile(){if(profiles.length>=3||!typedName.trim())return;profiles.push({name:typedName.trim().slice(0,16),gender:selectedGender,rpg:RPG.fresh(selectedGender),wave:1,checkpointRoom:1,checkpointDepth:0,checkpointX:0,defeatedBosses:[],kills:0,clock:0});if(persist()){profileList();selectProfile(profiles.length-1)}else{profiles.pop();setPage('saves')}}
$('createSave').onclick=()=>{if(profiles.length>=3)return;typedName='';chooseGender('masculino');updateName();setPage('create')};
$('genderMale').onclick=()=>chooseGender('masculino');$('genderFemale').onclick=()=>chooseGender('feminino');$('confirmCreate').onclick=createProfile;$('cancelCreate').onclick=()=>setPage('saves');makeKeyboard();

$('healBtn').onclick=()=>{recalculatePlayer(true);player.hp=player.maxHp;player.stamina=player.maxStamina;player.flasks=HEALS_MAX;refreshHUD();$('restHint').textContent='Vida, vigor e 3 frascos restaurados!'};
$('saveBtn').onclick=()=>{$('restHint').textContent=saveCheckpoint()?'Jornada salva nesta fogueira!':'Não foi possível salvar.'};$('startWave').onclick=()=>{setPage('playing')};$('restToMenu').onclick=menuHome;
$('retryBtn').onclick=()=>{const d=profiles[slot];if(d){roomDepth=checkpointDepth;roomX=checkpointX;wave=roomDepth+1;checkpointRoom=wave;kills=d.kills||0;clock=d.clock||0;clearedRooms=new Set([...defeatedBosses]);for(const depth of FIRE_DEPTHS)clearedRooms.add(roomKey(0,depth));player=makePlayer();enterRoom()}else menuHome()};$('deathMenu').onclick=menuHome;
$('resumeBtn').onclick=()=>setPage('playing');$('pauseSave').onclick=()=>{$('statusText').textContent='Salve interagindo com uma fogueira segura'};$('pauseMenu').onclick=menuHome;
function pause(){if(state==='playing')setPage('paused');else if(state==='paused')setPage('playing')}$('pauseBtn').onclick=pause;$('menuBtn').onclick=()=>{if(state==='playing')setPage('paused');else menuHome()};

let introPage=0;
const INTRO=[
 {head:'I · A QUEDA',text:'Há muito tempo, um rei, seus fiéis súditos e todo o seu reino foram consumidos por uma praga aparentemente infinita. Desesperados por uma cura, procuraram respostas onde jamais deveriam ter procurado. Mas, em vez da salvação, encontraram a loucura.'},
 {head:'II · O SACRIFÍCIO',text:'Acreditando que o sangue e as almas dos cidadãos poderiam destruir a praga, o rei e seus seguidores sacrificaram o próprio povo. A praga apenas se espalhou. Todos os que carregavam a marca sofreram até perder a sanidade... e, por fim, a própria alma.'},
 {head:'III · A ALMA QUE RESISTE',text:'Mas você... você é diferente. Uma alma marcada, sim. Porém, há algo que a praga não conseguiu consumir: vontade. Resistência. Uma chama que insiste em permanecer acesa. Será você a chama que consumirá a praga e devolverá a paz a este reino morto?'}
];
function renderIntro(){introElapsed=0;const data=INTRO[introPage];$('introCount').textContent=`${introPage+1} / ${INTRO.length}`;$('introTitle').textContent=data.head;$('introText').textContent=data.text;$('introNext').textContent=introPage===2?'DESPERTAR NO PÁTIO EXTERNO':'CONTINUAR';$('menuIntro').dataset.scene=String(introPage+1)}
function finishIntro(){sessionStorage.setItem('dead-souls-intro-viewed','1');enterRoom();}
$('introNext').onclick=()=>{if(introPage<2){introPage++;renderIntro()}else finishIntro()};
$('introSkip').onclick=finishIntro;

// Inventário e atributos com controles por eixo X/Y do gamepad.
let inventorySelection=null;
function openInventory(){if(state!=='playing'&&state!=='paused'&&state!=='attributes')return;renderInventory();setPage('inventory')}
function renderInventory(){const list=$('inventoryList');list.replaceChildren();const ids=Object.entries(rpg.items).filter(([id,n])=>n>0&&RPG.definitions[id]);if(!ids.length){$('itemDescription').textContent='Seu inventário está vazio.';return}
 const chosen=ids.find(([id])=>id===inventorySelection)?.[0]||ids[0][0];inventorySelection=chosen;
 for(const [id,count] of ids){const item=RPG.definitions[id],b=document.createElement('button');b.type='button';b.className='inventoryItem'+(id===chosen?' selected':'');b.textContent=item.name+' ×'+count;b.onclick=()=>{inventorySelection=id;updateInventoryDetail();for(const el of list.children)el.classList.toggle('selected',el.dataset.item===id)};b.dataset.item=id;list.append(b)}updateInventoryDetail()}
function updateInventoryDetail(){const d=RPG.definitions[inventorySelection];if(!d)return;$('itemDescription').textContent=d.desc;$('itemStats').textContent=d.category.toUpperCase()+(d.weight?' · Peso '+d.weight:'')+(d.essence?' · +'+d.essence.toLocaleString('pt-BR')+' Essências':'')+(rpg.equipped[d.category]===inventorySelection?' · EQUIPADO':'');$('inventoryUse').textContent=d.category==='alma'?'CONSUMIR ALMA':'EQUIPAR';$('inventoryUse').disabled=!['arma','armadura','pingente','alma'].includes(d.category);$('inventoryEssence').textContent=Number(rpg.essence).toLocaleString('pt-BR')}
function useInventoryItem(){const id=inventorySelection,d=RPG.definitions[id];if(!d)return;let message='';if(d.category==='alma'){const gained=RPG.consumeSoul(rpg,id);if(!gained)return;message='+'+gained.toLocaleString('pt-BR')+' ESSÊNCIAS'}else if(RPG.equip(rpg,id)){recalculatePlayer();message=d.name.toUpperCase()+' EQUIPADO';}if(message){notice=message;roomToast=3;if(profiles[slot])profiles[slot].rpg=rpg;persist();renderInventory();refreshHUD(true)}}
function openAttributes(){if(!['playing','paused','inventory'].includes(state))return;renderAttributes();setPage('attributes')}
function renderAttributes(){const list=$('attributesList');list.replaceChildren();const allowed=nearFire()&&enemies.length===0;
 $('levelSummary').textContent=`NÍVEL ${rpg.level} · ESSÊNCIA ${rpg.essence.toLocaleString('pt-BR')} · PRÓXIMO NÍVEL ${RPG.cost(rpg.level).toLocaleString('pt-BR')}`;
 $('levelNotice').textContent=allowed?'Fogueira próxima: você pode evoluir.':'Para subir de nível, aproxime-se de uma fogueira segura.';
 for(const [id,a] of Object.entries(RPG.attrs)){const b=document.createElement('button');b.type='button';b.className='attributeButton';b.disabled=!allowed||rpg.essence<RPG.cost(rpg.level)||rpg.attributes[id]>=99;b.textContent=a.name+' · '+rpg.attributes[id]+'  +';b.title=a.detail;b.onclick=()=>{if(!nearFire()||enemies.length||!RPG.levelUp(rpg,id))return;recalculatePlayer();saveCheckpoint();renderAttributes();refreshHUD(true)};list.append(b)}
 const stats=RPG.stats(rpg);$('equipSummary').textContent=`VIDA ${stats.hp} · STAMINA ${stats.stamina} · DEFESA ${Math.round(stats.defense*100)}% · CARGA ${stats.weight.toFixed(1)} / ${stats.capacity.toFixed(1)}`;
}
$('inventoryBtn').onclick=openInventory;$('attributesBtn').onclick=openAttributes;
$('pauseInventory').onclick=openInventory;$('pauseAttributes').onclick=openAttributes;
$('inventoryBack').onclick=()=>setPage('playing');$('inventoryUse').onclick=useInventoryItem;
$('attributesBack').onclick=()=>setPage('playing');$('endingContinue').onclick=()=>setPage('playing');$('endingMenu').onclick=menuHome;
function renderEnding(){$('endingSummary').textContent='Você venceu o Cavaleiro Corrompido e o Executor do Palácio. O Pátio Externo foi libertado, mas cinco regiões do reino continuam tomadas pela praga.';refreshHUD(true)}
// Joystick com movimento analógico de 360° e intensidade proporcional
const joy=$('joystick'),knob=$('joystickKnob');function releaseStick(){stick.x=0;stick.y=0;stick.pointer=null;if(knob)knob.style.transform='translate(0px, 0px)';joy?.classList.remove('held')}
function readStick(e){const r=joy.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2;let x=e.clientX-cx,y=e.clientY-cy;const max=r.width*.30,dist=Math.hypot(x,y),scale=dist>max?max/dist:1;x*=scale;y*=scale;stick.x=Math.abs(x/max)<.13?0:x/max;stick.y=Math.abs(y/max)<.13?0:y/max;knob.style.transform=`translate(${x}px, ${y}px)`}
joy.addEventListener('pointerdown',e=>{e.preventDefault();if(stick.pointer!==null)return;stick.pointer=e.pointerId;joy.setPointerCapture(e.pointerId);joy.classList.add('held');readStick(e)});joy.addEventListener('pointermove',e=>{if(stick.pointer!==e.pointerId)return;e.preventDefault();readStick(e)});for(const k of ['pointerup','pointercancel','lostpointercapture'])joy.addEventListener(k,e=>{if(stick.pointer===e.pointerId)releaseStick()});
function bindAction(id,fn,continuous=false){const b=$(id);b.addEventListener('pointerdown',e=>{e.preventDefault();b.setPointerCapture(e.pointerId);b.classList.add('active');if(continuous)touchAttack.held=true;fn()});for(const k of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(k,()=>{b.classList.remove('active');if(continuous)touchAttack.held=false})}bindAction('attackBtn',attack,true);bindAction('strongAttackBtn',strongAttack);bindAction('dashBtn',dash);bindAction('healActionBtn',heal);bindAction('interactBtn',interact);
window.addEventListener('keydown',e=>{if(state==='create'&&!e.ctrlKey&&!e.altKey){if(e.key==='Backspace'){e.preventDefault();editName('back');return}if(e.key==='Enter'){createProfile();return}if(e.key.length===1&&/[a-zA-Z0-9 ]/.test(e.key)){e.preventDefault();editName(e.key===' '?'space':e.key.toUpperCase());return}}const k=e.key.toLowerCase();if(['arrowup','arrowdown','arrowleft','arrowright',' ','shift'].includes(k))e.preventDefault();if(!keys.has(k)){if(k==='shift'||k==='k')dash();if(k==='l')strongAttack();if(k==='escape'){if(['inventory','attributes'].includes(state))setPage('playing');else pause()}if(k==='i')openInventory();if(k==='u')openAttributes();if(k==='e')interact();if(k==='h'||k==='q')heal()}keys.add(k)});window.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));window.addEventListener('blur',()=>{keys.clear();releaseStick();touchAttack.held=false;if(state==='playing')pause()});document.addEventListener('visibilitychange',()=>{if(document.hidden&&state==='playing')pause()});
async function enterFullscreen(){try{if(!document.fullscreenElement){await document.documentElement.requestFullscreen?.({navigationUI:'hide'})}await screen.orientation?.lock?.('landscape')}catch(e){const hint=$('orientationHint');if(hint)hint.textContent='Gire o celular; o navegador pode limitar a tela cheia.'}}
$('fullscreenBtn').onclick=enterFullscreen;$('quickFullscreen').onclick=enterFullscreen;$('settingsFullscreen').onclick=enterFullscreen;
$('homeSettings').onclick=()=>{settingsFrom='home';setPage('settings')};$('pauseSettings').onclick=()=>{settingsFrom='paused';setPage('settings')};$('settingsBack').onclick=()=>setPage(settingsFrom);
window.addEventListener('gamepadconnected',()=>{gamepadActive=true;$('touchControls').hidden=true});
window.addEventListener('gamepaddisconnected',()=>{gamepadActive=false;$('touchControls').hidden=state!=='playing'});
window.DeadActors?.preload();generateSnow();player=makePlayer();refreshHUD(true);setPage('home');initDatabase();
// Diagnósticos mínimos para testes automatizados, sem alterar o jogo.
window.DeadSoulsDebug={getRPG:()=>rpg,grantItem:(id,n=1)=>RPG.addItem(rpg,id,n),giveEssence:n=>rpg.essence+=n,openInventory,openAttributes,getState:()=>({state,roomX,roomDepth,checkpointX,checkpointDepth,roomCleared,bonfire:!!bonfire,enemies:enemies.length,flasks:player?.flasks,hp:player?.hp,bosses:[...defeatedBosses],essence:rpg.essence,level:rpg.level,chest:chest?.kind,drop:rpg.drop,trapCount:trapTiles.length,cleared:[...clearedRooms]}),travel,restAtFire,enterRoom,roomExists,roomDoors,applyPlayerDamage,player:()=>player,clearEnemies:()=>{enemies.forEach(e=>e.hp=0)}};
})();
