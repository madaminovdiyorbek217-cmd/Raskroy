/* Сворачивание нумерованных разделов (1, 2, 3, 4): в свёрнутом виде остаётся только номер и название.
   Состояние запоминается. Если что-то прокручивает страницу к свёрнутому разделу
   (кнопки острова, «Результат», «Мои работы»), раздел сам разворачивается. */
(function () {
    'use strict';
    var KEY = 'rk-fold', saved = {};
    try { saved = JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { saved = {}; }
    function persist() { try { localStorage.setItem(KEY, JSON.stringify(saved)); } catch (e) { /* без сохранения тоже работает */ } }
    function t(key, fb) {
        try { var v = window.RKI18N && window.RKI18N.t ? window.RKI18N.t(key) : ''; return v && v !== key ? v : fb; } catch (e) { return fb; }
    }
    function stepId(step) {
        var h = step.querySelector('.rk-step-head h2');
        return h ? h.id : '';
    }
    function titleOf(step) {
        var h = step.querySelector('.rk-step-head h2');
        return h ? h.textContent.trim() : '';
    }
    function label(step) {
        var b = step.querySelector('.rk-fold-btn'); if (!b) return;
        var folded = step.classList.contains('is-folded');
        b.setAttribute('aria-expanded', folded ? 'false' : 'true');
        b.setAttribute('aria-label', (folded ? t('fold.open', 'Развернуть раздел') : t('fold.close', 'Свернуть раздел')) + ': ' + titleOf(step));
        b.title = folded ? t('fold.open', 'Развернуть раздел') : t('fold.close', 'Свернуть раздел');
    }
    function setFold(step, folded, keep) {
        step.classList.toggle('is-folded', folded);
        label(step);
        var id = stepId(step);
        if (id && !keep) { if (folded) saved[id] = 1; else delete saved[id]; persist(); }
    }
    function init(step) {
        var head = step.querySelector(':scope > .rk-step-head'); if (!head || head.querySelector('.rk-fold-btn')) return;
        var btn = document.createElement('button');
        btn.type = 'button'; btn.className = 'rk-fold-btn';
        btn.innerHTML = '<i class="rk-fold-chev" aria-hidden="true"></i>';
        var titleBox = head.children[1];
        if (titleBox && titleBox.nextSibling) head.insertBefore(btn, titleBox.nextSibling); else head.appendChild(btn);
        head.classList.add('rk-foldable');
        label(step);
        if (saved[stepId(step)]) setFold(step, true, true);
    }
    function scan() { Array.prototype.forEach.call(document.querySelectorAll('.rk-step'), init); }

    document.addEventListener('click', function (e) {
        var tg = e.target;
        if (!tg.closest) return;
        var head = tg.closest('.rk-foldable');
        if (head) {
            /* нажатие на кнопки и поля в шапке (например, «Копия работ») раздел не сворачивает */
            var inner = tg.closest('button, a, input, select, label, .rk-wtools');
            if (!inner || inner.classList.contains('rk-fold-btn')) {
                var step = head.closest('.rk-step');
                setFold(step, !step.classList.contains('is-folded'));
                return;
            }
        }
        /* переход по ссылке к свёрнутому разделу (кнопки острова) разворачивает его */
        var a = tg.closest('a[href^="#"]');
        if (a && a.getAttribute('href').length > 1) {
            var target = document.getElementById(a.getAttribute('href').slice(1));
            var st = target && target.closest('.rk-step.is-folded');
            if (st) setFold(st, false);
        }
    }, true);

    /* любая программная прокрутка к элементу внутри свёрнутого раздела сначала разворачивает его */
    var orig = Element.prototype.scrollIntoView;
    Element.prototype.scrollIntoView = function () {
        var st = this.closest && this.closest('.rk-step.is-folded');
        if (st) setFold(st, false);
        return orig.apply(this, arguments);
    };

    document.addEventListener('rk:lang', function () { Array.prototype.forEach.call(document.querySelectorAll('.rk-step'), label); });
    window.RKFold = { set: setFold, openAll: function () { Array.prototype.forEach.call(document.querySelectorAll('.rk-step.is-folded'), function (s) { setFold(s, false); }); } };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', scan); else scan();
})();
