/* Dead Souls — Demo 1.0 / RPG de inventário e Essência. Sem áudios. */
(()=>{'use strict';
const definitions={
 rusty_sword:{name:'Espada Enferrujada',category:'arma',weight:4,damage:1,scale:{forca:.015,destreza:.010},desc:'A lâmina esquecida de um soldado do Pátio Externo. Seu aço manchado ainda obedece a uma mão determinada.'},
 steel_sword:{name:'Espada do Vigia',category:'arma',weight:5,damage:1.18,scale:{forca:.019,destreza:.016},desc:'Espada longa de um vigia que aguardou reforços até que toda a guarnição se transformasse em cinzas.'},
 long_spear:{name:'Lança da Geada',category:'arma',weight:4,damage:1.09,range:1.23,scale:{forca:.009,destreza:.028},desc:'A ponta foi temperada na neve do pátio. Perfura inimigos além do alcance das espadas.'},
 iron_axe:{name:'Machado do Sentinela',category:'arma',weight:9,damage:1.48,attackSpeed:1.23,scale:{forca:.030,destreza:.004},desc:'Um machado pesado, com lâmina lascada. Exige preparo para cada golpe, mas esmaga armaduras desgastadas.'},
 guard_armor:{name:'Armadura do Guardião',category:'armadura',weight:12,defense:.16,desc:'Placas de ferro envelhecidas por neve e sangue. Protege os que ainda guardam este reino sem rei.'},
 wanderer_armor:{name:'Vestes da Andarilha',category:'armadura',weight:5,defense:.07,desc:'Couro, tecido e pequenas placas de metal. Proteção leve que não impede movimentos rápidos.'},
 knight_armor:{name:'Armadura do Cavaleiro Perdido',category:'armadura',weight:16,defense:.23,desc:'Um brasão apagado no peito indica a antiga Ordem da Vigília. A proteção permanece, apesar da ferrugem.'},
 frost_pendant:{name:'Pingente Cristalizado',category:'pingente',weight:.2,desc:'Uma alma congelada dentro de um cristal. Acertos têm chance de imobilizar inimigos comuns por 5 s; ao se libertarem, ficam 10% mais lentos por 5 s. Chefes apenas sofrem lentidão breve.'},
 ember_pendant:{name:'Pingente da Brasa',category:'pingente',weight:.2,desc:'A última brasa de um peregrino. Aumenta discretamente a cura dos frascos em 15%.'},
 shard:{name:'Fragmento de Alma Cristalizada',category:'alma',essence:100,weight:0,desc:'Estilhaço de uma existência esquecida. Ao consumir, concede 100 Essências. Seguro no inventário mesmo após morrer.'},
 soul:{name:'Alma Cristalizada',category:'alma',essence:400,weight:0,desc:'Um vestígio de vontade conservado no gelo. Ao consumir, concede 400 Essências.'},
 great_soul:{name:'Grande Alma Cristalizada',category:'alma',essence:1000,weight:0,desc:'Uma alma que resistiu por tempo suficiente para condensar grande força. Concede 1.000 Essências.'},
 guardian_soul:{name:'Alma de Guardião Cristalizada',category:'alma',essence:1400,weight:0,desc:'O último juramento de um guarda ficou aprisionado neste cristal. Concede 1.400 Essências.'},
 knight_soul:{name:'Alma de Cavaleiro Cristalizada',category:'alma',essence:1900,weight:0,desc:'Mesmo desfeito o corpo, um cavaleiro insiste em marchar. Concede 1.900 Essências.'},
 imperial_soul:{name:'Alma de Cavaleiro Imperial Cristalizada',category:'alma',essence:2400,weight:0,desc:'Insígnia de um soldado da elite real, cristalizada com sua alma. Concede 2.400 Essências.'},
 corrupted_boss_soul:{name:'Alma Cristalizada do Cavaleiro Corrompido',category:'alma',essence:5000,unique:true,weight:0,desc:'A praga levou sua razão, mas não a lealdade. Ele aguardou eternamente ordens que nunca chegariam. Concede 5.000 Essências; também poderá servir para forjar uma relíquia futuramente.'},
 executioner_boss_soul:{name:'Alma Cristalizada do Executor do Palácio',category:'alma',essence:10000,unique:true,weight:0,desc:'Eco das ordens mais cruéis da coroa. Nem milhares de sacrifícios puderam salvar o reino. Concede 10.000 Essências; também poderá servir para forjar uma relíquia futuramente.'}
};
const attrs={vitalidade:{name:'Vitalidade',detail:'Aumenta a vida máxima'},vigor:{name:'Vigor',detail:'Aumenta a stamina'},fortitude:{name:'Fortitude',detail:'Amplia carga máxima e resistência'},forca:{name:'Força',detail:'Amplia dano de armas pesadas'},destreza:{name:'Destreza',detail:'Amplia dano de armas leves'},inteligencia:{name:'Inteligência',detail:'Fortalece o gelo dos pingentes e prepara futuras magias'},fe:{name:'Fé',detail:'Melhora a cura dos pingentes e prepara futuros milagres'}};
function fresh(gender){return{level:1,essence:0,attributes:{vitalidade:10,vigor:10,fortitude:10,forca:10,destreza:10,inteligencia:10,fe:10},items:{rusty_sword:1,[gender==='feminino'?'wanderer_armor':'guard_armor']:1,shard:1},equipped:{arma:'rusty_sword',armadura:gender==='feminino'?'wanderer_armor':'guard_armor',pingente:null},openedChests:[],drop:null,deathCount:0};}
function safe(value,gender){const base=fresh(gender);if(!value||typeof value!=='object')return base;
 const r={...base,level:Math.max(1,Math.min(250,Math.floor(Number(value.level)||1))),essence:Math.max(0,Math.min(1e9,Math.floor(Number(value.essence)||0))),attributes:{...base.attributes},items:{...base.items},equipped:{...base.equipped},openedChests:Array.isArray(value.openedChests)?value.openedChests.filter(x=>typeof x==='string').slice(0,1000):[],drop:null,deathCount:Math.max(0,Number(value.deathCount)||0)};
 for(const key of Object.keys(attrs))if(Number.isInteger(value.attributes?.[key]))r.attributes[key]=Math.max(1,Math.min(99,value.attributes[key]));
 if(value.items&&typeof value.items==='object')for(const [key,num] of Object.entries(value.items)){if(definitions[key]&&Number.isInteger(num)&&num>=0&&num<=999)r.items[key]=num;}
 for(const cat of ['arma','armadura','pingente']){const id=value.equipped?.[cat];if(id===null||definitions[id]?.category===cat&&r.items[id]>0)r.equipped[cat]=id;}
 const d=value.drop;if(d&&typeof d.room==='string'&&Number.isFinite(d.x)&&Number.isFinite(d.y)&&Number.isFinite(d.amount)&&d.amount>0)r.drop={room:d.room,x:Math.max(40,Math.min(920,d.x)),y:Math.max(40,Math.min(536,d.y)),amount:Math.min(1e9,Math.floor(d.amount))};
 return r;
}
function stats(r){const a=r.attributes;const gear=Object.values(r.equipped).reduce((sum,id)=>sum+(definitions[id]?.weight||0),0);const capacity=25+a.fortitude*2.3;return{hp:60+a.vitalidade*4,stamina:80+a.vigor*4,defense:Math.min(.5,(definitions[r.equipped.armadura]?.defense||0)+Math.max(0,a.fortitude-10)*.004),weight:gear,capacity,load:gear/capacity,move:gear/capacity>.95?.76:gear/capacity>.72?.90:1};}
function damage(r){const w=definitions[r.equipped.arma]||definitions.rusty_sword;const bonus=Object.entries(w.scale||{}).reduce((s,[k,v])=>s+Math.max(0,r.attributes[k]-10)*v,0);return(w.damage||1)*(1+bonus)}
function cost(level){return Math.round(130+Math.pow(level,1.55)*88)}
function addItem(r,id,num=1){if(!definitions[id])return false;r.items[id]=Math.min(999,(r.items[id]||0)+num);return true}
function consumeSoul(r,id){if(!definitions[id]||definitions[id].category!=='alma'||!(r.items[id]>0))return 0;r.items[id]--;r.essence+=definitions[id].essence;return definitions[id].essence}
function equip(r,id){const def=definitions[id];if(!def||!['arma','armadura','pingente'].includes(def.category)||r.items[id]<1)return false;r.equipped[def.category]=id;return true}
function levelUp(r,attr){if(!attrs[attr]||r.attributes[attr]>=99||r.level>=250)return false;const price=cost(r.level);if(r.essence<price)return false;r.essence-=price;r.attributes[attr]++;r.level++;return true}
function death(r,room,x,y){r.drop=r.essence>0?{room,x,y,amount:r.essence}:null;r.essence=0;r.deathCount++;}
function recover(r){if(!r.drop)return 0;const amount=r.drop.amount;r.essence+=amount;r.drop=null;return amount}
function killReward(type,roomDepth){const base={wanderer:34,runner:45,archer:53,spearman:62,brute:78,mimic:620,boss:950}[type]||34;return Math.round(base*(1+Math.min(1,roomDepth*.06)))}
window.DeadRPG={definitions,attrs,fresh,safe,stats,damage,cost,addItem,consumeSoul,equip,levelUp,death,recover,killReward};
})();
