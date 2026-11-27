/* Dead Souls Pre-Demo 1.2 — Pátio Externo: cenários pré-renderizados por sala. */
(()=>{'use strict';
const W=960,H=576,cache=new Map(),CAP=4;
function hash(a,b){let n=Math.imul(a+19,73856093)^Math.imul(b+67,19349663)^0x4ca71;return n>>>0}
function random(seed){let t=seed>>>0;return()=>{t=(t+0x6d2b79f5)|0;let x=Math.imul(t^(t>>>15),1|t);x^=x+Math.imul(x^(x>>>7),61|x);return ((x^(x>>>14))>>>0)/4294967296}}
function p(c,pts,col,line=null,w=1){c.beginPath();c.moveTo(pts[0][0],pts[0][1]);for(let i=1;i<pts.length;i++)c.lineTo(pts[i][0],pts[i][1]);c.closePath();c.fillStyle=col;c.fill();if(line){c.strokeStyle=line;c.lineWidth=w;c.stroke()}}
function ellipse(c,x,y,rx,ry,fill,rot=0){c.beginPath();c.ellipse(x,y,Math.max(.1,rx),Math.max(.1,ry),rot,0,Math.PI*2);c.fillStyle=fill;c.fill()}
function stone(c,x,y,s,rng){c.save();c.translate(x,y);const k=.75+rng()*.4;c.scale(k,k);p(c,[[-s*.55,s*.43],[-s*.67,-s*.05],[-s*.25,-s*.50],[s*.33,-s*.47],[s*.62,-s*.10],[s*.51,s*.45]],'#101d2a',null);p(c,[[-s*.55,s*.25],[-s*.53,-s*.17],[-s*.12,-s*.49],[s*.33,-s*.40],[s*.5,-s*.05],[s*.44,s*.31]],'#536576','#233344',1.8);p(c,[[-s*.48,-s*.13],[-s*.11,-s*.41],[s*.16,-s*.35],[s*.05,-s*.03]],'#8398a5a0');c.strokeStyle='#b7c9cd94';c.lineWidth=1.7;c.beginPath();c.moveTo(-s*.39,-s*.15);c.lineTo(-s*.12,-s*.35);c.stroke();c.restore()}
function deadTree(c,x,y,scale,rng){c.save();c.translate(x,y);c.scale(scale,scale);ellipse(c,0,8,43,12,'#08132199');c.lineCap='round';c.strokeStyle='#352d2c';c.lineWidth=15;c.beginPath();c.moveTo(0,2);c.lineTo(-5,-47);c.lineTo(4,-76);c.stroke();c.lineWidth=8;for(const [dx,dy,ex,ey] of [[-5,-49,-35,-80],[-5,-49,27,-94],[4,-72,-16,-109],[3,-62,36,-67]]){c.beginPath();c.moveTo(dx,dy);c.lineTo(ex,ey);c.stroke()}c.strokeStyle='#7a7270';c.lineWidth=2;c.beginPath();c.moveTo(-2,-11);c.lineTo(-5,-55);c.stroke();for(let i=0;i<6;i++)ellipse(c,(rng()-.5)*51,5+(rng()-.5)*21,rng()*7+3,2,'#d4e3eb9c');c.restore()}
function arch(c,x,y,w,h){c.save();c.fillStyle='#0b1622';c.fillRect(x-w/2,y-h/2,w,h);c.beginPath();c.ellipse(x,y-h/2,w/2,32,0,Math.PI,0);c.fill();c.strokeStyle='#4d5a69';c.lineWidth=14;c.beginPath();c.moveTo(x-w/2,y+h/2);c.lineTo(x-w/2,y-h/2+27);c.quadraticCurveTo(x,y-h/2-33,x+w/2,y-h/2+27);c.lineTo(x+w/2,y+h/2);c.stroke();c.strokeStyle='#b4c7cf44';c.lineWidth=2;c.stroke();c.restore()}
function generate(rx,depth){const rng=random(hash(rx,depth)),cn=document.createElement('canvas');cn.width=W;cn.height=H;const c=cn.getContext('2d');
 const gr=c.createLinearGradient(0,0,W,H);gr.addColorStop(0,'#344b5c');gr.addColorStop(.55,'#243745');gr.addColorStop(1,'#152735');c.fillStyle=gr;c.fillRect(0,0,W,H);
 // Lajes irregulares: recortes e desgaste, pré-desenhados uma única vez.
 for(let row=0;row<12;row++){let y=23+row*49;let x=-57+(row%2)*32;while(x<W){const ww=69+rng()*32,hh=44+rng()*7,j=(rng()-.5)*7;const pale=rng();p(c,[[x+4,y+5],[x+ww*.53,y+3+j],[x+ww-3,y+8],[x+ww-5,y+hh-4],[x+10,y+hh-2]],pale>.77?'#334c5b':pale>.36?'#293d4c':'#253746','#132634',2);c.fillStyle='#d0e7e91d';c.fillRect(x+9,y+8,ww-22,2);if(rng()<.32){c.strokeStyle='#132431a9';c.lineWidth=1.8;c.beginPath();c.moveTo(x+ww*.31,y+9);c.lineTo(x+ww*.44,y+21);c.lineTo(x+ww*.36,y+34);c.stroke()}x+=ww+1}}
 // Marcas de batalha, lajotas danificadas, sujeira e pó de neve.
 for(let i=0;i<145;i++){const x=42+rng()*876,y=37+rng()*505;if(rng()<.29){ellipse(c,x,y,5+rng()*16,2+rng()*4,'#d7eff328',rng()*1.3)}else{c.strokeStyle=rng()<.5?'#0b1b2a99':'#b2c5c438';c.lineWidth=1+rng()*1.6;c.beginPath();c.moveTo(x-14,y-6);c.lineTo(x,y+2);c.lineTo(x+8,y-5);c.stroke()}}
 // Borda: muralhas com aparelhamento de pedra, friso e neve acumulada.
 for(const side of [0,1]){const x=side?W-48:0;c.fillStyle='#182737';c.fillRect(x,0,48,H);for(let j=0;j<15;j++){const yy=j*40;for(let b=0;b<2;b++){c.fillStyle=(j+b)%3?'#455767':'#384c5a';c.fillRect(x+3+b*21,yy+2,19,36);c.strokeStyle='#152431';c.strokeRect(x+3+b*21,yy+2,19,36)}c.fillStyle='#d1e3e44d';c.fillRect(x+4,yy+2,37,3)}c.fillStyle='#a9bdc765';c.fillRect(side?W-47:0,0,4,H)}
 // Muralhas ao norte e sul, com ameias danificadas e acumulação de neve.
 for(const side of [0,1]){const y=side?H-35:0;c.fillStyle='#253a49';c.fillRect(0,y,W,35);for(let x=0;x<W;x+=54){const ww=48+rng()*5;c.fillStyle=x%108?'#394d5d':'#475b67';c.fillRect(x+3,y+2,ww,26);c.strokeStyle='#1c2937';c.strokeRect(x+3,y+2,ww,26);c.fillStyle='#c9dfe0a0';c.fillRect(x+5,y+2,ww-6,3)}}
 // Cobertura irregular de neve perto das bordas, sem prejudicar a legibilidade do combate.
 for(let i=0;i<44;i++){const edge=i%4;const x=edge===0?38+rng()*110:edge===1?W-38-rng()*110:rng()*W,y=edge===2?30+rng()*82:edge===3?H-30-rng()*82:rng()*H;ellipse(c,x,y,8+rng()*22,2+rng()*7,'#c6dbe26f',rng()*.5);ellipse(c,x-3,y-3,6+rng()*11,2+rng()*4,'#eff8f58c')}
 // Fragmentos de arquitetura, árvores mortas e entulho variam de uma sala para outra.
 for(let i=0;i<20;i++){let x=63+rng()*834,y=79+rng()*411;if(Math.hypot(x-170,y-290)<93||Math.abs(x-480)<125&&(y<135||y>H-130))continue;const s=13+rng()*18;stone(c,x,y,s,rng);if(i%5===0){ellipse(c,x+10,y+7,18,7,'#d3e5e36b')}}
 for(const [x,y] of [[93,106],[866,464],[854,120],[109,468]]){ellipse(c,x+11,y+22,43,13,'#0815238c');p(c,[[x-22,y+20],[x-24,y-16],[x-17,y-31],[x+16,y-30],[x+23,y-14],[x+22,y+21]],'#435463','#16212d',3);p(c,[[x-28,y-30],[x+30,y-31],[x+23,y-42],[x-22,y-41]],'#81929e','#1d2c37',3);c.fillStyle='#c8ddde84';c.fillRect(x-16,y-37,31,3);c.fillStyle='#162636';c.fillRect(x-12,y-14,24,23);c.strokeStyle='#b4c1c778';c.lineWidth=2;c.strokeRect(x-12,y-14,24,23)}
 if(depth%3===1){deadTree(c,129,215,.75,rng);deadTree(c,840,344,.62,rng)}
 if(depth%4===2){arch(c,744,150,58,74);for(let i=0;i<7;i++)stone(c,730+rng()*115,217+rng()*45,12+rng()*12,rng)}
 if(Math.abs(rx)===2){deadTree(c,743,248,1.05,rng);arch(c,175,160,62,86)}
 if(depth===12||depth===24){for(let i=0;i<5;i++){const x=200+i*130;ellipse(c,x,H*.46,45,15,'#0a1724bf');stone(c,x,H*.46,36,rng)}c.strokeStyle='#9d677575';c.lineWidth=4;c.beginPath();c.arc(W/2,H/2,153,0,Math.PI*2);c.stroke()}
 // Trilha pisada no gelo, levemente iluminada no centro.
 const light=c.createRadialGradient(475,284,20,475,284,395);light.addColorStop(0,'#c4d6dc12');light.addColorStop(1,'#8ca3b000');c.fillStyle=light;c.fillRect(0,0,W,H);
 return cn}
function drawBackground(c,rx,depth){const k=rx+':'+depth;let art=cache.get(k);if(!art){art=generate(rx,depth);cache.set(k,art);if(cache.size>CAP)cache.delete(cache.keys().next().value)}else{cache.delete(k);cache.set(k,art)}c.drawImage(art,0,0)}
function portal(c,side,open){c.save();let x,y,ww,hh;if(side==='north'){x=W/2;y=16;ww=151;hh=70}else if(side==='south'){x=W/2;y=H-16;ww=151;hh=70}else if(side==='west'){x=17;y=H/2;ww=60;hh=144}else{x=W-17;y=H/2;ww=60;hh=144}
 c.shadowBlur=open?27:12;c.shadowColor=open?'#78ded0':'#ab6f68';c.fillStyle=open?'#143e43':'#251c29';c.fillRect(x-ww/2,y-hh/2,ww,hh);c.shadowBlur=0;
 c.strokeStyle='#8f9da9';c.lineWidth=11;c.strokeRect(x-ww/2,y-hh/2,ww,hh);c.strokeStyle='#d1dde1ab';c.lineWidth=2;c.strokeRect(x-ww/2+6,y-hh/2+6,ww-12,hh-12);
 if(!open){c.strokeStyle='#a87777';c.lineWidth=5;for(let a=-ww/2+19;a<ww/2-10;a+=18){c.beginPath();c.moveTo(x+a,y-hh/2+9);c.lineTo(x+a,y+hh/2-8);c.stroke()}}else{c.fillStyle='#b0ebd892';c.fillRect(x-ww*.28,y-hh*.10,ww*.56,hh*.2)}c.restore()}
function drawPassages(c,doors,open){for(const side of ['north','south','west','east'])if(doors[side])portal(c,side,open)}
function bonfire(c,x,y,t,active=false){c.save();c.translate(x,y);const flame=Math.sin(t*8)*4;ellipse(c,0,21,81,32,'#091322b4');ellipse(c,0,9,68,27,'#66513e7a');ellipse(c,0,8,48,19,'#b1906255');
 // Anel de pedras inteiras com lascas de gelo e reflexos no solo.
 for(let i=0;i<14;i++){let a=i*Math.PI*2/14,px=51*Math.cos(a),py=14+20*Math.sin(a);ellipse(c,px,py,12,7,i%3?'#586471':'#7c7b77',a);ellipse(c,px-2,py-2,7,2,'#c3ced3a0',a)}
 // Lenha, estrutura de cinzas e espada antiga cravada.
 c.lineCap='round';for(const [a,b] of [[-1,1],[1,-1]]){c.strokeStyle='#271e1a';c.lineWidth=16;c.beginPath();c.moveTo(-32,15+a*5);c.lineTo(35,17+b*5);c.stroke();c.strokeStyle='#916344';c.lineWidth=4;c.stroke()}
 c.save();c.shadowBlur=32;c.shadowColor='#ec7426';for(let i=0;i<5;i++){let shift=i*10-20;let top=-40-i*4+flame*Math.sin(t*1.3+i);p(c,[[shift-12,15],[shift-7,-5],[shift+5,top],[shift+14,-6],[shift+15,16]],['#aa462c','#d66b2c','#f1a541','#ffcf79','#fbe5a5'][i]);}c.restore();
 c.strokeStyle='#9caab3';c.lineWidth=8;c.beginPath();c.moveTo(3,-3);c.lineTo(1,-84);c.stroke();p(c,[[-7,-80],[2,-104],[10,-79],[2,-70]],'#bcc9cc','#586978',2);c.strokeStyle='#a68155';c.lineWidth=8;c.beginPath();c.moveTo(-17,-32);c.lineTo(19,-33);c.stroke();ellipse(c,1,-33,5,5,'#e5bc79');
 for(let i=0;i<11;i++){let phase=(t*30+i*19)%88;c.globalAlpha=(1-phase/88)*.9;ellipse(c,Math.sin(t*.9+i*9)*28,6-phase,1.3+i%3,.9+i%2,i%2?'#fce4ac':'#fa9348')}c.globalAlpha=1;
 if(active){c.strokeStyle='#f2d29688';c.lineWidth=2;c.beginPath();c.ellipse(0,5,78,35,0,0,Math.PI*2);c.stroke()}c.restore()}
window.DeadWorld={drawBackground,drawPassages,bonfire,roomCacheSize:()=>cache.size};
})();
