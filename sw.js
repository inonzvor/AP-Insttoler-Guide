const CACHE_NAME = "ap-guide-v15";
const ASSETS = [
  "./",
  "./index.html",
  "./catalog.html",
  "./install.html",
  "./glossary.html",
  "./manifest.webmanifest",
  "./assets/app.css",
  "./assets/i18n.js",
  "./assets/app.js",
  "./assets/picker.js",
  "./assets/setup.js",
  "./assets/images/hik-partner-pro.png",
  "./assets/images/DS-3WAP521-SI.jpg",
  "./assets/images/DS-3WAP621E-SI.jpg",
  "./assets/images/DS-3WAP522-SI.webp",
  "./assets/images/DS-3WAP622G-SI.jpg",
  "./assets/images/DS-3WAP6218-EI.png",
  "./assets/images/DS-3WAP622E-SI.jpg",
  "./assets/images/DS-3WAP5312-EI.png",
  "./assets/images/DS-3WAP623E-SI.jpg",
  "./assets/images/hikpartner/hp-01-sites.png",
  "./assets/images/hikpartner/hp-02-new-device.png",
  "./assets/images/hikpartner/hp-03-find-devices.png",
  "./assets/images/hikpartner/hp-04-activate.png",
  "./assets/images/hikpartner/hp-05-init.png",
  "./assets/images/hikpartner/hp-06-wifi.png",
  "./assets/images/hikpartner/hp-07-add-site.png",
  "./assets/images/hikpartner/hp-08-done.png",
  "./assets/images/activation/act-sadp.png",
  "./assets/images/activation/act-web.png",
  "./assets/images/firmware/fw-01-site-menu.jpg",
  "./assets/images/firmware/fw-02-operation.jpg",
  "./assets/images/firmware/fw-03-settings-list.jpg",
  "./assets/images/firmware/fw-04-system-settings.jpg",
  "./assets/images/firmware/fw-05-basic-info.jpg",
  "./assets/images/firmware/fw-06-google-search.png",
  "./assets/images/firmware/fw-07-hikvision-firmware.png",
  "./assets/images/firmware/fw-08-offline-update.png",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-maskable-512.png",
  "./icons/apple-touch-icon.png",
  "./icons/favicon-32.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const isFont = req.url.indexOf("fonts.googleapis.com") !== -1 || req.url.indexOf("fonts.gstatic.com") !== -1;

  if (isFont) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) =>
        cache.match(req).then((cached) => {
          const network = fetch(req).then((res) => {
            cache.put(req, res.clone());
            return res;
          }).catch(() => cached);
          return cached || network;
        })
      )
    );
    return;
  }

  event.respondWith(
    caches.match(req).then((cached) => {
      const network = fetch(req).then((res) => {
        if (res && res.status === 200 && res.type === "basic") {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
        }
        return res;
      }).catch(() => cached);
      return cached || network;
    })
  );
});
