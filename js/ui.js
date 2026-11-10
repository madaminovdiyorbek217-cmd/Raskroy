/* Переключатель темы (светлая, тёмно-синяя, чёрная), мобильный островок-меню и год в подвале. */
(function () {
    'use strict';
    var root = document.documentElement;
    var btns = Array.prototype.slice.call(document.querySelectorAll('[data-set-theme]'));
    var COLORS = { light: '#edf0f6', navy: '#081327', black: '#000000' };
    var meta = document.querySelector('meta[name="theme-color"]');

    function setTheme(t) {
        root.setAttribute('data-theme', t);
        btns.forEach(function (b) {
            var on = b.getAttribute('data-set-theme') === t;
            b.setAttribute('aria-checked', String(on));
            b.tabIndex = on ? 0 : -1;
        });
        if (meta) meta.setAttribute('content', COLORS[t] || COLORS.navy);
        /* пока цвет акцента не выбран вручную, у каждой темы свой по умолчанию */
        if (typeof markAccent === 'function') markAccent(storedAccent() || themeDefault(t));
    }
    btns.forEach(function (b) {
        b.addEventListener('click', function () {
            var t = b.getAttribute('data-set-theme');
            setTheme(t);
            try { localStorage.setItem('theme', t); } catch (e) { /* хранилище недоступно */ }
        });
        /* стрелки переключают тему внутри своей группы */
        b.addEventListener('keydown', function (e) {
            var d = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : (e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0);
            if (!d) return;
            e.preventDefault();
            var group = Array.prototype.slice.call(b.parentNode.querySelectorAll('[data-set-theme]'));
            var n = group[(group.indexOf(b) + d + group.length) % group.length];
            n.focus(); n.click();
        });
    });
    /* ---------- Цвет акцента ---------- */
    var ACCENTS = ['blue', 'emerald', 'violet', 'coral', 'cyan'];
    var accBtns = Array.prototype.slice.call(document.querySelectorAll('[data-set-accent]'));
    function storedAccent() { try { var a = localStorage.getItem('accent'); return ACCENTS.indexOf(a) >= 0 ? a : null; } catch (e) { return null; } }
    function themeDefault(t) { return t === 'black' ? 'cyan' : 'blue'; }
    function markAccent(a) {
        root.setAttribute('data-accent', a);
        accBtns.forEach(function (b) {
            var on = b.getAttribute('data-set-accent') === a;
            b.setAttribute('aria-checked', String(on));
            b.tabIndex = on ? 0 : -1;
        });
    }
    accBtns.forEach(function (b) {
        b.addEventListener('click', function () {
            var a = b.getAttribute('data-set-accent');
            markAccent(a);
            try { localStorage.setItem('accent', a); } catch (e) { /* хранилище недоступно */ }
        });
        b.addEventListener('keydown', function (e) {
            var d = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : (e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0);
            if (!d) return;
            e.preventDefault();
            var group = Array.prototype.slice.call(b.parentNode.querySelectorAll('[data-set-accent]'));
            var n = group[(group.indexOf(b) + d + group.length) % group.length];
            n.focus(); n.click();
        });
    });

    var cur = root.getAttribute('data-theme');
    setTheme(COLORS[cur] ? cur : 'navy');
    var y = document.getElementById('year');
    if (y) y.textContent = String(new Date().getFullYear());

    /* ---------- Режим: плиты или ткань ---------- */
    var toolBtns = Array.prototype.slice.call(document.querySelectorAll('[data-tool-set]'));
    function curTool() { return root.getAttribute('data-tool') === 'fabric' ? 'fabric' : 'plates'; }
    function markTool() {
        var t = curTool();
        toolBtns.forEach(function (b) {
            var on = b.getAttribute('data-tool-set') === t;
            b.setAttribute('aria-checked', String(on));
            b.tabIndex = on ? 0 : -1;
        });
    }
    function setTool(t) {
        if (t !== 'plates' && t !== 'fabric') return;
        var changed = t !== curTool();
        root.setAttribute('data-tool', t);
        try { localStorage.setItem('rk-tool', t); } catch (e) { /* хранилище недоступно */ }
        markTool();
        if (changed) {
            window.scrollTo(0, 0);
            document.dispatchEvent(new CustomEvent('rk:tool', { detail: t }));
        }
    }
    toolBtns.forEach(function (b) {
        b.addEventListener('click', function () { setTool(b.getAttribute('data-tool-set')); });
        b.addEventListener('keydown', function (e) {
            var d = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : (e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0);
            if (!d) return;
            e.preventDefault();
            var group = Array.prototype.slice.call(b.parentNode.querySelectorAll('[data-tool-set]'));
            var n = group[(group.indexOf(b) + d + group.length) % group.length];
            n.focus(); n.click();
        });
    });
    Array.prototype.forEach.call(document.querySelectorAll('[data-tool-go]'), function (b) {
        b.addEventListener('click', function () { setTool(b.getAttribute('data-tool-go')); });
    });
    markTool();
    window.RKTool = { set: setTool, get: curTool };

    /* ---------- Островок-меню ---------- */
    var island = document.getElementById('rk-island');
    var pop = document.getElementById('isl-pop');
    var setBtn = document.getElementById('isl-set');
    if (!island || !pop || !setBtn) return;

    function closePop() {
        pop.hidden = true;
        setBtn.setAttribute('aria-expanded', 'false');
        setBtn.classList.remove('is-active');
    }
    function togglePop() {
        var open = pop.hidden;
        pop.hidden = !open;
        setBtn.setAttribute('aria-expanded', String(open));
        setBtn.classList.toggle('is-active', open);
    }
    setBtn.addEventListener('click', function (e) { e.stopPropagation(); togglePop(); });
    pop.addEventListener('click', function (e) { e.stopPropagation(); });
    document.addEventListener('click', closePop);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !pop.hidden) { closePop(); setBtn.focus(); } });
    Array.prototype.forEach.call(island.querySelectorAll('[data-spy], [data-run]'), function (el) { el.addEventListener('click', closePop); });

    /* подсветка раздела, который сейчас на экране */
    var spies = Array.prototype.slice.call(island.querySelectorAll('[data-spy]'));
    var heads = spies.map(function (a) { return document.getElementById(a.getAttribute('data-spy')); });
    var ticking = false;
    function spy() {
        ticking = false;
        var line = window.innerHeight * 0.55, curIdx = -1, lastVis = -1;
        heads.forEach(function (h, i) {
            /* пункты другого режима скрыты, их пропускаем */
            if (!h || !spies[i].getClientRects().length || !h.getClientRects().length) return;
            lastVis = i;
            if (h.getBoundingClientRect().top <= line) curIdx = i;
        });
        if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) curIdx = lastVis;
        spies.forEach(function (a, i) {
            a.classList.toggle('is-active', i === curIdx);
            if (i === curIdx) a.setAttribute('aria-current', 'location'); else a.removeAttribute('aria-current');
        });
    }
    function onScroll() { if (!ticking) { ticking = true; window.requestAnimationFrame(spy); } }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    spy();
    document.addEventListener('rk:tool', function () { setTimeout(spy, 30); });

    /* при вводе с экранной клавиатуры островок прячется, чтобы не закрывать поле */
    var hideTimer = 0;
    function isField(el) { return el && /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName); }
    document.addEventListener('focusin', function (e) {
        if (!isField(e.target) || island.contains(e.target)) return;
        clearTimeout(hideTimer);
        island.classList.add('is-hidden');
        closePop();
    });
    document.addEventListener('focusout', function () {
        clearTimeout(hideTimer);
        hideTimer = setTimeout(function () { if (!isField(document.activeElement)) island.classList.remove('is-hidden'); }, 180);
    });
})();
