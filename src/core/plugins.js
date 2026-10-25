window.YapCord = window.YapCord || {};
(function (YC) {
  "use strict";

  var specs = new Map();
  var running = new Map();

  YC.plugins = specs;

  YC.registerPlugin = function (spec) {
    if (!spec || !spec.id || !spec.name) throw new Error("YapCord: plugin needs id and name");
    specs.set(spec.id, spec);
    if (YC.store && YC.store.loaded) seed(spec.id, spec);
    return spec;
  };

  function seed(id, spec) {
    if (YC.store.cfg.plugins[id] === undefined) YC.store.cfg.plugins[id] = spec.defaultEnabled !== false;
    YC.store.plugin(id);
  }

  YC.enabled = function (id) {
    if (!YC.store) return false;
    if (YC.store.get("master", true) === false) return false;
    var spec = specs.get(id);
    var flag = YC.store.get("plugins." + id, spec ? spec.defaultEnabled !== false : false);
    return !!flag;
  };

  function makeCtx(id) {
    var spec = specs.get(id);
    var bag = { styles: [], observers: [], timers: [], cleanups: [] };

    var ctx = {
      id: id,
      spec: spec,
      settings: function () { return YC.store.plugin(id); },
      get: function (k, fb) { var s = YC.store.plugin(id); return s[k] === undefined ? fb : s[k]; },
      set: function (k, v) {
        var s = YC.store.plugin(id);
        s[k] = v;
        YC.store.save();
        YC.bus.emit("plugin-settings", { id: id, key: k, value: v });
      },
      on: function (evt, fn) { var off = YC.bus.on(evt, fn); bag.cleanups.push(off); return off; },
      off: YC.bus.off,
      api: YC.api,
      h: YC.ui.h,
      esc: YC.ui.esc,
      toast: YC.ui.toast,
      confirm: YC.ui.confirm,
      copy: YC.ui.copy,
      openModal: YC.ui.openModal,
      sleep: YC.ui.sleep,
      download: YC.ui.download,
      send: YC.send,
      page: YC.page,

      css: function (text, name) {
        var el = document.createElement("style");
        el.setAttribute("data-yc-plugin", id + (name ? "-" + name : ""));
        el.textContent = text || "";
        (document.head || document.documentElement).appendChild(el);
        bag.styles.push(el);
        return function () { var i = bag.styles.indexOf(el); if (i >= 0) bag.styles.splice(i, 1); el.remove(); };
      },

      observe: function (target, cb, opts) {
        var mo = new MutationObserver(cb);
        mo.observe(target, opts || { childList: true, subtree: true });
        bag.observers.push(mo);
        return mo;
      },

      interval: function (fn, ms) {
        var t = setInterval(fn, ms);
        bag.timers.push({ type: "i", handle: t });
        return t;
      },
      timeout: function (fn, ms) {
        var t = setTimeout(fn, ms);
        bag.timers.push({ type: "t", handle: t });
        return t;
      },
      onDispose: function (fn) { bag.cleanups.push(fn); }
    };

    bag.ctx = ctx;
    return bag;
  }

  YC.startPlugin = function (id) {
    if (running.has(id)) return false;
    var spec = specs.get(id);
    if (!spec) return false;
    var bag = makeCtx(id);
    running.set(id, bag);
    try { spec.start(bag.ctx); }
    catch (e) { console.error("[YapCord] failed to start " + id, e); }
    YC.bus.emit("plugin-toggled", { id: id, on: true });
    return true;
  };

  YC.stopPlugin = function (id) {
    var bag = running.get(id);
    if (!bag) return false;
    running.delete(id);
    try { if (bag.ctx.spec.stop) bag.ctx.spec.stop(bag.ctx); }
    catch (e) { console.error("[YapCord] failed to stop " + id, e); }
    bag.styles.forEach(function (el) { try { el.remove(); } catch (e) {} });
    bag.observers.forEach(function (mo) { try { mo.disconnect(); } catch (e) {} });
    bag.timers.forEach(function (t) { try { t.type === "i" ? clearInterval(t.handle) : clearTimeout(t.handle); } catch (e) {} });
    bag.cleanups.forEach(function (fn) { try { fn(); } catch (e) {} });
    YC.bus.emit("plugin-toggled", { id: id, on: false });
    return true;
  };

  YC.isRunning = function (id) { return running.has(id); };

  YC.syncPlugins = function () {
    specs.forEach(function (spec, id) {
      if (YC.enabled(id)) YC.startPlugin(id);
      else YC.stopPlugin(id);
    });
  };

  YC.seedPlugins = function () {
    specs.forEach(function (spec, id) { seed(id, spec); });
  };
})(window.YapCord);
