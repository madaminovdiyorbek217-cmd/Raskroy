/* Оформление профиля (аватарка, рамка, титул, статус) и админ-панель.
   Работает поверх js/auth.js: RKAuth.look / setLook / paintAv, а админ-панель берёт список аккаунтов из облака (RKCloud).
   RKProfile.info(look, works, admin) -> { title, levelText, progress, hint };  RKProfile.edit();  RKProfile.admin(). */
(function () {
    'use strict';

    /* ---------- Слова (ru / en / uz) ---------- */
    var D = {
        'pf.edit.title': ['Мой профиль', 'My profile', 'Mening profilim'],
        'pf.sec.avatar': ['Аватарка', 'Avatar', 'Avatar'],
        'pf.k.letter': ['Буква', 'Letter', 'Harf'], 'pf.k.emoji': ['Эмодзи', 'Emoji', 'Emoji'], 'pf.k.photo': ['Фото', 'Photo', 'Rasm'],
        'pf.photo.pick': ['Выбрать фото', 'Choose a photo', 'Rasm tanlash'], 'pf.photo.del': ['Убрать фото', 'Remove photo', 'Rasmni olib tashlash'],
        'pf.photo.hint': ['Фото обрежется до квадрата и сожмётся.', 'The photo is cropped to a square and compressed.', 'Rasm kvadratga kesiladi va siqiladi.'],
        'pf.photo.err': ['Не удалось открыть картинку', 'Could not open the image', 'Rasmni ochib bo‘lmadi'],
        'pf.sec.bg': ['Цвет фона', 'Background', 'Fon rangi'], 'pf.bg.custom': ['Свой цвет', 'Custom colour', 'O‘z rangingiz'], 'pf.bg.auto': ['Авто', 'Auto', 'Avto'],
        'pf.sec.ring': ['Рамка', 'Frame', 'Ramka'],
        'pf.ring.none': ['Нет', 'None', 'Yo‘q'], 'pf.ring.solid': ['Кольцо', 'Ring', 'Halqa'], 'pf.ring.grad': ['Градиент', 'Gradient', 'Gradient'],
        'pf.ring.dash': ['Пунктир', 'Dashed', 'Punktir'], 'pf.ring.glow': ['Свечение', 'Glow', 'Nur'], 'pf.ring.rainbow': ['Радуга', 'Rainbow', 'Kamalak'],
        'pf.sec.title': ['Титул', 'Title', 'Unvon'], 'pf.title.auto': ['По уровню', 'By level', 'Daraja bo‘yicha'], 'pf.title.locked': ['с уровня {n}', 'from level {n}', '{n}-darajadan'],
        'pf.sec.status': ['Статус', 'Status', 'Holat'], 'pf.status.ph': ['Чем занят сейчас', 'What are you up to', 'Hozir nima bilan bandsiz'],
        'pf.st.1': ['🔨 Режу заказ', '🔨 Cutting an order', '🔨 Buyurtma kesyapman'],
        'pf.st.2': ['☕ Перерыв', '☕ On a break', '☕ Tanaffus'],
        'pf.st.3': ['🚀 Готов к заказам', '🚀 Open for orders', '🚀 Buyurtmalarga tayyorman'],
        'pf.st.4': ['🏠 Работаю из дома', '🏠 Working from home', '🏠 Uydan ishlayman'],
        'pf.sec.bio': ['О себе', 'About me', 'Men haqimda'], 'pf.bio.ph': ['Пара слов о себе', 'A few words about you', 'O‘zingiz haqingizda bir necha so‘z'],
        'pf.save': ['Сохранить', 'Save', 'Saqlash'], 'pf.saved': ['Профиль обновлён', 'Profile updated', 'Profil yangilandi'], 'pf.err': ['Не удалось сохранить, попробуйте ещё раз', 'Could not save, please try again', 'Saqlab bo‘lmadi, yana urinib ko‘ring'],
        'pf.lvl': ['Уровень {n} · {name}', 'Level {n} · {name}', '{n}-daraja · {name}'],
        'pf.next': ['До уровня «{name}»: ещё {k}', 'To level “{name}”: {k} more', '«{name}» darajasigacha: yana {k}'],
        'pf.max': ['Высший уровень', 'Top level', 'Eng yuqori daraja'],
        'pf.admin': ['Главный админ', 'Main admin', 'Bosh admin'],
        'pf.adm.title': ['Админ-панель', 'Admin panel', 'Admin paneli'],
        'pf.adm.total': ['Всего', 'Total', 'Jami'], 'pf.adm.active': ['Активные', 'Active', 'Faol'], 'pf.adm.blocked': ['Заблокировано', 'Blocked', 'Bloklangan'], 'pf.adm.new': ['Новые', 'New', 'Yangi'],
        'pf.adm.tip': ['Активные и новые: за последние 7 дней', 'Active and new: in the last 7 days', 'Faol va yangi: so‘nggi 7 kun'],
        'pf.adm.search': ['Поиск по логину', 'Search by login', 'Login bo‘yicha qidirish'],
        'pf.f.all': ['Все', 'All', 'Hammasi'], 'pf.f.active': ['Активные', 'Active', 'Faol'], 'pf.f.blocked': ['Заблокированные', 'Blocked', 'Bloklangan'],
        'pf.adm.reg': ['Регистрация', 'Registered', 'Ro‘yxatdan o‘tgan'], 'pf.adm.seen': ['В сети', 'Last seen', 'Oxirgi kirish'], 'pf.adm.works': ['Работ', 'Jobs', 'Ishlar'],
        'pf.adm.block': ['Заблокировать', 'Block', 'Bloklash'], 'pf.adm.unblock': ['Разблокировать', 'Unblock', 'Blokdan chiqarish'],
        'pf.adm.reason': ['Заблокировать «{n}»? Причина (необязательно):', 'Block “{n}”? Reason (optional):', '«{n}» bloklansinmi? Sabab (ixtiyoriy):'],
        'pf.adm.unq': ['Разблокировать «{n}»?', 'Unblock “{n}”?', '«{n}» blokdan chiqarilsinmi?'],
        'pf.adm.blk': ['Заблокирован', 'Blocked', 'Bloklangan'], 'pf.adm.root': ['Главный админ', 'Main admin', 'Bosh admin'],
        'pf.adm.empty': ['Никого не найдено', 'Nobody found', 'Hech kim topilmadi'], 'pf.adm.load': ['Загрузка…', 'Loading…', 'Yuklanmoqda…'],
        'pf.adm.fail': ['Не удалось загрузить список. Проверьте интернет.', 'Could not load the list. Check your connection.', 'Ro‘yxatni yuklab bo‘lmadi. Internetni tekshiring.'],
        'pf.adm.done': ['Готово', 'Done', 'Tayyor'], 'pf.adm.refresh': ['Обновить', 'Refresh', 'Yangilash'], 'pf.adm.close': ['Закрыть', 'Close', 'Yopish'],
        'pf.adm.cnt': ['Показано {n} из {m}', 'Showing {n} of {m}', '{m} tadan {n} ta ko‘rsatilgan'],
        'pf.t.now': ['только что', 'just now', 'hozir'], 'pf.t.min': ['{n} мин назад', '{n} min ago', '{n} daqiqa oldin'],
        'pf.t.hour': ['{n} ч назад', '{n} h ago', '{n} soat oldin'], 'pf.t.day': ['{n} дн. назад', '{n} d ago', '{n} kun oldin']
    };
    function lang() { try { var l = window.RKI18N && window.RKI18N.lang(); return l === 'en' || l === 'uz' ? l : 'ru'; } catch (e) { return 'ru'; } }
    function t(k, v) {
        var a = D[k], s = a ? a[{ ru: 0, en: 1, uz: 2 }[lang()]] : k;
        if (v) for (var n in v) s = s.split('{' + n + '}').join(v[n]);
        return s;
    }
    function au(k, v) { try { return window.RKI18N.t(k, v); } catch (e) { return k; } }

    /* ---------- Уровни и титулы ---------- */
    var LEVELS = [
        { n: 0, nm: ['Новичок', 'Rookie', 'Yangi boshlovchi'] },
        { n: 3, nm: ['Раскройщик', 'Cutter', 'Kesuvchi'] },
        { n: 10, nm: ['Мастер', 'Master', 'Usta'] },
        { n: 25, nm: ['Эксперт', 'Expert', 'Ekspert'] },
        { n: 50, nm: ['Гроссмейстер', 'Grandmaster', 'Grossmeyster'] }
    ];
    var TITLES = [
        { id: 'saw', lvl: 0, nm: ['Любитель пилить', 'Saw enthusiast', 'Arralash ishqibozi'] },
        { id: 'ldsp', lvl: 1, nm: ['Король ЛДСП', 'Chipboard King', 'LDSP shohi'] },
        { id: 'edge', lvl: 1, nm: ['Повелитель кромки', 'Lord of the Edge', 'Kromka hukmdori'] },
        { id: 'eco', lvl: 2, nm: ['Экономист листа', 'Sheet Economist', 'Varaq tejamkori'] },
        { id: 'waste', lvl: 2, nm: ['Охотник за отходами', 'Waste Hunter', 'Chiqindi ovchisi'] },
        { id: 'tech', lvl: 3, nm: ['Технолог от бога', 'Born Technologist', 'Tug‘ma texnolog'] },
        { id: 'cnc', lvl: 3, nm: ['Хозяин станка', 'Machine Master', 'Stanok xo‘jayini'] },
        { id: 'legend', lvl: 4, nm: ['Легенда раскроя', 'Cutting Legend', 'Bichish afsonasi'] },
        { id: 'maker', lvl: 0, admin: true, nm: ['Создатель', 'Creator', 'Yaratuvchi'] }
    ];
    var LI = function () { return { ru: 0, en: 1, uz: 2 }[lang()]; };
    function levelOf(works) { var i = 0; LEVELS.forEach(function (l, k) { if (works >= l.n) i = k; }); return i; }
    function titleById(id) { return TITLES.filter(function (x) { return x.id === id; })[0] || null; }
    function info(look, works, admin) {
        look = look || {}; works = works || 0;
        var lv = levelOf(works), L = LEVELS[lv], nx = LEVELS[lv + 1];
        var ti = titleById(look.t), name;
        if (ti && (ti.admin ? admin : ti.lvl <= lv || admin)) name = ti.nm[LI()];
        else name = admin ? t('pf.admin') : L.nm[LI()];
        return {
            title: name,
            level: lv + 1,
            levelText: t('pf.lvl', { n: lv + 1, name: L.nm[LI()] }),
            progress: nx ? Math.min(1, (works - L.n) / (nx.n - L.n)) : 1,
            hint: nx ? t('pf.next', { name: nx.nm[LI()], k: nx.n - works }) : t('pf.max')
        };
    }

    /* ---------- Подбор оформления ---------- */
    var GRADS = [['#6366f1', '#8b5cf6'], ['#0ea5e9', '#22d3ee'], ['#10b981', '#84cc16'], ['#f59e0b', '#ef4444'], ['#ec4899', '#f43f5e'], ['#14b8a6', '#3b82f6'],
        ['#a855f7', '#ec4899'], ['#64748b', '#0f172a'], ['#f97316', '#facc15'], ['#22c55e', '#06b6d4'], ['#e11d48', '#7c3aed'], ['#78350f', '#d97706']];
    var RINGS = ['none', 'solid', 'grad', 'dash', 'glow', 'rainbow'];
    var EMOJI = [
        '🪚', '🔨', '🛠️', '📐', '📏', '🪵', '🧰', '🪑', '🛋️', '🚪', '🛏️', '🗄️',
        '🏠', '⚙️', '🔧', '🫛', '🧱', '🪟',
        '😀', '😎', '🤓', '🥳', '🤠', '🧐', '🤩', '😺',
        '🦊', '🐻', '🐼', '🦁', '🐯', '🐸', '🦉', '🐙', '🦄', '🐝', '🐺', '🐧',
        '🌲', '🌵', '🌻', '🔥', '⚡', '🌈', '☕', '🍀', '🌙', '⭐',
        '👑', '💎', '🚀', '🎯', '🏆', '💡', '🎨', '🧩', '🎲', '❤️'
    ];

    function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
    function toast(m) { if (window.RKApp && window.RKApp.toast) window.RKApp.toast(m); }
    function clone(o) { try { return JSON.parse(JSON.stringify(o || {})); } catch (e) { return {}; } }
    function paint(n, login, look) { window.RKAuth.paintAv(n, login, look); }

    /* ---------- Фото: квадрат 144x144, JPEG, до ~40 КБ ---------- */
    function photoToData(file) {
        return new Promise(function (resolve, reject) {
            if (!file || !/^image\//.test(file.type)) { reject(new Error('type')); return; }
            var url = URL.createObjectURL(file), img = new Image();
            img.onload = function () {
                URL.revokeObjectURL(url);
                try {
                    var S = 144, c = document.createElement('canvas'); c.width = S; c.height = S;
                    var g = c.getContext('2d'), m = Math.min(img.naturalWidth, img.naturalHeight);
                    if (!m) { reject(new Error('size')); return; }
                    g.fillStyle = '#fff'; g.fillRect(0, 0, S, S);
                    g.drawImage(img, (img.naturalWidth - m) / 2, (img.naturalHeight - m) / 2, m, m, 0, 0, S, S);
                    var q = 0.85, out = c.toDataURL('image/jpeg', q);
                    while (out.length > 42000 && q > 0.4) { q -= 0.1; out = c.toDataURL('image/jpeg', q); }
                    if (out.length > 44000) { reject(new Error('big')); return; }
                    resolve(out);
                } catch (e) { reject(e); }
            };
            img.onerror = function () { URL.revokeObjectURL(url); reject(new Error('load')); };
            img.src = url;
        });
    }

    /* ---------- Окно оформления ---------- */
    var editor = null;
    function closeEditor() {
        if (!editor) return;
        document.removeEventListener('keydown', editor.key, true);
        editor.wrap.remove(); document.documentElement.classList.remove('rkx-lock');
        var f = editor.from; editor = null;
        if (f && f.focus) { try { f.focus({ preventScroll: true }); } catch (e) { /* не страшно */ } }
    }
    function edit(from) {
        var A = window.RKAuth, me = A.user();
        if (!me || editor) return;
        var draft = clone(A.look()); draft.a = draft.a || {}; if (!draft.r) draft.r = 'none';
        var works = A.works();

        var wrap = el('div', 'rkx-wrap'); wrap.setAttribute('role', 'dialog'); wrap.setAttribute('aria-modal', 'true'); wrap.setAttribute('aria-labelledby', 'pf-h');
        var card = el('div', 'rkx-card pf-card'); wrap.appendChild(card);
        var key = function (e) { if (e.key === 'Escape' && !document.querySelector('.rkc-wrap, .rkc-pop, [data-rkc]')) { e.preventDefault(); e.stopPropagation(); closeEditor(); } };

        /* предпросмотр */
        var top = el('div', 'pf-top');
        var prev = el('span', 'au-av pf-prev');
        var who = el('div', 'pf-who');
        var h = el('h2', 'au-h', t('pf.edit.title')); h.id = 'pf-h';
        var nm = el('b', null, me.login); var tt = el('span', 'au-title');
        who.appendChild(h); who.appendChild(nm); who.appendChild(tt);
        top.appendChild(prev); top.appendChild(who); card.appendChild(top);

        var body = el('div', 'pf-body'); card.appendChild(body);
        function sec(label) { var s = el('section', 'pf-sec'); s.appendChild(el('h3', 'pf-h3', label)); body.appendChild(s); return s; }
        function refresh() {
            paint(prev, me.login, draft);
            tt.textContent = info(draft, works, me.admin).title;
            kindBtns.forEach(function (b) { b.setAttribute('aria-checked', String((draft.a.k || 'letter') === b.getAttribute('data-k'))); });
            emojiBox.hidden = draft.a.k !== 'emoji'; photoBox.hidden = draft.a.k !== 'photo';
            $all('.pf-emo', emojiBox).forEach(function (b) { b.classList.toggle('is-on', draft.a.k === 'emoji' && draft.a.e === b.textContent); });
            $all('.pf-sw', bgBox).forEach(function (b) {
                var v = b.getAttribute('data-bg'), on = v === 'auto' ? draft.a.bg == null : v === 'custom' ? typeof draft.a.bg === 'string' : String(draft.a.bg) === v;
                b.classList.toggle('is-on', on);
            });
            $all('.pf-ring', ringBox).forEach(function (b) { b.classList.toggle('is-on', b.getAttribute('data-r') === (draft.r || 'none')); });
            $all('.pf-ttl', titleBox).forEach(function (b) { b.classList.toggle('is-on', (b.getAttribute('data-t') || '') === (draft.t || '')); });
        }
        function $all(sel, r) { return Array.prototype.slice.call((r || card).querySelectorAll(sel)); }

        /* аватарка */
        var s1 = sec(t('pf.sec.avatar'));
        var seg = el('div', 'rk-pick pf-seg'); seg.setAttribute('role', 'radiogroup');
        var kindBtns = ['letter', 'emoji', 'photo'].map(function (k) {
            var b = el('button', null, t('pf.k.' + k)); b.type = 'button'; b.setAttribute('role', 'radio'); b.setAttribute('data-k', k);
            b.addEventListener('click', function () { draft.a.k = k; refresh(); });
            seg.appendChild(b); return b;
        });
        s1.appendChild(seg);
        var emojiBox = el('div', 'pf-emojis');
        EMOJI.forEach(function (e) {
            var b = el('button', 'pf-emo', e); b.type = 'button';
            b.addEventListener('click', function () { draft.a.k = 'emoji'; draft.a.e = e; refresh(); });
            emojiBox.appendChild(b);
        });
        s1.appendChild(emojiBox);
        var photoBox = el('div', 'pf-photo');
        var file = el('input'); file.type = 'file'; file.accept = 'image/*'; file.hidden = true;
        var pick = el('button', 'rk-btn', t('pf.photo.pick')); pick.type = 'button';
        pick.addEventListener('click', function () { file.value = ''; file.click(); });
        var del = el('button', 'rk-btn rk-btn--ghost', t('pf.photo.del')); del.type = 'button';
        del.addEventListener('click', function () { delete draft.a.p; draft.a.k = 'letter'; refresh(); });
        file.addEventListener('change', function () {
            if (!file.files || !file.files[0]) return;
            photoToData(file.files[0]).then(function (d) { draft.a.p = d; draft.a.k = 'photo'; refresh(); }, function () { toast(t('pf.photo.err')); });
        });
        photoBox.appendChild(pick); photoBox.appendChild(del); photoBox.appendChild(file);
        photoBox.appendChild(el('p', 'au-note', t('pf.photo.hint')));
        s1.appendChild(photoBox);

        /* фон */
        var s2 = sec(t('pf.sec.bg'));
        var bgBox = el('div', 'pf-sws');
        var auto = el('button', 'pf-sw pf-sw--auto', t('pf.bg.auto')); auto.type = 'button'; auto.setAttribute('data-bg', 'auto');
        auto.addEventListener('click', function () { delete draft.a.bg; refresh(); });
        bgBox.appendChild(auto);
        GRADS.forEach(function (g, i) {
            var b = el('button', 'pf-sw'); b.type = 'button'; b.setAttribute('data-bg', String(i)); b.setAttribute('aria-label', String(i + 1));
            b.style.background = 'linear-gradient(135deg,' + g[0] + ',' + g[1] + ')';
            b.addEventListener('click', function () { draft.a.bg = i; refresh(); });
            bgBox.appendChild(b);
        });
        var cu = el('button', 'pf-sw pf-sw--custom', '+'); cu.type = 'button'; cu.setAttribute('data-bg', 'custom'); cu.setAttribute('aria-label', t('pf.bg.custom'));
        cu.addEventListener('click', function () {
            var start = typeof draft.a.bg === 'string' ? draft.a.bg : '#6366f1', back = draft.a.bg;
            if (window.RKColorPick) {
                window.RKColorPick.open({
                    title: t('pf.bg.custom'), value: start,
                    onInput: function (hex) { draft.a.bg = hex.toLowerCase(); refresh(); },
                    onDone: function (hex) { draft.a.bg = hex.toLowerCase(); refresh(); },
                    onCancel: function () { if (back == null) delete draft.a.bg; else draft.a.bg = back; refresh(); }
                });
            } else { var inp = el('input'); inp.type = 'color'; inp.value = start; inp.addEventListener('input', function () { draft.a.bg = inp.value; refresh(); }); inp.click(); }
        });
        bgBox.appendChild(cu);
        s2.appendChild(bgBox);

        /* рамка */
        var s3 = sec(t('pf.sec.ring'));
        var ringBox = el('div', 'pf-rings');
        RINGS.forEach(function (r) {
            var b = el('button', 'pf-ring'); b.type = 'button'; b.setAttribute('data-r', r);
            var mini = el('span', 'au-av au-av--sm'); b.appendChild(mini);
            paint(mini, me.login, { a: { bg: 7 }, r: r });
            mini.textContent = '';
            b.appendChild(el('span', null, t('pf.ring.' + r)));
            b.addEventListener('click', function () { draft.r = r; refresh(); });
            ringBox.appendChild(b);
        });
        s3.appendChild(ringBox);

        /* титул */
        var s4 = sec(t('pf.sec.title'));
        var titleBox = el('div', 'pf-titles'); var lv = levelOf(works);
        var mk = function (id, label, locked, lockText) {
            var b = el('button', 'pf-ttl'); b.type = 'button'; b.setAttribute('data-t', id || '');
            b.appendChild(el('span', null, label));
            if (locked) { b.disabled = true; b.appendChild(el('small', null, '🔒 ' + lockText)); }
            b.addEventListener('click', function () { if (id) draft.t = id; else delete draft.t; refresh(); });
            titleBox.appendChild(b);
        };
        mk('', t('pf.title.auto'), false);
        TITLES.forEach(function (x) {
            if (x.admin && !me.admin) return;
            var locked = !me.admin && x.lvl > lv;
            mk(x.id, (x.admin ? '👑 ' : '') + x.nm[LI()], locked, t('pf.title.locked', { n: x.lvl + 1 }));
        });
        s4.appendChild(titleBox);

        /* статус и «о себе» */
        var s5 = sec(t('pf.sec.status'));
        var st = el('input', 'rk-input'); st.type = 'text'; st.maxLength = 40; st.placeholder = t('pf.status.ph'); st.value = draft.s || '';
        st.addEventListener('input', function () { draft.s = st.value; });
        s5.appendChild(st);
        var pre = el('div', 'pf-presets');
        [1, 2, 3, 4].forEach(function (i) {
            var b = el('button', 'pf-pre', t('pf.st.' + i)); b.type = 'button';
            b.addEventListener('click', function () { draft.s = b.textContent; st.value = draft.s; });
            pre.appendChild(b);
        });
        s5.appendChild(pre);
        var s6 = sec(t('pf.sec.bio'));
        var bio = el('textarea', 'rk-input pf-bio'); bio.maxLength = 140; bio.rows = 2; bio.placeholder = t('pf.bio.ph'); bio.value = draft.b || '';
        bio.addEventListener('input', function () { draft.b = bio.value; });
        s6.appendChild(bio);

        var btns = el('div', 'au-btns au-btns--2 pf-btns');
        var no = el('button', 'rk-btn rk-btn--ghost', au('d.cancel')); no.type = 'button'; no.addEventListener('click', closeEditor);
        var go = el('button', 'rk-btn rk-btn--main', t('pf.save')); go.type = 'button';
        go.addEventListener('click', function () {
            go.disabled = true;
            A.setLook(draft).then(function () { closeEditor(); toast(t('pf.saved')); }, function () { go.disabled = false; toast(t('pf.err')); });
        });
        btns.appendChild(no); btns.appendChild(go); card.appendChild(btns);

        wrap.addEventListener('mousedown', function (e) { if (e.target === wrap) closeEditor(); });
        document.body.appendChild(wrap);
        document.documentElement.classList.add('rkx-lock');
        document.addEventListener('keydown', key, true);
        editor = { wrap: wrap, key: key, from: from };
        refresh();
    }

    /* ---------- Админ-панель ---------- */
    var adm = null;
    function closeAdmin() {
        if (!adm) return;
        document.removeEventListener('keydown', adm.key, true);
        adm.wrap.remove(); document.documentElement.classList.remove('rkx-lock');
        var f = adm.from; adm = null;
        if (f && f.focus) { try { f.focus({ preventScroll: true }); } catch (e) { /* не страшно */ } }
    }
    function ago(iso) {
        var ms = Date.now() - Date.parse(iso);
        if (!isFinite(ms) || ms < 0) return '';
        var m = Math.floor(ms / 60000);
        if (m < 2) return t('pf.t.now');
        if (m < 60) return t('pf.t.min', { n: m });
        var hh = Math.floor(m / 60);
        if (hh < 24) return t('pf.t.hour', { n: hh });
        var d = Math.floor(hh / 24);
        if (d < 31) return t('pf.t.day', { n: d });
        return day(iso);
    }
    function day(iso) {
        var d = new Date(iso); if (isNaN(d)) return '';
        var z = function (n) { return (n < 10 ? '0' : '') + n; };
        return z(d.getDate()) + '.' + z(d.getMonth() + 1) + '.' + d.getFullYear();
    }
    function admin(from) {
        var A = window.RKAuth, C = window.RKCloud, me = A.user();
        if (!me || !me.admin || !C || !C.on || adm) return;
        var wrap = el('div', 'rk-adm'); wrap.setAttribute('role', 'dialog'); wrap.setAttribute('aria-modal', 'true'); wrap.setAttribute('aria-labelledby', 'adm-h');
        var panel = el('div', 'adm-panel'); wrap.appendChild(panel);
        var key = function (e) { if (e.key === 'Escape' && !document.querySelector('.rkx-wrap')) { e.preventDefault(); e.stopPropagation(); closeAdmin(); } };

        var bar = el('div', 'adm-bar');
        var h = el('h2', 'au-h', t('pf.adm.title')); h.id = 'adm-h';
        var rf = el('button', 'rk-btn rk-btn--ghost adm-rf', t('pf.adm.refresh')); rf.type = 'button';
        var cl = el('button', 'rk-btn rk-btn--main adm-x', t('pf.adm.close')); cl.type = 'button'; cl.addEventListener('click', closeAdmin);
        bar.appendChild(h); bar.appendChild(rf); bar.appendChild(cl); panel.appendChild(bar);

        var tiles = el('div', 'adm-tiles'); tiles.title = t('pf.adm.tip'); panel.appendChild(tiles);
        var q = el('input', 'rk-input adm-q'); q.type = 'search'; q.placeholder = t('pf.adm.search'); q.setAttribute('autocomplete', 'off'); q.setAttribute('autocapitalize', 'none');
        panel.appendChild(q);
        var flt = el('div', 'rk-pick adm-flt'); flt.setAttribute('role', 'radiogroup');
        var filter = 'all', fb = {};
        ['all', 'active', 'blocked'].forEach(function (f) {
            var b = el('button', null, t('pf.f.' + f)); b.type = 'button'; b.setAttribute('role', 'radio'); fb[f] = b;
            b.addEventListener('click', function () { filter = f; render(); });
            flt.appendChild(b);
        });
        panel.appendChild(flt);
        var cnt = el('p', 'au-note adm-cnt'); panel.appendChild(cnt);
        var list = el('div', 'adm-list'); panel.appendChild(list);

        var rows = [], WEEK = 7 * 864e5;
        function load() {
            list.textContent = ''; list.appendChild(el('p', 'au-sub adm-msg', t('pf.adm.load'))); rf.disabled = true;
            C.listProfiles().then(function (a) { rows = Array.isArray(a) ? a : []; rf.disabled = false; render(); }, function () {
                rf.disabled = false; list.textContent = ''; list.appendChild(el('p', 'au-err adm-msg', t('pf.adm.fail')));
            });
        }
        function tile(n, label) { var d = el('div', 'adm-tile'); d.appendChild(el('b', null, String(n))); d.appendChild(el('span', null, label)); tiles.appendChild(d); }
        function render() {
            var now = Date.now();
            var total = rows.length, blocked = rows.filter(function (r) { return r.blocked; }).length;
            var act = rows.filter(function (r) { return now - Date.parse(r.last_seen) < WEEK; }).length;
            var neu = rows.filter(function (r) { return now - Date.parse(r.created_at) < WEEK; }).length;
            tiles.textContent = '';
            tile(total, t('pf.adm.total')); tile(act, t('pf.adm.active')); tile(neu, t('pf.adm.new')); tile(blocked, t('pf.adm.blocked'));
            for (var f in fb) fb[f].setAttribute('aria-checked', String(f === filter));
            var term = q.value.trim().toLowerCase();
            var vis = rows.filter(function (r) {
                if (filter === 'blocked' && !r.blocked) return false;
                if (filter === 'active' && !(now - Date.parse(r.last_seen) < WEEK)) return false;
                return !term || String(r.login).toLowerCase().indexOf(term) >= 0;
            });
            cnt.textContent = t('pf.adm.cnt', { n: vis.length, m: total });
            list.textContent = '';
            if (!vis.length) { list.appendChild(el('p', 'au-sub adm-msg', t('pf.adm.empty'))); return; }
            vis.forEach(function (r) { list.appendChild(row(r)); });
        }
        function row(r) {
            var li = el('article', 'adm-row' + (r.blocked ? ' is-blocked' : ''));
            var av = el('span', 'au-av adm-av'); paint(av, r.login, r.look); li.appendChild(av);
            var tx = el('div', 'adm-info');
            var nm = el('b', null, r.login); if (r.is_admin) nm.appendChild(el('span', 'au-crown', ' 👑'));
            tx.appendChild(nm);
            var inf = info(r.look, r.works_count, r.is_admin);
            tx.appendChild(el('span', 'au-title', inf.title + (r.look && r.look.s ? ' · ' + r.look.s : '')));
            tx.appendChild(el('small', 'adm-meta', t('pf.adm.reg') + ': ' + day(r.created_at) + ' · ' + t('pf.adm.seen') + ': ' + ago(r.last_seen) + ' · ' + t('pf.adm.works') + ': ' + (r.works_count || 0)));
            if (r.blocked) tx.appendChild(el('small', 'adm-why', '⛔ ' + t('pf.adm.blk') + (r.blocked_reason ? ': ' + r.blocked_reason : '')));
            li.appendChild(tx);
            if (r.is_admin) { li.appendChild(el('span', 'adm-root', t('pf.adm.root'))); return li; }
            var b = el('button', 'rk-btn adm-act ' + (r.blocked ? '' : 'rkd-danger'), t(r.blocked ? 'pf.adm.unblock' : 'pf.adm.block')); b.type = 'button';
            b.addEventListener('click', function () {
                var dlg = window.RKDialog;
                var go = function (block, why) {
                    b.disabled = true;
                    C.setBlocked(r.id, block, why).then(function () { toast(t('pf.adm.done')); load(); }, function () { b.disabled = false; toast(t('pf.err')); });
                };
                if (r.blocked) {
                    (dlg ? dlg.confirm(t('pf.adm.unq', { n: r.login }), { ok: t('pf.adm.unblock') }) : Promise.resolve(window.confirm(t('pf.adm.unq', { n: r.login })))).then(function (y) { if (y) go(false); });
                } else if (dlg && dlg.prompt) {
                    dlg.prompt(t('pf.adm.reason', { n: r.login }), { ok: t('pf.adm.block'), max: 120 }).then(function (why) { if (why !== null && why !== undefined) go(true, why); });
                } else go(true, '');
            });
            li.appendChild(b);
            return li;
        }
        rf.addEventListener('click', load);
        q.addEventListener('input', render);
        document.body.appendChild(wrap);
        document.documentElement.classList.add('rkx-lock');
        document.addEventListener('keydown', key, true);
        adm = { wrap: wrap, key: key, from: from };
        load();
        try { q.focus({ preventScroll: true }); } catch (e) { /* не страшно */ }
    }

    window.RKProfile = { info: info, edit: edit, admin: admin, levelOf: levelOf };
})();
