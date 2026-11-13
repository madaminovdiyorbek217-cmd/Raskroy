/* Профили: логин и пароль, у каждого профиля свои работы и ткани.
   Два режима:
   • локальный (по умолчанию): профили лежат в памяти браузера (localStorage), пароль хранится как хэш PBKDF2-SHA256 с солью;
   • облачный (когда заполнен js/cloud-config.js): аккаунты, работы и оформление лежат в базе Supabase (js/cloud.js),
     один логин работает на любом устройстве, главный админ видит все аккаунты и может их блокировать.
   Работам профиля даётся своя «полка»: ключ 'rk-projects-v1' превращается в 'rk-projects-v1@<id профиля>'.
   Остальной код читает и пишет через RKAuth.get / RKAuth.set, а до входа (экран входа закрывает всё) не сохраняет ничего. */
(function () {
    'use strict';

    var UKEY = 'rk-users-v1';       /* список локальных профилей */
    var SKEY = 'rk-session';        /* кто сейчас вошёл (локально) */
    var LKEY = 'rk-lastuser';       /* последний вошедший логин, подставляется в форму */
    var MEK = 'rk-cloud-me';        /* облачный режим: кто вошёл (копия профиля для мгновенного старта) */
    var STK = 'rk-cloud-stay';      /* '0': выйти, когда закроют вкладку */
    var DATA = ['rk-projects-v1', 'rk-project-v1', 'rk-fabric-v1'];   /* что принадлежит профилю */
    var SYNC = ['rk-projects-v1', 'rk-fabric-v1'];                    /* что уходит в облако */
    var ITER = 100000;
    var CLOUD = !!(window.RKCloud && window.RKCloud.on);
    var MINPW = CLOUD ? 6 : 4;
    var frozen = false, cur = null, fails = 0, gate = false;
    var pendingAdmin = null;
    var booting = false;     /* облако: идёт стартовая сверка; сохранения самого приложения при запуске правками не считаются */

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
    function readMe() {
        try {
            var m = JSON.parse(localStorage.getItem(MEK) || 'null');
            return m && m.id && m.login && m.id === window.RKCloud.uid() ? m : null;
        } catch (e) { return null; }
    }
    if (OK) {
        if (CLOUD) {
            cur = readMe();
            /* «не оставаться в системе»: вход действует, пока открыта вкладка */
            try { if (cur && localStorage.getItem(STK) === '0' && !sessionStorage.getItem('rk-cloud-alive')) cur = null; } catch (e) { /* не страшно */ }
            if (cur && cur.id === '77dbb716-75de-4937-80f1-ff01899a1f76') {
                pendingAdmin = cur;
                cur = null;
            }
            booting = !!cur;
        } else { var sid0 = getSid(); cur = users.filter(function (u) { return u.id === sid0; })[0] || null; }
    }

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

    function localRegister(login, pw, stay) {
        login = checkLogin(login);
        if (!login) return rej('login');
        if (String(pw).length < MINPW) return rej('pass');
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
    function localSignIn(name, pw, stay) {
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
    function localChangePw(oldPw, newPw) {
        if (!cur) return rej('bad');
        if (String(newPw).length < MINPW) return rej('pass');
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
    function localRemove(pw) {
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
    function localSignOut() { setSid(null); reload(); }

    function workCount() {
        try { var o = JSON.parse(RKAuth.get('rk-projects-v1') || 'null'); return o && Array.isArray(o.list) ? o.list.length : 0; } catch (e) { return 0; }
    }


    /* ====================== Облачный режим ====================== */
    function noop() { /* не страшно */ }
    function ask(msg, opts) {
        if (window.RKDialog && window.RKDialog.confirm) return window.RKDialog.confirm(msg, opts);
        return Promise.resolve(window.confirm(msg));
    }
    function saveMe() {
        if (!cur) return;
        try { localStorage.setItem(MEK, JSON.stringify({ id: cur.id, login: cur.login, admin: !!cur.admin, look: cur.look || {}, works: cur.works || 0 })); } catch (e) { noop(); }
    }
    function metaGet(id) { try { return JSON.parse(localStorage.getItem('rk-sync@' + id) || 'null') || {}; } catch (e) { return {}; } }
    function metaSet(id, m) { try { localStorage.setItem('rk-sync@' + id, JSON.stringify(m)); } catch (e) { noop(); } }
    function canon(v) {
        if (Array.isArray(v)) return '[' + v.map(canon).join(',') + ']';
        if (v && typeof v === 'object') return '{' + Object.keys(v).sort().map(function (k) { return JSON.stringify(k) + ':' + canon(v[k]); }).join(',') + '}';
        return JSON.stringify(v === undefined ? null : v);
    }
    function readLocal() {
        var o = {};
        SYNC.forEach(function (k) { try { var raw = localStorage.getItem(k + '@' + cur.id); o[k] = raw ? JSON.parse(raw) : null; } catch (e) { o[k] = null; } });
        return { projects: o['rk-projects-v1'], fabric: o['rk-fabric-v1'] };
    }
    function after(a, b) { return Date.parse(a) > Date.parse(b); }
    function purge(id) {
        var dead = [], suf = '@' + id;
        for (var i = 0; i < localStorage.length; i++) { var k = localStorage.key(i); if (k && k.slice(-suf.length) === suf) dead.push(k); }
        dead.forEach(function (k) { try { localStorage.removeItem(k); } catch (e) { noop(); } });
    }
    function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

    /* Отправка работ в облако: через пару секунд после правок. Перед отправкой проверяем, не менялось ли облако с другого устройства. */
    var editSeq = 0, pushTimer = 0, pushing = false, wantPush = false, busyAsk = false;
    function cloudDirty() {
        if (!CLOUD || !cur || gate || frozen || booting) return;
        editSeq++;
        var m = metaGet(cur.id);
        if (!m.dirty) { m.dirty = 1; metaSet(cur.id, m); }
        clearTimeout(pushTimer); pushTimer = setTimeout(push, 2500);
    }
    function push() {
        if (!CLOUD || !cur || frozen || gate) return Promise.resolve(false);
        if (pushing) { wantPush = true; return Promise.resolve(false); }
        var id = cur.id, seq = editSeq, d = readLocal(), clash = false;
        pushing = true;
        return RKCloud.getStamp().then(function (st) {
            var m = metaGet(id);
            if (st && (!m.t || after(st, m.t))) throw { code: 'newer' };
            return RKCloud.putData(d.projects, d.fabric);
        }).then(function (row) {
            var m = metaGet(id);
            m.t = (row && row.updated_at) || m.t;
            if (seq === editSeq) m.dirty = 0; else wantPush = true;
            metaSet(id, m);
            var n = d.projects && Array.isArray(d.projects.list) ? d.projects.list.length : 0;
            if (cur && cur.id === id) { cur.works = n; saveMe(); }
            RKCloud.patchProfile({ works_count: n, last_seen: new Date().toISOString() }).catch(noop);
            return true;
        }).catch(function (e) {
            if (e && e.code === 'newer') { clash = true; return false; }
            if (e && e.code === 'auth') { sessionLost(); return false; }
            if (e && e.code === 'blocked') { showBlocked(''); return false; }
            if (e && e.code === 'forbidden') { checkBlocked(); return false; }
            clearTimeout(pushTimer); pushTimer = setTimeout(push, 30000);    /* нет связи: повторим позже */
            return false;
        }).then(function (ok) {
            pushing = false;
            if (clash) conflict();
            else if (wantPush) { wantPush = false; clearTimeout(pushTimer); pushTimer = setTimeout(push, 800); }
            return ok;
        });
    }

    /* Работы в облаке новее, чем у нас: берём облачные (страница перезагрузится) или оставляем свои */
    function applyRemote(r) {
        var id = cur.id;
        flush(); frozen = true;     /* приложение допишет старое в локальную полку, после этого её заменяем */
        var put = function (k, v) { try { if (v == null) localStorage.removeItem(k + '@' + id); else localStorage.setItem(k + '@' + id, JSON.stringify(v)); } catch (e) { noop(); } };
        put('rk-projects-v1', r.projects); put('rk-fabric-v1', r.fabric);
        metaSet(id, { t: r.updated_at, dirty: 0 });
        location.reload();
    }
    function takeRemote() {
        return RKCloud.getData().then(function (r) { if (r) applyRemote(r); }, noop);
    }
    function conflict() {
        if (busyAsk || !cur) return Promise.resolve();
        busyAsk = true;
        hideGate();
        return ask(t('au.sync.conf'), { ok: t('au.sync.cloud'), cancel: t('au.sync.mine'), danger: true }).then(function (cloudWins) {
            busyAsk = false;
            if (cloudWins) return takeRemote();
            return RKCloud.getStamp().then(function (st) {
                var m = metaGet(cur.id); if (st) m.t = st; m.dirty = 1; metaSet(cur.id, m);
                return push();
            }, noop);
        }, function () { busyAsk = false; });
    }
    var lastSoft = 0;
    function softSync(force) {
        if (!CLOUD || !cur || gate || frozen) return;
        var n = Date.now(); if (!force && n - lastSoft < 30000) return;
        lastSoft = n;
        checkBlocked();
        RKCloud.getStamp().then(function (st) {
            var m = metaGet(cur.id);
            if (st && (!m.t || after(st, m.t))) {
                if (m.dirty) return conflict();
                return ask(t('au.sync.newer'), { ok: t('au.sync.load'), cancel: t('d.cancel') }).then(function (y) { if (y) return takeRemote(); });
            }
            if (m.dirty) return push();
        }).catch(function (e) { if (e && e.code === 'auth') sessionLost(); });
    }

    /* Первый шаг при открытии: профиль (блокировка, админ, оформление) и сверка работ с облаком */
    function applyProfile(p) {
        if (!cur || !p) return;
        cur.login = p.login || cur.login;
        cur.admin = !!p.is_admin;
        cur.look = p.look && typeof p.look === 'object' ? p.look : {};
        cur.works = p.works_count || 0;
        saveMe(); paintButtons();
    }
    var abandoned = false;
    function boot() {
        var id = cur.id, meta = metaGet(id), mine = readLocal();
        return RKCloud.getProfile().then(function (p) {
            if (!p) throw { code: 'server' };
            applyProfile(p);
            if (p.blocked) return { blocked: p.blocked_reason || '' };
            return RKCloud.getData().then(function (r) {
                var has = !!(mine.projects || mine.fabric);
                var again = function () { gate = false; return push().then(function () { return { ok: 1 }; }); };
                if (!r) {
                    if (!has) return { ok: 1 };
                    meta.dirty = 1; metaSet(id, meta); return again();
                }
                var newer = !meta.t || after(r.updated_at, meta.t);
                if (!newer) return meta.dirty ? again() : { ok: 1 };
                if (abandoned) { setTimeout(function () { softSync(true); }, 0); return { ok: 1 }; }
                if (meta.dirty && has) { gate = false; return conflict().then(function () { return { ok: 1 }; }); }
                if (canon(mine.projects) === canon(r.projects) && canon(mine.fabric) === canon(r.fabric)) {
                    metaSet(id, { t: r.updated_at, dirty: 0 }); return { ok: 1 };
                }
                applyRemote(r);
                return { reload: 1 };
            });
        });
    }

    function checkBlocked() {
        if (!CLOUD || !cur) return;
        RKCloud.getProfile().then(function (p) {
            if (!p) return;
            applyProfile(p);
            if (p.blocked) showBlocked(p.blocked_reason || '');
        }, function (e) {
            if (e && e.code === 'auth') sessionLost();
            else if (e && e.code === 'blocked') showBlocked('');
        });
    }
    function sessionLost() {
        if (frozen) return;
        try { localStorage.removeItem(MEK); } catch (e) { noop(); }
        reload();
    }
    var blockedShown = false;
    function showBlocked(reason) {
        if (blockedShown) return;
        blockedShown = true; hideGate();
        document.documentElement.classList.add('rk-locked');
        var host = el('div', 'rk-auth'); host.setAttribute('role', 'alertdialog'); host.setAttribute('aria-modal', 'true');
        var card = el('div', 'au-card au-blocked');
        card.appendChild(el('div', 'au-bigico', '⛔'));
        card.appendChild(el('h2', 'au-h', t('au.blocked.title')));
        card.appendChild(el('p', 'au-sub', t('au.blocked.sub')));
        if (reason) card.appendChild(el('p', 'au-reason', t('au.blocked.reason', { n: reason })));
        var b = el('button', 'rk-btn rk-btn--main', t('au.m.out')); b.type = 'button';
        b.addEventListener('click', function () { try { localStorage.removeItem(MEK); } catch (e) { noop(); } RKCloud.signOut(); reload(); });
        card.appendChild(b); host.appendChild(card); document.body.appendChild(host);
    }
    var gateEl = null;
    function showGate() {
        document.documentElement.classList.add('rk-locked');
        gateEl = el('div', 'rk-auth rk-gate'); gateEl.setAttribute('role', 'status');
        gateEl.appendChild(el('div', 'au-spin'));
        gateEl.appendChild(el('p', 'au-sub', t('au.sync.wait')));
        document.body.appendChild(gateEl);
    }
    function hideGate() {
        if (gateEl) { gateEl.remove(); gateEl = null; }
        if (!blockedShown) document.documentElement.classList.remove('rk-locked');
    }

    /* Вход, регистрация, смена пароля, удаление, выход (облако) */
    function afterAuth(isNew, stay) {
        return RKCloud.getProfile().then(function (p) {
            if (!p) { RKCloud.signOut(); throw { code: 'server' }; }
            if (p.blocked) { RKCloud.signOut(); throw { code: 'blocked', reason: p.blocked_reason }; }
            var id = RKCloud.uid();
            cur = { id: id, login: p.login, admin: !!p.is_admin, look: p.look || {}, works: p.works_count || 0 };
            booting = true;      /* страница сейчас перезагрузится и допишет своё начальное состояние: это не правки пользователя */
            if (isNew && hasLegacy()) { try { migrate(id); var m = metaGet(id); m.dirty = 1; metaSet(id, m); } catch (e) { noop(); } }
            saveMe();
            try { localStorage.setItem(LKEY, p.login); localStorage.setItem(STK, stay ? '1' : '0'); sessionStorage.setItem('rk-cloud-alive', '1'); } catch (e2) { noop(); }
            return cur;
        }, function (e) { RKCloud.signOut(); throw e; });
    }
    function cloudRegister(login, pw, stay) {
        login = checkLogin(login);
        if (!login) return rej('login');
        if (String(pw).length < MINPW) return rej('pass');
        return RKCloud.signUp(login, pw).then(function () { return afterAuth(true, stay); });
    }

    /* Вход с подтверждением Captcha Sentinel */
    function cloudSignIn(name, pw, stay) {
        if (!cleanLogin(name)) return rej('bad');

        var ADMIN_ID = '77dbb716-75de-4937-80f1-ff01899a1f76';

        return RKCloud.signIn(name, pw)
            .then(function (uid) {
                // Обычные пользователи входят без Telegram
                if (uid !== ADMIN_ID) {
                    return afterAuth(false, stay);
                }

                // Проверяем, была ли эта сессия одобрена
                return RKCloud.captchaApproved().then(function (approved) {
                    if (approved) {
                        return afterAuth(false, stay);
                    }

                    // Отправляем запрос главному администратору
                    return RKCloud.requestCaptcha().then(function () {
                        alert(
                            'Captcha Sentinel\n\n' +
                            'Подтверди вход в Telegram.\n' +
                            'У тебя есть 60 секунд.'
                        );

                        var deadline = Date.now() + 60000;

                        function check() {
                            if (Date.now() >= deadline) {
                                throw {
                                    code: 'captcha',
                                    message: 'Время подтверждения истекло'
                                };
                            }

                            return wait(2000).then(function () {
                                return RKCloud.captchaApproved();
                            }).then(function (ok) {
                                if (ok) {
                                    return afterAuth(false, stay);
                                }
                                return check();
                            });
                        }

                        return check();
                    });
                });
            })
            .catch(function (e) {
                return Promise.resolve().then(function () { return RKCloud.signOut(); }).catch(noop).then(function () {
                    throw e;
                });
            });
    }

    function cloudChangePw(oldPw, newPw) {
        if (!cur) return rej('bad');
        if (String(newPw).length < MINPW) return rej('pass');
        return RKCloud.changePassword(cur.login, oldPw, newPw);
    }
    function cloudRemove(pw) {
        if (!cur) return rej('bad');
        var id = cur.id;
        return RKCloud.signIn(cur.login, pw).catch(function (e) { throw { code: e && e.code === 'bad' ? 'old' : (e && e.code) || 'server' }; })
            .then(function () { return RKCloud.deleteAccount(); })
            .then(function () {
                frozen = true; purge(id);
                try { localStorage.removeItem(MEK); localStorage.removeItem(LKEY); } catch (e) { noop(); }
            });
    }
    function cloudSignOut() {
        flush(); clearTimeout(pushTimer);
        var id = cur.id;
        var done = function () {
            var clean = !metaGet(id).dirty;
            RKCloud.signOut();
            try { localStorage.removeItem(MEK); } catch (e) { noop(); }
            if (clean) purge(id);          /* всё уже в облаке: на общем устройстве копию не оставляем */
            frozen = true; location.reload();
        };
        if (!metaGet(id).dirty) { done(); return; }
        Promise.race([push(), wait(5000)]).then(done, done);
    }
    /* перенос работ из локального профиля версии 38 (хранился только на этом устройстве) */
    function importLocal(login, pw) {
        var list = readUsers(), key = cleanLogin(login).toLowerCase();
        var u = list.filter(function (x) { return x.key === key; })[0];
        if (!u) return rej('bad');
        return verify(u, pw).then(function (ok) {
            if (!ok) return rej('bad');
            var obj = { app: 'raskroy', format: 1, projects: null };
            try { obj.projects = JSON.parse(localStorage.getItem('rk-projects-v1@' + u.id) || 'null'); } catch (e) { obj.projects = null; }
            try { var fb = JSON.parse(localStorage.getItem('rk-fabric-v1@' + u.id) || 'null'); if (fb) obj.fabric = fb; } catch (e2) { noop(); }
            if (!obj.projects || !window.RKApp || !window.RKApp.restore) return rej('store');
            var n = window.RKApp.restore(obj);
            return n < 0 ? rej('store') : n;
        });
    }

    function register(l, p, s) { return CLOUD ? cloudRegister(l, p, s) : localRegister(l, p, s); }
    function signIn(l, p, s) { return CLOUD ? cloudSignIn(l, p, s) : localSignIn(l, p, s); }
    function changePw(o, n) { return CLOUD ? cloudChangePw(o, n) : localChangePw(o, n); }
    function removeCurrent(p) { return CLOUD ? cloudRemove(p) : localRemove(p); }
    function signOut() { if (CLOUD) cloudSignOut(); else localSignOut(); }

    /* ---------- Оформление профиля (аватарка, рамка, титул, статус) ---------- */
    function curLook() {
        if (!cur) return {};
        if (CLOUD) return cur.look || {};
        var u = readUsers().filter(function (x) { return x.id === cur.id; })[0];
        return u && u.look || {};
    }
    function cleanLook(l) {
        l = l && typeof l === 'object' ? l : {};
        var a = l.a && typeof l.a === 'object' ? l.a : {}, o = { a: {} };
        if (a.k === 'emoji' || a.k === 'photo' || a.k === 'letter') o.a.k = a.k;
        if (typeof a.e === 'string') o.a.e = Array.from(a.e).slice(0, 4).join('');
        if (typeof a.p === 'string' && /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+\/=]+$/.test(a.p) && a.p.length < 45000) o.a.p = a.p;
        if (typeof a.bg === 'number' && a.bg >= 0 && a.bg < 12) o.a.bg = Math.floor(a.bg);
        else if (typeof a.bg === 'string' && /^#[0-9a-fA-F]{6}$/.test(a.bg)) o.a.bg = a.bg.toLowerCase();
        if (['none', 'solid', 'grad', 'dash', 'glow', 'rainbow'].indexOf(l.r) >= 0) o.r = l.r;
        if (typeof l.t === 'string' && /^[a-z0-9]{1,12}$/.test(l.t)) o.t = l.t;
        if (typeof l.s === 'string') o.s = l.s.replace(/[\u0000-\u001f]/g, ' ').slice(0, 40);
        if (typeof l.b === 'string') o.b = l.b.replace(/[\u0000-\u001f]/g, ' ').slice(0, 140);
        return o;
    }
    function setLook(look) {
        look = cleanLook(look);
        if (!cur) return rej('bad');
        if (CLOUD) {
            return RKCloud.patchProfile({ look: look }).then(function () { cur.look = look; saveMe(); paintButtons(); });
        }
        var list = readUsers(), u = list.filter(function (x) { return x.id === cur.id; })[0];
        if (!u) return rej('bad');
        u.look = look;
        try { writeUsers(list); } catch (e) { return rej('store'); }
        users = list; cur.look = look; paintButtons();
        return Promise.resolve();
    }

    var RKAuth = window.RKAuth = {
        enabled: OK,
        cloud: CLOUD,
        user: function () { return cur ? { id: cur.id, login: cur.login, admin: !!cur.admin } : null; },
        get: function (k) { if (!OK || !cur) return null; try { return localStorage.getItem(k + '@' + cur.id); } catch (e) { return null; } },
        set: function (k, v) {
            if (!OK || !cur || frozen) return;
            var key = k + '@' + cur.id, old = null;
            if (CLOUD) { try { old = localStorage.getItem(key); } catch (e) { old = null; } }
            localStorage.setItem(key, v);
            if (CLOUD && old !== v && SYNC.indexOf(k) >= 0) cloudDirty();
        },
        remove: function (k) { if (!OK || !cur || frozen) return; try { localStorage.removeItem(k + '@' + cur.id); } catch (e) { /* не страшно */ } if (CLOUD && SYNC.indexOf(k) >= 0) cloudDirty(); },
        look: function () { return curLook(); },
        setLook: setLook,
        works: function () { return workCount(); },
        paintAv: function (n, login, look) { paintAv(n, login, look); }
    };
    if (!OK) return;   /* память браузера закрыта: профили негде хранить, приложение работает как раньше */

    /* ====================== Интерфейс ====================== */
    var I = null;
    function t(k, v) { return I ? I.t(k, v) : k; }
    function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
    function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
    function initial(s) { return (Array.from(String(s || '?'))[0] || '?').toUpperCase(); }
    function hueOf(s) { var h = 0; for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 360; return h; }
    var GRADS = [['#6366f1', '#8b5cf6'], ['#0ea5e9', '#22d3ee'], ['#10b981', '#84cc16'], ['#f59e0b', '#ef4444'], ['#ec4899', '#f43f5e'], ['#14b8a6', '#3b82f6'],
    ['#a855f7', '#ec4899'], ['#64748b', '#0f172a'], ['#f97316', '#facc15'], ['#22c55e', '#06b6d4'], ['#e11d48', '#7c3aed'], ['#78350f', '#d97706']];
    var RINGS = ['none', 'solid', 'grad', 'dash', 'glow', 'rainbow'];
    /* Рисует аватарку в узле: фото, эмодзи или первая буква логина на градиенте; рамка задаётся атрибутом data-ring */
    function paintAv(node, login, look) {
        look = look && typeof look === 'object' ? look : {};
        var a = look.a || {}, fill, txt = initial(login);
        if (a.k === 'photo' && typeof a.p === 'string' && /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+\/=]+$/.test(a.p)) { fill = 'url("' + a.p + '")'; txt = ''; }
        else {
            if (a.k === 'emoji' && a.e) txt = String(a.e);
            var h = hueOf(String(login).toLowerCase());
            if (typeof a.bg === 'number' && GRADS[a.bg]) fill = 'linear-gradient(135deg,' + GRADS[a.bg][0] + ',' + GRADS[a.bg][1] + ')';
            else if (typeof a.bg === 'string' && /^#[0-9a-fA-F]{6}$/.test(a.bg)) fill = 'linear-gradient(135deg,' + a.bg + ',' + a.bg + ')';
            else fill = 'linear-gradient(135deg,hsl(' + h + ' 55% 46%),hsl(' + ((h + 40) % 360) + ' 55% 34%))';
        }
        node.textContent = txt;
        node.style.setProperty('--avi', fill);
        node.setAttribute('data-ring', RINGS.indexOf(look.r) >= 0 ? look.r : 'none');
        node.classList.toggle('au-av--emoji', a.k === 'emoji' && !!a.e);
    }
    function toast(m) { if (window.RKApp && window.RKApp.toast) window.RKApp.toast(m); }
    /* последний вошедший логин подставляется в форму, только если такой профиль ещё есть */
    function lastLogin() {
        try {
            var l = localStorage.getItem(LKEY) || '', k = l.toLowerCase();
            if (CLOUD) return l;
            if (users.some(function (u) { return u.key === k; })) return l;
            return users.length === 1 ? users[0].login : '';
        } catch (e) { return ''; }
    }
    var coarse = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;

    var ERR = {
        login: 'au.e.login', pass: CLOUD ? 'au.e.pass6' : 'au.e.pass', exists: 'au.e.exists', bad: 'au.e.bad', old: 'au.e.old', nocrypto: 'au.e.nocrypto', store: 'au.e.store',
        net: 'au.e.net', rate: 'au.e.rate', blocked: 'au.e.blocked', confirm: 'au.e.confirm', closed: 'au.e.closed', server: 'au.e.server', auth: 'au.e.server', forbidden: 'au.e.server'
    };

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
            var more = !CLOUD && users.length;
            var titles = { reg: more ? 'au.title.add' : 'au.title.new', in: 'au.title.in', pw: 'au.title.pw', del: 'au.title.del', imp: 'au.title.imp' };
            var subs = { reg: more ? 'au.sub.add' : (CLOUD ? 'au.sub.new.c' : 'au.sub.new'), in: CLOUD ? 'au.sub.in.c' : 'au.sub.in', pw: 'au.sub.pw', del: CLOUD ? 'au.sub.del.c' : 'au.sub.del', imp: 'au.sub.imp' };
            if (full) {
                var logo = el('div', 'au-logo');
                logo.innerHTML = '<svg viewBox="0 0 64 64" aria-hidden="true"><rect class="lg-bg" width="64" height="64" rx="16"/><path class="lg-fg" d="M15 18h34v28H15zM15 32h22M37 18v28M37 39h12"/></svg>';
                card.appendChild(logo);
            }
            var h = el('h2', 'au-h', t(titles[mode])); h.id = 'au-title'; card.appendChild(h);
            card.appendChild(el('p', 'au-sub', t(subs[mode], { n: cur ? cur.login : '' })));
            if (mode === 'reg' && (CLOUD || !users.length) && hasLegacy()) card.appendChild(el('p', 'au-mig', t('au.mig')));

            var form = el('form', 'au-form'); form.noValidate = true;
            var first = null, f;
            if (mode === 'in' && cfg.fixed) {
                var chip = el('div', 'au-chip');
                var av = el('span', 'au-av'); paintAv(av, cfg.fixed, cfg.fixedLook);
                chip.appendChild(av); chip.appendChild(el('b', null, cfg.fixed));
                form.appendChild(chip);
                var hid = el('input'); hid.type = 'hidden'; hid.name = 'username'; hid.value = cfg.fixed; hid.setAttribute('autocomplete', 'username');
                form.appendChild(hid);
            } else if (mode === 'in' || mode === 'reg' || mode === 'imp') {
                if (mode === 'in' && !CLOUD && users.length > 1) {
                    var chips = el('div', 'au-chips');
                    users.forEach(function (u) {
                        var b = el('button', 'au-chipb'); b.type = 'button';
                        var a2 = el('span', 'au-av'); paintAv(a2, u.login, u.look);
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
            if (mode === 'reg') form.appendChild(el('p', 'au-note', t(CLOUD ? 'au.note.c' : 'au.note')));
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

            function fail(code, input, reason) {
                err.textContent = t(ERR[code] || 'au.e.store') + (code === 'blocked' && reason ? ' ' + t('au.blocked.reason', { n: reason }) : '');
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
                    if (v('password').length < MINPW) return fail('pass', pw1.inp);
                    if (v('password') !== v('password2')) { err.textContent = t('au.e.same'); pw2.inp.classList.add('is-bad'); pw2.inp.focus(); return; }
                } else if (mode === 'pw') {
                    if (v('password').length < MINPW) return fail('pass', pw1.inp);
                    if (v('password') !== v('password2')) { err.textContent = t('au.e.same'); pw2.inp.classList.add('is-bad'); pw2.inp.focus(); return; }
                } else if (!v('password')) { pw1.inp.focus(); return; }
                busy = true; go.disabled = true; go.textContent = '…';
                if (mode === 'reg') p = register(v('username'), v('password'), stay);
                else if (mode === 'in') p = signIn(v('username'), v('password'), stay);
                else if (mode === 'pw') p = changePw(v('old'), v('password'));
                else if (mode === 'imp') p = importLocal(v('username'), v('password'));
                else p = removeCurrent(v('password'));
                p.then(function (res) {
                    if (mode === 'pw') { close(); toast(t('au.toast.pw')); return; }
                    if (mode === 'imp') { close(); toast(t('au.toast.imp', { n: res })); return; }
                    /* облако, вход или регистрация: страница до входа пуста, её начальное состояние в профиль дописывать нельзя */
                    if (CLOUD && (mode === 'in' || mode === 'reg')) { frozen = true; location.reload(); return; }
                    reload();
                }, function (er) {
                    fail(er && er.code, mode === 'pw' && er && er.code === 'old' ? form.elements.old : (mode === 'in' || mode === 'del' || mode === 'imp' ? pw1.inp : null), er && er.reason);
                });
            });
            card.appendChild(form);

            if (full) {
                if (mode === 'in') {
                    var a = el('button', 'au-link', t('au.to.new')); a.type = 'button';
                    a.addEventListener('click', function () { mode = 'reg'; vals.login = ''; render(); });
                    card.appendChild(a);
                } else if (mode === 'reg' && (users.length || CLOUD)) {
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
        edit: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="3.5"/><path d="M5 20c0-3.5 3-6 7-6s7 2.5 7 6"/></svg>',
        shield: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6z"/><path d="M9 12l2 2 4-4"/></svg>',
        move: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h12M13 7l5 5-5 5"/></svg>',
        add: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>',
        key: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="8" cy="15" r="4"/><path d="M11 12l9-9M16 7l3 3"/></svg>',
        save: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v11M7 11l5 5 5-5M5 20h14"/></svg>',
        out: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 5H6a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h4M15 8l4 4-4 4M19 12H9"/></svg>',
        del: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 7h14M10 7V5h4v2M7 7l1 12h8l1-12"/></svg>'
    };
    function openMenu(btn) {
        if (pop) { closeMenu(); return; }
        users = readUsers();
        var P = window.RKProfile, look = curLook(), nWorks = workCount();
        var node = el('div', 'au-pop'); node.setAttribute('role', 'menu');
        var head = el('div', 'au-head');
        var av = el('span', 'au-av au-av--lg'); paintAv(av, cur.login, look);
        var tx = el('div', 'au-who');
        var nm = el('b', null, cur.login); if (cur.admin) nm.appendChild(el('span', 'au-crown', ' 👑'));
        tx.appendChild(nm);
        var info = P && P.info ? P.info(look, nWorks, !!cur.admin) : null;
        tx.appendChild(el('span', 'au-title', info ? info.title : t('au.m.works', { n: nWorks })));
        head.appendChild(av); head.appendChild(tx);
        node.appendChild(head);
        if (info) {
            var lv = el('div', 'au-lvl'); lv.title = info.hint;
            var bar = el('i'); bar.style.width = Math.round(info.progress * 100) + '%'; lv.appendChild(bar);
            node.appendChild(lv);
            node.appendChild(el('p', 'au-lvlt', info.levelText + ' · ' + t('au.m.works', { n: nWorks })));
        }
        if (look.s) node.appendChild(el('p', 'au-status', look.s));

        node.appendChild(el('div', 'au-sep'));
        if (P && P.edit) node.appendChild(menuItem(t('au.m.edit'), '', function (from) { P.edit(from); }, ICO.edit));
        if (CLOUD && cur.admin && P && P.admin) node.appendChild(menuItem(t('au.m.admin'), 'au-item--adm', function (from) { P.admin(from); }, ICO.shield));

        var others = CLOUD ? [] : users.filter(function (u) { return u.id !== cur.id; });
        if (others.length) {
            node.appendChild(el('p', 'au-cap', t('au.m.profiles')));
            others.forEach(function (u) {
                var b = el('button', 'au-item'); b.type = 'button'; b.setAttribute('role', 'menuitem');
                var a = el('span', 'au-av au-av--sm'); paintAv(a, u.login, u.look);
                b.appendChild(a); b.appendChild(el('span', null, u.login));
                b.addEventListener('click', function () { var from = pop && pop.from; closeMenu(); Form({ mode: 'in', fixed: u.login, fixedLook: u.look, back: from }); });
                node.appendChild(b);
            });
        }
        node.appendChild(el('div', 'au-sep'));
        if (!CLOUD) node.appendChild(menuItem(t('au.m.add'), '', function (from) { Form({ mode: 'reg', back: from }); }, ICO.add));
        node.appendChild(menuItem(t('au.m.backup'), '', function () {
            var tb = document.querySelector('[data-tool-set="plates"]');
            if (tb && document.documentElement.getAttribute('data-tool') !== 'plates') tb.click();
            setTimeout(function () { var w = document.getElementById('rk-h-works'); if (w) w.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 80);
        }, ICO.save));
        if (CLOUD && users.length) node.appendChild(menuItem(t('au.m.import'), '', function (from) { Form({ mode: 'imp', back: from }); }, ICO.move));
        node.appendChild(menuItem(t('au.m.pw'), '', function (from) { Form({ mode: 'pw', back: from }); }, ICO.key));
        node.appendChild(el('div', 'au-sep'));
        node.appendChild(menuItem(t('au.m.out'), '', function () { signOut(); }, ICO.out));
        node.appendChild(menuItem(t(CLOUD ? 'au.m.del.c' : 'au.m.del'), 'au-item--bad', function (from) { Form({ mode: 'del', back: from }); }, ICO.del));
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
        $$('[data-au-av]').forEach(function (n) { paintAv(n, cur ? cur.login : '?', cur ? curLook() : null); });
        $$('[data-au-name]').forEach(function (n) { n.textContent = cur ? cur.login : ''; });
        $$('[data-au-open]').forEach(function (b) { if (cur && cur.admin) b.setAttribute('data-admin', '1'); else b.removeAttribute('data-admin'); });
        try { document.dispatchEvent(new CustomEvent('rk:profile')); } catch (e) { /* не страшно */ }
    }

    function start() {
        I = window.RKI18N;
        if (!cur) {
            /* обязательный вход: сначала создать профиль, если их ещё нет */
            document.documentElement.classList.add('rk-locked');
            Form({ mode: (CLOUD ? lastLogin() : users.length) ? 'in' : 'reg', full: true });
            return;
        }
        paintButtons();
        $$('[data-au-open]').forEach(function (b) {
            b.hidden = false;
            b.addEventListener('click', function () { openMenu(b); });
        });
        if (!CLOUD) { document.documentElement.classList.remove('rk-locked'); return; }

        /* облако: пока сверяемся с базой (блокировка, свежие работы с другого устройства), приложение закрыто заставкой */
        gate = true; booting = true; showGate();
        var done = false;
        var tm = setTimeout(function () { if (!done) { abandoned = true; gate = false; booting = false; hideGate(); } }, 6000);
        boot().then(function (res) {
            clearTimeout(tm); done = true; gate = false; booting = false;
            if (res && res.blocked !== undefined) showBlocked(res.blocked);
            else if (!(res && res.reload)) hideGate();
        }, function (e) {
            clearTimeout(tm); done = true; gate = false; booting = false; hideGate();
            if (e && e.code === 'auth') sessionLost();
            else if (e && e.code === 'blocked') showBlocked('');
        });
        setInterval(checkBlocked, 90000);
        document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'visible') softSync(); });
        window.addEventListener('online', function () { softSync(true); });
    }
    /* все скрипты страницы уже выполнились (в том числе переводы), когда наступает DOMContentLoaded */
    function verifiedStart() {
        if (!CLOUD || !pendingAdmin) {
            start();
            return;
        }

        document.documentElement.classList.add('rk-locked');

        RKCloud.captchaApproved().then(function (approved) {
            if (approved) {
                cur = pendingAdmin;
                pendingAdmin = null;
                booting = true;
            } else {
                pendingAdmin = null;
                booting = false;
                try { localStorage.removeItem(MEK); } catch (e) { noop(); }
            }
            start();
        }).catch(function () {
            pendingAdmin = null;
            booting = false;
            try { localStorage.removeItem(MEK); } catch (e) { noop(); }
            start();
        });
    }

    if (document.readyState === 'complete') {
        verifiedStart();
    } else {
        document.addEventListener('DOMContentLoaded', verifiedStart);
    }
})();
