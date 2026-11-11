/* Свои окна подтверждения вместо системных «Подтвердите действие на …github.io».
   RKDialog.confirm(текст, {ok, danger}) -> Promise<boolean>;  RKDialog.ask(условие, текст, опции, действие). */
(function () {
    'use strict';
    var cur = null;
    function tr(key, fb) {
        try { var v = window.RKI18N && window.RKI18N.t ? window.RKI18N.t(key) : ''; return v && v !== key ? v : fb; } catch (e) { return fb; }
    }
    function close(res) {
        if (!cur) return;
        var c = cur; cur = null;
        c.wrap.remove();
        document.documentElement.classList.remove('rkx-lock');
        document.removeEventListener('keydown', c.key, true);
        if (c.prev && c.prev.focus) { try { c.prev.focus({ preventScroll: true }); } catch (e) { /* не страшно */ } }
        c.done(res);
    }
    function confirmDialog(msg, opts) {
        opts = opts || {};
        if (cur) close(false);
        return new Promise(function (done) {
            var wrap = document.createElement('div');
            wrap.className = 'rkx-wrap'; wrap.setAttribute('role', 'alertdialog'); wrap.setAttribute('aria-modal', 'true');
            wrap.innerHTML = '<div class="rkx-card rkd-card"><div class="rkd-msg"></div><div class="rkd-btns"><button type="button" class="rk-btn rk-btn--ghost rkd-no"></button><button type="button" class="rk-btn rkd-yes"></button></div></div>';
            var q = function (s) { return wrap.querySelector(s); };
            q('.rkd-msg').textContent = msg;
            q('.rkd-no').textContent = opts.cancel || tr('d.cancel', 'Отмена');
            var yes = q('.rkd-yes');
            yes.textContent = opts.ok || tr('d.ok', 'ОК');
            yes.classList.add(opts.danger ? 'rkd-danger' : 'rk-btn--main');
            q('.rkd-no').addEventListener('click', function () { close(false); });
            yes.addEventListener('click', function () { close(true); });
            wrap.addEventListener('click', function (e) { if (e.target === wrap) close(false); });
            function key(e) {
                if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(false); }
                else if (e.key === 'Enter' && document.activeElement !== q('.rkd-no')) { e.preventDefault(); e.stopPropagation(); close(true); }
            }
            document.addEventListener('keydown', key, true);
            cur = { wrap: wrap, done: done, key: key, prev: document.activeElement };
            document.body.appendChild(wrap);
            document.documentElement.classList.add('rkx-lock');
            try { (opts.danger ? q('.rkd-no') : yes).focus({ preventScroll: true }); } catch (e) { /* не страшно */ }
        });
    }
    /* если условие не выполнено, действие идёт сразу; иначе после «ОК» */
    function ask(cond, msg, opts, go) {
        if (!cond) { go(); return; }
        confirmDialog(msg, opts).then(function (ok) { if (ok) go(); });
    }
    window.RKDialog = { confirm: confirmDialog, ask: ask };
})();
