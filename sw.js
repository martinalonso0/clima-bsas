var CACHE_NAME = "clima-ba-v4";
var URLS_TO_CACHE = [
    "./index.html",
    "./styles.css",
    "./app.js",
    "./icon.svg",
    "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css",
    "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
];

self.addEventListener("install", function (e) {
    e.waitUntil(
        caches.open(CACHE_NAME).then(function (cache) {
            return cache.addAll(URLS_TO_CACHE);
        })
    );
    self.skipWaiting();
});

self.addEventListener("activate", function (e) {
    e.waitUntil(
        caches.keys().then(function (names) {
            return Promise.all(
                names.filter(function (n) { return n !== CACHE_NAME; })
                    .map(function (n) { return caches["delete"](n); })
            );
        })
    );
    self.clients.claim();
});

self.addEventListener("fetch", function (e) {
    if (e.request.url.indexOf("api.open-meteo.com") !== -1 ||
        e.request.url.indexOf("api.rainviewer.com") !== -1 ||
        e.request.url.indexOf("media.giphy.com") !== -1) {
        e.respondWith(
            fetch(e.request).then(function (resp) {
                var clone = resp.clone();
                caches.open(CACHE_NAME).then(function (cache) {
                    cache.put(e.request, clone);
                });
                return resp;
            })["catch"](function () {
                return caches.match(e.request);
            })
        );
        return;
    }
    e.respondWith(
        caches.match(e.request).then(function (cached) {
            return cached || fetch(e.request);
        })
    );
});
