/* Тексты панели «Оформление» на трёх языках. Подключается после fabric-i18n.js и раньше i18n.js. */
(function () {
    var X = window.RKI18N_EXTRA = window.RKI18N_EXTRA || { ru: {}, en: {}, uz: {} };
    var T = {
        ru: {
            'lk.title': 'Оформление', 'lk.close': 'Закрыть', 'lk.theme': 'Тема', 'lk.bg': 'Фон', 'lk.acc': 'Цвет акцента',
            'lk.light': 'Светлые', 'lk.dark': 'Тёмные', 'lk.std': 'Как в теме', 'lk.custom': 'Свой цвет',
            'lk.reset': 'Сбросить оформление', 'lk.reset.done': 'Оформление сброшено', 'lk.fixed': 'Цвет немного изменён, чтобы текст читался'
        },
        en: {
            'lk.title': 'Appearance', 'lk.close': 'Close', 'lk.theme': 'Theme', 'lk.bg': 'Background', 'lk.acc': 'Accent colour',
            'lk.light': 'Light', 'lk.dark': 'Dark', 'lk.std': 'Theme default', 'lk.custom': 'Custom colour',
            'lk.reset': 'Reset appearance', 'lk.reset.done': 'Appearance reset', 'lk.fixed': 'The colour was adjusted slightly so the text stays readable'
        },
        uz: {
            'lk.title': 'Ko‘rinish', 'lk.close': 'Yopish', 'lk.theme': 'Mavzu', 'lk.bg': 'Fon', 'lk.acc': 'Urg‘u rangi',
            'lk.light': 'Och', 'lk.dark': 'To‘q', 'lk.std': 'Mavzudagidek', 'lk.custom': 'O‘z rangingiz',
            'lk.reset': 'Ko‘rinishni tiklash', 'lk.reset.done': 'Ko‘rinish tiklandi', 'lk.fixed': 'Matn o‘qilishi uchun rang biroz o‘zgartirildi'
        }
    };
    ['ru', 'en', 'uz'].forEach(function (l) { X[l] = X[l] || {}; for (var k in T[l]) X[l][k] = T[l][k]; });
})();
(function () {
    var X = window.RKI18N_EXTRA;
    var T = {
        ru: { 'cp.hex': 'Код цвета', 'cp.palette': 'Палитра', 'cp.recent': 'Недавние', 'cp.done': 'Готово' },
        en: { 'cp.hex': 'Colour code', 'cp.palette': 'Palette', 'cp.recent': 'Recent', 'cp.done': 'Done' },
        uz: { 'cp.hex': 'Rang kodi', 'cp.palette': 'Palitra', 'cp.recent': 'Oxirgilar', 'cp.done': 'Tayyor' }
    };
    ['ru', 'en', 'uz'].forEach(function (l) { for (var k in T[l]) X[l][k] = T[l][k]; });
})();

