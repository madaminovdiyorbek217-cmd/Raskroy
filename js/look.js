/* Панель «Оформление»: тема, фон (24 готовых и свой цвет), цвет акцента (15 готовых и свой). Расчёт цветов лежит в theme-init.js (RKLook). */
(function () {
    'use strict';
    var L = window.RKLook, I = window.RKI18N;
    var panel = document.getElementById('lk');
    if (!L || !panel) return;

    var ov = document.getElementById('lk-ov');
    var closeBtn = document.getElementById('lk-close');
    var openers = Array.prototype.slice.call(document.querySelectorAll('[data-look-open]'));
    var gridL = document.getElementById('lk-bg-l'), gridD = document.getElementById('lk-bg-d'), gridA = document.getElementById('lk-acc');
    var bgPick = document.getElementById('lk-bg-pick'), accPick = document.getElementById('lk-acc-pick');
    var bgHex = document.getElementById('lk-bg-hex'), accHex = document.getElementById('lk-acc-hex');
    var root = document.documentElement;
    var look = L.get();
    var lastOpener = null;

    function t(k) { return I ? I.t(k) : k; }
    function lang() { return I ? I.lang() : 'ru'; }
    function name(o) { return o.n[lang()] || o.n.ru; }

    function sw(kind, o) {
        var b = document.createElement('button');
        b.type = 'button'; b.setAttribute('role', 'radio'); b.className = 'lk-sw lk-sw--' + kind;
        b.setAttribute('data-id', o.id || '');
        if (kind === 'bg') b.style.setProperty('--sw', o.img ? o.img : o.c);
        else if (kind === 'acc') b.style.setProperty('--sw', o.c);
        return b;
    }
    function label(b, o) { var n = name(o); b.title = n; b.setAttribute('aria-label', n); }

    /* ---------- построение ---------- */
    var items = [];   /* {btn, o, kind} */
    function std(kind) {
        var b = sw(kind, { id: '', c: 'transparent' }); b.classList.add('lk-sw--std'); b.title = t('lk.std'); b.setAttribute('aria-label', t('lk.std'));
        return b;
    }
    function build() {
        gridL.innerHTML = gridD.innerHTML = gridA.innerHTML = ''; items = [];
        var s1 = std('bg'); gridL.appendChild(s1); items.push({ btn: s1, o: { id: '' }, kind: 'bg' });
        L.BG.forEach(function (o) {
            var b = sw('bg', o); label(b, o); (o.tone === 'l' ? gridL : gridD).appendChild(b); items.push({ btn: b, o: o, kind: 'bg' });
        });
        var s2 = std('acc'); gridA.appendChild(s2); items.push({ btn: s2, o: { id: '' }, kind: 'acc' });
        L.ACC.forEach(function (o) {
            var b = sw('acc', o); label(b, o); gridA.appendChild(b); items.push({ btn: b, o: o, kind: 'acc' });
        });
        mark();
    }
    function relabel() {
        items.forEach(function (it) { if (it.o.id) label(it.btn, it.o); else { it.btn.title = t('lk.std'); it.btn.setAttribute('aria-label', t('lk.std')); } });
    }

    function accId() { var o = null; L.ACC.forEach(function (a) { if (look.accent && a.c.toLowerCase() === look.accent.toLowerCase()) o = a; }); return o ? o.id : null; }
    function mark() {
        var bgId = look.bg && L.byId(L.BG, look.bg) ? look.bg : null;
        var aId = accId();
        items.forEach(function (it) {
            var on;
            if (it.kind === 'bg') on = it.o.id ? it.o.id === bgId : !look.bg;
            else on = it.o.id ? it.o.id === aId : !look.accent;
            it.btn.setAttribute('aria-checked', String(on)); it.btn.tabIndex = on ? 0 : -1;
        });
        var customBg = !!look.bg && !bgId, customAcc = !!look.accent && !aId;
        bgPick.closest('.lk-pick').classList.toggle('is-on', customBg);
        accPick.closest('.lk-pick').classList.toggle('is-on', customAcc);
        if (customBg) { bgPick.value = look.bg; bgHex.textContent = look.bg.toUpperCase(); } else bgHex.textContent = '';
        if (customAcc) { accPick.value = look.accent; accHex.textContent = look.accent.toUpperCase(); } else accHex.textContent = '';
        /* выбранные цвета показываем и в самих «своих» плитках */
        bgPick.closest('.lk-pick').style.setProperty('--pick', customBg ? look.bg : '');
        accPick.closest('.lk-pick').style.setProperty('--pick', customAcc ? look.accent : '');
    }

    /* ---------- применение ---------- */
    /* тема в интерфейсе (кнопки света/синего/чёрного) переключается кликом по её кнопке, как обычно */
    var internal = false;
    function syncTheme() {
        var want = root.getAttribute('data-theme');
        internal = true;
        var b = document.querySelector('[data-set-theme="' + want + '"]');
        if (b && b.getAttribute('aria-checked') !== 'true') b.click();
        internal = false;
    }
    function commit() {
        var r = L.apply(look);   /* может сменить data-theme, если фон другого тона */
        if (look.bg && r && r.theme !== undefined) syncTheme();
        L.apply(look);           /* после синхронизации темы пересчитываем цвета ещё раз */
        L.save(look);
        mark();
    }
    function setBg(v) { look.bg = v || undefined; if (!v) delete look.bg; commit(); }
    function setAcc(v) { if (v) look.accent = v; else delete look.accent; commit(); }

    [gridL, gridD].forEach(function (g) {
        g.addEventListener('click', function (e) { var b = e.target.closest('.lk-sw'); if (b) setBg(b.getAttribute('data-id')); });
    });
    gridA.addEventListener('click', function (e) {
        var b = e.target.closest('.lk-sw'); if (!b) return;
        var id = b.getAttribute('data-id'), o = id ? L.byId(L.ACC, id) : null;
        setAcc(o ? o.c : '');
    });
    /* стрелки внутри группы */
    [gridL, gridD, gridA].forEach(function (g) {
        g.addEventListener('keydown', function (e) {
            var d = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : (e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0);
            if (!d) return;
            e.preventDefault();
            var list = Array.prototype.slice.call(g.querySelectorAll('.lk-sw')), i = list.indexOf(document.activeElement);
            if (i < 0) return;
            var n = list[(i + d + list.length) % list.length]; n.focus(); n.click();
        });
    });
    var bgTimer, accTimer;
    bgPick.addEventListener('input', function () { look.bg = bgPick.value; clearTimeout(bgTimer); L.apply(look); mark(); bgTimer = setTimeout(commit, 120); });
    accPick.addEventListener('input', function () { look.accent = accPick.value; clearTimeout(accTimer); L.apply(look); mark(); accTimer = setTimeout(commit, 120); });

    /* выбор темы кнопкой сбрасывает фон: у каждой темы свой фон, а акцент остаётся */
    Array.prototype.forEach.call(document.querySelectorAll('[data-set-theme]'), function (b) {
        b.addEventListener('click', function () {
            if (internal) return;
            delete look.bg; L.apply(look); L.save(look); mark();
        });
    });

    document.getElementById('lk-reset').addEventListener('click', function () {
        look = {}; L.save(look);
        try { localStorage.removeItem('accent'); } catch (e) { /* хранилище недоступно */ }
        L.apply(look); mark();
        if (window.RKApp && window.RKApp.toast) window.RKApp.toast(t('lk.reset.done'));
    });

    /* ---------- открытие и закрытие ---------- */
    function open(from) {
        lastOpener = from || null;
        ov.hidden = false; panel.hidden = false;
        requestAnimationFrame(function () { panel.classList.add('is-on'); ov.classList.add('is-on'); });
        root.classList.add('lk-lock');
        openers.forEach(function (o) { o.setAttribute('aria-expanded', 'true'); });
        var pop = document.getElementById('isl-pop'); if (pop && !pop.hidden) { var sb = document.getElementById('isl-set'); if (sb) sb.click(); }
        setTimeout(function () { closeBtn.focus(); }, 30);
    }
    function close() {
        panel.classList.remove('is-on'); ov.classList.remove('is-on');
        root.classList.remove('lk-lock');
        openers.forEach(function (o) { o.setAttribute('aria-expanded', 'false'); });
        setTimeout(function () { panel.hidden = true; ov.hidden = true; }, 200);
        if (lastOpener && lastOpener.offsetParent) lastOpener.focus();
    }
    openers.forEach(function (o) { o.addEventListener('click', function () { if (panel.hidden) open(o); else close(); }); });
    closeBtn.addEventListener('click', close);
    ov.addEventListener('click', close);
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && !panel.hidden) { e.preventDefault(); close(); }
        /* Tab не уходит за пределы окна */
        if (e.key === 'Tab' && !panel.hidden) {
            var f = Array.prototype.slice.call(panel.querySelectorAll('button, input, [tabindex="0"]')).filter(function (x) { return x.offsetParent && x.tabIndex >= 0 && !x.disabled; });
            if (!f.length) return;
            var first = f[0], last = f[f.length - 1];
            if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
            else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
        }
    });

    build();
    document.addEventListener('rk:lang', relabel);
    /* ui.js при старте ставит цвет полоски браузера по теме: возвращаем выбранный фон */
    commit();
    window.RKLookUI = { open: open, close: close };
})();
