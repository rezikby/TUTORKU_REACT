self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('message', (event) => {
  try {
    const data = event.data || {};
    if (data && data.type === 'SHOW_CHAT_NOTIFICATION') {
      const title = data.title || 'Pesan baru';
      const options = {
        body: data.body || '',
        icon: data.icon || '/favicon.ico',
        tag: 'tutorku-chat',
        renotify: true,
        requireInteraction: true,
        data: {
          url: data.url || '/',
        },
      };
      event.waitUntil(self.registration.showNotification(title, options));
    }
  } catch (e) {
    // ignore
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(
    (async () => {
      const allClients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      for (const client of allClients) {
        if (client.url === url && 'focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(url);
      }
    })(),
  );
});
