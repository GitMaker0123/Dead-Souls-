/* Dead Souls Pre-Demo 1.0: personagens desenhados e armazenados como sprites 2D. */
(()=>{'use strict';
const CACHE=new Map(), palettes={
  wanderer:['#514d56','#8f8784','#362e39','#b49b80'],
  runner:['#695044','#b9966d','#332a30','#cfb291'],
  archer:['#455c55','#789783','#293638','#ad9b81'],
  spearman:['#435a69','#8da1a5','#293747','#c1aa8c'],
  brute:['#63505a','#a58384','#332b35','#c6a48a'],
  male:['#3d5364','#9bafbd','#283746','#c6ac8e'],
  female:['#4d4263','#bbb1d6','#302941','#d3b9a1'],
  boss:['#413d54','#a7a4ae','#24263b','#c7b4aa']
};
function sprite(kind,variant=''){
 const key=kind+':'+variant;if(CACHE.has(key))return CACHE.get(key);
 const cn=document.createElement('canvas');cn.width=128;cn.height=160;
 const c=cn.getContext('2d'); c.lineJoin='round';c.lineCap='round';
 const pal=palettes[kind]||palettes.boss, [cloth,steel,shade,skin]=pal;
 const isBoss=kind==='boss',heavy=kind==='brute'||isBoss||kind==='male',female=kind==='female',archer=kind==='archer',spearman=kind==='spearman';
 const axe=kind==='brute'||(isBoss&&/executioner|butcher/i.test(variant));
 const bow=archer||(isBoss&&/alchemist|king/i.test(variant));
 const weapon=bow?'bow':spearman?'spear':axe?'axe':kind==='runner'?'dagger':'sword';
 const S=heavy?1.13:female?.86:1;
 c.translate(64,81);c.scale(S,S);
 const poly=(pts,fill,stroke='#18202a',w=2)=>{c.beginPath();c.moveTo(...pts[0]);for(let i=1;i<pts.length;i++)c.lineTo(...pts[i]);c.closePath();c.fillStyle=fill;c.fill();if(stroke){c.lineWidth=w;c.strokeStyle=stroke;c.stroke()}};
 const line=(pts,color,width)=>{c.beginPath();c.moveTo(...pts[0]);for(let i=1;i<pts.length;i++)c.lineTo(...pts[i]);c.strokeStyle=color;c.lineWidth=width;c.stroke()};
 const ellipse=(x,y,rx,ry,color,stroke)=>{c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fillStyle=color;c.fill();if(stroke){c.lineWidth=2;c.strokeStyle=stroke;c.stroke()}};
 // Capa esfarrapada e tecidos desbotados por neve/tempo.
 poly([[-20,-22],[-28,5],[-26,47],[-10,40],[1,49],[17,39],[23,15],[16,-22]],shade);
 poly([[-14,-17],[-22,17],[-17,43],[-7,36],[0,42],[5,-12]],cloth,null);
 for(let i=0;i<5;i++)line([[-24+i*9,31+(i%2)*4],[-21+i*9,39+(i%3)*3]],'#938177',1.5);
 // Pernas distintas, joelheiras, botas, cintos de couro.
 for(const side of [-1,1]){
   const cx=side*10;
   poly([[cx-7,12],[cx+6,12],[cx+7,33],[cx-5,36]],'#5b5a61');
   poly([[cx-7,27],[cx+7,26],[cx+9,41],[cx-7,43]],steel);
   poly([[cx-7,38],[cx+9,37],[cx+12,53],[cx-10,54]],shade);
   line([[cx-5,32],[cx+7,32]],'#c0b5a2',2);
   ellipse(cx,30,5,4,'#54535b','#c9bdb2');
 }
 // Peitoral com placas sobrepostas (não uma forma geométrica única).
 poly([[-18,-25],[-11,-33],[13,-33],[21,-23],[17,16],[5,24],[-8,22],[-18,14]],cloth);
 poly([[-16,-24],[0,-34],[16,-24],[13,-4],[0,8],[-14,-4]],steel);
 poly([[-13,-3],[0,9],[13,-3],[13,12],[0,22],[-14,10]],'#6b6970');
 poly([[-16,-4],[-4,7],[-9,17],[-18,7]],shade,null);
 for(let j=0;j<3;j++)line([[-11,6+j*5],[9,5+j*5]],'#b1a69a',1);
 line([[-20,14],[20,14]],'#382a27',6);line([[-20,14],[20,14]],'#c09f78',1.5);
 poly([[-4,9],[5,9],[6,19],[-3,19]],'#c7ac7f');
 ellipse(1,14,2,2,'#4e493e');
 // Ombreiras distintas, braços, luvas.
 for(const side of [-1,1]){
   const x=side*20;
   poly([[x-side*4,-22],[x+side*9,-20],[x+side*11,-5],[x+side*3,3],[x-side*3,-3]],steel);
   poly([[x+side*2,-3],[x+side*10,-2],[x+side*10,16],[x+side*4,21]],cloth);
   poly([[x+side*3,12],[x+side*12,12],[x+side*12,24],[x+side*3,25]],'#4c4851');
   line([[x-side*2,-14],[x+side*8,-12]],'#d2c6b1',1.7);
   ellipse(x+side*5,-17,2,2,'#3a302d');
 }
 // Pescoço, capacete com viseira, ferrugem e danos pequenos.
 poly([[-8,-35],[9,-35],[8,-25],[-7,-25]],skin);
 if(archer||kind==='runner'){
   poly([[-14,-47],[-7,-58],[8,-58],[16,-46],[15,-29],[-14,-29]],'#353841');
   poly([[-13,-48],[-4,-58],[8,-54],[15,-44],[10,-34],[-13,-34]],cloth);
   ellipse(-1,-39,11,9,'#4f4440');
 } else {
   poly([[-16,-47],[-10,-59],[4,-65],[14,-54],[16,-42],[12,-29],[-14,-29]],steel);
   poly([[-14,-46],[-9,-55],[3,-60],[13,-48],[10,-39],[-13,-38]],'#727780');
   poly([[-12,-44],[13,-44],[10,-33],[-11,-33]],shade);
   line([[-10,-41],[10,-41]],'#121a24',4);
   line([[-9,-42],[-3,-42]],isBoss?'#d9a9f8':'#c7ccae',2);
   line([[4,-42],[9,-42]],isBoss?'#d9a9f8':'#c7ccae',2);
   line([[0,-59],[0,-49]],'#e2ccaa',1.5);
 }
 // Arranhões, rebites, costuras e manchas da armadura envelhecida.
 for(let i=0;i<12;i++){
   const x=((i*17+7)%38)-19,y=((i*29+11)%49)-21;
   line([[x,y],[x+3+(i%3),y-(i%4)]],i%3===0?'#513e39':'#e0c6a655',1);
 }
 for(const [x,y] of [[-13,-20],[13,-20],[-10,1],[10,2],[-9,27],[10,27]])ellipse(x,y,1.5,1.5,'#e2d0ad');
 // Armas em silhueta: é possível reconhecer à primeira vista.
 if(weapon==='sword'||weapon==='dagger'){
   line([[34,23],[39,-38]],'#514039',6);
   poly([[38,-62],[44,-38],[39,-33],[33,-40]],'#ced7db');
   line([[36,-51],[40,-39]],'#fff4dc',1);
   line([[27,-34],[48,-31]],'#a88b62',6);
   ellipse(38,-31,3,3,'#f3d3a1');
 } else if(weapon==='spear'){
   line([[35,48],[45,-65]],'#614635',5);
   poly([[42,-80],[50,-64],[43,-51],[38,-65]],'#c3cdd0');
   line([[39,-61],[46,-61]],'#e0d4b9',2);
 } else if(weapon==='axe'){
   line([[38,40],[42,-54]],'#6d4937',7);
   poly([[39,-57],[51,-65],[61,-55],[57,-32],[44,-36]],'#b6b5b2');
   poly([[39,-57],[29,-60],[19,-48],[28,-34],[41,-36]],'#696a73');
   line([[46,-58],[50,-39]],'#e0d2c0',2);
 } else if(weapon==='bow'){
   c.beginPath();c.ellipse(37,-7,16,47,-.1,-Math.PI/2,Math.PI/2);c.strokeStyle='#b48c60';c.lineWidth=7;c.stroke();
   c.beginPath();c.moveTo(38,-55);c.quadraticCurveTo(56,-5,37,41);c.strokeStyle='#d8c09b';c.lineWidth=2;c.stroke();
   line([[25,-8],[56,-13]],'#d9c7a4',2);
   poly([[53,-18],[64,-13],[53,-8]],'#b7c1c4');
   poly([[-27,-21],[-37,-24],[-33,15],[-22,10]],'#3f382f');
   for(let i=0;i<4;i++)line([[-33+i*3,-25],[-31+i*3,-36]],'#a8b6bb',2);
 }
 if(heavy||kind==='wanderer'){
   poly([[-44,-13],[-28,-20],[-20,-5],[-24,25],[-41,21]],'#555d68');
   poly([[-41,-13],[-28,-15],[-24,-2],[-26,17],[-40,15]],'#7c7e82');
   line([[-39,7],[-27,6]],'#d5bba0',2);
 }
 if(isBoss){line([[-19,-62],[-24,-77]],'#d4b797',5);line([[14,-61],[23,-75]],'#d4b797',5);ellipse(0,6,7,6,'#c4a577');}
 // A imagem é gerada somente uma vez: desempenho melhor em aparelhos modestos.
 CACHE.set(key,cn);return cn;
}
function draw(ctx,kind,x,y,r,variant='',flash=false,move=0,face=1,moving=false,attacking=false){
 const size=Math.max(37,r*3.7),sw=size*.76,art=sprite(kind,variant),phase=move*9;
 ctx.save();ctx.translate(x,y-5);ctx.scale(face,1);
 if(flash){ctx.globalAlpha=.82;ctx.filter='brightness(1.8)'}
 if(moving){
   // Pernas independentes: passadas alternadas, botas e oscilação do tronco.
   const stride=Math.sin(phase)*Math.min(8,size*.11);
   // Cada metade inferior do sprite é deslocada separadamente.
   ctx.drawImage(art,29,105,35,55,-sw*.28+stride*.6,-size*.70+size*105/160+Math.abs(stride)*.21,sw*35/128,size*55/160);
   ctx.drawImage(art,64,105,35,55,sw*.01-stride*.6,-size*.70+size*105/160+Math.abs(stride)*.21,sw*35/128,size*55/160);
   ctx.save();ctx.translate(0,Math.sin(phase*2)*1.2);ctx.rotate(Math.sin(phase)*.035+(attacking?-.09:0));
   ctx.drawImage(art,0,0,128,109,-sw/2,-size*.70,sw,size*109/160);ctx.restore();
 }else{
   ctx.rotate(attacking?-.10:0);
   ctx.drawImage(art,-sw/2,-size*.70+Math.sin(move*2)*.5,sw,size);
 }
 ctx.restore();
}
window.DeadActors={draw,preload(){for(const k of Object.keys(palettes))sprite(k);}};
})();
