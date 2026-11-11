/* Свой выбор цвета вместо системного окна Android «Выберите цвет».
   RKColorPick.open({ title, value:'#rrggbb', onInput(hex), onDone(hex), onCancel(hex0) }) */
(function () {
    'use strict';
    var RK = 'rk-recent-colors';
    var cur = null;

    function t(k, fb) { try { var v = window.RKI18N ? window.RKI18N.t(k) : ''; return v && v !== k ? v : fb; } catch (e) { return fb; } }
    function el(tag, cls, attrs) { var n = document.createElement(tag); if (cls) n.className = cls; if (attrs) for (var k in attrs) n.setAttribute(k, attrs[k]); return n; }
    function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
    function isHex(s) { return /^#[0-9a-f]{6}$/i.test(s); }
    function norm(s) {
        s = String(s || '').trim().replace(/^#/, '').toLowerCase();
        if (/^[0-9a-f]{3}$/.test(s)) s = s.replace(/./g, function (c) { return c + c; });
        return /^[0-9a-f]{6}$/.test(s) ? '#' + s : null;
    }
    function hex2hsv(hex) {
        var n = parseInt(hex.slice(1), 16), r = (n >> 16 & 255) / 255, g = (n >> 8 & 255) / 255, b = (n & 255) / 255;
        var mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn, h = 0;
        if (d) h = mx === r ? ((g - b) / d + (g < b ? 6 : 0)) : (mx === g ? (b - r) / d + 2 : (r - g) / d + 4);
        return { h: h * 60, s: mx ? d / mx : 0, v: mx };
    }
    function hsv2hex(h, s, v) {
        var f = function (n) { var k = (n + h / 60) % 6; return v - v * s * Math.max(0, Math.min(k, 4 - k, 1)); };
        return '#' + [f(5), f(3), f(1)].map(function (x) { var q = Math.round(x * 255); return (q < 16 ? '0' : '') + q.toString(16); }).join('');
    }
    function hsl2hex(h, s, l) {
        s /= 100; l /= 100;
        var a = s * Math.min(l, 1 - l), f = function (n) { var k = (n + h / 30) % 12; return l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)); };
        return '#' + [f(0), f(8), f(4)].map(function (x) { var q = Math.round(x * 255); return (q < 16 ? '0' : '') + q.toString(16); }).join('');
    }

    /* готовая палитра: серые + 12 оттенков в пяти яркостях */
    function palette() {
        var out = ['#ffffff', '#f8f9fa', '#f1f3f5', '#e5e7eb', '#d1d5db', '#9ca3af', '#6b7280', '#4b5563', '#374151', '#1f2937', '#111827', '#000000'];
        [88, 72, 58, 44, 30, 18].forEach(function (l) {
            for (var h = 0; h < 360; h += 30) out.push(hsl2hex(h, l > 80 || l < 24 ? 55 : 78, l));
        });
        return out;
    }
    function recent() { try { var a = JSON.parse(localStorage.getItem(RK) || '[]'); return Array.isArray(a) ? a.filter(isHex).slice(0, 10) : []; } catch (e) { return []; } }
    function remember(hex) {
        try {
            var a = recent().filter(function (x) { return x !== hex; }); a.unshift(hex);
            localStorage.setItem(RK, JSON.stringify(a.slice(0, 10)));
        } catch (e) { /* без истории тоже работает */ }
    }

    function drag(node, fn) {
        node.addEventListener('pointerdown', function (e) {
            e.preventDefault();
            try { node.setPointerCapture(e.pointerId); } catch (er) { /* не страшно */ }
            fn(e);
            function mv(ev) { fn(ev); }
            function up() { node.removeEventListener('pointermove', mv); node.removeEventListener('pointerup', up); node.removeEventListener('pointercancel', up); }
            node.addEventListener('pointermove', mv); node.addEventListener('pointerup', up); node.addEventListener('pointercancel', up);
        });
    }

    function close(kind) {
        if (!cur) return;
        var c = cur; cur = null;
        document.removeEventListener('keydown', c.key, true);
        c.wrap.remove();
        document.documentElement.classList.remove('rkx-lock');
        if (kind === 'done') { remember(c.hex); if (c.o.onDone) c.o.onDone(c.hex); }
        else if (c.o.onCancel) c.o.onCancel(c.start);
        if (c.prev && c.prev.focus) { try { c.prev.focus({ preventScroll: true }); } catch (e) { /* не страшно */ } }
    }

    function open(o) {
        if (cur) close('cancel');
        var start = norm(o.value) || '#ffffff';
        var hsv = hex2hsv(start);
        var wrap = el('div', 'rkx-wrap rkc-wrap'); wrap.setAttribute('role', 'dialog'); wrap.setAttribute('aria-modal', 'true');
        var card = el('div', 'rkx-card rkc-card');
        card.innerHTML =
            '<div class="rkc-head"><div class="rkc-title"></div><button type="button" class="rkc-x" aria-label=""><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7l10 10M17 7L7 17"/></svg></button></div>' +
            '<div class="rkc-sv" role="slider" tabindex="0"><div class="rkc-sv-w"></div><div class="rkc-sv-b"></div><i class="rkc-thumb"></i></div>' +
            '<div class="rkc-hue" role="slider" tabindex="0"><i class="rkc-thumb"></i></div>' +
            '<div class="rkc-row"><span class="rkc-prev"></span><label class="rkc-hexl"><span></span><input class="rk-input rkc-hex" type="text" maxlength="7" autocomplete="off" autocapitalize="off" spellcheck="false" inputmode="text"></label></div>' +
            '<div class="rkc-sec rkc-rec-sec" hidden><p class="rkc-sub rkc-rec-t"></p><div class="rkc-grid rkc-rec"></div></div>' +
            '<div class="rkc-sec"><p class="rkc-sub rkc-pal-t"></p><div class="rkc-grid rkc-pal"></div></div>' +
            '<div class="rkc-btns"><button type="button" class="rk-btn rk-btn--ghost rkc-no"></button><button type="button" class="rk-btn rk-btn--main rkc-yes"></button></div>';
        wrap.appendChild(card);
        var q = function (s) { return card.querySelector(s); };
        q('.rkc-title').textContent = o.title || '';
        q('.rkc-x').setAttribute('aria-label', t('lk.close', 'Закрыть'));
        q('.rkc-hexl span').textContent = t('cp.hex', 'Код цвета');
        q('.rkc-pal-t').textContent = t('cp.palette', 'Палитра');
        q('.rkc-rec-t').textContent = t('cp.recent', 'Недавние');
        q('.rkc-no').textContent = t('d.cancel', 'Отмена');
        q('.rkc-yes').textContent = t('cp.done', 'Готово');
        var sv = q('.rkc-sv'), hue = q('.rkc-hue'), hexIn = q('.rkc-hex'), prev = q('.rkc-prev');
        var svT = sv.querySelector('.rkc-thumb'), hT = hue.querySelector('.rkc-thumb');

        var state = { o: o, wrap: wrap, hex: start, start: start, prev: document.activeElement };
        cur = state;

        function paint(fromHex, silent) {
            var hex = hsv2hex(hsv.h, hsv.s, hsv.v);
            state.hex = hex;
            sv.style.setProperty('--hue', 'hsl(' + hsv.h + ' 100% 50%)');
            svT.style.left = hsv.s * 100 + '%'; svT.style.top = (1 - hsv.v) * 100 + '%'; svT.style.background = hex;
            hT.style.left = hsv.h / 360 * 100 + '%'; hT.style.background = 'hsl(' + hsv.h + ' 100% 50%)';
            prev.style.background = hex;
            if (!fromHex) hexIn.value = hex.toUpperCase();
            sv.setAttribute('aria-valuetext', hex); hue.setAttribute('aria-valuetext', hex);
            if (!silent && o.onInput) o.onInput(hex);
        }
        function setHex(hex) { var h = hex2hsv(hex); if (h.s > 0 && h.v > 0) hsv = h; else hsv = { h: hsv.h, s: h.s, v: h.v }; paint(false); }

        drag(sv, function (e) {
            var r = sv.getBoundingClientRect();
            hsv.s = clamp((e.clientX - r.left) / r.width, 0, 1); hsv.v = 1 - clamp((e.clientY - r.top) / r.height, 0, 1); paint();
        });
        drag(hue, function (e) {
            var r = hue.getBoundingClientRect();
            hsv.h = clamp((e.clientX - r.left) / r.width, 0, 1) * 360; paint();
        });
        sv.addEventListener('keydown', function (e) {
            var d = { ArrowLeft: [-.02, 0], ArrowRight: [.02, 0], ArrowUp: [0, .02], ArrowDown: [0, -.02] }[e.key]; if (!d) return;
            e.preventDefault(); hsv.s = clamp(hsv.s + d[0], 0, 1); hsv.v = clamp(hsv.v + d[1], 0, 1); paint();
        });
        hue.addEventListener('keydown', function (e) {
            var d = { ArrowLeft: -4, ArrowRight: 4, ArrowDown: -4, ArrowUp: 4 }[e.key]; if (!d) return;
            e.preventDefault(); hsv.h = (hsv.h + d + 360) % 360; paint();
        });
        hexIn.addEventListener('input', function () {
            var v = norm(hexIn.value);
            hexIn.classList.toggle('is-bad', !v && hexIn.value.trim() !== '');
            if (v) { var h = hex2hsv(v); hsv = (h.s > 0 && h.v > 0) ? h : { h: hsv.h, s: h.s, v: h.v }; paint(true); }
        });
        hexIn.addEventListener('blur', function () { hexIn.value = state.hex.toUpperCase(); hexIn.classList.remove('is-bad'); });

        function swatches(box, list) {
            list.forEach(function (c) {
                var b = el('button', 'rkc-sw', { type: 'button', 'aria-label': c.toUpperCase() });
                b.style.background = c; b.title = c.toUpperCase();
                if (c === '#ffffff') b.classList.add('is-white');
                b.addEventListener('click', function () { setHex(c); });
                box.appendChild(b);
            });
        }
        swatches(q('.rkc-pal'), palette());
        var rec = recent();
        if (rec.length) { q('.rkc-rec-sec').hidden = false; swatches(q('.rkc-rec'), rec); }

        q('.rkc-x').addEventListener('click', function () { close('cancel'); });
        q('.rkc-no').addEventListener('click', function () { close('cancel'); });
        q('.rkc-yes').addEventListener('click', function () { close('done'); });
        wrap.addEventListener('click', function (e) { if (e.target === wrap) close('cancel'); });
        state.key = function (e) {
            if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close('cancel'); }
            else if (e.key === 'Enter' && document.activeElement === hexIn) { e.preventDefault(); e.stopPropagation(); close('done'); }
        };
        document.addEventListener('keydown', state.key, true);
        document.body.appendChild(wrap);
        document.documentElement.classList.add('rkx-lock');
        paint(false, true);
        try { q('.rkc-yes').focus({ preventScroll: true }); } catch (e) { /* не страшно */ }
    }
    window.RKColorPick = { open: open, close: function () { close('cancel'); } };
})();
