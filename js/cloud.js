/* Облачная база (Supabase): вход, профили, работы. Без внешних библиотек: только fetch к REST-интерфейсу.
   Включается, когда в js/cloud-config.js вписаны адрес и ключ. Иначе window.RKCloud.on === false и приложение работает локально.
   Ошибки приходят как { code }: net, bad, exists, pass, rate, blocked, confirm, closed, auth, forbidden, server, nocrypto. */
(function () {
    'use strict';
    var C = window.RK_CLOUD || {};
    var base = String(C.url || '').replace(/\/+$/, '');
    var ON = !!(base && C.key);
    var DOMAIN = String(C.emailDomain || 'gmail.com').replace(/^@/, '');
    var SK = 'rk-cloud-sess';          /* токены входа */
    var TIMEOUT = 12000;

    var sess = null;
    function readSess() { try { var s = JSON.parse(localStorage.getItem(SK) || 'null'); return s && s.access_token && s.refresh_token && s.uid ? s : null; } catch (e) { return null; } }
    function writeSess(s) { sess = s; try { if (s) localStorage.setItem(SK, JSON.stringify(s)); else localStorage.removeItem(SK); } catch (e) { /* не страшно */ } }
    if (ON) sess = readSess();

    var RKCloud = window.RKCloud = { on: ON, hasSession: function () { return !!sess; }, uid: function () { return sess ? sess.uid : null; } };
    if (!ON) return;

    function nowSec() { return Math.floor(Date.now() / 1000); }
    function err(code, extra) { var e = { code: code }; if (extra) for (var k in extra) e[k] = extra[k]; return e; }

    /* ---------- HTTP ---------- */
    function http(method, path, body, headers) {
        var ctl = typeof AbortController === 'function' ? new AbortController() : null;
        var timer = setTimeout(function () { if (ctl) ctl.abort(); }, TIMEOUT);
        var h = { apikey: C.key, 'Content-Type': 'application/json' };
        for (var k in headers) if (headers[k] != null) h[k] = headers[k];
        return fetch(base + path, { method: method, headers: h, body: body === undefined ? undefined : JSON.stringify(body), signal: ctl ? ctl.signal : undefined, cache: 'no-store' })
            .then(function (r) {
                clearTimeout(timer);
                return r.text().then(function (t) {
                    var j = null; try { j = t ? JSON.parse(t) : null; } catch (e) { j = null; }
                    return { status: r.status, json: j, ok: r.ok };
                });
            }, function () { clearTimeout(timer); throw err('net'); });
    }
    function authCode(r) {
        var j = r.json || {}, m = String(j.msg || j.message || j.error_description || j.error || '').toLowerCase(), c = String(j.error_code || j.code || '').toLowerCase();
        if (c === 'user_banned' || m.indexOf('banned') >= 0) return 'blocked';
        if (c === 'invalid_credentials' || m.indexOf('invalid login') >= 0 || c === 'invalid_grant' || m.indexOf('invalid_grant') >= 0) return 'bad';
        if (c === 'user_already_exists' || c === 'email_exists' || m.indexOf('already registered') >= 0 || m.indexOf('already been registered') >= 0 || m.indexOf('database error saving new user') >= 0) return 'exists';
        if (c === 'weak_password' || m.indexOf('password should be') >= 0) return 'pass';
        if (c === 'signup_disabled' || m.indexOf('signups not allowed') >= 0) return 'closed';
        if (r.status === 429 || c === 'over_request_rate_limit' || c === 'over_email_send_rate_limit') return 'rate';
        if (r.status === 401 || r.status === 403) return 'auth';
        return 'server';
    }

    /* ---------- Токены ---------- */
    function fromTokens(j) {
        return { access_token: j.access_token, refresh_token: j.refresh_token, expires_at: j.expires_at || (nowSec() + (j.expires_in || 3600)), uid: j.user && j.user.id };
    }
    var refreshing = null;
    function refresh() {
        if (refreshing) return refreshing;
        if (!sess) return Promise.reject(err('auth'));
        var rt = sess.refresh_token;
        refreshing = http('POST', '/auth/v1/token?grant_type=refresh_token', { refresh_token: rt }).then(function (r) {
            refreshing = null;
            if (r.ok && r.json && r.json.access_token) {
                var s = fromTokens(r.json); if (!s.uid) s.uid = sess && sess.uid;
                writeSess(s); return s;
            }
            var c = authCode(r);
            if (c === 'server') throw err('net');            /* сбой сервера: сессию не трогаем */
            writeSess(null); throw err(c === 'blocked' ? 'blocked' : 'auth');
        }, function (e) { refreshing = null; throw e; });
        return refreshing;
    }
    function token() {
        if (!sess) return Promise.reject(err('auth'));
        if (sess.expires_at - nowSec() > 60) return Promise.resolve(sess.access_token);
        return refresh().then(function (s) { return s.access_token; });
    }
    /* запрос к таблицам: с токеном пользователя; при истёкшем токене один раз обновляем и повторяем */
    function api(method, path, body, extra, retried) {
        return token().then(function (tk) {
            var h = { Authorization: 'Bearer ' + tk };
            for (var k in extra) h[k] = extra[k];
            return http(method, path, body, h);
        }).then(function (r) {
            if (r.status === 401 && !retried) { if (sess) sess.expires_at = 0; return api(method, path, body, extra, true); }
            if (r.ok) return r.json;
            var c = authCode(r), j = r.json || {};
            if (r.status === 401) throw err('auth');
            if (r.status === 403 || String(j.code) === '42501') throw err('forbidden', { message: j.message });
            throw err(c === 'auth' ? 'server' : c, { message: j.message, status: r.status });
        });
    }

    /* ---------- Логин -> служебный адрес ---------- */
    function loginKey(login) { return String(login || '').replace(/\s+/g, ' ').trim().toLowerCase(); }
    function loginEmail(key) {
        if (!(window.crypto && crypto.subtle && window.TextEncoder)) return Promise.reject(err('nocrypto'));
        return crypto.subtle.digest('SHA-256', new TextEncoder().encode(key)).then(function (buf) {
            var a = new Uint8Array(buf), s = '';
            for (var i = 0; i < 16; i++) s += (a[i] < 16 ? '0' : '') + a[i].toString(16);
            return 'h' + s + '@' + DOMAIN;
        });
    }

    /* ---------- Вход и выход ---------- */
    RKCloud.signUp = function (login, pw) {
        var key = loginKey(login);
        return loginEmail(key).then(function (email) {
            return http('POST', '/auth/v1/signup', { email: email, password: pw, data: { login: String(login).trim(), login_key: key } });
        }).then(function (r) {
            if (!r.ok) throw err(authCode(r));
            var j = r.json || {};
            if (!j.access_token) throw err('confirm');
            var s = fromTokens(j); if (!s.uid) s.uid = j.user && j.user.id;
            writeSess(s); return s.uid;
        });
    };
    RKCloud.signIn = function (login, pw) {
        return loginEmail(loginKey(login)).then(function (email) {
            return http('POST', '/auth/v1/token?grant_type=password', { email: email, password: pw });
        }).then(function (r) {
            if (!r.ok || !r.json || !r.json.access_token) throw err(authCode(r) === 'auth' ? 'bad' : authCode(r));
            writeSess(fromTokens(r.json)); return sess.uid;
        });
    };
    RKCloud.signOut = function () {
        var s = sess; writeSess(null);
        if (!s) return Promise.resolve();
        return http('POST', '/auth/v1/logout', undefined, { Authorization: 'Bearer ' + s.access_token }).then(function () { /* готово */ }, function () { /* без интернета тоже выходим */ });
    };
    RKCloud.changePassword = function (login, oldPw, newPw) {
        return RKCloud.signIn(login, oldPw).catch(function (e) { throw err(e && e.code === 'bad' ? 'old' : (e && e.code) || 'server'); }).then(function () {
            return token();
        }).then(function (tk) {
            return http('PUT', '/auth/v1/user', { password: newPw }, { Authorization: 'Bearer ' + tk });
        }).then(function (r) { if (!r.ok) throw err(authCode(r)); });
    };
    RKCloud.deleteAccount = function () {
        return api('POST', '/rest/v1/rpc/delete_my_account', {}).then(function () { writeSess(null); });
    };

    /* ---------- Таблицы ---------- */
    RKCloud.getProfile = function () {
        return api('GET', '/rest/v1/profiles?id=eq.' + encodeURIComponent(sess.uid) + '&select=id,login,is_admin,blocked,blocked_reason,look,works_count,created_at').then(function (a) { return a && a[0] || null; });
    };
    RKCloud.patchProfile = function (obj) {
        return api('PATCH', '/rest/v1/profiles?id=eq.' + encodeURIComponent(sess.uid), obj, { Prefer: 'return=minimal' });
    };
    RKCloud.getData = function () {
        return api('GET', '/rest/v1/user_data?user_id=eq.' + encodeURIComponent(sess.uid) + '&select=projects,fabric,updated_at').then(function (a) { return a && a[0] || null; });
    };
    RKCloud.getStamp = function () {
        return api('GET', '/rest/v1/user_data?user_id=eq.' + encodeURIComponent(sess.uid) + '&select=updated_at').then(function (a) { return a && a[0] ? a[0].updated_at : null; });
    };
    RKCloud.putData = function (projects, fabric) {
        return api('POST', '/rest/v1/user_data', { user_id: sess.uid, projects: projects, fabric: fabric }, { Prefer: 'resolution=merge-duplicates,return=representation' }).then(function (a) { return a && a[0] || null; });
    };
    RKCloud.listProfiles = function () {
        return api('GET', '/rest/v1/profiles?select=id,login,is_admin,blocked,blocked_reason,blocked_at,look,works_count,created_at,last_seen&order=created_at.desc&limit=1000');
    };
    RKCloud.setBlocked = function (id, block, why) {
        return api('POST', '/rest/v1/rpc/admin_set_blocked', { target: id, do_block: !!block, why: why || null });
    };
    RKCloud.loginKey = loginKey;
})();
