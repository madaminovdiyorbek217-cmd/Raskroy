/* Считает раскрой в фоне, чтобы страница не зависала. */
importScripts('raskroy-core.js?v=19');
onmessage = function (e) {
    var d = e.data;
    try { postMessage({ id: d.id, res: Raskroy.optimize(d.cfg) }); }
    catch (err) { postMessage({ id: d.id, error: String(err && err.message || err) }); }
};
