/* global clients */
// Service Worker برای PWA سیستم ساجد
const CACHE_NAME = 'sajed-v1.2.0';
const urlsToCache = [
  '/',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

// نصب Service Worker
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        // کش فایل‌ها به صورت تکی برای جلوگیری از شکست همه در صورت خطا
        return Promise.allSettled(
          urlsToCache.map(url => 
            cache.add(url).catch(err => console.warn(`Failed to cache: ${url}`, err))
          )
        );
      })
      .catch((error) => {
        console.warn('Failed to cache resources:', error);
      })
  );
});

// فعال‌سازی Service Worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      ).then(() => clients.claim());
    })
  );
});

// پاسخ به درخواست‌ها
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // API responses are user/session specific and must never enter the PWA cache.
  if (request.method !== 'GET' || url.pathname.startsWith('/api/')) {
    event.respondWith(fetch(request));
    return;
  }

  // Always prefer the current application shell for navigations.
  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).catch(() => caches.match('/')));
    return;
  }

  // KalkNegar is deployed independently and uses content-hashed chunks.
  // Prefer the network so a freshly rebuilt frontend is visible immediately,
  // while retaining a cached response only as an offline fallback.
  if (url.pathname.startsWith('/kalknegar/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200 && response.type === 'basic') {
            const responseToCache = response.clone();
            event.waitUntil(
              caches.open(CACHE_NAME).then((cache) => cache.put(request, responseToCache))
            );
          }
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  event.respondWith(
    caches.match(request)
      .then((response) => {
        // بازگرداندن از کش اگر موجود باشد
        if (response) {
          return response;
        }

        return fetch(request).then(
          (response) => {
            // بررسی اینکه آیا پاسخ معتبر است
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // بررسی scheme برای جلوگیری از خطای chrome-extension
            if (request.url.startsWith('chrome-extension://')) {
              return response;
            }

            // کپی پاسخ برای کش
            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then((cache) => {
                try {
                  cache.put(request, responseToCache);
                } catch (error) {
                  console.warn('Cannot cache request:', request.url, error);
                }
              });

            return response;
          }
        ).catch((error) => {
          console.warn('Fetch failed:', error);
          // Return a fallback response if available, or an empty response if that fails
          return caches.match('/')
            .catch(() => new Response('', { status: 200, headers: new Headers({ 'Content-Type': 'text/html' }) }));
        });
      })
  );
});

// پیام‌های Push Notification
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'پیام جدید از سیستم ساجد',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'مشاهده',
        icon: '/icons/icon-128x128.png'
      },
      {
        action: 'close',
        title: 'بستن',
        icon: '/icons/icon-128x128.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('سیستم ساجد', options)
  );
});

// کلیک روی Notification
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'explore') {
    // باز کردن اپلیکیشن
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});
