/* Профили: логин и пароль, у каждого профиля свои работы и ткани.
   Всё хранится в памяти этого браузера или приложения (localStorage), на сервер ничего не уходит.
   Пароль в открытом виде не хранится: только хэш PBKDF2-SHA256 с солью.
   Работам профиля даётся своя «полка»: ключ 'rk-projects-v1' превращается в 'rk-projects-v1@<id профиля>'.
   Остальной код читает и пишет через RKAuth.get / RKAuth.set, а до входа (экран входа закрывает всё) не сохраняет ничего. */
(function () {
    'use strict';

    var UKEY = 'rk-users-v1';       /* список профилей */
    var SKEY = 'rk-session';        /* кто сейчас вошёл */
    var LKEY = 'rk-lastuser';       /* последний вошедший логин, подставляется в форму */
    var DATA = ['rk-projects-v1', 'rk-project-v1', 'rk-fabric-v1'];   /* что принадлежит профилю */
    var ITER = 100000;
    var frozen = false, cur = null, fails = 0;

    function storageOK() {
        try { var k = '__rk_t'; localStorage.setItem(k, '1'); localStorage.removeItem(k); return true; } catch (e) { return false; }
    }
    var OK = storageOK();

    /* ---------- Список профилей и сессия ---------- */
    function readUsers() {
        try {
            var o = JSON.parse(localStorage.getItem(UKEY) || 'null');
            if (o && Array.isArray(o.list)) return o.list.filter(function (u) { return u && u.id && u.login && u.key && u.salt && u.hash; });
        } catch (e) { /* пусто или повреждено */ }
        return [];
    }
    function writeUsers(list) { localStorage.setItem(UKEY, JSON.stringify({ v: 1, list: list })); }
    function getSid() {
        var s = null;
        try { s = sessionStorage.getItem(SKEY); } catch (e) { /* не страшно */ }
        if (!s) { try { s = localStorage.getItem(SKEY); } catch (e2) { /* не страшно */ } }
        return s;
    }
    function setSid(id, stay) {
        try { sessionStorage.removeItem(SKEY); } catch (e) { /* не страшно */ }
        try { localStorage.removeItem(SKEY); } catch (e2) { /* не страшно */ }
        if (id) { try { (stay ? localStorage : sessionStorage).setItem(SKEY, id); } catch (e3) { /* не страшно */ } }
    }

    var users = OK ? readUsers() : [];
    if (OK) { var sid0 = getSid(); cur = users.filter(function (u) { return u.id === sid0; })[0] || null; }

    /* ---------- Хэш пароля ---------- */
    function rand(n) {
        var a = new Uint8Array(n);
        if (window.crypto && crypto.getRandomValues) crypto.getRandomValues(a);
        else for (var i = 0; i < n; i++) a[i] = Math.floor(Math.random() * 256);
        return a;
    }
    function toB64(u8) { var s = ''; for (var i = 0; i < u8.length; i++) s += String.fromCharCode(u8[i]); return btoa(s); }
    function fromB64(s) { var b = atob(s), a = new Uint8Array(b.length); for (var i = 0; i < b.length; i++) a[i] = b.charCodeAt(i); return a; }
    /* запасной вариант без Web Crypto (страница открыта не по https): слабее, но пароль всё равно не лежит открытым текстом */
    function weak(s) {
        var h1 = 0xdeadbeef, h2 = 0x41c6ce57;
        for (var r = 0; r < 2000; r++) {
            for (var i = 0; i < s.length; i++) {
                var c = s.charCodeAt(i);
                h1 = Math.imul(h1 ^ c, 2654435761); h2 = Math.imul(h2 ^ c, 1597334677);
            }
            h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
            h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
        }
        return (h2 >>> 0).toString(16) + (h1 >>> 0).toString(16);
    }
    function hashPw(pw, salt, iter, alg) {
        var c = window.crypto && crypto.subtle;
        if (alg === 'p' || (!alg && c)) {
            if (!c) return Promise.reject({ code: 'nocrypto' });
            return c.importKey('raw', new TextEncoder().encode(pw), 'PBKDF2', false, ['deriveBits']).then(function (k) {
                return c.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: fromB64(salt), iterations: iter }, k, 256);
            }).then(function (bits) { return 'p:' + toB64(new Uint8Array(bits)); });
        }
        return Promise.resolve('w:' + weak(salt + '|' + pw));
    }
    function verify(u, pw) {
        return hashPw(pw, u.salt, u.iter || ITER, u.hash.charAt(0)).then(function (h) { return h === u.hash; });
    }

    /* ---------- Логины ---------- */
    function cleanLogin(s) { return String(s || '').replace(/[\u0000-\u001f\u007f]/g, '').replace(/\s+/g, ' ').trim(); }
    function checkLogin(s) { s = cleanLogin(s); return s.length >= 2 && s.length <= 30 ? s : null; }
    function newId() { return 'u' + Date.now().toString(36) + Math.floor(Math.random() * 46656).toString(36); }
    function rej(code) { return Promise.reject({ code: code }); }

    /* Прежние работы с этого устройства (до появления профилей) становятся работами первого профиля */
    function migrate(id) {
        DATA.forEach(function (k) {
            var v = localStorage.getItem(k);
            if (v == null) return;
            localStorage.removeItem(k);
            try { localStorage.setItem(k + '@' + id, v); } catch (e) { localStorage.setItem(k, v); throw e; }
        });
    }
    function hasLegacy() {
        if (!OK) return false;
        try { return DATA.some(function (k) { return localStorage.getItem(k) != null; }); } catch (e) { return false; }
    }

    function register(login, pw, stay) {
        login = checkLogin(login);
        if (!login) return rej('login');
        if (String(pw).length < 4) return rej('pass');
        users = readUsers();
        var key = login.toLowerCase();
        if (users.some(function (u) { return u.key === key; })) return rej('exists');
        var first = users.length === 0, salt = toB64(rand(16));
        return hashPw(pw, salt, ITER).then(function (h) {
            var u = { id: newId(), login: login, key: key, salt: salt, iter: ITER, hash: h, created: Date.now() };
            users.push(u);
            try { if (first) migrate(u.id); writeUsers(users); } catch (e) { throw { code: 'store' }; }
            setSid(u.id, stay);
            try { localStorage.setItem(LKEY, login); } catch (e2) { /* не страшно */ }
            return u;
        });
    }
    function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
    function signIn(name, pw, stay) {
        users = readUsers();
        var key = cleanLogin(name).toLowerCase();
        var u = users.filter(function (x) { return x.key === key; })[0];
        var pause = fails >= 3 ? Math.min(fails - 2, 5) * 800 : 0;
        if (!u) { fails++; return wait(pause).then(function () { return rej('bad'); }); }
        return verify(u, pw).then(function (ok) {
            if (!ok) { fails++; return wait(pause).then(function () { return rej('bad'); }); }
            fails = 0;
            setSid(u.id, stay);
            try { localStorage.setItem(LKEY, u.login); } catch (e) { /* не страшно */ }
            return u;
        });
    }
    function changePw(oldPw, newPw) {
        if (!cur) return rej('bad');
        if (String(newPw).length < 4) return rej('pass');
        users = readUsers();
        var u = users.filter(function (x) { return x.id === cur.id; })[0];
        if (!u) return rej('bad');
        return verify(u, oldPw).then(function (ok) {
            if (!ok) return rej('old');
            var salt = toB64(rand(16));
            return hashPw(newPw, salt, ITER).then(function (h) {
                u.salt = salt; u.iter = ITER; u.hash = h;
                try { writeUsers(users); } catch (e) { throw { code: 'store' }; }
                cur = u;
            });
        });
    }
    function removeCurrent(pw) {
        if (!cur) return rej('bad');
        users = readUsers();
        var u = users.filter(function (x) { return x.id === cur.id; })[0];
        if (!u) return rej('bad');
        return verify(u, pw).then(function (ok) {
            if (!ok) return rej('old');
            var dead = [], suf = '@' + u.id;
            for (var i = 0; i < localStorage.length; i++) { var k = localStorage.key(i); if (k && k.slice(-suf.length) === suf) dead.push(k); }
            frozen = true;
            dead.forEach(function (k) { localStorage.removeItem(k); });
            users = users.filter(function (x) { return x.id !== u.id; });
            writeUsers(users);
            setSid(null);
        });
    }

    /* Перезагрузка с сохранением: сначала приложение дописывает работы в ПРЕЖНИЙ профиль, потом запись закрывается */
    function flush() { try { window.dispatchEvent(new Event('pagehide')); } catch (e) { /* не страшно */ } }
    function reload() { flush(); frozen = true; location.reload(); }
    function signOut() { setSid(null); reload(); }

    function workCount() {
        try { var o = JSON.parse(RKAuth.get('rk-projects-v1') || 'null'); return o && Array.isArray(o.list) ? o.list.length : 0; } catch (e) { return 0; }
    }

    var RKAuth = window.RKAuth = {
        enabled: OK,
        user: function () { return cur ? { id: cur.id, login: cur.login } : null; },
        get: function (k) { if (!OK || !cur) return null; try { return localStorage.getItem(k + '@' + cur.id); } catch (e) { return null; } },
        set: function (k, v) { if (!OK || !cur || frozen) return; localStorage.setItem(k + '@' + cur.id, v); },
        remove: function (k) { if (!OK || !cur || frozen) return; try { localStorage.removeItem(k + '@' + cur.id); } catch (e) { /* не страшно */ } }
    };
    if (!OK) return;   /* память браузера закрыта: профили негде хранить, приложение работает как раньше */

    /* ====================== Интерфейс ====================== */
    var I = null;
    function t(k, v) { return I ? I.t(k, v) : k; }
    function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
    function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
    function initial(s) { return (Array.from(String(s || '?'))[0] || '?').toUpperCase(); }
    function hueOf(s) { var h = 0; for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 360; return h; }
    function paintAv(node, login) {
        node.textContent = initial(login);
        node.style.background = 'hsl(' + hueOf(String(login).toLowerCase()) + ' 55% 40%)';
    }
    function toast(m) { if (window.RKApp && window.RKApp.toast) window.RKApp.toast(m); }
    /* последний вошедший логин подставляется в форму, только если такой профиль ещё есть */
    function lastLogin() {
        try {
            var l = localStorage.getItem(LKEY) || '', k = l.toLowerCase();
            if (users.some(function (u) { return u.key === k; })) return l;
            return users.length === 1 ? users[0].login : '';
        } catch (e) { return ''; }
    }
    var coarse = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;

    var ERR = { login: 'au.e.login', pass: 'au.e.pass', exists: 'au.e.exists', bad: 'au.e.bad', old: 'au.e.old', nocrypto: 'au.e.nocrypto', store: 'au.e.store' };

    /* Форма. mode: reg (создать), in (войти), pw (сменить пароль), del (удалить профиль).
       cfg.full — на весь экран и без «Отмена» (обязательный вход); иначе окно поверх приложения. */
    function Form(cfg) {
        var mode = cfg.mode, full = !!cfg.full, vals = { login: cfg.fixed || lastLogin(), stay: true };
        var host, card, busy = false;

        function field(name, labelKey, type, ac, value) {
            var lab = el('label', 'rk-f au-f');
            lab.appendChild(el('span', null, t(labelKey)));
            var row = el('div', 'au-in');
            var inp = el('input', 'rk-input');
            inp.type = type; inp.name = name; inp.setAttribute('autocomplete', ac); inp.value = value || '';
            inp.maxLength = type === 'password' ? 64 : 30;
            if (type === 'text') { inp.setAttribute('autocapitalize', 'none'); inp.setAttribute('autocorrect', 'off'); inp.spellcheck = false; }
            row.appendChild(inp);
            if (type === 'password') {
                var eye = el('button', 'au-eye', t('au.show'));
                eye.type = 'button';
                eye.addEventListener('click', function () {
                    var show = inp.type === 'password';
                    inp.type = show ? 'text' : 'password';
                    eye.textContent = t(show ? 'au.hide' : 'au.show');
                });
                row.appendChild(eye);
            }
            lab.appendChild(row);
            return { lab: lab, inp: inp };
        }

        function keep() {
            if (!card) return;
            $$('input', card).forEach(function (i) {
                if (i.type === 'checkbox') vals.stay = i.checked;
                else if (i.name === 'username') vals.login = i.value;
            });
        }

        function render() {
            keep();
            card = el('div', 'au-card');
            var titles = { reg: users.length ? 'au.title.add' : 'au.title.new', in: 'au.title.in', pw: 'au.title.pw', del: 'au.title.del' };
            var subs = { reg: users.length ? 'au.sub.add' : 'au.sub.new', in: 'au.sub.in', pw: 'au.sub.pw', del: 'au.sub.del' };
            if (full) {
                var logo = el('div', 'au-logo');
                logo.innerHTML = '<svg viewBox="0 0 64 64" aria-hidden="true"><rect class="lg-bg" width="64" height="64" rx="16"/><path class="lg-fg" d="M15 18h34v28H15zM15 32h22M37 18v28M37 39h12"/></svg>';
                card.appendChild(logo);
            }
            var h = el('h2', 'au-h', t(titles[mode])); h.id = 'au-title'; card.appendChild(h);
            card.appendChild(el('p', 'au-sub', t(subs[mode], { n: cur ? cur.login : '' })));
            if (mode === 'reg' && !users.length && hasLegacy()) card.appendChild(el('p', 'au-mig', t('au.mig')));

            var form = el('form', 'au-form'); form.noValidate = true;
            var first = null, f;
            if (mode === 'in' && cfg.fixed) {
                var chip = el('div', 'au-chip');
                var av = el('span', 'au-av'); paintAv(av, cfg.fixed);
                chip.appendChild(av); chip.appendChild(el('b', null, cfg.fixed));
                form.appendChild(chip);
                var hid = el('input'); hid.type = 'hidden'; hid.name = 'username'; hid.value = cfg.fixed; hid.setAttribute('autocomplete', 'username');
                form.appendChild(hid);
            } else if (mode === 'in' || mode === 'reg') {
                if (mode === 'in' && users.length > 1) {
                    var chips = el('div', 'au-chips');
                    users.forEach(function (u) {
                        var b = el('button', 'au-chipb'); b.type = 'button';
                        var a2 = el('span', 'au-av'); paintAv(a2, u.login);
                        b.appendChild(a2); b.appendChild(el('span', null, u.login));
                        b.addEventListener('click', function () { vals.login = u.login; render(); });
                        chips.appendChild(b);
                    });
                    form.appendChild(chips);
                }
                f = field('username', 'au.login', 'text', 'username', vals.login);
                form.appendChild(f.lab); first = f.inp;
            }
            var pw1, pw2;
            if (mode === 'pw') {
                f = field('old', 'au.pass.old', 'password', 'current-password'); form.appendChild(f.lab); first = f.inp;
                pw1 = field('password', 'au.pass.new', 'password', 'new-password'); form.appendChild(pw1.lab);
                pw2 = field('password2', 'au.pass2', 'password', 'new-password'); form.appendChild(pw2.lab);
            } else if (mode === 'reg') {
                pw1 = field('password', 'au.pass', 'password', 'new-password'); form.appendChild(pw1.lab);
                pw2 = field('password2', 'au.pass2', 'password', 'new-password'); form.appendChild(pw2.lab);
            } else {
                pw1 = field('password', 'au.pass', 'password', 'current-password'); form.appendChild(pw1.lab);
                if (!first || cfg.fixed || vals.login) first = pw1.inp;
            }
            if (mode === 'in' || mode === 'reg') {
                var st = el('label', 'au-stay');
                var cb = el('input'); cb.type = 'checkbox'; cb.checked = vals.stay;
                st.appendChild(cb); st.appendChild(el('span', null, t('au.stay')));
                form.appendChild(st);
            }
            if (mode === 'reg') form.appendChild(el('p', 'au-note', t('au.note')));
            var err = el('p', 'au-err'); err.setAttribute('role', 'alert'); form.appendChild(err);

            var btns = el('div', 'au-btns');
            var go = el('button', 'rk-btn rk-btn--main' + (mode === 'del' ? ' rkd-danger' : ''), t('au.btn.' + mode));
            go.type = 'submit';
            if (!full) {
                var no = el('button', 'rk-btn rk-btn--ghost', t('d.cancel')); no.type = 'button';
                no.addEventListener('click', close);
                btns.appendChild(no);
            }
            btns.appendChild(go);
            if (!full) btns.classList.add('au-btns--2');
            form.appendChild(btns);

            function fail(code, input) {
                err.textContent = t(ERR[code] || 'au.e.store');
                busy = false; go.disabled = false; go.textContent = t('au.btn.' + mode);
                if (input) { input.classList.add('is-bad'); try { input.focus(); } catch (e) { /* не страшно */ } }
            }
            form.addEventListener('input', function (e) { if (e.target.classList) e.target.classList.remove('is-bad'); err.textContent = ''; });
            form.addEventListener('submit', function (e) {
                e.preventDefault();
                if (busy) return;
                var v = function (n) { var i = form.elements[n]; return i ? i.value : ''; };
                var stay = cb ? cb.checked : true, p;
                err.textContent = '';
                if (mode === 'reg') {
                    if (!checkLogin(v('username'))) return fail('login', form.elements.username);
                    if (v('password').length < 4) return fail('pass', pw1.inp);
                    if (v('password') !== v('password2')) { err.textContent = t('au.e.same'); pw2.inp.classList.add('is-bad'); pw2.inp.focus(); return; }
                } else if (mode === 'pw') {
                    if (v('password').length < 4) return fail('pass', pw1.inp);
                    if (v('password') !== v('password2')) { err.textContent = t('au.e.same'); pw2.inp.classList.add('is-bad'); pw2.inp.focus(); return; }
                } else if (!v('password')) { pw1.inp.focus(); return; }
                busy = true; go.disabled = true; go.textContent = '…';
                if (mode === 'reg') p = register(v('username'), v('password'), stay);
                else if (mode === 'in') p = signIn(v('username'), v('password'), stay);
                else if (mode === 'pw') p = changePw(v('old'), v('password'));
                else p = removeCurrent(v('password'));
                p.then(function () {
                    if (mode === 'pw') { close(); toast(t('au.toast.pw')); return; }
                    reload();
                }, function (er) {
                    fail(er && er.code, mode === 'pw' && er && er.code === 'old' ? form.elements.old : (mode === 'in' || mode === 'del' ? pw1.inp : null));
                });
            });
            card.appendChild(form);

            if (full) {
                if (mode === 'in') {
                    var a = el('button', 'au-link', t('au.to.new')); a.type = 'button';
                    a.addEventListener('click', function () { mode = 'reg'; vals.login = ''; render(); });
                    card.appendChild(a);
                } else if (mode === 'reg' && users.length) {
                    var a3 = el('button', 'au-link', t('au.to.in')); a3.type = 'button';
                    a3.addEventListener('click', function () { mode = 'in'; vals.login = lastLogin(); render(); });
                    card.appendChild(a3);
                }
                var lg = el('div', 'lang-switch au-lang'); lg.setAttribute('role', 'radiogroup');
                ['ru', 'en', 'uz'].forEach(function (l) {
                    var b = el('button', null, l.toUpperCase()); b.type = 'button'; b.setAttribute('role', 'radio');
                    b.setAttribute('aria-checked', String(I && I.lang() === l)); b.lang = l;
                    b.addEventListener('click', function () { if (I && I.setLang) I.setLang(l); });
                    lg.appendChild(b);
                });
                card.appendChild(lg);
            }

            host.innerHTML = '';
            host.appendChild(card);
            if (!coarse || !full) { try { (first || pw1.inp).focus({ preventScroll: true }); } catch (e) { /* не страшно */ } }
        }

        function onKey(e) { if (e.key === 'Escape' && !full) { e.preventDefault(); e.stopPropagation(); close(); } }
        function close() {
            if (!host) return;
            document.removeEventListener('keydown', onKey, true);
            document.removeEventListener('rk:lang', render);
            var w = host.closest('.rkx-wrap') || host;
            w.remove(); host = null;
            document.documentElement.classList.remove('rkx-lock');
            if (cfg.back && cfg.back.focus) { try { cfg.back.focus({ preventScroll: true }); } catch (e) { /* не страшно */ } }
        }
        function open() {
            if (full) {
                host = el('div', 'rk-auth'); host.setAttribute('role', 'dialog'); host.setAttribute('aria-modal', 'true'); host.setAttribute('aria-labelledby', 'au-title');
                document.body.appendChild(host);
            } else {
                var wrap = el('div', 'rkx-wrap'); wrap.setAttribute('role', 'dialog'); wrap.setAttribute('aria-modal', 'true'); wrap.setAttribute('aria-labelledby', 'au-title');
                host = el('div', 'rkx-card au-modal'); wrap.appendChild(host);
                wrap.addEventListener('mousedown', function (e) { if (e.target === wrap) close(); });
                document.body.appendChild(wrap);
                document.documentElement.classList.add('rkx-lock');
                document.addEventListener('keydown', onKey, true);
            }
            document.addEventListener('rk:lang', render);
            render();
        }
        open();
    }

    /* ---------- Кнопка профиля и меню ---------- */
    var pop = null;
    function closeMenu() {
        if (!pop) return;
        pop.node.remove();
        document.removeEventListener('mousedown', pop.out, true);
        document.removeEventListener('keydown', pop.key, true);
        $$('[data-au-open]').forEach(function (b) { b.setAttribute('aria-expanded', 'false'); });
        var f = pop.from; pop = null;
        if (f && f.focus) { try { f.focus({ preventScroll: true }); } catch (e) { /* не страшно */ } }
    }
    function menuItem(label, cls, fn, ico) {
        var b = el('button', 'au-item' + (cls ? ' ' + cls : '')); b.type = 'button'; b.setAttribute('role', 'menuitem');
        if (ico) { var s = el('span', 'au-ico'); s.innerHTML = ico; b.appendChild(s); }
        b.appendChild(el('span', null, label));
        b.addEventListener('click', function () { var from = pop && pop.from; closeMenu(); fn(from); });
        return b;
    }
    var ICO = {
        add: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>',
        key: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="8" cy="15" r="4"/><path d="M11 12l9-9M16 7l3 3"/></svg>',
        save: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v11M7 11l5 5 5-5M5 20h14"/></svg>',
        out: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 5H6a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h4M15 8l4 4-4 4M19 12H9"/></svg>',
        del: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 7h14M10 7V5h4v2M7 7l1 12h8l1-12"/></svg>'
    };
    function openMenu(btn) {
        if (pop) { closeMenu(); return; }
        users = readUsers();
        var node = el('div', 'au-pop'); node.setAttribute('role', 'menu');
        var head = el('div', 'au-head');
        var av = el('span', 'au-av au-av--lg'); paintAv(av, cur.login);
        var tx = el('div', 'au-who');
        tx.appendChild(el('b', null, cur.login));
        tx.appendChild(el('span', null, t('au.m.works', { n: workCount() })));
        head.appendChild(av); head.appendChild(tx);
        node.appendChild(head);

        var others = users.filter(function (u) { return u.id !== cur.id; });
        if (others.length) {
            node.appendChild(el('p', 'au-cap', t('au.m.profiles')));
            others.forEach(function (u) {
                var b = el('button', 'au-item'); b.type = 'button'; b.setAttribute('role', 'menuitem');
                var a = el('span', 'au-av au-av--sm'); paintAv(a, u.login);
                b.appendChild(a); b.appendChild(el('span', null, u.login));
                b.addEventListener('click', function () { var from = pop && pop.from; closeMenu(); Form({ mode: 'in', fixed: u.login, back: from }); });
                node.appendChild(b);
            });
        }
        node.appendChild(el('div', 'au-sep'));
        node.appendChild(menuItem(t('au.m.add'), '', function (from) { Form({ mode: 'reg', back: from }); }, ICO.add));
        node.appendChild(menuItem(t('au.m.backup'), '', function () {
            var tb = document.querySelector('[data-tool-set="plates"]');
            if (tb && document.documentElement.getAttribute('data-tool') !== 'plates') tb.click();
            setTimeout(function () { var w = document.getElementById('rk-h-works'); if (w) w.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 80);
        }, ICO.save));
        node.appendChild(menuItem(t('au.m.pw'), '', function (from) { Form({ mode: 'pw', back: from }); }, ICO.key));
        node.appendChild(el('div', 'au-sep'));
        node.appendChild(menuItem(t('au.m.out'), '', function () { signOut(); }, ICO.out));
        node.appendChild(menuItem(t('au.m.del'), 'au-item--bad', function (from) { Form({ mode: 'del', back: from }); }, ICO.del));
        document.body.appendChild(node);

        /* привязка к кнопке: правый край по её правому краю, но внутри экрана */
        var r = btn.getBoundingClientRect(), vw = document.documentElement.clientWidth;
        var w = Math.min(300, vw - 16);
        node.style.width = w + 'px';
        node.style.top = Math.min(r.bottom + 8, window.innerHeight - 80) + 'px';
        node.style.left = Math.max(8, Math.min(vw - w - 8, r.right - w)) + 'px';
        node.style.maxHeight = Math.max(160, window.innerHeight - r.bottom - 24) + 'px';

        function out(e) { if (!node.contains(e.target) && !btn.contains(e.target)) closeMenu(); }
        function key(e) { if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); closeMenu(); } }
        document.addEventListener('mousedown', out, true);
        document.addEventListener('keydown', key, true);
        pop = { node: node, out: out, key: key, from: btn };
        $$('[data-au-open]').forEach(function (b) { b.setAttribute('aria-expanded', String(b === btn)); });
        var f = node.querySelector('.au-item'); if (f) { try { f.focus({ preventScroll: true }); } catch (e) { /* не страшно */ } }
    }

    function paintButtons() {
        $$('[data-au-av]').forEach(function (n) { paintAv(n, cur ? cur.login : '?'); });
        $$('[data-au-name]').forEach(function (n) { n.textContent = cur ? cur.login : ''; });
    }

    function start() {
        I = window.RKI18N;
        if (!cur) {
            /* обязательный вход: сначала создать профиль, если их ещё нет */
            document.documentElement.classList.add('rk-locked');
            Form({ mode: users.length ? 'in' : 'reg', full: true });
            return;
        }
        document.documentElement.classList.remove('rk-locked');
        paintButtons();
        $$('[data-au-open]').forEach(function (b) {
            b.hidden = false;
            b.addEventListener('click', function () { openMenu(b); });
        });
    }
    /* все скрипты страницы уже выполнились (в том числе переводы), когда наступает DOMContentLoaded */
    if (document.readyState === 'complete') start(); else document.addEventListener('DOMContentLoaded', start);
})();
