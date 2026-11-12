/* Конструктор корпуса: габариты, полки, перегородки, двери, ящики -> список деталей для раскроя.
   RKCabinet.open({ materials: [{id,name,t}], onAdd(parts, bodyMatId, backMatId) })
   RKCabinet.build(params) -> [{ key, name, l, w, qty, rotate, e, back }]  (без интерфейса, для проверки) */
(function () {
    'use strict';

    function tr(k, fb, p) {
        try { var v = window.RKI18N ? window.RKI18N.t(k, p) : ''; if (v && v !== k) return v; } catch (e) { /* ниже запасной текст */ }
        return String(fb).replace(/\{(\w+)\}/g, function (m, n) { return p && p[n] != null ? p[n] : m; });
    }
    function el(tag, cls, text) { var n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; }
    function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
    function r1(v) { return Math.round(v * 10) / 10; }

    var GAP = 2;               /* зазор вокруг фасадов, мм */
    var DRAWER_FRONT = 180;    /* высота фасада ящика, если выше есть дверцы */
    var SLIDE = 13;            /* зазор под направляющие с каждой стороны */
    var SLIDES = [250, 300, 350, 400, 450, 500, 550];

    var PRESETS = {
        wardrobe: { w: 800, h: 2100, d: 560, t: 16, shelves: 4, dividers: 0, doors: 2, drawers: 0, plinth: 100, back: 1 },
        base: { w: 600, h: 720, d: 500, t: 16, shelves: 1, dividers: 0, doors: 2, drawers: 0, plinth: 100, back: 1 },
        chest: { w: 800, h: 900, d: 450, t: 16, shelves: 0, dividers: 0, doors: 0, drawers: 4, plinth: 80, back: 1 },
        shelf: { w: 800, h: 1800, d: 300, t: 16, shelves: 5, dividers: 0, doors: 0, drawers: 0, plinth: 0, back: 1 },
        wall: { w: 600, h: 700, d: 320, t: 16, shelves: 1, dividers: 0, doors: 2, drawers: 0, plinth: 0, back: 1 }
    };
    var TYPES = ['wardrobe', 'base', 'chest', 'shelf', 'wall'];
    var TYPE_FB = { wardrobe: 'Шкаф', base: 'Тумба', chest: 'Комод', shelf: 'Стеллаж', wall: 'Навесной' };

    /* ---------- Детали ---------- */
    function norm(p) {
        var q = {};
        ['w', 'h', 'd', 't', 'shelves', 'dividers', 'doors', 'drawers', 'plinth'].forEach(function (k) { q[k] = Math.max(0, Math.round(+p[k] || 0)); });
        q.back = p.back ? 1 : 0;
        q.t = clamp(q.t || 16, 6, 40);
        q.w = clamp(q.w, q.t * 2 + 100, 4000); q.h = clamp(q.h, 150, 3000); q.d = clamp(q.d, 100, 1200);
        q.dividers = Math.min(q.dividers, 5); q.shelves = Math.min(q.shelves, 12);
        q.doors = Math.min(q.doors, 2); q.drawers = Math.min(q.drawers, 8);
        q.plinth = Math.min(q.plinth, Math.max(0, q.h - 200));
        return q;
    }
    /* высоты фасадов: ящики снизу, дверцы выше */
    function layout(q) {
        var hb = q.h - q.plinth, n = q.drawers, out = { hb: hb, drawerH: 0, doorH: 0 };
        if (n && !q.doors) out.drawerH = (hb - (n + 1) * GAP) / n;
        else if (n && q.doors) { out.drawerH = Math.min(DRAWER_FRONT, (hb - (n + 2) * GAP) / (n + 1)); out.doorH = hb - (n + 2) * GAP - n * out.drawerH; }
        else if (q.doors) out.doorH = hb - 2 * GAP;
        return out;
    }
    function build(p) {
        var q = norm(p), L = layout(q), t = q.t, parts = [];
        function add(key, name, l, w, qty, rotate, e, back) {
            l = r1(l); w = r1(w);
            if (qty > 0 && l > 0 && w > 0) parts.push({ key: key, name: name, l: l, w: w, qty: qty, rotate: rotate, e: e, back: !!back });
        }
        var iw = q.w - 2 * t, sections = q.dividers + 1;
        add('side', tr('cb.p.side', 'Боковина'), L.hb, q.d, 2, false, [1, 0, 0, 0]);
        add('topbot', tr('cb.p.topbot', 'Крышка / дно'), iw, q.d, 2, true, [1, 0, 0, 0]);
        add('divider', tr('cb.p.divider', 'Перегородка'), L.hb - 2 * t, q.d - 20, q.dividers, false, [1, 0, 0, 0]);
        add('shelf', tr('cb.p.shelf', 'Полка'), (iw - q.dividers * t) / sections, q.d - 20, q.shelves * sections, true, [1, 0, 0, 0]);
        if (q.back) add('back', tr('cb.p.back', 'Задняя стенка'), L.hb - 2, q.w - 2, 1, false, [0, 0, 0, 0], true);
        if (q.doors) {
            var dw = (q.w - 2 * GAP - (q.doors - 1) * GAP) / q.doors;
            add('door', tr('cb.p.door', 'Дверца'), L.doorH, dw, q.doors, false, [1, 1, 1, 1]);
        }
        if (q.drawers) {
            add('dfront', tr('cb.p.dfront', 'Фасад ящика'), q.w - 2 * GAP, L.drawerH, q.drawers, false, [1, 1, 1, 1]);
            var bw = iw - 2 * SLIDE, bd = SLIDES[0];
            SLIDES.forEach(function (s) { if (s <= q.d - 50) bd = s; });
            var bh = Math.max(60, L.drawerH - 60);
            add('dside', tr('cb.p.dside', 'Ящик: боковина'), bd, bh, 2 * q.drawers, false, [0, 0, 0, 0]);
            add('dfb', tr('cb.p.dfb', 'Ящик: перед и зад'), bw - 2 * t, bh, 2 * q.drawers, false, [0, 0, 0, 0]);
            add('dbottom', tr('cb.p.dbottom', 'Ящик: дно'), bd - 10, bw - 10, q.drawers, false, [0, 0, 0, 0], true);
        }
        if (q.plinth) add('plinth', tr('cb.p.plinth', 'Цоколь'), iw, q.plinth, 2, true, [0, 0, 0, 0]);
        return parts;
    }

    /* ---------- Окно ---------- */
    var cur = null;
    function close() {
        if (!cur) return;
        var c = cur; cur = null;
        document.removeEventListener('keydown', c.key, true);
        c.wrap.remove();
        document.documentElement.classList.remove('rkx-lock');
        if (c.prev && c.prev.focus) { try { c.prev.focus({ preventScroll: true }); } catch (e) { /* не страшно */ } }
    }

    var FIELDS = [['w', 'cb.w', 'Ширина'], ['h', 'cb.h', 'Высота'], ['d', 'cb.d', 'Глубина'], ['t', 'cb.t', 'Толщина плиты'], ['plinth', 'cb.plinth', 'Цоколь']];
    var COUNTS = [['shelves', 'cb.shelves', 'Полок в секции'], ['dividers', 'cb.dividers', 'Перегородок'], ['doors', 'cb.doors', 'Дверец'], ['drawers', 'cb.drawers', 'Ящиков']];

    function open(o) {
        if (cur) close();
        var mats = (o && o.materials) || [];
        var p = Object.assign({}, PRESETS.wardrobe), type = 'wardrobe';

        var wrap = el('div', 'rkx-wrap rkb-wrap'); wrap.setAttribute('role', 'dialog'); wrap.setAttribute('aria-modal', 'true');
        var card = el('div', 'rkx-card rkb-card');
        var head = el('div', 'rkp-head');
        head.appendChild(el('div', 'rkp-title', tr('cb.title', 'Конструктор корпуса')));
        var x = el('button', 'rkc-x'); x.type = 'button'; x.setAttribute('aria-label', tr('lk.close', 'Закрыть'));
        x.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7l10 10M17 7L7 17"/></svg>';
        head.appendChild(x);
        card.appendChild(head);

        var body = el('div', 'rkb-body');
        var dim = el('div', 'rkb-dim');
        var right = el('div', 'rkb-right');
        var chips = el('div', 'rkb-types'); chips.setAttribute('role', 'radiogroup');
        var chipEls = {};
        TYPES.forEach(function (k) {
            var b = el('button', 'rkb-chip', tr('cb.t.' + k, TYPE_FB[k])); b.type = 'button'; b.setAttribute('role', 'radio');
            b.addEventListener('click', function () { type = k; p = Object.assign({}, PRESETS[k]); syncInputs(); update(); });
            chips.appendChild(b); chipEls[k] = b;
        });
        right.appendChild(chips);
        right.appendChild(dim);

        var grid = el('div', 'rkb-grid'), inputs = {};
        FIELDS.forEach(function (f) {
            var lab = el('label', 'rk-f'); lab.appendChild(el('span', '', tr(f[1], f[2]) + ', ' + tr('u.mm', 'мм')));
            var i = el('input', 'rk-input'); i.type = 'text'; i.inputMode = 'numeric'; i.autocomplete = 'off';
            i.addEventListener('input', function () { p[f[0]] = parseInt(i.value.replace(/\D/g, ''), 10) || 0; update(true); });
            i.addEventListener('blur', function () { var q = norm(p); p[f[0]] = q[f[0]]; i.value = q[f[0]]; update(); });
            lab.appendChild(i); grid.appendChild(lab); inputs[f[0]] = i;
        });
        COUNTS.forEach(function (f) {
            var lab = el('div', 'rk-f rkb-step'); lab.appendChild(el('span', '', tr(f[1], f[2])));
            var row = el('div', 'rkb-stepper');
            var m = el('button', 'rkb-sb', '−'); m.type = 'button'; m.setAttribute('aria-label', '−');
            var v = el('output', 'rkb-sv', '0');
            var pl = el('button', 'rkb-sb', '+'); pl.type = 'button'; pl.setAttribute('aria-label', '+');
            var maxv = { shelves: 12, dividers: 5, doors: 2, drawers: 8 }[f[0]];
            m.addEventListener('click', function () { p[f[0]] = Math.max(0, (+p[f[0]] || 0) - 1); syncInputs(); update(); });
            pl.addEventListener('click', function () { p[f[0]] = Math.min(maxv, (+p[f[0]] || 0) + 1); syncInputs(); update(); });
            row.appendChild(m); row.appendChild(v); row.appendChild(pl); lab.appendChild(row); grid.appendChild(lab); inputs[f[0]] = v;
        });
        var backLab = el('label', 'rk-check rkb-back');
        var backCb = el('input'); backCb.type = 'checkbox';
        backCb.addEventListener('change', function () { p.back = backCb.checked ? 1 : 0; update(); });
        backLab.appendChild(backCb); backLab.appendChild(el('span', '', tr('cb.back', 'Задняя стенка (ДВП)')));
        grid.appendChild(backLab);
        right.appendChild(grid);

        var mrow = el('div', 'rkb-mats');
        function matSelect(label) {
            var lab = el('label', 'rk-f'); lab.appendChild(el('span', '', label));
            var s = el('select', 'rk-input');
            mats.forEach(function (m) { var op = el('option', '', (m.name || '') + (m.t ? ' · ' + m.t + ' ' + tr('u.mm', 'мм') : '')); op.value = m.id; s.appendChild(op); });
            lab.appendChild(s); mrow.appendChild(lab); return s;
        }
        var bodySel = matSelect(tr('cb.mat.body', 'Материал корпуса и фасадов'));
        var backSel = matSelect(tr('cb.mat.back', 'Материал задней стенки и дна ящиков'));
        var hdfNew = el('option', '', '+ ' + tr('cb.mat.newhdf', 'ДВП 3 мм (создать материал)')); hdfNew.value = '__hdf__'; backSel.appendChild(hdfNew);
        var best = null;
        mats.forEach(function (m) { if (!best && m.t > 0 && m.t <= 6) best = m.id; });
        if (mats.length) { bodySel.value = (mats.filter(function (m) { return m.t >= 10; })[0] || mats[0]).id; backSel.value = best || '__hdf__'; }
        right.appendChild(mrow);

        var listBox = el('div', 'rkb-list');
        right.appendChild(listBox); body.appendChild(right);
        card.appendChild(body);

        var foot = el('div', 'rkp-foot');
        var add = el('button', 'rk-btn rk-btn--main rkb-add'); add.type = 'button';
        var no = el('button', 'rk-btn rk-btn--ghost', tr('d.cancel', 'Отмена')); no.type = 'button';
        foot.appendChild(add); foot.appendChild(no);
        card.appendChild(foot);
        wrap.appendChild(card);

        function syncInputs() {
            FIELDS.forEach(function (f) { inputs[f[0]].value = p[f[0]]; });
            COUNTS.forEach(function (f) { inputs[f[0]].textContent = p[f[0]]; });
            backCb.checked = !!p.back;
            TYPES.forEach(function (k) { chipEls[k].setAttribute('aria-checked', String(k === type)); });
        }
        function update(typing) {
            var q = norm(p), parts = build(q), total = 0;
            parts.forEach(function (x2) { total += x2.qty; });
            dim.textContent = q.w + ' × ' + q.h + ' × ' + q.d + ' ' + tr('u.mm', 'мм');
            var html = '<table class="rk-pp"><tbody>';
            parts.forEach(function (x2) { html += '<tr><td></td><td>' + x2.l + ' × ' + x2.w + '</td><td>' + x2.qty + ' ' + tr('paste.pcs', 'шт.') + '</td></tr>'; });
            html += '</tbody></table>';
            if (!typing || !listBox.firstChild) {
                listBox.innerHTML = html;
                Array.prototype.forEach.call(listBox.querySelectorAll('tr'), function (tr2, i) { tr2.firstChild.textContent = parts[i].name; });
            } else {
                var rows = listBox.querySelectorAll('tr');
                if (rows.length === parts.length) parts.forEach(function (x2, i) { rows[i].children[0].textContent = x2.name; rows[i].children[1].textContent = x2.l + ' × ' + x2.w; rows[i].children[2].textContent = x2.qty + ' ' + tr('paste.pcs', 'шт.'); });
                else { listBox.innerHTML = html; Array.prototype.forEach.call(listBox.querySelectorAll('tr'), function (tr2, i) { tr2.firstChild.textContent = parts[i].name; }); }
            }
            add.textContent = tr('cb.add', 'Добавить в раскрой: {n} деталей ({p} шт.)', { n: parts.length, p: total });
            add.disabled = !parts.length;
        }
        x.addEventListener('click', close); no.addEventListener('click', close);
        wrap.addEventListener('click', function (e) { if (e.target === wrap) close(); });
        add.addEventListener('click', function () {
            var parts = build(p);
            if (!parts.length) return;
            var bm = bodySel.value, km = backSel.value;
            close();
            if (o && o.onAdd) o.onAdd(parts, bm, km);
        });

        var st = { wrap: wrap, prev: document.activeElement };
        st.key = function (e) { if (e.key === 'Escape' && !document.querySelector('.rkx-wrap:not(.rkb-wrap)') && !document.querySelector('.rk-select-pop')) { e.preventDefault(); e.stopPropagation(); close(); } };
        document.addEventListener('keydown', st.key, true);
        cur = st;
        document.body.appendChild(wrap);
        document.documentElement.classList.add('rkx-lock');
        syncInputs(); update();
        try { chipEls[type].focus({ preventScroll: true }); } catch (e) { /* не страшно */ }
    }

    window.RKCabinet = { open: open, close: close, build: build, TYPES: TYPES };
})();
