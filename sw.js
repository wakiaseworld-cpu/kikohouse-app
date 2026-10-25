// 通知を押したら、その通知の画面を開く（Firebaseより先に受け取る）
self.addEventListener('notificationclick', e => {
  const d = e.notification.data || {}, m = d.FCM_MSG || {};
  const go = String(d.go || (m.data && m.data.go) || '');
  e.stopImmediatePropagation();
  e.notification.close();
  const url = new URL('app.html' + (go ? '#' + go : ''), self.registration.scope).href;
  e.waitUntil(clients.matchAll({ type: 'window', includeUncontrolled: true }).then(cs => {
    const c = cs.find(x => x.url.indexOf(self.registration.scope) === 0);
    if (c) return c.focus().then(w => (w || c).navigate(url)).catch(() => clients.openWindow(url));
    return clients.openWindow(url);
  }));
});
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js', 'https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');
firebase.initializeApp({"apiKey": "AIzaSyCmHJLuKoEXS2lYhl6d-ms2N0Xa3ExiF0s", "authDomain": "kikohouse-943cf.firebaseapp.com", "projectId": "kikohouse-943cf", "storageBucket": "kikohouse-943cf.firebasestorage.app", "messagingSenderId": "340471681800", "appId": "1:340471681800:web:0868f848740206b4a812bd"});
firebase.messaging();

const CACHE = 'kikohouse-v9';
const FILES = ['./', 'index.html', 'app.html', 'app.bin', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png'];
self.addEventListener('install', e => { self.skipWaiting(); e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES))); });
self.addEventListener('activate', e => e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  // 古い画面が残らないよう、ブラウザの一時保存を使わず毎回最新を取りにいく
  e.respondWith(fetch(e.request.url, { cache: 'no-cache', credentials: 'same-origin' }).then(r => { const c = r.clone(); caches.open(CACHE).then(x => x.put(e.request, c)); return r; }).catch(() => caches.match(e.request)));
});
