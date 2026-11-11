/* Свой выпадающий список вместо системного окна браузера.
   Настоящий <select> остаётся в странице (скрытый), поэтому остальной код читает и пишет его значение как раньше.
   На телефоне список открывается снизу листом, на компьютере выпадает под полем. */
(function () {
    'use strict';
    var doc = document;
    var pop = null, backdrop = null, openFor = null, activeIdx = -1, typed = '', typedAt = 0, sheetMode = false;
    var desc = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value');

    function t(key, fallback) {
        var I = window.RKI18N;
        try { var v = I && I.t ? I.t(key) : ''; return v && v !== key ? v : fallback; } catch (e) { return fallback; }
    }
    function el(tag, cls, attrs) {
        var n = doc.createElement(tag);
        if (cls) n.className = cls;
        if (attrs) for (var k in attrs) n.setAttribute(k, attrs[k]);
        return n;
    }
    function coarse() {
        try { return window.matchMedia('(hover: none) and (pointer: coarse), (max-width: 700px)').matches; } catch (e) { return false; }
    }

    /* ---------- Кнопка вместо select ---------- */
    function labelText(sel) {
        var o = sel.options[sel.selectedIndex];
        return o ? o.textContent : '';
    }
    function sync(sel) {
        var b = sel._rks; if (!b) return;
        var txt = labelText(sel);
        b.firstChild.textContent = txt || '—';
        b.disabled = sel.disabled || !sel.options.length;
        var aria = sel.getAttribute('aria-label');
        if (aria) b.setAttribute('aria-label', aria + ': ' + txt);
    }
    function enhance(sel) {
        if (sel._rks || sel.multiple || sel.size > 1 || sel.hasAttribute('data-native')) return;
        var b = el('button', 'rk-input rks-btn', { type: 'button', 'aria-haspopup': 'listbox', 'aria-expanded': 'false' });
        b.appendChild(doc.createElement('span'));
        b.appendChild(el('i', 'rks-chev'));
        if (sel.id) b.setAttribute('data-for', sel.id);
        sel._rks = b;
        sel.classList.add('rks-native');
        sel.tabIndex = -1;
        sel.setAttribute('aria-hidden', 'true');
        sel.parentNode.insertBefore(b, sel.nextSibling);
        /* присвоение sel.value из кода тоже обновляет подпись */
        try {
            Object.defineProperty(sel, 'value', {
                configurable: true,
                get: function () { return desc.get.call(this); },
                set: function (v) { desc.set.call(this, v); sync(this); }
            });
        } catch (e) { /* без перехвата подпись обновится при открытии и при изменении списка */ }
        sel.addEventListener('change', function () { sync(sel); });
        sel.addEventListener('focus', function () { b.focus(); });
        b.addEventListener('click', function (e) { e.preventDefault(); if (openFor === sel) close(true); else open(sel); });
        b.addEventListener('keydown', function (e) {
            if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); if (openFor !== sel) open(sel); }
        });
        sync(sel);
    }
    function scan(root) {
        var list = root.nodeType === 1 && root.tagName === 'SELECT' ? [root] : (root.querySelectorAll ? root.querySelectorAll('select') : []);
        Array.prototype.forEach.call(list, enhance);
    }

    /* ---------- Открытие и закрытие ---------- */
    function build() {
        backdrop = el('div', 'rks-back'); backdrop.hidden = true;
        pop = el('div', 'rks-pop', { role: 'presentation' }); pop.hidden = true;
        doc.body.appendChild(backdrop); doc.body.appendChild(pop);
        backdrop.addEventListener('pointerdown', function (e) { e.preventDefault(); });
        backdrop.addEventListener('click', function () { close(true); });
        pop.addEventListener('click', function (e) {
            var li = e.target.closest ? e.target.closest('[data-i]') : null;
            if (li) choose(+li.getAttribute('data-i'));
            else if (e.target.closest && e.target.closest('.rks-x')) close(true);
        });
    }
    function titleOf(sel) {
        var a = sel.getAttribute('aria-label'); if (a) return a;
        var lab = sel.closest ? sel.closest('label') : null;
        var sp = lab && lab.querySelector('span');
        if (sp) {
            var c = sp.cloneNode(true);
            Array.prototype.forEach.call(c.querySelectorAll('.rk-help, svg, button'), function (n) { n.remove(); });
            return c.textContent.trim();
        }
        return '';
    }
    function open(sel) {
        if (!pop) build();
        if (openFor) close(false);
        sync(sel);
        var b = sel._rks, opts = sel.options;
        sheetMode = false; /* на телефоне тоже выпадает под полем: так список выглядит частью приложения, а не окном системы */
        openFor = sel; activeIdx = sel.selectedIndex;
        pop.innerHTML = '';
        pop.className = 'rks-pop ' + (sheetMode ? 'is-sheet' : 'is-drop');
        if (sheetMode) {
            var head = el('div', 'rks-head');
            var h = el('div', 'rks-title'); h.textContent = titleOf(sel);
            var x = el('button', 'rks-x', { type: 'button', 'aria-label': t('sel.close', 'Закрыть') });
            x.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7l10 10M17 7L7 17"/></svg>';
            head.appendChild(h); head.appendChild(x);
            pop.appendChild(head);
        }
        var ul = el('ul', 'rks-list', { role: 'listbox', tabindex: '-1' });
        if (titleOf(sel)) ul.setAttribute('aria-label', titleOf(sel));
        for (var i = 0; i < opts.length; i++) {
            var li = el('li', 'rks-opt' + (i === sel.selectedIndex ? ' is-sel' : '') + (opts[i].disabled ? ' is-dis' : ''), { role: 'option', 'data-i': String(i), 'aria-selected': String(i === sel.selectedIndex), id: 'rks-o' + i });
            var sp = el('span', 'rks-t'); sp.textContent = opts[i].textContent;
            li.appendChild(sp);
            li.appendChild(el('i', 'rks-ck'));
            ul.appendChild(li);
        }
        pop.appendChild(ul);
        pop.hidden = false;
        b.setAttribute('aria-expanded', 'true');
        if (sheetMode) {
            backdrop.hidden = false;
            doc.documentElement.classList.add('rks-lock');
            requestAnimationFrame(function () { pop.classList.add('is-in'); backdrop.classList.add('is-in'); });
        } else {
            /* прозрачная подложка: касание мимо списка только закрывает его и не нажимает кнопку под ним */
            backdrop.hidden = false; backdrop.classList.add('is-clear');
            place(b);
            requestAnimationFrame(function () { pop.classList.add('is-in'); });
        }
        var cur = ul.querySelector('.is-sel');
        if (cur) { try { ul.scrollTop = Math.max(0, cur.offsetTop - ul.clientHeight / 2 + cur.offsetHeight / 2); } catch (e) { /* не страшно */ } }
        ul.setAttribute('aria-activedescendant', activeIdx >= 0 ? 'rks-o' + activeIdx : '');
        if (!sheetMode) { try { ul.focus({ preventScroll: true }); } catch (e) { /* не страшно */ } }
        doc.addEventListener('keydown', onKey, true);
        doc.addEventListener('pointerdown', onOutside, true);
        window.addEventListener('resize', onResize);
        window.addEventListener('scroll', onScroll, true);
    }
    function place(b) {
        var r = b.getBoundingClientRect(), vh = window.innerHeight;
        var ul = pop.querySelector('.rks-list');
        var want = Math.min(ul.scrollHeight + 12, 320), below = vh - r.bottom - 12, above = r.top - 12;
        var up = below < Math.min(want, 200) && above > below;
        var h = Math.max(120, Math.min(want, up ? above : below));
        pop.style.left = Math.max(8, Math.min(r.left, window.innerWidth - Math.max(r.width, 180) - 8)) + 'px';
        pop.style.minWidth = r.width + 'px'; pop.style.maxWidth = (window.innerWidth - 16) + 'px';
        pop.style.maxHeight = h + 'px';
        if (up) { pop.style.top = 'auto'; pop.style.bottom = (vh - r.top + 6) + 'px'; }
        else { pop.style.bottom = 'auto'; pop.style.top = (r.bottom + 6) + 'px'; }
    }
    function close(focus) {
        if (!openFor) return;
        var sel = openFor, b = sel._rks;
        openFor = null;
        b.setAttribute('aria-expanded', 'false');
        doc.removeEventListener('keydown', onKey, true);
        doc.removeEventListener('pointerdown', onOutside, true);
        window.removeEventListener('resize', onResize);
        window.removeEventListener('scroll', onScroll, true);
        doc.documentElement.classList.remove('rks-lock');
        pop.classList.remove('is-in'); backdrop.classList.remove('is-in', 'is-clear');
        var p = pop, bd = backdrop;
        var wasSheet = sheetMode;
        if (wasSheet) setTimeout(function () { if (!openFor) { p.hidden = true; bd.hidden = true; } }, 200);
        else { p.hidden = true; bd.hidden = true; }
        if (focus) { try { b.focus({ preventScroll: true }); } catch (e) { /* не страшно */ } }
    }
    function choose(i) {
        var sel = openFor; if (!sel) return;
        var o = sel.options[i];
        if (!o || o.disabled) return;
        var changed = sel.selectedIndex !== i;
        sel.selectedIndex = i;
        sync(sel);
        close(true);
        if (changed) {
            sel.dispatchEvent(new Event('input', { bubbles: true }));
            sel.dispatchEvent(new Event('change', { bubbles: true }));
        }
    }
    function mark(i) {
        var ul = pop.querySelector('.rks-list'); if (!ul) return;
        var items = ul.children;
        if (i < 0 || i >= items.length) return;
        activeIdx = i;
        Array.prototype.forEach.call(items, function (n) { n.classList.remove('is-act'); });
        items[i].classList.add('is-act');
        ul.setAttribute('aria-activedescendant', 'rks-o' + i);
        var it = items[i];
        if (it.offsetTop < ul.scrollTop) ul.scrollTop = it.offsetTop;
        else if (it.offsetTop + it.offsetHeight > ul.scrollTop + ul.clientHeight) ul.scrollTop = it.offsetTop + it.offsetHeight - ul.clientHeight;
    }
    function onKey(e) {
        if (!openFor) return;
        var n = openFor.options.length;
        if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(true); }
        else if (e.key === 'ArrowDown') { e.preventDefault(); mark(Math.min(n - 1, activeIdx + 1)); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); mark(Math.max(0, activeIdx - 1)); }
        else if (e.key === 'Home') { e.preventDefault(); mark(0); }
        else if (e.key === 'End') { e.preventDefault(); mark(n - 1); }
        else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); choose(activeIdx); }
        else if (e.key === 'Tab') { close(false); }
        else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
            var now = Date.now();
            typed = (now - typedAt > 800 ? '' : typed) + e.key.toLowerCase(); typedAt = now;
            for (var i = 0; i < n; i++) if (openFor.options[i].textContent.trim().toLowerCase().indexOf(typed) === 0) { mark(i); break; }
        }
    }
    function onOutside(e) {
        if (!openFor) return;
        if (pop.contains(e.target) || (openFor._rks && openFor._rks.contains(e.target))) return;
        if (!sheetMode) close(false);
    }
    function onResize() { if (!openFor) return; if (sheetMode) return; close(false); }
    function onScroll(e) { if (openFor && !sheetMode && !pop.contains(e.target)) close(false); }

    /* ---------- Запуск ---------- */
    function start() {
        scan(doc.body);
        new MutationObserver(function (list) {
            list.forEach(function (m) { Array.prototype.forEach.call(m.addedNodes, function (n) { if (n.nodeType === 1) scan(n); }); });
        }).observe(doc.body, { childList: true, subtree: true });
    }
    if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', start); else start();
    window.RKSelect = { refresh: function () { Array.prototype.forEach.call(doc.querySelectorAll('select'), sync); } };
})();
