/* Раскрой ткани: укладка деталей на рулон фиксированной ширины так, чтобы ушло как можно меньше метров.
   Все размеры в миллиметрах. «Вдоль» это длина рулона (по нити основы), «поперёк» это ширина рулона.
   Алгоритм: MaxRects (поиск свободных прямоугольников) с несколькими порядками деталей и случайными перестановками,
   из всех вариантов берётся самый короткий. Расчёт одинаков при каждом запуске (свой генератор случайных чисел). */
(function (root) {
    'use strict';

    var EPS = 1e-6, INF = 1e9;

    function rng(seed) {
        var a = seed >>> 0;
        return function () {
            a = (a + 0x6D2B79F5) >>> 0;
            var t = a;
            t = Math.imul(t ^ (t >>> 15), t | 1);
            t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
    }

    /* Подготовка: размножает детали по количеству, добавляет припуск, раппорт и зазор, отбрасывает слишком широкие */
    function prepare(o) {
        var W = Number(o.roll) || 0, edge = Math.max(0, Number(o.edge) || 0), allow = Math.max(0, Number(o.allow) || 0);
        var gap = Math.max(0, Number(o.gap) || 0), repeat = Math.max(0, Number(o.repeat) || 0);
        var rot = !!o.rot && !(repeat > 0);   /* при рисунке с раппортом поворачивать нельзя */
        var uw = W - 2 * edge;
        var items = [], bad = [], area = 0, count = 0;
        (o.parts || []).forEach(function (p, pi) {
            var q = Math.max(0, Math.floor(Number(p.q) || 0));
            var l = Number(p.l) || 0, w = Number(p.w) || 0;
            if (!(l > 0 && w > 0) || !q) return;
            var a = l + 2 * allow, b = w + 2 * allow;       /* a вдоль рулона, b поперёк */
            if (b > uw + EPS) {
                if (rot && a <= uw + EPS) { var t = a; a = b; b = t; }
                else { bad.push({ pi: pi, need: b, have: uw }); return; }
            }
            if (repeat > 0) a = Math.ceil(a / repeat - 1e-9) * repeat;
            for (var k = 0; k < q; k++) { items.push({ pi: pi, k: k, a: a, b: b, ia: a + gap, ib: b + gap }); area += a * b; count++; }
        });
        return { items: items, bad: bad, uw: uw, W: W, edge: edge, gap: gap, rot: rot, area: area, count: count };
    }

    /* Один проход MaxRects. Ось X поперёк рулона, ось Y вдоль. mode: 0 «самое верхнее место», 1 «сначала по Y, потом плотнее по ширине» */
    function packOnce(items, uw, gap, rot, mode) {
        var Wg = uw + gap;
        var free = [{ x: 0, y: 0, w: Wg, h: INF }];
        var placed = [], bottom = 0;
        for (var i = 0; i < items.length; i++) {
            var it = items[i], best = null, s1 = INF * 4, s2 = INF * 4;
            for (var f = 0; f < free.length; f++) {
                var fr = free[f];
                for (var o = 0; o < (rot ? 2 : 1); o++) {
                    var w = o ? it.ia : it.ib, h = o ? it.ib : it.ia;
                    if (w > fr.w + EPS || h > fr.h + EPS) continue;
                    var a = mode ? fr.y : fr.y + h, b = mode ? fr.w - w : fr.x;
                    if (a < s1 - EPS || (Math.abs(a - s1) <= EPS && b < s2 - EPS)) { s1 = a; s2 = b; best = { x: fr.x, y: fr.y, w: w, h: h, r: o }; }
                }
            }
            if (!best) return null;
            placed.push({ it: it, x: best.x, y: best.y, w: best.w, h: best.h, r: best.r });
            if (best.y + best.h > bottom) bottom = best.y + best.h;
            /* делим свободные прямоугольники, которых коснулась деталь */
            var next = [];
            for (var j = 0; j < free.length; j++) {
                var r = free[j];
                if (best.x >= r.x + r.w - EPS || best.x + best.w <= r.x + EPS || best.y >= r.y + r.h - EPS || best.y + best.h <= r.y + EPS) { next.push(r); continue; }
                if (best.x > r.x + EPS) next.push({ x: r.x, y: r.y, w: best.x - r.x, h: r.h });
                if (best.x + best.w < r.x + r.w - EPS) next.push({ x: best.x + best.w, y: r.y, w: r.x + r.w - best.x - best.w, h: r.h });
                if (best.y > r.y + EPS) next.push({ x: r.x, y: r.y, w: r.w, h: best.y - r.y });
                if (best.y + best.h < r.y + r.h - EPS) next.push({ x: r.x, y: best.y + best.h, w: r.w, h: r.y + r.h - best.y - best.h });
            }
            /* убираем прямоугольники, лежащие целиком внутри других */
            free = [];
            for (var a1 = 0; a1 < next.length; a1++) {
                var A = next[a1], inside = false;
                for (var b1 = 0; b1 < next.length; b1++) {
                    if (a1 === b1) continue;
                    var B = next[b1];
                    if (A.x >= B.x - EPS && A.y >= B.y - EPS && A.x + A.w <= B.x + B.w + EPS && A.y + A.h <= B.y + B.h + EPS &&
                        (a1 > b1 || A.x !== B.x || A.y !== B.y || A.w !== B.w || A.h !== B.h)) { inside = true; break; }
                }
                if (!inside) free.push(A);
            }
        }
        return { placed: placed, bottom: bottom };
    }

    var SORTS = [
        function (p, q) { return q.a * q.b - p.a * p.b; },
        function (p, q) { return q.a - p.a || q.b - p.b; },
        function (p, q) { return q.b - p.b || q.a - p.a; },
        function (p, q) { return Math.max(q.a, q.b) - Math.max(p.a, p.b) || q.a * q.b - p.a * p.b; },
        function (p, q) { return (q.a + q.b) - (p.a + p.b); }
    ];

    function pack(opts) {
        var P = prepare(opts);
        var res = { length: 0, placed: [], bad: P.bad, count: P.count, area: P.area, uw: P.uw, W: P.W, edge: P.edge, gap: P.gap, lower: 0, util: 0 };
        if (!P.items.length || P.uw <= 0) return res;
        res.lower = P.area / P.uw;
        var items = P.items, best = null;
        function consider(order, mode) {
            var r = packOnce(order, P.uw, P.gap, P.rot, mode);
            if (r && (!best || r.bottom < best.bottom - EPS)) best = r;
        }
        for (var s = 0; s < SORTS.length; s++) {
            var ord = items.slice().sort(SORTS[s]);
            consider(ord, 0); consider(ord, 1);
        }
        var n = items.length, tries = n <= 40 ? 120 : (n <= 120 ? 40 : 10);
        var rnd = rng(items.length * 7919 + Math.round(P.area) % 100003);
        for (var t = 0; t < tries; t++) {
            /* перестановка: крупные детали остаются раньше мелких, но порядок внутри «ступеней» меняется */
            var a = items.slice().sort(SORTS[t % 2 ? 0 : 3]);
            for (var i = a.length - 1; i > 0; i--) {
                if (rnd() < 0.35) { var j = Math.max(0, i - 1 - Math.floor(rnd() * 4)); var tmp = a[i]; a[i] = a[j]; a[j] = tmp; }
            }
            consider(a, t % 3 === 0 ? 1 : 0);
        }
        if (!best) return res;
        var minY = 0;
        res.length = Math.max(0, best.bottom - P.gap);
        res.placed = best.placed.map(function (p) {
            var it = p.it;
            return { pi: it.pi, k: it.k, x: p.x + P.edge, y: p.y, w: p.w - P.gap, h: p.h - P.gap, rotated: !!p.r };
        });
        /* размеры w и h отдаются в осях рулона: w поперёк, h вдоль */
        res.util = res.length > 0 ? Math.min(1, P.area / (P.W * res.length)) : 0;
        return res;
    }

    /* Метры к заказу: по раскладке, с запасом, с округлением вверх */
    function order(lengthMm, reservePct, stepMm) {
        var base = lengthMm / 1000;
        var withR = base * (1 + Math.max(0, Number(reservePct) || 0) / 100);
        var step = Math.max(0, Number(stepMm) || 0) / 1000;
        var ordered = step > 0 ? Math.ceil(withR / step - 1e-9) * step : withR;
        if (base <= 0) { withR = 0; ordered = 0; }
        return { base: base, withReserve: withR, ordered: Math.round(ordered * 1e6) / 1e6 };
    }

    var api = { pack: pack, order: order, prepare: prepare };
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    root.RKFabricCore = api;
})(typeof window !== 'undefined' ? window : globalThis);
