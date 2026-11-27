// Dead Souls — Pré-Demo 1.1.3 Fixed: trilhas originais, vozes de dano restauradas e fallback sonoro.
(()=>{'use strict';
const KEY='dead-souls-audio-v04';
let ctx=null, enabled=true, volume=.55,lastUi=0,lastVocal=0;
try{const p=JSON.parse(localStorage.getItem(KEY)||'{}');enabled=p.enabled!==false;volume=Math.min(1,Math.max(0,Number(p.volume??.55)));}catch{}
const samples={hitMale:'dano-masculino.mp3',hitFemale:'dano-feminino.mp3',death:'morte.mp3'};
const clips={};
const songs={menu:'musica-menu.ogg',bonfire:'musica-fogueira.ogg',boss:'musica-chefe.ogg'};
const music={};let scene='menu',musicLevel={menu:0,bonfire:0,boss:0};
function synthReady(){try{const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return false;if(!ctx)ctx=new AC();if(ctx.state==='suspended')ctx.resume().catch(()=>{});return ctx.state==='running'}catch{return false}}
function note(freq,to,dur,type='sine',amp=.08,delay=0){if(!enabled||!synthReady())return;try{let t=ctx.currentTime+delay;const o=ctx.createOscillator(),g=ctx.createGain();o.type=type;o.frequency.setValueAtTime(Math.max(1,freq),t);o.frequency.exponentialRampToValueAtTime(Math.max(1,to),t+dur);g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(Math.max(.00011,amp*volume),t+.009);g.gain.exponentialRampToValueAtTime(.0001,t+dur);o.connect(g);g.connect(ctx.destination);o.start(t);o.stop(t+dur+.02)}catch{}}
function fallbackVocal(name){ // Se o arquivo não puder tocar, o jogo nunca ficará sem feedback.
 if(name==='death'){note(270,65,.70,'sawtooth',.14);note(160,40,.85,'triangle',.11,.08)}
 else{note(215,65,.19,'sawtooth',.14);note(95,48,.24,'triangle',.09)}
}
function getClip(name){if(!clips[name]&&'Audio'in window){const e=new Audio(samples[name]);e.preload='auto';e.load();clips[name]=e}return clips[name]}
function voice(name){const now=performance.now();if(name!=='death'&&now-lastVocal<240)return;
 if(name!=='death')lastVocal=now;
 if(name==='death'){for(const n of ['hitMale','hitFemale']){try{clips[n]?.pause()}catch{}}}
 const clip=getClip(name);if(!clip){fallbackVocal(name);return}
 try{clip.pause();clip.currentTime=0;clip.volume=Math.min(1,volume*(name==='death'?.90:1));const pending=clip.play();
 if(pending&&typeof pending.catch==='function')pending.catch(()=>fallbackVocal(name));
 }catch{fallbackVocal(name)}
}
function ensureMusic(name){if(!music[name]&&'Audio'in window){let el=new Audio(songs[name]);el.loop=true;el.preload='auto';el.volume=0;music[name]=el}return music[name]}
function resumeMusic(){if(!enabled||document.hidden||!(scene in songs))return;const e=ensureMusic(scene);if(!e)return;
 if(e.paused)e.play().catch(()=>{});}
function unlock(){if(enabled){synthReady();resumeMusic()}}
function setScene(next){if(!(next in songs)&&next!=='silence')return;if(scene===next)return;scene=next;resumeMusic()}
// 10fps de transição sonora, sem timers por frame e sem downloads de música.
setInterval(()=>{for(const name of Object.keys(songs)){const e=music[name];if(!e)continue;
 const goal=enabled&&!document.hidden&&scene===name?volume*(name==='boss'?.20:name==='bonfire'?.20:.17):0;
 musicLevel[name]=Math.max(0,Math.min(1,(musicLevel[name]||0)+Math.max(-.045,Math.min(.045,goal-(musicLevel[name]||0)))));
 try{e.volume=musicLevel[name];if(goal===0&&musicLevel[name]<.001&&!e.paused)e.pause()}catch{}
 }},100);
function play(name){if(!enabled)return;if(samples[name]){voice(name);return}
 switch(name){
 case'ui':{let now=performance.now();if(now-lastUi<70)return;lastUi=now;note(580,395,.065,'triangle',.05);break}
 case'attack':note(380,105,.16,'sawtooth',.09);note(160,75,.12,'triangle',.035);break;
 case'hit':fallbackVocal('hitMale');break;
 case'dash':note(700,190,.18,'triangle',.08);break;
 case'step':note(115,65,.052,'triangle',.035);break;
 case'enemy':note(255,85,.13,'triangle',.05);break;
 case'boss':note(150,51,.5,'sawtooth',.12);note(210,62,.48,'triangle',.07,.18);break;
 case'checkpoint':note(380,510,.24,'sine',.07);note(550,730,.35,'triangle',.08,.18);break;
 case'win':note(360,510,.18,'sine',.065);note(470,730,.25,'triangle',.075,.15);break;
 }}
function sync(){for(const e of document.querySelectorAll('[data-sound-toggle]')){e.textContent=enabled?'SOM: LIGADO':'SOM: DESLIGADO';e.setAttribute('aria-pressed',String(enabled))}for(const e of document.querySelectorAll('[data-sound-volume]'))e.value=String(Math.round(volume*100));}
function store(){try{localStorage.setItem(KEY,JSON.stringify({enabled,volume}))}catch{}sync()}
function toggle(){enabled=!enabled;store();if(enabled){unlock();play('ui')}else{for(const e of Object.values(music))e.pause();for(const e of Object.values(clips))e.pause();}}
function setVolume(v){volume=Math.max(0,Math.min(1,Number(v)/100));for(const [key,e] of Object.entries(clips))e.volume=Math.min(1,volume*(key==='death'?.90:1));store()}
window.DeadAudio={play,unlock,sync,setScene,get enabled(){return enabled},toggle,setVolume};
window.addEventListener('pointerdown',unlock,{passive:true,capture:true});window.addEventListener('keydown',unlock,{capture:true});
document.addEventListener('visibilitychange',()=>{if(document.hidden){for(const e of Object.values(music))e.pause()}else resumeMusic()});
document.addEventListener('click',e=>{if(e.target.closest('button')&&!e.target.closest('[data-sound-toggle]'))play('ui')});
document.addEventListener('DOMContentLoaded',()=>{for(const e of document.querySelectorAll('[data-sound-toggle]'))e.addEventListener('click',toggle);for(const e of document.querySelectorAll('[data-sound-volume]'))e.addEventListener('input',e=>setVolume(e.target.value));sync();});
})();
