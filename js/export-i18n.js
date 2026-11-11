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
