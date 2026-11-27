// Dead Souls Beta 0.4: sons originais sintetizados com Web Audio. Sem downloads externos.
(()=>{'use strict';let ctx=null,enabled=true,volume=.55,lastUi=0;const KEY='dead-souls-audio-v04';
try{const p=JSON.parse(localStorage.getItem(KEY)||'{}');enabled=p.enabled!==false;volume=Math.max(0,Math.min(1,Number(p.volume??.55)));}catch{}
function unlock(){if(!enabled)return;try{const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;if(!ctx)ctx=new AC();if(ctx.state==='suspended')ctx.resume().catch(()=>{});}catch{}}
function note(freq,to,dur,type='sine',amp=.09,delay=0){if(!enabled)return;unlock();if(!ctx||ctx.state!=='running')return;const t=ctx.currentTime+delay,o=ctx.createOscillator(),g=ctx.createGain();o.type=type;o.frequency.setValueAtTime(Math.max(1,freq),t);o.frequency.exponentialRampToValueAtTime(Math.max(1,to),t+dur);g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(Math.max(.00011,amp*volume),t+.009);g.gain.exponentialRampToValueAtTime(.0001,t+dur);o.connect(g);g.connect(ctx.destination);o.start(t);o.stop(t+dur+.015);}
// Clips fornecidos pelo criador: vozes separadas por personagem e morte.
const SAMPLE_FILES={hitMale:'dano-masculino.mp3',hitFemale:'dano-feminino.mp3',death:'morte.mp3'};
const clips={};let lastVocal=0;
function playClip(name){
  const now=performance.now();
  if(name!=='death'&&now-lastVocal<180)return true;
  const file=SAMPLE_FILES[name];if(!file||!('Audio' in window))return false;
  let clip=clips[name];
  try{
    if(!clip){clip=new Audio(file);clip.preload='auto';clips[name]=clip;}
    if(name==='death')for(const other of ['hitMale','hitFemale']){clips[other]?.pause();}
    else lastVocal=now;
    clip.pause();clip.currentTime=0;clip.volume=Math.min(1,volume*(name==='death'?0.9:1));
    const attempt=clip.play();
    if(attempt&&typeof attempt.catch==='function')attempt.catch(()=>{});
    return true;
  }catch{return false;}
}
function play(name){if(!enabled)return;if(SAMPLE_FILES[name]&&playClip(name))return;switch(name){case'ui':{const now=performance.now();if(now-lastUi<65)return;lastUi=now;note(570,390,.065,'triangle',.05);break;}case'attack':note(380,105,.16,'sawtooth',.09);note(160,75,.12,'triangle',.035);break;case'hit':note(195,50,.22,'square',.13);note(75,38,.26,'triangle',.1);note(270,115,.24,'sawtooth',.08);note(450,170,.16,'triangle',.05,.03);break;case'dash':note(700,190,.18,'triangle',.08);note(390,130,.11,'sine',.06,.035);break;case'death':note(250,55,.75,'triangle',.12);note(125,37,.78,'sawtooth',.08,.12);note(420,70,1.1,'sawtooth',.09,.05);note(190,47,1.0,'triangle',.08,.13);break;case'step':note(115,64,.048,'triangle',.021);note(65,45,.07,'sine',.015);break;case'enemy':note(255,85,.13,'triangle',.046);break;case'boss':note(150,51,.5,'sawtooth',.12);note(210,62,.48,'triangle',.08,.2);break;case'checkpoint':note(380,510,.24,'sine',.07);note(550,730,.35,'triangle',.08,.18);break;case'win':note(360,510,.18,'sine',.065);note(470,730,.25,'triangle',.075,.15);break;}}
function sync(){for(const e of document.querySelectorAll('[data-sound-toggle]')){e.textContent=enabled?'SOM: LIGADO':'SOM: DESLIGADO';e.setAttribute('aria-pressed',String(enabled))}for(const e of document.querySelectorAll('[data-sound-volume]'))e.value=String(Math.round(volume*100));}
function store(){try{localStorage.setItem(KEY,JSON.stringify({enabled,volume}))}catch{}sync();}
window.DeadAudio={play,unlock,sync,get enabled(){return enabled},toggle(){enabled=!enabled;store();if(enabled){unlock();play('ui')}},setVolume(v){volume=Math.max(0,Math.min(1,v/100));for(const [key,clip] of Object.entries(clips))clip.volume=volume*(key==='death'?.9:1);store()}};
window.addEventListener('pointerdown',unlock,{passive:true,capture:true});window.addEventListener('keydown',unlock,{capture:true});
document.addEventListener('click',e=>{if(e.target.closest('button')&&!e.target.closest('[data-sound-toggle]'))play('ui')});
document.addEventListener('DOMContentLoaded',()=>{for(const e of document.querySelectorAll('[data-sound-toggle]'))e.addEventListener('click',()=>window.DeadAudio.toggle());for(const e of document.querySelectorAll('[data-sound-volume]'))e.addEventListener('input',e=>window.DeadAudio.setVolume(Number(e.target.value)));sync()});
})();