/* Раздел «Ткань»: сколько метров ткани уйдёт на мягкую мебель.
   Несколько тканей (основная, подкладка), у каждой своя ширина рулона и детали. Расчёт идёт сразу при вводе. */
(function () {
    'use strict';

    var Core = window.RKFabricCore, I = window.RKI18N, root = document.documentElement;
    if (!Core || !I || !document.getElementById('fb-main')) return;

    function t(k, v) { return I.t(k, v); }
    function $(s, c) { return (c || document).querySelector(s); }
    function $$(s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); }
    function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
    function el(tag, cls, attrs) {
        var n = document.createElement(tag);
        if (cls) n.className = cls;
        if (attrs) for (var k in attrs) n.setAttribute(k, attrs[k]);
        return n;
    }
    function num(v) { var x = parseFloat(String(v).replace(/\s/g, '').replace(',', '.')); return isFinite(x) && x > 0 ? x : 0; }
    function hue(i) { return (i * 53 + 205) % 360; }
    function toast(m) { if (window.RKApp && window.RKApp.toast) window.RKApp.toast(m); }

    var KEY = 'rk-fabric-v1';
    var ROUNDS = [0, 100, 250, 500, 1000];

    /* ---------- Состояние ---------- */
    function uid() { return 'f' + Date.now().toString(36) + Math.floor(Math.random() * 46656).toString(36); }
    function blankFabric(n) {
        return { id: uid(), n: n, name: '', roll: 1400, edge: 0, allow: 0, gap: 0, repeat: 0, reserve: 5, round: 100, price: 0, rot: false, parts: [] };
    }
    function exampleParts() {
        function P(n, l, w, q) { return { n: n, l: l, w: w, q: q }; }
        return [
            P('Основание сиденья', 1900, 650, 1), P('Спинка внутренняя', 1800, 600, 1), P('Спинка наружная', 1800, 700, 1),
            P('Подлокотник внутренний', 650, 600, 2), P('Подлокотник наружный', 650, 700, 2), P('Боковина', 800, 700, 2),
            P('Подушка сиденья', 600, 600, 6), P('Подушка спинки', 600, 450, 6), P('Обвязка', 1900, 200, 2)
        ];
    }
    function cleanFabric(x, n) {
        if (!x || typeof x !== 'object') return null;
        var f = blankFabric(n);
        f.id = String(x.id || f.id).slice(0, 40);
        f.n = Number(x.n) > 0 ? Math.floor(Number(x.n)) : n;
        f.name = String(x.name || '').slice(0, 60);
        ['roll', 'edge', 'allow', 'gap', 'repeat', 'reserve', 'price'].forEach(function (k) { var v = Number(x[k]); f[k] = isFinite(v) && v >= 0 ? v : f[k]; });
        f.round = ROUNDS.indexOf(Number(x.round)) >= 0 ? Number(x.round) : 100;
        f.rot = !!x.rot;
        f.parts = (Array.isArray(x.parts) ? x.parts : []).slice(0, 500).map(function (p) {
            return { n: String((p && p.n) || '').slice(0, 60), l: num(p && p.l), w: num(p && p.w), q: Math.max(1, Math.min(999, Math.floor(Number(p && p.q) || 1))) };
        });
        return f;
    }
    function load() {
        try {
            var raw = JSON.parse(localStorage.getItem(KEY) || 'null');
            if (raw && Array.isArray(raw.list) && raw.list.length) {
                var list = [], i = 0;
                raw.list.forEach(function (x) { var f = cleanFabric(x, ++i); if (f) list.push(f); });
                if (list.length) {
                    var ids = {};
                    list.forEach(function (f) { while (ids[f.id]) f.id = uid(); ids[f.id] = 1; });
                    return {
                        unit: raw.unit === 'mm' ? 'mm' : 'cm', cur: typeof raw.cur === 'string' ? raw.cur.slice(0, 8) : t('cur'), curAuto: raw.curAuto !== false,
                        active: ids[raw.active] ? raw.active : list[0].id, list: list
                    };
                }
            }
        } catch (e) { /* нет сохранённого или он повреждён */ }
        var f0 = blankFabric(1);
        return { unit: 'cm', cur: t('cur'), curAuto: true, active: f0.id, list: [f0] };
    }
    var state = load();
    var saveTimer = 0;
    function saveNow() {
        clearTimeout(saveTimer);
        try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* хранилище недоступно */ }
    }
    function save() { clearTimeout(saveTimer); saveTimer = setTimeout(saveNow, 250); }
    window.addEventListener('pagehide', saveNow);

    function active() {
        for (var i = 0; i < state.list.length; i++) if (state.list[i].id === state.active) return state.list[i];
        state.active = state.list[0].id; return state.list[0];
    }
    function label(f) { return f.name || t('fb.tab.def', { n: f.n }); }
    function partName(p, i) { return p.n || t('fb.p.def', { n: i + 1 }); }

    /* ---------- Единицы и числа ---------- */
    function F() { return state.unit === 'cm' ? 10 : 1; }
    function uName() { return t(state.unit === 'cm' ? 'fb.u.cm' : 'fb.u.mm'); }
    function nf(v, d) { return new Intl.NumberFormat(I.locale(), { minimumFractionDigits: 0, maximumFractionDigits: d == null ? 2 : d, useGrouping: false }).format(v); }
    function nfg(v, d) { return new Intl.NumberFormat(I.locale(), { minimumFractionDigits: d || 0, maximumFractionDigits: d || 0 }).format(v); }
    function inU(mm) { return mm ? nf(mm / F(), state.unit === 'cm' ? 2 : 1) : ''; }
    function dimU(mm) { return nf(mm / F(), state.unit === 'cm' ? 1 : 0); }
    function fromU(text) { return num(text) * F(); }
    function meters(v) { return nf(v, 2); }
    function money(v) { return nfg(Math.round(v)); }

    /* ---------- Расчёт ---------- */
    var cache = {};
    function sigOf(f) {
        return [f.roll, f.edge, f.allow, f.gap, f.repeat, f.rot ? 1 : 0, f.reserve, f.round, f.price].join(',') + '|' + f.parts.map(function (p) { return p.l + 'x' + p.w + 'x' + p.q; }).join(';');
    }
    function calc(f) {
        var sig = sigOf(f), c = cache[f.id];
        if (c && c.sig === sig) return c;
        var r = Core.pack({ roll: f.roll, edge: f.edge, allow: f.allow, gap: f.gap, repeat: f.repeat, rot: f.rot, parts: f.parts });
        var o = Core.order(r.length, f.reserve, f.round);
        c = cache[f.id] = { sig: sig, r: r, o: o, cost: f.price > 0 ? o.ordered * f.price : 0 };
        return c;
    }

    /* ---------- Вкладки тканей ---------- */
    function renderTabs() {
        var box = $('#fb-tabs');
        box.innerHTML = '';
        var many = state.list.length > 1;
        state.list.forEach(function (f) {
            var on = f.id === state.active;
            var tab = el('div', 'rk-tab' + (on ? ' is-active' : ''));
            if (on) {
                var inp = el('input', 'rk-tab-name', { type: 'text', maxlength: '60', autocomplete: 'off', spellcheck: 'false', 'aria-label': t('fb.rename'), role: 'tab', 'aria-selected': 'true' });
                inp.value = label(f);
                inp.style.width = Math.max(6, inp.value.length + 1) + 'ch';
                inp.addEventListener('input', function () {
                    f.name = inp.value.trim().slice(0, 60);
                    inp.style.width = Math.max(6, inp.value.length + 1) + 'ch';
                    var nm = $('#fb-set [data-k="name"]'); if (nm && nm !== document.activeElement) nm.value = f.name;
                    save(); renderResult();
                });
                inp.addEventListener('blur', function () { if (!inp.value.trim()) { f.name = ''; inp.value = label(f); inp.style.width = Math.max(6, inp.value.length + 1) + 'ch'; } save(); });
                inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); inp.blur(); } });
                inp.addEventListener('focus', function () { try { inp.select(); } catch (err) { /* не страшно */ } });
                tab.appendChild(inp);
            } else {
                var b = el('button', 'rk-tab-btn', { type: 'button', role: 'tab', 'aria-selected': 'false' });
                b.textContent = label(f);
                b.addEventListener('click', function () { switchTo(f.id); });
                tab.appendChild(b);
            }
            if (many) {
                var x = el('button', 'rk-tab-x', { type: 'button', 'aria-label': t('fb.close', { name: label(f) }) });
                x.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7l10 10M17 7L7 17"/></svg>';
                x.addEventListener('click', function (e) { e.stopPropagation(); removeFabric(f.id); });
                tab.appendChild(x);
            }
            box.appendChild(tab);
        });
        var cur = $('.rk-tab.is-active', box);
        if (cur && cur.scrollIntoView) { try { cur.scrollIntoView({ block: 'nearest', inline: 'nearest' }); } catch (e) { /* не страшно */ } }
    }
    function switchTo(id) { saveNow(); state.active = id; saveNow(); renderAll(); }
    function newFabric() {
        var n = 0; state.list.forEach(function (f) { if (f.n > n) n = f.n; });
        var f = blankFabric(n + 1);
        var cur = active();
        f.roll = cur.roll; f.reserve = cur.reserve; f.round = cur.round;   /* ширина рулона и запас обычно те же */
        state.list.push(f); state.active = f.id;
        saveNow(); renderAll();
        if (window.RKTool && window.RKTool.get() === 'fabric') { var h = document.getElementById('fb-h-parts'); if (h) h.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
    }
    function removeFabric(id) {
        if (state.list.length < 2) return;
        var f = state.list.filter(function (x) { return x.id === id; })[0];
        if (!f) return;
        if (f.parts.length && !window.confirm(t('fb.delconfirm', { name: label(f), n: f.parts.length }))) return;
        var idx = state.list.indexOf(f);
        state.list.splice(idx, 1);
        delete cache[id];
        if (state.active === id) state.active = state.list[Math.min(idx, state.list.length - 1)].id;
        saveNow(); renderAll();
    }
    $('#fb-new').addEventListener('click', newFabric);
    $('#isl-fnew').addEventListener('click', newFabric);

    /* ---------- Настройки ткани ---------- */
    function helpI(key) { return '<i class="rk-help" tabindex="0" role="img" data-tip="' + esc(t(key)) + '" aria-label="' + esc(t(key)) + '">?</i>'; }
    function numField(k, labelKey, helpKey, vars) {
        return '<label class="rk-f"><span class="rk-lab"><span>' + esc(t(labelKey, vars)) + '</span>' + (helpKey ? helpI(helpKey) : '') + '</span><input class="rk-input" data-k="' + k + '" inputmode="decimal" autocomplete="off"></label>';
    }
    function renderSettings() {
        var f = active(), box = $('#fb-set'), u = uName();
        box.innerHTML =
            '<div class="fb-set">' +
            '<label class="rk-f fb-span2"><span>' + esc(t('fb.f.name')) + '</span><input class="rk-input" data-k="name" maxlength="60" autocomplete="off" placeholder="' + esc(t('fb.tab.def', { n: f.n })) + '"></label>' +
            '<label class="rk-f"><span>' + esc(t('fb.f.unit')) + '</span><select class="rk-input" data-unit><option value="cm">' + esc(t('fb.u.cm')) + '</option><option value="mm">' + esc(t('fb.u.mm')) + '</option></select></label>' +
            numField('roll', 'fb.f.roll', 'fb.h.roll', { u: u }) +
            numField('edge', 'fb.f.edge', 'fb.h.edge', { u: u }) +
            numField('allow', 'fb.f.allow', 'fb.h.allow', { u: u }) +
            numField('gap', 'fb.f.gap', 'fb.h.gap', { u: u }) +
            numField('repeat', 'fb.f.repeat', 'fb.h.repeat', { u: u }) +
            numField('reserve', 'fb.f.reserve', 'fb.h.reserve') +
            '<label class="rk-f"><span class="rk-lab"><span>' + esc(t('fb.f.round')) + '</span>' + helpI('fb.h.round') + '</span><select class="rk-input" data-ks="round">' +
            ROUNDS.map(function (v) { return '<option value="' + v + '">' + esc(v ? nf(v / 1000, 2) + ' ' + t('fb.m') : t('fb.round.0')) + '</option>'; }).join('') + '</select></label>' +
            numField('price', 'fb.f.price', null, { cur: state.cur }) +
            '<label class="rk-f"><span>' + esc(t('fb.f.cur')) + '</span><input class="rk-input" data-cur maxlength="8" autocomplete="off"></label>' +
            '<label class="rk-check fb-span-all"><input type="checkbox" data-kb="rot"><span class="rk-lab"><span>' + esc(t('fb.f.rot')) + '</span>' + helpI('fb.h.rot') + '</span></label>' +
            '<div class="fb-span-all fb-del-row"><button type="button" class="rk-btn rk-btn--danger" data-del>' + esc(t('fb.del')) + '</button></div>' +
            '</div>';
        var MM = { roll: 1, edge: 1, allow: 1, gap: 1, repeat: 1 };
        $$('input[data-k]', box).forEach(function (inp) {
            var k = inp.getAttribute('data-k');
            function show() { inp.value = k === 'name' ? f.name : (MM[k] ? inU(f[k]) : (f[k] ? nf(f[k], 2) : '')); }
            show();
            inp.addEventListener('input', function () {
                if (k === 'name') { f.name = inp.value.trim().slice(0, 60); renderTabs(); var tn = $('#fb-tabs .rk-tab-name'); if (tn) tn.value = label(f); }
                else {
                    f[k] = MM[k] ? fromU(inp.value) : num(inp.value);
                    if (k === 'reserve' && f[k] > 100) f[k] = 100;
                    inp.classList.toggle('is-bad', k === 'roll' && !f.roll);
                }
                changed();
            });
            inp.addEventListener('blur', function () { if (k !== 'name') show(); });
        });
        var sel = $('select[data-ks="round"]', box); sel.value = String(f.round);
        sel.addEventListener('change', function () { f.round = Number(sel.value); changed(); });
        var us = $('select[data-unit]', box); us.value = state.unit;
        us.addEventListener('change', function () { state.unit = us.value === 'mm' ? 'mm' : 'cm'; saveNow(); renderSettings(); renderParts(); renderResult(); });
        var cu = $('input[data-cur]', box); cu.value = state.cur;
        cu.addEventListener('input', function () { state.cur = cu.value.slice(0, 8); state.curAuto = false; changed(); renderSettingsLabels(); });
        var rot = $('input[data-kb="rot"]', box); rot.checked = !!f.rot;
        rot.addEventListener('change', function () { f.rot = rot.checked; changed(); });
        var del = $('[data-del]', box); del.disabled = state.list.length < 2;
        del.addEventListener('click', function () { removeFabric(f.id); });
    }
    function renderSettingsLabels() {
        var l = $('#fb-set input[data-k="price"]'); if (l) { var s = l.parentNode.querySelector('.rk-lab > span'); if (s) s.textContent = t('fb.f.price', { cur: state.cur }); }
    }

    /* ---------- Детали ---------- */
    var partsBox = $('#fb-parts');
    function labelHeads() { $('#fb-hl').textContent = t('fb.p.l', { u: uName() }); $('#fb-hw').textContent = t('fb.p.w', { u: uName() }); }
    function focusCell(i, k) {
        var rows = $$('.fb-row', partsBox), r = rows[i];
        var inp = r && $('[data-k="' + k + '"]', r);
        if (inp) { inp.focus(); try { inp.select(); } catch (e) { /* не страшно */ } }
    }
    function partRow(f, p, i) {
        var row = el('div', 'fb-row');
        row.innerHTML =
            '<span class="rk-chip" style="--h:' + hue(i) + '">' + (i + 1) + '</span>' +
            '<label class="rk-f fb-name"><span>' + esc(t('fb.p.name')) + '</span><input class="rk-input" data-k="n" maxlength="60" autocomplete="off" placeholder="' + esc(t('fb.p.def', { n: i + 1 })) + '"></label>' +
            '<div class="fb-dims">' +
            '<label class="rk-f"><span>' + esc(t('fb.p.l', { u: uName() })) + '</span><input class="rk-input" data-k="l" inputmode="decimal" autocomplete="off"></label>' +
            '<label class="rk-f"><span>' + esc(t('fb.p.w', { u: uName() })) + '</span><input class="rk-input" data-k="w" inputmode="decimal" autocomplete="off"></label>' +
            '<label class="rk-f"><span>' + esc(t('fb.p.q')) + '</span><input class="rk-input" data-k="q" inputmode="numeric" autocomplete="off"></label>' +
            '</div>' +
            '<div class="fb-tools">' +
            '<button type="button" class="rk-rot" data-swap aria-label="' + esc(t('fb.p.swap')) + '" title="' + esc(t('fb.p.swap')) + '">⇄</button>' +
            '<button type="button" class="rk-dup" data-dup aria-label="' + esc(t('fb.p.dup')) + '" title="' + esc(t('fb.p.dup')) + '"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V6a2 2 0 0 1 2-2h9"/></svg></button>' +
            '<button type="button" class="rk-del" data-del aria-label="' + esc(t('fb.p.del')) + '" title="' + esc(t('fb.p.del')) + '">×</button>' +
            '</div>';
        function show(k) {
            var inp = $('[data-k="' + k + '"]', row);
            inp.value = k === 'n' ? p.n : (k === 'q' ? String(p.q) : inU(p[k]));
        }
        ['n', 'l', 'w', 'q'].forEach(function (k) {
            var inp = $('[data-k="' + k + '"]', row);
            show(k);
            inp.addEventListener('input', function () {
                if (k === 'n') p.n = inp.value.slice(0, 60);
                else if (k === 'q') { p.q = Math.max(0, Math.min(999, Math.floor(num(inp.value)))); inp.classList.toggle('is-bad', !p.q); }
                else { p[k] = fromU(inp.value); inp.classList.toggle('is-bad', !p[k]); }
                changed();
            });
            inp.addEventListener('blur', function () { if (k === 'q' && !p.q) p.q = 1; show(k); if (k === 'q') changed(); });
            inp.addEventListener('keydown', function (e) {
                if (e.key !== 'Enter') return;
                e.preventDefault();
                if (i === f.parts.length - 1) addPart(true); else focusCell(i + 1, k);
            });
        });
        $('[data-swap]', row).addEventListener('click', function () { var x = p.l; p.l = p.w; p.w = x; show('l'); show('w'); changed(); });
        $('[data-dup]', row).addEventListener('click', function () { f.parts.splice(i + 1, 0, { n: p.n, l: p.l, w: p.w, q: p.q }); renderParts(); changed(); focusCell(i + 1, 'n'); });
        $('[data-del]', row).addEventListener('click', function () { f.parts.splice(i, 1); renderParts(); changed(); });
        return row;
    }
    function renderParts() {
        var f = active();
        labelHeads();
        partsBox.innerHTML = '';
        f.parts.forEach(function (p, i) { partsBox.appendChild(partRow(f, p, i)); });
        $('#fb-parts-wrap').hidden = f.parts.length === 0;
    }
    function addPart(focus) {
        var f = active();
        f.parts.push({ n: '', l: 0, w: 0, q: 1 });
        renderParts(); changed();
        if (focus) focusCell(f.parts.length - 1, 'n');
    }
    $('#fb-add').addEventListener('click', function () { addPart(true); });
    $('#fb-example').addEventListener('click', function () {
        var f = active();
        if (f.parts.length && !window.confirm(t('fb.c.example'))) return;
        f.parts = exampleParts();
        if (!f.roll) f.roll = 1400;
        renderSettings(); renderParts(); changed(true);
    });
    $('#fb-clear').addEventListener('click', function () {
        var f = active();
        if (f.parts.length && !window.confirm(t('fb.c.clear'))) return;
        f.parts = [];
        renderParts(); changed(true);
    });

    var pasteBox = $('#fb-paste');
    $('#fb-paste-toggle').addEventListener('click', function () {
        pasteBox.hidden = !pasteBox.hidden;
        this.setAttribute('aria-expanded', String(!pasteBox.hidden));
        if (!pasteBox.hidden) $('#fb-paste-text').focus();
    });
    function parseLine(line) {
        line = String(line).trim();
        if (!line) return null;
        var nums = line.match(/\d+(?:[.,]\d+)?/g) || [];
        if (nums.length < 2) return null;
        var name = line.replace(/\d+(?:[.,]\d+)?/g, ' ').replace(/[x×*;:|,\t]+/gi, ' ').replace(/\s+/g, ' ').trim();
        var l = fromU(nums[0]), w = fromU(nums[1]), q = nums[2] ? Math.max(1, Math.floor(num(nums[2]))) : 1;
        if (!l || !w) return null;
        return { n: name.slice(0, 60), l: l, w: w, q: Math.min(999, q) };
    }
    $('#fb-paste-go').addEventListener('click', function () {
        var f = active(), added = 0;
        $('#fb-paste-text').value.split(/\r?\n/).forEach(function (ln) { var p = parseLine(ln); if (p) { f.parts.push(p); added++; } });
        $('#fb-paste-note').textContent = added ? t('fb.paste.ok', { n: added }) : t('fb.paste.none');
        if (added) { $('#fb-paste-text').value = ''; renderParts(); changed(true); }
    });

    /* ---------- Чертёж ---------- */
    var mq = window.matchMedia ? window.matchMedia('(max-width: 700px)') : null;
    function palette(h, solid) {
        if (solid) return { fill: 'hsl(' + h + ' 62% 80%)', stroke: 'hsl(' + h + ' 45% 42%)', text: '#16202f' };
        return { fill: 'hsl(' + h + ' 45% var(--cp-bg))', stroke: 'hsl(' + h + ' 55% var(--cp-bd))', text: 'hsl(' + h + ' 75% var(--cp-fg))' };
    }
    /* standalone: true даёт самостоятельный файл SVG с явными цветами */
    function buildSvg(f, c, standalone, vertical) {
        var r = c.r, W = f.roll, L = r.length;
        var assumed = vertical ? 340 : 1000;   /* ширина рисунка в пикселях, под неё подбирается размер шрифта */
        var pad = Math.max(L, W) * 0.012;
        /* сколько миллиметров приходится на один пиксель; для вертикального вида полоса линейки входит в ширину */
        var mmpx = vertical ? (W + 2 * pad) / (assumed - 40.8) : (L + 2 * pad) / assumed;
        var fs = 12 * mmpx, band = 3.4 * fs;
        var vw, vh, ox, oy;
        if (vertical) { ox = pad + band; oy = pad; vw = ox + W + pad; vh = oy + L + pad + fs * 2.4; }
        else { ox = pad; oy = pad + band; vw = ox + L + pad; vh = oy + W + pad + fs * 2.4; }
        var across = W, along = L;
        var s = [];
        s.push('<svg class="rk-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + Math.round(vw) + ' ' + Math.round(vh) + '"' + (standalone ? ' width="' + Math.round(vw / mmpx) + '" height="' + Math.round(vh / mmpx) + '"' : '') + ' font-family="ui-monospace, Menlo, Consolas, monospace" role="img" aria-label="' + esc(label(f)) + '">');
        var ink = standalone ? '#475569' : 'var(--muted)';
        var line = standalone ? '#94a3b8' : 'var(--line2)';
        if (standalone) s.push('<rect width="100%" height="100%" fill="#fff"/>');
        function X(a, b2) { return vertical ? ox + a : ox + b2; }   /* a поперёк, b2 вдоль */
        function Y(a, b2) { return vertical ? oy + b2 : oy + a; }
        /* рулон */
        var rx = vertical ? ox : ox, ry = oy, rw = vertical ? across : along, rh = vertical ? along : across;
        s.push('<rect x="' + rx + '" y="' + ry + '" width="' + rw + '" height="' + rh + '" fill="' + (standalone ? '#f1f5f9' : 'var(--field)') + '" stroke="' + line + '" stroke-width="' + mmpx + '"/>');
        if (r.edge > 0) {
            var ed = standalone ? '#e2e8f0' : 'color-mix(in srgb, var(--muted) 20%, transparent)';
            if (vertical) { s.push('<rect x="' + ox + '" y="' + oy + '" width="' + r.edge + '" height="' + along + '" fill="' + ed + '"/><rect x="' + (ox + across - r.edge) + '" y="' + oy + '" width="' + r.edge + '" height="' + along + '" fill="' + ed + '"/>'); }
            else { s.push('<rect x="' + ox + '" y="' + oy + '" width="' + along + '" height="' + r.edge + '" fill="' + ed + '"/><rect x="' + ox + '" y="' + (oy + across - r.edge) + '" width="' + along + '" height="' + r.edge + '" fill="' + ed + '"/>'); }
        }
        /* линейка */
        var stepLab = L > 30000 ? 5000 : (L > 12000 ? 2000 : 1000);
        for (var m = 0; m <= L + 1; m += 100) {
            var major = m % 1000 === 0, mid = m % 500 === 0;
            var len = major ? band * 0.62 : (mid ? band * 0.42 : band * 0.24);
            var p1 = vertical ? [ox, oy + m, ox - len, oy + m] : [ox + m, oy, ox + m, oy - len];
            s.push('<line x1="' + p1[0] + '" y1="' + p1[1] + '" x2="' + p1[2] + '" y2="' + p1[3] + '" stroke="' + ink + '" stroke-width="' + mmpx * (major ? 1.2 : 0.8) + '"/>');
            if (major && m % stepLab === 0 && m <= L + 1) {
                if (vertical) s.push('<text x="' + (ox - band * 0.7) + '" y="' + (oy + m + fs * 0.35) + '" font-size="' + fs * 0.95 + '" text-anchor="end" fill="' + ink + '">' + (m / 1000) + '</text>');
                else s.push('<text x="' + (ox + m + fs * 0.3) + '" y="' + (oy - band * 0.72) + '" font-size="' + fs * 0.95 + '" fill="' + ink + '">' + (m / 1000) + ' ' + esc(t('fb.m')) + '</text>');
            }
        }
        /* детали */
        var shown = r.placed.slice().sort(function (a, b) { return a.pi - b.pi || a.k - b.k; });
        shown.forEach(function (p) {
            var pc = f.parts[p.pi], pal = palette(hue(p.pi), standalone);
            var x = X(p.x, p.y), y = Y(p.x, p.y);
            var w = vertical ? p.w : p.h, h = vertical ? p.h : p.w;
            var name = partName(pc, p.pi);
            var dim = dimU(p.h) + '×' + dimU(p.w);
            var tip = name + ': ' + dim + ' ' + uName() + (p.rotated ? ' ↻' : '');
            s.push('<g class="fb-pc"><title>' + esc(tip) + '</title><rect x="' + x + '" y="' + y + '" width="' + Math.max(w, 1) + '" height="' + Math.max(h, 1) + '" rx="' + fs * 0.18 + '" fill="' + pal.fill + '" stroke="' + pal.stroke + '" stroke-width="' + mmpx * 1.1 + '"/>');
            var cx = x + w / 2, cy = y + h / 2, cw = fs * 0.62;
            var txtName = name, txtDim = dim + (p.rotated ? ' ↻' : '');
            var canBoth = h >= fs * 2.9 && w >= Math.max(txtName.length, txtDim.length) * cw + fs;
            var canDim = h >= fs * 1.6 && w >= txtDim.length * cw + fs * 0.8;
            if (!canBoth && !canDim && h >= fs * 1.6 && w >= 3 * cw + fs) {
                /* название обрезаем под ширину */
                var maxc = Math.floor((w - fs) / cw);
                if (maxc >= 3) { s.push('<text x="' + cx + '" y="' + (cy + fs * 0.35) + '" font-size="' + fs + '" text-anchor="middle" fill="' + pal.text + '">' + esc(txtName.length > maxc ? txtName.slice(0, maxc - 1) + '…' : txtName) + '</text>'); }
            } else if (canBoth) {
                var nm = txtName;
                s.push('<text x="' + cx + '" y="' + (cy - fs * 0.15) + '" font-size="' + fs + '" font-weight="700" text-anchor="middle" fill="' + pal.text + '">' + esc(nm) + '</text>');
                s.push('<text x="' + cx + '" y="' + (cy + fs * 1.15) + '" font-size="' + fs * 0.9 + '" text-anchor="middle" fill="' + pal.text + '" opacity=".85">' + esc(txtDim) + '</text>');
            } else if (canDim) {
                s.push('<text x="' + cx + '" y="' + (cy + fs * 0.33) + '" font-size="' + fs * 0.9 + '" text-anchor="middle" fill="' + pal.text + '">' + esc(txtDim) + '</text>');
            }
            s.push('</g>');
        });
        /* конец раскладки */
        var cap = t('fb.roll', { w: nf(W / F(), 1), u: uName(), l: meters(L / 1000) });
        s.push('<text x="' + (vertical ? ox : ox) + '" y="' + (vh - fs * 0.7) + '" font-size="' + fs + '" fill="' + ink + '">' + esc(cap) + '</text>');
        s.push('</svg>');
        return s.join('');
    }

    /* ---------- Результат ---------- */
    function summaryText() {
        var lines = [t('fb.h1')], total = 0, anyCost = false;
        state.list.forEach(function (f) {
            var c = calc(f);
            if (!c.r.count) return;
            var l = label(f) + ': ' + meters(c.o.ordered) + ' ' + t('fb.m') + ' (' + t('fb.r.layout').toLowerCase() + ' ' + meters(c.o.base) + (f.reserve ? ', ' + t('fb.r.reserve', { p: nf(f.reserve, 1) }).toLowerCase() : '') + ')';
            if (c.cost) { l += ' · ' + money(c.cost) + ' ' + state.cur; total += c.cost; anyCost = true; }
            lines.push(l);
        });
        if (anyCost && state.list.length > 1) lines.push(t('fb.total.all') + ': ' + money(total) + ' ' + state.cur);
        return lines.join('\n');
    }
    function renderResult() {
        var f = active(), c = calc(f), r = c.r;
        var sum = $('#fb-summary'), warn = $('#fb-warn'), draw = $('#fb-draw'), tot = $('#fb-total');
        /* предупреждения о деталях шире рулона */
        if (r.bad.length) {
            warn.hidden = false;
            warn.innerHTML = '<ul>' + r.bad.map(function (b) {
                return '<li>' + esc(t('fb.warn.wide', { name: partName(f.parts[b.pi], b.pi), need: dimU(b.need) + ' ' + uName(), have: dimU(b.have) + ' ' + uName() })) + '</li>';
            }).join('') + '</ul>';
        } else { warn.hidden = true; warn.innerHTML = ''; }
        $('#fb-svg').disabled = $('#fb-copy').disabled = !r.count;

        if (!f.roll) { sum.innerHTML = ''; draw.innerHTML = '<p class="rk-hint">' + esc(t('fb.r.noroll')) + '</p>'; tot.innerHTML = ''; updateBar(); return; }
        if (!r.count) {
            sum.innerHTML = '';
            draw.innerHTML = '<p class="rk-hint">' + esc(t('fb.r.empty')) + '</p>';
            tot.innerHTML = totalHtml();
            updateBar(); return;
        }
        var tiles = [];
        tiles.push('<div class="rk-tile rk-tile--main"><b>' + meters(c.o.ordered) + ' ' + esc(t('fb.m')) + '</b><span>' + esc(t('fb.r.order')) + '</span></div>');
        tiles.push('<div class="rk-tile"><b>' + meters(c.o.base) + ' ' + esc(t('fb.m')) + '</b><span>' + esc(t('fb.r.layout')) + '</span></div>');
        if (f.reserve > 0) tiles.push('<div class="rk-tile"><b>' + meters(c.o.withReserve) + ' ' + esc(t('fb.m')) + '</b><span>' + esc(t('fb.r.reserve', { p: nf(f.reserve, 1) })) + '</span></div>');
        tiles.push('<div class="rk-tile"><b>' + nf(r.util * 100, 0) + ' %</b><span>' + esc(t('fb.r.util')) + '</span></div>');
        tiles.push('<div class="rk-tile"><b>' + nfg(r.count) + '</b><span>' + esc(t('fb.r.parts')) + '</span></div>');
        if (c.cost) tiles.push('<div class="rk-tile"><b>' + money(c.cost) + '</b><span>' + esc(t('fb.r.cost', { cur: state.cur })) + '</span></div>');
        sum.innerHTML = tiles.join('');

        var vertical = !!(mq && mq.matches);
        draw.innerHTML = '<div class="fb-roll"><div class="fb-roll-cap">' + esc(t('fb.roll', { w: nf(f.roll / F(), 1), u: uName(), l: meters(r.length / 1000) })) +
            ' · <span class="fb-lower">' + esc(t('fb.r.lower', { m: meters(r.lower / 1000) })) + '</span></div>' +
            '<div class="fb-draw' + (vertical ? ' is-v' : '') + '">' + buildSvg(f, c, false, vertical) + '</div></div>';
        tot.innerHTML = totalHtml();
        updateBar();
    }
    function totalHtml() {
        if (state.list.length < 2) return '';
        var rows = '', sum = 0, any = false;
        state.list.forEach(function (f) {
            var c = calc(f);
            if (c.cost) { sum += c.cost; any = true; }
            rows += '<tr><td>' + esc(label(f)) + '</td><td class="num">' + (c.r.count ? meters(c.o.ordered) : '—') + '</td><td class="num">' + (c.cost ? money(c.cost) : '—') + '</td></tr>';
        });
        if (any) rows += '<tr class="fb-total-row"><td colspan="2"><b>' + esc(t('fb.total.all')) + '</b></td><td class="num"><b>' + money(sum) + '</b></td></tr>';
        return '<h3 class="fb-total-h">' + esc(t('fb.total.title')) + '</h3><div class="rk-legend-wrap"><table class="rk-legend fb-total"><thead><tr><th>' + esc(t('fb.total.fabric')) + '</th><th class="num">' + esc(t('fb.total.m')) + '</th><th class="num">' + esc(t('fb.total.sum', { cur: state.cur })) + '</th></tr></thead><tbody>' + rows + '</tbody></table></div>';
    }
    function updateBar() {
        var f = active(), c = calc(f), box = $('#fb-bar-info');
        if (!box) return;
        box.innerHTML = '<span>' + esc(c.r.count ? t('fb.bar.fmt', { name: label(f), m: meters(c.o.ordered) }) : t('fb.bar.none')) + '</span>';
    }

    var calcTimer = 0;
    function changed(now) {
        save();
        clearTimeout(calcTimer);
        if (now) renderResult(); else calcTimer = setTimeout(renderResult, 140);
    }

    /* ---------- Кнопки результата ---------- */
    function saveBlob(name, blob) {
        var a = document.createElement('a');
        a.href = URL.createObjectURL(blob); a.download = name;
        document.body.appendChild(a); a.click();
        setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
    }
    $('#fb-svg').addEventListener('click', function () {
        var f = active(), c = calc(f);
        if (!c.r.count) return;
        var name = (t('fb.file') + '-' + label(f)).replace(/[\\/:*?"<>|\s]+/g, '-').slice(0, 80) + '.svg';
        saveBlob(name, new Blob(['<?xml version="1.0" encoding="UTF-8"?>\n' + buildSvg(f, c, true, false)], { type: 'image/svg+xml' }));
    });
    $('#fb-copy').addEventListener('click', function () {
        var text = summaryText();
        function ok() { toast(t('fb.copied')); }
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(ok, fallback);
        else fallback();
        function fallback() {
            var ta = document.createElement('textarea');
            ta.value = text; ta.setAttribute('readonly', ''); ta.style.cssText = 'position:fixed;left:-9999px;top:0';
            document.body.appendChild(ta); ta.select();
            try { document.execCommand('copy'); ok(); } catch (e) { /* не вышло */ }
            ta.remove();
        }
    });
    function toResult() { saveNow(); renderResult(); var h = document.getElementById('fb-h-res'); if (h) h.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
    $('#fb-go').addEventListener('click', toResult);
    $$('[data-run]').forEach(function (b) { b.addEventListener('click', function () { if (root.getAttribute('data-tool') === 'fabric') toResult(); }); });

    /* ---------- Копия работ ---------- */
    window.RKFabricApp = {
        exportState: function () { saveNow(); return JSON.parse(JSON.stringify(state)); },
        importState: function (obj) {
            if (!obj || !Array.isArray(obj.list)) return 0;
            var ids = {}, n = 0, added = 0;
            state.list.forEach(function (f) { ids[f.id] = 1; if (f.n > n) n = f.n; });
            obj.list.slice(0, 50).forEach(function (x) {
                var f = cleanFabric(x, ++n);
                if (!f) return;
                f.n = n;
                while (ids[f.id]) f.id = uid();
                ids[f.id] = 1; state.list.push(f); added++;
            });
            if (added) { saveNow(); renderAll(); }
            return added;
        }
    };

    /* ---------- Всё вместе ---------- */
    function applyTitle() { document.title = root.getAttribute('data-tool') === 'fabric' ? t('fb.title') : t('meta.title'); }
    function renderAll() { renderTabs(); renderSettings(); renderParts(); renderResult(); applyTitle(); }
    renderAll();

    document.addEventListener('rk:lang', function () {
        if (state.curAuto) state.cur = t('cur');
        renderAll();
    });
    document.addEventListener('rk:tool', function () { applyTitle(); renderResult(); });
    if (mq && mq.addEventListener) mq.addEventListener('change', renderResult);
    else if (mq && mq.addListener) mq.addListener(renderResult);
    window.addEventListener('storage', function (e) {
        if (e.key !== KEY) return;
        state = load(); cache = {}; renderAll();
    });
})();
