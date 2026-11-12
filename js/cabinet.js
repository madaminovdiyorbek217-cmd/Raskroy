/* Конструктор корпуса с 3D-превью: габариты, полки, перегородки, двери, ящики -> список деталей для раскроя.
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

    /* ---------- 3D: коробки из граней, закрашиваем от дальних к ближним ---------- */
    function boxes(p, open) {
        var q = norm(p), L = layout(q), t = q.t, W = q.w, D = q.d, P = q.plinth, H = q.h, hb = L.hb;
        var list = [], x0 = -W / 2, z0 = -D / 2;
        function B(x, y, z, sx, sy, sz, kind, tf) { list.push({ x: x, y: y, z: z, sx: sx, sy: sy, sz: sz, kind: kind, tf: tf || null }); }
        B(x0, P, z0, t, hb, D, 'body'); B(W / 2 - t, P, z0, t, hb, D, 'body');
        B(x0 + t, P, z0, W - 2 * t, t, D, 'body'); B(x0 + t, H - t, z0, W - 2 * t, t, D, 'body');
        var iw = W - 2 * t, secW = (iw - q.dividers * t) / (q.dividers + 1), sx = x0 + t;
        for (var s = 0; s <= q.dividers; s++) {
            if (s > 0) B(sx - t, P + t, z0, t, hb - 2 * t, D - 20, 'body');
            var open0 = q.drawers ? P + GAP + (q.drawers * (L.drawerH + GAP)) : P + t;      /* полки только над ящиками */
            var gap = (H - t) - open0, n = q.shelves;
            for (var k = 1; k <= n; k++) B(sx, open0 + gap * k / (n + 1) - t / 2, z0, secW, t, D - 20, 'body');
            sx += secW + t;
        }
        if (q.back) B(x0, P, z0 - 3, W, hb, 3, 'back');
        if (P) B(x0 + t, 0, D / 2 - 60, iw, P, t, 'body');
        var y = P + GAP;
        for (var d = 0; d < q.drawers; d++) {
            var yy = y + d * (L.drawerH + GAP), zs = open ? Math.min(SLIDES[SLIDES.length - 1], D - 50) * 0.7 : 0;
            B(x0 + GAP, yy, D / 2 - zs, W - 2 * GAP, L.drawerH, t, 'front');
            if (open) {
                var bw = iw - 2 * SLIDE, bh = Math.max(60, L.drawerH - 60), bd = Math.min(D - 50, 500);
                B(x0 + t + SLIDE, yy + 10, D / 2 - zs - bd, t, bh, bd, 'drawer'); B(x0 + t + SLIDE + bw - t, yy + 10, D / 2 - zs - bd, t, bh, bd, 'drawer');
                B(x0 + t + SLIDE, yy + 10, D / 2 - zs - bd, bw, 6, bd, 'drawer'); B(x0 + t + SLIDE, yy + 10, D / 2 - zs - bd, bw, bh, t, 'drawer');
            }
        }
        if (q.doors) {
            var dy = P + GAP + q.drawers * (L.drawerH + GAP), dw = (W - 2 * GAP - (q.doors - 1) * GAP) / q.doors;
            for (var m = 0; m < q.doors; m++) {
                var dx = x0 + GAP + m * (dw + GAP), left = q.doors === 1 || m === 0;
                var tf = null;
                if (open) tf = { hx: left ? dx : dx + dw, hz: D / 2, a: left ? -1.75 : 1.75 };
                B(dx, dy, D / 2, dw, L.doorH, t, 'front', tf);
            }
        }
        return list;
    }
    function toFaces(bx) {
        var x = bx.x, y = bx.y, z = bx.z, X = x + bx.sx, Y = y + bx.sy, Z = z + bx.sz;
        var v = [[x, y, z], [X, y, z], [X, Y, z], [x, Y, z], [x, y, Z], [X, y, Z], [X, Y, Z], [x, Y, Z]];
        if (bx.tf) {
            var c = Math.cos(bx.tf.a), s = Math.sin(bx.tf.a);
            v = v.map(function (p) { var dx = p[0] - bx.tf.hx, dz = p[2] - bx.tf.hz; return [bx.tf.hx + dx * c + dz * s, p[1], bx.tf.hz - dx * s + dz * c]; });
        }
        return [[0, 1, 2, 3, 0], [5, 4, 7, 6, 1], [4, 0, 3, 7, 2], [1, 5, 6, 2, 3], [3, 2, 6, 7, 4], [4, 5, 1, 0, 5]].map(function (f) {
            return { v: [v[f[0]], v[f[1]], v[f[2]], v[f[3]]], side: f[4] };
        });
    }
    var COL = { body: [226, 205, 170], front: [244, 238, 226], back: [188, 170, 140], drawer: [214, 192, 156] };

    function render(cv, p, view, open) {
        var dpr = Math.min(2, window.devicePixelRatio || 1), cw = cv.clientWidth, ch = cv.clientHeight;
        if (!cw || !ch) return;
        if (cv.width !== Math.round(cw * dpr) || cv.height !== Math.round(ch * dpr)) { cv.width = Math.round(cw * dpr); cv.height = Math.round(ch * dpr); }
        var g = cv.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, cw, ch);
        var q = norm(p), cy = q.h / 2, R = Math.sqrt(q.w * q.w + q.h * q.h + q.d * q.d) / 2;
        var cyaw = Math.cos(view.yaw), syaw = Math.sin(view.yaw), cp = Math.cos(view.pitch), sp = Math.sin(view.pitch);
        var scale = Math.min(cw, ch) / (R * 2.25) * view.zoom, F = R * 4.5;
        function proj(pt) {
            var x = pt[0], y = pt[1] - cy, z = pt[2];
            var x1 = x * cyaw + z * syaw, z1 = -x * syaw + z * cyaw;
            var y2 = y * cp - z1 * sp, z2 = y * sp + z1 * cp;
            var k = F / (F - z2);
            return [cw / 2 + x1 * k * scale, ch / 2 - y2 * k * scale, z2];
        }
        var faces = [];
        boxes(p, open).forEach(function (bx) {
            toFaces(bx).forEach(function (f) {
                var pts = f.v.map(proj);
                var ax = pts[1][0] - pts[0][0], ay = pts[1][1] - pts[0][1], bx2 = pts[2][0] - pts[0][0], by = pts[2][1] - pts[0][1];
                if (ax * by - ay * bx2 < 0) return;                       /* грань смотрит от нас */
                var z = (pts[0][2] + pts[1][2] + pts[2][2] + pts[3][2]) / 4;
                faces.push({ pts: pts, z: z, kind: bx.kind, side: f.side });
            });
        });
        /* крупные плоскости (фасады и задняя стенка) красим последними со стороны, откуда на них смотрим */
        var frontSeen = cyaw * cp > 0;
        var PRI = frontSeen ? { back: 0, body: 1, drawer: 1, front: 2 } : { front: 0, body: 1, drawer: 1, back: 2 };
        faces.sort(function (a, b) { return (PRI[a.kind] - PRI[b.kind]) || (a.z - b.z); });
        var shade = [0.78, 0.96, 0.86, 0.9, 1.05, 0.7];
        var dark = document.documentElement.getAttribute('data-theme') !== 'light';
        faces.forEach(function (f) {
            var c = COL[f.kind] || COL.body, k = shade[f.side] || 1;
            g.beginPath();
            f.pts.forEach(function (pt, i) { if (i) g.lineTo(pt[0], pt[1]); else g.moveTo(pt[0], pt[1]); });
            g.closePath();
            g.fillStyle = 'rgb(' + Math.min(255, Math.round(c[0] * k)) + ',' + Math.min(255, Math.round(c[1] * k)) + ',' + Math.min(255, Math.round(c[2] * k)) + ')';
            g.fill();
            g.lineWidth = 1; g.strokeStyle = dark ? 'rgba(0,0,0,.55)' : 'rgba(60,45,25,.45)'; g.stroke();
        });
    }

    /* ---------- Окно ---------- */
    var cur = null;
    function close() {
        if (!cur) return;
        var c = cur; cur = null;
        document.removeEventListener('keydown', c.key, true);
        window.removeEventListener('resize', c.resize);
        c.wrap.remove();
        document.documentElement.classList.remove('rkx-lock');
        if (c.prev && c.prev.focus) { try { c.prev.focus({ preventScroll: true }); } catch (e) { /* не страшно */ } }
    }

    var FIELDS = [['w', 'cb.w', 'Ширина'], ['h', 'cb.h', 'Высота'], ['d', 'cb.d', 'Глубина'], ['t', 'cb.t', 'Толщина плиты'], ['plinth', 'cb.plinth', 'Цоколь']];
    var COUNTS = [['shelves', 'cb.shelves', 'Полок в секции'], ['dividers', 'cb.dividers', 'Перегородок'], ['doors', 'cb.doors', 'Дверец'], ['drawers', 'cb.drawers', 'Ящиков']];

    function open(o) {
        if (cur) close();
        var mats = (o && o.materials) || [];
        var p = Object.assign({}, PRESETS.wardrobe), type = 'wardrobe', isOpen = false;
        var view = { yaw: -0.55, pitch: 0.28, zoom: 1 };

        var wrap = el('div', 'rkx-wrap rkb-wrap'); wrap.setAttribute('role', 'dialog'); wrap.setAttribute('aria-modal', 'true');
        var card = el('div', 'rkx-card rkb-card');
        var head = el('div', 'rkp-head');
        head.appendChild(el('div', 'rkp-title', tr('cb.title', 'Конструктор корпуса')));
        var x = el('button', 'rkc-x'); x.type = 'button'; x.setAttribute('aria-label', tr('lk.close', 'Закрыть'));
        x.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7l10 10M17 7L7 17"/></svg>';
        head.appendChild(x);
        card.appendChild(head);

        var body = el('div', 'rkb-body');
        var left = el('div', 'rkb-left');
        var stage = el('div', 'rkb-stage');
        var cv = el('canvas', 'rkb-cv'); cv.setAttribute('aria-label', tr('cb.view', '3D-вид корпуса')); cv.tabIndex = 0;
        stage.appendChild(cv);
        var dim = el('div', 'rkb-dim'); stage.appendChild(dim);
        var tools = el('div', 'rkb-tools');
        var openBtn = el('button', 'rk-btn rk-btn--ghost rk-btn--sm', tr('cb.open', 'Открыть дверцы и ящики')); openBtn.type = 'button';
        var resetBtn = el('button', 'rk-btn rk-btn--ghost rk-btn--sm', tr('cb.reset', 'Сбросить вид')); resetBtn.type = 'button';
        tools.appendChild(openBtn); tools.appendChild(resetBtn);
        left.appendChild(stage); left.appendChild(tools); left.appendChild(el('p', 'rkb-hint', tr('cb.hint', 'Потяните, чтобы повернуть; колесо или щипок — приблизить.')));

        var right = el('div', 'rkb-right');
        var chips = el('div', 'rkb-types'); chips.setAttribute('role', 'radiogroup');
        var chipEls = {};
        TYPES.forEach(function (k) {
            var b = el('button', 'rkb-chip', tr('cb.t.' + k, TYPE_FB[k])); b.type = 'button'; b.setAttribute('role', 'radio');
            b.addEventListener('click', function () { type = k; p = Object.assign({}, PRESETS[k]); syncInputs(); update(); });
            chips.appendChild(b); chipEls[k] = b;
        });
        right.appendChild(chips);

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
        right.appendChild(listBox);
        body.appendChild(left); body.appendChild(right);
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
            openBtn.setAttribute('aria-pressed', String(isOpen));
            openBtn.textContent = isOpen ? tr('cb.close', 'Закрыть дверцы и ящики') : tr('cb.open', 'Открыть дверцы и ящики');
            openBtn.hidden = !(q.doors || q.drawers);
            draw();
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
        var raf = 0;
        function draw() { if (raf) return; raf = requestAnimationFrame(function () { raf = 0; render(cv, p, view, isOpen); }); }

        openBtn.addEventListener('click', function () { isOpen = !isOpen; update(); });
        resetBtn.addEventListener('click', function () { view.yaw = -0.55; view.pitch = 0.28; view.zoom = 1; draw(); });

        /* вращение и масштаб: одним пальцем/мышью вращаем, двумя — приближаем */
        var ptrs = {}, lastDist = 0;
        cv.addEventListener('pointerdown', function (e) { cv.setPointerCapture(e.pointerId); ptrs[e.pointerId] = { x: e.clientX, y: e.clientY }; lastDist = 0; });
        cv.addEventListener('pointermove', function (e) {
            var pt = ptrs[e.pointerId]; if (!pt) return;
            var ids = Object.keys(ptrs);
            if (ids.length >= 2) {
                ptrs[e.pointerId] = { x: e.clientX, y: e.clientY };
                var a = ptrs[ids[0]], b = ptrs[ids[1]], d = Math.hypot(a.x - b.x, a.y - b.y);
                if (lastDist) view.zoom = clamp(view.zoom * d / lastDist, 0.5, 3);
                lastDist = d; draw(); return;
            }
            view.yaw += (e.clientX - pt.x) * 0.01; view.pitch = clamp(view.pitch + (e.clientY - pt.y) * 0.008, -0.2, 1.3);
            ptrs[e.pointerId] = { x: e.clientX, y: e.clientY }; draw();
        });
        function up(e) { delete ptrs[e.pointerId]; lastDist = 0; }
        cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
        cv.addEventListener('wheel', function (e) { e.preventDefault(); view.zoom = clamp(view.zoom * (e.deltaY < 0 ? 1.1 : 0.9), 0.5, 3); draw(); }, { passive: false });
        cv.addEventListener('dblclick', function () { view.yaw = -0.55; view.pitch = 0.28; view.zoom = 1; draw(); });
        cv.addEventListener('keydown', function (e) {
            var d = { ArrowLeft: [-0.12, 0], ArrowRight: [0.12, 0], ArrowUp: [0, -0.1], ArrowDown: [0, 0.1] }[e.key]; if (!d) return;
            e.preventDefault(); view.yaw += d[0]; view.pitch = clamp(view.pitch + d[1], -0.2, 1.3); draw();
        });

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
        st.resize = function () { draw(); };
        document.addEventListener('keydown', st.key, true);
        window.addEventListener('resize', st.resize);
        cur = st;
        document.body.appendChild(wrap);
        document.documentElement.classList.add('rkx-lock');
        syncInputs(); update();
        requestAnimationFrame(draw);
        try { chipEls[type].focus({ preventScroll: true }); } catch (e) { /* не страшно */ }
    }

    window.RKCabinet = { open: open, close: close, build: build, TYPES: TYPES };
})();
