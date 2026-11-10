/* Языки интерфейса: русский, английский, узбекский (латиница).
   Тексты страницы помечены атрибутом data-i18n, тексты из скриптов берутся через RKI18N.t(). */
(function () {
    'use strict';

    var LANGS = ['ru', 'en', 'uz'];

    var D = {
        ru: {
            'meta.title': 'Онлайн-раскрой плитных материалов',
            'meta.desc': 'Бесплатный онлайн-раскрой ЛДСП, МДФ и фанеры: карты раскроя, расчёт листов, кромки и длины реза. Работает в браузере, данные остаются у вас.',
            'meta.ogdesc': 'Карты раскроя ЛДСП, МДФ и фанеры прямо в браузере: листы, кромка, длина реза.',
            'brand': 'Раскрой онлайн',
            'nav.new': 'Новая',
            'nav.works': 'Работы', 'step.works': 'Мои работы', 'b.zipall': 'Скачать всё одним файлом',
            'app.install': 'Установить приложение', 'app.installed': 'Приложение установлено', 'app.ios': 'На iPhone и iPad: нажмите «Поделиться» и выберите «На экран Домой».', 'app.ok': 'Понятно', 'app.offline': 'Нет сети: приложение работает без интернета', 'app.online': 'Сеть появилась', 'app.ready': 'Готово: приложение работает без интернета', 'app.update': 'Доступна новая версия приложения', 'app.reload': 'Обновить', 'app.later': 'Позже', 'app.drop': 'Отпустите файл: он откроется как новая работа',
            'b.backup': 'Копия работ', 'b.backup.t': 'Сохранить копию всех работ в файл', 'b.restore': 'Из копии', 'b.restore.t': 'Вернуть работы из файла копии', 'bk.done': 'Копия сохранена, работ: {n}', 'bk.restored': 'Добавлено работ из копии: {n}', 'bk.bad': 'Это не файл копии «Раскрой онлайн»',
            'w.open': 'Открыть', 'w.dl': 'Скачать', 'w.current': 'Открыта', 'w.empty': 'нет деталей', 'w.calc': 'считаю…',
            'w.zipbusy': 'Готовлю файл…', 'w.none': 'Пока нечего скачивать: добавьте детали', 'w.del': 'Удалить',
            'acc.aria': 'Цвет акцента', 'acc.blue': 'Синий', 'acc.emerald': 'Изумрудный', 'acc.violet': 'Фиолетовый', 'acc.coral': 'Коралловый', 'acc.cyan': 'Голубой',
            'b.import': 'Импорт из Базис', 'imp.done': 'Импортировано деталей: {n}, материалов: {m}. Создана новая работа.', 'imp.size': 'Размер листа не найден для: {list}. Поставлено 2800×2070 мм, проверьте.', 'imp.fail': 'Не нашёл в файле колонки «Длина» и «Ширина».', 'imp.xls': 'Старый формат .xls не читается: сохраните файл как .xlsx или .csv.', 'imp.err': 'Не удалось открыть файл.', 'imp.skip': 'Пропущено строк: {s}.',
            'w.new': 'Новая работа', 'w.default': 'Работа {n}', 'w.tabs.aria': 'Работы', 'w.rename': 'Название работы',
            'w.close': 'Закрыть работу «{name}»', 'w.delconfirm': 'Удалить работу «{name}» вместе со всеми деталями?', 'w.created': 'Создана: {name}',
            'skip': 'Перейти к содержимому',
            'nav.aria': 'Разделы',
            'nav.mat': 'Материалы', 'nav.parts': 'Детали', 'nav.res': 'Результат', 'nav.set': 'Настройки',
            'theme.aria': 'Тема оформления',
            'theme.light': 'Светлая', 'theme.navy': 'Тёмно-синяя', 'theme.black': 'Чёрная',
            'theme.light.aria': 'Светлая тема', 'theme.navy.aria': 'Тёмно-синяя тема', 'theme.black.aria': 'Чёрная тема',
            'lang.aria': 'Язык',
            'h1': 'Онлайн-раскрой плитных материалов',
            'step.mat': 'Материалы и настройки',
            'preset.aria': 'Готовый материал',
            'pre.ldsp-2800': 'ЛДСП 16 мм · 2800 × 2070',
            'pre.ldsp-2750': 'ЛДСП 16 мм · 2750 × 1830',
            'pre.hdf-2800': 'ХДФ 3 мм · 2800 × 2070',
            'pre.hdf-2440': 'ХДФ 3 мм · 2440 × 1220',
            'pre.mdf-2800': 'МДФ 16 мм · 2800 × 1220',
            'pre.ply-1525': 'Фанера 18 мм · 1525 × 1525',
            'pre.custom': 'Свой размер',
            'mat.ldsp16': 'ЛДСП 16 мм', 'mat.hdf3': 'ХДФ 3 мм', 'mat.mdf16': 'МДФ 16 мм', 'mat.ply18': 'Фанера 18 мм', 'mat.new': 'Новый материал',
            'add.mat': '+ Добавить материал',
            's.kerf': 'Пропил, мм', 's.trim': 'Обрезка края листа, мм', 's.off': 'Мин. размер остатка первой стороны, мм', 's.off2': 'Мин. размер остатка второй стороны, мм', 's.mintrim': 'Минимальная обрезка, мм', 's.adv': 'Параметры раскроя', 's.dir': 'Начальное направление резов', 's.dir.auto': 'Автоматически (подбор лучшего)', 's.dir.len': 'Вдоль длины листа', 's.dir.wid': 'Вдоль ширины листа', 's.grain.title': 'Если лист с текстурой — включить', 's.grain.on': 'Действует для материалов с отметкой «Лист с текстурой».', 's.grain.off': 'Ни у одного материала нет отметки «Лист с текстурой», поэтому эти настройки отключены.', 'm.grain': 'Лист с текстурой',
            's.tex': 'Учёт текстуры', 's.cplx': 'Использовать сложные полосы', 's.minstrip': 'Минимальная ширина полосы, мм', 's.maxstrip': 'Максимальная ширина полосы, мм', 's.maxlen': 'Максимальная длина полосы, мм', 'h.dir': 'Направление первого реза листа. «Вдоль длины» режет лист на полосы вдоль длинной стороны. При автоматическом выборе программа сама подбирает лучший вариант.', 'h.tex': 'Включено: детали с выключенным поворотом нельзя разворачивать (текстура идёт вдоль длины листа). Выключено: любую деталь можно повернуть.', 'h.cplx': 'Выключено: полосы простые, в одной полосе только детали одной ширины (меньше доводочных резов, но больше отходов). Включено: в полосе могут быть детали разной ширины.', 'h.minstrip': 'Полоса первого реза не будет уже этого значения: узкую деталь поставят в более широкую полосу. 0 — без ограничения.', 'h.maxstrip': 'Полоса первого реза не будет шире этого значения (ограничение пилы). 0 — без ограничения.', 'h.maxlen': 'Рез не будет длиннее этого значения, так учитывают ход каретки пилы. 0 — без ограничения.', 'h.mintrim': 'Остаток меньше этого размера не отпиливают, он остаётся припуском у детали. 0 — отпиливать любой остаток.', 'h.off': 'Остаток считается деловым, если его длинная сторона не меньше этого значения.', 'h.off2': 'и короткая сторона не меньше этого значения.', 'm.adv': 'Параметры материала и стоимость', 'm.t': 'Толщина, мм', 'm.c.qtymat': 'Количество материала, листов', 'm.c.sheets': 'Количество листов, шт', 'm.c.matcost': 'Стоимость материала, {cur}', 'm.c.opcost': 'Стоимость операции, {cur}', 'm.c.hint': 'Считается по результату раскроя',
            'm.fill': 'Расчётный процент заполнения, %', 'm.bysheets': 'Расчёт стоимости по листам', 'm.round': 'Округление листов', 'm.round.whole': 'К целому', 'm.round.half': 'До 0,5 листа', 'm.round.none': 'Не округлять', 'm.opbasis': 'Расчёт стоимости операции по', 'm.opb.cut': 'Длине реза', 'm.opb.perim': 'Периметру деталей', 'm.opb.part': 'Площади деталей', 'm.opb.mat': 'Площади материала', 'm.opprice.m': 'Цена операции, {cur} за м', 'm.opprice.m2': 'Цена операции, {cur} за м²', 'h.fill': 'Нужен, когда стоимость считается по площади: количество материала = площадь деталей / (площадь листа × процент).', 'h.bysheets': 'Включено: платите за целые листы, занятые раскроем. Выключено: количество считается по площади деталей и проценту заполнения.', 'c.mat': 'Материал', 'c.op': 'Распил', 'c.edge': 'Кромка', 'c.total': 'Итого', 'u.sh': 'л.', 'w.relaxed': 'Для материала «{mat}» ограничения полос смягчены: иначе часть деталей не помещалась.', 's.cur': 'Валюта',
            'cur': 'сум',
            'step.parts': 'Детали',
            'b.addpart': '+ Добавить деталь', 'b.paste': 'Вставить список', 'b.example': 'Пример: шкаф', 'b.csvparts': 'Скачать CSV деталей', 'b.clear': 'Очистить',
            'paste.list': 'Список деталей', 'paste.mat': 'Материал для импорта', 'paste.go': 'Добавить в список',
            'h.name': 'Название', 'h.mat': 'Материал', 'h.l': 'Длина', 'h.w': 'Ширина', 'h.q': 'Шт.', 'h.edge': 'Кромка',
            'step.res': 'Результат раскроя',
            'b.csvcut': 'CSV раскроя', 'b.print': 'Печать / PDF',
            'b.run': 'Пересчитать', 'b.gores': 'Результат',
            'footer.contact': 'Связаться с автором',
            'e404.title': 'Страница не найдена', 'e404.btn': 'Открыть раскрой',

            'm.name': 'Название', 'm.l': 'Длина листа, мм', 'm.w': 'Ширина листа, мм', 'm.price': 'Цена листа, {cur}', 'm.edgeprice': 'Кромка за метр, {cur}',
            'm.del': 'Удалить', 'm.del.aria': 'Удалить материал', 'm.noname': 'Без названия', 'm.fallback': 'Материал',
            'm.delconfirm': 'Материал «{name}» используется в {n} деталях. Удалить вместе с деталями?',
            'p.name.aria': 'Название детали {n}', 'p.mat.aria': 'Материал детали {n}', 'p.l.aria': 'Длина детали {n}', 'p.w.aria': 'Ширина детали {n}', 'p.q.aria': 'Количество деталей {n}', 'p.edge.aria': 'Кромка детали {n}',
            'p.l': 'Длина, мм', 'p.w': 'Ширина, мм', 'p.q': 'Штук', 'p.mat': 'Материал', 'p.name': 'Название',
            'e.0': 'Кромка по длине, верхняя сторона', 'e.1': 'Кромка по длине, нижняя сторона', 'e.2': 'Кромка по ширине, левая сторона', 'e.3': 'Кромка по ширине, правая сторона',
            'p.rot.aria': 'Разрешить поворот детали на 90 градусов', 'p.dup.aria': 'Дублировать деталь {n}', 'p.del.aria': 'Удалить деталь {n}',
            'c.example': 'Заменить текущий список деталей примером?', 'c.clear': 'Удалить все детали из списка?',
            'paste.added': 'Добавлено: {a}', 'paste.skipped': ', пропущено: {s}', 'paste.none': 'Строки не распознаны',
            'ex.side': 'Боковина', 'ex.topbot': 'Крышка и дно', 'ex.divider': 'Перегородка', 'ex.shelf': 'Полка', 'ex.door': 'Фасад', 'ex.plinth': 'Цоколь', 'ex.back': 'Задняя стенка',
            'bar.parts': 'Деталей: <b>{n}</b>', 'bar.area': 'площадь <b>{a} м²</b>',
            'u.mm': 'мм', 'u.m': 'м', 'u.m2': 'м²',
            'sheet.pl': 'лист|листа|листов',
            'r.meta.parts': 'деталей', 'r.meta.used': 'использовано', 'r.meta.cut': 'рез', 'r.meta.edge': 'кромка',
            'r.sheet': 'Лист', 'r.of': '{i} из {n}', 'r.parts': 'Деталей', 'r.used': 'Использовано', 'r.cut': 'Рез', 'r.svg': 'Скачать SVG',
            'svg.aria': 'Карта раскроя, лист {i}', 'svg.offcut': 'остаток', 'svg.rot': 'повёрнута',
            't.sheets': 'лист всего|листа всего|листов всего', 't.placed': 'деталей размещено', 't.used': 'площади листов использовано', 't.waste': 'в отходах', 't.cut': 'длина реза', 't.edge': 'кромка', 't.cost': 'ориентировочная стоимость',
            'w.unfit': 'Не помещаются в лист, проверьте размеры: ',
            'w.unfit.item': '№{id}{name} — {l}×{w} мм, лист «{mat}» {L}×{W} с обрезкой {t} мм',
            'w.bad': 'Не учтены детали без размера или количества: №{list}.',
            'status': '{n} {pl} · использовано {u}%',
            'lg.part': 'Деталь', 'lg.size': 'Размер, мм', 'lg.q': 'Шт.', 'lg.edge': 'Кромка',
            'lg.2l': '2 по длине', 'lg.1l': '1 по длине', 'lg.2w': '2 по ширине', 'lg.1w': '1 по ширине', 'lg.none': 'без кромки',
            'yes': 'да', 'no': 'нет',
            'csv.parts': '№;Название;Материал;Длина;Ширина;Количество;Поворот;Кромка длина 1;Кромка длина 2;Кромка ширина 1;Кромка ширина 2',
            'csv.cut': 'Материал;Лист;№ детали;Название;X, мм;Y, мм;Размер по X;Размер по Y;Повёрнута'
        },

        en: {
            'meta.title': 'Online sheet material cutting planner',
            'meta.desc': 'Free online cutting planner for chipboard, MDF and plywood: cutting maps, sheet count, edge banding and cut length. Runs in your browser, your data stays with you.',
            'meta.ogdesc': 'Cutting maps for chipboard, MDF and plywood right in your browser: sheets, edge banding, cut length.',
            'brand': 'Cutting Online',
            'nav.new': 'New',
            'nav.works': 'Projects', 'step.works': 'My projects', 'b.zipall': 'Download everything as one file',
            'app.install': 'Install app', 'app.installed': 'App installed', 'app.ios': 'On iPhone and iPad: tap “Share”, then “Add to Home Screen”.', 'app.ok': 'Got it', 'app.offline': 'No connection: the app works offline', 'app.online': 'Back online', 'app.ready': 'Ready: the app works offline', 'app.update': 'A new version of the app is available', 'app.reload': 'Update', 'app.later': 'Later', 'app.drop': 'Drop the file: it will open as a new project',
            'b.backup': 'Backup', 'b.backup.t': 'Save a backup of all projects to a file', 'b.restore': 'Restore', 'b.restore.t': 'Bring projects back from a backup file', 'bk.done': 'Backup saved, projects: {n}', 'bk.restored': 'Projects added from the backup: {n}', 'bk.bad': 'This is not a Cutting Online backup file',
            'w.open': 'Open', 'w.dl': 'Download', 'w.current': 'Open now', 'w.empty': 'no parts', 'w.calc': 'calculating…',
            'w.zipbusy': 'Preparing the file…', 'w.none': 'Nothing to download yet: add some parts', 'w.del': 'Delete',
            'acc.aria': 'Accent colour', 'acc.blue': 'Blue', 'acc.emerald': 'Emerald', 'acc.violet': 'Violet', 'acc.coral': 'Coral', 'acc.cyan': 'Cyan',
            'b.import': 'Import from Basis', 'imp.done': 'Imported parts: {n}, materials: {m}. A new project was created.', 'imp.size': 'Sheet size not found for: {list}. Set to 2800×2070 mm, please check.', 'imp.fail': 'Could not find “Length” and “Width” columns in the file.', 'imp.xls': 'The old .xls format cannot be read: save the file as .xlsx or .csv.', 'imp.err': 'Could not open the file.', 'imp.skip': 'Skipped rows: {s}.',
            'w.new': 'New project', 'w.default': 'Project {n}', 'w.tabs.aria': 'Projects', 'w.rename': 'Project name',
            'w.close': 'Close project “{name}”', 'w.delconfirm': 'Delete project “{name}” with all its parts?', 'w.created': 'Created: {name}',
            'skip': 'Skip to content',
            'nav.aria': 'Sections',
            'nav.mat': 'Materials', 'nav.parts': 'Parts', 'nav.res': 'Result', 'nav.set': 'Settings',
            'theme.aria': 'Colour theme',
            'theme.light': 'Light', 'theme.navy': 'Dark blue', 'theme.black': 'Black',
            'theme.light.aria': 'Light theme', 'theme.navy.aria': 'Dark blue theme', 'theme.black.aria': 'Black theme',
            'lang.aria': 'Language',
            'h1': 'Online sheet material cutting planner',
            'step.mat': 'Materials and settings',
            'preset.aria': 'Material preset',
            'pre.ldsp-2800': 'Chipboard 16 mm · 2800 × 2070',
            'pre.ldsp-2750': 'Chipboard 16 mm · 2750 × 1830',
            'pre.hdf-2800': 'HDF 3 mm · 2800 × 2070',
            'pre.hdf-2440': 'HDF 3 mm · 2440 × 1220',
            'pre.mdf-2800': 'MDF 16 mm · 2800 × 1220',
            'pre.ply-1525': 'Plywood 18 mm · 1525 × 1525',
            'pre.custom': 'Custom size',
            'mat.ldsp16': 'Chipboard 16 mm', 'mat.hdf3': 'HDF 3 mm', 'mat.mdf16': 'MDF 16 mm', 'mat.ply18': 'Plywood 18 mm', 'mat.new': 'New material',
            'add.mat': '+ Add material',
            's.kerf': 'Kerf, mm', 's.trim': 'Sheet edge trim, mm', 's.off': 'Min offcut size, first side, mm', 's.off2': 'Min offcut size, second side, mm', 's.mintrim': 'Minimum trim, mm', 's.adv': 'Cutting parameters', 's.dir': 'Initial cut direction', 's.dir.auto': 'Automatic (best fit)', 's.dir.len': 'Along sheet length', 's.dir.wid': 'Along sheet width', 's.grain.title': 'If the sheet has a grain — enable', 's.grain.on': 'Applies to materials marked “Sheet with grain”.', 's.grain.off': 'No material is marked “Sheet with grain”, so these options are disabled.', 'm.grain': 'Sheet with grain',
            's.tex': 'Respect grain', 's.cplx': 'Use complex strips', 's.minstrip': 'Minimum strip width, mm', 's.maxstrip': 'Maximum strip width, mm', 's.maxlen': 'Maximum strip length, mm', 'h.dir': 'Direction of the first cut of a sheet. “Along length” rips the sheet into strips parallel to its long side. With automatic choice the program picks the best option.', 'h.tex': 'On: parts with rotation turned off cannot be turned (grain runs along the sheet length). Off: any part may be rotated.', 'h.cplx': 'Off: simple strips, each strip holds parts of one width only (fewer trimming cuts, more waste). On: a strip may hold parts of different widths.', 'h.minstrip': 'The first-cut strip will not be narrower than this: a narrow part goes into a wider strip. 0 means no limit.', 'h.maxstrip': 'The first-cut strip will not be wider than this (saw limit). 0 means no limit.', 'h.maxlen': 'A cut will not be longer than this, which accounts for the saw carriage travel. 0 means no limit.', 'h.mintrim': 'A remainder smaller than this is not cut off; it stays as an allowance on the part. 0 means cut off any remainder.', 'h.off': 'A remainder counts as usable if its long side is at least this value.', 'h.off2': 'and its short side is at least this value.', 'm.adv': 'Material parameters and cost', 'm.t': 'Thickness, mm', 'm.c.qtymat': 'Material quantity, sheets', 'm.c.sheets': 'Number of sheets, pcs', 'm.c.matcost': 'Material cost, {cur}', 'm.c.opcost': 'Operation cost, {cur}', 'm.c.hint': 'Calculated from the cutting result',
            'm.fill': 'Estimated fill percentage, %', 'm.bysheets': 'Calculate cost by sheets', 'm.round': 'Sheet rounding', 'm.round.whole': 'To whole', 'm.round.half': 'To 0.5 sheet', 'm.round.none': 'No rounding', 'm.opbasis': 'Calculate operation cost by', 'm.opb.cut': 'Cut length', 'm.opb.perim': 'Part perimeter', 'm.opb.part': 'Part area', 'm.opb.mat': 'Material area', 'm.opprice.m': 'Operation price, {cur} per m', 'm.opprice.m2': 'Operation price, {cur} per m²', 'h.fill': 'Used when cost is calculated by area: material quantity = parts area / (sheet area × percentage).', 'h.bysheets': 'On: you pay for whole sheets used by the layout. Off: quantity is calculated from parts area and fill percentage.', 'c.mat': 'Material', 'c.op': 'Cutting', 'c.edge': 'Edge banding', 'c.total': 'Total', 'u.sh': 'sh.', 'w.relaxed': 'For “{mat}” the strip limits were relaxed: otherwise some parts would not fit.', 's.cur': 'Currency',
            'cur': 'UZS',
            'step.parts': 'Parts',
            'b.addpart': '+ Add part', 'b.paste': 'Paste list', 'b.example': 'Example: wardrobe', 'b.csvparts': 'Download parts CSV', 'b.clear': 'Clear',
            'paste.list': 'Parts list', 'paste.mat': 'Material for import', 'paste.go': 'Add to list',
            'h.name': 'Name', 'h.mat': 'Material', 'h.l': 'Length', 'h.w': 'Width', 'h.q': 'Qty', 'h.edge': 'Edge',
            'step.res': 'Cutting result',
            'b.csvcut': 'Cutting CSV', 'b.print': 'Print / PDF',
            'b.run': 'Recalculate', 'b.gores': 'Result',
            'footer.contact': 'Contact the author',
            'e404.title': 'Page not found', 'e404.btn': 'Open the planner',

            'm.name': 'Name', 'm.l': 'Sheet length, mm', 'm.w': 'Sheet width, mm', 'm.price': 'Sheet price, {cur}', 'm.edgeprice': 'Edge banding per metre, {cur}',
            'm.del': 'Delete', 'm.del.aria': 'Delete material', 'm.noname': 'Untitled', 'm.fallback': 'Material',
            'm.delconfirm': 'Material “{name}” is used by {n} parts. Delete it together with the parts?',
            'p.name.aria': 'Part {n} name', 'p.mat.aria': 'Part {n} material', 'p.l.aria': 'Part {n} length', 'p.w.aria': 'Part {n} width', 'p.q.aria': 'Part {n} quantity', 'p.edge.aria': 'Part {n} edge banding',
            'p.l': 'Length, mm', 'p.w': 'Width, mm', 'p.q': 'Qty', 'p.mat': 'Material', 'p.name': 'Name',
            'e.0': 'Edge along the length, top side', 'e.1': 'Edge along the length, bottom side', 'e.2': 'Edge along the width, left side', 'e.3': 'Edge along the width, right side',
            'p.rot.aria': 'Allow rotating the part by 90 degrees', 'p.dup.aria': 'Duplicate part {n}', 'p.del.aria': 'Delete part {n}',
            'c.example': 'Replace the current parts list with the example?', 'c.clear': 'Delete all parts from the list?',
            'paste.added': 'Added: {a}', 'paste.skipped': ', skipped: {s}', 'paste.none': 'No lines recognised',
            'ex.side': 'Side panel', 'ex.topbot': 'Top and bottom', 'ex.divider': 'Divider', 'ex.shelf': 'Shelf', 'ex.door': 'Door front', 'ex.plinth': 'Plinth', 'ex.back': 'Back panel',
            'bar.parts': 'Parts: <b>{n}</b>', 'bar.area': 'area <b>{a} m²</b>',
            'u.mm': 'mm', 'u.m': 'm', 'u.m2': 'm²',
            'sheet.pl': 'sheet|sheets',
            'r.meta.parts': 'parts', 'r.meta.used': 'used', 'r.meta.cut': 'cuts', 'r.meta.edge': 'edge banding',
            'r.sheet': 'Sheet', 'r.of': '{i} of {n}', 'r.parts': 'Parts', 'r.used': 'Used', 'r.cut': 'Cuts', 'r.svg': 'Download SVG',
            'svg.aria': 'Cutting map, sheet {i}', 'svg.offcut': 'offcut', 'svg.rot': 'rotated',
            't.sheets': 'sheet in total|sheets in total', 't.placed': 'parts placed', 't.used': 'of sheet area used', 't.waste': 'waste', 't.cut': 'cut length', 't.edge': 'edge banding', 't.cost': 'estimated cost',
            'w.unfit': 'These do not fit on the sheet, check the sizes: ',
            'w.unfit.item': '№{id}{name} — {l}×{w} mm, sheet “{mat}” {L}×{W} with {t} mm trim',
            'w.bad': 'Parts without size or quantity are ignored: №{list}.',
            'status': '{n} {pl} · {u}% used',
            'lg.part': 'Part', 'lg.size': 'Size, mm', 'lg.q': 'Qty', 'lg.edge': 'Edge',
            'lg.2l': '2 along length', 'lg.1l': '1 along length', 'lg.2w': '2 along width', 'lg.1w': '1 along width', 'lg.none': 'no edging',
            'yes': 'yes', 'no': 'no',
            'csv.parts': '#;Name;Material;Length;Width;Quantity;Rotation;Edge length 1;Edge length 2;Edge width 1;Edge width 2',
            'csv.cut': 'Material;Sheet;Part #;Name;X, mm;Y, mm;Size X;Size Y;Rotated'
        },

        uz: {
            'meta.title': 'Plita materiallarini onlayn raskroy qilish',
            'meta.desc': 'LDSP, MDF va fanera uchun bepul onlayn raskroy: bichish xaritalari, varaqlar hisobi, kromka va kesim uzunligi. Brauzerda ishlaydi, ma’lumotlaringiz sizda qoladi.',
            'meta.ogdesc': 'LDSP, MDF va fanera uchun bichish xaritalari to‘g‘ridan-to‘g‘ri brauzerda: varaqlar, kromka, kesim uzunligi.',
            'brand': 'Raskroy onlayn',
            'nav.new': 'Yangi',
            'nav.works': 'Ishlar', 'step.works': 'Mening ishlarim', 'b.zipall': 'Hammasini bitta fayl qilib yuklash',
            'app.install': 'Ilovani o‘rnatish', 'app.installed': 'Ilova o‘rnatildi', 'app.ios': 'iPhone va iPad’da: «Ulashish»ni bosing va «Bosh ekranga qo‘shish»ni tanlang.', 'app.ok': 'Tushunarli', 'app.offline': 'Tarmoq yo‘q: ilova internetsiz ishlaydi', 'app.online': 'Tarmoq qaytdi', 'app.ready': 'Tayyor: ilova internetsiz ishlaydi', 'app.update': 'Ilovaning yangi versiyasi mavjud', 'app.reload': 'Yangilash', 'app.later': 'Keyinroq', 'app.drop': 'Faylni qo‘yib yuboring: u yangi ish sifatida ochiladi',
            'b.backup': 'Nusxa', 'b.backup.t': 'Barcha ishlarning nusxasini faylga saqlash', 'b.restore': 'Nusxadan', 'b.restore.t': 'Ishlarni nusxa faylidan qaytarish', 'bk.done': 'Nusxa saqlandi, ishlar: {n}', 'bk.restored': 'Nusxadan qo‘shilgan ishlar: {n}', 'bk.bad': 'Bu «Raskroy onlayn» nusxa fayli emas',
            'w.open': 'Ochish', 'w.dl': 'Yuklash', 'w.current': 'Ochiq', 'w.empty': 'detallar yo‘q', 'w.calc': 'hisoblanmoqda…',
            'w.zipbusy': 'Fayl tayyorlanmoqda…', 'w.none': 'Hozircha yuklab olinadigan narsa yo‘q: detallar qo‘shing', 'w.del': 'O‘chirish',
            'acc.aria': 'Urg‘u rangi', 'acc.blue': 'Ko‘k', 'acc.emerald': 'Zumrad', 'acc.violet': 'Binafsha', 'acc.coral': 'Marjon', 'acc.cyan': 'Havorang',
            'b.import': 'Bazisdan import', 'imp.done': 'Import qilingan detallar: {n}, materiallar: {m}. Yangi ish yaratildi.', 'imp.size': 'Varaq o‘lchami topilmadi: {list}. 2800×2070 mm qo‘yildi, tekshiring.', 'imp.fail': 'Faylda «Uzunligi» va «Eni» ustunlari topilmadi.', 'imp.xls': 'Eski .xls formatini o‘qib bo‘lmaydi: faylni .xlsx yoki .csv qilib saqlang.', 'imp.err': 'Faylni ochib bo‘lmadi.', 'imp.skip': 'O‘tkazib yuborilgan qatorlar: {s}.',
            'w.new': 'Yangi ish', 'w.default': 'Ish {n}', 'w.tabs.aria': 'Ishlar', 'w.rename': 'Ish nomi',
            'w.close': '“{name}” ishini yopish', 'w.delconfirm': '“{name}” ishi barcha detallari bilan o‘chirilsinmi?', 'w.created': 'Yaratildi: {name}',
            'skip': 'Mazmunga o‘tish',
            'nav.aria': 'Bo‘limlar',
            'nav.mat': 'Materiallar', 'nav.parts': 'Detallar', 'nav.res': 'Natija', 'nav.set': 'Sozlamalar',
            'theme.aria': 'Rang mavzusi',
            'theme.light': 'Och', 'theme.navy': 'To‘q ko‘k', 'theme.black': 'Qora',
            'theme.light.aria': 'Och mavzu', 'theme.navy.aria': 'To‘q ko‘k mavzu', 'theme.black.aria': 'Qora mavzu',
            'lang.aria': 'Til',
            'h1': 'Plita materiallarini onlayn raskroy qilish',
            'step.mat': 'Materiallar va sozlamalar',
            'preset.aria': 'Tayyor material',
            'pre.ldsp-2800': 'LDSP 16 mm · 2800 × 2070',
            'pre.ldsp-2750': 'LDSP 16 mm · 2750 × 1830',
            'pre.hdf-2800': 'HDF 3 mm · 2800 × 2070',
            'pre.hdf-2440': 'HDF 3 mm · 2440 × 1220',
            'pre.mdf-2800': 'MDF 16 mm · 2800 × 1220',
            'pre.ply-1525': 'Fanera 18 mm · 1525 × 1525',
            'pre.custom': 'O‘z o‘lchamingiz',
            'mat.ldsp16': 'LDSP 16 mm', 'mat.hdf3': 'HDF 3 mm', 'mat.mdf16': 'MDF 16 mm', 'mat.ply18': 'Fanera 18 mm', 'mat.new': 'Yangi material',
            'add.mat': '+ Material qo‘shish',
            's.kerf': 'Arra qalinligi (kesim), mm', 's.trim': 'Varaq chetini kesish, mm', 's.off': 'Qoldiqning minimal o‘lchami, 1-tomon, mm', 's.off2': 'Qoldiqning minimal o‘lchami, 2-tomon, mm', 's.mintrim': 'Minimal kesim (obrezka), mm', 's.adv': 'Bichish parametrlari', 's.dir': 'Kesimning boshlang‘ich yo‘nalishi', 's.dir.auto': 'Avtomatik (eng yaxshisi)', 's.dir.len': 'Varaq uzunligi bo‘ylab', 's.dir.wid': 'Varaq eni bo‘ylab', 's.grain.title': 'Varaq teksturali bo‘lsa — yoqing', 's.grain.on': 'Faqat «Teksturali varaq» belgilangan materiallar uchun amal qiladi.', 's.grain.off': 'Hech bir materialda «Teksturali varaq» belgisi yo‘q, shu sababli bu sozlamalar o‘chirilgan.', 'm.grain': 'Teksturali varaq',
            's.tex': 'Tekstura hisobga olinsin', 's.cplx': 'Murakkab polosalardan foydalanish', 's.minstrip': 'Polosaning minimal eni, mm', 's.maxstrip': 'Polosaning maksimal eni, mm', 's.maxlen': 'Polosaning maksimal uzunligi, mm', 'h.dir': 'Varaqning birinchi kesim yo‘nalishi. «Uzunlik bo‘ylab» varaqni uzun tomonga parallel polosalarga ajratadi. Avtomatik rejimda dastur eng yaxshi variantni tanlaydi.', 'h.tex': 'Yoqilgan: aylantirish o‘chirilgan detallarni burib bo‘lmaydi (tekstura varaq uzunligi bo‘ylab). O‘chirilgan: istalgan detalni burish mumkin.', 'h.cplx': 'O‘chirilgan: oddiy polosalar, bir polosada faqat bir xil enli detallar (kesim kam, chiqindi ko‘p). Yoqilgan: polosada turli enli detallar bo‘lishi mumkin.', 'h.minstrip': 'Birinchi kesim polosasi bundan tor bo‘lmaydi: tor detal kengroq polosaga qo‘yiladi. 0 — cheklovsiz.', 'h.maxstrip': 'Birinchi kesim polosasi bundan keng bo‘lmaydi (arra cheklovi). 0 — cheklovsiz.', 'h.maxlen': 'Kesim bundan uzun bo‘lmaydi, arra aravachasining yurishi hisobga olinadi. 0 — cheklovsiz.', 'h.mintrim': 'Bundan kichik qoldiq kesib tashlanmaydi, u detalda zapas bo‘lib qoladi. 0 — har qanday qoldiq kesiladi.', 'h.off': 'Qoldiqning uzun tomoni kamida shuncha bo‘lsa, u foydali hisoblanadi.', 'h.off2': 'va qisqa tomoni kamida shuncha bo‘lsa.', 'm.adv': 'Material parametrlari va narx', 'm.t': 'Qalinligi, mm', 'm.c.qtymat': 'Material miqdori, varaq', 'm.c.sheets': 'Varaqlar soni, dona', 'm.c.matcost': 'Material narxi, {cur}', 'm.c.opcost': 'Operatsiya narxi, {cur}', 'm.c.hint': 'Bichish natijasi bo‘yicha hisoblanadi',
            'm.fill': 'Hisobiy to‘ldirish foizi, %', 'm.bysheets': 'Narxni varaqlar bo‘yicha hisoblash', 'm.round': 'Varaqlarni yaxlitlash', 'm.round.whole': 'Butunga', 'm.round.half': '0,5 varaqqacha', 'm.round.none': 'Yaxlitlamaslik', 'm.opbasis': 'Operatsiya narxini hisoblash asosi', 'm.opb.cut': 'Kesim uzunligi', 'm.opb.perim': 'Detallar perimetri', 'm.opb.part': 'Detallar maydoni', 'm.opb.mat': 'Material maydoni', 'm.opprice.m': 'Operatsiya narxi, {cur} (1 m uchun)', 'm.opprice.m2': 'Operatsiya narxi, {cur} (1 m² uchun)', 'h.fill': 'Narx maydon bo‘yicha hisoblanganda kerak: material miqdori = detallar maydoni / (varaq maydoni × foiz).', 'h.bysheets': 'Yoqilgan: bichishga ishlatilgan butun varaqlar uchun to‘lanadi. O‘chirilgan: miqdor detallar maydoni va to‘ldirish foizidan hisoblanadi.', 'c.mat': 'Material', 'c.op': 'Bichish', 'c.edge': 'Kromka', 'c.total': 'Jami', 'u.sh': 'varaq', 'w.relaxed': '«{mat}» uchun polosa cheklovlari yumshatildi: aks holda ba’zi detallar sig‘masdi.', 's.cur': 'Valyuta',
            'cur': 'so‘m',
            'step.parts': 'Detallar',
            'b.addpart': '+ Detal qo‘shish', 'b.paste': 'Ro‘yxatni qo‘yish', 'b.example': 'Namuna: shkaf', 'b.csvparts': 'Detallar CSV faylini yuklash', 'b.clear': 'Tozalash',
            'paste.list': 'Detallar ro‘yxati', 'paste.mat': 'Import uchun material', 'paste.go': 'Ro‘yxatga qo‘shish',
            'h.name': 'Nomi', 'h.mat': 'Material', 'h.l': 'Uzunligi', 'h.w': 'Eni', 'h.q': 'Soni', 'h.edge': 'Kromka',
            'step.res': 'Raskroy natijasi',
            'b.csvcut': 'Raskroy CSV', 'b.print': 'Chop etish / PDF',
            'b.run': 'Qayta hisoblash', 'b.gores': 'Natija',
            'footer.contact': 'Muallif bilan bog‘lanish',
            'e404.title': 'Sahifa topilmadi', 'e404.btn': 'Raskroyni ochish',

            'm.name': 'Nomi', 'm.l': 'Varaq uzunligi, mm', 'm.w': 'Varaq eni, mm', 'm.price': 'Varaq narxi, {cur}', 'm.edgeprice': 'Kromka (1 metri), {cur}',
            'm.del': 'O‘chirish', 'm.del.aria': 'Materialni o‘chirish', 'm.noname': 'Nomsiz', 'm.fallback': 'Material',
            'm.delconfirm': '“{name}” materiali {n} ta detalda ishlatilgan. Detallari bilan birga o‘chirilsinmi?',
            'p.name.aria': '{n}-detal nomi', 'p.mat.aria': '{n}-detal materiali', 'p.l.aria': '{n}-detal uzunligi', 'p.w.aria': '{n}-detal eni', 'p.q.aria': '{n}-detal soni', 'p.edge.aria': '{n}-detal kromkasi',
            'p.l': 'Uzunligi, mm', 'p.w': 'Eni, mm', 'p.q': 'Soni', 'p.mat': 'Material', 'p.name': 'Nomi',
            'e.0': 'Uzunlik bo‘yicha kromka, yuqori tomon', 'e.1': 'Uzunlik bo‘yicha kromka, pastki tomon', 'e.2': 'Eni bo‘yicha kromka, chap tomon', 'e.3': 'Eni bo‘yicha kromka, o‘ng tomon',
            'p.rot.aria': 'Detalni 90 gradusga burishga ruxsat berish', 'p.dup.aria': '{n}-detalni nusxalash', 'p.del.aria': '{n}-detalni o‘chirish',
            'c.example': 'Joriy detallar ro‘yxati namuna bilan almashtirilsinmi?', 'c.clear': 'Ro‘yxatdagi barcha detallar o‘chirilsinmi?',
            'paste.added': 'Qo‘shildi: {a}', 'paste.skipped': ', o‘tkazib yuborildi: {s}', 'paste.none': 'Qatorlar aniqlanmadi',
            'ex.side': 'Yon devor', 'ex.topbot': 'Usti va tagi', 'ex.divider': 'To‘siq', 'ex.shelf': 'Tokcha', 'ex.door': 'Fasad', 'ex.plinth': 'Sokol', 'ex.back': 'Orqa devor',
            'bar.parts': 'Detallar: <b>{n}</b>', 'bar.area': 'maydon <b>{a} m²</b>',
            'u.mm': 'mm', 'u.m': 'm', 'u.m2': 'm²',
            'sheet.pl': 'varaq',
            'r.meta.parts': 'detal', 'r.meta.used': 'ishlatilgan', 'r.meta.cut': 'kesim', 'r.meta.edge': 'kromka',
            'r.sheet': 'Varaq', 'r.of': '{n} dan {i}', 'r.parts': 'Detallar', 'r.used': 'Ishlatilgan', 'r.cut': 'Kesim', 'r.svg': 'SVG yuklash',
            'svg.aria': 'Raskroy xaritasi, {i}-varaq', 'svg.offcut': 'qoldiq', 'svg.rot': 'burilgan',
            't.sheets': 'jami varaq', 't.placed': 'detal joylandi', 't.used': 'varaq maydonining ishlatilgani', 't.waste': 'chiqindi', 't.cut': 'kesim uzunligi', 't.edge': 'kromka', 't.cost': 'taxminiy narx',
            'w.unfit': 'Varaqqa sig‘maydi, o‘lchamlarni tekshiring: ',
            'w.unfit.item': '№{id}{name} — {l}×{w} mm, “{mat}” varag‘i {L}×{W}, chet kesish {t} mm',
            'w.bad': 'O‘lchami yoki soni yo‘q detallar hisobga olinmadi: №{list}.',
            'status': '{n} {pl} · {u}% ishlatilgan',
            'lg.part': 'Detal', 'lg.size': 'O‘lcham, mm', 'lg.q': 'Soni', 'lg.edge': 'Kromka',
            'lg.2l': 'uzunligi bo‘yicha 2', 'lg.1l': 'uzunligi bo‘yicha 1', 'lg.2w': 'eni bo‘yicha 2', 'lg.1w': 'eni bo‘yicha 1', 'lg.none': 'kromkasiz',
            'yes': 'ha', 'no': 'yo‘q',
            'csv.parts': '№;Nomi;Material;Uzunligi;Eni;Soni;Burish;Kromka uzunlik 1;Kromka uzunlik 2;Kromka en 1;Kromka en 2',
            'csv.cut': 'Material;Varaq;Detal №;Nomi;X, mm;Y, mm;X bo‘yicha o‘lcham;Y bo‘yicha o‘lcham;Burilgan'
        }
    };

    /* тексты раздела «Ткань» лежат в fabric-i18n.js и подключаются раньше */
    if (window.RKI18N_EXTRA) LANGS.forEach(function (l) { var x = window.RKI18N_EXTRA[l]; if (x) { for (var k in x) D[l][k] = x[k]; } });

    var lang = 'ru';
    try {
        var saved = localStorage.getItem('lang');
        if (LANGS.indexOf(saved) >= 0) lang = saved;
        else {
            var nav = (navigator.languages && navigator.languages[0]) || navigator.language || 'ru';
            nav = String(nav).slice(0, 2).toLowerCase();
            if (LANGS.indexOf(nav) >= 0) lang = nav;
        }
    } catch (e) { /* хранилище недоступно, остаётся русский */ }

    function t(key, vars) {
        var s = D[lang][key];
        if (s == null) s = D.ru[key];
        if (s == null) return key;
        if (vars) s = s.replace(/\{(\w+)\}/g, function (m, k) { return vars[k] != null ? vars[k] : m; });
        return s;
    }

    /* Склонение: в русском три формы, в английском две, в узбекском одна */
    function plural(n, key) {
        var f = t(key).split('|');
        if (lang === 'ru') {
            var m = n % 100, d = n % 10;
            if (m > 10 && m < 20) return f[2];
            if (d === 1) return f[0];
            if (d >= 2 && d <= 4) return f[1];
            return f[2];
        }
        if (lang === 'en') return n === 1 ? f[0] : (f[1] || f[0]);
        return f[0];
    }

    /* значения ключа на всех языках: нужны, чтобы узнать стандартное название и подставить его на новом языке */
    function all(key) { return LANGS.map(function (l) { return D[l][key]; }); }

    function apply() {
        var root = document.documentElement;
        root.setAttribute('lang', lang);
        document.title = t('meta.title');
        Array.prototype.forEach.call(document.querySelectorAll('[data-i18n]'), function (n) {
            n.textContent = t(n.getAttribute('data-i18n'));
        });
        /* data-i18n-attr="aria-label:key; title:key2" */
        Array.prototype.forEach.call(document.querySelectorAll('[data-i18n-attr]'), function (n) {
            n.getAttribute('data-i18n-attr').split(';').forEach(function (pair) {
                var p = pair.split(':');
                if (p.length === 2) n.setAttribute(p[0].trim(), t(p[1].trim()));
            });
        });
        Array.prototype.forEach.call(document.querySelectorAll('[data-lang-set]'), function (b) {
            var on = b.getAttribute('data-lang-set') === lang;
            b.setAttribute('aria-checked', String(on));
            b.tabIndex = on ? 0 : -1;
        });
    }

    function setLang(l) {
        if (LANGS.indexOf(l) < 0 || l === lang) return;
        lang = l;
        try { localStorage.setItem('lang', l); } catch (e) { /* хранилище недоступно */ }
        apply();
        document.dispatchEvent(new CustomEvent('rk:lang', { detail: l }));
    }

    Array.prototype.forEach.call(document.querySelectorAll('[data-lang-set]'), function (b) {
        b.addEventListener('click', function () { setLang(b.getAttribute('data-lang-set')); });
        b.addEventListener('keydown', function (e) {
            var d = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : (e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0);
            if (!d) return;
            e.preventDefault();
            /* стрелки двигаются только внутри своей группы кнопок */
            var group = Array.prototype.slice.call(b.parentNode.querySelectorAll('[data-lang-set]'));
            var n = group[(group.indexOf(b) + d + group.length) % group.length];
            n.focus(); n.click();
        });
    });

    window.RKI18N = {
        t: t,
        plural: plural,
        all: all,
        lang: function () { return lang; },
        /* числа: русский и узбекский форматируются с пробелом и запятой, английский с запятой и точкой */
        locale: function () { return lang === 'en' ? 'en-US' : 'ru-RU'; },
        decimal: function () { return lang === 'en' ? '.' : ','; }
    };

    apply();
})();
