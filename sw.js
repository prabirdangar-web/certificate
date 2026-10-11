/* TFHS service worker — app shell cache so the portal installs and opens fast on phones */
const VER='tfhs-v1';
const SHELL=['./','./index.html','./manifest.json','./icons/icon-192.png','./icons/icon-512.png','./icons/apple-touch-icon.png'];
self.addEventListener('install',e=>{
  e.waitUntil(caches.open(VER).then(c=>Promise.all(SHELL.map(u=>c.add(u).catch(()=>null)))).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==VER).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',e=>{
  const r=e.request;
  if(r.method!=='GET')return;
  const u=new URL(r.url);
  /* live data (Firebase, Google, India Post API) always goes to network */
  const sameOrigin=u.origin===location.origin, cdn=u.hostname==='cdnjs.cloudflare.com';
  if(!sameOrigin&&!cdn)return;
  if(r.mode==='navigate'){
    /* pages: network first, cached copy when offline */
    e.respondWith(fetch(r).then(res=>{const cp=res.clone();caches.open(VER).then(c=>c.put(r,cp));return res})
      .catch(()=>caches.match(r).then(m=>m||caches.match('./index.html'))));
    return;
  }
  /* assets: cache first, refresh in background */
  e.respondWith(caches.match(r).then(m=>{
    const net=fetch(r).then(res=>{if(res&&res.status===200){const cp=res.clone();caches.open(VER).then(c=>c.put(r,cp))}return res}).catch(()=>m);
    return m||net;
  }));
});
