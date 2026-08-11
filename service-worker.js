const CACHE_NAME = "kiyosan-tangram-v2-1-ipad-flip";
const APP_FILES = [
  "./",
  "./index.html",
  "./style.css",
  "./script.js",
  "./wood-texture-fine.png",
  "./manifest.webmanifest",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/apple-touch-icon.png"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(APP_FILES))
  );
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  const isAppCode = event.request.mode === "navigate" ||
    /\/(index\.html|style\.css|script\.js)$/.test(url.pathname);

  // プログラム本体はオンライン時に最新版を取得し、通信できない場合だけ保存版を使う。
  if (isAppCode) {
    event.respondWith(
      fetch(event.request).then(response => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
        }
        return response;
      }).catch(() =>
        caches.match(event.request).then(cached => cached || caches.match("./index.html"))
      )
    );
    return;
  }

  // 画像やアイコンは保存版を優先して、オフラインでもすぐ表示する。
  event.respondWith(
    caches.match(event.request).then(cached => {
      return cached || fetch(event.request).then(response => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
        return response;
      }).catch(() => caches.match("./index.html"));
    })
  );
});
