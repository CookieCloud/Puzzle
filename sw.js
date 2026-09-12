/*
    TRENCACLOSQUES — Service worker
    Version: 3.10

    Estratègia
    - Pàgina, manifest i fotos.json: primer la xarxa (sempre la darrera versió),
      i la còpia desada només si no hi ha connexió.
    - Icones i fonts: primer la còpia desada.
    - Fotos teves: es serveix la desada i s'actualitza en segon pla.
      Es guarden com a màxim MAX_FOTOS per no omplir el dispositiu.
    - Fotos d'Internet (Picsum): no es desen; són aleatòries.
*/
const VERSIO     = 'v3.10';
const CAU_APP    = `trencaclosques-app-${VERSIO}`;
const CAU_FOTOS  = 'trencaclosques-fotos';
const CAU_FONTS  = 'trencaclosques-fonts';
const MAX_FOTOS  = 80;

const FITXERS_APP = [
  './',
  'index.html',
  'manifest.json',
  'puzzle32x32.png',
  'puzzle180x180.png',
  'puzzle192x192.png',
  'puzzle512x512.png'
];

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cau = await caches.open(CAU_APP);
    // Un a un: si en falta algun, la instal·lació no falla
    await Promise.all(FITXERS_APP.map(url =>
      cau.add(url).catch(err => console.warn('No s\'ha pogut desar', url, err))
    ));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const noms = await caches.keys();
    await Promise.all(noms
      .filter(nom => nom.startsWith('trencaclosques-app-') && nom !== CAU_APP)
      .map(nom => caches.delete(nom)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  if (url.origin === self.location.origin){
    const cami = url.pathname;
    if (req.mode === 'navigate' || cami.endsWith('.html') || cami.endsWith('/manifest.json')){
      event.respondWith(xarxaPrimer(req, CAU_APP));
    } else if (cami.endsWith('/fotos.json')){
      event.respondWith(xarxaPrimer(req, CAU_FOTOS));
    } else if (cami.includes('/Fotos/')){
      event.respondWith(desadaIActualitza(event, req, CAU_FOTOS));
    } else {
      event.respondWith(desadaPrimer(req, CAU_APP));
    }
    return;
  }

  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com'){
    event.respondWith(desadaPrimer(req, CAU_FONTS));
  }
  // La resta (Picsum…) va directa a la xarxa
});

async function xarxaPrimer(req, nomCau){
  const cau = await caches.open(nomCau);
  try{
    const resposta = await fetch(req);
    if (resposta.ok) await cau.put(req, resposta.clone());
    return resposta;
  } catch(err){
    const desada = await cau.match(req, { ignoreSearch: true })
      || (req.mode === 'navigate' ? await caches.match('index.html', { ignoreSearch: true }) : undefined);
    if (desada) return desada;
    throw err;
  }
}

async function desadaPrimer(req, nomCau){
  const cau = await caches.open(nomCau);
  const desada = await cau.match(req);
  if (desada) return desada;
  const resposta = await fetch(req);
  if (resposta.ok || resposta.type === 'opaque') await cau.put(req, resposta.clone());
  return resposta;
}

async function desadaIActualitza(event, req, nomCau){
  const cau = await caches.open(nomCau);
  const desada = await cau.match(req);

  const actualitzacio = fetch(req).then(async resposta => {
    if (resposta.ok){
      await cau.put(req, resposta.clone());
      await retallarCau(cau, MAX_FOTOS);
    }
    return resposta;
  });

  if (desada){
    event.waitUntil(actualitzacio.catch(() => {}));
    return desada;
  }
  return actualitzacio;
}

/* Esborra les entrades més antigues (l'ordre de keys() és d'inserció) */
async function retallarCau(cau, maxim){
  const claus = await cau.keys();
  const sobrants = claus.length - maxim;
  for (let i = 0; i < sobrants; i++){
    if (!claus[i].url.endsWith('/fotos.json')) await cau.delete(claus[i]);
  }
}
