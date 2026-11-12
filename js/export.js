/* Экспорт файлов без библиотек: настоящий Excel (.xlsx), картинки PNG, один PDF и ZIP.
   Всё открывается на телефоне без дополнительных программ: Excel и таблицы Google читают .xlsx, а PDF и PNG открывает любая галерея.
   Тексты в .xlsx хранятся в UTF-8, поэтому вместо «иероглифов» всегда нормальные буквы. */
(function () {
    'use strict';

    var enc = new TextEncoder();

    /* ---------- ZIP (без сжатия) ---------- */
    var CRC_T = (function () {
        var tb = new Uint32Array(256);
        for (var n = 0; n < 256; n++) { var c = n; for (var k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1); tb[n] = c >>> 0; }
        return tb;
    })();
    function crc32(u8) {
        var c = 0xFFFFFFFF;
        for (var i = 0; i < u8.length; i++) c = CRC_T[(c ^ u8[i]) & 255] ^ (c >>> 8);
        return (c ^ 0xFFFFFFFF) >>> 0;
    }
    /* files: [{name, text | data(Uint8Array)}] */
    function zip(files, mime) {
        var parts = [], central = [], offset = 0, d = new Date();
        var dt = (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1);
        var dd = ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();
        files.forEach(function (f) {
            var name = enc.encode(f.name), data = f.data || enc.encode(f.text), crc = crc32(data);
            var lh = new DataView(new ArrayBuffer(30));
            lh.setUint32(0, 0x04034b50, true); lh.setUint16(4, 20, true); lh.setUint16(6, 0x0800, true); lh.setUint16(8, 0, true);
            lh.setUint16(10, dt, true); lh.setUint16(12, dd, true); lh.setUint32(14, crc, true);
            lh.setUint32(18, data.length, true); lh.setUint32(22, data.length, true); lh.setUint16(26, name.length, true); lh.setUint16(28, 0, true);
            parts.push(new Uint8Array(lh.buffer), name, data);
            var ch = new DataView(new ArrayBuffer(46));
            ch.setUint32(0, 0x02014b50, true); ch.setUint16(4, 20, true); ch.setUint16(6, 20, true); ch.setUint16(8, 0x0800, true); ch.setUint16(10, 0, true);
            ch.setUint16(12, dt, true); ch.setUint16(14, dd, true); ch.setUint32(16, crc, true);
            ch.setUint32(20, data.length, true); ch.setUint32(24, data.length, true); ch.setUint16(28, name.length, true);
            ch.setUint32(42, offset, true);
            central.push(new Uint8Array(ch.buffer), name);
            offset += 30 + name.length + data.length;
        });
        var csize = 0;
        central.forEach(function (c) { csize += c.length; });
        var end = new DataView(new ArrayBuffer(22));
        end.setUint32(0, 0x06054b50, true); end.setUint16(8, files.length, true); end.setUint16(10, files.length, true);
        end.setUint32(12, csize, true); end.setUint32(16, offset, true);
        return new Blob(parts.concat(central, [new Uint8Array(end.buffer)]), { type: mime || 'application/zip' });
    }

    /* ---------- Excel (.xlsx) ---------- */
    function xe(s) {
        return String(s == null ? '' : s)
            .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F￾￿]/g, '')
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }
    function colName(i) {
        var s = '';
        i++;
        while (i > 0) { var m = (i - 1) % 26; s = String.fromCharCode(65 + m) + s; i = Math.floor((i - 1) / 26); }
        return s;
    }
    function sheetName(raw, used) {
        var n = String(raw || 'Лист').replace(/[\\\/?*\[\]:]/g, '-').replace(/^'+|'+$/g, '').trim().slice(0, 31) || 'Лист';
        var base = n, k = 2;
        while (used[n.toLowerCase()]) { var suf = ' ' + (k++); n = base.slice(0, 31 - suf.length) + suf; }
        used[n.toLowerCase()] = 1;
        return n;
    }
    /* sheets: [{name, rows: [[...]], widths?: [число, ...]}]. Первая строка считается заголовком (жирная, закреплена). */
    function xlsx(sheets) {
        var used = {}, files = [], names = [];
        sheets.forEach(function (sh, si) {
            names.push(sheetName(sh.name, used));
            var rows = sh.rows || [], maxCols = 0;
            rows.forEach(function (r) { if (r.length > maxCols) maxCols = r.length; });
            var widths = [];
            for (var c = 0; c < maxCols; c++) {
                var w = sh.widths && sh.widths[c];
                if (!w) {
                    w = 6;
                    for (var r = 0; r < rows.length; r++) { var v = rows[r][c]; if (v != null) w = Math.max(w, Math.min(48, String(v).length + 3)); }
                }
                widths.push(w);
            }
            var x = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
                '<sheetViews><sheetView workbookViewId="0"' + (si === 0 ? ' tabSelected="1"' : '') + '>' +
                (rows.length > 1 ? '<pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/>' : '') + '</sheetView></sheetViews>' +
                '<sheetFormatPr defaultRowHeight="15"/>' +
                (maxCols ? '<cols>' + widths.map(function (w, i) { return '<col min="' + (i + 1) + '" max="' + (i + 1) + '" width="' + w + '" customWidth="1"/>'; }).join('') + '</cols>' : '') +
                '<sheetData>';
            rows.forEach(function (row, ri) {
                x += '<row r="' + (ri + 1) + '">';
                row.forEach(function (v, ci) {
                    if (v == null || v === '') return;
                    var ref = colName(ci) + (ri + 1), st = ri === 0 ? ' s="1"' : '';
                    if (typeof v === 'number' && isFinite(v)) x += '<c r="' + ref + '"' + st + '><v>' + v + '</v></c>';
                    else x += '<c r="' + ref + '"' + st + ' t="inlineStr"><is><t xml:space="preserve">' + xe(v) + '</t></is></c>';
                });
                x += '</row>';
            });
            x += '</sheetData></worksheet>';
            files.push({ name: 'xl/worksheets/sheet' + (si + 1) + '.xml', text: x });
        });
        var ct = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
            '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/>' +
            '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' +
            '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>' +
            sheets.map(function (s, i) { return '<Override PartName="/xl/worksheets/sheet' + (i + 1) + '.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>'; }).join('') +
            '</Types>';
        var rels = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
            '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>';
        var wb = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">' +
            '<bookViews><workbookView activeTab="0"/></bookViews><sheets>' +
            names.map(function (n, i) { return '<sheet name="' + xe(n) + '" sheetId="' + (i + 1) + '" r:id="rId' + (i + 1) + '"/>'; }).join('') + '</sheets></workbook>';
        var wbrels = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
            sheets.map(function (s, i) { return '<Relationship Id="rId' + (i + 1) + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet' + (i + 1) + '.xml"/>'; }).join('') +
            '<Relationship Id="rId' + (sheets.length + 1) + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>';
        var styles = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
            '<fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts>' +
            '<fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FFE8EEF8"/><bgColor indexed="64"/></patternFill></fill></fills>' +
            '<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>' +
            '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>' +
            '<cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1" applyAlignment="1"><alignment vertical="center" wrapText="1"/></xf></cellXfs>' +
            '<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>';
        files.unshift(
            { name: '[Content_Types].xml', text: ct }, { name: '_rels/.rels', text: rels },
            { name: 'xl/workbook.xml', text: wb }, { name: 'xl/_rels/workbook.xml.rels', text: wbrels }, { name: 'xl/styles.xml', text: styles }
        );
        return zip(files, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    }

    /* ---------- Картинки ---------- */
    function loadImage(src) {
        return new Promise(function (resolve, reject) {
            var im = new Image();
            im.onload = function () { resolve(im); };
            im.onerror = function () { reject(new Error('image')); };
            im.src = src;
        });
    }
    /* SVG-текст в canvas заданной ширины (белый фон) */
    function svgToCanvas(svg, width) {
        var m = /viewBox="([^"]+)"/.exec(svg);
        if (!m) return Promise.reject(new Error('viewBox'));
        var vb = m[1].trim().split(/\s+/).map(Number);
        var w = Math.round(width), h = Math.max(1, Math.round(width * vb[3] / vb[2]));
        var s = svg.replace(/<\?xml[^>]*\?>\s*/, '').replace(/<link\b[^>]*\/>/g, '')
            .replace(/<svg\b[^>]*>/, function (tag) {
                /* свои width/height у корня убираем, иначе атрибуты повторятся и картинка не откроется */
                return tag.replace(/\s(?:width|height)="[^"]*"/g, '').replace(/^<svg/, '<svg width="' + w + '" height="' + h + '"');
            });
        return loadImage('data:image/svg+xml;charset=utf-8,' + encodeURIComponent(s)).then(function (im) {
            var c = document.createElement('canvas'); c.width = w; c.height = h;
            var x = c.getContext('2d');
            x.fillStyle = '#ffffff'; x.fillRect(0, 0, w, h);
            x.drawImage(im, 0, 0, w, h);
            return c;
        });
    }
    function toBlob(canvas, type, q) {
        return new Promise(function (resolve, reject) {
            canvas.toBlob(function (b) { if (b) resolve(b); else reject(new Error('blob')); }, type, q);
        });
    }

    /* ---------- PDF из картинок страниц ---------- */
    function ascii(s) { return enc.encode(s); }
    function hex16(s) {
        var out = 'FEFF';
        for (var i = 0; i < s.length; i++) out += ('0000' + s.charCodeAt(i).toString(16)).slice(-4);
        return '<' + out + '>';
    }
    /* pages: [{jpeg: Uint8Array, w, h (в пикселях)}]; размер страницы A4 по ширине/высоте картинки */
    function buildPdf(pages, title) {
        var chunks = [], pos = 0, offs = [];
        function put(x) { var u = typeof x === 'string' ? ascii(x) : x; chunks.push(u); pos += u.length; }
        function obj(n, body) { offs[n] = pos; put(n + ' 0 obj\n'); put(body); put('\nendobj\n'); }
        var n = pages.length;
        put('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n');
        obj(1, '<< /Type /Catalog /Pages 2 0 R >>');
        var kids = [];
        for (var i = 0; i < n; i++) kids.push((4 + i * 3) + ' 0 R');
        obj(2, '<< /Type /Pages /Count ' + n + ' /Kids [' + kids.join(' ') + '] >>');
        obj(3, '<< /Title ' + hex16(title || '') + ' /Producer (Raskroy) >>');
        pages.forEach(function (p, i) {
            var pg = 4 + i * 3, ct = pg + 1, im = pg + 2;
            var pw = 595.28, ph = +(pw * p.h / p.w).toFixed(2);
            obj(pg, '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ' + pw + ' ' + ph + '] /Contents ' + ct + ' 0 R /Resources << /XObject << /Im0 ' + im + ' 0 R >> >> >>');
            var cs = 'q ' + pw + ' 0 0 ' + ph + ' 0 0 cm /Im0 Do Q';
            obj(ct, '<< /Length ' + cs.length + ' >>\nstream\n' + cs + '\nendstream');
            offs[im] = pos;
            put(im + ' 0 obj\n<< /Type /XObject /Subtype /Image /Width ' + p.w + ' /Height ' + p.h + ' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ' + p.jpeg.length + ' >>\nstream\n');
            put(p.jpeg); put('\nendstream\nendobj\n');
        });
        var total = 3 + n * 3, xref = pos;
        put('xref\n0 ' + (total + 1) + '\n0000000000 65535 f \n');
        for (var k = 1; k <= total; k++) put(('0000000000' + offs[k]).slice(-10) + ' 00000 n \n');
        put('trailer\n<< /Size ' + (total + 1) + ' /Root 1 0 R /Info 3 0 R >>\nstartxref\n' + xref + '\n%%EOF');
        return new Blob(chunks, { type: 'application/pdf' });
    }

    /* ---------- Страницы отчёта (A4 при 150 dpi), рисуются в canvas ---------- */
    var PW = 1240, PH = 1754, PM = 84;
    var FONT = 'Inter, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
    function Doc(opts) {
        opts = opts || {};
        this.pages = [];
        this.footer = opts.footer || '';
        this.title = opts.title || '';
        this.cv = null; this.cx = null; this.y = 0;
        this.newPage();
    }
    Doc.prototype.newPage = function () {
        var c = document.createElement('canvas'); c.width = PW; c.height = PH;
        var x = c.getContext('2d');
        x.fillStyle = '#ffffff'; x.fillRect(0, 0, PW, PH);
        x.textBaseline = 'alphabetic';
        this.cv = c; this.cx = x; this.y = PM;
        this.pages.push(c);
        /* нижний колонтитул: название и номер страницы */
        x.fillStyle = '#8a93a6'; x.font = '400 22px ' + FONT;
        x.textAlign = 'left'; x.fillText(this.footer, PM, PH - 44);
        x.textAlign = 'right'; x.fillText(String(this.pages.length), PW - PM, PH - 44);
        x.textAlign = 'left';
    };
    Doc.prototype.room = function () { return PH - PM - 60 - this.y; };
    Doc.prototype.ensure = function (h) { if (this.room() < h) this.newPage(); };
    Doc.prototype.space = function (h) { this.y += h; };
    Doc.prototype.fit = function (str, maxW) {
        var x = this.cx;
        str = String(str == null ? '' : str);
        if (x.measureText(str).width <= maxW) return str;
        while (str.length > 1 && x.measureText(str + '…').width > maxW) str = str.slice(0, -1);
        return str + '…';
    };
    Doc.prototype.text = function (str, o) {
        o = o || {};
        var size = o.size || 28, lh = o.lh || Math.round(size * 1.4), self = this;
        var font = (o.weight || 400) + ' ' + size + 'px ' + FONT;
        /* перенос длинных строк по словам (мерим на текущей странице) */
        self.cx.font = font;
        var maxW = PW - 2 * PM, words = String(str == null ? '' : str).split(/\s+/), line = '', lines = [];
        words.forEach(function (w) {
            var t = line ? line + ' ' + w : w;
            if (self.cx.measureText(t).width > maxW && line) { lines.push(line); line = w; } else line = t;
        });
        if (line) lines.push(line);
        lines.forEach(function (l) {
            self.ensure(lh);
            self.cx.font = font; self.cx.fillStyle = o.color || '#151a26';
            self.cx.fillText(l, PM, self.y + size);
            self.y += lh;
        });
    };
    Doc.prototype.h1 = function (s) { this.text(s, { size: 46, weight: 700, lh: 62 }); };
    Doc.prototype.h2 = function (s) { this.space(10); this.text(s, { size: 32, weight: 700, lh: 44 }); };
    Doc.prototype.muted = function (s) { this.text(s, { size: 24, color: '#5b6478', lh: 34 }); };
    /* cols: [{label, w (доля), align}], rows: [[...]] ; каждая строка в одну линию с «…» */
    Doc.prototype.table = function (cols, rows, o) {
        o = o || {};
        var size = o.size || 24, rh = o.rh || 40, self = this, totalW = PW - 2 * PM;
        var sum = 0; cols.forEach(function (c) { sum += c.w; });
        var xs = [], acc = PM;
        cols.forEach(function (c) { xs.push(acc); acc += totalW * c.w / sum; });
        function head() {
            var x = self.cx;
            x.fillStyle = '#eaf0fa'; x.fillRect(PM, self.y, totalW, rh);
            x.font = '600 ' + size + 'px ' + FONT; x.fillStyle = '#26314a';
            cols.forEach(function (c, i) {
                var cw = totalW * c.w / sum - 20;
                x.textAlign = c.align === 'right' ? 'right' : 'left';
                x.fillText(self.fit(c.label, cw), c.align === 'right' ? xs[i] + cw + 10 : xs[i] + 10, self.y + rh * 0.68);
            });
            x.textAlign = 'left';
            self.y += rh;
        }
        this.ensure(rh * 3);
        head();
        rows.forEach(function (r, ri) {
            if (self.room() < rh) { self.newPage(); head(); }
            var x = self.cx;
            if (ri % 2) { x.fillStyle = '#f6f8fc'; x.fillRect(PM, self.y, totalW, rh); }
            x.font = '400 ' + size + 'px ' + FONT; x.fillStyle = '#151a26';
            cols.forEach(function (c, i) {
                var cw = totalW * c.w / sum - 20;
                x.textAlign = c.align === 'right' ? 'right' : 'left';
                x.fillText(self.fit(r[i], cw), c.align === 'right' ? xs[i] + cw + 10 : xs[i] + 10, self.y + rh * 0.68);
            });
            x.textAlign = 'left';
            self.y += rh;
        });
        this.y += 12;
    };
    /* картинка (canvas) по ширине страницы, но не выше maxH */
    Doc.prototype.image = function (cv, maxH) {
        var w = PW - 2 * PM, h = w * cv.height / cv.width;
        maxH = maxH || 900;
        if (h > maxH) { h = maxH; w = h * cv.width / cv.height; }
        this.ensure(h + 10);
        this.cx.drawImage(cv, PM + ((PW - 2 * PM) - w) / 2, this.y, w, h);
        this.y += h + 18;
    };
    Doc.prototype.pageBreak = function () { if (this.y > PM + 4) this.newPage(); };
    Doc.prototype.blob = async function () {
        var out = [];
        for (var i = 0; i < this.pages.length; i++) {
            var jb = await toBlob(this.pages[i], 'image/jpeg', 0.9);
            out.push({ jpeg: new Uint8Array(await jb.arrayBuffer()), w: PW, h: PH });
            await new Promise(function (r) { setTimeout(r, 0); });   /* не держим экран */
        }
        return buildPdf(out, this.title);
    };

    /* ---------- Сохранение ---------- */
    function download(name, blob) {
        var a = document.createElement('a');
        a.href = URL.createObjectURL(blob); a.download = name;
        document.body.appendChild(a); a.click();
        setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
    }
    function tr(key, fb) {
        try { var v = window.RKI18N && window.RKI18N.t ? window.RKI18N.t(key) : ''; return v && v !== key ? v : fb; } catch (e) { return fb; }
    }
    function sizeText(n) { return n < 1048576 ? Math.max(1, Math.round(n / 1024)) + ' ' + tr('x.kb', 'КБ') : (n / 1048576).toFixed(1).replace('.', ',') + ' ' + tr('x.mb', 'МБ'); }
    function isPhone() {
        try { return window.matchMedia('(hover: none) and (pointer: coarse)').matches; } catch (e) { return false; }
    }
    function mkFile(name, blob) {
        try { return new File([blob], name, { type: blob.type || 'application/octet-stream' }); } catch (e) { return null; }
    }
    function canShareFile(file) {
        try { return !!(file && navigator.share && navigator.canShare && navigator.canShare({ files: [file] })); } catch (e) { return false; }
    }
    var offerEl = null;
    function closeOffer() { if (offerEl) { offerEl.remove(); offerEl = null; document.documentElement.classList.remove('rkx-lock'); } }
    /* На телефоне вместо системного окна «Загрузка завершена» показываем своё окно «Файл готов»:
       «Поделиться» открывает обычное меню Android (Telegram, Файлы, почта), «Сохранить» скачивает файл. */
    function offer(name, blob, file) {
        closeOffer();
        var tt = document.querySelector('.rk-toast'); if (tt) tt.classList.remove('is-on');
        var ext = (name.split('.').pop() || '').toUpperCase();
        var wrap = document.createElement('div'); wrap.className = 'rkx-wrap'; wrap.setAttribute('role', 'dialog'); wrap.setAttribute('aria-modal', 'true');
        wrap.innerHTML = '<div class="rkx-card"><div class="rkx-ico"><span></span></div><div class="rkx-h"></div><div class="rkx-n"></div><div class="rkx-m"></div>' +
            '<button type="button" class="rk-btn rk-btn--main rkx-share"></button>' +
            '<button type="button" class="rk-btn rk-btn--ghost rkx-save"></button>' +
            '<button type="button" class="rkx-close"></button></div>';
        var q = function (c) { return wrap.querySelector(c); };
        q('.rkx-ico span').textContent = ext;
        q('.rkx-h').textContent = tr('x.ready', 'Файл готов');
        q('.rkx-n').textContent = name;
        q('.rkx-m').textContent = sizeText(blob.size);
        q('.rkx-share').textContent = tr('x.share', 'Поделиться или отправить');
        q('.rkx-save').textContent = tr('x.savephone', 'Сохранить на телефон');
        q('.rkx-close').textContent = tr('x.close', 'Закрыть');
        q('.rkx-share').addEventListener('click', function () {
            navigator.share({ files: [file], title: name }).then(closeOffer, function (e) {
                if (e && e.name === 'AbortError') return;
                download(name, blob); closeOffer();
            });
        });
        q('.rkx-save').addEventListener('click', function () { download(name, blob); closeOffer(); });
        q('.rkx-close').addEventListener('click', closeOffer);
        wrap.addEventListener('click', function (e) { if (e.target === wrap) closeOffer(); });
        document.body.appendChild(wrap);
        document.documentElement.classList.add('rkx-lock');
        offerEl = wrap;
        try { q('.rkx-share').focus({ preventScroll: true }); } catch (e) { /* не страшно */ }
    }
    function save(name, blob) {
        var file = isPhone() ? mkFile(name, blob) : null;
        if (file && canShareFile(file)) { offer(name, blob, file); return; }
        download(name, blob);
    }
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && offerEl) closeOffer(); });
    function fontsReady() {
        try {
            if (document.fonts && document.fonts.load) {
                return Promise.all([document.fonts.load('400 24px Inter'), document.fonts.load('600 24px Inter'), document.fonts.load('700 24px Inter')]).catch(function () { /* шрифт не обязателен */ });
            }
        } catch (e) { /* без шрифтов обойдёмся */ }
        return Promise.resolve();
    }

    /* Несколько файлов сразу. Телефон: одно меню «Поделиться» со всеми картинками (оттуда — в Галерею, Telegram...).
       Компьютер или если меню нет: файлы скачиваются по очереди. */
    function saveMany(files) {
        function seq() { files.forEach(function (f, i) { setTimeout(function () { download(f.name, f.blob); }, i * 400); }); }
        if (isPhone()) {
            var fs = files.map(function (f) { return mkFile(f.name, f.blob); });
            var ok = fs.every(Boolean);
            try { ok = ok && navigator.share && navigator.canShare && navigator.canShare({ files: fs }); } catch (e) { ok = false; }
            if (ok) {
                navigator.share({ files: fs }).catch(function (e) { if (e && e.name === 'AbortError') return; seq(); });
                return;
            }
        }
        seq();
    }
    window.RKExport = { saveMany: saveMany, download: download, zip: zip, xlsx: xlsx, svgToCanvas: svgToCanvas, toBlob: toBlob, Doc: Doc, save: save, offering: function () { return !!offerEl; }, fontsReady: fontsReady, crc32: crc32, FONT: FONT };
})();
