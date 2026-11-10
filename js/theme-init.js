/* Защита от встраивания сайта в чужую страницу (подмена вида для кликджекинга).
   Основная защита работает через заголовки; это запасная для хостингов, где их настроить нельзя. */
if (window.top !== window.self) {
    try { window.top.location = window.self.location; } catch (e) { /* чужой фрейм не пускает */ }
    document.documentElement.style.display = 'none';
}

/* Тема оформления: подключается в <head> до отрисовки страницы, чтобы не было вспышки не того цвета.
   Темы: light (светлая), navy (тёмно-синяя), black (чёрная). Старое значение dark считается чёрной. */
(function () {
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
