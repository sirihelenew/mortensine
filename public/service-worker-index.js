const CACHE_NAME = 'sw-cache-example';
const toCache = [
  '/',
  '/index.html',
];
let preferences = {
  movements: false,
  announcements: false,
  // Add more types as needed
};

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        return cache.addAll(toCache)
      })
      .then(self.skipWaiting())
  )
})

self.addEventListener('message', (event) => {
  if (event.data.type === 'SET_PREFERENCES') {
    // Save preferences in the variable
    preferences = event.data.preferences;
    console.log('Preferences saved in variable');
  }
});

self.addEventListener('fetch', function(event) {
  if (event.request.url.startsWith('https://firestore.googleapis.com/')) {
    // Make a network request
    event.respondWith(fetch(event.request));
    return;
  }
  event.respondWith(
    fetch(event.request)
      .catch(() => {
        return caches.open(CACHE_NAME)
          .then((cache) => {
            return cache.match(event.request)
          })
      })
  )
})


  self.addEventListener('push', function(event) {
    const payload = JSON.parse(event.data.text());
  
    event.waitUntil(
      new Promise((resolve, reject) => {
        if (preferences[payload.type]) {
          self.registration.showNotification(payload.title, {
            body: payload.body,
            icon: payload.icon
          }).then(resolve, reject);
        } else {
          resolve();
        }
      })
    );
  });
self.addEventListener('activate', function(event) {
    event.waitUntil(
      caches.keys()
        .then((keyList) => {
          return Promise.all(keyList.map((key) => {
            if (key !== CACHE_NAME) {
              console.log('[ServiceWorker] Removing old cache', key)
              return caches.delete(key)
            }
          }))
        })
        .then(() => self.clients.claim())
    )
  })
  function getPreferences() {
    return idb.open('preferences-db', 1).then((db) => {
      const tx = db.transaction('preferences', 'readonly');
      return tx.objectStore('preferences').get('notificationPreferences');
    }).then((preferences) => {
      // If preferences are not defined, default to false
      if (!preferences) {
        return {
          movements: false,
          announcements: false,
          // Add more types as needed
        };
      }
  
      return preferences;
    });
  }