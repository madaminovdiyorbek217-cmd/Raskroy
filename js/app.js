/* Приложение: установка на устройство, работа без интернета, обновления, открытие файлов из системы. */
(function () {
    'use strict';

    var I = window.RKI18N;
    function t(key, vars) { return I ? I.t(key, vars) : key; }
    function $$(s) { return Array.prototype.slice.call(document.querySelectorAll(s)); }

    var standalone = (window.matchMedia && window.matchMedia('(display-mode: standalone), (display-mode: minimal-ui), (display-mode: window-controls-overlay)').matches) || window.navigator.standalone === true;
    if (standalone) document.documentElement.classList.add('is-app');

    /* ---------- Нижняя плашка: обновление, подсказка для iPhone ---------- */
    var bar = document.createElement('div');
    bar.className = 'rk-appbar';
    bar.setAttribute('role', 'status');
    bar.hidden = true;
    document.body.appendChild(bar);
    var barTimer;
    function showBar(text, actions, autoHide) {
        clearTimeout(barTimer);
        bar.innerHTML = '';
        var p = document.createElement('p'); p.textContent = text; bar.appendChild(p);
        (actions || []).forEach(function (a) {
            var b = document.createElement('button');
            b.type = 'button'; b.className = 'rk-btn' + (a.main ? ' rk-btn--main' : '');
            b.textContent = a.label; b.addEventListener('click', a.fn); bar.appendChild(b);
        });
        bar.hidden = false;
        requestAnimationFrame(function () { bar.classList.add('is-on'); });
        if (autoHide) barTimer = setTimeout(hideBar, autoHide);
    }
    function hideBar() {
        bar.classList.remove('is-on');
        setTimeout(function () { bar.hidden = true; }, 250);
    }
    function toast(msg) { if (window.RKApp && window.RKApp.toast) window.RKApp.toast(msg); }

    /* ---------- Установка ---------- */
    var deferred = null;
    var isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    function syncInstallButtons() {
        var can = !standalone && (deferred || isIOS);
        $$('[data-install]').forEach(function (b) { b.hidden = !can; });
    }
    window.addEventListener('beforeinstallprompt', function (e) {
        e.preventDefault();
        deferred = e;
        syncInstallButtons();
    });
    window.addEventListener('appinstalled', function () {
        deferred = null;
        syncInstallButtons();
        toast(t('app.installed'));
    });
    $$('[data-install]').forEach(function (b) {
        b.addEventListener('click', function () {
            if (deferred) {
                deferred.prompt();
                deferred.userChoice.then(function () { deferred = null; syncInstallButtons(); }, function () { /* закрыли окно */ });
            } else if (isIOS) {
                showBar(t('app.ios'), [{ label: t('app.ok'), fn: hideBar }]);
            }
        });
    });
    syncInstallButtons();
    document.addEventListener('rk:lang', function () { $$('[data-install] span').forEach(function (s) { s.textContent = t('app.install'); }); });

    /* ---------- Постоянное хранилище: чтобы браузер не стирал работы при нехватке места ---------- */
    if (navigator.storage && navigator.storage.persist) {
        navigator.storage.persisted().then(function (p) { if (!p) return navigator.storage.persist(); }).catch(function () { /* не страшно */ });
    }

    /* ---------- Сеть ---------- */
    var wasOffline = !navigator.onLine;
    function netChange() {
        document.documentElement.classList.toggle('is-offline', !navigator.onLine);
        if (!navigator.onLine) { wasOffline = true; toast(t('app.offline')); }
        else if (wasOffline) { wasOffline = false; toast(t('app.online')); }
    }
    window.addEventListener('online', netChange);
    window.addEventListener('offline', netChange);
    if (!navigator.onLine) document.documentElement.classList.add('is-offline');

    /* ---------- Service worker: офлайн и обновления ---------- */
    if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1')) {
        var reloading = false, hadController = !!navigator.serviceWorker.controller;
        navigator.serviceWorker.addEventListener('controllerchange', function () {
            if (!hadController) { hadController = true; return; }   /* первая установка: перезагружать не нужно */
            if (reloading) return;
            reloading = true;
            location.reload();
        });
        navigator.serviceWorker.register('./sw.js', { updateViaCache: 'none' }).then(function (reg) {
            function offer(worker) {
                showBar(t('app.update'), [
                    { label: t('app.reload'), main: true, fn: function () { worker.postMessage('SKIP_WAITING'); } },
                    { label: t('app.later'), fn: hideBar }
                ]);
            }
            if (reg.waiting && navigator.serviceWorker.controller) offer(reg.waiting);
            reg.addEventListener('updatefound', function () {
                var nw = reg.installing;
                if (!nw) return;
                nw.addEventListener('statechange', function () {
                    if (nw.state === 'installed' && navigator.serviceWorker.controller) offer(nw);
                    else if (nw.state === 'installed' && !hadController) toast(t('app.ready'));
                });
            });
            /* проверка новой версии при возврате в приложение и раз в час */
            document.addEventListener('visibilitychange', function () { if (!document.hidden) reg.update().catch(function () {}); });
            setInterval(function () { reg.update().catch(function () {}); }, 3600 * 1000);
        }).catch(function () { /* без service worker сайт работает как обычно */ });
    }

    /* ---------- Открытие файлов: двойной клик по .project, «Открыть с помощью», перетаскивание ---------- */
    function openFile(f) { if (f && window.RKApp) window.RKApp.importFile(f); }

    if ('launchQueue' in window && window.launchQueue && window.launchQueue.setConsumer) {
        window.launchQueue.setConsumer(function (params) {
            if (!params || !params.files || !params.files.length) return;
            params.files[0].getFile().then(openFile, function () { toast(t('imp.err')); });
        });
    }

    var drop = document.getElementById('rk-drop'), depth = 0;
    function hasFiles(e) { return e.dataTransfer && Array.prototype.indexOf.call(e.dataTransfer.types || [], 'Files') >= 0; }
    window.addEventListener('dragenter', function (e) { if (!hasFiles(e)) return; depth++; if (drop) drop.hidden = false; });
    window.addEventListener('dragleave', function (e) { if (!hasFiles(e)) return; depth = Math.max(0, depth - 1); if (!depth && drop) drop.hidden = true; });
    window.addEventListener('dragover', function (e) { if (hasFiles(e)) e.preventDefault(); });
    window.addEventListener('drop', function (e) {
        if (!hasFiles(e)) return;
        e.preventDefault(); depth = 0; if (drop) drop.hidden = true;
        openFile(e.dataTransfer.files && e.dataTransfer.files[0]);
    });

    /* ---------- Ярлыки приложения (?action=new / import / works) ---------- */
    function runAction() {
        var a = null;
        try { a = new URLSearchParams(location.search).get('action'); } catch (e) { /* старый браузер */ }
        if (!a || !window.RKApp) return;
        try { history.replaceState(null, '', location.pathname + location.hash); } catch (e) { /* не страшно */ }
        if (a === 'fabric') { if (window.RKTool) window.RKTool.set('fabric'); }
        else if (a === 'new') { if (window.RKTool) window.RKTool.set('plates'); window.RKApp.newWork(); }
        else if (a === 'import') { var b = document.getElementById('rk-import'); if (b) { b.scrollIntoView({ block: 'center' }); b.focus(); } }
        else if (a === 'works') { var h = document.getElementById('rk-h-works'); if (h) h.scrollIntoView(); }
    }
    if (document.readyState === 'complete') runAction(); else window.addEventListener('load', runAction);
})();
