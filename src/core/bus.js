window.YapCord = window.YapCord || {};
(function (YC) {
  "use strict";

  YC.VERSION = "1.1.2";
  YC.NAME = "YapCord";

  var handlers = Object.create(null);

  YC.bus = {
    on: function (evt, fn) {
      (handlers[evt] = handlers[evt] || []).push(fn);
      return function () { YC.bus.off(evt, fn); };
    },
    off: function (evt, fn) {
      var list = handlers[evt];
      if (!list) return;
      var i = list.indexOf(fn);
      if (i >= 0) list.splice(i, 1);
    },
    emit: function (evt, data) {
      var list = handlers[evt];
      if (!list) return;
      list.slice().forEach(function (fn) {
        try { fn(data); } catch (e) { console.warn("[YapCord] handler failed for", evt, e); }
      });
    }
  };

  YC.send = function (msg) {
    try { window.postMessage(Object.assign({ yc: 1, dir: "cmd" }, msg), "*"); } catch (e) {}
  };

  YC.runtimeURL = function (path) {
    try { return chrome.runtime.getURL(path); } catch (e) { return path; }
  };

  window.addEventListener("message", function (e) {
    if (e.source !== window) return;
    var d = e.data;
    if (!d || d.yc !== 1 || d.dir === "cmd") return;
    YC.bus.emit("main:" + d.t, d);
    if (d.t === "api" && d.action) YC.bus.emit("api:" + d.action, d);
  });
})(window.YapCord);
