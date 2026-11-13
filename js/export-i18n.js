/* Тексты экспорта (Excel, PNG, PDF) на трёх языках. Подключается после fabric-i18n.js и раньше i18n.js, перекрывает старые подписи кнопок. */
(function () {
    'use strict';
    var X = window.RKI18N_EXTRA = window.RKI18N_EXTRA || { ru: {}, en: {}, uz: {} };
    var T = {
        ru: {
            'b.csvparts': 'Скачать Excel', 'b.csvcut': 'Excel раскроя', 'r.svg': 'Скачать PNG', 'r.svg2': 'SVG',
            'b.zipall': 'Скачать всё одним файлом (PDF)', 'b.xlsxall': 'Excel', 'b.zipdesk': 'ZIP',
            'w.pdf': 'PDF', 'w.xlsx': 'Excel', 'w.zip': 'ZIP',
            'x.sheet.sum': 'Итоги', 'x.sheet.parts': 'Детали', 'x.sheet.cut': 'Раскрой', 'x.work': 'Работа',
            'x.col.mat': 'Материал', 'x.col.size': 'Размер листа, мм', 'x.col.sheets': 'Листов', 'x.col.parts': 'Деталей', 'x.col.used': 'Использовано, %',
            'x.col.cut': 'Рез, м', 'x.col.edge': 'Кромка, м', 'x.col.cost': 'Стоимость',
            'x.col.no': '№', 'x.col.name': 'Название', 'x.col.dim': 'Размер, мм', 'x.col.qty': 'Шт.', 'x.col.rot': 'Поворот',
            'x.pdf.title': 'Карта раскроя', 'x.pdf.date': 'Дата', 'x.pdf.sheetof': 'Лист {i} из {n}', 'x.pdf.list': 'Список деталей',
            'x.pdf.all': 'Все работы', 'x.pdf.free': 'Остатки', 'x.pdf.noparts': 'В работе нет деталей',
            'x.busy': 'Готовлю файл…', 'x.progress': 'Готовлю: {i} из {n}', 'x.done': 'Файл готов', 'x.err': 'Не удалось подготовить файл. Попробуйте ещё раз',
            'x.none': 'Пока нечего скачивать: добавьте детали', 'x.sheetimg': 'Лист', 'x.png.done': 'Картинка сохранена'
        },
        en: {
            'b.csvparts': 'Download Excel', 'b.csvcut': 'Cutting Excel', 'r.svg': 'Download PNG', 'r.svg2': 'SVG',
            'b.zipall': 'Download everything as one file (PDF)', 'b.xlsxall': 'Excel', 'b.zipdesk': 'ZIP',
            'w.pdf': 'PDF', 'w.xlsx': 'Excel', 'w.zip': 'ZIP',
            'x.sheet.sum': 'Summary', 'x.sheet.parts': 'Parts', 'x.sheet.cut': 'Cutting', 'x.work': 'Project',
            'x.col.mat': 'Material', 'x.col.size': 'Sheet size, mm', 'x.col.sheets': 'Sheets', 'x.col.parts': 'Parts', 'x.col.used': 'Used, %',
            'x.col.cut': 'Cuts, m', 'x.col.edge': 'Edge, m', 'x.col.cost': 'Cost',
            'x.col.no': '#', 'x.col.name': 'Name', 'x.col.dim': 'Size, mm', 'x.col.qty': 'Qty', 'x.col.rot': 'Rotated',
            'x.pdf.title': 'Cutting plan', 'x.pdf.date': 'Date', 'x.pdf.sheetof': 'Sheet {i} of {n}', 'x.pdf.list': 'Parts list',
            'x.pdf.all': 'All projects', 'x.pdf.free': 'Offcuts', 'x.pdf.noparts': 'This project has no parts',
            'x.busy': 'Preparing the file…', 'x.progress': 'Preparing: {i} of {n}', 'x.done': 'File is ready', 'x.err': 'Could not prepare the file. Please try again',
            'x.none': 'Nothing to download yet: add some parts', 'x.sheetimg': 'Sheet', 'x.png.done': 'Image saved'
        },
        uz: {
            'b.csvparts': 'Excel yuklash', 'b.csvcut': 'Raskroy Excel', 'r.svg': 'PNG yuklash', 'r.svg2': 'SVG',
            'b.zipall': 'Hammasini bitta fayl qilib yuklash (PDF)', 'b.xlsxall': 'Excel', 'b.zipdesk': 'ZIP',
            'w.pdf': 'PDF', 'w.xlsx': 'Excel', 'w.zip': 'ZIP',
            'x.sheet.sum': 'Yakunlar', 'x.sheet.parts': 'Detallar', 'x.sheet.cut': 'Raskroy', 'x.work': 'Ish',
            'x.col.mat': 'Material', 'x.col.size': 'Varaq o‘lchami, mm', 'x.col.sheets': 'Varaqlar', 'x.col.parts': 'Detallar', 'x.col.used': 'Ishlatilgan, %',
            'x.col.cut': 'Kesim, m', 'x.col.edge': 'Kromka, m', 'x.col.cost': 'Narxi',
            'x.col.no': '№', 'x.col.name': 'Nomi', 'x.col.dim': 'O‘lcham, mm', 'x.col.qty': 'Soni', 'x.col.rot': 'Burilgan',
            'x.pdf.title': 'Raskroy xaritasi', 'x.pdf.date': 'Sana', 'x.pdf.sheetof': '{n} dan {i}-varaq', 'x.pdf.list': 'Detallar ro‘yxati',
            'x.pdf.all': 'Hamma ishlar', 'x.pdf.free': 'Qoldiqlar', 'x.pdf.noparts': 'Ishda detallar yo‘q',
            'x.busy': 'Fayl tayyorlanmoqda…', 'x.progress': 'Tayyorlanmoqda: {n} dan {i}', 'x.done': 'Fayl tayyor', 'x.err': 'Faylni tayyorlab bo‘lmadi. Qayta urinib ko‘ring',
            'x.none': 'Hozircha yuklab olinadigan narsa yo‘q: detallar qo‘shing', 'x.sheetimg': 'Varaq', 'x.png.done': 'Rasm saqlandi'
        }
    };
    ['ru', 'en', 'uz'].forEach(function (l) { X[l] = X[l] || {}; for (var k in T[l]) X[l][k] = T[l][k]; });
})();
(function () {
    'use strict';
    var X = window.RKI18N_EXTRA;
    var T = {
        ru: { 'fb.dl.png': 'Скачать PNG', 'fb.dl.pdf': 'Скачать PDF', 'fb.dl.xlsx': 'Скачать Excel', 'fb.dl.svg': 'SVG' },
        en: { 'fb.dl.png': 'Download PNG', 'fb.dl.pdf': 'Download PDF', 'fb.dl.xlsx': 'Download Excel', 'fb.dl.svg': 'SVG' },
        uz: { 'fb.dl.png': 'PNG yuklash', 'fb.dl.pdf': 'PDF yuklash', 'fb.dl.xlsx': 'Excel yuklash', 'fb.dl.svg': 'SVG' }
    };
    ['ru', 'en', 'uz'].forEach(function (l) { for (var k in T[l]) X[l][k] = T[l][k]; });
})();
(function () {
    'use strict';
    var X = window.RKI18N_EXTRA;
    var T = { ru: { 'sel.close': 'Закрыть' }, en: { 'sel.close': 'Close' }, uz: { 'sel.close': 'Yopish' } };
    ['ru', 'en', 'uz'].forEach(function (l) { for (var k in T[l]) X[l][k] = T[l][k]; });
})();
(function () {
    'use strict';
    var X = window.RKI18N_EXTRA;
    var T = {
        ru: { 'x.ready': 'Файл готов', 'x.share': 'Поделиться или отправить', 'x.savephone': 'Сохранить на телефон', 'x.close': 'Закрыть', 'x.kb': 'КБ', 'x.mb': 'МБ' },
        en: { 'x.ready': 'File is ready', 'x.share': 'Share or send', 'x.savephone': 'Save to phone', 'x.close': 'Close', 'x.kb': 'KB', 'x.mb': 'MB' },
        uz: { 'x.ready': 'Fayl tayyor', 'x.share': 'Ulashish yoki yuborish', 'x.savephone': 'Telefonga saqlash', 'x.close': 'Yopish', 'x.kb': 'KB', 'x.mb': 'MB' }
    };
    ['ru', 'en', 'uz'].forEach(function (l) { for (var k in T[l]) X[l][k] = T[l][k]; });
})();
(function () {
    'use strict';
    var X = window.RKI18N_EXTRA;
    var T = {
        ru: { 'd.cancel': 'Отмена', 'd.ok': 'ОК', 'd.delete': 'Удалить', 'd.replace': 'Заменить' },
        en: { 'd.cancel': 'Cancel', 'd.ok': 'OK', 'd.delete': 'Delete', 'd.replace': 'Replace' },
        uz: { 'd.cancel': 'Bekor qilish', 'd.ok': 'OK', 'd.delete': 'O‘chirish', 'd.replace': 'Almashtirish' }
    };
    ['ru', 'en', 'uz'].forEach(function (l) { for (var k in T[l]) X[l][k] = T[l][k]; });
})();
(function () {
    'use strict';
    var X = window.RKI18N_EXTRA;
    var T = {
        ru: { 'fold.open': 'Развернуть раздел', 'fold.close': 'Свернуть раздел' },
        en: { 'fold.open': 'Expand section', 'fold.close': 'Collapse section' },
        uz: { 'fold.open': 'Bo‘limni ochish', 'fold.close': 'Bo‘limni yig‘ish' }
    };
    ['ru', 'en', 'uz'].forEach(function (l) { for (var k in T[l]) X[l][k] = T[l][k]; });
})();
(function () {
    'use strict';
    var X = window.RKI18N_EXTRA;
    var T = {
        ru: { 'f.all': 'Свернуть все', 'f.unall': 'Развернуть все', 'f.hint': 'Нажмите на номер детали, чтобы свернуть или развернуть её.', 'f.count': 'Деталей: {n}', 'f.pcs': 'шт', 'f.fold': 'Свернуть деталь {n}', 'f.unfold': 'Развернуть деталь {n}' },
        en: { 'f.all': 'Collapse all', 'f.unall': 'Expand all', 'f.hint': 'Tap a part number to collapse or expand it.', 'f.count': 'Parts: {n}', 'f.pcs': 'pcs', 'f.fold': 'Collapse part {n}', 'f.unfold': 'Expand part {n}' },
        uz: { 'f.all': 'Hammasini yig‘ish', 'f.unall': 'Hammasini ochish', 'f.hint': 'Detalni yig‘ish yoki ochish uchun uning raqamini bosing.', 'f.count': 'Detallar: {n}', 'f.pcs': 'dona', 'f.fold': '{n}-detalni yig‘ish', 'f.unfold': '{n}-detalni ochish' }
    };
    ['ru', 'en', 'uz'].forEach(function (l) { for (var k in T[l]) X[l][k] = T[l][k]; });
})();


(function () {
    'use strict';
    var X = window.RKI18N_EXTRA;
    var T = {
        ru: { 'am.aria': 'Режим подбора', 'am.manual': 'Ручной подбор', 'am.auto': 'Авто подбор',
            'am.note.manual': 'Направление резов и параметры полос вы задаёте сами.',
            'am.note.auto': 'Программа сама переберёт несколько вариантов раскроя (направление резов, порядок деталей) и оставит тот, где меньше листов и отходов.',
            'am.d.auto': 'смешанное направление резов', 'am.d.length': 'резы вдоль длины листа', 'am.d.width': 'резы вдоль ширины листа',
            'am.res': 'Авто подбор: проверено вариантов — {n}, выбран №{v} ({dir}).',
            'am.res.sheets': 'Это на {n} {pl} меньше, чем у худшего варианта.', 'am.res.waste': 'Отходов меньше на {d}% листа, чем у худшего варианта.', 'am.res.same': 'Все варианты дали близкий результат.' },
        en: { 'am.aria': 'Selection mode', 'am.manual': 'Manual', 'am.auto': 'Auto',
            'am.note.manual': 'You set the cut direction and strip parameters yourself.',
            'am.note.auto': 'The app tries several cutting variants (cut direction, part order) and keeps the one with fewer sheets and less waste.',
            'am.d.auto': 'mixed cut direction', 'am.d.length': 'cuts along sheet length', 'am.d.width': 'cuts along sheet width',
            'am.res': 'Auto: {n} variants tried, #{v} chosen ({dir}).',
            'am.res.sheets': 'That is {n} {pl} fewer than the worst variant.', 'am.res.waste': 'Waste is {d}% of the sheets lower than the worst variant.', 'am.res.same': 'All variants gave a similar result.' },
        uz: { 'am.aria': 'Tanlash rejimi', 'am.manual': 'Qo‘lda tanlash', 'am.auto': 'Avto tanlash',
            'am.note.manual': 'Kesish yo‘nalishi va polosa parametrlarini o‘zingiz belgilaysiz.',
            'am.note.auto': 'Dastur bir nechta variantni (kesish yo‘nalishi, detallar tartibi) sinab ko‘radi va varaqlari hamda chiqindisi kam bo‘lganini qoldiradi.',
            'am.d.auto': 'aralash kesish yo‘nalishi', 'am.d.length': 'varaq uzunligi bo‘ylab kesish', 'am.d.width': 'varaq eni bo‘ylab kesish',
            'am.res': 'Avto: {n} ta variant sinaldi, №{v} tanlandi ({dir}).',
            'am.res.sheets': 'Bu eng yomon variantdan {n} {pl} kam.', 'am.res.waste': 'Chiqindi eng yomon variantdan varaqning {d}% ga kam.', 'am.res.same': 'Barcha variantlar o‘xshash natija berdi.' }
    };
    ['ru', 'en', 'uz'].forEach(function (l) { for (var k in T[l]) X[l][k] = T[l][k]; });
})();

(function () {
    'use strict';
    var X = window.RKI18N_EXTRA;
    var T = {
        ru: { 'fo.new': 'Новая папка', 'fo.hint': 'Папка — для всех раскроев одного заказчика. Соберите работы в папку и скачайте её одним файлом.',
            'fo.name': 'Название папки (например, имя заказчика)', 'fo.ph': 'Заказчик', 'fo.default': 'Папка {n}', 'fo.create': 'Создать',
            'fo.created': 'Папка «{name}» создана', 'fo.addwork': '+ Работа', 'fo.rename': 'Переименовать', 'fo.del': 'Удалить папку',
            'fo.delconfirm': 'Удалить папку «{name}»? Работы из неё не удаляются, они останутся без папки.',
            'fo.count': '{n} {pl}', 'fo.work.pl': 'работа|работы|работ', 'fo.emptyshort': 'пусто',
            'fo.empty': 'Папка пуста. Нажмите «+ Работа» или перенесите сюда готовую работу кнопкой «В папку».',
            'fo.dl': 'Скачать папку', 'fo.toggle': 'Папка «{name}»: свернуть или развернуть',
            'fo.move': 'В папку', 'fo.move.title': 'В какую папку переместить «{name}»?', 'fo.none': 'Без папки', 'fo.newopt': '+ Новая папка…',
            'fo.moved': '«{w}» теперь в папке «{f}»', 'fo.unmoved': '«{w}» вынесена из папки', 'fo.ungrouped': 'Без папки' },
        en: { 'fo.new': 'New folder', 'fo.hint': 'A folder holds all the cuts for one customer. Put the projects in a folder and download it as one file.',
            'fo.name': 'Folder name (e.g. the customer’s name)', 'fo.ph': 'Customer', 'fo.default': 'Folder {n}', 'fo.create': 'Create',
            'fo.created': 'Folder “{name}” created', 'fo.addwork': '+ Project', 'fo.rename': 'Rename', 'fo.del': 'Delete folder',
            'fo.delconfirm': 'Delete folder “{name}”? Its projects are not deleted, they just move out of the folder.',
            'fo.count': '{n} {pl}', 'fo.work.pl': 'project|projects', 'fo.emptyshort': 'empty',
            'fo.empty': 'The folder is empty. Press “+ Project” or move a finished project here with “To folder”.',
            'fo.dl': 'Download folder', 'fo.toggle': 'Folder “{name}”: collapse or expand',
            'fo.move': 'To folder', 'fo.move.title': 'Move “{name}” to which folder?', 'fo.none': 'No folder', 'fo.newopt': '+ New folder…',
            'fo.moved': '“{w}” is now in “{f}”', 'fo.unmoved': '“{w}” was taken out of its folder', 'fo.ungrouped': 'No folder' },
        uz: { 'fo.new': 'Yangi papka', 'fo.hint': 'Papka — bir buyurtmachining barcha bichimlari uchun. Ishlarni papkaga yig‘ib, uni bitta fayl qilib yuklab oling.',
            'fo.name': 'Papka nomi (masalan, buyurtmachi ismi)', 'fo.ph': 'Buyurtmachi', 'fo.default': 'Papka {n}', 'fo.create': 'Yaratish',
            'fo.created': '«{name}» papkasi yaratildi', 'fo.addwork': '+ Ish', 'fo.rename': 'Nomini o‘zgartirish', 'fo.del': 'Papkani o‘chirish',
            'fo.delconfirm': '«{name}» papkasi o‘chirilsinmi? Ishlar o‘chmaydi, papkasiz qoladi.',
            'fo.count': '{n} {pl}', 'fo.work.pl': 'ish', 'fo.emptyshort': 'bo‘sh',
            'fo.empty': 'Papka bo‘sh. «+ Ish» tugmasini bosing yoki tayyor ishni «Papkaga» tugmasi bilan ko‘chiring.',
            'fo.dl': 'Papkani yuklab olish', 'fo.toggle': '«{name}» papkasi: yig‘ish yoki ochish',
            'fo.move': 'Papkaga', 'fo.move.title': '«{name}» qaysi papkaga ko‘chirilsin?', 'fo.none': 'Papkasiz', 'fo.newopt': '+ Yangi papka…',
            'fo.moved': '«{w}» endi «{f}» papkasida', 'fo.unmoved': '«{w}» papkadan chiqarildi', 'fo.ungrouped': 'Papkasiz' }
    };
    ['ru', 'en', 'uz'].forEach(function (l) { for (var k in T[l]) X[l][k] = T[l][k]; });
})();

(function () {
    'use strict';
    var X = window.RKI18N_EXTRA;
    var T = {
        ru: { 'w.newname': 'Название новой работы (например, имя заказчика)', 'w.create': 'Создать', 'w.ph': 'Название работы', 'fb.newname': 'Название нового изделия (например, диван Иванова)', 'fb.ph': 'Название изделия' },
        en: { 'w.newname': 'Name of the new project (e.g. the customer’s name)', 'w.create': 'Create', 'w.ph': 'Project name', 'fb.newname': 'Name of the new item (e.g. Ivanov’s sofa)', 'fb.ph': 'Item name' },
        uz: { 'w.newname': 'Yangi ish nomi (masalan, buyurtmachi ismi)', 'w.create': 'Yaratish', 'w.ph': 'Ish nomi', 'fb.newname': 'Yangi buyum nomi (masalan, Ivanovning divani)', 'fb.ph': 'Buyum nomi' }
    };
    ['ru', 'en', 'uz'].forEach(function (l) { for (var k in T[l]) X[l][k] = T[l][k]; });
})();

(function () {
    'use strict';
    var X = window.RKI18N_EXTRA;
    var T = {
        ru: { 'paste.ph': 'Например:\nБоковина 720х560 - 2 шт\nПолка 800 на 300 по 4\n70х50 см 2шт',
            'paste.clip': 'Вставить из буфера', 'paste.hint': 'Можно вставить сообщение заказчика как есть: «Боковина 720х560 - 2 шт», «полка 800 на 300 по 4», «70х50 см».',
            'paste.found': 'Распознано деталей: {n} ({p} шт.)', 'paste.noname': 'Без названия', 'paste.pcs': 'шт.', 'paste.bad': 'Не понял строк: {s}',
            'paste.noclip': 'Браузер не дал доступ к буферу: вставьте текст в поле вручную (долгое нажатие → «Вставить»).', 'paste.emptyclip': 'Буфер обмена пуст' },
        en: { 'paste.ph': 'For example:\nSide 720x560 - 2 pcs\nShelf 800 by 300 x4\n70x50 cm 2pcs',
            'paste.clip': 'Paste from clipboard', 'paste.hint': 'You can paste the customer’s message as it is: “Side 720x560 - 2 pcs”, “shelf 800 by 300 x4”, “70x50 cm”.',
            'paste.found': 'Parts recognised: {n} ({p} pcs)', 'paste.noname': 'Unnamed', 'paste.pcs': 'pcs', 'paste.bad': 'Lines not understood: {s}',
            'paste.noclip': 'The browser did not allow clipboard access: paste the text into the field manually (long press → Paste).', 'paste.emptyclip': 'Clipboard is empty' },
        uz: { 'paste.ph': 'Masalan:\nYon devor 720x560 - 2 dona\nPolka 800 ga 300 4 ta\n70x50 sm 2 ta',
            'paste.clip': 'Buferdan qo‘yish', 'paste.hint': 'Buyurtmachi xabarini o‘zgartirmay qo‘yishingiz mumkin: «Yon devor 720x560 - 2 dona», «polka 800 ga 300 4 ta», «70x50 sm».',
            'paste.found': 'Taniqlangan detallar: {n} ({p} dona)', 'paste.noname': 'Nomsiz', 'paste.pcs': 'dona', 'paste.bad': 'Tushunilmagan qatorlar: {s}',
            'paste.noclip': 'Brauzer buferga ruxsat bermadi: matnni maydonga qo‘lda qo‘ying (uzoq bosish → Qo‘yish).', 'paste.emptyclip': 'Bufer bo‘sh' }
    };
    ['ru', 'en', 'uz'].forEach(function (l) { for (var k in T[l]) X[l][k] = T[l][k]; });
})();

(function () {
    'use strict';
    var X = window.RKI18N_EXTRA;
    var T = {
        ru: { 'b.photos': 'Фото листов', 'w.photo': 'Фото', 'ph.title': 'Фото листов', 'ph.sub': 'Каждый лист — отдельная картинка. Нажмите на картинку, чтобы увеличить.',
            'ph.save': 'Скачать фото', 'ph.all': 'Скачать все ({n})', 'ph.ready': 'Фото готовы: {n}', 'r.svg': 'Скачать фото' },
        en: { 'b.photos': 'Sheet photos', 'w.photo': 'Photos', 'ph.title': 'Sheet photos', 'ph.sub': 'Each sheet is a separate picture. Tap a picture to enlarge it.',
            'ph.save': 'Download photo', 'ph.all': 'Download all ({n})', 'ph.ready': 'Photos ready: {n}', 'r.svg': 'Download photo' },
        uz: { 'b.photos': 'Varaq rasmlari', 'w.photo': 'Rasm', 'ph.title': 'Varaq rasmlari', 'ph.sub': 'Har bir varaq alohida rasm. Kattalashtirish uchun rasmni bosing.',
            'ph.save': 'Rasmni yuklash', 'ph.all': 'Hammasini yuklash ({n})', 'ph.ready': 'Rasmlar tayyor: {n}', 'r.svg': 'Rasmni yuklash' }
    };
    ['ru', 'en', 'uz'].forEach(function (l) { for (var k in T[l]) X[l][k] = T[l][k]; });
})();


(function () {
    'use strict';
    var X = window.RKI18N_EXTRA;
    var T = {
        ru: { 'am.fail': 'Не удалось рассчитать этот материал (слишком долго или ошибка). Проверьте размеры деталей и листа.' },
        en: { 'am.fail': 'Could not calculate this material (too long or an error). Check the part and sheet sizes.' },
        uz: { 'am.fail': 'Bu material hisoblanmadi (juda uzoq yoki xatolik). Detal va varaq o‘lchamlarini tekshiring.' }
    };
    ['ru', 'en', 'uz'].forEach(function (l) { for (var k in T[l]) X[l][k] = T[l][k]; });
})();

/* Профили: логин и пароль */
(function () {
    'use strict';
    var X = window.RKI18N_EXTRA;
    var T = {
        ru: {
            'au.btn': 'Профиль', 'au.show': 'Показать', 'au.hide': 'Скрыть',
            'au.title.new': 'Создайте профиль', 'au.sub.new': 'Придумайте логин и пароль. У каждого профиля свои работы: войдёте под другим логином — увидите другие.',
            'au.title.add': 'Новый профиль', 'au.sub.add': 'У нового профиля будут свои работы, сначала пустые.',
            'au.title.in': 'Вход', 'au.sub.in': 'Введите логин и пароль своего профиля.',
            'au.title.pw': 'Смена пароля', 'au.sub.pw': 'Введите текущий пароль и придумайте новый.',
            'au.title.del': 'Удалить профиль', 'au.sub.del': 'Профиль «{n}» и все его работы будут удалены с этого устройства. Сначала сделайте резервную копию, если работы нужны. Для подтверждения введите пароль.',
            'au.login': 'Логин', 'au.pass': 'Пароль', 'au.pass2': 'Повторите пароль', 'au.pass.old': 'Текущий пароль', 'au.pass.new': 'Новый пароль',
            'au.stay': 'Оставаться в системе',
            'au.btn.reg': 'Создать профиль', 'au.btn.in': 'Войти', 'au.btn.pw': 'Сменить пароль', 'au.btn.del': 'Удалить навсегда',
            'au.to.new': 'Создать новый профиль', 'au.to.in': 'У меня уже есть профиль',
            'au.note': 'Профиль хранится только на этом устройстве. Чтобы перенести работы на другое устройство, сделайте резервную копию и загрузите её там.',
            'au.mig': 'Ваши прежние работы с этого устройства будут перенесены в этот профиль.',
            'au.e.login': 'Логин: от 2 до 30 символов', 'au.e.pass': 'Пароль: минимум 4 символа', 'au.e.same': 'Пароли не совпадают',
            'au.e.exists': 'Такой логин уже есть', 'au.e.bad': 'Неверный логин или пароль', 'au.e.old': 'Неверный пароль',
            'au.e.nocrypto': 'Браузер не поддерживает защищённое хранение пароля. Откройте сайт по адресу https.',
            'au.e.store': 'Не удалось сохранить: память браузера недоступна или заполнена',
            'au.m.works': 'Работ: {n}', 'au.m.profiles': 'Другие профили', 'au.m.add': 'Добавить профиль', 'au.m.backup': 'Резервная копия работ',
            'au.m.pw': 'Сменить пароль', 'au.m.out': 'Выйти', 'au.m.del': 'Удалить профиль', 'au.toast.pw': 'Пароль изменён'
        },
        en: {
            'au.btn': 'Profile', 'au.show': 'Show', 'au.hide': 'Hide',
            'au.title.new': 'Create a profile', 'au.sub.new': 'Choose a login and a password. Every profile keeps its own jobs: sign in under another login to see other ones.',
            'au.title.add': 'New profile', 'au.sub.add': 'The new profile has its own jobs, empty at first.',
            'au.title.in': 'Sign in', 'au.sub.in': 'Enter the login and password of your profile.',
            'au.title.pw': 'Change password', 'au.sub.pw': 'Enter the current password and choose a new one.',
            'au.title.del': 'Delete profile', 'au.sub.del': 'Profile “{n}” and all its jobs will be deleted from this device. Make a backup first if you need them. Enter the password to confirm.',
            'au.login': 'Login', 'au.pass': 'Password', 'au.pass2': 'Repeat password', 'au.pass.old': 'Current password', 'au.pass.new': 'New password',
            'au.stay': 'Stay signed in',
            'au.btn.reg': 'Create profile', 'au.btn.in': 'Sign in', 'au.btn.pw': 'Change password', 'au.btn.del': 'Delete forever',
            'au.to.new': 'Create a new profile', 'au.to.in': 'I already have a profile',
            'au.note': 'The profile is stored on this device only. To move jobs to another device, make a backup and load it there.',
            'au.mig': 'Your earlier jobs from this device will be moved into this profile.',
            'au.e.login': 'Login: 2 to 30 characters', 'au.e.pass': 'Password: at least 4 characters', 'au.e.same': 'Passwords do not match',
            'au.e.exists': 'This login is taken', 'au.e.bad': 'Wrong login or password', 'au.e.old': 'Wrong password',
            'au.e.nocrypto': 'This browser cannot store the password securely. Open the site over https.',
            'au.e.store': 'Could not save: browser storage is unavailable or full',
            'au.m.works': 'Jobs: {n}', 'au.m.profiles': 'Other profiles', 'au.m.add': 'Add profile', 'au.m.backup': 'Backup of jobs',
            'au.m.pw': 'Change password', 'au.m.out': 'Sign out', 'au.m.del': 'Delete profile', 'au.toast.pw': 'Password changed'
        },
        uz: {
            'au.btn': 'Profil', 'au.show': 'Ko‘rsatish', 'au.hide': 'Yashirish',
            'au.title.new': 'Profil yarating', 'au.sub.new': 'Login va parol o‘ylab toping. Har bir profilning o‘z ishlari bor: boshqa login bilan kirsangiz, boshqa ishlarni ko‘rasiz.',
            'au.title.add': 'Yangi profil', 'au.sub.add': 'Yangi profilning o‘z ishlari bo‘ladi, avval bo‘sh.',
            'au.title.in': 'Kirish', 'au.sub.in': 'Profilingizning login va parolini kiriting.',
            'au.title.pw': 'Parolni almashtirish', 'au.sub.pw': 'Joriy parolni kiriting va yangisini o‘ylab toping.',
            'au.title.del': 'Profilni o‘chirish', 'au.sub.del': '«{n}» profili va uning barcha ishlari bu qurilmadan o‘chiriladi. Ishlar kerak bo‘lsa, avval zaxira nusxa oling. Tasdiqlash uchun parolni kiriting.',
            'au.login': 'Login', 'au.pass': 'Parol', 'au.pass2': 'Parolni takrorlang', 'au.pass.old': 'Joriy parol', 'au.pass.new': 'Yangi parol',
            'au.stay': 'Tizimda qolish',
            'au.btn.reg': 'Profil yaratish', 'au.btn.in': 'Kirish', 'au.btn.pw': 'Parolni almashtirish', 'au.btn.del': 'Butunlay o‘chirish',
            'au.to.new': 'Yangi profil yaratish', 'au.to.in': 'Menda profil bor',
            'au.note': 'Profil faqat shu qurilmada saqlanadi. Ishlarni boshqa qurilmaga o‘tkazish uchun zaxira nusxa oling va u yerda yuklang.',
            'au.mig': 'Shu qurilmadagi avvalgi ishlaringiz bu profilga ko‘chiriladi.',
            'au.e.login': 'Login: 2 dan 30 gacha belgi', 'au.e.pass': 'Parol: kamida 4 belgi', 'au.e.same': 'Parollar mos kelmadi',
            'au.e.exists': 'Bunday login band', 'au.e.bad': 'Login yoki parol noto‘g‘ri', 'au.e.old': 'Parol noto‘g‘ri',
            'au.e.nocrypto': 'Brauzer parolni xavfsiz saqlay olmaydi. Saytni https orqali oching.',
            'au.e.store': 'Saqlab bo‘lmadi: brauzer xotirasi mavjud emas yoki to‘lgan',
            'au.m.works': 'Ishlar: {n}', 'au.m.profiles': 'Boshqa profillar', 'au.m.add': 'Profil qo‘shish', 'au.m.backup': 'Ishlarning zaxira nusxasi',
            'au.m.pw': 'Parolni almashtirish', 'au.m.out': 'Chiqish', 'au.m.del': 'Profilni o‘chirish', 'au.toast.pw': 'Parol almashtirildi'
        }
    };
    ['ru', 'en', 'uz'].forEach(function (l) { for (var k in T[l]) X[l][k] = T[l][k]; });
})();

/* Облачные профили (версия 39): ключи au.* для базы, переноса работ, синхронизации и блокировки */
(function () {
    'use strict';
    var X = window.RKI18N_EXTRA;
    var T = {
        ru: {
            'au.sub.new.c': 'Придумайте логин и пароль. С ними можно войти на любом устройстве: работы хранятся в облаке и будут везде.',
            'au.sub.in.c': 'Введите логин и пароль. Ваши работы загрузятся из облака.',
            'au.sub.del.c': 'Аккаунт «{n}» и все его работы будут удалены из облака и с этого устройства без возможности восстановления. Для подтверждения введите пароль.',
            'au.note.c': 'Аккаунт и работы хранятся в облаке. Пароль восстановить нельзя, запомните его.',
            'au.e.pass6': 'Пароль: минимум 6 символов',
            'au.e.net': 'Нет связи с сервером. Проверьте интернет и попробуйте ещё раз.',
            'au.e.rate': 'Слишком много попыток. Подождите минуту.',
            'au.e.blocked': 'Этот аккаунт заблокирован администратором.',
            'au.e.confirm': 'В базе включено подтверждение почты. Отключите «Confirm email» в Supabase (см. SETUP-SUPABASE.txt).',
            'au.e.closed': 'Регистрация новых аккаунтов отключена.',
            'au.e.server': 'Ошибка сервера. Попробуйте позже.',
            'au.title.imp': 'Перенос работ', 'au.sub.imp': 'Введите логин и пароль старого профиля с этого устройства (из версии без облака): его работы добавятся в текущий аккаунт.',
            'au.btn.imp': 'Перенести', 'au.toast.imp': 'Перенесено работ: {n}',
            'au.m.edit': 'Мой профиль', 'au.m.admin': 'Админ-панель', 'au.m.import': 'Перенести работы с этого устройства', 'au.m.del.c': 'Удалить аккаунт',
            'au.sync.conf': 'Работы изменились на другом устройстве, а на этом есть несохранённые правки. Что оставить?',
            'au.sync.cloud': 'Взять из облака', 'au.sync.mine': 'Оставить мои',
            'au.sync.newer': 'На другом устройстве работы обновились. Загрузить свежие?', 'au.sync.load': 'Загрузить',
            'au.sync.wait': 'Загружаем ваши работы…',
            'au.blocked.title': 'Аккаунт заблокирован', 'au.blocked.sub': 'Администратор ограничил доступ к этому аккаунту. Сохранять работы в облако нельзя.', 'au.blocked.reason': 'Причина: {n}'
        },
        en: {
            'au.sub.new.c': 'Choose a login and a password. Use them on any device: your jobs are kept in the cloud and follow you everywhere.',
            'au.sub.in.c': 'Enter your login and password. Your jobs will load from the cloud.',
            'au.sub.del.c': 'The account “{n}” and all its jobs will be deleted from the cloud and from this device for good. Enter your password to confirm.',
            'au.note.c': 'Your account and jobs are kept in the cloud. The password cannot be recovered, so remember it.',
            'au.e.pass6': 'Password: at least 6 characters',
            'au.e.net': 'No connection to the server. Check the internet and try again.',
            'au.e.rate': 'Too many attempts. Wait a minute.',
            'au.e.blocked': 'This account has been blocked by the administrator.',
            'au.e.confirm': 'Email confirmation is on in the database. Turn off “Confirm email” in Supabase (see SETUP-SUPABASE.txt).',
            'au.e.closed': 'Sign-ups are turned off.',
            'au.e.server': 'Server error. Try again later.',
            'au.title.imp': 'Move jobs here', 'au.sub.imp': 'Enter the login and password of the old profile on this device (from the version without the cloud): its jobs will be added to the current account.',
            'au.btn.imp': 'Move jobs', 'au.toast.imp': 'Jobs moved: {n}',
            'au.m.edit': 'My profile', 'au.m.admin': 'Admin panel', 'au.m.import': 'Move jobs from this device', 'au.m.del.c': 'Delete account',
            'au.sync.conf': 'Jobs changed on another device, and this one has unsaved edits. Which to keep?',
            'au.sync.cloud': 'Use the cloud', 'au.sync.mine': 'Keep mine',
            'au.sync.newer': 'Jobs were updated on another device. Load the latest?', 'au.sync.load': 'Load',
            'au.sync.wait': 'Loading your jobs…',
            'au.blocked.title': 'Account blocked', 'au.blocked.sub': 'The administrator has restricted access to this account. Jobs cannot be saved to the cloud.', 'au.blocked.reason': 'Reason: {n}'
        },
        uz: {
            'au.sub.new.c': 'Login va parol o‘ylab toping. Ular bilan istalgan qurilmadan kirasiz: ishlar bulutda saqlanadi va hamma joyda bo‘ladi.',
            'au.sub.in.c': 'Login va parolni kiriting. Ishlaringiz bulutdan yuklanadi.',
            'au.sub.del.c': '«{n}» akkaunti va uning barcha ishlari bulutdan va bu qurilmadan butunlay o‘chiriladi. Tasdiqlash uchun parolni kiriting.',
            'au.note.c': 'Akkaunt va ishlar bulutda saqlanadi. Parolni tiklab bo‘lmaydi, uni eslab qoling.',
            'au.e.pass6': 'Parol: kamida 6 belgi',
            'au.e.net': 'Server bilan aloqa yo‘q. Internetni tekshirib, qayta urinib ko‘ring.',
            'au.e.rate': 'Urinishlar juda ko‘p. Bir daqiqa kuting.',
            'au.e.blocked': 'Bu akkaunt administrator tomonidan bloklangan.',
            'au.e.confirm': 'Bazada pochtani tasdiqlash yoqilgan. Supabase’da «Confirm email» ni o‘chiring (SETUP-SUPABASE.txt).',
            'au.e.closed': 'Ro‘yxatdan o‘tish o‘chirilgan.',
            'au.e.server': 'Server xatosi. Keyinroq urinib ko‘ring.',
            'au.title.imp': 'Ishlarni ko‘chirish', 'au.sub.imp': 'Shu qurilmadagi eski profilning (bulutsiz versiyadan) login va parolini kiriting: uning ishlari joriy akkauntga qo‘shiladi.',
            'au.btn.imp': 'Ko‘chirish', 'au.toast.imp': 'Ko‘chirilgan ishlar: {n}',
            'au.m.edit': 'Mening profilim', 'au.m.admin': 'Admin paneli', 'au.m.import': 'Shu qurilmadagi ishlarni ko‘chirish', 'au.m.del.c': 'Akkauntni o‘chirish',
            'au.sync.conf': 'Ishlar boshqa qurilmada o‘zgargan, bu qurilmada esa saqlanmagan o‘zgarishlar bor. Qaysi birini qoldiramiz?',
            'au.sync.cloud': 'Bulutdagisini olish', 'au.sync.mine': 'Meniki qolsin',
            'au.sync.newer': 'Boshqa qurilmada ishlar yangilangan. Yangisini yuklaymizmi?', 'au.sync.load': 'Yuklash',
            'au.sync.wait': 'Ishlaringiz yuklanmoqda…',
            'au.blocked.title': 'Akkaunt bloklangan', 'au.blocked.sub': 'Administrator bu akkauntga kirishni cheklagan. Ishlarni bulutga saqlab bo‘lmaydi.', 'au.blocked.reason': 'Sabab: {n}'
        }
    };
    ['ru', 'en', 'uz'].forEach(function (l) { for (var k in T[l]) X[l][k] = T[l][k]; });
})();
