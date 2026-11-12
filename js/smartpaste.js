/* Умная вставка деталей: понимает обычные сообщения из мессенджера.
   RKParse.parts(text) -> { items: [{ name, l, w, qty }], skipped: [строки с цифрами, которые не удалось разобрать] }
   Примеры: «700х500 2шт», «Полка 800 на 300 - 4», «1) Боковина 720*560 (2 шт)», «70х50 см», «2 шт 700х500»,
   несколько деталей в одной строке через запятую или точку с запятой. */
(function () {
    'use strict';

    var N = '(\\d+(?:[.,]\\d+)?)';
    var UNIT = '(?:\\s*(мм|mm|см|cm|м|m)(?![\\p{L}\\d]))?';
    var X = '(?:[xXхХ×✕*]|(?:^|[^\\p{L}])(?:на|by|ga)(?![\\p{L}]))';
    /* А × Б [× В] с необязательными единицами */
    var DIM = new RegExp(N + UNIT + '\\s*' + X + '\\s*' + N + UNIT + '(?:\\s*[xXхХ×✕*]\\s*' + N + UNIT + ')?', 'gu');
    var QTY_WORD = '(?:шт\\.?|штук[аи]?|pcs\\.?|pc\\.?|dona|ta)(?![\\p{L}])';
    var QTY_AFTER = new RegExp('^\\s*(?:[-–—:=,;]\\s*|[xXхХ×✕*]\\s*|\\(\\s*|по\\s+)?(\\d{1,4})(?:\\s*(' + QTY_WORD + '))?\\s*\\)?', 'iu');
    var QTY_BEFORE = new RegExp('(?:^|[\\s,;(])(?:по\\s*)?(\\d{1,4})\\s*(?:' + QTY_WORD + ')\\s*[-–—:,]?\\s*$', 'iu');
    var THICK = { 10: 1, 12: 1, 15: 1, 16: 1, 18: 1, 19: 1, 22: 1, 25: 1, 28: 1, 32: 1, 36: 1, 38: 1, 40: 1 };

    function num(s) { return parseFloat(String(s).replace(',', '.')); }
    function round1(v) { return Math.round(v * 10) / 10; }
    function cleanName(s) {
        s = String(s || '')
            .replace(new RegExp('(?:^|\\s)' + QTY_WORD, 'giu'), ' ')
            .replace(/(?:^|\s)размер(?:ы|ом)?(?=[\s:,-]|$)/giu, ' ')
            .replace(/[\s ]+/g, ' ')
            .replace(/^[\s\-–—:=,;.)(\]\[•·*]+/, '')
            .replace(/[\s\-–—:=,;.)(\]\[•·*]+$/, '')
            .trim();
        if (/^\d+$/.test(s)) return '';
        return s ? s.charAt(0).toUpperCase() + s.slice(1, 60) : '';
    }
    function stripMarker(line) {
        return line.replace(/^\s*(?:[-–—•·*]+\s+|\d{1,3}\s*[.)]\s+)/, '');
    }
    function unitMul(u) {
        u = String(u || '').toLowerCase();
        if (u === 'см' || u === 'cm') return 10;
        if (u === 'м' || u === 'm') return 1000;
        return 1;
    }

    function parseLine(raw, cmAll) {
        var line = stripMarker(String(raw).replace(/ /g, ' '));
        var found = [], m;
        DIM.lastIndex = 0;
        while ((m = DIM.exec(line))) {
            /* «на/by» захватывает символ перед собой — это не часть числа, поэтому границы берём по числам */
            found.push({ s: m.index, e: m.index + m[0].length, a: m[1], ua: m[2], b: m[3], ub: m[4], c: m[5], uc: m[6] });
            if (m[0].length === 0) DIM.lastIndex++;
        }
        var res = [];
        if (!found.length) {
            /* без разделителя: «Полка 800 300 3» (длина, ширина, штук) */
            var nums = line.match(/\d+(?:[.,]\d+)?/g) || [];
            if (nums.length < 2 || nums.length > 3) return { items: [], bad: nums.length >= 2 };
            var nm = cleanName(line.replace(/\d+(?:[.,]\d+)?/g, ' ').replace(/[xXхХ×✕*;:|,\t]+/g, ' '));
            var l0 = num(nums[0]), w0 = num(nums[1]), q0 = nums[2] ? Math.max(1, Math.floor(num(nums[2]))) : 1;
            var mulN = cmAll ? 10 : 1;
            /* без разделителя доверяем только правдоподобным размерам (от 20 мм) — так телефоны и даты не превращаются в детали */
            if (!l0 || !w0 || l0 * mulN < 20 || w0 * mulN < 20 || /\d\s*[-+()]\s*\d/.test(line) && nums.length === 3 && /^\s*\+?\d/.test(line)) return { items: [], bad: true };
            return { items: [{ name: nm, l: round1(l0 * mulN), w: round1(w0 * mulN), qty: Math.min(999, q0) }] };
        }
        var prevEnd = 0;
        found.forEach(function (f, i) {
            var nextStart = i + 1 < found.length ? found[i + 1].s : line.length;
            var before = line.slice(prevEnd, f.s), after = line.slice(f.e, nextStart);
            var qty = 1, hasQty = false, consumed = 0;
            /* штуки перед размером: «2 шт 700х500» */
            var qb = QTY_BEFORE.exec(before);
            if (qb) { qty = parseInt(qb[1], 10); hasQty = true; before = before.slice(0, qb.index); }
            /* третье число в «А×Б×В»: толщина или количество */
            if (f.c != null) {
                var c = num(f.c), hasWord = new RegExp('^\\s*' + QTY_WORD, 'iu').test(line.slice(f.e));
                if (!hasQty && (hasWord || !THICK[c])) { qty = Math.max(1, Math.floor(c)); hasQty = true; }
            }
            /* штуки после размера: «700х500 2шт», «700х500 - 4», «700х500 (2)», «700х500 х2» */
            if (!hasQty) {
                var qa = QTY_AFTER.exec(after);
                if (qa) {
                    var okQ = !!qa[2] || /^\s*(?:[xXхХ×✕*]|\(|по\s)/iu.test(after) || /^\s*[-–—:=]\s*\d/.test(after) || /^\s*[,;]?\s*\d{1,4}\s*(?:[,;)]|$)/.test(after);
                    if (okQ) { qty = parseInt(qa[1], 10); hasQty = true; consumed = qa[0].length;  }
                }
            }
            var tail = after.slice(consumed);
            var name = cleanName(before);
            if (!name && i === found.length - 1) name = cleanName(tail);
            if (!name && i > 0) name = '';
            var mul = unitMul(f.ua || f.ub || f.uc);
            if (!f.ua && !f.ub && !f.uc && cmAll) mul = 10;
            var l = num(f.a) * mul, w = num(f.b) * mul;
            if (l > 0 && w > 0) res.push({ name: name, l: round1(l), w: round1(w), qty: Math.max(1, Math.min(999, qty || 1)) });
            prevEnd = f.e + consumed;
        });
        return { items: res, bad: !res.length };
    }

    function parts(text) {
        text = String(text || '');
        var cmAll = /(?:^|[^\p{L}])(?:размеры?\s+)?в\s+(?:см|сантиметрах)(?![\p{L}])|\(\s*см\s*\)|\bin\s+cm\b|sm\s+da/iu.test(text);
        var items = [], skipped = [];
        text.split(/\r?\n/).forEach(function (line) {
            if (!line.trim()) return;
            var r = parseLine(line, cmAll);
            if (r.items.length) r.items.forEach(function (it) { items.push(it); });
            else if (r.bad) skipped.push(line.trim());
        });
        return { items: items, skipped: skipped };
    }

    window.RKParse = { parts: parts };
})();
