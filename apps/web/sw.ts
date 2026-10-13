/// <reference lib="webworker" />
import {
  CacheFirst,
  ExpirationPlugin,
  NetworkFirst,
  NetworkOnly,
  Serwist,
  StaleWhileRevalidate,
} from 'serwist';

/**
 * Service worker (bundled with esbuild, see scripts/build-sw.mjs).
 *
 * - Shell routes and static assets: cached on first use, updated in the background.
 * - Page HTML: network first with the offline page as fallback.
 * - API data for lists: stale-while-revalidate. Never anything private: private
 *   entries only ever travel as ciphertext and are cached in IndexedDB by the app.
 * - Background Sync: wakes the app to flush the publish queue.
 */
declare const self: ServiceWorkerGlobalScope & {
  __SW_MANIFEST: { url: string; revision: string | null }[];
};

const OFFLINE_URL = '/offline';

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: false,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    {
      matcher: ({ request }) =>
        request.destination === 'script' ||
        request.destination === 'style' ||
        request.destination === 'font' ||
        request.destination === 'worker',
      handler: new CacheFirst({
        cacheName: 'assets',
        plugins: [new ExpirationPlugin({ maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 })],
      }),
    },
    {
      matcher: ({ request }) => request.destination === 'image',
      handler: new StaleWhileRevalidate({
        cacheName: 'images',
        plugins: [new ExpirationPlugin({ maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 7 })],
      }),
    },
    {
      // Server-action and write traffic never hits a cache.
      matcher: ({ request }) => request.method !== 'GET',
      handler: new NetworkOnly(),
    },
    {
      matcher: ({ request, url }) =>
        request.mode === 'navigate' && !url.pathname.startsWith('/api/'),
      handler: new NetworkFirst({
        cacheName: 'pages',
        networkTimeoutSeconds: 4,
        plugins: [new ExpirationPlugin({ maxEntries: 60, maxAgeSeconds: 60 * 60 * 24 * 7 })],
      }),
    },
  ],
  fallbacks: {
    entries: [{ url: OFFLINE_URL, matcher: ({ request }) => request.destination === 'document' }],
  },
});

serwist.addEventListeners();

self.addEventListener('message', (event: ExtendableMessageEvent) => {
  const data = event.data as { type?: string } | undefined;
  if (data?.type === 'SKIP_WAITING') void self.skipWaiting();
});

self.addEventListener('sync', (event: Event) => {
  const syncEvent = event as Event & {
    tag?: string;
    waitUntil?: (promise: Promise<unknown>) => void;
  };
  if (syncEvent.tag !== 'publish-queue') return;
  syncEvent.waitUntil?.(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) client.postMessage({ type: 'sync-queue' });
    }),
  );
});

self.addEventListener('push', (event: PushEvent) => {
  const payload = (event.data?.json() ?? {}) as {
    title?: string;
    body?: string;
    url?: string;
    tag?: string;
  };
  const options: NotificationOptions = {
    body: payload.body ?? '',
    icon: '/icons/icon-192.png',
    badge: '/icons/badge-72.png',
    data: { url: payload.url ?? '/today' },
    silent: true,
  };
  if (payload.tag) options.tag = payload.tag;
  event.waitUntil(self.registration.showNotification(payload.title ?? 'Inkwell', options));
});

self.addEventListener('notificationclick', (event: NotificationEvent) => {
  event.notification.close();
  const url = (event.notification.data as { url?: string } | undefined)?.url ?? '/today';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(async (clients) => {
      const existing = clients.find((client) => 'focus' in client);
      if (existing) {
        await existing.navigate(url);
        return existing.focus();
      }
      return self.clients.openWindow(url);
    }),
  );
});
