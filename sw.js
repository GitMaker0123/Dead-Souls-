// Dead Souls Demo 1.0.1 — cache de versão isolada (sem arquivos de áudio).
const CACHE='dead-souls-demo-101-mce1809';
const ASSETS=['./index.html','./style.css','./game.js','./actors.js','./world.js','./rpg.js','./manifest.webmanifest','./icon-192.png','./icon-512.png'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(async cache=>{for(const path of ASSETS){const url=new URL(path,self.registration.scope);const response=await fetch(new Request(url,{cache:'reload'}));if(!response.ok)throw Error('Arquivo ausente: '+path);await cache.put(url,response)}}).then(()=>self.skipWaiting()))});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('dead-souls-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',event=>{const req=event.request;if(req.method!=='GET')return;const url=new URL(req.url);if(url.origin!==self.location.origin)return;
 if(req.mode==='navigate'){event.respondWith(fetch(new Request(req,{cache:'no-store'})).catch(()=>caches.match(new URL('./index.html',self.registration.scope))));return}
 event.respondWith(caches.open(CACHE).then(async cache=>{const saved=await cache.match(new URL(url.pathname,self.location.origin));if(saved)return saved;try{return await fetch(req)}catch{return Response.error()}}))});
