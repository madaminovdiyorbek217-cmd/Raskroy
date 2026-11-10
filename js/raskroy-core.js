/* Раскрой плитных материалов: гильотинный алгоритм с перебором вариантов.
   Работает без библиотек. Координаты в миллиметрах: ось X идёт вдоль длины листа
   (вдоль текстуры), ось Y — поперёк.

   Raskroy.optimize({
       sheet:  { l: 2800, w: 2070, trim: 10 },       // размеры листа и обрезка по краю
       kerf:   4,                                    // толщина пропила
       parts:  [{ id, l, w, qty, rotate, edges: [L1, L2, W1, W2] }],
       minOffcut: 300,                               // какие остатки считать деловыми
       timeMs: 400
   }) -> { sheets, unplaced, stats }
*/
(function (root, factory) {
    if (typeof module === 'object' && module.exports) module.exports = factory();
    else root.Raskroy = factory();
})(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    /* Небольшой генератор случайных чисел: результат повторяется при том же seed */
    function rng(seed) {
        var s = (seed >>> 0) || 1;
        return function () {
            s ^= s << 13; s ^= s >>> 17; s ^= s << 5;
            return ((s >>> 0) % 1000003) / 1000003;
        };
    }

    var SCORES = {
        /* чем меньше число, тем лучше подходит свободное место */
        bssf: function (fw, fh, pw, ph) { return Math.min(fw - pw, fh - ph) * 1e6 + Math.max(fw - pw, fh - ph); },
        baf: function (fw, fh, pw, ph) { return fw * fh * 1e3 + Math.min(fw - pw, fh - ph); },
        blsf: function (fw, fh, pw, ph) { return Math.max(fw - pw, fh - ph) * 1e6 + Math.min(fw - pw, fh - ph); }
    };
    var SCORE_NAMES = ['bssf', 'baf', 'blsf'];
    var SPLITS = ['auto', 'h', 'v', 'maxarea'];
    var SORTS = ['area', 'long', 'width', 'perim'];

    function sortKey(kind) {
        if (kind === 'area') return function (p) { return p.l * p.w; };
        if (kind === 'long') return function (p) { return Math.max(p.l, p.w) * 1e5 + Math.min(p.l, p.w); };
        if (kind === 'width') return function (p) { return Math.min(p.l, p.w) * 1e5 + Math.max(p.l, p.w); };
        return function (p) { return p.l + p.w; };
    }

    var EPS = 0.01;

    /* Какие направления первого реза допустимы, если деталь pw×ph ставится в свободный прямоугольник f.
       h — рез вдоль длины листа на всю ширину прямоугольника, v — рез поперёк. null — ставить сюда нельзя. */
    function dirsAllowed(f, pw, ph, opt) {
        var rw = f.w - pw, rh = f.h - ph, h = true, v = true;
        if (f.fixH !== undefined && Math.abs(ph - f.fixH) > EPS) return null;
        if (f.fixW !== undefined && Math.abs(pw - f.fixW) > EPS) return null;
        if (f.root) {
            if (opt.dir === 'length') v = false;
            else if (opt.dir === 'width') h = false;
        }
        if (opt.strips) {
            /* полоса первого уровня: прямоугольник тянется через весь лист */
            if (h && f.w >= opt.U - EPS) {
                if (opt.maxStrip && ph > opt.maxStrip + EPS) h = false;
                else if (opt.simple && opt.minStrip && ph < opt.minStrip - EPS) h = false;
            }
            if (v && f.h >= opt.V - EPS) {
                if (opt.maxStrip && pw > opt.maxStrip + EPS) v = false;
                else if (opt.simple && opt.minStrip && pw < opt.minStrip - EPS) v = false;
            }
            /* длина реза не больше допустимой */
            if (opt.maxLen) {
                if (h && rh > 0 && f.w > opt.maxLen + EPS) h = false;
                if (v && rw > 0 && f.h > opt.maxLen + EPS) v = false;
            }
        }
        return (h || v) ? { h: h, v: v } : null;
    }

    /* Один проход: раскладываем детали в заданном порядке по выбранным правилам */
    function pack(items, opt) {
        var U = opt.U, V = opt.V, k = opt.kerf, mt = opt.minTrim || 0, simple = !!opt.simple;
        var sheets = [];
        var unplaced = [];

        function newSheet() {
            var s = { free: [{ x: opt.trim, y: opt.trim, w: U, h: V, root: true }], pieces: [], cuts: 0 };
            sheets.push(s);
            return s;
        }

        var score = SCORES[opt.score];

        for (var n = 0; n < items.length; n++) {
            var it = items[n];
            var best = null;
            for (var si = 0; si < sheets.length; si++) {
                var sh = sheets[si], found = false;
                for (var fi = 0; fi < sh.free.length; fi++) {
                    var f = sh.free[fi];
                    for (var rot = 0; rot < (it.rotate ? 2 : 1); rot++) {
                        var pw = rot ? it.w : it.l, ph = rot ? it.l : it.w;
                        if (pw > f.w || ph > f.h) continue;
                        if (!dirsAllowed(f, pw, ph, opt)) continue;
                        var sc = score(f.w, f.h, pw, ph);
                        if (opt.policy === 'first') sc += si * 1e15;
                        if (!best || sc < best.sc) best = { sc: sc, si: si, fi: fi, rot: rot, pw: pw, ph: ph };
                        found = true;
                    }
                }
                if (opt.policy === 'first' && found && best && best.si === si) break;
            }
            if (!best) {
                /* открываем новый лист, если деталь вообще помещается */
                var fits = false, r2, root0 = { x: 0, y: 0, w: U, h: V, root: true };
                for (r2 = 0; r2 < (it.rotate ? 2 : 1); r2++) {
                    var a = r2 ? it.w : it.l, b = r2 ? it.l : it.w;
                    if (a <= U && b <= V && dirsAllowed(root0, a, b, opt)) { fits = true; best = { si: -1, fi: 0, rot: r2, pw: a, ph: b }; break; }
                }
                if (!fits) { unplaced.push(it); continue; }
                /* если помещается и так и так, берём ориентацию, которая лучше по правилу */
                if (it.rotate) {
                    var s0 = score(U, V, it.l, it.w), s1 = score(U, V, it.w, it.l);
                    var ok0 = it.l <= U && it.w <= V && dirsAllowed(root0, it.l, it.w, opt);
                    var ok1 = it.w <= U && it.l <= V && dirsAllowed(root0, it.w, it.l, opt);
                    if (ok0 && ok1) { var r = s1 < s0 ? 1 : 0; best.rot = r; best.pw = r ? it.w : it.l; best.ph = r ? it.l : it.w; }
                }
                newSheet();
                best.si = sheets.length - 1;
            }

            var sheet = sheets[best.si];
            var F = sheet.free[best.fi];
            sheet.free.splice(best.fi, 1);
            var px = F.x, py = F.y, pw2 = best.pw, ph2 = best.ph;
            sheet.pieces.push({ item: it, x: px, y: py, w: pw2, h: ph2, rot: best.rot });

            var rw = F.w - pw2, rh = F.h - ph2;           /* остаток по ширине и высоте */
            var da = dirsAllowed(F, pw2, ph2, opt) || { h: true, v: true };
            var horizontal;                                /* true: первый рез идёт во всю ширину */
            if (opt.split === 'h') horizontal = true;
            else if (opt.split === 'v') horizontal = false;
            else if (opt.split === 'maxarea') {
                /* выбираем деление, при котором самый большой остаток получается больше */
                var aH = Math.max(F.w * Math.max(rh - k, 0), rw * ph2);
                var aV = Math.max(Math.max(rw - k, 0) * F.h, pw2 * rh);
                horizontal = aH >= aV;
            } else horizontal = rw < rh;                   /* «короткий остаток»: делим по меньшему */
            if (horizontal && !da.h) horizontal = false;
            else if (!horizontal && !da.v) horizontal = true;

            /* остаток уже минимальной обрезки не отпиливаем: он остаётся припуском у детали */
            var hasR = rw > 0 && rw >= mt, hasB = rh > 0 && rh >= mt;
            var cut = 0;
            if (horizontal) {
                var Hs = ph2;                              /* высота полосы */
                if (!simple && opt.strips && opt.minStrip && F.w >= U - EPS && Hs < opt.minStrip) {
                    Hs = Math.min(opt.minStrip, opt.maxStrip || Infinity, F.h);
                    if (F.h - Hs < Math.max(mt, k) + EPS) Hs = F.h;
                }
                var botCut = Hs === ph2 ? hasB : (F.h - Hs > 0);
                if (botCut) {
                    cut += F.w;
                    var bh = F.h - Hs - k;
                    if (bh > 0) sheet.free.push({ x: F.x, y: F.y + Hs + k, w: F.w, h: bh, fixW: F.fixW });
                }
                if (hasR) {
                    cut += Hs;
                    var rW = rw - k;
                    if (rW > 0) sheet.free.push({ x: F.x + pw2 + k, y: F.y, w: rW, h: Hs, fixH: simple ? Hs : F.fixH });
                }
                if (Hs > ph2) {
                    var uh = Hs - ph2 - k;
                    if (uh > 0) { cut += pw2; sheet.free.push({ x: F.x, y: F.y + ph2 + k, w: pw2, h: uh }); }
                }
            } else {
                var Ws = pw2;                              /* ширина полосы */
                if (!simple && opt.strips && opt.minStrip && F.h >= V - EPS && Ws < opt.minStrip) {
                    Ws = Math.min(opt.minStrip, opt.maxStrip || Infinity, F.w);
                    if (F.w - Ws < Math.max(mt, k) + EPS) Ws = F.w;
                }
                var rigCut = Ws === pw2 ? hasR : (F.w - Ws > 0);
                if (rigCut) {
                    cut += F.h;
                    var rW2 = F.w - Ws - k;
                    if (rW2 > 0) sheet.free.push({ x: F.x + Ws + k, y: F.y, w: rW2, h: F.h, fixH: F.fixH });
                }
                if (hasB) {
                    cut += Ws;
                    var bH = rh - k;
                    if (bH > 0) sheet.free.push({ x: F.x, y: F.y + ph2 + k, w: Ws, h: bH, fixW: simple ? Ws : F.fixW });
                }
                if (Ws > pw2) {
                    var uw = Ws - pw2 - k;
                    if (uw > 0) { cut += ph2; sheet.free.push({ x: F.x + pw2 + k, y: F.y, w: uw, h: ph2 }); }
                }
            }
            sheet.cuts += cut;
        }
        return { sheets: sheets, unplaced: unplaced };
    }

    function maxFree(sheets) {
        var m = 0;
        sheets.forEach(function (s) { s.free.forEach(function (f) { m = Math.max(m, f.w * f.h); }); });
        return m;
    }

    function quality(res) {
        var cuts = 0;
        res.sheets.forEach(function (s) { cuts += s.cuts; });
        /* главное — меньше листов, затем — крупнее деловой остаток, затем — короче рез */
        return res.unplaced.length * 1e16 + res.sheets.length * 1e13 - maxFree(res.sheets) * 1 + cuts * 0.01;
    }

    function expand(parts, texture) {
        var items = [];
        parts.forEach(function (p, idx) {
            var qty = Math.max(0, Math.floor(p.qty || 0));
            for (var i = 0; i < qty; i++) {
                items.push({ row: idx, id: p.id, l: p.l, w: p.w, rotate: texture === false ? true : !!p.rotate, edges: p.edges || [0, 0, 0, 0], name: p.name || '' });
            }
        });
        return items;
    }

    function optimize(cfg) {
        var sheet = cfg.sheet, k = Math.max(0, cfg.kerf || 0), trim = Math.max(0, sheet.trim || 0);
        var U = sheet.l - 2 * trim, V = sheet.w - 2 * trim;
        var base = { U: U, V: V, kerf: k, trim: trim };
        var items = expand(cfg.parts || [], cfg.texture);
        var timeMs = cfg.timeMs == null ? 400 : cfg.timeMs;
        var rand = rng(cfg.seed || 12345);

        function nn(v) { v = +v; return isFinite(v) && v > 0 ? v : 0; }
        var cons = {
            dir: cfg.dir === 'length' || cfg.dir === 'width' ? cfg.dir : 'auto',
            simple: cfg.complex === false,
            minStrip: nn(cfg.minStrip), maxStrip: nn(cfg.maxStrip), maxLen: nn(cfg.maxStripLen),
            minTrim: nn(cfg.minTrim)
        };
        if (cons.minStrip && cons.maxStrip && cons.minStrip > cons.maxStrip) cons.minStrip = cons.maxStrip;
        cons.strips = cons.simple || cons.minStrip > 0 || cons.maxStrip > 0 || cons.maxLen > 0;

        function search(c, budget) {
            var t0 = Date.now(), best = null, bestQ = Infinity, runs = 0;
            function consider(order, o) {
                var res = pack(order, {
                    U: U, V: V, kerf: k, trim: trim, score: o.score, split: o.split, policy: o.policy,
                    dir: c.dir, simple: c.simple, strips: c.strips, minStrip: c.minStrip, maxStrip: c.maxStrip, maxLen: c.maxLen, minTrim: c.minTrim
                });
                var q = quality(res);
                runs++;
                if (q < bestQ) { bestQ = q; best = res; }
            }
            if (!items.length) return { best: { sheets: [], unplaced: [] }, runs: 0 };
            /* 1. Стандартные сочетания правил */
            SORTS.forEach(function (sk) {
                var key = sortKey(sk);
                var order = items.slice().sort(function (a, b) { return key(b) - key(a); });
                SCORE_NAMES.forEach(function (sc) {
                    SPLITS.forEach(function (sp) {
                        ['best', 'first'].forEach(function (po) { consider(order, { score: sc, split: sp, policy: po }); });
                    });
                });
            });
            /* 2. Случайные перестановки около лучших порядков, пока не вышло время */
            var maxRuns = Math.min(20000, 600000 / Math.max(10, items.length));
            while (Date.now() - t0 < budget && runs < maxRuns) {
                var key2 = sortKey(SORTS[Math.floor(rand() * SORTS.length)]);
                var order2 = items.slice().sort(function (a, b) { return key2(b) - key2(a); });
                var swaps = 1 + Math.floor(rand() * Math.max(2, order2.length / 4));
                for (var s = 0; s < swaps; s++) {
                    var i = Math.floor(rand() * order2.length);
                    var j = Math.min(order2.length - 1, i + 1 + Math.floor(rand() * 4));
                    var tmp = order2[i]; order2[i] = order2[j]; order2[j] = tmp;
                }
                consider(order2, {
                    score: SCORE_NAMES[Math.floor(rand() * 3)],
                    split: SPLITS[Math.floor(rand() * SPLITS.length)],
                    policy: rand() < 0.5 ? 'best' : 'first'
                });
            }
            return { best: best, runs: runs };
        }

        var r1 = search(cons, timeMs), best = r1.best, runs = r1.runs, relaxed = false;
        /* если из-за ограничений часть деталей не поместилась, пробуем без ограничений полос */
        if (items.length && best.unplaced.length && (cons.strips || cons.dir !== 'auto')) {
            var r2 = search({ dir: 'auto', simple: false, strips: false, minStrip: 0, maxStrip: 0, maxLen: 0, minTrim: cons.minTrim }, Math.min(timeMs, 300));
            runs += r2.runs;
            if (r2.best.unplaced.length < best.unplaced.length) { best = r2.best; relaxed = true; }
        }
        return finish(best, cfg, base, runs, relaxed);
    }

    /* Приводим результат к удобному виду: номера, края, остатки, статистика */
    function finish(res, cfg, base, runs, relaxed) {
        var sheetArea = cfg.sheet.l * cfg.sheet.w;
        var minOff = cfg.minOffcut == null ? 300 : cfg.minOffcut;
        var minOff2 = cfg.minOffcut2 == null ? minOff : cfg.minOffcut2;
        var totalUsed = 0, cuts = 0, edge = 0, perim = 0;
        var sheets = res.sheets.map(function (s, i) {
            var used = 0;
            var pieces = s.pieces.map(function (p) {
                used += p.w * p.h;
                /* края детали после поворота: t — верх, r — право, b — низ, l — лево */
                var e = p.item.edges, ed;
                if (!p.rot) ed = { t: e[0], b: e[1], l: e[2], r: e[3] };
                else ed = { r: e[0], l: e[1], t: e[2], b: e[3] };
                return { row: p.item.row, id: p.item.id, name: p.item.name, x: p.x, y: p.y, w: p.w, h: p.h, rot: !!p.rot, edges: ed, l: p.item.l, dw: p.item.w };
            });
            totalUsed += used; cuts += s.cuts;
            var free = s.free.filter(function (f) { return Math.max(f.w, f.h) >= minOff && Math.min(f.w, f.h) >= minOff2; });
            return { index: i + 1, pieces: pieces, free: free, used: used, util: used / sheetArea, cuts: s.cuts };
        });
        res.sheets.forEach(function (s) {
            s.pieces.forEach(function (p) {
                var e = p.item.edges;
                edge += (e[0] + e[1]) * p.item.l + (e[2] + e[3]) * p.item.w;
                perim += 2 * (p.w + p.h);
            });
        });
        var trim = base.trim;
        if (sheets.length && trim > 0) cuts += sheets.length * (2 * cfg.sheet.l + 2 * (cfg.sheet.w - 2 * trim));
        var total = sheets.length * sheetArea;
        return {
            sheets: sheets,
            unplaced: res.unplaced.map(function (u) { return { row: u.row, id: u.id, l: u.l, w: u.w, name: u.name }; }),
            stats: {
                sheets: sheets.length,
                sheetArea: sheetArea,
                usedArea: totalUsed,
                util: total ? totalUsed / total : 0,
                waste: total ? 1 - totalUsed / total : 0,
                cuts: cuts,
                edge: edge,
                perim: perim,
                relaxed: !!relaxed,
                pieces: sheets.reduce(function (n, s) { return n + s.pieces.length; }, 0),
                runs: runs
            }
        };
    }

    return { optimize: optimize, expand: expand };
});
