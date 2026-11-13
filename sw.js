/* Service worker «Раскрой онлайн»: после первого открытия приложение работает без интернета.
   Все файлы одной версии кладутся в кэш разом, поэтому страница и скрипты никогда не расходятся.
   Новая версия ставится в фоне и включается, когда пользователь нажмёт «Обновить». */
'use strict';

var VERSION = '39';   /* меняйте вместе с ?v=… в index.html и VERSION в js/raskroy.js */
var CACHE = 'raskroy-v' + VERSION;
var V = '?v=' + VERSION;

var ASSETS = [
    './', './index.html', './manifest.webmanifest',
    './css/reset.css' + V, './css/style.css' + V,
    './js/cloud-config.js' + V, './js/theme-init.js' + V, './js/cloud.js' + V, './js/auth.js' + V, './js/profile.js' + V, './js/ui.js' + V, './js/i18n.js' + V,
    './js/raskroy-core.js' + V, './js/raskroy.js' + V, './js/app.js' + V, './js/raskroy-worker.js' + V,
    './js/export.js' + V, './js/export-i18n.js' + V, './js/select.js' + V, './js/smartpaste.js' + V, './js/photos.js' + V, './js/dialog.js' + V, './js/colorpick.js' + V, './js/fold.js' + V, './js/fabric-i18n.js' + V, './js/look-i18n.js' + V, './js/look.js' + V, './js/fabric-core.js' + V, './js/fabric.js' + V,
    './fonts/inter-400.woff', './fonts/inter-500.woff', './fonts/inter-600.woff', './fonts/inter-700.woff',
    './img/favicon.svg',
    './icons/icon-192.png', './icons/icon-512.png', './icons/icon-maskable-512.png', './icons/apple-touch-icon.png', './icons/favicon-32.png'
];

self.addEventListener('install', function (e) {
    e.waitUntil(caches.open(CACHE).then(function (c) {
        /* cache: 'reload' — берём свежие файлы с сервера, а не из HTTP-кэша браузера */
        return Promise.all(ASSETS.map(function (u) {
            return fetch(new Request(u, { cache: 'reload' })).then(function (r) {
                if (!r.ok) throw new Error(u + ' ' + r.status);
                return c.put(u, r);
            });
        }));
    }));
});

self.addEventListener('activate', function (e) {
    e.waitUntil(caches.keys().then(function (keys) {
        return Promise.all(keys.filter(function (k) { return k.indexOf('raskroy-v') === 0 && k !== CACHE; }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); }));
});

self.addEventListener('message', function (e) {
    if (e.data === 'SKIP_WAITING') self.skipWaiting();
    else if (e.data === 'GET_VERSION' && e.source) e.source.postMessage({ type: 'VERSION', version: VERSION });
});

self.addEventListener('fetch', function (e) {
    var req = e.request;
    if (req.method !== 'GET') return;
    var url = new URL(req.url);
    if (url.origin !== self.location.origin) return;

    /* настройки облака: сначала сеть, чтобы новый адрес и ключ подхватились без смены версии; без сети берём сохранённые */
    if (/\/js\/cloud-config\.js$/.test(url.pathname)) {
        e.respondWith(fetch(req).then(function (res) {
            if (res && res.ok) { var cp = res.clone(); caches.open(CACHE).then(function (c) { c.put(req, cp); }); }
            return res;
        }).catch(function () { return caches.open(CACHE).then(function (c) { return c.match(req, { ignoreSearch: true }); }); }));
        return;
    }

    /* переходы по страницам: всегда отдаём сохранённую главную (параметры ?action=… и ?source=… не важны) */
    if (req.mode === 'navigate') {
        e.respondWith(caches.open(CACHE).then(function (c) {
            return c.match('./index.html').then(function (hit) {
                return hit || fetch(req);
            });
        }));
        return;
    }

    e.respondWith(caches.open(CACHE).then(function (c) {
        return c.match(req).then(function (hit) {
            if (hit) return hit;
            /* файл не из списка (например, 404.html): пробуем сеть и запоминаем */
            return fetch(req).then(function (res) {
                if (res && res.ok && res.type === 'basic') c.put(req, res.clone());
                return res;
            }).catch(function () { return c.match(req, { ignoreSearch: true }); });
        });
    }));
});
