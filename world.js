/* Dead Souls Demo 1.0.2 — Pátio Externo: cenários pré-renderizados por sala. */
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
 // Segunda área: Catacumbas da Cinza — corredores, urnas, chamas frias e cinzas.
 if(depth>=25&&depth<50){
  c.fillStyle='#190f19a8';c.fillRect(0,0,W,H);
  for(let i=0;i<56;i++){const x=56+rng()*848,y=57+rng()*458;
   ellipse(c,x,y,7+rng()*20,2+rng()*6,'#a5957b47',rng()*.6);
   if(i%6===0){c.fillStyle='#786757';c.fillRect(x-9,y-16,18,28);c.fillStyle='#3e3033';c.fillRect(x-12,y-22,24,8);c.strokeStyle='#c3a98b';c.lineWidth=1;c.strokeRect(x-9,y-16,18,28)}
  }
  for(const x of [95,865])for(const y of [164,395]){
   ellipse(c,x,y+12,38,12,'#05090fa6');c.fillStyle='#382f34';c.fillRect(x-19,y-36,38,47);c.fillStyle='#7f6253';c.fillRect(x-14,y-40,28,8);
   c.strokeStyle='#bda47d';c.lineWidth=2;c.strokeRect(x-15,y-35,30,43);c.beginPath();c.moveTo(x,y-27);c.lineTo(x,y+3);c.moveTo(x-8,y-17);c.lineTo(x+8,y-17);c.stroke();
   const aura=c.createRadialGradient(x,y-30,2,x,y-30,70);aura.addColorStop(0,'#bf8e5f65');aura.addColorStop(1,'#8b4a3100');c.fillStyle=aura;c.fillRect(x-75,y-105,150,150)
  }
  for(let i=0;i<5;i++){const x=135+i*170;c.strokeStyle='#6b5a51';c.lineWidth=3;c.beginPath();c.moveTo(x,36);c.lineTo(x+9,101);c.stroke();ellipse(c,x+9,101,3,8,'#b69b82')}
 }
 // Terceira área: Laboratório Profanado. Objetos estáticos são cacheados por sala.
 if(depth>=50){
  const haze=c.createLinearGradient(0,0,W,H);haze.addColorStop(0,'#214336af');haze.addColorStop(.6,'#1c3436a5');haze.addColorStop(1,'#322336c0');c.fillStyle=haze;c.fillRect(0,0,W,H);
  for(let i=0;i<12;i++){const x=108+(i%6)*147,y=106+Math.floor(i/6)*353;
   c.fillStyle='#14292c';c.fillRect(x-23,y-30,46,60);c.strokeStyle='#6d8a7d';c.lineWidth=3;c.strokeRect(x-23,y-30,46,60);
   c.fillStyle='#354e4b';c.fillRect(x-17,y-24,34,14);c.fillStyle='#8eb6a15e';c.fillRect(x-13,y-21,26,7);
   for(let k=0;k<3;k++){const v=x-11+k*11;c.strokeStyle='#b4d5bb';c.lineWidth=2;c.beginPath();c.moveTo(v,y+6);c.lineTo(v,y+22);c.stroke()}
  }
  for(let i=0;i<33;i++){const x=65+rng()*825,y=65+rng()*445,rad=7+rng()*15;
   ellipse(c,x,y,rad,rad*.24,'#678b6370',rng()*.4);
   if(i%3===0){c.strokeStyle='#91b27d95';c.lineWidth=2;c.beginPath();c.moveTo(x-rad,y-3);c.lineTo(x,y-7);c.lineTo(x+rad*.6,y-1);c.stroke()}}
  for(const x of [117,846])for(const y of [200,360]){
   c.fillStyle='#293137';c.fillRect(x-18,y-29,36,58);c.fillStyle='#5c6d69';c.fillRect(x-22,y-32,44,10);
   c.strokeStyle='#b6c9ba';c.lineWidth=2;c.strokeRect(x-18,y-29,36,58);
   c.fillStyle='#8dcc8a90';c.beginPath();c.arc(x,y-2,10,0,Math.PI*2);c.fill();
  }
  for(let i=0;i<9;i++){const x=125+i*84;c.strokeStyle='#76847a99';c.lineWidth=3;c.beginPath();c.moveTo(x,33);c.lineTo(x+5,76+i%3*8);c.stroke();ellipse(c,x+5,78+i%3*8,4,4,'#99a589')}
 }
 // Demo 2.0.3 — textura arquitetônica pré-renderizada, sem custo a cada frame.
 // Faixas de pisos gastos, rejunte, pedras glaciais e inscrições decadentes.
 for(let i=0;i<138;i++){
  const x=54+rng()*852,y=54+rng()*464,sz=4+rng()*16;
  if(depth>=25){c.strokeStyle=i%3?'#ae967a3c':'#e3bba43d'}else c.strokeStyle=i%3?'#d6eef03b':'#607e9a5a';
  c.lineWidth=.6+rng()*.9;c.beginPath();c.moveTo(x-sz,y);c.lineTo(x-sz*.35,y-sz*.21);c.lineTo(x+sz*.34,y+sz*.12);c.lineTo(x+sz,y-sz*.35);c.stroke();
  if(i%8===0){ellipse(c,x+3,y+2,sz*.65,1.7,depth>=25?'#b49b8559':'#e7f4ef59',rng()*.3)}
 }
 // Frisos com ferragens e cravos nas paredes leste/oeste.
 for(const wall of [49,W-49]){for(let y=75;y<H-48;y+=67){
   c.fillStyle=depth>=25?'#66534f':'#506d77';c.fillRect(wall-14,y-11,28,23);
   c.strokeStyle=depth>=25?'#b19d83':'#94b3bd';c.lineWidth=1.3;c.strokeRect(wall-12,y-9,24,19);
   for(const k of [-7,7])ellipse(c,wall+k,y,1.6,1.6,'#c9baa0');
 }}
 // Canteiros de neve, cinzas e pedras junto às estruturas quebradas.
 for(let i=0;i<19;i++){
   const side=i%4,x=side===0?89+rng()*95:side===1?W-89-rng()*95:118+rng()*724;
   const y=side===2?80+rng()*69:side===3?H-80-rng()*69:95+rng()*388;
   ellipse(c,x+8,y+9,18+rng()*27,5+rng()*5,'#0b172399');
   ellipse(c,x,y,16+rng()*22,3+rng()*7,depth>=25?'#a2938455':'#daeef098',rng()*.24);
   if(i%3===0){c.strokeStyle=depth>=25?'#b4a18a':'#cde6ea';c.lineWidth=1.5;c.beginPath();c.moveTo(x-8,y-3);c.lineTo(x+3,y-7);c.lineTo(x+13,y-4);c.stroke()}
 }
 // Marcas de lâminas e símbolos no piso; nenhuma área de colisão é afetada.
 for(let i=0;i<9;i++){
   const x=130+rng()*700,y=106+rng()*354;
   c.strokeStyle=depth>=25?'#c59f7665':'#98b9cc66';c.lineWidth=1.3;
   c.beginPath();c.moveTo(x-11,y-8);c.lineTo(x+12,y+7);c.moveTo(x-6,y+10);c.lineTo(x+14,y-8);c.stroke();
 }
 // Demo 1.0.2: arquitetura legível, detalhes estáticos pré-renderizados.
 // Brasões rasgados e correntes antigas nas muralhas.
 for(const bx of [193,767]){
  const by=depth%2?67:73;
  c.fillStyle='#25333e';c.fillRect(bx-17,by-7,34,6);
  p(c,[[bx-17,by],[bx+16,by],[bx+12,by+47],[bx,by+39],[bx-11,by+47]],'#673d44','#241e2a',2);
  c.strokeStyle='#c4a47d';c.lineWidth=2;c.beginPath();c.moveTo(bx-9,by+12);c.lineTo(bx+8,by+12);c.moveTo(bx,by+7);c.lineTo(bx,by+31);c.stroke();
  for(let k=0;k<4;k++){c.strokeStyle='#a2abb27f';c.lineWidth=2;c.beginPath();c.moveTo(bx+24,by-12+k*9);c.lineTo(bx+24,by-5+k*9);c.stroke()}
 }
 // Manchas de gelo azuladas em fendas, sem poluir área central de combate.
 for(let i=0;i<31;i++){
  const x=53+rng()*854,y=65+rng()*453,sz=5+rng()*15;
  if(Math.hypot(x-W/2,y-H/2)<145)continue;
  c.strokeStyle=i%4===0?'#bfe6ee9a':'#74aabd69';c.lineWidth=.9+rng()*1.4;
  c.beginPath();c.moveTo(x-sz,y+1);c.lineTo(x,y-2);c.lineTo(x+sz*.6,y-5);c.stroke();
  if(i%3===0){c.beginPath();c.moveTo(x,y-2);c.lineTo(x+sz*.4,y+7);c.stroke()}
 }
 // Neve assoprada formando dunas baixas junto aos limites da sala.
 for(const side of [-1,1]){
  for(let i=0;i<6;i++){
   const yy=48+i*91+(rng()-.5)*18,xx=side<0?58+rng()*47:W-58-rng()*47;
   ellipse(c,xx,yy,21+rng()*27,4+rng()*5,'#d8ebed80',rng()*.18);
   ellipse(c,xx-7,yy-2,11+rng()*18,2+rng()*4,'#f3f8f5a3');
  }
 }
 // Trilha de passos quase apagados aponta para o portão norte.
 for(let i=0;i<9;i++){
   const yy=H-103-i*45,xx=459+(i%2?17:-17)+(rng()-.5)*8;
   ellipse(c,xx,yy,5,9,'#101e2a38',-.17);ellipse(c,xx+3,yy-2,2,5,'#b5d0d12f',-.17);
 }
 // Demo 1.0.2: reforço visual das muralhas, grades, lâmpadas e piso de gelo.
 for(const xx of [66,894]){
  for(let yy=62;yy<540;yy+=108){
   c.fillStyle='#1a2938';c.fillRect(xx-14,yy-27,28,54);c.strokeStyle='#697b82';c.lineWidth=3;c.strokeRect(xx-14,yy-27,28,54);
   c.strokeStyle='#b3cad081';c.lineWidth=1;c.beginPath();c.moveTo(xx-11,yy-22);c.lineTo(xx+10,yy+21);c.stroke();
   ellipse(c,xx,yy+12,3,2,'#a9c0c8');
  }
 }
 for(let i=0;i<26;i++){
  const x=70+rng()*820,y=69+rng()*433; if(Math.abs(x-480)<110&&y<135)continue;
  const sz=4+rng()*13;c.strokeStyle='#c7ecf081';c.lineWidth=.7+rng();c.beginPath();c.moveTo(x-sz,y+sz*.4);c.lineTo(x,y-sz*.25);c.lineTo(x+sz*.65,y+sz*.15);c.stroke();
  if(i%4===0){c.fillStyle='#e3f6ef61';c.fillRect(x-3,y-2,7,2)}
 }
 // Pedaços de grade, fitas de tecido rasgadas e restos de alvenaria.
 for(let i=0;i<7;i++){
  const x=i%2?100+rng()*65:795+rng()*66,y=128+rng()*315;
  c.strokeStyle='#4f606c';c.lineWidth=3;c.beginPath();c.moveTo(x,y-14);c.lineTo(x,y+16);c.moveTo(x+8,y-13);c.lineTo(x+8,y+14);c.moveTo(x-3,y-7);c.lineTo(x+12,y-7);c.stroke();
  c.strokeStyle='#d7e5e568';c.lineWidth=1;c.beginPath();c.moveTo(x,y-12);c.lineTo(x,y+7);c.stroke();
 }
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
 // Cristais nas pedras, cinzas incandescentes e reflexos animados.
 for(let i=0;i<9;i++){
  let a=i*6.283185/9+0.1,xx=Math.cos(a)*37,yy=14+Math.sin(a)*14;
  ellipse(c,xx,yy,1.8,1.5,i%2?'#f5c68b':'#e7e0cb');
  c.strokeStyle='#b9d5cf99';c.lineWidth=1.3;c.beginPath();c.moveTo(xx-5,yy-3);c.lineTo(xx,yy-7);c.stroke();
 }
 for(let i=0;i<7;i++){
  const xx=Math.sin(t*.7+i*2.4)*17,yy=-12-(t*17+i*13)%67;
  ellipse(c,xx,yy,1.3+(i%3)*.5,2.4,'#f0af67a8');
 }
 // Pedra gravada, brasas em três camadas e luz que pulsa nas lajes.
 for(let i=0;i<6;i++){
  const angle=i*Math.PI/3,px=Math.cos(angle)*57,py=9+Math.sin(angle)*19;
  c.strokeStyle='#c0c7c2b4';c.lineWidth=1.3;c.beginPath();c.moveTo(px-4,py-1);c.lineTo(px,py-4);c.lineTo(px+4,py-1);c.stroke();
 }
 for(let i=0;i<18;i++){
  const a=i*2.399,rad=9+(i%5)*6;
  ellipse(c,Math.cos(a)*rad,14+Math.sin(a)*rad*.29,1.4+i%3,1.2,'#ffb35b');
 }
 const halo=c.createRadialGradient(0,-4,8,0,0,86);
 halo.addColorStop(0,'#ffe7a631');halo.addColorStop(.43,'#e9863d20');halo.addColorStop(1,'#df884800');
 c.fillStyle=halo;c.beginPath();c.ellipse(0,0,88,58,0,0,Math.PI*2);c.fill();
 // Cinzas em torno da espada e três línguas adicionais de fogo.
 for(let i=0;i<3;i++){
  const dx=-16+i*16,fl=Math.sin(t*9+i*2)*5;
  p(c,[[dx-6,8],[dx-4,-9],[dx+fl*.4,-27-fl],[dx+8,-1],[dx+4,9]],i===1?'#fff0b7c2':'#f9a44fa0',null);
 }
 for(let i=0;i<11;i++){let phase=(t*30+i*19)%88;c.globalAlpha=(1-phase/88)*.9;ellipse(c,Math.sin(t*.9+i*9)*28,6-phase,1.3+i%3,.9+i%2,i%2?'#fce4ac':'#fa9348')}c.globalAlpha=1;
 // Placas gravadas na pedra e brilho das cinzas.
 for(let j=0;j<5;j++){const x=-37+j*18;c.strokeStyle='#d1bd8880';c.lineWidth=1.5;c.beginPath();c.moveTo(x,-1);c.lineTo(x+5,-6);c.lineTo(x+10,-1);c.stroke()}
 if(active){c.strokeStyle='#f2d29688';c.lineWidth=2;c.beginPath();c.ellipse(0,5,78,35,0,0,Math.PI*2);c.stroke()}c.restore()}
window.DeadWorld={drawBackground,drawPassages,bonfire,roomCacheSize:()=>cache.size};
})();
