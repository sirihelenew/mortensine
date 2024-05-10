
const CACHE_NAME = 'sw-cache-example';
const toCache = [
  '/',
  '/index.html',
];

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
    // Save preferences in IndexedDB
    const dbPromise = idb.open('preferences-db', 1, (upgradeDb) => {
      upgradeDb.createObjectStore('preferences');
    });

    dbPromise.then((db) => {
      const tx = db.transaction('preferences', 'readwrite');
      tx.objectStore('preferences').put(event.data.preferences, 'notificationPreferences');
      return tx.complete;
    }).then(() => {
      console.log('Preferences saved in IndexedDB');
    });
  }
});

self.addEventListener('fetch', function(event) {
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
    getPreferences().then((preferences) => {
      if (preferences[payload.type]) {
        return self.registration.showNotification(payload.title, {
          body: payload.body,
          icon: payload.icon
        });
      }
    }).catch((error) => {
      console.error('Error in push event handler:', error);
      throw error;
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