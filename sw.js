// ============================================================
// ALFAJORES CON AMOR - FINCONTROL
// SERVICE WORKER
// ETAPA 3B
// Cache: 1.3.20
// ============================================================

var CACHE_NAME = 'aca-V.a 1.3.20';

var URLS_TO_CACHE = [
  './',
  './AlfajoresConAmor_Control.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './logo.png',
  './logo-header.png'
];

// ============================================================
// INSTALACIÓN
// Guarda los archivos principales de la PWA en caché.
// ============================================================

self.addEventListener('install', function(event) {

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        return cache.addAll(URLS_TO_CACHE);
      })
  );

  self.skipWaiting();
});


// ============================================================
// ACTIVACIÓN
// Elimina versiones antiguas del caché.
// ============================================================

self.addEventListener('activate', function(event) {

  event.waitUntil(
    caches.keys()
      .then(function(cacheNames) {

        return Promise.all(
          cacheNames.map(function(cacheName) {

            if (cacheName !== CACHE_NAME) {
              return caches.delete(cacheName);
            }

          })
        );

      })
  );

  self.clients.claim();
});


// ============================================================
// FETCH
// ============================================================

self.addEventListener('fetch', function(event) {

  var request = event.request;
  var url = request.url;

  // ----------------------------------------------------------
  // IMPORTANTE:
  // Las conexiones con Google Apps Script y sus redirecciones
  // NO deben pasar por el caché del Service Worker.
  //
  // googleusercontent.com es especialmente importante para
  // dispositivos móviles porque Apps Script puede redirigir
  // las respuestas hacia ese dominio.
  // ----------------------------------------------------------

  if (
    url.indexOf('script.google.com') >= 0 ||
    url.indexOf('googleusercontent.com') >= 0 ||
    url.indexOf('googleapis.com') >= 0 ||
    url.indexOf('cdnjs.cloudflare.com') >= 0 ||
    url.indexOf('cdn.jsdelivr.net') >= 0 ||
    url.indexOf('fonts.googleapis.com') >= 0 ||
    url.indexOf('fonts.gstatic.com') >= 0
  ) {
    return;
  }


  // ----------------------------------------------------------
  // Solo procesamos solicitudes GET.
  // ----------------------------------------------------------

  if (request.method !== 'GET') {
    return;
  }


  // ----------------------------------------------------------
  // Estrategia:
  // CACHE FIRST + actualización desde red.
  // ----------------------------------------------------------

  event.respondWith(

    caches.match(request)
      .then(function(cachedResponse) {

        var networkFetch = fetch(request)
          .then(function(networkResponse) {

            if (
              networkResponse &&
              networkResponse.status === 200 &&
              networkResponse.type !== 'opaque'
            ) {

              var responseClone = networkResponse.clone();

              caches.open(CACHE_NAME)
                .then(function(cache) {
                  cache.put(request, responseClone);
                });

            }

            return networkResponse;

          })
          .catch(function() {

            return cachedResponse;

          });


        // Si existe en caché, responder inmediatamente.
        if (cachedResponse) {
          return cachedResponse;
        }

        // Si no existe, consultar Internet.
        return networkFetch;

      })

  );

});
