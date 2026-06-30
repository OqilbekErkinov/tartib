const CACHE = 'tartibla-v3';

const APP_SHELL = [
  './',
  './index.html',
  './style.css',
  './manifest.json',
  './favicon.svg',
  './js/storage.js',
  './js/finance.js',
  './js/books.js',
  './js/habits.js',
  './js/goals.js',
  './js/subscriptions.js',
  './js/notes.js',
  './js/profile.js',
  './js/feedback.js',
  './js/onboarding.js',
  './js/timer.js',
  './js/app.js',
  './js/auth.js',
];

// O'rnatishda barcha asosiy fayllarni keshlash
self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(APP_SHELL))
  );
});

// Eski keshlarni o'chirish
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE).map(k => caches.delete(k))
      ))
      .then(() => clients.claim())
  );
});

// So'rovlarni ushlash: cache-first, Supabase API ga network
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Supabase API so'rovlari — faqat tarmoq orqali (ma'lumot sinxi)
  if (url.hostname.includes('supabase.co')) return;

  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;

      return fetch(e.request).then(res => {
        // Muvaffaqiyatli GET so'rovlarni keshga saqlash
        if (res.ok && e.request.method === 'GET') {
          caches.open(CACHE).then(c => c.put(e.request, res.clone()));
        }
        return res;
      });
    }).catch(() => {
      // Oflayn va keshda yo'q bo'lsa — index.html qaytarish
      if (e.request.mode === 'navigate') {
        return caches.match('./index.html');
      }
    })
  );
});

// Notification bosilganda ilovani ochish
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      for (const c of list) if ('focus' in c) return c.focus();
      return clients.openWindow('./');
    })
  );
});
