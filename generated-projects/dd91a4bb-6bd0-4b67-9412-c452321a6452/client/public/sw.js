// Service Worker for Push Notifications and PWA Caching

const CACHE_NAME = 'fs-dashboard-v33';
const urlsToCache = [
  '/',
  'https://0qshtsle6wr4hqxp.public.blob.vercel-storage.com/imports/1788722773923-539c82ac-a209-4957-be91-0e18d63277f9-favicon-RV4h6dUFLLk9gGTfpWXdjZC9yzmfsT.png',
  'https://0qshtsle6wr4hqxp.public.blob.vercel-storage.com/imports/1788722773216-38c2be42-db6c-4349-a775-fe3ef070e265-favicon-Y1X4w5rBLkCp5UiLi0YIJKHQBD5y2b.gif',
  '/manifest.json',
  '/manifest-menu.json',
  'https://0qshtsle6wr4hqxp.public.blob.vercel-storage.com/imports/1788722791143-6b1812d0-74a7-4d55-8037-c8c504ca6c96-icon-menu-192-WM5zvgbR54WGvwdBGv3xrS4rDNcQZQ.png',
  'https://0qshtsle6wr4hqxp.public.blob.vercel-storage.com/imports/1788722791959-5ffd876e-a9e0-47c7-8426-eb48390d6e95-icon-menu-512-Bu70bRWZLMpRC37V8TvWPrQjkKwaYE.png',
  '/manifest-waiter.json',
  'https://0qshtsle6wr4hqxp.public.blob.vercel-storage.com/imports/1788722794764-e3ea6e59-9dd2-4e42-a503-6ae478aa411b-icon-waiter-192-rxfKmhRo5bPdnaI9GLkZcTymNivMG9.png',
  'https://0qshtsle6wr4hqxp.public.blob.vercel-storage.com/imports/1788722796212-7ee26760-dc21-49fe-96d0-8d960cb01532-icon-waiter-512-jbEeiERDSFJLjC5sGVYtIgG7VrzShz.png',
  '/manifest-driver.json',
  'https://0qshtsle6wr4hqxp.public.blob.vercel-storage.com/imports/1788722782937-fa78d57d-c3d4-4011-8a08-fe07fda99a7f-icon-driver-192-NQUpXheYVOH82AOb2GJEcTUhkGd40C.png',
  'https://0qshtsle6wr4hqxp.public.blob.vercel-storage.com/imports/1788722783902-13f6208b-3811-48df-9efc-954d405bfa19-icon-driver-512-gRzMVomShn63ANEu0ZBGylJOZH2jwD.png',
  '/manifest-suppliers.json',
  'https://0qshtsle6wr4hqxp.public.blob.vercel-storage.com/imports/1788722793020-ed866a4d-bef4-4ef4-8cbc-afd64185e1b4-icon-suppliers-192-G3m0iij3loAGOzynXKUSiO8IIFRhbP.png',
  'https://0qshtsle6wr4hqxp.public.blob.vercel-storage.com/imports/1788722793858-5269d09b-bdc9-4439-be9a-2601dbab64b5-icon-suppliers-512-JpFroZ2a0WyyiWEh03SOfCC3WJ8aE9.png',
  '/manifest-finances.json',
  'https://0qshtsle6wr4hqxp.public.blob.vercel-storage.com/imports/1788722786915-13057cf0-6f76-437f-86c0-691d5561d36b-icon-finances-192-GjtxgGPX2t0kW6e81sJ9a3caCC9Rrn.png',
  'https://0qshtsle6wr4hqxp.public.blob.vercel-storage.com/imports/1788722787968-6da9f811-4d19-4f3e-b363-962df2733b71-icon-finances-512-ouKOeed6kx6sPuOrRpRKZ7wdHTr2pb.png',
  '/manifest-customer.json',
  'https://0qshtsle6wr4hqxp.public.blob.vercel-storage.com/imports/1788722780864-bf148012-7a95-4036-a76f-b7f5d14aa83b-icon-customer-192-KlFXq3Lmso5kku76PCt9u2gZDhhChN.png',
  'https://0qshtsle6wr4hqxp.public.blob.vercel-storage.com/imports/1788722781792-4dcf5a16-02e9-4fef-8d25-7090f7b723e3-icon-customer-512-y9rO6Bxem33yRMpq2xQbVtWrsOt37F.png',
  '/manifest-epos.json',
  'https://0qshtsle6wr4hqxp.public.blob.vercel-storage.com/imports/1788722784908-dd22e0e6-588c-48ff-b99f-eac54597dcf9-icon-epos-192-T6AiXEE6TcHi21OLYb2Y32idw15QCv.png',
  'https://0qshtsle6wr4hqxp.public.blob.vercel-storage.com/imports/1788722785958-aed361a7-430c-4b35-9cd1-c994ce6d1f38-icon-epos-512-RTAiKovQ13EofiCsOvxT8IZwHDM4Z9.png',
  '/manifest-kitchen.json',
  'https://0qshtsle6wr4hqxp.public.blob.vercel-storage.com/imports/1788722788876-38b59fba-515a-4e6e-8e09-ad94d8d79619-icon-kitchen-192-Rmf5LkOjuOl0JpSn96wJmzC6xTYetM.png',
  'https://0qshtsle6wr4hqxp.public.blob.vercel-storage.com/imports/1788722789988-0b270daa-7c45-404f-ae45-9766035aac35-icon-kitchen-512-kuHGpG5tdybDVD8HZs6PHS82S6wrpX.png'
];

const OFFLINE_PAGE = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>F&S Dashboard - Offline</title>
  <style>
    body { font-family: system-ui, sans-serif; background: #1a1a2e; color: white; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; text-align: center; padding: 20px; }
    .container { max-width: 400px; }
    h1 { color: #f97316; margin-bottom: 16px; }
    p { color: #94a3b8; margin-bottom: 24px; }
    button { background: #f97316; color: white; border: none; padding: 12px 24px; border-radius: 8px; font-size: 16px; cursor: pointer; }
    button:hover { background: #ea580c; }
  </style>
</head>
<body>
  <div class="container">
    <h1>📴 You're Offline</h1>
    <p>Please check your internet connection and try again.</p>
    <button onclick="location.reload()">Retry</button>
  </div>
</body>
</html>
`;

self.addEventListener('push', function(event) {
  console.log('Push received:', event);
  
  let data = { title: 'New Delivery', body: 'You have a new delivery assignment!' };
  
  try {
    if (event.data) {
      data = event.data.json();
    }
  } catch (e) {
    console.log('Error parsing push data:', e);
  }
  
  // Determine if this is a customer or driver notification
  const isCustomerNotification = data.data?.status && ['picked_up', 'delivering', 'completed'].includes(data.data.status);
  
  const options = {
    body: data.body || 'New delivery available',
    icon: isCustomerNotification ? 'https://0qshtsle6wr4hqxp.public.blob.vercel-storage.com/imports/1788722780864-bf148012-7a95-4036-a76f-b7f5d14aa83b-icon-customer-192-KlFXq3Lmso5kku76PCt9u2gZDhhChN.png' : 'https://0qshtsle6wr4hqxp.public.blob.vercel-storage.com/imports/1788722773923-539c82ac-a209-4957-be91-0e18d63277f9-favicon-RV4h6dUFLLk9gGTfpWXdjZC9yzmfsT.png',
    badge: 'https://0qshtsle6wr4hqxp.public.blob.vercel-storage.com/imports/1788722773923-539c82ac-a209-4957-be91-0e18d63277f9-favicon-RV4h6dUFLLk9gGTfpWXdjZC9yzmfsT.png',
    vibrate: isCustomerNotification ? [300, 100, 300] : [500, 200, 500, 200, 500, 200, 500],
    tag: data.tag || `delivery-${data.data?.orderId || 'notification'}`,
    renotify: true,
    requireInteraction: data.requireInteraction !== false,
    data: data.data || {
      orderId: data.orderId,
      url: isCustomerNotification ? '/menu' : '/driver'
    },
    actions: isCustomerNotification ? [
      { action: 'track', title: 'Track Order' },
      { action: 'dismiss', title: 'Dismiss' }
    ] : [
      { action: 'accept', title: 'View Order' },
      { action: 'dismiss', title: 'Dismiss' }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title || 'New Delivery', options)
  );
});

self.addEventListener('notificationclick', function(event) {
  console.log('Notification clicked:', event);
  event.notification.close();
  
  const action = event.action;
  const data = event.notification.data || {};
  
  // Handle dismiss action
  if (action === 'dismiss') {
    return;
  }
  
  // Determine URL based on notification type
  const isCustomerNotification = data.status && ['picked_up', 'delivering', 'completed'].includes(data.status);
  const urlToOpen = data.url || (isCustomerNotification ? '/menu' : '/driver');
  const urlPattern = isCustomerNotification ? '/menu' : '/driver';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(function(clientList) {
        // Try to focus an existing window
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          if (client.url.includes(urlPattern) && 'focus' in client) {
            return client.focus();
          }
        }
        // Open a new window if none found
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

self.addEventListener('install', function(event) {
  console.log('Service Worker installed');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
      .catch(function(err) {
        console.log('Cache failed:', err);
      })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function(event) {
  console.log('Service Worker activated');
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.filter(function(cacheName) {
          return cacheName !== CACHE_NAME;
        }).map(function(cacheName) {
          return caches.delete(cacheName);
        })
      );
    }).then(function() {
      return caches.open(CACHE_NAME).then(function(cache) {
        return cache.keys().then(function(requests) {
          return Promise.all(
            requests.filter(function(request) {
              var url = new URL(request.url);
              var p = url.pathname;
              return p.startsWith('/menu/') || p.startsWith('/grocery/') || p.startsWith('/property/') || (p.includes('/manifest.json') && p.includes('/restaurants/'));
            }).map(function(request) {
              return cache.delete(request);
            })
          );
        });
      });
    }).then(function() {
      return clients.claim();
    })
  );
});

self.addEventListener('fetch', function(event) {
  if (event.request.method !== 'GET') return;
  if (event.request.url.includes('/api/')) return;
  
  var url = new URL(event.request.url);
  var pathname = url.pathname;
  
  var isMenuPage = pathname.startsWith('/menu/');
  var isGroceryPage = pathname.startsWith('/grocery/');
  var isPropertyPage = pathname.startsWith('/property/');
  var isWelcomePage = pathname.startsWith('/r/') || pathname.startsWith('/restaurant/');
  var isRestaurantManifest = pathname.includes('/manifest.json') && pathname.includes('/restaurants/');
  var isBranchSpecific = isMenuPage || isGroceryPage || isPropertyPage || isWelcomePage || isRestaurantManifest;
  
  if (isBranchSpecific) {
    event.respondWith(
      fetch(event.request).catch(function() {
        if (event.request.mode === 'navigate') {
          return new Response(OFFLINE_PAGE, {
            headers: { 'Content-Type': 'text/html' }
          });
        }
        return new Response('Offline', { status: 503 });
      })
    );
    return;
  }
  
  var isNavigationRequest = event.request.mode === 'navigate';
  
  event.respondWith(
    fetch(event.request)
      .then(function(response) {
        if (response && response.status === 200) {
          var responseClone = response.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(function() {
        return caches.match(event.request).then(function(cachedResponse) {
          if (cachedResponse) {
            return cachedResponse;
          }
          if (isNavigationRequest) {
            return new Response(OFFLINE_PAGE, {
              headers: { 'Content-Type': 'text/html' }
            });
          }
          return new Response('Offline', { status: 503 });
        });
      })
  );
});
