/* Страница cloud-check.html: проверяет адрес и ключ, выключено ли подтверждение почты и созданы ли таблицы.
   Ничего не пишет в базу: только читает публичные настройки и пробует закрытые таблицы без входа. */
(function () {
    'use strict';
    var C = window.RK_CLOUD || {};
    var out = document.getElementById('out');
    var base = String(C.url || '').replace(/\/+$/, '');
    function row(state, title, msg) {
        var li = document.createElement('li'); li.className = state;
        var i = document.createElement('span'); i.className = 'i'; i.textContent = state === 'ok' ? '✔' : state === 'bad' ? '✖' : state === 'warn' ? '!' : '…';
        var d = document.createElement('div'), b = document.createElement('b'), m = document.createElement('span'); m.className = 'm';
        b.textContent = title; m.textContent = msg || '';
        d.appendChild(b); d.appendChild(m); li.appendChild(i); li.appendChild(d); out.appendChild(li);
        return li;
    }
    function get(method, path, body) {
        var ctl = typeof AbortController === 'function' ? new AbortController() : null;
        var timer = setTimeout(function () { if (ctl) ctl.abort(); }, 12000);
        return fetch(base + path, { method: method, headers: { apikey: C.key, 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined, cache: 'no-store', signal: ctl ? ctl.signal : undefined })
            .then(function (r) { clearTimeout(timer); return r.text().then(function (t) { var j = null; try { j = t ? JSON.parse(t) : null; } catch (e) { j = null; } return { status: r.status, json: j }; }); },
                function () { clearTimeout(timer); return { status: 0, json: null }; });
    }
    function code(r) { var j = r.json || {}; return String(j.code || j.error_code || ''); }

    function run() {
        out.textContent = '';
        if (!base || !C.key) { row('bad', '1. Адрес и ключ', 'В файле js/cloud-config.js не заполнены url и key. См. SETUP-SUPABASE.txt, шаг 5.'); return; }
        if (!/^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(base)) row('warn', '1. Адрес проекта', 'Адрес должен выглядеть как https://abcdxyz.supabase.co (без / на конце). Сейчас: ' + base);
        else row('ok', '1. Адрес и ключ заполнены', base);
        if (/service_role|secret/i.test(C.key) || /^sb_secret_/.test(C.key)) row('bad', 'Ключ', 'Это секретный ключ! Его нельзя хранить в коде. Возьмите «anon public» или «Publishable» и срочно замените секретный в Supabase.');
        var li2 = row('wait', '2. Связь с Supabase и вход без почты', 'Проверяем…');
        get('GET', '/auth/v1/settings').then(function (r) {
            li2.remove();
            if (r.status === 0) { row('bad', '2. Связь с Supabase', 'Нет ответа. Проверьте адрес, интернет, и что проект не «спит» (Supabase → Restore project).'); return; }
            if (r.status === 401 || r.status === 403) { row('bad', '2. Ключ не подошёл', 'Supabase ответил «нет доступа». Проверьте, что вставлен ключ anon public / Publishable от ЭТОГО проекта.'); return; }
            if (r.status !== 200 || !r.json) { row('bad', '2. Связь с Supabase', 'Неожиданный ответ (' + r.status + ').'); return; }
            row('ok', '2. Supabase отвечает', 'Адрес и ключ верные.');
            var j = r.json;
            if (j.mailer_autoconfirm === false) row('bad', '3. Подтверждение почты включено', 'Регистрация не заработает. Authentication → Sign In / Providers → Email → выключите «Confirm email» → Save.');
            else if (j.mailer_autoconfirm === true) row('ok', '3. Подтверждение почты выключено', 'Регистрация по логину и паролю работает.');
            else row('warn', '3. Подтверждение почты', 'Не удалось определить. Проверьте вручную, что «Confirm email» выключено.');
            if (j.disable_signup === true) row('bad', 'Регистрация отключена', 'Включите «Allow new users to sign up» (Authentication → Sign In / Providers).');
        });
        var li4 = row('wait', '4. Таблицы базы', 'Проверяем…');
        get('GET', '/rest/v1/profiles?select=id&limit=1').then(function (r) {
            li4.remove();
            var c = code(r);
            if (r.status === 0) { row('warn', '4. Таблицы базы', 'Нет ответа от сервера, проверить не удалось.'); return; }
            if (r.status === 404 || c === 'PGRST205' || c === '42P01') row('bad', '4. Таблицы не созданы', 'Выполните файл supabase-setup.sql в SQL Editor (SETUP-SUPABASE.txt, шаг 2).');
            else if (r.status === 401 || r.status === 403 || c === '42501') row('ok', '4. Таблицы созданы и закрыты', 'Без входа список аккаунтов недоступен, как и должно быть.');
            else if (r.status === 200 && Array.isArray(r.json) && r.json.length === 0) row('warn', '4. Таблицы созданы', 'Ответ пустой. Это нормально, если аккаунтов ещё нет или закрыт доступ без входа.');
            else if (r.status === 200) row('bad', '4. Таблица profiles открыта всем!', 'Любой может прочитать список без входа. Запустите supabase-setup.sql заново: он закроет доступ.');
            else row('warn', '4. Таблицы базы', 'Неожиданный ответ (' + r.status + ' ' + c + ').');
        });
        var li5 = row('wait', '5. Функции админа', 'Проверяем…');
        get('POST', '/rest/v1/rpc/admin_set_blocked', { target: '00000000-0000-0000-0000-000000000000', do_block: false }).then(function (r) {
            li5.remove();
            var c = code(r);
            if (r.status === 0) { row('warn', '5. Функции админа', 'Нет ответа от сервера.'); return; }
            if (r.status === 404 || c === 'PGRST202') row('bad', '5. Функции админа не созданы', 'Выполните supabase-setup.sql целиком (SETUP-SUPABASE.txt, шаг 2).');
            else row('ok', '5. Функции админа на месте', 'Без входа ими пользоваться нельзя, как и должно быть.');
        });
    }
    document.getElementById('again').addEventListener('click', run);
    run();
})();
