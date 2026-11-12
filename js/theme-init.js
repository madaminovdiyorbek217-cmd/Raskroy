/* Защита от встраивания сайта в чужую страницу (подмена вида для кликджекинга).
   Основная защита работает через заголовки; это запасная для хостингов, где их настроить нельзя. */
if (window.top !== window.self) {
    try { window.top.location = window.self.location; } catch (e) { /* чужой фрейм не пускает */ }
    document.documentElement.style.display = 'none';
}

/* Тема оформления: подключается в <head> до отрисовки страницы, чтобы не было вспышки не того цвета.
   Темы: light (светлая), navy (тёмно-синяя), black (чёрная). Старое значение dark считается чёрной. */
(function () {
    /* Белый как основной вид: один раз переключаем на светлую тему с белым фоном (дальше выбор пользователя не трогаем) */
    try {
        if (!localStorage.getItem('rk-white-v1')) {
            localStorage.setItem('rk-white-v1', '1');
            localStorage.setItem('theme', 'light');
            var lk0 = {}; try { lk0 = JSON.parse(localStorage.getItem('rk-look') || '{}') || {}; } catch (e0) { lk0 = {}; }
            lk0.bg = 'white';
            localStorage.setItem('rk-look', JSON.stringify(lk0));
        }
    } catch (e) { /* хранилище недоступно */ }
    var t = null;
    try { t = localStorage.getItem('theme'); } catch (e) { /* хранилище недоступно */ }
    if (t === 'dark') t = 'black';
    if (t !== 'light' && t !== 'navy' && t !== 'black') {
        t = (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) ? 'light' : 'navy';
    }
    document.documentElement.setAttribute('data-theme', t);

    /* Цвет акцента: выбранный пользователем, иначе свой для темы (в чёрной голубой, в остальных синий) */
    var a = null;
    try { a = localStorage.getItem('accent'); } catch (e) { /* хранилище недоступно */ }
    if (['blue', 'emerald', 'violet', 'coral', 'cyan'].indexOf(a) < 0) a = (t === 'black') ? 'cyan' : 'blue';
    document.documentElement.setAttribute('data-accent', a);
})();

/* Что считаем: плиты или ткань. Запоминается; ярлык приложения и адрес ?tool=fabric открывают ткань сразу. */
(function () {
    var tool = 'plates';
    try { var q = new URLSearchParams(location.search); var x = q.get('tool') || (q.get('action') === 'fabric' ? 'fabric' : null) || localStorage.getItem('rk-tool'); if (x === 'fabric' || x === 'plates') tool = x; } catch (e) { /* хранилище недоступно */ }
    document.documentElement.setAttribute('data-tool', tool);
})();

/* Оформление: фон и цвет акцента поверх выбранной темы.
   Работает в <head> до отрисовки (без вспышки) и отдаёт window.RKLook панели «Оформление» (js/look.js).
   В localStorage 'rk-look' хранится {bg: id фона или #rrggbb, accent: #rrggbb}; пусто значит «как в теме». */
(function () {
    var KEY = 'rk-look';
    var root = document.documentElement;
    var PROPS = ['--bg', '--bg-img', '--panel', '--panel2', '--field', '--line', '--line2', '--rk-sheet', '--rk-hatch', '--accent', '--accent-hover', '--accent-ink', '--on-accent', '--glow'];

    /* ---------- цвет ---------- */
    function isHex(s) { return typeof s === 'string' && /^#[0-9a-f]{6}$/i.test(s); }
    function h2r(h) { var n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
    function r2h(r) { return '#' + r.map(function (v) { v = Math.max(0, Math.min(255, Math.round(v))); return (v < 16 ? '0' : '') + v.toString(16); }).join(''); }
    function lum(r) {
        var c = r.map(function (v) { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
        return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
    }
    function contrast(a, b) { var x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); }
    function mix(a, b, t) { var p = h2r(a), q = h2r(b); return r2h([p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t, p[2] + (q[2] - p[2]) * t]); }
    function toHsl(hex) {
        var r = h2r(hex).map(function (v) { return v / 255; }), mx = Math.max(r[0], r[1], r[2]), mn = Math.min(r[0], r[1], r[2]), l = (mx + mn) / 2, h = 0, s = 0, d = mx - mn;
        if (d) {
            s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
            h = mx === r[0] ? (r[1] - r[2]) / d + (r[1] < r[2] ? 6 : 0) : (mx === r[1] ? (r[2] - r[0]) / d + 2 : (r[0] - r[1]) / d + 4);
            h *= 60;
        }
        return [h, s, l];
    }
    function fromHsl(h, s, l) {
        function f(n) { var k = (n + h / 30) % 12, a = s * Math.min(l, 1 - l); return l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)); }
        return r2h([f(0) * 255, f(8) * 255, f(4) * 255]);
    }
    /* сдвиг светлоты в процентных пунктах */
    function shift(hex, dl) { var c = toHsl(hex); return fromHsl(c[0], c[1], Math.max(0, Math.min(1, c[2] + dl / 100))); }

    /* ---------- наборы ---------- */
    function N(ru, en, uz) { return { ru: ru, en: en, uz: uz }; }
    /* tone: l — светлый фон, d — тёмный; c — основной цвет, img — градиент поверх него */
    var BG = [
        { id: 'white', tone: 'l', c: '#ffffff', n: N('Белый', 'White', 'Oq') },
        { id: 'cream', tone: 'l', c: '#f6efe2', n: N('Крем', 'Cream', 'Qaymoq') },
        { id: 'sand', tone: 'l', c: '#ecdfca', n: N('Песок', 'Sand', 'Qum') },
        { id: 'mint', tone: 'l', c: '#e3f3ea', n: N('Мята', 'Mint', 'Yalpiz') },
        { id: 'sky', tone: 'l', c: '#e1edfb', n: N('Небо', 'Sky', 'Osmon') },
        { id: 'lilac', tone: 'l', c: '#ece6fa', n: N('Сирень', 'Lilac', 'Binafsha') },
        { id: 'rose', tone: 'l', c: '#fbe7ec', n: N('Роза', 'Rose', 'Atirgul') },
        { id: 'peach', tone: 'l', c: '#fde7d8', n: N('Персик', 'Peach', 'Shaftoli') },
        { id: 'stone', tone: 'l', c: '#e4e4e7', n: N('Камень', 'Stone', 'Tosh') },
        { id: 'dawn', tone: 'l', c: '#f9e3ea', img: 'linear-gradient(135deg,#ffe8d6 0%,#fbd9e8 50%,#dcdcfb 100%)', n: N('Рассвет', 'Dawn', 'Tong') },
        { id: 'lagoon', tone: 'l', c: '#dff2f2', img: 'linear-gradient(135deg,#d9f4ee 0%,#dbe9ff 100%)', n: N('Лагуна', 'Lagoon', 'Laguna') },
        { id: 'cloud', tone: 'l', c: '#e8edf8', img: 'linear-gradient(180deg,#f6f8ff 0%,#dbe3f4 100%)', n: N('Облако', 'Cloud', 'Bulut') },
        { id: 'snow', tone: 'l', c: '#fafafa', n: N('Снег', 'Snow', 'Qor') },
        { id: 'pearl', tone: 'l', c: '#f1f3f7', n: N('Жемчуг', 'Pearl', 'Injui') },
        { id: 'silver', tone: 'l', c: '#d9dde3', n: N('Серебро', 'Silver', 'Kumush') },
        { id: 'ivory', tone: 'l', c: '#fffbea', n: N('Слоновая кость', 'Ivory', 'Fil suyagi') },
        { id: 'lemon', tone: 'l', c: '#fdf3b8', n: N('Лимон', 'Lemon', 'Limon') },
        { id: 'apricot', tone: 'l', c: '#fcd9b0', n: N('Абрикос', 'Apricot', 'O‘rik') },
        { id: 'sage', tone: 'l', c: '#dde8d5', n: N('Шалфей', 'Sage', 'Marmarak') },
        { id: 'aqua', tone: 'l', c: '#cdeef0', n: N('Аква', 'Aqua', 'Akva') },
        { id: 'ice', tone: 'l', c: '#d6e6fb', n: N('Лёд', 'Ice', 'Muz') },
        { id: 'periwinkle', tone: 'l', c: '#d9dcf8', n: N('Барвинок', 'Periwinkle', 'Zangori') },
        { id: 'orchid', tone: 'l', c: '#f1d9f4', n: N('Орхидея', 'Orchid', 'Orxideya') },
        { id: 'blush', tone: 'l', c: '#f8d3d0', n: N('Румянец', 'Blush', 'Qizg‘ish') },
        { id: 'graphite', tone: 'd', c: '#16181d', n: N('Графит', 'Graphite', 'Grafit') },
        { id: 'steel', tone: 'd', c: '#1a2231', n: N('Сталь', 'Steel', 'Po‘lat') },
        { id: 'ocean', tone: 'd', c: '#06222c', n: N('Океан', 'Ocean', 'Okean') },
        { id: 'forest', tone: 'd', c: '#0b1f18', n: N('Лес', 'Forest', 'O‘rmon') },
        { id: 'olive', tone: 'd', c: '#1a1f12', n: N('Олива', 'Olive', 'Zaytun') },
        { id: 'plum', tone: 'd', c: '#1a1230', n: N('Слива', 'Plum', 'Olxo‘ri') },
        { id: 'wine', tone: 'd', c: '#26101a', n: N('Бордо', 'Burgundy', 'Bordo') },
        { id: 'coffee', tone: 'd', c: '#1f1612', n: N('Кофе', 'Coffee', 'Qahva') },
        { id: 'aurora', tone: 'd', c: '#0a1c33', img: 'linear-gradient(160deg,#07162b 0%,#0e2f4f 50%,#0f3d3a 100%)', n: N('Аврора', 'Aurora', 'Aurora') },
        { id: 'sunset', tone: 'd', c: '#22123a', img: 'linear-gradient(160deg,#1a1033 0%,#3a1c4d 55%,#5c2b3e 100%)', n: N('Закат', 'Sunset', 'Shafaq') },
        { id: 'space', tone: 'd', c: '#070a1a', img: 'radial-gradient(900px 600px at 85% -10%,#1e2a66 0%,transparent 60%),radial-gradient(700px 500px at 0% 105%,#3a1466 0%,transparent 55%)', n: N('Космос', 'Space', 'Kosmos') },
        { id: 'black', tone: 'd', c: '#000000', n: N('Чёрный', 'Black', 'Qora') },
        { id: 'charcoal', tone: 'd', c: '#202226', n: N('Уголь', 'Charcoal', 'Ko‘mir') },
        { id: 'midnight', tone: 'd', c: '#0b1020', n: N('Полночь', 'Midnight', 'Yarim tun') },
        { id: 'navy2', tone: 'd', c: '#0a1930', n: N('Морской', 'Navy', 'Dengiz') },
        { id: 'indigo', tone: 'd', c: '#14143a', n: N('Индиго', 'Indigo', 'Indigo') },
        { id: 'teal', tone: 'd', c: '#082a2a', n: N('Тёмная бирюза', 'Deep teal', 'Qora firuza') },
        { id: 'moss', tone: 'd', c: '#16240f', n: N('Мох', 'Moss', 'Moxor') },
        { id: 'eggplant', tone: 'd', c: '#241033', n: N('Баклажан', 'Eggplant', 'Baqlajon') },
        { id: 'maroon', tone: 'd', c: '#2a0d12', n: N('Мареновый', 'Maroon', 'To‘q qizil') },
        { id: 'chocolate', tone: 'd', c: '#2a1a12', n: N('Шоколад', 'Chocolate', 'Shokolad') },
        { id: 'ember', tone: 'd', c: '#1f0f10', img: 'linear-gradient(160deg,#1c0d12 0%,#3a1713 60%,#4d2412 100%)', n: N('Угли', 'Embers', 'Cho‘g‘') }
    ];
    var ACC = [
        { id: 'blue', c: '#3b82f6', n: N('Синий', 'Blue', 'Ko‘k') },
        { id: 'sky', c: '#0ea5e9', n: N('Небесный', 'Sky', 'Osmon rang') },
        { id: 'cyan', c: '#06b6d4', n: N('Голубой', 'Cyan', 'Havorang') },
        { id: 'teal', c: '#14b8a6', n: N('Бирюзовый', 'Teal', 'Firuza') },
        { id: 'emerald', c: '#10b981', n: N('Изумрудный', 'Emerald', 'Zumrad') },
        { id: 'green', c: '#22c55e', n: N('Зелёный', 'Green', 'Yashil') },
        { id: 'indigo', c: '#6366f1', n: N('Индиго', 'Indigo', 'Indigo') },
        { id: 'violet', c: '#8b5cf6', n: N('Фиолетовый', 'Violet', 'Binafsha') },
        { id: 'purple', c: '#a855f7', n: N('Пурпурный', 'Purple', 'To‘q binafsha') },
        { id: 'fuchsia', c: '#d946ef', n: N('Фуксия', 'Fuchsia', 'Fuksiya') },
        { id: 'pink', c: '#ec4899', n: N('Розовый', 'Pink', 'Pushti') },
        { id: 'rose', c: '#f43f5e', n: N('Коралловый', 'Coral', 'Marjon') },
        { id: 'red', c: '#ef4444', n: N('Красный', 'Red', 'Qizil') },
        { id: 'orange', c: '#f97316', n: N('Оранжевый', 'Orange', 'Zarg‘aldoq') },
        { id: 'slate', c: '#64748b', n: N('Графитовый', 'Slate', 'Kulrang') },
        { id: 'navyb', c: '#1d4ed8', n: N('Тёмно-синий', 'Navy blue', 'To‘q ko‘k') },
        { id: 'mint', c: '#2dd4bf', n: N('Мятный', 'Mint', 'Yalpiz rang') },
        { id: 'lime', c: '#84cc16', n: N('Салатовый', 'Lime', 'Och yashil') },
        { id: 'yellow', c: '#eab308', n: N('Жёлтый', 'Yellow', 'Sariq') },
        { id: 'gold', c: '#ca8a04', n: N('Золотой', 'Gold', 'Oltin') },
        { id: 'amber', c: '#f59e0b', n: N('Янтарный', 'Amber', 'Qahrabo') },
        { id: 'rust', c: '#c2410c', n: N('Ржавый', 'Rust', 'Zang') },
        { id: 'brown', c: '#92400e', n: N('Коричневый', 'Brown', 'Jigarrang') },
        { id: 'crimson', c: '#be123c', n: N('Малиновый', 'Crimson', 'Malina') },
        { id: 'magenta', c: '#c026d3', n: N('Маджента', 'Magenta', 'Majenta') },
        { id: 'steel', c: '#475569', n: N('Сталь', 'Steel', 'Po‘lat') },
        { id: 'ink', c: '#0f172a', n: N('Чернильный', 'Ink', 'Siyoh') }
    ];
    function byId(list, id) { for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i]; return null; }

    /* ---------- хранилище ---------- */
    function get() {
        try {
            var v = JSON.parse(localStorage.getItem(KEY) || 'null');
            if (!v || typeof v !== 'object') return {};
            var o = {};
            if (v.bg && (byId(BG, v.bg) || isHex(v.bg))) o.bg = v.bg;
            if (isHex(v.accent)) o.accent = v.accent;
            return o;
        } catch (e) { return {}; }
    }
    function save(l) { try { if (l.bg || l.accent) localStorage.setItem(KEY, JSON.stringify(l)); else localStorage.removeItem(KEY); } catch (e) { /* хранилище недоступно */ } }

    /* ---------- применение ---------- */
    var TEXT_DARK_TONE = [232, 238, 251], TEXT_LIGHT_TONE = [15, 27, 45];
    function toneOf(c) { return lum(h2r(c)) > 0.18 ? 'l' : 'd'; }
    /* пока текст не читается (контраст ниже 4,6), подтягиваем цвет к чёрному или белому */
    function guard(c, tone) {
        var text = tone === 'd' ? TEXT_DARK_TONE : TEXT_LIGHT_TONE, i = 0;
        while (contrast(h2r(c), text) < 4.6 && i < 30) { c = mix(c, tone === 'd' ? '#000000' : '#ffffff', 0.06); i++; }
        return c;
    }
    function themeFor(tone, c) { return tone === 'l' ? 'light' : (lum(h2r(c)) < 0.012 ? 'black' : 'navy'); }

    function resolveBg(bg) {
        var p = byId(BG, bg), c, tone, img = null;
        if (p) { c = p.c; tone = p.tone; img = p.img || null; }
        else if (isHex(bg)) { tone = toneOf(bg); c = guard(bg, tone); }
        else return null;
        return { c: c, tone: tone, img: img, theme: themeFor(tone, c) };
    }

    /* Тёмный режим телефона: браузер сам «затемняет» светлые страницы, портит светлые фоны и сильно тормозит.
       Страница объявляет, что сама умеет обе схемы (все цвета заданы явно), и браузер её не трогает. */
    /* Слабые телефоны: без размытия и лишних теней (класс rk-lite) */
    try {
        var weak = (navigator.deviceMemory && navigator.deviceMemory <= 4) ||
            (window.matchMedia && matchMedia('(pointer: coarse)').matches && (navigator.hardwareConcurrency || 8) <= 6);
        if (weak) root.classList.add('rk-lite');
    } catch (e) { /* не страшно */ }
    function setScheme() {
        try {
            var light = root.getAttribute('data-theme') === 'light';
            var m = document.querySelector('meta[name="color-scheme"]');
            if (!m) { m = document.createElement('meta'); m.name = 'color-scheme'; document.head.appendChild(m); }
            m.setAttribute('content', light ? 'light dark' : 'dark');
            root.style.colorScheme = light ? 'light dark' : 'dark';
        } catch (e) { /* не страшно */ }
    }
    function setMeta(c) { var m = document.querySelector('meta[name="theme-color"]'); if (m) m.setAttribute('content', c); }

    /* Цвета, зависящие от выбранной темы (светлая или тёмная), считаются от неё */
    function apply(look) {
        var st = root.style;
        PROPS.forEach(function (p) { st.removeProperty(p); });
        look = look || get();
        var themeNow = root.getAttribute('data-theme');
        var tone = themeNow === 'light' ? 'l' : 'd';
        var base = null;
        var r = look.bg ? resolveBg(look.bg) : null;
        if (r) {
            if (r.tone !== tone) { root.setAttribute('data-theme', r.theme); tone = r.tone; }
            base = r.c;
            st.setProperty('--bg', base);
            if (r.img) { st.setProperty('--bg-img', r.img); st.setProperty('--glow', 'transparent'); }
            if (tone === 'd') {
                st.setProperty('--panel', shift(base, 5));
                st.setProperty('--panel2', shift(base, 9));
                st.setProperty('--field', shift(base, -1.5));
                st.setProperty('--line', shift(base, 13));
                st.setProperty('--line2', shift(base, 22));
                st.setProperty('--rk-sheet', shift(base, 2.5));
                st.setProperty('--rk-hatch', shift(base, 11));
            } else {
                st.setProperty('--panel', mix(base, '#ffffff', 0.85));
                st.setProperty('--panel2', mix(base, '#ffffff', 0.5));
                st.setProperty('--field', mix(base, '#ffffff', 0.9));
                st.setProperty('--line', shift(base, -8));
                st.setProperty('--line2', shift(base, -17));
                st.setProperty('--rk-sheet', mix(base, '#ffffff', 0.9));
                st.setProperty('--rk-hatch', shift(base, -9));
            }
        }
        if (look.accent && isHex(look.accent)) {
            var a = look.accent, panel = tone === 'd' ? (base ? shift(base, 5) : (themeNow === 'black' ? '#0b0b0d' : '#0f2040')) : '#ffffff';
            var ink = a, i = 0, pr = h2r(panel);
            while (contrast(h2r(ink), pr) < 4.5 && i < 14) { ink = mix(ink, tone === 'd' ? '#ffffff' : '#000000', 0.08); i++; }
            var on = contrast(h2r(a), [255, 255, 255]) >= contrast(h2r(a), [4, 18, 39]) ? '#ffffff' : '#041227';
            var rgb = h2r(a);
            st.setProperty('--accent', a);
            st.setProperty('--accent-hover', mix(a, tone === 'd' ? '#ffffff' : '#000000', 0.18));
            st.setProperty('--accent-ink', ink);
            st.setProperty('--on-accent', on);
            if (!(r && r.img)) st.setProperty('--glow', 'rgba(' + rgb.join(',') + ',' + (tone === 'd' ? '.12' : '.09') + ')');
        }
        if (base) setMeta(base);
        else setMeta({ light: '#edf0f6', navy: '#081327', black: '#000000' }[root.getAttribute('data-theme')] || '#081327');
        root.setAttribute('data-look', (look.bg || look.accent) ? '1' : '0');
        setScheme();
        return r;
    }

    window.RKLook = { scheme: setScheme, BG: BG, ACC: ACC, get: get, save: save, apply: apply, resolveBg: resolveBg, isHex: isHex, byId: byId };
    try { apply(get()); } catch (e) { /* без оформления сайт всё равно работает */ }
})();

/* Профили (js/auth.js): пока никто не вошёл, страницу закрывает экран входа. Класс ставится сразу, чтобы приложение не мелькнуло. */
(function () {
    try {
        var k = '__rk_t'; localStorage.setItem(k, '1'); localStorage.removeItem(k);
        var o = JSON.parse(localStorage.getItem('rk-users-v1') || 'null');
        var list = o && Array.isArray(o.list) ? o.list : [];
        var sid = null;
        try { sid = sessionStorage.getItem('rk-session'); } catch (e1) { /* не страшно */ }
        if (!sid) sid = localStorage.getItem('rk-session');
        if (!list.some(function (u) { return u && u.id === sid; })) document.documentElement.classList.add('rk-locked');
    } catch (e) { /* память закрыта: профили не работают, приложение открыто как раньше */ }
})();
