const CACHE_NAME = 'fee-manager-demo-v1';

const PRECACHE = [
  '/fee-manager-demo/demo-login.html',
  '/fee-manager-demo/demo-signup.html',
  '/fee-manager-demo/demo-app.html',
  '/fee-manager-demo/manifest.json'
];

// Install — pre-cache app shell
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(PRECACHE))
  );
  self.skipWaiting();
});

// Activate — clean old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch — network first, fall back to cache for HTML/JS
// Always network-first for Firebase (live data must be fresh)
self.addEventListener('fetch', event => {
  let url = event.request.url;

  // Always go network-first for Firebase requests
  if(url.includes('firestore.googleapis.com') ||
     url.includes('firebase') ||
     url.includes('googleapis.com')){
    return; // let browser handle normally
  }

  // For app HTML files — network first, cache fallback
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Update cache with fresh copy
        let clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
