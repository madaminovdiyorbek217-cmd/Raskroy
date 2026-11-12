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
