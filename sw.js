// 小帳本 service worker
// - 有網路時：自動抓最新版（3 秒內沒回應就先用手機裡的版本）
// - 沒網路時：用手機裡存好的版本
// - 記帳資料存在 localStorage，更新程式不會動到資料
const VERSION = "2026.11.08-6";
const CACHE = "xiaozhangben-" + VERSION;
const FILES = ["./", "./index.html", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png", "./icon-maskable-512.png", "./apple-touch-icon.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES.map(f => new Request(f, {cache: "reload"})))).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith("xiaozhangben-") && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) return;
  if (e.request.mode === "navigate") {
    e.respondWith((async () => {
      const cache = await caches.open(CACHE);
      const net = fetch(e.request, {cache: "no-store"}).then(r => { if (r.ok) cache.put("./index.html", r.clone()); return r; });
      const timeout = new Promise(res => setTimeout(res, 3000));
      try {
        const r = await Promise.race([net, timeout]);
        if (r) return r;
      } catch (err) {}
      const hit = await cache.match("./index.html");
      return hit || net;
    })());
    return;
  }
  e.respondWith(caches.match(e.request).then(hit => hit || fetch(e.request)));
});
