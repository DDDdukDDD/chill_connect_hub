// Service worker: shows push notifications and a friendly page when there is no internet.
// Pages are never cached here: they hold members' own data and must always be current.
const CACHE = 'chillwaa-offline-v1';
const OFFLINE_PAGE = '/offline.html';
const OFFLINE_LOGO = '/icons/icon-192.png';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll([OFFLINE_PAGE, OFFLINE_LOGO]))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(names.filter((name) => name !== CACHE).map((name) => caches.delete(name)));
      if (self.registration.navigationPreload) await self.registration.navigationPreload.enable();
      await self.clients.claim();
    })()
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.mode === 'navigate') {
    // Sign-in (LINE, Google, Facebook) and email links pass through /api: the browser handles those on its own
    if (new URL(request.url).pathname.startsWith('/api/')) return;
    event.respondWith(
      (async () => {
        try {
          return (await event.preloadResponse) || (await fetch(request));
        } catch {
          // "No internet" only when that is true; any other failure is the browser's own page, which names the error
          if (self.navigator.onLine) return Response.error();
          return (await caches.match(OFFLINE_PAGE)) || Response.error();
        }
      })()
    );
  } else if (request.url === new URL(OFFLINE_LOGO, self.location.origin).href) {
    // The logo on the offline page
    event.respondWith(fetch(request).catch(async () => (await caches.match(request)) || Response.error()));
  }
});

self.addEventListener('push', (event) => {
  let message = {};
  try {
    message = event.data ? event.data.json() : {};
  } catch {
    // Still shown below: phones stop delivering to a site whose push shows nothing
  }
  event.waitUntil(
    self.registration.showNotification(message.title || 'Chillwaa', {
      body: message.body || 'มีการแจ้งเตือนใหม่',
      icon: '/icons/icon-192.png',
      badge: '/icons/badge-96.png',
      lang: 'th',
      tag: message.tag,
      data: { url: message.url || '/' },
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = new URL(event.notification.data?.url || '/', self.location.origin);
  const url = target.origin === self.location.origin ? target.href : self.location.origin;
  event.waitUntil(
    (async () => {
      const open = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      const client = open.find((c) => new URL(c.url).origin === self.location.origin);
      if (!client) return self.clients.openWindow(url);
      await client.focus().catch(() => undefined);
      return client.navigate(url).catch(() => self.clients.openWindow(url));
    })()
  );
});
