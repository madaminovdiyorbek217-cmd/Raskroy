/* Интерфейс онлайн-раскроя: материалы, детали, расчёт, карты листов, экспорт. */
(function () {
    'use strict';

    var VERSION = '31';
    var STORE_KEY = 'rk-project-v1';      /* старый ключ: одна работа, переносится в новый */
    var PROJ_KEY = 'rk-projects-v1';      /* все работы и номер активной */

    function $(s, r) { return (r || document).querySelector(s); }
    function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }

    var I = window.RKI18N;
    function t(key, vars) { return I.t(key, vars); }

    /* ---------- Данные ---------- */
    var PRESETS = {
        'ldsp-2800': { nk: 'mat.ldsp16', l: 2800, w: 2070, t: 16 },
        'ldsp-2750': { nk: 'mat.ldsp16', l: 2750, w: 1830, t: 16 },
        'hdf-2800': { nk: 'mat.hdf3', l: 2800, w: 2070, t: 3 },
        'hdf-2440': { nk: 'mat.hdf3', l: 2440, w: 1220, t: 3 },
        'mdf-2800': { nk: 'mat.mdf16', l: 2800, w: 1220, t: 16 },
        'ply-1525': { nk: 'mat.ply18', l: 1525, w: 1525, t: 18 },
        'custom': { nk: 'mat.new', l: 2500, w: 1250, t: 0 }
    };

    var uid = 1;
    function newMat(p) {
        return {
            id: 'm' + (uid++), name: p.nk ? t(p.nk) : p.name, l: p.l, w: p.w, price: p.price || 0, edgePrice: p.edgePrice || 0,
            t: p.t || 0, grain: p.grain !== false, fill: p.fill > 0 ? p.fill : 90, bySheets: p.bySheets !== false,
            round: ROUNDS.indexOf(p.round) >= 0 ? p.round : 'whole', opBasis: BASES.indexOf(p.opBasis) >= 0 ? p.opBasis : 'cut', opPrice: p.opPrice || 0
        };
    }
    var ROUNDS = ['whole', 'half', 'none'];
    var BASES = ['cut', 'perim', 'part', 'mat'];
    function defaultSettings() {
        return { kerf: 4, trim: 10, minOffcut: 300, minOffcut2: 300, minTrim: 5, mode: 'manual', dir: 'auto', texture: true, complex: true, minStrip: 0, maxStrip: 0, maxStripLen: 0, currency: t('cur') };
    }

    function exampleState() {
        var a = newMat(PRESETS['ldsp-2800']);
        var b = newMat(PRESETS['hdf-2800']);
        var P = function (name, l, w, qty, rot, e, mat) { return { name: name, mat: (mat || a).id, l: l, w: w, qty: qty, rotate: rot, e: e }; };
        return {
            settings: defaultSettings(),
            materials: [a, b],
            parts: [
                P(t('ex.side'), 2200, 550, 2, false, [1, 0, 0, 0]),
                P(t('ex.topbot'), 1164, 550, 2, true, [1, 0, 0, 0]),
                P(t('ex.divider'), 2168, 520, 1, false, [1, 0, 0, 0]),
                P(t('ex.shelf'), 1130, 520, 4, true, [1, 0, 0, 0]),
                P(t('ex.door'), 2100, 580, 3, false, [1, 1, 1, 1]),
                P(t('ex.plinth'), 1164, 100, 2, true, [0, 0, 0, 0]),
                P(t('ex.back'), 2150, 1190, 1, false, [0, 0, 0, 0], b)
            ]
        };
    }

    /* Стандартные названия (материалы, детали примера, валюта) переводятся вместе с интерфейсом;
       названия, которые пользователь написал сам, не трогаем. */
    var DEF_MATS = ['mat.ldsp16', 'mat.hdf3', 'mat.mdf16', 'mat.ply18', 'mat.new'];
    var DEF_PARTS = ['ex.side', 'ex.topbot', 'ex.divider', 'ex.shelf', 'ex.door', 'ex.plinth', 'ex.back'];
    function swapDefault(val, keys) {
        for (var i = 0; i < keys.length; i++) if (I.all(keys[i]).indexOf(val) >= 0) return t(keys[i]);
        return val;
    }
    function relocalize(st) {
        st.materials.forEach(function (m) { m.name = swapDefault(m.name, DEF_MATS); });
        st.parts.forEach(function (p) { p.name = swapDefault(p.name, DEF_PARTS); });
        st.settings.currency = swapDefault(st.settings.currency, ['cur']);
    }

    /* ---------- Работы: у каждой свои материалы, детали и настройки ---------- */
    function normalizeState(s) {
        if (!s || !Array.isArray(s.materials) || !Array.isArray(s.parts) || !s.materials.length) return null;
        var had2 = s.settings && s.settings.minOffcut2 != null;
        s.settings = Object.assign(defaultSettings(), s.settings || {});
        if (!had2) s.settings.minOffcut2 = s.settings.minOffcut;
        if (['auto', 'length', 'width'].indexOf(s.settings.dir) < 0) s.settings.dir = 'auto';
        s.settings.mode = s.settings.mode === 'auto' ? 'auto' : 'manual';
        s.settings.texture = s.settings.texture !== false;
        s.settings.complex = s.settings.complex !== false;
        s.materials = s.materials.map(function (m) {
            return {
                id: String(m.id || ('m' + (uid++))), name: String(m.name || ''), l: num(m.l), w: num(m.w), price: num(m.price), edgePrice: num(m.edgePrice),
                t: num(m.t), grain: m.grain !== false, fill: num(m.fill) > 0 ? Math.min(100, num(m.fill)) : 90, bySheets: m.bySheets !== false,
                round: ROUNDS.indexOf(m.round) >= 0 ? m.round : 'whole', opBasis: BASES.indexOf(m.opBasis) >= 0 ? m.opBasis : 'cut', opPrice: num(m.opPrice)
            };
        });
        s.materials.forEach(function (m) { var n = parseInt(String(m.id).replace(/\D/g, ''), 10); if (n >= uid) uid = n + 1; });
        s.parts = s.parts.map(function (p) {
            var q = {
                name: String(p.name || ''), mat: String(p.mat || s.materials[0].id),
                l: num(p.l), w: num(p.w), qty: Math.max(0, Math.floor(num(p.qty))),
                rotate: !!p.rotate, e: [0, 1, 2, 3].map(function (i) { return p.e && p.e[i] ? 1 : 0; })
            };
            if (p.fold) q.fold = 1;   /* деталь свёрнута в списке */
            return q;
        });
        return s;
    }

    function loadProjects() {
        var out = null;
        try {
            var raw = localStorage.getItem(PROJ_KEY);
            var o = raw && JSON.parse(raw);
            if (o && Array.isArray(o.list)) {
                var list = [], folders = [], fids = {};
                if (Array.isArray(o.folders)) o.folders.forEach(function (fo) {
                    if (!fo || !fo.id || fids[String(fo.id)]) return;
                    fids[String(fo.id)] = 1;
                    folders.push({ id: String(fo.id), name: String(fo.name || '').slice(0, 60), open: fo.open !== false });
                });
                o.list.forEach(function (it, i) {
                    var st = normalizeState(it && it.state);
                    if (st) list.push({ id: String(it.id || ('p' + (i + 1))), n: Math.max(1, Math.floor(Number(it.n) || (i + 1))), name: String(it.name || '').slice(0, 60), u: Number(it.u) || 0, f: fids[String(it.f)] ? String(it.f) : '', state: st });
                });
                if (list.length) out = { active: String(o.active || ''), list: list, folders: folders };
            }
            if (!out) {
                /* первая загрузка после обновления: прежняя единственная работа становится первой вкладкой */
                var old = localStorage.getItem(STORE_KEY);
                var st2 = old && normalizeState(JSON.parse(old));
                if (st2) out = { active: 'p1', folders: [], list: [{ id: 'p1', n: 1, name: '', f: '', state: st2 }] };
            }
        } catch (e) { out = null; }
        if (!out) out = { active: 'p1', folders: [], list: [{ id: 'p1', n: 1, name: '', f: '', state: exampleState() }] };
        if (!out.list.some(function (it) { return it.id === out.active; })) out.active = out.list[0].id;
        return out;
    }

    var projects = loadProjects();
    function activeItem() {
        for (var i = 0; i < projects.list.length; i++) if (projects.list[i].id === projects.active) return projects.list[i];
        return projects.list[0];
    }
    var state = activeItem().state;
    relocalize(state);

    var saveTimer;
    var sigs = {};   /* подпись состояния каждой работы, чтобы менять дату только при реальных правках */
    function saveNow() {
        clearTimeout(saveTimer);
        var cur = activeItem();
        cur.state = state;
        var sg = JSON.stringify(state);
        if (sigs[cur.id] !== undefined && sigs[cur.id] !== sg) cur.u = Date.now();
        sigs[cur.id] = sg;
        try { localStorage.setItem(PROJ_KEY, JSON.stringify(projects)); } catch (e) { /* хранилище недоступно, это не страшно */ }
    }
    function save() {
        clearTimeout(saveTimer);
        saveTimer = setTimeout(saveNow, 300);
    }
    window.addEventListener('pagehide', saveNow);

    /* ---------- Мелочи ---------- */
    function num(v) {
        var n = parseFloat(String(v == null ? '' : v).replace(',', '.').replace(/\s/g, ''));
        return isFinite(n) && n > 0 ? Math.round(n * 10) / 10 : 0;
    }
    function esc(s) {
        return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; });
    }
    function fmt(n, d) {
        return Number(n).toLocaleString(I.locale(), { minimumFractionDigits: 0, maximumFractionDigits: d == null ? 0 : d });
    }
    function mm2m2(v) { return v / 1e6; }
    /* размеры в миллиметрах без разделителя тысяч: 2800×2070 */
    function mmf(n) { return String(Math.round(n * 10) / 10).replace('.', I.decimal()); }
    function hue(row) { return (row * 53 + 205) % 360; }
    function el(tag, cls, attrs) {
        var e = document.createElement(tag);
        if (cls) e.className = cls;
        if (attrs) Object.keys(attrs).forEach(function (k) { e.setAttribute(k, attrs[k]); });
        return e;
    }
    function matById(id) { return state.materials.filter(function (m) { return m.id === id; })[0]; }

    /* ---------- Материалы ---------- */
    var matsBox = $('#rk-materials');

    function renderMaterials() {
        matsBox.innerHTML = '';
        state.materials.forEach(function (m, i) {
            var card = el('div', 'rk-mat');
            card.innerHTML =
                '<label class="rk-f"><span>' + esc(t('m.name')) + '</span><input class="rk-input" data-k="name" maxlength="60" autocomplete="off"></label>' +
                '<label class="rk-f"><span>' + esc(t('m.l')) + '</span><input class="rk-input" data-k="l" inputmode="decimal" autocomplete="off"></label>' +
                '<label class="rk-f"><span>' + esc(t('m.w')) + '</span><input class="rk-input" data-k="w" inputmode="decimal" autocomplete="off"></label>' +
                '<label class="rk-f"><span>' + esc(t('m.price', { cur: state.settings.currency })) + '</span><input class="rk-input" data-k="price" inputmode="decimal" autocomplete="off"></label>' +
                '<label class="rk-f"><span>' + esc(t('m.edgeprice', { cur: state.settings.currency })) + '</span><input class="rk-input" data-k="edgePrice" inputmode="decimal" autocomplete="off"></label>' +
                '<button type="button" class="rk-btn rk-btn--danger" data-del aria-label="' + esc(t('m.del.aria')) + '">' + esc(t('m.del')) + '</button>' +
                '<label class="rk-check rk-mat-grain"><input type="checkbox" data-kb="grain"><span>' + esc(t('m.grain')) + '</span></label>' +
                '<details class="rk-mat-adv"><summary>' + esc(t('m.adv')) + '</summary><div class="rk-mat-adv-grid">' +
                '<label class="rk-f"><span>' + esc(t('m.t')) + '</span><input class="rk-input" data-k="t" inputmode="decimal" autocomplete="off"></label>' +
                '<label class="rk-f"><span class="rk-lab"><span>' + esc(t('m.fill')) + '</span><i class="rk-help" tabindex="0" role="img" data-tip="' + esc(t('h.fill')) + '" aria-label="' + esc(t('h.fill')) + '">?</i></span><input class="rk-input" data-k="fill" inputmode="decimal" autocomplete="off"></label>' +
                '<label class="rk-check"><input type="checkbox" data-kb="bySheets"><span class="rk-lab"><span>' + esc(t('m.bysheets')) + '</span><i class="rk-help" tabindex="0" role="img" data-tip="' + esc(t('h.bysheets')) + '" aria-label="' + esc(t('h.bysheets')) + '">?</i></span></label>' +
                '<label class="rk-f"><span>' + esc(t('m.round')) + '</span><select class="rk-input" data-ks="round">' + ROUNDS.map(function (v) { return '<option value="' + v + '">' + esc(t('m.round.' + (v === 'whole' ? 'whole' : v === 'half' ? 'half' : 'none'))) + '</option>'; }).join('') + '</select></label>' +
                '<label class="rk-f"><span>' + esc(t('m.opbasis')) + '</span><select class="rk-input" data-ks="opBasis">' + BASES.map(function (v) { return '<option value="' + v + '">' + esc(t('m.opb.' + v)) + '</option>'; }).join('') + '</select></label>' +
                '<label class="rk-f"><span data-opl></span><input class="rk-input" data-k="opPrice" inputmode="decimal" autocomplete="off"></label>' +
                '<div class="rk-mat-calc" title="' + esc(t('m.c.hint')) + '">' +
                '<label class="rk-f"><span>' + esc(t('m.c.qtymat')) + '</span><output class="rk-input rk-ro" data-c="qtyMat">—</output></label>' +
                '<label class="rk-f"><span>' + esc(t('m.c.sheets')) + '</span><output class="rk-input rk-ro" data-c="sheets">—</output></label>' +
                '<label class="rk-f"><span>' + esc(t('m.c.matcost', { cur: state.settings.currency })) + '</span><output class="rk-input rk-ro" data-c="matCost">—</output></label>' +
                '<label class="rk-f"><span>' + esc(t('m.c.opcost', { cur: state.settings.currency })) + '</span><output class="rk-input rk-ro" data-c="opCost">—</output></label>' +
                '</div></div></details>';
            card.setAttribute('data-mid', m.id);
            var opl = $('[data-opl]', card);
            function opLabel() { opl.textContent = t(m.opBasis === 'part' || m.opBasis === 'mat' ? 'm.opprice.m2' : 'm.opprice.m', { cur: state.settings.currency }); }
            opLabel();
            $$('select[data-ks]', card).forEach(function (sel) {
                var k = sel.getAttribute('data-ks');
                sel.value = m[k];
                sel.addEventListener('change', function () { m[k] = sel.value; if (k === 'opBasis') opLabel(); changed(); });
            });
            $$('input[data-kb]', card).forEach(function (cb) {
                var k = cb.getAttribute('data-kb');
                cb.checked = m[k] !== false;
                cb.addEventListener('change', function () { m[k] = cb.checked; if (k === 'grain') syncGrain(); changed(); });
            });
            $$('input[data-k]', card).forEach(function (inp) {
                var k = inp.getAttribute('data-k');
                inp.value = k === 'name' ? m.name : (m[k] ? m[k] : '');
                inp.addEventListener('input', function () {
                    if (k === 'name') m.name = inp.value;
                    else { m[k] = num(inp.value); if (k === 'fill' && m[k] > 100) m[k] = 100; inp.classList.toggle('is-bad', (k === 'l' || k === 'w') && !m[k]); }
                    if (k === 'name') refreshMatOptions();
                    changed();
                });
                inp.addEventListener('blur', function () { if (k !== 'name') inp.value = m[k] ? m[k] : ''; });
            });
            var del = $('[data-del]', card);
            del.disabled = state.materials.length < 2;
            del.addEventListener('click', function () {
                if (state.materials.length < 2) return;
                var used = state.parts.filter(function (p) { return p.mat === m.id; }).length;
                RKDialog.ask(used, t('m.delconfirm', { name: m.name, n: used }), { ok: t('d.delete'), danger: true }, function () {
                    state.parts = state.parts.filter(function (p) { return p.mat !== m.id; });
                    state.materials.splice(i, 1);
                    renderMaterials(); renderParts(); changed();
                });
            });
            matsBox.appendChild(card);
        });
        refreshMatOptions();
        updateMatCalc(lastResult);
        syncGrain();
    }

    /* настройки текстуры и сложных полос действуют только для материалов с отметкой «Лист с текстурой» */
    function syncGrain() {
        var box = $('#rk-grain'), note = $('#rk-grain-note');
        if (!box) return;
        var any = state.materials.some(function (m) { return m.grain !== false; });
        box.disabled = !any;
        box.classList.toggle('is-off', !any);
        if (note) note.textContent = t(any ? 's.grain.on' : 's.grain.off');
    }

    /* расчётные поля в карточке материала (как в GibLab): заполняются по результату раскроя */
    function updateMatCalc(list) {
        $$('.rk-mat[data-mid]').forEach(function (card) {
            var id = card.getAttribute('data-mid'), m = matById(id);
            var r = list && list.filter(function (x) { return x.mat.id === id; })[0];
            function put(k, v) { var o = $('[data-c="' + k + '"]', card); if (o) o.textContent = v; }
            if (!m || !r) { put('qtyMat', '—'); put('sheets', '—'); put('matCost', '—'); put('opCost', '—'); return; }
            var mc = matCost(m, r.res.stats);
            put('qtyMat', fmt(mc.qtyArea, 2));
            put('sheets', fmt(r.res.stats.sheets, 0));
            put('matCost', m.price ? fmt(mc.mat) : '—');
            put('opCost', m.opPrice ? fmt(mc.op) : '—');
        });
    }

    function matOptionsHtml() {
        return state.materials.map(function (m) {
            return '<option value="' + esc(m.id) + '">' + esc(m.name || t('m.noname')) + ' · ' + mmf(m.l) + '×' + mmf(m.w) + '</option>';
        }).join('');
    }
    function refreshMatOptions() {
        var html = matOptionsHtml();
        $$('select[data-mat]').forEach(function (sel) {
            var cur = sel.value;
            sel.innerHTML = html;
            sel.value = matById(cur) ? cur : state.materials[0].id;
        });
        var ps = $('#rk-paste-mat');
        var cur2 = ps.value;
        ps.innerHTML = html;
        ps.value = matById(cur2) ? cur2 : state.materials[0].id;
    }

    $('#rk-add-mat').addEventListener('click', function () {
        var p = PRESETS[$('#rk-preset').value] || PRESETS.custom;
        state.materials.push(newMat(p));
        renderMaterials(); renderParts(); changed();
        var cards = $$('.rk-mat'); var last = cards[cards.length - 1];
        if (last) last.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    });

    /* ---------- Настройки ---------- */
    var S = {
        kerf: $('#s-kerf'), trim: $('#s-trim'), minOffcut: $('#s-off'), minOffcut2: $('#s-off2'), minTrim: $('#s-mintrim'),
        minStrip: $('#s-minstrip'), maxStrip: $('#s-maxstrip'), maxStripLen: $('#s-maxlen'), currency: $('#s-cur'),
        dir: $('#s-dir'), texture: $('#s-tex'), complex: $('#s-cplx')
    };
    var NUMS = ['kerf', 'trim', 'minOffcut', 'minOffcut2', 'minTrim', 'minStrip', 'maxStrip', 'maxStripLen'];
    var ZERO_EMPTY = { minStrip: 1, maxStrip: 1, maxStripLen: 1 };
    function renderSettings() {
        NUMS.forEach(function (k) {
            var v = state.settings[k];
            S[k].value = ZERO_EMPTY[k] && !v ? '' : v;
        });
        S.currency.value = state.settings.currency;
        S.dir.value = state.settings.dir;
        applyMode();
        S.texture.checked = state.settings.texture !== false;
        S.complex.checked = state.settings.complex !== false;
    }
    NUMS.forEach(function (k) {
        S[k].addEventListener('input', function () {
            var v = parseFloat(String(S[k].value).replace(',', '.'));
            state.settings[k] = isFinite(v) && v >= 0 ? v : 0;
            changed();
        });
    });
    /* Ручной подбор / Авто подбор */
    var amBtns = $$('[data-am]');
    function applyMode() {
        var auto = state.settings.mode === 'auto';
        amBtns.forEach(function (b) { b.setAttribute('aria-checked', String(b.getAttribute('data-am') === (auto ? 'auto' : 'manual'))); });
        var note = $('#rk-modenote');
        if (note) note.textContent = t(auto ? 'am.note.auto' : 'am.note.manual');
        var lab = S.dir.closest ? S.dir.closest('label') : null;
        if (lab) lab.hidden = auto;
        if (window.RKSelect && RKSelect.refresh) { try { RKSelect.refresh(); } catch (e) { /* не страшно */ } }
    }
    amBtns.forEach(function (b) {
        b.addEventListener('click', function () {
            var m = b.getAttribute('data-am') === 'auto' ? 'auto' : 'manual';
            if (state.settings.mode === m) return;
            state.settings.mode = m; applyMode(); changed(true);
        });
    });
    S.dir.addEventListener('change', function () { state.settings.dir = S.dir.value; changed(); });
    S.texture.addEventListener('change', function () { state.settings.texture = S.texture.checked; changed(); });
    S.complex.addEventListener('change', function () { state.settings.complex = S.complex.checked; changed(); });
    S.currency.addEventListener('input', function () { state.settings.currency = S.currency.value.trim() || t('cur'); changed(); });
    S.currency.addEventListener('change', function () { renderMaterials(); });

    /* ---------- Детали ---------- */
    var partsBox = $('#rk-parts');

    function edgeNames() {
        return [t('e.0'), t('e.1'), t('e.2'), t('e.3')];
    }

    var COLS = ['name', 'l', 'w', 'qty'];

    function focusCell(row, col) {
        var r = partsBox.children[row];
        if (r && r.classList.contains('is-folded')) { var pi = state.parts[row]; setRowFold(r, pi, row, false, true); }
        var c = r && $('[data-col="' + col + '"]', r);
        if (c) { c.focus(); return true; }
        return false;
    }

    /* Enter: следующее поле строки, после «Штук» — следующая деталь (в конце списка создаёт новую).
       Стрелки вверх/вниз: то же поле в соседней строке. */
    function cellKey(e, i, k) {
        if (e.isComposing) return;
        var ci = COLS.indexOf(k);
        if (e.key === 'Enter') {
            e.preventDefault();
            if (e.shiftKey) {
                if (ci > 0) focusCell(i, COLS[ci - 1]); else if (i > 0) focusCell(i - 1, 'qty');
            } else if (ci < COLS.length - 1) focusCell(i, COLS[ci + 1]);
            else if (i < state.parts.length - 1) focusCell(i + 1, 'name');
            else addPart(true);
        } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
            e.preventDefault();
            var ni = i + (e.key === 'ArrowDown' ? 1 : -1);
            if (ni >= 0 && ni < state.parts.length) focusCell(ni, k);
        }
    }

    /* Вставка из Excel или таблицы: несколько строк заполняют детали, начиная с текущей, лишние строки добавляются */
    function cellPaste(e, i, k) {
        var cd = e.clipboardData || window.clipboardData;
        if (!cd) return;
        var text = String(cd.getData('text') || '').replace(/[\r\n]+$/, '');
        if (!/[\r\n\t]/.test(text)) return;
        e.preventDefault();
        var lines = text.split(/\r?\n/).filter(function (l) { return l.trim(); });
        var single = lines.every(function (l) { return l.indexOf('\t') < 0; });
        var filled = 0;
        lines.forEach(function (line, n) {
            var data;
            if (single) {
                data = {};
                if (k === 'name') data.name = line.trim();
                else data[k] = k === 'qty' ? Math.floor(num(line)) : num(line);
            } else {
                data = parseLine(line);
                if (!data) return;
            }
            var part = state.parts[i + n];
            if (!part) { part = blankPart(); state.parts.push(part); }
            Object.keys(data).forEach(function (f) { part[f] = data[f]; });
            filled++;
        });
        if (filled) { renderParts(); changed(true); }
    }

    function blankPart() {
        var last = state.parts[state.parts.length - 1];
        return { name: '', mat: last ? last.mat : state.materials[0].id, l: 0, w: 0, qty: 1, rotate: last ? last.rotate : true, e: [0, 0, 0, 0] };
    }

    function partRow(p, i) {
        var row = el('div', 'rk-row');
        row.style.setProperty('--h', hue(i));

        var foldable = state.parts.length > FOLD_MIN;
        var chip = el(foldable ? 'button' : 'span', 'rk-chip' + (foldable ? ' rk-chip--btn' : '')); chip.textContent = i + 1;
        if (foldable) { chip.type = 'button'; chip.addEventListener('click', function () { setRowFold(row, p, i, !row.classList.contains('is-folded')); }); }
        else chip.setAttribute('aria-hidden', 'true');
        row.appendChild(chip);

        function field(cls, label, input) {
            var f = el('label', 'rk-f ' + cls);
            var s = el('span'); s.textContent = label;
            f.appendChild(s); f.appendChild(input);
            return f;
        }
        function textInput(k, attrs) {
            var inp = el('input', 'rk-input', Object.assign({ autocomplete: 'off', 'data-col': k }, attrs || {}));
            inp.value = k === 'name' ? p.name : (p[k] ? p[k] : '');
            inp.addEventListener('input', function () {
                if (k === 'name') p.name = inp.value;
                else {
                    p[k] = k === 'qty' ? Math.floor(num(inp.value)) : num(inp.value);
                    inp.classList.toggle('is-bad', !p[k]);
                }
                changed();
            });
            inp.addEventListener('blur', function () { if (k !== 'name') inp.value = p[k] ? p[k] : ''; });
            inp.addEventListener('focus', function () {
                if (k === 'name') return;
                var v0 = inp.value;
                try { inp.select(); } catch (err) { /* не страшно */ }
                /* после клика мышью выделение снимается, возвращаем его, если ничего не успели ввести */
                setTimeout(function () { if (document.activeElement === inp && inp.value === v0) { try { inp.select(); } catch (err) { /* не страшно */ } } }, 0);
            });
            inp.addEventListener('keydown', function (ev) { cellKey(ev, i, k); });
            inp.addEventListener('paste', function (ev) { cellPaste(ev, i, k); });
            return inp;
        }
        var name = textInput('name', { maxlength: '60', 'aria-label': t('p.name.aria', { n: i + 1 }) });
        row.appendChild(field('rk-f--name', t('p.name'), name));

        var sel = el('select', 'rk-input', { 'data-mat': '1', 'aria-label': t('p.mat.aria', { n: i + 1 }) });
        sel.innerHTML = matOptionsHtml();
        sel.value = matById(p.mat) ? p.mat : state.materials[0].id;
        p.mat = sel.value;
        sel.addEventListener('change', function () { p.mat = sel.value; changed(); });
        row.appendChild(field('rk-f--mat', t('p.mat'), sel));

        var L = textInput('l', { inputmode: 'decimal', 'aria-label': t('p.l.aria', { n: i + 1 }) });
        var W = textInput('w', { inputmode: 'decimal', 'aria-label': t('p.w.aria', { n: i + 1 }) });
        var Q = textInput('qty', { inputmode: 'numeric', 'aria-label': t('p.q.aria', { n: i + 1 }) });
        if (!p.l) L.classList.add('is-bad'); if (!p.w) W.classList.add('is-bad'); if (!p.qty) Q.classList.add('is-bad');
        row.appendChild(field('rk-f--l', t('p.l'), L));
        row.appendChild(field('rk-f--w', t('p.w'), W));
        row.appendChild(field('rk-f--q', t('p.q'), Q));

        var tools = el('div', 'rk-tools');
        var edge = el('div', 'rk-edge', { role: 'group', 'aria-label': t('p.edge.aria', { n: i + 1 }) });
        ['t', 'b', 'l', 'r'].forEach(function (c, k) {
            var b = el('button', 'rk-e rk-e-' + c, { type: 'button', 'aria-pressed': p.e[k] ? 'true' : 'false', 'aria-label': edgeNames()[k] });
            b.addEventListener('click', function () {
                p.e[k] = p.e[k] ? 0 : 1;
                b.setAttribute('aria-pressed', p.e[k] ? 'true' : 'false');
                changed();
            });
            edge.appendChild(b);
        });
        tools.appendChild(edge);

        var rot = el('button', 'rk-rot', { type: 'button', 'aria-pressed': p.rotate ? 'true' : 'false', 'aria-label': t('p.rot.aria') });
        rot.textContent = '↻';
        rot.addEventListener('click', function () {
            p.rotate = !p.rotate;
            rot.setAttribute('aria-pressed', p.rotate ? 'true' : 'false');
            changed();
        });
        tools.appendChild(rot);

        var dup = el('button', 'rk-dup', { type: 'button', 'aria-label': t('p.dup.aria', { n: i + 1 }) });
        dup.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V6a2 2 0 0 1 2-2h9"/></svg>';
        dup.addEventListener('click', function () {
            state.parts.splice(i + 1, 0, JSON.parse(JSON.stringify(p)));
            renderParts(); changed(true);
            focusCell(i + 1, 'name');
        });
        tools.appendChild(dup);

        var del = el('button', 'rk-del', { type: 'button', 'aria-label': t('p.del.aria', { n: i + 1 }) });
        del.textContent = '×';
        del.addEventListener('click', function () {
            state.parts.splice(i, 1);
            renderParts(); changed();
        });
        tools.appendChild(del);
        row.appendChild(tools);

        if (foldable && p.fold) setRowFold(row, p, i, true, true);
        else if (foldable) foldLabel(row, i, false);
        return row;
    }

    /* ---------- Сворачивание деталей (когда их больше 10) ---------- */
    var FOLD_MIN = 10;
    function foldLabel(row, i, on) {
        var chip = row.firstChild;
        if (!chip || chip.tagName !== 'BUTTON') return;
        var txt = t(on ? 'f.unfold' : 'f.fold', { n: i + 1 });
        chip.setAttribute('aria-label', txt); chip.title = txt;
        chip.setAttribute('aria-expanded', on ? 'false' : 'true');
    }
    function sumNode(row, p, i) {
        var b = el('button', 'rk-sum', { type: 'button', 'aria-label': t('f.unfold', { n: i + 1 }), 'aria-expanded': 'false' });
        var m = matById(p.mat);
        var bad = !p.l || !p.w || !p.qty;
        if (bad) b.classList.add('is-bad');
        var n = el('span', 'rk-sum-n'); n.textContent = p.name || t('p.name');
        var d = el('span', 'rk-sum-d'); d.textContent = (p.l ? mmf(p.l) : '?') + ' × ' + (p.w ? mmf(p.w) : '?') + ' · ' + (p.qty || 0) + ' ' + t('f.pcs');
        var mt = el('span', 'rk-sum-m'); mt.textContent = m ? m.name : '';
        b.appendChild(n); b.appendChild(d); b.appendChild(mt); b.appendChild(el('i', 'rk-sum-chev'));
        b.addEventListener('click', function () { setRowFold(row, p, i, false); });
        return b;
    }
    function setRowFold(row, p, i, on, quiet) {
        var old = row.querySelector(':scope > .rk-sum'); if (old) old.remove();
        row.classList.toggle('is-folded', on);
        if (on) { p.fold = 1; row.appendChild(sumNode(row, p, i)); }
        else delete p.fold;
        foldLabel(row, i, on);
        if (!quiet) changed();
        if (!on && !quiet) { var c = row.querySelector('[data-col="name"]'); if (c && !row.classList.contains('is-folded') && document.activeElement === document.body) { try { c.focus({ preventScroll: true }); } catch (e) { /* не страшно */ } } }
    }
    function updateFoldBar() {
        var bar = $('#rk-foldbar'), n = state.parts.length;
        bar.hidden = n <= FOLD_MIN;
        if (n > FOLD_MIN) $('#rk-foldbar-n').textContent = t('f.count', { n: n });
    }
    function foldAll(on) {
        state.parts.forEach(function (p) { if (on) p.fold = 1; else delete p.fold; });
        renderParts(); changed();
    }
    $('#rk-fold-all').addEventListener('click', function () { foldAll(true); });
    $('#rk-unfold-all').addEventListener('click', function () { foldAll(false); });

    function renderParts() {
        partsBox.innerHTML = '';
        state.parts.forEach(function (p, i) { partsBox.appendChild(partRow(p, i)); });
        $('#rk-parts-wrap').hidden = state.parts.length === 0;
        updateFoldBar();
    }

    function addPart(focus) {
        state.parts.push(blankPart());
        renderParts(); changed();
        if (focus) focusCell(state.parts.length - 1, 'name');
    }
    $('#rk-add-part').addEventListener('click', function () { addPart(true); });

    $('#rk-example').addEventListener('click', function () {
        RKDialog.ask(state.parts.length, t('c.example'), { ok: t('d.replace') }, function () {
            state = exampleState();
            renderAll(); changed(true);
        });
    });

    $('#rk-clear').addEventListener('click', function () {
        RKDialog.ask(state.parts.length, t('c.clear'), { ok: t('d.delete'), danger: true }, function () {
            state.parts = [];
            renderParts(); changed(true);
        });
    });

    /* Разбор строки «название 2200 550 2» (числа: длина, ширина, штук) */
    function parseLine(line) {
        line = String(line).trim();
        if (!line) return null;
        var nums = line.match(/\d+(?:[.,]\d+)?/g) || [];
        if (nums.length < 2) return null;
        var name = line.replace(/\d+(?:[.,]\d+)?/g, ' ').replace(/[x×*;:|,\t]+/gi, ' ').replace(/\s+/g, ' ').trim();
        var l = num(nums[0]), w = num(nums[1]), q = nums[2] ? Math.max(1, Math.floor(num(nums[2]))) : 1;
        if (!l || !w) return null;
        return { name: name, l: l, w: w, qty: q };
    }

    /* Вставка списка текстом */
    var pasteBox = $('#rk-paste');
    $('#rk-paste-toggle').addEventListener('click', function () {
        pasteBox.hidden = !pasteBox.hidden;
        this.setAttribute('aria-expanded', String(!pasteBox.hidden));
        if (!pasteBox.hidden) $('#rk-paste-text').focus();
    });
    $('#rk-paste-go').addEventListener('click', function () {
        var text = $('#rk-paste-text').value;
        var mat = $('#rk-paste-mat').value;
        var added = 0, skipped = 0;
        text.split(/\r?\n/).forEach(function (line) {
            if (!line.trim()) return;
            var r = parseLine(line);
            if (!r) { skipped++; return; }
            state.parts.push({ name: r.name, mat: mat, l: r.l, w: r.w, qty: r.qty, rotate: true, e: [0, 0, 0, 0] });
            added++;
        });
        $('#rk-paste-note').textContent = added ? t('paste.added', { a: added }) + (skipped ? t('paste.skipped', { s: skipped }) : '') : t('paste.none');
        if (added) { $('#rk-paste-text').value = ''; renderParts(); changed(true); }
    });

    /* ---------- Расчёт ---------- */
    var pool = [], workerFailed = false, reqId = 0, callbacks = {};
    var MAXW = Math.max(1, Math.min(4, (navigator.hardwareConcurrency || 2) - 1));
    function spawn() {
        if (workerFailed || typeof Worker === 'undefined') return null;
        try {
            var w = new Worker('./js/raskroy-worker.js?v=' + VERSION);
            w.busy = 0;
            w.onmessage = function (e) {
                var cb = callbacks[e.data.id]; delete callbacks[e.data.id];
                w.busy = Math.max(0, w.busy - 1);
                if (cb) cb(e.data.error ? null : e.data.res, e.data.error);
            };
            w.onerror = function () {
                workerFailed = true;
                pool.forEach(function (x) { try { x.terminate(); } catch (er) { /* не страшно */ } });
                pool = [];
                var pend = callbacks; callbacks = {};
                Object.keys(pend).forEach(function (k) { pend[k](null, 'worker'); });
            };
            pool.push(w);
            return w;
        } catch (err) { workerFailed = true; return null; }
    }
    function getWorker() {
        if (workerFailed) return null;
        var free = null;
        pool.forEach(function (w) { if (!free || w.busy < free.busy) free = w; });
        if (free && free.busy === 0) return free;
        if (pool.length < MAXW) { var n = spawn(); if (n) return n; }
        return free || spawn();
    }
    function solve(cfg, cb) {
        var w = getWorker();
        if (w) {
            var id = ++reqId; callbacks[id] = function (res, err) {
                if (res) cb(res); else cb(syncSolve(cfg));
            };
            w.busy++;
            w.postMessage({ id: id, cfg: cfg });
        } else cb(syncSolve(cfg));
    }
    function syncSolve(cfg) { return window.Raskroy.optimize(cfg); }


    /* ---------- Авто подбор: несколько вариантов, остаётся лучший ---------- */
    var AUTO_VARIANTS = [
        { dir: 'auto', seed: 777 }, { dir: 'length', seed: 777 }, { dir: 'width', seed: 777 },
        { dir: 'auto', seed: 2024 }, { dir: 'length', seed: 31337 }, { dir: 'width', seed: 31337 },
        { dir: 'auto', seed: 90210 }, { dir: 'length', seed: 4242 }, { dir: 'width', seed: 4242 }
    ];
    function maxFreeArea(res) {
        var m = 0;
        res.sheets.forEach(function (sh) { sh.free.forEach(function (f) { if (f.w * f.h > m) m = f.w * f.h; }); });
        return m;
    }
    /* меньше число — лучше: сначала нераспределённые, затем листы, затем крупнее деловой остаток, затем короче рез */
    function resScore(res) {
        return res.unplaced.length * 1e16 + res.stats.sheets * 1e13 - maxFreeArea(res) + res.stats.cuts * 0.01;
    }
    function solveJob(j, cb) {
        var cfg = j.cfg;
        if (!cfg.auto) { solve(cfg, cb); return; }
        var n = AUTO_VARIANTS.length, got = new Array(n), left = n;
        var per = Math.max(200, Math.round(cfg.timeMs * 0.6));
        AUTO_VARIANTS.forEach(function (v, i) {
            solve(Object.assign({}, cfg, { dir: v.dir, seed: v.seed, timeMs: per }), function (res) {
                got[i] = res;
                if (--left) return;
                var best = 0, worst = 0;
                got.forEach(function (r, k) {
                    if (resScore(r) < resScore(got[best])) best = k;
                    if (resScore(r) > resScore(got[worst])) worst = k;
                });
                var res = got[best];
                res.auto = {
                    tried: n, dir: AUTO_VARIANTS[best].dir, variant: best,
                    worstSheets: got[worst].stats.sheets, worstUtil: got[worst].stats.util, bestSheets: res.stats.sheets, bestUtil: res.stats.util
                };
                cb(res);
            });
        });
    }

    var runToken = 0, lastResult = null, lastResultSig = '', timer;

    function jobs(timeMs, st) {
        st = st || state;
        var list = [];
        st.materials.forEach(function (m) {
            var parts = [];
            st.parts.forEach(function (p, i) {
                if (p.mat !== m.id || !p.l || !p.w || !p.qty) return;
                parts.push({ id: i + 1, name: p.name, l: p.l, w: p.w, qty: p.qty, rotate: p.rotate, edges: p.e.slice() });
            });
            if (!parts.length || !m.l || !m.w) return;
            list.push({
                mat: m,
                cfg: {
                    sheet: { l: m.l, w: m.w, trim: st.settings.trim },
                    kerf: st.settings.kerf, parts: parts, minOffcut: st.settings.minOffcut, minOffcut2: st.settings.minOffcut2, timeMs: timeMs, seed: 777,
                    auto: st.settings.mode === 'auto', texture: m.grain !== false ? st.settings.texture : false, dir: st.settings.mode === 'auto' ? 'auto' : st.settings.dir, complex: m.grain !== false ? st.settings.complex : true, minStrip: st.settings.minStrip,
                    maxStrip: st.settings.maxStrip, maxStripLen: st.settings.maxStripLen, minTrim: st.settings.minTrim
                }
            });
        });
        return list;
    }

    function run(timeMs) {
        var token = ++runToken;
        var list = jobs(timeMs);
        var sigAtRun = JSON.stringify(state);
        updateBar();
        if (!list.length) {
            lastResult = []; lastResultSig = sigAtRun;
            renderResults([]);
            return;
        }
        var out = [], left = list.length;
        list.forEach(function (j, idx) {
            solveJob(j, function (res) {
                if (token !== runToken) return;
                out[idx] = { mat: j.mat, res: res, cfg: j.cfg };
                if (--left === 0) { lastResult = out; lastResultSig = sigAtRun; renderResults(out); }
            });
        });
    }

    function changed(now) {
        save();
        updateBar();
        clearTimeout(timer);
        if (now) run(350);
        else timer = setTimeout(function () { run(250); }, 450);
    }

    $$('[data-run], #rk-run').forEach(function (b) { b.addEventListener('click', function () { if (document.documentElement.getAttribute('data-tool') === 'fabric') return; clearTimeout(timer); run(1200); }); });

    /* ---------- Нижняя панель ---------- */
    function updateBar() {
        var pcs = 0, area = 0;
        state.parts.forEach(function (p) {
            if (!matById(p.mat) || !p.l || !p.w || !p.qty) return;
            area += p.l * p.w * p.qty; pcs += p.qty;
        });
        $('#rk-bar-info').innerHTML = pcs ? '<span>' + t('bar.parts', { n: fmt(pcs) }) + '</span><span class="rk-bar-sep"> · </span><span>' + t('bar.area', { a: fmt(mm2m2(area), 2) }) + '</span>' : '';
    }

    /* ---------- Карта листа (SVG) ---------- */
    var PAL_PAGE = {
        sheet: 'var(--rk-sheet)', hatch: 'var(--rk-hatch)', ink: 'var(--rk-ink)', stroke: 'var(--rk-pstroke)', edge: 'var(--rk-edge)', dim: 'var(--rk-dim)',
        fill: function (id) { return 'hsl(' + hue(id - 1) + ' 45% var(--rk-pl))'; },
        line: function (id) { return 'hsl(' + hue(id - 1) + ' 60% var(--rk-pb))'; },
        label: function (id) { return 'hsl(' + hue(id - 1) + ' 60% var(--rk-pt))'; }
    };
    var PAL_FILE = {
        sheet: '#ffffff', hatch: '#bdbdb8', ink: '#151515', stroke: '#3a3a3a', edge: '#000000', dim: '#0d6b7a',
        fill: function (id) { return 'hsl(' + hue(id - 1) + ' 55% 86%)'; },
        line: function (id) { return 'hsl(' + hue(id - 1) + ' 45% 34%)'; },
        label: function () { return '#151515'; }
    };

    function sheetSvg(sheet, mat, pal, cls, uniq, trim) {
        var L = mat.l, W = mat.w, t = trim != null ? trim : state.settings.trim;
        var h = [];
        var pid = 'rkh' + uniq;
        var m = Math.round(Math.max(L, W) * 0.05), pad = Math.round(Math.max(L, W) * 0.008);
        h.push('<svg xmlns="http://www.w3.org/2000/svg" class="' + cls + '" viewBox="' + (-m) + ' ' + (-m) + ' ' + (L + m + pad) + ' ' + (W + m + pad) + '" role="img" aria-label="' + esc(I.t('svg.aria', { i: sheet.index })) + '" style="font-family:\'JetBrains Mono\',ui-monospace,Menlo,Consolas,monospace">');
        h.push('<defs><pattern id="' + pid + '" width="60" height="60" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="60" style="stroke:' + pal.hatch + ';stroke-width:14"/></pattern></defs>');
        h.push('<rect x="0" y="0" width="' + L + '" height="' + W + '" style="fill:' + pal.sheet + ';stroke:' + pal.stroke + ';stroke-width:1.5px" vector-effect="non-scaling-stroke"/>');
        h.push('<rect x="0" y="0" width="' + L + '" height="' + W + '" style="fill:url(#' + pid + ');opacity:.55"/>');
        if (t > 0 && t * 2 < Math.min(L, W)) h.push('<rect x="' + t + '" y="' + t + '" width="' + (L - 2 * t) + '" height="' + (W - 2 * t) + '" style="fill:none;stroke:' + pal.stroke + ';stroke-width:1px;stroke-dasharray:3 6;opacity:.45" vector-effect="non-scaling-stroke"/>');

        /* размеры листа: сверху длина, слева ширина */
        var dl = 'stroke:' + pal.dim + ';stroke-width:1px', fsD = (m * 0.4).toFixed(0), tk = m * 0.11;
        h.push('<g style="' + dl + ';fill:none" vector-effect="non-scaling-stroke">' +
            '<path d="M0 ' + (-m * 0.1) + 'V' + (-m * 0.62) + 'M' + L + ' ' + (-m * 0.1) + 'V' + (-m * 0.62) + 'M0 ' + (-m * 0.45) + 'H' + L + 'M' + (-tk) + ' ' + (-m * 0.45 + tk) + 'L' + tk + ' ' + (-m * 0.45 - tk) + 'M' + (L - tk) + ' ' + (-m * 0.45 + tk) + 'L' + (L + tk) + ' ' + (-m * 0.45 - tk) + '" vector-effect="non-scaling-stroke"/>' +
            '<path d="M' + (-m * 0.1) + ' 0H' + (-m * 0.62) + 'M' + (-m * 0.1) + ' ' + W + 'H' + (-m * 0.62) + 'M' + (-m * 0.45) + ' 0V' + W + 'M' + (-m * 0.45 - tk) + ' ' + tk + 'L' + (-m * 0.45 + tk) + ' ' + (-tk) + 'M' + (-m * 0.45 - tk) + ' ' + (W + tk) + 'L' + (-m * 0.45 + tk) + ' ' + (W - tk) + '" vector-effect="non-scaling-stroke"/></g>');
        h.push('<text x="' + (L / 2) + '" y="' + (-m * 0.56) + '" text-anchor="middle" style="fill:' + pal.dim + ';font-size:' + fsD + 'px">' + mmf(L) + '</text>');
        h.push('<text transform="translate(' + (-m * 0.56) + ' ' + (W / 2) + ') rotate(-90)" text-anchor="middle" style="fill:' + pal.dim + ';font-size:' + fsD + 'px">' + mmf(W) + '</text>');

        /* деловые остатки */
        sheet.free.forEach(function (f) {
            h.push('<rect x="' + f.x + '" y="' + f.y + '" width="' + f.w + '" height="' + f.h + '" style="fill:' + pal.sheet + ';stroke:' + pal.stroke + ';stroke-width:1px;stroke-dasharray:6 5;opacity:.95" vector-effect="non-scaling-stroke"/>');
            var fs = Math.min(f.h * 0.16, f.w * 0.09, 60);
            if (fs >= 18) h.push('<text x="' + (f.x + f.w / 2) + '" y="' + (f.y + f.h / 2) + '" text-anchor="middle" dominant-baseline="central" style="fill:' + pal.ink + ';opacity:.6;font-size:' + fs.toFixed(0) + 'px">' + esc(I.t('svg.offcut')) + ' ' + mmf(f.w) + '×' + mmf(f.h) + '</text>');
        });

        sheet.pieces.forEach(function (p) {
            var title = '№' + p.id + (p.name ? ' ' + esc(p.name) : '') + ': ' + mmf(p.l) + '×' + mmf(p.dw) + (p.rot ? ' (' + I.t('svg.rot') + ')' : '');
            h.push('<g class="rk-pc" data-id="' + p.id + '"><title>' + title + '</title>');
            h.push('<rect x="' + p.x + '" y="' + p.y + '" width="' + p.w + '" height="' + p.h + '" style="fill:' + pal.fill(p.id) + ';stroke:' + pal.line(p.id) + ';stroke-width:1px" vector-effect="non-scaling-stroke"/>');
            var en = { stroke: pal.edge };
            var ew = 'stroke-width:3.5px';
            if (p.edges.t) h.push('<line x1="' + p.x + '" y1="' + p.y + '" x2="' + (p.x + p.w) + '" y2="' + p.y + '" style="stroke:' + en.stroke + ';' + ew + '" vector-effect="non-scaling-stroke"/>');
            if (p.edges.b) h.push('<line x1="' + p.x + '" y1="' + (p.y + p.h) + '" x2="' + (p.x + p.w) + '" y2="' + (p.y + p.h) + '" style="stroke:' + en.stroke + ';' + ew + '" vector-effect="non-scaling-stroke"/>');
            if (p.edges.l) h.push('<line x1="' + p.x + '" y1="' + p.y + '" x2="' + p.x + '" y2="' + (p.y + p.h) + '" style="stroke:' + en.stroke + ';' + ew + '" vector-effect="non-scaling-stroke"/>');
            if (p.edges.r) h.push('<line x1="' + (p.x + p.w) + '" y1="' + p.y + '" x2="' + (p.x + p.w) + '" y2="' + (p.y + p.h) + '" style="stroke:' + en.stroke + ';' + ew + '" vector-effect="non-scaling-stroke"/>');

            /* подписи: крупный номер и размеры, если помещаются */
            var dim = mmf(p.w) + '×' + mmf(p.h);
            var fsNum = Math.min(p.h * 0.36, p.w * 0.45, 130);
            var fsDim = Math.min(fsNum * 0.46, p.w * 0.9 / (dim.length * 0.62));
            var cx = p.x + p.w / 2, cy = p.y + p.h / 2;
            if (fsNum >= 22) {
                var showDim = fsDim >= 26 && p.h > fsNum * 1.9;
                h.push('<text x="' + cx + '" y="' + (showDim ? cy - fsDim * 0.55 : cy) + '" text-anchor="middle" dominant-baseline="central" style="fill:' + pal.label(p.id) + ';font-weight:600;font-size:' + fsNum.toFixed(0) + 'px">' + p.id + '</text>');
                if (showDim) h.push('<text x="' + cx + '" y="' + (cy + fsNum * 0.52) + '" text-anchor="middle" dominant-baseline="central" style="fill:' + pal.label(p.id) + ';opacity:.8;font-size:' + fsDim.toFixed(0) + 'px">' + dim + '</text>');
            } else if (p.w > 0 && p.h > 0) {
                var fs3 = Math.min(p.h * 0.7, p.w * 0.8, 60);
                if (fs3 >= 14) h.push('<text x="' + cx + '" y="' + cy + '" text-anchor="middle" dominant-baseline="central" style="fill:' + pal.label(p.id) + ';font-weight:600;font-size:' + fs3.toFixed(0) + 'px">' + p.id + '</text>');
            }
            h.push('</g>');
        });
        h.push('</svg>');
        return h.join('');
    }

    /* ---------- Стоимость материала и операции ---------- */
    function matCost(mat, s) {
        var fill = mat.fill > 0 ? Math.min(100, mat.fill) : 90;
        var qtyArea = s.sheetArea ? s.usedArea / (s.sheetArea * fill / 100) : 0;
        var qty = s.sheets;
        if (mat.bySheets === false) {
            qty = mat.round === 'none' ? qtyArea : mat.round === 'half' ? Math.ceil(qtyArea * 2 - 1e-9) / 2 : Math.ceil(qtyArea - 1e-9);
        }
        var base = mat.opBasis === 'perim' ? s.perim / 1000 : mat.opBasis === 'part' ? s.usedArea / 1e6 : mat.opBasis === 'mat' ? s.sheets * s.sheetArea / 1e6 : s.cuts / 1000;
        var sm = (mat.price || 0) * qty, so = (mat.opPrice || 0) * base, se = (mat.edgePrice || 0) * s.edge / 1000;
        return { qty: qty, qtyArea: qtyArea, mat: sm, op: so, edge: se, total: sm + so + se, priced: !!(mat.price || mat.opPrice || mat.edgePrice) };
    }
    function costHtml(mat, mc, cur) {
        if (!mc.priced) return '';
        var parts = [];
        if (mat.price) parts.push(esc(t('c.mat')) + ' <b>' + fmt(mc.qty, mc.qty % 1 ? 2 : 0) + ' ' + esc(t('u.sh')) + ' · ' + fmt(mc.mat) + ' ' + esc(cur) + '</b>');
        if (mat.opPrice) parts.push(esc(t('c.op')) + ' <b>' + fmt(mc.op) + ' ' + esc(cur) + '</b>');
        if (mat.edgePrice) parts.push(esc(t('c.edge')) + ' <b>' + fmt(mc.edge) + ' ' + esc(cur) + '</b>');
        return '<p class="rk-mat-cost">' + parts.map(function (x) { return '<span>' + x + '</span>'; }).join('') + '<span class="rk-mat-total">' + esc(t('c.total')) + ' <b>' + fmt(mc.total) + ' ' + esc(cur) + '</b></span></p>';
    }

    /* ---------- Вывод результата ---------- */
    var uniqCounter = 0;
    function autoNote(res) {
        var a = res.auto;
        if (!a) return '';
        var txt = t('am.res', { n: a.tried, dir: t('am.d.' + a.dir), v: a.variant + 1 });
        if (a.worstSheets > a.bestSheets) txt += ' ' + t('am.res.sheets', { n: a.worstSheets - a.bestSheets, pl: plural(a.worstSheets - a.bestSheets, 'sheet.pl') });
        else if (a.bestUtil - a.worstUtil > 0.0005) txt += ' ' + t('am.res.waste', { d: fmt((a.bestUtil - a.worstUtil) * 100, 1) });
        else txt += ' ' + t('am.res.same');
        return '<p class="rk-auto-note"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/></svg><span>' + esc(txt) + '</span></p>';
    }

    function renderResults(list) {
        updateMatCalc(list);
        var out = $('#rk-out'), sum = $('#rk-summary'), warn = $('#rk-warn');
        out.innerHTML = ''; sum.innerHTML = '';
        var cur = state.settings.currency;
        var T = { sheets: 0, pieces: 0, used: 0, total: 0, cuts: 0, edge: 0, cost: 0, priced: false };
        var unplaced = [], relaxedMats = [];

        /* детали с неполными данными */
        var bad = [];
        state.parts.forEach(function (p, i) { if (!p.l || !p.w || !p.qty) bad.push(i + 1); });

        list.forEach(function (r, idx) {
            var s = r.res.stats, mat = r.mat;
            T.sheets += s.sheets; T.pieces += s.pieces; T.used += s.usedArea; T.total += s.sheets * s.sheetArea; T.cuts += s.cuts; T.edge += s.edge;
            var mc = matCost(mat, s);
            if (mc.priced) T.priced = true;
            T.cost += mc.total;
            if (s.relaxed) relaxedMats.push(mat.name || t('m.fallback'));
            r.res.unplaced.forEach(function (u) { unplaced.push({ u: u, mat: mat }); });

            var sec = el('section', 'rk-mat-res');
            var um = ' ' + t('u.m');
            var meta = '<b>' + s.sheets + '</b> ' + plural(s.sheets, 'sheet.pl') + ' ' + mmf(mat.l) + '×' + mmf(mat.w) + ' · ' + t('r.meta.parts') + ' <b>' + s.pieces + '</b> · ' + t('r.meta.used') + ' <b>' + fmt(s.util * 100, 1) + '%</b> · ' + t('r.meta.cut') + ' <b>' + fmt(s.cuts / 1000, 1) + um + '</b> · ' + t('r.meta.edge') + ' <b>' + fmt(s.edge / 1000, 1) + um + '</b>' + (mc.priced ? ' · <b>' + fmt(mc.total) + ' ' + esc(cur) + '</b>' : '');
            var html = '<h3>' + esc(mat.name || t('m.fallback')) + '</h3><p class="rk-mat-meta">' + meta + '</p>' + autoNote(r.res) + costHtml(mat, mc, cur) + '<div class="rk-sheets">';
            r.res.sheets.forEach(function (sh) {
                uniqCounter++;
                html += '<div class="rk-sheet"><div class="rk-sheet-draw">' + sheetSvg(sh, mat, PAL_PAGE, 'rk-svg', uniqCounter) + '</div>' +
                    '<dl class="rk-tb">' +
                    '<div><dt>' + esc(t('r.sheet')) + '</dt><dd>' + esc(t('r.of', { i: sh.index, n: s.sheets })) + '</dd></div>' +
                    '<div><dt>' + esc(t('r.parts')) + '</dt><dd>' + sh.pieces.length + '</dd></div>' +
                    '<div class="rk-tb-u"><dt>' + esc(t('r.used')) + '</dt><dd>' + fmt(sh.util * 100, 1) + '%</dd><i style="width:' + Math.min(100, sh.util * 100).toFixed(1) + '%"></i></div>' +
                    '<div><dt>' + esc(t('r.cut')) + '</dt><dd>' + fmt(sh.cuts / 1000, 1) + ' ' + t('u.m') + '</dd></div>' +
                    '<div class="rk-tb-act"><button type="button" class="rk-btn rk-btn--ghost rk-btn--sm" data-png="' + idx + ':' + (sh.index - 1) + '">' + esc(t('r.svg')) + '</button><button type="button" class="rk-btn rk-btn--ghost rk-btn--sm only-desk" data-svg="' + idx + ':' + (sh.index - 1) + '">' + esc(t('r.svg2')) + '</button></div>' +
                    '</dl></div>';
            });
            html += '</div>';
            html += legendHtml(r);
            sec.innerHTML = html;
            out.appendChild(sec);
        });

        /* итоги */
        if (list.length) {
            var tiles = [
                ['rk-tile--main', fmt(T.sheets), plural(T.sheets, 't.sheets')],
                ['', fmt(T.pieces), t('t.placed')],
                ['', fmt(T.total ? T.used / T.total * 100 : 0, 1) + '%', t('t.used')],
                ['', fmt(T.total ? (1 - T.used / T.total) * 100 : 0, 1) + '%', t('t.waste')],
                ['', fmt(T.cuts / 1000, 1) + ' ' + t('u.m'), t('t.cut')],
                ['', fmt(T.edge / 1000, 1) + ' ' + t('u.m'), t('t.edge')]
            ];
            if (T.priced) tiles.push(['', fmt(T.cost) + ' ' + cur, t('t.cost')]);
            sum.innerHTML = tiles.map(function (t) { return '<div class="rk-tile ' + t[0] + '"><b>' + esc(t[1]) + '</b><span>' + esc(t[2]) + '</span></div>'; }).join('');
        }

        /* предупреждения */
        var wl = [];
        if (unplaced.length) {
            wl.push(esc(t('w.unfit')) + '<ul>' + unplaced.map(function (x) {
                return '<li>' + esc(t('w.unfit.item', { id: x.u.id, name: x.u.name ? ' ' + x.u.name : '', l: mmf(x.u.l), w: mmf(x.u.w), mat: x.mat.name, L: mmf(x.mat.l), W: mmf(x.mat.w), t: mmf(state.settings.trim) })) + '</li>';
            }).join('') + '</ul>');
        }
        relaxedMats.forEach(function (n) { wl.push(esc(t('w.relaxed', { mat: n }))); });
        if (bad.length) wl.push(esc(t('w.bad', { list: bad.join(', №') })));
        warn.hidden = !wl.length;
        warn.innerHTML = wl.join('<br>');

        var st = $('#rk-status');
        st.textContent = list.length ? t('status', { n: T.sheets, pl: plural(T.sheets, 'sheet.pl'), u: fmt(T.total ? T.used / T.total * 100 : 0, 1) }) : '';

        $$('[data-svg]', out).forEach(function (b) {
            b.addEventListener('click', function () {
                var p = b.getAttribute('data-svg').split(':'); downloadSheet(+p[0], +p[1]);
            });
        });
        $$('[data-png]', out).forEach(function (b) {
            b.addEventListener('click', function () {
                var p = b.getAttribute('data-png').split(':'); downloadSheetPng(+p[0], +p[1], b);
            });
        });
        $('#rk-csv-cut').disabled = !list.length;
        $('#rk-print').disabled = !list.length;
    }

    /* подсветка: наведите на деталь на карте или строку в списке, остальные приглушатся */
    (function () {
        var out = $('#rk-out');
        function mark(id) {
            $$('.rk-pc, .rk-legend tbody tr', out).forEach(function (n) {
                n.classList.toggle('is-dim', id !== null && n.getAttribute('data-id') !== id);
            });
        }
        out.addEventListener('mouseover', function (e) {
            var n = e.target.closest ? e.target.closest('.rk-pc, .rk-legend tbody tr') : null;
            mark(n ? n.getAttribute('data-id') : null);
        });
        out.addEventListener('mouseleave', function () { mark(null); });
    })();

    function legendHtml(r) {
        /* список деталей этого материала: номер, название, размер, количество, кромка */
        var cnt = {}, info = {};
        r.res.sheets.forEach(function (sh) { sh.pieces.forEach(function (p) { cnt[p.id] = (cnt[p.id] || 0) + 1; info[p.id] = p; }); });
        var ids = Object.keys(cnt).map(Number).sort(function (a, b) { return a - b; });
        if (!ids.length) return '';
        var rows = ids.map(function (id) {
            var p = info[id], e = p.edges, sides = [];
            var src = state.parts[id - 1];
            var ee = src ? src.e : [0, 0, 0, 0];
            if (ee[0] && ee[1]) sides.push(t('lg.2l')); else if (ee[0] || ee[1]) sides.push(t('lg.1l'));
            if (ee[2] && ee[3]) sides.push(t('lg.2w')); else if (ee[2] || ee[3]) sides.push(t('lg.1w'));
            return '<tr data-id="' + id + '"><td><span class="rk-chip" style="--h:' + hue(id - 1) + '">' + id + '</span></td><td>' + esc(p.name || '—') + '</td><td class="num">' + mmf(p.l) + ' × ' + mmf(p.dw) + '</td><td class="num">' + cnt[id] + '</td><td>' + esc(sides.join(', ') || t('lg.none')) + '</td></tr>';
        }).join('');
        return '<div class="rk-legend-wrap"><table class="rk-legend"><thead><tr><th>№</th><th>' + esc(t('lg.part')) + '</th><th class="num">' + esc(t('lg.size')) + '</th><th class="num">' + esc(t('lg.q')) + '</th><th>' + esc(t('lg.edge')) + '</th></tr></thead><tbody>' + rows + '</tbody></table></div>';
    }

    function plural(n, key) { return I.plural(n, key); }

    /* ---------- Экспорт ---------- */
    /* имя файла: латиницей, чтобы телефон и компьютер не заменяли русские буквы на «download» */
    var TR = { 'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'e', 'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u', 'ф': 'f', 'х': 'h', 'ц': 'c', 'ч': 'ch', 'ш': 'sh', 'щ': 'sch', 'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya', 'ў': 'u', 'қ': 'q', 'ғ': 'g', 'ҳ': 'h' };
    function slug(s) {
        var x = String(s || 'material').toLowerCase().replace(/[а-яёўқғҳ]/g, function (ch) { return TR[ch] != null ? TR[ch] : ''; });
        return x.replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 50) || 'material';
    }

    function partsRows(st) {
        var rows = [t('csv.parts').split(';')];
        st.parts.forEach(function (p, i) {
            var m = st.materials.filter(function (x) { return x.id === p.mat; })[0];
            rows.push([i + 1, p.name, m ? m.name : '', p.l, p.w, p.qty, p.rotate ? t('yes') : t('no'), p.e[0], p.e[1], p.e[2], p.e[3]]);
        });
        return rows;
    }
    function cutRows(out) {
        var rows = [t('csv.cut').split(';')];
        out.forEach(function (r) {
            r.res.sheets.forEach(function (sh) {
                sh.pieces.forEach(function (p) { rows.push([r.mat.name, sh.index, p.id, p.name, p.x, p.y, p.w, p.h, p.rot ? t('yes') : t('no')]); });
            });
        });
        return rows;
    }

    $('#rk-csv-parts').addEventListener('click', function () {
        var btn = this;
        runExport(btn, function () {
            RKExport.save('detali-' + slug(workLabel(activeItem())) + '.xlsx', RKExport.xlsx([{ name: t('x.sheet.parts'), rows: partsRows(state) }]));
            return t('x.done');
        });
    });

    $('#rk-csv-cut').addEventListener('click', function () {
        if (!lastResult || !lastResult.length) return;
        var btn = this;
        runExport(btn, function () {
            var it = activeItem();
            RKExport.save('raskroy-' + slug(workLabel(it)) + '.xlsx', RKExport.xlsx(xlsxSheets([{ it: { state: state }, out: lastResult }])));
            return t('x.done');
        });
    });

    var FAVICON = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="16" fill="#2563eb"/><path d="M15 18h34v28H15zM15 32h22M37 18v28M37 39h12" fill="none" stroke="#fff" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"/></svg>');

    /* Готовый файл карты листа. Размеры width/height не задаём: при открытии в браузере карта сама вписывается в окно.
       Белый фон нужен, чтобы карта не терялась в тёмных просмотрщиках. */
    function fileSvg(r, sh, uniq, trim) {
        var svg = sheetSvg(sh, r.mat, PAL_FILE, 'rk-svg-file', uniq, trim);
        var vb = /viewBox="([^"]+)"/.exec(svg)[1].split(' ');
        /* название вкладки и значок сайта для браузера, в котором открыт файл */
        var head = '<title>' + esc(t('brand') + ' · ' + (r.mat.name || t('m.fallback')) + ' · ' + t('r.sheet') + ' ' + sh.index) + '</title>' +
            '<link xmlns="http://www.w3.org/1999/xhtml" rel="icon" type="image/svg+xml" href="' + FAVICON + '"/>';
        svg = svg.replace(/(<svg [^>]*>)/, '$1' + head + '<rect x="' + vb[0] + '" y="' + vb[1] + '" width="' + vb[2] + '" height="' + vb[3] + '" style="fill:#ffffff"/>');
        return '<?xml version="1.0" encoding="UTF-8"?>\n' + svg;
    }

    function downloadSheet(ri, si) {
        var r = lastResult && lastResult[ri]; if (!r) return;
        var sh = r.res.sheets[si]; if (!sh) return;
        RKExport.save('list-' + slug(r.mat.name) + '-' + sh.index + '.svg', new Blob([fileSvg(r, sh, 'f' + ri + '-' + si, state.settings.trim)], { type: 'image/svg+xml;charset=utf-8' }));
    }

    /* ZIP, Excel, PNG и PDF делает js/export.js */
    var saveBlob = RKExport.save;

    /* ---------- Раздел «Мои работы» ---------- */
    var resCache = {};   /* расчёты не активных работ: id -> { sig, out } */

    function workResult(it, cb) {
        var sig = JSON.stringify(it.state);
        if (it.id === projects.active && lastResultSig === sig && lastResult) { cb(lastResult); return; }
        var hit = resCache[it.id];
        if (hit && hit.sig === sig) { cb(hit.out); return; }
        var list = jobs(600, it.state);
        if (!list.length) { resCache[it.id] = { sig: sig, out: [] }; cb([]); return; }
        var out = [], left = list.length;
        list.forEach(function (j, idx) {
            solveJob(j, function (res) {
                out[idx] = { mat: j.mat, res: res, cfg: j.cfg };
                if (--left === 0) { resCache[it.id] = { sig: sig, out: out }; cb(out); }
            });
        });
    }

    function dateStamp() {
        var d = new Date(), p2 = function (n) { return (n < 10 ? '0' : '') + n; };
        return d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate());
    }
    function whenText(ms) {
        if (!ms) return '';
        var d = new Date(ms), p2 = function (n) { return (n < 10 ? '0' : '') + n; };
        return p2(d.getDate()) + '.' + p2(d.getMonth() + 1) + '.' + d.getFullYear() + ' ' + p2(d.getHours()) + ':' + p2(d.getMinutes());
    }

    /* ---------- Экспорт работ: Excel, PNG, PDF, ZIP ---------- */
    var exportBusy = false;
    /* Запускает подготовку файла: пока она идёт, кнопка занята, потом показываем итог или понятную ошибку */
    function runExport(btn, job) {
        if (exportBusy) { toast(t('x.busy')); return; }
        exportBusy = true;
        if (btn) btn.classList.add('is-busy');
        toast(t('x.busy'));
        var pr;
        try { pr = Promise.resolve(job()); } catch (e) { pr = Promise.reject(e); }
        pr.then(function (msg) { if (!RKExport.offering()) toast(msg || t('x.done')); }, function (e) {
            if (window.console) console.error(e);
            toast(t('x.err'));
        }).then(function () { exportBusy = false; if (btn) btn.classList.remove('is-busy'); });
    }
    function workResultP(it) { return new Promise(function (res) { workResult(it, res); }); }
    function rnd(n, d) { var k = Math.pow(10, d || 0); return Math.round(n * k) / k; }

    function sumRows(out) {
        var rows = [];
        out.forEach(function (r) {
            var s = r.res.stats, mc = matCost(r.mat, s), tot = s.sheets * s.sheetArea;
            rows.push([r.mat.name || t('m.fallback'), mmf(r.mat.l) + '×' + mmf(r.mat.w), s.sheets, s.pieces, rnd(tot ? s.usedArea / tot * 100 : 0, 1), rnd(s.cuts / 1000, 1), rnd(s.edge / 1000, 1), mc.priced ? Math.round(mc.total) : '']);
        });
        return rows;
    }
    /* items: [{it, out}] -> листы Excel; при нескольких работах добавляется столбец «Работа» */
    function xlsxSheets(items) {
        var multi = items.length > 1;
        function head(h) { return multi ? [t('x.work')].concat(h) : h; }
        var sum = [head([t('x.col.mat'), t('x.col.size'), t('x.col.sheets'), t('x.col.parts'), t('x.col.used'), t('x.col.cut'), t('x.col.edge'), t('x.col.cost')])];
        var parts = [head(t('csv.parts').split(';'))], cut = [head(t('csv.cut').split(';'))];
        items.forEach(function (x) {
            var label = x.it.name != null || x.it.n != null ? workLabel(x.it) : '';
            function add(dst, rows) { rows.slice(dst === sum ? 0 : 1).forEach(function (r) { dst.push(multi ? [label].concat(r) : r); }); }
            add(sum, sumRows(x.out));
            add(parts, partsRows(x.it.state));
            add(cut, cutRows(x.out));
        });
        var sheets = [{ name: t('x.sheet.sum'), rows: sum }, { name: t('x.sheet.parts'), rows: parts }];
        if (cut.length > 1) sheets.push({ name: t('x.sheet.cut'), rows: cut });
        return sheets;
    }

    /* Карта листа как картинка: сверху подпись (материал, номер листа, использование), ниже сама карта */
    async function sheetImage(r, sh, total, trim, uniq) {
        var cv = await RKExport.svgToCanvas(fileSvg(r, sh, uniq, trim), 1800);
        var H = 150, out = document.createElement('canvas');
        out.width = cv.width; out.height = cv.height + H;
        var x = out.getContext('2d');
        x.fillStyle = '#ffffff'; x.fillRect(0, 0, out.width, out.height);
        x.fillStyle = '#151a26'; x.textBaseline = 'alphabetic';
        x.font = '700 50px ' + RKExport.FONT;
        x.fillText((r.mat.name || t('m.fallback')) + ' · ' + t('x.pdf.sheetof', { i: sh.index, n: total }), 40, 66);
        x.fillStyle = '#5b6478'; x.font = '400 34px ' + RKExport.FONT;
        x.fillText(mmf(r.mat.l) + '×' + mmf(r.mat.w) + ' ' + t('u.mm') + ' · ' + t('r.parts') + ': ' + sh.pieces.length + ' · ' + t('r.used') + ': ' + fmt(sh.util * 100, 1) + '% · ' + t('r.cut') + ': ' + fmt(sh.cuts / 1000, 1) + ' ' + t('u.m'), 40, 116);
        x.drawImage(cv, 0, H);
        return out;
    }

    function downloadSheetPng(ri, si, btn) {
        var r = lastResult && lastResult[ri]; if (!r) return;
        var sh = r.res.sheets[si]; if (!sh) return;
        runExport(btn, async function () {
            await RKExport.fontsReady();
            var cv = await sheetImage(r, sh, r.res.stats.sheets, state.settings.trim, 'p' + ri + '-' + si);
            RKExport.save('list-' + slug(r.mat.name) + '-' + sh.index + '.png', await RKExport.toBlob(cv, 'image/png'));
            return t('x.png.done');
        });
    }

    /* Одна работа в PDF-документ: сводка, листы по одному на страницу, список деталей */
    async function addWorkToDoc(doc, it, out, progress) {
        var st = it.state, label = workLabel(it);
        doc.h1(label);
        doc.muted(t('x.pdf.title') + ' · ' + t('x.pdf.date') + ': ' + whenText(it.u || Date.now()).split(' ')[0]);
        if (!out.length) { doc.space(10); doc.text(t('x.pdf.noparts')); return; }
        var priced = out.some(function (r) { return matCost(r.mat, r.res.stats).priced; });
        var cols = [{ label: t('x.col.mat'), w: 2.4 }, { label: t('x.col.size'), w: 2.2 }, { label: t('x.col.sheets'), w: 1.3, align: 'right' }, { label: t('x.col.parts'), w: 1.4, align: 'right' }, { label: t('x.col.used'), w: 2.2, align: 'right' }, { label: t('x.col.cut'), w: 1.2, align: 'right' }];
        if (priced) cols.push({ label: t('x.col.cost'), w: 1.7, align: 'right' });
        doc.space(14);
        doc.table(cols, sumRows(out).map(function (r) { return priced ? [r[0], r[1], r[2], r[3], fmt(r[4], 1) + '%', fmt(r[5], 1), r[7] === '' ? '' : fmt(r[7])] : [r[0], r[1], r[2], r[3], fmt(r[4], 1) + '%', fmt(r[5], 1)]; }), { size: 23 });
        var done = 0, count = 0;
        out.forEach(function (r) { count += r.res.sheets.length; });
        for (var ri = 0; ri < out.length; ri++) {
            var r = out[ri];
            for (var si = 0; si < r.res.sheets.length; si++) {
                var sh = r.res.sheets[si];
                doc.pageBreak();
                doc.h2((r.mat.name || t('m.fallback')) + ' · ' + t('x.pdf.sheetof', { i: sh.index, n: r.res.stats.sheets }));
                doc.muted(mmf(r.mat.l) + '×' + mmf(r.mat.w) + ' ' + t('u.mm') + ' · ' + t('r.parts') + ': ' + sh.pieces.length + ' · ' + t('r.used') + ': ' + fmt(sh.util * 100, 1) + '% · ' + t('r.cut') + ': ' + fmt(sh.cuts / 1000, 1) + ' ' + t('u.m'));
                var cv = await RKExport.svgToCanvas(fileSvg(r, sh, 'd' + ri + '-' + si, st.settings.trim), 1500);
                doc.image(cv, 760);
                var rows = sh.pieces.slice().sort(function (a, b) { return a.id - b.id; }).map(function (p) { return [p.id, p.name || '', mmf(p.l) + ' × ' + mmf(p.dw), p.rot ? t('yes') : '']; });
                doc.table([{ label: t('x.col.no'), w: 0.8 }, { label: t('x.col.name'), w: 4 }, { label: t('x.col.dim'), w: 2 }, { label: t('x.col.rot'), w: 1.2 }], rows, { size: 22, rh: 36 });
                done++;
                if (progress) progress(done, count);
                await new Promise(function (res) { setTimeout(res, 0); });
            }
        }
        doc.pageBreak();
        doc.h2(t('x.pdf.list'));
        var prow = partsRows(st).slice(1).map(function (r) { return [r[0], r[1], r[2], r[3] + ' × ' + r[4], r[5]]; });
        doc.table([{ label: t('x.col.no'), w: 0.8 }, { label: t('x.col.name'), w: 3.6 }, { label: t('x.col.mat'), w: 3 }, { label: t('x.col.dim'), w: 2 }, { label: t('x.col.qty'), w: 0.9, align: 'right' }], prow, { size: 22, rh: 36 });
    }

    function downloadWorkPdf(it, btn) {
        runExport(btn, async function () {
            await RKExport.fontsReady();
            var out = await workResultP(it);
            if (!out.length) return t('x.none');
            var doc = new RKExport.Doc({ footer: t('brand') + ' · ' + workLabel(it), title: workLabel(it) });
            await addWorkToDoc(doc, it, out, function (i, n) { toast(t('x.progress', { i: i, n: n })); });
            RKExport.save('raskroy-' + slug(workLabel(it)) + '.pdf', await doc.blob());
        });
    }
    function downloadWorkXlsx(it, btn) {
        runExport(btn, async function () {
            var out = await workResultP(it);
            RKExport.save('raskroy-' + slug(workLabel(it)) + '.xlsx', RKExport.xlsx(xlsxSheets([{ it: it, out: out }])));
        });
    }
    /* ZIP остаётся для компьютера: Excel, PNG и SVG каждого листа */
    async function workZipFiles(it, out, folder) {
        var files = [], st = it.state, enc = new TextEncoder();
        files.push({ name: folder + 'raskroy.xlsx', data: new Uint8Array(await RKExport.xlsx(xlsxSheets([{ it: it, out: out }])).arrayBuffer()) });
        for (var ri = 0; ri < out.length; ri++) {
            var r = out[ri];
            for (var si = 0; si < r.res.sheets.length; si++) {
                var sh = r.res.sheets[si], base = folder + slug(r.mat.name) + '-' + sh.index;
                files.push({ name: base + '.svg', data: enc.encode(fileSvg(r, sh, 'z' + ri + '-' + si, st.settings.trim)) });
                var cv = await sheetImage(r, sh, r.res.stats.sheets, st.settings.trim, 'zp' + ri + '-' + si);
                files.push({ name: base + '.png', data: new Uint8Array(await (await RKExport.toBlob(cv, 'image/png')).arrayBuffer()) });
            }
        }
        return files;
    }
    /* порядок «всех работ»: сначала папки по очереди, затем работы без папки */
    function folderById(id) {
        for (var i = 0; i < projects.folders.length; i++) if (projects.folders[i].id === id) return projects.folders[i];
        return null;
    }
    function worksIn(fid) { return projects.list.filter(function (it) { return (it.f || '') === fid; }); }
    function orderedWorks() {
        var out = [];
        projects.folders.forEach(function (fo) { out = out.concat(worksIn(fo.id)); });
        return out.concat(worksIn(''));
    }
    function folderLabel(fo) { return fo.name || t('fo.default', { n: projects.folders.indexOf(fo) + 1 }); }

    /* list — какие работы скачать (по умолчанию все), fo — папка: тогда файл называется по папке */
    function downloadAllZip(btn, list, fo) {
        runExport(btn, async function () {
            await RKExport.fontsReady();
            var files = [], num = 0;
            list = list || orderedWorks();
            for (var i = 0; i < list.length; i++) {
                var it = list[i], out = await workResultP(it);
                if (!out.length) continue;
                num++;
                var dir = (num < 10 ? '0' : '') + num + '-' + slug(workLabel(it)) + '/';
                var own = !fo && it.f ? folderById(it.f) : null;
                if (own) dir = slug(folderLabel(own)) + '/' + dir;
                files = files.concat(await workZipFiles(it, out, dir));
            }
            if (!files.length) return t('x.none');
            RKExport.save('raskroy-' + (fo ? slug(folderLabel(fo)) : dateStamp()) + '.zip', RKExport.zip(files));
        });
    }
    function downloadAllXlsx(btn, list, fo) {
        runExport(btn, async function () {
            var items = [];
            list = list || orderedWorks();
            for (var i = 0; i < list.length; i++) {
                var it = list[i], out = await workResultP(it);
                if (out.length) items.push({ it: it, out: out });
            }
            if (!items.length) return t('x.none');
            RKExport.save('raskroy-' + (fo ? slug(folderLabel(fo)) : dateStamp()) + '.xlsx', RKExport.xlsx(xlsxSheets(items)));
        });
    }
    /* «Скачать всё одним файлом»: один PDF со всеми работами (на телефоне нет папок и архивов) */
    function downloadAllPdf(btn, list, fo) {
        runExport(btn, async function () {
            await RKExport.fontsReady();
            var items = [];
            list = list || orderedWorks();
            for (var i = 0; i < list.length; i++) {
                var it = list[i], out = await workResultP(it);
                if (out.length) items.push({ it: it, out: out });
            }
            if (!items.length) return t('x.none');
            var title = fo ? folderLabel(fo) : t('x.pdf.all');
            var doc = new RKExport.Doc({ footer: t('brand') + ' · ' + dateStamp(), title: title });
            if (items.length > 1 || fo) {
                doc.h1(title);
                doc.muted(dateStamp());
                doc.space(14);
                doc.table([{ label: t('x.work'), w: 4 }, { label: t('x.col.sheets'), w: 1.2, align: 'right' }, { label: t('x.col.parts'), w: 1.2, align: 'right' }, { label: t('x.col.used'), w: 1.8, align: 'right' }],
                    items.map(function (x) {
                        var sh = 0, pc = 0, used = 0, tot = 0;
                        x.out.forEach(function (r) { sh += r.res.stats.sheets; pc += r.res.stats.pieces; used += r.res.stats.usedArea; tot += r.res.stats.sheets * r.res.stats.sheetArea; });
                        return [workLabel(x.it), sh, pc, fmt(tot ? used / tot * 100 : 0, 1) + '%'];
                    }));
            }
            for (var k = 0; k < items.length; k++) {
                if (items.length > 1 || fo || k > 0) doc.pageBreak();
                await addWorkToDoc(doc, items[k].it, items[k].out, function (i, n) { toast(t('x.progress', { i: i, n: n }) + ' (' + (k + 1) + '/' + items.length + ')'); });
            }
            RKExport.save('raskroy-' + (fo ? slug(folderLabel(fo)) : dateStamp()) + '.pdf', await doc.blob());
        });
    }

    /* ---------- Папки ---------- */
    function newFolderId() { return 'f' + Date.now().toString(36) + Math.floor(Math.random() * 1000); }
    function createFolder(after) {
        RKDialog.prompt(t('fo.name'), { value: t('fo.default', { n: projects.folders.length + 1 }), ok: t('fo.create'), placeholder: t('fo.ph') }).then(function (name) {
            if (typeof name !== 'string') return;
            var fo = { id: newFolderId(), name: name.slice(0, 60), open: true };
            projects.folders.push(fo);
            saveNow(); renderWorks();
            toast(t('fo.created', { name: folderLabel(fo) }));
            if (after) after(fo);
        });
    }
    function renameFolder(fo) {
        RKDialog.prompt(t('fo.name'), { value: fo.name || folderLabel(fo), ok: t('d.ok') }).then(function (name) {
            if (typeof name !== 'string') return;
            fo.name = name.slice(0, 60);
            saveNow(); renderWorks();
        });
    }
    function deleteFolder(fo) {
        RKDialog.ask(true, t('fo.delconfirm', { name: folderLabel(fo) }), { ok: t('d.delete'), danger: true }, function () {
            projects.list.forEach(function (it) { if (it.f === fo.id) it.f = ''; });
            projects.folders.splice(projects.folders.indexOf(fo), 1);
            saveNow(); renderTabs(); renderWorks();
        });
    }
    function moveToFolder(it) {
        var opts = [{ v: '', label: t('fo.none') }];
        projects.folders.forEach(function (fo) { opts.push({ v: fo.id, label: folderLabel(fo) }); });
        opts.push({ v: '+', label: t('fo.newopt'), add: true });
        RKDialog.pick(t('fo.move.title', { name: workLabel(it) }), opts, { current: it.f || '' }).then(function (v) {
            if (typeof v !== 'string') return;
            function put(fid) {
                it.f = fid; saveNow(); renderTabs(); renderWorks();
                var fo = folderById(fid);
                toast(fo ? t('fo.moved', { w: workLabel(it), f: folderLabel(fo) }) : t('fo.unmoved', { w: workLabel(it) }));
            }
            if (v === '+') createFolder(function (fo) { put(fo.id); });
            else put(v);
        });
    }

    function workRow(it, many, done) {
        var on = it.id === projects.active;
        var row = el('div', 'rk-work' + (on ? ' is-active' : ''));
        var info = el('div', 'rk-work-info');
        var nm = el('div', 'rk-work-name');
        var nt = el('span'); nt.textContent = workLabel(it);
        nm.appendChild(nt);
        if (on) { var bd = el('span', 'rk-work-badge'); bd.textContent = t('w.current'); nm.appendChild(bd); }
        var meta = el('div', 'rk-work-meta'); meta.textContent = t('w.calc');
        info.appendChild(nm); info.appendChild(meta);
        var acts = el('div', 'rk-work-acts');
        if (!on) {
            var ob = el('button', 'rk-btn rk-btn--ghost', { type: 'button' }); ob.textContent = t('w.open');
            ob.addEventListener('click', function () {
                switchTo(it.id);
                var hd = document.getElementById('rk-h-parts');
                if (hd) hd.scrollIntoView({ behavior: 'smooth', block: 'start' });
            });
            acts.appendChild(ob);
        }
        [['w.pdf', '', downloadWorkPdf], ['w.xlsx', '', downloadWorkXlsx], ['w.zip', ' only-desk', null]].forEach(function (d) {
            var db = el('button', 'rk-btn rk-btn--ghost' + d[1], { type: 'button' }); db.textContent = t(d[0]);
            db.addEventListener('click', function () {
                if (d[2]) d[2](it, db);
                else runExport(db, async function () {
                    await RKExport.fontsReady();
                    var out = await workResultP(it);
                    if (!out.length) return t('x.none');
                    RKExport.save('raskroy-' + slug(workLabel(it)) + '.zip', RKExport.zip(await workZipFiles(it, out, '')));
                });
            });
            acts.appendChild(db);
        });
        var mb = el('button', 'rk-btn rk-btn--ghost rk-work-mv', { type: 'button' }); mb.textContent = t('fo.move');
        mb.addEventListener('click', function () { moveToFolder(it); });
        acts.appendChild(mb);
        if (many) {
            var xb = el('button', 'rk-btn rk-btn--danger', { type: 'button', 'aria-label': t('w.close', { name: workLabel(it) }) }); xb.textContent = t('w.del');
            xb.addEventListener('click', function () { closeWork(it.id); });
            acts.appendChild(xb);
        }
        row.appendChild(info); row.appendChild(acts);

        /* сводка: деталей, листов, процент использования, дата последнего изменения */
        var pc = 0;
        it.state.parts.forEach(function (p) {
            if (p.l && p.w && p.qty && it.state.materials.some(function (m) { return m.id === p.mat; })) pc += p.qty;
        });
        var when = whenText(it.u);
        if (!pc) { meta.textContent = t('w.empty') + (when ? ' · ' + when : ''); if (done) done(0, 0); return row; }
        workResult(it, function (out) {
            var sheets = 0, used = 0, total = 0;
            out.forEach(function (r) { sheets += r.res.stats.sheets; used += r.res.stats.usedArea; total += r.res.stats.sheets * r.res.stats.sheetArea; });
            meta.textContent = t('r.parts') + ': ' + fmt(pc) + ' · ' + t('status', { n: sheets, pl: plural(sheets, 'sheet.pl'), u: fmt(total ? used / total * 100 : 0, 1) }) + (when ? ' · ' + when : '');
            if (done) done(sheets, pc);
        });
        return row;
    }

    function folderNode(fo, many) {
        var items = worksIn(fo.id);
        var node = el('section', 'rk-folder' + (fo.open ? ' is-open' : ''));
        var head = el('div', 'rk-folder-head');
        var tg = el('button', 'rk-folder-tg', { type: 'button', 'aria-expanded': String(!!fo.open), 'aria-label': t('fo.toggle', { name: folderLabel(fo) }) });
        tg.innerHTML = '<svg class="rk-folder-chev" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg><svg class="rk-folder-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 7a2 2 0 0 1 2-2h4l2 2.5h8a2 2 0 0 1 2 2V18a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>';
        var tx = el('span', 'rk-folder-tx'), nmEl = el('b'), mt = el('small');
        nmEl.textContent = folderLabel(fo);
        mt.textContent = items.length ? t('fo.count', { n: items.length, pl: plural(items.length, 'fo.work.pl') }) : t('fo.emptyshort');
        tx.appendChild(nmEl); tx.appendChild(mt); tg.appendChild(tx);
        tg.addEventListener('click', function () {
            fo.open = !fo.open; saveNow();
            node.classList.toggle('is-open', fo.open);
            tg.setAttribute('aria-expanded', String(fo.open));
        });
        head.appendChild(tg);

        var acts = el('div', 'rk-folder-acts');
        function btn(label, cls, fn) {
            var b = el('button', 'rk-btn ' + cls, { type: 'button' }); b.textContent = label;
            b.addEventListener('click', function () { fn(b); });
            acts.appendChild(b); return b;
        }
        if (items.length) {
            btn(t('fo.dl'), 'rk-btn--main rk-folder-dl', function (b) { downloadAllPdf(b, items, fo); });
            btn(t('w.xlsx'), 'rk-btn--ghost', function (b) { downloadAllXlsx(b, items, fo); });
            btn(t('w.zip'), 'rk-btn--ghost only-desk', function (b) { downloadAllZip(b, items, fo); });
        }
        btn(t('fo.addwork'), 'rk-btn--ghost', function () { fo.open = true; newWork(fo.id); });
        btn(t('fo.rename'), 'rk-btn--ghost', function () { renameFolder(fo); });
        btn(t('fo.del'), 'rk-btn--danger', function () { deleteFolder(fo); });
        head.appendChild(acts);
        node.appendChild(head);

        var body = el('div', 'rk-folder-body');
        if (!items.length) { var em = el('p', 'rk-folder-empty'); em.textContent = t('fo.empty'); body.appendChild(em); }
        var left = items.length, sheets = 0, pcs = 0;
        items.forEach(function (it) {
            body.appendChild(workRow(it, many, function (sh, pc) {
                sheets += sh; pcs += pc;
                if (--left === 0) mt.textContent = t('fo.count', { n: items.length, pl: plural(items.length, 'fo.work.pl') }) + ' · ' + t('r.parts') + ': ' + fmt(pcs) + ' · ' + fmt(sheets) + ' ' + plural(sheets, 'sheet.pl');
            }));
        });
        node.appendChild(body);
        return node;
    }

    function renderWorks() {
        var box = $('#rk-works-list');
        if (!box) return;
        box.innerHTML = '';
        var many = projects.list.length > 1;
        projects.folders.forEach(function (fo) { box.appendChild(folderNode(fo, many)); });
        var loose = worksIn('');
        if (projects.folders.length && loose.length) {
            var h = el('h3', 'rk-wloose'); h.textContent = t('fo.ungrouped'); box.appendChild(h);
        }
        loose.forEach(function (it) { box.appendChild(workRow(it, many)); });
    }
    var nf = document.getElementById('rk-newfolder');
    if (nf) nf.addEventListener('click', function () { createFolder(); });


    /* ---------- Импорт из Базис: CSV, JSON, xlsx ---------- */
    var HEAD = {
        name: ['наименование', 'название', 'деталь', 'имя', 'обозначение', 'name', 'part', 'partname', 'nomi', 'detal'],
        l: ['длина', 'длинадетали', 'l', 'length', 'размерl', 'размерx', 'размер1', 'uzunligi', 'sizex'],
        w: ['ширина', 'ширинадетали', 'w', 'width', 'размерw', 'размерy', 'размер2', 'eni', 'sizey'],
        qty: ['количество', 'колво', 'кол', 'шт', 'штук', 'qty', 'count', 'quantity', 'amount', 'soni'],
        mat: ['материал', 'material', 'mat'],
        th: ['толщина', 'thickness', 'th', 'qalinligi'],
        grain: ['текстура', 'волокно', 'направлениетекстуры', 'grain', 'texture'],
        rot: ['поворот', 'rotate', 'rotation', 'можноповорачивать', 'burish']
    };
    function normHead(h) {
        return String(h == null ? '' : h).toLowerCase().replace(/ё/g, 'е').replace(/[^a-zа-я0-9]/g, '').replace(/(мм|mm)$/, '');
    }
    function truthy(v) {
        var x = String(v == null ? '' : v).trim().toLowerCase();
        return x !== '' && ['0', 'no', 'нет', 'yo‘q', 'false', '-', 'н', 'n', 'без'].indexOf(x) < 0;
    }
    function toNum(v) {
        if (typeof v === 'number') return v > 0 ? Math.round(v * 10) / 10 : 0;
        var m = String(v == null ? '' : v).replace(/\s/g, '').match(/\d+(?:[.,]\d+)?/);
        return m ? num(m[0]) : 0;
    }

    /* Текст -> таблица (разделитель определяется сам, кавычки поддерживаются) */
    function parseDelimited(text) {
        text = text.replace(/^﻿/, '');
        var sample = text.split(/\r?\n/).slice(0, 8).join('\n');
        var best = ';', bc = -1;
        ['\t', ';', ','].forEach(function (d) {
            var c = sample.split(d).length - 1;
            if (c > bc) { bc = c; best = d; }
        });
        var rows = [], row = [], cell = '', q = false;
        for (var i = 0; i < text.length; i++) {
            var ch = text.charAt(i);
            if (q) {
                if (ch === '"') { if (text.charAt(i + 1) === '"') { cell += '"'; i++; } else q = false; } else cell += ch;
            } else if (ch === '"') q = true;
            else if (ch === best) { row.push(cell); cell = ''; }
            else if (ch === '\n' || ch === '\r') {
                if (ch === '\r' && text.charAt(i + 1) === '\n') i++;
                row.push(cell); cell = ''; rows.push(row); row = [];
            } else cell += ch;
        }
        if (cell !== '' || row.length) { row.push(cell); rows.push(row); }
        return rows.filter(function (r) { return r.some(function (c) { return String(c).trim() !== ''; }); });
    }

    /* Таблица -> детали */
    function rowsToParts(rows) {
        var hi = -1, cols = null;
        for (var i = 0; i < Math.min(rows.length, 20) && hi < 0; i++) {
            var c = {}, hits = 0;
            rows[i].forEach(function (h, j) {
                var n = normHead(h);
                if (!n) return;
                Object.keys(HEAD).forEach(function (k) { if (c[k] === undefined && HEAD[k].indexOf(n) >= 0) { c[k] = j; hits++; } });
                if (/кромк|edge|kromka/.test(n)) {
                    c.edge = c.edge || [];
                    var m = /(длин[а-я]*|length|uzunlik|l)([12])$/.exec(n), m2 = /(ширин[а-я]*|width|en|w)([12])$/.exec(n);
                    if (m) c.edge.push({ j: j, k: Number(m[2]) - 1 });
                    else if (m2) c.edge.push({ j: j, k: Number(m2[2]) + 1 });
                    else c.edge.push({ j: j, k: -1 });
                }
            });
            if (c.l !== undefined && c.w !== undefined && hits >= 2) { hi = i; cols = c; }
        }
        var parts = [], skipped = 0;
        if (hi >= 0) {
            rows.slice(hi + 1).forEach(function (r) {
                var l = toNum(r[cols.l]), w = toNum(r[cols.w]);
                if (!l || !w) { skipped++; return; }
                var e = [0, 0, 0, 0];
                (cols.edge || []).forEach(function (ec) {
                    var v = r[ec.j];
                    if (ec.k >= 0) { if (truthy(v) && !(typeof v === 'string' && !/\d|да|yes|ha|\+|✓|x/i.test(v))) e[ec.k] = 1; return; }
                    var s = String(v == null ? '' : v), ml = /(\d)\s*по\s*длин/i.exec(s), mw = /(\d)\s*по\s*ширин/i.exec(s);
                    if (ml) { e[0] = 1; if (Number(ml[1]) > 1) e[1] = 1; }
                    if (mw) { e[2] = 1; if (Number(mw[1]) > 1) e[3] = 1; }
                });
                var rot = true;
                if (cols.rot !== undefined && String(r[cols.rot] == null ? '' : r[cols.rot]).trim() !== '') rot = truthy(r[cols.rot]);
                else if (cols.grain !== undefined && truthy(r[cols.grain])) rot = false;
                parts.push({
                    name: String(r[cols.name] == null ? '' : r[cols.name]).trim().slice(0, 80),
                    l: l, w: w, qty: cols.qty !== undefined ? Math.max(1, Math.floor(toNum(r[cols.qty])) || 1) : 1,
                    mat: cols.mat !== undefined ? String(r[cols.mat] == null ? '' : r[cols.mat]).trim() : '',
                    th: cols.th !== undefined ? toNum(r[cols.th]) : 0,
                    rotate: rot, e: e
                });
            });
        } else {
            /* без заголовка: обычные строки «название 2200 550 2» */
            rows.forEach(function (r) {
                var pl = parseLine(r.join(' '));
                if (!pl) { skipped++; return; }
                parts.push({ name: pl.name, l: pl.l, w: pl.w, qty: pl.qty, mat: '', th: 0, rotate: true, e: [0, 0, 0, 0] });
            });
        }
        return { parts: parts, skipped: skipped, mats: [] };
    }

    /* JSON: {name, materials:[{name,l,w}], parts:[{name,l,w,qty,material,rotate,edge:[…]}]} или просто массив деталей */
    function jsonToParts(o) {
        var list = Array.isArray(o) ? o : (o.parts || o.items || o.details || []);
        var mats = (!Array.isArray(o) && Array.isArray(o.materials)) ? o.materials : [];
        function pick(x, keys) { for (var i = 0; i < keys.length; i++) if (x[keys[i]] != null && x[keys[i]] !== '') return x[keys[i]]; return ''; }
        var parts = [], skipped = 0;
        list.forEach(function (x) {
            if (!x || typeof x !== 'object') { skipped++; return; }
            var l = toNum(pick(x, ['l', 'length', 'len', 'длина'])), w = toNum(pick(x, ['w', 'width', 'ширина']));
            if (!l || !w) { skipped++; return; }
            var m = pick(x, ['material', 'mat', 'материал']);
            if (typeof m === 'number' && mats[m]) m = mats[m].name;
            var ed = pick(x, ['edge', 'edges', 'e', 'кромка']), e = [0, 0, 0, 0];
            if (Array.isArray(ed)) for (var i = 0; i < 4; i++) e[i] = truthy(ed[i]) && Number(ed[i]) !== 0 ? 1 : 0;
            var rv = pick(x, ['rotate', 'canRotate', 'поворот']);
            var gv = pick(x, ['grain', 'texture', 'текстура']);
            parts.push({
                name: String(pick(x, ['name', 'title', 'название'])).slice(0, 80), l: l, w: w,
                qty: Math.max(1, Math.floor(toNum(pick(x, ['qty', 'count', 'quantity', 'количество']))) || 1),
                mat: String(m || '').trim(), th: toNum(pick(x, ['thickness', 'th', 'толщина'])),
                rotate: rv !== '' ? !!rv : !truthy(gv), e: e
            });
        });
        return { parts: parts, skipped: skipped, mats: mats, name: (!Array.isArray(o) && o.name) ? String(o.name) : '' };
    }

    /* Файл .project, который скрипт «GibLab» для Базиса выгружает в XML: детали, листы и кромка */
    function projectToParts(text) {
        var doc = new DOMParser().parseFromString(text.replace(/^﻿/, ''), 'application/xml');
        if (doc.getElementsByTagName('parsererror').length || !doc.documentElement) throw new Error('xml');
        var sheets = {}, partSheet = {}, parts = [], name = '', used = {};
        function kids(el, tag) { return Array.prototype.filter.call(el.children, function (c) { return c.tagName === tag; }); }
        Array.prototype.forEach.call(doc.documentElement.children, function (el) {
            var ty = el.getAttribute('typeId');
            if (el.tagName === 'good' && ty === 'product') {
                if (!name) name = el.getAttribute('name') || '';
                kids(el, 'part').forEach(function (pe) { if (pe.getAttribute('dw')) parts.push(pe); });
            } else if (el.tagName === 'good' && ty === 'sheet') {
                var sz = kids(el, 'part')[0];
                sheets[el.getAttribute('id')] = {
                    name: (el.getAttribute('name') || el.getAttribute('code') || '').trim(),
                    t: toNum(el.getAttribute('t')), l: sz ? toNum(sz.getAttribute('l')) : 0, w: sz ? toNum(sz.getAttribute('w')) : 0
                };
            } else if (el.tagName === 'operation' && ty === 'CS') {
                var mt = kids(el, 'material')[0], mid = mt && mt.getAttribute('id');
                kids(el, 'part').forEach(function (pe) { partSheet[pe.getAttribute('id')] = mid; });
            }
        });
        var out = [], skipped = 0;
        parts.forEach(function (pe) {
            var l = toNum(pe.getAttribute('dl')), w = toNum(pe.getAttribute('dw'));
            if (!l || !w) { skipped++; return; }
            var sh = sheets[partSheet[pe.getAttribute('id')]] || null;
            if (sh && sh.name) used[sh.name] = sh;
            out.push({
                name: String(pe.getAttribute('name') || '').replace(/^№\S*\s*/, '').trim().slice(0, 80),
                l: l, w: w, qty: Math.max(1, Math.floor(toNum(pe.getAttribute('count'))) || 1),
                mat: sh ? sh.name : '', th: sh ? sh.t : 0,
                rotate: pe.getAttribute('txt') !== 'true',
                /* elt/elb — кромка вдоль длины, ell/elr — вдоль ширины */
                e: ['elt', 'elb', 'ell', 'elr'].map(function (a) { return pe.getAttribute(a) ? 1 : 0; })
            });
        });
        return { parts: out, skipped: skipped, name: name.trim(), mats: Object.keys(used).map(function (k) { return { name: k, l: used[k].l, w: used[k].w }; }) };
    }

    /* Минимальное чтение xlsx: zip + XML (нужен DecompressionStream, есть в современных браузерах) */
    function readZipEntries(buf) {
        var dv = new DataView(buf), u8 = new Uint8Array(buf), end = -1;
        for (var i = buf.byteLength - 22; i >= 0 && i > buf.byteLength - 70000; i--) if (dv.getUint32(i, true) === 0x06054b50) { end = i; break; }
        if (end < 0) throw new Error('zip');
        var n = dv.getUint16(end + 10, true), off = dv.getUint32(end + 16, true), out = {}, dec = new TextDecoder();
        for (var k = 0; k < n; k++) {
            var method = dv.getUint16(off + 10, true), csz = dv.getUint32(off + 20, true), nl = dv.getUint16(off + 28, true), xl = dv.getUint16(off + 30, true), cl = dv.getUint16(off + 32, true), lo = dv.getUint32(off + 42, true);
            var name = dec.decode(u8.subarray(off + 46, off + 46 + nl));
            var lnl = dv.getUint16(lo + 26, true), lxl = dv.getUint16(lo + 28, true), ds = lo + 30 + lnl + lxl;
            out[name] = { method: method, data: u8.subarray(ds, ds + csz) };
            off += 46 + nl + xl + cl;
        }
        return out;
    }
    function entryText(en) {
        if (!en) return Promise.resolve('');
        if (en.method === 0) return Promise.resolve(new TextDecoder().decode(en.data));
        if (typeof DecompressionStream === 'undefined') return Promise.reject(new Error('nods'));
        var ds = new DecompressionStream('deflate-raw');
        var w = ds.writable.getWriter(); w.write(en.data); w.close();
        return new Response(ds.readable).arrayBuffer().then(function (b) { return new TextDecoder().decode(b); });
    }
    function colIndex(ref) {
        var m = /^([A-Z]+)/.exec(ref || ''), n = 0;
        if (!m) return 0;
        for (var i = 0; i < m[1].length; i++) n = n * 26 + (m[1].charCodeAt(i) - 64);
        return n - 1;
    }
    function xlsxRows(buf) {
        var z = readZipEntries(buf);
        var sheetName = Object.keys(z).filter(function (k) { return /^xl\/worksheets\/sheet\d+\.xml$/.test(k); }).sort()[0];
        return Promise.all([entryText(z['xl/sharedStrings.xml']), entryText(z[sheetName])]).then(function (r) {
            var P = new DOMParser(), shared = [];
            if (r[0]) Array.prototype.forEach.call(P.parseFromString(r[0], 'application/xml').getElementsByTagName('si'), function (si) {
                shared.push(Array.prototype.map.call(si.getElementsByTagName('t'), function (x) { return x.textContent; }).join(''));
            });
            var rows = [];
            Array.prototype.forEach.call(P.parseFromString(r[1], 'application/xml').getElementsByTagName('row'), function (row) {
                var arr = [];
                Array.prototype.forEach.call(row.getElementsByTagName('c'), function (c) {
                    var ty = c.getAttribute('t'), v = c.getElementsByTagName('v')[0], val = '';
                    if (ty === 's' && v) val = shared[parseInt(v.textContent, 10)] || '';
                    else if (ty === 'inlineStr') val = Array.prototype.map.call(c.getElementsByTagName('t'), function (x) { return x.textContent; }).join('');
                    else if (v) val = ty === 'str' || ty === 'b' ? v.textContent : Number(v.textContent);
                    arr[colIndex(c.getAttribute('r'))] = val;
                });
                for (var i = 0; i < arr.length; i++) if (arr[i] === undefined) arr[i] = '';
                rows.push(arr);
            });
            return rows.filter(function (r) { return r.some(function (c) { return String(c).trim() !== ''; }); });
        });
    }

    function decodeText(buf) {
        try { return new TextDecoder('utf-8', { fatal: true }).decode(buf); }
        catch (e) { return new TextDecoder('windows-1251').decode(buf); }
    }

    function readImportFile(file) {
        return new Promise(function (resolve, reject) {
            var fr = new FileReader();
            fr.onerror = function () { reject(new Error('read')); };
            fr.onload = function () {
                var buf = fr.result, ext = (/\.([a-z0-9]+)$/i.exec(file.name) || [])[1] || '';
                ext = ext.toLowerCase();
                try {
                    if (ext === 'xls') { reject(new Error('xls')); return; }
                    if (ext === 'xlsx') { xlsxRows(buf).then(function (rows) { resolve(rowsToParts(rows)); }, reject); return; }
                    var text = decodeText(buf), tr = text.replace(/^﻿/, '').trim();
                    if (ext === 'project' || ext === 'xml' || tr.charAt(0) === '<') resolve(projectToParts(tr));
                    else if (ext === 'json' || tr.charAt(0) === '{' || tr.charAt(0) === '[') resolve(jsonToParts(JSON.parse(tr)));
                    else resolve(rowsToParts(parseDelimited(text)));
                } catch (e) { reject(e); }
            };
            fr.readAsArrayBuffer(file);
        });
    }

    /* Материалы из файла -> материалы работы; размер листа берём из уже известных материалов или ставим 2800×2070 */
    function buildImportedWork(res, fileName) {
        var known = state.materials, byKey = {}, mats = [], noSize = [];
        function findKnown(name) {
            var n = name.trim().toLowerCase();
            return known.filter(function (m) { return m.name.trim().toLowerCase() === n; })[0];
        }
        var fileMat = {};
        (res.mats || []).forEach(function (m) { if (m && m.name) fileMat[String(m.name).trim().toLowerCase()] = m; });
        var parts = res.parts.map(function (p) {
            var name = p.mat || t('m.fallback');
            if (p.th && !new RegExp('(^|\\D)' + String(p.th).replace('.', '[.,]') + '(\\D|$)').test(name)) name += ' ' + String(p.th).replace('.', ',') + ' ' + t('u.mm');
            var key = name.trim().toLowerCase();
            if (!byKey[key]) {
                var k = findKnown(name), f = fileMat[key] || fileMat[String(p.mat).trim().toLowerCase()];
                var spec = k ? Object.assign({}, k, { t: k.t || p.th || 0 })
                    : (f && num(f.l) && num(f.w) ? { name: name, l: num(f.l), w: num(f.w), price: num(f.price), edgePrice: num(f.edgePrice), t: p.th || num(f.thickness) }
                        : { name: name, l: 2800, w: 2070, price: 0, edgePrice: 0, t: p.th || 0 });
                if (!k && !(f && num(f.l) && num(f.w))) noSize.push(name);
                byKey[key] = newMat(spec); mats.push(byKey[key]);
            }
            return { name: p.name, mat: byKey[key].id, l: p.l, w: p.w, qty: p.qty, rotate: p.rotate, e: p.e };
        });
        var base = JSON.parse(JSON.stringify(state));
        return { st: { settings: base.settings, materials: mats, parts: parts }, noSize: noSize, name: (res.name || fileName.replace(/\.[^.]+$/, '')).trim().slice(0, 60) };
    }

    function addWorkWith(st, name) {
        var n = 0;
        projects.list.forEach(function (it) { if (it.n > n) n = it.n; });
        var id = 'p' + Date.now().toString(36) + Math.floor(Math.random() * 1000);
        var item = { id: id, n: n + 1, name: name || '', u: Date.now(), f: activeItem().f || '', state: st };
        saveNow();
        projects.list.push(item);
        projects.active = id;
        state = st;
        clearTimeout(timer);
        saveNow();
        renderAll(); renderTabs(); renderWorks(); updateBar();
        run(350);
        var head = document.getElementById('rk-h-parts');
        if (head) head.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    var impFile = $('#rk-import-file'), impNote = $('#rk-import-note');
    function impMsg(msg) { impNote.textContent = msg; impNote.hidden = !msg; }

    /* Копия всех работ: один файл .json, из него работы возвращаются (добавляются к текущим) */
    function backupName() {
        var d = new Date(), z = function (n) { return (n < 10 ? '0' : '') + n; };
        return 'raskroy-backup-' + d.getFullYear() + '-' + z(d.getMonth() + 1) + '-' + z(d.getDate()) + '.json';
    }
    function downloadBackup() {
        saveNow();
        var data = { app: 'raskroy', format: 1, saved: new Date().toISOString(), projects: projects };
        if (window.RKFabricApp) { var fb = window.RKFabricApp.exportState(); if (fb && fb.list && fb.list.length) data.fabric = fb; }
        saveBlob(backupName(), new Blob([JSON.stringify(data, null, 1)], { type: 'application/json' }));
        toast(t('bk.done', { n: projects.list.length }));
    }
    function restoreBackup(obj) {
        var src = obj && obj.projects && obj.projects.list;
        if (!obj || obj.app !== 'raskroy' || !Array.isArray(src)) return -1;
        var nmax = 0, ids = {}, added = 0;
        projects.list.forEach(function (it) { if (it.n > nmax) nmax = it.n; ids[it.id] = 1; });
        var fmap = {};
        (Array.isArray(obj.projects.folders) ? obj.projects.folders : []).forEach(function (fo) {
            if (!fo || !fo.id) return;
            var fid = String(fo.id), have = projects.folders.filter(function (x) { return x.id === fid; })[0];
            if (!have) { have = { id: fid, name: String(fo.name || '').slice(0, 60), open: true }; projects.folders.push(have); }
            fmap[fid] = have.id;
        });
        src.forEach(function (it) {
            var st = normalizeState(it && it.state);
            if (!st) return;
            var id = String((it && it.id) || '');
            if (!id || ids[id]) id = 'p' + Date.now().toString(36) + Math.floor(Math.random() * 1000) + added;
            ids[id] = 1;
            projects.list.push({ id: id, n: ++nmax, name: String(it.name || '').slice(0, 60), u: Number(it.u) || Date.now(), f: fmap[String(it.f)] || '', state: st });
            added++;
        });
        if (added) { saveNow(); renderTabs(); renderWorks(); }
        if (obj.fabric && window.RKFabricApp) added += window.RKFabricApp.importState(obj.fabric);
        return added;
    }
    function readJsonFile(f) {
        return new Promise(function (resolve, reject) {
            var fr = new FileReader();
            fr.onerror = function () { reject(new Error('read')); };
            fr.onload = function () { try { resolve(JSON.parse(decodeText(fr.result).replace(/^\uFEFF/, ''))); } catch (e) { reject(e); } };
            fr.readAsArrayBuffer(f);
        });
    }
    function restoreFile(f) {
        readJsonFile(f).then(function (obj) {
            var n = restoreBackup(obj || {});
            if (n < 0) { toast(t('bk.bad')); return; }
            toast(n ? t('bk.restored', { n: n }) : t('bk.bad'));
            var w = document.getElementById('rk-h-works');
            if (n && w) w.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }).catch(function () { toast(t('bk.bad')); });
    }

    /* Единая точка открытия файла: кнопка «Импорт», перетаскивание, «Открыть с помощью», двойной клик по .project */
    function importFile(f) {
        if (!f) return;
        if (/\.json$/i.test(f.name)) {
            /* копия работ из этого приложения распознаётся сразу */
            readJsonFile(f).then(function (obj) {
                if (obj && obj.app === 'raskroy' && obj.projects) restoreFile(f);
                else importParts(f);
            }, function () { importParts(f); });
            return;
        }
        importParts(f);
    }
    function importParts(f) {
        readImportFile(f).then(function (res) {
            if (!res.parts.length) { impMsg(t('imp.fail')); toast(t('imp.fail')); return; }
            var w = buildImportedWork(res, f.name);
            addWorkWith(w.st, w.name);
            var msg = t('imp.done', { n: fmt(w.st.parts.reduce(function (s, p) { return s + p.qty; }, 0)), m: w.st.materials.length });
            toast(msg);
            if (res.skipped) msg += ' ' + t('imp.skip', { s: res.skipped });
            if (w.noSize.length) msg += ' ' + t('imp.size', { list: w.noSize.join(', ') });
            impMsg(msg);
        }).catch(function (e) {
            var m = e && e.message === 'xls' ? t('imp.xls') : t('imp.err');
            impMsg(m); toast(m);
        });
    }
    $('#rk-import').addEventListener('click', function () { impFile.value = ''; impFile.click(); });
    impFile.addEventListener('change', function () { importFile(impFile.files && impFile.files[0]); });
    $('#rk-backup').addEventListener('click', downloadBackup);
    var restFile = $('#rk-restore-file');
    $('#rk-restore').addEventListener('click', function () { restFile.value = ''; restFile.click(); });
    restFile.addEventListener('change', function () { if (restFile.files && restFile.files[0]) restoreFile(restFile.files[0]); });

    $('#rk-zip-all').addEventListener('click', function () { downloadAllPdf(this); });
    $('#rk-xlsx-all').addEventListener('click', function () { downloadAllXlsx(this); });
    $('#rk-zip-desk').addEventListener('click', function () { downloadAllZip(this); });

    /* список обновляем, когда раздел попадает на экран, и при любых действиях с вкладками */
    var worksSec = document.getElementById('rk-works');
    if (worksSec && 'IntersectionObserver' in window) {
        new IntersectionObserver(function (es) { if (es[0].isIntersecting) renderWorks(); }, { rootMargin: '200px' }).observe(worksSec);
    } else renderWorks();

    $('#rk-print').addEventListener('click', function () { window.print(); });

    /* ---------- Смена языка ---------- */
    /* ---------- Вкладки работ ---------- */
    function workLabel(it) { return it.name || t('w.default', { n: it.n }); }

    function renderTabs() {
        var box = $('#rk-tabs');
        if (!box) return;
        box.innerHTML = '';
        var many = projects.list.length > 1;
        var wb = document.querySelector('.rk-island a[data-spy="rk-h-works"]');
        if (wb) { if (many) wb.setAttribute('data-badge', String(projects.list.length)); else wb.removeAttribute('data-badge'); }
        projects.list.forEach(function (it) {
            var on = it.id === projects.active;
            var tab = el('div', 'rk-tab' + (on ? ' is-active' : ''));
            var label = workLabel(it);
            if (on) {
                /* название активной работы правится прямо во вкладке */
                var inp = el('input', 'rk-tab-name', { type: 'text', maxlength: '60', autocomplete: 'off', spellcheck: 'false', 'aria-label': t('w.rename'), role: 'tab', 'aria-selected': 'true' });
                inp.value = label;
                inp.style.width = Math.max(6, inp.value.length + 1) + 'ch';
                inp.addEventListener('input', function () {
                    it.name = inp.value.trim().slice(0, 60);
                    inp.style.width = Math.max(6, inp.value.length + 1) + 'ch';
                    $('#rk-print-name').textContent = workLabel(it);
                    save();
                });
                inp.addEventListener('blur', function () { if (!inp.value.trim()) { it.name = ''; inp.value = workLabel(it); inp.style.width = Math.max(6, inp.value.length + 1) + 'ch'; } save(); });
                inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); inp.blur(); } });
                inp.addEventListener('focus', function () { try { inp.select(); } catch (err) { /* не страшно */ } });
                tab.appendChild(inp);
            } else {
                var b = el('button', 'rk-tab-btn', { type: 'button', role: 'tab', 'aria-selected': 'false' });
                b.textContent = label;
                b.addEventListener('click', function () { switchTo(it.id); });
                tab.appendChild(b);
            }
            if (many) {
                var x = el('button', 'rk-tab-x', { type: 'button', 'aria-label': t('w.close', { name: label }) });
                x.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7l10 10M17 7L7 17"/></svg>';
                x.addEventListener('click', function (e) { e.stopPropagation(); closeWork(it.id); });
                tab.appendChild(x);
            }
            box.appendChild(tab);
        });
        var cur = $('.rk-tab.is-active', box);
        if (cur) {
            /* двигаем только ленту вкладок: scrollIntoView заставлял браузер пересчитывать всю страницу */
            window.requestAnimationFrame(function () {
                var l = cur.offsetLeft, r = l + cur.offsetWidth;
                if (l < box.scrollLeft) box.scrollLeft = Math.max(0, l - 8);
                else if (r > box.scrollLeft + box.clientWidth) box.scrollLeft = r - box.clientWidth + 8;
            });
        }
        $('#rk-print-name').textContent = workLabel(activeItem());
    }

    function switchTo(id) {
        if (id === projects.active) return;
        saveNow();
        projects.active = id;
        state = activeItem().state;
        relocalize(state);
        clearTimeout(timer);
        saveNow();
        renderAll(); renderTabs(); renderWorks(); updateBar();
        if (impNote) impNote.hidden = true;
        run(350);
    }

    function toast(msg) {
        var box = $('#rk-toast');
        if (!box) return;
        box.textContent = msg;
        box.classList.add('is-on');
        clearTimeout(toast.t);
        toast.t = setTimeout(function () { box.classList.remove('is-on'); }, 2200);
    }

    /* новая работа берёт материалы и настройки текущей, детали пустые */
    function newWork(fid) {
        var n = 0;
        projects.list.forEach(function (it) { if (it.n > n) n = it.n; });
        var base = JSON.parse(JSON.stringify(state));
        var st = { settings: base.settings, materials: base.materials, parts: [{ name: '', mat: base.materials[0].id, l: 0, w: 0, qty: 1, rotate: true, e: [0, 0, 0, 0] }] };
        var id = 'p' + Date.now().toString(36) + Math.floor(Math.random() * 1000);
        var item = { id: id, n: n + 1, name: '', u: Date.now(), f: typeof fid === 'string' ? fid : (activeItem().f || ''), state: st };
        saveNow();
        projects.list.push(item);
        projects.active = id;
        state = st;
        clearTimeout(timer);
        saveNow();
        renderAll(); renderTabs(); renderWorks(); updateBar();
        run(350);
        toast(t('w.created', { name: workLabel(item) }));
        var head = document.getElementById('rk-h-parts');
        if (head) head.scrollIntoView({ behavior: 'smooth', block: 'start' });
        if (!(window.matchMedia && window.matchMedia('(pointer: coarse)').matches)) {
            setTimeout(function () { focusCell(0, 'name'); }, 350);
        }
    }

    function closeWork(id) {
        if (projects.list.length < 2) return;
        var idx = -1;
        projects.list.forEach(function (it, i) { if (it.id === id) idx = i; });
        if (idx < 0) return;
        RKDialog.ask(true, t('w.delconfirm', { name: workLabel(projects.list[idx]) }), { ok: t('d.delete'), danger: true }, function () {
            var wasActive = id === projects.active;
            projects.list.splice(idx, 1);
            if (wasActive) {
                projects.active = projects.list[Math.min(idx, projects.list.length - 1)].id;
                state = activeItem().state;
                relocalize(state);
                clearTimeout(timer);
                renderAll(); updateBar();
                run(350);
            }
            saveNow();
            renderTabs(); renderWorks();
        });
    }

    $$('[data-new], #rk-new').forEach(function (b) { b.addEventListener('click', newWork); });

    document.addEventListener('rk:lang', function () {
        relocalize(state);
        renderAll(); renderTabs(); renderWorks(); updateBar(); save();
        run(350);
    });

    /* ---------- Старт ---------- */
    function renderAll() { renderSettings(); renderMaterials(); renderParts(); }
    renderAll();
    renderTabs();
    updateBar();

    window.RKApp = { slug: slug, importFile: importFile, newWork: newWork, backup: downloadBackup, toast: toast, version: VERSION };

    function boot() { run(350); }
    if (window.Raskroy) boot();
    else window.addEventListener('load', boot);
})();
