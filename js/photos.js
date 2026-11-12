/* Галерея «Фото листов»: каждый лист раскроя отдельной картинкой.
   RKPhotos.open({ title, items: [{ name, label, blob }] }) */
(function () {
    'use strict';
    var cur = null;

    function tr(k, fb, p) { try { var v = window.RKI18N ? window.RKI18N.t(k, p) : ''; return v && v !== k ? v : fb; } catch (e) { return fb; } }
    function el(tag, cls, text) { var n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; }
    function sizeText(n) { return n < 1048576 ? Math.max(1, Math.round(n / 1024)) + ' ' + tr('x.kb', 'КБ') : (n / 1048576).toFixed(1).replace('.', ',') + ' ' + tr('x.mb', 'МБ'); }

    function close() {
        if (!cur) return;
        var c = cur; cur = null;
        document.removeEventListener('keydown', c.key, true);
        c.urls.forEach(function (u) { URL.revokeObjectURL(u); });
        c.wrap.remove();
        document.documentElement.classList.remove('rkx-lock');
        if (c.prev && c.prev.focus) { try { c.prev.focus({ preventScroll: true }); } catch (e) { /* не страшно */ } }
    }

    function open(o) {
        if (cur) close();
        var items = (o.items || []).filter(function (x) { return x && x.blob; });
        if (!items.length) return;
        var wrap = el('div', 'rkx-wrap rkp-wrap'); wrap.setAttribute('role', 'dialog'); wrap.setAttribute('aria-modal', 'true');
        var card = el('div', 'rkx-card rkp-card');
        var head = el('div', 'rkp-head');
        var ttl = el('div', 'rkp-title', o.title || tr('ph.title', 'Фото листов'));
        var x = el('button', 'rkc-x'); x.type = 'button'; x.setAttribute('aria-label', tr('lk.close', 'Закрыть'));
        x.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7l10 10M17 7L7 17"/></svg>';
        head.appendChild(ttl); head.appendChild(x);
        var sub = el('p', 'rkp-sub', tr('ph.sub', 'Каждый лист — отдельная картинка. Нажмите на картинку, чтобы увеличить.'));
        var list = el('div', 'rkp-list');
        var urls = [];
        items.forEach(function (it) {
            var url = URL.createObjectURL(it.blob); urls.push(url);
            var row = el('figure', 'rkp-item');
            var img = el('img', 'rkp-img'); img.src = url; img.alt = it.label || it.name; img.loading = 'lazy';
            img.addEventListener('click', function () { row.classList.toggle('is-big'); });
            var cap = el('figcaption', 'rkp-cap');
            var nm = el('div', 'rkp-nm'); nm.appendChild(el('b', '', it.label || it.name)); nm.appendChild(el('span', '', it.name + ' · ' + sizeText(it.blob.size)));
            var b = el('button', 'rk-btn rk-btn--ghost rk-btn--sm rkp-dl', tr('ph.save', 'Скачать фото')); b.type = 'button';
            b.addEventListener('click', function () { if (window.RKExport) RKExport.save(it.name, it.blob); });
            cap.appendChild(nm); cap.appendChild(b);
            row.appendChild(img); row.appendChild(cap); list.appendChild(row);
        });
        var foot = el('div', 'rkp-foot');
        if (items.length > 1) {
            var all = el('button', 'rk-btn rk-btn--main rkp-all', tr('ph.all', 'Скачать все ({n})', { n: items.length })); all.type = 'button';
            all.addEventListener('click', function () { if (window.RKExport) RKExport.saveMany(items.map(function (i) { return { name: i.name, blob: i.blob }; })); });
            foot.appendChild(all);
        }
        var cl = el('button', 'rk-btn rk-btn--ghost rkp-close', tr('x.close', 'Закрыть')); cl.type = 'button';
        foot.appendChild(cl);
        card.appendChild(head); card.appendChild(sub); card.appendChild(list); card.appendChild(foot);
        wrap.appendChild(card);
        x.addEventListener('click', close); cl.addEventListener('click', close);
        wrap.addEventListener('click', function (e) { if (e.target === wrap) close(); });
        var state = { wrap: wrap, urls: urls, prev: document.activeElement };
        state.key = function (e) { if (e.key === 'Escape' && !document.querySelector('.rkx-wrap:not(.rkp-wrap)')) { e.preventDefault(); e.stopPropagation(); close(); } };
        document.addEventListener('keydown', state.key, true);
        cur = state;
        document.body.appendChild(wrap);
        document.documentElement.classList.add('rkx-lock');
        try { (items.length > 1 ? foot.firstChild : cl).focus({ preventScroll: true }); } catch (e) { /* не страшно */ }
    }
    window.RKPhotos = { open: open, close: close };
})();
